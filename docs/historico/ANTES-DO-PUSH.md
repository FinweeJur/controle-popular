# Antes do push — a checagem obrigatória, em qualquer máquina

**Este repositório é PÚBLICO** (`gh repo view --json visibility` → `PUBLIC`).
Tudo que sai daqui é permanente: mesmo apagando depois, o GitHub mantém o
commit órfão acessível por hash, e quem clonou continua com a cópia.

## Ligue o hook — uma vez por clone, em cada máquina

```
git config core.hooksPath .githooks
```

`.git/hooks` não é versionado; por isso o hook mora em `.githooks/` e este
comando aponta o git para lá. **Sem ele o hook existe e não roda** — é o modo
de falha silencioso deste mecanismo, e a razão de existir a terceira camada.

Faça isso em **todos** os clones: o PC servidor, o PC externo, e qualquer
worktree novo.

## As três camadas, e por que são três

| camada | onde | pega quem |
|---|---|---|
| `apps/web/lib/sem-cpf-no-repo.test.ts` | `npm test` | roda os testes |
| `.githooks/pre-push` | automático no push | esqueceu de rodar os testes |
| `.github/workflows/dado-pessoal.yml` | CI | não ligou o hook |

Uma só não basta porque cada uma tem um jeito de ser pulada. O hook e a CI
chamam o **mesmo** script, `scripts/checar-dado-pessoal.py` — Python puro, sem
dependência, para servir também a repositórios sem Node (o `terras-devolutas`).

## O que ele barra

- **CPF de pessoa real**, validado por **mod-11**. Não é "11 dígitos": código
  IBGE, protocolo e id de processo não disparam. CPF sintético
  (`000.000.000-00`, `12345678909`) passa, porque precisa ilustrar formato.
- **Segredo**: chave de API, token do GitHub/Slack/AWS/Google, chave privada,
  string de conexão com senha. Referência a variável de ambiente e a
  `${{ secrets.X }}` não conta — é o jeito certo. Banco local
  (`@127.0.0.1`) não conta.

**CNPJ continua liberado**: é dado público de empresa, e o projeto o publica
de propósito.

## Por que isto existe

Em 13/08/2026 uma varredura achou **seis CPF de pessoa real** já publicados no
`origin/main`. Quatro estavam **no comentário que documenta a função que remove
CPF** — alguém mediu o vazamento na base real, colou o exemplo verdadeiro para
justificar a proteção, e o exemplo virou o vazamento.

O projeto já tinha defesa em profundidade: lista branca de colunas na
exportação, `PROIBIDOS` barrando nome de autuado, `_sanitizar_nome` no coletor.
**Todas no caminho do dado. Nenhuma olhava para código-fonte.**

A regra que generaliza: **ao ilustrar formato de documento em comentário, use
sempre valor sintético.** O exemplo real não documenta melhor — só vaza.

## Se acusar falso positivo

Acrescente o valor a `SINTETICOS` ou ajuste o padrão em
`scripts/checar-dado-pessoal.py`, **e diga por quê no commit**.

`git push --no-verify` pula a checagem. Existe para emergência real; se usar,
registre o motivo. Pular calado é arrancar o detector de fumaça porque ele
apitou.

## Uma armadilha já paga, para ninguém repetir

A primeira versão desta trava **passava verde com CPF real no repositório**.
Usava `\d` no `git grep -E`, que é POSIX ERE e não conhece `\d` — casava zero.
Só apareceu porque alguém reintroduziu um CPF de propósito para testar o teste,
e aí ela pegou o sabotado **e um sexto CPF que a varredura original não tinha
achado**.

Depois disso, a mesma classe de erro apareceu mais duas vezes no mesmo arquivo:
padrões PCRE (`(?:`, `(?!`) que o `git grep -E` rejeita em silêncio, e um `\b`
que virou byte de backspace literal na escrita.

**Sempre sabote o próprio guarda antes de confiar nele.** Guarda cego é pior
que guarda nenhum: dá a sensação de estar protegido.

---

## Antes do build: derrube o seu próprio wrangler

Aconteceu **duas vezes na mesma sessão** (13/08/2026), e a segunda só porque a
primeira não estava escrita em lugar nenhum.

`wrangler dev` deixa `workerd.exe` segurando `apps/web/.open-next/assets`
aberto. No Windows isso é lock de verdade: a pasta não pode ser removida
enquanto o processo viver. E o comando que a gente escreve por reflexo é

```
rm -rf .open-next && npx opennextjs-cloudflare build
```

O `rm` falha com `EBUSY`, o `&&` curto-circuita, **e o build nunca roda**. O
erro que aparece na tela é do passo SEGUINTE:

```
ERROR Could not find compiled Open Next config, did you run the build command?
```

Ou seja: a mensagem culpa o `populateCache` e pergunta se você rodou o build —
quando o problema é que o build foi pulado por causa do comando anterior. Ler
essa mensagem ao pé da letra manda investigar o lugar errado.

**A regra:** sessão que testou ao vivo derruba o próprio `wrangler dev` antes de
buildar. Matando SÓ os seus — pode haver outra sessão com dev server em outro
worktree, e derrubar o dela é sabotagem cruzada:

```powershell
Get-CimInstance Win32_Process -Filter "Name='workerd.exe' or Name='node.exe'" |
  Where-Object { $_.CommandLine -like '*<seu-worktree>*' -and $_.CommandLine -like '*wrangler*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

Confira o `CommandLine` antes de matar: é ele que diz de qual worktree o
processo é. `Get-Process -Name workerd` sozinho não distingue, e mata o da
outra sessão junto.
