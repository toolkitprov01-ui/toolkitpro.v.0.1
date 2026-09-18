const root=document.documentElement;
const cards=document.querySelector("#tool-cards");
const year=document.querySelector("#year");
if(year) year.textContent=new Date().getFullYear();

function applyTheme(theme){
  root.dataset.theme=theme;
  localStorage.setItem("toolkit-theme",theme);
  const btn=document.querySelector("#themeToggle");
  if(btn){btn.textContent=theme==="dark"?"☀️":"🌙";btn.setAttribute("aria-label",theme==="dark"?"লাইট মোড চালু করুন":"ডার্ক মোড চালু করুন");}
}
applyTheme(localStorage.getItem("toolkit-theme")||"light");
document.querySelector("#themeToggle")?.addEventListener("click",()=>applyTheme(root.dataset.theme==="dark"?"light":"dark"));
document.querySelector("#langToggle")?.addEventListener("click",()=>alert("English interface will be added when the bilingual content set is ready."));

document.querySelector("#heroSearch")?.addEventListener("submit",(e)=>{
 e.preventDefault(); const q=document.querySelector("#heroSearchInput").value.trim();
 location.href=q?"/tools.html?search="+encodeURIComponent(q):"/tools.html";
});

fetch("/api/tools").then(r=>{if(!r.ok)throw new Error("API error");return r.json()}).then(({tools=[]})=>{
 const count=document.querySelector("#toolCount"); if(count)count.textContent=tools.length;
 if(!cards)return;
 cards.innerHTML=tools.map(t=>`<a class="card" href="/tools.html?tool=${encodeURIComponent(t.id)}" aria-label="${t.bn} ব্যবহার করুন"><div class="tool-icon" aria-hidden="true">${t.icon}</div><div><h3>${t.bn}</h3><p>${t.description}</p></div><span aria-hidden="true">→</span></a>`).join("");
}).catch(()=>{if(cards)cards.innerHTML="<div class='empty'>টুল লোড করা যায়নি। আবার চেষ্টা করুন।</div>";});