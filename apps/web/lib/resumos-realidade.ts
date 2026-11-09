/**
 * Lê o resumo de realidade de uma rota publicado em `data/resumos-realidade`.
 *
 * POR QUE EXISTE
 *
 * O portal não tem renderizador de markdown. O resumo é escrito pelo modelo em
 * markdown simples (título, parágrafo, lista, negrito e link), então o
 * componente precisa de um parser pequeno e previsível — não de uma dependência
 * nova só para mostrar seis parágrafos.
 *
 * REGRA: o texto publicado já passou por verificação (link por afirmação e
 * número dentro do dossiê). Aqui só se desenha.
 */

export type TipoBloco = "h2" | "h3" | "p" | "li" | "tabela";

export interface BlocoResumo {
  tipo: TipoBloco;
  texto: string;
  /** Linhas da tabela, quando `tipo === "tabela"` (primeira é o cabeçalho). */
  linhas?: string[][];
}

export interface ExemploCaso {
  processo: string;
  lado: string;
  ementa: string;
}

export interface ExemploTese {
  tema: string;
  tese: string;
  casos: ExemploCaso[];
}

export interface ResumoRealidade {
  rota: string;
  geradoEm: string;
  verificado: boolean;
  markdown: string;
  /** Ementas que exemplificam as teses citadas, mostradas em sanfona. */
  exemplos?: ExemploTese[];
}

const TITULO = /^(#{1,3})\s+(.*)$/;
const ITEM = /^[-*]\s+(.*)$/;
const SEPARADOR = /^\|?[\s:|-]+\|?$/;

function celulas(linha: string): string[] {
  return linha.replace(/^\||\|$/g, "").split("|").map((celula) => celula.trim());
}

/** Converte o markdown mínimo em blocos. Linha vazia separa blocos. */
export function parseResumo(markdown: string): BlocoResumo[] {
  const blocos: BlocoResumo[] = [];
  let tabela: string[][] = [];
  const fecharTabela = () => {
    if (tabela.length) {
      blocos.push({ tipo: "tabela", texto: "", linhas: tabela });
      tabela = [];
    }
  };
  for (const linha of (markdown ?? "").split(/\r?\n/)) {
    const texto = linha.trim();
    if (texto.startsWith("|")) {
      if (!SEPARADOR.test(texto)) tabela.push(celulas(texto));
      continue;
    }
    fecharTabela();
    if (!texto) continue;
    const titulo = TITULO.exec(texto);
    if (titulo) {
      const nivel = titulo[1].length;
      blocos.push({ tipo: nivel === 1 ? "h2" : "h3", texto: titulo[2] });
      continue;
    }
    const item = ITEM.exec(texto);
    if (item) {
      blocos.push({ tipo: "li", texto: item[1] });
      continue;
    }
    blocos.push({ tipo: "p", texto });
  }
  fecharTabela();
  return blocos;
}

/** Resumo válido só é o verificado e não vazio. */
export function resumoPublicavel(resumo: ResumoRealidade | null | undefined): boolean {
  return Boolean(resumo?.verificado && (resumo?.markdown ?? "").trim().length > 0);
}
