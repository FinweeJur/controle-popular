import type { Metadata } from "next";
import Link from "@/lib/judiciario/link";
import { listarTribunais } from "@/lib/judiciario/tribunais";

export const metadata: Metadata = {
  title: "Tribunais — Controle Popular · Judiciário",
  description:
    "Composição legal dos tribunais superiores brasileiros: quantas cadeiras, por qual cota de origem, e quem indica.",
};

export const revalidate = 900;

const RAMO_NOME: Record<string, string> = {
  constitucional: "Constitucional",
  superior: "Superior",
  trabalho: "Trabalho",
  militar: "Militar",
  eleitoral: "Eleitoral",
};

export default async function Tribunais() {
  const tribunais = await listarTribunais();

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Tribunais</h1>
        <p className="max-w-3xl opacity-80">
          Cada tribunal tem um número legal de cadeiras e uma regra de origem para cada uma
          — carreira, quinto (OAB/MP), terço ou vaga livre. É a cadeira, não a pessoa, que
          o app acompanha ao longo do tempo.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {tribunais.map((t) => (
          <Link
            key={t.id}
            href={`/tribunais/${t.id}`}
            className="rounded-lg border border-[var(--cp-border)] p-4 hover:border-[var(--cp-primary)]"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-lg font-semibold">
                <span className="uppercase">{t.id}</span>
              </h2>
              <span className="font-tabular text-sm opacity-60">{t.n_cadeiras} cadeiras</span>
            </div>
            <p className="text-sm opacity-80">{t.nome}</p>
            <p className="mt-1 text-xs opacity-60">
              {RAMO_NOME[t.ramo] ?? t.ramo}
              {t.exige_sabatina_senado ? " · sabatina do Senado" : " · membros eleitos"}
              {t.base_legal ? ` · ${t.base_legal}` : ""}
            </p>
          </Link>
        ))}
      </div>

      <p className="text-sm opacity-70">
        A 2ª instância (27 TJs, TRFs, TRTs) entra por adoção incremental. Ver{" "}
        <Link href="/metodologia" className="underline">
          metodologia
        </Link>
        .
      </p>
    </div>
  );
}
