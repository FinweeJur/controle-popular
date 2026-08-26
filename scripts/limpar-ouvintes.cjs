// Limpa TODOS os ouvintes gatilho (node + cmd pais) e relança um único
// hidden com stdin de NUL. Uso operacional do canário.
const { execSync } = require("child_process");

function pids(cmdFilter, name) {
  try {
    const out = execSync(
      `wmic process where "name='${name}'" get processid,commandline /format:csv`,
      { encoding: "utf8", windowsHide: true }
    );
    return out
      .split("\n")
      .filter((l) => l.includes(cmdFilter))
      .map((l) => Number(l.trim().split(",").slice(-1)[0]))
      .filter((n) => Number.isFinite(n) && n > 0);
  } catch {
    return [];
  }
}

const alvo = ["gatilho-remoto.mts", "canario-nul.txt"];
const todos = [
  ...pids("gatilho-remoto.mts", "node.exe"),
  ...pids("gatilho-remoto.mts", "cmd.exe"),
  ...pids("canario-nul.txt", "cmd.exe"),
];
const unicos = [...new Set(alvo)];
console.log("matando:", unicos.join(", ") || "(nenhum)");
for (const pid of unicos) {
  try { execSync(`taskkill /F /T /PID ${pid}`, { stdio: "ignore" }); } catch {}
}
console.log("limpo");
