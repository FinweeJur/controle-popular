/**
 * Data da última publicação do portal — o número que a faixa global
 * "site em desenvolvimento ... Última atualização: ..." mostra no topo de
 * toda página.
 *
 * ## De onde vem a data
 *
 * `process.env.DATA_PUBLICACAO` é declarada em `next.config.ts` (chave `env`)
 * e o Next a substitui por um literal DURANTE o build. Ou seja: a data é a do
 * build, que no Guara e no Workers é a do deploy. Ela não muda quando o
 * servidor reinicia e não depende do fuso de quem builda — ver o comentário
 * longo em `next.config.ts` sobre as três alternativas descartadas.
 *
 * ## Por que `America/Sao_Paulo` e não o fuso do servidor
 *
 * Quem lê a faixa é gente no Brasil. `toLocaleDateString("pt-BR")` sem fuso
 * fixo usaria o fuso da máquina que builda: o mesmo build mostraria 30/09
 * numa esteira em UTC e 01/10 numa em Brasília. Fuso nomeado e fixo deixa a
 * data igual para todo mundo, e igual ao dia em que o portal foi mesmo
 * publicado (o deploy acontece em horário brasileiro).
 *
 * Fonte do formato de data na tela do portal: `<time dateTime={...}>` com
 * `toLocaleDateString("pt-BR")` — mesmo padrão de `app/indicadores/page.tsx`.
 */

/** ISO do build. Fica indefinida só fora do Next (ex.: vitest) — daí o `??`. */
export const DATA_PUBLICACAO_ISO: string =
  process.env.DATA_PUBLICACAO ?? new Date().toISOString();

/**
 * Formata um ISO como data brasileira (`01/10/2026`), preso ao fuso de
 * Brasília.
 *
 * @param iso  data/hora em ISO 8601 (vindo do build ou de teste).
 * @return     data no formato `dd/mm/aaaa`.
 */
export function formatarDataPublicacao(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}
