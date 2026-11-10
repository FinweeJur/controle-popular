import type { Metadata } from "next";
import { metadataEditavel } from "@/lib/edicoes";
import NextLink from "next/link";
import type { ReactNode } from "react";
import CaminhoSistema from "@/app/components/CaminhoSistema";
import { formatNumberBR } from "@/lib/betim/format";
import { EIXOS } from "@/lib/navegacao/mapa";
import { ACERVO_JURISPRUDENCIA as jurisprudenciaBruta } from "@/lib/jurisprudencia-acervo";
import noticiasBrutas from "@/data/noticias-desastres.json";
import mabBruto from "@/data/mab-publicacoes.json";
import bibliotecaBruta from "@/public/data/biblioteca-desastres.json";
import prosaCasos from "@/data/analises/eixos-casos.json";
import { MarkdownResumo } from "@/app/components/ResumoRealidade";

/**
 * `/eixos/casos` — porta do eixo Casos.
 *
 * ═══ O QUE ESTA PÁGINA É ═══
 *
 * A leitura de conjunto dos três casos que o portal acompanha: Brumadinho
 * (barragem B1, Córrego do Feijão), Rio Doce (barragem de Fundão, Mariana) e
 * Itatiaiuçu (barragem Serra Azul). Ela compara o que já foi medido — acórdãos,
 * documentos, notícias e publicações do MAB — e diz, com todas as letras, o que
 * ainda não foi medido.
 *
 * ═══ DE ONDE VEM CADA NÚMERO ═══
 *
 * - Acórdãos: `data/jurisprudencia-casos.json`, filtrado pelo campo `frente`.
 * - Documentos: `public/data/biblioteca-desastres.json`, filtrado por
 *   `desastre` (`mariana` é o caso do Rio Doce).
 * - Notícias: `data/noticias-desastres.json`, filtrado por `desastre`.
 * - MAB: `data/mab-publicacoes.json`, filtrado por `caso`; a única publicação
 *   de Itatiaiuçu não tem `caso` preenchido e é reconhecida pelo título.
 *
 * Nenhum total é digitado à mão. O arquivo de jurisprudência tem 23.569 casos;
 * esta página soma só as três frentes de desastre (13.142). Os acervos são
 * conjuntos diferentes e NÃO se somam entre si: um acórdão não é um documento,
 * uma notícia não é um fato oficial e uma publicação do MAB não é decisão
 * judicial. A página repete isso onde o número aparece.
 *
 * ═══ POR QUE SERVIDOR ═══
 *
 * As quatro coleções passam de 25 mil itens. A página reduz tudo a contagens no
 * servidor e nunca envia as listas como prop de componente de cliente
 * (AGENTS.md, regra 5.1). As barras são CSS/Tailwind, sem biblioteca nova.
 */

interface CasoJurisprudencia {
  frente?: string;
}

interface NoticiaDesastre {
  desastre?: string | null;
}

interface PublicacaoMab {
  caso?: string | null;
  titulo?: string;
}

interface DocumentoBiblioteca {
  desastre?: string | null;
}

const ARQUIVO_JURIS = jurisprudenciaBruta as {
  geradoEm?: string;
  total?: number;
  casos?: CasoJurisprudencia[];
};

const ARQUIVO_NOTICIAS = noticiasBrutas as {
  gerado_em?: string;
  janela_dias?: number;
  itens?: NoticiaDesastre[];
};

const ARQUIVO_MAB = mabBruto as {
  geradoEm?: string;
  total?: number;
  itens?: PublicacaoMab[];
};

const ARQUIVO_BIBLIOTECA = bibliotecaBruta as {
  geradoEm?: string;
  itens?: DocumentoBiblioteca[];
};

const ITENS_JURIS = ARQUIVO_JURIS.casos ?? [];
const ITENS_NOTICIAS = ARQUIVO_NOTICIAS.itens ?? [];
const ITENS_MAB = ARQUIVO_MAB.itens ?? [];
const ITENS_BIBLIOTECA = ARQUIVO_BIBLIOTECA.itens ?? [];

function contar<T>(lista: T[], teste: (item: T) => boolean): number {
  return lista.reduce((total, item) => total + (teste(item) ? 1 : 0), 0);
}

const ACORDAOS = {
  brumadinho: contar(ITENS_JURIS, (item) => item.frente === "brumadinho"),
  riodoce: contar(ITENS_JURIS, (item) => item.frente === "riodoce"),
  itatiaiaucu: contar(ITENS_JURIS, (item) => item.frente === "itatiaiaucu"),
};

/**
 * A biblioteca de desastres só cataloga Brumadinho (`brumadinho`) e
 * Mariana/Rio Doce (`mariana`). Itatiaiuçu não entra: `null` significa
 * "não medido", não zero.
 */
const DOCUMENTOS: { brumadinho: number; riodoce: number; itatiaiaucu: null } = {
  brumadinho: contar(ITENS_BIBLIOTECA, (item) => item.desastre === "brumadinho"),
  riodoce: contar(ITENS_BIBLIOTECA, (item) => item.desastre === "mariana"),
  itatiaiaucu: null,
};

const NOTICIAS = {
  brumadinho: contar(ITENS_NOTICIAS, (item) => item.desastre === "brumadinho"),
  riodoce: contar(ITENS_NOTICIAS, (item) => item.desastre === "mariana"),
  itatiaiaucu: contar(ITENS_NOTICIAS, (item) => item.desastre === "itatiaiaucu"),
};

/**
 * O MAB não tem `caso: "itatiaiaucu"` em nenhum item. A publicação existe e
 * está com `caso: null`; o título é a única pista versionada. O filtro por
 * título também aceita "Serra Azul" para não depender de uma grafia só.
 */
const MAB = {
  brumadinho: contar(ITENS_MAB, (item) => item.caso === "brumadinho"),
  riodoce: contar(ITENS_MAB, (item) => item.caso === "mariana"),
  itatiaiaucu: contar(
    ITENS_MAB,
    (item) =>
      item.caso === "itatiaiaucu" ||
      /itatiaiu[cç]u|serra azul/i.test(item.titulo ?? ""),
  ),
};

const TOTAL_ACORDAOS =
  ACORDAOS.brumadinho + ACORDAOS.riodoce + ACORDAOS.itatiaiaucu;
const TOTAL_DOCUMENTOS = DOCUMENTOS.brumadinho + DOCUMENTOS.riodoce;
const TOTAL_NOTICIAS = ITENS_NOTICIAS.length;
const TOTAL_MAB = ITENS_MAB.length;
const TOTAL_JURIS = ARQUIVO_JURIS.total ?? ITENS_JURIS.length;
const SEM_CASO_MAB =
  TOTAL_MAB - MAB.brumadinho - MAB.riodoce;
const SEM_VINCULO_NOTICIAS =
  TOTAL_NOTICIAS - NOTICIAS.brumadinho - NOTICIAS.riodoce;
const ROTAS_BRUMADINHO =
  EIXOS.find((eixo) => eixo.slug === "casos")
    ?.frentes.find((frente) => frente.slug === "brumadinho")?.rotas.length ?? 0;

/** "2026-11-08" ou ISO completo → "08/11/2026". Sem fuso: é data de coleta. */
function dia(iso: string | undefined): string {
  if (!iso) return "data não registrada";
  const [ano, mes, data] = iso.slice(0, 10).split("-");
  if (!ano || !mes || !data) return "data não registrada";
  return `${data}/${mes}/${ano}`;
}

const DATA_JURIS = dia(ARQUIVO_JURIS.geradoEm);
const DATA_NOTICIAS = dia(ARQUIVO_NOTICIAS.gerado_em);
const DATA_MAB = dia(ARQUIVO_MAB.geradoEm);
const DATA_BIBLIOTECA = dia(ARQUIVO_BIBLIOTECA.geradoEm);
const JANELA_NOTICIAS = ARQUIVO_NOTICIAS.janela_dias ?? 60;

export const metadata: Metadata = metadataEditavel("/eixos/casos", {
  title: "Casos — Brumadinho, Rio Doce e Itatiaiuçu | Controle Popular",
  description: `Os três casos que o portal acompanha: ${formatNumberBR(TOTAL_ACORDAOS)} acórdãos, ${formatNumberBR(TOTAL_DOCUMENTOS)} documentos de biblioteca, ${formatNumberBR(TOTAL_NOTICIAS)} notícias no radar e ${formatNumberBR(TOTAL_MAB)} publicações do MAB, com o que cada acervo mede e o que ainda falta medir.`,
});

function percentual(valor: number, total: number): string {
  if (!total) return "—";
  return `${((100 * valor) / total).toFixed(1).replace(".", ",")}%`;
}

interface Caso {
  id: "brumadinho" | "riodoce" | "itatiaiaucu";
  nome: string;
  local: string;
  quando: string;
  resumo: string;
  href: string;
  acordaos: number;
  documentos: number | null;
  noticias: number;
  mab: number;
  analise: string | null;
}

const CASOS: Caso[] = [
  {
    id: "brumadinho",
    nome: "Brumadinho",
    local: "Córrego do Feijão (MG) · barragem B1",
    quando: "25/01/2019",
    resumo:
      `O rompimento da barragem B1 da Vale e a reparação pelo acordo de 2024. A frente reúne auxílio emergencial, execução financeira, auditoria e os ${ROTAS_BRUMADINHO} caminhos do caso.`,
    href: "/paraopeba",
    acordaos: ACORDAOS.brumadinho,
    documentos: DOCUMENTOS.brumadinho,
    noticias: NOTICIAS.brumadinho,
    mab: MAB.brumadinho,
    analise: "/paraopeba/analise",
  },
  {
    id: "riodoce",
    nome: "Rio Doce",
    local: "Fundão, Mariana (MG) · Samarco, Vale e BHP",
    quando: "05/11/2015",
    resumo:
      "O rompimento da barragem de Fundão e a repactuação homologada pelo STF em 06/11/2024. A página reúne a execução do Acordo em MG, os processos e o acervo da bacia.",
    href: "/riodoce",
    acordaos: ACORDAOS.riodoce,
    documentos: DOCUMENTOS.riodoce,
    noticias: NOTICIAS.riodoce,
    mab: MAB.riodoce,
    analise: "/riodoce/analise",
  },
  {
    id: "itatiaiaucu",
    nome: "Itatiaiuçu",
    local: "Serra Azul (MG) · caso em acompanhamento",
    quando: "sem data consolidada neste eixo",
    resumo:
      "O caso da barragem Serra Azul, em Itatiaiuçu. O portal tem o recorte da jurisprudência e uma publicação do MAB; documentos, análise e linha do tempo ainda não foram medidos.",
    href: "/itatiaiaucu",
    acordaos: ACORDAOS.itatiaiaucu,
    documentos: DOCUMENTOS.itatiaiaucu,
    noticias: NOTICIAS.itatiaiaucu,
    mab: MAB.itatiaiaucu,
    analise: null,
  },
];

const INDICADORES = [
  {
    valor: formatNumberBR(CASOS.length),
    rotulo: "casos acompanhados",
    nota: "Brumadinho, Rio Doce e Itatiaiuçu",
  },
  {
    valor: formatNumberBR(TOTAL_ACORDAOS),
    rotulo: "acórdãos somados",
    nota: `de ${formatNumberBR(TOTAL_JURIS)} no acervo · ${DATA_JURIS}`,
  },
  {
    valor: formatNumberBR(TOTAL_DOCUMENTOS),
    rotulo: "documentos na biblioteca",
    nota: `Itatiaiuçu não medido · ${DATA_BIBLIOTECA}`,
  },
  {
    valor: formatNumberBR(TOTAL_NOTICIAS),
    rotulo: "notícias no radar",
    nota: `janela de ${JANELA_NOTICIAS} dias · ${DATA_NOTICIAS}`,
  },
  {
    valor: formatNumberBR(TOTAL_MAB),
    rotulo: "publicações do MAB",
    nota: `acervo medido em ${DATA_MAB}`,
  },
] as const;

const LACUNAS = [
  {
    caso: "Itatiaiuçu",
    estado: "sem análise e sem notícias",
    texto:
      `Não há análise própria nem notícia no radar de ${JANELA_NOTICIAS} dias. O que existe é o recorte da jurisprudência — ${formatNumberBR(ACORDAOS.itatiaiaucu)} acórdãos do TJMG — e ${formatNumberBR(MAB.itatiaiaucu)} publicação do MAB. Documentos, linha do tempo e execução continuam não medidos.`,
  },
  {
    caso: "Rio Doce",
    estado: "linha do tempo em construção",
    texto:
      "A análise integrada já está no ar, com execução do Acordo, processos e litoral. A linha do tempo do caso ainda está em construção; até lá, o hub e a análise são as portas completas.",
  },
  {
    caso: "Brumadinho",
    estado: `${ROTAS_BRUMADINHO} rotas publicadas`,
    texto:
      `A frente tem ${ROTAS_BRUMADINHO} rotas no mapa de navegação. O que falta não é porta: é consolidar num só texto a leitura que hoje está distribuída entre auxílio, execução, auditoria, perícia e documentos.`,
  },
] as const;

function NaoMedido() {
  return <span className="text-xs italic text-text-soft">não medido</span>;
}

function BotaoLink({
  href,
  children,
  principal = false,
}: {
  href: string;
  children: ReactNode;
  principal?: boolean;
}) {
  return (
    <NextLink
      href={href}
      className={
        principal
          ? "rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink transition-opacity hover:opacity-90"
          : "rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:border-primary hover:text-primary"
      }
    >
      {children}
    </NextLink>
  );
}

function BlocoBarras({
  titulo,
  descricao,
  linhas,
  maior,
  total,
  rodape,
}: {
  titulo: string;
  descricao: string;
  linhas: { nome: string; valor: number | null }[];
  maior: number;
  total: number;
  rodape: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="font-display text-lg font-semibold">{titulo}</h3>
      <p className="mt-1 text-sm text-text-soft">{descricao}</p>
      <ul className="mt-4 space-y-4">
        {linhas.map(({ nome, valor }) => (
          <li key={nome}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium">{nome}</span>
              {valor === null ? (
                <NaoMedido />
              ) : (
                <span className="font-tabular text-sm">
                  <strong>{formatNumberBR(valor)}</strong>{" "}
                  <span className="text-xs text-text-soft">
                    {percentual(valor, total)}
                  </span>
                </span>
              )}
            </div>
            {valor === null ? (
              <div
                aria-hidden="true"
                className="mt-1.5 h-2.5 rounded border border-dashed border-border"
              />
            ) : (
              <div
                role="img"
                aria-label={`${nome}: ${formatNumberBR(valor)} de ${formatNumberBR(total)}`}
                className="mt-1.5 h-2.5 overflow-hidden rounded bg-[var(--cp-surface-2)]"
              >
                <div
                  className="h-full rounded bg-[var(--cp-primary)]"
                  style={{ width: `${Math.max((100 * valor) / maior, 0.5)}%` }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-text-soft">{rodape}</p>
    </div>
  );
}

export default function CasosPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <CaminhoSistema rota="/eixos/casos" />

      {/* HERO */}
      <header className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-2xl"
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-text-soft">
            Eixo Casos · três desastres, três acervos
          </p>
          <h1 className="mt-2 font-display text-[clamp(1.9em,5vw,2.9em)] font-bold leading-tight tracking-tight">
            Casos
          </h1>
          <p className="mt-3 max-w-3xl text-[1.02em] leading-relaxed text-text-soft">
            Os três casos que o portal acompanha — Brumadinho, Rio Doce e
            Itatiaiuçu —, com o que cada um tem de medido: acórdãos,
            documentos, notícias e publicações do MAB. Onde não há medição, a
            página diz “não medido” em vez de completar com estimativa.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {CASOS.map((caso) => (
              <NextLink
                key={caso.id}
                href={caso.href}
                className="rounded-full border border-border bg-[var(--cp-surface-2)] px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:border-primary hover:text-primary"
              >
                {caso.nome}
              </NextLink>
            ))}
          </div>
          <p className="mt-4 text-xs text-text-soft">
            Medições: jurisprudência em {DATA_JURIS}; notícias em{" "}
            {DATA_NOTICIAS}; MAB em {DATA_MAB}; biblioteca em{" "}
            {DATA_BIBLIOTECA}.
          </p>
        </div>
      </header>

      {/* PANORAMA — prosa escrita no S5-free max; números conferidos contra
          os mesmos arquivos dos cartões. */}
      <section
        aria-labelledby="panorama"
        className="mt-8 rounded-2xl border border-border bg-surface-2 p-5 sm:p-6"
      >
        <h2 id="panorama" className="font-display text-lg font-semibold">
          Panorama dos três casos
        </h2>
        <MarkdownResumo
          markdown={(prosaCasos as { markdown: string }).markdown}
        />
      </section>

      {/* CARTÕES DE TOPO */}
      <section aria-labelledby="numeros" className="mt-10">
        <h2 id="numeros" className="font-display text-xl font-semibold">
          O eixo em números
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-text-soft">
          Cada cartão mede um acervo diferente. Os totais não se somam entre
          si: acórdão, documento, notícia e publicação do MAB são coisas
          distintas.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {INDICADORES.map((indicador) => (
            <div
              key={indicador.rotulo}
              className="rounded-xl border border-border bg-surface p-4 last:col-span-2 sm:last:col-span-1"
            >
              <p className="font-display text-2xl font-bold font-tabular text-primary sm:text-3xl">
                {indicador.valor}
              </p>
              <p className="mt-1 text-sm font-semibold leading-snug">
                {indicador.rotulo}
              </p>
              <p className="mt-1 text-xs text-text-soft">{indicador.nota}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TABELA COMPARATIVA */}
      <section aria-labelledby="comparativo" className="mt-12">
        <h2 id="comparativo" className="font-display text-xl font-semibold">
          Comparação entre os casos
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-text-soft">
          A tabela cruza os quatro acervos medidos. “Não medido” é lacuna
          declarada, não zero. A coluna Análise aponta a leitura de conjunto
          de cada caso, quando ela existe.
        </p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[44rem] border-collapse text-sm">
            <caption className="sr-only">
              Comparação de acórdãos, documentos, notícias, publicações do MAB
              e análise por caso.
            </caption>
            <thead className="bg-[var(--cp-surface-2)] text-left">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Caso
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Acórdãos
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Documentos
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Notícias
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  MAB
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Análise
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Página
                </th>
              </tr>
            </thead>
            <tbody>
              {CASOS.map((caso) => (
                <tr key={caso.id} className="border-t border-border align-top">
                  <th scope="row" className="px-4 py-3 text-left">
                    <NextLink
                      href={caso.href}
                      className="font-semibold hover:text-primary hover:underline"
                    >
                      {caso.nome}
                    </NextLink>
                    <span className="mt-0.5 block text-xs font-normal text-text-soft">
                      {caso.local}
                    </span>
                  </th>
                  <td className="px-4 py-3 text-right font-tabular">
                    {formatNumberBR(caso.acordaos)}
                  </td>
                  <td className="px-4 py-3 text-right font-tabular">
                    {caso.documentos === null ? (
                      <NaoMedido />
                    ) : (
                      formatNumberBR(caso.documentos)
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-tabular">
                    {formatNumberBR(caso.noticias)}
                  </td>
                  <td className="px-4 py-3 text-right font-tabular">
                    {formatNumberBR(caso.mab)}
                  </td>
                  <td className="px-4 py-3">
                    {caso.analise ? (
                      <NextLink
                        href={caso.analise}
                        className="font-semibold text-primary hover:underline"
                      >
                        Sim →
                      </NextLink>
                    ) : (
                      <NaoMedido />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <NextLink
                      href={caso.href}
                      className="font-medium text-primary hover:underline"
                    >
                      {caso.href}
                    </NextLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-2 text-xs text-text-soft">
          Acórdãos: {formatNumberBR(TOTAL_ACORDAOS)} nas três frentes, de{" "}
          {formatNumberBR(TOTAL_JURIS)} casos no acervo. Documentos:{" "}
          {formatNumberBR(TOTAL_DOCUMENTOS)} catalogados; Itatiaiuçu não está na
          biblioteca. Notícias: {formatNumberBR(TOTAL_NOTICIAS)} no radar, sendo{" "}
          {formatNumberBR(SEM_VINCULO_NOTICIAS)} sem vínculo de lugar. MAB:{" "}
          {formatNumberBR(TOTAL_MAB)} publicações, sendo{" "}
          {formatNumberBR(SEM_CASO_MAB)} sem `caso` atribuído no arquivo.
        </p>
      </section>

      {/* BARRAS */}
      <section aria-labelledby="barras" className="mt-12">
        <h2 id="barras" className="font-display text-xl font-semibold">
          O peso de cada caso
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-text-soft">
          A barra é proporcional ao maior valor de cada bloco; o percentual é
          sobre o total medido. São duas réguas diferentes, por isso os blocos
          ficam separados.
        </p>

        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <BlocoBarras
            titulo="Acórdãos por caso"
            descricao={`${formatNumberBR(TOTAL_ACORDAOS)} decisões somadas nas três frentes.`}
            linhas={CASOS.map((caso) => ({
              nome: caso.nome,
              valor: caso.acordaos,
            }))}
            maior={Math.max(...CASOS.map((caso) => caso.acordaos), 1)}
            total={TOTAL_ACORDAOS}
            rodape={`Fonte: acervo de jurisprudência do portal, medido em ${DATA_JURIS}. O traço mínimo de 0,5% mantém visível o caso com ${formatNumberBR(ACORDAOS.itatiaiaucu)} acórdãos; o número ao lado é o valor real.`}
          />

          <BlocoBarras
            titulo="Documentos por caso"
            descricao={`${formatNumberBR(TOTAL_DOCUMENTOS)} documentos catalogados na biblioteca de desastres.`}
            linhas={CASOS.map((caso) => ({
              nome: caso.nome,
              valor: caso.documentos,
            }))}
            maior={Math.max(
              DOCUMENTOS.brumadinho,
              DOCUMENTOS.riodoce,
              1,
            )}
            total={TOTAL_DOCUMENTOS}
            rodape={`Fonte: biblioteca de desastres (ATIs e acervos estaduais), medida em ${DATA_BIBLIOTECA}. O arquivo só classifica Brumadinho e Mariana/Rio Doce; Itatiaiuçu não foi catalogado.`}
          />
        </div>
      </section>

      {/* CARDS POR CASO */}
      <section aria-labelledby="casos" className="mt-12">
        <h2 id="casos" className="font-display text-xl font-semibold">
          Um por um
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-text-soft">
          O que cada hub responde e o que o leitor encontra ao entrar.
        </p>

        <div className="mt-4 grid gap-5 lg:grid-cols-3">
          {CASOS.map((caso) => (
            <article
              key={caso.id}
              className="cp-card-hover flex flex-col rounded-xl border border-border bg-surface p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-text-soft">
                {caso.quando}
              </p>
              <h3 className="mt-1 font-display text-xl font-semibold">
                {caso.nome}
              </h3>
              <p className="mt-1 text-xs text-text-soft">{caso.local}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-text-soft">
                {caso.resumo}
              </p>

              <ul className="mt-4 space-y-1 text-sm">
                <li>
                  <strong className="font-tabular">
                    {formatNumberBR(caso.acordaos)}
                  </strong>{" "}
                  acórdãos
                </li>
                <li>
                  {caso.documentos === null ? (
                    <NaoMedido />
                  ) : (
                    <>
                      <strong className="font-tabular">
                        {formatNumberBR(caso.documentos)}
                      </strong>{" "}
                      documentos
                    </>
                  )}
                </li>
                <li>
                  {caso.noticias === 0 ? (
                    "nenhuma notícia no radar"
                  ) : (
                    <>
                      <strong className="font-tabular">
                        {formatNumberBR(caso.noticias)}
                      </strong>{" "}
                      notícias
                    </>
                  )}
                </li>
                <li>
                  <strong className="font-tabular">
                    {formatNumberBR(caso.mab)}
                  </strong>{" "}
                  {caso.mab === 1
                    ? "publicação do MAB"
                    : "publicações do MAB"}
                </li>
              </ul>

              <NextLink
                href={caso.href}
                className="mt-5 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-ink transition-opacity hover:opacity-90"
              >
                Abrir {caso.nome} →
              </NextLink>
            </article>
          ))}
        </div>
      </section>

      {/* O QUE FALTA */}
      <section
        aria-labelledby="falta"
        className="mt-12 rounded-2xl border border-dashed border-border bg-surface/50 p-6"
      >
        <h2 id="falta" className="font-display text-xl font-semibold">
          O que falta
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-text-soft">
          Lacuna declarada é informação. Esta é a lista do que o eixo ainda não
          consegue responder com número medido.
        </p>

        <ul className="mt-4 space-y-4">
          {LACUNAS.map((lacuna) => (
            <li
              key={lacuna.caso}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <h3 className="font-display text-base font-semibold">
                  {lacuna.caso}
                </h3>
                <span className="rounded-full bg-[var(--cp-surface-2)] px-2.5 py-0.5 text-xs font-semibold text-text-soft">
                  {lacuna.estado}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-text-soft">
                {lacuna.texto}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* FONTES E MÉTODO */}
      <section aria-labelledby="fontes" className="mt-12 border-t border-border pt-8">
        <h2 id="fontes" className="font-display text-xl font-semibold">
          De onde vem o dado
        </h2>
        <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold">Acórdãos</dt>
            <dd className="mt-1 text-text-soft">
              Acervo de jurisprudência do portal (TJMG e TJES), {DATA_JURIS}.
              São {formatNumberBR(TOTAL_JURIS)} casos no arquivo;{" "}
              {formatNumberBR(TOTAL_ACORDAOS)} estão nas frentes Brumadinho,
              Rio Doce e Itatiaiuçu.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Documentos</dt>
            <dd className="mt-1 text-text-soft">
              Biblioteca de desastres — ATIs, CBH-Doce e acervos estaduais —,{" "}
              {DATA_BIBLIOTECA}. {formatNumberBR(DOCUMENTOS.brumadinho)} de
              Brumadinho e {formatNumberBR(DOCUMENTOS.riodoce)} de
              Mariana/Rio Doce. Itatiaiuçu não está no catálogo.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Notícias</dt>
            <dd className="mt-1 text-text-soft">
              Radar de {JANELA_NOTICIAS} dias alimentado por feeds de imprensa,{" "}
              {DATA_NOTICIAS}. São {formatNumberBR(TOTAL_NOTICIAS)} itens;{" "}
              {formatNumberBR(SEM_VINCULO_NOTICIAS)} não têm vínculo de lugar e
              ficam fora da comparação por caso.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Publicações do MAB</dt>
            <dd className="mt-1 text-text-soft">
              Acervo do Movimento dos Atingidos por Barragens, {DATA_MAB}. São{" "}
              {formatNumberBR(TOTAL_MAB)} publicações;{" "}
              {formatNumberBR(SEM_CASO_MAB)} não têm `caso` atribuído no
              arquivo e a de Itatiaiuçu foi reconhecida pelo título.
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-text-soft">
          Notícia não é fato oficial; publicação do MAB não é decisão judicial.
          Os quatro acervos têm naturezas diferentes e não devem ser somados
          como se fossem um só.
        </p>
      </section>

      {/* RODAPÉ */}
      <nav
        aria-label="Outros casos e índice"
        className="mt-12 border-t border-border pt-8"
      >
        <h2 className="font-display text-xl font-semibold">Continuar</h2>
        <p className="mt-1 text-sm text-text-soft">
          Abra o hub de cada caso ou volte ao índice geral do portal.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <BotaoLink href="/paraopeba" principal>
            Brumadinho → /paraopeba
          </BotaoLink>
          <BotaoLink href="/riodoce">Rio Doce → /riodoce</BotaoLink>
          <BotaoLink href="/itatiaiaucu">Itatiaiuçu → /itatiaiaucu</BotaoLink>
          <BotaoLink href="/indice">Índice do portal → /indice</BotaoLink>
        </div>
      </nav>
    </div>
  );
}
