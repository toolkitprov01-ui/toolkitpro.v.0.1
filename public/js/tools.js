const toolDefinitions=[
{id:"word-counter",name:"Word Counter",bn:"ওয়ার্ড কাউন্টার",icon:"📝",category:"text",description:"শব্দ, অক্ষর, স্পেস ছাড়া অক্ষর ও লাইনের সংখ্যা লাইভ গণনা করুন।"},
{id:"case-converter",name:"Case Converter",bn:"কেস কনভার্টার",icon:"🔤",category:"text",description:"UPPERCASE, lowercase, Title Case এবং Sentence case-এ রূপান্তর করুন।"},
{id:"json-formatter",name:"JSON Formatter",bn:"JSON ফরম্যাটার",icon:"{ }",category:"developer",description:"JSON format, minify ও validate করুন এবং ফলাফল কপি করুন।"},
{id:"base64",name:"Base64 Encoder / Decoder",bn:"Base64 এনকোডার",icon:"🔐",category:"developer",description:"Unicode text নিরাপদে Base64 encode বা decode করুন।"},
{id:"url-encoder",name:"URL Encoder / Decoder",bn:"URL এনকোডার",icon:"🔗",category:"developer",description:"URL ও text encode বা decode করুন।"},
{id:"password-generator",name:"Password Generator",bn:"পাসওয়ার্ড জেনারেটর",icon:"🛡️",category:"security",description:"Web Crypto API দিয়ে শক্তিশালী random password তৈরি করুন।"},
{id:"uuid-generator",name:"UUID Generator",bn:"UUID জেনারেটর",icon:"🆔",category:"developer",description:"Cryptographically random UUID v4 তৈরি করুন।"},
{id:"percentage",name:"Percentage Calculator",bn:"শতকরা ক্যালকুলেটর",icon:"%",category:"utility",description:"X% of Y এবং শতাংশ হিসাব দ্রুত করুন।"},
{id:"unit-converter",name:"Length Converter",bn:"দৈর্ঘ্য কনভার্টার",icon:"📏",category:"utility",description:"m, km, cm, mm, mile, yard, feet ও inch রূপান্তর করুন।"},
{id:"timestamp",name:"Unix Timestamp",bn:"Unix টাইমস্ট্যাম্প",icon:"⏱️",category:"developer",description:"বর্তমান Unix timestamp এবং timestamp থেকে ISO date রূপান্তর করুন।"}
];

const list=document.querySelector("#toolCards");
const panel=document.querySelector("#toolPanel");
const search=document.querySelector("#toolSearch");
const count=document.querySelector("#toolCount");
const runner=document.querySelector("#toolRunner");
const runnerTitle=document.querySelector("#runnerTitle");
const runnerDescription=document.querySelector("#runnerDescription");
const runnerClose=document.querySelector("#runnerClose");

const button=(label,action,extra="")=>'<button class="action '+extra+'" type="button" data-action="'+action+'">'+label+"</button>";
const byId=id=>toolDefinitions.find(t=>t.id===id);

function renderCards(filter="all",query=""){
  const q=query.trim().toLowerCase();
  const items=toolDefinitions.filter(t=>(filter==="all"||t.category===filter)&&(!q||(t.name+" "+t.bn+" "+t.description).toLowerCase().includes(q)));
  count.textContent=items.length+"টি টুল উপলব্ধ";
  list.innerHTML=items.length?items.map(t=>'<button class="tool-card" data-tool="'+t.id+'" type="button"><span class="tool-card-icon">'+t.icon+'</span><span class="tool-card-body"><strong>'+t.bn+'</strong><small>'+t.name+'</small><em>'+t.description+'</em></span><i class="fa-solid fa-arrow-right tool-arrow"></i></button>').join(""):'<div class="no-data"><i class="fa-solid fa-magnifying-glass"></i><h3>কোনো টুল পাওয়া যায়নি</h3><p>অন্য কোনো শব্দ দিয়ে চেষ্টা করুন।</p></div>';
}

function copyText(text){
  if(!text)return Promise.reject(new Error("কপি করার মতো কোনো ফলাফল নেই।"));
  if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text);
  const area=document.createElement("textarea");
  area.value=text;area.style.position="fixed";area.style.opacity="0";document.body.appendChild(area);area.select();
  document.execCommand("copy");area.remove();return Promise.resolve();
}

function copyResult(){
  const result=panel.querySelector("#result");
  const input=panel.querySelector("#input");
  const value=result?.textContent?.trim()||input?.value?.trim()||"";
  const status=panel.querySelector("#copyStatus");
  if(!value){if(status)status.textContent="কপি করার মতো কিছু নেই";return}
  copyText(value).then(()=>{if(status){status.textContent="✓ কপি হয়েছে";setTimeout(()=>status.textContent="",1600)}}).catch(()=>{if(status)status.textContent="কপি করা যায়নি"});
}

function resultBox(text="ফলাফল এখানে দেখাবে।"){
  return '<div class="result-wrap"><div class="result-head"><span>ফলাফল</span><button class="copy-result" type="button" id="copyButton"><i class="fa-regular fa-copy"></i> কপি</button></div><div class="result" id="result">'+text+'</div><small class="copy-status" id="copyStatus" aria-live="polite"></small></div>';
}

function templates(id){
  const commonCopy=resultBox();
  if(id==="word-counter")return '<div class="field"><textarea id="input" autofocus placeholder="আপনার লেখা এখানে লিখুন বা paste করুন…"></textarea></div><div class="result-grid"><div><b id="words">0</b><span>শব্দ</span></div><div><b id="chars">0</b><span>অক্ষর</span></div><div><b id="charsNo">0</b><span>স্পেস ছাড়া</span></div><div><b id="lines">0</b><span>লাইন</span></div></div>';
  if(id==="case-converter")return '<div class="field"><textarea id="input" autofocus placeholder="আপনার text লিখুন…"></textarea></div><div class="actions">'+button("UPPERCASE","upper")+button("lowercase","lower")+button("Title Case","title")+button("Sentence case","sentence")+'</div>'+commonCopy;
  if(id==="json-formatter")return '<div class="field"><textarea id="input" autofocus placeholder=\'{"name":"Toolkit Pro","free":true}\'></textarea></div><div class="actions">'+button("Format","format")+button("Minify","minify")+button("Validate","validate")+'</div>'+commonCopy;
  if(id==="base64")return '<div class="field"><textarea id="input" autofocus placeholder="Unicode text লিখুন…"></textarea></div><div class="actions">'+button("Encode","encode")+button("Decode","decode")+'</div>'+commonCopy;
  if(id==="url-encoder")return '<div class="field"><textarea id="input" autofocus placeholder="URL বা text লিখুন…"></textarea></div><div class="actions">'+button("Encode","encode")+button("Decode","decode")+'</div>'+commonCopy;
  if(id==="password-generator")return '<div class="field"><label for="length">পাসওয়ার্ড দৈর্ঘ্য: <strong id="lengthValue">16</strong></label><input id="length" type="range" min="8" max="128" value="16"><div class="range-row"><span>8</span><span>128</span></div></div><div class="actions">'+button("নতুন Password","generate")+button("কপি","copy","secondary-action")+'</div>'+commonCopy;
  if(id==="uuid-generator")return '<p class="tool-note">প্রতিবার Generate করলে নতুন cryptographically random UUID v4 তৈরি হবে।</p><div class="actions">'+button("Generate UUID","generate")+button("কপি","copy","secondary-action")+'</div>'+commonCopy;
  if(id==="percentage")return '<div class="field two-col"><div><label for="x">শতকরা (X)</label><input id="x" type="number" step="any" placeholder="X"></div><div><label for="y">সংখ্যা (Y)</label><input id="y" type="number" step="any" placeholder="Y"></div></div><div class="actions">'+button("Calculate","calculate")+'</div>'+commonCopy;
  if(id==="unit-converter")return '<div class="field two-col"><div><label for="value">মান</label><input id="value" type="number" step="any" placeholder="Value"></div><div><label for="from">From</label><select id="from"><option value="m">Meters</option><option value="km">Kilometers</option><option value="cm">Centimeters</option><option value="mm">Millimeters</option><option value="mi">Miles</option><option value="yd">Yards</option><option value="ft">Feet</option><option value="in">Inches</option></select></div><div><label for="to">To</label><select id="to"><option value="m">Meters</option><option value="km">Kilometers</option><option value="cm">Centimeters</option><option value="mm">Millimeters</option><option value="mi">Miles</option><option value="yd">Yards</option><option value="ft">Feet</option><option value="in">Inches</option></select></div></div><div class="actions">'+button("Convert","convert")+'</div>'+commonCopy;
  return '<div class="actions">'+button("Current Timestamp","now")+'</div><div class="field"><label for="stamp">Unix timestamp (seconds)</label><input id="stamp" type="number" step="any" placeholder="যেমন 1758153600"></div><div class="actions">'+button("Convert Timestamp","date")+'</div>'+commonCopy;
}

function openTool(id,updateUrl=true){
  const t=byId(id);if(!t)return;
  runnerTitle.textContent=t.icon+" "+t.bn;
  runnerDescription.textContent=t.description;
  panel.innerHTML=templates(id);
  runner.hidden=false;runner.classList.add("visible");
  document.body.classList.add("tool-focus-mode","tool-active-page");
  if(updateUrl)history.replaceState(null,"","/tools.html?tool="+encodeURIComponent(id));
  panel.querySelectorAll("[data-action]").forEach(el=>el.addEventListener("click",()=>run(id,el.dataset.action)));
  panel.querySelector("#copyButton")?.addEventListener("click",copyResult);
  if(id==="word-counter")panel.querySelector("#input").addEventListener("input",updateWordCount);
  if(id==="password-generator"){
    const range=panel.querySelector("#length");
    range.addEventListener("input",()=>panel.querySelector("#lengthValue").textContent=range.value);
  }
  panel.querySelector("#input")?.focus();
  runner.scrollIntoView({behavior:"smooth",block:"start"});
}

function closeTool(updateUrl=true){
  runner.classList.remove("visible");runner.hidden=true;
  document.body.classList.remove("tool-focus-mode","tool-active-page");
  if(updateUrl)history.replaceState(null,"","/tools.html");
  search.focus();
}

function updateWordCount(){
  const v=panel.querySelector("#input").value;
  panel.querySelector("#words").textContent=v.trim()?v.trim().split(/\s+/u).length:0;
  panel.querySelector("#chars").textContent=v.length;
  panel.querySelector("#charsNo").textContent=v.replace(/\s/gu,"").length;
  panel.querySelector("#lines").textContent=v?v.split(/\r?\n/).length:0;
}

function encodeBase64Unicode(v){
  const bytes=new TextEncoder().encode(v);let binary="";
  bytes.forEach(x=>binary+=String.fromCharCode(x));return btoa(binary);
}
function decodeBase64Unicode(v){
  const binary=atob(v.trim());return new TextDecoder().decode(Uint8Array.from(binary,c=>c.charCodeAt(0)));
}
function randomPassword(n){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+";
  const bytes=new Uint32Array(n);crypto.getRandomValues(bytes);
  return Array.from(bytes,x=>chars[x%chars.length]).join("");
}
function titleCase(v){return v.toLocaleLowerCase().replace(/(^|[\s\-_])([\p{L}\p{N}])/gu,(_,p,c)=>p+c.toLocaleUpperCase())}
function sentenceCase(v){const l=v.toLocaleLowerCase();return l.replace(/(^|[.!?]\s+)([\p{L}\p{N}])/gu,(_,p,c)=>p+c.toLocaleUpperCase())}
function setResult(value){const el=panel.querySelector("#result");if(el)el.textContent=String(value)}

function run(id,action){
  const input=panel.querySelector("#input");
  try{
    if(id==="case-converter"){const v=input.value;setResult(action==="upper"?v.toLocaleUpperCase():action==="lower"?v.toLocaleLowerCase():action==="title"?titleCase(v):sentenceCase(v));return}
    if(id==="json-formatter"){
      const p=JSON.parse(input.value.trim());
      setResult(action==="format"?JSON.stringify(p,null,2):action==="minify"?JSON.stringify(p):"✓ Valid JSON");
      return;
    }
    if(id==="base64"){setResult(action==="encode"?encodeBase64Unicode(input.value):decodeBase64Unicode(input.value));return}
    if(id==="url-encoder"){setResult(action==="encode"?encodeURIComponent(input.value):decodeURIComponent(input.value));return}
    if(id==="password-generator"){
      if(action==="copy"){copyResult();return}
      const n=Math.max(8,Math.min(128,Number(panel.querySelector("#length").value)||16));setResult(randomPassword(n));return;
    }
    if(id==="uuid-generator"){if(action==="copy"){copyResult();return}setResult(crypto.randomUUID());return}
    if(id==="percentage"){
      const x=Number(panel.querySelector("#x").value),y=Number(panel.querySelector("#y").value);
      if(!Number.isFinite(x)||!Number.isFinite(y))throw Error("সঠিক সংখ্যা দিন।");
      setResult(x+"% of "+y+" = "+(x*y/100));return;
    }
    if(id==="unit-converter"){
      const f={m:1,km:1000,cm:.01,mm:.001,mi:1609.344,yd:.9144,ft:.3048,in:.0254};
      const v=Number(panel.querySelector("#value").value),from=panel.querySelector("#from").value,to=panel.querySelector("#to").value;
      if(!Number.isFinite(v))throw Error("সঠিক সংখ্যা দিন।");
      const r=v*f[from]/f[to];setResult(v+" "+from+" = "+Number(r.toPrecision(12))+" "+to);return;
    }
    if(id==="timestamp"){
      if(action==="now"){setResult(Math.floor(Date.now()/1000));return}
      const s=Number(panel.querySelector("#stamp").value),d=new Date(s*1000);
      if(!Number.isFinite(s)||Number.isNaN(d.getTime()))throw Error("সঠিক timestamp দিন।");
      setResult(d.toISOString());return;
    }
  }catch(e){setResult("Error: "+(e.message||"অজানা সমস্যা"))}
}

let active="all";
document.querySelectorAll(".category-filter").forEach(b=>b.addEventListener("click",()=>{
  document.querySelectorAll(".category-filter").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");active=b.dataset.category;renderCards(active,search.value);
}));
list.addEventListener("click",e=>{const id=e.target.closest("[data-tool]")?.dataset.tool;if(id)openTool(id)});
search.addEventListener("input",()=>renderCards(active,search.value));
runnerClose.addEventListener("click",()=>closeTool());
document.querySelector("#year").textContent=new Date().getFullYear();
window.addEventListener("popstate",()=>{const id=new URLSearchParams(location.search).get("tool");id?openTool(id,false):closeTool(false)});
const initial=new URLSearchParams(location.search).get("tool");
renderCards(active,search.value);
if(initial&&byId(initial)) openTool(initial,false);
