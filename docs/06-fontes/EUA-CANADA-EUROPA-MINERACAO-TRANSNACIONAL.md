<!--
  Módulo de Documentação: Mapeamento de Fontes Transnacionais (EUA, Canadá e Europa)
  Papel no Portal: Guia canônico para integração de capitais, sedes da TSX/NYSE, tribunais e devida diligência no Globo 3D Terras
  Fontes Oficiais: SEC EDGAR, EPA ECHO, USGS MRDS (EUA); TMX Group, OSC, ECCC NPRI (Canadá); UK High Court, Rechtbank Rotterdam, BAFA LkSG (Europa)
  Decisões Técnicas: Georreferenciamento WGS84 integrado sob as camadas `sedes-capitais-mineracao-eua`, `sedes-mineracao-canada` e `sedes-litigios-portos-europa`
-->

# Redes Transnacionais de Mineração e Capitais: EUA, Canadá e Europa

> **Tipo:** FONTE
> **Domínio:** global
> **Última medição:** 2026-09-30
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [FONTES.md](FONTES.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** Estados Unidos, Canadá, Europa, Reino Unido, TSX, SEC, EPA, High Court, Roterdã, portos EUDR, Globo 3D, WGS84

## Sumário

- [1. Visão Geral das Redes Transnacionais](#1-visão-geral-das-redes-transnacionais)
- [2. Fontes Oficiais dos Estados Unidos](#2-fontes-oficiais-dos-estados-unidos)
- [3. Fontes Oficiais do Canadá](#3-fontes-oficiais-do-canadá)
- [4. Fontes Oficiais da Europa e Reino Unido](#4-fontes-oficiais-da-europa-e-reino-unido)
- [5. Integração com o Globo 3D Terras](#5-integração-com-o-globo-3d-terras)
- [6. Padrão das Seis Qualidades e Privacidade](#6-padrão-das-seis-qualidades-e-privacidade)

---

## 1. Visão Geral das Redes Transnacionais

A cadeia global da mineração conecta os territórios do Sul Global aos centros financeiros, judiciais e regulatórios do Norte Global:
1. **Canadá (Financiamento e Operação):** Concentra a maior bolsa de mineração do mundo (TSX) e abriga as sedes de empresas com operações em Minas Gerais, Pará e Bahia (Kinross, Lundin, Sigma Lithium, Belo Sun, Equinox).
2. **Estados Unidos (Capitais Institucionais e Fiscalização):** Concentra os maiores fundos acionários da mineração brasileira (BlackRock, Vanguard, State Street) e grandes operadoras com registros na SEC, EPA e USGS.
3. **Europa e Reino Unido (Litígios e Devida Diligência):** Sede de tribunais que julgam a responsabilidade civil de matrizes estrangeiras por tragédias no Brasil (High Court de Londres - BHP Mariana; Rechtbank Rotterdam - Braskem Maceió) e portos sujeitos ao Regulamento Antidesmatamento da UE (EUDR).

---

## 2. Fontes Oficiais dos Estados Unidos

- **Camada no Globo:** `sedes-capitais-mineracao-eua` (29 pontos georreferenciados WGS84).
- **Órgãos Primários:**
  - Securities and Exchange Commission (SEC EDGAR): Formulários 10-K, 20-F e participações societárias de fundos em Wall Street.
  - Environmental Protection Agency (EPA ECHO): Histórico público de conformidade ambiental, infrações e multas.
  - United States Geological Survey (USGS MRDS / USMIN): Depósitos minerais de lítio e cobre.
  - Mine Safety and Health Administration (MSHA): Segurança operacional e fiscalização de minas.

---

## 3. Fontes Oficiais do Canadá

- **Camada no Globo:** `sedes-mineracao-canada` (24 pontos georreferenciados WGS84).
- **Órgãos Primários:**
  - TMX Group / Toronto Stock Exchange (TSX / TSX Venture): Relatórios anuais e prospectos técnicos (NI 43-101).
  - Ontario Securities Commission (OSC) & SEDAR+: Registros de companhias abertas canadenses.
  - Environment and Climate Change Canada (NPRI): Inventário Nacional de Liberação de Poluentes.
  - Natural Resources Canada (NRCan / ESTMA): Declaração pública de pagamentos feitos a governos estrangeiros por mineradoras.

---

## 4. Fontes Oficiais da Europa e Reino Unido

- **Camada no Globo:** `sedes-litigios-portos-europa` (23 pontos georreferenciados WGS84).
- **Órgãos Primários:**
  - High Court of Justice (Londres, UK): Tribunal de Tecnologia e Construção (TCC) — Ação de Mariana BHP (£36 bi).
  - Rechtbank Rotterdam (Países Baixos): Julgamento de responsabilidade da Braskem pelo afundamento do solo em Maceió.
  - Tribunal Judiciaire de Paris (França): Casos da Lei do Dever de Vigilância (*Loi sur le devoir de vigilance*).
  - BAFA Alemanha: Fiscalização da Lei de Devida Diligência na Cadeia de Suprimentos (LkSG).
  - Portos de Roterdã e Antuérpia: Terminais de recepção aduaneira e fiscalização sob o EUDR (Regulamento 2023/1115).

---

## 5. Integração com o Globo 3D Terras

As três novas camadas estão registradas no `LAYER_REGISTRY` e em `CAMADAS` em `apps/web/public/terras/globo/js/config.js`:
- `sedes-capitais-mineracao-eua` (azul celeste `0x38bdf8`, 29 feições).
- `sedes-mineracao-canada` (vermelho `0xef4444`, 24 feições).
- `sedes-litigios-portos-europa` (índigo `0x6366f1`, 23 feições).

---

## 6. Padrão das Seis Qualidades e Privacidade

- **Zero CPFs e dados pessoais:** Somente pessoas jurídicas, sedes empresariais, portos e tribunais públicos.
- **Transparência direta:** Todos os pontos possuem links para os órgãos reguladores e registros oficiais.
- **Exportação e tabelas compactas:** Datasets compactados no padrão esqueleto + dicionários para consumo leve.
