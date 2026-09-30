/**
 * Mística do Dia — escolhe, pela data, a luta popular do dia no
 * `CALENDARIO_LUTAS` e monta a citação ABNT da fonte.
 *
 * Papel no portal: alimentar o bloco "Mística do Dia" da home
 * (`app/components/MisticaDoDia.tsx`), pedido do dono em 29/09/2026 —
 * a home sempre referencia, quando houver, uma luta popular ou fato de
 * resistência daquele dia.
 *
 * Fonte oficial das regras: `docs/planos/PLANO-MEMORIA-RESISTENCIAS.md`
 * (decisões do dono: fontes não estatais com citação e link; Wikipédia só
 * como terciária) e AGENTS.md §7 (regra editorial).
 *
 * Decisões técnicas:
 * - o índice por "MM-DD" é montado uma vez, na carga do módulo, e cada
 *   dia é ordenado de forma determinística: entrada COM link primeiro
 *   (fonte conferível), depois ano mais antigo, depois ordem alfabética.
 *   Determinismo importa: a mesma data tem que dar a mesma mística.
 * - `referenciaAbnt` monta a citação ABNT completa em runtime em vez de
 *   guardar o texto em cada entrada — o calendário tem centenas de entradas
 *   e repetir a ficha inflaria o módulo (que a home lê no cliente).
 * - `fonteCurta` é a citação CURTA que a tela usa (regra do dono,
 *   30/09/2026): `(Obra, Autor, Data)`, com autor sendo a FONTE, nunca a
 *   pessoa. Na tela, a ABNT longa repetiria título e datas — o que o dono
 *   mandou unificar ("sem mostrar a data duas vezes").
 * - `mostrarAnoSelo` evita o ano em dobro: quando o título já carrega o
 *   ano do fato, o selo `ano:` some.
 */

import { CALENDARIO_LUTAS } from "./calendario";
import type { EntradaCalendario } from "./tipos";

/** Abreviação de mês da norma ABNT para a data de acesso. */
const MES_ABNT = [
  "jan.", "fev.", "mar.", "abr.", "maio", "jun.",
  "jul.", "ago.", "set.", "out.", "nov.", "dez.",
];

/**
 * Chave "MM-DD" (zero à esquerda) no fuso local do visitante — o dia é o
 * de quem lê, não o do build.
 */
export function chaveDiaMes(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${mes}-${dia}`;
}

/** Índice dia → entradas, montado uma vez na carga do módulo. */
const POR_DIA: Map<string, EntradaCalendario[]> = new Map();
for (const entrada of CALENDARIO_LUTAS) {
  const lista = POR_DIA.get(entrada.diaMes) ?? [];
  lista.push(entrada);
  POR_DIA.set(entrada.diaMes, lista);
}
for (const lista of POR_DIA.values()) {
  lista.sort((a, b) => {
    const comLink = (e: EntradaCalendario) => (e.url ? 0 : 1);
    if (comLink(a) !== comLink(b)) return comLink(a) - comLink(b);
    const anoA = a.ano || "9999";
    const anoB = b.ano || "9999";
    if (anoA !== anoB) return anoA.localeCompare(anoB);
    return a.titulo.localeCompare(b.titulo, "pt-BR");
  });
}

/**
 * A mística do dia da data pedida — ou `null` quando não há entrada.
 * `null` é resultado legítimo: o plano manda declarar a lacuna em vez de
 * preencher com fato sem fonte.
 */
export function misticaDoDia(data: Date): EntradaCalendario | null {
  const lista = POR_DIA.get(chaveDiaMes(data));
  return lista && lista.length > 0 ? lista[0] : null;
}

/** Todas as entradas de um dia (para listas e para o assistente). */
export function entradasDoDia(data: Date): EntradaCalendario[] {
  return POR_DIA.get(chaveDiaMes(data)) ?? [];
}

/**
 * Citação ABNT da fonte (autor, data) — com link quando a fonte tem URL,
 * e sem link quando é documento local (o plano permite "link quando
 * possível"). A data usada é a da FONTE (`fonteData`: a data do post, no
 * Calendário Insurgente; 2009, no Calendário do MST); o ano do fato, se
 * houver, entra entre parênteses depois do título.
 */
export function referenciaAbnt(entrada: EntradaCalendario, acesso?: Date): string {
  const hoje = acesso ?? new Date();
  const acessoFmt = `${String(hoje.getDate()).padStart(2, "0")} ${
    MES_ABNT[hoje.getMonth()]
  } ${hoje.getFullYear()}`;
  const fatoAno = entrada.ano ? ` (fato de ${entrada.ano})` : "";
  const link = entrada.url
    ? ` Disponível em: ${entrada.url}. Acesso em: ${acessoFmt}.`
    : "";
  return `${entrada.autor}. "${entrada.titulo}"${fatoAno}. ${entrada.orgao}, ${entrada.fonteData}.${link}`;
}

/** Quantos dias do ano têm ao menos uma entrada (para o painel de cobertura). */
export function diasCobertos(): number {
  return POR_DIA.size;
}

/**
 * Citação CURTA da fonte, no formato do dono (30/09/2026):
 * `(Obra, Autor, Data)` — ex.: "Calendário Histórico das Trabalhadoras/es,
 * MST, 2009" e "Calendário Insurgente, Blog Aos que Virão, 2020".
 *
 * O "autor" aqui é a OBRA/fonte, nunca a pessoa que assina (decisão do
 * dono). A data é o ano da obra — 2009 no MST, 2020 no blog. Usa o campo
 * gravado pelo gerador; se faltar (entrada antiga), infere pela `orgao` e
 * pela pista de ano em `fonteData`, sem nunca inventar obra nova.
 */
export function fonteCurta(entrada: EntradaCalendario): string {
  if (entrada.fonteCurta) return entrada.fonteCurta;
  const ano = /\d{4}/.exec(entrada.fonteData)?.[0] ?? entrada.fonteData;
  if (/insurgente/i.test(entrada.orgao)) {
    return `Calendário Insurgente, Blog Aos que Virão, ${ano}`;
  }
  return `Calendário Histórico das Trabalhadoras/es, MST, ${ano}`;
}

/**
 * O selo de ano deve aparecer na tela? Não quando o próprio título já
 * traz o ano, e não quando não há ano. Assim a data não aparece duas
 * vezes (pedido do dono, 30/09/2026).
 */
export function mostrarAnoSelo(entrada: EntradaCalendario): boolean {
  if (!entrada.ano) return false;
  return !entrada.titulo.includes(entrada.ano);
}
