"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  MessageCircle,
  X,
  Bot,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  Search,
  Home,
  Copy,
  Check,
  Accessibility,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  FRENTES,
  type SeuNonoFrente,
  type SeuNonoCategoria,
  type SeuNonoPergunta,
} from "./SeuNonoData";

type Nivel = "frentes" | "categorias" | "perguntas" | "resposta" | "ia";

type ComandoAcessibilidade = {
  comando: string[];
  label: string;
  acao: () => void;
  icone: React.ReactNode;
};

/**
 * Widget flutuante "Seu Nonô" — assistente do Controle Popular.
 *
 * Funciona como uma escada de respostas pré-curadas:
 * 1) escolha a frente (Cidades, Congresso, Judiciário, Ambiental, Paraopeba, Geral);
 * 2) escolha o tema dentro da frente;
 * 3) escolha a pergunta;
 * 4) vê a resposta com link para a página certa.
 *
 * Só no último degrau oferecemos a IA (quando NEXT_PUBLIC_AI_API_KEY ou Ollama
 * estiverem disponíveis). Enquanto não houver IA, o widget opera 100% no modo
 * texto, sem depender de rede externa.
 *
 * Posicionado no canto inferior esquerdo, expansível, sem tomar a tela toda.
 */
export function SeuNono() {
  const [aberto, setAberto] = useState(false);
  const [iaDisponivel, setIaDisponivel] = useState<boolean>(false);
  const { theme, setTheme } = useTheme();

  const [nivel, setNivel] = useState<Nivel>("frentes");
  const [frente, setFrente] = useState<SeuNonoFrente | null>(null);
  const [categoria, setCategoria] = useState<SeuNonoCategoria | null>(null);
  const [resposta, setResposta] = useState<SeuNonoPergunta | null>(null);

  const [perguntaLivre, setPerguntaLivre] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [respostaIa, setRespostaIa] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  // Boas-vindas: popup que aparece uma vez quando o FAB é visível
  const [mostrouBoasVindas, setMostrouBoasVindas] = useState(true);
  const [dismissBoasVindas, setDismissBoasVindas] = useState(false);

  // Comando de acessibilidade: resposta local sem chamada à IA
  const [respostaComando, setRespostaComando] = useState<string | null>(null);

  // Detecta se ha algum provedor de IA disponivel no ambiente.
  useEffect(() => {
    const temApiKey = Boolean(process.env.NEXT_PUBLIC_AI_API_KEY);
    const jaViu = localStorage.getItem("cp_nono_seen") === "1";
// eslint-disable-next-line react-hooks/set-state-in-effect -- leitura pos-hidratacao de localStorage
    setIaDisponivel(temApiKey);
    setMostrouBoasVindas(jaViu);
  }, []);

  // Reseta a navegação ao fechar para recomeçar do topo na próxima abertura.
  useEffect(() => {
    if (!aberto) {
      const timer = setTimeout(() => {
        setNivel("frentes");
        setFrente(null);
        setCategoria(null);
        setResposta(null);
        setRespostaIa(null);
        setErro(null);
        setPerguntaLivre("");
        setRespostaComando(null);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [aberto]);

  // ── Comandos de acessibilidade ──────────────────────────────────
  const FS_STEPS = ["sm", "md", "lg", "xl"] as const;

  const comandosAcessibilidade: ComandoAcessibilidade[] = useMemo(
    () => [
      {
        comando: ["tema escuro", "dark", "modo escuro", "escuro"],
        label: "Tema escuro",
        acao: () => setTheme("dark"),
        icone: <span className="text-base">🌙</span>,
      },
      {
        comando: ["tema claro", "light", "modo claro", "claro"],
        label: "Tema claro",
        acao: () => setTheme("light"),
        icone: <span className="text-base">☀️</span>,
      },
      {
        comando: ["alto contraste", "contraste"],
        label: "Alto contraste",
        acao: () => setTheme("high-contrast"),
        icone: <span className="text-base">◐</span>,
      },
      {
        comando: ["aumentar texto", "texto maior", "aumentar fonte", "fonte maior", "maior"],
        label: "Aumentar texto",
        acao: () => {
          const atual = document.documentElement.getAttribute("data-fs") || "md";
          const idx = FS_STEPS.indexOf(atual as typeof FS_STEPS[number]);
          const next = FS_STEPS[Math.min(idx + 1, FS_STEPS.length - 1)];
          document.documentElement.setAttribute("data-fs", next);
          localStorage.setItem("cp_fs", next);
        },
        icone: <span className="text-base">🔤</span>,
      },
      {
        comando: ["diminuir texto", "texto menor", "diminuir fonte", "fonte menor", "menor"],
        label: "Diminuir texto",
        acao: () => {
          const atual = document.documentElement.getAttribute("data-fs") || "md";
          const idx = FS_STEPS.indexOf(atual as typeof FS_STEPS[number]);
          const next = FS_STEPS[Math.max(idx - 1, 0)];
          document.documentElement.setAttribute("data-fs", next);
          localStorage.setItem("cp_fs", next);
        },
        icone: <span className="text-base">🔡</span>,
      },
      {
        comando: ["cores daltônicas", "daltonismo", "acessibilidade visual", "cvd", "cores para daltônicos"],
        label: "Cores para daltonismo",
        acao: () => {
          const atual = document.documentElement.getAttribute("data-cvd") === "on";
          const proximo = !atual;
          document.documentElement.setAttribute("data-cvd", proximo ? "on" : "off");
          localStorage.setItem("cp_cvd", proximo ? "on" : "off");
        },
        icone: <span className="text-base">🎨</span>,
      },
    ],
    [setTheme]
  );

  function detectarComandoAcessibilidade(texto: string): string | null {
    const lower = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const cmd of comandosAcessibilidade) {
      for (const palavra of cmd.comando) {
        const pLower = palavra.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (lower.includes(pLower)) {
          cmd.acao();
          return `Pronto! ${cmd.label} ativado.`;
        }
      }
    }
    return null;
  }

  function dismissarBoasVindas() {
    setDismissBoasVindas(true);
    localStorage.setItem("cp_nono_seen", "1");
  }

  const frenteAtual = useMemo(
    () => FRENTES.find((f) => f.id === frente?.id) ?? null,
    [frente]
  );
  const categoriaAtual = useMemo(
    () => frenteAtual?.categorias.find((c) => c.id === categoria?.id) ?? null,
    [frenteAtual, categoria]
  );

  function escolherFrente(f: SeuNonoFrente) {
    setFrente(f);
    setNivel("categorias");
  }

  function escolherCategoria(c: SeuNonoCategoria) {
    setCategoria(c);
    setNivel("perguntas");
  }

  function escolherResposta(p: SeuNonoPergunta) {
    setResposta(p);
    setNivel("resposta");
  }

  function voltar() {
    if (nivel === "resposta") {
      setResposta(null);
      setNivel("perguntas");
    } else if (nivel === "perguntas") {
      setCategoria(null);
      setNivel("categorias");
    } else if (nivel === "categorias") {
      setFrente(null);
      setNivel("frentes");
    } else if (nivel === "ia") {
      setErro(null);
      setRespostaIa(null);
      setNivel(categoria ? "perguntas" : frente ? "categorias" : "frentes");
    }
  }

  function abrirIa() {
    setNivel("ia");
  }

  function voltarAoInicio() {
    setNivel("frentes");
    setFrente(null);
    setCategoria(null);
    setResposta(null);
    setRespostaIa(null);
    setErro(null);
    setPerguntaLivre("");
  }

  function abrirPagina(href: string) {
    if (typeof window === "undefined") return;
    if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//")) {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = href;
    }
  }

  async function copiarLink(href: string) {
    if (typeof window === "undefined") return;
    const url =
      href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//")
        ? href
        : `${window.location.origin}${href}`;
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }

  async function enviarPerguntaLivre(e: React.FormEvent) {
    e.preventDefault();
    if (!perguntaLivre.trim()) return;

    // Verifica se é comando de acessibilidade antes de enviar à IA
    const cmdResposta = detectarComandoAcessibilidade(perguntaLivre);
    if (cmdResposta) {
      setRespostaComando(cmdResposta);
      setRespostaIa(null);
      setErro(null);
      setPerguntaLivre("");
      return;
    }

    setCarregando(true);
    setErro(null);
    setRespostaIa(null);
    setRespostaComando(null);

    try {
      const resp = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: perguntaLivre }),
      });
      const dados = (await resp.json()) as { resposta?: string; erro?: string };
      if (!resp.ok || dados.erro) {
        setErro(dados.erro ?? "Não consegui responder agora.");
      } else {
        setRespostaIa(dados.resposta ?? "");
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro de rede");
    } finally {
      setCarregando(false);
      setPerguntaLivre("");
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
            <div className="flex items-center gap-1">
              {nivel !== "frentes" && (
                <button
                  onClick={voltarAoInicio}
                  className="rounded-full p-1 text-text-soft hover:bg-surface-2"
                  aria-label="Voltar ao menu inicial"
                  title="Voltar ao menu inicial"
                >
                  <Home size={18} />
                </button>
              )}
              <button
                onClick={() => setAberto(false)}
                className="rounded-full p-1 text-text-soft hover:bg-surface-2"
                aria-label="Fechar chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Área de mensagens */}
          <div className="max-h-[min(60vh,28rem)] overflow-y-auto px-4 py-3">
            {/* Nível 1: escolha da frente */}
            {nivel === "frentes" && (
              <div className="space-y-3">
                <p className="text-sm text-text-soft">
                  Olá! Sou o <strong className="text-text">Seu Nonô</strong>. Escolha uma
                  frente do portal para eu te guiar:
                </p>
                <ul className="space-y-2">
                  {FRENTES.map((f) => (
                    <li key={f.id}>
                      <button
                        onClick={() => escolherFrente(f)}
                        className="flex w-full flex-col rounded-lg border border-border bg-surface-2 px-3 py-2 text-left hover:border-primary"
                      >
                        <span className="text-sm font-medium text-text">{f.titulo}</span>
                        <span className="text-xs text-text-soft">{f.descricao}</span>
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-border pt-3">
                  <p className="mb-2 text-xs text-text-soft">
                    Não encontrou o que procura?
                  </p>
                  {iaDisponivel ? (
                    <button
                      onClick={abrirIa}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/50 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
                    >
                      <Sparkles size={14} /> Perguntar à IA
                    </button>
                  ) : (
                    <p className="rounded-lg border border-dashed border-border bg-surface-2 px-3 py-2 text-xs text-text-soft">
                      A IA ainda não está configurada. Use os menus acima ou envie uma
                      sugestão pelo GitHub.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Nível 2: escolha do tema/categoria */}
            {nivel === "categorias" && frenteAtual && (
              <div className="space-y-3">
                <button
                  onClick={voltar}
                  className="flex items-center gap-1 text-xs text-text-soft hover:text-primary"
                >
                  <ChevronLeft size={14} /> Voltar às frentes
                </button>
                <p className="text-sm text-text-soft">
                  <strong className="text-text">{frenteAtual.titulo}</strong> — escolha um
                  tema:
                </p>
                <ul className="space-y-2">
                  {frenteAtual.categorias.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => escolherCategoria(c)}
                        className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-left text-sm font-medium text-text hover:border-primary"
                      >
                        {c.titulo}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Nível 3: escolha da pergunta */}
            {nivel === "perguntas" && frenteAtual && categoriaAtual && (
              <div className="space-y-3">
                <button
                  onClick={voltar}
                  className="flex items-center gap-1 text-xs text-text-soft hover:text-primary"
                >
                  <ChevronLeft size={14} /> Voltar a {frenteAtual.titulo}
                </button>
                <p className="text-sm text-text-soft">
                  <strong className="text-text">{categoriaAtual.titulo}</strong> — escolha
                  uma pergunta:
                </p>
                <ul className="space-y-2">
                  {categoriaAtual.perguntas.map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => escolherResposta(p)}
                        className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-left text-sm text-text hover:border-primary"
                      >
                        {p.pergunta}
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-border pt-3">
                  {iaDisponivel ? (
                    <button
                      onClick={abrirIa}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/50 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
                    >
                      <Sparkles size={14} /> Sua pergunta não está na lista? Perguntar à IA
                    </button>
                  ) : (
                    <p className="text-xs text-text-soft">
                      Se sua pergunta não estiver na lista, a IA será ativada assim que
                      houver uma chave de API configurada.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Nível 4: resposta pré-curada */}
            {nivel === "resposta" && resposta && (
              <div className="space-y-3">
                <button
                  onClick={voltar}
                  className="flex items-center gap-1 text-xs text-text-soft hover:text-primary"
                >
                  <ChevronLeft size={14} /> Voltar às perguntas
                </button>
                <div className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-text">
                  <strong className="text-primary">Você:</strong> {resposta.pergunta}
                </div>
                <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text">
                  <p className="whitespace-pre-wrap">{resposta.resposta}</p>
                  {(resposta.link || (resposta.links && resposta.links.length > 0)) && (
                    <ul className="mt-3 space-y-2">
                      {resposta.link && (
                        <li className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-2 py-1.5">
                          <Link
                            href={resposta.link.href}
                            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                          >
                            {resposta.link.texto} <ExternalLink size={12} />
                          </Link>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => abrirPagina(resposta.link!.href)}
                              className="rounded p-1 text-text-soft hover:bg-surface-2"
                              aria-label={`Abrir ${resposta.link.texto}`}
                              title="Abrir página"
                            >
                              <ExternalLink size={14} />
                            </button>
                            <button
                              onClick={async () => {
                                const ok = await copiarLink(resposta.link!.href);
                                if (ok) {
                                  setCopiado(resposta.link!.href);
                                  setTimeout(() => setCopiado((atual) => (atual === resposta.link!.href ? null : atual)), 1500);
                                }
                              }}
                              className="rounded p-1 text-text-soft hover:bg-surface-2"
                              aria-label={`Copiar link de ${resposta.link.texto}`}
                              title="Copiar link"
                            >
                              {copiado === resposta.link.href ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </li>
                      )}
                      {resposta.links?.map((l) => (
                        <li
                          key={l.href}
                          className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-2 py-1.5"
                        >
                          <Link
                            href={l.href}
                            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                          >
                            {l.texto} <ExternalLink size={12} />
                          </Link>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => abrirPagina(l.href)}
                              className="rounded p-1 text-text-soft hover:bg-surface-2"
                              aria-label={`Abrir ${l.texto}`}
                              title="Abrir página"
                            >
                              <ExternalLink size={14} />
                            </button>
                            <button
                              onClick={async () => {
                                const ok = await copiarLink(l.href);
                                if (ok) {
                                  setCopiado(l.href);
                                  setTimeout(() => setCopiado((atual) => (atual === l.href ? null : atual)), 1500);
                                }
                              }}
                              className="rounded p-1 text-text-soft hover:bg-surface-2"
                              aria-label={`Copiar link de ${l.texto}`}
                              title="Copiar link"
                            >
                              {copiado === l.href ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Nível 5: pergunta livre (IA) */}
            {nivel === "ia" && (
              <div className="space-y-3">
                <button
                  onClick={voltar}
                  className="flex items-center gap-1 text-xs text-text-soft hover:text-primary"
                >
                  <ChevronLeft size={14} /> Voltar
                </button>

                {!respostaIa && !erro && (
                  <>
                    <p className="text-sm text-text-soft">
                      Descreva o que você quer saber. A IA tentará responder com base nos
                      dados e documentação do portal.
                    </p>
                    <form onSubmit={enviarPerguntaLivre} className="flex gap-2">
                      <input
                        type="text"
                        value={perguntaLivre}
                        onChange={(e) => setPerguntaLivre(e.target.value)}
                        placeholder="Ex: maiores contratos de Betim em 2025"
                        className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                        disabled={carregando}
                      />
                      <button
                        type="submit"
                        disabled={carregando || !perguntaLivre.trim()}
                        className="rounded-lg bg-primary px-3 py-2 text-primary-ink hover:bg-primary/90 disabled:opacity-50"
                      >
                        <Sparkles size={16} />
                      </button>
                    </form>
                  </>
                )}

                {carregando && (
                  <p className="text-sm text-text-soft">Pensando...</p>
                )}

                {respostaComando && (
                  <div className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
                    <p className="flex items-center gap-1.5">
                      <Accessibility size={14} />
                      {respostaComando}
                    </p>
                  </div>
                )}

                {respostaIa && (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text">
                      <p className="whitespace-pre-wrap">{respostaIa}</p>
                    </div>
                    <button
                      onClick={() => {
                        setRespostaIa(null);
                        setErro(null);
                      }}
                      className="text-xs text-text-soft hover:text-primary"
                    >
                      ← Fazer outra pergunta
                    </button>
                  </div>
                )}

                {erro && (
                  <div className="rounded-lg border border-alert/30 bg-alert/10 px-3 py-2 text-sm text-alert">
                    {erro}
                    <p className="mt-1 text-xs">
                      Enquanto isso, tente usar os menus de respostas pré-curadas.
                    </p>
                  </div>
                )}

                {/* Comandos de acessibilidade disponíveis */}
                {!respostaIa && !respostaComando && !erro && !carregando && (
                  <div className="rounded-lg border border-dashed border-border bg-surface-2 px-3 py-2">
                    <p className="mb-1.5 text-xs font-medium text-text-soft">
                      Comandos de acessibilidade:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {["tema escuro", "tema claro", "aumentar texto", "diminuir texto", "cores daltônicas"].map((cmd) => (
                        <button
                          key={cmd}
                          onClick={() => {
                            setPerguntaLivre(cmd);
                          }}
                          className="rounded-md border border-border bg-surface px-2 py-0.5 text-[.7rem] text-text-soft hover:border-primary hover:text-primary"
                        >
                          {cmd}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rodapé */}
          <div className="border-t border-border bg-surface-2 px-4 py-2">
            {nivel === "frentes" ? (
              <p className="text-[.7rem] text-text-soft">
                Modo texto: respostas baseadas nas páginas do site. IA disponível apenas
                quando configurada.
              </p>
            ) : (
              <div className="flex items-center gap-2 text-[.7rem] text-text-soft">
                <Search size={12} />
                <span>
                  {nivel === "categorias" && "Passo 2: tema"}
                  {nivel === "perguntas" && "Passo 3: pergunta"}
                  {nivel === "resposta" && "Resposta pré-curada"}
                  {nivel === "ia" && "Pergunta livre com IA"}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nuvem de boas-vindas — aparece uma vez quando o FAB é visível */}
      {!aberto && !mostrouBoasVindas && !dismissBoasVindas && (
        <div className="cp-painel-entra mb-3 w-64 rounded-2xl border border-border bg-surface p-4 shadow-lg">
          <div className="flex items-start gap-2">
            <Bot size={18} className="mt-0.5 shrink-0 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-text">Oi! Eu sou o Seu Nonô.</p>
              <p className="mt-1 text-xs leading-relaxed text-text-soft">
                Clique aqui para tirar suas dúvidas sobre o portal. Posso te guiar
                pelas frentes, responder perguntas e até mudar o tema ou o tamanho do texto.
              </p>
            </div>
          </div>
          <button
            onClick={dismissarBoasVindas}
            className="mt-3 w-full rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
          >
            Entendi!
          </button>
        </div>
      )}

      {/* Botão flutuante */}
      {!aberto && (
        <button
          onClick={() => {
            setAberto(true);
            if (!mostrouBoasVindas && !dismissBoasVindas) dismissarBoasVindas();
          }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-ink shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Abrir assistente Seu Nonô"
        >
          <MessageCircle size={28} />
        </button>
      )}
    </div>
  );
}
