const CACHE="toolkit-pro-v1";
const ASSETS=["/","/tools.html","/css/style.css","/js/app.js","/js/tools.js","/manifest.json"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener("fetch",event=>event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request))));
