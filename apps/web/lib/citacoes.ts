/**
 * lib/citacoes.ts
 *
 * CATÁLOGO CANÔNICO DE CITAÇÕES LITERÁRIAS AUTORIZADAS.
 *
 * Fontes de autorização:
 * - PLANO-COPY-VOZ.md (tabela de epígrafes, com autor, obra e ano)
 * - Aprovação direta do dono do projeto (2026-09-03): lote Evaristo
 *   (Olhos d'água, Roda Viva, Poemas da recordação) e lote Carolina
 *   (Quarto de Despejo / diário e "Não digam que fui rebotalho").
 *
 * REGRA: toda citação exibida no portal sai daqui. Nada de frase inventada
 * ou "aproximada" — quem adiciona citação nova acrescenta a fonte completa
 * (autor, obra, ano/editora/interview) e marca `autorizada: true` só depois
 * de conferida no documento acima.
 *
 * Régua de sensibilidade (PLANO-COPY-VOZ.md §443): nunca trecho que acuse
 * grupo ou pessoa; Brumadinho/Paraopeba não recebe epígrafe literária —
 * só texto do MAB, com atribuição.
 */

export interface Citacao {
  /** Id estável para uso em páginas (ex: "evaristo-abrir-caminhos"). */
  id: string;
  texto: string;
  autor: string;
  obra: string;
  ano: string;
  /** Verse completa — só renderizar em balão/seção dedicada, nunca inline. */
  versos?: string[];
  /** Rótulo curto do tema em que a citação se encaixa melhor. */
  temas: string[];
}

export const CITACOES_AUTORIZADAS: Citacao[] = [
  /* ─── Carolina Maria de Jesus ─── */
  {
    id: "carolina-eu-escrevo",
  texto:
      "Quando eu não tenho o que comer, ao invés de eu xingar ou pensar em morte... eu escrevo.",
    autor: "Carolina Maria de Jesus",
    obra: "Quarto de Despejo",
    ano: "1960",
    temas: ["hero", "sobre"],
  },
  {
    id: "carolina-sao-paulo",
  texto:
      "Eu classifico São Paulo assim: o Palácio é a sala de visita, a Prefeitura é a sala de jantar, a cidade é o jardim, e a favela é o quintal onde jogam os lixos.",
    autor: "Carolina Maria de Jesus",
    obra: "Quarto de Despejo",
    ano: "1960",
    temas: ["cidades"],
  },
  {
    id: "carolina-fome",
  texto: "Quem inventou a fome são os que comem.",
    autor: "Carolina Maria de Jesus",
    obra: "Quarto de Despejo",
    ano: "1960",
    temas: ["reserva"],
  },
  {
    id: "carolina-escrevo-miseria",
  texto:
      "Escrevo a miséria e a vida infausta dos favelados. Eu era revoltada, não acreditava em ninguém. Odiava os políticos e os patrões, porque o meu sonho era escrever e o pobre não pode ter ideal nobre. Eu sabia que ia angariar inimigos, porque ninguém está habituado a esse tipo de literatura. Seja o que Deus quiser. Eu escrevi a realidade.",
    autor: "Carolina Maria de Jesus",
    obra: "Quarto de Despejo",
    ano: "1960",
    temas: ["sobre", "congresso"],
  },
  {
    id: "carolina-mundo-modificar",
  texto: "Ah, comigo o mundo vai modificar-se. Não gosto do mundo como ele é.",
    autor: "Carolina Maria de Jesus",
    obra: "Quarto de Despejo",
    ano: "1960",
    temas: ["hero", "cidades"],
  },
  {
    id: "carolina-ganancia",
  texto:
      "O que eu revolto é com a ganância dos homens que espremem uns aos outros como se espremesse uma laranja.",
    autor: "Carolina Maria de Jesus",
    obra: "Quarto de Despejo",
    ano: "1960",
    temas: ["congresso", "cidades"],
  },
  {
    id: "carolina-rebotalho",
  texto: "Não digam que fui rebotalho, que vivi à margem da vida.",
    autor: "Carolina Maria de Jesus",
    obra: 'poema "Não digam que fui rebotalho"',
    ano: "Quarto de Despejo, 1960",
    versos: [
      "Não digam que fui rebotalho,",
      "que vivi à margem da vida.",
      "Digam que eu procurava trabalho,",
      "mas fui sempre preterida.",
      "Digam ao povo brasileiro",
      "que meu sonho era ser escritora,",
      "mas eu não tinha dinheiro",
      "para pagar uma editora.",
    ],
    temas: ["balao"],
  },

  /* ─── Conceição Evaristo ─── */
  {
    id: "evaristo-escrevivencia",
  texto:
      "A nossa escrevivência não pode ser lida como história de ninar os da casa-grande, mas sim para incomodá-los em seus sonhos injustos.",
    autor: "Conceição Evaristo",
    obra: "Becos da Memória",
    ano: "2006",
    temas: ["congresso", "direitos-humanos"],
  },
  {
    id: "evaristo-abrir-caminhos",
  texto:
      "O importante não é ser o primeiro ou primeira, o importante é abrir caminhos.",
    autor: "Conceição Evaristo",
    obra: "entrevista ao programa Roda Viva",
    ano: "2019",
    temas: ["sobre", "hero"],
  },
  {
    id: "evaristo-medo-coragem",
  texto:
      "Se ao menos o medo me fizesse recuar, pelo contrário, avanço mais e mais na mesma proporção desse medo. É como se o medo fosse uma coragem ao contrário.",
    autor: "Conceição Evaristo",
    obra: "Olhos d'água",
    ano: "2014",
    temas: ["judiciario", "litigios"],
  },
  {
    id: "evaristo-risco-viver",
  texto:
      "Achava também que qualquer vida era um risco e o risco maior era o de não tentar viver.",
    autor: "Conceição Evaristo",
    obra: "Olhos d'água",
    ano: "2014",
    temas: ["nossa-gente", "acao-cidada"],
  },
  {
    id: "evaristo-eu-mulher",
  texto: "Eu-mulher: abrigo da semente, moto-contínuo do mundo.",
    autor: "Conceição Evaristo",
    obra: "Poemas da recordação e outros movimentos",
    ano: "Malê, 2017",
    versos: [
      "Uma gota de leite",
      "me escorre entre os seios.",
      "Uma mancha de sangue",
      "me enfeita entre as pernas.",
      "Meia palavra mordida",
      "me foge da boca.",
      "Vagos desejos insinuam esperanças.",
      "",
      "Eu-mulher em rios vermelhos",
      "inauguro a vida.",
      "Em baixa voz",
      "violento os tímpanos do mundo.",
      "Antevejo.",
      "Antecipo.",
      "Antes-vivo",
      "",
      "Antes – agora – o que há de vir.",
      "Eu fêmea-matriz.",
      "Eu força-motriz.",
      "Eu-mulher",
      "abrigo da semente",
      "moto-contínuo",
      "do mundo.",
    ],
    temas: ["nossa-gente", "balao"],
  },

  /* ─── João Guimarães Rosa ─── */
  {
    id: "rosa-coragem",
  texto: "O que a vida quer da gente é coragem.",
    autor: "João Guimarães Rosa",
    obra: "Grande Sertão: Veredas",
    ano: "1956",
    temas: ["judiciario", "litigios"],
  },
  {
    id: "rosa-sertao-forte",
  texto: "Sertão é onde manda quem é forte, com as astúcias.",
    autor: "João Guimarães Rosa",
    obra: "Grande Sertão: Veredas",
    ano: "1956",
    temas: ["terras", "animais"],
  },
  {
    id: "rosa-travessia",
  texto:
      "O real não está na saída nem na chegada: ele se dispõe para a gente é no meio da travessia.",
    autor: "João Guimarães Rosa",
    obra: "Grande Sertão: Veredas",
    ano: "1956",
    temas: ["sobre"],
  },
  {
    id: "rosa-carne-sangue",
  texto:
      "Uma coisa é pôr ideias arranjadas, outra é lidar com país de pessoas, de carne e sangue, de mil-e-tantas misérias.",
    autor: "João Guimarães Rosa",
    obra: "Grande Sertão: Veredas",
    ano: "1956",
    temas: ["congresso"],
  },

  /* ─── Itamar Vieira Junior ─── */
  {
    id: "itamar-camponeses",
  texto:
      "Tudo que aprendi com os camponeses, quilombolas e trabalhadores rurais eu não trocaria por nenhum título acadêmico ou prêmio.",
    autor: "Itamar Vieira Junior",
    obra: "sobre Torto Arado (Agência Pública)",
    ano: "2021",
    temas: ["nossa-gente", "ambiental"],
  },
  {
    id: "itamar-territorio",
  texto:
      "A vida humana é indissociável do território. E muitas pessoas estão privadas disso.",
    autor: "Itamar Vieira Junior",
    obra: "sobre Salvar o Fogo (TV Brasil, Trilha de Letras)",
    ano: "2023",
    temas: ["terras", "lugares"],
  },
  {
    id: "itamar-esperanca-ativa",
  texto:
      "Não é uma esperança passiva, que está só esperando que as coisas aconteçam. É uma esperança ativa.",
    autor: "Itamar Vieira Junior",
    obra: "Roda Viva",
    ano: "2021",
    temas: ["acao-cidada", "conselhos"],
  },

  /* ─── Birri / Galeano ─── */
  {
    id: "birri-utopia",
  texto: "Para que serve a utopia? Serve para isso: para caminhar.",
    autor: "Fernando Birri, recolhido por Eduardo Galeano",
    obra: "As Palavras Andantes",
    ano: "1994",
    temas: ["manifesto", "nossos"],
  },
];

/** Busca por tema — devolve a primeira citação do tema pedido. */
export function citacaoPorTema(tema: string): Citacao | undefined {
  return CITACOES_AUTORIZADAS.find((c) => c.temas.includes(tema));
}

/** Busca por id estável — uso direto nas páginas. */
export function citacaoPorId(id: string): Citacao | undefined {
  return CITACOES_AUTORIZADAS.find((c) => c.id === id);
}

/** Busca por tema devolvendo todas as opções (para distribuir início/fecho sem repetir). */
export function citacoesDoTema(tema: string): Citacao[] {
  return CITACOES_AUTORIZADAS.filter((c) => c.temas.includes(tema));
}
