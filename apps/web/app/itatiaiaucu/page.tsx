import type { Metadata } from "next";
import { metadataEditavel } from "@/lib/edicoes";
import NextLink from "next/link";
import CaminhoSistema from "@/app/components/CaminhoSistema";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import { ACERVO_JURISPRUDENCIA as casosJson } from "@/lib/jurisprudencia-acervo";
import { obterNoticiaPorSlug } from "@/lib/noticias/portal";
import { TODOS_DOCUMENTOS as documentosBiblioteca } from "@/lib/biblioteca/unificada";
import mabJson from "@/data/mab-publicacoes.json";
import radarJson from "@/data/noticias-desastres.json";
import barragensJson from "@/data/barragens-sigbm.json";
import municipiosJson from "@/data/municipios-mg.json";

/**
 * @file `/itatiaiaucu` — a barragem Serra Azul em um só lugar.
 *
 * O QUE É: porta de entrada do caso de Itatiaiuçu, o menor recorte de
 * desastre do portal. Reúne o que está medido hoje:
 *  - 7 acórdãos do TJMG marcados com a frente `itatiaiaucu` no acervo
 *    (`data/jurisprudencia-casos.json`), todos agravos de instrumento sobre
 *    prescrição no acionamento do PAEBM da barragem Serra Azul;
 *  - 1 registro do SIGBM/ANM para a barragem Serra Azul (id 8955), em
 *    ITATIAIUÇU — Emergência Nivel 3 e em descaracterização
 *    (`data/barragens-sigbm.json`, coleta de 18/10/2026);
 *  - 1 publicação do MAB que cita o município (`data/mab-publicacoes.json`);
 *  - 1 item da biblioteca unificada (`data/biblioteca-unificada.json`);
 *  - 1 reportagem do próprio portal sobre descaracterização em MG;
 *  - 0 itens no radar de notícias (`data/noticias-desastres.json`).
 *
 * POR QUE A PÁGINA EXISTE: a frente aparecia só como filtro em
 * `/jurisprudencia`. O leitor que chega pelo nome da cidade não encontrava
 * uma porta com o recorte explicado e o limite dito na cara.
 *
 * ═══ O QUE NÃO SE MISTURA ═══
 *
 * O número de aceite e a indenização média (quase 80% e R$ 210 mil) vêm do
 * modelo de negociação extrajudicial acompanhado pela ATI AEDAS e pelo MAB
 * (`docs/pesquisa/rio-doce/VIAS-INDENIZACAO-INDIVIDUAL.md`, marcado
 * [medido — AEDAS]). Não são resultado dos 7 processos, que discutem
 * prescrição em agravo e não fixam indenização. Cada bloco abaixo diz de
 * onde vem o seu número.
 *
 * ═══ HONESTIDADE DO RECORTE ═══
 *
 * 6 dos 7 acórdãos são de 2026 e 1 é de 2025 — a contagem por ano é
 * calculada do arquivo, nunca digitada. O campo `recorrente` do acervo traz
 * "atingido" nos 7 registros, mas as ementas descrevem a alegação de
 * prescrição como da empresa e o "recurso desprovido"; a página não
 * reescreve a classificação nem afirma quem venceu.
 *
 * As ementas também são medidas, não contadas à mão: 6 dos 7 registros têm
 * texto idêntico (mesma decisão) e 1 tem ementa própria. A tabela agrupa as
 * linhas por texto e mostra o trecho uma vez por grupo, sem esconder
 * processo. O processo 0596176-39.2026.8.13 traz `valor = 130000` no acervo,
 * mas a ementa não cita valor; o campo fica em conferência e não vira
 * condenação na tela.
 *
 * A página é server component: o acervo grande é lido no servidor e só as
 * 7 linhas viram HTML (regra 5.1). Os JSONs de barragens, biblioteca e
 * municípios também são lidos no servidor.
 */

interface CasoItatiaia {
  id: string;
  processo: string;
  ano: string;
  resultado: string;
  recorrente: string;
  ementa: string;
  link: string;
  frente: string;
  classe: string;
  comarca: string;
}

interface MabItem {
  id: string;
  titulo: string;
  resumo: string;
  data: string;
  link: string;
  tipo: string;
}

interface RadarItem {
  desastre: string | null;
}

const CASOS: CasoItatiaia[] = (
  casosJson as { casos: CasoItatiaia[] }
).casos
  .filter((caso) => caso.frente === "itatiaiaucu")
  .sort(
    (a, b) => b.ano.localeCompare(a.ano) || a.processo.localeCompare(b.processo),
  );

const MAB_ITATIAIA: MabItem[] = (mabJson as { itens: MabItem[] }).itens.filter(
  (item) =>
    item.titulo.toLowerCase().includes("itatiaiuçu") ||
    item.titulo.toLowerCase().includes("itatiaiucu"),
);

const NOTA_MAB = MAB_ITATIAIA[0];

const RADAR = radarJson as {
  gerado_em: string;
  janela_dias: number;
  itens: RadarItem[];
};
const RADAR_ITATIAIA = RADAR.itens.filter(
  (item) => item.desastre === "itatiaiaucu",
);

interface BarragemSigbmRegistro {
  id: string;
  nome: string;
  empreendedor: string;
  uf: string;
  municipio: string;
  situacao: string;
  nivel_emergencia: string;
  categoria_risco: string;
  dano_potencial: string;
  fase_descaracterizacao: string | null;
  data_finalizacao_dce: string | null;
}

const SIGBM = barragensJson as {
  fonte: string;
  url_fonte: string;
  ultima_atualizacao: string | null;
  coletado_em: string;
  total: number;
  barragens: BarragemSigbmRegistro[];
};

// A barragem do caso é filtrada pelo id E pelo município. O arquivo tem
// outras quatro estruturas com "Serra Azul" no nome — todas em Mateus Leme,
// de Usiminas e Minerita — que não entram nesta página.
const SERRA_AZUL = SIGBM.barragens.find(
  (barragem) => barragem.id === "8955" && barragem.municipio === "ITATIAIUÇU",
);

// O arquivo grava "Alta"/"Média"/"Baixa" sem concordância: "dano potencial
// alta" ficaria errado. Estes mapas dão a forma certa para cada campo.
const RISCO_TEXTO: Record<string, string> = {
  Alta: "alta",
  Média: "média",
  Baixa: "baixa",
};
const DANO_TEXTO: Record<string, string> = {
  Alta: "alto",
  Média: "médio",
  Baixa: "baixo",
};

const DOC_LUXEMBURGO = documentosBiblioteca.find(
  (documento) => documento.id === "lu-arcelormittal-itatiaiucu-038",
);

interface MunicipioMg {
  id: number;
  nome: string;
  microrregiao: string;
  mesorregiao: string;
  regiao_imediata: string;
  regiao_intermediaria: string;
  uf: string;
}

const MUNICIPIO = (municipiosJson as MunicipioMg[]).find(
  (municipio) => municipio.id === 3133709,
);

const POST_BARRAGENS = obterNoticiaPorSlug(
  "barragens-descaracterizacao-prazos-mg",
);

// Medição da AEDAS, não do acervo do portal. O texto de origem diz "quase
// 80%": a página repete o "quase" para não transformar arredondamento em
// número exato.
const ACEITE_TEXTO = "quase 80%";
const INDENIZACAO_MEDIA = 210_000;
const AEDAS_URL =
  "https://aedasmg.org/reparacao-em-numeros-por-onde-andam-os-resultados-da-luta-das-comunidades-atingidas-de-itatiaiucu/";

const ANOS = CASOS.reduce<Record<string, number>>((conta, caso) => {
  conta[caso.ano] = (conta[caso.ano] ?? 0) + 1;
  return conta;
}, {});

const ANOS_TEXTO = Object.entries(ANOS)
  .sort(([a], [b]) => b.localeCompare(a))
  .map(([ano, total]) => `${total} de ${ano}`)
  .join(", ");

const RADAR_DATA = RADAR.gerado_em?.slice(0, 10) ?? "";

interface GrupoEmenta {
  chave: string;
  ementa: string;
  casos: CasoItatiaia[];
}

// Agrupa pelo texto EXATO da ementa, do maior grupo para o menor. A chave
// (A, B…) é só rótulo de tela; o que define o grupo é a igualdade do texto.
const GRUPOS_EMENTA: GrupoEmenta[] = (() => {
  const porTexto = new Map<string, CasoItatiaia[]>();
  for (const caso of CASOS) {
    const lista = porTexto.get(caso.ementa);
    if (lista) lista.push(caso);
    else porTexto.set(caso.ementa, [caso]);
  }
  return [...porTexto.values()]
    .sort(
      (a, b) =>
        b.length - a.length || a[0].processo.localeCompare(b[0].processo),
    )
    .map((casos, indice) => ({
      chave: String.fromCharCode(65 + indice),
      ementa: casos[0].ementa,
      casos,
    }));
})();

// A tabela mostra os grupos em sequência: todas as linhas de um grupo juntas,
// com o trecho uma vez. Nenhum processo é retirado.
const CASOS_TABELA = GRUPOS_EMENTA.flatMap((grupo) =>
  grupo.casos.map((caso) => ({
    caso,
    grupo,
    primeiroDoGrupo: grupo.casos[0].processo === caso.processo,
  })),
);

const TOTAL_MESMA_DECISAO = GRUPOS_EMENTA.filter(
  (grupo) => grupo.casos.length > 1,
).reduce((soma, grupo) => soma + grupo.casos.length, 0);

const PROCESSOS_EMENTA_PROPRIA = GRUPOS_EMENTA.filter(
  (grupo) => grupo.casos.length === 1,
).flatMap((grupo) => grupo.casos.map((caso) => caso.processo));

export const metadata: Metadata = metadataEditavel("/itatiaiaucu", {
  title: "Itatiaiuçu — Serra Azul, PAEBM e os acórdãos | Controle Popular",
  description:
    "O caso de Itatiaiuçu em um só lugar: a situação da barragem Serra Azul no SIGBM, os acórdãos do TJMG sobre o plano de emergência, a publicação do MAB e o que ainda falta medir.",
});

/** Trecho da ementa em até 220 caracteres, cortado em palavra inteira. */
function trechoDaEmenta(texto: string, limite = 220): string {
  const limpo = texto
    .replace(/^EMENTA:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (limpo.length <= limite) return limpo;
  const corte = limpo.slice(0, limite);
  const ultimoEspaco = corte.lastIndexOf(" ");
  const base = ultimoEspaco > 120 ? corte.slice(0, ultimoEspaco) : corte;
  return `${base}…`;
}

function formatarValor(valor: number): string {
  return `R$ ${formatNumberBR(valor / 1000)} mil`;
}

export default function ItatiaiacuPage() {
  // ——— os quatro cartões do topo ———
  const cartoes = [
    {
      chave: "acordaos",
      valor: formatNumberBR(CASOS.length),
      rotulo: "acórdãos do TJMG",
      texto: `${ANOS_TEXTO}, todos Agravo de Instrumento-Cv da comarca de Itaúna, sobre prescrição no acionamento do PAEBM da Serra Azul.`,
      href: "/jurisprudencia?frente=itatiaiaucu#lista",
      linkTexto: "Ver os acórdãos →",
    },
    {
      chave: "mab",
      valor: formatNumberBR(MAB_ITATIAIA.length),
      rotulo: MAB_ITATIAIA.length === 1 ? "publicação do MAB" : "publicações do MAB",
      texto:
        MAB_ITATIAIA.length === 1
          ? `Nota oficial de ${formatDateBR(MAB_ITATIAIA[0]?.data)} sobre o acordo de reparação individual da ArcelorMittal em Itatiaiuçu.`
          : "Nenhuma publicação do MAB cita o município no acervo coletado.",
      href: MAB_ITATIAIA[0]?.link ?? "/paraopeba/mab",
      externo: Boolean(MAB_ITATIAIA[0]),
      linkTexto: MAB_ITATIAIA.length === 1 ? "Ler no MAB ↗" : "Ver o acervo do MAB →",
    },
    {
      chave: "radar",
      valor: formatNumberBR(RADAR_ITATIAIA.length),
      rotulo: "notícias no radar",
      texto: `Nenhum item sobre Itatiaiuçu na janela de ${RADAR.janela_dias} dias do radar de desastres${RADAR_DATA ? ` (última coleta em ${formatDateBR(RADAR_DATA)})` : ""}.`,
      href: "/noticias",
      linkTexto: "Ver o radar →",
    },
    {
      chave: "acordo",
      valor: ACEITE_TEXTO,
      rotulo: "de aceite no acordo extrajudicial",
      texto: `Indenização média de ${formatarValor(INDENIZACAO_MEDIA)} no modelo conduzido com o MAB e a ATI AEDAS, em outro recorte — não o dos 7 processos.`,
      href: AEDAS_URL,
      externo: true,
      linkTexto: "Ver a medição da AEDAS ↗",
    },
  ] as const;

  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8"
    >
      <CaminhoSistema rota="/itatiaiaucu" />

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Itatiaiuçu
      </h1>
      <p className="mt-2 max-w-3xl text-[1.02em] text-text-soft">
        O caso menor no mapa dos desastres, com o recorte dito na cara: são{" "}
        <strong>{formatNumberBR(CASOS.length)} acórdãos</strong> do TJMG
        ({ANOS_TEXTO}) sobre o acionamento do plano de emergência (PAEBM) da
        barragem Serra Azul, da ArcelorMittal, e a disputa sobre prescrição e
        consumidor por equiparação. A reparação extrajudicial das comunidades
        atingidas é outro recorte, com outra fonte.
      </p>

      <section aria-labelledby="numeros" className="mt-8">
        <h2 id="numeros" className="sr-only">
          Números do caso
        </h2>
        <ul className="grid list-none gap-4 sm:grid-cols-2">
          {cartoes.map((cartao) => (
            <li
              key={cartao.chave}
              className="flex flex-col rounded-lg border border-border bg-surface p-5"
            >
              <p className="font-display text-3xl font-bold tracking-tight">
                {cartao.valor}
              </p>
              <p className="mt-1 text-sm font-semibold text-primary">
                {cartao.rotulo}
              </p>
              <p className="mt-2 flex-1 text-sm text-text-soft">{cartao.texto}</p>
              {"externo" in cartao && cartao.externo ? (
                <a
                  href={cartao.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 text-xs font-semibold text-primary underline underline-offset-2 hover:text-accent"
                >
                  {cartao.linkTexto}
                </a>
              ) : (
                <NextLink
                  href={cartao.href}
                  className="mt-3 text-xs font-semibold text-primary underline underline-offset-2 hover:text-accent"
                >
                  {cartao.linkTexto}
                </NextLink>
              )}
              {cartao.chave === "acordo" ? (
                <p className="mt-2 text-xs text-text-soft">
                  [medido — AEDAS]
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="barragem" className="mt-12">
        <h2 id="barragem" className="font-display text-xl font-semibold">
          A barragem hoje
        </h2>
        {SERRA_AZUL ? (
          <>
            <p className="mt-2 max-w-3xl text-sm text-text-soft">
              O registro do SIGBM para a estrutura que dá nome ao caso:{" "}
              <strong>{SERRA_AZUL.nivel_emergencia}</strong>, categoria de risco{" "}
              {RISCO_TEXTO[SERRA_AZUL.categoria_risco] ?? SERRA_AZUL.categoria_risco.toLowerCase()} e
              dano potencial{" "}
              {DANO_TEXTO[SERRA_AZUL.dano_potencial] ?? SERRA_AZUL.dano_potencial.toLowerCase()},
              em descaracterização na fase{" "}
              {SERRA_AZUL.fase_descaracterizacao?.toLowerCase() ?? "não informada"}.
              A data de finalização registrada é{" "}
              {formatDateBR(SERRA_AZUL.data_finalizacao_dce)}.
            </p>

            <div className="mt-4 rounded-lg border border-border bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold">
                    {SERRA_AZUL.nome}
                  </p>
                  <p className="mt-1 text-sm text-text-soft">
                    {SERRA_AZUL.empreendedor} · {SERRA_AZUL.municipio}/
                    {SERRA_AZUL.uf}
                  </p>
                </div>
                <span className="rounded-full bg-alert/15 px-3 py-1 text-xs font-semibold text-alert">
                  {SERRA_AZUL.nivel_emergencia}
                </span>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold tracking-wide text-text-soft uppercase">
                    Categoria de risco
                  </dt>
                  <dd className="mt-0.5 font-semibold">
                    {SERRA_AZUL.categoria_risco}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold tracking-wide text-text-soft uppercase">
                    Dano potencial
                  </dt>
                  <dd className="mt-0.5 font-semibold">
                    {SERRA_AZUL.dano_potencial}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold tracking-wide text-text-soft uppercase">
                    Situação
                  </dt>
                  <dd className="mt-0.5 font-semibold">
                    {SERRA_AZUL.situacao}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold tracking-wide text-text-soft uppercase">
                    Fase da descaracterização
                  </dt>
                  <dd className="mt-0.5 font-semibold">
                    {SERRA_AZUL.fase_descaracterizacao ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold tracking-wide text-text-soft uppercase">
                    Finalização da descaracterização
                  </dt>
                  <dd className="mt-0.5 font-semibold">
                    {formatDateBR(SERRA_AZUL.data_finalizacao_dce)}
                  </dd>
                </div>
              </dl>
            </div>

            <p className="mt-3 text-xs text-text-soft">
              Fonte: {SIGBM.fonte}; coleta de {formatDateBR(SIGBM.coletado_em)}.
              A base do portal está em{" "}
              <NextLink
                href="/ambiental/barragens"
                className="font-medium text-accent hover:underline"
              >
                /ambiental/barragens
              </NextLink>
              . As outras estruturas com &quot;Serra Azul&quot; no nome, no
              mesmo arquivo, ficam em Mateus Leme e são de Usiminas e Minerita —
              não entram neste bloco.
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-text-soft">
            O registro da barragem Serra Azul não está no arquivo desta coleta
            do SIGBM.
          </p>
        )}
      </section>

      <section aria-labelledby="acordaos" className="mt-12" id="acordaos">
        <h2 id="acordaos" className="font-display text-xl font-semibold">
          O que os {formatNumberBR(CASOS.length)} acórdãos dizem
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-text-soft">
          Todos são agravos de instrumento da comarca de Itaúna com o mesmo
          núcleo: a empresa alega prescrição, e o TJMG reconhece o atingido como
          consumidor por equiparação (art. 17 do CDC), aplica o prazo
          quinquenal (art. 27) e trata o TAC como marco interruptivo (art. 202,
          VI, do Código Civil). O Tema 1.280 do STJ, de Brumadinho, é afastado
          por se tratar de evento distinto. Em todas as ementas o recurso
          aparece como <strong>desprovido</strong>.
        </p>
        <p className="mt-2 text-xs text-text-soft">
          Na tabela, as linhas estão agrupadas pela ementa — não por ano.
        </p>

        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
            <caption className="sr-only">
              Acórdãos do TJMG sobre o PAEBM da barragem Serra Azul, em
              Itatiaiuçu, agrupados pela ementa
            </caption>
            <thead className="bg-surface-2 text-xs uppercase tracking-wide text-text-soft">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Processo
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Ano
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Resultado
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Trecho da ementa
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Íntegra
                </th>
              </tr>
            </thead>
            <tbody>
              {CASOS_TABELA.map(({ caso, grupo, primeiroDoGrupo }) => (
                <tr
                  key={caso.id}
                  id={primeiroDoGrupo ? `ementa-grupo-${grupo.chave}` : undefined}
                  className={`scroll-mt-24 border-t border-border border-l-2 align-top odd:bg-surface ${
                    grupo.casos.length > 1
                      ? "border-l-primary/40"
                      : "border-l-accent/50"
                  }`}
                >
                  <th scope="row" className="px-3 py-3 font-normal">
                    <NextLink
                      href={`/jurisprudencia?q=${encodeURIComponent(caso.processo)}#lista`}
                      className="font-mono text-xs font-semibold text-primary underline underline-offset-2 hover:text-accent"
                    >
                      {caso.processo}
                    </NextLink>
                  </th>
                  <td className="px-3 py-3 text-text-soft">{caso.ano}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-text">
                      {caso.resultado}
                    </span>
                  </td>
                  <td className="max-w-md px-3 py-3 text-text-soft">
                    {primeiroDoGrupo ? (
                      <>
                        <span className="inline-block rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-text">
                          {grupo.casos.length > 1
                            ? `Grupo ${grupo.chave} · ${formatNumberBR(grupo.casos.length)} acórdãos`
                            : "Ementa própria"}
                        </span>
                        <span className="mt-1 block">
                          {trechoDaEmenta(grupo.ementa)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="inline-block rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-text">
                          Mesma decisão · grupo {grupo.chave}
                        </span>
                        <span className="mt-1 block">
                          Trecho igual ao do processo{" "}
                          <NextLink
                            href={`#ementa-grupo-${grupo.chave}`}
                            className="font-mono text-xs font-semibold text-primary underline underline-offset-2 hover:text-accent"
                          >
                            {grupo.casos[0].processo}
                          </NextLink>
                          .
                        </span>
                      </>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <a
                      href={caso.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-primary underline underline-offset-2 hover:text-accent"
                    >
                      TJMG ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-text-soft">
          Fonte: acervo de jurisprudência do portal, frente{" "}
          <code className="rounded bg-surface-2 px-1 py-0.5">itatiaiaucu</code>{" "}
          — {formatNumberBR(CASOS.length)} registros.{" "}
          {formatNumberBR(TOTAL_MESMA_DECISAO)} dos{" "}
          {formatNumberBR(CASOS.length)} têm ementa idêntica: a tabela mostra o
          trecho uma vez por grupo e marca as repetidas como &quot;mesma
          decisão&quot;.{" "}
          {PROCESSOS_EMENTA_PROPRIA.length > 0 ? (
            <>
              O processo{" "}
              <span className="font-mono">
                {PROCESSOS_EMENTA_PROPRIA.join(", ")}
              </span>{" "}
              tem texto diferente.{" "}
            </>
          ) : null}
          Nenhum processo foi omitido. O campo{" "}
          <code className="rounded bg-surface-2 px-1 py-0.5">recorrente</code>{" "}
          traz &quot;atingido&quot; nos{" "}
          {formatNumberBR(CASOS.length)}; a ementa descreve a tese da empresa e
          o recurso desprovido. A página mantém o registro como está e não
          afirma quem venceu.
        </p>
      </section>

      <section aria-labelledby="reparacao" className="mt-12">
        <h2 id="reparacao" className="font-display text-xl font-semibold">
          Reparação extrajudicial (ATI AEDAS)
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-text-soft">
          As comunidades atingidas de Itatiaiuçu tiveram um caminho de
          negociação individual acompanhado pela ATI AEDAS e pelo MAB. É outro
          recorte: não é o dos {formatNumberBR(CASOS.length)} acórdãos acima e
          não serve para explicar o resultado deles.
        </p>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-4">
            <dt className="text-xs font-semibold tracking-wide text-text-soft uppercase">
              Aceite no modelo
            </dt>
            <dd className="mt-1 font-display text-2xl font-bold">
              {ACEITE_TEXTO}
            </dd>
            <dd className="mt-1 text-xs text-text-soft">
              O texto de origem diz &quot;quase 80%&quot;; a página não
              arredonda para 80%.
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <dt className="text-xs font-semibold tracking-wide text-text-soft uppercase">
              Indenização média
            </dt>
            <dd className="mt-1 font-display text-2xl font-bold">
              {formatarValor(INDENIZACAO_MEDIA)}
            </dd>
            <dd className="mt-1 text-xs text-text-soft">
              Média por acordo no modelo extrajudicial acompanhado pela ATI
              AEDAS e pelo MAB.
            </dd>
          </div>
        </dl>

        <p className="mt-3 max-w-3xl text-sm text-text-soft">
          O levantamento interno do portal, com última medição em 08/11/2026,
          traz esses dois números para Itatiaiuçu e não informa denominador,
          data de corte, total de pessoas ou faixa de valores. Os demais
          números do mesmo documento são do Rio Doce e não são transferidos
          para cá.
        </p>
        <p className="mt-2 text-xs text-text-soft">
          Fonte:{" "}
          <code className="rounded bg-surface-2 px-1 py-0.5">
            docs/pesquisa/rio-doce/VIAS-INDENIZACAO-INDIVIDUAL.md
          </code>
          , seção &quot;O que travou e o que mudou&quot; [medido — AEDAS];{" "}
          <a
            href={AEDAS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            página da ATI AEDAS ↗
          </a>
          .
        </p>
      </section>

      <section aria-labelledby="publicacoes" className="mt-12">
        <h2 id="publicacoes" className="font-display text-xl font-semibold">
          Publicações e documentos
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-text-soft">
          Uma nota do movimento, um registro da biblioteca do portal e uma
          reportagem do próprio portal. Cada item traz a data que existe no
          arquivo e o link da fonte.
        </p>

        <ul className="mt-4 list-none divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {NOTA_MAB ? (
            <li className="p-4">
              <p className="text-xs font-semibold tracking-wide text-text-soft uppercase">
                {formatDateBR(NOTA_MAB.data)} · Nota oficial do MAB
              </p>
              <p className="mt-1 text-sm font-semibold">{NOTA_MAB.titulo}</p>
              <p className="mt-1 text-sm text-text-soft">{NOTA_MAB.resumo}</p>
              <a
                href={NOTA_MAB.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-semibold text-primary underline underline-offset-2 hover:text-accent"
              >
                Ler no MAB ↗
              </a>
            </li>
          ) : null}

          {DOC_LUXEMBURGO ? (
            <li className="p-4">
              <p className="text-xs font-semibold tracking-wide text-text-soft uppercase">
                {DOC_LUXEMBURGO.ano} · Biblioteca do portal ·{" "}
                {DOC_LUXEMBURGO.tipo}
              </p>
              <p className="mt-1 text-sm font-semibold">
                {DOC_LUXEMBURGO.titulo}
              </p>
              <p className="mt-1 text-sm text-text-soft">
                {DOC_LUXEMBURGO.tipoRotulo}. O item está no acervo do portal; o
                ano é o único recorte de data que o registro traz.
              </p>
              {DOC_LUXEMBURGO.urlOficial ? (
                <a
                  href={DOC_LUXEMBURGO.urlOficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs font-semibold text-primary underline underline-offset-2 hover:text-accent"
                >
                  Portal do RCS Luxembourg ↗
                </a>
              ) : (
                <p className="mt-2 text-xs text-text-soft">
                  Sem link no item; disponível no acervo do portal.
                </p>
              )}
            </li>
          ) : null}

          {POST_BARRAGENS ? (
            <li className="p-4">
              <p className="text-xs font-semibold tracking-wide text-text-soft uppercase">
                {formatDateBR(POST_BARRAGENS.publicadoEm)} · Controle Popular
              </p>
              <p className="mt-1 text-sm font-semibold">
                {POST_BARRAGENS.titulo}
              </p>
              <p className="mt-1 text-sm text-text-soft">
                {POST_BARRAGENS.subtitulo}
              </p>
              <NextLink
                href={`/noticias/${POST_BARRAGENS.slug}`}
                className="mt-2 inline-block text-xs font-semibold text-primary underline underline-offset-2 hover:text-accent"
              >
                Ler a reportagem →
              </NextLink>
            </li>
          ) : null}
        </ul>
      </section>

      <section
        aria-labelledby="limites"
        className="mt-12 rounded-lg border border-dashed border-border bg-surface/50 p-5"
      >
        <h2 id="limites" className="font-display text-xl font-semibold">
          O que a página não responde
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-soft">
          <li>
            <strong>Não há acórdão de mérito.</strong> Os{" "}
            {formatNumberBR(CASOS.length)} julgados decidem agravo de
            instrumento sobre prescrição. Eles não dizem se a indenização é
            devida, nem qual o valor.
          </li>
          <li>
            <strong>Um valor está em conferência.</strong> O registro do
            processo{" "}
            <span className="font-mono text-xs">0596176-39.2026.8.13</span> no
            acervo do portal traz R$ 130 mil no campo{" "}
            <code className="rounded bg-surface-2 px-1 py-0.5">valor</code>, mas
            a ementa não cita valor nem condenação. O campo está em conferência
            e não é exibido como indenização devida.
          </li>
          <li>
            <strong>O radar está vazio.</strong> Zero itens de Itatiaiuçu na
            janela de {RADAR.janela_dias} dias. É lacuna da coleta, não prova
            de que nada aconteceu.
          </li>
          <li>
            <strong>O portal não fez análise própria.</strong> A leitura acima
            é descritiva: a tese é do TJMG, e cada ementa tem link para a
            íntegra.
          </li>
          <li>
            <strong>Os {ACEITE_TEXTO} não são destes processos.</strong> O
            aceite e a indenização média de {formatarValor(INDENIZACAO_MEDIA)}{" "}
            vêm do modelo extrajudicial acompanhado pela ATI AEDAS e pelo MAB —
            outro caminho, outra fonte.
          </li>
        </ul>
      </section>

      <section
        aria-labelledby="localizacao"
        className="mt-10 rounded-lg border border-border bg-surface p-5"
      >
        <h2 id="localizacao" className="font-display text-lg font-semibold">
          Onde fica
        </h2>
        {MUNICIPIO ? (
          <>
            <p className="mt-2 text-sm text-text-soft">
              {MUNICIPIO.nome} fica na microrregião de{" "}
              {MUNICIPIO.microrregiao} e na mesorregião{" "}
              {MUNICIPIO.mesorregiao}. A região imediata e a intermediária são{" "}
              {MUNICIPIO.regiao_imediata}.
            </p>
            <p className="mt-1 text-xs text-text-soft">
              Fonte: IBGE — municípios de Minas Gerais (
              <code className="rounded bg-surface-2 px-1 py-0.5">
                data/municipios-mg.json
              </code>
              ), código {MUNICIPIO.id}; o arquivo não traz data de coleta.
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-text-soft">
            O registro do município não está no arquivo desta coleta.
          </p>
        )}
      </section>

      <nav aria-label="Outras páginas do caso" className="mt-10">
        <ul className="flex list-none flex-wrap gap-3">
          {[
            {
              href: "/jurisprudencia?frente=itatiaiaucu#lista",
              rotulo: "Acórdãos da frente",
            },
            { href: "/paraopeba/mab", rotulo: "Acervo do MAB" },
            { href: "/eixos/casos", rotulo: "Casos dos desastres" },
            { href: "/indice", rotulo: "Índice do portal" },
          ].map((botao) => (
            <li key={botao.href}>
              <NextLink
                href={botao.href}
                className="inline-block rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-primary hover:border-primary/50"
              >
                {botao.rotulo} →
              </NextLink>
            </li>
          ))}
        </ul>
      </nav>

      <section aria-labelledby="fontes" className="mt-12 border-t border-border pt-8">
        <h2 id="fontes" className="font-display text-xl font-semibold">
          De onde vem o dado
        </h2>
        <ul className="mt-2 max-w-3xl list-disc space-y-1 pl-5 text-sm text-text-soft">
          <li>
            Acórdãos: acervo do portal, coletados do{" "}
            <a
              href="https://www5.tjmg.jus.br/jurisprudencia/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent hover:underline"
            >
              TJMG ↗
            </a>
            ; cada linha aponta a íntegra.
          </li>
          <li>
            Barragem: ANM — SIGBM (dados abertos), arquivo{" "}
            <code className="rounded bg-surface-2 px-1 py-0.5">
              Barragens.csv
            </code>{" "}
            coletado em {formatDateBR(SIGBM.coletado_em)};{" "}
            <a
              href="https://app.anm.gov.br/sigbm"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent hover:underline"
            >
              SIGBM ↗
            </a>
            . A base do portal está em{" "}
            <NextLink
              href="/ambiental/barragens"
              className="font-medium text-accent hover:underline"
            >
              /ambiental/barragens
            </NextLink>
            .
          </li>
          <li>
            Publicação do MAB: API pública do site do movimento, coletada com
            2 s entre requisições.
          </li>
          <li>
            Biblioteca: acervo unificado do portal (
            <code className="rounded bg-surface-2 px-1 py-0.5">
              data/biblioteca-unificada.json
            </code>
            ), item{" "}
            <code className="rounded bg-surface-2 px-1 py-0.5">
              lu-arcelormittal-itatiaiucu-038
            </code>
            ; o link do item aponta para o portal do RCS Luxembourg.
          </li>
          <li>
            Reportagem:{" "}
            <NextLink
              href="/noticias/barragens-descaracterizacao-prazos-mg"
              className="font-medium text-accent hover:underline"
            >
              Barragens a montante em Minas →
            </NextLink>
            , publicada no blog do portal.
          </li>
          <li>
            Localização: IBGE — municípios de Minas Gerais (
            <code className="rounded bg-surface-2 px-1 py-0.5">
              data/municipios-mg.json
            </code>
            ), código 3133709.
          </li>
          <li>
            Aceite e indenização média:{" "}
            <a
              href={AEDAS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent hover:underline"
            >
              ATI AEDAS — reparação em números em Itatiaiuçu ↗
            </a>{" "}
            [medido — AEDAS].
          </li>
        </ul>
      </section>
    </main>
  );
}
