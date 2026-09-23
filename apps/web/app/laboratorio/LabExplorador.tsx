"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import LabDock, { type DatasetKey } from "./LabDock";
import LabJanela from "./LabJanela";
import LabSeuNono from "./LabSeuNono";
import type { JanelaDados } from "./LabJanela";
import type { TipoGrafico } from "./tipos";
import { semAcento } from "@/lib/busca/normalizar";

interface LabExploradorProps {
  datasets: Record<string, JanelaDados>;
  camadas: { id: string; nome: string; categoria: string }[];
}

function readGraficoParam(val: string | null): TipoGrafico {
  const all: TipoGrafico[] = ["barras", "donut", "heatmap", "linha", "stacked", "gauge", "crescimento"];
  if (val && all.includes(val as TipoGrafico)) return val as TipoGrafico;
  return "barras";
}

/** Palavras do buscador global → id da camada (mantém compat com `?q=`). */
const PALAVRAS: Record<string, string[]> = {
  "sigbm-barragens": ["barragem", "represa", "mineracao", "sigbm", "emergencia", "rompimento"],
  barragens: ["barragem", "represa", "mineracao", "sigbm"],
  "licencas-unificadas": ["licenca", "licenciamento", "ambiental", "ibama", "outorga"],
  licencas: ["licenca", "licenciamento", "ambiental"],
  "educacao-mg": ["educacao", "escola", "ideb", "inep", "aluno", "matricula"],
  educacao: ["educacao", "escola", "ideb"],
  "series-economicas-bcb": ["economia", "ipca", "selic", "cambio", "inflacao", "pib"],
  economia: ["economia", "ipca", "selic"],
  "ceap-nacional": ["congresso", "ceap", "deputado", "gasto", "cota"],
  congresso: ["congresso", "ceap", "deputado"],
  "judiciario-contatos": ["judiciario", "vara", "tribunal", "justica"],
  judiciario: ["judiciario", "vara", "tribunal"],
  "clima-risco": ["clima", "chuva", "seca", "risco", "adapta"],
  clima: ["clima", "chuva", "risco"],
  "esg-vale": ["esg", "vale", "mineradora", "socioambiental"],
  esg: ["esg", "vale"],
  "judiciario-remuneracoes": ["salario", "remuneracao", "magistrado", "contracheque"],
  "pncp-mg": ["pncp", "contrato", "licitacao", "pn cp"],
  "convenios-ambientais-mg": ["convenio", "convenios"],
  "decisoes-licenciamento": ["decisao", "licenciamento", "negativa"],
};

function readSearchParam(val: string | null, ids: Set<string>): string | null {
  if (!val) return null;
  return ids.has(val) ? val : null;
}

function escolherInicial(
  param: string | null,
  padrao: string,
  ids: Set<string>,
  camadas: string[],
): string | null {
  const daUrl = readSearchParam(param, ids);
  if (daUrl) return daUrl;
  if (ids.has(padrao)) return padrao;
  if (ids.has(camadas[0])) return camadas[0]!;
  return null;
}

export default function LabExplorador({ datasets, camadas }: LabExploradorProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const ids = useMemo(() => new Set(Object.keys(datasets)), [datasets]);
  const idsCamadas = useMemo(() => camadas.map((c) => c.id), [camadas]);

  const [esq, setEsq] = useState<string | null>(() =>
    escolherInicial(searchParams.get("j1"), "sigbm-barragens", ids, idsCamadas),
  );
  const [dir, setDir] = useState<string | null>(() => {
    const daUrl = readSearchParam(searchParams.get("j2"), ids);
    if (daUrl) return daUrl;
    if (ids.has("licencas-unificadas")) return "licencas-unificadas";
    if (ids.has(idsCamadas[1] ?? "")) return idsCamadas[1] ?? null;
    if (ids.has(idsCamadas[0] ?? "")) return idsCamadas[0] ?? null;
    return null;
  });
  const [active, setActive] = useState<string | null>("sigbm-barragens");
  const [grafico, setGrafico] = useState<TipoGrafico>(() => readGraficoParam(searchParams.get("g")));
  const [graficoDir, setGraficoDir] = useState<TipoGrafico>(() => readGraficoParam(searchParams.get("g2")));
  const [nonoOpen, setNonoOpen] = useState(false);
  /** Camadas ligadas no painel do Seu Nonô (PowerBI-style). Vazio = todas. */
  const [ligadas, setLigadas] = useState<Set<string>>(() => new Set(idsCamadas));
  const qInitial = React.useMemo(
    () => (searchParams.get("q") ?? "").toLowerCase(),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  React.useEffect(() => {
    if (!qInitial) return;
    const tokens = semAcento(qInitial).split(/[^a-z0-9]+/).filter((t) => t.length >= 3);
    if (tokens.length === 0) return;
    const pontos: { key: string; acertos: number }[] = [];
    for (const [key, palavras] of Object.entries(PALAVRAS)) {
      if (!ids.has(key)) continue;
      const acertos = tokens.filter((t) =>
        palavras.some((p) => t === p || t.includes(p) || p.includes(t)),
      ).length;
      if (acertos > 0) pontos.push({ key, acertos });
    }
    if (pontos.length === 0) return;
    pontos.sort((a, b) => b.acertos - a.acertos);
    setEsq(pontos[0].key);
    setDir(pontos[1]?.key ?? dir);
    setActive(pontos[0].key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (esq) params.set("j1", esq);
    if (dir) params.set("j2", dir);
    if (grafico !== "barras") params.set("g", grafico);
    if (graficoDir !== "barras") params.set("g2", graficoDir);
    if (qInitial) params.set("q", qInitial);
    const qs = params.toString();
    router.replace(`/laboratorio${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [esq, dir, grafico, graficoDir, qInitial, router]);

  const handleSelectDock = useCallback(
    (key: DatasetKey) => {
      if (active === key) {
        setActive(null);
        return;
      }
      setActive(key);
      if (esq === null || (esq === active && dir !== key)) {
        setEsq(key);
      } else if (dir === null || dir === active) {
        setDir(key);
      } else {
        setEsq(key);
      }
    },
    [active, esq, dir],
  );

  const toggleCamada = useCallback((id: string) => {
    setLigadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const camadasParaDock = useMemo(
    () => camadas.map((c) => ({ id: c.id, nome: c.nome })),
    [camadas],
  );

  return (
    <div className="flex min-h-[70vh] flex-col pb-24">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row">
        <LabJanela
          dados={esq && datasets[esq] ? datasets[esq] : null}
          posicao="esquerda"
          tipoGrafico={grafico}
          onGraficoChange={setGrafico}
        />
        <LabJanela
          dados={dir && datasets[dir] ? datasets[dir] : null}
          posicao="direita"
          tipoGrafico={graficoDir}
          onGraficoChange={setGraficoDir}
        />
      </div>
      <LabDock
        active={active}
        onSelect={handleSelectDock}
        camadas={camadasParaDock}
        ligadas={ligadas}
      />
      <button
        onClick={() => setNonoOpen(!nonoOpen)}
        className="fixed right-4 bottom-28 z-50 rounded-full bg-accent px-4 py-2 text-sm font-bold text-white shadow-lg hover:opacity-90"
        aria-label={nonoOpen ? "Fechar Seu Nonô" : "Abrir Seu Nonô"}
      >
        {nonoOpen ? "✕" : "🤖 Seu Nonô"}
      </button>
      {nonoOpen && (
        <LabSeuNono
          grafico={grafico}
          onGraficoChange={setGrafico}
          camadas={camadas}
          ligadas={ligadas}
          onToggleCamada={toggleCamada}
        />
      )}
    </div>
  );
}
