/**
 * @file dicas-pagina.ts
 * @description Balões EDUCATIVOS das páginas do portal: uma frase curta que
 * ensina o leitor a usar o dado que ele tem na frente.
 *
 * PAPEL NO PORTAL
 * ---------------
 * O companheiro flutuante (`app/components/CompanheiroFlutuante.tsx`) observa a
 * rota (`usePathname`) e, quando ela casa com um `prefixo` desta lista e a dica
 * ainda não foi vista NESTA sessão, mostra o balão uma vez. A chave do
 * `sessionStorage` é por `prefixo`, então cada aviso educativo aparece uma vez
 * por sessão — nem repete a cada navegação, nem desaparece para sempre.
 *
 * COMO A ROTA CASA
 * ----------------
 * O `prefixo` é o começo do caminho. `/ambiental/barragens` casa com
 * `/ambiental/barragens` e com subrotas como `/ambiental/barragens/x`; quando
 * houver mais de um prefixo aplicável, vence o MAIS LONGO (o mais específico).
 * `dicaParaRota` é a função pura que decide isso — testada à parte.
 *
 * FONTE (AGENTS §8.1)
 * -------------------
 * `fonte` é opcional. Com fonte, o balão vira link para a página oficial
 * específica; sem fonte, é só um aviso. Só entra URL oficial e verificada — a
 * régua do portal proíbe link de home genérica e a tarefa proíbe URL inventada.
 *
 * ESCOPO ATUAL (decisão do dono)
 * ------------------------------
 * A lista foi semeada com 19 rotas: as 9 aprovadas pelo dono mais 10 rotas
 * reais do top-100 (`data/top-100-paginas.json`). O resto do top-100 entra
 * depois, à medida que cada página ganhar um texto honesto — não inventamos
 * frase para preencher tabela.
 *
 * ESTILO DO TEXTO
 * ---------------
 * Frase curta, direta, sem número inventado. A pergunta ("Você sabia?",
 * "Veja…") convida a explorar a página, nunca afirma dado que a página não
 * tenha medido.
 */

/** Ligação para a fonte oficial de um dado, mostrada dentro do balão. */
export interface FonteDicaPagina {
  /** Rótulo legível do link (ex.: "Portal da LAI"). */
  label: string;
  /** URL oficial e direta; pode ser interna (`/...`) ou externa (`https://...`). */
  url: string;
}

/** Uma dica educativa amarrada ao começo de uma rota. */
export interface DicaPagina {
  /** Começo do caminho da rota (caseiro, ex.: "/ambiental/barragens"). */
  prefixo: string;
  /** Texto curto mostrado no balão. */
  texto: string;
  /** Fonte oficial opcional; com ela o balão vira link. */
  fonte?: FonteDicaPagina;
}

/**
 * Dicas educativas publicadas hoje. Os 9 primeiros itens foram aprovados pelo
 * dono; os demais são rotas reais do top-100. A ORDEM não decide o casamento —
 * `dicaParaRota` procura o prefixo mais longo.
 */
export const DICAS_PAGINA: DicaPagina[] = [
  {
    prefixo: "/ambiental/licenciamento",
    texto:
      "Sabia que o licenciamento ambiental é público? Dá para ler a licença do seu município.",
  },
  {
    prefixo: "/ambiental/barragens",
    texto:
      "Sabia que existe o cadastro SIGBM? Toda barragem de mineração tem ficha e nível de emergência.",
  },
  {
    prefixo: "/ambiental/copam",
    texto:
      "As reuniões do COPAM decidem licenças em Minas. Já viu a pauta da sua região?",
  },
  {
    prefixo: "/betim/emendas",
    texto: "Emenda parlamentar tem autor e destino. Quem mandou o dinheiro para a sua cidade?",
  },
  {
    prefixo: "/congresso/proposicoes",
    texto:
      "Todo projeto de lei tem link oficial. Acompanhe o que vota o seu parlamentar.",
  },
  {
    prefixo: "/estado-e-economia/orcamento",
    texto:
      "O orçamento público cabe num gráfico. Veja quanto foi planejado e quanto saiu.",
  },
  {
    prefixo: "/direitos-em-movimento/saude-publica",
    texto:
      "Leito, CNES e internações são dados abertos do SUS. Confira a rede do seu município.",
  },
  {
    prefixo: "/paraopeba/execucao",
    texto:
      "Sabia que dá para acompanhar a reparação de Brumadinho por município? Veja os repasses e o que já foi pago.",
  },
  {
    prefixo: "/mineracao/cavas",
    texto:
      "Cava de mineração sem cadastro pode indicar atividade irregular. O satélite ajuda a rastrear.",
  },
  {
    prefixo: "/ambiental/convenios",
    texto:
      "Convênio federal tem autor e obra. Veja o que a União destinou ao seu município.",
  },
  {
    prefixo: "/dados/comunicabr",
    texto:
      "Os repasses federais por cidade são públicos. Veja quanto chegou ao seu município.",
  },
  {
    prefixo: "/judiciario/contatos",
    texto: "Vara tem telefone e e-mail. Encontre o contato da Justiça do seu município.",
  },
  {
    prefixo: "/direitos-em-movimento/educacao",
    texto:
      "IDEB e merenda escolar são dados abertos. Compare as escolas do seu município.",
  },
  {
    prefixo: "/direitos-em-movimento/conselhos",
    texto: "Conselho municipal é controle social. Veja se a sua cidade tem um.",
  },
  {
    prefixo: "/direitos-em-movimento/informacao",
    texto:
      "A Lei de Acesso à Informação vale para todo órgão. Peça o dado e acompanhe o prazo.",
    // Fonte oficial federal da LAI (gov.br). Link direto e estável — §8.1.
    fonte: { label: "Portal da LAI (Gov.br)", url: "https://www.gov.br/acessoainformacao/pt-br" },
  },
  {
    prefixo: "/congresso/votacoes",
    texto:
      "Voto de parlamentar é público e nominal. Veja como votou quem você elegeu.",
  },
  {
    prefixo: "/empresas/executivos",
    texto: "Porta giratória tem nome. Veja quem saiu do governo para a empresa.",
  },
  {
    prefixo: "/biblioteca",
    texto: "A biblioteca traz perícia e auditoria na íntegra. Dá para baixar e ler.",
  },
  {
    prefixo: "/radio",
    texto: "As rádios cívicas tocam sem rastreadores. Escute ao vivo pelo próprio portal.",
  },
];

/**
 * Escolhe a dica que casa com a rota. Vence o prefixo MAIS LONGO: assim
 * `/ambiental/barragens/descaracterizacao` usa a dica de `/ambiental/barragens`
 * e uma futura dica mais específica não seria engolida por uma genérica.
 *
 * @param rota Caminho atual (`usePathname`); query e hash são ignorados por
 *   segurança, embora o `usePathname` já venha limpo.
 * @returns A dica que casa, ou `null` se nenhum prefixo servir.
 */
export function dicaParaRota(rota: string): DicaPagina | null {
  const caminho = rota.split(/[?#]/)[0] ?? rota;
  let melhor: DicaPagina | null = null;
  for (const dica of DICAS_PAGINA) {
    if (!caminho.startsWith(dica.prefixo)) continue;
    if (melhor === null || dica.prefixo.length > melhor.prefixo.length) {
      melhor = dica;
    }
  }
  return melhor;
}
