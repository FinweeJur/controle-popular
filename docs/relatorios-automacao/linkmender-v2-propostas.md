# LinkMender v2 — Verificacao com conteudo e propostas com criterios

- Gerado em: 2026-09-09T17:51:03.417Z
- Duracao: 5.6 min
- Pausa entre requisicoes: 400ms

## Resumo

- URLs verificadas (HTTP + conteudo): 127
- OK: 101
- REDIRECT: 7
- QUEBRADO: 6
- MENTIROSO (200 que mente): 0
- INCONSISTENTE: 13
- Propostas aceitas pelos criterios: 3

## Propostas com trilha

- https://legis.senado.leg.br/dadosabertos
  → https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html
  criterios: redirect-declarado-pelo-servidor, dominio-oficial, destino-verificado-vivo
  estrategia de busca: redirect
- https://pncp.gov.br/
  → https://www.gov.br/pncp/pt-br
  criterios: redirect-declarado-pelo-servidor, dominio-oficial, destino-verificado-vivo
  estrategia de busca: redirect
- https://legis.senado.leg.br/dadosabertos/
  → https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html
  criterios: redirect-declarado-pelo-servidor, dominio-oficial, destino-verificado-vivo
  estrategia de busca: redirect

## Falhos sem proposta

- https://github.com/melkepinho/controle-popular/blob/main/docs/FONTE.md#painel-tacs-final (QUEBRADO) — nenhum candidato bateu nos criterios apos 3 buscas
- https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/consultas/boletim-diario/series-historicas/ (REDIRECT) — destino do redirect em dominio nao aceitavel: www.b3.com.br
- https://github.com/FinweeJur/controle-popular/blob/main/docs/betim/alertas-contratos-revisao-juridica.md (QUEBRADO) — nenhum candidato bateu nos criterios apos 3 buscas
- https://drive.google.com/exemplo (QUEBRADO) — nenhum candidato bateu nos criterios apos 3 buscas
- https://exemplo.org/a (QUEBRADO) — nenhum candidato bateu nos criterios apos 3 buscas
- https://revendedoresapi.anp.gov.br/swagger/index.html (QUEBRADO) — nenhum candidato bateu nos criterios apos 3 buscas
- https://projetorioparaopeba.fgv.br (REDIRECT) — destino do redirect em dominio nao aceitavel: www18.fgv.br
- https://www.aedasmg.org (REDIRECT) — destino do redirect em dominio nao aceitavel: aedasmg.org
- http://acessoainformacao.mg.gov.br/sistema/site/busca_decisao.aspx (QUEBRADO) — nenhum candidato bateu nos criterios apos 3 buscas
- https://news.google.com/ (REDIRECT) — destino do redirect em dominio nao aceitavel: news.google.com

## Camada aplicada no proximo build

apps/web/data/link-correcoes.json agora tem 3 correcao(oes).
O dado versionado nao e reescrito: a camada entra no prebuild
(scripts/validar-link-correcoes.mjs) e na renderizacao
(lib/linkmender/correcoes.ts — aplicarCorrecoesEmDado / urlCorrigida).

---

User-Agent: ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular; verificador de links - LinkMender v2)
Primeira rodada REAL no home-pc (esta maquina tem rede de saida bloqueada).
