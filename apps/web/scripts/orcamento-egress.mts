/**
 * Trava de ORÇAMENTO do rebuild: recusa o build quando não há egress no mês
 * para pagá-lo, e mede quanto ele custou de verdade.
 *
 *   npx tsx scripts/orcamento-egress.mts --antes
 *   npx tsx scripts/orcamento-egress.mts --depois <bytes_antes>
 *
 * POR QUE ISTO EXISTE, TENDO JÁ O PRÉ-VOO. O pré-voo (`preflight-deploy.mts`)
 * responde "o banco atende?". Esta trava responde outra pergunta, que foi a
 * que derrubou o projeto em 2026-08-07: **"ainda cabe?"**.
 *
 * No dia do incidente foram 9 rebuilds em 7 dias num orçamento de ~1 por
 * semana. Um `workflow_dispatch` disparado com o egress já em 4,9 GB de 5 GB
 * passa no pré-voo sem hesitar — o banco responde `select 1` normalmente até
 * o instante em que a cota estoura e tudo vira HTTP 402. Credencial válida e
 * orçamento disponível são coisas diferentes, e o pipeline só checava a
 * primeira.
 *
 * ═══ E O ORÇAMENTO NÃO É SÓ DOS BUILDS ═══
 *
 * O Worker também lê o banco a cada request de rota dinâmica. Gastar os 5 GB
 * inteiros em build deixa o site no ar sem poder responder — por isso a trava
 * reserva uma margem para o tráfego, em vez de mirar nos 100%.
 *
 * ═══ O NÚMERO "~0,4 GB POR BUILD" ERA PALPITE ═══
 *
 * Ele vem de dividir o consumo de uma semana pelo número de builds daquela
 * semana, com 6 deles interrompidos no meio. O `--depois` existe para trocar
 * isso por medição: lê o consumo antes e depois do build e reporta a
 * diferença. Depois de duas ou três execuções limpas, `CUSTO_ESTIMADO_BYTES`
 * deixa de ser chute — e aí a cadência pode ser discutida com número.
 *
 * ═══ COMPORTAMENTO SEM CREDENCIAL ═══
 *
 * Sem `NEON_API_KEY`/`NEON_PROJECT_ID` esta trava **avisa e deixa passar**, em
 * vez de bloquear. Ela é uma proteção contra gasto, não um portão de
 * segurança: falhar o deploy porque um secret de telemetria não está
 * configurado seria trocar um problema raro por um problema garantido. O
 * aviso aparece no resumo do job.
 */
import { appendFileSync } from "node:fs";

const TETO_BYTES = 5 * 10 ** 9; // plano free: 5 GB por projeto, mês-calendário
/**
 * Fração do teto que os BUILDS podem ocupar. O resto fica para o tráfego do
 * Worker. 85% de 5 GB = 4,25 GB para build, 750 MB para o site responder.
 */
const FRACAO_PARA_BUILD = 0.85;
/**
 * Custo de um build. Enquanto `--depois` não tiver medido algumas execuções,
 * fica o limite SUPERIOR da faixa estimada no incidente (0,3–0,45 GB) — errar
 * para cima aqui bloqueia um build a mais; errar para baixo repete 2026-08-07.
 */
const CUSTO_ESTIMADO_BYTES = 0.45 * 10 ** 9;

const API = "https://console.neon.tech/api/v2/projects";

/**
 * Vírgula decimal, não ponto. Num texto em português, `4.900 GB` lê-se como
 * quatro mil e novecentos gigabytes — o oposto do alarme que a mensagem
 * precisa dar. O resumo do job é lido por gente com pressa.
 */
function gb(bytes: number): string {
  return (bytes / 10 ** 9).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " GB";
}

function resumo(linhas: string): void {
  const arquivo = process.env.GITHUB_STEP_SUMMARY;
  if (arquivo) appendFileSync(arquivo, linhas + "\n");
  console.log(linhas);
}

function saida(chave: string, valor: string): void {
  const arquivo = process.env.GITHUB_OUTPUT;
  if (arquivo) appendFileSync(arquivo, `${chave}=${valor}\n`);
}

/**
 * `data_transfer_bytes` do período de cobrança corrente. Mesmo campo e mesmo
 * endpoint que `.github/scripts/canario_limites.py` já usa em produção — os
 * nomes foram conferidos contra a resposta real, e um campo ausente vira
 * `null` (indisponível) em vez de virar zero, que seria "tudo liberado".
 */
async function consumoAtual(): Promise<number | null> {
  const chave = process.env.NEON_API_KEY;
  const projeto = process.env.NEON_PROJECT_ID;
  if (!chave || !projeto) return null;
  try {
    const r = await fetch(`${API}/${projeto}`, {
      headers: { Authorization: `Bearer ${chave}`, Accept: "application/json" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!r.ok) {
      resumo(`> Consulta ao Neon devolveu HTTP ${r.status} — trava de orçamento inativa nesta execução.`);
      return null;
    }
    const corpo = (await r.json()) as { project?: Record<string, unknown> };
    const valor = corpo.project?.data_transfer_bytes;
    if (typeof valor !== "number") {
      resumo("> Campo `data_transfer_bytes` ausente na resposta do Neon — trava de orçamento inativa.");
      return null;
    }
    return valor;
  } catch (e) {
    resumo(`> Não deu para consultar o consumo do Neon (${(e as Error).name}) — trava de orçamento inativa.`);
    return null;
  }
}

async function antes(): Promise<void> {
  const usado = await consumoAtual();
  if (usado === null) {
    resumo(
      "### Orçamento de egress: NÃO CONFERIDO\n\n" +
        "Sem `NEON_API_KEY`/`NEON_PROJECT_ID` no repositório, ou API fora do ar. " +
        "O build segue, mas **sem rede de proteção** — foi exatamente assim que " +
        "9 rebuilds em 7 dias derrubaram o projeto em 2026-08-07."
    );
    saida("bytes_antes", "");
    return;
  }

  const orcamentoBuild = TETO_BYTES * FRACAO_PARA_BUILD;
  const disponivel = orcamentoBuild - usado;
  const pct = ((usado / TETO_BYTES) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  saida("bytes_antes", String(usado));

  if (disponivel < CUSTO_ESTIMADO_BYTES) {
    resumo(
      `### Build recusado — não cabe no orçamento do mês\n\n` +
        `| | |\n|---|---|\n` +
        `| Consumido no período | **${gb(usado)}** de ${gb(TETO_BYTES)} (${pct}%) |\n` +
        `| Orçamento para builds | ${gb(orcamentoBuild)} (${FRACAO_PARA_BUILD * 100}% do teto; o resto é do tráfego) |\n` +
        `| Sobra para build | ${gb(Math.max(0, disponivel))} |\n` +
        `| Custo de um build | ~${gb(CUSTO_ESTIMADO_BYTES)} |\n\n` +
        `Um build agora terminaria o mês com o site em HTTP 402 — cota estourada, ` +
        `compute suspenso, **todas** as rotas dinâmicas fora do ar até a virada do ` +
        `mês-calendário. Foi o que aconteceu em 2026-08-07.\n\n` +
        `O que fazer: esperar a virada do mês, ou subir de plano. Forçar por aqui ` +
        `não é opção de propósito — a trava existe justamente para o momento em que ` +
        `alguém tem pressa.`
    );
    process.exit(1);
  }

  const buildsRestantes = Math.floor(disponivel / CUSTO_ESTIMADO_BYTES);
  resumo(
    `### Orçamento de egress: cabe\n\n` +
      `Consumido **${gb(usado)}** de ${gb(TETO_BYTES)} (${pct}%). ` +
      `Sobra ${gb(disponivel)} do orçamento de build — cerca de **${buildsRestantes} build(s)** ` +
      `a ~${gb(CUSTO_ESTIMADO_BYTES)} cada.`
  );
}

async function depois(bytesAntes: string): Promise<void> {
  const inicio = Number(bytesAntes);
  if (!bytesAntes || Number.isNaN(inicio)) {
    resumo("> Sem leitura anterior — custo real deste build não medido.");
    return;
  }
  const fim = await consumoAtual();
  if (fim === null) return;

  const custo = fim - inicio;
  const desvio = custo / CUSTO_ESTIMADO_BYTES;
  let veredito: string;
  if (custo < 0) {
    // Vira de período de cobrança no meio do job, ou atraso de contabilização
    // do lado do Neon. Não é medição válida e não deve virar "custo negativo".
    veredito = "leitura inválida (o contador andou para trás — provável virada de período)";
  } else if (desvio > 1.3) {
    veredito = `**${desvio.toFixed(1)}× a estimativa** — ajustar \`CUSTO_ESTIMADO_BYTES\` para cima neste script`;
  } else if (desvio < 0.6) {
    veredito = `${desvio.toFixed(1)}× a estimativa — dá para baixar \`CUSTO_ESTIMADO_BYTES\` e liberar cadência`;
  } else {
    veredito = "dentro da estimativa";
  }

  resumo(
    `### Custo real deste build\n\n` +
      `| | |\n|---|---|\n` +
      `| Antes | ${gb(inicio)} |\n| Depois | ${gb(fim)} |\n` +
      `| **Este build custou** | **${gb(custo)}** |\n` +
      `| Estimativa em uso | ${gb(CUSTO_ESTIMADO_BYTES)} |\n\n` +
      `${veredito}.\n\n` +
      `A medição inclui o que o site serviu durante o job, então é limite ` +
      `superior do custo do build — não um número puro.`
  );
}

const modo = process.argv[2];
if (modo === "--antes") {
  await antes();
} else if (modo === "--depois") {
  await depois(process.argv[3] ?? "");
} else {
  console.error("uso: orcamento-egress.mts --antes | --depois <bytes_antes>");
  process.exit(2);
}
