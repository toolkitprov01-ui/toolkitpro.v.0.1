const MODULE_VERSION="2026.09.19.4";

const randomIndex=max=>{
  const limit=Math.floor(0x100000000/max)*max;
  const buf=new Uint32Array(1);
  do{crypto.getRandomValues(buf)}while(buf[0]>=limit);
  return buf[0]%max;
};

const strength=(length,sets)=>{
  const entropy=length*Math.log2(Math.max(1,sets));
  if(entropy<50)return ["দুর্বল",entropy];
  if(entropy<80)return ["মাঝারি",entropy];
  if(entropy<110)return ["শক্তিশালী",entropy];
  return ["খুব শক্তিশালী",entropy];
};

export function render(){
  return `<div class="tool-form">
    <div class="range-row"><label for="pwRange">দৈর্ঘ্য <output id="pwLen">20</output></label><input id="pwRange" type="range" min="8" max="128" value="20" aria-label="পাসওয়ার্ডের দৈর্ঘ্য"></div>
    <div class="checks">
      <label><input id="pwUpper" type="checkbox" checked> বড় হাতের অক্ষর</label>
      <label><input id="pwLower" type="checkbox" checked> ছোট হাতের অক্ষর</label>
      <label><input id="pwNum" type="checkbox" checked> সংখ্যা</label>
      <label><input id="pwSymbol" type="checkbox" checked> Symbol</label>
    </div>
    <div class="password-output"><input id="pwOutput" readonly aria-label="উৎপন্ন পাসওয়ার্ড"><button class="primary" id="pwGenerate" type="button">তৈরি করুন</button><button class="secondary" id="pwCopy" type="button">কপি</button></div>
    <div id="pwStrength" class="status" role="status" aria-live="polite"></div>
    <div id="pwStatus" class="status" role="status" aria-live="polite"></div>
    <p class="tool-note">পাসওয়ার্ড browser-এর Web Crypto API দিয়ে তৈরি হয়; সার্ভারে পাঠানো হয় না।</p>
  </div>`;
}

export function mount(){
  const o=document.getElementById("pwOutput"),r=document.getElementById("pwRange"),s=document.getElementById("pwStatus"),st=document.getElementById("pwStrength");
  const upper=document.getElementById("pwUpper"),lower=document.getElementById("pwLower"),num=document.getElementById("pwNum"),symbol=document.getElementById("pwSymbol"),len=document.getElementById("pwLen");
  if(!o||!r||!s||!st||!upper||!lower||!num||!symbol||!len)return;
  const generate=()=>{
    const sets=[];
    if(upper.checked)sets.push("ABCDEFGHJKLMNPQRSTUVWXYZ");
    if(lower.checked)sets.push("abcdefghijkmnopqrstuvwxyz");
    if(num.checked)sets.push("23456789");
    if(symbol.checked)sets.push("!@#$%^&*()-_=+[]{}");
    const length=Number(r.value);
    if(!sets.length){o.value="";st.textContent="";s.textContent="অন্তত একটি অপশন নির্বাচন করুন।";s.className="status error";return;}
    const all=sets.join(""),chars=[];
    for(const set of sets)chars.push(set[randomIndex(set.length)]);
    while(chars.length<length)chars.push(all[randomIndex(all.length)]);
    for(let i=chars.length-1;i>0;i--){const j=randomIndex(i+1);[chars[i],chars[j]]=[chars[j],chars[i]];}
    o.value=chars.join("");
    const [label,entropy]=strength(length,all.length);
    st.textContent=`শক্তি: ${label} • আনুমানিক entropy ${entropy.toFixed(1)} bits`;
    st.className=label==="দুর্বল"?"status error":"status success";
    s.textContent="নিরাপদভাবে তৈরি হয়েছে।";
    s.className="status success";
  };
  r.addEventListener("input",()=>{len.textContent=r.value;generate()});
  [upper,lower,num,symbol].forEach(x=>x.addEventListener("change",generate));
  document.getElementById("pwGenerate")?.addEventListener("click",generate);
  document.getElementById("pwCopy")?.addEventListener("click",async()=>{
    if(!o.value)return;
    try{await navigator.clipboard.writeText(o.value);s.textContent="কপি হয়েছে।";s.className="status success"}catch{s.textContent="কপি করা যায়নি।";s.className="status error"}
  });
  generate();
}
export {MODULE_VERSION};