/**
 * Índice lexical e facetado dos trechos de documentos.
 *
 * Primeira camada do RAG documental: barata, determinística e auditável.
 * O embedding pode entrar depois, só nos candidatos; o que não pode faltar
 * é o trecho certo com página e link oficial. O índice é derivado dos
 * `TrechoDocumento`; não lê PDF nem rede em tempo de consulta.
 */

import { separarPalavras } from "@/lib/busca/normalizar";
import type {
  ConsultaDocumentos,
  DocumentoRagMeta,
  IndiceDocumentos,
  MapaDocumentos,
  ResultadoDocumento,
  TrechoDocumento,
} from "./tipos";

function unicos<T>(valores: T[]): T[] {
  return [...new Set(valores)];
}

function adicionar(mapa: Map<string, string[]>, chave: string, id: string): void {
  const atual = mapa.get(chave);
  if (atual) {
    if (!atual.includes(id)) atual.push(id);
    return;
  }
  mapa.set(chave, [id]);
}

function termosDoTrecho(trecho: TrechoDocumento): string[] {
  const base = [
    trecho.texto,
    trecho.titulo,
    trecho.categoria,
    trecho.tema,
    trecho.orgao,
    ...trecho.tags,
  ].join(" ");
  return unicos(separarPalavras(base).filter((t) => t.length >= 3));
}

function anoDoTrecho(trecho: TrechoDocumento): string | null {
  return trecho.ano ? String(trecho.ano) : null;
}

/** URL oficial no ponto do trecho; o `#page=N` é o que permite conferir. */
export function urlDoTrecho(trecho: TrechoDocumento): string {
  if (!trecho.urlPdf) return trecho.urlOriginal;
  if (!trecho.pagina) return trecho.urlPdf;
  return `${trecho.urlPdf}${trecho.urlPdf.includes("#") ? "&" : "#"}page=${trecho.pagina}`;
}

export function construirIndiceDocumentos(entrada: readonly TrechoDocumento[]): IndiceDocumentos {
  const vistos = new Set<string>();
  const trechos: TrechoDocumento[] = [];
  for (const trecho of entrada) {
    if (vistos.has(trecho.id)) continue;
    vistos.add(trecho.id);
    trechos.push(trecho);
  }

  const documentosPorId = new Map<string, DocumentoRagMeta>();
  const porTermo = new Map<string, string[]>();
  const porCategoria = new Map<string, string[]>();
  const porTema = new Map<string, string[]>();
  const porAno = new Map<string, string[]>();
  const frequencia = new Map<string, number>();

  for (const trecho of trechos) {
    if (!documentosPorId.has(trecho.docId)) {
      documentosPorId.set(trecho.docId, {
        id: trecho.docId,
        titulo: trecho.titulo,
        tipo: trecho.tipo,
        categoria: trecho.categoria,
        tema: trecho.tema,
        orgao: trecho.orgao,
        ano: trecho.ano,
        data: null,
        urlOriginal: trecho.urlOriginal,
        urlPdf: trecho.urlPdf,
        resumo: trecho.resumo,
        tags: trecho.tags,
        fonte: trecho.fonte,
      });
    }

    adicionar(porCategoria, trecho.categoria, trecho.id);
    adicionar(porTema, trecho.tema, trecho.id);
    const ano = anoDoTrecho(trecho);
    if (ano) adicionar(porAno, ano, trecho.id);

    for (const termo of termosDoTrecho(trecho)) {
      adicionar(porTermo, termo, trecho.id);
      frequencia.set(termo, (frequencia.get(termo) ?? 0) + 1);
    }
  }

  const total = trechos.length || 1;
  const idf = new Map<string, number>();
  for (const [termo, df] of frequencia) {
    idf.set(termo, Math.log(1 + total / (1 + df)));
  }

  return {
    documentos: [...documentosPorId.values()],
    trechos,
    porTermo,
    idf,
    porCategoria,
    porTema,
    porAno,
  };
}

function passaFiltros(trecho: TrechoDocumento, consulta: ConsultaDocumentos): boolean {
  if (consulta.categoria && trecho.categoria !== consulta.categoria) return false;
  if (consulta.tema && trecho.tema !== consulta.tema) return false;
  if (consulta.ano && trecho.ano !== consulta.ano) return false;
  return true;
}

function scoreDoTrecho(
  indice: IndiceDocumentos,
  trecho: TrechoDocumento,
  termos: readonly string[],
  textoNormalizado: string
): { score: number; motivos: string[] } {
  let pesoEncontrado = 0;
  let pesoTotal = 0;
  const motivos: string[] = [];

  for (const termo of termos) {
    const peso = indice.idf.get(termo) ?? 1;
    pesoTotal += peso;
    if (indice.porTermo.get(termo)?.includes(trecho.id)) {
      pesoEncontrado += peso;
      motivos.push(`termo:${termo}`);
    }
  }

  let score = pesoTotal > 0 ? (pesoEncontrado / pesoTotal) * 0.75 : 0;
  const texto = trecho.texto.toLowerCase();
  const titulo = trecho.titulo.toLowerCase();
  if (textoNormalizado && texto.includes(textoNormalizado)) {
    score += 0.2;
    motivos.push("frase");
  }
  if (textoNormalizado && titulo.includes(textoNormalizado)) {
    score += 0.1;
    motivos.push("titulo");
  }

  return { score, motivos };
}

/**
 * Consulta os trechos. Exige pelo menos um termo útil; não devolve documento
 * só porque ele existe. O limite por documento evita que um PDF de 200
 * páginas ocupe todas as citações.
 */
export function consultarDocumentos(
  indice: IndiceDocumentos,
  consulta: ConsultaDocumentos
): ResultadoDocumento[] {
  const termos = unicos(separarPalavras(consulta.texto).filter((t) => t.length >= 3));
  if (termos.length === 0) return [];

  const limite = Math.max(1, Math.min(20, consulta.limite ?? 6));
  const textoNormalizado = consulta.texto.trim().toLowerCase();
  const resultados: ResultadoDocumento[] = [];

  for (const trecho of indice.trechos) {
    if (!passaFiltros(trecho, consulta)) continue;
    const { score, motivos } = scoreDoTrecho(indice, trecho, termos, textoNormalizado);
    if (score <= 0) continue;
    resultados.push({ trecho, score: Number(score.toFixed(4)), motivos: unicos(motivos) });
  }

  resultados.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.trecho.pagina ?? 0) - (b.trecho.pagina ?? 0);
  });

  const porDocumento = new Map<string, number>();
  const selecionados: ResultadoDocumento[] = [];
  for (const resultado of resultados) {
    const usados = porDocumento.get(resultado.trecho.docId) ?? 0;
    if (usados >= 2) continue;
    porDocumento.set(resultado.trecho.docId, usados + 1);
    selecionados.push(resultado);
    if (selecionados.length >= limite) break;
  }

  return selecionados;
}

function contar(mapa: ReadonlyMap<string, readonly string[]>): { slug: string; contagem: number }[] {
  return [...mapa.entries()]
    .map(([slug, ids]) => ({ slug, contagem: ids.length }))
    .sort((a, b) => b.contagem - a.contagem || a.slug.localeCompare(b.slug));
}

export function construirMapaDocumentos(indice: IndiceDocumentos): MapaDocumentos {
  return {
    totalDocumentos: indice.documentos.length,
    totalTrechos: indice.trechos.length,
    porCategoria: contar(indice.porCategoria),
    porTema: contar(indice.porTema),
    porAno: contar(indice.porAno).sort((a, b) => Number(b.slug) - Number(a.slug)),
  };
}

/** Resumo curto para prompt; não despeja trechos nem links. */
export function resumoMapaDocumentos(mapa: MapaDocumentos): string {
  const categorias = mapa.porCategoria
    .slice(0, 8)
    .map((c) => `${c.slug} (${c.contagem})`)
    .join(", ");
  const temas = mapa.porTema
    .slice(0, 8)
    .map((t) => `${t.slug} (${t.contagem})`)
    .join(", ");
  return (
    `RAG documental: ${mapa.totalDocumentos} documentos e ${mapa.totalTrechos} trechos. ` +
    `Categorias: ${categorias || "nenhuma"}. Temas: ${temas || "nenhum"}.`
  );
}
