import DataCard from "@/app/[municipio]/components/DataCard";
import TabelaScroll from "@/app/[municipio]/components/TabelaScroll";
import type { GrupoViagens, ViagensData } from "@/lib/betim/viagens";
import Moeda from "@/app/components/Moeda";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import type { Cidade } from "@/lib/betim/cidade";

/**
 * @file Bloco de diárias e viagens oficiais, absorvido pelo painel da
 * Prefeitura em 02/11/2026.
 *
 * POR QUE SAIU DE ROTA PRÓPRIA: a página `/prefeitura/diarias` era só uma
 * tabela servida pelo servidor — sem busca, sem filtro, sem exportação, sem
 * componente de cliente. Era o único membro da família que não tinha dado
 * próprio com interação; por isso virou recorte do painel (`?area=pessoal`)
 * em vez de continuar uma URL irmã multiplicada por doze cidades.
 *
 * O QUE NÃO PODIA MUDAR, e não mudou: a separação entre diária e passagem
 * aérea (somar as duas afirmaria um gasto que não existe com esse nome), o
 * "não publicado" que nunca vira R$ 0,00, a contagem de registros sem valor
 * ao lado do total, e a frase que diz o que a fonte daquela cidade publica.
 *
 * POR QUE EM QUATRO PEÇAS: cada uma responde a uma pergunta só (a fonte
 * publica? há linha? qual rubrica?), o que mantém a leitura fácil e o
 * componente abaixo do limite de complexidade do CodeScene.
 *
 * FONTE: tabela `diarias`, alimentada pelos dados abertos da Prefeitura e da
 * Câmara; cada grupo carrega o link da própria fonte quando existe.
 */

export default function PainelDiarias({
  cidade,
  viagens,
}: {
  cidade: Cidade;
  viagens: ViagensData;
}) {
  const { grupos, totalLinhas, ok } = viagens;

  return (
    <div id="diarias" className="mt-8 scroll-mt-24 space-y-6">
      <div>
        <h4 className="font-display text-xl font-semibold text-text">
          Diárias e viagens oficiais
        </h4>
        <SituacaoDaFonte
          cidade={cidade}
          grupos={grupos}
          totalLinhas={totalLinhas}
          ok={ok}
        />
      </div>

      {ok && totalLinhas > 0 ? (
        <>
          <CardsPorRubrica grupos={grupos} cidade={cidade} />
          {grupos.map((g) => (
            <Grupo key={g.natureza} grupo={g} varios={grupos.length > 1} />
          ))}
        </>
      ) : null}
    </div>
  );
}

/** O que a fonte desta cidade publica — e o que ela não publica. */
function SituacaoDaFonte({
  cidade,
  grupos,
  totalLinhas,
  ok,
}: {
  cidade: Cidade;
  grupos: GrupoViagens[];
  totalLinhas: number;
  ok: boolean;
}) {
  if (!ok) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-sm text-text-soft">
        <p className="font-medium text-text">Em breve</p>
        <p className="mt-2">
          Ainda não há registro de viagem oficial de {cidade.nome} neste portal.
        </p>
      </div>
    );
  }

  if (totalLinhas === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-sm text-text-soft">
        <p className="font-medium text-text">Nada publicado</p>
        <p className="mt-2">
          Nenhuma diária ou passagem de {cidade.nome} foi encontrada nas fontes
          abertas que este portal lê. Ausência aqui significa que a fonte não
          publica — não que ninguém viajou.
        </p>
      </div>
    );
  }

  return <CoberturaDaFonte cidade={cidade} grupos={grupos} />;
}

/**
 * O QUE ESTE BLOCO COBRE SAI DO DADO, não de um texto fixo — mesma regra da
 * página de obras. Em Belo Horizonte a fonte publica SÓ passagem aérea (a PBH
 * não abre diária em dataset nenhum); em Betim, só diária de vereador. Um
 * bloco chamado "Diárias" que mostra passagem sem dizer afirmaria um gasto
 * que a cidade não tem com esse nome.
 */
function CoberturaDaFonte({
  cidade,
  grupos,
}: {
  cidade: Cidade;
  grupos: GrupoViagens[];
}) {
  const naturezas = grupos.map((g) => g.natureza);
  const soPassagem = naturezas.length === 1 && naturezas[0] === "passagem_aerea";
  const soDiaria = naturezas.length === 1 && naturezas[0] === "diaria";

  return (
    <p className="mt-2 max-w-3xl text-sm text-text-soft">
      Quem viajou a serviço de {cidade.nome}, para onde, por quê e quanto
      custou.{" "}
      {soPassagem ? (
        <>
          <strong className="text-text">
            A fonte publica apenas passagem aérea, não diária.
          </strong>{" "}
          São rubricas diferentes: diária é a verba de alimentação e hospedagem
          por dia de afastamento, passagem é o bilhete. O que está abaixo é o
          bilhete — o gasto com diária não é público aqui.
        </>
      ) : null}
      {soDiaria ? (
        <>
          {" "}
          <strong className="text-text">A fonte publica apenas diária.</strong>{" "}
          O que a administração gastou com passagem não entra nesta conta.
        </>
      ) : null}
    </p>
  );
}

/** Um cartão por rubrica, com total e quantos registros não têm valor. */
function CardsPorRubrica({
  grupos,
  cidade,
}: {
  grupos: GrupoViagens[];
  cidade: Cidade;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {grupos.map((g) => (
        <DataCard
          key={g.natureza}
          title={g.rotulo}
          source={{
            label: `Dados abertos — ${cidade.nome}`,
            url: g.linhas.find((l) => l.linkFonte)?.linkFonte ?? undefined,
          }}
        >
          <p className="font-tabular text-2xl font-bold text-text">
            <Moeda value={g.total} />
          </p>
          <p className="mt-1 text-sm text-text-soft">
            {formatNumberBR(g.linhas.length)}{" "}
            {g.linhas.length === 1 ? "registro" : "registros"}
            {/* Registro sem valor não some do total em silêncio: dizer quantos
                são é o que impede a soma de parecer completa. */}
            {g.semValor > 0 ? (
              <>
                {" "}
                · {formatNumberBR(g.semValor)} sem valor publicado, fora desta
                soma
              </>
            ) : null}
          </p>
        </DataCard>
      ))}
    </div>
  );
}

function Grupo({ grupo, varios }: { grupo: GrupoViagens; varios: boolean }) {
  const ehPassagem = grupo.natureza === "passagem_aerea";
  return (
    <section>
      {varios ? (
        <h5 className="mb-3 font-display text-lg font-semibold text-text">
          {grupo.rotulo}
        </h5>
      ) : null}
      <TabelaScroll>
        <table className="w-full min-w-[62rem] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-text-soft">
              <th className="px-3 py-2 font-medium">Beneficiário</th>
              <th className="px-3 py-2 font-medium">Órgão</th>
              <th className="px-3 py-2 font-medium">Trecho</th>
              <th className="px-3 py-2 font-medium">Data</th>
              <th className="px-3 py-2 font-medium">Motivo</th>
              <th className="px-3 py-2 text-right font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {grupo.linhas.map((l) => (
              <tr key={l.id} className="border-b border-border/60 align-top">
                <td className="px-3 py-2 text-text">
                  {l.beneficiario ?? "—"}
                  {l.cargo ? (
                    <span className="block text-xs text-text-soft">{l.cargo}</span>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-text-soft">{l.orgaoNome ?? "—"}</td>
                {/* Trecho, não "destino": a fonte publica ida e volta como
                    duas linhas, e uma coluna só de destino faz a volta
                    parecer viagem da cidade para ela mesma. */}
                <td className="px-3 py-2 text-text-soft">
                  {l.origem ? `${l.origem} → ${l.destino ?? "—"}` : (l.destino ?? "—")}
                </td>
                <td className="px-3 py-2 font-tabular whitespace-nowrap text-text-soft">
                  {formatDateBR(l.dataInicio)}
                  {l.dataFim && l.dataFim !== l.dataInicio
                    ? ` – ${formatDateBR(l.dataFim)}`
                    : ""}
                </td>
                <td className="px-3 py-2 text-text-soft">{l.motivo ?? "—"}</td>
                <td className="px-3 py-2 text-right font-tabular whitespace-nowrap text-text">
                  {/* "sem ônus" e "não publicado" viram null no ETL, nunca 0:
                      zero soma no total e afirma que a viagem foi de graça. */}
                  {l.valor == null ? (
                    <span className="text-text-soft">não publicado</span>
                  ) : (
                    <Moeda value={l.valor} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TabelaScroll>
      {ehPassagem ? (
        <p className="mt-3 text-xs text-text-soft">
          Passagem aérea comprada pela administração — cada bilhete é uma
          linha, então ida e volta da mesma viagem aparecem separadas. Não
          inclui diária, que esta fonte não publica.
        </p>
      ) : null}
    </section>
  );
}
