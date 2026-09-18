const MODULE_VERSION="2026.09.18.2";

const operations={

"age-calculator":v=>{const d=new Date(v.trim());if(Number.isNaN(d.getTime()))throw new Error("Invalid date");const now=new Date();let y=now.getFullYear()-d.getFullYear(),m=now.getMonth()-d.getMonth(),day=now.getDate()-d.getDate();if(day<0){m--;day+=new Date(now.getFullYear(),now.getMonth(),0).getDate()}if(m<0){y--;m+=12}return `${y} years, ${m} months, ${day} days`},
"emi-calculator":v=>{const [p,r,n]=v.split(/[,\s]+/).map(Number),m=r/1200;return String(m?p*m*Math.pow(1+m,n)/(Math.pow(1+m,n)-1):p/n)},
"simple-interest-calculator":v=>{const [p,r,t]=v.split(/[,\s]+/).map(Number);return String(p*r*t/100)},
"profit-margin-calculator":v=>{const [cost,sale]=v.split(/[,\s]+/).map(Number);const profit=sale-cost;return `profit: ${profit}\nmargin: ${(profit/sale*100).toFixed(2)}%`},
"percentage-change-calculator":v=>{const [a,b]=v.split(/[,\s]+/).map(Number);return String((b-a)/a*100)+"%"},
"percentage-increase-calculator":v=>{const [a,p]=v.split(/[,\s]+/).map(Number);return String(a*(1+p/100))},
"ratio-calculator":v=>{const [a,b]=v.split(/[,\s]+/).map(Number);const g=(x,y)=>y?g(y,x%y):Math.abs(x);const d=g(a,b);return `${a/d}:${b/d}`},
"gcd-lcm-calculator":v=>{const a=v.split(/[,\s]+/).filter(Boolean).map(Number),g=(x,y)=>y?g(y,x%y):Math.abs(x),d=a.reduce(g),l=a.reduce((x,y)=>Math.abs(x*y)/g(x,y));return `gcd: ${d}\nlcm: ${l}`},
"time-duration-calculator":v=>{const [a,b]=v.split(/[,\n]+/).map(x=>new Date("1970-01-01T"+x.trim()));const ms=b-a;return `${Math.floor(ms/3600000)} hours ${Math.floor(ms/60000)%60} minutes`},
"timezone-converter":v=>{const [date,time,zone]=v.trim().split(/\s+/);return new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"long",timeZone:zone||"UTC"}).format(new Date(date+"T"+time+"Z"))},
"word-frequency-counter":v=>{const m=new Map();for(const w of v.toLowerCase().match(/[\p{L}\p{N}']+/gu)||[])m.set(w,(m.get(w)||0)+1);return [...m.entries()].sort((a,b)=>b[1]-a[1]).map(([w,n])=>`${w}: ${n}`).join("\n")},
"text-diff-checker":v=>{const [a,b]=v.split(/\n---COMPARE---\n/);const aa=(a||"").split(/\r?\n/),bb=(b||"").split(/\r?\n/);return aa.map((x,i)=>(x===bb[i]?"  ":"- ")+x).concat(bb.filter((x,i)=>x!==aa[i]).map(x=>"+ "+x)).join("\n")},
"find-and-replace":v=>{const [find,repl,...parts]=v.split("\n");return parts.join("\n").split(find||"").join(repl||"")},
"remove-line-breaks":v=>v.replace(/\s*\r?\n\s*/g," ").replace(/\s+/g," ").trim(),
"sentence-case-converter":v=>v.toLowerCase().replace(/(^|[.!?]\s+)(\p{L})/gu,(m,p,c)=>p+c.toUpperCase()),
"camel-case-converter":v=>v.toLowerCase().trim().split(/[^\p{L}\p{N}]+/gu).filter(Boolean).map((w,i)=>i?w[0].toUpperCase()+w.slice(1):w).join(""),
"snake-case-converter":v=>v.toLowerCase().trim().split(/[^\p{L}\p{N}]+/gu).filter(Boolean).join("_"),
"kebab-case-converter":v=>v.toLowerCase().trim().split(/[^\p{L}\p{N}]+/gu).filter(Boolean).join("-"),
"random-string-generator":v=>{const n=Math.max(1,Math.min(512,Number(v)||16)),chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";const out=[];const limit=256-(256%chars.length);while(out.length<n){for(const b of crypto.getRandomValues(new Uint8Array(64)))if(b<limit&&out.length<n)out.push(chars[b%chars.length])}return out.join("")},
"random-picker":v=>{const a=v.split(/\r?\n/).filter(Boolean);return a.length?a[Math.floor(Math.random()*a.length)]:""},
"password-strength-checker":v=>{let s=0;if(v.length>=8)s++;if(v.length>=12)s++;if(/[a-z]/.test(v)&&/[A-Z]/.test(v))s++;if(/\d/.test(v))s++;if(/[^A-Za-z0-9]/.test(v))s++;return ["Very weak","Weak","Fair","Good","Strong","Very strong"][s]},
"sha1-hash":async v=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-1",new TextEncoder().encode(v)))).map(b=>b.toString(16).padStart(2,"0")).join(""),
"sha512-hash":async v=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-512",new TextEncoder().encode(v)))).map(b=>b.toString(16).padStart(2,"0")).join(""),
"json-to-csv":v=>{const a=JSON.parse(v);if(!Array.isArray(a)||!a.length)return "";const keys=[...new Set(a.flatMap(x=>Object.keys(x||{})))];const q=x=>`"${String(x??"").replace(/"/g,'""')}"`;return [keys.map(q).join(","),...a.map(o=>keys.map(k=>q(o[k])).join(","))].join("\n")},
"csv-to-json":v=>{const [head,...rows]=v.trim().split(/\r?\n/);const keys=(head||"").split(",").map(x=>x.replace(/^"|"$/g,""));return JSON.stringify(rows.map(r=>{const vals=r.split(",").map(x=>x.replace(/^"|"$/g,"").replace(/""/g,'"'));return Object.fromEntries(keys.map((k,i)=>[k,vals[i]??""]))}),null,2)},
"css-minifier":v=>v.replace(/\/\*[\s\S]*?\*\//g,"").replace(/\s+/g," ").replace(/\s*([{}:;,>])\s*/g,"$1").trim(),
"html-minifier":v=>v.replace(/<!--[\s\S]*?-->/g,"").replace(/>\s+</g,"><").replace(/\s{2,}/g," ").trim(),
"sql-formatter":v=>v.replace(/\s+/g," ").replace(/\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|VALUES|SET|UNION)\b/gi,"\n$1 ").trim(),
"hex-to-rgb":v=>{const h=v.trim().replace("#","");if(!/^[0-9a-f]{6}$/i.test(h))throw new Error("Use 6-digit HEX");return `rgb(${parseInt(h.slice(0,2),16)}, ${parseInt(h.slice(2,4),16)}, ${parseInt(h.slice(4),16)})`},
"rgb-to-hex":v=>{const [r,g,b]=v.split(/[,\s]+/).map(Number);return "#"+[r,g,b].map(x=>Math.max(0,Math.min(255,x)).toString(16).padStart(2,"0")).join("")},
"color-contrast-checker":v=>{const [a,b]=v.split(/[,\s]+/);const lum=h=>{const x=h.replace("#","").match(/../g).map(z=>parseInt(z,16)/255).map(c=>c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4));return .2126*x[0]+.7152*x[1]+.0722*x[2]};const [l1,l2]=[lum(a),lum(b)].sort((x,y)=>y-x);return String(((l1+.05)/(l2+.05)).toFixed(2))},
"css-gradient-generator":v=>{const [a,b,angle="90deg"]=v.split(/[,\n]+/).map(x=>x.trim());return `background: linear-gradient(${angle}, ${a||"#000"}, ${b||"#fff"});`},
"css-box-shadow-generator":v=>{const [x="0",y="4",blur="12",spread="0",color="rgba(0,0,0,.2)"]=v.split(/[,\s]+/);return `box-shadow: ${x}px ${y}px ${blur}px ${spread}px ${color};`},
"reading-time-calculator":v=>{const n=(v.trim().match(/\S+/gu)||[]).length;return `${Math.max(1,Math.ceil(n/200))} min (${n} words)`},
"character-counter":v=>`characters: ${v.length}\nwithout spaces: ${v.replace(/\s/g,"").length}`,
"word-count-limit-checker":v=>{const [limit,...parts]=v.split("\n"),n=(parts.join("\n").trim().match(/\S+/gu)||[]).length;return `${n}/${Number(limit)||0} words — ${n<=(Number(limit)||0)?"within limit":"over limit"}`},
"social-media-counter":v=>{const n=v.length;return `characters: ${n}\nX: ${n}/280\nInstagram caption: ${n}/2200\nLinkedIn: ${n}/3000`},
"email-signature-generator":v=>{const [name,title,company,email,phone]=v.split("\n");return `<div><strong>${name||""}</strong><br>${title||""} ${company?"| "+company:""}<br>${email||""} ${phone?"| "+phone:""}</div>`},
"username-generator":v=>{const base=v.trim().toLowerCase().replace(/[^a-z0-9]+/g,"");return [base,base+"01",base+"_"+Math.floor(Math.random()*1000),base+".official"].filter(Boolean).join("\n")},
"random-password-generator":()=>{const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";const out=[];const limit=256-(256%chars.length);while(out.length<20){for(const b of crypto.getRandomValues(new Uint8Array(64)))if(b<limit&&out.length<20)out.push(chars[b%chars.length])}return out.join("")},
"uuid-bulk-generator":v=>Array.from({length:Math.min(100,Math.max(1,Number(v)||10))},()=>crypto.randomUUID()).join("\n"),
"unix-time-now":()=>String(Math.floor(Date.now()/1000)),
"date-format-converter":v=>{const d=new Date(v);if(Number.isNaN(d.getTime()))throw new Error("Invalid date");return `ISO: ${d.toISOString()}\nLocal: ${d.toLocaleString()}`},
"days-between-dates":v=>{const [a,b]=v.split(/[,\n]+/).map(x=>new Date(x.trim()));return String(Math.round(Math.abs(b-a)/86400000))+" days"},
"calorie-calculator":v=>{const [age,weight,height,activity=1.2]=v.split(/[,\s]+/).map(Number);const bmr=10*weight+6.25*height-5*age+5;return String(Math.round(bmr*(Number(activity)||1.2)))+" kcal/day (approx.)"},
"bmr-calculator":v=>{const [age,weight,height,sex="m"]=v.split(/[,\s]+/);const b=10*Number(weight)+6.25*Number(height)-5*Number(age)+(String(sex).toLowerCase().startsWith("f")?-161:5);return String(Math.round(b))+" kcal/day"},
"body-fat-calculator":v=>{const [waist,neck,height]=v.split(/[,\s]+/).map(Number);return String((495/(1.0324-0.19077*Math.log10(waist-neck)+0.15456*Math.log10(height)))-450)+"% (approx.)"}
"text-to-uppercase":v=>v.toUpperCase(),
"text-to-lowercase":v=>v.toLowerCase(),
"title-case-converter":v=>v.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()),
"text-reverser":v=>Array.from(v).reverse().join(""),
"remove-extra-spaces":v=>v.replace(/\s+/g," ").trim(),
"remove-duplicate-lines":v=>Array.from(new Set(v.split(/\r?\n/u))).join("\n"),
"sort-lines":v=>v.split(/\r?\n/u).sort((a,b)=>a.localeCompare(b)).join("\n"),
"text-to-slug":v=>v.toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-|-$/g,""),
"text-to-csv":v=>v.split(/\r?\n/u).map(line=>line.split(",").map(cell=>`"${cell.replace(/"/g,`""`)}"`).join(",")).join("\n"),
"csv-to-text":v=>v.split(/\r?\n/u).map(line=>line.split(",").map(cell=>cell.replace(/^"|"$/g,"").replace(/""/g,`"`)).join(" | ")).join("\n"),
"character-frequency":v=>{const m=new Map();for(const ch of v){if(ch.trim())m.set(ch,(m.get(ch)||0)+1)}return [...m.entries()].sort((a,b)=>b[1]-a[1]).map(([ch,n])=>`${ch}: ${n}`).join("\n")},
"regex-tester":v=>{const [pattern,flags,...parts]=v.split("\n");const text=parts.join("\n");const re=new RegExp(pattern,flags||"");const matches=[...text.matchAll(new RegExp(re.source,re.flags.includes("g")?re.flags:re.flags+"g"))];return JSON.stringify(matches.map(m=>m[0]))},
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
"bmi-calculator":v=>{const [w,h]=v.split(/[,\\s]+/).filter(Boolean).map(Number);if(!(w>0&&h>0))throw new Error("Use weight kg and height cm");return String((w/Math.pow(h/100,2)).toFixed(2))},
"json-stringify":v=>JSON.stringify(v),
"json-parse-viewer":v=>JSON.stringify(JSON.parse(v),null,2),
"html-escape":v=>v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"),
"html-unescape":v=>{const e=document.createElement("textarea");e.innerHTML=v;return e.value},
"json-to-yaml":v=>Object.entries(JSON.parse(v)).map(([k,val])=>k+": "+JSON.stringify(val)).join("\n"),
"lorem-ipsum-generator":v=>Array(Math.max(1,Number(v)||3)).fill("Lorem ipsum dolor sit amet, consectetur adipiscing elit.").join(" ")
};


export function render({tool}){
  if(tool.category==="image"){
    return `<div class="tool-form"><div class="tool-toolbar"><span class="tool-toolbar-title">${tool.bn||tool.name}</span></div><input id="imageFile" type="file" accept="image/*"><div class="tool-actions" style="margin-top:10px"><button class="tool-action" id="imageRun" type="button">প্রসেস করুন</button><a class="tool-action" id="imageDownload" hidden download>ডাউনলোড</a></div><label id="imageQualityWrap" style="display:block;margin-top:10px">Quality <input id="imageQuality" type="range" min="0.1" max="1" step="0.05" value="0.8"></label><div id="imagePreview" style="margin-top:12px"></div><p class="tool-note">Image processing আপনার ব্রাউজারেই হয়; ফাইল সার্ভারে আপলোড করা হয় না।</p></div>`;
  }
  return `<div class="tool-form"><div class="tool-toolbar"><span class="tool-toolbar-title">${tool.bn||tool.name}</span><div class="tool-actions"><button class="tool-action" id="utilityRun" type="button">চালান</button><button class="tool-action" id="utilityClear" type="button">মুছে ফেলুন</button></div></div><textarea id="utilityInput" rows="8" placeholder="ইনপুট দিন…"></textarea><textarea id="utilityOutput" rows="8" readonly placeholder="ফলাফল এখানে দেখা যাবে…"></textarea><p class="tool-note">টুলটি আপনার ব্রাউজারেই কাজ করে; ইনপুট সার্ভারে পাঠানো হয় না।</p></div>`;
}
export function mount({tool,root}){
  if(tool.category==="image"){
    const file=root.querySelector("#imageFile"),runBtn=root.querySelector("#imageRun"),download=root.querySelector("#imageDownload"),preview=root.querySelector("#imagePreview");
    const run=()=>{const f=file.files?.[0];if(!f)return;const img=new Image();img.onload=()=>{const c=document.createElement("canvas");let w=img.naturalWidth,h=img.naturalHeight;
      if(tool.id==="image-resizer"){w=Math.min(2400,w);h=Math.round(img.naturalHeight*(w/img.naturalWidth))}
      if(tool.id==="image-cropper"){const s=Math.min(w,h);const sx=(w-s)/2,sy=(h-s)/2;c.width=c.height=s;c.getContext("2d").drawImage(img,sx,sy,s,s,0,0,s,s)}
      else {c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h)}
      const isPng=tool.id==="jpg-to-png",isWebp=["jpg-to-webp","png-to-webp"].includes(tool.id),type=isPng?"image/png":isWebp?"image/webp":"image/jpeg";
      const q=Number(root.querySelector("#imageQuality")?.value||.8);c.toBlob(b=>{if(!b)return;const url=URL.createObjectURL(b);download.href=url;download.download=(tool.id||"image")+(type==="image/png"?".png":type==="image/webp"?".webp":".jpg");download.hidden=false;preview.innerHTML=`<img src="${url}" alt="Processed preview" style="max-width:100%;height:auto;border-radius:10px">`},type,q);
    };img.src=URL.createObjectURL(f)};
    runBtn.addEventListener("click",run);return;
  }
  const input=root.querySelector("#utilityInput"),output=root.querySelector("#utilityOutput");
  const run=async()=>{try{let fn=operations[tool.id];if(tool.id==="sha256-hash"){const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(input.value));fn=()=>Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("")}if(!fn)throw new Error("Operation not implemented");output.value=await fn(input.value)}catch(e){output.value="Error: "+e.message}};
  root.querySelector("#utilityRun").addEventListener("click",run);
  root.querySelector("#utilityClear").addEventListener("click",()=>{input.value="";output.value="";input.focus()});
  if(["uuid-generator","timestamp-generator","random-password","random-password-generator","timestamp-generator","unix-time-now","uuid-bulk-generator"].includes(tool.id))run();
}
export {MODULE_VERSION,operations};
