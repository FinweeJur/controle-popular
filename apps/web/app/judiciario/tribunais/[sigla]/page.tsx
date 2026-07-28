import type { Metadata } from "next";
import Link from "@/lib/judiciario/link";
import { notFound } from "next/navigation";
import {
  obterTribunal,
  ocupacoesAtuais,
  listarNomeacoes,
  mandatosDirecao,
} from "@/lib/judiciario/tribunais";
import { agregarPoder } from "@/lib/judiciario/agregado";
import { TRIBUNAIS } from "@/lib/judiciario/regras";
import { rotuloCota, rotuloMotivoVacancia, rotuloResultado } from "@/lib/judiciario/rotulos";

export const revalidate = 900;

export async function generateStaticParams() {
  return Object.keys(TRIBUNAIS).map((sigla) => ({ sigla }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sigla: string }>;
}): Promise<Metadata> {
  const { sigla } = await params;
  const t = await obterTribunal(sigla);
  return {
    title: t
      ? `${sigla.toUpperCase()} — Controle Popular · Judiciário`
      : "Tribunal — Controle Popular · Judiciário",
    description: t?.nome ?? undefined,
  };
}

const fmtData = (d: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

export default async function TribunalPage({
  params,
}: {
  params: Promise<{ sigla: string }>;
}) {
  const { sigla } = await params;
  const t = await obterTribunal(sigla);
  if (!t) notFound();

  // TSE não usa ocupações/vw_vacancia — ver a nota em lib/tribunais.ts
  // (mandatosDirecao): a vacância de 75 anos ali é da cadeira de ORIGEM
  // do ministro (STF/STJ), não do biênio de 2 anos no TSE.
  const ehEletivo = sigla === "tse";

  const ocupacoes = ehEletivo ? [] : await ocupacoesAtuais(sigla);
  const nomeacoes = ehEletivo ? [] : (await listarNomeacoes(sigla)) ?? [];
  const mandatos = ehEletivo ? await mandatosDirecao(sigla) : [];
  const ag = agregarPoder(sigla, t.n_cadeiras ?? ocupacoes.length, ocupacoes, nomeacoes);

  // Distribuição de cadeiras por cota (composição legal, da régua).
  const cotas = TRIBUNAIS[sigla]?.cotas ?? {};

  const CARGO_LABEL: Record<string, string> = {
    presidente: "Presidente",
    vice_presidente: "Vice-Presidente",
    corregedor_eleitoral: "Corregedor(a) Eleitoral",
    efetivo_eletiva_stf: "Efetivo — eleito pelo STF",
    efetivo_eletiva_stj: "Efetivo — eleito pelo STJ",
    efetivo_advogado: "Efetivo — lista do STF (advocacia)",
    substituto_eletiva_stf: "Substituto — eleito pelo STF",
    substituto_eletiva_stj: "Substituto — eleito pelo STJ",
    substituto_advogado: "Substituto — lista do STF (advocacia)",
  };
  const direcao = mandatos.filter((m) => m.cargo === "presidente" || m.cargo === "vice_presidente" || m.cargo === "corregedor_eleitoral");
  const membros = mandatos.filter((m) => !direcao.includes(m));

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide opacity-60">
          {t.base_legal}
        </p>
        <h1 className="font-display text-3xl font-bold">
          <span className="uppercase">{sigla}</span> · {t.nome}
        </h1>
        <p className="opacity-80">
          {t.n_cadeiras} cadeiras ·{" "}
          {t.exige_sabatina_senado
            ? "nomeação pelo Presidente, aprovada pelo Senado"
            : "membros eleitos pelos próprios tribunais"}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Como as cadeiras são preenchidas</h2>
        <p className="text-sm opacity-70">
          Cada cadeira deste tribunal tem uma origem fixa definida pela Constituição — algumas
          só podem ser ocupadas por quem já é juiz de carreira, outras são reservadas a
          advogados ou ao Ministério Público. É essa regra que decide quem pode concorrer a
          cada vaga.
        </p>
        <div className="flex flex-wrap gap-2 text-sm">
          {Object.entries(cotas).map(([cota, n]) => (
            <span key={cota} className="rounded border border-[var(--cp-border)] px-2 py-1">
              {rotuloCota(cota)}: <span className="font-tabular">{n}</span>
            </span>
          ))}
        </div>
      </section>

      {ehEletivo ? (
        <>
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold">Direção e corregedoria</h2>
            {direcao.length === 0 ? (
              <p className="rounded-lg border border-[var(--cp-border)] p-4 text-sm opacity-80">
                Composição ainda não semeada.
              </p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {direcao.map((m) => (
                    <tr key={m.id} className="border-b border-[var(--cp-border)]">
                      <td className="py-1.5">{CARGO_LABEL[m.cargo ?? ""] ?? m.cargo}</td>
                      <td className="py-1.5">{m.magistrado_nome}</td>
                      <td className="py-1.5 font-tabular text-right opacity-70">
                        {fmtData(m.data_inicio)} – {fmtData(m.data_fim)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold">Composição — efetivos e substitutos</h2>
            {membros.length === 0 ? (
              <p className="rounded-lg border border-[var(--cp-border)] p-4 text-sm opacity-80">
                Composição ainda não semeada.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--cp-border)] text-left">
                    <th className="py-1">Ministro(a)</th>
                    <th className="py-1">Vaga</th>
                    <th className="py-1">Biênio até</th>
                  </tr>
                </thead>
                <tbody>
                  {membros.map((m) => (
                    <tr key={m.id} className="border-b border-[var(--cp-border)]">
                      <td className="py-1">{m.magistrado_nome}</td>
                      <td className="py-1 opacity-70">{CARGO_LABEL[m.cargo ?? ""] ?? m.cargo}</td>
                      <td className="py-1 font-tabular opacity-70">
                        {m.data_fim ? fmtData(m.data_fim) : <span className="opacity-50">não registrado</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="text-xs opacity-60">
              O TSE não passa por sabatina do Senado — 3 ministros são eleitos pelo STF, 2
              pelo STJ, e 2 advogados são nomeados a partir de lista sêxtupla do STF (CF
              arts. 119 e 121, §2º). Mandato de 2 anos, no máximo 2 biênios consecutivos.
            </p>
          </section>
        </>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold">Poder de indicação</h2>
            <p className="text-sm opacity-80">{ag.frase}</p>
            {ag.cobertura >= 1 / 3 && ag.poder.length > 0 && (
              <ul className="space-y-1 text-sm">
                {ag.poder.map((p) => (
                  <li
                    key={p.autoridade}
                    className="flex justify-between border-b border-[var(--cp-border)] py-1"
                  >
                    <span>{p.autoridade}</span>
                    <span className="font-tabular opacity-70">
                      {p.cadeiras} / {ag.totalCadeiras}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs opacity-60">
              Cobertura: {ag.comNomeanteConhecido} de {ag.totalCadeiras} cadeiras têm nomeante
              conhecido. O agregado descreve a composição do tribunal, não avalia nenhum
              magistrado.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold">Composição atual</h2>
            {ocupacoes.length === 0 ? (
              <p className="rounded-lg border border-[var(--cp-border)] p-4 text-sm opacity-80">
                A lista de quem ocupa cada cadeira deste tribunal ainda não foi conferida e
                publicada — é um trabalho de curadoria feito nome a nome, para garantir que
                cada data esteja correta antes de ir ao ar. As indicações enviadas ao Senado
                (abaixo) já estão disponíveis.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--cp-border)] text-left">
                    <th className="py-1">Ministro(a)</th>
                    <th className="py-1">Cota</th>
                    <th className="py-1">Posse</th>
                    <th className="py-1">Vacância projetada</th>
                  </tr>
                </thead>
                <tbody>
                  {ocupacoes.map((o) => (
                    <tr key={o.ocupacao_id} className="border-b border-[var(--cp-border)]">
                      <td className="py-1">{o.magistrado_nome}</td>
                      <td className="py-1 opacity-70">{rotuloCota(o.cota)}</td>
                      <td className="py-1 font-tabular opacity-70">{fmtData(o.data_posse)}</td>
                      <td className="py-1 font-tabular">
                        {o.vacancia_projetada ? (
                          fmtData(o.vacancia_projetada)
                        ) : (
                          <span className="opacity-50">nascimento não localizado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold">Indicações enviadas ao Senado</h2>
            <p className="text-sm opacity-70">
              Toda nomeação a este tribunal passa pelo Senado antes de valer — o Presidente
              indica um nome, uma comissão avalia (a chamada &quot;sabatina&quot;), e o plenário
              vota. É esse rastro público que aparece abaixo.
            </p>
            {nomeacoes.length === 0 ? (
              <p className="rounded-lg border border-[var(--cp-border)] p-4 text-sm opacity-80">
                Nenhuma indicação a este tribunal foi encontrada nos registros do Senado
                consultados até agora.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {nomeacoes.slice(0, 20).map((n) => (
                  <li key={n.id} className="border-b border-[var(--cp-border)] py-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{n.senado_identificacao}</span>
                      <span className="font-tabular opacity-60">{fmtData(n.data_deliberacao)}</span>
                    </div>
                    {n.resultado && (
                      <p
                        className={
                          n.resultado === "rejeitado_plenario"
                            ? "text-xs font-medium text-[var(--cp-danger,#b91c1c)]"
                            : "text-xs opacity-60"
                        }
                      >
                        {rotuloResultado(n.resultado)}
                      </p>
                    )}
                    {n.dispositivo_vaga && (
                      <p className="text-xs opacity-60">{n.dispositivo_vaga}</p>
                    )}
                    {n.antecessor_nome && (
                      <p className="text-xs opacity-60">
                        vaga de {n.antecessor_nome}
                        {n.motivo_vacancia ? ` (${rotuloMotivoVacancia(n.motivo_vacancia)})` : ""}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
