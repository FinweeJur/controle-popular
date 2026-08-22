# Painel de edição — como rodar

> **Tipo:** HISTORICO
> **Domínio:** global
> **Última medição:** 2026-08-22
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [README.md](../../README.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** historico, procedimento, operacao

## Sumário

- [Propósito](#propósito)
- [Subir](#subir)
- [Por que ele não pode ir para o ar, e como isso é garantido](#por-que-ele-não-pode-ir-para-o-ar-e-como-isso-é-garantido)
- [O que o painel faz](#o-que-o-painel-faz)
- [O botão "Pedir publicação", e o vigia](#o-botão-pedir-publicação-e-o-vigia)
- [O que ainda não está pronto](#o-que-ainda-não-está-pronto)

## Propósito

> Fase **1b** de `docs/PLANO-PAINEL-EDICAO.md`, entregue em 15/08/2026. A Fase 1 > já existia em linha de comando (`scripts/editar-pagina.mts`); o que faltava > era tela para quem não usa terminal. Os dois gravam o **mesmo** arquivo, no > mesmo formato — quem editar pelo terminal e quem editar pe...

> Fase **1b** de `docs/PLANO-PAINEL-EDICAO.md`, entregue em 15/08/2026. A Fase 1
> já existia em linha de comando (`scripts/editar-pagina.mts`); o que faltava
> era tela para quem não usa terminal. Os dois gravam o **mesmo** arquivo, no
> mesmo formato — quem editar pelo terminal e quem editar pela tela produzem o
> mesmo commit.

## Subir

```bash
cd apps/web
PAINEL_LOCAL=1 npx next dev --port 3028
```

E ter `PAINEL_TOKEN` no `apps/web/.env.local`:

```
PAINEL_TOKEN=<um valor aleatório qualquer, estável entre reinícios>
```

Depois, `http://localhost:3028/painel`.

> ⚠️ **No `cmd` do Windows, use `set "PAINEL_LOCAL=1"` com as aspas.** A forma
> `set PAINEL_LOCAL=1 && ...` grava o valor **com um espaço no fim** (`"1 "`), a
> comparação `=== "1"` falha e a rota some — dá 404 sem nenhuma mensagem de
> erro. Medido em 15/08/2026: foi exatamente assim que a primeira tentativa de
> verificação falhou. A forma verificada de ponta a ponta nesta data é a do
> bloco acima, com a variável passada direto na linha.

## Por que ele não pode ir para o ar, e como isso é garantido

`docs/PLANO-PAINEL-EDICAO.md` dedica uma seção a por que este painel não pode
estar na internet — ele mexe em conteúdo publicado, e a própria seção diz que
**"isso não é intenção, é verificação"**.

A verificação é estrutural, não disciplinar. As rotas moram em arquivos
`*.local.tsx` / `*.local.ts`, e essa extensão só entra em `pageExtensions`
quando as **duas** condições valem:

1. `PAINEL_LOCAL=1` — quem quer o painel pede por ele;
2. `NODE_ENV !== "production"` — e **`next build` sempre define `production`**.

A condição 2 é a que fecha a porta: mesmo que `PAINEL_LOCAL=1` vaze para o
ambiente de build ou para o CI, o `next build` continua sem enxergar os
arquivos, o Worker sai sem as rotas, e não há o que vazar. Não depende de
ninguém lembrar de desligar nada.

**Medido em 15/08/2026**, com o servidor de pé:

| Rota | Sem `PAINEL_LOCAL` | Com `PAINEL_LOCAL=1` |
|---|---|---|
| `/` | 200 | 200 |
| `/painel` | **404** | **200** |
| `/api/painel/edicoes` | **404** | **401** sem token |

O 401 é o fail-closed: sem `PAINEL_TOKEN` no ambiente, a API nega tudo. Um
painel que "libera quando não há token configurado" é um painel aberto na
primeira vez que alguém esquecer o `.env.local`.

O token é **próprio**, nunca o `ADMIN_TOKEN`: aquele já circula no `.env` de
duas máquinas para um uso de risco menor (aprovar classificado), e reusá-lo aqui
ampliaria o raio de um vazamento que já existe.

## O que o painel faz

- Lista as páginas **ligadas** para edição, descobrindo-as por varredura do
  código (procura `metadataEditavel("/rota"`), não por uma lista à mão — lista
  à mão é segunda fonte da verdade e envelhece calada.
- Edita **título e descrição**, com `quem` e `motivo` obrigatórios. Edição sem
  motivo é edição que ninguém audita depois.
- Mostra sempre **quantas edições esperam publicação**, e diz em palavras que
  salvar não publica.
- **Bloqueia a edição** se `origin/main` andou desde a última atualização local,
  com o motivo escrito na tela. É o lock otimista que o plano pede, por causa
  das duas colisões entre máquinas registradas em 12/08.

Não apaga página e não renomeia URL — são as Fases 2 e 3, cada uma com uma
janela de inconsistência própria que esta tela ainda não sabe tratar.

## O botão "Pedir publicação", e o vigia

O `home-pc` é a máquina de build (é a que tem o Postgres atual). Medido em
15/08: responde `tailscale ping` em 4 ms e **nenhuma porta de serviço responde**
— 22, 445, 3389 e 5432 fechadas. Dá para falar com a máquina, não dá para mandar
nela.

Então o pedido viaja pelo canal que já existe, o próprio repositório:

1. O botão grava `apps/web/data/pedido-build.json`, **commita e dá push**.
2. No `home-pc`, `scripts/vigia-build.mts` puxa, vê o pedido novo e roda
   `scripts/rotina-local.mts`.
3. O vigia grava `apps/web/data/ultimo-build.json` com o código de saída e
   publica de volta — é assim que o painel da outra máquina sabe como terminou.

```bash
# no home-pc
npx tsx scripts/vigia-build.mts --laco --intervalo 300
npx tsx scripts/vigia-build.mts --seco     # diz o que faria, sem buildar
```

O vigia **não decide publicar sozinho** (sem pedido, não roda), **não silencia
falha** (código de saída vai para o arquivo e para o painel) e **não usa
`--forcar-deploy`** — as travas de piso de página e de queda relativa da rotina
existem justamente para o caso de o banco vir vazio.

Comparação por `em` do pedido contra `pedidoAtendido` do último build. Um "já
rodei hoje" erraria no dia em que duas publicações fossem pedidas — e erraria
para menos, que é o pior lado.

## O que ainda não está pronto

- **Textos de abertura das páginas** (hero, ressalvas de cobertura) — decisão do
  dono em 15/08 foi incluí-los no escopo. Exige marcar no código quais trechos
  são editáveis, um a um; hoje só título e descrição passam pelo
  `metadataEditavel`.
- **Só `/paraopeba/entenda` está ligada.** Ligar outra é trocar o `metadata` da
  página por `metadataEditavel("/a/rota", { … })`.
- **Páginas de cidade não aparecem** na lista: elas recebem a rota pelo terceiro
  argumento de `metadataDaCidade` e só existem no plural (`/bh/saude`,
  `/betim/saude`…). O painel diz isso na tela em vez de fingir cobertura total.
- O caminho pelo `.claude/launch.json` (`cp-painel-edicao-dev`, porta 3028)
  existe por conveniência, mas **a forma verificada nesta data é a do primeiro
  bloco deste documento**.
