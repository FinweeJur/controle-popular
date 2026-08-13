---
name: revisar-seguranca-cp
description: Revisão de segurança do Controle Popular e do Terras Públicas, com as regras específicas destes projetos — repositório público, dado pessoal de fonte governamental, Worker na Cloudflare e Postgres local. Use ao avaliar risco, antes de publicar coisa nova, ou quando pedirem "revisão de segurança".
---

# Revisão de segurança — Controle Popular / Terras Públicas

Uma revisão genérica não sabe o que estes projetos são, e por isso erra de dois
jeitos: deixa passar o que importa aqui e grita sobre o que não se aplica. Este
documento é a memória do que já foi descoberto, para a próxima revisão começar
de onde a última parou.

## O que estes projetos são, e o que muda por isso

Portal de transparência cívica. **Não há login de usuário final.** Todo o
conteúdo é dado público de governo, publicado de propósito.

Então **não se aplica**, e citar é ruído: MFA, expiração de sessão, política de
senha, CSRF em formulário sem sessão, controle de acesso por papel. Recitar
OWASP sem caminho de ataque neste sistema faz o dono ignorar a lista inteira.

**O que se aplica de verdade** é outra coisa: dado pessoal que não deveria
estar publicado, escrita pública sem teto, e a confusão entre o que é dado
público de empresa e o que é dado pessoal de gente.

## Regra nº 1 — o repositório é PÚBLICO

    gh repo view --json visibility   →  PUBLIC

Vale para tudo que se escreve: comentário, docstring, migration, `.md`,
mensagem de commit.

**Em 13/08/2026 foram achados seis CPF de pessoa real já publicados no
`origin/main`.** Quatro estavam **no comentário que documenta a função que
remove CPF** — alguém mediu o vazamento na base real, colou o exemplo
verdadeiro para justificar a proteção, e o exemplo virou o vazamento.

A lição que generaliza: **as defesas do projeto vivem no caminho do DADO**
(lista branca de colunas na exportação, `PROIBIDOS`, `_sanitizar_nome`).
**Nenhuma olha para código-fonte**, e foi por ali que vazou. Ao ilustrar
formato de documento, use sempre `000.000.000-00`.

Trava instalada, em três camadas: `apps/web/lib/sem-cpf-no-repo.test.ts`,
`.githooks/pre-push` e `.github/workflows/dado-pessoal.yml` — as três chamam
`scripts/checar-dado-pessoal.py`. Detalhes em `docs/ANTES-DO-PUSH.md`.

**CPF de pessoa física é violação. CNPJ de empresa não é** — é dado público, e
o projeto o publica de propósito. Confundir os dois gera falso positivo em
massa.

## Regra nº 2 — sabote o próprio guarda antes de confiar nele

Das quatro travas escritas em 13/08, **três nasceram cegas e passavam verde**:

1. `\d` no `git grep -E` — POSIX ERE não conhece `\d`. Casava zero.
2. `(?:...)` e `(?!...)` — PCRE, rejeitado pelo ERE; o erro ia para stderr e o
   exit code parecia sucesso.
3. Um `\b` que virou byte `0x08` literal ao ser escrito por heredoc.

Nenhuma apareceria sem sabotagem deliberada. E a quarta: o teste que valida o
detector de CPF usava, como exemplo de "válido", **um dos CPF reais que o
commit estava removendo**.

Ao revisar qualquer verificação — teste, lint, hook, asserção — **quebre o que
ela deveria pegar e confirme que reprova.** Verde não prova nada.

## Regra nº 3 — o que já foi verificado e está CERTO

Não reabra sem motivo; confirme por amostragem e siga.

- **Admin fechado.** `lib/betim/adminAuth.ts` falha fechando (`if (!token)
  return false`), e os 6 handlers admin chamam `isAdminAuthorized`. Medido ao
  vivo: 401.
- **Zero SQL cru.** Nenhum `sql.raw`, `.raw(`, `execute(\``  em `apps/web`.
  Os ~90 templates `sql\`\`` de `lib/db/queries` usam parâmetro. Injeção é
  impossível por construção — não é sorte.
- **Escrita pública nasce `aprovado: false`**, e toda leitura filtra
  `aprovado = true`. Desenho correto.
- **Sem `NEXT_PUBLIC_`, sem `"use server"`, sem `middleware.ts`.**
- **Sem `fs` nas rotas com parâmetro** — travessia de diretório impossível.
- **React escapa por padrão.** Só reportar XSS com `dangerouslySetInnerHTML`
  ou equivalente explícito.

## Regra nº 4 — as armadilhas específicas desta infraestrutura

**`X-Forwarded-For` é falsificável atrás da Cloudflare.** Ela *acrescenta* o IP
real ao fim; não substitui. Então `xff.split(",")[0]` é o valor que o cliente
inventou. O certo é **`CF-Connecting-IP`**. Qualquer limitador escrito sobre o
XFF nasce decorativo.

**`127.0.0.1` dentro do Worker é a própria Cloudflare.** O Postgres do projeto
é local (`127.0.0.1:5432`); apontar o Worker para lá dá 500 em toda rota
dinâmica. Já aconteceu.

**O teto do Worker é medido em GZIP, não em bytes brutos.** 3 MiB no Free.
Diagnosticar tamanho em bytes brutos leva a conclusão errada — já custou três
diagnósticos seguidos. O build usa `--webpack` de propósito: o Turbopack
duplicava o Drizzle oito vezes.

**O globo 3D roda em `<iframe>` com tokens de cor próprios.** CSP que não
libere `frame-src 'self'` e os tiles do Esri (`server.arcgisonline.com`) apaga
o mapa.

## Regra nº 5 — duas máquinas, memória que não sincroniza

`home-pc` (PC servidor: Postgres, build, deploy) e `desktop-fefpddp` (PC
externo: dado bruto do CAR/INCRA). A memória do assistente é **local por
máquina** e não sincroniza — estado de projeto vive no repositório, nunca na
memória. Ver `docs/MAQUINAS.md` no `terras-devolutas`.

## Como conduzir a revisão

1. **Rode `python scripts/checar-dado-pessoal.py`** — é o piso.
2. **Classifique pela CONSEQUÊNCIA, não pela categoria:**
   - **CRÍTICO** — alguém de fora escreve/apaga dado, executa código, ou lê
     dado pessoal que não deveria estar público.
   - **IMPORTANTE** — caminho concreto, precisa de outra condição.
   - **HIGIENE** — boa prática sem caminho de ataque hoje.
3. **Confirme cada achado no código.** Não aceite relato de subagente sem
   olhar: numa revisão de 13/08, três afirmações do relatório estavam erradas e
   a ordem de prioridade estava invertida.
4. **Termine respondendo em uma frase:** se alguém decidisse derrubar ou
   adulterar este projeto hoje, por onde entraria primeiro? É a pergunta que o
   dono realmente faz.

## Nunca

- Atacar de verdade: força bruta, fuzzing, varredura agressiva, payload
  destrutivo. Observar e ler código.
- Mudar configuração de máquina ou da Cloudflare durante a avaliação.
- `git push --force` ou reescrita de histórico sem decisão explícita do dono —
  a limpeza dos CPF antigos do histórico está **parada na gaveta**, à espera
  disso.
