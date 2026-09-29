"use client";

/**
 * @file ArvoreObsidianGrafo.tsx
 * @description Visualizador duplo de dados do Laboratório: Grafo estilo Obsidian e Mapa Mental de Linhagem ETL.
 * 
 * Papel no portal:
 * Permite que o cidadão e o pesquisador auditem a teia completa do Controle Popular:
 * 1. Em Modo Grafo: rede orgânica de conexões com nós interativos, arrasto e zoom.
 * 2. Em Modo Mapa Mental: linhagem hierárquica completa (Fontes Oficiais -> Pipelines ETL -> Bases de Dados -> Camadas do Lab -> Páginas).
 * 
 * Fonte dos dados:
 * Mapeamento canônico de `@/lib/assistente/arvore-galhos` e catálogo analítico do laboratório.
 * 
 * Decisões técnicas:
 * - Canvas interativo 60fps sem dependências externas pesadas (zero overhead de bundle).
 * - Suporta zoom, pan, arrasto de nós (drag & drop) e realce de vizinhos.
 * - Modo Mapa Mental renderizado em árvore vetorial com agrupamento por linhagem de dados.
 * - Exportação de matriz de relações em CSV com BOM UTF-8 e separador `;` (Regra das 6 qualidades).
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
  GitBranch,
  Database,
  Cpu,
  FileCode,
  Network,
  CheckCircle2,
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

  // Modo de visualização: Grafo (Obsidian) ou Mapa Mental (Linhagem ETL)
  const [modoVisualizacao, setModoVisualizacao] = useState<"grafo" | "mapa_mental">("grafo");

  // Estados de navegação do palco (Pan & Zoom)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [arrastandoPalco, setArrastandoPalco] = useState(false);
  const [posicaoInicioArrasto, setPosicaoInicioArrasto] = useState({ x: 0, y: 0 });

  // Estados de interação com nós
  const [noSelecionado, setNoSelecionado] = useState<NoPosicionado | null>(null);
  const [noHover, setNoHover] = useState<NoPosicionado | null>(null);
  const [noArrastado, setNoArrastado] = useState<NoPosicionado | null>(null);

  // Filtros
  const [filtroEixo, setFiltroEixo] = useState<string>("todos");
  const [filtroTipoNo, setFiltroTipoNo] = useState<string>("todos");
  const [buscaTexto, setBuscaTexto] = useState("");
  const [mostrarTabelaAcessivel, setMostrarTabelaAcessivel] = useState(false);

  // Inicialização das posições dos nós
  const [nos, setNos] = useState<NoPosicionado[]>(() => {
    const mapaConexoes = new Map<string, string[]>();
    for (const a of ARESTAS_ARVORE) {
      if (!mapaConexoes.has(a.fonte)) mapaConexoes.set(a.fonte, []);
      if (!mapaConexoes.has(a.alvo)) mapaConexoes.set(a.alvo, []);
      mapaConexoes.get(a.fonte)!.push(a.alvo);
      mapaConexoes.get(a.alvo)!.push(a.fonte);
    }

    const angulosEixo: Record<string, { centro: number; delta: number }> = {
      direitos: { centro: (5 * Math.PI) / 4, delta: Math.PI / 3 },
      territorios: { centro: (7 * Math.PI) / 4, delta: Math.PI / 3 },
      estado: { centro: (3 * Math.PI) / 4, delta: Math.PI / 3 },
      central: { centro: Math.PI / 4, delta: Math.PI / 3 },
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
        y = 20;
      } else if (n.id.startsWith("eixo-")) {
        const ang = angulosEixo[n.eixoId].centro;
        x = Math.cos(ang) * 160;
        y = Math.sin(ang) * 160 + 20;
      } else if (n.tipoNo === "etl") {
        // Nós de ETL orbitam mais próximo das fontes e bases
        const ang = angulosEixo[n.eixoId].centro + 0.2;
        x = Math.cos(ang) * 220;
        y = Math.sin(ang) * 220 + 20;
      } else if (n.tipoNo === "base_dados") {
        // Bases de dados no anel intermediário
        const ang = angulosEixo[n.eixoId].centro - 0.2;
        x = Math.cos(ang) * 210;
        y = Math.sin(ang) * 210 + 20;
      } else if (n.tipoNo === "camada_lab") {
        // Camadas do laboratório
        const ang = Math.PI / 4 + (contadoresEixo["central"] % 5) * 0.15 - 0.3;
        x = Math.cos(ang) * 320;
        y = Math.sin(ang) * 320 + 20;
      } else {
        const config = angulosEixo[n.eixoId];
        const idx = contadoresEixo[n.eixoId]++;
        const total = totaisPorEixo[n.eixoId] || 1;
        const fatorAngulo = (idx / (total - 1 || 1) - 0.5) * config.delta;
        const angulo = config.centro + fatorAngulo;
        const distancia = 270 + (idx % 3) * 60 + Math.random() * 20;

        x = Math.cos(angulo) * distancia;
        y = Math.sin(angulo) * distancia + 20;
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

  // Filtragem de nós
  const nosVisiveis = useMemo(() => {
    return nos.filter((n) => {
      const passaEixo = filtroEixo === "todos" || n.eixoId === filtroEixo || n.id === "raiz-portal";
      const passaTipo =
        filtroTipoNo === "todos" ||
        (filtroTipoNo === "pagina" && (!n.tipoNo || n.tipoNo === "pagina")) ||
        n.tipoNo === filtroTipoNo ||
        n.id === "raiz-portal";

      const passaBusca =
        !buscaTexto ||
        n.titulo.toLowerCase().includes(buscaTexto.toLowerCase()) ||
        n.subgalho.toLowerCase().includes(buscaTexto.toLowerCase()) ||
        n.rotuloCurto.toLowerCase().includes(buscaTexto.toLowerCase());

      return passaEixo && passaTipo && passaBusca;
    });
  }, [nos, filtroEixo, filtroTipoNo, buscaTexto]);

  const idsVisiveis = useMemo(() => new Set(nosVisiveis.map((n) => n.id)), [nosVisiveis]);

  const arestasVisiveis = useMemo(() => {
    return ARESTAS_ARVORE.filter(
      (a) => idsVisiveis.has(a.fonte) && idsVisiveis.has(a.alvo)
    );
  }, [idsVisiveis]);

  // Renderização Canvas (Modo Grafo)
  useEffect(() => {
    if (modoVisualizacao !== "grafo") return;
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

    ctx.translate(largura / 2 + pan.x, altura / 2 + pan.y);
    ctx.scale(zoom, zoom);

    const mapaNos = new Map<string, NoPosicionado>();
    for (const n of nos) {
      mapaNos.set(n.id, n);
    }

    const noAtivo = noHover || noSelecionado;
    const vizinhosAtivos = noAtivo ? new Set([noAtivo.id, ...noAtivo.conectados]) : null;

    // 1. Arestas
    for (const aresta of arestasVisiveis) {
      const fonte = mapaNos.get(aresta.fonte);
      const alvo = mapaNos.get(aresta.alvo);
      if (!fonte || !alvo) continue;

      const estaAtiva =
        !vizinhosAtivos ||
        (vizinhosAtivos.has(fonte.id) && vizinhosAtivos.has(alvo.id));

      ctx.beginPath();
      ctx.moveTo(fonte.x, fonte.y);

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
          ? "rgba(225, 29, 72, 0.8)"
          : "rgba(225, 29, 72, 0.15)";
        ctx.lineWidth = estaAtiva ? 2 : 1;
        ctx.setLineDash([4, 4]);
      } else {
        ctx.strokeStyle = estaAtiva
          ? "rgba(16, 185, 129, 0.6)"
          : "rgba(16, 185, 129, 0.12)";
        ctx.lineWidth = estaAtiva ? 1.8 : 0.8;
      }

      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2. Nós
    for (const n of nosVisiveis) {
      const estaAtivo = !vizinhosAtivos || vizinhosAtivos.has(n.id);
      const ehONoEmFoco = noAtivo?.id === n.id;

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

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.tamanho, 0, Math.PI * 2);
      ctx.fillStyle = estaAtivo ? n.cor : "rgba(120, 120, 130, 0.25)";
      ctx.fill();

      ctx.strokeStyle = estaAtivo ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();

      const deveMostrarTexto =
        ehONoEmFoco ||
        n.destaque ||
        n.tipoNo === "base_dados" ||
        n.tipoNo === "etl" ||
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
  }, [nos, nosVisiveis, arestasVisiveis, zoom, pan, noHover, noSelecionado, modoVisualizacao]);

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
    const cabecalho = "Origem;Destino;Tipo_Relacao;Tipo_Origem;Tipo_Destino;Eixo_Origem;Eixo_Destino\n";
    const linhas = ARESTAS_ARVORE.map((a) => {
      const f = NOS_ARVORE.find((n) => n.id === a.fonte);
      const dest = NOS_ARVORE.find((n) => n.id === a.alvo);
      return `"${f?.titulo || a.fonte}";"${dest?.titulo || a.alvo}";"${a.tipo}";"${f?.tipoNo || "pagina"}";"${dest?.tipoNo || "pagina"}";"${f?.eixoId || ""}";"${dest?.eixoId || ""}"`;
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

  // Agrupamento para o Modo Mapa Mental
  const estruturaMapaMental = useMemo(() => {
    return Object.values(EIXOS_PORTAL).map((eixo) => {
      const nosDoEixo = nosVisiveis.filter((n) => n.eixoId === eixo.id && n.id !== "raiz-portal");
      const etls = nosDoEixo.filter((n) => n.tipoNo === "etl");
      const bases = nosDoEixo.filter((n) => n.tipoNo === "base_dados");
      const camadas = nosDoEixo.filter((n) => n.tipoNo === "camada_lab");
      const paginas = nosDoEixo.filter((n) => !n.tipoNo || n.tipoNo === "pagina");

      return {
        eixo,
        etls,
        bases,
        camadas,
        paginas,
      };
    });
  }, [nosVisiveis]);

  return (
    <div className="space-y-6">
      {/* ── Cartões de topo (Regra das 6 qualidades) ────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-3.5">
          <div className="flex items-center justify-between text-xs text-text-soft">
            <span>Nós Totais</span>
            <TreeDeciduous size={15} className="text-primary" />
          </div>
          <p className="mt-1 text-2xl font-bold text-foreground">{NOS_ARVORE.length}</p>
          <span className="text-[0.68rem] text-text-soft">Páginas, bases e pipelines</span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-3.5">
          <div className="flex items-center justify-between text-xs text-text-soft">
            <span>Linhagem & Arestas</span>
            <Network size={15} className="text-emerald-500" />
          </div>
          <p className="mt-1 text-2xl font-bold text-foreground">{ARESTAS_ARVORE.length}</p>
          <span className="text-[0.68rem] text-text-soft">Fluxos de dados e links</span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-3.5">
          <div className="flex items-center justify-between text-xs text-text-soft">
            <span>Bases & ETLs</span>
            <Database size={15} className="text-cyan-500" />
          </div>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {NOS_ARVORE.filter((n) => n.tipoNo === "base_dados" || n.tipoNo === "etl").length}
          </p>
          <span className="text-[0.68rem] text-text-soft">Postgres, JSON e coletores</span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-3.5">
          <div className="flex items-center justify-between text-xs text-text-soft">
            <span>Visualização</span>
            <GitBranch size={15} className="text-amber-500" />
          </div>
          <p className="mt-1 text-base font-bold text-foreground">
            {modoVisualizacao === "grafo" ? "Grafo Obsidian" : "Mapa Mental"}
          </p>
          <span className="text-[0.68rem] text-text-soft">Alternador de 2 modos</span>
        </div>
      </div>

      {/* ── Barra de Ferramentas, Modos & Filtros ────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Alternador de Modo: Grafo vs Mapa Mental */}
          <div className="flex items-center border border-border rounded-lg bg-surface-2 p-0.5">
            <button
              onClick={() => setModoVisualizacao("grafo")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition-colors ${
                modoVisualizacao === "grafo"
                  ? "bg-primary text-white shadow-xs"
                  : "text-text-soft hover:text-foreground"
              }`}
            >
              <Network size={13} />
              <span>Grafo Obsidian</span>
            </button>
            <button
              onClick={() => setModoVisualizacao("mapa_mental")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition-colors ${
                modoVisualizacao === "mapa_mental"
                  ? "bg-primary text-white shadow-xs"
                  : "text-text-soft hover:text-foreground"
              }`}
            >
              <GitBranch size={13} />
              <span>Mapa Mental (Linhagem ETL)</span>
            </button>
          </div>

          {/* Busca e Controles */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2 text-text-soft" />
              <input
                type="text"
                placeholder="Buscar nó, ETL ou base..."
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                className="w-40 sm:w-56 rounded-lg border border-border bg-surface-2 pl-7 pr-2.5 py-1 text-xs text-foreground placeholder:text-text-soft focus:border-primary focus:outline-hidden"
              />
            </div>

            {modoVisualizacao === "grafo" && (
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
            )}

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

        {/* Filtros por Eixo e por Tipo de Dado */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-text-soft mr-1">Eixo:</span>
            <button
              onClick={() => setFiltroEixo("todos")}
              className={`rounded-md px-2 py-0.5 font-medium transition-colors ${
                filtroEixo === "todos"
                  ? "bg-primary text-white"
                  : "border border-border bg-surface-2 text-text-soft hover:text-foreground"
              }`}
            >
              Todos
            </button>
            {Object.values(EIXOS_PORTAL).map((eixo) => (
              <button
                key={eixo.id}
                onClick={() => setFiltroEixo(eixo.id)}
                className={`rounded-md px-2 py-0.5 font-medium transition-colors ${
                  filtroEixo === eixo.id
                    ? "bg-primary text-white"
                    : "border border-border bg-surface-2 text-text-soft hover:text-foreground"
                }`}
              >
                {eixo.numero}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-text-soft mr-1">Camada:</span>
            <button
              onClick={() => setFiltroTipoNo("todos")}
              className={`rounded-md px-2 py-0.5 font-medium transition-colors ${
                filtroTipoNo === "todos"
                  ? "bg-foreground text-background font-bold"
                  : "border border-border bg-surface-2 text-text-soft hover:text-foreground"
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFiltroTipoNo("pagina")}
              className={`rounded-md px-2 py-0.5 font-medium transition-colors ${
                filtroTipoNo === "pagina"
                  ? "bg-foreground text-background font-bold"
                  : "border border-border bg-surface-2 text-text-soft hover:text-foreground"
              }`}
            >
              Páginas
            </button>
            <button
              onClick={() => setFiltroTipoNo("base_dados")}
              className={`rounded-md px-2 py-0.5 font-medium transition-colors ${
                filtroTipoNo === "base_dados"
                  ? "bg-cyan-600 text-white font-bold"
                  : "border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10"
              }`}
            >
              Bases de Dados
            </button>
            <button
              onClick={() => setFiltroTipoNo("etl")}
              className={`rounded-md px-2 py-0.5 font-medium transition-colors ${
                filtroTipoNo === "etl"
                  ? "bg-purple-600 text-white font-bold"
                  : "border border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
              }`}
            >
              Pipelines ETL
            </button>
            <button
              onClick={() => setFiltroTipoNo("camada_lab")}
              className={`rounded-md px-2 py-0.5 font-medium transition-colors ${
                filtroTipoNo === "camada_lab"
                  ? "bg-pink-600 text-white font-bold"
                  : "border border-pink-500/30 text-pink-600 dark:text-pink-400 hover:bg-pink-500/10"
              }`}
            >
              Camadas Lab
            </button>
          </div>
        </div>
      </div>

      {/* ── MODO 1: PALCO CANVAS OBSIDIAN GRAPH VIEW ─────────────────────────── */}
      {modoVisualizacao === "grafo" && (
        <div
          ref={containerRef}
          className="relative h-[620px] w-full rounded-2xl border border-border bg-slate-950 overflow-hidden shadow-inner select-none cursor-grab active:cursor-grabbing"
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

          {/* Legenda de nós */}
          <div className="absolute bottom-3 left-3 rounded-xl border border-white/10 bg-slate-900/90 p-2.5 backdrop-blur-md text-[0.7rem] text-slate-300 space-y-1 shadow-lg">
            <p className="font-semibold text-slate-100 mb-1 flex items-center gap-1">
              <span>🌳</span> Tipos de Nós:
            </p>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#06b6d4]" />
              <span>Bases de Dados (Postgres / JSON)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#a855f7]" />
              <span>Pipelines ETL (ANM, PNCP, SEMAD)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ec4899]" />
              <span>Camadas do Lab (PowerBI)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
              <span>Páginas e Monitoramentos</span>
            </div>
          </div>

          {/* Inspeção do Nó Selecionado */}
          {noSelecionado && (
            <div className="absolute top-3 right-3 max-w-xs rounded-xl border border-white/15 bg-slate-900/95 p-4 text-xs text-slate-200 backdrop-blur-md shadow-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className="rounded-full px-2 py-0.5 text-[0.65rem] font-bold text-white uppercase tracking-wider"
                  style={{ backgroundColor: noSelecionado.cor }}
                >
                  {noSelecionado.tipoNo || noSelecionado.subgalho}
                </span>
                <button
                  onClick={() => setNoSelecionado(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <h4 className="font-bold text-white text-sm">{noSelecionado.titulo}</h4>
              {noSelecionado.descricao && (
                <p className="text-[0.72rem] text-slate-300 leading-relaxed">
                  {noSelecionado.descricao}
                </p>
              )}
              <p className="text-[0.72rem] text-slate-400">
                Subgalho: <strong className="text-slate-200">{noSelecionado.subgalho}</strong>
              </p>
              <p className="text-[0.72rem] text-slate-400">
                Conexões ativas: <strong className="text-slate-200">{noSelecionado.conectados.length}</strong>
              </p>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <Link
                  href={noSelecionado.href}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 font-bold text-white text-xs hover:opacity-90 transition-opacity"
                >
                  <span>Acessar Recurso</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODO 2: MAPA MENTAL HIERÁRQUICO (LINHAGEM ETL & BASES) ─────────────── */}
      {modoVisualizacao === "mapa_mental" && (
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-8">
          <div className="border-b border-border pb-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <GitBranch className="text-primary" size={18} />
              <span>Mapa Mental da Linhagem Cívica de Dados</span>
            </h3>
            <p className="text-xs text-text-soft mt-1">
              Rastreamento de ponta a ponta: da fonte pública oficial e pipeline ETL até a base de dados, a camada PowerBI do laboratório e a página final.
            </p>
          </div>

          <div className="space-y-8">
            {estruturaMapaMental.map(({ eixo, etls, bases, camadas, paginas }) => (
              <div
                key={eixo.id}
                className="rounded-xl border border-border/80 bg-surface-2 p-4 space-y-4"
              >
                {/* Cabeçalho do Ramo/Eixo */}
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: eixo.cor }}
                    />
                    <h4 className="font-bold text-foreground text-sm">
                      {eixo.numero} — {eixo.nome}
                    </h4>
                  </div>
                  <Link
                    href={eixo.href}
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span>Explorar Eixo</span>
                    <ArrowRight size={11} />
                  </Link>
                </div>

                {/* Subgalhos: ETL, Bases, Camadas Lab e Páginas */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {/* 1. Pipelines ETL */}
                  <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300">
                      <Cpu size={13} />
                      <span>Pipelines ETL ({etls.length})</span>
                    </div>
                    {etls.length === 0 ? (
                      <p className="text-[0.7rem] text-text-soft italic">Alimentado por coletores transversais.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {etls.map((n) => (
                          <div
                            key={n.id}
                            className="rounded-md border border-purple-500/20 bg-surface px-2 py-1 text-[0.72rem] text-foreground"
                          >
                            <span className="font-semibold block">{n.titulo}</span>
                            <span className="text-[0.65rem] text-text-soft">{n.descricao}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. Bases de Dados */}
                  <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-300">
                      <Database size={13} />
                      <span>Bases de Dados ({bases.length})</span>
                    </div>
                    {bases.length === 0 ? (
                      <p className="text-[0.7rem] text-text-soft italic">Persistência no Postgres Guara.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {bases.map((n) => (
                          <div
                            key={n.id}
                            className="rounded-md border border-cyan-500/20 bg-surface px-2 py-1 text-[0.72rem] text-foreground"
                          >
                            <span className="font-semibold block">{n.titulo}</span>
                            <span className="text-[0.65rem] text-text-soft">{n.descricao}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3. Camadas do Laboratório */}
                  <div className="rounded-lg border border-pink-500/20 bg-pink-500/5 p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-pink-700 dark:text-pink-300">
                      <Layers size={13} />
                      <span>Camadas Lab ({camadas.length})</span>
                    </div>
                    {camadas.length === 0 ? (
                      <p className="text-[0.7rem] text-text-soft italic">Camadas ativadas no painel do Lab.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {camadas.map((n) => (
                          <div
                            key={n.id}
                            className="rounded-md border border-pink-500/20 bg-surface px-2 py-1 text-[0.72rem] text-foreground"
                          >
                            <span className="font-semibold block">{n.titulo}</span>
                            <span className="text-[0.65rem] text-text-soft">{n.descricao}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4. Páginas Monitoradas */}
                  <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text-soft">
                      <FileCode size={13} />
                      <span>Páginas Finais ({paginas.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {paginas.slice(0, 6).map((n) => (
                        <Link
                          key={n.id}
                          href={n.href}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2 py-0.5 text-[0.68rem] text-text-soft hover:text-foreground hover:border-primary/50 transition-colors"
                        >
                          <span>{n.rotuloCurto}</span>
                        </Link>
                      ))}
                      {paginas.length > 6 && (
                        <span className="text-[0.68rem] text-text-soft px-1 self-center">
                          +{paginas.length - 6} páginas
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Visão Alternativa Acessível em Tabela (Regra das 6 qualidades) ──── */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Catálogo Tabular da Árvore Cívica & Linhagem ETL
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
                  <th className="py-2 px-2.5">Nó / Recurso</th>
                  <th className="py-2 px-2.5">Tipo</th>
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
                      <span className="rounded-md bg-surface-2 border border-border px-1.5 py-0.5 text-[0.65rem] uppercase font-bold text-text-soft">
                        {n.tipoNo || "pagina"}
                      </span>
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
