"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Sparkles, ArrowRight, CornerDownLeft } from "lucide-react";

const PERGUNTAS_RAPIDAS = [
  {
    rotulo: "Soma dos R$ 251 bi",
    pergunta: "De onde vêm os R$ 251 bilhões monitorados no painel do portal?",
    icone: "💰",
  },
  {
    rotulo: "Acordo de Mariana (R$ 171 bi)",
    pergunta: "Como funciona a repactuação do Rio Doce de R$ 171 bi e o repasse para MG?",
    icone: "🌊",
  },
  {
    rotulo: "Orçamento TJMG, MPMG e DPMG",
    pergunta: "Qual o orçamento anual do TJMG, MPMG e DPMG e a disparidade entre eles?",
    icone: "⚖️",
  },
  {
    rotulo: "Contratos da minha cidade",
    pergunta: "Como pesquisar contratos e licitações de prefeituras no portal?",
    icone: "🏛️",
  },
  {
    rotulo: "Barragens a montante",
    pergunta: "Quantas barragens a montante continuam em nível 3 de emergência em MG?",
    icone: "⚠️",
  },
];

export default function CartaoChatbotHome() {
  const [texto, setTexto] = useState("");

  function dispararPergunta(prompt: string) {
    if (!prompt.trim()) return;
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("abrir-seu-nono", {
          detail: { pergunta: prompt.trim() },
        })
      );
    }
  }

  function aoSubmeter(e: React.FormEvent) {
    e.preventDefault();
    if (texto.trim()) {
      dispararPergunta(texto);
      setTexto("");
    }
  }

  return (
    <section
      aria-label="Assistente Cidadão Seu Nonô"
      className="my-8 rounded-2xl border border-amber-500/30 bg-surface p-5 sm:p-6 shadow-xs relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/seunono/avatar.webp"
            alt="Seu Nonô"
            width={56}
            height={56}
            className="h-14 w-14 rounded-full border border-amber-500/40 object-cover shrink-0 shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-foreground">
                Pergunte ao Seu Nonô
              </h2>
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" />
                IA Cidadã Livre (Sabiá 7B)
              </span>
            </div>
            <p className="text-xs text-text-soft">
              Tire dúvidas sobre orçamentos, contratos, leis, indenizações e denúncias com inteligência artificial popular.
            </p>
          </div>
        </div>

        <Link
          href="/assistente"
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 shrink-0 self-start sm:self-auto"
        >
          <span>Abrir painel completo</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Formulário de pergunta rápida */}
      <form onSubmit={aoSubmeter} className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Digite sua dúvida (ex: Quanto custa o Judiciário de MG? O que é o Acordo de Mariana?)"
            className="w-full rounded-xl border border-border bg-surface-2/60 px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={!texto.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer shrink-0"
        >
          <span>Perguntar</span>
          <CornerDownLeft className="h-3.5 w-3.5" />
        </button>
      </form>

      {/* Chips de perguntas sugeridas */}
      <div className="mt-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted mb-2">
          <MessageSquare className="h-3 w-3 text-amber-600 dark:text-amber-400" />
          <span>Consultas populares prontas para disparar:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PERGUNTAS_RAPIDAS.map((item) => (
            <button
              key={item.rotulo}
              type="button"
              onClick={() => dispararPergunta(item.pergunta)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2/70 hover:bg-surface-2 hover:border-amber-500/40 px-2.5 py-1.5 text-xs text-foreground font-medium transition-colors cursor-pointer text-left"
            >
              <span aria-hidden="true">{item.icone}</span>
              <span>{item.rotulo}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
