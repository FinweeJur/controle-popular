"use client";

/**
 * @file ArvoreObsidianGrafo.tsx
 * @description Visualizador interativo de grafo estilo Obsidian em formato e cores de árvore cívica.
 * 
 * Papel no portal:
 * Apresenta a rede de páginas, eixos, instituições e territórios do Controle Popular
 * como uma árvore viva de conhecimento cívico com nós interativos e conexões rastreáveis.
 * 
 * Fonte dos dados:
 * Árvore de rotas e nós canônicos de `@/lib/assistente/arvore-galhos`.
 * 
 * Decisões técnicas:
 * - Canvas/SVG interativo puro sem bibliotecas pesadas de grafo (zero dependência externa).
 * - Suporta zoom, pan, arrasto de nós (drag & drop) e realce de nós vizinhos ao passar o cursor.
 * - Cores fiéis aos 4 grandes eixos cívicos do portal em OKLCH/Hex.
 * - Inclui exportação da matriz de relações em CSV com BOM UTF-8 e visão acessível em tabela.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  ExternalLink,
  Download,
  Info,
  Layers,
  Sparkles,
  TreeDeciduous,
  ArrowRight,
} from "lucide-react";
import {
  NOS_ARVORE,
  ARESTAS_ARVORE,
  EIXOS_PORTAL,
  type NoArvore,
  type ArestaArvore,
} from "@/lib/assistente/arvore-galhos";

interface NoPosicionado extends NoArvore {
  x: number;
  y: number;
  vx: number;
  vy: number;
  conectados: string[];
}

export default function ArvoreObsidianGrafo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Estados de navegação do palco (Pan & Zoom)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [arrastandoPalco, setArrastandoPalco] = useState(false);
  const [posicaoInicioArrasto, setPosicaoInicioArrasto] = useState({ x: 0, y: 0 });

  // Estados de interação com nós
  const [noSelecionado, setNoSelecionado] = useState<NoPosicionado | null>(null);
  const [noHover, setNoHover] = useState<NoPosicionado | null>(null);
  const [noArrastado, setNoArrastado] = useState<NoPosicionado | null>(null);

  // Filtros e busca
  const [filtroEixo, setFiltroEixo] = useState<string>("todos");
  const [buscaTexto, setBuscaTexto] = useState("");
  const [mostrarTabelaAcessivel, setMostrarTabelaAcessivel] = useState(false);

  // Inicialização das posições dos nós em formato de árvore orgânica
  const [nos, setNos] = useState<NoPosicionado[]>(() => {
    const mapaConexoes = new Map<string, string[]>();
    for (const a of ARESTAS_ARVORE) {
      if (!mapaConexoes.has(a.fonte)) mapaConexoes.set(a.fonte, []);
      if (!mapaConexoes.has(a.alvo)) mapaConexoes.set(a.alvo, []);
      mapaConexoes.get(a.fonte)!.push(a.alvo);
      mapaConexoes.get(a.alvo)!.push(a.fonte);
    }

    // Raio e ângulos por eixo para layout radial/árvore
    const angulosEixo: Record<string, { centro: number; delta: number }> = {
      direitos: { centro: (5 * Math.PI) / 4, delta: Math.PI / 3 },     // Galho Oeste-Noroeste
      territorios: { centro: (7 * Math.PI) / 4, delta: Math.PI / 3 },   // Galho Leste-Nordeste
      estado: { centro: (3 * Math.PI) / 4, delta: Math.PI / 3 },        // Galho Sul-Sudoeste
      central: { centro: Math.PI / 4, delta: Math.PI / 3 },             // Galho Leste-Sudeste
    };

    const contadoresEixo: Record<string, number> = {
      direitos: 0,
      territorios: 0,
      estado: 0,
      central: 0,
    };

    const totaisPorEixo: Record<string, number> = {};
    for (const n of NOS_ARVORE) {
      if (n.id !== "raiz-portal" && !n.id.startsWith("eixo-")) {
        totaisPorEixo[n.eixoId] = (totaisPorEixo[n.eixoId] || 0) + 1;
      }
    }

    return NOS_ARVORE.map((n) => {
      let x = 0;
      let y = 0;

      if (n.id === "raiz-portal") {
        x = 0;
        y = 30; // Tronco central ligeiramente rebaixado
      } else if (n.id.startsWith("eixo-")) {
        // Os 4 grandes eixos como nós mestres nos 4 cantos
        const ang = angulosEixo[n.eixoId].centro;
        x = Math.cos(ang) * 160;
        y = Math.sin(ang) * 160 + 30;
      } else {
        // Sub-folhas distribuídas ao longo de ramos
        const config = angulosEixo[n.eixoId];
        const idx = contadoresEixo[n.eixoId]++;
        const total = totaisPorEixo[n.eixoId] || 1;
        const fatorAngulo = (idx / (total - 1 || 1) - 0.5) * config.delta;
        const angulo = config.centro + fatorAngulo;
        // Variação de distância para dar efeito orgânico
        const distancia = 260 + (idx % 3) * 60 + Math.random() * 20;

        x = Math.cos(angulo) * distancia;
        y = Math.sin(angulo) * distancia + 30;
      }

      return {
        ...n,
        x,
        y,
        vx: 0,
        vy: 0,
        conectados: mapaConexoes.get(n.id) || [],
      };
    });
  });

  // Nós filtrados por busca e eixo
  const nosVisiveis = useMemo(() => {
    return nos.filter((n) => {
      const passaEixo = filtroEixo === "todos" || n.eixoId === filtroEixo || n.id === "raiz-portal";
      const passaBusca =
        !buscaTexto ||
        n.titulo.toLowerCase().includes(buscaTexto.toLowerCase()) ||
        n.subgalho.toLowerCase().includes(buscaTexto.toLowerCase()) ||
        n.rotuloCurto.toLowerCase().includes(buscaTexto.toLowerCase());
      return passaEixo && passaBusca;
    });
  }, [nos, filtroEixo, buscaTexto]);

  const idsVisiveis = useMemo(() => new Set(nosVisiveis.map((n) => n.id)), [nosVisiveis]);

  // Arestas visíveis com base nos nós visíveis
  const arestasVisiveis = useMemo(() => {
    return ARESTAS_ARVORE.filter(
      (a) => idsVisiveis.has(a.fonte) && idsVisiveis.has(a.alvo)
    );
  }, [idsVisiveis]);

  // Renderização no Canvas (60fps suave e nítido com DPR)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const largura = canvas.clientWidth;
    const altura = canvas.clientHeight;

    if (canvas.width !== largura * dpr || canvas.height !== altura * dpr) {
      canvas.width = largura * dpr;
      canvas.height = altura * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, largura, altura);

    // Aplica Pan e Zoom
    ctx.translate(largura / 2 + pan.x, altura / 2 + pan.y);
    ctx.scale(zoom, zoom);

    const mapaNos = new Map<string, NoPosicionado>();
    for (const n of nos) {
      mapaNos.set(n.id, n);
    }

    const noAtivo = noHover || noSelecionado;
    const vizinhosAtivos = noAtivo ? new Set([noAtivo.id, ...noAtivo.conectados]) : null;

    // 1. Desenha as arestas
    for (const aresta of arestasVisiveis) {
      const fonte = mapaNos.get(aresta.fonte);
      const alvo = mapaNos.get(aresta.alvo);
      if (!fonte || !alvo) continue;

      const estaAtiva =
        !vizinhosAtivos ||
        (vizinhosAtivos.has(fonte.id) && vizinhosAtivos.has(alvo.id));

      ctx.beginPath();
      ctx.moveTo(fonte.x, fonte.y);

      // Curva sutil para simular galhos de árvore orgânicos
      const mx = (fonte.x + alvo.x) / 2 + (alvo.y - fonte.y) * 0.08;
      const my = (fonte.y + alvo.y) / 2 - (alvo.x - fonte.x) * 0.08;
      ctx.quadraticCurveTo(mx, my, alvo.x, alvo.y);

      if (aresta.tipo === "hierarquia") {
        ctx.strokeStyle = estaAtiva
          ? "rgba(180, 180, 190, 0.45)"
          : "rgba(100, 100, 110, 0.1)";
        ctx.lineWidth = estaAtiva ? 1.5 : 0.8;
      } else if (aresta.tipo === "fluxo_dados") {
        ctx.strokeStyle = estaAtiva
          ? "rgba(225, 29, 72, 0.7)"
          : "rgba(225, 29, 72, 0.15)";
        ctx.lineWidth = estaAtiva ? 2 : 1;
        ctx.setLineDash([4, 4]);
      } else {
        // Relacionado
        ctx.strokeStyle = estaAtiva
          ? "rgba(16, 185, 129, 0.6)"
          : "rgba(16, 185, 129, 0.12)";
        ctx.lineWidth = estaAtiva ? 1.8 : 0.8;
      }

      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2. Desenha os nós
    for (const n of nosVisiveis) {
      const estaAtivo = !vizinhosAtivos || vizinhosAtivos.has(n.id);
      const ehONoEmFoco = noAtivo?.id === n.id;

      // Halo pulsante ou realce no foco
      if (ehONoEmFoco) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.tamanho + 8, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.tamanho + 4, 0, Math.PI * 2);
        ctx.strokeStyle = n.cor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Corpo do nó
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.tamanho, 0, Math.PI * 2);
      ctx.fillStyle = estaAtivo ? n.cor : "rgba(120, 120, 130, 0.25)";
      ctx.fill();

      // Borda sutil
      ctx.strokeStyle = estaAtivo ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Rótulo de texto abaixo ou ao lado
      const deveMostrarTexto =
        ehONoEmFoco ||
        n.destaque ||
        zoom > 1.2 ||
        (vizinhosAtivos && vizinhosAtivos.has(n.id));

      if (deveMostrarTexto) {
        ctx.font = `${ehONoEmFoco ? "bold 11px" : "10px"} sans-serif`;
        ctx.fillStyle = estaAtivo ? "var(--foreground, #e2e8f0)" : "rgba(150, 150, 160, 0.4)";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(n.rotuloCurto, n.x, n.y + n.tamanho + 4);
      }
    }

    ctx.restore();
  }, [nos, nosVisiveis, arestasVisiveis, zoom, pan, noHover, noSelecionado]);

  // Transforma coordenadas da tela para o espaço do grafo
  const converterCoordenadasTelaParaGrafo = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const cx = rect.width / 2 + pan.x;
      const cy = rect.height / 2 + pan.y;
      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;
      return {
        x: (mouseX - cx) / zoom,
        y: (mouseY - cy) / zoom,
      };
    },
    [pan, zoom]
  );

  // Localiza nó sob o cursor
  const encontrarNoPorPosicao = useCallback(
    (gx: number, gy: number) => {
      for (let i = nosVisiveis.length - 1; i >= 0; i--) {
        const n = nosVisiveis[i];
        const dx = n.x - gx;
        const dy = n.y - gy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= n.tamanho + 4) {
          return n;
        }
      }
      return null;
    },
    [nosVisiveis]
  );

  // Handlers do mouse para Pan, Zoom e Drag
  const lidarComMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x: gx, y: gy } = converterCoordenadasTelaParaGrafo(e.clientX, e.clientY);
    const noClicado = encontrarNoPorPosicao(gx, gy);

    if (noClicado) {
      setNoArrastado(noClicado);
      setNoSelecionado(noClicado);
    } else {
      setArrastandoPalco(true);
      setPosicaoInicioArrasto({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const lidarComMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x: gx, y: gy } = converterCoordenadasTelaParaGrafo(e.clientX, e.clientY);

    if (noArrastado) {
      setNos((anteriores) =>
        anteriores.map((n) =>
          n.id === noArrastado.id ? { ...n, x: gx, y: gy } : n
        )
      );
      return;
    }

    if (arrastandoPalco) {
      setPan({
        x: e.clientX - posicaoInicioArrasto.x,
        y: e.clientY - posicaoInicioArrasto.y,
      });
      return;
    }

    const noSob = encontrarNoPorPosicao(gx, gy);
    setNoHover(noSob);
  };

  const lidarComMouseUp = () => {
    setArrastandoPalco(false);
    setNoArrastado(null);
  };

  const lidarComWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const fator = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((z) => Math.min(Math.max(z * fator, 0.4), 3.0));
  };

  // Exportação CSV das relações para auditoria cívica (Regra das 6 qualidades)
  const baixarRelacoesCsv = () => {
    const cabecalho = "Origem;Destino;Tipo_Relacao;Eixo_Origem;Eixo_Destino\n";
    const linhas = ARESTAS_ARVORE.map((a) => {
      const f = NOS_ARVORE.find((n) => n.id === a.fonte);
      const dest = NOS_ARVORE.find((n) => n.id === a.alvo);
      return `"${f?.titulo || a.fonte}";"${dest?.titulo || a.alvo}";"${a.tipo}";"${f?.eixoId || ""}";"${dest?.eixoId || ""}"`;
    }).join("\n");

    const blob = new Blob(["\uFEFF" + cabecalho + linhas], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `grafo-arvore-controle-popular-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ── Cartões de topo (Regra das 6 qualidades) ────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-3.5">
          <div className="flex items-center justify-between text-xs text-text-soft">
            <span>Páginas Catalogadas</span>
            <TreeDeciduous size={15} className="text-primary" />
          </div>
          <p className="mt-1 text-2xl font-bold text-foreground">{NOS_ARVORE.length}</p>
          <span className="text-[0.68rem] text-text-soft">Nós temáticos auditáveis</span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-3.5">
          <div className="flex items-center justify-between text-xs text-text-soft">
            <span>Conexões Cívicas</span>
            <Layers size={15} className="text-emerald-500" />
          </div>
          <p className="mt-1 text-2xl font-bold text-foreground">{ARESTAS_ARVORE.length}</p>
          <span className="text-[0.68rem] text-text-soft">Relações de fluxo e dados</span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-3.5">
          <div className="flex items-center justify-between text-xs text-text-soft">
            <span>Grandes Eixos</span>
            <Sparkles size={15} className="text-amber-500" />
          </div>
          <p className="mt-1 text-2xl font-bold text-foreground">4 Eixos</p>
          <span className="text-[0.68rem] text-text-soft">Arquitetura de fiscalização</span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-3.5">
          <div className="flex items-center justify-between text-xs text-text-soft">
            <span>Estilo Visual</span>
            <Info size={15} className="text-sky-500" />
          </div>
          <p className="mt-1 text-base font-bold text-foreground">Obsidian Tree</p>
          <span className="text-[0.68rem] text-text-soft">Zoom, arrasto e inspeção</span>
        </div>
      </div>

      {/* ── Barra de Ferramentas & Filtros ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3 text-xs">
        {/* Filtro por Eixos */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-text-soft mr-1">Eixo:</span>
          <button
            onClick={() => setFiltroEixo("todos")}
            className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
              filtroEixo === "todos"
                ? "bg-primary text-white"
                : "border border-border bg-surface-2 text-text-soft hover:text-foreground"
            }`}
          >
            Todos ({NOS_ARVORE.length})
          </button>
          {Object.values(EIXOS_PORTAL).map((eixo) => (
            <button
              key={eixo.id}
              onClick={() => setFiltroEixo(eixo.id)}
              className={`rounded-lg px-2.5 py-1 font-medium transition-colors ${
                filtroEixo === eixo.id
                  ? "bg-primary text-white"
                  : "border border-border bg-surface-2 text-text-soft hover:text-foreground"
              }`}
            >
              {eixo.numero}
            </button>
          ))}
        </div>

        {/* Busca e Controles do Grafo */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2 text-text-soft" />
            <input
              type="text"
              placeholder="Buscar nó ou termo..."
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
              className="w-40 sm:w-52 rounded-lg border border-border bg-surface-2 pl-7 pr-2.5 py-1 text-xs text-foreground placeholder:text-text-soft focus:border-primary focus:outline-hidden"
            />
          </div>

          <div className="flex items-center border border-border rounded-lg bg-surface-2 overflow-hidden">
            <button
              onClick={() => setZoom((z) => Math.min(z * 1.2, 3.0))}
              title="Aumentar Zoom"
              className="p-1.5 hover:bg-surface text-text-soft hover:text-foreground"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z * 0.8, 0.4))}
              title="Diminuir Zoom"
              className="p-1.5 hover:bg-surface text-text-soft hover:text-foreground border-l border-border"
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              title="Centralizar Árvore"
              className="p-1.5 hover:bg-surface text-text-soft hover:text-foreground border-l border-border"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          <button
            onClick={baixarRelacoesCsv}
            title="Baixar Relações em CSV"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-text-soft hover:text-foreground hover:border-primary transition-colors"
          >
            <Download size={13} />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* ── Palco Canvas Obsidian Graph View ─────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative h-[600px] w-full rounded-2xl border border-border bg-slate-950 overflow-hidden shadow-inner select-none cursor-grab active:cursor-grabbing"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={lidarComMouseDown}
          onMouseMove={lidarComMouseMove}
          onMouseUp={lidarComMouseUp}
          onMouseLeave={lidarComMouseUp}
          onWheel={lidarComWheel}
          className="h-full w-full block"
        />

        {/* Legenda de cores dos eixos da árvore */}
        <div className="absolute bottom-3 left-3 rounded-xl border border-white/10 bg-slate-900/90 p-2.5 backdrop-blur-md text-[0.7rem] text-slate-300 space-y-1 shadow-lg">
          <p className="font-semibold text-slate-100 mb-1 flex items-center gap-1">
            <span>🌳</span> Cores dos Ramos:
          </p>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ea580c]" />
            <span>Eixo 1 · Direitos em Movimento</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
            <span>Eixo 2 · Terra e Territórios</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0284c7]" />
            <span>Eixo 3 · Estado e Economia</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#c2410c]" />
            <span>Eixo Central · ONSA & Ferramentas</span>
          </div>
        </div>

        {/* Cartão de Inspeção do Nó Selecionado */}
        {noSelecionado && (
          <div className="absolute top-3 right-3 max-w-xs rounded-xl border border-white/15 bg-slate-900/95 p-4 text-xs text-slate-200 backdrop-blur-md shadow-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span
                className="rounded-full px-2 py-0.5 text-[0.65rem] font-bold text-white uppercase tracking-wider"
                style={{ backgroundColor: noSelecionado.cor }}
              >
                {EIXOS_PORTAL[noSelecionado.eixoId]?.nome || noSelecionado.subgalho}
              </span>
              <button
                onClick={() => setNoSelecionado(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <h4 className="font-bold text-white text-sm">{noSelecionado.titulo}</h4>
            <p className="text-[0.72rem] text-slate-400">
              Subgalho: <strong className="text-slate-200">{noSelecionado.subgalho}</strong>
            </p>
            <p className="text-[0.72rem] text-slate-400">
              Conexões diretas: <strong className="text-slate-200">{noSelecionado.conectados.length}</strong>
            </p>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <Link
                href={noSelecionado.href}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 font-bold text-white text-xs hover:opacity-90 transition-opacity"
              >
                <span>Acessar Página</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── Visão Alternativa Acessível em Tabela (Regra das 6 qualidades) ──── */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Catálogo Tabular da Árvore Cívica
            </h3>
            <p className="text-xs text-text-soft">
              Formato acessível para leitores de tela e auditoria de conexões.
            </p>
          </div>
          <button
            onClick={() => setMostrarTabelaAcessivel((m) => !m)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {mostrarTabelaAcessivel ? "Ocultar Tabela" : "Expandir Tabela"}
          </button>
        </div>

        {mostrarTabelaAcessivel && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-text-soft font-semibold">
                  <th className="py-2 px-2.5">Nó / Página</th>
                  <th className="py-2 px-2.5">Eixo Temático</th>
                  <th className="py-2 px-2.5">Subgalho</th>
                  <th className="py-2 px-2.5">Conexões</th>
                  <th className="py-2 px-2.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {nosVisiveis.map((n) => (
                  <tr key={n.id} className="hover:bg-surface-2 transition-colors">
                    <td className="py-2 px-2.5 font-medium text-foreground">
                      {n.titulo}
                    </td>
                    <td className="py-2 px-2.5">
                      <span
                        className="inline-block h-2 w-2 rounded-full mr-1.5"
                        style={{ backgroundColor: n.cor }}
                      />
                      {EIXOS_PORTAL[n.eixoId]?.nome}
                    </td>
                    <td className="py-2 px-2.5 text-text-soft">{n.subgalho}</td>
                    <td className="py-2 px-2.5 text-text-soft">{n.conectados.length} arestas</td>
                    <td className="py-2 px-2.5 text-right">
                      <Link
                        href={n.href}
                        className="text-primary hover:underline inline-flex items-center gap-1 font-semibold"
                      >
                        <span>Visitar</span>
                        <ArrowRight size={11} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
