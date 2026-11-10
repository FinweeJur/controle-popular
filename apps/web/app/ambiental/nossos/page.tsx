import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  RECORTES_NOSSOS,
  contarRecorte,
  facetasNossos,
  hrefColecao,
  lugaresDoRecorte,
  recortePorSlug,
  type RecorteNossos,
} from "@/lib/ambiental/nossos";
import { PainelFacetas } from "@/app/components/PainelFacetas";
import OutrasFrentes from "@/app/components/OutrasFrentes";
import { Epigrafe } from "@/app/components/Epigrafe";
import { citacaoPorId } from "@/lib/citacoes";
import MeioAmbienteRelacionado from "@/app/components/MeioAmbienteRelacionado";
import { metadataEditavel } from "@/lib/edicoes";

/**
 * @file `/ambiental/nossos` — painel da Coleção Nossos (rios, serras e
 * territórios).
 *
 * O QUE MUDOU (02/11/2026): eram três rotas irmãs — `/ambiental/nossos-rios`,
 * `/ambiental/nossas-serras` e `/ambiental/nossos-territorios` — com o mesmo
 * esqueleto e o mesmo catálogo (`LUGARES_CATALOGO`), diferenciadas só pelo
 * `tipo`. Agora é uma URL canônica com `?colecao=`, e o mesmo recorte alimenta
 * o N do botão e a grade de cartões.
 *
 * ARQUITETURA (e por quê): faceta é LINK, estado na URL, render no servidor —
 * nada de `useState` segurando coleção (AGENTS §5.1) e a casca não desmonta
 * (§5.13). Cada recorte fica compartilhável e funciona sem JavaScript.
 *
 * O QUE NÃO ENTROU NA FACETA, de propósito: `nossos-animais` e `nossa-gente`
 * têm catálogo, tabela e exportação CSV próprios — são conteúdo, não recorte.
 * Continuam rotas e aparecem na faixa de páginas irmãs. As rotas dinâmicas
 * `[slug]` (detalhe de cada rio/serra/território) também continuam: é nelas
 * que mora o dado de cada lugar.
 *
 * NÚMEROS: os N das facetas são fichas catalogadas em `lib/lugares.ts`, com o
 * denominador no texto da nota. Nenhum valor é digitado à mão nesta página.
 *
 * SEÇÕES SÃO FUNÇÕES LOCAIS: o hook de saúde de código barra método com mais
 * de 120 linhas e complexidade acima de 10. Quebrar por seção mantém cada
 * pedaço legível e não muda o HTML — nada aqui guarda estado.
 */

export const metadata: Metadata = metadataEditavel("/ambiental/nossos", {
  title: "Nossos Rios, Serras, Territórios e Gente — Meio Ambiente (ONSA) · Controle Popular",
  description:
    "Coleção de lugares e territórios brasileiros sob a ótica do Observatório Nacional Socioambiental. Águas, relevo, cerrado e a nossa gente no centro da fiscalização cívica.",
});

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Link de retorno ao topo, repetido no fim de cada seção ("subir"). */
function Subir() {
  return (
    <p className="mt-6 text-sm">
      <a href="#topo" className="underline">
        ↑ Subir ao início da página
      </a>
    </p>
  );
}

/** Atalhos "descer" para as seções desta página. */
function NavAncoras({ rotuloRecorte }: { rotuloRecorte: string }) {
  const atalhos = [
    { href: "#recorte", rotulo: rotuloRecorte },
    { href: "#colecao", rotulo: "As cinco frentes" },
    { href: "#dados", rotulo: "Onde o dado mora" },
    { href: "#irmas", rotulo: "Páginas irmãs" },
  ];
  return (
    <nav aria-label="Seções desta página" className="rounded-xl border border-border bg-surface-2 p-4">
      <h2 className="text-sm font-semibold text-text">Nesta página</h2>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {atalhos.map((atalho) => (
          <li key={atalho.href}>
            <a href={atalho.href} className="underline">
              ↓ {atalho.rotulo}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

interface ChipLugar {
  id: string;
  nome: string;
  href: string;
}

/** Cartão de uma frente da coleção — as cinco usam esta mesma moldura. */
function CartaoFrente({
  emoji,
  titulo,
  descricao,
  chips,
  rodape,
}: {
  emoji: string;
  titulo: string;
  descricao: string;
  chips?: ChipLugar[];
  rodape: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div>
        <span className="text-2xl">{emoji}</span>
        <h3 className="mt-2 font-display text-lg font-bold text-text">{titulo}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-text-soft">{descricao}</p>
        {chips && chips.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <Link
                key={chip.id}
                href={chip.href}
                className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs font-medium text-text-soft transition-colors hover:text-primary"
              >
                {chip.nome}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
      <div className="mt-5 border-t border-border pt-3">{rodape}</div>
    </div>
  );
}

/** As cinco frentes — navegação do hub, preservada do desenho antigo. */
function CincoFrentes() {
  const [rios, serras, territorios] = RECORTES_NOSSOS;
  const chipsDe = (recorte: RecorteNossos): ChipLugar[] =>
    lugaresDoRecorte(recorte).map((lugar) => ({
      id: lugar.id,
      nome: lugar.nome,
      href: `${recorte.rota}/${lugar.id}`,
    }));

  return (
    <section id="colecao" aria-labelledby="titulo-frentes" className="scroll-mt-6 border-t border-border pt-8">
      <h2 id="titulo-frentes" className="font-display text-xl font-bold text-text">
        As cinco frentes da nossa terra
      </h2>
      <p className="mt-1 max-w-3xl text-sm text-text-soft">
        As três primeiras viraram recortes deste painel; as duas últimas têm catálogo próprio e
        seguem em endereço próprio.
      </p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <CartaoFrente
          emoji="🌊"
          titulo="Nossos Rios"
          descricao="Bacias hidrográficas, monitoramento de vazão, outorgas, barragens e a vida das comunidades ribeirinhas."
          chips={chipsDe(rios)}
          rodape={
            <Link href={hrefColecao("rios")} className="text-xs font-semibold text-primary hover:underline">
              Explorar todos os rios ({contarRecorte(rios)}) →
            </Link>
          }
        />
        <CartaoFrente
          emoji="⛰️"
          titulo="Nossas Serras"
          descricao="Cordilheiras, campos rupestres, parques estaduais, concessões e pressões minerárias no relevo."
          chips={chipsDe(serras)}
          rodape={
            <Link href={hrefColecao("serras")} className="text-xs font-semibold text-primary hover:underline">
              Explorar todas as serras ({contarRecorte(serras)}) →
            </Link>
          }
        />
        <CartaoFrente
          emoji="🌱"
          titulo="Nossos Territórios"
          descricao="Vales, biomas, quilombos e terras tradicionais unificados com os dados fundiários do CAR."
          chips={chipsDe(territorios)}
          rodape={
            <Link
              href={hrefColecao("territorios")}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Explorar territórios e terras ({contarRecorte(territorios)}) →
            </Link>
          }
        />
        <CartaoFrente
          emoji="🐆"
          titulo="Nossos Animais"
          descricao="Fauna ameaçada, corredores ecológicos, atropelamento de animais em rodovias e proteção de espécies."
          rodape={
            <>
              <span className="block text-xs font-medium text-text-soft">
                Nova frente da Coleção Nossos
              </span>
              <Link
                href="/ambiental/nossos-animais"
                className="mt-1 block text-xs font-semibold text-primary hover:underline"
              >
                Abrir Nossos Animais →
              </Link>
            </>
          }
        />
        <CartaoFrente
          emoji="👥"
          titulo='Nossa Gente & "E nosso povo?"'
          descricao="A presença humana no território: saúde pública, renda de agricultores familiares, ceramistas tradicionais, ribeirinhos e o controle social da terra."
          rodape={
            <>
              <span className="block text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                Presente em todas as páginas com o bloco &quot;E nosso povo?&quot; / &quot;E nossa
                gente?&quot;
              </span>
              <Link
                href="/ambiental/nossa-gente"
                className="mt-1 block text-xs font-semibold text-primary hover:underline"
              >
                Abrir Nossa Gente →
              </Link>
            </>
          }
        />
      </div>
      <Subir />
    </section>
  );
}

/**
 * O recorte ativo — ou a união das fichas quando não há `?colecao=`.
 *
 * O cartão de cada lugar continua igual ao da rota antiga: nome, resumo de voz
 * cidadã, biomas e o link para o painel do lugar. O emoji e o texto do link
 * vêm do recorte daquele `tipo`, não do recorte da URL.
 */
function ListaDeLugares({ recorte }: { recorte?: RecorteNossos }) {
  const lugares = lugaresDoRecorte(recorte);
  const total = lugaresDoRecorte().length;

  return (
    <section id="recorte" aria-labelledby="titulo-recorte" className="scroll-mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
        <h2 id="titulo-recorte" className="font-display text-2xl font-bold text-text">
          {recorte ? recorte.titulo : "As fichas dos três recortes"}
        </h2>
        <span className="text-xs text-text-soft">
          {lugares.length} de {total} fichas
        </span>
      </div>
      <p className="mt-2 max-w-3xl text-sm text-text-soft">
        {recorte
          ? recorte.descricao
          : "Rios, serras, vales e cerrados do catálogo, numa lista só. Escolha um recorte acima para ver só o que é daquele tipo — o texto de abertura de cada coleção continua igual ao da página antiga."}
      </p>
      {recorte ? (
        <p className="mt-2 text-xs text-text-soft">
          Etiqueta da coleção: <strong className="text-text">{recorte.etiqueta}</strong>
        </p>
      ) : null}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {lugares.map((lugar) => {
          const doTipo =
            recorte ??
            RECORTES_NOSSOS.find((item) => item.tipos.includes(lugar.tipo)) ??
            RECORTES_NOSSOS[0];
          return (
            <article
              key={lugar.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-sm transition-colors hover:border-primary"
            >
              <div>
                <span className="text-2xl">{doTipo.emoji}</span>
                <h3 className="mt-2 font-display text-xl font-bold text-text">{lugar.nome}</h3>
                <p className="mt-2 text-xs leading-relaxed text-text-soft">{lugar.resumoVozCidada}</p>
                <div className="mt-3 text-xs text-text-soft">
                  Biomas: {lugar.biomas.join(" / ")}
                </div>
              </div>
              <div className="mt-5 border-t border-border pt-3">
                <Link
                  href={`${doTipo.rota}/${lugar.id}`}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  {doTipo.cta}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      <Subir />
    </section>
  );
}

/** Detalhe com as frentes de dado por trás da coleção (antes no hub). */
function OndeODadoMora() {
  const frentes: Array<{
    titulo: string;
    href: string;
    extra?: { titulo: string; href: string };
    descricao: string;
    cor: "orange" | "teal";
  }> = [
    {
      titulo: "Terras e território",
      href: hrefColecao("territorios"),
      extra: { titulo: "CAR por município", href: "/funcaosocialterra" },
      descricao: "Territórios tradicionais unificados ao dado fundiário do CAR, município por município.",
      cor: "orange",
    },
    {
      titulo: "Barragens",
      href: "/ambiental/barragens",
      descricao: "FEAM, SNISB e SIGBM/ANM lado a lado, com nível de emergência e categoria de risco.",
      cor: "teal",
    },
    {
      titulo: "Licenciamento",
      href: "/ambiental/licenciamento",
      descricao: "Toda licença ambiental deferida pela Semad, por município, setor e classe.",
      cor: "teal",
    },
    {
      titulo: "COPAM",
      href: "/ambiental/copam",
      descricao: "A pauta de cada reunião do conselho estadual, item a item, com o resultado da deliberação.",
      cor: "teal",
    },
    {
      titulo: "Estudos e perícias",
      href: "/ambiental/estudos",
      descricao: "EIA/RIMA de audiências públicas, com o link de origem e guarda de cópia.",
      cor: "teal",
    },
    {
      titulo: "Legislação",
      href: "/ambiental/legislacao",
      descricao: "As normas ambientais aplicáveis, organizadas para consulta rápida.",
      cor: "teal",
    },
  ];

  const classe = (cor: "orange" | "teal") =>
    cor === "orange"
      ? "rounded-md bg-orange-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-orange-800 transition-colors hover:bg-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:hover:bg-orange-900"
      : "rounded-md bg-teal-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-teal-800 transition-colors hover:bg-teal-200 dark:bg-teal-950 dark:text-teal-200 dark:hover:bg-teal-900";

  return (
    <section id="dados" aria-labelledby="titulo-dados" className="scroll-mt-6 border-t border-border pt-8">
      <h2 id="titulo-dados" className="font-display text-xl font-bold text-text">
        O ecossistema em uma página
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-soft">
        Rios, serras, territórios e gente são a cara da Coleção Nossos; o dado que sustenta essa
        fiscalização mora nas frentes técnicas do ONSA — as mesmas que alimentam as pontes entre
        frentes desta coleção.
      </p>

      <details className="group mt-5 rounded-2xl border border-border bg-surface-2 px-5 py-4">
        <summary className="cursor-pointer list-none font-display text-base font-semibold text-text">
          <span className="mr-2 inline-block text-xs text-primary transition-transform duration-200 group-open:rotate-180">
            ▼
          </span>
          Onde o dado mora
        </summary>
        <p className="mt-3 text-sm text-text-soft">
          Cada frente abaixo é um motor de dado público — estadual ou federal — coletado pelo
          ONSA e cruzado com os lugares desta coleção.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {frentes.map((frente) => (
            <div key={frente.titulo} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <Link href={frente.href} className={classe(frente.cor)}>
                  {frente.titulo}
                </Link>
                {frente.extra ? (
                  <Link href={frente.extra.href} className={classe(frente.cor)}>
                    {frente.extra.titulo}
                  </Link>
                ) : null}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-text-soft">{frente.descricao}</p>
            </div>
          ))}
        </div>
      </details>
      <Subir />
    </section>
  );
}

/** Faixa de rotas irmãs que continuaram vivas (têm dado próprio). */
function PaginasIrmas() {
  const irmas = [
    { href: "/ambiental/nossos-animais", rotulo: "Nossos Animais — fauna, corredores e CSV" },
    { href: "/ambiental/nossa-gente", rotulo: "Nossa Gente — povos, pescadores e atingidos" },
    { href: "/ambiental/barragens", rotulo: "Barragens — FEAM, SNISB e SIGBM" },
    { href: "/ambiental/licenciamento", rotulo: "Licenciamento ambiental" },
    { href: "/funcaosocialterra", rotulo: "Função social da terra" },
  ];
  return (
    <section id="irmas" aria-labelledby="titulo-irmas" className="scroll-mt-6 border-t border-border pt-8">
      <h2 id="titulo-irmas" className="font-display text-xl font-bold text-text">
        Páginas irmãs desta coleção
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-text-soft">
        Estas continuam em endereço próprio porque têm dado próprio — não são recorte de um
        catálogo comum:
      </p>
      <ul className="mt-4 flex flex-wrap gap-2 text-sm">
        {irmas.map((irma) => (
          <li key={irma.href}>
            <Link
              className="rounded-full border border-border bg-surface-2 px-3 py-1 hover:border-primary"
              href={irma.href}
            >
              {irma.rotulo}
            </Link>
          </li>
        ))}
      </ul>
      <Subir />
    </section>
  );
}

export default async function HubNossosPage({ searchParams }: Props) {
  const params = await searchParams;
  const recorte = recortePorSlug(params.colecao);
  const total = lugaresDoRecorte().length;

  return (
    <main id="conteudo-principal" className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <span id="topo" />
      <link rel="canonical" href={hrefColecao(recorte?.slug)} />

      {/* TRILHA */}
      <nav aria-label="Navegação estrutural" className="text-xs text-text-soft">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:underline">
              Início
            </Link>
          </li>
          <li>›</li>
          <li>
            <Link href="/ambiental" className="hover:underline">
              ONSA · Meio Ambiente &amp; Terras
            </Link>
          </li>
          <li>›</li>
          <li className="font-semibold text-text">Nossos{recorte ? ` · ${recorte.rotulo}` : ""}</li>
        </ol>
      </nav>

      <header className="mt-5 border-b border-border pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            #natureza
          </span>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            #ecossistema
          </span>
          <span className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-text-soft">
            Coleção Territorial &amp; Humana
          </span>
        </div>

        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
          A terra, as águas e a nossa gente
        </h1>
        <p className="mt-2 max-w-3xl text-base leading-relaxed text-text-soft">
          O meio ambiente não é uma abstração de gabinete: é o rio que sacia a sede, a serra que
          guarda as nascentes, o cerrado que alimenta a biodiversidade e as pessoas que vivem e
          trabalham no território.
        </p>

        {/* EPÍGRAFE EDITORIAL — citação autorizada no PLANO-COPY-VOZ.md (manifesto final, Birri/Galeano) */}
        <p className="mt-4 border-l-2 border-primary/40 pl-4 text-sm italic text-text-soft">
          &quot;Para que serve a utopia? Serve para isso: para caminhar.&quot; — Fernando Birri,
          recolhido por Eduardo Galeano em As Palavras Andantes, 1994
        </p>
      </header>

      <div className="mt-8 space-y-8">
        <PainelFacetas
          facetas={facetasNossos()}
          atual={recorte?.slug}
          total={total}
          hrefDe={(slug) => hrefColecao(slug)}
          titulo="Recorte por coleção"
          ariaLabel="Recorte da Coleção Nossos"
          rotuloTodos="Todas as fichas"
          nota={`N = fichas de lugar catalogadas em lib/lugares.ts. Ao todo, ${total} fichas nos três recortes — o mesmo total alimenta a lista abaixo.`}
        />

        <NavAncoras rotuloRecorte={recorte ? recorte.rotulo : "Fichas dos três recortes"} />
        <ListaDeLugares recorte={recorte} />
        <CincoFrentes />
        <OndeODadoMora />
        <PaginasIrmas />
      </div>

      {/* FECHO — citação autorizada */}
      <Epigrafe citacao={citacaoPorId("carolina-mundo-modificar")!} variante="fecho" />

      <MeioAmbienteRelacionado />
      <OutrasFrentes atual="ambiental" />
    </main>
  );
}
