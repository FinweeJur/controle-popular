import type { Metadata } from "next";
import { formatNumberBR } from "@/lib/betim/format";
import { carregarSirenejudMg } from "@/lib/ambiental/sirenejud-dados";
import { metadataEditavel } from "@/lib/edicoes";
import PainelSirenejudMg from "./PainelSirenejudMg";

/**
 * `/ambiental/judiciario` — o que o Judiciário faz com o tema ambiental em
 * Minas: quantos processos ambientais correm em cada município, em qual
 * tribunal, e quanto tempo levam.
 *
 * A fonte é o SIRENEJud (CNJ/CNMP), recorte ambiental do DataJud publicado em
 * arquivo em massa — regime oposto ao DataJud, cuja licença veda derivados.
 * O agregado é de CONTAGENS: nomes de partes são descartados na coleta
 * (`etl/betim/etl/apis/sirenejud_cnj.py`), e a ressalva mais importante —
 * o arquivo público do CNJ é de 07/2025 e a atualização é irregular — aparece
 * colada aos números, no header e no rodapé.
 *
 * Arquitetura: esta página (servidor) importa só os agregados; a tabela de
 * municípios é `<PainelSirenejudMg />` (cliente), que busca
 * `/data/sirenejud-mg.json` como asset — mesmo padrão de `/ambiental/tac`.
 */

export const metadata: Metadata = metadataEditavel("/ambiental/judiciario", {
  title: "Processos ambientais na Justiça — Controle Popular · Ambiental",
  description:
    "Processos ambientais do Judiciário por município de Minas Gerais: contagens, situação e tempo de tramitação, do SIRENEJud (CNJ).",
});

/** Barras SVG inline da série anual — sem biblioteca de gráfico (teto do Worker). */
function GraficoAnual({ serie }: { serie: Record<string, number> }) {
  const anos = Object.keys(serie).sort();
  const max = Math.max(...anos.map((a) => serie[a]), 1);
  return (
    <figure>
      <svg
        viewBox={`0 0 ${anos.length * 46} 160`}
        role="img"
        aria-label={`Processos ajuizados por ano: ${anos
          .map((a) => `${a}: ${serie[a]}`)
          .join(", ")}`}
        className="mt-4 w-full max-w-2xl"
      >
        {anos.map((ano, i) => {
          const h = Math.round((serie[ano] / max) * 120);
          return (
            <g key={ano}>
              <rect
                x={i * 46 + 6}
                y={130 - h}
                width={34}
                height={h}
                fill="var(--color-ord-2, #4f7fb5)"
                rx={2}
              />
              <text x={i * 46 + 23} y={145} textAnchor="middle" fontSize="10"
                    fill="currentColor">
                {ano}
              </text>
              <text x={i * 46 + 23} y={126 - h} textAnchor="middle" fontSize="9"
                    fill="currentColor">
                {formatNumberBR(serie[ano])}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 text-[.85em] text-text-soft">
        Processos ambientais ajuizados por ano em MG.{" "}
        <details className="mt-1">
          <summary className="cursor-pointer underline">Ver os números em tabela</summary>
          <table className="mt-2 text-[.9em]">
            <thead>
              <tr><th className="pr-4 text-left">Ano</th><th className="text-right">Processos</th></tr>
            </thead>
            <tbody>
              {anos.map((ano) => (
                <tr key={ano}>
                  <td className="pr-4">{ano}</td>
                  <td className="text-right">{formatNumberBR(serie[ano])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </figcaption>
    </figure>
  );
}

export default function AmbientalJudiciarioPage() {
  const d = carregarSirenejudMg();

  if (!d) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <h1 className="font-display text-3xl font-bold">Processos ambientais na Justiça</h1>
        <p className="mt-4 max-w-2xl text-text-soft">
          A fonte — o SIRENEJud do CNJ — publica o arquivo em massa, mas a coleta
          ainda não rodou neste build. Quando rodar, esta página mostra os
          processos ambientais por município de Minas Gerais.
        </p>
      </div>
    );
  }

  const anos = Object.keys(d.serie_anual_mg).sort();
  const tribunais = Object.entries(d.por_tribunal_mg);
  const tempoMedioPonderado = (() => {
    let soma = 0;
    let peso = 0;
    for (const m of d.municipios) {
      if (m.tempo_medio_dias !== null) {
        soma += m.tempo_medio_dias * m.total;
        peso += m.total;
      }
    }
    return peso > 0 ? Math.round(soma / peso) : null;
  })();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <header className="space-y-4">
        <p className="text-[.82em] font-semibold uppercase tracking-wide text-text-soft">
          Ambiental · Judiciário
        </p>
        <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
          Processos ambientais na Justiça, por município
        </h1>
        <p className="max-w-3xl text-[.95em] leading-relaxed text-text-soft">
          <strong className="text-text">
            {formatNumberBR(d.total_processos_mg)} processos ambientais
          </strong>{" "}
          correm ou correram em Minas Gerais, segundo o{" "}
          <a href={d.url_fonte} className="underline" target="_blank" rel="noreferrer">
            SIRENEJud
          </a>{" "}
          do CNJ — o recorte ambiental da base nacional de dados do Judiciário.{" "}
          <strong className="text-text">
            O arquivo público do CNJ é de {d.arquivo_modificado_em} e a atualização é
            irregular
          </strong>{" "}
          — os números abaixo valem até essa data.
        </p>
      </header>

      {/* Cartões de topo — os agregados que respondem "quanto é isso?" */}
      <section aria-label="Totais" className="mt-8 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-[.78em] font-medium uppercase tracking-wide text-text-soft">
            Processos em MG
          </p>
          <p className="mt-1 text-2xl font-bold">{formatNumberBR(d.total_processos_mg)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-[.78em] font-medium uppercase tracking-wide text-text-soft">
            Municípios com processos
          </p>
          <p className="mt-1 text-2xl font-bold">
            {formatNumberBR(d.municipios_com_processos)}{" "}
            <span className="text-base font-normal text-text-soft">de 853</span>
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-[.78em] font-medium uppercase tracking-wide text-text-soft">
            Tempo médio de tramitação
          </p>
          <p className="mt-1 text-2xl font-bold">
            {tempoMedioPonderado !== null
              ? `${formatNumberBR(tempoMedioPonderado)} dias`
              : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-[.78em] font-medium uppercase tracking-wide text-text-soft">
            No Brasil inteiro
          </p>
          <p className="mt-1 text-2xl font-bold">{formatNumberBR(d.total_processos_br)}</p>
        </div>
      </section>

      <section aria-labelledby="evolucao" className="mt-12">
        <h2 id="evolucao" className="font-display text-xl font-bold tracking-tight">
          Evolução por ano de ajuizamento
        </h2>
        {anos.length > 0 ? (
          <GraficoAnual serie={d.serie_anual_mg} />
        ) : (
          <p className="mt-2 text-text-soft">A fonte não trouxe série anual utilizável.</p>
        )}
      </section>

      <section aria-labelledby="tribunais" className="mt-12">
        <h2 id="tribunais" className="font-display text-xl font-bold tracking-tight">
          Em qual tribunal
        </h2>
        <div className="mt-4 space-y-2">
          {tribunais.map(([trib, n]) => (
            <div key={trib} className="flex items-center gap-3">
              <span className="w-16 text-[.9em] font-medium">{trib}</span>
              <div
                className="h-4 rounded-sm"
                style={{
                  width: `${Math.max((n / d.total_processos_mg) * 100, 0.5)}%`,
                  background: "var(--color-ord-2, #4f7fb5)",
                }}
                aria-hidden="true"
              />
              <span className="text-[.9em] text-text-soft">{formatNumberBR(n)}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[.85em] text-text-soft">
          Cobertura da fonte: {d.cobertura}. Justiça do Trabalho, Eleitoral e Militar
          não entram no recorte ambiental do CNJ.
        </p>
      </section>

      <section aria-labelledby="classes" className="mt-12 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 id="classes" className="font-display text-xl font-bold tracking-tight">
            Classes processuais mais frequentes
          </h2>
          <ol className="mt-3 space-y-1.5 text-[.95em]">
            {d.top_classes_mg.map(([nome, n]) => (
              <li key={nome} className="flex justify-between gap-3">
                <span className="text-text-soft">{nome}</span>
                <span className="font-medium">{formatNumberBR(n)}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight">
            Assuntos mais frequentes
          </h2>
          <ol className="mt-3 space-y-1.5 text-[.95em]">
            {d.top_assuntos_mg.map(([nome, n]) => (
              <li key={nome} className="flex justify-between gap-3">
                <span className="text-text-soft">{nome}</span>
                <span className="font-medium">{formatNumberBR(n)}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="municipios" className="mt-12">
        <h2 id="municipios" className="font-display text-xl font-bold tracking-tight">
          Município a município
        </h2>
        <p className="mt-2 max-w-3xl text-[.95em] text-text-soft">
          O município é o do órgão julgador — o registro do local do dano só é
          obrigatório desde 2021 e processos antigos tendem a não tê-lo.
        </p>
        <div className="mt-4">
          <PainelSirenejudMg />
        </div>
      </section>

      <footer className="mt-12 rounded-xl border border-border bg-surface-2 p-5 text-[.9em] text-text-soft">
        <p className="font-medium text-text">Fonte e ressalvas</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            {d.fonte} — arquivo em massa de {d.arquivo_modificado_em} (
            <a href={d.arquivo_origem} className="underline" target="_blank" rel="noreferrer">
              parquet oficial
            </a>
            ), agregado gerado em {d.gerado_em}.
          </li>
          {d.ressalvas.map((r) => (
            <li key={r}>{r}</li>
          ))}
          <li>
            Recorte nacional desta mesma fonte:{" "}
            <a href="/judiciario/sirenejud" className="underline">
              /judiciario/sirenejud
            </a>
            . Esta página também é dataset da{" "}
            <a href="/api" className="underline">API pública</a> (
            <code>sirenejud-mg</code>).
          </li>
        </ul>
      </footer>
    </div>
  );
}
