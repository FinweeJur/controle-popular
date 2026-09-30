/**
 * @file scripts/etl/internacional/gerar-camada-operacoes-militares-globo.mts
 * @description ETL gerador da camada GeoJSON de operacoes militares, conflitos e PMCs para o Globo 3D Terras.
 *
 * Papel no portal:
 * 1. Le os 48 registros geolocalizados de operacoes militares e teatros de conflito
 *    do acervo compacto apps/web/data/internacional/operacoes-militares.compact.json.
 * 2. Converte os pontos para GeoJSON WGS84 compativel com o motor 3D Three.js do Globo Terras.
 * 3. Grava o arquivo oficial em apps/web/public/terras/globo/dados/camadas/operacoes-militares-conflitos.geojson.
 *
 * Fontes oficiais consultadas:
 * - Congressional Research Service (CRS Report R42738 - Instances of Use of US Armed Forces Abroad)
 * - Conselho de Seguranca da ONU (Relatorios e Resolucoes)
 * - SIPRI Arms Transfers Database (Estocolmo)
 * - US Department of Defense (DoD) e Special Inspector General (SIGIR/SIGAR)
 * - Corte Internacional de Justica (CIJ em Haia)
 *
 * Conformidade e seguranca:
 * - Zero dados pessoais / sem CPFs (AGENTS.md §5.2).
 * - Coordenadas precisas em datum WGS84 [longitude, latitude].
 * - Textos e microresumos em oracoes diretas de ate 13 palavras (AGENTS.md §12).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expandir, type TabelaCompacta } from "../../../apps/web/lib/estatico/compactar.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const COMPACT_JSON_PATH = path.join(
  RAIZ,
  "apps",
  "web",
  "data",
  "internacional",
  "operacoes-militares.compact.json"
);
const GEOJSON_DESTINO = path.join(
  RAIZ,
  "apps",
  "web",
  "public",
  "terras",
  "globo",
  "dados",
  "camadas",
  "operacoes-militares-conflitos.geojson"
);

interface OperacaoRaw {
  id: string;
  codinome: string;
  titulo: string;
  resumo: string;
  tipoOperacao: string;
  anoInicio: number;
  anoFim: number | null;
  duracaoEstimada: string;
  paisesPatrocinadores: string[];
  orgaosForcasEnvolvidas: string[];
  pmcsEnvolvidas: string[];
  principaisContratadasDefesa: string[];
  paisTeatro: string;
  continenteTeatro: string;
  localidadeFoco: string;
  latitude: number;
  longitude: number;
  baixasEstimadas: string;
  custoFinanceiroEstimado: string;
  desfechoSoberania: string;
  conexaoBrasilOuAmericaLatina: string;
  fonteOficialNome: string;
  urlFonteOficial: string;
  urlDocumentoOriginalPdf: string;
  identificadorOficialDoc: string;
  assuntos: string[];
}

function rotuloTipo(tipo: string): string {
  switch (tipo) {
    case "intervencao_militar_direta":
      return "Intervenção Militar Direta";
    case "deposicao_regime_golpe":
      return "Deposição de Regime / Golpe";
    case "pmc_milicia_privada":
      return "PMC / Segurança Militar Privada";
    case "guerra_proxy_apoio_rebelde":
      return "Guerra por Procuração (Proxy)";
    case "contrato_defesa_armamento":
      return "Mega-Contrato de Defesa";
    case "operacao_paz_mandato_onu":
      return "Missão de Paz (Mandato ONU)";
    default:
      return tipo;
  }
}

export function gerarCamadaOperacoesMilitaresGlobo(): void {
  const compactContent = JSON.parse(fs.readFileSync(COMPACT_JSON_PATH, "utf-8")) as TabelaCompacta;
  const operacoes = expandir(compactContent) as unknown as OperacaoRaw[];

  const contagemTipos: Record<string, number> = {};

  const features = operacoes.map((op) => {
    contagemTipos[op.tipoOperacao] = (contagemTipos[op.tipoOperacao] || 0) + 1;

    const nomeFormatado = op.codinome ? `${op.codinome} — ${op.titulo}` : op.titulo;
    const periodo = op.anoFim ? `${op.anoInicio}–${op.anoFim}` : `${op.anoInicio}`;

    return {
      type: "Feature",
      id: op.id,
      geometry: {
        type: "Point",
        coordinates: [op.longitude, op.latitude],
      },
      properties: {
        id: op.id,
        nome: nomeFormatado,
        titulo: op.titulo,
        codinome: op.codinome || "",
        tipo: op.tipoOperacao,
        tipoRotulo: rotuloTipo(op.tipoOperacao),
        anoInicio: op.anoInicio,
        anoFim: op.anoFim,
        periodo,
        duracaoEstimada: op.duracaoEstimada,
        paisTeatro: op.paisTeatro,
        continente: op.continenteTeatro,
        localidade: op.localidadeFoco,
        potencias: (op.paisesPatrocinadores || []).join(", "),
        pmcs: (op.pmcsEnvolvidas || []).join(", "),
        contratadas: (op.principaisContratadasDefesa || []).join(", "),
        resumo: op.resumo,
        baixasEstimadas: op.baixasEstimadas,
        custoFinanceiro: op.custoFinanceiroEstimado,
        desfechoSoberania: op.desfechoSoberania,
        conexaoBrasil: op.conexaoBrasilOuAmericaLatina,
        fonteOficial: op.fonteOficialNome,
        link_oficial: op.urlFonteOficial,
        link_acervo: `/internacional/operacoes-militares?id=${op.id}`,
        link_mapa: `/internacional/operacoes-militares/mapa?id=${op.id}`,
      },
    };
  });

  const geojson = {
    type: "FeatureCollection",
    metadata: {
      fonte:
        "Controle Popular — Observatório de Operações Militares, Conflitos e Corporações de Defesa",
      dataAtualizacao: "2026-09-30",
      totalFeicoes: features.length,
      distribuicaoTipos: contagemTipos,
      aviso:
        "Coordenadas oficiais WGS84 compiladas a partir de resoluções da ONU, relatórios do CRS, DoD, SIPRI e CIJ.",
    },
    features,
  };

  fs.mkdirSync(path.dirname(GEOJSON_DESTINO), { recursive: true });
  fs.writeFileSync(GEOJSON_DESTINO, JSON.stringify(geojson, null, 2), "utf-8");
  console.log(`[ETL Globo] Camada de Operações Militares gerada: ${features.length} feições.`);
  console.log(`[ETL Globo] Arquivo gravado em: ${GEOJSON_DESTINO}`);
}

// Execucao direta via CLI
if (process.argv[1] && process.argv[1].endsWith("gerar-camada-operacoes-militares-globo.mts")) {
  gerarCamadaOperacoesMilitaresGlobo();
}
