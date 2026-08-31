/**
 * Motor genérico de extração de tags por regras de palavra-chave.
 *
 * Usado quando a fonte não publica uma taxonomia temática, mas o título ou
 * campos de texto do item permitem inferir o assunto sem que o portal escreva
 * um resumo. Cada domínio define seu próprio vocabulário (`RegraTag[]`); este
 * módulo só cuida da comparação.
 *
 * A normalização remove acentos, hífens e pontuação, e compara termos como
 * palavras inteiras (delimitadas por espaço). Isso evita que "água" case em
 * "aguapés" e que "solar" case em "assolar".
 */

export interface RegraTag {
  /** Rótulo legível que aparece na tela. */
  tag: string;
  /** Lista de termos que disparam a tag. Cada termo é testado em texto
   *  normalizado; basta um casar para a tag ser atribuída. */
  termos: string[];
}

function normalizarParaTag(s: string): string {
  return (
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      // Hífen e barra viram espaço para que "hidro-elétrica" e "água/subterrânea"
      // quebrem em tokens separados.
      .replace(/[-/]/g, " ")
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
  );
}

function textoParaEspacos(texto: string): string {
  return ` ${normalizarParaTag(texto).replace(/\s+/g, " ")} `;
}

function contemTermo(termo: string, texto: string): boolean {
  const t = textoParaEspacos(termo);
  return texto.includes(` ${t.trim()} `);
}

/**
 * Extrai tags de um texto usando um conjunto de regras.
 *
 * A ordem do array de entrada define a ordem de prioridade: se duas regras
 * casam, a tag que vem primeiro no array aparece primeiro no resultado. Isso
 * permite que regras mais específicas venham antes de regras genéricas
 * (ex.: "água subterrânea" antes de "água").
 */
export function extrairTags(texto: string, regras: RegraTag[]): string[] {
  if (!texto) return [];
  const normalizado = textoParaEspacos(texto);
  const tags: string[] = [];
  const visto = new Set<string>();
  for (const { tag, termos } of regras) {
    if (visto.has(tag)) continue;
    for (const termo of termos) {
      if (contemTermo(termo, normalizado)) {
        tags.push(tag);
        visto.add(tag);
        break;
      }
    }
  }
  return tags;
}

/**
 * Extrai tags combinando vários campos de texto de um item. Útil quando o
 * assunto pode aparecer no nome, objetivo, atividade ou finalidade.
 */
export function extrairTagsDeCampos(campos: (string | null | undefined)[], regras: RegraTag[]): string[] {
  const texto = campos.filter(Boolean).join(". ");
  return extrairTags(texto, regras);
}
