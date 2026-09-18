const REGISTRY_VERSION="2026.09.18.13";

const tools = [
  { id:"word-counter", name:"Word Counter", bn:"শব্দ গণনা", category:"text", categoryBn:"লেখা", icon:"📝", module:"word-counter", description:"শব্দ, অক্ষর ও লাইনের সংখ্যা গণনা করুন।" },
  { id:"json-formatter", name:"JSON Formatter", bn:"JSON ফরম্যাটার", category:"developer", categoryBn:"ডেভেলপার", icon:"{}", module:"json-formatter", description:"JSON যাচাই, সুন্দরভাবে ফরম্যাট ও মিনিফাই করুন।" },
  { id:"password-generator", name:"Password Generator", bn:"পাসওয়ার্ড জেনারেটর", category:"security", categoryBn:"নিরাপত্তা", icon:"🔐", module:"password-generator", description:"নিরাপদ র‍্যান্ডম পাসওয়ার্ড তৈরি করুন।" },
  { id:"seo-analyzer", name:"SEO Analyzer", bn:"SEO অ্যানালাইজার", category:"seo", categoryBn:"SEO", icon:"🔎", module:"seo-analyzer", description:"HTML source থেকে title, description, heading, image alt, canonical ও social meta পরীক্ষা করুন।" }
  { id:"meta-tag-generator", name:"Meta Tag Generator", bn:"Meta Tag জেনারেটর", category:"seo", categoryBn:"SEO", icon:"🏷️", module:"meta-tag-generator", description:"SEO meta title, description, canonical, robots ও social tags তৈরি করুন।" },
  { id:"serp-preview", name:"SERP Snippet Preview", bn:"SERP Snippet প্রিভিউ", category:"seo", categoryBn:"SEO", icon:"🔎", module:"serp-preview", description:"Search result snippet-এর title, URL ও description preview করুন।" },
  { id:"robots-generator", name:"Robots.txt Generator", bn:"Robots.txt জেনারেটর", category:"seo", categoryBn:"SEO", icon:"🤖", module:"robots-generator", description:"Search crawler-এর জন্য robots.txt তৈরি করুন।" },
  { id:"sitemap-generator", name:"XML Sitemap Generator", bn:"XML Sitemap জেনারেটর", category:"seo", categoryBn:"SEO", icon:"🗺️", module:"sitemap-generator", description:"URL-এর তালিকা থেকে sitemap.xml তৈরি করুন।" },
  { id:"keyword-density", name:"Keyword Density Checker", bn:"Keyword Density Checker", category:"seo", categoryBn:"SEO", icon:"🔤", module:"keyword-density", description:"Content-এর keyword frequency ও density বিশ্লেষণ করুন।" }
];

function getAllTools(){ return tools; }
function getToolById(id){ return tools.find(tool => tool.id === id) || null; }
module.exports = { REGISTRY_VERSION, getAllTools, getToolById };
