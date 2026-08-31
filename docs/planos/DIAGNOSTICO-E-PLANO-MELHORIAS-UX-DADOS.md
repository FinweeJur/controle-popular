# Diagnóstico Técnico e Levantamento de Melhorias — UX, Navegação e Dados

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-08-31
> **Leitura estimada:** longa (> 15 min)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [PRODUTO.md](../01-produto/PRODUTO.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [DESENVOLVIMENTO.md](../03-desenvolvimento/DESENVOLVIMENTO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** ux, navegacao, leigos, biblioteca, paraopeba, analise, vale, mapas, globo-3d, tags, listas-grandes, rotas

## Sumário

- [Propósito](#propósito)
- [1. Biblioteca × Análise Temática (Paraopeba e Acervos)](#1-biblioteca--análise-temática-paraopeba-e-acervos)
- [2. Inventário de Rotas, Navegação e Kit Wiki](#2-inventário-de-rotas-navegação-e-kit-wiki)
- [3. Monitoramento Vale, Ações, Notícias e Acordos](#3-monitoramento-vale-ações-notícias-e-acordos)
- [4. Páginas de Listas Grandes e Sistema de Tags](#4-páginas-de-listas-grandes-e-sistema-de-tags)
- [5. Sistema de Mapas (Globo 3D, UCs e Geocodificação)](#5-sistema-de-mapas-globo-3d-ucs-e-geocodificação)
- [6. Alertas de Arquitetura e Regras Editoriais](#6-alertas-de-arquitetura-e-regras-editoriais)
- [Decisões registradas](#decisões-registradas)

---

## Propósito

Consolidar o levantamento técnico detalhado do repositório `controle-popular`, estruturando o estado atual, acervos, rotas, gargalos de UX para cidadãos leigos e pontos de integração de dados entre as frentes Paraopeba, Ambiental, Terras, Cidades, Judiciário e Congresso.

---

## 1. Biblioteca × Análise Temática (Paraopeba e Acervos)

### 1.1 A Página "Biblioteca" (`/paraopeba/biblioteca`)
* **Rotas:** `apps/web/app/paraopeba/biblioteca/page.tsx` (servidor) + `BibliotecaClient.tsx` (cliente).
* **Entrada no menu:** `apps/web/app/paraopeba/layout.tsx:61` ("Biblioteca").
* **Fonte de dados:** `apps/web/public/data/biblioteca-ati.json` (418 KB, gerado em 26/08/2026), lido no build por `apps/web/lib/paraopeba/biblioteca.ts` via `node:fs` com fallback para `env.ASSETS.fetch` no Cloudflare. Mantido fora do barril `lib/paraopeba/index.ts` para não vazar `fs` para o cliente.
* **Triagem de PII:** Em runtime na leitura via `apps/web/lib/paraopeba/triagem.ts`.
* **Coletores e Classificadores:**
  * `scripts/coletar-biblioteca-ati.py` (AEDAS via WP REST + Guaicuy via sitemap);
  * `scripts/coletar-biblioteca-nacab.mts` (NACAB via raspagem);
  * Classificadores: `scripts/classificar-biblioteca-ati-macro.py` e `scripts/classificar-biblioteca-ati-sem-tema.py`.
* **Acervo:** 645 itens (AEDAS: 435, Guaicuy: 162, NACAB: 48). ADAI medida e fora (0 documentos da bacia). Período: 26/03/2020 a 23/06/2026.
* **Decisão editorial explícita:** Não se confunde com `/paraopeba/documentos`. Não há PDFs próprios nem resumos gerados (direitos autorais da Lei 9.610/98) — apenas metadados e links externos para as fontes.
* **Modelo (`ItemBiblioteca`):**
  ```typescript
  {
    id: string;
    ati: "aedas" | "guaicuy" | "nacab" | "adai";
    fonte_id: string;
    titulo: string;
    data: string | null;
    tipo: string;
    macro_categoria: string;
    tags: string[];
    temas: string[];                     // Declarados pela fonte (só AEDAS classifica)
    temas_ajri_inferred?: TemaAjri[];    // Inferidos por palavra-chave no título
    origem: string | null;
    colecoes: string[];
    url: string;
    autoria: string | null;
  }
  ```
* **Recursos atuais de busca/filtro:** Busca textual client-side (sem remoção de acentos), chips por ATI, selects por tipo/tema/macro-categoria/tag, período de/até, ordenação (recente/antigo/A-Z), exportação CSV com BOM UTF-8 e separador `;`, gráfico SVG de barras e paginação em lotes de 60.

### 1.2 A "Análise Temática" / Integrada (`/paraopeba/analise`)
* **Rotas:** `apps/web/app/paraopeba/analise/page.tsx` + `PainelAnalise.tsx`.
* **O que mostra:** Cruzamento dos 16 eixos temáticos da síntese da auditoria AECOM com o vocabulário controlado `TemaAjri` (25 temas), combinando perícia UFMG e biblioteca das ATIs, além de temas órfãos e estudos ausentes.
* **Lógica central:** `apps/web/lib/paraopeba/sintese-integrada.ts` (modelo `EixoIntegrado`), `temas-ati.ts` e `temas-ati-utils.ts` (tabela de 26 temas livres mapeados para 11 `TemaAjri`).
* **Busca e filtros:** Normalização com remoção de acentos (`NFD`), filtro por cobertura (lacuna / 3 fontes / só auditoria), ordenação e gráfico de cobertura.

### 1.3 Acervos da UFMG e Órgãos Ambientais
* **Dois acervos UFMG separados de propósito:**
  * `/paraopeba/documentos`: Peças do processo judicial que citam municípios (índice Solr, 471 publicados de 7.107 — 6,6%).
  * `/paraopeba/pericia`: Resultados técnicos do CTC/UFMG (445 arquivos, laudos periciais).
* **Órgãos Ambientais (SEMAD, COPAM, IBAMA, FEAM, IEF):**
  * `/ambiental/convenios`: Convênios estaduais.
  * `/ambiental/estudos`: Links de EIA/RIMA de audiências públicas (índice fatiado).
  * `/ambiental/tac`: Execução financeira de TACs de mineradoras.
  * `/ambiental/licenciamento`, `/ambiental/copam`, `/ambiental/barragens`, `/ambiental/legislacao`.

---

## 2. Inventário de Rotas, Navegação e Kit Wiki

### 2.1 Inventário de 153 Rotas (`page.tsx`)
* **Raiz / Institucional (13):** `/`, `/sobre`, `/termos`, `/novidades`, `/indice`, `/busca`, `/api` (Swagger), `/assistente`, `/assistente-ia-lab`, `/empresas`, `/empresas/[slug]`, `/dados/populares`, `/dados/comunicabr` (+ `/[codigo]`).
* **Cidades (63 rotas × 6 municípios):** `[municipio]/` (home, índice, sobre, notícias, painel-do-cidadão; prefeitura: contratos, licitações, despesas, servidores, cultura; câmara: proposições, votações, comissões, vereadores; serviços: saúde, educação, clima, defesa civil, etc.).
* **Congresso (16):** `/congresso` (proposições, votações, parlamentares, comissões, bancadas, ofício, etc.).
* **Judiciário (16):** `/judiciario` (tribunais, vagas, indicações, presídios, defensoria, sirenejud, etc.).
* **Ambiental (19):** `/ambiental` (copam, licenciamento, barragens, legislação, tac, convênios, estudos, etc.).
* **Paraopeba (17):** `/paraopeba` (entenda, clipping, notícias-vale, linha-do-tempo, quem-atua, auxílio, execução, documentos, biblioteca, auditoria, perícia, análise, correlação, vale, vale/documentos).
* **Função Social da Terra (4):** `/funcaosocialterra`, `/alertas`, `/mapa` (Globo 3D), `/indice`.
* **Direitos em Movimento (4):** `/direitos-em-movimento` (home, ajuda, denúncia, informação).

### 2.2 Navegação Atual e Lacunas Identificadas
* **TopNav Global (`TopNav.tsx`):** Sticky, com menu expansível das 6 frentes, busca rápida e controles de acessibilidade.
* **Kit Wiki (`components/wiki/`):** `IndiceWiki.tsx`, `SecaoWiki.tsx`, `LinksRelacionados.tsx`, `VejaMais.tsx`, `CartaoTopico.tsx`.
* **Lacunas críticas:**
  * Falta botão "Voltar ao topo" em páginas longas;
  * Páginas longas (licenciamento, entenda, barragens) não possuem sumário com âncoras locais;
  * Falta componente `FluxoNavegacao` / scroll-spy;
  * Sobreposição de rotas similares (ex.: `/judiciario/sirenejud` × `/ambiental/judiciario`; `/paraopeba/documentos` × `/paraopeba/vale/documentos` × `/paraopeba/biblioteca`).

---

## 3. Monitoramento Vale, Ações, Notícias e Acordos

### 3.1 Página de Ações da Vale (`/paraopeba/vale`)
* **Dados:** `apps/web/data/vale3-cotacoes.json` (2.894 pregões, 2015 a 2026, B3 COTAHIST).
* **Estrutura:** 5 cartões de topo, gráfico SVG inline (~580 pontos com 3 marcos fixos: Fundão 2015, Brumadinho 2019, Acordo 2021) e exportação CSV.
* **Lacuna:** Falta conexão direta com a linha do tempo da reparação (`MARCOS_PARAOPEBA`), notícias históricas e documentos CVM.

### 3.2 Notícias e Correlação
* `/paraopeba/noticias-vale`: Feed recente com ~60 notícias (sem acervo histórico dos crashes de 2015/2019).
* `/paraopeba/correlacao`: Motor de detecção de oscilações $\ge 5\%$ em janela de $\pm 3$ pregões.

### 3.3 Acordos e Documentos CVM
* **Acordo de Mariana / Rio Doce:** Acervo ingerido em `etl/betim/dados/ckan-mg-mariana.json` (532 empenhos, R$ 677 mi) com lib pronta `apps/web/lib/ambiental/ckan-mg-mariana.ts`, mas **sem rota publicada**.
* **CVM (`/paraopeba/vale/documentos`):** 55 períodos (ITR, DFP, FRE) de 2015 a 2025. Falta coletar Fatos Relevantes.

---

## 4. Páginas de Listas Grandes e Sistema de Tags

### 4.1 Padrão `TabelaEstatica.tsx` (15 listas no portal)
* Utiliza índice estático fatiado (`manifesto.json` + `N.json`) com paginação, busca sem acento e ordenação por coluna.
* Evita sobrecarga de payload no cliente (conforme regra do teto de 25 MiB no Cloudflare Workers).

### 4.2 Motor de Tags de Assunto (`apps/web/lib/tags.ts`)
* Extrai tags semânticas baseadas em regras de vocabulário controlado (`RegraTag[]`).
* Vocabulários ativos: `tags-licenciamento.ts` e `tags-barragens.ts`.
* Oportunidade: Unificar a renderização visual de chips de tags (hoje duplicada em 3 componentes).

---

## 5. Sistema de Mapas (Globo 3D, UCs e Geocodificação)

* **Globo 3D (`/funcaosocialterra/mapa`):** Aplicação estática em Three.js/Leaflet em `apps/web/public/terras/globo/` com ~45 camadas GeoJSON pré-processadas.
* **Unidades de Conservação (UCs):** Camada `unidades-conservacao.geojson` publicada com 387 UCs de Minas Gerais.
* **Geolocalização de Licenciamento:** Coordenadas lat/lon presentes no banco Postgres (PJ) com link externo para OSM; possibilidade de camada dedicada no Globo 3D.
* **Atos Municipais × Áreas Protegidas:** Camada `atos-area-protegida-municipios.geojson` mapeia normas que afetam áreas protegidas.

---

## 6. Alertas de Arquitetura e Regras Editoriais

1. **Separação de Vozes:** Não misturar peças processuais judiciais com relatórios de ATIs ou laudos periciais na mesma lista sem identificação explícita de autoria e propósito.
2. **Teto de Payload:** Listas acima de 2.000 itens devem utilizar `TabelaEstatica` e índice fatiado.
3. **Normalização de Busca:** Padronizar todas as buscas client-side para usar remoção de acentos (`lib/busca/normalizar.ts`).
4. **Links Cross-Zona:** Devem sempre ser tags `<a>` puras para evitar erros de prefixação do roteador Next.js.

---

## Decisões registradas

- Documento criado como referência consolidada de arquitetura para a execução do plano de melhorias de UX, navegação e integração de dados.
