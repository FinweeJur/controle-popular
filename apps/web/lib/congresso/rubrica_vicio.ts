/**
 * Vício legislativo / indício de inconstitucionalidade — lado TypeScript.
 *
 * Companheira de `rubrica.ts` (análise garantista), NÃO substituta: as duas
 * leem o mesmo PL e produzem resultados independentes num mesmo item —
 * `nivel_gravidade` aqui não tem relação nenhuma com `rotulo` de lá.
 *
 * `nivel_gravidade` NUNCA vem do modelo. Ele sai de `calcularVicio()` desta
 * função, determinístico, a partir de `gravidade_base` de cada categoria que
 * sobreviveu à validação — mesma separação (modelo extrai, app decide) que
 * torna a análise garantista auditável.
 *
 * REGRA INEGOCIÁVEL: nada que sai daqui é veredito. Controle de
 * constitucionalidade é função do Judiciário. Todo texto voltado ao cidadão
 * que usa este módulo tem que deixar isso explícito — ver `labelDoNivel` e o
 * componente `VicioBadge`.
 */
import vicioJson from "./rubrica/vicio_legislativo.json";

export const RUBRICA_VICIO = vicioJson;
export const VERSAO_RUBRICA_VICIO: string = vicioJson.versao;

export type Eixo = "federal" | "municipal";
export type Categoria =
  | "vicio_iniciativa"
  | "vicio_competencia"
  | "inconstitucionalidade_material"
  | "vicio_formal"
  | "contrabando_legislativo";
export type NivelGravidade = "sem_indicio" | "indicio_leve" | "indicio_grave";

export interface VicioItem {
  categoria: Categoria;
  dispositivo: string;
  justificativa?: string | null;
  trecho?: string | null;
  confianca: number;
}

export interface ResultadoVicio {
  nivelGravidade: NivelGravidade;
  /** true quando algum item ficou abaixo da confiança mínima. */
  requerRevisao: boolean;
  itens: VicioItem[];
}

const CATEGORIAS = RUBRICA_VICIO.categorias as Record<
  Categoria,
  { rotulo: string; eixos: Eixo[]; gravidade_base: NivelGravidade; descricao: string; ancoras: Partial<Record<Eixo, string[]>> }
>;

const ORDEM_GRAVIDADE: Record<NivelGravidade, number> = {
  sem_indicio: 0,
  indicio_leve: 1,
  indicio_grave: 2,
};

/**
 * Item sem dispositivo citado NÃO entra no cálculo — mesma trava da rubrica
 * garantista contra o modelo alucinar um artigo e ainda assim mover o nível.
 */
export function itemValido(item: VicioItem): boolean {
  return Boolean(item.dispositivo?.trim() && item.categoria in CATEGORIAS);
}

export function calcularVicio(itens: VicioItem[]): ResultadoVicio {
  const validos = itens.filter(itemValido);

  let nivel: NivelGravidade = "sem_indicio";
  for (const item of validos) {
    const base = CATEGORIAS[item.categoria]?.gravidade_base ?? "indicio_leve";
    if (ORDEM_GRAVIDADE[base] > ORDEM_GRAVIDADE[nivel]) nivel = base;
  }

  const confiancaMinima = RUBRICA_VICIO.confianca_minima;
  const requerRevisao = validos.some((i) => i.confianca < confiancaMinima);

  return { nivelGravidade: nivel, requerRevisao, itens: validos };
}

export function labelDoNivel(nivel: NivelGravidade | null | undefined): string {
  if (!nivel) return "Sem indício";
  return (
    RUBRICA_VICIO.niveis_gravidade.find((n) => n.rotulo === nivel)?.label ?? "Sem indício"
  );
}

export function labelDaCategoria(slug: string): string {
  return CATEGORIAS[slug as Categoria]?.rotulo ?? slug;
}

export function descricaoDaCategoria(slug: string): string {
  return CATEGORIAS[slug as Categoria]?.descricao ?? "";
}

export function ancorasDaCategoria(slug: string, eixo: Eixo): string[] {
  return CATEGORIAS[slug as Categoria]?.ancoras[eixo] ?? [];
}

export function categoriasDoEixo(eixo: Eixo): Categoria[] {
  return (Object.keys(CATEGORIAS) as Categoria[]).filter((c) =>
    CATEGORIAS[c].eixos.includes(eixo)
  );
}

export const CATEGORIAS_SLUGS = Object.keys(CATEGORIAS) as Categoria[];

/** Texto de ressalva fixo — reusado em qualquer lugar que mostre um indício
 * ao cidadão. Não varia por categoria de propósito: a ressalva vale igual
 * para todas, e um texto diferente por categoria correria o risco de uma
 * ficar mais fraca que a outra sem ninguém perceber. */
export const RESSALVA_INDICIO =
  "Isto é um indício apontado por inteligência artificial, com base no dispositivo legal citado — não é parecer jurídico nem decisão judicial. Só o Poder Judiciário (STF e tribunais) pode declarar uma lei inconstitucional.";
