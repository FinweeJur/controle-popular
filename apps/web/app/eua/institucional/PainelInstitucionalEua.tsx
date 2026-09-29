"use client";

/**
 * @file apps/web/app/eua/institucional/PainelInstitucionalEua.tsx
 * @description Painel interativo com as 6 Qualidades para o acervo institucional dos EUA e guia FOIA.
 *
 * Papel no portal:
 * Permite ao cidadão consultar a estrutura governamental dos EUA:
 * 1. Cidades-Polo (FIPS Nova York e Washington D.C.).
 * 2. Congresso dos EUA (Senado e Câmara dos Representantes no Congress.gov).
 * 3. Judiciário Federal: Caso Brumadinho na Corte de Nova York (SDNY).
 * 4. Função Social da Terra: Terras Indígenas Federais (Bureau of Indian Affairs - BIA).
 * 5. Transparência Pública: Freedom of Information Act (FOIA - 5 U.S.C. 552).
 *
 * Fontes oficiais:
 * - NYC Open Data e Open Data DC.
 * - Congress.gov (U.S. Library of Congress).
 * - CourtListener (Free Law Project) / Docket SDNY Vale S.A.
 * - U.S. Bureau of Indian Affairs (BIA GIS).
 * - FOIA.gov (U.S. Department of Justice).
 *
 * Decisões técnicas e restrições:
 * - Cumpre a Regra das 6 Qualidades (AGENTS.md §8).
 * - Inclui guia didático passo a passo de como fazer um pedido de FOIA sem custos.
 * - Frases curtas de até 13 palavras nos textos de interface.
 * - Exportação CSV com BOM UTF-8 (\uFEFF) e separador ponto e vírgula (;).
 * - Layout de impressão para relatórios cívicos.
 */

import { useState, useMemo } from "react";
import {
  Landmark,
  Search,
  Download,
  Printer,
  ExternalLink,
  Filter,
  Scale,
  TreePine,
  HelpCircle,
  FileCheck2,
  Send,
  Building,
} from "lucide-react";
import BarraIdiomaTrilingue from "@/app/components/BarraIdiomaTrilingue";
import type { IdiomaExibicao } from "@/lib/internacional/idiomas-internacional";
import type { RegistroInstitucionalEua } from "../../../../../scripts/coletar-eua-acervo.mts";

interface PainelInstitucionalEuaProps {
  /** Lista de registros institucionais dos EUA. */
  institucional: RegistroInstitucionalEua[];
}

type ColunaOrdenacao = "nome" | "valor" | "frente" | "codigo";

function normalizarTexto(txt: string): string {
  return txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * Retorna classe de cor para o distintivo de esfera de governo.
 */
function obterEstiloEsfera(esfera: string): string {
  if (esfera === "Federal") {
    return "bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300";
  }
  if (esfera === "Municipal") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300";
  }
  return "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300";
}

export default function PainelInstitucionalEua({ institucional }: PainelInstitucionalEuaProps) {
  const [busca, setBusca] = useState("");
  const [frenteFiltro, setFrenteFiltro] = useState<string>("todos");
  const [esferaFiltro, setEsferaFiltro] = useState<string>("todos");
  const [colunaOrdenacao, setColunaOrdenacao] = useState<ColunaOrdenacao>("nome");
  const [ordemAsc, setOrdemAsc] = useState(true);
  const [idioma, setIdioma] = useState<IdiomaExibicao>("pt");
  const [mostrarGuiaFoia, setMostrarGuiaFoia] = useState(false);

  const frentesDisponiveis = useMemo(() => {
    const frentes = new Set(institucional.map((i) => i.frente));
    return ["todos", ...Array.from(frentes)];
  }, [institucional]);

  const esferasDisponiveis = useMemo(() => {
    const esferas = new Set(institucional.map((i) => i.esfera));
    return ["todos", ...Array.from(esferas)];
  }, [institucional]);

  // Filtragem e ordenação em tempo real (Qualidades 2 e 3)
  const institucionalProcessado = useMemo(() => {
    const termo = normalizarTexto(busca);

    return institucional
      .filter((item) => {
        if (frenteFiltro !== "todos" && item.frente !== frenteFiltro) {
          return false;
        }
        if (esferaFiltro !== "todos" && item.esfera !== esferaFiltro) {
          return false;
        }
        if (!termo) return true;

        const nome = normalizarTexto(item.nome);
        const frente = normalizarTexto(item.frente);
        const codigo = normalizarTexto(item.codigoOficial);
        const local = normalizarTexto(item.estadoOuLocal);
        const resumo = normalizarTexto(item.resumoCivico);
        const elo = normalizarTexto(item.eloBrasil);

        return (
          nome.includes(termo) ||
          frente.includes(termo) ||
          codigo.includes(termo) ||
          local.includes(termo) ||
          resumo.includes(termo) ||
          elo.includes(termo)
        );
      })
      .sort((a, b) => {
        let diff = 0;
        if (colunaOrdenacao === "nome") {
          diff = a.nome.localeCompare(b.nome);
        } else if (colunaOrdenacao === "valor") {
          diff = a.metricaPrincipalValor - b.metricaPrincipalValor;
        } else if (colunaOrdenacao === "frente") {
          diff = a.frente.localeCompare(b.frente);
        } else if (colunaOrdenacao === "codigo") {
          diff = a.codigoOficial.localeCompare(b.codigoOficial);
        }
        return ordemAsc ? diff : -diff;
      });
  }, [institucional, busca, frenteFiltro, esferaFiltro, colunaOrdenacao, ordemAsc]);

  /**
   * Exporta a lista filtrada em formato CSV compatível com Excel (BOM UTF-8).
   */
  function exportarCsv() {
    const cabecalho = [
      "Nome da Instituição ou Ato",
      "Frente Temática",
      "Código Oficial",
      "Esfera de Governo",
      "Localidade",
      "Ano de Referência",
      "Métrica Principal",
      "Valor",
      "Unidade",
      "Resumo Cívico",
      "Elo com o Brasil",
      "Fonte Oficial",
      "Link Oficial",
    ];

    const linhas = institucionalProcessado.map((i) => [
      `"${i.nome.replace(/"/g, '""')}"`,
      `"${i.frente}"`,
      `"${i.codigoOficial}"`,
      `"${i.esfera}"`,
      `"${i.estadoOuLocal}"`,
      `${i.anoReferencia}`,
      `"${i.metricaPrincipalRotulo.replace(/"/g, '""')}"`,
      `${i.metricaPrincipalValor}`,
      `"${i.unidadeMetrica}"`,
      `"${i.resumoCivico.replace(/"/g, '""')}"`,
      `"${i.eloBrasil.replace(/"/g, '""')}"`,
      `"${i.fonteOficial.replace(/"/g, '""')}"`,
      `"${i.urlOficial}"`,
    ]);

    const csvContent = "\uFEFF" + [cabecalho.join(";"), ...linhas.map((l) => l.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `institucional-eua-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function acionarImpressao() {
    window.print();
  }

  function alternarOrdenacao(coluna: ColunaOrdenacao) {
    if (colunaOrdenacao === coluna) {
      setOrdemAsc(!ordemAsc);
    } else {
      setColunaOrdenacao(coluna);
      setOrdemAsc(true);
    }
  }

  return (
    <div className="space-y-6">
      {/* BARRA TRILÍNGUE (PT / EN / ES + TTS + SEU NONÔ) */}
      <div className="print:hidden">
        <BarraIdiomaTrilingue
          idioma={idioma}
          aoTrocarIdioma={setIdioma}
          resumoTrilingue={{
            pt: "Instituições dos EUA: cidades FIPS, Congresso, corte de Nova York no caso Brumadinho e guia FOIA.",
            en: "US institutions: FIPS cities, Congress, NY court Brumadinho litigation, and FOIA guide.",
            es: "Instituciones de EE. UU.: ciudades FIPS, Congreso, corte de NY en Brumadinho y guía FOIA.",
          }}
          perguntaSeuNono={{
            pt: "Como um cidadão brasileiro pode fazer um pedido de FOIA ao governo dos EUA?",
            en: "How can a Brazilian citizen submit a FOIA request to the US government?",
            es: "¿Cómo puede un ciudadano brasileño hacer una solicitud FOIA al gobierno de EE. UU.?",
          }}
          paisDestaque="EUA"
        />
      </div>

      {/* GUIA DIDÁTICO INTERATIVO DE PEDIDO FOIA (LEI DE ACESSO À INFORMAÇÃO DOS EUA) */}
      <section
        aria-label="Guia prático FOIA"
        className="rounded-xl border border-sky-500/40 bg-sky-50/60 p-5 dark:bg-sky-950/30 print:border-gray-300"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white font-bold text-sm">
              FOIA
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-foreground">
                Guia Prático: Como pedir dados oficiais ao Governo dos EUA via FOIA
              </h2>
              <p className="text-xs text-muted">
                Qualquer pessoa no Brasil tem o direito legal de pedir documentos federais americanos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMostrarGuiaFoia(!mostrarGuiaFoia)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-600/30 bg-surface px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 dark:text-sky-300 dark:hover:bg-sky-900 transition print:hidden"
          >
            <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{mostrarGuiaFoia ? "Recolher Guia" : "Ver Passo a Passo"}</span>
          </button>
        </div>

        {mostrarGuiaFoia && (
          <div className="mt-4 grid gap-3 border-t border-sky-500/20 pt-4 text-xs text-muted sm:grid-cols-3">
            <div className="rounded-lg bg-surface p-3 border border-border/60">
              <span className="font-bold text-foreground">Passo 1: Identifique a Agência</span>
              <p className="mt-1">
                Descubra qual agência federal detém os dados (ex: SEC para balanços ou EPA para poluição).
              </p>
            </div>

            <div className="rounded-lg bg-surface p-3 border border-border/60">
              <span className="font-bold text-foreground">Passo 2: Acesse o Portal FOIA.gov</span>
              <p className="mt-1">
                Acesse foia.gov gratuitamente. Descreva com precisão o documento desejado sem jargões.
              </p>
            </div>

            <div className="rounded-lg bg-surface p-3 border border-border/60">
              <span className="font-bold text-foreground">Passo 3: Acompanhe o Prazo Legal</span>
              <p className="mt-1">
                A lei federal estipula 20 dias úteis para a primeira resposta oficial do órgão público.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* CONTROLES DE BUSCA, FILTROS E EXPORTAÇÃO */}
      <section
        aria-label="Filtros e exportação institucional"
        className="rounded-xl border border-border bg-surface p-4 shadow-sm print:hidden"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* CAMPO DE BUSCA */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar cidade FIPS, Congresso, tribunal SDNY, reservas BIA ou FOIA..."
              className="w-full rounded-lg border border-border bg-surface-elevated py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* BOTÕES DE EXPORTAÇÃO */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportarCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface hover:text-sky-600 transition"
              title="Baixar planilha CSV com BOM UTF-8"
            >
              <Download className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
              <span>Exportar CSV ({institucionalProcessado.length})</span>
            </button>
            <button
              type="button"
              onClick={acionarImpressao}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface hover:text-sky-600 transition"
              title="Imprimir relatório da página"
            >
              <Printer className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* FILTROS FACETADOS E ORDENAÇÃO */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border/60 pt-3 text-xs">
          {/* FRENTE INSTITUCIONAL */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
            <span className="font-medium text-muted">Frente:</span>
            <select
              value={frenteFiltro}
              onChange={(e) => setFrenteFiltro(e.target.value)}
              className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground focus:outline-none"
            >
              <option value="todos">Todas as frentes ({institucional.length})</option>
              {frentesDisponiveis
                .filter((f) => f !== "todos")
                .map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
            </select>
          </div>

          {/* ESFERA */}
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-muted">Esfera:</span>
            <select
              value={esferaFiltro}
              onChange={(e) => setEsferaFiltro(e.target.value)}
              className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground focus:outline-none"
            >
              <option value="todos">Todas as esferas</option>
              {esferasDisponiveis
                .filter((e) => e !== "todos")
                .map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
            </select>
          </div>

          {/* ORDENAÇÃO */}
          <div className="ml-auto flex items-center gap-2">
            <span className="font-medium text-muted">Ordenar:</span>
            <button
              type="button"
              onClick={() => alternarOrdenacao("nome")}
              className={`rounded px-2 py-1 font-semibold transition ${
                colunaOrdenacao === "nome"
                  ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                  : "bg-surface-elevated text-muted hover:text-foreground"
              }`}
            >
              Nome {colunaOrdenacao === "nome" && (ordemAsc ? "↑" : "↓")}
            </button>
            <button
              type="button"
              onClick={() => alternarOrdenacao("valor")}
              className={`rounded px-2 py-1 font-semibold transition ${
                colunaOrdenacao === "valor"
                  ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                  : "bg-surface-elevated text-muted hover:text-foreground"
              }`}
            >
              Métrica {colunaOrdenacao === "valor" && (ordemAsc ? "↑" : "↓")}
            </button>
            <button
              type="button"
              onClick={() => alternarOrdenacao("frente")}
              className={`rounded px-2 py-1 font-semibold transition ${
                colunaOrdenacao === "frente"
                  ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                  : "bg-surface-elevated text-muted hover:text-foreground"
              }`}
            >
              Frente {colunaOrdenacao === "frente" && (ordemAsc ? "↑" : "↓")}
            </button>
          </div>
        </div>
      </section>

      {/* CONTADOR */}
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          Exibindo <strong>{institucionalProcessado.length}</strong> de{" "}
          <strong>{institucional.length}</strong> entidades e atos institucionais.
        </span>
        {busca && (
          <button
            type="button"
            onClick={() => setBusca("")}
            className="text-sky-600 hover:underline dark:text-sky-400"
          >
            Limpar busca
          </button>
        )}
      </div>

      {/* CARDS RICOS INSTITUCIONAIS (6 QUALIDADES) */}
      <div className="space-y-4">
        {institucionalProcessado.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
            Nenhuma instituição localizada com os filtros selecionados.
          </div>
        ) : (
          institucionalProcessado.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:border-sky-500/50 print:border-gray-300 print:shadow-none"
            >
              {/* CABEÇALHO */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-surface-elevated px-2.5 py-0.5 text-xs font-semibold text-foreground border border-border/60">
                      {item.frente}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${obterEstiloEsfera(
                        item.esfera
                      )}`}
                    >
                      {item.esfera}
                    </span>
                    <span className="font-mono text-xs text-muted">
                      {item.codigoOficial}
                    </span>
                  </div>

                  <h2 className="mt-2 font-display text-lg font-bold text-foreground">
                    {item.nome}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    Jurisdição / Local: <strong>{item.estadoOuLocal}</strong> • Ano de
                    referência: <strong>{item.anoReferencia}</strong>
                  </p>
                </div>

                {/* MÉTRICA PRINCIPAL */}
                <div className="mt-2 rounded-xl bg-surface-elevated p-3 text-right border border-border/60 sm:mt-0 sm:min-w-[190px]">
                  <span className="block text-[11px] text-muted">
                    {item.metricaPrincipalRotulo}
                  </span>
                  <span className="font-mono text-2xl font-bold text-foreground">
                    {item.metricaPrincipalValor.toLocaleString("pt-BR")}
                  </span>
                  <span className="block text-xs font-medium text-sky-600 dark:text-sky-400">
                    {item.unidadeMetrica}
                  </span>
                </div>
              </div>

              {/* RESUMO CÍVICO E ELO COM O BRASIL */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-surface-elevated p-3 border border-border/50">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <FileCheck2 className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
                    <span>Papel Institucional e Governança</span>
                  </div>
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    {item.resumoCivico}
                  </p>
                </div>

                <div className="rounded-lg bg-sky-500/10 p-3 border border-sky-500/20">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-800 dark:text-sky-300">
                    <Scale className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Conexão Cívica com o Brasil</span>
                  </div>
                  <p className="mt-1 text-xs text-foreground leading-relaxed">
                    {item.eloBrasil}
                  </p>
                </div>
              </div>

              {/* RODAPÉ COM LINK OFICIAL VERIFICADO (QUALIDADE 1) */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3 text-xs">
                <span className="text-muted">
                  Fonte direta: <strong>{item.fonteOficial}</strong>
                </span>

                <a
                  href={item.urlOficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md bg-sky-50 px-3 py-1.5 font-semibold text-sky-700 hover:bg-sky-100 hover:text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 dark:hover:bg-sky-900 transition"
                  title="Abrir página oficial do órgão ou processo público"
                >
                  <span>Acessar Fonte Oficial</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
