/**
 * ═══ EXPORTADOR UNIVERSAL DE CSV — CONTROLE POPULAR ═══
 *
 * ═══ POR QUE ISTO EXISTE ═══
 *
 * O portal publica listas extensas de interesse cívico (licitações, TACs,
 * diários oficiais, empenhos de Mariana, convênios, jurisprudência).
 * O leitor tem direito de baixar os dados que estão filtrados na tela para
 * auditar por conta própria no Excel, LibreOffice ou Python.
 *
 * ═══ REGRAS QUE NÃO SE NEGOCIAM (AGENTS.md & RFC-4180) ═══
 *
 * 1. Separador SEMPRE `;` (ponto e vírgula): no padrão regional pt-BR (vírgula
 *    como separador decimal), arquivos delimitados por vírgula abrem quebrados no
 *    Excel brasileiro.
 * 2. BOM UTF-8 (`\uFEFF`): adicionado no byte 0 para que editores identifiquem
 *    a codificação UTF-8 sem corromper acentuações e caracteres diacríticos da língua portuguesa.
 * 3. Escape Estrito: todo valor que contiver `;`, `"`, `\n` ou `\r` é delimitado
 *    por aspas duplas, e aspas internas são duplicadas (`"` vira `""`).
 * 4. Valores nulos ou indefinidos são emitidos como strings vazias, nunca como "null" ou "undefined".
 */

export interface ColunaCsv<T> {
  /** Chave da propriedade na linha do objeto de dados */
  chave: keyof T & string;
  /** Rótulo legível que será renderizado no cabeçalho do CSV */
  rotulo: string;
  /** Função opcional de transformação (ex.: formatar data ISO para DD/MM/AAAA, moeda ou máscara) */
  formatar?: (valor: any, linha: T) => string | number | null | undefined;
}

/**
 * Escapa uma célula individual conforme as regras de compatibilidade do Excel BR e RFC-4180.
 */
export function escaparCelulaCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(";") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converte um array de objetos em string CSV compatível com Excel BR:
 * - Começa estritamente com `\uFEFF` (BOM UTF-8).
 * - Usa `;` como separador de colunas.
 * - Usa `\r\n` como terminador de linhas.
 */
export function formatarCsv<T extends Record<string, any>>(
  colunas: readonly ColunaCsv<T>[],
  linhas: readonly T[]
): string {
  const BOM = "\uFEFF";
  const separador = ";";

  const cabecalho = colunas.map((c) => escaparCelulaCsv(c.rotulo)).join(separador);

  const corpo = linhas.map((linha) =>
    colunas
      .map((col) => {
        const valorCru = linha[col.chave];
        const valorFormatado = col.formatar ? col.formatar(valorCru, linha) : valorCru;
        return escaparCelulaCsv(valorFormatado);
      })
      .join(separador)
  );

  return BOM + [cabecalho, ...corpo].join("\r\n") + "\r\n";
}

/**
 * Dispara o download de um arquivo CSV diretamente no navegador do usuário.
 * Cria e limpa o Blob e URL temporária com segurança de memória.
 */
export function baixarCsv<T extends Record<string, any>>(
  colunas: readonly ColunaCsv<T>[],
  linhas: readonly T[],
  nomeArquivo: string
): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  // Contador público de downloads (PLANO-NAVEGACAO-E-NOTIFICACOES.md):
  // beacon fogo-e-esqueça; falha não impede o download.
  fetch("/api/contador?tipo=download", { method: "POST", keepalive: true }).catch(() => {});

  const conteudo = formatarCsv(colunas, linhas);
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", nomeArquivo.endsWith(".csv") ? nomeArquivo : `${nomeArquivo}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

