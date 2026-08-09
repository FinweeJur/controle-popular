"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ManifestoFatias } from "@/lib/estatico/fatiar";

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
}

type Estado = "carregando" | "pronto" | "erro";

const normalizar = (v: unknown) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export default function TabelaEstatica<T extends Record<string, unknown>>({
  base,
  colunas,
  camposBusca = [],
  porPagina = 50,
  vazio = "Nenhum registro.",
}: TabelaEstaticaProps<T>) {
  const [linhas, setLinhas] = useState<T[]>([]);
  const [manifesto, setManifesto] = useState<ManifestoFatias | null>(null);
  const [estado, setEstado] = useState<Estado>("carregando");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const primeiraRenderizacao = useRef(true);

  // Estado inicial vindo da URL, uma vez, depois da hidratação.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get("q");
    const p = Number(sp.get("page"));
    if (q) setBusca(q);
    if (p > 1) setPagina(p);
  }, []);

  // Espelha o estado de volta na URL, sem entrar no histórico.
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const sp = new URLSearchParams(window.location.search);
    busca ? sp.set("q", busca) : sp.delete("q");
    pagina > 1 ? sp.set("page", String(pagina)) : sp.delete("page");
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [busca, pagina]);

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

  const filtradas = useMemo(() => {
    if (!busca.trim() || camposBusca.length === 0) return linhas;
    const alvo = normalizar(busca);
    return linhas.filter((l) => camposBusca.some((c) => normalizar(l[c]).includes(alvo)));
  }, [linhas, busca, camposBusca]);

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
        <table className="w-full text-sm">
          <thead>
            <tr>
              {colunas.map((c) => (
                <th
                  key={c.chave}
                  scope="col"
                  className={`whitespace-nowrap border-b border-border bg-surface px-3 py-2 text-xs uppercase tracking-wide text-text-soft ${
                    c.numerica ? "text-right" : "text-left"
                  }`}
                >
                  {c.rotulo}
                </th>
              ))}
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
                    }`}
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
