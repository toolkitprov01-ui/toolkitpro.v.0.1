const CACHE="toolkit-pro-v4";
const ASSETS=[
  "/tools.html",
  "/css/style.css?v=4",
  "/js/app.js?v=4",
  "/js/tools.js?v=2",
  "/manifest.json"
];

self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(key=>key !== CACHE).map(key=>caches.delete(key))
    )).then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  const url=new URL(event.request.url);

  if(url.origin===self.location.origin && (url.pathname==="/" || url.pathname==="/index.html")){
    event.respondWith(fetch(event.request,{cache:"no-store"}));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached=>cached||fetch(event.request))
  );
});
