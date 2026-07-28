import type { Metadata } from "next";
import CardDestaque from "@/app/congresso/components/CardDestaque";
import { FiltroTema, Rodape, Vazio } from "@/app/congresso/alertas/page";
import { bonsExemplos, coberturaAnalise } from "@/lib/congresso/destaques";
import { temaPorSlug } from "@/lib/congresso/temas";

export const metadata: Metadata = {
  title: "Bons exemplos — projetos que ampliam direitos — Controle Popular · Congresso",
  description:
    "Projetos de lei federais que ampliam direitos, com o dispositivo legal e o trecho que fundamentam cada classificação.",
};

export const revalidate = 900;

type Params = Promise<Record<string, string | undefined>>;

export default async function BonsExemplos({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const tema = sp.tema ? temaPorSlug(sp.tema) : undefined;

  const [lista, cobertura] = await Promise.all([bonsExemplos(60, tema), coberturaAnalise()]);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold">
          Bons exemplos <span className="opacity-60">· projetos que ampliam direitos</span>
        </h1>
        <p className="max-w-3xl opacity-80">
          Nem todo monitoramento precisa ser denúncia. Estas são as proposições que{" "}
          <strong>ampliam</strong> direitos — úteis para apoiar publicamente, cobrar
          andamento de quem trava, e mostrar que a régua deste portal reconhece os dois
          lados com o mesmo critério.
        </p>
      </header>

      <FiltroTema atual={tema?.slug} base="/bons-exemplos" />

      {lista.length === 0 ? (
        <Vazio cobertura={cobertura} tema={tema?.nome} />
      ) : (
        <>
          <p className="text-sm opacity-70">
            {lista.length} {lista.length === 1 ? "proposição" : "proposições"}
            {tema ? ` em ${tema.nome}` : ""}, da mais expressiva para a menos.
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
