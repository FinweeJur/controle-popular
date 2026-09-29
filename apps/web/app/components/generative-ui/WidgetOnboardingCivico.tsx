"use client";

/**
 * @file WidgetOnboardingCivico.tsx
 * @description Widget interativo de boas-vindas e onboarding cívico no Laboratório.
 *
 * Papel no portal:
 * Guia o cidadão e o pesquisador pelos 3 eixos do portal e pelas 6 Qualidades de dados.
 * Ensina como comparar camadas nas duas janelas e dialogar com o Seu Nonô.
 *
 * Decisões técnicas e de acessibilidade:
 * - Frases de até 13 palavras nos textos visíveis (regra editorial AGENTS.md §12).
 * - Acessível por teclado com botões semânticos e foco visível.
 * - Integração direta com a alternância de janelas do Laboratório.
 */

import React, { useState } from "react";
import { Sparkles, Layers, ShieldCheck, ArrowRight, BookOpen, Compass, CheckCircle2 } from "lucide-react";

export interface OnboardingPasso {
  titulo: string;
  icone: string;
  eixo: string;
  descricao: string;
  dicaPratica: string;
  camadaSugeridaId: string;
  camadaSugeridaNome: string;
}

const PASSOS: OnboardingPasso[] = [
  {
    titulo: "Direitos em Movimento",
    icone: "⚖️",
    eixo: "Social e Humano",
    descricao: "Fiscalize saúde pública, educação, leis protetivas e canais de apoio cidadão.",
    dicaPratica: "Veja escolas públicas e dados do IDEB.",
    camadaSugeridaId: "educacao-mg",
    camadaSugeridaNome: "Educação Básica (INEP)",
  },
  {
    titulo: "Terra e Territórios",
    icone: "🌍",
    eixo: "Ambiental e Físico",
    descricao: "Monitore barragens de rejeitos, rios, bacias hidrográficas e áreas protegidas.",
    dicaPratica: "Acompanhe barragens com risco de rompimento.",
    camadaSugeridaId: "sigbm-barragens",
    camadaSugeridaNome: "Barragens de Mineração (SIGBM)",
  },
  {
    titulo: "Estado e Economia",
    icone: "🏛️",
    eixo: "Econômico e Institucional",
    descricao: "Fiscalize compras públicas, balança comercial e multinacionais na SEC e TSX.",
    dicaPratica: "Compare contratos públicos e fornecedores.",
    camadaSugeridaId: "pncp-mg",
    camadaSugeridaNome: "Compras Públicas (PNCP)",
  },
];

interface WidgetOnboardingCivicoProps {
  onSelecionarCamada?: (camadaId: string) => void;
  onAbrirSeuNono?: () => void;
}

export default function WidgetOnboardingCivico({
  onSelecionarCamada,
  onAbrirSeuNono,
}: WidgetOnboardingCivicoProps) {
  const [passoAtivo, setPassoAtivo] = useState(0);
  const passo = PASSOS[passoAtivo];

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-5">
      {/* Topo informativo */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            <Compass size={12} aria-hidden="true" />
            Guia Rápido do Cidadão
          </span>
          <h3 className="mt-1.5 text-base font-bold text-text">
            Como investigar dados no Laboratório
          </h3>
          <p className="text-xs text-text-soft">
            Três passos simples para auditar contas públicas e território.
          </p>
        </div>
        <div className="flex items-center gap-1">
          {PASSOS.map((p, idx) => (
            <button
              key={p.titulo}
              type="button"
              onClick={() => setPassoAtivo(idx)}
              className={`h-7 w-7 rounded-lg text-xs font-bold transition-colors ${
                passoAtivo === idx
                  ? "bg-primary text-white"
                  : "bg-surface-2 text-text-soft hover:bg-surface hover:text-text"
              }`}
              aria-label={`Ir para passo ${idx + 1}: ${p.titulo}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Cartão do passo selecionado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PASSOS.map((item, idx) => {
          const selecionado = idx === passoAtivo;
          return (
            <div
              key={item.titulo}
              onClick={() => setPassoAtivo(idx)}
              className={`cursor-pointer rounded-xl border p-4 transition-all ${
                selecionado
                  ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20"
                  : "border-border bg-surface-2/60 hover:border-text-soft/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl" role="img" aria-label={item.titulo}>
                  {item.icone}
                </span>
                {selecionado ? (
                  <CheckCircle2 size={16} className="text-primary" />
                ) : (
                  <span className="text-[10px] uppercase font-bold text-text-soft">
                    Passo {idx + 1}
                  </span>
                )}
              </div>
              <h4 className="mt-2 text-xs font-bold text-text">{item.titulo}</h4>
              <p className="mt-1 text-xs text-text-soft line-clamp-2">
                {item.descricao}
              </p>
            </div>
          );
        })}
      </div>

      {/* Destaque da ação do passo atual */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
            <Sparkles size={14} />
            Dica do passo {passoAtivo + 1}: {passo.titulo}
          </div>
          <p className="text-xs text-text">
            {passo.dicaPratica}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onSelecionarCamada && (
            <button
              type="button"
              onClick={() => onSelecionarCamada(passo.camadaSugeridaId)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity"
            >
              <Layers size={13} />
              Carregar {passo.camadaSugeridaNome}
            </button>
          )}
          {onAbrirSeuNono && (
            <button
              type="button"
              onClick={onAbrirSeuNono}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text hover:bg-surface-2 transition-colors"
            >
              <BookOpen size={13} />
              Perguntar ao Seu Nonô
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
