"use client";

import { useMemo, useState } from "react";
import type { Dispositivo, TipoDireito } from "@/lib/direitos-globais/tipos";
import { semAcento } from "@/lib/busca/normalizar";
import { Filter, Search, RotateCcw } from "lucide-react";

/**
 * Catálogo dos 24 temas prioritários com rótulo amigável em português.
 */
export const ROTULO_DIREITO: Record<TipoDireito, string> = {
  humanos: "Direitos humanos",
  ambiental: "Meio ambiente",
  mulheres: "Mulheres",
  natureza: "Natureza",
  politicos: "Políticos",
  criancas: "Crianças",
  indigenas: "Povos indígenas",
  quilombolas: "Quilombolas e Afrodescendentes",
  campesinos: "Campesinos e Reforma Agrária",
  coletivos: "Coletivos",
  atingidos_barragens: "Atingidos por barragens",
  atingidos_empreendimentos: "Atingidos por empreendimentos",
  povos: "Direitos dos povos",
  idosos: "Pessoas idosas",
  deficiencia: "Pessoas com deficiência",
  lgbtqia: "Pessoas LGBTQIA+",
  migrantes_refugiados: "Migrantes e refugiados",
  trabalho: "Trabalho digno",
  saude: "Saúde",
  educacao: "Educação",
  moradia: "Moradia",
  agua: "Água e saneamento",
  terra_territorio: "Terra e território",
  memoria_verdade_justica: "Memória, verdade e justiça",
};

const LIMITE_CURTO = 280;

export function etiquetaDireito(tipo: TipoDireito): string {
  return ROTULO_DIREITO[tipo] ?? tipo;
}

function filtrarDispositivo(d: Dispositivo, tema: string, termo: string): boolean {
  if (d.em_coleta || d.citacao === "nao_encontrado") return false;
  if (tema !== "todos" && d.tipo !== tema) return false;
  if (!termo) return true;
  const texto = semAcento(`${d.pais} ${d.citacao} ${d.titulo} ${d.texto} ${d.tipo}`.toLowerCase());
  return texto.includes(termo);
}

interface BarraFiltroTemaProps {
  busca: string;
  setBusca: (v: string) => void;
  temaSelecionado: string;
  setTemaSelecionado: (v: string) => void;
  temasDisponiveis: [TipoDireito, number][];
  totalDispositivos: number;
}

function BarraFiltroTema({
  busca,
  setBusca,
  temaSelecionado,
  setTemaSelecionado,
  temasDisponiveis,
  totalDispositivos,
}: BarraFiltroTemaProps) {
  const temFiltroAtivo = temaSelecionado !== "todos" || busca.length > 0;

  return (
    <div className="mb-5 space-y-3 rounded-xl border border-border bg-surface p-3.5 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-soft" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por país, artigo, palavra..."
            className="w-full rounded-lg border border-border bg-surface-2 py-1.5 pl-8 pr-3 text-xs text-text placeholder:text-text-soft focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-text-soft" />
          <select
            value={temaSelecionado}
            onChange={(e) => setTemaSelecionado(e.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-text focus:border-primary focus:outline-none"
            aria-label="Filtrar por tema"
          >
            <option value="todos">Todos os temas ({totalDispositivos})</option>
            {temasDisponiveis.map(([tipo, qtd]) => (
              <option key={tipo} value={tipo}>
                {etiquetaDireito(tipo)} ({qtd})
              </option>
            ))}
          </select>

          {temFiltroAtivo && (
            <button
              type="button"
              onClick={() => {
                setTemaSelecionado("todos");
                setBusca("");
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs text-text-soft hover:bg-surface-2 hover:text-text"
              title="Limpar filtros"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <button
          type="button"
          onClick={() => setTemaSelecionado("todos")}
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
            temaSelecionado === "todos"
              ? "bg-primary text-white"
              : "bg-surface-2 text-text-soft hover:bg-border/60 hover:text-text"
          }`}
        >
          Todos
        </button>
        {temasDisponiveis.slice(0, 8).map(([tipo, qtd]) => (
          <button
            key={tipo}
            type="button"
            onClick={() => setTemaSelecionado(tipo)}
            className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
              temaSelecionado === tipo
                ? "bg-primary text-white"
                : "bg-surface-2 text-text-soft hover:bg-border/60 hover:text-text"
            }`}
          >
            {etiquetaDireito(tipo)} ({qtd})
          </button>
        ))}
      </div>
    </div>
  );
}

function EstadoVazioDispositivos({ onLimpar }: { onLimpar: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface-2 p-8 text-center">
      <p className="text-sm font-medium text-text">
        Nenhum dispositivo encontrado com os filtros atuais.
      </p>
      <p className="mt-1 text-xs text-text-soft">
        Tente remover a busca ou selecionar outro tema do catálogo.
      </p>
      <button
        type="button"
        onClick={onLimpar}
        className="mt-3 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
      >
        Ver todos os dispositivos
      </button>
    </div>
  );
}

/**
 * Seção completa de dispositivos constitucionais com filtro por tema e busca.
 */
export function SecaoDispositivosComFiltro({
  dispositivos,
  titulo = "Dispositivos constitucionais conferidos",
  descricao = "Artigos transcritos integralmente com fonte e data de acesso.",
}: {
  dispositivos: readonly Dispositivo[];
  titulo?: string;
  descricao?: string;
}) {
  const [temaSelecionado, setTemaSelecionado] = useState<string>("todos");
  const [busca, setBusca] = useState<string>("");

  const temasDisponiveis = useMemo(() => {
    const contagem = new Map<TipoDireito, number>();
    for (const d of dispositivos) {
      if (!d.em_coleta && d.citacao !== "nao_encontrado") {
        contagem.set(d.tipo, (contagem.get(d.tipo) ?? 0) + 1);
      }
    }
    return Array.from(contagem.entries()).sort((a, b) => b[1] - a[1]);
  }, [dispositivos]);

  const dispositivosFiltrados = useMemo(() => {
    const termo = semAcento(busca.trim().toLowerCase());
    return dispositivos.filter((d) => filtrarDispositivo(d, temaSelecionado, termo));
  }, [dispositivos, temaSelecionado, busca]);

  const paisesAgrupados = useMemo(() => {
    const mapa = new Map<string, Dispositivo[]>();
    for (const d of dispositivosFiltrados) {
      const lista = mapa.get(d.pais) ?? [];
      lista.push(d);
      mapa.set(d.pais, lista);
    }
    return Array.from(mapa.entries()).sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
  }, [dispositivosFiltrados]);

  function limparFiltros() {
    setTemaSelecionado("todos");
    setBusca("");
  }

  const totalAtivos = dispositivos.filter((d) => !d.em_coleta).length;

  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-text">{titulo}</h2>
        <p className="mt-1 text-xs text-text-soft">{descricao}</p>
      </div>

      <BarraFiltroTema
        busca={busca}
        setBusca={setBusca}
        temaSelecionado={temaSelecionado}
        setTemaSelecionado={setTemaSelecionado}
        temasDisponiveis={temasDisponiveis}
        totalDispositivos={totalAtivos}
      />

      {paisesAgrupados.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {paisesAgrupados.map(([pais, itens]) => (
            <ListaDispositivos key={pais} pais={pais} dispositivos={itens} />
          ))}
        </div>
      ) : (
        <EstadoVazioDispositivos onLimpar={limparFiltros} />
      )}
    </section>
  );
}

export function ListaDispositivos({
  pais,
  dispositivos,
}: {
  pais: string;
  dispositivos: readonly Dispositivo[];
}) {
  return (
    <article className="rounded-xl border border-border bg-surface p-4 sm:p-4.5">
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-1.5 border-b border-border/50 pb-2">
        <h3 className="text-base font-semibold text-text">{pais}</h3>
        <span className="text-xs text-text-soft">
          {dispositivos.length}{" "}
          {dispositivos.length === 1 ? "dispositivo" : "dispositivos"}
        </span>
      </header>
      <ul className="space-y-3.5">
        {dispositivos.map((d, idx) => (
          <li key={`${d.pais}-${d.citacao}-${idx}`}>
            <ItemDispositivo dispositivo={d} />
          </li>
        ))}
      </ul>
    </article>
  );
}

export function ItemDispositivo({ dispositivo }: { dispositivo: Dispositivo }) {
  const curto = dispositivo.texto.length <= LIMITE_CURTO;
  const isLacuna = dispositivo.em_coleta || dispositivo.citacao === "nao_encontrado";

  return (
    <div className="border-l-2 border-primary/50 pl-3">
      <div className="mb-1 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {etiquetaDireito(dispositivo.tipo)}
        </span>
        <span className="text-xs font-bold text-text">{dispositivo.citacao}</span>
        {isLacuna && (
          <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
            Lacuna declarada
          </span>
        )}
      </div>

      {dispositivo.titulo ? (
        <p className="mb-1 text-xs font-semibold text-text">{dispositivo.titulo}</p>
      ) : null}

      {curto ? (
        <TextoDispositivo texto={dispositivo.texto} />
      ) : (
        <details className="group">
          <summary className="cursor-pointer list-none text-xs font-semibold text-primary underline-offset-2 hover:underline">
            Ver texto integral do artigo
          </summary>
          <div className="mt-1.5 rounded bg-surface-2 p-2">
            <TextoDispositivo texto={dispositivo.texto} />
          </div>
        </details>
      )}

      {dispositivo.traducao ? (
        <p className="mt-1 text-xs text-text-soft italic">{dispositivo.traducao}</p>
      ) : null}

      {dispositivo.lacuna ? (
        <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
          Nota de lacuna: {dispositivo.lacuna}
        </p>
      ) : null}

      <p className="mt-1.5 text-xs text-text-soft">
        Fonte:{" "}
        <a
          href={dispositivo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-2 hover:underline"
        >
          {dispositivo.fonte}
        </a>
        {" · "}
        acesso em {dispositivo.dataAcesso}
      </p>
    </div>
  );
}

function TextoDispositivo({ texto }: { texto: string }) {
  return (
    <p className="whitespace-pre-line text-xs leading-relaxed text-text-soft">
      {texto}
    </p>
  );
}
