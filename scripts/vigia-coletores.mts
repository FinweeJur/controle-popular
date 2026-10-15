/**
 * scripts/vigia-coletores.mts — vigia do frescor das fontes do portal.
 *
 * Papel no portal: responde "o coletor está vivo?" com NÚMEROS, não opinião
 * (PLANO-DATA-DO-DADO.md, Fase 5 — aprovado pelo dono em 15/10/2026). Para
 * cada FonteDef do `apps/web/lib/fontes/registry.ts` que aponta um
 * `caminhoArquivo`, lê o cabeçalho do dump e calcula o lag desde o carimbo
 * (`geradoEm` e afins, nascido na ESCRITA BEM-SUCEDIDA do coletor). Fonte
 * fora do teto da própria frequência = vermelha na CI, e a dívida fica
 * visível sem ninguém precisar lembrar dela.
 *
 * Régua por frequência (limite do plano, calibrável pelo dono):
 * tempo-real > 2 dias, diária > 3, semanal > 10, mensal > 40, anual > 400;
 * estática é isenta.
 *
 * Por que só lê disco: não coleta, não liga VM, não toca rede, não gasta
 * cota nenhuma — por isso pode rodar todo dia. Arquivo que nenhum coletor
 * do repo escreve mais aparece "sem-carimbo": é o status-quo exposto com
 * honestidade, não falso verde (aviso; o vermelho fica para o atraso).
 *
 * Veredito do exit code, no jeito CATRACA (mesma filosofia do
 * `verificar-padrao-pagina.py` — dívida registrada não trava ninguém,
 * REGRESSÃO é que dói): 1 quando uma fonte ficou vermelha (`atrasada` ou
 * `arquivo-ausente`) SEM estar na régua de dívidas conhecida — ou seja, um
 * coletor que funcionava parou. Fontes já vermelhas na régua viram aviso.
 * `sem-carimbo` é sempre aviso (decisão do dono na tabela do plano).
 *
 * Uso:
 *   npx tsx scripts/vigia-coletores.mts [--catraca <json>] [--gravar-catraca <json>]
 * Saída: tabela no console +
 * `docs/relatorios-automacao/vigia-coletores-status.json` (registro da rodada).
 */
import fs from "node:fs";
import { REGISTRY_FONTES } from "../apps/web/lib/fontes/registry.js";
import { dataDoAcervo } from "../apps/web/lib/fontes/dataDoArquivo.js";

/** Teto de dias por frequência; null = isenta de cobrança de frescor. */
const TETO_DIAS: Record<string, number | null> = {
  "tempo-real": 2,
  diaria: 3,
  semanal: 10,
  mensal: 40,
  anual: 400,
  estatica: null,
};

type Veredito = "ok" | "atrasada" | "sem-carimbo" | "arquivo-ausente" | "isenta";

interface LinhaVigia {
  fonte: string;
  nome: string;
  arquivo: string;
  frequencia: string;
  carimbo: string | null;
  lagDias: number | null;
  tetoDias: number | null;
  veredito: Veredito;
}

const agora = Date.now();
const linhas: LinhaVigia[] = [];
const vistos = new Set<string>();

for (const fonte of Object.values(REGISTRY_FONTES)) {
  const arquivo = fonte.caminhoArquivo;
  if (!arquivo || vistos.has(arquivo)) continue;
  vistos.add(arquivo);
  const teto = TETO_DIAS[fonte.frequenciaAtualizacao] ?? null;
  const base = {
    fonte: fonte.slug,
    nome: fonte.nome,
    arquivo,
    frequencia: fonte.frequenciaAtualizacao,
    tetoDias: teto,
  };

  if (!fs.existsSync(arquivo)) {
    linhas.push({ ...base, carimbo: null, lagDias: null, veredito: "arquivo-ausente" });
    continue;
  }

  // Le o dump inteiro: o cabeçalho de data mora no topo, mas o parser JSON
  // honesto exige o arquivo todo e os maiores têm MB, não GB — custo ok para
  // um vigia diurno. Falha de parse = sem-carimbo (aviso), nunca crash.
  let bruto: unknown = null;
  try {
    bruto = JSON.parse(fs.readFileSync(arquivo, "utf8"));
  } catch {
    bruto = null;
  }
  const carimbo = typeof bruto === "object" && bruto !== null ? dataDoAcervo(bruto) : null;
  if (!carimbo) {
    linhas.push({ ...base, carimbo: null, lagDias: null, veredito: teto === null ? "isenta" : "sem-carimbo" });
    continue;
  }
  const ms = Date.parse(carimbo);
  const lag = Number.isNaN(ms) ? null : Math.floor((agora - ms) / 86_400_000);
  const veredito: Veredito =
    teto === null ? "isenta" : lag !== null && lag > teto ? "atrasada" : "ok";
  linhas.push({ ...base, carimbo, lagDias: lag, veredito });
}

for (const l of linhas) {
  const carimbo = (l.carimbo ?? "—").slice(0, 10);
  const lag = l.lagDias === null ? "—" : `${l.lagDias}d`;
  const teto = l.tetoDias === null ? "—" : `${l.tetoDias}d`;
  console.log(`[${l.veredito.toUpperCase()}] ${l.fonte.padEnd(26)} ${l.frequencia.padEnd(11)} carimbo ${carimbo}  lag ${lag}  teto ${teto}`);
}

const vermelhas = linhas.filter((l) => l.veredito === "atrasada" || l.veredito === "arquivo-ausente");
const amarelas = linhas.filter((l) => l.veredito === "sem-carimbo");
console.log(
  `resumo: ${linhas.length} arquivos medidos | vermelhas ${vermelhas.length} | sem-carimbo ${amarelas.length}`,
);

const status = {
  geradoEm: new Date().toISOString(),
  regra: TETO_DIAS,
  linhas,
};
fs.mkdirSync("docs/relatorios-automacao", { recursive: true });
fs.writeFileSync(
  "docs/relatorios-automacao/vigia-coletores-status.json",
  JSON.stringify(status, null, 1) + "\n",
  "utf8",
);

if (vermelhas.length > 0) {
  console.warn(`aviso: ${vermelhas.length} fonte(s) fora do prazo: ${vermelhas.map((v) => v.fonte).join(", ")}`);
}

// Catraca: a régua de dívidas conhecidas (fontes já vermelhas no dia em que
// o vigia nasceu). Vermelho NOVO = coletor que parou = CI cai. Mesma
// filosofia do padrao-pagina: dívida registrada não trava commit alheio.
const args = process.argv.slice(2);
const caminhoDe = (flag: string): string | null => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
};
const gravar = caminhoDe("--gravar-catraca");
if (gravar) {
  const base = Object.fromEntries(
    linhas.filter((l) => l.veredito === "atrasada" || l.veredito === "arquivo-ausente").map((l) => [l.fonte, l.veredito]),
  );
  fs.writeFileSync(
    gravar,
    JSON.stringify({ gravadaEm: new Date().toISOString(), vermelhasConhecidas: base }, null, 1) + "\n",
    "utf8",
  );
  console.log(`catraca gravada em ${gravar} (${Object.keys(base).length} fontes)`);
}

const catraca = caminhoDe("--catraca");
if (catraca) {
  let conhecidas: Record<string, string> = {};
  if (fs.existsSync(catraca)) {
    conhecidas = JSON.parse(fs.readFileSync(catraca, "utf8")).vermelhasConhecidas ?? {};
  } else {
    console.error(`##[error] catraca ausente (${catraca}); grave com --gravar-catraca`);
    process.exit(1);
  }
  const novas = vermelhas.filter((l) => !(l.fonte in conhecidas));
  if (novas.length > 0) {
    for (const n of novas) {
      console.error(`##[error] REGRESSÃO de coletor: ${n.fonte} (${n.arquivo}) está ${n.veredito} e a régua não conhecia`);
    }
    process.exit(1);
  }
  console.log(`catraca: nenhuma fonte nova fora do prazo (${Object.keys(conhecidas).length} dívidas conhecidas no vermelho)`);
}
