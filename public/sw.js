const CACHE="toolkit-pro-v2";
const ASSETS=["/","/tools.html","/css/style.css","/js/app.js?v=2","/js/tools.js?v=2","/manifest.json"];

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
  event.respondWith(
    caches.match(event.request).then(cached=>cached||fetch(event.request))
  );
});
