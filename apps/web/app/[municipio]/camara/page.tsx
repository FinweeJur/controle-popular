import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import RankingVereadores from "@/app/[municipio]/components/charts/RankingVereadores";
import ComoFuncionaPontuacao from "@/app/[municipio]/components/charts/ComoFuncionaPontuacao";
import ComposicaoCamara from "@/app/[municipio]/components/charts/ComposicaoCamara";
import AreasAtuacao from "@/app/[municipio]/components/charts/AreasAtuacao";
import { getVereadores, getRankingVereadores } from "@/lib/betim/vereadores";
import { getTemasCamara } from "@/lib/betim/temas";
import { getVerbasAnalytics } from "@/lib/betim/verbas";
import { formatCurrencyBRL, formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import { rotuloLegislatura } from "@/lib/db/queries/municipios";

export const generateMetadata = metadataDaCidade(
  (c) => `Câmara Municipal — ${nomePortal(c)}`,
  (c) => `Vereadores da ${rotuloLegislatura(c)} de ${c.nome}-${c.uf}.`
);

export default async function CamaraPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const { rows, ok } = await getVereadores(cidade.id_municipio);
  const verbas = await getVerbasAnalytics(cidade.id_municipio);
  const ranking = await getRankingVereadores(cidade.id_municipio);
  const temasCamara = await getTemasCamara(cidade.id_municipio);
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
        {rows.length > 0 ? `Os ${rows.length} vereadores` : "Os vereadores"} da{" "}
        {rotuloLegislatura(cidade)}, dados públicos do site oficial da Câmara.
      </p>
      <p className="mb-8 flex flex-wrap gap-x-6 gap-y-1">
        <Link href="/camara/proposicoes" className="text-sm font-medium text-accent hover:underline">
          Ver todas as proposições →
        </Link>
        <Link href="/camara/comissoes" className="text-sm font-medium text-accent hover:underline">
          Ver composição das comissões →
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
              source={{ label: "Câmara de Betim", url: "https://www.camarabetim.mg.gov.br" }}
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
              source={{ label: "Câmara de Betim", url: "https://www.camarabetim.mg.gov.br" }}
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
              source={{ label: "Câmara de Betim", url: "https://www.camarabetim.mg.gov.br" }}
            >
              <ComoFuncionaPontuacao />
            </DataCard>
            <DataCard
              title="O que a Câmara produziu — volume x peso"
              source={{ label: "Câmara de Betim", url: "https://www.camarabetim.mg.gov.br" }}
            >
              <p className="mb-4 text-sm">
                As mesmas proposições contadas de dois jeitos — por
                quantidade e depois de aplicar os pesos. É a diferença
                entre &ldquo;quem mais apresenta&rdquo; e &ldquo;quem
                mais pontua&rdquo;.
              </p>
              <ComposicaoCamara totaisPorTipo={ranking.totaisPorTipo} />
            </DataCard>
          </div>

          {temasCamara.ok && temasCamara.temas.length > 0 && (
            <div className="mb-6">
              <DataCard
                title="Áreas de atuação da Câmara — sobre o que os vereadores legislam"
                source={{ label: "Câmara de Betim", url: "https://www.camarabetim.mg.gov.br" }}
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
    </div>
  );
}
