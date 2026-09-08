/**
 * apps/web/lib/judiciario/contatos.ts
 *
 * Módulo de consulta e agregação do catálogo nacional de contatos judiciários
 * (Varas, Gabinetes e Secretarias dos Tribunais).
 */

import dadosBrutos from "@/data/judiciario-unidades-contatos.json";
import type {
  UnidadeJudiciaria,
  ResumoEstatisticasContatos,
  RamoJustica,
  TipoUnidade,
} from "./contatos-tipos";

const UNIDADES: UnidadeJudiciaria[] = dadosBrutos as UnidadeJudiciaria[];

/**
 * Retorna todas as unidades judiciárias catalogadas.
 */
export function obterTodasUnidadesJudiciarias(): UnidadeJudiciaria[] {
  return UNIDADES;
}

/**
 * Obtém estatísticas agregadas do catálogo para os cartões de topo e gráficos.
 */
export function obterEstatisticasContatos(): ResumoEstatisticasContatos {
  const comarcas = new Set<string>();
  const ufs = new Set<string>();
  let varas = 0;
  let gabinetes = 0;
  let secretarias = 0;
  let balcoes = 0;
  let estadual = 0;
  let federal = 0;
  let trabalho = 0;

  for (const u of UNIDADES) {
    comarcas.add(`${u.comarcaOuSubsecao}-${u.uf}`);
    ufs.add(u.uf);

    if (u.tipo === "Vara" || u.tipo === "Juizado Especial") varas++;
    else if (u.tipo === "Gabinete") gabinetes++;
    else secretarias++;

    if (u.linkBalcaoVirtual) balcoes++;

    if (u.ramo === "Estadual") estadual++;
    else if (u.ramo === "Federal") federal++;
    else if (u.ramo === "Trabalho") trabalho++;
  }

  return {
    totalUnidades: UNIDADES.length,
    totalVaras: varas,
    totalGabinetes: gabinetes,
    totalSecretarias: secretarias,
    totalComarcas: comarcas.size,
    ufsAtendidas: ufs.size,
    totalBalcoesVirtuais: balcoes,
    porRamo: {
      estadual,
      federal,
      trabalho,
    },
  };
}

/**
 * Filtra unidades por tribunal (ex: "tjmg", "trf6", "trt3", "tjsp").
 */
export function listarUnidadesPorTribunal(sigla: string): UnidadeJudiciaria[] {
  const s = sigla.toLowerCase().trim();
  return UNIDADES.filter((u) => u.tribunalSigla.toLowerCase() === s);
}

/**
 * Filtra unidades por UF.
 */
export function listarUnidadesPorUf(uf: string): UnidadeJudiciaria[] {
  const ufs = uf.toUpperCase().trim();
  return UNIDADES.filter((u) => u.uf.toUpperCase() === ufs);
}

/**
 * Filtra unidades por ramo da justiça.
 */
export function listarUnidadesPorRamo(ramo: RamoJustica): UnidadeJudiciaria[] {
  return UNIDADES.filter((u) => u.ramo === ramo);
}

/**
 * Filtra unidades por comarca / cidade.
 */
export function listarUnidadesPorComarca(comarca: string): UnidadeJudiciaria[] {
  const c = comarca.toLowerCase().trim();
  return UNIDADES.filter((u) => u.comarcaOuSubsecao.toLowerCase().includes(c));
}

/**
 * Busca textual rápida em múltiplas dimensões.
 */
export function buscarUnidadesJudiciarias(termo: string): UnidadeJudiciaria[] {
  const t = termo.toLowerCase().trim();
  if (!t) return UNIDADES;

  return UNIDADES.filter(
    (u) =>
      u.nome.toLowerCase().includes(t) ||
      u.comarcaOuSubsecao.toLowerCase().includes(t) ||
      u.coordenador.nome.toLowerCase().includes(t) ||
      u.email.toLowerCase().includes(t) ||
      u.telefone.includes(t) ||
      u.uf.toLowerCase() === t
  );
}
