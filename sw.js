const VERSION = "cq-v1";
const SHELL = ["./","./index.html","./css/styles.css","./js/preguntas.js","./js/mundo.js",
  "./js/banderas.js","./js/fx.js","./js/app.js","./js/instalar.js","./manifest.webmanifest",
  "./assets/mapa.webp","./assets/logo.webp","./assets/cmd-vikingo.webp","./assets/cmd-samurai.webp",
  "./assets/music/upbeat.mp3","./assets/music/barcelona.mp3","./icons/icon-192.png","./icons/icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x=>x!==VERSION).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;
  const url = new URL(req.url);
  if(url.origin !== location.origin) return;
  if(req.mode === "navigate" || req.destination === "document"){
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(x=>x.put(req,c)); return r; })
      .catch(()=>caches.match(req).then(r => r || caches.match("./index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const c=r.clone(); caches.open(VERSION).then(x=>x.put(req,c)); return r; }).catch(()=>hit)));
});
