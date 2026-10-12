// Max Pães · Vendedor — funciona sem internet.
// A página principal busca primeiro na rede (para receber atualizações) e usa o cache se estiver sem sinal.
const CACHE = "mpv-v49";
const BASE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./logo-app.webp"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE))); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("message", e => { if (e.data && e.data.tipo === "atualizar") self.skipWaiting(); });
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET") return;
  if (/versao\.txt/.test(u.pathname)) return; // checagem de versão: sempre da rede
  if (/firestore\.googleapis|identitytoolkit|securetoken|googleapis\.com\/(identity|v1)/.test(u.host + u.pathname)) return; // dados e login: sempre direto
  const pagina = r.mode === "navigate" || (u.origin === location.origin && /\/(index\.html)?$/.test(u.pathname));
  if (pagina) {
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(k => k.put("./index.html", c)); return res; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  if (u.origin === location.origin || /gstatic\.com|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(u.host)) {
    e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => { if (res.ok || res.type === "opaque") { const c = res.clone(); caches.open(CACHE).then(k => k.put(r, c)); } return res; })));
  }
});

