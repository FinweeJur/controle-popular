"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  Search,
  Home,
  Copy,
  Check,
  Accessibility,
  Zap,
  Maximize2,
  Minimize2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { formatNumberBR } from "@/lib/betim/format";
import {
  FRENTES,
  type SeuNonoFrente,
  type SeuNonoCategoria,
  type SeuNonoPergunta,
} from "./SeuNonoData";
import { obterSugestoesContextuais, type SugestaoContextual } from "@/lib/seo/contexto-pagina";
import { RessalvaIa } from "./RessalvaIa";

/** Avatar do Seu Nonô — imagem oficial (avatar.webp) com fallback de cor. */
function AvatarSeuNono({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/seunono/avatar.webp"
      alt="Seu Nonô"
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

interface DadoResumido {
  total?: number;
  valor?: string;
  top?: { nome: string; valor?: number; total?: number }[];
  texto?: string;
  erro?: string;
}

/** Uma fonte da resposta IA, no formato do contrato v2 (Fase 1). */
interface FonteIa {
  indice: number;
  titulo?: string;
  url?: string;
  rota?: string;
  texto: string;
  score: number;
}

/** Resposta IA completa — o widget guarda o detalhe para a ressalva e as fontes. */
interface RespostaChatIa {
  resposta: string;
  modelo: string;
  data: string;
  ressalva: true;
  verificacao?: "ok" | "parcial" | "falhou";
  fontes: FonteIa[];
  erro?: string;
}

/** Um turno da conversa IA — o histórico da tela cheia. */
interface TurnoIa {
  pergunta: string;
  resposta: string;
  modelo?: string;
  data?: string;
  verificacao?: "ok" | "parcial" | "falhou";
  fontes: FonteIa[];
}

/** Resolve a URL da fonte: interna vira URL absoluta, externa fica como está. */
function urlDaFonte(f: FonteIa): string {
  const href = f.url ?? f.rota ?? "#";
  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//")) {
    return href;
  }
  return typeof window !== "undefined" ? `${window.location.origin}${href}` : href;
}

/**
 * Renderiza a resposta da IA trocando os marcadores [n] por chips clicáveis
 * que abrem a fonte em aba nova — o padrão NotebookLM de citação inline.
 * Marcador sem fonte correspondente vira texto puro (nunca link morto).
 */
function renderizarRespostaComCitacoes(
  texto: string,
  fontes: FonteIa[],
  aoAbrir: (url: string) => void
): React.ReactNode[] {
  const partes = texto.split(/(\[\d+\])/g);
  return partes.map((parte, i) => {
    const m = parte.match(/^\[(\d+)\]$/);
    if (!m) return <span key={i}>{parte}</span>;
    const n = Number(m[1]);
    const fonte = fontes.find((f) => f.indice === n);
    if (!fonte) return <span key={i}>{parte}</span>;
    const url = urlDaFonte(fonte);
    return (
      <button
        key={i}
        onClick={() => aoAbrir(url)}
        title={`Abrir fonte ${n}: ${fonte.titulo ?? url}`}
        aria-label={`Abrir fonte ${n}: ${fonte.titulo ?? url}`}
        className="mx-0.5 inline-flex translate-y-[-1px] items-center rounded-md border border-primary/40 bg-primary/10 px-1.5 py-0 text-[.75rem] font-semibold leading-tight text-primary align-baseline hover:bg-primary/20"
      >
        {n}
      </button>
    );
  });
}

/** Card de uma fonte no painel lateral — trecho, score e ações. */
function CardFonte({
  fonte,
  copiado,
  aoAbrir,
  aoCopiar,
}: {
  fonte: FonteIa;
  copiado: string | null;
  aoAbrir: (url: string) => void;
  aoCopiar: (url: string) => Promise<boolean>;
}) {
  const url = urlDaFonte(fonte);
  return (
    <li className="rounded-lg border border-border bg-surface-2 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-text">
          <span className="mr-1 rounded bg-primary/10 px-1 text-[.7rem] font-bold text-primary">
            {fonte.indice}
          </span>
          {fonte.titulo ?? fonte.rota ?? "Fonte"}
        </p>
        <span className="shrink-0 text-[.65rem] text-text-soft">
          {(fonte.score * 100).toFixed(0)}%
        </span>
      </div>
      <p className="mt-1 line-clamp-3 text-[.7rem] leading-relaxed text-text-soft">
        {fonte.texto}
      </p>
      <div className="mt-1.5 flex items-center gap-1">
        <button
          onClick={() => aoAbrir(url)}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[.68rem] text-text-soft hover:border-primary hover:text-primary"
        >
          <ExternalLink size={11} /> Abrir
        </button>
        <button
          onClick={() => void aoCopiar(url)}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[.68rem] text-text-soft hover:border-primary hover:text-primary"
          aria-label={`Copiar link da fonte ${fonte.indice}`}
        >
          {copiado === url ? <Check size={11} className="text-primary" /> : <Copy size={11} />}
          {copiado === url ? "Copiado" : "Copiar"}
        </button>
      </div>
    </li>
  );
}

/** Mapeamento de rotas para o tipo de dado da API */
const ROTAS_DADOS: Record<string, string> = {
  "/betim/prefeitura/contratos": "contratos",
  "/betim/prefeitura/despesas": "despesas",
  "/betim/prefeitura/licitacoes": "licitacoes",
  "/ambiental/licenciamento": "licenciamento",
};

/** Ações rápidas por rota */
interface AcaoRapida {
  label: string;
  icone: React.ReactNode;
  acao: () => void;
}

function useAcoesRapidas(pathname: string | null): AcaoRapida[] {
  return useMemo(() => {
    if (!pathname) return [];
    const acoes: AcaoRapida[] = [];

    if (typeof window !== "undefined") {
      acoes.push({
        label: "Compartilhar",
        icone: <ExternalLink size={14} />,
        acao: async () => {
          const url = window.location.href;
          try {
            await navigator.clipboard.writeText(url);
          } catch {
            window.open(url, "_blank");
          }
        },
      });
    }

    if (pathname.includes("/contratos") || pathname.includes("/licitacoes")) {
      acoes.push({
        label: "Baixar dados",
        icone: <ExternalLink size={14} />,
        acao: () => {
          const path = pathname.split("?")[0];
          window.location.href = `${path}?download=csv`;
        },
      });
    }

    return acoes;
  }, [pathname]);
}

type Nivel = "frentes" | "categorias" | "perguntas" | "resposta" | "resposta-contexto" | "busca" | "ia";

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
 * No último degrau, a IA (RAG sobre o acervo do portal, `/api/chatbot`)
 * responde com citação `[n]` da fonte e ressalva visível. A IA é oferecida
 * sempre — o backend degrada com honestidade se não houver provedor.
 *
 * Expansível para TELA CHEIA (padrão NotebookLM): botão de expandir no
 * cabeçalho; em tela cheia, conversa com histórico à esquerda e painel de
 * fontes à direita. Diálogo modal acessível (`role="dialog"`, Esc fecha,
 * foco no input). Ver PLANO-SEU-NONO-NOTEBOOKLM.md.
 */
export function SeuNono() {
  const [aberto, setAberto] = useState(false);
  const [telaCheia, setTelaCheia] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const inputIaRef = useRef<HTMLInputElement>(null);

  const [nivel, setNivel] = useState<Nivel>("frentes");
  const [frente, setFrente] = useState<SeuNonoFrente | null>(null);
  const [categoria, setCategoria] = useState<SeuNonoCategoria | null>(null);
  const [resposta, setResposta] = useState<SeuNonoPergunta | null>(null);

  const [perguntaLivre, setPerguntaLivre] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [respostaIa, setRespostaIa] = useState<string | null>(null);
  const [detalheIa, setDetalheIa] = useState<RespostaChatIa | null>(null);
  const [turnosIa, setTurnosIa] = useState<TurnoIa[]>([]);
  const [copiado, setCopiado] = useState<string | null>(null);

  const [mostrouBoasVindas, setMostrouBoasVindas] = useState(true);
  const [dismissBoasVindas, setDismissBoasVindas] = useState(false);

  const [respostaComando, setRespostaComando] = useState<string | null>(null);

  const [sugestoesContextuais, setSugestoesContextuais] = useState<SugestaoContextual[]>([]);
  const [respostaContexto, setRespostaContexto] = useState<SugestaoContextual | null>(null);

  const [termoBusca, setTermoBusca] = useState("");
  const [resultadosBusca, setResultadosBusca] = useState<{ pergunta: string; resposta: string; link?: string; linkTexto?: string; frente?: string }[]>([]);

  const [dadosResumidos, setDadosResumidos] = useState<DadoResumido | null>(null);
  const [carregandoDados, setCarregandoDados] = useState(false);

  // A IA do assistente não depende de chave de API do lado do cliente: o
  // backend (provedores.ts/geracao.ts) decide entre API remota e Ollama
  // local e degrada com honestidade. O widget oferece a IA sempre, e o erro
  // honesto da rota aparece no nível "ia". (Correção do gate antigo, que
  // lia NEXT_PUBLIC_AI_API_KEY — variável que o backend nunca usou.)

  // Tela cheia: trava a rolagem do fundo e devolve o foco ao input da IA.
  useEffect(() => {
    if (!telaCheia) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focar = () => inputIaRef.current?.focus();
    const timer = window.setTimeout(focar, 50);
    return () => {
      document.body.style.overflow = anterior;
      window.clearTimeout(timer);
    };
  }, [telaCheia]);

  // Esc fecha a tela cheia — contrato de diálogo modal do resto do portal.
  useEffect(() => {
    if (!telaCheia) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTelaCheia(false);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [telaCheia]);

  useEffect(() => {
    if (pathname) {
      const sugestoes = obterSugestoesContextuais(pathname);
      setSugestoesContextuais(sugestoes);
    }
  }, [pathname]);

  // A nuvem de boas-vindas aparece uma vez por visitante (flag no localStorage).
  useEffect(() => {
    const jaViu = localStorage.getItem("cp_nono_seen") === "1";
    setMostrouBoasVindas(jaViu);
  }, []);

  // Reseta a navegação ao fechar para recomeçar do topo na próxima abertura.
  // O histórico de turnos da IA (`turnosIa`) sobrevive na sessão — é a
  // conversa que a tela cheia mostra.
  useEffect(() => {
    if (!aberto) {
      const timer = setTimeout(() => {
        setNivel("frentes");
        setFrente(null);
        setCategoria(null);
        setResposta(null);
        setRespostaIa(null);
        setDetalheIa(null);
        setErro(null);
        setPerguntaLivre("");
        setRespostaComando(null);
        setRespostaContexto(null);
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

  function escolherSugestaoContexto(s: SugestaoContextual) {
    setRespostaContexto(s);
    setNivel("resposta-contexto");
    setDadosResumidos(null);

    const tipoDado = ROTAS_DADOS[s.link];
    if (tipoDado) {
      setCarregandoDados(true);
      fetch(`/api/dados-resumidos?tipo=${tipoDado}`)
        .then((r) => r.json())
        .then((d) => {
          if (!d.erro) setDadosResumidos(d);
        })
        .catch(() => {})
        .finally(() => setCarregandoDados(false));
    }
  }

  function buscarPerguntas(termo: string) {
    setTermoBusca(termo);
    if (!termo.trim()) {
      setResultadosBusca([]);
      return;
    }

    const lower = termo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const resultados: typeof resultadosBusca = [];

    for (const frente of FRENTES) {
      for (const cat of frente.categorias) {
        for (const pergunta of cat.perguntas) {
          const texto = pergunta.pergunta.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const resposta = pergunta.resposta.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          if (texto.includes(lower) || resposta.includes(lower)) {
            resultados.push({
              pergunta: pergunta.pergunta,
              resposta: pergunta.resposta,
              link: pergunta.link?.href,
              linkTexto: pergunta.link?.texto,
              frente: frente.titulo,
            });
          }
        }
      }
    }

    setResultadosBusca(resultados.slice(0, 5));
  }

  function abrirBusca() {
    setNivel("busca");
    setTermoBusca("");
    setResultadosBusca([]);
  }

  function voltar() {
    if (nivel === "resposta") {
      setResposta(null);
      setNivel("perguntas");
    } else if (nivel === "resposta-contexto") {
      setRespostaContexto(null);
      setNivel("frentes");
    } else if (nivel === "busca") {
      setTermoBusca("");
      setResultadosBusca([]);
      setNivel("frentes");
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
    setDetalheIa(null);
    setErro(null);
    setPerguntaLivre("");
    setRespostaContexto(null);
  }

  function abrirPagina(href: string) {
    if (typeof window === "undefined") return;
    if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//")) {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = href;
    }
  }

  async function copiarLink(href: string): Promise<boolean> {
    if (typeof window === "undefined") return false;
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

  /** Abre a fonte da citação em aba nova — não navega a página do portal
   *  (a tela cheia do assistente não pode se perder num redirecionamento). */
  function abrirFonteEmAbaNova(url: string) {
    if (typeof window === "undefined") return;
    window.open(url, "_blank", "noopener,noreferrer");
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
      const dados = (await resp.json()) as RespostaChatIa;
      if (!resp.ok || dados.erro) {
        setErro(dados.erro ?? "Não consegui responder agora.");
      } else {
        const respostaTexto = dados.resposta ?? "";
        setRespostaIa(respostaTexto);
        setDetalheIa(dados);
        // Histórico da conversa — a tela cheia mostra todos os turnos.
        setTurnosIa((turnos) => [
          ...turnos,
          {
            pergunta: perguntaLivre,
            resposta: respostaTexto,
            modelo: dados.modelo,
            data: dados.data,
            verificacao: dados.verificacao,
            fontes: dados.fontes ?? [],
          },
        ]);
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
        <div
          role={telaCheia ? "dialog" : undefined}
          aria-modal={telaCheia ? true : undefined}
          aria-label={telaCheia ? "Seu Nonô — assistente em tela cheia" : undefined}
          className={
            telaCheia
              ? "fixed inset-0 z-[60] flex flex-col bg-surface"
              : "mb-3 w-[min(calc(100vw-2rem),24rem)] overflow-hidden rounded-2xl border border-border bg-surface shadow-lg"
          }
        >
          {/* Cabeçalho */}
          <div className="flex items-center justify-between border-b border-border bg-primary/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <AvatarSeuNono size={22} className="text-primary" />
              <div>
                <p className="font-display text-sm font-semibold text-text">Seu Nonô</p>
                <p className="text-[.7rem] text-text-soft">
                  Assistente do portal — respostas com fonte
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {nivel !== "busca" && (
                <button
                  onClick={abrirBusca}
                  className="rounded-full p-1 text-text-soft hover:bg-surface-2"
                  aria-label="Buscar no assistente"
                  title="Buscar"
                >
                  <Search size={18} />
                </button>
              )}
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
                onClick={() => setTelaCheia((v) => !v)}
                className="rounded-full p-1 text-text-soft hover:bg-surface-2"
                aria-label={telaCheia ? "Recolher para o modo flutuante" : "Expandir para tela cheia"}
                title={telaCheia ? "Recolher" : "Expandir"}
              >
                {telaCheia ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button
                onClick={() => setAberto(false)}
                className="rounded-full p-1 text-text-soft hover:bg-surface-2"
                aria-label="Fechar chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Área de mensagens — em tela cheia, conversa à esquerda e o
              painel de fontes à direita (padrão NotebookLM); no widget,
              a rolagem alta fica dentro do card. */}
          <div className={telaCheia ? "flex min-h-0 flex-1 flex-col lg:flex-row" : undefined}>
            <div
              className={
                telaCheia
                  ? "min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-8"
                  : "max-h-[min(60vh,28rem)] overflow-y-auto px-4 py-3"
              }
            >
            {/* Nível 1: escolha da frente */}
            {nivel === "frentes" && (
              <div className="space-y-3">
                {sugestoesContextuais.length > 0 ? (
                  <>
                    <p className="text-sm text-text-soft">
                      Olá! Sou o <strong className="text-text">Seu Nonô</strong>. Vi que você
                      está em <strong className="text-text">{pathname?.split("/").slice(1, 3).join("/") ?? "esta página"}</strong>.
                      Posso te ajudar com:
                    </p>
                    <ul className="space-y-2">
                      {sugestoesContextuais.map((s, i) => (
                        <li key={i}>
                          <button
                            onClick={() => escolherSugestaoContexto(s)}
                            className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-left hover:border-primary"
                          >
                            <Zap size={14} className="shrink-0 text-primary" />
                            <span className="text-sm text-text">{s.pergunta}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-border pt-3">
                      <p className="mb-2 text-xs text-text-soft">
                        Ou escolha uma frente do portal:
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-text-soft">
                      Sou o <strong className="text-text">Seu Nonô Alceu Dispor</strong>, chatbot do portal digital <strong className="text-text">Controle Popular do ONSA</strong> — Observatório Nacional Socioambiental, em controlepopular.com.br.</p>
                    <p className="mt-2 text-xs leading-relaxed text-text-soft">
                      Com raízes na História e na Geografia, o portal usa Inteligência
                      Artificial para somar na busca por justiça socioambiental e
                      fiscalização cidadã — gratuito, sem cadastro, de qualquer celular
                      ou computador. Reunimos dezenas de portais e dados públicos:
                      contratos, convênios, licenciamentos, mineração, barragens,
                      legislação e orçamento. Escolha uma frente para eu te guiar:
                    </p>
                  </>
                )}

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
                  <button
                    onClick={abrirIa}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/50 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
                  >
                    <Sparkles size={14} /> Perguntar à IA
                  </button>
                  <p className="mt-2 rounded-lg border border-dashed border-border bg-surface-2 px-3 py-2 text-xs text-text-soft">
                    A IA responde com base nas páginas do portal e cita a fonte.
                    Confira sempre antes de decidir.
                  </p>
                </div>
              </div>
            )}

            {/* Nível 0.5: busca */}
            {nivel === "busca" && (
              <div className="space-y-3">
                <button
                  onClick={voltar}
                  className="flex items-center gap-1 text-xs text-text-soft hover:text-primary"
                >
                  <ChevronLeft size={14} /> Voltar ao início
                </button>
                <p className="text-sm text-text-soft">
                  Busque por qualquer palavra-chave nas respostas do portal:
                </p>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-soft" />
                  <input
                    type="text"
                    value={termoBusca}
                    onChange={(e) => buscarPerguntas(e.target.value)}
                    placeholder="Ex: contrato, barragem, licença, voto..."
                    className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
                    autoFocus
                  />
                </div>
                {resultadosBusca.length > 0 && (
                  <ul className="space-y-2">
                    {resultadosBusca.map((r, i) => (
                      <li key={i}>
                        <button
                          onClick={() => {
                            setResposta({
                              id: `busca-${i}`,
                              pergunta: r.pergunta,
                              resposta: r.resposta,
                              link: r.link ? { href: r.link, texto: r.linkTexto ?? "Ver mais" } : undefined,
                            });
                            setNivel("resposta");
                          }}
                          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-left hover:border-primary"
                        >
                          <p className="text-sm font-medium text-text">{r.pergunta}</p>
                          <p className="mt-0.5 text-[.7rem] text-text-soft">{r.frente}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {termoBusca && resultadosBusca.length === 0 && (
                  <p className="rounded-lg border border-dashed border-border bg-surface-2 px-3 py-2 text-sm text-text-soft">
                    Nenhum resultado para &quot;{termoBusca}&quot;. Tente outra palavra ou use a IA.
                  </p>
                )}
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
                  <button
                    onClick={abrirIa}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/50 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
                  >
                    <Sparkles size={14} /> Sua pergunta não está na lista? Perguntar à IA
                  </button>
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

            {/* Nível 4.5: resposta de sugestão contextual */}
            {nivel === "resposta-contexto" && respostaContexto && (
              <div className="space-y-3">
                <button
                  onClick={voltar}
                  className="flex items-center gap-1 text-xs text-text-soft hover:text-primary"
                >
                  <ChevronLeft size={14} /> Voltar ao início
                </button>
                <div className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-text">
                  <strong className="text-primary">Você:</strong> {respostaContexto.pergunta}
                </div>
                <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text">
                  <p className="whitespace-pre-wrap">{respostaContexto.resposta}</p>

                  {carregandoDados && (
                    <p className="mt-2 text-xs text-text-soft">Carregando dados...</p>
                  )}

                  {dadosResumidos && !dadosResumidos.erro && (
                    <div className="mt-3 rounded-lg border border-border bg-surface px-3 py-2">
                      <p className="text-[.75em] font-medium uppercase tracking-wide text-text-soft">
                        Dados atuais
                      </p>
                      {dadosResumidos.total !== undefined && (
                        <p className="mt-1 font-display text-lg font-bold">
                          {formatNumberBR(dadosResumidos.total)}
                          <span className="ml-1 text-xs font-normal text-text-soft">
                            {respostaContexto.link?.includes("contrato") ? "contratos" :
                             respostaContexto.link?.includes("despesa") ? "despesas" :
                             respostaContexto.link?.includes("licita") ? "licitações" :
                             respostaContexto.link?.includes("licenci") ? "licenças" : "registros"}
                          </span>
                        </p>
                      )}
                      {dadosResumidos.valor && (
                        <p className="text-sm text-text-soft">
                          Valor total: <strong className="text-text">{dadosResumidos.valor}</strong>
                        </p>
                      )}
                      {dadosResumidos.top && dadosResumidos.top.length > 0 && (
                        <div className="mt-2">
                          <p className="text-[.7em] text-text-soft">Top 3:</p>
                          <ul className="mt-1 space-y-1">
                            {dadosResumidos.top.map((t, i) => (
                              <li key={i} className="flex justify-between text-xs">
                                <span className="truncate text-text">{t.nome}</span>
                                <span className="shrink-0 pl-2 font-tabular text-text-soft">
                                  {t.valor
                                    ? `R$ ${(t.valor / 1_000_000).toFixed(1)}M`
                                    : t.total
                                    ? `${t.total} contratos`
                                    : ""}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {respostaContexto.link && (
                    <ul className="mt-3 space-y-2">
                      <li className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-2 py-1.5">
                        <Link
                          href={respostaContexto.link}
                          className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                        >
                          {respostaContexto.linkTexto} <ExternalLink size={12} />
                        </Link>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => abrirPagina(respostaContexto.link)}
                            className="rounded p-1 text-text-soft hover:bg-surface-2"
                            aria-label={`Abrir ${respostaContexto.linkTexto}`}
                            title="Abrir página"
                          >
                            <ExternalLink size={14} />
                          </button>
                          <button
                            onClick={async () => {
                              const ok = await copiarLink(respostaContexto.link);
                              if (ok) {
                                setCopiado(respostaContexto.link);
                                setTimeout(() => setCopiado((atual) => (atual === respostaContexto.link ? null : atual)), 1500);
                              }
                            }}
                            className="rounded p-1 text-text-soft hover:bg-surface-2"
                            aria-label={`Copiar link de ${respostaContexto.linkTexto}`}
                            title="Copiar link"
                          >
                            {copiado === respostaContexto.link ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </li>
                    </ul>
                  )}
                </div>

                {useAcoesRapidas(pathname).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {useAcoesRapidas(pathname).map((a, i) => (
                      <button
                        key={i}
                        onClick={a.acao}
                        className="flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs text-text-soft hover:border-primary hover:text-primary"
                      >
                        {a.icone} {a.label}
                      </button>
                    ))}
                  </div>
                )}
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

                {/* A caixa de pergunta fica sempre visível na tela cheia —
                    a conversa continua; no modo widget, só antes da resposta. */}
                {((!respostaIa && !erro) || (telaCheia && !carregando)) && (
                  <>
                    <p className="text-sm text-text-soft">
                      Descreva o que você quer saber. A IA responde com base nas páginas do
                      portal e cita a fonte.
                    </p>
                    <form onSubmit={enviarPerguntaLivre} className="flex gap-2">
                      <input
                        ref={inputIaRef}
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
                    {telaCheia ? (
                      <ul className="space-y-4">
                        {turnosIa.map((turno, ti) => (
                          <li key={ti} className="space-y-2">
                            <div className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-text">
                              <strong className="text-primary">Você:</strong> {turno.pergunta}
                            </div>
                            <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text">
                              <p className="whitespace-pre-wrap">
                                {renderizarRespostaComCitacoes(
                                  turno.resposta,
                                  turno.fontes,
                                  abrirFonteEmAbaNova
                                )}
                              </p>
                              {turno.fontes.length > 0 && (
                                <ul className="mt-2 space-y-1 border-t border-border pt-2">
                                  {turno.fontes.map((f) => (
                                    <li
                                      key={f.indice}
                                      className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-2 py-1 text-xs"
                                    >
                                      <span className="truncate text-text-soft">
                                        {f.indice}. {f.titulo ?? f.rota}
                                      </span>
                                      <span className="flex shrink-0 items-center gap-1">
                                        <button
                                          onClick={() => abrirFonteEmAbaNova(urlDaFonte(f))}
                                          className="rounded p-0.5 text-text-soft hover:bg-surface-2"
                                          aria-label={`Abrir fonte ${f.indice}`}
                                        >
                                          <ExternalLink size={12} />
                                        </button>
                                        <button
                                          onClick={async () => {
                                            const u = urlDaFonte(f);
                                            const ok = await copiarLink(u);
                                            if (ok) {
                                              setCopiado(u);
                                              setTimeout(() => setCopiado((atual) => (atual === u ? null : atual)), 1500);
                                            }
                                          }}
                                          className="rounded p-0.5 text-text-soft hover:bg-surface-2"
                                          aria-label={`Copiar link da fonte ${f.indice}`}
                                        >
                                          {copiado === urlDaFonte(f) ? (
                                            <Check size={12} className="text-primary" />
                                          ) : (
                                            <Copy size={12} />
                                          )}
                                        </button>
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              <div className="mt-2">
                                <RessalvaIa
                                  modelo={turno.modelo}
                                  data={turno.data}
                                  verificacao={turno.verificacao}
                                />
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="space-y-3">
                        <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text">
                          <p className="whitespace-pre-wrap">
                            {renderizarRespostaComCitacoes(
                              respostaIa,
                              detalheIa?.fontes ?? [],
                              abrirFonteEmAbaNova
                            )}
                          </p>
                          {detalheIa && detalheIa.fontes.length > 0 && (
                            <ul className="mt-2 space-y-1 border-t border-border pt-2">
                              {detalheIa.fontes.map((f) => (
                                <li
                                  key={f.indice}
                                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-2 py-1 text-xs"
                                >
                                  <span className="truncate text-text-soft">
                                    {f.indice}. {f.titulo ?? f.rota}
                                  </span>
                                  <span className="flex shrink-0 items-center gap-1">
                                    <button
                                      onClick={() => abrirFonteEmAbaNova(urlDaFonte(f))}
                                      className="rounded p-0.5 text-text-soft hover:bg-surface-2"
                                      aria-label={`Abrir fonte ${f.indice}`}
                                    >
                                      <ExternalLink size={12} />
                                    </button>
                                    <button
                                      onClick={async () => {
                                        const u = urlDaFonte(f);
                                        const ok = await copiarLink(u);
                                        if (ok) {
                                          setCopiado(u);
                                          setTimeout(() => setCopiado((atual) => (atual === u ? null : atual)), 1500);
                                        }
                                      }}
                                      className="rounded p-0.5 text-text-soft hover:bg-surface-2"
                                      aria-label={`Copiar link da fonte ${f.indice}`}
                                    >
                                      {copiado === urlDaFonte(f) ? (
                                        <Check size={12} className="text-primary" />
                                      ) : (
                                        <Copy size={12} />
                                      )}
                                    </button>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="mt-2">
                            <RessalvaIa
                              modelo={detalheIa?.modelo}
                              data={detalheIa?.data}
                              verificacao={detalheIa?.verificacao}
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setRespostaIa(null);
                            setDetalheIa(null);
                            setErro(null);
                          }}
                          className="text-xs text-text-soft hover:text-primary"
                        >
                          ← Fazer outra pergunta
                        </button>
                      </div>
                    )}
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

            {telaCheia && (
              <aside
                aria-label="Fontes desta resposta"
                className="shrink-0 border-t border-border bg-surface-2 px-4 py-3 lg:w-80 lg:border-l lg:border-t-0"
              >
                <h2 className="font-display text-sm font-semibold text-text">
                  Fontes desta resposta
                </h2>
                <p className="mt-0.5 text-xs text-text-soft">
                  Páginas do portal usadas na resposta. Abra ou copie para conferir.
                </p>
                {(detalheIa?.fontes ?? []).length > 0 ? (
                  <ul className="mt-2 space-y-2">
                    {(detalheIa?.fontes ?? []).map((f) => (
                      <CardFonte
                        key={f.indice}
                        fonte={f}
                        copiado={copiado}
                        aoAbrir={abrirFonteEmAbaNova}
                        aoCopiar={copiarLink}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-text-soft">
                    Faça uma pergunta à IA para ver aqui as fontes usadas na resposta.
                  </p>
                )}
              </aside>
            )}
          </div>

          {/* Rodapé */}
          <div className="border-t border-border bg-surface-2 px-4 py-2">
            {nivel === "frentes" ? (
              <p className="text-[.7rem] text-text-soft">
                Respostas prontas das páginas do site; a IA cita a fonte de cada
                resposta. Confira sempre antes de decidir.
              </p>
            ) : (
              <div className="flex items-center gap-2 text-[.7rem] text-text-soft">
                <Search size={12} />
                <span>
                  {nivel === "categorias" && "Passo 2: tema"}
                  {nivel === "perguntas" && "Passo 3: pergunta"}
                  {nivel === "resposta" && "Resposta pré-curada"}
                  {nivel === "resposta-contexto" && "Sugestão da página"}
                  {nivel === "busca" && "Buscando..."}
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
            <AvatarSeuNono size={20} className="mt-0.5 shrink-0 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-text">Oi! Sou o Seu Nonô, do portal Controle Popular do ONSA.</p>
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
          className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-primary-ink/20 bg-primary shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Abrir assistente Seu Nonô"
        >
          <AvatarSeuNono size={44} className="h-full w-full" />
        </button>
      )}
    </div>
  );
}
