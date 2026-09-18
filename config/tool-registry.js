const REGISTRY_VERSION="2026.09.18.17";

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
  { id:"slug-generator", name:"SEO Slug Generator", bn:"SEO Slug জেনারেটর", category:"seo", categoryBn:"SEO", icon:"🔗", module:"slug-generator", description:"Title থেকে clean, URL-friendly slug তৈরি করুন।" },
  { id:"schema-generator", name:"Schema Markup Generator", bn:"Schema Markup জেনারেটর", category:"seo", categoryBn:"SEO", icon:"🧩", module:"schema-generator", description:"Common Schema.org types-এর JSON-LD তৈরি করুন।" },
  { id:"utm-builder", name:"UTM Campaign Builder", bn:"UTM Campaign Builder", category:"seo", categoryBn:"SEO", icon:"📈", module:"utm-builder", description:"Marketing campaign-এর জন্য trackable UTM URL তৈরি করুন।" }
  { id:"open-graph-preview", name:"Open Graph Preview", bn:"Open Graph প্রিভিউ", category:"seo", categoryBn:"SEO", icon:"📣", module:"open-graph-preview", description:"Social sharing-এর title ও description preview করুন।" },
  { id:"faq-schema-generator", name:"FAQ Schema Generator", bn:"FAQ Schema জেনারেটর", category:"seo", categoryBn:"SEO", icon:"❓", module:"faq-schema-generator", description:"FAQ content থেকে JSON-LD structured data তৈরি করুন।" },
  { id:"hreflang-generator", name:"Hreflang Generator", bn:"Hreflang জেনারেটর", category:"seo", categoryBn:"SEO", icon:"🌐", module:"hreflang-generator", description:"Multilingual pages-এর hreflang tags তৈরি করুন।" },
  { id:"heading-analyzer", name:"Heading Analyzer", bn:"Heading Analyzer", category:"seo", categoryBn:"SEO", icon:"🧱", module:"heading-analyzer", description:"HTML-এর H1–H6 heading structure পরীক্ষা করুন।" },
  { id:"link-analyzer", name:"Link Analyzer", bn:"Link Analyzer", category:"seo", categoryBn:"SEO", icon:"🔗", module:"link-analyzer", description:"HTML source-এর internal ও external links শনাক্ত করুন।" }
  { id:"image-seo-analyzer", name:"Image SEO Analyzer", bn:"Image SEO Analyzer", category:"seo", categoryBn:"SEO", icon:"🖼️", module:"image-seo-analyzer", description:"Image alt text ও basic loading attributes পরীক্ষা করুন।" },
  { id:"canonical-checker", name:"Canonical Tag Checker", bn:"Canonical Tag Checker", category:"seo", categoryBn:"SEO", icon:"🎯", module:"canonical-checker", description:"HTML-এ canonical tag আছে কি না পরীক্ষা করুন।" },
  { id:"http-status-checker", name:"HTTP Status Checker", bn:"HTTP Status Checker", category:"seo", categoryBn:"SEO", icon:"📡", module:"http-status-checker", description:"URL-এর HTTP response browser থেকে পরীক্ষা করুন।" },
  { id:"redirect-checker", name:"Redirect Checker", bn:"Redirect Checker", category:"seo", categoryBn:"SEO", icon:"↪️", module:"redirect-checker", description:"URL redirect response browser থেকে পরীক্ষা করুন।" },
  { id:"readability-checker", name:"Readability Checker", bn:"Readability Checker", category:"seo", categoryBn:"SEO", icon:"📖", module:"readability-checker", description:"Content-এর sentence ও word structure বিশ্লেষণ করুন।" }
  { id:"sitemap-validator", name:"Sitemap Validator", bn:"Sitemap Validator", category:"seo", categoryBn:"SEO", icon:"🗺️", module:"sitemap-validator", description:"XML sitemap-এর basic structure ও URL entries যাচাই করুন।" },
  { id:"robots-txt-tester", name:"Robots.txt Tester", bn:"Robots.txt Tester", category:"seo", categoryBn:"SEO", icon:"🤖", module:"robots-txt-tester", description:"robots.txt-এর basic Allow/Disallow rule পরীক্ষা করুন।" },
  { id:"schema-validator", name:"Schema Validator", bn:"Schema Validator", category:"seo", categoryBn:"SEO", icon:"🧩", module:"schema-validator", description:"JSON-LD-এর JSON syntax ও schema type পরীক্ষা করুন।" },
  { id:"meta-tag-analyzer", name:"Meta Tag Analyzer", bn:"Meta Tag Analyzer", category:"seo", categoryBn:"SEO", icon:"🏷️", module:"meta-tag-analyzer", description:"গুরুত্বপূর্ণ SEO meta tags দ্রুত পরীক্ষা করুন।" },
  { id:"broken-link-checker", name:"Broken Link Checker", bn:"Broken Link Checker", category:"seo", categoryBn:"SEO", icon:"🔗", module:"broken-link-checker", description:"HTML source থেকে links বের করুন এবং broken-link testing-এর জন্য প্রস্তুত করুন।" }
];

function getAllTools(){ return tools; }
function getToolById(id){ return tools.find(tool => tool.id === id) || null; }
module.exports = { REGISTRY_VERSION, getAllTools, getToolById };
