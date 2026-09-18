// Legacy service-worker cleanup for Toolkit Pro.
// The current site intentionally does not use a service worker.
// This file unregisters itself and removes old Toolkit Pro caches.
self.addEventListener("install", event => self.skipWaiting());

self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([
      self.registration.unregister(),
      caches.keys().then(keys =>
        Promise.all(
          keys.filter(key => key.startsWith("toolkit-pro-")).map(key => caches.delete(key))
        )
      )
    ]).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(fetch(event.request));
});
