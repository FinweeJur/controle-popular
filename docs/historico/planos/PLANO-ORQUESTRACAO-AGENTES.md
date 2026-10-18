# Plano de Orquestração Multi-Agente

> **Arquivado em 18/10/2026** na consolidação de planos. O que restava
> de pendência foi absorvido pelos planos integrados em `docs/planos/`.


> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-10-18
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [PLANO-ORQUESTRACAO-AGENTES-V2.md](/docs/historico/planos/PLANO-ORQUESTRACAO-AGENTES-V2.md), [FILA-AGENTES.md](/docs/historico/entregas/FILA-AGENTES.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** orquestracao, agentes, hermes, opencode, antigravity, agy, ollama, needle, fases, smoke-tests

> **Escopo:** Hermes · OpenCode (Go) · Antigravity (Gemini) · Ollama (incl. Needle)
> **Projetos:** controle-popular · cutiazinha · foz-juris · sementeira
> **Fonte:** [sementeiraprojetos.com.br](https://sementeiraprojetos.com.br) · [github finweejur](https://github.com/FinweeJur)

> ⚠️ **Superado por [PLANO-ORQUESTRACAO-AGENTES-V2.md](/docs/historico/planos/PLANO-ORQUESTRACAO-AGENTES-V2.md) em 2026-10-18** — Hermes deixa de ser o orquestrador (instabilidade medida), OpenMausBot assume como hub, matriz de modelos fecha em CN/BR/open + Gemini. Mantido aqui como referência das fases e smoke tests até a migração validar; depois vai para `docs/historico/planos/`.

## Sumário

- [Objetivo](#objetivo)
- [1. Agentes e Configuração](#1-agentes-e-configuração)
- [2. Arquitetura de Orquestração](#2-arquitetura-de-orquestração)
- [3. Workflow - 7 Fases](#3-workflow---7-fases)
- [4. Projetos - Focus Inicial](#4-projetos---focus-inicial)
- [5. Script de Orquestração](#5-script-de-orquestração)
- [6. Regras de Ouro (do AGENTS.md - aplicadas a todos)](#6-regras-de-ouro-do-agentsmd---aplicadas-a-todos)
- [7. Pendências](#7-pendências)

## Objetivo

Orquestrar agentes de IA em plataformas diferentes para ciclar continuamente:

**SUGERIR → PLANEJAR → EXECUTAR → AVALIAR → RE-EXECUTAR → ATUALIZAR → MONITORAR**

---

## 1. Agentes e Configuração

| Agente | Plataforma | Binário | Modelos Testados | Status |
|--------|-----------|---------|-------------------|--------|
| **Hermes** | Hermes Desktop | (interno) | `upstage/solar-pro4:free` | ✅ Orquestrador |
| **OpenCode Go** | OpenCode CLI → agy fallback | `opencode` / `agy.exe` | GPT-OSS 120B (via agy) | ⚠️ CLI Go = server error; usando agy |
| **Antigravity** | Google Antigravity CLI | `C:\Users\Home\AppData\Local\agy\bin\agy.exe` | Gemini 3.8 Flash, GPT-OSS 120B, Claude Opus 4.6 | ✅ Ativo |
| **Ollama** | Ollama local | `ollama` | qwen2.5-coder:3b, deepseek-r1:7b, llama3.2:3b, sabia-finetuned | ✅ Serviço rodando |
| **Needle** | Needle CLI (Python 3.12) | `needle` | needle3 (26M params) | ⏳ .safetensors baixando |

### 1.1 Testes de Smoke

```bash
# Hermes — orquestrador (este ambiente)
# (implícito — estamos rodando nele)

# Antigravity (agy)
agy -p "Responda: AGY_OK" → AGY_OK ✅
agy -p "..." --model "GPT-OSS 120B (Medium)" → AGY_GPT_OSS_OK ✅

# OpenCode Google (backup do Antigravity)
opencode run "Responda: OC_OK" --model google/gemini-3.5-flash → OC_OK ✅

# Ollama
ollama list → 5 modelos ✅
curl http://127.0.0.1:11434/api/tags → OK ✅

# OpenCode Go — FALHA
opencode run "..." --model opencodestorage-go/deepseek-v4.1-flash → "Unexpected server error" ❌
# Solução: usar agy GPT-OSS 120B como agente Go-model (mesmo family)
```

### 1.2 Needle — Download e Setup

```bash
# Instalação (Python 3.12)
pip install "cactus-needle[train]"  # ✅ instalado v3.2.3

# Download do modelo (8–29 MB, 26M params)
needle download needle3.safetensors --out C:/devcoder/.needle-models/
# Alternativa: needle download needle3 --out C:/devcoder/.needle-models/  (.cact = mais rápido, mas requer build)

# Dependência: flax (JAX)
pip install flax --target C:/dev/_flax_lib --no-deps  # ✅ Windows path-length workaround

# Teste:
PYTHONPATH="C:/dev/_flax_lib" needle run --checkpoint needle3.safetensors --query "..."
```

## 2. Arquitetura de Orquestração

```
┌─────────────────────────────────────────────────────────┐
│                    HERMES (Orquestrador)                    │
│  ┌─────────┐   ┌──────────────┐   ┌──────────────┐     │
│  │ SUGERIR │ → │ PLANEJAR      │ → │ EXECUTAR      │     │
│  │ Needle   │   │ Antigravity  │   │ OpenCode Go   │     │
│  │ Ollama   │   │ (Gemini)     │   │ (via agy)     │     │
│  └─────────┘   └──────────────┘   └──────────────┘     │
│        ↓           ↓               ↓                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ AVALIAR     │ ←│ RE-EXECUTAR │ ←│ (feedback)  │       │
│  │ Hermes +    │  │ OpenCode Go │  │             │       │
│  │ Antigravity │  │ (corrige)   │  │             │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
│        ↓                                                │
│  ┌─────────────┐  ┌─────────────┐                        │
│  │ ATUALIZAR   │ →│ MONITORAR   │                        │
│  │ Hermes      │  │ Antigravity │                        │
│  │ (commit+push)│  │ + Needle    │                        │
│  └─────────────┘  └─────────────┘                        │
└─────────────────────────────────────────────────────────┘
```

### Comunicação entre Agentes

- **Handoff files:** Markdown/YAML em `.agents/orquestrador/workflow/task_<id>/`
- **Worktrees isolados:** `~/worktrees/<projeto>-task<id>/` (um por agente)
- **Telegram:** Notificação por fase (3 linhas: etapa concluída / próxima / risco)
- **Commit rules:** Pathspec, mensagem em arquivo, Co-Authored-By obrigatório

## 3. Workflow — 7 Fases

### Fase 1: SUGERIR
- **Needle:** tria issues do GitHub por prioridade (alta/média/baixa)
- **Antigravity (Gemini 3.8 Flash High):** analisa sementeiraprojetos.com.br + código, sugere melhorias
- **Saída:** `sugestoes_antigravity.json`

### Fase 2: PLANEJAR
- **Antigravity:** lê `AGENTS.md` do projeto, cria plano YAML com milestones
- **Saída:** `docs/planos/PLANO-AUTO-<task_id>.yaml`

### Fase 3: EXECUTAR
- **OpenCode Go (via agy GPT-OSS 120B):** implementa em worktree isolado
- Cria worktree + branch próprio
- **Saída:** código implementado em `worktrees/<projeto>-task<id>/`

### Fase 4: AVALIAR
- **Hermes:** `tsc --noEmit`, CPF check, lint, CodeScene
- **Antigravity (Gemini 3.8 Medium):** revisão criativa (acessibilidade, mobile, docs)
- **Saída:** `avaliacao.md` — pass/fail

### Fase 5: RE-EXECUTAR
- Se falhar: OpenCode Go corrige → re-avalia
- Máximo 3 iterações

### Fase 6: ATUALIZAR
- **Hermes:** commit por pathspec + push (rebase)
- Co-Authored-By: modelo + plataforma
- Telegram: notificação

### Fase 7: MONITORAR
- **Antigravity:** busca notícias + novos modelos open-source
- **Needle:** tria por relevância
- **Saída:** `monitoramento.md`

## 4. Projetos — Focus Inicial

| Projeto | Stack | Focus | Agente Primário |
|---------|-------|-------|-----------------|
| **controle-popular** | Next.js 16, Drizzle, Cloudflare | Diário Oficial: coletores faltantes (5 cidades) | OpenCode Go |
| **cutiazinha** | Go, React/Tailwind, Wails | Router local vs cloud + Needle adapter | Needle + OpenCode Go |
| **foz-juris** | Django 5.2, PyWebView, SQLite | IA routing + LGPD compliance | Antigravity + OpenCode Go |
| **sementeira** | Electron 40, React 19, TS | Compliance engine (Ofício 46) | Antigravity + OpenCode Go |

## 5. Script de Orquestração

```bash
# Instalação
python scripts/orquestrador-ia.py --help

# Executar workflow completo
python scripts/orquestrador-ia.py "implementar dark mode no foz-juris" --projeto foz-juris

# Executar fase específica
python scripts/orquestrador-ia.py "analisar" --fase sugerir --projeto cutiazinha

# Listar planos
python scripts/orquestrador-ia.py --planos --projeto controle-popular
```

## 6. Regras de Ouro (do AGENTS.md — aplicadas a todos)

1. 🚫 `git push --force` nunca
2. ✅ Commit por pathspec: `git commit --only <caminho> -F <msg>`
3. ✅ Mensagem em arquivo, nunca `-m`
4. ✅ Co-Authored-By: modelo + plataforma (sempre duas linhas)
5. ✅ CPF mod-11 (Mod-11 validado)
6. ✅ Worktree quando há briga (um por agente)
7. ✅ Nunca segredos no disco
8. ✅ Ollama/Needle para repetitivo; Hermes/Gemini para decisão

## 7. Pendências

- [ ] **Needle .safetensors** — download em andamento
- [ ] **OpenCode Go CLI** — server error (usando agy GPT-OSS 120B como workaround)
- [ ] **Antigravity auth** — funciona via `agy` com Google account
- [ ] **Telegram webhook** — usar `scripts/envia-telegram.py` existente