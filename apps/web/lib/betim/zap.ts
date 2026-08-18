import { zapEstabelecimentos } from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

export const ZAP_CATEGORIAS = [
  "alimentacao",
  "beleza",
  "casa_construcao",
  "educacao",
  "moda",
  "pets",
  "saude",
  "servicos",
  "tecnologia",
  "outros",
] as const;

export type ZapCategoria = (typeof ZAP_CATEGORIAS)[number];

export const ZAP_CATEGORIA_LABELS: Record<ZapCategoria, string> = {
  alimentacao: "Alimentação",
  beleza: "Beleza",
  casa_construcao: "Casa & Construção",
  educacao: "Educação",
  moda: "Moda",
  pets: "Pets",
  saude: "Saúde",
  servicos: "Serviços",
  tecnologia: "Tecnologia",
  outros: "Outros",
};

export interface ZapEstabelecimento {
  id: string;
  nome: string;
  whatsapp: string;
  categoria: string | null;
  descricao: string | null;
  bairro: string | null;
  cliques: number;
}

/** Only digits, matching Brazilian mobile format with country+area code (12-13 digits). */
export function normalizeWhatsapp(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return /^55\d{10,11}$/.test(withCountry) ? withCountry : null;
}

/**
 * Linhas legadas do banco podem ter `whatsapp` nulo ou em formato que não
 * vira link — o card monta `wa.me/{whatsapp}` direto, então número inválido
 * produziria link quebrado (pior que ausência, mesma doutrina da rede de
 * proteção). Aplica `normalizeWhatsapp` e descarta o que não passa, nos DOIS
 * lados que servem a lista: build estático (Postgres) e API ao vivo (D1).
 * `whatsapp` entra como `string | null` porque as colunas do banco são
 * anuláveis; sai sempre preenchido.
 */
export function normalizarLinhasZap(
  rows: { whatsapp: string | null }[]
): ZapEstabelecimento[] {
  const out: ZapEstabelecimento[] = [];
  for (const r of rows) {
    if (r.whatsapp === null) continue;
    const whatsapp = normalizeWhatsapp(r.whatsapp);
    if (!whatsapp) continue;
    out.push({ ...(r as ZapEstabelecimento), whatsapp });
  }
  return out;
}

export async function fetchZapEstabelecimentos(
  idMunicipio: IdMunicipio,
  params: { categoria?: string; q?: string; bairros?: string[] } = {}
): Promise<{ rows: ZapEstabelecimento[]; configured: boolean }> {
  try {
    const data = await zapEstabelecimentos(idMunicipio, params);
    if (!data) return { rows: [], configured: false };
    return { rows: normalizarLinhasZap(data as ZapEstabelecimento[]), configured: true };
  } catch {
    return { rows: [], configured: true };
  }
}

export interface ZapSubmission {
  nome: string;
  whatsapp: string;
  categoria: string;
  descricao?: string;
  bairro?: string;
}

export function validateZapSubmission(
  body: Record<string, unknown>
): { ok: true; value: ZapSubmission } | { ok: false; error: string } {
  const nome = typeof body.nome === "string" ? body.nome.trim() : "";
  const whatsappRaw = typeof body.whatsapp === "string" ? body.whatsapp : "";
  const categoria = typeof body.categoria === "string" ? body.categoria : "";
  const descricao = typeof body.descricao === "string" ? body.descricao.trim() : "";
  const bairro = typeof body.bairro === "string" ? body.bairro.trim() : "";

  if (nome.length < 2 || nome.length > 120) {
    return { ok: false, error: "Nome inválido." };
  }
  const whatsapp = normalizeWhatsapp(whatsappRaw);
  if (!whatsapp) {
    return { ok: false, error: "WhatsApp inválido — use DDD + número." };
  }
  if (!ZAP_CATEGORIAS.includes(categoria as ZapCategoria)) {
    return { ok: false, error: "Categoria inválida." };
  }
  if (descricao.length > 500) {
    return { ok: false, error: "Descrição muito longa (máx. 500 caracteres)." };
  }
  if (bairro.length > 80) {
    return { ok: false, error: "Nome de bairro muito longo." };
  }

  return { ok: true, value: { nome, whatsapp, categoria, descricao, bairro } };
}
