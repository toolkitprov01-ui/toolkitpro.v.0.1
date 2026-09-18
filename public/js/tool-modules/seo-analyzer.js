const MODULE_VERSION="2026.09.19.5";

function esc(v=""){
  return String(v).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
}
function check(label,value,detail){
  const ok=!!value;
  return `<div class="seo-check ${ok?"ok":"warn"}"><strong>${ok?"✓":"!"} ${esc(label)}</strong><span>${esc(detail)}</span></div>`;
}
function metaAll(doc,selector){
  return [...doc.querySelectorAll(selector)].map(x=>(x.getAttribute("content")||"").trim()).filter(Boolean);
}
function isAbsoluteHttp(url){
  try{const u=new URL(url);return u.protocol==="http:"||u.protocol==="https:";}catch{return false;}
}

export function render(){
  return `<div class="tool-form">
    <div class="tool-toolbar"><span class="tool-toolbar-title">On-page SEO Audit</span><div class="tool-actions"><button class="tool-action" id="seoExample" type="button">উদাহরণ</button><button class="tool-action" id="seoClear" type="button">পরিষ্কার</button></div></div>
    <p class="tool-help">HTML source paste করুন। বিশ্লেষণটি browser-এ সম্পন্ন হয়; source server-এ পাঠানো হয় না।</p>
    <textarea id="seoInput" rows="14" placeholder="<!doctype html>\n<html lang="bn">\n<head>\n<title>আপনার পেজ</title>\n<meta name="description" content="...">\n</head>\n<body>...</body>\n</html>" aria-label="HTML source" spellcheck="false"></textarea>
    <div class="actions"><button class="primary" id="seoAnalyze" type="button">SEO বিশ্লেষণ</button><button class="secondary" id="seoClear2" type="button">পরিষ্কার</button></div>
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
    const descriptions=metaAll(doc,'meta[name="description"]');
    const canonicals=[...doc.querySelectorAll('link[rel~="canonical"]')].map(x=>(x.getAttribute("href")||"").trim()).filter(Boolean);
    const robots=(doc.querySelector('meta[name="robots"]')?.getAttribute("content")||"").trim();
    const h1=doc.querySelectorAll("h1").length;
    const headingNodes=[...doc.querySelectorAll("h1,h2,h3,h4,h5,h6")];
    const headingLevels=headingNodes.map(h=>Number(h.tagName.slice(1)));
    const skipped=headingLevels.some((level,i)=>i>0&&level-headingLevels[i-1]>1);
    const images=[...doc.querySelectorAll("img")];
    const missingAlt=images.filter(img=>!img.hasAttribute("alt")||!img.getAttribute("alt")?.trim()).length;
    const emptyAlt=images.filter(img=>img.hasAttribute("alt")&&!img.getAttribute("alt")?.trim()).length;
    const links=[...doc.querySelectorAll("a[href]")];
    const internalLinks=links.filter(a=>{try{return new URL(a.href,doc.baseURI).origin===new URL(location.href).origin}catch{return !/^https?:\/\//i.test(a.getAttribute("href")||"")}}).length;
    const externalLinks=links.length-internalLinks;
    const ogTitle=metaAll(doc,'meta[property="og:title"]');
    const ogDescription=metaAll(doc,'meta[property="og:description"]');
    const ogImage=metaAll(doc,'meta[property="og:image"]');
    const twitterCard=metaAll(doc,'meta[name="twitter:card"]');
    const viewport=!!doc.querySelector('meta[name="viewport"]');
    const lang=(doc.documentElement.getAttribute("lang")||"").trim();
    const titleLen=title.length,descLen=descriptions[0]?.length||0;
    const titleOk=titleLen>=30&&titleLen<=60;
    const descOk=descLen>=120&&descLen<=160;
    const canonicalOk=canonicals.length===1&&isAbsoluteHttp(canonicals[0]);
    const duplicateMeta=descriptions.length>1;
    const structuredData=doc.querySelectorAll('script[type="application/ld+json"]').length;
    const seoChecks=[
      check("Title",titleOk,`${titleLen} অক্ষর — ${title||"পাওয়া যায়নি"}`),
      check("Meta description",!duplicateMeta&&descOk,`${descLen} অক্ষর — ${descriptions[0]||"পাওয়া যায়নি"}${duplicateMeta?" • একাধিক description":""}`),
      check("Canonical",canonicalOk,`${canonicals.length}টি — ${canonicals[0]||"পাওয়া যায়নি"}`),
      check("H1",h1===1,`${h1}টি H1 পাওয়া গেছে`),
      check("Heading hierarchy",!skipped,`${headingLevels.length}টি heading; ${skipped?"level skip আছে":"ক্রম ঠিক আছে"}`),
      check("Image alt",images.length===0||missingAlt===0,`${images.length}টি image, ${missingAlt}টিতে alt অনুপস্থিত`),
      check("Open Graph",ogTitle.length>0&&ogDescription.length>0&&ogImage.length>0,`title ${ogTitle.length?"✓":"!"} • description ${ogDescription.length?"✓":"!"} • image ${ogImage.length?"✓":"!"}`),
      check("Twitter Card",twitterCard.length>0,"twitter:card "+(twitterCard[0]||"অনুপস্থিত")),
      check("Viewport",viewport,"Mobile viewport meta "+(viewport?"আছে":"অনুপস্থিত")),
      check("HTML lang",/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(lang),`lang="${lang||"অনুপস্থিত"}"`),
      check("Robots",!/(^|,|\s)noindex(?:,|\s|$)/i.test(robots),`robots: ${robots||"নির্দিষ্ট করা হয়নি"}`),
      check("Structured data",structuredData>0,`${structuredData}টি JSON-LD block`)
    ];
    results.innerHTML=seoChecks.join("")+`<div class="seo-notes"><strong>Audit summary</strong><p>${links.length}টি link — internal ${internalLinks}, external ${externalLinks} • ${emptyAlt}টি explicitly empty alt • ${structuredData}টি JSON-LD</p></div>`;
    const notes=[];
    if(!title)notes.push("একটি descriptive title যোগ করুন।"); else if(!titleOk)notes.push("Title সাধারণভাবে 30–60 অক্ষরের মধ্যে রাখুন।");
    if(!descriptions.length)notes.push("একটি unique meta description যোগ করুন।"); else if(duplicateMeta)notes.push("একাধিক meta description সরিয়ে একটি unique description রাখুন।"); else if(!descOk)notes.push("Meta description সাধারণভাবে 120–160 অক্ষরের মধ্যে রাখুন।");
    if(!canonicalOk)notes.push("একটি valid absolute canonical URL রাখুন।");
    if(h1!==1)notes.push("পেজে একটি স্পষ্ট primary H1 রাখুন।");
    if(skipped)notes.push("Heading hierarchy-তে level skip ঠিক করুন।");
    if(missingAlt)notes.push(`${missingAlt}টি image-এ descriptive alt text যোগ করুন।`);
    if(!ogTitle.length||!ogDescription.length||!ogImage.length)notes.push("Social sharing-এর জন্য og:title, og:description ও og:image সম্পূর্ণ করুন।");
    if(!twitterCard.length)notes.push("Social preview-এর জন্য twitter:card যোগ করার কথা বিবেচনা করুন।");
    if(!viewport)notes.push("Mobile viewport meta যোগ করুন।");
    if(!/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(lang))notes.push("HTML lang attribute নির্ধারণ করুন।");
    results.insertAdjacentHTML("beforeend",notes.length?`<div class="seo-notes"><strong>Actionable recommendations</strong><ul>${notes.map(n=>`<li>${esc(n)}</li>`).join("")}</ul></div>`:"<div class='seo-notes'><strong>প্রাথমিক audit সম্পন্ন</strong><p>এটি on-page diagnostics; search ranking বা indexing নিশ্চিত করে না।</p></div>");
    status.textContent=`Audit সম্পন্ন — ${seoChecks.length}টি check • ${h1} H1 • ${images.length} image • ${links.length} link`;
    status.className="status success";
  };
  document.getElementById("seoAnalyze")?.addEventListener("click",analyze);
  document.getElementById("seoExample")?.addEventListener("click",()=>{
    input.value='<!doctype html><html lang="en"><head><title>Toolkit Pro SEO Tools</title><meta name="description" content="A practical collection of browser-based online tools for developers, creators, marketers and everyday productivity workflows."><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="canonical" href="https://example.com/page"><meta property="og:title" content="Toolkit Pro"><meta property="og:description" content="Useful online tools"><meta property="og:image" content="https://example.com/image.jpg"><meta name="twitter:card" content="summary_large_image"><script type="application/ld+json">{\"@context\":\"https://schema.org\",\"@type\":\"WebPage\"}</script></head><body><h1>Toolkit Pro</h1><h2>Tools</h2><img src="image.jpg" alt="Toolkit Pro tools"></body></html>';
    analyze();input.focus();
  });
  ["seoClear","seoClear2"].forEach(id=>document.getElementById(id)?.addEventListener("click",()=>{input.value="";results.innerHTML="";status.textContent="";status.className="status";}));
}
export {MODULE_VERSION};