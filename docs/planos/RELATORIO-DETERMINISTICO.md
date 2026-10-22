# Relatório diário determinístico da Secretária

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-10-18
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [SECRETARIA-PESSOAL.md](SECRETARIA-PESSOAL.md), [ACESSO-REMOTO-E-HOME-PC.md](ACESSO-REMOTO-E-HOME-PC.md), [REGRAS-DURAS.md](../03-desenvolvimento/REGRAS-DURAS.md)
> **Palavras-chave:** relatorio, determinismo, sem-llm, gmail, agenda, whatsapp, prazos, telegram, task-scheduler, soberania, secretaria

## Sumário

- [Por que determinístico](#por-que-determinístico)
- [Arquitetura](#arquitetura)
- [Campos de cada linha](#campos-de-cada-linha-especificação-do-dono-18102026)
- [Estilo da saída](#estilo-da-saída-regra-do-dono-18102026)
- [Revisão por LLM](#revisão-por-llm-opcional-nunca-obrigatória)
- [Os quatro blocos, bloco a bloco](#os-quatro-blocos-bloco-a-bloco)
- [Onde estão os prazos](#onde-estão-os-prazos)
- [Entrega e agendamento](#entrega-e-agendamento)
- [Regras que não se negociam](#regras-que-não-se-negociam)
- [Critérios de aceite](#critérios-de-aceite)
- [Etapas](#etapas)
- [Riscos medidos e mitigação](#riscos-medidos-e-mitigação)

## Por que determinístico

Medido em 18/10/2026: o modelo local **não segura o protocolo do agente** —
OpenCode com provider Ollama devolveu `404`; o engine OpenAI-compatible
devolveu `empty response` (3B) e `HTTP 500` (4B). E o modelo na nuvem obriga
a mandar caixa de entrada para terceiro, contra a regra de soberania.

O relatório não precisa de modelo: são **quatro listas com regra clara**. Se
o dado está no Gmail, na Agenda e no WhatsApp, um script monta o relatório
inteiro, local, em segundos, sem custo e sem nuvem.

## Arquitetura

```
coletar-google.py   -> agenda + Gmail (JSON)   [existe]
servico WhatsApp    -> conversas 24h (JSON)    [existe, 127.0.0.1:8899]
prazos.json         -> tarefas/pagamentos      [novo, arquivo local]
        |
        v
relatorio-diario.py -> 4 blocos em texto/JSON  [novo]
        |
        v
envia-telegram.py   -> mensagem no celular     [existe]
```

- **Sem LLM em nenhum ponto.** Nada de nuvem, nada de token.
- O bot Secretária continua existindo para **perguntas**, não para o
  relatório: o relatório vira script agendado.

## Campos de cada linha (especificação do dono, 18/10/2026)

**Contato (WhatsApp ou e-mail) — uma linha por contato:**

| Campo | Regra |
|---|---|
| **Nome** | nome do chat (WhatsApp) ou nome de exibição do remetente (Gmail) |
| **Número ou e-mail** | telefone no formato `+55…` (WhatsApp) ou endereço (Gmail) |
| **Data e hora da mensagem** | no fuso `America/Sao_Paulo`; ISO curto (`18/10 20:31`) |
| **Resumo da mensagem** | primeira frase útil, até 120 caracteres; sem opinião |
| **Canal** | `WhatsApp`, `Gmail` ou `WhatsApp+Gmail` quando a mesma pessoa aparece nos dois |
| **Proposta de resposta** | rascunho pronto, por regra fixa (abaixo) — o dono copia ou aprova |

**Evento (Agenda) — uma linha por evento:**

| Campo | Regra |
|---|---|
| **Título** | `summary` do evento |
| **Data e hora** | início (e fim, quando houver), no fuso local |
| **Endereço** | `location`; se vazio, escreve `sem endereço` |
| **Link** | `hangoutLink` ou o primeiro link do campo de descrição, se houver |
| **Dias faltando** | `hoje`, `amanhã` ou `em N dias` |

**Proposta de resposta — regras fixas, sem modelo:**

| Gatilho no texto | Rascunho proposto |
|---|---|
| Termina com `?` ou tem `quando`, `como`, `qual`, `quanto` | "Oi <nome>, recebi sua mensagem sobre <resumo>. Verifico e te respondo hoje." |
| Tem `pagamento`, `vencimento`, `fatura`, `boleto`, `pix` | "Oi <nome>, recebi. Confirmo o <tipo> e te aviso assim que estiver pago." |
| Tem `reunião`, `convite`, `agenda`, `call`, `link` | "Oi <nome>, recebi o convite. Confirmo presença e me organizo para <data/hora>." |
| Tem `urgente`, `hoje`, `agora`, `prazo` | "Oi <nome>, vi sua mensagem e já estou olhando isso." |
| Nenhum dos acima | "Oi <nome>, recebi sua mensagem. Respondo em breve." |

Regra de honestidade: a proposta **não promete o que o dono não disse** — nada
de "está pago", "está resolvido". Ela apenas acusa recebimento e diz o próximo
passo do próprio dono.

**Menção direta em grupo — uma linha por menção (pedido do dono, 18/10/2026):**

| Campo | Regra |
|---|---|
| **Grupo** | nome do grupo |
| **Autor** | quem mencionou |
| **Data e hora** | fuso local |
| **Resumo** | texto da mensagem, ≤120 caracteres |
| **Áudio** | marca `🎙️ audio` quando a menção veio em áudio |
| **Proposta de resposta** | mesma regra fixa dos contatos |

`@all` fica **fora**: só entra menção direta ao número/contato do dono. O
critério é técnico — a menção precisa citar o JID do dono e ter no máximo
cinco citados; menção em massa (todos os participantes, ou o marcador
`0@s.whatsapp.net`) é descartada.

**Áudio recebido — transcrição offline (pedido do dono, 18/10/2026):**

| Etapa | Como |
|---|---|
| Captura | Baileys baixa o áudio da conversa individual e salva em `audios/` |
| Transcrição | `transcrever-audio.py` com **faster-whisper** na CPU (int8), modelo `small`, idioma `pt` |
| Onde roda | **local** — áudio de pessoa é dado pessoal (AGENTS.md §5.15) |
| No relatório | a transcrição substitui o resumo da mensagem e vem marcada com 🎙️ |
| Sem transcrição | o relatório escreve `[audio sem transcricao]` e segue |

Medido em 18/10/2026: áudio de teste gerado com a voz pt-BR do Windows
transcrito como *"Olá Arthur, tudo bem? Preciso confirmar a reunião de
amanhã às 10 horas."* — **exato**. Custo: zero, e nada saiu da máquina.

Por que faster-whisper e não o Ollama: o Ollama não faz reconhecimento de
fala. Sabiá e DeepSeek são modelos de texto e não aceitam áudio. A alternativa
na nuvem (GLM-ASR, da Z.AI) é barata, mas mandaria voz de terceiro para fora —
o que a regra de soberania proíbe. A transcrição fica local.

## Estilo da saída (regra do dono, 18/10/2026)

O relatório é lido no celular, muitas vezes sob pressão. O texto obedece à
regra de fala do AGENTS.md §12 e a três exigências extras:

- **Quebra de linha sempre:** um campo por linha; nunca um parágrafo compacto.
- **Frase curta e oração direta:** no máximo 13 palavras; ordem
  sujeito → verbo → objeto ("Maria escreveu hoje às 20h31").
- **Emoji ligado ao tema**, nunca decorativo:

| Emoji | Onde |
|---|---|
| 📅 | bloco AGENDA |
| 📩 | bloco CONTATOS |
| ⏰ | bloco PRAZOS |
| 💡 | bloco SUGESTÕES |
| 💬 / ✉️ | canal WhatsApp / canal Gmail |
| 📍 | endereço do evento |
| 🔗 | link do evento |
| 💰 | pagamento, fatura, boleto |
| 🔥 | urgente ou vence hoje |
| ✅ / ⚠️ / ❌ | ok, atenção, falha na coleta |

- **Português correto:** concordância verbal e nominal, acentuação e crase
  conforme a norma. O gerador escreve certo por construção; o revisor confere.

## Revisão por LLM (opcional, nunca obrigatória)

O relatório **nasce pronto e correto** sem modelo. A revisão por IA é uma
segunda passada, ligada por `--revisar`, para melhorar ritmo, emoji e
clareza — jamais para criar fato.

| Regra | Detalhe |
|---|---|
| Quando liga | só com `--revisar`; desligada por padrão |
| Onde roda | **modelo local (Ollama)** — o relatório tem dado pessoal |
| O que pode | reescrever frase, quebrar linha, trocar emoji, corrigir gramática |
| O que não pode | mudar número, nome, data, hora, endereço ou valor; inventar fato; opinar |
| Trava | antes/depois passam por um **diferenças de fatos**: todo número, nome, data e endereço do original precisa reaparecer no texto revisado; faltando um, a revisão é descartada e vale o original |
| Registro | a saída diz se foi revisada, por qual modelo e a hora |

Assim o dado nunca depende do humor do modelo: se a revisão falhar, o dono
recebe o relatório determinístico, que é a fonte da verdade.

## Os quatro blocos, bloco a bloco

1. **AGENDA** — eventos de hoje e dos próximos 7 dias, agrupados por dia,
   ordenados por hora, com link quando houver. Fonte: Calendar (por conta).
2. **CONTATOS** — quem procurou o dono: no Gmail (remetente, assunto, se está
   não lido) e no WhatsApp (conversas individuais, recebidas em 24 h, não
   lidas). Uma linha por pessoa; a mesma pessoa em dois canais aparece uma vez
   só, com a marca dos dois.
3. **PRAZOS** — o que vence em até 7 dias, em ordem de data.
4. **SUGESTÕES** — regras fixas, sem julgamento: e-mail não lido de pessoa
   física sugere resposta; conversa de WhatsApp que termina em pergunta sugere
   resposta; pagamento em até 3 dias sugere lembrete; evento de amanhã sem
   link sugere confirmar local.

## Onde estão os prazos

Não há fonte pronta hoje. Três degraus, do mais simples ao mais completo:

1. **`prazos.json` local** (começar aqui): lista de `{titulo, data, valor?,
   tipo}` que o dono edita ou que a Secretária escreve quando ele manda.
2. **Heurística na Agenda**: evento cujo título tem `pagamento`, `vencimento`,
   `fatura`, `imposto` ou `prazo` entra no bloco 3 com o valor no título, se
   houver.
3. **Google Tasks** (evolução): escopo `tasks.readonly` e a lista real de
   tarefas do dono. Fica para a segunda fase.

## Entrega e agendamento

- O script imprime texto pronto (e `--json` para máquina).
- A entrega é no **Telegram**, pelo script que já existe no ecossistema, lendo
  o token do arquivo local — nunca impresso.
- Agendamento por **Task Scheduler**, não pela rotina do MausBot: assim não
  depende de card de aprovação nem do app aberto. No home-pc é o lugar certo
  (24×7). Horário: **19:45**, o mesmo já combinado.
- Se o dono quiser, o mesmo script roda sob demanda: `python
  scripts/secretaria/relatorio-diario.py`.

## Regras que não se negociam

- **Sem LLM**: nenhuma chamada de modelo em nenhum bloco.
- **Nada sai da máquina**, exceto a mensagem final no Telegram (que é do
  próprio dono).
- **Falha declarada**: sem dado, escreve `sem dado` com a data da leitura —
  nunca inventa compromisso.
- **Fonte visível**: cada bloco diz de onde veio e a hora da leitura.
- **Nada de julgamento**: o script ordena, agrupa e conta; quem decide é o dono.
- **Segredo nunca em log** (AGENTS.md §5.8).

## Critérios de aceite

1. Roda em **menos de 10 segundos** com rede normal.
2. Sai **até 20 linhas**, sempre com os 4 blocos, mesmo vazios.
3. Bloco vazio diz `sem dado` com a data.
4. Funciona com **1 ou 2 contas** Google.
5. WhatsApp fora do ar não derruba o relatório: bloco 2 avisa que o serviço
   caiu e segue.
6. Testável com fixtures: nenhum teste toca a rede.
7. Estilo conferido: uma ideia por linha, frase ≤13 palavras, emoji do tema.
8. Com `--revisar`, a trava de fatos barra qualquer revisão que perca um
   número, nome, data ou endereço.

## Etapas

1. `scripts/secretaria/prazos.json` + leitura no bloco 3 (heurística da Agenda
   incluída).
2. `scripts/secretaria/relatorio-diario.py` — monta os 4 blocos a partir do
   coletor Google e do serviço de WhatsApp.
3. `--json` e testes com fixtures (sem rede).
4. Estilo: quebra de linha, frase curta, SVO, emoji por tema (tabela acima).
5. `--revisar` com modelo local + trava de fatos (diferenças antes/depois).
6. Ligação com o `envia-telegram.py` e teste de ponta a ponta no celular.
7. Tarefa no **Task Scheduler** às 19:45, com log local.
8. Doc atualizado com a primeira medição real.

## Riscos medidos e mitigação

| Risco | Medido em | Mitigação |
|---|---|---|
| Refresh token do Google expira em 7 dias | 18/10/2026 | o script avisa em vermelho no bloco 1 e o dono reautentica |
| WhatsApp 503 quando a sessão cai | 18/10/2026 | bloco 2 degrada com aviso, não derruba |
| Fuso horário | — | converter tudo para `America/Sao_Paulo` na saída |
| Mesma pessoa em Gmail e WhatsApp | — | agrupar por nome/telefone normalizado |
| Script silencioso quebrado | — | log local por execução + aviso no Telegram quando falhar |
