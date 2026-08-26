// GERADO a partir de `painel-paraopeba.html` (`docs/PLANO-INGESTAO-PARAOPEBA.md`
// mede a estrutura da fonte). Dado histórico/institucional — não recalculado
// pelo portal, atualiza por commit quando a fonte mudar.
//
// `NEWS_DATA` do painel — clipping de imprensa sobre a reparação do
// rompimento da barragem da Vale em Brumadinho (25/01/2019).
//
// ═══ POR QUE ISTO É ACERVO DATADO, NUNCA "NOTÍCIAS DE HOJE" ═══
//
// É um snapshot manual, sem API/RSS por trás — não se atualiza sozinho.
// `PERIODO_CLIPPING` existe para toda tela rotular o acervo pelo período
// real que ele cobre, nunca como "atual". O Instituto Guaicuy mantém o
// Painel da Reparação atualizado em guaicuy.org.br — é a fonte viva; este
// acervo é o retrato congelado que o Controle Popular pode auditar.

export type TipoNoticia = "institucional" | "imprensa" | "assessoria" | "movimento";

export const TIPO_NOTICIA_LABEL: Record<TipoNoticia, string> = {
  institucional: "Institucional (TJMG, ALMG, órgãos públicos)",
  imprensa: "Imprensa",
  assessoria: "Assessoria de comunicação (ATIs e movimento)",
  movimento: "Movimento social",
};

export interface NoticiaClipping {
  id: number;
  titulo: string;
  /** Resumo escrito por quem montou o painel-fonte, não pelo Controle Popular. */
  resumo: string;
  data: string;
  portal: string;
  tipo: TipoNoticia;
  url: string;
  tags: string[];
  /** Agrupa notícias do mesmo evento/decisão, quando o painel-fonte marcou. */
  grupo?: string;
}

/** Cobertura real do acervo — usar para rotular a tela, nunca "notícias de hoje". */
export const PERIODO_CLIPPING = {
  de: "2024-04-08",
  ate: "2026-07-30",
} as const;

/**
 * Contagens do acervo, para páginas SERVIDOR que só mostram números.
 *
 * ═══ POR QUE ISTO EXISTE ═══
 *
 * `CLIPPING_PARAOPEBA` abaixo tem 108 KB — se uma página `async` de servidor
 * importar o array só para exibir `.length`, o webpack embute o arquivo
 * inteiro no bundle do Worker (ver `docs/HANDOFF-PAYLOAD-LEGISLACAO.md`).
 * Esta cobertura é literal e pequena; o array fica reservado aos componentes
 * de CLIENTE, que têm bundle próprio sem teto de 3 MiB gzip. A paridade
 * entre a cobertura e o array é travada por teste em `dados.test.ts` — se
 * alguém regenerar o acervo e a contagem mudar, o teste falha.
 */
export const COBERTURA_CLIPPING = {
  total: 149,
} as const;

