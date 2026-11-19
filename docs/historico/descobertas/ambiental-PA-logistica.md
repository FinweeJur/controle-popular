# Logística do Pará em dados públicos: o que existe, o que abre e o que é porta fechada

> **Tipo:** HISTORICO / descoberta
> **Domínio:** ambiental-PA / logística
> **Data da medição:** 17/11/2026
> **Método:** sondagem ao vivo com `curl` e `Invoke-WebRequest`, uma requisição por vez, 1–2 s entre chamadas ao mesmo host
> **User-Agent usado:** `finweejur/github artur colito` (honesto, sem UA de navegador)
> **Volume:** 60 requisições HTTP + 16 consultas DNS. Nenhum login, CAPTCHA ou paywall foi contornado.
> **Status:** descoberta. Nada foi gravado no banco, nada foi commitado.

## Sumário

- [1. Resposta curta](#1-resposta-curta)
- [2. Método e limites](#2-método-e-limites)
- [3. URLs sondadas](#3-urls-sondadas)
- [4. Coletável hoje: DNIT GeoServer (a mina)](#4-coletável-hoje-dnit-geoserver-a-mina)
- [5. Coletável hoje: PNCP (contratos)](#5-coletável-hoje-pncp-contratos)
- [6. Portos e hidrovias do PA](#6-portos-e-hidrovias-do-pa)
- [7. Bloqueado, e por quê](#7-bloqueado-e-por-quê)
- [8. Veredito por fonte](#8-veredito-por-fonte)
- [9. O que não foi medido](#9-o-que-não-foi-medido)

## 1. Resposta curta

Existe dado público de logística do Pará, e ele está concentrado em **dois lugares que ninguém do portal usa ainda**: o **GeoServer WFS do DNIT** (aberto, sem chave, com malha rodoviária, obras, ferrovias, hidrovias, portos e contagem de tráfego) e a **API de consulta do PNCP** (contratos com fornecedor, valor e município da unidade).

A ANTAQ, dona natural do dado portuário, está **inteiramente fechada** para acesso automatizado: 403 em todos os hosts `*.antaq.gov.br`. O que sobrou dela chega de carona dentro do GeoServer do DNIT — 548 instalações portuárias no país, **3 no PA**.

## 2. Método e limites

- Toda requisição com UA `finweejur/github artur colito`. Nenhum UA de navegador foi usado em nenhum momento.
- `robots.txt` lido antes de coletar em `www.gov.br` (200, `Allow: /` para `*`, com bloqueios só em `/ebserh` e `/mre`) e em `estatistica.antaq.gov.br` (200, `Allow: /`, `Content-Signal: search=yes,ai-train=no,use=reference` — uso de referência permitido).
- Corpo validado em toda resposta 200: página de manutenção, casca de SPA e lista vazia foram contadas como falha, não como sucesso.
- Onde a contagem não foi capturada, este documento diz **não medido**.

## 3. URLs sondadas

| URL | Status | Bytes | Leitura |
|---|---|---|---|
| `https://www.gov.br/robots.txt` | 200 | 2.102 | `Allow: /` para `*`; bloqueios só em `/ebserh` e `/mre` |
| `https://dados.gov.br/api/3/action/package_search?q=antaq` | **401** | 0 | API do portal federal exige credencial. Fonte de dados abertos inviabilizada por aqui |
| `https://dados.gov.br/api/3/action/package_search?q=antt` | **401** | 0 | idem |
| `https://www.gov.br/antaq/pt-br/acesso-a-informacao/dados-abertos` | 200 | 339.303 | Página institucional. **Zero** menções a `dados.gov.br`, zero link de dataset |
| `https://www.gov.br/antaq/pt-br/assuntos/estatistica` | 200 | 335.082 | Só menu + rodapé. Nenhum link de estatística |
| `https://www.gov.br/antaq/pt-br/central-de-conteudos/paineis` | 200 | 364.800 | Nenhum `<iframe>`, nenhuma menção a Power BI. Painéis não expostos no HTML |
| `https://www.gov.br/antaq/pt-br/assuntos/instalacoes-portuarias` | 200 | 362.316 | Só menu + rodapé |
| `https://www.gov.br/antaq/pt-br/@@search?SearchableText=...` | 200 | 167.566 | Corpo = "Estamos em manutenção". Busca interna fora do ar |
| `https://www.antaq.gov.br/` | **403** | 0 | Bloqueio de bot no edge |
| `https://web.antaq.gov.br/` | **403** | 0 | idem |
| `https://estatistica.antaq.gov.br/` | **403** | 0 | idem, apesar do `robots.txt` permitir |
| `https://estatistica.antaq.gov.br/robots.txt` | 200 | 2.676 | `Allow: /`, `ai-train=no`, `use=reference` |
| `https://dados.antaq.gov.br/` | DNS NX | — | Host não existe |
| `https://dados.antt.gov.br/` | **000** | 0 | DNS resolve (200.198.195.143), conexão morre em 25 s e em 45 s. Portal CKAN da ANTT está fora |
| `https://dados.antt.gov.br/api/3/action/package_list` | **000** | 0 | idem |
| `https://www.gov.br/antt/pt-br/acesso-a-informacao/dados-abertos` | 200 | 197.741 | Página institucional; manda para `dados.gov.br`. Nenhum arquivo |
| `https://www.gov.br/antt/pt-br/assuntos/ferrovias/concessoes-ferroviarias` | 200 | 212.123 | Lista de concessões com "Área de atuação" e "Extensão". **Nenhuma no PA** |
| `https://www.gov.br/dnit/pt-br/acesso-a-informacao/dados-abertos` | 200 | 149.512 | Aponta para VGeo e para o painel PNP. Nenhum CSV |
| `https://www.gov.br/dnit/pt-br/acesso-a-informacao/dados-abertos/dados-abertos` | 200 | 149.520 | Mesma coisa: só VGeo e PNP |
| `https://servicos.dnit.gov.br/vgeo/` | 200 | 3.268 | Casca Leaflet, sem dado no HTML |
| `https://servicos.dnit.gov.br/vgeo/js/vgeo.js` | 200 | 19.280 | Revela o endpoint real: `.../dnitgeo/geoserver/ows` |
| `https://servicos.dnit.gov.br/dnitgeo/geoserver/ows?service=WFS&version=2.0.0&request=GetCapabilities` | 200 | 133.089 | **73 camadas** publicadas, sem autenticação |
| `https://www.gov.br/prf/pt-br/acesso-a-informacao/dados-abertos` | 200 | 421.746 | Só PDFs de plano de dados; nenhum CSV de acidente |
| `https://www.gov.br/prf/pt-br/acesso-a-informacao/dados-abertos/dados-de-acidentes` | 200 | 152.375 | Página responde, mas não lista arquivo algum |
| `https://arquivos.prf.gov.br/` | 200 | **0** | Corpo vazio. Não serve como espelho |
| `https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos` | 200 | 311.700 | Portal da ANP responde e lista áreas (incidentes, tancagem, movimentação) |
| `https://www.gov.br/anp/pt-br/assuntos/comunicacao-de-incidentes` | 200 | 301.550 | Página existe; **0** links `.csv`/`.xls`/`.zip`. Dado estruturado não exposto |
| `https://pncp.gov.br/api/consulta/v1/contratos?dataInicial=20261001&dataFinal=20261010&pagina=1` | 200 | 810.930 | API aberta, JSON, sem chave |
| `https://pncp.gov.br/api/consulta/v1/contratos?dataInicial=20260401&dataFinal=20260430&cnpjOrgao=04892707000100` | 200 | 201.427 | DNIT: **109 contratos** em abril/2026, **11** com UF da unidade = PA |
| `https://pncp.gov.br/api/consulta/v1/contratos?dataInicial=20261110&dataFinal=20261110` | 200 | 831.903 | País inteiro num dia: **9.115 contratos**, 19 páginas de 500 |
| `https://pncp.gov.br/api/consulta/v1/contratos?...&cnpjOrgao=04961190000107` | **422** | 180 | "CNPJ do órgão/entidade inválido" — CNPJ da ANTT usado no teste está errado |
| `https://pncp.gov.br/api/consulta/v1/orgaos?uf=PA` | **404** | 145 | Endpoint não existe; não há como listar órgãos por UF |
| `https://pncp.gov.br/api/search/?q=ANTT...` | **000** | 0 | Conexão derrubada. Não insistido (regra de rate limit) |

## 4. Coletável hoje: DNIT GeoServer (a mina)

`https://servicos.dnit.gov.br/dnitgeo/geoserver/ows` — GeoServer público, **WFS 2.0 aberto**, sem chave, sem login, responde GeoJSON com um `curl` simples. 73 camadas, das quais interessam ao PA:

| Camada | Total no país | Recorte PA | Campos |
|---|---|---|---|
| `vgeo:vw_snv_rod` | 343.892 trechos | **11.980** | `Codigo_BR`, `Unidade_Federacao`, `Quilometragem_Inicio/Fim`, `Extensao`, `Superficie_Federal`, `Administracao`, `Ato_Legal`, `Obra`, `Versao_SNV` |
| `vgeo:vw_snv_rod` filtrado BR-163 | — | **2.659 trechos** | mesmos campos (ex.: km 971,4–982,1, `PAV`, `Federal`) |
| `vgeo:vw_antaq_portos` | 548 | **3** | `Codigo_IP`, `Nome`, `Tipo`, `Situacao`, `Gestao`, `Companhia`, `CNPJ`, `Profundidade`, `Municipio`, `Unidade_Federacao`, `Regiao_Hidrografica`, `dt_ini`, `dt_fim` |
| `vgeo:vw_antaq_vias_navegaveis` | 302 | **223** (regiões hidrográficas Amazônica + Tocantins) | `Nome`, `Navegacao`, `Tipo`, `Classificao`, `Extensao`, `Tempo`, `Rio`, `Eclusa`, `Jurisdicao`, `Dominio` |
| `vgeo:vw_antaq_travessias` | 93 | não medido por UF | `Travessia`, `Origem_Mun`, `Origem_UF`, `Destino_Mun`, `Destino_Pais`, `Rio`, `Operadores` |
| `vgeo:tb_obras_andamento_fisico` | 1.096 | **27** (bbox aproximado do PA) | `contrato`, `apelido`, `eixo`, `lado`, `servico`, `km_inicial`, `km_final`, `dt_supra` |
| `vgeo:vw_snv_portos`, `vw_antaq_*`, `vw_dif_ferrovias`, `vw_epl_ferrovias`, `vw_dutovias`, `vw_pnct_contadores_2020_2025` | não medido | não medido | camadas existem e respondem no GetCapabilities; conteúdo não foi lido |

Os três portos do PA que o filtro `Unidade_Federacao='PA'` devolve:

| Código | Nome | Tipo | Situação | Gestão | Companhia | CNPJ |
|---|---|---|---|---|---|---|
| BRBEL | Belém | Porto Organizado | Operando | SEP | Companhia Docas do Pará – CDP | **vazio** |
| BRSTM | Santarém | Porto Organizado | Operando | — | — | **vazio** |
| BRVDC | Vila do Conde | Porto Organizado | Operando | — | — | **vazio** |

Filtros testados e aceitos: `cql_filter=Unidade_Federacao='PA'`, `cql_filter=Unidade_Federacao='PA' AND Codigo_BR='163'`, `bbox=-73.99,-10.0,-45.0,3.0,EPSG:4326`, `count=`.

**O que esta camada NÃO tem:** movimentação anual, tipo de carga, tonelagem, arrendatário. `CNPJ` existe como campo e vem vazio nos três registros do PA. Miritituba e Barcarena não aparecem como instalação separada (Barcarena entra como Vila do Conde).

## 5. Coletável hoje: PNCP (contratos)

`https://pncp.gov.br/api/consulta/v1/contratos` — JSON aberto, sem chave. Datas em `yyyyMMdd`, paginação de 500.

Medições:

- Filtro por órgão funciona: `cnpjOrgao=04892707000100` (DNIT) → **109 contratos** em abril/2026, **11** com `unidadeOrgao.ufSigla = PA` (Belém).
- Sem filtro, um único dia (10/11/2026) tem **9.115 contratos** em **19 páginas** — viável varrer por dia, caro varrer por ano.
- Não há endpoint para listar órgãos por UF (`/orgaos` → 404) e **não há filtro por UF do local da obra**: `ufSigla` é a UF da *unidade do órgão*, não necessariamente onde a obra está.

Campos por contrato (medidos): `numeroControlePNCP`, `orgaoEntidade.cnpj`, `orgaoEntidade.razaoSocial`, `unidadeOrgao.ufSigla`, `unidadeOrgao.municipioNome`, `niFornecedor`, `nomeRazaoSocialFornecedor`, `objetoContrato`, `valorInicial`, `valorGlobal`, `valorAcumulado`, `dataAssinatura`, `dataVigenciaInicio`, `dataVigenciaFim`, `numeroRetificacao` (aditivos), `tipoContrato`, `processo`, `dataPublicacaoPncp`.

## 6. Portos e hidrovias do PA

- **Portos organizados:** 3 (Belém, Santarém, Vila do Conde), via GeoServer do DNIT. Sem movimentação.
- **Hidrovias:** 223 trechos navegáveis nas regiões hidrográficas Amazônica e Tocantins, com extensão, tipo de navegação e tempo de percurso. Cobre "Acesso ao Porto de Belém" e "Hidrovia do Solimões".
- **Movimentação portuária anual (toneladas, tipo de carga):** não obtida. Ficaria na ANTAQ (403) ou em `dados.gov.br` (401).
- **Ferrovias:** a lista de concessões ferroviárias da ANTT tem 16 concessionárias; **nenhuma com área de atuação no PA**. Ferrogrão/EF-170: **0 menções** naquela página. Estrada de Ferro Carajás não é concessão ANTT. EF-151 (Norte-Sul) está listada como TO/GO (Tramo Central) e MA/TO (Tramo Norte) — não alcança o PA.

## 7. Bloqueado, e por quê

| Fonte | Bloqueio | Evidência |
|---|---|---|
| ANTAQ (todo o domínio) | 403 do edge para UA honesto, em `www`, `web` e `estatistica`. Não insistido | 3 hosts, 3× 403; `robots.txt` permite, o WAF não |
| `dados.gov.br` (API) | 401 sem credencial | 2 endpoints, 2× 401 |
| `dados.antt.gov.br` | Conexão morta, servidor não responde | 3 tentativas, timeouts de 25 s e 45 s, DNS OK |
| PRF acidentes | Página responde mas não publica arquivo; espelho `arquivos.prf.gov.br` devolve 0 byte | 3 requisições |
| ANP incidentes | Página informativa, nenhum CSV/XLS | 0 links de download em 301 KB |
| Busca interna do gov.br/ANTAQ | Página de manutenção | 2 tentativas |

Nenhum desses bloqueios foi tentado de novo além do razoável, e nenhum foi contornado com UA falsificado, proxy ou repetição agressiva.

## 8. Veredito por fonte

| Fonte | Veredito | Dificuldade | Ganho cívico |
|---|---|---|---|
| DNIT GeoServer WFS | **Integrar agora** | Baixa (GET + CQL, sem chave, GeoJSON pronto) | Mostra ao cidadão o km exato, o tipo de pavimento e a administração de cada trecho da BR-163 e das demais rodovias federais do PA, além de onde há obra em andamento |
| PNCP API de contratos | **Integrar agora** | Baixa/média (varredura por dia ou por CNPJ do órgão) | Expõe quem ganhou, por quanto e por qual objeto cada contrato do DNIT no PA, com aditivos e vigência |
| ANTAQ portos/hidrovias (espelho DNIT) | **Integrar agora**, como catálogo pequeno | Baixa (mesmo WFS) | Dá nome, tipo, situação e operador das três instalações portuárias do PA e 223 trechos hidroviários — o mapa logístico que falta no portal |
| ANTT concessões rodoviárias/ferroviárias (HTML) | **Espera** | Alta (HTML sem tabela, contrato em PDF) | Deixaria claro que o PA não tem ferrovia concedida e quais rodovias são concedidas — mas não há estrutura para parsear sem trabalho manual |
| ANTAQ movimentação portuária | **Impossível hoje** | — | Seria o dado de tonelagem por porto e tipo de carga; hoje só existe atrás de 403/401 |
| ANP incidentes (carga perigosa) | **Espera** | Média (página sem arquivo; dado parece existir em painel) | Acidentes com produtos perigosos no PA são pauta óbvia, mas a fonte não publica planilha |
| PRF acidentes em rodovia federal | **Espera / não medido** | Média | Acidente por km e causa na BR-163 seria o melhor cruzamento com as obras do DNIT |
| `dados.gov.br` como hub | **Impossível hoje** | — | Era o caminho "oficial" para tudo acima; hoje exige credencial |

## 9. O que não foi medido

- `vw_snv_portos`, `vw_dif_ferrovias`, `vw_epl_ferrovias`, `vw_pnct_contadores_2020_2025`: as camadas existem e estão no GetCapabilities, mas o conteúdo não foi lido (orçamento de requisições).
- Contagem de `vw_antaq_travessias` só para o PA.
- CNPJ da ANTT no PNCP: o valor testado foi rejeitado com 422; não foi descoberto.
- Se existe filtro por UF do local da obra no PNCP (não há documentação lida; o comportamento medido indica que não).
- ANP movimentação/tancagem por município: a página inicial responde, os arquivos não foram abertos.
- Qualquer tentativa de leitura de `dados.gov.br` pela interface web (só a API foi testada).
- O repositório não tem coletor de ANTAQ/ANTT/DNIT: `grep -ri "antaq\|antt\|dnit\|porto"` em `scripts/` e `etl/` (excluindo `.venv`) retorna **zero** arquivos de código próprios.
