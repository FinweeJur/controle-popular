/**
 * Utilitários de texto do MCP do Controle Popular.
 *
 * O dado vem de JSON de fonte oficial, mas JSON é dado NÃO confiável: pode ter
 * caractere de controle, campo de tipo errado, string gigante e conteúdo que
 * parece instrução. Aqui a gente só limpa e corta — nunca interpreta, nunca
 * avalia e nunca transforma o texto em comando. Ver docs/05-operacao/MCP-CP.md.
 */

/** Limite padrão de exibição de um campo corrido (objeto, condições, resumo). */
export const LIMITE_TEXTO = 400;

/**
 * Normaliza para comparação: sem acento, minúsculo, espaço simples.
 * "São Gonçalo" e "sao goncalo" casam; a exibição continua com o original.
 */
export function normalizar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Devolve um texto seguro para exibir: sem caractere de controle, espaço
 * colapsado e corte com reticências no limite pedido.
 */
export function textoLimpo(valor: unknown, limite: number = LIMITE_TEXTO): string {
  if (typeof valor !== "string") return "";
  const semControle = valor.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ");
  const compacto = semControle.replace(/\s+/g, " ").trim();
  if (compacto.length <= limite) return compacto;
  return `${compacto.slice(0, Math.max(0, limite - 1)).trimEnd()}…`;
}

/**
 * Só aceita URL http/https absoluta. Devolve `null` para o resto — inclusive
 * `javascript:`, `data:` e caminho relativo, que não são fonte navegável.
 */
export function urlOficial(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const bruto = valor.trim();
  if (!/^https?:\/\//i.test(bruto)) return null;
  try {
    const url = new URL(bruto);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Chave de comparação de URL: sem fragmento, sem barra final, minúscula.
 * Serve para achar a mesma fonte digitada de jeitos diferentes.
 */
export function chaveUrl(valor: string): string {
  const absoluta = urlOficial(valor);
  if (!absoluta) return normalizar(valor);
  try {
    const url = new URL(absoluta);
    url.hash = "";
    const semBarra = url.toString().replace(/\/$/, "");
    return semBarra.toLowerCase();
  } catch {
    return normalizar(valor);
  }
}

/** Aceita só data ISO (AAAA-MM-DD) ou data-hora ISO. Devolve "" quando não dá. */
export function dataIso(valor: unknown): string {
  if (typeof valor !== "string") return "";
  const bruto = valor.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(bruto)) return bruto;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(bruto)) return bruto.slice(0, 10);
  return "";
}

/** Data legível pt-BR a partir de ISO; devolve o próprio valor se não for ISO. */
export function dataBr(valor: string | null | undefined): string {
  if (!valor) return "data não informada";
  const iso = dataIso(valor);
  if (!iso) return valor;
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

/** Quebra um termo de busca em tokens normalizados, descartando vazio. */
export function tokensDeBusca(termo: string): string[] {
  return normalizar(termo)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}
