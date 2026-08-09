import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import TabelaScroll from "@/app/[municipio]/components/TabelaScroll";
import { getViagens, type GrupoViagens } from "@/lib/betim/viagens";
import { formatCurrencyBRL, formatDateBR, formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Diárias e viagens oficiais — ${c.nome} — ${nomePortal(c)}`,
  (c) =>
    `Diárias e passagens aéreas pagas pelo poder público de ${c.nome}: quem viajou, para onde, por quê e quanto custou.`
);

export default async function DiariasPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const { grupos, totalLinhas, ok } = await getViagens(cidade.id_municipio);

  // O QUE A PÁGINA COBRE SAI DO DADO, não de um texto fixo — mesma regra da
  // página de obras. Em Belo Horizonte a fonte publica SÓ passagem aérea (a
  // PBH não abre diária em dataset nenhum); em Betim, só diária de vereador.
  // Uma página chamada "Diárias" que mostra passagem sem dizer afirmaria um
  // gasto que a cidade não tem com esse nome.
  const naturezas = grupos.map((g) => g.natureza);
  const soPassagem = naturezas.length === 1 && naturezas[0] === "passagem_aerea";
  const soDiaria = naturezas.length === 1 && naturezas[0] === "diaria";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <Link href="/prefeitura" className="hover:text-primary">
          Prefeitura
        </Link>{" "}
        · <span className="text-text">Diárias e viagens</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight text-text">
        Diárias e viagens oficiais
      </h1>

      {!ok ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-sm text-text-soft">
          <p className="font-medium text-text">Em breve</p>
          <p className="mt-2">
            Ainda não há registro de viagem oficial de {cidade.nome} neste portal.
          </p>
        </div>
      ) : totalLinhas === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-sm text-text-soft">
          <p className="font-medium text-text">Nada publicado</p>
          <p className="mt-2">
            Nenhuma diária ou passagem de {cidade.nome} foi encontrada nas fontes
            abertas que este portal lê. Ausência aqui significa que a fonte não
            publica — não que ninguém viajou.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-2 max-w-3xl text-[1.02em] text-text-soft">
            Quem viajou a serviço de {cidade.nome}, para onde, por quê e quanto
            custou.{" "}
            {soPassagem && (
              <>
                <strong className="text-text">
                  A fonte publica apenas passagem aérea, não diária.
                </strong>{" "}
                São rubricas diferentes: diária é a verba de alimentação e
                hospedagem por dia de afastamento, passagem é o bilhete. O que
                está abaixo é o bilhete — o gasto com diária não é público aqui.
              </>
            )}
            {soDiaria && (
              <>
                {" "}
                <strong className="text-text">
                  A fonte publica apenas diária.
                </strong>{" "}
                O que a administração gastou com passagem não entra nesta conta.
              </>
            )}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  {formatCurrencyBRL(g.total)}
                </p>
                <p className="mt-1 text-sm text-text-soft">
                  {formatNumberBR(g.linhas.length)}{" "}
                  {g.linhas.length === 1 ? "registro" : "registros"}
                  {/* Registro sem valor não some do total em silêncio: dizer
                      quantos são é o que impede a soma de parecer completa. */}
                  {g.semValor > 0 && (
                    <>
                      {" "}
                      · {formatNumberBR(g.semValor)} sem valor publicado, fora
                      desta soma
                    </>
                  )}
                </p>
              </DataCard>
            ))}
          </div>

          {grupos.map((g) => (
            <Grupo key={g.natureza} grupo={g} varios={grupos.length > 1} />
          ))}
        </>
      )}
    </div>
  );
}

function Grupo({ grupo, varios }: { grupo: GrupoViagens; varios: boolean }) {
  const ehPassagem = grupo.natureza === "passagem_aerea";
  return (
    <section className="mt-8">
      {varios && (
        <h2 className="mb-3 font-display text-xl font-semibold text-text">
          {grupo.rotulo}
        </h2>
      )}
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
                  {l.cargo && (
                    <span className="block text-xs text-text-soft">{l.cargo}</span>
                  )}
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
                    formatCurrencyBRL(l.valor)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TabelaScroll>
      {ehPassagem && (
        <p className="mt-3 text-xs text-text-soft">
          Passagem aérea comprada pela administração — cada bilhete é uma
          linha, então ida e volta da mesma viagem aparecem separadas. Não
          inclui diária, que esta fonte não publica.
        </p>
      )}
    </section>
  );
}
