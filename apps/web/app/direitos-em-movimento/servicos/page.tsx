import type { Metadata } from "next";
import Link from "next/link";
import type { SubfrenteId } from "@/lib/eixos/types";
import { listarFichasPorSubfrente } from "@/lib/eixos/fichas";
import { SERVICOS, hrefServico, servicoPorSlug } from "@/lib/direitos/servicos";
import { PainelFacetas } from "@/app/components/PainelFacetas";
import AvisoReferencia from "./AvisoReferencia";
import ConteudoSaude from "./ConteudoSaude";
import ConteudoEducacao from "./ConteudoEducacao";
import ConteudoTrabalho from "./ConteudoTrabalho";
import FichasDaSubfrente from "./FichasDaSubfrente";

/**
 * @file `/direitos-em-movimento/servicos` — painel de facetas dos serviços
 * essenciais (saúde, educação, trabalho e renda).
 *
 * O QUE MUDOU (02/11/2026): eram três rotas irmãs — `/saude-publica`,
 * `/educacao` e `/trabalho-e-renda` — com o mesmo esqueleto: quatro cartões de
 * referência, uma série e a lista de fichas. Agora é uma URL canônica com
 * `?subfrente=`, e um recorte alimenta cartões, série e fichas juntos.
 *
 * ARQUITETURA (e por quê): a faceta é LINK, com o estado na URL, e a página é
 * renderizada no servidor — nada de `useState` segurando coleção (AGENTS §5.1)
 * e a casca não desmonta entre um clique e outro (§5.13). Cada recorte fica
 * compartilhável e funciona sem JavaScript.
 *
 * O QUE NÃO ENTROU NA FACETA, de propósito: a segurança pública tem dado
 * próprio (Sinesp VDE, com tabela) e continua rota; ajuda, informação,
 * conselhos, denúncia e o Cadastro de Empregadores também — são conteúdo, não
 * recorte. Agrupar por prefixo teria juntado coisas que não são irmãs.
 *
 * NÚMEROS: os cartões são referência nacional, não medição do portal — o
 * `AvisoReferencia` diz isso antes do primeiro número, e a fonte está linkada.
 */

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Metadata ESTÁTICA, de propósito: no alvo `output: 'export'` a página é
 * gerada uma vez, sem `searchParams`, e metadata dinâmica ali é promessa que o
 * alvo não cumpre. O canonical do recorte entra como `<link>` no corpo, que o
 * React promove ao `<head>` — mesmo recurso da página-ponte.
 */
export const metadata: Metadata = {
  title: "Serviços essenciais — saúde, educação e trabalho | Controle Popular",
  description:
    "Painel dos serviços essenciais do eixo Direitos em Movimento: referência nacional do SUS, do IDEB e do emprego formal, com as fichas de cada subfrente.",
};

const TITULOS_FICHAS: Record<string, { titulo: string; descricao: string }> = {
  "saude-publica": {
    titulo: "Fichas e relatórios de saúde pública",
    descricao: "Auditorias, capacidade hospitalar e fiscalização municipal",
  },
  educacao: {
    titulo: "Fichas de educação e infraestrutura escolar",
    descricao: "Diagnósticos de escolas públicas, internet e quadras esportivas",
  },
  "trabalho-e-renda": {
    titulo: "Fichas de renda, trabalho e compras públicas",
    descricao: "Rastreamento de empresas contratadas e geração de emprego local",
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
      <nav aria-label="Trilha de navegação" className="text-xs text-muted">
        <Link href="/" className="hover:text-primary transition">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/direitos-em-movimento" className="hover:text-primary transition">
          Direitos em Movimento
        </Link>{" "}
        · <span className="text-foreground font-semibold">Serviços essenciais</span>
      </nav>

      <header className="mt-4 space-y-3">
        <p className="text-sm uppercase tracking-wide text-text-soft">
          Eixo 1: Direitos em Movimento · saúde, educação e trabalho
        </p>
        <h1 className="text-3xl font-bold">Serviços essenciais</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-text-soft">
          Um painel só para os três serviços que sustentam os demais direitos. Escolha o recorte e
          os cartões, a série e as fichas abaixo mudam juntos — o número do botão e o da lista
          saem da mesma contagem.
        </p>
      </header>

      <div className="mt-8 space-y-8">
        <PainelFacetas
          facetas={facetas}
          atual={servico.slug}
          total={totalFichas}
          hrefDe={(slug) => hrefServico(slug)}
          titulo="Recorte por serviço"
          ariaLabel="Recorte por serviço essencial"
          nota={`N = fichas catalogadas nesta subfrente. Ao todo, ${totalFichas} fichas nos três recortes.`}
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

        <section aria-labelledby="titulo-fora-da-faceta" className="space-y-3">
          <h2 id="titulo-fora-da-faceta" className="font-display text-xl font-semibold">
            O que não é recorte deste painel
          </h2>
          <p className="text-sm text-text-soft">
            Estes assuntos têm conteúdo próprio e continuam em endereço próprio — juntá-los por
            prefixo teria criado uma página que não é irmã das outras:
          </p>
          <ul className="flex flex-wrap gap-2 text-sm">
            <li>
              <Link className="underline" href="/direitos-em-movimento/seguranca-publica">
                Segurança pública (Sinesp VDE)
              </Link>
            </li>
            <li>
              <Link className="underline" href="/direitos-em-movimento/ajuda">
                Onde buscar ajuda
              </Link>
            </li>
            <li>
              <Link className="underline" href="/direitos-em-movimento/informacao">
                Como pedir informação
              </Link>
            </li>
            <li>
              <Link className="underline" href="/direitos-em-movimento/conselhos">
                Conselhos de direitos
              </Link>
            </li>
            <li>
              <Link className="underline" href="/direitos-em-movimento/denuncia">
                Como denunciar
              </Link>
            </li>
            <li>
              <Link className="underline" href="/direitos-em-movimento/trabalho-e-renda/cadastro-empregadores">
                Cadastro de Empregadores
              </Link>
            </li>
          </ul>
        </section>

        <p className="text-sm">
          <Link className="underline" href="/direitos-em-movimento">
            Voltar para as portas de Direitos em Movimento
          </Link>
        </p>
      </div>
    </main>
  );
}
