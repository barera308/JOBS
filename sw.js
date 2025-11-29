const cacheName = "jobads-cache-v1";
const filesToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/manifest.json"
];

// Install
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache.addAll(filesToCache);
    })
  );
});

// Fetch
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
