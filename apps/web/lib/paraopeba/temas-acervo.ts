import type { TemaAjri } from "./auditoria-ajri";

/**
 * Dá chave temática estável ao acervo da perícia da UFMG, para ele poder
 * entrar na ponte de `relacionados.ts` — que hoje liga catálogo, ATIs,
 * instituições de justiça e imprensa, e deixou os acervos sem tema de fora
 * por não haver "slug estável para ligar".
 *
 * ═══ O NÚMERO QUE DECIDE O DESENHO: 445 DOCUMENTOS, ~20 COM TEMA ═══
 *
 * O acervo público da perícia tem 445 arquivos, e a tentação é classificar
 * todos. Medição sobre os nomes e as rotas de origem (20/08/2026) mostra que
 * a maior parte NÃO tem tema para classificar:
 *
 *   101  editais de chamada (`/chamadasencerradas`)
 *   262  papelada por chamada (`/processos/chamada-NN`) — administrativo
 *    ~34  listas de equipe ("Equipe - Subprojeto 10", "CONHEÇA A EQUIPE SUB 22")
 *     8  perfis "Mulheres na ciência" — divulgação, não estudo
 *     9  apresentações às partes, cronológicas
 *    ~5  explicadores da /escola com tema real (águas, saúde, economia)
 *     7  RESULTADOS da perícia (`/node/582`) — a substância
 *
 * Os termos mais frequentes nos nomes confirmam: "equipe" (26), "apresentação"
 * (13), "subprojeto" (10) — vocabulário administrativo. "águas" aparece 4
 * vezes; "saúde", 3.
 *
 * Por isso este módulo classifica pouco de propósito e devolve `[]` para o
 * resto. Documento sem tema fica sem tema: entra no acervo navegável da
 * página, não na ponte. Espalhar `risco-meio-ambiente` sobre 262 papéis de
 * chamada encheria a ponte de ligação falsa — e a ponte só vale enquanto
 * cada link significa alguma coisa.
 *
 * ═══ DE ONDE SAI O TEMA ═══
 *
 * Do NOME do arquivo e da SEÇÃO — nunca do conteúdo do PDF. Este módulo não
 * abre PDF, não chama modelo e não adivinha: é tabela de regras, roda no
 * build e é travado por teste. O julgamento sobre o conteúdo dos 7 resultados
 * é feito noutro lugar, por outro processo, e passa por auditoria.
 */

/** Seções do acervo, como o coletor `pericia_ufmg.py` as classifica. */
export type SecaoPericia =
  | "apresentacao_de_resultados"
  | "processo"
  | "chamada"
  | "subprojeto"
  | "material_didatico"
  | "reuniao_com_partes"
  | "comunicacao"
  | "institucional";

export interface DocumentoPericiaUfmg {
  url: string;
  /** Nome como está na URL — pode vir percent-encoded. */
  nomeArquivo: string;
  secao: SecaoPericia;
  /** Páginas do site que apontam para este arquivo. */
  citadoEm: string[];
  /** "AAAA-MM" do caminho de upload, quando existe. */
  anoMes: string | null;
}

/**
 * Os 7 documentos de resultado do `node/582`, mapeados à mão pelo título.
 * São o único conjunto do acervo em que o nome do arquivo diz o assunto de
 * verdade, e são a razão de a página existir — por isso vale a mão em vez de
 * regra genérica.
 */
const RESULTADOS_582: ReadonlyArray<{ prefixo: string; temas: TemaAjri[] }> = [
  { prefixo: "1_", temas: ["risco-saude-publica"] },
  { prefixo: "2_", temas: ["solos-e-sedimentos"] },
  { prefixo: "3_", temas: ["risco-meio-ambiente", "qualidade-da-agua"] },
  { prefixo: "4_", temas: ["seguranca-do-alimento", "fauna"] },
  { prefixo: "5_", temas: ["risco-saude-publica"] },
  { prefixo: "6_", temas: ["programas-de-compensacao"] },
  { prefixo: "RESUMO", temas: ["plano-de-reparacao"] },
];

/**
 * Regras por palavra que o acervo usa DE VERDADE — conferidas contra a
 * contagem de termos, não inventadas. Ordem importa: a primeira que casar
 * vence, e as mais específicas vêm antes.
 */
const REGRAS: ReadonlyArray<{ padrao: RegExp; temas: TemaAjri[] }> = [
  // "Águas monitoramento de qualidade das águas e índice de qualidade"
  { padrao: /qualidade das [áa]guas|[íi]ndice de qualidade/i, temas: ["qualidade-da-agua"] },
  // "Temperatura das águas" — monitoramento de corpo hídrico
  { padrao: /temperatura das [áa]guas|turbidez/i, temas: ["qualidade-da-agua"] },
  { padrao: /doen[çc]as cr[ôo]nicas|sa[úu]de da popula[çc][ãa]o/i, temas: ["risco-saude-publica"] },
  { padrao: /impactos econ[ôo]micos|desenvolvimento regional/i, temas: ["programas-de-compensacao"] },
];

/** Decodifica o nome vindo da URL sem quebrar se a sequência for inválida. */
function nomeLegivel(nomeArquivo: string): string {
  try {
    return decodeURIComponent(nomeArquivo);
  } catch {
    return nomeArquivo;
  }
}

/**
 * Temas de um documento do acervo da perícia. Devolve `[]` quando não há
 * tema defensável — que é o caso da maioria, e é resposta correta, não falha.
 */
export function temasDoDocumentoPericia(doc: DocumentoPericiaUfmg): TemaAjri[] {
  const nome = nomeLegivel(doc.nomeArquivo);

  if (doc.secao === "apresentacao_de_resultados") {
    const achado = RESULTADOS_582.find((r) => nome.startsWith(r.prefixo));
    return achado ? [...achado.temas] : [];
  }

  // As apresentações às partes são prestação de contas do andamento da
  // perícia inteira: transversais por natureza, não de um eixo só.
  if (doc.secao === "reuniao_com_partes") return ["plano-de-reparacao"];

  // Edital e papelada de chamada não recebem tema. Ver o cabeçalho: são 363
  // dos 445, e classificá-los encheria a ponte de ruído.
  if (doc.secao === "chamada" || doc.secao === "processo") return [];

  for (const regra of REGRAS) {
    if (regra.padrao.test(nome)) return [...regra.temas];
  }
  return [];
}

/**
 * Cobertura medida — serve de trava: se uma mudança nas regras fizer este
 * número saltar, é sinal de que passou a classificar o que não devia.
 * Conferido em `temas-acervo.test.ts` contra o dataset real.
 */
export const COBERTURA_TEMATICA_PERICIA = {
  /** Documentos no acervo coletado (varredura de 555 páginas, fila zerada). */
  total: 445,
  /** Quantos recebem ao menos um tema. O resto entra no acervo navegável. */
  comTema: 21,
  /** Por que o resto não recebe: ver o cabeçalho deste arquivo. */
  motivoDoResto:
    "editais, papelada por chamada, listas de equipe e perfis de divulgação — sem eixo temático a atribuir",
} as const;
