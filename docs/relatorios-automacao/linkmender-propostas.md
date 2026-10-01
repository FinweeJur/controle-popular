# LinkMender — Propostas de Correcao de Links

- Gerado em: 2026-10-01T06:41:23.556Z
- Duracao total: 7.4 min
- Pausa entre requisicoes: 400ms

## Resumo

- Total de URLs unicas testadas: 371
- OK: 318
- QUEBRADOS: 5
- REDIRECTS: 22
- INCONSISTENTES: 26
- Propostas geradas: 10
- Links sem proposta: 17

## Links quebrados e redirecionados

| URL | classe | status | finalUrl |
|---|---|---|---|
| https://api.salic.cultura.gov.br | REDIRECT | 200 | https://api.salic.cultura.gov.br/docs |
| https://auniao.pb.gov.br/servicos/copy_of_jornal-a-uniao/dec-30 | REDIRECT | 200 | https://auniao.pb.gov.br/servicos/copy_of_jornal-a-uniao/@@electoral_period_blocked |
| https://controlepopular.com.br | REDIRECT | 200 | https://www.controlepopular.com.br/ |
| https://core-ombuds.canada.ca/core_ombuds-ocre_ombuds/complaint-plainte.aspx?lang=eng | REDIRECT | 200 | https://www.international.gc.ca/trade-commerce/ncp-pcn/index.aspx?lang=eng |
| https://dadosabertos.almg.gov.br | REDIRECT | 200 | http://dadosabertos.almg.gov.br/documentacao/index |
| https://drive.google.com/exemplo | QUEBRADO | 404 | https://drive.google.com/exemplo |
| https://exemplo.org/a | QUEBRADO | 404 | https://exemplo.org/a |
| https://github.com/FinweeJur/controle-popular/blob/main/docs/betim/alertas-contratos-revisao-juridica.md | QUEBRADO | 404 | https://github.com/FinweeJur/controle-popular/blob/main/docs/betim/alertas-contratos-revisao-juridica.md |
| https://legis.senado.leg.br/dadosabertos | REDIRECT | 200 | https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html |
| https://legis.senado.leg.br/dadosabertos/ | REDIRECT | 200 | https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html |
| https://multirio.rio.rj.gov.br/index.php/estude/historia-do-brasil/brasil-monarquico/91-per%C3%ADodo-regencial/8943-revoltas-no-norte-a-cabanagem,-a-balaiada-e-a-sabinada | REDIRECT | 200 | https://multi.rio/index.php/historia-do-brasil/brasil-monarquico/91-per%C3%ADodo-regencial/8943-revoltas-no-norte-a-cabanagem,-a-balaiada-e-a-sabinada |
| https://museudainconfidencia.museus.gov.br/ | REDIRECT | 403 | https://www.gov.br/museus/pt-br/museus-ibram/museu-da-inconfidencia |
| https://news.google.com/ | REDIRECT | 200 | https://news.google.com/home?hl=en-US&gl=US&ceid=US:en |
| https://pncp.gov.br/ | REDIRECT | 200 | https://www.gov.br/pncp/pt-br |
| https://projetorioparaopeba.fgv.br | REDIRECT | 200 | https://www18.fgv.br/projetorioparaopeba/ |
| https://revendedoresapi.anp.gov.br/swagger/index.html | QUEBRADO | 404 | https://revendedoresapi.anp.gov.br/swagger/index.html |
| https://sistemas.anatel.gov.br | REDIRECT | 200 | https://sistemas.anatel.gov.br/sis/SistemasInterativos.asp |
| https://site.ucdb.br/santos-do-dia/protomartires-do-brasil/223/ | REDIRECT | 200 | https://site.ucdb.br/ |
| https://www.aedasmg.org | REDIRECT | 200 | https://aedasmg.org/ |
| https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/consultas/boletim-diario/series-historicas/ | REDIRECT | 200 | https://www.b3.com.br/pt_br/redirecionamento/pagina-nao-encontrada/ |
| https://www.cptnacional.org.br/ | REDIRECT | 200 | https://cptnacional.org.br/ |
| https://www.fundacaorenova.org | REDIRECT | 200 | https://www.reparacaobaciariodoce.com/ |
| https://www.gov.br/anp/vivo.pdf | QUEBRADO | 404 | https://www.gov.br/anp/vivo.pdf |
| https://www.ifch.unicamp.br/ojs/index.php/rhs/article/viewFile/231/217 | REDIRECT | 200 | https://ojs.ifch.unicamp.br/index.php/rhs/article/download/231/217/0 |
| https://www.revistas.usp.br/revhistoria/article/view/89008 | REDIRECT | 200 | https://revistas.usp.br/revhistoria/pt_BR/article/view/89008 |
| https://www.se.gov.br/noticias/Governo/sergipe_celebra_200_anos_de_emancipacao_politica | REDIRECT | 200 | https://www.se.gov.br/agencia |
| https://www2.camara.leg.br/atividade-legislativa/plenario/discursos/escrevendohistoria/destaque-de-materias/50-anos-de-brasilia | REDIRECT | 200 | https://www2.camara.leg.br/acl_users/credentials_cookie_auth/require_login?came_from=https%3A//www2.camara.leg.br/atividade-legislativa/plenario/discursos/escrevendohistoria/destaque-de-materias/50-anos-de-brasilia |

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

### 4. https://pncp.gov.br/

```diff
- href="https://pncp.gov.br/"
+ href="https://www.gov.br/pncp/pt-br"
```

Confianca: alta
Justificativa: Servidor respondeu redirect para este endereco, que respondeu HTTP 200 na sondagem
Origem: apps/web/app/[municipio]/interesses/page.tsx

### 5. https://revendedoresapi.anp.gov.br/swagger/index.html

```diff
- href="https://revendedoresapi.anp.gov.br/swagger/index.html"
+ href="https://www.gov.br/anp/pt-br/centrais-de-conteudo/paineis-dinamicos-da-anp/paineis-dinamicos-do-abastecimento/api-revendedores-manual-usuario.pdf"
```

Confianca: media
Justificativa: URL atualizada encontrada em busca no DuckDuckGo no mesmo dominio governamental; verificada HTTP 403
Origem: apps/web/lib/linkmender/busca.test.ts

### 6. https://www.gov.br/anp/vivo.pdf

```diff
- href="https://www.gov.br/anp/vivo.pdf"
+ href="https://www.gov.br/anp/pt-br"
```

Confianca: media
Justificativa: URL atualizada encontrada em busca no DuckDuckGo no mesmo dominio governamental; verificada HTTP 403
Origem: apps/web/lib/linkmender/pipeline.test.ts

### 7. https://multirio.rio.rj.gov.br/index.php/estude/historia-do-brasil/brasil-monarquico/91-per%C3%ADodo-regencial/8943-revoltas-no-norte-a-cabanagem,-a-balaiada-e-a-sabinada

```diff
- href="https://multirio.rio.rj.gov.br/index.php/estude/historia-do-brasil/brasil-monarquico/91-per%C3%ADodo-regencial/8943-revoltas-no-norte-a-cabanagem,-a-balaiada-e-a-sabinada"
+ href="https://multi.rio/index.php/historia-do-brasil/brasil-monarquico/91-per%C3%ADodo-regencial/8943-revoltas-no-norte-a-cabanagem,-a-balaiada-e-a-sabinada"
```

Confianca: alta
Justificativa: Servidor respondeu redirect para este endereco, que respondeu HTTP 200 na sondagem
Origem: apps/web/lib/memoria/camadas.ts

### 8. https://museudainconfidencia.museus.gov.br/

```diff
- href="https://museudainconfidencia.museus.gov.br/"
+ href="https://www.gov.br/museus/pt-br/museus-ibram/museu-da-inconfidencia"
```

Confianca: alta
Justificativa: Servidor respondeu redirect para este endereco, que respondeu HTTP 403 na sondagem
Origem: apps/web/lib/memoria/camadas.ts

### 9. https://auniao.pb.gov.br/servicos/copy_of_jornal-a-uniao/dec-30

```diff
- href="https://auniao.pb.gov.br/servicos/copy_of_jornal-a-uniao/dec-30"
+ href="https://auniao.pb.gov.br/servicos/copy_of_jornal-a-uniao/@@electoral_period_blocked"
```

Confianca: alta
Justificativa: Servidor respondeu redirect para este endereco, que respondeu HTTP 200 na sondagem
Origem: apps/web/lib/memoria/camadas.ts

### 10. https://www.se.gov.br/noticias/Governo/sergipe_celebra_200_anos_de_emancipacao_politica

```diff
- href="https://www.se.gov.br/noticias/Governo/sergipe_celebra_200_anos_de_emancipacao_politica"
+ href="https://www.se.gov.br/agencia"
```

Confianca: alta
Justificativa: Servidor respondeu redirect para este endereco, que respondeu HTTP 200 na sondagem
Origem: apps/web/lib/memoria/camadas.ts

## Quebrados e redirecionados sem proposta

- https://core-ombuds.canada.ca/core_ombuds-ocre_ombuds/complaint-plainte.aspx?lang=eng (200) — dominio nao governamental — correcao manual
- https://www.fundacaorenova.org (200) — dominio nao governamental — correcao manual
- https://controlepopular.com.br (200) — dominio nao governamental — correcao manual
- https://legis.senado.leg.br/dadosabertos (200) — dominio nao governamental — correcao manual
- https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/consultas/boletim-diario/series-historicas/ (200) — dominio nao governamental — correcao manual
- https://github.com/FinweeJur/controle-popular/blob/main/docs/betim/alertas-contratos-revisao-juridica.md (404) — dominio nao governamental — correcao manual
- https://drive.google.com/exemplo (404) — dominio nao governamental — correcao manual
- https://exemplo.org/a (404) — dominio nao governamental — correcao manual
- https://www.cptnacional.org.br/ (200) — dominio nao governamental — correcao manual
- https://www.ifch.unicamp.br/ojs/index.php/rhs/article/viewFile/231/217 (200) — dominio nao governamental — correcao manual
- https://www2.camara.leg.br/atividade-legislativa/plenario/discursos/escrevendohistoria/destaque-de-materias/50-anos-de-brasilia (200) — dominio nao governamental — correcao manual
- https://site.ucdb.br/santos-do-dia/protomartires-do-brasil/223/ (200) — dominio nao governamental — correcao manual
- https://www.revistas.usp.br/revhistoria/article/view/89008 (200) — dominio nao governamental — correcao manual
- https://legis.senado.leg.br/dadosabertos/ (200) — dominio nao governamental — correcao manual
- https://projetorioparaopeba.fgv.br (200) — dominio nao governamental — correcao manual
- https://www.aedasmg.org (200) — dominio nao governamental — correcao manual
- https://news.google.com/ (200) — dominio nao governamental — correcao manual

## Inconsistentes (nao verificados, sem proposta)

- https://aosquevirao.home.blog/2020/01/01/1o-de-janeiro-de-1994-revolucao-zapatista-em-chiapas-mexico/ (rede) — erro de rede: fetch failed
- https://atip-aiprp.apps.gc.ca/atip/welcome.do?lang=en (rede) — erro de rede: fetch failed
- https://cnv.memoriasreveladas.gov.br/ (rede) — erro de rede: fetch failed
- https://comunicabr.com.br (rede) — erro de rede: fetch failed
- https://controlepopular.com.br/ambiental/crimes-socioambientais (502) — status HTTP 502 (nem ok, nem quebrado, nem redirect)
- https://exemplo.com/direto (rede) — erro de rede: fetch failed
- https://exemplo.gov.br (rede) — erro de rede: fetch failed
- https://exemplo.gov.br/nao-deveria-aparecer.pdf (rede) — erro de rede: fetch failed
- https://exemplo.org.br/documento (rede) — erro de rede: fetch failed
- https://nao-deve-entrar.com/x (rede) — erro de rede: fetch failed
- https://pib.socioambiental.org/pt/Povo:Guarani_Kaiow%C3%A1 (502) — status HTTP 502 (nem ok, nem quebrado, nem redirect)
- https://pib.socioambiental.org/pt/Povo:Mura (502) — status HTTP 502 (nem ok, nem quebrado, nem redirect)
- https://pib.socioambiental.org/pt/Povo:Waimiri_Atroari (502) — status HTTP 502 (nem ok, nem quebrado, nem redirect)
- https://pib.socioambiental.org/pt/Povo:Waj%C3%A3pi (502) — status HTTP 502 (nem ok, nem quebrado, nem redirect)
- https://pib.socioambiental.org/pt/Povo:Xavante (502) — status HTTP 502 (nem ok, nem quebrado, nem redirect)
- https://pib.socioambiental.org/pt/Povo:Yanomami (502) — status HTTP 502 (nem ok, nem quebrado, nem redirect)
- https://portaldatransparencia.gov.br (405) — status HTTP 405 (nem ok, nem quebrado, nem redirect)
- https://portaldatransparencia.gov.br/beneficios (405) — status HTTP 405 (nem ok, nem quebrado, nem redirect)
- https://portaldatransparencia.gov.br/convenios (405) — status HTTP 405 (nem ok, nem quebrado, nem redirect)
- https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/93 (500) — status HTTP 500 (nem ok, nem quebrado, nem redirect)
- https://siam.meioambiente.mg.gov.br/licencas/processo-1024-2024 (rede) — erro de rede: fetch failed
- https://sistemas.meioambiente.mg.gov.br/licenciamento/site/consulta-licenca (500) — status HTTP 500 (nem ok, nem quebrado, nem redirect)
- https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12528.htm (rede) — erro de rede: fetch failed
- https://www.planalto.gov.br/ccivil_03/leis/l6683.htm (rede) — erro de rede: fetch failed
- https://www.planalto.gov.br/ccivil_03/leis/lim/lim3353.htm (rede) — erro de rede: fetch failed
- https://y.gov.br (rede) — erro de rede: fetch failed

---

Relatorio gerado por LinkMender (scripts/agent-tools/linkmender-checker.mts). Correcoes NAO sao commitadas automaticamente — este arquivo e a proposta para revisao humana.
