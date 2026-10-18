# Prompt para sessão nova — achar o caminho

> **Tipo:** DESENVOLVIMENTO
> **Domínio:** global (checkout canônico, sessão nova, agentes e ferramentas)
> **Última medição:** 2026-10-18
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [CHECKOUT-CANONICO.md](CHECKOUT-CANONICO.md), [AGENTS.md](/AGENTS.md), [DESENVOLVIMENTO.md](DESENVOLVIMENTO.md), [../02-estado/RELATORIOS-AGENTES.md](../02-estado/RELATORIOS-AGENTES.md), [../02-estado/RADAR-HOTSPOTS.md](../02-estado/RADAR-HOTSPOTS.md)
> **Palavras-chave:** prompt, sessao-nova, handoff, checkout, canonico, worktree, archive, mausbot, telegram, opencode

## Sumário

- [Propósito](#propósito)
- [Prompt longo](#prompt-longo)
- [Prompt curto](#prompt-curto)
- [Quando usar](#quando-usar)
- [Decisões registradas](#decisões-registradas)

## Propósito

Colocar qualquer sessão nova no caminho certo em menos de um minuto. Serve
para opencode, MausBot, Hermes, Telegram ou qualquer agente que abra o
repositório em `X:\DevCoder`.

O prompt não substitui o [AGENTS.md](/AGENTS.md) nem o
[CHECKOUT-CANONICO.md](CHECKOUT-CANONICO.md); ele só aponta os dois.

## Prompt longo

Copie o bloco abaixo na sessão nova.

```text
Você trabalha no Controle Popular. O código agora mora SÓ em X:\DevCoder.

Canônico desta máquina:
  X:\DevCoder\controle-popular

Leia antes de tocar em qualquer coisa:
  1. X:\DevCoder\controle-popular\AGENTS.md
  2. X:\DevCoder\controle-popular\docs\03-desenvolvimento\CHECKOUT-CANONICO.md
  3. X:\DevCoder\controle-popular\docs\02-estado\ESTADO.md e RADAR-HOTSPOTS.md

Regras:
- Nunca clone nem trabalhe em C:\Users\... (os clones de lá foram removidos em 18/10/2026).
- Home-pc é a única exceção: lá o canônico é C:\DevCoder\controle-popular (máquina sem X:).
- Sessão nova: cd X:\DevCoder\controle-popular; git fetch; git status -sb; git worktree list.
- 2+ sessões: worktree em .claude\worktrees\<nome> -b <nome> origin/main, com porta própria.
- Worktree concluída: git push origin refs/heads/<branch>:refs/heads/archive/<AAAA-MM-DD>/<branch>,
  depois git worktree remove, git branch -D e git worktree prune.
- As 9 worktrees antigas já foram arquivadas em origin/archive/2026-10-18/*.
- Commit por pathspec, mensagem em arquivo (-F), trailer com modelo e plataforma. Push com fetch + rebase. --force nunca.
- Não mexa no trabalho de outra sessão.

Agentes e ferramentas:
- MausBot instalado em X:\DevCoder\OpenMausBot.
- Data dir do MausBot: X:\DevCoder\OpenMausBotData, via variável OMB_DATA_DIR.
- Estado antigo do MausBot ficou em C:\Users\teste\.openmausbot, travado pelo Bitdefender;
  não leia nem mova sem a exceção de antivírus.
- Skill /cp e docs apontam o canônico.

Se travar, o primeiro lugar é docs\03-desenvolvimento\CHECKOUT-CANONICO.md.
```

## Prompt curto

Para Telegram, soul de bot ou mensagem de 3 linhas.

```text
Código do Controle Popular só em X:\DevCoder\controle-popular.
Nunca em C:\Users. Worktree só em .claude\worktrees.
Concluiu: push para origin/archive/<data>/<branch> e remove.
MausBot em X:\DevCoder\OpenMausBot, dados em X:\DevCoder\OpenMausBotData.
Canônico no home-pc: C:\DevCoder\controle-popular.
Detalhe: docs\03-desenvolvimento\CHECKOUT-CANONICO.md.
```

## Quando usar

- Abrir sessão nova em qualquer ferramenta.
- Colar no MausBot ao criar um bot de código.
- Anexar ao aviso de handoff no Telegram.
- Explicar o caminho para quem chegou depois da consolidação de 18/10/2026.

## Decisões registradas

1. **18/10/2026 — prompt versionado.** O caminho canônico passa a ter um texto
   pronto, em vez de depender de memória de sessão.
2. **18/10/2026 — dois tamanhos.** Longo para agente; curto para Telegram e
   soul de bot.
3. **18/10/2026 — o prompt aponta, não decide.** A regra mora no AGENTS e no
   CHECKOUT-CANONICO.
