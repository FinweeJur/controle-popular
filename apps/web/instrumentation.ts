/**
 * Gancho de instrumentacao do Next.js (App Router) — ponte para o agente APM
 * New Relic, a oferta de observabilidade do GitHub Student Developer Pack.
 *
 * O QUE E ISTO
 * O Next.js chama `register()` UMA vez, quando o servidor comeca a subir e
 * antes de atender a primeira requisicao (ver `next/dist/docs/.../instrumentation`).
 * E o unico lugar em que da para carregar um agente de monitoramento cedo o
 * bastante para ele instrumentar o modulo `http` antes do portal responder.
 *
 * POR QUE NEW RELIC (e nao outro observador)
 * O portal nao tinha rastreio de erro nenhum em producao: erro de servidor so
 * aparecia se um vigia de pagina notasse a queda. O New Relic preenche essa
 * lacuna com erros + tempo de resposta por rota, sem custo enquanto o dono
 * mantiver a verificacao de estudante (oferta do Student Pack). Ver
 * `docs/planos/PLANO-STUDENT-PACK-2026-10.md`.
 *
 * TRES GUARDAS ANTES DE CARREGAR O AGENTE
 * 1. So no runtime Node (`NEXT_RUNTIME === "nodejs"`). O agente e CJS e nao
 *    roda no runtime Edge.
 * 2. Nunca durante o build (`NEXT_PHASE === "phase-production-build"`). O
 *    Next sobe instancias do servidor para gerar as paginas estaticas (SSG),
 *    e o agente naquele momento so somaria memoria e risco ao build pago do
 *    Guara — sem nenhum dado util.
 * 3. Sem `NEW_RELIC_LICENSE_KEY` nao carrega nada. Isso e o DESLIGADOR: a
 *    variavel vive no painel do Guara (runtime, SEM a flag `-b`); tirar a
 *    chave desliga o APM na hora, sem redeploy. Tambem evita que o dev local
 *    (que nunca tem chave) suba o agente sem querer.
 *
 * CONFIDENCIALIDADE (AGENTS.md §5.8)
 * O agente envia nome de rota, tempo e erro para um servidor FORA do Brasil.
 * A configuracao em `newrelic.cjs` corta o que carrega dado pessoal: sem
 * headers, sem parametros de requisicao (a busca do portal pode conter nome
 * ou CPF digitado pelo cidadao) e sem repasse de log do console. Nenhuma
 * chave secreta mora neste arquivo.
 *
 * RESILIENCIA
 * Se o pacote `newrelic` nao estiver no standalone (falha de empacotamento),
 * o `import` cai no `catch`: o portal CONTINUA no ar, so sem APM. Monitorar
 * nunca pode ser o motivo de derrubar a transparencia.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }
  if (!process.env.NEW_RELIC_LICENSE_KEY) {
    return;
  }
  try {
    await import("newrelic");
  } catch (erro) {
    console.warn(
      "[newrelic] agente nao carregou (portal segue no ar sem APM):",
      erro instanceof Error ? erro.message : erro,
    );
  }
}
