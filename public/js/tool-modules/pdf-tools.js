const MODULE_VERSION="2026.09.19.12";
const PDF_LIB_URL="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js";
const PDFJS_URL="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs";
const JSZIP_URL="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
const MAX_FILE_BYTES=25*1024*1024;
const MAX_TOTAL_BYTES=100*1024*1024;
const MAX_FILES=20;
let pdfLibPromise,pdfJsPromise,zipPromise;

function loadPdfLib(){if(!pdfLibPromise)pdfLibPromise=new Promise((resolve,reject)=>{if(window.PDFLib)return resolve(window.PDFLib);const s=document.createElement("script");s.src=PDF_LIB_URL;s.onload=()=>window.PDFLib?resolve(window.PDFLib):reject(new Error("PDF engine unavailable"));s.onerror=()=>reject(new Error("Could not load PDF engine"));document.head.appendChild(s)});return pdfLibPromise}
function loadPdfJs(){if(!pdfJsPromise)pdfJsPromise=import(PDFJS_URL).then(m=>{if(m.GlobalWorkerOptions)m.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";return m});return pdfJsPromise}
function loadZip(){if(!zipPromise)zipPromise=new Promise((resolve,reject)=>{if(window.JSZip)return resolve(window.JSZip);const s=document.createElement("script");s.src=JSZIP_URL;s.onload=()=>window.JSZip?resolve(window.JSZip):reject(new Error("ZIP engine unavailable"));s.onerror=()=>reject(new Error("Could not load ZIP engine"));document.head.appendChild(s)});return zipPromise}
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const imageTypes={jpg:["image/jpeg",".jpg",".jpeg"],png:["image/png",".png"]};

function validateFiles(files,kind){
  if(!files.length)throw new Error("একটি ফাইল নির্বাচন করুন");
  if(files.length>MAX_FILES)throw new Error("সর্বোচ্চ "+MAX_FILES+"টি ফাইল একসঙ্গে দেওয়া যাবে");
  const total=files.reduce((n,f)=>n+f.size,0);
  if(files.some(f=>f.size>MAX_FILE_BYTES))throw new Error("প্রতিটি ফাইল সর্বোচ্চ 25 MB হতে পারবে");
  if(total>MAX_TOTAL_BYTES)throw new Error("সব ফাইল মিলিয়ে সর্বোচ্চ 100 MB হতে পারবে");
  if(kind==="pdf"&&files.some(f=>f.type!=="application/pdf"&&!/\.pdf$/i.test(f.name)))throw new Error("শুধু PDF ফাইল দিন");
  if(kind==="jpg"&&files.some(f=>f.type!=="image/jpeg"&&!/\.(jpe?g)$/i.test(f.name)))throw new Error("শুধু JPG/JPEG ফাইল দিন");
  if(kind==="png"&&files.some(f=>f.type!=="image/png"&&!/\.png$/i.test(f.name)))throw new Error("শুধু PNG ফাইল দিন");
}

function parsePageRange(value,count){
  const raw=String(value||"").trim();
  if(!raw)return Array.from({length:count},(_,i)=>i);
  const set=new Set();
  for(const part of raw.split(",")){
    const p=part.trim();
    if(/^\d+$/.test(p)){const n=Number(p);if(n<1||n>count)throw new Error("Page range-এর সংখ্যা PDF-এর বাইরে");set.add(n-1);continue}
    const m=p.match(/^(\d+)\s*-\s*(\d+)$/);
    if(!m)throw new Error("Page range format: 1-3,5,7");
    let a=Number(m[1]),b=Number(m[2]);if(a>b)[a,b]=[b,a];
    if(a<1||b>count)throw new Error("Page range-এর সংখ্যা PDF-এর বাইরে");
    for(let i=a;i<=b;i++)set.add(i-1);
  }
  return [...set].sort((a,b)=>a-b);
}

export function render({tool}){
  const imageId=tool.id==="jpg-to-pdf"?"jpg":tool.id==="png-to-pdf"?"png":null;
  const accept=imageId?imageTypes[imageId].join(","):"application/pdf,.pdf";
  const multiple=["jpg-to-pdf","png-to-pdf","merge-pdf"].includes(tool.id);
  const range=["split-pdf","extract-pdf-pages","delete-pdf-pages","rotate-pdf"].includes(tool.id);
  return '<div class="tool-form"><div class="tool-toolbar"><span class="tool-toolbar-title">'+esc(tool.bn||tool.name)+'</span><div class="tool-actions"><button class="tool-action" id="pdfRun" type="button">প্রসেস করুন</button><button class="tool-action" id="pdfClear" type="button">মুছে ফেলুন</button></div></div><input id="pdfFiles" type="file" accept="'+accept+'"'+(multiple?" multiple":"")+'>'+ (range?'<label style="display:block;margin-top:10px">Page range <input id="pdfRange" type="text" inputmode="numeric" placeholder="যেমন: 1-3,5,7"></label>':'')+(tool.id==="rotate-pdf"?'<label style="display:block;margin-top:10px">Rotation <select id="pdfDegrees"><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select></label>':'')+'<div id="pdfStatus" class="tool-note" aria-live="polite">ফাইল নির্বাচন করুন।</div><div id="pdfPreview" style="margin-top:12px"></div><a id="pdfDownload" class="tool-action" hidden download>ডাউনলোড</a><p class="tool-note">ফাইল আপনার ব্রাউজারেই প্রসেস করা হয়; বড় ফাইলের ক্ষেত্রে সময় বেশি লাগতে পারে।</p></div>'
}

async function imagesToPdf(files){
  const {PDFDocument}=await loadPdfLib(),out=await PDFDocument.create();
  for(const f of files){const b=await f.arrayBuffer(),img=f.type==="image/png"||/\.png$/i.test(f.name)?await out.embedPng(b):await out.embedJpg(b),p=out.addPage([img.width,img.height]);p.drawImage(img,{x:0,y:0,width:img.width,height:img.height})}
  return {bytes:await out.save(),name:"toolkitpro-images.pdf"}
}
async function mergePdf(files){
  const {PDFDocument}=await loadPdfLib(),out=await PDFDocument.create();
  for(const f of files){const src=await PDFDocument.load(await f.arrayBuffer()),pages=await out.copyPages(src,src.getPageIndices());pages.forEach(p=>out.addPage(p))}
  return {bytes:await out.save(),name:"toolkitpro-merged.pdf"}
}
async function pageSubset(file,range){
  const {PDFDocument}=await loadPdfLib(),src=await PDFDocument.load(await file.arrayBuffer()),idx=parsePageRange(range,src.getPageCount()),out=await PDFDocument.create(),pages=await out.copyPages(src,idx);pages.forEach(p=>out.addPage(p));
  return {bytes:await out.save(),name:"toolkitpro-pages.pdf",count:idx.length}
}
async function splitPdf(file,range){
  const {PDFDocument}=await loadPdfLib(),JSZip=await loadZip(),src=await PDFDocument.load(await file.arrayBuffer()),raw=String(range||"").trim(),groups=[];
  if(!raw){for(let i=0;i<src.getPageCount();i++)groups.push([i]);}
  else for(const part of raw.split(",")){const m=part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);if(!m)throw new Error("Split range format: 1-3,5,7");let a=Number(m[1]),b=m[2]?Number(m[2]):a;if(a>b)[a,b]=[b,a];if(a<1||b>src.getPageCount())throw new Error("Page range-এর সংখ্যা PDF-এর বাইরে");groups.push(Array.from({length:b-a+1},(_,i)=>a+i-1))}
  const zip=new JSZip();for(let i=0;i<groups.length;i++){const out=await PDFDocument.create(),pages=await out.copyPages(src,groups[i]);pages.forEach(p=>out.addPage(p));zip.file("part-"+(i+1)+".pdf",await out.save())}
  return {blob:await zip.generateAsync({type:"blob"}),count:groups.length}
}
async function mutatePdf(file,range,mode){
  const {PDFDocument,degrees}=await loadPdfLib(),src=await PDFDocument.load(await file.arrayBuffer()),selected=parsePageRange(range,src.getPageCount());
  if(mode==="delete"){const remove=new Set(selected),out=await PDFDocument.create(),pages=await out.copyPages(src,src.getPageIndices().filter(i=>!remove.has(i)));if(!pages.length)throw new Error("সব page মুছে ফেলা যাবে না");pages.forEach(p=>out.addPage(p));return out.save()}
  const rotation=Number(mode);if(![90,180,270,-90,-180,-270].includes(rotation))throw new Error("Rotation must be 90, 180, or 270 degrees");
  selected.forEach(i=>{const p=src.getPage(i);p.setRotation(degrees((p.getRotation().angle+rotation+360)%360))});return src.save()
}
async function pdfImages(file,type){
  const pdfjs=await loadPdfJs(),doc=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise,out=[];
  for(let i=1;i<=doc.numPages;i++){const p=await doc.getPage(i),v=p.getViewport({scale:1.5}),c=document.createElement("canvas");c.width=Math.ceil(v.width);c.height=Math.ceil(v.height);const ctx=c.getContext("2d",{alpha:false});await p.render({canvasContext:ctx,viewport:v}).promise;const b=await new Promise(r=>c.toBlob(r,type,.9));if(!b)throw new Error("Image export failed");out.push({blob:b,name:"page-"+i+(type==="image/png"?".png":".jpg")})}
  return out
}
async function zipImages(items){const JSZip=await loadZip(),zip=new JSZip();for(const x of items)zip.file(x.name,x.blob);return zip.generateAsync({type:"blob"})}

export async function mount({tool,root}){
  const files=root.querySelector("#pdfFiles"),run=root.querySelector("#pdfRun"),clear=root.querySelector("#pdfClear"),status=root.querySelector("#pdfStatus"),preview=root.querySelector("#pdfPreview"),download=root.querySelector("#pdfDownload"),range=root.querySelector("#pdfRange"),degreesSelect=root.querySelector("#pdfDegrees");
  let objectUrls=[];
  const resetUrls=()=>{objectUrls.forEach(URL.revokeObjectURL);objectUrls=[]};
  const dl=(b,n,t="application/pdf")=>{resetUrls();const u=URL.createObjectURL(new Blob([b],{type:t}));objectUrls.push(u);download.href=u;download.download=n;download.hidden=false};
  run.addEventListener("click",async()=>{
    try{
      resetUrls();download.hidden=true;preview.innerHTML="";const fs=[...(files.files||[])];
      const kind=tool.id==="jpg-to-pdf"?"jpg":tool.id==="png-to-pdf"?"png":"pdf";
      validateFiles(fs,kind);status.textContent="প্রসেস হচ্ছে…";
      if(["jpg-to-pdf","png-to-pdf"].includes(tool.id)){const r=await imagesToPdf(fs);dl(r.bytes,r.name);status.textContent="PDF তৈরি হয়েছে।"}
      else if(tool.id==="merge-pdf"){if(fs.length<2)throw new Error("Merge করতে কমপক্ষে 2টি PDF দিন");const r=await mergePdf(fs);dl(r.bytes,r.name);status.textContent=fs.length+"টি PDF merge হয়েছে।"}
      else if(tool.id==="split-pdf"){if(fs.length!==1)throw new Error("একটি PDF দিন");const r=await splitPdf(fs[0],range?.value),u=URL.createObjectURL(r.blob);objectUrls.push(u);preview.innerHTML='<a class="tool-action" download="toolkitpro-split-pdfs.zip" href="'+u+'">Split করা PDF ZIP ডাউনলোড</a>';status.textContent=r.count+"টি আলাদা PDF তৈরি হয়েছে।"}
      else if(tool.id==="extract-pdf-pages"){if(fs.length!==1)throw new Error("একটি PDF দিন");const r=await pageSubset(fs[0],range?.value);dl(r.bytes,r.name);status.textContent=r.count+"টি page export হয়েছে।"}
      else if(tool.id==="delete-pdf-pages"){if(fs.length!==1)throw new Error("একটি PDF দিন");const r=await mutatePdf(fs[0],range?.value,"delete");dl(r,"toolkitpro-pages-deleted.pdf");status.textContent="নির্বাচিত page মুছে PDF তৈরি হয়েছে।"}
      else if(tool.id==="rotate-pdf"){if(fs.length!==1)throw new Error("একটি PDF দিন");const r=await mutatePdf(fs[0],range?.value,degreesSelect?.value||"90");dl(r,"toolkitpro-rotated.pdf");status.textContent="নির্বাচিত page "+(degreesSelect?.value||"90")+"° rotate হয়েছে।"}
      else if(["pdf-to-jpg","pdf-to-png"].includes(tool.id)){
        if(fs.length!==1)throw new Error("একটি PDF দিন");
        const type=tool.id.endsWith("png")?"image/png":"image/jpeg",items=await pdfImages(fs[0],type),zip=await zipImages(items),u=URL.createObjectURL(zip);objectUrls.push(u);
        preview.innerHTML='<a class="tool-action" download="toolkitpro-pages.zip" href="'+u+'">সব image ZIP ডাউনলোড</a>';
        status.textContent=items.length+"টি image তৈরি হয়েছে।"
      }else if(tool.id==="pdf-compressor"){
        if(fs.length!==1)throw new Error("একটি PDF দিন");
        const {PDFDocument}=await loadPdfLib(),src=await PDFDocument.load(await fs[0].arrayBuffer()),b=await src.save({useObjectStreams:true,addDefaultPage:false});
        if(b.length>=fs[0].size){status.textContent="এই PDF-এ browser rewrite-এ size কমেনি; original file অপরিবর্তিত আছে।";return}
        dl(b,"toolkitpro-compressed.pdf");status.textContent="PDF size কমেছে: "+Math.round((1-b.length/fs[0].size)*100)+"%।"
      }else throw new Error("এই workflow-এর implementation এখনও প্রস্তুত হচ্ছে।")
    }catch(e){status.textContent="Error: "+(e?.message||"অজানা সমস্যা")}
  });
  clear.addEventListener("click",()=>{resetUrls();files.value="";if(range)range.value="";status.textContent="ফাইল নির্বাচন করুন।";preview.innerHTML="";download.hidden=true});
}
export {MODULE_VERSION};