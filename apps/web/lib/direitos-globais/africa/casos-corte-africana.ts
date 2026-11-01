/**
 * @file apps/web/lib/direitos-globais/africa/casos-corte-africana.ts
 * @description Casos de mérito e decisões paradigmáticas da Corte Africana e Comissão Africana (ACHPR).
 *
 * Fontes primárias:
 * - Corte Africana dos Direitos Humanos e dos Povos (african-court.org / acrhpr.org)
 * - Comissão Africana dos Direitos Humanos e dos Povos (achpr.org)
 *
 * Regra editorial estrita:
 * - Nenhuma dedução subjetiva de cumprimento. Sem relatório oficial declarando cumprimento integral,
 *   o status é classificado como "parcial", "descumprido" ou "desconhecido".
 * - Cada acórdão possui link oficial direto para a decisão.
 */

import type { Caso, Cumprimento } from "../tipos-comuns";
import type { TipoDireito } from "../tipos";

export interface CasoAfricano extends Caso {
  pais: string;
  temaPrincipal: TipoDireito;
  orgaoJulgador: "Corte Africana" | "Comissão Africana";
}

export const CASOS_AFRICANOS: readonly CasoAfricano[] = [
  {
    tribunal: "Corte Africana",
    orgaoJulgador: "Corte Africana",
    pais: "Quênia",
    numero: "006/2012",
    partes: "Comissão Africana (Comunidade Indígena Ogiek) c. República do Quênia",
    data: "2017-05-26",
    artigos: ["Carta Africana, arts. 1, 2, 8, 14, 17(2), 17(3), 21 e 22"],
    reparacoes: [
      "Demarcação e titulação coletiva das terras ancestrais da Floresta Mau",
      "Indenização pecuniária por danos materiais e morais à comunidade",
      "Criação de fundo de desenvolvimento comunitário",
      "Reconhecimento pleno do estatuto de povo indígena aos Ogiek",
    ],
    cumprimento: "parcial" as Cumprimento, // O Quênia criou força-tarefa em 2018 mas não concluiu a demarcação das terras
    url: "https://www.african-court.org/cpmt/storage/app/uploads/public/5f4/62f/f10/5f462ff104df5366479075.pdf",
    resumoOficial: "Decisão histórica reconhecendo os direitos territoriais ancestrais, culturais e de recursos naturais do povo Ogiek sobre a Floresta Mau, condenando despejos forçados promovidos pelo Estado.",
    temaPrincipal: "povos" as TipoDireito,
  },
  {
    tribunal: "Corte Africana",
    orgaoJulgador: "Corte Africana",
    pais: "Burkina Faso",
    numero: "013/2011",
    partes: "Beneficiários do Falecido Norbert Zongo e outros c. Burkina Faso",
    data: "2014-03-28",
    artigos: ["Carta Africana, art. 7 (Julgamento justo)", "Carta Africana, art. 9 (Liberdade de expressão)", "Tratado CEDEAO, art. 66"],
    reparacoes: [
      "Reabertura e conclusão célere das investigações sobre o assassinato do jornalista Norbert Zongo",
      "Pagamento de reparações pecuniárias aos familiares das vítimas",
      "Publicação oficial da sentença da Corte nos diários oficiais",
    ],
    cumprimento: "parcial" as Cumprimento, // Reparações pecuniárias depositadas em 2015, mas a extradição e conclusão penal permaneceram pendentes
    url: "https://www.african-court.org/cpmt/storage/app/uploads/public/5f4/503/48a/5f450348ae2b8193855598.pdf",
    resumoOficial: "Condenação do Estado por inação judicial deliberada e impunidade durante mais de 15 anos no homicídio do jornalista investigativo Norbert Zongo e seus companheiros.",
    temaPrincipal: "memoria_verdade_justica" as TipoDireito,
  },
  {
    tribunal: "Corte Africana",
    orgaoJulgador: "Corte Africana",
    pais: "Burkina Faso",
    numero: "004/2013",
    partes: "Lohé Issa Konaté c. Burkina Faso",
    data: "2014-12-05",
    artigos: ["Carta Africana, art. 9", "Pacto Internacional de Direitos Civis e Políticos (ICCPR), art. 19"],
    reparacoes: [
      "Revogação das penas de prisão privativas de liberdade para crimes de difamação e injúria de imprensa",
      "Adequação da legislação penal às normas internacionais de direitos humanos",
      "Reparação pecuniária pelo período de encarceramento indevido",
    ],
    cumprimento: "cumprido" as Cumprimento, // Em 2015, Burkina Faso reformou o Código Penal eliminando a pena de prisão para difamação pela Lei nº 086-2015
    url: "https://www.african-court.org/cpmt/storage/app/uploads/public/5f4/501/249/5f4501249911e289659341.pdf",
    resumoOficial: "Determinou que penas de prisão por difamação violam a liberdade de expressão da Carta Africana. Cumprido pelo Estado mediante a promulgação da Lei nº 086-2015 de reforma do Código Penal.",
    temaPrincipal: "politicos" as TipoDireito,
  },
  {
    tribunal: "Corte Africana",
    orgaoJulgador: "Corte Africana",
    pais: "Costa do Marfim",
    numero: "001/2014",
    partes: "Actions pour la Protection des Droits de l'Homme (APDH) c. República da Costa do Marfim",
    data: "2016-11-18",
    artigos: ["Carta Africana sobre Democracia, Eleições e Governança (ACDEG), art. 17", "Protocolo da CEDEAO sobre Democracia, art. 3", "Carta Africana, art. 10 e 13"],
    reparacoes: [
      "Modificação da Lei nº 2014-335 sobre a composição da Comissão Eleitoral Independente (CEI)",
      "Garantia de paridade e equilíbrio real entre forças governistas e de oposição no órgão eleitoral",
    ],
    cumprimento: "parcial" as Cumprimento, // Reforma legislativa aprovada em 2019, questionada em caso de seguimento em 2020
    url: "https://www.african-court.org/cpmt/storage/app/uploads/public/5f4/501/676/5f4501676d654523910302.pdf",
    resumoOficial: "Primeira sentença de mérito aplicando a Carta Africana sobre Democracia (ACDEG), fixando que órgãos de administração eleitoral devem ser estruturalmente imparciais e independentes do Executivo.",
    temaPrincipal: "politicos" as TipoDireito,
  },
  {
    tribunal: "Corte Africana",
    orgaoJulgador: "Corte Africana",
    pais: "Tanzânia",
    numero: "012/2015",
    partes: "Anudo Ochieng Anudo c. República Unida da Tanzânia",
    data: "2018-03-22",
    artigos: ["Carta Africana, art. 7 (Devido processo)", "Declaração Universal, art. 15 (Direito à nacionalidade)", "Pacto ICCPR, art. 12(4)"],
    reparacoes: [
      "Restauração imediata da nacionalidade e dos documentos de identidade do requerente",
      "Permissão de retorno seguro ao território tanzaniano sem ameaça de nova deportação",
      "Compensação pecuniária por danos morais decorrentes do desterro arbitrário",
    ],
    cumprimento: "descumprido" as Cumprimento, // Tanzânia não readmitiu o requerente e em seguida revogou sua declaração do art. 34(6) em novembro de 2019
    url: "https://www.african-court.org/cpmt/storage/app/uploads/public/5f4/505/23b/5f450523bc784606213759.pdf",
    resumoOficial: "Julgou arbitrária a privação de nacionalidade e expulsão sumária de cidadão sem processo judicial contraditório prévio, violando garantias fundamentais da Carta Africana.",
    temaPrincipal: "migrantes_refugiados" as TipoDireito,
  },
  {
    tribunal: "Corte Africana",
    orgaoJulgador: "Corte Africana",
    pais: "Tanzânia",
    numero: "008/2016",
    partes: "Alli Rajabu e outros c. República Unida da Tanzânia",
    data: "2019-11-28",
    artigos: ["Carta Africana, art. 4 (Direito à vida)", "Carta Africana, art. 5 (Proibição de penas cruéis)"],
    reparacoes: [
      "Eliminação da pena de morte mandatória (obrigatória) no Código Penal tanzaniano",
      "Realização de novas audiências de dosimetria individualizada de pena para os condenados",
      "Garantia de recurso com assistência judiciária gratuita",
    ],
    cumprimento: "descumprido" as Cumprimento, // A Tanzânia não alterou o Código Penal e manteve o dispositivo da pena capital obrigatória
    url: "https://www.african-court.org/cpmt/storage/app/uploads/public/5f4/506/177/5f4506177eeef980145291.pdf",
    resumoOficial: "Decidiu que a imposição automática de pena de morte por homicídio, sem avaliação judicial discricionária das circunstâncias atenuantes do réu, constitui privação arbitrária da vida.",
    temaPrincipal: "humanos" as TipoDireito,
  },
  {
    tribunal: "Corte Africana",
    orgaoJulgador: "Corte Africana",
    pais: "Gana",
    numero: "016/2017",
    partes: "Dexter Eddie Johnson c. República de Gana",
    data: "2019-03-28",
    artigos: ["Carta Africana, art. 4 (Direito à vida)", "Carta Africana, art. 5 (Integridade e dignidade)"],
    reparacoes: [
      "Extinção da pena capital obrigatória",
      "Revisão judicial da sentença do requerente",
    ],
    cumprimento: "cumprido" as Cumprimento, // Em julho de 2023, o Parlamento de Gana aprovou a Lei de Emenda ao Código Penal abolindo totalmente a pena de morte no país
    url: "https://www.african-court.org/cpmt/storage/app/uploads/public/5f4/505/a91/5f4505a91ee59419088612.pdf",
    resumoOficial: "Abordou a aplicação compulsória da pena de morte no direito ganês. Cumprido pelo Estado com a aprovação pelo Parlamento da Lei de Emenda ao Código Penal de 2023 abolindo a pena de morte.",
    temaPrincipal: "humanos" as TipoDireito,
  },
  {
    tribunal: "Corte Africana",
    orgaoJulgador: "Corte Africana",
    pais: "Benin",
    numero: "013/2017",
    partes: "Sébastien Germain Marie Aïkoue Ajavon c. República do Benin",
    data: "2019-03-29",
    artigos: ["Carta Africana, art. 7 (Garantias judiciais)", "Carta Africana, art. 14 (Propriedade privada)"],
    reparacoes: [
      "Anulação do julgamento realizado pelo Tribunal Especial CRIET sem duplo grau de jurisdição",
      "Devolução dos bens e licenças empresariais confiscados",
      "Indenização pecuniária por perdas materiais decorrentes de perseguição política",
    ],
    cumprimento: "descumprido" as Cumprimento, // Benin recusou o cumprimento da decisão e em março de 2020 protocolou a revogação da declaração do art. 34(6)
    url: "https://www.african-court.org/cpmt/storage/app/uploads/public/5f4/505/cb1/5f4505cb19dd8818817281.pdf",
    resumoOficial: "Anulou condenação imposta por tribunal de exceção sem garantias plenas de contraditório e duplo grau recursal, evidenciando instrumentalização penal contra opositores.",
    temaPrincipal: "politicos" as TipoDireito,
  },
  {
    tribunal: "Comissão Africana",
    orgaoJulgador: "Comissão Africana",
    pais: "Quênia",
    numero: "276/2003",
    partes: "Centro para o Desenvolvimento dos Direitos das Minorias e outro (Comunidade Endorois) c. Quênia",
    data: "2010-02-04",
    artigos: ["Carta Africana, art. 8 (Religião)", "art. 14 (Propriedade)", "art. 17 (Cultura)", "art. 21 (Recursos naturais)", "art. 22 (Desenvolvimento)"],
    reparacoes: [
      "Reconhecimento da posse tradicional sobre as terras ao redor do Lago Bogoria",
      "Restituição das terras ancestrais aos Endorois",
      "Pagamento de royalties pela exploração turística e minerária no Lago Bogoria",
      "Indenização pelas perdas de gado e meios de subsistência sofridas na expulsão",
    ],
    cumprimento: "parcial" as Cumprimento, // Quênia registrou o grupo em comissões mas não concluiu a demarcação fundiária integral nem pagou os royalties exigidos
    url: "https://achpr.org/public/Document/file/English/achpr46_276_03_eng.pdf",
    resumoOficial: "Decisão pioneira mundial sobre o Artigo 22 (Direito ao Desenvolvimento) e Artigo 21 (Recursos Naturais), assentando que a expulsão de comunidades indígenas para criar parques turísticos sem consentimento livre, prévio e informado e sem repartição de benefícios viola a Carta Africana.",
    temaPrincipal: "povos" as TipoDireito,
  },
  {
    tribunal: "Comissão Africana",
    orgaoJulgador: "Comissão Africana",
    pais: "Nigéria",
    numero: "155/1996",
    partes: "Social and Economic Rights Action Center (SERAC) e CESR c. Nigéria",
    data: "2001-10-27",
    artigos: ["Carta Africana, art. 2 (Não discriminação)", "art. 4 (Vida)", "art. 14 (Propriedade)", "art. 16 (Saúde)", "art. 18 (Família)", "art. 21 (Recursos naturais)", "art. 24 (Meio ambiente)"],
    reparacoes: [
      "Paralisação imediata dos ataques militares e policiais contra comunidades Ogoni",
      "Limpeza integral e remediação ambiental da bacia e manguezais do Delta do Níger",
      "Compensação financeira às vítimas de contaminação e violência",
      "Realização obrigatória de auditorias ambientais independentes para operações de petróleo",
    ],
    cumprimento: "parcial" as Cumprimento, // Projeto HYPREP criado com suporte da ONU/UNEP para limpeza de Ogoniland, mas com atrasos e cumprimento ainda parcial
    url: "https://achpr.org/public/Document/file/English/achpr29_155_96_eng.pdf",
    resumoOficial: "Decisão fundamental da Comissão Africana sobre direitos das populações atingidas por indústrias extrativas e grandes empreendimentos. Fixou as obrigações estatais de proteger contra poluição cometida por transnacionais petrolíferas e assegurar o direito a um meio ambiente sadio (Art. 24) e à saúde (Art. 16).",
    temaPrincipal: "atingidos_empreendimentos" as TipoDireito,
  },
  {
    tribunal: "Comissão Africana",
    orgaoJulgador: "Comissão Africana",
    pais: "República Democrática do Congo",
    numero: "227/1999",
    partes: "República Democrática do Congo c. Burundi, Ruanda e Uganda",
    data: "2003-05-29",
    artigos: ["Carta Africana, art. 19 (Igualdade dos povos)", "art. 20 (Autodeterminação)", "art. 21 (Recursos naturais)", "art. 22 (Desenvolvimento)", "art. 23 (Paz e segurança)"],
    reparacoes: [
      "Retirada incondicional de tropas estrangeiras ocupantes",
      "Reparações por saques sistemáticos de recursos minerais (coltán, ouro, diamantes)",
      "Responsabilização por massacres e abusos sexuais sistemáticos",
    ],
    cumprimento: "parcial" as Cumprimento, // Julgamento perante a CIJ e processos parciais de compensação
    url: "https://achpr.org/public/Document/file/English/achpr33_227_99_eng.pdf",
    resumoOficial: "Comunicação interestatal paradigmática afirmando que a ocupação armada militar e o saque de recursos naturais violam a soberania popular inalienável sobre as riquezas do solo (Art. 21) e o direito fundamental dos povos à paz e à segurança (Art. 23).",
    temaPrincipal: "povos" as TipoDireito,
  },
  {
    tribunal: "Comissão Africana",
    orgaoJulgador: "Comissão Africana",
    pais: "Chade",
    numero: "074/1992",
    partes: "Commission Nationale des Droits de l'Homme et des Libertés c. Chade",
    data: "1995-10-11",
    artigos: ["Carta Africana, art. 4 (Vida)", "art. 5 (Tortura)", "art. 6 (Liberdade)", "art. 7 (Julgamento justo)"],
    reparacoes: [
      "Fim das execuções extrajudiciais e desaparecimentos forçados",
      "Investigação e julgamento dos responsáveis por crimes da polícia política",
      "Indenização estatal aos familiares das vítimas",
    ],
    cumprimento: "parcial" as Cumprimento, // Processo das Câmaras Extraordinárias Africanas no Senegal resultou na condenação de Hissène Habré em 2016
    url: "https://achpr.org/public/Document/file/English/achpr18_74_92_eng.pdf",
    resumoOficial: "Primeira grande condenação de Estado autoritário na África por desaparecimentos forçados maciços, assentando a responsabilidade internacional do Estado mesmo em períodos de conflito civil interno.",
    temaPrincipal: "memoria_verdade_justica" as TipoDireito,
  },
];

export function casosPorPaisAfrica(pais: string): readonly CasoAfricano[] {
  return CASOS_AFRICANOS.filter((c) => c.pais.toLowerCase() === pais.toLowerCase());
}

export function casosPorTemaAfrica(tema: TipoDireito): readonly CasoAfricano[] {
  return CASOS_AFRICANOS.filter((c) => c.temaPrincipal === tema);
}

export function casosPorOrgaoAfrica(orgao: "Corte Africana" | "Comissão Africana"): readonly CasoAfricano[] {
  return CASOS_AFRICANOS.filter((c) => c.orgaoJulgador === orgao);
}
