/**
 * CLI: lê as últimas mensagens recebidas pelo bot.
 *   npx tsx scripts/ler-updates-telegram.mts [quantidade]
 * A lógica vive em scripts/canario/telegram.ts (fonte única).
 */
import { listarUpdates, configurado } from "./canario/telegram";

if (!configurado()) {
  console.error("TELEGRAM_BOT_TOKEN ausente (scripts/.env)");
  process.exit(1);
}

const updates = await listarUpdates(Number(process.argv[2] ?? 5));
if (updates.length === 0) {
  console.log("(sem mensagens novas)");
  process.exit(0);
}

for (const u of updates) {
  const quando = u.data?.toLocaleString("pt-BR") ?? "?";
  console.log(`#${u.updateId} ${quando} [chat ${u.chatId}] ${u.texto ?? "(sem texto)"}`);
}
