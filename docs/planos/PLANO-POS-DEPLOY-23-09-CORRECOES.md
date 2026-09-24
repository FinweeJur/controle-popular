# Plano — Diagnóstico e correções pós-deploy (23/09/2026)

> **Tipo:** Plano  
> **Domínio:** Operação / Frontend / Infra  
> **Última medição:** 24/09/2026  
> **Estado:** parcialmente aplicado — P0/P1/P3 concluídos; P2 parcial  
> **Leitura estimada:** curta (< 5 min)  
> **Relacionados:** [PLANO-CONDICIONANTES-AMBIENTAIS.md](PLANO-CONDICIONANTES-AMBIENTAIS.md), [PLANO-SESSAO-23-09-BOTS-LAB-CHATBOT.md](PLANO-SESSAO-23-09-BOTS-LAB-CHATBOT.md)  
> **Palavras-chave:** pos-deploy, guara, migracao, sigma, condicionantes, topnav, shield  
> **Worktree:** `.claude/worktrees/cp-bots-lab` (branch `cp-bots-lab`)  
> **Main na hora:** `30ffccae` (sessão 23/09 publicada); plano commitado `5911536d`

## Sumário

- [Contexto](#contexto)
- [Diagnóstico (8 itens)](#diagnóstico-8-itens)
- [Plano de correção](#plano-de-correção)
- [Verificação](#verificação)
- [Fora do escopo](#fora-do-escopo)

## Contexto

Deploy da sessão 23/09 (bots, lab PowerBI 23 camadas, chatbot, dither, marquee)
saiu no Guara. O dono apontou oito problemas na tela pós-deploy. Este plano
registra a **causa raiz medida** de cada um e a **ordem de correção**.

Nada aqui foi executado. Só diagnóstico por leitura de código.

## Diagnóstico (8 itens)

### 1. Licenciamento ambiental — sem dados

- **Causa raiz:** `/ambiental/licenciamento` lê só do banco
  (`contarLicenciamento` em `lib/db/queries/ambiental-licenciamento.ts:99`).
  Sem `DATABASE_URL` no build, ou tabela vazia → zeros na tela.
- **Armadilha conhecida:** `AGENTS.md` §8 — página que lê do banco só
  mostra as cinco coisas quando o banco responde no build.
- **Conferir:**
  1. env `-b DATABASE_URL` no Guara (build + runtime);
  2. migration `0063_ambiental_licenciamento.sql` aplicada no Postgres alvo.

### 2. Condicionantes — existe, mas quase invisível

- **Causa raiz:** a rota `/ambiental/condicionantes` **existe**
  (`app/ambiental/condicionantes/page.tsx`).
  Só está linkada no índice ambiental
  (`app/ambiental/indice/page.tsx:70`).
- **Não está** no menu TopNav (Eixo 2). Quem não acha pelo índice não acha.
- **Também:** migration `0089_ambiental_condicionantes.sql` — se não
  rodou, a página abre vazia (`CONTAGEM_VAZIA`).

### 3. Sigma Lithium — fora da listagem de empresas

- **Causa raiz:** o slug `sigma-lithium` está em `lib/empresas/dados.ts:16`
  (ficha legada OK em `/empresas/sigma-lithium`).
- A **tabela** `/empresas` usa `listarTodasEntidades()` →
  `data/empresas-perfil/entidades-completas.json` — **sem sigma** nesse
  JSON. Sigma não aparece na lista.
- A página da Araçuaí não linka Sigma (sem `href` para a ficha).

### 4. Betim + 6 cidades vazias

Duas camadas:

1. **Build sem banco:** `generateStaticParams` → `slugsDasCidades()` devolve
   `[]` quando não há `DATABASE_URL`
   (`lib/betim/staticParams.ts:53`). O export gera zero páginas de município
   ou congela HTML vazio.
2. **Fontes placeholder:** em `lib/db/cidades-do-build.ts` estas cidades
   têm `fontes: {}` (ou quase): **serro**, **governador-valadares**,
   **ipatinga**, **juiz-de-fora**, **uberlandia**; brumadinho só
   `paraopeba`. Cards ficam “em breve” por design até o ETL.

Betim tem fontes completas — se vazia, é a camada 1 (banco no build).

### 5. Laboratório com erro

- `montarCamadasCatalogo()` roda no build (`app/laboratorio/page.tsx:17`).
- `data/judiciario-remuneracoes.json` está **vazio** (`tribunais: []`);
  o helper já trata isso (`lib/laboratorio/dados-catalogo.ts:593`).
- **Falta o stack real** do erro (build log ou console). Suspeitos:
  outra camada do catálogo, ou path de `data/` no container do Guara.

### 6. Mobile/tablet — navbar cortada e botões sobrepostos

- `app/components/TopNav.tsx:212-404`: uma linha com logo + Índice +
  busca + Blog + sino + Ouvir + Busca + tema + CVD + fonte + marquee.
- Em telas estreitas: overflow e sobreposição.
- Marquee (40%) e controles novos (`OuvirNavbar`, `FontSizeControl`)
  pioram o encaixe. Breakpoint `xs` precisa existir no tema
  (`hidden xs:inline` em `TopNav.tsx:232`).

### 7. Chatbot “não consegui achar”

- `lib/assistente/embeddings/rag.ts` **abstém** se top-1 < 0.15
  (limiar honesto — regra do portal).
- No Guara: sem `EMBED_API_KEY` → tenta Ollama local (não cabe no
  Starter de 256 MB) → degrada p/ lexical se `AI_API_KEY` existir,
  senão 503.
- **Conferir no painel Guara:** `EMBED_API_KEY`, `EMBED_BASE_URL`,
  `EMBED_MODEL`, `AI_API_KEY` (runtime e build onde aplicável).

### 8. Guara Shield — script sem relatório

- `scripts/agent-tools/guara-shield-bot.mts` existe.
- Em `docs/relatorios-automacao/` **não há** `guara-shield-relatorio.json`
  → o bot nunca gravou relatório (falta `scripts/.env` com Telegram, ou
  nunca rodou).

## Plano de correção

Prioridade: P0 bloqueia dado correto; P1 navegação/descoberta;
P2 qualidade de tela; P3 monitoramento.

| # | Prioridade | Ação | Arquivos / alvo | Estado (24/09) |
|---|---|---|---|---|
| 1 | **P0** | Conferir/aplicar envs Guara: `DATABASE_URL` (-b), `EMBED_*`, `AI_API_KEY` | painel Guara / `guara env set` | ✅ envs conferidas no painel (Build=Yes); `EMBED_*` têm defaults em código |
| 2 | **P0** | Rodar migrations `0064_ambiental_licenciamento.sql` e `0089_ambiental_condicionantes.sql` no banco do Guara | SQL / Drizzle | ✅ aplicadas via `scripts/aplicar-migration-guara.mjs` (proxy 15432); licenciamento 8.612 linhas; documentos seed 7 |
| 3 | **P1** | Linkar condicionantes no TopNav (Eixo 2) | `apps/web/app/components/TopNav.tsx` | ✅ link após Licenciamento |
| 4 | **P1** | Incluir Sigma em `entidades-completas.json` (ou merge da ficha legada na tabela) | ETL + `mesclarLegadas()` | ✅ merge em `entidades-dados.ts` + teste |
| 5 | **P1** | Linkar `/empresas/sigma-lithium` na página da Araçuaí | rota cidade / seção relacionados | ✅ bloco em `mineracao/page.tsx` (Araçuaí/Itinga) |
| 6 | **P2** | Repovoar indicadores das 6 cidades vazias (ETL) | `scripts/` ETL + `cidades-do-build.ts` via prebuild | ⬜ pendente — fontes vazias em `cidades-do-build.ts` (serro, GV, ipatinga, JF, uberdia; brumadinho só paraopeba) |
| 7 | **P2** | Mobile: reduzir densidade da TopNav em `sm` | `TopNav.tsx` + breakpoints do tema | ✅ gap/px menores, Blog só ícone no xs, FontSize 28px no mobile, `--breakpoint-xs: 480px` |
| 8 | **P2** | Lab: colher stack do erro e corrigir camada | build/runtime log + `lab-camadas.ts` | ⬜ pendente — sem stack capturado |
| 9 | **P3** | Guara Shield: credenciais + `--once` para gerar relatório | `scripts/.env` + bot | ✅ `shell: win32` no spawn; `--once` gerou `guara-shield-relatorio.json` (0 CRITICAL/HIGH); Telegram ainda sem `scripts/.env` |

### Ordem sugerida de execução

1. P0 (envs + migrations) — ✅ feito.
2. P1 (links e Sigma) — ✅ feito.
3. P2 (ETL cidades, lab) — restam itens 6 e 8.
4. P3 (Shield) — ✅ relatório gerado; Telegram opcional.

## Verificação

```bash
npm test                 # raiz do worktree
npx tsc --noEmit
python scripts/validar-documentacao.py
```

Antes de qualquer push:

- suíte + `tsc` verdes;
- commit por pathspec + mensagem em arquivo (`-F`);
- deploy no Guara só se a mudança afectar a imagem (cota ~5 dias).

Conferir na tela (home-pc ou Guara):

- `/ambiental/licenciamento` com cartões ≠ 0;
- `/ambiental/condicionantes` acessível pelo menu;
- `/empresas` lista Sigma;
- chatbot responde com fonte ou abstenção honesta (não 503).

## Fora do escopo

- Migração Neon → Postgres do Guara (Fase 4, fila separada).
- Auto-deploy do Guara (segue desligado).
- Qualquer `git push` sem pedido explícito do dono.
