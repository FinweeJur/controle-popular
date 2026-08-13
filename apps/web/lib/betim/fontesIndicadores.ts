/**
 * De onde vem cada número de "A cidade em números", e o que ele significa.
 *
 * ═══ POR QUE ESTE ARQUIVO EXISTE ═══
 *
 * Medido no site em produção em 2026-08-10: os **nove** indicadores da home
 * da cidade apareciam **sem nenhum link de fonte**. O portal inteiro se
 * sustenta na promessa de que "cada dado vem de fonte oficial, com link pra
 * você conferir" — escrita, aliás, no parágrafo logo acima desses cards. Nos
 * cards, a promessa não se cumpria.
 *
 * O banco não resolve sozinho: `indicadores.fonte` guarda o identificador do
 * conjunto na Base dos Dados (`br_mdr_snis`, `br_inep_ideb`), que é um código
 * de máquina, não um endereço. O mapa abaixo traduz.
 *
 * ═══ E A SEGUNDA METADE DO PROBLEMA: O JARGÃO ═══
 *
 * "IDEB (anos finais) — 3,8 pontos" não informa quem não sabe o que é IDEB
 * nem qual é a escala. "Saldo de empregos (CAGED) — -834" idem. Cada
 * indicador ganha uma frase curta, em português comum, que diz o que o número
 * mede e em que escala.
 *
 * A regra do portal é mensagem acessível e curta — então é UMA frase, não um
 * parágrafo, e sem sigla sem tradução.
 */

export interface FonteOficial {
  /** Nome de quem publica, como a pessoa reconheceria. */
  rotulo: string;
  /** Página oficial do dado. Nunca a home do órgão quando existe página do dado. */
  url: string;
}

/**
 * Chave = `indicadores.fonte` como o ETL grava.
 *
 * O valor `"br_ibge_pib + br_ibge_populacao"` existe porque PIB per capita é
 * derivado de dois conjuntos — está escrito assim no banco e é tratado aqui,
 * não normalizado, para o mapa continuar batendo com o que a coluna tem.
 */
export const FONTE_OFICIAL: Record<string, FonteOficial> = {
  br_ibge_populacao: {
    rotulo: "IBGE — estimativas de população",
    url: "https://www.ibge.gov.br/estatisticas/sociais/populacao/9103-estimativas-de-populacao.html",
  },
  br_ibge_pib: {
    rotulo: "IBGE — PIB dos municípios",
    url: "https://www.ibge.gov.br/estatisticas/economicas/contas-nacionais/9088-produto-interno-bruto-dos-municipios.html",
  },
  "br_ibge_pib + br_ibge_populacao": {
    rotulo: "IBGE — PIB e população dos municípios",
    url: "https://www.ibge.gov.br/estatisticas/economicas/contas-nacionais/9088-produto-interno-bruto-dos-municipios.html",
  },
  br_inep_ideb: {
    rotulo: "INEP — IDEB",
    url: "https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/ideb",
  },
  br_mdr_snis: {
    rotulo: "SNIS — saneamento",
    // URL antiga redirecionava (302, destino estável) para este mesmo
    // caminho: o SNIS foi absorvido pelo SINISA dentro de `gov.br/cidades`
    // — achado e trocado direto na fonte na auditoria de hiperlinks de
    // 2026-08-13, em vez de deixar o código pagar o pulo do redirect.
    url: "https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/saneamento/sinisa",
  },
  br_me_rais: {
    rotulo: "RAIS — Ministério do Trabalho",
    url: "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/estatisticas-trabalho/rais",
  },
  br_me_caged: {
    rotulo: "Novo CAGED — Ministério do Trabalho",
    url: "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/estatisticas-trabalho/novo-caged",
  },
  br_denatran_frota: {
    rotulo: "SENATRAN — frota de veículos",
    url: "https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-Senatran/frota-de-veiculos-2025",
  },
  "mundo_onu_adh (PNUD/Atlas do Desenvolvimento Humano)": {
    rotulo: "PNUD — Atlas do Desenvolvimento Humano",
    url: "http://www.atlasbrasil.org.br/",
  },
};

/**
 * Uma frase por indicador: o que o número mede e em que escala.
 *
 * Chave = `indicadores.nome`. Curta de propósito — cabe embaixo do número
 * sem empurrar o card, e é o que falta para o dado virar informação.
 */
export const EXPLICACAO_INDICADOR: Record<string, string> = {
  populacao: "Estimativa de quantas pessoas moram na cidade.",
  pib_per_capita: "Tudo o que a cidade produz num ano, dividido pelo número de moradores. Não é renda de ninguém — é uma média.",
  ideb_anos_finais: "Nota de 0 a 10 do ensino público nos anos finais (6º ao 9º), medida pelo MEC.",
  ideb_anos_iniciais: "Nota de 0 a 10 do ensino público nos anos iniciais (1º ao 5º), medida pelo MEC.",
  cobertura_esgoto: "Parte da população atendida por rede de esgoto.",
  cobertura_agua: "Parte da população atendida por rede de água tratada.",
  salario_medio: "Média do salário de quem tem carteira assinada na cidade.",
  saldo_empregos_caged: "Vagas com carteira assinada abertas menos as fechadas no ano. Negativo quer dizer que fecharam mais do que abriram.",
  pobreza: "Parte da população vivendo abaixo da linha de pobreza.",
  frota_veiculos: "Veículos registrados na cidade, de todos os tipos.",
  idh: "Índice de 0 a 1 que junta renda, educação e saúde. Quanto mais perto de 1, melhor.",
};

/**
 * Dado velho tem de se anunciar como velho.
 *
 * IDH e taxa de pobreza vêm do Censo de 2010 e apareciam ao lado de números
 * de 2025 com o mesmo peso visual — o leitor conclui que é a foto de hoje. O
 * ano já era exibido; o que faltava era dizer que aquele ano é o mais recente
 * QUE EXISTE, e não uma desatualização do portal.
 */
export const ANOS_ATRAS_PARA_AVISAR = 5;

export function avisoDeDefasagem(ano: number | null | undefined, anoAtual: number): string | null {
  if (!ano) return null;
  const idade = anoAtual - ano;
  if (idade < ANOS_ATRAS_PARA_AVISAR) return null;
  return `Dado de ${ano} — é o mais recente publicado pela fonte.`;
}
