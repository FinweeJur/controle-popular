import { timingSafeEqual } from "node:crypto";

/**
 * Porta de autorização dos `/api/admin/*`.
 *
 * Compara o `Authorization: Bearer <ADMIN_TOKEN>` em TEMPO CONSTANTE: o `===`
 * sai no primeiro byte diferente e vaza o token por timing. Falha FECHANDO —
 * sem `ADMIN_TOKEN` configurado, ninguém entra (nunca "abre por falta de
 * configuração").
 */
export function isAdminAuthorized(request: Request): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;

  const header = request.headers.get("authorization") ?? "";
  const [scheme, value] = header.split(" ");
  if (scheme !== "Bearer" || !value) return false;
  const a = Buffer.from(value);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
