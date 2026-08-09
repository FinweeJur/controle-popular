import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import TabelaScroll from "@/app/[municipio]/components/TabelaScroll";
import RankingVereadores from "@/app/[municipio]/components/charts/RankingVereadores";
import ComoFuncionaPontuacao from "@/app/[municipio]/components/charts/ComoFuncionaPontuacao";
import ComposicaoCamara from "@/app/[municipio]/components/charts/ComposicaoCamara";
import AreasAtuacao from "@/app/[municipio]/components/charts/AreasAtuacao";
import {
  getVereadores,
  getRankingVereadores,
  getVereadoresForaDeExercicio,
  SITUACAO_MANDATO_LABELS,
} from "@/lib/betim/vereadores";
import { getTemasCamara } from "@/lib/betim/temas";
import { getGastoGabineteDaCasa, getVerbasAnalytics } from "@/lib/betim/verbas";
import { formatCurrencyBRL, formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import {
  creditoDosVereadores,
  rotuloLegislatura,
  temFonte,
  type Cidade,
} from "@/lib/db/queries/municipios";

export const generateMetadata = metadataDaCidade(
  (c) => `Câmara Municipal — ${nomePortal(c)}`,
  (c) => `Vereadores da ${rotuloLegislatura(c)} de ${c.nome}-${c.uf}.`
);

/**
 * Rótulo e URL da Câmara da cidade, para o `source` dos cards.
 *
 * Estava escrito à mão como `{ label: "Câmara de Betim", url:
 * "https://www.camarabetim.mg.gov.br" }` em 11 lugares — ou seja, a página
 * de um vereador de Belo Horizonte creditava a Câmara de Betim e linkava
 * para o site dela. Numa tela cujo propósito é dizer de onde o número veio,
 * essa é a linha que menos pode estar errada.
 */
function fonteDaCamara(cidade: Cidade) {
  const host =
    typeof cidade.fontes?.camara_host === "string" ? cidade.fontes.camara_host : undefined;
  return { label: `Câmara de ${cidade.nome}`, url: host };
}

export default async function CamaraPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const { rows, ok } = await getVereadores(cidade.id_municipio);
  const verbas = await getVerbasAnalytics(cidade.id_municipio);
  const gabinetes = await getGastoGabineteDaCasa(cidade.id_municipio);
  const ranking = await getRankingVereadores(cidade.id_municipio);
  // Consulta separada de propósito: estes NÃO entram em `rows`, que é o
  // que conta cadeiras e alimenta o ranking. Ver `listarVereadores`.
  const foraDeExercicio = await getVereadoresForaDeExercicio(cidade.id_municipio);
  const temasCamara = await getTemasCamara(cidade.id_municipio);
  const fonteCamara = fonteDaCamara(cidade);
  // `camara_youtube` e `camara_sessoes` são gravados em DOIS formatos: uma
  // string simples (Betim, BH) ou um objeto com metadados extras (São
  // Paulo, cujo ETL guarda channel_id e a grade de dias/hora). Ler só o
  // caso string faria a seção sumir em São Paulo sem nenhum sinal.
  const fontes = (cidade.fontes ?? {}) as Record<string, unknown>;
  const texto = (chave: string, dentro?: string): string | null => {
    const v = fontes[chave];
    if (typeof v === "string") return v;
    if (v && typeof v === "object" && dentro) {
      const interno = (v as Record<string, unknown>)[dentro];
      return typeof interno === "string" ? interno : null;
    }
    return null;
  };
  const transmissao = texto("camara_youtube", "url");
  const camaraHost = texto("camara_host");
  const sessoesBruto = fontes.camara_sessoes;
  const sessoes =
    typeof sessoesBruto === "string"
      ? sessoesBruto
      : ((): string | null => {
          const ord = (sessoesBruto as { ordinarias?: { hora?: string; dias_semana?: string[] } } | undefined)
            ?.ordinarias;
          if (!ord?.dias_semana?.length) return null;
          const nomes: Record<string, string> = {
            segunda: "segundas", terca: "terças", quarta: "quartas",
            quinta: "quintas", sexta: "sextas",
          };
          const dias = ord.dias_semana.map((d) => nomes[d] ?? d);
          const lista =
            dias.length === 1 ? dias[0] : `${dias.slice(0, -1).join(", ")} e ${dias.at(-1)}`;
          return ord.hora ? `às ${lista}, ${ord.hora.replace(":", "h")}` : `às ${lista}`;
        })();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <h1 className="mb-2 font-display text-2xl font-bold tracking-tight">
        Câmara Municipal de {cidade.nome}
      </h1>
      <p className="mb-4 max-w-2xl text-sm text-text-soft">
        {/* "Os 23 vereadores da 20ª Legislatura" era Betim escrito à mão:
            BH tem 41 e São Paulo tem 55, na 19ª legislatura. A contagem sai
            do próprio dado e o rótulo, do banco. */}
        {/* O crédito da fonte também não pode ser literal: em Itinga a Câmara
            não publica dado estruturado e os vereadores vêm do resultado do
            TSE. Afirmar "site oficial da Câmara" ali seria falso justamente na
            frase que existe para dizer de onde o dado veio. */}
        {rows.length > 0 ? `Os ${rows.length} vereadores` : "Os vereadores"} da{" "}
        {rotuloLegislatura(cidade)}, {creditoDosVereadores(cidade)}.
      </p>
      <p className="mb-8 flex flex-wrap gap-x-6 gap-y-1">
        {/* A rota de proposições dá 404 em câmara que não publica produção
            legislativa (ver `camara/proposicoes/page.tsx`), então o link
            desaparece junto — link para 404 é pior que link a menos. */}
        {temFonte(cidade, "camara_proposicoes") && (
          <Link href="/camara/proposicoes" className="text-sm font-medium text-accent hover:underline">
            Ver todas as proposições →
          </Link>
        )}
        <Link href="/camara/comissoes" className="text-sm font-medium text-accent hover:underline">
          Ver composição das comissões →
        </Link>
        <Link href="/camara/votacoes" className="text-sm font-medium text-accent hover:underline">
          Ver como cada vereador votou →
        </Link>
      </p>

      {/* O canal e o horário eram literais de Betim
          (@camaramunicipaldebetim7326, "terças-feiras") e apareciam
          igualzinho em Belo Horizonte e São Paulo — informação
          verificavelmente falsa numa seção que manda o leitor assistir. Os
          três dados vêm de `municipios.fontes`: `camara_youtube`,
          `camara_sessoes` e `camara_host`. Sem eles a seção não é
          renderizada, porque um card de transmissão sem link não serve
          para nada. */}
      {transmissao && (
      <section className="mb-10 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-bold text-text">
          <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-alert" aria-hidden />
          Transmissão das sessões
        </h2>
        <p className="mb-3 max-w-2xl text-sm text-text-soft">
          {sessoes
            ? `As reuniões ordinárias da Câmara acontecem ${sessoes} e são transmitidas ao vivo no canal oficial da Câmara no YouTube. As sessões anteriores ficam gravadas no mesmo canal.`
            : "As reuniões ordinárias da Câmara são transmitidas ao vivo no canal oficial no YouTube, onde as sessões anteriores também ficam gravadas."}
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={transmissao}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-ink hover:bg-primary/90"
          >
            Assistir no YouTube ↗
          </a>
          {camaraHost && (
          <a
            href={camaraHost}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-surface-2 px-4 py-1.5 text-sm font-medium text-text hover:bg-surface-2/70"
          >
            Agenda oficial da Câmara ↗
          </a>
          )}
        </div>
      </section>
      )}

      {gabinetes.ok && gabinetes.linhas.length > 0 && (
        <div className="mb-10" id="gastos-gabinete">
          <h2 className="mb-1 font-display text-lg font-bold text-text">
            Quanto o gabinete de cada vereador gastou
          </h2>
          <p className="mb-4 max-w-2xl text-sm text-text-soft">
            {/* O subsídio fica de fora desta tabela de propósito: é igual
                para todos os vereadores da casa, então incluí-lo somaria a
                mesma parcela em cada linha e comprimiria justamente a
                diferença que a tabela existe para mostrar. */}
            Custeio do gabinete — material de escritório, serviços postais,
            gráfica e afins. Não inclui o subsídio, que é igual para todos.
            Ordenado por {gabinetes.anos[0]}.
          </p>
          <TabelaScroll>
            <table className="w-full min-w-[34rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2 pr-3 font-semibold text-text-soft">Vereador</th>
                  {gabinetes.anos.map((a) => (
                    <th key={a} className="py-2 pr-3 text-right font-semibold text-text-soft">
                      {a}
                    </th>
                  ))}
                  <th className="py-2 text-right font-semibold text-text-soft">Total</th>
                </tr>
              </thead>
              <tbody>
                {gabinetes.linhas.map((l) => (
                  <tr key={l.vereadorId} className="border-b border-border/60">
                    <td className="py-2 pr-3">
                      <Link href={`/vereadores/${l.slug}`} className="font-medium text-text hover:text-primary">
                        {l.nome}
                      </Link>
                      {l.partido && (
                        <span className="ml-1.5 text-[.8em] text-text-soft">{l.partido}</span>
                      )}
                    </td>
                    {gabinetes.anos.map((a) => (
                      <td key={a} className="py-2 pr-3 text-right font-tabular text-text-soft">
                        {l.porAno[a] != null ? formatCurrencyBRL(l.porAno[a]) : "—"}
                      </td>
                    ))}
                    <td className="py-2 text-right font-tabular font-semibold text-text">
                      {formatCurrencyBRL(l.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabelaScroll>
        </div>
      )}

      {verbas.ok && verbas.totalRegistros > 0 && (
        <div className="mb-10">
          <h2 className="mb-1 font-display text-lg font-bold text-text">
            Verbas indenizatórias — todos os vereadores
          </h2>
          <p className="mb-4 text-sm text-text-soft">
            {formatNumberBR(verbas.totalRegistros)} reembolsos, total{" "}
            <strong className="font-tabular text-text">{formatCurrencyBRL(verbas.total)}</strong>
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DataCard
              title="Gastos por tema"
              source={fonteCamara}
            >
              <ul className="divide-y divide-border/60">
                {verbas.gastosPorTema.map((item) => (
                  <li key={item.tema} className="flex items-center justify-between py-2">
                    <span className="text-text">
                      {item.tema}{" "}
                      <span className="text-text-soft">({formatNumberBR(item.qtd)})</span>
                    </span>
                    <strong className="font-tabular text-text">
                      {formatCurrencyBRL(item.valor)}
                    </strong>
                  </li>
                ))}
              </ul>
            </DataCard>
            <DataCard
              title="Top 5 fornecedores que mais receberam"
              source={fonteCamara}
            >
              <ul className="divide-y divide-border/60">
                {verbas.topFornecedores.map((item) => (
                  <li key={item.fornecedor} className="flex items-center justify-between py-2">
                    <span className="text-text">
                      {item.fornecedor}{" "}
                      <span className="text-text-soft">({formatNumberBR(item.qtd)})</span>
                    </span>
                    <strong className="font-tabular text-text">
                      {formatCurrencyBRL(item.valor)}
                    </strong>
                  </li>
                ))}
              </ul>
            </DataCard>
          </div>
        </div>
      )}

      {ranking.ok && ranking.rows.some((r) => r.pontuacao > 0) && (
        <div id="ranking" className="mb-10 scroll-mt-20">
          <h2 className="mb-1 font-display text-lg font-bold text-text">
            Ranking de atuação legislativa
          </h2>
          <p className="mb-5 max-w-2xl text-sm text-text-soft">
            Cada barra mostra de onde vem a pontuação do vereador: o
            tamanho de cada faixa é quanto aquele tipo de proposição
            contribuiu. Quanto mais escura a faixa, mais pesado o tipo.
          </p>

          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DataCard
              title="Como a pontuação é calculada"
              source={fonteCamara}
            >
              <ComoFuncionaPontuacao
                totaisLinhas={ranking.totaisLinhas}
                rows={ranking.rows}
              />
            </DataCard>
            <DataCard
              title="O que a Câmara produziu — volume x peso"
              source={fonteCamara}
            >
              <p className="mb-4 text-sm">
                As mesmas proposições contadas de dois jeitos — por
                quantidade e depois de aplicar os pesos. É a diferença
                entre &ldquo;quem mais apresenta&rdquo; e &ldquo;quem
                mais pontua&rdquo;.
              </p>
              <ComposicaoCamara totaisLinhas={ranking.totaisLinhas} />
            </DataCard>
          </div>

          {temasCamara.ok && temasCamara.temas.length > 0 && (
            <div className="mb-6">
              <DataCard
                title="Áreas de atuação da Câmara — sobre o que os vereadores legislam"
                source={fonteCamara}
              >
                <p className="mb-3 text-sm">
                  Em quantas proposições cada área aparece, somando os 23
                  vereadores (uma proposição pode tocar mais de uma área).
                </p>
                <AreasAtuacao
                  temas={temasCamara.temas}
                  unidade="proposições"
                  unidadeSingular="proposição"
                  limite={10}
                />
              </DataCard>
            </div>
          )}

          <RankingVereadores rows={ranking.rows} detalhado />
        </div>
      )}

      {!ok || rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-center text-sm text-text-soft">
          Nenhum vereador encontrado no momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((v) => (
            <Link
              key={v.slug}
              href={`/vereadores/${v.slug}`}
              className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-primary"
            >
              <h3 className="font-display text-base font-semibold text-text">
                {v.nome_urna ?? v.nome}
              </h3>
              <p className="mt-1 text-sm text-text-soft">{v.nome}</p>
              {v.partido && (
                <p className="mt-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {v.partido}
                </p>
              )}
              {v.cargo_mesa && (
                <p className="mt-2 text-xs font-medium text-accent">{v.cargo_mesa}</p>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* FORA DA CONTAGEM, E DITO NA TELA.
          O licenciado continua sendo o titular da cadeira e o site oficial o
          mantém compondo comissão — some-lo aos ativos faria São Paulo
          anunciar 59 vereadores para 55 cadeiras, e toda média por vereador
          herdaria o erro. Omiti-lo por inteiro criaria o problema oposto: a
          vice-presidência da CCJ aparecia vazia, lendo como "a comissão não
          tem vice" em vez de "o vice está licenciado". */}
      {foraDeExercicio.ok && foraDeExercicio.rows.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-1 font-display text-lg font-bold text-text">
            Fora de exercício
          </h2>
          <p className="mb-5 max-w-2xl text-sm text-text-soft">
            {foraDeExercicio.rows.length === 1
              ? "Este vereador continua sendo o titular da cadeira"
              : `Estes ${foraDeExercicio.rows.length} vereadores continuam sendo os titulares das cadeiras`}
            , e podem seguir compondo comissões — mas não estão em exercício
            hoje. Por isso <strong className="font-medium text-text">não entram
            na contagem de {rows.length}</strong> acima, nem no ranking de
            atuação. Quem ocupa a vaga no lugar deles aparece como vereador em
            exercício, na lista de cima.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {foraDeExercicio.rows.map((v) => (
              <Link
                key={v.slug}
                href={`/vereadores/${v.slug}`}
                className="rounded-2xl border border-dashed border-border bg-surface-2 p-5 transition-colors hover:border-primary"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-base font-semibold text-text-soft">
                    {v.nome_urna ?? v.nome}
                  </h3>
                  <span className="shrink-0 rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-text-soft">
                    {SITUACAO_MANDATO_LABELS[v.situacao_mandato ?? ""] ??
                      "Fora de exercício"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-text-soft">{v.nome}</p>
                {v.partido && (
                  <p className="mt-2 inline-block rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-text-soft">
                    {v.partido}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
