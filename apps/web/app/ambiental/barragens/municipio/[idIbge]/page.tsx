import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/lib/ambiental/link";
import { formatNumberBR } from "@/lib/betim/format";
import { comoIdMunicipio } from "@/lib/db/queries/municipios";
import { listarMunicipiosComBarragens } from "@/lib/db/queries/barragens";
import {
  FONTE_FEAM,
  FONTE_SNISB,
  METODO_MONTANTE,
  getBarragensData,
  type BarragemUnificada,
} from "@/lib/betim/barragens";

type Params = Promise<{ idIbge: string }>;

/**
 * Uma página por município com barragem em pelo menos uma das duas fontes —
 * mesmo padrão de `ambiental/copam/municipio/[idIbge]`. A composição das
 * duas fontes é a MESMA usada pela ficha de cidade do portal
 * (`app/[municipio]/meio-ambiente/barragens`, `lib/betim/barragens.ts`) —
 * reaproveitada aqui em vez de duplicar o algoritmo de junção por nome, que
 * é o núcleo desta seção.
 */
export async function generateStaticParams() {
  return (await listarMunicipiosComBarragens()).map((m) => ({ idIbge: m.idIbge }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { idIbge } = await params;
  const municipios = await listarMunicipiosComBarragens();
  const nome = municipios.find((m) => m.idIbge === idIbge)?.nome ?? idIbge;
  return {
    title: `Barragens em ${nome} — Controle Popular · Ambiental`,
    description: `Barragens registradas em ${nome}/MG no inventário da FEAM e no cadastro nacional do SNISB: condição de estabilidade, nível de emergência e categoria de risco.`,
  };
}

function Etiqueta({ children, alerta }: { children: React.ReactNode; alerta?: boolean }) {
  return (
    <span
      className="rounded-md border px-2 py-0.5 text-xs"
      style={{
        borderColor: alerta ? "var(--cp-alert)" : "var(--cp-border)",
        color: alerta ? "var(--cp-alert)" : undefined,
      }}
    >
      {children}
    </span>
  );
}

function LinhaBarragem({ b }: { b: BarragemUnificada }) {
  const emergencia = b.nivelEmergencia ?? 0;
  return (
    <li className="rounded-lg border border-[var(--cp-border)] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">{b.nome}</p>
        <p className="font-tabular text-xs opacity-60">{b.fontes.join(" + ")}</p>
      </div>
      {b.empreendedor ? <p className="mt-1 text-sm opacity-80">{b.empreendedor}</p> : null}

      <p className="mt-2 flex flex-wrap gap-1.5">
        {emergencia > 0 ? <Etiqueta alerta>nível de emergência {emergencia}</Etiqueta> : null}
        {b.metodoConstrutivo === METODO_MONTANTE ? <Etiqueta alerta>alteamento a montante</Etiqueta> : null}
        {b.condicaoEstabilidade && b.condicaoEstabilidade !== "Atestada" ? (
          <Etiqueta alerta>estabilidade: {b.condicaoEstabilidade.toLowerCase()}</Etiqueta>
        ) : null}
        {b.condicaoEstabilidade === "Atestada" ? <Etiqueta>estabilidade atestada</Etiqueta> : null}
        {b.suspensao === "Sim" ? <Etiqueta alerta>operação suspensa</Etiqueta> : null}
        {b.possuiPae ? <Etiqueta>PAE: {b.possuiPae.toLowerCase()}</Etiqueta> : null}
      </p>

      <p className="mt-2 text-xs opacity-60">
        {[
          b.uso,
          b.situacao,
          b.categoriaRisco && `risco ${b.categoriaRisco.toLowerCase()}`,
          b.danoPotencial && `dano potencial ${b.danoPotencial.toLowerCase()}`,
          b.alturaM ? `${formatNumberBR(b.alturaM)} m de altura` : null,
          b.cursoDagua,
          b.orgaoFiscalizador,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </li>
  );
}

export default async function MunicipioBarragensPage({ params }: { params: Params }) {
  const { idIbge } = await params;
  const municipios = await listarMunicipiosComBarragens();
  const registro = municipios.find((m) => m.idIbge === idIbge);
  if (!registro) notFound();

  const dados = await getBarragensData(comoIdMunicipio(idIbge));
  const { barragens } = dados;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <nav className="text-sm">
        <Link href="/barragens" className="underline opacity-80 hover:opacity-100">
          ← barragens em Minas Gerais
        </Link>
      </nav>

      <header className="mt-4 space-y-2">
        <p
          className="text-[.82em] font-semibold uppercase tracking-wide"
          style={{ color: "var(--cp-tertiary)" }}
        >
          Barragens em Minas Gerais
        </p>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{registro.nome}/MG</h1>
        <p className="max-w-xl text-sm opacity-75">
          {barragens.length === 0
            ? "Nenhuma barragem registrada nas duas fontes consultadas."
            : `${formatNumberBR(barragens.length)} ${barragens.length === 1 ? "barragem" : "barragens"} registradas, das duas fontes.`}
        </p>
      </header>

      {barragens.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-[var(--cp-border)] p-5 text-sm opacity-80">
          <p>Nenhuma barragem de {registro.nome} está na FEAM nem no SNISB.</p>
          <p className="mt-2 text-xs opacity-70">
            Isso não é o mesmo que &quot;não existe barragem na cidade&quot;: as duas fontes só
            listam barragens acima de porte definido em lei, e o SNISB casa município por nome,
            não por código do IBGE — uma grafia fora do previsto some da conta.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {dados.emEmergencia.length > 0 ? (
              <div className="rounded-lg border p-3" style={{ borderColor: "var(--cp-alert)" }}>
                <p className="font-tabular text-2xl font-bold" style={{ color: "var(--cp-alert)" }}>
                  {dados.emEmergencia.length}
                </p>
                <p className="text-xs opacity-75">em nível de emergência ≥ 1 (FEAM)</p>
              </div>
            ) : null}
            {dados.semEstabilidadeAtestada.length > 0 ? (
              <div className="rounded-lg border p-3" style={{ borderColor: "var(--cp-alert)" }}>
                <p className="font-tabular text-2xl font-bold" style={{ color: "var(--cp-alert)" }}>
                  {dados.semEstabilidadeAtestada.length}
                </p>
                <p className="text-xs opacity-75">sem condição de estabilidade atestada (FEAM)</p>
              </div>
            ) : null}
            {dados.aMontante.length > 0 ? (
              <div className="rounded-lg border p-3" style={{ borderColor: "var(--cp-alert)" }}>
                <p className="font-tabular text-2xl font-bold" style={{ color: "var(--cp-alert)" }}>
                  {dados.aMontante.length}
                </p>
                <p className="text-xs opacity-75">
                  erguidas a montante — técnica de Mariana e Brumadinho (FEAM)
                </p>
              </div>
            ) : null}
            {dados.semPae.length > 0 ? (
              <div className="rounded-lg border p-3" style={{ borderColor: "var(--cp-alert)" }}>
                <p className="font-tabular text-2xl font-bold" style={{ color: "var(--cp-alert)" }}>
                  {dados.semPae.length}
                </p>
                <p className="text-xs opacity-75">sem Plano de Ação de Emergência (SNISB)</p>
              </div>
            ) : null}
          </div>

          <p className="mt-6 max-w-2xl rounded-lg border border-dashed border-[var(--cp-border)] px-4 py-3 text-xs opacity-75">
            {dados.totalFeam > 0 ? `${dados.totalFeam} no inventário da FEAM` : "Nenhuma na FEAM"} ·{" "}
            {dados.totalSnisb} no cadastro nacional (SNISB)
            {dados.emAmbas > 0 ? ` · ${dados.emAmbas} presentes nas duas listas` : ""}.{" "}
            <strong>O total é estimado, não exato.</strong> As duas fontes não têm identificador
            comum: o cruzamento é por nome da barragem, então grafias diferentes da mesma represa
            podem contar duas vezes, e duas represas de mesmo nome podem contar como uma.
          </p>

          <section className="mt-8">
            <h2 className="font-display text-lg font-semibold">Uma a uma</h2>
            <p className="mt-1 text-xs opacity-60">
              Em ordem de atenção: nível de emergência, depois alteamento a montante, depois
              estabilidade não atestada. A etiqueta da direita diz em que cadastro a barragem
              aparece.
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {barragens.map((b) => (
                <LinhaBarragem key={b.chave} b={b} />
              ))}
            </ul>
          </section>
        </>
      )}

      <p className="mt-10 max-w-xl text-xs opacity-60">
        Fontes:{" "}
        <a href={FONTE_FEAM.url} target="_blank" rel="noopener noreferrer" className="underline">
          {FONTE_FEAM.nome} ↗
        </a>{" "}
        (anual, base 2024, só mineração e indústria de Minas) e{" "}
        <a href={FONTE_SNISB.url} target="_blank" rel="noopener noreferrer" className="underline">
          {FONTE_SNISB.nome} ↗
        </a>{" "}
        (nacional, todos os usos). Este portal não afirma irregularidade: é a reprodução do
        cadastro como as fontes oficiais publicam.
      </p>
    </div>
  );
}
