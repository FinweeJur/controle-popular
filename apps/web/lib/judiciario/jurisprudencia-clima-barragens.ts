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
  linkFonte: string;
  linkPortal: string;
}

export const ACOES_JUMA: AcaoClimaticaJuma[] = acoesJuma as AcaoClimaticaJuma[];

export const LINK_PAINEL_LITIGIOS =
  "https://www.controlepopular.com.br/ambiental/litigios-climaticos";

export const TESES_TJMG_BARRAGENS: TeseJurisprudenciaTJMG[] = [
  {
    id: "tjmg-dano-agua-in-re-ipsa",
    numeroOuReferencia:
      "Tema 41 — IRDR TJMG nº 1.0273.16.000131-2/001 (julgado em 24/10/2019)",
    tema: "Interrupção Prolongada do Fornecimento de Água Potável",
    tribunal: "TJMG",
    enunciadoResumido:
      "A suspensão do fornecimento de água potável por vários dias, ou o fornecimento de água contaminada após o rompimento da barragem de Fundão, caracteriza dano moral; a mera dúvida subjetiva sobre a qualidade, por si só, não gera dano (tese 3 do Tema 41).",
    impactoParaAtingidos:
      "Fixa legitimidade e parâmetros de indenização para residentes em localidades abastecidas pelo Rio Doce; em pedido genérico, o TJMG arbitraram R$ 2.000,00 por pessoa (tese 5).",
    baciaOuConflito: "Bacia do Rio Doce e Bacia do Paraopeba",
    fontePesquisa:
      "Portal TJMG, Tema 41 IRDR (acórdão de mérito 12/12/2019); tema relacionado 101 (COPASA/Nova Serrana, IRDR nº 1.0000.23.138516-2/001)",
    linkFonte:
      "https://www.tjmg.jus.br/portal-tjmg/jurisprudencia/recurso-repetitivo-e-repercussao-geral/legitimidade-ativa-indenizacao-moral-decorrente-da-interrupcao-do-fornecimento-de-agua-e-ou-duvida-quanto-a-sua-qualidade-apos-o-retorno-da-distribuicao-em-razao-do-rompimento-da-barragem-de-fundao-em-mariana-tema-41-irdr-tjmg-1.htm",
    linkPortal: LINK_PAINEL_LITIGIOS,
  },
  {
    id: "tjmg-inversao-onus-prova",
    numeroOuReferencia:
      "ACP Mariana nº 0400.15.004335-6, Cláusula 7ª do TTAC (02/10/2018); Súmula 618/STJ",
    tema: "Inversão do Ônus da Prova e Vulnerabilidade Técnica",
    tribunal: "TJMG",
    enunciadoResumido:
      "Nas fases de negociação e liquidação da ACP de Mariana, as rés reconhecem a vulnerabilidade processual e probatória dos atingidos e asseguram a inversão do ônus da prova em favor deles (art. 6º, VIII, do CDC). A Súmula 618/STJ aplica a inversão às ações de degradação ambiental.",
    impactoParaAtingidos:
      "Protege famílias ribeirinhas e pequenos produtores rurais da exigência de laudos periciais caros e complexos.",
    baciaOuConflito: "Desastres da Samarco (Mariana) e Vale (Brumadinho)",
    fontePesquisa:
      "MPMG (Promotoria de Mariana) e pesquisa Jurisprudencial NACAB; Súmula 618/STJ",
    linkFonte:
      "https://www.migalhas.com.br/arquivos/2021/10/EFE568201F3EDE_mpmg.pdf",
    linkPortal: LINK_PAINEL_LITIGIOS,
  },
  {
    id: "tjmg-pescadores-sem-rgp",
    numeroOuReferencia:
      "Apelação Cível nº 1.0521.16.005494-1/006, 12ª Câmara Cível, 11/11/2021",
    tema: "Legitimidade de Pescadores e Lavradores Informais",
    tribunal: "TJMG",
    enunciadoResumido:
      "Pescadores profissionais com carteira vencida ou irregularidade administrativa seguem legítimos para indenização; a interrupção da pesca gera lucros cessantes e dano moral (acórdãos 1.0521.16.005494-1/006 e 1.0521.17.006159-7/003). A pesca amadorística gera ao menos dano moral (1.0000.25.037833-8/001).",
    impactoParaAtingidos:
      "Permite comprovação da condição de atingido por testemunhas, fotos, declarações de colônias ou cadastros de saúde pública.",
    baciaOuConflito: "Calha do Rio Doce e Calha do Rio Paraopeba",
    fontePesquisa:
      "Acórdãos TJMG 12ª Câmara (Ponte Nova) e pesquisa Jurisprudencial NACAB",
    linkFonte:
      "https://www.conjur.com.br/wp-content/uploads/2023/09/pescadores-atingidos-desastre-receber.pdf",
    linkPortal: LINK_PAINEL_LITIGIOS,
  },
  {
    id: "trf6-responsabilidade-solidaria",
    numeroOuReferencia:
      "ACP nº 1023772-40.2021.4.01.3800 (TRF-6 / 4ª Vara Federal de MG)",
    tema: "Plano Climático e de Desastres para a Bacia do Rio Doce",
    tribunal: "TRF-6",
    enunciadoResumido:
      "Ação civil pública que exige da União e de MG a implementação de plano de adaptação e prevenção a desastres climáticos e hídricos em toda a calha do Rio Doce, diante da vulnerabilidade de cidades ribeirinhas a inundações e deslizamentos associados a rejeitos de minério.",
    impactoParaAtingidos:
      "Busca obrigação estatal de prevenção que protege municípios da bacia antes de novo evento extremo; a responsabilidade solidária de controladoras por reparação integral aparece nos demais litígios da repactuação (ex.: acórdãos TJMG de pescadores).",
    baciaOuConflito: "Repactuação da Bacia do Rio Doce",
    fontePesquisa: "Portal Juma (PUC-Rio/LACLIMA) / TRF-6 — processo 1023772-40.2021.4.01.3800",
    linkFonte: "https://plataformajuma.jur.puc-rio.br",
    linkPortal: LINK_PAINEL_LITIGIOS,
  },
  {
    id: "tjmg-nulidade-quitacao-ampla",
    numeroOuReferencia:
      "AJRI Acordo de Brumadinho (SEI nº 012220159.2020.8.13.0000); pesquisa NACAB",
    tema: "Risco de Quitação Geral Abusiva em Acordos Extrajudiciais",
    tribunal: "TJMG",
    enunciadoResumido:
      "A pesquisa NACAB e o AJRI de Brumadinho documentam o risco de cláusulas de quitação irrestrita em acordos extrajudiciais que impeçam reclamar por danos à saúde posteriores. O STJ, no REsp 2231199, validou quitação ampla em caso concreto — a controvérsia segue aberta; quem alega nulidade precisa de prova de vício do consentimento ou de lesão.",
    impactoParaAtingidos:
      "Permite que pessoas que receberam auxílios emergenciais continuem pleiteando tratamento de saúde e indenizações por sequelas, quando demonstrado vício ou lesão na quitação.",
    baciaOuConflito: "Brumadinho, Mariana, Betim e Barra Longa",
    fontePesquisa:
      "Pesquisa Jurisprudencial NACAB; AJRI Brumadinho; STJ REsp 2231199 (valida quitação ampla)",
    linkFonte:
      "https://nacab.org.br/wp-content/uploads/2025/07/Relatorio_PesquisaJurisprudencial_2023.pdf",
    linkPortal: LINK_PAINEL_LITIGIOS,
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
