# GLOSSARIO-DEV - os termos técnicos deste repositório

> **Tipo:** GUIA
> **Domínio:** global
> **Última medição:** 2026-10-09
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [DESENVOLVIMENTO.md](DESENVOLVIMENTO.md), [CONTRIBUTING.md](/CONTRIBUTING.md), glossário cívico [glossario/termos.ts](../../apps/web/lib/glossario/termos.ts)
> **Palavras-chave:** glossário, siglas, termos técnicos, onboarding, iniciante

## Sumário

- [Propósito](#propósito)
- [Fluxo de trabalho (Git)](#fluxo-de-trabalho-git)
- [Verificação e qualidade](#verificação-e-qualidade)
- [Stack e infraestrutura](#stack-e-infraestrutura)
- [Dados e E.T.L.](#dados-e-etl)
- [CodeScene (saúde do código)](#codescene-saúde-do-código)
- [Segurança e dado pessoal](#segurança-e-dado-pessoal)
- [Siglas de DOMÍNIO - onde procurar](#siglas-de-domínio---onde-procurar)

## Propósito

Quem chega ao projeto lê o [AGENTS.md](/AGENTS.md) e trava na primeira sigla:
o que é "worktree"? "SSG"? "BOM"? Este documento define, em uma página, os
termos **técnicos** que aparecem nos documentos e no código.

**O que NÃO está aqui:** siglas de **domínio** (CAR, TAC, TCE, COPAM...). Elas
têm um glossário próprio, voltado ao cidadão, em `/glossario`
(fonte única: `apps/web/lib/glossario/termos.ts`). Não duplique — veja a
[última seção](#siglas-de-domínio---onde-procurar).

## Fluxo de trabalho (Git)

| Termo | O que é — e por que importa aqui |
|---|---|
| **worktree** | Cópia extra do repositório em outra pasta, com branch próprio. Use quando **2+ sessões** trabalham ao mesmo tempo: evita dois `next build` brigando no mesmo disco (AGENTS §5.4) |
| **pathspec** | O caminho explícito que limita a ação do Git (`git commit --only <caminho>`). Existe porque `git commit` sem caminho leva **tudo** — inclusive o que outra sessão deixou em stage (§5.5) |
| **rebase** | Reaplicar seus commits por cima do que chegou no remoto. É o passo antes do push: `git rebase origin/main` |
| **hook** | Script que o Git roda sozinho num momento (`pre-commit`, `pre-push`). Aqui é o que barra CPF e segredo **antes** do push; ligado no `npm install` (§5.2) |
| **HEAD** | O commit em que você está agora ("onde a cabeça aponta") |
| **PR (Pull Request)** | Proposta de mudança que pede revisão antes de entrar na `main` |
| **stage / stash** | Área de espera do que vai no próximo commit / pilha de mudanças guardadas temporariamente |

## Verificação e qualidade

| Termo | O que é — e por que importa aqui |
|---|---|
| **tsc** | O compilador de TypeScript. `npx tsc --noEmit` só **checa tipos**, não gera arquivo — é a checagem rápida de todo commit (§9) |
| **eslint** | O revisor de estilo do código (aspas, imports, variáveis não usadas) |
| **vitest** | O programa que roda os testes de unidade |
| **CI (Integração Contínua)** | O robô do GitHub que roda testes e lint a cada push. Aqui: push na `main` → CI testa; **deploy é manual** (§5.7.1) |
| **suíte** | O conjunto completo de testes (~2 mil no vitest, mais o globo 3D) |
| **teste morto** | Teste que quebrou e ninguém viu (porque ninguém rodou). A regra: rode os testes **do arquivo que você mexe** (§6) |

## Stack e infraestrutura

| Termo | O que é — e por que importa aqui |
|---|---|
| **SSG (Static Site Generation)** | A página é gerada no **build**, não a cada visita. Por isso página que lê banco precisa de `comBancoReserva`: sem ele o build quebra (§6) |
| **SSR** | Geração no servidor a cada requisição (página dinâmica) |
| **API** | A "porta" pela qual um programa conversa com outro por HTTP |
| **ORM** | Tradutor de código para SQL. Aqui é o **Drizzle** (schema e queries em `lib/db/`) |
| **Postgres** | O banco de dados relacional (hoje, Heroku Postgres) |
| **D1** | Banco SQLite da Cloudflare, usado no alvo Worker |
| **GHCR (GitHub Container Registry)** | Onde a imagem Docker fica guardada; o Azure Container Apps pega de lá |
| **DNS / CNAME** | O "catálogo" e o "apelido" que traduzem nome de site para endereço de servidor |
| **TXT (registro)** | Registro de DNS usado para provar que o domínio é seu (validação de certificado) |
| **SSL** | O cadeado do site: conexão cifrada (HTTPS) |
| **standalone** | Modo do build do Next que gera um pacote enxuto para rodar em container |
| **Ollama** | Modelo de IA que roda **local**, sem mandar dado para fora da máquina (§5.12) |
| **MCP** | Protocolo que liga o agente (opencode) a ferramentas externas — aqui, o CodeScene |

## Dados e E.T.L.

| Termo | O que é — e por que importa aqui |
|---|---|
| **E.T.L.** | Extract, Transform, Load: o robô que baixa o dado da fonte, trata e grava no banco. Mora em `etl/` |
| **seed** | Carga inicial que popula uma tabela (ex.: os 853 municípios de MG) |
| **CSV** | Planilha em texto puro. A exportação do portal usa `;` e BOM para o Excel brasileiro (§8) |
| **BOM (Byte Order Mark)** | Marca invisível no **começo** do arquivo. Sem ela o Excel brasileiro embaralha os acentos; com ela, abre certo |
| **CRLF / LF** | Os dois jeitos de marcar "fim de linha": Windows usa CRLF, o repositório usa LF. CRLF esconde chave em `.env` (§6) |
| **JSON** | Formato de dado em texto que os programas leem |
| **RAG (Retrieval-Augmented Generation)** | Técnica de IA que responde **com base em dados buscados antes** — é como o assistente Seu Nonô responde com contexto cívico |

## CodeScene (saúde do código)

| Termo | O que é — e por que importa aqui |
|---|---|
| **CodeScene** | A ferramenta que mede a **saúde do código** (nota de 0 a 10) só no que você mexeu |
| **saúde (code health)** | A nota: **≥ 9 verde**, 4 a 8,9 amarelo, < 4 vermelho. A meta da casa é 10,00 (§9) |
| **hotspot** | Ponto que muda muito **e** é difícil de mexer — onde refatorar dá mais retorno. Só se refatora o que está na fila medida |
| **cc (complexidade ciclomática)** | Conta os caminhos que uma função pode seguir. Teto aqui: **9** (9 já dispara) |
| **gate (portão)** | A checagem que **barra o commit** quando a saúde piora: `cs delta --staged --error-on-warnings` (§9) |
| **delta** | A comparação "antes × depois" que o CodeScene faz do seu diff |
| **bus factor** | Risco de **uma pessoa só** entender o código (nome: se ela for atropelada pelo ônibus). Hoje é 1 porque há uma conta só (§ Bus factor no plano de hotspots) |
| **Code Health rules** | `.codescene/code-health-rules.json`: onde se afrouxa/aperta uma regra (ex.: desligar regras estruturais em arquivo de teste) |

## Segurança e dado pessoal

| Termo | O que é — e por que importa aqui |
|---|---|
| **CPF** | Documento que **nunca** pode ir ao repositório público. O portal já publicou CPF real duas vezes, por caminhos diferentes (§5.2) |
| **mod-11** | O cálculo do **dígito verificador** do CPF. É o teste automático que distingue CPF real de número qualquer |
| **segredo** | Senha, token ou chave. Nunca entra no repositório, nunca é impresso — vive em `scripts/.env` (gitignorado), §5.8 |
| **sanitizar** | Tirar o dado pessoal de um texto **antes** de mandá-lo a uma IA (§5.8) |

## Siglas de DOMÍNIO - onde procurar

CAR, CFEM, COPAM, IGAM, FEAM, IBAMA, LAI, LGPD, TAC, TCE, TJMG, MPMG, PNCP,
barragem a montante/jusante, licença prévia/operação, cota-parte do ICMS... são
**termos cívicos**, não técnicos. Eles têm um glossário próprio, com a **fonte
oficial** de cada um:

- **No site:** a página [`/glossario`](https://www.controlepopular.com.br/glossario)
  (o cidadão consulta; o componente inline `TermoGlossario.tsx` reusa).
- **No código:** a fonte única é `apps/web/lib/glossario/termos.ts`. Para
  **acrescentar** um termo, edite lá — **não** crie uma segunda lista aqui.

Se o termo que você procura não está em nenhum dos dois, é lacuna de
documentação: abra uma issue.
