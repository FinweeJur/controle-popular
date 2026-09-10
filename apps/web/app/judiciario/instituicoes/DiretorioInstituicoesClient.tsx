"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Scale,
  ShieldCheck,
  HeartHandshake,
  Building,
  Landmark,
  Gavel,
  Filter,
  MapPin,
  Coins,
} from "lucide-react";

export interface InstituicaoSumario {
  sigla: string;
  nome: string;
  tipo: string;
  esfera: string;
  uf?: string;
  regiao?: string;
  cor: string;
  icone?: string;
  orcamento: {
    ano: number;
    total: string;
  };
  lideranca?: {
    cargo: string;
    nome: string;
  };
}

const REGIOES = ["Todas", "Sudeste", "Sul", "Nordeste", "Norte", "Centro-Oeste"];

const CATEGORIAS = [
  { valor: "todos", rotulo: "Todas as Instituições" },
  { valor: "tj", rotulo: "Tribunais de Justiça (TJs)" },
  { valor: "mp", rotulo: "Ministérios Públicos (MPs)" },
  { valor: "dp", rotulo: "Defensorias Públicas (DPs)" },
  { valor: "federal", rotulo: "Órgãos Federais & Controle" },
];

export default function DiretorioInstituicoesClient({
  instituicoes,
}: {
  instituicoes: InstituicaoSumario[];
}) {
  const [busca, setBusca] = useState("");
  const [regiaoAtiva, setRegiaoAtiva] = useState("Todas");
  const [categoriaAtiva, setCategoriaAtiva] = useState("todos");

  const filtradas = useMemo(() => {
    return instituicoes.filter((inst) => {
      // Filtro por regiao
      if (regiaoAtiva !== "Todas") {
        if (inst.regiao !== regiaoAtiva) return false;
      }

      // Filtro por categoria
      if (categoriaAtiva === "tj") {
        if (!inst.sigla.startsWith("tj")) return false;
      } else if (categoriaAtiva === "mp") {
        if (!inst.sigla.startsWith("mp")) return false;
      } else if (categoriaAtiva === "dp") {
        if (!inst.sigla.startsWith("dp")) return false;
      } else if (categoriaAtiva === "federal") {
        if (inst.esfera !== "Federal" && !["tcemg", "cnj", "cnmp"].includes(inst.sigla)) {
          return false;
        }
      }

      // Busca textual
      if (busca.trim() !== "") {
        const termo = busca.toLowerCase().trim();
        const naSigla = inst.sigla.toLowerCase().includes(termo);
        const noNome = inst.nome.toLowerCase().includes(termo);
        const noUf = (inst.uf || "").toLowerCase().includes(termo);
        const noLider = (inst.lideranca?.nome || "").toLowerCase().includes(termo);
        if (!naSigla && !noNome && !noUf && !noLider) return false;
      }

      return true;
    });
  }, [instituicoes, regiaoAtiva, categoriaAtiva, busca]);

  function obterIcone(sigla: string) {
    if (sigla.startsWith("tj")) return Scale;
    if (sigla.startsWith("mp")) return ShieldCheck;
    if (sigla.startsWith("dp")) return HeartHandshake;
    if (sigla.startsWith("tr")) return Gavel;
    return Landmark;
  }

  return (
    <div className="space-y-6">
      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Campo de Busca */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-soft"
          />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por sigla, estado ou órgão (ex: MPRJ, PA, TJRS, Defensoria)..."
            className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-xs text-text placeholder:text-text-soft focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
            aria-label="Buscar órgão de justiça"
          />
        </div>

        {/* Filtro por Categoria */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.valor}
              type="button"
              onClick={() => setCategoriaAtiva(cat.valor)}
              className={`rounded-lg px-2.5 py-1.5 font-medium transition-colors cursor-pointer ${
                categoriaAtiva === cat.valor
                  ? "bg-text text-bg font-bold shadow-2xs"
                  : "bg-surface border border-border text-text-soft hover:bg-surface-2"
              }`}
            >
              {cat.rotulo}
            </button>
          ))}
        </div>
      </div>

      {/* Abas de Regiões */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border/60 pb-3 text-xs">
        <span className="font-semibold text-text-soft mr-1 flex items-center gap-1">
          <MapPin size={13} aria-hidden="true" />
          Região:
        </span>
        {REGIOES.map((reg) => (
          <button
            key={reg}
            type="button"
            onClick={() => setRegiaoAtiva(reg)}
            className={`rounded-md px-2 py-1 transition-colors cursor-pointer ${
              regiaoAtiva === reg
                ? "bg-primary/15 text-primary font-bold"
                : "text-text-soft hover:text-text hover:bg-surface-2"
            }`}
          >
            {reg}
          </button>
        ))}
        <span className="ml-auto text-text-soft font-mono text-[11px]">
          {filtradas.length} órgãos encontrados
        </span>
      </div>

      {/* Grade de Cards das Instituições */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtradas.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-border p-12 text-center text-text-soft">
            Nenhuma instituição encontrada com os filtros selecionados.
          </div>
        ) : (
          filtradas.map((inst) => {
            const Icone = obterIcone(inst.sigla);
            return (
              <Link
                key={inst.sigla}
                href={`/judiciario/instituicoes/${inst.sigla}`}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 transition-all duration-150 hover:border-primary/60 hover:shadow-md hover:bg-surface-2/40"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${inst.cor || "#0284c7"} 15%, transparent)`,
                          color: inst.cor || "#0284c7",
                        }}
                      >
                        <Icone size={15} aria-hidden="true" />
                      </div>
                      <span className="font-mono text-xs font-black uppercase tracking-wider text-text group-hover:text-primary">
                        {inst.sigla.toUpperCase()}
                      </span>
                      {inst.uf && (
                        <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.9em] font-bold text-text-soft">
                          {inst.uf}
                        </span>
                      )}
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 font-mono text-[11px] font-bold"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${inst.cor || "#0284c7"} 15%, transparent)`,
                        color: inst.cor || "#0284c7",
                      }}
                    >
                      {inst.orcamento.total}
                    </span>
                  </div>

                  <h3 className="mt-3 font-display text-sm sm:text-base font-bold text-text group-hover:text-primary leading-snug">
                    {inst.nome}
                  </h3>
                  <p className="mt-1 text-xs text-text-soft">{inst.tipo}</p>

                  {inst.lideranca && (
                    <div className="mt-3 border-t border-border/50 pt-2 text-xs">
                      <span className="text-text-soft">{inst.lideranca.cargo}: </span>
                      <span className="font-semibold text-text truncate inline-block max-w-[190px] align-bottom">
                        {inst.lideranca.nome}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-2.5 text-xs font-bold text-primary">
                  <span>Ver painel completo & atos</span>
                  <span className="transition-transform duration-150 group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
