import Link from "@/lib/betim/link";
import { notFound } from "next/navigation";
import DataCard from "@/app/[municipio]/components/DataCard";
import AtuacaoVereador from "@/app/[municipio]/components/charts/AtuacaoVereador";
import OrdinalLegend from "@/app/[municipio]/components/charts/OrdinalLegend";
import AreasAtuacao from "@/app/[municipio]/components/charts/AreasAtuacao";
import {
  getVereadorBySlug,
  getProposicoesByVereador,
  getDiariasByVereador,
  getDoacoesSummary,
  getBensCandidato,
  getRankingVereadores,
  TIPO_PROPOSICAO_LABELS,
} from "@/lib/betim/vereadores";
import { getTemasVereador, TEMA_LABELS } from "@/lib/betim/temas";
import { getVerbasAnalytics } from "@/lib/betim/verbas";
import { getParticipacoesByVereador } from "@/lib/betim/comissoes";
import { formatCurrencyBRL, formatDateBR, formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota } from "@/lib/betim/cidade";

interface VereadorPageProps {
  /** A rota é `/[municipio]/vereadores/[slug]` — os dois segmentos chegam
   *  aqui. O tipo declarava só `slug`, o que escondia a cidade de quem
   *  lesse a assinatura. */
  params: Promise<{ municipio: string; slug: string }>;
  searchParams: Promise<{ tema?: string }>;
}

export async function generateMetadata({ params }: VereadorPageProps) {
  const { slug } = await params;
  const { row } = await getVereadorBySlug(slug);
  return {
    title: row ? `${row.nome_urna ?? row.nome} — Controle Popular Betim` : "Vereador não encontrado",
  };
}

export default async function VereadorPage({ params, searchParams }: VereadorPageProps) {
  const cidade = await cidadeDaRota(params);
  const { slug } = await params;
  const { tema } = await searchParams;
  const { row, ok } = await getVereadorBySlug(slug);

  if (ok && !row) notFound();

  const [proposicoes, diarias, doacoes, bens, verbas, ranking, temasVereador, comissoes] = row
    ? await Promise.all([
        getProposicoesByVereador(row.id, tema),
        getDiariasByVereador(row.id),
        getDoacoesSummary(row.id),
        getBensCandidato(row.id),
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
        getRankingVereadores(),
        getTemasVereador(cidade.id_municipio, row.id),
        getParticipacoesByVereador(cidade.id_municipio, row.id),
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
      ];

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
        "Sobre sua atuação como vereador(a) de Betim"
      )}&body=${encodeURIComponent(
        `Olá, ${row.nome_urna ?? row.nome},\n\n` +
          "Sou morador(a) de Betim e acompanho a atuação da Câmara pelo portal Controle Popular.\n\n" +
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
          <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
            {row.nome_urna ?? row.nome}
          </h1>
          <p className="mt-1 text-text-soft">{row.nome}</p>
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
              source={{ label: "Câmara de Betim", url: "https://www.camarabetim.mg.gov.br" }}
            >
              <p className="text-text">
                {formatDateBR(row.mandato_inicio)} – {formatDateBR(row.mandato_fim)}
              </p>
            </DataCard>
            <DataCard
              title="Contato"
              source={{ label: "Câmara de Betim", url: "https://www.camarabetim.mg.gov.br" }}
            >
              <p className="text-text">{row.email ?? "—"}</p>
              {mailtoCobrar && (
                <a
                  href={mailtoCobrar}
                  className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-ink hover:bg-primary/90"
                >
                  Perguntar sobre a atuação ✉
                </a>
              )}
              <p className="mt-2 text-[.8em] text-text-soft">
                Abre um e-mail já endereçado ao vereador, com um rascunho que
                cita a área de atuação dele — é só escrever sua pergunta.
              </p>
            </DataCard>
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
                source={{ label: "Câmara de Betim", url: "https://www.camarabetim.mg.gov.br" }}
              >
                <div className="mb-3">
                  <OrdinalLegend />
                </div>
                <AtuacaoVereador ranking={ranking.rows} vereadorId={row.id} />
              </DataCard>
            </div>
          )}

          {temasVereador.ok && temasVereador.temas.length > 0 && (
            <div className="mt-8">
              <DataCard
                title="Áreas de atuação — sobre o que ele legisla"
                source={{ label: "Câmara de Betim", url: "https://www.camarabetim.mg.gov.br" }}
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

          <div className="mt-8">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-text">
                Proposições apresentadas (20ª Legislatura)
              </h2>
              {tema && (
                <Link
                  href={`/vereadores/${row.slug}`}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  ✕ tema: {TEMA_LABELS[tema] ?? tema} — limpar
                </Link>
              )}
            </div>
            {!proposicoes.ok || proposicoes.rows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-6 text-sm text-text-soft">
                {tema
                  ? "Nenhuma proposição encontrada para esse tema."
                  : "Nenhuma proposição encontrada para este vereador."}
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
                <ul className="divide-y divide-border bg-surface">
                  {proposicoes.rows.map((p, i) => (
                    <li key={i} className="p-4 text-sm">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          {TIPO_PROPOSICAO_LABELS[p.tipo] ?? p.tipo}
                        </span>
                        <span className="font-tabular text-text-soft">
                          Nº {p.numero}/{p.ano}
                        </span>
                        {p.situacao && <span className="text-text-soft">· {p.situacao}</span>}
                      </div>
                      <p className="text-text">{p.ementa}</p>
                      {p.temas && p.temas.length > 0 && (
                        <ul className="mt-2 flex flex-wrap gap-1">
                          {p.temas.map((t) => (
                            <li
                              key={t}
                              className="rounded-full bg-surface-2 px-2 py-0.5 text-[.85em] font-medium text-text-soft"
                            >
                              {TEMA_LABELS[t] ?? t}
                            </li>
                          ))}
                        </ul>
                      )}
                      {p.link_fonte && (
                        <a
                          href={p.link_fonte}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-xs font-medium text-accent hover:underline"
                        >
                          Ver fonte oficial ↗
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {proposicoes.total > proposicoes.rows.length && (
              <p className="mt-2 text-xs text-text-soft">
                Mostrando {proposicoes.rows.length} de {proposicoes.total} proposições.
              </p>
            )}
          </div>

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
                source={{ label: "Câmara de Betim", url: "https://www.camarabetim.mg.gov.br" }}
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
                  href="https://www.camarabetim.mg.gov.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Câmara de Betim ↗
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
