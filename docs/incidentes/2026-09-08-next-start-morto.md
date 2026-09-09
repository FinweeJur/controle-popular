# Postmortem — next start morto, site 502 (08/09/2026)

> **Tipo:** POSTMORTEM
> **Domínio:** operação do projeto
> **Última medição:** 2026-09-09
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [PLANO-RESILIENCIA-BOTS](../planos/PLANO-RESILIENCIA-BOTS.md), [OPERACAO](../05-operacao/OPERACAO.md)
> **Palavras-chave:** incidente, next start, 502, túnel, vigia

## Sumário

- [O que aconteceu](#o-que-aconteceu)
- [Impacto (medido)](#impacto-medido)
- [Causa](#causa)
- [Mitigação (o que foi feito na hora)](#mitigação)
- [Ação concreta](#ação-concreta)
- [O que deu certo](#o-que-deu-certo)
- [Lição de uma linha](#lição-de-uma-linha)

## O que aconteceu

O processo `next start` (porta 3000), que serve o site inteiro pelo túnel da
Cloudflare, morreu em algum momento do dia 08/09. O túnel continuou de pé e
respondeu **502** — o site ficou fora. Foi o **dono** quem percebeu, à noite,
perguntando "por que o site está fora do ar?". Nenhum sistema avisou.

## Impacto (medido)

- Site fora durante horas (início exato desconhecido — é parte do achado)
- Nenhuma perda de dado: coletas e builds não dependem do servidor em pé
- Segunda ocorrência do MESMO modo de falha: 01/09 também foi `next start`
  morto + 502 pelo túnel

## Causa

`next start` era **processo solto**: ninguém o supervisionava, ninguém o
reiniciava, ninguém media sua vida. A rotina local só publicava (e, até
08/09, só via `cf:deploy` do Worker, que nem é o caminho de produção). A
causa da morte em si (OOM? reboot? crash?) ficou indeterminada — e não é o
mais importante: **o que falhou de verdade foi a ausência de supervisor**,
porque a causa técnica pode ser qualquer uma das três.

## Mitigação (o que foi feito na hora)

Reinício manual do servidor na porta 3000; HTTP 200 local e público
confirmados no mesmo dia.

## Ação concreta

- ✅ `scripts/vigia-servidor.mts` — cão de guarda a cada 5 min: reinicia
  (cap de 3/hora) e avisa o Telegram. Tarefa
  `ControlePopular_VigiaServidor_5min`. **Testado em drill real no dia
  09/09:** derrubou-se o servidor de propósito; o vigia restaurou (e o treino
  pegou dois bugs da publicação antes de virarem incêndio).
- ✅ `publicarTunel()` extraída para `scripts/agent-tools/publicar-tunel.mts`,
  usada pela rotina e pelo vigia — uma só implementação da publicação.

## O que deu certo

- A detecção pelo dono foi rápida e sem ruído (a pergunta certa, direto)
- O túnel não caiu — o problema era 100% local e o diagnóstico por camadas
  (502 → porta sem ouvinte → processo morto) levou minutos

## Lição de uma linha

**O processo silencioso é o que morre sem ninguém ver — todo processo que
serve o site tem que ter vigia e heartbeat.**
