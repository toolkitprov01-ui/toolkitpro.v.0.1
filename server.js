const express = require("express");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");
const { getAllTools, getToolById, REGISTRY_VERSION } = require("./config/tool-registry");
const APP_VERSION = "2.0.0";
const SITE_URL = "https://toolkitpro-v-0-1.onrender.com";
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const publicDir = path.join(__dirname, "public");
const toolPageTemplate = fs.readFileSync(path.join(publicDir, "tool.html"), "utf8");
const escHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const escJson = value => JSON.stringify(value).replace(/</g, "\u003c");
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/search",(req,res)=>{
  const q=String(req.query.q||"").trim().toLowerCase();
  const category=String(req.query.category||"").trim().toLowerCase();
  const limit=Math.min(Math.max(Number(req.query.limit)||24,1),100);
  const offset=Math.max(Number(req.query.offset)||0,0);
  const tools=getAllTools();
  const tokens=q.split(/\s+/).filter(Boolean);
  const results=tools.map(tool=>{
    if(category && tool.category.toLowerCase()!==category)return null;
    const haystack=[tool.id,tool.name,tool.bn,tool.description,tool.category,tool.categoryBn,...tool.tags,...tool.synonyms].join(" ").toLowerCase();
    if(tokens.length && !tokens.every(token=>haystack.includes(token)))return null;
    let score=0;
    const exact=[tool.id,tool.slug,tool.name,tool.bn].map(v=>String(v).toLowerCase());
    tokens.forEach(token=>{
      if(exact.some(v=>v===token))score+=100;
      if(tool.name.toLowerCase().includes(token))score+=30;
      if(tool.bn.toLowerCase().includes(token))score+=30;
      if(tool.tags.some(v=>String(v).toLowerCase().includes(token)))score+=15;
      if(tool.description.toLowerCase().includes(token))score+=5;
    });
    return {tool,score};
  }).filter(Boolean).sort((a,b)=>b.score-a.score||a.tool.name.localeCompare(b.tool.name)).map(x=>x.tool);
  res.set("Cache-Control","public, max-age=60, stale-while-revalidate=300");
  res.json({success:true,count:results.length,offset,limit,results:results.slice(offset,offset+limit)});
});

app.get("/sitemap.xml",(req,res)=>{
  const staticUrls=["/","/tools.html","/privacy.html","/terms.html","/disclaimer.html"];
  const toolUrls=getAllTools().map(tool=>"/tool/"+encodeURIComponent(tool.id));
  const urls=[...staticUrls,...toolUrls];
  const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
    urls.map(url=>"  <url><loc>"+SITE_URL+url+"</loc></url>").join("\n")+
    "\n</urlset>\n";
  res.type("application/xml").set("Cache-Control","public, max-age=3600").send(xml);
});
app.use(express.static(publicDir, { etag: true, maxAge: 0 }));
app.get("/api/health",(req,res)=>{res.set("Cache-Control","no-store");res.json({success:true,service:"Toolkit Pro",status:"ok",version:APP_VERSION,registryVersion:REGISTRY_VERSION,timestamp:new Date().toISOString()})});
app.get("/api/tools",(req,res)=>{res.set("Cache-Control","no-store");const tools=getAllTools();res.json({success:true,count:tools.length,tools})});
app.get("/api/tools/:id",(req,res)=>{res.set("Cache-Control","no-store");const tool=getToolById(req.params.id);if(!tool)return res.status(404).json({success:false,error:"Tool not found"});res.json({success:true,tool})});
app.get("/tools",(req,res)=>res.sendFile(path.join(publicDir,"tools.html")));
app.get("/tool/:id",(req,res)=>{const tool=getToolById(req.params.id);if(!tool)return res.status(404).sendFile(path.join(publicDir,"404.html"));const url=SITE_URL+"/tool/"+encodeURIComponent(tool.id);const jsonLd={"@context":"https://schema.org","@type":"WebApplication",name:tool.name,alternateName:tool.bn,url,description:tool.description,applicationCategory:"UtilitiesApplication",operatingSystem:"Web",inLanguage:"bn-BD",offers:{"@type":"Offer",price:"0",priceCurrency:"USD"},isAccessibleForFree:true};const page=toolPageTemplate.replaceAll("__TOOL_TITLE__",escHtml(tool.bn||tool.name)).replaceAll("__TOOL_DESCRIPTION__",escHtml(tool.description)).replaceAll("__TOOL_URL__",escHtml(url)).replace("__TOOL_JSONLD__",escJson(jsonLd)).replace("__TOOL_ID__",escHtml(tool.id));res.set("Cache-Control","public, max-age=300");res.send(page)});
app.get("/{*splat}",(req,res)=>res.status(404).sendFile(path.join(publicDir,"404.html")));
app.listen(PORT,()=>console.log("Toolkit Pro v"+APP_VERSION+" running on port "+PORT));