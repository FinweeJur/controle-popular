/**
 * Mapeamento e taxonomia de CIDs (CID-10) e correlação com fatores ambientais e socioeconômicos.
 * Fonte: DATASUS / SIH-SUS / Sinan / OMS.
 */

export interface CidRegistro {
  codigo: string;
  capitulo: string;
  descricao: string;
  internacoes: number;
  obitos: number;
  taxaMortalidade: number; // percentual
  diasPermanenciaMedia: number;
  custoTotalReais: number;
  correlacaoAmbiental?: {
    fator: "mineracao_poeira" | "agrotoxicos" | "queimadas_ar" | "saneamento_hidrico" | "desastre_climatico";
    rotulo: string;
    explicacao: string;
  };
}

export const CAPITULOS_CID10: Record<string, { nome: string; descricao: string }> = {
  I: { nome: "Doenças Infecciosas e Parasitárias", descricao: "A00-B99 — Diarreias, arboviroses, tuberculose, leishmaniose" },
  II: { nome: "Neoplasias (Tumores)", descricao: "C00-D48 — Cânceres de diversos sítios" },
  III: { nome: "Doenças do Sangue e Imunológicas", descricao: "D50-D89 — Anemias, coagulopatias" },
  IV: { nome: "Doenças Endócrinas e Metabólicas", descricao: "E00-E90 — Diabetes, desnutrição, obesidade" },
  IX: { nome: "Doenças do Aparelho Circulatório", descricao: "I00-I99 — Hipertensão, infarto, AVC" },
  X: { nome: "Doenças do Aparelho Respiratório", descricao: "J00-J99 — Pneumonias, asma, DPOC, pneumoconioses" },
  XI: { nome: "Doenças do Aparelho Digestivo", descricao: "K00-K93 — Apendicite, úlceras, cirroses" },
  XIV: { nome: "Doenças do Aparelho Geniturinário", descricao: "N00-N99 — Insuficiência renal, infecções urinárias" },
  XIX: { nome: "Lesões, Envenenamentos e Causas Externas", descricao: "S00-T98 — Fraturas, intoxicações por agrotóxicos e metais" },
};

/**
 * CIDs de monitoramento crítico para vigilância socioambiental e de direitos.
 */
export const CIDS_MONITORAMENTO_AMBIENTAL: Record<string, {
  capitulo: string;
  descricao: string;
  fator: "mineracao_poeira" | "agrotoxicos" | "queimadas_ar" | "saneamento_hidrico" | "desastre_climatico";
  rotulo: string;
  explicacao: string;
}> = {
  "A09": {
    capitulo: "I",
    descricao: "Diarreia e gastroenterite de origem infecciosa presumível",
    fator: "saneamento_hidrico",
    rotulo: "Veiculação Hídrica & Saneamento",
    explicacao: "Associado a esgoto a céu aberto, contaminação de mananciais e enchentes.",
  },
  "A27": {
    capitulo: "I",
    descricao: "Leptospirose",
    fator: "desastre_climatico",
    rotulo: "Enchentes & Desastres Climáticos",
    explicacao: "Infecção bacteriana transmitida por água contaminada por urina de roedores após cheias.",
  },
  "J18": {
    capitulo: "X",
    descricao: "Pneumonia por microrganismo não especificado",
    fator: "queimadas_ar",
    rotulo: "Qualidade do Ar & Queimadas",
    explicacao: "Agravamento de infecções respiratórias associado à inalação de fumaça e material particulado.",
  },
  "J45": {
    capitulo: "X",
    descricao: "Asma",
    fator: "queimadas_ar",
    rotulo: "Poluição Atmosférica & Material Particulado",
    explicacao: "Picos de crises asmáticas em crianças e idosos durante períodos de seca e queimadas.",
  },
  "J60": {
    capitulo: "X",
    descricao: "Pneumoconiose dos mineiros de carvão",
    fator: "mineracao_poeira",
    rotulo: "Poeira de Mineração & Siderurgia",
    explicacao: "Acúmulo de poeira mineral nos pulmões decorrente de lavras e beneficiamento de minério.",
  },
  "J62": {
    capitulo: "X",
    descricao: "Pneumoconiose devida a poeira que contenham sílica (Silicose)",
    fator: "mineracao_poeira",
    rotulo: "Silicose & Mineração",
    explicacao: "Inalação crônica de poeira de sílica em extração mineral e pedreiras.",
  },
  "N18": {
    capitulo: "XIV",
    descricao: "Doença renal crônica",
    fator: "mineracao_poeira",
    rotulo: "Exposição a Metais Pesados",
    explicacao: "Dano renal crônico correlacionado à ingestão ou contato prolongado com contaminantes químicos.",
  },
  "T56": {
    capitulo: "XIX",
    descricao: "Efeito tóxico de metais (Chumbo, Mercúrio, Cádmio)",
    fator: "mineracao_poeira",
    rotulo: "Intoxicação por Metais Pesados",
    explicacao: "Contaminação direta decorrente de garimpos, fundições ou vazamento de rejeitos industriais.",
  },
  "T60": {
    capitulo: "XIX",
    descricao: "Efeito tóxico de pesticidas (Agrotóxicos)",
    fator: "agrotoxicos",
    rotulo: "Intoxicação por Agrotóxicos",
    explicacao: "Exposição aguda ou crônica a defensivos agrícolas em lavouras e comunidades rurais.",
  },
};

/**
 * Retorna os CIDs mais frequentes e seus cruzamentos ambientais para o município.
 */
export function enriquecerRegistroCid(
  codigo: string,
  internacoes: number,
  obitos: number,
  diasMedio: number,
  custo: number
): CidRegistro {
  const limpo = codigo.trim().toUpperCase().replace(".", "");
  const base = CIDS_MONITORAMENTO_AMBIENTAL[limpo];

  const capitulo = base?.capitulo ?? inferirCapituloCid(limpo);
  const descricao = base?.descricao ?? `Diagnóstico CID-10 ${limpo}`;
  const taxaMortalidade = internacoes > 0 ? (obitos / internacoes) * 100 : 0;

  return {
    codigo: limpo,
    capitulo,
    descricao,
    internacoes,
    obitos,
    taxaMortalidade: Number(taxaMortalidade.toFixed(2)),
    diasPermanenciaMedia: Number(diasMedio.toFixed(1)),
    custoTotalReais: custo,
    correlacaoAmbiental: base
      ? {
          fator: base.fator,
          rotulo: base.rotulo,
          explicacao: base.explicacao,
        }
      : undefined,
  };
}

function inferirCapituloCid(cid: string): string {
  const letra = cid.charAt(0);
  switch (letra) {
    case "A":
    case "B":
      return "I";
    case "C":
    case "D":
      return "II";
    case "E":
      return "IV";
    case "I":
      return "IX";
    case "J":
      return "X";
    case "K":
      return "XI";
    case "N":
      return "XIV";
    case "S":
    case "T":
      return "XIX";
    default:
      return "Outros";
  }
}
