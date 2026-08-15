import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Radar de notícias do Paraopeba — o que saiu DEPOIS do acervo do painel-fonte.
 *
 * ## Por que não é o clipping
 *
 * `lib/paraopeba/clipping.ts` é acervo **histórico e curado**: veio do painel
 * do Guaicuy, tem resumo escrito por quem o montou, e fecha numa data
 * (`PERIODO_CLIPPING`). Ele não cresce sozinho, e não deveria — o valor dele
 * está justamente em ser uma seleção com autoria.
 *
 * Este arquivo é o contrário: uma varredura automática, sem curadoria, que roda
 * todo dia e só guarda **título, veículo, data e link**. Nunca o texto da
 * matéria — reproduzir reportagem inteira é uso de obra de terceiro, e este
 * portal publica material que vira anexo de ofício.
 *
 * Os dois convivem porque respondem perguntas diferentes: o clipping responde
 * "o que aconteceu no caso", o radar responde "o que saiu esta semana".
 *
 * ## Lido no BUILD, não em tempo de execução
 *
 * O site é estático: `next build` lê este JSON e imprime o HTML. A página não
 * vai à rede — abrir a tela não pode depender de três servidores de notícia
 * estarem de pé naquele instante. A contrapartida é que o radar só se atualiza
 * quando o site é reconstruído, e a tela precisa dizer a data da coleta em vez
 * de dar a impressão de tempo real.
 *
 * Gerado por `scripts/coletar-noticias-paraopeba.py`.
 */

export interface NoticiaRadar {
  titulo: string;
  link: string;
  veiculo: string;
  fonte_id: string;
  data: string | null;
  /** O título indica decisão de autoridade — sentença, liminar, acordo, multa. */
  ato_de_autoridade: boolean;
}

export interface RadarParaopeba {
  gerado_em: string;
  janela_dias: number;
  fontes: { id: string; veiculo: string; nota: string }[];
  /** O que o radar sabe que NÃO cobre — exibido na tela, não só aqui. */
  lacuna_conhecida: string;
  itens: NoticiaRadar[];
}

const VAZIO: RadarParaopeba = {
  gerado_em: "",
  janela_dias: 0,
  fontes: [],
  lacuna_conhecida: "",
  itens: [],
};

/**
 * Lê o radar gravado pelo coletor.
 *
 * ⚠️ Arquivo ausente devolve vazio em vez de quebrar o build, e isso é
 * deliberado: uma instalação nova, ou um `git clone` antes da primeira coleta,
 * não pode derrubar a publicação do site inteiro por causa de uma seção
 * secundária. Quem lê `gerado_em: ""` sabe que a coleta não rodou — e a tela
 * diz isso em palavras, em vez de mostrar uma lista vazia com cara de
 * "não houve notícia".
 */
export function carregarRadarParaopeba(): RadarParaopeba {
  try {
    const caminho = path.join(process.cwd(), "data", "noticias-paraopeba.json");
    return JSON.parse(readFileSync(caminho, "utf-8")) as RadarParaopeba;
  } catch {
    return VAZIO;
  }
}
