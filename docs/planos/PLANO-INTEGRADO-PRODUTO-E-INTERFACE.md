# Plano integrado — Produto e interface

> **Tipo:** PLANO
> **Domínio:** produto, páginas, conteúdo, SEO, acessibilidade
> **Última medição:** 2026-10-18
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [RADAR-HOTSPOTS.md](../02-estado/RADAR-HOTSPOTS.md), [PADRAO-PAGINA-WIKI.md](../03-desenvolvimento/PADRAO-PAGINA-WIKI.md), [QUALIDADES-DA-INFORMACAO.md](../04-arquitetura/QUALIDADES-DA-INFORMACAO.md), [REGRA-EDITORIAL.md](../01-produto/REGRA-EDITORIAL.md)
> **Palavras-chave:** produto, interface, paginas, oito-qualidades, seo, acessibilidade, mobile, conteudo, memoria, hero, rebrand, divulgacao

## Sumário

- [Propósito](#propósito)
- [Hotspots do radar](#hotspots-do-radar)
- [Pendências por frente](#pendências-por-frente)
- [Decisões do dono](#decisões-do-dono)
- [Critérios de pronto](#critérios-de-pronto)
- [Origem / Histórico](#origem--histórico)

## Propósito

Plano único do tema **produto e interface**. Junta o que restava de página,
texto, SEO, acessibilidade, identidade visual e divulgação, com o que o
[radar](../02-estado/RADAR-HOTSPOTS.md) mediu em 18/10/2026.

A régua é a das [oito qualidades](../04-arquitetura/QUALIDADES-DA-INFORMACAO.md):
**a do celular vem primeiro.**

## Hotspots do radar

| Hotspot | Medido em | Comece por | Detalhe |
|---|---|---|---|
| **97 de 100 páginas parciais** na régua estática | 14/10 | `python scripts/verificar-padrao-pagina.py` | [padrão de página](../relatorios-automacao/padrao-pagina-2026-10-14.md) |
| **`/funcaosocialterra/mapa` e `/canada` com 5 faltas** cada | 14/10 | `apps/web/app/funcaosocialterra/mapa/page.tsx`, `apps/web/app/canada/page.tsx` | [padrão de página](../relatorios-automacao/padrao-pagina-2026-10-14.md) |
| **`/terra-e-territorios` com 4 faltas** | 14/10 | `apps/web/app/terra-e-territorios/page.tsx` | [padrão de página](../relatorios-automacao/padrao-pagina-2026-10-14.md) |
| **Rota `/ambiental/contratos` não existe** | 14/10 | `apps/web/app/ambiental/` | [padrão de página](../relatorios-automacao/padrao-pagina-2026-10-14.md) |
| **SEO de 04/10 pode estar vencido** (canonicals, 503, títulos) | 04/10 | `npx tsx scripts/auditar-seo.mts` | [auditoria SEO](../relatorios-automacao/auditoria-seo-2026-10-04.md) |
| **Memória com datas inconsistentes** | 14/10 | `docs/relatorios-automacao/inconsistencias-mistica.md` | [revisão da memória](../relatorios-automacao/inconsistencias-mistica.md) |

## Pendências por frente

### 1. Padrão de página e acessibilidade

| # | Pendência | Detalhe | Próxima ação |
|---|---|---|---|
| P1 | Fechar as 97 páginas parciais por eixo | [padrão de página](../relatorios-automacao/padrao-pagina-2026-10-14.md) | começar pelos hubs (`/`, `/ambiental`, `/congresso`, `/judiciario`) |
| P2 | Criar ou remover `/ambiental/contratos` | [padrão de página](../relatorios-automacao/padrao-pagina-2026-10-14.md) | decidir com o dono; hoje é link sem página |
| P3 | Aplicar o checklist do [PADRAO-PAGINA-WIKI](../03-desenvolvimento/PADRAO-PAGINA-WIKI.md) | 14/10 | índice wiki, relacionados, gráfico e fonte |
| P4 | Revalidar mobile em 390 px nas páginas novas | [REGRAS-DURAS §5.14](../03-desenvolvimento/REGRAS-DURAS.md#514-o-celular-é-a-régua-responsividade-e-legibilidade-são-qualidade-do-dado) | `scrollWidth === innerWidth` |

### 2. Texto, memória e conteúdo

| # | Pendência | Detalhe | Próxima ação |
|---|---|---|---|
| P5 | Revisar as inconsistências de data da memória | [inconsistencias-mistica](../relatorios-automacao/inconsistencias-mistica.md) | revisão humana; máquina não reescreve resumo |
| P6 | Concluir rebrand/identidade visual | [PLANO-IDENTIDADE-VISUAL-HERO-NARRATIVO](/docs/historico/planos/PLANO-IDENTIDADE-VISUAL-HERO-NARRATIVO.md) | fechar os itens abertos do hero e do mosaico |
| P7 | Fechar rebrand de fotos e poemas | [PLANO-REBRAND-FOTOS-E-POEMAS](/docs/historico/planos/PLANO-REBRAND-FOTOS-E-POEMAS.md) | conferir ativos e legendas |
| P8 | Camadas históricas do globo 3D | [PLANO-HISTORIA-CAMADAS-GLOBO-3D](/docs/historico/planos/PLANO-HISTORIA-CAMADAS-GLOBO-3D.md) | 13 itens de pendência; priorizar por eixo |

### 3. Alcance e conteúdo educativo

| # | Pendência | Detalhe | Próxima ação |
|---|---|---|---|
| P9 | Divulgação de custo zero | [PLANO-DIVULGACAO-ZERO-CUSTO](/docs/historico/planos/PLANO-DIVULGACAO-ZERO-CUSTO.md) | 10 itens abertos; escolher 3 para a semana |
| P10 | Expansão internacional (EUA/Canadá) | [PLANO-EXPANSAO-INTERNACIONAL](/docs/historico/planos/PLANO-EXPANSAO-INTERNACIONAL.md) | 14 itens abertos; medir o que já está publicado |
| P11 | Ecossistema cívico | [PLANO-ECOSSISTEMA-CIVICO](/docs/historico/planos/PLANO-ECOSSISTEMA-CIVICO.md) | 15 itens abertos; cortar para 3 frentes |
| P12 | Educação em IA e software livre | [PLANO-TECNOLOGIA-IA-E-EDUCACAO-POPULAR](/docs/historico/planos/PLANO-TECNOLOGIA-IA-E-EDUCACAO-POPULAR.md) | 4 itens abertos |
| P13 | Revisar UX e onboarding | [REVISAO-UX-E-ONBOARDING](/docs/historico/planos/REVISAO-UX-E-ONBOARDING.md) | usar como checklist de entrada |

## Decisões do dono

1. `/ambiental/contratos`: criar página ou remover o link.
2. Divulgação: autorizar publicações e em que canais.
3. Identidade visual: aprovar a direção antes de mexer no hero.

## Critérios de pronto

1. Top 100 com pelo menos 90 páginas completas na régua estática.
2. Nenhuma rota do índice sem página ou sem aviso.
3. Mobile 390 px sem rolagem lateral nas páginas do top 100.
4. SEO remedido e registrado com data.

## Origem / Histórico

Consolida, em 18/10/2026, as pendências dos planos arquivados em
[`../historico/planos/`](../historico/planos/) ligados a produto, conteúdo e
interface. Os documentos originais seguem íntegros lá.
