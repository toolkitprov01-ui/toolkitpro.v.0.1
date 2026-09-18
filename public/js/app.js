const tools = [
  ["📝","Text Tools","Text formatting, cleanup and analysis"],
  ["💻","Developer Tools","Helpful tools for developers"],
  ["🖼️","Image Tools","Simple image utilities and optimization"],
  ["🧮","Calculators","Everyday and technical calculations"],
  ["🔄","Converters","Convert units, formats and values"],
  ["🔎","SEO Tools","Tools for search optimization"],
  ["🛡️","Security Tools","Privacy and security utilities"],
  ["📁","File Tools","Useful file processing tools"],
  ["🎨","Color Tools","Pick, convert and analyze colors"],
  ["⚡","Utility Tools","Fast tools for everyday tasks"]
];

const grid = document.querySelector("#toolGrid");
const search = document.querySelector("#toolSearch");
const count = document.querySelector("#toolCount");
const empty = document.querySelector("#emptyState");

function render(filter = "") {
  const q = filter.trim().toLowerCase();
  const visible = tools.filter(([,name,description]) =>
    `${name} ${description}`.toLowerCase().includes(q)
  );

  grid.innerHTML = visible.map(([icon,name,description]) => `
    <article class="tool-card">
      <div class="tool-icon" aria-hidden="true">${icon}</div>
      <h3>${name}</h3>
      <p>${description}</p>
    </article>
  `).join("");

  count.textContent = `${visible.length} categories`;
  empty.hidden = visible.length !== 0;
}

search.addEventListener("input", event => render(event.target.value));

document.querySelector("#themeToggle").addEventListener("click", () => {
  document.documentElement.classList.toggle("light");
});

document.querySelector("#year").textContent = new Date().getFullYear();

fetch("/api/health")
  .then(response => response.ok ? response.json() : Promise.reject())
  .then(data => {
    document.querySelector("#healthStatus").textContent = data.status === "ok" ? "Online" : "Unavailable";
  })
  .catch(() => {
    document.querySelector("#healthStatus").textContent = "Offline";
  });

render();