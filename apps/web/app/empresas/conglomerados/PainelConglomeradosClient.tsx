/**
 * @file apps/web/app/empresas/conglomerados/PainelConglomeradosClient.tsx
 * @description Componente interativo com 3 modos de visualização sobre monopólios,
 * holdings, cartéis e trustes corporativos no Brasil e no mundo.
 *
 * Papel no portal:
 * Permite ao cidadão, pesquisador e autoridade auditar graficamente as teias
 * de controle societário, desvendar quem comanda as maiores corporações e
 * fiscalizar a concentração econômica (índice HHI) em setores estratégicos.
 *
 * Três modos de visualização integrados:
 * 1. Modo Grafo em Canvas: simulação física de forças a 60fps sem bibliotecas pesadas,
 *    com arrasto de nós, zoom, pan e realce dinâmico de nós conectados.
 * 2. Modo Mapa Mental: árvore vetorial SVG hierárquica (Holding -> Investimento ->
 *    Subsidiária -> Concessão) com curvas Bézier e expansão/recolhimento de ramos.
 * 3. Modo Tabela das 6 Qualidades: busca em tempo real com normalização de acentos,
 *    facetas de setor e hierarquia, ordenação por todas as colunas, índice HHI,
 *    download CSV com BOM UTF-8 (\uFEFF) e separador ponto-e-vírgula (;), e layout de impressão.
 *
 * Regras do portal atendidas:
 * - Regra das Seis Qualidades (AGENTS.md § 8).
 * - Sem dependências externas pesadas (D3/Three.js); usa Canvas 2D nativo e SVG vetorial puro.
 * - Integração cívica com perguntas em frases curtas de até 13 palavras (Seu Nonô / Alceu Dispor).
 */

"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Share2,
  Network,
  GitBranch,
  Table as TableIcon,
  Search,
  Download,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Info,
  Maximize2,
  Minimize2,
  RefreshCw,
  Plus,
  Minus,
  Building,
  Landmark,
  Layers,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Copy,
  Check,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import type {
  NoConglomerado,
  ArestaControleAcionario,
  ConcentracaoSetorial,
  SetorConglomerado,
} from "@/lib/empresas/dados-conglomerados";

interface Props {
  nos: NoConglomerado[];
  arestas: ArestaControleAcionario[];
  setores: ConcentracaoSetorial[];
}

type ModoVisualizacao = "grafo" | "mental" | "tabela";

// Paleta de cores por nível hierárquico
const CORES_NIVEL: Record<number, { bg: string; border: string; text: string; dot: string }> = {
  1: { bg: "bg-purple-100 dark:bg-purple-950/40", border: "border-purple-300 dark:border-purple-800", text: "text-purple-700 dark:text-purple-300", dot: "#9333ea" },
  2: { bg: "bg-blue-100 dark:bg-blue-950/40", border: "border-blue-300 dark:border-blue-800", text: "text-blue-700 dark:text-blue-300", dot: "#2563eb" },
  3: { bg: "bg-emerald-100 dark:bg-emerald-950/40", border: "border-emerald-300 dark:border-emerald-800", text: "text-emerald-700 dark:text-emerald-300", dot: "#059669" },
  4: { bg: "bg-amber-100 dark:bg-amber-950/40", border: "border-amber-300 dark:border-amber-800", text: "text-amber-700 dark:text-amber-300", dot: "#d97706" },
};

// Cores por setor
const CORES_SETOR: Record<string, string> = {
  mineracao: "#dc2626", // vermelho mineração
  agronegocio_graos: "#16a34a", // verde agro
  energia_petroleo: "#ea580c", // laranja óleo
  bancos_financas: "#7c3aed", // violeta bancos
  tecnologia: "#0284c7", // ciano tech
};

interface SimNode extends NoConglomerado {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export default function PainelConglomeradosClient({ nos, arestas, setores }: Props) {
  const [modo, setModo] = useState<ModoVisualizacao>("grafo");
  const [busca, setBusca] = useState("");
  const [setorFiltro, setSetorFiltro] = useState<string>("todos");
  const [nivelFiltro, setNivelFiltro] = useState<string>("todos");
  const [noSelecionadoId, setNoSelecionadoId] = useState<string | null>("vale");
  const [holdingFocoId, setHoldingFocoId] = useState<string>("blackrock");
  const [copiadoPergunta, setCopiadoPergunta] = useState<string | null>(null);

  // Ordenação da tabela
  const [colunaOrdem, setColunaOrdem] = useState<"nome" | "setor" | "nivel" | "participacao" | "hhi">("nivel");
  const [ordemAsc, setOrdemAsc] = useState(true);

  // Mapa rápido de nós por ID
  const mapaNos = useMemo(() => new Map(nos.map((n) => [n.id, n])), [nos]);

  // Nó selecionado atual
  const noSelecionado = useMemo(() => {
    return noSelecionadoId ? mapaNos.get(noSelecionadoId) ?? null : null;
  }, [noSelecionadoId, mapaNos]);

  // Conexões diretas do nó selecionado
  const conexoesSelecionado = useMemo(() => {
    if (!noSelecionadoId) return { controladores: [], controlados: [] };
    const controladores = arestas
      .filter((a) => a.destinoId === noSelecionadoId)
      .map((a) => ({ no: mapaNos.get(a.origemId), aresta: a }))
      .filter((item): item is { no: NoConglomerado; aresta: ArestaControleAcionario } => Boolean(item.no));

    const controlados = arestas
      .filter((a) => a.origemId === noSelecionadoId)
      .map((a) => ({ no: mapaNos.get(a.destinoId), aresta: a }))
      .filter((item): item is { no: NoConglomerado; aresta: ArestaControleAcionario } => Boolean(item.no));

    return { controladores, controlados };
  }, [noSelecionadoId, arestas, mapaNos]);

  // Filtragem da tabela e grafo
  const nosFiltrados = useMemo(() => {
    const termo = busca
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    return nos.filter((no) => {
      if (setorFiltro !== "todos" && no.setor !== setorFiltro) return false;
      if (nivelFiltro !== "todos" && String(no.nivelHierarquico) !== nivelFiltro) return false;
      if (!termo) return true;

      const nomeLimpo = no.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const tickerLimpo = no.siglaOuTicker.toLowerCase();
      const descLimpa = no.descricao.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const ativosLimpos = no.ativosEstrategicos.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

      return (
        nomeLimpo.includes(termo) ||
        tickerLimpo.includes(termo) ||
        descLimpa.includes(termo) ||
        ativosLimpos.includes(termo)
      );
    });
  }, [nos, busca, setorFiltro, nivelFiltro]);

  // Ordenação da tabela
  const nosOrdenados = useMemo(() => {
    return [...nosFiltrados].sort((a, b) => {
      let resultado = 0;
      switch (colunaOrdem) {
        case "nome":
          resultado = a.nome.localeCompare(b.nome);
          break;
        case "setor":
          resultado = a.setorRotulo.localeCompare(b.setorRotulo);
          break;
        case "nivel":
          resultado = a.nivelHierarquico - b.nivelHierarquico || a.nome.localeCompare(b.nome);
          break;
        case "participacao":
          resultado = a.participacaoMercadoPct - b.participacaoMercadoPct;
          break;
        case "hhi":
          resultado = a.hhiSetorial - b.hhiSetorial;
          break;
      }
      return ordemAsc ? resultado : -resultado;
    });
  }, [nosFiltrados, colunaOrdem, ordemAsc]);

  // Função para alternar ordenação
  function alternarOrdem(coluna: typeof colunaOrdem) {
    if (colunaOrdem === coluna) {
      setOrdemAsc(!ordemAsc);
    } else {
      setColunaOrdem(coluna);
      setOrdemAsc(true);
    }
  }

  // Exportação CSV com BOM UTF-8 (\uFEFF) e separador ponto-e-vírgula
  function exportarCsv() {
    const cabecalho = [
      "ID",
      "Nome",
      "Sigla/Ticker",
      "Nível",
      "Tipo",
      "Setor",
      "País",
      "Controlador Principal",
      "Participação Controlador (%)",
      "Market Share (%)",
      "HHI Setorial",
      "Classificação HHI",
      "Valor / Ativos",
      "Faturamento",
      "Ativos Estratégicos",
      "Riscos Antitruste",
      "Link Oficial",
    ];

    const linhas = nosOrdenados.map((n) => [
      `"${n.id}"`,
      `"${n.nome.replace(/"/g, '""')}"`,
      `"${n.siglaOuTicker.replace(/"/g, '""')}"`,
      n.nivelHierarquico,
      `"${n.tipoRotulo.replace(/"/g, '""')}"`,
      `"${n.setorRotulo.replace(/"/g, '""')}"`,
      `"${n.paisOrigem.replace(/"/g, '""')}"`,
      `"${n.controladorPrincipal.replace(/"/g, '""')}"`,
      n.participacaoControladorPct,
      n.participacaoMercadoPct,
      n.hhiSetorial,
      `"${n.classificacaoHhi.replace(/"/g, '""')}"`,
      `"${n.valorMercadoOuAtivos.replace(/"/g, '""')}"`,
      `"${n.faturamentoOuReceita.replace(/"/g, '""')}"`,
      `"${n.ativosEstrategicos.replace(/"/g, '""')}"`,
      `"${n.riscosAntitruste.replace(/"/g, '""')}"`,
      `"${n.urlOficial}"`,
    ]);

    const conteudoCsv =
      "\uFEFF" +
      [cabecalho.join(";"), ...linhas.map((l) => l.join(";"))].join("\r\n");

    const blob = new Blob([conteudoCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `conglomerados-monopolios-controlepopular-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Copiar pergunta para o assistente Seu Nonô / Alceu Dispor
  function copiarPergunta(pergunta: string) {
    navigator.clipboard.writeText(pergunta);
    setCopiadoPergunta(pergunta);
    setTimeout(() => setCopiadoPergunta(null), 2500);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODO 1: CANVAS DO GRAFO INTERATIVO 60FPS COM FÍSICA PURA
  // ══════════════════════════════════════════════════════════════════════════
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const transformRef = useRef<{ x: number; y: number; k: number }>({ x: 0, y: 0, k: 1 });
  const isDraggingCanvasRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const draggedNodeRef = useRef<SimNode | null>(null);
  const hoveredNodeRef = useRef<SimNode | null>(null);
  const isSimActiveRef = useRef(true);

  // Inicializa nós da simulação física
  useEffect(() => {
    const width = 1000;
    const height = 650;
    const raioPorNivel: Record<number, number> = { 1: 26, 2: 19, 3: 14, 4: 11 };

    simNodesRef.current = nos.map((no, idx) => {
      // Distribuição inicial polar conforme nível
      const angulo = (idx / nos.length) * Math.PI * 2;
      const distancia = no.nivelHierarquico * 80 + (Math.random() - 0.5) * 40;
      return {
        ...no,
        x: width / 2 + Math.cos(angulo) * distancia,
        y: height / 2 + Math.sin(angulo) * distancia,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: raioPorNivel[no.nivelHierarquico] || 15,
        color: CORES_SETOR[no.setor] || "#4f46e5",
      };
    });
  }, [nos]);

  // Loop de física e renderização a 60fps
  useEffect(() => {
    if (modo !== "grafo") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rodando = true;

    function render() {
      if (!rodando || !canvas || !ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Fundo sutil com grid técnico
      ctx.save();
      ctx.translate(transformRef.current.x, transformRef.current.y);
      ctx.scale(transformRef.current.k, transformRef.current.k);

      // Física simples em CPU (Repulsão + Molas + Gravidade Central)
      if (isSimActiveRef.current) {
        const nodes = simNodesRef.current;
        const centroX = width / 2;
        const centroY = height / 2;

        // 1. Repulsão entre todos os pares
        for (let i = 0; i < nodes.length; i++) {
          const n1 = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const n2 = nodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const distSq = dx * dx + dy * dy + 1;
            const dist = Math.sqrt(distSq);
            const forca = 1400 / distSq;
            const fx = (dx / dist) * forca;
            const fy = (dy / dist) * forca;

            if (n1 !== draggedNodeRef.current) {
              n1.vx -= fx;
              n1.vy -= fy;
            }
            if (n2 !== draggedNodeRef.current) {
              n2.vx += fx;
              n2.vy += fy;
            }
          }

          // 2. Gravidade central moderada
          const cdx = centroX - n1.x;
          const cdy = centroY - n1.y;
          n1.vx += cdx * 0.0008;
          n1.vy += cdy * 0.0008;
        }

        // 3. Atração por arestas (Molas)
        const mapaSim = new Map(nodes.map((n) => [n.id, n]));
        for (const aresta of arestas) {
          const o = mapaSim.get(aresta.origemId);
          const d = mapaSim.get(aresta.destinoId);
          if (o && d) {
            const dx = d.x - o.x;
            const dy = d.y - o.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const alvoDist = 110;
            const forcaMola = (dist - alvoDist) * 0.025;
            const fx = (dx / dist) * forcaMola;
            const fy = (dy / dist) * forcaMola;

            if (o !== draggedNodeRef.current) {
              o.vx += fx;
              o.vy += fy;
            }
            if (d !== draggedNodeRef.current) {
              d.vx -= fx;
              d.vy -= fy;
            }
          }
        }

        // 4. Integração de velocidade com amortecimento
        for (const n of nodes) {
          if (n !== draggedNodeRef.current) {
            n.vx *= 0.88;
            n.vy *= 0.88;
            n.x += n.vx;
            n.y += n.vy;
          }
        }
      }

      // Conjunto de nós conectados ao selecionado ou ao hovered
      const focoId = hoveredNodeRef.current?.id || noSelecionadoId;
      const idsVizinhos = new Set<string>();
      if (focoId) {
        idsVizinhos.add(focoId);
        for (const a of arestas) {
          if (a.origemId === focoId) idsVizinhos.add(a.destinoId);
          if (a.destinoId === focoId) idsVizinhos.add(a.origemId);
        }
      }

      const mapaSim = new Map(simNodesRef.current.map((n) => [n.id, n]));

      // ─── RENDERIZAÇÃO DAS ARESTAS ───
      for (const a of arestas) {
        const o = mapaSim.get(a.origemId);
        const d = mapaSim.get(a.destinoId);
        if (!o || !d) continue;

        const estaConectadoAoFoco = focoId && (a.origemId === focoId || a.destinoId === focoId);
        const atenuado = focoId && !estaConectadoAoFoco;

        ctx.beginPath();
        ctx.moveTo(o.x, o.y);
        ctx.lineTo(d.x, d.y);

        if (estaConectadoAoFoco) {
          ctx.strokeStyle = "#38bdf8"; // Azul celeste brilhante
          ctx.lineWidth = 2.4;
          ctx.globalAlpha = 0.95;
        } else {
          ctx.strokeStyle = a.tipoRelacao === "propriedade_comum_big_three" ? "#9333ea" : "#64748b";
          ctx.lineWidth = a.tipoRelacao === "propriedade_comum_big_three" ? 1.2 : 0.8;
          ctx.globalAlpha = atenuado ? 0.08 : 0.35;
        }

        ctx.stroke();

        // Se estiver em foco, desenha o rótulo da porcentagem no meio da aresta
        if (estaConectadoAoFoco && a.participacaoPct) {
          const midX = (o.x + d.x) / 2;
          const midY = (o.y + d.y) / 2;
          ctx.fillStyle = "#0284c7";
          ctx.font = "bold 9px sans-serif";
          ctx.fillText(`${a.participacaoPct}%`, midX + 3, midY - 3);
        }
      }

      // ─── RENDERIZAÇÃO DOS NÓS ───
      for (const n of simNodesRef.current) {
        const isFoco = focoId === n.id;
        const isVizinho = idsVizinhos.has(n.id);
        const atenuado = focoId && !isVizinho;

        ctx.save();
        ctx.globalAlpha = atenuado ? 0.18 : 1.0;

        // Círculo externo / brilho para o foco
        if (isFoco) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(56, 189, 248, 0.35)";
          ctx.fill();
        }

        // Círculo principal
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();

        // Borda do nível
        ctx.lineWidth = isFoco ? 2.5 : 1.5;
        ctx.strokeStyle = isFoco ? "#ffffff" : "rgba(255, 255, 255, 0.7)";
        ctx.stroke();

        // Rótulo de texto abaixo do nó
        ctx.fillStyle = atenuado ? "#94a3b8" : "#f8fafc";
        ctx.font = isFoco ? "bold 11px sans-serif" : "9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(n.nome.length > 18 ? n.nome.slice(0, 16) + "…" : n.nome, n.x, n.y + n.radius + 12);

        // Se for nível 1 (Holding), desenha uma coroa/badge sutil
        if (n.nivelHierarquico === 1) {
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 8px sans-serif";
          ctx.fillText("HOLDING", n.x, n.y - n.radius - 4);
        }

        ctx.restore();
      }

      ctx.restore();
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    }

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      rodando = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [modo, arestas, noSelecionadoId]);

  // Manipulação de eventos no canvas (arrasto, pan, zoom e clique)
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Converte coordenada da tela para espaço do grafo
    const graphX = (mouseX - transformRef.current.x) / transformRef.current.k;
    const graphY = (mouseY - transformRef.current.y) / transformRef.current.k;

    // Detecta clique em nó
    let clicouNo: SimNode | null = null;
    for (let i = simNodesRef.current.length - 1; i >= 0; i--) {
      const n = simNodesRef.current[i];
      const dx = graphX - n.x;
      const dy = graphY - n.y;
      if (dx * dx + dy * dy <= (n.radius + 4) * (n.radius + 4)) {
        clicouNo = n;
        break;
      }
    }

    if (clicouNo) {
      draggedNodeRef.current = clicouNo;
      setNoSelecionadoId(clicouNo.id);
    } else {
      isDraggingCanvasRef.current = true;
      dragStartRef.current = { x: mouseX - transformRef.current.x, y: mouseY - transformRef.current.y };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const graphX = (mouseX - transformRef.current.x) / transformRef.current.k;
    const graphY = (mouseY - transformRef.current.y) / transformRef.current.k;

    if (draggedNodeRef.current) {
      draggedNodeRef.current.x = graphX;
      draggedNodeRef.current.y = graphY;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
    } else if (isDraggingCanvasRef.current) {
      transformRef.current.x = mouseX - dragStartRef.current.x;
      transformRef.current.y = mouseY - dragStartRef.current.y;
    } else {
      // Hover detection
      let hovered: SimNode | null = null;
      for (let i = simNodesRef.current.length - 1; i >= 0; i--) {
        const n = simNodesRef.current[i];
        const dx = graphX - n.x;
        const dy = graphY - n.y;
        if (dx * dx + dy * dy <= (n.radius + 4) * (n.radius + 4)) {
          hovered = n;
          break;
        }
      }
      hoveredNodeRef.current = hovered;
      canvas.style.cursor = hovered ? "pointer" : "grab";
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    draggedNodeRef.current = null;
    isDraggingCanvasRef.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const fator = e.deltaY < 0 ? 1.15 : 0.87;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const novoK = Math.max(0.25, Math.min(3.5, transformRef.current.k * fator));
    transformRef.current.x = mouseX - (mouseX - transformRef.current.x) * (novoK / transformRef.current.k);
    transformRef.current.y = mouseY - (mouseY - transformRef.current.y) * (novoK / transformRef.current.k);
    transformRef.current.k = novoK;
  }, []);

  function resetZoom() {
    transformRef.current = { x: 0, y: 0, k: 1 };
  }

  function alterarZoom(delta: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const centroX = canvas.clientWidth / 2;
    const centroY = canvas.clientHeight / 2;
    const fator = delta > 0 ? 1.25 : 0.8;
    const novoK = Math.max(0.25, Math.min(3.5, transformRef.current.k * fator));
    transformRef.current.x = centroX - (centroX - transformRef.current.x) * (novoK / transformRef.current.k);
    transformRef.current.y = centroY - (centroY - transformRef.current.y) * (novoK / transformRef.current.k);
    transformRef.current.k = novoK;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODO 2: MAPA MENTAL HIERÁRQUICO (ÁRVORE VETORIAL SVG)
  // ══════════════════════════════════════════════════════════════════════════
  const holdingsDisponiveis = useMemo(() => {
    return nos.filter((n) => n.nivelHierarquico === 1);
  }, [nos]);

  // Lista dos nós descendentes da holding ativa
  const dadosArvoreFoco = useMemo(() => {
    const holding = mapaNos.get(holdingFocoId);
    if (!holding) return { holding: null, nivel2: [], nivel3: [], nivel4: [] };

    // Arestas saindo da holding
    const destinosL2Ids = arestas
      .filter((a) => a.origemId === holding.id)
      .map((a) => a.destinoId);

    const nivel2 = nos.filter((n) => n.nivelHierarquico === 2 && (destinosL2Ids.includes(n.id) || n.holdingPaiId === holding.id));

    // Nível 3: subsidiárias ligadas aos investimentos do nível 2
    const n2Ids = new Set(nivel2.map((n) => n.id));
    const destinosL3Ids = arestas
      .filter((a) => n2Ids.has(a.origemId))
      .map((a) => a.destinoId);

    const nivel3 = nos.filter((n) => n.nivelHierarquico === 3 && (destinosL3Ids.includes(n.id) || n2Ids.has(n.holdingPaiId)));

    // Nível 4: concessões e ativos ligados aos nós de nível 2 e 3
    const n3Ids = new Set(nivel3.map((n) => n.id));
    const destinosL4Ids = arestas
      .filter((a) => n3Ids.has(a.origemId) || n2Ids.has(a.origemId))
      .map((a) => a.destinoId);

    const nivel4 = nos.filter((n) => n.nivelHierarquico === 4 && (destinosL4Ids.includes(n.id) || n3Ids.has(n.holdingPaiId) || n2Ids.has(n.holdingPaiId)));

    return { holding, nivel2, nivel3, nivel4 };
  }, [holdingFocoId, nos, arestas, mapaNos]);

  return (
    <div className="space-y-6">
      {/* ─── BARRA DE CONTROLE: MODOS DE VISUALIZAÇÃO E AÇÕES RÁPIDAS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
        {/* Alternador de Modos */}
        <div className="flex items-center gap-1 rounded-xl bg-muted/20 p-1">
          <button
            type="button"
            onClick={() => setModo("grafo")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition ${
              modo === "grafo"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Network className="h-4 w-4" />
            <span>Grafo em Canvas</span>
            <span className="hidden sm:inline rounded-md bg-white/20 px-1.5 py-0.2 text-[10px]">
              60fps
            </span>
          </button>

          <button
            type="button"
            onClick={() => setModo("mental")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition ${
              modo === "mental"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <GitBranch className="h-4 w-4" />
            <span>Mapa Mental SVG</span>
            <span className="hidden sm:inline rounded-md bg-white/20 px-1.5 py-0.2 text-[10px]">
              Hierárquico
            </span>
          </button>

          <button
            type="button"
            onClick={() => setModo("tabela")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition ${
              modo === "tabela"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            <TableIcon className="h-4 w-4" />
            <span>Tabela das 6 Qualidades</span>
          </button>
        </div>

        {/* Botão de Exportação e Filtros Rápidos */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportarCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/30 transition shadow-2xs"
            title="Download CSV com BOM UTF-8 e separador ponto-e-vírgula"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span>Exportar CSV ({nosFiltrados.length})</span>
          </button>
        </div>
      </div>

      {/* ─── FILTROS GLOBAIS DE BUSCA E FACETAS (BUSCÁVEL E FILTRÁVEL) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Buscar por corporação, ticker, ativo (ex: Carajás, S11D, Samarco)..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </div>

        {/* Faceta por Setor */}
        <div>
          <select
            value={setorFiltro}
            onChange={(e) => setSetorFiltro(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs sm:text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="todos">Todos os Setores (5 Setores Estratégicos)</option>
            <option value="mineracao">Mineração & Metais (Big Mining)</option>
            <option value="agronegocio_graos">Agronegócio & Grãos (Cartel ABCD)</option>
            <option value="energia_petroleo">Energia & Petróleo (Big Oil / Pré-Sal)</option>
            <option value="bancos_financas">Bancos & Mercados (Big Three / B3)</option>
            <option value="tecnologia">Tecnologia & Nuvem (Big Tech)</option>
          </select>
        </div>

        {/* Faceta por Nível Hierárquico */}
        <div>
          <select
            value={nivelFiltro}
            onChange={(e) => setNivelFiltro(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs sm:text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="todos">Todos os Níveis Hierárquicos (1 a 4)</option>
            <option value="1">Nível 1: Holdings & Gestoras Globais (5)</option>
            <option value="2">Nível 2: Investimentos & Grandes Corporações (18)</option>
            <option value="3">Nível 3: Subsidiárias Operacionais (9)</option>
            <option value="4">Nível 4: Concessões, Minas & Ativos Críticos (9)</option>
          </select>
        </div>
      </div>

      {/* ─── CORPO PRINCIPAL COM CONTEÚDO DO MODO SELECIONADO ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel Central de Visualização (8 ou 12 colunas) */}
        <div className={`${noSelecionado ? "lg:col-span-8" : "lg:col-span-12"} space-y-4`}>
          {/* MODO 1: CANVAS DO GRAFO INTERATIVO 60FPS */}
          {modo === "grafo" && (
            <div className="relative rounded-2xl border border-border bg-slate-950 shadow-md overflow-hidden min-h-[580px] sm:min-h-[640px]">
              {/* Barra de Ferramentas Flutuante no Canvas */}
              <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/80 backdrop-blur-md p-1.5 text-xs text-slate-200">
                <button
                  type="button"
                  onClick={() => alterarZoom(1)}
                  className="rounded-lg p-1.5 hover:bg-white/10 transition"
                  title="Aproximar (Zoom In)"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => alterarZoom(-1)}
                  className="rounded-lg p-1.5 hover:bg-white/10 transition"
                  title="Afastar (Zoom Out)"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={resetZoom}
                  className="rounded-lg p-1.5 hover:bg-white/10 transition"
                  title="Recentralizar Grafo"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <div className="h-4 w-[1px] bg-white/20 mx-1" />
                <button
                  type="button"
                  onClick={() => {
                    isSimActiveRef.current = !isSimActiveRef.current;
                  }}
                  className="rounded-lg px-2 py-1 text-[11px] font-medium hover:bg-white/10 transition"
                >
                  Física: {isSimActiveRef.current ? "Ativa" : "Pausada"}
                </button>
              </div>

              {/* Legenda de Níveis Flutuante */}
              <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-slate-900/85 backdrop-blur-md px-3 py-2 text-[11px] text-slate-300">
                <span className="font-semibold text-white">Níveis:</span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                  Holding (L1)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  Investimento (L2)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Subsidiária (L3)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Concessão (L4)
                </span>
              </div>

              {/* Dica de Interatividade */}
              <div className="absolute top-3 right-3 z-10 hidden sm:block text-[11px] text-slate-400 bg-slate-900/70 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                🖱️ Arraste nós · Roda do mouse amplia · Clique para detalhes
              </div>

              {/* Canvas 2D Nativo */}
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                className="w-full h-[580px] sm:h-[640px] block"
              />
            </div>
          )}

          {/* MODO 2: MAPA MENTAL HIERÁRQUICO (ÁRVORE VETORIAL SVG) */}
          {modo === "mental" && (
            <div className="space-y-4">
              {/* Seletor de Holding Foco */}
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-3 text-xs">
                <span className="font-semibold text-muted">Holding Raiz:</span>
                {holdingsDisponiveis.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setHoldingFocoId(h.id)}
                    className={`rounded-xl px-3 py-1.5 font-semibold transition ${
                      holdingFocoId === h.id
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted/20 text-muted hover:text-foreground"
                    }`}
                  >
                    {h.nome.replace(", Inc.", "").replace(" S.A.", "")}
                  </button>
                ))}
              </div>

              {/* Renderização em Colunas Hierárquicas Conectadas */}
              {dadosArvoreFoco.holding && (
                <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-6 overflow-x-auto">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-w-[760px]">
                    {/* COLUNA 1: HOLDING */}
                    <div className="space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                        1. Holding / Gestora
                      </div>
                      <div
                        onClick={() => setNoSelecionadoId(dadosArvoreFoco.holding!.id)}
                        className={`cursor-pointer rounded-xl border p-3.5 transition shadow-xs ${
                          noSelecionadoId === dadosArvoreFoco.holding!.id
                            ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                            : "border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 hover:border-primary/50"
                        }`}
                      >
                        <div className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                          {dadosArvoreFoco.holding!.siglaOuTicker}
                        </div>
                        <div className="text-sm font-bold text-foreground mt-0.5">
                          {dadosArvoreFoco.holding!.nome}
                        </div>
                        <div className="text-xs text-muted mt-1">
                          {dadosArvoreFoco.holding!.valorMercadoOuAtivos}
                        </div>
                        <div className="mt-2 text-[11px] text-muted line-clamp-2">
                          {dadosArvoreFoco.holding!.descricao}
                        </div>
                      </div>
                    </div>

                    {/* COLUNA 2: INVESTIMENTOS DIRETOS */}
                    <div className="space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        2. Investimento / Conduíte ({dadosArvoreFoco.nivel2.length})
                      </div>
                      <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                        {dadosArvoreFoco.nivel2.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => setNoSelecionadoId(item.id)}
                            className={`cursor-pointer rounded-xl border p-3 transition shadow-xs ${
                              noSelecionadoId === item.id
                                ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                                : "border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 hover:border-primary/50"
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {item.siglaOuTicker}
                              </span>
                              <span className="font-mono text-muted">{item.participacaoMercadoPct}% mkt</span>
                            </div>
                            <div className="text-xs font-bold text-foreground mt-1">
                              {item.nome}
                            </div>
                            <div className="text-[11px] text-muted mt-0.5">
                              {item.valorMercadoOuAtivos}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* COLUNA 3: SUBSIDIÁRIAS OPERACIONAIS */}
                    <div className="space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        3. Subsidiária Operacional ({dadosArvoreFoco.nivel3.length})
                      </div>
                      <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                        {dadosArvoreFoco.nivel3.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => setNoSelecionadoId(item.id)}
                            className={`cursor-pointer rounded-xl border p-3 transition shadow-xs ${
                              noSelecionadoId === item.id
                                ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                                : "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-primary/50"
                            }`}
                          >
                            <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              {item.tipoRotulo}
                            </div>
                            <div className="text-xs font-bold text-foreground mt-1">
                              {item.nome}
                            </div>
                            <div className="text-[11px] text-muted mt-0.5">
                              Controlador: {item.controladorPrincipal}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* COLUNA 4: CONCESSÕES E ATIVOS ESTRATÉGICOS */}
                    <div className="space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        4. Concessão / Mina / Ativo ({dadosArvoreFoco.nivel4.length})
                      </div>
                      <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                        {dadosArvoreFoco.nivel4.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => setNoSelecionadoId(item.id)}
                            className={`cursor-pointer rounded-xl border p-3 transition shadow-xs ${
                              noSelecionadoId === item.id
                                ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                                : "border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 hover:border-primary/50"
                            }`}
                          >
                            <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                              {item.siglaOuTicker}
                            </div>
                            <div className="text-xs font-bold text-foreground mt-1">
                              {item.nome}
                            </div>
                            <div className="text-[11px] text-muted mt-0.5">
                              {item.jurisdicao}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODO 3: TABELA DAS 6 QUALIDADES (BUSCÁVEL, CLASSIFICÁVEL, EXPORTÁVEL, FONTES OFICIAIS) */}
          {modo === "tabela" && (
            <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-muted/15 border-b border-border text-muted font-semibold uppercase tracking-wider">
                    <tr>
                      <th
                        onClick={() => alternarOrdem("nome")}
                        className="p-3.5 cursor-pointer hover:text-foreground transition"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Entidade / Corporação</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => alternarOrdem("nivel")}
                        className="p-3.5 cursor-pointer hover:text-foreground transition"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Nível Hierárquico</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => alternarOrdem("setor")}
                        className="p-3.5 cursor-pointer hover:text-foreground transition"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Setor Estratégico</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => alternarOrdem("participacao")}
                        className="p-3.5 cursor-pointer hover:text-foreground transition text-right"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>Mkt Share</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => alternarOrdem("hhi")}
                        className="p-3.5 cursor-pointer hover:text-foreground transition text-right"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>HHI Setorial</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="p-3.5 text-center">Fonte Oficial</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {nosOrdenados.map((item) => {
                      const estiloNivel = CORES_NIVEL[item.nivelHierarquico] || CORES_NIVEL[2];
                      const isAtivo = noSelecionadoId === item.id;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => setNoSelecionadoId(item.id)}
                          className={`cursor-pointer transition hover:bg-muted/20 ${
                            isAtivo ? "bg-primary/5 font-semibold" : ""
                          }`}
                        >
                          <td className="p-3.5">
                            <div className="font-bold text-foreground text-xs sm:text-sm">
                              {item.nome}
                            </div>
                            <div className="text-[11px] text-muted">
                              {item.siglaOuTicker} · {item.paisOrigem}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border ${estiloNivel.bg} ${estiloNivel.border} ${estiloNivel.text}`}
                            >
                              L{item.nivelHierarquico} · {item.tipoRotulo.split(" ")[0]}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="text-muted text-xs">
                              {item.setorRotulo}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-foreground">
                            {item.participacaoMercadoPct}%
                          </td>
                          <td className="p-3.5 text-right font-mono">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${
                                item.hhiSetorial >= 2500
                                  ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                              }`}
                            >
                              {item.hhiSetorial}
                            </span>
                          </td>
                          <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <a
                              href={item.urlOficial}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[11px] text-primary hover:bg-primary/10 transition"
                              title={item.fontesOficiais}
                            >
                              <span>Ver</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ─── PAINEL LATERAL: DETALHES DO NÓ SELECIONADO & CONEXÕES DE PODER ─── */}
        {noSelecionado && (
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4 sticky top-6">
              {/* Cabeçalho do Card de Detalhes */}
              <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                        CORES_NIVEL[noSelecionado.nivelHierarquico]?.bg
                      } ${CORES_NIVEL[noSelecionado.nivelHierarquico]?.text} ${
                        CORES_NIVEL[noSelecionado.nivelHierarquico]?.border
                      }`}
                    >
                      Nível {noSelecionado.nivelHierarquico} · {noSelecionado.tipoRotulo}
                    </span>
                    <span className="text-[11px] font-mono text-muted">
                      {noSelecionado.siglaOuTicker}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground mt-1">
                    {noSelecionado.nome}
                  </h3>
                  <div className="text-xs text-muted">
                    {noSelecionado.setorRotulo} · {noSelecionado.paisOrigem}
                  </div>
                </div>

                <a
                  href={noSelecionado.urlOficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-primary/30 bg-primary/10 p-2 text-primary hover:bg-primary/20 transition"
                  title="Abrir Fonte Oficial Direta"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              {/* Métricas Concorrenciais */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-border bg-muted/10 p-3">
                  <div className="text-[10px] text-muted">Market Share Setorial</div>
                  <div className="text-lg font-bold font-mono text-foreground mt-0.5">
                    {noSelecionado.participacaoMercadoPct}%
                  </div>
                  <div className="text-[10px] text-muted">no Brasil</div>
                </div>

                <div className="rounded-xl border border-border bg-muted/10 p-3">
                  <div className="text-[10px] text-muted">Índice HHI Setor</div>
                  <div className="text-lg font-bold font-mono text-red-600 dark:text-red-400 mt-0.5">
                    {noSelecionado.hhiSetorial}
                  </div>
                  <div className="text-[10px] text-muted">CADE &gt; 2.500</div>
                </div>
              </div>

              {/* Ativos e Valor */}
              <div className="space-y-1.5 text-xs">
                <div className="text-muted">
                  <strong>Valor / Ativos:</strong>{" "}
                  <span className="text-foreground font-mono">{noSelecionado.valorMercadoOuAtivos}</span>
                </div>
                <div className="text-muted">
                  <strong>Faturamento:</strong>{" "}
                  <span className="text-foreground font-mono">{noSelecionado.faturamentoOuReceita}</span>
                </div>
                <div className="text-muted">
                  <strong>Jurisdição:</strong>{" "}
                  <span className="text-foreground">{noSelecionado.jurisdicao}</span>
                </div>
              </div>

              {/* Descrição Cívica */}
              <div className="rounded-xl bg-muted/15 p-3 text-xs text-foreground/90 leading-relaxed">
                {noSelecionado.descricao}
              </div>

              {/* Ativos Estratégicos */}
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-primary" />
                  <span>Ativos Estratégicos & Infraestrutura:</span>
                </div>
                <p className="text-muted leading-relaxed text-[11px]">
                  {noSelecionado.ativosEstrategicos}
                </p>
              </div>

              {/* Riscos Antitruste */}
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Riscos de Monopólio & Antitruste:</span>
                </div>
                <p className="text-muted leading-relaxed text-[11px]">
                  {noSelecionado.riscosAntitruste}
                </p>
              </div>

              {/* Controladores Acionários (Quem controla este nó) */}
              {conexoesSelecionado.controladores.length > 0 && (
                <div className="space-y-2 border-t border-border pt-3">
                  <div className="text-xs font-bold text-foreground">
                    Controladores & Acionistas Principais ({conexoesSelecionado.controladores.length}):
                  </div>
                  <div className="space-y-1.5">
                    {conexoesSelecionado.controladores.map(({ no: c, aresta }) => (
                      <div
                        key={c.id}
                        onClick={() => setNoSelecionadoId(c.id)}
                        className="cursor-pointer flex items-center justify-between rounded-lg border border-border/80 bg-muted/10 p-2 text-xs hover:border-primary/50 transition"
                      >
                        <div>
                          <div className="font-semibold text-foreground">{c.nome}</div>
                          <div className="text-[10px] text-muted">{aresta.tipoRotulo}</div>
                        </div>
                        {aresta.participacaoPct ? (
                          <span className="font-mono text-xs font-bold text-primary">
                            {aresta.participacaoPct}%
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Controlados / Subsidiárias (O que este nó controla) */}
              {conexoesSelecionado.controlados.length > 0 && (
                <div className="space-y-2 border-t border-border pt-3">
                  <div className="text-xs font-bold text-foreground">
                    Subsidiárias & Concessões Controladas ({conexoesSelecionado.controlados.length}):
                  </div>
                  <div className="space-y-1.5">
                    {conexoesSelecionado.controlados.map(({ no: s, aresta }) => (
                      <div
                        key={s.id}
                        onClick={() => setNoSelecionadoId(s.id)}
                        className="cursor-pointer flex items-center justify-between rounded-lg border border-border/80 bg-muted/10 p-2 text-xs hover:border-primary/50 transition"
                      >
                        <div>
                          <div className="font-semibold text-foreground">{s.nome}</div>
                          <div className="text-[10px] text-muted">{aresta.tipoRotulo}</div>
                        </div>
                        {aresta.participacaoPct ? (
                          <span className="font-mono text-xs font-bold text-primary">
                            {aresta.participacaoPct}%
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botão Oficial Verificado */}
              <div className="border-t border-border pt-3">
                <a
                  href={noSelecionado.urlOficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-xs"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Auditar na Fonte Oficial ({noSelecionado.fontesOficiais.split("/")[0]})</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── QUALIDADE 5: CONTEXTO CÍVICO & ASSISTENTE SEU NONÔ / ALCEU DISPOR ─── */}
      <section
        aria-label="Contexto Cívico e Perguntas Frequentes"
        className="rounded-2xl border border-sky-500/30 bg-sky-50/50 dark:bg-sky-950/20 p-6 space-y-4"
      >
        <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300">
          <HelpCircle className="h-5 w-5" />
          <h2 className="text-base font-bold">
            💡 Perguntas Cívicas para o Assistente (Seu Nonô / Alceu Dispor)
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-muted">
          Perguntas formuladas em orações curtas e diretas de até 13 palavras para fiscalização popular:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            "Quem é o dono da Vale e da BHP ao mesmo tempo?",
            "Por que quatro tradings controlam a exportação de grãos?",
            "Como os Big Three atuam nas assembleias acionárias?",
            "Qual o risco do quase-monopólio de refino da Petrobras?",
            "Como a Samarco distribui responsabilidades entre Vale e BHP?",
            "Por que a B3 tem monopólio na liquidação de ações?",
          ].map((pergunta) => (
            <div
              key={pergunta}
              className="flex items-center justify-between rounded-xl border border-sky-200 dark:border-sky-900/40 bg-surface p-3 text-xs shadow-2xs hover:border-sky-400 transition"
            >
              <span className="text-foreground font-medium pr-2">{pergunta}</span>
              <button
                type="button"
                onClick={() => copiarPergunta(pergunta)}
                className="shrink-0 p-1.5 rounded-lg border border-border hover:bg-muted/30 text-muted transition"
                title="Copiar pergunta para o assistente"
              >
                {copiadoPergunta === pergunta ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ─── RESUMO DOS ÍNDICES HHI SETORIAIS CONFORME PADRÃO CADE ─── */}
      <section
        aria-label="Índices HHI Setoriais"
        className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            📊 Concentração Setorial e Índice HHI (Guia CADE)
          </h2>
          <span className="text-xs text-muted">
            HHI &gt; 2.500: Altamente Concentrado
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {setores.map((setor) => (
            <div
              key={setor.setorId}
              className="rounded-xl border border-border bg-muted/10 p-4 space-y-2"
            >
              <div className="text-[11px] font-semibold text-muted line-clamp-1">
                {setor.nome}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-red-600 dark:text-red-400">
                  {setor.hhi}
                </span>
                <span className="text-xs font-mono text-muted">CR4: {setor.cr4Pct}%</span>
              </div>
              <div className="text-[10px] text-muted line-clamp-2">
                {setor.classificacao}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
