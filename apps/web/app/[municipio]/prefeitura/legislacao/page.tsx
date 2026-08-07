import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import AreasAtuacao from "@/app/[municipio]/components/charts/AreasAtuacao";
import RotuloBadge from "@/app/[municipio]/components/RotuloBadge";
import { getLegislacao } from "@/lib/betim/legislacao";
import { TEMA_LABELS } from "@/lib/betim/temas";
import { labelDoDireito } from "@/lib/congresso/rubrica";
import { percentualAnalisado } from "@/lib/betim/legislacao-garantista";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import { hostDoAcervoNormativo, orgaoDoAcervoNormativo } from "@/lib/db/queries/municipios";

// "Prefeitura de X" era literal e passou a mentir: em Araçuaí e Diamantina o
// acervo é da Câmara. O órgão sai de `fontes.legislacao_fonte`.
export const generateMetadata = metadataDaCidade(
  (c) => `Legislação — ${orgaoDoAcervoNormativo(c).orgao} — ${nomePortal(c)}`,
  (c) =>
    `Leis, decretos, resoluções e instruções normativas da ${orgaoDoAcervoNormativo(c).orgao}, com filtro por categoria, ano e área temática.`
);

interface LegislacaoPageProps {
  params: Promise<{ municipio: string }>;
  searchParams: Promise<{ categoria?: string; tema?: string; ano?: string; direito?: string }>;
}

export default async function LegislacaoPage({
  params: rotaParams,
  searchParams,
}: LegislacaoPageProps) {
  const cidade = await cidadeDaRota(rotaParams);
  // Os dois cards creditavam o portal de dados abertos de BETIM. Em Belo
  // Horizonte e São Paulo os atos vêm do Diário Oficial (API do DOM), que é
  // outro sistema — o crédito estava errado na cidade E na natureza da fonte.
  // Em Araçuaí e Diamantina o acervo nem sequer é do Executivo: é da CÂMARA
  // (SAPL e portal da Casa), então nem o `hostDaPrefeitura` serve.
  const fonteLegislacao = hostDoAcervoNormativo(cidade);
  const acervo = orgaoDoAcervoNormativo(cidade);
  const params = await searchParams;
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
  } = await getLegislacao(cidade.id_municipio, {
    categoria: params.categoria,
    tema: params.tema,
    ano: params.ano ? Number(params.ano) : undefined,
    direito: params.direito,
  });

  const temFiltro = Boolean(params.categoria || params.tema || params.ano || params.direito);

  /**
   * Preserva os outros filtros ao limpar um só.
   *
   * O "✕ limpar direito" mandava para a rota nua e derrubava categoria, ano
   * e tema junto, sem avisar. Quem filtrou por três coisas e quis tirar uma
   * perdia as outras duas.
   */
  const urlSem = (chave: "tema" | "direito") => {
    const resto = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (k !== chave && v) resto.set(k, String(v));
    }
    const qs = resto.toString();
    return `/prefeitura/legislacao${qs ? `?${qs}` : ""}`;
  };

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
              acervo. */}
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
                  hrefFiltro="/prefeitura/legislacao"
                />
              </DataCard>
            </div>
          )}

          <form method="GET" className="mb-6 flex flex-wrap items-end gap-3">
            <div className="flex flex-col">
              <label htmlFor="categoria" className="mb-1 text-xs font-medium text-text-soft">
                Categoria
              </label>
              <select
                id="categoria"
                name="categoria"
                defaultValue={params.categoria ?? ""}
                className="w-56 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
              >
                <option value="">Todas</option>
                {categoriasDisponiveis.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label htmlFor="ano" className="mb-1 text-xs font-medium text-text-soft">
                Ano
              </label>
              <select
                id="ano"
                name="ano"
                defaultValue={params.ano ?? ""}
                className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
              >
                <option value="">Todos</option>
                {anosDisponiveis.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            {direitosDisponiveis.length > 0 && (
              <div className="flex flex-col">
                {/* O universo vai no RÓTULO do campo, não só na faixa acima:
                    o select fica lado a lado com Categoria e Ano, que varrem
                    o acervo inteiro, e a simetria sozinha já sugere que este
                    também varre. A contagem de cada opção é sobre as
                    analisadas, e é assim que ela precisa ser lida. */}
                <label htmlFor="direito" className="mb-1 text-xs font-medium text-text-soft">
                  Direito afetado{" "}
                  <span className="font-normal">
                    (entre as {formatNumberBR(atosAnalisados)} analisadas)
                  </span>
                </label>
                <select
                  id="direito"
                  name="direito"
                  defaultValue={params.direito ?? ""}
                  className="w-72 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
                >
                  <option value="">Todos</option>
                  {direitosDisponiveis.map((d) => (
                    <option key={d.direito} value={d.direito}>
                      {d.label} ({d.qtd} de {formatNumberBR(atosAnalisados)})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* tema já entra por link no gráfico; mantido no form pra preservar. */}
            {params.tema && <input type="hidden" name="tema" value={params.tema} />}
            <button
              type="submit"
              className="cursor-pointer rounded-lg border border-primary bg-primary px-5 py-2 text-sm font-semibold text-primary-ink"
            >
              Filtrar
            </button>
            {temFiltro && (
              <Link href="/prefeitura/legislacao" className="pb-1.5 text-sm text-text-soft hover:underline">
                Limpar
              </Link>
            )}
          </form>

          {params.tema && (
            <p className="mb-4 text-sm text-text-soft">
              Filtrando por área:{" "}
              <strong className="text-text">{TEMA_LABELS[params.tema] ?? params.tema}</strong>{" "}
              <Link href={urlSem("tema")} className="text-accent hover:underline">
                ✕ limpar área
              </Link>
            </p>
          )}

          {params.direito && (
            <p className="mb-4 text-sm text-text-soft">
              Filtrando por direito afetado:{" "}
              <strong className="text-text">{labelDoDireito(params.direito)}</strong> — leitura
              da análise garantista deste portal, não classificação oficial, e{" "}
              <strong className="text-text">
                só entre as {formatNumberBR(atosAnalisados)} normas já analisadas
              </strong>
              , não entre as {formatNumberBR(total)} publicadas.{" "}
              <Link href={urlSem("direito")} className="text-accent hover:underline">
                ✕ limpar direito
              </Link>
            </p>
          )}

          {atos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-6 text-sm text-text-soft">
              {/* "Nenhuma norma para esse filtro" é verdade quando o filtro é
                  de categoria ou ano, que varrem o acervo. Com `direito`, o
                  filtro varre só o que foi analisado — dizer a mesma frase
                  ali afirmaria que a Prefeitura não legislou sobre aquele
                  direito, quando o que houve é que a fila não chegou lá. E
                  se a própria análise não respondeu, nem isso se sabe. */}
              {params.direito && !analiseOk ? (
                <>
                  <p className="font-medium text-text">Não foi possível consultar a análise</p>
                  <p className="mt-2">
                    O filtro por direito depende da análise garantista, que não
                    respondeu agora. Isto não é o mesmo que “nenhuma norma
                    afeta esse direito”.{" "}
                    <Link href={urlSem("direito")} className="text-accent hover:underline">
                      Ver a lista sem esse filtro
                    </Link>
                  </p>
                </>
              ) : params.direito && atosAnalisados === 0 ? (
                <>
                  <p className="font-medium text-text">
                    Nenhuma norma de {cidade.nome} foi analisada ainda
                  </p>
                  <p className="mt-2">
                    O filtro por direito não tem sobre o que operar aqui: a fila
                    de análise desta cidade começou pelos projetos em tramitação.{" "}
                    <Link href="/legislacao/alertas" className="text-accent hover:underline">
                      Ver o que já foi analisado
                    </Link>
                  </p>
                </>
              ) : params.direito ? (
                <>
                  <p className="font-medium text-text">
                    Nenhuma das {formatNumberBR(atosAnalisados)} normas analisadas afeta
                    esse direito
                  </p>
                  <p className="mt-2">
                    Restam {formatNumberBR(Math.max(0, total - atosAnalisados))} normas de{" "}
                    {cidade.nome} que a análise ainda não leu — o silêncio aqui é
                    sobre a amostra, não sobre a Prefeitura.
                  </p>
                </>
              ) : (
                "Nenhuma norma para esse filtro."
              )}
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {atos.map((a) => (
                <li key={a.id} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      {a.tipo}
                    </span>
                    <span className="font-tabular text-xs text-text-soft">
                      {formatDateBR(a.dataPublicacao)}
                    </span>
                  </div>
                  <p className="mt-2 font-medium text-text">
                    {a.tipo} nº {a.numero}
                    {a.ano ? `/${a.ano}` : ""}
                  </p>
                  {a.ementa && <p className="mt-0.5 text-sm text-text-soft">{a.ementa}</p>}
                  {a.temas && a.temas.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1">
                      {a.temas.map((t) => (
                        <li
                          key={t}
                          className="rounded-full bg-surface-2 px-2 py-0.5 text-[.85em] font-medium text-text-soft"
                        >
                          {TEMA_LABELS[t] ?? t}
                        </li>
                      ))}
                    </ul>
                  )}
                  {/* Ausência aqui é ausência de análise, não rótulo "neutro" —
                      por isso não há `else`: sem `a.analise`, não mostramos
                      nada de garantista/reducionista nesta linha. */}
                  {a.analise && (
                    <details className="group mt-3">
                      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 [&::-webkit-details-marker]:hidden">
                        <RotuloBadge rotulo={a.analise.rotulo} score={a.analise.score} tamanho="sm" />
                        {/* Aberto, o "ver justificativa" sumia e não sobrava
                            affordance nenhuma: para fechar era preciso
                            adivinhar que o selo é o botão. Os dois textos se
                            revezam no mesmo lugar. */}
                        <span className="text-xs text-accent underline decoration-dotted group-open:hidden">
                          ver justificativa
                        </span>
                        <span className="hidden text-xs text-accent underline decoration-dotted group-open:inline">
                          ocultar justificativa
                        </span>
                      </summary>
                      <div className="mt-2 space-y-2 rounded-xl bg-surface-2 p-3 text-sm">
                        {a.analise.itens.map((item, idx) => (
                          <div key={idx}>
                            <p>
                              <strong className="text-text">
                                {item.direcao === "restringe"
                                  ? "Restringe"
                                  : item.direcao === "amplia"
                                    ? "Amplia"
                                    : "Neutro sobre"}
                                : {labelDoDireito(item.direito)}
                              </strong>{" "}
                              <span className="text-text-soft">
                                ({item.dispositivo}
                                {item.grau ? ` · alcance ${item.grau}` : ""})
                              </span>
                            </p>
                            {item.trecho && (
                              <p className="mt-1 italic text-text-soft">“{item.trecho}”</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
