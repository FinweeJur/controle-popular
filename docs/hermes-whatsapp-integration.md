# Hermes Agent × WhatsApp Integration

## Como ativar o Hermes via WhatsApp

O Hermes Agent oferece integração nativa com WhatsApp via **gateway**. Para ativar:

### 1. Configurar o `.env` (Hermes home)
```bash
WHATSAPP_ENABLED=true
WHATSAPP_HOME_CHANNEL=553182377181@s.whatsapp.net
WHATSAPP_MODE=bot
WHATSAPP_DM_POLICY=pairing
WHATSAPP_GROUP_POLICY=open
WHATSAPP_ALLOWED_USERS=553171404503,553175709609
```

### 2. Iniciar o gateway
```bash
hermes gateway start
curl http://localhost:8644/health
```

### 3. Emparelhar (pairing)
- Escaneie o QR Code no Hermes Desktop → Settings → WhatsApp
- Pair code: `bots/whatsapp/paircode.log`

## Arquitetura

```
WhatsApp → Go Bot → inbox JSONL → Processor → hermes chat -q → outbox JSONL → Go Bot → WhatsApp reply
```

## Processor — Estrategia em cascata

1. **Hermes Proxy API** (porta 8080) — HTTP OpenAI-compatible, mais rápido
2. **Hermes CLI** (`hermes chat -q`) — full agent + tools (web search)
3. **Ollama** (`sabia-finetuned:latest`) — fallback local, rápido

### Como rodar
```bash
npx tsx scripts/whatsapp-processor.mts        # loop 5s
npx tsx scripts/whatsapp-processor.mts --once  # uma passada
./bots/whatsapp/whatsapp-bot                  # Go bot
```
