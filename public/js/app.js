const root=document.documentElement;let allTools=[];const APP_VERSION="2026.09.18.3";const categoryIcons={text:"📝",developer:"💻",security:"🔐",image:"🖼️",seo:"🌐",other:"🧰"};const byId=id=>document.getElementById(id);
function applyTheme(theme){root.dataset.theme=theme;localStorage.setItem("theme",theme);const icon=byId("themeIcon"),btn=byId("themeToggle");if(icon)icon.className=theme==="dark"?"fas fa-sun":"fas fa-moon";if(btn)btn.setAttribute("aria-label",theme==="dark"?"লাইট মোড চালু করুন":"ডার্ক মোড চালু করুন");}
function toggleMobileMenu(){const menu=byId("mobileMenu"),btn=byId("menuToggle");const open=!menu.classList.contains("active");menu.classList.toggle("active",open);btn.setAttribute("aria-expanded",String(open));btn.setAttribute("aria-label",open?"মোবাইল মেনু বন্ধ করুন":"মোবাইল মেনু খুলুন");}
function handleSearch(){const q=byId("searchInput").value.trim();location.href=q?"/tools.html?search="+encodeURIComponent(q):"/tools.html";}
function categoryLabel(c){return({text:"Text",developer:"Developer",security:"Security",image:"Image",seo:"SEO"})[c]||c;}
function categoryCard(category,count){return '<a href="/tools.html?category='+encodeURIComponent(category)+'" class="category-card"><span class="category-icon" aria-hidden="true">'+(categoryIcons[category]||"🧰")+'</span><div class="category-name">'+categoryLabel(category)+'</div><div class="category-count">'+count+' টুলস</div></a>';}
function toolCard(t){return '<a href="/tools.html?tool='+encodeURIComponent(t.id)+'" class="tool-card" aria-label="'+t.bn+' ব্যবহার করুন"><span class="tool-icon" aria-hidden="true">'+(t.icon||"🔧")+'</span><div class="tool-name">'+t.bn+'</div><p class="tool-description">'+(t.description||"")+'</p><div class="tool-meta"><span class="tool-rating">● দরকারি</span><span class="tool-usage">'+categoryLabel(t.category)+'</span></div></a>';}
function render(){const cats={};allTools.forEach(t=>cats[t.category]=(cats[t.category]||0)+1);byId("toolCount").textContent=allTools.length;byId("categoryCount").textContent=Object.keys(cats).length;byId("popularTools").innerHTML=allTools.map(toolCard).join("")||'<div class="no-data">কোনো টুল পাওয়া যায়নি।</div>';byId("newTools").innerHTML=allTools.slice(-12).reverse().map(toolCard).join("")||'<div class="no-data">কোনো টুল পাওয়া যায়নি।</div>';byId("categoriesGrid").innerHTML=Object.entries(cats).map(([c,n])=>categoryCard(c,n)).join("");}
document.addEventListener("DOMContentLoaded",async()=>{applyTheme(localStorage.getItem("theme")||"light");byId("themeToggle")?.addEventListener("click",()=>applyTheme(root.dataset.theme==="dark"?"light":"dark"));byId("menuToggle")?.addEventListener("click",toggleMobileMenu);byId("searchForm")?.addEventListener("submit",e=>{e.preventDefault();handleSearch();});byId("langBtn")?.addEventListener("click",()=>alert("English interface will be added with the bilingual release."));byId("year")&&(byId("year").textContent=new Date().getFullYear());try{const r=await fetch("/api/tools",{headers:{Accept:"application/json"}});if(!r.ok)throw new Error("API error");const data=await r.json();allTools=Array.isArray(data.tools)?data.tools:[];render();}catch(e){["popularTools","newTools","categoriesGrid"].forEach(id=>{const el=byId(id);if(el)el.innerHTML='<div class="no-data">টুল লোড করা যায়নি। পরে আবার চেষ্টা করুন।</div>';});}});


/* Header dropdown interaction */
const dropdowns=[...document.querySelectorAll(".nav-dropdown")];
function closeDropdowns(except=null){
  dropdowns.forEach(d=>{if(d!==except){d.classList.remove("is-open");const b=d.querySelector(".nav-dropdown-toggle");if(b)b.setAttribute("aria-expanded","false");}});
}
dropdowns.forEach(dropdown=>{
  const button=dropdown.querySelector(".nav-dropdown-toggle");
  button?.addEventListener("click",e=>{
    e.preventDefault();
    const open=!dropdown.classList.contains("is-open");
    closeDropdowns(open?dropdown:null);
    dropdown.classList.toggle("is-open",open);
    button.setAttribute("aria-expanded",String(open));
  });
  dropdown.querySelectorAll(".nav-dropdown-menu a").forEach(link=>{
    link.addEventListener("click",()=>closeDropdowns());
  });
});
document.addEventListener("click",e=>{
  if(!e.target.closest(".nav-dropdown"))closeDropdowns();
});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){closeDropdowns();document.querySelector(".nav-dropdown-toggle[aria-expanded=\"true\"]")?.focus();}
});

window.ToolkitProAppVersion=APP_VERSION;
