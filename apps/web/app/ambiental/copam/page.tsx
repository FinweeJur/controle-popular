import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import { formatNumberBR } from "@/lib/betim/format";
import { getDb } from "@/lib/db/client";
import {
  contarReunioesCopam,
  listarMunicipiosComItensCopam,
  listarReunioesCopamRecentes,
} from "@/lib/db/queries/copam";
import BuscaMunicipio from "./BuscaMunicipio";
import TabelaReunioes from "./TabelaReunioes";
import { metadataEditavel } from "@/lib/edicoes";

export const metadata: Metadata = metadataEditavel("/ambiental/copam", {
  title: "Reuniões do COPAM — Controle Popular · Ambiental",
  description:
    "A pauta de cada reunião do Conselho Estadual de Política Ambiental de Minas Gerais, item a item, com o município que cada processo trata e o resultado da deliberação — antes e depois da decisão sair.",
});

/**
 * `/ambiental/copam` — a F3 do plano de execução. Método de coleta e as
 * armadilhas medidas estão em `etl/betim/etl/apis/copam_reunioes.py` e em
 * `docs/ambiental/F0-discovery.md` §14; esta página só lê o resultado.
 *
 * Estadual, sem `[municipio]` — mesmo raciocínio de `/funcaosocialterra`:
 * o COPAM delibera para o estado inteiro, a cidade é um atributo do ITEM
 * de pauta, não da tela.
 *
 * ═══ AS DUAS AGREGAÇÕES NOVAS FICAM AQUI, NÃO EM `lib/db/queries/copam.ts` ═══
 *
 * Esta página é dona só da pasta `app/ambiental/copam/` (regra da tarefa que
 * adicionou o gráfico/CSV/ordenação, 2026-08-21) — `lib/db/queries/copam.ts`
 * fica fora dela, e outros arquivos da zona `/ambiental` importam dali. Por
 * isso `contarItensCopamPorAno`/`contarItensCopamPorDecisao` são funções
 * locais deste arquivo, no MESMO estilo de `listarMunicipiosComItensCopam`
 * (SQL cru com `sql\`...\`` + `getDb()`, `.rows ?? []`) — só que vivendo aqui
 * porque só esta página as usa.
 */
const SITUACAO_ROTULO: Record<string, string> = {
  concluida: "Decisão publicada",
  aguardando_decisao: "Aguardando decisão",
  agendada: "Agendada",
};

interface ItensCopamPorAno {
  ano: number;
  itens: number;
}

/** Itens de pauta por ano DA REUNIÃO — agregado (nunca a lista de itens),
 *  alimenta o gráfico "por ano". */
async function contarItensCopamPorAno(): Promise<ItensCopamPorAno[]> {
  const db = getDb();
  if (!db) return [];
  const linhas = await db.execute<{ ano: number; itens: number }>(sql`
    select extract(year from r.data)::int as ano, count(*)::int as itens
    from copam_pauta_itens i
    join copam_reunioes r on r.id = i.id_reuniao
    group by ano
    order by ano asc
  `);
  return linhas.rows ?? [];
}

type BaldeDecisaoCopam =
  | "aprovado"
  | "indeferido"
  | "pedido_de_vistas"
  | "sem_merito"
  | "sem_decisao"
  | "outro";

interface ItensCopamPorDecisao {
  balde: BaldeDecisaoCopam;
  itens: number;
}

/**
 * Itens de pauta por RESULTADO DA DELIBERAÇÃO, agrupados nos baldes abaixo
 * a partir da MESMA lista `_PALAVRAS_DECISAO` do coletor
 * (`etl/betim/etl/apis/copam_reunioes.py`) — o campo `decisao` só pode vir
 * `null` ou uma dessas 13 palavras exatas (o coletor casa contra elas, não
 * aceita palpite). `sem_decisao` é o item cuja Decisão publicada não trouxe
 * (ainda) um veredito reconhecido; `outro` é rede de segurança — só teria
 * itens se o coletor aprendesse palavra nova sem este `case` acompanhar, e
 * por isso NUNCA é escondido: a soma dos 6 baldes sempre bate com o total
 * de itens de `contarReunioesCopam()`.
 */
async function contarItensCopamPorDecisao(): Promise<ItensCopamPorDecisao[]> {
  const db = getDb();
  if (!db) return [];
  const linhas = await db.execute<{ balde: BaldeDecisaoCopam; itens: number }>(sql`
    select
      case
        when i.decisao in ('APROVADA','APROVADO','DEFERIDO','DEFERIDA','HOMOLOGADO','HOMOLOGADA')
          then 'aprovado'
        when i.decisao in ('REPROVADA','REPROVADO','INDEFERIDO','INDEFERIDA')
          then 'indeferido'
        when i.decisao in ('PEDIDO DE VISTAS','RETORNO DE VISTAS')
          then 'pedido_de_vistas'
        when i.decisao in (
          'RETIRADO DE PAUTA','RETIRADA DE PAUTA','ADIADO','ADIADA','ARQUIVADO','ARQUIVADA',
          'CANCELADO','CANCELADA','REVOGADO','REVOGADA','PREJUDICADO','PREJUDICADA',
          'APRESENTADO','APRESENTADA'
        ) then 'sem_merito'
        when i.decisao is null then 'sem_decisao'
        else 'outro'
      end as balde,
      count(*)::int as itens
    from copam_pauta_itens i
    group by balde
  `);
  return linhas.rows ?? [];
}

const BALDE_INFO: Record<BaldeDecisaoCopam, { rotulo: string; slot: 1 | 2 | 3 | 4 | null }> = {
  aprovado: { rotulo: "Aprovado", slot: 1 },
  indeferido: { rotulo: "Indeferido ou reprovado", slot: 2 },
  pedido_de_vistas: { rotulo: "Pedido de vistas — ainda em análise", slot: 3 },
  sem_merito: {
    rotulo: "Retirado, adiado, cancelado ou arquivado — sem decisão de mérito",
    slot: 4,
  },
  sem_decisao: { rotulo: "Sem decisão identificada no texto", slot: null },
  outro: { rotulo: "Outro resultado (fora do vocabulário reconhecido)", slot: null },
};

const ORDEM_BALDES: BaldeDecisaoCopam[] = [
  "aprovado",
  "indeferido",
  "pedido_de_vistas",
  "sem_merito",
  "sem_decisao",
  "outro",
];

const COR_POR_SLOT: Record<number, string> = {
  1: "var(--color-ord-1)",
  2: "var(--color-ord-2)",
  3: "var(--color-ord-3)",
  4: "var(--color-ord-4)",
};

const HACHURA_SEM_INFO =
  "repeating-linear-gradient(45deg, var(--color-chart-track) 0 4px, var(--color-border) 4px 5px)";

export default async function CopamIndex() {
  const [
    { reunioes, itens, itensComMunicipio },
    todasReunioes,
    municipios,
    itensPorAno,
    itensPorDecisaoBruto,
  ] = await Promise.all([
    contarReunioesCopam(),
    // `1000` no lugar de um "todas": a fonte tem 454 reuniões (ver o
    // docstring do coletor) — folga de margem sem virar `SELECT *` sem teto.
    // A tabela abaixo (`TabelaReunioes`) é o mesmo raciocínio de
    // `BuscaMunicipio`/`listarMunicipiosComItensCopam`: array pequeno,
    // cabe inteiro no cliente, sem o padrão de JSON fatiado.
    listarReunioesCopamRecentes(1000),
    listarMunicipiosComItensCopam(),
    contarItensCopamPorAno(),
    contarItensCopamPorDecisao(),
  ]);
  const taxaMunicipio = itens > 0 ? Math.round((itensComMunicipio / itens) * 1000) / 10 : 0;

  const itensPorDecisao: ItensCopamPorDecisao[] = ORDEM_BALDES.map((balde) => ({
    balde,
    itens: itensPorDecisaoBruto.find((b) => b.balde === balde)?.itens ?? 0,
  }));
  const itensComDecisao =
    itens -
    (itensPorDecisao.find((b) => b.balde === "sem_decisao")?.itens ?? 0) -
    (itensPorDecisao.find((b) => b.balde === "outro")?.itens ?? 0);
  const taxaDecisao = itens > 0 ? Math.round((itensComDecisao / itens) * 1000) / 10 : 0;

  const maxAno = Math.max(1, ...itensPorAno.map((a) => a.itens));
  const maxBalde = Math.max(1, ...itensPorDecisao.map((b) => b.itens));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <header className="space-y-4">
        <p className="text-[.82em] font-semibold uppercase tracking-wide" style={{ color: "var(--cp-tertiary)" }}>
          Ambiental · Estadual · COPAM
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          O que o COPAM vai decidir sobre a sua cidade
        </h1>
        <p className="max-w-2xl text-[1.05em] opacity-85">
          O Conselho Estadual de Política Ambiental publica a pauta de cada reunião com
          antecedência — inclusive as que ainda vão acontecer. Aqui está o que essa pauta diz,
          item a item, com o município de cada processo e o resultado da deliberação, quando já
          saiu.
        </p>

        {reunioes === 0 ? (
          <p className="max-w-2xl rounded-lg border border-dashed border-[var(--cp-border)] px-4 py-3 text-[.95em] opacity-80">
            Nenhuma reunião coletada ainda. O coletor
            (<code className="font-mono text-[.85em]">etl.apis.copam_reunioes</code>) ainda não
            rodou contra este banco.
          </p>
        ) : null}
      </header>

      {reunioes > 0 ? (
        <>
          {/* ═══ CARTÕES DE TOPO — quanto já foi coletado ═══ */}
          <section aria-labelledby="numeros-copam" className="mt-10">
            <h2 id="numeros-copam" className="font-display text-xl font-semibold">
              O que já foi coletado
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-surface px-4 py-4">
                <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
                  Reuniões coletadas
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-text">
                  {formatNumberBR(reunioes)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-4">
                <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
                  Itens de pauta
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-text">
                  {formatNumberBR(itens)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-4">
                <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
                  Com município identificado
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-text">
                  {formatNumberBR(itensComMunicipio)}
                </p>
                <p className="mt-1 text-[.86em] text-text-soft">
                  {taxaMunicipio.toFixed(1).replace(".", ",")}% dos itens
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-4">
                <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
                  Com resultado da deliberação identificado
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-text">
                  {formatNumberBR(Math.max(0, itensComDecisao))}
                </p>
                <p className="mt-1 text-[.86em] text-text-soft">
                  {taxaDecisao.toFixed(1).replace(".", ",")}% dos itens
                </p>
              </div>
            </div>
          </section>

          {/* ═══ O GRÁFICO — por ano e por resultado da deliberação ═══ */}
          {itens > 0 ? (
            <section aria-labelledby="grafico-copam" className="mt-12">
              <h2 id="grafico-copam" className="font-display text-xl font-semibold">
                Itens de pauta, por ano e por resultado da deliberação
              </h2>
              <p className="mt-2 max-w-2xl text-[.92em] opacity-80">
                O COPAM delibera item por item: cada barra abaixo é uma contagem de itens de
                pauta, não de reuniões. As tabelas logo abaixo de cada gráfico têm os mesmos
                números por extenso.
              </p>

              <div className="mt-6 grid gap-8 lg:grid-cols-2">
                {/* --- por ano --- */}
                <figure>
                  <figcaption className="text-[.88em] font-semibold text-text">Por ano</figcaption>
                  <div className="sr-only">
                    Gráfico de barras, um por ano, comprimento proporcional ao número de itens de
                    pauta daquele ano.{" "}
                    {itensPorAno
                      .map((a) => `${a.ano}: ${formatNumberBR(a.itens)} itens de pauta.`)
                      .join(" ")}
                  </div>
                  <div aria-hidden className="mt-4 space-y-2">
                    {itensPorAno.map((a) => (
                      <div key={a.ano} className="flex items-center gap-2">
                        <span className="w-11 shrink-0 text-right font-tabular text-[.82em] font-medium text-text">
                          {a.ano}
                        </span>
                        <div className="cp-ord-track h-3.5 flex-1 overflow-hidden">
                          <div
                            className="h-full rounded-[3px]"
                            style={{
                              width: `${(a.itens / maxAno) * 100}%`,
                              background: "var(--color-primary)",
                            }}
                            title={`${a.ano}: ${formatNumberBR(a.itens)} itens`}
                          />
                        </div>
                        <span className="w-12 shrink-0 text-right font-tabular text-[.82em] text-text-soft">
                          {formatNumberBR(a.itens)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full border-collapse text-[.82em]">
                      <caption className="mb-1 text-left text-[.8em] text-text-soft">
                        Tabela — alternativa em texto ao gráfico acima.
                      </caption>
                      <thead>
                        <tr className="border-b border-border text-left text-text">
                          <th className="py-1 pr-2 font-medium">Ano</th>
                          <th className="py-1 text-right font-medium">Itens de pauta</th>
                        </tr>
                      </thead>
                      <tbody className="text-text-soft">
                        {itensPorAno.map((a) => (
                          <tr key={a.ano} className="border-b border-border/60">
                            <td className="py-1 pr-2 font-medium text-text">{a.ano}</td>
                            <td className="py-1 text-right font-tabular tabular-nums">
                              {formatNumberBR(a.itens)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </figure>

                {/* --- por resultado da deliberação --- */}
                <figure>
                  <figcaption className="text-[.88em] font-semibold text-text">
                    Por resultado da deliberação
                  </figcaption>
                  <div className="sr-only">
                    Gráfico de barras, uma por resultado de deliberação, comprimento proporcional
                    ao número de itens de pauta.{" "}
                    {itensPorDecisao
                      .map(
                        (b) =>
                          `${BALDE_INFO[b.balde].rotulo}: ${formatNumberBR(b.itens)} itens.`,
                      )
                      .join(" ")}
                  </div>
                  <div aria-hidden className="mt-4 space-y-3">
                    {itensPorDecisao
                      .filter((b) => b.itens > 0)
                      .map((b) => {
                        const info = BALDE_INFO[b.balde];
                        const cor = info.slot !== null ? COR_POR_SLOT[info.slot] : HACHURA_SEM_INFO;
                        const percentual =
                          itens > 0 ? ((b.itens / itens) * 100).toFixed(1).replace(".", ",") : "0,0";
                        return (
                          <div key={b.balde}>
                            <div className="flex items-baseline justify-between gap-2 text-[.82em]">
                              <span className="text-text">{info.rotulo}</span>
                              <span className="shrink-0 font-tabular text-text-soft">
                                {formatNumberBR(b.itens)} ({percentual}%)
                              </span>
                            </div>
                            <div className="cp-ord-track mt-1 h-3.5 w-full overflow-hidden">
                              <div
                                className={`h-full rounded-[3px] ${info.slot === 4 ? "cp-ord-seg-4" : ""}`}
                                style={{ width: `${(b.itens / maxBalde) * 100}%`, background: cor }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full border-collapse text-[.82em]">
                      <caption className="mb-1 text-left text-[.8em] text-text-soft">
                        Tabela — alternativa em texto ao gráfico acima, os 6 baldes sem esconder
                        nenhum (inclusive os com 0 item).
                      </caption>
                      <thead>
                        <tr className="border-b border-border text-left text-text">
                          <th className="py-1 pr-2 font-medium">Resultado</th>
                          <th className="py-1 text-right font-medium">Itens de pauta</th>
                        </tr>
                      </thead>
                      <tbody className="text-text-soft">
                        {itensPorDecisao.map((b) => (
                          <tr key={b.balde} className="border-b border-border/60">
                            <td className="py-1 pr-2 text-text">{BALDE_INFO[b.balde].rotulo}</td>
                            <td className="py-1 text-right font-tabular tabular-nums">
                              {formatNumberBR(b.itens)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </figure>
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      {municipios.length > 0 ? (
        <section className="mt-12" aria-labelledby="municipios-copam">
          <h2 id="municipios-copam" className="font-display text-xl font-semibold">
            Ver a pauta por município
          </h2>
          <p className="mt-1 text-sm opacity-75">
            {formatNumberBR(municipios.length)} municípios de Minas Gerais têm pelo menos um
            item de pauta do COPAM coletado.
          </p>
          <div className="mt-4">
            <BuscaMunicipio municipios={municipios} />
          </div>
        </section>
      ) : null}

      {todasReunioes.length > 0 ? (
        <section className="mt-12" aria-labelledby="reunioes-copam">
          <h2 id="reunioes-copam" className="font-display text-xl font-semibold">
            Reunião a reunião
          </h2>
          <p className="mt-1 max-w-2xl text-sm opacity-75">
            As {formatNumberBR(todasReunioes.length)} reuniões coletadas, buscáveis por título e
            filtráveis por câmara técnica, situação e ano — clique no cabeçalho de uma coluna
            para ordenar por ela.
          </p>
          <div className="mt-4">
            <TabelaReunioes reunioes={todasReunioes} situacaoRotulo={SITUACAO_ROTULO} />
          </div>
        </section>
      ) : null}

      <section className="mt-12 border-t border-[var(--cp-border)] pt-8">
        <h2 className="font-display text-xl font-semibold">Como o município e a decisão são identificados</h2>
        <p className="mt-2 max-w-2xl text-[.95em] opacity-80">
          A própria página de detalhe da reunião traz, para a maioria dos anexos, um campo
          estruturado com o nome do município — não é leitura de texto livre. Nas reuniões em
          que esse campo vem vazio, o PDF da pauta consolidada traz o padrão
          &quot;&lt;Município&gt;/MG&quot; perto de cada item, e o município só é aceito quando
          bate com um dos 853 nomes oficiais de Minas Gerais — nunca um palpite. Um item pode
          citar mais de um município (obra ou linha de transmissão que passa por várias
          cidades); todos entram.
        </p>
        <p className="mt-3 max-w-2xl text-[.95em] opacity-80">
          O <strong>resultado da deliberação</strong> vem do texto do PDF de Decisão: o coletor
          procura, para cada item, a última palavra-veredito reconhecida (aprovado, indeferido,
          pedido de vistas etc.) antes do próximo item começar — a mesma lista de 13 palavras que
          o gráfico acima agrupa em baldes. Quando o texto não traz nenhuma dessas palavras perto
          do item, o resultado fica em branco: pode ser pauta ainda não julgada, ou palavra fora
          do vocabulário reconhecido — nunca um palpite do portal.
        </p>
        <p className="mt-3 max-w-2xl text-[.95em] opacity-80">
          <strong>Isto não é acusação de irregularidade.</strong> É a reprodução da pauta e da
          decisão como o Copam publica, com link para o PDF oficial de cada reunião.
        </p>
      </section>
    </div>
  );
}
