import Link from "@/lib/judiciario/link";
import OutrasFrentes from "@/app/components/OutrasFrentes";
import { listarTribunais, proximasVacancias, listarNomeacoes } from "@/lib/judiciario/tribunais";
import { rotuloResultado } from "@/lib/judiciario/rotulos";

const fmtData = (d: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

const fmtAno = (d: string | null) => {
  if (!d) return null;
  const anos = new Date(d).getFullYear() - new Date().getFullYear();
  if (anos <= 0) return "este ano";
  if (anos === 1) return "em 1 ano";
  return `em ${anos} anos`;
};

export default async function Home() {
  const [tribunais, proximas, nomeacoes] = await Promise.all([
    listarTribunais(),
    proximasVacancias(3),
    listarNomeacoes(),
  ]);
  const totalCadeiras = tribunais.reduce((s, t) => s + (t.n_cadeiras ?? 0), 0);
  const ultimaIndicacao = (nomeacoes ?? [])[0];

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-12">
      <section className="space-y-4">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Quem ocupa, quem indicou, quando vaga
        </h1>
        <p className="max-w-2xl text-lg opacity-80">
          O Judiciário é o único Poder da República cujos membros não passam por eleição em
          nenhum grau. Este site acompanha, cadeira por cadeira, quem ocupa cada tribunal,
          quem indicou cada ministro e quando cada um deles vai completar 75 anos — a idade
          em que a lei obriga todo magistrado a se aposentar.
        </p>
        <p className="max-w-2xl text-sm opacity-70">
          Nenhum número desta página é opinião ou estimativa: todos vêm direto de fontes
          oficiais (o Senado Federal e os próprios tribunais), com link para conferir na
          fonte em cada página.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--cp-border)] p-4">
          <p className="font-tabular text-3xl font-semibold">{tribunais.length}</p>
          <p className="mt-1 font-medium">Tribunais acompanhados</p>
          <p className="mt-1 text-sm opacity-70">
            {totalCadeiras} cadeiras ao todo — STF, STJ, TST, STM e TSE
          </p>
        </div>
        <div className="rounded-lg border border-[var(--cp-border)] p-4">
          <p className="font-tabular text-3xl font-semibold">
            {proximas[0] ? fmtData(proximas[0].vacancia_projetada) : "—"}
          </p>
          <p className="mt-1 font-medium">Próxima aposentadoria prevista</p>
          <p className="mt-1 text-sm opacity-70">
            {proximas[0]
              ? `${proximas[0].magistrado_nome} (${proximas[0].tribunal_id?.toUpperCase()}), ${fmtAno(proximas[0].vacancia_projetada)}`
              : "ainda não calculada para este tribunal"}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--cp-border)] p-4">
          <p className="font-tabular text-3xl font-semibold">
            {ultimaIndicacao?.senado_identificacao ?? "—"}
          </p>
          <p className="mt-1 font-medium">Indicação mais recente</p>
          <p className="mt-1 text-sm opacity-70">
            {ultimaIndicacao
              ? `${ultimaIndicacao.tribunal_id?.toUpperCase()} — ${rotuloResultado(ultimaIndicacao.resultado)}`
              : "nenhuma registrada ainda"}
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/tribunais"
          className="rounded-lg border border-[var(--cp-border)] p-5 hover:border-[var(--cp-primary)]"
        >
          <h2 className="font-display text-lg font-semibold">Ver os tribunais</h2>
          <p className="mt-1 text-sm opacity-70">
            Quem ocupa cada cadeira hoje, e quem indicou.
          </p>
        </Link>
        <Link
          href="/vagas"
          className="rounded-lg border border-[var(--cp-border)] p-5 hover:border-[var(--cp-primary)]"
        >
          <h2 className="font-display text-lg font-semibold">Próximas vagas</h2>
          <p className="mt-1 text-sm opacity-70">
            Quando cada ministro atinge a idade de aposentadoria obrigatória.
          </p>
        </Link>
        <Link
          href="/indicacoes"
          className="rounded-lg border border-[var(--cp-border)] p-5 hover:border-[var(--cp-primary)]"
        >
          <h2 className="font-display text-lg font-semibold">Indicações ao Senado</h2>
          <p className="mt-1 text-sm opacity-70">
            Todo nome enviado pelo Presidente, aprovado ou rejeitado.
          </p>
        </Link>
      </section>

      <section className="rounded-lg border border-[var(--cp-border)] p-5 text-sm">
        <p className="opacity-80">
          Quer entender como cada número é calculado — sem chute, sem opinião escondida?
        </p>
        <p className="mt-2">
          <Link href="/metodologia" className="underline">
            Veja a metodologia completa
          </Link>
        </p>
      </section>

      <OutrasFrentes atual="judiciario" />
    </div>
  );
}
