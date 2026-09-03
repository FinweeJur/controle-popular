import Link from "next/link";
import { listarRelatorios } from "@/lib/direitos-humanos/relatorios";
import PainelDialogo from "@/app/components/PainelDialogo";
import BlocoPovoGente from "@/app/ambiental/components/BlocoPovoGente";
import BotaoAlertaContextual from "@/app/components/BotaoAlertaContextual";

export const metadata = {
  title: "Relatórios de Direitos Humanos — CIDH, ONU e CNDH | ONSA",
  description:
    "Monitoramento de relatórios temáticos e de país da Comissão Interamericana (CIDH/OEA), Nações Unidas (ONU) e Conselho Nacional dos Direitos Humanos (CNDH) cruzados por território.",
};

export default function PaginaDireitosHumanos() {
  const relatorios = listarRelatorios();

  const gerarCsv = () => {
    const cabecalho = "Título;Órgão;Esfera;Tema;Ano;Países;Estados;Municípios;Link Oficial\n";
    const linhas = relatorios
      .map(
        (r) =>
          `"${r.titulo}";"${r.orgao}";"${r.esfera}";"${r.tema}";${r.ano};"${r.paises.join(", ")}";"${r.estados.join(", ")}";"${r.municipios.join(", ")}";"${r.linkOficial}"`
      )
      .join("\n");
    return "\uFEFF" + cabecalho + linhas;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* NAVEGAÇÃO BREADCRUMB */}
      <nav aria-label="Navegação estrutural" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:underline">Início</Link>
        <span>/</span>
        <Link href="/ambiental" className="hover:underline">ONSA</Link>
        <span>/</span>
        <span className="font-semibold text-foreground">Relatórios de Direitos Humanos</span>
      </nav>

      {/* CABEÇALHO */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            CIDH / OEA
          </span>
          <span className="rounded-full bg-sky-100 px-3 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
            ONU (ACNUDH)
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            CNDH (Brasil)
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Relatórios Internacionais e Nacionais de Direitos Humanos
        </h1>
        <p className="mt-3 text-base text-muted sm:text-lg">
          Compêndio de relatórios oficiais da Comissão Interamericana de Direitos Humanos (CIDH),
          da ONU e do Conselho Nacional dos Direitos Humanos (CNDH) cruzados com municípios,
          bacias hidrográficas e conflitos socioambientais brasileiros.
        </p>

        {/* EPÍGRAFE EDITORIAL */}
        <div className="mt-4 rounded-xl border border-dashed border-primary/40 bg-surface-2/60 p-4 text-sm italic text-muted">
          [Espaço para epígrafe/verso da equipe editorial sobre a dignidade inviolável e o clamor da justiça dos povos]
        </div>
      </header>

      {/* CARTÕES DE TOPO */}
      <section aria-label="Indicadores dos relatórios" className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Relatórios Catalogados</span>
          <p className="mt-2 font-display text-3xl font-bold text-foreground">{relatorios.length}</p>
          <span className="mt-1 block text-xs text-muted">CIDH, REDESCA, ONU ACNUDH e CNDH</span>
        </div>
        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Recomendações ao Brasil</span>
          <p className="mt-2 font-display text-3xl font-bold text-blue-600 dark:text-blue-400">30+ medidas</p>
          <span className="mt-1 block text-xs text-muted">Reparação de barragens, demarcações e combate à tortura</span>
        </div>
        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Municípios em Destaque</span>
          <p className="mt-2 font-display text-3xl font-bold text-foreground">12 polos</p>
          <span className="mt-1 block text-xs text-muted">Mariana, Brumadinho, Araçuaí, Itinga, BH, SP e Rio</span>
        </div>
      </section>

      {/* GRÁFICO SVG NATIVO (Distribuição Temática dos Relatórios) */}
      <section aria-label="Distribuição temática dos relatórios" className="mb-12 rounded-2xl border border-border bg-surface-2 p-6 shadow-sm">
        <h2 className="font-display text-lg font-bold text-foreground">
          Eixos Temáticos Monitorados nos Relatórios
        </h2>
        <p className="mt-1 text-xs text-muted">
          Distribuição dos relatórios segundo o foco principal de investigação e recomendações (CIDH/ONU/CNDH).
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {[
            { tema: "PIDESCA, Meio Ambiente e Empresas", pct: 33, count: "3 relatórios" },
            { tema: "Povos Indígenas e Terras Tradicionais", pct: 22, count: "2 relatórios" },
            { tema: "Mineração, Barragens e Desastres (Doce/Paraopeba)", pct: 22, count: "2 relatórios" },
            { tema: "Afrodescendentes e Quilombos", pct: 11, count: "1 relatório" },
            { tema: "Combate à Tortura e Sistema Prisional", pct: 11, count: "1 relatório" },
          ].map((item) => (
            <div key={item.tema}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-foreground">{item.tema}</span>
                <span className="text-muted">{item.count} ({item.pct}%)</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all duration-500"
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TABELA DE RELATÓRIOS */}
      <section aria-label="Lista de relatórios de direitos humanos" className="mb-12">
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              Documentos Temáticos e Missões Oficiais
            </h2>
            <p className="text-xs text-muted">
              Recomendações e relatórios vinculantes sobre o Brasil e comunidades atingidas.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <BotaoAlertaContextual
              tipo="resumo_pagina"
              titulo="Acervo de Relatórios de Direitos Humanos (CIDH, ONU e CNDH)"
              orgaoTerritorio="Brasil / Minas Gerais"
              identificador="ONSA / Controle Popular"
              link="https://controlepopular.com.br/ambiental/direitos-humanos"
              resumo="Catálogo de relatórios e recomendações internacionais sobre violações de direitos humanos em desastres da mineração e povos tradicionais."
              rotulo="Divulgar Acervo de Direitos Humanos"
            />
            <a
              href={`data:text/csv;charset=utf-8,${encodeURIComponent(gerarCsv())}`}
              download="relatorios-direitos-humanos-onsa.csv"
              className="inline-flex items-center gap-1.5 self-start rounded-xl border border-border bg-surface-1 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-surface-3 transition-colors sm:self-auto"
            >
              📥 Baixar Planilha (CSV)
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {relatorios.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-border bg-surface-2 p-6 shadow-sm hover:border-primary/50 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                    {r.orgao}
                  </span>
                  <span className="text-xs text-muted font-medium">{r.ano}</span>
                  <span className="rounded bg-surface-3 px-2 py-0.5 text-[11px] text-muted">
                    {r.tema}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary">
                    {r.esfera.toUpperCase()}
                  </span>
                  <BotaoAlertaContextual
                    tipo="resumo_pagina"
                    titulo={`${r.orgao} (${r.ano}): ${r.titulo}`}
                    orgaoTerritorio={r.municipios.length > 0 ? r.municipios.join(", ") : (r.estados.length > 0 ? r.estados.join(", ") : "Brasil")}
                    identificador={`Relatório Oficial ${r.orgao} — ${r.ano}`}
                    link={r.linkOficial}
                    resumo={r.resumoCidadao}
                    variante="icone"
                  />
                </div>
              </div>

              <h3 className="mt-3 font-display text-lg font-bold text-foreground">
                {r.titulo}
              </h3>
              <p className="mt-2 text-sm text-muted">
                {r.resumoCidadao}
              </p>

              <div className="mt-4 rounded-xl bg-surface-1 p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Recomendações Chave ao Estado:
                </span>
                <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted">
                  {r.recomendacoesChave.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex items-center justify-between pt-2">
                <span className="text-xs text-muted">
                  Estados: {r.estados.join(", ")} | {r.esfera.replace("_", " ")}
                </span>
                <a
                  href={r.linkOficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Abrir documento oficial ↗
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* DIÁLOGO ENTRE FRENTES */}
      <PainelDialogo
        origemRota="/ambiental/direitos-humanos"
        origemTitulo="Relatórios de Direitos Humanos"
      />

      {/* BLOCO OBRIGATÓRIO: E NOSSO POVO? */}
      <BlocoPovoGente
        variacao="povo"
        territorioNome="as populações em situação de vulnerabilidade e atingidas por violações"
      />
    </div>
  );
}
