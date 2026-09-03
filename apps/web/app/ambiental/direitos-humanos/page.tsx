import Link from "next/link";
import { listarRelatorios } from "@/lib/direitos-humanos/relatorios";
import PainelDialogo from "@/app/components/PainelDialogo";
import BotaoAlertaContextual from "@/app/components/BotaoAlertaContextual";
import { Epigrafe } from "@/app/components/Epigrafe";
import { citacaoPorId } from "@/lib/citacoes";
import FiltroDH from "./FiltroDH";

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

        {/* EPÍGRAFE EDITORIAL — citação autorizada no PLANO-COPY-VOZ.md (Cap. 2 · Evaristo, Becos da Memória) */}
        <p className="mt-4 border-l-2 border-primary/40 pl-4 text-sm italic text-text-soft">
          "A nossa escrevivência não pode ser lida como história de ninar os da casa-grande, mas sim para incomodá-los em seus sonhos injustos." — Conceição Evaristo, Becos da Memória, 2006
        </p>
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

        <FiltroDH relatorios={relatorios} />
      </section>

      {/* DIÁLOGO ENTRE FRENTES */}
      <PainelDialogo
        origemRota="/ambiental/direitos-humanos"
        origemTitulo="Relatórios de Direitos Humanos"
      />

      {/* BLOCO: E NOSSO POVO? */}
      <section className="mt-14 rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-sm">
        <span className="text-[0.75rem] font-bold uppercase tracking-wider text-primary">
          Impacto Social &amp; Vida Real
        </span>
        <h2 className="mt-1 font-display text-[1.6rem] font-semibold tracking-tight text-text">
          E nosso povo?
        </h2>
        <p className="mt-3 text-[0.95rem] text-text-soft leading-relaxed max-w-3xl">
          As populações em situação de vulnerabilidade e atingidas por violações demandam
          proteção integral e o cumprimento dos direitos humanos fundamentais.
        </p>
      </section>

      {/* BALÃO — citação autorizada */}
      <Epigrafe citacao={citacaoPorId("carolina-escrevo-miseria")!} variante="balao" className="mx-auto mt-8 max-w-xl" />
    </div>
  );
}
