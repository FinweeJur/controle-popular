import {
  CLASSES_BAIXO_TEOR,
  MULTIPLICADOR_ROTULO,
  PESO_BAIXO_TEOR,
  PROPOSICAO_TIERS,
  type LinhaProposicao,
  type RankingVereador,
} from "@/lib/betim/vereadores";
import { PRESENCA_ALVO, COERENCIA_ALVO } from "@/lib/atuacao-parlamentar";
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
  rows = [],
}: {
  totaisLinhas: LinhaProposicao[];
  /** As linhas do ranking — só para CONTAR em quantos vereadores presença e
   *  coerência puderam ser medidas. Como a cobertura de baixo teor, este
   *  número sai do dado, nunca de texto escrito à mão: um percentual fixo
   *  envelheceria em silêncio assim que a coleta de votação avançasse. */
  rows?: RankingVereador[];
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

        <DescontoAtuacao rows={rows} />

        <p>
          A pontuação continua sendo uma medida de{" "}
          <strong className="font-medium text-text">
            volume, tipo, teor e regularidade da atuação
          </strong>{" "}
          — não de acerto, de mérito, nem de alinhamento com o interesse
          público.
        </p>
      </div>
    </div>
  );
}

/**
 * As duas regras que DESCONTAM: faltas e incoerência de voto.
 *
 * O texto muda conforme o que esta Câmara sustenta. Uma explicação genérica
 * de como o desconto funciona, exibida numa cidade onde ele não é aplicado a
 * ninguém, faria o leitor supor que os vereadores dali têm presença perfeita.
 * "Não medimos" e "medimos e deu 100%" precisam ler diferente.
 */
function DescontoAtuacao({ rows }: { rows: RankingVereador[] }) {
  if (!rows.length) return null;

  const comPresenca = rows.filter((r) => r.presenca.medido);
  const comCoerencia = rows.filter((r) => r.coerencia.medido);
  const descontados = rows.filter((r) => r.pontuacaoProducao - r.pontuacao > 0.5);
  const motivoPresenca = rows.find((r) => !r.presenca.medido)?.presenca.motivo;
  const motivoCoerencia = rows.find((r) => !r.coerencia.medido)?.coerencia.motivo;

  return (
    <>
      <p>
        <strong className="font-medium text-text">
          Faltar e votar contra direitos derrubam a nota — mas só descontam o
          que a pessoa construiu
        </strong>
        . O desconto incide sobre a parte positiva da pontuação e nunca sobre a
        negativa: se descontasse do total, quem tem saldo negativo por projeto
        reducionista SUBIRIA ao faltar, porque um número negativo multiplicado
        fica maior. Falta e incoerência tiram do que a pessoa fez; não aliviam o
        que ela retirou.
      </p>

      <p>
        <strong className="font-medium text-text">Presença</strong> é a
        proporção de votações nominais em que o vereador consta no painel —
        não é folha de ponto, e não enxerga trabalho em comissão. Acima de{" "}
        {Math.round(PRESENCA_ALVO * 100)}% não há desconto nenhum.{" "}
        {comPresenca.length ? (
          <>
            Medida em{" "}
            <strong className="font-medium text-text">
              {comPresenca.length} de {rows.length}
            </strong>{" "}
            vereadores desta Câmara.
          </>
        ) : (
          <>
            <strong className="font-medium text-text">
              Não foi medida em nenhum vereador desta Câmara
            </strong>
            {motivoPresenca ? <> — {motivoPresenca.toLowerCase()}</> : null} Por
            isso ninguém aqui é descontado por falta: a ausência de desconto é
            limite da fonte, não atestado de assiduidade.
          </>
        )}
      </p>

      <p>
        <strong className="font-medium text-text">
          Coerência com direitos fundamentais
        </strong>{" "}
        compara o voto com o rótulo que a análise deste portal deu à matéria:
        votar a favor de projeto garantista e contra projeto reducionista conta
        como coerente. Acima de {Math.round(COERENCIA_ALVO * 100)}% não há
        desconto.{" "}
        {comCoerencia.length ? (
          <>
            Medida em{" "}
            <strong className="font-medium text-text">
              {comCoerencia.length} de {rows.length}
            </strong>{" "}
            vereadores, e só sobre as matérias que já foram analisadas — uma
            fatia pequena do que a Câmara vota.
          </>
        ) : (
          <>
            <strong className="font-medium text-text">
              Não foi medida em nenhum vereador desta Câmara
            </strong>
            {motivoCoerencia ? <> — {motivoCoerencia.toLowerCase()}</> : null}
          </>
        )}
      </p>

      <p>
        <strong className="font-medium text-text">
          Votar contra o próprio partido NÃO desconta nada
        </strong>
        , e isso é decisão deste portal, não falta de dado. Premiar a fidelidade
        partidária rebaixaria justamente quem rompe com a bancada para defender
        um direito. Coerência aqui é com direitos fundamentais e com a própria
        autoria — o que a pessoa protocola contra o que ela vota —, nunca com a
        legenda.{" "}
        <strong className="font-medium text-text">
          Gasto atípico também não desconta
        </strong>
        : uma despesa fora da curva sustenta “olhe para isto”, não “isto é
        irregular”.
      </p>

      {descontados.length ? (
        <p>
          Nesta Câmara,{" "}
          <strong className="font-medium text-text">
            {descontados.length}{" "}
            {descontados.length === 1 ? "vereador teve" : "vereadores tiveram"}
          </strong>{" "}
          pontuação reduzida por essas regras.
        </p>
      ) : null}
    </>
  );
}
