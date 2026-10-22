# Pendências dos agentes — 19/10/2026

> **Tipo:** ESTADO
> **Domínio:** global
> **Última medição:** 2026-10-19
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [SECRETARIA-PESSOAL.md](SECRETARIA-PESSOAL.md), [BOT-FINANCAS-TRENZIM.md](BOT-FINANCAS-TRENZIM.md), [RELATORIO-DETERMINISTICO.md](RELATORIO-DETERMINISTICO.md), [ACESSO-REMOTO-E-HOME-PC.md](ACESSO-REMOTO-E-HOME-PC.md)
> **Palavras-chave:** pendencias, agentes, mausbot, whatsapp, telegram, financas, drive, home-pc, oauth, turbo

## Sumário

- [Modo turbo (aplicado em 19/10/2026)](#modo-turbo-aplicado-em-19102026)
- [Em aberto](#em-aberto)
- [Resolvido em 19/10/2026](#resolvido-em-19102026)

## Modo turbo (aplicado em 19/10/2026)

Todos os bots rodam com **aprovação full**. As quatro travas vivem no soul de
cada um e valem mesmo em turbo:

1. **Nunca paga, transfere ou movimenta dinheiro** sem autorização expressa
   do dono, caso a caso.
2. **Nunca envia e-mail** sem o dono autorizar aquela mensagem.
3. **Nunca envia mensagem no WhatsApp** sem o dono autorizar.
4. **Instagram:** direct apenas na automação de quem comenta pedindo algo na
   DM.

Fora disso, autonomia ampla: não pede permissão à toa.

## Em aberto

### Finanças (Trenzim)
- [ ] `scripts/financas/` — leitor de extrato (CSV/OFX), categorizador por
      regra e gerador de planilha (CSV e XLSX). Local, sem LLM.
- [ ] Comandos no grupo: `resumo`, `assinaturas`, `categoria <termo> <cat>`,
      `dividir`, `nota`.
- [ ] Leitura de nota fiscal: OCR local e arquivo salvo em pasta local.
- [ ] Upload para o Google Drive com aprovação (escopo `drive.file`, reusa o
      OAuth da Secretaria).
- [ ] Definir o critério de divisão de gastos com a segunda pessoa.

### Canais
- [ ] **Ponte de entrada do Telegram** — hoje só a saída do relatório está
      ligada; falta receber comando e responder no chat.
- [ ] Testar os grupos **OpenSecretario** e **Trenzim** no celular.

### Dados e acessos
- [ ] Segunda conta Google da Secretaria (usuário de teste + autenticar).
- [ ] Google Tasks para os prazos reais (hoje é `prazos.json`).
- [ ] Reautenticação do Google a cada 7 dias (app em modo Teste).

### Infra
- [ ] Migrar a sede para o **home-pc** (plano ACESSO-REMOTO-E-HOME-PC.md).
- [ ] Avaliar Baileys × whatsmeow para o longo prazo no WhatsApp.

## Resolvido em 19/10/2026

- Serviço de WhatsApp trocado para **Baileys** (o `whatsapp-web.js` quebrou
  contra o WhatsApp Web atual).
- Grupos de comando criados: **OpenSecretario** (Secretaria) e **Trenzim**
  (Financas), com resposta no próprio grupo.
- Relatório diário determinístico com entrega no Telegram às 19:45.
- Transcrição de áudio offline (faster-whisper) e menções diretas em grupo.
- Token do Telegram gravado (hermeszin BR) e entrega testada.
