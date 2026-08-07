import { formatCurrencyBRL, formatNumberBR } from "@/lib/betim/format";
import type { RankingVereador } from "@/lib/betim/vereadores";

/**
 * Presença, coerência de voto e gasto atípico de UM vereador.
 *
 * O que este painel existe para impedir: a pontuação passou a cair por falta
 * e por incoerência, e um número que cai sem explicação ao lado lê-se como
 * erro do site. Aqui cada desconto mostra o numerador, o denominador e a
 * fonte — e onde não houve medição, mostra o MOTIVO em vez de um traço.
 *
 * ═══ "NÃO MEDIDO" É INFORMAÇÃO, NÃO ESPAÇO VAZIO ═══
 *
 * Um traço mudo faz o leitor supor a leitura mais favorável ("deve ser
 * zero"). Em São Paulo, onde a fonte não declara ausência, e em Belo
 * Horizonte, onde a coleta de votações mal começou, o painel diz isso com
 * todas as letras. É a mesma disciplina do aviso de cobertura da análise
 * garantista: a ausência de desconto não é atestado de nada.
 */

export interface GastoAtipico {
  grupo_verba: string | null;
  fornecedor: string | null;
  data: string | null;
  valor: number;
  mediana_grupo: number;
  vezes_a_mediana: number;
  linhas_no_grupo: number;
}

/**
 * A FRAÇÃO vem primeiro e grande — "40/100 votações", não só "40%".
 *
 * Um percentual sozinho esconde o tamanho da amostra atrás de um número
 * redondo: "88%" não diz se são 88 de 100 ou 8 de 9. A fração deixa a
 * amostra visível no mesmo relance, e o percentual vira reforço ao lado —
 * o mesmo formato do painel de presença do Congresso
 * (`app/congresso/components/PainelPresenca.tsx`), para as duas telas lerem
 * como a mesma régua.
 */
function Metrica({
  titulo,
  numerador,
  denominador,
  unidade,
  taxa,
  detalhe,
  motivo,
}: {
  titulo: string;
  numerador: number;
  denominador: number;
  unidade: string;
  taxa: number | null;
  detalhe: string;
  motivo: string | null;
}) {
  return (
    <div>
      <span className="text-sm font-medium text-text">{titulo}</span>
      {taxa === null ? (
        <p className="mt-1.5 text-sm text-text-soft">
          <strong className="font-medium text-text">Não medida.</strong> {motivo}
        </p>
      ) : (
        <>
          <p className="font-tabular mt-1 text-2xl font-bold text-text">
            {formatNumberBR(numerador)}/{formatNumberBR(denominador)}{" "}
            <span className="text-base font-normal text-text-soft">{unidade}</span>
          </p>
          {/* Barra em CSS puro, como o resto dos gráficos do portal — zero JS. */}
          <div
            className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-border/60"
            role="img"
            aria-label={`${titulo}: ${Math.round(taxa * 100)}%`}
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max(2, Math.round(taxa * 100))}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-text-soft">
            {Math.round(taxa * 100)}% · {detalhe}
          </p>
        </>
      )}
    </div>
  );
}

export default function PainelAtuacao({
  vereador,
  gastos = [],
}: {
  vereador: RankingVereador;
  /** Já filtrados para esta pessoa por quem chama. */
  gastos?: GastoAtipico[];
}) {
  const { presenca, coerencia } = vereador;
  const desconto = vereador.pontuacaoProducao - vereador.pontuacao;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Metrica
          titulo="Presença em votações"
          numerador={presenca.compareceu}
          denominador={presenca.base}
          unidade="votações"
          taxa={presenca.taxa}
          motivo={presenca.motivo}
          detalhe={
            `${formatNumberBR(presenca.ausente)} ${
              presenca.ausente === 1 ? "ausência" : "ausências"
            }` +
            (presenca.semVotar > 0
              ? ` · presente sem registrar voto em ${formatNumberBR(presenca.semVotar)}`
              : "")
          }
        />
        <Metrica
          titulo="Coerência com direitos"
          numerador={coerencia.coerentes}
          denominador={coerencia.base}
          unidade="votos coerentes"
          taxa={coerencia.taxa}
          motivo={coerencia.motivo}
          detalhe={
            `alinhado com a direção que a análise atribuiu à matéria` +
            (coerencia.semDirecao > 0
              ? ` · outras ${formatNumberBR(coerencia.semDirecao)} matérias ` +
                `analisadas não tinham direção de direitos, e ficam fora da conta`
              : "")
          }
        />
      </div>

      {coerencia.contradizPropriaAutoria ? (
        <p className="rounded-lg border border-border bg-surface-soft px-3 py-2 text-xs text-text">
          <strong className="font-medium">Vota contra o que propõe.</strong> O
          perfil das proposições que esta pessoa protocola aponta para um lado e
          o dos votos dela para o outro. É uma contradição dela com ela mesma —
          não com o partido, e não com uma expectativa deste portal.
        </p>
      ) : null}

      {desconto > 0.5 ? (
        <p className="text-xs text-text-soft">
          Somadas, essas duas regras reduziram a pontuação de atuação de{" "}
          <span className="font-tabular text-text">
            {formatNumberBR(vereador.pontuacaoProducao)}
          </span>{" "}
          para{" "}
          <span className="font-tabular text-text">
            {formatNumberBR(vereador.pontuacao)}
          </span>{" "}
          pontos. O desconto incide só sobre a parte positiva: projeto que
          restringe direito continua subtraindo integralmente.
        </p>
      ) : null}

      {gastos.length ? (
        <div className="border-t border-border/60 pt-4">
          <h3 className="mb-1 text-sm font-medium text-text">
            Despesas fora da curva do próprio grupo
          </h3>
          <p className="mb-3 text-xs text-text-soft">
            Cada linha é uma despesa de verba de gabinete que ficou entre as 5%
            maiores do seu grupo <em>e</em> custou pelo menos o dobro da mediana
            desse grupo — comparada só com despesas do{" "}
            <strong className="font-medium text-text">mesmo tipo, nesta cidade</strong>,
            porque R$ 2 mil de aluguel é rotina e R$ 2 mil de alimentação não é.{" "}
            <strong className="font-medium text-text">
              Estar aqui não significa irregularidade
            </strong>{" "}
            e não desconta ponto nenhum no ranking: é um convite a olhar, não um
            veredito.
          </p>
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {gastos.map((g, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3 py-2.5 text-xs">
                <strong className="font-tabular text-sm text-text">
                  {formatCurrencyBRL(g.valor)}
                </strong>
                <span className="font-tabular text-text-soft">
                  {g.vezes_a_mediana.toFixed(1)}× a mediana do grupo (
                  {formatCurrencyBRL(g.mediana_grupo)})
                </span>
                <span className="w-full text-text-soft sm:w-auto">
                  {g.grupo_verba ?? "—"}
                  {g.fornecedor ? ` · ${g.fornecedor}` : ""}
                  {g.data ? ` · ${g.data}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
