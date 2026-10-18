# Soul de bot de código — Dev e EstrelaQueBrilha

> **Tipo:** DESENVOLVIMENTO
> **Domínio:** global (MausBot, agentes, soul curto)
> **Última medição:** 2026-10-18
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [PROMPT-SESSAO-NOVA.md](PROMPT-SESSAO-NOVA.md), [CHECKOUT-CANONICO.md](CHECKOUT-CANONICO.md), [AGENTS.md](/AGENTS.md), [../02-estado/ESTADO.md](../02-estado/ESTADO.md), [../02-estado/RADAR-HOTSPOTS.md](../02-estado/RADAR-HOTSPOTS.md)
> **Palavras-chave:** soul, mausbot, dev, estrelaquebrilha, canonical, checkout, worktree, prompt

## Sumário

- [Propósito](#propósito)
- [Soul](#soul)
- [O que fica fora, de propósito](#o-que-fica-fora-de-propósito)
- [Como aplicar](#como-aplicar)
- [Decisões registradas](#decisões-registradas)

## Propósito

Guardar o **soul curto** do bot que executa código. Soul é lido a cada turno:
o que muda (fila, hotspots, medições) mora em documento e é lido sob demanda.
O soul só carrega o estável: caminho canônico, arquivos de entrada e regras
de commit.

## Soul

```text
Dev CP - executor do Controle Popular.
Antes de agir, leia:
  X:\DevCoder\controle-popular\AGENTS.md
  X:\DevCoder\controle-popular\docs\03-desenvolvimento\CHECKOUT-CANONICO.md
  X:\DevCoder\controle-popular\docs\02-estado\ESTADO.md
Codigo so em X:\DevCoder\controle-popular. Nunca C:\Users.
Worktree em .claude\worktrees; concluiu, push para origin/archive/<data>/<branch> e remove.
Commit por pathspec, mensagem em arquivo (-F), trailer modelo+plataforma; fetch + rebase no push; --force nunca.
Deploy so com ordem do dono.
Fila e hotspots: ESTADO.md e RADAR-HOTSPOTS.md.
Frases ate 13 palavras. Ultima linha = proximo passo.
```

## O que fica fora, de propósito

- Caminhos do Bitdefender e arquivos travados.
- Comandos do MausBot (`OMB_DATA_DIR`, logs).
- Histórico de clones e worktrees arquivadas.
- Fila viva e hotspots (mudam toda hora).

Isso está no [CHECKOUT-CANONICO.md](CHECKOUT-CANONICO.md),
no [PROMPT-SESSAO-NOVA.md](PROMPT-SESSAO-NOVA.md) e no
[ESTADO.md](../02-estado/ESTADO.md).

## Como aplicar

1. Pare o MausBot para liberar `bots.json`.
2. Edite o soul dos bots **Dev** e **EstrelaQueBrilha** em
   `X:\DevCoder\OpenMausBotData\bots.json`.
3. Recalcule `soulHash` (sha256 do texto do soul).
4. Reabra o MausBot.

## Decisões registradas

1. **18/10/2026 — soul curto.** O prompt comprido vira documento; o soul
   aponta o caminho em vez de repetir o conteúdo.
2. **18/10/2026 — ler antes de agir.** O soul manda abrir AGENTS,
   CHECKOUT-CANONICO e ESTADO, em vez de carregar tudo no contexto.
3. **18/10/2026 — mesmo soul para Dev e EstrelaQueBrilha.** Um é executores,
   o outro coordena; as regras de caminho e commit são as mesmas.
