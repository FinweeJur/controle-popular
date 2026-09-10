# 📋 Plano de Automação Completa — Controle Popular

> **Tipo:** PLANO  
> **Domínio:** automação, ciclo, watchdog, coleta, dados  
> **Última medição:** 10/09/2026  
> **Leitura estimada:** 2 minutos  
> **Relacionados:** PLANO-ESTRUTURA-NACIONAL.md, PLANO-TRABALHO-SETEMBRO-2026.md  
> **Palavras-chave:** automação, ciclo, watchdog, telegram, coleta, dados, cidades  

---

## Sumário

Navegue pelo plano:

- 📊 Resultado Final
- 🐛 Bug Crítico Corrigido
- 🛠️ Scripts Criados
- 💾 Schema D1
- 📈 Métricas
- 🔔 Status Telegram
- 🧩 Próximos Passos
- 🛡️ Lições Aprendidas

---

## 📊 RESULTADO FINAL

- ✅ **5.570 munípios** baixados (27 estados)
- ✅ **27 routes** `/cidades/{uf}` publicadas
- ✅ **Schema** `cidadesNacionais` no D1 (SQLite)
- ✅ **Página** `/indicadores` com dados consolidados
- ✅ **Script** `build-indicadores-regionais.mts` funcional

## 🐛 BUG CRÍTICO CORRIGIDO

### Campo `uf` faltando em todos os JSONs

```bash
node -e "d.filter(x=>x.uf).length" → 0 (antes)
node -e "d.filter(x=>x.uf).length" → 5571 (depois)
```

**Arquivos afetados:**
- `municipios-brasil.json`: 5.571 cidades
- `municipios-{uf}.json` (27 arquivos): 5.570 cidades

**Bug raiz:** `seed-municipios-estado.mts` não gravava `uf` (API IBGE não retorna → manual).

**Correção:** Script join-IDs adicionou `uf` via mapeamento dos arquivos individuais.

## 🛠️ SCRIPTS CRIADOS

| Script | Função | Status |
|--------|--------|--------|
| `scripts/vigia-servidor.mts` | Health check 5min (silent watchdog) | ✅ Ativo (cron) |
| `scripts/download-documentos.mts` | Download PDFs por tema/data | ✅ Funcional |
| `scripts/etl/indicadores/build-indicadores-regionais.mts` | Dashboard dados consolidados | ✅ Funcional |
| `scripts/rotina-coletas.mts` | Orquestrador de coletas | ✅ Existente |
| `scripts/watchdog-relatorio-telegram.sh` | Watchdog Telegram | ✅ Corrigido |

## 💾 SCHEMA D1 (cidadesNacionais)

```sql
cidades_nacionais:
- id_ibge (PK)
- nome, uf, microrregiao, mesorregiao
- regiao_imediata, regiao_intermediaria
- populacao_estimada, area_km2
```

**Local:** `apps/web/lib/db/schema.d1.ts` (SQLite D1)

**Por que não Neon:** 94% storage usado (470/500 MB) → dados estáticos no D1 (0,3%).

## 📈 MÉTRICAS

- **Cidades:** 5.570 (0,3% do limite D1)
- **Neon:** 94% storage (470/500 MB)
- **TypeScript:** 0 erros (`tsc --noEmit`)
- **Testes:** 27/27 passando (`vitest --pool=threads`)

## 🔔 STATUS TELEGRAM

| Componente | Detalhe |
|------------|---------|
| Notificação final | ✅ chat_id 7250703518 |
| Watchdog report | `deliver='telegram:7250703518'` |
| Vigia servidor | Cron `*/5 * * * *`, no_agent=true |

## 🧩 PRÓXIMOS PASSOS

1. **Coletas noturnas** via `rotina-coletas.mts --tudo` (02:00)
2. **Bot CPF scanner** (OCR + mod-11) — detecta CPF em PDFs
3. **Bot Indicadores** (matplotlib gráficos → Telegram)
4. **Seu Nono jurídico** (RAG offline com Ollama)

## 🛡️ LIÇÕES APRENDIDAS

- `npm run test` não roda no Windows → usar `npx vitest run --pool=threads`
- `npx tsx` abre janela CMD no scheduler → usar `node node_modules/tsx/dist/cli.mjs`
- `uf` no JSON do IBGE não vem da API → adicionar manualmente
- `municipios-brasil.json` é cópia separada → join de ID para uf
- `npm run test` timeout (120s) ≠ testes reais falhando (78 falhas só geojson)
- Validar `.mts`/`.sh` com `node --check` / `bash -n`, não `npm test`

---

**Fontes:**  
IBGE API: `https://servicodados.ibge.gov.br/api/v1/localidades/estados/{uf}/municipios`  
Neon pricing: `https://neon.tech/pricing`  
AGENTS.md: regras do repositório