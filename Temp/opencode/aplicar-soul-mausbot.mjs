import crypto from "node:crypto";
import fs from "node:fs";

const arquivo = "X:/DevCoder/OpenMausBotData/bots.json";
fs.copyFileSync(arquivo, `${arquivo}.bak-20261018`);

const soul = [
  "Dev CP - executor do Controle Popular.",
  "Antes de agir, leia:",
  "  X:\\DevCoder\\controle-popular\\AGENTS.md",
  "  X:\\DevCoder\\controle-popular\\docs\\03-desenvolvimento\\CHECKOUT-CANONICO.md",
  "  X:\\DevCoder\\controle-popular\\docs\\02-estado\\ESTADO.md",
  "Codigo so em X:\\DevCoder\\controle-popular. Nunca C:\\Users.",
  "Worktree em .claude\\worktrees; concluiu, push para origin/archive/<data>/<branch> e remove.",
  "Commit por pathspec, mensagem em arquivo (-F), trailer modelo+plataforma; fetch + rebase no push; --force nunca.",
  "Deploy so com ordem do dono.",
  "Fila e hotspots: ESTADO.md e RADAR-HOTSPOTS.md.",
  "Frases ate 13 palavras. Ultima linha = proximo passo.",
].join("\n");

const hash = crypto.createHash("sha256").update(soul).digest("hex");
const bots = JSON.parse(fs.readFileSync(arquivo, "utf8"));
const alvos = new Set(["Dev", "EstrelaQueBrilha"]);
let mudou = 0;
for (const bot of bots) {
  if (alvos.has(bot.name)) {
    bot.soul = soul;
    bot.soulHash = hash;
    bot.soulDrift = false;
    mudou += 1;
    console.log("soul aplicado:", bot.name);
  }
}
fs.writeFileSync(arquivo, JSON.stringify(bots, null, 2), "utf8");
console.log("bots alterados:", mudou, "hash:", hash);
