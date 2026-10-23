
/* CampusOS service worker: offline app shell only.
   User data remains in localStorage. */

const CACHE_NAME = "campusos-shell-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icons/campusos.svg"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key =>
          key.startsWith("campusos-shell-") &&
          key !== CACHE_NAME
        )
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // Try the network first for page navigation.
  // Use the cached page if offline.
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);

        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put("./index.html", response.clone());
        }

        return response;
      } catch {
        return (
          await caches.match(request) ||
          await caches.match("./index.html")
        );
      }
    })());

    return;
  }

  // App assets: cached copy first, network fallback.
  const appFiles = [
    "style.css",
    "script.js",
    "manifest.json",
    "icons/campusos.svg"
  ];

  if (appFiles.some(path => url.pathname.endsWith(path))) {
    event.respondWith((async () => {
      const cached = await caches.match(request);

      const network = fetch(request)
        .then(response => {
          if (response && response.ok) {
            caches.open(CACHE_NAME).then(cache =>
              cache.put(request, response.clone())
            );
          }

          return response;
        })
        .catch(() => null);

      return cached || await network || Response.error();
    })());
  }
});
