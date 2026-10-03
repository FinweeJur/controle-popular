/**
 * Complementos APIB da memória — o Acampamento Terra Livre (ATL).
 *
 * POR QUE EXISTE: o `lib/memoria/calendario.ts` é GERADO (MST 2009 + Blog
 * Aos que Virão) e não se edita à mão. Este arquivo é uma fonte versionada a
 * MAIS, somada ao calendário em `correcoes.ts`. Pedido do dono (03/10/2026):
 * usar mais a fonte APIB, a partir do Histórico do Acampamento Terra Livre.
 *
 * FONTE: APIB — Articulação dos Povos Indígenas do Brasil, "Histórico dos
 * ATLs" (https://apiboficial.org/historicoatl/), consultado em 03/10/2026.
 * Cada edição do ATL tem a URL da sua própria página quando ela existe;
 * quando não existe página por ano, o item aponta para o histórico geral.
 *
 * REGRA DURA (AGENTS §7 e §8): nada de data, nome ou número inventado. Só
 * entrou edição cuja data a página declara de forma explícita. As edições
 * que a fonte não datou (2005 a 2008, 2010 a 2014, 2017 a 2020) NÃO estão
 * aqui — a lacuna é informação, não se preenche com chute. O ATL 2009 entra
 * com `semData: true` porque a página diz apenas "no mês de maio"; a tela
 * avisa que o dia é aproximado e o fato não se perde.
 *
 * ESTILO: frases curtas e diretas, citando o lema do próprio ATL (dono,
 * 03/10/2026), sem sair do que a fonte documenta.
 */

import type { EntradaCalendario } from "./tipos";

/** Fonte comum dos verbetes da APIB (autor e veículo). */
const FONTE = {
  autor: "APIB",
  orgao: "APIB — Articulação dos Povos Indígenas do Brasil",
  fonteData: "2025",
  fonteCurta: "APIB — Articulação dos Povos Indígenas do Brasil",
} as const;

/** Página geral do histórico do ATL, usada quando não há página por ano. */
const HISTORICO = "https://apiboficial.org/historicoatl/";

export const COMPLEMENTOS_APIB: EntradaCalendario[] = [
  {
    ...FONTE,
    diaMes: "04-07",
    ano: "2025",
    titulo: "Acampamento Terra Livre 2025 — Apib Somos Todos Nós: em defesa da Constituição e da Vida",
    tituloCurto: "ATL 2025 — Em defesa da Constituição e da Vida",
    tipo: ["indigena", "direitos"],
    lugar: "Brasília/DF",
    resumo:
      "De 7 a 11 de abril de 2025, em Brasília (DF), o Acampamento Terra Livre reuniu os povos indígenas sob o lema \"Apib Somos Todos Nós: Em Defesa da Constituição e da Vida\".",
    url: "https://apiboficial.org/atl-2025/",
  },
  {
    ...FONTE,
    diaMes: "04-22",
    ano: "2024",
    titulo: "Acampamento Terra Livre 2024 — Nosso Marco é Ancestral",
    tituloCurto: "ATL 2024 — Nosso Marco é Ancestral",
    tipo: ["indigena", "direitos"],
    lugar: "Brasília/DF",
    resumo:
      "De 22 a 26 de abril de 2024, em Brasília (DF), o ATL levou o lema \"Nosso Marco é Ancestral. Sempre estivemos aqui.\", contra a tese do marco temporal.",
    url: "https://apiboficial.org/atl2024/",
  },
  {
    ...FONTE,
    diaMes: "04-24",
    ano: "2023",
    titulo: "Acampamento Terra Livre 2023 — O Futuro Indígena é Hoje",
    tituloCurto: "ATL 2023 — Sem demarcação não há democracia",
    tipo: ["indigena", "direitos"],
    lugar: "Brasília/DF",
    resumo:
      "De 24 a 28 de abril de 2023, em Brasília (DF), o ATL teve como lema \"O Futuro Indígena é hoje. Sem demarcação não há democracia\".",
    url: "https://apiboficial.org/atl2023/",
  },
  {
    ...FONTE,
    diaMes: "04-04",
    ano: "2022",
    titulo: "Acampamento Terra Livre 2022 — Retomando o Brasil: demarcar territórios e aldear a política",
    tituloCurto: "ATL 2022 — Demarcar territórios e aldear a política",
    tipo: ["indigena", "direitos"],
    resumo:
      "Entre 4 e 14 de abril de 2022, o ATL se mobilizou sob o tema \"Retomando o Brasil: Demarcar Territórios e Aldear a Política\", no mesmo período em que o Congresso pautava projetos como o PL 191/2020, que abre terras indígenas à mineração.",
    url: "https://apiboficial.org/atl2022/",
  },
  {
    ...FONTE,
    diaMes: "04-05",
    ano: "2021",
    titulo: "Acampamento Terra Livre 2021 — segunda edição virtual, demarcando as telas",
    tituloCurto: "ATL 2021 — Demarcando as telas",
    tipo: ["indigena", "direitos"],
    lugar: "Brasil (virtual)",
    resumo:
      "Entre 5 e 30 de abril de 2021, o ATL foi realizado de forma virtual, \"demarcando as telas\", após o pior março da pandemia de covid-19, que vitimou mais de mil indígenas.",
    url: "https://apiboficial.org/atl2021/",
  },
  {
    ...FONTE,
    diaMes: "05-10",
    ano: "2016",
    titulo: "XIII Acampamento Terra Livre — carta pública contra os retrocessos do governo Temer",
    tituloCurto: "ATL 2016 — Não admitiremos nenhum retrocesso",
    tipo: ["indigena", "direitos"],
    resumo:
      "De 10 a 13 de maio de 2016, cerca de mil lideranças se reuniram no XIII Acampamento Terra Livre e publicaram uma carta ao governo interino de Michel Temer: \"não admitiremos nenhum retrocesso nos nossos direitos\".",
    url: HISTORICO,
  },
  {
    ...FONTE,
    diaMes: "04-13",
    ano: "2015",
    titulo: "XI Acampamento Terra Livre — mobilização de 1.500 lideranças em Brasília",
    tituloCurto: "ATL 2015 — Pelo fim da paralisação das demarcações",
    tipo: ["indigena", "direitos"],
    lugar: "Brasília/DF",
    resumo:
      "Entre 13 e 16 de abril de 2015, em Brasília (DF), o XI Acampamento Terra Livre mobilizou pelo menos 1.500 lideranças para cobrar o fim da paralisação das demarcações de terras indígenas.",
    url: HISTORICO,
  },
  {
    ...FONTE,
    diaMes: "05-01",
    ano: "2009",
    semData: true,
    titulo: "Acampamento Terra Livre 2009 — pela demarcação de todas as terras indígenas",
    tituloCurto: "ATL 2009 — Pela demarcação de todas as terras",
    tipo: ["indigena", "direitos"],
    resumo:
      "Em maio de 2009, o ATL voltou a exigir do governo Lula a demarcação de todas as terras indígenas e denunciou a situação dos Guarani Kaiowá e dos Pataxó Hã-Ha-Hãe. A fonte datou apenas o mês — o dia na tela é aproximado.",
    url: HISTORICO,
  },
];
