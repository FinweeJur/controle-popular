/**
 * CLI: envia mensagem para o canal do canário.
 *   npx tsx scripts/avisar-telegram.mts "texto"
 * A lógica vive em scripts/canario/telegram.ts (fonte única).
 */
import { enviarMensagem, configurado } from "./canario/telegram";

const MSG = process.argv.slice(2).join(" ") || "(sem mensagem)";

if (!configurado()) {
  console.error("TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID ausentes (scripts/.env)");
  process.exit(1);
}

const r = await enviarMensagem(MSG);
if (!r.ok) {
  console.error("Telegram recusou:", r.erro);
  process.exit(1);
}
console.log("✓ enviado:", MSG.slice(0, 80));
