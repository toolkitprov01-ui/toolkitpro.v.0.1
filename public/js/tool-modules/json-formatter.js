const MODULE_VERSION="2026.09.18.10";

export function render(){
  return `<div class="tool-form"><textarea id="jsonInput" rows="12" placeholder='{"name":"Toolkit Pro"}' aria-label="JSON ইনপুট"></textarea><div class="actions"><button class="primary" id="format" type="button">ফরম্যাট</button><button class="secondary" id="minify" type="button">মিনিফাই</button><button class="secondary" id="clear" type="button">পরিষ্কার</button></div><div id="jsonStatus" class="status" role="status" aria-live="polite"></div><pre id="jsonOutput" class="code-output" aria-label="JSON আউটপুট"></pre></div>`;
}

export function mount(){
  const i=document.getElementById("jsonInput"),o=document.getElementById("jsonOutput"),s=document.getElementById("jsonStatus");
  if(!i||!o||!s)return;
  const parse=()=>{
    try{
      const v=JSON.parse(i.value);
      s.textContent="✓ বৈধ JSON";
      s.className="status success";
      return v;
    }catch{
      s.textContent=i.value.trim()?"✕ JSON সঠিক নয়":"";
      s.className=i.value.trim()?"status error":"status";
      return null;
    }
  };
  i.addEventListener("input",parse);
  document.getElementById("format")?.addEventListener("click",()=>{
    const v=parse();
    if(v!==null)o.textContent=JSON.stringify(v,null,2);
  });
  document.getElementById("minify")?.addEventListener("click",()=>{
    const v=parse();
    if(v!==null)o.textContent=JSON.stringify(v);
  });
  document.getElementById("clear")?.addEventListener("click",()=>{
    i.value="";o.textContent="";s.textContent="";s.className="status";
  });
}

export {MODULE_VERSION};
