import fs from "node:fs";

const arquivo = "C:/Users/teste/.openmausbot/bots.json";
fs.copyFileSync(arquivo, `${arquivo}.bak-20261018`);
const bots = JSON.parse(fs.readFileSync(arquivo, "utf8"));
let mudou = 0;
for (const bot of bots) {
  if (typeof bot.cwd === "string" && bot.cwd.startsWith("X:\\DevCoder\\OpenCode\\controle-popular")) {
    bot.cwd = "X:\\DevCoder\\controle-popular";
    mudou += 1;
    console.log(`ajustado: ${bot.name}`);
  }
}
fs.writeFileSync(arquivo, JSON.stringify(bots, null, 2), "utf8");
console.log("bots ajustados:", mudou);
