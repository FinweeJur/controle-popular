# Relatório de Mapeamento dos 27 Estados — Licenciamento e Recursos Hídricos

> **Tipo:** FONTE
> **Domínio:** ambiental
> **Última medição:** 2026-09-17
> **Leitura estimada:** longa (> 15 min)
> **Relacionados:** [F0-discovery.md](dominios/ambiental/F0-discovery.md), [PLANO-EXPANSAO-AMBIENTAL-ONDA-2.md](planos/PLANO-EXPANSAO-AMBIENTAL-ONDA-2.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** mapeamento, 27 estados, licenciamento, outorgas, infracoes, orgaos estaduais, geoserver, wfs, transparencia, onda 2

## Sumário

- [Propósito](#propósito)
- [Metodologia de Sondagem](#metodologia-de-sondagem)
- [Matriz Nacional dos 27 Estados](#matriz-nacional-dos-27-estados)
- [Detalhamento por Região](#detalhamento-por-região)
- [Classificação de Viabilidade Técnica](#classificação-de-viabilidade-técnica)
- [Riscos Transversais e Proteção de Dados](#riscos-transversais-e-proteção-de-dados)
- [Decisões registradas](#decisões-registradas)

## Propósito

Documentar de forma exaustiva os órgãos ambientais, sistemas informatizados, URLs oficiais, formatos de exportação, conselhos estaduais, competência de outorga de recursos hídricos e divulgação de infrações para todas as 27 unidades federativas do Brasil.

Este relatório orienta o desenvolvimento dos coletores da Onda 2 do portal Controle Popular, definindo quais fontes estão prontas para automação e quais demandam pedidos formais via Lei de Acesso à Informação (LAI).

---

## Metodologia de Sondagem

A sondagem foi executada seguindo as diretrizes operacionais do projeto:
1. **User-Agent transparente:** Identificação clara em cada requisição (`ControlePopular/1.0 (+contato@controlepopular.com.br; dado publico governamental)`).
2. **Pausa de cortesia:** Intervalo mínimo de 2 segundos entre consultas para não onerar os servidores públicos.
3. **Verificação de `robots.txt`:** Consulta aos arquivos de diretrizes de rastreamento dos portais estaduais.
4. **Validação de conteúdo:** Não confiar em código HTTP 200 isolado — inspeção dos corpos de resposta (prevenção contra respostas vazias ou telas de erro mascaradas).

---

## Matriz Nacional dos 27 Estados

A tabela a seguir consolida as 27 unidades federativas:

| UF | Órgão (sigla) | Sistema Principal | URL Consulta Pública | Formato | Conselho | Outorga Delegada? | Infrações Públicas? | Status Onda 2 |
|---|---|---|---|---|---|---|---|---|
| **AC** | IMAC | Sistema próprio | `imac.ac.gov.br/consulta-de-processos` | HTML / Presencial | CEMACT | Sim (Divisão Outorga IMAC) | Não confirmada | Grupo C (Lacuna) |
| **AL** | IMA-AL | Portal IMA+ | `www.consulta.ima.al.gov.br` | HTML / PDF digital | CEPRAM-AL | Sim (IMA / SRH-AL) | Sim (Cerberus v3) | Grupo B (Coletor) |
| **AM** | IPAAM | Sislam v3.0 | `sistemas.ipaam.am.gov.br/portal-ipaam` | HTML (Login restrito) | CEMA-AM | Sim (IPAAM) | Parcial (Interno) | Grupo C (Lacuna) |
| **AP** | SEMA-AP | Portal de Serviços | `sema.portal.ap.gov.br` | HTML estático / PDF | COEMA-AP | Sim (SEMA-AP) | Não confirmada | Grupo C (Lacuna) |
| **BA** | INEMA-BA | SEIA | `sol.inema.ba.gov.br/servicos/consultaProcesso` | HTML / DOE-BA | CEPRAM-BA | Sim (INEMA) | Parcial (Por processo) | Pioneiro (Ativo) |
| **CE** | SEMACE | Natuur Online | `servicos.semace.ce.gov.br/consultaProcesso` | HTML aberto | COEMA-CE | Não (SRH-CE próprio) | Sim (Autos/processos) | Grupo A (Coletor) |
| **DF** | IBRAM | HARPIA / SEI-DF | `ibram.df.gov.br/relacao-de-licencas` | HTML / Tabelas / PDF | CONAM-DF | Não (ADASA) | Sim (Autos julgados) | Grupo B (Coletor) |
| **ES** | IEMA-ES | Processo Digital | `iema.es.gov.br/consultas` | HTML (Por processo) | CEAM-ES | Não (AGERH) | Não confirmada | Grupo C (Lacuna) |
| **GO** | SEMAD-GO | SGA / SIGA GeoNode | `siga.meioambiente.go.gov.br/catalogue` | WFS / GeoNode / HTML | CEMAM-GO | Sim (SEMAD-GO) | Parcial | Pioneiro (Ativo) |
| **MA** | SEMA-MA | SIGLA / Guará | `sigla.sema.ma.gov.br/sigla` | HTML / DOEMA / PDF | CONSEMA-MA | Sim (SIGLA) | Sim (Desde 09/2024) | Pioneiro (Ativo) |
| **MG** | SEMAD / FEAM / IGAM | SISEMA / Grade IGAM | `sistemas.meioambiente.mg.gov.br` | WFS / HTML aberto | COPAM-MG | Sim (IGAM) | Sim (CAP) | Pioneiro (Ativo) |
| **MS** | IMASUL | SIRIEMA / PIN | `portal-transparencia.imasul.ms.gov.br/home` | Repositório GIS / HTML | CONSEMA-MS | Sim (IMASUL) | Sim (Autos/Embargos) | Grupo A (Coletor) |
| **MT** | SEMA-MT | SIGA / Geoportal | `geoportal.sema.mt.gov.br` | CSV / SHP / WFS | CONSEMA-MT | Sim (SIGA Hídrico) | Sim (CSV/SHP Geoportal) | Pioneiro (Ativo) |
| **PA** | SEMAS-PA | SIMLAM | `monitoramento.semas.pa.gov.br/simlam` | HTML aberto (ASP.NET) | COEMA-PA | Sim (SIGERH-PA) | Sim (Autos/Infrações) | Pioneiro (Ativo) |
| **PB** | SUDEMA-PB | SIGSUDEMA / SIGMA | `sudema.pb.gov.br` | HTML / Deliberações | COPAM-PB | Não (AESA-PB) | Não confirmada | Grupo B (Coletor) |
| **PE** | CPRH | SISAM / Transparência | `transparencia.pe.gov.br/gestao-ambiental` | HTML / Listas abertas | CONDEPE | Sim (CPRH) | Não confirmada | Grupo B (Coletor) |
| **PI** | SEMAR-PI | SIGA-PI | `semarh.pi.gov.br/licencas/concedidas` | HTML tabelas abertas | CONSEMA-PI | Sim (SIGA-PI) | Não confirmada | Grupo A (Coletor) |
| **PR** | IAT-PR | SGA / SIGARH | `iat.pr.gov.br/Pagina/Consultar-licenciamentos` | WFS / Geoserviços / PDF | CEMA-PR | Sim (IAT / SIGARH) | Não confirmada | Grupo A (Coletor) |
| **RJ** | INEA-RJ | SELCA / Portal Lic. | `portallicenciamento.inea.rj.gov.br` | SPA / REST API | CECA-RJ | Sim (INEA / SELCA) | Parcial (Por processo) | Grupo B (Coletor) |
| **RN** | IDEMA-RN | SIGA-RN | `idema.rn.gov.br` | HTML / Relatórios | CONSEMA-RN | Sim (IDEMA) | Não confirmada | Grupo B (Coletor) |
| **RO** | SEDAM-RO | SIGLAM / SOLAR | `sedam.ro.gov.br/area-usuario?service=siglam` | HTML / Atos públicos | SEDAM | Sim (COREH / SEDAM) | Não confirmada | Grupo B (Coletor) |
| **RR** | FEMARH-RR | Licencia Já | `licenciaja.femarh.rr.gov.br` | HTML (Login) | CONSEMA-RR | Sim (Divisão Outorga) | Não confirmada | Grupo C (Lacuna) |
| **RS** | FEPAM-RS / SEMA | SOL / Transparência | `fepam.rs.gov.br/dados-transparencia` | Shapefile / CSV / HTML | CONSEMA-RS | Sim (SIOUT / SEMA) | Sim (Shapefile Autos) | Grupo A (Coletor) |
| **SC** | IMA-SC | SINFATWEB | `consultas.ima.sc.gov.br` | HTML / Geoserviços | CONSEMA-SC | Sim (IMA-SC) | Não confirmada | Grupo B (Coletor) |
| **SE** | ADEMA-SE | Portal Ambiental | `licenciamento.adema.se.gov.br` | HTML aberto (Lista atos) | CONSEMA-SE | Não (SEMAC-SE) | Não confirmada | Grupo A (Coletor) |
| **SP** | CETESB / SpÁguas | e-CETESB / SILIS | `sistemasinter02.cetesb.sp.gov.br` | HTML por município | CONSEMA-SP | Não (DAEE / SpÁguas) | Parcial (Por número) | Grupo B (Coletor) |
| **TO** | NATURATINS | Simplifica Verde / SICAM| `sinat.naturatins.to.gov.br` | HTML / DOE-TO | COEMA-TO | Sim (Naturatins) | Não confirmada | Grupo C (Lacuna) |

---

## Detalhamento por Região

### 1. Região Sul (PR, SC, RS)
- **Paraná:** Destaque para os geoserviços da Divisão de Recursos Hídricos (`geoservicos.iat.pr.gov.br`), disponibilizando camadas WFS de outorgas com altíssima qualidade geoespacial. Licenciamento geral emitido em extratos mensais em PDF.
- **Rio Grande do Sul:** O portal da FEPAM disponibiliza download aberto em formato Shapefile dos autos de infração ambiental e embargos, além de base de outorgas físicas no sistema SIOUT.
- **Santa Catarina:** O sistema SINFATWEB centraliza consultas de licenças e portarias, regido pela Resolução CONSEMA 250/2024.

### 2. Região Sudeste (MG, SP, RJ, ES)
- **Minas Gerais:** Já coberto no portal com a grade de outorgas do IGAM (55.729 registros) e base CLASSICAM/FEAM.
- **São Paulo:** A CETESB disponibiliza consulta pública por município no e-CETESB. As outorgas hídricas são geridas pela SpÁguas (antigo DAEE) no sistema de outorga eletrônica.
- **Rio de Janeiro:** O INEA opera o SELCA sob arquitetura SPA (Single Page Application). Os dados são consumidos por chamadas REST internas, viabilizando extração estruturada.
- **Espírito Santo:** O IEMA exige número de processo para consulta pública de terceiros, representando barreira técnica para coleta em massa automatizada.

### 3. Região Centro-Oeste (MT, MS, GO, DF)
- **Mato Grosso:** O Geoportal da SEMA-MT é referência nacional em transparência ambiental, permitindo download direto em CSV e Shapefile de licenças, autos e embargos.
- **Mato Grosso do Sul:** O PIN (Portal de Informações Notáveis) do IMASUL e o SIRIEMA disponibilizam repositório georreferenciado e consulta pública. **Atenção:** a tela expõe documento de pessoa física, exigindo sanitização imediata.
- **Goiás:** SEMAD-GO disponibiliza camadas abertas via WFS no catálogo GeoNode do SIGA (já coletado no portal).
- **Distrito Federal:** Brasília Ambiental (IBRAM) publica relações periódicas de licenças emitidas e página pública de autos de infração julgados.

### 4. Região Nordeste (BA, MA, CE, PI, PE, PB, RN, AL, SE)
- **Bahia e Maranhão:** Já possuem coletores pioneiros no portal integrados aos diários oficiais (DOE-BA e DOEMA via Elasticsearch).
- **Piauí:** O estado mais aberto da região. O SIGA-PI publica listas abertas e diretas em HTML de licenças concedidas e outorgas requeridas.
- **Sergipe:** A ADEMA disponibiliza página aberta com a listagem de todas as licenças emitidas e assinadas digitalmente (serviço 4109 do governo estadual).
- **Ceará:** O Natuur Online da SEMACE possui busca pública aberta de processos e autos de fiscalização.
- **Pernambuco:** A CPRH disponibiliza dados no Portal da Transparência de Pernambuco e no sistema SISAM.
- **Paraíba, Rio Grande do Norte e Alagoas:** Possuem portais com relatórios e documentos digitais (SIGSUDEMA, SIGA-RN e IMA+).

### 5. Região Norte (PA, AM, TO, AC, AP, RO, RR)
- **Pará:** Já pioneiro no portal via raspagem do SIMLAM-PA (114 mil registros históricos).
- **Rondônia:** A SEDAM publica atos no sistema SIGLAM/SOLAR com alto volume de licenças simplificadas (Lei 3.686/2015).
- **Amazonas, Tocantins, Acre, Amapá e Roraima:** Apresentam barreiras de login exclusivo de empreendedores, consultas sem formulário aberto ou instabilidades de infraestrutura (Grupo C).

---

## Classificação de Viabilidade Técnica

1. **Grupo Pioneiros (6 estados):** MG, MT, BA, PA, MA, GO (coletores funcionais já em produção).
2. **Grupo A — Alta Viabilidade (6 estados):** PR, RS, PI, SE, MS, CE (dados abertos, WFS, downloads diretos ou tabelas abertas).
3. **Grupo B — Média Viabilidade (9 estados):** PE, DF, SP, SC, RJ, PB, RN, AL, RO (consultas web abertas, APIs internas ou portais de transparência).
4. **Grupo C — Baixa Viabilidade / Alta Fricção (6 estados):** AM, TO, AC, AP, RR, ES (sem busca aberta de terceiros, exigência de certificado/login ou chave estrita de processo).

---

## Riscos Transversais e Proteção de Dados

1. **Vazamento de CPF em telas de consulta (LGPD):**
   - Portais como SIRIEMA (MS), SIMLAM (PA), Natuur (CE), SISAM (PE) e ADEMA (SE) exibem documentos de proprietários e requerentes.
   - **Regra obrigatória:** Todo dado ingerido é sanitizado no coletor e submetido à auditoria estrita do `checar-dado-pessoal-em-dado.py`. CPFs são redigidos imediatamente; apenas CNPJs completos (14 dígitos) são mantidos.

2. **WAF e Bloqueios de Rede (HTTP 403 / 429):**
   - Pausa mínima de 2 a 5 segundos por requisição.
   - Respeito integral aos limites declarados em `robots.txt`.
   - Validação minuciosa de corpo de resposta em fluxos chunked (GeoServer/WFS) para barrar falsos sucessos.

3. **Restrições de Memória e Bundle (Cloudflare Workers):**
   - Amostras no repositório são truncadas em 500 registros para evitar inflação do payload e respeitar o teto de 3 MiB gzip.

---

## Decisões registradas

- **D1 (2026-09-17):** Abertura de canal LAI recomendada para os 6 estados do Grupo C (AM, TO, AC, AP, RR, ES) para obtenção da base histórica em lote sem depender de scrapers frágeis.
- **D2 (2026-09-17):** Priorização dos 15 estados dos Grupos A e B para a implementação dos novos coletores da Onda 2.
