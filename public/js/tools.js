const TOOLS_APP_VERSION="2026.09.18.8";
import {mountWorkshop} from "./workshop-engine.js";
const $=s=>document.querySelector(s),state={tools:[],category:"all",searchResults:null};const workspace=$("#workspace"),cards=$("#cards"),search=$("#search"),panel=$("#panel"),filters=$("#filters");
$("#year").textContent=new Date().getFullYear();
function filtered(){const q=new URLSearchParams(location.search).get("search")||search.value.trim();if(q&&!search.value)search.value=q;return state.tools.filter(t=>(state.category==="all"||t.category===state.category)&&(!q||[t.name,t.bn,t.description,t.categoryBn,t.category].join(" ").toLowerCase().includes(q.toLowerCase())));}
function renderFilters(){const c=[["all","সব টুলস"],...Array.from(new Map(state.tools.map(t=>[t.category,t.categoryBn||t.category])).entries())];filters.innerHTML=c.map(([id,l])=>`<button class="filter ${state.category===id?"active":""}" data-category="${id}" type="button"><span>${l}</span><b>${id==="all"?state.tools.length:state.tools.filter(t=>t.category===id).length}</b></button>`).join("");}
function render(){cards.innerHTML=filtered().map(t=>`<button class="card tool-card" type="button" data-id="${t.id}"><div class="tool-icon" aria-hidden="true">${t.icon}</div><div class="card-copy"><h3>${t.bn}</h3><p>${t.description}</p><small>${t.categoryBn||t.category}</small></div><span class="card-arrow" aria-hidden="true">→</span></button>`).join("")||"<p class='empty'>কোনো টুল পাওয়া যায়নি।</p>";}
function closeTool(push=true){workspace.hidden=true;document.body.classList.remove("tool-active");if(push)history.pushState({}, "", "/tools.html");}
async function openTool(id,push=true){const t=state.tools.find(x=>x.id===id);if(!t){closeTool(false);return}workspace.hidden=false;document.body.classList.add("tool-active");$("#toolIcon").textContent=t.icon;$("#toolTitle").textContent=t.bn;$("#toolDescription").textContent=t.description;panel.innerHTML="<div class='loading'>টুল প্রস্তুত হচ্ছে…</div>";try{await mountWorkshop({tool:t,root:panel});if(push)location.href=`/tool/${encodeURIComponent(id)}`;workspace.scrollIntoView({behavior:"smooth",block:"start");}catch(e){panel.innerHTML="<div class='status error'>এই টুলটি এখন প্রস্তুত করা যাচ্ছে না।</div>";console.error(e);}}
filters.addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(!b)return;state.category=b.dataset.category;renderFilters();search.value.trim()?searchRemote():render()});cards.addEventListener("click",e=>{const b=e.target.closest("[data-id]");if(b)openTool(b.dataset.id)});let searchTimer;
async function searchRemote(){
  clearTimeout(searchTimer);
  searchTimer=setTimeout(async()=>{
    const q=search.value.trim();
    if(!q){render();return}
    try{
      const params=new URLSearchParams({q,limit:"100"});
      if(state.category!=="all")params.set("category",state.category);
      const r=await fetch("/api/search?"+params,{headers:{Accept:"application/json"}});
      if(!r.ok)throw new Error();
      const data=await r.json();
      state.searchResults=Array.isArray(data.results)?data.results:[];
      cards.innerHTML=state.searchResults.map(t=>`<button class="card tool-card" type="button" data-id="${t.id}"><div class="tool-icon" aria-hidden="true">${t.icon}</div><div class="card-copy"><h3>${t.bn}</h3><p>${t.description}</p><small>${t.categoryBn||t.category}</small></div><span class="card-arrow" aria-hidden="true">→</span></button>`).join("")||"<p class='empty'>কোনো টুল পাওয়া যায়নি।</p>";
    }catch(e){render()}
  },180);
}
search.addEventListener("input",searchRemote);$("#close").onclick=()=>closeTool();
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();search.focus()}if(e.key==="Escape"&&!workspace.hidden)closeTool()});$("#themeToggle")?.addEventListener("click",()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==="dark"?"light":"dark";localStorage.setItem("theme",document.documentElement.dataset.theme);const i=$("#themeIcon");if(i)i.className=document.documentElement.dataset.theme==="dark"?"fas fa-sun":"fas fa-moon";});
$("#menuToggle")?.addEventListener("click",()=>{const m=$("#mobileMenu"),b=$("#menuToggle"),open=!m.classList.contains("active");m.classList.toggle("active",open);b.setAttribute("aria-expanded",String(open));});
window.addEventListener("popstate",()=>{const id=new URLSearchParams(location.search).get("tool");id?openTool(id,false):closeTool(false)});fetch("/api/tools",{headers:{Accept:"application/json"}}).then(r=>{if(!r.ok)throw new Error();return r.json()}).then(({tools})=>{state.tools=Array.isArray(tools)?tools:[];renderFilters();render();const id=new URLSearchParams(location.search).get("tool");if(id)openTool(id,false)}).catch(()=>cards.innerHTML="<p class='empty'>টুল লোড করা যায়নি। পরে আবার চেষ্টা করুন।</p>");

window.ToolkitProToolsVersion=TOOLS_APP_VERSION;
