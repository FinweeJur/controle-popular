/**
 * O miolo determinístico do assistente de navegação: texto → lista de
 * destinos do portal. Sem modelo, sem rede, sem banco.
 *
 * ═══ POR QUE DETERMINÍSTICO ═══
 *
 * `docs/PLANO-2026-08-15.md` (N8) parte a funcionalidade em duas metades e
 * mede o custo de cada uma: **navegar e executar comando** não precisa de
 * modelo, **responder em linguagem livre** precisa — e precisar de modelo
 * significa rota dinâmica e chave, ou seja, reabrir a dependência de
 * runtime que a Fase 5 tirou. Este arquivo é a primeira metade inteira. A
 * segunda já existe em `lib/chat-comum.ts` e vive atrás de `route.din.ts`,
 * que o alvo `output: 'export'` nem enxerga.
 *
 * ═══ A REGRA QUE MANDA: DEVOLVER LISTA, E DEVOLVER VAZIO ═══
 *
 * `interpretar()` devolve CANDIDATOS, no plural, e é isso que vira botão de
 * opção na tela. Um palpite único obrigaria o assistente a decidir entre
 * `/betim/meio-ambiente/barragens` e `/ambiental/barragens` para quem
 * digitou "barragens em Betim" — as duas são respostas legítimas, e
 * escolher por conta própria é o começo de adivinhar.
 *
 * O outro lado da mesma regra: **vazio é resposta**. Texto sem intenção de
 * navegação devolve `[]`, e cidade que o portal não atende devolve `[]` —
 * nunca a mesma pergunta redirecionada para uma cidade que por acaso
 * existe. Ver `GUARDA DE LUGAR` abaixo.
 */

import { separarPalavras } from "@/lib/busca/normalizar";
import {
  APELIDOS_DE_CIDADE,
  CIDADES,
  ROTAS_GERAIS,
  SUFIXOS_DE_CIDADE,
  type Destino,
  type EntradaCatalogo,
} from "./catalogo";

/** Um destino com a força do casamento — `pontos` só serve para ordenar. */
export interface Candidato {
  destino: Destino;
  pontos: number;
}

/**
 * Teto de botões numa resposta.
 *
 * Oito porque "contratos" sem cidade legitimamente casa com as 6 cidades
 * mais as rotas gerais de licitação, e uma resposta de 15 botões deixa de
 * ser uma escolha para virar outra busca. Quem não achou o que queria
 * refina a frase — o campo continua ali.
 */
export const LIMITE_CANDIDATOS = 8;

/**
 * Preposições que introduzem LUGAR em português falado.
 *
 * Só estas: são as que aparecem em "saúde EM BH", "contratos DE Betim",
 * "obras NA cidade". "sobre", "com" e "por" ficaram de fora porque
 * introduzem ASSUNTO ("projetos sobre mobilidade") — incluí-las faria a
 * guarda abaixo tratar todo assunto desconhecido como lugar desconhecido, e
 * o assistente calaria em pergunta boa.
 */
const PREPOSICOES_DE_LUGAR = new Set(["em", "no", "na", "de", "do", "da", "para", "pra", "pro"]);

/**
 * Palavras que podem seguir uma preposição sem serem nome de lugar.
 *
 * A lista é curta de propósito e cresce por evidência, não por precaução:
 * cada palavra a mais aqui é uma chance a mais de a guarda NÃO disparar
 * quando devia. São artigos, possessivos e os genéricos que a fala usa no
 * lugar do nome da cidade ("na minha cidade", "do meu município").
 */
const PALAVRAS_COMUNS = new Set([
  "o", "a", "os", "as", "um", "uma", "uns", "umas",
  "meu", "minha", "meus", "minhas", "seu", "sua", "nosso", "nossa",
  "tudo", "todos", "todas", "isso", "aqui", "la", "ai",
  "cidade", "municipio", "portal", "site", "pagina",
]);

/** Uma cidade reconhecida no texto, com as posições que ela ocupou. */
interface CidadeCasada {
  slug: string;
  nome: string;
  /** Índices de `palavras` consumidos pelo nome — a guarda de lugar não
   *  pode tratar "paulo" de "são paulo" como lugar desconhecido. */
  posicoes: Set<number>;
  /** Quantas palavras o nome tinha. "sao paulo" (2) ganha de "sp" (1)
   *  quando os dois casam no mesmo texto. */
  tamanho: number;
}

/**
 * Todas as grafias por cidade, já tokenizadas com a MESMA função que
 * tokeniza o que a pessoa digita.
 *
 * Passar o nome oficial por `separarPalavras()` (e não escrevê-lo à mão sem
 * acento) é o que garante que "Araçuaí" e "aracuai" cheguem ao mesmo lugar:
 * a função tira acento e cedilha antes de quebrar. Escrever a lista à mão
 * criaria um segundo dialeto de normalização, e o modo de falha seria a
 * cidade com acento nunca casar — silenciosamente.
 */
const GRAFIAS_POR_CIDADE: { slug: string; nome: string; grafias: string[][] }[] = CIDADES.map((c) => ({
  slug: c.slug,
  nome: c.nome,
  grafias: [
    separarPalavras(c.slug),
    separarPalavras(c.nome),
    ...(APELIDOS_DE_CIDADE[c.slug] ?? []).map((a) => separarPalavras(a)),
  ].filter((g) => g.length > 0),
}));

/**
 * Casa uma sequência de tokens dentro de `palavras`, contígua e em ordem.
 *
 * Contígua é requisito, não simplificação: sem isso "são joão del rei"
 * casaria "são … paulo" se as duas palavras aparecessem soltas na frase, e
 * o assistente mandaria a pessoa para a capital paulista por causa de um
 * "são" perdido.
 *
 * Devolve as posições consumidas (ou `null`), porque quem chama precisa
 * saber QUAIS palavras foram gastas — é o que a guarda de lugar consulta.
 */
function casarSequencia(palavras: string[], sequencia: string[]): number[] | null {
  if (sequencia.length === 0 || sequencia.length > palavras.length) return null;
  for (let i = 0; i + sequencia.length <= palavras.length; i++) {
    let bate = true;
    for (let j = 0; j < sequencia.length; j++) {
      if (palavras[i + j] !== sequencia[j]) {
        bate = false;
        break;
      }
    }
    if (bate) return Array.from({ length: sequencia.length }, (_, j) => i + j);
  }
  return null;
}

/**
 * A cidade nomeada no texto, ou `null`.
 *
 * Ganha a grafia MAIS LONGA que casar, não a primeira: "são paulo" e "sp"
 * podem casar na mesma frase e a de duas palavras é a mais específica.
 */
function detectarCidade(palavras: string[]): CidadeCasada | null {
  let melhor: CidadeCasada | null = null;
  for (const c of GRAFIAS_POR_CIDADE) {
    for (const grafia of c.grafias) {
      const posicoes = casarSequencia(palavras, grafia);
      if (!posicoes) continue;
      if (melhor && melhor.tamanho >= grafia.length) continue;
      melhor = { slug: c.slug, nome: c.nome, posicoes: new Set(posicoes), tamanho: grafia.length };
    }
  }
  return melhor;
}

/** Uma entrada do catálogo que casou, com pontos e palavras gastas. */
interface AssuntoCasado<T> {
  entrada: T;
  pontos: number;
  posicoes: number[];
}

/**
 * Pontua uma entrada do catálogo contra o texto.
 *
 * Pontos = soma do TAMANHO de cada termo que casou. Termo de duas palavras
 * vale 2, de uma vale 1 — é o que faz "meio ambiente" ficar acima de
 * "ambiente" sem nenhum peso escrito à mão, e o que faz "projeto de lei"
 * (3) ganhar de "lei" (1) numa frase que contenha os dois.
 */
function pontuar<T extends EntradaCatalogo>(palavras: string[], entrada: T): AssuntoCasado<T> | null {
  let pontos = 0;
  const posicoes: number[] = [];
  for (const termo of entrada.termos) {
    const sequencia = separarPalavras(termo);
    const casou = casarSequencia(palavras, sequencia);
    if (!casou) continue;
    pontos += sequencia.length;
    posicoes.push(...casou);
  }
  return pontos > 0 ? { entrada, pontos, posicoes } : null;
}

/**
 * ═══ GUARDA DE LUGAR ═══
 *
 * `true` quando a pessoa NOMEOU um lugar que o portal não atende.
 *
 * O caso que ela existe para resolver: "saúde em Uberlândia". "saúde" casa
 * com uma rota de cidade em todas as 6 cidades atendidas — e sem a guarda a
 * resposta seria seis botões de saúde, nenhum deles Uberlândia. O assistente
 * teria trocado a cidade da pergunta em silêncio, que é a mesma classe de
 * erro registrada em `etl_default_de_cidade` (parâmetro de cidade vindo de
 * default reetiqueta dado) e em `analise_garantista_cidades` (filtro que
 * troca a população precisa trocar o denominador).
 *
 * O teste é conservador de propósito, e erra sempre para o lado de calar:
 * uma palavra logo depois de preposição de lugar, que não foi consumida
 * pela cidade nem por nenhum assunto, não é palavra comum e não é número.
 * Número fica de fora porque "contratos de 2024" é filtro, não lugar.
 */
function nomeouLugarDesconhecido(palavras: string[], gastas: Set<number>): boolean {
  for (let i = 0; i < palavras.length - 1; i++) {
    if (!PREPOSICOES_DE_LUGAR.has(palavras[i])) continue;
    const seguinte = palavras[i + 1];
    if (gastas.has(i + 1)) continue;
    if (PALAVRAS_COMUNS.has(seguinte)) continue;
    if (/^\d+$/.test(seguinte)) continue;
    if (seguinte.length < 3) continue;
    return true;
  }
  return false;
}

/**
 * Texto → destinos do portal, do mais provável para o menos.
 *
 * Devolve `[]` sempre que não houver intenção de navegação reconhecível —
 * e isso inclui o caso em que a intenção existe mas aponta para fora do
 * acervo. O assistente não completa a frase da pessoa.
 */
export function interpretar(texto: string): Candidato[] {
  const palavras = separarPalavras(texto);
  if (palavras.length === 0) return [];

  const cidade = detectarCidade(palavras);

  const assuntosDeCidade = SUFIXOS_DE_CIDADE.map((e) => pontuar(palavras, e)).filter(
    (x): x is AssuntoCasado<EntradaCatalogo> => x !== null
  );
  const assuntosGerais = ROTAS_GERAIS.map((e) => pontuar(palavras, e)).filter(
    (x): x is AssuntoCasado<(typeof ROTAS_GERAIS)[number]> => x !== null
  );

  // Tudo que alguma regra reconheceu. A guarda de lugar só olha o que
  // SOBROU — palavra que ninguém reclamou é candidata a nome de cidade que
  // não atendemos.
  const gastas = new Set<number>(cidade ? [...cidade.posicoes] : []);
  for (const a of [...assuntosDeCidade, ...assuntosGerais]) for (const p of a.posicoes) gastas.add(p);

  if (nomeouLugarDesconhecido(palavras, gastas)) return [];

  const candidatos: Candidato[] = [];

  if (cidade) {
    for (const a of assuntosDeCidade) {
      candidatos.push({
        destino: {
          href: `/${cidade.slug}${a.entrada.sufixo}`,
          titulo: a.entrada.titulo,
          contexto: cidade.nome,
          zona: "cidades",
        },
        // A cidade nomeada é sinal forte: quem escreveu "Betim" quer Betim,
        // e sem este bônus `/ambiental/barragens` (geral) empataria com
        // `/betim/meio-ambiente/barragens` na frase "barragens em Betim".
        pontos: a.pontos + cidade.tamanho,
      });
    }
    // Cidade nomeada e nenhum assunto: "abrir Betim" é pedido completo, e a
    // resposta é a capa da cidade. Não é palpite — é o único destino que a
    // frase nomeia.
    if (assuntosDeCidade.length === 0 && assuntosGerais.length === 0) {
      candidatos.push({
        destino: { href: `/${cidade.slug}`, titulo: "Página inicial da cidade", contexto: cidade.nome, zona: "cidades" },
        pontos: cidade.tamanho,
      });
    }
  } else if (assuntosDeCidade.length > 0) {
    // Assunto de cidade sem cidade nomeada: "contratos" é pergunta válida, e
    // a resposta honesta é "em qual cidade?" — feita de botões, uma por
    // cidade atendida, e não de uma escolha nossa.
    //
    // Só o assunto MAIS FORTE se expande. Expandir todos daria 6 × n botões
    // e afogaria a pergunta; o teto de `LIMITE_CANDIDATOS` cortaria no meio,
    // sem critério visível para quem lê.
    const melhorPontos = Math.max(...assuntosDeCidade.map((a) => a.pontos));
    for (const a of assuntosDeCidade.filter((x) => x.pontos === melhorPontos)) {
      for (const c of CIDADES) {
        candidatos.push({
          destino: {
            href: `/${c.slug}${a.entrada.sufixo}`,
            titulo: a.entrada.titulo,
            contexto: c.nome,
            zona: "cidades",
          },
          pontos: a.pontos,
        });
      }
    }
  }

  for (const a of assuntosGerais) {
    candidatos.push({
      destino: { href: a.entrada.sufixo, titulo: a.entrada.titulo, zona: a.entrada.zona },
      pontos: a.pontos,
    });
  }

  // Ordem: pontos, depois PROFUNDIDADE, depois `href`.
  //
  // A profundidade desempata "licitações da prefeitura de Betim", onde
  // `/betim/prefeitura` e `/betim/prefeitura/licitacoes` casam com 1 ponto
  // cada (uma palavra cada) e empatam. A rota mais funda é a que a pessoa
  // escreveu por extenso; a rasa é a que ela atravessaria de qualquer jeito
  // para chegar lá. Sem esta linha o primeiro botão seria o menu.
  //
  // O `href` no fim não é estético: sem ele a ordem dependeria da ordem de
  // iteração do catálogo, e mover uma linha do catálogo mudaria a tela sem
  // ninguém ter pedido.
  const profundidade = (h: string) => h.split("/").filter(Boolean).length;
  candidatos.sort(
    (x, y) =>
      y.pontos - x.pontos ||
      profundidade(y.destino.href) - profundidade(x.destino.href) ||
      x.destino.href.localeCompare(y.destino.href)
  );
  return candidatos.slice(0, LIMITE_CANDIDATOS);
}
