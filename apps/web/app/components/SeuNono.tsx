"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X, Bot, Sparkles, ExternalLink } from "lucide-react";
import Link from "@/lib/betim/link";

interface PerguntaResposta {
  pergunta: string;
  resposta: string;
  link?: { href: string; texto: string };
}

const RESPOSTAS_ESTATICAS: PerguntaResposta[] = [
  {
    pergunta: "O que é o Controle Popular?",
    resposta:
      "Portal independente de transparência que reúne dados públicos sobre cidades, Congresso Nacional, Judiciário e meio ambiente.",
    link: { href: "/sobre", texto: "Sobre o portal" },
  },
  {
    pergunta: "Como acompanhar minha cidade?",
    resposta:
      "Escolha sua cidade na home. Lá você encontra contratos, despesas, licitações, obras, servidores, diário oficial e leis municipais.",
    link: { href: "/", texto: "Ir para a home" },
  },
  {
    pergunta: "Como denunciar uma violação de direito?",
    resposta:
      "A seção Direitos em Movimento reúne onde buscar ajuda, como pedir informação e como denunciar.",
    link: { href: "/direitos-em-movimento", texto: "Direitos em Movimento" },
  },
  {
    pergunta: "Onde estão os dados ambientais?",
    resposta:
      "A frente Ambiental reúne licenciamentos, reuniões do COPAM, barragens, legislação e patrimônio cultural tombado.",
    link: { href: "/ambiental", texto: "Ver Ambiental" },
  },
];

/**
 * Widget flutuante "Seu Nonô" — assistente do Controle Popular.
 *
 * Modo degradado (sem IA configurada): mostra respostas estáticas pré-curadas
 * com links para as páginas certas. Quando `AI_API_KEY` ou Ollama local estão
 * disponíveis, o modo IA (RAG) pode ser ativado.
 *
 * Posicionado no canto inferior esquerdo, expansível, sem tomar a tela toda.
 */
export function SeuNono() {
  const [aberto, setAberto] = useState(false);
  const [iaDisponivel, setIaDisponivel] = useState<boolean | null>(null);
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState<PerguntaResposta | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Detecta se ha algum provedor de IA disponivel no ambiente.
  useEffect(() => {
    const temApiKey = Boolean(process.env.NEXT_PUBLIC_AI_API_KEY);
    // Ollama só pode ser testado via server action/route; aqui assumimos false
    // ate o backend confirmar. Em modo estatico, o widget opera no degradado.
    setIaDisponivel(temApiKey);
  }, []);

  function responderEstatica(item: PerguntaResposta) {
    setResposta(item);
    setErro(null);
  }

  async function enviarPergunta(e: React.FormEvent) {
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
      const dados = (await resp.json()) as { resposta?: string; erro?: string };
      if (!resp.ok || dados.erro) {
        setErro(dados.erro ?? "Não consegui responder agora.");
      } else {
        setResposta({ pergunta, resposta: dados.resposta ?? "" });
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro de rede");
    } finally {
      setCarregando(false);
      setPergunta("");
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start">
      {aberto && (
        <div className="mb-3 w-[min(calc(100vw-2rem),24rem)] overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between border-b border-border bg-primary/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot size={20} className="text-primary" />
              <div>
                <p className="font-display text-sm font-semibold text-text">Seu Nonô</p>
                <p className="text-[.7rem] text-text-soft">
                  {iaDisponivel ? "Assistente com IA" : "Assistente — modo texto"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setAberto(false)}
              className="rounded-full p-1 text-text-soft hover:bg-surface-2"
              aria-label="Fechar chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Área de mensagens */}
          <div className="max-h-[min(60vh,24rem)] overflow-y-auto px-4 py-3">
            {!resposta && !erro && (
              <div className="space-y-3">
                <p className="text-sm text-text-soft">
                  Olá! Sou o <strong className="text-text">Seu Nonô</strong>, assistente do
                  Controle Popular. Enquanto a IA não está configurada, posso te guiar por
                  estas perguntas:
                </p>
                <ul className="space-y-2">
                  {RESPOSTAS_ESTATICAS.map((item) => (
                    <li key={item.pergunta}>
                      <button
                        onClick={() => responderEstatica(item)}
                        className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-left text-sm text-text hover:border-primary"
                      >
                        {item.pergunta}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {resposta && (
              <div className="space-y-3">
                <div className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-text">
                  <strong className="text-primary">Você:</strong> {resposta.pergunta}
                </div>
                <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text">
                  <p className="whitespace-pre-wrap">{resposta.resposta}</p>
                  {resposta.link && (
                    <Link
                      href={resposta.link.href}
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                    >
                      {resposta.link.texto} <ExternalLink size={12} />
                    </Link>
                  )}
                </div>
                <button
                  onClick={() => setResposta(null)}
                  className="text-xs text-text-soft hover:text-primary"
                >
                  ← Voltar às perguntas
                </button>
              </div>
            )}

            {erro && (
              <div className="rounded-lg border border-alert/30 bg-alert/10 px-3 py-2 text-sm text-alert">
                {erro}
                <p className="mt-1 text-xs">
                  Enquanto isso, escolha uma das perguntas sugeridas acima.
                </p>
              </div>
            )}
          </div>

          {/* Rodapé com input de IA (se disponível) ou ressalva */}
          <div className="border-t border-border bg-surface-2 px-4 py-2">
            {iaDisponivel ? (
              <form onSubmit={enviarPergunta} className="flex gap-2">
                <input
                  type="text"
                  value={pergunta}
                  onChange={(e) => setPergunta(e.target.value)}
                  placeholder="Pergunte qualquer coisa..."
                  className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                  disabled={carregando}
                />
                <button
                  type="submit"
                  disabled={carregando || !pergunta.trim()}
                  className="rounded-lg bg-primary px-3 py-2 text-primary-ink hover:bg-primary/90 disabled:opacity-50"
                >
                  <Sparkles size={16} />
                </button>
              </form>
            ) : (
              <p className="text-[.7rem] text-text-soft">
                Modo texto: a IA será ativada quando o portal tiver uma chave de API
                configurada. Respostas automáticas são baseadas em páginas do site.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Botão flutuante */}
      {!aberto && (
        <button
          onClick={() => setAberto(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-ink shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Abrir assistente Seu Nonô"
        >
          <MessageCircle size={28} />
        </button>
      )}
    </div>
  );
}
