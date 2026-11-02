/**
 * @file Ranking em barras com denominador explícito.
 *
 * O QUE É: lista ordenada em que cada linha tem rótulo, barra proporcional, N e
 * percentual. Substitui a tabela de três colunas onde o que importa é a ordem,
 * não o cruzamento — no celular a barra cabe inteira e a tabela rolava de lado.
 *
 * REGRA DO DENOMINADOR: `total` vem do chamador e é o universo do recorte —
 * nunca o maior item da lista. Percentual sobre base errada é o erro mais fácil
 * de publicar sem perceber, e o leitor não tem como conferir.
 *
 * RÓTULOS: `rotulos` traduz a chave crua do dado ("perda_renda_trabalho") para
 * o texto de tela. Chave sem tradução aparece como veio — melhor cru do que
 * mentir, e o chamador vê o que faltou.
 *
 * FONTE: nenhuma. Só desenha o que o chamador mediu.
 */

export function Barras({
  titulo,
  dados,
  total,
  nota,
  limite = 10,
  rotulos = {},
}: {
  titulo: string;
  dados: [string, number][];
  /** Universo do recorte: denominador do percentual. */
  total: number;
  nota?: string;
  /** Quantas categorias aparecem antes de agrupar o resto. */
  limite?: number;
  rotulos?: Record<string, string>;
}) {
  const itens: [string, number][] = dados.slice(0, limite);
  const resto = dados.slice(limite).reduce((soma, [, n]) => soma + n, 0);
  if (resto > 0) itens.push([`+ ${dados.length - limite} categorias`, resto]);
  const maior = Math.max(...itens.map(([, n]) => n), 1);
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-semibold">{titulo}</h2>
      <ul className="space-y-1.5">
        {itens.map(([chave, n]) => {
          const rotulo = rotulos[chave] ?? chave;
          return (
            <li key={chave} className="flex items-center gap-2 text-sm">
              <span className="w-[8.5rem] shrink-0 truncate" title={rotulo}>
                {rotulo}
              </span>
              <span
                className="h-2.5 min-w-0 flex-1 overflow-hidden rounded bg-[var(--cp-surface-2)]"
                role="img"
                aria-label={`${rotulo}: ${n} de ${total}`}
              >
                <span
                  className="block h-full rounded bg-[var(--cp-primary)]"
                  style={{ width: `${(100 * n) / maior}%` }}
                />
              </span>
              <span className="w-14 shrink-0 text-right font-tabular">{n.toLocaleString("pt-BR")}</span>
              <span className="w-11 shrink-0 text-right font-tabular opacity-60">
                {total ? `${Math.round((100 * n) / total)}%` : "—"}
              </span>
            </li>
          );
        })}
      </ul>
      {nota ? <p className="text-xs opacity-70">{nota}</p> : null}
    </section>
  );
}
