# LinkMender — Propostas de Correcao de Links

- Gerado em: 2026-08-31T19:36:28.391Z
- Duracao total: 2.0 min
- Pausa entre requisicoes: 400ms

## Resumo

- Total de URLs unicas testadas: 97
- OK: 72
- QUEBRADOS: 5
- REDIRECTS: 9
- INCONSISTENTES: 11
- Propostas geradas: 7
- Links sem proposta: 7

## Links quebrados e redirecionados

| URL | classe | status | finalUrl |
|---|---|---|---|
| https://app.anm.gov.br/SIGMINE/ | QUEBRADO | 404 | https://app.anm.gov.br/SIGMINE/ |
| https://drive.google.com/exemplo | QUEBRADO | 404 | https://drive.google.com/exemplo |
| https://github.com/FinweeJur/controle-popular/blob/main/docs/betim/alertas-contratos-revisao-juridica.md | QUEBRADO | 404 | https://github.com/FinweeJur/controle-popular/blob/main/docs/betim/alertas-contratos-revisao-juridica.md |
| https://legis.senado.leg.br/dadosabertos | REDIRECT | 200 | https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html |
| https://legis.senado.leg.br/dadosabertos/ | REDIRECT | 200 | https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html |
| https://pncp.gov.br | REDIRECT | 200 | https://www.gov.br/pncp/pt-br |
| https://pncp.gov.br/ | REDIRECT | 200 | https://www.gov.br/pncp/pt-br |
| https://projetorioparaopeba.fgv.br | REDIRECT | 200 | https://www18.fgv.br/projetorioparaopeba/ |
| https://revendedoresapi.anp.gov.br/swagger/index.html | QUEBRADO | 404 | https://revendedoresapi.anp.gov.br/swagger/index.html |
| https://sidra.ibge.gov.br/pesquisa/pam | REDIRECT | 200 | https://sidra.ibge.gov.br/pesquisa/pam/tabelas |
| https://sidra.ibge.gov.br/pesquisa/ppm | REDIRECT | 200 | https://sidra.ibge.gov.br/pesquisa/ppm/quadros/brasil/2024 |
| https://www.aedasmg.org | REDIRECT | 200 | https://aedasmg.org/ |
| https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/consultas/boletim-diario/series-historicas/ | REDIRECT | 200 | https://www.b3.com.br/pt_br/redirecionamento/pagina-nao-encontrada/ |
| https://www.cnj.jus.br/corregedoriacnj/inspecoes-e-corricoes/ | QUEBRADO | 404 | https://www.cnj.jus.br/corregedoriacnj/inspecoes-e-corricoes/ |

## Propostas com diff

### 1. https://sidra.ibge.gov.br/pesquisa/pam

```diff
- href="https://sidra.ibge.gov.br/pesquisa/pam"
+ href="https://sidra.ibge.gov.br/pesquisa/pam/tabelas"
```

Confianca: alta
Justificativa: Servidor respondeu redirect para este endereco, que respondeu HTTP 200 na sondagem
Origem: apps/web/app/[municipio]/agro/page.tsx

### 2. https://sidra.ibge.gov.br/pesquisa/ppm

```diff
- href="https://sidra.ibge.gov.br/pesquisa/ppm"
+ href="https://sidra.ibge.gov.br/pesquisa/ppm/quadros/brasil/2024"
```

Confianca: alta
Justificativa: Servidor respondeu redirect para este endereco, que respondeu HTTP 200 na sondagem
Origem: apps/web/app/[municipio]/agro/page.tsx

### 3. https://pncp.gov.br/

```diff
- href="https://pncp.gov.br/"
+ href="https://www.gov.br/pncp/pt-br"
```

Confianca: alta
Justificativa: Servidor respondeu redirect para este endereco, que respondeu HTTP 200 na sondagem
Origem: apps/web/app/[municipio]/interesses/page.tsx

### 4. https://revendedoresapi.anp.gov.br/swagger/index.html

```diff
- href="https://revendedoresapi.anp.gov.br/swagger/index.html"
+ href="https://www.gov.br/anp/pt-br/centrais-de-conteudo/paineis-dinamicos-da-anp/paineis-dinamicos-do-abastecimento/api-revendedores-manual-usuario.pdf"
```

Confianca: media
Justificativa: URL atualizada encontrada em busca no DuckDuckGo no mesmo dominio governamental; verificada HTTP 403
Origem: apps/web/app/[municipio]/postos-combustivel/ListaPostos.tsx

### 5. https://pncp.gov.br

```diff
- href="https://pncp.gov.br"
+ href="https://www.gov.br/pncp/pt-br"
```

Confianca: alta
Justificativa: Servidor respondeu redirect para este endereco, que respondeu HTTP 200 na sondagem
Origem: registry

### 6. https://www.cnj.jus.br/corregedoriacnj/inspecoes-e-corricoes/

```diff
- href="https://www.cnj.jus.br/corregedoriacnj/inspecoes-e-corricoes/"
+ href="https://www.cnj.jus.br/corregedoriacnj/inspecoes-correicoes/"
```

Confianca: media
Justificativa: URL atualizada encontrada em busca no DuckDuckGo no mesmo dominio governamental; verificada HTTP 200
Origem: registry

### 7. https://app.anm.gov.br/SIGMINE/

```diff
- href="https://app.anm.gov.br/SIGMINE/"
+ href="https://geo.anm.gov.br/portal/apps/webappviewer/index.html?id=6a8f5ccc4b6a4c2bba79759aa952d908"
```

Confianca: media
Justificativa: URL atualizada encontrada em busca no DuckDuckGo no mesmo dominio governamental; verificada HTTP 200
Origem: registry

## Quebrados e redirecionados sem proposta

- https://legis.senado.leg.br/dadosabertos (200) — dominio nao governamental — correcao manual
- https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/consultas/boletim-diario/series-historicas/ (200) — dominio nao governamental — correcao manual
- https://github.com/FinweeJur/controle-popular/blob/main/docs/betim/alertas-contratos-revisao-juridica.md (404) — dominio nao governamental — correcao manual
- https://drive.google.com/exemplo (404) — dominio nao governamental — correcao manual
- https://legis.senado.leg.br/dadosabertos/ (200) — dominio nao governamental — correcao manual
- https://projetorioparaopeba.fgv.br (200) — dominio nao governamental — correcao manual
- https://www.aedasmg.org (200) — dominio nao governamental — correcao manual

## Inconsistentes (nao verificados, sem proposta)

- https://ajri.aecom.com.br (rede) — erro de rede: fetch failed
- https://comunicabr.gov.br (rede) — erro de rede: fetch failed
- https://comunicabr.presidencia.gov.br (rede) — erro de rede: fetch failed
- https://exemplo.gov.br/nao-deveria-aparecer.pdf (rede) — erro de rede: fetch failed
- https://geoserver.funai.gov.br (rede) — erro de rede: fetch failed
- https://portaldatransparencia.gov.br (405) — status HTTP 405 (nem ok, nem quebrado, nem redirect)
- https://portaldatransparencia.gov.br/beneficios (405) — status HTTP 405 (nem ok, nem quebrado, nem redirect)
- https://portaldatransparencia.gov.br/convenios (405) — status HTTP 405 (nem ok, nem quebrado, nem redirect)
- https://sistemas.meioambiente.mg.gov.br/licenciamento/site/consulta-licenca (rede) — erro de rede: This operation was aborted
- https://www.car.gov.br/publico/imoveis/index (500) — status HTTP 500 (nem ok, nem quebrado, nem redirect)
- https://y.gov.br (rede) — erro de rede: fetch failed

---

Relatorio gerado por LinkMender (scripts/agent-tools/linkmender-checker.mts). Correcoes NAO sao commitadas automaticamente — este arquivo e a proposta para revisao humana.
