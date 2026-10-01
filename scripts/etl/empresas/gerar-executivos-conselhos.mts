/**
 * @file scripts/etl/empresas/gerar-executivos-conselhos.mts
 * @description Script ETL para mapeamento e consolidação de Diretores Estatutários, CEOs e Conselheiros
 * das principais empresas cadastradas no portal Controle Popular.
 *
 * Papel no portal:
 * 1. Mapeia a estrutura de liderança executiva, conselhos de administração e comitês de auditoria
 *    das maiores mineradoras, petroleiras, elétricas, siderúrgicas, tradings de commodities e gestoras
 *    de ativos atuantes no Brasil e no mundo.
 * 2. Identifica interlocking directorates (diretorias e conselhos entrelaçados), revelando teias de influência,
 *    conflitos de interesse potenciais e concentração de poder econômico entre empresas concorrentes ou parceiras
 *    (ex.: Vale e Samarco; BHP e Samarco; Petrobras e Braskem; ArcelorMittal e Aperam; BlackRock).
 * 3. Alimenta a rota pública `/empresas/executivos` e subsidia o assistente cívico inteligente do portal.
 *
 * Fontes oficiais primárias consultadas:
 * - CVM (Comissão de Valores Mobiliários): Formulários de Referência (FRE) itens 8, 12 e 13 e DFP/IAN.
 * - SEC (Securities and Exchange Commission): Relatórios anuais Form 20-F, Form 10-K e Proxy Statements (DEF 14A).
 * - SEDAR+ (Canadian Securities Administrators): Relatórios anuais e Management Information Circulars de mineradoras canadenses.
 * - Companies House (Reino Unido), Registres du Commerce (França/Suíça) e Bundesanzeiger (Alemanha).
 *
 * Restrições técnicas e conformidade LGPD:
 * - Estritamente cargos de relevância pública estatutária declarados perante órgãos reguladores oficiais.
 * - ZERO CPF, RG, títulos eleitorais, endereços residenciais ou dados privados.
 * - Compactação determinística via esqueleto + rótulos internados (`compactar.ts`) para versionamento eficiente no Git.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compactar, serializarCompacto } from "../../../apps/web/lib/estatico/compactar.ts";

export type TipoOrgao = "diretoria_executiva" | "conselho_administracao" | "comite_auditoria";

export interface RegistroExecutivo {
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

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const DATA_DIR = path.join(RAIZ, "apps", "web", "data", "empresas");
const ARQUIVO_SAIDA = path.join(DATA_DIR, "executivos-conselhos.compact.json");

/**
 * Base de dados curada de executivos, membros do conselho de administração e comitês de auditoria
 * das 36 corporações estratégicas mapeadas no Controle Popular.
 */
export const EXECUTIVOS_BASE: RegistroExecutivo[] = [
  // 1. Vale S.A.
  {
    id: "exec-vale-gustavo-pimenta",
    nomePessoa: "Gustavo Pimenta",
    cargoFuncao: "Diretor-Presidente (CEO)",
    empresaId: "vale",
    empresaNome: "Vale S.A.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2024-10-01",
    dataTerminoMandato: "2026-12-31",
    remuneracaoDeclaradaAno: "Divulgação agregada CVM FRE Item 13 (Teto Estatutário)",
    interlockingIds: ["samarco"],
    fonteOficialNome: "CVM / SEC Form 20-F",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },
  {
    id: "exec-vale-daniel-stieler",
    nomePessoa: "Daniel Stieler",
    cargoFuncao: "Presidente do Conselho de Administração",
    empresaId: "vale",
    empresaNome: "Vale S.A.",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2023-04-28",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Honorário fixo regulatório de conselho CVM",
    interlockingIds: [],
    fonteOficialNome: "CVM Formulário de Referência",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },
  {
    id: "exec-vale-marcelo-bacci",
    nomePessoa: "Marcelo Bacci",
    cargoFuncao: "Diretor Executivo de Finanças e Relações com Investidores (CFO)",
    empresaId: "vale",
    empresaNome: "Vale S.A.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2024-12-02",
    dataTerminoMandato: "2026-12-31",
    remuneracaoDeclaradaAno: "Divulgação agregada CVM FRE Item 13",
    interlockingIds: [],
    fonteOficialNome: "CVM / SEC Form 20-F",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },
  {
    id: "exec-vale-rachel-maia",
    nomePessoa: "Rachel de Oliveira Maia",
    cargoFuncao: "Conselheira Independente e Membro do Comitê de Auditoria",
    empresaId: "vale",
    empresaNome: "Vale S.A.",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2021-04-30",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Honorário regulamentado de conselho e comitê",
    interlockingIds: [],
    fonteOficialNome: "CVM Formulário de Referência",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },
  {
    id: "exec-vale-murilo-ferreira",
    nomePessoa: "Murilo Ferreira",
    cargoFuncao: "Membro do Conselho de Administração",
    empresaId: "vale",
    empresaNome: "Vale S.A.",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2021-04-30",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Honorário fixo regulatório de conselho CVM",
    interlockingIds: [],
    fonteOficialNome: "CVM Formulário de Referência",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },

  // 2. Petrobras
  {
    id: "exec-petrobras-magda-chambriard",
    nomePessoa: "Magda Chambriard",
    cargoFuncao: "Diretora-Presidente (CEO)",
    empresaId: "petrobras",
    empresaNome: "Petróleo Brasileiro S.A. - Petrobras",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2024-05-24",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Padrão estatal federal / CVM FRE Item 13",
    interlockingIds: ["braskem"],
    fonteOficialNome: "CVM / SEC Form 20-F",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },
  {
    id: "exec-petrobras-pietro-mendes",
    nomePessoa: "Pietro Adamo Sampaio Mendes",
    cargoFuncao: "Presidente do Conselho de Administração",
    empresaId: "petrobras",
    empresaNome: "Petróleo Brasileiro S.A. - Petrobras",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2023-04-27",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Honorário fixo regulamentar estatutário",
    interlockingIds: [],
    fonteOficialNome: "CVM Formulário de Referência",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },
  {
    id: "exec-petrobras-fernando-melgarejo",
    nomePessoa: "Fernando Melgarejo",
    cargoFuncao: "Diretor Executivo Financeiro e de Relações com Investidores (CFO)",
    empresaId: "petrobras",
    empresaNome: "Petróleo Brasileiro S.A. - Petrobras",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2024-07-08",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Divulgação agregada CVM FRE Item 13",
    interlockingIds: [],
    fonteOficialNome: "CVM Formulário de Referência",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },
  {
    id: "exec-petrobras-jeronimo-antunes",
    nomePessoa: "Jerônimo Antunes",
    cargoFuncao: "Coordenador do Comitê de Auditoria Estatutária",
    empresaId: "petrobras",
    empresaNome: "Petróleo Brasileiro S.A. - Petrobras",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2023-04-27",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Honorário regulamentado de comitê de auditoria",
    interlockingIds: [],
    fonteOficialNome: "CVM Formulário de Referência",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },

  // 3. Samarco Mineração S.A.
  {
    id: "exec-samarco-rodrigo-vilela",
    nomePessoa: "Rodrigo Vilela",
    cargoFuncao: "Diretor-Presidente (CEO)",
    empresaId: "samarco",
    empresaNome: "Samarco Mineração S.A.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2018-03-01",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Não declarada individualmente",
    interlockingIds: ["vale", "bhp"],
    fonteOficialNome: "CVM DFP / Demonstrações Financeiras",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },
  {
    id: "exec-samarco-mauro-neves",
    nomePessoa: "Mauro Neves",
    cargoFuncao: "Membro do Conselho de Administração (Indicação BHP)",
    empresaId: "samarco",
    empresaNome: "Samarco Mineração S.A.",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2022-06-15",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Não declarada individualmente",
    interlockingIds: ["bhp"],
    fonteOficialNome: "CVM DFP / Relatório da Administração",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },
  {
    id: "exec-samarco-reinaldo-brandao",
    nomePessoa: "Reinaldo Brandão",
    cargoFuncao: "Membro do Comitê de Auditoria e Riscos",
    empresaId: "samarco",
    empresaNome: "Samarco Mineração S.A.",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2021-09-01",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Não declarada individualmente",
    interlockingIds: [],
    fonteOficialNome: "CVM DFP / Relatório da Administração",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },

  // 4. BHP
  {
    id: "exec-bhp-mike-henry",
    nomePessoa: "Mike Henry",
    cargoFuncao: "Chief Executive Officer (CEO)",
    empresaId: "bhp",
    empresaNome: "BHP Group Limited",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2020-01-01",
    dataTerminoMandato: "2026-10-31",
    remuneracaoDeclaradaAno: "US$ 14,2 milhões (SEC Form 20-F / Remuneration Report)",
    interlockingIds: ["samarco"],
    fonteOficialNome: "SEC Form 20-F / ASIC",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000811809"
  },
  {
    id: "exec-bhp-ken-mackenzie",
    nomePessoa: "Ken MacKenzie",
    cargoFuncao: "Chair do Conselho de Administração",
    empresaId: "bhp",
    empresaNome: "BHP Group Limited",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2017-09-01",
    dataTerminoMandato: "2025-10-31",
    remuneracaoDeclaradaAno: "US$ 870 mil (Relatório Anual BHP)",
    interlockingIds: [],
    fonteOficialNome: "SEC Form 20-F / ASX",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000811809"
  },
  {
    id: "exec-bhp-vandita-pant",
    nomePessoa: "Vandita Pant",
    cargoFuncao: "Chief Financial Officer (CFO)",
    empresaId: "bhp",
    empresaNome: "BHP Group Limited",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2024-03-01",
    dataTerminoMandato: "2026-10-31",
    remuneracaoDeclaradaAno: "Relatório Anual Estatutário de Remuneração",
    interlockingIds: [],
    fonteOficialNome: "SEC Form 20-F",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000811809"
  },
  {
    id: "exec-bhp-xiaoqun-clever",
    nomePessoa: "Xiaoqun Clever",
    cargoFuncao: "Presidente do Comitê de Auditoria e Riscos",
    empresaId: "bhp",
    empresaNome: "BHP Group Limited",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2020-10-01",
    dataTerminoMandato: "2025-10-31",
    remuneracaoDeclaradaAno: "Honorário estatutário de comitê de auditoria",
    interlockingIds: [],
    fonteOficialNome: "SEC Form 20-F",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000811809"
  },

  // 5. Rio Tinto
  {
    id: "exec-rio-jakob-stausholm",
    nomePessoa: "Jakob Stausholm",
    cargoFuncao: "Chief Executive Officer (CEO)",
    empresaId: "rio-tinto",
    empresaNome: "Rio Tinto plc",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2021-01-01",
    dataTerminoMandato: "2026-05-01",
    remuneracaoDeclaradaAno: "£ 6,8 milhões (Remuneration Report / SEC 20-F)",
    interlockingIds: [],
    fonteOficialNome: "SEC Form 20-F / Companies House",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000887028"
  },
  {
    id: "exec-rio-dominic-barton",
    nomePessoa: "Dominic Barton",
    cargoFuncao: "Presidente do Conselho de Administração (Chairman)",
    empresaId: "rio-tinto",
    empresaNome: "Rio Tinto plc",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2022-05-05",
    dataTerminoMandato: "2026-05-01",
    remuneracaoDeclaradaAno: "£ 1,2 milhão (Annual Report)",
    interlockingIds: [],
    fonteOficialNome: "SEC Form 20-F / LSE",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000887028"
  },
  {
    id: "exec-rio-peter-cunningham",
    nomePessoa: "Peter Cunningham",
    cargoFuncao: "Chief Financial Officer (CFO)",
    empresaId: "rio-tinto",
    empresaNome: "Rio Tinto plc",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2021-06-17",
    dataTerminoMandato: "2026-05-01",
    remuneracaoDeclaradaAno: "Relatório de Remuneração Executiva",
    interlockingIds: [],
    fonteOficialNome: "SEC Form 20-F",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000887028"
  },
  {
    id: "exec-rio-simon-mckeon",
    nomePessoa: "Simon McKeon",
    cargoFuncao: "Conselheiro e Membro do Comitê de Auditoria",
    empresaId: "rio-tinto",
    empresaNome: "Rio Tinto plc",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2019-01-01",
    dataTerminoMandato: "2025-05-01",
    remuneracaoDeclaradaAno: "Honorário fixo de comitê independente",
    interlockingIds: [],
    fonteOficialNome: "SEC Form 20-F",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000887028"
  },

  // 6. Anglo American
  {
    id: "exec-anglo-duncan-wanblad",
    nomePessoa: "Duncan Wanblad",
    cargoFuncao: "Chief Executive Officer (CEO)",
    empresaId: "anglo-american",
    empresaNome: "Anglo American plc",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2022-04-19",
    dataTerminoMandato: "2026-04-30",
    remuneracaoDeclaradaAno: "£ 4,1 milhões (Directors' Remuneration Report)",
    interlockingIds: [],
    fonteOficialNome: "Companies House / LSE",
    urlFonteOficial: "https://find-and-update.company-information.service.gov.uk/company/03564138"
  },
  {
    id: "exec-anglo-stuart-chambers",
    nomePessoa: "Stuart Chambers",
    cargoFuncao: "Chairman do Conselho de Administração",
    empresaId: "anglo-american",
    empresaNome: "Anglo American plc",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2017-11-01",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "£ 830 mil (UK Corporate Governance Code Report)",
    interlockingIds: [],
    fonteOficialNome: "Companies House",
    urlFonteOficial: "https://find-and-update.company-information.service.gov.uk/company/03564138"
  },
  {
    id: "exec-anglo-ana-sanches",
    nomePessoa: "Ana Sanches",
    cargoFuncao: "Presidente da Anglo American no Brasil (CEO Brasil)",
    empresaId: "anglo-american",
    empresaNome: "Anglo American plc",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2023-11-01",
    dataTerminoMandato: "2026-12-31",
    remuneracaoDeclaradaAno: "Não declarada individualmente",
    interlockingIds: [],
    fonteOficialNome: "Anglo American Relatório Anual Brasil",
    urlFonteOficial: "https://find-and-update.company-information.service.gov.uk/company/03564138"
  },
  {
    id: "exec-anglo-ian-tyler",
    nomePessoa: "Ian Tyler",
    cargoFuncao: "Presidente do Comitê de Auditoria",
    empresaId: "anglo-american",
    empresaNome: "Anglo American plc",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2022-01-01",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Honorário fixo de auditoria regulamentar",
    interlockingIds: [],
    fonteOficialNome: "Companies House / LSE",
    urlFonteOficial: "https://find-and-update.company-information.service.gov.uk/company/03564138"
  },

  // 7. Kinross Gold
  {
    id: "exec-kinross-paul-rollinson",
    nomePessoa: "J. Paul Rollinson",
    cargoFuncao: "Presidente e Chief Executive Officer (CEO)",
    empresaId: "kinross",
    empresaNome: "Kinross Gold Corporation",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2012-08-01",
    dataTerminoMandato: "2026-05-10",
    remuneracaoDeclaradaAno: "US$ 6,5 milhões (SEDAR+ / Circular de Governança)",
    interlockingIds: [],
    fonteOficialNome: "SEDAR+ / TSX / SEC",
    urlFonteOficial: "https://www.sedarplus.ca/"
  },
  {
    id: "exec-kinross-catherine-mcleod",
    nomePessoa: "Catherine McLeod-Seltzer",
    cargoFuncao: "Chair do Conselho de Administração",
    empresaId: "kinross",
    empresaNome: "Kinross Gold Corporation",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2019-05-08",
    dataTerminoMandato: "2025-05-10",
    remuneracaoDeclaradaAno: "US$ 450 mil (Relatório Anual de Governança)",
    interlockingIds: [],
    fonteOficialNome: "SEDAR+",
    urlFonteOficial: "https://www.sedarplus.ca/"
  },
  {
    id: "exec-kinross-andrea-freeborough",
    nomePessoa: "Andrea S. Freeborough",
    cargoFuncao: "Executive Vice President e CFO",
    empresaId: "kinross",
    empresaNome: "Kinross Gold Corporation",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2020-01-01",
    dataTerminoMandato: "2026-05-10",
    remuneracaoDeclaradaAno: "Relatório de Remuneração Executiva SEDAR+",
    interlockingIds: [],
    fonteOficialNome: "SEDAR+",
    urlFonteOficial: "https://www.sedarplus.ca/"
  },
  {
    id: "exec-kinross-david-etheridge",
    nomePessoa: "David Etheridge",
    cargoFuncao: "Presidente do Comitê de Auditoria",
    empresaId: "kinross",
    empresaNome: "Kinross Gold Corporation",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2017-05-10",
    dataTerminoMandato: "2025-05-10",
    remuneracaoDeclaradaAno: "Honorário fixo de comitê de auditoria",
    interlockingIds: [],
    fonteOficialNome: "SEDAR+",
    urlFonteOficial: "https://www.sedarplus.ca/"
  },

  // 8. Lundin Mining
  {
    id: "exec-lundin-jack-lundin",
    nomePessoa: "Jack Lundin",
    cargoFuncao: "Presidente e Chief Executive Officer (CEO)",
    empresaId: "lundin",
    empresaNome: "Lundin Mining Corporation",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2023-12-04",
    dataTerminoMandato: "2026-05-15",
    remuneracaoDeclaradaAno: "US$ 4,2 milhões (SEDAR+ / Circular de Acionistas)",
    interlockingIds: [],
    fonteOficialNome: "SEDAR+ / TSX",
    urlFonteOficial: "https://www.sedarplus.ca/"
  },
  {
    id: "exec-lundin-adam-lundin",
    nomePessoa: "Adam Lundin",
    cargoFuncao: "Chair do Conselho de Administração",
    empresaId: "lundin",
    empresaNome: "Lundin Mining Corporation",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2022-05-13",
    dataTerminoMandato: "2025-05-15",
    remuneracaoDeclaradaAno: "US$ 320 mil (SEDAR+)",
    interlockingIds: [],
    fonteOficialNome: "SEDAR+",
    urlFonteOficial: "https://www.sedarplus.ca/"
  },
  {
    id: "exec-lundin-teppo-pehkonen",
    nomePessoa: "Teppo Pehkonen",
    cargoFuncao: "Vice-Presidente Financeiro Interino (CFO)",
    empresaId: "lundin",
    empresaNome: "Lundin Mining Corporation",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2024-01-15",
    dataTerminoMandato: "2025-12-31",
    remuneracaoDeclaradaAno: "Não declarada individualmente",
    interlockingIds: [],
    fonteOficialNome: "SEDAR+",
    urlFonteOficial: "https://www.sedarplus.ca/"
  },
  {
    id: "exec-lundin-dale-peniuk",
    nomePessoa: "Dale C. Peniuk",
    cargoFuncao: "Presidente do Comitê de Auditoria",
    empresaId: "lundin",
    empresaNome: "Lundin Mining Corporation",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2006-11-01",
    dataTerminoMandato: "2025-05-15",
    remuneracaoDeclaradaAno: "Honorário fixo regulamentar de comitê",
    interlockingIds: [],
    fonteOficialNome: "SEDAR+",
    urlFonteOficial: "https://www.sedarplus.ca/"
  },

  // 9. Sigma Lithium
  {
    id: "exec-sigma-ana-cabral",
    nomePessoa: "Ana Cabral-Gardner",
    cargoFuncao: "Co-Chair e Chief Executive Officer (CEO)",
    empresaId: "sigma-lithium",
    empresaNome: "Sigma Lithium Corporation",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2021-01-15",
    dataTerminoMandato: "2026-06-30",
    remuneracaoDeclaradaAno: "SEC Form 20-F / Informação Circular de Governança",
    interlockingIds: [],
    fonteOficialNome: "SEC / SEDAR+",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0001865942"
  },
  {
    id: "exec-sigma-marcelo-paiva",
    nomePessoa: "Marcelo Paiva",
    cargoFuncao: "Conselheiro de Administração",
    empresaId: "sigma-lithium",
    empresaNome: "Sigma Lithium Corporation",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2020-09-01",
    dataTerminoMandato: "2025-06-30",
    remuneracaoDeclaradaAno: "Honorário fixo de conselho estatutário",
    interlockingIds: [],
    fonteOficialNome: "SEC Form 20-F",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0001865942"
  },
  {
    id: "exec-sigma-gary-litwack",
    nomePessoa: "Gary Litwack",
    cargoFuncao: "Presidente do Comitê de Auditoria",
    empresaId: "sigma-lithium",
    empresaNome: "Sigma Lithium Corporation",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2022-04-01",
    dataTerminoMandato: "2025-06-30",
    remuneracaoDeclaradaAno: "Honorário fixo de auditoria regulatória",
    interlockingIds: [],
    fonteOficialNome: "SEC / SEDAR+",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0001865942"
  },

  // 10. Belo Sun Mining
  {
    id: "exec-belosun-peter-tagliamonte",
    nomePessoa: "Peter Tagliamonte",
    cargoFuncao: "Presidente e Chief Executive Officer (CEO)",
    empresaId: "belo-sun",
    empresaNome: "Belo Sun Mining Corp.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2014-06-01",
    dataTerminoMandato: "2025-06-30",
    remuneracaoDeclaradaAno: "SEDAR+ Circular de Governança Corporativa",
    interlockingIds: [],
    fonteOficialNome: "SEDAR+ / TSX",
    urlFonteOficial: "https://www.sedarplus.ca/"
  },
  {
    id: "exec-belosun-mark-goodman",
    nomePessoa: "Mark Goodman",
    cargoFuncao: "Presidente do Conselho de Administração",
    empresaId: "belo-sun",
    empresaNome: "Belo Sun Mining Corp.",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2010-02-01",
    dataTerminoMandato: "2025-06-30",
    remuneracaoDeclaradaAno: "Honorário anual de conselho estatutário",
    interlockingIds: [],
    fonteOficialNome: "SEDAR+",
    urlFonteOficial: "https://www.sedarplus.ca/"
  },
  {
    id: "exec-belosun-ryan-ptolemy",
    nomePessoa: "Ryan Ptolemy",
    cargoFuncao: "Chief Financial Officer (CFO)",
    empresaId: "belo-sun",
    empresaNome: "Belo Sun Mining Corp.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2011-08-01",
    dataTerminoMandato: "2025-06-30",
    remuneracaoDeclaradaAno: "SEDAR+ Relatório Anual",
    interlockingIds: [],
    fonteOficialNome: "SEDAR+",
    urlFonteOficial: "https://www.sedarplus.ca/"
  },
  {
    id: "exec-belosun-carol-pierdominici",
    nomePessoa: "Carol Pierdominici",
    cargoFuncao: "Membro do Comitê de Auditoria",
    empresaId: "belo-sun",
    empresaNome: "Belo Sun Mining Corp.",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2016-05-01",
    dataTerminoMandato: "2025-06-30",
    remuneracaoDeclaradaAno: "Honorário fixo de auditoria independente",
    interlockingIds: [],
    fonteOficialNome: "SEDAR+",
    urlFonteOficial: "https://www.sedarplus.ca/"
  },

  // 11. Ero Copper
  {
    id: "exec-erocopper-david-strang",
    nomePessoa: "David Strang",
    cargoFuncao: "Co-Fundador e Chief Executive Officer (CEO)",
    empresaId: "ero-copper",
    empresaNome: "Ero Copper Corp.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2016-05-16",
    dataTerminoMandato: "2026-05-20",
    remuneracaoDeclaradaAno: "US$ 3,8 milhões (SEC Form 40-F / SEDAR+)",
    interlockingIds: [],
    fonteOficialNome: "SEC / SEDAR+",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0001859664"
  },
  {
    id: "exec-erocopper-noel-dunn",
    nomePessoa: "Christopher Noel Dunn",
    cargoFuncao: "Executive Chairman do Conselho de Administração",
    empresaId: "ero-copper",
    empresaNome: "Ero Copper Corp.",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2016-05-16",
    dataTerminoMandato: "2025-05-20",
    remuneracaoDeclaradaAno: "US$ 1,4 milhão (SEDAR+)",
    interlockingIds: [],
    fonteOficialNome: "SEDAR+ / TSX",
    urlFonteOficial: "https://www.sedarplus.ca/"
  },
  {
    id: "exec-erocopper-wayne-drier",
    nomePessoa: "Wayne Drier",
    cargoFuncao: "Chief Financial Officer (CFO)",
    empresaId: "ero-copper",
    empresaNome: "Ero Copper Corp.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2017-04-01",
    dataTerminoMandato: "2026-05-20",
    remuneracaoDeclaradaAno: "Relatório Anual de Remuneração Executiva",
    interlockingIds: [],
    fonteOficialNome: "SEC Form 40-F",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0001859664"
  },
  {
    id: "exec-erocopper-lyle-braaten",
    nomePessoa: "Lyle Braaten",
    cargoFuncao: "Presidente do Comitê de Auditoria",
    empresaId: "ero-copper",
    empresaNome: "Ero Copper Corp.",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2017-06-01",
    dataTerminoMandato: "2025-05-20",
    remuneracaoDeclaradaAno: "Honorário fixo de auditoria independente",
    interlockingIds: [],
    fonteOficialNome: "SEDAR+",
    urlFonteOficial: "https://www.sedarplus.ca/"
  },

  // 12. Equinox Gold
  {
    id: "exec-equinox-greg-smith",
    nomePessoa: "Greg Smith",
    cargoFuncao: "Presidente e Chief Executive Officer (CEO)",
    empresaId: "equinox",
    empresaNome: "Equinox Gold Corp.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2022-09-01",
    dataTerminoMandato: "2026-05-15",
    remuneracaoDeclaradaAno: "US$ 2,9 milhões (SEDAR+ / SEC Form 40-F)",
    interlockingIds: [],
    fonteOficialNome: "SEDAR+ / NYSE American",
    urlFonteOficial: "https://www.sedarplus.ca/"
  },
  {
    id: "exec-equinox-ross-beaty",
    nomePessoa: "Ross Beaty",
    cargoFuncao: "Chair do Conselho de Administração",
    empresaId: "equinox",
    empresaNome: "Equinox Gold Corp.",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2017-10-01",
    dataTerminoMandato: "2025-05-15",
    remuneracaoDeclaradaAno: "US$ 350 mil (Relatório Anual)",
    interlockingIds: [],
    fonteOficialNome: "SEDAR+",
    urlFonteOficial: "https://www.sedarplus.ca/"
  },
  {
    id: "exec-equinox-peter-hardie",
    nomePessoa: "Peter Hardie",
    cargoFuncao: "Chief Financial Officer (CFO)",
    empresaId: "equinox",
    empresaNome: "Equinox Gold Corp.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2017-12-01",
    dataTerminoMandato: "2026-05-15",
    remuneracaoDeclaradaAno: "Relatório de Remuneração Executiva SEDAR+",
    interlockingIds: [],
    fonteOficialNome: "SEDAR+",
    urlFonteOficial: "https://www.sedarplus.ca/"
  },
  {
    id: "exec-equinox-lenard-boggio",
    nomePessoa: "Lenard Boggio",
    cargoFuncao: "Presidente do Comitê de Auditoria",
    empresaId: "equinox",
    empresaNome: "Equinox Gold Corp.",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2018-01-01",
    dataTerminoMandato: "2025-05-15",
    remuneracaoDeclaradaAno: "Honorário fixo regulatório de comitê",
    interlockingIds: [],
    fonteOficialNome: "SEDAR+",
    urlFonteOficial: "https://www.sedarplus.ca/"
  },

  // 13. Glencore plc
  {
    id: "exec-glencore-gary-nagle",
    nomePessoa: "Gary Nagle",
    cargoFuncao: "Chief Executive Officer (CEO)",
    empresaId: "glencore",
    empresaNome: "Glencore plc",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2021-07-01",
    dataTerminoMandato: "2026-05-25",
    remuneracaoDeclaradaAno: "US$ 6,8 milhões (Glencore Annual Report)",
    interlockingIds: [],
    fonteOficialNome: "Companies House / LSE",
    urlFonteOficial: "https://find-and-update.company-information.service.gov.uk/company/FC030616"
  },
  {
    id: "exec-glencore-kalidas-madhavpeddi",
    nomePessoa: "Kalidas Madhavpeddi",
    cargoFuncao: "Chairman do Conselho de Administração",
    empresaId: "glencore",
    empresaNome: "Glencore plc",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2021-07-30",
    dataTerminoMandato: "2025-05-25",
    remuneracaoDeclaradaAno: "£ 950 mil (Relatório Anual)",
    interlockingIds: [],
    fonteOficialNome: "Companies House / LSE",
    urlFonteOficial: "https://find-and-update.company-information.service.gov.uk/company/FC030616"
  },
  {
    id: "exec-glencore-steven-kalmin",
    nomePessoa: "Steven Kalmin",
    cargoFuncao: "Chief Financial Officer (CFO)",
    empresaId: "glencore",
    empresaNome: "Glencore plc",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2005-09-01",
    dataTerminoMandato: "2026-05-25",
    remuneracaoDeclaradaAno: "Relatório de Remuneração Executiva",
    interlockingIds: [],
    fonteOficialNome: "Companies House",
    urlFonteOficial: "https://find-and-update.company-information.service.gov.uk/company/FC030616"
  },
  {
    id: "exec-glencore-martin-gilbert",
    nomePessoa: "Martin Gilbert",
    cargoFuncao: "Presidente do Comitê de Auditoria",
    empresaId: "glencore",
    empresaNome: "Glencore plc",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2020-05-01",
    dataTerminoMandato: "2025-05-25",
    remuneracaoDeclaradaAno: "Honorário fixo de auditoria estatutária",
    interlockingIds: [],
    fonteOficialNome: "Companies House",
    urlFonteOficial: "https://find-and-update.company-information.service.gov.uk/company/FC030616"
  },

  // 14. Trafigura Group
  {
    id: "exec-trafigura-jeremy-weir",
    nomePessoa: "Jeremy Weir",
    cargoFuncao: "Executive Chairman do Conselho de Administração",
    empresaId: "trafigura",
    empresaNome: "Trafigura Group Pte Ltd",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2014-04-01",
    dataTerminoMandato: "2025-12-31",
    remuneracaoDeclaradaAno: "Não declarada individualmente",
    interlockingIds: [],
    fonteOficialNome: "ACRA / Trafigura Financial Report",
    urlFonteOficial: "https://www.trafigura.com/financial-reports/"
  },
  {
    id: "exec-trafigura-richard-holtum",
    nomePessoa: "Richard Holtum",
    cargoFuncao: "Chief Executive Officer (CEO)",
    empresaId: "trafigura",
    empresaNome: "Trafigura Group Pte Ltd",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2025-01-01",
    dataTerminoMandato: "2027-12-31",
    remuneracaoDeclaradaAno: "Não declarada individualmente",
    interlockingIds: [],
    fonteOficialNome: "Trafigura Annual Report",
    urlFonteOficial: "https://www.trafigura.com/financial-reports/"
  },
  {
    id: "exec-trafigura-stephan-jansma",
    nomePessoa: "Stephan Jansma",
    cargoFuncao: "Chief Financial Officer (CFO)",
    empresaId: "trafigura",
    empresaNome: "Trafigura Group Pte Ltd",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2024-07-01",
    dataTerminoMandato: "2026-12-31",
    remuneracaoDeclaradaAno: "Não declarada individualmente",
    interlockingIds: [],
    fonteOficialNome: "Trafigura Annual Report",
    urlFonteOficial: "https://www.trafigura.com/financial-reports/"
  },
  {
    id: "exec-trafigura-sipko-schat",
    nomePessoa: "Sipko Schat",
    cargoFuncao: "Presidente do Comitê de Supervisão e Auditoria",
    empresaId: "trafigura",
    empresaNome: "Trafigura Group Pte Ltd",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2016-01-01",
    dataTerminoMandato: "2025-12-31",
    remuneracaoDeclaradaAno: "Honorário fixo de supervisão independente",
    interlockingIds: [],
    fonteOficialNome: "Trafigura Governance Statement",
    urlFonteOficial: "https://www.trafigura.com/financial-reports/"
  },

  // 15. Enel S.p.A.
  {
    id: "exec-enel-flavio-cattaneo",
    nomePessoa: "Flavio Cattaneo",
    cargoFuncao: "Chief Executive Officer e Diretor-Geral",
    empresaId: "enel",
    empresaNome: "Enel S.p.A.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2023-05-10",
    dataTerminoMandato: "2026-05-10",
    remuneracaoDeclaradaAno: "€ 4,5 milhões (CONSOB Relazione sulla Remunerazione)",
    interlockingIds: [],
    fonteOficialNome: "CONSOB / Borsa Italiana",
    urlFonteOficial: "https://www.consob.it/"
  },
  {
    id: "exec-enel-paolo-scaroni",
    nomePessoa: "Paolo Scaroni",
    cargoFuncao: "Presidente do Conselho de Administração",
    empresaId: "enel",
    empresaNome: "Enel S.p.A.",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2023-05-10",
    dataTerminoMandato: "2026-05-10",
    remuneracaoDeclaradaAno: "€ 600 mil (Relatório Anual de Governança)",
    interlockingIds: [],
    fonteOficialNome: "CONSOB",
    urlFonteOficial: "https://www.consob.it/"
  },
  {
    id: "exec-enel-stefano-angelis",
    nomePessoa: "Stefano De Angelis",
    cargoFuncao: "Chief Financial Officer (CFO)",
    empresaId: "enel",
    empresaNome: "Enel S.p.A.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2023-06-01",
    dataTerminoMandato: "2026-05-10",
    remuneracaoDeclaradaAno: "Divulgação agregada de diretoria estatutária",
    interlockingIds: [],
    fonteOficialNome: "CONSOB",
    urlFonteOficial: "https://www.consob.it/"
  },
  {
    id: "exec-enel-alessandra-stabilini",
    nomePessoa: "Alessandra Stabilini",
    cargoFuncao: "Presidente do Comitê de Riscos e Auditoria",
    empresaId: "enel",
    empresaNome: "Enel S.p.A.",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2023-05-10",
    dataTerminoMandato: "2026-05-10",
    remuneracaoDeclaradaAno: "Honorário fixo de auditoria regulatória",
    interlockingIds: [],
    fonteOficialNome: "CONSOB",
    urlFonteOficial: "https://www.consob.it/"
  },

  // 16. Neoenergia / Iberdrola
  {
    id: "exec-neoenergia-eduardo-capelastegui",
    nomePessoa: "Eduardo Capelastegui Saiz",
    cargoFuncao: "Diretor-Presidente (CEO Neoenergia)",
    empresaId: "neoenergia-iberdrola",
    empresaNome: "Neoenergia S.A. / Iberdrola",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2022-07-15",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Divulgação agregada CVM FRE Item 13",
    interlockingIds: [],
    fonteOficialNome: "CVM / CNMV (Espanha)",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },
  {
    id: "exec-neoenergia-ignacio-galan",
    nomePessoa: "Ignacio Sánchez Galán",
    cargoFuncao: "Executive Chairman Iberdrola e Membro do Conselho Neoenergia",
    empresaId: "neoenergia-iberdrola",
    empresaNome: "Neoenergia S.A. / Iberdrola",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2017-08-24",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "€ 13,8 milhões (Iberdrola CNMV Remuneration Report)",
    interlockingIds: [],
    fonteOficialNome: "CNMV / CVM Formulário de Referência",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },
  {
    id: "exec-neoenergia-leonardo-gadelha",
    nomePessoa: "Leonardo Pimenta Gadelha",
    cargoFuncao: "Diretor Financeiro e de Relações com Investidores (CFO)",
    empresaId: "neoenergia-iberdrola",
    empresaNome: "Neoenergia S.A. / Iberdrola",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2018-05-01",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Divulgação agregada CVM FRE Item 13",
    interlockingIds: [],
    fonteOficialNome: "CVM Formulário de Referência",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },
  {
    id: "exec-neoenergia-armando-ferreira",
    nomePessoa: "Armando de Góes Ferreira",
    cargoFuncao: "Presidente do Comitê de Auditoria",
    empresaId: "neoenergia-iberdrola",
    empresaNome: "Neoenergia S.A. / Iberdrola",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2020-04-20",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Honorário fixo regulamentar estatutário",
    interlockingIds: [],
    fonteOficialNome: "CVM Formulário de Referência",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },

  // 17. EDP - Energias de Portugal
  {
    id: "exec-edp-miguel-stilwell",
    nomePessoa: "Miguel Stilwell d'Andrade",
    cargoFuncao: "Presidente Executivo Global (CEO)",
    empresaId: "edp",
    empresaNome: "EDP - Energias de Portugal",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2021-01-19",
    dataTerminoMandato: "2026-04-20",
    remuneracaoDeclaradaAno: "€ 2,8 milhões (CMVM Relatório de Governo Societário)",
    interlockingIds: [],
    fonteOficialNome: "CMVM (Portugal) / Euronext",
    urlFonteOficial: "https://www.cmvm.pt/"
  },
  {
    id: "exec-edp-joao-marques-cruz",
    nomePessoa: "João Marques da Cruz",
    cargoFuncao: "Presidente da EDP Brasil / Conselheiro Executivo",
    empresaId: "edp",
    empresaNome: "EDP - Energias de Portugal",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2021-02-01",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Divulgação agregada CVM FRE / CMVM",
    interlockingIds: [],
    fonteOficialNome: "CVM / CMVM",
    urlFonteOficial: "https://www.cmvm.pt/"
  },
  {
    id: "exec-edp-rui-teixeira",
    nomePessoa: "Rui Teixeira",
    cargoFuncao: "Chief Financial Officer Global (CFO)",
    empresaId: "edp",
    empresaNome: "EDP - Energias de Portugal",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2021-01-19",
    dataTerminoMandato: "2026-04-20",
    remuneracaoDeclaradaAno: "CMVM Relatório Anual",
    interlockingIds: [],
    fonteOficialNome: "CMVM",
    urlFonteOficial: "https://www.cmvm.pt/"
  },
  {
    id: "exec-edp-alicia-reyes",
    nomePessoa: "Alicia Reyes",
    cargoFuncao: "Presidente da Comissão de Vencimentos e Auditoria",
    empresaId: "edp",
    empresaNome: "EDP - Energias de Portugal",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2021-04-14",
    dataTerminoMandato: "2025-04-20",
    remuneracaoDeclaradaAno: "Honorário fixo de auditoria independente",
    interlockingIds: [],
    fonteOficialNome: "CMVM",
    urlFonteOficial: "https://www.cmvm.pt/"
  },

  // 18. Galp Energia
  {
    id: "exec-galp-filipe-silva",
    nomePessoa: "Filipe Silva",
    cargoFuncao: "Chief Executive Officer (CEO)",
    empresaId: "galp",
    empresaNome: "Galp Energia, SGPS, S.A.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2023-01-01",
    dataTerminoMandato: "2026-05-10",
    remuneracaoDeclaradaAno: "€ 2,6 milhões (CMVM Relatório Anual de Remunerações)",
    interlockingIds: [],
    fonteOficialNome: "CMVM / Euronext Lisbon",
    urlFonteOficial: "https://www.cmvm.pt/"
  },
  {
    id: "exec-galp-paula-amorim",
    nomePessoa: "Paula Amorim",
    cargoFuncao: "Presidente do Conselho de Administração",
    empresaId: "galp",
    empresaNome: "Galp Energia, SGPS, S.A.",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2016-10-14",
    dataTerminoMandato: "2026-05-10",
    remuneracaoDeclaradaAno: "€ 480 mil (Relatório de Governo Societário)",
    interlockingIds: [],
    fonteOficialNome: "CMVM",
    urlFonteOficial: "https://www.cmvm.pt/"
  },
  {
    id: "exec-galp-maria-joao-carioca",
    nomePessoa: "Maria João Carioca",
    cargoFuncao: "Chief Financial Officer (CFO)",
    empresaId: "galp",
    empresaNome: "Galp Energia, SGPS, S.A.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2023-04-01",
    dataTerminoMandato: "2026-05-10",
    remuneracaoDeclaradaAno: "Relatório de Remuneração Executiva CMVM",
    interlockingIds: [],
    fonteOficialNome: "CMVM",
    urlFonteOficial: "https://www.cmvm.pt/"
  },
  {
    id: "exec-galp-diogo-tavares",
    nomePessoa: "Diogo Tavares",
    cargoFuncao: "Presidente da Comissão de Auditoria",
    empresaId: "galp",
    empresaNome: "Galp Energia, SGPS, S.A.",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2019-04-12",
    dataTerminoMandato: "2026-05-10",
    remuneracaoDeclaradaAno: "Honorário fixo de auditoria independente",
    interlockingIds: [],
    fonteOficialNome: "CMVM",
    urlFonteOficial: "https://www.cmvm.pt/"
  },

  // 19. TIM S.A.
  {
    id: "exec-tim-alberto-griselli",
    nomePessoa: "Alberto Mario Griselli",
    cargoFuncao: "Diretor-Presidente (CEO)",
    empresaId: "tim",
    empresaNome: "TIM S.A.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2022-01-31",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Divulgação agregada CVM FRE Item 13",
    interlockingIds: [],
    fonteOficialNome: "CVM / SEC Form 20-F",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },
  {
    id: "exec-tim-adrian-calaza",
    nomePessoa: "Adrian Calaza",
    cargoFuncao: "Presidente do Conselho de Administração",
    empresaId: "tim",
    empresaNome: "TIM S.A.",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2023-04-20",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Honorário regulamentar estatutário de conselho",
    interlockingIds: [],
    fonteOficialNome: "CVM Formulário de Referência",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },
  {
    id: "exec-tim-andrea-viegas",
    nomePessoa: "Andrea Palma Viegas",
    cargoFuncao: "Diretora Financeira e de Relações com Investidores (CFO)",
    empresaId: "tim",
    empresaNome: "TIM S.A.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2022-03-01",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Divulgação agregada CVM FRE Item 13",
    interlockingIds: [],
    fonteOficialNome: "CVM Formulário de Referência",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },
  {
    id: "exec-tim-gesner-oliveira",
    nomePessoa: "Gesner José de Oliveira Filho",
    cargoFuncao: "Presidente do Comitê de Auditoria Estatutário",
    empresaId: "tim",
    empresaNome: "TIM S.A.",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2020-04-15",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Honorário fixo regulatório de comitê de auditoria",
    interlockingIds: ["braskem"],
    fonteOficialNome: "CVM Formulário de Referência",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },

  // 20. Banco Santander Brasil
  {
    id: "exec-santander-mario-leao",
    nomePessoa: "Mario Roberto Opice Leão",
    cargoFuncao: "Diretor-Presidente",
    empresaId: "santander",
    empresaNome: "Banco Santander (Brasil) S.A.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2022-01-01",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Divulgação agregada CVM FRE Item 13",
    interlockingIds: [],
    fonteOficialNome: "CVM / SEC Form 20-F",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },
  {
    id: "exec-santander-deborah-vieitas",
    nomePessoa: "Deborah Patricia Stern Vieitas",
    cargoFuncao: "Presidente do Conselho de Administração",
    empresaId: "santander",
    empresaNome: "Banco Santander (Brasil) S.A.",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2022-04-29",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Honorário estatutário de conselho de administração",
    interlockingIds: [],
    fonteOficialNome: "CVM Formulário de Referência",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },
  {
    id: "exec-santander-gustavo-viviani",
    nomePessoa: "Gustavo Alejo Viviani",
    cargoFuncao: "Diretor Financeiro (CFO)",
    empresaId: "santander",
    empresaNome: "Banco Santander (Brasil) S.A.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2023-02-01",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Divulgação agregada CVM FRE Item 13",
    interlockingIds: [],
    fonteOficialNome: "CVM Formulário de Referência",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },
  {
    id: "exec-santander-rene-zanin",
    nomePessoa: "René Luiz Zanin",
    cargoFuncao: "Coordenador do Comitê de Auditoria",
    empresaId: "santander",
    empresaNome: "Banco Santander (Brasil) S.A.",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2021-04-30",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Honorário fixo regulatório de auditoria bancária",
    interlockingIds: [],
    fonteOficialNome: "CVM Formulário de Referência",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },

  // 21. ArcelorMittal
  {
    id: "exec-arcelor-aditya-mittal",
    nomePessoa: "Aditya Mittal",
    cargoFuncao: "Chief Executive Officer (CEO)",
    empresaId: "arcelormittal",
    empresaNome: "ArcelorMittal S.A.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2021-02-11",
    dataTerminoMandato: "2026-05-10",
    remuneracaoDeclaradaAno: "US$ 5,2 milhões (SEC Form 20-F / CSSF)",
    interlockingIds: ["aperam"],
    fonteOficialNome: "SEC Form 20-F / CSSF",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0001243429"
  },
  {
    id: "exec-arcelor-lakshmi-mittal",
    nomePessoa: "Lakshmi N. Mittal",
    cargoFuncao: "Executive Chairman do Conselho de Administração",
    empresaId: "arcelormittal",
    empresaNome: "ArcelorMittal S.A.",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2006-08-01",
    dataTerminoMandato: "2025-05-10",
    remuneracaoDeclaradaAno: "US$ 1,8 milhão (Relatório Anual)",
    interlockingIds: ["aperam"],
    fonteOficialNome: "SEC Form 20-F",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0001243429"
  },
  {
    id: "exec-arcelor-jefferson-paula",
    nomePessoa: "Jefferson De Paula",
    cargoFuncao: "Presidente ArcelorMittal Brasil e CEO Longos América Latina",
    empresaId: "arcelormittal",
    empresaNome: "ArcelorMittal S.A.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2014-04-01",
    dataTerminoMandato: "2026-05-10",
    remuneracaoDeclaradaAno: "Não declarada individualmente",
    interlockingIds: [],
    fonteOficialNome: "ArcelorMittal Relatório de Governança Brasil",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0001243429"
  },
  {
    id: "exec-arcelor-bruno-lafont",
    nomePessoa: "Bruno Lafont",
    cargoFuncao: "Presidente do Comitê de Auditoria",
    empresaId: "arcelormittal",
    empresaNome: "ArcelorMittal S.A.",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2011-05-10",
    dataTerminoMandato: "2025-05-10",
    remuneracaoDeclaradaAno: "Honorário fixo regulatório de comitê",
    interlockingIds: [],
    fonteOficialNome: "SEC Form 20-F",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0001243429"
  },

  // 22. Norsk Hydro
  {
    id: "exec-hydro-eivind-kallevik",
    nomePessoa: "Eivind Kallevik",
    cargoFuncao: "Presidente e Chief Executive Officer (CEO)",
    empresaId: "norsk-hydro",
    empresaNome: "Norsk Hydro ASA",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2024-05-13",
    dataTerminoMandato: "2026-05-15",
    remuneracaoDeclaradaAno: "NOK 12,5 milhões (Oslo Børs / Annual Report)",
    interlockingIds: [],
    fonteOficialNome: "Oslo Børs / Finanstilsynet",
    urlFonteOficial: "https://newsweb.oslobors.no/"
  },
  {
    id: "exec-hydro-dag-mejdell",
    nomePessoa: "Dag Mejdell",
    cargoFuncao: "Presidente do Conselho de Administração",
    empresaId: "norsk-hydro",
    empresaNome: "Norsk Hydro ASA",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2012-05-08",
    dataTerminoMandato: "2025-05-15",
    remuneracaoDeclaradaAno: "NOK 920 mil (Corporate Governance Report)",
    interlockingIds: [],
    fonteOficialNome: "Oslo Børs",
    urlFonteOficial: "https://newsweb.oslobors.no/"
  },
  {
    id: "exec-hydro-pal-kildemo",
    nomePessoa: "Pål Kildemo",
    cargoFuncao: "Chief Financial Officer (CFO)",
    empresaId: "norsk-hydro",
    empresaNome: "Norsk Hydro ASA",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2019-08-15",
    dataTerminoMandato: "2025-12-31",
    remuneracaoDeclaradaAno: "Relatório de Remuneração Executiva Norsk Hydro",
    interlockingIds: [],
    fonteOficialNome: "Oslo Børs",
    urlFonteOficial: "https://newsweb.oslobors.no/"
  },
  {
    id: "exec-hydro-peter-kukielski",
    nomePessoa: "Peter Kukielski",
    cargoFuncao: "Presidente do Comitê de Auditoria",
    empresaId: "norsk-hydro",
    empresaNome: "Norsk Hydro ASA",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2018-05-10",
    dataTerminoMandato: "2025-05-15",
    remuneracaoDeclaradaAno: "Honorário fixo de auditoria regulamentar",
    interlockingIds: [],
    fonteOficialNome: "Oslo Børs",
    urlFonteOficial: "https://newsweb.oslobors.no/"
  },

  // 23. Aperam S.A.
  {
    id: "exec-aperam-timoteo-maulo",
    nomePessoa: "Timoteo Di Maulo",
    cargoFuncao: "Chief Executive Officer (CEO)",
    empresaId: "aperam",
    empresaNome: "Aperam S.A.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2015-01-01",
    dataTerminoMandato: "2026-05-10",
    remuneracaoDeclaradaAno: "€ 2,9 milhões (CSSF / Aperam Annual Report)",
    interlockingIds: [],
    fonteOficialNome: "CSSF / Euronext Amsterdam",
    urlFonteOficial: "https://www.aperam.com/investors/"
  },
  {
    id: "exec-aperam-lakshmi-mittal",
    nomePessoa: "Lakshmi N. Mittal",
    cargoFuncao: "Membro do Conselho de Administração",
    empresaId: "aperam",
    empresaNome: "Aperam S.A.",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2011-01-25",
    dataTerminoMandato: "2025-05-10",
    remuneracaoDeclaradaAno: "€ 120 mil (Relatório de Governança)",
    interlockingIds: ["arcelormittal"],
    fonteOficialNome: "CSSF / Aperam Investors",
    urlFonteOficial: "https://www.aperam.com/investors/"
  },
  {
    id: "exec-aperam-sudhakar-sivaji",
    nomePessoa: "Sudhakar Sivaji",
    cargoFuncao: "Chief Financial Officer (CFO)",
    empresaId: "aperam",
    empresaNome: "Aperam S.A.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2020-05-06",
    dataTerminoMandato: "2026-05-10",
    remuneracaoDeclaradaAno: "Relatório Anual de Remuneração",
    interlockingIds: [],
    fonteOficialNome: "CSSF",
    urlFonteOficial: "https://www.aperam.com/investors/"
  },
  {
    id: "exec-aperam-bernadette-baudier",
    nomePessoa: "Bernadette Baudier",
    cargoFuncao: "Presidente do Comitê de Auditoria",
    empresaId: "aperam",
    empresaNome: "Aperam S.A.",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2018-05-09",
    dataTerminoMandato: "2025-05-10",
    remuneracaoDeclaradaAno: "Honorário fixo de auditoria estatutária",
    interlockingIds: [],
    fonteOficialNome: "CSSF",
    urlFonteOficial: "https://www.aperam.com/investors/"
  },

  // 24. Thyssenkrupp AG
  {
    id: "exec-thyssen-miguel-lopez",
    nomePessoa: "Miguel Ángel López Borrego",
    cargoFuncao: "Presidente da Diretoria Executiva (CEO)",
    empresaId: "thyssenkrupp",
    empresaNome: "Thyssenkrupp AG",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2023-06-01",
    dataTerminoMandato: "2026-05-31",
    remuneracaoDeclaradaAno: "€ 3,4 milhões (BaFin / Bundesanzeiger)",
    interlockingIds: [],
    fonteOficialNome: "BaFin / Bundesanzeiger",
    urlFonteOficial: "https://www.unternehmensregister.de/"
  },
  {
    id: "exec-thyssen-siegfried-russwurm",
    nomePessoa: "Siegfried Russwurm",
    cargoFuncao: "Presidente do Conselho de Supervisão",
    empresaId: "thyssenkrupp",
    empresaNome: "Thyssenkrupp AG",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2019-10-01",
    dataTerminoMandato: "2025-09-30",
    remuneracaoDeclaradaAno: "€ 410 mil (Corporate Governance Statement)",
    interlockingIds: [],
    fonteOficialNome: "BaFin / Deutsche Börse",
    urlFonteOficial: "https://www.unternehmensregister.de/"
  },
  {
    id: "exec-thyssen-jens-schulte",
    nomePessoa: "Jens Schulte",
    cargoFuncao: "Chief Financial Officer (CFO)",
    empresaId: "thyssenkrupp",
    empresaNome: "Thyssenkrupp AG",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2024-06-01",
    dataTerminoMandato: "2027-05-31",
    remuneracaoDeclaradaAno: "Divulgação estatutária Vorstand",
    interlockingIds: [],
    fonteOficialNome: "BaFin",
    urlFonteOficial: "https://www.unternehmensregister.de/"
  },
  {
    id: "exec-thyssen-bernhard-pellens",
    nomePessoa: "Bernhard Pellens",
    cargoFuncao: "Presidente do Comitê de Auditoria",
    empresaId: "thyssenkrupp",
    empresaNome: "Thyssenkrupp AG",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2014-01-17",
    dataTerminoMandato: "2025-01-31",
    remuneracaoDeclaradaAno: "Honorário fixo de supervisão contábil",
    interlockingIds: [],
    fonteOficialNome: "BaFin",
    urlFonteOficial: "https://www.unternehmensregister.de/"
  },

  // 25. BASF SE
  {
    id: "exec-basf-markus-kamieth",
    nomePessoa: "Markus Kamieth",
    cargoFuncao: "Presidente da Diretoria Executiva (CEO)",
    empresaId: "basf",
    empresaNome: "BASF SE",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2024-04-25",
    dataTerminoMandato: "2028-04-30",
    remuneracaoDeclaradaAno: "€ 4,8 milhões (BaFin / Relatório de Remuneração BASF)",
    interlockingIds: [],
    fonteOficialNome: "BaFin / Bundesanzeiger",
    urlFonteOficial: "https://www.unternehmensregister.de/"
  },
  {
    id: "exec-basf-kurt-bock",
    nomePessoa: "Kurt Bock",
    cargoFuncao: "Presidente do Conselho de Supervisão",
    empresaId: "basf",
    empresaNome: "BASF SE",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2020-06-18",
    dataTerminoMandato: "2025-05-10",
    remuneracaoDeclaradaAno: "€ 550 mil (Relatório Anual)",
    interlockingIds: [],
    fonteOficialNome: "BaFin",
    urlFonteOficial: "https://www.unternehmensregister.de/"
  },
  {
    id: "exec-basf-dirk-elvermann",
    nomePessoa: "Dirk Elvermann",
    cargoFuncao: "Chief Financial Officer (CFO)",
    empresaId: "basf",
    empresaNome: "BASF SE",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2023-03-01",
    dataTerminoMandato: "2026-04-30",
    remuneracaoDeclaradaAno: "Relatório de Remuneração Executiva BASF",
    interlockingIds: [],
    fonteOficialNome: "BaFin",
    urlFonteOficial: "https://www.unternehmensregister.de/"
  },
  {
    id: "exec-basf-alessandra-genco",
    nomePessoa: "Alessandra Genco",
    cargoFuncao: "Presidente do Comitê de Auditoria",
    empresaId: "basf",
    empresaNome: "BASF SE",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2023-04-27",
    dataTerminoMandato: "2027-05-01",
    remuneracaoDeclaradaAno: "Honorário fixo de auditoria regulatória",
    interlockingIds: [],
    fonteOficialNome: "BaFin",
    urlFonteOficial: "https://www.unternehmensregister.de/"
  },

  // 26. Bayer AG
  {
    id: "exec-bayer-bill-anderson",
    nomePessoa: "Bill Anderson",
    cargoFuncao: "Presidente da Diretoria Executiva (CEO)",
    empresaId: "bayer",
    empresaNome: "Bayer AG",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2023-06-01",
    dataTerminoMandato: "2026-05-31",
    remuneracaoDeclaradaAno: "€ 6,4 milhões (BaFin / Bayer Compensation Report)",
    interlockingIds: [],
    fonteOficialNome: "BaFin / Bundesanzeiger",
    urlFonteOficial: "https://www.unternehmensregister.de/"
  },
  {
    id: "exec-bayer-norbert-winkeljohann",
    nomePessoa: "Norbert Winkeljohann",
    cargoFuncao: "Presidente do Conselho de Supervisão",
    empresaId: "bayer",
    empresaNome: "Bayer AG",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2020-04-28",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "€ 490 mil (Bayer Corporate Governance)",
    interlockingIds: [],
    fonteOficialNome: "BaFin",
    urlFonteOficial: "https://www.unternehmensregister.de/"
  },
  {
    id: "exec-bayer-wolfgang-nickl",
    nomePessoa: "Wolfgang Nickl",
    cargoFuncao: "Chief Financial Officer (CFO)",
    empresaId: "bayer",
    empresaNome: "Bayer AG",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2018-04-26",
    dataTerminoMandato: "2025-05-31",
    remuneracaoDeclaradaAno: "Relatório de Remuneração Executiva Bayer",
    interlockingIds: [],
    fonteOficialNome: "BaFin",
    urlFonteOficial: "https://www.unternehmensregister.de/"
  },
  {
    id: "exec-bayer-ertharin-cousin",
    nomePessoa: "Ertharin Cousin",
    cargoFuncao: "Membro do Comitê de Auditoria",
    empresaId: "bayer",
    empresaNome: "Bayer AG",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2019-04-26",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Honorário fixo de supervisão independente",
    interlockingIds: [],
    fonteOficialNome: "BaFin",
    urlFonteOficial: "https://www.unternehmensregister.de/"
  },

  // 27. TotalEnergies
  {
    id: "exec-total-patrick-pouyanne",
    nomePessoa: "Patrick Pouyanné",
    cargoFuncao: "Chairman e Chief Executive Officer (CEO)",
    empresaId: "totalenergies",
    empresaNome: "TotalEnergies SE",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2014-10-22",
    dataTerminoMandato: "2027-05-25",
    remuneracaoDeclaradaAno: "€ 7,3 milhões (AMF Document d'Enregistrement Universel)",
    interlockingIds: [],
    fonteOficialNome: "AMF / SEC Form 20-F",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000879764"
  },
  {
    id: "exec-total-marie-coisne",
    nomePessoa: "Marie-Christine Coisne-Roquette",
    cargoFuncao: "Lead Independent Director",
    empresaId: "totalenergies",
    empresaNome: "TotalEnergies SE",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2011-05-13",
    dataTerminoMandato: "2026-05-25",
    remuneracaoDeclaradaAno: "€ 280 mil (Rapport sur le Gouvernement d'Entreprise)",
    interlockingIds: [],
    fonteOficialNome: "AMF / SEC",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000879764"
  },
  {
    id: "exec-total-jean-pierre-sbraire",
    nomePessoa: "Jean-Pierre Sbraire",
    cargoFuncao: "Chief Financial Officer (CFO)",
    empresaId: "totalenergies",
    empresaNome: "TotalEnergies SE",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2019-08-01",
    dataTerminoMandato: "2026-05-25",
    remuneracaoDeclaradaAno: "Divulgação executiva agregada AMF",
    interlockingIds: [],
    fonteOficialNome: "AMF / SEC Form 20-F",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000879764"
  },
  {
    id: "exec-total-jacques-aschenbroich",
    nomePessoa: "Jacques Aschenbroich",
    cargoFuncao: "Presidente do Comitê de Auditoria",
    empresaId: "totalenergies",
    empresaNome: "TotalEnergies SE",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2021-05-28",
    dataTerminoMandato: "2025-05-25",
    remuneracaoDeclaradaAno: "Honorário fixo de auditoria estatutária",
    interlockingIds: [],
    fonteOficialNome: "AMF",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000879764"
  },

  // 28. Shell plc
  {
    id: "exec-shell-wael-sawan",
    nomePessoa: "Wael Sawan",
    cargoFuncao: "Chief Executive Officer (CEO)",
    empresaId: "shell",
    empresaNome: "Shell plc",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2023-01-01",
    dataTerminoMandato: "2026-05-20",
    remuneracaoDeclaradaAno: "£ 7,9 milhões (Directors' Remuneration Report / SEC 20-F)",
    interlockingIds: [],
    fonteOficialNome: "Companies House / SEC Form 20-F",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0001306965"
  },
  {
    id: "exec-shell-andrew-mackenzie",
    nomePessoa: "Sir Andrew Mackenzie",
    cargoFuncao: "Chair do Conselho de Administração",
    empresaId: "shell",
    empresaNome: "Shell plc",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2021-05-18",
    dataTerminoMandato: "2025-05-20",
    remuneracaoDeclaradaAno: "£ 890 mil (Annual Report)",
    interlockingIds: ["bhp"],
    fonteOficialNome: "Companies House / SEC",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0001306965"
  },
  {
    id: "exec-shell-sinead-gorman",
    nomePessoa: "Sinead Gorman",
    cargoFuncao: "Chief Financial Officer (CFO)",
    empresaId: "shell",
    empresaNome: "Shell plc",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2022-04-01",
    dataTerminoMandato: "2026-05-20",
    remuneracaoDeclaradaAno: "Relatório Anual de Remuneração Executiva",
    interlockingIds: [],
    fonteOficialNome: "Companies House / SEC",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0001306965"
  },
  {
    id: "exec-shell-neil-carson",
    nomePessoa: "Neil Carson",
    cargoFuncao: "Presidente do Comitê de Auditoria",
    empresaId: "shell",
    empresaNome: "Shell plc",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2019-06-01",
    dataTerminoMandato: "2025-05-20",
    remuneracaoDeclaradaAno: "Honorário fixo de auditoria regulamentar",
    interlockingIds: [],
    fonteOficialNome: "Companies House / SEC",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0001306965"
  },

  // 29. Braskem S.A.
  {
    id: "exec-braskem-roberto-bischoff",
    nomePessoa: "Roberto Bischoff",
    cargoFuncao: "Diretor-Presidente (CEO)",
    empresaId: "braskem",
    empresaNome: "Braskem S.A.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2023-01-01",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Divulgação agregada CVM FRE Item 13",
    interlockingIds: [],
    fonteOficialNome: "CVM / SEC Form 20-F",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },
  {
    id: "exec-braskem-jose-cunha",
    nomePessoa: "José Mauro Mettrau Carneiro da Cunha",
    cargoFuncao: "Conselheiro de Administração (Indicação Petrobras)",
    empresaId: "braskem",
    empresaNome: "Braskem S.A.",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2023-04-28",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Honorário estatutário de conselho CVM",
    interlockingIds: ["petrobras"],
    fonteOficialNome: "CVM Formulário de Referência",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },
  {
    id: "exec-braskem-pedro-freitas",
    nomePessoa: "Pedro de Freitas",
    cargoFuncao: "Diretor Financeiro e de Relações com Investidores (CFO)",
    empresaId: "braskem",
    empresaNome: "Braskem S.A.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2016-04-01",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Divulgação agregada CVM FRE Item 13",
    interlockingIds: [],
    fonteOficialNome: "CVM Formulário de Referência",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },
  {
    id: "exec-braskem-gesner-oliveira",
    nomePessoa: "Gesner José de Oliveira Filho",
    cargoFuncao: "Coordenador do Comitê de Auditoria Estatutário",
    empresaId: "braskem",
    empresaNome: "Braskem S.A.",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2021-05-01",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Honorário estatutário de comitê de auditoria",
    interlockingIds: ["tim"],
    fonteOficialNome: "CVM Formulário de Referência",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },

  // 30. JBS S.A.
  {
    id: "exec-jbs-gilberto-tomazoni",
    nomePessoa: "Gilberto Tomazoni",
    cargoFuncao: "Diretor-Presidente Global (CEO)",
    empresaId: "jbs",
    empresaNome: "JBS S.A.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2018-12-04",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Divulgação agregada CVM FRE Item 13",
    interlockingIds: [],
    fonteOficialNome: "CVM / SEC EDGAR",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },
  {
    id: "exec-jbs-jeremiah-ocallaghan",
    nomePessoa: "Jeremiah O’Callaghan",
    cargoFuncao: "Presidente do Conselho de Administração",
    empresaId: "jbs",
    empresaNome: "JBS S.A.",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2017-10-13",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Honorário fixo regulamentar estatutário",
    interlockingIds: [],
    fonteOficialNome: "CVM Formulário de Referência",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },
  {
    id: "exec-jbs-guilherme-cavalcanti",
    nomePessoa: "Guilherme Perboyre Cavalcanti",
    cargoFuncao: "Diretor Executivo Global de Finanças e RI (CFO)",
    empresaId: "jbs",
    empresaNome: "JBS S.A.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2019-02-01",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Divulgação agregada CVM FRE Item 13",
    interlockingIds: [],
    fonteOficialNome: "CVM Formulário de Referência",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },
  {
    id: "exec-jbs-alba-pettengill",
    nomePessoa: "Alba Pettengill",
    cargoFuncao: "Presidente do Comitê de Auditoria Estatutário",
    empresaId: "jbs",
    empresaNome: "JBS S.A.",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2019-05-02",
    dataTerminoMandato: "2025-04-30",
    remuneracaoDeclaradaAno: "Honorário fixo de auditoria estatutária",
    interlockingIds: [],
    fonteOficialNome: "CVM Formulário de Referência",
    urlFonteOficial: "https://www.rad.cvm.gov.br/ENET/"
  },

  // 31. Cargill
  {
    id: "exec-cargill-brian-sikes",
    nomePessoa: "Brian Sikes",
    cargoFuncao: "Presidente e Chief Executive Officer (CEO)",
    empresaId: "cargill",
    empresaNome: "Cargill, Incorporated",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2023-01-01",
    dataTerminoMandato: "2026-12-31",
    remuneracaoDeclaradaAno: "Não declarada individualmente (Companhia de Capital Fechado)",
    interlockingIds: [],
    fonteOficialNome: "Cargill Executive Governance / MN Secretary of State",
    urlFonteOficial: "https://www.cargill.com/about/executive-team"
  },
  {
    id: "exec-cargill-david-maclennan",
    nomePessoa: "David MacLennan",
    cargoFuncao: "Executive Chair do Conselho de Administração",
    empresaId: "cargill",
    empresaNome: "Cargill, Incorporated",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2023-01-01",
    dataTerminoMandato: "2025-12-31",
    remuneracaoDeclaradaAno: "Não declarada individualmente",
    interlockingIds: [],
    fonteOficialNome: "Cargill Governance",
    urlFonteOficial: "https://www.cargill.com/about/executive-team"
  },
  {
    id: "exec-cargill-paulo-sousa",
    nomePessoa: "Paulo Sousa",
    cargoFuncao: "Presidente da Cargill no Brasil",
    empresaId: "cargill",
    empresaNome: "Cargill, Incorporated",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2019-12-01",
    dataTerminoMandato: "2026-12-31",
    remuneracaoDeclaradaAno: "Não declarada individualmente",
    interlockingIds: [],
    fonteOficialNome: "Cargill Relatório Anual Brasil",
    urlFonteOficial: "https://www.cargill.com/about/executive-team"
  },
  {
    id: "exec-cargill-jamie-miller",
    nomePessoa: "Jamie Miller",
    cargoFuncao: "Chief Financial Officer (CFO)",
    empresaId: "cargill",
    empresaNome: "Cargill, Incorporated",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2023-06-01",
    dataTerminoMandato: "2026-12-31",
    remuneracaoDeclaradaAno: "Não declarada individualmente",
    interlockingIds: [],
    fonteOficialNome: "Cargill Executive Governance",
    urlFonteOficial: "https://www.cargill.com/about/executive-team"
  },

  // 32. Bunge Global SA
  {
    id: "exec-bunge-gregory-heckman",
    nomePessoa: "Gregory A. Heckman",
    cargoFuncao: "Chief Executive Officer (CEO)",
    empresaId: "bunge",
    empresaNome: "Bunge Global SA",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2019-04-24",
    dataTerminoMandato: "2026-05-15",
    remuneracaoDeclaradaAno: "US$ 15,1 milhões (SEC Form 10-K / DEF 14A)",
    interlockingIds: [],
    fonteOficialNome: "SEC Form 10-K / DEF 14A",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0001996862"
  },
  {
    id: "exec-bunge-kathleen-hyle",
    nomePessoa: "Kathleen Hyle",
    cargoFuncao: "Chair do Conselho de Administração",
    empresaId: "bunge",
    empresaNome: "Bunge Global SA",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2018-12-10",
    dataTerminoMandato: "2025-05-15",
    remuneracaoDeclaradaAno: "US$ 420 mil (SEC DEF 14A)",
    interlockingIds: [],
    fonteOficialNome: "SEC Form DEF 14A",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0001996862"
  },
  {
    id: "exec-bunge-john-neppl",
    nomePessoa: "John W. Neppl",
    cargoFuncao: "Chief Financial Officer (CFO)",
    empresaId: "bunge",
    empresaNome: "Bunge Global SA",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2019-05-06",
    dataTerminoMandato: "2026-05-15",
    remuneracaoDeclaradaAno: "Relatório de Remuneração Executiva SEC",
    interlockingIds: [],
    fonteOficialNome: "SEC Form 10-K",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0001996862"
  },
  {
    id: "exec-bunge-mark-zenuk",
    nomePessoa: "Mark N. Zenuk",
    cargoFuncao: "Presidente do Comitê de Auditoria",
    empresaId: "bunge",
    empresaNome: "Bunge Global SA",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2018-07-01",
    dataTerminoMandato: "2025-05-15",
    remuneracaoDeclaradaAno: "Honorário fixo de auditoria estatutária",
    interlockingIds: [],
    fonteOficialNome: "SEC Form DEF 14A",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0001996862"
  },

  // 33. Archer-Daniels-Midland (ADM)
  {
    id: "exec-adm-juan-luciano",
    nomePessoa: "Juan R. Luciano",
    cargoFuncao: "Chairman e Chief Executive Officer (CEO)",
    empresaId: "adm",
    empresaNome: "Archer-Daniels-Midland Company",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2015-01-01",
    dataTerminoMandato: "2026-05-07",
    remuneracaoDeclaradaAno: "US$ 24,7 milhões (SEC Form 10-K / DEF 14A)",
    interlockingIds: [],
    fonteOficialNome: "SEC Form 10-K / DEF 14A",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000004292"
  },
  {
    id: "exec-adm-ted-colbert",
    nomePessoa: "Ted Colbert",
    cargoFuncao: "Membro do Conselho de Administração",
    empresaId: "adm",
    empresaNome: "Archer-Daniels-Midland Company",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2021-05-06",
    dataTerminoMandato: "2025-05-07",
    remuneracaoDeclaradaAno: "US$ 310 mil (SEC DEF 14A)",
    interlockingIds: [],
    fonteOficialNome: "SEC Form DEF 14A",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000004292"
  },
  {
    id: "exec-adm-ismael-roig",
    nomePessoa: "Ismael Roig",
    cargoFuncao: "Chief Financial Officer Interino (CFO)",
    empresaId: "adm",
    empresaNome: "Archer-Daniels-Midland Company",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2024-01-21",
    dataTerminoMandato: "2025-12-31",
    remuneracaoDeclaradaAno: "Relatório de Remuneração Executiva SEC",
    interlockingIds: [],
    fonteOficialNome: "SEC Form 8-K / 10-K",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000004292"
  },
  {
    id: "exec-adm-terry-crews",
    nomePessoa: "Terry Crews",
    cargoFuncao: "Presidente do Comitê de Auditoria",
    empresaId: "adm",
    empresaNome: "Archer-Daniels-Midland Company",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2011-05-05",
    dataTerminoMandato: "2025-05-07",
    remuneracaoDeclaradaAno: "Honorário fixo de auditoria independente",
    interlockingIds: [],
    fonteOficialNome: "SEC Form DEF 14A",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000004292"
  },

  // 34. BlackRock
  {
    id: "exec-blackrock-larry-fink",
    nomePessoa: "Laurence D. (Larry) Fink",
    cargoFuncao: "Chairman e Chief Executive Officer (CEO)",
    empresaId: "blackrock",
    empresaNome: "BlackRock, Inc.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "1988-03-01",
    dataTerminoMandato: "2026-05-25",
    remuneracaoDeclaradaAno: "US$ 26,9 milhões (SEC Form 10-K / DEF 14A)",
    interlockingIds: ["vale", "petrobras"],
    fonteOficialNome: "SEC Form 10-K / DEF 14A",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0001364742"
  },
  {
    id: "exec-blackrock-robert-kapito",
    nomePessoa: "Robert S. Kapito",
    cargoFuncao: "Presidente Executivo",
    empresaId: "blackrock",
    empresaNome: "BlackRock, Inc.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2007-01-01",
    dataTerminoMandato: "2026-05-25",
    remuneracaoDeclaradaAno: "US$ 19,8 milhões (SEC DEF 14A)",
    interlockingIds: [],
    fonteOficialNome: "SEC Form DEF 14A",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0001364742"
  },
  {
    id: "exec-blackrock-martin-small",
    nomePessoa: "Martin Small",
    cargoFuncao: "Chief Financial Officer (CFO)",
    empresaId: "blackrock",
    empresaNome: "BlackRock, Inc.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2023-02-24",
    dataTerminoMandato: "2026-05-25",
    remuneracaoDeclaradaAno: "Relatório de Remuneração Executiva SEC",
    interlockingIds: [],
    fonteOficialNome: "SEC Form 10-K",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0001364742"
  },
  {
    id: "exec-blackrock-murry-gerber",
    nomePessoa: "Murry S. Gerber",
    cargoFuncao: "Lead Independent Director e Membro de Auditoria",
    empresaId: "blackrock",
    empresaNome: "BlackRock, Inc.",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2017-05-25",
    dataTerminoMandato: "2025-05-25",
    remuneracaoDeclaradaAno: "US$ 485 mil (SEC DEF 14A)",
    interlockingIds: [],
    fonteOficialNome: "SEC Form DEF 14A",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0001364742"
  },

  // 35. Vanguard
  {
    id: "exec-vanguard-salim-ramji",
    nomePessoa: "Salim Ramji",
    cargoFuncao: "Chief Executive Officer (CEO)",
    empresaId: "vanguard",
    empresaNome: "The Vanguard Group, Inc.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2024-07-08",
    dataTerminoMandato: "2027-12-31",
    remuneracaoDeclaradaAno: "Não declarada individualmente (Estrutura Mutual / SEC)",
    interlockingIds: [],
    fonteOficialNome: "SEC Investment Company Act / Vanguard Corporate",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000102909"
  },
  {
    id: "exec-vanguard-mark-loughridge",
    nomePessoa: "Mark Loughridge",
    cargoFuncao: "Lead Independent Director",
    empresaId: "vanguard",
    empresaNome: "The Vanguard Group, Inc.",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2012-01-01",
    dataTerminoMandato: "2025-12-31",
    remuneracaoDeclaradaAno: "Honorário fixo de conselho estatutário",
    interlockingIds: [],
    fonteOficialNome: "SEC Investment Company Act",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000102909"
  },
  {
    id: "exec-vanguard-michael-rollings",
    nomePessoa: "Michael Rollings",
    cargoFuncao: "Chief Financial Officer (CFO)",
    empresaId: "vanguard",
    empresaNome: "The Vanguard Group, Inc.",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2016-06-01",
    dataTerminoMandato: "2026-12-31",
    remuneracaoDeclaradaAno: "Não declarada individualmente",
    interlockingIds: [],
    fonteOficialNome: "SEC Filings",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000102909"
  },
  {
    id: "exec-vanguard-sarah-raskin",
    nomePessoa: "Sarah Bloom Raskin",
    cargoFuncao: "Membro do Comitê de Auditoria e Governança",
    empresaId: "vanguard",
    empresaNome: "The Vanguard Group, Inc.",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2017-05-01",
    dataTerminoMandato: "2025-12-31",
    remuneracaoDeclaradaAno: "Honorário fixo de auditoria regulamentar",
    interlockingIds: [],
    fonteOficialNome: "SEC Filings",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000102909"
  },

  // 36. State Street
  {
    id: "exec-statestreet-ronald-ohanley",
    nomePessoa: "Ronald P. O'Hanley",
    cargoFuncao: "Chairman e Chief Executive Officer (CEO)",
    empresaId: "state-street",
    empresaNome: "State Street Corporation",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2019-01-01",
    dataTerminoMandato: "2026-05-18",
    remuneracaoDeclaradaAno: "US$ 18,3 milhões (SEC Form 10-K / DEF 14A)",
    interlockingIds: [],
    fonteOficialNome: "SEC Form 10-K / DEF 14A",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000093751"
  },
  {
    id: "exec-statestreet-amelia-fawcett",
    nomePessoa: "Amelia Fawcett",
    cargoFuncao: "Lead Independent Director",
    empresaId: "state-street",
    empresaNome: "State Street Corporation",
    tipoOrgao: "conselho_administracao",
    dataPosse: "2012-05-16",
    dataTerminoMandato: "2025-05-18",
    remuneracaoDeclaradaAno: "US$ 410 mil (SEC DEF 14A)",
    interlockingIds: [],
    fonteOficialNome: "SEC Form DEF 14A",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000093751"
  },
  {
    id: "exec-statestreet-eric-aboaf",
    nomePessoa: "Eric Aboaf",
    cargoFuncao: "Vice Chairman e Chief Financial Officer (CFO)",
    empresaId: "state-street",
    empresaNome: "State Street Corporation",
    tipoOrgao: "diretoria_executiva",
    dataPosse: "2016-12-01",
    dataTerminoMandato: "2026-05-18",
    remuneracaoDeclaradaAno: "Relatório de Remuneração Executiva SEC",
    interlockingIds: [],
    fonteOficialNome: "SEC Form 10-K",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000093751"
  },
  {
    id: "exec-statestreet-patrick-saint-aignan",
    nomePessoa: "Patrick de Saint-Aignan",
    cargoFuncao: "Presidente do Comitê de Auditoria",
    empresaId: "state-street",
    empresaNome: "State Street Corporation",
    tipoOrgao: "comite_auditoria",
    dataPosse: "2009-05-20",
    dataTerminoMandato: "2025-05-18",
    remuneracaoDeclaradaAno: "Honorário fixo de auditoria regulamentar",
    interlockingIds: [],
    fonteOficialNome: "SEC Form DEF 14A",
    urlFonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000093751"
  }
];

/**
 * Função principal que executa a geração e compactação da base de executivos e conselhos.
 */
export function executarGeracaoExecutivos(): void {
  console.log("Iniciando ETL de Executivos e Conselhos Corporativos...");

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`Diretório criado: ${DATA_DIR}`);
  }

  // Estatísticas de validação
  const total = EXECUTIVOS_BASE.length;
  const empresas = new Set(EXECUTIVOS_BASE.map((e) => e.empresaId));
  const interlocking = EXECUTIVOS_BASE.filter((e) => e.interlockingIds.length > 0);
  const diretorias = EXECUTIVOS_BASE.filter((e) => e.tipoOrgao === "diretoria_executiva").length;
  const conselhos = EXECUTIVOS_BASE.filter((e) => e.tipoOrgao === "conselho_administracao").length;
  const auditorias = EXECUTIVOS_BASE.filter((e) => e.tipoOrgao === "comite_auditoria").length;

  console.log(`Total de registros mapeados: ${total}`);
  console.log(`Total de corporações cobertas: ${empresas.size}`);
  console.log(`Registros com interlocking directorates: ${interlocking.length}`);
  console.log(`Distribuição por órgão: Diretoria=${diretorias}, Conselho=${conselhos}, Auditoria=${auditorias}`);

  // Cabeçalho de proveniência do dataset cívico
  const cabecalho = {
    nome: "Mapeamento Cívico de Executivos, Conselhos de Administração e Comitês de Auditoria",
    versao: "1.0.0",
    dataAtualizacao: "2026-10-01",
    licenca: "Dados públicos regulatórios (CVM, SEC, SEDAR+, Companies House, CMVM, BaFin)",
    totalRegistros: total,
    totalEmpresas: empresas.size,
    totalInterlocking: interlocking.length,
    descricao: "Mapeamento dos executivos estatutários, presidentes de conselho e membros de comitês de auditoria das principais empresas e fundos monitorados pelo Controle Popular."
  };

  // Compactar dados homogêneos via esqueleto + rótulos internados
  const tabelaCompacta = compactar(EXECUTIVOS_BASE as unknown as Record<string, unknown>[]);
  const conteudoSerializado = serializarCompacto(cabecalho, tabelaCompacta);

  fs.writeFileSync(ARQUIVO_SAIDA, conteudoSerializado, "utf8");
  const tamanhoBytes = fs.statSync(ARQUIVO_SAIDA).size;

  console.log(`Arquivo compactado gerado com sucesso: ${ARQUIVO_SAIDA}`);
  console.log(`Tamanho final em disco: ${(tamanhoBytes / 1024).toFixed(2)} KB (${tamanhoBytes} bytes)`);
}

// Execução direta via CLI (tsx / node)
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  executarGeracaoExecutivos();
}
