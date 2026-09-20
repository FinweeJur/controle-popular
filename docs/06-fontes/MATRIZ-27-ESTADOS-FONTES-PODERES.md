# Matriz Nacional dos 27 Estados — Poderes, Instâncias, APIs e Sociedade Civil

> **Tipo:** FONTE
> **Domínio:** global
> **Última medição:** 2026-09-19
> **Leitura estimada:** longa (> 15 min)
> **Relacionados:** [FONTES.md](FONTES.md), [PRODUTO.md](../01-produto/PRODUTO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** 27 estados, executivo, legislativo, judiciario, apis, dados abertos, transparencia, sociedade civil

## Sumário

- [Propósito](#propósito)
- [Estrutura dos 3 Poderes e Sociedade Civil](#estrutura-dos-3-poderes-e-sociedade-civil)
- [Matriz Nacional por Estado](#matriz-nacional-por-estado)
- [Região Sudeste](#região-sudeste)
- [Região Sul](#região-sul)
- [Região Nordeste](#região-nordeste)
- [Região Centro-Oeste](#região-centro-oeste)
- [Região Norte](#região-norte)
- [APIs Centrais de Integração Contínua](#apis-centrais-de-integração-contínua)
- [Validação e Proteção de Dados](#validação-e-proteção-de-dados)

## Propósito

Mapeamento exaustivo e auditável das fontes oficiais de dados públicos, portais de transparência, diários oficiais, sistemas informatizados e entidades de controle social para todas as **27 unidades federativas do Brasil** (26 estados e Distrito Federal).

Este documento subsidia os painéis estaduais do portal Controle Popular (`/governo/[uf]`, `/governo/[uf]/legislativo` e `/congresso/[uf]`), garantindo hiperlinks oficiais verificados em cada registro publicado.

---

## Estrutura dos 3 Poderes e Sociedade Civil

Cada estado é monitorado a partir de 4 eixos estruturantes:

1. **Poder Executivo Estadual:**
   - Portal Geral do Governo do Estado
   - Portal da Transparência Ativa
   - Catálogo de Dados Abertos (CKAN / GeoNode)
   - Diário Oficial do Estado (DOE / Imprensa Oficial)
   - Portal de Licitações e Contratos (integrado ao PNCP)
   - Órgão Ambiental Estadual (licenciamento, autos de infração e outorgas hídricas)

2. **Poder Legislativo Estadual:**
   - Assembleia Legislativa Estadual (ALE) / Câmara Legislativa do DF (CLDF)
   - Portal da Transparência da ALE (folha de pagamento, cota parlamentar e contratos)
   - API de Dados Abertos Legislativos (projetos de lei, votações, presenças e comissões)
   - Diário Oficial do Poder Legislativo

3. **Poder Judiciário e Controle Externo:**
   - Tribunal de Justiça Estadual (TJ): processo judicial eletrônico (PJe) e API pública do DataJud (CNJ)
   - Ministério Público Estadual (MPE): inquéritos civis, recomendações e TACs
   - Defensoria Pública Estadual (DPE): núcleos de direitos humanos e assistência coletiva
   - Tribunal de Contas do Estado (TCE): auditorias de contas, convênios e certidões

4. **Sociedade Civil e Controle Social:**
   - Observatório Social do Brasil (OSB) — Polos municipais e estaduais
   - Ordem dos Advogados do Brasil (OAB) — Comissões de Direitos Humanos e Direito Ambiental
   - Conselhos Estaduais Paritários: Meio Ambiente (COPAM/CONSEMA), Saúde (CES) e Educação (CEE)
   - Fóruns Estaduais de ONGs e Entidades da Sociedade Civil

---

## Matriz Nacional por Estado

A tabela a seguir consolida as 27 UFs com suas siglas institucionais e links canônicos:

| UF | Nome | Poder Executivo | Assembleia Legislativa | Judiciário (TJ) | Controle (MP / TCE) | Sociedade Civil |
|---|---|---|---|---|---|---|
| **AC** | Acre | [transparencia.ac.gov.br](https://transparencia.ac.gov.br) | [ALEAC](https://www.al.ac.leg.br) | [TJAC](https://www.tjac.jus.br) | MPAC · TCE-AC | OSB Rio Branco · OAB-AC |
| **AL** | Alagoas | [transparencia.al.gov.br](https://transparencia.al.gov.br) | [ALEAL](https://www.al.al.leg.br) | [TJAL](https://www.tjal.jus.br) | MPAL · TCE-AL | OSB Maceió · OAB-AL |
| **AP** | Amapá | [transparencia.ap.gov.br](https://transparencia.ap.gov.br) | [ALAP](https://www.al.ap.leg.br) | [TJAP](https://www.tjap.jus.br) | MPAP · TCE-AP | OSB Macapá · OAB-AP |
| **AM** | Amazonas | [transparencia.am.gov.br](https://transparencia.am.gov.br) | [ALEAM](https://www.aleam.gov.br) | [TJAM](https://www.tjam.jus.br) | MPAM · TCE-AM | OSB Manaus · OAB-AM |
| **BA** | Bahia | [transparencia.ba.gov.br](https://transparencia.ba.gov.br) | [ALBA](https://www.al.ba.gov.br) | [TJBA](https://www.tjba.jus.br) | MPBA · TCE-BA | OSB Salvador · OAB-BA |
| **CE** | Ceará | [transparencia.ce.gov.br](https://transparencia.ce.gov.br) | [ALECE](https://www.al.ce.gov.br) | [TJCE](https://www.tjce.jus.br) | MPCE · TCE-CE | OSB Fortaleza · OAB-CE |
| **DF** | Distrito Federal | [transparencia.df.gov.br](https://transparencia.df.gov.br) | [CLDF](https://www.cl.df.gov.br) | [TJDFT](https://www.tjdft.jus.br) | MPDFT · TCDF | OSB Brasília · OAB-DF |
| **ES** | Espírito Santo | [transparencia.es.gov.br](https://transparencia.es.gov.br) | [ALES](https://www.al.es.gov.br) | [TJES](https://www.tjes.jus.br) | MPES · TCE-ES | OSB Vitória · OAB-ES |
| **GO** | Goiás | [transparencia.go.gov.br](https://transparencia.go.gov.br) | [ALEGO](https://portal.al.go.leg.br) | [TJGO](https://www.tjgo.jus.br) | MPGO · TCE-GO | OSB Goiânia · OAB-GO |
| **MA** | Maranhão | [transparencia.ma.gov.br](https://transparencia.ma.gov.br) | [ALEMA](https://www.al.ma.leg.br) | [TJMA](https://www.tjma.jus.br) | MPMA · TCE-MA | OSB São Luís · OAB-MA |
| **MT** | Mato Grosso | [transparencia.mt.gov.br](https://transparencia.mt.gov.br) | [ALMT](https://www.al.mt.gov.br) | [TJMT](https://www.tjmt.jus.br) | MPMT · TCE-MT | OSB Cuiabá · OAB-MT |
| **MS** | Mato Grosso do Sul | [transparencia.ms.gov.br](https://transparencia.ms.gov.br) | [ALEMS](https://www.al.ms.leg.br) | [TJMS](https://www.tjms.jus.br) | MPMS · TCE-MS | OSB Campo Grande · OAB-MS |
| **MG** | Minas Gerais | [transparencia.mg.gov.br](https://transparencia.mg.gov.br) | [ALMG](https://www.almg.gov.br) | [TJMG](https://www.tjmg.jus.br) | MPMG · TCE-MG | OSB Belo Horizonte · OAB-MG |
| **PA** | Pará | [transparencia.pa.gov.br](https://transparencia.pa.gov.br) | [ALEPA](https://www.alepa.pa.gov.br) | [TJPA](https://www.tjpa.jus.br) | MPPA · TCE-PA | OSB Belém · OAB-PA |
| **PB** | Paraíba | [transparencia.pb.gov.br](https://transparencia.pb.gov.br) | [ALPB](https://www.al.pb.leg.br) | [TJPB](https://www.tjpb.jus.br) | MPPB · TCE-PB | OSB João Pessoa · OAB-PB |
| **PR** | Paraná | [transparencia.pr.gov.br](https://transparencia.pr.gov.br) | [ALPR](https://www.assembleia.pr.leg.br) | [TJPR](https://www.tjpr.jus.br) | MPPR · TCE-PR | OSB Curitiba · OAB-PR |
| **PE** | Pernambuco | [transparencia.pe.gov.br](https://transparencia.pe.gov.br) | [ALEPE](https://www.alepe.pe.gov.br) | [TJPE](https://www.tjpe.jus.br) | MPPE · TCE-PE | OSB Recife · OAB-PE |
| **PI** | Piauí | [transparencia.pi.gov.br](https://transparencia.pi.gov.br) | [ALEPI](https://www.alepi.pi.gov.br) | [TJPI](https://www.tjpi.jus.br) | MPPI · TCE-PI | OSB Teresina · OAB-PI |
| **RJ** | Rio de Janeiro | [transparencia.rj.gov.br](https://transparencia.rj.gov.br) | [ALERJ](https://www.alerj.rj.gov.br) | [TJRJ](https://www.tjrj.jus.br) | MPRJ · TCE-RJ | OSB Rio de Janeiro · OAB-RJ |
| **RN** | Rio Grande do Norte | [transparencia.rn.gov.br](https://transparencia.rn.gov.br) | [ALRN](https://www.al.rn.leg.br) | [TJRN](https://www.tjrn.jus.br) | MPRN · TCE-RN | OSB Natal · OAB-RN |
| **RS** | Rio Grande do Sul | [transparencia.rs.gov.br](https://transparencia.rs.gov.br) | [ALRS](https://ww4.al.rs.gov.br) | [TJRS](https://www.tjrs.jus.br) | MPRS · TCE-RS | OSB Porto Alegre · OAB-RS |
| **RO** | Rondônia | [transparencia.ro.gov.br](https://transparencia.ro.gov.br) | [ALERO](https://www.al.ro.leg.br) | [TJRO](https://www.tjro.jus.br) | MPRO · TCE-RO | OSB Porto Velho · OAB-RO |
| **RR** | Roraima | [transparencia.rr.gov.br](https://transparencia.rr.gov.br) | [ALE-RR](https://al.rr.leg.br) | [TJRR](https://www.tjrr.jus.br) | MPRR · TCE-RR | OSB Boa Vista · OAB-RR |
| **SC** | Santa Catarina | [transparencia.sc.gov.br](https://transparencia.sc.gov.br) | [ALESC](https://www.alesc.sc.gov.br) | [TJSC](https://www.tjsc.jus.br) | MPSC · TCE-SC | OSB Florianópolis · OAB-SC |
| **SP** | São Paulo | [transparencia.sp.gov.br](https://transparencia.sp.gov.br) | [ALESP](https://www.al.sp.gov.br) | [TJSP](https://www.tjsp.jus.br) | MPSP · TCE-SP | OSB São Paulo · OAB-SP |
| **SE** | Sergipe | [transparencia.se.gov.br](https://transparencia.se.gov.br) | [ALESE](https://al.se.leg.br) | [TJSE](https://www.tjse.jus.br) | MPSE · TCE-SE | OSB Aracaju · OAB-SE |
| **TO** | Tocantins | [transparencia.to.gov.br](https://transparencia.to.gov.br) | [ALETO](https://www.al.to.leg.br) | [TJTO](https://www.tjto.jus.br) | MPTO · TCE-TO | OSB Palmas · OAB-TO |

---

## Região Sudeste

### Minas Gerais (MG)
- **Executivo:** Portal da Transparência (`transparencia.mg.gov.br`), Dados Abertos CKAN (`dados.mg.gov.br`), Diário Oficial (`jornalminasgerais.mg.gov.br`).
- **Legislativo:** ALMG (`almg.gov.br`), API Dados Abertos (`dadosabertos.almg.gov.br/api/v1`), 77 cadeiras.
- **Judiciário:** TJMG (`tjmg.jus.br`), MPMG (`mpmg.mp.br`), DPMG (`defensoria.mg.def.br`), TCE-MG (`tce.mg.gov.br`).
- **Sociedade Civil:** OSB Belo Horizonte, OAB-MG, COPAM-MG (Conselho Estadual de Política Ambiental).

### São Paulo (SP)
- **Executivo:** Portal da Transparência (`transparencia.sp.gov.br`), Diário Oficial (`doe.sp.gov.br`), CETESB (`cetesb.sp.gov.br`).
- **Legislativo:** Alesp (`al.sp.gov.br`), 94 cadeiras, Portal de Transparência Legislativa.
- **Judiciário:** TJSP (`tjsp.jus.br`), MPSP (`mpsp.mp.br`), DPSP (`defensoria.sp.def.br`), TCE-SP (`tcesp.sp.gov.br`).
- **Sociedade Civil:** OSB São Paulo, OAB-SP, CONSEMA-SP.

### Rio de Janeiro (RJ)
- **Executivo:** Portal da Transparência (`transparencia.rj.gov.br`), INEA (`inea.rj.gov.br`), SIGA Compras.
- **Legislativo:** Alerj (`alerj.rj.gov.br`), 70 cadeiras, Transparência Alerj.
- **Judiciário:** TJRJ (`tjrj.jus.br`), MPRJ (`mprj.mp.br`), DPRJ (`defensoria.rj.def.br`), TCE-RJ (`tcerj.tc.br`).
- **Sociedade Civil:** OSB Rio de Janeiro, OAB-RJ, CECA-RJ.

### Espírito Santo (ES)
- **Executivo:** Portal da Transparência (`transparencia.es.gov.br`), IEMA (`iema.es.gov.br`), Compras-ES.
- **Legislativo:** ALES (`al.es.gov.br`), 30 cadeiras, Transparência ALES.
- **Judiciário:** TJES (`tjes.jus.br`), MPES (`mpes.mp.br`), DPES (`defensoria.es.def.br`), TCE-ES (`tcees.tc.br`).
- **Sociedade Civil:** OSB Vitória, OAB-ES, CEAM-ES.

---

## Região Sul

### Paraná (PR)
- **Executivo:** Portal da Transparência (`transparencia.pr.gov.br`), Geoserviços IAT (`geoservicos.iat.pr.gov.br`).
- **Legislativo:** ALPR (`assembleia.pr.leg.br`), 54 cadeiras, Transparência ALPR.
- **Judiciário:** TJPR (`tjpr.jus.br`), MPPR (`mppr.mp.br`), DPE-PR (`defensoriapublica.pr.def.br`), TCE-PR (`tce.pr.gov.br`).
- **Sociedade Civil:** OSB Curitiba, OAB-PR, CEMA-PR.

### Rio Grande do Sul (RS)
- **Executivo:** Portal da Transparência (`transparencia.rs.gov.br`), FEPAM (`fepam.rs.gov.br`), SIOUT Águas.
- **Legislativo:** ALRS (`al.rs.gov.br`), 55 cadeiras, Transparência ALRS.
- **Judiciário:** TJRS (`tjrs.jus.br`), MPRS (`mprs.mp.br`), DPE-RS (`defensoria.rs.def.br`), TCE-RS (`tce.rs.gov.br`).
- **Sociedade Civil:** OSB Porto Alegre, OAB-RS, CONSEMA-RS.

### Santa Catarina (SC)
- **Executivo:** Portal da Transparência (`transparencia.sc.gov.br`), IMA-SC (`ima.sc.gov.br`).
- **Legislativo:** Alesc (`alesc.sc.gov.br`), 40 cadeiras, Transparência Alesc.
- **Judiciário:** TJSC (`tjsc.jus.br`), MPSC (`mpsc.mp.br`), DPE-SC (`defensoria.sc.def.br`), TCE-SC (`tcesc.tc.br`).
- **Sociedade Civil:** OSB Florianópolis, OAB-SC, CONSEMA-SC.

---

## Região Nordeste

Mapeamento cobre os 9 estados da região:
- **Bahia (BA):** ALBA (63 cadeiras), INEMA/SEIA, TJBA, MPBA, DPE-BA, TCE-BA, CEPRAM-BA.
- **Ceará (CE):** ALECE (46 cadeiras), SEMACE, TJCE, MPCE, DPCE, TCE-CE, COEMA-CE.
- **Pernambuco (PE):** Alepe (49 cadeiras), CPRH/SISAM, TJPE, MPPE, DPE-PE, TCE-PE, CONDEPE.
- **Maranhão (MA):** Alema (42 cadeiras), SEMA/SIGLA, TJMA, MPMA, DPE-MA, TCE-MA, CONSEMA-MA.
- **Paraíba (PB):** ALPB (36 cadeiras), SUDEMA/SIGMA, TJPB, MPPB, DPE-PB, TCE-PB, COPAM-PB.
- **Rio Grande do Norte (RN):** ALRN (24 cadeiras), IDEMA/SIGA, TJRN, MPRN, DPE-RN, TCE-RN, CONSEMA-RN.
- **Alagoas (AL):** ALEAL (27 cadeiras), IMA/Cerberus, TJAL, MPAL, DPE-AL, TCE-AL, CEPRAM-AL.
- **Piauí (PI):** Alepi (30 cadeiras), SEMARH/SIGA, TJPI, MPPI, DPE-PI, TCE-PI, CONSEMA-PI.
- **Sergipe (SE):** Alese (24 cadeiras), ADEMA, TJSE, MPSE, DPE-SE, TCE-SE, CONSEMA-SE.

---

## Região Centro-Oeste

- **Distrito Federal (DF):** CLDF (24 cadeiras), IBRAM/Harpia, TJDFT, MPDFT, DPDF, TCDF, CONAM-DF.
- **Goiás (GO):** Alego (41 cadeiras), SEMAD/GeoNode, TJGO, MPGO, DPE-GO, TCE-GO, CEMAM-GO.
- **Mato Grosso (MT):** ALMT (24 cadeiras), SEMA/Geoportal CSV, TJMT, MPMT, DPMT, TCE-MT, CONSEMA-MT.
- **Mato Grosso do Sul (MS):** Alems (24 cadeiras), IMASUL/SIRIEMA, TJMS, MPMS, DPMS, TCE-MS, CONSEMA-MS.

---

## Região Norte

Mapeamento cobre os 7 estados amazônicos:
- **Pará (PA):** Alepa (41 cadeiras), SEMAS/SIMLAM, TJPA, MPPA, DPE-PA, TCE-PA, COEMA-PA.
- **Amazonas (AM):** Aleam (24 cadeiras), IPAAM/Sislam, TJAM, MPAM, DPE-AM, TCE-AM, CEMA-AM.
- **Rondônia (RO):** Alero (24 cadeiras), SEDAM/SOLAR, TJRO, MPRO, DPE-RO, TCE-RO, COREH.
- **Tocantins (TO):** Aleto (24 cadeiras), NATURATINS, TJTO, MPTO, DPE-TO, TCE-TO, COEMA-TO.
- **Acre (AC):** Aleac (24 cadeiras), IMAC, TJAC, MPAC, DPE-AC, TCE-AC, CEMACT.
- **Amapá (AP):** ALAP (24 cadeiras), SEMA-AP, TJAP, MPAP, DPE-AP, TCE-AP, COEMA-AP.
- **Roraima (RR):** ALE-RR (24 cadeiras), FEMARH, TJRR, MPRR, DPE-RR, TCE-RR, CONSEMA-RR.

---

## APIs Centrais de Integração Contínua

| API / Serviço | Abrangência | Tipo | Autenticação | Endpoint Padrão |
|---|---|---|---|---|
| **DataJud (CNJ)** | 27 TJs Estaduais | REST / Elasticsearch | API Key Pública | `api-publica.datajud.cnj.jus.br` |
| **PNCP (Governo Federal)** | Contratos e Editais dos 27 Estados | REST API | Aberta | `pncp.gov.br/api/consulta` |
| **ALMG Dados Abertos** | Poder Legislativo de MG | REST / JSON | Aberta | `dadosabertos.almg.gov.br/api/v1` |
| **CKAN MG** | Executivo Estadual MG | CKAN API v3 | Aberta | `dados.mg.gov.br/api/3/action` |
| **GeoNode Goiás** | Meio Ambiente GO | WFS / OGC | Aberta | `siga.meioambiente.go.gov.br/geoserver/wfs` |
| **Geoportal MT** | Licenciamento e Autos MT | GeoServices / CSV | Aberta | `geoportal.sema.mt.gov.br` |
| **IAT Paraná** | Outorgas e Bacias PR | WFS / Geoserviços | Aberta | `geoservicos.iat.pr.gov.br/geoserver` |

---

## Validação e Proteção de Dados

Todo coletor ou consulta às fontes listadas deve obedecer às regras inegociáveis de [AGENTS.md](/AGENTS.md):
1. **Verificação de CPF por mod-11:** Nenhuma ingestão de CPF de pessoa física no repositório.
2. **Identificação transparente do agente:** User-Agent `ControlePopular/1.0`.
3. **Pausa de cortesia:** 1 a 2 segundos entre requisições.
4. **Verificação de conteúdo:** Conferência do corpo de resposta antes de persistir dados.
