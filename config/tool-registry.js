const tools = [
  { id: "word-counter", name: "Word Counter", category: "Text", clientSide: true },
  { id: "case-converter", name: "Case Converter", category: "Text", clientSide: true },
  { id: "json-formatter", name: "JSON Formatter", category: "Developer", clientSide: true },
  { id: "base64", name: "Base64 Encoder / Decoder", category: "Developer", clientSide: true },
  { id: "url-encoder", name: "URL Encoder / Decoder", category: "Developer", clientSide: true },
  { id: "password-generator", name: "Password Generator", category: "Security", clientSide: true },
  { id: "uuid-generator", name: "UUID Generator", category: "Developer", clientSide: true },
  { id: "percentage", name: "Percentage Calculator", category: "Calculator", clientSide: true },
  { id: "unit-converter", name: "Length Converter", category: "Converter", clientSide: true },
  { id: "timestamp", name: "Unix Timestamp", category: "Utility", clientSide: true }
];

function getAllTools() { return tools; }
function getToolById(id) { return tools.find(tool => tool.id === id) || null; }

module.exports = { getAllTools, getToolById };