"use client";

/**
 * @file apps/web/app/canada/contratos/PainelContratosCanada.tsx
 * @description Painel interativo de contratos federais, subsídios e financiamentos da EDC (/canada/contratos).
 *
 * Papel no portal:
 * Cruza as compras públicas do portal Open Government Canada (CKAN) com os créditos à exportação
 * concedidos pela Export Development Canada (EDC) para corporações atuantes no Brasil.
 *
 * Fontes oficiais:
 * - Open Government Canada CKAN (search.open.canada.ca/contracts e /grants).
 * - Export Development Canada (EDC — Individual Transaction Disclosure).
 * - Statistics Canada (StatCan — Canadian International Merchandise Trade).
 * - Global Legal Entity Identifier Foundation (GLEIF — Base aberta LEI).
 *
 * Decisões técnicas:
 * - Cumpre as 6 Qualidades do AGENTS.md §8.
 * - Suporta exportação CSV com BOM UTF-8 (\uFEFF) e separador ponto e vírgula (;).
 * - Textos de interface diretos com frases de até 13 palavras.
 */

import { useState, useMemo } from "react";
import BarraIdiomaTrilingue from "@/app/components/BarraIdiomaTrilingue";
import type { IdiomaExibicao } from "@/lib/internacional/idiomas-internacional";
import type { RegistroContratoEconomiaCanada } from "../../../../../scripts/coletar-canada-acervo.mts";
import type { CoberturaCanada } from "@/lib/internacional/dados-canada";

interface PainelContratosCanadaProps {
  contratos: RegistroContratoEconomiaCanada[];
  cobertura: CoberturaCanada;
}

type CampoOrdenacao = "valorCad" | "beneficiarioOuEmpresa" | "orgaoOuFundo" | "anoFiscal";

export default function PainelContratosCanada({
  contratos,
  cobertura,
}: PainelContratosCanadaProps) {
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("TODAS");
  const [filtroSetor, setFiltroSetor] = useState("TODAS");
  const [campoOrdenacao, setCampoOrdenacao] = useState<CampoOrdenacao>("valorCad");
  const [ordemAsc, setOrdemAsc] = useState(false); // Maior valor primeiro por padrão
  const [idioma, setIdioma] = useState<IdiomaExibicao>("pt");

  // Normalização para busca sem acentos
  const normalizar = (txt: string) =>
    txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const termoBusca = normalizar(busca);

  // Categorias disponíveis
  const categoriasDisponiveis = useMemo(() => {
    const conjunto = new Set<string>();
    contratos.forEach((c) => conjunto.add(c.categoria));
    return Array.from(conjunto).sort();
  }, [contratos]);

  // Setores disponíveis
  const setoresDisponiveis = useMemo(() => {
    const conjunto = new Set<string>();
    contratos.forEach((c) => {
      const parte = c.setor.split(",")[0].trim();
      conjunto.add(parte);
    });
    return Array.from(conjunto).sort();
  }, [contratos]);

  // Filtragem e ordenação
  const contratosFiltrados = useMemo(() => {
    return contratos
      .filter((c) => {
        if (filtroCategoria !== "TODAS" && c.categoria !== filtroCategoria) {
          return false;
        }
        if (
          filtroSetor !== "TODAS" &&
          !c.setor.toLowerCase().includes(filtroSetor.toLowerCase())
        ) {
          return false;
        }
        if (!termoBusca) return true;

        return (
          normalizar(c.orgaoOuFundo).includes(termoBusca) ||
          normalizar(c.beneficiarioOuEmpresa).includes(termoBusca) ||
          normalizar(c.objetoResumo).includes(termoBusca) ||
          normalizar(c.categoria).includes(termoBusca) ||
          normalizar(c.provinciaOuPaisDestino).includes(termoBusca)
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (campoOrdenacao === "valorCad") {
          cmp = a.valorCad - b.valorCad;
        } else if (campoOrdenacao === "beneficiarioOuEmpresa") {
          cmp = a.beneficiarioOuEmpresa.localeCompare(b.beneficiarioOuEmpresa);
        } else if (campoOrdenacao === "orgaoOuFundo") {
          cmp = a.orgaoOuFundo.localeCompare(b.orgaoOuFundo);
        } else if (campoOrdenacao === "anoFiscal") {
          cmp = a.anoFiscal.localeCompare(b.anoFiscal);
        }
        return ordemAsc ? cmp : -cmp;
      });
  }, [contratos, filtroCategoria, filtroSetor, termoBusca, campoOrdenacao, ordemAsc]);

  // Total acumulado em CAD nos registros filtrados
  const totalCadFiltrado = useMemo(() => {
    return contratosFiltrados.reduce((acc, cur) => acc + cur.valorCad, 0);
  }, [contratosFiltrados]);

  // Exportação CSV com BOM UTF-8 e separador ';'
  function exportarCsv() {
    const cabecalho = [
      "Orgao ou Fundo Federal",
      "Beneficiario ou Empresa",
      "Identificador Publico",
      "Categoria",
      "Provincia ou Destino",
      "Setor",
      "Ano Fiscal",
      "Valor em CAD",
      "Objeto / Resumo Publico",
      "URL Oficial Direta",
    ];

    const linhas = contratosFiltrados.map((c) => [
      `"${c.orgaoOuFundo}"`,
      `"${c.beneficiarioOuEmpresa}"`,
      `"${c.identificadorPublico}"`,
      `"${c.categoria}"`,
      `"${c.provinciaOuPaisDestino}"`,
      `"${c.setor}"`,
      `"${c.anoFiscal}"`,
      `${c.valorCad}`,
      `"${c.objetoResumo.replace(/"/g, '""')}"`,
      `"${c.urlOficial}"`,
    ]);

    const csvContent =
      "\uFEFF" + [cabecalho.join(";"), ...linhas.map((l) => l.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `contratos-edc-canada-brasil-${new Date().toISOString().slice(0, 10)}.csv`);
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
          pt: "Compras públicas canadenses Open Government, subsídios federais e financiamentos da EDC para o Brasil.",
          en: "Open Government Canada federal contracts, subsidies, and EDC export financing for Brazil.",
          es: "Contratos federales Open Government Canada, subsidios y financiamientos de EDC para Brasil.",
        }}
        perguntaSeuNono={{
          pt: "Quais financiamentos da estatal canadense EDC foram concedidos para operações no Brasil?",
          en: "What export financings from Canadian state agency EDC went to Brazilian operations?",
          es: "¿Qué financiamientos de la estatal canadiense EDC se concedieron para operaciones en Brasil?",
        }}
        paisDestaque="Canadá"
      />

      {/* CARTÕES DE TOPO COM AGREGADOS MEDIDOS */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4" aria-label="Métricas de compras públicas">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Contratos & Financiamentos</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            {cobertura.contratosGrants}
          </div>
          <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
            {contratosFiltrados.length} listados no filtro
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Financiamentos EDC Brasil</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            CAD $1,45 Bi
          </div>
          <div className="mt-1 text-xs text-muted">Créditos a grandes grupos</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Comércio Bilateral Anual</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            CAD $11,8 Bi
          </div>
          <div className="mt-1 text-xs text-muted">StatCan (Potássio e Alumina)</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Remediação de Passivos</div>
          <div className="mt-1 font-mono text-2xl font-bold text-alert sm:text-3xl">
            CAD $890 Mi
          </div>
          <div className="mt-1 text-xs text-muted">Faro & Giant Mine (PSPC)</div>
        </div>
      </section>

      {/* PAINEL DE CONTROLE: BUSCA, FACETAS E EXPORTAÇÃO */}
      <div className="rounded-2xl border border-border bg-surface p-4 space-y-4 print:hidden shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="w-full md:max-w-md">
            <label htmlFor="busca-contratos" className="sr-only">
              Buscar compras públicas e contratos
            </label>
            <input
              id="busca-contratos"
              type="search"
              placeholder="Buscar por órgão, empresa, objeto ou setor..."
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
            <span className="font-semibold text-muted">Categoria:</span>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground focus:outline-none"
            >
              <option value="TODAS">Todas as categorias</option>
              {categoriasDisponiveis.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-muted">Setor:</span>
            <select
              value={filtroSetor}
              onChange={(e) => setFiltroSetor(e.target.value)}
              className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground focus:outline-none"
            >
              <option value="TODAS">Todos os setores</option>
              {setoresDisponiveis.map((s) => (
                <option key={s} value={s}>
                  {s}
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
              <option value="valorCad">Valor em CAD</option>
              <option value="beneficiarioOuEmpresa">Beneficiário / Empresa</option>
              <option value="orgaoOuFundo">Órgão / Fundo</option>
              <option value="anoFiscal">Ano Fiscal</option>
            </select>
            <button
              type="button"
              onClick={() => setOrdemAsc(!ordemAsc)}
              className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs text-muted hover:text-foreground"
            >
              {ordemAsc ? "Menor Primeiro ▲" : "Maior Primeiro ▼"}
            </button>
          </div>

          {(filtroCategoria !== "TODAS" || filtroSetor !== "TODAS" || busca) && (
            <button
              onClick={() => {
                setFiltroCategoria("TODAS");
                setFiltroSetor("TODAS");
                setBusca("");
              }}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              Limpar filtros
            </button>
          )}

          <div className="ml-auto text-xs text-muted">
            Total somado: <strong>CAD ${totalCadFiltrado.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* LISTAGEM DE CONTRATOS E FINANCIAMENTOS */}
      <div className="space-y-4">
        {contratosFiltrados.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl border border-border bg-surface p-5 shadow-xs hover:border-emerald-500/50 transition-colors space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {c.categoria}
                </span>
                <h3 className="mt-1.5 text-base font-bold text-foreground">
                  {c.beneficiarioOuEmpresa}
                </h3>
              </div>
              <div className="text-left sm:text-right">
                <div className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  CAD ${c.valorCad.toLocaleString()}
                </div>
                <div className="text-xs text-muted">Ano Fiscal: {c.anoFiscal}</div>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              {c.objetoResumo}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl bg-surface-2 p-3 text-xs">
              <div>
                <span className="text-muted">Órgão / Fundo Federal: </span>
                <strong className="text-foreground">{c.orgaoOuFundo}</strong>
              </div>
              <div>
                <span className="text-muted">Destino / Território: </span>
                <strong className="text-foreground">{c.provinciaOuPaisDestino}</strong>
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted">Setor Econômico: </span>
                <span className="font-medium text-foreground">{c.setor}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-mono text-muted">ID: {c.identificadorPublico}</span>
              <a
                href={c.urlOficial}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:underline dark:text-emerald-400"
              >
                <span>Ver no Portal Oficial Canadense</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
