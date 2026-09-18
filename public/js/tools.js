import { loadToolModule } from "./tool-engine.js";
const $=s=>document.querySelector(s),state={tools:[],category:"all"};
const workspace=$("#workspace"),cards=$("#cards"),search=$("#search"),panel=$("#panel"),filters=$("#filters");
$("#year").textContent=new Date().getFullYear();
function filtered(){const q=search.value.trim().toLowerCase();return state.tools.filter(t=>(state.category==="all"||t.category===state.category)&&(!q||[t.name,t.bn,t.description,t.categoryBn,t.category].join(" ").toLowerCase().includes(q)));}
function renderFilters(){const c=[["all","সব টুলস"],...Array.from(new Map(state.tools.map(t=>[t.category,t.categoryBn||t.category])).entries())];filters.innerHTML=c.map(([id,l])=>`<button class="filter ${state.category===id?"active":""}" data-category="${id}" type="button">${l}<span>${id==="all"?state.tools.length:state.tools.filter(t=>t.category===id).length}</span></button>`).join("");}
function render(){cards.innerHTML=filtered().map(t=>`<button class="card tool-card" type="button" data-id="${t.id}"><div class="tool-icon">${t.icon}</div><div><h3>${t.bn}</h3><p>${t.description}</p><small>${t.categoryBn||t.category}</small></div><span>→</span></button>`).join("")||"<p class='empty'>কোনো টুল পাওয়া যায়নি।</p>";}
function closeTool(push=true){workspace.hidden=true;document.body.classList.remove("tool-active");if(push)history.pushState({},"","/tools.html");}
async function openTool(id,push=true){const t=state.tools.find(x=>x.id===id);if(!t){closeTool(false);return}workspace.hidden=false;document.body.classList.add("tool-active");$("#toolIcon").textContent=t.icon;$("#toolTitle").textContent=t.bn;$("#toolDescription").textContent=t.description;panel.innerHTML="<div class='loading'>টুল প্রস্তুত হচ্ছে…</div>";try{const m=await loadToolModule(t);panel.innerHTML=m.render();m.mount?.();if(push)history.pushState({tool:id},"",`/tools.html?tool=${encodeURIComponent(id)}`);workspace.scrollIntoView({behavior:"smooth",block:"start"});}catch(e){panel.innerHTML="<div class='status error'>এই টুলটি এখন প্রস্তুত করা যাচ্ছে না।</div>";console.error(e)}}
filters.addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(!b)return;state.category=b.dataset.category;renderFilters();render()});
cards.addEventListener("click",e=>{const b=e.target.closest("[data-id]");if(b)openTool(b.dataset.id)});
search.addEventListener("input",render);$("#close").onclick=()=>closeTool();
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();search.focus()}if(e.key==="Escape"&&!workspace.hidden)closeTool()});
window.addEventListener("popstate",()=>{const id=new URLSearchParams(location.search).get("tool");id?openTool(id,false):closeTool(false)});
fetch("/api/tools").then(r=>r.json()).then(({tools})=>{state.tools=tools;renderFilters();render();const id=new URLSearchParams(location.search).get("tool");if(id)openTool(id,false)}).catch(()=>cards.innerHTML="<p class='empty'>টুল লোড করা যায়নি।</p>");
