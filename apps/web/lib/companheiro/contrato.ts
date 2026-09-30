/**
 * Contrato entre o portal Controle Popular e o companheiro de desktop.
 *
 * PAPEL NO PROJETO
 * ----------------
 * O companheiro (bichinho-preguica) e a "boca e o olho" do cidadao: ele ouve
 * a pergunta, le a tela e fala a resposta. O portal e o "cerebro": guarda o
 * acervo do RAG do Seu Nono, o catalogo de paginas e a escada determinista.
 * Este arquivo e o acordo entre os dois — o que o desktop manda e o que o
 * portal devolve. Mudar um campo aqui e mudar o contrato dos dois lados.
 *
 * REGRAS DE NEGOCIO (portal civico, ver AGENTS.md secao 7)
 * -------------------------------------------------------
 * - "Galho" e um pedaco REAL de dado do portal: o titulo de uma fonte do RAG,
 *   uma rota do catalogo ou um atalho da escada determinista. O bichinho se
 *   apoia neles para levar o leitor ate a informacao. Rotulo nunca e inventado.
 * - `fala` e uma versao curta e sem marcadores para o TTS: o modelo embrulha,
 *   nunca acrescenta dado novo.
 * - `ressalva` e sempre `true`: toda resposta gerada por IA se declara, com
 *   modelo e data (regra editorial).
 *
 * DECISAO TECNICA
 * ---------------
 * O `fala` viaja pronto no contrato, em vez de o desktop reescrever a resposta:
 * assim o texto lido em voz alta passa pelo mesmo cuidado editorial do texto na
 * tela, e a marcacao [n] nunca vira som.
 */

import type { AtalhoAcao } from "../assistente/escada-determinista";

/** O que o companheiro manda. Tudo opcional menos a pergunta. */
export interface PedidoCompanheiro {
  /** Pergunta do cidadao, ja em texto (a fala vira texto no desktop). */
  pergunta: string;
  /** Rota da pagina do portal aberta no navegador, quando conhecida. */
  pathname?: string;
  /** Titulo da janela ativa — usado quando o pathname nao vem. */
  titulo?: string;
  /** Slug do municipio, quando a pergunta e sobre uma cidade. */
  municipio?: string;
}

/**
 * Um ponto de apoio do bichinho. `url`/`rota` sao o destino do galho; quando
 * nao ha rota (fonte externa), o galho so tem rotulo.
 */
export interface GalhoCompanheiro {
  /** Posicao na ordem de citacao — o bichinho percorre nesta ordem. */
  indice: number;
  /** Titulo curto do dado (titulo da fonte, rotulo do atalho). */
  rotulo: string;
  /** Destino absoluto ou relativo do galho. */
  url?: string;
  /** Rota interna do portal, quando o galho e uma pagina do site. */
  rota?: string;
}

/** O que o portal devolve. */
export interface RespostaCompanheiro {
  /** Resposta completa, com marcadores [n] para citacao. */
  resposta: string;
  /** Versao curta, sem [n], para o bichinho falar. */
  fala: string;
  /** Pontos de apoio, em ordem de citacao. */
  galhos: GalhoCompanheiro[];
  /** Atalhos clicaveis (a escada determinista ja os entrega prontos). */
  atalhos: AtalhoAcao[];
  /** Quem gerou: "deterministico" ou o rotulo do provedor de IA. */
  modelo: string;
  /** Data ISO da geracao — a ressalva de IA leva data. */
  data: string;
  /** Sempre `true`: toda resposta de IA se declara. */
  ressalva: true;
  /** Resultado do verificador de citacao, quando houve IA. */
  verificacao?: "ok" | "parcial" | "falhou";
  /** True quando o portal nao achou fonte: a resposta e o "nao encontrei". */
  abstencao: boolean;
}
