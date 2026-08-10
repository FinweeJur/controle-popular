"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TabelaEstatica, { type ColunaTabela } from "@/app/[municipio]/components/TabelaEstatica";
import type { ProposicaoListRow } from "@/lib/betim/proposicoes";
import { formatDateBR } from "@/lib/betim/format";

/**
 * Tabela de `/[municipio]/camara/proposicoes` — mesmo mecanismo de
 * `congresso/proposicoes` (ver o porquê em `dados/[arquivo]/route.ts`),
 * agora com os cinco filtros originais (tipo, situação, ano, tema, busca).
 *
 * `TIPO_PROPOSICAO_LABELS` (`lib/betim/vereadores.ts`) e `TEMA_LABELS`
 * (`lib/betim/temas.ts`) chegam por prop — os dois módulos importam
 * `lib/db/queries/betim`, e importar direto arrastaria código de servidor
 * pro bundle do cliente (mesmo motivo já registrado em `ListaObras.tsx` e
 * `ProposicoesDoVereador.tsx`).
 */

type LinhaProposicao = ProposicaoListRow & Record<string, unknown>;

export interface ListaProposicoesProps {
  base: string;
  tipos: Record<string, string>;
  temaLabels: Record<string, string>;
  temasOrdenados: string[];
  situacoesDisponiveis: string[];
}

export default function ListaProposicoes({
  base,
  tipos,
  temaLabels,
  temasOrdenados,
  situacoesDisponiveis,
}: ListaProposicoesProps) {
  const [tipo, setTipo] = useState("");
  const [situacao, setSituacao] = useState("");
  const [ano, setAno] = useState("");
  const [tema, setTema] = useState("");
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setTipo(sp.get("tipo") ?? "");
    setSituacao(sp.get("situacao") ?? "");
    setAno(sp.get("ano") ?? "");
    setTema(sp.get("tema") ?? "");
  }, []);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const sp = new URLSearchParams(window.location.search);
    tipo ? sp.set("tipo", tipo) : sp.delete("tipo");
    situacao ? sp.set("situacao", situacao) : sp.delete("situacao");
    ano ? sp.set("ano", ano) : sp.delete("ano");
    tema ? sp.set("tema", tema) : sp.delete("tema");
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [tipo, situacao, ano, tema]);

  const filtrar = useCallback(
    (p: LinhaProposicao) => {
      if (tipo && p.tipo !== tipo) return false;
      if (situacao && p.situacao !== situacao) return false;
      if (ano && p.ano !== Number(ano)) return false;
      if (tema && !(p.temas ?? []).includes(tema)) return false;
      return true;
    },
    [tipo, situacao, ano, tema]
  );

  const colunas: ColunaTabela<LinhaProposicao>[] = [
    {
      chave: "tipo",
      rotulo: "Proposição",
      formatar: (p) => (
        <div className="flex flex-col gap-1">
          <span className="font-display font-semibold text-text">
            {tipos[p.tipo] ?? p.tipo} nº {p.numero}/{p.ano}
          </span>
          {p.link_fonte && (
            <a
              href={p.link_fonte}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-accent hover:underline"
            >
              Ver fonte oficial ↗
            </a>
          )}
        </div>
      ),
    },
    { chave: "ementa", rotulo: "Ementa", formatar: (p) => <span className="line-clamp-3">{p.ementa ?? "—"}</span> },
    { chave: "situacao", rotulo: "Situação" },
    {
      chave: "autores",
      rotulo: "Autores",
      formatar: (p) => <span className="text-xs">{p.autores?.join(", ") ?? "—"}</span>,
    },
    { chave: "data_apresentacao", rotulo: "Data", formatar: (p) => formatDateBR(p.data_apresentacao) },
    {
      chave: "temas",
      rotulo: "Temas",
      formatar: (p) => (
        <div className="flex flex-wrap gap-1">
          {(p.temas ?? []).map((t) => (
            <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-[.8em] font-medium text-primary">
              {temaLabels[t] ?? t}
            </span>
          ))}
        </div>
      ),
    },
  ];

  return (
    <TabelaEstatica<LinhaProposicao>
      base={base}
      colunas={colunas}
      camposBusca={["ementa"]}
      vazio="Nenhuma proposição encontrada no momento."
      filtrar={filtrar}
      controles={() => (
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex flex-col">
            <label htmlFor="f-tipo" className="mb-1 text-xs font-medium text-text-soft">
              Tipo
            </label>
            <select
              id="f-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-52 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
            >
              <option value="">Todos os tipos</option>
              {Object.entries(tipos).map(([codigo, label]) => (
                <option key={codigo} value={codigo}>
                  {label}
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
          <div className="flex flex-col">
            <label htmlFor="f-ano" className="mb-1 text-xs font-medium text-text-soft">
              Ano
            </label>
            <input
              id="f-ano"
              type="number"
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              placeholder="2026"
              className="w-24 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="f-tema" className="mb-1 text-xs font-medium text-text-soft">
              Área/tema
            </label>
            <select
              id="f-tema"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              className="w-56 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
            >
              <option value="">Todos os temas</option>
              {temasOrdenados.map((slug) => (
                <option key={slug} value={slug}>
                  {temaLabels[slug] ?? slug}
                </option>
              ))}
            </select>
          </div>
          {(tipo || situacao || ano || tema) && (
            <button
              type="button"
              onClick={() => {
                setTipo("");
                setSituacao("");
                setAno("");
                setTema("");
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
