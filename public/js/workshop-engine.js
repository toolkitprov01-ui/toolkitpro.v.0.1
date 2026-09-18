const WORKSHOP_ENGINE_VERSION="2026.09.18.1";
import {loadToolModule} from "./tool-engine.js";

const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

export async function mountWorkshop({tool,root}){
  if(!tool||!root) throw new Error("Workshop requires a tool and root");
  root.innerHTML='<section class="tool-workshop" aria-labelledby="workshop-title"><header class="workshop-header"><div class="workshop-icon" aria-hidden="true">'+esc(tool.icon||"🔧")+'</div><div><h1 id="workshop-title">'+esc(tool.bn||tool.name)+'</h1><p>'+esc(tool.description||"")+'</p></div></header><div class="workshop-body" id="workshop-body"><div class="tool-help">Loading tool…</div></div></section>';
  try{
    const mod=await loadToolModule(tool);
    const body=root.querySelector("#workshop-body");
    if(typeof mod.render==="function") body.innerHTML=mod.render({tool});
    if(typeof mod.mount==="function") await mod.mount({tool,root:body});
  }catch(error){
    root.querySelector("#workshop-body").innerHTML='<div class="seo-check warn"><strong>Tool failed to load</strong><span>Please refresh and try again.</span></div>';
    console.error("Workshop load error",tool.id,error);
  }
}
export {WORKSHOP_ENGINE_VERSION};
