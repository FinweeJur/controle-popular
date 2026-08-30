import type { Metadata } from "next";
import FooterGlobal from "@/app/components/FooterGlobal";
import Link from "@/lib/paraopeba/link";
import ListaNoticiasVale from "./ListaNoticiasVale";
import dadosNoticiasVale from "@/data/noticias-vale.json";
import { metadataEditavel } from "@/lib/edicoes";
import { formatDateBR } from "@/lib/betim/format";

/**
 * `/paraopeba/noticias-vale` — painel de notícias recentes sobre a Vale.
 *
 * ═══ O QUE ESTA TELA É, E O QUE NÃO É ═══
 *
 * É uma varredura automática de feeds públicos, sem curadoria: ninguém leu,
 * resumiu nem classificou. O que aparece é título, resumo da PRÓPRIA fonte,
 * veículo, data e link — nunca o corpo da matéria, porque reproduzir
 * reportagem inteira é uso de obra de terceiro, e este portal publica
 * material que vira anexo de ofício (mesmo contrato do radar do Paraopeba,
 * `lib/paraopeba/radar.ts`).
 *
 * Também não é fonte de fato: notícia diz que algo foi noticiado, na data em
 * que foi. A ressalva vai no topo, antes da primeira lista.
 *
 * ═══ LIDO NO BUILD, NÃO EM TEMPO DE EXECUÇÃO ═══
 *
 * O site é estático (`output: export`): esta página importa o JSON gravado
 * pelo coletor `apps/web/scripts/coletar-noticias-vale.mts` e o imprime no
 * build. Abrir a tela não pode depender de quatro servidores de notícia
 * estarem de pé naquele instante — e a contrapartida é que o painel só se
 * atualiza quando o site é reconstruído, por isso a data da coleta
 * (`gerado_em`) aparece antes da lista, não depois.
 */
export const metadata: Metadata = metadataEditavel("/paraopeba/noticias-vale", {
  title: "Notícias sobre a Vale — Paraopeba | Controle Popular",
  description:
    "Painel de notícias recentes sobre a Vale, coletadas automaticamente de Google News, Agência Brasil, Radar Mineração e G1 Minas Gerais — com link para a fonte original em cada item.",
});

export default function NoticiasValePage() {
  const noticias = dadosNoticiasVale.noticias;
  const fontesDistintas = new Set(noticias.map((n) => n.fonte)).size;
  const datas = noticias.map((n) => n.data).filter((d): d is string => Boolean(d));
  const de = datas.length ? datas.reduce((a, b) => (a < b ? a : b)).slice(0, 10) : null;
  const ate = datas.length ? datas.reduce((a, b) => (a > b ? a : b)).slice(0, 10) : null;

  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/paraopeba" className="hover:text-primary">
          Paraopeba
        </a>{" "}
        · <span className="text-text">Notícias — Vale</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Notícias — Vale
      </h1>

      {/* A ressalva vem ANTES da primeira lista: esta tela é varredura de
          feeds, não produção jornalística, e quem lê um título com cara de
          manchete não pode concluir que o portal afirma o que a notícia diz. */}
      <div className="mt-4 rounded-2xl border border-alert/40 bg-surface-2 p-5">
        <p className="text-[.92em] text-text-soft">
          Coletadas de fontes públicas de notícias; o portal não produz conteúdo jornalístico.
          Veja sempre a fonte original. O resumo exibido é o que a própria fonte publicou no
          feed — nada foi escrito por aqui.
        </p>
      </div>

      <p className="mt-4 max-w-2xl text-[.95em] text-text-soft">
        Varredura automática, <strong className="text-text">sem curadoria</strong> — diferente do{" "}
        <Link href="/clipping" className="font-medium text-accent hover:underline">
          clipping
        </Link>
        , aqui ninguém leu nem classificou. {noticias.length} itens da coleta de{" "}
        <strong className="text-text">{formatDateBR(dadosNoticiasVale.gerado_em.slice(0, 10))}</strong>
        {de && ate
          ? `, entre ${formatDateBR(de)} e ${formatDateBR(ate)}`
          : ""}, de {fontesDistintas} veículos.
      </p>

      {/* Cartões de topo: os agregados que respondem "quanto é isso?" antes
          de rolar a lista. Contagem vem do dado, não digitada. */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { rotulo: "Notícias nesta coleta", valor: String(noticias.length), nota: "máximo de 60 por rodada" },
          { rotulo: "Veículos diferentes", valor: String(fontesDistintas), nota: "do campo fonte de cada item" },
          {
            rotulo: "Período coberto",
            valor: de && ate ? `${de.slice(8, 10)}/${de.slice(5, 7)} a ${ate.slice(8, 10)}/${ate.slice(5, 7)}` : "—",
            nota: "pela data de publicação",
          },
        ].map((c) => (
          <div key={c.rotulo} className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-[.8em] text-text-soft">{c.rotulo}</p>
            <p className="mt-1 font-tabular text-xl font-bold text-text">{c.valor}</p>
            <p className="mt-1 text-[.78em] text-text-soft">{c.nota}</p>
          </div>
        ))}
      </div>

      <ListaNoticiasVale noticias={noticias} />

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold">De onde vem o dado</h2>
        <p className="mt-2 max-w-3xl text-[.93em] text-text-soft">
          O coletor{" "}
          <code className="rounded bg-surface-2 px-1 py-0.5 text-[.9em]">
            scripts/coletar-noticias-vale.mts
          </code>{" "}
          baixa quatro feeds públicos — busca do Google Notícias por &ldquo;vale brumadinho&rdquo;,
          Agência Brasil, Radar Mineração e G1 Minas Gerais —, filtra por termos do caso (Vale,
          Brumadinho, barragem, reparação, Mariana, mineração), tira repetidos e guarda até 60
          itens em{" "}
          <code className="rounded bg-surface-2 px-1 py-0.5 text-[.9em]">
            data/noticias-vale.json
          </code>
          . A tela mostra o que a coleta trouxe — incluindo quando uma fonte configurada não
          retornou nada naquela rodada.
        </p>
      </section>

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </main>
  );
}
