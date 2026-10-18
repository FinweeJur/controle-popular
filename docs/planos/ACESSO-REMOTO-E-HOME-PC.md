# Acesso remoto pelo celular e operação no home-pc

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-10-18
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [SECRETARIA-PESSOAL.md](SECRETARIA-PESSOAL.md), [PLANO-ORQUESTRACAO-AGENTES-V2.md](../historico/planos/PLANO-ORQUESTRACAO-AGENTES-V2.md), [CHECKOUT-CANONICO.md](../03-desenvolvimento/CHECKOUT-CANONICO.md)
> **Palavras-chave:** celular, android, remoto, tailscale, telegram, pareamento, home-pc, 24x7, headless, fila, card, aprovacao

## Sumário

- [Propósito](#propósito)
- [Falar com os bots pelo celular](#falar-com-os-bots-pelo-celular)
- [Comparação dos canais](#comparação-dos-canais)
- [Rodar no home-pc](#rodar-no-home-pc)
- [O que fica no desktop](#o-que-fica-no-desktop)
- [Passo a passo da migração](#passo-a-passo-da-migração)
- [Riscos e cuidados](#riscos-e-cuidados)

## Propósito

Duas necessidades do dono: (1) dar comandos aos bots pelo celular **Android**,
em qualquer lugar; (2) ter o time rodando **principalmente no home-pc**, que
fica ligado quase o tempo todo. O desktop entra como potência (GPU, builds,
Antigravity), não como sede.

Regra que governa a decisão: **a rotina roda dentro do app** (ver a doc de
agendamento do MausBot). Onde o app roda, ali vivem os bots. Logo, para 24×7
de verdade, o workspace precisa morar no home-pc.

## Falar com os bots pelo celular

Três caminhos reais, do mais simples ao mais completo:

1. **Telegram (recomendado como canal principal).** O bot de trabalho é
   long-poll e já existe no ecossistema. O celular manda mensagem, um script
   injeta no MausBot e devolve a resposta no chat. Funciona em qualquer rede,
   é grátis, não depende de pareamento nem de túnel, e o histórico fica no
   Telegram.
2. **App companion do MausBot (Android).** Controle remoto de verdade: ver
   threads, **aprovar cards**, interromper turno. Pareia por link HTTPS
   (quando o relay não está lotado) ou pela rede local/Tailscale. É o único
   canal que mostra card de aprovação com botão.
3. **Tailscale + navegador.** Com o app escutando na interface do Tailscale,
   o celular abre a interface web do MausBot pelo IP `100.x`. Nada passa por
   terceiro; exige o app publicado na rede (hoje ele escuta só em loopback).

**Combinação sugerida:** Telegram para comandar e conversar; app companion (ou
Tailscale) quando precisar **aprovar card** ou ver thread com contexto.

## Comparação dos canais

| Canal | Comando | Card de aprovação | Depende de | Risco |
|---|---|---|---|---|
| Telegram | sim | não (responde no chat) | nada além do token do bot | baixo |
| App companion | sim | **sim** | pareamento (HTTPS/Tailscale) | baixo |
| Tailscale + web | sim | sim | Tailscale ligado nos dois lados | baixo |
| WhatsApp | leitura | não | serviço local | **ban do número** — não usar para comando |

## Rodar no home-pc

O home-pc passa a ser a **sede**: OpenMausBot instalado lá, com
`OMB_DATA_DIR` no disco local, rodando no logon (atalho na pasta Startup).
Como ele fica ligado, as rotinas rodam no horário em vez de depender da
recuperação de 12 h.

Duas formas:

- **App completo (mais simples):** instalar o mesmo instalador do Windows no
  home-pc e subir no logon. Mesma interface, mesmos cards, mesmas rotinas.
- **Servidor headless (`openmausbot serve`):** sem janela, para máquina que
  só serve. Exige parear cada cliente (celular, desktop) por código.

Recomendado começar pelo **app completo** — é o caminho já provado nesta
máquina.

## O que fica no desktop

| Papel | Fica no desktop? |
|---|---|
| Ollama com GPU (Secretária, triagem local) | sim — é a máquina com GPU |
| Builds, testes pesados, `npm test` | sim |
| Antigravity / Gemini (Trator de tokens) | sim |
| Rotinas de marketing, atendimento, secretaria | **não** — vão para o home-pc |
| Serviço de WhatsApp | decidir: onde o celular estiver emparelhado |

## Passo a passo da migração

1. **Instalar** OpenMausBot no home-pc; definir `OMB_DATA_DIR`
   (ex.: `C:\DevCoder\OpenMausBotData`) e criar o atalho de logon.
2. **Levar o time:** copiar `team.yaml` + os `souls` e rodar
   `openmausbot team apply` no home-pc (a CLI aplica o mesmo time).
3. **Recriar as rotinas** no home-pc (mesmos horários e textos).
4. **Credenciais:** repetir o OAuth do Google no home-pc (`autenticar-google.py`)
   e gravar `ZAI_API_KEY` e `SIMPLEANALYTICS_API_KEY` no ambiente de lá.
5. **WhatsApp:** reescanear o QR no home-pc (a sessão não é portável sem
   copiar `.wwebjs_auth`, e o número só aceita um aparelho conectado por vez).
6. **Celular:** parear o app companion (HTTPS ou Tailscale) e/ou apontar o
   bot do Telegram para o workspace novo.
7. **Fila:** manter a fila viva como fonte de verdade entre as duas máquinas;
   o desktop puxa o que exige GPU.
8. **Validar:** rodar a rotina da Secretária uma vez e conferir o relatório
   de 4 blocos chegando no celular.

## Riscos e cuidados

- **Dois workspaces = dois times.** Enquanto houver bots nos dois PCs, alguém
  precisa saber qual é a sede (aqui: home-pc) para não duplicar resposta.
- **WhatsApp tem dono único.** Um número, uma sessão: ou o desktop ou o
  home-pc. Escolher um.
- **Dado pessoal no home-pc.** A Secretária roda com modelo local; o home-pc
  precisa de Ollama instalado (ou usa a API BR só para texto não sensível).
- **Segredo não viaja por chat.** Chave e token vão por arquivo local e
  `setx`, nunca colados em conversa (AGENTS.md §5.8).
- **Cota de build.** Migrar o app não muda a regra de deploy: publicar só
  com pedido do dono.
