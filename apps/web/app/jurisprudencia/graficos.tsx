/**
 * @file Gráficos do painel: barras, rosca e blocos — sem biblioteca.
 *
 * POR QUE SEM BIBLIOTECA
 *
 * O portal já paga 40 MB de dados e um build de 10 minutos; um pacote de
 * gráfico entra no bundle do cliente e vira dependência a auditar. Aqui tudo é
 * SVG e CSS no próprio servidor: zero JavaScript enviado ao leitor, e o gráfico
 * aparece no HTML.
 *
 * LEGENDA EM DOIS LUGARES
 *
 * Pedido do dono (02/11/2026): a legenda precisa existir DENTRO da barra/rosca
 * e TAMBÉM ao lado ou abaixo. Dentro, o leitor entende a proporção sem tirar o
 * olho da figura; ao lado, ele lê o número exato sem comparar posições. Os dois
 * usam o mesmo dado — o rótulo dentro só aparece quando há espaço (≥ 8% da
 * rosca, ≥ 14% da barra), para não virar letra de 4 px.
 */

import ContadorAnimado from "@/app/components/dados/ContadorAnimado";
import BarraAnimada from "@/app/components/dados/BarraAnimada";

/** Paleta com contraste conferido nas duas superfícies (clara e escura). */
export const PALETA = [
  "var(--cp-primary)",
  "var(--cp-secondary)",
  "var(--cp-tertiary)",
  "var(--cp-eixo-direitos)",
  "var(--cp-eixo-terra)",
  "var(--cp-eixo-estado)",
  "var(--cp-text-soft)",
  "var(--cp-border)",
];

export type TipoGrafico = "barras" | "rosca" | "blocos";

export const TIPOS_GRAFICO: { slug: TipoGrafico; rotulo: string }[] = [
  { slug: "barras", rotulo: "Barras" },
  { slug: "rosca", rotulo: "Rosca" },
  { slug: "blocos", rotulo: "Blocos" },
];

export type ItemGrafico = { chave: string; rotulo: string; n: number; cor: string };

/**
 * Prepara os itens: corta no limite, agrega o resto e distribui cor.
 *
 * `limite` existe porque rosca com 20 fatias não se lê. O resto vira uma
 * categoria própria, com o N real — nunca desaparece.
 */
export function prepararItens(
  dados: [string, number][],
  limite: number,
  rotular: (chave: string) => string,
): ItemGrafico[] {
  const visiveis = dados.slice(0, limite);
  const resto = dados.slice(limite).reduce((soma, [, n]) => soma + n, 0);
  const itens: ItemGrafico[] = visiveis.map(([chave, n], indice) => ({
    chave,
    rotulo: rotular(chave),
    n,
    cor: PALETA[indice % PALETA.length],
  }));
  if (resto > 0) {
    itens.push({
      chave: "__resto",
      rotulo: `+ ${dados.length - limite} categorias`,
      n: resto,
      cor: PALETA[PALETA.length - 1],
    });
  }
  return itens;
}

function Legenda({ itens, total }: { itens: ItemGrafico[]; total: number }) {
  return (
    <ul className="space-y-1 text-sm">
      {itens.map((item) => (
        <li key={item.chave} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ background: item.cor }}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 truncate" title={item.rotulo}>
            {item.rotulo}
          </span>
          <span className="shrink-0 font-tabular">{item.n.toLocaleString("pt-BR")}</span>
          <span className="w-11 shrink-0 text-right font-tabular opacity-60">
            {total ? `${Math.round((100 * item.n) / total)}%` : "—"}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Barras horizontais: percentual dentro, rótulo e número ao lado. */
export function BarrasHorizontais({ itens, total }: { itens: ItemGrafico[]; total: number }) {
  const maior = Math.max(...itens.map((item) => item.n), 1);
  return (
    <ul className="space-y-1.5">
      {itens.map((item) => {
        const fracao = total ? item.n / total : 0;
        const largura = (100 * item.n) / maior;
        return (
          <li key={item.chave} className="flex items-center gap-2 text-sm">
            <span className="w-[8.5rem] shrink-0 truncate" title={item.rotulo}>
              {item.rotulo}
            </span>
            <span className="relative h-5 min-w-0 flex-1 overflow-hidden rounded bg-[var(--cp-surface-2)]">
              <BarraAnimada
                fracao={item.n / maior}
                cor={item.cor}
                className="absolute inset-y-0 left-0 rounded"
                style={{ width: `${largura}%` }}
              />
              {fracao >= 0.14 ? (
                <span className="absolute inset-y-0 left-1 flex items-center text-xs font-semibold text-white">
                  {Math.round(100 * fracao)}%
                </span>
              ) : null}
            </span>
            <span className="w-14 shrink-0 text-right font-tabular">
              <ContadorAnimado valor={item.n} />
            </span>
            <span className="w-11 shrink-0 text-right font-tabular opacity-60">
              {total ? `${Math.round(100 * fracao)}%` : "—"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Rosca em SVG, com o percentual dentro da fatia e o total no centro.
 *
 * Cada fatia é um `<circle>` com `stroke-dasharray`; o rótulo é posicionado no
 * ângulo médio. Fatia menor que 8% não recebe rótulo — ficaria ilegível — e o
 * número continua na legenda ao lado.
 */
/**
 * Fatias da rosca com o início de cada arco já calculado.
 *
 * Fica fora do componente de propósito: calcular isso durante o render com uma
 * variável acumuladora viola a regra de imutabilidade do React (o lint pega) e
 * produz bug quando o React re-renderiza.
 */
function calcularFatias(itens: ItemGrafico[], total: number) {
  const fatias: { item: ItemGrafico; inicio: number; fracao: number }[] = [];
  let inicio = 0;
  for (const item of itens) {
    const fracao = total ? item.n / total : 0;
    fatias.push({ item, inicio, fracao });
    inicio += fracao;
  }
  return fatias;
}

export function Rosca({ itens, total }: { itens: ItemGrafico[]; total: number }) {
  const raio = 40;
  const volta = 2 * Math.PI * raio;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <svg
        viewBox="0 0 100 100"
        className="h-40 w-40 shrink-0"
        role="img"
        aria-label={`Rosca com ${itens.length} categorias e ${total} no total`}
      >
        <circle cx="50" cy="50" r={raio} fill="none" stroke="var(--cp-surface-2)" strokeWidth="16" />
        {calcularFatias(itens, total).map(({ item, inicio, fracao }) => {
          const angulo = (inicio + fracao / 2) * 360 - 90;
          const rad = (angulo * Math.PI) / 180;
          const x = 50 + 26 * Math.cos(rad);
          const y = 50 + 26 * Math.sin(rad);
          return (
            <g key={item.chave}>
              <circle
                cx="50"
                cy="50"
                r={raio}
                fill="none"
                stroke={item.cor}
                strokeWidth="16"
                strokeDasharray={`${fracao * volta} ${volta}`}
                strokeDashoffset={-inicio * volta}
                transform="rotate(-90 50 50)"
              />
              {fracao >= 0.08 ? (
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white"
                  style={{ fontSize: 9, fontWeight: 600 }}
                >
                  {Math.round(100 * fracao)}%
                </text>
              ) : null}
            </g>
          );
        })}
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-[var(--cp-text)]"
          style={{ fontSize: 12, fontWeight: 700 }}
        >
          {total.toLocaleString("pt-BR")}
        </text>
      </svg>
      <div className="min-w-0 flex-1">
        <Legenda itens={itens} total={total} />
      </div>
    </div>
  );
}

/** Blocos proporcionais: o nome dentro quando cabe, a legenda sempre abaixo. */
export function Blocos({ itens, total }: { itens: ItemGrafico[]; total: number }) {
  return (
    <div className="space-y-3">
      <div className="flex h-28 gap-1 overflow-hidden rounded">
        {itens.map((item) => {
          const fracao = total ? item.n / total : 0;
          return (
            <div
              key={item.chave}
              className="flex min-w-0 flex-col justify-end overflow-hidden p-1"
              style={{ width: `${Math.max(fracao * 100, 2)}%`, background: item.cor }}
              title={`${item.rotulo}: ${item.n}`}
            >
              {fracao >= 0.12 ? (
                <>
                  <span className="truncate text-xs font-semibold text-white">
                    {item.rotulo}
                  </span>
                  <span className="text-xs font-tabular text-white/90">
                    {Math.round(100 * fracao)}%
                  </span>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
      <Legenda itens={itens} total={total} />
    </div>
  );
}

/** Escolhe a representação pedida; o dado é o mesmo, só muda o desenho. */
export function CorpoGrafico({
  tipo,
  itens,
  total,
}: {
  tipo: TipoGrafico;
  itens: ItemGrafico[];
  total: number;
}) {
  if (tipo === "rosca") return <Rosca itens={itens} total={total} />;
  if (tipo === "blocos") return <Blocos itens={itens} total={total} />;
  return <BarrasHorizontais itens={itens} total={total} />;
}
