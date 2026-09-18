const MODULE_VERSION="2026.09.19.6";

const escAttr=v=>String(v??"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const escText=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const validUrl=v=>{try{const u=new URL(v);return ["http:","https:"].includes(u.protocol)}catch{return false}};

function build({title,description,url,siteName,locale,robots,image,keywords}){
  const lines=[
    `<title>${escText(title)}</title>`,
    `<meta name="description" content="${escAttr(description)}">`,
    `<link rel="canonical" href="${escAttr(url)}">`,
    `<meta name="robots" content="${escAttr(robots)}">`,
    keywords?`<meta name="keywords" content="${escAttr(keywords)}">`:null,
    `<meta property="og:title" content="${escAttr(title)}">`,
    `<meta property="og:description" content="${escAttr(description)}">`,
    `<meta property="og:url" content="${escAttr(url)}">`,
    `<meta property="og:type" content="website">`,
    siteName?`<meta property="og:site_name" content="${escAttr(siteName)}">`:null,
    locale?`<meta property="og:locale" content="${escAttr(locale)}">`:null,
    image&&validUrl(image)?`<meta property="og:image" content="${escAttr(image)}">`:null,
    `<meta name="twitter:card" content="${image&&validUrl(image)?"summary_large_image":"summary"}">`,
    `<meta name="twitter:title" content="${escAttr(title)}">`,
    `<meta name="twitter:description" content="${escAttr(description)}">`,
    image&&validUrl(image)?`<meta name="twitter:image" content="${escAttr(image)}">`:null
  ].filter(Boolean);
  return lines.join("\n");
}

export function render(){
 return `<div class="tool-form">
  <div class="tool-toolbar"><span class="tool-toolbar-title">Meta Tag Workspace</span><div class="tool-actions"><button class="tool-action" id="mtExample" type="button">উদাহরণ</button><button class="tool-action" id="mtCopy" type="button">কপি</button><button class="tool-action" id="mtClear" type="button">পরিষ্কার</button></div></div>
  <input id="mtT" placeholder="Page title" aria-label="Page title">
  <input id="mtD" placeholder="Meta description" aria-label="Meta description">
  <input id="mtU" placeholder="https://example.com/page" aria-label="Canonical URL" inputmode="url">
  <input id="mtS" placeholder="Site name (optional)" aria-label="Site name">
  <input id="mtI" placeholder="OG image URL (optional)" aria-label="OG image URL" inputmode="url">
  <input id="mtK" placeholder="Keywords (optional)" aria-label="Keywords">
  <select id="mtR" aria-label="Robots policy"><option value="index,follow">Index + Follow</option><option value="noindex,nofollow">No Index + No Follow</option><option value="index,nofollow">Index + No Follow</option><option value="noindex,follow">No Index + Follow</option></select>
  <select id="mtL" aria-label="Locale"><option value="en_US">English (US)</option><option value="bn_BD">বাংলা (বাংলাদেশ)</option><option value="en_GB">English (UK)</option></select>
  <div class="actions"><button class="primary" id="mtG" type="button">Generate</button></div>
  <div id="mtStatus" class="status" role="status" aria-live="polite"></div>
  <textarea id="mtO" rows="16" readonly spellcheck="false" aria-label="Generated meta tags"></textarea>
 </div>`;
}

export function mount(){
 const q=id=>document.getElementById(id),t=q("mtT"),d=q("mtD"),u=q("mtU"),s=q("mtS"),i=q("mtI"),k=q("mtK"),r=q("mtR"),l=q("mtL"),o=q("mtO"),st=q("mtStatus");
 if(!t||!d||!u||!o||!st)return;
 const generate=()=>{
   const title=t.value.trim(),description=d.value.trim(),url=u.value.trim(),image=i.value.trim();
   const errors=[];
   if(!title)errors.push("Page title দিন।");
   if(!description)errors.push("Meta description দিন।");
   if(!validUrl(url))errors.push("Valid http/https canonical URL দিন।");
   if(image&&!validUrl(image))errors.push("OG image URL valid http/https হতে হবে।");
   if(errors.length){st.textContent=errors.join(" ");st.className="status error";o.value="";return;}
   o.value=build({title,description,url,siteName:s.value.trim(),locale:l.value,robots:r.value,image,keywords:k.value.trim()});
   st.textContent=`Generated • title ${title.length} chars • description ${description.length} chars`;
   st.className=title.length>=30&&title.length<=60&&description.length>=120&&description.length<=160?"status success":"status";
 };
 q("mtG")?.addEventListener("click",generate);
 q("mtCopy")?.addEventListener("click",async()=>{if(!o.value)return;try{await navigator.clipboard.writeText(o.value);st.textContent="Meta tags কপি হয়েছে।";st.className="status success"}catch{st.textContent="কপি করা যায়নি।";st.className="status error"}});
 q("mtClear")?.addEventListener("click",()=>{[t,d,u,s,i,k].forEach(x=>x.value="");o.value="";st.textContent="";st.className="status"});
 q("mtExample")?.addEventListener("click",()=>{t.value="Toolkit Pro Online Tools";d.value="Useful browser-based tools for developers, creators, marketers and everyday productivity workflows.";u.value="https://example.com/tools";s.value="Toolkit Pro";i.value="https://example.com/og.jpg";k.value="online tools, developer tools";generate()});
 [t,d,u,s,i,k,r,l].forEach(x=>x?.addEventListener("input",()=>{if(o.value)generate()}));
}
export {MODULE_VERSION};