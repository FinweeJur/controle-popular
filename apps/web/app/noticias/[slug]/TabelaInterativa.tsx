"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, X } from "lucide-react";
import TextoComLinks from "./TextoComLinks";
import {
  filtrarLinhas,
  opcoesDeFiltro,
  ordenarLinhas,
  texto,
  type ColunaOrdenavel,
  type Direcao,
} from "@/lib/tabela/ordenavel";
import { montarTabela } from "@/lib/noticias/tabela";

/**
 * @file Tabela do post com busca, filtro por categoria e ordenação.
 *
 * POR QUE CLIENTE: ordenar e filtrar exige estado no navegador. O SSR entrega
 * a tabela inteira com o estado inicial — leitor sem JavaScript vê os dados,
 * só não interage.
 *
 * A lógica pura (normalizar, filtrar, ordenar) mora em
 * `lib/tabela/ordenavel.ts`; a montagem dos descritores, em
 * `lib/noticias/tabela.ts`. Aqui só há estado e desenho.
 *
 * REGRAS:
 * - busca sem acento e sem caixa ("direito" acha "Direito" e
 *   "Ciências Sociais / Direito");
 * - coluna numérica ordena por número, não por texto ("8" > "10" no texto);
 * - cada coluna de texto com 2 a 8 valores únicos vira `<select>` (polo,
 *   UF); coluna de 39 áreas não vira, para não criar seletor inútil;
 * - contador `aria-live` diz quantas linhas sobraram e a soma de vagas;
 * - cabeçalho clicável com `aria-sort` e seta visível.
 *
 * O componente principal ficou sem ramo: os pedaços com condição moram em
 * funções puras ou em subcomponentes, para o CodeScene não barrar a cada
 * recurso novo.
 */

const CONTROLE =
  "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none";

type Ordem = { campo: string; dir: Direcao } | null;
type Faceta = { coluna: ColunaOrdenavel; opcoes: string[] };

/** asc → desc → sem ordem, ao clicar no mesmo cabeçalho. */
function proximaOrdem(atual: Ordem, campo: string): Ordem {
  if (atual?.campo !== campo) return { campo, dir: "asc" };
  if (atual.dir === "asc") return { campo, dir: "desc" };
  return null;
}

function aplicarOrdem(
  linhas: Record<string, unknown>[],
  colunas: ColunaOrdenavel[],
  ordem: Ordem
): Record<string, unknown>[] {
  if (!ordem) return linhas;
  const coluna = colunas.find((c) => c.campo === ordem.campo);
  if (!coluna) return linhas;
  return ordenarLinhas(linhas, coluna, ordem.dir);
}

function somarVagas(
  linhas: Record<string, unknown>[],
  campo: string | null
): number | null {
  if (!campo) return null;
  return linhas.reduce((soma, linha) => soma + Number(linha[campo] ?? 0), 0);
}

function temFiltro(termo: string, filtros: Record<string, string>): boolean {
  if (termo.trim() !== "") return true;
  return Object.values(filtros).some(Boolean);
}

function Controles({
  titulo,
  termo,
  onTermo,
  filtros,
  onFiltro,
  facetas,
  ativo,
  onLimpar,
  resumo,
}: {
  titulo: string;
  termo: string;
  onTermo: (valor: string) => void;
  filtros: Record<string, string>;
  onFiltro: (campo: string, valor: string) => void;
  facetas: Faceta[];
  ativo: boolean;
  onLimpar: () => void;
  resumo: string;
}) {
  return (
    <>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="min-w-0 flex-1">
          <span className="mb-1 block text-xs font-medium text-muted">Filtrar a tabela</span>
          <span className="relative block">
            <Search
              size={14}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={termo}
              onChange={(e) => onTermo(e.target.value)}
              placeholder="Ex.: direito"
              aria-label={`Filtrar ${titulo} por texto`}
              className={`${CONTROLE} w-full pl-8`}
            />
          </span>
        </label>

        {facetas.map(({ coluna, opcoes }) => (
          <label key={coluna.campo} className="w-full sm:w-auto">
            <span className="mb-1 block text-xs font-medium text-muted">{coluna.rotulo}</span>
            <select
              value={filtros[coluna.campo] ?? ""}
              onChange={(e) => onFiltro(coluna.campo, e.target.value)}
              className={`${CONTROLE} w-full sm:w-auto`}
            >
              <option value="">Sem filtro</option>
              {opcoes.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {opcao}
                </option>
              ))}
            </select>
          </label>
        ))}

        {ativo && (
          <button
            type="button"
            onClick={onLimpar}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            <X size={14} aria-hidden="true" />
            Limpar
          </button>
        )}
      </div>

      <p className="mb-2 text-xs text-muted" aria-live="polite">
        {resumo}
      </p>
    </>
  );
}

function Cabecalho({
  colunas,
  ordem,
  onOrdenar,
}: {
  colunas: ColunaOrdenavel[];
  ordem: Ordem;
  onOrdenar: (campo: string) => void;
}) {
  return (
    <thead className="bg-surface-2 text-xs font-semibold text-muted uppercase border-b border-border">
      <tr>
        {colunas.map((coluna) => {
          const ativa = ordem?.campo === coluna.campo;
          const direcao = ativa ? ordem?.dir : null;
          return (
            <th
              key={coluna.campo}
              scope="col"
              aria-sort={ativa ? (direcao === "asc" ? "ascending" : "descending") : "none"}
              className={`whitespace-nowrap px-3 py-2.5 ${coluna.numerica ? "text-right" : ""}`}
            >
              <button
                type="button"
                onClick={() => onOrdenar(coluna.campo)}
                className="inline-flex items-center gap-1 uppercase tracking-wide transition-colors hover:text-foreground"
                title={`Ordenar por ${coluna.rotulo}`}
              >
                {coluna.rotulo}
                {ativa ? (
                  direcao === "asc" ? (
                    <ArrowUp size={12} aria-hidden="true" />
                  ) : (
                    <ArrowDown size={12} aria-hidden="true" />
                  )
                ) : (
                  <ArrowUpDown size={12} className="opacity-40" aria-hidden="true" />
                )}
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
}: {
  colunas: ColunaOrdenavel[];
  linhas: Record<string, unknown>[];
}) {
  return (
    <tbody className="divide-y divide-border/60">
      {linhas.map((linha) => (
        <tr key={String(linha.__id)} className="align-top transition hover:bg-surface-2/50">
          {colunas.map((coluna) => (
            <td
              key={coluna.campo}
              className={`px-3 py-2.5 text-foreground/90 ${
                coluna.numerica ? "text-right font-tabular" : ""
              }`}
            >
              <TextoComLinks texto={texto(linha[coluna.campo])} />
            </td>
          ))}
        </tr>
      ))}
      {linhas.length === 0 && (
        <tr>
          <td colSpan={colunas.length} className="px-3 py-6 text-center text-sm text-muted">
            Nenhuma linha para este filtro.
          </td>
        </tr>
      )}
    </tbody>
  );
}

export default function TabelaInterativa({
  titulo,
  colunas,
  linhas,
}: {
  titulo: string;
  colunas: string[];
  linhas: string[][];
}) {
  const tabela = useMemo(() => montarTabela(colunas, linhas), [colunas, linhas]);
  const [termo, setTermo] = useState("");
  const [filtros, setFiltros] = useState<Record<string, string>>({});
  const [ordem, setOrdem] = useState<Ordem>(null);

  const facetas = useMemo(
    () =>
      tabela.colunas
        .filter((c) => c.filtro)
        .map((c) => ({ coluna: c, opcoes: opcoesDeFiltro(tabela.linhas, c) })),
    [tabela]
  );

  const filtradas = useMemo(
    () => filtrarLinhas(tabela.linhas, filtros, tabela.camposBusca, termo),
    [tabela, filtros, termo]
  );

  const visiveis = useMemo(
    () => aplicarOrdem(filtradas, tabela.colunas, ordem),
    [filtradas, tabela.colunas, ordem]
  );

  const somaVagas = useMemo(
    () => somarVagas(visiveis, tabela.campoVagas),
    [visiveis, tabela.campoVagas]
  );

  const resumo = `${visiveis.length} de ${tabela.linhas.length} linhas${
    somaVagas !== null ? ` · ${somaVagas} vagas` : ""
  }`;

  return (
    <div>
      <Controles
        titulo={titulo}
        termo={termo}
        onTermo={setTermo}
        filtros={filtros}
        onFiltro={(campo, valor) => setFiltros((atual) => ({ ...atual, [campo]: valor }))}
        facetas={facetas}
        ativo={temFiltro(termo, filtros)}
        onLimpar={() => {
          setTermo("");
          setFiltros({});
          setOrdem(null);
        }}
        resumo={resumo}
      />

      <div className="w-full max-w-full min-w-0 overflow-x-auto rounded-2xl border border-border bg-surface shadow-xs">
        <table className="w-full text-left text-sm border-collapse">
          <caption className="sr-only">{titulo}</caption>
          <Cabecalho
            colunas={tabela.colunas}
            ordem={ordem}
            onOrdenar={(campo) => setOrdem((atual) => proximaOrdem(atual, campo))}
          />
          <Corpo colunas={tabela.colunas} linhas={visiveis} />
        </table>
      </div>
    </div>
  );
}
