# A rotina que atualiza o site sozinha

> Escrita em 2026-08-10, quando o §20 do plano registrou a dívida mais
> perigosa da lista: **o site estava correto e no ar, mas só mudava quando
> alguém rodava o build à mão.** Os 6 workflows de ETL seguiam agendados no
> GitHub apontando para a Neon, que não é mais o banco — acordavam todo dia e
> gravavam em lugar nenhum. Uma tarefa que parece viva é pior que uma tarefa
> desligada, porque ninguém vai conferir.

## O que roda, e quando

| | |
|---|---|
| Tarefa do Windows | `Controle Popular - rotina diaria` |
| Horário | todo dia às **06:00** local |
| Comando | `scripts\rotina-local.cmd` → `npx tsx scripts/rotina-local.mts` |
| Se o PC estiver desligado na hora | roda assim que possível (`StartWhenAvailable`) |
| Teto de duração | 4 h |
| Log | `logs/rotina-<carimbo>.log`, um por execução |

A sequência é **ETL → build → trava de páginas → deploy**. Cada etapa só
acontece se a anterior passou.

## A trava, que é a razão de tudo

O `next build` tem um modo de falha silencioso que já custou uma sessão: sem
banco alcançável, `getDb()` devolve `null`, as páginas saem vazias e **o build
termina com exit 0**. Um deploy nessa condição publica um site em branco por
cima de um site correto, e nada fica vermelho.

Por isso o sinal de saúde não é o exit code — é a contagem em
`.next/prerender-manifest.json`:

| páginas | significa |
|---:|---|
| **21** | o banco não foi lido (medido) |
| **1.471** | build correto (medido em 2026-08-10) |

A rotina **recusa o deploy abaixo de 1.000 páginas**, e recusa também uma
queda de mais de 20% em relação à última publicação — o piso pega o desastre,
a queda relativa pega a erosão (uma tabela que esvaziou derruba centenas de
páginas sem chegar perto de 21). Para publicar mesmo assim:
`--forcar-deploy`.

## Por que ela LÊ os workflows em vez de repetir os comandos

São mais de cem invocações de módulo espalhadas por 6 arquivos, cada uma com
sua cadência. Transcrevê-las para um script criaria uma segunda lista que
diverge da primeira no primeiro coletor novo — e a divergência seria
invisível: o ETL "rodaria", só que sem o módulo recente.

Então `scripts/rotina-local.mts` **parseia `.github/workflows/etl-*.yml`** e
executa o que a cadência do dia manda. O que mudou ao sair do GitHub foi só o
gatilho e o banco; a lista de módulos, a ordem e a cadência continuam
declaradas lá.

**Consequência que não pode ser esquecida:** os blocos `schedule:` dos
workflows **ficam**, mesmo desligados. Eles não são resíduo — são a fonte da
cadência. Apagar os crons quebra a rotina local em silêncio (ela
simplesmente não acha passo nenhum para o dia). O que desliga a execução no
GitHub é o `if: github.event_name == 'workflow_dispatch'` no job.

O preço dessa escolha é um mini-interpretador de `if:` do Actions. Ele é
deliberadamente burro e **recusa o que não entende** em vez de pular: um `if:`
de formato novo aborta a rotina imprimindo a expressão. Pular seria o mesmo
modo de falha silenciosa que esta rotina existe para matar.

## O que ela nunca faz

Conectar na Neon. Antes de qualquer coisa ela lê `etl/betim/.env` e
`apps/web/.env.local` e **aborta se o `DATABASE_URL` não for 127.0.0.1**.
Está em código e não em comentário porque já aconteceu: um build local
conectou na Neon e levou HTTP 402.

## Usar à mão

```bash
npx tsx scripts/rotina-local.mts --listar
```

Mostra exatamente o que rodaria hoje, sem executar nada. É o primeiro comando
a rodar depois de mexer em qualquer workflow.

```bash
npx tsx scripts/rotina-local.mts --so-build --sem-deploy
```

Pula o ETL, constrói e para antes de publicar. É como se confere a contagem
de páginas sem tocar no site.

```bash
npx tsx scripts/rotina-local.mts --sem-deploy
```

Rotina inteira menos a publicação.

## O que a máquina precisa ter

- **Postgres local no 5432**, com o dump restaurado.
- **venv em cada diretório de ETL**: `etl/betim/.venv`, `etl/congresso/.venv`,
  `etl/judiciario/.venv`. A rotina põe o `Scripts/` do venv na frente do PATH
  antes de rodar o passo — nenhum módulo vai para o Python global.
- **Chromium do Playwright** no venv do `etl/betim` (os coletores de câmara
  dependem dele): `etl/betim/.venv/Scripts/python -m playwright install chromium`.
  O passo `playwright install --with-deps` dos workflows é pulado de
  propósito: `--with-deps` instala pacote APT e não existe no Windows.
- **bash do Git no PATH**. Os blocos `run:` dos workflows são bash de verdade
  — têm `for`, `$(date +%Y)` e `sleep` —, e traduzi-los seria reescrever os
  workflows, que é justamente o que esta rotina evita.
- **wrangler autenticado** (`wrangler login`), para o `cf:deploy`.

## O que sobrou agendado no GitHub, e por quê

Só o `canario-limites.yml`. A diferença entre ele e os outros é que os outros
**precisam do banco** e ele só precisa da internet: sonda o site de fora, que
é a única posição de onde se enxerga o site fora do ar — e é a única
vigilância que sobrevive a esta máquina estar desligada.

A parte dele que olhava a Neon saiu (ver a nota em
`.github/scripts/canario_limites.py`): sem projeto lá, ela alertaria "canário
cego" de 4 em 4 horas sobre um sistema que não existe, e é assim que se ensina
alguém a ignorar o canário.

## Quando conferir se está funcionando

O Agendador de Tarefas mostra o código de saída na coluna **"Resultado da
última execução"**. `0` publicou; qualquer outra coisa **não** publicou — e o
motivo está na última linha do log do dia, que sempre começa com `ABORTADO:`
ou `publicado.`.

```powershell
Get-ScheduledTaskInfo -TaskName 'Controle Popular - rotina diaria'
```
