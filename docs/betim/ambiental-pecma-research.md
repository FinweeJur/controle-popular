# Pesquisa: seção Ambiental / Proteção Civil (2026-07-21)

Pedido do usuário: mapear fontes públicas para PECMA, condenações judiciais
ambientais e TACs do MPMG envolvendo Betim/RMBH, antes de decidir o escopo
da futura seção "Ambiental / Proteção Civil" (F9). Achados verificados ao
vivo (WebFetch/curl), não suposição.

## PECMA (Programa Estadual de Conversão de Multas Ambientais)

- Instituído pelo Decreto MG nº 48.994/2025, operado via **Portal
  Ecosistemas / SISEMA** (login necessário para consulta detalhada por
  processo). **Não há dataset PECMA no CKAN de `dados.mg.gov.br`** — busquei
  e não achei; o backlog item "Compensação ambiental estadual de MG
  (SEMAD/IEF) — depende do CKAN" está **descartado nessa forma específica**,
  não existe esse CKAN dataset hoje.
- Estatística agregada pública (não por município): 9.712 adesões ativas,
  R$357,5 milhões em multas envolvidas (fonte: notícia oficial SEMAD, não
  API).
- **Conclusão: sem API/dataset aberto por município.** Não dá pra integrar
  como ETL agora; só citar o programa institucionalmente se necessário.

## MPMG — "Desativando Bombas-Relógio" (barragens upstream)

- Site: `https://barragens.mpmg.mp.br/` — projeto do MPMG (Caoma) que
  monitora a descaracterização de barragens erguidas pelo método a montante
  em MG, criado após Mariana (2015) e Brumadinho (2019).
- **54 barragens monitoradas, em 17 municípios — nenhuma em Betim**, mas
  **3 municípios limítrofes de Betim aparecem na lista: Igarapé,
  Itatiaiuçu e Sarzedo** (todos fazem fronteira direta com Betim, RMBH).
  Isso é relevante pro leitor de Betim mesmo sem barragem dentro do
  município — risco regional real (contaminação de bacia hidrográfica
  compartilhada, rotas de evacuação).
- **Mecanismo de dados: HTML estático, sem API/JSON.** Confirmado via
  WebFetch — cards de barragem são markup direto, não há endpoint
  consultável por parâmetro `municipio`. Pra integrar de verdade
  precisaria de scraping (Playwright ou parsing HTML simples, já que não
  há JS pesado aparente — mais barato que o padrão Blazor da Câmara).
- 23 barragens já descaracterizadas, 30 em andamento (dado agregado da
  página inicial, 2026-07-21).

## TACs ambientais (MPMG)

- Sistema antigo (`sistemas.meioambiente.mg.gov.br/licenciamento/site/consulta-tacs`)
  foi **migrado para o Portal Ecosistemas** (`ecosistemas.meioambiente.mg.gov.br/gtac/acessoExterno`).
  Não consegui inspecionar os campos de busca via WebFetch simples (retorna
  pouco conteúdo, provavelmente SPA) — **próximo passo, se decidirmos
  seguir**: abrir com Playwright/browser real pra ver os campos de busca
  (município? CNPJ? palavra-chave?) e se há acesso público sem login.
- `transparencia.mpmg.mp.br/buscarTac?idTac={id}` existe e retorna **o
  documento de um TAC específico já sabendo o ID** — é um visualizador de
  documento, não uma busca. Não achei o endpoint de busca/listagem que
  alimenta esse visualizador.
- **Conclusão: possível mas não confirmado.** Precisa de uma sessão de
  descoberta dedicada com Playwright no Portal Ecosistemas antes de
  prometer essa integração.

## Condenações judiciais ambientais (RMBH/Betim)

- Não achei um portal de consulta pública específico do MPMG/MPF pra
  "condenações ambientais por município" com filtro estruturado — os
  sistemas de acompanhamento processual do MP geralmente exigem número de
  processo (mesmo padrão do bloqueio já documentado pro DataJud/CNJ, ver
  `docs/F0-discovery.md` §15). Não pesquisei TCE-MG/MPF a fundo por tempo;
  fica como próximo passo se a seção for priorizada.

## Recomendação

Não implementar ETL agora (nenhuma fonte com API/dataset aberto
confirmado). Escopo realista pra uma futura seção "Ambiental / Proteção
Civil" (F9): (1) uma página **institucional/informativa** linkando pro
site `barragens.mpmg.mp.br` com destaque pros 3 municípios limítrofes de
Betim: Igarapé, Itatiaiuçu, Sarzedo; (2) se houver tempo, uma sessão de
descoberta dedicada com Playwright no Portal Ecosistemas (GTAC) pra
confirmar se dá pra buscar TACs por município publicamente; (3) revisar o
artigo do MAB (`mab.org.br/2026/07/01/...`) ainda não lido, que motivou
esse pedido, pra ver se cita outras plataformas específicas não cobertas
aqui.
