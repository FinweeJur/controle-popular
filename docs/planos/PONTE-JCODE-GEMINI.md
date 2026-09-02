# Ponte Jcode ↔ Gemini/Antigravity

> **Tipo:** OPERACAO
> **Domínio:** coordenação entre agentes
> **Última medição:** 2026-09-02 (18:10)
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [AGENTS](/AGENTS.md), [PLANO-NOSSOS-PAINEIS-SANFONA](./PLANO-NOSSOS-PAINEIS-SANFONA.md)
> **Palavras-chave:** ponte, jcode, gemini, antigravity, fila, delegacao, telegram

## Sumário

- [Objetivo](#objetivo)
- [Como funciona hoje (medido)](#como-funciona-hoje-medido)
- [Canal de fila entre agentes (novo)](#canal-de-fila-entre-agentes-novo)
- [Como o dono usa](#como-o-dono-usa)
- [Primeira tarefa na fila](#primeira-tarefa-na-fila)
- [Limites honestos](#limites-honestos)
## 🎯 Objetivo

Permitir que o **jcode** (deepseek v4 flash) e o **Gemini/Antigravity**
trabalhem **juntos no mesmo repo**, delegando tarefas, perguntando do estado
dos commits e dialogando — sem pisar um no trabalho do outro. 🤝

## 🧭 Como funciona hoje (medido)

- O **Antigravity** roda como app desktop nesta máquina e **commita no mesmo
  repo local** (ex.: commits `a24c081`, `b897dcd`).
- O **jcode** (eu) também trabalha no mesmo checkout, commitando com
  pathspec explícito e publicando via worktree limpo (`github-docs`).
- O **Telegram** é o canal com o dono (Artur). Prefixos:
  - `/gemini` → tarefa para Gemini/Antigravity.
  - `/jcode` → tarefa para o jcode.

## 📬 Canal de fila entre agentes (novo)

Os dois agentes compartilham o **mesmo repositório**. Então a fila vive em:

```
docs/planos/FILA-AGENTES.md
```

Formato de cada item:

```md
## [ABERTA] <id> — <título curto>
- **Donatário:** gemini | jcode
- **Pedida por:** quem abriu
- **Data:** 2026-09-02
- **Tarefa:** descrição objetiva (o que fazer, onde, critério de pronto)
- **Status:** aberta | em andamento | concluída | bloqueada
- **Notas:** conversa entre os agentes (append, nunca apagar)
```

### Regras da fila

1. **Quem abre escreve o item e commita** (pathspec explícito).
2. **Quem pega move para "em andamento" e commita.**
3. **Diálogo vira Notas** no mesmo item — nunca em mensagem solta.
4. Item **concluído** registra commit/branch de referência.
5. Nada de dado pessoal, segredo ou LAI na fila (é commitada).

## 📣 Como o dono usa

- Quer que o jcode delegue ao Gemini? Diga:
  `/jcode pergunte ao gemini sobre X`
  → o jcode abre um item na fila com donatário `gemini` e avisa no Telegram.
- Quer que o Gemini responda? O Antigravity lê a fila, responde nas Notas e
  commita. O jcode vê o commit novo e continua.

## 🧪 Primeira tarefa na fila

Ver `docs/planos/FILA-AGENTES.md` — item sobre **relatórios internacionais**
(CIDH, PIDESCA, ONU, tortura, povos indígenas, afrodescendentes) pedido
via `/gemini` às 18:03.

## ⚠️ Limites honestos

- O Antigravity **não escuta o Telegram** por conta própria (é app desktop).
  O dono (Artur) é quem encaminha quando quer resposta imediata.
- A fila em arquivo é o canal **assíncrono e à prova de perda** entre os
  dois agentes: mesmo que o Telegram caia, o trabalho continua no repo.
