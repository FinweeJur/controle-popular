/**
 * Extração e fatiamento de PDFs para o RAG documental.
 *
 * O PDF é a fonte; o texto extraído é derivado e guarda a página. O chunk
 * segue a mesma disciplina do manual: 180 palavras com 30 de sobreposição,
 * cortadas por parágrafo quando possível. O leitor recebe o trecho e o link
 * oficial com `#page=N`, para conferir no original.
 *
 * `pdf-parse` é dependência de script/servidor, não do cliente. Nenhum texto
 * deste módulo é reescrito por LLM.
 */

import { PDFParse } from "pdf-parse";
import { fatiarTexto } from "../embeddings/pedacos";
import type { DocumentoExtraido, DocumentoRagMeta, PaginaDocumento, TrechoDocumento } from "./tipos";

const MAX_PALAVRAS = 180;
const SOBREPOSICAO_PALAVRAS = 30;
const MIN_PALAVRAS = 20;
const TIMEOUT_EXTRACAO_MS = 120_000;

/**
 * Valida CPF por mod-11. A redação só troca o que é CPF de verdade; número
 * de processo, CNPJ e código de 11 dígitos que não fecha não são tocados.
 */
export function validarCpf(cpf: string): boolean {
  const digitos = cpf.replace(/\D/g, "");
  if (digitos.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false;
  const dv = (ate: number): number => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(digitos[i]) * (ate + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return dv(9) === Number(digitos[9]) && dv(10) === Number(digitos[10]);
}

/** Troca CPF real por marcador; preserva o restante do texto e a página. */
export function redigirCpf(texto: string): string {
  return texto.replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, (match) =>
    validarCpf(match) ? "[CPF removido]" : match
  );
}

function limparTextoPagina(texto: string): string {
  return redigirCpf(texto)
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function contarPalavras(texto: string): number {
  return texto.split(/\s+/).filter(Boolean).length;
}

/**
 * Extrai o texto página a página. Um PDF protegido, corrompido ou escaneado
 * sem camada de texto devolve página vazia; o chamador decide se descarta.
 */
export async function extrairPaginasPdf(
  buffer: Buffer,
  timeoutMs = TIMEOUT_EXTRACAO_MS
): Promise<PaginaDocumento[]> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    const resultado = await Promise.race([
      parser.getText(),
      new Promise<never>((_, rejeitar) => {
        timer = setTimeout(() => rejeitar(new Error("timeout ao extrair PDF")), timeoutMs);
      }),
    ]);
    return resultado.pages
      .map((pagina) => ({ numero: pagina.num, texto: limparTextoPagina(pagina.text) }))
      .filter((pagina) => pagina.texto.length > 0);
  } finally {
    if (timer) clearTimeout(timer);
    await parser.destroy().catch(() => undefined);
  }
}

/**
 * Converte páginas em trechos citáveis. O id inclui documento, página e
 * posição para a UI poder repetir a citação sem colidir.
 */
export function fatiarDocumento(documento: DocumentoExtraido): TrechoDocumento[] {
  const trechos: TrechoDocumento[] = [];

  for (const pagina of documento.paginas) {
    const textoPagina = redigirCpf(pagina.texto);
    const pedacos = fatiarTexto(textoPagina, {
      maxPalavras: MAX_PALAVRAS,
      sobreposicaoPalavras: SOBREPOSICAO_PALAVRAS,
    });
    pedacos.forEach((pedaco, indice) => {
      const palavras = contarPalavras(pedaco.texto);
      const unicoDaPagina = pedacos.length === 1;
      if (palavras < MIN_PALAVRAS && !(unicoDaPagina && palavras > 0)) return;

      trechos.push({
        id: `${documento.id}:p${pagina.numero}:c${indice}`,
        docId: documento.id,
        titulo: documento.titulo,
        tipo: documento.tipo,
        categoria: documento.categoria,
        tema: documento.tema,
        orgao: documento.orgao,
        ano: documento.ano,
        pagina: pagina.numero,
        texto: pedaco.texto,
        urlOriginal: documento.urlOriginal,
        urlPdf: documento.urlPdf,
        resumo: redigirCpf(documento.resumo),
        tags: documento.tags,
        fonte: documento.fonte,
      });
    });
  }

  return trechos;
}

/** Metadados mínimos para o índice, sem carregar páginas. */
export function metaDoDocumento(documento: DocumentoExtraido): DocumentoRagMeta {
  const { paginas: _paginas, ...meta } = documento;
  return meta;
}
