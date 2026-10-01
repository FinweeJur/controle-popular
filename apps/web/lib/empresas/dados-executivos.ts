/**
 * @file apps/web/lib/empresas/dados-executivos.ts
 * @description Módulo de acesso tipado aos dados de Diretores Estatutários, CEOs e Membros de Conselho
 * das principais corporações e fundos monitorados pelo Controle Popular.
 *
 * Papel no portal:
 * 1. Fornece dados consolidados para a página `/empresas/executivos` no Padrão das Seis Qualidades.
 * 2. Mapeia e expõe registros de governança corporativa, composição de conselhos de administração,
 *    diretorias executivas e comitês de auditoria regulatórios.
 * 3. Permite identificar e auditar "interlocking directorates" (diretorias e conselhos entrelaçados),
 *    onde os mesmos indivíduos ocupam cargos em múltiplas corporações ou fundos atuantes nos mesmos mercados.
 * 4. Serve de contexto cívico para o assistente virtual (RAG) responder sobre controle corporativo e influência.
 *
 * Fontes oficiais primárias:
 * - CVM (Comissão de Valores Mobiliários): Formulários de Referência (FRE Itens 8, 12 e 13) e IAN/DFP.
 * - SEC (Securities and Exchange Commission): Relatórios Form 20-F, Form 10-K e Proxy Statements (DEF 14A).
 * - SEDAR+ (Canadá): Circulars de Acionistas e Informações Anuais de Governança.
 * - Registros oficiais internacionais: Companies House (Reino Unido), CMVM (Portugal), BaFin (Alemanha).
 *
 * Conformidade e Restrições Técnicas:
 * - LGPD: Estritamente nomes de titulares de cargos públicos estatutários de alta governança.
 *   ZERO dados pessoais sensíveis ou de identificação civil (sem CPF, sem RG, sem endereços).
 * - Leitura e descompactação sob demanda do arquivo `executivos-conselhos.compact.json` via esqueleto + rótulos internados.
 * - Resolução transparente de caminhos para suportar execução tanto no servidor Next.js quanto na suíte Vitest e CLI.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expandir, type TabelaCompacta } from "@/lib/estatico/compactar";

export type TipoOrgao = "diretoria_executiva" | "conselho_administracao" | "comite_auditoria";

export interface RegistroExecutivo extends Record<string, unknown> {
  id: string;
  nomePessoa: string;
  cargoFuncao: string;
  empresaId: string;
  empresaNome: string;
  tipoOrgao: TipoOrgao;
  dataPosse: string;
  dataTerminoMandato: string;
  remuneracaoDeclaradaAno: string;
  interlockingIds: string[];
  fonteOficialNome: string;
  urlFonteOficial: string;
}

export const ROTULOS_ORGAOS: Record<TipoOrgao, string> = {
  diretoria_executiva: "Diretoria Executiva",
  conselho_administracao: "Conselho de Administração",
  comite_auditoria: "Comitê de Auditoria & Riscos",
};

/**
 * Agregados medidos e datados da cobertura de governança corporativa.
 * Padrão das Seis Qualidades: exibição direta nos cartões de topo sem reprocessamento em tempo de execução.
 */
export const COBERTURA_EXECUTIVOS = {
  totalRegistros: 143,
  totalEmpresas: 36,
  totalPessoas: 141,
  totalInterlocking: 13,
  orgaosDistribuicao: {
    diretoriaExecutiva: 73,
    conselhoAdministracao: 35,
    comiteAuditoria: 35,
  },
  dataAtualizacao: "2026-10-01",
  fontesReguladoras: ["CVM", "SEC", "SEDAR+", "Companies House", "CMVM", "BaFin", "AMF", "Oslo Børs", "CONSOB"],
};

/** Cache em memória para evitar releitura e reexpansão de disco no ciclo de vida do processo */
let CACHE_EXECUTIVOS: RegistroExecutivo[] | null = null;

/**
 * Localiza o arquivo de dados compactados considerando variações de CWD
 * entre execução do Next.js, suíte de testes Vitest e scripts na raiz.
 */
function resolverCaminhoDados(): string {
  const relativo = path.join("data", "empresas", "executivos-conselhos.compact.json");
  const candidatos = [
    path.join(process.cwd(), relativo),
    path.join(process.cwd(), "apps", "web", relativo),
  ];

  try {
    const dirModulo = path.dirname(fileURLToPath(import.meta.url));
    candidatos.push(path.resolve(dirModulo, "../../data/empresas/executivos-conselhos.compact.json"));
  } catch {
    // Caso import.meta.url não esteja disponível em ambientes específicos de bundle
  }

  for (const cand of candidatos) {
    if (fs.existsSync(cand)) {
      return cand;
    }
  }

  return candidatos[0];
}

/**
 * Retorna todos os executivos, conselheiros e membros de comitês de auditoria catalogados.
 *
 * @returns Lista completa e tipada de registros de governança corporativa.
 */
export function obterExecutivosConselhos(): RegistroExecutivo[] {
  if (CACHE_EXECUTIVOS) {
    return CACHE_EXECUTIVOS;
  }

  try {
    const caminho = resolverCaminhoDados();
    if (!fs.existsSync(caminho)) {
      return [];
    }

    const conteudoRaw = fs.readFileSync(caminho, "utf-8");
    const tabelaCompacta = JSON.parse(conteudoRaw) as TabelaCompacta;
    const itensExpandidos = expandir<RegistroExecutivo>(tabelaCompacta);

    CACHE_EXECUTIVOS = itensExpandidos;
    return CACHE_EXECUTIVOS;
  } catch (erro) {
    console.error("Falha ao carregar dados de executivos e conselhos:", erro);
    return [];
  }
}

/**
 * Filtra os membros de governança de uma empresa específica a partir do seu identificador/slug.
 *
 * @param empresaId - Slug canônico da empresa (ex.: 'vale', 'petrobras', 'samarco', 'bhp').
 * @returns Lista de executivos e conselheiros vinculados à corporação.
 */
export function obterExecutivosPorEmpresa(empresaId: string): RegistroExecutivo[] {
  const todos = obterExecutivosConselhos();
  const idNormalizado = empresaId.trim().toLowerCase();
  return todos.filter((item) => item.empresaId.toLowerCase() === idNormalizado);
}

/**
 * Retorna exclusivamente os executivos e conselheiros que possuem diretorias ou conselhos entrelaçados
 * (interlocking directorates) com outras corporações monitoradas.
 *
 * @returns Registros onde `interlockingIds` não está vazio.
 */
export function obterDiretoriasEntrelacadas(): RegistroExecutivo[] {
  const todos = obterExecutivosConselhos();
  return todos.filter((item) => Array.isArray(item.interlockingIds) && item.interlockingIds.length > 0);
}

/**
 * Busca um registro de executivo ou conselheiro pelo seu identificador único.
 *
 * @param id - Identificador único (ex.: 'exec-vale-gustavo-pimenta').
 * @returns O registro correspondente ou `undefined` se não for localizado.
 */
export function obterExecutivoPorId(id: string): RegistroExecutivo | undefined {
  const todos = obterExecutivosConselhos();
  return todos.find((item) => item.id === id);
}
