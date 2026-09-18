const $=s=>document.querySelector(s);
const state={tools:[],category:"all"};
const workspace=$("#workspace"),cards=$("#cards"),search=$("#search"),panel=$("#panel");
$("#year").textContent=new Date().getFullYear();

function esc(v){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function filtered(){
 const q=search.value.trim().toLowerCase();
 return state.tools.filter(t=>(state.category==="all"||t.category===state.category)&&(!q||[t.name,t.bn,t.description,t.category].join(" ").toLowerCase().includes(q)));
}
function render(){
 cards.innerHTML=filtered().map(t=>`<button class="card tool-card" type="button" data-id="${t.id}"><div class="tool-icon">${t.icon}</div><div><h3>${t.bn}</h3><p>${t.description}</p><small>${t.category}</small></div><span>→</span></button>`).join("")||"<p>কোনো টুল পাওয়া যায়নি।</p>";
}
function hide(push=true){workspace.hidden=true;document.body.classList.remove("tool-active");if(push)history.pushState({}, "", "/tools.html");}
function show(id,push=true){
 const t=state.tools.find(x=>x.id===id); if(!t){hide(false);return;}
 workspace.hidden=false;document.body.classList.add("tool-active");
 $("#toolIcon").textContent=t.icon;$("#toolTitle").textContent=t.bn;$("#toolDescription").textContent=t.description;
 panel.innerHTML=templates[t.id]();bindTool(t.id);
 if(push)history.pushState({tool:id},"",`/tools.html?tool=${encodeURIComponent(id)}`);
 workspace.scrollIntoView({behavior:"smooth",block:"start"});
}
const templates={
 "word-counter":()=>`<textarea id="wcInput" rows="10" placeholder="এখানে লেখা লিখুন…"></textarea><div class="stats"><b><span id="wcWords">0</span> শব্দ</b><b><span id="wcChars">0</span> অক্ষর</b><b><span id="wcLines">0</span> লাইন</b></div>`,
 "json-formatter":()=>`<textarea id="jsonInput" rows="12" placeholder='{"name":"Toolkit Pro"}'></textarea><div class="actions"><button class="primary" id="format">ফরম্যাট</button><button class="ghost" id="minify">মিনিফাই</button><button class="ghost" id="clear">পরিষ্কার</button></div><pre id="jsonOutput"></pre><p id="jsonStatus" class="status"></p>`,
 "password-generator":()=>`<div class="pw-row"><label>দৈর্ঘ্য <output id="pwLen">16</output></label><input id="pwRange" type="range" min="8" max="64" value="16"></div><div class="checks"><label><input id="pwUpper" type="checkbox" checked> বড় হাতের অক্ষর</label><label><input id="pwLower" type="checkbox" checked> ছোট হাতের অক্ষর</label><label><input id="pwNum" type="checkbox" checked> সংখ্যা</label><label><input id="pwSymbol" type="checkbox" checked> Symbol</label></div><div class="password-output"><input id="pwOutput" readonly><button class="primary" id="pwGenerate">তৈরি করুন</button><button class="ghost" id="pwCopy">কপি</button></div>`
};
function bindTool(id){
 if(id==="word-counter"){const i=$("#wcInput"),update=()=>{const v=i.value;$("#wcWords").textContent=v.trim()?v.trim().split(/\s+/u).length:0;$("#wcChars").textContent=v.length;$("#wcLines").textContent=v?v.split(/\r?\n/).length:0};i.addEventListener("input",update);}
 if(id==="json-formatter"){const i=$("#jsonInput"),o=$("#jsonOutput"),s=$("#jsonStatus");function parse(){try{const p=JSON.parse(i.value);s.textContent="✓ Valid JSON";return p}catch(e){s.textContent=i.value.trim()?"✕ Invalid JSON":" ";return null}}i.addEventListener("input",parse);$("#format").onclick=()=>{const p=parse();if(p)o.textContent=JSON.stringify(p,null,2)};$("#minify").onclick=()=>{const p=parse();if(p)o.textContent=JSON.stringify(p)};$("#clear").onclick=()=>{i.value="";o.textContent="";s.textContent=""};}
 if(id==="password-generator"){const out=$("#pwOutput"),range=$("#pwRange");const generate=()=>{const sets=[];if($("#pwUpper").checked)sets.push("ABCDEFGHJKLMNPQRSTUVWXYZ");if($("#pwLower").checked)sets.push("abcdefghijkmnopqrstuvwxyz");if($("#pwNum").checked)sets.push("23456789");if($("#pwSymbol").checked)sets.push("!@#$%^&*()-_=+[]{}");if(!sets.length)return;const all=sets.join(""),bytes=new Uint32Array(+range.value),arr=[];crypto.getRandomValues(bytes);for(let n=0;n<bytes.length;n++)arr.push(all[bytes[n]%all.length]);for(let n=0;n<sets.length;n++){const b=new Uint32Array(1);crypto.getRandomValues(b);arr[n]=sets[n][b[0]%sets[n].length]}out.value=arr.join("")};range.oninput=()=>$("#pwLen").textContent=range.value;$("#pwGenerate").onclick=generate;$("#pwCopy").onclick=async()=>{if(out.value)await navigator.clipboard.writeText(out.value)};generate();}
}
cards.addEventListener("click",e=>{const b=e.target.closest("[data-id]");if(b)show(b.dataset.id);});
search.addEventListener("input",render);$("#close").onclick=()=>hide();
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();search.focus()}if(e.key==="Escape"&&!workspace.hidden)hide();});
window.addEventListener("popstate",()=>{const id=new URLSearchParams(location.search).get("tool");id?show(id,false):hide(false);});
fetch("/api/tools").then(r=>r.json()).then(({tools})=>{state.tools=tools;render();const id=new URLSearchParams(location.search).get("tool");if(id)show(id,false);}).catch(()=>cards.innerHTML="<p>টুল লোড করা যায়নি।</p>");
