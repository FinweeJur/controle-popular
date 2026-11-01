/**
 * @file apps/web/lib/direitos-globais/onu/recomendacoes-upr.ts
 * @description Recomendações da Revisão Periódica Universal (UPR) e Órgãos de Tratados para os países da Leva 1.
 *
 * Fontes oficiais:
 * - Universal Human Rights Index (UHRI): uhri.ohchr.org
 * - UPR Info Database: upr-info.org
 * - OHCHR Treaty Bodies Concluding Observations
 *
 * Regra:
 * Apenas documentos com registro oficial no sistema da ONU.
 * "evidencia" só preenchida quando há relatório oficial do Estado ou da ONU confirmando a implementação;
 * caso contrário, evidencia: null e status não inferido.
 */

import type { Recomendacao, Status } from "../tipos-comuns";
import type { TipoDireito } from "../tipos";

export interface RecomendacaoONU extends Recomendacao {
  pais: string;
  cicloUpr?: string;
}

export const RECOMENDACOES_ONU_ASIA: readonly RecomendacaoONU[] = [
  // 1. CHINA
  {
    orgao: "UPR",
    documento: "Relatório do Grupo de Trabalho da UPR - 4º Ciclo (China)",
    sessao: "45ª Sessão da UPR",
    cicloUpr: "4º Ciclo",
    data: "2024-03-22",
    pais: "China",
    tema: "trabalho" as TipoDireito,
    texto: "Ratificar as Convenções nº 29 e nº 105 da OIT sobre trabalho forçado e extinguir todos os regimes de trabalho coercitivo em Xinjiang e outras regiões autônomas.",
    status: "parcial" as Status, // China ratificou as Convenções 29 e 105 em agosto de 2022, mas mecanismos de verificação independente continuam com acesso restrito
    evidencia: "Depósito dos instrumentos de ratificação das Convenções 29 e 105 da OIT junto à Repartição Internacional do Trabalho em 12/08/2022.",
    url: "https://www.ohchr.org/en/hr-bodies/upr/cn-index",
    estadoRecomendante: "Alemanha, Reino Unido e outros",
  },
  {
    orgao: "CESCR",
    documento: "Observações Conclusivas sobre o 3º Relatório Periódico da China",
    sessao: "73ª Sessão do CESCR",
    data: "2023-03-06",
    pais: "China",
    tema: "povos" as TipoDireito,
    texto: "Cessar imediatamente os programas de transferência compulsória de populações e reassentamento de nômades tibetanos, bem como o sistema de internatos compulsórios em língua mandarim que desmantela a transmissão cultural e linguística tibetana.",
    status: "nao" as Status, // Posição oficial do Estado rejeitando a qualificação de internatos forçados
    evidencia: null,
    url: "https://tbinternet.ohchr.org/_layouts/15/treatybodyexternal/Download.aspx?symbolno=E%2fC.12%2fCHN%2fCO%2f3&Lang=en",
  },

  // 2. RÚSSIA
  {
    orgao: "UPR",
    documento: "Relatório do Grupo de Trabalho da UPR - 4º Ciclo (Federação Russa)",
    sessao: "44ª Sessão da UPR",
    cicloUpr: "4º Ciclo",
    data: "2023-11-17",
    pais: "Rússia",
    tema: "politicos" as TipoDireito,
    texto: "Revogar a legislação restritiva sobre 'agentes estrangeiros' e 'organizações indesejáveis' que restringe a liberdade de associação, de imprensa e o trabalho legítimo de defensores de direitos humanos.",
    status: "nao" as Status, // Rússia rejeitou formalmente a recomendação no aditamento do relatório
    evidencia: null,
    url: "https://www.ohchr.org/en/hr-bodies/upr/ru-index",
    estadoRecomendante: "Noruega, Canadá, França",
  },
  {
    orgao: "CCPR",
    documento: "Observações Conclusivas sobre o 8º Relatório da Federação Russa",
    sessao: "136ª Sessão do Comitê de Direitos Humanos",
    data: "2022-11-03",
    pais: "Rússia",
    tema: "lgbtqia" as TipoDireito,
    texto: "Revogar todas as leis que criminalizam a chamada 'propaganda de relações sexuais não tradicionais' e garantir proteção integral contra crimes de ódio e perseguição a pessoas LGBTQIA+ no território federal e na Chechênia.",
    status: "nao" as Status, // Em novembro de 2023, a Suprema Corte russa declarou o 'movimento público internacional LGBT' como organização extremista
    evidencia: null,
    url: "https://tbinternet.ohchr.org/_layouts/15/treatybodyexternal/Download.aspx?symbolno=CCPR%2fC%2fRUS%2fCO%2f8&Lang=en",
  },

  // 3. ÍNDIA
  {
    orgao: "UPR",
    documento: "Recomendações da UPR - 4º Ciclo (Índia)",
    sessao: "41ª Sessão da UPR",
    cicloUpr: "4º Ciclo",
    data: "2022-11-10",
    pais: "Índia",
    tema: "humanos" as TipoDireito,
    texto: "Ratificar formalmente a Convenção contra a Tortura (UNCAT) e aprovar lei nacional abrangente que tipifique a tortura sob custódia policial.",
    status: "parcial" as Status, // Índia é signatária desde 1997 mas o projeto de lei contra tortura caducou sem votação final
    evidencia: "Projeto de Lei de Prevenção da Tortura aprovado pela Lok Sabha em 2010 mas não promulgado pela Rajya Sabha.",
    url: "https://www.ohchr.org/en/hr-bodies/upr/in-index",
    estadoRecomendante: "Suíça, Itália, Chile",
  },
  {
    orgao: "CEDAW",
    documento: "Observações Conclusivas sobre a Índia",
    sessao: "58ª Sessão da CEDAW",
    data: "2014-07-18",
    pais: "Índia",
    tema: "mulheres" as TipoDireito,
    texto: "Revogar a isenção de estupro marital no Artigo 375 do Código Penal e implementar fiscalização rigorosa contra a violência e exploração de mulheres de castas desfavorecidas (Dalits) e adivasis.",
    status: "parcial" as Status,
    evidencia: "Revisão judicial pendente na Suprema Corte da Índia (petição sobre criminalização do estupro conjugal de 2022/2023).",
    url: "https://tbinternet.ohchr.org/_layouts/15/treatybodyexternal/Download.aspx?symbolno=CEDAW%2fC%2fIND%2fCO%2f4-5&Lang=en",
  },

  // 4. FILIPINAS
  {
    orgao: "UPR",
    documento: "Recomendações da UPR - 4º Ciclo (Filipinas)",
    sessao: "41ª Sessão da UPR",
    cicloUpr: "4º Ciclo",
    data: "2022-11-14",
    pais: "Filipinas",
    tema: "memoria_verdade_justica" as TipoDireito,
    texto: "Investigar de maneira independente todas as alegações de execuções extrajudiciais no contexto das operações antidrogas e responsabilizar criminalmente os mandantes e executores.",
    status: "parcial" as Status,
    evidencia: "Criação do Painel de Revisão do Departamento de Justiça (DOJ) das Filipinas que indiciou policiais em casos emblemáticos (ex: Kian delos Santos).",
    url: "https://www.ohchr.org/en/hr-bodies/upr/ph-index",
    estadoRecomendante: "Espanha, Canadá, Austrália",
  },
  {
    orgao: "CMW",
    documento: "Observações Conclusivas sobre o 3º Relatório das Filipinas",
    sessao: "36ª Sessão do Comitê de Trabalhadores Migrantes",
    data: "2023-04-14",
    pais: "Filipinas",
    tema: "migrantes_refugiados" as TipoDireito,
    texto: "Fortalecer a atuação do recém-criado Departamento de Trabalhadores Migrantes (DMW) para combater taxas ilegais de recrutamento cobradas de trabalhadoras domésticas e prestar assistência jurídica a filipinos retidos em situação de abuso no exterior.",
    status: "cumprido" as Status, // Promulgação da Lei da República nº 11641 de 2021 criando formalmente o Department of Migrant Workers
    evidencia: "Criação e entrada em operação efetiva do Department of Migrant Workers (DMW) pela Republic Act No. 11641.",
    url: "https://tbinternet.ohchr.org/_layouts/15/treatybodyexternal/Download.aspx?symbolno=CMW%2fC%2fPHL%2fCO%2f3&Lang=en",
  },

  // 5. VIETNÃ
  {
    orgao: "UPR",
    documento: "Recomendações da UPR - 4º Ciclo (Vietnã)",
    sessao: "46ª Sessão da UPR",
    cicloUpr: "4º Ciclo",
    data: "2024-05-08",
    pais: "Vietnã",
    tema: "trabalho" as TipoDireito,
    texto: "Ratificar sem delongas a Convenção nº 87 da OIT sobre Liberdade Sindical e Proteção do Direito de Sindicalização e permitir a criação legal de sindicatos independentes dos trabalhadores.",
    status: "parcial" as Status, // Vietnã ratificou a Convenção 98 (negociação coletiva) em 2019 e a Convenção 105 em 2020, mas o cronograma de ratificação da Convenção 87 foi postergado para após 2025
    evidencia: "Código do Trabalho reformado em 2019 admitindo organizações representativas de base, sob regulamentação administrativa pendente.",
    url: "https://www.ohchr.org/en/hr-bodies/upr/vn-index",
    estadoRecomendante: "Suécia, Bélgica, Estados Unidos",
  },

  // 6. JAPÃO
  {
    orgao: "UPR",
    documento: "Recomendações da UPR - 4º Ciclo (Japão)",
    sessao: "42ª Sessão da UPR",
    cicloUpr: "4º Ciclo",
    data: "2023-01-31",
    pais: "Japão",
    tema: "migrantes_refugiados" as TipoDireito,
    texto: "Estabelecer um teto máximo de duração para a detenção administrativa de imigrantes em centros de controle e criar autoridade independente para análise de pedidos de refúgio conforme a Convenção de 1951.",
    status: "parcial" as Status,
    evidencia: "Reforma da Lei de Controle de Imigração e Reconhecimento de Refugiados aprovada em junho de 2023 pelo Parlamento do Japão (Diet).",
    url: "https://www.ohchr.org/en/hr-bodies/upr/jp-index",
    estadoRecomendante: "Alemanha, México, Nova Zelândia",
  },
  {
    orgao: "CERD",
    documento: "Observações Conclusivas sobre o Japão",
    sessao: "96ª Sessão do Comitê para Eliminação da Discriminação Racial",
    data: "2018-09-26",
    pais: "Japão",
    tema: "indigenas" as TipoDireito,
    texto: "Assegurar que a comunidade indígena Ainu tenha direitos de consulta prévia, livre e informada garantidos por lei sobre o uso tradicional de suas terras e recursos em Hokkaido.",
    status: "parcial" as Status,
    evidencia: "Promulgação da Lei de Promoção das Medidas para o Povo Ainu em 2019, que reconheceu formalmente os Ainu como povo indígena.",
    url: "https://tbinternet.ohchr.org/_layouts/15/treatybodyexternal/Download.aspx?symbolno=CERD%2fC%2fJPN%2fCO%2f10-11&Lang=en",
  },
];

export function recomendacoesPorPaisAsia(pais: string): readonly RecomendacaoONU[] {
  return RECOMENDACOES_ONU_ASIA.filter((r) => r.pais.toLowerCase() === pais.toLowerCase());
}

export function recomendacoesPorTemaAsia(tema: TipoDireito): readonly RecomendacaoONU[] {
  return RECOMENDACOES_ONU_ASIA.filter((r) => r.tema === tema);
}
