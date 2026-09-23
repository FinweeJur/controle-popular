import type { Metadata } from "next";
import CartoesResumo from "@/app/components/CartoesResumo";
import MeioAmbienteRelacionado from "@/app/components/MeioAmbienteRelacionado";
import { formatNumberBR } from "@/lib/betim/format";
import { metadataEditavel } from "@/lib/edicoes";
import {
  contarCondicionantes,
  documentosDoEmpreendimento,
} from "@/lib/db/queries/condicionantes";
import {
  empreendimentosComPublicacoes,
  publicacoesDe,
  referenciaAbnt,
} from "@/lib/ambiental/publicacoes-barragens";
import FiltroCondicionantes from "./FiltroCondicionantes";

export const metadata: Metadata = metadataEditavel("/ambiental/condicionantes", {
  title: "Condicionantes ambientais de barragens — Controle Popular · Ambiental",
  description:
    "Piloto Irapé e Setúbal: o que a licença e o TAC mandaram cumprir, com status honesto de evidência pública e link direto à fonte — sem inventar descumprimento.",
});

/**
 * `/ambiental/condicionantes` — piloto Irapé + Setúbal (PLANO-CONDICIONANTES).
 *
 * Agregado no servidor (AGENTS §5.1); linha a linha só no cliente quando
 * houver condicionante segmentada. Sem texto integral da LP, a tabela fica
 * vazia e a tela diz isso com todas as letras (AGENTS §7) — nunca inventa
 * 47 itens a partir de contagem de terceiro.
 *
 * Público acadêmico (decisão 6) fecha a página no rodapé "Para saber mais".
 */
export default async function CondicionantesPage() {
  const contagem = await contarCondicionantes();
  const docsIrape = await documentosDoEmpreendimento("Irapé");
  const docsSetubal = await documentosDoEmpreendimento("Setúbal");
  const docs = [...docsIrape, ...docsSetubal];
  const empreendimentos = empreendimentosComPublicacoes();

  const pctComInformacao =
    contagem.total > 0
      ? Math.round((contagem.comInformacao / contagem.total) * 1000) / 10
      : 0;
  const pctCumpridas =
    contagem.comInformacao > 0
      ? Math.round((contagem.cumpridas / contagem.comInformacao) * 1000) / 10
      : 0;

  const barrasStatus = [
    {
      label: "Cumpridas (com evidência)",
      valor: contagem.cumpridas,
      titulo: `${formatNumberBR(contagem.cumpridas)} condicionantes com status cumprida e evidência linkada`,
    },
    {
      label: "Não cumpridas (com evidência)",
      valor: contagem.naoCumpridas,
      titulo: `${formatNumberBR(contagem.naoCumpridas)} condicionantes com status não cumprida e evidência linkada`,
    },
    {
      label: "Não informado (sem evidência pública)",
      valor: contagem.naoInformado,
      titulo: `${formatNumberBR(contagem.naoInformado)} condicionantes sem evidência pública suficiente para status`,
    },
  ].filter((b) => b.valor > 0 || contagem.total > 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <header className="space-y-4">
        <p className="text-[.82em] font-semibold uppercase tracking-wide text-text-soft">
          Ambiental · Barragens · Piloto
        </p>
        <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
          Condicionantes ambientais de barragens
        </h1>
        <p className="max-w-3xl text-[1.02em] leading-relaxed text-text-soft">
          Licenças e TACs mandam cumprir regras item a item. Aqui está o que a
          fonte oficialpublica sobre o piloto <strong className="text-text">Irapé</strong> e{" "}
          <strong className="text-text">Setúbal</strong> — com evidência linkada.
          Sem evidência pública, o status é <em>não informado</em>: não inventamos
          descumprimento.
        </p>
        <p className="max-w-3xl text-[0.95em] leading-relaxed text-text-soft opacity-90">
          Medido em 23/09/2026. Texto integral dos PDFs mora no espelho R2;
          este banco guarda só metadados, trecho, resumo e status (decisão 3 do dono).
        </p>
      </header>

      <section className="mt-8" aria-label="Cartões de resumo">
        <CartoesResumo
          itens={[
            {
              rotulo: "Condicionantes no acervo",
              valor: contagem.total,
              detalhe: contagem.vazio
                ? "Piloto: LP integral ainda não segmentada"
                : `${formatNumberBR(contagem.empreendimentos)} empreendimento(s)`,
              destaque: true,
            },
            {
              rotulo: "Com informação de status",
              valor: `${pctComInformacao}%`,
              detalhe:
                contagem.total === 0
                  ? "Sem linhas segmentadas ainda"
                  : `${formatNumberBR(contagem.comInformacao)} de ${formatNumberBR(contagem.total)}`,
            },
            {
              rotulo: "Cumpridas (com evidência)",
              valor: contagem.cumpridas,
              detalhe:
                contagem.comInformacao > 0
                  ? `${pctCumpridas}% do que tem informação`
                  : "Exige DCE, PAE, auto ou relatório",
            },
            {
              rotulo: "Documentos oficiais no piloto",
              valor: docs.length,
              detalhe: `Irapé ${docsIrape.length} · Setúbal ${docsSetubal.length}`,
            },
          ]}
        />
      </section>

      <section className="mt-10" aria-label="Distribuição por status">
        <h2 className="font-display text-xl font-semibold">Status por evidência</h2>
        {contagem.total === 0 ? (
          <p className="mt-3 max-w-2xl text-[0.95em] text-text-soft">
            Nenhuma condicionante item a item no banco ainda. A LP de Irapé tem{" "}
            <strong className="text-text">47</strong> e a de Setúbal{" "}
            <strong className="text-text">36</strong> (contagens da fonte, 23/09);
            o texto integral para segmentar ainda não foi localizado. Enquanto
            isso, a lacuna é informação — não mostramos 47 linhas inventadas.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {barrasStatus.map((b) => {
              const max = Math.max(...barrasStatus.map((x) => x.valor), 1);
              const pct = Math.max((b.valor / max) * 100, 2);
              return (
                <li key={b.label} title={b.titulo}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                    <span>{b.label}</span>
                    <span className="font-tabular text-text-soft">{formatNumberBR(b.valor)}</span>
                  </div>
                  <div
                    className="h-2.5 rounded-full bg-surface-2"
                    role="presentation"
                  >
                    <div
                      className="h-2.5 rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: "var(--color-ord-1)",
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-sm text-text-soft">
          Gráfico em CSS (sem biblioteca). Alternativa em texto: os números ao
          lado de cada barra.
        </p>
      </section>

      <section className="mt-10" aria-label="Condicionantes filtráveis">
        <h2 className="font-display text-xl font-semibold">Condicionantes</h2>
        <p className="mt-2 max-w-2xl text-[0.95em] text-text-soft">
          Filtro, ordenação por coluna e CSV do filtrado (separador{" "}
          <code>;</code> + BOM UTF-8). Cada linha, quando houver, linka a fonte
          específica — nunca home genérica.
        </p>
        <div className="mt-4">
          <FiltroCondicionantes linhas={[]} />
        </div>
      </section>

      <section className="mt-10" aria-label="Documentos oficiais do piloto">
        <h2 className="font-display text-xl font-semibold">
          Documentos oficiais do piloto
        </h2>
        {docs.length === 0 ? (
          <p className="mt-3 text-text-soft">Nenhum documento indexado ainda.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {docs.map((d) => (
              <li
                key={d.id}
                className="rounded-2xl border border-border bg-surface p-4"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-text-soft">
                  {d.orgao}
                  {d.data ? ` · ${d.data}` : ""}
                </p>
                <p className="mt-1 font-medium">{d.tipo}</p>
                {d.processo && (
                  <p className="mt-1 text-sm text-text-soft">
                    Processo {d.processo}
                  </p>
                )}
                <a
                  href={d.urlR2 ?? d.urlFonte}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm text-accent hover:underline"
                >
                  Abrir na fonte {d.urlR2 ? "(espelho R2)" : ""} ↗
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        className="mt-12 rounded-2xl border border-border bg-surface p-5"
        aria-label="Para saber mais"
      >
        <h2 className="font-display text-lg font-semibold">Para saber mais</h2>
        <p className="mt-1 text-sm text-text-soft">
          Publicações acadêmicas por empreendimento (decisão 6): não viram
          condicionante estruturado — só aprofundam o leitor. Referência ABNT
          com hiperlink.
        </p>
        {empreendimentos.map((emp) => (
          <div key={emp} className="mt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-text-soft">
              {emp}
            </h3>
            <ul className="mt-2 flex flex-col gap-2">
              {publicacoesDe(emp).map((p) => (
                <li key={p.url + p.titulo} className="text-sm leading-relaxed">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    {referenciaAbnt(p)} ↗
                  </a>
                  <span className="block text-text-soft opacity-90">{p.nota}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <MeioAmbienteRelacionado />
    </div>
  );
}
