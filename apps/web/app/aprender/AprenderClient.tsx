"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, X } from "lucide-react";
import { acertou, contarAcertos, type Licao, listarLicoes } from "@/lib/aprender/licoes";

/**
 * Tela "Aprender" (`/aprender`) — micro-lições com pergunta de fixação.
 *
 * ═══ O QUE É ═══
 *
 * Cada lição tem um resumo, poucos parágrafos, a fonte oficial e UMA pergunta.
 * Ao responder, a tela mostra se acertou, a explicação e o link da fonte. Um
 * contador no topo mostra os acertos — sem prazo, sem ranking, sem pressão.
 *
 * ═══ REGRA EDITORIAL ═══
 *
 * Gamifica a jornada, nunca o dado. As perguntas são de definição e de
 * funcionamento; nada de tragédia ou placar de denúncia. A fonte aparece
 * junto da resposta: a lição ensina a CONFERIR, não a decorar.
 *
 * ═══ POR QUE NO CLIENTE ═══
 *
 * O conteúdo é estático e pequeno; responder e corrigir acontece no aparelho,
 * sem rede e sem guardar nada.
 */

/** Enumera as opções de uma lição, mostrando o resultado depois do clique. */
function Opcoes({ licao, escolha, onEscolher }: { licao: Licao; escolha?: number; onEscolher: (i: number) => void }) {
  const respondida = escolha !== undefined;

  return (
    <ul className="mt-3 space-y-2">
      {licao.pergunta.opcoes.map((opcao, i) => {
        const correta = i === licao.pergunta.correta;
        const escolhida = escolha === i;
        let classe = "border-border bg-surface hover:border-primary/50";
        if (respondida && correta) classe = "border-emerald-500/60 bg-emerald-50 dark:bg-emerald-950/30";
        else if (respondida && escolhida && !correta) classe = "border-red-500/60 bg-red-50 dark:bg-red-950/30";

        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => onEscolher(i)}
              className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm text-foreground transition-colors ${classe}`}
            >
              {respondida && correta && <Check size={15} className="shrink-0 text-emerald-600" aria-hidden="true" />}
              {respondida && escolhida && !correta && <X size={15} className="shrink-0 text-red-600" aria-hidden="true" />}
              <span>{opcao}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function AprenderClient() {
  const licoes = listarLicoes();
  const [respostas, setRespostas] = useState<Record<string, number>>({});

  const acertos = contarAcertos(respostas);

  return (
    <div className="space-y-6">
      <p role="status" aria-live="polite" className="text-sm text-muted">
        Você acertou <strong className="text-foreground">{acertos}</strong> de {licoes.length}.
        Sem pressa e sem nota.
      </p>

      <ul className="space-y-5">
        {licoes.map((licao) => {
          const escolha = respostas[licao.id];
          const respondida = escolha !== undefined;
          const estaCerta = respondida && acertou(licao, escolha);

          return (
            <li key={licao.id} className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
              <h2 className="font-display text-lg font-bold text-foreground">{licao.titulo}</h2>
              <p className="mt-1 text-sm text-muted">{licao.resumo}</p>

              <div className="mt-3 space-y-1.5 text-sm leading-relaxed text-muted">
                {licao.paragrafos.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              <p className="mt-4 text-sm font-medium text-foreground">{licao.pergunta.enunciado}</p>
              <Opcoes
                licao={licao}
                escolha={escolha}
                onEscolher={(i) => setRespostas((r) => ({ ...r, [licao.id]: i }))}
              />

              {respondida && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`mt-3 rounded-xl border p-3 text-sm ${
                    estaCerta
                      ? "border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/20"
                      : "border-red-500/40 bg-red-50/60 dark:bg-red-950/20"
                  }`}
                >
                  <p className="font-semibold text-foreground">
                    {estaCerta ? "Isso mesmo." : "Quase. Veja a resposta correta em verde."}
                  </p>
                  <p className="mt-1 text-muted">{licao.pergunta.explicacao}</p>
                </div>
              )}

              <p className="mt-3 text-xs text-muted">
                Fonte:{" "}
                {licao.fonte.url.startsWith("/") ? (
                  <Link href={licao.fonte.url} className="font-medium text-primary hover:underline">
                    {licao.fonte.nome}
                  </Link>
                ) : (
                  <a
                    href={licao.fonte.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    {licao.fonte.nome}
                    <ExternalLink size={11} aria-hidden="true" />
                  </a>
                )}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
