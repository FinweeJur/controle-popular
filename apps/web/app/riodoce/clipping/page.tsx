import type { Metadata } from "next";
import NextLink from "next/link";
import dados from "@/data/noticias-desastres.json";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";

/**
 * `/riodoce/clipping` — retrato de 60 dias do radar de notícias sobre os dois
 * desastres da bacia do Rio Doce (Fundão/Mariana) e do Paraopeba (Brumadinho).
 *
 * ⚠️ NÃO É CLIPPING CURADO ⚠️
 *
 * O acervo com curadoria é `/paraopeba/clipping`: alguém leu, resumiu e
 * classificou. Este arquivo é o contrário — `data/noticias-desastres.json`
 * vem do coletor `scripts/coletar-noticias-desastres.py`, que varre buscas
 * do Google Notícias e feeds públicos e guarda só título, link, veículo,
 * resumo do próprio feed, tema, data e (quando inferível) o desastre.
 *
 * Por isso a hero diz, em palavras, três coisas que a tela poderia fingir:
 * (1) é um retrato de 60 dias do radar, não uma seleção editorial;
 * (2) NÃO se atualiza sozinho — o JSON é lido no BUILD;
 * (3) a data de geração (`gerado_em`) aparece antes da lista.
 *
 * ⚠️ O LINK É DO AGREGADOR ⚠️
 *
 * A maioria dos itens guarda o link como veio do Google Notícias — um
 * redirecionador `news.google.com/rss/articles/...`. O portal não troca o
 * link por um palpite de URL original (isso quebraria itens); em vez disso,
 * avisa que o clique abre no agregador e que o veículo está no cartão.
 *
 * FILTRO SEM JAVASCRIPT: estado na URL (`?caso=&q=&veiculo=&pagina=`),
 * renderizado no servidor, formulário GET. Cada recorte é compartilhável e
 * a casca da zona não desmonta (regras 5.1 e 5.13).
 */

interface Noticia {
  titulo: string;
  link: string;
  veiculo: string;
  resumo: string;
  tema: string;
  desastre: string | null;
  data: string;
}

const ITENS = [...(dados.itens as Noticia[])].sort((a, b) =>
  (b.data ?? "").localeCompare(a.data ?? ""),
);

const TOTAL = ITENS.length;
const N_MARIANA = ITENS.filter((i) => i.desastre === "mariana").length;
const N_BRUMADINHO = ITENS.filter((i) => i.desastre === "brumadinho").length;
const N_SEM_CASO = ITENS.filter((i) => !i.desastre).length;

/** Veículos distintos, medidos do dado — não digitados. */
const VEICULOS = [...new Set(ITENS.map((i) => i.veiculo))].sort((a, b) =>
  a.localeCompare(b, "pt-BR"),
);

const POR_PAGINA = 30;
const JANELA_DIAS = dados.janela_dias;

type Caso = "todos" | "mariana" | "brumadinho" | "sem";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Primeiro valor de um parâmetro que o Next entrega como string ou array. */
function primeiro(valor: string | string[] | undefined): string {
  return (Array.isArray(valor) ? valor[0] : valor) ?? "";
}

/** Minúsculas e sem acento, para "mariana" achar "Mariana" e "indenizacao" achar "indenização". */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function casoValido(valor: string): Caso {
  return valor === "mariana" || valor === "brumadinho" || valor === "sem"
    ? valor
    : "todos";
}

/**
 * URL do recorte. Filtro vazio não vira parâmetro: `?caso=todos&q=` gera
 * URLs diferentes para a mesma tela, e o endereço colado fica ambíguo.
 */
function hrefRecorte(opcoes: {
  caso?: Caso;
  q?: string;
  veiculo?: string;
  pagina?: number;
}): string {
  const sp = new URLSearchParams();
  if (opcoes.caso && opcoes.caso !== "todos") sp.set("caso", opcoes.caso);
  if (opcoes.q) sp.set("q", opcoes.q);
  if (opcoes.veiculo) sp.set("veiculo", opcoes.veiculo);
  if (opcoes.pagina && opcoes.pagina > 1) {
    sp.set("pagina", String(opcoes.pagina));
  }
  const qs = sp.toString();
  return qs ? `/riodoce/clipping?${qs}` : "/riodoce/clipping";
}

/** " · página 2 de 4" só quando há mais de uma página. */
function contagemDoRecorte(n: number, pagina: number, totalPaginas: number): string {
  if (n === 0 || totalPaginas <= 1) return "";
  return ` · página ${formatNumberBR(pagina)} de ${formatNumberBR(totalPaginas)}`;
}

export const metadata: Metadata = {
  title: "Clipping do Rio Doce — retrato de 60 dias | Controle Popular",
  description:
    "Retrato de 60 dias do radar de notícias sobre Mariana/Fundão e Brumadinho: título, data, veículo e link. Varredura automática, sem curadoria e sem atualização sozinha.",
};

export default async function ClippingRioDocePage({ searchParams }: Props) {
  const params = await searchParams;
  const caso = casoValido(primeiro(params.caso));
  const q = primeiro(params.q).trim();
  const veiculo = primeiro(params.veiculo);
  const paginaPedida = Number.parseInt(primeiro(params.pagina), 10);

  const qNormalizada = normalizar(q);

  const filtrados = ITENS.filter((item) => {
    if (caso === "mariana" && item.desastre !== "mariana") return false;
    if (caso === "brumadinho" && item.desastre !== "brumadinho") return false;
    if (caso === "sem" && item.desastre) return false;
    if (veiculo && item.veiculo !== veiculo) return false;
    if (qNormalizada) {
      const alvo = normalizar(
        [item.titulo, item.resumo, item.veiculo, item.tema].join(" "),
      );
      if (!alvo.includes(qNormalizada)) return false;
    }
    return true;
  });

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const pagina = Number.isFinite(paginaPedida)
    ? Math.min(Math.max(paginaPedida, 1), totalPaginas)
    : 1;
  const inicio = (pagina - 1) * POR_PAGINA;
  const visiveis = filtrados.slice(inicio, inicio + POR_PAGINA);

  const temFiltro = caso !== "todos" || Boolean(q) || Boolean(veiculo);

  const casos: { valor: Caso; rotulo: string; n: number }[] = [
    { valor: "todos", rotulo: "Todos", n: TOTAL },
    { valor: "mariana", rotulo: "Mariana / Rio Doce", n: N_MARIANA },
    { valor: "brumadinho", rotulo: "Brumadinho", n: N_BRUMADINHO },
    { valor: "sem", rotulo: "Sem caso", n: N_SEM_CASO },
  ];

  return (
    <main className="w-full px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-4 text-sm text-text-soft">
          <NextLink href="/riodoce" className="hover:text-primary">
            Rio Doce
          </NextLink>{" "}
          › <span className="text-text">Clipping</span>
        </nav>

        {/* ─── Hero ─────────────────────────────────────────────────── */}
        <header className="space-y-3">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Clipping do Rio Doce
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-text-soft">
            Um retrato de <strong className="text-text">{JANELA_DIAS} dias</strong> do
            radar de notícias, reunido em{" "}
            <strong className="text-text">
              {formatDateBR(dados.gerado_em.slice(0, 10))}
            </strong>
            . Isto <strong className="text-text">não é clipping curado</strong>: é
            varredura automática de buscas e feeds públicos, sem leitura nem seleção
            editorial. A página{" "}
            <strong className="text-text">não se atualiza sozinha</strong> — o acervo
            só muda quando o site é reconstruído com uma coleta nova.
          </p>
          <p className="max-w-3xl text-sm leading-relaxed text-text-soft">
            Os títulos abrem no <strong className="text-text">Google Notícias</strong>,
            que é o agregador de onde a maioria dos links veio; o veículo que publicou
            aparece no cartão de cada item. O portal guarda título, veículo, data e
            link — nunca o texto da matéria.
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <NextLink
              href="/riodoce/analise"
              className="font-medium text-accent underline underline-offset-2 hover:text-primary"
            >
              Análise do caso
            </NextLink>
            <NextLink
              href="/riodoce/linha-do-tempo"
              className="font-medium text-accent underline underline-offset-2 hover:text-primary"
            >
              Linha do tempo
            </NextLink>
            <NextLink
              href="/paraopeba/clipping"
              className="font-medium text-accent underline underline-offset-2 hover:text-primary"
            >
              Clipping curado do Paraopeba
            </NextLink>
          </p>
        </header>

        {/* ─── Cartões de topo ─────────────────────────────────────── */}
        <section aria-label="Números do acervo" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { rotulo: "Itens no retrato", valor: TOTAL, nota: `últimos ${JANELA_DIAS} dias` },
            { rotulo: "Mariana / Fundão", valor: N_MARIANA, nota: "rótulo inferido pelo título" },
            { rotulo: "Brumadinho", valor: N_BRUMADINHO, nota: "rótulo inferido pelo título" },
            { rotulo: "Veículos distintos", valor: VEICULOS.length, nota: "campo veículo de cada item" },
          ].map((c) => (
            <div key={c.rotulo} className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs text-text-soft">{c.rotulo}</p>
              <p className="mt-1 font-tabular text-2xl font-bold text-text">
                {formatNumberBR(c.valor)}
              </p>
              <p className="mt-1 text-xs text-text-soft">{c.nota}</p>
            </div>
          ))}
        </section>

        {/* ─── Filtros (GET, funcionam sem JS) ─────────────────────── */}
        <section aria-labelledby="titulo-filtros" className="mt-8">
          <h2 id="titulo-filtros" className="font-display text-lg font-semibold">
            Filtrar o acervo
          </h2>

          <nav aria-label="Recorte por caso" className="mt-3 flex flex-wrap gap-2 text-sm">
            {casos.map((c) => {
              const ativo = caso === c.valor;
              return (
                <NextLink
                  key={c.valor}
                  href={hrefRecorte({ caso: c.valor, q, veiculo })}
                  aria-current={ativo ? "page" : undefined}
                  className={`rounded-full border px-3 py-1 ${
                    ativo
                      ? "border-primary bg-primary text-primary-ink"
                      : "border-border bg-surface hover:border-primary"
                  }`}
                >
                  {c.rotulo}{" "}
                  <span className={ativo ? "text-primary-ink/80" : "text-text-soft"}>
                    ({formatNumberBR(c.n)})
                  </span>
                </NextLink>
              );
            })}
          </nav>

          <form
            method="get"
            action="/riodoce/clipping"
            className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-4"
          >
            <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs text-text-soft">
              Buscar no título, resumo, veículo ou tema
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="ex.: acordo, indenização, MAB"
                className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text"
              />
            </label>

            <label className="flex min-w-[12rem] flex-col gap-1 text-xs text-text-soft">
              Caso
              <select
                name="caso"
                defaultValue={caso}
                className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text"
              >
                {casos.map((c) => (
                  <option key={c.valor} value={c.valor}>
                    {c.rotulo} ({c.n})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-w-[12rem] flex-col gap-1 text-xs text-text-soft">
              Veículo
              <select
                name="veiculo"
                defaultValue={veiculo}
                className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text"
              >
                <option value="">Todos os veículos ({VEICULOS.length})</option>
                {VEICULOS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-ink hover:opacity-90"
            >
              Filtrar
            </button>
            {temFiltro ? (
              <NextLink
                href="/riodoce/clipping"
                className="py-2 text-sm text-text-soft underline underline-offset-2 hover:text-text"
              >
                Limpar filtros
              </NextLink>
            ) : null}
          </form>
        </section>

        {/* ─── Resultado ───────────────────────────────────────────── */}
        <section aria-labelledby="titulo-lista" className="mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="titulo-lista" className="font-display text-lg font-semibold">
              {temFiltro ? "Itens do recorte" : "Todos os itens"}
            </h2>
            <p className="text-xs text-text-soft" role="status">
              {formatNumberBR(filtrados.length)}{" "}
              {filtrados.length === 1 ? "item" : "itens"} de{" "}
              {formatNumberBR(TOTAL)}
              {contagemDoRecorte(filtrados.length, pagina, totalPaginas)}
            </p>
          </div>

          {visiveis.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface p-6">
              <p className="text-sm text-text-soft">
                Nenhum item com esses filtros. Isso não quer dizer que o caso não tenha
                sido noticiado — quer dizer que a coleta não trouxe esse recorte.
              </p>
              <NextLink
                href="/riodoce/clipping"
                className="mt-2 inline-block text-sm font-medium text-accent underline underline-offset-2"
              >
                Ver o acervo inteiro
              </NextLink>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {visiveis.map((item) => (
                <li key={item.link}>
                  <article className="rounded-2xl border border-border bg-surface p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-text-soft">
                      <span className="font-semibold">{item.veiculo}</span>
                      <time dateTime={item.data.slice(0, 10)}>
                        {formatDateBR(item.data)}
                      </time>
                    </div>

                    <h3 className="mt-1.5 font-display text-base font-semibold leading-snug text-text">
                      {item.titulo}
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-text-soft">
                      {item.resumo}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                      <span className="rounded border border-border px-2 py-0.5 text-text-soft">
                        {item.tema}
                      </span>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-accent underline underline-offset-2 hover:text-primary"
                        title={`Abre no agregador Google Notícias; a matéria é de ${item.veiculo}.`}
                      >
                        Ler no veículo ↗
                      </a>
                      <span className="text-text-soft">
                        abre no Google Notícias
                      </span>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}

          {totalPaginas > 1 ? (
            <nav
              aria-label="Paginação do clipping"
              className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm"
            >
              {pagina > 1 ? (
                <NextLink
                  href={hrefRecorte({ caso, q, veiculo, pagina: pagina - 1 })}
                  className="rounded-lg border border-border bg-surface px-3 py-2 hover:border-primary"
                >
                  ← Anterior
                </NextLink>
              ) : (
                <span className="px-3 py-2 text-text-soft">← Anterior</span>
              )}

              <span className="text-xs text-text-soft">
                Página {formatNumberBR(pagina)} de {formatNumberBR(totalPaginas)}
              </span>

              {pagina < totalPaginas ? (
                <NextLink
                  href={hrefRecorte({ caso, q, veiculo, pagina: pagina + 1 })}
                  className="rounded-lg border border-border bg-surface px-3 py-2 hover:border-primary"
                >
                  Próxima →
                </NextLink>
              ) : (
                <span className="px-3 py-2 text-text-soft">Próxima →</span>
              )}
            </nav>
          ) : null}
        </section>

        {/* ─── Método ──────────────────────────────────────────────── */}
        <section
          aria-labelledby="titulo-metodo"
          className="mt-10 rounded-2xl border border-border bg-surface-2 p-5"
        >
          <h2 id="titulo-metodo" className="font-display text-lg font-semibold">
            De onde vem este acervo
          </h2>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-text-soft">
                Fonte
              </dt>
              <dd className="mt-1 text-text-soft">
                Coletor{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[12px]">
                  scripts/coletar-noticias-desastres.py
                </code>
                , sobre buscas do Google Notícias e feeds públicos.
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-text-soft">
                Janela e geração
              </dt>
              <dd className="mt-1 text-text-soft">
                Últimos {JANELA_DIAS} dias; retrato gerado em{" "}
                <strong className="text-text">
                  {formatDateBR(dados.gerado_em.slice(0, 10))}
                </strong>
                . Não se atualiza sozinho.
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-sm leading-relaxed text-text-soft">
            <strong className="text-text">O que este retrato não cobre:</strong>{" "}
            {dados.lacuna_conhecida}
          </p>

          <nav aria-label="Acervos irmãos" className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <NextLink
              href="/paraopeba/clipping"
              className="font-medium text-accent underline underline-offset-2 hover:text-primary"
            >
              Clipping curado do Paraopeba
            </NextLink>
            <NextLink
              href="/paraopeba/mab"
              className="font-medium text-accent underline underline-offset-2 hover:text-primary"
            >
              Notícias e notas do MAB
            </NextLink>
            <NextLink
              href="/riodoce/analise"
              className="font-medium text-accent underline underline-offset-2 hover:text-primary"
            >
              Análise do Rio Doce
            </NextLink>
            <NextLink
              href="/riodoce/linha-do-tempo"
              className="font-medium text-accent underline underline-offset-2 hover:text-primary"
            >
              Linha do tempo
            </NextLink>
          </nav>

          <p className="mt-4 text-xs text-text-soft">
            {formatNumberBR(N_SEM_CASO)} itens não têm vínculo claro com Mariana ou
            Brumadinho e ficam sem rótulo de caso, em vez de receber um palpite.
          </p>
        </section>
      </div>
    </main>
  );
}
