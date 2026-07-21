const VERSION = "tm-v11";
const SHELL = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/data.js",
  "./js/fx.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./assets/logo.webp",
  "./assets/music/upbeat.mp3",
  "./assets/music/barcelona.mp3",
  "./assets/card-cultura.webp",
  "./assets/card-ciencia.webp",
  "./assets/card-historia.webp",
  "./assets/card-entretenimiento.webp",
  "./assets/card-deportes.webp",
  "./assets/card-sorpresa.webp",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;
  const url = new URL(req.url);

  // Firestore y CDNs externos: siempre a la red (el multijugador necesita datos frescos)
  if(url.origin !== location.origin) return;

  // HTML: primero la red, para recibir actualizaciones al instante
  if(req.mode === "navigate" || req.destination === "document"){
    e.respondWith(
      fetch(req).then(r => {
        const copia = r.clone();
        caches.open(VERSION).then(c => c.put(req, copia));
        return r;
      }).catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
    );
    return;
  }

  // Resto (imágenes, css, js): primero la caché, así funciona sin internet
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => {
      const copia = r.clone();
      caches.open(VERSION).then(c => c.put(req, copia));
      return r;
    }).catch(() => hit))
  );
});
