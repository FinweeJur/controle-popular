import { formatDateBR } from "@/lib/betim/format";

export type ItemNaImprensa = {
  titulo: string;
  link: string;
  veiculo: string;
  data?: string | null;
};

/**
 * Faixa "Na imprensa" dos hubs de frente (02/09/2026, auditoria dos 40
 * commits): o radar de notícias existia só no fim de páginas internas
 * (`/ambiental/crimes-socioambientais`, `/paraopeba/clipping`), e nenhum
 * hub avisava que ele existia. A faixa mostra as mais recentes e remete
 * ao radar completo.
 *
 * Réguas que atravessam o componente:
 *
 * - VARREDURA NÃO É CURADORIA: o `contexto` tem que dizer que ninguém leu
 *   nem classificou — misturar robô e acervo daria falsa curadoria a este
 *   (mesma regra de `RadarRecente.tsx`).
 * - NUNCA O TEXTO DA MATÉRIA: título, veículo, data e link; ler é no site
 *   de quem publicou (Lei 9.610/98).
 * - SEM SELVA DE ESTADO VAZIO: radar zerado não rende aviso de "rode o
 *   script" no hub — a faixa simplesmente não aparece (`return null`).
 * - Registro Paraopeba: nenhum pictograma festivo, nenhum tom leve — o
 *   componente é sóbrio por desenho, serve às duas frentes.
 */
export default function NaImprensa({
  itens,
  hrefRadar,
  rotuloRadar,
  contexto,
  cor,
}: {
  itens: ItemNaImprensa[];
  hrefRadar: string;
  rotuloRadar: string;
  contexto: string;
  cor: string;
}) {
  if (itens.length === 0) return null;

  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="font-display text-xl font-semibold">Na imprensa</h2>
      <p className="mt-2 max-w-2xl text-[.92em] text-text-soft">{contexto}</p>
      <ul className="mt-4 space-y-2">
        {itens.map((n) => (
          <li key={n.link}>
            <a
              href={n.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-current"
            >
              <span className="text-text">{n.titulo}</span>
              <span className="mt-1 block font-mono text-[.78em] text-text-soft">
                {n.veiculo}
                {n.data ? ` · ${formatDateBR(n.data.slice(0, 10))}` : ""}
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-4">
        <a href={hrefRadar} className="text-[.9em] font-semibold" style={{ color: cor }}>
          {rotuloRadar} →
        </a>
      </p>
    </section>
  );
}
