/**
 * Taxonomia curada da jurimetria do TJMG.
 *
 * O corpus bruto tem sete slugs de coleta, 12 danos PNAB/PEAB e um campo de
 * normas que mistura lei, súmula, instrumento (TAC) e categoria jurídica
 * ("lucros cessantes"). Esta taxonomia separa o que é norma do que é tema e
 * fixa os rótulos que aparecem no mapa e nos filtros.
 *
 * Fonte: Lei 14.755/2023 (PNAB), Lei estadual 23.795/2021 (PEAB/MG) e os
 * acórdãos do TJMG. A regra é não inventar categoria: termo desconhecido fica
 * fora da faceta e permanece em `normasBrutas` para auditoria.
 */

import type { DanoConfig, NormaConfig, TemaConfig } from "./tipos";

export const ROTAS_JURIMETRIA = {
  base: "/judiciario/jurisprudencia",
  tema: (slug: string) => `/judiciario/jurisprudencia/tema/${slug}`,
  decisao: (id: string) => `/judiciario/jurisprudencia/decisao/${id}`,
  norma: (slug: string) => `/judiciario/jurisprudencia/norma/${slug}`,
  dano: (slug: string) => `/judiciario/jurisprudencia/dano/${slug}`,
} as const;

export const TEMAS: readonly TemaConfig[] = [
  {
    slug: "atingidos-barragens",
    label: "Atingidos por barragens",
    descricao:
      "Ações de pessoas atingidas por barragens, com foco em reparação, indenização, auxílio emergencial e direitos territoriais.",
    aliases: ["atingidos-barragem", "atingidos-barragens"],
    palavrasChave: [
      "atingido",
      "atingida",
      "barragem",
      "rejeito",
      "reparação",
      "indenização",
      "auxílio emergencial",
      "PTR",
      "PNAB",
      "PEAB",
    ],
    sinonimos: [
      "população atingida",
      "pessoas atingidas",
      "atingidos por barragem",
      "atingidas por barragens",
    ],
    normas: ["pnab", "peab-mg", "cf-88-art-5", "cf-88-art-225", "lei-7347-85-acp"],
    danos: [
      "perda_propriedade",
      "desvalorizacao_imoveis",
      "perda_capacidade_produtiva",
      "perda_areas_pesca",
      "agua_abastecimento",
      "perda_renda_trabalho",
      "mudanca_habitos_psicossociais",
      "comunidades_tradicionais",
      "acesso_areas_urbanas_rurais",
      "atividades_produtivas_locais",
      "deslocamento_compulsorio",
    ],
    relacionados: ["rompimento-brumadinho", "rompimento-mariana", "atingidos-mineracao"],
  },
  {
    slug: "rompimento-brumadinho",
    label: "Rompimento de Brumadinho",
    descricao:
      "Acórdãos sobre o rompimento da barragem de Brumadinho, incluindo ações individuais, coletivas e agravos de instrumento.",
    aliases: ["rompimento-brumadinho"],
    palavrasChave: [
      "Brumadinho",
      "Córrego do Feijão",
      "Vale",
      "rompimento",
      "zona de autossalvamento",
      "emergência",
      "atingidos",
    ],
    sinonimos: ["barragem de Brumadinho", "desastre de Brumadinho", "rompimento da Vale"],
    normas: ["cf-88-art-5", "cf-88-art-225", "lei-7347-85-acp", "lei-8078-90-cdc", "lei-14066-2020"],
    danos: [
      "perda_propriedade",
      "desvalorizacao_imoveis",
      "perda_capacidade_produtiva",
      "perda_areas_pesca",
      "agua_abastecimento",
      "perda_renda_trabalho",
      "mudanca_habitos_psicossociais",
      "comunidades_tradicionais",
      "acesso_areas_urbanas_rurais",
      "atividades_produtivas_locais",
      "deslocamento_compulsorio",
    ],
    relacionados: ["atingidos-barragens", "rompimento-mariana", "direitos-humanos"],
  },
  {
    slug: "rompimento-mariana",
    label: "Rompimento de Mariana",
    descricao:
      "Acórdãos sobre o rompimento da barragem de Fundão, em Mariana, e os desdobramentos na bacia do Rio Doce.",
    aliases: ["rompimento-mariana"],
    palavrasChave: [
      "Mariana",
      "Fundão",
      "Samarco",
      "Rio Doce",
      "BHP",
      "Renova",
      "repactuação",
      "rompimento",
    ],
    sinonimos: ["barragem de Fundão", "desastre de Mariana", "rompimento da Samarco"],
    normas: ["cf-88-art-5", "cf-88-art-225", "lei-7347-85-acp", "lei-6938-81-pnea", "convencao-169-oit"],
    danos: [
      "perda_propriedade",
      "desvalorizacao_imoveis",
      "perda_capacidade_produtiva",
      "perda_areas_pesca",
      "agua_abastecimento",
      "perda_renda_trabalho",
      "mudanca_habitos_psicossociais",
      "comunidades_tradicionais",
      "acesso_areas_urbanas_rurais",
      "atividades_produtivas_locais",
      "deslocamento_compulsorio",
    ],
    relacionados: ["atingidos-barragens", "rompimento-brumadinho", "direitos-ambientais"],
  },
  {
    slug: "atingidos-mineracao",
    label: "Atingidos por mineração",
    descricao:
      "Ações de comunidades afetadas por mineração, lavra, cavas e rejeitos, com ou sem rompimento de barragem.",
    aliases: ["atingidos-mineracao"],
    palavrasChave: [
      "mineração",
      "mineradora",
      "minério",
      "lavra",
      "cava",
      "rejeito",
      "comunidade atingida",
    ],
    sinonimos: ["atingidos pela mineração", "dano da mineração", "mineração e comunidade"],
    normas: ["cf-88-art-225", "lei-6938-81-pnea", "lei-7347-85-acp", "lei-9605-98"],
    danos: [
      "perda_propriedade",
      "perda_capacidade_produtiva",
      "agua_abastecimento",
      "perda_renda_trabalho",
      "mudanca_habitos_psicossociais",
      "comunidades_tradicionais",
      "atividades_produtivas_locais",
      "deslocamento_compulsorio",
    ],
    relacionados: ["atingidos-barragens", "direitos-ambientais"],
  },
  {
    slug: "direitos-humanos",
    label: "Direitos humanos",
    descricao:
      "Acórdãos em que o rompimento ou a atividade minerária aparece ligado a saúde, moradia, trabalho, educação e vulnerabilidade.",
    aliases: ["direitos-humanos"],
    palavrasChave: [
      "direitos humanos",
      "vulnerabilidade",
      "saúde",
      "moradia",
      "trabalho",
      "educação",
      "dignidade",
    ],
    sinonimos: ["direitos fundamentais", "proteção humanitária", "vulnerabilidade social"],
    normas: ["cf-88-art-5", "cf-88-art-225", "convencao-169-oit", "lei-8069-90-eca"],
    danos: [
      "mudanca_habitos_psicossociais",
      "perda_renda_trabalho",
      "agua_abastecimento",
      "comunidades_tradicionais",
      "deslocamento_compulsorio",
    ],
    relacionados: ["direitos-ambientais", "rompimento-brumadinho", "rompimento-mariana"],
  },
  {
    slug: "direitos-ambientais",
    label: "Direitos ambientais",
    descricao:
      "Acórdãos sobre dano ambiental, poluição, degradação, licenciamento e proteção de bacias e comunidades tradicionais.",
    aliases: ["direitos-ambientais"],
    palavrasChave: [
      "dano ambiental",
      "poluição",
      "degradação",
      "licenciamento",
      "APP",
      "bacia",
      "água",
      "meio ambiente",
    ],
    sinonimos: ["direito ambiental", "proteção ambiental", "dano ao meio ambiente"],
    normas: ["cf-88-art-225", "lei-6938-81-pnea", "lei-9605-98", "lei-12651-2012", "convencao-169-oit"],
    danos: [
      "agua_abastecimento",
      "perda_areas_pesca",
      "comunidades_tradicionais",
      "mudanca_habitos_psicossociais",
      "outros_pnab_peab",
    ],
    relacionados: ["atingidos-mineracao", "rompimento-mariana", "direitos-humanos"],
  },
];

export const NORMAS: readonly NormaConfig[] = [
  {
    id: "cf-88-art-5",
    label: "CF/88, art. 5º",
    termos: ["cf/88 art. 5", "cf 88 art 5", "art. 5º", "artigo 5", "direitos fundamentais"],
  },
  {
    id: "cf-88-art-225",
    label: "CF/88, art. 225",
    termos: ["cf/88 art. 225", "cf 88 art 225", "art. 225", "meio ambiente ecologicamente equilibrado"],
  },
  {
    id: "lei-7347-85-acp",
    label: "Lei 7.347/85 (ACP)",
    termos: ["lei 7.347/85", "lei 7347/85", "ação civil pública", "acp"],
  },
  {
    id: "lei-8078-90-cdc",
    label: "Lei 8.078/90 (CDC)",
    termos: ["lei 8.078/90", "lei 8078/90", "código de defesa do consumidor", "cdc"],
  },
  {
    id: "lei-6938-81-pnea",
    label: "Lei 6.938/81 (PNEA)",
    termos: ["lei 6.938/81", "lei 6938/81", "política nacional do meio ambiente", "pnea"],
  },
  {
    id: "lei-14066-2020",
    label: "Lei 14.066/2020",
    termos: ["lei 14.066/2020", "lei 14066/2020", "segurança de barragens"],
  },
  {
    id: "peab-mg",
    label: "PEAB/MG",
    termos: ["peab/mg", "peab mg", "plano de emergência ambiental"],
  },
  {
    id: "pnab",
    label: "PNAB",
    termos: ["pnab", "política nacional de direitos das populações atingidas"],
  },
  {
    id: "lei-9605-98",
    label: "Lei 9.605/98",
    termos: ["lei 9.605/98", "lei 9605/98", "crimes ambientais"],
  },
  {
    id: "lei-12651-2012",
    label: "Lei 12.651/2012",
    termos: ["lei 12.651/2012", "lei 12651/2012", "código florestal"],
  },
  {
    id: "lei-8069-90-eca",
    label: "Lei 8.069/90 (ECA)",
    termos: ["lei 8.069/90", "lei 8069/90", "eca"],
  },
  {
    id: "convencao-169-oit",
    label: "Convenção 169 da OIT",
    termos: ["convenção 169", "convencao 169", "oit 169", "povos indígenas", "povos quilombolas"],
  },
  {
    id: "sumulas",
    label: "Súmulas",
    termos: ["súmulas", "sumulas", "súmula", "sumula"],
  },
  {
    id: "tac",
    label: "TAC (instrumento)",
    termos: ["tac", "termo de ajustamento de conduta"],
  },
];

export const DANOS: readonly DanoConfig[] = [
  { id: "perda_propriedade", label: "Perda de propriedade ou posse", termos: ["perda_propriedade"] },
  { id: "desvalorizacao_imoveis", label: "Desvalorização de imóveis", termos: ["desvalorizacao_imoveis"] },
  {
    id: "perda_capacidade_produtiva",
    label: "Perda de capacidade produtiva",
    termos: ["perda_capacidade_produtiva"],
  },
  { id: "perda_areas_pesca", label: "Perda de áreas de pesca", termos: ["perda_areas_pesca"] },
  { id: "agua_abastecimento", label: "Água e abastecimento", termos: ["agua_abastecimento"] },
  { id: "perda_renda_trabalho", label: "Perda de renda e trabalho", termos: ["perda_renda_trabalho"] },
  {
    id: "mudanca_habitos_psicossociais",
    label: "Mudança de hábitos e danos psicossociais",
    termos: ["mudanca_habitos_psicossociais"],
  },
  {
    id: "comunidades_tradicionais",
    label: "Comunidades tradicionais",
    termos: ["comunidades_tradicionais"],
  },
  {
    id: "acesso_areas_urbanas_rurais",
    label: "Acesso a áreas urbanas e rurais",
    termos: ["acesso_areas_urbanas_rurais"],
  },
  {
    id: "atividades_produtivas_locais",
    label: "Atividades produtivas locais",
    termos: ["atividades_produtivas_locais"],
  },
  { id: "deslocamento_compulsorio", label: "Deslocamento compulsório", termos: ["deslocamento_compulsorio"] },
  { id: "outros_pnab_peab", label: "Outros danos PNAB/PEAB", termos: ["outros_pnab_peab"] },
];

const ALIAS_PARA_TEMA = new Map<string, string>();
for (const tema of TEMAS) {
  ALIAS_PARA_TEMA.set(tema.slug, tema.slug);
  for (const alias of tema.aliases) ALIAS_PARA_TEMA.set(alias, tema.slug);
}

export function temaCanonico(slug: string | null | undefined): string | null {
  if (!slug) return null;
  const limpo = slug.trim().toLowerCase();
  return ALIAS_PARA_TEMA.get(limpo) ?? null;
}

export function temaConfig(slug: string): TemaConfig | null {
  return TEMAS.find((tema) => tema.slug === slug) ?? null;
}

export function normaConfig(id: string): NormaConfig | null {
  return NORMAS.find((norma) => norma.id === id) ?? null;
}

export function danoConfig(id: string): DanoConfig | null {
  return DANOS.find((dano) => dano.id === id) ?? null;
}

export function rotaDoTema(slug: string): string {
  return ROTAS_JURIMETRIA.tema(slug);
}

export function rotaDaDecisao(id: string): string {
  return ROTAS_JURIMETRIA.decisao(id);
}

export function rotaDaNorma(slug: string): string {
  return ROTAS_JURIMETRIA.norma(slug);
}

export function rotaDoDano(slug: string): string {
  return ROTAS_JURIMETRIA.dano(slug);
}
