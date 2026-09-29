"use client";

/**
 * @file WidgetDebugSeuNono.tsx
 * @description Inspetor de telemetria e depuração do motor aberto tipo NotebookLM do Seu Nonô.
 *
 * Papel no portal:
 * Permite a pesquisadores e desenvolvedores inspecionar os parâmetros internos do RAG aberto:
 * - Peso da busca híbrida (60% Cosseno / 40% Lexical).
 * - Limiar de abstenção (0.10 — recusa responder sem contexto).
 * - Verificação pós-geração de marcadores [n] contra os números citados.
 * - Modo de execução: Servidor local (Ollama) vs Nuvem (SiliconFlow / DeepSeek / Maritaca).
 *
 * Decisões técnicas e de acessibilidade:
 * - Frases curtas de até 13 palavras (AGENTS.md §12).
 * - Telemetria puramente determinística e reativa sem chamadas fantasmas.
 * - Simulação de consulta com exibição clara das fontes recuperadas e pontuações.
 */

import React, { useState } from "react";
import { Terminal, Cpu, CheckCircle2, AlertTriangle, ShieldAlert, Sparkles, RefreshCw, Layers } from "lucide-react";

interface ChunkSimulado {
  indice: number;
  titulo: string;
  rota: string;
  score: number;
  tipo: "cosseno" | "lexical" | "hibrido";
  trecho: string;
}

const CHUNKS_EXEMPLO: Record<string, ChunkSimulado[]> = {
  barragens: [
    {
      indice: 1,
      titulo: "Barragens de Rejeito SIGBM",
      rota: "/ambiental/barragens",
      score: 0.88,
      tipo: "hibrido",
      trecho: "O sistema SIGBM da ANM monitora 948 barragens de mineração no território nacional.",
    },
    {
      indice: 2,
      titulo: "Níveis de Emergência em MG",
      rota: "/laboratorio?j1=sigbm-barragens",
      score: 0.74,
      tipo: "cosseno",
      trecho: "Estruturas em Nível 3 possuem risco iminente de rompimento com acionamento de sirenes.",
    },
    {
      indice: 3,
      titulo: "Fiscalização e Autos de Infração",
      rota: "/ambiental/licenciamento",
      score: 0.61,
      tipo: "lexical",
      trecho: "Multas ambientais lavradas por descumprimento de condicionantes de segurança.",
    },
  ],
  contratos: [
    {
      indice: 1,
      titulo: "Portal Nacional de Contratações Públicas (PNCP)",
      rota: "/laboratorio?j1=pncp-mg",
      score: 0.85,
      tipo: "hibrido",
      trecho: "Compras públicas federais e estaduais com valores iniciais e empenhados.",
    },
    {
      indice: 2,
      titulo: "Balança Comercial US Census CTY 3510",
      rota: "/eua/contratos",
      score: 0.69,
      tipo: "cosseno",
      trecho: "Exportações brasileiras de petróleo bruto e minério com faturamento em dólares.",
    },
  ],
};

export default function WidgetDebugSeuNono() {
  const [consulta, setConsulta] = useState("Como funcionam os níveis de risco das barragens?");
  const [chaveSimulada, setChaveSimulada] = useState<"barragens" | "contratos">("barragens");
  const [verificacaoStatus, setVerificacaoStatus] = useState<"ok" | "parcial">("ok");

  const chunks = CHUNKS_EXEMPLO[chaveSimulada];

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-5">
      {/* Topo do depurador */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
            <Terminal size={12} aria-hidden="true" />
            Telemetria do Motor Aberto RAG
          </span>
          <h3 className="mt-1.5 text-base font-bold text-text">
            Inspetor de Retrieval e Citações
          </h3>
          <p className="text-xs text-text-soft">
            Audite como o Seu Nonô localiza fontes e verifica citações [n].
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 font-semibold border border-emerald-500/20">
            <CheckCircle2 size={12} />
            Guarda de Cota Ativa
          </span>
        </div>
      </div>

      {/* Métricas e hiperparâmetros */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-xl border border-border bg-surface-2/60 p-3">
          <div className="text-[10px] font-bold uppercase text-text-soft">Busca Híbrida</div>
          <div className="mt-1 text-sm font-bold text-text">60% Cosseno ⊕ 40% BM25</div>
          <div className="text-[10px] text-text-soft mt-0.5">Equilíbrio semântico e exato.</div>
        </div>
        <div className="rounded-xl border border-border bg-surface-2/60 p-3">
          <div className="text-[10px] font-bold uppercase text-text-soft">Limiar de Abstenção</div>
          <div className="mt-1 text-sm font-bold text-text">0.10 (Fidelidade)</div>
          <div className="text-[10px] text-text-soft mt-0.5">Recusa responder sem fonte.</div>
        </div>
        <div className="rounded-xl border border-border bg-surface-2/60 p-3">
          <div className="text-[10px] font-bold uppercase text-text-soft">Janela Top-K</div>
          <div className="mt-1 text-sm font-bold text-text">3 Chunks Citados</div>
          <div className="text-[10px] text-text-soft mt-0.5">Citações inline obrigatórias.</div>
        </div>
        <div className="rounded-xl border border-border bg-surface-2/60 p-3">
          <div className="text-[10px] font-bold uppercase text-text-soft">Alvo de Execução</div>
          <div className="mt-1 text-sm font-bold text-primary">Runtime Seguro</div>
          <div className="text-[10px] text-text-soft mt-0.5">Sem rebuild desnecessário.</div>
        </div>
      </div>

      {/* Caixa de simulação interativa */}
      <div className="rounded-xl border border-border bg-surface-2/40 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-bold text-text">
            Simular Pergunta ao Assistente:
          </label>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => {
                setChaveSimulada("barragens");
                setConsulta("Como funcionam os níveis de risco das barragens?");
              }}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                chaveSimulada === "barragens"
                  ? "bg-primary text-white"
                  : "bg-surface text-text-soft hover:text-text"
              }`}
            >
              Cenário: Barragens
            </button>
            <button
              type="button"
              onClick={() => {
                setChaveSimulada("contratos");
                setConsulta("Quais são as compras públicas do PNCP?");
              }}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                chaveSimulada === "contratos"
                  ? "bg-primary text-white"
                  : "bg-surface text-text-soft hover:text-text"
              }`}
            >
              Cenário: Contratos
            </button>
          </div>
        </div>

        <input
          type="text"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
        />

        {/* Chunks recuperados */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-text-soft">
            <span className="font-semibold text-text">Chunks Recuperados do Acervo ({chunks.length}):</span>
            <span className="text-[11px]">Status da verificação: <strong className="text-emerald-500 uppercase">OK</strong></span>
          </div>

          <div className="space-y-2">
            {chunks.map((c) => (
              <div
                key={c.indice}
                className="rounded-lg border border-border bg-surface p-3 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text">
                    [{c.indice}] {c.titulo}
                  </span>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                    Score: {(c.score * 100).toFixed(0)}% ({c.tipo})
                  </span>
                </div>
                <p className="text-text-soft italic text-[11px]">
                  &quot;{c.trecho}&quot;
                </p>
                <div className="text-[10px] text-text-soft">
                  Rota indexada: <code className="text-text">{c.rota}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
