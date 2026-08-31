"use client";

import { useState } from "react";
import { ExternalLink, Copy, Check } from "lucide-react";
import { RessalvaIa } from "./RessalvaIa";

interface Fonte {
  indice: number;
  titulo?: string;
  url?: string;
  rota?: string;
  texto: string;
  score: number;
}

interface RespostaChat {
  resposta: string;
  fontes: Fonte[];
  modelo: string;
  data: string;
  ressalva: true;
  verificacao?: "ok" | "parcial" | "falhou";
}

function urlDaFonte(f: Fonte): string {
  const href = f.url ?? f.rota ?? "#";
  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//")) {
    return href;
  }
  return typeof window !== "undefined" ? `${window.location.origin}${href}` : href;
}

/**
 * Widget de laboratorio do chatbot IA com RAG local.
 *
 * Exibe a ressalva obrigatoria de IA (decisao 4 de 22/08/2026), o resultado
 * da verificacao de citacao e as fontes com link da pagina. Em producao o
 * mesmo contrato e renderizado pelo Seu Nonô (widget e tela cheia).
 */
export function ChatbotIaLaboratorio() {
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState<RespostaChat | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);

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
            <div className="mt-3">
              <RessalvaIa
                modelo={resposta.modelo}
                data={resposta.data}
                verificacao={resposta.verificacao}
              />
            </div>
          </div>

          {resposta.fontes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-text">Fontes usadas</h3>
              <ul className="mt-2 space-y-2">
                {resposta.fontes.map((f, i) => (
                  <li key={f.indice} className="rounded-lg border border-border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-text-soft">
                        Fonte {i + 1} — relevancia {(f.score * 100).toFixed(1)}%
                        {f.titulo ? ` · ${f.titulo}` : ""}
                      </p>
                      <span className="flex shrink-0 items-center gap-1">
                        <a
                          href={urlDaFonte(f)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-accent hover:border-primary"
                        >
                          Abrir <ExternalLink size={11} />
                        </a>
                        <button
                          onClick={async () => {
                            const url = urlDaFonte(f);
                            try {
                              await navigator.clipboard.writeText(url);
                              setCopiado(url);
                              setTimeout(() => setCopiado((atual) => (atual === url ? null : atual)), 1500);
                            } catch {
                              // sem clipboard, sem drama no laboratorio
                            }
                          }}
                          className="rounded-md border border-border bg-surface p-1 text-text-soft hover:border-primary hover:text-primary"
                          aria-label={`Copiar link da fonte ${i + 1}`}
                        >
                          {copiado === urlDaFonte(f) ? (
                            <Check size={12} className="text-primary" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </span>
                    </div>
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
