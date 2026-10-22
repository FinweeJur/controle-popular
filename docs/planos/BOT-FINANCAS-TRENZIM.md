# Trenzim — bot de finanças pessoais

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-10-19
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [SECRETARIA-PESSOAL.md](SECRETARIA-PESSOAL.md), [RELATORIO-DETERMINISTICO.md](RELATORIO-DETERMINISTICO.md), [ACESSO-REMOTO-E-HOME-PC.md](ACESSO-REMOTO-E-HOME-PC.md)
> **Palavras-chave:** financas, trenzim, assinaturas, boletos, categorizacao, planilha, nota-fiscal, google-drive, ollama, privacidade, whatsapp, telegram

## Sumário

- [Propósito](#propósito)
- [Arquitetura](#arquitetura)
- [Por que o chat não roda em modelo local](#por-que-o-chat-não-roda-em-modelo-local)
- [O que o bot faz](#o-que-o-bot-faz)
- [Canais](#canais)
- [Regras de privacidade](#regras-de-privacidade)
- [Etapas](#etapas)
- [Pendências](#pendências)

## Propósito

Um bot só de finanças pessoais do dono: analisa assinaturas, boletos, contas
repetitivas e séries de gasto; categoriza; monta planilha; divide gastos com
uma segunda pessoa; lê foto de nota fiscal; guarda documento local e depois
no Drive; e responde por comando no WhatsApp e no Telegram.

## Arquitetura

| Peça | Onde | Papel |
|---|---|---|
| Bot **Financas** (apelido Trenzim) | OpenMausBot | conversa, comandos e resumo |
| Grupo WhatsApp **Trenzim** | `120363413236170033@g.us` | canal de comando e resposta |
| Serviço WhatsApp (Baileys) | `X:\DevCoder\openwa-bot-teste` | recebe o comando e devolve a resposta |
| Scripts de finanças | `scripts/financas/` (a criar) | **processam o dado sensível local** |
| Documentos | pasta local primeiro | depois Google Drive, com aprovação |

## Por que o chat não roda em modelo local

Medido em 18-19/10/2026: o modelo local não segura o protocolo de agente do
MausBot — `ollama/qwen2.5:3b` e `ollama/qwen3-vl:4b` devolveram
`empty response` e `HTTP 500`; o `qwen3:8b` roda a 0,8 tok/s (inviável).

Decisão: **o chat usa `sabiazinho-4-br-sp` (Maritaca, Brasil)** e o **dado
sensível nunca vai para o modelo**. Quem lê extrato, categoriza, monta
planilha e lê nota fiscal são **scripts locais**; o modelo só recebe o
resumo já pronto e formata a resposta. Privacidade fica no processamento,
que é onde o dado realmente vive.

## O que o bot faz

1. **Assinaturas e recorrências** — identifica cobrança repetida por
   comerciante e valor, e sugere o que revisar.
2. **Boletos e contas** — lista vencimento, valor e status.
3. **Categorização** — regras fixas por comerciante e palavra-chave, com
   correção do dono gravada para a próxima vez.
4. **Planilha** — CSV e XLSX por mês, com total por categoria.
5. **Divisão de gastos** — entre o dono e mais uma pessoa, com o critério
   combinado (meio a meio, por renda ou por item).
6. **Nota fiscal** — lê a foto, extrai comerciante, valor e data, guarda o
   arquivo local e depois no Drive.
7. **Análise** — para onde vai o dinheiro, o que subiu, o que dá para cortar.

## Canais

| Canal | Como |
|---|---|
| WhatsApp | grupo **Trenzim** — o dono digita, a resposta volta no grupo |
| Telegram | mesmo bot, pelo `@HermeszinBRbot` |

A ponte dos dois canais é a mesma: mensagem do dono → bot Financas → resposta
no canal de origem. Só o dono é atendido; mensagem de terceiro é ignorada.

## Regras de privacidade

- Dado bancário, boleto, nota e gasto **não sai da máquina**.
- Nenhuma senha, token, agência ou cartão no chat, no soul, em log ou print.
- Envio externo (Drive, e-mail) sempre com card de aprovação.
- O bot **nunca movimenta dinheiro**, nunca paga, nunca assina.
- Número vem do dado: sem estimativa, sem arredondamento, sem invenção.

## Etapas

1. `scripts/financas/` — leitor de extrato (CSV/OFX), categorizador por
   regra e gerador de planilha. Local, sem LLM.
2. Comandos no grupo: `resumo`, `assinaturas`, `categoria <termo> <cat>`,
   `dividir`, `nota` (foto).
3. Leitura de nota fiscal: OCR local (mesma linha do faster-whisper, com
   modelo de visão) e arquivo salvo em pasta local.
4. Upload para o Google Drive com aprovação (reusa o OAuth da Secretaria,
   com escopo `drive.file`).
5. Ponte do Telegram com o mesmo roteamento do grupo.
6. Primeira medição real registrada neste documento.

## Pendências

- [ ] Criar `scripts/financas/` e o primeiro comando (`resumo`).
- [ ] Escopo do Drive no OAuth (hoje só Gmail e Agenda).
- [ ] Definir o critério de divisão de gastos com a segunda pessoa.
- [ ] Confirmar no celular o grupo Trenzim respondendo.
