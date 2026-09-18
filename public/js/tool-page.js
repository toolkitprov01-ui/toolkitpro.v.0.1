const TOOL_PAGE_VERSION="2026.09.18.2";
import {mountWorkshop} from "./workshop-engine.js";

const root=document.getElementById("toolRoot");
document.getElementById("year").textContent=new Date().getFullYear();

document.getElementById("themeToggle")?.addEventListener("click",()=>{
  const next=document.documentElement.dataset.theme==="dark"?"light":"dark";
  document.documentElement.dataset.theme=next;
  localStorage.setItem("theme",next);
  const icon=document.getElementById("themeIcon");
  if(icon)icon.textContent=next==="dark"?"☀":"◐";
});

document.getElementById("menuToggle")?.addEventListener("click",()=>{
  const menu=document.getElementById("mobileMenu");
  const button=document.getElementById("menuToggle");
  const open=!menu.classList.contains("active");
  menu.classList.toggle("active",open);
  button.setAttribute("aria-expanded",String(open));
});

async function loadTool(){
  const id=window.__TOOL_ID__;
  if(!id) throw new Error("Tool ID is missing from page");

  const response=await fetch("/api/tools/"+encodeURIComponent(id),{
    headers:{Accept:"application/json"},
    cache:"no-store"
  });

  if(!response.ok) throw new Error("Tool API returned HTTP "+response.status);

  const data=await response.json();
  if(!data?.success||!data?.tool) throw new Error("Tool API returned an invalid response");

  await mountWorkshop({tool:data.tool,root});
}

loadTool().catch(error=>{
  console.error("Tool page load error",error);
  root.innerHTML='<section class="tool-workshop"><div class="seo-check warn"><strong>টুল লোড করা যাচ্ছে না</strong><span>API সঠিক হলেও টুলটি চালু হতে সমস্যা হয়েছে। পেজটি রিফ্রেশ করুন।</span></div></section>';
});

window.ToolkitProToolPageVersion=TOOL_PAGE_VERSION;
