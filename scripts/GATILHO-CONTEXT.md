# Contexto: Gatilho Remoto â€” bot Telegram + opencode

## O que Ã©
Bot Telegram que funciona como interface remota do projeto `controle-popular`. Aceita comandos e prompts de IA via mensagem.

**Arquivo principal:** `C:\DevCoder\controle-popular\scripts\gatilho-remoto.mts`
**Env:** `C:\DevCoder\controle-popular\scripts\.env`
**opencode config:** `C:\Users\Home\.config\opencode\opencode.json`
**opencode binary:** `C:\Users\Home\AppData\Local\hermes\node\node_modules\opencode-ai\bin\opencode.exe`
**Task Scheduler:** `Controle Popular - gatilho remoto`

## Canais de comunicaÃ§Ã£o
- **Telegram bot** (long-poll, sem webhook): `TELEGRAM_BOT_TOKEN=8679298724:AAE6LRyzXl7WuugCKRqmSMrQcL1Sp3v-ed0`
- **Chat ID autorizado:** `7250703518` (qualquer outro chat Ã© ignorado)
- **HTTP no tailscale:** `http://100.91.10.1:3029/sincronizar` (sÃ³ dentro do tailnet, requer `GATILHO_TOKEN`)

## Comandos do bot
| Comando | O que faz |
|---------|-----------|
| `/sincronizar` | Git fetch + merge + push + build + deploy |
| `/status` | Mostra se estÃ¡ ocioso ou sincronizando |
| `/tunel` | Status do Cloudflared + Next.js (porta 3000) |
| `/reiniciar` | Mata e reinicia `next dev` na porta 3000 |
| `/code` | Status: banco (atos_diario, fontes, R2) |
| `/andamento` | Etapas do projeto (coletor, backfill, upload R2) |
| `/proximas` | Lista de pendÃªncias |
| `/ok <id>` | Aprova pedido de permissÃ£o remota (plugin canÃ¡rio) |
| `/negar <id>` | Nega pedido de permissÃ£o remota |

## Chat com IA (opencode)
Qualquer mensagem que **nÃ£o** Ã© reconhecida como comando aciona o `opencode run`:
1. Bot responde "ðŸ¤” Pensando..."
2. Executa `opencode.exe run "<mensagem>" --format json --auto`
3. Model: `maritaca/sabiazinho-4 (Sabiazinho 4)) via provider `@ai-sdk/openai-compatible`
4. Extrai os eventos `text` do JSONL de saÃ­da
5. Envia a resposta em chunks de 4000 chars (limite do Telegram)
6. Timeout de 120s

**Path do opencode.exe:** hardcoded em `OPENCODE_BIN` no arquivo. Se o opencode for movido, atualizar essa constante.

**opencode.json:** modelo padrÃ£o Ã© `deepseek/deepseek-chat`, provider `deepseek` com base URL `https://chat.maritaca.ai/api`. API key em `~/.local/share/opencode/auth.json`.

**Nota:** `execFileSync` bloqueia o event loop durante a geraÃ§Ã£o â€” respostas longas podem levar vÃ¡rios segundos. O bot nÃ£o processa outras mensagens enquanto gera.

## Como reiniciar o bot
```powershell
Stop-ScheduledTask -TaskName 'Controle Popular - gatilho remoto'
Start-Sleep -Seconds 2
# Matar processos Ã³rfÃ£os se existirem
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -match 'gatilho' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 2
Start-ScheduledTask -TaskName 'Controle Popular - gatilho remoto'
```

## SeguranÃ§a
- `GATILHO_TOKEN` comparado por SHA-256 + `crypto.timingSafeEqual`
- Chat ID autorizado: sÃ³ `TELEGRAM_CHAT_ID`
- Token em `.env` (gitignored), nÃ£o commitado
- Fail-closed: sem token/CHAT_ID, canal nÃ£o sobe

## Estrutura relevante
```
controle-popular/
â”œâ”€â”€ scripts/
â”‚   â”œâ”€â”€ gatilho-remoto.mts   â† arquivo principal (modificar aqui)
â”‚   â”œâ”€â”€ gatilho-remoto.cmd   â† wrapper para Task Scheduler
â”‚   â”œâ”€â”€ .env                  â† tokens e variÃ¡veis
â”‚   â””â”€â”€ sincronizar-e-publicar.mts  â† lÃ³gica de sync/deploy
â”œâ”€â”€ _run_gatilho.bat          â† alternativa para rodar manualmente
â”œâ”€â”€ .opencode/plugin/
â”‚   â””â”€â”€ canario-telegram.ts   â† plugin: notifica + /ok /negar
â””â”€â”€ logs/
    â””â”€â”€ gatilho-remoto.log    â† log do bot
```

## Plugin canÃ¡rio
- `.opencode/plugin/canario-telegram.ts`
- Notifica dono sobre erros e pedidos de permissÃ£o do opencode
- `/ok <id>` / `/negar <id>` â†’ grava em `.opencode/canario/respostas.log`
- Gatilho lÃª esse arquivo e responde ao plugin
- `CANARIO_APROVACAO_REMOTA=1` ativa aprovaÃ§Ã£o remota (senÃ£o, sÃ³ observa)
