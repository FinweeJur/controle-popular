/**
 * Micro-lições cívicas — o "aprender brincando" do portal.
 *
 * ═══ O QUE É ═══
 *
 * Lições curtas em português claro sobre como o dinheiro e o poder público
 * funcionam (licitação, LAI, barragem, CadÚnico, ICMS...). Cada lição tem um
 * resumo, poucos parágrafos, a fonte oficial e UMA pergunta de fixação com
 * explicação.
 *
 * ═══ REGRA EDITORIAL ═══
 *
 * Gamifica a JORNADA, nunca o dado: as perguntas tratam de DEFINIÇÕES e de
 * COMO AS COISAS FUNCIONAM — nunca de tragédia, vítima ou placar de denúncia.
 * A fonte viaja colada a cada lição. Quem aprende sai sabendo onde conferir,
 * não decorando um número.
 *
 * ═══ POR QUE EXISTE ═══
 *
 * O portal publica o dado; sem o vocabulário, o dado não vira ação. Estas
 * lições são a porta de entrada para quem chegou sob estresse e nunca leu um
 * "termo de ajustamento" ou um "número de empenho".
 */

export interface FonteLicao {
  nome: string;
  /** URL oficial (http) ou rota interna do portal (começa com "/"). */
  url: string;
}

export interface PerguntaLicao {
  enunciado: string;
  opcoes: string[];
  /** Índice da alternativa correta em `opcoes`. */
  correta: number;
  explicacao: string;
}

export interface Licao {
  id: string;
  titulo: string;
  resumo: string;
  paragrafos: string[];
  fonte: FonteLicao;
  pergunta: PerguntaLicao;
}

/** Lições disponíveis, na ordem de exibição. */
export const LICOES: Licao[] = [
  {
    id: "lai",
    titulo: "O que é a LAI",
    resumo: "A lei que deixa você pedir documento público. De graça e sem justificar.",
    paragrafos: [
      "A Lei de Acesso à Informação (LAI) é a Lei nº 12.527/2011.",
      "Qualquer pessoa pode pedir contratos, salários e atas a órgãos públicos.",
      "O pedido é gratuito e não precisa de motivo. O órgão responde em 20 dias.",
    ],
    fonte: {
      nome: "Lei nº 12.527/2011",
      url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm",
    },
    pergunta: {
      enunciado: "Você precisa explicar por que quer a informação?",
      opcoes: ["Sim, é obrigatório justificar", "Não, o pedido dispensa justificativa"],
      correta: 1,
      explicacao: "A LAI dispensa justificativa. Você pede e o órgão responde.",
    },
  },
  {
    id: "licitacao",
    titulo: "O que é licitação",
    resumo: "A disputa pública que a prefeitura faz antes de comprar ou contratar.",
    paragrafos: [
      "Licitação é a regra para o poder público comprar ou contratar.",
      "As empresas disputam e, em tese, vence a proposta mais vantajosa.",
      "A Lei nº 14.133/2021 é a Lei de Licitações em vigor.",
    ],
    fonte: {
      nome: "Lei nº 14.133/2021",
      url: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/L14133.htm",
    },
    pergunta: {
      enunciado: "Para que serve a licitação?",
      opcoes: [
        "Escolher a compra mais vantajosa para o interesse público",
        "Aumentar o preço pago pelo governo",
        "Evitar que empresas participem",
      ],
      correta: 0,
      explicacao: "A disputa existe para o dinheiro público render mais.",
    },
  },
  {
    id: "pncp",
    titulo: "O que é o PNCP",
    resumo: "O portal nacional onde as contratações públicas ficam publicadas.",
    paragrafos: [
      "PNCP é o Portal Nacional de Contratações Públicas.",
      "Ele reúne editais, contratos e atas de todo o país num lugar.",
      "É a fonte para cruzar o que a sua cidade compra e de quem.",
    ],
    fonte: {
      nome: "PNCP — Portal Nacional de Contratações Públicas",
      url: "https://www.gov.br/pncp/pt-br",
    },
    pergunta: {
      enunciado: "O que o PNCP reúne?",
      opcoes: ["Só salários de servidores", "Editais, contratos e atas de todo o país"],
      correta: 1,
      explicacao: "É a vitrine nacional das contratações públicas.",
    },
  },
  {
    id: "barragem-montante",
    titulo: "O que é uma barragem a montante",
    resumo: "O método de construção que tornou Brumadinho possível.",
    paragrafos: [
      "Barragem a montante é construída com o rejeito sobre o próprio rejeito.",
      "É mais barata e menos estável que os outros métodos.",
      "A Lei nº 12.334/2010 trata da segurança de barragens.",
    ],
    fonte: {
      nome: "Lei nº 12.334/2010 (Política Nacional de Segurança de Barragens)",
      url: "/ambiental/barragens",
    },
    pergunta: {
      enunciado: "Por que a barragem a montante preocupa?",
      opcoes: ["Porque é muito cara", "Porque é menos estável que outros métodos"],
      correta: 1,
      explicacao: "O método a montante é o de menor margem de segurança.",
    },
  },
  {
    id: "icms-cota",
    titulo: "O que é a cota-parte do ICMS",
    resumo: "A fatia do imposto estadual que volta para o seu município.",
    paragrafos: [
      "O ICMS é o imposto estadual sobre circulação de mercadorias.",
      "Parte dele é repassada aos municípios: a cota-parte.",
      "Boa parte dessa fatia depende de como o estado define os critérios.",
    ],
    fonte: {
      nome: "Lei Complementar nº 87/1996 (Lei Kandir)",
      url: "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp87.htm",
    },
    pergunta: {
      enunciado: "O que é a cota-parte do ICMS?",
      opcoes: ["A parte do imposto que volta ao município", "Um imposto municipal novo"],
      correta: 0,
      explicacao: "É a fatia estadual devolvida aos municípios.",
    },
  },
  {
    id: "car",
    titulo: "O que é o CAR",
    resumo: "O cadastro que diz o que existe dentro de cada propriedade rural.",
    paragrafos: [
      "CAR é o Cadastro Ambiental Rural.",
      "Ele registra os limites do imóvel e o que há dentro dele.",
      "O CAR é autodeclaratório: quem informa é o próprio proprietário.",
    ],
    fonte: {
      nome: "Lei nº 12.651/2012 (Código Florestal)",
      url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12651.htm",
    },
    pergunta: {
      enunciado: "Quem informa os dados do CAR?",
      opcoes: ["O Ministério Público", "O próprio proprietário da terra"],
      correta: 1,
      explicacao: "O CAR é autodeclaratório — por isso precisa ser conferido.",
    },
  },
  {
    id: "cadunico",
    titulo: "O que é o CadÚnico",
    resumo: "O cadastro das famílias de baixa renda, porta de vários benefícios.",
    paragrafos: [
      "CadÚnico é o Cadastro Único dos programas sociais do governo federal.",
      "A inscrição é gratuita e feita no CRAS mais próximo.",
      "Estar no CadÚnico dá acesso a benefícios, como a tarifa social de luz.",
    ],
    fonte: {
      nome: "Cadastro Único — Ministério do Desenvolvimento Social",
      url: "https://www.gov.br/mds/pt-br/acoes-e-programas/cadastro-unico",
    },
    pergunta: {
      enunciado: "Onde a família se inscreve no CadÚnico?",
      opcoes: ["No CRAS do município", "Só pela internet, com conta paga"],
      correta: 0,
      explicacao: "A inscrição é presencial no CRAS e não tem custo.",
    },
  },
  {
    id: "codigo-ibge",
    titulo: "Por que o código IBGE importa",
    resumo: "O número que identifica cada município sem depender do nome.",
    paragrafos: [
      "Cada município tem um código do IBGE de 7 dígitos.",
      "O nome de cidades pode repetir; o código, não.",
      "Casar dado por código evita confundir uma cidade com outra.",
    ],
    fonte: {
      nome: "IBGE — API de Localidades",
      url: "https://servicodados.ibge.gov.br/api/docs/localidades",
    },
    pergunta: {
      enunciado: "Por que cruzar dados pelo código IBGE é mais seguro?",
      opcoes: ["Porque o nome da cidade nunca muda", "Porque o código não se repete entre municípios"],
      correta: 1,
      explicacao: "Nome pode repetir e mudar de grafia; o código é único.",
    },
  },
];

/** Lista as lições disponíveis. */
export function listarLicoes(): Licao[] {
  return LICOES;
}

/** Diz se a alternativa escolhida está correta. */
export function acertou(licao: Licao, indiceEscolhido: number): boolean {
  return indiceEscolhido === licao.pergunta.correta;
}

/** Conta quantas lições o leitor acertou a partir das respostas dadas. */
export function contarAcertos(respostas: Record<string, number>): number {
  return LICOES.reduce((total, l) => {
    const escolha = respostas[l.id];
    return escolha !== undefined && escolha === l.pergunta.correta ? total + 1 : total;
  }, 0);
}
