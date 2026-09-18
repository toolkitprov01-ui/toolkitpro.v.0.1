const MODULE_VERSION="2026.09.18.12";

function esc(v=""){
  return String(v).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
}

function check(label,value,detail){
  const ok=!!value;
  return `<div class="seo-check ${ok?"ok":"warn"}"><strong>${ok?"✓":"!"} ${esc(label)}</strong><span>${esc(detail)}</span></div>`;
}

export function render(){
  return `<div class="tool-form">
    <p class="tool-help">আপনার HTML পেজের source code এখানে paste করুন। কোনো data সার্ভারে পাঠানো হবে না—বিশ্লেষণটি আপনার ব্রাউজারেই হবে।</p>
    <textarea id="seoInput" rows="14" placeholder="<!doctype html>\n<html>\n<head>\n<title>আপনার পেজের title</title>\n<meta name="description" content="...">\n</head>\n<body>...</body>\n</html>" aria-label="HTML source"></textarea>
    <div class="actions"><button class="primary" id="seoAnalyze" type="button">SEO বিশ্লেষণ</button><button class="secondary" id="seoClear" type="button">পরিষ্কার</button></div>
    <div id="seoStatus" class="status" role="status" aria-live="polite"></div>
    <div id="seoResults" class="seo-results"></div>
  </div>`;
}

export function mount(){
  const input=document.getElementById("seoInput"),results=document.getElementById("seoResults"),status=document.getElementById("seoStatus");
  if(!input||!results||!status)return;

  const analyze=()=>{
    const raw=input.value.trim();
    if(!raw){status.textContent="HTML source দিন।";status.className="status error";results.innerHTML="";return;}
    const doc=new DOMParser().parseFromString(raw,"text/html");
    const title=(doc.querySelector("title")?.textContent||"").trim();
    const description=(doc.querySelector('meta[name="description"]')?.getAttribute("content")||"").trim();
    const canonical=(doc.querySelector('link[rel="canonical"]')?.getAttribute("href")||"").trim();
    const robots=(doc.querySelector('meta[name="robots"]')?.getAttribute("content")||"").trim();
    const h1=doc.querySelectorAll("h1").length;
    const headings=doc.querySelectorAll("h1,h2,h3,h4,h5,h6").length;
    const images=[...doc.querySelectorAll("img")];
    const missingAlt=images.filter(img=>!img.hasAttribute("alt")||!img.getAttribute("alt")?.trim()).length;
    const ogTitle=(doc.querySelector('meta[property="og:title"]')?.getAttribute("content")||"").trim();
    const ogDescription=(doc.querySelector('meta[property="og:description"]')?.getAttribute("content")||"").trim();
    const viewport=!!doc.querySelector('meta[name="viewport"]');
    const lang=(doc.documentElement.getAttribute("lang")||"").trim();

    const titleLen=title.length;
    const descLen=description.length;
    const titleOk=titleLen>=30&&titleLen<=60;
    const descOk=descLen>=120&&descLen<=160;

    results.innerHTML=[
      check("Title",titleOk,`${titleLen} অক্ষর — ${title?title:"পাওয়া যায়নি"}`),
      check("Meta description",descOk,`${descLen} অক্ষর — ${description?description:"পাওয়া যায়নি"}`),
      check("Canonical",canonical,"Canonical URL পাওয়া গেছে"),
      check("H1",h1===1,`${h1}টি H1 পাওয়া গেছে`),
      check("Image alt",images.length===0||missingAlt===0,`${images.length}টি image, ${missingAlt}টিতে alt অনুপস্থিত`),
      check("Open Graph",ogTitle&&ogDescription,"og:title ও og:description আছে"),
      check("Viewport",viewport,"Mobile viewport meta আছে"),
      check("HTML lang",lang,`lang="${lang||"অনুপস্থিত"}"`),
      check("Robots",robots.toLowerCase()!=="noindex","robots: "+(robots||"নির্দিষ্ট করা হয়নি"))
    ].join("");

    const notes=[];
    if(title&&!titleOk)notes.push("Title সাধারণভাবে 30–60 অক্ষরের মধ্যে রাখার কথা বিবেচনা করুন।");
    if(description&&!descOk)notes.push("Meta description সাধারণভাবে 120–160 অক্ষরের মধ্যে রাখার কথা বিবেচনা করুন।");
    if(headings>0&&h1!==1)notes.push("পেজে একটি স্পষ্ট primary H1 রাখুন।");
    if(!canonical)notes.push("Duplicate URL সমস্যা কমাতে canonical URL বিবেচনা করুন।");
    status.textContent=`বিশ্লেষণ সম্পন্ন — ${h1} H1, ${images.length} image, ${headings} heading`;
    status.className="status success";
    results.insertAdjacentHTML("beforeend",notes.length?`<div class="seo-notes"><strong>পরামর্শ</strong><ul>${notes.map(n=>`<li>${esc(n)}</li>`).join("")}</ul></div>`:"<div class='seo-notes'><strong>প্রাথমিক checks সম্পন্ন</strong><p>Search ranking নিশ্চিত করার কোনো score এখানে দেওয়া হচ্ছে না; এটি on-page checks-এর একটি সহায়ক বিশ্লেষক।</p></div>");
  };

  document.getElementById("seoAnalyze")?.addEventListener("click",analyze);
  document.getElementById("seoClear")?.addEventListener("click",()=>{input.value="";results.innerHTML="";status.textContent="";status.className="status";});
}

export {MODULE_VERSION};
