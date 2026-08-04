import { composicaoPontuacao, type LinhaProposicao } from "@/lib/betim/vereadores";
import { formatNumberBR } from "@/lib/betim/format";
import OrdinalLegend from "./OrdinalLegend";

const COR_POR_SLOT: Record<number, string> = {
  1: "var(--color-ord-1)",
  2: "var(--color-ord-2)",
  3: "var(--color-ord-3)",
  4: "var(--color-ord-4)",
};

export interface ComposicaoCamaraProps {
  /** As células (tipo, teor, rótulo) da Câmara inteira. Não é mais a
   *  contagem por tipo: desde que teor e rótulo entraram na pontuação, o
   *  tipo sozinho não permite calcular pontos. */
  totaisLinhas: LinhaProposicao[];
}

/**
 * Duas barras 100% empilhadas lado a lado: a mesma legislatura contada
 * por QUANTIDADE e por PONTOS. É o gráfico que justifica a existência do
 * peso — as indicações dominam o volume, mas os projetos de lei dominam
 * a pontuação, então "quem mais apresenta" e "quem mais pontua" são
 * perguntas diferentes.
 *
 * São dois gráficos separados normalizados a 100%, não um gráfico de dois
 * eixos: as unidades (proposições e pontos) não compartilham escala.
 */
export default function ComposicaoCamara({ totaisLinhas }: ComposicaoCamaraProps) {
  const segmentos = composicaoPontuacao(totaisLinhas);
  const totalQtd = segmentos.reduce((a, s) => a + s.qtd, 0);
  const totalPontos = segmentos.reduce((a, s) => a + s.pontos, 0);
  if (totalQtd === 0) return null;

  const barras = [
    {
      titulo: "Por quantidade",
      sub: `${formatNumberBR(totalQtd)} proposições`,
      total: totalQtd,
      valor: (s: (typeof segmentos)[number]) => s.qtd,
      unidade: "proposições",
    },
    {
      titulo: "Por pontos",
      sub: `${formatNumberBR(totalPontos)} pontos`,
      total: totalPontos,
      valor: (s: (typeof segmentos)[number]) => s.pontos,
      unidade: "pontos",
    },
  ];

  // A frase de leitura é DERIVADA do dado, nunca escrita à mão: qual tipo
  // domina o volume e qual domina os pontos muda de cidade pra cidade (e
  // de legislatura pra legislatura). Uma narrativa fixa aqui já nasceu
  // errada uma vez — em Betim os projetos de lei lideram as duas contas,
  // ao contrário do que a referência de outra cidade sugeria.
  const maiorPorPontos = segmentos.reduce((a, b) => (b.pontos > a.pontos ? b : a));
  const maiorPorQtd = segmentos.reduce((a, b) => (b.qtd > a.qtd ? b : a));
  const pctQtd = (maiorPorPontos.qtd / totalQtd) * 100;
  const pctPontos = (maiorPorPontos.pontos / totalPontos) * 100;
  const fmtPct = (n: number) => `${n.toFixed(0)}%`;

  return (
    <div>
      <p className="mb-4 text-sm text-text-soft">
        <strong className="font-medium text-text">{maiorPorPontos.tier.label}</strong> responde
        por {fmtPct(pctQtd)} das proposições, mas por{" "}
        <strong className="font-medium text-text">{fmtPct(pctPontos)} dos pontos</strong> — é o
        peso {maiorPorPontos.tier.peso}× amplificando a diferença.
        {maiorPorQtd.tier.slot !== maiorPorPontos.tier.slot ? (
          <>
            {" "}
            O tipo mais numeroso é outro: {maiorPorQtd.tier.label.toLowerCase()} (
            {fmtPct((maiorPorQtd.qtd / totalQtd) * 100)} do volume,{" "}
            {fmtPct((maiorPorQtd.pontos / totalPontos) * 100)} dos pontos).
          </>
        ) : null}
      </p>

      <div className="mb-4">
        <OrdinalLegend />
      </div>

      <div className="space-y-4">
        {barras.map((barra) => (
          <div key={barra.titulo}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-text">{barra.titulo}</span>
              <span className="font-tabular text-xs text-text-soft">{barra.sub}</span>
            </div>
            <div className="cp-ord-track flex h-4 w-full overflow-hidden">
              {segmentos.map((s) => {
                const v = barra.valor(s);
                const pct = (v / barra.total) * 100;
                return (
                  <div
                    key={s.tier.slot}
                    className={`cp-ord-seg cp-ord-seg-${s.tier.slot} h-full first:rounded-l-[4px] last:rounded-r-[4px]`}
                    style={{ width: `${pct}%`, background: COR_POR_SLOT[s.tier.slot] }}
                    title={`${s.tier.label}: ${formatNumberBR(v)} ${barra.unidade} (${pct.toFixed(1).replace(".", ",")}%)`}
                  />
                );
              })}
            </div>
            {/* Rótulos diretos só nos segmentos com espaço pra caber
                (>= 8%) — o resto fica no title/hover e na legenda. */}
            <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
              {segmentos
                .filter((s) => (barra.valor(s) / barra.total) * 100 >= 8)
                .map((s) => (
                  <li
                    key={s.tier.slot}
                    className="flex items-center gap-1.5 text-xs text-text-soft"
                  >
                    <span
                      aria-hidden
                      className={`cp-ord-seg cp-ord-seg-${s.tier.slot} h-2 w-2 shrink-0 rounded-[2px]`}
                      style={{ background: COR_POR_SLOT[s.tier.slot] }}
                    />
                    {s.tier.labelCurto}
                    <span className="font-tabular text-text">
                      {((barra.valor(s) / barra.total) * 100).toFixed(0)}%
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Achado real 2026-07-24 (auditoria de responsividade mobile):
          `<table className="sr-only">` direto ignora o width:1px/height:1px
          do próprio sr-only (peculiaridade de tabela com position:absolute +
          table-layout:fixed em pelo menos um motor de renderização testado)
          e o layout intrínseco da tabela (492px) vazava pro scrollWidth da
          página inteira, causando overflow horizontal só na Câmara. Um
          `<div>` encapsulando com overflow:hidden + tamanho travado recorta
          de verdade -- a tabela em si fica sem classe nenhuma, só semântica
          pra leitor de tela. */}
      <div className="sr-only" style={{ overflow: "hidden", width: "1px", height: "1px" }}>
        <table>
          {/* "Peso base", e não "Peso", porque a multiplicação PAROU DE
              FECHAR: com o desconto de baixo teor e o sinal negativo do
              rótulo reducionista, os 755 projetos de lei de Betim somam
              8.400 pontos e não 11.325. Esta tabela é a alternativa em texto
              para leitor de tela — ela era o único lugar do gráfico onde os
              três números apareciam juntos, então a conta quebrada só
              aparecia para quem usa leitor de tela. */}
          <caption>
            Composição das proposições da legislatura em curso, por quantidade
            e por pontos. Os pontos já incluem os ajustes de teor (homenagem,
            nome de rua e data comemorativa valem menos) e de rótulo (projeto
            que restringe direito subtrai), então não são o produto do peso
            base pela quantidade.
          </caption>
          <thead>
            <tr>
              <th scope="col">Tipo</th>
              <th scope="col">Peso base</th>
              <th scope="col">Quantidade</th>
              <th scope="col">Pontos (já ajustados)</th>
            </tr>
          </thead>
          <tbody>
            {segmentos.map((s) => (
              <tr key={s.tier.slot}>
                <th scope="row">{s.tier.label}</th>
                <td>{s.tier.peso}</td>
                <td>{formatNumberBR(s.qtd)}</td>
                <td>{formatNumberBR(s.pontos)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
