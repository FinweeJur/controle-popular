/**
 * @file Barras do post — comparação de valores com legenda dentro da barra.
 *
 * O QUE É: a seção de gráfico do artigo, sem biblioteca, para séries curtas
 * que já existem no texto (ex.: remuneração por titulação e jornada).
 *
 * PADRÃO DO PORTAL (pedido do dono, 02/11/2026):
 * - a legenda existe DENTRO da barra e TAMBÉM ao lado: dentro fica a
 *   proporção (percentual da maior barra), ao lado o valor exato;
 * - o percentual só aparece quando há espaço (≥ 14% da barra), para não
 *   virar letra ilegível;
 * - `BarraAnimada` cresce uma vez ao entrar na tela, respeita
 *   `prefers-reduced-motion` e entrega o tamanho final no HTML;
 * - `ContadorAnimado` anima o valor exato com o número final no SSR.
 *
 * POR QUE SERVIDOR: só os dois componentes de animação são cliente. O resto
 * do gráfico sai no HTML, sem pacote de gráfico no bundle.
 */
import BarraAnimada from "@/app/components/dados/BarraAnimada";
import ContadorAnimado from "@/app/components/dados/ContadorAnimado";
import type { GraficoNoticia } from "@/lib/noticias/portal";

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Unidade da série: `inteiro` para contagem, reais no padrão antigo. */
function formatarValor(valor: number, formato?: "moeda" | "inteiro"): string {
  if (formato === "inteiro") return valor.toLocaleString("pt-BR");
  return formatarMoeda(valor);
}

export default function GraficoBarrasArtigo({ grafico }: { grafico?: GraficoNoticia | null }) {
  if (!grafico?.itens?.length) return null;
  const maior = Math.max(...grafico.itens.map((item) => item.valor), 1);
  // Série de contagem não leva "R$" nem duas casas decimais no cartão.
  const casas = grafico.formato === "inteiro" ? 0 : 2;
  const prefixo = grafico.formato === "inteiro" ? "" : "R$ ";

  return (
    <section aria-label={grafico.titulo} className="my-8">
      <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-3">{grafico.titulo}</h3>
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
        <ul className="w-full space-y-3">
          {grafico.itens.map((item) => {
            const fracao = Math.max(0, Math.min(1, item.valor / maior));
            return (
              <li key={item.rotulo}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate text-text-soft" title={item.rotulo}>
                    {item.rotulo}
                  </span>
                  <span className="shrink-0 whitespace-nowrap font-tabular font-semibold text-text">
                    <ContadorAnimado valor={item.valor} casas={casas} prefixo={prefixo} />
                  </span>
                </div>
                <div
                  role="img"
                  aria-label={`${item.rotulo}: ${formatarValor(item.valor, grafico.formato)}`}
                  className="relative mt-1 block h-4 w-full overflow-hidden rounded bg-surface-2"
                >
                  <BarraAnimada
                    fracao={fracao}
                    className="absolute inset-y-0 left-0 rounded bg-primary"
                  />
                  {fracao >= 0.14 ? (
                    <span className="absolute inset-y-0 left-1.5 flex items-center text-xs font-semibold text-white">
                      {Math.round(fracao * 100)}%
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
        {grafico.nota && <p className="mt-3 text-xs text-muted">{grafico.nota}</p>}
        {grafico.fonte && (
          <p className="mt-1 text-xs text-muted">
            Fonte:{" "}
            <a
              href={grafico.fonte.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {grafico.fonte.nome} ↗
            </a>
          </p>
        )}
      </div>
    </section>
  );
}
