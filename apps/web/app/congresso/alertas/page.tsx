import type { Metadata } from "next";
import Link from "@/lib/congresso/link";
import CardDestaque from "@/app/congresso/components/CardDestaque";
import { alertas, coberturaAnalise } from "@/lib/congresso/destaques";
import { TEMAS, temaPorSlug } from "@/lib/congresso/temas";

export const metadata: Metadata = {
  title: "Alertas — projetos que retiram direitos — Controle Popular · Congresso",
  description:
    "Projetos de lei federais que restringem direitos, com o dispositivo legal e o trecho que fundamentam cada classificação.",
};

export const revalidate = 900;

type Params = Promise<Record<string, string | undefined>>;

export default async function Alertas({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const tema = sp.tema ? temaPorSlug(sp.tema) : undefined;

  const [lista, cobertura] = await Promise.all([alertas(60, tema), coberturaAnalise()]);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold">
          Alertas <span className="opacity-60">· projetos que retiram direitos</span>
        </h1>
        <p className="max-w-3xl opacity-80">
          Proposições em tramitação que <strong>restringem</strong> direitos segundo a
          régua declarada deste portal. Cada uma mostra qual direito é atingido, o
          dispositivo legal que fundamenta a leitura e o trecho do próprio projeto —
          para você conferir em vez de acreditar.
        </p>
      </header>

      <FiltroTema atual={tema?.slug} base="/alertas" />

      {lista.length === 0 ? (
        <Vazio cobertura={cobertura} tema={tema?.nome} />
      ) : (
        <>
          <p className="text-sm opacity-70">
            {lista.length} {lista.length === 1 ? "proposição" : "proposições"}
            {tema ? ` em ${tema.nome}` : ""}, da mais grave para a menos.
          </p>
          <div className="space-y-4">
            {lista.map((d) => (
              <CardDestaque key={d.id} d={d} />
            ))}
          </div>
        </>
      )}

      <Rodape cobertura={cobertura} />
    </div>
  );
}

export function FiltroTema({ atual, base }: { atual?: string; base: string }) {
  return (
    <nav className="flex flex-wrap gap-2 text-sm">
      <Link
        href={base}
        className={`rounded-md border px-3 py-1 ${
          atual ? "border-[var(--cp-border)]" : "border-[var(--cp-primary)]"
        }`}
      >
        Todos os temas
      </Link>
      {TEMAS.map((t) => (
        <Link
          key={t.slug}
          href={`${base}?tema=${t.slug}`}
          className={`rounded-md border px-3 py-1 ${
            atual === t.slug ? "border-[var(--cp-primary)]" : "border-[var(--cp-border)]"
          }`}
        >
          {t.nome}
        </Link>
      ))}
    </nav>
  );
}

export function Vazio({
  cobertura,
  tema,
}: {
  cobertura: { analisadas: number; total: number };
  tema?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--cp-border)] p-6">
      {cobertura.analisadas === 0 ? (
        <>
          <h2 className="font-display text-xl font-semibold">Análises em andamento</h2>
          <p className="mt-2 opacity-80">
            Nenhuma proposição foi analisada ainda. As {cobertura.total.toLocaleString("pt-BR")}{" "}
            proposições já estão no banco e navegáveis em{" "}
            <Link href="/proposicoes" className="underline">
              Proposições
            </Link>
            ; a análise de direitos roda em fila e esta página se enche sozinha conforme
            avança.
          </p>
        </>
      ) : (
        <p className="opacity-80">
          Nenhuma proposição {tema ? `de ${tema} ` : ""}classificada assim entre as{" "}
          {cobertura.analisadas.toLocaleString("pt-BR")} já analisadas. Isso não significa
          que não exista — significa que a fila de análise ainda não chegou nela.
        </p>
      )}
    </div>
  );
}

export function Rodape({ cobertura }: { cobertura: { analisadas: number; total: number } }) {
  const pct =
    cobertura.total > 0 ? Math.round((cobertura.analisadas / cobertura.total) * 100) : 0;
  return (
    <section className="rounded-lg border border-[var(--cp-border)] p-5 text-sm opacity-80">
      <p>
        <strong>
          {cobertura.analisadas.toLocaleString("pt-BR")} de{" "}
          {cobertura.total.toLocaleString("pt-BR")} proposições analisadas ({pct}%).
        </strong>{" "}
        A análise roda em fila, priorizando o que está em tramitação. Uma proposição
        ausente desta lista pode simplesmente não ter chegado a vez dela — a ausência aqui
        não é atestado de nada.
      </p>
      <p className="mt-2">
        O rótulo não é escrito por inteligência artificial: ele é calculado a partir de
        itens que citam, cada um, o dispositivo que fundamenta a leitura.{" "}
        <Link href="/metodologia" className="underline">
          Ver a metodologia
        </Link>
        .
      </p>
    </section>
  );
}
