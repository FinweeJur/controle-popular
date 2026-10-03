/**
 * Verbetes RECOLOCADOS na memória — fatos que o gerador guardou no dia errado
 * e voltam aqui na data correta.
 *
 * FONTE: cada item traz a sua. A data guardada foi conferida contra a fonte;
 * o dia/mês do verbete é o dia do FATO. Ver também `remocoes-mistica.ts`
 * (remove a versão errada) e `correcoes.ts` (junta tudo no `CALENDARIO`).
 */

import type { EntradaCalendario } from "./tipos";

export const RECOLOCADOS: EntradaCalendario[] = [
  {
    autor: "WIKIPÉDIA",
    orgao: "Wikipédia, a enciclopédia livre",
    fonteData: "2024",
    fonteCurta: "Wikipédia, Dom Hélder Câmara",
    url: "https://pt.wikipedia.org/wiki/H%C3%A9lder_C%C3%A2mara",
    diaMes: "02-07",
    ano: "1909",
    titulo: "Nasce Dom Hélder Câmara, em Fortaleza",
    tituloCurto: "Nascimento de Dom Hélder Câmara",
    tipo: ["direitos", "resistencia"],
    lugar: "Fortaleza/CE",
    resumo:
      "Dom Hélder Pessoa Câmara nasceu em 7 de fevereiro de 1909, em Fortaleza (CE). Foi arcebispo de Olinda e Recife e uma das vozes da Igreja contra a ditadura militar no Brasil.",
  },
  {
    autor: "WIKIPÉDIA",
    orgao: "Wikipédia, a enciclopédia livre",
    fonteData: "2024",
    fonteCurta: "Wikipédia, Dom Hélder Câmara",
    url: "https://pt.wikipedia.org/wiki/H%C3%A9lder_C%C3%A2mara",
    diaMes: "08-27",
    ano: "1999",
    titulo: "Morre Dom Hélder Câmara, voz contra a ditadura",
    tituloCurto: "Morte de Dom Hélder Câmara",
    tipo: ["direitos", "resistencia"],
    lugar: "Recife/PE",
    resumo:
      "Dom Hélder Câmara faleceu em 27 de agosto de 1999, no Recife. Arcebispo de Olinda e Recife, ficou conhecido no mundo por denunciar a tortura e a desigualdade durante a ditadura militar brasileira.",
  },
];
