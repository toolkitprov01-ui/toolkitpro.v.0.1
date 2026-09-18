const LEGAL_APP_VERSION="2026.09.18.4";
const root=document.documentElement;
const saved=localStorage.getItem("theme")||"light";
root.dataset.theme=saved;
const b=document.getElementById("themeToggle");
const i=document.getElementById("themeIcon");

function setTheme(t){
  root.dataset.theme=t;
  localStorage.setItem("theme",t);
  if(i)i.textContent=t==="dark"?"☀":"◐";
  if(b)b.setAttribute("aria-label",t==="dark"?"লাইট মোড চালু করুন":"ডার্ক মোড চালু করুন");
}

b?.addEventListener("click",()=>setTheme(root.dataset.theme==="dark"?"light":"dark"));

const y=document.getElementById("year");
if(y)y.textContent=new Date().getFullYear();

window.ToolkitProLegalVersion=LEGAL_APP_VERSION;