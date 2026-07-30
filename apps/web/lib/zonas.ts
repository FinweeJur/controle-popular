/**
 * As três frentes do Controle Popular, em UM lugar só.
 *
 * Existe para que a home da marca (`app/page.tsx`) e o rodapé de remissão
 * cruzada de cada zona (`app/components/OutrasFrentes.tsx`) descrevam as
 * frentes com o MESMO texto. Duplicar essa cópia em quatro páginas garantia
 * deriva: alguém corrigiria um número numa e não nas outras — o mesmo
 * motivo pelo qual a rubrica do Congresso vive num JSON único em vez de
 * estar repetida no prompt e no cálculo.
 *
 * `href` é caminho ABSOLUTO e deve ser usado com `<a>` cru, nunca com o
 * `<Link>` de zona (`lib/link-zona.tsx`): o wrapper prefixaria a zona atual
 * e geraria `/congresso/judiciario`. É a classe de bug que os comentários
 * do `next.config.ts` registram já ter acontecido três vezes.
 */

export type ZonaId = "cidades" | "congresso" | "judiciario";

export interface Zona {
  id: ZonaId;
  href: string;
  etiqueta: string;
  titulo: string;
  /** Frase longa, para os cards grandes da home da marca. */
  descricao: string;
  /** Frase curta, para o bloco de remissão no pé das zonas. */
  resumo: string;
  itens: string[];
  cor: string;
}

export const ZONAS: Zona[] = [
  {
    id: "cidades",
    href: "/betim",
    etiqueta: "Municipal · Betim-MG",
    titulo: "Prefeitura e Câmara de Betim",
    descricao:
      "Para onde vai o dinheiro da cidade: contratos, fornecedores, orçamento, obras e a atuação de cada vereador — com serviços do dia a dia reunidos no mesmo lugar.",
    resumo:
      "Para onde vai o dinheiro da cidade: contratos, orçamento, obras e a atuação de cada vereador.",
    itens: [
      "Contratos e licitações com alertas de risco",
      "Ranking de atuação dos 23 vereadores",
      "Saúde, educação e economia em dados",
      "Farmácias de plantão, coleta de lixo, postos",
    ],
    cor: "var(--cp-primary)",
  },
  {
    id: "congresso",
    href: "/congresso",
    etiqueta: "Federal · Congresso Nacional",
    titulo: "O que o Congresso decide sobre seus direitos",
    descricao:
      "Projetos de lei federais por tema, comissão e bancada, com uma análise fundamentada de quais direitos cada proposta amplia ou restringe — e o ofício pronto para você se manifestar.",
    resumo:
      "Quais direitos cada projeto de lei federal amplia ou restringe — e o ofício pronto para se manifestar.",
    itens: [
      "5.500+ proposições de 2026 acompanhadas",
      "Análise garantista × reducionista auditável",
      "Comissões e frentes parlamentares",
      "Gera ofício de apoio ou repúdio em PDF",
    ],
    cor: "var(--cp-accent)",
  },
  {
    id: "judiciario",
    href: "/judiciario",
    etiqueta: "Judiciário · Tribunais superiores",
    titulo: "Quem ocupa, quem indicou, quando vaga",
    descricao:
      "O único Poder cujos membros ninguém elege. Composição de cada tribunal, quem indicou cada ministro, e a data em que cada um é obrigado a se aposentar — calculada, não estimada.",
    resumo:
      "O único Poder que ninguém elege: quem ocupa cada cadeira, quem indicou e quando vaga.",
    itens: [
      "Data de aposentadoria de cada ministro (75 anos, por lei)",
      "Quantas cadeiras cada Presidente já indicou",
      "Toda indicação enviada ao Senado, aprovada ou rejeitada",
      "Origem de cada cadeira: carreira, OAB ou Ministério Público",
    ],
    cor: "var(--cp-secondary, #7c3aed)",
  },
];

/** As outras duas frentes, preservando a ordem de `ZONAS`. */
export function outrasZonas(atual: ZonaId): Zona[] {
  return ZONAS.filter((z) => z.id !== atual);
}
