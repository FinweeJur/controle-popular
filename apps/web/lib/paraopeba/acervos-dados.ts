/**
 * SERVER-ONLY: clippings e acervos que saíram dos módulos inline em
 * 2026-08-25 (teto de 3 MiB gzip do Worker Free, erro 10027).
 *
 * Formato dos JSONs: objeto aninhado pelo nome do export original
 * ({ CLIPPING_PARAOPEBA: [...] }, etc) conforme gravado pelo
 * scripts/dumpar-modulo-dados.mts. Assets públicos correspondentes:
 * public/data/clipping-paraopeba.json | clipping-ati.json |
 * clipping-ij.json | estudos-pericia.json.
 */
import { carregarJsonEtl } from "@/lib/server-only/json-etl";
import type { NoticiaClipping } from "./clipping";
import type { NoticiaAti } from "./clipping-ati";
import type { NoticiaInstituicaoJustica } from "./clipping-ij";
import type { EstudoPericiaComTema } from "./pericia-ufmg";

interface ResumoDoAcervo {
  coletadoEm: string;
  fonte: string;
  total: number;
  paginasNaFilaAoParar: number;
  porSecao: Record<string, number>;
  comTema: number;
  resultados: number;
}

interface BundleParaopeba {
  CLIPPING_PARAOPEBA: NoticiaClipping[];
  CLIPPING_ATI: NoticiaAti[];
  CLIPPING_IJ: NoticiaInstituicaoJustica[];
  ACERVO_PERICIA: EstudoPericiaComTema[];
  RESUMO_DO_ACERVO: ResumoDoAcervo;
}

const cache = new Map<string, unknown>();

function bloco<T>(chave: string, arquivo: string): T {
  if (!cache.has(chave)) {
    const bruto = carregarJsonEtl<Record<string, T>>(arquivo);
    cache.set(chave, bruto[chave]);
  }
  return cache.get(chave) as T;
}

/** Clipping da imprensa — Painel Paraopeba (Guaicuy). */
export function lerClippingParaopeba(): NoticiaClipping[] {
  return bloco<NoticiaClipping[]>("CLIPPING_PARAOPEBA", "clipping-paraopeba-bundle.json");
}

/** Clipping das ATIs (AEDAS/ADAI/Guaicuy). */
export function lerClippingAti(): NoticiaAti[] {
  return bloco<NoticiaAti[]>("CLIPPING_ATI", "clipping-ati-bundle.json");
}

/** Clipping das instituições de justiça. */
export function lerClippingIj(): NoticiaInstituicaoJustica[] {
  return bloco<NoticiaInstituicaoJustica[]>("CLIPPING_IJ", "clipping-ij-bundle.json");
}

/** Acervo completo da perícia da UFMG com temas resolvidos. */
export function lerAcervoPericia(): EstudoPericiaComTema[] {
  return bloco<EstudoPericiaComTema[]>("ACERVO_PERICIA", "estudos-pericia-bundle.json");
}

/** Só os que ligam a algum eixo — é o que `relacionados.ts` consome. */
export function lerEstudosPericiaComTema(): EstudoPericiaComTema[] {
  return lerAcervoPericia().filter((e) => e.temas.length > 0);
}

/** Os 7 documentos de resultado — o núcleo da página da perícia. */
export function lerResultadosPericia(): EstudoPericiaComTema[] {
  return lerAcervoPericia().filter((e) => e.secao === "apresentacao_de_resultados");
}

/** Números que a página da perícia diz em voz alta (recomputados do acervo). */
export function lerResumoDoAcervo(): ResumoDoAcervo {
  const base = bloco<ResumoDoAcervo>("RESUMO_DO_ACERVO", "estudos-pericia-bundle.json");
  const acervo = lerAcervoPericia();
  return {
    ...base,
    comTema: acervo.filter((e) => e.temas.length > 0).length,
    resultados: acervo.filter((e) => e.secao === "apresentacao_de_resultados").length,
  };
}
