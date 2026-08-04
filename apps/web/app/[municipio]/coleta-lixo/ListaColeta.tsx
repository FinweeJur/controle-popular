"use client";

import type { ColetaLixoRow } from "@/lib/betim/servicos";
import { useSearchParams } from "next/navigation";

const TIPO_LABELS: Record<string, string> = {
  comum: "Comum",
  seletiva: "Seletiva",
};

/**
 * O filtro `?bairro=` saiu do servidor e veio para cá — e o formulário veio
 * junto, porque é ele quem devolve o termo buscado para dentro da caixa
 * (`defaultValue`), e isso só se sabe lendo a query.
 *
 * POR QUE: em `output: 'export'` não existe request no momento da geração,
 * então `searchParams` num Server Component é erro de build — não é
 * degradação, o build inteiro para (ver `docs/deploy-github-pages.md` §3).
 * O servidor passa a entregar SEMPRE a agenda completa do município, já
 * embutida no HTML, e o recorte acontece no navegador. Cabe: a tabela tem uma
 * linha por bairro e tipo de coleta, não por evento.
 *
 * ═══ POR QUE SÃO DOIS COMPONENTES ═══
 *
 * `useSearchParams()` exige um `<Suspense>` acima, e o `fallback` DELE não
 * pode chamar o mesmo hook — o fallback existe justamente para ser o que se
 * renderiza sem ele. Passar este componente nos dois lados derruba o
 * `next build` com "should be wrapped in a suspense boundary", e só lá:
 * `next dev` não pré-renderiza, então a página parece perfeita o
 * desenvolvimento inteiro, e o `tsc` não tem como ver.
 *
 * `ListaColetaCompleta` sendo o fallback é também o que mantém a agenda
 * INTEIRA dentro do HTML estático — quem chega sem JavaScript, ou um
 * buscador, ainda vê os bairros.
 */
interface ColetaProps {
  rows: ColetaLixoRow[];
  configured: boolean;
  municipio: string;
  cidadeNome: string;
}

function ColetaConteudo({
  rows,
  configured,
  municipio,
  cidadeNome,
  bairro,
}: ColetaProps & { bairro: string | null }) {

  // Busca por PEDAÇO do nome, não por igualdade: no SQL isso era
  // `ilike('%bairro%')`. Quem digita "centro" espera achar também "Centro
  // Industrial", e é assim que a caixa se comporta desde sempre — trocar por
  // `===` ao trazer o filtro para o JS encolheria o resultado sem avisar.
  // O `toLocaleLowerCase` cobre o outro lado do ILIKE, a caixa alta do
  // cadastro. Acento continua não sendo normalizado, igual ao ILIKE: "sao"
  // não acha "São" — antes nem agora.
  const lista = bairro
    ? rows.filter((row) =>
        (row.bairro ?? "")
          .toLocaleLowerCase("pt-BR")
          .includes(bairro.toLocaleLowerCase("pt-BR"))
      )
    : rows;

  return (
    <>
      <form method="GET" className="mt-6 flex max-w-md gap-2">
        <input
          type="search"
          name="bairro"
          defaultValue={bairro ?? ""}
          placeholder="Buscar bairro…"
          aria-label="Buscar bairro"
          className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-text"
        />
        <button
          type="submit"
          className="cursor-pointer rounded-xl border border-primary bg-primary px-5 py-3 font-semibold text-primary-ink"
        >
          Buscar
        </button>
      </form>

      <section className="mt-8 flex flex-col gap-3">
        {lista.length > 0 ? (
          lista.map((row, i) => (
            <div
              key={`${row.bairro}-${row.tipo}-${i}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm"
            >
              <div>
                <p className="font-display font-semibold text-text">{row.bairro}</p>
                <p className="text-sm text-text-soft">
                  {TIPO_LABELS[row.tipo ?? ""] ?? row.tipo ?? "—"} ·{" "}
                  {(row.dias_semana ?? []).join(", ") || "—"}
                  {row.horario ? ` · ${row.horario}` : ""}
                </p>
              </div>
              <a
                href={`/${municipio}/api/coleta/${encodeURIComponent(row.bairro)}`}
                className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-ink"
              >
                Baixar lembrete (.ics)
              </a>
            </div>
          ))
        ) : (
          <p className="text-sm text-text-soft">
            {configured
              ? `Nenhum bairro cadastrado ainda — a Prefeitura de ${cidadeNome} ainda não disponibilizou essa agenda de forma estruturada; assim que tivermos a fonte confirmada, ela entra aqui.`
              : "Nenhum dado disponível no momento."}
          </p>
        )}
      </section>
    </>
  );
}

/** O fallback do `<Suspense>`: a agenda inteira, sem ler a query. */
export function ListaColetaCompleta(props: ColetaProps) {
  return <ColetaConteudo {...props} bairro={null} />;
}

export default function ListaColeta(props: ColetaProps) {
  const bairro = useSearchParams().get("bairro");
  return <ColetaConteudo {...props} bairro={bairro} />;
}
