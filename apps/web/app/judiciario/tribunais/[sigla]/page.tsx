import type { Metadata } from "next";
import Link from "@/lib/judiciario/link";
import { notFound } from "next/navigation";
import {
  obterTribunal,
  ocupacoesAtuais,
  listarNomeacoes,
  mandatosDirecao,
  integrantesSemCadeira,
  listarTribunais,
} from "@/lib/judiciario/tribunais";
import { agregarPoder } from "@/lib/judiciario/agregado";
import { TRIBUNAIS } from "@/lib/judiciario/regras";
import { rotuloCota, rotuloMotivoVacancia, rotuloResultado } from "@/lib/judiciario/rotulos";
import FonteRodape, {
  FONTE_SENADO,
  FONTE_REGUA,
  type Fonte,
} from "@/app/judiciario/components/FonteRodape";
import { fontesDaComposicao } from "@/lib/judiciario/procedencia";

/**
 * Parte da RÉGUA (`regras.json`) e completa com o BANCO.
 *
 * Antes vinha só de `TRIBUNAIS`, que tem apenas os cinco superiores. TJMG e
 * TRF6 existem em `tribunais` desde a migration 0008 e ficariam sem página
 * pré-gerada — o que na Fase 5 (estaticização para o Workers) viraria 404, o
 * modo de falha que este repo já registrou três vezes com o basePath.
 */
export async function generateStaticParams() {
  const daRegua = Object.keys(TRIBUNAIS);
  let doBanco: string[] = [];
  try {
    doBanco = (await listarTribunais()).map((t) => t.id);
  } catch {
    /* build sem banco: fica só a régua */
  }
  return [...new Set([...daRegua, ...doBanco])].map((sigla) => ({ sigla }));
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
  // 2ª instância (TJ, TRF, TRT) é um TERCEIRO caso, não "o que não é TSE".
  // A nomeação NÃO passa pelo Senado (regras.json, `segunda_instancia.nota`),
  // então a seção de indicações e a de poder de indicação — que existem para
  // ler o rastro do Senado — não se aplicam. Sem esta distinção, a página do
  // TJMG afirmaria que "toda nomeação a este tribunal passa pelo Senado",
  // que é falso.
  const ehSegundaInstancia = t.instancia === "segunda";

  const ocupacoes = ehEletivo ? [] : await ocupacoesAtuais(sigla);
  const nomeacoes = ehEletivo ? [] : (await listarNomeacoes(sigla)) ?? [];
  const mandatos = ehEletivo ? await mandatosDirecao(sigla) : [];
  const semCadeira = await integrantesSemCadeira(sigla);
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

  // Crédito de fonte DERIVADO do próprio dado (`fonte_curadoria`, gravado
  // por `etl/composicao.py`), nunca de uma tabela de URLs escrita à mão
  // aqui. A derivação e a guarda de "fonte que não é URL" moram em
  // `lib/judiciario/procedencia.ts`, com teste.
  const fontesDaPagina: Fonte[] = [
    FONTE_REGUA,
    ...fontesDaComposicao(semCadeira),
    // O Senado só é fonte onde a nomeação passa por ele: nem na 2ª
    // instância, nem no TSE, cujos membros são eleitos pelos tribunais.
    ...(ehSegundaInstancia || ehEletivo ? [] : [FONTE_SENADO]),
  ];

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
          {t.n_cadeiras ? `${t.n_cadeiras} cadeiras · ` : ""}
          {t.exige_sabatina_senado
            ? "nomeação pelo Presidente, aprovada pelo Senado"
            : ehEletivo
              ? "membros eleitos pelos próprios tribunais"
              : `nomeação pelo ${t.autoridade_nomeante ?? "chefe do Executivo"}, sem sabatina do Senado`}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Como as cadeiras são preenchidas</h2>
        {ehSegundaInstancia ? (
          <p className="text-sm opacity-70">
            Em tribunal de segunda instância, quatro de cada cinco cadeiras são de juízes de
            carreira, promovidos alternadamente por antiguidade e merecimento (CF art. 93, II).
            A quinta é o <strong>quinto constitucional</strong> (CF art. 94): reservada a
            advogados e a membros do Ministério Público com mais de dez anos de atividade, por
            lista sêxtupla da entidade de classe, reduzida a três pelo próprio tribunal, com
            nomeação pelo Executivo em até 20 dias.{" "}
            <strong>Nomeação de tribunal de segunda instância não passa pelo Senado.</strong>
          </p>
        ) : (
          <p className="text-sm opacity-70">
            Cada cadeira deste tribunal tem uma origem fixa definida pela Constituição — algumas
            só podem ser ocupadas por quem já é juiz de carreira, outras são reservadas a
            advogados ou ao Ministério Público. É essa regra que decide quem pode concorrer a
            cada vaga.
          </p>
        )}
        <div className="flex flex-wrap gap-2 text-sm">
          {Object.entries(cotas).map(([cota, n]) => (
            <span key={cota} className="rounded border border-[var(--cp-border)] px-2 py-1">
              {rotuloCota(cota)}: <span className="font-tabular">{n}</span>
            </span>
          ))}
        </div>
      </section>

      {/* Integrantes SEM cadeira atribuída.
          Fica fora do `if` de TSE/2ª instância porque vale para os três casos:
          é aqui que aparecem os 26 ministros do TST (cadeira existe, mas a
          fonte não diz quem entrou pelo quinto), os 18 do TRF6 e os 148 do
          TJMG. Ver `etl/composicao.py` e a migration 0008. */}
      {semCadeira.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold">
            Quem integra o tribunal{" "}
            <span className="font-normal opacity-70">({semCadeira.length})</span>
          </h2>
          <p className="text-sm opacity-70">
            {t.n_cadeiras
              ? `${semCadeira.length} de ${t.n_cadeiras} cadeiras têm integrante identificado por este portal. `
              : ""}
            A fonte oficial deste tribunal publica os nomes, mas{" "}
            <strong>não diz quem ocupa qual cadeira nem por qual cota</strong> entrou. Este
            portal não preenche essa lacuna por dedução: atribuir cota sem fonte mudaria a
            contagem de quantas vagas de cada origem abrem nos próximos anos, que é justamente
            o número que ele existe para acertar. Por isso estes nomes aparecem como
            integrantes, sem cadeira e sem projeção de vacância.
          </p>
          <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {semCadeira.map((m) => (
              <li
                key={m.id}
                className="flex items-baseline justify-between gap-2 border-b border-[var(--cp-border)] py-1"
              >
                <span>
                  {m.url_curriculo ? (
                    <a
                      href={m.url_curriculo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {m.nome}
                    </a>
                  ) : (
                    m.nome
                  )}
                </span>
                {m.origem_carreira ? (
                  <span className="shrink-0 text-xs opacity-60">{m.origem_carreira}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
      ) : ehSegundaInstancia ? null : (
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
                      // Era `var(--cp-danger, #b91c1c)` -- nunca definida
                      // em globals.css, caía sempre no fallback: cor fixa
                      // em todo tema e fora do alcance da paleta segura
                      // para daltônicos. `text-alert` é o token que existe.
                      <p
                        className={
                          n.resultado === "rejeitado_plenario"
                            ? "text-xs font-medium text-alert"
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
                    {/* Mesmo `url_fonte` de `/judiciario/indicacoes`: já vinha
                        do ETL e do tipo `Nomeacao`, nunca havia sido exibido. */}
                    {n.url_fonte && (
                      <p className="mt-1 text-xs">
                        <a
                          href={n.url_fonte}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium underline"
                        >
                          documento no Senado ↗
                        </a>
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <FonteRodape fontes={fontesDaPagina} />
    </div>
  );
}
