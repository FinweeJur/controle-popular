/**
 * @file apps/web/lib/direitos-globais/asia/tratados-regionais.ts
 * @description Panorama institucional regional da Ásia e registro da ausência de corte regional vinculante.
 *
 * Ao contrário das Américas (Corte IDH) e da África (Corte Africana), a região da Ásia
 * não possui um tratado geral de direitos humanos juridicamente vinculante nem um tribunal regional
 * dotado de jurisdição contenciosa sobre os Estados.
 *
 * Consequência jurídica:
 * O escrutínio internacional dos países asiáticos recai quase exclusivamente sobre os tratados
 * universais da ONU (Pactos de 1966 e convenções especializadas), sobre o mecanismo de Revisão
 * Periódica Universal (UPR) e sobre os Procedimentos Especiais do Conselho de Direitos Humanos da ONU.
 */

export interface InstrumentoRegionalAsia {
  id: string;
  nome: string;
  ano: number;
  tipo: "declaracao" | "comissao_consultiva" | "ausencia_tribunal";
  vinculante: boolean;
  paisesAbrangidos: string[];
  descricao: string;
  url?: string;
}

export const INSTRUMENTOS_REGIONAIS_ASIA: readonly InstrumentoRegionalAsia[] = [
  {
    id: "ausencia-corte-asiatica",
    nome: "Ausência de Tribunal Regional Asiático de Direitos Humanos",
    ano: 2026,
    tipo: "ausencia_tribunal",
    vinculante: false,
    paisesAbrangidos: ["China", "Rússia", "Índia", "Japão", "Vietnã", "Filipinas", "Indonésia", "Bangladesh", "Paquistão", "Tailândia", "Malásia", "Coreia do Sul"],
    descricao: "Não existe na Ásia um tribunal supranacional com poder de condenar Estados ou emitir sentenças de reparação obrigatórias a vítimas de violações de direitos fundamentais. A ausência de uma Convenção Asiática de Direitos Humanos torna o Sistema ONU a única instância externa formal de responsabilização.",
  },
  {
    id: "ahdr-asean",
    nome: "Declaração de Direitos Humanos da ASEAN (AHDR)",
    ano: 2012,
    tipo: "declaracao",
    vinculante: false,
    paisesAbrangidos: ["Filipinas", "Vietnã", "Indonésia", "Tailândia", "Malásia", "Camboja", "Laos", "Mianmar", "Singapura", "Brunei"],
    descricao: "Declaração política adotada pelos 10 países do Sudeste Asiático. Sofre críticas de relatores da ONU e da sociedade civil pelo Artigo 7, que condiciona a aplicação dos direitos aos 'contextos nacionais e regionais' e à segurança nacional, sem criar comitê de petições individuais.",
    url: "https://asean.org/asean-human-rights-declaration/",
  },
  {
    id: "aichr-asean",
    nome: "Comissão Intergovernamental de Direitos Humanos da ASEAN (AICHR)",
    ano: 2009,
    tipo: "comissao_consultiva",
    vinculante: false,
    paisesAbrangidos: ["Filipinas", "Vietnã", "Indonésia", "Tailândia", "Malásia", "Camboja", "Laos", "Mianmar", "Singapura", "Brunei"],
    descricao: "Órgão consultivo intergovernamental da ASEAN composto por representantes indicados pelos respectivos governos. Funciona por consenso estrito, não recebe denúncias individuais de violações e não realiza visitas investigativas in loco sem anuência do país receptor.",
    url: "https://aichr.org/",
  },
];
