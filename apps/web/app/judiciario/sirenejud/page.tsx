import type { Metadata } from "next";
import Link from "@/lib/judiciario/link";
import { formatNumberBR } from "@/lib/betim/format";
import { carregarSirenejudBrasil } from "@/lib/judiciario/sirenejud-brasil";
import { metadataEditavel } from "@/lib/edicoes";
import FooterGlobal from "@/app/components/FooterGlobal";

/**
 * `/judiciario/sirenejud` — o recorte nacional dos processos ambientais do
 * Judiciário, por UF, por tribunal, por classe processual e por assunto.
 *
 * Complemento de `/judiciario/numeros`: o Justiça em Números e o SIRENEJud
 * nascem da MESMA base-mãe (o DataJud); a diferença é o recorte (aqui, só
 * ambiental) e a forma de publicação (arquivo em massa, que a licença permite
 * agregar — ao contrário do DataJud, que é consulta ao vivo e nunca coleta).
 * Dizer isso na tela evita a leitura errada de que seriam duas justiças
 * diferentes.
 */

export const metadata: Metadata = metadataEditavel("/judiciario/sirenejud", {
  title: "Processos ambientais no Brasil (SIRENEJud) — Controle Popular · Judiciário",
  description:
    "Processos ambientais do Judiciário por UF, tribunal, classe processual e assunto, do SIRENEJud (CNJ): contagens, pendentes e série anual.",
});

export default function JudiciarioSirenejudPage() {
  const d = carregarSirenejudBrasil();

  if (!d) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold">
          Processos ambientais no Brasil
        </h1>
        <p className="mt-4 opacity-80">
          A fonte — o SIRENEJud do CNJ — publica o arquivo em massa, mas a coleta
          ainda não rodou neste build. Quando rodar, esta página mostra o recorte
          nacional por UF e por tribunal.
        </p>
      </div>
    );
  }

  const anos = Object.keys(d.serie_anual_br).sort();
  const maiorUf = d.por_uf[0];

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-12">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold">
          Processos ambientais no Brasil
        </h1>
        <p className="opacity-80">
          São <strong>{formatNumberBR(d.total_processos_br)} processos ambientais</strong>{" "}
          na base do SIRENEJud, o painel do CNJ que recorta da base nacional do
          Judiciário (a mesma do{" "}
          <Link href="/judiciario/numeros" className="underline">Justiça em Números</Link>) os
          processos de tema ambiental, com o município do órgão julgador.{" "}
          <strong>
            O arquivo público do CNJ é de {d.arquivo_modificado_em} e a atualização é
            irregular
          </strong>{" "}
          — os números valem até essa data.
        </p>
        <p className="opacity-80">
          Cobertura da fonte: {d.cobertura}. O recorte de Minas Gerais, município a
          município, está em{" "}
          <a href="/ambiental/judiciario" className="underline">
            /ambiental/judiciario
          </a>
          .
        </p>
      </header>

      {/* Cards resumo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-[.8em] text-text-soft">Total de processos</p>
          <p className="font-display text-2xl font-bold">{formatNumberBR(d.total_processos_br)}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-[.8em] text-text-soft">Comarca com mais processos</p>
          <p className="font-display text-2xl font-bold">{maiorUf?.uf}</p>
          <p className="text-[.75em] text-text-soft">{formatNumberBR(maiorUf?.total ?? 0)} processos</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-[.8em] text-text-soft">Anos com dados anômalos</p>
          <p className="font-display text-2xl font-bold">{formatNumberBR(d.anos_anomalos)}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-[.8em] text-text-soft">UFs com processos</p>
          <p className="font-display text-2xl font-bold">{d.por_uf.length}</p>
        </div>
      </div>

      <section aria-labelledby="por-uf">
        <h2 id="por-uf" className="font-display text-xl font-semibold">
          Por unidade da federação
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-[.95em]">
            <thead>
              <tr className="border-b border-[var(--cp-border)] text-left">
                <th className="py-2 pr-3">UF</th>
                <th className="py-2 pr-3 text-right">Processos</th>
                <th className="py-2 pr-3 text-right">Pendentes</th>
                <th className="py-2 text-right">Baixados</th>
              </tr>
            </thead>
            <tbody>
              {d.por_uf.map((u) => (
                <tr key={u.uf} className="border-b border-[var(--cp-border)]/50">
                  <td className="py-1.5 pr-3 font-medium">{u.uf}</td>
                  <td className="py-1.5 pr-3 text-right">{formatNumberBR(u.total)}</td>
                  <td className="py-1.5 pr-3 text-right">{formatNumberBR(u.pendentes)}</td>
                  <td className="py-1.5 text-right">{formatNumberBR(u.baixados)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {maiorUf && (
          <p className="mt-3 text-[.9em] opacity-70">
            {maiorUf.uf} concentra {formatNumberBR(maiorUf.total)} processos — a tabela
            completa está aí em cima, sem recorte de &quot;top 10&quot;.
          </p>
        )}
      </section>

      <section aria-labelledby="por-tribunal">
        <h2 id="por-tribunal" className="font-display text-xl font-semibold">
          Por tribunal
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-[.95em]">
            <thead>
              <tr className="border-b border-[var(--cp-border)] text-left">
                <th className="py-2 pr-3">Tribunal</th>
                <th className="py-2 pr-3 text-right">Processos</th>
                <th className="py-2 text-right">Pendentes</th>
              </tr>
            </thead>
            <tbody>
              {d.por_tribunal.map((t) => (
                <tr key={t.tribunal} className="border-b border-[var(--cp-border)]/50">
                  <td className="py-1.5 pr-3 font-medium">{t.tribunal}</td>
                  <td className="py-1.5 pr-3 text-right">{formatNumberBR(t.total)}</td>
                  <td className="py-1.5 text-right">{formatNumberBR(t.pendentes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {d.top_classes_br.length > 0 && (
        <section aria-labelledby="classes">
          <h2 id="classes" className="font-display text-xl font-semibold">
            Top 10 classes processuais
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-[.95em]">
              <thead>
                <tr className="border-b border-[var(--cp-border)] text-left">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Classe</th>
                  <th className="py-2 text-right">Processos</th>
                </tr>
              </thead>
              <tbody>
                {d.top_classes_br.map(([classe, total], i) => (
                  <tr key={classe} className="border-b border-[var(--cp-border)]/50">
                    <td className="py-1.5 pr-3 text-text-soft">{i + 1}</td>
                    <td className="py-1.5 pr-3 font-medium">{classe}</td>
                    <td className="py-1.5 text-right">{formatNumberBR(total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {d.top_assuntos_br.length > 0 && (
        <section aria-labelledby="assuntos">
          <h2 id="assuntos" className="font-display text-xl font-semibold">
            Top 10 assuntos
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-[.95em]">
              <thead>
                <tr className="border-b border-[var(--cp-border)] text-left">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Assunto</th>
                  <th className="py-2 text-right">Processos</th>
                </tr>
              </thead>
              <tbody>
                {d.top_assuntos_br.map(([assunto, total], i) => (
                  <tr key={assunto} className="border-b border-[var(--cp-border)]/50">
                    <td className="py-1.5 pr-3 text-text-soft">{i + 1}</td>
                    <td className="py-1.5 pr-3 font-medium">{assunto}</td>
                    <td className="py-1.5 text-right">{formatNumberBR(total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {anos.length > 0 && (
        <section aria-labelledby="serie">
          <h2 id="serie" className="font-display text-xl font-semibold">
            Ajuizamentos por ano
          </h2>
          {/* Gráfico de barras CSS */}
          <div className="mt-4 space-y-1.5">
            {anos.map((ano) => {
              const val = d.serie_anual_br[ano];
              const maxVal = Math.max(...anos.map((a) => d.serie_anual_br[a]));
              const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
              return (
                <div key={ano} className="flex items-center gap-3 text-[.85em]">
                  <span className="w-10 text-right text-text-soft">{ano}</span>
                  <div className="flex-1 overflow-hidden rounded bg-border/30">
                    <div
                      className="h-4 rounded bg-primary/70"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-20 text-right font-tabular text-text-soft">
                    {formatNumberBR(val)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section aria-labelledby="download" className="rounded-lg border border-border bg-surface p-5">
        <h2 id="download" className="font-display text-base font-semibold">
          Download dos dados
        </h2>
        <p className="mt-2 text-[.9em] text-text-soft">
          Os agregados estão disponíveis na{" "}
          <a href="/api" className="underline">API pública</a> (dataset{" "}
          <code>sirenejud-brasil</code>). O arquivo em massa original do CNJ pesa
          ~273 MB e pode ser baixado diretamente do{" "}
          <a
            href="https://prd.s3.cnj.jus.br/sirenejud/vw_sirenejud.parquet"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            S3 público do CNJ
          </a>
          .
        </p>
      </section>

      <section aria-labelledby="fonte" className="rounded-lg border border-[var(--cp-border)] p-5 text-sm">
        <h2 id="fonte" className="font-display text-base font-semibold">
          Fonte e ressalvas
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 opacity-80">
          <li>
            {d.fonte} — arquivo em massa de {d.arquivo_modificado_em}, agregado gerado
            em {d.gerado_em}.
          </li>
          {d.ressalvas.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>
      <FooterGlobal />
    </div>
  );
}
