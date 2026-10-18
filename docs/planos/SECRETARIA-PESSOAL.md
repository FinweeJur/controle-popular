# Secretária pessoal — desenho e operação

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-10-18
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [MODELOS-LOCAIS-AVALIACAO.md](../historico/planos/MODELOS-LOCAIS-AVALIACAO.md), [PLANO-ORQUESTRACAO-AGENTES-V2.md](../historico/planos/PLANO-ORQUESTRACAO-AGENTES-V2.md)
> **Palavras-chave:** secretaria, gmail, google-agenda, oauth, whatsapp, whatsapp-web-js, openwa, ollama, qwen3, sabiazinho, soberania, rotina, prazos

## Sumário

- [Propósito](#propósito)
- [Arquitetura](#arquitetura)
- [Gmail e Agenda (OAuth)](#gmail-e-agenda-oauth)
- [WhatsApp contínuo](#whatsapp-contínuo)
- [Relatório diário](#relatório-diário)
- [Regras de privacidade](#regras-de-privacidade)
- [Pendências](#pendências)
- [Decisões registradas](#decisões-registradas)

## Propósito

Uma única bot — a **Secretária** — cuida dos assuntos pessoais do dono:
tarefas, eventos, rotina e finanças. Nenhum outro bot do time acessa Gmail,
Agenda ou WhatsApp. O relatório diário responde quatro perguntas: reuniões,
quem procurou o dono, prazos próximos e o que dá para automatizar.

## Arquitetura

| Peça | Onde | Papel |
|---|---|---|
| Bot **Secretária** | OpenMausBot (room `Pessoal`) | resume e avisa; nunca envia sozinha |
| Modelo | `ollama::qwen3:8b` (local) | dado sensível não sai da máquina |
| Fallback | `maritacaai/sabiazinho-4-br-sp` (BR) | quando o local não dá conta |
| Coletor Google | `scripts/secretaria/coletar-google.py` | agenda + Gmail em JSON |
| Serviço WhatsApp | `X:\DevCoder\openwa-bot-teste\servidor-whatsapp.js` | sessão viva, só leitura, `127.0.0.1:8899` |
| Rotina | 19:45, todos os dias | dispara o relatório no app |

## Gmail e Agenda (OAuth)

- Cliente OAuth do tipo **App para desktop**, no projeto Google Cloud do dono.
- Tela de consentimento em **Externo + usuários de teste** (a conta é Gmail
  pessoal; modo "Interno" bloqueia com `org_internal`).
- Escopos mínimos: `gmail.readonly`, `gmail.compose`, `calendar.readonly`.
  Não pedimos `gmail.send`: envio continua manual, com card de aprovação.
- Tokens em `C:\Users\teste\.config\mausbot\google\token-<conta>.json`, fora de
  qualquer repositório, com permissão só do usuário.
- Autenticar: `python scripts/secretaria/autenticar-google.py --conta pessoal`.
- **Medido em 18/10/2026:** conta `pessoal` autenticada; Gmail respondeu com
  14.329 mensagens; a Calendar API precisou ser habilitada no projeto e passou
  a responder depois disso.
- **Atenção:** app em modo Teste com conta externa dá refresh token que
  **expira em 7 dias**. Publicar exigiria verificação do Google (escopo de
  Gmail é restrito). Enquanto isso: reautenticar quando a rotina avisar.

## WhatsApp contínuo

O dono pediu uso **contínuo**, não coleta agendada. Por isso existe um
serviço que mantém a sessão viva e responde perguntas:

| Endpoint | O que devolve |
|---|---|
| `GET /status` | `{pronto, conta}` |
| `GET /conversas?horas=24&limite=25` | conversas **individuais** com mensagem recebida na janela |
| `GET /mensagens?numero=...&limite=20` | últimas mensagens daquela conversa |

- Base: `whatsapp-web.js` (API não oficial) com a sessão `.wwebjs_auth`.
- **Só leitura.** Nenhuma rota envia mensagem; envio é manual, com aprovação.
- Escuta apenas em `127.0.0.1` — o dado pessoal não sai da máquina.
- Grupos ficam fora.
- Autostart: atalho `WhatsApp-Secretaria.lnk` na pasta Startup chama
  `iniciar-servico.vbs`, que roda o serviço sem janela.
- **Medido em 18/10/2026:** sessão reconectada por QR; `/status` devolveu
  `{"pronto":true,"conta":"553175709609"}`.
- Risco conhecido: automação de WhatsApp Web pode levar bloqueio do número.
  Mitigação: uso pessoal, sem disparo em massa, somente leitura.

## Relatório diário

Rotina do app às **19:45** (fora do horário de pico das APIs pagas), em quatro
blocos, no máximo 12 linhas:

1. **AGENDA** — reuniões de hoje e da semana, com data, hora e quem.
2. **CONTATOS** — quem procurou o dono no Gmail e no WhatsApp individual,
   uma linha por pessoa.
3. **PRAZOS** — tarefas, eventos e pagamentos que vencem em até 7 dias.
4. **SUGESTÕES** — 2 a 3 respostas ou automações prontas para aprovar.

Sem dado, escreve "sem dado" com a data da leitura. Nunca inventa compromisso.

## Regras de privacidade

- Dado pessoal fica na máquina: o resumo roda em modelo local (AGENTS.md §5.15).
- Nenhum bot além da Secretária lê Gmail, Agenda ou WhatsApp.
- A Secretária nunca movimenta dinheiro, nunca paga, nunca assina.
- Toda ação externa (enviar, criar evento, responder) tem card de aprovação.
- Tokens e sessões vivem fora de repositório e nunca aparecem em log (§5.8).

## Pendências

- [ ] **Segunda conta Google** — adicionar como usuário de teste e rodar
      `autenticar-google.py --conta <rotulo>`.
- [ ] **Exclusões do Bitdefender** — o antivírus voltou a travar o rename de
      `C:\Users\teste\.openmausbot\sessions.json` (EPERM); sem isso a alma da
      Secretária não salva. Pastas: `.openmausbot`, `openwa-bot-teste`,
      `C:\nodejs`, `Programs\OpenMausBot`; apps: `node.exe`, `chrome.exe`.
- [ ] **Reautenticação semanal** — rotina/aviso quando o refresh token de 7
      dias expirar.
- [ ] **PicoClaw / Cutiazinha** — avaliar como alternativa ao serviço atual de
      WhatsApp (whatsmeow nativo, ~10 MB, MCP) e como assistente leve 24/7.

## Decisões registradas

1. **2026-10-18 — Só a Secretária usa modelo local.** Os demais bots ficam
   como estão; o pedido do dono foi explícito.
2. **2026-10-18 — WhatsApp por serviço contínuo, não por coleta.** O dono
   quer consulta sob demanda; o serviço mantém a sessão e responde em JSON.
3. **2026-10-18 — Sabiazinho-4-br-sp como fallback.** Modelo brasileiro cobre
   o local quando ele falha ou não dá conta.
4. **2026-10-18 — Envio nunca automático.** Nem e-mail, nem WhatsApp: o bot
   rascunha, o dono aprova, o dono envia.
