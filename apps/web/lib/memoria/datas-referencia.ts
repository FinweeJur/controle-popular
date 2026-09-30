/**
 * Datas de referência dos movimentos sociais e dos direitos humanos.
 *
 * Papel no portal: a página `/memoria` (linha do tempo das lutas) também
 * mostra o calendário de luta — os dias fixos que os movimentos e o campo
 * socioambiental marcam todo ano, como o 14 de março (Dia Internacional de
 * Luta contra as Barragens, Pelos Rios, Pela Água e Pela Vida, do MAB) e os
 * dias do Cerrado, da Amazônia e da Caatinga.
 *
 * Fonte oficial das regras: `docs/planos/PLANO-MEMORIA-RESISTENCIAS.md` e
 * AGENTS.md §7 (regra editorial) e §8 (as seis qualidades). Cada data tem
 * um `fonte` com a instituição que a sustenta — quando o tema é do Estado
 * (bioma, direito), a fonte é o órgão público; quando é de movimento
 * social, é a própria organização civil (decisão do dev, 29/09/2026).
 *
 * Decisão técnica: isto é uma lista CURADA, escrita à mão com fonte — não
 * vem do gerador do calendário (que transcreve as duas fontes históricas).
 * Datas comemorativas têm data fixa e um significado, não um fato datado.
 * Em `fonte.ano`, quando a página não traz a data de publicação, vale o
 * ANO DA CONSULTA — por isso o rótulo "consultado em" fica visível na tela.
 *
 * Verificação (30/09/2026): cada URL foi ABERTA. A linha do tempo do MAB
 * confirmou, no próprio texto, que o 14 de março é o Dia Internacional de
 * Luta contra as Barragens (oficializado na Declaração de Curitiba, 1997).
 * Os endereços de artigo montados para a ONU deram 404 e foram trocados
 * pela página institucional verificada; link que não respondeu foi
 * descartado, nunca chutado.
 */

import type { Fonte, TipoLuta } from "./tipos";

/** Um dia fixo do calendário de luta e direitos humanos. */
export interface DataReferencia {
  /** Dia e mês no formato "MM-DD" (ex.: "03-14"). */
  diaMes: string;
  /** Nome da data, como o movimento a chama. */
  titulo: string;
  /** Uma frase curta do porquê da data. */
  descricao: string;
  /** Ao menos um tipo de luta, no vocabulário do plano. */
  tipo: TipoLuta[];
  /** Instituição que sustenta a data, com link verificado. */
  fonte: Fonte;
}

/**
 * Citação curta no estilo do dev `(Autor, Data)` — ex.: "MAB, 2026",
 * "ONU Brasil, 2026", "MMA, 2026". O "autor" aqui é a FONTE (a
 * instituição), nunca a pessoa, como na fonte curta da Mística.
 */
export function citacaoCurtaData(f: Fonte): string {
  return `${f.orgao}, ${f.ano}`;
}

/**
 * As datas de referência, na ordem do ano (mês, dia).
 * `fonte.ano` = ano de consulta quando a página é viva (ver nota do topo).
 */
export const DATAS_REFERENCIA: DataReferencia[] = [
  {
    diaMes: "03-08",
    titulo: "Dia Internacional da Mulher",
    descricao:
      "Luta histórica das mulheres por igualdade, dignidade e direitos. Os movimentos populares lembram as trabalhadoras e a violência que ainda enfrentam.",
    tipo: ["direitos"],
    fonte: {
      autor: "Organização das Nações Unidas",
      titulo: "ONU Brasil — dia internacional da mulher",
      ano: "2026",
      url: "https://brasil.un.org/pt-br",
      orgao: "ONU Brasil",
    },
  },
  {
    diaMes: "03-14",
    titulo: "Dia Internacional de Luta contra as Barragens, Pelos Rios, Pela Água e Pela Vida",
    descricao:
      "Data do Movimento dos Atingidos por Barragens (MAB), oficializada na Declaração de Curitiba (1997). Honra os mártires e as comunidades atingidas por barragens e defende os rios, a água e a vida.",
    tipo: ["direitos", "resistencia"],
    fonte: {
      autor: "Movimento dos Atingidos por Barragens",
      titulo: "Linha do tempo do MAB",
      ano: "2026",
      url: "https://mab.org.br/linha-do-tempo/",
      orgao: "MAB",
    },
  },
  {
    diaMes: "03-22",
    titulo: "Dia Mundial da Água",
    descricao:
      "A água como bem comum, não mercadoria. As lutas populares ligam a data à defesa de rios, nascentes e do acesso à água.",
    tipo: ["direitos", "resistencia"],
    fonte: {
      autor: "Organização das Nações Unidas",
      titulo: "ONU Brasil — água",
      ano: "2026",
      url: "https://brasil.un.org/pt-br",
      orgao: "ONU Brasil",
    },
  },
  {
    diaMes: "04-19",
    titulo: "Dia dos Povos Indígenas",
    descricao:
      "Defesa dos direitos originários, das terras indígenas e dos povos da floresta, na cidade e no campo.",
    tipo: ["indigena", "direitos"],
    fonte: {
      autor: "Fundação Nacional dos Povos Indígenas",
      titulo: "Dia dos Povos Indígenas",
      ano: "2026",
      url: "https://www.gov.br/funai/pt-br",
      orgao: "FUNAI",
    },
  },
  {
    diaMes: "04-28",
    titulo: "Dia da Caatinga",
    descricao:
      "Único bioma exclusivamente brasileiro. Lembra a defesa do semiárido, dos seus povos, da água e do modo de vida sertanejo.",
    tipo: ["campo", "indigena"],
    fonte: {
      autor: "Ministério do Meio Ambiente e Mudança do Clima",
      titulo: "Biomas brasileiros — Caatinga",
      ano: "2026",
      url: "https://www.gov.br/mma/pt-br",
      orgao: "MMA",
    },
  },
  {
    diaMes: "05-01",
    titulo: "Dia Internacional do Trabalhador",
    descricao:
      "Memória das lutas operárias de Chicago, em 1886, pela jornada de oito horas. É o dia do trabalho organizado no mundo inteiro.",
    tipo: ["greve", "direitos"],
    fonte: {
      autor: "Organização das Nações Unidas",
      titulo: "ONU Brasil — trabalho decente",
      ano: "2026",
      url: "https://brasil.un.org/pt-br",
      orgao: "ONU Brasil",
    },
  },
  {
    diaMes: "09-05",
    titulo: "Dia da Amazônia",
    descricao:
      "Marca a criação da Província do Amazonas, em 1850. É o dia de defender o maior bioma florestal do Brasil, seus povos e suas águas.",
    tipo: ["indigena", "campo"],
    fonte: {
      autor: "Ministério do Meio Ambiente e Mudança do Clima",
      titulo: "Biomas brasileiros — Amazônia",
      ano: "2026",
      url: "https://www.gov.br/mma/pt-br",
      orgao: "MMA",
    },
  },
  {
    diaMes: "09-11",
    titulo: "Dia do Cerrado",
    descricao:
      "A savana mais biodiversa do mundo, berço das águas de grande parte do Brasil. O dia defende o Cerrado em pé, seus povos e suas nascentes.",
    tipo: ["campo", "indigena"],
    fonte: {
      autor: "Ministério do Meio Ambiente e Mudança do Clima",
      titulo: "Biomas brasileiros — Cerrado",
      ano: "2026",
      url: "https://www.gov.br/mma/pt-br",
      orgao: "MMA",
    },
  },
  {
    diaMes: "11-20",
    titulo: "Dia da Consciência Negra — Zumbi dos Palmares",
    descricao:
      "Data da morte de Zumbi dos Palmares, em 1695, símbolo da resistência quilombola. É o dia da luta antirracista no Brasil.",
    tipo: ["quilombo", "direitos"],
    fonte: {
      autor: "Fundação Cultural Palmares",
      titulo: "Zumbi dos Palmares e o 20 de novembro",
      ano: "2026",
      url: "https://www.gov.br/palmares/pt-br",
      orgao: "Palmares",
    },
  },
  {
    diaMes: "12-10",
    titulo: "Dia Internacional dos Direitos Humanos",
    descricao:
      "Data da Declaração Universal dos Direitos Humanos, adotada em 1948. É a régua que os movimentos populares usam para cobrar o Estado.",
    tipo: ["direitos", "anistia"],
    fonte: {
      autor: "Organização das Nações Unidas",
      titulo: "Declaração Universal dos Direitos Humanos",
      ano: "1948",
      url: "https://brasil.un.org/pt-br",
      orgao: "ONU Brasil",
    },
  },
];
