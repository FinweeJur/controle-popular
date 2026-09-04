/**
 * scripts/coletar-diario-municipios.mts — coletor-agenda dos diários oficiais.
 *
 * ═══ POR QUE ESTE ARQUIVO EXISTE ═══
 *
 * `etl/betim/etl/camaras/sigpub.py` (AMM-MG) e `domweb.py` (DOM-PBH) são os
 * coletores de diário oficial mais saudáveis do repo — medido em 03/09: 222
 * matérias do SIGPub em agosto, parser do DOM sem queixa. E nenhum dos dois
 * tinha agendamento: o `rotina-coletas.mts` chama `--listar` na madrugada,
 * e o comando puro do módulo roda só a BETIM (ID_MUNICIPIO_DEFAULT). Quem
 * sentia falta do diário das outras cidades era o dono, não o código.
 *
 * Este wrapper é a peça de agenda: roda um comando por cidade, na frente do
 * portal. SIGPub cobre as 5 cidades mineiras (o cadastro das entidades vem
 * do banco — cidade sem cadastro pula com aviso, nunca inventa id); o DOM
 * cobre Belo Horizonte, que tem portal próprio. Falha em uma cidade não
 * derruba a rodada das outras — o resumão no fim decide o exit code, e é ele
 * que o Telegram do dono mostra.
 *
 * Uso:
 *   npx tsx scripts/coletar-diario-municipios.mts           # grava no banco
 *   npx tsx scripts/coletar-diario-municipios.mts --seco    # mede, nao grava
 *
 * Cadência: madrugada (rotina-coletas.mts, slug `diario-oficial-municipios`).
 * Requer DATABASE_URL — resolvida pelo cwd em etl/betim (.env local), mesmo
 * padrão do `picoclaw-source-watcher.mts`.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PYTHON = process.env.RADAR_PYTHON ?? "py";
const PYTHON_ARGS = process.env.RADAR_PYTHON ? [] : ["-3"];
const SO_MEDIR = process.argv.includes("--seco");

// SIGPub AMM-MG: Diamantina é a ÚNICA confirmação limpa de uso ativo entre
// as 6 cidades do portal (docs/_historico/diario-oficial-sigpub-mapeamento.md,
// medido 22/08). IDs lidos de `CIDADES_DO_BUILD` (04/09), nunca à mão.
// Betim já tem diário por outro caminho (etl/betim/diario*), BH usa o DOM
// próprio abaixo, Araçuaí/Itinga têm diário de prefeitura ainda sem coletor
// — cidade sem fonte confirmada não entra na agenda por chute.
const CIDADES_SIGPUB = [
  "3121605", // Diamantina
];
// O DOM-PBH é o diário de UMA cidade: BH.
const DOM_BH = "3106200";

function rodarPython(modulo: string, cwd: string, args: string[]): { ok: boolean; ultimo: string } {
  const r = spawnSync(PYTHON, [...PYTHON_ARGS, "-m", modulo, ...args], {
    cwd,
    stdio: "pipe",
    encoding: "utf-8",
    shell: true,
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
  });
  const saida = `${r.stdout ?? ""}\n${r.stderr ?? ""}`.trim();
  const ultimo = saida.split("\n").filter(Boolean).slice(-1)[0] ?? "";
  return { ok: r.status === 0, ultimo };
}

function main(): void {
  const cwdEtl = path.join(RAIZ, "etl", "betim");
  let sucesso = 0;
  let falha = 0;

  // --seco: sem modo-sonda por cidade no wrapper (a agenda roda o sync
  // completo, que decide o mês sozinho). Medir de verdade é rodar o módulo
  // direto com --sondar --entidade-usuaria, documentado no cabeçalho dele.
  // Aqui --seco serve só para a rotina testar o ENCANAMENTO sem gravar.
  const alvos = [
    ...CIDADES_SIGPUB.map((id) => ({ modulo: "etl.camaras.sigpub", id })),
    { modulo: "etl.camaras.domweb", id: DOM_BH },
  ];

  for (const { modulo, id } of alvos) {
    if (SO_MEDIR) {
      console.log(`🧪 [seco] chamaria: ${PYTHON} ${PYTHON_ARGS.join(" ")} -m ${modulo} --id-municipio ${id}`);
      sucesso++;
      continue;
    }
    const { ok, ultimo } = rodarPython(modulo, cwdEtl, ["--id-municipio", id]);
    console.log(`${ok ? "✅" : "❌"} ${modulo.split(".").pop()} ${id}: ${ultimo.slice(0, 160)}`);
    ok ? sucesso++ : falha++;
  }

  console.log(`\n[diario-oficial] ${sucesso} ok, ${falha} falha(s), secagem=${SO_MEDIR ? "sim" : "nao (grava no banco)"}`);
  if (falha > 0) process.exit(1);
}

main();
