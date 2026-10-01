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
 * - CLIENT-SAFE: este módulo NÃO pode importar `node:fs` — o componente de
 *   cliente `PainelExecutivosClient.tsx` importa os tipos e constantes daqui, e
 *   `node:fs` num bundle de navegador derruba o build com UnhandledSchemeError
 *   (medido 01/10/2026: deploy 79af0f44 no Guara). A leitura do arquivo
 *   `executivos-conselhos.compact.json` (esqueleto + rótulos internados) mora
 *   em `lib/server-only/dados-executivos.ts`.
 */

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
