import acoesJuma from "@/data/juma-acoes-climaticas.json";
import { carregarSirenejudMg, type MunicipioSirenejud } from "@/lib/ambiental/sirenejud-dados";

export interface AcaoClimaticaJuma {
  id: string;
  titulo: string;
  numeroProcesso: string;
  tribunal: string;
  uf: string;
  municipios: string[];
  tipoAcao: string;
  poloAtivo: string;
  poloPassivo: string;
  bioma: string;
  setorEmissao: string;
  status: string;
  resumo: string;
  principaisNormas: string[];
  linkOficial: string;
}

export interface TeseJurisprudenciaTJMG {
  id: string;
  numeroOuReferencia: string;
  tema: string;
  tribunal: "TJMG" | "TRF-6" | "STJ";
  enunciadoResumido: string;
  impactoParaAtingidos: string;
  baciaOuConflito: string;
  fontePesquisa: string;
}

export const ACOES_JUMA: AcaoClimaticaJuma[] = acoesJuma as AcaoClimaticaJuma[];

export const TESES_TJMG_BARRAGENS: TeseJurisprudenciaTJMG[] = [
  {
    id: "tjmg-dano-agua-in-re-ipsa",
    numeroOuReferencia: "Tema Repetitivo TJMG nº 53 / IRDR",
    tema: "Interrupção Prolongada do Fornecimento de Água Potável",
    tribunal: "TJMG",
    enunciadoResumido:
      "O desabastecimento prolongado de água potável decorrente de contaminação por lama de rejeitos de minério gera dano moral presumido (in re ipsa), dispensando o cidadão de comprovar abalo psicológico individual.",
    impactoParaAtingidos:
      "Garante direito à indenização por dano moral para todos os residentes das cidades atingidas pelo corte de abastecimento, como Governador Valadares, Mariana e municípios do Paraopeba.",
    baciaOuConflito: "Bacia do Rio Doce e Bacia do Paraopeba",
    fontePesquisa: "Pesquisa Jurisprudencial NACAB / Jurisprudência Uniformizada TJMG",
  },
  {
    id: "tjmg-inversao-onus-prova",
    numeroOuReferencia: "Enunciado Cível / Princípio da Precaução",
    tema: "Inversão do Ônus da Prova e Vulnerabilidade Técnica",
    tribunal: "TJMG",
    enunciadoResumido:
      "Em ações indenizatórias socioambientais contra mineradoras, aplica-se a inversão do ônus da prova em favor dos atingidos, cabendo à mineradora comprovar que suas barragens ou emissões não causaram o dano.",
    impactoParaAtingidos:
      "Protege famílias ribeirinhas e pequenos produtores rurais da exigência de laudos periciais caros e complexos.",
    baciaOuConflito: "Desastres da Samarco (Mariana) e Vale (Brumadinho)",
    fontePesquisa: "Relatório de Pesquisa Jurisprudencial NACAB",
  },
  {
    id: "tjmg-pescadores-sem-rgp",
    numeroOuReferencia: "Súmula e Precedentes de Câmaras Cíveis",
    tema: "Legitimidade de Pescadores e Lavradores Informais",
    tribunal: "TJMG",
    enunciadoResumido:
      "A falta de registro formal no Registro Geral da Atividade Pesqueira (RGP) não afasta o direito à indenização por lucros cessantes de pescadores artesanais e ribeirinhos cuja atividade de subsistência foi interrompida pela lama.",
    impactoParaAtingidos:
      "Permite comprovação da condição de atingido por testemunhas, fotos, declarações de colônias ou cadastros de saúde pública.",
    baciaOuConflito: "Calha do Rio Doce e Calha do Rio Paraopeba",
    fontePesquisa: "Pesquisa Jurisprudencial NACAB / TRF-6",
  },
  {
    id: "trf6-responsabilidade-solidaria",
    numeroOuReferencia: "Ação Civil Pública Originária nº 1023772",
    tema: "Responsabilidade Solidária de Controladoras Estrangeiras",
    tribunal: "TRF-6",
    enunciadoResumido:
      "As empresas controladoras e acionistas controladoras (Vale e BHP Billiton) respondem de forma solidária e ilimitada pela recuperação socioambiental integral e financiamento da assessoria técnica independente às comunidades atingidas.",
    impactoParaAtingidos:
      "Impede que a operadora imediata (ex.: Samarco) alegue insolvência financeira para frustrar o pagamento de indenizações.",
    baciaOuConflito: "Repactuação da Bacia do Rio Doce",
    fontePesquisa: "4ª Vara Federal de Belo Horizonte / TRF-6",
  },
  {
    id: "tjmg-nulidade-quitacao-ampla",
    numeroOuReferencia: "Precedentes das Câmaras de Direito Privado",
    tema: "Nulidade de Quitação Geral Abusiva",
    tribunal: "TJMG",
    enunciadoResumido:
      "São nulas as cláusulas de quitação irrestrita e definitiva em acordos extrajudiciais que busquem impedir o ajuizamento de ações sobre danos à saúde crônicos ou contaminações por metais pesados constatadas posteriormente.",
    impactoParaAtingidos:
      "Permite que pessoas que receberam auxílios emergenciais continuem pleiteando tratamento de saúde e indenizações por sequelas físicas.",
    baciaOuConflito: "Brumadinho, Mariana, Betim e Barra Longa",
    fontePesquisa: "Pesquisa Jurisprudencial NACAB / MPMG",
  },
];

/**
 * Retorna todas as ações climáticas do Portal Juma.
 */
export function listarAcoesClimaticasJuma(): AcaoClimaticaJuma[] {
  return ACOES_JUMA;
}

/**
 * Filtra ações climáticas do Juma por município ou estado.
 */
export function acoesJumaPorMunicipioOuUf(termo: string): AcaoClimaticaJuma[] {
  const norm = termo.trim().toLowerCase();
  return ACOES_JUMA.filter(
    (a) =>
      a.uf.toLowerCase() === norm ||
      a.municipios.some((m) => m.toLowerCase().includes(norm) || norm.includes(m.toLowerCase()))
  );
}

/**
 * Retorna as teses pacificadas do TJMG e TRF-6 sobre barragens e dano ambiental.
 */
export function listarTesesTJMG(): TeseJurisprudenciaTJMG[] {
  return TESES_TJMG_BARRAGENS;
}

/**
 * Retorna dados processuais ambientais do SIRENEJud (CNJ) para um município.
 */
export function processosSirenejudPorMunicipio(nomeOuIbge: string): MunicipioSirenejud | null {
  const base = carregarSirenejudMg();
  if (!base) return null;

  const norm = nomeOuIbge.trim().toLowerCase();
  const match = base.municipios.find(
    (m) =>
      m.cod_ibge === nomeOuIbge ||
      (m.municipio && m.municipio.toLowerCase().includes(norm))
  );

  return match ?? null;
}

/**
 * Retorna o panorama judiciário socioambiental integrado para uma cidade.
 */
export function obterPanoramaJudicial(cidadeNome: string, codigoIbge?: string) {
  const acoesJumaLocal = acoesJumaPorMunicipioOuUf(cidadeNome);
  const sirenejudLocal = processosSirenejudPorMunicipio(codigoIbge ?? cidadeNome);
  const tesesAplicaveis = TESES_TJMG_BARRAGENS.filter(
    (t) =>
      t.baciaOuConflito.toLowerCase().includes(cidadeNome.toLowerCase()) ||
      t.impactoParaAtingidos.toLowerCase().includes(cidadeNome.toLowerCase())
  );

  return {
    cidade: cidadeNome,
    acoesClimaticasJuma: acoesJumaLocal,
    sirenejudProcessos: sirenejudLocal,
    tesesTJMG: tesesAplicaveis.length > 0 ? tesesAplicaveis : TESES_TJMG_BARRAGENS.slice(0, 2),
  };
}
