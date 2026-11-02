/**
 * @file Mapa das áreas do painel da Prefeitura, uma entrada por recorte.
 *
 * O QUE E: a lista das seis áreas que substituem a fila de abas do antigo
 * `/[municipio]/prefeitura`. Cada área diz o rótulo do botão de faceta, o
 * título da seção e quais TELAS ela reúne — tela é uma rota viva da família
 * (`/prefeitura/contratos`) ou um bloco que foi absorvido pelo painel
 * (diárias, hoje).
 *
 * POR QUE OS NÚMEROS DO BOTÃO SAEM DAQUI: `PainelFacetas` exige o N ao lado de
 * cada faceta e o denominador do "Todas". O único N que este painel pode
 * afirmar sem inventar é a quantidade de telas que ele de fato entrega — o
 * botão "Pessoal · 2" abre uma seção com exatamente duas telas listadas.
 * Contagem de registro (contrato, obra, servidor) só entra em cena dentro da
 * tela de origem, que é quem mede o dado.
 *
 * O QUE NÃO ENTROU AQUI, DE PROPÓSITO: `/prefeitura/legislacao` já é ponte
 * para `/camara/legislacao` desde 2026-08-07 (o acervo normativo é da Câmara),
 * então não é tela da Prefeitura; e `/prefeitura/diarias` foi absorvido pelo
 * bloco de diárias desta página. `areas.test.ts` guarda as duas regras.
 *
 * FONTE: nenhuma. É estrutura de navegação; os hrefs apontam para rotas do
 * próprio portal.
 */

/** Uma tela que a área entrega: rota viva ou bloco deste painel. */
export interface TelaDaArea {
  slug: string;
  titulo: string;
  /** Uma linha sobre o que a tela mostra. */
  descricao: string;
  /**
   * Caminho relativo à cidade (`/prefeitura/contratos`). `null` significa que
   * a tela mora neste painel e o link é âncora (`ancora`).
   */
  href: string | null;
  /** Id do bloco na própria página, quando `href` é `null`. */
  ancora?: string;
}

export interface AreaPainel {
  slug: string;
  /** Texto curto do botão de faceta. */
  rotulo: string;
  titulo: string;
  descricao: string;
  telas: TelaDaArea[];
}

/**
 * Ordem de leitura do painel: dinheiro → compras → pessoal → obras → cultura →
 * diário. É a ordem em que as seções aparecem no HTML (e portanto a ordem dos
 * links "descer"), então mudar aqui muda a página inteira de uma vez.
 */
export const AREAS: readonly AreaPainel[] = [
  {
    slug: "dinheiro",
    rotulo: "Dinheiro",
    titulo: "Dinheiro: o que entrou e o que foi pago",
    descricao:
      "Caixa disponível, receita realizada, custo por habitante e despesa por função — o retrato financeiro do ano mais recente que a fonte publica.",
    telas: [
      {
        slug: "despesas",
        titulo: "Despesas por função",
        descricao: "Cada área de gasto, com filtro por ano e a fatia do total.",
        href: "/prefeitura/despesas",
      },
    ],
  },
  {
    slug: "compras",
    rotulo: "Compras",
    titulo: "Compras e contratos",
    descricao:
      "Do edital ao contrato assinado: processos de licitação, contratos publicados no PNCP e quem mais recebeu.",
    telas: [
      {
        slug: "contratos",
        titulo: "Contratos públicos",
        descricao:
          "Fornecedores, valores, alertas e série por ano, com busca, filtro e exportação.",
        href: "/prefeitura/contratos",
      },
      {
        slug: "licitacoes",
        titulo: "Licitações",
        descricao:
          "A fase anterior ao contrato: editais, modalidades e situação de cada processo.",
        href: "/prefeitura/licitacoes",
      },
      {
        slug: "fornecedores",
        titulo: "Maiores fornecedores",
        descricao:
          "Ranking por CNPJ, valor total, número de contratos e concentração do gasto.",
        href: "/prefeitura/fornecedores",
      },
    ],
  },
  {
    slug: "pessoal",
    rotulo: "Pessoal",
    titulo: "Pessoal e viagens",
    descricao:
      "Quem trabalha na Prefeitura e quem viajou a serviço. Diária e passagem aérea são rubricas diferentes e aparecem separadas.",
    telas: [
      {
        slug: "servidores",
        titulo: "Servidores",
        descricao: "Nome, cargo, lotação e vínculo, com busca — sem remuneração individual.",
        href: "/prefeitura/servidores",
      },
      {
        slug: "diarias",
        titulo: "Diárias e viagens oficiais",
        descricao: "Quem viajou, para onde, por quê e quanto custou, nesta página.",
        href: null,
        ancora: "diarias",
      },
    ],
  },
  {
    slug: "obras",
    rotulo: "Obras",
    titulo: "Obras públicas",
    descricao:
      "Objeto, situação, valor previsto e percentual executado — e o que a fonte de cada cidade não publica.",
    telas: [
      {
        slug: "obras",
        titulo: "Obras públicas",
        descricao: "A lista completa, com filtro por situação de execução.",
        href: "/prefeitura/obras",
      },
    ],
  },
  {
    slug: "cultura",
    rotulo: "Cultura",
    titulo: "Cultura, esporte e lazer",
    descricao:
      "Dois números diferentes, cada um com a sua fonte: a despesa oficial da função orçamentária Cultura e os contratos do PNCP classificados como cultura, esporte ou lazer.",
    telas: [
      {
        slug: "cultura",
        titulo: "Cultura",
        descricao:
          "Gasto oficial ano a ano, contratos do setor e o cruzamento com a Lei Rouanet.",
        href: "/prefeitura/cultura",
      },
    ],
  },
  {
    slug: "diario",
    rotulo: "Diário Oficial",
    titulo: "Diário Oficial",
    descricao:
      "Atos, decretos, editais e extratos publicados na imprensa oficial do município, classificados por tipo.",
    telas: [
      {
        slug: "diario",
        titulo: "Diário Oficial",
        descricao: "Busca, filtro por tipo e exportação das matérias catalogadas.",
        href: "/prefeitura/diario",
      },
    ],
  },
];

/** Todas as telas do painel, achatadas — usado pelo rodapé de páginas irmãs. */
export const TELAS: readonly TelaDaArea[] = AREAS.flatMap((area) => area.telas);

/**
 * Denominador do botão "Todas": a soma real das telas dos seis recortes.
 *
 * É calculado, nunca digitado — trocar uma tela de área não pode deixar o
 * botão dizendo um número que a página não entrega.
 */
export const TOTAL_DE_TELAS: number = TELAS.length;

/** Área válida pelo `?area=`, ou `undefined` (= "Todas"). */
export function areaPorSlug(slug?: string | string[]): AreaPainel | undefined {
  if (typeof slug !== "string") return undefined;
  return AREAS.find((area) => area.slug === slug);
}

/**
 * URL do recorte, relativa à cidade. O `#area-<slug>` não é enfeite: é o que
 * faz o link funcionar também no alvo estático, onde `?area=` não chega ao
 * servidor — o leitor cai no painel completo e a âncora o leva à seção certa.
 */
export function hrefDaArea(slug: string): string {
  return `/prefeitura?area=${slug}#area-${slug}`;
}
