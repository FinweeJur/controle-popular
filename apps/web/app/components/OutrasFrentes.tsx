import { outrasZonas, ZONAS_PUBLICADAS, type ZonaId } from "@/lib/zonas";

/**
 * A frase do bloco dizia "em três lugares diferentes... acompanha os três".
 * Com uma zona nova a caminho, número escrito à mão vira mentira silenciosa
 * no dia em que a quarta publicar. Sai da contagem real.
 */
const NUMERAL: Record<number, string> = {
  2: "dois",
  3: "três",
  4: "quatro",
  5: "cinco",
};

/**
 * Remissão cruzada entre as três frentes, para o pé da home de cada zona.
 *
 * Pedido do usuário: toda home tem de apontar para todas as outras —
 * Cidades → Congresso e Judiciário, Congresso → Judiciário e Cidades,
 * Judiciário → Congresso e Cidades. Os botões do cabeçalho já ligavam as
 * zonas, mas são pequenos e passam por navegação, não por conteúdo; aqui a
 * ligação é explicada, com o que a outra frente responde.
 *
 * `outrasZonas()` filtra por `publicada`, então zona em construção não
 * aparece aqui antes da hora.
 *
 * Motivo editorial (o mesmo do bloco "Por que três portais" da home da
 * marca): quem chega por uma frente costuma não saber que as outras
 * existem, e acompanhar só uma deixa boa parte da história de fora.
 *
 * `<a>` cru de propósito — ver a nota em `lib/zonas.ts` sobre o `<Link>` de
 * zona prefixar caminho absoluto.
 */
export default function OutrasFrentes({ atual }: { atual: ZonaId }) {
  const outras = outrasZonas(atual);

  return (
    <section className="mt-16 border-t border-border pt-8">
      <h2 className="font-display text-xl font-semibold">As outras frentes</h2>
      <p className="mt-2 max-w-2xl text-[.95em] text-text-soft">
        O poder público decide em {NUMERAL[ZONAS_PUBLICADAS.length] ?? ZONAS_PUBLICADAS.length}{" "}
        lugares diferentes, e o Controle Popular acompanha todos. Acompanhar só um deixa boa
        parte da história de fora.
      </p>

      {/* 3 colunas no lg: com quatro zonas publicadas, `outrasZonas()`
          devolve três e o grid de 2 deixaria um card órfão na segunda
          linha. Com três zonas publicadas devolve duas e o `sm:grid-cols-2`
          continua mandando — a regra do lg só entra em vigor quando a
          quarta publicar. */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {outras.map((z) => (
          <a
            key={z.href}
            href={z.href}
            className="group flex flex-col rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary"
          >
            <span
              className="text-[.82em] font-semibold uppercase tracking-wide"
              style={{ color: z.cor }}
            >
              {z.etiqueta}
            </span>
            <h3 className="mt-1.5 font-display text-lg font-semibold group-hover:text-primary">
              {z.titulo}
            </h3>
            <p className="mt-2 flex-1 text-[.92em] text-text-soft">{z.resumo}</p>
            <span className="mt-4 font-medium text-primary">Ir para esta seção →</span>
          </a>
        ))}
      </div>
    </section>
  );
}
