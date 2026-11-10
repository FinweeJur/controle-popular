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
      {/*
        Bloco curto e centralizado: barra com teto de 13 rem (6 rem no celular)
        e o N logo ao lado, para o olho não atravessar a tela entre o rótulo e o
        número.
      */}
      <ul className="mx-auto w-full max-w-sm space-y-1.5 sm:max-w-xl">
        {itens.map(([chave, n]) => {
          const rotulo = rotulos[chave] ?? chave;
          return (
            <li
              key={chave}
              className="grid grid-cols-[minmax(0,1fr)_minmax(3rem,6rem)_max-content] items-center gap-x-2 text-sm sm:grid-cols-[minmax(0,9rem)_minmax(0,13rem)_max-content]"
            >
              <span className="min-w-0 truncate" title={rotulo}>
                {rotulo}
              </span>
              <span
                className="h-2.5 w-full overflow-hidden rounded bg-[var(--cp-surface-2)]"
                role="img"
                aria-label={`${rotulo}: ${n} de ${total}`}
              >
                <span
                  className="block h-full rounded bg-[var(--cp-primary)]"
                  style={{ width: `${(100 * n) / maior}%` }}
                />
              </span>
              <span className="justify-self-end whitespace-nowrap font-tabular">
                {n.toLocaleString("pt-BR")}
                <span className="ml-1.5 text-xs opacity-60">
                  {total ? `${Math.round((100 * n) / total)}%` : "—"}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      {nota ? <p className="text-xs opacity-70">{nota}</p> : null}
    </section>
  );
}
