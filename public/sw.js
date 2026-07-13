/* Floating Observatory — offline shell service worker
 * Strategy:
 * - Precache minimal shell (offline page)
 * - Runtime cache successful same-origin GETs (HTML/JS/CSS/icons)
 * - Navigation: network-first → cache → offline.html
 * - Never cache API-like or non-GET requests
 */

const VERSION = "observatory-shell-v1";
const SHELL = "shell-" + VERSION;
const RUNTIME = "runtime-" + VERSION;

const PRECACHE_URLS = [
  "/offline.html",
  "/manifest.webmanifest",
  "/manifest",
  "/icon",
  "/apple-icon",
  "/",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      // Best-effort each URL — one 404 must not abort install
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            const res = await fetch(url, { cache: "reload" });
            if (res.ok) await cache.put(url, res.clone());
          } catch {
            /* offline install / missing route */
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== SHELL && k !== RUNTIME)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

/**
 * @param {Request} request
 * @param {Response} response
 */
async function putRuntime(request, response) {
  if (!response || !response.ok) return;
  // Opaque/cross-origin: skip
  if (response.type !== "basic" && response.type !== "cors") return;
  try {
    const cache = await caches.open(RUNTIME);
    await cache.put(request, response.clone());
  } catch {
    /* quota / opaque */
  }
}

/**
 * @param {Request} request
 */
async function fromCache(request) {
  const match =
    (await caches.match(request, { ignoreSearch: false })) ||
    (await caches.match(request, { ignoreSearch: true }));
  return match || null;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only same-origin
  if (url.origin !== self.location.origin) return;

  // Skip Next.js HMR / turbopack dev noise if SW ever registers in dev
  if (
    url.pathname.startsWith("/_next/webpack") ||
    url.pathname.includes("hot-update") ||
    url.pathname.startsWith("/__nextjs")
  ) {
    return;
  }

  // Navigations (document)
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const network = await fetch(request);
          if (network && network.ok) {
            await putRuntime(request, network);
            // Also refresh root shell entry
            if (url.pathname === "/" || url.pathname === "") {
              const shell = await caches.open(SHELL);
              await shell.put("/", network.clone());
            }
          }
          return network;
        } catch {
          const cached =
            (await fromCache(request)) ||
            (await caches.match("/")) ||
            (await caches.match("/offline.html"));
          return (
            cached ||
            new Response("Offline", {
              status: 503,
              statusText: "Offline",
              headers: { "Content-Type": "text/plain" },
            })
          );
        }
      })()
    );
    return;
  }

  // Static / app assets: stale-while-revalidate-ish
  const isAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon") ||
    url.pathname.startsWith("/apple-icon") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/manifest" ||
    url.pathname === "/offline.html";

  if (!isAsset) {
    // Default: network, fall back to cache
    event.respondWith(
      (async () => {
        try {
          const network = await fetch(request);
          if (network.ok) await putRuntime(request, network);
          return network;
        } catch {
          const cached = await fromCache(request);
          if (cached) return cached;
          throw new Error("offline");
        }
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await fromCache(request);
      const networkPromise = fetch(request)
        .then(async (network) => {
          if (network && network.ok) await putRuntime(request, network);
          return network;
        })
        .catch(() => null);

      if (cached) {
        // Update in background
        event.waitUntil(networkPromise);
        return cached;
      }

      const network = await networkPromise;
      if (network) return network;

      if (url.pathname === "/offline.html") {
        return (
          (await caches.match("/offline.html")) ||
          new Response("Offline", { status: 503 })
        );
      }

      return new Response("Offline", {
        status: 503,
        statusText: "Offline",
      });
    })()
  );
});

// Allow page to ask for immediate activation after update
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
