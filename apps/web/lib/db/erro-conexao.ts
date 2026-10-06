/**
 * @file erro-conexao.ts
 * @description Distingue falha de CONEXÃO com o Postgres do resto — e diz em
 * que nível ela deve ser registrada.
 *
 * Por que existe (medido 06/10/2026): nesta máquina de desenvolvimento não há
 * Postgres local, então TODA página que lê o banco falhava com
 * `ECONNREFUSED 127.0.0.1:5432` e o código — que já cai no plano B (lista do
 * build, reserva, `padrao`) — registrava o caso com `console.error`. O Next
 * trata `console.error` de servidor como "Server Console Error" e abria o
 * overlay vermelho a cada carga, com três itens na home. Ruído de ambiente
 * disfarçado de defeito: esconde erro de verdade e assusta quem revisa.
 *
 * A régua: falha de conexão, FORA de produção, é esperada → `info`. Qualquer
 * outra falha, ou qualquer falha em produção, continua `error` — um Postgres
 * fora do ar no Guara PRECISA aparecer no log.
 */

/** Códigos de erro de rede/socket do Node (host fora do ar, DNS, timeout). */
const CODIGOS_SEM_BANCO = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ECONNRESET",
  "EPIPE",
]);

/**
 * `true` quando o erro tem cara de banco inalcançável — e não de consulta
 * errada, coluna inexistente ou violação de constraint.
 *
 * Olha o `code` (o caminho limpo do `pg`/socket) e, como reserva, o texto do
 * erro MAIS a causa encadeada (`cause`), porque o driver às vezes embrulha o
 * erro original num erro de "Failed query".
 */
export function ehFalhaDeConexao(e: unknown): boolean {
  const codigo = (e as { code?: unknown } | null)?.code;
  if (typeof codigo === "string" && CODIGOS_SEM_BANCO.has(codigo)) return true;
  const causa = (e as { cause?: unknown } | null)?.cause;
  const texto = [
    e instanceof Error ? e.message : String(e),
    causa instanceof Error ? causa.message : String(causa ?? ""),
    (causa as { code?: unknown } | null)?.code ?? "",
  ].join(" ");
  return /ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|EHOSTUNREACH|ENETUNREACH|ECONNRESET|connection refused|connect timeout/i.test(
    texto,
  );
}

/** `false` em `next dev`; `true` no build/runtime de produção. */
export function emProducao(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Registra a falha de banco no nível certo e no formato único dos logs do
 * portal (`[banco:<rotulo>] ...`).
 *
 * @param rotulo Nome curto do ponto de falha (ex.: "cidades", "guara").
 * @param e Erro capturado.
 * @param mensagemErro Texto para o caso de erro REAL (o esperado em dev usa
 *        uma frase própria, mais curta, para não poluir o overlay).
 */
export function registrarFalhaDeBanco(
  rotulo: string,
  e: unknown,
  mensagemErro = "falhou:",
): void {
  if (!emProducao() && ehFalhaDeConexao(e)) {
    // Esperado em dev sem Postgres: `info` não vira item de erro no overlay.
    console.info(`[banco:${rotulo}] sem Postgres local; seguindo o plano B.`);
    return;
  }
  console.error(`[banco:${rotulo}] ${mensagemErro}`, e instanceof Error ? e.message : e);
}
