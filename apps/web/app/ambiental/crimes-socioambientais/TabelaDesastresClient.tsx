"use client";

import { useState } from "react";
import { ItemDocumentoDesastre } from "@/lib/ambiental/biblioteca-desastres";
import BotaoAlertaContextual from "@/app/components/BotaoAlertaContextual";
import { Search, Download, FileText, ExternalLink, Filter, ShieldAlert } from "lucide-react";

interface Props {
  documentos: ItemDocumentoDesastre[];
  total_documentos: number;
  totais: {
    brumadinho_paraopeba: number;
    mariana_rio_doce: number;
    ufs: Record<string, number>;
  };
}

export default function TabelaDesastresClient({ documentos, total_documentos, totais }: Props) {
  const [busca, setBusca] = useState("");
  const [filtroDesastre, setFiltroDesastre] = useState<"todos" | "brumadinho" | "mariana">("todos");
  const [filtroUf, setFiltroUf] = useState("todas");

  const filtrados = documentos.filter((d) => {
    const matchBusca =
      d.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      d.orgao.toLowerCase().includes(busca.toLowerCase()) ||
      (d.resumo && d.resumo.toLowerCase().includes(busca.toLowerCase())) ||
      d.tags.some((t) => t.toLowerCase().includes(busca.toLowerCase()));

    const matchDesastre = filtroDesastre === "todos" || d.desastre === filtroDesastre;
    const matchUf = filtroUf === "todas" || d.uf === filtroUf;

    return matchBusca && matchDesastre && matchUf;
  });

  const exportarCsv = () => {
    const cabecalho = "ID;Desastre;Bacia;Título;Data;Tipo;Órgão;Esfera;UF;Tags;Resumo;URL Oficial\n";
    const linhas = filtrados
      .map(
        (d) =>
          `"${d.id}";"${d.desastre}";"${d.bacia}";"${d.titulo}";"${d.data ?? ""}";"${d.tipo}";"${d.orgao}";"${d.esfera}";"${d.uf}";"${d.tags.join(", ")}";"${d.resumo ?? ""}";"${d.url}"`
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + cabecalho + linhas], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `biblioteca-crimes-socioambientais.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* GRÁFICO SVG NATIVO: DISTRIBUIÇÃO DOCUMENTAL */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h3 className="font-display text-base font-bold text-foreground">
              Acervo Documental Unificado: Bacia do Paraopeba (Brumadinho) × Bacia do Rio Doce (Mariana)
            </h3>
            <p className="text-xs text-muted">
              {total_documentos} documentos oficiais mapeados: {totais.brumadinho_paraopeba} do Paraopeba (MG) e {totais.mariana_rio_doce} do Rio Doce (MG, ES e Extremo Sul da BA).
            </p>
          </div>
          <BotaoAlertaContextual
            tipo="resumo_pagina"
            titulo={`Biblioteca Unificada de Crimes Socioambientais: ${total_documentos} Laudos e Documentos Oficiais`}
            orgaoTerritorio="Bacias do Paraopeba e Rio Doce (MG, ES, BA)"
            identificador="ONSA / Controle Popular"
            link="https://controlepopular.com.br/ambiental/crimes-socioambientais"
            resumo="Catálogo de laudos de saúde, perícias ambientais e termos de ajustamento de conduta dos rompimentos de barragens."
            rotulo="Divulgar Acervo de Documentos"
          />
        </div>

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          {/* BARRA PROPORÇÃO POR DESASTRE */}
          <div>
            <span className="text-xs font-semibold text-muted">Distribuição por Desastre / Bacia:</span>
            <div className="mt-2 flex h-8 w-full overflow-hidden rounded-xl bg-surface-2">
              <div
                style={{ width: `${total_documentos > 0 ? (totais.brumadinho_paraopeba / total_documentos) * 100 : 0}%` }}
                className="flex items-center justify-center bg-amber-600 text-[11px] font-bold text-white"
                title={`${totais.brumadinho_paraopeba} documentos - Brumadinho (${total_documentos > 0 ? ((totais.brumadinho_paraopeba / total_documentos) * 100).toFixed(1) : 0}%)`}
              >
                Brumadinho ({totais.brumadinho_paraopeba} docs)
              </div>
              <div
                style={{ width: `${total_documentos > 0 ? (totais.mariana_rio_doce / total_documentos) * 100 : 0}%` }}
                className="flex items-center justify-center bg-cyan-700 text-[11px] font-bold text-white"
                title={`${totais.mariana_rio_doce} documentos - Mariana (${total_documentos > 0 ? ((totais.mariana_rio_doce / total_documentos) * 100).toFixed(1) : 0}%)`}
              >
                Mariana ({totais.mariana_rio_doce} docs)
              </div>
            </div>

            <div className="mt-3 flex justify-between text-xs text-muted">
              <span>🌊 <strong>Paraopeba:</strong> Laudos ATIs e Fiocruz</span>
              <span>🌊 <strong>Rio Doce:</strong> TTAC, IEMA-ES e MPF-BA</span>
            </div>
          </div>

          {/* DISTRIBUIÇÃO POR ESTADO */}
          <div>
            <span className="text-xs font-semibold text-muted">Cobertura Territorial:</span>
            <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs">
              <div className="rounded-xl border border-border bg-surface-2 p-2.5">
                <span className="font-bold text-foreground">Minas Gerais</span>
                <p className="mt-1 font-display text-base font-bold text-primary">{totais.ufs.MG}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface-2 p-2.5">
                <span className="font-bold text-foreground">Espírito Santo</span>
                <p className="mt-1 font-display text-base font-bold text-teal-600">{totais.ufs.ES}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface-2 p-2.5">
                <span className="font-bold text-foreground">Bahia</span>
                <p className="mt-1 font-display text-base font-bold text-amber-600">{totais.ufs.BA}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface-2 p-2.5">
                <span className="font-bold text-foreground">Nacional</span>
                <p className="mt-1 font-display text-base font-bold text-indigo-600">{totais.ufs.BR ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS E BUSCA */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Buscar por laudo, órgão, tema ou município (ex: Fiocruz, saúde, PTR, Linhares, Bahia)..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border bg-surface-2 p-0.5">
            <button
              onClick={() => setFiltroDesastre("todos")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                filtroDesastre === "todos" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              Todos ({documentos.length})
            </button>
            <button
              onClick={() => setFiltroDesastre("brumadinho")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                filtroDesastre === "brumadinho" ? "bg-amber-600 text-white" : "text-muted hover:text-foreground"
              }`}
            >
              Brumadinho
            </button>
            <button
              onClick={() => setFiltroDesastre("mariana")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                filtroDesastre === "mariana" ? "bg-cyan-700 text-white" : "text-muted hover:text-foreground"
              }`}
            >
              Mariana / Rio Doce
            </button>
          </div>

          <select
            value={filtroUf}
            onChange={(e) => setFiltroUf(e.target.value)}
            className="rounded-lg border border-border bg-surface py-2 px-3 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
          >
            <option value="todas">Todas as UFs</option>
            <option value="MG">Minas Gerais (MG)</option>
            <option value="ES">Espírito Santo (ES)</option>
            <option value="BA">Bahia (BA)</option>
            <option value="BR">Nacional (BR)</option>
          </select>

          <button
            onClick={exportarCsv}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Baixar Planilha ({filtrados.length})</span>
          </button>
        </div>
      </div>

      {/* LISTA DE DOCUMENTOS */}
      <div className="grid gap-4">
        {filtrados.map((doc) => (
          <article
            key={doc.id}
            className="rounded-2xl border border-border bg-surface p-5 shadow-sm hover:border-primary/50 transition-colors"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md px-2.5 py-0.5 text-xs font-bold ${
                    doc.desastre === "brumadinho"
                      ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300"
                      : "bg-cyan-100 text-cyan-900 dark:bg-cyan-950/60 dark:text-cyan-300"
                  }`}
                >
                  {doc.desastre === "brumadinho" ? "Brumadinho (Paraopeba)" : "Mariana (Rio Doce)"}
                </span>

                <span className="rounded bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted">
                  {doc.tipo}
                </span>

                <span className="text-xs text-muted">
                  UF: <strong>{doc.uf}</strong> {doc.data ? `• ${doc.data}` : ""}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-primary">{doc.orgao}</span>
                <BotaoAlertaContextual
                  tipo="resumo_pagina"
                  titulo={`${doc.orgao}: ${doc.titulo}`}
                  orgaoTerritorio={`${doc.desastre === "brumadinho" ? "Bacia do Paraopeba" : "Bacia do Rio Doce"} (${doc.uf})`}
                  identificador={`${doc.tipo} — ${doc.orgao}`}
                  link={doc.url}
                  resumo={doc.resumo || undefined}
                  variante="icone"
                />
              </div>
            </div>

            <h3 className="mt-3 font-display text-base font-bold text-foreground">
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary hover:underline inline-flex items-center gap-1.5"
              >
                <span>{doc.titulo}</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted shrink-0" />
              </a>
            </h3>

            {doc.resumo ? (
              <p className="mt-2 text-xs text-muted leading-relaxed">
                {doc.resumo}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-1.5">
              {doc.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-surface-2 border border-border px-2 py-0.5 text-[11px] text-muted"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
