# Plano de SEO e visibilidade em buscadores

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-08-22
> **Leitura estimada:** longa (> 15 min)
> **Relacionados:** [PRODUTO.md](../01-produto/PRODUTO.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [OPERACAO.md](../05-operacao/OPERACAO.md), [TODO-PROXIMAS-RODADAS.md](../historico/planos/TODO-PROXIMAS-RODADAS.md)
> **Palavras-chave:** SEO, Google, indexacao, sitemap, structured data, Core Web Vitals, palavras-chave locais, transparencia municipal, transparencia MG

## Sumário

- [Diagnóstico atual (o que precisamos medir)](#diagnóstico-atual-o-que-precisamos-medir)
- [Objetivo e métricas de sucesso](#objetivo-e-métricas-de-sucesso)
- [Eixos de trabalho](#eixos-de-trabalho)
- [Palavras-chave por frente e por público](#palavras-chave-por-frente-e-por-público)
- [Entregáveis e ordem de execução](#entregáveis-e-ordem-de-execução)
- [Riscos e armadilhas](#riscos-e-armadilhas)
- [Decisões registradas](#decisões-registradas)

## Diagnóstico atual (o que precisamos medir)

Antes de começar, coletar a baseline. Sem medição não dá para saber se o plano funcionou.

| Item | Ferramenta | O que medir |
|---|---|---|
| Indexação | Google Search Console, `site:controlepopular.com.br` | Quantas páginas estão indexadas; quais aparecem para as palavras-chave desejadas |
| Performance | PageSpeed Insights, Lighthouse, Web Vitals | LCP, INP, CLS; mobile é prioridade porque o tráfego cívico local é majoritariamente mobile |
| Palavras-chave | Google Search Console, Trends | Termos que já trazem cliques; termos em que o site aparece na 2ª página ou além |
| Backlinks | Search Console, Ahrefs/semrush gratuitos | Quem linka para o site hoje; onde faltam citações |
| Estrutura técnica | Screaming Frog (free) ou crawl manual | Páginas sem `<title>`, sem meta description, canonical quebrado, duplicatas |

### Hipóteses a confirmar

1. O site é estático (`output: export`), então não há SSR dinâmico — o que é bom para cache, mas exige que cada rota tenha `<title>` e `<meta name="description">` definidos no build.
2. O domínio é recente ou pouco citado — autoridade de domínio provavelmente é baixa; a estratégia deve priorizar **palavras-chave de cauda longa e locais** em vez de termos genéricos como "transparência".
3. Muitas páginas podem ter conteúdo gerado por dados (tabelas, gráficos) sem texto explicativo em HTML — buscadores leem texto, não gráficos.
4. O sitemap pode não estar atualizado com as rotas municipais, frentes ou páginas novas.

## Objetivo e métricas de sucesso

**Objetivo:** fazer com que páginas do `controlepopular.com.br` apareçam na primeira página do Google e de outros buscadores para consultas específicas de transparência pública municipal e estadual em Minas Gerais.

**Métricas de sucesso (6 meses):**

- 50% das palavras-chave prioritárias de cauda longa na primeira página.
- Crescimento de 3× no número de páginas indexadas.
- Crescimento de 5× no tráfego orgânico mensurado pelo Search Console.
- Core Web Vitals "Good" para 90% das URLs mobile.
- Pelo menos 10 backlinks novos de sites de imprensa, ONGs, universidades ou órgãos públicos.

## Eixos de trabalho

### 1. Fundação técnica

- **Sitemap dinâmico e atualizado:** gerar `sitemap.xml` no build com todas as rotas municipais, frentes e páginas de conteúdo. Submeter no Search Console.
- **Robots.txt otimizado:** permitir indexação de conteúdo público; bloquear rotas de busca interna, painel de edição e dados pessoais.
- **URLs amigáveis e persistentes:** garantir que `/betim/contratos`, `/paraopeba/repasse`, `/ambiental/licenciamento` etc. tenham estrutura previsível e não quebrem quando dados mudarem.
- **Canonical e hreflang:** uma canonical por página; se houver versões por UF no futuro, planejar hreflang.
- **Meta tags por rota:** cada página precisa de `<title>` único (até 60 caracteres), `<meta name="description">` único (até 155 caracteres) e Open Graph/Twitter Cards.

### 2. Conteúdo e palavras-chave

- **Texto em cada página de dados:** além da tabela/gráfico, incluir 2–3 parágrafos explicando o que está sendo mostrado, de onde veio o dado, atualização e limitações. Isso é essencial para indexação.
- **Páginas de entrada por tema:** criar landing pages para termos de busca, como:
  - "contratos públicos de Betim"
  - "repasse do acordo de Brumadinho para municípios"
  - "licenciamento ambiental Minas Gerais"
  - "Lei Rouanet em Belo Horizonte"
  - "obras do Acordo Paraopeba"
- **FAQ e glossário:** responder perguntas reais ("o que é repasse do acordo?", "como consultar contratos de prefeitura?"). Isso captura featured snippets.
- **Blog ou notas técnicas:** publicar análises periódicas com cruzamentos de dados — ex: "Quais municípios de MG mais prorrogaram convênios?". Cada análise é uma página indexável e uma peça de divulgação.

### 3. Structured data

- Implementar schema.org nos tipos relevantes:
  - `Dataset` para páginas de dados abertos;
  - `GovernmentOrganization` para páginas institucionais;
  - `Article`/`NewsArticle` para notas técnicas;
  - `BreadcrumbList` para navegação.
- Isso melhora o rich snippet e a chance de aparecer em "People also ask".

### 4. Performance e mobile

- O teto do Cloudflare Worker (3 MiB gzip) já força economia de bundle; isso ajuda o SEO.
- Medir e otimizar LCP, INP e CLS.
- Garantir que conteúdo principal não dependa de JavaScript para renderizar (o export estático ajuda, mas verificar).

### 5. Link building e autoridade

- **Parcerias institucionais:** universidades (UFMG, PUC-MG), ONGs (MAB, Nacab, Guaicuy), veículos de imprensa local.
- **Press releases de descobertas:** quando uma análise encontrar algo relevante, enviar para jornalistas com link para a página do portal.
- **Diretórios:** cadastrar em repositórios de dados abertos, portais de transparência, Wikipédia (quando houver notoriedade), Google Meu Negócio se houver endereço físico.
- **Citações em documentos oficiais:** encaminhar análises para TCU, TCE-MG, CGU, MPMG — se citarem, o backlink é de alta autoridade.

### 6. Monitoramento contínuo

- Configurar Google Search Console, Bing Webmaster Tools e (se possível) Yandex/Webmaster.
- Relatório mensal: palavras-chave que subiram/caíram, páginas com maior CTR, erros de indexação, Core Web Vitals.
- Revisar meta descriptions com CTR < 2%.

## Palavras-chave por frente e por público

### Cidades / contratos

- "contratos públicos [município]"
- "maiores fornecedores da prefeitura de [município]"
- "despesa municipal [município]"
- "transparência [município] MG"
- "obras em andamento [município]"

### Congresso / Lei Rouanet

- "Lei Rouanet [município]"
- "incentivadores culturais [município]"
- "projetos Rouanet aprovados MG"

### Judiciário

- "processos ambientais [município]"
- "ações civis públicas Minas Gerais"

### Paraopeba

- "repasse acordo Brumadinho municípios"
- "obras Acordo Paraopeba"
- "projetos Rio Paraopeba FGV"
- "municípios atingidos Brumadinho"

### Ambiental

- "licenciamento ambiental Minas Gerais"
- "TAC ambiental MG"
- "barragens em descaracterização MG"
- "terras indígenas Minas Gerais"
- "comunidades quilombolas Minas Gerais"

## Entregáveis e ordem de execução

### Sprint 1 — Diagnóstico e fundação

1. Configurar/acesso Google Search Console e Bing Webmaster Tools.
2. Rodar audit técnico: sitemap, robots.txt, meta tags, canonical, structured data, Core Web Vitals.
3. Gerar/melhorar `sitemap.xml` e `robots.txt`.
4. Baseline de palavras-chave e tráfego orgânico.

### Sprint 2 — On-page

5. Implementar `<title>` e `<meta name="description">` dinâmicos por rota.
6. Adicionar texto introdutório em páginas de dados principais.
7. Implementar BreadcrumbList e Dataset schema.
8. Criar landing pages para os 10 termos prioritários.

### Sprint 3 — Conteúdo e autoridade

9. Publicar 2 notas técnicas iniciais com cruzamentos de dados.
10. Iniciar outreach para parceiros institucionais e imprensa.
11. Cadastrar portal em diretórios de dados abertos.

### Sprint 4 — Monitoramento

12. Criar dashboard mensal de SEO.
13. Revisar meta descriptions e títulos com baixo CTR.
14. Planejar próximas notas técnicas com base nas palavras-chave que subiram.

## Riscos e armadilhas

| Risco | Mitigação |
|---|---|
| Páginas de dados geradas automaticamente parecem "thin content" para o Google | Sempre incluir texto contextual, fonte, data de atualização e limitações; nunca publicar só tabela |
| Palavras-chave genéricas são competitivas demais | Focar em cauda longa local ("contratos Betim", não "transparência") |
| Dados desatualizados reduzem autoridade | Mostrar data de coleta e próxima atualização esperada |
| Expor dado pessoal gera penalidade e dano | Manter régua de triagem; nunca indexar CPF, endereço ou nome de vítima |
| Mudança de URL quebra indexação | Usar redirects 301 se precisar renomear rotas |
| Google demora a indexar páginas novas | Submeter sitemap e usar links internos fortes |

## Decisões registradas

- SEO não é uma etapa única; é rotina mensal de medição, conteúdo e outreach.
- A estratégia prioriza palavras-chave locais e de cauda longa, não termos genéricos nacionais.
- Cada página de dados precisa de texto explicativo em HTML para ser indexada de forma robusta.
- Backlinks de instituições públicas, universidades e imprensa valem mais que volume de links genéricos.
