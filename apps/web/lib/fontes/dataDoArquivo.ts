/**
 * Leitura da data de coleta dos dados versionados — a qualidade "de quando
 * é este dado?" (PLANO-DATA-DO-DADO, 15/10/2026).
 *
 * Papel no portal: toda página que publica dado mostra um `DataColeta`
 * abaixo da descrição, e a data vem do CABEÇALHO do arquivo de dado —
 * carimbado pelo coletor/gerador na escrita bem-sucedida. Data digitada
 * no código é data velha: proibido (AGENTS.md §8, oitava qualidade).
 *
 * Formato medido no repo em 15/10/2026 (160 JSONs inspecionados): os dumps
 * usam `geradoEm`, `gerado_em`, `atualizadoEm`, `atualizado_em`,
 * `ultimaColeta`, `dataColeta`, `coletadoEm` ou `coletado_em` — o extrator
 * aceita todos, sem renomear nada a força (YAGNI; a convenção para dumps
 * NOVOS é `geradoEm`, dita o plano).
 *
 * Decisão: função PURA sobre objeto já carregado — páginas importam o JSON
 * e passam o objeto (roda no build e no Worker, sem `fs`); quem tem o
 * caminho (scripts/vigia) lê o arquivo e chama o mesmo extrator.
 */

/** Campos de data aceitos, na ordem de confiança (gerado = coleta). */
const CAMPOS_DATA = [
  "geradoEm",
  "gerado_em",
  "coletadoEm",
  "coletado_em",
  "ultimaColeta",
  "dataColeta",
  "atualizadoEm",
  "atualizado_em",
  // Apelados tolerados medidos em 15/10/2026: dumps antigos que carimbam a
  // data da FONTE com outro nome. Renomeá-los é decisão do dono; ler todos é
  // de graça — o leitor tolerante nunca inventa nem reordena o que a fonte disse.
  "ultima_atualizacao",
  "atualizado_na_fonte",
] as const;

/**
 * Extrai a primeira data parseável do cabeçalho de um acervo.
 * @param acervo objeto importido do JSON de dados (ou qualquer registro com cabeçalho).
 * @returns a string ISO como está no arquivo, ou `null` quando não há data honesta.
 */
export function dataDoAcervo(acervo: unknown): string | null {
  if (!acervo || typeof acervo !== "object") return null;
  const obj = acervo as Record<string, unknown>;
  for (const campo of CAMPOS_DATA) {
    const valor = obj[campo];
    if (typeof valor === "string" && valor.length >= 10 && !Number.isNaN(Date.parse(valor))) {
      return valor;
    }
  }
  return null;
}

/**
 * ISO → "DD/MM/AAAA" em pt-BR, sem fuso: só reordena os dígitos do dia
 * (usar `Date`+`toLocaleDateString` deslocaria a data para o dia anterior
 * em UTC-3 — o bug clássico do "dados de ontem" que o portal não pode ter).
 */
export function formatarDataBR(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}
