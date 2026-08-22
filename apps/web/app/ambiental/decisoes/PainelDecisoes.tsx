"use client";

import { useEffect, useMemo, useState } from "react";
import type { ManifestoFatias } from "@/lib/estatico/fatiar";
import { semAcento } from "@/lib/busca/normalizar";
import { formatNumberBR } from "@/lib/betim/format";
import { ordenarPor, type Direcao, type TipoCampo } from "@/lib/tabela/ordenar";
import { negativasParaCsv, type DecisaoLicenciamentoNegativa } from "@/lib/ambiental/decisoes-licenciamento";

/**
 * As 9.554 negativas: carrega o índice fatiado (ver `dados/[arquivo]/
 * route.ts`), filtra, ordena e exporta CSV — tudo no navegador.
 *
 * ═══ POR QUE NÃO É `TabelaEstatica.tsx` ═══
 *
 * `TabelaEstatica` é o mecanismo padrão do repo (11 rotas o usam) mas não
 * expõe pra quem chama o conjunto DEPOIS do filtro — só renderiza a tabela
 * internamente. `[municipio]/prefeitura/contratos/page.tsx` já documentou
 * essa lacuna (removeu cartões que dependiam do filtrado). Como uma das
 * cinco coisas obrigatórias desta página é **CSV do filtrado**, este
 * componente é auto-contido — mesmo molde de `decisoes-lai/TabelaDecisoes.tsx`
 * (a "página irmã"), só que com o carregamento progressivo de fatias que
 * `TabelaEstatica` também faz (9.554 linhas / 4,5 MB não cabem inteiras num
 * `const` importado direto, ao contrário das 753 de `decisoes-lai`).
 *
 * ═══ BUSCA E FILTRO SÓ ABREM DEPOIS DA ÚLTIMA FATIA ═══
 *
 * Mesma razão de `TabelaEstatica`: filtrar só o que já chegou responderia
 * "0 resultados" para uma linha que existe na fatia 3. As opções de cada
 * `<select>` também são derivadas do que carregou — abertas cedo, um filtro
 * por "Norte de Minas" escondido nas últimas fatias nem apareceria na lista.
 */

const POR_PAGINA = 50;
const TODOS = "";

const DECISOES: readonly DecisaoLicenciamentoNegativa["decisao"][] = [
  "Indeferida",
  "Arquivamento",
  "Cancelada",
  "Suspensa",
];

interface ColunaDef {
  chave: keyof DecisaoLicenciamentoNegativa;
  rotulo: string;
  tipo: TipoCampo;
  numerica?: boolean;
}

const COLUNAS: ColunaDef[] = [
  { chave: "ano", rotulo: "Ano", tipo: "numero", numerica: true },
  { chave: "decisao", rotulo: "Decisão", tipo: "texto" },
  { chave: "municipio", rotulo: "Município", tipo: "texto" },
  { chave: "classe", rotulo: "Classe", tipo: "numero", numerica: true },
  { chave: "modalidade", rotulo: "Modalidade", tipo: "texto" },
  { chave: "regional", rotulo: "Regional", tipo: "texto" },
];

const CAMPOS_BUSCA: (keyof DecisaoLicenciamentoNegativa)[] = ["municipio", "atividade", "empreendimento", "numeroProcesso"];

/**
 * "Unidade Regional de Regularização Ambiental X" -> "X" — os cabeçalhos
 * completos vivem no `title` do `<td>`; a coluna fica legível na tabela.
 *
 * ⚠️ Duas AGÊNCIAS diferentes compartilham nome de região na fonte: 3 das
 * 9.554 negativas vêm de "Unidade Regional de GESTÃO DAS ÁGUAS" (não
 * Regularização Ambiental) — 2 em Noroeste de Minas, 1 em Leste de Minas.
 * Um replace ingênuo do prefixo comum faria as duas colidirem no MESMO
 * rótulo abreviado ("Leste de Minas") como se fossem a mesma regional — não
 * são. Por isso a de Gestão das Águas ganha um sufixo próprio em vez de
 * ficar indistinguível da de Regularização Ambiental.
 */
function abreviarRegional(r: string | null): string {
  if (!r) return "—";
  const aguas = /^Unidade Regional de Gestão das Águas\s+(.+)$/i.exec(r);
  if (aguas) return `${aguas[1]} (Gestão das Águas)`;
  const regularizacao = /^Unidade Regional de Regularização Ambiental\s+(?:d[oa]\s+)?(.+)$/i.exec(r);
  if (regularizacao) return regularizacao[1];
  return r;
}

function baixarCsv(conteudo: string, nomeArquivo: string) {
  const BOM = "﻿";
  const blob = new Blob([BOM + conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface PainelDecisoesProps {
  /** Base do índice: `${base}/manifesto.json` e `${base}/<n>.json`. */
  base: string;
}

export default function PainelDecisoes({ base }: PainelDecisoesProps) {
  const [linhas, setLinhas] = useState<DecisaoLicenciamentoNegativa[]>([]);
  const [manifesto, setManifesto] = useState<ManifestoFatias | null>(null);
  const [erro, setErro] = useState(false);

  const [busca, setBusca] = useState("");
  const [decisao, setDecisao] = useState(TODOS);
  const [municipio, setMunicipio] = useState(TODOS);
  const [classe, setClasse] = useState(TODOS);
  const [modalidade, setModalidade] = useState(TODOS);
  const [regional, setRegional] = useState(TODOS);
  const [ano, setAno] = useState(TODOS);
  const [ordem, setOrdem] = useState<{ chave: keyof DecisaoLicenciamentoNegativa; direcao: Direcao } | null>(null);
  const [mostrando, setMostrando] = useState(POR_PAGINA);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const rManifesto = await fetch(`${base}/manifesto.json`);
        if (!rManifesto.ok) throw new Error(`manifesto: HTTP ${rManifesto.status}`);
        const m: ManifestoFatias = await rManifesto.json();
        if (cancelado) return;
        setManifesto(m);
        // Em série: a fatia 0 aparece assim que chega, sem disputar banda com
        // as duas seguintes.
        for (let i = 0; i < m.fatias; i++) {
          const rFatia = await fetch(`${base}/${i}.json`);
          if (!rFatia.ok) throw new Error(`fatia ${i}: HTTP ${rFatia.status}`);
          const dados: DecisaoLicenciamentoNegativa[] = await rFatia.json();
          if (cancelado) return;
          setLinhas((atual) => atual.concat(dados));
        }
      } catch {
        if (!cancelado) setErro(true);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [base]);

  const totalEsperado = manifesto?.total ?? 0;
  const completo = manifesto !== null && linhas.length >= totalEsperado && totalEsperado > 0;
  const vazio = manifesto !== null && manifesto.fatias === 0;

  // Opções de cada filtro, derivadas do que já carregou — crescem enquanto
  // as fatias chegam (ver docstring acima sobre por que os controles ficam
  // desabilitados até `completo`).
  const municipios = useMemo(
    () => [...new Set(linhas.map((l) => l.municipio).filter((v): v is string => v !== null))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [linhas],
  );
  const classes = useMemo(
    () => [...new Set(linhas.map((l) => l.classe).filter((v): v is number => v !== null))].sort((a, b) => a - b),
    [linhas],
  );
  const modalidades = useMemo(
    () => [...new Set(linhas.map((l) => l.modalidade).filter((v): v is string => v !== null))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [linhas],
  );
  const regionais = useMemo(
    () => [...new Set(linhas.map((l) => l.regional).filter((v): v is string => v !== null))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [linhas],
  );
  const anos = useMemo(
    () => [...new Set(linhas.map((l) => l.ano).filter((v): v is number => v !== null))].sort((a, b) => b - a),
    [linhas],
  );

  const filtradas = useMemo(() => {
    const termo = busca.trim() ? semAcento(busca.trim()) : "";
    let resultado = linhas.filter((l) => {
      if (decisao && l.decisao !== decisao) return false;
      if (municipio && l.municipio !== municipio) return false;
      if (classe && String(l.classe ?? "") !== classe) return false;
      if (modalidade && l.modalidade !== modalidade) return false;
      if (regional && l.regional !== regional) return false;
      if (ano && String(l.ano ?? "") !== ano) return false;
      if (termo && !CAMPOS_BUSCA.some((c) => semAcento(String(l[c] ?? "")).includes(termo))) return false;
      return true;
    });
    if (ordem) {
      const col = COLUNAS.find((c) => c.chave === ordem.chave);
      resultado = ordenarPor(resultado, ordem.chave, ordem.direcao, col?.tipo ?? "texto");
    }
    return resultado;
  }, [linhas, busca, decisao, municipio, classe, modalidade, regional, ano, ordem]);

  // Filtro novo pode deixar menos linhas que a página atual mostrava — cada
  // handler abaixo chama isto explicitamente (em vez de um `useEffect`
  // assistindo os sete estados de filtro: setState direto no corpo de um
  // efeito encadeia render sem necessidade, mesmo padrão que
  // `decisoes-lai/TabelaDecisoes.tsx` já usa com `resetarPagina()`).
  function resetarPagina() {
    setMostrando(POR_PAGINA);
  }

  function limparFiltros() {
    setBusca("");
    setDecisao(TODOS);
    setMunicipio(TODOS);
    setClasse(TODOS);
    setModalidade(TODOS);
    setRegional(TODOS);
    setAno(TODOS);
    resetarPagina();
  }

  function alternarOrdem(col: ColunaDef) {
    setOrdem((atual) => {
      if (atual?.chave !== col.chave) return { chave: col.chave, direcao: "asc" };
      if (atual.direcao === "asc") return { chave: col.chave, direcao: "desc" };
      return null;
    });
  }

  function exportarCsv() {
    const hoje = new Date().toISOString().slice(0, 10);
    baixarCsv(negativasParaCsv(filtradas), `decisoes-negativas-licenciamento-mg-${hoje}.csv`);
  }

  const filtroAtivo = Boolean(busca || decisao || municipio || classe || modalidade || regional || ano);

  if (erro) {
    return (
      <p className="mt-6 rounded-lg border border-border p-5">
        Não foi possível carregar esta tabela. Recarregue a página; se persistir, o índice pode não
        ter sido publicado no último build.
      </p>
    );
  }

  if (vazio) {
    return (
      <p className="mt-6 rounded-xl border border-border bg-surface px-4 py-6 text-center text-[.92em] text-text-soft">
        Nenhuma negativa coletada ainda.
      </p>
    );
  }

  const visiveis = filtradas.slice(0, mostrando);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4">
        <label className="min-w-[220px] flex-1">
          <span className="block text-[.82em] font-medium text-text-soft">Buscar por município, atividade, processo ou empreendimento</span>
          <input
            type="search"
            value={busca}
            disabled={!completo}
            onChange={(e) => {
              setBusca(e.target.value);
              resetarPagina();
            }}
            placeholder={completo ? "ex.: mineração, Uberlândia, 19576/2025" : "Carregando para poder buscar…"}
            aria-label="Buscar nas negativas"
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-[.92em] disabled:opacity-60"
          />
        </label>
        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Decisão</span>
          <select
            value={decisao}
            disabled={!completo}
            onChange={(e) => {
              setDecisao(e.target.value);
              resetarPagina();
            }}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em] disabled:opacity-60"
          >
            <option value={TODOS}>Todas</option>
            {DECISOES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Ano</span>
          <select
            value={ano}
            disabled={!completo}
            onChange={(e) => {
              setAno(e.target.value);
              resetarPagina();
            }}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em] disabled:opacity-60"
          >
            <option value={TODOS}>Todos</option>
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Classe</span>
          <select
            value={classe}
            disabled={!completo}
            onChange={(e) => {
              setClasse(e.target.value);
              resetarPagina();
            }}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em] disabled:opacity-60"
          >
            <option value={TODOS}>Todas</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Modalidade</span>
          <select
            value={modalidade}
            disabled={!completo}
            onChange={(e) => {
              setModalidade(e.target.value);
              resetarPagina();
            }}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em] disabled:opacity-60"
          >
            <option value={TODOS}>Todas</option>
            {modalidades.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Regional</span>
          <select
            value={regional}
            disabled={!completo}
            onChange={(e) => {
              setRegional(e.target.value);
              resetarPagina();
            }}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em] disabled:opacity-60"
          >
            <option value={TODOS}>Todas</option>
            {regionais.map((r) => (
              <option key={r} value={r}>
                {abreviarRegional(r)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-[.82em] font-medium text-text-soft">Município</span>
          <select
            value={municipio}
            disabled={!completo}
            onChange={(e) => {
              setMunicipio(e.target.value);
              resetarPagina();
            }}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em] disabled:opacity-60"
          >
            <option value={TODOS}>Todos</option>
            {municipios.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        {filtroAtivo && completo && (
          <button type="button" onClick={limparFiltros} className="pb-2 text-[.85em] underline">
            limpar
          </button>
        )}
      </div>

      {!completo && (
        <p className="mt-3 font-tabular text-[.85em] text-text-soft" aria-live="polite">
          {formatNumberBR(linhas.length)} de {formatNumberBR(totalEsperado)} negativas carregadas —
          a busca e o filtro abrem quando todas chegarem.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-tabular text-[.88em] text-text-soft" role="status" aria-live="polite">
          {completo
            ? `${formatNumberBR(filtradas.length)} de ${formatNumberBR(totalEsperado)}`
            : `${formatNumberBR(linhas.length)} carregadas`}
        </p>
        <button
          type="button"
          onClick={exportarCsv}
          disabled={!completo || filtradas.length === 0}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-[.85em] font-medium text-text hover:border-primary disabled:opacity-50"
        >
          Baixar CSV do filtrado ({formatNumberBR(filtradas.length)})
        </button>
      </div>

      {completo && filtradas.length === 0 ? (
        <p className="mt-4 rounded-xl border border-border bg-surface px-4 py-6 text-center text-[.92em] text-text-soft">
          Nenhuma negativa com esses filtros. Vazio aqui é resposta — a busca cobre a tabela
          inteira, este resultado é definitivo.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[820px] text-[.85em]">
            <thead>
              <tr>
                {COLUNAS.map((c) => {
                  const ativa = ordem?.chave === c.chave;
                  return (
                    <th
                      key={c.chave}
                      scope="col"
                      aria-sort={ativa ? (ordem!.direcao === "asc" ? "ascending" : "descending") : "none"}
                      className={`whitespace-nowrap border-b border-border bg-surface px-3 py-2 text-xs uppercase tracking-wide text-text-soft ${
                        c.numerica ? "text-right" : "text-left"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => alternarOrdem(c)}
                        aria-label={`Ordenar por ${c.rotulo}`}
                        title={`Ordenar por ${c.rotulo}`}
                        className={`inline-flex items-center gap-1 rounded transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 ${
                          ativa ? "text-text" : ""
                        }`}
                      >
                        {c.rotulo}
                        <span aria-hidden="true" className="font-tabular text-[0.8em]">
                          {ativa ? (ordem!.direcao === "asc" ? "▲" : "▼") : "⇅"}
                        </span>
                      </button>
                    </th>
                  );
                })}
                <th scope="col" className="whitespace-nowrap border-b border-border bg-surface px-3 py-2 text-left text-xs uppercase tracking-wide text-text-soft">
                  Ficha
                </th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((l) => (
                <tr key={l.idFonte}>
                  <td className="border-b border-border px-3 py-2 text-right font-tabular">{l.ano ?? "—"}</td>
                  <td className="border-b border-border px-3 py-2">{l.decisao}</td>
                  <td className="border-b border-border px-3 py-2">{l.municipio ?? "não resolvido"}</td>
                  <td className="border-b border-border px-3 py-2 text-right font-tabular">{l.classe ?? "—"}</td>
                  <td className="border-b border-border px-3 py-2" title={l.modalidade ?? undefined}>
                    {l.modalidade ?? "—"}
                  </td>
                  <td className="border-b border-border px-3 py-2" title={l.regional ?? undefined}>
                    {abreviarRegional(l.regional)}
                  </td>
                  <td className="border-b border-border px-3 py-2">
                    {l.linkFicha ? (
                      <a
                        href={l.linkFicha}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2 hover:text-accent"
                      >
                        ver ↗
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mostrando < filtradas.length && (
        <button
          type="button"
          onClick={() => setMostrando((n) => n + POR_PAGINA)}
          className="mt-4 w-full rounded-md border border-border px-4 py-2 text-[.92em] font-medium hover:border-primary"
        >
          Mostrar mais {formatNumberBR(Math.min(POR_PAGINA, filtradas.length - mostrando))} de{" "}
          {formatNumberBR(filtradas.length - mostrando)} restantes
        </button>
      )}
    </div>
  );
}
