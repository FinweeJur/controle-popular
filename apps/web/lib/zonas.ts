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
  | "terras"
  | "paraopeba";

export interface Zona {
  id: ZonaId;
  href: string;
  etiqueta: string;
  /**
   * Nome curto da frente, para menu e rodapé — onde só cabe uma palavra ou
   * duas e o leitor precisa saber PARA ONDE vai.
   *
   * ⟲ 13/08: existe porque o rodapé estava fabricando esse nome cortando a
   * `etiqueta` no "·". O corte produzia "Estadual" para a frente ambiental,
   * que não diz nada — a matéria (meio ambiente em Minas) mora justamente na
   * metade que o corte jogava fora. "Municipal" e "Federal" saíam igualmente
   * vagos. Rótulo de navegação é decisão editorial; derivar por cirurgia de
   * string entrega o que sobrou, não o que se quis dizer.
   */
  nomeCurto: string;
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
    nomeCurto: "Cidades",
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
    nomeCurto: "Congresso",
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
    nomeCurto: "Judiciário",
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
    nomeCurto: "Meio ambiente",
    titulo: "Quem decide o que pode ser feito com o meio ambiente daqui",
    // CÓPIA CORTADA PARA O QUE EXISTE, ao publicar a zona em 2026-08-09;
    // ATUALIZADA em 2026-08-11 conforme cada fase ganhou tela e dado real
    // (F3 COPAM, F4 licenciamento, F5 barragens, F6 legislação — as quatro
    // no ar no mesmo dia, migrations 0058/0064/0057+0049+0051/0065).
    // Mesma disciplina de sempre: cortar pro que existe, atualizar quando
    // deixa de ser promessa.
    //
    // ⟲ 13/08, A PEDIDO DO DONO: "não explica bem o estágio atual do painel".
    // Ele estava certo por três razões, e as três são de precisão:
    //
    // 1. O TÍTULO PROMETIA MENOS DO QUE A ZONA FAZ. "O que o COPAM vai
    //    decidir" descreve UMA das cinco telas. Quem lê e não sabe o que é
    //    COPAM (a maioria) não descobre que ali dentro há licença, barragem,
    //    legislação e precedente judicial.
    // 2. O TEXTO ERA UM INVENTÁRIO SEM TAMANHO. Dizia "a pauta", "as
    //    barragens", "três fontes" — nada que deixasse o leitor saber se são
    //    dez linhas ou vinte mil. São 454 reuniões, 19.704 licenças, 6.378
    //    normas estaduais, 30 nacionais e internacionais e 15 precedentes,
    //    contados no banco nesta data.
    // 3. O ACERVO POR TEMA DE DIREITO nem aparecia. `/ambiental/direito-
    //    critico` é a tela que responde "que lei protege isto", e ficava
    //    invisível no cartão que é o texto mais lido do portal.
    //
    // O que NÃO mudou, de propósito: nenhum número aqui é promessa, e a
    // legislação federal continua FORA — são 6.378 normas e todas estaduais.
    // Enquanto o acervo do MMA não entrar, o texto não pode sugerir que a
    // lei federal está aqui.
    descricao:
      "Cinco coisas decidem o que pode ser feito com o ambiente de uma cidade, e todas ficam em lugares diferentes: o COPAM, que aprova ou barra empreendimento em reunião pública; a licença ambiental já concedida; a situação das barragens; a legislação estadual; e o que os tribunais já decidiram sobre rios, terra indígena, quilombola e comunidade tradicional. Aqui elas estão no mesmo lugar — 454 reuniões do COPAM, 19.704 licenças, 6.378 normas ambientais de Minas e 45 instrumentos e precedentes por tema de direito protegido.",
    resumo:
      "COPAM, licença ambiental, barragem, legislação de Minas e precedente judicial por tema de direito — o que decide o ambiente da cidade, num lugar só.",
    itens: [
      "COPAM: pauta de cada reunião, item a item, por município",
      "19.704 licenças ambientais, por município, setor e classe de risco",
      "Barragens: FEAM e SNISB lado a lado, nunca somadas",
      "6.378 normas ambientais de Minas, de três fontes que não conversam",
      "Lei e precedente por tema: rios, indígena, quilombola, comunidade tradicional",
    ],
    cor: "var(--cp-tertiary)",
    publicada: true,
  },
  {
    id: "terras",
    href: "/funcaosocialterra",
    etiqueta: "Fundiário e território · Minas Gerais",
    nomeCurto: "Terra e território",
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
    // ⟲ 13/08, SEGUNDA PASSADA: a etiqueta foi ampliada para "Minas Gerais"
    // quando as camadas estaduais entraram, e ESTA frase ficou para trás
    // falando só das três cidades. O card passou a se contradizer sozinho —
    // promete o estado no rótulo e entrega três cidades no texto. Agora as
    // duas metades estão ditas: o que é estadual como estadual, e o vazio
    // cadastral como o recorte de três cidades que ele é.
    descricao:
      `Mapa 3D do território de Minas Gerais: terras indígenas, a área que a água alcança se uma barragem rompe, e o que é mina em operação separado do que é só requerimento no papel. E o vazio cadastral — quanto do território de Araçuaí, Diamantina e Itinga não tem imóvel rural declarado no Cadastro Ambiental Rural, estimativa com taxa de erro medida (${TAXA_ERRO_G0.taxaPct.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}% da amostra checada a olho não se confirmou) publicada ao lado do número.`,
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
  {
    id: "paraopeba",
    // Sexta frente, pedida pelo dono a partir de um painel entregue à mão
    // (`painel-paraopeba.html`) mais o índice público da Plataforma
    // Brumadinho UFMG — `docs/PLANO-INGESTAO-PARAOPEBA.md` mede as duas
    // fontes. Acrescentar aqui NÃO quebra texto nenhum: `nomeCurto` é campo
    // obrigatório desde 13/08, e a contagem por extenso
    // (`contagemZonasPublicadas`) e o footer/remissão cruzada já leem
    // `ZONAS_PUBLICADAS.length`, não um número cravado.
    href: "/paraopeba",
    etiqueta: "Reparação · Rompimento da barragem em Brumadinho",
    nomeCurto: "Paraopeba",
    titulo: "A reparação de Brumadinho, acompanhada mês a mês",
    descricao:
      "Acompanhamento da reparação pelo rompimento da barragem da Vale em Brumadinho (25/01/2019, 270 mortes): clipping de imprensa desde abril de 2024, linha do tempo do processo, os órgãos e organizações que atuam na reparação — a maioria sem entrada em nenhum outro lugar do portal — e o auxílio emergencial pago mês a mês, com os documentos do processo judicial que citam cada município da bacia.",
    resumo:
      "Clipping, linha do tempo, quem atua na reparação e o auxílio emergencial pago mês a mês — o rompimento da barragem da Vale em Brumadinho, acompanhado.",
    itens: [
      "Clipping de 149 notícias (abr/2024–jul/2026), filtrável por tipo e período",
      // Eram 17 e viraram 23 em 15/08/2026 (`96de91e`), quando os 6 marcos
      // pré-2025 entraram — entre eles o próprio rompimento. Este texto ficou
      // para trás por meia hora e passou a anunciar um acervo menor do que o
      // que a tela mostrava. Número aqui é cópia manual do que `linha-do-tempo.ts`
      // guarda; quem mexer lá tem de mexer aqui.
      "Linha do tempo com os 23 marcos do processo, do rompimento em 25/01/2019 à ADPF no STF",
      "18 órgãos e organizações que atuam na reparação — 16 sem entrada em outro lugar do portal",
      "9 pagamentos do Novo Auxílio Emergencial e os documentos do processo que citam cada município, com link e citação",
    ],
    cor: "var(--cp-secondary)",
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

/**
 * `n` por extenso, em português — "cinco", não "5".
 *
 * ⟲ 13/08: existe porque o comentário no topo deste arquivo prometia que
 * NENHUM texto crava a contagem à mão, e três telas cravavam mesmo assim —
 * `FooterGlobal.tsx` ("As cinco frentes"), `sobre/page.tsx` (duas vezes).
 * `OutrasFrentes.tsx` já tinha resolvido isto sozinho, com seu próprio
 * `Record<number, string>` local; esta função substitui as cópias em
 * potencial (a antiga de `OutrasFrentes` incluída) por uma só, porque a
 * causa raiz era exatamente essa: cada tela que precisava do numeral por
 * extenso reinventava a tabela, e é fácil reinventar errado ou esquecer
 * uma. Mesma classe de falha do "30%" digitado à mão no card de terras
 * (`TAXA_ERRO_G0`, mesmo arquivo) — número que devia vir de contagem
 * ficou solto em texto, e passou dias errado sem ninguém ver.
 *
 * `toLocaleString("pt-BR")` foi cogitado e descartado: ele devolve o
 * ALGARISMO ("5"), não a palavra. O pedido aqui é textual ("as cinco
 * frentes"), não numérico.
 *
 * Cai para o algarismo (`String(n)`) além da tabela, de propósito: é
 * melhor "as 11 frentes" feio do que a tela quebrar — mas
 * `zonas.test.ts` trava se `ZONAS_PUBLICADAS.length` ultrapassar o que a
 * tabela cobre, para que estender a tabela seja decisão de quem publica a
 * frente, não descoberta de quem lê a tela depois.
 *
 * FLEXÃO DE GÊNERO NÃO É GARANTIDA: "1" e "2" saem no feminino ("uma",
 * "duas") porque as três telas que existiam antes desta função concordavam
 * com substantivo feminino ("frente(s)"). `OutrasFrentes.tsx` concorda com
 * "lugares" (masculino) e usava "dois" à mão — hoje o número é 5
 * ("cinco", invariável), então a divergência não aparece; se a contagem
 * cair para 1 ou 2 algum dia, confira as três telas à mão antes de confiar
 * no texto gerado.
 */
const NUMERAL_POR_EXTENSO: Record<number, string> = {
  1: "uma",
  2: "duas",
  3: "três",
  4: "quatro",
  5: "cinco",
  6: "seis",
  7: "sete",
  8: "oito",
  9: "nove",
  10: "dez",
};

export function numeralPorExtenso(n: number): string {
  return NUMERAL_POR_EXTENSO[n] ?? String(n);
}

/**
 * "cinco frentes" — a contagem por extenso das frentes hoje publicadas.
 * Único lugar que `FooterGlobal.tsx`, `sobre/page.tsx` e
 * `OutrasFrentes.tsx` devem ler; nenhum dos três deve manter tabela de
 * numeral própria.
 */
export function contagemZonasPublicadas(): string {
  return numeralPorExtenso(ZONAS_PUBLICADAS.length);
}
