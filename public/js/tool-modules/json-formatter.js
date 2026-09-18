const MODULE_VERSION="2026.09.19.3";

const formatError=error=>{
  const message=String(error?.message||"Invalid JSON");
  const match=message.match(/position (\d+)/i);
  if(!match)return message;
  const pos=Number(match[1]);
  return message+" • অবস্থান "+pos;
};

export function render(){
  return `<div class="tool-form">
    <div class="tool-toolbar">
      <span class="tool-toolbar-title">JSON Workspace</span>
      <div class="tool-actions">
        <button class="tool-action" id="jsonExample" type="button">উদাহরণ</button>
        <button class="tool-action" id="jsonCopy" type="button">কপি</button>
        <button class="tool-action" id="jsonClear" type="button">পরিষ্কার</button>
      </div>
    </div>
    <textarea id="jsonInput" rows="12" spellcheck="false" placeholder='{"name":"Toolkit Pro"}' aria-label="JSON ইনপুট"></textarea>
    <div class="actions">
      <button class="primary" id="format" type="button">সুন্দরভাবে ফরম্যাট</button>
      <button class="secondary" id="minify" type="button">মিনিফাই</button>
    </div>
    <div id="jsonStatus" class="status" role="status" aria-live="polite"></div>
    <pre id="jsonOutput" class="code-output" aria-label="JSON আউটপুট"></pre>
  </div>`;
}

export function mount(){
  const i=document.getElementById("jsonInput"),o=document.getElementById("jsonOutput"),s=document.getElementById("jsonStatus");
  if(!i||!o||!s)return;
  let lastValue=null;
  const validate=()=>{
    const raw=i.value.trim();
    if(!raw){s.textContent="";s.className="status";lastValue=null;return null;}
    try{
      const value=JSON.parse(raw);
      lastValue=value;
      const size=new Blob([raw]).size;
      s.textContent="✓ বৈধ JSON • "+raw.length+" অক্ষর • "+size+" bytes";
      s.className="status success";
      return value;
    }catch(error){
      lastValue=null;
      s.textContent="✕ JSON সঠিক নয় • "+formatError(error);
      s.className="status error";
      return null;
    }
  };
  const write=value=>{o.textContent=value;};
  i.addEventListener("input",validate);
  document.getElementById("format")?.addEventListener("click",()=>{
    const v=validate();
    if(v!==null)write(JSON.stringify(v,null,2));
  });
  document.getElementById("minify")?.addEventListener("click",()=>{
    const v=validate();
    if(v!==null)write(JSON.stringify(v));
  });
  document.getElementById("jsonExample")?.addEventListener("click",()=>{
    i.value=JSON.stringify({name:"Toolkit Pro",version:2,features:["format","validate","minify"],active:true},null,2);
    validate();write(i.value);i.focus();
  });
  document.getElementById("jsonCopy")?.addEventListener("click",async()=>{
    if(!o.textContent)return;
    try{await navigator.clipboard.writeText(o.textContent)}catch{}
  });
  document.getElementById("jsonClear")?.addEventListener("click",()=>{
    i.value="";o.textContent="";s.textContent="";s.className="status";lastValue=null;i.focus();
  });
  validate();
}
export {MODULE_VERSION};