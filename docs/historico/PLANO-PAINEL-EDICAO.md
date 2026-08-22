# Plano — painel de edição do site

> Números deste plano medidos em 2026-08-13, contra `logs/rotina-*.log`
> (histórico de builds reais desta máquina) e contra o código do repositório.
> Onde não medi, digo que não medi.

## O obstáculo, primeiro

O site é gerado inteiro no build: `next build` lê o Postgres e imprime HTML.
Não existe "salvar e já mudou no ar" — existe "salvar e mudou quando alguém
rodar `npm run build` + deploy de novo". Um painel que não deixa isso visível
na tela é pior que nenhum painel: o editor sai achando que publicou.

### Quanto custa um rebuild, medido

`logs/` guarda o histórico de toda rodada de `scripts/rotina-local.mts` desde
10/08. Isolando as fases:

| Data/hora | Páginas | Build (só `npm run build`, inclui o prebuild) | Deploy (`cf:deploy`) |
|---|---:|---:|---:|
| 10/08 03:13 | 1.471 | 2m50s | — |
| 10/08 09:00 | 1.471 | 2m45s | 6m11s |
| 10/08 12:39 | 1.527 | 2m42s | 11m48s |
| 10/08 20:35 | 1.606 | 2m48s | 8m29s |
| 11/08 12:35 | 1.606 | 2m59s | 8m23s |
| **12/08 09:00** | **3.850** | **6m35s** | falhou (estourou o teto de 3 MiB do Worker — corrigido depois, ver `docs/APRESENTACAO.md` §8) |

No tamanho atual do site (3.850 páginas), o build sozinho já leva **6m35s**.
Nas rodadas anteriores, no tamanho de duas semanas atrás (1.471–1.606
páginas), o deploy levava entre 6 e 12 minutos por cima disso. Escalando pela
mesma proporção, um ciclo completo editar → publicar no tamanho de hoje fica
em **15 a 20 minutos** — a estimativa do pedido original bateu com a medição.

Não existe build parcial. O `next build` com `output` estático não sabe
regenerar "só a página que mudou": ele lê o banco inteiro e escreve tudo de
novo. Trocar um título custa o mesmo rebuild que trocar dez mil.

### As três opções, com o custo real de cada uma

**1. Painel dispara rebuild completo.** Editar grava a mudança (rápido,
segundos) e publicar é uma ação separada e deliberada que roda a rotina de
build+deploy já existente (`scripts/rotina-local.mts`). Custo: 15–20 minutos
por publicação, quantas edições estiverem acumuladas nela. Não muda nada de
arquitetura — reaproveita a trava de piso de páginas e a trava de queda
relativa que já existem no script.

**2. O conteúdo editável sai do build e vai para runtime.** Título e
descrição passariam a ser lidos do banco a cada requisição, não gravados no
HTML. Isso exige que aquelas páginas deixem de ser Static Assets servidos
direto pela borda e passem a rodar o Worker a cada visita
(`run_worker_first`) — o que o próprio `next.config.ts` documenta como
decisão já tomada e não trivial de reverter (ver comentário de `CSP` sobre
`run_worker_first: false`). Reintroduz exatamente a dependência de banco ao
vivo em produção que a Fase 5 tirou — e o `wrangler.jsonc` registra essa
escolha explicitamente: "nenhum binding de KV/R2/D1/DO no caminho crítico,
por decisão... ISR virou SSG". Também reabre o modo de falha descrito na
seção 7 da apresentação: sem banco alcançável, a página sai vazia — só que
agora isso acontece por visita, não só por build.

**3. Híbrido — só alguns campos viram dinâmicos.** Título e descrição
carregados de uma camada extra (KV, ou o próprio Worker interceptando a
rota) por cima do HTML estático. Tecnicamente possível, mas troca "página é
arquivo, ponto" por "página é arquivo, exceto quando não é" — a mesma
ambiguidade de modo de falha da opção 2, só que em menos rotas. E o ganho é
pequeno: o gargalo medido não é escrever HTML (isso é rápido), é o build
inteiro relendo o banco — e esse custo não desaparece só porque uma rota
específica passou a ser dinâmica.

### Recomendação: opção 1, com a publicação desacoplada da edição

Editar grava a mudança imediatamente (git commit, ver seção de trilha
abaixo) — isso é barato e não trava ninguém. **Publicar é um botão à parte**,
que dispara `scripts/rotina-local.mts --so-build` e, se passar da trava de
contagem, o deploy. A tela mostra sempre: "3 edições pendentes, ainda não
publicadas" — nunca finge que salvar é publicar.

Isso é o que a rotina já foi desenhada para fazer (o script tem 15/08 de
maturação: trava de piso de página, trava de queda, log com carimbo e PID,
proteção contra publicar site vazio). O painel é uma camada em cima dela, não
uma reescrita.

---

## Renomear URL

É a função mais perigosa da lista porque quebra três coisas ao mesmo tempo:
link já publicado, entrada do sitemap, e a rota estática que deixa de
existir.

### O que o `next.config.ts` já resolve, e o que não resolve

`redirects()` está na lista de recursos **não suportados** por
`output: 'export'` (o alvo GitHub Pages) — e o comentário do próprio arquivo
diz que o modo de falha é silencioso: sem servidor, ninguém aplica o
redirect, e o Next não avisa.

**No alvo de produção real, Cloudflare Workers, `redirects()` FUNCIONA** — a
condição `exportandoEstatico` no `next.config.ts` só desliga `redirects()` no
branch do GitHub Pages; no branch Cloudflare (o `else`), a função continua
ativa e vira parte do Worker publicado. Hoje ela é uma lista fixa de dois
itens escritos à mão no arquivo. O que falta é fazer essa lista vir de dado,
não de código:

1. `redirects()` passa a ler um arquivo `apps/web/data/redirects.json`
   (lista de `{ de, para, criadoEm, motivo }`) em vez do array hardcoded.
2. O painel, ao renomear uma URL, acrescenta uma entrada nesse arquivo — e
   commita.
3. O rebuild seguinte gera a página no endereço novo **e** publica o Worker
   já sabendo redirecionar o endereço antigo.

Esse desenho não é novo neste projeto: é o mesmo padrão de
`app/[municipio]/components/PaginaPonte.tsx`, já em produção para
`/zap-betim → /zap` e `/prefeitura/legislacao → /camara/legislacao` — com
`<meta http-equiv="refresh">` e `canonical` para o caso em que o alvo é o
export estático (GitHub Pages), onde `redirects()` não existe. Se o GitHub
Pages ainda for um alvo ativo (confirmar — a apresentação descreve como
alvo secundário), renomear URL precisa gerar as duas coisas: a entrada em
`redirects.json` (Cloudflare) **e** uma página-ponte estática (export). Se o
GitHub Pages não estiver mais em uso, só a primeira.

### O ponto que não dá para simplificar: renomear não é instantâneo

Entre o painel gravar o redirect e o rebuild publicá-lo, existe uma janela de
15–20 minutos em que a URL antiga ainda serve o conteúdo velho — o que é
seguro — e a URL nova ainda não existe. **A página antiga não pode ser
apagada antes desse rebuild terminar**, ou a janela vira um 404 real em vez
de um atraso. O painel precisa tratar "renomeando" como um estado, não como
uma ação instantânea: mostra "pendente de publicação" até o rebuild passar,
e só then a URL antiga desaparece de fato.

## Apagar página

Mesmo problema de janela, e um agravante: some do sitemap sem deixar rastro,
porque `app/sitemap.ts` lê o banco no momento do build — uma linha apagada
do banco não aparece na próxima lista, e ninguém que olhar o sitemap novo
saberá que ali existiu algo.

Recomendação: **apagar nunca é `DELETE` na tabela de origem.** É uma
supressão registrada à parte — mesma lógica dos redirects, um arquivo
`apps/web/data/paginas-suprimidas.json` (`{ slug, motivo, por, em }`), lido
no build para excluir a rota da geração e do sitemap. A tabela de origem
(alimentada pelo ETL) continua intacta, o que importa por um motivo
adicional: o ETL roda por cima dela periodicamente, e se a marca de "apagado"
estivesse numa coluna daquela mesma tabela, o próximo ETL a reescreveria sem
saber que existia. Um arquivo fora do alcance do ETL não tem esse risco.
Desfazer é remover a entrada do arquivo e publicar de novo.

---

## Segurança

### Por que este painel não pode estar na internet

`lib/betim/adminAuth.ts` já protege as rotas de moderação existentes com um
token Bearer fixo, fail-closed (sem `ADMIN_TOKEN`, nega). Isso é adequado
para "aprovar um classificado" — a pior consequência de um token vazado hoje
é um anúncio indevido aprovado. **Apagar página e renomear URL têm consequência
de outra ordem: derrubar conteúdo do ar ou quebrar link publicado em massa.**
Um token Bearer sozinho não é grau de proteção suficiente para isso — é
segredo único, sem expiração, sem registro de quem o usou, e qualquer
vazamento (log, captura de tela, commit acidental) dá controle total e
silencioso.

O painel deve:

- **nunca ser exposto por `custom_domain` nem por `workers_dev`** — não entra
  em `wrangler.jsonc` como rota pública. Roda como processo local (o próprio
  Next em modo dev, ou um build separado) nas duas máquinas de
  desenvolvimento, acessível só por `localhost` ou por rede Tailscale/tailnet
  entre as duas. Nunca publicado como Worker.
- Isso não é intenção, é verificação: o item de checklist antes de qualquer
  deploy é `grep -r "painel\|admin-edicao" apps/web/wrangler.jsonc` devolvendo
  vazio, e conferir ao vivo que a URL do painel não responde por
  `controlepopular.com.br` nem por `*.workers.dev`.
- Autenticação própria, diferente do `ADMIN_TOKEN` das rotas de moderação —
  esse token já circula em `.env` de duas máquinas para um uso de risco menor;
  reusar para apagar/renomear amplia o raio de um vazamento que já existe.

### Duas máquinas, um painel: como não colidir

O histórico já registrou **duas colisões entre sessões em 12/08** — trabalho
de uma máquina sendo sobrescrito pela outra. Isso aconteceu com sessões deste
assistente, mas o mecanismo é o mesmo risco que dois editores humanos têm ao
mesmo tempo, e a causa-raiz é a mesma: nenhuma das duas máquinas sabia que a
outra tinha escrito algo antes de escrever por cima.

Se as edições virarem commit em `origin/main` (ver próxima seção), o próprio
git resolve isso, contanto que o painel obedeça a uma regra: **antes de
aceitar uma edição nova, faz `git fetch` e recusa se `origin/main` andou
desde o último `pull` local.** Não silenciosamente — mostra "a outra máquina
publicou uma mudança; atualize antes de continuar" e obriga o `pull` antes de
liberar o campo de edição de novo. Isso transforma a colisão de "quem
escreveu por último vence, sem avisar" para "quem tentar escrever em cima do
outro é bloqueado e avisado" — o mesmo padrão de lock otimista que qualquer
wiki usa, sem precisar de um serviço de coordenação novo.

### Toda edição precisa de trilha e de desfazer

A sugestão do pedido original é a certa: **se a edição vira commit no git, o
desfazer e a trilha existem de graça.** Isto vale para os três tipos de
edição diferentes deste painel, com uma ressalva:

- **Título, texto de descrição/subtítulo** — hoje moram nas tabelas do
  Postgres alimentadas pelo ETL. Escrever direto nelas tem o mesmo problema
  do apagar: o próximo ETL passa por cima sem saber que houve edição manual.
  Recomendação: uma tabela de **sobreposição** (`edicoes_manuais`, chave =
  tabela+id+coluna, com `valor_novo`, `editor`, `maquina`, `criado_em`), que
  o build lê e aplica por cima do dado do ETL na hora de montar a página —
  sem tocar a tabela de origem. Isso resolve o problema de o ETL sobrescrever
  a edição, mas por si só não dá trilha em git. Por isso a tabela de
  sobreposição é espelhada como um arquivo (`apps/web/data/sobreposicoes.json`,
  gerado a partir da tabela, ou a própria fonte da verdade — a decidir na
  implementação) e commitado a cada edição salva. O commit é o registro; a
  tabela ou o arquivo é o que o build lê.
- **Apagar página e renomear URL** — já desenhados acima como arquivo de
  dado versionado (`paginas-suprimidas.json`, `redirects.json`). Não
  precisam de tabela extra: já nascem em git.
- **Desfazer**, nos três casos, é `git revert` do commit da edição — sem
  reescrever histórico, sem `--force` — seguido de um rebuild. Fica visível
  em `git log` quem editou o quê, quando, e como reverter.

Mensagem de commit sugerida: `painel: <ação> em <página> — por <máquina>`,
seguindo o padrão de commit descritivo que o resto do repositório já usa.

---

## Fases, em ordem de valor

**Fase 1 — a mais barata, primeira semana.** Editar título e descrição de
uma página, gravado como sobreposição versionada (tabela + espelho em git),
com botão de "publicar" separado que roda `rotina-local.mts --so-build` e
mostra o resultado (quantas páginas, passou na trava de piso, publicou ou
abortou). Autenticação própria do painel, restrita a `localhost`/tailnet.
Sem apagar, sem renomear. Isto sozinho já resolve o caso de uso mais comum
("corrigir um erro de digitação no título") sem tocar em nada arquitetural.

> **Entregue em 2026-08-15, com duas diferenças do que está escrito acima.**
>
> **Sem tabela.** Só o arquivo versionado, `apps/web/data/edicoes.json`, lido
> no build por `apps/web/lib/edicoes.ts`. A Neon está em HTTP 402 até 01/09, e
> este dado é minúsculo e sem junção; o arquivo já entrega as duas coisas que
> a tabela existia para dar — trilha (`git log -p`) e desfazer (`git revert`).
>
> **Sem painel web.** Quem edita é `scripts/editar-pagina.mts`, na linha de
> comando: `--listar`, `--rota … --titulo … --por … --motivo …`, `--remover`.
> A seção de segurança deste plano gasta várias páginas justificando por que o
> painel não pode estar exposto; um CLI resolve o mesmo caso de uso com
> superfície de ataque zero. O painel web deixa de ser Fase 1 e vira 1b — só
> vale a pena quando alguém que não usa terminal precisar editar, e aí o botão
> "publicar" entra junto.
>
> Consequência prática: **publicar continua sendo um ato separado**. Editar
> grava o arquivo na hora; o site muda no próximo build (15 a 20 minutos, na
> máquina de build). O script termina avisando isso, em vez de deixar o autor
> achar que já está no ar.
>
> Uma página só aceita edição se estiver ligada: `metadataEditavel(rota, …)`
> nas estáticas, ou o terceiro argumento de `metadataDaCidade` nas de cidade —
> sem ele, o helper não teria como distinguir `/bh/saude` de `/bh/educacao`,
> porque as duas chegam pelo mesmo código e o `params` só carrega a cidade.
> Ligadas até agora: `/paraopeba/entenda`. As demais entram conforme a
> necessidade aparecer.

**Fase 2 — apagar página**, via arquivo de supressão versionado, com o
estado "pendente de publicação" visível até o rebuild passar, e desfazer por
`git revert`.

**Fase 3 — renomear URL**, a mais arriscada, por último: exige o
`redirects()` orientado a dado (`redirects.json`) e, se o alvo GitHub Pages
ainda estiver ativo, a geração da página-ponte equivalente. Antes desta fase,
confirmar se aquele alvo secundário segue em uso — se não estiver, a fase
fica mais simples.

**Fase 4 — administrar a base**, no sentido amplo (navegar tabelas, editar
campos fora de título/descrição): fica **fora de propósito deste plano**.
Nada no pedido aponta um caso de uso concreto além dos quatro já cobertos, e
um painel de administração genérico sobre o banco reabre a superfície de
ataque inteira que as três fases acima tentam fechar com cuidado — cada
campo novo editável precisa da mesma pergunta que este plano fez para
título, apagar e renomear, e "editar qualquer coluna" não fez essa pergunta
para nenhuma.

## O que fica de fora, de propósito

- Edição ao vivo sem rebuild (opções 2 e 3 do início) — custo arquitetural
  medido contra um ganho que a opção 1, desacoplada, já entrega.
- Publicação automática a cada edição salva — o botão de publicar é
  deliberado, porque 15–20 minutos por edição isolada não escala e esconde o
  custo real de cada clique.
- Login de usuário final, MFA, política de senha — não é esse tipo de
  sistema; é ferramenta interna de duas pessoas em duas máquinas conhecidas,
  e a proteção real é a rede (nunca exposta) mais o token próprio do painel.
