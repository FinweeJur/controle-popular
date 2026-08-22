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

> ⚠️ **A TRAVA DE PÁGINAS NÃO PEGA TAMANHO DE ASSET.** Em 15/08/2026 o
> `cf:deploy` passou a recusar `ambiental/legislacao.cache` (35,5 MiB) contra o
> teto de 25 MiB por asset do Workers — e o ETL passava, o build passava com
> 3.872 páginas e exit 0, e só a publicação morria. **O site não quebra nesse
> caso; ele para no tempo.** Resolvido no mesmo dia
> (`lib/ambiental/payload-compacto.ts`), mas o modo de falha continua possível
> em qualquer rota que entregue coleção grande ao cliente: a trava abaixo mede
> se o banco foi lido, não o tamanho do que saiu. Ver
> `docs/HANDOFF-PAYLOAD-LEGISLACAO.md`.

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

E há uma terceira trava, aprendida na marra: **se TODOS os passos do ETL
falharem, nada é construído nem publicado.** Um passo que cai é rotina (a fonte
saiu do ar, a API mudou); todos caírem juntos é ambiente — bash errado, venv
ausente, credencial fora. Fonte de dado não cai toda no mesmo segundo.

## A armadilha que derrubou a primeira execução automática

Na estreia (2026-08-10, 06:00) os **25 de 25** passos de ETL falharam com
`/bin/bash: line 1: python: command not found` — e a rotina publicou assim
mesmo, escrevendo "publicado. 1.471 páginas".

A causa não era PATH. `spawn("bash")` procura o executável no PATH que recebe,
e o PATH do Agendador de Tarefas tem `C:\Windows\system32` e **não** tem o Git.
Em `system32` mora o **`bash.exe` do WSL**. Os passos rodavam dentro do Linux
do WSL, que não enxerga `C:\` (lá é `/mnt/c`) e não tem o venv nem python. O
prefixo `/bin/bash:` na mensagem era a pista — o Git Bash diz `bash:`.

Interativamente isso nunca aparecia, porque o PATH de um shell normal acha o
Git primeiro. **Era um erro que só existia no modo automático — o modo que
ninguém olha.**

Hoje a rotina resolve o caminho do bash a partir de onde o `git` está
instalado, recusa explicitamente `system32\bash.exe`, e **aborta antes de
qualquer coisa** se não encontrar um bash válido. Rodar 25 passos no
interpretador errado é pior que não rodar.

Nesta máquina o Git está em `%LOCALAPPDATA%\hermes\git` — fora de qualquer
lugar previsível, e é por isso que o caminho é derivado do `git` em vez de
chutado numa lista.

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

## O corpus que ficava velho em silêncio (corrigido em 15/08/2026)

Até 15/08/2026 **nenhuma das cinco fontes de `ambiental_legislacao` estava
declarada em workflow nenhum** — nem as estaduais (ALMG, Semad, Siam) nem as
nacionais (MMA/Conama, CNDH). As 15.318 normas eram carregadas à mão nesta
máquina, o que significa que o corpus congelava no dia da última carga e
**ninguém era avisado**: a tela seguia mostrando um número correto na forma e
velho no conteúdo. É o mesmo modo de falha que o §20 descreve lá em cima, só
que num eixo em vez de no site inteiro.

Apareceu ao mesclar o PC externo: ele trouxe a migration `0073`, os coletores
`legislacao_mma`/`legislacao_cndh` e a tela com filtro por esfera — mas **não
tem Postgres**, então as 8.940 normas federais nunca chegaram a banco nenhum.
A tela ia ao ar prometendo MMA, Ibama, ICMBio e Conama e imprimindo "0 normas
federais" logo abaixo. Os números são calculados do banco, então não era
mentira; era a vitrine prometendo o que não entrega, que esta base trata como
falha grave.

As cinco agora são passos **mensais** (`0 10 1 * *`) em `etl-betim.yml`.
Mensal é a cadência da própria fonte, não um teto arbitrário: o recurso do MMA
é um CSV anual (`Legislação Ambiental Brasileira_2025`, criado em 23/09/2025)
e a página do CNDH no Decidim estava atualizada em 29/01/2026 quando isto foi
escrito. Todas com `continue-on-error`: ALMG e Semad paginam com pausa de ≥1 s
exigida pela fonte e são os passos mais demorados do mês — um cair não pode
levar os outros quatro nem o build do dia.

Contagem medida no dia em que foram ligadas, para servir de régua na próxima:

| fonte | esfera | normas |
|---|---|---:|
| MMA/Conama | nacional | 8.570 |
| CNDH | nacional | 370 |
| Siam | estadual | 4.077 |
| Semad | estadual | 2.232 |
| ALMG | estadual | 69 |
| **total** | | **15.318** |

O vocabulário de esfera é `municipal | estadual | nacional | internacional` —
**não existe `federal`**, nem no tipo `EsferaLegislacao` nem na constraint da
tabela. A tela escreve "federais" como rótulo humano e conta por `fonte`.
Quem consultar o banco por `esfera = 'federal'` recebe zero e conclui a coisa
errada.

### E um sexto passo, cuja ORDEM é o passo

`classificar_temas_ambientais` roda **depois** dos cinco, no mesmo bloco
mensal. Ele não bate em fonte externa nenhuma: lê `ementa`/`indexacao` das
linhas já gravadas e deriva `temas`. Rodar antes dos coletores classificaria o
corpus do mês passado e deixaria o novo sem tema — que foi exatamente o estado
encontrado em 15/08, e o motivo de este parágrafo existir.

O sintoma vale registrar porque é sutil: as 8.940 normas nacionais entraram com
**0%** de tema contra **31,5%** das estaduais, e a tela publicava só a média
das duas, **13,1%**. O número era verdadeiro — e, sozinho, enganoso: sugeria
cobertura ralinha e espalhada quando na verdade era boa de um lado e nula do
outro. Média que esconde bimodalidade é o tipo de número que esta base existe
para não publicar.

O módulo é determinístico e idempotente, então rodar de novo sobre linha já
classificada não duplica nem estraga.

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
