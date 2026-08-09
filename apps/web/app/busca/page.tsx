import type { Metadata } from "next";
import * as qBetim from "@/lib/db/queries/betim";
import * as qCongresso from "@/lib/db/queries/congresso";
import { buscaRapidaJudiciario } from "@/lib/db/queries/judiciario";
import { listarCidades, obterCidadePorSlug, type Cidade } from "@/lib/db/queries/municipios";
import type { ResultadoLegislacaoMunicipal } from "@/lib/db/queries/betim";
import { TEMA_LABELS, TEMAS_ORDENADOS } from "@/lib/betim/temas";
import { formatDateBR } from "@/lib/betim/format";

/**
 * Busca unificada — tema + palavra-chave + território — agrupada pelas três
 * frentes do portal (Cidades/Congresso/Judiciário).
 *
 * FICA NA RAIZ, fora de `[municipio]`/`congresso`/`judiciario`: as três
 * frentes moram em zonas de rota separadas (ver `lib/zonas.ts`) e esta
 * página existe justamente para procurar ENTRE elas, o que nenhuma zona
 * consegue fazer sozinha. Por isso todo link aqui é `<a>` cru com caminho
 * absoluto — nunca o `<Link>` de zona, que prefixaria com a zona ATUAL, que
 * aqui nem existe (mesma regra documentada em `lib/zonas.ts` e aplicada em
 * `app/page.tsx`).
 *
 * TEMA e TERRITÓRIO só filtram Cidades: são os únicos dados que têm as duas
 * coisas com o MESMO vocabulário (os 13 slugs de `etl/temas.py`, e
 * `id_municipio`). O Congresso tem tema OFICIAL da própria Câmara dos
 * Deputados — vocabulário diferente — e é federal, sem território; o
 * Judiciário não produz legislação nenhuma. Aplicar os mesmos dois filtros
 * "por igual" nos três eixos seria inventar uma classificação que não
 * existe — por isso Congresso e Judiciário respondem só à palavra-chave, e a
 * página é explícita sobre isso em vez de fingir uma faceta que não filtra
 * nada de verdade.
 */

export const metadata: Metadata = {
  title: "Busca — Controle Popular",
  description:
    "Busque legislação por tema, palavra-chave e território nas três frentes do Controle Popular: Cidades, Congresso e Judiciário.",
};

const LIMITE_CIDADES = 20;
const LIMITE_CONGRESSO = 10;
const LIMITE_JUDICIARIO = 10;

interface BuscaPageProps {
  searchParams: Promise<{ q?: string; tema?: string; municipio?: string }>;
}

/** "3 resultados" vs. "20+ resultados — mostrando os mais relevantes". */
function rotuloContagem(n: number, limite: number, singular: string, plural: string): string {
  if (n === 0) return `nenhum ${singular}`;
  if (n < limite) return `${n} ${n === 1 ? singular : plural}`;
  return `${n}+ ${plural} — mostrando os mais relevantes`;
}

/** Link para o item no contexto da própria cidade — não é a fonte oficial, é navegação interna. */
function hrefContexto(r: ResultadoLegislacaoMunicipal, cidade: Cidade | undefined): string | null {
  if (!cidade) return null;
  const tema = r.temas?.[0];
  const base = r.origem === "ato" ? `/${cidade.slug}/prefeitura/legislacao` : `/${cidade.slug}/camara/proposicoes`;
  return tema ? `${base}?tema=${encodeURIComponent(tema)}` : base;
}

export default async function BuscaPage({ searchParams }: BuscaPageProps) {
  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  const tema = sp.tema?.trim() || "";
  const municipioSlug = sp.municipio?.trim() || "";

  const [cidades, cidadeSelecionada] = await Promise.all([
    listarCidades(),
    municipioSlug ? obterCidadePorSlug(municipioSlug) : Promise.resolve(null),
  ]);
  // Slug na URL que não bate com cidade nenhuma (link velho, digitação):
  // cai para "todas" em vez de devolver uma página de erro — mas avisa, para
  // não parecer que a busca silenciosamente ignorou o que a pessoa pediu.
  const municipioInvalido = Boolean(municipioSlug) && !cidadeSelecionada;

  const temFiltro = Boolean(q || tema || municipioSlug);

  // Sem ternário aqui: as três funções já se protegem contra filtro vazio
  // (devolvem `[]` ANTES de qualquer consulta ao banco — ver a guarda de
  // cada uma), então chamar sempre é tão barato quanto pular a chamada, e
  // evita heterogeneidade de tipo entre os ramos de um ternário condicional
  // dentro de uma desestruturação. `temFiltro` só decide o que a página
  // RENDERIZA, não se a consulta roda.
  const [resultadosCidades, resultadosCongresso, resultadosJudiciario] = await Promise.all([
    qBetim.buscaLegislacaoMunicipal({
      q: q || undefined,
      tema: tema || undefined,
      idMunicipio: cidadeSelecionada?.id_municipio,
      limite: LIMITE_CIDADES,
    }),
    qCongresso.buscaLegislacaoCongresso({ q: q || undefined, limite: LIMITE_CONGRESSO }),
    buscaRapidaJudiciario(q, LIMITE_JUDICIARIO),
  ]);

  const cidadesPorId = new Map(cidades.map((c) => [c.id_municipio, c]));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <nav className="mb-4 text-sm text-text-soft">
        <a href="/" className="hover:text-primary">
          Início
        </a>{" "}
        · <span className="text-text">Busca</span>
      </nav>

      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Busca</h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Leis, decretos, resoluções e projetos das câmaras municipais, proposições do
          Congresso Nacional e a composição dos tribunais — num lugar só, por tema,
          palavra-chave e cidade.
        </p>
      </header>

      <form method="GET" action="/busca" className="mt-8 grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-4">
        <label className="sm:col-span-2">
          <span className="text-sm text-text-soft">Palavra-chave</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="ex.: saúde, iluminação pública, PL 3611"
            className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-text"
          />
        </label>

        <label>
          <span className="text-sm text-text-soft">Tema</span>
          <select
            name="tema"
            defaultValue={tema}
            className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-text"
          >
            <option value="">Todos</option>
            {TEMAS_ORDENADOS.map((t) => (
              <option key={t} value={t}>
                {TEMA_LABELS[t]}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="text-sm text-text-soft">Território</span>
          <select
            name="municipio"
            defaultValue={municipioSlug}
            className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-text"
          >
            <option value="">Todas as cidades</option>
            {cidades.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.nome} · {c.uf}
              </option>
            ))}
          </select>
        </label>

        <div className="sm:col-span-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="cursor-pointer rounded-md bg-primary px-4 py-2 font-medium text-primary-ink"
          >
            Buscar
          </button>
          {temFiltro ? (
            <a href="/busca" className="text-sm text-text-soft hover:underline">
              Limpar
            </a>
          ) : null}
          <span className="text-xs text-text-soft sm:ml-auto">
            Tema e território filtram só Cidades — Congresso e Judiciário respondem apenas à
            palavra-chave, porque não compartilham essa classificação.
          </span>
        </div>
      </form>

      {municipioInvalido ? (
        <p className="mt-4 rounded-md border border-dashed border-border bg-surface-2 p-3 text-sm text-text-soft">
          Cidade &quot;{municipioSlug}&quot; não encontrada — mostrando resultado de todas as
          cidades.
        </p>
      ) : null}

      {!temFiltro ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-sm text-text-soft">
          <p className="font-medium text-text">Escolha um tema, uma cidade, ou digite uma palavra-chave para começar.</p>
          <p className="mt-2">
            Sem nenhum critério, não há o que listar — filtro nenhum aqui não é o mesmo que
            &quot;mostrar tudo&quot;.
          </p>
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          {/* ─────────────────────────── Cidades ─────────────────────────── */}
          <section>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-xl font-semibold">Cidades</h2>
              <span className="text-sm text-text-soft">
                {rotuloContagem(resultadosCidades.length, LIMITE_CIDADES, "resultado", "resultados")}
                {" · "}
                {cidadeSelecionada ? `${cidadeSelecionada.nome} (${cidadeSelecionada.uf})` : `todas as ${cidades.length} cidades`}
              </span>
            </div>

            {resultadosCidades.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-border bg-surface-2 p-4 text-sm text-text-soft">
                Nenhuma lei, decreto, resolução ou projeto de lei municipal encontrado com esse
                filtro.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {resultadosCidades.map((r) => {
                  const cidade = cidadesPorId.get(r.id_municipio);
                  const contexto = hrefContexto(r, cidade);
                  return (
                    <li key={`${r.origem}:${r.id}`} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          {r.tipo ?? (r.origem === "ato" ? "Norma" : "Proposição")}
                        </span>
                        <span className="text-xs text-text-soft">
                          {cidade ? `${cidade.nome} · ${cidade.uf}` : r.id_municipio} ·{" "}
                          {formatDateBR(r.data)}
                        </span>
                      </div>
                      <p className="mt-2 font-medium text-text">
                        {r.tipo ?? (r.origem === "ato" ? "Ato" : "Proposição")}
                        {r.numero ? ` nº ${r.numero}` : ""}
                        {r.ano ? `/${r.ano}` : ""}
                      </p>
                      {r.ementa ? <p className="mt-0.5 text-sm text-text-soft">{r.ementa}</p> : null}
                      {r.temas && r.temas.length > 0 ? (
                        <ul className="mt-2 flex flex-wrap gap-1">
                          {r.temas.map((t) => (
                            <li
                              key={t}
                              className="rounded-full bg-surface-2 px-2 py-0.5 text-[.85em] font-medium text-text-soft"
                            >
                              {TEMA_LABELS[t] ?? t}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <footer className="mt-3 flex flex-wrap items-center gap-3 border-t border-border/60 pt-3 text-xs">
                        {r.link_fonte ? (
                          <a
                            href={r.link_fonte}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:text-accent"
                          >
                            Documento oficial ↗
                          </a>
                        ) : (
                          <span className="text-text-soft">Documento oficial não informado nesta fonte</span>
                        )}
                        {contexto ? (
                          <a href={contexto} className="text-text-soft hover:text-accent hover:underline">
                            Ver na página de {cidade?.nome} →
                          </a>
                        ) : null}
                      </footer>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* ─────────────────────────── Congresso ─────────────────────────── */}
          <section>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-xl font-semibold">Congresso</h2>
              {q ? (
                <span className="text-sm text-text-soft">
                  {rotuloContagem(resultadosCongresso.length, LIMITE_CONGRESSO, "resultado", "resultados")}
                </span>
              ) : null}
            </div>

            {!q ? (
              <p className="mt-3 rounded-xl border border-dashed border-border bg-surface-2 p-4 text-sm text-text-soft">
                Digite uma palavra-chave para buscar entre as proposições do Congresso — tema e
                território não filtram este eixo.
              </p>
            ) : resultadosCongresso.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-border bg-surface-2 p-4 text-sm text-text-soft">
                Nenhuma proposição do Congresso com esse termo.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {resultadosCongresso.map((p) => (
                  <li key={p.id} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <a
                        href={`/congresso/proposicoes/${p.id}`}
                        className="font-display font-semibold text-text underline-offset-2 hover:underline"
                      >
                        {p.identificacao ?? "Proposição"}
                      </a>
                      <span className="text-xs text-text-soft">
                        {formatDateBR(p.data_apresentacao)}
                      </span>
                    </div>
                    {p.ementa ? <p className="mt-2 text-sm text-text-soft">{p.ementa}</p> : null}
                    <p className="mt-2 text-xs text-text-soft">
                      {p.situacao ?? "situação não registrada"}
                      {p.temas_oficiais?.length ? ` · ${p.temas_oficiais.join(", ")}` : ""}
                    </p>
                    <footer className="mt-3 border-t border-border/60 pt-3 text-xs">
                      {p.url_inteiro_teor || p.url_fonte ? (
                        <a
                          href={(p.url_inteiro_teor || p.url_fonte) ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:text-accent"
                        >
                          Documento oficial ↗
                        </a>
                      ) : (
                        <span className="text-text-soft">Documento oficial não informado nesta fonte</span>
                      )}
                    </footer>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ─────────────────────────── Judiciário ─────────────────────────── */}
          <section>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-xl font-semibold">Judiciário</h2>
              {q ? (
                <span className="text-sm text-text-soft">
                  {rotuloContagem(resultadosJudiciario.length, LIMITE_JUDICIARIO, "resultado", "resultados")}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-text-soft">
              Composição de tribunais, magistrados, vagas e indicações — o Judiciário não
              produz legislação, então tema e território também não se aplicam aqui. Vaga não
              tem documento oficial próprio (é estado calculado, não um ato publicado); os
              outros tipos mostram o link quando o portal já coletou essa fonte.
            </p>

            {!q ? (
              <p className="mt-3 rounded-xl border border-dashed border-border bg-surface-2 p-4 text-sm text-text-soft">
                Digite uma palavra-chave para buscar no Judiciário.
              </p>
            ) : resultadosJudiciario.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-border bg-surface-2 p-4 text-sm text-text-soft">
                Nenhum resultado no Judiciário para esse termo.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {resultadosJudiciario.map((s) => (
                  <li key={`${s.tipo}:${s.href}:${s.titulo}`} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                    <a href={s.href} className="flex flex-wrap items-baseline gap-2 text-sm no-underline hover:text-primary">
                      <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-soft">
                        {s.tipo}
                      </span>
                      <span className="font-medium text-text">{s.titulo}</span>
                      {s.subtitulo ? <span className="text-text-soft">— {s.subtitulo}</span> : null}
                    </a>
                    <footer className="mt-3 border-t border-border/60 pt-3 text-xs">
                      {s.fonte_url ? (
                        <a
                          href={s.fonte_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:text-accent"
                        >
                          Documento oficial ↗
                        </a>
                      ) : s.tipo === "vaga" ? (
                        <span className="text-text-soft">Vaga não é um documento — sem fonte própria</span>
                      ) : (
                        <span className="text-text-soft">Documento oficial não informado nesta fonte</span>
                      )}
                    </footer>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
