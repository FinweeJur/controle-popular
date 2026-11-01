/**
 * @file apps/web/lib/universidades/temas.ts
 * @description Grandes áreas do conhecimento e temas transversais do índice.
 *
 * Papel no portal: dar ao leitor duas camadas de busca que a fonte não entrega
 * pronta.
 *
 * 1. **Grande área do conhecimento** — o DGP/CNPq publica a área predominante
 *    (ex.: "Agronomia"). A CAPES organiza isso em nove grandes áreas. A tabela
 *    abaixo faz a ponte, de forma determinística.
 * 2. **Área temática** — temas transversais que atravessam departamentos
 *    (agroecologia, direitos humanos, saúde coletiva, povos tradicionais...).
 *    São derivados por palavra-chave do nome e da área declarada.
 *
 * Régua: a classificação é EDITORIAL e DERIVADA, não declarada pela fonte.
 * Por isso ela é código aberto e determinístico — o leitor pode ver a regra —
 * e nunca substitui a área oficial no cartão. Errar um tema é menos grave que
 * inventar um grupo, mas ainda é erro: a palavra-chave é conservadora e o
 * rótulo "derivado" acompanha a tela.
 */

import { semAcento } from "@/lib/busca/normalizar";

/** As nove grandes áreas da CAPES, mais a marca de fonte omissa. */
export const GRANDES_AREAS = [
  "Ciências Agrárias",
  "Ciências Biológicas",
  "Ciências da Saúde",
  "Ciências Exatas e da Terra",
  "Ciências Humanas",
  "Ciências Sociais Aplicadas",
  "Engenharias",
  "Linguística, Letras e Artes",
  "Multidisciplinar",
] as const;

export type GrandeArea = (typeof GRANDES_AREAS)[number];

/** Marca usada quando a fonte não declara a área. */
export const AREA_NAO_INFORMADA = "Não informada na fonte";

/**
 * Área predominante (DGP/CNPq) → grande área (CAPES).
 *
 * A tabela cobre as áreas que já aparecem no acervo e as vizinhas prováveis.
 * Área desconhecida cai em "Multidisciplinar"? Não: cai em
 * `AREA_NAO_INFORMADA`, para não inventar classificação.
 */
const GRANDE_AREA_POR_SUBAREA: Record<string, GrandeArea> = {
  // A própria grande área (algumas fontes publicam só a grande área)
  "ciencias agrarias": "Ciências Agrárias",
  "ciencias biologicas": "Ciências Biológicas",
  "ciencias da saude": "Ciências da Saúde",
  "ciencias exatas e da terra": "Ciências Exatas e da Terra",
  "ciencias humanas": "Ciências Humanas",
  "ciencias sociais aplicadas": "Ciências Sociais Aplicadas",
  engenharias: "Engenharias",
  "linguistica, letras e artes": "Linguística, Letras e Artes",
  multidisciplinar: "Multidisciplinar",
  // Agrárias
  agronomia: "Ciências Agrárias",
  "recursos pesqueiros e engenharia de pesca": "Ciências Agrárias",
  "recursos florestais e engenharia florestal": "Ciências Agrárias",
  zootecnia: "Ciências Agrárias",
  "medicina veterinaria": "Ciências Agrárias",
  "ciencia e tecnologia de alimentos": "Ciências Agrárias",
  // Biológicas
  "biologia geral": "Ciências Biológicas",
  imunologia: "Ciências Biológicas",
  biotecnologia: "Ciências Biológicas",
  ecologia: "Ciências Biológicas",
  bioquimica: "Ciências Biológicas",
  genetica: "Ciências Biológicas",
  microbiologia: "Ciências Biológicas",
  botanica: "Ciências Biológicas",
  zoologia: "Ciências Biológicas",
  // Saúde
  "saude coletiva": "Ciências da Saúde",
  "fisioterapia e terapia ocupacional": "Ciências da Saúde",
  enfermagem: "Ciências da Saúde",
  farmacia: "Ciências da Saúde",
  nutricao: "Ciências da Saúde",
  medicina: "Ciências da Saúde",
  odontologia: "Ciências da Saúde",
  "educacao fisica": "Ciências da Saúde",
  fonoaudiologia: "Ciências da Saúde",
  // Exatas e da Terra
  geociencias: "Ciências Exatas e da Terra",
  quimica: "Ciências Exatas e da Terra",
  fisica: "Ciências Exatas e da Terra",
  "probabilidade e estatistica": "Ciências Exatas e da Terra",
  "ciencia da computacao": "Ciências Exatas e da Terra",
  matematica: "Ciências Exatas e da Terra",
  astronomia: "Ciências Exatas e da Terra",
  oceanografia: "Ciências Exatas e da Terra",
  // Humanas
  educacao: "Ciências Humanas",
  historia: "Ciências Humanas",
  antropologia: "Ciências Humanas",
  filosofia: "Ciências Humanas",
  sociologia: "Ciências Humanas",
  "ciencia politica": "Ciências Humanas",
  geografia: "Ciências Humanas",
  psicologia: "Ciências Humanas",
  teologia: "Ciências Humanas",
  // Sociais Aplicadas
  administracao: "Ciências Sociais Aplicadas",
  economia: "Ciências Sociais Aplicadas",
  direito: "Ciências Sociais Aplicadas",
  turismo: "Ciências Sociais Aplicadas",
  "servico social": "Ciências Sociais Aplicadas",
  comunicacao: "Ciências Sociais Aplicadas",
  arquitetura: "Ciências Sociais Aplicadas",
  // Linguística, Letras e Artes
  letras: "Linguística, Letras e Artes",
  linguistica: "Linguística, Letras e Artes",
  artes: "Linguística, Letras e Artes",
  // Engenharias
  "engenharia mecanica": "Engenharias",
  "engenharia civil": "Engenharias",
  "engenharia quimica": "Engenharias",
  "engenharia de materiais e metalurgica": "Engenharias",
  "engenharia de producao": "Engenharias",
  "engenharia eletrica": "Engenharias",
  "engenharia agricola": "Engenharias",
  "engenharia sanitaria": "Engenharias",
  "engenharia de minas": "Engenharias",
};

/** Converte a área predominante na grande área da CAPES. */
export function grandeAreaDe(area: string): string {
  if (!area || area === AREA_NAO_INFORMADA) return AREA_NAO_INFORMADA;
  return GRANDE_AREA_POR_SUBAREA[semAcento(area).trim()] ?? AREA_NAO_INFORMADA;
}

/**
 * Vocabulário de temas transversais.
 *
 * Cada tema tem palavras-chave verificadas contra o texto sem acento. A lista
 * é curta de propósito: tema genérico demais esvazia o filtro.
 */
export const TEMAS: { id: string; nome: string; palavras: string[] }[] = [
  {
    id: "agroecologia",
    nome: "Agroecologia e agricultura familiar",
    palavras: [
      "agroecolog",
      "agroecológ",
      "campesin",
      "agricultura familiar",
      "sociobiodiversidade",
      "agriculturas tradicionais",
    ],
  },
  {
    id: "saude-coletiva",
    nome: "Saúde coletiva e vigilância",
    palavras: [
      "saude coletiva",
      "saúde coletiva",
      "saude publica",
      "saúde pública",
      "epidemiolog",
      "vigilancia em saude",
      "vigilância em saúde",
      "atencao primaria",
      "atenção primária",
    ],
  },
  {
    id: "educacao",
    nome: "Educação e formação de professores",
    palavras: [
      "educa",
      "ensino",
      "escola",
      "pedagog",
      "formacao de professores",
      "formação de professores",
      "educacao matematica",
    ],
  },
  {
    id: "direitos-humanos",
    nome: "Direitos humanos, justiça e cidadania",
    palavras: ["direito", "cidadania", "justica", "justiça", "direitos humanos"],
  },
  {
    id: "genero-diversidade",
    nome: "Gênero, raça e diversidade",
    palavras: [
      "genero",
      "gênero",
      "mulher",
      "diversidade",
      "sexualidade",
      "diaspora",
      "diáspora",
      "afro",
      "etnic",
      "étnic",
    ],
  },
  {
    id: "povos-tradicionais",
    nome: "Povos e comunidades tradicionais",
    palavras: [
      "indigena",
      "indígena",
      "quilombola",
      "afro-brasileir",
      "povos",
      "comunidade tradicional",
      "comunidades tradicionais",
    ],
  },
  {
    id: "meio-ambiente",
    nome: "Meio ambiente, clima e território",
    palavras: [
      "ambient",
      "ecolog",
      "meio ambiente",
      "clima",
      "sustentab",
      "recursos hidricos",
      "recursos hídricos",
      "saneamento",
      "zoneamento",
      "geoquimica",
      "geoquímica",
    ],
  },
  {
    id: "mineracao",
    nome: "Mineração e geociências",
    palavras: [
      "minera",
      "geocien",
      "geociên",
      "solo",
      "geologia",
      "geoquimica",
      "geoquímica",
    ],
  },
  {
    id: "trabalho",
    nome: "Trabalho, renda e saúde do trabalhador",
    palavras: ["trabalho", "trabalhador", "ergonomia", "renda", "emprego"],
  },
  {
    id: "tecnologia",
    nome: "Tecnologia, inovação e engenharias",
    palavras: [
      "tecnolog",
      "inovacao",
      "inovação",
      "engenharia",
      "materiais",
      "nanotec",
      "eletroquimica",
      "eletroquímica",
      "biomecanica",
      "biomecânica",
      "eletromagnetismo",
      "computacao",
      "computação",
    ],
  },
  {
    id: "cultura-patrimonio",
    nome: "Cultura, arte e patrimônio",
    palavras: [
      "cultura",
      "patrimonio",
      "patrimônio",
      "turismo",
      "musical",
      "capoeira",
      "danca",
      "dança",
      "arte",
      "historia",
      "história",
    ],
  },
  {
    id: "politicas-publicas",
    nome: "Políticas públicas e gestão",
    palavras: [
      "politicas publicas",
      "políticas públicas",
      "governanca",
      "governança",
      "gestao",
      "gestão",
      "administracao",
      "administração",
      "economia",
      "orcamento",
      "orçamento",
    ],
  },
  {
    id: "alimentacao",
    nome: "Alimentação e produção agrícola",
    palavras: [
      "alimento",
      "agronomia",
      "fruticultura",
      "semente",
      "pragas",
      "fertilidade",
      "aquicultura",
      "nutricao",
      "nutrição",
    ],
  },
  {
    id: "cidade",
    nome: "Cidade, moradia e mobilidade",
    palavras: ["cidade", "urban", "habitacao", "habitação", "mobilidade"],
  },
  {
    id: "saude",
    nome: "Saúde e cuidado",
    palavras: ["saude", "saúde", "clinica", "clínica", "doenca", "doença", "fisioterapia"],
  },
];

/** Texto usado no casamento de tema: nome + área predominante. */
export function textoDeTema(entrada: {
  nome: string;
  area?: string;
}): string {
  return semAcento(`${entrada.nome} ${entrada.area ?? ""}`);
}

/**
 * Temas derivados de uma entrada (grupo ou projeto).
 *
 * Devolve os `id` na ordem do vocabulário, sem repetição. Entrada sem
 * casamento devolve lista vazia — o cartão não exibe selo nenhum.
 */
export function temasDe(entrada: { nome: string; area?: string }): string[] {
  const texto = textoDeTema(entrada);
  return TEMAS.filter((t) =>
    t.palavras.some((p) => texto.includes(semAcento(p))),
  ).map((t) => t.id);
}

/** Nome legível do tema pelo id. */
export function nomeDoTema(id: string): string {
  return TEMAS.find((t) => t.id === id)?.nome ?? id;
}
