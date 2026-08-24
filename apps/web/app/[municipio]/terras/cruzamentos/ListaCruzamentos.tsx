"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TabelaEstatica, { type ColunaTabela } from "@/app/[municipio]/components/TabelaEstatica";
// Módulo PURO de propósito: nada aqui pode puxar `lib/terras/alertas`/
// `camadas` (leem arquivos do disco com fs — código de servidor).
import type { LinhaCruzamento, TipoCruzamento } from "@/lib/terras/cruzamentos-puro";
import { formatNumberBR } from "@/lib/betim/format";

/**
 * Tabela de `/[municipio]/terras/cruzamentos` — mesmo mecanismo de
 * `prefeitura/fornecedores` (`TabelaEstatica` sobre índice estático fatiado;
 * ver o porquê em `dados/[arquivo]/route.ts`). Volume por município é de
 * poucas dezenas de linhas, mas o mecanismo é o mesmo das outras telas de
 * propósito: filtro, ordenação e paginação saem de graça e iguais.
 */

type Linha = LinhaCruzamento & Record<string, unknown>;

export interface ListaCruzamentosProps {
  base: string;
  municipioSlug: string;
}

const ORDEM_TIPO: TipoCruzamento[] = [
  "mineracao_operacao",
  "mineracao_interesse",
  "barragem_mancha_quilombola",
];

export default function ListaCruzamentos({ base, municipioSlug }: ListaCruzamentosProps) {
  const [tipo, setTipo] = useState("");
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setTipo(sp.get("tipo") ?? "");
  }, []);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const sp = new URLSearchParams(window.location.search);
    if (tipo) {
      sp.set("tipo", tipo);
    } else {
      sp.delete("tipo");
    }
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [tipo]);

  const filtrar = useCallback(
    (l: Linha) => {
      if (tipo && l.tipo !== tipo) return false;
      return true;
    },
    [tipo]
  );

  const colunas: ColunaTabela<Linha>[] = [
    { chave: "tipoLabel", rotulo: "Tipo" },
    {
      chave: "territorioNome",
      rotulo: "Território",
      formatar: (l) => (
        <div className="flex flex-col gap-1">
          <span>
            <strong className="text-text">{l.territorioTipoLabel}</strong>
            {l.territorioNome ? <> · {l.territorioNome}</> : null}
          </span>
          {l.semNomeMotivo && (
            <p className="max-w-[320px] text-sm leading-snug text-text-soft">{l.semNomeMotivo}</p>
          )}
          {l.municipiosTerritorio.length > 0 && (
            <p className="text-sm text-text-soft">Também em: {l.municipiosTerritorio.join(", ")}</p>
          )}
        </div>
      ),
    },
    {
      chave: "empreendimento",
      rotulo: "Empreendimento",
      formatar: (l) => (
        <div className="flex flex-col gap-1">
          <span>{l.empreendimento}</span>
          {l.detalheEmpreendimento && (
            <p className="max-w-[360px] text-sm leading-snug text-text-soft">{l.detalheEmpreendimento}</p>
          )}
        </div>
      ),
    },
    {
      chave: "orgaoAutorizador",
      rotulo: "Órgão autorizador",
    },
    {
      chave: "areaIntersecaoHa",
      rotulo: "Área de interseção (ha)",
      numerica: true,
      formatar: (l) => (
        <span title="Soma exata da interseção dos polígonos, em hectares — não há buffer nem proximidade">
          {formatNumberBR(Math.round(l.areaIntersecaoHa * 100) / 100)}
        </span>
      ),
    },
    {
      chave: "fonte",
      rotulo: "Fonte e mapa",
      formatar: (l) => (
        <div className="flex flex-col gap-1">
          {/* `<a>` cru de propósito: o globo mora fora da zona [municipio],
              e o Link de zona prefixaria com o slug da cidade (mesma nota
              da página /terras). */}
          {l.documentoReferencia ? (
            <a
              href={l.documentoReferencia}
              target="_blank"
              rel="noopener noreferrer"
              className="w-fit text-[.8em] font-medium text-primary underline underline-offset-2"
            >
              Conferir na fonte ↗
            </a>
          ) : (
            <span className="text-sm text-text-soft">Sem documento público vinculado no acervo</span>
          )}
          {l.mapaCamada != null && l.mapaIdx != null && (
            <a
              href={`/funcaosocialterra/mapa?camada=${encodeURIComponent(l.mapaCamada)}&idx=${l.mapaIdx}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-fit text-[.8em] font-medium text-accent hover:underline"
            >
              Ver os dois polígonos no mapa 3D ↗
            </a>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <a
          href={`/${municipioSlug}/api/terras-cruzamentos`}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4.5 py-2.5 text-[.9em] font-semibold text-text"
        >
          ↓ Exportar CSV
        </a>
      </div>
      <TabelaEstatica<Linha>
        base={base}
        colunas={colunas}
        camposBusca={["territorioNome", "empreendimento", "detalheEmpreendimento"]}
        vazio="Nenhuma sobreposição envolvendo território tradicional deste município nas camadas publicadas."
        filtrar={filtrar}
        controles={({ pronto, linhas }) => (
          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex flex-col">
              <label htmlFor="fc-tipo" className="mb-1 text-xs font-medium text-text-soft">
                Tipo de cruzamento
              </label>
              <select
                id="fc-tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-72 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
              >
                <option value="">Todos os tipos</option>
                {ORDEM_TIPO.filter((t) => linhas.some((l) => l.tipo === t)).map((t) => (
                  <option key={t} value={t}>
                    {linhas.find((l) => l.tipo === t)?.tipoLabel ?? t}
                  </option>
                ))}
              </select>
              {!pronto && (
                <p className="mt-1 max-w-[288px] text-xs leading-snug text-text-soft">
                  As opções aparecem quando as linhas terminarem de carregar.
                </p>
              )}
            </div>
            {tipo && (
              <button
                type="button"
                onClick={() => setTipo("")}
                className="text-sm text-text-soft hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}
      />
    </div>
  );
}
