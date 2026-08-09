import { Suspense } from "react";
import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import AreasAtuacao from "@/app/[municipio]/components/charts/AreasAtuacao";
import { getLegislacao } from "@/lib/betim/legislacao";
import { TEMA_LABELS } from "@/lib/betim/temas";
import { percentualAnalisado } from "@/lib/betim/legislacao-garantista";
import { formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import { hostDoAcervoNormativo, orgaoDoAcervoNormativo } from "@/lib/db/queries/municipios";
import ListaLegislacao, { ListaLegislacaoCompleta } from "./ListaLegislacao";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
// Filtro é do cliente (`useSearchParams()` em `ListaLegislacao`). Sem
// `force-static`, `output: export` trata a rota como dinâmica e aborta com
// "missing generateStaticParams()" — mensagem que não descreve a causa.
export const dynamic = "force-static";

export async function generateStaticParams() {
  return paramsDasCidades();
}

// "Prefeitura de X" era literal e passou a mentir: em Araçuaí e Diamantina o
// acervo é da Câmara. O órgão sai de `fontes.legislacao_fonte`.
export const generateMetadata = metadataDaCidade(
  (c) => `Legislação — ${orgaoDoAcervoNormativo(c).orgao} — ${nomePortal(c)}`,
  (c) =>
    `Leis, decretos, resoluções e instruções normativas da ${orgaoDoAcervoNormativo(c).orgao}, com filtro por categoria, ano e área temática.`
);

interface LegislacaoPageProps {
  params: Promise<{ municipio: string }>;
}

export default async function LegislacaoPage({ params: rotaParams }: LegislacaoPageProps) {
  const cidade = await cidadeDaRota(rotaParams);
  // Os dois cards creditavam o portal de dados abertos de BETIM. Em Belo
  // Horizonte e São Paulo os atos vêm do Diário Oficial (API do DOM), que é
  // outro sistema — o crédito estava errado na cidade E na natureza da fonte.
  // Em Araçuaí e Diamantina o acervo nem sequer é do Executivo: é da CÂMARA
  // (SAPL e portal da Casa), então nem o `hostDaPrefeitura` serve.
  const fonteLegislacao = hostDoAcervoNormativo(cidade);
  const acervo = orgaoDoAcervoNormativo(cidade);
  // SEM filtro: `getLegislacao` já buscava a cidade INTEIRA e filtrava em JS
  // (não havia LIMIT a preservar — ver o comentário original em
  // `lib/betim/legislacao.ts`). O filtro por categoria/tema/ano/direito
  // passou para `ListaLegislacao` (cliente); pedir `{}` aqui é o que
  // devolve `atos` sem corte nenhum, pronto para o componente filtrar.
  const {
    atos,
    categoriasDisponiveis,
    anosDisponiveis,
    temas,
    direitosDisponiveis,
    atosAnalisados,
    analiseOk,
    total,
    ok,
  } = await getLegislacao(cidade.id_municipio, {});

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <Link href="/prefeitura" className="hover:text-primary">
          Prefeitura
        </Link>{" "}
        · <span className="text-text">Legislação</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Legislação municipal
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Leis, decretos, resoluções e instruções normativas publicadas pela{" "}
        {acervo.orgao} — com a ementa de cada norma, filtro por categoria,
        ano e área.
      </p>

      {!ok ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-sm text-text-soft">
          Nenhuma norma encontrada no momento.
        </div>
      ) : (
        <>
          <div className="mt-6 mb-6 max-w-xs">
            <DataCard
              title="Normas publicadas"
              source={{
                label: acervo.sistema,
                url: fonteLegislacao,
              }}
            >
              <p className="font-tabular text-2xl font-bold text-text">{formatNumberBR(total)}</p>
            </DataCard>
          </div>

          {/* O DENOMINADOR DA ANÁLISE, ANTES DOS FILTROS.
              O card acima diz 3.577 normas e não acompanha filtro nenhum. O
              filtro por direito, ao contrário dos de categoria e ano, só
              alcança as normas que a análise já leu — ~60 em BH. Sem esta
              faixa, quem filtrasse por "direito à saúde" e visse 4 normas
              leria "4 das 3.577", e não "4 das 60 lidas": uma conclusão
              falsa sobre a Prefeitura inteira, construída sobre 2% do
              acervo. Nada disto depende de `searchParams` — fica no
              servidor mesmo depois da conversão. */}
          {analiseOk && (
            <section className="mb-6 rounded-2xl border border-border bg-surface-2 p-4 text-sm text-text-soft">
              {atosAnalisados > 0 ? (
                <p>
                  <strong className="text-text">
                    A análise de direitos leu {formatNumberBR(atosAnalisados)} destas{" "}
                    {formatNumberBR(total)} normas (
                    {percentualAnalisado(atosAnalisados, total)}).
                  </strong>{" "}
                  É uma amostra, e a fila avança aos poucos. Norma sem selo de
                  rótulo abaixo é norma <strong className="text-text">ainda não
                  analisada</strong> — não é veredito de que ela seja neutra. O
                  filtro “Direito afetado” só enxerga as já lidas.
                </p>
              ) : (
                // Em BH e em SP as 60 análises estão todas em PROPOSIÇÃO, não
                // em ato: a fila priorizou o que ainda tramita, que é onde dá
                // para influir. Sem dizer isso, esta página fica sem sinal
                // nenhum de que a análise existe na cidade.
                <p>
                  <strong className="text-text">
                    A análise de direitos ainda não leu nenhuma destas{" "}
                    {formatNumberBR(total)} normas.
                  </strong>{" "}
                  A fila começou pelos projetos que ainda tramitam na Câmara —
                  é onde dá para influir antes de virar lei. Nenhuma conclusão
                  sobre as normas já publicadas pode ser tirada daqui.
                </p>
              )}
              <p className="mt-2">
                <Link href="/legislacao/alertas" className="text-accent hover:underline">
                  Ver as que restringem direitos
                </Link>{" "}
                ·{" "}
                <Link href="/legislacao/bons-exemplos" className="text-accent hover:underline">
                  as que ampliam
                </Link>{" "}
                ·{" "}
                <Link href="/metodologia" className="text-accent hover:underline">
                  como o rótulo é calculado
                </Link>
              </p>
            </section>
          )}

          {temas.length > 0 && (
            <div className="mb-6">
              <DataCard
                title={`Áreas legisladas — sobre o que a ${acervo.orgao.split(" de ")[0]} normatiza`}
                source={{
                  label: acervo.sistema,
                  url: fonteLegislacao,
                }}
              >
                <p className="mb-3 text-sm">
                  Em quantas normas cada área aparece (a maioria dos atos é de
                  crédito orçamentário, sem tema — por isso o ranking cobre só
                  a parte temática). Clique numa área pra filtrar a lista.
                </p>
                <AreasAtuacao
                  temas={temas}
                  unidade="normas"
                  unidadeSingular="norma"
                  hrefFiltro="/camara/legislacao"
                />
              </DataCard>
            </div>
          )}

          {/* Formulário, banners de filtro ativo e lista: tudo que dependia
              de `searchParams` agora mora em `ListaLegislacao` (cliente). O
              fallback é o formulário sem filtro + a lista COMPLETA — o que o
              servidor tem para mostrar antes de o navegador ler a query, e
              também o conteúdo certo para quem chega sem filtro. */}
          <Suspense
            fallback={
              <ListaLegislacaoCompleta
                atos={atos}
                categoriasDisponiveis={categoriasDisponiveis}
                anosDisponiveis={anosDisponiveis}
                direitosDisponiveis={direitosDisponiveis}
                atosAnalisados={atosAnalisados}
                analiseOk={analiseOk}
                total={total}
                cidadeNome={cidade.nome}
                temaLabels={TEMA_LABELS}
              />
            }
          >
            <ListaLegislacao
              atos={atos}
              categoriasDisponiveis={categoriasDisponiveis}
              anosDisponiveis={anosDisponiveis}
              direitosDisponiveis={direitosDisponiveis}
              atosAnalisados={atosAnalisados}
              analiseOk={analiseOk}
              total={total}
              cidadeNome={cidade.nome}
              temaLabels={TEMA_LABELS}
            />
          </Suspense>
        </>
      )}
    </div>
  );
}
