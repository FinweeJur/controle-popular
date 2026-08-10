import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import PaginaEmBreve from "@/app/[municipio]/components/PaginaEmBreve";
import ListaEmendas from "./ListaEmendas";
import { getConveniosFederais } from "@/lib/betim/convenios";
import { formatCurrencyBRL, formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Emendas Parlamentares / Repasses Federais — ${nomePortal(c)}`,
  (c) => `Convênios e repasses federais recebidos por ${c.nome}, com órgão de origem, valor e situação, via Portal da Transparência.`
);

export default async function EmendasPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const prefixoExport = process.env.PAGES_BASE_PATH ?? "";
  const baseDados = `${prefixoExport}/${cidade.slug}/emendas/dados`;
  const { configured, ok, convenios, valorTotal, valorLiberadoTotal, qtdComPrefeitura, porOrgao } =
    await getConveniosFederais(cidade.id_municipio);

  const temDados = configured && ok && convenios.length > 0;

  if (!temDados) {
    return (
      <PaginaEmBreve
        titulo="Emendas Parlamentares / Repasses Federais"
        descricao={`Convênios e verbas federais de deputados, senadores e ministérios destinados a ${cidade.nome}, com valores e destino.`}
        motivo={
          configured
            ? "Nenhum convênio encontrado no momento."
            : "Depende da API do Portal da Transparência federal, ainda não configurada neste ambiente."
        }
      />
    );
  }

  const qtdEntidades = convenios.length - qtdComPrefeitura;
  const maiorOrgao = porOrgao[0] ?? null;
  const fatiaMaiorOrgao =
    maiorOrgao && valorTotal > 0 ? (maiorOrgao.valor / valorTotal) * 100 : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/dados" className="hover:text-primary">
          {cidade.nome} em Dados
        </Link>{" "}
        · <span className="text-text">Emendas Parlamentares / Repasses Federais</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Emendas Parlamentares / Repasses Federais
      </h1>
      <p className="mt-2 max-w-3xl text-[1.02em] text-text-soft">
        Convênios e repasses do governo federal para {cidade.nome} — dinheiro que sai
        de um ministério e chega à Prefeitura ou a uma entidade local para um
        propósito específico.
      </p>

      <div className="mt-8 mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DataCard
          title="Convênios recebidos"
          source={{
            label: "Portal da Transparência",
            url: "https://portaldatransparencia.gov.br/convenios",
          }}
        >
          <p className="font-tabular text-2xl font-bold text-text">
            {formatNumberBR(convenios.length)}
          </p>
          <p className="mt-1 text-xs">
            {formatNumberBR(qtdComPrefeitura)} direto com a Prefeitura ·{" "}
            {formatNumberBR(qtdEntidades)} com entidades locais
          </p>
        </DataCard>
        <DataCard title="Valor total combinado">
          <p className="font-tabular text-2xl font-bold text-text">
            {formatCurrencyBRL(valorTotal)}
          </p>
          <p className="mt-1 text-xs">
            {formatCurrencyBRL(valorLiberadoTotal)} já liberado (
            {valorTotal > 0
              ? ((valorLiberadoTotal / valorTotal) * 100).toFixed(0)
              : "0"}
            %)
          </p>
        </DataCard>
        <DataCard title="Maior órgão de origem">
          {maiorOrgao && fatiaMaiorOrgao !== null ? (
            <>
              <p className="font-tabular text-2xl font-bold text-text">
                {fatiaMaiorOrgao.toFixed(0)}%
              </p>
              <p className="mt-1 text-xs">do valor total veio de {maiorOrgao.nome}</p>
            </>
          ) : (
            <p className="text-xs">—</p>
          )}
        </DataCard>
      </div>

      <section className="mb-8 rounded-2xl border border-border bg-surface-2 px-6 py-5 text-sm text-text-soft">
        <h2 className="font-display text-base font-semibold text-text">
          O que este dado é — e o que não é
        </h2>
        <p className="mt-2">
          Vem do <strong className="font-semibold text-text">Portal da Transparência</strong>{" "}
          do governo federal, na parte de convênios, filtrada por {cidade.nome}. Cada
          linha é um acordo entre um órgão federal e quem recebeu o dinheiro —
          quase sempre a Prefeitura, às vezes uma entidade local como a APAE ou
          o Centro de Defesa dos Direitos Humanos de {cidade.nome}.
        </p>
        <p className="mt-2">
          <strong className="font-semibold text-text">
            Não é a mesma coisa que "emenda de um deputado".
          </strong>{" "}
          A fonte não diz qual parlamentar indicou cada convênio — testamos, e
          pra {cidade.nome} esse dado veio praticamente vazio. O que esta página mostra
          é o dinheiro que de fato chegou, tenha vindo de emenda ou não.
        </p>
        <p className="mt-2">
          "Valor combinado" é o total do acordo. "Liberado" é o que já foi
          repassado até agora. A diferença costuma ser parcela que ainda não
          saiu — não é dinheiro perdido.
        </p>
      </section>

      {porOrgao.length > 0 && (
        <div className="mb-6">
          <DataCard title="Por órgão de origem">
            <ul className="flex flex-col gap-2">
              {porOrgao.map((o) => {
                const fatia = valorTotal > 0 ? (o.valor / valorTotal) * 100 : 0;
                return (
                  <li
                    key={o.nome}
                    className="flex items-center gap-3"
                    title={`${o.nome}: ${formatCurrencyBRL(o.valor)} em ${o.qtd} ${o.qtd === 1 ? "convênio" : "convênios"} (${fatia.toFixed(1)}% do total)`}
                  >
                    <span className="w-48 min-w-0 shrink-0 truncate text-xs sm:w-56">
                      {o.nome} ({o.qtd})
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max(fatia, 2)}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-right font-tabular text-xs whitespace-nowrap">
                      {formatCurrencyBRL(o.valor)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </DataCard>
        </div>
      )}

      {/* Índice estático fatiado, e não `convenios.map()` inline.
        *
        * A tabela inline renderizava todos os convênios no servidor. Com os
        * 3.000 de Belo Horizonte a entrada de cache desta página chegou a
        * 24,11 MB, contra o teto de 25 MiB por arquivo do Workers, e o deploy
        * passou a falhar no upload do asset. Ver `dados/[arquivo]/route.ts`. */}
      <ListaEmendas base={baseDados} />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent bg-accent/10 px-6 py-5">
        <div>
          <strong className="text-[1.05em]">Quer conferir na fonte?</strong>
          <p className="mt-1 text-sm text-text-soft">
            Todo convênio pode ser buscado pelo número no Portal da
            Transparência.
          </p>
        </div>
        <Link
          href="https://portaldatransparencia.gov.br/convenios"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4.5 py-2.5 text-[.9em] font-semibold text-text"
        >
          Portal da Transparência ↗
        </Link>
      </div>
    </div>
  );
}
