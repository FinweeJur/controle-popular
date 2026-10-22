/**
 * Índice lexical e facetado da jurimetria do TJMG.
 *
 * Por que não começar por embedding: o corpus tem 5.426 processos e 3,3 MB
 * de ementa. O RAG global hoje tem 450 pedaços e calcula embedding no
 * primeiro pedido; repetir isso com 5 mil decisões atrasaria a primeira
 * resposta e gastaria chamada sem necessidade. O caminho barato e auditável
 * é filtrar por faceta e ranquear por termo; embedding entra depois, só nos
 * candidatos, se a avaliação mostrar ganho.
 *
 * A interface é deliberadamente pequena:
 * - `construirIndice` monta as facetas e o índice invertido;
 * - `consultar` filtra e ranqueia;
 * - `relacionadas` liga decisões por tema, norma, dano e comarca.
 */

import { separarPalavras } from "@/lib/busca/normalizar";
import { DANOS, NORMAS, TEMAS, temaConfig } from "./taxonomia";
import { deduplicarDecisoes, normalizarTexto } from "./normalizar";
import type {
  ConsultaJurimetria,
  DecisaoJurimetria,
  IndiceJurimetria,
  ResultadoConsulta,
} from "./tipos";

function adicionar(mapa: Map<string, string[]>, chave: string, id: string): void {
  const atual = mapa.get(chave);
  if (atual) {
    if (!atual.includes(id)) atual.push(id);
    return;
  }
  mapa.set(chave, [id]);
}

function termosDaDecisao(decisao: DecisaoJurimetria): string[] {
  const partes: string[] = [
    decisao.ementa,
    decisao.numeroAcordao ?? "",
    decisao.processo,
    decisao.classe,
    decisao.relator,
    decisao.comarca ?? "",
  ];

  for (const slug of decisao.temas) {
    const tema = temaConfig(slug);
    if (!tema) continue;
    partes.push(tema.label, tema.descricao, ...tema.palavrasChave, ...tema.sinonimos);
  }
  for (const id of decisao.normas) {
    const norma = NORMAS.find((n) => n.id === id);
    if (norma) partes.push(norma.label, ...norma.termos);
  }
  for (const id of decisao.danos) {
    const dano = DANOS.find((d) => d.id === id);
    if (dano) partes.push(dano.label, ...dano.termos);
  }

  return [...new Set(separarPalavras(partes.join(" ")).filter((t) => t.length >= 3))];
}

function anoDaDecisao(decisao: DecisaoJurimetria): string | null {
  return decisao.dataJulgamento?.slice(0, 4) ?? null;
}

export function construirIndice(entrada: readonly DecisaoJurimetria[]): IndiceJurimetria {
  const decisoes = deduplicarDecisoes(entrada);
  const porId = new Map<string, DecisaoJurimetria>();
  const porTema = new Map<string, string[]>();
  const porNorma = new Map<string, string[]>();
  const porDano = new Map<string, string[]>();
  const porComarca = new Map<string, string[]>();
  const porResultado = new Map<string, string[]>();
  const porAno = new Map<string, string[]>();
  const porTermo = new Map<string, string[]>();
  const frequencia = new Map<string, number>();

  for (const decisao of decisoes) {
    porId.set(decisao.id, decisao);
    for (const tema of decisao.temas) adicionar(porTema, tema, decisao.id);
    for (const norma of decisao.normas) adicionar(porNorma, norma, decisao.id);
    for (const dano of decisao.danos) adicionar(porDano, dano, decisao.id);
    if (decisao.comarca) adicionar(porComarca, decisao.comarca, decisao.id);
    adicionar(porResultado, decisao.resultado, decisao.id);
    const ano = anoDaDecisao(decisao);
    if (ano) adicionar(porAno, ano, decisao.id);

    for (const termo of termosDaDecisao(decisao)) {
      adicionar(porTermo, termo, decisao.id);
      frequencia.set(termo, (frequencia.get(termo) ?? 0) + 1);
    }
  }

  const total = decisoes.length || 1;
  const idf = new Map<string, number>();
  for (const [termo, df] of frequencia) {
    idf.set(termo, Math.log(1 + total / (1 + df)));
  }

  return {
    decisoes,
    porId,
    porTema,
    porNorma,
    porDano,
    porComarca,
    porResultado,
    porAno,
    porTermo,
    idf,
  };
}

function passaFiltros(decisao: DecisaoJurimetria, consulta: ConsultaJurimetria): boolean {
  if (consulta.tema && !decisao.temas.includes(consulta.tema)) return false;
  if (consulta.norma && !decisao.normas.includes(consulta.norma)) return false;
  if (consulta.dano && !decisao.danos.includes(consulta.dano)) return false;
  if (consulta.resultado && decisao.resultado !== consulta.resultado) return false;
  if (consulta.comarca && normalizarTexto(decisao.comarca ?? "") !== normalizarTexto(consulta.comarca)) {
    return false;
  }
  if (consulta.ano && anoDaDecisao(decisao) !== String(consulta.ano)) return false;
  return true;
}

function scoreTextual(
  indice: IndiceJurimetria,
  decisao: DecisaoJurimetria,
  termos: readonly string[],
  textoNormalizado: string
): { score: number; motivos: string[] } {
  if (termos.length === 0) return { score: 1, motivos: ["filtro"] };

  let pesoEncontrado = 0;
  let pesoTotal = 0;
  const motivos: string[] = [];

  for (const termo of termos) {
    const peso = indice.idf.get(termo) ?? 1;
    pesoTotal += peso;
    if (indice.porTermo.get(termo)?.includes(decisao.id)) {
      pesoEncontrado += peso;
      motivos.push(`termo:${termo}`);
    }
  }

  let score = pesoTotal > 0 ? (pesoEncontrado / pesoTotal) * 0.7 : 0;
  const ementa = normalizarTexto(decisao.ementa);
  if (textoNormalizado && ementa.includes(textoNormalizado)) {
    score += 0.2;
    motivos.push("frase");
  }
  if (textoNormalizado && decisao.numeroAcordao && normalizarTexto(decisao.numeroAcordao).includes(textoNormalizado)) {
    score += 0.5;
    motivos.push("acordao");
  }
  if (textoNormalizado && normalizarTexto(decisao.processo).includes(textoNormalizado)) {
    score += 0.4;
    motivos.push("processo");
  }

  return { score, motivos };
}

function boostDeFaceta(decisao: DecisaoJurimetria, consulta: ConsultaJurimetria, motivos: string[]): number {
  let boost = 0;
  if (consulta.tema && decisao.temas.includes(consulta.tema)) {
    boost += 0.15;
    motivos.push(`tema:${consulta.tema}`);
  }
  if (consulta.norma && decisao.normas.includes(consulta.norma)) {
    boost += 0.1;
    motivos.push(`norma:${consulta.norma}`);
  }
  if (consulta.dano && decisao.danos.includes(consulta.dano)) {
    boost += 0.1;
    motivos.push(`dano:${consulta.dano}`);
  }
  if (consulta.comarca && normalizarTexto(decisao.comarca ?? "") === normalizarTexto(consulta.comarca)) {
    boost += 0.1;
    motivos.push(`comarca:${consulta.comarca}`);
  }
  return boost;
}

/**
 * Consulta o índice. Sem `texto`, devolve as decisões mais recentes que
 * passam pelos filtros; com `texto`, exige pelo menos um termo encontrado.
 */
export function consultar(indice: IndiceJurimetria, consulta: ConsultaJurimetria = {}): ResultadoConsulta[] {
  const limite = Math.max(1, Math.min(50, consulta.limite ?? 10));
  const termos = consulta.texto
    ? [...new Set(separarPalavras(consulta.texto).filter((t) => t.length >= 3))]
    : [];
  const textoNormalizado = consulta.texto ? normalizarTexto(consulta.texto) : "";

  const resultados: ResultadoConsulta[] = [];
  for (const decisao of indice.decisoes) {
    if (!passaFiltros(decisao, consulta)) continue;
    const { score, motivos } = scoreTextual(indice, decisao, termos, textoNormalizado);
    if (termos.length > 0 && score <= 0) continue;
    const boost = boostDeFaceta(decisao, consulta, motivos);
    resultados.push({
      decisao,
      score: Number((score + boost).toFixed(4)),
      motivos: [...new Set(motivos)],
    });
  }

  resultados.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const dataA = a.decisao.dataJulgamento ?? "";
    const dataB = b.decisao.dataJulgamento ?? "";
    if (dataA !== dataB) return dataB.localeCompare(dataA);
    return a.decisao.id.localeCompare(b.decisao.id);
  });

  return resultados.slice(0, limite);
}

/**
 * Decisões relacionadas por coocorrência. Não é recomendação editorial:
 * é navegação auditável — mesma bacia, mesma norma, mesmo dano.
 */
export function relacionadas(
  indice: IndiceJurimetria,
  id: string,
  limite = 5
): ResultadoConsulta[] {
  const alvo = indice.porId.get(id);
  if (!alvo) return [];

  const candidatos = new Set<string>();
  for (const tema of alvo.temas) {
    for (const outro of indice.porTema.get(tema) ?? []) candidatos.add(outro);
  }
  for (const norma of alvo.normas) {
    for (const outro of indice.porNorma.get(norma) ?? []) candidatos.add(outro);
  }
  for (const dano of alvo.danos) {
    for (const outro of indice.porDano.get(dano) ?? []) candidatos.add(outro);
  }
  candidatos.delete(id);

  const resultados: ResultadoConsulta[] = [];
  for (const candidatoId of candidatos) {
    const decisao = indice.porId.get(candidatoId);
    if (!decisao) continue;

    let score = 0;
    const motivos: string[] = [];
    if (decisao.temas.some((tema) => alvo.temas.includes(tema))) {
      score += 3;
      motivos.push("mesmo tema");
    }
    if (decisao.normas.some((norma) => alvo.normas.includes(norma))) {
      score += 2;
      motivos.push("mesma norma");
    }
    if (decisao.danos.some((dano) => alvo.danos.includes(dano))) {
      score += 1.5;
      motivos.push("mesmo dano");
    }
    if (decisao.comarca && alvo.comarca && decisao.comarca === alvo.comarca) {
      score += 1;
      motivos.push("mesma comarca");
    }
    if (anoDaDecisao(decisao) === anoDaDecisao(alvo)) {
      score += 0.5;
      motivos.push("mesmo ano");
    }
    if (decisao.relator && alvo.relator && decisao.relator === alvo.relator) {
      score += 0.5;
      motivos.push("mesmo relator");
    }

    resultados.push({ decisao, score: Number(score.toFixed(2)), motivos });
  }

  resultados.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.decisao.dataJulgamento ?? "").localeCompare(a.decisao.dataJulgamento ?? "");
  });

  return resultados.slice(0, Math.max(1, limite));
}

/** Cobertura simples para o mapa e para o teste de contrato. */
export function contarPorTema(indice: IndiceJurimetria): Record<string, number> {
  const resultado: Record<string, number> = {};
  for (const tema of TEMAS) {
    resultado[tema.slug] = indice.porTema.get(tema.slug)?.length ?? 0;
  }
  return resultado;
}
