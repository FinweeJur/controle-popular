# 🤖 Bots de Automação — Controle Popular

Diretório de bots especializados para verificação e automação de dados de transparência.

## 📦 Bots Disponíveis

### `verifica-dados.mts`
**Cross-check automatizado de dados críticos**

Verifica inconsistências entre fontes primárias e secundárias:
- Valores (R$ 900M vs R$ 900K)
- Códigos IBGE (Betim x São Paulo)
- Duplicatas (processos repetidos)

```bash
npx tsx bots/verifica-dados.mts --limiar 0.01
```

### `notifica-telegram.mts`
**Notificação automática ao Telegram**

Envia microresumos para o dono do projeto a cada conclusão.

```bash
# Formato simples
npx tsx bots/notifica-telegram.mts "Conclusão: Schema de conselhos criado"

# Formato completo
npx tsx bots/notifica-telegram.mts \
  --titulo "Schema Conselhos ✓" \
  --resumo "Tabela conselhos_membros com 6 campos sociais criada. Zero CPF policy implementado." \
  --status concluido \
  --emoji "✅"
```

---

## 🔗 Integração com Microetapas

### Exemplo: Pós-conclusão da microetapa

```bash
#!/bin/bash
# script-m1.sh

echo "Executando M1: Schema conselhos_membros..."
npx tsc apps/web/lib/db/schema-conselhos.ts --noEmit

if [ $? -eq 0 ]; then
  echo "✅ Schema válido!"
  npx tsx bots/notifica-telegram.mts \
    --titulo "M1 Concluído ✓" \
    --resumo "Schema de conselhos_membros criado e validado. Tabela com 6 campos sociais incluindo análise de representação (governo vs sociedade civil). Zero CPF policy implementado." \
    --status concluido \
    --emoji "✅"
else
  echo "❌ Erro no schema"
  npx tsx bots/notifica-telegram.mts \
    --titulo "M1 Alerta ⚠️" \
    --resumo "Schema conselhos_membros falhou na validação TypeScript" \
    --status alerta \
    --emoji "⚠️"
fi
```

---

## 📊 Fluxo de Trabalho Recomendado

```
Microetapa → Verificação → Testes → Notificação
     ↓            ↓          ↓          ↓
   Código    ts-check    npx test   Telegram
```

1. **Executar microetapa** (script, coleta, schema)
2. **Validar com TypeScript** (`npx tsc --noEmit`)
3. **Testar se aplicável** (`npm test`)
4. **Notificar via Telegram** (`notifica-telegram.mts`)

---

## ⚙️ Configuração

### Variáveis de Ambiente

Criar arquivo `scripts/.env`:

```env
TELEGRAM_BOT_TOKEN=seu_token_aqui
TELEGRAM_CHAT_ID=seu_chat_id_aqui
```

### Obter Credenciais

1. **@BotFather no Telegram** → `/newbot` → Token
2. **Chat ID** → `https://api.telegram.org/bot<TOKEN>/getUpdates` (enquanto conversa com o bot)

---

## 🎯 Casos de Uso

### Verificação de valores do PNCP

```bash
# Cross-check de um contrato específico
npx tsx bots/verifica-dados.mts --processo 12345-67/2024
```

**Resultado esperado:**
```
❌ 12345-67/2024: crítico
   Valor p/incipal: 900.000.000
   Valor secundário: 900.000
   Diferença: 99.900.00%
   Confiabilidade: 30%
   Fonte: Diário Oficial PDF
```

### Notificação de conclusão

```bash
npx tsx bots/notifica-telegram.mts \
  --titulo "V2 Concluído" \
  --resumo "Schema outorgas_agua criado. Tabela principal com 20 campos para mapear 5.000+ licenças de água em MG. Foco em escassez hídrica e concentração de poder." \
  --status concluido \
  --emoji "💧"
```

---

## 📁 Estrutura

```
bots/
├── verifica-dados.mts      # Cross-check de valores
├── notifica-telegram.mts   # Envio de mensagens
├── templates/              # Templates para scripts
└── logs/                   # Logs de execução
    └── verificacao-*.json  # Relatórios gerados
```

---

## 🔍 Armadilhas Conhecidas

| Problema | Solução |
|----------|---------|
| Token do Telegram vencido | Renovar via @BotFather |
| Diferença > 100% no cross-check | Verificar cálculo (milhões vs mil) |
| Código IBGE não reconhecido | Usar tabela oficial IBGE |
| Mensagem não chega | Verificar chat_id no .env |

---

## 🤝 Integração com Outros Projetos

Para usar estes bots em outros projetos:

1. Copiar diretório `bots/`
2. Atualizar variáveis de ambiente
3. Ajustar limites no script (`LIMIAR_ERRO`)
4. Customizar mensagens no `notifica-telegram.mts`

---

> 📌 **Dica:** Adicione `npx tsx bots/notifica-telegram.mts "Mensagem..." &&` no final de cada script de microetapa para notificações automáticas.