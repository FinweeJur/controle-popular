# Estratégia — Economia agressiva de tokens (modo Caveman)

> **Tipo:** OPERACAO
> **Domínio:** coordenação entre agentes
> **Última medição:** 2026-09-02 (18:16)
> **Relacionados:** [PONTE-JCODE-GEMINI](./PONTE-JCODE-GEMINI.md), [FILA-AGENTES](./FILA-AGENTES.md)
> **Palavras-chave:** tokens, economia, caveman, jcode, gemini, delegacao

## 🎯 Papéis

| Agente | Papel |
|---|---|
| **jcode** (deepseek) | planeja · delega · critica · verifica |
| **Gemini/Antigravity** | executa tarefas grandes |

## ✂️ Regras Caveman (economia máxima)

1. **Respostas curtas.** Estado em ≤ 4 palavras por item. ✅
2. **Sem repetir contexto.** Já lido = já sabido. 🚫
3. **Tudo vira item na fila.** Nada de prosa no chat. 📋
4. **Delegar, não executar.** Tarefa grande → fila do Gemini. 🎯
5. **Verificar no site, não no código.** "Funciona? Visível?" ✅❌
6. **Ler só o necessário.** Arquivo grande → trecho, não inteiro. 📄
7. **Telegram = canal único.** Sem relatório longo. 📲

## 🗂️ Estado em 4 palavras (padrão)

| Tema | Estado |
|---|---|
| Onda 1 (código) | pronta, não publicada |
| Onda 1 (GitHub) | aguardando decisão |
| Docs/planos | no GitHub |
| Seu Nonô avatar | aplicado |
| Seu Nonô voz | golden set |
| Missão ONSA | home atualizada |
| Fila agentes | 2 itens |
| Relatórios internacionais | fila gemini |
| Escuta Telegram | ativa |

## 📣 Fluxo de comando

- `/jcode <tarefa>` → jcode planeja + delega ou executa mínimo.
- `/gemini <tarefa>` → fila do Gemini.
- Verificação: jcode testa no site e responde 4 palavras.

## ⏭️ Ação imediata

Delegar ao Gemini os itens grandes da fila e enxugar respostas.
