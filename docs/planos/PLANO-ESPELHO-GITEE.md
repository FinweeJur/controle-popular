# Plano de espelho dos repositórios no Gitee

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-01
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md) (Decisão 13, Fila #29), [AGENTS.md](/AGENTS.md), [OPERACAO.md](../05-operacao/OPERACAO.md)
> **Palavras-chave:** plano, gitee, espelho, mirror, github, publicacao

## Sumário

- [Origem do plano](#origem-do-plano)
- [Objetivo](#objetivo)
- [Decisões que não se reabrem](#decisões-que-não-se-reabrem-medidas-em-2208)
- [Escopo — o que espelhar](#escopo--o-que-espelhar)
- [Pré-requisitos](#pré-requisitos-medir-antes-de-abrir-conta)
- [Mecânica do espelho](#mecânica-do-espelho--duas-opções)
- [Passo a passo](#passo-a-passo-checklist-de-execução)
- [Manutenção](#manutenção)
- [Riscos e mitigação](#riscos-e-mitigação)
- [Critérios de conclusão](#critérios-de-conclusão)

## Origem do plano

Este plano executa a **Decisão 13** do dono (22/08/2026) e a tarefa **#29 da fila
viva** do [ESTADO.md](../02-estado/ESTADO.md): *"O código vai subir também para o
Gitee, no futuro — espelho, não mudança de casa."* O "plano em algum lugar" que o
dono referenciou é exatamente esse registro no ESTADO.md — este arquivo transforma
a decisão em passos executáveis.

## Objetivo

Espelhar os repositórios públicos do **FinweeJur** no **Gitee**, mantendo o GitHub
como casa do desenvolvimento e da CI. O Gitee é um espelho de **leitura** — não
recebe issues, não roda ETL, não é a fonte do site.

## Decisões que não se reabrem (medidas em 22/08)

1. **É espelho, não migração.** Os 6 ETLs, `dado-pessoal.yml` e `prazos-lai.yml`
   são GitHub Actions; reescrevê-los seria o custo real de uma migração e não
   acontece neste plano.
2. **Nada de segredo novo.** O repositório é público no GitHub, então não há
   segredo a reavaliar antes de espelhar (medido em 22/08).
3. **O site não migra.** `sementeiraprojetos.com.br` e `controlepopular.com.br`
   continuam onde estão (GitHub Pages e Cloudflare Tunnel, respectivamente).
   Gitee Pages não entra no escopo.

## Escopo — o que espelhar

Prioridade do dono sugerida (confirmar na hora de executar):

| Repo | Licença | Espelhar? | Nota |
|---|---|---|---|
| `controle-popular` | AGPL-3.0-or-later | **Sim (prioridade 1)** | o portal inteiro, com histórico |
| `sementeira` | proprietária (© Artur Colito) | **Sim (prioridade 1)** | app + site do hub em `docs/` |
| `llm-br` | MIT | **Sim (prioridade 2)** | biblioteca compartilhada de IA |
| `applivre` | — | Opcional (prioridade 3) | catálogo, pouco movimento |
| `producao-eventos` | Apache-2.0 | Opcional (prioridade 3) | |
| `odysseus-ptbr` | MIT | Opcional (prioridade 3) | tradução de upstream |
| `cutiazinha` | — | **Não** (fork de terceiro) | espelhar fork polui o rastro do upstream |

## Pré-requisitos (medir antes de abrir conta)

- [ ] **Conta no Gitee** com e-mail do projeto (sugerido: `contato@controlepopular.com.br`).
- [ ] **Verificação de identidade** — regra de plataforma do Gitee (item 29 do
      ESTADO.md já registra isso). Medir o prazo real: documento aceito, tempo de
      análise. É o maior gargalo do plano e o único que depende de terceiro.
- [ ] **Repositório novo passa por revisão antes de ficar público** — regra de
      plataforma. Mitigação: criar os repos como **privados**, espelhar, conferir
      o conteúdo, e só então publicar.
- [ ] **2FA** ativo na conta Gitee.
- [ ] **Tamanho dos repos** — conferir o limite do plano free do Gitee antes do
      primeiro push: `git count-objects -vH` no clone local de cada repo. O
      `controle-popular` carrega histórico grande (ver `git count-objects`); se o
      limite free não comportar o histórico completo, decidir entre espelho
      shallow (só HEAD) ou poda — **preferir espelho completo** e, se impossível,
      documentar a perda de histórico antes de executar.
- [ ] **Credencial**: Personal Access Token do Gitee com escopo `projects`
      (guardado como secret do GitHub, nunca no repositório) **ou** chave SSH do
      Gitee.

## Estado da execução

- **01/09/2026:** o workflow `mirror-gitee.yml` foi adicionado aos repositórios
  `controle-popular`, `sementeira` e `llm-br` — a Opção B está pronta, mas **inativa até os secrets
  `GITEE_USERNAME`/`GITEE_TOKEN` existirem** (o workflow falha com mensagem
  clara se eles faltarem). Faltam os passos 1–5 e 7–9 do checklist abaixo
  (conta, identidade, repos no Gitee, secrets, primeiro espelho).

## Mecânica do espelho — duas opções

### Opção A — espelho manual (primeira vez, sempre funciona)

```bash
# em uma máquina com acesso aos dois
git clone --bare https://github.com/FinweeJur/controle-popular.git
cd controle-popular.git
git push --mirror https://gitee.com/SEU_USUARIO/controle-popular.git
cd ..
rm -rf controle-popular.git
```

`--mirror` copia branches, tags e refs. Fazer um por repo, na ordem de prioridade.
Nada disso toca o working tree de desenvolvimento — pode rodar de qualquer pasta.

### Opção B — espelho automático via GitHub Actions (recomendado para manter)

A decisão 13 diz que a **CI não se muda**; adicionar um workflow de espelho no
GitHub não é migração de CI, é uma ação extra que roda onde a CI já roda. O custo
é o free tier do GitHub Actions (minutos, zero reais).

Workflow por repo (`mirror-gitee.yml`), sem reescrever nenhum workflow existente:

```yaml
name: mirror-gitee
on:
  push:
    branches: [main, master]
  schedule:
    - cron: "17 4 * * 0"   # domingo 04:17 UTC — segurança contra push manual no Gitee
  workflow_dispatch:

jobs:
  mirror:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0        # histórico completo
      - name: push para o Gitee
        run: |
          git remote add gitee https://SEU_USUARIO:${{ secrets.GITEE_TOKEN }}@gitee.com/SEU_USUARIO/${{ github.event.repository.name }}.git
          git push --mirror gitee
```

Atenção: o token no URL vaza para o log se o comando falhar? O `actions/checkout`
e o `git push` com credencial no URL aparecem no log. Para não vazar o token, usar
`extraheader` do git ou uma chave SSH dedicada (recomendado: **deploy key SSH**
gerada para o Gitee, adicionada como secret `GITEE_SSH_KEY`, e remote
`git@github.com`→`git@gitee.com`). A opção com URL+token é aceitável só se o repo
do GitHub for privado — o nosso é público, então **usar SSH** ou aceitar o risco
e trocar o token logo depois (o token só dá push num repo que já é espelho).

### Opção C — importador do Gitee (não recomendado como mecanismo principal)

O Gitee tem "importar do GitHub", mas cria o repo com atualização manual. Serve
para o primeiro espelho se a Opção A falhar; a manutenção contínua fica com B.

## Passo a passo (checklist de execução)

1. Criar a conta no Gitee com o e-mail do projeto; iniciar a verificação de
   identidade **primeiro** (é o passo mais lento).
2. Ativar 2FA; definir nome público e avatar.
3. Criar os repos no Gitee como **privados**, com a mesma descrição do GitHub.
4. Gerar o token (escopo `projects`) ou a deploy key SSH; guardar como secret do
   GitHub (`GITEE_TOKEN` / `GITEE_SSH_KEY`).
5. Espelhar uma vez com a **Opção A** (garante que o histórico inteiro subiu).
6. Adicionar o workflow da **Opção B** nos repos prioritários; rodar
   `workflow_dispatch` e conferir o espelho no Gitee.
7. Revisar o conteúdo dos repos no Gitee (README, LICENSE, docs) e **torná-los
   públicos**.
8. Adicionar no README do GitHub (seção do rodapé) o link do espelho:
   `Espelho: gitee.com/SEU_USUARIO/<repo>`.
9. Marcar a tarefa #29 no ESTADO.md como feita, com a data.

## Manutenção

- O espelho automático (Opção B) mantém o Gitee em dia a cada push e semanalmente.
- Se um workflow de espelho falhar, o check fica vermelho no GitHub — tratar como
  qualquer CI quebrada.
- Decidir anualmente se o espelho ainda faz sentido (custo de manutenção ~zero;
  valor: redundância e alcance em plataformas chinesas).

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Verificação de identidade demora ou é negada | começar por ela; manter contato via GitHub se o Gitee recusar |
| Repo público novo fica em revisão no Gitee | criar privado → espelhar → revisar → publicar |
| Histórico grande estoura o limite free | medir `git count-objects` antes; shallow como último recurso, documentado |
| Token vaza no log do workflow | usar deploy key SSH no workflow; token só como fallback com troca imediata |
| Guarda de dado pessoal (mod-11) | nada muda: o espelho copia o que o GitHub já publica; as guardas continuam no GitHub |
| Confusão entre GitHub e Gitee (qual é a fonte) | README do Gitee com banner "espelho; desenvolvimento em github.com/FinweeJur" |

## Critérios de conclusão

- [ ] Conta Gitee criada, identidade verificada, 2FA ativo.
- [ ] `controle-popular`, `sementeira` e `llm-br` espelhados e públicos no Gitee.
- [ ] Workflow de espelho ativo e verde nos três.
- [ ] READMEs do GitHub com link do espelho.
- [ ] ESTADO.md #29 marcado como feito com data.
