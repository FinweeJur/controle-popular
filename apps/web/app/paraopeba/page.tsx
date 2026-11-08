import type { Metadata } from "next";
import NextLink from "next/link";
import CaminhoSistema from "@/app/components/CaminhoSistema";
import FooterGlobal from "@/app/components/FooterGlobal";
// Data do dado publicada no hub: o carimbo `gerado_em` de `biblioteca-ati.json`,
// exposto por `coberturaBiblioteca()` — único acervo do hub com carimbo no arquivo.
import DataColeta from "@/app/components/DataColeta";
import OutrasFrentes from "@/app/components/OutrasFrentes";
import CartaoLitigiosTransnacionais from "@/app/components/CartaoLitigiosTransnacionais";
import HeaderFrenteBrasilComS from "@/app/components/HeaderFrenteBrasilComS";
import CenasDoBrasil from "@/app/components/CenasDoBrasil";
import AvisoColetaEmCurso from "@/app/components/AvisoColetaEmCurso";
import PassarelaLegislativa from "@/app/components/PassarelaLegislativa";
import CartaoTopico, { type Topico } from "@/app/components/wiki/CartaoTopico";
import { ZONAS } from "@/lib/zonas";
import { formatNumberBR } from "@/lib/betim/format";
import {
  COBERTURA_CLIPPING,
  PERIODO_CLIPPING,
  MARCOS_PARAOPEBA,
  ATORES_REPARACAO,
  PAGAMENTOS_PARAOPEBA,
} from "@/lib/paraopeba";
import { COBERTURA_DOCUMENTOS_PROCESSO } from "@/lib/paraopeba/documentos";
// Fora do barril de propósito: `biblioteca.ts` lê disco com `node:fs`, e o
// barril é importado por componente de cliente. Mesma razão de `radar.ts`.
import { coberturaBiblioteca } from "@/lib/paraopeba/biblioteca";
// Também fora do barril, por outra razão: o acervo da auditoria tem 336 KiB, e
// pô-lo em `@/lib/paraopeba` levaria esse peso a toda tela que importa o
// barril. A página usa só as CONTAGENS (`COBERTURA_AUDITORIA_AJRI`), e esta
// rota é servidor — nada disso vai para o payload (ver
// `docs/HANDOFF-PAYLOAD-LEGISLACAO.md`).
import {
  COBERTURA_AUDITORIA_AJRI,
  AUTOR_AUDITORIA_AJRI,
  PERIODO_AUDITORIA_AJRI,
} from "@/lib/paraopeba/auditoria-ajri";
import { GLOSSARIO_PARAOPEBA, PERGUNTAS_PARAOPEBA } from "@/lib/paraopeba/educacao";
// Fora do barril de propósito (ver o comentário em `lib/paraopeba/index.ts`):
// são 226 KB de dado gerado, e esta home só usa as contagens
// (`COBERTURA_EXECUCAO_FGV`).
import { COBERTURA_EXECUCAO_FGV } from "@/lib/paraopeba/execucao-fgv";
import { metadataEditavel } from "@/lib/edicoes";

/**
 * Home da frente /paraopeba — acompanhamento da reparação pelo rompimento
 * da barragem da Vale em Brumadinho (25/01/2019, 270 mortes).
 *
 * ═══ DUAS FONTES, NUNCA MISTURADAS ═══
 *
 * Clipping, linha do tempo, atores e auxílio vêm de um painel entregue à
 * mão pelo dev (`painel-paraopeba.html`) — acervo datado, sem API por
 * trás. Os documentos do processo vêm do índice Solr público da Plataforma
 * Brumadinho UFMG, cruzado por município via o campo `places` que a
 * própria UFMG preenche. `docs/PLANO-INGESTAO-PARAOPEBA.md` mede as duas.
 *
 * Nenhum número aqui é digitado — todos vêm da contagem real dos arquivos
 * de `lib/paraopeba/`.
 *
 * ═══ POR QUE ESTE HUB TEM SEÇÕES E ÂNCORAS (02/11/2026) ═══
 *
 * A frente tinha 18 `page.tsx`. A medição mostrou que quase todos têm dado
 * próprio: execução financeira, biblioteca das ATIs, auditoria da AECOM,
 * perícia da UFMG, série da VALE3 e os autos do processo são acervos
 * distintos, com vozes distintas. Fundi-los apagaria a diferença que a
 * própria tela da perícia explica.
 *
 * O que era recorte de fato virou seção ou faceta:
 *  - `/paraopeba/indice` era só uma lista de 12 links, sem dado. A lista
 *    está em `#indice`, com os mesmos títulos e descrições.
 *  - `/paraopeba/noticias-vale` e `/paraopeba/noticias` eram a mesma
 *    pergunta com coletores diferentes: hoje são `?fonte=` de uma URL só.
 * Todo o resto continua rota própria e é linkado daqui — nada foi apagado.
 */

export const metadata: Metadata = metadataEditavel("/paraopeba", {
  title: "Paraopeba — Controle Popular",
  description:
    "Acompanhamento da reparação pelo rompimento da barragem da Vale em Brumadinho: clipping de notícias, linha do tempo do processo, quem atua na reparação e o auxílio emergencial pago mês a mês.",
});

const ZONA = ZONAS.find((z) => z.id === "paraopeba")!;

interface BlocoHome {
  titulo: string;
  linha: string;
  texto: string;
  href: string;
  linkTexto: string;
}

interface GrupoHome {
  /** Âncora da seção (`#entenda`, `#acervos`…). */
  id: string;
  titulo: string;
  descricao: string;
  blocos: BlocoHome[];
}

type CoberturaBiblioteca = Awaited<ReturnType<typeof coberturaBiblioteca>>;

/**
 * O índice antigo (`/paraopeba/indice`) vivia num arquivo próprio e só listava
 * portas. Ele foi absorvido inteiro: mesmos títulos, mesmas descrições, agora
 * na seção `#indice`. O link para `/paraopeba` ficou porque era o que o índice
 * oferecia — é a única entrada que aponta para esta própria página.
 */
const TOPICOS: Topico[] = [
  {
    href: "/paraopeba",
    titulo: "Visão geral",
    descricao: "Panorama da reparação de Brumadinho.",
  },
  {
    href: "/paraopeba/analise",
    titulo: "Analise",
    descricao: "Análises sobre a reparação e o acordo.",
  },
  {
    href: "/paraopeba/auditoria",
    titulo: "Auditoria",
    descricao: "Auditorias e fiscalização da reparação.",
  },
  {
    href: "/paraopeba/auxilio",
    titulo: "Auxilio",
    descricao: "Auxílio emergencial e pagamentos às famílias atingidas.",
  },
  {
    href: "/paraopeba/biblioteca",
    titulo: "Biblioteca",
    descricao: "Documentos e publicacoes sobre a reparação.",
  },
  {
    href: "/paraopeba/clipping",
    titulo: "Clipping",
    descricao: "Notícias e cobertura de imprensa sobre Brumadinho.",
  },
  {
    href: "/paraopeba/documentos",
    titulo: "Documentos",
    descricao: "Documentos oficiais da reparação e do acordo.",
  },
  {
    href: "/paraopeba/entenda",
    titulo: "Entenda",
    descricao: "Como funciona a reparação e o Acordo de Brumadinho.",
  },
  {
    href: "/paraopeba/execucao",
    titulo: "Execução",
    descricao: "Execução do acordo e andamento das obrigações.",
  },
  {
    href: "/paraopeba/linha-do-tempo",
    titulo: "Linha do tempo",
    descricao: "Cronologia dos principais marcos desde 2019.",
  },
  {
    href: "/paraopeba/pericia",
    titulo: "Pericia",
    descricao: "Pareceres e perícias técnicas.",
  },
  {
    href: "/paraopeba/quem-atua",
    titulo: "Quem atua",
    descricao: "Entidades envolvidas na reparação.",
  },
];

// Os grupos em funções próprias: o corpo único passava do limite de linhas do
// CodeScene, e o acervo cresce. O texto de cada cartão fica colado ao dado que
// ele cita; a ordem dos grupos é a ordem de leitura.

function grupoEntenda(): GrupoHome {
  return {
    id: "entenda",
    titulo: "Entenda antes de ler o resto",
    descricao:
      "As siglas desta frente aparecem em todas as outras telas. Quem começa por aqui lê o resto sem tropeçar em NAE, PTR e ERSHRE.",
    blocos: [
      {
        // PRIMEIRO cartão de propósito: as siglas deste bloco (NAE, PTR,
        // ERSHRE, zona quente) aparecem em todas as outras telas. Quem chega
        // sem elas lê o resto sem entender, e não sabe que existe um lugar
        // que explica.
        titulo: "Entenda o caso",
        linha: `${formatNumberBR(PERGUNTAS_PARAOPEBA.length)} perguntas e ${formatNumberBR(GLOSSARIO_PARAOPEBA.length)} termos`,
        texto:
          "O que é o Novo Auxílio Emergencial, o que era o PTR, o que significa zona quente — as siglas que aparecem em toda página deste bloco, explicadas em linguagem comum pelo painel de acompanhamento.",
        href: "/paraopeba/entenda",
        linkTexto: "Entender o caso →",
      },
    ],
  };
}

function grupoTempo(): GrupoHome {
  return {
    id: "tempo",
    titulo: "O caso no tempo",
    descricao:
      "Do rompimento à última decisão: a linha do tempo e o acervo de imprensa que fecha numa data.",
    blocos: [
      {
        titulo: "Linha do tempo",
        linha: `${formatNumberBR(MARCOS_PARAOPEBA.length)} marcos`,
        texto:
          "Do corte de 50% do auxílio, em março de 2025, à confirmação do pagamento de agosto de 2026 — cada decisão judicial e cada resposta da Vale, em ordem.",
        href: "/paraopeba/linha-do-tempo",
        linkTexto: "Ver a linha do tempo →",
      },
      {
        titulo: "Clipping",
        linha: `${formatNumberBR(COBERTURA_CLIPPING.total)} notícias`,
        texto: `Cobertura de imprensa, institucional e de assessoria sobre o caso, de ${PERIODO_CLIPPING.de.slice(0, 4)} a ${PERIODO_CLIPPING.ate.slice(0, 4)} — filtrável por tipo e período, com link para a fonte original em cada item.`,
        href: "/paraopeba/clipping",
        linkTexto: "Ver o clipping →",
      },
    ],
  };
}

function grupoNoticias(): GrupoHome {
  return {
    id: "noticias",
    titulo: "O que saiu na imprensa",
    descricao:
      "Duas varreduras automáticas, sem curadoria: o caso na bacia e a companhia. Cada recorte mantém o próprio coletor e a própria ressalva.",
    blocos: [
      {
        titulo: "Notícias — bacia e Vale",
        linha: "2 varreduras automáticas",
        texto:
          "O radar da bacia acompanha matérias, decisões e atos sobre o caso; o da Vale acompanha quatro feeds públicos sobre a companhia. Ninguém leu nem resumiu: a tela mostra título, veículo, data e link.",
        href: "/paraopeba/noticias",
        linkTexto: "Ver as notícias →",
      },
    ],
  };
}

function grupoReparacao(): GrupoHome {
  const tiposDeAtor = new Set(ATORES_REPARACAO.map((a) => a.categoria)).size;
  return {
    id: "reparacao",
    titulo: "Quem atua e quanto já saiu",
    descricao:
      "A reparação tem gente, dinheiro individual e dinheiro municipal. São três recortes diferentes, com fontes diferentes.",
    blocos: [
      {
        titulo: "Quem atua na reparação",
        linha: `${formatNumberBR(ATORES_REPARACAO.length)} órgãos e organizações`,
        texto: `Judiciário, Ministério Público, a gestora dos pagamentos e as organizações que assessoram quem foi atingido — ${tiposDeAtor} categorias diferentes, com contato direto.`,
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
        linha: `${formatNumberBR(COBERTURA_EXECUCAO_FGV.municipios)} municípios, ${formatNumberBR(COBERTURA_EXECUCAO_FGV.projetosDistintos)} projetos`,
        texto:
          "Quanto do Acordo já virou projeto e quanto já foi pago em cada município da bacia, pela auditoria independente da FGV — com a ressalva de que estes R$ 5,48 bi são os Anexos I.3/I.4, não os R$ 37,6 bi do Acordo inteiro.",
        href: "/paraopeba/execucao",
        linkTexto: "Ver a execução →",
      },
      {
        // A página geral de jurisprudência é uma só para os dois desastres;
        // este cartão abre com o recorte do TJMG já selecionado na query.
        titulo: "Jurisprudência do Brumadinho",
        linha: "2.970 acórdãos do TJMG, filtráveis",
        texto:
          "As decisões de 2ª instância de Minas Gerais sobre o rompimento da barragem da Mina Córrego do Feijão — polo vencedor, resultado do recurso, temas, danos PNAB/PEAB e valores. A mesma página mostra o Fundão (TJES), com filtro por tribunal e estado.",
        href: "/jurisprudencia?tribunal=TJMG&estado=MG#lista",
        linkTexto: "Ver a jurisprudência →",
      },
    ],
  };
}

function grupoAcervos(cob: CoberturaBiblioteca): GrupoHome {
  return {
    id: "acervos",
    titulo: "Os quatro acervos de documento",
    descricao:
      "São quatro, e confundir os quatro apaga quem fala: nos autos falam as partes, na biblioteca falam as assessorias, na auditoria fala quem fiscaliza e na perícia falam os pesquisadores.",
    blocos: [
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
        linha: `${formatNumberBR(cob.publicados)} publicações`,
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
        linha: `${formatNumberBR(COBERTURA_AUDITORIA_AJRI.total)} documentos em ${formatNumberBR(COBERTURA_AUDITORIA_AJRI.instrumentos)} instrumentos jurídicos`,
        texto: `Relatórios e notas técnicas da ${AUTOR_AUDITORIA_AJRI}, a auditoria independente prevista no Acordo de R$ 37,6 bilhões para fiscalizar a reparação — de ${PERIODO_AUDITORIA_AJRI.de.slice(0, 4)} a ${PERIODO_AUDITORIA_AJRI.ate.slice(0, 4)}. Catálogo e link: o documento abre no portal da própria auditoria, que exige cadastro.`,
        href: "/paraopeba/auditoria",
        linkTexto: "Ver a auditoria →",
      },
      {
        // O QUARTO acervo e o mais fácil de confundir com `/documentos`:
        // as duas páginas dizem "UFMG". Aqui é o que os PESQUISADORES
        // mediram sob encomenda do juízo; lá é peça de processo.
        titulo: "Perícia judicial da UFMG",
        linha: "O que os pesquisadores mediram",
        texto:
          "A perícia técnica determinada pelo juízo sobre os efeitos do rompimento da Barragem I: os documentos de resultado, a síntese cruzada com a auditoria e o acervo completo, com o rótulo do que é laudo e do que é edital.",
        href: "/paraopeba/pericia",
        linkTexto: "Ver a perícia →",
      },
    ],
  };
}

function grupoAnalises(): GrupoHome {
  return {
    id: "analises",
    titulo: "Análises que cruzam as fontes",
    descricao:
      "O que cada acervo diz sobre o mesmo eixo — e, principalmente, onde só um deles falou. Co-ocorrência temática não é causalidade.",
    blocos: [
      {
        // Vem DEPOIS dos três acervos de documento de propósito: só faz sentido
        // quando o leitor já sabe que existem vozes diferentes. É o único cartão
        // que não abre um acervo — cruza os três e mostra onde eles NÃO se
        // encontram.
        titulo: "Análise integrada",
        linha: "Os eixos da auditoria, cruzados com a perícia da UFMG e as assessorias",
        texto:
          "O que cada fonte diz sobre o mesmo eixo — e, principalmente, onde só uma delas falou. Um único eixo tem as três fontes; doze têm só a auditoria. É co-ocorrência temática, não causalidade: a auditoria e uma assessoria tratarem do mesmo assunto não quer dizer que uma respondeu à outra.",
        href: "/paraopeba/analise",
        linkTexto: "Ver a análise integrada →",
      },
    ],
  };
}

function grupoVale(): GrupoHome {
  return {
    id: "vale",
    titulo: "A Vale, como empresa",
    descricao:
      "Preço de ação não mede dano nem reparação: é contexto de mercado. Os documentos societários e a correlação com notícias ficam aqui, separados do caso.",
    blocos: [
      {
        titulo: "Ações da Vale na B3",
        linha: "VALE3, 2015–2026",
        texto:
          "O fechamento de VALE3, pregão a pregão, com os rompimentos de Fundão e Brumadinho e o Acordo de reparação marcados na série. Preços brutos, sem ajuste por proventos — e o aviso de que a ação não mede o dano.",
        href: "/paraopeba/vale",
        linkTexto: "Ver as cotações →",
      },
      {
        titulo: "Documentos da Vale na CVM",
        linha: "ITR, DFP e FRE",
        texto:
          "O que a companhia protocolou na Comissão de Valores Mobiliários: informações trimestrais, demonstrações financeiras e o formulário de referência, com link para o documento original.",
        href: "/paraopeba/vale/documentos",
        linkTexto: "Ver os documentos →",
      },
      {
        titulo: "Preços × notícias",
        linha: "VALE3 e SGML, com janela declarada",
        texto:
          "Os movimentos significativos de preço cruzados com as notícias publicadas na janela ao redor da data. É correlação temporal, não causa: a página diz isso antes da primeira tabela.",
        href: "/paraopeba/correlacao",
        linkTexto: "Ver a correlação →",
      },
    ],
  };
}

function montarGrupos(cob: CoberturaBiblioteca): GrupoHome[] {
  return [
    grupoEntenda(),
    grupoTempo(),
    grupoNoticias(),
    grupoReparacao(),
    grupoAcervos(cob),
    grupoAnalises(),
    grupoVale(),
  ];
}

function GradeBlocos({ blocos }: { blocos: BlocoHome[] }) {
  return (
    <div className="mt-5 grid gap-5 sm:grid-cols-2">
      {blocos.map((b) => (
        <NextLink
          key={`${b.href}-${b.titulo}`}
          href={b.href}
          className="cp-card-hover flex flex-col rounded-lg border border-border bg-surface p-5 transition-colors hover:border-current"
        >
          <h3 className="font-display text-lg font-semibold">{b.titulo}</h3>
          <p className="mt-1 font-medium" style={{ color: ZONA.cor }}>
            {b.linha}
          </p>
          <p className="mt-2 flex-1 text-[.92em] text-text-soft">{b.texto}</p>
          <p className="mt-3 text-[.85em] font-semibold" style={{ color: ZONA.cor }}>
            {b.linkTexto}
          </p>
        </NextLink>
      ))}
    </div>
  );
}

/** Âncoras da página. O texto do link é o título da seção, não um número. */
function NavegacaoInterna({ grupos }: { grupos: GrupoHome[] }) {
  return (
    <nav
      id="navegacao"
      aria-label="Nesta página"
      className="mt-8 scroll-mt-24 rounded-2xl border border-border bg-surface-2 p-4"
    >
      <p className="text-sm font-semibold text-text">Nesta página</p>
      <ul className="mt-2 flex flex-wrap gap-2 text-sm">
        {grupos.map((grupo) => (
          <li key={grupo.id}>
            <a
              href={`#${grupo.id}`}
              className="inline-block rounded-full border border-border px-3 py-1 hover:border-primary"
            >
              {grupo.titulo} ↓
            </a>
          </li>
        ))}
        <li>
          <a
            href="#indice"
            className="inline-block rounded-full border border-border px-3 py-1 hover:border-primary"
          >
            Índice da frente ↓
          </a>
        </li>
        <li>
          <a
            href="#paginas-irmas"
            className="inline-block rounded-full border border-border px-3 py-1 hover:border-primary"
          >
            Páginas irmãs ↓
          </a>
        </li>
      </ul>
    </nav>
  );
}

/** "Subir" no fim de cada seção — âncora crua, sem JavaScript. */
function Subir() {
  return (
    <p className="mt-4 text-sm">
      <a href="#navegacao" className="underline">
        ↑ Subir ao índice desta página
      </a>
    </p>
  );
}

function SecoesDaFrente({ grupos }: { grupos: GrupoHome[] }) {
  return (
    <>
      {grupos.map((grupo) => (
        <section
          key={grupo.id}
          id={grupo.id}
          aria-labelledby={`${grupo.id}-titulo`}
          className="mt-10 scroll-mt-24 border-t border-border pt-8"
        >
          <h2 id={`${grupo.id}-titulo`} className="font-display text-xl font-semibold">
            {grupo.titulo}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-text-soft">{grupo.descricao}</p>
          <GradeBlocos blocos={grupo.blocos} />
          <Subir />
        </section>
      ))}
    </>
  );
}

/* ═══ ÍNDICE ABSORVIDO DE `/paraopeba/indice` ═══
    A rota antiga era só esta lista. Ela continua inteira: mesmos títulos,
    mesmas descrições, mesma ordem de antes. */
function SecaoIndice() {
  return (
    <section
      id="indice"
      aria-labelledby="indice-titulo"
      className="mt-10 scroll-mt-24 border-t border-border pt-8"
    >
      <h2 id="indice-titulo" className="font-display text-xl font-semibold">
        Índice da frente
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-text-soft">
        A lista que antes vivia em <code className="rounded bg-surface-2 px-1 py-0.5">/paraopeba/indice</code>{" "}
        — mesma descrição de cada porta, agora dentro do hub.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOPICOS.map((topico) => (
          <CartaoTopico key={topico.href} topico={topico} />
        ))}
      </div>
      <Subir />
    </section>
  );
}

/* ═══ PÁGINAS IRMÃS ═══
    O que continua rota própria, para o leitor chegar sem passar pelo cartão.
    Inclui as duas rotas absorvidas, apontando para o destino novo — link
    antigo não pode virar beco. */
function SecaoPaginasIrmas() {
  const irmas = [
    { href: "/paraopeba/execucao", rotulo: "Execução por município" },
    { href: "/paraopeba/auxilio", rotulo: "Auxílio emergencial" },
    { href: "/paraopeba/quem-atua", rotulo: "Quem atua" },
    { href: "/paraopeba/linha-do-tempo", rotulo: "Linha do tempo" },
    { href: "/paraopeba/clipping", rotulo: "Clipping" },
    { href: "/paraopeba/noticias?fonte=bacia", rotulo: "Notícias — bacia" },
    { href: "/paraopeba/noticias?fonte=vale", rotulo: "Notícias — Vale" },
    { href: "/paraopeba/documentos", rotulo: "Documentos do processo" },
    { href: "/paraopeba/biblioteca", rotulo: "Biblioteca das assessorias" },
    { href: "/paraopeba/auditoria", rotulo: "Auditoria independente" },
    { href: "/paraopeba/pericia", rotulo: "Perícia da UFMG" },
    { href: "/paraopeba/analise", rotulo: "Análise integrada" },
    { href: "/paraopeba/vale", rotulo: "Ações da Vale" },
    { href: "/paraopeba/vale/documentos", rotulo: "Documentos da Vale na CVM" },
    { href: "/paraopeba/correlacao", rotulo: "Preços × notícias" },
    { href: "/paraopeba/entenda", rotulo: "Entenda o caso" },
  ];

  return (
    <section
      id="paginas-irmas"
      aria-labelledby="paginas-irmas-titulo"
      className="mt-10 scroll-mt-24 border-t border-border pt-8"
    >
      <h2 id="paginas-irmas-titulo" className="font-display text-xl font-semibold">
        Páginas irmãs
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-text-soft">
        As telas desta frente que continuam em endereço próprio, cada uma com o dado que só ela
        tem. As duas que eram só recorte agora estão acima ou no painel de notícias.
      </p>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {irmas.map((item) => (
          <li key={item.href}>
            <NextLink href={item.href} className="underline">
              {item.rotulo}
            </NextLink>
          </li>
        ))}
      </ul>
      <Subir />
    </section>
  );
}

export default async function ParaopebaHome() {
  const cob = await coberturaBiblioteca();
  // 455 linhas de status descrevem 234 projetos — um projeto que alcança 25
  // cidades aparece 25 vezes. O cartão mostra o distinto, nunca o `length`
  // (medido em `COBERTURA_EXECUCAO_FGV`, travado por teste).

  const grupos = montarGrupos(cob);

  // ⟲ 13/08, revisão de onboarding: era `<div>` — mesmo conserto aplicado
  // nas cinco subpáginas de /paraopeba e na home da marca (ver o
  // comentário em `paraopeba/clipping/page.tsx`): sem `<main>`,
  // `OuvirPagina.tsx` não achava texto e "Ouvir esta página" sumia bem
  // no hub desta frente.
  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <CaminhoSistema rota="/paraopeba" />

      <HeaderFrenteBrasilComS
        etiqueta={ZONA.etiqueta}
        titulo={ZONA.titulo}
        descricao={ZONA.descricao}
        cor={ZONA.cor}
        idFotoBrasilComS="00085"
      >
        <AvisoColetaEmCurso escopo="Aqui isso é especialmente forte: dos 7.107 documentos do processo judicial, só 471 têm município identificado — o acervo mostra o que foi possível ler, não tudo o que existe nos autos." />
      </HeaderFrenteBrasilComS>

      <CartaoLitigiosTransnacionais />

      <DataColeta coletadoEm={cob.geradoEm} fonte="ATI — Biblioteca das assessorias (acervo Pró-Brumadinho)" />

      <NavegacaoInterna grupos={grupos} />

      <SecoesDaFrente grupos={grupos} />
      <SecaoIndice />
      <SecaoPaginasIrmas />

      {/* Passarela de Legislação e Projetos de Lei */}
      <PassarelaLegislativa tema="paraopeba" />

      <DeOndeVem />
      <OutrasFrentes atual="paraopeba" />
      <CenasDoBrasil fotos={["00397", "00410"]} />

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </main>
  );
}

function DeOndeVem() {
  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="font-display text-xl font-semibold">De onde vem o dado</h2>
      <p className="mt-2 max-w-2xl text-[.95em] text-text-soft">
        Clipping, linha do tempo, quem atua na reparação e auxílio emergencial vêm de um painel de
        acompanhamento entregue ao Controle Popular — acervo datado, sem atualização automática. O
        Instituto Guaicuy mantém o Painel da Reparação{" "}
        <a
          href="https://guaicuy.org.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-accent hover:underline"
        >
          atualizado em guaicuy.org.br ↗
        </a>{" "}
        — é a fonte viva; aqui é o retrato auditável. Os documentos do processo vêm do índice
        público da{" "}
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
  );
}
