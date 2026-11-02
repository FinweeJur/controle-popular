import type { Metadata } from "next";
import { alertas, bonsExemplos, coberturaAnalise } from "@/lib/congresso/destaques";
import {
  hrefAnalises,
  montarVisao,
  paginaDoParam,
  recortePorSlug,
  temaDoParam,
} from "@/lib/congresso/analises";
import {
  BlocosDeMedida,
  Cabecalho,
  ListaDoRecorte,
  RodapePainel,
  Trilha,
} from "./partes";

/**
 * @file `/congresso/analises` — painel de facetas das proposições federais
 * com análise de direitos concluída.
 *
 * O QUE MUDOU (02/11/2026): `/congresso/alertas` (projetos que restringem) e
 * `/congresso/bons-exemplos` (projetos que ampliam) eram a MESMA entidade,
 * separada só pelo sentido do rótulo. Viraram dois recortes de uma URL
 * canônica: `?recorte=restringem|ampliam`, com `?tema=` como segunda dimensão.
 * As duas rotas antigas viraram ponte (`lib/redirects/rotas-antigas.ts`).
 *
 * ARQUITETURA: faceta é LINK e a página renderiza no servidor — nada de
 * `useState` segurando coleção (AGENTS §5.1) e a casca não desmonta entre um
 * clique e outro (§5.13). Este arquivo só lê a URL, busca o acervo e compõe;
 * a medição mora em `lib/congresso/analises.ts` (pura, testada) e o desenho em
 * `partes.tsx`. Assim contador, barras, lista e paginação saem do mesmo
 * recorte e não podem discordar.
 *
 * POR QUE PAGINA NO SERVIDOR: `/congresso/bons-exemplos` tinha ~360
 * proposições e existia um índice estático fatiado só para não embutir tudo no
 * HTML. Aqui a lista é cortada em 20 por página na URL (`?pagina=`), então o
 * HTML continua pequeno e o N do botão segue sendo o total do recorte.
 *
 * NÚMEROS: todos vêm do banco do portal (`analises` + `analise_itens`,
 * alimentadas pela API de Dados Abertos da Câmara). O denominador aparece: o
 * painel cobre apenas rótulos `garantista*` e `reducionista*`; análises
 * neutras ou mistas ficam fora e a página declara quantas são.
 *
 * ALVO ESTÁTICO: no `output: 'export'` (GitHub Pages) a página é gerada uma
 * vez, sem `searchParams`, e o recorte padrão é o que fica no HTML — mesma
 * limitação aceita em `/direitos-em-movimento/servicos`. O canonical do
 * recorte entra como `<link>` no corpo, que o React promove ao `<head>`.
 */

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata: Metadata = {
  title: "Análises de direitos no Congresso — o que amplia e o que restringe | Controle Popular",
  description:
    "Painel único das proposições federais com análise de direitos concluída: filtre por sentido (amplia ou restringe) e por tema, com o dispositivo legal e o trecho que fundamentam cada rótulo.",
};

export default async function AnalisesPage({ searchParams }: Props) {
  const params = await searchParams;
  const recorte = recortePorSlug(params.recorte);
  const tema = temaDoParam(params.tema);

  // Duas listas, uma por lado da régua: `alertas()` já vem do mais grave para
  // o menos e `bonsExemplos()` do mais expressivo para o menos.
  const [restringem, ampliam, cobertura] = await Promise.all([
    alertas(),
    bonsExemplos(),
    coberturaAnalise(),
  ]);

  const visao = montarVisao({
    restringem,
    ampliam,
    cobertura,
    recorte,
    tema,
    pagina: paginaDoParam(params.pagina),
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <link rel="canonical" href={hrefAnalises({ recorte, tema: tema?.slug })} />
      <Trilha />
      <Cabecalho visao={visao} />
      <div className="mt-8 space-y-8">
        <BlocosDeMedida visao={visao} />
        <ListaDoRecorte visao={visao} />
        <RodapePainel />
      </div>
    </div>
  );
}
