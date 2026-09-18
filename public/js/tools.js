const toolDefinitions=[
 {id:"word-counter",name:"Word Counter",icon:"📝"},
 {id:"case-converter",name:"Case Converter",icon:"🔤"},
 {id:"json-formatter",name:"JSON Formatter",icon:"{ }"},
 {id:"base64",name:"Base64 Encoder / Decoder",icon:"🔐"},
 {id:"url-encoder",name:"URL Encoder / Decoder",icon:"🔗"},
 {id:"password-generator",name:"Password Generator",icon:"🛡️"},
 {id:"uuid-generator",name:"UUID Generator",icon:"🆔"},
 {id:"percentage",name:"Percentage Calculator",icon:"%"},
 {id:"unit-converter",name:"Length Converter",icon:"📏"},
 {id:"timestamp",name:"Unix Timestamp",icon:"⏱️"}
];

const list=document.querySelector("#toolList"),panel=document.querySelector("#toolPanel");
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
function button(label,fn){return `<button class="action" type="button" data-action="${fn}">${label}</button>`}

const templates={
"word-counter":()=>`<h2>📝 Word Counter</h2><p class="tool-note">Counts words, characters and lines in your text.</p><div class="field"><textarea id="input" placeholder="Type or paste text here..."></textarea></div><div class="result" id="result">Words: 0\nCharacters: 0\nCharacters (no spaces): 0\nLines: 0</div>`,
"case-converter":()=>`<h2>🔤 Case Converter</h2><div class="field"><textarea id="input" placeholder="Enter text..."></textarea></div><div class="actions">${button("UPPERCASE","upper")}${button("lowercase","lower")}${button("Title Case","title")}${button("Sentence case","sentence")}</div><div class="result" id="result">Converted text will appear here.</div>`,
"json-formatter":()=>`<h2>{ } JSON Formatter</h2><div class="field"><textarea id="input" placeholder='{"name":"Toolkit Pro"}'></textarea></div><div class="actions">${button("Format","format")}${button("Minify","minify")}</div><div class="result" id="result">Result will appear here.</div>`,
"base64":()=>`<h2>🔐 Base64 Encoder / Decoder</h2><div class="field"><textarea id="input" placeholder="Enter text..."></textarea></div><div class="actions">${button("Encode","encode")}${button("Decode","decode")}</div><div class="result" id="result">Result will appear here.</div>`,
"url-encoder":()=>`<h2>🔗 URL Encoder / Decoder</h2><div class="field"><textarea id="input" placeholder="Enter URL or text..."></textarea></div><div class="actions">${button("Encode","encode")}${button("Decode","decode")}</div><div class="result" id="result">Result will appear here.</div>`,
"password-generator":()=>`<h2>🛡️ Password Generator</h2><div class="field"><label for="length">Length</label><input id="length" type="number" min="8" max="128" value="16"></div><div class="actions">${button("Generate","generate")}</div><div class="result" id="result">Click Generate.</div>`,
"uuid-generator":()=>`<h2>🆔 UUID Generator</h2><p class="tool-note">Creates a random UUID v4 in your browser.</p><div class="actions">${button("Generate UUID","generate")}</div><div class="result" id="result">Click Generate.</div>`,
"percentage":()=>`<h2>% Percentage Calculator</h2><div class="field"><label>What is X% of Y?</label><input id="x" type="number" placeholder="X"><input id="y" type="number" placeholder="Y"></div><div class="actions">${button("Calculate","calculate")}</div><div class="result" id="result">Result will appear here.</div>`,
"unit-converter":()=>`<h2>📏 Length Converter</h2><div class="field"><input id="value" type="number" placeholder="Value"><select id="from"><option value="m">Meters</option><option value="km">Kilometers</option><option value="cm">Centimeters</option><option value="mi">Miles</option><option value="ft">Feet</option><option value="in">Inches</option></select><select id="to"><option value="m">Meters</option><option value="km">Kilometers</option><option value="cm">Centimeters</option><option value="mi">Miles</option><option value="ft">Feet</option><option value="in">Inches</option></select></div><div class="actions">${button("Convert","convert")}</div><div class="result" id="result">Result will appear here.</div>`,
"timestamp":()=>`<h2>⏱️ Unix Timestamp</h2><div class="actions">${button("Current Timestamp","now")}</div><div class="field"><input id="stamp" type="number" placeholder="Unix timestamp"></div><div class="actions">${button("Convert Timestamp","date")}</div><div class="result" id="result">Result will appear here.</div>`
};

function renderList(active){list.innerHTML=toolDefinitions.map(t=>`<button class="tool-btn ${t.id===active?"active":""}" data-tool="${t.id}" type="button">${t.icon} ${t.name}</button>`).join("")}
function openTool(id){panel.innerHTML=templates[id]();renderList(id);panel.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>run(id,b.dataset.action)));if(id==="word-counter")panel.querySelector("#input").addEventListener("input",wordCount)}
function wordCount(){const v=panel.querySelector("#input").value;panel.querySelector("#result").textContent=`Words: ${v.trim()?v.trim().split(/\s+/).length:0}\nCharacters: ${v.length}\nCharacters (no spaces): ${v.replace(/\s/g,"").length}\nLines: ${v? v.split(/\r?\n/).length:0}`}
function run(id,action){
 const input=panel.querySelector("#input"),result=panel.querySelector("#result");
 try{
  if(id==="case-converter"){const v=input.value;result.textContent=action==="upper"?v.toUpperCase():action==="lower"?v.toLowerCase():action==="title"?v.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()):v.toLowerCase().replace(/(^|[.!?]\s+)(\w)/g,(m,a,c)=>a+c.toUpperCase());}
  else if(id==="json-formatter"){const o=JSON.parse(input.value);result.textContent=action==="format"?JSON.stringify(o,null,2):JSON.stringify(o);}
  else if(id==="base64"){result.textContent=action==="encode"?btoa(unescape(encodeURIComponent(input.value))):decodeURIComponent(escape(atob(input.value)));}
  else if(id==="url-encoder"){result.textContent=action==="encode"?encodeURIComponent(input.value):decodeURIComponent(input.value);}
  else if(id==="password-generator"){const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";const n=Math.max(8,Math.min(128,Number(panel.querySelector("#length").value)||16));const a=new Uint32Array(n);crypto.getRandomValues(a);result.textContent=Array.from(a,x=>chars[x%chars.length]).join("");}
  else if(id==="uuid-generator"){result.textContent=crypto.randomUUID();}
  else if(id==="percentage"){const x=Number(panel.querySelector("#x").value),y=Number(panel.querySelector("#y").value);result.textContent=Number.isFinite(x)&&Number.isFinite(y)?`${x}% of ${y} = ${(x*y/100)}`:"Enter valid numbers."}
  else if(id==="unit-converter"){const factors={m:1,km:1000,cm:.01,mi:1609.344,ft:.3048,in:.0254};const v=Number(panel.querySelector("#value").value),from=panel.querySelector("#from").value,to=panel.querySelector("#to").value;result.textContent=Number.isFinite(v)?`${v} ${from} = ${(v*factors[from]/factors[to]).toPrecision(10).replace(/0+$|\.$/,"")} ${to}`:"Enter a valid number."}
  else if(id==="timestamp"&&action==="now")result.textContent=Math.floor(Date.now()/1000).toString();
  else if(id==="timestamp"&&action==="date"){const s=Number(panel.querySelector("#stamp").value);result.textContent=Number.isFinite(s)?new Date(s*1000).toISOString():"Enter a valid timestamp."}
 }catch(e){result.textContent="Error: "+e.message}
}
list.addEventListener("click",e=>{const id=e.target.closest("[data-tool]")?.dataset.tool;if(id)openTool(id)});
document.querySelector("#year").textContent=new Date().getFullYear();
const initial=new URLSearchParams(location.search).get("tool");openTool(toolDefinitions.some(t=>t.id===initial)?initial:"word-counter");