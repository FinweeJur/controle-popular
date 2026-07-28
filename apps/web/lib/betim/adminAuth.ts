/** Checks the `Authorization: Bearer <ADMIN_TOKEN>` header used by every /api/admin/* route. */
export function isAdminAuthorized(request: Request): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;

  const header = request.headers.get("authorization") ?? "";
  const [scheme, value] = header.split(" ");
  return scheme === "Bearer" && value === token;
}
