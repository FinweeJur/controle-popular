/**
 * Verificador de fatos do ofício — rede determinística contra invenção.
 *
 * Portado de `X:\DevCoder\controle-popular-congresso\lib\oficio\verificador.ts`,
 * que por sua vez veio do `vaire/verificador.py` (projeto Vaire, agente
 * jurídico) — nasceu de um problema real: o agente de comunicação
 * alucinava datas. A ideia central é a mesma e vale repetir porque é
 * contraintuitiva — **não se verifica semântica, verifica-se presença**.
 * Extrai-se do texto gerado os elementos de maior risco e pergunta-se,
 * para cada um, "isto existe na FONTE?". O que não existe é marcado, não
 * corrigido.
 *
 * Este arquivo é DELIBERADAMENTE quase idêntico ao do /congresso: a
 * lógica de checagem de fato (data, valor, prazo, citação legal) não
 * depende de o documento ser sobre uma proposição de lei ou uma
 * nomeação de tribunal — é o mesmo tipo de risco (parlamentar/senador
 * lendo um documento que cita lei errada). Duplicar aqui em vez de
 * importar do repo irmão é intencional: os dois apps são repos Git
 * separados, sem pacote compartilhado — mesma decisão já registrada no
 * /congresso quando herdou do Vaire.
 *
 * A única mudança de domínio é `CONSTANTES_DA_COMPOSICAO` (ver rodapé):
 * lá eram os dispositivos fixos da rubrica garantista/reducionista; aqui
 * são os dispositivos fixos das regras de composição (regras.json).
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
  // Norma com número: "Lei nº 10.406, de 2002", "LC 152/2015",
  // "Emenda Constitucional 88/2015". O `+` na primeira alternativa do
  // número não é detalhe: com `*`, a alternância ORDENADA casaria um
  // prefixo do número e pararia ali — o mesmo bug de `etl/normas.py` no
  // /congresso e de `etl/cota.py` neste repo (achado na F2 ao vivo).
  [
    "citacao_legal",
    /\b(?:lei\s+complementar|decreto[-\s]lei|lei|decreto|medida\s+provisória|emenda\s+constitucional|súmula)\s+(?:n[º°o.]{0,2}\s*)?(\d{1,3}(?:\.\d{3})+|\d{2,6})(?:\s*\/\s*(\d{4})|\s*,?\s*de\s+[^,;)]{0,40}?(\d{4}))?/gi,
  ],
  // Artigo citado isoladamente: "art. 101", "art. 104, § único, inciso I".
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
      // "artigo 101", "arts. 101" e "art. 101" são a mesma citação escrita
      // de três jeitos. Sem canonizar, reescrever "art." como "artigo"
      // vira acusação de dispositivo inventado — falso alarme exatamente
      // no aviso que precisa ser levado a sério.
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
 * A comparação por dígitos cobre diferença de formatação — "LC 152/2015"
 * vs "Lei Complementar nº 152, de 2015" — que é a fonte da maioria dos
 * falsos alarmes.
 *
 * O limiar de 4 dígitos é o MESMO do /congresso, propositalmente NÃO
 * reduzido: um limiar menor deixaria o verificador mais leniente (mais
 * coincidência numérica passando como "confirmada"), o oposto do que ele
 * existe para fazer. Citação curta como "art. 101" (3 dígitos) tem de
 * passar pelo casamento textual normalizado acima, não pelo atalho
 * numérico — é o comportamento seguro: sinalizar de mais é irritante,
 * deixar passar alucinação é perigoso.
 */
function confirma(trecho: string, fonteNorm: string, fonteDigitos: string): boolean {
  const alvo = normalizar(trecho);
  if (alvo && fonteNorm.includes(alvo)) return true;

  const digitos = soDigitos(trecho);
  if (!digitos) return false;

  if (digitos.length >= 4 && fonteDigitos.includes(digitos)) return true;

  const semAno = digitos.replace(/(19|20)\d{2}$/, "");
  if (semAno.length >= 4 && fonteDigitos.includes(semAno)) return true;

  return false;
}

/**
 * Marca no texto tudo que não foi encontrado na fonte.
 *
 * `fonte` deve conter TODO o material verificado: ementa da Mensagem,
 * dispositivo da vaga, dados da cadeira/tribunal. Um fato ausente daí é,
 * por definição, algo trazido de fora — que pode até estar certo, mas
 * não foi verificado por ninguém.
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
 * Dispositivos que a própria composição cita por construção — constantes
 * de `regras.json`, conferidas por humano, não geradas por LLM. Sem
 * declará-las, o verificador as acusaria de "não confirmadas" mesmo
 * quando corretas — um falso alarme que ensina quem lê a ignorar o aviso
 * (mesma lição do `lei:9605:?` no benchmark do /congresso).
 */
const CONSTANTES_DA_COMPOSICAO = [
  "EC 88/2015",
  "LC 152/2015",
  "EC 122/2022",
  "CF art. 52, III",
  "75 anos",
  "70 anos",
];

export function montarFonte(partes: {
  ementa?: string | null;
  dispositivoVaga?: string | null;
  baseLegalTribunal?: string | null;
  trechos?: (string | null | undefined)[];
  extras?: (string | null | undefined)[];
}): string {
  return [
    ...CONSTANTES_DA_COMPOSICAO,
    partes.ementa,
    partes.dispositivoVaga,
    partes.baseLegalTribunal,
    ...(partes.trechos ?? []),
    ...(partes.extras ?? []),
  ]
    .filter(Boolean)
    .join("\n");
}
