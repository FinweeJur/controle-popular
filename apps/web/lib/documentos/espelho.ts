/**
 * ═══ RESOLVEDOR DE LINKS DE DOCUMENTOS (ESPELHO R2) ═══
 *
 * Resolve links para o espelho do Cloudflare R2 quando o documento
 * já foi arquivado com sucesso, com fallback transparente para a URL original.
 */
import espelhoMap from "@/data/documentos-espelho-r2.json";

export function obterUrlDocumento(urlOriginal: string | null | undefined): string {
  if (!urlOriginal) return "";
  const item = (espelhoMap as Record<string, any>)[urlOriginal];
  if (item && item.urlR2 && item.status === "enviado") {
    return item.urlR2;
  }
  return urlOriginal;
}
