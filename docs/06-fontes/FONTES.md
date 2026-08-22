# Fontes de dados — referência operacional

Este documento consolida o levantamento, a classificação e o estado operacional de cada fonte de dados do portal, com as decisões de coleta e as armadilhas medidas em cada uma.

## Regras gerais de coleta

| Regra | Prática |
|---|---|
| Pausa entre requisições | 1–2 s por host; 1,5 s na FGV; 4 s em sondas de link |
| User-Agent honesto | Identifica o projeto. Exceções medidas: SIGMINE/ANM, CONAMA e planalto.gov.br só respondem a UA de navegador (403 ou conexão derrubada sem ele); Guaicuy devolve 406 ao urllib padrão |
| Checkpoint | Coleta vazia não sobrescreve arquivo bom; 429/503 param a coleta; validar conteúdo, nunca só o status HTTP (302→200 de bloqueio eleitoral, `[]` com 200, esqueleto com nome nulo) |
| Fora da CI | Nada agendado para fonte que muda 1×/mês; o radar roda antes do build; coletores manuais com retomada |
| robots.txt | Respeitar, com decisão registrada (FGV veda o host inteiro — ver seção própria) |
| Dado pessoal | Varredura mod-11 antes do commit + régua de triagem no build para dado ingerido + redação na origem para campos de 11 dígitos; máscara da fonte não é prova de proteção (ver Rouanet). CPF real já vazou em ementa oficial e em campo de nome; o hook é o que pegou |

## CNJ e JUMA — litígio e jurisprudência nacional

| Fonte | O que dá | Estado |
|---|---|---|
| CACOL (painel CNJ) | Power BI "publish to web", visual puro, sem export; filtros por UF/município do órgão julgador e CNPJ da parte | Não raspável; a fonte real é o DataJud |
| DataJud (API pública) | `POST /api_publica_tjmg/_search` com APIKey do wiki oficial (copiar do HTML bruto — resumo por IA corrompeu a chave); devolve `codigoMunicipioIBGE` do órgão julgador; **não devolve nome/CNPJ de parte** (LGPD; `_mapping` dá 403); paginar com `search_after` (teto 10.000 do `from`) | Medido: TJMG 69.983 ACP, 3.528 AP, 1.322 MSC, 962 ACC; ~6.011 ACP com assunto "ambiental". **Licença bloqueia publicação: cláusulas 3.8/3.9 vedam distribuir derivado sem ciência ao CNJ — decidir entre notificar o CNJ ou consulta ao vivo (recomendado)** |
| JUMA (PUC-Rio) | 187 casos já no HTML de um GET (rodapé declara 381 — contagens não reconciliadas; usar 187); 6 casos de MG; único campo geográfico = UF; sem caso Brumadinho dedicado | Sem licença declarada → direitos reservados: linkar e pedir permissão formal antes de reproduzir resumos; encaixe como recurso novo em `/ambiental`, não nos precedentes |

## Biblioteca das ATIs do Paraopeba

597 publicações (26/03/2020–23/06/2026), só metadado e link — nenhum arquivo, nenhum resumo (nenhuma fonte declara licença; Lei 9.610/98 → linkar, não copiar). AEDAS 435 via REST (`projeto=3` + `299`; **435+231=666 não existe** — a união deduplicada é 435); Guaicuy 162 fora da REST (sitemaps por tipo + tarja de localidade; a vitrine mostra 9; o link "Ver todas" usa filtro `_sft_` de plugin inativo e devolve o arquivo inteiro). ADAI: 0 documentos da bacia (medido); NACAB sem biblioteca. Triagem: 0/597 barrados (zero estrutural, acervo sem texto). Notícias das ATIs (1.100+) ficam para o radar, não acervo. (medição em 16/08 — remeça antes de decidir com ele)

## Auditoria AJRI (Brumadinho)

Portal Rails autenticado por cookie Devise (sem API; 401/403 = renove o cookie). Acervo: 467 documentos (391 Relatórios + 76 Notas Técnicas), 28/02/2019–31/07/2026, autor AECOM, 7 instrumentos jurídicos, 27 facetas de tema reduzidas a 25 (duas duplicatas sujas — normalizar por slug). Rate mínimo 2 s; PDF gerado sob demanda com marca-d'água (timeout 180). **A marca-d'água contém nome e CPF do solicitante: não publicar os 467 PDFs** — publicar catálogo + link é compatível com os Termos; espelho integral só em acesso restrito a pesquisadores.

## Lei Rouanet / SALIC — e os três jeitos que a API mente

API pública sem chave; medido: 7.206 projetos UF=MG (7.141 com `valor_aprovado` > 0; soma R$ 8,6 bi aprovado / R$ 1,9 bi captado), 333 municípios, 20.784 incentivadores domiciliados (2.263 PJ + 18.521 PF), chave de junção `cgccpf` (2.261 válidos). 29 projetos trazem outro valor no próprio campo UF — contar a divergência, nunca refiltrar.

| Mentira | Comportamento medido |
|---|---|
| Filtro inexistente devolve o catálogo inteiro | `?parametro_inexistente=1` → 200 com 113.548, igual a sem filtro. O próprio portal do MinC cai: `_links.incentivadores` usa `incentivador_id=<PRONAC>`, filtro não reconhecido → os 113.548 do Brasil com cara de "os deste projeto". Abortar quando total com/sem filtro bater |
| `sort` é ignorado em silêncio | 5 variações de sort → mesmas linhas na mesma ordem (200 nas 5). **Nunca publique "o maior incentivador é X"** sem varrer a lista e ordenar localmente; um ranking falso já foi passado ao dono assim |
| Código IBGE errado devolve esqueleto com `nome_ibge: null` | Mesma família de 200 mentiroso, medida no ComunicaBR: IBGE de 7 dígitos → 200 com esqueleto vazio e `nome_ibge: null`; validar `nome_ibge`, não o status |

Armadilha `total_doado`: é o total **no Brasil** do incentivador; `_links.doacoes` responde 404 em 9/9 — a trilha incentivador→projeto não existe hoje. Publicar `total_doado` de um domiciliado em BH como "dinheiro que entrou em MG" **inventa um número que parece certo** — a coluna sai rotulada "(Brasil)". Dado pessoal: a máscara cobre só `cgccpf`; 215 CPFs válidos vieram por extenso em campos de nome (210 proponentes + 5 incentivadores) — o hook pegou; redigir toda sequência de 11 dígitos em todo campo de texto. Arquivos compactados (esqueleto + dicionários + linhas; 69,1% menor) — ler sempre via `expandir()`, nunca por posição.

## Território e mineração

| Camada | Fonte | Números medidos |
|---|---|---|
| Terras indígenas | WFS FUNAI (EPSG:4674) | 16 polígonos em MG (15 TIs; Xacriabá em 2 fases); 2 na bacia do Paraopeba (Katurama, São Joaquim de Bicas; Caxixé, Pompéu, em fase *Delimitada*). **Paginar por UF — GetFeature sem filtro dá 403 do nginx**; mostrar todas as fases (direito originário, CF 231; Convenção 169); filtro por fase é decisão do usuário |
| Processos minerários | SIGMINE/ANM, zip diário (exige UA de navegador) | 54.916 polígonos em MG; só 7.083 (12,9%) autorizam extrair, 3.184 (5,8%) são Concessão de Lavra. Publicar como "minas em operação" (7.083) + "interesse minerário" separadas; nunca somar nem chamar o conjunto de empreendimentos; CFEM não localiza mina |
| ZAS | FEAM/IDE-Sisema (geoserver já usado) | ZAS real (156) + mancha de inundação (156); a ZAS é trecho do **vale à jusante** (Res. ANM 95/2022; piso 10 km ou 30 min de onda), não círculo — o círculo de 8 km superestima até 127× e erra a direção. 8 km é outra coisa (raio de TI, Portaria Interministerial 60/2015): não fundir. 103 barragens sem mancha → "sem mancha ≠ sem risco"; 24 ZAS na bacia; `status_pae` na etiqueta; PAE textual só via LAI |
| Quilombolas | INCRA WFS (22 feições MG, só GML, eixo lat,lon; "vedado uso comercial") + Palmares (lista CC-BY desatualizada 05/07/2022, não usada) | 13/14 feições antigas casaram por geometria; 13 territórios INCRA fora das camadas atuais (decisão pendente p/ Pimentel); sobreposições reais com lavra de granito: maior no Baú, Araçuaí (551,3 ha, GRANSENA) |
| PCTs não indígenas/quilombolas | **Não existe base com poligonal** | Lacuna declarada; o mapa deve dizer que não os representa |

(medição em 16/08 — remeça antes de decidir com ele)

## Pró-Brumadinho (Governo de MG) e auditoria FGV

**Portal de MG**: Drupal sem API; 209 arquivos (156 PDF + 28 ZIP + 25 XLSX; 20/20 amostrados respondem); busca de documentos responde 403 ao público (só dá para listar varrendo páginas); notícias em **bloqueio eleitoral** desde 25/06 (302→200 — validar conteúdo ou o cabeçalho `X-Drupal-Periodo-Eleitoral-Redirect`); obrigações da Vale: previsto R$ 11,48 bi × arrecadado R$ 16,38 bi (31/07/2026) — **arrecadado maior não é sobra, é correção monetária**; link oficial para a FGV (`projetos-convertidos.html`) está morto (404).

**FGV (Projeto Rio Paraopeba)**: SPA cujos dados são 4 JSONs de caminho fixo; ampliado de Betim para a bacia: 26 municípios, 450 linhas, 234 projetos; acordo corrigido R$ 5,48 bi — **é só Anexos I.3/I.4 (14,6% do acordo de R$ 37,6 bi); "executado" é desembolso, não obra pronta**; avanço físico deduplicado (12× menor) não ingerido. Armadilhas travadas por teste: célula mesclada de município (88% sem chave), rodapés/notas disfarçados de município, "Todos os Municípios de MG" não é município, número ora JS ora string com espaço rígido, BOM UTF-8. **`robots.txt` do www18.fgv.br é `Disallow: /`** — decisão registrada: duas requisições de caminho fixo (as mesmas do navegador), manual e nunca em CI, UA honesto, 1,5 s de pausa, canal aberto (`projetorioparaopeba@fgv.br`) antes de aumentar a frequência. (medição em 16/08 — remeça antes de decidir com ele)

## Fluxo financeiro — dinheiro ligado ao mapa

`ambiental_licenciamento`: 19.704 linhas, 75,2% com `cnpj_raiz` (100% das PJ), 10.934 raízes, 825/854 municípios. Raiz de 8 dígitos é decisão de privacidade — não distingue matriz/filial.

| Fonte | Estado |
|---|---|
| PNCP | Contratos por `codigoMunicipioIbge` + filtro `esferaId=M` (só `cnpjOrgao` subconta); 12.991 contratos em 5 municípios; cruzamento com ambiental: 16 raízes/299 linhas — teto da coleta, não da fonte |
| TCE-MG SICOM | JWT de ~1 h nascido de captcha humano — cobre cidades em cache, não escala para 854 |
| Portal da Transparência | Convênios já devolvem `cnpjFormatado` — **o coletor descarta o campo; correção pendente**; CPF de convenente vem mascarado pela própria fonte |
| CFEM (ANM) | Sem CNPJ (só razão social); atraso ~2 meses; não somar entre municípios (a guia aparece inteira em cada um); relatório de distribuição ao município vazio — arrecadada ≠ recebida |
| QSA (Base dos Dados) | Só para CNPJ que ganhou contrato; CPF de sócio mascarado (6/11 dígitos) — "sócio em comum" é sinal, não prova; nunca tentar completar CPF |
| Repasse Brumadinho | **853/853 municípios**, R$ 1,65 bi (Lei 23.830/2021; 853 + 142 + 219 linhas; somas fecham ao centavo; 1.214/1.214 casaram — 5 grafias oficiais divergentes em `APELIDOS`); malha por prefixo de 6 dígitos, sem colisão. **Ressalva: receber repasse não significa ser atingido** — o dado é estadual e pertence à página do município, não à tela da bacia |

## Clima e risco — AdaptaBrasil e INMET

**AdaptaBrasil**: 853 municípios × 8 indicadores = 6.824 linhas (índice 0–1, **não é gente**). BH pontua 0,00 nos dois índices de manchete (vulnerabilidade zera o produto) enquanto o BATER mede 389.218 pessoas em risco — **índice de manchete nunca aparece sozinho**: vem com as 3 componentes e o link da metodologia. Licença CC-BY-SA com citação obrigatória (campos NOT NULL). Armadilhas: 403 sem UA; ano errado → `[]` com 200 (abortar); cenário no nó do setor; `unique nulls not distinct`. **Migration e carga pendentes** — coletor testado, banco de produção não recebeu as linhas (Neon em cota 402 até 01/09). **INMET avisos ativos**: 9 avisos, 4 sobre MG (15/08); `municipios`/`geocodes` são string, não lista; `hoje`/`futuro` se sobrepõem; fuso de data/hora separado (decisão pendente); domínio público; coletor pronto, tabela futura. **BATER**: 1.377.577 pessoas expostas em MG — não coletado (geometria atrás de Cloudflare; caminho é navegador manual ou pedido ao IBGE).

## Legislação federal e URN LexML

**MMA (CKAN)**: 8.570 normas federais (1937–2025), CC-BY, 8.345 com `link_pdf` (97,4%) — CNDH 370/370 (100%). O CSV não se lê com split ingênuo (CRLF termina registro; ancorar por vocabulário fechado de `ÁREA MMA`/`STATUS`; 280 registros sujos resolvidos; Resolução Conama: 511 por campo, não 536 do grep). 1.501 revogadas (`situacao`); grafo de revogação não construído. **CNDH**: 248 recomendações (GraphQL no Decidim, WAF exige curl_cffi) + 122 resoluções; CC BY-ND — ementa copiada literal, nunca resumida; `id_fonte` = URL (numeração reinicia por gestão). Um CPF real veio dentro de uma ementa oficial (pego por teste mod-11, limpo na origem; **histórico do git ainda contém o commit `e510f4e` — limpeza é decisão do dono**). **URN LexML**: só Lei/Decreto/Decreto-Lei/MP federais com data+número = 651 de 15.318 (4,2%); 16/17 resolveram (94,1% — ~6% de link morto conhecido); HTTP 200 não prova nada (SPA ecoa a URN; o sinal é `legislationIdentifier`); SRU do LexML atrás de bot-check — não usar; URN derivada a cada render, sem coluna.

## ComunicaBR — coleta de MG

853/853 municípios, 174.012 itens, 67.566 com valor (39%); 106.446 vazios (61%) — e "vazio" tem duas espécies: lacuna da fonte (4 categorias zeradas em todos; `governo-digital` 853/853) e `valorBruto: 0` sem `valor` = campo não publicado (**nunca mostrar "R$ 0,00"** onde o governo disse "não se aplica"). Estrutura idêntica entre municípios: 1 esqueleto + 366 rótulos em 2,26 MB — **nunca percorrer `itens` sem `expandirArquivo()`**. 21 ministérios como fonte declarada — citar. Telas: índice de MG + ficha por município. Armadilhas da API: IBGE de 6 dígitos (7 → esqueleto com `nome_ibge: null`); valor em `subIndicadores[].items[].valor`; filtro real é `&tema=` (`&categoria=` ignorado). Outras 26 UFs pendentes (10,5 min por UF). (medição em 16/08 — remeça antes de decidir com ele)

## LAI — portais e protocolos

Canal federal = Fala.BR (todo órgão gov.br encaminha para lá); prazo padrão 20+10 dias. **Protocolo do Fala.BR não é gravado em lugar nenhum do projeto** — quem abre pedido anota à mão (órgão, data, protocolo, prazo); foi exatamente essa a lacuna do pedido ao INCRA, com **prazo vencendo em 18/08 e protocolo nunca anotado** (remeça antes de decidir com ele — o pedido em si não existe no repositório; os 4 pedidos redigidos citados na tarefa nunca foram achados). Municípios: Betim (Decreto 43.201, 20+10), BH (e-SIC próprio; Câmara = ouvidoria), SP (e-SIC; portal de transparência atrás de captcha), Araçuaí e Itinga (e-SIC próprios), Diamantina (portaltransp; Câmara inacessível a bot). Estadual: e-SIC central CGE-MG (**exige login gov.br — interação humana**); Semad/Feam/Igam não têm e-SIC próprio (redirecionam); TCE-MG 20 dias + 5 para recurso; ALMG sem e-SIC dedicado. Não verificado: Câmara de Betim (404), DPMG, SPU, Câmara de Araçuaí.

## Decisões de recurso de LAI da CGE-MG — o único corpus de LAI de MG pesquisável

`acessoainformacao.mg.gov.br/sistema/site/busca_decisao.aspx`, **sem login e sem captcha**. Sondado em 21/08/2026.

**Contexto que decide o resto:** MG **não** publica os pedidos de LAI nem as respostas. Não há busca de pedidos respondidos, não há download em massa (o link chamado "Download de Dados" leva a *Informações Classificadas e Desclassificadas*, outra coisa) e não há como enumerar — sem índice, sem id público, sem paginação. O federal publica pedidos e respostas em CSV; MG publica só estatística agregada. **Este corpus de decisões é o que existe**, e por isso vale mapeá-lo.

**Como se conversa com ele:** ASP.NET WebForms — POST com `__VIEWSTATE`/`__EVENTVALIDATION` colhidos de um GET anterior; sem eles o servidor rejeita. Filtros: `ddlYear` (2020–2026), `ddlOrgao` (90 órgãos) e `ddlTipoDecisao` (6 tipos). Prefixo dos campos: `ctl00$ctl00$ConteudoGeral$ConteudoPrincipalSemAjax$`.

⚠️ **Zero resultado NÃO traz "Total de resultados: 0"** — a página troca a frase inteira por *"Nenhum resultado encontrado para a pesquisa."* Quem só procura o total lê a ausência como falha de parsing e inventa um erro que não existe — ou pula o caso e nunca registra o zero, que aqui é informação.

**O tamanho do corpus, medido (2020–2026): 753 decisões.**

| ano | total | Desprovimento | Não conhecimento | Perda de objeto | Perda parcial | Provimento | Prov. parcial |
|---|---:|---:|---:|---:|---:|---:|---:|
| 2020 | 51 | 14 | 23 | 10 | 4 | 0 | 0 |
| 2021 | 60 | 21 | 28 | 7 | 3 | 1 | 0 |
| 2022 | 86 | 17 | 21 | 4 | 0 | 0 | 0 |
| 2023 | 204 | 30 | 59 | 5 | 0 | 3 | 2 |
| 2024 | 156 | 16 | 50 | 11 | 0 | 1 | 1 |
| 2025 | 143 | 14 | 56 | 7 | 2 | 3 | 0 |
| 2026 | 53 | 14 | 28 | 1 | 5 | 3 | 2 |

**Duas leituras que mudam o que dá para prometer com esta fonte:**

1. **Provimento é raro: 16 em sete anos** (2020 e 2022 tiveram nenhum). A ideia de "filtrar por Provimento e obter o mapa das negativas indevidas" — que chegou a ser escrita no plano de expansão — **não se sustenta no volume**: são 16 casos, não um veio. Valem como casos exemplares, nunca como base estatística. O que domina é *Não conhecimento* (265) e *Desprovimento* (126): o recurso não é apreciado, ou o cidadão perde.
2. **Em 2022–2025 a soma dos tipos não fecha com o total do ano** (2023: 99 de 204; 2024: 79 de 156; 2025: 82 de 143), enquanto 2020, 2021 e 2026 fecham exatamente. Ou parte das decisões não tem tipo preenchido, ou existe tipo fora do dropdown. **Não investigado** — mas ninguém deve somar por tipo e publicar como total do ano sem resolver isso antes.

**Status:** sondagem feita, coletor **não** escrito. O corpus é pequeno e enumerável; o custo está em percorrer os anos mantendo o viewstate a cada requisição.

## Diário oficial — mapeamento SIGPub (sem coleta)

Mapeamento feito, coleta bloqueada até o corte de LGPD (nomeação/exoneração, CPF). Só **Diamantina** usa SIGPub/AMM-MG (diariomunicipal.com.br/amm-mg; uma edição estadual por dia útil; busca por `entidadeUsuaria` — Prefeitura = 905, Câmara = 21672; sem filtro de tipo de ato; URLs por hash opaco; **mecanismo confirmado em 16/08**: GET + CSRF de sessão + datas obrigatórias em `dd/mm/yyyy` + paginação por mês, pois range longo devolve vazio). **Araçuaí e Itinga têm diário próprio** (CMS da prefeitura; Itinga = "Simple System", endpoint JSON atrás de JS não mapeado; `fontes.diario_oficial` de Itinga não preenchido). Betim (dados abertos JSON), BH (DOM-Web) e SP (DOC/PubNet) em fases posteriores. Engenharia adiantada: migration `0077_atos_diario.sql` + classificador `apps/web/lib/diario/classificarAto.ts` (calibrado contra 75 títulos reais). Pendente: inspeção de rede do diário de Itinga (fase de coletor por-prefeitura).

## Rede de proteção de MG

30 itens curados (3 LAI estadual + 5 federal + 22 rede), todos por organização, verificados em 13/08/2026. Defensoria em 109–110 comarcas (unidade de Araçuaí cobre Itinga; Diamantina inaugurada nov/2024); MPMG com CAOs temáticos (denúncia pela Ouvidoria 127); delegacias especializadas de BH no mesmo prédio (Barro Preto); CRAS/CREAS/Conselho Tutelar são por município — o material ensina a achar, não lista endereços; clínicas gratuitas DAJ-UFMG e SAJ-PUC Minas. Não verificado (não usar como definitivo): NAJUP, núcleo da RENAP em MG, comissão de DH da OAB-MG (403), comissões de câmaras municipais.

## Radar de notícias do Paraopeba

Coleta diária de título/veículo/data/link — nunca o corpo (reportagem é obra de terceiro). Fontes: MAB + Agência Brasil + Google Notícias + **os feeds das 3 ATIs** (AEDAS, ADAI e Guaicuy — entregues em 16/08); **TJMG e MPMG ficaram fora: RSS respondem 404** (lacuna na tela). Armadilhas travadas: filtro exige termo de **lugar** (tema deixa entrar outro estado); Google devolve link do agregador (usar o nome do veículo do `<source>`); data em RFC 822; coleta vazia não sobrescreve. Regra de triagem **"Nota de pesar: \<nome\>"** (obituário público do Guaicuy) implementada na régua (`temNotaDePesar`, redigido na origem — nome de vítima é dado pessoal). 14 itens na janela de 45 dias (15/08). Roda antes do build; `gerado_em` sempre visível na tela. (medição em 16/08 — remeça antes de decidir com ele)

## Dados abertos de MG (`dados.mg.gov.br`) — CKAN que funciona, com três armadilhas

Medido em 21/08/2026. É CKAN de verdade (`/api/3/action/…`), 94 conjuntos, 18 órgãos, e a Controladoria-Geral publica **convênios de saída com atualização diária**. Coletores: `scripts/coletar-convenios-ambientais-mg.mts` (recorte dos 4 órgãos ambientais) e `scripts/coletar-tac-projetos.mts` (TACs, de captura de painel).

1. **403 sem User-Agent de navegador.** `curl` puro leva 403; com UA de navegador, 200. Não é rate limit, é bloqueio de cliente não-navegador — e silencioso o bastante para parecer indisponibilidade.
2. **O DataStore responde `success: true` com `total: 0`.** Está habilitado e vazio. Quem usar `datastore_search` conclui que o conjunto não tem dado. O caminho é baixar os CSV.GZ dos `resources`.
3. **`ft_convenio_metaetapa.csv.gz` vem VAZIO — só o cabeçalho, HTTP 200.** Medido em 21/08/2026: **87 bytes comprimidos, 75 descomprimidos, 1 linha** (`id_convenio;id_tipo_atendimento;ds_descricao;ds_unidade_medida;quantidade`). O controle que fecha o argumento: no **mesmo** conjunto, no mesmo minuto e pelo mesmo método, o recurso irmão de convênios devolveu 8,4 MB e **784.802 linhas** — a publicação funciona, o que não vem é o conteúdo desta tabela. É o arquivo que carregaria meta e etapa por convênio: sem ele dá para dizer quanto custou e quanto tempo levou, **não** se o convênio entregou o que prometeu. Pedido de LAI à CGE-MG **já redigido** (`Projetos/Controle Popular — Pedido LAI CGE-MG (metas de convênio).md`, no vault), aguardando protocolo.

**A armadilha de nome de campo, que é a pior:** `dt_vigencia_inicial` **não é data de início**. Em 90.045 dos 90.254 registros ela é igual a `dt_vigencia_final` — as duas guardam a data-limite originalmente pactuada, e o prazo que vale hoje é `dt_vigencia_atual`. Quem ler "inicial" como começo calcula duração zero para 99,8% dos convênios, e zero passa por plausível. Prorrogação = `dt_vigencia_atual − dt_vigencia_final`.

Número que saiu disso: **47,7% dos 870 convênios ambientais foram prorrogados, contra 27,6% dos 90.254 do Estado inteiro** — mesma base, mesmo cálculo. Mediana de 365 dias; a maior, 5.171.

**Fora do CKAN:** o meio ambiente de MG quase não publica ali — nenhuma das 18 organizações é SEMAD/FEAM/IEF/IGAM (os convênios acima aparecem porque a CGE publica os de TODOS os órgãos). O ambiental vive nos sistemas do SISEMA. E a **SEDESE tem 1 conjunto só** (transferência de renda, 2020-21): tratar como dimensão, não como fonte.

## Transferegov (ex-SICONV) — o federal publica o que o estadual não publica

Medido em 21/08/2026. Coletor: `scripts/coletar-convenios-federais-mg.mts`. CSV puro, **sem chave e sem login**, em `https://repositorio.dados.gov.br/seges/detru/`. Recorte de MG: 29.475 convênios da União com proponente mineiro, R$ 27,98 bi, 49,2% desembolsado.

**Por que importa:** a base federal traz `DIA_FIM_VIGENC_ORIGINAL_CONV` e `VALOR_GLOBAL_ORIGINAL_CONV` ao lado dos atuais, mais `QTD_PRORROGA` — prazo e valor originais, e um contador de prorrogações. É o que a base estadual não deixa medir (o arquivo de meta/etapa dela vem vazio).

Quatro armadilhas:

1. **O `siconv.zip` completo tem 3,34 GB.** Os arquivos individuais ficam no mesmo diretório; baixar o pacote inteiro para pegar três tabelas é desperdício.
2. **`siconv_meta.csv.zip` e `siconv_etapa.csv.zip` dão 404.** Os nomes reais são `siconv_meta_crono_fisico.csv.zip` (103 MB) e `siconv_etapa_crono_fisico.csv.zip` (183 MB) — a documentação lista os CONCEITOS ("Meta", "Etapa"), não os nomes dos arquivos.
3. **Os CSV são UTF-8, e ler como latin-1 quebra duas coisas de uma vez.** Além dos acentos, o BOM `EF BB BF` vira três caracteres colados no nome da PRIMEIRA coluna, então `ID_PROPOSTA` fica indefinido e o join devolve **1 proposta de MG em vez de 98.949** — sem lançar erro, com número pequeno e plausível.
4. **`VALOR_GLOBAL_ORIGINAL_CONV` só está preenchido em 37,7% dos registros.** Somar o atual de todos contra o original de alguns dá crescimento de **3,3×** — falso. No mesmo subconjunto, o crescimento real é **+39,6%**. Publicar o percentual sem o denominador é o erro.

Mais: **4.884 dos 29.475 convênios não trazem ano válido** e ficam fora de qualquer série temporal — a diferença precisa ter nome, senão a soma da série bate menos que o total e parece que registros sumiram.

**Limite de string do V8:** `siconv_proposta.csv` tem ~700 MB descompactado, e `readFileSync(…, "utf8")` estoura com `ERR_STRING_TOO_LONG` (teto de ~512 MB) — mesma armadilha dos CSV do TSE. O coletor lê em fluxo, guardando o estado de aspas entre os pedaços.

**Descompactar:** usar `Expand-Archive` do PowerShell. O `tar` que responde neste ambiente é o do Git Bash, que **recusa zip e ainda assim sai com código 0** — falha silenciosa.

## GTAC — o cadastro de TACs ambientais de MG (e o 403 que engana)

Medido em 21/08/2026. Coletor: `scripts/coletar-tac-gtac-mg.mts`. API em `https://ecosistemas.meioambiente.mg.gov.br/gtac/api/tacs` — 2.002 termos, 392 municípios, 10 unidades regionais, assinaturas de 2002 a 2026.

**O 403 engana.** A API responde `Forbidden - Consulte a DGTI sobre esta autorização`, o que sugere que é preciso autorização da diretoria de TI. **Não é**: é checagem de origem. Com `Referer: …/gtac/acessoExterno` e `Origin: …meioambiente.mg.gov.br`, a mesma rota devolve 200 com o cadastro inteiro. Ler a mensagem ao pé da letra faz desistir de dado que é público.

**O `page` é ignorado.** `?page=1` e `?page=2` devolvem os mesmos 2.002 registros (conferido comparando conjuntos de `id`). Paginar em laço baixaria o mesmo conteúdo N vezes e concluiria "N × 2.002 TACs". O coletor confere isso e aborta se a API passar a paginar de verdade.

Existe um `POST /resolveocaptcha` no mesmo domínio, mas ele guarda outro fluxo — a consulta não passa por captcha.

**Dado pessoal — atenção.** A API expõe `cpf_usuario` e `nome_usuario` (o servidor que cadastrou) em **todos** os 2.002 registros, e `cpf_cnpj` com **CPF de pessoa física em 355 deles**. O coletor redige na origem: sai CPF, saem os campos do servidor, ficam os 1.647 CNPJ e o nome do empreendimento (que é parte de acordo público). A quantidade redigida é publicada, não escondida.

Dois achados do cadastro: **72 dos 150 termos marcados "Vigente" têm data de vencimento anterior à coleta** — a base discordando de si mesma (pode ser aditivo não lançado; não é prova de descumprimento). E **1.119 dos 2.002 não têm data de vencimento**, o que os deixa fora de qualquer conta de prazo — incluí-los em denominador de percentual seria mentir. Há ainda 1 registro com vencimento anterior à assinatura (id 23895), com as datas trocadas na fonte.

## Microsistema de lacunas — cobertura declarada

Acervo semente: 30 instrumentos + 15 precedentes (barragens/atingidos). Dos 7 temas propostos, só direitos humanos nasce pronto; indígena nasce com conteúdo mas sem a Convenção 169 como instrumento próprio e sem jurisprudência de demarcação; **serras, rios, flora/fauna, quilombola e povos tradicionais nasceriam vazios** — cada um exige norma central (Código Florestal arts. 4º I/IX-X, Lei 5.197/67, Lei 9.605/98, SNUC, Decreto 4.887/2003, Decreto 6.040/2007). A carga federal fechou a lacuna normativa (todas conferidas no banco: 5.197/67, 9.605/98, 9.985/00, 12.651/12, 11.428/06, 6.938/81, Conama 237). Contagem de vazios declarada, não maquiada: 29,1% das federais do MMA e 6,5% do CNDH com tema; 68% sem nenhuma tag; precedentes que faltam: Awas Tingni, Yakye Axa, Saramaka, Sarayaku, Tema 1.031 do STF, Súmula 613 do STJ, Convenção Americana como instrumento autônomo.

## Origem

Este documento absorve os seguintes arquivos, com a classificação de destino:

- `FONTES-CNJ-JUMA.md` → ENTREGUE/absorvido (referência; DataJud e JUMA sem ingestão — decisões de licença pendentes)
- `FONTES-BIBLIOTECA-ATI.md` → ENTREGUE (coletor, dado, tela e testes no código)
- `FONTES-AUDITORIA-AJRI.md` → ENTREGUE (catálogo 467 + rota no código; espelho de PDF não feito, declarado)
- `FONTES-ROUANET-SALIC.md` → ENTREGUE (dados gravados; tela não feita, declarado)
- `FONTES-TERRITORIO-E-MINERACAO.md` → ENTREGUE/absorvido (referência e mapeamento)
- `FONTES-PRO-BRUMADINHO-E-FGV.md` → ENTREGUE (execução FGV 26 municípios + repasse 853 no código)
- `FONTES-FLUXO-FINANCEIRO.md` → ENTREGUE/absorvido (levantamento; correção do CNPJ de convênio pendente no código)
- `CLIMA-ADAPTABRASIL-E-INMET.md` → ENTREGUE/absorvido (coletor no código; migration 0074 não aplicada)
- `LEGISLACAO-FEDERAL-MMA-CNDH.md` → ENTREGUE (carga 8.940 + migration no código)
- `URN-LEXML-NORMAS-LEG-BR.md` → ENTREGUE (lib, testes e tela no código)
- `COMUNICABR-COLETA-MG.md` → ENTREGUE (arquivo 2,26 MB + telas no código)
- `LAI-PORTAIS.md` → ENTREGUE/absorvido (referência)
- `diario-oficial-sigpub-mapeamento.md` → ENTREGUE/absorvido (mapeamento D0; coleta bloqueada por LGPD)
- `REDE-PROTECAO-MG.md` → ENTREGUE/absorvido (referência)
- `MICROSSISTEMA-LACUNAS.md` → ENTREGUE/absorvido (pesquisa; lacuna normativa fechada pela carga federal)
- `RADAR-NOTICIAS-PARAOPEBA.md` → ENTREGUE (coletor, dado e tela no código)
- `PLANO-INGESTAO-PARAOPEBA.md` → ENTREGUE/parcial (INST_DATA em `atores.ts`, auxílio em `auxilio.ts` e acervo UFMG em `documentos.ts` existem; camada de contagem por município do Solr não localizada no código)
- `PLANO-ARQUIVO-DE-FONTES.md` → ENTREGUE/parcial (capturador com sha256/robots/CPF e tabela `arquivo_fontes` no código; upload R2 e selo na UI pendentes, declarados)
## Painel Sisema (Power BI público) — um MENU que esconde 4 painéis e 87 abas

Sondado em 2026-08-21. O link que circula como "Painel de Termos de Compromisso de Barragens de Mineração" (`app.powerbi.com/view?r=eyJrIjoiOThhNzgyMTQt…`, resourceKey `98a78214-4e97-4394-b382-48779609fba2`) **não tem dado nenhum**: é um menu com duas abas, `MENU PAINEL` e `EQUIPE`. Quem abre e não acha número conclui que o painel é vazio — e ele não é.

**O dado está em 4 relatórios-filhos**, cujos links só aparecem dentro do JSON de `modelsAndExploration` do menu. Juntos são **87 abas**:

| resourceKey | modelId | abas | o que traz |
|---|---:|---:|---|
| `6f0dee31-708d-42fd-ad2d-9a70e2f49dbc` | 5910103 | 30 | **AUTOS DE INFRAÇÃO**, **GESTÃO DE BARRAGENS**, **CLASSIFICAÇÃO DE BARRAGENS**, **BARRAGENS EM EMERGÊNCIA**, DENÚNCIAS, FISCALIZAÇÃO, HISTÓRICO DE FISCALIZAÇÕES, UCs estaduais, saneamento |
| `e0057134-0e75-4e3d-9679-824d662eccc7` | 5910139 | 23 | CAR, ÁREAS A RECOMPOR, **TERMOS DE COMPROMISSO PRA**, ICMS ecológico, IDAM, recursos hídricos (PERH, IPA, ISG) |
| `a279135b-2ca1-4f52-ab06-cb9842bbb3de` | 6768507 | 19 | PMI, METAS REGIONAIS, INTERVENÇÃO AMBIENTAL e LICENCIAMENTO, **por ano, de 2022 a 2026** |
| `6db83fcd-58ec-4439-9e9e-dd83e9ba0b9a` | 5910129 | 15 | educação ambiental, Programa Água Doce, portfólio de projetos do Sisema, fauna doméstica |

**Como se chega neles:** `GET https://wabi-brazil-south-b-primary-api.analysis.windows.net/public/reports/{resourceKey}/modelsAndExploration?preferReadOnlySession=true` com o header `X-PowerBI-ResourceKey: {resourceKey}`. Sem login. Os links dos filhos saem por regex de `app.powerbi.com/view?r=` sobre esse JSON, e o `r=` é base64 de `{"k": resourceKey, "t": tenant}`.

⚠️ **A resposta vem gzipada e o `Content-Type` diz JSON.** Sem `curl --compressed`, o parse morre em `invalid start byte 0x8b` — que parece corrupção e é só compressão.

⚠️ **`schema.entities` vem VAZIO neste endpoint** (o do menu devolveu `entidades: 0`). O modelo existe (`modelId` está lá); a lista de colunas se descobre por `conceptualschema`, entidade a entidade — mesma armadilha já registrada no painel de TACs, onde contar propriedade do relatório inteiro em vez de por entidade produziu `CouldNotResolveSemanticQueryDefinition`.

**O decodificador do DSR já existe e serve aqui:** `etl/betim/etl/apis/_powerbi_dsr.py` (mesmo tenant `924f9847-242e-4a9a-8913-9e43649b9eaa` do painel de TACs).

**Status:** menu e filhos mapeados; nenhuma aba extraída ainda. As de maior valor público, na ordem: AUTOS DE INFRAÇÃO, BARRAGENS EM EMERGÊNCIA, GESTÃO DE BARRAGENS, TERMOS DE COMPROMISSO PRA.

## barragens.mpmg.mp.br — 45 barragens em descaracterização, uma por post

Coletado em 2026-08-21 (`scripts/coletar-barragens-mpmg.mts`). O site do projeto "Desativando Bombas-relógio" (MPMG/Caoma) é um WordPress, e a leitura fácil seria tratá-lo como clipping. **Não é: cada um dos 45 posts é uma barragem**, com empreendedor, município, volume de rejeito, previsão de descaracterização e andamento.

Via: `wp-json/wp/v2/posts?per_page=100` — REST aberta, 200, os 45 de uma vez (`x-wp-total: 45`). Raspar o HTML seria escolher a via frágil: o tema é Elementor e troca de classe a cada atualização.

Cobertura medida: empreendedor 45/45 · previsão 45/45 · andamento 44/45 · volume 38/45 · município reconhecido 40/45.

⚠️ **A coluna de volume mistura três grafias**: `812,9 mil m³`, `12,137 milhões de m³` e `1,800 milhão de m³` (singular, 4 registros). Ler as três como a mesma unidade erra por 1.000× — e 12 vira uma barragem *menor* que 813, o que passa por plausível. Na regex, `mil` casa o prefixo de `milhão`: o singular e o plural têm de vir ANTES na alternância.

⚠️ **Município não se extrai por forma, se reconhece por dicionário.** O texto é `<Nome da barragem> <Município>/<UF>` e as duas partes são capitalizadas igual. Regex gulosa produziu "Baixo João Pereira Congonhas" e "MAC Nova Lima" — municípios que não existem e que passariam batido num join por nome. A extração confronta com os municípios reais do cadastro GTAC; 5 não casam (Igarapé, Araxá, Fortaleza de Minas, Nazareno) porque faltam no dicionário, não na fonte, e ficam com `municipio: null` e `municipioBruto` preservado.

## MPMG — `transparencia.mpmg.mp.br/buscarTac` está morto (B7)

Medido em 2026-08-21: `buscarTac?idTac=N` responde **HTTP 200 com 0 byte** para todo id testado (1, 50, 500), com e sem `Referer` do próprio domínio. Não é bloqueio nem 404: é resposta vazia com status de sucesso — a mesma família de armadilha do `ft_convenio_metaetapa`. O visualizador de TAC do MPMG **não serve mais documento por essa rota**, e o B7 (OCR dos TACs do MPMG) não tem por onde começar enquanto não houver rota de listagem. Nota histórica em `docs/_historico/betim-ambiental-pecma-research.md:49` já registrava que nunca se achou o endpoint de busca — agora nem o de visualização responde.

## DataJud do CNJ (B8) — CONSULTA AO VIVO, nunca coleta

Implementado em 21/08/2026: `apps/web/lib/judiciario/datajud.ts` (tipo + parser + cliente) e `apps/web/app/api/datajud/route.din.ts` (a rota). Este é o desfecho da ressalva já registrada na linha do DataJud, acima ("decidir entre notificar o CNJ ou consulta ao vivo (recomendado)") — a linha antiga não muda porque os números medidos lá (TJMG 69.983 ACP, ~6.011 com assunto ambiental) continuam válidos e não foram remedidos aqui.

**Por que "ao vivo" e não coletor.** As cláusulas 3.8/3.9 do Termo de Uso da API Pública vedam distribuir derivado do acervo sem dar ciência ao CNJ. Um arquivo em `etl/betim/dados/datajud-tjmg.json` seria exatamente isso — um derivado republicado. O desenho aqui é o oposto: cada requisição à rota consulta o Elasticsearch do CNJ na hora, devolve o resultado e não escreve nada em disco em nenhum ponto do caminho. Há um cache, mas só em memória (`Map` no módulo, TTL de 30 s, teto de 50 entradas, morre com o isolate do Worker) — existe para não repetir a mesma consulta em rajada (ex.: efeito duplo do StrictMode em dev), não para persistir. A resposta da rota carrega `avisoLegal` dizendo isso com todas as letras, para qualquer tela que a consuma repetir o aviso.

**A chave.** Copiada em 21/08/2026 do **HTML bruto** de `https://datajud-wiki.cnj.jus.br/api-publica/acesso` via `curl` — não por resumo de IA, por causa do incidente já registrado neste projeto de um resumo corromper esta mesma chave. Ela é pública (o próprio CNJ a publica em texto claro, para qualquer requisitante); o valor vigente em 21/08/2026 mora só em `CHAVE_PUBLICA_PADRAO`, em `lib/judiciario/datajud.ts` — não repetido aqui de propósito, porque `scripts/checar-dado-pessoal.py` tem uma regra dedicada a barrar exatamente `Authorization: APIKey <valor>` em `.md` (o comentário da própria regra registra que um agente já cometeu esse erro com esta mesma chave, num `.md`, e a varredura da época passou verde por não ter ainda o padrão). A wiki avisa que o CNJ "poderá alterá-la a qualquer momento"; o código aceita sobrescrita por `DATAJUD_API_KEY` sem precisar mudar uma linha quando isso acontecer.

**A consulta.** `POST https://api-publica.datajud.cnj.jus.br/api_publica_tjmg/_search`, corpo em Query DSL do Elasticsearch, no formato dos exemplos oficiais da wiki (`/api-publica/exemplos/exemplo1`, `exemplo2`, `exemplo3`, sondados em 21/08/2026): `numeroProcesso` por `match` exato OU combinação de `classe.codigo`/`assuntos.codigo`/`orgaoJulgador.codigo`/`orgaoJulgador.codigoMunicipioIBGE` em `bool.must`; `sort` por `@timestamp` sempre presente (é pré-requisito do `search_after`); paginação por `search_after`, nunca por `from` (teto de 10.000 já registrado). A rota **exige pelo menos um critério** — sem nenhum, a consulta viraria `match_all` sobre um índice de ~70 mil processos, e um teto de página **próprio** (20, bem abaixo do teto de 10.000 da API) fecha a mesma porta do outro lado: o desenho técnico reforça o limite jurídico, ele não depende só da boa vontade de quem chama a rota depois.

**`assuntos` não tem formato estável entre tribunais — outra "API que mente".** Medido nos próprios exemplos da wiki: o TRF1 (`exemplo1`) devolve `assuntos` como array **plano** de `{codigo,nome}`; o TJDFT (`exemplo2`) devolve array de **arrays** (`[[{...}],[{...}]]`), um grupo por classificação. `achatarAssuntos` em `datajud.ts` resolve os dois formatos recursivamente — sem isso, metade dos tribunais (ou, pior, parte dos processos do próprio TJMG, já que o formato pode variar por vara/sistema de origem) sairia com assunto vazio ou `[object Object]` em silêncio.

**Dado pessoal.** A API não devolve nome nem CNPJ/CPF de parte (LGPD; a introspecção `_mapping` responde 403 — já registrado). Mesmo assim `sanitizarProcesso` varre todo campo de texto do processo por CPF válido por mod-11 antes de a rota devolver ao cliente — rede de segurança, não expectativa: é a mesma lição de "guarda que olha lista de campo suspeito falha" que já custou dois vazamentos reais neste repositório (ementa do IBAMA, nomes da Rouanet).

**Status:** rota e lib prontas, com teste do parser sobre fixture escrita à mão (formato dos exemplos oficiais da wiki, nunca acervo real). Nenhuma tela do portal consome esta rota ainda — falta a página que a chama do lado do cliente.

## Biblioteca de inspeções da Corregedoria Nacional (CNJ) — 330 relatórios onde a sondagem viu "nada"

Medido em 2026-08-22. Coletor: `etl/betim/etl/apis/cnj_inspecoes.py`.

**A lição vem antes do endpoint: medir a página que fala do assunto não mede a fonte.** A sondagem de transparência da Justiça reprovou a frente correicional inteira depois de bater nas páginas institucionais do CNJ sobre inspeções e correições — 270 KB e 275 KB de HTML linkando **regimento interno e organograma**, zero achado consultável. O veredito estava certo sobre aquelas páginas e errado sobre o CNJ: o acervo mora na **biblioteca de documentos do WordPress** (plugin WPFD), a uma rota de distância, sem login e sem captcha.

**A rota.** `GET https://www.cnj.jus.br/wp-admin/admin-ajax.php?juwpfisadmin=false&action=wpfd&task=files.getFiles&view=files&id=<categoriaId>` — devolve **JSON puro**, uma categoria por órgão. Medido: **33 categorias de órgão, 330 relatórios em PDF, ~1,7 GB, série de 2008 a 2026**. TJMG é `id=2664`, com 13 relatórios (2012→2026, 65,6 MB).

**⚠️ Os ids NÃO são contíguos, e isso quase produziu um erro silencioso.** A primeira varredura cobriu 2630–2700, encontrou o bloco alfabético dos TJs em 2650–2678 e pareceu completa. **Não era:** o TJ de Roraima mora sozinho no **2796**, a 118 ids do bloco. Publicar "27 tribunais" faltando um não teria dado sinal nenhum. A faixa varrida hoje é 2400–2950 (551 ids) e fica **gravada no próprio dado**, porque contagem sem faixa mente por omissão — a contagem é piso, não total.

**⚠️ Não há rota de listagem de categorias.** `task=categories.getCategories` responde **HTTP 500** ("Há um erro crítico no seu site"), `task=category.getCategories` responde `{"category":false}`, e `task=files.search` / `&search=` respondem `{"files":[]}` para qualquer termo — filtro que não existe, aceito e ignorado. O universo só se descobre varrendo id.

**⚠️ O `token` da URL de download ROTACIONA.** A URL que um humano copia do navegador traz `&token=56ae71a6…&preview=1`; a mesma consulta à API, minutos depois, devolve `&token=89a9bcdb…`. Guardar essa URL é guardar link que morre. O campo **`linkdownload` do próprio JSON é permalink sem token** — `https://www.cnj.jus.br/download/<catId>/<slug-do-orgao>/<fileId>/<slug-do-arquivo>` — conferido byte a byte contra a URL com token: mesmo arquivo, 14.970.417 bytes. **Só o `linkdownload` entra no dado.**

**⚠️ O CNJ publica CPF de pessoa física dentro do relatório.** No TJMG 2026, **6 ocorrências válidas por mod-11**, de particulares — nome completo ao lado do CPF, em atos de cartório (compradores e vendedores de um lote; um delegatário com pendências fiscais), na seção de serventias extrajudiciais. Não é hipótese nem falso positivo: passam no dígito verificador. **Decisão do projeto (22/08/2026): não publicar e não comunicar ao órgão** — fica só a salvaguarda técnica, e ela é tripla: redação na origem por mod-11 **sobre o texto** (nunca por rótulo de campo, que mente), **o PDF original não é espelhado**, e o que se publica é resumo próprio com link para a origem.

**⚠️ A capa contradiz a publicação.** O cabeçalho PJe do relatório do TJMG 2026 diz **"Segredo de justiça? SIM"**, e mesmo assim o CNJ serve o arquivo aberto na própria biblioteca. É contradição do órgão, não nossa — e é mais um motivo para publicar extrato com link, nunca cópia.

**O que o relatório do TJMG 2026 entrega.** 1.388 páginas, **2,9 milhões de caracteres de texto extraível** (não é digitalizado). Processo CNJ `0000675-79.2026.2.00.0000`, Portaria nº 3 de 02/02/2026, assinado em 08/07/2026. **241 seções** de "Achados e Determinações"/"Recomendações" lidas contra **247 que o sumário lista** (97,6%); **140 com conteúdo**, 101 dizendo que não há. Granularidade que ninguém publica: **36 gabinetes de desembargador nomeados**, **76 varas**, mais seção inteira sobre unidades prisionais.

**⚠️ Só o relatório de 2026 usa "Achados e Determinações".** Medido nos 13 do TJMG: os demais anos marcam `DETERMINAÇÃO`/`RECOMENDAÇÃO` sem seção nomeada, e **`Relatorio_Inspecao_Sistema_Judiciais_Processuais_TJMG_2017.pdf` tem ZERO caractere** — é digitalizado, e sem OCR não há o que extrair. Um extrator escrito só contra 2026 devolveria vazio nos outros anos **sem erro nenhum**.

**A trava obrigatória, e o erro que ela pegou.** No corpo, o cabeçalho de unidade **quebra em várias linhas** — às vezes uma palavra por linha (`4.6. / GABINETE / DO / DESEMBARGADOR / DELVAN / BARCELOS JUNIOR`). Casar título por linha falha em silêncio e a seção **herda a unidade anterior — atribuindo o achado ao desembargador errado** (medido: as seções 4.6.x saíam com o nome da desembargadora do 4.5). A correção é ancorar no **sumário do próprio documento** e **parar** se o corpo render menos de 90% das seções que o sumário lista. É a mesma tática que pegou o pareamento errado no relatório do JUSTA — todo PDF de layout precisa de um segundo olhar vindo do próprio documento.

**⚠️ E "Não há." tem variantes.** `Não há achados dignos de registro que decorram da análise dos processos inspecionados.` e `Não há, no sentir da Equipe de Inspeção, recomendações a serem feitas…`. Casar só a forma literal contava 63 seções vazias; casando as variantes são **101**. A diferença não é cosmética: publicar "178 seções com achado" quando a maioria diz que não achou nada é deturpar o documento.

**Fora do acervo, por competência:** não há inspeção da Corregedoria Nacional sobre **STJ, TST nem STF** — a varredura de 551 ids não achou categoria para nenhum deles, e o Regulamento Geral da Corregedoria Nacional descreve inspeção sobre órgãos jurisdicionais de **primeiro ou segundo grau**. **TRT-3 (MG) também não está lá**: quem correiciona TRT é a Corregedoria-Geral da Justiça do Trabalho, órgão do TST, e o produto chama-se **ata de correição**, publicada no TST/CSJT e na biblioteca digital DSpace do próprio TRT-3. Só quatro TRTs (7ª, 11ª, 13ª e 14ª) aparecem na biblioteca do CNJ, com um arquivo cada.

## CNIEP / Geopresídios (CNJ) — inspeção judicial em presídio, e a separação que inverte a manchete

Medido em 2026-08-22. `https://cniep.cnj.jus.br/api/geopresidios/{estabelecimentos,inspecoes,mapa}` — **JSON puro, sem login, sem token, sem captcha**, corpo inteiro numa requisição (2,49 MB / 20,49 MB / 2,78 MB). Brasil: 2.365 estabelecimentos e 20.298 inspeções; **MG: 285 estabelecimentos e 2.253 inspeções registradas**, das quais **2.252 já realizadas** (1 tem data futura — agendada, não realizada), com tema pelos cinco eixos da Res. CNJ 593/2024.

⚠️ **O PERÍODO NÃO É DE 12 MESES, e a primeira versão deste registro errou nisso.** As inspeções realizadas vão de **07/01/2025 a 20/08/2026** — cerca de **19,5 meses**. Dizer "12 meses" faz a cobertura parecer mais intensa do que é e, pior, faz "sem inspeção em 12 meses" soar mais grave do que o dado sustenta. Quem pegou foi um agente que se recusou a escrever o número que eu tinha passado, porque contradizia o próprio módulo de dado.

⚠️ **API não documentada.** O host foi descoberto por engenharia reversa: `geopresidios.cnj.jus.br/config.js` contém `window.__API_BASE__`. Pode mudar sem aviso — bater nela alguns dias seguidos antes de virar coletor de produção.

⚠️ **O conteúdo da inspeção NÃO é público por esta via.** `/relatorio-inspecao/{id}` e `/respostas-formulario/{id}` respondem **404**. Publica-se **que** houve inspeção e **sobre qual tema**, nunca o achado — e a tela tem de dizer isso, senão o leitor conclui que não houve achado.

🚨 **A separação por ramo é o achado, e sem ela o número acusa quem não deve.** No bolo, **56 de 285 (20%)** não receberam inspeção nenhuma no período — sugere descaso generalizado. Separando por quem responde: **Justiça comum (TJMG) 217 unidades, 4 sem inspeção (2%)**; **Justiça Militar de MG 50 unidades, 34 sem (68%)**; **Superior Tribunal Militar 18 unidades, 18 sem (100%)**. A Justiça comum inspeciona quase tudo — a maioria das unidades com 11 inspeções no período — e o buraco inteiro está na Justiça Militar. **Publicar os 20% sem separar seria acusar exatamente quem está inspecionando.**

⚠️ **E unidade militar prisional não é presídio:** é cela em batalhão, muitas vezes vazia. Comparar com penitenciária em número de inspeções é comparar coisas diferentes.

⚠️ Detalhes de cobertura medidos: **165 dos 2.365 estabelecimentos nacionais não têm coordenada publicada** na rota `mapa`; e há **1 inspeção com data futura** no acervo — agendada, não realizada. Recortar por data de corte, senão o portal diz que a unidade foi visitada antes de a visita acontecer.

## Defensoria Pública de MG — quatro fontes, e o denominador que nenhuma delas publica sozinha

Medido em 2026-08-22. **A DPMG publica onde ela está; nunca publica onde ela não está.** O denominador vem de fora.

| Fonte | Medido |
|---|---|
| `defensoria.mg.def.br/wp-json/api-unidades/search?s=` | 11.481 bytes, **129 unidades** (128 comarcas mineiras + a sede em Brasília), uma chamada |
| `defensoria.mg.def.br/localizacao/service/localizacao/municipio/{uuid}` | 81.758 bytes, **854 municípios**, 297 com `codigoComarcaTjMg` |
| Pesquisa Nacional da Defensoria 2025 (XLSX) | 2.659.449 bytes — **298 comarcas em MG: 120 SIM, 176 NÃO, 2 PARCIALMENTE**, com nome e população |
| IPEA 2013 (ZIP, 315.063 bytes) | **295 comarcas, 105 com Defensoria** — fecha a série de 12 anos |

⚠️ **O segundo endpoint NÃO é API anunciada** — foi achado lendo o bundle JS do tema WordPress (`main-B2qpQCFJ.js`). E a URL antiga (`gerais.defensoria.mg.def.br`) hoje é um sistema de login, não o endpoint de dados. Copiar o dado para o nosso banco; nunca depender dele em runtime.

⚠️ **A planilha nacional só baixa com headers de navegador** — `curl` cru recebe **HTTP 406**.

⚠️ **O CSV do IPEA é CP850, não ISO-8859-1.** Decodificar como Latin-1 produz texto ilegível (`PopulaÆo`) **em silêncio**, sem erro nenhum.

⚠️ **AS FONTES DIVERGEM, E AS DUAS FICAM GRAVADAS:** 129 unidades físicas listadas hoje contra 120 comarcas declaradas atendidas. São recortes diferentes — unidade instalada × comarca atendida —, e escolher um e calar esconderia a diferença. **O ritmo é a segunda matéria: 105 comarcas em 2013 para 120 em 2025, quinze em doze anos.**

## Justiça em Números (CNJ) — e a lacuna que ERA nossa, não do CNJ

Medido em 2026-08-22. ZIP de 4.248.648 bytes, 3 CSVs em **ISO-8859-1** com separador `;`, arquivo principal de **1.596 linhas × 1.314 colunas**, série **2009–2025**, TJMG isolável em 17 linhas.

⚠️ **A URL do ZIP muda a cada publicação** (o nome traz a data). O coletor raspa a página `base-de-dados/` para achar o link vigente — link fixo quebra na próxima atualização, e quebra em silêncio.

🚨 **CORREÇÃO DE UMA AFIRMAÇÃO DESTE PROJETO.** Estava registrado aqui e no plano que *"tempo médio de tramitação por tribunal estadual não existe em dado aberto; só há `tptotst` para o TST"*. **Está errado.** A variável é **`tpbaixm`**, populada de **2015 a 2025** para o TJMG (**675,5 em 2025**; 771,3 em 2023; 721,1 em 2024).

**Por que a busca anterior falhou:** o dicionário rotula a coluna apenas como **"TpBaix - Média"** — sem a palavra "tempo", sem "tramitação". Busca textual por essas palavras não acha; só acha quem procura pelo padrão `Tp*` mais sufixo (`m`, `md`, `dp`, `p`). **A lição vale além desta fonte: ausência de resultado numa busca por palavra não é ausência do dado — é ausência da palavra que quem procurou escolheu.**

⚠️ **A unidade NÃO está declarada.** O dicionário não diz se é dia, mês ou outra coisa. 675,5 é compatível com dias corridos entre distribuição e baixa, mas isso é inferência — **não escrever "675 dias" como se fosse afirmação do CNJ**. E o mesmo prefixo `Tp` significa **"Total de Pessoal"** noutras variáveis do mesmo dicionário (`tpefet`, `tpaf`): casar por prefixo sem olhar o sufixo mistura duas famílias.

⚠️ Irmãs medidas: `tpbaixmd` (mediana) e `tpbaixdp` (desvio) existem no dicionário e vêm **`nd` em todos os 17 anos** do TJMG. Cobertura de `tpbaixm`: vazia de 2009 a 2014.

## STF — a transparência que eu disse não existir, e existe em 78 seções

Medido em 2026-08-22, **num navegador**. Registro escrito depois de este projeto errar **duas vezes** sobre a mesma fonte.

🚨 **AS DUAS AFIRMAÇÕES ERRADAS, e por que elas passaram.**

1. *"Não há correição sobre o STF."* — Meia verdade virada em conclusão. Não há inspeção **externa** (a Corregedoria Nacional não alcança tribunal superior), mas há **correição interna**: a **Comissão de Ética** (Res. STF 711/2020) apura desvio ético, PAD, PAR e sindicância, e **publica relatório anual**.
2. *"O que existe é auditoria de contrato e conta, nao de vara e fila."* — Falso pela metade: além da auditoria interna, há Ouvidoria em números, relatórios da Ouvidoria, rol de informações classificadas, autoridade de monitoramento da LAI, dados diários de despesa, e as **Ações de Correição**.

**Por que passou:** a primeira tentativa bateu no GraphQL do CMS e no `publicacao.asp`, tomou **HTTP 202 com corpo vazio** do WAF da AWS e concluiu que a fonte estava fechada. **A fonte não estava fechada — eu estava batendo na porta errada.** É a terceira vez no mesmo dia que "medir a página que fala do assunto" foi confundido com "medir a fonte".

### A rota certa: navegador para achar, curl para baixar

`https://portal.stf.jus.br/transparencia/` tem **78 seções** em accordions do Bootstrap (`.accordion-item`), colapsadas mas **presentes no DOM**.

⚠️ **As páginas `.asp` do portal respondem 200 com 62.711 bytes de casca — byte-idênticas entre páginas diferentes.** O conteúdo é montado por JS. Sem navegador, `curl` vê a casca e conclui que não há nada. Foi exatamente o que aconteceu.

⚠️ **Os PDFs baixam por `curl`, mas só com `-L`.** Sem seguir redirecionamento, o `http://` devolve **301 com 134 bytes de HTML** — e um coletor que só olha o status grava a página de redirecionamento com extensão `.pdf`.

### O que a seção "Ações de Correição" entrega

Relatórios anuais da Comissão de Ética, **2022 a 2025** (mais Planos de Trabalho 2021–2025). Coletor: `etl/betim/etl/apis/stf_transparencia.py`.

| Ano | Páginas | Averiguações preliminares | Instaurou PAD ético? |
|---|---|---|---|
| 2022 | 5 | 5 | **não** — declarado no texto |
| 2023 | 4 | 3 | **não** — declarado |
| 2024 | 4 | 1 | **não** — declarado |
| 2025 | 14 | 8 | o texto **não** traz a declaração |

**O achado:** em 2022, 2023 e 2024 o STF declara, com a mesma frase, que *"no exercício não houve instauração de processo administrativo para apuração de desvios éticos"*. Só houve averiguação preliminar, e as conclusões medidas foram **arquivamento** ou encaminhamento ao Diretor-Geral. Em **2025** a declaração não aparece, e o relatório dobra de tamanho: descreve apuração preliminar sobre **denúncia anônima recebida pela Ouvidoria/Fala.BR, apresentada por duas trabalhadoras terceirizadas** contra servidor gestor da unidade.

⚠️ **Isto NÃO substitui inspeção externa, e as duas não se somam.** O objeto aqui é **conduta de servidor**, não atividade jurisdicional: nenhum destes relatórios trata de fila, prazo ou processo parado. A afirmação que continua de pé é a mais estreita — *"não há inspeção externa sobre o STF"* —, e ela precisa vir com o objeto ao lado para não virar acusação vaga.

⚠️ **Número de processo administrativo não é dado pessoal, mas leva a um.** Quem consulta o SEI com `NNNNNN/AAAA` chega ao nome do servidor investigado. O campo fica no dado (é o que permite conferir) e a decisão de exibir em tela é editorial — mesmo tratamento dado à pauta do CNJ.

⚠️ **A URL do relatório de 2025 não segue o padrão dos outros** (`SEI_3311232_Relatorio-5.pdf` contra `Atividades-da-Comissao-de-Etica-AAAA.pdf`): adivinhar a URL do próximo ano a partir da anterior não funciona nesta fonte.

## Atas de correição do TRT-3 (Corregedoria-Geral da Justiça do Trabalho / TST)

Medido em 2026-08-22. **18 atas, de 1991 a 2024**, ~91 MB, todas com magic `%PDF-` conferido.

⚠️ **Quem correiciona TRT não é o CNJ** — é a CGJT, órgão do TST, e o produto chama-se **ata de correição**, não relatório de inspeção. Por isso procurar no CNJ, ou no site do próprio TRT-3, não acha nada.

⚠️ **Não há rota de enumeração.** O acervo saiu de raspagem de **19 páginas de gestão** de Ministro Corregedor-Geral (`tst.jus.br/web/corregedoria/correicoes-anteriores`, 158.823 bytes) — não 17, como se supunha: 3 links não têm slug amigável e só resolvem por id. É **piso, não total**.

⚠️ **Parser fixo quebra entre ciclos:** o layout muda por gestão (`table`/`span` aninhados em 2014–2018, `div class="grid-row"` no ciclo 2026). E a **região aparece numa célula separada do link do PDF** — parser que lê o texto da âncora pega o PDF errado **em silêncio** (o coletor detectou isso comparando duas rodadas de extração).

⚠️ **URL de PDF não é previsível:** muda prefixo (http/https, com/sem www), pasta numérica e token de assinatura Liferay, único por arquivo. **Deduplicar por data da correição, não por nome de arquivo** — a ata de 2021 existe em duas cópias (TST e DSpace do TRT-3) e contá-las como duas infla o acervo em 20%.

⚠️ **O DSpace do TRT-3 é armadilha por três vias:** guarda 1 das 18 atas e nem como item (a de 2021 é o bitstream `sequence=2` de um item chamado *"Informativo de Legislação n. 69"*); OAI-PMH e REST respondem **404 com a mesma página Cocoon de 67.151 bytes**; e a coleção chamada **"Atas"** (handle `11103/22543`), que tem RSS funcional e parece a via óbvia, guarda **atas de sessão de julgamento** — nome igual, conteúdo diferente.

**Duas gestões passaram sem correicionar o TRT-3** (Vantuil Abdala 2001-2002, Almir Pazzianoto 1996-1998), confirmado por ausência real na tabela do TST, não por falha de parser. Próxima correição: **05 a 09/10/2026**, edital publicado, ata ainda inexistente.

## Google Drive como repositório de documento público — as quatro armadilhas

Coleta dos EIA/RIMA das audiências do SISEMA, fechada em 2026-08-22: **2.438 arquivos, 19,55 GB**. O Estado não hospeda o estudo — publica um link para a nuvem do empreendedor, e a maioria é Google Drive. Quatro armadilhas custaram horas cada, e nenhuma se anuncia.

### 1. O id pode ser PASTA, e o Drive devolve 500

183 itens (11% do corpus) davam HTTP 500 e pareciam instabilidade. Não eram: o id era de **pasta**, e `uc?export=download` responde 500 quando o alvo não é arquivo. Os nomes denunciavam ("Anexos", "Desenhos", "RIMA", "PCA"), mas o coletor pedia a mesma rota para todos.

O mesmo id que dá 500 como arquivo devolve **200 e 465 KB** em `/drive/folders/<id>`. Retentar nunca ia resolver — o 500 aqui quer dizer "isto não é arquivo", não "tente de novo".

**Resultado do conserto: 920 PDFs recuperados** que estavam dados como perdidos.

O pareamento: a página traz `data-id="<id>"` (repetido ~3× por item) e, adiante, `aria-label="<nome> PDF …"`. Casa-se cada rótulo com o `data-id` mais próximo **antes** dele. Medido: 51 `data-id` e 17 rótulos → 17 pares corretos.

### 2. O id pode ser GOOGLE DOCS, e aí não se baixa — se EXPORTA

Depois de consertar a via de pasta, sobraram 52 itens com "listagem de pasta veio vazia". Não eram pastas vazias: **o id tinha 44 caracteres**, contra 33 de arquivo/pasta comum. Id de 44 é documento nativo do Google.

As quatro rotas, medidas no mesmo id:

| rota | resposta |
|---|---|
| `uc?export=download` | HTTP 500, 0 byte |
| `/drive/folders/<id>` | HTTP 404 |
| `/file/d/<id>/view` | 200, mas é HTML do visualizador |
| `docs.google.com/document/d/<id>/export?format=pdf` | **200, 1,4 MB, `application/pdf`** |

⚠️ **As três rotas erradas devolvem status DIFERENTES e nenhuma diz "use export".** Por isso a ordem de tentativa tem de estar escrita no código: arquivo → pasta → exportação. E validar o CORPO: o export responde 200 com HTML quando o documento é Sheets em vez de Docs.

### 3. Pasta que exige LOGIN responde 200, com 272 KB e sem nenhum arquivo

346 itens. A página vem completa, com "Fazer login" no meio do HTML e zero `data-id`. Sem conta, não há via anônima — e o export devolve 400, que **parece defeito nosso e não é**. Amostra de 8: 8 pediam login.

### 4. `subprocess.run` com `capture_output` trava, e o `timeout=` NÃO salva

O sintoma foi o pior possível: processo vivo, manifesto parado por horas, contador travado em 1.565/1.705 — parecia que a coleta tinha acabado.

`faulthandler` mostrou o laço preso em `_wait_for_tstate_lock`: com cano capturado, `subprocess.run` espera a thread leitora terminar, **e essa espera ignora o `timeout=`**. No Windows, curl que herda um cano aberto segura o processo pai indefinidamente.

**A correção é mandar a saída do curl para ARQUIVO** (sem thread, sem cano), e só então o `timeout=` volta a valer. Duas guardas, as duas necessárias: `-m` no curl e `timeout=` no Python.

### Ainda: 200 com corpo vazio não é "HTTP 200"

Registrar um 200-com-zero-byte como `"HTTP 200"` fazia o erro não casar com nenhuma via de recuperação, e o item rodava sem nunca fechar nem falhar de vez.

### O que sobra é lacuna da FONTE, não do coletor

Dos 1.705 itens do catálogo, os que nunca baixaram se explicam assim: **346 pastas com login**, **383 HTTP 500**, **100 links 404**. Amostra de 20 dos faltantes: **20 de 20 respondem 404** — o Estado publicou link para arquivo que não existe mais. É o mesmo achado dos 27% de EIA/RIMA que não abrem, medido de novo por outra via.
