/**
 * SecaoInspiracoes — seção "Inspirações e Referências" da página /sobre.
 *
 * Extraída do `SobrePage` em 08/10/2026 (hotspots CodeScene, saúde 7,26):
 * o componente era um JSX de 570 linhas num único método; cada seção vira
 * um arquivo próprio em `app/sobre/components/`. Conteúdo textual intacto.
 */
import NextLink from "next/link";

export function SecaoInspiracoes() {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-surface-2 p-5 sm:p-6">
      <h2 className="font-display text-2xl font-semibold">
        Inspirações e Referências
      </h2>
      <p className="text-text-soft">
        O nome <strong className="text-text">Controle Popular</strong> não é
        invenção de marketing. Vem de uma palavra de ordem do{" "}
        <a
          href="https://mab.org.br/"
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary hover:text-accent"
        >
          Movimento dos Atingidos por Barragens (MAB)
        </a>
        : &ldquo;Água e energia com soberania, distribuição da riqueza e
        controle popular&rdquo;.
      </p>
      <p className="text-text-soft">
        Do MAB vem a postura da frente ambiental. Ele nos ensinou a cobrar
        reparação pelos{" "}
        <NextLink
          href="/ambiental/crimes-socioambientais"
          className="text-primary hover:text-accent"
        >
          crimes socioambientais
        </NextLink>
        , reunidos num acervo aberto; a acompanhar as outorgas de água; a{" "}
        <NextLink href="/ambiental/barragens" className="text-primary hover:text-accent">
          fiscalizar as barragens
        </NextLink>{" "}
        e a vigiar o{" "}
        <NextLink href="/ambiental/licenciamento" className="text-primary hover:text-accent">
          licenciamento ambiental
        </NextLink>
        .
      </p>
      <p className="text-text-soft">
        A{" "}
        <NextLink
          href="/direitos-em-movimento/educacao"
          className="text-primary hover:text-accent"
        >
          página de educação
        </NextLink>
        , entre outras, foi inspirada no{" "}
        <a
          href="https://levante.org.br/"
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary hover:text-accent"
        >
          Levante Popular da Juventude
        </a>
        . A{" "}
        <NextLink
          href="/direitos-em-movimento/saude-publica"
          className="text-primary hover:text-accent"
        >
          página de saúde
        </NextLink>
        , entre outras, foi inspirada no{" "}
        <a
          href="https://brasilpopular.org/"
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary hover:text-accent"
        >
          Movimento Brasil Popular
        </a>
        . E a inspiração{" "}
        <NextLink href="/tecnologia" className="text-primary hover:text-accent">
          tecnológica
        </NextLink>{" "}
        hacker pra criar redes mais justas e{" "}
        <NextLink
          href="/tecnologia#catalogo-titulo"
          className="text-primary hover:text-accent"
        >
          software livre
        </NextLink>{" "}
        mais acessível veio da{" "}
        <a
          href="https://codigonaobinario.org/"
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary hover:text-accent"
        >
          Código Não Binário
        </a>
        , organização que bate de frente com as Big Techs quando é pra falar de
        IA.
      </p>
      <p className="text-text-soft">
        E ao <strong className="text-text">Instituto Esperança Maria</strong>, pelas
        experiências em educação ambiental de direitos humanos, que agora dão luz
        a esse portal. Sem essas organizações cobrando por justiça e direitos nas
        florestas, nas águas, no campo, na cidade e nas redes, esse portal não
        existiria.
      </p>
    </section>
  );
}
