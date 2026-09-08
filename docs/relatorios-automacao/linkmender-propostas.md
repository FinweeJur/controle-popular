# LinkMender — Propostas de Correcao de Links

- Gerado em: 2026-09-08T06:41:01.043Z
- Duracao total: 2.1 min
- Pausa entre requisicoes: 400ms

## Resumo

- Total de URLs unicas testadas: 118
- OK: 94
- QUEBRADOS: 4
- REDIRECTS: 8
- INCONSISTENTES: 12
- Propostas geradas: 3
- Links sem proposta: 9

## Links quebrados e redirecionados

| URL | classe | status | finalUrl |
|---|---|---|---|
| https://drive.google.com/exemplo | QUEBRADO | 404 | https://drive.google.com/exemplo |
| https://github.com/FinweeJur/controle-popular/blob/main/docs/betim/alertas-contratos-revisao-juridica.md | QUEBRADO | 404 | https://github.com/FinweeJur/controle-popular/blob/main/docs/betim/alertas-contratos-revisao-juridica.md |
| https://github.com/melkepinho/controle-popular/blob/main/docs/FONTE.md#painel-tacs-final | QUEBRADO | 404 | https://github.com/melkepinho/controle-popular/blob/main/docs/FONTE.md |
| https://legis.senado.leg.br/dadosabertos | REDIRECT | 200 | https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html |
| https://legis.senado.leg.br/dadosabertos/ | REDIRECT | 200 | https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html |
| https://mpmg.mp.br/portal/menu/comunicacao/noticias/ | REDIRECT | 200 | https://www.mpmg.mp.br/portal/menu/comunicacao/noticias/ |
| https://news.google.com/ | REDIRECT | 200 | https://news.google.com/home?hl=en-US&gl=US&ceid=US:en |
| https://pncp.gov.br | REDIRECT | 200 | https://www.gov.br/pncp/pt-br |
| https://projetorioparaopeba.fgv.br | REDIRECT | 200 | https://www18.fgv.br/projetorioparaopeba/ |
| https://revendedoresapi.anp.gov.br/swagger/index.html | QUEBRADO | 404 | https://revendedoresapi.anp.gov.br/swagger/index.html |
| https://www.aedasmg.org | REDIRECT | 200 | https://aedasmg.org/ |
| https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/consultas/boletim-diario/series-historicas/ | REDIRECT | 200 | https://www.b3.com.br/pt_br/redirecionamento/pagina-nao-encontrada/ |

## Propostas com diff

### 1. https://revendedoresapi.anp.gov.br/swagger/index.html

```diff
- href="https://revendedoresapi.anp.gov.br/swagger/index.html"
+ href="https://www.gov.br/anp/pt-br/centrais-de-conteudo/paineis-dinamicos-da-anp/paineis-dinamicos-do-abastecimento/api-revendedores-manual-usuario.pdf"
```

Confianca: media
Justificativa: URL atualizada encontrada em busca no DuckDuckGo no mesmo dominio governamental; verificada HTTP 403
Origem: apps/web/app/[municipio]/postos-combustivel/ListaPostos.tsx

### 2. https://pncp.gov.br

```diff
- href="https://pncp.gov.br"
+ href="https://www.gov.br/pncp/pt-br"
```

Confianca: alta
Justificativa: Servidor respondeu redirect para este endereco, que respondeu HTTP 200 na sondagem
Origem: registry

### 3. https://mpmg.mp.br/portal/menu/comunicacao/noticias/

```diff
- href="https://mpmg.mp.br/portal/menu/comunicacao/noticias/"
+ href="https://www.mpmg.mp.br/portal/menu/comunicacao/noticias/"
```

Confianca: alta
Justificativa: Servidor respondeu redirect para este endereco, que respondeu HTTP 200 na sondagem
Origem: registry

## Quebrados e redirecionados sem proposta

- https://github.com/melkepinho/controle-popular/blob/main/docs/FONTE.md#painel-tacs-final (404) — dominio nao governamental — correcao manual
- https://legis.senado.leg.br/dadosabertos (200) — dominio nao governamental — correcao manual
- https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/consultas/boletim-diario/series-historicas/ (200) — dominio nao governamental — correcao manual
- https://github.com/FinweeJur/controle-popular/blob/main/docs/betim/alertas-contratos-revisao-juridica.md (404) — dominio nao governamental — correcao manual
- https://drive.google.com/exemplo (404) — dominio nao governamental — correcao manual
- https://legis.senado.leg.br/dadosabertos/ (200) — dominio nao governamental — correcao manual
- https://projetorioparaopeba.fgv.br (200) — dominio nao governamental — correcao manual
- https://www.aedasmg.org (200) — dominio nao governamental — correcao manual
- https://news.google.com/ (200) — dominio nao governamental — correcao manual

## Inconsistentes (nao verificados, sem proposta)

- https://comunicabr.presidencia.gov.br (rede) — erro de rede: fetch failed
- https://exemplo.gov.br/nao-deveria-aparecer.pdf (rede) — erro de rede: fetch failed
- https://geoserver.funai.gov.br (rede) — erro de rede: fetch failed
- https://mpf.mp.br/atuacao/grandes-casos/caso-samarco/documentos (rede) — erro de rede: fetch failed
- https://pncp.gov.br/ (rede) — erro de rede: fetch failed
- https://portaldatransparencia.gov.br (405) — status HTTP 405 (nem ok, nem quebrado, nem redirect)
- https://portaldatransparencia.gov.br/beneficios (405) — status HTTP 405 (nem ok, nem quebrado, nem redirect)
- https://portaldatransparencia.gov.br/convenios (405) — status HTTP 405 (nem ok, nem quebrado, nem redirect)
- https://sistemas.meioambiente.mg.gov.br/licenciamento/site/consulta-licenca (500) — status HTTP 500 (nem ok, nem quebrado, nem redirect)
- https://www.car.gov.br/publico/imoveis/index (rede) — erro de rede: fetch failed
- https://www.sinesp.mg.gov.br (rede) — erro de rede: fetch failed
- https://y.gov.br (rede) — erro de rede: fetch failed

---

Relatorio gerado por LinkMender (scripts/agent-tools/linkmender-checker.mts). Correcoes NAO sao commitadas automaticamente — este arquivo e a proposta para revisao humana.
