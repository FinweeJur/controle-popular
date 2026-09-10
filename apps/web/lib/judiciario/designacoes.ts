import designacoesRaw from "@/data/judiciario-designacoes.json";

/**
 * apps/web/lib/judiciario/designacoes.ts — atos de pessoal coletados do
 * Diário Oficial (scripts/coletar-atos-pessoal-judiciario.mts).
 *
 * A base é versionada e pode estar vazia (coletor ainda não rodou). A
 * página de contatos, o assistente e o índice de busca consomem só o que
 * existe — unidade sem designação confirmada não quebra nada.
 */

export type TipoAtoDesignacao = "NOMEAÇÃO" | "DESIGNAÇÃO" | "EXONERAÇÃO" | "CESSÃO" | "OUTRO";

export interface DesignacaoTitularArquivo {
  fonte: string;
  data_edicao: string;
  ato: string;
  tipo: TipoAtoDesignacao;
  pessoa: string;
  cargo: string;
  orgao: string;
  unidadeId?: string;
  urlFonte: string;
  criado_em: string;
}

export interface DesignacaoLida extends DesignacaoTitularArquivo {
  /** Permanência até hoje, em dias — consumo na tela; negativo não existe. */
  permanenciaDias: number;
  /** Indica que já não está mais em exercício, quando há ato de exoneração. */
  encerrada: boolean;
}

const LISTA = (designacoesRaw as unknown as DesignacaoTitularArquivo[] | null) ?? [];

export function listarDesignacoes(): DesignacaoLida[] {
  const hoje = Date.now();
  return LISTA.map((d) => {
    const fim = d.tipo === "EXONERAÇÃO" ? new Date(d.data_edicao + "T12:00:00Z").getTime() : hoje;
    const inicio = new Date(d.data_edicao + "T12:00:00Z").getTime();
    return {
      ...d,
      permanenciaDias: Number.isNaN(inicio) ? 0 : Math.max(0, Math.floor((fim - inicio) / 86400000)),
      encerrada: d.tipo === "EXONERAÇÃO",
    };
  });
}

/** Designações cujo cargo/órgão contém um termo (comarca, "vara", promotoria…). */
export function buscarDesignacoes(termo: string): DesignacaoLida[] {
  const t = termo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (!t) return [];
  return listarDesignacoes().filter((d) =>
    [d.pessoa, d.cargo, d.orgao, d.ato]
      .filter(Boolean)
      .join(" ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .includes(t)
  );
}

export function totalDesignacoes(): number {
  return LISTA.length;
}