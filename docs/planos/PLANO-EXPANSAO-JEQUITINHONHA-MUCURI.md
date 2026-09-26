# Plano de expansão — Cidades do Vale do Jequitinhonha e do Mucuri

> **Tipo:** PLANO
> **Domínio:** cidades
> **Última medição:** 2026-09-26
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [PRODUTO.md](../01-produto/PRODUTO.md), [PLANO-EXPANSAO-PNCP-199-CIDADES.md](PLANO-EXPANSAO-PNCP-199-CIDADES.md), [AGENTS.md](/AGENTS.md), [ESTADO.md](../02-estado/ESTADO.md), [FONTES.md](../06-fontes/FONTES.md)
> **Palavras-chave:** jequitinhonha, mucuri, etl, pncp, cidades, qualidade da informacao, fontes, chatbot, 6 regras, litio

## Sumário

- [1. Propósito](#1-propósito)
- [2. Contexto socioambiental e relevância](#2-contexto-socioambiental-e-relevância)
- [3. As 6 regras de qualidade da informação](#3-as-6-regras-de-qualidade-da-informação)
- [4. Rol de municípios por vale](#4-rol-de-municípios-por-vale)
- [5. Estratégia de ETL e pipeline de ingestão](#5-estratégia-de-etl-e-pipeline-de-ingestão)
- [6. Arquitetura das páginas e componentes](#6-arquitetura-das-páginas-e-componentes)
- [7. Integração com o chatbot Seu Nonô](#7-integração-com-o-chatbot-seu-nonô)
- [8. Cronograma e fila de execução](#8-cronograma-e-fila-de-execução)

---

## 1. Propósito

Definir a metodologia, a arquitetura de dados e o cronograma de expansão do portal Controle Popular para todos os municípios do **Vale do Jequitinhonha** e do **Vale do Mucuri**, em Minas Gerais.

Esta fase teve início após a conclusão do lote prioritário das 30 grandes cidades delegadas pelo proprietário e concluiu 100% da extração de dados brutos de todos os 82 municípios.

---

## 2. Contexto socioambiental e relevância

Os Vales do Jequitinhonha e Mucuri concentram realidades de alta vulnerabilidade social aliadas a transformações territoriais aceleradas:
1. **Corrida do Lítio (Lithium Valley):** Araçuaí, Itinga e Coronel Murta tornaram-se o epicentro da mineração de lítio no Brasil, com bilionários investimentos privados e profunda pressão sobre recursos hídricos e comunidades tradicionais.
2. **Povos e Comunidades Tradicionais:** Territórios quilombolas históricos (Berilo, Chapada do Norte, Minas Novas), terras indígenas Maxakali (Santa Helena de Minas, Bertópolis, Ladainha) e comunidades geraizeiras e vazanteiras.
3. **Desertificação e Recursos Hídricos:** Semiárido mineiro sob severo estresse hídrico na bacia do Rio Jequitinhonha e Mucuri.
4. **Dependência de Repasses Públicos:** Municípios com baixíssimo IDH-M onde a transparência de contratos municipais, emendas parlamentares e compras do PNCP é instrumento de defesa da cidadania.

---

## 3. As 6 regras de qualidade da informação

Toda página municipal e tabela gerada para os municípios do Jequitinhonha e Mucuri deverá cumprir rigorosamente as seis qualidades exigidas:

| Regra | Requisito técnico no portal |
|---|---|
| **1. Fonte linkável específica** | Todo registro publicado (contrato, licitação, ato) possui hiperlink auditável direto para o sistema de origem oficial (PNCP, SICAR, Diário Oficial, TCE-MG). Proibido link solto para página inicial genérica. Citação ABNT (Autor, Data). |
| **2. Buscável** | Campo de busca em tempo real (`input type="search"`) por texto completo, cobrindo objeto, razão social do fornecedor, CNPJ, número de processo e gestor responsável. |
| **3. Filtrável** | Filtros multifacetados por ano, modalidade de contratação, faixa de valor, temas prioritários e status de execução. Filtro que devolve vazio é proibido. |
| **4. Microresumo cidadão** | Síntese curta, direta e em linguagem acessível (frases curtas até 13 palavras, sem juridiquês), explicando o que foi contratado, por qual valor e a destinação social. |
| **5. Chatbot com contexto** | O assistente Seu Nonô (Alceu Dispor) recebe o contexto estruturado da cidade específica (orçamento, contratos do PNCP, indicadores de saúde/educação) para responder perguntas dos moradores via web e Telegram. |
| **6. Classificável e com Tags** | Tags semânticas temáticas (Saúde, Educação, Infraestrutura, Mineração/Lítio, Água/Seca, Assistência Social) e ordenação dinâmica por qualquer coluna da tabela. |

---

## 4. Rol de municípios por vale

### 4.1. Vale do Jequitinhonha (55 municípios)

- **Alto Jequitinhonha:** Diamantina (3121605), Couto de Magalhães de Minas (3120102), Felício dos Santos (3125408), Gouveia (3127602), Presidente Kubitschek (3153303), São Gonçalo do Rio Preto (3162577), Senador Modestino Gonçalves (3166107), Carbonita (3113107), Itamarandiba (3132503), Veredinha (3171156), Capelinha (3112307), Angelândia (3102852), Aricanduva (3104452).
- **Médio Jequitinhonha (Polo do Lítio):** Araçuaí (3103405), Coronel Murta (3119500), Berilo (3106507), Chapada do Norte (3115904), Francisco Badaró (3126505), Itinga (3134004), Jenipapo de Minas (3134905), José Gonçalves de Minas (3135357), Medina (3141407), Ponto dos Volantes (3152131), Virgem da Lapa (3171602), Minas Novas (3141803), Turmalina (3169705), Leme do Prado (3138353), Pedra Azul (3148709), Cachoeira de Pajeú (3109808), Comercinho (3117207).
- **Baixo Jequitinhonha:** Almenara (3101706), Bandeira (3105301), Divisópolis (3122454), Felisburgo (3125507), Jacinto (3134509), Jequitinhonha (3135803), Joaíma (3136009), Jordânia (3136405), Mata Verde (3140854), Monte Formoso (3143155), Palmópolis (3146703), Rio do Prado (3155100), Rubim (3156801), Salto da Divisa (3157106), Santa Maria do Salto (3158104), Santo Antônio do Jacinto (3159003).

### 4.2. Vale do Mucuri (27 municípios)

- **Polo Regional:** Teófilo Otoni (3168608).
- **Demais municípios:** Águas Formosas (3100906), Ataléia (3104700), Campanário (3110905), Caraí (3113206), Carlos Chagas (3113701), Catuji (3115607), Franciscópolis (3126752), Frei Gaspar (3126802), Fronteira dos Vales (3127057), Itaipé (3132404), Itambacuri (3132701), Ladainha (3137502), Machacalis (3138908), Malacacheta (3139203), Nanuque (3144302), Nova Módica (3144906), Novo Cruzeiro (3145309), Novo Oriente de Minas (3145358), Ouro Verde de Minas (3146208), Pavão (3148402), Pescador (3149509), Poté (3152909), Santa Helena de Minas (3157700), São José do Divino (3163609), Serra dos Aimorés (3166701), Umburatiba (3170307).

---

## 5. Estratégia de ETL e pipeline de ingestão

1. **Sequência por cidade:**
   - `python -m etl.pncp.orgaos --id-municipio <IBGE> --gravar`
   - `python -m etl.pncp.contratos --id-municipio <IBGE>`
   - `python -m etl.pncp.licitacoes --id-municipio <IBGE>`
2. **Orquestrador dedicado:** `etl/betim/scripts/orquestrador_pncp_vales.py` baseado no modelo de 1 comando por vez, com checkpoints atômicos com PID e retentativas em caso de 429 ou instabilidade da API.
3. **Resguardo de rate limit:** Pausa inter-páginas de 1,5 s a 2 s para respeitar a infraestrutura pública do PNCP.

---

## 6. Arquitetura das páginas e componentes

Cada município receberá sua rota canônica em `apps/web/app/[municipio]/`:
- **Página de Contratos:** Tabela dinâmica com os 5 requisitos, microresumos e links canônicos do PNCP.
- **Página de Licitações:** Histórico categorizado por modalidade (pregão, dispensa, inexigibilidade).
- **Página de Gestão & Indicadores:** Cruzamento com dados de saúde, educação (Censo Escolar/INEP) e repasses.
- **Destaque Territorial dos Vales:** Seção com o mapa do Vale do Jequitinhonha e Mucuri, dados de mineração e comunidades tradicionais.

---

## 7. Integração com o chatbot Seu Nonô

O assistente local do portal (`/api/chatbot`) e a ponte do Telegram serão providos com os dados consolidados:
- Contexto sobre o valor total contratado pelo município.
- Principais fornecedores e empresas contratadas no ano corrente.
- Alertas de dispensa de licitação e compras emergenciais.
- Histórico de obras e investimentos sociais.

---

## 8. Cronograma e fila de execução

| Fase | Ação | Status |
|---|---|---|
| **Fase 1** | Conclusão das 30 grandes cidades do lote delegado | ✅ Concluída (30/30 no banco) |
| **Fase 2** | Seed dos municípios faltantes do Jequitinhonha e Mucuri no banco | ✅ Concluída (82/82 semeados) |
| **Fase 3** | Execução sequencial do ETL PNCP para os 55 municípios do Jequitinhonha | ✅ Concluída (55/55 extraídos) |
| **Fase 4** | Execução sequencial do ETL PNCP para os 27 municípios do Mucuri | ✅ Concluída (27/27 extraídos) |
| **Fase 5** | Geração e ativação das páginas públicas com as 6 regras de qualidade | 🚧 Próxima etapa ativa |

