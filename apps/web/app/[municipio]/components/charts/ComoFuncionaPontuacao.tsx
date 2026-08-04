import {
  CLASSES_BAIXO_TEOR,
  MULTIPLICADOR_ROTULO,
  PESO_BAIXO_TEOR,
  PROPOSICAO_TIERS,
  type LinhaProposicao,
} from "@/lib/betim/vereadores";
import { formatNumberBR } from "@/lib/betim/format";

const COR_POR_SLOT: Record<number, string> = {
  1: "var(--color-ord-1)",
  2: "var(--color-ord-2)",
  3: "var(--color-ord-3)",
  4: "var(--color-ord-4)",
};

const PESO_MAX = Math.max(...PROPOSICAO_TIERS.map((t) => t.peso));

/**
 * Desenha os PESOS na escala real (15 · 6 · 2 · 1). O texto "Projeto de
 * Lei vale 15, Indicação vale 1" é fácil de ler e difícil de sentir —
 * ver a barra do PL quinze vezes maior que a da indicação explica o
 * ranking inteiro antes de olhar qualquer vereador.
 *
 * As duas correções (teor e rótulo) são explicadas aqui, e não só no
 * código, porque MUDAM O PÓDIO: em Betim, 16 das 23 posições trocaram de
 * ocupante quando elas entraram. Ranking público que muda sem dizer por quê
 * lê-se como erro.
 *
 * A COBERTURA SAI DO MESMO DADO QUE ALIMENTA O GRÁFICO (`totaisLinhas`), e
 * não de um número escrito à mão: um percentual fixo no texto envelheceria
 * em silêncio na primeira vez que a fila de análise avançasse — e este é
 * justamente o número que sustenta a ressalva de amostra.
 */
export default function ComoFuncionaPontuacao({
  totaisLinhas,
}: {
  totaisLinhas: LinhaProposicao[];
}) {
  let total = 0;
  let baixoTeor = 0;
  let analisadas = 0;
  let reducionistas = 0;
  for (const l of totaisLinhas) {
    total += l.qtd;
    if (l.classe_teor && CLASSES_BAIXO_TEOR.has(l.classe_teor)) baixoTeor += l.qtd;
    if (l.rotulo) analisadas += l.qtd;
    if (l.rotulo && MULTIPLICADOR_ROTULO[l.rotulo] !== undefined) reducionistas += l.qtd;
  }
  const pctBaixoTeor = total ? Math.round((baixoTeor / total) * 100) : 0;
  const pctAnalisadas = total ? (analisadas / total) * 100 : 0;

  return (
    <div>
      <ul className="space-y-2.5">
        {PROPOSICAO_TIERS.map((tier) => (
          <li key={tier.slot}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-text">{tier.label}</span>
              <span className="font-tabular shrink-0 text-text-soft">
                {tier.peso} {tier.peso === 1 ? "ponto" : "pontos"} cada
              </span>
            </div>
            <div className="cp-ord-track h-3.5 w-full overflow-hidden">
              <div
                className={`cp-ord-seg cp-ord-seg-${tier.slot} h-full rounded-[4px]`}
                style={{
                  width: `${(tier.peso / PESO_MAX) * 100}%`,
                  background: COR_POR_SLOT[tier.slot],
                }}
                title={`${tier.label}: ${tier.peso} ${tier.peso === 1 ? "ponto" : "pontos"}`}
              />
            </div>
            <p className="mt-1 text-xs text-text-soft">{tier.explicacao}</p>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-3 border-t border-border/60 pt-3 text-xs text-text-soft">
        <p>
          Duas correções entram depois do peso por tipo, porque o tipo diz
          quanto custa apresentar uma peça — não o que ela faz:
        </p>

        <p>
          <strong className="font-medium text-text">
            Homenagem, nome de rua e data comemorativa valem {PESO_BAIXO_TEOR}{" "}
            {PESO_BAIXO_TEOR === 1 ? "ponto" : "pontos"}
          </strong>{" "}
          — não os {PESO_MAX} de um projeto de lei comum. Dar nome a uma rua é
          um projeto de lei de verdade, com tramitação de verdade, mas não cria
          nem retira direito de ninguém.{" "}
          {baixoTeor > 0 ? (
            <>
              Nesta Câmara isso alcança{" "}
              <strong className="font-medium text-text">
                {formatNumberBR(baixoTeor)}
              </strong>{" "}
              das {formatNumberBR(total)} proposições ({pctBaixoTeor}%). A
              classificação sai da ementa, por padrão de texto auditável — a
              mesma régua que decide o que não vale gastar análise de direitos.
            </>
          ) : (
            <>Nenhuma proposição desta Câmara caiu nessa classe.</>
          )}
        </p>

        <p>
          <strong className="font-medium text-text">
            Projeto que restringe direito subtrai em vez de somar
          </strong>{" "}
          — o rótulo vem da análise garantista deste portal, e um projeto{" "}
          <em>reducionista</em> tira os mesmos pontos que daria.{" "}
          <strong className="font-medium text-text">
            Esta regra opera sobre amostra, e por isso não é veredito:
          </strong>{" "}
          só{" "}
          <strong className="font-medium text-text">
            {formatNumberBR(analisadas)}
          </strong>{" "}
          das {formatNumberBR(total)} proposições ({pctAnalisadas.toFixed(1)}%)
          já foram analisadas
          {reducionistas > 0 ? (
            <>
              , e {formatNumberBR(reducionistas)}{" "}
              {reducionistas === 1 ? "foi classificada" : "foram classificadas"}{" "}
              como reducionista
            </>
          ) : (
            <>, e nenhuma foi classificada como reducionista até agora</>
          )}
          . Quem tem projeto restritivo que a fila ainda não leu não é
          penalizado — a ausência de desconto não é atestado de nada.
        </p>

        <p>
          A pontuação continua sendo uma medida de{" "}
          <strong className="font-medium text-text">
            volume, tipo e teor da atuação
          </strong>{" "}
          — não de acerto, de mérito, nem de alinhamento com o interesse
          público.
        </p>
      </div>
    </div>
  );
}
