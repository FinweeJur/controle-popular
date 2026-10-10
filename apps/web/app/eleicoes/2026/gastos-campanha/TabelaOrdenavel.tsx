"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Moeda from "@/app/components/Moeda";
import BotoesExportar from "@/app/components/BotoesExportar";
import type { ColunaCsv } from "@/lib/tabela/csv";
import {
  combinado,
  ehVazio,
  filtrarLinhas,
  opcoesPorColuna,
  ordenarLinhas,
  texto,
  textoCsv,
  vazioDe,
  type ColunaOrdenavel,
  type Direcao,
} from "@/lib/tabela/ordenavel";
import { formatarNumeroBR } from "@/lib/utilitarios/calculos";

/**
 * Tabela de agregado ORDENÁVEL e FILTRÁVEL — o mesmo contrato visual da tabela
 * do site, com interação no navegador.
 *
 * Por que existe: a regra das seis qualidades (AGENTS.md § 8, qualidade 3)
 * exige ordenar por QUALQUER coluna. As tabelas de agregado da página dos
 * gastos nasceram estáticas (servidor) e reprovavam nisso.
 *
 * Por que é componente de CLIENTE e recebe só DADO + DESCRITOR: a coluna é um
 * descritor PLANO (campo, rótulo, formato) porque função de render não
 * atravessa a fronteira servidor→cliente; a célula é montada aqui dentro. A
 * lógica pura (filtrar, ordenar, formatar para CSV) mora em
 * `lib/tabela/ordenavel.ts`, testável sem React.
 *
 * Payload (AGENTS.md § 5.1): só agregados pequenos passam por aqui (dezenas de
 * linhas). Lista de milhares continua no índice fatiado da `TabelaEstatica`.
 */

type Linha = Record<string, unknown>;
type Ordem = { campo: string; dir: Direcao };

const CONTROLE =
  "rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-2.5 py-1.5 text-sm";

/** Seta do cabeçalho conforme a coluna ativa e a direção. */
function seta(ativa: boolean, dir: Direcao): string {
  if (!ativa) return "⇅";
  if (dir === "asc") return "▲";
  return "▼";
}

function ariaSort(ativa: boolean, dir: Direcao): "none" | "ascending" | "descending" {
  if (!ativa) return "none";
  if (dir === "asc") return "ascending";
  return "descending";
}

function textoDoSelo(col: ColunaOrdenavel): string {
  if (col.seloTexto) return col.seloTexto;
  return "selo";
}

function temControles(deFiltro: ColunaOrdenavel[], busca?: string[]): boolean {
  if (deFiltro.length > 0) return true;
  if (busca) return busca.length > 0;
  return false;
}

function temBusca(busca?: string[]): boolean {
  if (busca) return busca.length > 0;
  return false;
}

/** Próximo estado de ordenação ao clicar num cabeçalho: asc → desc → original. */
function proximaOrdem(atual: Ordem | null, campo: string): Ordem | null {
  if (atual?.campo !== campo) return { campo, dir: "asc" };
  if (atual.dir === "asc") return { campo, dir: "desc" };
  return null;
}

/** Aplica a ordenação ativa (ou devolve cópia na ordem original). */
function aplicarOrdem(linhas: Linha[], colunas: ColunaOrdenavel[], ordem: Ordem | null): Linha[] {
  if (!ordem) return [...linhas];
  const col = colunas.find((c) => c.campo === ordem.campo);
  if (!col) return [...linhas];
  return ordenarLinhas(linhas, col, ordem.dir);
}

function LegendaTabela({ texto }: { texto?: string }): ReactNode {
  if (!texto) return null;
  return (
    <caption className="border-b border-[var(--cp-border)] px-3 py-2 text-left text-xs font-semibold opacity-80">
      {texto}
    </caption>
  );
}

function SemLinhas({ n }: { n: number }): ReactNode {
  if (n > 0) return null;
  return <p className="text-xs opacity-70">Nenhuma linha com este filtro.</p>;
}

function Exportar({
  nomeArquivo,
  linhas,
  colunas,
}: {
  nomeArquivo?: string;
  linhas: Linha[];
  colunas: ColunaCsv<Linha>[];
}): ReactNode {
  if (!nomeArquivo) return null;
  if (linhas.length === 0) return null;
  return <BotoesExportar dados={linhas} colunas={colunas} nomeArquivo={nomeArquivo} />;
}

function Selo({ ativo, texto: t }: { ativo: boolean; texto: string }): ReactNode {
  if (!ativo) return null;
  return (
    <span
      className="rounded-md border px-1.5 py-0.5 text-[11px] font-semibold"
      style={{ borderColor: "var(--cp-alert)", color: "var(--cp-alert)" }}
    >
      {t}
    </span>
  );
}

/** Célula base: combinado, formatado (moeda/número) ou texto, com o vazio tratado. */
function ValorCelula({ l, col }: { l: Linha; col: ColunaOrdenavel }): ReactNode {
  if (col.combinar) {
    const t = combinado(l, col);
    if (t) return t;
    return vazioDe(col);
  }
  const v = l[col.campo];
  if (ehVazio(v)) return vazioDe(col);
  if (col.formato === "moeda") return <Moeda value={Number(v)} />;
  if (col.formato === "numero") return formatarNumeroBR(Number(v), 0);
  return String(v);
}

/** Célula com linha secundária e/ou selo (partido+nome, fornecedor+big tech). */
function Celula({ l, col }: { l: Linha; col: ColunaOrdenavel }): ReactNode {
  let sub = "";
  if (col.subtexto) sub = texto(l[col.subtexto]);
  let comSelo = false;
  if (col.selo) comSelo = Boolean(l[col.selo]);
  const principal = <ValorCelula l={l} col={col} />;
  if (sub === "") {
    if (!comSelo) return principal;
  }
  return (
    <span className="flex flex-col gap-0.5">
      <span className="inline-flex flex-wrap items-center gap-2">
        <span className="font-medium">{principal}</span>
        <Selo ativo={comSelo} texto={textoDoSelo(col)} />
      </span>
      {sub ? <span className="text-xs opacity-70">{sub}</span> : null}
    </span>
  );
}

function Cabecalho({
  colunas,
  ordem,
  onOrdenar,
}: {
  colunas: ColunaOrdenavel[];
  ordem: Ordem | null;
  onOrdenar: (campo: string) => void;
}): ReactNode {
  return (
    <thead>
      <tr>
        {colunas.map((c) => {
          const ativa = ordem?.campo === c.campo;
          const dir: Direcao = ordem?.dir ?? "asc";
          return (
            <th
              key={c.campo}
              scope="col"
              aria-sort={ariaSort(ativa, dir)}
              className={`whitespace-nowrap border-b border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2 text-xs uppercase tracking-wide opacity-70 ${
                c.numerica ? "text-right" : "text-left"
              }`}
            >
              <button
                type="button"
                onClick={() => onOrdenar(c.campo)}
                aria-label={`Ordenar por ${c.rotulo}`}
                title={`Ordenar por ${c.rotulo}`}
                className="inline-flex items-center gap-1 font-semibold uppercase tracking-wide hover:underline"
              >
                {c.rotulo}
                <span aria-hidden="true" className="font-tabular text-[11px]">
                  {seta(ativa, dir)}
                </span>
              </button>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

function Corpo({
  colunas,
  linhas,
  campoChave,
}: {
  colunas: ColunaOrdenavel[];
  linhas: Linha[];
  campoChave?: string;
}): ReactNode {
  return (
    <tbody>
      {linhas.map((l, i) => (
        <tr key={campoChave ? String(l[campoChave]) : i} className="border-b border-[var(--cp-border)] last:border-0">
          {colunas.map((c) => (
            <td
              key={c.campo}
              className={`px-3 py-1.5 ${c.numerica ? "text-right font-tabular whitespace-nowrap" : "text-left"}`}
            >
              <Celula l={l} col={c} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

function Controles({
  ativo,
  colunas,
  opcoes,
  filtros,
  onFiltrar,
  termo,
  onTermo,
  comBusca,
}: {
  ativo: boolean;
  colunas: ColunaOrdenavel[];
  opcoes: Record<string, string[]>;
  filtros: Record<string, string>;
  onFiltrar: (campo: string, valor: string) => void;
  termo: string;
  onTermo: (valor: string) => void;
  comBusca: boolean;
}): ReactNode {
  if (!ativo) return null;
  return (
    <div className="flex flex-wrap items-end gap-3">
      {colunas.map((c) => (
        <label key={c.campo} className="text-xs">
          <span className="mr-1.5 opacity-75">{c.rotulo}</span>
          <select value={filtros[c.campo] ?? ""} onChange={(e) => onFiltrar(c.campo, e.target.value)} className={CONTROLE}>
            <option value="">Todos</option>
            {opcoes[c.campo]?.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      ))}
      {comBusca ? (
        <label className="text-xs">
          <span className="mr-1.5 opacity-75">Buscar</span>
          <input
            type="search"
            value={termo}
            onChange={(e) => onTermo(e.target.value)}
            className={CONTROLE}
            aria-label="Buscar na tabela"
          />
        </label>
      ) : null}
    </div>
  );
}

export default function TabelaOrdenavel({
  colunas,
  linhas,
  legenda,
  campoChave,
  busca,
  nomeArquivo,
}: {
  colunas: ColunaOrdenavel[];
  /** Linhas de qualquer formato de objeto (interfaces do lib entram aqui). */
  linhas: readonly object[];
  legenda?: string;
  /** Campo que serve de `key` de linha; ausente cai no índice. */
  campoChave?: string;
  /** Campos varridos pela caixa de busca textual (opcional). */
  busca?: string[];
  /** Presente = mostra os botões de CSV/copiar/imprimir do que está na tela. */
  nomeArquivo?: string;
}): ReactNode {
  const [ordem, setOrdem] = useState<Ordem | null>(null);
  const [filtros, setFiltros] = useState<Record<string, string>>({});
  const [termo, setTermo] = useState("");

  // As interfaces do `lib` não têm índice de string; converter para o mapa
  // interno é a forma de ler por nome de coluna sem afrouxar o tipo na chamada.
  const rows = linhas as readonly Linha[];
  const deFiltro = useMemo(() => colunas.filter((c) => c.filtro), [colunas]);
  const opcoes = useMemo(() => opcoesPorColuna(rows, deFiltro), [rows, deFiltro]);
  const filtradas = useMemo(() => filtrarLinhas(rows, filtros, busca, termo), [rows, filtros, busca, termo]);

  const ordenadas = useMemo(() => aplicarOrdem(filtradas, colunas, ordem), [filtradas, colunas, ordem]);

  const colunasCsv = useMemo<ColunaCsv<Linha>[]>(
    () => colunas.map((c) => ({ chave: c.campo, rotulo: c.rotulo, formatar: (_v: unknown, l: Linha) => textoCsv(l, c) })),
    [colunas]
  );

  return (
    <div className="space-y-3">
      <Controles
        ativo={temControles(deFiltro, busca)}
        colunas={deFiltro}
        opcoes={opcoes}
        filtros={filtros}
        onFiltrar={(campo, valor) => setFiltros((f) => ({ ...f, [campo]: valor }))}
        termo={termo}
        onTermo={setTermo}
        comBusca={temBusca(busca)}
      />

      <div className="overflow-x-auto rounded-lg border border-[var(--cp-border)]">
        <table className="w-full text-sm">
          <LegendaTabela texto={legenda} />
          <Cabecalho colunas={colunas} ordem={ordem} onOrdenar={(campo) => setOrdem((a) => proximaOrdem(a, campo))} />
          <Corpo colunas={colunas} linhas={ordenadas} campoChave={campoChave} />
        </table>
      </div>

      <SemLinhas n={ordenadas.length} />
      <Exportar nomeArquivo={nomeArquivo} linhas={ordenadas} colunas={colunasCsv} />
    </div>
  );
}
