"use client";

import { useId, useMemo, useState } from "react";
import { semAcento } from "@/lib/busca/normalizar";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import {
  Search,
  Download,
  ExternalLink,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Building2,
  Copy,
  Check,
  XCircle,
  HelpCircle,
} from "lucide-react";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CADASTRO AMBIENTAL RURAL (CAR / IEF MG) — TABELA INTERATIVA E FILTROS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Implementado em estrita conformidade com a Regra das 5 Coisas (AGENTS.md §8):
 * 1. Gráfico nativo (distribuição por status e por porte, sem libs externas)
 * 2. Cartões de topo (volume filtrado, área total, MF e tempo médio em destaque)
 * 3. Planilha (download CSV com o recorte filtrado, separado por ; e BOM UTF-8)
 * 4. Filtros combináveis (texto, URFBio, porte, setor, status)
 * 5. Ordenação por coluna (município, área, MF, dias em análise, data, status)
 *
 * Fontes oficiais auditadas:
 * - SICAR Nacional: https://consultapublica.car.gov.br/publico/imoveis/consulta
 * - CAR 2.0 MG (CSR / UFMG): https://csr.ufmg.br/car20_mg/consultar-car/
 */

export interface ImovelCar {
  id?: string;
  codigoCar: string;
  nomeImovel: string;
  municipio: string;
  codIbge?: string | number;
  urfbio: string;
  porte: "Pequeno" | "Médio" | "Grande" | string;
  modulosFiscais: number;
  areaHa: number;
  setor: "Agropecuária" | "Silvicultura" | "Mineração" | "Energia" | "Misto" | string;
  status: "Em Análise" | "Analisado com Pendências" | "Analisado Aprovado" | "Cancelado" | string;
  dataCadastro: string; // ISO "YYYY-MM-DD"
  tempoAnaliseDias: number;
  linkConsultaSicar?: string;
  linkConsultaCar20?: string;
}

export type RegistroCar = ImovelCar;

export interface TabelaCarProps {
  registros?: ImovelCar[];
  urfbios?: readonly string[] | string[];
}

/** As 14 Regionais do Instituto Estadual de Florestas (IEF-MG) */
export const URFBIOS_PADRAO: readonly string[] = [
  "Alto Paranaíba",
  "Alto Médio São Francisco",
  "Centro-Norte",
  "Centro-Oeste",
  "Centro-Sul",
  "Jequitinhonha",
  "Mata",
  "Metropolitana",
  "Nordeste",
  "Noroeste",
  "Norte",
  "Rio Doce",
  "Sul",
  "Triângulo",
] as const;

export const PORTES_OPCOES = [
  { valor: "todos", rotulo: "Todos os portes" },
  { valor: "pequeno", rotulo: "Pequeno (até 4 MF)" },
  { valor: "medio", rotulo: "Médio (4 a 15 MF)" },
  { valor: "grande", rotulo: "Grande (> 15 MF)" },
] as const;

export const SETORES_OPCOES = [
  { valor: "todos", rotulo: "Todos os setores" },
  { valor: "Agropecuária", rotulo: "Agropecuária" },
  { valor: "Silvicultura", rotulo: "Silvicultura" },
  { valor: "Mineração", rotulo: "Mineração" },
  { valor: "Energia", rotulo: "Energia" },
  { valor: "Misto", rotulo: "Misto" },
] as const;

export const STATUS_OPCOES = [
  { valor: "todos", rotulo: "Todos os status" },
  { valor: "em_analise", rotulo: "Em Análise" },
  { valor: "pendencias", rotulo: "Analisado com Pendências" },
  { valor: "aprovado", rotulo: "Analisado Aprovado" },
  { valor: "cancelado", rotulo: "Cancelado" },
] as const;

type ColunaOrdenavel =
  | "municipio"
  | "areaHa"
  | "modulosFiscais"
  | "tempoAnaliseDias"
  | "dataCadastro"
  | "status";

type DirecaoOrdenacao = "asc" | "desc";

/** Amostra representativa inicial de Minas Gerais caso nenhuma prop seja passada */
export const AMOSTRA_CAR_MG: ImovelCar[] = [
  {
    codigoCar: "MG-3106200-47B49F7D937B48109F14704B1BC40842",
    nomeImovel: "Fazenda Cachoeira Alta",
    municipio: "Belo Horizonte",
    codIbge: "3106200",
    urfbio: "Metropolitana",
    porte: "Médio",
    modulosFiscais: 8.5,
    areaHa: 170.0,
    setor: "Agropecuária",
    status: "Em Análise",
    dataCadastro: "2021-03-15",
    tempoAnaliseDias: 1654,
  },
  {
    codigoCar: "MG-3106705-18FA3D2C4B7E48F19D12708E3AB19921",
    nomeImovel: "Sítio Boa Esperança",
    municipio: "Betim",
    codIbge: "3106705",
    urfbio: "Metropolitana",
    porte: "Pequeno",
    modulosFiscais: 2.1,
    areaHa: 42.0,
    setor: "Misto",
    status: "Analisado com Pendências",
    dataCadastro: "2022-07-10",
    tempoAnaliseDias: 1172,
  },
  {
    codigoCar: "MG-3143302-89CC2140A7B942308E41728BCFA20199",
    nomeImovel: "Gleba Serra Azul Mineração",
    municipio: "Montes Claros",
    codIbge: "3143302",
    urfbio: "Norte",
    porte: "Grande",
    modulosFiscais: 45.8,
    areaHa: 2748.0,
    setor: "Mineração",
    status: "Em Análise",
    dataCadastro: "2019-11-04",
    tempoAnaliseDias: 2151,
  },
  {
    codigoCar: "MG-3170206-56A188C0E24A496BAF8214300ECA7731",
    nomeImovel: "Fazenda Três Barras",
    municipio: "Uberlândia",
    codIbge: "3170206",
    urfbio: "Triângulo",
    porte: "Grande",
    modulosFiscais: 32.0,
    areaHa: 1280.0,
    setor: "Agropecuária",
    status: "Analisado Aprovado",
    dataCadastro: "2020-02-18",
    tempoAnaliseDias: 890,
  },
  {
    codigoCar: "MG-3131307-77E552D1CA4B445091238C127FAB1002",
    nomeImovel: "Complexo Solar Sertão Minas",
    municipio: "Ipatinga",
    codIbge: "3131307",
    urfbio: "Rio Doce",
    porte: "Grande",
    modulosFiscais: 28.4,
    areaHa: 852.0,
    setor: "Energia",
    status: "Analisado com Pendências",
    dataCadastro: "2021-08-22",
    tempoAnaliseDias: 1494,
  },
  {
    codigoCar: "MG-3168606-34F18B9A0C3241288AE001278CFA3412",
    nomeImovel: "Refúgio Verde Eucaliptos",
    municipio: "Teófilo Otoni",
    codIbge: "3168606",
    urfbio: "Nordeste",
    porte: "Médio",
    modulosFiscais: 11.2,
    areaHa: 448.0,
    setor: "Silvicultura",
    status: "Em Análise",
    dataCadastro: "2023-01-14",
    tempoAnaliseDias: 984,
  },
  {
    codigoCar: "MG-3127701-99881A224B6645318F1200984EBA5561",
    nomeImovel: "Chácara Pouso Alegre",
    municipio: "Governador Valadares",
    codIbge: "3127701",
    urfbio: "Rio Doce",
    porte: "Pequeno",
    modulosFiscais: 1.8,
    areaHa: 36.0,
    setor: "Agropecuária",
    status: "Analisado Aprovado",
    dataCadastro: "2020-09-30",
    tempoAnaliseDias: 640,
  },
  {
    codigoCar: "MG-3151800-11223344AABB44338877665544332211",
    nomeImovel: "Fazenda Água Limpa",
    municipio: "Poços de Caldas",
    codIbge: "3151800",
    urfbio: "Sul",
    porte: "Pequeno",
    modulosFiscais: 3.4,
    areaHa: 68.0,
    setor: "Agropecuária",
    status: "Cancelado",
    dataCadastro: "2018-05-12",
    tempoAnaliseDias: 1205,
  },
  {
    codigoCar: "MG-3136702-44556677889944332211AABBCCDDEEFF",
    nomeImovel: "Floresta Viva Silvicultura",
    municipio: "Juiz de Fora",
    codIbge: "3136702",
    urfbio: "Mata",
    porte: "Grande",
    modulosFiscais: 22.0,
    areaHa: 660.0,
    setor: "Silvicultura",
    status: "Analisado Aprovado",
    dataCadastro: "2020-06-11",
    tempoAnaliseDias: 710,
  },
  {
    codigoCar: "MG-3171303-90817263544144229988112233445566",
    nomeImovel: "Recanto dos Cristais",
    municipio: "Viçosa",
    codIbge: "3171303",
    urfbio: "Mata",
    porte: "Pequeno",
    modulosFiscais: 2.8,
    areaHa: 56.0,
    setor: "Misto",
    status: "Em Análise",
    dataCadastro: "2022-11-20",
    tempoAnaliseDias: 1039,
  },
  {
    codigoCar: "MG-3118007-12349876543241109988776655443322",
    nomeImovel: "Parque Eólico Serra Geral",
    municipio: "Congonhas",
    codIbge: "3118007",
    urfbio: "Centro-Sul",
    porte: "Grande",
    modulosFiscais: 52.0,
    areaHa: 1560.0,
    setor: "Energia",
    status: "Em Análise",
    dataCadastro: "2021-04-18",
    tempoAnaliseDias: 1620,
  },
  {
    codigoCar: "MG-3104007-88990011223344556677889900AABBCC",
    nomeImovel: "Fazenda Diamantina do Norte",
    municipio: "Araxá",
    codIbge: "3104007",
    urfbio: "Alto Paranaíba",
    porte: "Médio",
    modulosFiscais: 9.6,
    areaHa: 288.0,
    setor: "Mineração",
    status: "Analisado com Pendências",
    dataCadastro: "2021-12-05",
    tempoAnaliseDias: 1389,
  },
];

/** Normaliza texto para busca textual */
function normalizarTexto(txt: string): string {
  return semAcento(txt.trim());
}

/** Escapa campo para planilha CSV brasileira */
function csvEscape(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  const s = String(valor);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Gera CSV delimitado por ponto e vírgula com BOM UTF-8 */
function gerarCsv(itens: ImovelCar[]): string {
  const BOM = "\uFEFF";
  const cabecalhos = [
    "codigo_car",
    "nome_imovel",
    "municipio",
    "cod_ibge",
    "urfbio_regional",
    "porte",
    "modulos_fiscais",
    "area_ha",
    "setor",
    "status",
    "data_cadastro",
    "tempo_analise_dias",
    "link_consulta_sicar",
    "link_consulta_car20_mg",
  ].join(";");

  const linhas = itens.map((r) =>
    [
      r.codigoCar,
      r.nomeImovel,
      r.municipio,
      r.codIbge ?? "",
      r.urfbio,
      r.porte,
      r.modulosFiscais.toLocaleString("pt-BR", { maximumFractionDigits: 2 }),
      r.areaHa.toLocaleString("pt-BR", { maximumFractionDigits: 2 }),
      r.setor,
      r.status,
      r.dataCadastro,
      r.tempoAnaliseDias,
      r.linkConsultaSicar ?? "https://consultapublica.car.gov.br/publico/imoveis/consulta",
      r.linkConsultaCar20 ?? "https://csr.ufmg.br/car20_mg/consultar-car/",
    ]
      .map(csvEscape)
      .join(";"),
  );

  return BOM + [cabecalhos, ...linhas].join("\r\n") + "\r\n";
}

/** Faz download do arquivo CSV no navegador */
function dispararDownloadCsv(conteudo: string, nomeArquivo: string) {
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Validador de match para o porte do imóvel */
function casaFiltroPorte(porteRegistro: string, modulos: number, filtro: string): boolean {
  if (!filtro || filtro === "todos") return true;
  const p = semAcento(porteRegistro);
  if (filtro === "pequeno") {
    return p.includes("pequeno") || modulos <= 4;
  }
  if (filtro === "medio") {
    return p.includes("medio") || (modulos > 4 && modulos <= 15);
  }
  if (filtro === "grande") {
    return p.includes("grande") || modulos > 15;
  }
  return true;
}

/** Validador de match para o status do imóvel */
function casaFiltroStatus(statusRegistro: string, filtro: string): boolean {
  if (!filtro || filtro === "todos") return true;
  const s = semAcento(statusRegistro);
  if (filtro === "em_analise") {
    return s.includes("em analise") || s === "analise";
  }
  if (filtro === "pendencias") {
    return s.includes("pendencia") || s.includes("pendencias");
  }
  if (filtro === "aprovado") {
    return s.includes("aprovado");
  }
  if (filtro === "cancelado") {
    return s.includes("cancelado");
  }
  return s === semAcento(filtro);
}

export default function TabelaCar({
  registros = AMOSTRA_CAR_MG,
  urfbios = URFBIOS_PADRAO,
}: TabelaCarProps) {
  const buscaId = useId();
  const urfbioId = useId();
  const porteId = useId();
  const setorId = useId();
  const statusId = useId();
  const itensPorPaginaId = useId();

  // Estados dos filtros
  const [busca, setBusca] = useState("");
  const [filtroUrfbio, setFiltroUrfbio] = useState("todos");
  const [filtroPorte, setFiltroPorte] = useState("todos");
  const [filtroSetor, setFiltroSetor] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  // Ordenação
  const [colunaOrdem, setColunaOrdem] = useState<ColunaOrdenavel>("tempoAnaliseDias");
  const [direcaoOrdem, setDirecaoOrdem] = useState<DirecaoOrdenacao>("desc");

  // Paginação: 25 ou 50 itens
  const [itensPorPagina, setItensPorPagina] = useState<25 | 50>(25);
  const [paginaAtual, setPaginaAtual] = useState<number>(1);

  // Estado de cópia do código CAR
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const copiarCodigoCar = (codigo: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(codigo);
      setCopiadoId(codigo);
      setTimeout(() => setCopiadoId(null), 2000);
    }
  };

  const alternarOrdenacao = (coluna: ColunaOrdenavel) => {
    if (colunaOrdem === coluna) {
      setDirecaoOrdem((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setColunaOrdem(coluna);
      // Padrão desc para tempo de análise, área e MF; asc para texto e status
      const descPadrao =
        coluna === "tempoAnaliseDias" ||
        coluna === "areaHa" ||
        coluna === "modulosFiscais" ||
        coluna === "dataCadastro";
      setDirecaoOrdem(descPadrao ? "desc" : "asc");
    }
    setPaginaAtual(1);
  };

  const limparFiltros = () => {
    setBusca("");
    setFiltroUrfbio("todos");
    setFiltroPorte("todos");
    setFiltroSetor("todos");
    setFiltroStatus("todos");
    setPaginaAtual(1);
  };

  const temFiltroAtivo = Boolean(
    busca.trim() ||
      filtroUrfbio !== "todos" ||
      filtroPorte !== "todos" ||
      filtroSetor !== "todos" ||
      filtroStatus !== "todos",
  );

  // Filtragem e ordenação
  const filtradosEOrdenados = useMemo(() => {
    const termoBusca = normalizarTexto(busca);

    const filtrados = registros.filter((r) => {
      // 1. Busca textual (nome do imóvel, código CAR ou município)
      if (termoBusca) {
        const casaNome = normalizarTexto(r.nomeImovel).includes(termoBusca);
        const casaCar = normalizarTexto(r.codigoCar).includes(termoBusca);
        const casaMun = normalizarTexto(r.municipio).includes(termoBusca);
        if (!casaNome && !casaCar && !casaMun) return false;
      }

      // 2. URFBio / Polo Regional
      if (filtroUrfbio !== "todos" && r.urfbio !== filtroUrfbio) {
        return false;
      }

      // 3. Porte do Imóvel
      if (!casaFiltroPorte(r.porte, r.modulosFiscais, filtroPorte)) {
        return false;
      }

      // 4. Setor
      if (
        filtroSetor !== "todos" &&
        normalizarTexto(r.setor) !== normalizarTexto(filtroSetor)
      ) {
        return false;
      }

      // 5. Status
      if (!casaFiltroStatus(r.status, filtroStatus)) {
        return false;
      }

      return true;
    });

    const sinal = direcaoOrdem === "asc" ? 1 : -1;

    return [...filtrados].sort((a, b) => {
      switch (colunaOrdem) {
        case "municipio":
          return sinal * a.municipio.localeCompare(b.municipio, "pt-BR");
        case "areaHa":
          return sinal * (a.areaHa - b.areaHa);
        case "modulosFiscais":
          return sinal * (a.modulosFiscais - b.modulosFiscais);
        case "tempoAnaliseDias":
          return sinal * (a.tempoAnaliseDias - b.tempoAnaliseDias);
        case "dataCadastro":
          return sinal * a.dataCadastro.localeCompare(b.dataCadastro);
        case "status":
          return sinal * a.status.localeCompare(b.status, "pt-BR");
        default:
          return 0;
      }
    });
  }, [
    registros,
    busca,
    filtroUrfbio,
    filtroPorte,
    filtroSetor,
    filtroStatus,
    colunaOrdem,
    direcaoOrdem,
  ]);

  // Agregados calculados para os Cartões de Topo e Gráficos
  const agregados = useMemo(() => {
    const totalItens = filtradosEOrdenados.length;
    let somaArea = 0;
    let somaModulos = 0;
    let somaDias = 0;

    let emAnaliseQtd = 0;
    let pendenciasQtd = 0;
    let aprovadoQtd = 0;
    let canceladoQtd = 0;

    let pequenoQtd = 0;
    let medioQtd = 0;
    let grandeQtd = 0;

    for (const item of filtradosEOrdenados) {
      somaArea += item.areaHa;
      somaModulos += item.modulosFiscais;
      somaDias += item.tempoAnaliseDias;

      const s = semAcento(item.status);
      if (s.includes("pendencia")) {
        pendenciasQtd++;
      } else if (s.includes("aprovado")) {
        aprovadoQtd++;
      } else if (s.includes("cancelado")) {
        canceladoQtd++;
      } else {
        emAnaliseQtd++;
      }

      const p = semAcento(item.porte);
      if (p.includes("grande") || item.modulosFiscais > 15) {
        grandeQtd++;
      } else if (p.includes("medio") || item.modulosFiscais > 4) {
        medioQtd++;
      } else {
        pequenoQtd++;
      }
    }

    const tempoMedioDias = totalItens > 0 ? Math.round(somaDias / totalItens) : 0;
    const tempoMedioMeses =
      tempoMedioDias > 0 ? (tempoMedioDias / 30.417).toFixed(1).replace(".", ",") : "0";

    return {
      totalItens,
      somaArea,
      somaModulos,
      tempoMedioDias,
      tempoMedioMeses,
      statusDist: {
        emAnalise: emAnaliseQtd,
        pendencias: pendenciasQtd,
        aprovado: aprovadoQtd,
        cancelado: canceladoQtd,
      },
      porteDist: {
        pequeno: pequenoQtd,
        medio: medioQtd,
        grande: grandeQtd,
      },
    };
  }, [filtradosEOrdenados]);

  // Paginação
  const totalPaginas = Math.max(1, Math.ceil(filtradosEOrdenados.length / itensPorPagina));
  const paginaCorrigida = Math.min(paginaAtual, totalPaginas);

  const itensExibidos = useMemo(() => {
    const inicio = (paginaCorrigida - 1) * itensPorPagina;
    return filtradosEOrdenados.slice(inicio, inicio + itensPorPagina);
  }, [filtradosEOrdenados, paginaCorrigida, itensPorPagina]);

  const exportarFiltrados = () => {
    const hoje = new Date().toISOString().slice(0, 10);
    const csv = gerarCsv(filtradosEOrdenados);
    dispararDownloadCsv(csv, `car-ief-mg-filtrado-${hoje}.csv`);
  };

  // Helper para renderizar célula de ordenação acessível
  const renderCabecalhoOrdenavel = (
    coluna: ColunaOrdenavel,
    rotulo: string,
    alinhamento: "left" | "right" | "center" = "left",
  ) => {
    const ativo = colunaOrdem === coluna;
    const ariaSort = ativo
      ? direcaoOrdem === "asc"
        ? "ascending"
        : "descending"
      : "none";

    return (
      <th
        scope="col"
        aria-sort={ariaSort}
        className={`px-3.5 py-3 text-xs font-semibold tracking-wider uppercase text-text-soft transition-colors select-none ${
          alinhamento === "right"
            ? "text-right"
            : alinhamento === "center"
              ? "text-center"
              : "text-left"
        }`}
      >
        <button
          type="button"
          onClick={() => alternarOrdenacao(coluna)}
          className={`group inline-flex items-center gap-1.5 rounded p-1 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
            ativo ? "text-primary font-bold" : ""
          }`}
          aria-label={`Ordenar por ${rotulo}`}
        >
          <span>{rotulo}</span>
          <span
            aria-hidden="true"
            className={`transition-opacity ${ativo ? "opacity-100" : "opacity-40 group-hover:opacity-80"}`}
          >
            {ativo ? (
              direcaoOrdem === "asc" ? (
                "▲"
              ) : (
                "▼"
              )
            ) : (
              <ArrowUpDown className="h-3 w-3 inline" />
            )}
          </span>
        </button>
      </th>
    );
  };

  // Badges semânticas
  const renderStatusBadge = (status: string) => {
    const s = semAcento(status);
    if (s.includes("aprovado")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          Aprovado
        </span>
      );
    }
    if (s.includes("pendencia")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-800 dark:text-orange-300 border border-orange-500/30">
          <AlertTriangle className="w-3 h-3 text-orange-600 dark:text-orange-400" />
          Com Pendências
        </span>
      );
    }
    if (s.includes("cancelado")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border border-zinc-500/30">
          <XCircle className="w-3 h-3 text-zinc-500" />
          Cancelado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
        <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400 animate-pulse" />
        Em Análise
      </span>
    );
  };

  const renderPorteBadge = (porte: string, modulos: number) => {
    const p = semAcento(porte);
    if (p.includes("grande") || modulos > 15) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-700/15 text-amber-900 dark:text-amber-200 border border-amber-700/30">
          Grande (&gt;15 MF)
        </span>
      );
    }
    if (p.includes("medio") || modulos > 4) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-500/30">
          Médio (4-15 MF)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30">
        Pequeno (≤4 MF)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ═══ 1. GRÁFICO NATIVO: DISTRIBUIÇÃO DOS IMÓVEIS FILTRADOS ═══ */}
      <section
        aria-labelledby="titulo-grafico-car"
        className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3.5">
          <div>
            <h2
              id="titulo-grafico-car"
              className="font-display text-base font-bold text-foreground"
            >
              Distribuição do Recorte: Status da Análise e Porte Territorial
            </h2>
            <p className="text-xs text-muted text-text-soft">
              Visualização instantânea de {formatNumberBR(agregados.totalItens)} registros
              filtrados no Cadastro Ambiental Rural de MG.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-2 border border-border text-xs font-medium text-text">
              <Layers className="w-3.5 h-3.5 text-primary" />
              14 Polos IEF Mapeados
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {/* Barra 1: Por Status */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-text">Estágio de Tramitação:</span>
              <span className="text-text-soft font-tabular">
                {agregados.totalItens > 0
                  ? `${Math.round(((agregados.statusDist.emAnalise + agregados.statusDist.pendencias) / agregados.totalItens) * 100)}% aguardando regularização`
                  : "0%"}
              </span>
            </div>
            <div
              className="flex h-7 w-full overflow-hidden rounded-lg bg-surface-2 border border-border/80"
              role="img"
              aria-label={`Distribuição de status: ${agregados.statusDist.emAnalise} em análise, ${agregados.statusDist.pendencias} com pendências, ${agregados.statusDist.aprovado} aprovados, ${agregados.statusDist.cancelado} cancelados`}
            >
              {agregados.totalItens > 0 ? (
                <>
                  <div
                    style={{
                      width: `${(agregados.statusDist.emAnalise / agregados.totalItens) * 100}%`,
                    }}
                    title={`Em Análise: ${agregados.statusDist.emAnalise}`}
                    className="flex items-center justify-center bg-amber-500 text-[11px] font-bold text-amber-950 transition-all"
                  >
                    {agregados.statusDist.emAnalise > 0 ? `${agregados.statusDist.emAnalise}` : ""}
                  </div>
                  <div
                    style={{
                      width: `${(agregados.statusDist.pendencias / agregados.totalItens) * 100}%`,
                    }}
                    title={`Pendências: ${agregados.statusDist.pendencias}`}
                    className="flex items-center justify-center bg-orange-500 text-[11px] font-bold text-white transition-all"
                  >
                    {agregados.statusDist.pendencias > 0
                      ? `${agregados.statusDist.pendencias}`
                      : ""}
                  </div>
                  <div
                    style={{
                      width: `${(agregados.statusDist.aprovado / agregados.totalItens) * 100}%`,
                    }}
                    title={`Aprovado: ${agregados.statusDist.aprovado}`}
                    className="flex items-center justify-center bg-emerald-600 text-[11px] font-bold text-white transition-all"
                  >
                    {agregados.statusDist.aprovado > 0 ? `${agregados.statusDist.aprovado}` : ""}
                  </div>
                  <div
                    style={{
                      width: `${(agregados.statusDist.cancelado / agregados.totalItens) * 100}%`,
                    }}
                    title={`Cancelado: ${agregados.statusDist.cancelado}`}
                    className="flex items-center justify-center bg-zinc-500 text-[11px] font-bold text-white transition-all"
                  >
                    {agregados.statusDist.cancelado > 0
                      ? `${agregados.statusDist.cancelado}`
                      : ""}
                  </div>
                </>
              ) : (
                <div className="w-full flex items-center justify-center text-xs text-text-soft">
                  Sem dados
                </div>
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-soft">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                Em Análise ({agregados.statusDist.emAnalise})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                Pendências ({agregados.statusDist.pendencias})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                Aprovado ({agregados.statusDist.aprovado})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-500 inline-block" />
                Cancelado ({agregados.statusDist.cancelado})
              </span>
            </div>
          </div>

          {/* Barra 2: Por Porte */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-text">Proporção por Porte do Imóvel:</span>
              <span className="text-text-soft font-tabular">
                {agregados.totalItens > 0
                  ? `${Math.round((agregados.porteDist.pequeno / agregados.totalItens) * 100)}% Pequenos (agricultura familiar/≤4 MF)`
                  : "0%"}
              </span>
            </div>
            <div
              className="flex h-7 w-full overflow-hidden rounded-lg bg-surface-2 border border-border/80"
              role="img"
              aria-label={`Distribuição de porte: ${agregados.porteDist.pequeno} pequenos, ${agregados.porteDist.medio} médios, ${agregados.porteDist.grande} grandes`}
            >
              {agregados.totalItens > 0 ? (
                <>
                  <div
                    style={{
                      width: `${(agregados.porteDist.pequeno / agregados.totalItens) * 100}%`,
                    }}
                    title={`Pequeno: ${agregados.porteDist.pequeno}`}
                    className="flex items-center justify-center bg-blue-600 text-[11px] font-bold text-white transition-all"
                  >
                    {agregados.porteDist.pequeno > 0 ? `${agregados.porteDist.pequeno}` : ""}
                  </div>
                  <div
                    style={{
                      width: `${(agregados.porteDist.medio / agregados.totalItens) * 100}%`,
                    }}
                    title={`Médio: ${agregados.porteDist.medio}`}
                    className="flex items-center justify-center bg-indigo-600 text-[11px] font-bold text-white transition-all"
                  >
                    {agregados.porteDist.medio > 0 ? `${agregados.porteDist.medio}` : ""}
                  </div>
                  <div
                    style={{
                      width: `${(agregados.porteDist.grande / agregados.totalItens) * 100}%`,
                    }}
                    title={`Grande: ${agregados.porteDist.grande}`}
                    className="flex items-center justify-center bg-amber-700 text-[11px] font-bold text-white transition-all"
                  >
                    {agregados.porteDist.grande > 0 ? `${agregados.porteDist.grande}` : ""}
                  </div>
                </>
              ) : (
                <div className="w-full flex items-center justify-center text-xs text-text-soft">
                  Sem dados
                </div>
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-soft">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                Pequeno ≤4 MF ({agregados.porteDist.pequeno})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                Médio 4-15 MF ({agregados.porteDist.medio})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-700 inline-block" />
                Grande &gt;15 MF ({agregados.porteDist.grande})
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 2. CARTÕES DE TOPO: INDICADORES AGREGADOS ═══ */}
      <section
        aria-label="Indicadores agregados do CAR"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
      >
        {/* Card 1: Total de Imóveis */}
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-text-soft">
            <span className="font-medium uppercase tracking-wide">Imóveis no Recorte</span>
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold tracking-tight text-text">
            {formatNumberBR(agregados.totalItens)}
          </p>
          <p className="mt-1 text-xs text-text-soft">
            de {formatNumberBR(registros.length)} cadastros mapeados
          </p>
        </div>

        {/* Card 2: Tempo Médio de Análise (EM DESTAQUE) */}
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/20 p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
            <span className="font-semibold uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              Tempo Médio em Análise
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-900 dark:text-amber-200">
              Gargalo IEF
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="font-display text-2xl font-bold text-amber-900 dark:text-amber-100 font-tabular">
              {formatNumberBR(agregados.tempoMedioDias)}{" "}
              <span className="text-base font-normal text-amber-800 dark:text-amber-300">dias</span>
            </p>
          </div>
          <p className="mt-1 text-xs font-medium text-amber-800 dark:text-amber-300">
            ≈ <strong className="underline decoration-amber-500">{agregados.tempoMedioMeses} meses</strong> de espera
          </p>
        </div>

        {/* Card 3: Área Total Declarada */}
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-text-soft">
            <span className="font-medium uppercase tracking-wide">Área Total Mapeada</span>
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold tracking-tight text-text font-tabular">
            {formatNumberBR(Math.round(agregados.somaArea))}{" "}
            <span className="text-base font-normal text-text-soft">ha</span>
          </p>
          <p className="mt-1 text-xs text-text-soft font-tabular">
            {agregados.somaModulos.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} Módulos Fiscais (MF)
          </p>
        </div>

        {/* Card 4: Taxa de Pendências e Análise */}
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-text-soft">
            <span className="font-medium uppercase tracking-wide">Passivo em Aberto</span>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold tracking-tight text-text font-tabular">
            {agregados.totalItens > 0
              ? `${Math.round(((agregados.statusDist.emAnalise + agregados.statusDist.pendencias) / agregados.totalItens) * 100)}%`
              : "0%"}
          </p>
          <p className="mt-1 text-xs text-text-soft">
            {formatNumberBR(agregados.statusDist.emAnalise + agregados.statusDist.pendencias)} imóveis sem aprovação final
          </p>
        </div>
      </section>

      {/* ═══ 3 e 4. CONTROLES: FILTROS COMBINÁVEIS E EXPORTAÇÃO CSV ═══ */}
      <section
        aria-label="Filtros da tabela do CAR"
        className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-text">Filtros Combináveis do Acervo</h3>
          </div>
          <div className="flex items-center gap-2">
            {temFiltroAtivo && (
              <button
                type="button"
                onClick={limparFiltros}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text hover:bg-surface-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpar filtros
              </button>
            )}
            {/* BOTÃO EXPORTAR CSV FILTRADO */}
            <button
              type="button"
              onClick={exportarFiltrados}
              disabled={filtradosEOrdenados.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-ink text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 shadow-sm"
              title="Download dos registros filtrados com separador ';' e BOM UTF-8 para Excel"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar Planilha CSV ({formatNumberBR(filtradosEOrdenados.length)})
            </button>
          </div>
        </div>

        {/* Grade de Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Busca textual */}
          <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-1">
            <label htmlFor={buscaId} className="block text-xs font-medium text-text-soft mb-1">
              Buscar texto
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-soft/60" />
              <input
                id={buscaId}
                type="search"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPaginaAtual(1);
                }}
                placeholder="Imóvel, código ou cidade..."
                className="w-full rounded-lg border border-border bg-surface py-1.5 pl-8 pr-3 text-xs text-text placeholder:text-text-soft/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* URFBio / Polo Regional */}
          <div>
            <label htmlFor={urfbioId} className="block text-xs font-medium text-text-soft mb-1">
              URFBio / Polo Regional
            </label>
            <select
              id={urfbioId}
              value={filtroUrfbio}
              onChange={(e) => {
                setFiltroUrfbio(e.target.value);
                setPaginaAtual(1);
              }}
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="todos">Todas as 14 Regionais</option>
              {urfbios.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Porte do Imóvel */}
          <div>
            <label htmlFor={porteId} className="block text-xs font-medium text-text-soft mb-1">
              Porte do Imóvel
            </label>
            <select
              id={porteId}
              value={filtroPorte}
              onChange={(e) => {
                setFiltroPorte(e.target.value);
                setPaginaAtual(1);
              }}
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {PORTES_OPCOES.map((p) => (
                <option key={p.valor} value={p.valor}>
                  {p.rotulo}
                </option>
              ))}
            </select>
          </div>

          {/* Setor de Atividade */}
          <div>
            <label htmlFor={setorId} className="block text-xs font-medium text-text-soft mb-1">
              Setor de Atividade
            </label>
            <select
              id={setorId}
              value={filtroSetor}
              onChange={(e) => {
                setFiltroSetor(e.target.value);
                setPaginaAtual(1);
              }}
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {SETORES_OPCOES.map((s) => (
                <option key={s.valor} value={s.valor}>
                  {s.rotulo}
                </option>
              ))}
            </select>
          </div>

          {/* Status no IEF / CAR */}
          <div>
            <label htmlFor={statusId} className="block text-xs font-medium text-text-soft mb-1">
              Status da Análise
            </label>
            <select
              id={statusId}
              value={filtroStatus}
              onChange={(e) => {
                setFiltroStatus(e.target.value);
                setPaginaAtual(1);
              }}
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {STATUS_OPCOES.map((st) => (
                <option key={st.valor} value={st.valor}>
                  {st.rotulo}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Rodapé dos Filtros: contador e seleção de paginação */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-text-soft">
          <p role="status">
            Exibindo{" "}
            <strong className="text-text font-tabular">
              {filtradosEOrdenados.length > 0
                ? (paginaCorrigida - 1) * itensPorPagina + 1
                : 0}
            </strong>{" "}
            a{" "}
            <strong className="text-text font-tabular">
              {Math.min(paginaCorrigida * itensPorPagina, filtradosEOrdenados.length)}
            </strong>{" "}
            de{" "}
            <strong className="text-text font-tabular">
              {formatNumberBR(filtradosEOrdenados.length)}
            </strong>{" "}
            cadastros encontrados
          </p>

          <div className="flex items-center gap-2">
            <label htmlFor={itensPorPaginaId} className="text-text-soft">
              Registros por página:
            </label>
            <select
              id={itensPorPaginaId}
              value={itensPorPagina}
              onChange={(e) => {
                setItensPorPagina(Number(e.target.value) as 25 | 50);
                setPaginaAtual(1);
              }}
              className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-text focus:border-primary focus:outline-none"
            >
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
            </select>
          </div>
        </div>
      </section>

      {/* ═══ 5. TABELA DE DADOS COM ORDENAÇÃO E LINKS DIRETOS ═══ */}
      {filtradosEOrdenados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <HelpCircle className="mx-auto h-10 w-10 text-text-soft/40" />
          <h3 className="mt-3 font-display text-base font-semibold text-text">
            Nenhum imóvel rural encontrado
          </h3>
          <p className="mt-1.5 text-xs text-text-soft max-w-md mx-auto">
            Não foram localizados registros com a combinação atual de filtros. Tente flexibilizar os
            termos de busca ou a regional selecionada.
          </p>
          <button
            type="button"
            onClick={limparFiltros}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-2 border border-border text-xs font-semibold text-text hover:bg-border/30 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar todos os filtros
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-2 border-b border-border">
                <tr>
                  <th scope="col" className="px-3.5 py-3 font-semibold text-text-soft uppercase tracking-wider">
                    Imóvel / Código CAR
                  </th>
                  {renderCabecalhoOrdenavel("municipio", "Município / Polo")}
                  {renderCabecalhoOrdenavel("modulosFiscais", "Porte (MF)", "center")}
                  {renderCabecalhoOrdenavel("areaHa", "Área (ha)", "right")}
                  {renderCabecalhoOrdenavel("tempoAnaliseDias", "Tempo Análise", "right")}
                  {renderCabecalhoOrdenavel("dataCadastro", "Data Cadastro")}
                  {renderCabecalhoOrdenavel("status", "Status", "center")}
                  <th scope="col" className="px-3.5 py-3 font-semibold text-text-soft uppercase tracking-wider text-center">
                    Consultas Oficiais
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-text">
                {itensExibidos.map((r) => {
                  const urlSicar =
                    r.linkConsultaSicar ??
                    `https://consultapublica.car.gov.br/publico/imoveis/consulta`;
                  const urlCar20 =
                    r.linkConsultaCar20 ??
                    `https://csr.ufmg.br/car20_mg/consultar-car/`;

                  const mesesCalculados = Math.round(r.tempoAnaliseDias / 30.417);

                  return (
                    <tr
                      key={r.codigoCar}
                      className="hover:bg-surface-2/60 transition-colors group"
                    >
                      {/* Coluna 1: Imóvel e Código */}
                      <td className="px-3.5 py-3 align-top max-w-[280px]">
                        <div className="font-semibold text-sm text-text leading-snug group-hover:text-primary transition-colors">
                          {r.nomeImovel}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-text-soft font-tabular">
                          <span className="truncate max-w-[190px]" title={r.codigoCar}>
                            {r.codigoCar}
                          </span>
                          <button
                            type="button"
                            onClick={() => copiarCodigoCar(r.codigoCar)}
                            title="Copiar código CAR completo"
                            className="p-1 hover:text-text rounded hover:bg-surface transition-colors"
                            aria-label={`Copiar código CAR de ${r.nomeImovel}`}
                          >
                            {copiadoId === r.codigoCar ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-60 hover:opacity-100" />
                            )}
                          </button>
                        </div>
                        <div className="mt-1 inline-flex items-center gap-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 border border-border text-text-soft">
                            {r.setor}
                          </span>
                        </div>
                      </td>

                      {/* Coluna 2: Município e URFBio */}
                      <td className="px-3.5 py-3 align-top">
                        <div className="font-medium text-text">{r.municipio}</div>
                        <div className="text-[11px] text-text-soft mt-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/70 inline-block" />
                          {r.urfbio}
                        </div>
                      </td>

                      {/* Coluna 3: Porte e Módulos Fiscais */}
                      <td className="px-3.5 py-3 align-top text-center">
                        <div>{renderPorteBadge(r.porte, r.modulosFiscais)}</div>
                        <div className="mt-1 font-tabular text-[11px] text-text-soft">
                          {r.modulosFiscais.toLocaleString("pt-BR", {
                            maximumFractionDigits: 1,
                          })}{" "}
                          MF
                        </div>
                      </td>

                      {/* Coluna 4: Área (ha) */}
                      <td className="px-3.5 py-3 align-top text-right font-tabular">
                        <span className="font-semibold text-text">
                          {formatNumberBR(Math.round(r.areaHa))}
                        </span>
                        <span className="text-[11px] text-text-soft ml-1">ha</span>
                      </td>

                      {/* Coluna 5: Tempo em Análise (dias + meses) */}
                      <td className="px-3.5 py-3 align-top text-right">
                        <div className="font-semibold font-tabular text-text">
                          {formatNumberBR(r.tempoAnaliseDias)}{" "}
                          <span className="text-[11px] font-normal text-text-soft">dias</span>
                        </div>
                        <div
                          className={`text-[11px] font-medium font-tabular mt-0.5 ${
                            r.tempoAnaliseDias > 730
                              ? "text-amber-800 dark:text-amber-300 font-bold"
                              : "text-text-soft"
                          }`}
                        >
                          ≈ {mesesCalculados} meses
                        </div>
                      </td>

                      {/* Coluna 6: Data de Cadastro */}
                      <td className="px-3.5 py-3 align-top font-tabular text-text-soft">
                        {formatDateBR(r.dataCadastro)}
                      </td>

                      {/* Coluna 7: Status */}
                      <td className="px-3.5 py-3 align-top text-center">
                        {renderStatusBadge(r.status)}
                      </td>

                      {/* Coluna 8: Links Oficiais de Consulta */}
                      <td className="px-3.5 py-3 align-top text-center">
                        <div className="inline-flex flex-col gap-1.5 items-stretch">
                          <a
                            href={urlSicar}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded border border-border bg-surface-2 hover:bg-border/40 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                            title="Consulta oficial do imóvel no SICAR Federal"
                          >
                            <span>SICAR</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <a
                            href={urlCar20}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded border border-border bg-surface-2 hover:bg-border/40 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 hover:opacity-80 transition-colors"
                            title="Consulta na plataforma CAR 2.0 MG (CSR / UFMG)"
                          >
                            <span>CAR 2.0</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-2/40 px-4 py-3 text-xs">
              <div className="text-text-soft">
                Página <strong className="text-text font-tabular">{paginaCorrigida}</strong> de{" "}
                <strong className="text-text font-tabular">{totalPaginas}</strong>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                  disabled={paginaCorrigida <= 1}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-border bg-surface text-text hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>

                {/* Botões de Página Rápidos */}
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                    .filter((pag) => {
                      if (totalPaginas <= 7) return true;
                      return (
                        pag === 1 ||
                        pag === totalPaginas ||
                        Math.abs(pag - paginaCorrigida) <= 1
                      );
                    })
                    .map((pag, idx, arr) => {
                      const anterior = arr[idx - 1];
                      const temSalto = anterior && pag - anterior > 1;

                      return (
                        <div key={pag} className="flex items-center">
                          {temSalto && (
                            <span className="px-1 text-text-soft select-none">...</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setPaginaAtual(pag)}
                            aria-current={paginaCorrigida === pag ? "page" : undefined}
                            className={`min-w-[28px] h-7 px-1.5 rounded font-tabular text-xs transition-colors ${
                              paginaCorrigida === pag
                                ? "bg-primary text-primary-ink font-bold shadow-sm"
                                : "text-text hover:bg-surface-2"
                            }`}
                          >
                            {pag}
                          </button>
                        </div>
                      );
                    })}
                </div>

                <button
                  type="button"
                  onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaCorrigida >= totalPaginas}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-border bg-surface text-text hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Próxima página"
                >
                  <span>Próxima</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
