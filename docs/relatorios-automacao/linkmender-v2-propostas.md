# LinkMender v2 — Verificacao com conteudo e propostas com criterios

- Gerado em: 2026-09-24T16:21:40.281Z
- Duracao: 12.3 min
- Pausa entre requisicoes: 400ms

## Resumo

- URLs verificadas (HTTP + conteudo): 143
- OK: 110
- REDIRECT: 9
- QUEBRADO: 3
- MENTIROSO (200 que mente): 0
- INCONSISTENTE: 21
- Propostas aceitas pelos criterios: 3

## Propostas com trilha

- https://dadosabertos.almg.gov.br
  → http://dadosabertos.almg.gov.br/documentacao/index
  criterios: redirect-declarado-pelo-servidor, dominio-oficial, destino-verificado-vivo
  estrategia de busca: redirect
- https://api.salic.cultura.gov.br
  → https://api.salic.cultura.gov.br/docs
  criterios: redirect-declarado-pelo-servidor, dominio-oficial, destino-verificado-vivo
  estrategia de busca: redirect
- https://sistemas.anatel.gov.br
  → https://sistemas.anatel.gov.br/sis/SistemasInterativos.asp
  criterios: redirect-declarado-pelo-servidor, dominio-oficial, destino-verificado-vivo
  estrategia de busca: redirect

## Falhos sem proposta

- https://www.fundacaorenova.org (REDIRECT) — destino do redirect em dominio nao aceitavel: www.reparacaobaciariodoce.com
- https://controlepopular.com.br (REDIRECT) — destino do redirect em dominio nao aceitavel: www.controlepopular.com.br
- https://github.com/FinweeJur/controle-popular/blob/main/docs/betim/alertas-contratos-revisao-juridica.md (QUEBRADO) — nenhum candidato bateu nos criterios apos 3 buscas
- https://drive.google.com/exemplo (QUEBRADO) — nenhum candidato bateu nos criterios apos 3 buscas
- https://exemplo.org/a (QUEBRADO) — nenhum candidato bateu nos criterios apos 3 buscas
- https://projetorioparaopeba.fgv.br (REDIRECT) — destino do redirect em dominio nao aceitavel: www18.fgv.br
- https://www.aedasmg.org (REDIRECT) — destino do redirect em dominio nao aceitavel: aedasmg.org
- https://controlepopular.com.br/ambiental/crimes-socioambientais (REDIRECT) — destino do redirect em dominio nao aceitavel: www.controlepopular.com.br
- https://news.google.com/ (REDIRECT) — destino do redirect em dominio nao aceitavel: news.google.com

## Camada aplicada no proximo build

apps/web/data/link-correcoes.json agora tem 11 correcao(oes).
O dado versionado nao e reescrito: a camada entra no prebuild
(scripts/validar-link-correcoes.mjs) e na renderizacao
(lib/linkmender/correcoes.ts — aplicarCorrecoesEmDado / urlCorrigida).

---

User-Agent: ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular; verificador de links - LinkMender v2)
Primeira rodada REAL no home-pc (esta maquina tem rede de saida bloqueada).
