const featured=document.querySelector("#featured");
document.querySelector("#year").textContent=new Date().getFullYear();
fetch("/api/tools").then(r=>r.json()).then(({tools})=>{
 featured.innerHTML=tools.map(t=>`<a class="card" href="/tools.html?tool=${encodeURIComponent(t.id)}"><div class="tool-icon">${t.icon}</div><div><h3>${t.bn}</h3><p>${t.description}</p></div><span>→</span></a>`).join("");
}).catch(()=>featured.innerHTML="<p>টুল লোড করা যায়নি।</p>");
