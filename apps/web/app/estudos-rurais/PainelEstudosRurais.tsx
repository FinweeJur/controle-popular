"use client";

import { useMemo, useState } from "react";
import { itensParaCsv, type ItemEstudoRural } from "@/lib/estudos-rurais/dados";
import { ordenarPor } from "@/lib/tabela/ordenar";
import type { Direcao } from "@/lib/tabela/ordenar";
import { semAcento } from "@/lib/busca/normalizar";

/**
 * Tabela de estudos rurais: busca, filtro por tipo/ano/fonte, ordenação por
 * coluna e CSV do que estiver FILTRADO na tela.
 *
 * ═══ POR QUE É COMPONENTE DE CLIENTE ═══
 *
 * Mesmo padrão de `PainelTac.tsx` (`/ambiental/tac`): a página (servidor)
 * carrega só agregados; a lista item a item, buscável, mora aqui. Com 60
 * itens da primeira rodada o payload é pequeno — e o teto é ~2 mil linhas
 * (AGENTS.md): acima disso a coleção sai daqui e passa para índice fatiado
 * (`TabelaEstatica`). O tamanho é verificado por teste, não por memória.
 *
 * Ordenação e filtro usam `lib/tabela/ordenar` — lógica pura, testada, a
 * mesma régua do resto do portal (sem acento, sem caixa, ausentes no fim).
 */

const TODOS = "";
const POR_PAGINA = 20;

const ROTULO_TIPO: Record<string, string> = {
  noticia: "Notícia",
  artigo: "Artigo",
  evento: "Evento",
  publicacao: "Publicação",
};

interface Coluna {
  chave: "data" | "titulo" | "tipo" | "fonte";
  rotulo: string;
  tipo: "data" | "texto";
}

const COLUNAS: Coluna[] = [
  { chave: "data", rotulo: "Data", tipo: "data" },
  { chave: "titulo", rotulo: "Título", tipo: "texto" },
  { chave: "tipo", rotulo: "Tipo", tipo: "texto" },
  { chave: "fonte", rotulo: "Fonte", tipo: "texto" },
];

const dataBR = (iso: string | null) => {
  if (!iso || Number.isNaN(Date.parse(iso))) return "—";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
};

export default function PainelEstudosRurais({
  itens,
  fontes,
  tipos,
  anos,
}: {
  itens: ItemEstudoRural[];
  fontes: string[];
  tipos: { tipo: string; rotulo: string }[];
  anos: number[];
}) {
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState(TODOS);
  const [ano, setAno] = useState(TODOS);
  const [fonte, setFonte] = useState(TODOS);
  const [ordem, setOrdem] = useState<{ chave: Coluna["chave"]; direcao: Direcao } | null>(null);
  const [mostrando, setMostrando] = useState(POR_PAGINA);

  const filtrados = useMemo(() => {
    const termo = semAcento(busca.trim());
    let lista = itens.filter((i) => {
      if (tipo && i.tipo !== tipo) return false;
      if (ano && !(i.data && i.data.startsWith(`${ano}-`))) return false;
      if (fonte && i.fonte !== fonte) return false;
      if (!termo) return true;
      return (
        semAcento(i.titulo).includes(termo) ||
        semAcento(i.resumo).includes(termo) ||
        semAcento(i.fonte).includes(termo)
      );
    });
    if (ordem) {
      lista = ordenarPor(lista, ordem.chave, ordem.direcao, ordem.chave === "data" ? "data" : "texto");
    }
    return lista;
  }, [itens, busca, tipo, ano, fonte, ordem]);

  const temFiltro = Boolean(busca || tipo || ano || fonte);
  const visiveis = filtrados.slice(0, mostrando);

  function exportar() {
    const hoje = new Date().toISOString().slice(0, 10);
    const blob = new Blob([itensParaCsv(filtrados)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `estudos-rurais-${hoje}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function alternarOrdem(coluna: Coluna) {
    setMostrando(POR_PAGINA);
    setOrdem((atual) => {
      if (atual?.chave !== coluna.chave) return { chave: coluna.chave, direcao: "asc" };
      if (atual.direcao === "asc") return { chave: coluna.chave, direcao: "desc" };
      return null;
    });
  }

  const seletor =
    "rounded-lg border border-border bg-surface px-3 py-2 text-sm max-w-[220px] truncate";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Filtros da tabela">
        <input
          type="search"
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setMostrando(POR_PAGINA);
          }}
          placeholder="Buscar por título, resumo ou fonte…"
          aria-label="Buscar na tabela"
          className="w-full max-w-sm rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
        <select
          value={tipo}
          onChange={(e) => {
            setTipo(e.target.value);
            setMostrando(POR_PAGINA);
          }}
          aria-label="Filtrar por tipo"
          className={seletor}
        >
          <option value={TODOS}>Tipo: todos</option>
          {tipos.map((t) => (
            <option key={t.tipo} value={t.tipo}>
              {t.rotulo}
            </option>
          ))}
        </select>
        <select
          value={ano}
          onChange={(e) => {
            setAno(e.target.value);
            setMostrando(POR_PAGINA);
          }}
          aria-label="Filtrar por ano"
          className={seletor}
        >
          <option value={TODOS}>Ano: todos</option>
          {anos.map((a) => (
            <option key={a} value={String(a)}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={fonte}
          onChange={(e) => {
            setFonte(e.target.value);
            setMostrando(POR_PAGINA);
          }}
          aria-label="Filtrar por fonte"
          className={seletor}
        >
          <option value={TODOS}>Fonte: todas</option>
          {fontes.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={exportar}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-2"
        >
          Baixar CSV do recorte ({filtrados.length.toLocaleString("pt-BR")})
        </button>
        {temFiltro && (
          <button
            type="button"
            onClick={() => {
              setBusca("");
              setTipo(TODOS);
              setAno(TODOS);
              setFonte(TODOS);
              setMostrando(POR_PAGINA);
            }}
            className="text-sm text-text-soft underline underline-offset-2 hover:text-text"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <p className="mt-3 font-tabular text-xs text-text-soft" aria-live="polite">
        {filtrados.length.toLocaleString("pt-BR")} de {itens.length.toLocaleString("pt-BR")} itens
      </p>

      <div className="mt-3 overflow-x-auto rounded-lg border border-border">
        <p className="mb-1 px-1 pt-1 text-[10px] text-text-soft sm:hidden">
          ← deslize para ver mais colunas →
        </p>
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr>
              {COLUNAS.map((c) => {
                const ativa = ordem?.chave === c.chave;
                return (
                  <th
                    key={c.chave}
                    scope="col"
                    aria-sort={ativa ? (ordem.direcao === "asc" ? "ascending" : "descending") : "none"}
                    className="whitespace-nowrap border-b border-border bg-surface px-3 py-2 text-left text-xs uppercase tracking-wide text-text-soft"
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
                        {ativa ? (ordem.direcao === "asc" ? "▲" : "▼") : "⇅"}
                      </span>
                    </button>
                  </th>
                );
              })}
              <th scope="col" className="border-b border-border bg-surface px-3 py-2 text-xs uppercase tracking-wide text-text-soft">
                Link
              </th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((i) => (
              <tr key={i.id} className="border-b border-border/60 align-top">
                <td className="whitespace-nowrap px-3 py-2 font-tabular text-text-soft">
                  {dataBR(i.data)}
                </td>
                <td className="px-3 py-2">
                  <span className="font-medium text-text">{i.titulo}</span>
                  {i.resumo && (
                    <span className="mt-1 block text-[.88em] text-text-soft">{i.resumo}</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <span className="rounded-full border border-border px-2 py-0.5 text-[.8em] text-text-soft">
                    {ROTULO_TIPO[i.tipo] ?? i.tipo}
                  </span>
                </td>
                <td className="px-3 py-2 text-text-soft">{i.fonte}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <a
                    href={i.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text underline underline-offset-2"
                  >
                    ver na fonte ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtrados.length === 0 && (
        <p className="mt-4 text-sm text-text-soft">
          Nenhum item corresponde aos filtros. Isto cobre o acervo inteiro — o resultado é
          definitivo, não parcial.
        </p>
      )}

      {filtrados.length > mostrando && (
        <button
          type="button"
          onClick={() => setMostrando((m) => m + POR_PAGINA)}
          className="mt-4 rounded-lg border border-border px-4 py-2 text-sm"
        >
          Mostrar mais {Math.min(POR_PAGINA, filtrados.length - mostrando)} de{" "}
          {(filtrados.length - mostrando).toLocaleString("pt-BR")} restantes
        </button>
      )}
    </div>
  );
}
