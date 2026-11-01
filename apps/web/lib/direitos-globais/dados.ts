/**
 * @file lib/direitos-globais/dados.ts
 * @Dados para o módulo de Direitos Globais.
 *
 * Dados de países, direitos e tratados internacionais para o comparador global.
 */

import { 
  Pais, 
  DireitoEspecifico, 
  TratadoInternacional, 
  Jurisprudencia, 
  DadosImplementacao,
  Continente,
  TipoDireito,
  NivelProtecao
} from "./tipos";

// Países da América Latina (início)
export const PAISES_AMERICA_LATINA: Pais[] = [
  {
    id: "brasil",
    nome: "Brasil",
    codigo: "BR",
    continente: "america-latina",
    subRegiao: "América do Sul",
    capital: "Brasília",
    idiomasOficiais: ["Português"],
    moeda: "Real",
    populacao: 213000000,
    area: 8514877,
    idh: 0.766,
    pibPerCapita: 8717,
    regimePolitico: "democracia",
    dataConstituicao: "1988-10-05",
    fontesJuridicas: ["constituicao", "lei_federal", "jurisprudencia", "tratado_internacional"]
  },
  {
    id: "argentina",
    nome: "Argentina",
    codigo: "AR",
    continente: "america-latina",
    subRegiao: "América do Sul",
    capital: "Buenos Aires",
    idiomasOficiais: ["Espanhol"],
    moeda: "Peso Argentino",
    populacao: 45000000,
    area: 2780400,
    idh: 0.845,
    pibPerCapita: 10800,
    regimePolitico: "democracia",
    dataConstituicao: "1853-05-01",
    fontesJuridicas: ["constituicao", "lei_federal", "jurisprudencia", "tratado_internacional"]
  },
  {
    id: "mexico",
    nome: "México",
    codigo: "MX",
    continente: "america-latina",
    subRegiao: "América do Norte",
    capital: "Cidade do México",
    idiomasOficiais: ["Espanhol"],
    moeda: "Peso Mexicano",
    populacao: 128000000,
    area: 1964375,
    idh: 0.774,
    pibPerCapita: 9927,
    regimePolitico: "democracia",
    dataConstituicao: "1917-02-05",
    fontesJuridicas: ["constituicao", "lei_federal", "jurisprudencia", "tratado_internacional"]
  },
  {
    id: "colombia",
    nome: "Colômbia",
    codigo: "CO",
    continente: "america-latina",
    subRegiao: "América do Sul",
    capital: "Bogotá",
    idiomasOficiais: ["Espanhol"],
    moeda: "Peso Colombiano",
    populacao: 51000000,
    area: 1141748,
    idh: 0.767,
    pibPerCapita: 6285,
    regimePolitico: "democracia",
    dataConstituicao: "1991-07-04",
    fontesJuridicas: ["constituicao", "lei_federal", "jurisprudencia", "tratado_internacional"]
  },
  {
    id: "chile",
    nome: "Chile",
    codigo: "CL",
    continente: "america-latina",
    subRegiao: "América do Sul",
    capital: "Santiago",
    idiomasOficiais: ["Espanhol"],
    moeda: "Peso Chileno",
    populacao: 19000000,
    area: 756102,
    idh: 0.851,
    pibPerCapita: 15311,
    regimePolitico: "democracia",
    dataConstituicao: "1980-09-11",
    fontesJuridicas: ["constituicao", "lei_federal", "jurisprudencia", "tratado_internacional"]
  },
  {
    id: "peru",
    nome: "Peru",
    codigo: "PE",
    continente: "america-latina",
    subRegiao: "América do Sul",
    capital: "Lima",
    idiomasOficiais: ["Espanhol", "Quíchua", "Aimara"],
    moeda: "Sol",
    populacao: 33000000,
    area: 1285216,
    idh: 0.777,
    pibPerCapita: 6992,
    regimePolitico: "democracia",
    dataConstituicao: "1993-12-31",
    fontesJuridicas: ["constituicao", "lei_federal", "jurisprudencia", "tratado_internacional"]
  },
  {
    id: "equador",
    nome: "Equador",
    codigo: "EC",
    continente: "america-latina",
    subRegiao: "América do Sul",
    capital: "Quito",
    idiomasOficiais: ["Espanhol", "Quíchua"],
    moeda: "Dólar Americano",
    populacao: 17600000,
    area: 283561,
    idh: 0.773,
    pibPerCapita: 6229,
    regimePolitico: "democracia",
    dataConstituicao: "2008-10-20",
    fontesJuridicas: ["constituicao", "lei_federal", "jurisprudencia", "tratado_internacional"]
  },
  {
    id: "bolivia",
    nome: "Bolívia",
    codigo: "BO",
    continente: "america-latina",
    subRegiao: "América do Sul",
    capital: "La Paz",
    idiomasOficiais: ["Espanhol", "Quíchua", "Aimara", "Guarani"],
    moeda: "Boliviano",
    populacao: 11600000,
    area: 1098581,
    idh: 0.703,
    pibPerCapita: 3414,
    regimePolitico: "democracia",
    dataConstituicao: "2009-01-15",
    fontesJuridicas: ["constituicao", "lei_federal", "jurisprudencia", "tratado_internacional"]
  },
  {
    id: "paraguai",
    nome: "Paraguai",
    codigo: "PY",
    continente: "america-latina",
    subRegiao: "América do Sul",
    capital: "Assunção",
    idiomasOficiais: ["Espanhol", "Guarani"],
    moeda: "Guaraní",
    populacao: 7100000,
    area: 406752,
    idh: 0.725,
    pibPerCapita: 5426,
    regimePolitico: "democracia",
    dataConstituicao: "1992-06-20",
    fontesJuridicas: ["constituicao", "lei_federal", "jurisprudencia", "tratado_internacional"]
  },
  {
    id: "uruguai",
    nome: "Uruguai",
    codigo: "UY",
    continente: "america-latina",
    subRegiao: "América do Sul",
    capital: "Montevidéu",
    idiomasOficiais: ["Espanhol"],
    moeda: "Peso Uruguaio",
    populacao: 3400000,
    area: 176215,
    idh: 0.817,
    pibPerCapita: 15978,
    regimePolitico: "democracia",
    dataConstituicao: "1967-02-27",
    fontesJuridicas: ["constituicao", "lei_federal", "jurisprudencia", "tratado_internacional"]
  },
  {
    id: "venezuela",
    nome: "Venezuela",
    codigo: "VE",
    continente: "america-latina",
    subRegiao: "América do Sul",
    capital: "Caracas",
    idiomasOficiais: ["Espanhol"],
    moeda: "Bolívar",
    populacao: 28000000,
    area: 916445,
    idh: 0.773,
    pibPerCapita: 10376,
    regimePolitico: "autoritario",
    dataConstituicao: "1999-12-30",
    fontesJuridicas: ["constituicao", "lei_federal", "jurisprudencia", "tratado_internacional"]
  },
  // ── América Central e Caribe ───────────────────────────────────────────────
  // Sem população, área e IDH de propósito: esses números ainda não foram
  // conferidos numa fonte primária. A tela mostra "em coleta" em vez de chutar.
  {
    id: "costa-rica",
    nome: "Costa Rica",
    codigo: "CR",
    continente: "america-latina",
    subRegiao: "América Central",
    capital: "San José",
    idiomasOficiais: ["Espanhol"],
    moeda: "Colón",
    regimePolitico: "democracia",
    dataConstituicao: "1949-11-07",
    fontesJuridicas: ["constituicao", "lei_federal", "jurisprudencia", "tratado_internacional"]
  },
  {
    id: "el-salvador",
    nome: "El Salvador",
    codigo: "SV",
    continente: "america-latina",
    subRegiao: "América Central",
    capital: "San Salvador",
    idiomasOficiais: ["Espanhol"],
    moeda: "Dólar Americano",
    regimePolitico: "democracia",
    dataConstituicao: "1983-12-20",
    fontesJuridicas: ["constituicao", "lei_federal", "jurisprudencia", "tratado_internacional"]
  },
  {
    id: "guatemala",
    nome: "Guatemala",
    codigo: "GT",
    continente: "america-latina",
    subRegiao: "América Central",
    capital: "Cidade da Guatemala",
    idiomasOficiais: ["Espanhol"],
    moeda: "Quetzal",
    regimePolitico: "democracia",
    dataConstituicao: "1985-05-31",
    fontesJuridicas: ["constituicao", "lei_federal", "jurisprudencia", "tratado_internacional"]
  },
  {
    id: "honduras",
    nome: "Honduras",
    codigo: "HN",
    continente: "america-latina",
    subRegiao: "América Central",
    capital: "Tegucigalpa",
    idiomasOficiais: ["Espanhol"],
    moeda: "Lempira",
    regimePolitico: "democracia",
    dataConstituicao: "1982-01-20",
    fontesJuridicas: ["constituicao", "lei_federal", "jurisprudencia", "tratado_internacional"]
  },
  {
    id: "nicaragua",
    nome: "Nicarágua",
    codigo: "NI",
    continente: "america-latina",
    subRegiao: "América Central",
    capital: "Manágua",
    idiomasOficiais: ["Espanhol"],
    moeda: "Córdoba",
    regimePolitico: "autoritario",
    dataConstituicao: "1987-01-09",
    fontesJuridicas: ["constituicao", "lei_federal", "jurisprudencia", "tratado_internacional"]
  },
  {
    id: "panama",
    nome: "Panamá",
    codigo: "PA",
    continente: "america-latina",
    subRegiao: "América Central",
    capital: "Cidade do Panamá",
    idiomasOficiais: ["Espanhol"],
    moeda: "Balboa",
    regimePolitico: "democracia",
    dataConstituicao: "1972-10-11",
    fontesJuridicas: ["constituicao", "lei_federal", "jurisprudencia", "tratado_internacional"]
  },
  {
    id: "cuba",
    nome: "Cuba",
    codigo: "CU",
    continente: "america-latina",
    subRegiao: "Caribe",
    capital: "Havana",
    idiomasOficiais: ["Espanhol"],
    moeda: "Peso Cubano",
    regimePolitico: "autoritario",
    dataConstituicao: "2019-04-10",
    fontesJuridicas: ["constituicao", "lei_federal", "jurisprudencia", "tratado_internacional"]
  },
  {
    id: "republica-dominicana",
    nome: "República Dominicana",
    codigo: "DO",
    continente: "america-latina",
    subRegiao: "Caribe",
    capital: "Santo Domingo",
    idiomasOficiais: ["Espanhol"],
    moeda: "Peso Dominicano",
    regimePolitico: "democracia",
    dataConstituicao: "2015-06-13",
    fontesJuridicas: ["constituicao", "lei_federal", "jurisprudencia", "tratado_internacional"]
  },
  {
    id: "haiti",
    nome: "Haiti",
    codigo: "HT",
    continente: "america-latina",
    subRegiao: "Caribe",
    capital: "Porto Príncipe",
    idiomasOficiais: ["Crioulo Haitiano", "Francês"],
    moeda: "Gourde",
    regimePolitico: "hibrido",
    dataConstituicao: "1987-03-29",
    fontesJuridicas: ["constituicao", "lei_federal", "jurisprudencia", "tratado_internacional"]
  }
];

// Direitos específicos com níveis de proteção
export const DIREITOS_ESPECIFICOS: DireitoEspecifico[] = [
  {
    id: "dh_humanos",
    tipo: "humanos",
    nome: "Direitos Humanos",
    descricao: "Direitos fundamentais inerentes a todos os seres humanos",
    nivelProtecao: "forte",
    fontes: ["constituicao", "tratado_internacional", "jurisprudencia"],
    implementacao: {
      legal: true,
      pratica: true,
      desafios: ["Implementação efetiva", "Falta de recursos", "Corrupção"]
    }
  },
  {
    id: "da_ambiental",
    tipo: "ambiental",
    nome: "Direito Ambiental",
    descricao: "Direito à proteção do meio ambiente e ao desenvolvimento sustentável",
    nivelProtecao: "forte",
    fontes: ["constituicao", "lei_federal", "tratado_internacional"],
    implementacao: {
      legal: true,
      pratica: false,
      desafios: ["Fiscalização deficiente", "Conflitos interesses", "Falta de políticas públicas"]
    }
  },
  {
    id: "dm_mulheres",
    tipo: "mulheres",
    nome: "Direito das Mulheres",
    descricao: "Direitos específicos das mulheres, igualdade de gênero e combate à violência",
    nivelProtecao: "moderado",
    fontes: ["constituicao", "lei_federal", "jurisprudencia"],
    implementacao: {
      legal: true,
      pratica: true,
      desafios: ["Violência de gênero", "Desigualdade salarial", "Falta de acessibilidade"]
    }
  },
  {
    id: "dn_natureza",
    tipo: "natureza",
    nome: "Direito da Natureza",
    descricao: "Direitos da natureza como sujeito de direitos",
    nivelProtecao: "fraco",
    fontes: ["constituicao", "lei_federal"],
    implementacao: {
      legal: true,
      pratica: false,
      desafios: ["Falta de implementação", "Conflitos econômicos", "Falta de conscientização"]
    }
  },
  {
    id: "di_indigenas",
    tipo: "indigenas",
    nome: "Direitos Indígenas",
    descricao: "Direitos específicos dos povos indígenas e terras tradicionais",
    nivelProtecao: "moderado",
    fontes: ["constituicao", "lei_federal", "tratado_internacional"],
    implementacao: {
      legal: true,
      pratica: false,
      desafios: ["Conflitos fundiários", "Falta de titulação", "Violência contra indígenas"]
    }
  },
  {
    id: "dc_campesinos",
    tipo: "campesinos",
    nome: "Direitos Campesinos",
    descricao: "Direitos dos trabalhadores rurais e reforma agrária",
    nivelProtecao: "fraco",
    fontes: ["constituicao", "lei_federal"],
    implementacao: {
      legal: true,
      pratica: false,
      desafios: ["Conflitos agrários", "Falta de políticas", "Violência no campo"]
    }
  },
  {
    id: "ab_barragens",
    tipo: "atingidos_barragens",
    nome: "Direitos dos Atingidos por Barragens",
    descricao: "Direitos de populações deslocadas por obras de barragens",
    nivelProtecao: "fraco",
    fontes: ["lei_federal", "jurisprudencia"],
    implementacao: {
      legal: true,
      pratica: false,
      desafios: ["Falta de reassentamento", "Dano ambiental", "Falta de compensação"]
    }
  }
];

// Tratados internacionais relevantes
export const TRATADOS_INTERNACIONAIS: TratadoInternacional[] = [
  {
    id: "dh_america",
    nome: "Convenção Americana de Direitos Humanos",
    tipo: "humanos",
    signatarios: ["Brasil", "Argentina", "México", "Colômbia", "Chile", "Peru", "Equador", "Bolívia", "Paraguai", "Uruguai", "Venezuela"],
    dataAssinatura: "1969-11-22",
    dataRatificacao: "1978-07-18",
    status: "ratificado",
    observacoes: "Pacto de San José da Costa Rica"
  },
  {
    id: "conv_maiute",
    nome: "Convenção sobre os Direitos dos Povos Indígenas",
    tipo: "indigenas",
    signatarios: ["Brasil", "Argentina", "Colômbia", "Peru", "Ecuador", "Bolívia"],
    dataAssinatura: "2007-09-13",
    dataRatificacao: "2009-01-15",
    status: "ratificado",
    observacoes: "Convenção 169 da OIT"
  },
  {
    id: "conv_brasilia",
    nome: "Convenção Interamericana de Direitos Humanos",
    tipo: "humanos",
    signatarios: ["Brasil", "Argentina", "México", "Colômbia", "Chile", "Peru", "Equador", "Bolívia", "Paraguai", "Uruguai"],
    dataAssinatura: "1969-11-22",
    dataRatificacao: "1992-09-25",
    status: "ratificado",
    observacoes: "Pacto de San José da Costa Rica"
  }
];

// Jurisprudência relevante
export const JURISPRUDENCIA_RELEVANTE: Jurisprudencia[] = [
  {
    id: "brasil_ambiental",
    tribunal: "STF",
    pais: "Brasil",
    tipoDireito: "ambiental",
    data: "2022-05-12",
    descricao: "Ação Direta de Inconstitucionalidade sobre políticas ambientais",
    importancia: "historica",
    resumo: "Decisão que fortaleceu a proteção ambiental e estabeleceu princípios de precaução"
  },
  {
    id: "argentina_indigenas",
    tribunal: "Corte Suprema",
    pais: "Argentina",
    tipoDireito: "indigenas",
    data: "2021-08-15",
    descricao: "Reconhecimento de terras indígenas",
    importancia: "alta",
    resumo: "Decisão que reconhece direitos territoriais de comunidades indígenas"
  },
  {
    id: "colombia_natureza",
    tribunal: "Constitucional",
    pais: "Colômbia",
    tipoDireito: "natureza",
    data: "2020-03-20",
    descricao: "Direito da natureza como sujeito de direitos",
    importancia: "historica",
    resumo: "Primeira decisão do mundo a reconhecer direitos da natureza"
  }
];

// Dados de implementação
export const DADOS_IMPLEMENTACAO: DadosImplementacao[] = [
  {
    pais: "Brasil",
    tipoDireito: "ambiental",
    marcoLegal: {
      data: "1988-10-05",
      descricao: "Constituição Federal - Art. 225",
      nivel: "forte"
    },
    indicadoresQuantitativos: {
      leisAprovadas: 245,
      politicasPublicas: 67,
      recursosAlocados: 1200000000,
      instituicoesResponsaveis: ["IBAMA", "ICMBio", "Ministério do Meio Ambiente"]
    },
    indicadoresQualitativos: {
      percepcaoSociedade: 65,
      coberturaGeografica: 78,
      impactoPopulacional: 72,
      desafiosImplementacao: ["Fiscalização deficiente", "Conflitos interesses", "Falta de recursos"]
    }
  },
  {
    pais: "Ecuador",
    tipoDireito: "natureza",
    marcoLegal: {
      data: "2008-10-20",
      descricao: "Constituição - Natureza como sujeito de direitos",
      nivel: "muito_forte"
    },
    indicadoresQuantitativos: {
      leisAprovadas: 89,
      politicasPublicas: 34,
      recursosAlocados: 450000000,
      instituicoesResponsaveis: ["Ministério do Ambiente", "Tribunais Ambientais"]
    },
    indicadoresQualitativos: {
      percepcaoSociedade: 85,
      coberturaGeografica: 92,
      impactoPopulacional: 78,
      desafiosImplementacao: ["Implementação prática", "Fiscalização", "Conflitos econômicos"]
    }
  }
];

// Funções utilitárias
export function getPaisesPorContinente(continente: Continente): Pais[] {
  return PAISES_AMERICA_LATINA.filter(pais => pais.continente === continente);
}

export function getDireitosPorTipo(tipo: TipoDireito): DireitoEspecifico[] {
  return DIREITOS_ESPECIFICOS.filter(direito => direito.tipo === tipo);
}

export function getTratadosPorDireito(tipo: TipoDireito): TratadoInternacional[] {
  return TRATADOS_INTERNACIONAIS.filter(tratado => tratado.tipo === tipo);
}

export function formatarPopulacao(populacao: number): string {
  if (populacao >= 1000000) {
    return `${(populacao / 1000000).toFixed(1)}M`;
  } else if (populacao >= 1000) {
    return `${(populacao / 1000).toFixed(1)}k`;
  }
  return populacao.toString();
}

export function formatarArea(area: number): string {
  if (area >= 1000000) {
    return `${(area / 1000000).toFixed(1)}M km²`;
  } else if (area >= 1000) {
    return `${(area / 1000).toFixed(1)}k km²`;
  }
  return `${area} km²`;
}

export function getNivelProtecaoLabel(nivel: NivelProtecao): string {
  const labels: Record<NivelProtecao, string> = {
    inexistente: "Inexistente",
    fraco: "Fraco",
    moderado: "Moderado",
    forte: "Forte",
    muito_forte: "Muito Forte"
  };
  return labels[nivel];
}