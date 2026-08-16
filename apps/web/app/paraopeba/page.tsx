import type { Metadata } from "next";
import FooterGlobal from "@/app/components/FooterGlobal";
import OutrasFrentes from "@/app/components/OutrasFrentes";
import AvisoColetaEmCurso from "@/app/components/AvisoColetaEmCurso";
import { ZONAS } from "@/lib/zonas";
import { formatNumberBR } from "@/lib/betim/format";
import {
  CLIPPING_PARAOPEBA,
  PERIODO_CLIPPING,
  MARCOS_PARAOPEBA,
  ATORES_REPARACAO,
  PAGAMENTOS_PARAOPEBA,
  DOCUMENTOS_PROCESSO,
  COBERTURA_DOCUMENTOS_PROCESSO,
} from "@/lib/paraopeba";
// Fora do barril de propósito: `biblioteca.ts` lê disco com `node:fs`, e o
// barril é importado por componente de cliente. Mesma razão de `radar.ts`.
import { COBERTURA_BIBLIOTECA } from "@/lib/paraopeba/biblioteca";
// Também fora do barril, por outra razão: o acervo da auditoria tem 336 KiB, e
// pô-lo em `@/lib/paraopeba` levaria esse peso a toda tela que importa o
// barril. Aqui só a contagem é usada, e esta rota é servidor — nada disso vai
// para o payload (ver `docs/HANDOFF-PAYLOAD-LEGISLACAO.md`).
import {
  AUDITORIA_AJRI,
  AUTOR_AUDITORIA_AJRI,
  INSTRUMENTO_AJRI_ORDEM,
  PERIODO_AUDITORIA_AJRI,
} from "@/lib/paraopeba/auditoria-ajri";
import { GLOSSARIO_PARAOPEBA, PERGUNTAS_PARAOPEBA } from "@/lib/paraopeba/educacao";
// Fora do barril de propósito (ver o comentário em `lib/paraopeba/index.ts`):
// são 226 KB de dado gerado, e esta home só usa duas contagens deles.
import {
  MUNICIPIOS_EXECUCAO_FGV,
  STATUS_PROJETOS_FGV,
} from "@/lib/paraopeba/execucao-fgv";
import { metadataEditavel } from "@/lib/edicoes";

/**
 * Home da frente /paraopeba — acompanhamento da reparação pelo rompimento
 * da barragem da Vale em Brumadinho (25/01/2019, 270 mortes).
 *
 * ═══ DUAS FONTES, NUNCA MISTURADAS ═══
 *
 * Clipping, linha do tempo, atores e auxílio vêm de um painel entregue à
 * mão pelo dono (`painel-paraopeba.html`) — acervo datado, sem API por
 * trás. Os documentos do processo vêm do índice Solr público da Plataforma
 * Brumadinho UFMG, cruzado por município via o campo `places` que a
 * própria UFMG preenche. `docs/PLANO-INGESTAO-PARAOPEBA.md` mede as duas.
 *
 * Nenhum número aqui é digitado — todos vêm da contagem real dos arquivos
 * de `lib/paraopeba/`.
 */
export const metadata: Metadata = metadataEditavel("/paraopeba", {
  title: "Paraopeba — Controle Popular",
  description:
    "Acompanhamento da reparação pelo rompimento da barragem da Vale em Brumadinho: clipping de notícias, linha do tempo do processo, quem atua na reparação e o auxílio emergencial pago mês a mês.",
});

const ZONA = ZONAS.find((z) => z.id === "paraopeba")!;

export default function ParaopebaHome() {
  const tiposDeAtor = new Set(ATORES_REPARACAO.map((a) => a.categoria));
  // 455 linhas de status descrevem 234 projetos — um projeto que alcança 25
  // cidades aparece 25 vezes. O cartão mostra o distinto, nunca o `length`.
  const projetosDistintos = new Set(STATUS_PROJETOS_FGV.map((s) => s.idFdi)).size;

  const BLOCOS = [
    {
      // PRIMEIRO cartão de propósito: as siglas deste bloco (NAE, PTR, ERSHRE,
      // zona quente) aparecem em todas as outras telas. Quem chega sem elas lê
      // o resto sem entender, e não sabe que existe um lugar que explica.
      titulo: "Entenda o caso",
      linha: `${formatNumberBR(PERGUNTAS_PARAOPEBA.length)} perguntas e ${formatNumberBR(GLOSSARIO_PARAOPEBA.length)} termos`,
      texto:
        "O que é o Novo Auxílio Emergencial, o que era o PTR, o que significa zona quente — as siglas que aparecem em toda página deste bloco, explicadas em linguagem comum pelo painel de acompanhamento.",
      href: "/paraopeba/entenda",
      linkTexto: "Entender o caso →",
    },
    {
      titulo: "Clipping",
      linha: `${formatNumberBR(CLIPPING_PARAOPEBA.length)} notícias`,
      texto: `Cobertura de imprensa, institucional e de assessoria sobre o caso, de ${PERIODO_CLIPPING.de.slice(0, 4)} a ${PERIODO_CLIPPING.ate.slice(0, 4)} — filtrável por tipo e período, com link para a fonte original em cada item.`,
      href: "/paraopeba/clipping",
      linkTexto: "Ver o clipping →",
    },
    {
      titulo: "Linha do tempo",
      linha: `${formatNumberBR(MARCOS_PARAOPEBA.length)} marcos`,
      texto:
        "Do corte de 50% do auxílio, em março de 2025, à confirmação do pagamento de agosto de 2026 — cada decisão judicial e cada resposta da Vale, em ordem.",
      href: "/paraopeba/linha-do-tempo",
      linkTexto: "Ver a linha do tempo →",
    },
    {
      titulo: "Quem atua na reparação",
      linha: `${formatNumberBR(ATORES_REPARACAO.length)} órgãos e organizações`,
      texto: `Judiciário, Ministério Público, a gestora dos pagamentos e as organizações que assessoram quem foi atingido — ${tiposDeAtor.size} categorias diferentes, com contato direto.`,
      href: "/paraopeba/quem-atua",
      linkTexto: "Ver quem atua →",
    },
    {
      titulo: "Auxílio emergencial",
      linha: `${formatNumberBR(PAGAMENTOS_PARAOPEBA.length)} pagamentos mensais`,
      texto:
        "O Novo Auxílio Emergencial, pago pela FGV desde dezembro de 2025 — mês a mês, com os números-resumo e a fonte de cada um.",
      href: "/paraopeba/auxilio",
      linkTexto: "Ver o auxílio →",
    },
    {
      // Cartão do DINHEIRO. Vem depois do auxílio (que é o que chega na mão
      // da pessoa) e antes dos documentos, porque é a ponte entre os dois:
      // o auxílio é pagamento individual, isto é obra e serviço no município.
      titulo: "Execução por município",
      linha: `${formatNumberBR(MUNICIPIOS_EXECUCAO_FGV.length)} municípios, ${formatNumberBR(projetosDistintos)} projetos`,
      texto:
        "Quanto do Acordo já virou projeto e quanto já foi pago em cada município da bacia, pela auditoria independente da FGV — com a ressalva de que estes R$ 5,48 bi são os Anexos I.3/I.4, não os R$ 37,6 bi do Acordo inteiro.",
      href: "/paraopeba/execucao",
      linkTexto: "Ver a execução →",
    },
    {
      titulo: "Documentos do processo",
      linha: `${formatNumberBR(COBERTURA_DOCUMENTOS_PROCESSO.publicados)} documentos, ${COBERTURA_DOCUMENTOS_PROCESSO.percentualPublicado}% do acervo`,
      texto:
        "Documentos do processo judicial da reparação que citam cada município da bacia, direto do índice público da Plataforma Brumadinho UFMG — com link e citação em cada um.",
      href: "/paraopeba/documentos",
      linkTexto: "Ver os documentos →",
    },
    {
      // Cartão vizinho ao de "Documentos do processo", e o texto precisa
      // separar os dois logo na primeira linha: as duas rotas soam iguais e
      // guardam coisas opostas — lá são os autos, aqui é o que as ATIs
      // escreveram para quem foi atingido.
      titulo: "Biblioteca das assessorias",
      linha: `${formatNumberBR(COBERTURA_BIBLIOTECA.publicados)} publicações`,
      texto:
        "Cartilhas, boletins, jornais, rádio, vídeos e documentos técnicos publicados pelas próprias assessorias técnicas independentes — não são peças do processo, é o material que elas produziram para as pessoas atingidas. Só metadado e link: o arquivo abre no site da ATI.",
      href: "/paraopeba/biblioteca",
      linkTexto: "Ver a biblioteca →",
    },
    {
      // TERCEIRO cartão de documento, e o texto tem que dizer na primeira
      // linha de quem é a voz: nos autos falam as partes, na biblioteca falam
      // as assessorias, e aqui fala quem AUDITA os dois. Sem isso, "mais um
      // acervo de PDF" é tudo o que se lê.
      titulo: "Auditoria socioambiental independente",
      linha: `${formatNumberBR(AUDITORIA_AJRI.length)} documentos em ${formatNumberBR(INSTRUMENTO_AJRI_ORDEM.length)} instrumentos jurídicos`,
      texto: `Relatórios e notas técnicas da ${AUTOR_AUDITORIA_AJRI}, a auditoria independente prevista no Acordo de R$ 37,6 bilhões para fiscalizar a reparação — de ${PERIODO_AUDITORIA_AJRI.de.slice(0, 4)} a ${PERIODO_AUDITORIA_AJRI.ate.slice(0, 4)}. Catálogo e link: o documento abre no portal da própria auditoria, que exige cadastro.`,
      href: "/paraopeba/auditoria",
      linkTexto: "Ver a auditoria →",
    },
  ];

  // ⟲ 13/08, revisão de onboarding: era `<div>` — mesmo conserto aplicado
  // nas cinco subpáginas de /paraopeba e na home da marca (ver o
  // comentário em `paraopeba/clipping/page.tsx`): sem `<main>`,
  // `OuvirPagina.tsx` não achava texto e "Ouvir esta página" sumia bem
  // no hub desta frente.
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <header className="space-y-4">
        <p
          className="text-[.82em] font-semibold uppercase tracking-wide"
          style={{ color: ZONA.cor }}
        >
          {ZONA.etiqueta}
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{ZONA.titulo}</h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">{ZONA.descricao}</p>

        {/* Esta frente é a que mais depende de acervo de terceiro (7.107
            documentos do processo, dos quais 471 têm município identificado),
            e a que mais corre risco de ser lida como retrato completo. */}
        <AvisoColetaEmCurso escopo="Aqui isso é especialmente forte: dos 7.107 documentos do processo judicial, só 471 têm município identificado — o acervo mostra o que foi possível ler, não tudo o que existe nos autos." />
      </header>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {BLOCOS.map((b) => (
          <a
            key={b.titulo}
            href={b.href}
            className="cp-card-hover flex flex-col rounded-lg border border-border bg-surface p-5 transition-colors hover:border-current"
          >
            <h2 className="font-display text-lg font-semibold">{b.titulo}</h2>
            <p className="mt-1 font-medium" style={{ color: ZONA.cor }}>
              {b.linha}
            </p>
            <p className="mt-2 flex-1 text-[.92em] text-text-soft">{b.texto}</p>
            <p className="mt-3 text-[.85em] font-semibold" style={{ color: ZONA.cor }}>
              {b.linkTexto}
            </p>
          </a>
        ))}
      </div>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold">De onde vem o dado</h2>
        <p className="mt-2 max-w-2xl text-[.95em] text-text-soft">
          Clipping, linha do tempo, quem atua na reparação e auxílio emergencial vêm de um
          painel de acompanhamento entregue ao Controle Popular — acervo datado, sem
          atualização automática. O Instituto Guaicuy mantém o Painel da Reparação{" "}
          <a
            href="https://guaicuy.org.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            atualizado em guaicuy.org.br ↗
          </a>{" "}
          — é a fonte viva; aqui é o retrato auditável. Os documentos do processo vêm do
          índice público da{" "}
          <a
            href="http://plataforma.projetobrumadinho.ufmg.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            Plataforma Brumadinho UFMG ↗
          </a>{" "}
          (o domínio ainda não usa conexão segura).
        </p>
      </section>

      {/* ⟲ 13/08, revisão de onboarding: mesma lacuna do /funcaosocialterra
          — esta zona também não tem `layout.tsx` nem cabeçalho fixo com
          link para as outras frentes, então a remissão cruzada só existia
          no rodapé, depois de rolar a página inteira. */}
      <OutrasFrentes atual="paraopeba" />

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </main>
  );
}
