# Bot WhatsApp — whatsmeow × Hermes Agent

Bot de WhatsApp usando a biblioteca [`whatsmeow`](https://github.com/tulir/whatsmeow) (Go),
integrado ao Hermes Agent via **arquivo de inbox/outbox** — o mesmo padrão do
bot do Telegram (`scripts/escuta-telegram.mts` → `logs/telegram-inbox.jsonl`).

## Arquitetura

```
WhatsApp Group
      │
      ▼
┌────────────────┐   writes   ┌──────────────────────┐
│  whatsmeow     │ ─────────> │ logs/whatsapp-inbox  │
│  bot (Go)      │ <────────  │ logs/whatsapp-outbox │
└────────────────┘   reads    └──────────────────────┘
      ▲                                        │
      │ enviado                                │ lê + busca web
      │                                        ▼
┌────────────────────────┐    writes    ┌──────────────────────┐
│ whatsapp-processor.mts │ ───────────> │ logs/whatsapp-outbox  │
│ (Node.js, busca DDG)   │              └──────────────────────┘
└────────────────────────┘
```

1. **Go bot** (`bots/whatsapp/main.go`) ouve mensagens do WhatsApp.
   - Filtra por números autorizados (`WHATSAPP_ALLOWED_NUMBERS`).
   - Em grupos, só responde quando o bot é mencionado (`@bot` ou número no texto).
   - Grava em `logs/whatsapp-inbox.jsonl`.
   - Lê `logs/whatsapp-outbox.jsonl` e envia respostas.

2. **Processor** (`scripts/whatsapp-processor.mts`) lê o inbox, busca na internet
   (DuckDuckGo) e grava respostas no outbox.

3. **Helper CLI** (`scripts/notificar-whatsapp.mjs`) — escreve uma mensagem no
   outbox para envio manual (equivalente a `notificar-telegram.mjs`).

## Configuração

### 1. Env vars (em `scripts/.env`)

Copie de `bots/whatsapp/.env.exemplo`:

```env
WHATSAPP_GROUP_JID=553199999999-1234567890@g.us
WHATSAPP_ALLOWED_NUMBERS=553175709609,553171404503
WHATSAPP_BOT_NUMBER=553182377181
WHATSAPP_STORE_PATH=bots/whatsapp/store.db
```

### 2. Pairing (primeira vez)

```bash
cd bots/whatsapp
go run .
```

Escaneie o QR code (`bots/whatsapp/qr-code.png`) com o WhatsApp no celular.
Depois de emparelhado, o store é salvo no SQLite e não precisa repetir.

### 3. Descobrir o JID do grupo

```bash
go run . --list-groups
```

## Execução

### Manual
```bash
# Terminal 1 — bot Go (ouvinte + sender)
cd bots/whatsapp && go run .

# Terminal 2 — processor (busca web)
npx tsx scripts/whatsapp-processor.mts
```

### Autostart (Windows)

Compile e deixe rodando em background:

```bash
cd bots/whatsapp && go build -o whatsapp-bot .
```

Adicione `bots/whatsapp/start.bat` ao **Agendador de Tarefas** (trigger: no login)
ou à pasta de Inicialização do Windows (`shell:startup`).

## Comandos rápidos

| Comando | Ação |
|---|---|
| `go run .` | Inicia o bot (pairing na primeira vez) |
| `go run . --list-groups` | Lista grupos do bot (depois do pairing) |
| `node scripts/notificar-whatsapp.mjs "msg"` | Envia mensagem manual via outbox |
| `npx tsx scripts/whatsapp-processor.mts` | Processor de busca (loop) |
| `npx tsx scripts/whatsapp-processor.mts --once` | Processa uma vez e sai |

## Formato do inbox

```jsonl
{"recebido_em":"2026-01-01T12:00:00Z","id":"ABC123","grupo":"123@g.us","de":"Artur (553175709609)","numero":"553175709609","texto":"Qual a previsão do tempo?","is_group":true}
```

## Formato do outbox

```jsonl
{"recebido_em":"2026-01-01T12:00:01Z","texto":"Resposta aqui","grupo":"123@g.us"}
```

## Observações

- O store SQLite (`bots/whatsapp/store.db`) salva a sessão — **não compartilhe**
  publicamente. Adicionado ao `.gitignore`.
- O QR code (`bots/whatsapp/qr-code.png`) é regenerado a cada pairing.
- Sempre que o PC reiniciar, o `start.bat` retoma automaticamente (store persiste).
