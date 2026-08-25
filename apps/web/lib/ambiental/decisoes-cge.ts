/**
 * Decisões de recurso de LAI da CGE-MG. ARQUIVO GERADO �?" não editar à mão.
 *
 * Gerado por `scripts/coletar-decisoes-cge-mg.mts` a partir de
 * `acessoainformacao.mg.gov.br/sistema/site/busca_decisao.aspx`. O cabeçalho
 * daquele script documenta o protocolo ASP.NET WebForms e as armadilhas
 * medidas �?" inclusive a que mais importa aqui:
 *
 * �.��.��.� A SOMA POR TIPO N�fO FECHA EM 2022�?"2025, E ISTO N�fO FOI RESOLVIDO �.��.��.�
 *
 * `porTipo` de cada ano vem do filtro oficial `ddlTipoDecisao` (mesmo campo
 * que `docs/FONTES.md` já documentava). Em 2020, 2021, 2026 a soma
 * dos 6 tipos bate com o total do ano; em 2022, 2023, 2024, 2025 não bate �?"
 * até ~50% dos registros não têm tipo atribuído nesse filtro. O coletor
 * investigou uma hipótese nova (a pasta do link do PDF, que em parte dos
 * registros de 2022�?"2025 ainda guarda um rótulo de tipo) e a hipótese **não
 * fechou a conta**: o rótulo da pasta e o total do `ddlTipoDecisao` discordam
 * entre si no mesmo ano (medido em 2023: pasta encontra 4 arquivos "Perda de
 * objeto parcial", o filtro oficial dá 0 para "Perda parcial de objeto").
 * **Não publique "total de decisões por tipo" para 2022, 2023, 2024, 2025
 * sem resolver esta lacuna antes.** O que ela é �?" campo não preenchido no
 * sistema de origem, tipo fora do dropdown, os dois �?" segue não investigado.
 */

export interface DecisaoRecursoCgeMg {
  ano: number;
  arquivo: string;
  url: string;
  /** Inferido do padrão da URL (`App_Data`, pasta reservada do ASP.NET que
   *  nunca é servida) �?" medido 404 em 11/11 amostras, 200 em 6/6 do outro
   *  padrão, não verificado registro a registro. */
  linkProvavelmenteQuebrado: boolean;
  /** Só quando a fonte guardou o órgão no caminho do PDF (estrutura antiga). */
  orgaoSigla: string | null;
  /** Rótulo CRU da pasta �?" não normalizado aos 6 rótulos do dropdown oficial. */
  tipoPasta: string | null;
  /** Número do processo SEI, quando o nome do arquivo o carrega. */
  seiId: string | null;
}

/**
 * As 753 decisoes sairam daqui em 2026-08-25 e viraram etl/betim/dados/
 * decisoes-cge-bundle.json - asset estatico (public/data/, via dump) que o
 * cliente busca com fetch e os testes leem via decisoes-cge-dados.ts.
 * Motivo no cabecalho de lib/server-only/json-etl.ts: teto de 3 MiB gzip
 * do Worker Free (erro 10027).
 */
export interface DecisoesPorTipoAno {
  ano: number;
  /** `Total de resultados` do ano, sem filtro de tipo. */
  total: number;
  /** Contagem por tipo, do filtro oficial `ddlTipoDecisao` ��� n+�o da pasta. */
  porTipo: Record<
    "desprovimento" | "naoConhecimento" | "perdaDeObjeto" | "perdaParcialDeObjeto" | "provimento" | "provimentoParcial",
    number
  >;
  somaTipos: number;
  /** `total - somaTipos`. Ver a lacuna documentada no topo do arquivo. */
  semTipo: number;
  percentualSemTipo: number;
}

export const DECISOES_CGE_POR_TIPO_ANO: DecisoesPorTipoAno[] = [
  {
    ano: 2020,
    total: 51,
    porTipo: {
  "desprovimento": 14,
  "naoConhecimento": 23,
  "perdaDeObjeto": 10,
  "perdaParcialDeObjeto": 4,
  "provimento": 0,
  "provimentoParcial": 0
},
    somaTipos: 51,
    semTipo: 0,
    percentualSemTipo: 0,
  },
  {
    ano: 2021,
    total: 60,
    porTipo: {
  "desprovimento": 21,
  "naoConhecimento": 28,
  "perdaDeObjeto": 7,
  "perdaParcialDeObjeto": 3,
  "provimento": 1,
  "provimentoParcial": 0
},
    somaTipos: 60,
    semTipo: 0,
    percentualSemTipo: 0,
  },
  {
    ano: 2022,
    total: 86,
    porTipo: {
  "desprovimento": 17,
  "naoConhecimento": 21,
  "perdaDeObjeto": 4,
  "perdaParcialDeObjeto": 0,
  "provimento": 0,
  "provimentoParcial": 0
},
    somaTipos: 42,
    semTipo: 44,
    percentualSemTipo: 51.2,
  },
  {
    ano: 2023,
    total: 204,
    porTipo: {
  "desprovimento": 30,
  "naoConhecimento": 59,
  "perdaDeObjeto": 5,
  "perdaParcialDeObjeto": 0,
  "provimento": 3,
  "provimentoParcial": 2
},
    somaTipos: 99,
    semTipo: 105,
    percentualSemTipo: 51.5,
  },
  {
    ano: 2024,
    total: 156,
    porTipo: {
  "desprovimento": 16,
  "naoConhecimento": 50,
  "perdaDeObjeto": 11,
  "perdaParcialDeObjeto": 0,
  "provimento": 1,
  "provimentoParcial": 1
},
    somaTipos: 79,
    semTipo: 77,
    percentualSemTipo: 49.4,
  },
  {
    ano: 2025,
    total: 143,
    porTipo: {
  "desprovimento": 14,
  "naoConhecimento": 56,
  "perdaDeObjeto": 7,
  "perdaParcialDeObjeto": 2,
  "provimento": 3,
  "provimentoParcial": 0
},
    somaTipos: 82,
    semTipo: 61,
    percentualSemTipo: 42.7,
  },
  {
    ano: 2026,
    total: 53,
    porTipo: {
  "desprovimento": 14,
  "naoConhecimento": 28,
  "perdaDeObjeto": 1,
  "perdaParcialDeObjeto": 5,
  "provimento": 3,
  "provimentoParcial": 2
},
    somaTipos: 53,
    semTipo: 0,
    percentualSemTipo: 0,
  }
];

/** Importe ISTO em página de servidor, nunca o array inteiro (regra de payload). */
export const COBERTURA_DECISOES_CGE = {
  medidoEm: "2026-08-21",
  totalGeral: 753,
  anoInicial: 2020,
  anoFinal: 2026,
  /** Soma de `porTipo` pelo filtro oficial, nos 7 anos �?" sempre menor que
   *  `totalGeral` por causa da lacuna de 2022�?"2025 (ver docstring acima). */
  totalComTipoOficial: 466,
  totalSemTipoOficial: 287,
  percentualSemTipoOficial: 38.1,
  /** Anos em que `porTipo` soma exatamente o total do ano. */
  anosQueFecham: [
  2020,
  2021,
  2026
] as const,
  /** Anos em que soma menos que o total �?" a lacuna N�fO resolvida. */
  anosComLacuna: [
  2022,
  2023,
  2024,
  2025
] as const,
  /** Registros cujo link do PDF ainda guarda órgão+tipo na própria pasta
   *  (estrutura "antiga" �?" ver docstring do coletor). */
  registrosComOrgaoETipoNaPasta: 475,
  /** Registros cujo link provavelmente devolve 404 (padrão `App_Data`). */
  registrosComLinkProvavelmenteQuebrado: 278,
} as const;