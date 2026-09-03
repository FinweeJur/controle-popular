import Link from "next/link";
import {
  listarFontesClimaRisco,
  listarMunicipiosRisco,
  obterEstatisticasMacroRisco,
} from "@/lib/clima/bases-risco";
import TabelaRiscoClient from "./TabelaRiscoClient";
import PainelDialogo from "@/app/components/PainelDialogo";
import BlocoPovoGente from "@/app/ambiental/components/BlocoPovoGente";

export const metadata = {
  title: "Bases de Clima e Risco — BATER, CEMADEN, INMET, INPE, SNIS | ONSA",
  description:
    "Painel de vulnerabilidade climática, população exposta em áreas de risco (BATER), monitoramento pluviométrico, queimadas e saneamento básico.",
};

export default function PaginaBasesClimaRisco() {
  const fontes = listarFontesClimaRisco();
  const municipios = listarMunicipiosRisco();
  const macro = obterEstatisticasMacroRisco();

  const maxPop = Math.max(...municipios.map((m) => m.populacao_area_risco));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* BREADCRUMB */}
      <nav aria-label="Navegação estrutural" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:underline">Início</Link>
        <span>/</span>
        <Link href="/ambiental" className="hover:underline">ONSA</Link>
        <span>/</span>
        <span className="font-semibold text-foreground">Bases de Clima e Risco</span>
      </nav>

      {/* CABEÇALHO */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            IBGE / CEMADEN (BATER)
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            INMET Avisos
          </span>
          <span className="rounded-full bg-red-100 px-3 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950/60 dark:text-red-300">
            INPE Queimadas
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            MDR / SNIS Saneamento
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Bases de Vulnerabilidade Climática e Risco
        </h1>
        <p className="mt-3 text-base text-muted sm:text-lg">
          Cruzamento dos dados de população exposta em áreas de risco (BATER), rede telemétrica
          de pluviômetros do CEMADEN, avisos meteorológicos do INMET, focos de calor do INPE e
          indicadores de saneamento básico do MDR/SNIS.
        </p>

        {/* EPÍGRAFE EDITORIAL */}
        <div className="mt-4 rounded-xl border border-dashed border-primary/40 bg-surface-2/60 p-4 text-sm italic text-muted">
          <p>
            &ldquo;Não é só onde o risco está, é quantas pessoas vivem lá. Índice composto não é medida: contagem bruta (gente exposta, domicílios, milímetros de chuva) é fato mensurável, enquanto o modelo apenas contextualiza.&rdquo;
          </p>
          <p className="mt-1 text-xs not-italic font-medium text-foreground">
            — Diretriz Editorial de Vulnerabilidade e Risco (PLANO-BASES-CLIMA-E-RISCO.md)
          </p>
        </div>
      </header>

      {/* 1. CARTÕES DE STATUS DE TOPO */}
      <section aria-labelledby="titulo-totais" className="mb-8">
        <h2 id="titulo-totais" className="sr-only">Estatísticas Gerais de Risco</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-4 text-center">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">População em Risco (MG)</p>
            <p className="mt-1 font-display text-2xl font-bold text-red-600 sm:text-3xl">
              {macro.populacao_risco_mg.toLocaleString("pt-BR")}
            </p>
            <p className="mt-1 text-[11px] text-muted">14,8% da população monitorada</p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 text-center">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">Polígonos BATER (MG)</p>
            <p className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">
              {macro.total_poligonos_bater_mg}
            </p>
            <p className="mt-1 text-[11px] text-muted">19,6% de todo o Brasil</p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 text-center">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">Pluviômetros CEMADEN</p>
            <p className="mt-1 font-display text-2xl font-bold text-primary sm:text-3xl">
              {macro.estacoes_pluvio_mg}+
            </p>
            <p className="mt-1 text-[11px] text-muted">Estações automáticas em MG</p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 text-center">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">Fontes Integradas</p>
            <p className="mt-1 font-display text-2xl font-bold text-emerald-600 sm:text-3xl">
              {fontes.length}
            </p>
            <p className="mt-1 text-[11px] text-muted">Órgãos oficiais federais</p>
          </div>
        </div>
      </section>

      {/* 2. GRÁFICO SVG NATIVO: POPULAÇÃO EM ÁREA DE RISCO */}
      <section className="mb-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold text-foreground">
          População Residente em Áreas de Risco Geo-hidrológico (BATER)
        </h2>
        <p className="mt-1 text-xs text-muted">
          Pessoas expostas a inundações, enxurradas e deslizamentos de terra nos principais polos monitorados.
        </p>

        <div className="mt-4 space-y-3">
          {municipios.map((m) => {
            const pct = Math.round((m.populacao_area_risco / maxPop) * 100);
            return (
              <div key={m.id_municipio} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">
                    {m.nome} <span className="text-muted">({m.percentual_populacao_risco}% da cidade)</span>
                  </span>
                  <span className="font-mono font-semibold text-red-600">
                    {m.populacao_area_risco.toLocaleString("pt-BR")} pessoas
                  </span>
                </div>
                <div className="h-3.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-red-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={m.populacao_area_risco}
                    aria-valuemin={0}
                    aria-valuemax={maxPop}
                    aria-label={`${m.nome}: ${m.populacao_area_risco} pessoas em risco`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. TABELA COM FILTROS E DOWNLOAD CSV */}
      <section className="mb-8">
        <h2 className="mb-3 font-display text-xl font-semibold text-foreground">
          Métricas Territoriais por Município
        </h2>
        <TabelaRiscoClient municipios={municipios} />
      </section>

      {/* 4. AS 6 BASES OFICIAIS INTEGRADAS */}
      <section className="mb-8">
        <h2 className="mb-4 font-display text-xl font-semibold text-foreground">
          Fontes Oficiais e Rastreabilidade Metodológica
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {fontes.map((f) => (
            <div key={f.id} className="rounded-xl border border-border bg-surface p-4 text-left">
              <div className="flex items-center justify-between">
                <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                  {f.orgao}
                </span>
                <span className="text-[11px] text-muted">{f.tipo_dado}</span>
              </div>
              <h3 className="mt-2 font-display text-base font-semibold text-foreground">
                {f.nome}
              </h3>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                {f.metodologia}
              </p>
              <div className="mt-3 border-t border-border pt-2 text-[11px] text-amber-700 dark:text-amber-300">
                <strong>Ressalva:</strong> {f.ressalva}
              </div>
              <div className="mt-2 text-right">
                <a
                  href={f.link_oficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Fonte Oficial ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. BLOCO "E NOSSO POVO?" */}
      <BlocoPovoGente
        frente="ambiental"
        nomeTerritorio="Minas Gerais e Bacias Hidrográficas"
      />

      {/* 6. SANFONA DE DIÁLOGO */}
      <section className="mb-8">
        <PainelDialogo
          titulo="Como o Controle Popular interpreta as bases de clima e risco?"
          perguntas={[
            {
              id: "bater-o-que-e",
              pergunta: "O que é a Base Territorial Estatística de Áreas de Risco (BATER)?",
              resposta:
                "É o cruzamento realizado pelo IBGE e CEMADEN entre os setores censitários do Censo e as cartas geotécnicas de risco. Não é uma probabilidade abstrata: ela conta quantas casas e pessoas reais estão assentadas sobre encostas com risco de deslizamento ou planícies de inundação.",
            },
            {
              id: "dado-datado",
              pergunta: "Qual a ressalva sobre os dados do BATER?",
              resposta:
                "Os dados têm como base demográfica o Censo 2010 e o mapeamento físico até abril de 2017. Eles não incorporam ainda o Censo 2022 (anunciado em elaboração pelos órgãos) nem os desastres posteriores, como o rompimento de Brumadinho em 2019.",
            },
            {
              id: "correlacao-saude",
              pergunta: "Como o risco climático se conecta ao SUS e à saúde pública?",
              resposta:
                "O portal correlaciona áreas sem saneamento e sujeitas a enchentes com internações por gastroenterites (CID A00-A09) e leptospirose (CID A27). Em áreas com poeira de minério e queimadas, monitora pneumonias (CID J12-J18) e asma (CID J45).",
            },
          ]}
        />
      </section>
    </div>
  );
}
