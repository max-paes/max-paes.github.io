// Max Pães · Vendedor — funciona sem internet.
// A página abre na hora pelo cache e é atualizada em segundo plano.
const CACHE = "mpv-v177";
const BASE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./logo-app.webp"];
// resposta "limpa": uma cópia marcada como redirecionada não pode abrir a página (o Chrome recusa)
const limpa = r => (r && r.redirected) ? r.blob().then(b => new Response(b, { status: r.status, statusText: r.statusText, headers: r.headers })) : Promise.resolve(r);
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => Promise.all(BASE.map(u => fetch(u, { cache: "reload" }).then(limpa).then(r => { if (r && r.ok) return c.put(u === "./" ? "./index.html" : u, r); }).catch(() => {}))))); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("message", e => { if (e.data && e.data.tipo === "atualizar") self.skipWaiting(); });
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET") return;
  if (/versao\.txt/.test(u.pathname)) return;
  if (u.searchParams.has("fresh") || u.searchParams.has("limpar")) return; // busca forçada da versão nova // checagem de versão: sempre da rede
  if (/firestore\.googleapis|identitytoolkit|securetoken|googleapis\.com\/(identity|v1)/.test(u.host + u.pathname)) return; // dados e login: sempre direto
  const pagina = r.mode === "navigate" || (u.origin === location.origin && /\/(index\.html)?$/.test(u.pathname));
  if (pagina) {
    // abre na hora com a cópia do celular e atualiza a cópia em segundo plano (a barra "Atualizar" avisa quando há versão nova)
    // primeiro a internet (até 3 s); sem resposta a tempo ou sem sinal, usa a cópia do celular (sempre "limpa")
    const rede = fetch(r).then(res => { if (res.ok) { const c = res.clone(); limpa(c).then(l => caches.open(CACHE).then(k => k.put("./index.html", l))).catch(() => {}); } return res; });
    const copia = () => caches.match("./index.html").then(hit => hit ? limpa(hit) : null);
    const espera = new Promise(ok => setTimeout(ok, 3000)).then(copia);
    e.waitUntil(rede.catch(() => {}));
    e.respondWith(Promise.race([rede.catch(() => copia().then(c => c || Response.error())), espera.then(c => c || rede)]).then(x => x || rede));
    return;
  }
  if (u.origin === location.origin || /gstatic\.com|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(u.host)) {
    e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => { if (res.ok || res.type === "opaque") { const c = res.clone(); caches.open(CACHE).then(k => k.put(r, c)); } return res; })));
  }
});

