/**
 * Rubrica garantista × reducionista — lado TypeScript.
 *
 * O cálculo do rótulo vive AQUI, não no LLM. O modelo só preenche
 * `analise_itens` (direito + dispositivo + direção + mecanismo + grau +
 * trecho); `score` e `rotulo` saem desta função de forma determinística.
 * É isso que torna a classificação auditável — o usuário clica no score,
 * vê cada item que o compôs e o trecho do PL que o embasa — e é isso que
 * permite usar um modelo local pequeno: ele extrai, não julga.
 *
 * A taxonomia é lida de `rubrica/rubrica.json`, fonte canônica única
 * compartilhada com `etl/rubrica.py`. Não duplicar nada dela aqui.
 */
import rubricaJson from "./rubrica/rubrica.json";

export const RUBRICA = rubricaJson;
export const VERSAO_RUBRICA: string = rubricaJson.versao;

export type Direcao = "amplia" | "restringe" | "neutro";
export type Grau = "marginal" | "moderado" | "estrutural";
export type Rotulo =
  | "garantista_forte"
  | "garantista"
  | "neutro"
  | "misto"
  | "reducionista"
  | "reducionista_forte";

export interface AnaliseItem {
  direito: string;
  dispositivo: string;
  direcao: Direcao;
  mecanismo?: string | null;
  titulares?: string[] | null;
  grau: Grau;
  trecho?: string | null;
  confianca: number;
  peso?: number | null;
}

export interface ResultadoRubrica {
  score: number;
  rotulo: Rotulo;
  /** true quando há itens ampliativos E restritivos com peso relevante. */
  misto: boolean;
  /** true quando algum item ficou abaixo da confiança mínima. */
  requerRevisao: boolean;
  itens: (AnaliseItem & { peso: number })[];
}

const PESO_GRAU = RUBRICA.pesos.grau as Record<Grau, number>;
const PESO_DIRECAO = RUBRICA.pesos.direcao as Record<Direcao, number>;

export function pesoDoItem(item: AnaliseItem): number {
  const g = PESO_GRAU[item.grau] ?? 0;
  const d = PESO_DIRECAO[item.direcao] ?? 0;
  const c = Number.isFinite(item.confianca) ? item.confianca : 0;
  return g * d * c;
}

/**
 * Item sem dispositivo legal citado NÃO entra no score. É a trava contra o
 * modelo alucinar um artigo e ainda assim mover o rótulo — a exigência de
 * fundamentação é o que separa esta análise de um palpite.
 */
export function itemValido(item: AnaliseItem): boolean {
  return Boolean(
    item.dispositivo?.trim() &&
      item.direito?.trim() &&
      item.direcao in PESO_DIRECAO &&
      item.grau in PESO_GRAU
  );
}

export function calcularRubrica(itens: AnaliseItem[]): ResultadoRubrica {
  const validos = itens.filter(itemValido).map((i) => ({ ...i, peso: pesoDoItem(i) }));
  const score = Number(validos.reduce((acc, i) => acc + i.peso, 0).toFixed(2));

  // "Misto" não é uma faixa do score — é uma condição sobre a composição.
  // Um PL que amplia um direito e restringe outro com pesos semelhantes
  // somaria ~0 e apareceria como "neutro", que é a leitura errada: ele é
  // controverso, não inócuo. Nesse caso mostramos os dois lados.
  const positivos = validos.filter((i) => i.peso > 0).reduce((a, i) => a + i.peso, 0);
  const negativos = Math.abs(validos.filter((i) => i.peso < 0).reduce((a, i) => a + i.peso, 0));
  const misto = positivos >= 1 && negativos >= 1;

  const requerRevisao = validos.some((i) => i.confianca < RUBRICA.confianca_minima);

  const rotulo: Rotulo = misto ? "misto" : rotuloPorScore(score);

  return { score, rotulo, misto, requerRevisao, itens: validos };
}

export function rotuloPorScore(score: number): Rotulo {
  for (const faixa of RUBRICA.faixas) {
    if (score >= faixa.min) return faixa.rotulo as Rotulo;
  }
  return "neutro";
}

export function labelDoRotulo(rotulo: Rotulo): string {
  if (rotulo === "misto") return "Misto (amplia e restringe)";
  return RUBRICA.faixas.find((f) => f.rotulo === rotulo)?.label ?? "Sem classificação";
}

export function labelDoDireito(slug: string): string {
  return (RUBRICA.direitos as Record<string, { rotulo: string }>)[slug]?.rotulo ?? slug;
}

export function ancorasDoDireito(slug: string): string[] {
  return (RUBRICA.direitos as Record<string, { ancoras: string[] }>)[slug]?.ancoras ?? [];
}

export function labelDoMecanismo(slug: string | null | undefined): string {
  if (!slug) return "—";
  return (RUBRICA.mecanismos as Record<string, { rotulo: string }>)[slug]?.rotulo ?? slug;
}

export const DIREITOS = Object.keys(RUBRICA.direitos);
export const MECANISMOS = Object.keys(RUBRICA.mecanismos);
