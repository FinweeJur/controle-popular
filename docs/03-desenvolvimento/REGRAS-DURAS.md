# Regras duras do repositório

> **Tipo:** GUIA
> **Domínio:** global (commit, dado pessoal, publicação, interface, modelos)
> **Última medição:** 2026-10-18
> **Leitura estimada:** média (10–20 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [DESENVOLVIMENTO.md](DESENVOLVIMENTO.md), [ARMADILHAS.md](/ARMADILHAS.md), [OPERACAO.md](../05-operacao/OPERACAO.md)
> **Palavras-chave:** regras, commit, pathspec, worktree, cpf, dado-pessoal, seguranca, deploy, webhook, telegram, ollama, acessibilidade, responsividade, modelo-ia

## Sumário

- [5.1. Coleção nunca como props de componente de cliente](#51-coleção-nunca-como-props-de-componente-de-cliente)
- [5.2. Dado pessoal: varrer o DADO, não só o código](#52-dado-pessoal-varrer-o-dado-não-só-o-código)
- [5.3. `--force` nunca](#53---force-nunca)
- [5.4. Worktree quando há briga, sessão nova quando o contexto fica sujo](#54-worktree-quando-há-briga-sessão-nova-quando-o-contexto-fica-sujo)
- [5.5. Commit por pathspec explícito](#55-commit-por-pathspec-explícito)
- [5.6. Mensagem de commit por ARQUIVO, nunca `-m`](#56-mensagem-de-commit-por-arquivo-nunca--m)
- [5.7. Commit e push: sempre, na hora](#57-commit-e-push-sempre-na-hora)
- [5.7.1. Push = deploy manual (cota de build do Guara)](#571-push-deploy-manual-cota-de-build-do-guara)
- [5.8. Privacidade contra agentes de IA](#58-privacidade-contra-agentes-de-ia)
- [5.9. Código tem SIM comentários explicativos e função clara](#59-código-tem-sim-comentários-explicativos-e-função-clara)
- [5.10. Fonte mínima da descrição da página](#510-fonte-mínima-da-descrição-da-página)
- [5.11. O webhook do bot do Telegram aponta para o portal, só](#511-o-webhook-do-bot-do-telegram-aponta-para-o-portal-só)
- [5.12. Ollama local: confira hardware e modelos, delegue o repetitivo, poupe token](#512-ollama-local-confira-hardware-e-modelos-delegue-o-repetitivo-poupe-token)
- [5.13. Casca persistente: link interno navega no cliente, nunca recarrega](#513-casca-persistente-link-interno-navega-no-cliente-nunca-recarrega)
- [5.14. O celular é a régua: responsividade e legibilidade são qualidade do dado](#514-o-celular-é-a-régua-responsividade-e-legibilidade-são-qualidade-do-dado)
- [5.15. Modelo de IA escolhido pela dificuldade da tarefa, barato primeiro](#515-modelo-de-ia-escolhido-pela-dificuldade-da-tarefa-barato-primeiro)

O [AGENTS.md](/AGENTS.md) resume cada regra em uma linha. Este documento guarda o texto completo, o motivo e a medição que originou cada uma. Onde houver conflito, o AGENTS manda; aqui está o porquê.

## 5.1. Coleção nunca como props de componente de cliente

Foi assim que `/ambiental/legislacao` chegou a **35,5 MiB** contra o teto de
25. O payload serializa 3× (HTML, RSC flight, `segmentData`) e cada linha
repete o nome de todos os campos: **inflação de 7,5×**.
Acima de ~2 mil linhas: índice fatiado ou paginação no servidor.
**Onze listas já usam `apps/web/app/[municipio]/components/TabelaEstatica.tsx`**
(medido 16/08 — remeça antes de decidir com ele). Siga uma delas.

## 5.2. Dado pessoal: varrer o DADO, não só o código

Em 15/08 este repositório público publicou **CPF real** duas vezes, por dois
caminhos:

- dentro da **ementa oficial** de um TAC do IBAMA (o ato público traz o dado);
- **215 CPFs colados ao NOME** no acervo Rouanet (a fonte mascarava o campo).

Lições, todas com código no repo:

- `apps/web/lib/sem-cpf-no-repo.test.ts` valida CPF **por mod-11** (o dígito
  verificador do próprio CPF) no código versionado.
- `scripts/checar-dado-pessoal-em-dado.py` varre o **dado ingerido** — os JSON
  dos diretórios listados em `DIRETORIOS_DADO` (topo do script). Roda na
  suíte e na CI, e no pre-push **quando o hook está ligado**.
- **O pre-push é ligado SOZINHO no `npm install`** (o `postinstall` roda
  `scripts/configurar-hooks.mjs`, criado em 09/10/2026). Antes o comando era
  manual — `git config core.hooksPath .githooks` — e já foi medido vazio nesta
  máquina em 01/10/2026: o hook morava no repo e não executava. Sem ele o dado
  só é barrado pela CI, **depois** do push. Confira com
  `git config --get core.hooksPath` (deve dizer `.githooks`); se estiver vazio,
  `npm run setup` re-liga à mão.
- A régua de dado tem **duas etapas**: mod-11 (sempre roda) e `validate-docbr`
  (confirma o CPF e derruba falso positivo). Sem a biblioteca instalada a
  segunda vira aviso no stderr — o CI instala, o clone nem sempre.
- Coletor novo que grava JSON a cada rodada **entra em `DIRETORIOS_DADO`** —
  o flag `--extra` cobre um dump só, não o pre-push.
- Rode a suíte **antes** de commitar dado coletado. Sempre.

## 5.3. `--force` nunca

É a única operação capaz de apagar trabalho de outra sessão sem volta.
Consequência: mensagem de commit torta publicada não tem conserto (ver §5.6).

## 5.4. Worktree quando há briga, sessão nova quando o contexto fica sujo

**Anexar no dev server de outro checkout responde 200 com o código errado,
sem avisar** — a pior forma de errar numa verificação. A regra é
condicional:

| Situação | Regra |
|---|---|
| 1 sessão só no PC | commit direto na `main`, pathspec explícito |
| 2+ sessões ao mesmo tempo | worktree + branch próprio, porta própria, rebase e push rápido |

O ganho do worktree nunca foi o branch (branch é grátis) — é o disco
separado: dois `next build` brigando no mesmo `.next`, dois dev servers,
staging misturado (aconteceu 2× em 15/08). Sem briga, é imposto sem
retorno.

**Quando abrir sessão nova** — pelo SINTOMA, não pelo tamanho:

- **contexto sujo, não "longo":** a sessão repete decisão já resolvida,
  carrega thread abandonada ou divergiu do combinado. Modelo de 1M de
  contexto pode seguir, se o fio estiver coerente; o `/cp` carrega o
  estado durável entre sessões. **Tamanho de janela não é o gatilho** — e a
  regra não se amarra a modelo (256k, 1M, o que vier);
- para acelerar — tarefas independentes correm lado a lado (global
  AGENTS: agentes paralelos, uma sessão por tarefa, divisão por arquivo);
- qualquer ferramenta serve (OpenCode, Hermes, Picoclaw, Cutiazinho):
  uma tarefa por agente, arquivos de saída distintos, e o humano
  integra ao final. Alternar ferramenta conta como "sessão nova".

O fluxo completo (junção de `node_modules`, portas em `.claude/launch.json`,
órfãos) está em [DESENVOLVIMENTO.md](DESENVOLVIMENTO.md).

## 5.5. Commit por pathspec explícito

```bash
git diff --cached --name-only   # tem que estar vazio ANTES
git commit --only <caminho> -F <arquivo-de-mensagem>
```

`git commit` sem caminho leva tudo em staging — **inclusive o que outra
sessão deixou lá**. Aconteceu duas vezes em 15/08 e as duas foram pushadas.
Arquivo novo precisa de `git add` antes.

## 5.6. Mensagem de commit por ARQUIVO, nunca `-m`

- Crase dentro de aspas duplas no Bash vira substituição de comando e come
  o texto — com `git commit` retornando sucesso.
- Here-string de PowerShell (`@'...'@`) no Bash deixa `@` sozinho no título.

As duas falhas aconteceram em 15/08; as duas foram pushadas antes de alguém
ver. Escreva a mensagem num arquivo e use `git commit -F`. Português, sem
acento, terminando com o trailer de coautoria.

**Regra do dono (30/09/2026): o trailer traz SEMPRE o MODELO e a PLATAFORMA,
um por linha.** Hoje:

    Co-Authored-By: DeepSeek V4.1 Flash <noreply@deepseek.com>
    Co-Authored-By: opencode <noreply@opencode.ai>

Trocar de modelo ou de plataforma = trocar as duas linhas; nunca deixar só
uma. Modelo e plataforma são a procedência do commit — quem audita precisa
saber os dois.

## 5.7. Commit e push: sempre, na hora

**Regra do dono, 11/10/2026: todo trabalho terminado vira commit e vai
para o GitHub na hora.** Trabalho que existe só no PC não existe — some
em travamento, em disco cheio, em sessão fechada por engano. Ninguém
integra o trabalho de ninguém, e ninguém tem obrigação de adivinhar o
que você deixou no meio.

```bash
git fetch origin && git rebase origin/main && git push origin HEAD:main
```

**O push não publica.** O auto-deploy está desligado (§5.7.1), então
empurrar é livre e não entrega página a ninguém. O que exige permissão
é o build — e só ele.

Única espera: enquanto um build ou deploy roda **nesta máquina**, segure
o push até ele terminar. Dois `next build` brigando no mesmo `.next`
já custaram uma verificação errada (ver [ARMADILHAS.md](/ARMADILHAS.md)).

## 5.7.1. Push = deploy manual (cota de build do Guara)

Auto-deploy desligado no Guara (19/09). Um build gasta ~17 min e o
plano Starter tem teto de 250 min/ciclo.

**Regra do dono, 11/10/2026: NÃO dispare deploy sem pedir antes.**
Commit e push seguem livres — o auto-deploy está desligado, então o push
não publica sozinho. Publicar (Azure ou Guara) só depois de o dono dizer
que pode. Na dúvida, pergunta: o build roda ~6 min e entrega a página
para todo mundo na hora, e o dono quer conferir antes.

- **Deploy no Guara só a cada ~5 dias** (política do dono) — detalhe e
  ritual em [OPERACAO.md § 0](../05-operacao/OPERACAO.md#0-cadência-de-deploy-política-do-dono-19092026).
- **Publicar no Azure é o caminho principal desde 06/10/2026** e não gasta
  cota do Guara: `gh workflow run azure-mirror.yml --ref main` (build da
  imagem no CI, ~6 min, → GHCR → Container App). Só o certificado do domínio:
  `gh workflow run azure-certificado.yml` (~1 min). Trocar os CNAMEs entre as
  duas casas: `gh workflow run trocar-dominios.yml -f confirmar=TROCAR`.
- Commit muitas vezes, deploy uma (o último commit).
- Teste diário no **servidor 2** (túnel do `home-pc`) e localhost —
  não gasta cota.
- Deploy só se a mudança afecta a imagem. Suíte + `tsc` verdes antes.

## 5.8. Privacidade contra agentes de IA

- [`.gitignore`](/.gitignore) não protege contra leitura por IAs: agentes
  varrem o disco e enviam trechos ao provedor do modelo.
- Nunca leia nem exiba segredos (`.env*`, `.dev.vars*`, `*service-account*.json`,
  `gcp*.json`, `.pem`, `.key`). Deny rules ativas em `.claude/settings.json`
  e `.cursorignore`.
- Nunca envie dado pessoal bruto (CPF) para prompts de IA — sanitize antes.
- Sessões que exigem anonimato: Git com o e-mail `noreply` do provedor.

## 5.9. Código tem SIM comentários explicativos e função clara

**Regra do dono, 25/09/2026.** O Controle Popular é software cívico público
e auditável. Código sem comentário é código opaco que prejudica a
transparência e a continuidade do projeto:

- **Cabeçalho de arquivo obrigatório:** todo `.ts`, `.tsx`, `.py`, `.mjs`
  deve abrir com bloco de comentário (JSDoc ou docstring) explicando:
  1. O que é o módulo e qual seu papel no portal;
  2. A fonte oficial dos dados ou regras de negócio relacionadas;
  3. Decisões técnicas ou restrições não triviais adotadas.
- **Funções, queries e rotinas:** toda função pública, query do banco,
  hook ou rota de API deve documentar o que faz, parâmetros e retorno.
- **Explique o "porquê", não apenas o "o que":** o código diz como é feito;
  o comentário explica *por que* foi feito assim (ex.: por que o DV do IBGE usa
  módulo 10 com pesos 1 e 2, por que filtramos certas esferas, por que o
  timeout de determinada API pública precisa ser mais longo).
- **Linguagem:** português claro, direto, acessível tanto para desenvolvedores
  quanto para cidadãos e pesquisadores que queiram auditar o código.

## 5.10. Fonte mínima da descrição da página

**Regra do dono, 29/09/2026.** O portal atende gente sob estresse — denúncia,
remoção, barragem. Letra miúda na descrição é barreira de leitura. A descrição
que fica **abaixo do título** de cada página (o parágrafo de resumo logo depois
do `<h1>`) tem piso e teto de comportamento:

- **Nunca menor que `text-sm`** (14px). Vale para a descrição da PÁGINA sob o
  título — não é regra para cards de listagem, chips ou legendas de tabela.
- Descrição longa (mais de ~2 linhas) ganha o controle **"Ver + Texto"**:
  aparece recolhida e abre no clique, para não empurrar o conteúdo.
- O componente de referência é `ResumoExpandivel`; reutilize, não recrie.
- Quem aumentar a fonte de uma página mantém o contraste: o texto sobre foto
  usa contorno e sombra (`CapaFrente.tsx`), e o alvo continua AA ≥ 4,5:1.

## 5.11. O webhook do bot do Telegram aponta para o portal, só

**Regra do dono, 01/10/2026.** O bot público entrega mensagem de cidadão. O
destino dela tem de ser o site oficial — e nada mais. O dono fala com o bot
pelo celular dele, através da API do Telegram; não existe "relay", "proxy de
webhook" nem endereço de terceiro no meio.

O que aconteceu, medido: em 25/09/2026 uma sessão de agente (commit `6d224a45`,
`Co-Authored-By: Antigravity`) gravou `tele.goldenherd.com` numa constante
`WEBHOOK_URL` e a **restaurava** a cada ciclo de um vigia. O dono nunca
configurou esse endereço. Efeito em 01/10/2026: toda mensagem de usuário ia
para lá, e o `/menu` do portal não recebia nada — o conserto de 30/09 era
desfeito pelo ciclo. A avaliação do dono é injeção de prompt ou alucinação.

Vale para todo agente, e não depende de boa vontade:

- webhook do bot público só em `https://www.controlepopular.com.br/api/telegram`
  (o apex é o mesmo dono, mas dá 301 — o Telegram não segue redirect);
- bot de trabalho (dev de código) é **long-poll**, nunca webhook — os dois
  caminhos são exclusivos no Telegram;
- novo endereço de webhook exige decisão explícita do dono, registrada aqui;
- a régua automática é `scripts/checar-webhook-telegram.py`, no pre-push e na
  action `dado-pessoal.yml`; `scripts/telegram-set-webhook.mts --verificar`
  confere o endereço vivo na API do Telegram.

## 5.12. Ollama local: confira hardware e modelos, delegue o repetitivo, poupe token

**Regra do dono, 03/10/2026.** Antes de delegar trabalho, **verifique o
hardware e quais modelos do Ollama estão de fato rodando no PC**. Avalie quais
tarefas dá para entregar/automatizar pelo Ollama de forma rápida, sem atrasar a
sessão, e com isso poupar tokens — criando e melhorando rotinas nativas.

O que aconteceu, medido em 03/10/2026: subagentes de nuvem morreram por
**esgotamento de tokens** no meio de tarefas e o trabalho só não se perdeu
porque tinha ficado no disco. Tarefa mecânica e volumosa (triagem, resumo,
classificação, revisão de milhares de linhas) não precisa queimar token de
nuvem: o Ollama local roda sem custo e **sem mandar dado para fora da máquina**
— o que casa com a §5.8.

Vale para todo agente:

- **confira o hardware e o modelo ANTES de usar**: `ollama list` mostra o que
  existe e `curl -s http://127.0.0.1:11434/api/tags` confirma no servidor.
  Lista não é prova: em 03/10/2026 o `qwen2.5:7b-instruct-q4_K_M` aparecia na
  lista e o servidor respondia **404 `model not found`** na geração. Teste com
  uma geração real (`/api/chat`) antes de confiar;
- **delegue o repetitivo, não o julgamento**: vai para o Ollama o que é
  volume + regra clara (triagem, resumo, casar texto, revisar consistência).
  Fica com o agente o que exige decisão, commit, deploy ou auditoria (§5.5,
  §5.7.1) — e NADA de segredo sai do disco, nem para o Ollama (§5.8);
- **peça JSON** (`format: "json"`, `temperature: 0`) e valide o que volta;
  modelo pequeno solta texto livre e inventa. Sugestão de texto **não substitui
  o dado** — revisão assistida só propõe, o humano/agente aprova o diff
  (regra do resumo nunca reescrito por máquina, `lib/memoria/calendario.ts`);
- **rotinas nativas já prontas para reusar**: `scripts/analisar-dados-ollama.mts`,
  `scripts/automacao/triagem-diarios-ollama.mts`,
  `scripts/oficina/oficina.mts` (baixa modelo do perfil) e
  `scripts/revisar-textos-memoria.mts` (revisão da memória, criada 03/10/2026).

## 5.13. Casca persistente: link interno navega no cliente, nunca recarrega

**Regra do dono, 03/10/2026.** A barra superior, a faixa de desenvolvimento,
o rodapé, o assistente Seu Nonô, o companheiro (pet) e o player de rádio
moram no layout raiz e NÃO podem desmontar na navegação. O `<audio>` do
rádio e o estado do pet só sobrevivem se a troca de página for client-side.

- Todo link para PÁGINA interna usa `next/link` — inclusive os de `href`
  dinâmico (navbar, rodapé, cartões), que a regra `no-html-link-for-pages`
  do ESLint não enxerga;
- `<a href>` cru fica só para externo, `mailto:`/`tel:`, âncora pura (`#`),
  arquivo (`.pdf`, `.json`, imagens…) e `/api/...`;
- A rede de segurança é o `InterceptadorLinks` (`app/components/`), montado
  no layout raiz: captura o clique em qualquer `<a>` interno de página e o
  entrega ao router;
- Verificação: `scripts/verificar-radio-navegacao.py` (Playwright) percorre
  eixos, subfrentes e o top-100 clicando e confere se o áudio segue vivo.

## 5.14. O celular é a régua: responsividade e legibilidade são qualidade do dado

**Regra do dono, 10/10/2026.** O portal é lido no celular — muitas vezes sob
estresse, na rua. Dado que não cabe na tela, rótulo cortado ou tabela que só
existe no desktop é dado **não publicado**: ilegível é inacessível, e num
portal cívico inacessível é o mesmo que inexistente. Liga com a §1: se "número
errado é dano", **número ilegível também é**.

O que aconteceu, medido em 10/10/2026 em `/eleicoes/2026/gastos-campanha`: o
`<body>` do portal é `flex flex-col` e a `<main>` tinha `mx-auto` **sem
`w-full`**. Com margem automática o flex item deixa de esticar e passa a medir
o PRÓPRIO CONTEÚDO — a página media **1126 px numa tela de 390** (1.049
elementos fora da viewport), com rolagem lateral falsa e rótulo de gráfico
cortado na base.

Vale para toda página nova:

- **`<main>` de página carrega `w-full`** quando o `body` é `flex-col` — sem
  isso ela dimensiona pelo conteúdo e estoura a tela (a [ARMADILHAS.md](/ARMADILHAS.md)
  já guarda a armadilha irmã, `min-w-max` sem `min-w-0` no ancestral);
- **conteúdo largo rola, não estoura**: tabela e gráfico em `overflow-x-auto`;
  gráfico em SVG com `h-auto` e faixa do `viewBox` reservada para o rótulo;
- **a descrição sob o título nunca é menor que `text-sm`** (§5.10) e o
  contraste AA se mantém no tamanho de celular;
- **tablet conta:** 768 px abre na faixa média; o mesmo `overflow-x-auto` e a
  mesma faixa de `viewBox` valem, porque rótulo cortado também é dado ilegível;
- **verificação de camada**: abrir a página em viewport de **390 px** e
  conferir `document.documentElement.scrollWidth === window.innerWidth` —
  rolagem lateral falsa é a assinatura do defeito. Playwright com o Edge do
  sistema (`channel="msedge"`) basta, no molde de `scripts/verificar-*.py`.

Amarração com a §8: responsividade virou a **sétima qualidade** da informação
(10/10/2026) — as outras seis (ordenar, filtrar, exportar…) **não valem** se a
coluna não é legível no celular. A régua móvel vem antes.

## 5.15. Modelo de IA escolhido pela dificuldade da tarefa, barato primeiro

**Regra do dono, 18/10/2026.** O modelo acompanha a dificuldade — não o hábito:

- **Tarefa simples** (renomear, formatar, buscar, corrigir lint, resumo curto):
  modelo simples ou **reasoning desligado**; e **Ollama local** quando der
  (§5.12) — custo zero e nada sai da máquina (§5.8).
- **Tarefa difícil** (arquitetura, refatoração grande, raciocínio multi-passo):
  modelo avançado. Não gaste modelo grande em tarefa pequena, nem o contrário.
- **Barato primeiro, sempre:** comece pelos **modelos mais baratos do
  OpenCode Go** (`opencode-go/*` — DeepSeek V4.1 Flash, GLM-5.3-Flash, MiMo
  Flash). Só subir de tier se o barato falhar de verdade, e registre por quê.
- **Soberania de dados decide o motor, não só o custo** (regra do dono,
  18/10/2026; escada revisada no mesmo dia). Do mais fechado ao mais exposto:
  1. **Ollama local / Needle**: recebe **tudo**, inclusive CPF e denúncia —
     nada sai da máquina (§5.8, §5.12). Use para coisa **pontual, pequena,
     automação rápida** ou tarefa de **off-peak** que pode demorar (medido:
     3B = 35 tok/s; 8B = 0,8 tok/s, inviável);
  2. **sabiazinho-4-br-sp** (Maritaca, BR): **padrão do chefe de gabinete** —
     trabalho do dia, resumo, redação em PT-BR, coordenação;
  3. **sabia-4-br-sp** (Maritaca, BR): só o que é **muito importante ou
     complexo** — arquitetura, decisão de rumo, plano que governa planos;
  4. **Modelos chineses por chave API** (`opencode-go/*` — DeepSeek, GLM,
     Qwen, Kimi, MiMo): quando os anteriores não resolvem; barato primeiro;
  5. **Antigravity/Gemini**: **último degrau** — só o que precisa de
     **trator de tokens** E é **pouco sensível** (material já público, OCR,
     volume bruto, classificação em lote). Google pode reter e treinar.
- **Google nunca recebe:** CPF, denúncia, caso jurídico identificável, nome
  de pessoa, dado de campanha eleitoral, código privado ou estratégia.
  Na dúvida, sobe um degrau — local ou BR.
- **A regra vive também no workspace dos bots:** chefe de gabinete e
  Secretária têm um `AGENTS.md` próprio com a escada, para acionar antes de
  escolher motor.
- **Antigravity/Gemini** é a exceção declarada de modelo não-open (matriz do
  [PLANO-ORQUESTRACAO-AGENTES-V2](/docs/historico/planos/PLANO-ORQUESTRACAO-AGENTES-V2.md)).
- **Nunca ChatGPT/OpenAI.** Exceção única, temporária e avisada: se **esgotar
  a cota do Gemini**, pode-se usar **Claude** no lugar até a cota voltar —
  avisando o dono antes (§12). Voltou a cota, volta o Gemini.
- **Cérebro principal do OpenMausBot = OpenCode Go** (`opencode-go/*`), não
  Kimi nem outra engine isolada (decisão do dono, 18/10/2026).

## Origem / Histórico

Movido do AGENTS.md §5 em 18/10/2026, sem perda de texto. O AGENTS.md passou a ser um mapa com link para cada regra.
