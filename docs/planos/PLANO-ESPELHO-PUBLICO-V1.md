# Plano do espelho público v1

> **Tipo:** PLANO
> **Domínio:** release, código aberto, publicação
> **Última medição:** 2026-10-21
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [REGRAS-DURAS.md](../03-desenvolvimento/REGRAS-DURAS.md), [OPERACAO.md](../05-operacao/OPERACAO.md), [VERIFICACAO-E-ENTREGA.md](../03-desenvolvimento/VERIFICACAO-E-ENTREGA.md)
> **Palavras-chave:** espelho, publico, v1, repositorio, allowlist, sanitizacao, licenca, release, servidor

## Sumário

- [Propósito](#propósito)
- [Decisão de sequência](#decisão-de-sequência)
- [Dois repositórios](#dois-repositórios)
- [Allowlist inicial](#allowlist-inicial)
- [Exclusões obrigatórias](#exclusões-obrigatórias)
- [Sanitização](#sanitização)
- [Dados e licença](#dados-e-licença)
- [Gate de build](#gate-de-build)
- [Fluxo de sincronização](#fluxo-de-sincronização)
- [Fases](#fases)
- [Decisões pendentes](#decisões-pendentes)
- [Critérios de pronto](#critérios-de-pronto)
- [Origem / Histórico](#origem--histórico)

## Propósito

Separar o **repositório de desenvolvimento** do **repositório público v1**.
O primeiro fica fechado, com planos, histórico, experimentos e operação. O
segundo é um espelho limpo, só com arquivos considerados prontos para
leitura pública, sem plano, histórico, servidor, segredo ou dado pessoal.

Medição de 21/10/2026: `FinweeJur/controle-popular` está **público** hoje.
Não mudar a visibilidade antes de o espelho existir e buildar — isso
quebraria links de código, Pages e forks públicos sem substituto.

## Decisão de sequência

1. criar o repositório público v1;
2. gerar o espelho por allowlist;
3. rodar build, testes, varredura de CPF/segredo e revisão de menções;
4. publicar o espelho;
5. só então tornar `controle-popular` privado.

A ordem inversa deixa o projeto sem fonte pública e sem plano B.

## Dois repositórios

| Repositório | Visibilidade | Papel |
|---|---|---|
| `FinweeJur/controle-popular` | privado (depois) | desenvolvimento, testes, inovação, planos, histórico, operação |
| `FinweeJur/controle-popular-v1` | público | espelho limpo, código e dados prontos, documentação pública |

Nome do segundo é proposta; confirmar antes de criar.

## Allowlist inicial

O espelho não copia o repo inteiro. Ele copia **só** o que estiver nesta
lista. Allowlist é mais segura que blocklist: arquivo novo não entra por
acidente.

| Caminho/glob | Inclui? | Observação |
|---|---|---|
| `apps/web/app/**` | sim | rotas públicas; revisar páginas experimentais |
| `apps/web/components/**` | sim | componentes usados pelas rotas públicas |
| `apps/web/lib/**` | sim | lógica e testes; excluir módulos internos de operação |
| `apps/web/data/**` | por arquivo | só dado publicado; lista explícita |
| `apps/web/public/**` | por arquivo | só asset usado por rota pública; excluir PDF grande e cache |
| `apps/web/package.json` | sim | remover scripts de coleta/painel/deploy |
| `apps/web/tsconfig.json` | sim | |
| `apps/web/next.config.ts` | sim | revisar headers e flags de servidor |
| `apps/web/postcss.config.*` | sim | |
| `apps/web/eslint.config.*` | sim | |
| `package.json` | sim | scripts públicos apenas |
| `package-lock.json` | sim | reprodutibilidade |
| `LICENSE` | sim | AGPL-3.0 |
| `README-PUBLICO.md` | sim | escrito para o público, não cópia do README interno |
| `SECURITY.md` | sim | canal de segurança sem dado interno |
| `CONTRIBUTING.md` | sim | regras públicas de contribuição |
| `docs/**` | não | exceto um `docs/publico/` mínimo, se necessário |
| `scripts/**` | não | coletores, agentes e rotinas internas |
| `etl/**` | não | pipeline interno |
| `bots/**`, `companion/**` | não | experimentos e integrações internas |
| `apps/web/.cache/**` | não | cache local |
| `apps/web/public/data/documentos-rag/**` | revisar | índice derivado de PDF; só depois de checar licença |
| `apps/web/public/busca-indice/**` | não | artefato de build com dado interno |
| `docs/planos/**`, `docs/historico/**` | não | plano e histórico ficam no dev |
| `docs/05-operacao/**` | não | servidor, deploy, cota, túnel |
| `AGENTS.md`, `ARMADILHAS.md`, `TODO.md`, `HANDOFF.md` | não | instrução interna |
| `.claude/**`, `.opencode/**`, `.agents/**` | não | skills, sessões e agentes |
| `.env*`, `logs/**`, `models/**`, `_outbox/**` | não | segredo/artefato |

## Exclusões obrigatórias

Além da allowlist, remover do espelho:

- planos, histórico, relatórios de agentes, handoffs, pendências e worktrees;
- instruções de servidor: `home-pc`, `Guara`, `Azure`, `Tailscale`,
  `Container Apps`, `R2`, `workers`, `cota`, `túnel`, IP `100.x`;
- caminhos internos: `X:\DevCoder`, `C:\DevCoder`, `C:\Users\`, `\\home-pc`;
- segredos e credenciais: `.env`, `.dev.vars`, `scripts/.env`, tokens,
  `DATABASE_URL`, `TELEGRAM_*`, `GITHUB_TOKEN`, chaves SSH;
- dados de teste, dados brutos, PDFs sem licença, TJMG e acervos não
  publicados;
- referências a `AGENTS.md`, regras internas, `CodeScene`, `MCP` e
  `OpenMausBot` que não sejam necessárias para o público.

## Sanitização

Antes de gerar o espelho, rodar uma varredura de padrões e revisar cada
ocorrência:

```text
home-pc, HOME-PC, Guara, guara, Azure, azure, Tailscale, tailscale
100.91.10.1, 100.126.160.109, X:\DevCoder, C:\DevCoder, C:\Users\
DATABASE_URL, TELEGRAM_, GITHUB_TOKEN, R2_, COLI_API_KEY
CPF, cpf, .env, scripts/.env, service-account, client_secrets
```

Regras:

- não basta apagar a palavra; reescrever a frase para o público;
- comentário de código que explica servidor interno sai ou vira explicação
  genérica;
- link interno de documentação só entra se o documento também entrar;
- URL de API pública pode ficar; URL de painel, túnel ou IP não;
- toda ocorrência revisada deve ser registrada no relatório de release.

## Dados e licença

- Código: AGPL-3.0 (mesma licença do projeto atual).
- Dados: cada base precisa de licença/fonte declarada antes de entrar.
- Dado público não é automaticamente dado aberto para redistribuição;
  checar a licença da fonte.
- PDF de ATI/NACAB e acervos sem licença explícita ficam fora até decisão.
- Nenhum CPF real: rodar `python scripts/checar-dado-pessoal-em-dado.py`.
- Nenhum segredo: rodar gitleaks ou varredura equivalente no espelho.

## Gate de build

O espelho só é publicado se, no checkout limpo:

```bash
npx tsc --noEmit
npm test
npm run build
```

E mais:

- `npm ci` funciona sem `.env` privado;
- build não depende de `DATABASE_URL` interno;
- páginas que exigem banco degradam com estado vazio, não 500;
- varredura de CPF/segredo passou;
- revisão de menções a servidor passou;
- links internos do README público existem.

## Fluxo de sincronização

```text
dev repo (privado)
  -> allowlist + exclusões
  -> cópia para checkout do v1
  -> sanitização
  -> build/teste
  -> commit no v1
```

O v1 tem histórico próprio. Não copiar `.git` nem commits do dev. O sync é
feito por script versionado no dev, com `--dry-run` para listar o que
entraria e `--check` para falhar em padrão proibido.

## Fases

### Fase 0 — decisão

Confirmar nome do repo público, licença e quais rotas/dados são “v1”.
Sem isso, não criar repositório.

### Fase 1 — allowlist e dry-run

Criar manifesto de caminhos e script que lista o que entraria. Nada é
copiado ainda.

### Fase 2 — espelho draft

Criar repo público vazio, copiar allowlist, reescrever README público,
rodar sanitização e build.

### Fase 3 — revisão

Revisar cada menção a servidor, cada dado e cada link. Corrigir no dev e
ressincronizar.

### Fase 4 — publicação

Publicar o v1; só então tornar o dev privado.

### Fase 5 — manutenção

Sync periódico, tag `v1.x`, changelog público e revisão de dados.

## Decisões pendentes

1. Nome: `controle-popular-v1` ou outro?
2. O v1 inclui o app inteiro ou só rotas consideradas prontas?
3. Quais arquivos de `apps/web/data` e `public/data` entram?
4. O v1 inclui o RAG documental (índice de 16 MB) ou só o código?
5. Licença: AGPL-3.0 para código e qual termo para dados?
6. URL/domínio do v1 é só GitHub ou também site?
7. Tornar o dev privado só depois do v1 verde?

## Critérios de pronto

- v1 builda e testa sem segredo;
- zero plano/histórico/servidor no v1;
- zero CPF/segredo;
- licença e fonte de cada base declaradas;
- README público explica o projeto sem citar operação interna;
- dev privado só depois do v1 publicado;
- rollback: dev continua acessível ao dono.

## Origem / Histórico

Criado em 21/10/2026, a partir do pedido do dono de fechar o repositório de
desenvolvimento e lançar um espelho público v1 só com arquivos prontos.
A skill `/ssh` foi criada na mesma data para a ponte com o `home-pc`.
