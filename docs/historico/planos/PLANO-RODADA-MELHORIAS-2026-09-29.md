# PLANO RODADA MELHORIAS PORTAL (29/09/2026)

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-29
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [ESTADO.md](../../02-estado/ESTADO.md), [PRODUTO.md](../../01-produto/PRODUTO.md), [DESENVOLVIMENTO.md](../../03-desenvolvimento/DESENVOLVIMENTO.md)
> **Palavras-chave:** fonte, acessibilidade, portabilidade, chatbot, índice, blog, defasagem, movimentos populares

## Sumário

- [Propósito](#propósito)
- [Ranqueamento por custo/facilidade](#ranqueamento-por-custofacilidade)
- [Detalhe das 10 tarefas](#detalhe-das-10-tarefas)
- [Links dos movimentos (item 9)](#links-dos-movimentos-item-9)

---

## Propósito

Uma rodada de acabamento do portal: legibilidade da descrição das páginas,
portabilidade para telas médias, contexto do chatbot, índice de navegação,
blog com os dados novos, correção de defasagens e um agradecimento aos
movimentos populares que inspiram o projeto. Build só depois de executar tudo.

---

## Ranqueamento por custo/facilidade

Mais fácil primeiro. "Build" fica por último por decisão do dev.

| # | Tarefa | Custo | Feito? |
|---|--------|-------|--------|
| 2 | Regra de fonte mínima (AGENTS.md + docs) | Fácil | ✅ nesta sessão |
| 9 | Agradecimento aos movimentos populares (`/sobre`) | Fácil | ✅ nesta sessão |
| 8 | Corrigir defasagens (contagens e arquitetura) | Médio | mapeado, aguarda |
| 5 | Índice: navbar + índice geral com páginas novas | Médio | aguarda |
| 4 | Contexto do chatbot Seu Nonô (páginas e bases novas) | Médio | aguarda |
| 1 | Fonte da descrição +2pt + "Ver + Texto" | Médio/Grande | aguarda |
| 6 | 10 posts novos no blog (com dados internacionais) | Grande | ✅ nesta sessão |
| 3 | Portabilidade tablet / meia tela (dev server + visual) | Médio | aguarda |
| 7 | Build de verificação e deploy no Guara Cloud | Último | só depois de tudo |
| 10 | Política de uso de IA no site (modelo: Brasil de Fato) | Médio | aguarda |
| 11 | Botão da Rádio Brasil de Fato no rodapé | Fácil | aguarda |

---

## Detalhe das 10 tarefas

### 1. Fonte da descrição +2pt + "Ver + Texto"
- **Alvo:** a descrição/resumo que fica ABAIXO do título de cada página
  (o parágrafo `text-text-soft` sob o `<h1>`), não os cards.
- **Fazer:** subir 2 pontos (`text-xs`→`text-sm`, `text-sm`→`text-base`).
  Criar componente `ResumoExpandivel` com botão "Ver + Texto" para descrição
  longa (acima de ~2 linhas). Componente client, com estado de aberto/fechado.
- **Atenção:** há ~162 `page.tsx` com `text-text-soft`; mapear quais têm
  descrição sob o título antes de varrer. Frentes usam `HeaderFrenteBrasilComS`
  (`descricao`, já `text-[1.05em]`) e `CapaFrente` (`resumo`, `text-xs sm:text-sm`).

### 2. Registrar mínimo de fonte
- **AGENTS.md:** nova regra em §5 (acessibilidade): "descrição sob o título
  nunca menor que `text-sm`; resumo longo ganha 'Ver + Texto'".
- **Docs:** `docs/03-desenvolvimento/DESENVOLVIMENTO.md` e
  `docs/01-produto/PRODUTO.md`.
- **Validar:** `python scripts/validar-documentacao.py`.

### 3. Portabilidade tablet / meia tela
- Medir em 768px e ~1024px: `TopNav.tsx`, `layout.tsx`, `FooterGlobal.tsx` e
  grids `grid-cols-*`. Já há `hidden md:inline-flex` etc. — verificar nada
  soma/sobrepõe. Rodar `next dev` e inspecionar.

### 4. Contexto do chatbot Seu Nonô
- `app/components/SeuNonoData.ts` (FRENTES, PAGINAS_DADOS),
  `lib/assistente/seu-nono-dados.ts`, `lib/assistente/catalogo.ts`,
  `lib/assistente/arvore-galhos.ts`, `lib/assistente/escada-determinista.ts`,
  `lib/busca/paginas-portal.ts`.
- Incluir páginas novas (`/ambiental/autorizacoes`, `/ambiental/ppp`,
  `/cidades/mg`, `/mineracao/cavas`, hubs internacionais) e bases novas
  (553 imóveis SPU, 20 contratos PPP).

### 5. Índice (navbar + índice geral)
- `app/components/TopNav.tsx` → `SECOES_MENU`.
- `app/indice/page.tsx` + `data/top-100-paginas.json`.
- Fechar lacunas entre rotas reais de `apps/web/app/**` e o catálogo.

### 6. 10 posts no blog
- Base: `data/noticias-portal.json` (150) + `data/novidades.json` (17).
- Padrão: `scripts/gerar-10-posts-blog.py` (frases ≤15 palavras, link na fonte,
  resumo + métricas auditáveis).
- Temas aprovados (dev) + dados internacionais recentes (ONU/UNESCO/OMS/OMC,
  SEC/NID/USAspending, TSX/NPRI/CORE): PPPs de MG, 553 imóveis da União, 853
  municípios de MG, Censo 2022 dos polos, bot de fiscalização, e os hubs
  internacionais.

### 7. Verificar integração dos commits
- `npm test` + `tsc --noEmit` já verdes. Falta `next build` (≈17 min) para
  provar que `/ambiental/ppp`, `/ambiental/autorizacoes` e `/cidades/mg`
  renderizam.
- **Depois do build: deploy no Guara Cloud** (`guara deploy`), pedido do dev
  nesta rodada.

### 10. Política de uso de IA no site
- Adotar uma política de uso de IA para o portal, tendo como modelo e
  referência a do **Brasil de Fato**
  (https://www.brasildefato.com.br/politica-de-uso-de-inteligencias-artificiais/).
- Criar rota própria (ex.: `/politica-de-ia` ou `/termos/ia`) ligada ao
  rodapé, adaptando a linguagem ao método do portal ("o modelo extrai, o
  programa calcula", rotulagem de conteúdo gerado, revisão permanente).

### 11. Botão da Rádio Brasil de Fato no rodapé
- Adicionar ao `FooterGlobal` um botão de play que leva à **Rádio Brasil de
  Fato**.
- Fontes: https://www.brasildefato.com.br/radioagencia/seja-parceiro/ e
  https://www.radios.com.br/aovivo/radio-brasil-de-fato-989-fm/63689.

### 8. Defasagens (mapeadas nesta sessão)
- `sobre/page.tsx:439-464` diz "não há banco em produção / portal estático /
  Cloudflare Workers" — desatualizado: hoje é Guara Cloud (www) + Postgres do
  Guara lido no build, com Cloudflare Workers como fallback. ⚠️ o mais grave.
- `sobre/page.tsx:214` "Seis cidades estão publicadas hoje" — conferir contra
  `listarCidades()`.
- `indice/page.tsx:206` "Seis frentes, um portal" — hoje 4 eixos / zonas.
- Grepar outras contagens cravadas ("seis", "cinco", "645", "6 cidades") e
  trocar por contagem medida.

### 9. Agradecimento aos movimentos populares (`/sobre`)
- Nova seção explicando que "Controle Popular" vem da palavra de ordem do MAB
  e as inspirações por frente. Links oficiais na tabela abaixo.

---

## Links dos movimentos (item 9)

| Movimento | URL | Status |
|-----------|-----|--------|
| MAB — Movimento dos Atingidos por Barragens | https://mab.org.br/ | ✅ verificado |
| Movimento Brasil Popular | https://brasilpopular.org/ | ✅ fornecido pelo dev |
| Levante Popular da Juventude | https://levante.org.br/ | ✅ fornecido pelo dev |

Inspiração por página:
- MAB → biblioteca de crimes socioambientais (`/ambiental/crimes-socioambientais`),
  outorga de água (sem rota ainda), barragens (`/ambiental/barragens`),
  licenciamento (`/ambiental/licenciamento`).
- Levante Popular da Juventude → educação (`/direitos-em-movimento/educacao`).
- Movimento Brasil Popular → saúde (`/direitos-em-movimento/saude-publica`).
