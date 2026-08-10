"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TabelaEstatica, { type ColunaTabela } from "@/app/[municipio]/components/TabelaEstatica";
import ObjetoExpansivel from "@/app/[municipio]/components/ObjetoExpansivel";
import type { LicitacaoRow } from "@/lib/betim/licitacoes";
import { formatCurrencyBRL, formatDateBR } from "@/lib/betim/format";

/**
 * Tabela de `/[municipio]/prefeitura/licitacoes` — mesmo mecanismo de
 * `camara/proposicoes` (ver o porquê em `dados/[arquivo]/route.ts`), com os
 * três filtros originais (ano, situação, modalidade) + busca.
 *
 * `situacoesDisponiveis`/`modalidadesDisponiveis` chegam por prop, vindas de
 * uma consulta pequena no servidor (`getSituacoesLicitacoes`/
 * `getModalidadesLicitacoes`) — mesma ideia de `situacoesDisponiveis` em
 * `camara/proposicoes/ListaProposicoes.tsx`.
 */

type LinhaLicitacao = LicitacaoRow & Record<string, unknown>;

const COLUNAS: ColunaTabela<LinhaLicitacao>[] = [
  { chave: "modalidade_nome", rotulo: "Modalidade", formatar: (l) => l.modalidade_nome ?? "—" },
  {
    chave: "orgao_nome",
    rotulo: "Órgão",
    formatar: (l) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-text">{l.orgao_nome ?? "—"}</span>
        {l.unidade_nome && <span className="text-xs text-text-soft">{l.unidade_nome}</span>}
      </div>
    ),
  },
  {
    chave: "objeto",
    rotulo: "Objeto",
    formatar: (l) => (
      <div className="flex flex-col gap-1">
        <ObjetoExpansivel texto={l.objeto} />
        {l.link_sistema_origem && (
          <a
            href={l.link_sistema_origem}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-accent hover:underline"
          >
            Ver no sistema de origem ↗
          </a>
        )}
      </div>
    ),
  },
  {
    chave: "valor_estimado",
    rotulo: "Valor estimado",
    numerica: true,
    formatar: (l) => (
      <div className="flex flex-col items-end gap-0.5">
        <span className="font-semibold text-text">
          {l.valor_estimado != null ? formatCurrencyBRL(l.valor_estimado) : "—"}
        </span>
        {l.valor_homologado != null && (
          <span className="text-xs text-text-soft">homologado: {formatCurrencyBRL(l.valor_homologado)}</span>
        )}
      </div>
    ),
  },
  { chave: "situacao", rotulo: "Situação", formatar: (l) => l.situacao ?? "—" },
  {
    chave: "data_publicacao_pncp",
    rotulo: "Publicação",
    formatar: (l) => formatDateBR(l.data_publicacao_pncp),
  },
];

export interface ListaLicitacoesProps {
  base: string;
  situacoesDisponiveis: string[];
  modalidadesDisponiveis: string[];
}

export default function ListaLicitacoes({ base, situacoesDisponiveis, modalidadesDisponiveis }: ListaLicitacoesProps) {
  const [ano, setAno] = useState("");
  const [situacao, setSituacao] = useState("");
  const [modalidade, setModalidade] = useState("");
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setAno(sp.get("ano") ?? "");
    setSituacao(sp.get("situacao") ?? "");
    setModalidade(sp.get("modalidade") ?? "");
  }, []);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const sp = new URLSearchParams(window.location.search);
    ano ? sp.set("ano", ano) : sp.delete("ano");
    situacao ? sp.set("situacao", situacao) : sp.delete("situacao");
    modalidade ? sp.set("modalidade", modalidade) : sp.delete("modalidade");
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [ano, situacao, modalidade]);

  const filtrar = useCallback(
    (l: LinhaLicitacao) => {
      if (ano) {
        // `data_publicacao_pncp` não tem hora — `getUTCFullYear` pelo mesmo
        // motivo registrado em `congresso/votacoes/ListaVotacoes.tsx`.
        const anoDaPublicacao = l.data_publicacao_pncp
          ? new Date(l.data_publicacao_pncp).getUTCFullYear()
          : null;
        if (anoDaPublicacao !== Number(ano)) return false;
      }
      if (situacao && l.situacao !== situacao) return false;
      if (modalidade && l.modalidade_nome !== modalidade) return false;
      return true;
    },
    [ano, situacao, modalidade]
  );

  return (
    <TabelaEstatica<LinhaLicitacao>
      base={base}
      colunas={COLUNAS}
      camposBusca={["objeto", "orgao_nome"]}
      vazio="Nenhuma licitação encontrada no momento."
      filtrar={filtrar}
      controles={() => (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <label htmlFor="f-ano" className="mb-1 text-xs font-medium text-text-soft">
              Ano
            </label>
            <input
              id="f-ano"
              type="number"
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              placeholder="2025"
              className="w-24 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="f-modalidade" className="mb-1 text-xs font-medium text-text-soft">
              Modalidade
            </label>
            <select
              id="f-modalidade"
              value={modalidade}
              onChange={(e) => setModalidade(e.target.value)}
              className="w-56 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
            >
              <option value="">Todas</option>
              {modalidadesDisponiveis.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="f-situacao" className="mb-1 text-xs font-medium text-text-soft">
              Situação
            </label>
            <select
              id="f-situacao"
              value={situacao}
              onChange={(e) => setSituacao(e.target.value)}
              className="w-56 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
            >
              <option value="">Todas</option>
              {situacoesDisponiveis.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {(ano || situacao || modalidade) && (
            <button
              type="button"
              onClick={() => {
                setAno("");
                setSituacao("");
                setModalidade("");
              }}
              className="text-sm text-text-soft hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}
    />
  );
}
