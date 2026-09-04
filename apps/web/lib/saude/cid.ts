/**
 * Mapeamento e taxonomia de CIDs (CID-10) e correlação com fatores ambientais e socioeconômicos.
 * Fonte: DATASUS / SIH-SUS / Sinan / OMS.
 */

export interface CidRegistro {
  codigo: string;
  capitulo: string;
  descricao: string;
  /** Nome popular da doença, quando mapeado (ver NOMES_POPULARES_CID). */
  nomePopular?: string;
  /** Nome técnico/correto da medicina, quando mapeado ou vindo da fonte. */
  nomeTecnico?: string;
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
 * Dicionário local de nomes populares de CIDs mais frequentes no ranking
 * de internações (medido em Betim, 03/09: O80, O82, Z30, S82, S52, P96,
 * I64, I21, A49, A41, J21, N18 apareciam como "Diagnóstico CID-10 X" na
 * tabela porque a fonte (SIH-SUS agregado) não traz descrição).
 *
 * `popular` = como a pessoa fala da doença; `tecnico` = nome correto da
 * medicina (OMS/DATASUS, 4ª revisão em português). A formatação final é
 * sempre "Popular (Técnico, CID-10 X)" — o dono pediu nome popular na
 * tabela e o técnico ao passar o mouse/clicar (o `title` da célula).
 *
 * A chave é a categoria de 3 caracteres; subcategorias com sufixo (ex:
 * "I648", "S824") herdam o nome da categoria via `buscarNomePopular`.
 */
export const NOMES_POPULARES_CID: Record<string, { popular: string; tecnico: string }> = {
  O80: { popular: "Parto normal", tecnico: "Parto espontâneo com apresentação cefálica (vértex)" },
  O82: { popular: "Parto cesárea", tecnico: "Parto por cesariana" },
  Z30: { popular: "Planejamento familiar", tecnico: "Intervenção médica para controle de fecundidade" },
  S82: { popular: "Quebra da perna", tecnico: "Fratura da perna, exceto tornozelo" },
  S52: { popular: "Quebra do cotovelo ou do antebraço", tecnico: "Fratura do cotovelo e do antebraço (úmero distal, rádio e ulna)" },
  P96: { popular: "Complicação de recém-nascido", tecnico: "Certas afecções originadas no período perinatal" },
  I64: { popular: "Derrame", tecnico: "Acidente vascular cerebral (AVC), não especificado como hemorrágico ou isquêmico" },
  I21: { popular: "Ataque cardíaco", tecnico: "Infarto agudo do miocárdio" },
  A49: { popular: "Infecção por bactéria", tecnico: "Infecção bacteriana, sítio não especificado" },
  A41: { popular: "Infecção generalizada", tecnico: "Sepse, não especificada" },
  J21: { popular: "Bronquiolite", tecnico: "Bronquiolite aguda" },
  N18: { popular: "Problema crônico nos rins", tecnico: "Doença renal crônica" },
  A09: { popular: "Diarreia infecciosa", tecnico: "Diarreia e gastroenterite de origem infecciosa presumível" },
  J18: { popular: "Pneumonia", tecnico: "Pneumonia por microrganismo não especificado" },
  J45: { popular: "Crise de asma", tecnico: "Asma" },
};

/** Busca o nome popular pela categoria de 3 caracteres (herda de subcategoria). */
function buscarNomePopular(cid: string): { popular: string; tecnico: string } | null {
  return NOMES_POPULARES_CID[cid] ?? NOMES_POPULARES_CID[cid.slice(0, 3)] ?? null;
}

/** Descrição no formato pedido pelo dono: "Popular (Técnico, CID-10 X)". */
function formatarDescricaoCid(popular: string, tecnico: string, codigo: string): string {
  return `${popular} (${tecnico}, CID-10 ${codigo})`;
}

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
  const nome = buscarNomePopular(limpo);

  const capitulo = base?.capitulo ?? inferirCapituloCid(limpo);
  // Prioridade: nome popular + técnico (dicionário local), mesmo quando a
  // descrição já vem da fonte — o dono quer SEMPRE o nome popular na tabela.
  // Sem mapeamento popular, mantém a descrição da fonte; só no último caso
  // a linha vira o genérico "Diagnóstico CID-10 X".
  const descricao = nome
    ? formatarDescricaoCid(nome.popular, base?.descricao ?? nome.tecnico, limpo)
    : base?.descricao ?? `Diagnóstico CID-10 ${limpo}`;
  const taxaMortalidade = internacoes > 0 ? (obitos / internacoes) * 100 : 0;

  return {
    codigo: limpo,
    capitulo,
    descricao,
    nomePopular: nome?.popular,
    nomeTecnico: base?.descricao ?? nome?.tecnico,
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
