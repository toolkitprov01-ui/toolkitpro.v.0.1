const MODULE_VERSION="2026.09.18.11";

export function render(){
  return `<div class="tool-form"><div class="range-row"><label for="pwRange">দৈর্ঘ্য <output id="pwLen">16</output></label><input id="pwRange" type="range" min="8" max="64" value="16" aria-label="পাসওয়ার্ডের দৈর্ঘ্য"></div><div class="checks"><label><input id="pwUpper" type="checkbox" checked> বড় হাতের অক্ষর</label><label><input id="pwLower" type="checkbox" checked> ছোট হাতের অক্ষর</label><label><input id="pwNum" type="checkbox" checked> সংখ্যা</label><label><input id="pwSymbol" type="checkbox" checked> Symbol</label></div><div class="password-output"><input id="pwOutput" readonly aria-label="উৎপন্ন পাসওয়ার্ড"><button class="primary" id="pwGenerate" type="button">তৈরি করুন</button><button class="secondary" id="pwCopy" type="button">কপি</button></div><div id="pwStatus" class="status" role="status" aria-live="polite"></div></div>`;
}

export function mount(){
  const o=document.getElementById("pwOutput"),r=document.getElementById("pwRange"),s=document.getElementById("pwStatus"),upper=document.getElementById("pwUpper"),lower=document.getElementById("pwLower"),num=document.getElementById("pwNum"),symbol=document.getElementById("pwSymbol"),len=document.getElementById("pwLen"),generateButton=document.getElementById("pwGenerate"),copyButton=document.getElementById("pwCopy");
  if(!o||!r||!s||!upper||!lower||!num||!symbol||!len)return;
  const g=()=>{
    const a=[];
    if(upper.checked)a.push("ABCDEFGHJKLMNPQRSTUVWXYZ");
    if(lower.checked)a.push("abcdefghijkmnopqrstuvwxyz");
    if(num.checked)a.push("23456789");
    if(symbol.checked)a.push("!@#$%^&*()-_=+[]{}");
    if(!a.length){
      o.value="";
      s.textContent="অন্তত একটি অপশন নির্বাচন করুন।";
      s.className="status error";
      return;
    }
    const all=a.join(""),b=new Uint32Array(Number(r.value)),c=[];
    crypto.getRandomValues(b);
    for(let i=0;i<b.length;i++)c.push(all[b[i]%all.length]);
    for(let i=0;i<a.length&&i<c.length;i++){
      const x=new Uint32Array(1);
      crypto.getRandomValues(x);
      c[i]=a[i][x[0]%a[i].length];
    }
    o.value=c.join("");
    s.textContent="নিরাপদভাবে তৈরি হয়েছে।";
    s.className="status success";
  };
  r.oninput=()=>len.textContent=r.value;
  generateButton?.addEventListener("click",g);
  copyButton?.addEventListener("click",async()=>{
    if(!o.value)return;
    try{
      await navigator.clipboard.writeText(o.value);
      s.textContent="কপি হয়েছে।";
      s.className="status success";
    }catch{
      s.textContent="কপি করা যায়নি।";
      s.className="status error";
    }
  });
  g();
}

export {MODULE_VERSION};
