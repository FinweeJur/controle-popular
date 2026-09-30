"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Pause, Play, Radio as IconeRadio, Search } from "lucide-react";
import {
  bandeiraDe,
  ORDEM_REGIOES,
  ORDEM_TIPOS,
  ROTULO_REGIAO,
  ROTULO_TIPO,
  type EstacaoRadio,
  type RegiaoRadio,
  type TipoRadio,
} from "@/lib/radio/estacoes";
import type { ColunaCsv } from "@/lib/tabela/csv";
import BotoesExportar from "@/app/components/BotoesExportar";
import LogoRadio from "@/app/components/LogoRadio";
import { EVENTO_ESTADO, pedirTocao, type EstadoRadio } from "@/lib/radio/eventos";

/**
 * Painel da página `/radio`: busca, filtros por país/tipo/região, ordenação,
 * exportação e o botão de tocar de cada estação.
 *
 * Segue as seis qualidades de dados (AGENTS § 8):
 * - 1 linkável: cada cartão abre o site oficial e mostra a origem do dado;
 * - 2 buscável/filtrável: busca tolerante a acentos + facetas reais;
 * - 3 ordenável: por nome, país, tipo, região e frequência;
 * - 4 resumo: os cartões de topo vêm do `resumirEstacoes`, não daqui;
 * - 5 chatbot/CSV/print: o CSV sai do que está filtrado na tela (com BOM e `;`),
 *   e o "Ouvir/Imprimir" é do portal.
 *
 * Preparado para o volume baixo do acervo (~26 estações): filtra em memória, sem
 * paginação nem índice fatiado (o corte do § 5.1 é para milhares de linhas).
 */

type Ordem = "nome" | "nome-desc" | "pais" | "tipo" | "regiao" | "frequencia";

const ORDENS: { valor: Ordem; rotulo: string }[] = [
  { valor: "tipo", rotulo: "Categoria" },
  { valor: "regiao", rotulo: "Região" },
  { valor: "pais", rotulo: "País (A–Z)" },
  { valor: "nome", rotulo: "Nome (A–Z)" },
  { valor: "nome-desc", rotulo: "Nome (Z–A)" },
  { valor: "frequencia", rotulo: "Frequência" },
];

/** Normaliza para busca tolerante a acentos e caixa. */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const COLUNAS_CSV: ColunaCsv<EstacaoRadio>[] = [
  { chave: "nome", rotulo: "Nome" },
  { chave: "tipo", rotulo: "Categoria", formatar: (_v, l) => ROTULO_TIPO[l.tipo] },
  { chave: "regiao", rotulo: "Região", formatar: (_v, l) => ROTULO_REGIAO[l.regiao] },
  { chave: "paisNome", rotulo: "País" },
  { chave: "uf", rotulo: "UF" },
  { chave: "cidade", rotulo: "Cidade" },
  { chave: "frequencia", rotulo: "Frequência" },
  { chave: "programacao", rotulo: "Programação" },
  { chave: "formato", rotulo: "Formato do stream" },
  { chave: "stream", rotulo: "Stream" },
  { chave: "site", rotulo: "Site oficial" },
  { chave: "verificadoEm", rotulo: "Verificado em" },
];

export interface PainelRadioProps {
  estacoes: readonly EstacaoRadio[];
}

export default function PainelRadio({ estacoes }: PainelRadioProps) {
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<TipoRadio | "todos">("todos");
  const [regiao, setRegiao] = useState<RegiaoRadio | "todas">("todas");
  const [pais, setPais] = useState<string>("todos");
  const [ordem, setOrdem] = useState<Ordem>("tipo");
  const [estado, setEstado] = useState<EstadoRadio>({
    id: null,
    tocando: false,
    carregando: false,
  });

  // O player publica o estado; os cartões marcam o que está no ar.
  useEffect(() => {
    const aoEstado = (ev: Event) => {
      const d = (ev as CustomEvent<EstadoRadio>).detail;
      if (d) setEstado(d);
    };
    window.addEventListener(EVENTO_ESTADO, aoEstado);
    return () => window.removeEventListener(EVENTO_ESTADO, aoEstado);
  }, []);

  const paises = useMemo(() => {
    const mapa = new Map<string, { nome: string; total: number }>();
    for (const e of estacoes) {
      const atual = mapa.get(e.pais) ?? { nome: e.paisNome, total: 0 };
      atual.total += 1;
      mapa.set(e.pais, atual);
    }
    return [...mapa.entries()]
      .map(([codigo, v]) => ({ codigo, ...v }))
      .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, "pt-BR"));
  }, [estacoes]);

  const filtradas = useMemo(() => {
    const termo = normalizar(busca);
    let lista = estacoes.filter((e) => {
      if (tipo !== "todos" && e.tipo !== tipo) return false;
      if (regiao !== "todas" && e.regiao !== regiao) return false;
      if (pais !== "todos" && e.pais !== pais) return false;
      if (!termo) return true;
      const alvo = normalizar(
        [e.nome, e.cidade, e.uf, e.paisNome, e.programacao, e.descricao]
          .filter(Boolean)
          .join(" "),
      );
      return termo.split(/\s+/).every((t) => alvo.includes(t));
    });

    const porTipo = (x: EstacaoRadio) => ORDEM_TIPOS.indexOf(x.tipo);
    const porRegiao = (x: EstacaoRadio) => ORDEM_REGIOES.indexOf(x.regiao);

    lista = [...lista].sort((a, b) => {
      switch (ordem) {
        case "nome":
          return a.nome.localeCompare(b.nome, "pt-BR");
        case "nome-desc":
          return b.nome.localeCompare(a.nome, "pt-BR");
        case "pais":
          return a.paisNome.localeCompare(b.paisNome, "pt-BR") || porTipo(a) - porTipo(b);
        case "regiao":
          return porRegiao(a) - porRegiao(b) || porTipo(a) - porTipo(b);
        case "frequencia":
          return (a.frequencia ?? "\uffff").localeCompare(b.frequencia ?? "\uffff", "pt-BR");
        case "tipo":
        default:
          return (
            porTipo(a) - porTipo(b) ||
            porRegiao(a) - porRegiao(b) ||
            a.nome.localeCompare(b.nome, "pt-BR")
          );
      }
    });
    return lista;
  }, [estacoes, busca, tipo, regiao, pais, ordem]);

  const limpar = () => {
    setBusca("");
    setTipo("todos");
    setRegiao("todas");
    setPais("todos");
  };

  const filtroAtivo =
    busca.trim() !== "" || tipo !== "todos" || regiao !== "todas" || pais !== "todos";

  return (
    <section aria-label="Lista de estações de rádio" className="space-y-4">
      {/* Controles: busca + facetas + ordenação */}
      <div className="rounded-2xl border border-border bg-surface-2 p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          <label className="relative block">
            <span className="sr-only">Buscar estação por nome, cidade ou programação</span>
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-soft"
            />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, cidade ou programação (ex.: cumbia, reggae, UFMG)"
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text placeholder:text-text-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-medium text-text-soft">
              Categoria
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoRadio | "todos")}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-text"
              >
                <option value="todos">Todas as categorias</option>
                {ORDEM_TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {ROTULO_TIPO[t]}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-text-soft">
              Região
              <select
                value={regiao}
                onChange={(e) => setRegiao(e.target.value as RegiaoRadio | "todas")}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-text"
              >
                <option value="todas">Todas as regiões</option>
                {ORDEM_REGIOES.map((r) => (
                  <option key={r} value={r}>
                    {ROTULO_REGIAO[r]}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-text-soft">
              País
              <select
                value={pais}
                onChange={(e) => setPais(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-text"
              >
                <option value="todos">Todos os países</option>
                {paises.map((p) => (
                  <option key={p.codigo} value={p.codigo}>
                    {bandeiraDe(p.codigo)} {p.nome} ({p.total})
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-text-soft">
              Ordenar por
              <select
                value={ordem}
                onChange={(e) => setOrdem(e.target.value as Ordem)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-text"
              >
                {ORDENS.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.rotulo}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p aria-live="polite" className="text-sm text-text-soft">
              <strong className="text-text">{filtradas.length}</strong>{" "}
              {filtradas.length === 1 ? "estação" : "estações"} na tela
              {filtroAtivo ? " (com filtro)" : ""}.
              {filtroAtivo && (
                <button
                  type="button"
                  onClick={limpar}
                  className="ml-2 font-semibold text-primary hover:underline"
                >
                  limpar filtros
                </button>
              )}
            </p>
            <BotoesExportar
              dados={filtradas}
              colunas={COLUNAS_CSV}
              nomeArquivo="radio-controle-popular"
            />
          </div>
        </div>
      </div>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface p-6 text-center text-sm text-text-soft">
          Nenhuma estação atende a esses filtros. Tente outra palavra ou{" "}
          <button type="button" onClick={limpar} className="font-semibold text-primary hover:underline">
            limpar os filtros
          </button>
          .
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtradas.map((e) => {
            const ativa = estado.id === e.id;
            const tocando = ativa && estado.tocando;
            return (
              <li
                key={e.id}
                className={`flex flex-col gap-3 rounded-2xl border bg-surface p-4 transition-colors ${
                  tocando ? "border-primary" : "border-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  <LogoRadio estacao={e} tamanho={44} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold leading-snug text-text">{e.nome}</span>
                      <span title={e.paisNome} aria-label={`País: ${e.paisNome}`}>
                        {bandeiraDe(e.pais)}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-text-soft">
                      {ROTULO_TIPO[e.tipo]} · {e.cidade ?? e.paisNome}
                      {e.frequencia ? ` · ${e.frequencia}` : ""}
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-snug text-text-soft">{e.descricao}</p>
                <p className="text-xs text-text-soft">
                  <span className="font-medium text-text">Toca:</span> {e.programacao}
                </p>

                <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => pedirTocao(e.id)}
                    aria-label={tocando ? `Pausar ${e.nome}` : `Tocar ${e.nome}`}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
                      tocando
                        ? "border border-primary bg-primary/10 text-primary"
                        : "bg-primary text-white hover:opacity-90"
                    }`}
                  >
                    {tocando ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
                    {ativa && estado.carregando
                      ? "Sintonizando…"
                      : tocando
                        ? "Pausar"
                        : "Ouvir"}
                  </button>
                  <a
                    href={e.site}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <ExternalLink size={13} aria-hidden="true" />
                    Fonte oficial
                  </a>
                  {e.transcrevivel && (
                    <span
                      className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[0.7rem] text-text-soft"
                      title="Esta estação aceita transcrição ao vivo no navegador"
                    >
                      <IconeRadio size={11} aria-hidden="true" />
                      transcreve
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
