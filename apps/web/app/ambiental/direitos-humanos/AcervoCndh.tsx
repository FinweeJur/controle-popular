"use client";

/**
 * @file AcervoCndh.tsx
 * @description Lista sob demanda do acervo do CNDH no Brasil Participativo
 * (recomendações, notas públicas, resoluções, relatórios, editais e termos).
 *
 * POR QUE SOB DEMANDA: o catálogo tem ~950 itens e ~350 KB de JSON. Carregar
 * isso no HTML de `/ambiental/direitos-humanos` pesaria toda visita; aqui o
 * arquivo só é buscado quando o leitor pede, e a lista é filtrada no cliente.
 *
 * FONTE: `public/data/cndh-midia.json`, gerado por
 * `scripts/coletar-cndh-midia.mjs` a partir da página oficial. Os links vão
 * direto ao arquivo publicado pelo Conselho, em aba nova.
 */

import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";

interface ItemCndh {
  titulo: string;
  tipo: string;
  url: string;
}

interface DadosCndh {
  fonte: string;
  coletadoEm: string;
  total: number;
  itens: ItemCndh[];
}

const normalizar = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** Teto de itens desenhados por vez: rolagem longa sem milhares de nós. */
const LOTE = 120;

/** Enquanto o JSON não chegou: botão de carga e o erro, se houver. */
function EstadoInicial({
  carregando,
  erro,
  aoCarregar,
}: {
  carregando: boolean;
  erro: string | null;
  aoCarregar: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-sm leading-relaxed text-text-soft">
        O Conselho publica recomendações, notas públicas, resoluções,
        relatórios e editais na plataforma Brasil Participativo. O catálogo
        completo está a um clique.
      </p>
      <button
        type="button"
        onClick={aoCarregar}
        disabled={carregando}
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-ink hover:opacity-90 disabled:opacity-60"
      >
        <Download size={16} aria-hidden="true" />
        {carregando ? "Carregando…" : "Carregar o acervo do CNDH"}
      </button>
      {erro ? (
        <p role="alert" className="mt-2 text-sm text-alert">
          {erro}
        </p>
      ) : null}
    </div>
  );
}

/** Busca por título e filtro por tipo. */
function BarraFiltros({
  busca,
  tipo,
  tipos,
  aoBuscar,
  aoTrocarTipo,
}: {
  busca: string;
  tipo: string;
  tipos: [string, number][];
  aoBuscar: (valor: string) => void;
  aoTrocarTipo: (valor: string) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <label className="relative flex min-w-[220px] flex-1 items-center">
        <Search
          className="pointer-events-none absolute left-3 h-4 w-4 text-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          value={busca}
          onChange={(e) => aoBuscar(e.target.value)}
          placeholder="Buscar por título (ex.: reconhecimento facial)…"
          aria-label="Buscar no acervo do CNDH"
          className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
        />
      </label>
      <select
        value={tipo}
        onChange={(e) => aoTrocarTipo(e.target.value)}
        aria-label="Filtrar por tipo de documento"
        className="rounded-lg border border-border bg-surface px-2 py-2 text-sm text-text"
      >
        <option value="todos">Todos os tipos</option>
        {tipos.map(([nome, quantidade]) => (
          <option key={nome} value={nome}>
            {nome} ({quantidade})
          </option>
        ))}
      </select>
    </div>
  );
}

/** Itens filtrados, com o aviso de busca vazia. */
function ListaItens({ itens, busca }: { itens: ItemCndh[]; busca: string }) {
  if (itens.length === 0) {
    return (
      <p className="mt-3 text-sm text-text-soft">
        Nenhum documento corresponde a “{busca}”.
      </p>
    );
  }
  return (
    <ul className="mt-4 divide-y divide-border/60">
      {itens.map((item) => (
        <li key={item.url} className="py-2">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start justify-between gap-3 text-sm text-text hover:text-primary"
          >
            <span className="min-w-0">{item.titulo}</span>
            <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-text-soft">
              {item.tipo}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Contagem por tipo, da maior para a menor (alimenta o filtro). */
function contarTipos(itens: ItemCndh[]): [string, number][] {
  const contagem = new Map<string, number>();
  for (const item of itens) {
    contagem.set(item.tipo, (contagem.get(item.tipo) ?? 0) + 1);
  }
  return [...contagem.entries()].sort((a, b) => b[1] - a[1]);
}

/** Aplica busca e tipo, sem tocar no estado. */
function filtrarItens(itens: ItemCndh[], busca: string, tipo: string): ItemCndh[] {
  const alvo = normalizar(busca.trim());
  return itens.filter((item) => {
    if (tipo !== "todos" && item.tipo !== tipo) return false;
    if (!alvo) return true;
    return normalizar(`${item.titulo} ${item.tipo}`).includes(alvo);
  });
}

export default function AcervoCndh() {
  const [dados, setDados] = useState<DadosCndh | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [limite, setLimite] = useState(LOTE);

  const tipos = useMemo<[string, number][]>(
    () => (dados ? contarTipos(dados.itens) : []),
    [dados],
  );

  const filtrados = useMemo(
    () => (dados ? filtrarItens(dados.itens, busca, tipo) : []),
    [dados, busca, tipo],
  );

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await fetch("/data/cndh-midia.json");
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      setDados((await resposta.json()) as DadosCndh);
    } catch {
      setErro("Não foi possível carregar o acervo agora. Tente de novo.");
    } finally {
      setCarregando(false);
    }
  }

  if (!dados) {
    return (
      <EstadoInicial carregando={carregando} erro={erro} aoCarregar={() => void carregar()} />
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-text">
          {filtrados.length} de {dados.total} documentos · coletado em {dados.coletadoEm}
        </p>
        <a
          href={dados.fonte}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-primary hover:underline"
        >
          abrir a página oficial ↗
        </a>
      </div>

      <BarraFiltros
        busca={busca}
        tipo={tipo}
        tipos={tipos}
        aoBuscar={(valor) => {
          setBusca(valor);
          setLimite(LOTE);
        }}
        aoTrocarTipo={(valor) => {
          setTipo(valor);
          setLimite(LOTE);
        }}
      />

      <ListaItens itens={filtrados.slice(0, limite)} busca={busca} />

      {filtrados.length > limite ? (
        <button
          type="button"
          onClick={() => setLimite((n) => n + LOTE)}
          className="mt-3 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-soft hover:border-primary hover:text-primary"
        >
          Mostrar mais {Math.min(LOTE, filtrados.length - limite)}
        </button>
      ) : null}
    </div>
  );
}
