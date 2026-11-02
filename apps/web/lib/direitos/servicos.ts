/**
 * @file Catálogo dos serviços essenciais do eixo Direitos em Movimento.
 *
 * O QUE É: a dimensão da faceta do painel `/direitos-em-movimento/servicos`.
 * Três recortes — saúde, educação e trabalho e renda — que antes eram três
 * rotas com o mesmo esqueleto (quatro cartões, uma série, cruzamentos e a
 * lista de fichas).
 *
 * ═══ SOBRE OS NÚMEROS ═══
 * Os valores de referência nacional das três telas NÃO são medição deste
 * portal: são a régua divulgada pelo órgão da fonte, fixada no código e usada
 * para o leitor comparar com o dado local. Por isso cada recorte carrega
 * `fonte` (onde conferir) e `ressalva` (o que o número não diz), e a tela
 * mostra o aviso antes dos cartões — AGENTS §7, número sem fonte é dano.
 *
 * O que o portal realmente mede, cidade a cidade, está nas fichas e nos
 * painéis municipais; o recorte de serviço não inventa município.
 *
 * FONTE OFICIAL: CNES/DataSUS, INEP e MTE/CAGED, cada uma com a URL em
 * `fonte.url`. Nenhum valor aqui é recalculado no build.
 */

export type SlugServico = "saude-publica" | "educacao" | "trabalho-e-renda";

export interface FonteReferencia {
  /** Órgão que publica o número. */
  orgao: string;
  /** Página oficial onde o leitor confere o dado. */
  url: string;
}

export interface ServicoEssencial {
  slug: SlugServico;
  /** Rótulo curto do botão da faceta. */
  rotulo: string;
  /** Título do bloco quando o recorte está ativo. */
  titulo: string;
  /** Uma frase, sob o `<h1>` e no cartão do hub. */
  descricao: string;
  fonte: FonteReferencia;
  /** O que o número de referência não diz — vai junto do aviso. */
  ressalva: string;
}

export const SERVICOS: ServicoEssencial[] = [
  {
    slug: "saude-publica",
    rotulo: "Saúde",
    titulo: "Saúde pública e capacidade do SUS",
    descricao:
      "Estabelecimentos, leitos e internações: a régua nacional do SUS para ler o que a rede do seu município tem.",
    fonte: {
      orgao: "CNES / DataSUS — Ministério da Saúde",
      url: "https://cnes.datasus.gov.br/",
    },
    ressalva:
      "Não é retrato de um município nem do ano corrente: é a ordem de grandeza nacional que a fonte publica.",
  },
  {
    slug: "educacao",
    rotulo: "Educação",
    titulo: "Educação básica, escolas e IDEB",
    descricao:
      "Escolas, matrículas e a série do IDEB: a régua nacional para comparar com a rede municipal.",
    fonte: {
      orgao: "INEP — Ministério da Educação",
      url: "https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/ideb",
    },
    ressalva:
      "O IDEB é índice bienal e combina fluxo e aprendizado; a média nacional não descreve uma escola nem uma rede.",
  },
  {
    slug: "trabalho-e-renda",
    rotulo: "Trabalho e renda",
    titulo: "Trabalho formal e renda",
    descricao:
      "Estoque de empregos formais, saldo anual e salário de admissão: a régua nacional do emprego com carteira.",
    fonte: {
      orgao: "MTE — Novo CAGED / RAIS",
      url: "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/estatisticas-trabalho",
    },
    ressalva:
      "Emprego formal é só a parte com carteira assinada; informalidade e trabalho doméstico ficam fora do número.",
  },
];

/** Recorte que abre o painel quando a URL não traz `?subfrente=`. */
export const SERVICO_PADRAO: SlugServico = "saude-publica";

export function servicoPorSlug(slug?: string | string[]): ServicoEssencial {
  const valor = Array.isArray(slug) ? slug[0] : slug;
  return SERVICOS.find((servico) => servico.slug === valor) ??
    SERVICOS.find((servico) => servico.slug === SERVICO_PADRAO)!;
}

/** URL canônica de um recorte; sem slug, o painel sem faceta. */
export function hrefServico(slug?: string): string {
  return slug
    ? `/direitos-em-movimento/servicos?subfrente=${slug}`
    : "/direitos-em-movimento/servicos";
}
