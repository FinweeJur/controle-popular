/**
 * Oficina do `home-pc` — perfis por capacidade de hardware.
 *
 * ═══ O QUE É ═══
 *
 * Funções puras que olham a máquina (RAM, núcleos, GPU) e escolhem um PERFIL
 * de trabalho com modelos locais do Ollama. É a inteligência da "oficina":
 * o `home-pc` é mais fraco que a máquina de build, então aqui não se escolhe
 * modelo por moda — escolhe-se pelo que cabe e termina.
 *
 * ═══ POR QUE SIMPLIFICAR ═══
 *
 * Em hardware fraco, modelo grande não erra devagar: ele trava a máquina
 * inteira e ninguém consegue usar o PC. Por isso o perfil "leve" é o padrão
 * seguro, single-thread (1 job), com modelos de 1–1,5 bilhão de parâmetros.
 * Subir de perfil é decisão consciente, não automática.
 *
 * ═══ FONTE DOS MODELOS ═══
 *
 * Nomes de modelo são do catálogo do Ollama (tag `:Nb`). A lista de fontes e o
 * desenho da esteira estão em `docs/05-operacao/PLANO-AUTOMACAO-LOCAL.md`.
 */

export interface Hardware {
  ramGb: number;
  /** Núcleos lógicos disponíveis (`os.cpus().length`). */
  cpus: number;
  /** Se há GPU utilizável (detectada no runner). */
  temGpu: boolean;
}

export type PerfilId = "leve" | "medio" | "forte";

export interface Perfil {
  id: PerfilId;
  rotulo: string;
  descricao: string;
  /** Modelos usados por papel. */
  modelos: { resumo: string; embed: string; codigo: string };
  /** Quantos trabalhos em paralelo (1 = mais seguro em hardware fraco). */
  maxParalelo: number;
  /** Quantos textos por lote na vetorização. */
  batchEmbeddings: number;
}

export const PERFIS: Record<PerfilId, Perfil> = {
  leve: {
    id: "leve",
    rotulo: "Leve (padrão seguro)",
    descricao: "Para PC de 4–8 GB ou sem GPU: roda um trabalho por vez e não trava a máquina.",
    modelos: { resumo: "llama3.2:1b", embed: "nomic-embed-text", codigo: "qwen2.5-coder:1.5b" },
    maxParalelo: 1,
    batchEmbeddings: 4,
  },
  medio: {
    id: "medio",
    rotulo: "Médio",
    descricao: "Para PC de 16 GB com 6+ núcleos: dois trabalhos por vez e modelos de 3B.",
    modelos: { resumo: "llama3.2:3b", embed: "nomic-embed-text", codigo: "qwen2.5-coder:1.5b" },
    maxParalelo: 2,
    batchEmbeddings: 8,
  },
  forte: {
    id: "forte",
    rotulo: "Forte",
    descricao: "Para PC com GPU e 32 GB+: modelos de 7B e quatro trabalhos por vez.",
    modelos: { resumo: "qwen2.5:7b", embed: "nomic-embed-text", codigo: "qwen2.5-coder:7b" },
    maxParalelo: 4,
    batchEmbeddings: 16,
  },
};

/**
 * Classifica o hardware num perfil, do mais conservador para o mais forte.
 * A ordem importa: só sobe de perfil quando TODOS os critérios batem.
 */
export function classificarHardware(hw: Hardware): PerfilId {
  if (hw.temGpu && hw.ramGb >= 32 && hw.cpus >= 8) return "forte";
  if (hw.ramGb >= 16 && hw.cpus >= 6) return "medio";
  return "leve";
}

/** Devolve o perfil recomendado para o hardware dado. */
export function recomendarConfig(hw: Hardware): Perfil {
  return PERFIS[classificarHardware(hw)];
}

/** Lista os modelos que o perfil precisa, sem repetir. */
export function modelosNecessarios(perfil: Perfil): string[] {
  return [...new Set([perfil.modelos.resumo, perfil.modelos.embed, perfil.modelos.codigo])];
}
