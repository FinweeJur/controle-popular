import Link from "next/link";
import {
  listarAcoesClimaticasJuma,
  listarTesesTJMG,
} from "@/lib/judiciario/jurisprudencia-clima-barragens";
import { carregarSirenejudMg } from "@/lib/ambiental/sirenejud-dados";
import PainelDialogo from "@/app/components/PainelDialogo";
import { Epigrafe } from "@/app/components/Epigrafe";
import { citacaoPorId } from "@/lib/citacoes";

export const metadata = {
  title: "Litigância Climática e Conflitos Ambientais — JUMA, SIRENEJud e TJMG | ONSA",
  description:
    "Ações climáticas da base JUMA (PUC-Rio/LACLIMA), 322 mil processos ambientais do SIRENEJud (CNJ) e teses de jurisprudência do TJMG sobre barragens e direitos dos atingidos.",
};

export default function PaginaLitigiosClimaticos() {
  const acoesJuma = listarAcoesClimaticasJuma();
  const tesesTJMG = listarTesesTJMG();
  const sirenejud = carregarSirenejudMg();

  const gerarCsv = () => {
    const cabecalho = "Fonte;Título / Tema;Número Processo / Referência;Tribunal;UF;Municípios;Resumo / Impacto;Link Oficial\n";
    const linhasJuma = acoesJuma.map(
      (a) =>
        `"JUMA (Litigância Climática)";"${a.titulo}";"${a.numeroProcesso}";"${a.tribunal}";"${a.uf}";"${a.municipios.join(", ")}";"${a.resumo.replace(/"/g, '""')}";"${a.linkOficial}"`
    );
    const linhasTeses = tesesTJMG.map(
      (t) =>
        `"TJMG / TRF-6 (Jurisprudência Barragens)";"${t.tema}";"${t.numeroOuReferencia}";"${t.tribunal}";"MG";"${t.baciaOuConflito}";"${t.impactoParaAtingidos.replace(/"/g, '""')}";"${t.fontePesquisa}"`
    );
    return "\uFEFF" + cabecalho + [...linhasJuma, ...linhasTeses].join("\n");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* NAVEGAÇÃO BREADCRUMB */}
      <nav aria-label="Navegação estrutural" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:underline">Início</Link>
        <span>/</span>
        <Link href="/ambiental" className="hover:underline">ONSA</Link>
        <span>/</span>
        <span className="font-semibold text-foreground">Litigância Climática & Conflitos Judiciais</span>
      </nav>

      {/* CABEÇALHO */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
            Portal Juma (Litigância Climática)
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            SIRENEJud (CNJ)
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            TJMG & TRF-6 (Barragens)
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Litigância Climática e Conflitos Ambientais nos Tribunais
        </h1>
        <p className="mt-3 text-base text-muted sm:text-lg">
          A Justiça vista por quem defende as águas, o clima e os territórios: reunimos as ações climáticas
          da plataforma JUMA, o raio-x de 322 mil processos do SIRENEJud (CNJ) e as teses consolidadas
          do TJMG e TRF-6 sobre reparação de barragens e direitos dos atingidos.
        </p>

        {/* EPÍGRAFE EDITORIAL — citação autorizada no PLANO-COPY-VOZ.md (Cap. 3 · Judiciário) */}
        <p className="mt-4 border-l-2 border-primary/40 pl-4 text-sm italic text-text-soft">
          "O que a vida quer da gente é coragem." — João Guimarães Rosa, Grande Sertão: Veredas, 1956
        </p>
      </header>

      {/* CARTÕES DE TOPO */}
      <section aria-label="Indicadores judiciais" className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Litigância Climática (JUMA)</span>
          <p className="mt-2 font-display text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {acoesJuma.length} ações chave
          </p>
          <span className="mt-1 block text-xs text-muted">Mariana, Serra do Taquaril, Fundo Clima (STF) e BNDES</span>
        </div>
        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Processos Ambientais (CNJ)</span>
          <p className="mt-2 font-display text-3xl font-bold text-foreground">
            {sirenejud ? `${(sirenejud.total_processos_mg / 1000).toFixed(0)} mil em MG` : "322 mil em MG"}
          </p>
          <span className="mt-1 block text-xs text-muted">Governador Valadares, BH, Ipatinga e Betim no topo</span>
        </div>
        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Teses do TJMG (Barragens)</span>
          <p className="mt-2 font-display text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {tesesTJMG.length} teses pacificadas
          </p>
          <span className="mt-1 block text-xs text-muted">Inversão da prova, dano in re ipsa e legitimidade de pescadores</span>
        </div>
      </section>

      {/* GRÁFICO SVG NATIVO (Top Comarcas em Litígios Ambientais - CNJ) */}
      <section aria-label="Distribuição de litígios por comarca" className="mb-12 rounded-2xl border border-border bg-surface-2 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">
              Comarcas com Maior Volume de Ações Ambientais em MG (SIRENEJud / CNJ)
            </h2>
            <p className="mt-1 text-xs text-muted">
              Volume expressivo concentrado na Bacia do Rio Doce (lama de Mariana) e na Região Metropolitana de BH.
            </p>
          </div>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(gerarCsv())}`}
            download="litigancia-climatica-barragens-onsa.csv"
            className="mt-3 inline-flex items-center gap-1.5 self-start rounded-xl border border-border bg-surface-1 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-surface-3 transition-colors sm:mt-0 sm:self-auto"
          >
            📥 Baixar Planilha (CSV)
          </a>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {[
            { comarca: "Governador Valadares (Bacia do Rio Doce - corte d'água)", total: "108.612 processos", pct: 100 },
            { comarca: "Belo Horizonte (Tribunais, recursos e ações metropolitanas)", total: "51.442 processos", pct: 47 },
            { comarca: "Ipatinga (Vale do Aço / Rio Doce)", total: "5.798 processos", pct: 5.3 },
            { comarca: "Uberlândia (Triângulo Mineiro / Rio Araguari)", total: "4.955 processos", pct: 4.5 },
            { comarca: "Betim (Bacia do Paraopeba e Indústria)", total: "1.447 processos", pct: 1.3 },
            { comarca: "Mariana (Epicentro do rompimento de Fundão)", total: "1.068 processos", pct: 1.0 },
          ].map((item) => (
            <div key={item.comarca}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-foreground">{item.comarca}</span>
                <span className="text-muted">{item.total}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500"
                  style={{ width: `${Math.max(item.pct, 4)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEÇÃO 1: AÇÕES CLIMÁTICAS DO PORTAL JUMA */}
      <section aria-label="Ações climáticas do JUMA" className="mb-12">
        <h2 className="font-display text-xl font-bold text-foreground">
          Ações Climáticas Emblemáticas (Base JUMA)
        </h2>
        <p className="mt-1 text-xs text-muted">
          Litígios estratégicos que colocam a emergência climática, o uso da terra e a responsabilização empresarial no centro do debate judicial.
        </p>

        <div className="mt-6 flex flex-col gap-5">
          {acoesJuma.map((a) => (
            <article
              key={a.id}
              className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm hover:border-indigo-500/50 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5 text-xs text-muted">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-indigo-100 px-2 py-0.5 font-bold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                    {a.tipoAcao}
                  </span>
                  <span className="font-medium text-foreground">{a.tribunal}</span>
                </div>
                <span>Processo nº: {a.numeroProcesso}</span>
              </div>

              <h3 className="mt-3 font-display text-base font-bold text-foreground">
                {a.titulo}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                {a.resumo}
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-muted border-t border-border">
                <span>📍 Cidades: {a.municipios.join(", ")} ({a.uf})</span>
                <span className="rounded bg-surface-3 px-2 py-0.5">Status: {a.status}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* SEÇÃO 2: JURISPRUDÊNCIA DO TJMG SOBRE BARRAGENS (NACAB) */}
      <section aria-label="Teses do TJMG sobre barragens" className="mb-12">
        <h2 className="font-display text-xl font-bold text-foreground">
          Teses e Precedentes do TJMG e TRF-6 sobre Barragens
        </h2>
        <p className="mt-1 text-xs text-muted">
          Direitos conquistados e jurisprudência consolidada em favor das populações atingidas por rompimentos e contaminações (Pesquisa NACAB).
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {tesesTJMG.map((t) => (
            <article
              key={t.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface-2 p-5 shadow-sm"
            >
              <div>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {t.numeroOuReferencia}
                </span>
                <h3 className="mt-2 font-display text-sm font-bold text-foreground">
                  {t.tema}
                </h3>
                <p className="mt-2 text-xs text-muted">
                  {t.enunciadoResumido}
                </p>
              </div>

              <div className="mt-4 rounded-xl bg-surface-1 p-3 text-[11px] text-muted">
                <span className="font-semibold text-foreground">Impacto direto no bolso e vida do atingido: </span>
                {t.impactoParaAtingidos}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* DIÁLOGO ENTRE FRENTES */}
      <PainelDialogo
        origemRota="/ambiental/litigios-climaticos"
        origemTitulo="Litigância Climática e Barragens"
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
          As famílias em litígio e comunidades atingidas por barragens enfrentam o peso
          judicial e social das disputas por reparação e dignidade.
        </p>
      </section>

      {/* FECHO — citação autorizada */}
      <Epigrafe citacao={citacaoPorId("evaristo-medo-coragem")!} variante="fecho" />
    </div>
  );
}
