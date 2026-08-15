import { Suspense } from "react";
import Link from "@/lib/betim/link";
import ProposicoesDoVereador, {
  ProposicoesDoVereadorCompletas,
} from "./ProposicoesDoVereador";
import { notFound } from "next/navigation";
import DataCard from "@/app/[municipio]/components/DataCard";
import AtuacaoVereador from "@/app/[municipio]/components/charts/AtuacaoVereador";
import OrdinalLegend from "@/app/[municipio]/components/charts/OrdinalLegend";
import AreasAtuacao from "@/app/[municipio]/components/charts/AreasAtuacao";
import PainelAtuacao from "@/app/[municipio]/components/PainelAtuacao";
import { gastosAtipicos } from "@/lib/db/queries/betim";
import {
  getVereadorBySlug,
  getProposicoesByVereador,
  getDiariasByVereador,
  getDoacoesSummary,
  getBensCandidato,
  getRankingVereadores,
  getVereadores,
  TIPO_PROPOSICAO_LABELS,
} from "@/lib/betim/vereadores";
import { listarCidades, rotuloLegislatura, type Cidade } from "@/lib/db/queries/municipios";
import { getTemasVereador, TEMA_LABELS } from "@/lib/betim/temas";
import { getCustoVereador, getVerbasAnalytics } from "@/lib/betim/verbas";
import { getParticipacoesByVereador } from "@/lib/betim/comissoes";
import { formatCurrencyBRL, formatDateBR, formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota, nomePortal } from "@/lib/betim/cidade";

interface VereadorPageProps {
  /** A rota é `/[municipio]/vereadores/[slug]` — os dois segmentos chegam
   *  aqui. O tipo declarava só `slug`, o que escondia a cidade de quem
   *  lesse a assinatura. */
  params: Promise<{ municipio: string; slug: string }>;
}

/**
 * Enumera os vereadores de TODAS as cidades — o `[slug]` está sob
 * `[municipio]`, então é o par (cidade, vereador) que identifica a rota.
 *
 * Sem isto o `output: 'export'` recusa a página inteira ("missing
 * generateStaticParams() so it cannot be used with output: export"). No alvo
 * Cloudflare a página já era pré-renderizada, então lá o efeito é só
 * antecipar o trabalho para o build em vez de deixá-lo sob demanda.
 *
 * Consulta `listarCidades()` de novo em vez de reaproveitar o
 * `generateStaticParams` do layout porque os dois rodam independentes; são
 * poucas dezenas de linhas e o Next resolve uma vez por build.
 */
/**
 * Rótulo e URL da Câmara da cidade, para o `source` dos cards.
 *
 * Estava escrito à mão como `{ label: "Câmara de Betim", url:
 * "https://www.camarabetim.mg.gov.br" }` em 11 lugares — ou seja, a página
 * de um vereador de Belo Horizonte creditava a Câmara de Betim e linkava
 * para o site dela. Numa tela cujo propósito é dizer de onde o número veio,
 * essa é a linha que menos pode estar errada.
 */
function fonteDaCamara(cidade: Cidade) {
  const host =
    typeof cidade.fontes?.camara_host === "string" ? cidade.fontes.camara_host : undefined;
  return { label: `Câmara de ${cidade.nome}`, url: host };
}

export async function generateStaticParams() {
  const cidades = await listarCidades();
  const pares: { municipio: string; slug: string }[] = [];
  for (const cidade of cidades) {
    const { rows } = await getVereadores(cidade.id_municipio);
    for (const v of rows) {
      if (v.slug) pares.push({ municipio: cidade.slug, slug: v.slug });
    }
  }
  return pares;
}

export async function generateMetadata({ params }: VereadorPageProps) {
  const cidade = await cidadeDaRota(params);
  const { slug } = await params;
  const { row } = await getVereadorBySlug(cidade.id_municipio, slug);
  return {
    title: row ? `${row.nome_urna ?? row.nome} — ${nomePortal(cidade)}` : "Vereador não encontrado",
  };
}

export default async function VereadorPage({ params }: VereadorPageProps) {
  const cidade = await cidadeDaRota(params);
  const { slug } = await params;
  const { row, ok } = await getVereadorBySlug(cidade.id_municipio, slug);

  if (ok && !row) notFound();

  const [proposicoes, diarias, doacoes, bens, verbas, ranking, temasVereador, comissoes, custo] = row
    ? await Promise.all([
        // Sem filtro de tema e SEM o teto de 10: o filtro virou do cliente, e
        // filtrar sobre as 10 primeiras mentiria. 500 cobre com folga o maior
        // vereador do acervo (329, medido).
        getProposicoesByVereador(cidade.id_municipio, row.id, undefined, 500),
        getDiariasByVereador(cidade.id_municipio, row.id),
        getDoacoesSummary(cidade.id_municipio, row.id),
        getBensCandidato(cidade.id_municipio, row.id),
        // REGRESSÃO CORRIGIDA: com a assinatura antiga isto era
        // `getVerbasAnalytics(vereadorId)`. Ao virar `(idMunicipio,
        // vereadorId)` a chamada continuou compilando — os dois parâmetros
        // são `string` — e passou a filtrar `id_municipio = <uuid do
        // vereador>`, o que devolve zero linha. A seção de verbas de TODO
        // vereador mostrava R$ 0 (medido: R$ 4.783,29 em 7 registros no
        // primeiro vereador com verbas).
        getVerbasAnalytics(cidade.id_municipio, row.id),
        // O ranking inteiro (não só este vereador) porque a barra de
        // atuação é medida contra o 1º colocado — sem o conjunto não dá
        // pra desenhar uma escala comparável nem dizer a posição.
        getRankingVereadores(cidade.id_municipio),
        getTemasVereador(cidade.id_municipio, row.id),
        getParticipacoesByVereador(cidade.id_municipio, row.id),
        getCustoVereador(cidade.id_municipio, row.id),
      ])
    : [
        { rows: [], total: 0, ok: false },
        { rows: [], ok: false },
        { total: 0, soma: 0, rows: [], ok: false },
        { rows: [], total: 0, soma: 0, ok: false },
        { total: 0, totalRegistros: 0, gastosPorTema: [], topFornecedores: [], ok: false },
        { rows: [], totaisPorTipo: {}, ok: false },
        { temas: [], ok: false },
        { andamento: [], finalizadas: [], ok: false },
        {
          mensalBruto: null,
          mensalExtras: null,
          competencia: null,
          fonteSubsidio: null,
          gastoPorAno: [],
          ok: false,
        },
      ];
  const fonteCamara = fonteDaCamara(cidade);
  // Quantos vereadores a casa tem — para dizer "o mesmo para todos os 41"
  // sem número escrito à mão (Betim tem 23, BH 41, São Paulo 55).
  const vereadoresDaCasa = ranking.rows.length || null;
  // A linha do ranking desta pessoa: carrega presença, coerência e a
  // pontuação antes e depois do desconto.
  const esteNoRanking = row ? ranking.rows.find((r) => r.id === row.id) : undefined;
  // Gastos fora da curva DESTA pessoa. A consulta calcula o percentil sobre a
  // cidade inteira — tem de ser assim, senão a "mediana do grupo" sairia da
  // meia dúzia de despesas de um gabinete só e qualquer valor viraria
  // outlier. O recorte por pessoa é feito depois, aqui.
  const gastosDele = row
    ? (await gastosAtipicos(cidade.id_municipio, { limite: 200 }).catch(() => []))
        .filter((g) => g.vereador_id === row.id)
        .slice(0, 8)
    : [];
  // O ano corrente aparece no gráfico com o valor acumulado até agora, o que
  // faz a última barra parecer uma queda. Dizer isso é mais honesto que
  // esconder o ano.
  const anoCorrente = new Date().getFullYear();
  const anoParcial = custo.gastoPorAno.some((a) => a.ano === anoCorrente)
    ? anoCorrente
    : null;

  // "Cobrar vereador" — mailto pré-preenchido (Ação cidadã, plan §10.1):
  // reaproveita o e-mail e os temas de atuação já carregados acima, sem
  // schema novo e sem componente client (o link é montado no servidor; o
  // navegador só abre o cliente de e-mail do usuário). O corpo cita a área
  // real de atuação dele — não é um formulário genérico em branco.
  const topTemasCobrar = temasVereador.ok
    ? temasVereador.temas.slice(0, 3).map((t) => t.label)
    : [];
  const listaTemasCobrar =
    topTemasCobrar.length <= 1
      ? topTemasCobrar[0] ?? ""
      : `${topTemasCobrar.slice(0, -1).join(", ")} e ${topTemasCobrar.at(-1)}`;
  const mailtoCobrar = row?.email
    ? `mailto:${row.email}?subject=${encodeURIComponent(
        `Sobre sua atuação como vereador(a) de ${cidade.nome}`
      )}&body=${encodeURIComponent(
        `Olá, ${row.nome_urna ?? row.nome},\n\n` +
          `Sou morador(a) de ${cidade.nome} e acompanho a atuação da Câmara pelo portal Controle Popular.\n\n` +
          (listaTemasCobrar
            ? `Vi que boa parte das suas proposições trata de ${listaTemasCobrar}. `
            : "") +
          "Gostaria de saber sua posição sobre:\n\n" +
          "(escreva aqui a sua pergunta)\n\n" +
          "Atenciosamente,"
      )}`
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <Link href="/camara" className="hover:text-primary">
          Câmara
        </Link>{" "}
        · <span className="text-text">{row?.nome_urna ?? row?.nome ?? slug}</span>
      </nav>

      {!row ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-center text-sm text-text-soft">
          Vereador não encontrado.
        </div>
      ) : (
        <>
          {/* A foto estava no banco e em lugar nenhum da tela.
            *
            * `foto_url` está preenchida para 87 dos 99 vereadores (Betim
            * 23/23, BH 41/41, Itinga 11/11, Araçuaí 11/11, Diamantina 1/13) e
            * era até selecionada pela query — mas nenhum `.tsx` a usava.
            * Coletar, guardar, consultar e não mostrar é o pior dos mundos:
            * paga o custo inteiro e não entrega nada.
            *
            * `<img>` cru e não `next/image`, seguindo o que a página de
            * parlamentar do Congresso já faz: as fotos vêm de host externo
            * (SAPL, portais das câmaras) e no export estático o otimizador de
            * imagem não existe.
            *
            * `alt=""` de propósito: o nome está escrito ao lado, em texto. Um
            * `alt` com o nome faria o leitor de tela repetir. */}
          <div className="flex flex-wrap items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {row.foto_url ? (
              <img
                src={row.foto_url}
                alt=""
                width={84}
                height={112}
                loading="lazy"
                className="h-28 w-[84px] shrink-0 rounded-lg border border-border object-cover"
              />
            ) : null}
            <div>
              <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
                {row.nome_urna ?? row.nome}
              </h1>
              <p className="mt-1 text-text-soft">{row.nome}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {row.partido && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                {row.partido}
              </span>
            )}
            {row.cargo_mesa && (
              <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
                {row.cargo_mesa}
              </span>
            )}
            {row.profissao && (
              <span className="rounded-full bg-surface-2 px-3 py-1 text-sm font-medium text-text-soft">
                {row.profissao}
              </span>
            )}
          </div>

          {row.biografia && (
            <p className="mt-4 max-w-2xl text-sm text-text-soft">
              {row.biografia}
              {row.aniversario_dia_mes && (
                <span className="ml-1 text-xs">— aniversário em {row.aniversario_dia_mes}</span>
              )}
            </p>
          )}

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DataCard
              title="Mandato atual"
              source={fonteCamara}
            >
              <p className="text-text">
                {formatDateBR(row.mandato_inicio)} – {formatDateBR(row.mandato_fim)}
              </p>
            </DataCard>
            <DataCard
              title="Contato"
              source={fonteCamara}
            >
              <p className="text-text">
                {row.email ?? "E-mail individual não divulgado pela Câmara"}
              </p>
              {mailtoCobrar ? (
                <>
                  <a
                    href={mailtoCobrar}
                    className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-ink hover:bg-primary/90"
                  >
                    Perguntar sobre a atuação ✉
                  </a>
                  <p className="mt-2 text-[.8em] text-text-soft">
                    Abre um e-mail já endereçado ao vereador, com um rascunho que
                    cita a área de atuação dele — é só escrever sua pergunta.
                  </p>
                </>
              ) : (
                fonteCamara.url && (
                  <p className="mt-2 text-[.8em] text-text-soft">
                    Sem e-mail individual cadastrado nesta fonte — fale com a{" "}
                    <a href={fonteCamara.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                      {fonteCamara.label} ↗
                    </a>{" "}
                    para chegar até ele(a).
                  </p>
                )
              )}
            </DataCard>
            {(custo.mensalBruto != null || custo.gastoPorAno.length > 0) && (
              <DataCard
                title="Quanto custa este mandato"
                className="sm:col-span-2"
                source={
                  custo.fonteSubsidio
                    ? { label: `Câmara de ${cidade.nome}`, url: custo.fonteSubsidio }
                    : fonteCamara
                }
              >
                {/* Duas naturezas, dois blocos. O subsídio é remuneração
                    pessoal fixada em lei e IGUAL para todos os vereadores da
                    casa — comparar parlamentares por ele não diz nada. O
                    custeio é despesa do gabinete e varia muito entre eles: é
                    ali que a comparação tem sentido. Somar os dois num
                    "custo total" esconderia justamente a parte que
                    distingue um vereador do outro. */}
                <div className="grid gap-5 sm:grid-cols-2">
                  {custo.mensalBruto != null && (
                    <div>
                      <p className="text-xs font-semibold tracking-wide text-text-soft uppercase">
                        Recebe por mês
                      </p>
                      <p className="font-tabular text-2xl font-bold text-text">
                        {formatCurrencyBRL(custo.mensalBruto)}
                      </p>
                      <p className="text-xs text-text-soft">
                        subsídio bruto, antes dos descontos
                      </p>
                      {custo.mensalExtras != null && custo.mensalExtras > 0 && (
                        <p className="mt-1.5 text-xs text-text-soft">
                          + {formatCurrencyBRL(custo.mensalExtras)} de verbas
                          fixas (auxílio-alimentação)
                        </p>
                      )}
                      {custo.competencia && (
                        <p className="mt-1.5 text-[.75em] text-text-soft">
                          Valor vigente em {formatDateBR(custo.competencia).slice(3)}. É
                          o mesmo para todos os {vereadoresDaCasa} vereadores — fixado
                          por lei, não por desempenho.
                        </p>
                      )}
                    </div>
                  )}

                  {custo.gastoPorAno.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold tracking-wide text-text-soft uppercase">
                        Gabinete gastou
                      </p>
                      <ul className="mt-1 flex flex-col gap-2">
                        {custo.gastoPorAno.map((a) => (
                          <li key={a.ano} className="flex items-baseline justify-between gap-3">
                            <span className="font-tabular text-sm text-text-soft">{a.ano}</span>
                            <span className="flex-1 border-b border-dotted border-border" />
                            <span className="font-tabular text-base font-semibold text-text">
                              {formatCurrencyBRL(a.total)}
                            </span>
                            <span className="text-[.75em] text-text-soft">
                              {formatNumberBR(a.qtd)} desp.
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-[.75em] text-text-soft">
                        Custeio do gabinete: material de escritório, serviços
                        postais, gráfica e afins.{" "}
                        {anoParcial != null && (
                          <>O ano de {anoParcial} ainda está em curso.</>
                        )}
                      </p>
                      <Link
                        href="/camara#gastos-gabinete"
                        className="mt-2 inline-block text-xs font-medium text-accent hover:underline"
                      >
                        Comparar com os outros vereadores →
                      </Link>
                    </div>
                  )}
                </div>
              </DataCard>
            )}
            {row.votos_eleicao != null && (
              <DataCard
                title={`Votos na eleição de ${row.ano_eleicao ?? ""}`}
                source={{ label: "TSE / Base dos Dados", url: "https://www.tse.jus.br/" }}
              >
                <p className="font-tabular text-text">{formatNumberBR(row.votos_eleicao)}</p>
              </DataCard>
            )}
            {bens.ok && bens.total > 0 && (
              <DataCard
                title="Patrimônio declarado na campanha (2024)"
                source={{ label: "TSE / Base dos Dados", url: "https://www.tse.jus.br/" }}
              >
                <p className="mb-2 text-text">
                  {formatNumberBR(bens.total)} {bens.total === 1 ? "bem" : "bens"}, total{" "}
                  <strong>{formatCurrencyBRL(bens.soma)}</strong>
                </p>
                <ul className="divide-y divide-border/60">
                  {bens.rows.map((b, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 py-1.5 text-xs">
                      <span className="text-text-soft">
                        {b.tipo_item ?? "—"}
                        {b.descricao_item ? ` — ${b.descricao_item}` : ""}
                      </span>
                      <span className="font-tabular shrink-0 text-text">
                        {b.valor != null ? formatCurrencyBRL(Number(b.valor)) : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[.85em] text-text-soft">
                  Autodeclarado à Justiça Eleitoral no registro da candidatura — não é uma
                  avaliação independente do valor de mercado atual.
                </p>
              </DataCard>
            )}
          </div>

          {doacoes.ok && doacoes.total > 0 && (
            <div className="mt-8">
              <DataCard
                title="Doações de campanha (2024) — quem financiou"
                source={{ label: "TSE / Base dos Dados", url: "https://www.tse.jus.br/" }}
              >
                <p className="mb-3 text-text">
                  {formatNumberBR(doacoes.total)}{" "}
                  {doacoes.total === 1 ? "doação" : "doações"}, total{" "}
                  <strong className="font-tabular">{formatCurrencyBRL(doacoes.soma)}</strong>
                </p>
                <ul className="divide-y divide-border/60">
                  {doacoes.rows.slice(0, 8).map((d, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                      <span className="text-text-soft">
                        {d.doador_nome ?? "—"}
                        {d.doador_tipo && (
                          <span className="ml-1.5 rounded-full bg-surface-2 px-1.5 py-0.5 text-[.7em] font-semibold uppercase tracking-wide">
                            {d.doador_tipo === "PJ" ? "empresa" : "pessoa"}
                          </span>
                        )}
                      </span>
                      <span className="font-tabular shrink-0 text-text">
                        {d.valor != null ? formatCurrencyBRL(Number(d.valor)) : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
                {doacoes.rows.length > 8 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium text-accent hover:underline">
                      Ver todos os {formatNumberBR(doacoes.rows.length)} doadores
                    </summary>
                    <ul className="mt-2 divide-y divide-border/60">
                      {doacoes.rows.slice(8).map((d, i) => (
                        <li key={i} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                          <span className="text-text-soft">
                            {d.doador_nome ?? "—"}
                            {d.doador_tipo && (
                              <span className="ml-1.5 rounded-full bg-surface-2 px-1.5 py-0.5 text-[.7em] font-semibold uppercase tracking-wide">
                                {d.doador_tipo === "PJ" ? "empresa" : "pessoa"}
                              </span>
                            )}
                          </span>
                          <span className="font-tabular shrink-0 text-text">
                            {d.valor != null ? formatCurrencyBRL(Number(d.valor)) : "—"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                <p className="mt-3 text-[.85em] text-text-soft">
                  O nome de quem doou para campanha é público por lei (Lei
                  9.504/97) — a divulgação do financiamento eleitoral é
                  obrigatória. Valores prestados à Justiça Eleitoral em 2024.
                </p>
              </DataCard>
            </div>
          )}

          {ranking.ok && (
            <div className="mt-8">
              <DataCard
                title="Atuação legislativa — de onde vem a pontuação"
                source={fonteCamara}
              >
                <div className="mb-3">
                  <OrdinalLegend />
                </div>
                <AtuacaoVereador ranking={ranking.rows} vereadorId={row.id} />
              </DataCard>
            </div>
          )}

          {/* Presença, coerência e gasto atípico. Fica LOGO ABAIXO da
              composição da pontuação de propósito: é ali que o leitor vê o
              número final e pergunta por que ele é menor que a soma das
              fatias. A resposta tem de estar na altura da pergunta. */}
          {esteNoRanking && (
            <div className="mt-8">
              <DataCard
                title="Presença, coerência e uso da verba"
                source={fonteCamara}
              >
                <PainelAtuacao vereador={esteNoRanking} gastos={gastosDele} />
              </DataCard>
            </div>
          )}

          {temasVereador.ok && temasVereador.temas.length > 0 && (
            <div className="mt-8">
              <DataCard
                title="Áreas de atuação — sobre o que ele legisla"
                source={fonteCamara}
              >
                <p className="mb-3 text-sm">
                  Em quantas proposições cada área aparece (uma proposição
                  pode tocar mais de uma área). Clique numa área pra
                  filtrar a lista abaixo.
                </p>
                <AreasAtuacao
                  temas={temasVereador.temas}
                  unidade="proposições"
                  unidadeSingular="proposição"
                  hrefFiltro={`/vereadores/${row.slug}`}
                />
              </DataCard>
            </div>
          )}
          {/* O filtro por tema saiu do servidor. Ler `?tema=` aqui tornava a
              rota dinâmica (`ƒ`), e dinâmica consulta o banco A CADA visita —
              o que em produção dava 500, porque o banco é o desta casa e não é
              alcançável do Cloudflare. Medido em 2026-08-09. */}
          <Suspense
            fallback={
              <ProposicoesDoVereadorCompletas
                rows={proposicoes.rows}
                ok={proposicoes.ok}
                slug={row.slug}
                legislatura={rotuloLegislatura(cidade)}
                rotulosTipo={TIPO_PROPOSICAO_LABELS}
                rotulosTema={TEMA_LABELS}
              />
            }
          >
            <ProposicoesDoVereador
              rows={proposicoes.rows}
              ok={proposicoes.ok}
              slug={row.slug}
              legislatura={rotuloLegislatura(cidade)}
              rotulosTipo={TIPO_PROPOSICAO_LABELS}
              rotulosTema={TEMA_LABELS}
            />
          </Suspense>

          {diarias.ok && diarias.rows.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 font-display text-lg font-bold text-text">
                Viagens e diárias
              </h2>
              <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
                <ul className="divide-y divide-border bg-surface">
                  {diarias.rows.map((d, i) => (
                    <li key={i} className="p-4 text-sm">
                      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                        <span className="font-tabular text-text-soft">
                          {formatDateBR(d.data_inicio)} – {formatDateBR(d.data_fim)}
                        </span>
                        <strong className="font-tabular text-text">
                          {d.valor != null ? formatCurrencyBRL(d.valor) : "—"}
                        </strong>
                      </div>
                      <p className="text-text-soft">{d.destino}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {verbas.ok && verbas.totalRegistros > 0 && (
            <div className="mt-8">
              <h2 className="mb-1 font-display text-lg font-bold text-text">
                Verbas indenizatórias
              </h2>
              <p className="mb-3 text-sm text-text-soft">
                {formatNumberBR(verbas.totalRegistros)} reembolsos, total{" "}
                <strong className="font-tabular text-text">
                  {formatCurrencyBRL(verbas.total)}
                </strong>
              </p>
              <DataCard
                title="Gastos por tema"
                source={fonteCamara}
              >
                <ul className="divide-y divide-border/60">
                  {verbas.gastosPorTema.map((item) => (
                    <li key={item.tema} className="flex items-center justify-between py-2">
                      <span className="text-text">
                        {item.tema}{" "}
                        <span className="text-text-soft">({formatNumberBR(item.qtd)})</span>
                      </span>
                      <strong className="font-tabular text-text">
                        {formatCurrencyBRL(item.valor)}
                      </strong>
                    </li>
                  ))}
                </ul>
              </DataCard>
            </div>
          )}

          {comissoes.ok && (comissoes.andamento.length > 0 || comissoes.finalizadas.length > 0) ? (
            <div className="mt-8">
              <h2 className="mb-3 font-display text-lg font-bold text-text">
                Participação em comissões
              </h2>
              {comissoes.andamento.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold tracking-wide text-text-soft uppercase">
                    Atualmente
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {comissoes.andamento.map((p, i) => (
                      <li
                        key={i}
                        className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                      >
                        {p.nomeComissao}{" "}
                        <span className="font-semibold">— {p.papel}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {comissoes.finalizadas.length > 0 && (
                <details className="rounded-2xl border border-border bg-surface p-4 text-sm">
                  <summary className="cursor-pointer font-medium text-text-soft">
                    Histórico ({formatNumberBR(comissoes.finalizadas.length)} participações
                    encerradas desde 2018)
                  </summary>
                  <ul className="mt-3 divide-y divide-border/60">
                    {comissoes.finalizadas.map((p, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 py-1.5">
                        <span className="text-text-soft">
                          {p.nomeComissao} — <span className="text-text">{p.papel}</span>
                        </span>
                        <span className="font-tabular shrink-0 text-xs text-text-soft">
                          {formatDateBR(p.dataInicio)} – {formatDateBR(p.dataFim)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <p className="mt-2 text-xs text-text-soft">
                Fonte:{" "}
                <a
                  href={fonteCamara.url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Câmara de {cidade.nome} ↗
                </a>
                . Nomes de comissão são exatamente os registrados pela Câmara em
                cada período — algumas foram renomeadas ao longo das
                legislaturas, e o histórico mantém o nome de cada época.
              </p>
            </div>
          ) : (
            comissoes.ok && (
              <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface-2 p-6 text-sm text-text-soft">
                Não participa de nenhuma comissão no momento.
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
