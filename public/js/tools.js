const toolDefinitions = [
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

const list = document.querySelector("#toolList");
const panel = document.querySelector("#toolPanel");

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[char]));

const button = (label, action) =>
  `<button class="action" type="button" data-action="${action}">${label}</button>`;

const templates = {
  "word-counter": () => `
    <h2>📝 Word Counter</h2>
    <p class="tool-note">Counts words, characters and lines instantly in your browser.</p>
    <div class="field"><textarea id="input" placeholder="Type or paste text here..."></textarea></div>
    <div class="result" id="result">Words: 0\nCharacters: 0\nCharacters (no spaces): 0\nLines: 0</div>`,

  "case-converter": () => `
    <h2>🔤 Case Converter</h2>
    <div class="field"><textarea id="input" placeholder="Enter text..."></textarea></div>
    <div class="actions">${button("UPPERCASE","upper")}${button("lowercase","lower")}${button("Title Case","title")}${button("Sentence case","sentence")}</div>
    <div class="result" id="result">Converted text will appear here.</div>`,

  "json-formatter": () => `
    <h2>{ } JSON Formatter</h2>
    <div class="field"><textarea id="input" placeholder='{"name":"Toolkit Pro"}'></textarea></div>
    <div class="actions">${button("Format","format")}${button("Minify","minify")}${button("Validate","validate")}</div>
    <div class="result" id="result">Result will appear here.</div>`,

  "base64": () => `
    <h2>🔐 Base64 Encoder / Decoder</h2>
    <div class="field"><textarea id="input" placeholder="Enter text..."></textarea></div>
    <div class="actions">${button("Encode","encode")}${button("Decode","decode")}</div>
    <div class="result" id="result">Result will appear here.</div>`,

  "url-encoder": () => `
    <h2>🔗 URL Encoder / Decoder</h2>
    <div class="field"><textarea id="input" placeholder="Enter URL or text..."></textarea></div>
    <div class="actions">${button("Encode","encode")}${button("Decode","decode")}</div>
    <div class="result" id="result">Result will appear here.</div>`,

  "password-generator": () => `
    <h2>🛡️ Password Generator</h2>
    <div class="field">
      <label for="length">Length</label>
      <input id="length" type="number" min="8" max="128" value="16">
    </div>
    <div class="actions">${button("Generate","generate")}</div>
    <div class="result" id="result">Click Generate.</div>`,

  "uuid-generator": () => `
    <h2>🆔 UUID Generator</h2>
    <p class="tool-note">Creates a cryptographically random UUID v4.</p>
    <div class="actions">${button("Generate UUID","generate")}</div>
    <div class="result" id="result">Click Generate.</div>`,

  "percentage": () => `
    <h2>% Percentage Calculator</h2>
    <div class="field">
      <label for="x">Percentage (X)</label><input id="x" type="number" step="any" placeholder="X">
      <label for="y">Number (Y)</label><input id="y" type="number" step="any" placeholder="Y">
    </div>
    <div class="actions">${button("Calculate","calculate")}</div>
    <div class="result" id="result">Result will appear here.</div>`,

  "unit-converter": () => `
    <h2>📏 Length Converter</h2>
    <div class="field">
      <label for="value">Value</label><input id="value" type="number" step="any" placeholder="Value">
      <label for="from">From</label>
      <select id="from">
        <option value="m">Meters</option><option value="km">Kilometers</option><option value="cm">Centimeters</option>
        <option value="mm">Millimeters</option><option value="mi">Miles</option><option value="yd">Yards</option>
        <option value="ft">Feet</option><option value="in">Inches</option>
      </select>
      <label for="to">To</label>
      <select id="to">
        <option value="m">Meters</option><option value="km">Kilometers</option><option value="cm">Centimeters</option>
        <option value="mm">Millimeters</option><option value="mi">Miles</option><option value="yd">Yards</option>
        <option value="ft">Feet</option><option value="in">Inches</option>
      </select>
    </div>
    <div class="actions">${button("Convert","convert")}</div>
    <div class="result" id="result">Result will appear here.</div>`,

  "timestamp": () => `
    <h2>⏱️ Unix Timestamp</h2>
    <div class="actions">${button("Current Timestamp","now")}</div>
    <div class="field">
      <label for="stamp">Unix timestamp (seconds)</label>
      <input id="stamp" type="number" step="any" placeholder="Unix timestamp">
    </div>
    <div class="actions">${button("Convert Timestamp","date")}</div>
    <div class="result" id="result">Result will appear here.</div>`
};

function renderList(active) {
  list.innerHTML = toolDefinitions.map(tool =>
    `<button class="tool-btn ${tool.id === active ? "active" : ""}" data-tool="${tool.id}" type="button">${tool.icon} ${escapeHtml(tool.name)}</button>`
  ).join("");
}

function countWords(value) {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/u).length : 0;
}

function toTitleCase(value) {
  return value.toLocaleLowerCase().replace(/(^|[\s\-_])([\p{L}\p{N}])/gu, (_, prefix, char) =>
    prefix + char.toLocaleUpperCase()
  );
}

function toSentenceCase(value) {
  const lower = value.toLocaleLowerCase();
  return lower.replace(/(^|[.!?]\s+)([\p{L}\p{N}])/gu, (_, prefix, char) =>
    prefix + char.toLocaleUpperCase()
  );
}

function encodeBase64Unicode(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64Unicode(value) {
  const binary = atob(value.trim());
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function randomPassword(length) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => chars[byte % chars.length]).join("");
}

function openTool(id) {
  if (!templates[id]) return;
  panel.innerHTML = templates[id]();
  renderList(id);

  panel.querySelectorAll("[data-action]").forEach(control => {
    control.addEventListener("click", () => run(id, control.dataset.action));
  });

  if (id === "word-counter") {
    panel.querySelector("#input").addEventListener("input", updateWordCount);
  }
}

function updateWordCount() {
  const value = panel.querySelector("#input").value;
  panel.querySelector("#result").textContent =
    `Words: ${countWords(value)}\nCharacters: ${value.length}\nCharacters (no spaces): ${value.replace(/\s/gu, "").length}\nLines: ${value ? value.split(/\r?\n/).length : 0}`;
}

function run(id, action) {
  const input = panel.querySelector("#input");
  const result = panel.querySelector("#result");

  try {
    if (id === "case-converter") {
      const value = input.value;
      result.textContent =
        action === "upper" ? value.toLocaleUpperCase() :
        action === "lower" ? value.toLocaleLowerCase() :
        action === "title" ? toTitleCase(value) :
        toSentenceCase(value);
      return;
    }

    if (id === "json-formatter") {
      const value = input.value.trim();
      const parsed = JSON.parse(value);
      result.textContent =
        action === "format" ? JSON.stringify(parsed, null, 2) :
        action === "minify" ? JSON.stringify(parsed) :
        "Valid JSON ✓";
      return;
    }

    if (id === "base64") {
      result.textContent = action === "encode"
        ? encodeBase64Unicode(input.value)
        : decodeBase64Unicode(input.value);
      return;
    }

    if (id === "url-encoder") {
      result.textContent = action === "encode"
        ? encodeURIComponent(input.value)
        : decodeURIComponent(input.value);
      return;
    }

    if (id === "password-generator") {
      const length = Math.max(8, Math.min(128, Number(panel.querySelector("#length").value) || 16));
      result.textContent = randomPassword(length);
      return;
    }

    if (id === "uuid-generator") {
      result.textContent = crypto.randomUUID();
      return;
    }

    if (id === "percentage") {
      const x = Number(panel.querySelector("#x").value);
      const y = Number(panel.querySelector("#y").value);
      if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("Enter valid numbers.");
      result.textContent = `${x}% of ${y} = ${x * y / 100}`;
      return;
    }

    if (id === "unit-converter") {
      const factors = {m:1, km:1000, cm:0.01, mm:0.001, mi:1609.344, yd:0.9144, ft:0.3048, in:0.0254};
      const value = Number(panel.querySelector("#value").value);
      const from = panel.querySelector("#from").value;
      const to = panel.querySelector("#to").value;
      if (!Number.isFinite(value)) throw new Error("Enter a valid number.");
      const converted = value * factors[from] / factors[to];
      result.textContent = `${value} ${from} = ${Number(converted.toPrecision(12))} ${to}`;
      return;
    }

    if (id === "timestamp") {
      if (action === "now") {
        result.textContent = String(Math.floor(Date.now() / 1000));
        return;
      }
      const timestamp = Number(panel.querySelector("#stamp").value);
      if (!Number.isFinite(timestamp)) throw new Error("Enter a valid timestamp.");
      const date = new Date(timestamp * 1000);
      if (Number.isNaN(date.getTime())) throw new Error("Timestamp is outside the supported date range.");
      result.textContent = date.toISOString();
    }
  } catch (error) {
    result.textContent = `Error: ${error.message}`;
  }
}

list.addEventListener("click", event => {
  const id = event.target.closest("[data-tool]")?.dataset.tool;
  if (id) openTool(id);
});

document.querySelector("#year").textContent = new Date().getFullYear();

const initial = new URLSearchParams(location.search).get("tool");
openTool(toolDefinitions.some(tool => tool.id === initial) ? initial : "word-counter");
