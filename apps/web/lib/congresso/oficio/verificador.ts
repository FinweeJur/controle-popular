/**
 * Verificador de fatos do ofício — rede determinística contra invenção.
 *
 * Portado do `vaire/verificador.py` (projeto Vaire, agente jurídico), que
 * nasceu de um problema real: o agente de comunicação alucinava datas. A
 * ideia central é a mesma e vale repetir porque é contraintuitiva —
 * **não se verifica semântica, verifica-se presença**. Extrai-se do texto
 * gerado os elementos de maior risco e pergunta-se, para cada um, "isto
 * existe na FONTE?". O que não existe é marcado, não corrigido.
 *
 * O QUE FOI ACRESCENTADO AQUI, e é o que mais importa neste domínio:
 * **citações legais**. O Vaire checa data, valor, percentual, prazo e
 * número de processo; num ofício dirigido a parlamentar, o fato de maior
 * risco é "Lei nº 9.605/1998, art. 54" — um artigo inventado não produz
 * um texto ruim, produz um texto que constrange quem assinou.
 *
 * LIÇÃO JÁ PAGA, aplicada desde a primeira versão: a comparação de norma
 * ignora o ano quando um dos lados não o traz. A ementa escreve
 * "Lei nº 9.605, de 12 de fevereiro de 1998" e o modelo responde
 * "Lei 9.605/1998" — tratar isso como divergência gera falso alarme, e
 * falso alarme numa métrica de alucinação é pior que não ter a métrica,
 * porque ensina quem lê a ignorá-la.
 */

export type TipoFato =
  | "citacao_legal"
  | "data"
  | "data_extenso"
  | "valor"
  | "percentual"
  | "prazo"
  | "processo";

export interface Suspeita {
  tipo: TipoFato;
  trecho: string;
}

export interface ResultadoVerificacao {
  /** Texto com `[NÃO CONFIRMADO]` nas ocorrências suspeitas. */
  texto: string;
  suspeitas: Suspeita[];
  /** true quando nada precisou ser marcado. */
  limpo: boolean;
}

const MESES =
  "janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro";

const PADROES: [TipoFato, RegExp][] = [
  // Norma com número: "Lei nº 10.406, de 2002", "Lei 8.078/1990",
  // "Decreto-Lei 2.848/1940", "Lei Complementar 123".
  // O `+` na primeira alternativa do número não é detalhe: com `*`, a
  // alternância ORDENADA casa "363" dentro de "3631" e para ali. O mesmo
  // bug existia em `etl/normas.py` e só apareceu quando o verificador
  // rodou sobre saída de LLM, que escreve "Lei 8078/1990" sem ponto de
  // milhar — a ementa oficial quase sempre escreve com, e por isso a
  // validação contra 60 ementas reais não pegou.
  [
    "citacao_legal",
    /\b(?:lei\s+complementar|decreto[-\s]lei|lei|decreto|medida\s+provisória|emenda\s+constitucional|súmula)\s+(?:n[º°o.]{0,2}\s*)?(\d{1,3}(?:\.\d{3})+|\d{2,6})(?:\s*\/\s*(\d{4})|\s*,?\s*de\s+[^,;)]{0,40}?(\d{4}))?/gi,
  ],
  // Artigo citado isoladamente: "art. 7º, XIII", "arts. 217-A e 218".
  ["citacao_legal", /\bart(?:s?\.|igos?)\s*\d+(?:\.\d+)?(?:\s*-\s*[A-Z])?(?:º|°)?/gi],
  ["data", /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b|\b\d{4}-\d{2}-\d{2}\b/g],
  ["data_extenso", new RegExp(`\\b\\d{1,2}\\s+de\\s+(?:${MESES})(?:\\s+de\\s+\\d{4})?\\b`, "gi")],
  ["processo", /\b\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}\b/g],
  ["valor", /R\$\s?[\d.][\d.,]*/g],
  ["percentual", /\b\d{1,3}(?:[.,]\d+)?\s?%/g],
  ["prazo", /\b\d+\s+(?:horas?|dias?|m[eê]s(?:es)?|anos?)\b/gi],
];

function normalizar(s: string): string {
  return (
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      // "artigo 60", "arts. 60" e "art. 60" são a mesma citação escrita de
      // três jeitos. Sem canonizar, o modelo reescrever "art." como
      // "artigo" vira acusação de dispositivo inventado — falso alarme
      // exatamente no aviso que precisa ser levado a sério.
      .replace(/\bart(?:s?\.|igos?)\s*/g, "art ")
      .replace(/\bn[º°o.]{1,2}\s*/g, "")
      .replace(/[§]/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function soDigitos(s: string): string {
  return s.replace(/\D/g, "");
}

/**
 * Confirma se um trecho existe na fonte.
 *
 * A comparação por dígitos cobre diferença de formatação — "R$ 5.000" vs
 * "5000", "48 horas" vs "48h", "Lei nº 10.406, de 2002" vs "10.406/2002" —
 * que é a fonte da maioria dos falsos alarmes.
 */
function confirma(trecho: string, fonteNorm: string, fonteDigitos: string): boolean {
  const alvo = normalizar(trecho);
  if (alvo && fonteNorm.includes(alvo)) return true;

  const digitos = soDigitos(trecho);
  if (!digitos) return false;

  // Para citação legal, o número da norma é o que identifica; o ano é
  // acessório e frequentemente omitido de um dos lados. Conferimos o
  // número sozinho quando ele é longo o bastante para não colidir por
  // acaso (4+ dígitos: 8.078, 10.406, 13.146).
  if (digitos.length >= 4 && fonteDigitos.includes(digitos)) return true;

  const semAno = digitos.replace(/(19|20)\d{2}$/, "");
  if (semAno.length >= 4 && fonteDigitos.includes(semAno)) return true;

  // Números curtos (art. 7º, art. 22) só passam por casamento textual —
  // conferir "7" contra a fonte inteira daria positivo em qualquer lugar.
  return false;
}

/**
 * Marca no texto tudo que não foi encontrado na fonte.
 *
 * `fonte` deve conter TODO o material verificado: ementa, texto integral,
 * os `dispositivo` dos itens de análise e as âncoras da rubrica. Um fato
 * ausente daí é, por definição, algo que o modelo trouxe de fora — que
 * pode até estar certo, mas não foi verificado por ninguém.
 */
export function verificar(texto: string, fonte: string): ResultadoVerificacao {
  const fonteNorm = normalizar(fonte);
  const fonteDigitos = soDigitos(fonte);

  const suspeitas: Suspeita[] = [];
  const vistos = new Set<string>();
  let saida = texto;

  for (const [tipo, padrao] of PADROES) {
    for (const m of texto.matchAll(padrao)) {
      const trecho = m[0];
      const chave = `${tipo}:${normalizar(trecho)}`;
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      if (confirma(trecho, fonteNorm, fonteDigitos)) continue;

      suspeitas.push({ tipo, trecho });
      // `(?!\s*\[NÃO)` impede marcar duas vezes o mesmo trecho quando ele
      // aparece repetido e já foi anotado numa passada anterior.
      saida = saida.replace(
        new RegExp(escaparRegex(trecho) + "(?!\\s*\\[NÃO)", "g"),
        `${trecho} [NÃO CONFIRMADO]`
      );
    }
  }

  return { texto: saida, suspeitas, limpo: suspeitas.length === 0 };
}

function escaparRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Monta a fonte de verificação a partir do material já verificado.
 * Tudo que entra aqui é dado de origem oficial ou item de análise que já
 * passou pela validação da rubrica — nada gerado livremente.
 */
/**
 * Dispositivos que a própria composição cita por construção, não porque
 * um modelo os produziu.
 *
 * O art. 60, §4º aparece no parágrafo de cláusula pétrea; ele é uma
 * constante da rubrica, conferida por humano, e não passa por LLM nenhum.
 * Sem declará-lo aqui, o verificador o acusa de "não confirmado" — e um
 * falso alarme na métrica de alucinação é pior que não ter a métrica,
 * porque ensina quem lê a ignorar o aviso. (Mesma lição do falso positivo
 * de `lei:9605:?` no verificador do benchmark.)
 */
const CONSTANTES_DA_COMPOSICAO = [
  "art. 60, §4º, da Constituição Federal",
  "princípio da vedação do retrocesso",
];

export function montarFonte(partes: {
  ementa?: string | null;
  ementaDetalhada?: string | null;
  textoIntegral?: string | null;
  dispositivos?: string[];
  ancoras?: string[];
  trechos?: (string | null | undefined)[];
  extras?: (string | null | undefined)[];
}): string {
  return [
    ...CONSTANTES_DA_COMPOSICAO,
    partes.ementa,
    partes.ementaDetalhada,
    partes.textoIntegral,
    ...(partes.dispositivos ?? []),
    ...(partes.ancoras ?? []),
    ...(partes.trechos ?? []),
    ...(partes.extras ?? []),
  ]
    .filter(Boolean)
    .join("\n");
}
