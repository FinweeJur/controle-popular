import Link from "next/link";
import { hrefAnalises, POR_PAGINA, recortePorSlug, type VisaoPainel } from "@/lib/congresso/analises";
import { PainelFacetas } from "@/app/components/PainelFacetas";
import { Barras } from "@/app/components/Barras";
import CardDestaque from "@/app/congresso/components/CardDestaque";

/**
 * @file Blocos visuais de `/congresso/analises`.
 *
 * O QUE É: o desenho do painel, separado da medição (`montarVisao`, em
 * `lib/congresso/analises.ts`). Cada bloco recebe a MESMA `VisaoPainel`, então
 * contador, barras, lista e paginação não podem discordar.
 *
 * POR QUE FORA DA `page.tsx`: a página passou do limite de complexidade do
 * CodeScene só por causa dos condicionais de JSX. Aqui cada bloco tem uma
 * responsabilidade e o leitor acha mais rápido onde mexer.
 *
 * FONTE: nenhuma. Só desenha o que `montarVisao` mediu.
 */

const TITULO_DO_RECORTE: Record<string, string> = {
  todas: "Todas as análises",
  restringem: "Proposições que restringem direitos",
  ampliam: "Proposições que ampliam direitos",
};

export function Trilha() {
  return (
    <nav aria-label="Trilha de navegação" className="text-xs text-muted">
      <Link href="/" className="hover:text-primary transition">
        Início
      </Link>{" "}
      ·{" "}
      <Link href="/congresso" className="hover:text-primary transition">
        Congresso Nacional
      </Link>{" "}
      · <span className="text-foreground font-semibold">Análises de direitos</span>
    </nav>
  );
}

export function Cabecalho({ visao }: { visao: VisaoPainel }) {
  const { acervo, cobertura, foraDoPainel } = visao;
  return (
    <header className="mt-4 space-y-3">
      <p className="text-sm uppercase tracking-wide text-text-soft">
        Congresso Nacional · régua garantista declarada
      </p>
      <h1 className="text-3xl font-bold">Análises de direitos</h1>
      <p className="max-w-3xl text-sm leading-relaxed text-text-soft">
        Cada proposição federal com análise concluída recebe um rótulo calculado
        pela rubrica do portal, com o direito afetado, o dispositivo legal e o
        trecho do projeto que fundamentam a leitura. Escolha o sentido e o tema:
        o contador, as barras e a lista abaixo mudam juntos.
      </p>
      <p className="text-sm">
        <strong>{acervo.length.toLocaleString("pt-BR")}</strong> proposições neste
        painel, de <strong>{cobertura.analisadas.toLocaleString("pt-BR")}</strong>{" "}
        com análise concluída ({cobertura.total.toLocaleString("pt-BR")} proposições
        acompanhadas no total).
        {foraDoPainel > 0 ? (
          <span className="text-text-soft">
            {" "}
            As outras {foraDoPainel.toLocaleString("pt-BR")} análises ficam fora deste
            recorte: rótulo neutro ou misto, ou repetição da mesma proposição.
          </span>
        ) : null}
      </p>
    </header>
  );
}

/** Os dois eixos de faceta mais o ranking de temas do recorte. */
export function BlocosDeMedida({ visao }: { visao: VisaoPainel }) {
  const { recorte, tema } = visao;
  return (
    <>
      <PainelFacetas
        facetas={visao.facetasDeRecorte}
        atual={recorte === "todas" ? undefined : recorte}
        total={visao.totalNoTema}
        hrefDe={(slug) => hrefAnalises({ recorte: recortePorSlug(slug), tema: tema?.slug })}
        titulo="Sentido da análise"
        ariaLabel="Recorte pelo sentido da análise de direitos"
        rotuloTodos="Todas"
        nota={`N = proposições com análise concluída${
          tema ? ` no tema ${tema.nome}` : ""
        }. Restringir e ampliar são rótulos excludentes: a soma dos dois é o total.`}
      />

      <PainelFacetas
        facetas={visao.facetasDeTema}
        atual={tema?.slug}
        total={visao.totalNoRecorte}
        hrefDe={(slug) => hrefAnalises({ recorte, tema: slug })}
        titulo="Tema"
        ariaLabel="Recorte por tema editorial"
        rotuloTodos="Todos os temas"
        nota="N = proposições do recorte atual que o tema alcança. Um projeto pode pertencer a mais de um tema, então a soma dos botões passa do total."
      />

      {visao.barras.length > 0 ? (
        <Barras
          titulo="Temas no recorte"
          dados={visao.barras.map((b) => [b.nome, b.n] as [string, number])}
          total={visao.totalNoRecorte}
          nota={`N e percentual sobre ${visao.totalNoRecorte.toLocaleString(
            "pt-BR"
          )} proposições do recorte. A soma das barras pode passar do total quando um projeto toca mais de um tema.`}
        />
      ) : null}
    </>
  );
}

function Paginacao({ visao }: { visao: VisaoPainel }) {
  const { pagina, recorte, tema } = visao;
  if (pagina.totalPaginas <= 1) return null;
  return (
    <nav aria-label="Paginação das análises" className="flex flex-wrap items-center gap-3 text-sm">
      {pagina.pagina > 1 ? (
        <Link
          className="inline-flex min-h-11 items-center rounded-full border border-[var(--cp-border)] bg-[var(--cp-surface)] px-4 py-1.5 transition hover:border-[var(--cp-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--cp-primary)]"
          href={hrefAnalises({ recorte, tema: tema?.slug, pagina: pagina.pagina - 1 })}
          rel="prev"
        >
          ← Anterior
        </Link>
      ) : null}
      <span className="text-text-soft">
        Página {pagina.pagina.toLocaleString("pt-BR")} de{" "}
        {pagina.totalPaginas.toLocaleString("pt-BR")}
      </span>
      {pagina.pagina < pagina.totalPaginas ? (
        <Link
          className="inline-flex min-h-11 items-center rounded-full border border-[var(--cp-border)] bg-[var(--cp-surface)] px-4 py-1.5 transition hover:border-[var(--cp-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--cp-primary)]"
          href={hrefAnalises({ recorte, tema: tema?.slug, pagina: pagina.pagina + 1 })}
          rel="next"
        >
          Próxima →
        </Link>
      ) : null}
    </nav>
  );
}

function Vazio({ visao }: { visao: VisaoPainel }) {
  return (
    <p className="rounded-xl border border-border bg-surface-2 p-5 text-sm">
      Nenhuma proposição com análise concluída neste recorte.{" "}
      {visao.tema ? (
        <Link className="underline" href={hrefAnalises({ recorte: visao.recorte })}>
          Ver o recorte sem filtro de tema
        </Link>
      ) : (
        <Link className="underline" href="/congresso/proposicoes">
          Ver todas as proposições em tramitação
        </Link>
      )}
    </p>
  );
}

export function ListaDoRecorte({ visao }: { visao: VisaoPainel }) {
  const { pagina, recorte, tema } = visao;
  return (
    <section aria-labelledby="titulo-lista" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="titulo-lista" className="font-display text-2xl font-bold">
          {TITULO_DO_RECORTE[recorte]}
          {tema ? <span className="text-base font-normal text-text-soft"> · {tema.nome}</span> : null}
        </h2>
        <p className="text-sm text-text-soft">
          {pagina.total === 0
            ? "nenhuma proposição neste recorte"
            : `mostrando ${pagina.inicio}–${pagina.fim} de ${pagina.total.toLocaleString("pt-BR")}`}
        </p>
      </div>

      {pagina.total === 0 ? (
        <Vazio visao={visao} />
      ) : (
        <ul className="space-y-4">
          {pagina.itens.map((d) => (
            <li key={d.id}>
              <CardDestaque d={d} />
            </li>
          ))}
        </ul>
      )}

      <Paginacao visao={visao} />
    </section>
  );
}

export function RodapePainel() {
  return (
    <>
      <section aria-labelledby="titulo-fora" className="space-y-2">
        <h2 id="titulo-fora" className="font-display text-lg font-semibold">
          O que não é recorte deste painel
        </h2>
        <p className="text-sm text-text-soft">
          Página por {POR_PAGINA} itens. A lista completa de proposições — com ou sem
          análise —, a tramitação, as votações e a metodologia continuam em endereço
          próprio:
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <li>
            <Link className="underline" href="/congresso/proposicoes">
              Todas as proposições
            </Link>
          </li>
          <li>
            <Link className="underline" href="/congresso/votacoes">
              Votações nominais
            </Link>
          </li>
          <li>
            <Link className="underline" href="/congresso/metodologia">
              Metodologia da régua
            </Link>
          </li>
        </ul>
      </section>

      <p className="text-xs text-text-soft">
        Fonte:{" "}
        <a
          href="https://dadosabertos.camara.leg.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Câmara dos Deputados — Dados Abertos ↗
        </a>
        . O rótulo é calculado pela rubrica do portal, não gerado pelo modelo de
        linguagem; o modelo apenas extrai itens que citam dispositivo e trecho.
      </p>
    </>
  );
}
