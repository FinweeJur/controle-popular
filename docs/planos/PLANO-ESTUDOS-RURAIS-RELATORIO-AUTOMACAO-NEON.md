# Plano — Estudos Rurais, Relatório Técnico do Site, Automação de Links e Retorno à Neon

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-08
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [ESTADO](../02-estado/ESTADO.md), [OPERACAO](../05-operacao/OPERACAO.md), [PROPOSICAO-SANITIZACAO-REPO](PROPOSICAO-SANITIZACAO-REPO.md), [ROTEIRO-NEON-01-09](ROTEIRO-NEON-01-09.md), [LinkMender (relatorios-automacao)](../relatorios-automacao/linkmender-propostas.md)
> **Palavras-chave:** estudos rurais, ppger ufvjm, relatorio tecnico, linkmender, websearch, automacao, neon, build
> **Status:** APROVADO PELO DONO — 08/09/2026, executar em ordem

## Sumário

- [Fase 0 — Encerrar a sanitização em curso](#fase-0--encerrar-a-sanitizao-em-curso)
- [Fase 1 — Página Estudos Rurais](#fase-1--pgina-estudos-rurais)
- [Fase 2 — Relatório técnico geral do site](#fase-2--relatrio-tcnico-geral-do-site)
- [Fase 3 — Automação: verificação de links com websearch de 3 tentativas](#fase-3--automao-verificao-de-links-com-websearch-de-3-tentativas)
- [Fase 4 — Build, teste, commit e migração para a Neon](#fase-4--build-teste-commit-e-migrao-para-a-neon)
- [Regras que valem nas quatro fases](#regras-que-valem-nas-quatro-fases)

## Fase 0 — Encerrar a sanitização em curso

O repositório já foi sanitizado hoje (4 commits temáticos, árvore limpa). Falta:

- [ ] `npx tsc --noEmit` (o `npm test` passou: 141 no globo + vitest verde)
- [ ] Push para `origin/main` (regra 7: quem trabalha publica o próprio trabalho)

## Fase 1 — Página Estudos Rurais 🚧

**Objetivo:** página pública que agrega estudos rurais — notícias, artigos, eventos,
publicações — com o PPGER/UFVJM como fonte principal e outras fontes abertas da
internet sobre o tema.

### Coleta

| Fonte | O quê | Como |
|---|---|---|
| **PPGER/UFVJM** (programa de pós-graduação da UFVJM) | publicações, eventos, notícias, dissertações | coletor próprio (`scripts/coletar-ppger-ufvjm.mts` ou `.py`), com pausa e UA honesto; a URL real da página do programa é medida antes |
| **Repositório institucional UFVJM** ( dissertações) | teses/dissertações rurais | API do repositório, se houver; senão varredura leve |
| **Notícias gerais** | "estudos rurais", "agricultura familiar", "vales do Jequitinhonha e Mucuri" | coletor de radar, mesmo padrão do radar de notícias da Paraopeba |
| **Eventos** | congressos, simpósios, chamadas de trabalhos | página única de eventos, atualizada na coleta |

### Página

- Rota: `app/estudos-rurais/page.tsx`
- Segue a regra das 5 coisas do AGENTS.md: gráfico (produção por ano), cartões
  de topo (totais por tipo), CSV com BOM UTF-8 do filtro na tela, filtro por
  tipo/ano/fonte, ordenação por coluna
- Dado em JSON versionado (`apps/web/data/estudos-rurais/`) com lacunas declaradas
- Cada item com: título, tipo (notícia/artigo/evento/publicação), fonte com link,
  data, resumo curto
- ⚠️ Varredura de dado pessoal antes de commitar (mod-11)

## Fase 2 — Relatório técnico geral do site 🚧

**Objetivo:** um documento com lista de cada link do portal — frente, subfrente,
o que a página mostra, qual a fonte, principais dados — virando relatório técnico
completo da situação do site hoje.

- Gerador: `scripts/gerar-relatorio-tecnico.mts`
- Fonte da verdade: o catálogo de rotas do próprio código (`app/` varrido) +
  `lib/fontes/registry.ts` + `lib/eixos/catalogo.ts`
- Saída: `docs/relatorios-automacao/relatorio-tecnico-geral.md`, gerado, com data
- Formato por linha: **Frente → Subfrente → Rota → O que mostra (oração direta,
  1–2 frases) → Fonte(s) → Principais dados (números medidos com data)**
- Resumo no topo: quantas rotas, quantas fontes, quais frentes, cobertura
- Número na tela vem de medição, nunca de estimativa

## Fase 3 — Automação: verificação de links com websearch de 3 tentativas 🚧

**Objetivo:** verificar TODOS os links de TODAS as páginas; quando um link falha,
procurar o documento certo na web 3 vezes com palavras-chave diferentes; se
confirmar com critérios, entra automaticamente no próximo build.

- Base: LinkMender existente (`docs/relatorios-automacao/linkmender-propostas.md`
  — hoje só propõe, nunca aplica). Evolui para aplicar com critérios.
- Pipeline por link:
  1. **Verificar** — HTTP real, validar CONTEÚDO, não só status (regra do
     AGENTS.md: API responde 200 e mente)
  2. **Falhou? Buscar 3×** — três websearch com palavras-chave distintas
     otimizadas (título do documento + órgão + extensão; cite:title; site: do
     domínio original). Pausa entre buscas
  3. **Confirmar por critérios** — só aceita candidato que bata em:
     domínio oficial de órgão público (ou arquivo no R2 de fontes), título
     similar ao do item, tipo de conteúdo igual (PDF→PDF)
  4. **Proposta** — grava `link-corrigido: de → para → critérios que bateram`
     no relatório; **nunca aplica direto no dado versionado sem registro**
  5. **Aplicar no build** — arquivo de correções aceitas é lido no prebuild,
     que troca o link na hora de gerar a página. O dado original não é
     reescrito: a correção é camada, revisável
- Fora da CI, pausa entre requisições, UA honesto
- Critério de sucesso da fase: taxa de link morto cai e toda correção tem
  trilha (link velho, link novo, por quê)

## Fase 4 — Build, teste, commit e migração para a Neon 🚧

Só depois das fases 1–3 estáveis:

1. **Build** no home-pc (é a máquina que builda e publica; esta máquina não
   builda com banco)
2. **Testar** — `npm test`, `tsc`, Argus nas rotas novas e alteradas
   (validar CONTEÚDO, não só 200)
3. **Commit local + GitHub** — pathspec explícito, mensagem por arquivo `-F`,
   sem acento, trailer `Co-Authored-By`; push depois do build terminar
4. **Migrar para a Neon** — executar o runbook existente
   (`ROTEIRO-NEON-01-09.md`): migrations 0071–0079 → backfill de temas →
   URLs do TJMG → carga das 8.570 normas federais → auditoria dos 25.729 links.
   O `DATABASE_URL` aponta para a Neon; o Postgres local continua de pé para
   trabalho desta máquina (coexistem — decide a string de conexão)
5. Depois da Neon: Fase 5 do chatbot (pgvector) destrava junto

## Regras que valem nas quatro fases

1. Coleção nunca vai como props de componente de cliente — acima de ~2 mil
   linhas, índice fatiado ou paginação no servidor
2. Dado pessoal: varrer o DADO antes de commitar, sempre
3. Página com lista grande tem as 5 coisas (gráfico, cartões, CSV, filtro, ordenação)
4. Número na tela vem de medição com data — nunca digitado à mão
5. Lacuna é informação: dizer quantos itens vieram vazios
6. `--force` nunca; commit por pathspec; mensagem por arquivo
7. Uma fase por vez: entregou, mediu, o dono aprova, passa pra próxima
