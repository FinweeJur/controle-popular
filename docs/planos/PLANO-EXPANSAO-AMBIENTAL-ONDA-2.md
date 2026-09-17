# Plano de Implementação — Expansão da Coleção Ambiental Onda 2

> **Tipo:** PLANO
> **Domínio:** ambiental
> **Última medição:** 2026-09-17
> **Leitura estimada:** média (10–15 min)
> **Relacionados:** [HANDOFF-ONDA2-AMBIENTAL.md](../HANDOFF-ONDA2-AMBIENTAL.md), [F0-discovery.md](../dominios/ambiental/F0-discovery.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** ambiental, licencas, outorgas, onda 2, coletores, 27 estados, igam, ibama, ana, orquestracao, dado pessoal

## Sumário

- [Propósito](#propósito)
- [Diagnóstico e Estado Atual](#diagnóstico-e-estado-atual)
- [Metas e Critérios de Sucesso](#metas-e-critérios-de-sucesso)
- [Mapeamento e Priorização dos 21 Estados](#mapeamento-e-priorização-dos-21-estados)
- [Arquitetura dos Coletores](#arquitetura-dos-coletores)
- [Integração no Feed Unificado](#integração-no-feed-unificado)
- [Integração no Orquestrador](#integração-no-orquestrador)
- [Cronograma de Execução em 5 Fases](#cronograma-de-execução-em-5-fases)
- [Plano de Verificação e Segurança](#plano-de-verificação-e-segurança)
- [Decisões registradas](#decisões-registradas)

## Propósito

Estruturar a expansão nacional do acervo ambiental do portal Controle Popular (Onda 2), ampliando a cobertura dos 6 estados pioneiros para abranger os 27 estados brasileiros, priorizando fontes com dados abertos e viabilidade técnica imediata.

---

## Diagnóstico e Estado Atual

Hoje o portal publica licenças, outorgas e autos em `/ambiental/licencas` a partir de uma amostra inicial:

1. **6 estados pioneiros coletados (amostras truncadas no repositório):**
   - **MG:** `coletar-igam-outorgas.py` (500 / 55.729 registros).
   - **MT:** `coletar-sema-mt-licencas.py` (500 / 17.083 registros).
   - **BA:** `coletar-inema-ba-licencas.py` (71 / ~6.360 registros).
   - **PA:** `coletar-semas-pa-licencas.py` (141 / 114.038 registros).
   - **MA:** `coletar-sema-ma-licencas.py` (498 / ~2.681 registros).
   - **GO:** `coletar-semad-go-licencas.py` (500 / 3.745 registros).

2. **2 bases de abrangência nacional:**
   - **IBAMA:** `coletar-ibama-licencas.py` (500 / 14.155) e `coletar-ibama-autos.py` (3.000 / 11.554).
   - **ANA:** `coletar-ana-outorgas.py` (15.000 / 751.324).

3. **Pendências da Onda 1:**
   - O coletor do IGAM (MG) não foi incluído no orquestrador `scripts/rotina-ambiental.mts`.
   - As regionais do IGAM (URGA) não estão normalizadas para o vocabulário oficial de bacias hidrográficas da ANA.
   - 21 estados da federação ainda não possuem coletores nem dados integrados.

---

## Metas e Critérios de Sucesso

| Meta | Indicador | Alvo |
|---|---|---|
| **Pesquisa completa** | Estados documentados em `docs/relatorio-mapeamento-27-estados.md` | 27 / 27 estados (100%) |
| **Novos coletores** | Scripts funcionais criados para os 21 restantes | ≥ 15 estados (≥ 70%) |
| **Amostras no feed** | Estados adicionais integrados em `REGISTROS_LICENCAS` | ≥ 15 estados |
| **Orquestrador ativo** | Coletores agendados em `rotina-ambiental.mts` | IGAM + ≥ 5 novos estados |
| **Qualidade de código** | Checagem de tipos sem erros | `npx tsc --noEmit` exit 0 |
| **Segurança e LGPD** | Auditoria estrita de dado pessoal | `checar-dado-pessoal-em-dado.py` exit 0 |

---

## Mapeamento e Priorização dos 21 Estados

A pesquisa e sondagem dividiu os 21 estados em 3 grupos conforme viabilidade técnica e fricção de coleta:

### Grupo A — Alta Viabilidade (Prioridade 1: 6 estados)

Fontes com dados estruturados diretos, geoserviços abertos ou tabelas públicas sem barreira de autenticação:

1. **Paraná (PR) — IAT-PR:**
   - *Sistema:* SGA / SIGARH.
   - *Formato:* Geoserviços WFS/Shapefile abertos da Divisão de Recursos Hídricos (CRH) e extratos mensais.
   - *Script:* `scripts/coletar-iat-pr-licencas.py`.
2. **Rio Grande do Sul (RS) — FEPAM-RS / SEMA-RS:**
   - *Sistema:* Portal de Dados Abertos e Transparência FEPAM.
   - *Formato:* Shapefile/CSV de Autos de Infração e cadastro SIOUT de recursos hídricos.
   - *Script:* `scripts/coletar-fepam-rs-licencas.py`.
3. **Piauí (PI) — SEMAR-PI:**
   - *Sistema:* SIGA-PI.
   - *Formato:* Tabelas HTML públicas de licenças concedidas e outorgas requeridas (mais aberto do Nordeste).
   - *Script:* `scripts/coletar-semar-pi-licencas.py`.
4. **Sergipe (SE) — ADEMA-SE:**
   - *Sistema:* Portal Ambiental ADEMA.
   - *Formato:* Relação pública de licenças ambientais assinadas/emitidas (Serviço 4109 do governo estadual).
   - *Script:* `scripts/coletar-adema-se-licencas.py`.
5. **Mato Grosso do Sul (MS) — IMASUL:**
   - *Sistema:* PIN (Portal de Informações Notáveis) e SIRIEMA.
   - *Formato:* Repositório georreferenciado e consulta pública.
   - *Atenção:* A tela pública exibe coluna de documento; sanitização de CPF obrigatória.
   - *Script:* `scripts/coletar-imasul-ms-licencas.py`.
6. **Ceará (CE) — SEMACE:**
   - *Sistema:* Natuur Online.
   - *Formato:* Consulta pública aberta de processos de licenciamento e autos de fiscalização.
   - *Script:* `scripts/coletar-semace-ce-licencas.py`.

### Grupo B — Média Viabilidade (Prioridade 2: 9 estados)

Portais institucionais com consulta pública por formulário ou API interna mapeável:

7. **Pernambuco (PE) — CPRH:**
   - *Sistema:* Portal da Transparência PE (Gestão Ambiental) e SISAM.
   - *Script:* `scripts/coletar-cprh-pe-licencas.py`.
8. **Distrito Federal (DF) — Brasília Ambiental (IBRAM):**
   - *Sistema:* Relações públicas de licenças e página de autos de infração julgados.
   - *Script:* `scripts/coletar-ibram-df-licencas.py`.
9. **São Paulo (SP) — CETESB / SpÁguas:**
   - *Sistema:* e-CETESB consulta pública e portal SpÁguas (outorga DAEE).
   - *Script:* `scripts/coletar-cetesb-sp-licencas.py`.
10. **Santa Catarina (SC) — IMA-SC:**
    - *Sistema:* SINFATWEB (consulta pública de processos/portarias) e geoserviços.
    - *Script:* `scripts/coletar-ima-sc-licencas.py`.
11. **Rio de Janeiro (RJ) — INEA-RJ:**
    - *Sistema:* SELCA (Portal do Licenciamento) via endpoints REST da SPA.
    - *Script:* `scripts/coletar-inea-rj-licencas.py`.
12. **Paraíba (PB) — SUDEMA-PB:**
    - *Sistema:* SIGSUDEMA e deliberações do COPAM-PB.
    - *Script:* `scripts/coletar-sudema-pb-licencas.py`.
13. **Rio Grande do Norte (RN) — IDEMA-RN:**
    - *Sistema:* SIGA-RN (serviços e relatórios de atos deferidos).
    - *Script:* `scripts/coletar-idema-rn-licencas.py`.
14. **Alagoas (AL) — IMA-AL:**
    - *Sistema:* Portal IMA+ e consulta de licenças digitais.
    - *Script:* `scripts/coletar-ima-al-licencas.py`.
15. **Rondônia (RO) — SEDAM-RO:**
    - *Sistema:* SIGLAM / SOLAR.
    - *Script:* `scripts/coletar-sedam-ro-licencas.py`.

*Total dos Grupos A + B: 15 estados (meta de 70% atingida).*

### Grupo C — Baixa Viabilidade / Alta Fricção (Documentados como Lacuna: 6 estados)

Estados com portais fechados, exigência de login com certificado, chave obrigatória ou DNS inativo:

- **Amazonas (AM) — IPAAM:** Sistema Sislam v3.0 restrito a login do empreendedor.
- **Tocantins (TO) — NATURATINS:** Simplifica Verde sem buscador aberto unificado de terceiros.
- **Acre (AC) — IMAC:** Página de consulta sem formulário público de pesquisa livre.
- **Amapá (AP) — SEMA-AP:** Sem módulo público de busca de processos.
- **Roraima (RR) — FEMARH:** Licencia Já exige autenticação; instabilidade no DNS público.
- **Espírito Santo (ES) — IEMA-ES:** Consulta exige número exato de processo; sem varredura em lote sem LAI.

Para esses 6 estados, o documento `relatorio-mapeamento-27-estados.md` detalhará a situação oficial, o risco de acesso e o canal formal de Acesso à Informação.

---

## Arquitetura dos Coletores

Cada novo coletor segue o padrão estrito de conformidade do projeto:

```
scripts/coletar-{sigla-sistema}-{sigla-uf}.py
```

### 1. Cabeçalho obrigatório
- Identificação do órgão, sistema e estado.
- URL oficial e endpoints utilizados.
- Registro da decisão sobre `robots.txt`.
- Pausa mínima entre requisições: ≥ 2s (≥ 5s em sistemas legados ou ASP.NET ViewState).
- User-Agent transparente: `ControlePopular/1.0 (+controlepopular.com.br; contato@controlepopular.com.br; dado publico governamental)`.

### 2. Resiliência e Checkpoint
- Checkpoints de paginação gravados em `scripts/.cache/{sigla-uf}/`.
- Validação profunda do corpo da resposta (nunca confiar apenas no código HTTP 200).
- Tratamento de falhas com tolerância e mensagens legíveis.

### 3. Sanitização de Dados Pessoais (LGPD)
- Varredura por expressões regulares em todo campo de texto.
- Eliminação automática de CPFs reais (verificação algorítmica mod-11).
- Preservação exclusiva de CNPJs válidos (14 dígitos).
- Flag `--scan-cpf` integrada para disparar `scripts/checar-dado-pessoal-em-dado.py`.

### 4. Padrão do JSON emitido
- Local de saída: `apps/web/data/{sigla-uf}-licencas.json`.
- Estrutura padrão:
  ```json
  {
    "gerado_em": "2026-09-17T00:00:00Z",
    "fonte": "https://...",
    "truncado": true,
    "total": 500,
    "ressalva_editorial": "Texto da ressalva...",
    "linhas": []
  }
  ```
- Amostra padrão: 500 registros para o repositório (`--limit 500`).
- Parâmetro `--limit 0` para extração integral agendada na máquina de coleta.

---

## Integração no Feed Unificado

Em `apps/web/lib/ambiental/licencas-unificada.ts`:

1. **Importação estática** dos 15 novos arquivos JSON.
2. **Função mapper dedicada** para cada fonte, convertendo campos heterogêneos para a interface única `LinhaLicencaUnificada`:
   - `orgao`: Nome amigável do órgão e UF (ex.: `"IAT (PR)"`, `"FEPAM (RS)"`).
   - `uf`: Sigla da unidade federativa em maiúsculas.
   - `ano`: 4 dígitos numéricos derivados da data de emissão ou publicação.
   - `categoria`: `"licenca" | "outorga" | "auto_infracao" | "embargo"`.
   - `tipo`: Denominação original do ato.
   - `empresa`: Razão social ou titular (nunca pessoa física desprotegida).
   - `municipio`: Nome do município normalizado.
   - `bacia`: Bacia hidrográfica (quando disponível).
   - `data_inicio`: Formato ISO YYYY-MM-DD.
   - `data_fim`: Validade ISO YYYY-MM-DD.
   - `situacao`: Situação administrativa do ato.
   - `processo`: Número do processo ou portaria oficial.
3. **Mapeamento de Bacias IGAM (MG):**
   - Criação de dicionário para converter as URGAs do IGAM para as bacias hidrográficas nacionais da ANA (ex.: *URGA Central/Paraopeba/Velhas* → *Rio São Francisco*, *URGA Grande* → *Rio Grande*, *URGA Doce* → *Rio Doce*, *URGA Jequitinhonha* → *Rio Jequitinhonha*, *URGA Mucuri/São Mateus* → *Rio Mucuri*).
4. **Atualização das agregações:**
   - Adição ao array mestre `REGISTROS_LICENCAS`.
   - Atualização automática dos totais e ressalvas em `LICENCAS_COBERTURA`.

---

## Integração no Orquestrador

Em `scripts/rotina-ambiental.mts`:

1. **Inclusão do IGAM:**
   - Adicionar `igam` ao catálogo de fontes com timeout e piso de sanidade (70%).
2. **Estrutura modular para estados:**
   - Cadência mensal para coletas estaduais na máquina de publicação (`home-pc`).
   - Inclusão dos 15 novos coletores no catálogo `FONTES`.
   - Garantia de que a auditoria de CPF (`checar-dado-pessoal-em-dado.py`) seja executada automaticamente após cada coleta individual.

---

## Cronograma de Execução em 5 Fases

O trabalho será dividido em etapas lógicas e commits separados (Regra 5 do `AGENTS.md`):

### Fase 1: Mapeamento dos 27 Estados e Correção da Onda 1
- Criar `docs/relatorio-mapeamento-27-estados.md` com a matriz completa dos 27 estados.
- Normalizar bacias do IGAM em `licencas-unificada.ts`.
- Adicionar `igam` ao orquestrador `rotina-ambiental.mts`.
- *Commit 1:* Documentação do mapeamento e ajustes da Onda 1.

### Fase 2: Coletores do Grupo A (6 estados de alta viabilidade)
- Implementar coletores: PR, RS, PI, SE, MS, CE.
- Coletar amostras de 500 registros para cada um em `apps/web/data/`.
- Varrer dados com `checar-dado-pessoal-em-dado.py`.
- *Commit 2:* Coletores e amostras do Grupo A.

### Fase 3: Coletores do Grupo B (9 estados de média viabilidade)
- Implementar coletores: PE, DF, SP, SC, RJ, PB, RN, AL, RO.
- Coletar amostras de 500 registros para cada um em `apps/web/data/`.
- Varrer dados com `checar-dado-pessoal-em-dado.py`.
- *Commit 3:* Coletores e amostras do Grupo B.

### Fase 4: Integração no Feed e Orquestrador
- Plugar os 15 novos estados em `apps/web/lib/ambiental/licencas-unificada.ts`.
- Configurar os novos scripts no `scripts/rotina-ambiental.mts`.
- Testar compilação com `npx tsc --noEmit -p apps/web/tsconfig.json`.
- *Commit 4:* Feed unificado e agendamento de rotinas.

### Fase 5: Auditoria, Testes e Atualização do Relatório Técnico
- Rodar varredura completa de CPF em todo o repositório.
- Rodar bateria de testes unitários (`npm test`).
- Atualizar métricas e tabelas de cobertura em `docs/RELATORIO-TECNICO-PORTAL.md`.
- *Commit 5:* Atualização do relatório técnico do portal.

---

## Plano de Verificação e Segurança

1. **Verificação de Tipos:**
   - Comando: `npx tsc --noEmit -p apps/web/tsconfig.json`.
   - Critério: Zero erros.

2. **Auditoria de Dados Pessoais (LGPD):**
   - Comando: `python scripts/checar-dado-pessoal-em-dado.py`.
   - Critério: Nenhum CPF detectado nos arquivos gerados em `apps/web/data/`.

3. **Verificação de Testes e Integridade:**
   - Comando: `npm test`.
   - Critério: Suíte completa de testes passando sem regressões.

4. **Validação de Documentação:**
   - Comando: `python scripts/validar-documentacao.py`.
   - Critério: Cabeçalhos de metadados, links e sumários válidos.

---

## Decisões registradas

- **D1 (2026-09-17):** Estados com barreiras severas (Grupo C) serão documentados formalmente em `relatorio-mapeamento-27-estados.md` em vez de criar scrapers frágeis ou tentar contornar logins.
- **D2 (2026-09-17 — Atualizado pelo dono):** Coleta integral ("baixe tudo"). Os coletores devem baixar os dados na íntegra (full/100%). A decisão sobre quanto subir para o site ou fatiar por conta dos limites de asset do Cloudflare Worker (25 MiB asset / 3 MiB gzip) será tomada a posteriori na integração do feed, mas a extração inicial é completa.
- **D3 (2026-09-17):** Cada commit será realizado por pathspec explícito (`--only`), com mensagem gravada em arquivo e sem acentos, conforme estipulado no `AGENTS.md`.
