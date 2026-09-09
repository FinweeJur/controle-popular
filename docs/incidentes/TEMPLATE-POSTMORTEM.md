# Postmortem — TEMPLATE (sem culpados)

> **Tipo:** POSTMORTEM
> **Domínio:** operação do projeto
> **Última medição:** 2026-09-09
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [PLANO-RESILIENCIA-BOTS](../planos/PLANO-RESILIENCIA-BOTS.md), [OPERACAO](../05-operacao/OPERACAO.md)
> **Palavras-chave:** incidente, postmortem, mitigação, causa, ação

## Sumário

- [O que aconteceu](#o-que-aconteceu)
- [Impacto (medido)](#impacto-medido)
- [Causa](#causa)
- [Mitigação (o que foi feito na hora)](#mitigação)
- [Ação concreta](#ação-concreta)
- [O que deu certo](#o-que-deu-certo)
- [Lição de uma linha](#lição-de-uma-linha)

Regra (Google SRE, "Postmortem Culture"): postmortem **sem culpados**, escrito
enquanto a memória está fresca, com **uma ação concreta** no fim — a ação vira
item da fila, não promessa solta. Ordem de responder a incidente: **mitigar
primeiro, entender depois**.

## O que aconteceu

(2–3 frases, oração direta. Quando começou, quando foi detectado, quem
detectou.)

## Impacto (medido)

(Números: quanto tempo fora, quantas páginas afetadas, perda de dado de
rodada. Sem estimativa solta — número medido.)

## Causa

(A causa técnica. Se a cadeia for longa, listar em ordem.)

## Mitigação (o que foi feito na hora)

## Ação concreta

(UMA ação — arquivo/rota/tarefa — e o estado dela: ✅ feito / 🚧 fila.
Se precisar de mais de uma, abra um postmortem de follow-up.)

## O que deu certo

## Lição de uma linha

(Uma frase. É ela que entra no AGENTS.md se for regra, não a história toda.)
