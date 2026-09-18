const MODULE_VERSION="2026.09.19.2";

const countWords=v=>v.trim()?v.trim().split(/\s+/u).length:0;
const countLines=v=>v?v.split(/\r?\n/u).length:0;
const countSentences=v=>v.trim()?(v.match(/[^.!?…。！？]+[.!?…。！？]+(?=\s|$)/gu)||[]).length+(/[.!?…。！？]$/u.test(v.trim())?0:0):0;
const countParagraphs=v=>v.trim()?v.trim().split(/\n\s*\n/u).filter(Boolean).length:0;

export function render(){
  return `<div class="tool-form">
    <div class="tool-toolbar">
      <span class="tool-toolbar-title">আপনার লেখা</span>
      <div class="tool-actions">
        <button class="tool-action" id="wcPaste" type="button">পেস্ট</button>
        <button class="tool-action" id="wcCopy" type="button">ফলাফল কপি</button>
        <button class="tool-action" id="wcClear" type="button">মুছে ফেলুন</button>
      </div>
    </div>
    <textarea id="wcInput" rows="12" placeholder="এখানে লেখা লিখুন…" aria-label="লেখা লিখুন"></textarea>
    <div class="tool-stats" aria-live="polite">
      <div class="tool-stat"><strong id="wcWords">0</strong><span>শব্দ</span></div>
      <div class="tool-stat"><strong id="wcChars">0</strong><span>অক্ষর</span></div>
      <div class="tool-stat"><strong id="wcNoSpace">0</strong><span>স্পেস ছাড়া</span></div>
      <div class="tool-stat"><strong id="wcLines">0</strong><span>লাইন</span></div>
      <div class="tool-stat"><strong id="wcSentences">0</strong><span>বাক্য</span></div>
      <div class="tool-stat"><strong id="wcParagraphs">0</strong><span>প্যারাগ্রাফ</span></div>
    </div>
    <div class="tool-note" id="wcSummary">আনুমানিক পড়ার সময়: 0 মিনিট</div>
  </div>`;
}

export function mount(){
  const root=document.getElementById("wcInput");
  if(!root)return;
  const update=()=>{
    const v=root.value;
    const words=countWords(v);
    document.getElementById("wcWords").textContent=words;
    document.getElementById("wcChars").textContent=v.length;
    document.getElementById("wcNoSpace").textContent=v.replace(/\s/gu,"").length;
    document.getElementById("wcLines").textContent=countLines(v);
    document.getElementById("wcSentences").textContent=countSentences(v);
    document.getElementById("wcParagraphs").textContent=countParagraphs(v);
    document.getElementById("wcSummary").textContent=`আনুমানিক পড়ার সময়: ${words?Math.max(1,Math.ceil(words/200)):0} মিনিট • গড় 200 শব্দ/মিনিট`;
  };
  document.getElementById("wcClear")?.addEventListener("click",()=>{root.value="";update();root.focus()});
  document.getElementById("wcPaste")?.addEventListener("click",async()=>{try{root.value=await navigator.clipboard.readText();update();root.focus()}catch{root.focus()}});
  document.getElementById("wcCopy")?.addEventListener("click",async()=>{
    const text=[`শব্দ: ${document.getElementById("wcWords").textContent}`,`অক্ষর: ${document.getElementById("wcChars").textContent}`,`স্পেস ছাড়া: ${document.getElementById("wcNoSpace").textContent}`,`লাইন: ${document.getElementById("wcLines").textContent}`,`বাক্য: ${document.getElementById("wcSentences").textContent}`,`প্যারাগ্রাফ: ${document.getElementById("wcParagraphs").textContent}`].join("\n");
    try{await navigator.clipboard.writeText(text)}catch{}
  });
  root.addEventListener("input",update);
  update();
}
export {MODULE_VERSION};