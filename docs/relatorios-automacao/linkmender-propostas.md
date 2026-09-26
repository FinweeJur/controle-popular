# LinkMender — Propostas de Correcao de Links

- Gerado em: 2026-09-26T06:38:29.289Z
- Duracao total: 3.2 min
- Pausa entre requisicoes: 400ms

## Resumo

- Total de URLs unicas testadas: 148
- OK: 122
- QUEBRADOS: 4
- REDIRECTS: 12
- INCONSISTENTES: 10
- Propostas geradas: 4
- Links sem proposta: 12

## Links quebrados e redirecionados

| URL | classe | status | finalUrl |
|---|---|---|---|
| https://api.salic.cultura.gov.br | REDIRECT | 200 | https://api.salic.cultura.gov.br/docs |
| https://controlepopular.com.br | REDIRECT | 200 | https://www.controlepopular.com.br/ |
| https://controlepopular.com.br/ambiental/crimes-socioambientais | REDIRECT | 200 | https://www.controlepopular.com.br/ambiental/crimes-socioambientais |
| https://dadosabertos.almg.gov.br | REDIRECT | 200 | http://dadosabertos.almg.gov.br/documentacao/index |
| https://drive.google.com/exemplo | QUEBRADO | 404 | https://drive.google.com/exemplo |
| https://exemplo.org/a | QUEBRADO | 404 | https://exemplo.org/a |
| https://github.com/FinweeJur/controle-popular/blob/main/docs/betim/alertas-contratos-revisao-juridica.md | QUEBRADO | 404 | https://github.com/FinweeJur/controle-popular/blob/main/docs/betim/alertas-contratos-revisao-juridica.md |
| https://legis.senado.leg.br/dadosabertos | REDIRECT | 200 | https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html |
| https://legis.senado.leg.br/dadosabertos/ | REDIRECT | 200 | https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html |
| https://news.google.com/ | REDIRECT | 200 | https://news.google.com/home?hl=en-US&gl=US&ceid=US:en |
| https://projetorioparaopeba.fgv.br | REDIRECT | 200 | https://www18.fgv.br/projetorioparaopeba/ |
| https://revendedoresapi.anp.gov.br/swagger/index.html | QUEBRADO | 404 | https://revendedoresapi.anp.gov.br/swagger/index.html |
| https://sistemas.anatel.gov.br | REDIRECT | 200 | https://sistemas.anatel.gov.br/sis/SistemasInterativos.asp |
| https://www.aedasmg.org | REDIRECT | 200 | https://aedasmg.org/ |
| https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/consultas/boletim-diario/series-historicas/ | REDIRECT | 200 | https://www.b3.com.br/pt_br/redirecionamento/pagina-nao-encontrada/ |
| https://www.fundacaorenova.org | REDIRECT | 200 | https://www.reparacaobaciariodoce.com/ |

## Propostas com diff

### 1. https://dadosabertos.almg.gov.br

```diff
- href="https://dadosabertos.almg.gov.br"
+ href="http://dadosabertos.almg.gov.br/documentacao/index"
```

Confianca: alta
Justificativa: Servidor respondeu redirect para este endereco, que respondeu HTTP 200 na sondagem
Origem: apps/web/app/congresso/almg/page.tsx

### 2. https://api.salic.cultura.gov.br

```diff
- href="https://api.salic.cultura.gov.br"
+ href="https://api.salic.cultura.gov.br/docs"
```

Confianca: alta
Justificativa: Servidor respondeu redirect para este endereco, que respondeu HTTP 200 na sondagem
Origem: apps/web/app/documentacao/fontes-e-coletas/page.tsx

### 3. https://sistemas.anatel.gov.br

```diff
- href="https://sistemas.anatel.gov.br"
+ href="https://sistemas.anatel.gov.br/sis/SistemasInterativos.asp"
```

Confianca: alta
Justificativa: Servidor respondeu redirect para este endereco, que respondeu HTTP 200 na sondagem
Origem: apps/web/app/documentacao/fontes-e-coletas/page.tsx

### 4. https://revendedoresapi.anp.gov.br/swagger/index.html

```diff
- href="https://revendedoresapi.anp.gov.br/swagger/index.html"
+ href="https://revendedoresapi.anp.gov.br/swagger/v1/swagger.json"
```

Confianca: media
Justificativa: URL atualizada encontrada em busca no DuckDuckGo no mesmo dominio governamental; verificada HTTP 200
Origem: apps/web/lib/linkmender/busca.test.ts

## Quebrados e redirecionados sem proposta

- https://www.fundacaorenova.org (200) — dominio nao governamental — correcao manual
- https://controlepopular.com.br (200) — dominio nao governamental — correcao manual
- https://legis.senado.leg.br/dadosabertos (200) — dominio nao governamental — correcao manual
- https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/consultas/boletim-diario/series-historicas/ (200) — dominio nao governamental — correcao manual
- https://github.com/FinweeJur/controle-popular/blob/main/docs/betim/alertas-contratos-revisao-juridica.md (404) — dominio nao governamental — correcao manual
- https://drive.google.com/exemplo (404) — dominio nao governamental — correcao manual
- https://exemplo.org/a (404) — dominio nao governamental — correcao manual
- https://legis.senado.leg.br/dadosabertos/ (200) — dominio nao governamental — correcao manual
- https://projetorioparaopeba.fgv.br (200) — dominio nao governamental — correcao manual
- https://www.aedasmg.org (200) — dominio nao governamental — correcao manual
- https://controlepopular.com.br/ambiental/crimes-socioambientais (200) — dominio nao governamental — correcao manual
- https://news.google.com/ (200) — dominio nao governamental — correcao manual

## Inconsistentes (nao verificados, sem proposta)

- https://comunicabr.com.br (rede) — erro de rede: fetch failed
- https://exemplo.com/direto (rede) — erro de rede: fetch failed
- https://exemplo.gov.br/nao-deveria-aparecer.pdf (rede) — erro de rede: fetch failed
- https://nao-deve-entrar.com/x (rede) — erro de rede: fetch failed
- https://pncp.gov.br/ (rede) — erro de rede: fetch failed
- https://portaldatransparencia.gov.br (405) — status HTTP 405 (nem ok, nem quebrado, nem redirect)
- https://portaldatransparencia.gov.br/beneficios (405) — status HTTP 405 (nem ok, nem quebrado, nem redirect)
- https://portaldatransparencia.gov.br/convenios (405) — status HTTP 405 (nem ok, nem quebrado, nem redirect)
- https://www.sinesp.mg.gov.br (rede) — erro de rede: fetch failed
- https://y.gov.br (rede) — erro de rede: fetch failed

---

Relatorio gerado por LinkMender (scripts/agent-tools/linkmender-checker.mts). Correcoes NAO sao commitadas automaticamente — este arquivo e a proposta para revisao humana.
