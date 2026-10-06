"use client";

/**
 * @file SeuNono.tsx
 * @description Assistente Cívico Seu Nonô — inteligência popular do portal Controle Popular.
 * 
 * Papel no portal:
 * Guia o cidadão por frentes temáticas (Cidades, Congresso, Judiciário, Meio Ambiente, Paraopeba),
 * respostas pré-curadas, sugestões contextuais da rota atual e degraus determinísticos da Regra de Escada.
 * Oferece modo widget flutuante e modo tela cheia expansível com histórico de turnos e painel de fontes.
 * 
 * Regras e decisões:
 * - Regra de Escada: intercepta termos diretos (Laboratório, Cidades, Empresas, Respostas Curadas) antes da IA.
 * - Efeito Typewriter: animação de digitação progressiva suave (~16ms) com cursor pulsante ▋ e fases de status.
 * - Acessibilidade: botão 'Pular animação', clique no cartão para aceleração e atalhos de alto contraste e fontes.
 * - Citação direta e auditável: marcadores [n] com deep links para fontes oficiais primárias.
 * - Seletor de pet (02/10/2026): o nível "pets" é um cartão de rádio-opções
 *   que troca o bichinho do `CompanheiroFlutuante` via evento da janela
 *   (`cp:companheiro-trocar-pet`) — o bicho mora em outro componente.
 * - Pilha da lateral esquerda (pedido do dono, 03/10/2026): TRÊS botões
 *   redondos sobrepostos, de baixo para cima — FAB do Seu Nonô, pata do
 *   pet e botão da rádio (em `PlayerRadio.tsx`). Sobreposição de 16 px em
 *   cada emenda e alinhamento pelo centro de 56 px: as três geometrias são
 *   combinadas entre este arquivo e o PlayerRadio; mudar uma exige mudar
 *   as duas (o comentário de cada uma traz a régua em px).
 * - Barra de busca fixa (pedido do dono, 03/10/2026): a janelinha abre com
 *   `SeuNonoBusca` no rodapé, não com o botão "Perguntar à IA". Digitar sugere
 *   páginas do portal e respostas pré-curadas (expandindo para cima); só o
 *   Enter SEM correspondência aciona a IA. Os níveis por baixo não mudaram.
 */

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  ArrowRight,
  GripVertical,
  PawPrint,
} from "lucide-react";
import { useArrastavel } from "@/lib/usarArrastavel";
import { usePosicaoPainel, type CaixaAncora } from "@/lib/posicionar-painel";
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
import { PETS_COMPANHEIRO, PET_PADRAO } from "./companheiroPets";
import { PetIcone } from "./PetIcone";
import { obterSugestoesContextuais, type SugestaoContextual } from "@/lib/seo/contexto-pagina";
import { RessalvaIa } from "./RessalvaIa";
import { SeuNonoBusca } from "./SeuNonoBusca";
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
import { obterLinksRelacionadosGalho } from "@/lib/assistente/arvore-galhos";

/** Avatar do Seu Nonô — imagem oficial (avatar.webp) com fallback de cor. */
function AvatarSeuNono({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/seunono/avatar.webp"
      alt="Seu Nonô"
      width={size}
      height={size}
      // `draggable={false}`: sem isto o navegador inicia o arrasto NATIVO da
      // imagem e emite `pointercancel`, travando o arrasto do widget no
      // primeiro pixel (medido com Playwright em 03/10/2026). O hook também
      // cancela o `dragstart`, mas aqui o próprio elemento já nasce imóvel.
      draggable={false}
      className={`shrink-0 rounded-full object-cover ${className}`}
      style={className.includes("h-full") || className.includes("w-full") ? undefined : { width: size, height: size }}
    />
  );
}

/** Lado do FAB do Seu Nonô (`h-14 w-14`), a âncora do reposicionamento. */
const LADO_FAB = 56;

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
  escada?: ResultadoEscada;
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
        data-companheiro-alvo="fonte"
        data-companheiro-indice={n}
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

/**
 * Renderizador de resposta IA com digitação progressiva e citações interativas.
 */
function BlocoRespostaIaSeuNono({
  resposta,
  fontes,
  modelo,
  data,
  verificacao,
  copiado,
  aoAbrir,
  aoCopiar,
  animar = true,
}: {
  resposta: string;
  fontes: FonteIa[];
  modelo?: string;
  data?: string;
  verificacao?: "ok" | "parcial" | "falhou";
  copiado: string | null;
  aoAbrir: (url: string) => void;
  aoCopiar: (url: string) => Promise<boolean>;
  animar?: boolean;
}) {
  const { textoExibido, concluido, pular } = useTypewriter({
    texto: resposta,
    velocidadeMs: 16,
    autoIniciar: animar,
  });

  return (
    <div
      onClick={pular}
      className="space-y-3 cursor-pointer"
      title={concluido ? undefined : "Clique para exibir o texto completo"}
    >
      <div className="rounded-lg border border-border bg-surface-2 px-3.5 py-3 text-sm text-text transition-colors hover:border-amber-500/30">
        <p className="whitespace-pre-wrap leading-relaxed">
          {renderizarRespostaComCitacoes(textoExibido, fontes, aoAbrir)}
          {!concluido && <CursorPulsante />}
        </p>

        <BotaoPularAnimacao aoPular={pular} concluido={concluido} />

        {fontes.length > 0 && (
          <ul className="mt-3 space-y-1.5 border-t border-border pt-2.5">
            {fontes.map((f) => (
              <li
                key={f.indice}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs"
              >
                <span className="truncate text-text-soft">
                  <span className="mr-1 rounded bg-primary/10 px-1 py-0.5 text-[0.68rem] font-bold text-primary">
                    {f.indice}
                  </span>
                  {f.titulo ?? f.rota}
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      aoAbrir(urlDaFonte(f));
                    }}
                    className="rounded p-1 text-text-soft hover:bg-surface-2"
                    aria-label={`Abrir fonte ${f.indice}`}
                  >
                    <ExternalLink size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await aoCopiar(urlDaFonte(f));
                    }}
                    className="rounded p-1 text-text-soft hover:bg-surface-2"
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

        {(() => {
          const rotaBase = fontes[0]?.rota || "";
          const galho = rotaBase ? obterLinksRelacionadosGalho(rotaBase, 3) : null;
          if (!galho || galho.links.length === 0) return null;
          return (
            <div className="mt-3 pt-2.5 border-t border-border">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[0.68rem] font-semibold text-text-soft flex items-center gap-1">
                  <span>🌿</span>
                  <span>Páginas no mesmo eixo:</span>
                  <span className="font-bold text-foreground">{galho.eixoNome}</span>
                </span>
                <Link
                  href="/laboratorio/arvore"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[0.65rem] text-primary hover:underline inline-flex items-center gap-0.5"
                >
                  <span>Árvore de links</span>
                  <ExternalLink size={10} />
                </Link>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {galho.links.map((link, idx) => (
                  <Link
                    key={idx}
                    href={link.href}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-surface px-2 py-0.5 text-[0.72rem] text-text-soft hover:text-foreground hover:border-primary/50 transition-colors"
                  >
                    <span>{link.rotulo}</span>
                    <ArrowRight size={10} className="opacity-60" />
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}

        <div className="mt-3">
          <RessalvaIa
            modelo={modelo}
            data={data}
            verificacao={verificacao}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Renderizador de resposta determinística (Regra de Escada) com botões e atalhos rápidos.
 */
function BlocoRespostaEscadaSeuNono({
  resultado,
  animar = true,
}: {
  resultado: ResultadoEscada;
  animar?: boolean;
}) {
  const { textoExibido, concluido, pular } = useTypewriter({
    texto: resultado.texto,
    velocidadeMs: 16,
    autoIniciar: animar,
  });

  return (
    <div
      onClick={pular}
      className="rounded-xl border border-amber-500/40 bg-surface-2 p-4 text-sm text-text cursor-pointer transition-colors hover:border-amber-500/60"
      title={concluido ? undefined : "Clique para exibir o texto completo"}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[0.68rem] font-bold text-amber-800 dark:text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
          <Sparkles className="h-2.5 w-2.5" />
          {resultado.categoria ?? "Resposta Direta"}
        </span>
      </div>
      <h3 className="font-display text-sm font-bold text-foreground">
        {resultado.titulo}
      </h3>
      {resultado.subtitulo && (
        <p className="text-[0.72rem] text-text-soft mb-2">{resultado.subtitulo}</p>
      )}

      <p className="mt-1.5 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
        {textoExibido}
        {!concluido && <CursorPulsante />}
      </p>

      <BotaoPularAnimacao aoPular={pular} concluido={concluido} />

      {resultado.atalhos.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-border">
          <p className="mb-2 text-[0.72rem] font-semibold text-text-soft">
            Atalhos e ações diretas:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {resultado.atalhos.map((a, i) => (
              <Link
                key={i}
                href={a.href}
                onClick={(e) => e.stopPropagation()}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  a.principal
                    ? "bg-primary text-white hover:opacity-90 font-bold"
                    : "border border-border bg-surface hover:bg-surface-2 hover:border-amber-500/40 text-foreground"
                }`}
              >
                <span>{a.rotulo}</span>
                <ArrowRight size={11} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {resultado.galhoRelacionado && resultado.galhoRelacionado.links.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-border/70">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[0.68rem] font-semibold text-text-soft flex items-center gap-1">
              <span>🌿</span>
              <span>Páginas no mesmo eixo:</span>
              <span className="font-bold text-foreground">{resultado.galhoRelacionado.eixoNome}</span>
              <span className="text-[0.62rem] text-text-soft/80">({resultado.galhoRelacionado.subgalho})</span>
            </span>
            <Link
              href="/laboratorio/arvore"
              onClick={(e) => e.stopPropagation()}
              className="text-[0.65rem] text-primary hover:underline inline-flex items-center gap-0.5"
            >
              <span>Árvore de links</span>
              <ExternalLink size={10} />
            </Link>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {resultado.galhoRelacionado.links.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-surface px-2 py-0.5 text-[0.72rem] text-text-soft hover:text-foreground hover:border-amber-500/50 transition-colors"
              >
                <span>{link.rotulo}</span>
                <ArrowRight size={10} className="opacity-60" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
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

type Nivel = "frentes" | "categorias" | "perguntas" | "resposta" | "resposta-contexto" | "busca" | "ia" | "pets";

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

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [respostaIa, setRespostaIa] = useState<string | null>(null);
  const [resultadoEscada, setResultadoEscada] = useState<ResultadoEscada | null>(null);
  const [statusChat, setStatusChat] = useState<StatusTypewriter>("pronto");
  const [detalheIa, setDetalheIa] = useState<RespostaChatIa | null>(null);
  const [turnosIa, setTurnosIa] = useState<TurnoIa[]>([]);
  const [copiado, setCopiado] = useState<string | null>(null);

  const [mostrouBoasVindas, setMostrouBoasVindas] = useState(true);
  const [dismissBoasVindas, setDismissBoasVindas] = useState(false);

  const [respostaComando, setRespostaComando] = useState<string | null>(null);

  const [respostaContexto, setRespostaContexto] = useState<SugestaoContextual | null>(null);

  const [termoBusca, setTermoBusca] = useState("");
  const [resultadosBusca, setResultadosBusca] = useState<{ pergunta: string; resposta: string; link?: string; linkTexto?: string; frente?: string }[]>([]);

  // Seletor de pet do companheiro (checkboxes no chat — podem ser VÁRIOS
  // na tela, pedido do dono em 02/10/2026). A lista salva só é lida em
  // clique (`lePetSalvo`), nunca na renderização inicial — o servidor não
  // tem `localStorage` e o padrão é o qiaowei (`PET_PADRAO`).
  const [escolhidosPet, setEscolhidosPet] = useState<string[]>([PET_PADRAO]);
  const [confirmaPet, setConfirmaPet] = useState<string | null>(null);

  // O companheiro flutuante responde toda alternância com a lista completa
  // (`cp:companheiro-pets`) — sincroniza o cartão quando a troca veio de
  // fora (ex.: menu de clique direito no bicho). Só interessa com o
  // cartão aberto.
  useEffect(() => {
    if (nivel !== "pets") return;
    const aoMudar = (e: Event) => {
      const slugs = (e as CustomEvent<{ slugs?: string[] }>).detail?.slugs;
      if (Array.isArray(slugs) && slugs.length > 0) setEscolhidosPet(slugs);
    };
    window.addEventListener("cp:companheiro-pets", aoMudar);
    return () => window.removeEventListener("cp:companheiro-pets", aoMudar);
  }, [nivel]);

  const [dadosResumidos, setDadosResumidos] = useState<DadoResumido | null>(null);
  const [carregandoDados, setCarregandoDados] = useState(false);

  // Widget arrastável: o canto pode tapar o conteúdo; a posição fica
  // lembrada no `localStorage` (pedido do dono, 30/09/2026). O botão do FAB
  // e o cabeçalho do painel servem de pega.
  //
  // O DIV que recebe o `translate` leva `data-arrastavel-caixa`: o hook mede
  // a caixa DELE, não a da pega (cabeçalho/FAB, filhos menores). Sem isso, o
  // clamp media o cabeçalho (40 px) e deixava o painel (619 px) deslizar
  // para fora por baixo; conserto medido em 03/10/2026.
  const { estilo, arrastando, foiArrasto, handlers, resetar } =
    useArrastavel("cp_nono_pos");

  // A PATA tem arrasto PRÓPRIO (dono, 06/10/2026: "quando arrasta o Seu Nonô
  // arrasta o pet junto; deixar cada um separado"). Antes ela dividia a MESMA
  // caixa arrastável do FAB (medido: `data-arrastavel-caixa` de 282×351 px com
  // os dois dentro), então mover o assistente levava a porta do pet junto.
  // Agora cada um tem posição e caixa próprias (`cp_pata_pos`).
  const {
    estilo: estiloPata,
    arrastando: arrastandoPata,
    foiArrasto: foiArrastoPata,
    handlers: handlersPata,
    resetar: resetarPata,
  } = useArrastavel("cp_pata_pos");

  // Reposicionamento da janelinha (pedido do dono, 03/10/2026): arrastada para
  // a direita, ela ainda EXPANDIA para a direita e saía da tela. Aqui a base do
  // FAB é a âncora; o utilitário vira o painel para a esquerda quando falta
  // espaço à direita e limita a altura para o topo não passar da borda. O
  // painel continua no fluxo (o arrasto move o conjunto por `transform`), então
  // o resultado vira `marginLeft`; `maxHeight` faz o miolo rolar.
  const nonoRef = useRef<HTMLDivElement | null>(null);
  const painelNonoRef = useRef<HTMLDivElement | null>(null);
  const medirAncoraNono = useCallback((): CaixaAncora | null => {
    const el = nonoRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    // Âncora sintética: a base do FAB (canto inferior esquerdo do conjunto).
    // `alt: 0` porque o painel ocupa o espaço ACIMA dessa base.
    return { esq: r.left, topo: r.bottom, larg: LADO_FAB, alt: 0 };
  }, []);
  // A tela cheia usa `fixed inset-0`: não há o que reposicionar ali.
  const posNono = usePosicaoPainel({
    aberto: aberto && !telaCheia,
    painelRef: painelNonoRef,
    medirAncora: medirAncoraNono,
    opcoes: { verticalPreferida: "acima", forcarVertical: true },
  });

  const acoesRapidas = useAcoesRapidas(pathname);

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

  // Sugestões da página atual: derivadas do caminho, sem estado próprio e
  // sem efeito — o componente já re-renderiza a cada troca de rota, então
  // guardar em estado só criava uma renderização extra (corrige o erro
  // `react-hooks/set-state-in-effect` do eslint). A sugestão que aponta
  // para a própria página é descartada: não sugiro ir para onde o leitor já está.
  const sugestoesContextuais = useMemo<SugestaoContextual[]>(() => {
    if (!pathname) return [];
    const sugestoes = obterSugestoesContextuais(pathname);
    const rotaLimpa = pathname.replace(/\/$/, "");
    return sugestoes.filter((s) => s.link.replace(/\/$/, "") !== rotaLimpa);
  }, [pathname]);

  // A nuvem de boas-vindas aparece uma vez por visitante (flag no localStorage).
  // `localStorage` só existe depois da hidratação: ler durante o render faria
  // o cliente divergir do HTML do servidor (erro de hidratação). Por isso a
  // leitura fica aqui no efeito, com a permissão documentada no portal.
  useEffect(() => {
    const jaViu = localStorage.getItem("cp_nono_seen") === "1";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leitura pos-hidratacao de localStorage: no SSR o objeto nao existe e o HTML do servidor nao pode refletir a flag
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
        setResultadoEscada(null);
        setStatusChat("pronto");
        setDetalheIa(null);
        setErro(null);
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
        comando: ["tema pequi", "pequi", "tema padrao", "padrao"],
        label: "Tema pequi (padrão)",
        acao: () => setTheme("pequi"),
        icone: <span className="text-base">🌰</span>,
      },
      {
        comando: ["tema claro", "light", "modo claro", "claro"],
        label: "Tema claro",
        acao: () => setTheme("light"),
        icone: <span className="text-base">☀️</span>,
      },
      {
        comando: ["tema cerrado", "cerrado"],
        label: "Tema cerrado",
        acao: () => setTheme("cerrado"),
        icone: <span className="text-base">🌾</span>,
      },
      {
        comando: ["tema mata atlantica", "mata atlantica", "floresta"],
        label: "Tema mata atlântica",
        acao: () => setTheme("mata-atlantica"),
        icone: <span className="text-base">🌿</span>,
      },
      {
        comando: ["tema caatinga", "caatinga", "sertao"],
        label: "Tema caatinga",
        acao: () => setTheme("caatinga"),
        icone: <span className="text-base">🌵</span>,
      },
      {
        comando: ["tema pantanal", "pantanal", "aguas"],
        label: "Tema pantanal",
        acao: () => setTheme("pantanal"),
        icone: <span className="text-base">💧</span>,
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

  /**
   * Lê a lista de pets gravada no `localStorage` (slugs separados por
   * vírgula; um slug só, de antes da multipla escolha, também serve).
   * Só roda dentro de clique — no servidor e no primeiro render o objeto
   * não existe e o padrão é o qiaowei (`PET_PADRAO`).
   */
  function lePetSalvo(): string[] {
    try {
      const salvo = window.localStorage.getItem("cp_pet");
      if (salvo === "-") return []; // "sem bichinhos" — escolha explícita do leitor
      if (!salvo) return [PET_PADRAO];
      const vistos = new Set<string>();
      const lista: string[] = [];
      for (const bruto of salvo.split(",")) {
        const slug = bruto.trim();
        if (!slug || vistos.has(slug)) continue;
        vistos.add(slug);
        if (PETS_COMPANHEIRO.some((p) => p.slug === slug)) lista.push(slug);
      }
      return lista.length > 0 ? lista : [PET_PADRAO];
    } catch {
      return [PET_PADRAO];
    }
  }

  /** Abre o cartão de checkboxes já com os bichos atuais marcados. */
  function abrirPets() {
    setEscolhidosPet(lePetSalvo());
    setConfirmaPet(null);
    setNivel("pets");
  }

  /**
   * Alterna o pet e avisa o companheiro flutuante.
   * O bicho mora em outro componente (`CompanheiroFlutuante`), então a
   * alternância viaja por evento da janela — mesmo caminho do menu de
   * clique direito. Quem persiste no `localStorage` é ele (lista CSV em
   * `cp_pet`) e responde com `cp:companheiro-pets`; este cartão só
   * despacha e atualiza a marcação local. O último não sai da tela.
   */
  function alternarPetNoChat(slug: string) {
    const alvo = PETS_COMPANHEIRO.find((p) => p.slug === slug);
    if (!alvo) return;
    const tem = escolhidosPet.includes(slug);
    if (tem && escolhidosPet.length === 1) {
      setConfirmaPet("Sem isso: fica sempre pelo menos um bichinho na tela.");
      return;
    }
    const nova = tem
      ? escolhidosPet.filter((s) => s !== slug)
      : [...escolhidosPet, slug];
    setEscolhidosPet(nova);
    setConfirmaPet(
      tem
        ? `${alvo.nome} saiu da tela. Agora são ${nova.length} com você.`
        : `Pronto: ${alvo.nome} entra na tela. Agora são ${nova.length} com você.`,
    );
    window.dispatchEvent(new CustomEvent("cp:companheiro-trocar-pet", { detail: { slug } }));
  }

  /** Tira TODOS os bichinhos da tela (some o companheiro flutuante). */
  function limparPetsNoChat() {
    setEscolhidosPet([]);
    setConfirmaPet("Todos os bichinhos saíram da tela.");
    window.dispatchEvent(new CustomEvent("cp:companheiro-limpar-pets"));
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
    } else if (nivel === "pets") {
      setConfirmaPet(null);
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
      setResultadoEscada(null);
      setStatusChat("pronto");
      setNivel(categoria ? "perguntas" : frente ? "categorias" : "frentes");
    }
  }

  function voltarAoInicio() {
    setNivel("frentes");
    setFrente(null);
    setCategoria(null);
    setResposta(null);
    setRespostaIa(null);
    setResultadoEscada(null);
    setStatusChat("pronto");
    setDetalheIa(null);
    setErro(null);
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

  async function executarPerguntaIa(texto: string) {
    const trimmed = texto.trim();
    if (!trimmed) return;

    // Verifica se é comando de acessibilidade antes de enviar à IA
    const cmdResposta = detectarComandoAcessibilidade(trimmed);
    if (cmdResposta) {
      setRespostaComando(cmdResposta);
      setRespostaIa(null);
      setResultadoEscada(null);
      setErro(null);
      setStatusChat("pronto");
      return;
    }

    setCarregando(true);
    setErro(null);
    setRespostaIa(null);
    setResultadoEscada(null);
    setRespostaComando(null);
    setNivel("ia");
    setStatusChat("consultando");

    // 1. Degraus Determinísticos (Regra de Escada — Revelação Imediata)
    const degrau = avaliarEscadaDeterminista(trimmed, pathname ?? undefined);
    if (degrau) {
      setResultadoEscada(degrau);
      setStatusChat("pronto");
      setCarregando(false);
      setTurnosIa((turnos) => [
        ...turnos,
        {
          pergunta: trimmed,
          resposta: degrau.texto,
          fontes: [],
          escada: degrau,
        },
      ]);
      return;
    }

    // 2. Chamada à API RAG
    try {
      const resp = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pergunta: trimmed,
          pathname: pathname ?? "",
          titulo: typeof document !== "undefined" ? document.title : "",
        }),
      });
      const dados = (await resp.json()) as RespostaChatIa;
      if (!resp.ok || dados.erro) {
        setErro(dados.erro ?? "Não consegui responder agora.");
        setStatusChat("pronto");
      } else {
        const respostaTexto = dados.resposta ?? "";
        setStatusChat("estruturando");
        setTimeout(() => {
          setRespostaIa(respostaTexto);
          setDetalheIa(dados);
          setStatusChat("digitando");
          setTurnosIa((turnos) => [
            ...turnos,
            {
              pergunta: trimmed,
              resposta: respostaTexto,
              modelo: dados.modelo,
              data: dados.data,
              verificacao: dados.verificacao,
              fontes: dados.fontes ?? [],
            },
          ]);
        }, 150);
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro de rede");
      setStatusChat("pronto");
    } finally {
      setCarregando(false);
    }
  }

  /**
   * Mostra a resposta pré-curada escolhida na barra do Seu Nonô.
   *
   * Reusa o cartão determinístico (`BlocoRespostaEscadaSeuNono`) e registra a
   * escolha como um turno — assim a resposta sobrevive quando a pessoa expande
   * o widget para tela cheia. O nível vira "ia" para o cartão renderizar; como
   * a curadoria já é resposta pronta, a IA não é acionada.
   */
  function aoEscolherCuradoria(resultado: ResultadoEscada, termo: string) {
    setRespostaIa(null);
    setDetalheIa(null);
    setErro(null);
    setRespostaComando(null);
    setResultadoEscada(resultado);
    setStatusChat("pronto");
    setNivel("ia");
    setTurnosIa((turnos) => [
      ...turnos,
      { pergunta: termo, resposta: resultado.texto, fontes: [], escada: resultado },
    ]);
  }

  // Listener para abertura remota a partir de botões na Home e tabelas.
  // O ref é atualizado num efeito (e não no render): ref durante o render
  // é erro do eslint `react-hooks/refs` — e aqui não muda comportamento,
  // porque o listener só lê o ref no clique, quando o efeito já rodou.
  const executarPerguntaIaRef = useRef(executarPerguntaIa);
  useEffect(() => {
    executarPerguntaIaRef.current = executarPerguntaIa;
  });

  useEffect(() => {
    const handleAbrir = (e: Event) => {
      const detail = (e as CustomEvent<{ pergunta?: string }>).detail;
      setAberto(true);
      if (detail?.pergunta) {
        const p = detail.pergunta.trim();
        executarPerguntaIaRef.current(p);
      }
    };
    window.addEventListener("abrir-seu-nono", handleAbrir);
    return () => window.removeEventListener("abrir-seu-nono", handleAbrir);
  }, []);

  return (
    <>
    <div
      // Em tela cheia o painel usa `fixed inset-0`; um `transform` no
      // ancestral o prenderia à caixa arrastada, então a pega some ali.
      // `safe-area`: a barra do sistema do iPhone cobre um `bottom-4` fixo;
      // o max() sobe a pilha inteira quando há inset. O PlayerRadio repete
      // a mesma conta para o botão de cima continuar alinhado.
      // `data-nao-plataforma`: esta UI fixa não é "chão" dos bichinhos
      // (eles andam no conteúdo da página, não na nossa moldura).
      ref={nonoRef}
      style={telaCheia ? undefined : estilo}
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-50 flex flex-col items-start"
      data-arrastavel-caixa
      data-nao-plataforma
    >
      {aberto && (
        <div
          ref={painelNonoRef}
          role={telaCheia ? "dialog" : undefined}
          aria-modal={telaCheia ? true : undefined}
          aria-label={telaCheia ? "Seu Nonô — assistente em tela cheia" : undefined}
          // `data-arrastavel-caixa` no painel: aberto, é ELE que se move e
          // encosta nas bordas — o `closest` do arrasto acha este nó antes do
          // conjunto (o conjunto fica do tamanho do painel no modo flutuante).
          data-arrastavel-caixa={telaCheia ? undefined : true}
          className={
            telaCheia
              ? "fixed inset-0 z-[60] flex flex-col bg-surface"
              : "flex w-[min(calc(100vw-2rem),24rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-lg"
          }
          style={
            telaCheia
              ? undefined
              : {
                  // Vira para a esquerda quando falta espaço à direita.
                  marginLeft: posNono
                    ? Math.round(posNono.posicao.x - posNono.ancora.esq)
                    : undefined,
                  // Limita a altura para o topo não passar da borda de cima.
                  maxHeight: posNono
                    ? Math.round(posNono.posicao.altura)
                    : undefined,
                }
          }
        >
          {/* Cabeçalho */}
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-primary/10 px-4 py-3">
            <div
              {...handlers}
              onDoubleClick={resetar}
              className={`flex touch-none items-center gap-2 ${
                arrastando ? "cursor-grabbing" : "cursor-grab"
              }`}
              title="Arraste para mover; clique duplo volta ao canto"
            >
              <GripVertical size={14} className="shrink-0 text-text-soft" aria-hidden="true" />
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
          <div
            // `data-lenis-prevent`: a rolagem suave da página (Lenis) engole a
            // roda do mouse e só devolve o controle a quem se marca com este
            // atributo. Sem ele, a conversa do Seu Nonô NÃO rolava (dono,
            // 06/10/2026) — mesmo caso do índice do rádio e do menu de pets.
            data-lenis-prevent
            className={
              telaCheia
                ? "flex min-h-0 flex-1 flex-col lg:flex-row"
                : // No modo flutuante o painel só tem `max-height` (altura
                  // indefinida). Antes, um wrapper `overflow-hidden` segurava o
                  // miolo com `h-full`: `height: 100%` não resolve contra
                  // altura indefinida, o conteúdo esticava até o `scrollHeight`
                  // e o `overflow` cortava o fim SEM barra de rolagem. Agora a
                  // rolagem vive no próprio filho `flex-1 min-h-0` (padrão que
                  // funciona com teto de `max-height` — medido em 05/10/2026,
                  // mesmo com o player de rádio e o seletor de pet).
                  "min-h-0 flex-1 overflow-y-auto overscroll-contain"
            }
          >
            <div
              // Mesma trava do contêiner acima (modo tela cheia tem o próprio
              // `overflow-y-auto`).
              data-lenis-prevent
              className={
                telaCheia
                  ? "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-8"
                  : "px-4 py-3"
              }
            >
            {/* Nível 1: escolha da frente */}
            {nivel === "frentes" && (
              <div className="space-y-3">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-left">
                  {/* Foto do Seu Nonô ANTES da mensagem (dono, 03/10/2026):
                      o chat abre com a cara do assistente e só depois o
                      recado. A foto é a HD (avatar-hd.webp, 1024×1024, gerada
                      no Gemini a partir da avatar.webp) e ocupa a largura do
                      chat; o avatar pequeno segue no resto do chat. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/seunono/avatar-hd.webp"
                    alt="Seu Nonô, o assistente do portal"
                    width={1024}
                    height={1024}
                    className="mb-2 w-full rounded-xl border border-primary/20 object-cover"
                  />
                  <p className="text-xs font-semibold text-text">
                    Opa! Bão? Sou Seu Nonô, Alceu Dispor. Soy el ajudante aqui do portal, que saiu <em>diretin</em> aqui de Beagá, Minas Gerais, Brasil, LatinoAmérica, Sul Global, Planeta <s>Água</s> Terra. BH é nois, sô! Como posso ajudar ocê?
                  </p>
                  <p className="mt-0.5 text-[0.75rem] leading-relaxed text-text-soft">
                    Ajudo a fiscalizar orçamentos, contratos, acordos e barragens com dados oficiais e sem cadastro. Escolha um tema abaixo ou digite sua pergunta:
                  </p>
                </div>

                {sugestoesContextuais.length > 0 && (
                  <div className="border-t border-border pt-2">
                    <p className="mb-2 text-xs font-medium text-text">
                      Sugestões para {pathname?.split("/").slice(1, 3).join("/") ?? "esta página"}:
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
                  </div>
                )}

                <div className="border-t border-border pt-2">
                  <p className="mb-2 text-xs font-medium text-text">
                    Ou navegue pelos 3 eixos e áreas do portal:
                  </p>
                </div>

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

                <div className="border-t border-border pt-2">
                  <button
                    onClick={abrirPets}
                    className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-left hover:border-primary"
                  >
                    <PawPrint size={14} className="shrink-0 text-primary" />
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-text">Pet do companheiro</span>
                      <span className="block text-xs text-text-soft">Escolha quem anda na tela com você</span>
                    </span>
                  </button>
                </div>

                {/* A entrada do chatbot deixou de ser o botão "Perguntar à IA":
                    agora é a barra fixa do rodapé, que sugere páginas e
                    respostas prontas enquanto se digita. Este aviso só explica
                    o novo caminho (pedido do dono, 03/10/2026). */}
                <div className="border-t border-border pt-3">
                  <p className="rounded-lg border border-dashed border-border bg-surface-2 px-3 py-2 text-xs text-text-soft">
                    Não encontrou? Digite na barra abaixo — ela sugere páginas do
                    portal e, se nada casar, o Enter chama a IA com fonte.
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

            {/* Seletor de pet: checkboxes, um bichinho por linha — os
                marcados andam juntos na tela (pode marcar mais de um). */}
            {nivel === "pets" && (
              <div className="space-y-3">
                <button
                  onClick={voltar}
                  className="flex items-center gap-1 text-xs text-text-soft hover:text-primary"
                >
                  <ChevronLeft size={14} /> Voltar ao início
                </button>
                <fieldset>
                  <legend className="text-sm font-semibold text-text">Pet do companheiro</legend>
                  <p className="mt-1 text-xs leading-relaxed text-text-soft">
                    Escolha quem anda na tela com você — pode marcar mais de um.
                    A escolha fica salva neste navegador.
                  </p>
                  <div className="mt-2 space-y-1">
                    {PETS_COMPANHEIRO.map((p) => {
                      const marcado = escolhidosPet.includes(p.slug);
                      return (
                        <label
                          key={p.slug}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                            marcado
                              ? "border-primary bg-primary/5"
                              : "border-border bg-surface-2 hover:border-primary"
                          }`}
                        >
                          <input
                            type="checkbox"
                            value={p.slug}
                            checked={marcado}
                            onChange={() => alternarPetNoChat(p.slug)}
                            className="shrink-0 accent-primary"
                          />
                          <PetIcone pet={p} altura={22} />
                          <span className="font-medium text-text">{p.nome}</span>
                          <span className="ml-auto text-[0.7rem] text-text-soft">por {p.autor}</span>
                        </label>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={limparPetsNoChat}
                    className="mt-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-soft hover:border-primary hover:text-primary"
                  >
                    Remover todos os bichinhos
                  </button>
                </fieldset>
                <p role="status" aria-live="polite" className="text-xs font-medium text-primary">
                  {confirmaPet}
                </p>
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
                  <p className="rounded-lg border border-dashed border-border bg-surface-2 px-3 py-2 text-xs text-text-soft">
                    Sua pergunta não está na lista? Digite na barra abaixo — o
                    Enter aciona a IA com fonte.
                  </p>
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
                              data-companheiro-alvo="abrir-pagina"
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
                              data-companheiro-alvo="abrir-pagina"
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
                      <p className="text-[11px] font-medium uppercase tracking-wide text-text-soft">
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
                          <p className="text-[11px] text-text-soft">Top 3:</p>
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
                            data-companheiro-alvo="abrir-pagina"
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

                {acoesRapidas.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {acoesRapidas.map((a, i) => (
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

                {/* A entrada de texto agora é a barra FIXA do rodapé
                    (`SeuNonoBusca`): em vez de uma caixa que aparece e some no
                    nível "ia", a barra fica sempre visível e sugere páginas e
                    respostas prontas enquanto se digita. */}

                {/* Indicador de status em fases de busca/geração */}
                <IndicadorStatusChat status={statusChat} />

                {respostaComando && (
                  <div className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
                    <p className="flex items-center gap-1.5">
                      <Accessibility size={14} />
                      {respostaComando}
                    </p>
                  </div>
                )}

                {resultadoEscada && !telaCheia && (
                  <div className="space-y-3">
                    <BlocoRespostaEscadaSeuNono resultado={resultadoEscada} animar={false} />
                    <button
                      onClick={() => {
                        setResultadoEscada(null);
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

                {respostaIa && !telaCheia && (
                  <div className="space-y-3">
                    <BlocoRespostaIaSeuNono
                      resposta={respostaIa}
                      fontes={detalheIa?.fontes ?? []}
                      modelo={detalheIa?.modelo}
                      data={detalheIa?.data}
                      verificacao={detalheIa?.verificacao}
                      copiado={copiado}
                      aoAbrir={abrirFonteEmAbaNova}
                      aoCopiar={copiarLink}
                      animar={true}
                    />
                    <button
                      onClick={() => {
                        setRespostaIa(null);
                        setResultadoEscada(null);
                        setDetalheIa(null);
                        setErro(null);
                      }}
                      className="text-xs text-text-soft hover:text-primary"
                    >
                      ← Fazer outra pergunta
                    </button>
                  </div>
                )}

                {telaCheia && turnosIa.length > 0 && (
                  <ul className="space-y-4">
                    {turnosIa.map((turno, ti) => {
                      const isLatest = ti === turnosIa.length - 1;
                      return (
                        <li key={ti} className="space-y-2">
                          <div className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-text">
                            <strong className="text-primary">Você:</strong> {turno.pergunta}
                          </div>
                          {turno.escada ? (
                            <BlocoRespostaEscadaSeuNono
                              resultado={turno.escada}
                              animar={false}
                            />
                          ) : (
                            <BlocoRespostaIaSeuNono
                              resposta={turno.resposta}
                              fontes={turno.fontes}
                              modelo={turno.modelo}
                              data={turno.data}
                              verificacao={turno.verificacao}
                              copiado={copiado}
                              aoAbrir={abrirFonteEmAbaNova}
                              aoCopiar={copiarLink}
                              animar={isLatest && statusChat === "digitando"}
                            />
                          )}
                        </li>
                      );
                    })}
                  </ul>
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
                {!respostaIa && !resultadoEscada && !respostaComando && !erro && !carregando && (
                  <div className="rounded-lg border border-dashed border-border bg-surface-2 px-3 py-2">
                    <p className="mb-1.5 text-xs font-medium text-text-soft">
                      Comandos de acessibilidade:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {["tema escuro", "tema claro", "aumentar texto", "diminuir texto", "cores daltônicas"].map((cmd) => (
                        <button
                          key={cmd}
                          onClick={() => {
                            // Sem caixa de texto neste nível: o comando roda
                            // direto pelo mesmo caminho de pergunta.
                            void executarPerguntaIa(cmd);
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

          {/* Rodapé: barra de busca FIXA do Seu Nonô (pedido do dono,
              03/10/2026). É o novo degrau de entrada — enquanto a pessoa
              digita, as sugestões sobem acima da barra (páginas do portal e
              respostas pré-curadas); Enter sem correspondência aciona a IA. */}
          <div className="shrink-0 border-t border-border bg-surface-2 px-3 py-2">
            <SeuNonoBusca
              pathname={pathname}
              inputRef={inputIaRef}
              desabilitado={carregando}
              aoEnviarIa={executarPerguntaIa}
              aoEscolherCuradoria={aoEscolherCuradoria}
            />
            <p className="mt-1 text-center text-[.65rem] text-text-soft">
              {nivel === "frentes" && "Digite para navegar no portal ou perguntar à IA"}
              {nivel === "categorias" && "Passo 2: tema"}
              {nivel === "perguntas" && "Passo 3: pergunta"}
              {nivel === "resposta" && "Resposta pré-curada"}
              {nivel === "resposta-contexto" && "Sugestão da página"}
              {nivel === "busca" && "Busca nas respostas do portal"}
              {nivel === "ia" && "Pergunta livre com IA"}
              {nivel === "pets" && "Pet do companheiro"}
            </p>
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

      {/* Três botões redondos sobrepostos na lateral esquerda, de baixo
          para cima: Seu Nonô (FAB), pata do pet e rádio — pedido do dono
          (03/10/2026), que a pata estava TAPANDO o botão da rádio.
          Régua combinada com `PlayerRadio.tsx`: FAB 16..72 px da borda;
          pata h-11 com margem negativa −16 px → 56..100; rádio h-12 em
          `left-5` → 84..132. Sobra 16 px de sobreposição em cada emenda.
          O FAB vem DEPOIS da pata no DOM: pinta por cima (a pata fica com
          a coroa livre, o FAB com a cara inteira). A pata e o FAB somem
          quando o painel abre (só o painel importa então); o rádio fica. */}
      {!aberto && (
        <div className="flex w-14 flex-col items-center">
          {/* A pata do pet morava AQUI e saiu: ganhou caixa arrastável própria
              logo abaixo do invólucro (ver o bloco "PATA DO PET"). */}
          <button
            {...handlers}
            onDoubleClick={resetar}
            onClick={() => {
              if (foiArrasto()) return; // gesto foi mover, não abrir
              setAberto(true);
              if (!mostrouBoasVindas && !dismissBoasVindas) dismissarBoasVindas();
            }}
            title="Arraste para mover; clique duplo volta ao canto"
            className={`flex h-14 w-14 touch-none items-center justify-center overflow-hidden rounded-full border border-amber-500/40 bg-surface p-0.5 shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              arrastando ? "cursor-grabbing" : "cursor-grab"
            }`}
            aria-label="Abrir assistente Seu Nonô"
          >
            <AvatarSeuNono size={56} className="h-full w-full rounded-full" />
          </button>
        </div>
      )}
    </div>

    {/* ═══ PATA DO PET — caixa arrastável PRÓPRIA ═══
        Fica FORA do invólucro do assistente de propósito: dentro dele, o
        `transform` de arrasto do Seu Nonô levava a pata junto (dono,
        06/10/2026: "deixar cada um separado"). A posição reproduz o lugar de
        antes na pilha — FAB em 16..72 px da borda de baixo, pata em 56..100 —
        então o visual não muda; só o arrasto é que é independente.
        O `closest` do `useArrastavel` acha esta caixa pelo próprio evento, não
        por busca global, então as duas convivem sem confusão. */}
    {!aberto && (
      <div
        style={telaCheia ? undefined : estiloPata}
        className="fixed bottom-[calc(max(1rem,env(safe-area-inset-bottom))_+_2.5rem)] left-[1.375rem] z-50"
        data-arrastavel-caixa
        data-nao-plataforma
      >
        <button
          {...handlersPata}
          onDoubleClick={resetarPata}
          type="button"
          onClick={(e) => {
            // Gesto foi arrasto: não abre o menu por acidente.
            if (foiArrastoPata()) return;
            const r = e.currentTarget.getBoundingClientRect();
            window.dispatchEvent(
              new CustomEvent("cp:companheiro-menu-pet", {
                detail: { x: r.left, y: r.bottom + 8 },
              }),
            );
          }}
          title="Trocar o bichinho do companheiro — arraste para mover; clique duplo volta ao canto"
          aria-label="Trocar o bichinho do companheiro"
          className={`flex h-11 w-11 touch-none items-center justify-center rounded-full border border-amber-500/40 bg-surface shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            arrastandoPata ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          <PawPrint size={20} className="text-primary" aria-hidden="true" />
        </button>
      </div>
    )}
    </>
  );
}
