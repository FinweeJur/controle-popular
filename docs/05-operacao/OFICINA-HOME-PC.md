# OFICINA — o `home-pc` que trabalha sozinho, no hardware que ele tem

> **Tipo:** OPERACAO
> **Domínio:** global
> **Última medição:** 2026-09-30
> **Leitura estimada:** curta (≤ 5 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [PLANO-AUTOMACAO-LOCAL.md](PLANO-AUTOMACAO-LOCAL.md), [ESTADO.md](../02-estado/ESTADO.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [FONTES.md](../06-fontes/FONTES.md), [PLANO-ECOSSISTEMA-CIVICO.md](../planos/PLANO-ECOSSISTEMA-CIVICO.md)
> **Palavras-chave:** oficina, home-pc, ollama, picoclaw, colibri, automacao, perfil, hardware, modelos locais, privacidade

## Sumário

- [Propósito](#propósito)
- [O que a oficina faz](#o-que-a-oficina-faz)
- [Como rodar](#como-rodar)
- [Os três perfis](#os-três-perfis)
- [O que não fazer](#o-que-não-fazer)
- [Ligação com a esteira que já existe](#ligação-com-a-esteira-que-já-existe)
- [Decisões registradas](#decisões-registradas)
- [Origem / Histórico](#origem--histórico)

## Propósito

Dar ao `home-pc` uma **oficina de um comando só**: ela olha o hardware,
escolhe um perfil de modelos locais e diz o que vai fazer — sem travar a
máquina e sem depender de nuvem paga. O `home-pc` é a máquina de produção do
dono e é mais fraca que a de build; a oficina existe para respeitar isso.

## O que a oficina faz

1. Lê RAM, núcleos e presença de GPU (`nvidia-smi`, com tolerância a falha).
2. Escolhe um perfil (`apps/web/lib/oficina/perfis.ts`), do mais conservador
   para o mais forte.
3. Mostra os modelos do Ollama que o perfil precisa.
4. Verifica se o Ollama responde em `127.0.0.1:11434` (timeout curto).
5. Só baixa modelo quando pedido (`--instalar-modelos`).

A inteligência de escolha é **pura e testada**; o comando é a casca.

## Como rodar

```bash
# 1. Provar o encadeamento, sem tocar no Ollama (treino de mesa):
npx tsx scripts/oficina/oficina.mts --simular

# 2. Ver o plano e checar se o Ollama responde:
npx tsx scripts/oficina/oficina.mts

# 3. Baixar os modelos do perfil (precisa do Ollama instalado):
npx tsx scripts/oficina/oficina.mts --instalar-modelos
```

O comando roda **fora da CI**, no `home-pc`. Ele não guarda segredo e não fala
com a internet — só com o Ollama local (ver [AGENTS.md § 5.8](/AGENTS.md)).

## Os três perfis

| Perfil | Quando entra | Modelos | Paralelismo |
|---|---|---|---|
| **Leve** (padrão seguro) | 4–8 GB, ou 16 GB com poucos núcleos, ou sem GPU | `llama3.2:1b`, `nomic-embed-text`, `qwen2.5-coder:1.5b` | 1 |
| **Médio** | 16 GB com 6+ núcleos | `llama3.2:3b`, `nomic-embed-text`, `qwen2.5-coder:1.5b` | 2 |
| **Forte** | GPU **e** 32 GB+ **e** 8+ núcleos | `qwen2.5:7b`, `nomic-embed-text`, `qwen2.5-coder:7b` | 4 |

Medição de 30/09 nesta máquina de build: 16 GB, 16 núcleos, com GPU → perfil
**Médio**. No `home-pc`, mais fraco, o esperado é **Leve** — por isso ele é o
padrão seguro. **Remeça com `--simular` antes de confiar.**

## O que não fazer

- **Não subir de perfil sem medir.** Modelo grande em hardware fraco trava o
  PC inteiro — e o `home-pc` é onde o dono trabalha.
- **Não colocar segredo aqui.** A oficina fala só com o Ollama local.
- **Não rodar na CI.** É máquina de casa, não runner.
- **Não prometer o que o modelo não faz.** Resumo gerado é rotulado com data e
  modelo (regra editorial do [AGENTS.md § 7](/AGENTS.md)).

## Ligação com a esteira que já existe

A oficina **não substitui** a esteira; ela a liga do jeito simples:

- **PicoClaw** (`scripts/agent-tools/picoclaw-source-watcher.mts`) — saúde das fontes;
- **Colibri Bridge** (`scripts/colibri-bridge.mts`) — orquestração local;
- **Ollama** — inferência local, escolhida pelo perfil;
- **Cutiazinha** — daemon leve que dispara as rotinas.

O desenho completo está em [PLANO-AUTOMACAO-LOCAL.md](PLANO-AUTOMACAO-LOCAL.md).
Regra do plano do ecossistema: **o `home-pc` enriquece, não serve** — o pesado
vira dado versionado, e a nuvem nunca depende dele para abrir uma página.

## Decisões registradas

- **Perfil por hardware, com o leve como padrão.** Hardware fraco não erra
  devagar: ele trava. O piso conservador é decisão, não excesso de cautela.
- **Um comando, saída curta em português.** O dono roda sem pensar.
- **Modo `--simular` sem Ollama.** Prova o encadeamento sem gastar a máquina.
- **Lógica pura em `lib/oficina/perfis.ts`.** Testável, sem depender do PC real.
- **Nada de segredo e nada de nuvem.** Só o Ollama local.

## Origem / Histórico

Escrito em 30/09/2026 para atender ao pedido do dono: preparar a oficina na
máquina de build, testar, e rodá-la depois no `home-pc` — que é mais fraco, e
por isso pede simplificação. Dialoga com
[PLANO-AUTOMACAO-LOCAL.md](PLANO-AUTOMACAO-LOCAL.md) e com a "oficina de
bastidores" do [PLANO-ECOSSISTEMA-CIVICO.md](../planos/PLANO-ECOSSISTEMA-CIVICO.md).
