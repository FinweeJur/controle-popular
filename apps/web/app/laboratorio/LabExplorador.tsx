"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import LabDock, { type DatasetKey } from "./LabDock";
import LabJanela from "./LabJanela";
import LabSeuNono from "./LabSeuNono";
import type { JanelaDados } from "./LabJanela";
import type { TipoGrafico } from "./tipos";

const DATASET_KEYS: DatasetKey[] = [
  "barragens", "licencas", "educacao", "economia",
  "congresso", "judiciario", "clima", "esg",
];

function readSearchParam(val: string | null): DatasetKey | null {
  if (!val) return null;
  return DATASET_KEYS.includes(val as DatasetKey) ? (val as DatasetKey) : null;
}

function readGraficoParam(val: string | null): TipoGrafico {
  const all: TipoGrafico[] = ["barras", "donut", "heatmap", "linha", "stacked", "gauge", "crescimento"];
  if (val && all.includes(val as TipoGrafico)) return val as TipoGrafico;
  return "barras";
}

interface DatasetMap {
  barragens: JanelaDados;
  licencas: JanelaDados;
  educacao: JanelaDados;
  economia: JanelaDados;
  congresso: JanelaDados;
  judiciario: JanelaDados;
  clima: JanelaDados;
  esg: JanelaDados;
}

interface LabExploradorProps {
  datasets: DatasetMap;
}

export default function LabExplorador({ datasets }: LabExploradorProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [esq, setEsq] = useState<DatasetKey | null>(() => readSearchParam(searchParams.get("j1")) ?? "barragens");
  const [dir, setDir] = useState<DatasetKey | null>(() => readSearchParam(searchParams.get("j2")) ?? "licencas");
  const [active, setActive] = useState<DatasetKey | null>("barragens");
  const [grafico, setGrafico] = useState<TipoGrafico>(() => readGraficoParam(searchParams.get("g")));
  const [nonoOpen, setNonoOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (esq) params.set("j1", esq);
    if (dir) params.set("j2", dir);
    if (grafico !== "barras") params.set("g", grafico);
    const qs = params.toString();
    router.replace(`/laboratorio${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [esq, dir, grafico, router]);

  const handleSelect = useCallback(
    (key: DatasetKey) => {
      setActive(key);
      setEsq((prev) => (prev === key ? prev : dir === key ? dir : key));
      setDir((prev) => {
        if (prev === key) return prev;
        if (esq === key) return esq;
        return prev;
      });
    },
    [esq, dir],
  );

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

  return (
    <div className="flex min-h-[70vh] flex-col pb-20">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row">
        <LabJanela
          dados={esq ? datasets[esq] : null}
          posicao="esquerda"
          tipoGrafico={grafico}
        />
        <LabJanela
          dados={dir ? datasets[dir] : null}
          posicao="direita"
          tipoGrafico={grafico}
        />
      </div>
      <LabDock active={active} onSelect={handleSelectDock} />
      <button
        onClick={() => setNonoOpen(!nonoOpen)}
        className="fixed right-4 bottom-24 z-50 rounded-full bg-accent px-4 py-2 text-sm font-bold text-white shadow-lg hover:opacity-90"
        aria-label={nonoOpen ? "Fechar Seu Nonô" : "Abrir Seu Nonô"}
      >
        {nonoOpen ? "✕" : "🤖 Seu Nonô"}
      </button>
      {nonoOpen && (
        <LabSeuNono grafico={grafico} onGraficoChange={setGrafico} />
      )}
    </div>
  );
}
