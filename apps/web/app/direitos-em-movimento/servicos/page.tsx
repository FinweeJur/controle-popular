import type { Metadata } from "next";
import Link from "next/link";
import type { SubfrenteId } from "@/lib/eixos/types";
import { listarFichasPorSubfrente } from "@/lib/eixos/fichas";
import { SERVICOS, hrefServico, servicoPorSlug } from "@/lib/direitos/servicos";
import { PainelFacetas } from "@/app/components/PainelFacetas";
import NavegacaoSecoes from "@/app/components/NavegacaoSecoes";
import ForaDaFaceta from "./ForaDaFaceta";
import AvisoReferencia from "./AvisoReferencia";
import ConteudoSaude from "./ConteudoSaude";
import ConteudoEducacao from "./ConteudoEducacao";
import ConteudoTrabalho from "./ConteudoTrabalho";
import FichasDaSubfrente from "./FichasDaSubfrente";

/**
 * @file `/direitos-em-movimento/servicos` â€” painel de facetas dos serviÃ§os
 * essenciais (saÃºde, educaÃ§Ã£o, trabalho e renda).
 *
 * O QUE MUDOU (02/11/2026): eram trÃªs rotas irmÃ£s â€” `/saude-publica`,
 * `/educacao` e `/trabalho-e-renda` â€” com o mesmo esqueleto: quatro cartÃµes de
 * referÃªncia, uma sÃ©rie e a lista de fichas. Agora Ã© uma URL canÃ´nica com
 * `?subfrente=`, e um recorte alimenta cartÃµes, sÃ©rie e fichas juntos.
 *
 * ARQUITETURA (e por quÃª): a faceta Ã© LINK, com o estado na URL, e a pÃ¡gina Ã©
 * renderizada no servidor â€” nada de `useState` segurando coleÃ§Ã£o (AGENTS Â§5.1)
 * e a casca nÃ£o desmonta entre um clique e outro (Â§5.13). Cada recorte fica
 * compartilhÃ¡vel e funciona sem JavaScript.
 *
 * O QUE NÃƒO ENTROU NA FACETA, de propÃ³sito: a seguranÃ§a pÃºblica tem dado
 * prÃ³prio (Sinesp VDE, com tabela) e continua rota; ajuda, informaÃ§Ã£o,
 * conselhos, denÃºncia e o Cadastro de Empregadores tambÃ©m â€” sÃ£o conteÃºdo, nÃ£o
 * recorte. Agrupar por prefixo teria juntado coisas que nÃ£o sÃ£o irmÃ£s.
 *
 * NÃšMEROS: os cartÃµes sÃ£o referÃªncia nacional, nÃ£o mediÃ§Ã£o do portal â€” o
 * `AvisoReferencia` diz isso antes do primeiro nÃºmero, e a fonte estÃ¡ linkada.
 */

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Metadata ESTÃTICA, de propÃ³sito: no alvo `output: 'export'` a pÃ¡gina Ã©
 * gerada uma vez, sem `searchParams`, e metadata dinÃ¢mica ali Ã© promessa que o
 * alvo nÃ£o cumpre. O canonical do recorte entra como `<link>` no corpo, que o
 * React promove ao `<head>` â€” mesmo recurso da pÃ¡gina-ponte.
 */
export const metadata: Metadata = {
  title: "ServiÃ§os essenciais â€” saÃºde, educaÃ§Ã£o e trabalho | Controle Popular",
  description:
    "Painel dos serviÃ§os essenciais do eixo Direitos em Movimento: referÃªncia nacional do SUS, do IDEB e do emprego formal, com as fichas de cada subfrente.",
};

const TITULOS_FICHAS: Record<string, { titulo: string; descricao: string }> = {
  "saude-publica": {
    titulo: "Fichas e relatÃ³rios de saÃºde pÃºblica",
    descricao: "Auditorias, capacidade hospitalar e fiscalizaÃ§Ã£o municipal",
  },
  educacao: {
    titulo: "Fichas de educaÃ§Ã£o e infraestrutura escolar",
    descricao: "DiagnÃ³sticos de escolas pÃºblicas, internet e quadras esportivas",
  },
  "trabalho-e-renda": {
    titulo: "Fichas de renda, trabalho e compras pÃºblicas",
    descricao: "Rastreamento de empresas contratadas e geraÃ§Ã£o de emprego local",
  },
};

export default async function ServicosPage({ searchParams }: Props) {
  const params = await searchParams;
  const servico = servicoPorSlug(params.subfrente);

  const facetas = SERVICOS.map((item) => ({
    slug: item.slug,
    rotulo: item.rotulo,
    n: listarFichasPorSubfrente(item.slug as SubfrenteId).length,
  }));
  const totalFichas = facetas.reduce((soma, faceta) => soma + faceta.n, 0);
  const fichasDoRecorte = TITULOS_FICHAS[servico.slug];

  return (
    <main id="conteudo-principal" className="mx-auto w-full max-w-6xl px-4 py-8">
      <link rel="canonical" href={hrefServico(servico.slug)} />
      <nav aria-label="Trilha de navegaÃ§Ã£o" className="text-xs text-muted">
        <Link href="/" className="hover:text-primary transition">
          InÃ­cio
        </Link>{" "}
        Â·{" "}
        <Link href="/direitos-em-movimento" className="hover:text-primary transition">
          Direitos em Movimento
        </Link>{" "}
        Â· <span className="text-foreground font-semibold">ServiÃ§os essenciais</span>
      </nav>

      <header className="mt-4 space-y-3">
        <p className="text-sm uppercase tracking-wide text-text-soft">
          Eixo 1: Direitos em Movimento Â· saÃºde, educaÃ§Ã£o e trabalho
        </p>
        <h1 className="text-3xl font-bold">ServiÃ§os essenciais</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-text-soft">
          Um painel sÃ³ para os trÃªs serviÃ§os que sustentam os demais direitos. Escolha o recorte e
          os cartÃµes, a sÃ©rie e as fichas abaixo mudam juntos â€” o nÃºmero do botÃ£o e o da lista
          saem da mesma contagem.
        </p>
      </header>

      <NavegacaoSecoes
        secoes={[
          { id: "titulo-recorte", rotulo: "Recorte" },
          { id: "titulo-fora-da-faceta", rotulo: "O que nÃ£o entra" },
        ]}
        anterior={{ href: "/direitos-em-movimento", rotulo: "Direitos" }}
        proxima={{ href: "/direitos-em-movimento/seguranca-publica", rotulo: "SeguranÃ§a" }}
        rotulo="NavegaÃ§Ã£o do painel de serviÃ§os"
      />
      <div className="mt-8 space-y-8">
        <PainelFacetas
          facetas={facetas}
          atual={servico.slug}
          total={totalFichas}
          hrefDe={(slug) => hrefServico(slug)}
          titulo="Recorte por serviÃ§o"
          ariaLabel="Recorte por serviÃ§o essencial"
          nota={`N = fichas catalogadas nesta subfrente. Ao todo, ${totalFichas} fichas nos trÃªs recortes.`}
        />

        <AvisoReferencia servico={servico} />

        <section aria-labelledby="titulo-recorte" className="space-y-6">
          <div>
            <h2 id="titulo-recorte" className="font-display text-2xl font-bold text-foreground">
              {servico.titulo}
            </h2>
            <p className="text-sm text-muted">{servico.descricao}</p>
          </div>

          {servico.slug === "saude-publica" ? <ConteudoSaude /> : null}
          {servico.slug === "educacao" ? <ConteudoEducacao /> : null}
          {servico.slug === "trabalho-e-renda" ? <ConteudoTrabalho /> : null}
        </section>

        <FichasDaSubfrente
          subfrente={servico.slug as SubfrenteId}
          titulo={fichasDoRecorte.titulo}
          descricao={fichasDoRecorte.descricao}
        />

        <ForaDaFaceta />
        <p className="text-sm">
          <Link className="underline" href="/direitos-em-movimento">
            Voltar para as portas de Direitos em Movimento
          </Link>
        </p>
      </div>
    </main>
  );
}


