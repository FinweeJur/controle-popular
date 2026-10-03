/**
 * Curadoria da memória — aplica as correções versionadas sobre o calendário.
 *
 * Papel no portal: o `lib/memoria/calendario.ts` é GERADO por
 * `scripts/memoria/gera-calendario-insurgente.py` e não se edita à mão. As
 * melhorias de texto (título curto por verbete e resumo revisado) vivem num
 * overlay versionado, `correcoes-mistica.ts`, gerado a partir do relatório da
 * revisão assistida (`scripts/revisar-textos-memoria.mts` →
 * `docs/relatorios-automacao/revisao-textos-memoria.json`).
 *
 * Por que overlay e não editar o gerado: assim a correção sobrevive a uma
 * nova geração do calendário e o dado continua vindo da fonte — a revisão só
 * PROPÔS, o dono aprovou (regra do AGENTS: resumo nunca reescrito por máquina
 * às cegas).
 *
 * Chave estável: `chaveCorrecao()` combina dia/mês + ano + início do título
 * normalizado. Casa por CONTEÚDO, não por posição — uma nova geração que
 * reordena entradas não perde a correção.
 */

import { CALENDARIO_LUTAS } from "./calendario";
import type { EntradaCalendario } from "./tipos";
import { CORRECOES } from "./correcoes-mistica";
import { COMPLEMENTOS } from "./complementos-mistica";

/** Normaliza para a chave: sem acento, minúsculo, espaços colapsados. */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Chave estável de uma entrada na curadoria (dia/mês + ano + início do título). */
export function chaveCorrecao(e: EntradaCalendario): string {
  return `${e.diaMes}|${e.ano || "s/ano"}|${normalizar(e.titulo).slice(0, 48)}`;
}

/**
 * Aplica a correção da entrada, se houver. Sem correção, devolve a MESMA
 * entrada (não inventa campo nem texto).
 */
export function aplicarCorrecao(e: EntradaCalendario): EntradaCalendario {
  const c = CORRECOES[chaveCorrecao(e)];
  if (!c) return e;
  return {
    ...e,
    tituloCurto: c.tituloCurto ?? e.tituloCurto,
    resumo: c.resumo ?? e.resumo,
  };
}

/**
 * O calendário como a tela deve ler: o calendário gerado (com os títulos
 * curtos e resumos revisados aplicados) + os COMPLEMENTOS versionados (fatos
 * do acervo do MAB, terceira fonte). É esta lista que os consumidores usam — a
 * crua (`CALENDARIO_LUTAS`) fica para teste e geração.
 */
export const CALENDARIO: EntradaCalendario[] = [
  ...CALENDARIO_LUTAS.map(aplicarCorrecao),
  ...COMPLEMENTOS,
];
