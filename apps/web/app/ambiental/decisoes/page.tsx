import type { Metadata } from "next";
import Link from "@/lib/ambiental/link";
import { formatNumberBR } from "@/lib/betim/format";
import {
  COBERTURA_DECISOES_LICENCIAMENTO,
  DECISOES_LICENCIAMENTO_POR_ANO,
  DECISOES_LICENCIAMENTO_POR_TIPO,
} from "@/lib/ambiental/decisoes-licenciamento";
import { metadataEditavel } from "@/lib/edicoes";
import PainelDecisoes from "./PainelDecisoes";

/**
 * `/ambiental/decisoes` — as 43.444 decisões de licenciamento ambiental de
 * MG, com foco no que o acervo de licenças concedidas não mostra: as 9.554
 * negativas (indeferimento, arquivamento, cancelamento, suspensão).
 *
 * ═══ POR QUE A PÁGINA DE SERVIDOR SÓ IMPORTA O AGREGADO ═══
 *
 * `COBERTURA_DECISOES_LICENCIAMENTO` e `DECISOES_LICENCIAMENTO_POR_ANO` são
 * literais pequenos (`lib/ambiental/decisoes-licenciamento.ts`) — o array das
 * 9.554 negativas nunca entra aqui. Ele mora fatiado em `dados/[arquivo]/
 * route.ts` e é carregado sob demanda por `PainelDecisoes` (cliente). Ver o
 * cabeçalho daquele lib para o raciocínio completo do teto de payload.
 *
 * ═══ AS CINCO COISAS (regra do dono, 2026-08-21, `AGENTS.md`) ═══
 *
 * Gráfico (deferidas × negativas por ano, com alternativa em tabela),
 * cartões de topo, CSV do filtrado, filtro (decisão/município/classe/
 * modalidade/regional/ano) e ordenação por coluna — as três últimas vivem em
 * `PainelDecisoes.tsx`, sobre o índice fatiado.
 */
export const dynamic = "force-static";

export const metadata: Metadata = metadataEditavel("/ambiental/decisoes", {
  title: "Decisões de licenciamento ambiental — Controle Popular · Ambiental",
  description: `${formatNumberBR(COBERTURA_DECISOES_LICENCIAMENTO.totalNegativas)} decisões negativas de licenciamento ambiental em Minas Gerais (indeferidas, arquivadas, canceladas) — o que o acervo de licenças concedidas não mostra, ${COBERTURA_DECISOES_LICENCIAMENTO.anoInicial}–${COBERTURA_DECISOES_LICENCIAMENTO.anoFinal}.`,
});

const C = COBERTURA_DECISOES_LICENCIAMENTO;
const MAX_ANO = Math.max(...DECISOES_LICENCIAMENTO_POR_ANO.map((a) => a.deferidas + a.negativas));

/** Textura do segmento "negativas": além da cor de alerta, um hachurado —
 *  o mesmo recurso de `decisoes-lai/page.tsx` (`.cp-ord-seg` já dá o anel
 *  espaçador; a textura é local porque é a ÚNICA página com esta dupla de
 *  cores, não vale generalizar em `globals.css`). "Cor nunca é o único
 *  canal", regra do `AGENTS.md`. */
const HACHURA_NEGATIVAS =
  "repeating-linear-gradient(45deg, var(--color-alert) 0 5px, color-mix(in srgb, var(--color-alert) 65%, black) 5px 7px)";

export default function DecisoesLicenciamentoPage() {
  const prefixoExport = process.env.PAGES_BASE_PATH ?? "";
  const baseDados = `${prefixoExport}/ambiental/decisoes/dados`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Ambiental
        </Link>{" "}
        · <span className="text-text">Decisões de licenciamento</span>
      </nav>

      <header className="space-y-4">
        <p className="text-[.82em] font-semibold uppercase tracking-wide text-text-soft">
          Ambiental · Licenciamento
        </p>
        <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
          22% das decisões de licenciamento ambiental de MG são negativas
        </h1>
        <p className="max-w-3xl text-[1.02em] leading-relaxed text-text-soft">
          O acervo público de licenças de Minas Gerais mostra quem{" "}
          <strong className="text-text">recebeu</strong> licença. Esta página mostra a{" "}
          <strong className="text-text">decisão</strong> — e por isso mostra o que some do outro
          lado: das <strong className="text-text">{formatNumberBR(C.total)}</strong> decisões de
          licenciamento ambiental publicadas pelo Estado entre {C.anoInicial} e {C.anoFinal},{" "}
          <strong className="text-text">
            {formatNumberBR(C.totalNegativas)} ({C.percentualNegativas}%) são negativas
          </strong>{" "}
          — indeferidas, arquivadas, canceladas ou suspensas. Quem olha só o acervo de licenças
          concedidas vê {100 - C.percentualNegativas}% da história e conclui que o licenciamento
          aprova quase tudo. A recusa existe, e é aqui.
        </p>
      </header>

      {/* ═══ AS TRÊS RESSALVAS OBRIGATÓRIAS ═══ */}
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5 text-[.9em] leading-relaxed text-text-soft">
          <p className="font-display text-base font-semibold text-text">Indeferimento não é irregularidade</p>
          <p className="mt-2">
            Pode ser projeto incompleto, desistência do empreendedor ou mudança de modalidade. Esta
            página mostra a decisão como o Estado a publicou — não afirma culpa de ninguém.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5 text-[.9em] leading-relaxed text-text-soft">
          <p className="font-display text-base font-semibold text-text">Pessoa física não aparece nominalmente</p>
          <p className="mt-2">
            {formatNumberBR(C.pessoaFisicaNasNegativas)} das {formatNumberBR(C.totalNegativas)}{" "}
            negativas têm titular pessoa física — sem nome publicado. A fonte marca 20 delas como
            CNPJ quando na verdade têm CPF colado ao nome; a redação aqui é por dígito verificador
            sobre o texto, não pela classificação da fonte.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5 text-[.9em] leading-relaxed text-text-soft">
          <p className="font-display text-base font-semibold text-text">Deferidas estão agregadas, não listadas</p>
          <p className="mt-2">
            As {formatNumberBR(C.totalDeferidas)} decisões deferidas aparecem só no gráfico abaixo,
            por ano — não linha a linha. Quem procura uma licença concedida específica vai para{" "}
            <Link href="/licenciamento" className="font-medium text-accent hover:underline">
              /ambiental/licenciamento
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ═══ DE QUEM É ESTE DADO ═══ */}
      <section
        aria-labelledby="declaracao-decisoes-licenciamento"
        className="mt-8 rounded-2xl border border-border bg-surface-2 p-5"
      >
        <h2 id="declaracao-decisoes-licenciamento" className="font-display text-base font-semibold text-text">
          De quem é este dado
        </h2>
        <ul className="mt-3 space-y-3 text-[.92em] text-text-soft">
          <li>
            <strong className="text-text">Fonte:</strong>{" "}
            <a
              href="https://sistemas.meioambiente.mg.gov.br/licenciamento/site/consulta-licenca"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-accent"
            >
              sistemas.meioambiente.mg.gov.br/licenciamento ↗
            </a>{" "}
            — consulta pública de decisões da SEMAD/MG. {formatNumberBR(C.total)} decisões, sondadas em{" "}
            {C.medidoEm.split("-").reverse().join("/")}.
          </li>
          <li>
            <strong className="text-text">{formatNumberBR(C.municipiosDistintos)} municípios</strong>,{" "}
            {C.semMunicipioResolvido === 0
              ? "todos com município resolvido — nenhuma linha ficou num balde de “não identificado”."
              : `${formatNumberBR(C.semMunicipioResolvido)} decisões sem município resolvido, contadas à parte.`}
          </li>
          <li>
            <strong className="text-text">1 decisão fora do gráfico por ano.</strong> A negativa de
            id {C.idNegativaComAnoInconsistente} (Brumadinho) traz um ano inconsistente na fonte —
            ela continua contada no total e na tabela abaixo, só não entra no gráfico nem no filtro
            por ano.
          </li>
        </ul>
      </section>

      {/* ═══ OS NÚMEROS DE TOPO ═══ */}
      <section aria-labelledby="numeros-decisoes-licenciamento" className="mt-10">
        <h2
          id="numeros-decisoes-licenciamento"
          className="font-display text-xl font-bold tracking-tight text-text"
        >
          O corpus em números
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Decisões, {C.anoInicial}–{C.anoFinal}
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">{formatNumberBR(C.total)}</p>
          </div>
          <div className="rounded-xl border border-alert/40 bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">Negativas</p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              {formatNumberBR(C.totalNegativas)}
            </p>
            <p className="mt-1 text-[.86em] text-text-soft">{C.percentualNegativas}% do total</p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">Municípios</p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              {formatNumberBR(C.municipiosDistintos)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">Período</p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              {C.anoInicial}–{C.anoFinal}
            </p>
          </div>
        </div>
      </section>

      {/* ═══ O GRÁFICO — deferidas × negativas, por ano ═══ */}
      <section aria-labelledby="grafico-decisoes-licenciamento" className="mt-10">
        <h2
          id="grafico-decisoes-licenciamento"
          className="font-display text-xl font-bold tracking-tight text-text"
        >
          Deferidas e negativas, por ano
        </h2>
        <p className="mt-2 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
          O volume salta em 2018 porque é quando o Estado passou a publicar a consulta pública em
          massa — não porque o licenciamento tenha mudado de padrão naquele ano. A proporção
          negativa/deferida, essa sim, é o que vale comparar ano a ano.
        </p>

        <figure className="mt-5">
          <div className="sr-only">
            Gráfico de barras horizontais, uma por ano, {C.anoInicial} a {C.anoFinal}, comprimento
            proporcional ao total de decisões do ano, segmentado em deferidas e negativas.{" "}
            {DECISOES_LICENCIAMENTO_POR_ANO.map(
              (a) => `${a.ano}: ${formatNumberBR(a.deferidas)} deferidas, ${formatNumberBR(a.negativas)} negativas.`,
            ).join(" ")}
          </div>

          <div aria-hidden className="space-y-2">
            {DECISOES_LICENCIAMENTO_POR_ANO.map((a) => {
              const totalAno = a.deferidas + a.negativas;
              return (
                <div key={a.ano} className="flex items-center gap-3">
                  <span className="w-11 shrink-0 text-right font-tabular text-[.85em] font-semibold text-text">
                    {a.ano}
                  </span>
                  <div className="cp-ord-track h-4 flex-1 overflow-hidden">
                    <div className="flex h-full" style={{ width: `${(totalAno / MAX_ANO) * 100}%` }}>
                      {a.deferidas > 0 && (
                        <div
                          className="cp-ord-seg h-full first:rounded-l-[3px] last:rounded-r-[3px]"
                          style={{ width: `${(a.deferidas / totalAno) * 100}%`, background: "var(--color-primary)" }}
                          title={`${a.ano} · Deferidas: ${formatNumberBR(a.deferidas)}`}
                        />
                      )}
                      {a.negativas > 0 && (
                        <div
                          className="cp-ord-seg h-full first:rounded-l-[3px] last:rounded-r-[3px]"
                          style={{ width: `${(a.negativas / totalAno) * 100}%`, background: HACHURA_NEGATIVAS }}
                          title={`${a.ano} · Negativas: ${formatNumberBR(a.negativas)}`}
                        />
                      )}
                    </div>
                  </div>
                  <span className="w-16 shrink-0 font-tabular text-[.85em] text-text-soft">
                    {formatNumberBR(totalAno)}
                  </span>
                </div>
              );
            })}
          </div>

          <figcaption className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[.85em] text-text-soft">
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-3 w-3 rounded-sm"
                style={{ background: "var(--color-primary)" }}
              />
              Deferidas
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="inline-block h-3 w-3 rounded-sm" style={{ background: HACHURA_NEGATIVAS }} />
              Negativas (indeferida, arquivada, cancelada, suspensa)
            </span>
          </figcaption>
        </figure>

        {/* Alternativa em texto/tabela ao gráfico. */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-[.88em]">
            <caption className="mb-2 text-left text-[.85em] text-text-soft">
              Tabela completa — alternativa em texto ao gráfico acima.
            </caption>
            <thead>
              <tr className="border-b border-border text-left text-text">
                <th className="py-2 pr-3 font-medium">Ano</th>
                <th className="py-2 pr-3 text-right font-medium">Deferidas</th>
                <th className="py-2 pr-3 text-right font-medium">Negativas</th>
                <th className="py-2 text-right font-medium">% negativas</th>
              </tr>
            </thead>
            <tbody className="text-text-soft">
              {DECISOES_LICENCIAMENTO_POR_ANO.map((a) => {
                const totalAno = a.deferidas + a.negativas;
                const pct = totalAno > 0 ? ((a.negativas / totalAno) * 100).toFixed(0) : "—";
                return (
                  <tr key={a.ano} className="border-b border-border/60">
                    <td className="py-2 pr-3 font-medium text-text">{a.ano}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{formatNumberBR(a.deferidas)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{formatNumberBR(a.negativas)}</td>
                    <td className="py-2 text-right tabular-nums">{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* As 4 categorias de negativa — pequeno o bastante para não precisar de fatia. */}
        <div className="mt-8">
          <h3 className="font-display text-base font-semibold text-text">
            As {formatNumberBR(C.totalNegativas)} negativas, por tipo
          </h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-4">
            {DECISOES_LICENCIAMENTO_POR_TIPO.map((d) => (
              <li key={d.decisao} className="rounded-xl border border-border bg-surface px-4 py-3">
                <p className="text-[.82em] text-text-soft">{d.decisao}</p>
                <p className="mt-1 font-display text-xl font-bold text-text">{formatNumberBR(d.total)}</p>
                <p className="mt-0.5 text-[.8em] text-text-soft">
                  {((d.total / C.totalNegativas) * 100).toFixed(0)}% das negativas
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ═══ AS 9.554 NEGATIVAS, FILTRÁVEIS ═══ */}
      <section aria-labelledby="lista-decisoes-licenciamento" className="mt-10">
        <h2
          id="lista-decisoes-licenciamento"
          className="font-display text-xl font-bold tracking-tight text-text"
        >
          Negativa a negativa
        </h2>
        <p className="mt-2 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
          {formatNumberBR(C.totalNegativas)} linhas, carregadas em partes — a busca e o filtro
          abrem quando a última parte chega. Todo link vai para a ficha oficial do processo na
          fonte.
        </p>
        <div className="mt-5">
          <PainelDecisoes base={baseDados} />
        </div>
      </section>

      {/* ═══ VER TAMBÉM ═══ */}
      <section
        aria-labelledby="ver-tambem-decisoes-licenciamento"
        className="mt-10 rounded-2xl border border-border bg-surface-2 p-5"
      >
        <h2 id="ver-tambem-decisoes-licenciamento" className="font-display text-base font-semibold text-text">
          Ver também — e não confundir
        </h2>
        <ul className="mt-3 space-y-2.5 text-[.92em] text-text-soft">
          <li>
            <Link href="/licenciamento" className="font-medium text-accent hover:underline">
              /ambiental/licenciamento
            </Link>{" "}
            — o censo de quem <strong className="text-text">recebeu</strong> licença (WFS da
            IDE-Sisema, por município/setor/modalidade/classe). Não tem as negativas: elas nunca
            aparecem num acervo de licenças concedidas.
          </li>
          <li>
            <Link href="/decisoes-lai" className="font-medium text-accent hover:underline">
              /ambiental/decisoes-lai
            </Link>{" "}
            — outra coisa, apesar do nome parecido: são decisões de{" "}
            <strong className="text-text">recurso de pedido de LAI</strong> julgadas pela CGE-MG,
            sem nenhuma relação com licenciamento ambiental.
          </li>
        </ul>
      </section>

      <section
        aria-labelledby="fonte-decisoes-licenciamento"
        className="mt-10 rounded-2xl border border-border bg-surface-2 p-5"
      >
        <h2 id="fonte-decisoes-licenciamento" className="font-display text-base font-semibold text-text">
          De onde vem este dado
        </h2>
        <ul className="mt-3 space-y-2.5 text-[.92em] text-text-soft">
          <li>
            Consulta pública de decisões de licenciamento ambiental da SEMAD/MG,{" "}
            <a
              href="https://sistemas.meioambiente.mg.gov.br/licenciamento/site/consulta-licenca"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-accent"
            >
              sistemas.meioambiente.mg.gov.br/licenciamento ↗
            </a>
            . Coletado percorrendo 2.178 páginas do resultado, sem login e sem captcha.
          </li>
          <li>
            {C.avisoIndeferimento}
          </li>
          <li>
            {C.avisoPessoaFisica}
          </li>
        </ul>
      </section>
    </div>
  );
}
