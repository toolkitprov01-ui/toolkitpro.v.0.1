const MODULE_VERSION="2026.09.18.9";

export function render(){
  return `<div class="tool-form"><textarea id="wcInput" rows="12" placeholder="এখানে লেখা লিখুন…" aria-label="লেখা লিখুন"></textarea><div class="stats"><div><strong id="wcWords">0</strong><span>শব্দ</span></div><div><strong id="wcChars">0</strong><span>অক্ষর</span></div><div><strong id="wcLines">0</strong><span>লাইন</span></div></div></div>`;
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
  i.addEventListener("input",update);
  update();
}

export {MODULE_VERSION};
