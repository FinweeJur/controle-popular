/**
 * Decisões de licenciamento ambiental de MG — o achado é a NEGATIVA.
 *
 * Gerado por `scripts/agregar-decisoes-licenciamento.mts` a partir da
 * consulta pública `sistemas.meioambiente.mg.gov.br/licenciamento` (43.444
 * decisões, 2.178 páginas varridas, medido em 21/08/2026). Esse script
 * escreve `etl/betim/dados/decisoes-licenciamento-mg.json` (8,1 MB) — e
 * ESTE ARQUIVO NUNCA O IMPORTA.
 *
 * ═══ POR QUE ESTE MÓDULO NÃO TOCA O JSON BRUTO ═══
 *
 * `page.tsx` e `PainelDecisoes.tsx` importam este módulo. Se ele importasse
 * o JSON de 8,1 MB (que carrega as 9.554 negativas por inteiro), o array
 * inteiro entraria na árvore de dependência de QUALQUER um dos dois — nunca
 * provado seguro neste repo (o precedente documentado é ruim: `/ambiental/
 * legislacao` chegou a 35,5 MiB por arrastar array grande para perto do
 * componente de página, ver `docs/ARQUITETURA.md`). Por isso:
 *
 *   - Os números pequenos abaixo (`COBERTURA_DECISOES_LICENCIAMENTO`,
 *     `DECISOES_LICENCIAMENTO_POR_ANO`) são LITERAIS — fotografados uma vez
 *     desta mesma rodada de 21/08/2026 e travados por teste. Seguro para
 *     `page.tsx` importar.
 *   - `enxugarNegativa` é função PURA (entra objeto, sai objeto) — não
 *     importa dado nenhum, só sabe o formato.
 *   - Quem lê o JSON bruto e chama `enxugarNegativa` 9.554 vezes é só
 *     `app/ambiental/decisoes/dados/[arquivo]/route.ts` — o único lugar do
 *     código que importa `decisoes-licenciamento-mg.json`, e ele nunca é
 *     importado de volta por `page.tsx` nem por `PainelDecisoes.tsx`.
 *
 * ═══ O CORTE DE CAMPOS: 11 DOS ~20 DA FONTE ═══
 *
 * As 9.554 negativas com os 20 campos da fonte pesam 6,74 MB — ainda maior
 * que o teto de 3 MiB gzip por rota do Worker somado ao resto da página.
 * Reduzindo a linha aos 11 campos que a tela realmente usa (filtro, tabela,
 * CSV — nunca `cnpj_raiz`, `numero_protocolo`, `mes`, `documento_
 * classificacao`, `municipio_id`, `data_publicacao` textual, nem a flag
 * `eh_pessoa_fisica` bruta), medido em 22/08/2026: 4,50 MB. Ainda não cabe
 * num arquivo só (orçamento de `lib/estatico/fatiar.ts` é 2 MiB) — vira 3
 * fatias, servidas sob demanda por `TabelaEstatica`-like loop em
 * `PainelDecisoes.tsx`.
 *
 * ═══ AS TRÊS RESSALVAS QUE VIAJAM COM O DADO ═══
 *
 * 1. Indeferimento não é irregularidade do empreendedor — pode ser projeto
 *    incompleto, desistência, mudança de modalidade. É a decisão como o
 *    Estado publicou.
 * 2. Titular pessoa física não aparece nominalmente. `nome_empreendimento`
 *    já vem redigido pelo script de agregação (por dígito verificador sobre
 *    TODO campo de texto, não pela flag `eh_pessoa_fisica` da fonte — que
 *    mente em 20 dos casos, ver o cabeçalho de `agregar-decisoes-
 *    licenciamento.mts`). Este módulo não redige de novo: confia no que já
 *    saiu redigido do ETL.
 * 3. As deferidas (33.890) estão AGREGADAS nesta página — só as negativas
 *    (9.554) vêm linha a linha. Quem procura uma licença deferida específica
 *    não encontra aqui: vai para `/ambiental/licenciamento` (WFS de licenças
 *    concedidas, ver a nota de cruzamento abaixo).
 *
 * ═══ POR QUE ISTO NÃO É `/ambiental/licenciamento` NEM `/ambiental/decisoes-lai` ═══
 *
 * `/ambiental/licenciamento` (WFS da IDE-Sisema, lido do banco) mostra quem
 * RECEBEU licença — e por isso mostra só 78% da história: das 43.444
 * decisões desta base, 9.554 (22%) são negativas e não aparecem lá, nem
 * aparecerão quando a Neon voltar (WFS de licenças concedidas não tem linha
 * de indeferimento). `/ambiental/decisoes-lai` é outra coisa: recurso de
 * pedido de LAI julgado pela CGE-MG, sem nenhuma relação com licenciamento
 * ambiental — o nome parecido é a única coisa em comum.
 */

/** Como a linha chega da fonte, antes de enxugar (só os campos que
 *  `enxugarNegativa` lê — a fonte tem mais colunas que isto, ver acima). */
export interface DecisaoLicenciamentoBruta {
  id_fonte: number | string;
  ano: string | number | null;
  decisao: string | null;
  municipio_nome: string | null;
  classe: number | string | null;
  modalidade: string | null;
  atividade_descricao: string | null;
  regional: string | null;
  numero_processo: string | null;
  nome_empreendimento: string | null;
  link_ficha: string | null;
}

export type TipoDecisaoNegativa = "Indeferida" | "Arquivamento" | "Cancelada" | "Suspensa";

/** A linha publicada — 11 campos, o suficiente para tabela, filtro e CSV. */
export interface DecisaoLicenciamentoNegativa {
  idFonte: number;
  /** `null` quando a fonte trouxe um ano fora de 1990–2030 (1 caso medido —
   *  ver `NEGATIVAS_COM_ANO_INCONSISTENTE` — não inventa ano, também não
   *  descarta a linha: ela some só do filtro/gráfico por ano). */
  ano: number | null;
  decisao: TipoDecisaoNegativa;
  municipio: string | null;
  classe: number | null;
  modalidade: string | null;
  atividade: string | null;
  regional: string | null;
  numeroProcesso: string | null;
  /** Redigido já na origem (ETL) quando é pessoa física — ver ressalva 2. */
  empreendimento: string | null;
  linkFicha: string | null;
}

/** Funde "Suspensa" e "Licença Suspensa" — os dois rótulos da fonte para o
 *  mesmo estado, 9 registros ao todo (medido 21/08/2026): não vale abrir uma
 *  quinta categoria de filtro para 9 linhas. */
const DECISAO_CANONICA: Record<string, TipoDecisaoNegativa> = {
  Indeferida: "Indeferida",
  Arquivamento: "Arquivamento",
  Cancelada: "Cancelada",
  Suspensa: "Suspensa",
  "Licença Suspensa": "Suspensa",
};

/**
 * Reduz uma linha bruta da fonte às 11 colunas publicadas. Pura — não lê
 * arquivo, só sabe o formato. Lança se `decisao` não for uma das 5 grafias
 * conhecidas (4 categorias após fundir): é bug de quem chama (a fonte não
 * tem outras), não caso de borda a esconder.
 */
export function enxugarNegativa(bruta: DecisaoLicenciamentoBruta): DecisaoLicenciamentoNegativa {
  const decisaoCanonica = DECISAO_CANONICA[String(bruta.decisao)];
  if (!decisaoCanonica) {
    throw new Error(
      `decisão desconhecida "${bruta.decisao}" (id_fonte ${bruta.id_fonte}) — não é nenhuma das 5 grafias conhecidas da fonte`,
    );
  }
  const anoNum = Number(bruta.ano);
  const anoValido = Number.isInteger(anoNum) && anoNum >= 1990 && anoNum <= 2030;
  const classeNum = bruta.classe == null || bruta.classe === "" ? null : Number(bruta.classe);
  return {
    idFonte: Number(bruta.id_fonte),
    ano: anoValido ? anoNum : null,
    decisao: decisaoCanonica,
    municipio: bruta.municipio_nome && bruta.municipio_nome !== "None" ? bruta.municipio_nome : null,
    classe: classeNum != null && Number.isFinite(classeNum) ? classeNum : null,
    modalidade: bruta.modalidade || null,
    atividade: bruta.atividade_descricao || null,
    regional: bruta.regional || null,
    numeroProcesso: bruta.numero_processo || null,
    empreendimento: bruta.nome_empreendimento || null,
    linkFicha: bruta.link_ficha || null,
  };
}

/**
 * Agregado — SEGURO para `page.tsx` importar (é literal, não arrasta as
 * 9.554 negativas). Fotografado de `etl/betim/dados/decisoes-licenciamento-
 * mg.json` em 22/08/2026 — regenerar rodando o script de agregação de novo
 * e reconferindo os testes deste arquivo se a fonte for recoletada.
 */
export const COBERTURA_DECISOES_LICENCIAMENTO = {
  fonte: "sistemas.meioambiente.mg.gov.br/licenciamento — consulta de decisões",
  medidoEm: "2026-08-21",
  agregadoEm: "2026-08-22",
  anoInicial: 2007,
  anoFinal: 2026,
  total: 43444,
  totalDeferidas: 33890,
  totalNegativas: 9554,
  /** Arredondado — o valor exato é 21,996...%. */
  percentualNegativas: 22,
  municipiosDistintos: 851,
  semMunicipioResolvido: 0,
  /** Só dentro das 9.554 negativas (não é o `pessoaFisica` do agregado
   *  geral, que soma também as deferidas). */
  pessoaFisicaNasNegativas: 1544,
  /** 1 negativa traz `ano: "201"` na fonte — fora de 1990–2030, contada
   *  aqui mas ausente do gráfico/filtro por ano (ver `enxugarNegativa`).
   *  Lacuna declarada, não escondida. */
  negativasComAnoInconsistente: 1,
  /** `id_fonte` da linha acima — Brumadinho, `municipio_nome: "Brumadinho"`. */
  idNegativaComAnoInconsistente: 7215,
  avisoIndeferimento:
    "Indeferimento não é irregularidade do empreendedor: pode ser projeto incompleto, desistência ou mudança de modalidade. Esta é a decisão como o Estado a publicou.",
  avisoPessoaFisica:
    "Titular pessoa física não aparece nominalmente. A fonte marca 20 negativas como CNPJ quando na verdade têm CPF colado ao nome — a redação aqui é por dígito verificador sobre o texto, não pela flag da fonte.",
  avisoAgregado:
    "As 33.890 decisões deferidas estão agregadas por ano, município, classe, modalidade e regional — não linha a linha. Quem procura uma licença específica concedida vai para /ambiental/licenciamento.",
} as const;

/** Por ano, os dois lados — o gráfico principal desta página. 20 linhas,
 *  2007–2026. Soma de `negativas` = 9.553 (não 9.554: falta a linha com ano
 *  inconsistente, ver `negativasComAnoInconsistente`). */
export const DECISOES_LICENCIAMENTO_POR_ANO: readonly { ano: number; deferidas: number; negativas: number }[] = [
  { ano: 2007, deferidas: 0, negativas: 2 },
  { ano: 2008, deferidas: 1, negativas: 4 },
  { ano: 2009, deferidas: 3, negativas: 0 },
  { ano: 2010, deferidas: 1, negativas: 4 },
  { ano: 2011, deferidas: 1, negativas: 6 },
  { ano: 2012, deferidas: 2, negativas: 5 },
  { ano: 2013, deferidas: 4, negativas: 17 },
  { ano: 2014, deferidas: 2, negativas: 15 },
  { ano: 2015, deferidas: 11, negativas: 18 },
  { ano: 2016, deferidas: 487, negativas: 237 },
  { ano: 2017, deferidas: 737, negativas: 345 },
  { ano: 2018, deferidas: 4921, negativas: 2196 },
  { ano: 2019, deferidas: 5591, negativas: 2201 },
  { ano: 2020, deferidas: 5310, negativas: 973 },
  { ano: 2021, deferidas: 5560, negativas: 1049 },
  { ano: 2022, deferidas: 3896, negativas: 960 },
  { ano: 2023, deferidas: 2458, negativas: 620 },
  { ano: 2024, deferidas: 2123, negativas: 414 },
  { ano: 2025, deferidas: 1838, negativas: 325 },
  { ano: 2026, deferidas: 944, negativas: 162 },
] as const;

/** As 4 categorias de negativa, maior para menor — 9.554 no total.
 *  "Suspensa" já vem fundida (ver `DECISAO_CANONICA`). */
export const DECISOES_LICENCIAMENTO_POR_TIPO: readonly { decisao: TipoDecisaoNegativa; total: number }[] = [
  { decisao: "Indeferida", total: 4293 },
  { decisao: "Arquivamento", total: 3763 },
  { decisao: "Cancelada", total: 1489 },
  { decisao: "Suspensa", total: 9 },
];

function csvEscape(valor: unknown): string {
  const s = valor === null || valor === undefined ? "" : String(valor);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const CABECALHO_CSV = [
  "ano",
  "decisao",
  "municipio",
  "classe",
  "modalidade",
  "atividade",
  "regional",
  "numero_processo",
  "empreendimento",
  "link_ficha",
];

/**
 * CSV das negativas filtradas, separador `;`. Sem BOM — quem monta o `Blob`
 * no cliente prefixa `﻿`, mesma divisão de `tac-agregados.ts`
 * (`contratosParaCsv`): BOM é decisão de transporte/arquivo, não de
 * conteúdo, e a função pura fica testável sem depender de charCode mágico.
 */
export function negativasParaCsv(linhas: readonly DecisaoLicenciamentoNegativa[]): string {
  const corpo = linhas.map((l) =>
    [
      l.ano ?? "",
      l.decisao,
      l.municipio ?? "",
      l.classe ?? "",
      l.modalidade ?? "",
      l.atividade ?? "",
      l.regional ?? "",
      l.numeroProcesso ?? "",
      l.empreendimento ?? "",
      l.linkFicha ?? "",
    ]
      .map(csvEscape)
      .join(";"),
  );
  return [CABECALHO_CSV.join(";"), ...corpo].join("\r\n");
}
