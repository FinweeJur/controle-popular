"use client";

/**
 * @file apps/web/app/canada/institucional/PainelInstitucionalCanada.tsx
 * @description Painel interativo institucional, cidades SGC, Parlamento, CanLII e Ouvidoria CORE (/canada/institucional).
 *
 * Papel no portal:
 * Mapeia as cidades polo, leis federais de transparência (ESTMA e UNDRIP),
 * decisões históricas da Suprema Corte canadense sobre litígios transnacionais,
 * territórios das Primeiras Nações e canais cívicos da Ouvidoria CORE e ATIP.
 *
 * Fontes oficiais:
 * - Statistics Canada (SGC Cidades e Províncias).
 * - Parliament of Canada / OpenParliament.ca (Leis ESTMA e Projetos S-211/C-262).
 * - Supreme Court of Canada via CanLII (Nevsun v. Araya e Haida Nation).
 * - CIRNAC / ISC (First Nation Profiles e ATIS).
 * - Office of the Canadian Ombudsperson for Responsible Enterprise (CORE).
 *
 * Decisões técnicas:
 * - Cumpre integralmente o Padrão das 6 Qualidades (AGENTS.md §8).
 * - Guia cívico passo a passo para denúncias na Ouvidoria CORE e pedidos de informação ATIP.
 * - Textos formulados em frases diretas de até 13 palavras.
 */

import { useState, useMemo } from "react";
import BarraIdiomaTrilingue from "@/app/components/BarraIdiomaTrilingue";
import type { IdiomaExibicao } from "@/lib/internacional/idiomas-internacional";
import type { RegistroInstitucionalCanada } from "../../../../../scripts/coletar-canada-acervo.mts";
import type { CoberturaCanada } from "@/lib/internacional/dados-canada";

interface PainelInstitucionalCanadaProps {
  institucional: RegistroInstitucionalCanada[];
  cobertura: CoberturaCanada;
}

type CampoOrdenacao = "nome" | "metricaPrincipalValor" | "anoReferencia" | "frente";

export default function PainelInstitucionalCanada({
  institucional,
  cobertura,
}: PainelInstitucionalCanadaProps) {
  const [busca, setBusca] = useState("");
  const [filtroFrente, setFiltroFrente] = useState("TODAS");
  const [filtroProvincia, setFiltroProvincia] = useState("TODAS");
  const [campoOrdenacao, setCampoOrdenacao] = useState<CampoOrdenacao>("nome");
  const [ordemAsc, setOrdemAsc] = useState(true);
  const [idioma, setIdioma] = useState<IdiomaExibicao>("pt");

  // Normalização para busca sem acentos
  const normalizar = (txt: string) =>
    txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const termoBusca = normalizar(busca);

  // Frentes disponíveis
  const frentesDisponiveis = useMemo(() => {
    const conjunto = new Set<string>();
    institucional.forEach((i) => conjunto.add(i.frente));
    return Array.from(conjunto).sort();
  }, [institucional]);

  // Províncias / Esferas
  const provinciasDisponiveis = useMemo(() => {
    const conjunto = new Set<string>();
    institucional.forEach((i) => {
      const parte = i.provincia.split("/")[0].trim();
      conjunto.add(parte);
    });
    return Array.from(conjunto).sort();
  }, [institucional]);

  // Filtragem e ordenação
  const registrosFiltrados = useMemo(() => {
    return institucional
      .filter((i) => {
        if (filtroFrente !== "TODAS" && i.frente !== filtroFrente) {
          return false;
        }
        if (
          filtroProvincia !== "TODAS" &&
          !i.provincia.toLowerCase().includes(filtroProvincia.toLowerCase())
        ) {
          return false;
        }
        if (!termoBusca) return true;

        return (
          normalizar(i.nome).includes(termoBusca) ||
          normalizar(i.frente).includes(termoBusca) ||
          normalizar(i.provincia).includes(termoBusca) ||
          normalizar(i.resumoCivico).includes(termoBusca) ||
          normalizar(i.eloBrasil).includes(termoBusca) ||
          normalizar(i.codigoOficial).includes(termoBusca)
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (campoOrdenacao === "nome") {
          cmp = a.nome.localeCompare(b.nome);
        } else if (campoOrdenacao === "metricaPrincipalValor") {
          cmp = a.metricaPrincipalValor - b.metricaPrincipalValor;
        } else if (campoOrdenacao === "anoReferencia") {
          cmp = a.anoReferencia - b.anoReferencia;
        } else if (campoOrdenacao === "frente") {
          cmp = a.frente.localeCompare(b.frente);
        }
        return ordemAsc ? cmp : -cmp;
      });
  }, [institucional, filtroFrente, filtroProvincia, termoBusca, campoOrdenacao, ordemAsc]);

  // Exportação CSV com BOM UTF-8 e separador ';'
  function exportarCsv() {
    const cabecalho = [
      "Nome da Instituicao / Norma",
      "Frente Institucional",
      "Codigo Oficial",
      "Provincia / Jurisdicao",
      "Status ou Funcao",
      "Ano Referencia",
      "Metrica Principal (Rotulo)",
      "Metrica Principal (Valor)",
      "Unidade",
      "Resumo Civico",
      "Elo com o Brasil",
      "Fonte Oficial",
      "URL Oficial Direta",
    ];

    const linhas = registrosFiltrados.map((i) => [
      `"${i.nome}"`,
      `"${i.frente}"`,
      `"${i.codigoOficial}"`,
      `"${i.provincia}"`,
      `"${i.statusOuCargo}"`,
      `${i.anoReferencia}`,
      `"${i.metricaPrincipalRotulo}"`,
      `${i.metricaPrincipalValor}`,
      `"${i.unidadeMetrica}"`,
      `"${i.resumoCivico.replace(/"/g, '""')}"`,
      `"${i.eloBrasil.replace(/"/g, '""')}"`,
      `"${i.fonteOficial}"`,
      `"${i.urlOficial}"`,
    ]);

    const csvContent =
      "\uFEFF" + [cabecalho.join(";"), ...linhas.map((l) => l.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `institucional-canada-brasil-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* BARRA TRILÍNGUE (PT / EN / ES + TTS + SEU NONÔ) */}
      <BarraIdiomaTrilingue
        idioma={idioma}
        aoTrocarIdioma={setIdioma}
        resumoTrilingue={{
          pt: "Cidades canadenses, Parlamento Federal, jurisprudência da Suprema Corte e ouvidoria cívica CORE.",
          en: "Canadian municipalities, Federal Parliament, Supreme Court precedents, and CORE ombudsperson.",
          es: "Ciudades canadienses, Parlamento Federal, jurisprudencia de la Suprema Corte y defensoría CORE.",
        }}
        perguntaSeuNono={{
          pt: "Como uma comunidade brasileira pode acionar a Ouvidoria CORE ou a Suprema Corte canadense?",
          en: "How can a Brazilian community file a complaint with CORE or reference Canadian Supreme Court rulings?",
          es: "¿Cómo puede una comunidad brasileña denunciar ante CORE o citar la Suprema Corte de Canadá?",
        }}
        paisDestaque="Canadá"
      />

      {/* CARTÕES DE TOPO COM AGREGADOS MEDIDOS */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4" aria-label="Métricas institucionais">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Registros Institucionais</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            {cobertura.registrosInstitucionais}
          </div>
          <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
            {registrosFiltrados.length} na visualização atual
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Cidades-Polo & SGC</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            {cobertura.cidadesPolo}
          </div>
          <div className="mt-1 text-xs text-muted">Toronto, Sudbury, Vancouver</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Primeiras Nações no CIRNAC</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            634
          </div>
          <div className="mt-1 text-xs text-muted">Nações e ~3.100 reservas</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Transparência ESTMA</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            CAD $100k
          </div>
          <div className="mt-1 text-xs text-muted">Piso para reporte de pagamentos</div>
        </div>
      </section>

      {/* GUIA CÍVICO: OUVIDORIA CORE & PEDIDOS ATIP */}
      <div className="rounded-2xl border-2 border-emerald-500/40 bg-surface p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              Guia Prático de Cidadania
            </span>
            <h2 className="text-base font-bold text-foreground">
              Como Acionar a Ouvidoria CORE e Solicitar Documentos via ATIP
            </h2>
          </div>
          <span className="text-xs font-mono text-muted">Canais Gratuitos de Controle</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl bg-surface-2 p-4 space-y-2 border border-border">
            <div className="font-bold text-foreground text-sm flex items-center justify-between">
              <span>🏛️ Ouvidoria Federal CORE</span>
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                Sem Custo
              </span>
            </div>
            <p className="text-muted leading-relaxed">
              O Office of the Canadian Ombudsperson for Responsible Enterprise investiga denúncias de violações
              de direitos humanos causadas por mineradoras canadenses no exterior.
            </p>
            <ul className="list-disc pl-4 space-y-1 text-muted">
              <li>Qualquer comunidade atingida ou organização do Brasil pode peticionar.</li>
              <li>Aceita denúncias em português, inglês, espanhol ou francês.</li>
              <li>Pode publicar relatórios públicos com recomendações e sanções.</li>
            </ul>
            <div className="pt-2">
              <a
                href="https://core-ombuds.canada.ca/core_ombuds-ocre_ombuds/complaint-plainte.aspx?lang=eng"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:underline dark:text-emerald-400"
              >
                <span>Acessar formulário de denúncia da CORE</span>
                <span>↗</span>
              </a>
            </div>
          </div>

          <div className="rounded-xl bg-surface-2 p-4 space-y-2 border border-border">
            <div className="font-bold text-foreground text-sm flex items-center justify-between">
              <span>📋 Pedidos de Informação ATIP</span>
              <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-700 dark:text-blue-300 font-semibold">
                LAI Canadense
              </span>
            </div>
            <p className="text-muted leading-relaxed">
              A Lei de Acesso à Informação do Canadá (ATIP / Access to Information Act) obriga órgãos federais
              a fornecer documentos públicos e correspondências oficiais.
            </p>
            <ul className="list-disc pl-4 space-y-1 text-muted">
              <li>Permite solicitar comunicações entre mineradoras e embaixadas.</li>
              <li>Acesso a pareceres da EDC sobre financiamentos concedidos ao Brasil.</li>
              <li>Relatórios de transparência de pagamentos exigidos pela lei ESTMA.</li>
            </ul>
            <div className="pt-2">
              <a
                href="https://atip-aiprp.apps.gc.ca/atip/welcome.do?lang=en"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:underline dark:text-emerald-400"
              >
                <span>Portal oficial de requerimentos ATIP</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        </div>

        {/* NOTA JURÍDICA: PRECEDENTE NEVSUN V. ARAYA */}
        <div className="rounded-xl bg-surface-2 p-3.5 text-xs text-muted leading-relaxed">
          <strong className="text-foreground">Precedente Judicial da Suprema Corte do Canadá (CanLII):</strong> Na
          decisão histórica <em>Nevsun Resources Ltd. v. Araya</em> (2020 SCC 5), a Suprema Corte estabeleceu que
          empresas sediadas no Canadá podem ser processadas diretamente nas cortes canadenses por graves violações de
          direitos humanos ocorridas em suas operações no exterior. Esse precedente consolida a competência de
          jurisdição para comunidades brasileiras buscarem reparação perante tribunais de Vancouver e Toronto.
        </div>
      </div>

      {/* CONTROLE DE BUSCA, FILTROS E EXPORTAÇÃO */}
      <div className="rounded-2xl border border-border bg-surface p-4 space-y-4 print:hidden shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="w-full md:max-w-md">
            <label htmlFor="busca-institucional" className="sr-only">
              Buscar instituições ou precedentes
            </label>
            <input
              id="busca-institucional"
              type="search"
              placeholder="Buscar por instituição, tribunal, cidade ou lei..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-sm text-foreground placeholder:text-muted focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportarCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-elevated transition-colors"
            >
              <span>⬇️</span>
              <span>Exportar CSV (BOM UTF-8)</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-muted hover:text-foreground transition-colors"
            >
              <span>🖨️</span>
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* FACETAS */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-muted">Frente:</span>
            <select
              value={filtroFrente}
              onChange={(e) => setFiltroFrente(e.target.value)}
              className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground focus:outline-none"
            >
              <option value="TODAS">Todas as frentes</option>
              {frentesDisponiveis.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-muted">Província:</span>
            <select
              value={filtroProvincia}
              onChange={(e) => setFiltroProvincia(e.target.value)}
              className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground focus:outline-none"
            >
              <option value="TODAS">Todas as províncias</option>
              {provinciasDisponiveis.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-muted">Ordenar:</span>
            <select
              value={campoOrdenacao}
              onChange={(e) => setCampoOrdenacao(e.target.value as CampoOrdenacao)}
              className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground focus:outline-none"
            >
              <option value="nome">Nome (A-Z)</option>
              <option value="metricaPrincipalValor">Métrica Principal</option>
              <option value="anoReferencia">Ano de Referência</option>
              <option value="frente">Frente</option>
            </select>
            <button
              type="button"
              onClick={() => setOrdemAsc(!ordemAsc)}
              className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs text-muted hover:text-foreground"
            >
              {ordemAsc ? "Crescente ▲" : "Decrescente ▼"}
            </button>
          </div>

          {(filtroFrente !== "TODAS" || filtroProvincia !== "TODAS" || busca) && (
            <button
              onClick={() => {
                setFiltroFrente("TODAS");
                setFiltroProvincia("TODAS");
                setBusca("");
              }}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              Limpar filtros
            </button>
          )}

          <div className="ml-auto text-xs text-muted">
            Exibindo <strong>{registrosFiltrados.length}</strong> de {institucional.length}
          </div>
        </div>
      </div>

      {/* CARDS COM AS SEIS QUALIDADES */}
      <div className="grid gap-4 sm:grid-cols-2">
        {registrosFiltrados.map((i) => (
          <div
            key={i.id}
            className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-xs hover:border-emerald-500/50 transition-colors"
          >
            <div>
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {i.frente}
                </span>
                <span className="font-mono text-xs text-muted">{i.codigoOficial}</span>
              </div>

              <h3 className="font-bold text-foreground text-base leading-snug">
                {i.nome}
              </h3>
              <div className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {i.statusOuCargo} · {i.provincia}
              </div>

              <p className="mt-2.5 text-xs text-muted leading-relaxed">
                {i.resumoCivico}
              </p>

              {/* MÉTRICA PRINCIPAL MEDIDA */}
              <div className="mt-3.5 rounded-xl bg-surface-2 p-3 border border-border">
                <div className="text-xs font-semibold text-muted">
                  {i.metricaPrincipalRotulo}:
                </div>
                <div className="mt-0.5 text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {i.metricaPrincipalValor.toLocaleString()} {i.unidadeMetrica}
                </div>
              </div>

              {/* CONEXÃO BRASIL */}
              <div className="mt-3.5 border-l-2 border-emerald-500 pl-3 py-0.5 text-xs text-muted leading-relaxed">
                <span className="font-semibold text-foreground">Conexão com o Brasil: </span>
                {i.eloBrasil}
              </div>
            </div>

            {/* RODAPÉ DO CARD */}
            <div className="mt-5 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-muted truncate max-w-[240px]">
                {i.fonteOficial}
              </span>
              <a
                href={i.urlOficial}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:underline dark:text-emerald-400"
              >
                <span>Documento Oficial Direto</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
