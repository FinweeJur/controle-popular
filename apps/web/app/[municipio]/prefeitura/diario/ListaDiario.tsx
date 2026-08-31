"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TabelaEstatica, { type ColunaTabela } from "@/app/[municipio]/components/TabelaEstatica";
import ObjetoExpansivel from "@/app/[municipio]/components/ObjetoExpansivel";
import { TagChip } from "@/app/components/TagChip";
import { formatDateBR } from "@/lib/betim/format";
import { ROTULOS_TIPO, TIPOS_ATO, type TipoAto } from "@/lib/diario/classificarAto";
import { baixarCsv, type ColunaCsv } from "@/lib/tabela/csv";

export interface AtoDiarioRow {
  id: string;
  data_publicacao: string;
  edicao: string | null;
  pagina: string | null;
  tipo: TipoAto;
  numero_ato: string | null;
  orgao: string | null;
  ementa: string | null;
  link_fonte: string;
  processo_ref?: string | null;
  valor?: number | null;
  cnpj_mascarado?: string | null;
  [key: string]: unknown;
}

const COLUNAS_CSV_DIARIO: ColunaCsv<AtoDiarioRow>[] = [
  { chave: "data_publicacao", rotulo: "Data", formatar: (d) => formatDateBR(d as string) },
  { chave: "edicao", rotulo: "Edição" },
  { chave: "tipo", rotulo: "Tipo", formatar: (t) => ROTULOS_TIPO[t as TipoAto] ?? t },
  { chave: "numero_ato", rotulo: "Número do Ato" },
  { chave: "orgao", rotulo: "Órgão" },
  { chave: "ementa", rotulo: "Ementa / Objeto" },
  { chave: "processo_ref", rotulo: "Processo Ref" },
  {
    chave: "valor",
    rotulo: "Valor (R$)",
    formatar: (v) => (v != null ? v.toString().replace(".", ",") : ""),
  },
  { chave: "cnpj_mascarado", rotulo: "CNPJ" },
  { chave: "link_fonte", rotulo: "Link Oficial" },
];

export default function ListaDiario({
  base,
  municipioSlug,
}: {
  base: string;
  municipioSlug: string;
}) {
  const [tipoAtivo, setTipoAtivo] = useState<string>("todos");
  const [orgao, setOrgao] = useState<string>("");
  const [ano, setAno] = useState<string>("");
  const [linhasCarregadas, setLinhasCarregadas] = useState<AtoDiarioRow[]>([]);
  const primeiraRenderizacao = useRef(true);

  // Sincroniza estado inicial com a URL após montagem no cliente
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const tipoUrl = sp.get("tipo");
    if (tipoUrl) setTipoAtivo(tipoUrl);
    const orgaoUrl = sp.get("orgao");
    if (orgaoUrl) setOrgao(orgaoUrl);
    const anoUrl = sp.get("ano");
    if (anoUrl) setAno(anoUrl);
  }, []);

  // Atualiza query string na barra de endereço ao alterar filtros
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const sp = new URLSearchParams(window.location.search);
    if (tipoAtivo && tipoAtivo !== "todos") sp.set("tipo", tipoAtivo);
    else sp.delete("tipo");
    if (orgao) sp.set("orgao", orgao);
    else sp.delete("orgao");
    if (ano) sp.set("ano", ano);
    else sp.delete("ano");

    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [tipoAtivo, orgao, ano]);

  const filtrar = useCallback(
    (ato: AtoDiarioRow) => {
      if (tipoAtivo !== "todos" && ato.tipo !== tipoAtivo) return false;
      if (orgao && ato.orgao !== orgao) return false;
      if (ano && !ato.data_publicacao?.startsWith(ano)) return false;
      return true;
    },
    [tipoAtivo, orgao, ano]
  );

  const colunas: ColunaTabela<AtoDiarioRow>[] = [
    {
      chave: "data_publicacao",
      rotulo: "Data / Edição",
      tipoOrdenacao: "data",
      ordenavel: true,
      formatar: (a) => (
        <div className="flex flex-col gap-0.5 whitespace-nowrap">
          <span className="font-medium text-text">{formatDateBR(a.data_publicacao)}</span>
          {a.edicao && <span className="text-xs text-text-soft">Edição nº {a.edicao}</span>}
        </div>
      ),
    },
    {
      chave: "tipo",
      rotulo: "Tipo",
      ordenavel: true,
      formatar: (a) => (
        <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {ROTULOS_TIPO[a.tipo] ?? a.tipo}
        </span>
      ),
    },
    {
      chave: "ementa",
      rotulo: "Ementa / Objeto",
      ordenavel: true,
      tipoOrdenacao: "texto",
      formatar: (a) => (
        <div className="flex flex-col gap-1">
          {a.numero_ato && (
            <span className="font-semibold text-xs text-text">
              {a.numero_ato}
            </span>
          )}
          <ObjetoExpansivel texto={a.ementa ?? "—"} />
          {a.link_fonte && (
            <a
              href={a.link_fonte}
              target="_blank"
              rel="noopener noreferrer"
              className="w-fit text-xs font-medium text-primary underline underline-offset-2 hover:text-primary-hover"
            >
              Abrir ato oficial no diário ↗
            </a>
          )}
        </div>
      ),
    },
    {
      chave: "orgao",
      rotulo: "Órgão",
      ordenavel: true,
      formatar: (a) => a.orgao ?? "—",
    },
  ];

  // Contagem dinâmica por tipo baseada em todas as linhas carregadas
  const contagensPorTipo = useMemo(() => {
    const counts: Record<string, number> = { todos: linhasCarregadas.length };
    for (const row of linhasCarregadas) {
      counts[row.tipo] = (counts[row.tipo] ?? 0) + 1;
    }
    return counts;
  }, [linhasCarregadas]);

  const linhasFiltradas = useMemo(() => {
    return linhasCarregadas.filter(filtrar);
  }, [linhasCarregadas, filtrar]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-soft">
          Exibindo{" "}
          <strong className="text-text font-semibold">
            {linhasFiltradas.length.toLocaleString("pt-BR")}
          </strong>{" "}
          de {linhasCarregadas.length.toLocaleString("pt-BR")} atos indexados
        </p>
        <button
          type="button"
          onClick={() => {
            baixarCsv(COLUNAS_CSV_DIARIO, linhasFiltradas, `diario-oficial-${municipioSlug}.csv`);
          }}
          disabled={linhasFiltradas.length === 0}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-text shadow-sm hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          ↓ Exportar CSV ({linhasFiltradas.length.toLocaleString("pt-BR")})
        </button>
      </div>

      <TabelaEstatica<AtoDiarioRow>
        base={base}
        colunas={colunas}
        camposBusca={["ementa", "numero_ato", "orgao"]}
        vazio="Nenhum ato oficial publicado no momento."
        filtrar={filtrar}
        controles={({ linhas }) => {
          if (linhas.length !== linhasCarregadas.length) {
            setLinhasCarregadas(linhas);
          }
          const orgaosUnicos = [
            ...new Set(linhas.map((l) => l.orgao).filter(Boolean) as string[]),
          ].sort();
          const anosUnicos = [
            ...new Set(
              linhas
                .map((l) => (l.data_publicacao ? l.data_publicacao.slice(0, 4) : null))
                .filter(Boolean) as string[]
            ),
          ].sort((a, b) => b.localeCompare(a));

          return (
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
              {/* TagChips por Tipo */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs font-medium text-text-soft">Tipo de ato:</span>
                <TagChip
                  label="Todos"
                  ativo={tipoAtivo === "todos"}
                  contador={contagensPorTipo["todos"]}
                  onClick={() => setTipoAtivo("todos")}
                />
                {TIPOS_ATO.map((t) => (
                  <TagChip
                    key={t}
                    label={ROTULOS_TIPO[t]}
                    ativo={tipoAtivo === t}
                    contador={contagensPorTipo[t] ?? 0}
                    onClick={() => setTipoAtivo(t)}
                  />
                ))}
              </div>

              {/* Filtros Estruturados (Órgão, Ano) */}
              <div className="flex flex-wrap items-end gap-3 border-t border-border pt-3">
                <div className="flex flex-col">
                  <label htmlFor="f-ano" className="mb-1 text-xs font-medium text-text-soft">
                    Ano
                  </label>
                  <select
                    id="f-ano"
                    value={ano}
                    onChange={(e) => setAno(e.target.value)}
                    className="w-36 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Todos os anos</option>
                    {anosUnicos.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label htmlFor="f-orgao" className="mb-1 text-xs font-medium text-text-soft">
                    Órgão publicador
                  </label>
                  <select
                    id="f-orgao"
                    value={orgao}
                    onChange={(e) => setOrgao(e.target.value)}
                    className="w-64 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Todos os órgãos</option>
                    {orgaosUnicos.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>

                {(tipoAtivo !== "todos" || orgao || ano) && (
                  <button
                    type="button"
                    onClick={() => {
                      setTipoAtivo("todos");
                      setOrgao("");
                      setAno("");
                    }}
                    className="pb-2 text-sm text-text-soft underline hover:text-primary cursor-pointer"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
