/**
 * voo — contrato do deep link "Voe até aqui" do globo 3D (lado Next.js).
 *
 * Espelha `apps/web/public/terras/globo/js/core/voo.js` (a leitura). O globo é
 * estático (servido de `public/terras/globo/`), então não dá para importar o
 * módulo de lá aqui; este é o lado que MONTA o endereço, e o `.js` é o lado que
 * LÊ. Se um dos dois mudar o formato, o outro quebra — por isso o formato está
 * escrito nos dois lugares e coberto por teste dos dois lados.
 *
 * Formato: `/terras/globo/index.html?voe=<lat>,<lon>&nome=<texto>&ctx=<slug>&z=<distância>`
 *
 * A base é `.../index.html`, NÃO `.../`: o Next responde `/terras/globo/` com
 * 308 (redirect de barra) e o destino cai em 404 — o leitor via "página não
 * encontrada" em vez do globo. `GloboIframe.tsx` já usa `index.html` pelo mesmo
 * motivo.
 */
export interface Voo {
  lat: number;
  lon: number;
  nome?: string | null;
  ctx?: string | null;
  /** Distância ao centro da Terra (1 = superfície). Omitida, o globo usa o padrão. */
  distancia?: number;
  /** Caminho do globo; trocável em teste. */
  base?: string;
}

export function enderecoVoarAte({ lat, lon, nome, ctx, distancia, base = "/terras/globo/index.html" }: Voo): string {
  const p = new URLSearchParams();
  p.set("voe", `${lat},${lon}`);
  if (nome) p.set("nome", String(nome).slice(0, 120));
  if (ctx) p.set("ctx", ctx);
  if (distancia) p.set("z", String(distancia));
  return `${base}?${p.toString()}`;
}
