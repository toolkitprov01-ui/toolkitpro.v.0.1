const MODULE_VERSION="2026.09.18.1";

const operations={
"text-to-uppercase":v=>v.toUpperCase(),
"text-to-lowercase":v=>v.toLowerCase(),
"title-case-converter":v=>v.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()),
"text-reverser":v=>Array.from(v).reverse().join(""),
"remove-extra-spaces":v=>v.replace(/\s+/g," ").trim(),
"remove-duplicate-lines":v=>Array.from(new Set(v.split(/\r?\n/u))).join("\n"),
"sort-lines":v=>v.split(/\r?\n/u).sort((a,b)=>a.localeCompare(b)).join("\n"),
"text-to-slug":v=>v.toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-|-$/g,""),
"line-counter":v=>String(v?v.split(/\r?\n/u).length:0),
"sentence-counter":v=>String(v.split(/[.!?]+/u).filter(s=>s.trim()).length),
"paragraph-counter":v=>String(v.split(/\n\s*\n/u).filter(s=>s.trim()).length),
"whitespace-counter":v=>String((v.match(/\s/g)||[]).length),
"base64-encoder":v=>btoa(unescape(encodeURIComponent(v))),
"base64-decoder":v=>decodeURIComponent(escape(atob(v))),
"url-encoder":v=>encodeURIComponent(v),
"url-decoder":v=>decodeURIComponent(v),
"html-entity-encoder":v=>v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"),
"html-entity-decoder":v=>{const e=document.createElement("textarea");e.innerHTML=v;return e.value},
"json-minifier":v=>JSON.stringify(JSON.parse(v)),
"json-validator":v=>{JSON.parse(v);return "Valid JSON"},
"uuid-generator":()=>crypto.randomUUID(),
"timestamp-generator":()=>String(Math.floor(Date.now()/1000)),
"timestamp-converter":v=>new Date(Number(v)*1000).toISOString(),
"number-base-converter":v=>{const n=Number(v);return `decimal: ${n}\nbinary: ${n.toString(2)}\nhex: ${n.toString(16)}`},
"random-number-generator":v=>{const [a,b]=(v.split(/[,\s]+/).map(Number));return String(Math.floor(Math.random()*(b-a+1))+a)},
"percentage-calculator":v=>{const [a,b]=v.split(/[,\s]+/).map(Number);return String(a*b/100)},
"average-calculator":v=>{const a=v.split(/[,\s]+/).filter(Boolean).map(Number);return String(a.reduce((x,y)=>x+y,0)/a.length)},
"sum-calculator":v=>String(v.split(/[,\s]+/).filter(Boolean).map(Number).reduce((a,b)=>a+b,0)),
"min-max-calculator":v=>{const a=v.split(/[,\s]+/).filter(Boolean).map(Number);return `min: ${Math.min(...a)}\nmax: ${Math.max(...a)}`},
"factorial-calculator":v=>{let n=Number(v),r=1;for(let i=2;i<=n;i++)r*=i;return String(r)},
"prime-checker":v=>{const n=Number(v);if(n<2)return "Not prime";for(let i=2;i*i<=n;i++)if(n%i===0)return "Not prime";return "Prime"},
"even-odd-checker":v=>Number(v)%2===0?"Even":"Odd",
"decimal-to-binary":v=>Number(v).toString(2),
"binary-to-decimal":v=>String(parseInt(v,2)),
"decimal-to-hex":v=>Number(v).toString(16),
"hex-to-decimal":v=>String(parseInt(v,16)),
"celsius-to-fahrenheit":v=>String(Number(v)*9/5+32),
"fahrenheit-to-celsius":v=>String((Number(v)-32)*5/9),
"kilometers-to-miles":v=>String(Number(v)*0.621371),
"miles-to-kilometers":v=>String(Number(v)*1.609344),
"kilograms-to-pounds":v=>String(Number(v)*2.2046226218),
"pounds-to-kilograms":v=>String(Number(v)*0.45359237),
"meters-to-feet":v=>String(Number(v)*3.280839895),
"feet-to-meters":v=>String(Number(v)*0.3048),
"liters-to-gallons":v=>String(Number(v)*0.264172052),
"gallons-to-liters":v=>String(Number(v)*3.785411784),
"bytes-to-kb":v=>String(Number(v)/1024),
"kb-to-bytes":v=>String(Number(v)*1024),
"mb-to-gb":v=>String(Number(v)/1024),
"gb-to-mb":v=>String(Number(v)*1024),
"days-to-hours":v=>String(Number(v)*24),
"hours-to-minutes":v=>String(Number(v)*60),
"minutes-to-seconds":v=>String(Number(v)*60),
"date-difference":v=>{const [a,b]=v.split(/[,\n]+/).map(x=>new Date(x.trim()));return String(Math.round(Math.abs(b-a)/86400000))+" days"},
"tip-calculator":v=>{const [a,b]=v.split(/[,\s]+/).map(Number);return String(a*b/100)},
"discount-calculator":v=>{const [a,b]=v.split(/[,\s]+/).map(Number);return String(a-a*b/100)},
"tax-calculator":v=>{const [a,b]=v.split(/[,\s]+/).map(Number);return String(a+a*b/100)},
"compound-interest":v=>{const [p,r,t]=v.split(/[,\s]+/).map(Number);return String(p*Math.pow(1+r/100,t)-p)},
"loan-payment-calculator":v=>{const [p,r,n]=v.split(/[,\s]+/).map(Number),m=r/1200;return String(m?p*m*Math.pow(1+m,n)/(Math.pow(1+m,n)-1):p/n)},
"px-to-rem":v=>String(Number(v)/16),
"rem-to-px":v=>String(Number(v)*16),
"aspect-ratio-calculator":v=>{const [w,h]=v.split(/[,\s]+/).map(Number);const g=(a,b)=>b?g(b,a%b):a;const d=g(w,h);return `${w/d}:${h/d}`},
"unix-to-date":v=>new Date(Number(v)*1000).toISOString(),
"date-to-unix":v=>String(Math.floor(new Date(v).getTime()/1000)),
"bmi-calculator":v=>{const [w,h]=v.split(/[,\\s]+/).map(Number);return String(w/Math.pow(h/100,2))},
"json-stringify":v=>JSON.stringify(v),
"json-parse-viewer":v=>JSON.stringify(JSON.parse(v),null,2),
"html-escape":v=>v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"),
"html-unescape":v=>{const e=document.createElement("textarea");e.innerHTML=v;return e.value},
"json-to-yaml":v=>Object.entries(JSON.parse(v)).map(([k,val])=>k+": "+JSON.stringify(val)).join("\n"),
"lorem-ipsum-generator":v=>Array(Math.max(1,Number(v)||3)).fill("Lorem ipsum dolor sit amet, consectetur adipiscing elit.").join(" ")
};

export function render({tool}){
  return `<div class="tool-form"><div class="tool-toolbar"><span class="tool-toolbar-title">${tool.bn||tool.name}</span><div class="tool-actions"><button class="tool-action" id="utilityRun" type="button">চালান</button><button class="tool-action" id="utilityClear" type="button">মুছে ফেলুন</button></div></div><textarea id="utilityInput" rows="8" placeholder="ইনপুট দিন…"></textarea><textarea id="utilityOutput" rows="8" readonly placeholder="ফলাফল এখানে দেখা যাবে…"></textarea><p class="tool-note">টুলটি আপনার ব্রাউজারেই কাজ করে; ইনপুট সার্ভারে পাঠানো হয় না।</p></div>`;
}
export function mount({tool,root}){
  const input=root.querySelector("#utilityInput"),output=root.querySelector("#utilityOutput");
  const run=async()=>{try{let fn=operations[tool.id];if(tool.id==="sha256-hash"||tool.id==="text-hash"){const data=new TextEncoder().encode(input.value),hash=await crypto.subtle.digest("SHA-256",data);fn=()=>Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("")}if(tool.id==="random-password"){fn=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[b%62]).join("")}if(!fn)throw new Error("Operation not implemented");output.value=await fn(input.value)}catch(e){output.value="Error: "+e.message}};
  root.querySelector("#utilityRun").addEventListener("click",run);
  root.querySelector("#utilityClear").addEventListener("click",()=>{input.value="";output.value="";input.focus()});
  if(["uuid-generator","timestamp-generator","random-password","lorem-ipsum-generator"].includes(tool.id))run();
}
export {MODULE_VERSION};
