import type { Metadata } from "next";
import FooterGlobal from "@/app/components/FooterGlobal";
import Moeda from "@/app/components/Moeda";
import { formatNumberBR } from "@/lib/betim/format";
import { ZONAS } from "@/lib/zonas";
import {
  MUNICIPIOS_EXECUCAO_FGV,
  PROJETOS_EXECUCAO_FGV,
  PROJETOS_ESPECIAIS_FGV,
  STATUS_PROJETOS_FGV,
  REFERENCIA_EXECUCAO_FGV,
  TOTAL_EXECUCAO_FGV,
} from "@/lib/paraopeba/execucao-fgv";
import { metadataEditavel } from "@/lib/edicoes";

/**
 * `/paraopeba/execucao` — quanto do Acordo de Reparação já virou projeto e
 * quanto já foi pago, município a município, pela auditoria da FGV.
 *
 * ═══ POR QUE NÃO TEM COMPONENTE DE CLIENTE ═══
 *
 * São 450 linhas de projeto e 455 de status. Entregá-las como props de um
 * componente `"use client"` filtrável seria repetir o que travou o deploy em
 * 15/08 (`docs/HANDOFF-PAYLOAD-LEGISLACAO.md`): o payload vai embutido duas
 * vezes, HTML e RSC flight, com o nome de todo campo repetido linha a linha.
 * Aqui a tabela é montada no servidor e o detalhamento por município abre em
 * `<details>` nativo — zero JavaScript, zero props serializadas.
 *
 * Medido em 15/08/2026 no dev server da porta 3034, descontando as tags
 * `<script>` que só existem em desenvolvimento: **211.472 bytes de markup,
 * 17.317 depois do gzip** (~17 KiB). É aproximação, não o `.cache` do build
 * — mas o teto do Worker é 25 MiB por asset, e 17 KiB está três ordens de
 * grandeza abaixo. Se um dia isto virar componente de cliente com filtro,
 * medir de novo ANTES de publicar.
 *
 * ═══ TRÊS CUIDADOS DE LEITURA QUE A TELA PRECISA CARREGAR ═══
 *
 * 1. **R$ 5,48 bi ≠ R$ 37,6 bi.** O que a FGV audita aqui são os Anexos I.3
 *    e I.4 — a fatia do Acordo que vira projeto dentro dos municípios da
 *    bacia. Mobilidade, segurança hídrica e fortalecimento do serviço
 *    público correm por fora, sob gestão do Estado. A tela diz isso antes de
 *    mostrar qualquer número.
 * 2. **"Executado" é desembolso, não obra pronta.** O avanço FÍSICO é outro
 *    dado, que esta coleta não traz — e chamar dinheiro pago de obra
 *    entregue é exatamente o salto que este portal existe para não dar.
 * 3. **455 linhas de status são 234 projetos.** Um projeto que alcança 25
 *    cidades aparece 25 vezes. A contagem exibida é de `idFdi` distinto.
 */
export const metadata: Metadata = metadataEditavel("/paraopeba/execucao", {
  title: "Execução do Acordo por município — Paraopeba | Controle Popular",
  description:
    "Quanto do Acordo de Reparação de Brumadinho já virou projeto e quanto já foi pago em cada um dos 26 municípios da Bacia do Paraopeba, pela auditoria independente da FGV.",
});

/** Cor da frente, do registro único de zonas — nunca hex cravado aqui. */
const COR = ZONAS.find((z) => z.id === "paraopeba")!.cor;

/** Soma o executado das linhas de projeto de um município. */
function executadoDe(municipio: string): number {
  return PROJETOS_EXECUCAO_FGV.filter((p) => p.municipio === municipio).reduce(
    (s, p) => s + p.executado,
    0,
  );
}

function percentual(parte: number, todo: number): number {
  return todo > 0 ? Math.min(100, (parte / todo) * 100) : 0;
}

/**
 * Percentual com UMA casa e vírgula decimal. `toFixed(1)` sozinho grava
 * "87.2" — ponto decimal em página escrita em português, que é o mesmo tipo
 * de vazamento de formato que `formatDateBR` existe para evitar nas datas.
 */
function pct(valor: number): string {
  return `${formatNumberBR(Number(valor.toFixed(1)))}%`;
}

/** Barra de proporção sem biblioteca — só tokens, nunca hex cravado. */
function Barra({ valor }: { valor: number }) {
  return (
    <span
      className="inline-block h-2 w-full overflow-hidden rounded-full bg-chart-track align-middle"
      aria-hidden="true"
    >
      <span
        className="block h-full rounded-full bg-accent"
        style={{ width: `${valor.toFixed(1)}%` }}
      />
    </span>
  );
}

export default function ExecucaoParaopebaPage() {
  const municipios = [...MUNICIPIOS_EXECUCAO_FGV].sort((a, b) => b.acordoAtual - a.acordoAtual);
  const executadoTotal = PROJETOS_EXECUCAO_FGV.reduce((s, p) => s + p.executado, 0);
  const projetosDistintos = new Set(STATUS_PROJETOS_FGV.map((s) => s.idFdi)).size;

  const porStatus = new Map<string, Set<string>>();
  for (const s of STATUS_PROJETOS_FGV) {
    if (!porStatus.has(s.status)) porStatus.set(s.status, new Set());
    porStatus.get(s.status)!.add(s.idFdi);
  }
  const statusOrdenado = [...porStatus.entries()]
    .map(([status, ids]) => ({ status, projetos: ids.size }))
    .sort((a, b) => b.projetos - a.projetos);

  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/paraopeba" className="hover:text-primary">
          Paraopeba
        </a>{" "}
        · <span className="text-text">Execução por município</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Quanto da reparação já virou projeto em cada município
      </h1>
      <p className="mt-2 max-w-3xl text-[1.02em] text-text-soft">
        A FGV é a auditora independente do Acordo Judicial de Reparação de Brumadinho, nomeada
        pelo Juízo da 2ª Vara da Fazenda Pública. Ela publica, mês a mês, quanto cada um dos{" "}
        {formatNumberBR(municipios.length)} municípios da bacia tem a receber, quanto já está
        reservado em projetos com ordem de início e quanto já foi efetivamente pago.
      </p>

      {/* A ressalva vem ANTES do primeiro número: quem lê "R$ 5,48 bi" logo
          depois de "Acordo de R$ 37,6 bi" conclui sozinho que 86% sumiram. */}
      <div className="mt-6 rounded-2xl border border-alert/40 bg-surface-2 p-5">
        <p className="text-[.95em] font-semibold text-text">
          Estes R$ 5,48 bilhões não são o Acordo inteiro.
        </p>
        <p className="mt-2 text-[.92em] text-text-soft">
          O Acordo de 04/02/2021 tem valor global de R$ 37,6 bilhões. O que a FGV audita nesta
          página são os <strong className="text-text">Anexos I.3 e I.4</strong> — a fatia que
          vira projeto dentro de cada município da bacia. Mobilidade (Anexo III), segurança
          hídrica (Anexo II.3), fortalecimento do serviço público (Anexo IV) e reparação
          socioambiental (Anexo II.1) correm por fora, sob execução do Governo de Minas, e não
          entram em nenhum número desta tela. Somar os dois totais inventa dinheiro.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          {
            rotulo: "Acordo atualizado nos 26 municípios",
            valor: (<Moeda value={TOTAL_EXECUCAO_FGV.acordoAtual} />),
            nota: "corrigido pelo IPCA desde 04/02/2021",
          },
          {
            rotulo: "Reservado em projetos autorizados",
            valor: (<Moeda value={TOTAL_EXECUCAO_FGV.empenhosAutorizados} />),
            nota: `${pct(percentual(TOTAL_EXECUCAO_FGV.empenhosAutorizados, TOTAL_EXECUCAO_FGV.acordoAtual))} do acordo atualizado`,
          },
          {
            rotulo: "Efetivamente pago",
            valor: (<Moeda value={executadoTotal} />),
            nota: `${pct(percentual(executadoTotal, TOTAL_EXECUCAO_FGV.acordoAtual))} do acordo atualizado`,
          },
        ].map((c) => (
          <div key={c.rotulo} className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-[.8em] text-text-soft">{c.rotulo}</p>
            <p className="mt-1 font-tabular text-xl font-bold text-text">{c.valor}</p>
            <p className="mt-1 text-[.78em] text-text-soft">{c.nota}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[.85em] text-text-soft">
        <strong className="text-text">&ldquo;Pago&rdquo; é desembolso, não obra pronta.</strong>{" "}
        A FGV chama esta coluna de &ldquo;Execução Atualizada&rdquo;: é o dinheiro que já saiu do
        projeto. O avanço físico da obra é outro relatório, que esta página não traz.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Município a município</h2>
        <p className="mt-1 text-[.9em] text-text-soft">
          Ordenado pelo valor do acordo atualizado. Abra qualquer linha para ver os projetos
          daquele município, com o quanto já foi pago em cada um.
        </p>

        <div className="mt-4 space-y-2">
          {municipios.map((m) => {
            const executado = executadoDe(m.municipio);
            const projetos = PROJETOS_EXECUCAO_FGV.filter((p) => p.municipio === m.municipio);
            const pctPago = percentual(executado, m.acordoAtual);
            return (
              <details
                key={m.municipio}
                className="group rounded-xl border border-border bg-surface px-4 py-3"
              >
                <summary className="cursor-pointer list-none">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="font-semibold text-text">
                      {m.municipio}{" "}
                      <span className="font-normal text-text-soft">
                        · {formatNumberBR(projetos.length)}{" "}
                        {projetos.length === 1 ? "projeto" : "projetos"}
                      </span>
                    </span>
                    <span className="font-tabular text-[.9em] text-text-soft">
                      <Moeda value={executado} /> pagos de{" "}
                      <span className="text-text"><Moeda value={m.acordoAtual} /></span> ·{" "}
                      {pct(pctPago)}
                    </span>
                  </span>
                  <span className="mt-2 block">
                    <Barra valor={pctPago} />
                  </span>
                </summary>

                <div className="mt-3 border-t border-border pt-3">
                  <dl className="grid grid-cols-2 gap-3 text-[.85em] sm:grid-cols-4">
                    <div>
                      <dt className="text-text-soft">Acordo original</dt>
                      <dd className="font-tabular font-medium">
                        <Moeda value={m.acordoInicial} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-text-soft">Corrigido (IPCA)</dt>
                      <dd className="font-tabular font-medium">
                        <Moeda value={m.acordoAtual} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-text-soft">Reservado em projetos</dt>
                      <dd className="font-tabular font-medium">
                        <Moeda value={m.empenhosAutorizados} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-text-soft">Saldo a destinar</dt>
                      <dd className="font-tabular font-medium">
                        <Moeda value={m.saldoTeto} />
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[34rem] text-left text-[.85em]">
                      <thead className="text-text-soft">
                        <tr className="border-b border-border">
                          <th scope="col" className="py-1.5 pr-3 font-medium">
                            Projeto
                          </th>
                          <th scope="col" className="py-1.5 pr-3 text-right font-medium">
                            Reservado
                          </th>
                          <th scope="col" className="py-1.5 pr-3 text-right font-medium">
                            Pago
                          </th>
                          <th scope="col" className="py-1.5 text-right font-medium">
                            %
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {projetos.map((p, i) => (
                          <tr key={`${p.projeto}-${i}`} className="border-b border-border/50">
                            <td className="py-1.5 pr-3">{p.projeto}</td>
                            <td className="py-1.5 pr-3 text-right font-tabular">
                              <Moeda value={p.empenhoAtualizado} />
                            </td>
                            <td className="py-1.5 pr-3 text-right font-tabular">
                              <Moeda value={p.executado} />
                            </td>
                            <td className="py-1.5 text-right font-tabular">
                              {pct(p.nivelExecucao)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-[.78em] text-text-soft">
                    O mesmo projeto pode aparecer em vários municípios: a FGV rateia o valor por
                    cidade, e é o rateio que está nesta tabela.
                  </p>
                </div>
              </details>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">
          Em que pé estão os {formatNumberBR(projetosDistintos)} projetos
        </h2>
        <p className="mt-1 max-w-3xl text-[.9em] text-text-soft">
          A FGV publica {formatNumberBR(STATUS_PROJETOS_FGV.length)} linhas de situação, mas elas
          descrevem {formatNumberBR(projetosDistintos)} projetos distintos — um projeto que
          alcança 25 cidades aparece 25 vezes. A contagem abaixo é por projeto, não por linha.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {statusOrdenado.map((s) => (
            <li
              key={s.status}
              className="flex items-baseline justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-2.5 text-[.9em]"
            >
              <span>{s.status}</span>
              <span className="font-tabular font-semibold" style={{ color: COR }}>
                {formatNumberBR(s.projetos)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">
          Projetos especiais, fora do rateio por município
        </h2>
        <p className="mt-1 max-w-3xl text-[.9em] text-text-soft">
          Três frentes que o Acordo trata em separado, sem destinação a uma cidade específica.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-[.9em]">
            <thead className="text-text-soft">
              <tr className="border-b border-border">
                <th scope="col" className="py-2 pr-3 font-medium">
                  Projeto
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">
                  Reservado
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">
                  Pago
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  %
                </th>
              </tr>
            </thead>
            <tbody>
              {PROJETOS_ESPECIAIS_FGV.map((e) => (
                <tr key={e.projeto} className="border-b border-border/50">
                  <td className="py-2 pr-3">{e.projeto}</td>
                  <td className="py-2 pr-3 text-right font-tabular">
                    <Moeda value={e.empenhoAtualizado} />
                  </td>
                  <td className="py-2 pr-3 text-right font-tabular">
                    <Moeda value={e.executado} />
                  </td>
                  <td className="py-2 text-right font-tabular">{pct(e.nivelExecucao)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold">De onde vem o dado</h2>
        <p className="mt-2 max-w-3xl text-[.93em] text-text-soft">
          Auditoria socioeconômica da{" "}
          <a
            href={REFERENCIA_EXECUCAO_FGV.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            FGV — Projeto Rio Paraopeba ↗
          </a>
          . O relatório de origem é de{" "}
          <strong className="text-text">{REFERENCIA_EXECUCAO_FGV.relatorio}</strong> e a planilha
          financeira declara atualização em{" "}
          <strong className="text-text">{REFERENCIA_EXECUCAO_FGV.financeiro}</strong>; o Controle
          Popular baixou em {REFERENCIA_EXECUCAO_FGV.coletadoEm.split("-").reverse().join("/")}.
          Nenhum número desta página foi digitado à mão — todos saem do arquivo publicado pela
          FGV, e a coleta é a de{" "}
          <code className="rounded bg-surface-2 px-1 py-0.5 text-[.9em]">
            scripts/coletar-execucao-fgv.mts
          </code>
          . A coleta é manual e pontual, e o motivo está escrito no cabeçalho do script:{" "}
          <code className="rounded bg-surface-2 px-1 py-0.5 text-[.9em]">robots.txt</code> do host
          da FGV pede para não ser rastreado, e o portal respeita isso.
        </p>
        <p className="mt-3 max-w-3xl text-[.93em] text-text-soft">
          O Governo de Minas publica a contraparte estadual — legislação, deliberações e repasses
          — em{" "}
          <a
            href="https://www.mg.gov.br/pro-brumadinho"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            mg.gov.br/pro-brumadinho ↗
          </a>
          . As duas fontes descrevem partes diferentes do mesmo Acordo e não se somam.
        </p>
      </section>

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </main>
  );
}
