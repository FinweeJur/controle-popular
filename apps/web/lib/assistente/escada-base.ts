/**
 * @file escada-base.ts
 * @description Tipos e casador compartilhados pelos degraus determinísticos
 * da escada do assistente Seu Nonô / Chatbot IA.
 *
 * Papel no portal:
 * A "escada" responde perguntas frequentes NA HORA, sem chamar inteligência
 * artificial. Cada degrau é uma categoria (empresas, ferramentas, cidades...).
 * Estes tipos são a forma de casar uma pergunta com o cartão que a responde.
 *
 * Fonte dos dados:
 * Estrutura oficial de navegação do Controle Popular — as mesmas rotas e
 * acervos do App Router. Ver `escada-determinista.ts` (cabeçalho completo).
 *
 * Decisões técnicas:
 * - Separar TIPO e CASADOR dos degraus permite que cada degrau viva no seu
 *   próprio arquivo sem importar o orquestrador de volta (ciclo de import).
 *   Medido 09/10/2026: `escada-determinista.ts` tinha 1.373 linhas e o
 *   CodeScene apontava "Lines of Code in a Single File" (piso de 1.000).
 * - O casador guarda `exatos` e `contem` separados porque os dois testes não
 *   são o mesmo: `=== "busca"` exige a pergunta IGUAL, enquanto
 *   `includes("buscar atos")` aceita a frase contendo o termo. Misturar os
 *   dois num campo só mudaria o comportamento — e resposta errada para o
 *   cidadão é dano (AGENTS §7).
 * - A ordem das entradas importa: a PRIMEIRA que casa responde, igual aos
 *   `if`s encadeados que existiam antes. Não reordenar à mão.
 */

import type { GalhoRelacionado } from "./arvore-galhos";

/** Botão de navegação que o cartão devolve junto com a resposta. */
export interface AtalhoAcao {
  rotulo: string;
  href: string;
  icone?: string;
  principal?: boolean;
}

/** Cartão que a escada mostra ao cidadão quando um degrau casa. */
export interface ResultadoEscada {
  tipo: "laboratorio" | "cidade" | "empresa" | "ferramenta" | "noticia" | "pagina" | "curada";
  titulo: string;
  subtitulo?: string;
  texto: string;
  atalhos: AtalhoAcao[];
  categoria?: string;
  galhoRelacionado?: GalhoRelacionado;
}

/**
 * Uma entrada de degrau: o que casar e o que responder.
 *
 * Quatro testes, cada um no seu campo, porque não são o mesmo teste:
 * - `exatos` — a pergunta inteira tem de ser IGUAL ao termo;
 * - `contem` — o termo aparece em QUALQUER lugar da pergunta;
 * - `comecaCom` — a pergunta COMEÇA com o termo (ex.: "betim prefeitura");
 * - `terminaCom` — a pergunta TERMINA com o termo (ex.: "contratos de betim").
 * E um quinto, `regex`, para o caso em que só expressão regular resolve:
 * palavra inteira marcada com `\b`, para "onu" não casar dentro de "nenhum".
 * Misturar os quatro numa lista só mudaria a resposta — e resposta errada
 * para o cidadão é dano (AGENTS §7).
 * `cartao` é devolvido na íntegra — nenhum texto é montado em tempo de
 * execução.
 */
export interface EntradaCartao {
  exatos: string[];
  contem: string[];
  comecaCom?: string[];
  terminaCom?: string[];
  /** Sem flag `g`: com `g`, `lastIndex` faria o teste falhar em rodadas alternadas. */
  regex?: RegExp[];
  cartao: ResultadoEscada;
  /**
   * Quando o cartão VARIA com a pergunta — título e link levam o termo que
   * o cidadão digitou ("Licenciamento Ambiental: rios"). Recebe a pergunta e
   * o cartão-base já escrito; devolve a versão ajustada. Ausente = devolve
   * `cartao` como está.
   *
   * Existe para não esconder lógica fora da tabela: os termos de casamento
   * continuam todos em `exatos`/`contem`/…, então a prova de equivalência
   * contra o `if` original continua cobrindo tudo.
   */
  montar?: (normalizada: string, base: ResultadoEscada) => ResultadoEscada;
}

/**
 * Testa os quatro testos de TEXTO da entrada, em ordem.
 *
 * A ordem dentro do bloco não muda nada, porque lá era disjunção (`||`)
 * — mas mantê-la deixa o diff contra o `if` original legível.
 *
 * Existe separado de `casarTermos` por um motivo medido: junto com a regex
 * a função chegava a complexidade ciclomática 9, que é o aviso do
 * CodeScene (`cs delta` barrou o commit em 09/10/2026). A costura é
 * natural — texto vira string, regex vira padrão — e as duas metades
 * ficam bem abaixo do limite.
 *
 * @param normalizada prompt sem acento, em minúsculo, já corrigido.
 * @param entrada termos de texto.
 * @returns `true` se algum termo de texto casou.
 */
function casaPorTexto(normalizada: string, entrada: EntradaCartao): boolean {
  if (entrada.exatos.includes(normalizada)) return true;
  if (entrada.contem.some((termo) => normalizada.includes(termo))) return true;
  if (entrada.comecaCom?.some((termo) => normalizada.startsWith(termo))) return true;
  if (entrada.terminaCom?.some((termo) => normalizada.endsWith(termo))) return true;
  return false;
}

/**
 * Testa os padrões de REGEX da entrada, se houver.
 *
 * Sem flag `g` (documentado em `EntradaCartao.regex`): com `g`, o
 * `lastIndex` avança a cada chamada e o mesmo padrão falharia na rodada
 * seguinte.
 *
 * @param normalizada prompt sem acento, em minúsculo, já corrigido.
 * @param padroes padrões da entrada; `undefined` não casa nada.
 * @returns `true` se algum padrão casou.
 */
function casaPorRegex(normalizada: string, padroes?: RegExp[]): boolean {
  return padroes?.some((padrao) => padrao.test(normalizada)) ?? false;
}

/**
 * Testa se a pergunta normalizada casa com a entrada.
 *
 * Os cinco testos são ligados por OU, na mesma ordem em que os `||`
 * existiam no `if` original.
 *
 * @param normalizada prompt sem acento, em minúsculo, já corrigido.
 * @param entrada termos + cartão.
 * @returns `true` se algum termo casou.
 */
export function casarTermos(normalizada: string, entrada: EntradaCartao): boolean {
  return casaPorTexto(normalizada, entrada) || casaPorRegex(normalizada, entrada.regex);
}

/**
 * Percorre uma lista de entradas na ORDEM e devolve o cartão da primeira
 * que casa. É o mesmo "primeiro if que satisfaz vence" de antes.
 *
 * @param normalizada prompt já normalizado.
 * @param entradas tabela do degrau, na ordem original dos `if`s.
 * @returns o cartão, ou `null` quando nada casa.
 */
export function primeiroCartao(
  normalizada: string,
  entradas: EntradaCartao[]
): ResultadoEscada | null {
  for (const entrada of entradas) {
    if (!casarTermos(normalizada, entrada)) continue;
    if (entrada.montar) return entrada.montar(normalizada, entrada.cartao);
    return entrada.cartao;
  }
  return null;
}
