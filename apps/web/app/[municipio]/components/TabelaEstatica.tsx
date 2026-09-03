"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ManifestoFatias } from "@/lib/estatico/fatiar";
import { ordenarPor } from "@/lib/tabela/ordenar";
import type { Direcao, TipoCampo } from "@/lib/tabela/ordenar";

/**
 * Tabela que lê um índice estático fatiado (ver `lib/estatico/fatiar.ts`) e faz
 * busca, ordenação e paginação no navegador.
 *
 * ═══ POR QUE NÃO USA `useSearchParams()` ═══
 *
 * As sete páginas que já foram convertidas para filtro no cliente usam o hook,
 * e são exatamente as que hoje reprovam o `output: 'export'` com a mensagem
 * enganosa de "missing generateStaticParams()" (ver `docs/deploy-github-pages.md`
 * §8). Enquanto esse bloqueio não for entendido, componente novo não repete o
 * padrão.
 *
 * Isso NÃO custa a URL compartilhável, que é o motivo de o hook existir: o
 * estado inicial é lido de `window.location.search` num efeito (depois da
 * hidratação, então sem divergência entre servidor e cliente) e escrito de
 * volta com `history.replaceState`. O leitor copia a URL e ela leva ao mesmo
 * filtro. O que se perde é a integração com o roteador — voltar no navegador
 * não desfaz um filtro. É troca consciente, e reversível se o bloqueio cair.
 *
 * ═══ CARREGAMENTO PROGRESSIVO, E O QUE ELE NÃO RESOLVE ═══
 *
 * As fatias chegam em ordem e a tabela já mostra a primeira assim que ela
 * carrega. Mas **buscar exige o conjunto inteiro**: filtrar só o que chegou
 * responderia "nenhum resultado" para uma linha que existe na fatia 7. Por
 * isso a busca fica desabilitada até a última fatia chegar, com o progresso à
 * vista — em vez de dar uma resposta errada com cara de certa.
 *
 * Para tabelas onde baixar tudo é caro demais (São Paulo tem mais de 100 mil
 * servidores), o caminho não é este componente: é gerar índices já recortados
 * no build (por ano, por órgão), de modo que o leitor baixe só a fatia do
 * recorte que escolheu. Isso está registrado como limite, não resolvido aqui.
 */

export interface ColunaTabela<T> {
  chave: keyof T & string;
  rotulo: string;
  /** Alinha à direita e usa `tabular-nums` — para dinheiro e contagem. */
  numerica?: boolean;
  formatar?: (linha: T) => React.ReactNode;
  ordenavel?: boolean;
  tipoOrdenacao?: TipoCampo;
  /** Largura CSS aplicada a th e td (ex: "min-w-[120px]", "w-[200px]"). */
  largura?: string;
}

export interface TabelaEstaticaProps<T> {
  /** Base do índice: `${base}/manifesto.json` e `${base}/<n>.json`. */
  base: string;
  colunas: ColunaTabela<T>[];
  /** Campos varridos pela busca. Vazio = sem campo de busca. */
  camposBusca?: (keyof T & string)[];
  porPagina?: number;
  /** Aparece quando o índice existe mas está vazio. */
  vazio?: string;
  /**
   * Filtro por coluna, aplicado ANTES da busca textual.
   *
   * ═══ POR QUE ESTE SLOT EXISTE ═══
   *
   * Sem ele o componente só sabia buscar texto e paginar, e as páginas do §3
   * perderiam o filtro que é a razão de existirem — `prefeitura/contratos` tem
   * nove parâmetros, e o que importa é o "somente com alerta" + motivo com
   * fundamentação jurídica. Trocar isso por uma caixa de busca não é converter
   * a página, é esvaziá-la.
   *
   * O estado do filtro mora em QUEM CHAMA (é ele que conhece as colunas); aqui
   * entra só o predicado. Envolva em `useCallback`, senão o `useMemo` abaixo
   * recalcula a cada render — o que numa tabela de 9.803 linhas se sente.
   */
  filtrar?: (linha: T) => boolean;
  /**
   * A UI do filtro, acima da tabela.
   *
   * É render prop, e não `ReactNode`, porque quem desenha o filtro precisa de
   * duas coisas que só este componente sabe: se todas as fatias já chegaram
   * (`pronto`) e quais linhas existem (para montar as opções a partir do dado
   * real, em vez de uma lista fixa que envelhece). Filtro habilitado antes da
   * última fatia esconderia linha que ainda não chegou — o mesmo motivo pelo
   * qual a busca fica desabilitada.
   */
  controles?: (ctx: { pronto: boolean; linhas: T[] }) => React.ReactNode;
}

type Estado = "carregando" | "pronto" | "erro";

interface OrdemAtiva {
  chave: string;
  direcao: Direcao;
}

const normalizar = (v: unknown) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const FORMATO_ORDEM = /^([a-z0-9_]+):(asc|desc)$/;

export default function TabelaEstatica<T extends Record<string, unknown>>({
  base,
  colunas,
  camposBusca = [],
  porPagina = 50,
  vazio = "Nenhum registro.",
  filtrar,
  controles,
}: TabelaEstaticaProps<T>) {
  const [linhas, setLinhas] = useState<T[]>([]);
  const [manifesto, setManifesto] = useState<ManifestoFatias | null>(null);
  const [estado, setEstado] = useState<Estado>("carregando");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [ordem, setOrdem] = useState<OrdemAtiva | null>(null);
  const primeiraRenderizacao = useRef(true);

  // Estado inicial vindo da URL, uma vez, depois da hidratação.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get("q");
    const p = Number(sp.get("page"));
    const o = sp.get("ordem");
// eslint-disable-next-line react-hooks/set-state-in-effect -- leitura pos-hidratacao de window.location/sessionStorage: useSearchParams quebra o output:'export' (padrao documentado em TabelaEstatica.tsx)
    if (q) setBusca(q);
    if (p > 1) setPagina(p);
    if (o) {
      const m = FORMATO_ORDEM.exec(o);
      if (m) setOrdem({ chave: m[1], direcao: m[2] as Direcao });
    }
  }, []);

  // Espelha o estado de volta na URL, sem entrar no histórico.
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const sp = new URLSearchParams(window.location.search);
    if (busca) {
      sp.set("q", busca);
    } else {
      sp.delete("q");
    }
    if (pagina > 1) {
      sp.set("page", String(pagina));
    } else {
      sp.delete("page");
    }
    if (ordem) {
      sp.set("ordem", `${ordem.chave}:${ordem.direcao}`);
    } else {
      sp.delete("ordem");
    }
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [busca, pagina, ordem]);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const r = await fetch(`${base}/manifesto.json`);
        if (!r.ok) throw new Error(`manifesto: HTTP ${r.status}`);
        const m: ManifestoFatias = await r.json();
        if (cancelado) return;
        setManifesto(m);
        if (m.fatias === 0) {
          setEstado("pronto");
          return;
        }
        // Em série, não em paralelo: a fatia 0 é o que o leitor vê primeiro, e
        // disputar banda com as outras 20 atrasaria justamente ela.
        for (let i = 0; i < m.fatias; i++) {
          const rf = await fetch(`${base}/${i}.json`);
          if (!rf.ok) throw new Error(`fatia ${i}: HTTP ${rf.status}`);
          const dados: T[] = await rf.json();
          if (cancelado) return;
          setLinhas((atual) => atual.concat(dados));
        }
        if (!cancelado) setEstado("pronto");
      } catch {
        if (!cancelado) setEstado("erro");
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [base]);

  const completo = estado === "pronto";

  // Ordenação ativa: a coluna vira chave, o tipo vem dela (ou o padrão).
  const ordemAtiva = useMemo(() => {
    if (!ordem) return null;
    const coluna = colunas.find((c) => c.chave === ordem.chave);
    if (!coluna) return null;
    return {
      chave: coluna.chave,
      direcao: ordem.direcao,
      tipo: coluna.tipoOrdenacao ?? (coluna.numerica ? "numero" : "texto"),
    } as const;
  }, [ordem, colunas]);

  const filtradas = useMemo(() => {
    // Filtro por coluna primeiro, busca textual depois: a busca varre string e
    // é a parte cara; reduzir o conjunto antes é o que mantém a digitação fluida
    // numa tabela de milhares de linhas. Ordenação por último, sobre o conjunto
    // já filtrado (ordenar antes de filtrar seria trabalho jogado fora).
    const base = filtrar ? linhas.filter(filtrar) : linhas;
    let resultado = base;
    if (busca.trim() && camposBusca.length > 0) {
      const alvo = normalizar(busca);
      resultado = base.filter((l) => camposBusca.some((c) => normalizar(l[c]).includes(alvo)));
    }
    if (ordemAtiva) {
      resultado = ordenarPor(resultado, ordemAtiva.chave, ordemAtiva.direcao, ordemAtiva.tipo);
    }
    return resultado;
  }, [linhas, busca, camposBusca, filtrar, ordemAtiva]);

  const alternarOrdem = (coluna: ColunaTabela<T>) => {
    setPagina(1);
    setOrdem((atual) => {
      // 1º clique ordena; 2º inverte; 3º devolve a ordem original do dado.
      if (atual?.chave !== coluna.chave) return { chave: coluna.chave, direcao: "asc" };
      if (atual.direcao === "asc") return { chave: coluna.chave, direcao: "desc" };
      return null;
    });
  };

  // Filtro novo pode deixar menos páginas que a atual; sem isto o leitor cai
  // numa página vazia e conclui que o filtro não achou nada.
  useEffect(() => {
// eslint-disable-next-line react-hooks/set-state-in-effect -- leitura pos-hidratacao de window.location/sessionStorage: useSearchParams quebra o output:'export' (padrao documentado em TabelaEstatica.tsx)
    setPagina(1);
  }, [filtrar]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtradas.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina);

  const carregadas = linhas.length;
  const totalLinhas = manifesto?.total ?? 0;

  if (estado === "erro") {
    return (
      <p className="mt-6 rounded-lg border border-[var(--cp-border)] p-5">
        Não foi possível carregar esta tabela. Recarregue a página; se persistir,
        o índice pode não ter sido publicado no último build.
      </p>
    );
  }

  if (completo && totalLinhas === 0) {
    return <p className="mt-6 rounded-lg border border-[var(--cp-border)] p-5 opacity-80">{vazio}</p>;
  }

  return (
    <div className="mt-6">
      {controles && <div className="mb-4">{controles({ pronto: completo, linhas })}</div>}
      {camposBusca.length > 0 && (
        <div className="flex flex-wrap items-baseline gap-3">
          <input
            type="search"
            value={busca}
            disabled={!completo}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(1);
            }}
            placeholder={completo ? "Buscar…" : "Carregando para poder buscar…"}
            aria-label="Buscar na tabela"
            className="w-full max-w-sm rounded-lg border border-border bg-surface px-3 py-2 text-sm disabled:opacity-60"
          />
          <p className="font-tabular text-xs text-text-soft" aria-live="polite">
            {completo
              ? `${filtradas.length.toLocaleString("pt-BR")} de ${totalLinhas.toLocaleString("pt-BR")}`
              : `${carregadas.toLocaleString("pt-BR")} de ${totalLinhas.toLocaleString("pt-BR")} carregadas`}
          </p>
        </div>
      )}

      {!completo && (
        // A busca fica desabilitada até tudo chegar (ver a nota no topo). Isto
        // explica o porquê em vez de deixar o leitor achando que travou.
        <p className="mt-2 text-xs text-text-soft">
          A busca cobre a tabela inteira, então ela abre quando todas as linhas
          terminarem de carregar. Enquanto isso dá para navegar o que já chegou.
        </p>
      )}

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <p className="mb-1 px-1 text-[10px] text-text-soft sm:hidden">
          ← deslize para ver mais colunas →
        </p>
        <table className="w-full min-w-[1400px] text-sm">
          <thead>
            <tr>
              {colunas.map((c) => {
                const podeOrdenar = c.ordenavel ?? !c.formatar;
                const ativa = ordemAtiva?.chave === c.chave;
                const rotulo = ativa
                  ? `${c.rotulo} (${ordemAtiva.direcao === "asc" ? "crescente" : "decrescente"})`
                  : c.rotulo;
                return (
                  <th
                    key={c.chave}
                    scope="col"
                    aria-sort={ativa ? (ordemAtiva.direcao === "asc" ? "ascending" : "descending") : "none"}
                    className={`whitespace-nowrap border-b border-border bg-surface px-3 py-2 text-xs uppercase tracking-wide text-text-soft ${
                      c.numerica ? "text-right" : "text-left"
                    } ${c.largura ?? ""}`}
                  >
                    {podeOrdenar ? (
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
                          {ativa ? (ordemAtiva.direcao === "asc" ? "▲" : "▼") : "⇅"}
                        </span>
                      </button>
                    ) : (
                      rotulo
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visiveis.map((linha, i) => (
              <tr key={i}>
                {colunas.map((c) => (
                  <td
                    key={c.chave}
                    className={`border-b border-border px-3 py-2 ${
                      c.numerica ? "text-right font-tabular" : "text-left"
                    } ${c.largura ?? ""}`}
                  >
                    {c.formatar ? c.formatar(linha) : String(linha[c.chave] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {completo && filtradas.length === 0 && (
        <p className="mt-4 text-sm text-text-soft">
          Nenhuma linha corresponde a “{busca}”. A busca cobre a tabela inteira —
          este resultado é definitivo, não parcial.
        </p>
      )}

      {totalPaginas > 1 && (
        <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Paginação">
          <button
            type="button"
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={paginaAtual <= 1}
            className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="font-tabular text-sm text-text-soft">
            {paginaAtual} de {totalPaginas}
          </span>
          <button
            type="button"
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={paginaAtual >= totalPaginas}
            className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40"
          >
            Próxima →
          </button>
        </nav>
      )}
    </div>
  );
}
