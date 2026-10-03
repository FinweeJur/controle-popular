# Plano — Cron, Postgres e manter o RAG "ativo"

> **Tipo:** PLANO
> **Domínio:** global (cron workers, banco, assistente/RAG)
> **Última medição:** 2026-10-03
> **Leitura estimada:** curta (3–6 min)
> **Relacionados:** [OPERACAO.md](../05-operacao/OPERACAO.md), [APRENDIZADOS-BUILD-DEPLOY-E-BANCO.md](../03-desenvolvimento/APRENDIZADOS-BUILD-DEPLOY-E-BANCO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** cron worker, guara, postgres, notify, rag, assistente, keep-warm, startup

## Sumário

- [A pergunta](#a-pergunta)
- [Explicando como para um dev leigo](#explicando-como-para-um-dev-leigo)
- [Resposta curta](#resposta-curta)
- [O que dá para fazer (e já foi feito)](#o-que-dá-para-fazer-e-já-foi-feito)
- [O que NÃO dá (e por quê)](#o-que-não-dá-e-por-quê)
- [Decisões](#decisões)

## A pergunta

"Posso deixar um cron pro Postgres pra rodar contra o banco ao iniciar, se na
build não rodou alguma base de dados? Deixar o RAG ativo?"

## Explicando como para um dev leigo

Um **cron worker** do Guara é um **despertador com um botão**: no horário
programado, ele aperta um botão. Só isso. O que o botão faz depende do **tipo
de destino**, e a doc oferece seis: **HTTP** (manda um POST para um endereço),
**NATS/Redis/Valkey/RabbitMQ** (joga um recado numa fila) e **Postgres** (toca
uma campainha dentro do banco, o `NOTIFY`).

O despertador **não abre o banco, não roda SQL, não carrega planilha**. Não
existe o destino "executar este comando". Então:

- Um cron **Postgres** só faz `NOTIFY canal` — é como apertar o interfone de
  uma casa. Se **ninguém estiver escutando** aquele canal (um `LISTEN`),
  ninguém atende. **Nosso app não tem esse ouvinte**, então esse cron não faria
  nada de útil.
- Para o cron "fazer trabalho", ele teria de ser **HTTP**: o despertador manda
  um POST para uma **página nossa**, e essa página (um `route.ts`) é quem faz o
  trabalho. O cron nunca faz o trabalho sozinho.

Sobre "se na build não rodou alguma base de dados": a build é a hora em que as
páginas são "impressas" lendo o banco. Se uma base não foi carregada antes, o
lugar de carregá-la é o **coletor/ETL** (que roda na máquina, ver
[FONTES.md](../06-fontes/FONTES.md)) — **não** um cron. Cron não popula tabela.

Sobre "deixar o RAG ativo": o RAG do Seu Nonô roda **na memória, na hora do
pedido** (o banco do Guara não tem pgvector). "Manter ativo" só faz sentido
como **manter o container acordado** — e isso o cron **HTTP** de saúde já faz
(abaixo). Pré-aquecer o RAG de verdade exigiria carregar os embeddings na
memória a cada batida, e o container do Starter tem só **256 MiB**: isso
empurraria o consumo para o teto e **derrubaria** o serviço.

## Resposta curta

- ❌ **Cron Postgres não serve** para "rodar base" nem "ativar RAG": ele só faz
  `NOTIFY`, e não há quem escute.
- ✅ **Cron HTTP de saúde** serve, e **já foi criado**: mantém o container
  acordado e vira monitor.
- ❌ **Pré-aquecer o RAG por cron**: não no plano Starter (memória).
- ❌ **Carregar base por cron**: não é papel de cron; é do ETL.

## O que dá para fazer (e já foi feito)

- **Cron `saude-monitor`** (`cron.yaml`): a cada 10 min, faz `POST /api/saude`
  no endpoint **interno** do serviço. Efeito: o serviço não fica ocioso tempo
  suficiente para "dormir" (Starter faz scale-to-zero) e cada disparo fica no
  histórico do Guara com status e **motivo de falha** (timeout, http_5xx,
  connection...) — é um **vigia na nuvem**, funciona com o home-pc desligado.
- **Endpoint `/api/saude`**: responde 200 em GET e POST, sem consultar banco
  (leve de propósito). É o alvo do cron.
- Quota: **Starter = 3 cron workers** por projeto. Hoje usamos 1.

## O que NÃO dá (e por quê)

- **Postgres NOTIFY**: o app não tem `LISTEN` nesse canal. Tocar interfone em
  casa vazia. Fica documentado para não ser tentado de novo.
- **Rodar SQL/carregar base por cron**: o Guara não oferece destino "SQL".
  Carga de base é ETL, na máquina.
- **Manter o RAG quente por um cron dedicado**: pesos/embeddings em memória
  num container de 256 MiB = OOM. Se um dia o plano for Pro (512 MiB), dá para
  reavaliar com um endpoint de pré-aquecimento — **medindo antes**.

## Decisões

- Cron do Guara é **gatilho**, não executor: quem faz o trabalho é o endpoint
  HTTP do app.
- **Um** cron de saúde basta para keep-warm + monitor; a quota do Starter é 3.
- Base de dados: quem carrega é o **ETL**, nunca o cron.
- RAG: fica **sob demanda**; não pré-aquecer no Starter.
