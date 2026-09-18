const MODULE_VERSION="2026.09.18.10";

export function render(){
  return `<div class="tool-form">
    <div class="tool-toolbar">
      <span class="tool-toolbar-title">আপনার লেখা</span>
      <div class="tool-actions">
        <button class="tool-action" id="wcPaste" type="button">পেস্ট</button>
        <button class="tool-action" id="wcClear" type="button">মুছে ফেলুন</button>
      </div>
    </div>
    <textarea id="wcInput" rows="12" placeholder="এখানে লেখা লিখুন…" aria-label="লেখা লিখুন"></textarea>
    <div class="tool-stats" aria-live="polite">
      <div class="tool-stat"><strong id="wcWords">0</strong><span>শব্দ</span></div>
      <div class="tool-stat"><strong id="wcChars">0</strong><span>অক্ষর</span></div>
      <div class="tool-stat"><strong id="wcLines">0</strong><span>লাইন</span></div>
    </div>
    <p class="tool-note">লেখা টাইপ বা পেস্ট করার সঙ্গে সঙ্গে হিসাব আপডেট হবে।</p>
  </div>`;
}

export function mount(){
  const i=document.getElementById("wcInput");
  if(!i)return;
  const update=()=>{
    const v=i.value;
    document.getElementById("wcWords").textContent=v.trim()?v.trim().split(/\s+/u).length:0;
    document.getElementById("wcChars").textContent=v.length;
    document.getElementById("wcLines").textContent=v?v.split(/\r?\n/u).length:0;
  };
  document.getElementById("wcClear")?.addEventListener("click",()=>{i.value="";update();i.focus()});
  document.getElementById("wcPaste")?.addEventListener("click",async()=>{
    try{
      i.value=await navigator.clipboard.readText();
      update();
      i.focus();
    }catch{
      i.focus();
    }
  });
  i.addEventListener("input",update);
  update();
}

export {MODULE_VERSION};
