import type { Metadata } from "next";
import NextLink from "next/link";
import CaminhoSistema from "@/app/components/CaminhoSistema";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import casosJson from "@/data/jurisprudencia-casos.json";
import mabJson from "@/data/mab-publicacoes.json";
import radarJson from "@/data/noticias-desastres.json";

/**
 * @file `/itatiaiaucu` — a barragem Serra Azul em um só lugar.
 *
 * O QUE É: porta de entrada do caso de Itatiaiuçu, o menor recorte de
 * desastre do portal. Reúne o que está medido hoje:
 *  - 7 acórdãos do TJMG marcados com a frente `itatiaiaucu` no acervo
 *    (`data/jurisprudencia-casos.json`), todos agravos de instrumento sobre
 *    prescrição no acionamento do PAEBM da barragem Serra Azul;
 *  - 1 publicação do MAB que cita o município (`data/mab-publicacoes.json`);
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
 * A página é server component: o acervo grande é lido no servidor e só as
 * 7 linhas viram HTML (regra 5.1).
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

const RADAR = radarJson as {
  gerado_em: string;
  janela_dias: number;
  itens: RadarItem[];
};
const RADAR_ITATIAIA = RADAR.itens.filter(
  (item) => item.desastre === "itatiaiaucu",
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

export const metadata: Metadata = {
  title: "Itatiaiuçu — Serra Azul, PAEBM e os acórdãos | Controle Popular",
  description:
    "O caso de Itatiaiuçu em um só lugar: os acórdãos do TJMG sobre o plano de emergência da barragem Serra Azul, a publicação do MAB e o que ainda falta medir.",
};

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
              <a
                href={cartao.href}
                {...("externo" in cartao && cartao.externo
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="mt-3 text-xs font-semibold text-primary underline underline-offset-2 hover:text-accent"
              >
                {cartao.linkTexto}
              </a>
              {cartao.chave === "acordo" ? (
                <p className="mt-2 text-xs text-text-soft">
                  [medido — AEDAS]
                </p>
              ) : null}
            </li>
          ))}
        </ul>
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

        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
            <caption className="sr-only">
              Acórdãos do TJMG sobre o PAEBM da barragem Serra Azul, em
              Itatiaiuçu
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
              {CASOS.map((caso) => (
                <tr
                  key={caso.id}
                  className="border-t border-border align-top odd:bg-surface"
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
                    {trechoDaEmenta(caso.ementa)}
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
          — {formatNumberBR(CASOS.length)} registros. O campo{" "}
          <code className="rounded bg-surface-2 px-1 py-0.5">recorrente</code>{" "}
          traz &quot;atingido&quot; nos{" "}
          {formatNumberBR(CASOS.length)}; a ementa descreve a tese da empresa e
          o recurso desprovido. A página mantém o registro como está e não
          afirma quem venceu.
        </p>
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
            Publicação do MAB: API pública do site do movimento, coletada com
            2 s entre requisições.
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
