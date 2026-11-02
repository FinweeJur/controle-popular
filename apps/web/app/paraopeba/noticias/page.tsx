import type { Metadata } from "next";
import NextLink from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import { PainelFacetas } from "@/app/components/PainelFacetas";
import { carregarRadarParaopeba, type RadarParaopeba } from "@/lib/paraopeba/radar";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import { metadataEditavel } from "@/lib/edicoes";
import dadosNoticiasVale from "@/data/noticias-vale.json";
import ListaNoticiasVale from "../noticias-vale/ListaNoticiasVale";
import { FONTES_NOTICIA, fontePorSlug, hrefNoticia } from "@/lib/paraopeba/noticias";

/**
 * @file `/paraopeba/noticias` — painel das duas varreduras de imprensa da
 * frente (bacia do Paraopeba e Vale S.A.).
 *
 * O QUE MUDOU (02/11/2026): eram duas rotas irmãs — `/paraopeba/noticias`
 * (radar da bacia) e `/paraopeba/noticias-vale` (radar da companhia) — com a
 * mesma pergunta e fontes diferentes. Agora é uma URL canônica com `?fonte=`,
 * e cada recorte mantém o próprio coletor, a própria ressalva e a própria
 * contagem. A rota antiga virou ponte para o recorte certo.
 *
 * POR QUE A FACETA É LINK: o estado fica na URL, a página renderiza no
 * servidor e a casca não desmonta (AGENTS §5.1 e §5.13). Cada recorte é
 * compartilhável e funciona sem JavaScript.
 *
 * NADA FOI FUNDIDO EM UMA LISTA SÓ, de propósito: o radar da bacia filtra por
 * termos do caso e o da Vale filtra quatro feeds pela companhia. Somar os
 * arrays faria um item de Brumadinho aparecer como "notícia da Vale", e a
 * procedência é parte do dado.
 *
 * O QUE CONTINUA FORA: o `/paraopeba/clipping` é acervo histórico com
 * curadoria e resumo escrito por quem o montou — não é varredura automática.
 * A página linka os dois, mas não os mistura.
 */

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Metadata ESTÁTICA: no alvo `output: 'export'` a página é gerada sem
 * `searchParams`, e metadata dinâmica ali seria promessa que o alvo não
 * cumpre. O canonical do recorte entra como `<link>` no corpo.
 */
export const metadata: Metadata = metadataEditavel("/paraopeba/noticias", {
  title: "Notícias — bacia do Paraopeba e Vale | Controle Popular",
  description:
    "Duas varreduras automáticas da frente Paraopeba: notícias, decisões e atos sobre a bacia e a reparação de Brumadinho, e notícias recentes sobre a Vale S.A. — cada recorte com o próprio coletor e a própria ressalva.",
});

export default async function NoticiasParaopebaPage({ searchParams }: Props) {
  const params = await searchParams;
  const fonte = fontePorSlug(params.fonte);
  const radar = carregarRadarParaopeba();
  const noticiasVale = dadosNoticiasVale.noticias;

  const facetas = FONTES_NOTICIA.map((item) => ({
    slug: item.slug,
    rotulo: item.rotulo,
    n: item.slug === "bacia" ? radar.itens.length : noticiasVale.length,
  }));
  const total = facetas.reduce((soma, faceta) => soma + faceta.n, 0);

  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <link rel="canonical" href={hrefNoticia(fonte.slug)} />
      <nav className="mb-4 text-[.82em] text-text-soft">
        <NextLink href="/paraopeba" className="hover:text-primary">
          Paraopeba
        </NextLink>{" "}
        · <span className="text-text">Notícias</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        O que saiu na imprensa
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Duas varreduras automáticas, sem curadoria e sem resumo escrito pelo portal. O recorte da
        bacia acompanha o caso e a reparação; o da Vale acompanha a companhia. Escolha um e a lista,
        os cartões e a data da coleta abaixo mudam juntos.
      </p>

      <div className="mt-8 space-y-8">
        <PainelFacetas
          facetas={facetas}
          atual={fonte.slug}
          total={total}
          hrefDe={(slug) => hrefNoticia(slug)}
          titulo="Recorte por varredura"
          ariaLabel="Recorte das notícias do Paraopeba"
          nota={`N = itens na última coleta de cada varredura. Ao todo, ${formatNumberBR(total)} itens nos dois recortes.`}
        />

        {fonte.slug === "bacia" ? <ConteudoBacia radar={radar} /> : null}
        {fonte.slug === "vale" ? <ConteudoVale /> : null}

        <section aria-labelledby="titulo-irmaos" className="space-y-3 border-t border-border pt-8">
          <h2 id="titulo-irmaos" className="font-display text-lg font-semibold">
            Páginas irmãs desta frente
          </h2>
          <ul className="flex flex-wrap gap-2 text-sm">
            <li>
              <NextLink className="underline" href="/paraopeba/clipping">
                Clipping — acervo com curadoria
              </NextLink>
            </li>
            <li>
              <NextLink className="underline" href="/paraopeba/linha-do-tempo">
                Linha do tempo da reparação
              </NextLink>
            </li>
            <li>
              <NextLink className="underline" href={hrefNoticia("bacia")}>
                Radar da bacia
              </NextLink>
            </li>
            <li>
              <NextLink className="underline" href={hrefNoticia("vale")}>
                Radar da Vale
              </NextLink>
            </li>
            <li>
              <NextLink className="underline" href="/paraopeba/vale">
                Ações da Vale na B3
              </NextLink>
            </li>
          </ul>
        </section>
      </div>

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </main>
  );
}

/** Radar da bacia — conteúdo que vivia em `/paraopeba/noticias`. */
function ConteudoBacia({ radar }: { radar: RadarParaopeba }) {
  const total = radar.itens.length;
  const atos = radar.itens.filter((i) => i.ato_de_autoridade).length;

  return (
    <section id="bacia" aria-labelledby="titulo-bacia" className="space-y-4">
      <h2 id="titulo-bacia" className="font-display text-xl font-semibold">
        Radar da bacia do Paraopeba
      </h2>
      <p className="max-w-2xl text-sm text-text-soft">
        Acompanhamento contínuo de matérias, decisões judiciais e comunicações públicas sobre a bacia
        do Rio Paraopeba. Varredura automática sem curadoria ou resumo por modelo.
      </p>

      {total === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-[.95em] text-text-soft">
            A varredura automática ainda não rodou nesta instalação — o que não diz nada sobre o
            caso, apenas sobre esta cópia do portal.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <span className="block text-xs text-text-soft">Total Coletado</span>
              <span className="mt-1 block font-tabular text-xl font-bold text-text">
                {formatNumberBR(total)} notícias
              </span>
              <span className="mt-1 block text-xs text-text-soft">
                {radar.janela_dias ? `últimos ${radar.janela_dias} dias` : "coleta recente"}
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4">
              <span className="block text-xs text-text-soft">Atos de Autoridade</span>
              <span className="mt-1 block font-tabular text-xl font-bold text-accent">
                {formatNumberBR(atos)} identificados
              </span>
              <span className="mt-1 block text-xs text-text-soft">
                de {formatNumberBR(total)} itens: decisões, sentenças ou acordos
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {radar.itens.map((item, idx) => (
              <article
                key={`item-${idx}`}
                className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-text-soft">{item.veiculo}</span>
                  {item.data && (
                    <time className="text-xs text-text-soft">{formatDateBR(item.data)}</time>
                  )}
                </div>

                <h3 className="mt-1.5 font-display text-base font-semibold text-text">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary hover:underline"
                  >
                    {item.titulo} ↗
                  </a>
                </h3>

                {item.ato_de_autoridade && (
                  <span className="mt-2 inline-block rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                    Ato de autoridade
                  </span>
                )}
              </article>
            ))}
          </div>

          {radar.lacuna_conhecida ? (
            <p className="rounded-xl border border-dashed border-border bg-surface-2 p-4 text-sm text-text-soft">
              <strong className="text-text">O que esta varredura não cobre:</strong>{" "}
              {radar.lacuna_conhecida}
            </p>
          ) : null}

          <section className="border-t border-border pt-6" aria-labelledby="fonte-bacia">
            <h3 id="fonte-bacia" className="font-display text-base font-semibold">
              De onde vem o dado
            </h3>
            <p className="mt-2 max-w-2xl text-[.9em] text-text-soft">
              Coletor{" "}
              <code className="rounded bg-surface-2 px-1 py-0.5 text-[.9em]">
                scripts/coletar-noticias-paraopeba.py
              </code>
              {radar.gerado_em
                ? `, coleta de ${formatDateBR(radar.gerado_em.slice(0, 10))}`
                : ", que ainda não rodou nesta instalação"}
              . Só título, veículo, data e link: o texto da matéria nunca é copiado.
            </p>
          </section>
        </>
      )}
    </section>
  );
}

/** Radar da Vale — conteúdo que vivia em `/paraopeba/noticias-vale`. */
function ConteudoVale() {
  const noticias = dadosNoticiasVale.noticias;
  const fontesDistintas = new Set(noticias.map((n) => n.fonte)).size;
  const datas = noticias.map((n) => n.data).filter((d): d is string => Boolean(d));
  const de = datas.length ? datas.reduce((a, b) => (a < b ? a : b)).slice(0, 10) : null;
  const ate = datas.length ? datas.reduce((a, b) => (a > b ? a : b)).slice(0, 10) : null;

  return (
    <section id="vale" aria-labelledby="titulo-vale" className="space-y-4">
      <h2 id="titulo-vale" className="font-display text-xl font-semibold">
        Radar da Vale S.A.
      </h2>

      {/* A ressalva vem ANTES da primeira lista: esta tela é varredura de
          feeds, não produção jornalística, e quem lê um título com cara de
          manchete não pode concluir que o portal afirma o que a notícia diz. */}
      <div className="rounded-2xl border border-alert/40 bg-surface-2 p-5">
        <p className="text-[1em] text-text-soft">
          Coletadas de fontes públicas de notícias; o portal não produz conteúdo jornalístico.
          Veja sempre a fonte original. O resumo exibido é o que a própria fonte publicou no
          feed — nada foi escrito por aqui.
        </p>
      </div>

      <p className="max-w-2xl text-[.95em] text-text-soft">
        Varredura automática, <strong className="text-text">sem curadoria</strong> — diferente do{" "}
        <NextLink href="/paraopeba/clipping" className="font-medium text-accent hover:underline">
          clipping
        </NextLink>
        , aqui ninguém leu nem classificou. {formatNumberBR(noticias.length)} itens da coleta de{" "}
        <strong className="text-text">{formatDateBR(dadosNoticiasVale.gerado_em.slice(0, 10))}</strong>
        {de && ate ? `, entre ${formatDateBR(de)} e ${formatDateBR(ate)}` : ""}, de{" "}
        {fontesDistintas} veículos.
      </p>

      {/* Cartões de topo: os agregados que respondem "quanto é isso?" antes
          de rolar a lista. Contagem vem do dado, não digitada. */}
      <div className="grid gap-3 sm:grid-cols-3">
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
            <p className="text-[12px] text-text-soft">{c.rotulo}</p>
            <p className="mt-1 font-tabular text-xl font-bold text-text">{c.valor}</p>
            <p className="mt-1 text-[12px] text-text-soft">{c.nota}</p>
          </div>
        ))}
      </div>

      <ListaNoticiasVale noticias={noticias} />

      <section className="border-t border-border pt-6" aria-labelledby="fonte-vale">
        <h3 id="fonte-vale" className="font-display text-base font-semibold">
          De onde vem o dado
        </h3>
        <p className="mt-2 max-w-2xl text-[.9em] text-text-soft">
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
    </section>
  );
}
