/**
 * ═══ RANKING DE FORNECEDORES — LÓGICA PURA, SEGURA PRA CLIENTE ═══
 *
 * Tipos, indícios e CSV do ranking de fornecedores (Sprint 2). Este módulo
 * NÃO pode importar nada de `lib/db/queries/*`: é usado por componente de
 * cliente (`ListaFornecedores`), e importar a cadeia do banco arrastaria
 * código de servidor pro bundle do navegador — mesmo motivo de
 * `contratos-indicios.ts` existir separado. O acesso ao banco fica em
 * `fornecedores.ts` (`fetchFornecedores`).
 *
 * REGRA EDITORIAL QUE MANDA NOS INDÍCIOS: são sinal de investigação, nunca
 * acusação. Ausência de dado devolve `false` — não gera indício e não
 * afirma o contrário.
 */

export interface FornecedorRow {
  /** Chave de agrupamento: CNPJ e, na falta, o nome — mesma decisão de
   *  `maioresFornecedores`. Linhas sem nenhum dos dois caem no rótulo
   *  fixo e ficam visíveis como lacuna, em vez de sumirem da soma. */
  chave: string;
  razao_social: string | null;
  cnpj: string | null;
  valor_total: number;
  num_contratos: number;
  num_orgaos: number;
  ano_primeiro: number | null;
  ano_ultimo: number | null;
  tem_alerta: boolean;
  /** Abertura do CNPJ (`fornecedores.data_abertura`). Nulo = "não sei",
   *  nunca "empresa velha" — ver `fornecedorAbertoNoPeriodo`. */
  data_abertura: string | null;
}

/**
 * Limiar do indício de concentração: mesmo fornecedor com mais de N
 * contratos DENTRO DE UM MESMO ANO. Cinco é a ordem de grandeza usada nas
 * regras de fracionamento discutidas no plano (Sprint 1); não está em lei
 * — por isso o rótulo na tela é "ponto de atenção", com a regra visível.
 */
export const LIMITE_CONTRATOS_CONCENTRACAO = 5;

/**
 * Indício "empresa aberta durante o período dos próprios contratos".
 *
 * Compara ANO de abertura com a janela [primeiro..último] contrato do
 * fornecedor. Sem data de abertura, ou sem ano conhecido, devolve `false`
 * — ausência de dado não gera indício, e `false` não afirma "empresa
 * antiga", apenas que este sinal não se aplica.
 */
export function fornecedorAbertoNoPeriodo(
  row: Pick<FornecedorRow, "data_abertura" | "ano_primeiro" | "ano_ultimo">
): boolean {
  if (!row.data_abertura || !row.ano_primeiro || !row.ano_ultimo) return false;
  const abertura = Number(String(row.data_abertura).slice(0, 4));
  if (!Number.isFinite(abertura)) return false;
  return abertura >= Math.min(row.ano_primeiro, row.ano_ultimo) && abertura <= Math.max(row.ano_primeiro, row.ano_ultimo);
}

/**
 * Indício "muitos contratos ao mesmo fornecedor no ano". Só significa algo
 * COM recorte de ano ativo — no acumulado de todos os anos, muitos
 * contratos seguidos são esperados (vigência renovada não é indício de
 * nada), então sem `ano` o sinal fica deliberadamente desligado.
 */
export function fornecedorConcentradoNoAno(
  row: Pick<FornecedorRow, "num_contratos">,
  ano?: string | number | null
): boolean {
  if (!ano) return false;
  return row.num_contratos > LIMITE_CONTRATOS_CONCENTRACAO;
}

export interface ResumoFornecedores {
  totalValor: number;
  totalFornecedores: number;
  /** Fatia (%) do valor total concentrada no maior fornecedor. */
  top1Pct: number | null;
  /** Fatia (%) do valor total nos cinco maiores. Nula quando há menos de
   *  dois fornecedores — "concentração" entre um só não é informação. */
  top5Pct: number | null;
}

/**
 * Concentração do bolo contratado — função pura sobre as linhas já
 * ordenadas ou não (ordena cópia interna). Percentuais sobre a SOMA dos
 * fornecedores listados, não sobre "todo o gasto da prefeitura": o que não
 * tem fornecedor identificado entra na lista como lacuna, mas a fatia é
 * calculada sobre este universo mesmo.
 */
export function resumoDosFornecedores(rows: FornecedorRow[]): ResumoFornecedores {
  const totalValor = rows.reduce((acc, r) => acc + (Number.isFinite(r.valor_total) ? r.valor_total : 0), 0);
  if (rows.length === 0 || totalValor <= 0) {
    return { totalValor, totalFornecedores: rows.length, top1Pct: null, top5Pct: null };
  }
  const ordenados = [...rows].sort((a, b) => b.valor_total - a.valor_total);
  const pct = (n: number) => (ordenados.slice(0, n).reduce((acc, r) => acc + r.valor_total, 0) / totalValor) * 100;
  return {
    totalValor,
    totalFornecedores: rows.length,
    top1Pct: pct(1),
    top5Pct: rows.length >= 2 ? pct(Math.min(5, rows.length)) : null,
  };
}

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  return /[;"\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/**
 * CSV do ranking filtrado — separador `;` e BOM UTF-8 (regra do dono,
 * AGENTS.md: Excel brasileiro abre tudo numa coluna e com acento quebrado
 * sem os dois). CNPJ de pessoa jurídica é público e vai no arquivo;
 * pessoa física não entra nesta tela — quem não tem CNPJ aparece pelo
 * nome publicado na fonte, e o campo `cnpj` segue vazio.
 */
export function fornecedoresToCsv(rows: FornecedorRow[]): string {
  const BOM = "\ufeff";
  const cabecalho = [
    "razao_social",
    "cnpj",
    "valor_total_contratado",
    "num_contratos",
    "num_orgaos",
    "ano_primeiro_contrato",
    "ano_ultimo_contrato",
    "data_abertura_cnpj",
    "tem_alerta",
  ].join(";");
  const linhas = rows.map((r) =>
    [
      r.razao_social,
      r.cnpj,
      r.valor_total,
      r.num_contratos,
      r.num_orgaos,
      r.ano_primeiro,
      r.ano_ultimo,
      r.data_abertura,
      r.tem_alerta ? "sim" : "nao",
    ]
      .map(csvEscape)
      .join(";")
  );
  return BOM + [cabecalho, ...linhas].join("\r\n") + "\r\n";
}
