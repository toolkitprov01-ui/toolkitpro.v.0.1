const tools = [
  { id:"word-counter", name:"Word Counter", bn:"শব্দ গণনা", category:"text", icon:"📝", description:"শব্দ, অক্ষর ও লাইনের সংখ্যা গণনা করুন।" },
  { id:"json-formatter", name:"JSON Formatter", bn:"JSON ফরম্যাটার", category:"developer", icon:"{}",
    description:"JSON যাচাই, সুন্দরভাবে ফরম্যাট ও মিনিফাই করুন।" },
  { id:"password-generator", name:"Password Generator", bn:"পাসওয়ার্ড জেনারেটর", category:"security", icon:"🔐",
    description:"নিরাপদ র‍্যান্ডম পাসওয়ার্ড তৈরি করুন।" }
];

function getAllTools(){ return tools; }
function getToolById(id){ return tools.find(tool => tool.id === id) || null; }
module.exports = { getAllTools, getToolById };
