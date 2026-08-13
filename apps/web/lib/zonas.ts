/**
 * As frentes do Controle Popular, em UM lugar só.
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
 *
 * NENHUM texto aqui diz quantas frentes existem. A contagem sai de
 * `ZONAS_PUBLICADAS.length` nas telas — quando o /ambiental publicar, não
 * há uma frase "as três frentes" para alguém esquecer de corrigir.
 */

// De `taxa-erro-g0.ts` e NÃO de `betim/terras.ts`, que reexporta a mesma
// constante: aquele arquivo abre com `import * as q from "@/lib/db/queries/
// terras"`, e este aqui é lido por toda página do portal. Importar de lá
// arrastaria a camada de banco para dentro de tudo — foi esse acoplamento que
// fez alguém copiar o número à mão em vez de importá-lo.
import { TAXA_ERRO_G0 } from "@/lib/betim/taxa-erro-g0";

export type ZonaId =
  | "cidades"
  | "congresso"
  | "judiciario"
  | "ambiental"
  | "terras";

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
  /**
   * `false` = a zona existe no código e é navegável por URL direta, mas não
   * aparece na home nem na remissão cruzada.
   *
   * Existe porque a zona nova é construída em fases (F1 arma o andaime, F9
   * publica) e o andaime precisa das mesmas edições cross-zone desde o
   * começo — a alternativa seria fazê-las no fim, tudo de uma vez, que é
   * exatamente quando um `basePath` copiado errado passa despercebido.
   * Um booleano é mais honesto do que manter a entrada comentada.
   */
  publicada: boolean;
}

export const ZONAS: Zona[] = [
  {
    id: "cidades",
    // A zona é MULTI-CIDADE desde que BH e São Paulo entraram no ar. O texto
    // aqui dizia "Betim-MG", "Câmara de Betim" e "os 23 vereadores" — número
    // de UMA das três câmaras, apresentado como se fosse o da zona. A home
    // lista as cidades a partir do banco (`listarCidades`); este `href` fica
    // como destino de fallback para quem renderiza o card como link único.
    href: "/betim",
    etiqueta: "Municipal · Prefeituras e Câmaras",
    titulo: "Para onde vai o dinheiro da sua cidade",
    descricao:
      "Contratos, fornecedores, orçamento, obras e a atuação de cada vereador — com os serviços do dia a dia reunidos no mesmo lugar.",
    resumo:
      "Para onde vai o dinheiro da cidade: contratos, orçamento, obras e a atuação de cada vereador.",
    itens: [
      "Contratos e licitações com alertas de risco",
      "Ranking de atuação de cada vereador",
      "Leis municipais lidas por direito afetado",
      "Saúde, educação e economia em dados",
    ],
    cor: "var(--cp-primary)",
    publicada: true,
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
    publicada: true,
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
    // O literal de fallback saiu: `--cp-secondary` agora está DEFINIDA nos
    // três blocos de tema do `globals.css`. Não era detalhe de estilo — o
    // #7c3aed que a variável nunca definida deixava passar dava 2,99:1 sobre
    // a surface do tema escuro e 5,70:1 no alto contraste, que exige 7:1.
    cor: "var(--cp-secondary)",
    publicada: true,
  },
  {
    id: "ambiental",
    href: "/ambiental",
    etiqueta: "Estadual · Meio ambiente em Minas Gerais",
    titulo: "O que o COPAM vai decidir sobre a sua cidade",
    // CÓPIA CORTADA PARA O QUE EXISTE, ao publicar a zona em 2026-08-09;
    // ATUALIZADA em 2026-08-11 conforme cada fase ganhou tela e dado real
    // (F3 COPAM, F4 licenciamento, F5 barragens, F6 legislação — as quatro
    // no ar no mesmo dia, migrations 0058/0064/0057+0049+0051/0065).
    // Mesma disciplina de sempre: cortar pro que existe, atualizar quando
    // deixa de ser promessa.
    descricao:
      "A pauta de cada reunião do COPAM, item a item, com o município que cada processo trata. Licenciamento ambiental e situação das barragens de Minas Gerais, por município. Leis, decretos, deliberações e portarias ambientais de três fontes que não conversam entre si, numa busca só.",
    resumo:
      "COPAM, licenciamento, barragens e legislação ambiental de Minas Gerais — as quatro frentes com dado real, num lugar só.",
    itens: [
      "COPAM: pauta de cada reunião, item a item, por município",
      "Licenciamento ambiental: filtro por município, setor e classe de risco",
      "Barragens: FEAM e SNISB lado a lado, por município",
      "Legislação ambiental: busca por palavra-chave, fonte, tipo e ano",
    ],
    cor: "var(--cp-tertiary)",
    publicada: true,
  },
  {
    id: "terras",
    href: "/funcaosocialterra",
    etiqueta: "Fundiário e território · Minas Gerais",
    titulo: "De quem é a terra que ninguém declarou",
    // ⟲ 13/08: A ETIQUETA DIZIA "Vale do Jequitinhonha" E ENVELHECEU NO
    // MESMO DIA. O mapa passou a carregar camadas de alcance ESTADUAL — 16
    // terras indígenas da FUNAI (todas as fases), ZAS e mancha de inundação
    // de 156 barragens da FEAM, e as 54.920 poligonais do SIGMINE separadas
    // entre operação e interesse. Anunciar um vale só passou a ESCONDER o
    // que existe, que é o erro inverso do que a disciplina abaixo evita — e
    // igualmente feio.
    //
    // MESMA DISCIPLINA DO CARD DO /ambiental LOGO ACIMA, e ela não mudou: o
    // texto descreve o que existe, não o que se pretende. O que é estadual
    // aparece como estadual; o VAZIO CADASTRAL continua sendo TRÊS cidades e
    // continua dito como três, porque é o recorte que tem número medido. O
    // foco da verificação cadastral é Jequitinhonha, Mucuri e a bacia do
    // Paraopeba — dizer isso é mais honesto que "Minas inteira" e mais útil
    // que "um vale".
    //
    // E cita a taxa de erro no próprio card. É o único dado do portal que é
    // estimativa de método próprio, não leitura de fonte oficial; anunciá-lo
    // sem a margem, mesmo na vitrine, seria cobrar dos outros o que não se
    // faz em casa.
    // ⟲ A TAXA VEM DA CONSTANTE, e não digitada aqui. Até 12/08 esta frase
    // trazia "30%" escrito à mão, enquanto `TAXA_ERRO_G0` era lida por um
    // único componente — exatamente o modo de falha que o cabeçalho daquela
    // constante jurava impedir ("a tela por cidade e o hub da zona não podem
    // divergir"). Este card é o texto que mais gente lê, e teria continuado
    // anunciando 30% em silêncio na próxima rodada do gate.
    descricao:
      `Quanto do território de Araçuaí, Diamantina e Itinga não tem imóvel rural declarado no Cadastro Ambiental Rural. É estimativa com taxa de erro medida — ${TAXA_ERRO_G0.taxaPct.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}% da amostra checada a olho não se confirmou — e vem publicada com ela ao lado.`,
    resumo:
      "Mapa 3D de Minas Gerais — terra indígena, barragem e mineração no estado inteiro; o vazio cadastral, com a taxa de erro ao lado, em três cidades do Jequitinhonha.",
    itens: [
      "Terra indígena, mancha de barragem e mineração, em Minas inteira",
      "Área sem imóvel rural declarado no CAR, por cidade",
      "Denominador explícito: o município inteiro, pela malha do IBGE",
      "Taxa de erro medida a olho em 40 polígonos sorteados",
    ],
    cor: "var(--cp-accent)",
    publicada: true,
  },
];

/**
 * O que a home e a remissão cruzada mostram. Toda tela voltada ao público
 * lê ESTA lista, não a `ZONAS` — que existe para o scaffold e os testes.
 */
export const ZONAS_PUBLICADAS: Zona[] = ZONAS.filter((z) => z.publicada);

/** As outras frentes publicadas, preservando a ordem de `ZONAS`. */
export function outrasZonas(atual: ZonaId): Zona[] {
  return ZONAS_PUBLICADAS.filter((z) => z.id !== atual);
}
