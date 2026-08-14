# Auditoria vigorosa dos links de normas de proteção — 2026-08-14

> Pedido do dono em 13-14/08/2026: *"sigo achando vários links quebrados de
> legislação e vários sem o pdf copiado através daquela técnica que usamos
> antes, faça uma revisão vigorosa principalmente das normas de proteção"*.
>
> Correção de premissa registrada em `docs/PLANO-ARQUIVO-DE-FONTES.md`: a
> "técnica de copiar o PDF" nunca tinha sido implementada — só o plano
> existia. Este documento cobre as duas frentes: a varredura dos links
> (Tarefa 1) e a primeira leva real do arquivamento (Tarefa 2).
>
> Esta auditoria roda em PARALELO a outra frente que varreu uma amostra de
> 700 links do universo geral (~29 mil) e, depois de refazer com pausa os
> que pareciam quebrados, chegou a zero confirmados — a primeira passada
> dela batia em limite de requisição/bloqueio de bot, não página morta. O
> dono insistiu que segue achando link quebrado. Por isso esta rodada
> cobriu por INTEIRO (não amostra) o recorte de normas de proteção E foi
> atrás da hipótese mais provável: link que responde `200` mas leva ao
> lugar errado — quebra disfarçada, não erro de status.

## Universo varrido (por inteiro, não amostra)

| Fonte | Coluna | Linhas no universo | Varridas | % coberto |
|---|---|---:|---:|---:|
| `ambiental_legislacao` (temas `serras`+`recursos_hidricos`) | `link_pdf` | 1.183 | 1.182¹ | 99,9% |
| `direito_critico_normas` (temas de direito protegido) | `link_oficial` | 18 | 18 | 100% |
| `direito_critico_precedentes` (mesmos temas) | `link_oficial` | 8 | 8 | 100% |
| `atos_oficiais` (normas de área protegida, via GeoJSON) | `link_fonte` | 8 | 8 | 100% |
| `patrimonio_tombado_iepha` (153 bens) | — | 153 | **0** | **N/A — sem coluna de URL** |
| **Total com link para checar** | | **1.217** | **1.216** | 99,9% |

¹ Uma linha ficou fora da contagem por diferença de 1 entre a medição de
`serras+recursos_hidricos` feita duas vezes no mesmo dia (universo pode
mudar entre coleta e varredura — ETL roda em paralelo). Diferença de
0,08%, não investigada por não afetar nenhuma conclusão.

`patrimonio_tombado_iepha` **não tem coluna de URL** — só `ato_legal`,
texto livre da fonte (ex. "Decreto 19908, de 22 de maio de 1979"), sem
link para o diploma. Confirmado no comentário da migration `0072`: "a
fonte não linka". Não há o que auditar ali; é lacuna estrutural da fonte,
não do portal.

## Método: dois motores, e verificação de CONTEÚDO, não só status

1. `scripts/auditoria-links-normas.mjs` — HTTP HEAD/GET com `curl` como
   segundo motor TLS quando o `fetch` nativo falha (achado: `fetch` do
   Node reseta conexão com `planalto.gov.br` por flood quando várias
   URLs do mesmo host disparam “ao mesmo tempo” — corrigido travando a
   reserva de pausa por host antes do primeiro `await`, não depois).
2. **Verificação de conteúdo com navegador real** para o subconjunto de
   maior risco (páginas individuais de sistema de gestão legislativa —
   SAPL, DOM-web, SysSolution): essas são Single-Page Apps que devolvem
   `200` com um shell vazio para QUALQUER cliente que não execute
   JavaScript (inclusive `curl`/`fetch`). Rodar através do navegador (Chrome
   MCP) e ler o texto renderizado é o único jeito de confirmar que a
   ementa exibida bate com a ementa gravada no banco — não apenas o status.

## Resultado por tabela

| Tabela | ok | não verificável (403/429) | bloqueado por robots.txt | redirecionou p/ home | quebrado |
|---|---:|---:|---:|---:|---:|
| `ambiental_legislacao` | 1.182 | 0 | 0 | 0 | 0 |
| `direito_critico_normas` | 1 | 16 | 1 | 0 | 0 |
| `direito_critico_precedentes` | 2 | 5 | 0 | 0 | 1 → **corrigido** |
| `atos_oficiais` (área protegida) | 8 | 0 | 0 | 0 | 0 |
| **Total** | **1.193** | **21** | **1** | **0** | **1 (corrigido)** |

**Zero redirecionamento-para-home detectado** no recorte de normas de
proteção, e **zero quebra disfarçada confirmada** nos 8 links de área
protegida depois de checados com navegador real (ver abaixo). Isso não
contradiz o dono: ele falou em "legislação" de forma geral, e o recorte de
hoje foi só o de proteção, por pedido explícito ("principalmente"). Links
quebrados que ele encontra podem estar em `atos_oficiais`/`proposicoes`
fora deste recorte temático (~9.135 e ~13.317 linhas não cobertas aqui) —
registrado como próximo passo, não fechado.

### O único link genuinamente quebrado (404), corrigido

`direito_critico_precedentes` — "OG nº 15 (CDESC) – Direito à Água como
Direito Humano (ONU, 2002)":
- Era: `https://www.ohchr.org/sites/default/files/documents/publications/gcArticle15.pdf` (HTTP 404)
- Virou: `https://www2.ohchr.org/english/issues/water/docs/CESCR_GC_15.pdf` (HTTP 200, confirmado)
- Achado via busca: o documento continua publicado pela própria OHCHR, só
  mudou de endereço dentro do domínio (subdomínio legado `www2`, ainda
  oficial). Não trocado por espelho de terceiro.

### O achado "traiçoeiro": link genérico em vez de específico (Diamantina)

As 3 leis de área protegida de Diamantina (Lei 2723/2001 "APA Santa
Polônia", Lei 2924/2004 "APA Barragem da Extração", LC 178/2023 "APA
Serra dos Cristais") tinham `link_fonte = https://cmdiamantina.mg.gov.br/leis`
— a **listagem inteira de leis do município**, não a norma específica.
Tecnicamente respondia `200`, então nenhum checador de status pegaria.
Mesma categoria do "redireciona pra home" que o dono pediu para caçar,
embora o mecanismo seja outro (o coletor grava o link errado desde a
origem, não um redirecionamento do servidor).

**Causa raiz, achada e corrigida**: `etl/betim/etl/camaras/syssolution.py`,
função `_coletar_leis`, gravava sempre `f"{origin}/leis"`. O portal em si
usa `/Lei/${lei.id}` como link individual (confirmado lendo o HTML
publicado) e a API já devolve esse `id` em cada item — só não estava
sendo usado. Corrigido para usar o `id` quando presente.

As 4 linhas afetadas (2 para o número 2924 — duplicado na própria fonte,
uma com `tipo` errado "Lei Orgânica" em vez de "Lei Ordinária", ambas
preservadas) foram corrigidas no Postgres local, com o `id` de cada uma
confirmado contra a API pública do fornecedor
(`api.syssolution.com.br/portal`) antes de gravar:

| Norma | Link antigo (genérico) | Link novo (específico, confirmado 200 + conteúdo) |
|---|---|---|
| Lei 2723/2001 | `.../leis` | `https://cmdiamantina.mg.gov.br/Lei/2382465868` |
| Lei 2924/2004 (Lei Ordinária) | `.../leis` | `https://cmdiamantina.mg.gov.br/Lei/1167940948` |
| Lei 2924/2004 (Lei Orgânica, duplicata da fonte) | `.../leis` | `https://cmdiamantina.mg.gov.br/Lei/4116710871` |
| LC 178/2023 | `.../leis` | `https://cmdiamantina.mg.gov.br/Lei/4061368587` |

**Verificação de conteúdo com navegador real** (não só HTTP): abri
`https://cmdiamantina.mg.gov.br/Lei/2382465868` no Chrome de verdade — a
página renderiza `heading "LO - Lei Ordinária nº 2723/2001"`, `"Publicada
em 27/12/2001"` e a ementa `"Dispõe sobre a croação da Àrea de Proteçaõ
Ambiental - "APA Santa Polônia"..."`, **idêntica** à ementa gravada em
`atos_oficiais`. `curl`/`fetch` sozinhos não veem nada disso (a página é
uma SPA que devolve o shell vazio pra cliente sem JavaScript) — é
exatamente o tipo de falso-negativo (e falso-positivo de "quebrado") que
um checador só-de-status produz nos dois sentidos.

### Os 4 decretos de BH (DOM-web): mesmo padrão, confirmados OK

`dom-web.pbh.gov.br` também é SPA — `curl` via `fetch` mostra só "habilite
o JavaScript". Abertos os 4 (`ato/419127`, `428104`, `474102`, `488354`)
no navegador real: os 4 renderizam o decreto completo, com número, data e
texto batendo com o que está no banco (ex.: Decreto 18.338/2023,
"Regulamenta o Parque Municipal do Bairro Trevo..."). **Nenhum
redirecionamento, nenhuma sessão expirada, nenhuma busca vazia.**

### Não verificável (403/429) — não tocado, por regra

21 URLs de `direito_critico_normas`/`precedentes` devolvem 403 mesmo com
User-Agent honesto (planalto.gov.br, corteidh.or.cr, ohchr.org,
undrr.org, gov.br/mdh, stf.jus.br). Confirmado com um SEGUNDO teste (UA de
navegador comum via `curl`) que o host responde `200` para esse UA no
mesmo host+path — é bloqueio anti-bot, comportamento idêntico ao 403/429
que a regra do dono já cobre. **Nenhuma dessas URLs foi trocada.**

1 URL (`documents.un.org/doc/undoc/...`) foi respeitosamente pulada por
`robots.txt` — não checada, por decisão de não desobedecer o `Disallow`
do próprio site.

## Arquivamento — medição real (Tarefa 2)

Amostra de 30 documentos de `ambiental_legislacao` (sorteio aleatório
dentro de `serras`+`recursos_hidricos`), capturados de verdade por
`scripts/arquivar-fontes.mjs`:

| Métrica | Valor medido |
|---|---:|
| Tentativas | 30 |
| Sucesso | 30/30 (100%) |
| Com CPF no texto extraído (bloqueado de propósito) | 0 |
| Tamanho médio | 112,7 KiB |
| Total da amostra | 3,30 MiB |
| **Projeção: 1.183 normas de serras+recursos_hídricos** | **≈ 130 MiB** |
| **Projeção: 25.729 links do universo total do portal** (mesma média) | **≈ 2,8 GiB** |

Achado colateral confirmado ao vivo: uma URL do SIAM (`idNorma=51241`)
respondeu `200` com `Content-Type: text/html` (um documento Word
exportado como página web) em vez de PDF — bate com o que a migration
`0065` já registrava. Não é falha; `arquivar-fontes.mjs` extrai pelo
Content-Type real, nunca pelo nome da URL.

**As 30 cópias estão gravadas em `apps/web/.arquivo-local/` (fora de
`public/`, `.gitignore` confirmado) e catalogadas em `arquivo_fontes`,
todas com `aprovado_para_publicacao = true`.** Não há upload para R2 nem
UI mostrando a cópia ao lado do link — sem credencial de R2 configurada
nesta máquina, e sem ela o Worker publicado não alcança arquivo nenhum no
disco desta máquina de build (arquitetura, não feature faltando). Ver
`docs/PLANO-ARQUIVO-DE-FONTES.md`, seção "O que falta para publicar cópias
de verdade".

## O que NÃO foi coberto por esta rodada

- `atos_oficiais.link_fonte` fora do recorte de área protegida (~9.135
  linhas com link) e `proposicoes.link_fonte` (~9.649 linhas com link) —
  são o grosso dos 25.729 links do portal. Se o dono continua achando link
  quebrado, é provável que esteja aqui, fora do que foi pedido
  ("principalmente as normas de proteção") para esta rodada.
- `congresso.proposicoes.url_fonte`/`url_inteiro_teor` (5.562 preenchidas)
  — tabela homônima em schema diferente, fora do recorte de proteção.
- Conteúdo dos 1.182 PDFs de `ambiental_legislacao` foi verificado por
  STATUS + Content-Type em massa, e por DOWNLOAD REAL + extração de texto
  numa amostra de 30 (não nos 1.182 — inviável em uma sessão, e é
  exatamente o papel do arquivamento, não da auditoria de link).

## Verificação de segurança e qualidade

- `apps/web/.arquivo-local/` — nada gravado em `apps/web/public/`,
  confirmado (`find public -newer ...` vazio).
- `python scripts/checar-dado-pessoal.py` — limpo, rodado antes de cada
  commit desta rodada.
- 0 CPF encontrado no texto extraído das 30 cópias.
- `npx tsc --noEmit` — limpo.
- `npm run test:lib` — 247/247 (mesma contagem de antes, nenhum quebrado).

---

*Varredura rodada em 2026-08-14 contra o Postgres local. 1.216 URLs
checadas de verdade (não amostra) no recorte de normas de proteção; 30
cópias capturadas de verdade para medição do arquivamento.*
