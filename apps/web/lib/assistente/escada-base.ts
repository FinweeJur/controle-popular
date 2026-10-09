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
 * `exatos` casa só com a pergunta inteira (sem acento, em minúsculo).
 * `contem` casa quando o termo aparece em qualquer lugar da pergunta.
 * `cartao` é devolvido na íntegra — nenhum texto é montado em tempo de execução.
 */
export interface EntradaCartao {
  exatos: string[];
  contem: string[];
  cartao: ResultadoEscada;
}

/**
 * Testa se a pergunta normalizada casa com a entrada.
 *
 * @param normalizada prompt sem acento, em minúsculo, já corrigido.
 * @param entrada termos exatos + termos desubstring + cartão.
 * @returns `true` se algum termo casou.
 */
export function casarTermos(normalizada: string, entrada: EntradaCartao): boolean {
  if (entrada.exatos.includes(normalizada)) return true;
  return entrada.contem.some((termo) => normalizada.includes(termo));
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
    if (casarTermos(normalizada, entrada)) return entrada.cartao;
  }
  return null;
}
