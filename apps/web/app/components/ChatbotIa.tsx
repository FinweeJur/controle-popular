"use client";

/**
 * @file ChatbotIa.tsx
 * @description Componente de laboratório do assistente IA com RAG e degraus determinísticos.
 * 
 * Papel no portal:
 * Permite testar consultas com busca semântica, ressalva de IA obrigatória,
 * fontes citadas com links e degraus determinísticos da Regra de Escada.
 * 
 * Regras e decisões:
 * - Regra de Escada: intercepta comandos de laboratório, cidades, empresas e respostas curadas.
 * - Efeito Typewriter: digitação progressiva suave (~16ms) com cursor pulsante ▋ e fases de status.
 * - Acessibilidade: botão 'Pular animação' e clique no cartão para exibição imediata.
 */

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Copy, Check, Sparkles, ArrowRight } from "lucide-react";
import { RessalvaIa } from "./RessalvaIa";
import {
  useTypewriter,
  IndicadorStatusChat,
  CursorPulsante,
  BotaoPularAnimacao,
  type StatusTypewriter,
} from "./EfeitoTypewriter";
import {
  avaliarEscadaDeterminista,
  type ResultadoEscada,
} from "@/lib/assistente/escada-determinista";

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
 * Renderizador com efeito de digitação para a resposta de texto.
 */
function BlocoRespostaIa({
  resposta,
  copiado,
  aoCopiar,
}: {
  resposta: RespostaChat;
  copiado: string | null;
  aoCopiar: (url: string) => Promise<void>;
}) {
  const { textoExibido, concluido, pular } = useTypewriter({
    texto: resposta.resposta,
    velocidadeMs: 16,
  });

  return (
    <div className="mt-4 space-y-4">
      <div
        onClick={pular}
        className="rounded-lg border border-border bg-surface-2 p-4 cursor-pointer transition-colors hover:border-amber-500/30"
        title={concluido ? undefined : "Clique para exibir o texto completo"}
      >
        <p className="text-sm whitespace-pre-wrap text-text">
          {textoExibido}
          {!concluido && <CursorPulsante />}
        </p>

        <BotaoPularAnimacao aoPular={pular} concluido={concluido} />

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
                    Fonte {i + 1} — relevância {(f.score * 100).toFixed(1)}%
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
                      onClick={() => aoCopiar(urlDaFonte(f))}
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
  );
}

/**
 * Renderizador com efeito de digitação para a resposta de degrau determinístico.
 */
function BlocoRespostaEscada({
  resultado,
}: {
  resultado: ResultadoEscada;
}) {
  const { textoExibido, concluido, pular } = useTypewriter({
    texto: resultado.texto,
    velocidadeMs: 16,
  });

  return (
    <div
      onClick={pular}
      className="mt-4 rounded-xl border border-amber-500/40 bg-surface-2 p-5 shadow-xs cursor-pointer"
      title={concluido ? undefined : "Clique para exibir o texto completo"}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[0.68rem] font-bold text-amber-800 dark:text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" />
              {resultado.categoria ?? "Resposta Direta"}
            </span>
          </div>
          <h3 className="mt-1 font-display text-base font-bold text-foreground">
            {resultado.titulo}
          </h3>
          {resultado.subtitulo && (
            <p className="text-xs text-text-soft">{resultado.subtitulo}</p>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
        {textoExibido}
        {!concluido && <CursorPulsante />}
      </p>

      <BotaoPularAnimacao aoPular={pular} concluido={concluido} />

      {resultado.atalhos.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <p className="mb-2 text-xs font-semibold text-text-soft">
            Atalhos e ações diretas:
          </p>
          <div className="flex flex-wrap gap-2">
            {resultado.atalhos.map((a, i) => (
              <Link
                key={i}
                href={a.href}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  a.principal
                    ? "bg-primary text-white hover:opacity-90 font-bold"
                    : "border border-border bg-surface hover:bg-surface-2 hover:border-amber-500/40 text-foreground"
                }`}
              >
                <span>{a.rotulo}</span>
                <ArrowRight size={12} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Widget de laboratório do chatbot IA com RAG local.
 */
export function ChatbotIaLaboratorio() {
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState<RespostaChat | null>(null);
  const [resultadoEscada, setResultadoEscada] = useState<ResultadoEscada | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [status, setStatus] = useState<StatusTypewriter>("pronto");
  const [copiado, setCopiado] = useState<string | null>(null);

  async function copiarUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(url);
      setTimeout(() => setCopiado((atual) => (atual === url ? null : atual)), 1500);
    } catch {
      // sem clipboard
    }
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = pergunta.trim();
    if (!trimmed) return;

    setCarregando(true);
    setErro(null);
    setResposta(null);
    setResultadoEscada(null);
    setStatus("consultando");

    // 1. Degraus Determinísticos da Regra de Escada
    const degrau = avaliarEscadaDeterminista(trimmed);
    if (degrau) {
      setStatus("estruturando");
      setTimeout(() => {
        setResultadoEscada(degrau);
        setStatus("digitando");
        setCarregando(false);
      }, 150);
      return;
    }

    // 2. Consulta à API de IA / RAG
    try {
      setStatus("consultando");
      const resp = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: trimmed }),
      });
      const dados = (await resp.json()) as RespostaChat & { erro?: string };
      if (!resp.ok || dados.erro) {
        setErro(dados.erro ?? "Erro ao consultar o assistente.");
        setStatus("pronto");
      } else {
        setStatus("estruturando");
        setTimeout(() => {
          setResposta(dados);
          setStatus("digitando");
        }, 150);
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro de rede");
      setStatus("pronto");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-lg font-semibold text-text">Assistente IA — laboratório</h2>
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
          <Sparkles size={11} />
          RAG & Escada
        </span>
      </div>
      <p className="mt-1 text-sm text-text-soft">
        Respostas com citação de fontes oficiais e degraus determinísticos para termos frequentes.
      </p>

      {/* Indicador de fases de busca/geração */}
      <div className="mt-3">
        <IndicadorStatusChat status={status} />
      </div>

      <form onSubmit={enviar} className="mt-2 flex gap-2" aria-busy={carregando}>
        <input
          type="text"
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          placeholder="Pergunte sobre o acervo (ex: laboratorio, betim, vale, acordo de mariana)..."
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary"
          maxLength={500}
          disabled={carregando}
        />
        <button
          type="submit"
          disabled={carregando || !pergunta.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-ink hover:bg-primary/90 disabled:opacity-50 transition-opacity"
        >
          {carregando ? "Processando..." : "Perguntar"}
        </button>
      </form>

      {erro && (
        <div className="mt-4 rounded-lg border border-alert/30 bg-alert/10 p-3 text-sm text-alert">
          {erro}
        </div>
      )}

      {resultadoEscada && <BlocoRespostaEscada resultado={resultadoEscada} />}

      {resposta && (
        <BlocoRespostaIa
          resposta={resposta}
          copiado={copiado}
          aoCopiar={copiarUrl}
        />
      )}
    </section>
  );
}
