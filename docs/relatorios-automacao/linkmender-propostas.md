# LinkMender — Propostas de Correcao de Links

- Gerado em: 2026-09-01T13:17:16.946Z
- Duracao total: 2.3 min
- Pausa entre requisicoes: 400ms

## Resumo

- Total de URLs unicas testadas: 98
- OK: 75
- QUEBRADOS: 3
- REDIRECTS: 5
- INCONSISTENTES: 15
- Propostas geradas: 8
- Links sem proposta: 0

## Links quebrados e redirecionados

| URL | classe | status | finalUrl |
|---|---|---|---|
| https://drive.google.com/exemplo | QUEBRADO | 404 | https://drive.google.com/exemplo |
| https://github.com/FinweeJur/controle-popular/blob/main/docs/betim/alertas-contratos-revisao-juridica.md | QUEBRADO | 404 | https://github.com/FinweeJur/controle-popular/blob/main/docs/betim/alertas-contratos-revisao-juridica.md |
| https://legis.senado.leg.br/dadosabertos | REDIRECT | 200 | https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html |
| https://legis.senado.leg.br/dadosabertos/ | REDIRECT | 200 | https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html |
| https://projetorioparaopeba.fgv.br | REDIRECT | 200 | https://www18.fgv.br/projetorioparaopeba/ |
| https://revendedoresapi.anp.gov.br/swagger/index.html | QUEBRADO | 404 | https://revendedoresapi.anp.gov.br/swagger/index.html |
| https://www.aedasmg.org | REDIRECT | 200 | https://aedasmg.org/ |
| https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/consultas/boletim-diario/series-historicas/ | REDIRECT | 200 | https://www.b3.com.br/pt_br/redirecionamento/pagina-nao-encontrada/ |

## Propostas com diff

### 1. https://legis.senado.leg.br/dadosabertos

```diff
- href="https://legis.senado.leg.br/dadosabertos"
+ href="https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html"
```

Confianca: alta
Justificativa: Servidor respondeu redirect para este endereco, que respondeu HTTP 200 na sondagem
Origem: apps/web/app/judiciario/components/FonteRodape.tsx

### 2. https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/consultas/boletim-diario/series-historicas/

```diff
- href="https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/consultas/boletim-diario/series-historicas/"
+ href="https://www.b3.com.br/pt_br/redirecionamento/pagina-nao-encontrada/"
```

Confianca: alta
Justificativa: Servidor respondeu redirect para este endereco, que respondeu HTTP 200 na sondagem
Origem: apps/web/app/paraopeba/correlacao/page.tsx

### 3. https://github.com/FinweeJur/controle-popular/blob/main/docs/betim/alertas-contratos-revisao-juridica.md

```diff
- href="https://github.com/FinweeJur/controle-popular/blob/main/docs/betim/alertas-contratos-revisao-juridica.md"
+ href="https://github.com/FinweeJur/controle-popular"
```

Confianca: media
Justificativa: URL substituta encontrada via DuckDuckGo; verificada HTTP 200
Origem: apps/web/app/[municipio]/metodologia/page.tsx

### 4. https://revendedoresapi.anp.gov.br/swagger/index.html

```diff
- href="https://revendedoresapi.anp.gov.br/swagger/index.html"
+ href="https://www.gov.br/anp/pt-br/centrais-de-conteudo/paineis-dinamicos-da-anp/paineis-dinamicos-do-abastecimento/api-revendedores-manual-usuario.pdf"
```

Confianca: media
Justificativa: URL substituta encontrada via DuckDuckGo; verificada HTTP 403
Origem: apps/web/app/[municipio]/postos-combustivel/ListaPostos.tsx

### 5. https://drive.google.com/exemplo

```diff
- href="https://drive.google.com/exemplo"
+ href="https://drive.google.com/"
```

Confianca: media
Justificativa: URL substituta encontrada via DuckDuckGo; verificada HTTP 200
Origem: apps/web/lib/ambiental/estudos.test.ts

### 6. https://legis.senado.leg.br/dadosabertos/

```diff
- href="https://legis.senado.leg.br/dadosabertos/"
+ href="https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html"
```

Confianca: alta
Justificativa: Servidor respondeu redirect para este endereco, que respondeu HTTP 200 na sondagem
Origem: registry

### 7. https://projetorioparaopeba.fgv.br

```diff
- href="https://projetorioparaopeba.fgv.br"
+ href="https://www18.fgv.br/projetorioparaopeba/"
```

Confianca: alta
Justificativa: Servidor respondeu redirect para este endereco, que respondeu HTTP 200 na sondagem
Origem: registry

### 8. https://www.aedasmg.org

```diff
- href="https://www.aedasmg.org"
+ href="https://aedasmg.org/"
```

Confianca: alta
Justificativa: Servidor respondeu redirect para este endereco, que respondeu HTTP 200 na sondagem
Origem: registry

## Quebrados e redirecionados sem proposta

Nenhum link sem proposta nesta execucao.

## Inconsistentes (nao verificados, sem proposta)

- https://comunicabr.presidencia.gov.br (rede) — erro de rede: fetch failed
- https://datajud-wiki.cnj.jus.br (rede) — erro de rede: fetch failed
- https://exemplo.gov.br/nao-deveria-aparecer.pdf (rede) — erro de rede: fetch failed
- https://geopresidios.cnj.jus.br (rede) — erro de rede: fetch failed
- https://geoserver.funai.gov.br (rede) — erro de rede: fetch failed
- https://pncp.gov.br (rede) — erro de rede: fetch failed
- https://pncp.gov.br/ (rede) — erro de rede: fetch failed
- https://portaldatransparencia.gov.br (405) — status HTTP 405 (nem ok, nem quebrado, nem redirect)
- https://portaldatransparencia.gov.br/beneficios (405) — status HTTP 405 (nem ok, nem quebrado, nem redirect)
- https://portaldatransparencia.gov.br/convenios (405) — status HTTP 405 (nem ok, nem quebrado, nem redirect)
- https://prd.s3.cnj.jus.br/sirenejud/vw_sirenejud.parquet (rede) — erro de rede: fetch failed
- https://sirenejud.cnj.jus.br/ (rede) — erro de rede: fetch failed
- https://sistemas.meioambiente.mg.gov.br/licenciamento/site/consulta-licenca (500) — status HTTP 500 (nem ok, nem quebrado, nem redirect)
- https://www.car.gov.br/publico/imoveis/index (rede) — erro de rede: fetch failed
- https://y.gov.br (rede) — erro de rede: fetch failed

---

Relatorio gerado por LinkMender (scripts/agent-tools/linkmender-checker.mts). Correcoes NAO sao commitadas automaticamente — este arquivo e a proposta para revisao humana.
