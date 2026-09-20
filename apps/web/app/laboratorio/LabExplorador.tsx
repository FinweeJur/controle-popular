"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import LabDock, { type DatasetKey } from "./LabDock";
import LabJanela from "./LabJanela";
import LabSeuNono from "./LabSeuNono";
import type { JanelaDados } from "./LabJanela";
import type { TipoGrafico } from "./tipos";
import { semAcento } from "@/lib/busca/normalizar";

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

/**
 * F4: a palavra-chave do buscador global (`?q=`) escolhe as janelas.
 * Tokens sem acento batem nas palavras de cada dataset; os dois conjuntos
 * com mais batidas abrem nas janelas (top 1 = esquerda, top 2 = direita).
 */
const PALAVRAS_DATASET: Record<DatasetKey, string[]> = {
  barragens: ["barragem", "represa", "mineracao", "sigbm", "emergencia", "rompimento"],
  licencas: ["licenca", "licenciamento", "ambiental", "ibama", "outorga", "fepam"],
  educacao: ["educacao", "escola", "ideb", "inep", "aluno", "matricula", "creche"],
  economia: ["economia", "ipca", "selic", "cambio", "inflacao", "banco", "divida", "pib"],
  congresso: ["congresso", "ceap", "deputado", "senado", "gasto", "cota", "emenda"],
  judiciario: ["judiciario", "vara", "tribunal", "justica", "juiz", "cjf"],
  clima: [
    "clima", "chuva", "seca", "risco", "adapta", "alagamento",
  ],
  esg: ["esg", "vale", "mineradora", "socioambiental", "geo", "parnaiba"],
};

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
  // F4: q do buscador global — decide janelas UMA vez, no mount.
  const qInitial = React.useMemo(() => (searchParams.get("q") ?? "").toLowerCase(), []); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!qInitial) return;
    const tokens = semAcento(qInitial).split(/[^a-z0-9]+/).filter((t) => t.length >= 3);
    if (tokens.length === 0) return;
    const pontos: { key: DatasetKey; acertos: number }[] = [];
    for (const key of DATASET_KEYS) {
      const acertos = tokens.filter((t) =>
        PALAVRAS_DATASET[key].some((p) => t === p || t.includes(p) || p.includes(t)),
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
  // eslint-disable-next-line react-hooks/exhaustive-deps

  useEffect(() => {
    const params = new URLSearchParams();
    if (esq) params.set("j1", esq);
    if (dir) params.set("j2", dir);
    if (grafico !== "barras") params.set("g", grafico);
    if (qInitial) params.set("q", qInitial);
    const qs = params.toString();
    router.replace(`/laboratorio${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [esq, dir, grafico, qInitial, router]);

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
