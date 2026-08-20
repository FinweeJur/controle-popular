"use client";

import DataCard from "@/app/[municipio]/components/DataCard";
import BarrasValor, { type BarraItem } from "@/app/[municipio]/components/charts/BarrasValor";
import type { DespesasPorFuncaoData } from "@/lib/betim/despesas";
import Moeda from "@/app/components/Moeda";
import { formatCurrencyBRL, formatCurrencyCompactaBR } from "@/lib/betim/format";
import { useSearchParams } from "next/navigation";

/**
 * O filtro `?ano=` saiu do servidor e veio para cá, junto com o formulário e o
 * card — as três coisas que mudam quando o ano muda.
 *
 * POR QUE: em `output: 'export'` não existe request no momento da geração,
 * então `searchParams` num Server Component é erro de build — não é
 * degradação, o build inteiro para (ver `docs/deploy-github-pages.md` §3).
 *
 * O recorte NÃO mudou de significado, e aqui isso precisou de cuidado: o ano
 * era `where ano = ?` no SQL, dentro de uma consulta que soma no banco. O
 * servidor passou a rodar essa mesma consulta uma vez por ano disponível e a
 * mandar o conjunto inteiro, então cada ano chega com exatamente os números
 * que o servidor calculava sozinho — inclusive o `pct`, que é fatia do total
 * DAQUELE ano. O que não daria certo seria buscar um ano só e recortar: não
 * há como derivar 2019 a partir de 2024.
 *
 * O volume é o que torna isso viável: a agregação devolve no máximo as 29
 * funções COFOG por ano, e o ETL do SICONFI começa em 2015 — algumas centenas
 * de linhas, e o número não cresce com o tamanho da cidade (São Paulo tem as
 * mesmas 29 funções que Betim).
 *
 * `useSearchParams()` obriga um `<Suspense>` acima (quem chama põe). Sem ele
 * o Next tira a ROTA INTEIRA do pré-render e manda para o cliente — no alvo
 * estático isso é build quebrado, e no Cloudflare seria a página perdendo o
 * SSG sem ninguém notar.
 */
/**
 * ═══ POR QUE SÃO DOIS COMPONENTES ═══
 *
 * `useSearchParams()` exige um `<Suspense>` acima, e o `fallback` DELE não
 * pode chamar o mesmo hook — o fallback é justamente o que se renderiza sem
 * ele. Passar este componente nos dois lados derruba o `next build` com
 * "should be wrapped in a suspense boundary", e só lá: `next dev` não
 * pré-renderiza, então a página parece perfeita o desenvolvimento inteiro e
 * o `tsc` não tem como ver.
 *
 * O componente "Completa" sendo o fallback é também o que mantém o conteúdo
 * INTEIRO dentro do HTML estático — quem chega sem JavaScript ainda vê tudo.
 */
interface DespesasProps {
  /** Um item por ano disponível, do mais recente para o mais antigo. */
  porAno: DespesasPorFuncaoData[];
}

function DespesasConteudo({
  porAno,
  anoParam,
}: DespesasProps & { anoParam: string | null }) {

  // O `Number()` é a mesma conversão que `getDespesasPorFuncao` fazia antes de
  // comparar, e é o que evita a armadilha de trazer para JS um `=` do SQL: a
  // URL entrega "2019" (string) e o banco devolve 2019 (número), então um
  // `===` cru entre os dois nunca casaria e todo link com ?ano= cairia
  // silenciosamente no ano mais recente. Ano inexistente, vazio ou não
  // numérico cai no primeiro item — o mais recente —, igual ao servidor.
  const anoPedido = anoParam ? Number(anoParam) : undefined;
  const dados =
    (anoPedido !== undefined ? porAno.find((d) => d.ano === anoPedido) : undefined) ?? porAno[0];

  // `porAno` vazio é o caso em que o servidor não conseguiu nem listar os anos
  // (banco fora, tabela vazia): antes isso chegava aqui como `ok: false`.
  if (!dados || !dados.ok) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-sm text-text-soft">
        Dados de despesas ainda não disponíveis.
      </div>
    );
  }

  const itens: BarraItem[] = dados.funcoes.map((f) => ({
    label: f.funcao,
    valor: f.valor,
    sublabel: `· ${f.pct.toFixed(1)}%`,
    titulo: `${f.funcao}: ${formatCurrencyBRL(f.valor)} (${f.pct.toFixed(1)}% das despesas por função em ${dados.ano})`,
  }));

  return (
    <>
      {dados.anosDisponiveis.length > 1 && (
        <form method="GET" className="mt-6 flex items-end gap-3">
          <div className="flex flex-col">
            <label htmlFor="ano" className="mb-1 text-xs font-medium text-text-soft">
              Ano
            </label>
            <select
              id="ano"
              name="ano"
              defaultValue={String(dados.ano)}
              className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
            >
              {dados.anosDisponiveis.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="cursor-pointer rounded-lg border border-primary bg-primary px-5 py-2 text-sm font-semibold text-primary-ink"
          >
            Ver
          </button>
        </form>
      )}

      <div className="mt-6">
        <DataCard
          title={`Despesas pagas por função em ${dados.ano}`}
          source={{ label: "SICONFI/Tesouro Nacional", url: "https://siconfi.tesouro.gov.br/" }}
        >
          <p className="mb-4 text-sm text-text-soft">
            Total por função:{" "}
            <strong className="font-tabular text-text">
              <Moeda value={dados.total} />
            </strong>{" "}
            — a barra de cada área é proporcional à maior.
          </p>
          <BarrasValor itens={itens} formatValor={formatCurrencyCompactaBR} />
          <p className="mt-4 text-xs text-text-soft">
            Mostra o que a Prefeitura de fato <strong>pagou</strong> em
            cada área ao longo do ano. Não inclui alguns repasses internos
            entre órgãos, então o total pode ficar um pouco abaixo do gasto
            do ano inteiro.
          </p>
        </DataCard>
      </div>
    </>
  );
}

/** O fallback do `<Suspense>`: o ano mais recente, sem ler a query. */
export function PainelDespesasCompleto(props: DespesasProps) {
  return <DespesasConteudo {...props} anoParam={null} />;
}

export default function PainelDespesas(props: DespesasProps) {
  const anoParam = useSearchParams().get("ano");
  return <DespesasConteudo {...props} anoParam={anoParam} />;
}
