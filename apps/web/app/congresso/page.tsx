import Link from "@/lib/congresso/link";
import { totaisHome } from "@/lib/db/queries/congresso";

export const revalidate = 900;

/**
 * Home. Renderiza normalmente mesmo sem Supabase configurado — é o que
 * permite este repo existir e buildar antes do banco existir, e é a mesma
 * regra que vale em produção: fonte de dados ausente vira estado vazio
 * honesto, nunca erro.
 */
export default async function Home() {
  const { proposicoes: totalProposicoes, analises: totalAnalises } = await totaisHome();

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-12">
      <section className="space-y-4">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          O que o Congresso está decidindo sobre os seus direitos
        </h1>
        <p className="max-w-2xl text-lg opacity-80">
          Monitoramento de projetos de lei federais por tema, palavra-chave, bancada e
          comissão. Cada proposição recebe uma ficha técnica do que ela muda na letra da
          lei e uma análise de quais direitos ela amplia ou restringe — sempre com o
          dispositivo legal que fundamenta a leitura.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/proposicoes"
            className="rounded-md bg-[var(--cp-primary)] px-4 py-2 font-medium text-[var(--cp-primary-ink)]"
          >
            Ver proposições
          </Link>
          <Link
            href="/metodologia"
            className="rounded-md border border-[var(--cp-border)] px-4 py-2 font-medium"
          >
            Como classificamos
          </Link>
        </div>
      </section>

      {totalProposicoes === null ? (
        <section className="rounded-lg border border-[var(--cp-border)] p-6">
          <h2 className="font-display text-xl font-semibold">Fonte de dados não configurada</h2>
          <p className="mt-2 opacity-80">
            O banco ainda não está acessível — falta a variável{" "}
            <code>DATABASE_URL</code>. Veja <code>README.md</code> na raiz do repositório.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-[var(--cp-border)] p-6">
            <p className="font-tabular text-3xl font-semibold">
              {totalProposicoes?.toLocaleString("pt-BR") ?? "—"}
            </p>
            <p className="opacity-70">proposições acompanhadas</p>
          </div>
          <div className="rounded-lg border border-[var(--cp-border)] p-6">
            <p className="font-tabular text-3xl font-semibold">
              {totalAnalises?.toLocaleString("pt-BR") ?? "—"}
            </p>
            <p className="opacity-70">com análise de direitos concluída</p>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">Régua declarada</h2>
        <p className="max-w-2xl opacity-80">
          Este portal assume abertamente uma régua pró-direitos: classificamos uma
          proposição como <strong>garantista</strong> quando ela amplia direitos
          fundamentais e como <strong>reducionista</strong> quando os restringe. O que
          torna isso verificável em vez de opinião solta é o método — o rótulo não é
          gerado por inteligência artificial, e sim calculado a partir de itens que citam,
          cada um, o artigo da Constituição ou da lei que fundamenta a leitura, com o
          trecho do projeto que a embasa. Você pode conferir item por item.
        </p>
        <Link href="/metodologia" className="inline-block underline">
          Ler a metodologia completa
        </Link>
      </section>
    </div>
  );
}
