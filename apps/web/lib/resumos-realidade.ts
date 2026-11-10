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

export type TipoBloco =
  | "h2"
  | "h3"
  | "p"
  | "li"
  | "tabela"
  | "numeros"
  | "citacao";

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
  /**
   * Resumo que só declara limite ("não dá para concluir") não vai ao ar.
   * Fica no disco como pendência medida, não como página pública.
   */
  inconclusivo?: boolean;
  /** Por que o resumo ficou de fora; alimenta a pendência, não a página. */
  motivo?: string;
  markdown: string;
  /** Ementas que exemplificam as teses citadas, mostradas em sanfona. */
  exemplos?: ExemploTese[];
}

const TITULO = /^(#{1,3})\s+(.*)$/;
const ITEM = /^[-*]\s+(.*)$/;
const SEPARADOR = /^\|?[\s:|-]+\|?$/;

/**
 * Marcas que o dono pediu para não exibir no resumo (09/11/2026).
 * O dado continua no JSON, para auditoria; a tela fica limpa.
 */
const MARCAS_OCULTAS = [
  /\s*\[\s*inferido\s*\]/gi,
  /\s*\[\s*n[ãa]o d[áa] para concluir\s*\]/gi,
  /\s*\[\s*medido[^\]]*\]/gi,
];

const INCONCLUSIVO = /\[\s*n[ãa]o d[áa] para concluir\s*\]/i;
const TEM_MEDIDO = /\[\s*medido/i;

export function limparMarcas(texto: string): string {
  const limpo = MARCAS_OCULTAS.reduce(
    (acc, marca) => acc.replace(marca, ""),
    texto,
  );
  return limpo.replace(/\s{2,}/g, " ").trim();
}

function celulas(linha: string): string[] {
  return linha
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((celula) => limparMarcas(celula));
}

/** Converte o markdown mínimo em blocos. Linha vazia separa blocos. */
export function parseResumo(markdown: string): BlocoResumo[] {
  const blocos: BlocoResumo[] = [];
  let tabela: string[][] = [];
  let numeros: string[][] | null = null;
  let paragrafo: string[] = [];
  const fecharTabela = () => {
    if (tabela.length) {
      blocos.push({ tipo: "tabela", texto: "", linhas: tabela });
      tabela = [];
    }
  };
  const fecharParagrafo = () => {
    if (paragrafo.length) {
      const cru = paragrafo.join(" ");
      const texto = limparMarcas(cru);
      if (texto && !(INCONCLUSIVO.test(cru) && !TEM_MEDIDO.test(cru))) {
        blocos.push({ tipo: "p", texto });
      }
      paragrafo = [];
    }
  };
  for (const linha of (markdown ?? "").split(/\r?\n/)) {
    // Parágrafo que só declara limite não vira afirmação na tela. Se houver
    // um fato medido na mesma linha, ele fica e só a marca sai.
    if (INCONCLUSIVO.test(linha) && !TEM_MEDIDO.test(linha)) continue;
    const texto = limparMarcas(linha);
    if (texto === ":::numeros") {
      fecharTabela();
      fecharParagrafo();
      numeros = [];
      continue;
    }
    if (numeros !== null) {
      if (texto === ":::") {
        if (numeros.length) {
          blocos.push({ tipo: "numeros", texto: "", linhas: numeros });
        }
        numeros = null;
      } else if (texto) {
        numeros.push(celulas(texto));
      }
      continue;
    }
    if (texto.startsWith("> ")) {
      fecharTabela();
      fecharParagrafo();
      blocos.push({ tipo: "citacao", texto: texto.slice(2) });
      continue;
    }
    if (texto === "---") {
      fecharTabela();
      fecharParagrafo();
      continue;
    }
    if (texto.startsWith("|")) {
      fecharParagrafo();
      if (!SEPARADOR.test(texto)) tabela.push(celulas(texto));
      continue;
    }
    fecharTabela();
    if (!texto) {
      fecharParagrafo();
      continue;
    }
    const titulo = TITULO.exec(texto);
    if (titulo) {
      fecharParagrafo();
      const nivel = titulo[1].length;
      blocos.push({ tipo: nivel === 1 ? "h2" : "h3", texto: titulo[2] });
      continue;
    }
    const item = ITEM.exec(texto);
    if (item) {
      fecharParagrafo();
      blocos.push({ tipo: "li", texto: item[1] });
      continue;
    }
    paragrafo.push(texto);
  }
  fecharTabela();
  fecharParagrafo();
  if (numeros?.length) {
    blocos.push({ tipo: "numeros", texto: "", linhas: numeros });
  }
  return blocos;
}

/** Resumo válido só é o verificado, conclusivo e não vazio. */
export function resumoPublicavel(resumo: ResumoRealidade | null | undefined): boolean {
  return Boolean(
    resumo?.verificado &&
      !resumo?.inconclusivo &&
      (resumo?.markdown ?? "").trim().length > 0,
  );
}
