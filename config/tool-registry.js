const REGISTRY_VERSION="2026.09.18.8";

const tools = [
  { id:"word-counter", name:"Word Counter", bn:"শব্দ গণনা", category:"text", categoryBn:"লেখা", icon:"📝", module:"word-counter", description:"শব্দ, অক্ষর ও লাইনের সংখ্যা গণনা করুন।" },
  { id:"json-formatter", name:"JSON Formatter", bn:"JSON ফরম্যাটার", category:"developer", categoryBn:"ডেভেলপার", icon:"{}", module:"json-formatter", description:"JSON যাচাই, সুন্দরভাবে ফরম্যাট ও মিনিফাই করুন।" },
  { id:"password-generator", name:"Password Generator", bn:"পাসওয়ার্ড জেনারেটর", category:"security", categoryBn:"নিরাপত্তা", icon:"🔐", module:"password-generator", description:"নিরাপদ র‍্যান্ডম পাসওয়ার্ড তৈরি করুন।" }
];

function getAllTools(){ return tools; }
function getToolById(id){ return tools.find(tool => tool.id === id) || null; }
module.exports = { REGISTRY_VERSION, getAllTools, getToolById };
