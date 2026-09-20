# AUDITORIA — Mapeamento e Correção de Links nas Top 100 Páginas, Eixos e Subfrentes

> **Tipo:** RELATORIO
> **Domínio:** global
> **Última medição:** 2026-09-20
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [PRODUTO.md](../01-produto/PRODUTO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** links, auditoria, top 100, eixos, subfrentes, rotas, 404, fontes oficiais, canonicas, linkmender

## Sumário

- [1. Propósito e Metodologia](#1-propósito-e-metodologia)
- [2. Mapeamento das Top 100 Páginas](#2-mapeamento-das-top-100-páginas)
- [3. Correções de Rotas Internas](#3-correções-de-rotas-internas)
- [4. Correções de Links Externos e Fontes Oficiais](#4-correções-de-links-externos-e-fontes-oficiais)
- [5. Higienização dos Dados do Judiciário](#5-higienização-dos-dados-do-judiciário)
- [6. Resolução de Links Específicos e Profundos](#6-resolução-de-links-específicos-e-profundos)
- [7. Camada LinkMender Atualizada](#7-camada-linkmender-atualizada)
- [8. Verificação e Testes](#8-verificação-e-testes)

## 1. Propósito e Metodologia

Este relatório documenta a auditoria completa de links internos e externos realizada nas 100 páginas nobres catalogadas em `apps/web/data/top-100-paginas.json`, nos 3 Grandes Eixos Temáticos (`Direitos em Movimento`, `Terra e Territórios` e `Estado e Economia`), nas frentes cívicas e nas suas 18 subfrentes.

A metodologia combinou:
1. **Varredura estática de rotas:** Comparação de todo `href` e rota contra a árvore física de pastas do Next.js App Router (`apps/web/app/`).
2. **Sondagem de rede HTTP:** Consulta automatizada a todas as URLs externas declaradas em código de UI com User-Agent honesto do projeto, identificando erros 404, domínios migrados e URLs quebradas.
3. **Busca ativa e resolução canônica:** Consulta aos portais dos órgãos públicos e documentações oficiais para localizar as URLs ativas e oficiais.
4. **Aplicação das correções:** Ajustes nos arquivos de UI, nas rotas legadas do catálogo de eixos e na camada de correção `apps/web/data/link-correcoes.json`.
5. **Aprofundamento de links específicos (Regra do Dono):** Eliminação de links genéricos ou meramente de homepages em favor de links diretos para cada contrato, processo, convênio, licença, perfil e departamento.

## 2. Mapeamento das Top 100 Páginas

O catálogo das 100 páginas nobres (`apps/web/data/top-100-paginas.json`) e o mapa de resumos para síntese de voz (`apps/web/lib/resumos-top100.ts`) foram validados:
- **98 rotas internas:** Todas ativas e mapeando para páginas válidas e pré-renderizadas no App Router.
- **2 links externos (itens 99 e 100):** Repositório no GitHub e Manifesto Editorial, ambos ativos no endereço oficial `https://github.com/FinweeJur/controle-popular`.

## 3. Correções de Rotas Internas

Foram identificadas e corrigidas rotas internas com erros de digitação, acentuação indevida ou caminhos relativos:

| Arquivo | Link Anterior (Quebrado) | Link Corrigido | Causa |
|---|---|---|---|
| `apps/web/app/ambiental/indice/page.tsx` | `/ambiental/legislação` | `/ambiental/legislacao` | Acento na URL gerava 404 |
| `apps/web/app/funcaosocialterra/indice/page.tsx` | `/funçãosocialterra` | `/funcaosocialterra` | Cedilha e til na URL |
| `apps/web/app/funcaosocialterra/indice/page.tsx` | `/funçãosocialterra/alertas` | `/funcaosocialterra/alertas` | Cedilha e til na URL |
| `apps/web/app/funcaosocialterra/indice/page.tsx` | `/funçãosocialterra/mapa` | `/funcaosocialterra/mapa` | Cedilha e til na URL |
| `apps/web/app/judiciario/indice/page.tsx` | `/judiciario/inspeções` | `/judiciario/inspecoes` | Acento na URL gerava 404 |
| `apps/web/app/judiciario/indice/page.tsx` | `/judiciario/números` | `/judiciario/numeros` | Acento na URL gerava 404 |
| `apps/web/app/judiciario/indice/page.tsx` | `/judiciario/presídios` | `/judiciario/presidios` | Acento na URL gerava 404 |
| `apps/web/app/ambiental/barragens/page.tsx` | `/barragens/descaracterizacao` | `/ambiental/barragens/descaracterizacao` | Rota absoluta canônica |
| `apps/web/app/ambiental/barragens/TabelaSigbm.tsx` | `/barragens/descaracterizacao` (texto) | `/ambiental/barragens/descaracterizacao` | Texto visível alinhado à rota |
| `apps/web/app/components/TopNav.tsx` | `/decisoes-lai` | `/ambiental/decisoes-lai` | Rota do acervo LAI |
| `apps/web/app/components/TopNav.tsx` | `/convenios` | `/ambiental/convenios` | Rota do acervo de convênios |

### Subfrentes no Catálogo de Eixos (`apps/web/lib/eixos/catalogo.ts`)
As subfrentes que não possuíam página própria dedicada estavam gerando links 404 na barra `EixoHeaderNav.tsx`. Foram mapeadas com `rotaLegada` para seus respectivos hubs temáticos:
- **Segurança Alimentar:** direcionada para `/direitos-em-movimento` (hub de agricultura familiar e combate à fome).
- **Moradia e Habitação:** direcionada para `/direitos-em-movimento/ajuda` (hub de assistência social e apoio fundiário).
- **Biomas e Biodiversidade:** direcionada para `/ambiental/clima-risco` (painel de adaptação e risco climático).
- **Executivo e Políticas:** direcionada para `/governo` (painel de programas de governo e diários).
- **Transparência e Controle Social:** direcionada para `/dados/comunicabr` (painel de transferências e transparência).

## 4. Correções de Links Externos e Fontes Oficiais

Identificamos URLs de portais públicos federais e serviços de dados que foram reformulados pelas instituições ou continham erros de digitação:

| Origem | Link Anterior | Link Canônico Atualizado | Instituição / Motivo |
|---|---|---|---|
| `apps/web/app/layout.tsx` e `TecnologiaClient.tsx` | `github.com/melkepinho/controle-popular` | `https://github.com/FinweeJur/controle-popular` | Repositório oficial do projeto |
| `apps/web/app/components/DatasetJsonLd.tsx` | `https://controlepopular.com.br` | `https://www.controlepopular.com.br` | Domínio com www (Guara Cloud não aceita apex) |
| `apps/web/app/funcaosocialterra/page.tsx` | `car.gov.br/publico/imoveis/index` | `https://consulta.car.gov.br/` | Portal oficial da Consulta Pública do SICAR/CAR |
| `apps/web/app/funcaosocialterra/mapa/TourAchadosMapa.tsx` | `sistemas.anm.gov.br/SCM/...` | `https://www.gov.br/anm/pt-br/assuntos/processos/consulta-de-processos` | Cadastro Mineiro / Consulta de Processos ANM |
| `apps/web/app/paraopeba/correlacao/page.tsx` | `b3.com.br/.../boletim-diario/...` | `https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/historico/mercado-a-vista/series-historicas/` | Séries Históricas COTAHIST da B3 |
| `apps/web/app/dados/comunicabr/page.tsx` e `[codigo]` | `comunicabr.presidencia.gov.br` | `https://www.gov.br/secom/pt-br/acesso-a-informacao/comunicabr` | Portal oficial do ComunicaBR na SECOM/Gov.br |

## 5. Higienização dos Dados do Judiciário

No arquivo `apps/web/data/judiciario-instituicoes-detalhe.json`:
- **TRF6:** Corrigido domínio inexistente `www.trf6.jus.br` para o domínio canônico `portal.trf6.jus.br`. Links de Presidência, Turmas, Varas e Ouvidoria apontam para suas seções institucionais oficiais.
- **TRT3:** Corrigido domínio `www.trt3.jus.br` para o domínio canônico `portal.trt3.jus.br`, apontando para a estrutura administrativa, composição e ouvidoria.
- **MPMG:** Links ajustados para o portal canônico `mpmg.mp.br` (PGJ, Corregedoria, CAOs, GAECO e Ouvidoria oficial `ouvidoria.mpmg.mp.br`).
- **DPMG:** Links ajustados para `defensoria.mg.def.br` com acesso ao Balcão Virtual e núcleos temáticos especializados.
- **TCEMG:** Links específicos para o Pleno, MPC-MG (`mpc.tce.mg.gov.br`), SICOM (`sicom.tce.mg.gov.br`), Suricato e Ouvidoria.
- **CNJ, STF, STJ, CNMP, MPF e DPU:** Links detalhados para composição, colegiados, ouvidorias e corregedorias nacionais.
- **Limpeza de URLs truncadas:** 157 campos corrigidos, eliminando slugs truncados por caracteres cortados (`-d`, `-ge`, `-jus`).

## 6. Resolução de Links Específicos e Profundos

Em atendimento à diretriz de profundidade (proibição de links genéricos para homepages quando há protocolo ou registro oficial canônico):

1. **Contratos Públicos (`ListaContratos.tsx` e `ListaContratosCultura.tsx`):**
   - Resolução direta para o Portal Nacional de Contratações Públicas (PNCP): `https://pncp.gov.br/app/contratos/{numero_controle_pncp}`.
   - Fallback encadeado para `c.link_fonte`, `c.link_pncp` e geração baseada em `c.numero_controle_pncp`.

2. **Convênios Ambientais (`FiltroConvenios.tsx`):**
   - Cada convênio publicado agora traz botão com link oficial direto:
     - Convênios Estaduais (SEMAD, FEAM, IEF, IGAM): consulta do convênio específico no Portal da Transparência de Minas Gerais / CGE-MG (`https://www.transparencia.mg.gov.br/convenios/convenios-saida?id={id}`).
     - Convênios Federais: consulta direta no Portal da Transparência Federal / Transferegov (`https://portaldatransparencia.gov.br/convenios/{id}`).

3. **Licenciamento Ambiental (`FiltroLicencas.tsx` e `licencas-unificada.ts`):**
   - Geração de link oficial processual direto no SIAM (Sistema Integrado de Informação Ambiental de Minas Gerais) para cada licença por `numeroProcesso`: `http://www.siam.mg.gov.br/siam/processo/consulta_processo.jsp?num={numeroProcesso}`.
   - Cobertura estendida a SEMAD-MG, FEAM e IEF em `construirLinkOficial`.

4. **Parlamentares (`[id]/page.tsx`):**
   - Link canônico ao perfil oficial de cada deputado na Câmara (`https://www.camara.leg.br/deputados/{id}`) e senador no Senado Federal (`https://www25.senado.leg.br/web/senadores/senador/-/perfil/{id}`), com rótulo correspondente da casa legislativa.

5. **Barragens de Mineração (`TabelaSigbm.tsx`):**
   - Cada barragem do cadastro ANM SIGBM possui link direto em seu nome para a ficha técnica no sistema oficial da Agência Nacional de Mineração: `https://app.anm.gov.br/sigbm/publico/gerenciar-barragem/detalhar/{id}`.

## 7. Camada LinkMender Atualizada

Em conformidade com a arquitetura do projeto (`apps/web/lib/linkmender/correcoes.ts`), as correções que afetam fontes externas foram integradas a `apps/web/data/link-correcoes.json`, permitindo rastreabilidade com critérios (`dominio-oficial`, `destino-verificado-vivo`, `estrategia:migracao-portal`) e sem reescrita destrutiva de bases brutas.

A camada foi validada com sucesso pelo script `validar-link-correcoes.mjs`, registrando 8 correções ativas.

## 8. Verificação e Testes

Todos os testes de conformidade foram executados:
1. `validar-link-correcoes.mjs`: camada validada com sucesso.
2. `validar-documentacao.py`: estrutura da documentação em conformidade.
3. `vitest` e testes de tipagem: suíte verde.
4. `checar-dado-pessoal-em-dado.py`: garantia de ausência de CPFs ou dados pessoais.
