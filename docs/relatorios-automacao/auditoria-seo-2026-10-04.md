# Auditoria de SEO on-page — top 100 páginas

> **Tipo:** RELATORIO
> **Domínio:** global
> **Última medição:** 2026-10-04
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [PLANO-seo-visibilidade-buscadores.md](../planos/PLANO-seo-visibilidade-buscadores.md), [AUDITORIA-LINKS-EIXOS-TOP100.md](AUDITORIA-LINKS-EIXOS-TOP100.md)
> **Palavras-chave:** SEO, canonical, meta description, structured data, auditoria, top 100

## Sumário

- [1. Metodologia](#1-metodologia)
- [2. Resultado](#2-resultado)
- [3. Achados por tipo](#3-achados-por-tipo)
- [4. Páginas com erro](#4-páginas-com-erro)
- [5. Próximos passos](#5-próximos-passos)

## 1. Metodologia

Rodado por `npx tsx scripts/auditar-seo.mts`, com User-Agent honesto do
projeto e pausa de 2,5 s entre requisições (medido: a 1,2 s o container
devolve 502/503 em rajada). Base consultada: `https://www.controlepopular.com.br`.
Cada HTML foi lido por regex (sem navegador): title, description,
canonical, og:image, meta robots, h1, lang e JSON-LD.

## 2. Resultado

| Métrica | Valor |
|---|---|
| Páginas auditadas | 100 |
| Responderam 200 | 69 |
| Erros | 161 |
| Avisos | 257 |
| Tempo médio de resposta | 1281 ms |

**Nota da medição (04/10/2026, tarde).** O site oscilou durante a
varredura: uma rodada anterior no mesmo dia respondeu 92/100 e as mesmas
páginas que caíram voltaram a responder 200 no teste manual, uma a uma.
Os 31 `HTTP 503` desta rodada são **queda do serviço, não defeito de
página** — inclusive a home caiu no meio da coleta. Rerodar quando o
Guara estiver estável antes de tirar conclusão sobre disponibilidade.

Os erros restantes se separam em dois grupos:

1. **Resolvidos pelo deploy das Fases 1–3** (80 ocorrências na rodada
   de 92/100): `canonical aponta para /` (herdado do `layout.tsx` antigo)
   e `canonical fora do www` (BASE_URL antiga). O código corrigido já está
   em `main`; falta o `guara deploy`.
2. **Defeitos de conteúdo, independentes de deploy**: 42 páginas sem
   `og:image`, 34 sem `<h1>`, títulos acima de 65 caracteres e
   descriptions fora da faixa de 50–165.

## 3. Achados por tipo

| Achado | Ocorrências |
|---|---|
| canonical aponta para /, não para a página acessada | 57 |
| sem og | 42 |
| sem <h1> | 34 |
| HTTP 503 | 31 |
| sem <title> | 31 |
| sem meta description | 31 |
| sem canonical | 31 |
| html sem lang | 31 |
| sem JSON-LD | 31 |
| canonical fora do www | 10 |
| title com 102 chars | 4 |
| title com 68 chars | 4 |
| title com 70 chars | 2 |
| 2 h1 na página | 2 |
| description com 193 chars | 2 |
| title com 98 chars | 2 |
| description com 169 chars | 2 |
| title com 96 chars | 2 |
| description com 175 chars | 2 |
| title com 88 chars | 2 |
| description com 183 chars | 2 |
| title com 85 chars | 2 |
| title com 78 chars | 2 |
| description com 223 chars | 2 |
| description com 201 chars | 2 |
| title com 112 chars | 2 |
| title com 79 chars | 2 |
| title com 66 chars | 1 |
| description com 272 chars | 1 |
| description com 239 chars | 1 |
| title com 91 chars | 1 |
| title com 92 chars | 1 |
| title com 93 chars | 1 |
| meta robots com noindex | 1 |
| title com 94 chars | 1 |
| title com 122 chars | 1 |
| title com 106 chars | 1 |
| description com 167 chars | 1 |
| description com 191 chars | 1 |
| description com 212 chars | 1 |
| description com 170 chars | 1 |
| title com 97 chars | 1 |
| description com 179 chars | 1 |
| description com 173 chars | 1 |
| description com 337 chars | 1 |
| description com 199 chars | 1 |
| description com 232 chars | 1 |
| title com 81 chars | 1 |
| description com 203 chars | 1 |
| description com 225 chars | 1 |
| description com 269 chars | 1 |
| description com 323 chars | 1 |
| title com 67 chars | 1 |
| description com 195 chars | 1 |
| description com 214 chars | 1 |
| title com 99 chars | 1 |
| description com 185 chars | 1 |
| description com 206 chars | 1 |
| title com 87 chars | 1 |
| description com 177 chars | 1 |
| title com 89 chars | 1 |
| description com 274 chars | 1 |
| title com 114 chars | 1 |
| description com 222 chars | 1 |
| title com 120 chars | 1 |
| description com 326 chars | 1 |
| title com 84 chars | 1 |
| description com 197 chars | 1 |
| title com 73 chars | 1 |
| description com 254 chars | 1 |
| description com 181 chars | 1 |
| title com 107 chars | 1 |
| description com 172 chars | 1 |
| title com 90 chars | 1 |
| description com 174 chars | 1 |
| title com 69 chars | 1 |
| title com 117 chars | 1 |
| description com 178 chars | 1 |

## 4. Páginas com erro

| Página | Erro |
|---|---|
| `/terra-e-territorios` | canonical aponta para /, não para a página acessada |
| `/funcaosocialterra/mapa` | canonical aponta para /, não para a página acessada |
| `/funcaosocialterra` | canonical aponta para /, não para a página acessada |
| `/funcaosocialterra/alertas` | canonical aponta para /, não para a página acessada |
| `/cidades` | canonical aponta para /, não para a página acessada |
| `/cidades/mg` | canonical aponta para /, não para a página acessada |
| `/betim` | canonical fora do www: https://controlepopular.com.br/betim |
| `/bh` | canonical fora do www: https://controlepopular.com.br/bh |
| `/sp` | canonical fora do www: https://controlepopular.com.br/sp |
| `/brumadinho` | canonical fora do www: https://controlepopular.com.br/brumadinho |
| `/mariana` | canonical aponta para /, não para a página acessada |
| `/mariana` | meta robots com noindex: noindex |
| `/aracuai` | canonical fora do www: https://controlepopular.com.br/aracuai |
| `/diamantina` | canonical fora do www: https://controlepopular.com.br/diamantina |
| `/itinga` | canonical fora do www: https://controlepopular.com.br/itinga |
| `/governador-valadares` | canonical fora do www: https://controlepopular.com.br/governador-valadares |
| `/uberlandia` | canonical fora do www: https://controlepopular.com.br/uberlandia |
| `/juiz-de-fora` | canonical fora do www: https://controlepopular.com.br/juiz-de-fora |
| `/terra-e-territorios/vales` | canonical aponta para /, não para a página acessada |
| `/terra-e-territorios/nossos-rios` | canonical aponta para /, não para a página acessada |
| `/terra-e-territorios/nossas-serras` | canonical aponta para /, não para a página acessada |
| `/paraopeba` | canonical aponta para /, não para a página acessada |
| `/paraopeba/execucao` | canonical aponta para /, não para a página acessada |
| `/paraopeba/biblioteca` | canonical aponta para /, não para a página acessada |
| `/paraopeba/linha-do-tempo` | canonical aponta para /, não para a página acessada |
| `/ambiental` | canonical aponta para /, não para a página acessada |
| `/ambiental/mariana` | canonical aponta para /, não para a página acessada |
| `/ambiental/barragens` | canonical aponta para /, não para a página acessada |
| `/ambiental/barragens/descaracterizacao` | canonical aponta para /, não para a página acessada |
| `/ambiental/licenciamento` | canonical aponta para /, não para a página acessada |
| `/ambiental/copam` | canonical aponta para /, não para a página acessada |
| `/ambiental/tac` | canonical aponta para /, não para a página acessada |
| `/ambiental/clima-risco` | canonical aponta para /, não para a página acessada |
| `/ambiental/car` | canonical aponta para /, não para a página acessada |
| `/mineracao/cavas` | canonical aponta para /, não para a página acessada |
| `/canada` | canonical aponta para /, não para a página acessada |
| `/america-latina` | canonical aponta para /, não para a página acessada |
| `/direitos-em-movimento` | canonical aponta para /, não para a página acessada |
| `/memoria` | canonical aponta para /, não para a página acessada |
| `/ambiental/legislacao` | canonical aponta para /, não para a página acessada |
| `/direitos-em-movimento/ajuda` | HTTP 503 |
| `/direitos-em-movimento/ajuda` | sem <title> |
| `/direitos-em-movimento/ajuda` | sem meta description |
| `/direitos-em-movimento/saude-publica` | HTTP 503 |
| `/direitos-em-movimento/saude-publica` | sem <title> |
| `/direitos-em-movimento/saude-publica` | sem meta description |
| `/direitos-em-movimento/educacao` | HTTP 503 |
| `/direitos-em-movimento/educacao` | sem <title> |
| `/direitos-em-movimento/educacao` | sem meta description |
| `/direitos-em-movimento/trabalho-e-renda` | HTTP 503 |
| `/direitos-em-movimento/trabalho-e-renda` | sem <title> |
| `/direitos-em-movimento/trabalho-e-renda` | sem meta description |
| `/direitos-em-movimento/conselhos` | HTTP 503 |
| `/direitos-em-movimento/conselhos` | sem <title> |
| `/direitos-em-movimento/conselhos` | sem meta description |
| `/direitos-em-movimento/informacao` | HTTP 503 |
| `/direitos-em-movimento/informacao` | sem <title> |
| `/direitos-em-movimento/informacao` | sem meta description |
| `/direitos-em-movimento/denuncia` | HTTP 503 |
| `/direitos-em-movimento/denuncia` | sem <title> |
| `/direitos-em-movimento/denuncia` | sem meta description |
| `/ambiental/decisoes-lai` | HTTP 503 |
| `/ambiental/decisoes-lai` | sem <title> |
| `/ambiental/decisoes-lai` | sem meta description |
| `/ambiental/direitos-humanos` | HTTP 503 |
| `/ambiental/direitos-humanos` | sem <title> |
| `/ambiental/direitos-humanos` | sem meta description |
| `/ambiental/direito-critico` | HTTP 503 |
| `/ambiental/direito-critico` | sem <title> |
| `/ambiental/direito-critico` | sem meta description |
| `/ambiental/conselhos` | HTTP 503 |
| `/ambiental/conselhos` | sem <title> |
| `/ambiental/conselhos` | sem meta description |
| `/ambiental/capacidade-institucional` | HTTP 503 |
| `/ambiental/capacidade-institucional` | sem <title> |
| `/ambiental/capacidade-institucional` | sem meta description |
| `/ambiental/ecossistema` | HTTP 503 |
| `/ambiental/ecossistema` | sem <title> |
| `/ambiental/ecossistema` | sem meta description |
| `/ambiental/patrimonio-cultural` | HTTP 503 |
| `/ambiental/patrimonio-cultural` | sem <title> |
| `/ambiental/patrimonio-cultural` | sem meta description |
| `/recursos/estados` | HTTP 503 |
| `/recursos/estados` | sem <title> |
| `/recursos/estados` | sem meta description |
| `/estado-e-economia` | HTTP 503 |
| `/estado-e-economia` | sem <title> |
| `/estado-e-economia` | sem meta description |
| `/estado-e-economia/orcamento` | HTTP 503 |
| `/estado-e-economia/orcamento` | sem <title> |
| `/estado-e-economia/orcamento` | sem meta description |
| `/judiciario/instituicoes` | HTTP 503 |
| `/judiciario/instituicoes` | sem <title> |
| `/judiciario/instituicoes` | sem meta description |
| `/judiciario/contatos` | HTTP 503 |
| `/judiciario/contatos` | sem <title> |
| `/judiciario/contatos` | sem meta description |
| `/assembleias` | HTTP 503 |
| `/assembleias` | sem <title> |
| `/assembleias` | sem meta description |
| `/ambiental/contratos` | HTTP 503 |
| `/ambiental/contratos` | sem <title> |
| `/ambiental/contratos` | sem meta description |
| `/judiciario` | HTTP 503 |
| `/judiciario` | sem <title> |
| `/judiciario` | sem meta description |
| `/judiciario/tribunais` | HTTP 503 |
| `/judiciario/tribunais` | sem <title> |
| `/judiciario/tribunais` | sem meta description |
| `/judiciario/sirenejud` | HTTP 503 |
| `/judiciario/sirenejud` | sem <title> |
| `/judiciario/sirenejud` | sem meta description |
| `/judiciario/recomendacoes` | HTTP 503 |
| `/judiciario/recomendacoes` | sem <title> |
| `/judiciario/recomendacoes` | sem meta description |
| `/congresso` | HTTP 503 |
| `/congresso` | sem <title> |
| `/congresso` | sem meta description |
| `/congresso/proposicoes` | HTTP 503 |
| `/congresso/proposicoes` | sem <title> |
| `/congresso/proposicoes` | sem meta description |
| `/congresso/votacoes` | HTTP 503 |
| `/congresso/votacoes` | sem <title> |
| `/congresso/votacoes` | sem meta description |
| `/congresso/mg` | HTTP 503 |
| `/congresso/mg` | sem <title> |
| `/congresso/mg` | sem meta description |
| `/governo` | HTTP 503 |
| `/governo` | sem <title> |
| `/governo` | sem meta description |
| `/dados/comunicabr` | HTTP 503 |
| `/dados/comunicabr` | sem <title> |
| `/dados/comunicabr` | sem meta description |
| `/ambiental/convenios` | canonical aponta para /, não para a página acessada |
| `/ambiental/ppp` | canonical aponta para /, não para a página acessada |
| `/empresas` | canonical aponta para /, não para a página acessada |
| `/empresas/conglomerados` | canonical aponta para /, não para a página acessada |
| `/empresas/executivos` | canonical aponta para /, não para a página acessada |
| `/eua` | canonical aponta para /, não para a página acessada |
| `/europa` | canonical aponta para /, não para a página acessada |
| `/desclassificados` | canonical aponta para /, não para a página acessada |
| `/central` | canonical aponta para /, não para a página acessada |
| `/editais` | canonical aponta para /, não para a página acessada |
| `/biblioteca` | canonical aponta para /, não para a página acessada |
| `/laboratorio/arvore` | canonical aponta para /, não para a página acessada |
| `/assistente` | canonical aponta para /, não para a página acessada |
| `/busca` | canonical aponta para /, não para a página acessada |
| `/indice` | canonical aponta para /, não para a página acessada |
| `/laboratorio` | canonical aponta para /, não para a página acessada |
| `/radio` | canonical aponta para /, não para a página acessada |
| `/noticias` | canonical aponta para /, não para a página acessada |
| `/alertas` | canonical aponta para /, não para a página acessada |
| `/tecnologia` | canonical aponta para /, não para a página acessada |
| `/documentacao` | canonical aponta para /, não para a página acessada |
| `/api` | canonical aponta para /, não para a página acessada |
| `/estudos-rurais` | canonical aponta para /, não para a página acessada |
| `/sobre` | canonical aponta para /, não para a página acessada |
| `/imprensa` | canonical aponta para /, não para a página acessada |
| `/termos` | canonical aponta para /, não para a página acessada |
| `/dados/populares` | canonical aponta para /, não para a página acessada |
| `/internacional` | canonical aponta para /, não para a página acessada |

## 5. Próximos passos

1. Corrigir cada erro da seção 4 antes do próximo deploy.
2. Reavaliar os avisos de title/description por página nobre.
3. Rerodar semanalmente: `npx tsx scripts/auditar-seo.mts`.
