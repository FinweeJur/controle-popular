"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatCurrencyCompactaBR, formatNumberBR } from "@/lib/betim/format";
import { semAcento } from "@/lib/busca/normalizar";
import { TagChip } from "@/app/components/TagChip";
import { ROTULOS_TIPO, TIPOS_ATO, type TipoAto } from "@/lib/diario/classificarAto";

export interface AtoDiarioExibicao {
  id: string;
  dataPublicacao: string; // AAAA-MM-DD
  numeroEdicao: string;
  orgao: string;
  tipo: TipoAto;
  titulo: string;
  numeroProcesso?: string | null;
  numeroAto?: string | null;
  cnpj?: string | null;
  nomeCredor?: string | null;
  valor?: number | null;
  objeto?: string | null;
  linkOriginal?: string | null;
}

type Ordem = "data-desc" | "data-asc" | "valor-desc" | "titulo";

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function paraCsv(itens: readonly AtoDiarioExibicao[]): string {
  const BOM = "\uFEFF";
  const cabecalho = [
    "data_publicacao",
    "numero_edicao",
    "orgao",
    "tipo",
    "titulo",
    "numero_processo",
    "numero_ato",
    "cnpj_credor",
    "nome_credor",
    "valor",
    "objeto",
    "link_original",
  ].join(";");

  const corpo = itens.map((a) =>
    [
      a.dataPublicacao,
      a.numeroEdicao,
      a.orgao,
      a.tipo,
      a.titulo,
      a.numeroProcesso ?? "",
      a.numeroAto ?? "",
      a.cnpj ?? "",
      a.nomeCredor ?? "",
      a.valor ?? "",
      a.objeto ?? "",
      a.linkOriginal ?? "",
    ]
      .map(csvEscape)
      .join(";")
  );

  return BOM + [cabecalho, ...corpo].join("\r\n") + "\r\n";
}

function baixarCsv(conteudo: string, nome: string) {
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function PainelDiario({
  atos,
  municipioSlug,
  nomeMunicipio,
}: {
  atos: readonly AtoDiarioExibicao[];
  municipioSlug: string;
  nomeMunicipio: string;
}) {
  const [busca, setBusca] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [anoFiltro, setAnoFiltro] = useState<string>("todos");
  const [ordem, setOrdem] = useState<Ordem>("data-desc");

  // Anos disponíveis
  const anosDisponiveis = useMemo(() => {
    const anos = new Set<string>();
    for (const a of atos) {
      if (a.dataPublicacao && a.dataPublicacao.length >= 4) {
        anos.add(a.dataPublicacao.slice(0, 4));
      }
    }
    return Array.from(anos).sort().reverse();
  }, [atos]);

  // Contagem de atos por tipo para chips
  const contagemPorTipo = useMemo(() => {
    const contagens: Record<string, number> = { todos: atos.length };
    for (const a of atos) {
      contagens[a.tipo] = (contagens[a.tipo] ?? 0) + 1;
    }
    return contagens;
  }, [atos]);

  // Filtragem e ordenação
  const filtrados = useMemo(() => {
    const termo = semAcento(busca.trim());

    return atos
      .filter((a) => {
        if (tipoFiltro !== "todos" && a.tipo !== tipoFiltro) return false;
        if (anoFiltro !== "todos" && !a.dataPublicacao.startsWith(anoFiltro)) return false;
        if (!termo) return true;

        return (
          semAcento(a.titulo).includes(termo) ||
          semAcento(a.orgao).includes(termo) ||
          (a.objeto && semAcento(a.objeto).includes(termo)) ||
          (a.numeroProcesso && semAcento(a.numeroProcesso).includes(termo)) ||
          (a.numeroAto && semAcento(a.numeroAto).includes(termo)) ||
          (a.nomeCredor && semAcento(a.nomeCredor).includes(termo)) ||
          (a.cnpj && a.cnpj.includes(termo))
        );
      })
      .sort((a, b) => {
        if (ordem === "data-desc") {
          return b.dataPublicacao.localeCompare(a.dataPublicacao);
        }
        if (ordem === "data-asc") {
          return a.dataPublicacao.localeCompare(b.dataPublicacao);
        }
        if (ordem === "valor-desc") {
          return (b.valor ?? 0) - (a.valor ?? 0);
        }
        return a.titulo.localeCompare(b.titulo, "pt");
      });
  }, [atos, busca, tipoFiltro, anoFiltro, ordem]);

  function exportar() {
    const hoje = new Date().toISOString().slice(0, 10);
    baixarCsv(paraCsv(filtrados), `diario-oficial-${municipioSlug}-${hoje}.csv`);
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Controles de Busca e Filtros */}
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <label
              htmlFor="busca-diario"
              className="block text-xs font-semibold text-text-soft"
            >
              Buscar matérias, processos, empresas ou objetos
            </label>
            <input
              id="busca-diario"
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Ex.: merenda escolar, pavimentação, Pregão 015/2026, 00.000.000/0001-91..."
              className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {anosDisponiveis.length > 1 && (
              <div>
                <label
                  htmlFor="filtro-ano"
                  className="block text-xs font-semibold text-text-soft"
                >
                  Ano
                </label>
                <select
                  id="filtro-ano"
                  value={anoFiltro}
                  onChange={(e) => setAnoFiltro(e.target.value)}
                  className="mt-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                >
                  <option value="todos">Todos os anos</option>
                  {anosDisponiveis.map((ano) => (
                    <option key={ano} value={ano}>
                      {ano}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label
                htmlFor="filtro-ordem-diario"
                className="block text-xs font-semibold text-text-soft"
              >
                Ordenar por
              </label>
              <select
                id="filtro-ordem-diario"
                value={ordem}
                onChange={(e) => setOrdem(e.target.value as Ordem)}
                className="mt-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
              >
                <option value="data-desc">Mais recentes primeiro</option>
                <option value="data-asc">Mais antigos primeiro</option>
                <option value="valor-desc">Maior valor ($)</option>
                <option value="titulo">Título (A-Z)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={exportar}
                className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm font-medium text-text transition-colors hover:border-primary hover:text-primary"
              >
                Baixar CSV ↓
              </button>
            </div>
          </div>
        </div>

        {/* Chips de Tipos de Atos */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
          <span className="mr-1 text-xs text-text-soft">Tipo de ato:</span>
          <TagChip
            label="Todos os tipos"
            contador={contagemPorTipo.todos}
            ativo={tipoFiltro === "todos"}
            onClick={() => setTipoFiltro("todos")}
          />
          {TIPOS_ATO.map((tipo) => {
            const qtd = contagemPorTipo[tipo] ?? 0;
            if (qtd === 0) return null;
            return (
              <TagChip
                key={tipo}
                label={ROTULOS_TIPO[tipo]}
                contador={qtd}
                ativo={tipoFiltro === tipo}
                onClick={() => setTipoFiltro(tipo)}
              />
            );
          })}
        </div>
      </div>

      {/* Listagem de Atos */}
      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-soft">
            Exibindo <strong>{formatNumberBR(filtrados.length)}</strong> de{" "}
            {formatNumberBR(atos.length)} matérias oficiais.
          </p>
        </div>

        {filtrados.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-center text-sm text-text-soft">
            Nenhuma matéria oficial encontrada com os filtros selecionados.
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {filtrados.map((ato) => {
              const dataFmt = ato.dataPublicacao
                ? new Intl.DateTimeFormat("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  }).format(new Date(ato.dataPublicacao + "T12:00:00Z"))
                : "Sem data";

              return (
                <article
                  key={ato.id}
                  className="rounded-2xl border border-border bg-surface p-4 sm:p-5 transition-shadow hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-semibold text-text">
                        {ROTULOS_TIPO[ato.tipo]}
                      </span>
                      <span className="text-xs text-text-soft">
                        Edição nº {ato.numeroEdicao} · {dataFmt}
                      </span>
                    </div>

                    {ato.orgao && (
                      <span className="text-xs font-medium text-text-soft">
                        {ato.orgao}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-2 text-sm font-semibold text-text sm:text-base leading-snug">
                    {ato.titulo}
                  </h3>

                  {ato.objeto && (
                    <p className="mt-2 text-xs sm:text-sm text-text-soft line-clamp-3">
                      <strong>Objeto:</strong> {ato.objeto}
                    </p>
                  )}

                  {/* Metadados Estruturados */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-2.5 text-xs">
                    {ato.valor != null && ato.valor > 0 && (
                      <div>
                        <span className="text-text-soft">Valor: </span>
                        <strong className="font-tabular text-primary">
                          R$ {formatCurrencyCompactaBR(ato.valor)}
                        </strong>
                      </div>
                    )}

                    {ato.numeroProcesso && (
                      <div>
                        <span className="text-text-soft">Proc.: </span>
                        <strong className="font-tabular text-text">
                          {ato.numeroProcesso}
                        </strong>
                      </div>
                    )}

                    {ato.numeroAto && (
                      <div>
                        <span className="text-text-soft">Nº Ato: </span>
                        <strong className="font-tabular text-text">{ato.numeroAto}</strong>
                      </div>
                    )}

                    {ato.cnpj && (
                      <div>
                        <span className="text-text-soft">CNPJ: </span>
                        <span className="font-mono text-text">{ato.cnpj}</span>
                      </div>
                    )}

                    {ato.nomeCredor && (
                      <div>
                        <span className="text-text-soft">Credor: </span>
                        <span className="text-text">{ato.nomeCredor}</span>
                      </div>
                    )}
                  </div>

                  {/* Links de Contexto / Ação */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border/40 pt-2 text-xs">
                    {ato.tipo === "contrato" && (
                      <Link
                        href={`/${municipioSlug}/prefeitura/contratos`}
                        className="font-medium text-accent hover:underline"
                      >
                        Ver página de contratos →
                      </Link>
                    )}

                    {ato.tipo === "edital" && (
                      <Link
                        href={`/${municipioSlug}/prefeitura/licitacoes`}
                        className="font-medium text-accent hover:underline"
                      >
                        Ver página de licitações →
                      </Link>
                    )}

                    {ato.tipo === "convenio" && (
                      <Link
                        href={`/convenios`}
                        className="font-medium text-accent hover:underline"
                      >
                        Ver painel de convênios →
                      </Link>
                    )}

                    {ato.linkOriginal && (
                      <a
                        href={ato.linkOriginal}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-text-soft hover:text-text hover:underline"
                      >
                        Ato original na fonte ↗
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
