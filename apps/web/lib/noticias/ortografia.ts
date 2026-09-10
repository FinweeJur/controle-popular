/**
 * Verificador determinístico de ortografia e estilo dos posts do blog.
 *
 * Regras do dono (10/09/2026), transformadas em porta de entrada:
 *
 * 1. VIOLAÇÃO (falha o teste): palavra com acento obrigatório escrita sem
 *    acento, de uma lista fechada e conservadora — só substantivos/adjetivos
 *    em que a forma sem acento não existe em PT-BR. Nomes próprios e siglas
 *    ficam de fora de propósito (falso positivo é pior que não achar).
 * 2. AVISO (não falha, vira relatório): frase com mais de 13 palavras —
 *    regra de estilo; quebra sugerida, não bloqueio.
 * 3. AVISO: primeira frase do resumo com mais de 13 palavras — o lead deve
 *    resumir a informação principal em uma frase curta.
 *
 * Os campos checados são titulo, subtitulo, resumo e paragrafos. Citações
 * ABNT/BibTeX ficam de fora (formato técnico, não prosa de leitura).
 */

export interface ResultadoOrtografia {
  violacoes: Array<{ slug: string; campo: string; trecho: string; palavra: string }>;
  avisos: Array<{ slug: string; tipo: "frase-longa" | "lead-longo"; trecho: string }>;
}

/** Palavras que SEM acento não existem em PT-BR. Minúsculas, sem diacríticos.
 *  Conservadora de propósito: "conselho", "categoria", "pesquisa" e
 *  "socioambiental" se escrevem SEM acento — ficam fora. */
const PALAVRAS_OBRIGATORIAS = [
  "informacao",
  "informacoes",
  "publicacao",
  "publicacoes",
  "organizacao",
  "organizacoes",
  "legislacao",
  "legislacoes",
  "constituicao",
  "educacao",
  "situacao",
  "situacoes",
  "composicao",
  "comissao",
  "comissoes",
  "eleicao",
  "eleicoes",
  "deliberacao",
  "deliberacoes",
  "nucleo",
  "nucleos",
  "saude",
  "ultimas",
  "ultimos",
  "relatorio",
  "relatorios",
  "transparencia",
  "experiencia",
  "assistencia",
  "area",
  "areas",
  "agua",
  "aguas",
  "historico",
  "historica",
  "violencia",
  "serio",
  "varias",
  "pagina",
  "paginas",
  "credito",
  "creditos",
  "analise",
  "analises",
  "periodo",
  "periodos",
  "serie",
  "nao",
];

const LIMITE_PALAVRAS = 13;

/** Conta palavras de uma frase (espaços + 1, ignorando espaços duplos). */
export function contarPalavras(frase: string): number {
  const limpa = frase.trim();
  if (!limpa) return 0;
  return limpa.split(/\s+/).length;
}

/** Divide um parágrafo em frases por pontuação forte (.;!? seguido de espaço/fim). */
export function dividirFrases(texto: string): string[] {
  return texto
    .split(/(?<=[.!?])\s+/)
    .map((f) => f.trim())
    .filter((f) => f.length > 0);
}

/** Tira URLs e links markdown antes de checar — "/informacao" em rota não é
 *  palavra sem acento, é endereço. Mantém o rótulo visível do link. */
export function limparLinks(texto: string): string {
  return texto
    .replace(/\[[^\]]*\/[^\]]*\]/g, "")
    .replace(/\]\([^)]*\)/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\(https?:\/\/[^)]*\)/g, "")
    .replace(/\(\/[^)]*\)/g, "");
}

const REGEX_VIOLACAO = new RegExp(`\\b(${PALAVRAS_OBRIGATORIAS.join("|")})\\b`, "gi");

export function checarPost(slug: string, campos: Record<string, string>): ResultadoOrtografia {
  const violacoes: ResultadoOrtografia["violacoes"] = [];
  const avisos: ResultadoOrtografia["avisos"] = [];

  for (const [campo, textoRaw] of Object.entries(campos)) {
    if (!textoRaw) continue;
    const texto = limparLinks(textoRaw);
    // Frases de cada parágrafo → regra das 13 palavras.
    for (const frase of dividirFrases(texto)) {
      if (frase.length > 400) continue; // citação/trecho longo não é prosa nossa
      if (contarPalavras(frase) > LIMITE_PALAVRAS) {
        avisos.push({ slug, tipo: "frase-longa", trecho: frase.slice(0, 120) });
      }
      // Violação de acento dentro da frase.
      const m = frase.match(REGEX_VIOLACAO);
      if (m) {
        for (const palavra of new Set(m)) {
          violacoes.push({ slug, campo, trecho: frase.slice(0, 120), palavra: palavra.toLowerCase() });
        }
      }
    }
  }

  // Lead: primeira frase do resumo.
  const resumo = limparLinks(campos.resumo ?? "");
  const primeiraFrase = dividirFrases(resumo)[0];
  if (primeiraFrase && contarPalavras(primeiraFrase) > LIMITE_PALAVRAS) {
    avisos.push({ slug, tipo: "lead-longo", trecho: primeiraFrase.slice(0, 120) });
  }

  return { violacoes, avisos };
}

export interface PostParaChecar {
  slug: string;
  titulo: string;
  subtitulo: string;
  resumo: string;
  paragrafos: string[];
}

export function checarTodos(posts: PostParaChecar[]): {
  violacoes: ResultadoOrtografia["violacoes"];
  avisos: ResultadoOrtografia["avisos"];
} {
  const violacoes: ResultadoOrtografia["violacoes"] = [];
  const avisos: ResultadoOrtografia["avisos"] = [];
  for (const p of posts) {
    const r = checarPost(p.slug, {
      titulo: p.titulo,
      subtitulo: p.subtitulo,
      resumo: p.resumo,
      paragrafos: (p.paragrafos ?? []).join("\n"),
    });
    violacoes.push(...r.violacoes);
    avisos.push(...r.avisos);
  }
  return { violacoes, avisos };
}
