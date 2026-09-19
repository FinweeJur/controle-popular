# AGENTS.md — o que todo agente precisa saber antes de tocar neste repositório

> Lido automaticamente por opencode e por outros agentes de terminal.
> Reescrito em 19/09/2026 com o estado medido do mesmo dia.
> **Cada regra tem uma medição ou um estrago atrás. Nada aqui é preferência
> de estilo.** Histórico dos incidentes: [docs/historico/](docs/historico/).

**Palavras-chave:** agente, worktree, commit, pathspec, dado pessoal, CPF,
guara, neon, cloudflare, tunnel, deploy, loader, testes, idioma.

## Sumário

- [1. O que é o projeto](#1-o-que-é-o-projeto)
- [2. Como ler a documentação](#2-como-ler-a-documentação)
- [3. Estado vivo, em poucas linhas](#3-estado-vivo)
- [4. Onde as coisas moram](#4-onde-as-coisas-moram)
- [5. Regras que não se negociam](#5-regras-que-não-se-negociam)
- [6. Armadilhas que já custaram tempo](#6-armadilhas)
- [7. Regra editorial](#7-regra-editorial)
- [8. Página com muito dado tem cinco coisas](#8-página-com-muito-dado-tem-cinco-coisas)
- [9. Como verificar](#9-como-verificar)
- [10. Ferramentas de CLI desta máquina](#10-ferramentas)
- [11. Coleta de dado de fonte pública](#11-coleta-de-dado)
- [12. Como falar com o dono](#12-como-falar-com-o-dono)

## 1. O que é o projeto

Portal cívico de transparência **controlepopular.com.br**.
Monorepo Next.js 16. Três modos de publicar:

| Alvo | O que é | Papel hoje (19/09) |
|---|---|---|
| **Guara Cloud** | PaaS brasileira — plataforma que hospeda código, cobrança em Reais, datacenter em São Paulo | **principal** — `www` ativa |
| Cloudflare Workers (OpenNext) | servidor "sem servidor" na borda da Cloudflare | fallback técnico |
| Cloudflare Tunnel do `home-pc` | túnel que expõe este PC à internet | servidor 2 / emergência |

Seis frentes: [Cidades](docs/01-produto/PRODUTO.md),
Congresso, Judiciário, Função Social da Terra, Paraopeba e ONSA
(Observatório Nacional Socioambiental, ver [PRODUTO.md](docs/01-produto/PRODUTO.md)).

**"Busca com potencial de interesse social"** governa toda coleta:
social (direitos, desigualdade), ambiental (água, licença, esgoto),
econômico (concentração, PPP, poder de mercado), educação (microresumos,
tendência, porcentagem). Antes de coletar: pense no impacto social do dado.
**Dupla verificação sempre:** 2× método, cálculo e raciocínio. Link sempre
à fonte oficial (formato ABNT: Autor, Data) com hiperlink e botão "Fonte".

**Não é um site comum.** O leitor está sob estresse — denúncia, remoção,
barragem. Isso muda o padrão em três pontos concretos:
acessibilidade não é opcional, **número errado é dano**, e **insinuação é
dano mesmo quando cada dado isolado está certo**.

## 2. Como ler a documentação

Ninguém lê tudo. Nunca. A entrada é [`docs/README.md`](docs/README.md).
Guia de escrita e template: [`docs/GUIA-DE-DOCUMENTACAO.md`](docs/GUIA-DE-DOCUMENTACAO.md).

| Situação | Leia |
|---|---|
| Sempre, antes de qualquer tarefa | [`01-produto/PRODUTO.md`](docs/01-produto/PRODUTO.md) |
| Saber o que fazer agora: fila, fila bloqueada, dívida | [`02-estado/ESTADO.md`](docs/02-estado/ESTADO.md) |
| Antes do primeiro commit | [`03-desenvolvimento/DESENVOLVIMENTO.md`](docs/03-desenvolvimento/DESENVOLVIMENTO.md) |
| Mexer em rota, payload ou banco | [`04-arquitetura/ARQUITETURA.md`](docs/04-arquitetura/ARQUITETURA.md) |
| Publicar, coletar, buildar | [`05-operacao/OPERACAO.md`](docs/05-operacao/OPERACAO.md) |
| Mexer em fonte ou dado coletado | [`06-fontes/FONTES.md`](docs/06-fontes/FONTES.md) |
| Editar conteúdo sem código | [`07-edicao/EDICAO.md`](docs/07-edicao/EDICAO.md) |

Valide qualquer edição com `python scripts/validar-documentacao.py`.
A CI roda o mesmo script (`.github/workflows/docs.yml`).

## 3. Estado vivo

1. **Banco: Neon (Postgres gerenciado) ativo, storage em ~94% (470/500 MB).**
   Não se põe coleta nova lá. A pendência é a **Fase 4**: migrar para o
   Postgres gerenciado do Guara (1 GiB incluso, 2 GiB máximo). Ver
   [ESTADO.md, fila](docs/02-estado/ESTADO.md#fila-viva).
2. **`DATABASE_URL` configurada no Guara em runtime e build** (19/09).
   Página que lê do banco no build só sai com dado quando a variável existe
   no build — ver armadilha na [tabela §6](#6-armadilhas).
3. **Publicação:** push na `main` → CI roda testes → deploy automático do
   Guara (`GUARA_API_KEY` secretada no GitHub). Manual: `guara deploy`.
4. **Domínio:** `www.controlepopular.com.br` é o site. A raiz
   `controlepopular.com.br` **não existe no Guara** (não aceita domínio
   "apex", ver §6) e depende de redirect 301 no Cloudflare — pendência do dono.
5. **Quem publica é este PC (`home-pc`)**: builda, testa, pusha. O túnel do
   `home-pc` continua de pé como servidor 2.

Tato é melhor que suposição: além de estimar tamanho ou estado, **remeça**.

## 4. Onde as coisas moram

```
apps/web/app/         rotas (App Router). *.din.ts só existe no alvo Cloudflare
apps/web/lib/         lógica pura + testes ao lado (padrão: <mod>.ts + <mod>.test.ts)
apps/web/lib/db/      Drizzle (ORM = tradutor de código para SQL): schema e queries
apps/web/data/        dado versionado, lido no build — compacte antes de commitar
apps/web/scripts/     geradores (cidades-do-build, índice de busca)
scripts/              coletores, agentes e rotinas (rotina-local.mts publica)
docs/                 índice: docs/README.md
```

**Compactação de dado:** `apps/web/lib/comunicabr/arquivo.ts` e
`apps/web/lib/estatico/compactar.ts` (esqueleto + rótulos internados).
Fez 853 municípios caberem em 2,16 MB e 7,9 MB da Rouanet virarem 2,4 MB
(−69%). ⚠️ São **duas** implementações deliberadamente diferentes (decisão
de 16/08, [ESTADO.md § dívida](docs/02-estado/ESTADO.md#dívida-técnica-registrada)):
não unificar sem remedir — aplainar o codec perde o ganho de ordem de grandeza.

**Código IBGE, fonte única:** `scripts/etl/municipios/seed-municipios-mg.mts`
baixa os 853 municípios de MG da API do IBGE → `apps/web/data/municipios-mg.json`.

## 5. Regras que não se negociam

### 5.1. Coleção nunca como props de componente de cliente

Foi assim que `/ambiental/legislacao` chegou a **35,5 MiB** contra o teto de
25. O payload serializa 3× (HTML, RSC flight, `segmentData`) e cada linha
repete o nome de todos os campos: **inflação de 7,5×**.
Acima de ~2 mil linhas: índice fatiado ou paginação no servidor.
**Onze listas já usam `apps/web/app/[municipio]/components/TabelaEstatica.tsx`**
(medido 16/08 — remeça antes de decidir com ele). Siga uma delas.

### 5.2. Dado pessoal: varrer o DADO, não só o código

Em 15/08 este repositório público publicou **CPF real** duas vezes, por dois
caminhos:

- dentro da **ementa oficial** de um TAC do IBAMA (o ato público traz o dado);
- **215 CPFs colados ao NOME** no acervo Rouanet (a fonte mascarava o campo).

Lições, todas com código no repo:

- `apps/web/lib/sem-cpf-no-repo.test.ts` valida CPF **por mod-11** (o dígito
  verificador do próprio CPF) no código versionado.
- `scripts/checar-dado-pessoal-em-dado.py` varre o **dado ingerido** — os JSON
  dos diretórios listados em `DIRETORIOS_DADO` (topo do script). Roda no
  pre-push, na CI e na suíte.
- Coletor novo que grava JSON a cada rodada **entra em `DIRETORIOS_DADO`** —
  o flag `--extra` cobre um dump só, não o pre-push.
- Rode a suíte **antes** de commitar dado coletado. Sempre.

### 5.3. `--force` nunca

É a única operação capaz de apagar trabalho de outra sessão sem volta.
Consequência: mensagem de commit torta publicada não tem conserto (ver §5.6).

### 5.4. Worktree próprio, porta própria

**Anexar no dev server de outro checkout responde 200 com o código errado,
sem avisar** — a pior forma de errar numa verificação. Cada sessão de
assistente opera no próprio worktree, com porta própria em
`.claude/launch.json`. O fluxo completo (junção de `node_modules`, portas,
órfãos) está em [DESENVOLVIMENTO.md](docs/03-desenvolvimento/DESENVOLVIMENTO.md).

### 5.5. Commit por pathspec explícito

```bash
git diff --cached --name-only   # tem que estar vazio ANTES
git commit --only <caminho> -F <arquivo-de-mensagem>
```

`git commit` sem caminho leva tudo em staging — **inclusive o que outra
sessão deixou lá**. Aconteceu duas vezes em 15/08 e as duas foram pushadas.
Arquivo novo precisa de `git add` antes.

### 5.6. Mensagem de commit por ARQUIVO, nunca `-m`

- Crase dentro de aspas duplas no Bash vira substituição de comando e come
  o texto — com `git commit` retornando sucesso.
- Here-string de PowerShell (`@'...'@`) no Bash deixa `@` sozinho no título.

As duas falhas aconteceram em 15/08; as duas foram pushadas antes de alguém
ver. Escreva a mensagem num arquivo e use `git commit -F`. Português, sem
acento, terminando com o trailer `Co-Authored-By`.

### 5.7. Publique o próprio trabalho

```bash
git fetch origin && git rebase origin/main && git push origin HEAD:main
```

Ninguém integra o trabalho de ninguém. Durante build/deploy nesta máquina,
**segure o push**.

### 5.8. Privacidade contra agentes de IA

- [`.gitignore`](.gitignore) não protege contra leitura por IAs: agentes
  varrem o disco e enviam trechos ao provedor do modelo.
- Nunca leia nem exiba segredos (`.env*`, `.dev.vars*`, `*service-account*.json`,
  `gcp*.json`, `.pem`, `.key`). Deny rules ativas em `.claude/settings.json`
  e `.cursorignore`.
- Nunca envie dado pessoal bruto (CPF) para prompts de IA — sanitize antes.
- Sessões que exigem anonimato: Git com o e-mail `noreply` do provedor.

## 6. Armadilhas

Cada linha já custou tempo real. A tabela vive aqui — única, sem duplicata.

| Armadilha | O que acontece |
|---|---|
| **Guara não aceita domínio apex** | `guara domains add` na raiz devolve `APEX_DOMAIN_NOT_SUPPORTED` (19/09). Só `www` mora lá; a raiz vive de redirect 301 no Cloudflare |
| **Env do Guara sem `-b` não entra no build** | página pré-renderizada lê o banco no build; sem `DATABASE_URL` no build o HTML congela vazio até rebuild. `config_change` só reinicia — deploy de imagem nova (`guara deploy`) é o que reconstrói (19/09, deploys `de291a9b`/`5a4a08cc`) |
| **Loader pequeno ≠ loader grande** | o pequeno é o `DotsRing` (framer-motion, buscador e `LoadingOverlay`); o grande é o `WavePhysicsLoader` (transição de página e gráficos). Não troque o grande nem use biblioteca de loader nova (dono, 19/09) |
| **Testes acoplados a `CIDADES_DO_BUILD`** | `LIMITE_CANDIDATOS = 8` no assistente e testes de guarda de lugar citam cidades não atendidas por nome. A lista de cidades do fallback passou de 6 para 12 (`10f2dcdc`) e 4 testes quebraram (consertados 19/09). Adicionar cidade = regerar `cidades-do-build` e revisar esses testes |
| **`guara security findings` com bug** | pacote faltando no CLI 0.3.0. O scan válido é `guara services vulnerabilities` (Trivy) |
| **`git -C` em pasta órfã** | pasta sem `.git` faz o comando subir e executar no checkout principal (7 casos em 15/08). Confira com `git worktree list` |
| **`rm -rf` em junção do Windows** | pode seguir o link e apagar o `node_modules` do repo. Remova o link com `cmd /c rmdir` |
| **Conflito em `.claude/launch.json`** | quase sempre "manter as duas versões" — exceto mesmas portas. São três marcadores: `}` e `{` onde estava `=======` senão o JSON quebra |
| **API responde 200 e mente** | filtro inexistente devolve tudo; `sort` ignorado em silêncio; código IBGE errado devolve esqueleto vazio. Valide o CONTEÚDO, nunca o status |
| **IBGE 6 × 7 dígitos** | o de 6 é o de 7 sem o dígito verificador. Betim `3106705`/`310670`; `3106200` é Belo Horizonte |
| **Casar município por nome** | grafia diverge entre tabelas oficiais. Case por código; relate o que não casou |
| **`cmd.exe` não expande `*`** | `npm` roda script por `cmd.exe /d /s /c`; glob chega literal. Use diretório, não glob |
| **Medir cor em HSL** | a paleta está em OKLCH (`css/tokens/colors.css`). Espaço errado inverte a conclusão |
| **Contraste com transição congelada** | `transition: background .3s` no `body`; injete `transition:none !important` antes de medir |
| **`ENOTEMPTY` no `next build` (Windows)** | limpe o cache antes: `cmd.exe /c "if exist apps\web\.next rmdir /s /q apps\web\.next"` |
| **Documentação fora do padrão** | CI quebra sem `Tipo`, `Domínio`, `Última medição`, `## Sumário`. Rode `python scripts/validar-documentacao.py` |
| **Contêineres locais = Podman no WSL2** | Podman 5.x rootless no WSL2 (Ubuntu), nunca Docker Desktop. Portas fixas: 5000, 5678 |

## 7. Regra editorial

O portal republica ato oficial e dado público. **A tentação é pôr dois dados
verdadeiros lado a lado** e deixar o leitor concluir um terceiro, falso.
Casos reais do repo:

- **Repasse do Acordo:** 827 das 853 cidades não têm relação com a bacia.
  A tela diz com letras que receber não significa ter sido atingida, e mostra
  população ao lado do valor.
- **Incentivador × fornecedor:** aparecer nos dois acervos não é troca de
  favor. Junção é ponto de partida para investigar, não achado.
- **`total_doado` da Rouanet é do Brasil inteiro.** A ressalva via colada ao
  número, ou o número não vai.
- **Resumo de modelo é o portal afirmando.** Rotule: gerado por máquina, com
  data e modelo. Nunca como conclusão do autor do documento.
- **Lacuna é informação.** Diga quantos itens vieram vazios.

Resumo: **o número vem do dado; o modelo, se houver, só embrulha.**
Se a fonte não tem, a resposta é "não sei, e aqui está o que existe perto".

## 8. Página com muito dado tem cinco coisas

**Regra do dono, 21/08/2026.** Vale para toda página que publica lista grande
— licenciamento, TACs, convênios, decisões, barragens, estudos, contratos:

1. **Gráfico** — evolução ou distribuição, SVG inline ou CSS. Não se instala
   biblioteca de gráfico.
2. **Cartões de topo** — os agregados que respondem "quanto é isso?".
3. **Planilha** — CSV do que está filtrado na tela, não do conjunto inteiro.
   Separador `;` e BOM UTF-8 (marcação que faz o Excel brasileiro ler acento).
4. **Filtro** — pelos campos que o acervo realmente tem. Filtro que devolve
   vazio sempre é pior que filtro nenhum.
5. **Ordenação por coluna** — inclusive por tipo/classe, não só por data.

Essa regra não dispensa:

- a página de servidor importa o **agregado** (`COBERTURA_*`), nunca o array
  inteiro — já houve `.ts` de 14,6 MB no repo por ignorar isso
  (`TS2590: union type too complex` foi o aviso do TypeScript);
- gráfico com alternativa em texto ou tabela; cor nunca é o único canal;
- número na tela vem de constante medida com data — não digite total à mão;
- **página que lê do banco só mostra as cinco coisas quando o banco responde.**
  Conferir `/ambiental/licenciamento` e `/ambiental/copam` exige HTML
  pré-renderizado com banco de pé. "Página vazia" ≠ "código faltando".

## 9. Como verificar

```bash
npm test                 # raiz: vitest (lib/**/*.test.ts) + node:test (globo 3D)
npx tsc --noEmit
```

Baseline em 19/09: **1.579 testes no vitest + 146 no globo**.
Armadilha que virou teste, não comentário: em 15/08 um comentário errado
sobre código IBGE sobreviveu meses e copiou-se para uma tarefa. Quem pegou
foi um teste que compara código com nome. Comentário errado continua
convincente — teste não.

## 10. Ferramentas

CLI desta máquina, medido em 19/09:

| Ferramenta | O que faz | Exemplo |
|---|---|---|
| `guara` 0.3.0 | CLI do Guara Cloud: deploy, env, domains, logs | `guara env set -b KEY=valor` |
| `neonctl` 5.0.0 | CLI da Neon: connection string, branches | `neonctl cs` |
| `gh` 2.96 | CLI do GitHub: secrets, workflows | `gh secret set KEY --body "..."` |

Anotações:

- `guara security findings` está quebrado (pacote faltando no CLI). O scan
  válido é `guara services vulnerabilities` (Trivy — scanner de imagem).
- Secrets do repo: `GITHUB` via `gh secret list`. **`GUARA_API_KEY` já
  secretada** (19/09).
- `DATABASE_URL` vive no painel do Guara (runtime **e** build, flag `-b`).
  A string da Neon se recupera com `neonctl connection-string`.
- Segredos nunca vão para o repositório nem para prints. Deny rules ativas.

## 11. Coleta

- Pausa entre requisições: 1–2 s por host (tabela completa em
  [FONTES.md, regras gerais](docs/06-fontes/FONTES.md)).
- **User-Agent honesto** (é a "identificação" que o navegador envia ao
  servidor): o nome do projeto, nunca UA de navegador falso.
- Retomada por checkpoint; coleta fora da CI.
- Leia o `robots.txt` (o "aviso de cortesia" que cada site publica) e
  registre a decisão no cabeçalho do coletor se seguir mesmo assim — há um
  caso no repo (`www18.fgv.br` responde `Disallow: /`), a pedido do dono,
  com escopo reduzido e o raciocínio escrito.
- Varrer dado pessoal antes de commitar. Sempre.

## 12. Como falar com o dono

**Regra do dono, 01/09/2026.** Vale para respostas, relatórios e commits.

- **Frases até 13 palavras.** Uma ideia por linha.
- **Oração direta:** sujeito, verbo, objeto.
- **Termo técnico com explicação na frente.** Exemplo: "o wrangler é o
  carteiro do deploy — é ele quem entrega o site pronto para a Cloudflare".
- **Emojis para guiar o olho:** ✅ feito, 🚧 em andamento, ⛔ bloqueado,
  ⚠️ atenção.
- **Quebre linhas com frequência.** Quem lê é leigo, e leigo lê devagar.
- **Ensine com analogia.** Compare o novo com algo do dia a dia.
- **Nunca presuma que o leitor sabe.** Sigla? Explique. Número? Diga de onde
  veio.
