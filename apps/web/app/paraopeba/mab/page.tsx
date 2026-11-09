import type { Metadata } from "next";
import NextLink from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import dados from "@/data/mab-publicacoes.json";

/**
 * `/paraopeba/mab` — notícias, artigos e notas oficiais do MAB sobre o caso.
 *
 * POR QUE EXISTE
 *
 * O MAB é parte no caso e a fonte que noticia o que não vira pauta. O radar
 * diário só alcança o feed recente; esta página lê a coleta da API pública do
 * site, que guarda anos de notícias, artigos e notas.
 *
 * REGRA EDITORIAL: o MAB é fonte interessada. Cada cartão diz isso, e o texto
 * de abertura não trata o material como neutro. O portal guarda título, resumo
 * do próprio site, data e link — não copia a matéria.
 *
 * PAYLOAD: a página é servidor e pagina 30 por vez. A coleção inteira nunca
 * vira prop de cliente (regra 5.1).
 */

interface MabItem {
  id: string;
  titulo: string;
  resumo: string;
  data: string;
  link: string;
  tipo: string;
  caso: string | null;
}

const ITENS = (dados as { itens: MabItem[] }).itens;
const GERADO_EM = (dados as { geradoEm?: string }).geradoEm?.slice(0, 10) ?? "";
const POR_PAGINA = 30;

const TIPOS = [
  { slug: "noticia", rotulo: "Notícias", valor: "Notícia" },
  { slug: "artigo", rotulo: "Artigos", valor: "Artigo" },
  { slug: "nota", rotulo: "Notas oficiais", valor: "Nota oficial" },
];

const CASOS = [
  { slug: "caso", rotulo: "Só o caso" },
  { slug: "brumadinho", rotulo: "Brumadinho" },
  { slug: "mariana", rotulo: "Mariana / Rio Doce" },
  { slug: "geral", rotulo: "Outros temas" },
];

export const metadata: Metadata = {
  title: "MAB — notícias, artigos e notas | Controle Popular",
  description:
    "Notícias, artigos e notas oficiais do Movimento dos Atingidos por Barragens sobre Brumadinho, Mariana e o Rio Doce, com data e link para a fonte.",
};

function semAcento(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase();
}

function hrefCom(
  atual: { tipo?: string; caso?: string; q?: string; pagina?: number },
  mudanca: Partial<{ tipo: string; caso: string; q: string; pagina: number }>,
): string {
  const params = new URLSearchParams();
  const estado = { ...atual, ...mudanca };
  if (estado.tipo) params.set("tipo", estado.tipo);
  if (estado.caso) params.set("caso", estado.caso);
  if (estado.q) params.set("q", estado.q);
  if (estado.pagina && estado.pagina > 1) params.set("pagina", String(estado.pagina));
  const query = params.toString();
  return query ? `/paraopeba/mab?${query}` : "/paraopeba/mab";
}

export default async function MabPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tipo = typeof params.tipo === "string" ? params.tipo : "";
  const caso = typeof params.caso === "string" ? params.caso : "";
  const q = typeof params.q === "string" ? params.q : "";
  const pagina = Math.max(1, Number(params.pagina ?? 1) || 1);

  const tipoValor = TIPOS.find((item) => item.slug === tipo)?.valor ?? "";
  const termo = semAcento(q.trim());

  const filtrados = ITENS.filter((item) => {
    if (tipoValor && item.tipo !== tipoValor) return false;
    if (caso === "caso" && !item.caso) return false;
    if (caso === "geral" && item.caso) return false;
    if (caso && caso !== "caso" && caso !== "geral" && item.caso !== caso) return false;
    if (termo && !semAcento(`${item.titulo} ${item.resumo}`).includes(termo)) return false;
    return true;
  });

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const visiveis = filtrados.slice(inicio, inicio + POR_PAGINA);
  const estado = { tipo, caso, q };

  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <NextLink href="/paraopeba" className="hover:text-primary">
          Paraopeba
        </NextLink>{" "}
        · <span className="text-text">MAB</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        O que o MAB publicou
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Notícias, artigos e notas oficiais do Movimento dos Atingidos por
        Barragens, com data e link para a fonte. O MAB é parte no caso: o
        material é a voz do movimento, não uma fonte neutra. O portal guarda
        título, resumo do próprio site e link — não copia a matéria. O acervo
        inclui notas sobre outros desastres; o filtro “Só o caso” restringe a
        Brumadinho, Mariana e Rio Doce.
      </p>
      <p className="mt-2 text-xs text-text-soft">
        {formatNumberBR(ITENS.length)} publicações coletadas em{" "}
        {GERADO_EM ? formatDateBR(GERADO_EM) : "data não informada"} · API
        pública do site · 2 s entre requisições
      </p>

      <form action="/paraopeba/mab" method="get" className="mt-6 flex flex-wrap gap-2">
        {tipo ? <input type="hidden" name="tipo" value={tipo} /> : null}
        {caso ? <input type="hidden" name="caso" value={caso} /> : null}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar no título ou resumo…"
          aria-label="Buscar publicação do MAB"
          className="min-w-0 flex-1 rounded-full border border-border bg-surface px-4 py-2 text-sm text-text placeholder:text-text-soft focus:border-accent focus-visible:outline-2 focus-visible:outline-accent"
        />
        <button
          type="submit"
          className="rounded-full border border-border bg-surface-2 px-4 py-2 text-sm font-semibold text-text hover:border-primary/50"
        >
          Buscar
        </button>
      </form>

      <div className="mt-5 flex flex-wrap gap-2" aria-label="Filtros">
        <NextLink
          href={hrefCom(estado, { tipo: "", pagina: 1 })}
          aria-current={!tipo ? "page" : undefined}
          className={`rounded-full border px-3 py-1 text-sm ${
            !tipo ? "border-primary bg-primary/5 font-semibold text-primary" : "border-border text-text-soft"
          }`}
        >
          Todos os tipos
        </NextLink>
        {TIPOS.map((item) => (
          <NextLink
            key={item.slug}
            href={hrefCom(estado, { tipo: item.slug, pagina: 1 })}
            aria-current={tipo === item.slug ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-sm ${
              tipo === item.slug
                ? "border-primary bg-primary/5 font-semibold text-primary"
                : "border-border text-text-soft"
            }`}
          >
            {item.rotulo}
          </NextLink>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2" aria-label="Filtro por caso">
        <NextLink
          href={hrefCom(estado, { caso: "", pagina: 1 })}
          aria-current={!caso ? "page" : undefined}
          className={`rounded-full border px-3 py-1 text-sm ${
            !caso ? "border-primary bg-primary/5 font-semibold text-primary" : "border-border text-text-soft"
          }`}
        >
          Tudo
        </NextLink>
        {CASOS.map((item) => (
          <NextLink
            key={item.slug}
            href={hrefCom(estado, { caso: item.slug, pagina: 1 })}
            aria-current={caso === item.slug ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-sm ${
              caso === item.slug
                ? "border-primary bg-primary/5 font-semibold text-primary"
                : "border-border text-text-soft"
            }`}
          >
            {item.rotulo}
          </NextLink>
        ))}
      </div>

      <p className="mt-5 text-sm text-text-soft" aria-live="polite">
        {formatNumberBR(filtrados.length)} publicações
        {tipoValor ? ` em ${tipoValor.toLowerCase()}` : ""}
        {caso === "caso"
          ? " · só o caso"
          : caso
            ? ` · ${CASOS.find((item) => item.slug === caso)?.rotulo ?? caso}`
            : " · arquivo completo"}
        {q ? ` · busca “${q}”` : ""}
      </p>

      <ol className="mt-4 space-y-3">
        {visiveis.map((item) => (
          <li key={item.id} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-soft">
              <span className="rounded-full bg-surface-2 px-2 py-0.5 font-semibold text-text">
                {item.tipo}
              </span>
              {item.caso ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                  {item.caso === "brumadinho" ? "Brumadinho" : "Mariana / Rio Doce"}
                </span>
              ) : null}
              <time dateTime={item.data}>{formatDateBR(item.data)}</time>
            </div>
            <h2 className="mt-2 font-display text-base font-semibold leading-snug">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-dotted underline-offset-2 hover:text-primary"
              >
                {item.titulo}
              </a>
            </h2>
            {item.resumo ? (
              <p className="mt-1 text-sm text-text-soft">{item.resumo}</p>
            ) : null}
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs font-semibold text-primary underline underline-offset-2"
            >
              Ler no MAB ↗
            </a>
          </li>
        ))}
      </ol>

      {visiveis.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-border p-5 text-sm text-text-soft">
          Nenhuma publicação com esse filtro. Ajuste a busca ou limpe os filtros.
        </p>
      ) : null}

      {totalPaginas > 1 ? (
        <nav className="mt-6 flex items-center justify-between text-sm" aria-label="Paginação">
          {paginaAtual > 1 ? (
            <NextLink
              href={hrefCom(estado, { pagina: paginaAtual - 1 })}
              className="font-semibold text-primary underline underline-offset-2"
            >
              ← Página anterior
            </NextLink>
          ) : (
            <span />
          )}
          <span className="text-text-soft">
            {paginaAtual} de {totalPaginas}
          </span>
          {paginaAtual < totalPaginas ? (
            <NextLink
              href={hrefCom(estado, { pagina: paginaAtual + 1 })}
              className="font-semibold text-primary underline underline-offset-2"
            >
              Próxima página →
            </NextLink>
          ) : (
            <span />
          )}
        </nav>
      ) : null}

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </main>
  );
}
