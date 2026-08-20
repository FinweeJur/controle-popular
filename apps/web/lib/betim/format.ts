/** Formats a number as Brazilian Real currency (e.g. "R$ 1.234"). */
export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formats a number as Brazilian Real currency in short form when it's big
 * enough to be hard to read at a glance (e.g. "R$ 922.368" stays as is, but
 * "R$ 12.345" becomes "R$ 12,3 mil" and "R$ 37.600.000.000" becomes "R$ 37,6
 * bilhões"). Rule of thumb: a human reads "92,6 milhões" faster than
 * "R$ 92.600.000" (pedido do usuário 2026-08-20). The full value lives in
 * the `title` of the `<Moeda />` component that renders this — the short
 * form is never the only way to see the number.
 */
export function formatCurrencyCompactaBR(value: number): string {
  const abs = Math.abs(value);
  if (abs < 1000) return formatCurrencyBRL(value);
  const sinal = value < 0 ? "-" : "";
  const parte = (n: number, singular: string, plural: string) =>
    `${sinal}R$ ${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 }).replace(",0", "")} ${n < 2 ? singular : plural}`;
  // A escala é decidida pelo valor ARREDONDADO: 999.999 arredonda para
  // "1.000 mil" — que não existe — e promove para "R$ 1 milhão".
  const mil = abs / 1000;
  if (Math.round(mil * 10) / 10 < 1000) {
    return `${sinal}R$ ${mil.toLocaleString("pt-BR", { maximumFractionDigits: 1 }).replace(",0", "")} mil`;
  }
  const milhao = abs / 1_000_000;
  if (Math.round(milhao * 10) / 10 < 1000) return parte(milhao, "milhão", "milhões");
  const bilhao = abs / 1_000_000_000;
  if (Math.round(bilhao * 10) / 10 < 1000) return parte(bilhao, "bilhão", "bilhões");
  return parte(abs / 1_000_000_000_000, "trilhão", "trilhões");
}

/** Formats a number using Brazilian thousands/decimal separators. */
export function formatNumberBR(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

/** Formats a bare 14-digit CNPJ as "00.000.000/0000-00". */
export function formatCNPJ(cnpj: string): string {
  const d = (cnpj ?? "").replace(/\D/g, "");
  if (d.length !== 14) return cnpj ?? "—";
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/**
 * Formats an 8-digit CNPJ ROOT (`ambiental_licenciamento.cnpj_raiz`) as
 * "00.000.000/****-**" — the trailing filial+DV are masked, never shown,
 * because the source itself never published them for most of these rows
 * (see `etl/betim/etl/apis/ambiental_licenciamento.py`). Formatting the
 * root like a real CNPJ prefix without inventing the missing digits.
 */
export function formatCNPJRaiz(raiz: string): string {
  const d = (raiz ?? "").replace(/\D/g, "");
  if (d.length !== 8) return raiz ?? "—";
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/****-**`;
}

/**
 * Formats a Postgres `date` string ("YYYY-MM-DD", no time component) as
 * dd/mm/yyyy; returns "—" for null/invalid input.
 *
 * Deliberately parses the Y-M-D digits directly instead of `new Date(value)`
 * + Intl.DateTimeFormat: `new Date("2025-01-01")` parses as UTC midnight,
 * and formatting it in a UTC-3 timezone (Brazil) rolls it back to
 * 31/12/2024 -- an off-by-one-day bug confirmed live 2026-07-21 on both
 * contratos' vigência dates and a vereador's mandato_inicio.
 */
export function formatDateBR(value: string | null | undefined): string {
  if (!value) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return "—";
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y}`;
}

/**
 * Turns a raw mm number into a plain-language label — the site targets
 * readers who aren't used to reading rainfall in millimeters, so a bare
 * "12.4mm" doesn't mean much on its own (pedido do usuário 2026-07-21:
 * "a chuva acumulada deve mostrar se é pouca chuva ou bastante").
 * Thresholds are a rough rule of thumb for a 7-day accumulated total in
 * Minas Gerais's climate, not an official meteorological classification.
 */
export function classificarChuva7d(mm: number): string {
  if (mm <= 0) return "sem chuva";
  if (mm < 10) return "pouca chuva";
  if (mm < 40) return "chuva moderada";
  return "bastante chuva";
}
