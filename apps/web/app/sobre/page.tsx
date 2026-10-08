import type { Metadata } from "next";
import NextLink from "next/link";
import { listarCidades } from "@/lib/db/queries/municipios";
import { obterEstatisticasPortal } from "@/lib/betim/estatisticas-portal";
import FooterGlobal from "@/app/components/FooterGlobal";
import { metadataEditavel } from "@/lib/edicoes";
import { Epigrafe } from "@/app/components/Epigrafe";
import { citacaoPorId } from "@/lib/citacoes";
import { SecaoInspiracoes } from "./components/SecaoInspiracoes";
import { SecaoHonestidadeIA } from "./components/SecaoHonestidadeIA";
import { SecaoEixos } from "./components/SecaoEixos";
import { SecaoMetodologia } from "./components/SecaoMetodologia";
import { SecaoParteTecnica } from "./components/SecaoParteTecnica";
import { SecaoOQueFalta } from "./components/SecaoOQueFalta";

/**
 * `/sobre` — a apresentação do Controle Popular, na RAIZ do domínio.
 *
 * FICA NA RAIZ, fora de `[municipio]`/`congresso`/`judiciario`/`ambiental`
 * (mesmo motivo de `app/busca/page.tsx` e `app/dados/populares/page.tsx`):
 * o assunto é o portal INTEIRO, e uma versão dentro de uma zona descreveria
 * só um recorte. Cada zona já tem a sua própria página "Sobre" ou
 * "Metodologia" (`/judiciario/sobre`, `/[municipio]/sobre`, `/congresso/
 * metodologia`, `/judiciario/metodologia`) — essas continuam existindo e
 * continuam falando só da zona delas. Esta é a única que fala das cinco
 * juntas.
 *
 * Sem `layout.tsx` próprio (fora das quatro zonas) — precisa do `<main>`
 * explícito para o botão global "Ouvir esta página" (`OuvirPagina.tsx`)
 * achar conteúdo, mesma razão documentada em `app/busca/page.tsx`.
 *
 * CONTEÚDO: porte de `docs/APRESENTACAO.md` (1.121 linhas, uso interno) —
 * não reescrita. O que muda aqui é o alcance: os números não são texto
 * datado, são medidos de novo a cada build por `obterEstatisticasPortal()`,
 * porque um documento interno pode dizer "conferido em 2026-08-12" e uma
 * página pública não pode carregar essa validade.
 *
 * `#metodologia` é o alvo do link "Metodologia" do rodapé padrão
 * (`FooterGlobal.tsx`) em qualquer zona — inclusive as que não têm
 * `/metodologia` própria (`/ambiental`, `/funcaosocialterra`).
 *
 * REFACTORAÇÃO (08/10/2026, hotspots CodeScene — saúde 7,26): as 6 seções
 * viraram componentes próprios em `app/sobre/components/`. O `SobrePage`
 * virou orquestrador que busca dados e compõe as seções na mesma ordem.
 */
export const metadata: Metadata = metadataEditavel("/sobre", {
  title: "Sobre o Controle Popular — o que é, de onde vem o dado, e o papel da IA",
  description:
    "O que é o Controle Popular, como cada dado chega ao portal, a separação entre o que o modelo de linguagem extrai e o que o código calcula, e por que o portal está em revisão.",
});

export default async function SobrePage() {
  const [cidades, stats] = await Promise.all([listarCidades(), obterEstatisticasPortal()]);

  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-3xl space-y-14 px-4 py-12 sm:py-16">
      <nav className="text-sm text-text-soft">
        <NextLink href="/" className="hover:text-primary">
          Início
        </NextLink>{" "}
        · <span className="text-text">Sobre</span>
      </nav>

      <header className="space-y-4">
        <p className="font-display text-[1.1em] font-bold text-text">
          controlepopular<span className="text-primary">.br</span>
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          O que é o Controle Popular
        </h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          O Controle Popular é o portal público do ONSA — Observatório Nacional
          Socioambiental. Com raízes na História e Geografia, este portal se utiliza da
          tecnologia da Inteligência Artificial pra somar na busca por justiça
          socioambiental e fiscalização cidadã, acessível pela internet, gratuitamente
          e sem cadastro, por qualquer celular ou computador.
        </p>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Reunindo dezenas de portais e dados públicos, estamos cobrindo milhares de
          contratos, convênios, licenciamentos ambientais, pesquisas e autorizações
          minerárias e de barragens, legislação ambiental e de direitos humanos
          unificada, e o orçamento detalhado das prefeituras, governo de Minas,
          Congresso Brasileiro e Instituições de Justiça.
        </p>
        {/* EPÍGRAFE EDITORIAL — citação autorizada no PLANO-COPY-VOZ.md (/sobre · abertura) */}
        <Epigrafe
          citacao={citacaoPorId("carolina-mundo-modificar")!}
          variante="inicio"
          className="max-w-2xl"
        />
      </header>

      <SecaoInspiracoes />
      {/* ═══ 1. O QUE É ═══ */}
      <section className="space-y-3">
        <p className="rounded-lg border border-border bg-surface-2 p-4 text-[.95em] text-text-soft">
          A regra que organiza o projeto inteiro: <strong className="text-text">todo
          número exibido tem fonte identificável, e todo número que resulta de estimativa
          aparece com a taxa de erro ao lado</strong>. Quando não há dado, a tela diz que não
          há — não preenche o espaço com uma aproximação silenciosa. Um portal que cobra
          procedência dos outros não pode publicar número sem procedência própria.
        </p>
      </section>

      <SecaoHonestidadeIA />
      <SecaoEixos cidades={cidades} stats={stats} />

      {/* O card "Inspirações e Referências" foi movido para logo após a
          epígrafe da Carolina Maria de Jesus, no topo desta página. */}

      <SecaoMetodologia stats={stats} />
      <SecaoParteTecnica />
      <SecaoOQueFalta />
      <FooterGlobal />
    </main>
  );
}
