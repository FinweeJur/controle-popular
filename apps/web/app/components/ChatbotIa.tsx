"use client";

import { useState } from "react";

interface Fonte {
  indice: number;
  texto: string;
  score: number;
}

interface RespostaChat {
  resposta: string;
  fontes: Fonte[];
  modelo: string;
}

/**
 * Widget de laboratorio do chatbot IA com RAG local.
 *
 * Exibe a ressalva obrigatoria de IA (decisao 4 de 22/08/2026) e as fontes
 * usadas na resposta. Em producao este componente deve ser integrado ao
 * assistente existente como degrau 3; aqui e uma demonstracao isolada.
 */
export function ChatbotIaLaboratorio() {
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState<RespostaChat | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!pergunta.trim()) return;

    setCarregando(true);
    setErro(null);
    setResposta(null);

    try {
      const resp = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta }),
      });
      const dados = (await resp.json()) as RespostaChat & { erro?: string };
      if (!resp.ok || dados.erro) {
        setErro(dados.erro ?? "Erro ao consultar o assistente.");
      } else {
        setResposta(dados);
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro de rede");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-text">Assistente IA — laboratorio</h2>
      <p className="mt-1 text-sm text-text-soft">
        Respostas geradas a partir de normas federais ambientais indexadas localmente.
        Sempre confira a fonte original.
      </p>

      <form onSubmit={enviar} className="mt-4 flex gap-2">
        <input
          type="text"
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          placeholder="Pergunte sobre o acervo..."
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary"
          maxLength={500}
          disabled={carregando}
        />
        <button
          type="submit"
          disabled={carregando || !pergunta.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-ink hover:bg-primary/90 disabled:opacity-50"
        >
          {carregando ? "Pensando..." : "Perguntar"}
        </button>
      </form>

      {erro && (
        <div className="mt-4 rounded-lg border border-alert/30 bg-alert/10 p-3 text-sm text-alert">
          {erro}
        </div>
      )}

      {resposta && (
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-border bg-surface-2 p-4">
            <p className="text-sm whitespace-pre-wrap text-text">{resposta.resposta}</p>
            <p className="mt-3 text-xs text-text-soft">
              Resposta gerada por IA ({resposta.modelo}). Confira sempre a fonte.
            </p>
          </div>

          {resposta.fontes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text">Fontes usadas</h3>
              <ul className="mt-2 space-y-2">
                {resposta.fontes.map((f, i) => (
                  <li key={f.indice} className="rounded-lg border border-border p-3 text-sm">
                    <p className="font-medium text-text-soft">
                      Fonte {i + 1} — relevancia {(f.score * 100).toFixed(1)}%
                    </p>
                    <p className="mt-1 text-text">{f.texto}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
