# Relatório técnico geral do site

> **Tipo:** RELATORIO
> **Domínio:** global
> **Última medição:** 2026-09-08
> **Leitura estimada:** longa (> 15 min)
> **Relacionados:** [PLANO-ESTUDOS-RURAIS-RELATORIO-AUTOMACAO-NEON](../planos/PLANO-ESTUDOS-RURAIS-RELATORIO-AUTOMACAO-NEON.md), [PRODUTO](../01-produto/PRODUTO.md), [linkmender-propostas](linkmender-propostas.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** relatorio tecnico, rotas, frentes, fontes, app router, dado versionado, cobertura, geracao automatica

Documento gerado por `scripts/gerar-relatorio-tecnico.mts` em 2026-09-08.
Fonte da verdade: o código do repositório (rotas do App Router, registry de fontes, catálogo de eixos) e os JSONs versionados, medidos na geração.

## Sumário

- [Resumo geral](#resumo-geral)
- [Rotas por frente](#rotas-por-frente)
- [Fontes registradas](#fontes-registradas)
- [Eixos e subfrentes](#eixos-e-subfrentes)
- [Lacunas declaradas](#lacunas-declaradas)
- [Método](#metodo)

## Resumo geral

- **Rotas mapeadas:** 206 (varredura de `apps/web/app/**/page.tsx` e `page.din.tsx` em 2026-09-08)
- **Frentes:** 9
- **Fontes registradas:** 42 (`lib/fontes/registry.ts`)
- **Eixos temáticos:** 3, com 18 subfrentes (`lib/eixos/catalogo.ts`)
- **JSONs de dado versionado em `apps/web/data/`:** 62 arquivos
- **Páginas sem descrição extraível:** 17

## Rotas por frente

Formato de cada linha: Rota → o que mostra → fonte(s) → principais dados (medidos em 2026-09-08).

### Cidades (70 rotas)

- **`/[municipio]` (rota dinâmica)** — Dados públicos sobre contratos, finanças, câmara e serviços de …-…, reunidos em um só lugar. Portal independente, sem vínculo com a Prefeitura ou a Câmara.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `juma-acoes-climaticas.json`: 9 registros (10 KB), medido em 2026-09-08; `relatorios-direitos-humanos.json`: 9 registros (12 KB), medido em 2026-09-08
- **`/[municipio]/admin` (rota dinâmica)** — ⚠️ Lacuna do gerador: a página não segue o padrão de comentário de cabeçalho nem declara título de metadata — não sei dizer pelo código o que ela mostra.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/agro` (rota dinâmica)** — Produção agropecuária de …-….
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/anuncie` (rota dinâmica)** — Anuncie seu negócio local no … — divulgação única a partir de R$ 200, sem mensalidade.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/assistente` (rota dinâmica)** — ⚠️ Lacuna do gerador: a página não segue o padrão de comentário de cabeçalho nem declara título de metadata — não sei dizer pelo código o que ela mostra.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/camara` (rota dinâmica)** — Vereadores da … de …-…: composição, gastos de gabinete, verbas indenizatórias e ranking de atuação.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/camara/comissoes` (rota dinâmica)** — Composição atual das comissões permanentes da Câmara Municipal de ….
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/camara/legislacao` (rota dinâmica)** — Leis, decretos, resoluções e instruções normativas da …, com filtro por categoria, ano e área temática.
  - Fonte(s): Diário Oficial dos Municípios Mineiros (SIGPub / AMM-MG) (Associação Mineira de Municípios (AMM), municipal, cadência diaria, camada banco); Diários oficiais municipais (agenda SIGPub + DOM-PBH) (AMM-MG e PBH, municipal, cadência diaria, camada banco)
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/camara/proposicoes` (rota dinâmica)** — Todos os projetos de lei, requerimentos, indicações e emendas apresentados na Câmara Municipal de …, com busca e filtro.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/camara/votacoes` (rota dinâmica)** — Como cada vereador de …-… votou, votação por votação.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/citrolandia` (rota dinâmica)** — Bairros da Regional Citrolândia em …-… e negócios locais cadastrados no Zap ….
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/clima` (rota dinâmica)** — Previsão do tempo e histórico de chuva dos últimos 7 dias em …-….
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/coleta-lixo` (rota dinâmica)** — Dias e horários de coleta de lixo comum e seletiva por bairro em …-….
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/compra-e-venda` (rota dinâmica)** — Classificados gratuitos de …-…: imóveis, veículos, eletrônicos, agro e serviços — contato direto por WhatsApp.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/contatos` (rota dinâmica)** — Telefones úteis de …-…: emergência, Prefeitura, Câmara Municipal e serviços.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/convenios` (rota dinâmica)** — Convênios, repasses e emendas federais recebidos por ….
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/dados` (rota dinâmica)** — …-… em números: saúde, educação, economia, segurança e outros dados públicos com fonte oficial.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/defesa-civil` (rota dinâmica)** — Como receber alertas da Defesa Civil de …-…: aplicativo oficial, canal de WhatsApp e telefone de emergência.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/economia` (rota dinâmica)** — PIB, salário médio e saldo de empregos de …-….
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/educacao` (rota dinâmica)** — Escolas, matrículas e IDEB de …-…, direto do Censo Escolar (INEP).
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/emendas` (rota dinâmica)** — Convênios e repasses federais recebidos por …, com órgão de origem, valor e situação, via Portal da Transparência.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/gestao` (rota dinâmica)** — Acompanhamento das propostas de governo registradas na Justiça Eleitoral (TSE) para a Prefeitura de … cruzadas com as secretarias municipais e contratos.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `gestao/governo-mg.json`: objeto com 16 chaves; listas: propostas: 5; iniciativas_fora_do_plano: 1 (6 KB), medido em 2026-09-08; `gestao/governo-sp.json`: objeto com 16 chaves; listas: propostas: 5; iniciativas_fora_do_plano: 1 (5 KB), medido em 2026-09-08; `gestao/governo-rj.json`: objeto com 16 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-es.json`: objeto com 16 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-pa.json`: objeto com 16 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-df.json`: objeto com 16 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-rs.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-pr.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-sc.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-ba.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-pe.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-ce.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-go.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-mt.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-ms.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-am.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-ro.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-to.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-ac.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-ap.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-rr.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-ma.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-pb.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-rn.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-al.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-pi.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-se.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-uniao.json`: objeto com 16 chaves; listas: propostas: 5; iniciativas_fora_do_plano: 1 (6 KB), medido em 2026-09-08; `gestao/gestao-betim.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/gestao-bh.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/gestao-aracuai.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/gestao-brumadinho.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/gestao-capitais.json`: objeto com 30 chaves (132 KB), medido em 2026-09-08; `gestao/gestao-polos.json`: objeto com 172 chaves (828 KB), medido em 2026-09-08
- **`/[municipio]/grupos-economicos` (rota dinâmica)** — Fornecedores da Prefeitura de … que compartilham sócios entre si, detectados a partir do quadro societário da Receita Federal.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/indice` (rota dinâmica)** — ⚠️ Lacuna do gerador: a página não segue o padrão de comentário de cabeçalho nem declara título de metadata — não sei dizer pelo código o que ela mostra.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/infraestrutura` (rota dinâmica)** — Cobertura de água e esgoto em …-…, dados do SNIS.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/interesses` (rota dinâmica)** — Como o portal cruza mandato político, contratos, empresas e território em …-…: metodologia, fontes previstas e lacunas declaradas.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/legislacao` (rota dinâmica)** — Lei Orgânica, Plano Diretor, zoneamento, Código Tributário e Obras/Posturas de …: status, links oficiais e onde procurar cada um.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/legislacao/alertas` (rota dinâmica)** — Leis e projetos de lei de … que restringem direitos, com o dispositivo legal e o trecho que fundamentam cada classificação.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/legislacao/bons-exemplos` (rota dinâmica)** — Leis e projetos de lei de … que ampliam direitos, com o dispositivo legal e o trecho que fundamentam cada classificação.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/links-uteis-mg` (rota dinâmica)** — ⚠️ Lacuna do gerador: a página não segue o padrão de comentário de cabeçalho nem declara título de metadata — não sei dizer pelo código o que ela mostra.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/meio-ambiente` (rota dinâmica)** — O que existe de fonte pública sobre meio ambiente na região de …-…: barragens de mineração, compensação ambiental e TACs.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/meio-ambiente/autuacoes` (rota dinâmica)** — Autos de infração ambiental do estado em …-…: quantos, de que órgão, quanto foi multado e quanto continua em aberto — com a situação de cada processo.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/meio-ambiente/barragens` (rota dinâmica)** — Barragens em …-…: quantas, de quem, condição de estabilidade, nível de emergência e quais foram erguidas a montante — o método de Mariana e Brumadinho.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/meio-ambiente/paraopeba` (rota dinâmica)** — Projetos de reparação socioeconômica em … ligados ao Acordo Geral pelo rompimento da barragem da Vale em Brumadinho, auditados pela FGV.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/metodologia` (rota dinâmica)** — ⚠️ Lacuna do gerador: a página não segue o padrão de comentário de cabeçalho nem declara título de metadata — não sei dizer pelo código o que ela mostra.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/mineracao` (rota dinâmica)** — Royalties da mineração (CFEM) arrecadados sobre a produção mineral de …-….
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/nota-betim` (rota dinâmica)** — A nota de transparência de … agora fica em /nota-transparencia.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/nota-transparencia` (rota dinâmica)** — Nota de transparência de … no ranking estadual (PNTP/ATRICON).
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/noticias` (rota dinâmica)** — Achados de investigação, explicadores e notas sobre …-…: dados públicos, poder público e transparência.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/noticias/[slug]` (rota dinâmica)** — ⚠️ Lacuna do gerador: a página não segue o padrão de comentário de cabeçalho nem declara título de metadata — não sei dizer pelo código o que ela mostra.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/painel-do-cidadao` (rota dinâmica)** — Resumo em uma tela: maiores contratos e fornecedores de …, contratos em alerta, sobreposições territoriais e legislação principal, com links para o detalhe.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/plantao-farmacias` (rota dinâmica)** — Farmácias de plantão da semana em …-…, com telefone e rota no Waze.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/postos-combustivel` (rota dinâmica)** — Postos de combustível de …-… cadastrados na ANP, com bandeira, produtos e nota de conformidade (PMQC).
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/prefeitura` (rota dinâmica)** — Dados públicos da Prefeitura de …: contratos, despesas por área, servidores, obras e licitações.
  - Fonte(s): Transferegov / Convênios Federais (Ministério da Gestão / Seges, federal, cadência semanal, camada data-json); Repasse aos Municípios (Lei Estadual 23.830/2021) (Governo do Estado de Minas Gerais / SEPLAG, estadual, cadência estatica, camada public-assets)
  - Principais dados: `diario-atos-municipios.json`: objeto com 6 chaves; listas: diamantina: 7; betim: 5; belo-horizonte: 3; aracuai: 2 (14 KB), medido em 2026-09-08
- **`/[municipio]/prefeitura/contratos` (rota dinâmica)** — Veja os contratos administrativos da Prefeitura de …: fornecedores, valores, alertas e links oficiais no Portal Nacional de Contratações Públicas (PNCP).
  - Fonte(s): Portal Nacional de Contratações Públicas (PNCP) (Ministério da Gestão e da Inovação em Serviços Públicos, federal, cadência diaria, camada banco); Transferegov / Convênios Federais (Ministério da Gestão / Seges, federal, cadência semanal, camada data-json); Repasse aos Municípios (Lei Estadual 23.830/2021) (Governo do Estado de Minas Gerais / SEPLAG, estadual, cadência estatica, camada public-assets)
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/prefeitura/cultura` (rota dinâmica)** — Quanto a Prefeitura de … gastou em Cultura, e os contratos de cultura, esporte e lazer firmados via PNCP.
  - Fonte(s): Transferegov / Convênios Federais (Ministério da Gestão / Seges, federal, cadência semanal, camada data-json); Repasse aos Municípios (Lei Estadual 23.830/2021) (Governo do Estado de Minas Gerais / SEPLAG, estadual, cadência estatica, camada public-assets)
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/prefeitura/despesas` (rota dinâmica)** — Quanto a Prefeitura de … gastou em saúde, educação, urbanismo e outras funções. Valores e fatia do total.
  - Fonte(s): Transferegov / Convênios Federais (Ministério da Gestão / Seges, federal, cadência semanal, camada data-json); Repasse aos Municípios (Lei Estadual 23.830/2021) (Governo do Estado de Minas Gerais / SEPLAG, estadual, cadência estatica, camada public-assets)
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/prefeitura/diarias` (rota dinâmica)** — Diárias e passagens aéreas pagas pelo poder público de …: quem viajou, para onde, por quê e quanto custou.
  - Fonte(s): Transferegov / Convênios Federais (Ministério da Gestão / Seges, federal, cadência semanal, camada data-json); Repasse aos Municípios (Lei Estadual 23.830/2021) (Governo do Estado de Minas Gerais / SEPLAG, estadual, cadência estatica, camada public-assets)
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/prefeitura/diario` (rota dinâmica)** — Atos oficiais, extratos de contratos, editais de licitação, decretos e convênios publicados na imprensa oficial da Prefeitura de ….
  - Fonte(s): Transferegov / Convênios Federais (Ministério da Gestão / Seges, federal, cadência semanal, camada data-json); Repasse aos Municípios (Lei Estadual 23.830/2021) (Governo do Estado de Minas Gerais / SEPLAG, estadual, cadência estatica, camada public-assets)
  - Principais dados: `diario-atos-municipios.json`: objeto com 6 chaves; listas: diamantina: 7; betim: 5; belo-horizonte: 3; aracuai: 2 (14 KB), medido em 2026-09-08
- **`/[municipio]/prefeitura/fornecedores` (rota dinâmica)** — Ranking de fornecedores da Prefeitura de … por valor total contratado, número de contratos e órgãos atendidos — dados públicos via PNCP.
  - Fonte(s): Transferegov / Convênios Federais (Ministério da Gestão / Seges, federal, cadência semanal, camada data-json); Repasse aos Municípios (Lei Estadual 23.830/2021) (Governo do Estado de Minas Gerais / SEPLAG, estadual, cadência estatica, camada public-assets)
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/prefeitura/legislacao` (rota dinâmica)** — ⚠️ Lacuna do gerador: a página não segue o padrão de comentário de cabeçalho nem declara título de metadata — não sei dizer pelo código o que ela mostra.
  - Fonte(s): Transferegov / Convênios Federais (Ministério da Gestão / Seges, federal, cadência semanal, camada data-json); Repasse aos Municípios (Lei Estadual 23.830/2021) (Governo do Estado de Minas Gerais / SEPLAG, estadual, cadência estatica, camada public-assets)
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/prefeitura/licitacoes` (rota dinâmica)** — Processos de licitação da Prefeitura de …: editais, modalidades e situação. Dados públicos via PNCP.
  - Fonte(s): Transferegov / Convênios Federais (Ministério da Gestão / Seges, federal, cadência semanal, camada data-json); Repasse aos Municípios (Lei Estadual 23.830/2021) (Governo do Estado de Minas Gerais / SEPLAG, estadual, cadência estatica, camada public-assets)
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/prefeitura/obras` (rota dinâmica)** — Obras da Prefeitura de …: objeto, situação, valor previsto e percentual de execução. Dados oficiais.
  - Fonte(s): Transferegov / Convênios Federais (Ministério da Gestão / Seges, federal, cadência semanal, camada data-json); Repasse aos Municípios (Lei Estadual 23.830/2021) (Governo do Estado de Minas Gerais / SEPLAG, estadual, cadência estatica, camada public-assets)
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/prefeitura/servidores` (rota dinâmica)** — Lista de servidores da Prefeitura de …: nome, cargo, lotação e vínculo. Dado público com busca.
  - Fonte(s): Transferegov / Convênios Federais (Ministério da Gestão / Seges, federal, cadência semanal, camada data-json); Repasse aos Municípios (Lei Estadual 23.830/2021) (Governo do Estado de Minas Gerais / SEPLAG, estadual, cadência estatica, camada public-assets)
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/privacidade` (rota dinâmica)** — Como o … trata dados pessoais, em conformidade com a LGPD (Lei 13.709/2018).
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/rede-de-protecao` (rota dinâmica)** — LAI municipal, estadual e federal, e a rede de proteção de direitos de …-…: Defensoria, Ministério Público, delegacias, assistência social e clínicas jurídicas gratuitas.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/saude` (rota dinâmica)** — Internações hospitalares, arboviroses e principais causas de óbito em …-….
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/seguranca` (rota dinâmica)** — Estatísticas de criminalidade em …-….
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/servicos` (rota dinâmica)** — Zap …, Compra e Venda, coleta de lixo, farmácias de plantão, postos de combustível e clima.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/sobre` (rota dinâmica)** — O que e o …, de onde vem os dados, quem mantem o projeto e como ele se relaciona (ou nao) com o poder publico.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/social` (rota dinâmica)** — Benefícios sociais (Bolsa Família, BPC) pagos a moradores de …-….
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/supermercados-farmacias` (rota dinâmica)** — Supermercados e farmácias de …-…, com Centro e Citrolândia em destaque — dado público (OpenStreetMap), publicidade gratuita.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/terras` (rota dinâmica)** — Território de …-… sem imóvel rural declarado no CAR. Metodologia aberta e denominador explícito.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/terras/cruzamentos` (rota dinâmica)** — Sobreposições de terras indígenas, quilombolas, mineração (SIGMINE/ANM) e barragens (FEAM/SNISB) em …, com fonte e mapa.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/vereadores/[slug]` (rota dinâmica)** — ⚠️ Lacuna do gerador: a página não segue o padrão de comentário de cabeçalho nem declara título de metadata — não sei dizer pelo código o que ela mostra.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/zap` (rota dinâmica)** — Encontre e divulgue negócios locais de …-… direto pelo WhatsApp — cadastro gratuito e independente.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/[municipio]/zap-betim` (rota dinâmica)** — A página de negócios locais de … agora fica em /zap.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/cidades`** — Mapa mestre das 27 capitais de estado e 172 polos regionais do interior atendidos pelo Controle Popular com códigos IBGE e DATASUS.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `cidades-estrategicas.json`: objeto com 7 chaves; listas: cidades: 199 (145 KB), medido em 2026-09-08
- **`/governo`** — Cruzamento transparente entre planos de governo registrados no TSE e a execução real por secretarias estaduais e ministérios federais.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `gestao/governo-mg.json`: objeto com 16 chaves; listas: propostas: 5; iniciativas_fora_do_plano: 1 (6 KB), medido em 2026-09-08; `gestao/governo-sp.json`: objeto com 16 chaves; listas: propostas: 5; iniciativas_fora_do_plano: 1 (5 KB), medido em 2026-09-08; `gestao/governo-rj.json`: objeto com 16 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-es.json`: objeto com 16 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-pa.json`: objeto com 16 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-df.json`: objeto com 16 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-rs.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-pr.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-sc.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-ba.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-pe.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-ce.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-go.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-mt.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-ms.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-am.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-ro.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-to.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-ac.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-ap.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-rr.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-ma.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-pb.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-rn.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-al.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-pi.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-se.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-uniao.json`: objeto com 16 chaves; listas: propostas: 5; iniciativas_fora_do_plano: 1 (6 KB), medido em 2026-09-08; `gestao/gestao-betim.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/gestao-bh.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/gestao-aracuai.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/gestao-brumadinho.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/gestao-capitais.json`: objeto com 30 chaves (132 KB), medido em 2026-09-08; `gestao/gestao-polos.json`: objeto com 172 chaves (828 KB), medido em 2026-09-08
- **`/governo/[uf]` (rota dinâmica)** — Título da página: Governo não localizado | Controle Popular
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `gestao/governo-mg.json`: objeto com 16 chaves; listas: propostas: 5; iniciativas_fora_do_plano: 1 (6 KB), medido em 2026-09-08; `gestao/governo-sp.json`: objeto com 16 chaves; listas: propostas: 5; iniciativas_fora_do_plano: 1 (5 KB), medido em 2026-09-08; `gestao/governo-rj.json`: objeto com 16 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-es.json`: objeto com 16 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-pa.json`: objeto com 16 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-df.json`: objeto com 16 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-rs.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-pr.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-sc.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-ba.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-pe.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-ce.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-go.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-mt.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-ms.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-am.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-ro.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-to.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-ac.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-ap.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-rr.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-ma.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-pb.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-rn.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-al.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-pi.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-se.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/governo-uniao.json`: objeto com 16 chaves; listas: propostas: 5; iniciativas_fora_do_plano: 1 (6 KB), medido em 2026-09-08; `gestao/gestao-betim.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/gestao-bh.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/gestao-aracuai.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/gestao-brumadinho.json`: objeto com 15 chaves; listas: propostas: 4; iniciativas_fora_do_plano: 1 (4 KB), medido em 2026-09-08; `gestao/gestao-capitais.json`: objeto com 30 chaves (132 KB), medido em 2026-09-08; `gestao/gestao-polos.json`: objeto com 172 chaves (828 KB), medido em 2026-09-08

### Congresso (17 rotas)

- **`/congresso`** — Monitoramento de projetos de lei federais: proposições, votações, bancadas e análise de direitos. Acompanhe o Congresso Nacional com dados oficiais.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/congresso/agenda`** — O que a Câmara tem marcado: audiências públicas, reuniões deliberativas, pauta de votação, local, convidados e link para o registro.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/congresso/alertas`** — Projetos de lei federais que restringem direitos, com o dispositivo legal e o trecho que fundamentam cada classificação.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/congresso/bancadas`** — Frentes parlamentares, blocos, federações e partidos na Câmara dos Deputados, com quantos deputados cada um reúne.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/congresso/bancadas/[id]` (rota dinâmica)** — ⚠️ Lacuna do gerador: a página não segue o padrão de comentário de cabeçalho nem declara título de metadata — não sei dizer pelo código o que ela mostra.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/congresso/bons-exemplos`** — Projetos de lei federais que ampliam direitos, com o dispositivo legal e o trecho que fundamentam cada classificação.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/congresso/comissoes`** — Comissões da Câmara dos Deputados, com quantas proposições estão paradas em cada uma e o que elas ampliam ou restringem em direitos.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/congresso/comissoes/[sigla]` (rota dinâmica)** — ⚠️ Lacuna do gerador: a página não segue o padrão de comentário de cabeçalho nem declara título de metadata — não sei dizer pelo código o que ela mostra.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/congresso/cota-parlamentar`** — Auditoria e monitoramento dos gastos de gabinete de todos os deputados federais do Brasil (27 UFs). Valores reembolsados e principais fornecedores contratados.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `congresso-ceap-nacional.json`: objeto com 8 chaves; listas: parlamentares: 1445 (2465 KB), medido em 2026-09-08; `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/congresso/indice`** — Navegue pelos dados do Congresso Nacional: parlamentares, comissoes, proposicoes, votacoes e agenda.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/congresso/metodologia`** — Como classificamos um projeto de lei como garantista ou reducionista: taxonomia de direitos, mecanismos, pesos e o cálculo do score. Régua declarada e auditável.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/congresso/parlamentares`** — Todos os deputados federais em exercício, com presença em plenário, coerência de voto com direitos fundamentais e proposições de autoria. Filtre por casa, partido e UF.
  - Fonte(s): Dados Abertos do Senado Federal (Senado Federal, federal, cadência diaria, camada banco); Parlamentares de MG (Câmara/Senado via DadosAbertosBrasil) (Câmara dos Deputados / Senado Federal, federal, cadência mensal, camada data-json)
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/congresso/parlamentares/[id]` (rota dinâmica)** — Título da página: Parlamentar — Controle Popular · Congresso
  - Fonte(s): Dados Abertos do Senado Federal (Senado Federal, federal, cadência diaria, camada banco); Parlamentares de MG (Câmara/Senado via DadosAbertosBrasil) (Câmara dos Deputados / Senado Federal, federal, cadência mensal, camada data-json)
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/congresso/proposicoes`** — Busque projetos de lei federais por tema, palavra-chave e classificação de ampliação ou restrição de direitos.
  - Fonte(s): Dados Abertos da Câmara dos Deputados (Câmara dos Deputados, federal, cadência diaria, camada banco)
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/congresso/proposicoes/[id]` (rota dinâmica)** — Título da página: Proposição — Controle Popular · Congresso
  - Fonte(s): Dados Abertos da Câmara dos Deputados (Câmara dos Deputados, federal, cadência diaria, camada banco)
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/congresso/proposicoes/[id]/oficio` (rota dinâmica)** — ⚠️ Lacuna do gerador: a página não segue o padrão de comentário de cabeçalho nem declara título de metadata — não sei dizer pelo código o que ela mostra.
  - Fonte(s): Dados Abertos da Câmara dos Deputados (Câmara dos Deputados, federal, cadência diaria, camada banco)
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/congresso/votacoes`** — Como cada parlamentar votou, votação por votação, na Câmara dos Deputados.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08

### Direitos em Movimento (eixo) (7 rotas)

- **`/direitos-em-movimento`** — Que lei protege isso, onde buscar ajuda, como pedir informação e como denunciar — reunidos num lugar só, para quem sofreu ou viu uma violação de direitos.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/direitos-em-movimento/ajuda`** — Defensoria, Ministério Público, delegacias especializadas, assistência social, redes populares e clínicas jurídicas gratuitas — por necessidade, depois por cidade.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/direitos-em-movimento/denuncia`** — Um passo a passo guiado para registrar uma violação de direitos humanos. O documento nasce no seu navegador e nunca é enviado a este ou a qualquer outro servidor.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/direitos-em-movimento/educacao`** — Infraestrutura escolar, notas do IDEB, Censo Escolar e relação entre financiamento público e aprendizagem.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `fichas/catalogo.json`: 7 registros (8 KB), medido em 2026-09-08
- **`/direitos-em-movimento/informacao`** — Catálogo nacional de transparência pública (LAI): e-mail, telefone, endereço com CEP, responsável e link direto de e-SIC/Ouvidoria para 199 Prefeituras e Câmaras, órgãos federais e concessionárias de água, luz e internet.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08; `canais-informacao-lai.json`: objeto com 6 chaves; listas: canais: 445 (473 KB), medido em 2026-09-08
- **`/direitos-em-movimento/saude-publica`** — Capacidade instalada do SUS, estabelecimentos CNES, leitos de internação e razão leito/habitante nos municípios brasileiros.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `fichas/catalogo.json`: 7 registros (8 KB), medido em 2026-09-08
- **`/direitos-em-movimento/trabalho-e-renda`** — Estatísticas de emprego formal, dados do Novo CAGED, estoque da RAIS e fiscalização de empregos gerados por contratos públicos.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `fichas/catalogo.json`: 7 registros (8 KB), medido em 2026-09-08

### Empresas (4 rotas)

- **`/empresas`** — Monitoramento cívico das 130 maiores empresas e fundos atuantes no Brasil: ações na B3 e NYSE, transparência, ESG, direitos humanos, licenciamentos ambientais, contratos no PNCP e TACs.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/empresas/[slug]` (rota dinâmica)** — ⚠️ Lacuna do gerador: a página não segue o padrão de comentário de cabeçalho nem declara título de metadata — não sei dizer pelo código o que ela mostra.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `biblioteca-unificada.json`: objeto com 12 chaves; listas: itens: 969 (1030 KB), medido em 2026-09-08
- **`/empresas/documentos`** — Acervo público de relatórios de sustentabilidade (GRI/SASB), demonstrações financeiras (CVM/SEC), inventários de carbono e relatórios de direitos humanos das maiores corporações e fundos atuantes no Brasil.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/transparencia-internacional`** — Observatório de transparência sobre repasses públicos estrangeiros, projetos da USAID, dados do US Census Bureau API e investimentos de fundos norte-americanos no Brasil.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `setores-estrategicos/catalogo-top10-eua-empresas-e-fundos.json`: objeto com 7 chaves; listas: fundos_investimento_eua: 10; mineracao_eua: 10; energia_eua: 10; agua_saneamento_eua: 10 (8 KB), medido em 2026-09-08

### Função Social da Terra (9 rotas)

- **`/funcaosocialterra`** — Mapa 3D de Minas Gerais com terra indígena, barragem, mineração (SIGMINE), CFEM e alertas de sobreposição, e o vazio cadastral — quanto do território de cada cidade não tem imóvel rural declarado no CAR — com a metodologia aberta e a taxa de erro medida ao lado do número.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/funcaosocialterra/alertas`** — Sobreposição entre território (indígena e quilombola) e processo minerário na ANM, terra indígena atingida por mancha de barragem, e normas municipais que mexem em área protegida — item a item, com o caminho para conferir na fonte oficial.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/funcaosocialterra/indice`** — Navegue pelos dados da funcao social da terra: alertas, mapa de camadas e territorio.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/funcaosocialterra/mapa`** — Globo 3D interativo com vazio cadastral, terras públicas certificadas, assentamentos e territórios quilombolas em Minas Gerais, camada por camada.
  - Fonte(s): Geosserviços de Terras Indígenas (WFS FUNAI) (Fundação Nacional dos Povos Indígenas (FUNAI), federal, cadência mensal, camada public-assets); Acervo Fundiário e Territórios Quilombolas (WFS INCRA) (Instituto Nacional de Colonização e Reforma Agrária (INCRA), federal, cadência mensal, camada public-assets); SIGMINE — Sistema de Informações Geográficas da Mineração (Agência Nacional de Mineração (ANM), federal, cadência diaria, camada public-assets)
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/terra-e-territorios`** — Soberania socioambiental, 199 cidades estratégicas, bacias hidrográficas, licenciamento ONSA, terras indígenas e defesa dos biomas.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `fichas/catalogo.json`: 7 registros (8 KB), medido em 2026-09-08; `cidades-estrategicas.json`: objeto com 7 chaves; listas: cidades: 199 (145 KB), medido em 2026-09-08
- **`/terra-e-territorios/cidades`** — Rede nacional de fiscalização municipal em 27 capitais e 172 polos regionais do interior do Brasil.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `cidades-estrategicas.json`: objeto com 7 chaves; listas: cidades: 199 (145 KB), medido em 2026-09-08
- **`/terra-e-territorios/cidades/[slug]` (rota dinâmica)** — Título da página: Cidade não encontrada | Controle Popular
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `cidades-estrategicas.json`: objeto com 7 chaves; listas: cidades: 199 (145 KB), medido em 2026-09-08; `fichas/catalogo.json`: 7 registros (8 KB), medido em 2026-09-08
- **`/terra-e-territorios/nossas-serras`** — Preservação de topos de morro, patrimônio geológico, Unidades de Conservação e contenção da expansão minerária predatória.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `fichas/catalogo.json`: 7 registros (8 KB), medido em 2026-09-08
- **`/terra-e-territorios/nossos-rios`** — Monitoramento hidrológico, qualidade das águas, bacias atingidas (Rio Doce, Paraopeba), saneamento básico e reparação integral.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `fichas/catalogo.json`: 7 registros (8 KB), medido em 2026-09-08

### Judiciário (23 rotas)

- **`/estado-e-economia`** — Transparência institucional, orçamento público, compras no PNCP, controle de gastos do Judiciário e votações no Congresso.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `fichas/catalogo.json`: 7 registros (8 KB), medido em 2026-09-08
- **`/estado-e-economia/judiciario`** — Composição dos sete tribunais superiores e regionais, vacância de magistrados, inspeções do CNJ e processos ambientais do SIRENEJud.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `fichas/catalogo.json`: 7 registros (8 KB), medido em 2026-09-08
- **`/estado-e-economia/orcamento`** — Fiscalização de dotações orçamentárias, execução financeira, transferências federais (Transferegov) e indicadores macroeconômicos (BCB).
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `fichas/catalogo.json`: 7 registros (8 KB), medido em 2026-09-08
- **`/judiciario`** — Acompanhe quem ocupa cada tribunal, quem indicou cada ministro, quando vaga cada cadeira e como o Judiciário é fiscalizado.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/judiciario/contatos`** — Catálogo nacional de contatos do Judiciário: e-mail, telefone, endereço, titular e link do Balcão Virtual de varas, gabinetes e secretarias da Justiça Estadual, Federal e do Trabalho em MG e no Brasil.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08; `judiciario-unidades-contatos.json`: 990 registros (804 KB), medido em 2026-09-08
- **`/judiciario/correicoes-trabalhistas`** — A Corregedoria-Geral da Justiça do Trabalho, órgão do TST, correiciona o TRT da 3ª Região 
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/judiciario/defensoria`** — Título da página: Tem Defensoria na sua comarca? — Controle Popular · Judiciário
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08; `defensoria-mg-bundle.json`: objeto com 1 chaves; listas: COMARCAS_MG: 298 (65 KB), medido em 2026-09-08
- **`/judiciario/indicacoes`** — Toda indicação enviada pelo Presidente ao Senado para STF, STJ, TST e STM, com data, resultado e a cadeira que ela preenche.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/judiciario/indice`** — Navegue pelos dados do Poder Judiciario: tribunais, numeros, presidios, inspecoes e correicoes.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/judiciario/inspecoes`** — Transparência estrutural do sistema de justiça: 343 relatórios de inspeção da Corregedoria Nacional do CNJ sobre 33 tribunais e déficit de comarcas da Defensoria Pública.
  - Fonte(s): Biblioteca de Inspeções da Corregedoria Nacional de Justiça (Conselho Nacional de Justiça (CNJ), federal, cadência mensal, camada data-json)
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/judiciario/instituicoes`** — Um mapa de quem olha cada instituição de justiça por fora: varas, TJMG, TRT-3, STJ, TST, STF, presídios e Defensoria. A fiscalização externa do Judiciário brasileiro termina no segundo grau.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `judiciario-instituicoes-detalhe.json`: 91 registros (719 KB), medido em 2026-09-08; `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08; `inspecoes-cnj-bundle.json`: objeto com 5 chaves; listas: ACHADOS_TJMG: 157; PENDENCIAS_TJMG: 76; COBRANCAS_POR_INSPECAO: 5; ORGAOS_INSPECIONADOS: 33 (177 KB), medido em 2026-09-08
- **`/judiciario/instituicoes/[sigla]` (rota dinâmica)** — Título da página: Instituição não encontrada | Controle Popular
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `judiciario-instituicoes-detalhe.json`: 91 registros (719 KB), medido em 2026-09-08
- **`/judiciario/metodologia`** — Como cada número deste site é calculado: a regra da aposentadoria aos 75 anos, a origem de cada cadeira e o cálculo do poder de indicação — sem opinião escondida em número.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/judiciario/numeros`** — Série 2009–2025 do TJMG no Justiça em Números do CNJ: congestionamento, acervo pendente, casos novos por magistrado e tempo até a baixa (unidade não confirmada pelo CNJ). Inclui correção pública: este projeto já afirmou, errado, que esse dado não existia.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/judiciario/presidios`** — Título da página: Quem fiscaliza a prisão em Minas Gerais — Controle Popular · Judiciário
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08; `presidios-cniep-bundle.json`: objeto com 1 chaves; listas: ESTABELECIMENTOS_MG: 285 (58 KB), medido em 2026-09-08
- **`/judiciario/privacidade`** — O que este app coleta, por quê, e com que base legal — dado público de agente em função pública, sem CPF, filiação ou endereço.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/judiciario/recomendacoes`** — Catálogo transparente e em linguagem simples das determinações e recomendações emitidas pelo CNJ e CNMP em inspeções sobre tribunais e promotorias.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `judiciario/recomendacoes-cnj-cnmp.json`: objeto com 4 chaves; listas: itens: 10 (10 KB), medido em 2026-09-08
- **`/judiciario/sirenejud`** — Processos ambientais do Judiciário por UF, tribunal, classe processual e assunto, do SIRENEJud (CNJ): contagens, pendentes e série anual.
  - Fonte(s): SIRENEJud (Processos Ambientais do Judiciário) (Conselho Nacional de Justiça (CNJ) / CNMP, federal, cadência mensal, camada data-json)
  - Principais dados: `sirenejud-brasil.json`: objeto com 14 chaves; listas: ressalvas: 5; por_uf: 28; por_tribunal: 34; top_classes_br: 10 (6 KB), medido em 2026-09-08; `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/judiciario/sobre`** — Por que este app existe: mapear quem ocupa, quem indicou e quando vaga cada cadeira do Judiciário — o único Poder cujos membros ninguém elege.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/judiciario/tribunais`** — Composição legal dos tribunais superiores brasileiros: quantas cadeiras, por qual cota de origem, e quem indica.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/judiciario/tribunais/[sigla]` (rota dinâmica)** — ⚠️ Lacuna do gerador: a página não segue o padrão de comentário de cabeçalho nem declara título de metadata — não sei dizer pelo código o que ela mostra.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/judiciario/vagas`** — Quando cada ministro completa 75 anos e é obrigado a se aposentar, calculado a partir da data de nascimento — não uma estimativa.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/judiciario/varas`** — Catálogo e contatos das Varas Cíveis, Criminais, de Família, Juizados Especiais e Varas do Trabalho em Minas Gerais e no Brasil.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08

### ONSA (ambiental) (36 rotas)

- **`/ambiental`** — O Observatório Nacional Socioambiental: COPAM e licenciamento de Minas, barragens do país inteiro, normas federais, processos ambientais na Justiça, o Acordo do Rio Doce e a Vale.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `sirenejud-mg.json`: objeto com 16 chaves; listas: ressalvas: 5; top_classes_mg: 10; top_assuntos_mg: 10; municipios: 298 (166 KB), medido em 2026-09-08
- **`/ambiental/barragens`** — Título da página: Barragens em Minas Gerais — Controle Popular · Ambiental
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `barragens-sigbm.json`: objeto com 8 chaves; listas: barragens: 320 (92 KB), medido em 2026-09-08; `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/ambiental/barragens/descaracterizacao`** — Título da página: Barragens em descaracterização (MPMG) — Controle Popular · Ambiental
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/ambiental/barragens/municipio/[idIbge]` (rota dinâmica)** — ⚠️ Lacuna do gerador: a página não segue o padrão de comentário de cabeçalho nem declara título de metadata — não sei dizer pelo código o que ela mostra.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/ambiental/barragens/sigbm`** — Cadastro consolidado das barragens de mineração em Minas Gerais e no Brasil pela Agência Nacional de Mineração (ANM). Níveis de emergência 1–3, Dano Potencial Associado (DPA) e projetos de descaracterização.
  - Fonte(s): SIGBM — Sistema Integrado de Gestão de Barragens de Mineração (Agência Nacional de Mineração (ANM), federal, cadência diaria, camada data-json)
  - Principais dados: `barragens-sigbm.json`: objeto com 8 chaves; listas: barragens: 320 (92 KB), medido em 2026-09-08
- **`/ambiental/clima-risco`** — Painel de vulnerabilidade climática, população exposta em áreas de risco (BATER), monitoramento pluviométrico, queimadas e saneamento básico.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/ambiental/conselhos`** — Mapeamento de comitês de bacia hidrográfica, CODEMAs, conselhos de direitos humanos, saúde e conselhos tutelares com contatos, atas e canais de fiscalização cidadã.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/ambiental/convenios`** — Título da página: Convênios ambientais de Minas Gerais — Controle Popular · Ambiental
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/ambiental/copam`** — A pauta de cada reunião do Conselho Estadual de Política Ambiental de Minas Gerais, item a item, com o município que cada processo trata e o resultado da deliberação — antes e depois da decisão sair.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/ambiental/copam/municipio/[idIbge]` (rota dinâmica)** — ⚠️ Lacuna do gerador: a página não segue o padrão de comentário de cabeçalho nem declara título de metadata — não sei dizer pelo código o que ela mostra.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/ambiental/copam/reuniao/[idFonte]` (rota dinâmica)** — Título da página: Reunião do COPAM — Controle Popular · Ambiental
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/ambiental/crimes-socioambientais`** — Acervo integrado de documentos periciais, termos de ajustamento de conduta (TAC), relatórios de saúde da Fiocruz e planos comunitários das bacias do Rio Doce e Paraopeba.
  - Fonte(s): Biblioteca das Assessorias Técnicas Independentes (ATIs) (AEDAS, Associação Guaicuy, ADAI, NACAB, independente, cadência semanal, camada public-assets); Biblioteca unificada dos crimes socioambientais (Mariana e Brumadinho) (ATIs, órgãos federais, estaduais e instituições de justiça, independente, cadência semanal, camada public-assets); ATIs de Mariana — AEDAS na bacia do Rio Doce (AEDAS, independente, cadência semanal, camada public-assets); Radar de notícias dos crimes socioambientais (Imprensa e agregador Google Notícias, independente, cadência diaria, camada data-json); Fundo Brasil de Direitos Humanos — Programa Rio Doce e editais (Fundo Brasil de Direitos Humanos, independente, cadência anual, camada public-assets); MPMG — Procuradoria de Justiça de Meio Ambiente (Coerdoce) (Ministério Público de Minas Gerais (MPMG), estadual, cadência mensal, camada data-json); MPMG — Núcleo de Acompanhamento de Reparações por Desastres (NUCARD) (Ministério Público de Minas Gerais (MPMG), estadual, cadência mensal, camada data-json); MPF — Procuradoria-Geral da República (Grandes Casos) (Ministério Público Federal (MPF), federal, cadência semanal, camada data-json); DPU — Comitê Temático Rio Doce/Brumadinho (Defensoria Pública da União (DPU), federal, cadência semanal, camada data-json); DPMG — Defensoria Pública de Minas Gerais (Defensoria Pública de Minas Gerais (DPMG), estadual, cadência mensal, camada data-json); Quadrilátero Ferrífero — Mina Apolo, Operação Rejeito (SEMAD / FEAM / IEF / ICMBio / IBAMA / PF, federal, cadência semanal, camada data-json); Vale S.A. e Sigma Lithium — Documentos e Ações (Vale S.A. / Sigma Lithium Corporation / SEC / High Court / ANM, internacional, cadência mensal, camada data-json); Casos Nacionais de Crimes Socioambientais (MPF, STF, STJ, ANM, CGU, IBAMA, federal, cadência mensal, camada data-json); Ações Coletivas das Instituições de Justiça (MPF, MPMG, DPU, DPMG, MPES, MPBA, STF, STJ, federal, cadência semanal, camada data-json); SINESP VDE — Vítimas de Eventos Delituosos (Sistema Integrado de Informações de Segurança Pública (SINESP/SPCS), estadual, cadência mensal, camada data-json)
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/ambiental/decisoes`** — Título da página: Decisões de licenciamento ambiental — Controle Popular · Ambiental
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/ambiental/decisoes-lai`** — Título da página: Decisões de recurso de LAI (CGE-MG) — Controle Popular · Ambiental
  - Fonte(s): Decisões de Recursos de LAI da CGE-MG (Controladoria-Geral do Estado de Minas Gerais (CGE-MG), estadual, cadência mensal, camada data-json)
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/ambiental/direito-critico`** — Título da página: Legislação e precedentes por tema — Controle Popular · Ambiental
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/ambiental/direitos-humanos`** — Monitoramento de relatórios temáticos e de país da Comissão Interamericana (CIDH/OEA), Nações Unidas (ONU) e Conselho Nacional dos Direitos Humanos (CNDH) cruzados por território.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `relatorios-direitos-humanos.json`: 9 registros (12 KB), medido em 2026-09-08
- **`/ambiental/estudos`** — Todo estudo de impacto ambiental (EIA/RIMA) ligado a audiência pública em Minas Gerais, com o link que o Estado publicou para ele — e por que muitos já respondem 404.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/ambiental/ibama`** — Painel de licenciamento ambiental federal, autos de infração e julgamentos de penalidades aplicadas pelo IBAMA no estado de Minas Gerais.
  - Fonte(s): IBAMA — Licenciamento Federal, Autos de Infração e Julgamentos (Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis (IBAMA), federal, cadência semanal, camada data-json)
  - Principais dados: `ibama-mg.json`: objeto com 8 chaves; listas: licencas: 6; infracoes: 5 (5 KB), medido em 2026-09-08
- **`/ambiental/indice`** — Navegue pelo Observatório Nacional Socioambiental: COPAM, licenciamento, barragens, legislacao, patrimonio cultural, estudos, Mariana e a Vale.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/ambiental/judiciario`** — Processos ambientais do Judiciário por município de Minas Gerais: contagens, situação e tempo de tramitação, do SIRENEJud (CNJ).
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `sirenejud-mg.json`: objeto com 16 chaves; listas: ressalvas: 5; top_classes_mg: 10; top_assuntos_mg: 10; municipios: 298 (166 KB), medido em 2026-09-08; `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/ambiental/legislacao`** — Título da página: Legislação e precedentes por tema — Controle Popular · Ambiental
  - Fonte(s): Acervo Integrado de Legislação Ambiental Federal e Direitos Humanos (MMA / CNDH / Conama, federal, cadência mensal, camada banco)
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/ambiental/licenciamento`** — Todo empreendimento com licença ambiental deferida em Minas Gerais, por município, setor, modalidade e classe — do censo público da Semad (IDE-Sisema).
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/ambiental/licenciamento/municipio/[idIbge]` (rota dinâmica)** — ⚠️ Lacuna do gerador: a página não segue o padrão de comentário de cabeçalho nem declara título de metadata — não sei dizer pelo código o que ela mostra.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/ambiental/litigios-climaticos`** — Ações climáticas da base JUMA (PUC-Rio/LACLIMA), 322 mil processos ambientais do SIRENEJud (CNJ) e teses de jurisprudência do TJMG sobre barragens e direitos dos atingidos.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `juma-acoes-climaticas.json`: 9 registros (10 KB), medido em 2026-09-08; `sirenejud-mg.json`: objeto com 16 chaves; listas: ressalvas: 5; top_classes_mg: 10; top_assuntos_mg: 10; municipios: 298 (166 KB), medido em 2026-09-08
- **`/ambiental/mariana`** — Título da página: Acordo do Rio Doce (Mariana) — Execução em MG | Controle Popular
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `ckan-mg-mariana.json`: 532 registros (292 KB), medido em 2026-09-08; `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/ambiental/nossa-gente`** — Espaço de visibilidade para comunidades quilombolas, pescadores artesanais, geraizeiros e atingidos por barragens no Observatório Nacional Socioambiental.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/ambiental/nossas-serras`** — Acompanhamento cívico das cordilheiras, unidades de conservação, relevo e conflitos de mineração e preservação em Minas Gerais.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/ambiental/nossas-serras/[slug]` (rota dinâmica)** — Título da página: Serra não encontrada
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/ambiental/nossos`** — Coleção de lugares e territórios brasileiros sob a ótica do Observatório Nacional Socioambiental. Águas, relevo, cerrado e a nossa gente no centro da fiscalização cívica.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/ambiental/nossos-animais`** — Monitoramento cívico de espécies ameaçadas, corredores de fauna, atropelamentos e fiscalização no Observatório Nacional Socioambiental.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/ambiental/nossos-rios`** — Acompanhamento cívico das bacias hidrográficas, monitoramento de qualidade da água, barragens e pescadores de Minas Gerais e do Brasil.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/ambiental/nossos-rios/[slug]` (rota dinâmica)** — Título da página: Rio não encontrado
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/ambiental/nossos-territorios`** — Territórios tradicionais, vales, cerrados, quilombos e a função social da terra integrados à fiscalização ambiental do Controle Popular.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/ambiental/nossos-territorios/[slug]` (rota dinâmica)** — Título da página: Território não encontrado
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/ambiental/patrimonio-cultural`** — Os bens culturais materiais tombados pelo Estado de Minas Gerais — imóveis, conjuntos paisagísticos e centros históricos protegidos pelo IEPHA-MG, filtráveis por município e categoria.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/ambiental/tac`** — Título da página: Projetos de TAC ambiental — Controle Popular · Ambiental
  - Fonte(s): GTAC — Cadastro de TACs Ambientais de Minas Gerais (Secretaria de Estado de Meio Ambiente e Desenvolvimento Sustentável (SEMAD-MG), estadual, cadência mensal, camada data-json)
  - Principais dados: `tac-gtac-bundle.json`: objeto com 7 chaves; listas: TACS_GTAC: 2002; TAC_GTAC_POR_SITUACAO: 3; TAC_GTAC_POR_FASE: 9; TAC_GTAC_POR_UNIDADE: 10 (808 KB), medido em 2026-09-08; `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08

### Paraopeba (18 rotas)

- **`/paraopeba`** — Acompanhamento da reparação pelo rompimento da barragem da Vale em Brumadinho: clipping de notícias, linha do tempo do processo, quem atua na reparação e o auxílio emergencial pago mês a mês.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/paraopeba/analise`** — Os 16 eixos da síntese da auditoria AECOM cruzados com o que a perícia judicial da UFMG mediu e o que as Assessorias Técnicas Independentes publicaram sobre o mesmo assunto — com o que falta em cada eixo e o que nenhuma das três fontes ainda respondeu.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/paraopeba/auditoria`** — Título da página: Auditoria socioambiental — Paraopeba | Controle Popular
  - Fonte(s): Auditoria AJRI (AECOM / Brumadinho) (Comitê Pró-Brumadinho / AECOM, independente, cadência mensal, camada data-json)
  - Principais dados: `sintese-ajri-bundle.json`: objeto com 1 chaves (53 KB), medido em 2026-09-08; `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/paraopeba/auxilio`** — Acompanhamento mês a mês do Novo Auxílio Emergencial pago pela FGV às pessoas atingidas pelo rompimento da barragem da Vale em Brumadinho, com os números-resumo e a fonte de cada um.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/paraopeba/biblioteca`** — Publicações das assessorias técnicas independentes da bacia do Paraopeba e documentos oficiais do Acordo Judicial de Reparação (portal Pró-Brumadinho, Governo de MG) — com link para a fonte original de cada item.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/paraopeba/clipping`** — Título da página: Clipping — Paraopeba | Controle Popular
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/paraopeba/correlacao`** — Correlacao entre movimentos significativos de preco de VALE3 (B3) e SGML (NASDAQ) com noticias publicas sobre a Vale e o setor minerario.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `vale3-cotacoes.json`: objeto com 3 chaves; listas: cotacoes: 2894 (403 KB), medido em 2026-09-08; `noticias-vale.json`: objeto com 3 chaves; listas: noticias: 60 (38 KB), medido em 2026-09-08; `sgml-cotacoes.json`: objeto com 5 chaves; listas: cotacoes: 1168 (193 KB), medido em 2026-09-08; `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/paraopeba/documentos`** — Título da página: Documentos do processo — Paraopeba | Controle Popular
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/paraopeba/entenda`** — Título da página: Entenda o caso — Paraopeba | Controle Popular
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/paraopeba/execucao`** — Quanto do Acordo de Reparação de Brumadinho já virou projeto e quanto já foi pago em cada um dos 26 municípios da Bacia do Paraopeba, pela auditoria independente da FGV.
  - Fonte(s): Auditoria FGV — Projeto Rio Paraopeba (Anexos I.3 e I.4) (Fundação Getulio Vargas (FGV), independente, cadência semanal, camada data-json)
  - Principais dados: `execucao-fgv-bundle.json`: objeto com 4 chaves; listas: MUNICIPIOS_EXECUCAO_FGV: 26; PROJETOS_EXECUCAO_FGV: 450; PROJETOS_ESPECIAIS_FGV: 3; STATUS_PROJETOS_FGV: 455 (219 KB), medido em 2026-09-08; `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/paraopeba/indice`** — Navegue pelos dados da reparacao de Brumadinho: auxilio, execucao do acordo, documentos, pericias e linha do tempo.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/paraopeba/linha-do-tempo`** — Os marcos do processo de reparação pelo rompimento da barragem da Vale em Brumadinho, do rompimento de 25 de janeiro de 2019 à confirmação do pagamento de agosto de 2026.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/paraopeba/noticias`** — Varredura automática e diária de notícias e atos de autoridade sobre a bacia do Paraopeba e a reparação do rompimento da barragem em Brumadinho.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/paraopeba/noticias-vale`** — Painel de notícias recentes sobre a Vale, coletadas automaticamente de Google News, Agência Brasil, Radar Mineração e G1 Minas Gerais — com link para a fonte original em cada item.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `noticias-vale.json`: objeto com 3 chaves; listas: noticias: 60 (38 KB), medido em 2026-09-08; `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/paraopeba/pericia`** — O que a perícia da UFMG mediu sobre o rompimento da Barragem I: os 7 documentos de resultado, o acervo completo de 445 arquivos e a ligação com a auditoria independente do Acordo.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/paraopeba/quem-atua`** — Os 18 órgãos e organizações que atuam na reparação pelo rompimento da barragem da Vale em Brumadinho — do Judiciário às três assessorias técnicas independentes (ATIs) que atendem quem foi atingido.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/paraopeba/vale`** — O fechamento de VALE3 na B3, pregão a pregão, de 2015 a 2026 — com os rompimentos de Fundão (2015) e Brumadinho (2019) e o Acordo de reparação (2021) marcados na série. Preços brutos de pregão, sem ajuste.
  - Fonte(s): Observatório Vale S.A. (B3 Séries Históricas + CVM + SIGMINE/SIGBM) (B3 / CVM / ANM, federal, cadência diaria, camada data-json)
  - Principais dados: `vale3-cotacoes.json`: objeto com 3 chaves; listas: cotacoes: 2894 (403 KB), medido em 2026-09-08; `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/paraopeba/vale/documentos`** — ITRs, DFPs e formulários de referência que a Vale S.A. protocolou na Comissão de Valores Mobiliários entre 2015 e 2025, com link direto ao documento e ao arquivo em massa da fonte — dados abertos da CVM.
  - Fonte(s): Observatório Vale S.A. (B3 Séries Históricas + CVM + SIGMINE/SIGBM) (B3 / CVM / ANM, federal, cadência diaria, camada data-json)
  - Principais dados: `cvm-vale.json`: objeto com 15 chaves; listas: periodo_anos: 11; ressalvas: 3; falhas: 0; documentos: 55 (20 KB), medido em 2026-09-08; `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08

### Transversal (22 rotas)

- **`/`** — Título da página: Controle Popular — Observatório Nacional Socioambiental (ONSA)
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/alertas`** — Receba e planeje alertas automáticos no Telegram, E-mail e WhatsApp sobre contratos municipais, projetos de lei, convênios, clima e reparações.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/api`** — Os dados agregados do portal em JSON aberto, sem chave: catálogo, documentação interativa (Swagger UI) e spec OpenAPI.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/assistente`** — Diga para onde quer ir e o assistente leva você à página certa do portal: cidades, Congresso, Judiciário, ambiental, terras e Paraopeba. Funciona sem rede e sem modelo de linguagem.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/assistente-ia-lab`** — Prova de conceito de chatbot com RAG local sobre normas federais ambientais.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/biblioteca`** — Acervo unificado de documentos públicos, relatórios corporativos ESG, atas de órgãos de justiça dos 27 estados e produção acadêmica (artigos SciELO, teses de doutorado e dissertações) sobre Vale, Sigma Lithium, consulta prévia, barragens e transparência.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `biblioteca-unificada.json`: objeto com 12 chaves; listas: itens: 969 (1030 KB), medido em 2026-09-08
- **`/busca`** — Busque legislação por tema, palavra-chave e território em três frentes do Controle Popular: Cidades, Congresso e Judiciário.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/dados/comunicabr`** — O que o governo federal publica sobre a própria atuação em cada município de Minas Gerais, com a lacuna medida: quantos indicadores vieram sem valor, em quais temas, e em quantas cidades. Cada número cita o ministério que o declarou.
  - Fonte(s): ComunicaBR — Ações e Repasses do Governo Federal (Secretaria de Comunicação Social da Presidência (Secom), federal, cadência mensal, camada public-assets)
  - Principais dados: `comunicabr-31.json`: objeto com 9 chaves; listas: rotulos: 367; esqueletos: 1; municipios: 853; recusados: 0 (2216 KB), medido em 2026-09-08; `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/dados/comunicabr/[codigo]` (rota dinâmica)** — Título da página: Cidade não encontrada — Controle Popular
  - Fonte(s): ComunicaBR — Ações e Repasses do Governo Federal (Secretaria de Comunicação Social da Presidência (Secom), federal, cadência mensal, camada public-assets)
  - Principais dados: `comunicabr-31.json`: objeto com 9 chaves; listas: rotulos: 367; esqueletos: 1; municipios: 853; recusados: 0 (2216 KB), medido em 2026-09-08
- **`/dados/populares`** — O que mais se lê no portal: ranking de visualizações das páginas principais de Cidades, Congresso e Judiciário.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/historico`** —  Marcos do desenvolvimento do portal Controle Popular de transparência pública.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/imprensa`** — Material para jornalistas: o que é o portal, números-chave com fonte, o que o portal não é, e o canal de contato.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/indice`** — Todas as frentes, cidades e temas do Controle Popular num mapa só — dado público com fonte, organizado do seu jeito de procurar.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `novidades.json`: 15 registros (4 KB), medido em 2026-09-08
- **`/instituicoes`** — Catálogo unificado dos órgãos públicos do Brasil: Ministérios federais, Secretarias estaduais e municipais, Congresso, Assembleias, Câmaras, Tribunais, Ministério Público e Defensoria.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `instituicoes-todas-esferas.json`: 19 registros (91 KB), medido em 2026-09-08; `noticias-portal.json`: 18 registros (84 KB), medido em 2026-09-08
- **`/instituicoes/[sigla]` (rota dinâmica)** — Título da página: Instituição não encontrada | Controle Popular
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `instituicoes-todas-esferas.json`: 19 registros (91 KB), medido em 2026-09-08; `noticias-portal.json`: 18 registros (84 KB), medido em 2026-09-08
- **`/noticias`** — Acompanhamento analítico e descritivo de compras governamentais, orçamentos municipais, processos legislativos e dados socioambientais com fontes oficiais.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08; `noticias-portal.json`: 18 registros (84 KB), medido em 2026-09-08
- **`/noticias/[slug]` (rota dinâmica)** — Título da página: Publicação não encontrada | Controle Popular
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `noticias-portal.json`: 18 registros (84 KB), medido em 2026-09-08
- **`/notificacoes`** — ⚠️ Lacuna do gerador: a página não segue o padrão de comentário de cabeçalho nem declara título de metadata — não sei dizer pelo código o que ela mostra.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: ⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo
- **`/novidades`** — Ultimas atualizacoes do portal: novos dados, coletas e funcionalidades.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `novidades.json`: 15 registros (4 KB), medido em 2026-09-08
- **`/sobre`** — O que é o Controle Popular, como cada dado chega ao portal, a separação entre o que o modelo de linguagem extrai e o que o código calcula, e por que o portal está em revisão.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/tecnologia`** — Kit Guias do AppLivre (applivre.pages.dev), catálogo de software livre e ferramentas open source da Floresta de Apps para defesa de direitos, fiscalização cívica e uso soberano de IA.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08
- **`/termos`** — De onde vem cada dado publicado, com que base legal, sob qual licença, o que o portal mascara antes de publicar — e como pedir correção ou remoção se você aparece no conteúdo.
  - Fonte(s): nenhuma do registry aponta para esta rota
  - Principais dados: `edicoes.json`: objeto com 1 chaves; listas: edicoes: 0 (0 KB), medido em 2026-09-08

## Fontes registradas

42 fontes em `lib/fontes/registry.ts`, por frente e camada de armazenamento:

| Frente / camada | Fontes |
|---|---|
| ambiental / banco | 1 |
| ambiental / data-json | 15 |
| ambiental / public-assets | 3 |
| cidades / banco | 4 |
| cidades / data-json | 2 |
| cidades / public-assets | 1 |
| congresso / banco | 2 |
| congresso / data-json | 1 |
| empresas / data-json | 3 |
| judiciario / ao-vivo | 1 |
| judiciario / data-json | 2 |
| paraopeba / data-json | 2 |
| paraopeba / public-assets | 2 |
| terras / public-assets | 3 |

## Eixos e subfrentes

- **Direitos em Movimento** — 6 subfrentes: Trabalho e Renda, Saúde Pública, Educação, Segurança Alimentar, Moradia e Habitação, Acesso à Justiça e Denúncias
- **Terra e Territórios** — 6 subfrentes: 199 Cidades Estratégicas, Meio Ambiente (ONSA), Terras Indígenas e Quilombolas, Nossas Serras, Nossos Rios e Bacias, Biomas e Biodiversidade
- **Estado e Economia** — 6 subfrentes: Judiciário e Justiça, Congresso e Legislação, Executivo e Políticas, Empresas e Mercado, Orçamento Público, Transparência e Controle Social

## Lacunas declaradas

1. **17 rotas** não revelam pelo código o que mostram (sem comentário de cabeçalho nem metadata title). Listadas acima com ⚠️.
2. **100 rotas** não referenciam JSON versionado direto nem a um nível de módulo lib. Muitas leem do Postgres (camada `banco`) — e esta máquina não alcança o banco (Neon em HTTP 402 até nova ordem; quem mede é a máquina `home-pc`). Números dessas rotas ficam fora deste relatório de propósito: não invento.
3. **174 rotas** não têm nenhuma fonte do registry apontando para elas. Podem ser páginas institucionais (sobre, privacidade, índices) ou registro faltando no registry.
4. A mediação de JSONs por página cobre **um nível** de módulo lib. Dado que entra por dois níveis de indireção aparece como lacuna — é limite do gerador, não do dado.
5. Rotas dinâmicas (`[municipio]`, `[id]`, `[slug]`) contam uma vez cada, como gabarito. A quantidade de instâncias geradas no build não é medida aqui.

## Método

- Rotas: varredura recursiva de `apps/web/app/` por `page.tsx`/`page.din.tsx`, feita em 2026-09-08.
- O que mostra: primeiro parágrafo do comentário de cabeçalho da página no padrão `` `/rota` — descrição ``; na falta, título de `metadata`; na falta, lacuna declarada.
- Fontes: casamento da rota com `rotaPortal` de cada entrada de `REGISTRY_FONTES`.
- Principais dados: JSONs citados pela página (`data/*.json`) ou por módulos lib que ela importa (`carregarJsonEtl("*.json")`), com contagem de registros/tamanho medida na geração (2026-09-08).
- Números sem medição não entram no relatório. Onde o gerador não soube, ele diz.
