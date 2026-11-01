/**
 * @file apps/web/lib/direitos-globais/africa/recomendacoes-achpr.ts
 * @description Recomendações e Observações Conclusivas da Comissão Africana (ACHPR) e Mecanismos Especiais.
 *
 * Fonte oficial: African Commission on Human and Peoples' Rights (achpr.org)
 * - State Reporting & Concluding Observations
 * - Special Mechanisms (Indústrias Extrativas, Povos Indígenas, Mulheres, Pessoas Idosas e Deficiência)
 */

import type { Recomendacao, Status } from "../tipos-comuns";
import type { TipoDireito } from "../tipos";

export interface RecomendacaoAfricana extends Recomendacao {
  pais: string;
}

export const RECOMENDACOES_ACHPR: readonly RecomendacaoAfricana[] = [
  {
    orgao: "ACHPR",
    documento: "Observações Conclusivas sobre o Relatório Periódico de Angola",
    sessao: "63ª Sessão Ordinária",
    data: "2018-11-13",
    pais: "Angola",
    tema: "atingidos_empreendimentos" as TipoDireito,
    texto: "Recomenda garantir que a exploração minerária de diamantes e petróleo na província da Lunda Norte e em Cabinda seja precedida de consultas genuínas às comunidades locais, com avaliação prévia de impacto socioambiental e garantia de reassentamento e reparação justa.",
    status: "parcial" as Status,
    evidencia: "Relatório de seguimento submetido pelo Estado angolano em 2021 relatando aprovação do novo Código Mineiro com previsão de programas sociais, ainda sem titulação definitiva comunitária.",
    url: "https://achpr.org/sessions/concludingobservation?id=107",
  },
  {
    orgao: "ACHPR",
    documento: "Observações Conclusivas sobre Moçambique",
    sessao: "56ª Sessão Ordinária",
    data: "2015-05-07",
    pais: "Moçambique",
    tema: "atingidos_barragens" as TipoDireito,
    texto: "Urgir o Estado a fiscalizar os impactos das grandes concessões de mineração de carvão em Tete e projetos hidrelétricos no Rio Zambeze, garantindo que as populações reassentadas tenham acesso contínuo a terras férteis para agricultura e fontes perenes de água potável.",
    status: "desconhecido" as Status,
    evidencia: null, // Sem comprovação documental independente
    url: "https://achpr.org/sessions/concludingobservation?id=96",
  },
  {
    orgao: "ACHPR",
    documento: "Observações Conclusivas sobre a África do Sul",
    sessao: "59ª Sessão Ordinária",
    data: "2016-11-04",
    pais: "África do Sul",
    tema: "terra_territorio" as TipoDireito,
    texto: "Acelerar a restituição fundiária e a reforma agrária, garantindo segurança jurídica na posse da terra para mulheres rurais e comunidades tradicionais que permanecem vulneráveis a despejos em áreas agrícolas privadas.",
    status: "parcial" as Status,
    evidencia: "Livro Branco de Reforma Agrária e Emenda Constitucional debatida no Parlamento sul-africano.",
    url: "https://achpr.org/sessions/concludingobservation?id=101",
  },
  {
    orgao: "ACHPR",
    documento: "Observações Conclusivas sobre a República Democrática do Congo",
    sessao: "61ª Sessão Ordinária",
    data: "2017-11-15",
    pais: "República Democrática do Congo",
    tema: "povos" as TipoDireito,
    texto: "Implementar com urgência medidas concretas para proteger os povos autóctones (pigmeus) contra despejos forçados de parques nacionais e assegurar seus direitos inalienáveis à caça, coleta tradicional e cogestão de florestas.",
    status: "parcial" as Status,
    evidencia: "Promulgação da Lei nº 22/030 em julho de 2022 sobre Proteção e Promoção dos Direitos dos Povos Autóctones Pigmeus na RDC.",
    url: "https://achpr.org/sessions/concludingobservation?id=103",
  },
  {
    orgao: "ACHPR",
    documento: "Resolução sobre a Situação das Mulheres na África e Protocolo de Maputo",
    sessao: "67ª Sessão Ordinária",
    data: "2020-12-03",
    pais: "Egito",
    tema: "mulheres" as TipoDireito,
    texto: "Reiterar o apelo formal para a ratificação sem reservas do Protocolo de Maputo e criminalização irrestrita de todas as formas de mutilação genital feminina em clínicas e hospitais.",
    status: "nao" as Status,
    evidencia: null, // Egito não ratificou o Protocolo de Maputo
    url: "https://achpr.org/sessions/resolutions?id=492",
  },
  {
    orgao: "ACHPR",
    documento: "Observações Conclusivas sobre a Nigéria",
    sessao: "65ª Sessão Ordinária",
    data: "2019-11-10",
    pais: "Nigéria",
    tema: "ambiental" as TipoDireito,
    texto: "Implementar integralmente as recomendações do Programa das Nações Unidas para o Meio Ambiente (UNEP) para despoluição do Delta do Níger e garantir água potável e atendimento médico às comunidades intoxicadas por vazamentos de óleo cru.",
    status: "parcial" as Status,
    evidencia: "Operações contínuas mas com atrasos do órgão HYPREP (Hydrocarbon Pollution Remediation Project).",
    url: "https://achpr.org/sessions/concludingobservation?id=110",
  },
];

export function recomendacoesPorPaisAfrica(pais: string): readonly RecomendacaoAfricana[] {
  return RECOMENDACOES_ACHPR.filter((r) => r.pais.toLowerCase() === pais.toLowerCase());
}

export function recomendacoesPorTemaAfrica(tema: TipoDireito): readonly RecomendacaoAfricana[] {
  return RECOMENDACOES_ACHPR.filter((r) => r.tema === tema);
}
