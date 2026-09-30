/*
 * Service worker do Controle Popular — offline conservador.
 *
 * ═══ O QUE É ═══
 *
 * Guarda o "casco" do app (ícone, manifesto, página /offline) e os arquivos
 * estáticos imutáveis (`/_next/static/`), para o site abrir mesmo sem rede.
 *
 * ═══ DECISÃO QUE EVITA DANO ═══
 *
 * Dado público do portal NUNCA pode vir do cache quando há rede: número velho
 * é dano. Por isso as NAVEGAÇÕES (o HTML) são sempre network-first — se a rede
 * responde, o leitor vê o dado atual; só quando a rede falha é que cai para o
 * cache ou para a página /offline.
 *
 * Os arquivos em `/_next/static/` têm nome com hash de conteúdo: cache-first é
 * seguro, porque um deploy novo gera nomes novos.
 */

const CACHE = "cp-casco-v1";
const PRECACHE = ["/offline", "/manifest.webmanifest", "/icon.png", "/apple-icon.png", "/favicon-32x32.png"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => undefined)
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const req = evento.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Estático imutável: cache-first.
  if (url.pathname.startsWith("/_next/static/")) {
    evento.respondWith(
      caches.match(req).then(
        (emCache) =>
          emCache ||
          fetch(req).then((resp) => {
            const copia = resp.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copia)).catch(() => undefined);
            return resp;
          })
      )
    );
    return;
  }

  // Navegação (HTML): network-first, para o dado nunca ficar velho com rede.
  if (req.mode === "navigate") {
    evento.respondWith(
      fetch(req).catch(() => caches.match(req).then((emCache) => emCache || caches.match("/offline")))
    );
  }
});
