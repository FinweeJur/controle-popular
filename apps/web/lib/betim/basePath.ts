/**
 * Must match `basePath` in next.config.ts. next/link and the router prefix
 * internal navigation with it automatically, but raw `fetch()` calls and
 * `<a href>`/`<img src>` built from string literals do not — confirmed live
 * 2026-07-21 as a real 404 (`POST /api/zap` instead of `POST /betim/api/zap`)
 * when testing the Zap Betim form end-to-end. Use `withBasePath()` for any
 * client-side path that isn't going through next/link.
 */
export const BASE_PATH = "/betim";

export function withBasePath(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}
