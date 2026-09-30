# Revisao das respostas prefixadas do Seu Nono (2026-09-30)

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-30
> **Leitura estimada:** longa (> 15 min)
> **Relacionados:** [PLANO-RAG-COMPLETO.md](PLANO-RAG-COMPLETO.md), [PLANO-COMPANHEIRO-SEU-NONO.md](PLANO-COMPANHEIRO-SEU-NONO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** seu nono, curadas, respostas prefixadas, rag, revisao, eixos, subfrentes

## Sumário

- [Propósito](#propósito)
- [Como foi gerado](#como-foi-gerado)
- [Entradas](#entradas)

## Propósito

As respostas prefixadas dos 4 eixos ficaram defasadas em relacao ao acervo
atual. Este doc traz, por pergunta, a resposta ATUAL (prefixada) e a resposta
NOVA, gerada pelo RAG sobre o acervo de hoje, com as fontes. Nada e aplicado
no codigo sem revisao do dono — numero errado e dano.

## Como foi gerado

Script `apps/web/scripts/regerar-curadas.mts`, rodando o RAG local
(Ollama + nomic-embed-text) sobre o acervo montado em codigo. Cada resposta
nova cita `[n]`, e as fontes sao listadas por entrada.

## Entradas

### Eixo 1 — Direitos em Movimento — Trabalho e Renda

**Pergunta:** Como consultar contratações e demissões no CAGED?  `(emprego-caged)`

**Resposta atual:** O painel de Trabalho e Renda monitora admissões e desligamentos do CAGED por município, demonstrando o saldo formal de vagas.

**Resposta nova (qwen3-vl:4b-instruct):** Para consultar contratações e demissões no CAGED, use o painel de Trabalho e Renda, que monitora admissões e desligamentos por município e demonstra o saldo formal de vagas [1].

**Fontes:** Como consultar contratações e demissões no CAGED? (/direitos-em-movimento/trabalho-e-renda) · Como estão as contratações e empregos formais na cidade? (/direitos-em-movimento/trabalho-e-renda) · Emprego formal e controle social: vagas do CAGED e a força dos 710 conselhos municipais (/noticias/trabalho-renda-e-conselhos-de-direitos)

### Eixo 1 — Direitos em Movimento — Trabalho e Renda

**Pergunta:** Qual o impacto dos contratos públicos na renda do trabalhador?  `(renda-local)`

**Resposta atual:** Cruzamos contratos e compras públicas com postos de trabalho gerados, avaliando o efeito multiplicador da economia local.

**Resposta nova (qwen3-vl:4b-instruct):** O impacto dos contratos públicos na renda do trabalhador é avaliado por meio da cruzamento de contratos e compras públicas com postos de trabalho gerados, analisando o efeito multiplicador da economia local [1].

**Fontes:** Qual o impacto dos contratos públicos na renda do trabalhador? (/direitos-em-movimento/trabalho-e-renda) · Emprego formal e controle social: vagas do CAGED e a força dos 710 conselhos municipais (/noticias/trabalho-renda-e-conselhos-de-direitos) · Como consultar contratações e demissões no CAGED? (/direitos-em-movimento/trabalho-e-renda)

### Eixo 1 — Direitos em Movimento — Saúde Pública & SUS

**Pergunta:** Como saber a quantidade de leitos do SUS na minha cidade?  `(leitos-sus)`

**Resposta atual:** O portal monitora o Cadastro Nacional de Estabelecimentos de Saúde (CNES) e a razão de leitos por habitante em comparação com os parâmetros da OMS.

**Resposta nova (qwen3-vl:4b-instruct):** O portal monitora o Cadastro Nacional de Estabelecimentos de Saúde (CNES) para informar a quantidade de leitos do SUS em cada cidade [1].

**Fontes:** Como saber a quantidade de leitos do SUS na minha cidade? (/direitos-em-movimento/saude-publica) · Como fiscalizar as 199 cidades estratégicas do Brasil? (/cidades) · Saúde e educação básica: raio-x de leitos hospitalares e desempenho escolar em MG (/noticias/saude-publica-sus-e-educacao-ideb)

### Eixo 1 — Direitos em Movimento — Saúde Pública & SUS

**Pergunta:** Onde consultar a capacidade hospitalar e estabelecimentos CNES?  `(hospitais-atendimento)`

**Resposta atual:** Consulte postos de saúde, UPAs e hospitais municipais com dados oficiais do DataSUS.

**Resposta nova (qwen3-vl:4b-instruct):** Consulte postos de saúde, UPAs e hospitais municipais com dados oficiais do DataSUS [1].

**Fontes:** Onde consultar a capacidade hospitalar e estabelecimentos CNES? (/direitos-em-movimento/saude-publica) · Saúde e educação básica: raio-x de leitos hospitalares e desempenho escolar em MG (/noticias/saude-publica-sus-e-educacao-ideb) · Como saber a quantidade de leitos do SUS na minha cidade? (/direitos-em-movimento/saude-publica)

### Eixo 1 — Direitos em Movimento — Educação & Escolas

**Pergunta:** O que é o IDEB e como ver a nota da minha cidade?  `(ideb-escolas)`

**Resposta atual:** O IDEB avalia o fluxo escolar e o aprendizado em português e matemática apurado pelo INEP para os anos iniciais e finais do ensino fundamental.

**Resposta nova (qwen3-vl:4b-instruct):** O IDEB avalia o fluxo escolar e o aprendizado em português e matemática apurado pelo INEP para os anos iniciais e finais do ensino fundamental [1].

**Fontes:** O que é o IDEB e como ver a nota da minha cidade? (/direitos-em-movimento/educacao) · Como fiscalizar as 199 cidades estratégicas do Brasil? (/cidades) · Como saber a quantidade de leitos do SUS na minha cidade? (/direitos-em-movimento/saude-publica)

### Eixo 1 — Direitos em Movimento — Educação & Escolas

**Pergunta:** Como verificar a infraestrutura das escolas municipais?  `(infraestrutura-escolar)`

**Resposta atual:** Dados do Censo Escolar revelam a presença de bibliotecas, quadras, laboratórios e saneamento nas escolas da rede pública.

**Resposta nova (qwen3-vl:4b-instruct):** Dados do Censo Escolar revelam a presença de bibliotecas, quadras, laboratórios e saneamento nas escolas da rede pública [1].

**Fontes:** Como verificar a infraestrutura das escolas municipais? (/direitos-em-movimento/educacao) · Contratos Públicos com Multinacionais de Tecnologia e Infraestrutura Somam Bilhões no Brasil (/noticias/fornecedores-multinacionais-brasil-ti-infraestrutura) · Como fiscalizar as 199 cidades estratégicas do Brasil? (/cidades)

### Eixo 1 — Direitos em Movimento — Moradia & Habitação

**Pergunta:** Como é medido o déficit habitacional urbano?  `(deficit-habitacional)`

**Resposta atual:** O cálculo envolve coabitação familiar, ônus excessivo com aluguel e habitações precárias mapeadas pelo IBGE e Fundação João Pinheiro.

**Resposta nova (qwen3-vl:4b-instruct):** O déficit habitacional urbano é medido por meio da coabitação familiar, ônus excessivo com aluguel e habitações precárias mapeadas pelo IBGE e Fundação João Pinheiro [1].

**Fontes:** Como é medido o déficit habitacional urbano? (/funcaosocialterra) · Preço dos Combustíveis Revela Fortes Disparidades entre Capitais e Cidades Estratégicas (/noticias/preco-combustiveis-anp-capitais-200-cidades-polos) · ComunicaBR: R$ 139 bilhões da União nos 853 municípios de Minas e 61% de dados vazios (/noticias/comunicabr-repasses-federais-municipios-mg)

### Eixo 1 — Direitos em Movimento — Moradia & Habitação

**Pergunta:** O que fazer diante do risco de remoção forçada?  `(prevencao-remocoes)`

**Resposta atual:** Conheça as diretrizes da Comissão de Conflitos Fundiários e como acionar a Defensoria Pública especializada.

**Resposta nova (qwen3-vl:4b-instruct):** Conheça as diretrizes da Comissão de Conflitos Fundiários e como acionar a Defensoria Pública especializada [1].

**Fontes:** O que fazer diante do risco de remoção forçada? (/direitos-em-movimento/ajuda) · O que fazer se a prefeitura negar ou omitir a resposta de LAI? (/direitos-em-movimento/denuncia) · Como fazer denúncias de desvio de verbas ou dano ambiental? (/direitos-em-movimento/denuncia)

### Eixo 1 — Direitos em Movimento — Acesso à Informação, Conselhos & Denúncias

**Pergunta:** Como fazer um pedido de Lei de Acesso à Informação (LAI)?  `(pedir-lai)`

**Resposta atual:** A Central de Canais LAI reúne 445 entidades: prefeituras, câmaras, órgãos federais e concessionárias de água, energia e telecomunicações com e-mail, telefone, e-SIC e modelo de pedido.

**Resposta nova (qwen3-vl:4b-instruct):** Para fazer um pedido de Lei de Acesso à Informação (LAI), você pode usar os canais disponíveis na Central de Canais LAI, que reúne 445 entidades públicas e concessionárias, incluindo prefeituras, câmaras, órgãos federais e estaduais, com e-mail, telefone, e-SIC e modelo de pedido [1]. Além disso, há um guia passo a passo para protocolar o pedido [2]. Se houver negativa por alegação de sigilo, há um banco de decisões com recursos e súmulas da CGU que obrigam a divulgação [3].

[1] Central de Canais LAI
[2] Como protocolar um pedido de Lei de Acesso à Informação (LAI)?
[3] O que fazer se a prefeitura negar pedido de LAI alegando sigilo?

**Fontes:** Como fazer um pedido de Lei de Acesso à Informação (LAI)? (/direitos-em-movimento/informacao) · Como protocolar um pedido de Lei de Acesso à Informação (LAI)? (/direitos-em-movimento/informacao) · O que fazer se a prefeitura negar pedido de LAI alegando sigilo? (/ambiental/decisoes-lai)

### Eixo 1 — Direitos em Movimento — Acesso à Informação, Conselhos & Denúncias

**Pergunta:** Como pedir desconto de até 65% na conta de energia e água?  `(tarifa-social)`

**Resposta atual:** Famílias inscritas no Cadastro Único (CadÚnico) têm direito à Tarifa Social de Energia (CEMIG, Enel, CPFL, Light, Equatorial) e desconto na água (COPASA, Sabesp, Cedae). Veja tutorial por estado.

**Resposta nova (qwen3-vl:4b-instruct):** Famílias inscritas no Cadastro Único (CadÚnico) têm direito à Tarifa Social de Energia e água, com desconto de até 65% [1]. O processo é o mesmo para energia e água: inscrição no CadÚnico no CRAS mais próximo, com RG, CPF e comprovante de renda. O valor da renda por pessoa é até R$ 218 (meio salário mínimo de 2024) [2]. O Controle Popular reúne passo a passo por estado, incluindo telefones e links oficiais [2].

Fontes usadas:
1. Como pedir desconto de até 65% na conta de energia e água? [1]
2. Tarifa social de energia e água: veja como pedir o desconto em cada estado [2]

**Fontes:** Como pedir desconto de até 65% na conta de energia e água? (/noticias/tarifa-social-energia-agua-como-acessar) · Tarifa social de energia e água: veja como pedir o desconto em cada estado (/noticias/tarifa-social-energia-agua-como-acessar) · Como fazer um pedido de Lei de Acesso à Informação (LAI)? (/direitos-em-movimento/informacao)

### Eixo 1 — Direitos em Movimento — Acesso à Informação, Conselhos & Denúncias

**Pergunta:** Como encontrar o Conselho de Saúde, Meio Ambiente ou Tutelar da minha cidade?  `(conselhos-direitos)`

**Resposta atual:** O portal mapeia 710 conselhos participativos (CMS, CES, CODEMA, CEDH, CMDM e Tutelares) das 27 UFs e 199 cidades estratégicas com datas de reunião, contatos e canais.

**Resposta nova (qwen3-vl:4b-instruct):** O portal mapeia 710 conselhos participativos (CMS, CES, CODEMA, CEDH, CMDM e Tutelares) das 27 UFs e 199 cidades estratégicas com datas de reunião, contatos e canais [1].

**Fontes:** Como encontrar o Conselho de Saúde, Meio Ambiente ou Tutelar da minha cidade? (/direitos-em-movimento/conselhos) · Central de Canais LAI (445 entidades) e Conselhos de Direitos (710 colegiados) (/direitos-em-movimento/informacao) · Como saber a quantidade de leitos do SUS na minha cidade? (/direitos-em-movimento/saude-publica)

### Eixo 1 — Direitos em Movimento — Acesso à Informação, Conselhos & Denúncias

**Pergunta:** Onde buscar orientação jurídica e defensoria pública gratuita?  `(onde-buscar-ajuda)`

**Resposta atual:** O guia de ajuda lista defensorias, ouvidorias públicas e entidades da sociedade civil que prestam assistência jurídica gratuita em todo o país.

**Resposta nova (qwen3-vl:4b-instruct):** O guia de ajuda lista defensorias, ouvidorias públicas e entidades da sociedade civil que prestam assistência jurídica gratuita em todo o país [2].

**Fontes:** Onde buscar orientação jurídica e defensoria pública? (/direitos-em-movimento/ajuda) · Onde buscar orientação jurídica e defensoria pública gratuita? (/direitos-em-movimento/ajuda) · Direitos em Movimento (/direitos-em-movimento/denuncia)

### Eixo 1 — Direitos em Movimento — Acesso à Informação, Conselhos & Denúncias

**Pergunta:** Como fazer uma denúncia popular com segurança?  `(fazer-denuncia)`

**Resposta atual:** A página de denúncias reúne gerador passo a passo de representação (.docx local) e canais do Ministério Público, Tribunais de Contas e controladorias.

**Resposta nova (qwen3-vl:4b-instruct):** Para fazer uma denúncia popular com segurança, acesse a página de denúncias do portal, que reúne um passo a passo de representação (.docx local) e canais do Ministério Público, Tribunais de Contas e controladorias [1].

**Fontes:** Como fazer uma denúncia popular com segurança? (/direitos-em-movimento/denuncia) · Como fazer denúncias de desvio de verbas ou dano ambiental? (/direitos-em-movimento/denuncia) · Como fazer denúncia na ouvidoria canadense CORE? (https://core-ombuds.canada.ca)

### Eixo 1 — Direitos em Movimento — Legislação, TACs & Direitos Humanos

**Pergunta:** Qual legislação ambiental protege recursos naturais, APPs e florestas?  `(legislacao-normas-ambientais)`

**Resposta atual:** O acervo reúne mais de 20 mil normas, leis estaduais e federais catalogadas com busca por palavra-chave, tema e órgão emissor.

**Resposta nova (qwen3-vl:4b-instruct):** O acervo do portal reúne mais de 20 mil normas, leis estaduais e federais catalogadas com busca por palavra-chave, tema e órgão emissor, incluindo legislação ambiental que protege recursos naturais, APPs e florestas [1].

**Fontes:** Qual legislação ambiental protege recursos naturais, APPs e florestas? (/ambiental/legislacao) · Legislação Ambiental, TACs & Precedentes LAI (/ambiental/legislacao) · Qual lei protege a minha comunidade? (/ambiental/legislacao)

### Eixo 1 — Direitos em Movimento — Legislação, TACs & Direitos Humanos

**Pergunta:** Como saber se uma empresa da minha região assinou TAC com o IBAMA?  `(tacs-ibama-acordos)`

**Resposta atual:** Consulte os Termos de Ajustamento de Conduta (TACs) firmados pelo IBAMA com pessoas físicas e jurídicas para recuperação de áreas degradadas e multas.

**Resposta nova (qwen3-vl:4b-instruct):** Consulte os Termos de Ajustamento de Conduta (TACs) firmados pelo IBAMA com pessoas físicas e jurídicas para recuperação de áreas degradadas e multas [1].

**Fontes:** Como saber se uma empresa da minha região assinou TAC com o IBAMA? (/ambiental/tac) · Meio ambiente em Minas: 19 mil licenças, monitoramento do COPAM e TACs do IBAMA (/noticias/meio-ambiente-barragens-licenciamento-mg) · Base de dados: Termos de Ajustamento de Conduta (TACs Ambientais) (/ambiental/tac)

### Eixo 1 — Direitos em Movimento — Legislação, TACs & Direitos Humanos

**Pergunta:** O que fazer se a prefeitura negar pedido de LAI alegando sigilo?  `(decisoes-lai-precedentes)`

**Resposta atual:** O banco de decisões da Lei de Acesso à Informação reúne recursos julgados e súmulas da CGU que obrigam órgãos públicos a divulgar dados públicos.

**Resposta nova (qwen3-vl:4b-instruct):** O banco de decisões da Lei de Acesso à Informação reúne recursos julgados e súmulas da CGU que obrigam órgãos públicos a divulgar dados públicos [1].

**Fontes:** O que fazer se a prefeitura negar pedido de LAI alegando sigilo? (/ambiental/decisoes-lai) · O que fazer se a prefeitura negar ou omitir a resposta de LAI? (/direitos-em-movimento/denuncia) · Como fazer um pedido de Lei de Acesso à Informação (LAI)? (/direitos-em-movimento/informacao)

### Eixo 1 — Direitos em Movimento — Legislação, TACs & Direitos Humanos

**Pergunta:** Onde consultar relatórios de direitos humanos e conflitos no campo?  `(direitos-humanos-conflitos)`

**Resposta atual:** O painel monitora relatórios de violência no campo, violações de direitos de comunidades atingidas e programas de proteção a defensores.

**Resposta nova (qwen3-vl:4b-instruct):** O painel monitora relatórios de violência no campo, violações de direitos de comunidades atingidas e programas de proteção a defensores [1].  
Também há acesso a relatórios de violações de direitos humanos e conflitos no campo no catálogo de legislação ambiental e jurisprudência [2].  

Fontes usadas:  
1. O painel monitora relatórios de violência no campo, violações de direitos de comunidades atingidas e programas de proteção a defensores.  
2. 20.000 normas ambientais, Termos de Ajustamento de Conduta do IBAMA e decisões de recursos da LAI. Catálogo completo de legislação ambiental estadual e federal... Relatórios de violações de direitos humanos e conflitos no campo.

**Fontes:** Onde consultar relatórios de direitos humanos e conflitos no campo? (/ambiental/direitos-humanos) · Legislação Ambiental, TACs & Precedentes LAI (/ambiental/legislacao) · Estudos rurais e territórios tradicionais: acervo reúne pesquisas acadêmicas e mapa 3D (/noticias/estudos-rurais-e-funcao-social-da-terra)

### Eixo 2 — Terra e Territórios — 199 Cidades Estratégicas

**Pergunta:** O que são as 199 Cidades Estratégicas?  `(rede-199-cidades)`

**Resposta atual:** É a rede de fiscalização cidadã do portal que monitora as 27 capitais e 172 polos regionais do interior do Brasil com contratos, saúde e educação.

**Resposta nova (qwen3-vl:4b-instruct):** As 199 Cidades Estratégicas são a rede de fiscalização cidadã do portal que monitora as 27 capitais e 172 polos regionais do interior do Brasil com contratos, saúde e educação [2].

**Fontes:** Como fiscalizar as 199 cidades estratégicas do Brasil? (/cidades) · O que são as 199 Cidades Estratégicas? (/cidades) · Base de dados: 199 Cidades Estratégicas do Brasil (/cidades)

### Eixo 2 — Terra e Territórios — 199 Cidades Estratégicas

**Pergunta:** Quais cidades de Minas têm páginas completas?  `(cidades-mg)`

**Resposta atual:** Belo Horizonte, Betim, Araçuaí, Diamantina e Itinga contam com dados de orçamentos, contratos e Diários Oficiais.

**Resposta nova (qwen3-vl:4b-instruct):** Belo Horizonte, Betim, Araçuaí, Diamantina e Itinga contam com dados de orçamentos, contratos e Diários Oficiais [1].

**Fontes:** Quais cidades de Minas têm páginas completas? (/betim) · Qual o valor total de compras da prefeitura? (/betim/prefeitura/despesas) · Soma dos R$ 251 bilhões monitorados no painel do portal (/)

### Eixo 2 — Terra e Territórios — 199 Cidades Estratégicas

**Pergunta:** Onde ver todos os 853 municípios de Minas Gerais?  `(municipios-853-mg)`

**Resposta atual:** A página Municípios de MG lista os 853 municípios do IBGE. Destaca 10 polos com população do Censo 2022.

**Resposta nova (qwen3-vl:4b-instruct):** Onde ver todos os 853 municípios de Minas Gerais? [1]

**Fontes:** Onde ver todos os 853 municípios de Minas Gerais? (/cidades/mg) · Como falar com a Justiça: varas, gabinetes e balcões de atendimento em Minas Gerais (/noticias/judiciario-varas-gabinetes-como-acessar) · Municípios de Minas Gerais (IBGE) (/cidades/mg)

### Eixo 2 — Terra e Territórios — Vales do Jequitinhonha e Mucuri

**Pergunta:** Como consultar compras e contratos das cidades do Vale do Jequitinhonha no PNCP?  `(compras-pncp-jequitinhonha)`

**Resposta atual:** Ô, meu amigo, é muito fácil acompanhar as contas dos nossos vales. O PNCP — sistema nacional de compras públicas — reúne contratos e licitações. Você digita a cidade e descobre os maiores fornecedores e obras. Dá para fiscalizar cada centavo gasto com merenda, remédios e asfalto. O cidadão bem informado protege o dinheiro do seu próprio povo.

**Resposta nova (qwen3-vl:4b-instruct):** Para consultar compras e contratos das cidades do Vale do Jequitinhonha no PNCP, basta digitar o nome da cidade no sistema e acessar os contratos e licitações auditáveis. [1]  
[1] (Como consultar compras e contratos das cidades do Vale do Jequitinhonha no PNCP?)

**Fontes:** Como consultar compras e contratos das cidades do Vale do Jequitinhonha no PNCP? (https://pncp.gov.br/app/editais?uf=MG) · Vales do Jequitinhonha e Mucuri (/busca) · Vales do Jequitinhonha e Mucuri: polo do lítio e royalties da mineração (/direitos-em-movimento)

### Eixo 2 — Terra e Territórios — Vales do Jequitinhonha e Mucuri

**Pergunta:** Quais municípios fazem parte do polo do lítio no Jequitinhonha e como fiscalizar?  `(polo-litio-jequitinhonha)`

**Resposta atual:** Olha só, meu compadre, o Vale vive a corrida do lítio. Os destaques são Araçuaí, Itinga e Coronel Murta no Médio Jequitinhonha. Para fiscalizar, acompanhe a CFEM — compensação financeira paga pela mineração às prefeituras. Fique de olho também no uso das águas dos rios locais. A riqueza do subsolo deve virar saúde, escola e dignidade popular.

**Resposta nova (qwen3-vl:4b-instruct):** Os municípios que fazem parte do polo do lítio no Jequitinhonha são Araçuaí, Itinga e Coronel Murta [1]. Para fiscalizar, acompanhe a CFEM (compensação financeira pela exploração de recursos minerais), o uso das águas dos rios locais, as compras públicas via PNCP e a proteção das terras indígenas Maxakali [2].

**Fontes:** Quais municípios fazem parte do polo do lítio no Jequitinhonha e como fiscalizar? (https://www.gov.br/anm/pt-br/assuntos/arrecadacao/distribuicao-da-cfem) · Vales do Jequitinhonha e Mucuri (/busca) · Vales do Jequitinhonha e Mucuri: polo do lítio e royalties da mineração (/direitos-em-movimento)

### Eixo 2 — Terra e Territórios — Vales do Jequitinhonha e Mucuri

**Pergunta:** Como acompanhar os 27 municípios do Vale do Mucuri e as terras indígenas Maxakali?  `(municipios-mucuri-maxakali)`

**Resposta atual:** Uai, o Vale do Mucuri tem 27 municípios cheios de história. Teófilo Otoni é o polo regional e Nanuque desponta ao leste. Em Ladainha e Santa Helena de Minas vive o nobre Povo Maxakali. Você acompanha proteção social pelo SUAS — Sistema Único de Assistência Social. Monitore também os recursos hídricos e a transparência das compras municipais.

**Resposta nova (qwen3-vl:4b-instruct):** Acompanhe os 27 municípios do Vale do Mucuri e as terras indígenas Maxakali monitorando a proteção social pelo SUAS, recursos hídricos e transparência das compras municipais [1]. O portal também fiscaliza contratos no PNCP e a proteção das terras indígenas no Vale do Mucuri [2].

**Fontes:** Como acompanhar os 27 municípios do Vale do Mucuri e as terras indígenas Maxakali? (https://www.gov.br/funai/pt-br/atuacao/terras-indigenas) · Vales do Jequitinhonha e Mucuri (/busca) · Vales do Jequitinhonha e Mucuri: polo do lítio e royalties da mineração (/direitos-em-movimento)

### Eixo 2 — Terra e Territórios — Vales do Jequitinhonha e Mucuri

**Pergunta:** Quais são as regras de qualidade da informação das cidades dos vales?  `(regras-qualidade-informacao-vales)`

**Resposta atual:** Pois é, meu amigo, transparência boa precisa de régua muito alta. Primeiro: fonte direta — link auditável que abre o documento oficial original. Segundo: dado buscável — achar processo ou fornecedor pelo nome na busca. Terceiro: lista filtrável — separar contratações por ano, valor ou modalidade. Quarto: microresumo cidadão — síntese em linguagem simples, sem termos difíceis. Quinto: chatbot com contexto — assistente que conhece o orçamento da cidade. Sexto: classificação com tags — etiquetas temáticas como saúde, educação e mineração.

**Resposta nova (qwen3-vl:4b-instruct):** As regras de qualidade da informação das cidades dos vales são: fonte direta, buscável, filtrável, microresumo cidadão, chatbot com contexto e classificação com tags [1].

**Fontes:** Quais são as regras de qualidade da informação das cidades dos vales? (https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm) · LAI completa 13 anos: como qualquer pessoa pode pedir informação a qualquer órgão público (/noticias/lai-acesso-informacao-13-anos-como-pedir) · Vales do Jequitinhonha e Mucuri (/busca)

### Eixo 2 — Terra e Territórios — Bacia do Paraopeba & Brumadinho

**Pergunta:** Como está a execução do Acordo Judicial de Brumadinho?  `(acordo-paraopeba)`

**Resposta atual:** O Acordo Global de R$ 37,7 bilhões prevê R$ 5,48 bi para os 26 municípios atingidos do Paraopeba. Acompanhe a execução e as obras em andamento.

**Resposta nova (qwen3-vl:4b-instruct):** A execução do Acordo Judicial de Brumadinho está sendo acompanhada, com repasses de R$ 5,48 bi aos 26 municípios atingidos e a execução de obras públicas [1]. O acordo global de R$ 37,7 bilhões prevê esse repasse [2].

**Fontes:** Como anda o Acordo Judicial de Brumadinho no Paraopeba? (/paraopeba) · Como está a execução do Acordo Judicial de Brumadinho? (/paraopeba/execucao) · Paraopeba (Brumadinho) (/paraopeba/entenda)

### Eixo 2 — Terra e Territórios — Bacia do Paraopeba & Brumadinho

**Pergunta:** O que é a análise integrada de auditoria, perícia e ATIs?  `(analise-integrada-paraopeba)`

**Resposta atual:** Cruzamento entre os 16 eixos da auditoria independente AECOM, os laudos da UFMG e os estudos das comunidades atingidas.

**Resposta nova (qwen3-vl:4b-instruct):** A análise integrada de auditoria, perícia e ATIs é o cruzamento dos 16 eixos técnicos da AECOM com os laudos da UFMG e assessorias comunitárias [1].

**Fontes:** Onde ver a análise integrada de auditoria, perícia e ATIs? (/paraopeba/analise) · Onde ver a análise integrada das perícias da UFMG e das ATIs? (/paraopeba/analise) · Onde ver a análise integrada das 3 vozes (auditoria, perícia e ATIs)? (/paraopeba/analise)

### Eixo 2 — Terra e Territórios — Bacia do Paraopeba & Brumadinho

**Pergunta:** Onde ver relatórios das Assessorias Técnicas Independentes (ATIs)?  `(biblioteca-ati)`

**Resposta atual:** A Biblioteca reúne mais de 640 documentos produzidos por AEDAS, Guaicuy, NACAB e ADAI.

**Resposta nova (qwen3-vl:4b-instruct):** A Biblioteca reúne mais de 640 documentos produzidos por AEDAS, Guaicuy, NACAB e ADAI [1].

**Fontes:** Onde ver relatórios das Assessorias Técnicas Independentes (ATIs)? (/ambiental/crimes-socioambientais) · Paraopeba (Brumadinho) (/paraopeba/entenda) · Onde consultar o acervo de relatórios técnicos das ATIs? (/ambiental/crimes-socioambientais)

### Eixo 2 — Terra e Territórios — Bacia do Rio Doce & Mariana

**Pergunta:** O que prevê a repactuação de Mariana de R$ 171 bilhões?  `(repactuacao-mariana)`

**Resposta atual:** O novo acordo judicial de 2024 prevê R$ 100 bilhões em dinheiro novo para saúde pública, saneamento e indenizações no Rio Doce.

**Resposta nova (qwen3-vl:4b-instruct):** O novo acordo judicial de 2024 prevê R$ 100 bilhões em dinheiro novo para saúde pública, saneamento e indenizações no Rio Doce [1].

**Fontes:** O que prevê a repactuação de Mariana de R$ 171 bilhões? (/ambiental/mariana) · Como fiscalizar o novo acordo de R$ 171 bilhões de Mariana? (/ambiental/mariana) · Acordo do Rio Doce (Mariana) — R$ 171 Bi (/ambiental/mariana)

### Eixo 2 — Terra e Territórios — Bacia do Rio Doce & Mariana

**Pergunta:** Quanto cada município atingido do Rio Doce recebe?  `(repasses-municipios-doce)`

**Resposta atual:** Consulte a tabela de repasses diretos aos municípios de Minas Gerais e do Espírito Santo afetados pelo desastre da Samarco/Vale.

**Resposta nova (qwen3-vl:4b-instruct):** Não encontrou esse dado no contexto fornecido. As fontes mencionam o valor total do acordo (R$ 171 bilhões [3]) e que há repasses diretos aos municípios, mas não especificam o valor por município. Sugerimos usar a busca do portal para encontrar mais detalhes.

**Fontes:** Quanto cada município atingido do Rio Doce recebe? (/ambiental/mariana) · Como anda a repactuação da Bacia do Rio Doce (Mariana)? (/ambiental/mariana) · Repactuação do Rio Doce (Mariana) de R$ 171 bilhões (/ambiental/mariana)

### Eixo 2 — Terra e Territórios — Meio Ambiente (ONSA)

**Pergunta:** Onde consultar processos de licenciamento ambiental em MG?  `(licenciamento-ambiental)`

**Resposta atual:** O painel do ONSA reúne mais de 19 mil empreendimentos com licenças prévias, de instalação e operação aprovadas pela SEMAD.

**Resposta nova (qwen3-vl:4b-instruct):** O painel do ONSA reúne mais de 19 mil empreendimentos com licenças prévias, de instalação e operação aprovadas pela SEMAD [1].

**Fontes:** Onde consultar processos de licenciamento ambiental em MG? (/ambiental/licenciamento) · Onde consultar licenças ambientais de aterros e destinação? (/ambiental/licenciamento) · Onde ver as decisões e atas do COPAM? (/ambiental/copam)

### Eixo 2 — Terra e Territórios — Meio Ambiente (ONSA)

**Pergunta:** Qual o status de descaracterização de barragens em MG?  `(descaracterizacao-barragens)`

**Resposta atual:** Monitoramento das 23 barragens a montante sob exigência da Lei 'Mar de Lama Nunca Mais' e dados do SIGBM.

**Resposta nova (qwen3-vl:4b-instruct):** Monitoramento das 23 barragens a montante sob exigência da Lei 'Mar de Lama Nunca Mais' e dados do SIGBM [1].

**Fontes:** Qual o status de descaracterização de barragens em MG? (/ambiental/barragens/descaracterizacao) · Qual o status de descaracterização de barragens a montante em MG? (/ambiental/barragens/descaracterizacao) · Como está o cumprimento dos prazos da descaracterização? (/ambiental/barragens/descaracterizacao)

### Eixo 2 — Terra e Territórios — Meio Ambiente (ONSA)

**Pergunta:** O que é o COPAM e onde ver suas reuniões?  `(copam-decisoes)`

**Resposta atual:** O Conselho Estadual de Política Ambiental delibera sobre pedidos de licença em Minas Gerais. Veja atas e processos pautados.

**Resposta nova (qwen3-vl:4b-instruct):** O COPAM é o Conselho Estadual de Política Ambiental, que delibera sobre pedidos de licença em Minas Gerais [1]. As reuniões e atas estão disponíveis no portal, onde também são organizadas as pautas de julgamento para consulta pública [2].

**Fontes:** O que é o COPAM e onde ver suas reuniões? (/ambiental/copam) · Meio ambiente em Minas: 19 mil licenças, monitoramento do COPAM e TACs do IBAMA (/noticias/meio-ambiente-barragens-licenciamento-mg) · Onde ver as decisões e atas do COPAM? (/ambiental/copam)

### Eixo 2 — Terra e Territórios — Meio Ambiente (ONSA)

**Pergunta:** Onde ver as cavas de mineração no globo 3D?  `(cavas-mineracao-satelite)`

**Resposta atual:** A página das Cavas traz a série anual de mineração em MG. Cruzamos uma amostra com polígonos da ANM. O globo 3D mostra as camadas.

**Resposta nova (qwen3-vl:4b-instruct):** Onde ver as cavas de mineração no globo 3D? [1]

**Fontes:** Onde ver as cavas de mineração no globo 3D? (/mineracao/cavas) · Cavas de Mineração em Minas Gerais (/mineracao/cavas) · Estudos rurais e territórios tradicionais: acervo reúne pesquisas acadêmicas e mapa 3D (/noticias/estudos-rurais-e-funcao-social-da-terra)

### Eixo 2 — Terra e Territórios — Terras Tradicionais & Função Social

**Pergunta:** Como funciona o Globo 3D de sobreposições territoriais?  `(globo-3d-terras)`

**Resposta atual:** Visualização tridimensional que sobrepõe Unidades de Conservação, terras indígenas, quilombolas e requerimentos minerários.

**Resposta nova (qwen3-vl:4b-instruct):** O Globo 3D de sobreposições territoriais é uma visualização tridimensional que sobrepõe Unidades de Conservação, terras indígenas, quilombolas e requerimentos minerários [1].

**Fontes:** Como funciona o Globo 3D de sobreposições territoriais? (/funcaosocialterra/mapa) · Como navegar no mapa 3D de sobreposições territoriais? (/funcaosocialterra) · Como visualizar assentamentos e terras tradicionais no mapa 3D? (/funcaosocialterra/mapa)

### Eixo 2 — Terra e Territórios — Terras Tradicionais & Função Social

**Pergunta:** O que é vazio cadastral e como fiscalizar o CAR?  `(vazio-cadastral)`

**Resposta atual:** Áreas sem cadastro ambiental rural que podem indicar terras devolutas ou sobreposições indevidas sobre o patrimônio público.

**Resposta nova (qwen3-vl:4b-instruct):** Áreas sem cadastro ambiental rural que podem indicar terras devolutas ou sobreposições indevidas sobre o patrimônio público [1].

**Fontes:** O que é vazio cadastral e como fiscalizar o CAR? (/funcaosocialterra) · Terra e território (/funcaosocialterra/mapa) · Fila do CAR no IEF Leva 4 Anos, mas Grandes Empreendimentos Tramitam em Meses (/noticias/car-ief-mg-tempo-espera-grandes-empreendimentos-servidores)

### Eixo 2 — Terra e Territórios — Terras Tradicionais & Função Social

**Pergunta:** Como consultar os imóveis da União em Minas Gerais?  `(imoveis-uniao-spu)`

**Resposta atual:** A página reúne 553 imóveis da União em Minas. Mostra destinação, classe, proprietário e área. Fonte: SPU.

**Resposta nova (qwen3-vl:4b-instruct):** Para consultar os imóveis da União em Minas Gerais, acesse o Painel de Transparência Ativa da SPU, que reúne 553 imóveis com destinação, classe, proprietário e área. [1]

**Fontes:** Como consultar os imóveis da União em Minas Gerais? (/ambiental/autorizacoes) · Destinações de Imóveis da União em MG (SPU) (/ambiental/autorizacoes) · União Mantém 553 Imóveis em Minas, e 159 Estão sem Destinação Definida (/noticias/imoveis-uniao-minas-gerais-spu-destinacoes)

### Eixo 2 — Terra e Territórios — Rios, Serras & Patrimônio Cultural

**Pergunta:** Como verificar a qualidade da água dos rios e bacias de MG?  `(nossos-rios-qualidade)`

**Resposta atual:** O painel monitora as 7 bacias hidrográficas (Velhas, Doce, Paraopeba, São Francisco, Jequitinhonha, Mucuri e Paranaíba) com dados do IGAM e outorgas de captação.

**Resposta nova (qwen3-vl:4b-instruct):** A qualidade da água dos rios e bacias de Minas Gerais pode ser verificada pelo painel monitorado pelo IGAM, que cobre as 7 bacias hidrográficas: Velhas, Doce, Paraopeba, São Francisco, Jequitinhonha, Mucuri e Paranaíba [1].

**Fontes:** Como verificar a qualidade da água dos rios e bacias de MG? (/ambiental/nossos-rios) · Nossos Rios, Serras & Patrimônio Cultural (/ambiental/nossos-rios) · Onde ver a qualidade da água dos rios e bacias dos Vales? (/ambiental/nossos-rios)

### Eixo 2 — Terra e Territórios — Rios, Serras & Patrimônio Cultural

**Pergunta:** Por que as serras e áreas de recarga hídrica são protegidas?  `(nossas-serras-recarga)`

**Resposta atual:** Acompanhe o monitoramento da Serra do Gandarela, Serra da Moeda e Serra do Curral frente a pressões minerárias e imobiliárias.

**Resposta nova (qwen3-vl:4b-instruct):** As serras e áreas de recarga hídrica são protegidas para monitorar a qualidade da água nas bacias hidrográficas e proteger os aquíferos, como Gandarela, Moeda e Curral [2].

**Fontes:** Por que as serras e áreas de recarga hídrica são protegidas? (/ambiental/nossas-serras) · Nossos Rios, Serras & Patrimônio Cultural (/ambiental/nossos-rios) · Como acompanhar os 27 municípios do Vale do Mucuri e as terras indígenas Maxakali? (https://www.gov.br/funai/pt-br/atuacao/terras-indigenas)

### Eixo 2 — Terra e Territórios — Rios, Serras & Patrimônio Cultural

**Pergunta:** Como consultar bens tombados pelo IEPHA e IPHAN em risco?  `(patrimonio-cultural-tombamentos)`

**Resposta atual:** Consulte mais de 1.800 bens tombados, sítios arqueológicos e patrimônio histórico de Minas Gerais com cruzamento de riscos industriais.

**Resposta nova (qwen3-vl:4b-instruct):** Consulte mais de 1.800 bens tombados, sítios arqueológicos e patrimônio histórico de Minas Gerais com cruzamento de riscos industriais [1].

**Fontes:** Como consultar bens tombados pelo IEPHA e IPHAN em risco? (/ambiental/patrimonio-cultural) · Nossos Rios, Serras & Patrimônio Cultural (/ambiental/nossos-rios) · Bases de Terras, territórios, patrimônio e povos (/funcaosocialterra)

### Eixo 2 — Terra e Territórios — Rios, Serras & Patrimônio Cultural

**Pergunta:** O que são litígios climáticos e como cobrar proteção contra enchentes?  `(litigios-climaticos-acoes)`

**Resposta atual:** Mapeamento de Ações Civis Públicas climáticas que cobram obras de contenção de cheias, drenagem urbana e adaptação às mudanças climáticas.

**Resposta nova (qwen3-vl:4b-instruct):** Litígios climáticos são ações civis públicas que cobram obras de contenção de cheias, drenagem urbana e adaptação às mudanças climáticas [1].

**Fontes:** O que são litígios climáticos e como cobrar proteção contra enchentes? (/ambiental/litigios-climaticos) · Nossos Rios, Serras & Patrimônio Cultural (/ambiental/nossos-rios) · Bases de Meio ambiente e territórios (/ambiental)

### Eixo 2 — Terra e Territórios — Rios, Serras & Patrimônio Cultural

**Pergunta:** Onde encontrar estudos sobre agricultura familiar e agroecologia?  `(estudos-rurais-agroecologia)`

**Resposta atual:** O acervo de Estudos Rurais reúne pesquisas, notas técnicas e dados sobre assentamentos, reforma agrária e produção de alimentos saudáveis.

**Resposta nova (qwen3-vl:4b-instruct):** Estudos sobre agricultura familiar e agroecologia estão disponíveis na seção de Estudos Rurais [1].

**Fontes:** Onde encontrar estudos sobre agricultura familiar e agroecologia? (/estudos-rurais) · Onde encontrar estudos sobre agricultura familiar, reforma agrária e agroecologia? (/estudos-rurais) · Estudos Rurais e Territoriais (/estudos-rurais)

### Eixo 2 — Terra e Territórios — Rios, Serras & Patrimônio Cultural

**Pergunta:** Onde consultar convênios e estudos ambientais estaduais?  `(convenios-estudos-ambientais)`

**Resposta atual:** Painel com mais de 3.000 convênios e relatórios técnicos da SEMAD, IEF, IGAM e FEAM com valores e prestação de contas.

**Resposta nova (qwen3-vl:4b-instruct):** Consulte os convênios e estudos ambientais estaduais no Painel com mais de 3.000 convênios e relatórios técnicos da SEMAD, IEF, IGAM e FEAM [1].

**Fontes:** Onde consultar convênios e estudos ambientais estaduais? (/ambiental/convenios) · ONSA (/ambiental/barragens) · Biblioteca Geral & Acervo Acadêmico (/biblioteca)

### Eixo 3 — Estado e Economia — Governo: Prometeu? Cumpriu? & Lideranças

**Pergunta:** Como checar se o governador cumpriu as promessas de campanha?  `(governo-prometeu-cumpriu)`

**Resposta atual:** O painel monitora metas e propostas de campanha dos 27 governadores e prefeitos de capitais nas áreas de saúde, educação, segurança e meio ambiente.

**Resposta nova (qwen3-vl:4b-instruct):** O painel monitora metas e propostas de campanha dos 27 governadores e prefeitos de capitais nas áreas de saúde, educação, segurança e meio ambiente [1].

**Fontes:** Como checar se o governador cumpriu as promessas de campanha? (/governo) · Governo: Prometeu? Cumpriu? (/governo) · Como está o cumprimento do plano de governo do governador? (/governo)

### Eixo 3 — Estado e Economia — Governo: Prometeu? Cumpriu? & Lideranças

**Pergunta:** Quem comanda cada ministério, secretaria estadual ou agência reguladora?  `(instituicoes-organogramas-liderancas)`

**Resposta atual:** Consulte organogramas, atos de nomeação, histórico e remunerações da cúpula de agências como ANM, ANA, ANTT e secretarias estaduais.

**Resposta nova (qwen3-vl:4b-instruct):** Consulte os organogramas, atos de nomeação e fichas institucionais das agências e secretarias para saber quem comanda cada ministério, secretaria estadual ou agência reguladora [1].

**Fontes:** Quem comanda cada ministério, secretaria estadual ou agência reguladora? (/instituicoes) · Organogramas & Lideranças Públicas (/instituicoes) · Vale do Jequitinhonha Atrai Corrida Global pelo Lítio com Exigência de Refino Nacional (/noticias/minerais-criticos-litio-jequitinhonha-soberania)

### Eixo 3 — Estado e Economia — Orçamento, Editais & Compras Públicas

**Pergunta:** Como funciona o Radar de Editais e Chamamentos do Diário Oficial de MG?  `(radar-editais-mg)`

**Resposta atual:** O Radar varre diariamente o Diário Oficial de MG e reúne mais de 50 certames de interesse social (medicamentos, merenda, obras e cultura) com filtros por órgão, situação e exportação em CSV.

**Resposta nova (qwen3-vl:4b-instruct):** O Radar varre diariamente o Diário Oficial de MG e reúne mais de 50 certames de interesse social com filtros por órgão e exportação em CSV [1].

**Fontes:** Como funciona o Radar de Editais e Chamamentos do Diário Oficial de MG? (/editais) · Como consultar os editais e chamamentos públicos de MG? (/editais) · Como funciona o Radar de Editais do Diário Oficial de MG? (/editais)

### Eixo 3 — Estado e Economia — Orçamento, Editais & Compras Públicas

**Pergunta:** Onde consultar a arrecadação de ICMS e o orçamento de Minas Gerais?  `(orcamento-mg)`

**Resposta atual:** O painel de finanças públicas monitora as receitas tributárias do Estado (R$ 81,5 bi de ICMS, R$ 9,8 bi de IPVA) e suas destinações.

**Resposta nova (qwen3-vl:4b-instruct):** Consulte o painel de receitas tributárias de Minas Gerais, que mostra a arrecadação de ICMS e as despesas obrigatórias do Estado [1].

**Fontes:** Onde ver a arrecadação de ICMS e o orçamento estadual de MG? (/estado-e-economia/orcamento) · Onde consultar a arrecadação de ICMS e o orçamento de Minas Gerais? (/estado-e-economia/orcamento) · Arrecadação e compras públicas: raio-x de R$ 123 bilhões em receitas e gastos oficiais (/noticias/estado-e-economia-pncp-compras)

### Eixo 3 — Estado e Economia — Orçamento, Editais & Compras Públicas

**Pergunta:** Como fiscalizar compras públicas municipais pelo PNCP?  `(pncp-compras)`

**Resposta atual:** Reportagens investigativas analisam editais, dispensas de licitação e contratos de cidades de médio e pequeno porte.

**Resposta nova (qwen3-vl:4b-instruct):** Reportagens investigativas analisam editais, dispensas de licitação e contratos de cidades de médio e pequeno porte [1].

**Fontes:** Como fiscalizar compras públicas municipais pelo PNCP? (/noticias/estado-e-economia-pncp-compras) · Arrecadação e compras públicas: raio-x de R$ 123 bilhões em receitas e gastos oficiais (/noticias/estado-e-economia-pncp-compras) · Vales do Jequitinhonha e Mucuri (/busca)

### Eixo 3 — Estado e Economia — Orçamento, Editais & Compras Públicas

**Pergunta:** Quais são as concessões e PPPs de Minas Gerais?  `(ppp-concessoes-mg)`

**Resposta atual:** A página reúne 20 contratos do Estado. Apenas 6 são a concessão em si. Os outros são apoio, supervisão ou estudo.

**Resposta nova (qwen3-vl:4b-instruct):** O portal reúne 20 contratos do Estado de Minas Gerais relacionados a concessões ou PPPs, sendo 6 deles a concessão em si e os demais apoio, supervisão ou estudo [2]. O valor total dos contratos de concessão e PPP é de R$ 10,48 bilhões [3].

**Fontes:** Quais são as concessões e PPPs de Minas Gerais? (/ambiental/ppp) · Concessões e PPPs de Minas Gerais (/ambiental/ppp) · Três Acervos Novos do Portal Cruzam Imóveis da União, PPP e Municípios (/noticias/novos-acervos-portal-autorizacoes-ppp-cidades-metodo)

### Eixo 3 — Estado e Economia — Documentação Técnica, APIs & Transparência

**Pergunta:** Onde consultar a documentação técnica, regras de arquitetura e APIs abertas?  `(documentacao-tecnica-portal)`

**Resposta atual:** A seção de Documentação estilo GitBook reúne guias de arquitetura (duplo deploy), fontes de dados oficiais, princípios editoriais e 3 endpoints de API JSON abertos e gratuitos.

**Resposta nova (qwen3-vl:4b-instruct):** A documentação técnica, regras de arquitetura e APIs abertas estão disponíveis na seção de Documentação estilo GitBook [1].

**Fontes:** Onde consultar a documentação técnica, regras de arquitetura e APIs abertas? (/documentacao) · Como consultar a documentação técnica e as APIs de dados abertos? (/documentacao) · Tecnologia Livre & Integridade (/tecnologia)

### Eixo 3 — Estado e Economia — Documentação Técnica, APIs & Transparência

**Pergunta:** Quais são as páginas e dados mais consultados pelos cidadãos?  `(paginas-mais-acessadas)`

**Resposta atual:** O painel de Páginas Populares ranqueia em tempo real as consultas sobre contratos municipais, barragens de mineração e repasses de convênios em todo o estado.

**Resposta nova (qwen3-vl:4b-instruct):** As páginas e dados mais consultados pelos cidadãos são contratos municipais, barragens de mineração, repasses de convênios, contratos de transporte público, monitoramento de barragens de mineração e editais de fornecimento [1]. A página de Páginas Mais Acessadas (/dados/populares) exibe essas rotas mais mobilizantes [2].

Fontes usadas:
[1] (Quais são as páginas e dados mais consultados pelos cidadãos?) [Fonte 1]
[2] (As páginas mais acessadas do portal e as garantias de transparência cívica e proteção de dados) [Fonte 2]

**Fontes:** Quais são as páginas e dados mais consultados pelos cidadãos? (/dados/populares) · As páginas mais acessadas do portal e as garantias de transparência cívica e proteção de dados (/noticias/transparencia-passiva-dados-populares-e-lgpd) · Congresso Nacional: votações, bancadas e o impacto dos projetos nas cidades (/noticias/congresso-nacional-direitos-votacoes)

### Eixo 3 — Estado e Economia — Grandes Empresas & Mineradoras

**Pergunta:** Quem são os maiores acionistas globais da Vale?  `(vale-acionistas)`

**Resposta atual:** O portal monitora fundos soberanos e gestoras globais (BlackRock, Capital Group, Previ), distribuição de dividendos e processos.

**Resposta nova (qwen3-vl:4b-instruct):** Os maiores acionistas globais da Vale incluem fundos soberanos e gestoras globais como BlackRock, Capital Group e Previ [1].

**Fontes:** Quem são os maiores acionistas globais da Vale? (/empresas) · Quem são os acionistas globais da mineradora Vale? (/empresas) · Quem são os maiores acionistas da Vale nos EUA? (/eua/empresas)

### Eixo 3 — Estado e Economia — Grandes Empresas & Mineradoras

**Pergunta:** Como fiscalizar mineradoras como Sigma Lithium, CSN, Gerdau, Samarco e BHP?  `(grandes-empresas-mineradoras)`

**Resposta atual:** O painel de empresas detalha acionistas controladores, relatórios ESG, passivos socioambientais e processos judiciais de grandes mineradoras.

**Resposta nova (qwen3-vl:4b-instruct):** O painel de empresas detalha acionistas controladores, relatórios ESG, passivos socioambientais e processos judiciais de grandes mineradoras [1].

**Fontes:** Como fiscalizar mineradoras como Sigma Lithium, CSN, Gerdau, Samarco e BHP? (/empresas) · Grandes Empresas & Mineradoras (/empresas) · Quem são os acionistas controladores e conselheiros das mineradoras? (/empresas)

### Eixo 3 — Estado e Economia — Grandes Empresas & Mineradoras

**Pergunta:** O que é CFEM e quanto as mineradoras pagam às cidades?  `(cfem-royalties)`

**Resposta atual:** A Compensação Financeira pela Exploração de Recursos Minerais (royalties da mineração) é mapeada nos municípios mineradores.

**Resposta nova (qwen3-vl:4b-instruct):** CFEM é a Compensação Financeira pela Exploração de Recursos Minerais, paga pelas mineradoras aos municípios [1].

**Fontes:** O que é CFEM e quanto as mineradoras pagam às cidades? (/noticias/itinga-transparencia-repasses-litio) · Quais municípios fazem parte do polo do lítio no Jequitinhonha e como fiscalizar? (https://www.gov.br/anm/pt-br/assuntos/arrecadacao/distribuicao-da-cfem) · Blog & Relatórios (/noticias)

### Eixo 3 — Estado e Economia — Internacional (EUA & Canadá)

**Pergunta:** Quais mineradoras canadenses operam no Vale do Jequitinhonha?  `(mineradoras-canadenses-jequitinhonha)`

**Resposta atual:** Sigma Lithium e Lithium Ionic exploram lítio no Vale do Jequitinhonha. Suas ações negociam na Bolsa de Toronto (TSX e TSXV) no Canadá. O portal monitora relatórios técnicos, barragens de rejeitos e licenças das companhias.

**Resposta nova (qwen3-vl:4b-instruct):** Sigma Lithium e Lithium Ionic exploram lítio no Vale do Jequitinhonha [1].

**Fontes:** Quais mineradoras canadenses operam no Vale do Jequitinhonha? (/canada/mineracao) · Canadá — Mineradoras no Brasil (TSX & TSXV) (/canada/mineracao) · Vale em Toronto e Rompimento de Mount Polley Ligam Mineração do Canadá ao Brasil (/noticias/canada-tsx-mineracao-mount-polley-npri-brasil)

### Eixo 3 — Estado e Economia — Internacional (EUA & Canadá)

**Pergunta:** Quem são os maiores acionistas da Vale nos EUA?  `(acionistas-vale-eua)`

**Resposta atual:** A Vale negocia recibos de ações (ADRs) na Bolsa de Nova York (NYSE). Grandes gestoras norte-americanas como BlackRock e Capital Group detêm participações relevantes. Os dados são auditados nos formulários Form 20-F da SEC dos EUA.

**Resposta nova (qwen3-vl:4b-instruct):** Grandes gestoras norte-americanas como BlackRock e Capital Group detêm participações relevantes [1].

**Fontes:** Quem são os maiores acionistas da Vale nos EUA? (/eua/empresas) · Quem são os maiores acionistas globais da Vale? (/empresas) · SEC e USAspending Mostram Fundos e Contratos dos EUA Ligados ao Brasil (/noticias/eua-sec-usaspending-fundos-contratos-brasil)

### Eixo 3 — Estado e Economia — Internacional (EUA & Canadá)

**Pergunta:** Como fazer denúncia na ouvidoria canadense CORE?  `(denuncia-ouvidoria-canada-core)`

**Resposta atual:** A CORE investiga abusos de direitos humanos de corporações canadenses no exterior. Qualquer cidadão atingido por mineradoras no Brasil pode registrar representação online gratuita. O portal orienta o passo a passo com formulário oficial canadense.

**Resposta nova (qwen3-vl:4b-instruct):** Qualquer cidadão atingido por mineradoras no Brasil pode registrar representação online gratuita na ouvidoria CORE do Canadá, com formulário oficial e em português [1].

**Fontes:** Como fazer denúncia na ouvidoria canadense CORE? (https://core-ombuds.canada.ca) · Lei dos EUA Responde em 20 Dias, mas Cadastro da SPU Omite Autorização (/noticias/transparencia-internacional-brasil-eua-canada-acesso) · Canadá — Mineradoras no Brasil (TSX & TSXV) (/canada/mineracao)

### Eixo 3 — Estado e Economia — Internacional (EUA & Canadá)

**Pergunta:** O que é o formulário Form 20-F da SEC nos Estados Unidos?  `(sec-form-20f-cvm)`

**Resposta atual:** O Form 20-F é o balanço anual obrigatório de companhias estrangeiras. Ele detalha passivos ambientais, processos judiciais e remuneração da diretoria. O Controle Popular cruza esses relatórios com registros da CVM brasileira.

**Resposta nova (qwen3-vl:4b-instruct):** O Form 20-F é o balanço anual obrigatório de companhias estrangeiras, detalhando passivos ambientais, processos judiciais e remuneração da diretoria [1].

**Fontes:** O que é o formulário Form 20-F da SEC nos Estados Unidos? (/eua/empresas) · Estados Unidos — Corporações & Fundos na SEC (/eua/empresas) · Quem são os maiores acionistas da Vale nos EUA? (/eua/empresas)

### Eixo 3 — Estado e Economia — Internacional (EUA & Canadá)

**Pergunta:** Quais mineradoras canadenses possuem barragens de mineração no Brasil?  `(barragens-mineradoras-canadenses)`

**Resposta atual:** Kinross Gold, Lundin Mining e Yamana operam estruturas de mineração no país. O portal cruza dados do SIGBM com relatórios técnicos do SEDAR+. Consulte o mapa de barragens e níveis de emergência declarados.

**Resposta nova (qwen3-vl:4b-instruct):** Kinross Gold, Lundin Mining e Yamana operam estruturas de mineração no país [1].

**Fontes:** Quais mineradoras canadenses possuem barragens de mineração no Brasil? (/canada/mineracao) · Canadá — Mineradoras no Brasil (TSX & TSXV) (/canada/mineracao) · Quais mineradoras canadenses operam no Vale do Jequitinhonha? (/canada/mineracao)

### Eixo 3 — Estado e Economia — Internacional (EUA & Canadá)

**Pergunta:** Como comparar o Brasil com ONU, UNESCO, OMS e OMC?  `(hub-internacional-multilateral)`

**Resposta atual:** O Hub Internacional compara o Brasil com potências do G8 e G20. Reúne IDH, Gini, saúde, educação e comércio de minérios.

**Resposta nova (qwen3-vl:4b-instruct):** O portal Controle Popular compara o Brasil com potências do G8 e G20, incluindo indicadores como IDH, desigualdade (Gini), saúde, educação, comércio de minérios e direitos territoriais, utilizando dados das ONU, UNESCO, OMS e OMC [2].

**Fontes:** Como comparar o Brasil com ONU, UNESCO, OMS e OMC? (/internacional) · Transparência Multilateral & Internacional (/internacional) · Painel Multilateral Compara Brasil com 13 Países em IDH, Renda e Comércio (/noticias/onu-unesco-oms-omc-brasil-indicadores-multilaterais)

### Eixo 3 — Estado e Economia — Sistema de Justiça (TJMG, MPMG, DPMG)

**Pergunta:** Quanto custa o Judiciário de Minas Gerais?  `(orcamento-justica)`

**Resposta atual:** O TJMG consome R$ 14,96 bilhões e o MPMG R$ 4,09 bilhões anuais, com grande parcela em verbas indenizatórias e benefícios.

**Resposta nova (qwen3-vl:4b-instruct):** O Judiciário de Minas Gerais custa R$ 14,96 bilhões anuais [1].

**Fontes:** Quanto custa o Judiciário de Minas Gerais? (/judiciario/instituicoes) · Fichas do Judiciário (TJMG, MPMG, DPMG, TCEMG) (/judiciario/instituicoes) · Soma dos R$ 251 bilhões monitorados no painel do portal (/)

### Eixo 3 — Estado e Economia — Sistema de Justiça (TJMG, MPMG, DPMG)

**Pergunta:** Por que a Defensoria Pública está ausente de 176 comarcas?  `(defensoria-deficit)`

**Resposta atual:** Com orçamento 14 vezes menor que o Tribunal de Justiça, a DPMG não dispõe de defensores suficientes para atender a população carente em todo o estado.

**Resposta nova (qwen3-vl:4b-instruct):** A Defensoria Pública está ausente de 176 comarcas devido à disparidade orçamentária, que resulta em déficit de recursos para atender a população carente [2].

**Fontes:** Por que a Defensoria Pública está ausente de 176 comarcas? (/judiciario/instituicoes/dpmg) · Orçamento do TJMG, MPMG e DPMG e a disparidade institucional (/judiciario/instituicoes) · DPMG: Defensoria opera com orçamento de R$ 1,1 bilhão e 176 comarcas não têm defensor em Minas (/noticias/dpmg-acesso-justica-defensoria)

### Eixo 3 — Estado e Economia — Sistema de Justiça (TJMG, MPMG, DPMG)

**Pergunta:** Como falar diretamente com uma Vara, Fórum ou Balcão Virtual da Justiça?  `(varas-e-gabinetes)`

**Resposta atual:** O Guia de Varas e Gabinetes mapeia 990 unidades e 298 comarcas de Minas Gerais com telefones com DDD, e-mails institucionais, juízes titulares, endereços com CEP e link do Balcão Virtual.

**Resposta nova (qwen3-vl:4b-instruct):** O Guia de Varas e Gabinetes mapeia 990 unidades e 298 comarcas de Minas Gerais com telefones com DDD, e-mails institucionais, juízes titulares, endereços com CEP e link do Balcão Virtual [1]. O Balcão Virtual do TJMG funciona 24 horas e permite consulta de processos e autenticação de documentos [3].

**Fontes:** Como falar diretamente com uma Vara, Fórum ou Balcão Virtual da Justiça? (/judiciario/contatos) · Base de dados: Guia de Varas, Gabinetes e Balcão Virtual da Justiça (/judiciario/contatos) · Como falar com a Justiça: varas, gabinetes e balcões de atendimento em Minas Gerais (/noticias/judiciario-varas-gabinetes-como-acessar)

### Eixo 3 — Estado e Economia — Sistema de Justiça (TJMG, MPMG, DPMG)

**Pergunta:** Como funciona a escolha de desembargadores pelo Quinto Constitucional?  `(vagas-indicacoes-quinto)`

**Resposta atual:** O painel de Vagas e Indicações acompanha a formação de listas tríplices e indicações de advogados e membros do MP para tribunais de 2ª instância.

**Resposta nova (qwen3-vl:4b-instruct):** A escolha de desembargadores pelo Quinto Constitucional envolve a formação de listas tríplices, que indicam advogados e membros do Ministério Público para tribunais de 2ª instância [1].

**Fontes:** Como funciona a escolha de desembargadores pelo Quinto Constitucional? (/judiciario/vagas) · CONDEL do PPDDH-MG: inscrições de entidades da sociedade civil são prorrogadas até 21 de outubro (/noticias/condel-ppddh-mg-edital-sociedade-civil-prorrogado) · Tribunais em Minas Gerais: vagas, indicações e o mapa do Judiciário estadual (/noticias/judiciario-transparencia-tribunais)

### Eixo 3 — Estado e Economia — Sistema de Justiça (TJMG, MPMG, DPMG)

**Pergunta:** Como consultar os relatórios de inspeções prisionais e superlotação?  `(inspecoes-presidios-cnj)`

**Resposta atual:** Painel com dados do Conselho Nacional de Justiça (CNJ) sobre capacidade, ocupação, mortes sob custódia e condições estruturais de presídios.

**Resposta nova (qwen3-vl:4b-instruct):** Consulte os relatórios de inspeções prisionais e superlotação no painel do Conselho Nacional de Justiça (CNJ) [1].

**Fontes:** Como consultar os relatórios de inspeções prisionais e superlotação? (/judiciario/presidios) · Como consultar os relatórios dos Tribunais de Justiça e MPs dos 27 estados? (/judiciario/instituicoes) · Satélite Sino-Brasileiro CBERS-6 Monitorará a Amazônia Através de Nuvens Densas (/noticias/satelite-cbers-6-cooperacao-espacial-amazonia)

### Eixo 3 — Estado e Economia — Sistema de Justiça (TJMG, MPMG, DPMG)

**Pergunta:** Onde consultar fiscalizações de trabalho análogo à escravidão e correições?  `(correicoes-trabalhistas-escravo)`

**Resposta atual:** Relatórios de correições ordinárias dos Tribunais Regionais do Trabalho (TRTs) e operações de resgate de trabalhadores em condições análogas à escravidão.

**Resposta nova (qwen3-vl:4b-instruct):** Relatórios de correições ordinárias dos Tribunais Regionais do Trabalho (TRTs) e operações de resgate de trabalhadores em condições análogas à escravidão [1].

**Fontes:** Onde consultar fiscalizações de trabalho análogo à escravidão e correições? (/judiciario/correicoes-trabalhistas) · Quem fiscaliza a atuação dos magistrados e tribunais? (/judiciario/instituicoes) · Automação Diária do Portal Nacional de Contratações Públicas Assegura Fiscalização Cívica (/noticias/automacao-diaria-pncp-compras-publicas-lgpd)

### Eixo 3 — Estado e Economia — Sistema de Justiça (TJMG, MPMG, DPMG)

**Pergunta:** Onde consultar o orçamento e cúpula dos Tribunais e MPs dos 27 estados?  `(instituicoes-27-estados)`

**Resposta atual:** O painel de Instituições de Justiça cobre Tribunais de Justiça (TJs), Ministérios Públicos (MPs) e Defensorias Públicas de todos os 27 estados brasileiros com orçamentos e organogramas.

**Resposta nova (qwen3-vl:4b-instruct):** O painel de Instituições de Justiça cobre Tribunais de Justiça (TJs), Ministérios Públicos (MPs) e Defensorias Públicas de todos os 27 estados brasileiros com orçamentos e organogramas [1].

**Fontes:** Onde consultar o orçamento e cúpula dos Tribunais e MPs dos 27 estados? (/judiciario/instituicoes) · Como consultar os relatórios dos Tribunais de Justiça e MPs dos 27 estados? (/judiciario/instituicoes) · Orçamento do TJMG, MPMG e DPMG e a disparidade institucional (/judiciario/instituicoes)

### Eixo 3 — Estado e Economia — Sistema de Justiça (TJMG, MPMG, DPMG)

**Pergunta:** O que é o painel SIRENEJud de processos ambientais?  `(sirenejud-processos)`

**Resposta atual:** Banco de dados do CNJ com georreferenciamento de crimes ambientais e ações civis públicas em todo o território nacional.

**Resposta nova (qwen3-vl:4b-instruct):** O painel SIRENEJud de processos ambientais é um banco de dados do CNJ com georreferenciamento de crimes ambientais e ações civis públicas em todo o território nacional [2].

**Fontes:** Onde ver os processos ambientais no SIRENEJud? (/judiciario/sirenejud) · O que é o painel SIRENEJud de processos ambientais? (/judiciario/sirenejud) · Onde consultar as ações civis públicas ambientais no Judiciário? (/judiciario/sirenejud)

### Eixo 3 — Estado e Economia — Congresso Nacional & Bancadas

**Pergunta:** Quais projetos de lei estão na pauta das comissões temáticas?  `(agenda-comissoes-congresso)`

**Resposta atual:** Acompanhe a agenda diária de votações e reuniões das comissões da Câmara e do Senado que tratam de mineração, meio ambiente e tributação.

**Resposta nova (qwen3-vl:4b-instruct):** Projetos de lei estão na pauta das comissões temáticas [1].

**Fontes:** Quais projetos de lei estão na pauta das comissões temáticas? (/congresso/agenda) · Quais projetos prioritários das bancadas estão em pauta? (/congresso/proposicoes) · Assembleias Legislativas dos Estados (/assembleias)

### Eixo 3 — Estado e Economia — Congresso Nacional & Bancadas

**Pergunta:** Como fiscalizar os gastos dos deputados com a CEAP?  `(gastos-ceap)`

**Resposta atual:** Consulte reembolsos de passagens, alimentação e combustível declarados na Cota para Exercício da Atividade Parlamentar.

**Resposta nova (qwen3-vl:4b-instruct):** Para fiscalizar os gastos dos deputados com a CEAP, consulte os reembolsos de passagens, alimentação e combustível declarados na Cota para Exercício da Atividade Parlamentar [1].

**Fontes:** Como fiscalizar os gastos dos deputados com a CEAP? (/congresso/parlamentares) · Quais deputados tiveram mais gastos com a cota parlamentar (CEAP)? (/congresso/parlamentares) · Quem são os parlamentares de cada bancada? (/congresso/parlamentares)

### Eixo 3 — Estado e Economia — Congresso Nacional & Bancadas

**Pergunta:** Onde ver as votações nominais dos parlamentares?  `(votacoes-bancadas)`

**Resposta atual:** Acompanhe o voto de cada deputado em matérias de orçamento, saúde, educação e meio ambiente.

**Resposta nova (qwen3-vl:4b-instruct):** Você pode ver as votações nominais dos parlamentares na página de votações do portal, que traz o voto nominal de cada deputado e senador nas matérias deliberadas em plenário [2]. Além disso, o portal também disponibiliza informações sobre proposições, comissões e bancadas [3]. 

Fontes usadas:
[1] Onde ver as votações nominais dos parlamentares?
[2] Como os parlamentares votaram nessas propostas?
[3] Congresso Nacional

**Fontes:** Onde ver as votações nominais dos parlamentares? (/congresso/votacoes) · Como os parlamentares votaram nessas propostas? (/congresso/votacoes) · Congresso Nacional (/congresso/proposicoes)

### Eixo 3 — Estado e Economia — Congresso Nacional & Bancadas

**Pergunta:** Como fiscalizar as 27 Assembleias Legislativas estaduais?  `(assembleias-legislativas-27)`

**Resposta atual:** O hub das Assembleias cobre as 27 Casas Legislativas. Traz deputados estaduais, comissões e projetos de interesse social.

**Resposta nova (qwen3-vl:4b-instruct):** O hub das Assembleias cobre as 27 Casas Legislativas, trazendo deputados estaduais, comissões e projetos de interesse social [1]. Além disso, há monitoramento cidadão das 27 Casas Legislativas estaduais e distritais, com filtros por macrorregião e busca textual, com dados provenientes dos portais oficiais [3].

**Fontes:** Como fiscalizar as 27 Assembleias Legislativas estaduais? (/assembleias) · Bases de Assembleias legislativas estaduais (/assembleias) · Assembleias Legislativas dos Estados (/assembleias)

### Eixo 3 — Estado e Economia — Repasses Federais (ComunicaBR)

**Pergunta:** Quanto o governo federal repassa aos 853 municípios de MG?  `(repasses-853-municipios)`

**Resposta atual:** O painel ComunicaBR mapeia R$ 139 bilhões em transferências da União para Bolsa Família, SUS, Fundeb e BPC em cada cidade mineira.

**Resposta nova (qwen3-vl:4b-instruct):** O governo federal repassa R$ 139 bilhões aos 853 municípios de Minas Gerais [1].

**Fontes:** Quanto o governo federal repassa aos 853 municípios de MG? (/dados/comunicabr) · ComunicaBR — Repasses Federais nos Municípios (/dados/comunicabr) · Quanto meu município recebe de repasses federais da União? (/dados/comunicabr)

### Central ONSA & Blog — Blog & Relatórios Cívicos

**Pergunta:** Onde ver as reportagens investigativas do portal?  `(reportagens-onsa)`

**Resposta atual:** O portal publica matérias aprofundadas com auditoria de compras públicas, royalties de mineração e acordos de barragens.

**Resposta nova (qwen3-vl:4b-instruct):** Onde ver as reportagens investigativas do portal? [1]  
[2]

**Fontes:** Onde ver as reportagens investigativas do portal? (/noticias) · Blog & Relatórios (/noticias) · Como fiscalizar compras públicas municipais pelo PNCP? (/noticias/estado-e-economia-pncp-compras)

### Central ONSA & Blog — Blog & Relatórios Cívicos

**Pergunta:** Como checar as fontes oficiais de cada matéria?  `(verificar-fontes)`

**Resposta atual:** Cada matéria traz a caixa 'Recomendação para verificar' com links diretos para portais de transparência, PNCP e Diários Oficiais.

**Resposta nova (qwen3-vl:4b-instruct):** Cada matéria traz a caixa 'Recomendação para verificar' com links diretos para portais de transparência, PNCP e Diários Oficiais [1].

**Fontes:** Como checar as fontes oficiais de cada matéria? (/noticias) · Três Acervos Novos do Portal Cruzam Imóveis da União, PPP e Municípios (/noticias/novos-acervos-portal-autorizacoes-ppp-cidades-metodo) · Como funciona a metodologia de checagem do ONSA? (/sobre)

### Central ONSA & Blog — Biblioteca de Crimes Socioambientais

**Pergunta:** O que tem na Biblioteca Unificada de Crimes de Barragens?  `(acervo-936-docs)`

**Resposta atual:** Mais de 930 laudos periciais, termos de ajustamento de conduta, auditorias da FGV e relatórios da Fiocruz sobre Mariana e Brumadinho.

**Resposta nova (qwen3-vl:4b-instruct):** A Biblioteca Unificada de Crimes de Barragens tem mais de 930 laudos periciais, termos de ajustamento de conduta, auditorias da FGV e relatórios da Fiocruz sobre Mariana e Brumadinho [1]. Também reúne relatórios epidemiológicos da Fiocruz e planos comunitários [2], além de 936 laudos periciais, TACs e relatórios de saúde comunitária [3].

[1] Biblioteca Unificada de Crimes de Barragens
[2] Onde acessar a Biblioteca Unificada de Crimes de Barragens?
[3] Onde consultar o acervo de crimes e desastres de barragens?

**Fontes:** O que tem na Biblioteca Unificada de Crimes de Barragens? (/ambiental/crimes-socioambientais) · Onde acessar a Biblioteca Unificada de Crimes de Barragens? (/ambiental/crimes-socioambientais) · Onde consultar o acervo de crimes e desastres de barragens? (/ambiental/crimes-socioambientais)

### Central ONSA & Blog — Biblioteca Geral & Pesquisa Acadêmica

**Pergunta:** Como acessar teses e documentos de pesquisa no portal?  `(acervo-unificado)`

**Resposta atual:** A nova Biblioteca Geral reúne mais de 870 documentos, incluindo relatórios corporativos ESG, atas de 91 órgãos de justiça e artigos acadêmicos do SciELO, UFMG, UFV, UnB, Fiocruz, USP e IPEA.

**Resposta nova (qwen3-vl:4b-instruct):** Acesse a Biblioteca Geral, que reúne teses e documentos de pesquisa, incluindo artigos acadêmicos e relatórios de instituições como UFMG, UFV, UnB, Fiocruz, USP e IPEA [1]. Também está disponível o acervo com teses sobre temas como Vale, Brumadinho e Sigma Lithium [2]. A Biblioteca Unificada reúne pesquisas da UFMG, IFMG, CEFET-MG e UFRJ sobre barragens e bacias [3].

[1] Biblioteca Geral
[2] Biblioteca Geral & Acervo Acadêmico
[3] Onde consultar estudos acadêmicos e pesquisas sobre as mineradoras?

**Fontes:** Como acessar teses e documentos de pesquisa no portal? (/biblioteca) · Biblioteca Geral & Acervo Acadêmico (/biblioteca) · Onde consultar estudos acadêmicos e pesquisas sobre as mineradoras? (/biblioteca)

### Central ONSA & Blog — Biblioteca Geral & Pesquisa Acadêmica

**Pergunta:** Onde encontrar pesquisas sobre a Vale e o lítio da Sigma?  `(teses-mineracao-litio)`

**Resposta atual:** Na Biblioteca Geral e nas páginas de cada empresa (/empresas/vale e /empresas/sigma-lithium) há uma seção dedicada com teses de doutorado, dissertações e notas técnicas do Inesc, Fiocruz e universidades federais com link para o PDF.

**Resposta nova (qwen3-vl:4b-instruct):** Pesquisas sobre a Vale e o lítio da Sigma podem ser encontradas na Biblioteca Geral e nas páginas de cada empresa (/empresas/vale e /empresas/sigma-lithium), onde há seções com teses de doutorado, dissertações e notas técnicas do Inesc, Fiocruz e universidades federais, com links para PDF [1].

**Fontes:** Onde encontrar pesquisas sobre a Vale e o lítio da Sigma? (/biblioteca) · Quais mineradoras canadenses operam no Vale do Jequitinhonha? (/canada/mineracao) · Resistência à mineração de lítio (/memoria)

### Central ONSA & Blog — Biblioteca Geral & Pesquisa Acadêmica

**Pergunta:** Onde consultar materiais sobre Consulta Prévia e Convenção 169?  `(consulta-previa-oit)`

**Resposta atual:** Temos teses da UnB, manuais do Instituto Socioambiental (ISA) e artigos da FGV Direito sobre a jurisprudência do STF e os Protocolos Autônomos de Consulta de povos indígenas e tradicionais.

**Resposta nova (qwen3-vl:4b-instruct):** Temos teses da UnB, manuais do Instituto Socioambiental (ISA) e artigos da FGV Direito sobre a jurisprudência do STF e os Protocolos Autônomos de Consulta de povos indígenas e tradicionais [1].  
Também há relatórios e estudos sobre Protocolo de Consulta Prévia (Convenção 169 OIT) no acervo acadêmico [2].

**Fontes:** Onde consultar materiais sobre Consulta Prévia e Convenção 169? (/biblioteca) · Biblioteca Geral & Acervo Acadêmico (/biblioteca) · Quais são as páginas e dados mais consultados pelos cidadãos? (/dados/populares)

### Central ONSA & Blog — Biblioteca Geral & Pesquisa Acadêmica

**Pergunta:** Como consultar os relatórios dos Tribunais de Justiça e MPs dos 27 estados?  `(justica-27-estados)`

**Resposta atual:** No painel do Judiciário (/judiciario/instituicoes) e na Biblioteca Geral catalogamos os relatórios de gestão fiscal (RGF), quadro de pessoal e inspeções de todos os 27 TJs, 27 Ministérios Públicos e 27 Defensorias do Brasil.

**Resposta nova (qwen3-vl:4b-instruct):** Consulte os relatórios de gestão fiscal (RGF), quadro de pessoal e inspeções dos 27 TJs, 27 MPs e 27 Defensorias do Brasil no painel do Judiciário (/judiciario/instituicoes) e na Biblioteca Geral [1].

**Fontes:** Como consultar os relatórios dos Tribunais de Justiça e MPs dos 27 estados? (/judiciario/instituicoes) · Onde consultar o orçamento e cúpula dos Tribunais e MPs dos 27 estados? (/judiciario/instituicoes) · Onde consultar os portais de transparência dos 27 estados brasileiros? (/fontes-estados)

### Central ONSA & Blog — Tecnologia Livre & Metodologia Cívica

**Pergunta:** Como funciona a inteligência artificial do Seu Nonô e a tecnologia do portal?  `(tecnologia-ia-popular)`

**Resposta atual:** O Seu Nonô utiliza arquitetura RAG (Recuperação Aumentada por Geração) com busca vetorial e lexical sobre acervos públicos oficiais, conectando modelos avançados a dados cívicos 100% auditáveis e com citação ABNT obrigatória.

**Resposta nova (qwen3-vl:4b-instruct):** O Seu Nonô utiliza arquitetura RAG (Recuperação Aumentada por Geração) com busca vetorial e lexical sobre acervos públicos oficiais, conectando modelos avançados a dados cívicos 100% auditáveis e com citação ABNT obrigatória [1].

**Fontes:** Como funciona a inteligência artificial do Seu Nonô e a tecnologia do portal? (/tecnologia) · WAICO: 29 países, entre eles o Brasil, fundam organização mundial de IA; governo brasileiro anuncia supercomputador e nuvem nacional (/noticias/waico-ia-codigo-aberto-brasil) · Estudos rurais e territórios tradicionais: acervo reúne pesquisas acadêmicas e mapa 3D (/noticias/estudos-rurais-e-funcao-social-da-terra)

### Central ONSA & Blog — Tecnologia Livre & Metodologia Cívica

**Pergunta:** Como o portal protege a privacidade e cumpre a regra de Zero Dado Pessoal?  `(transparencia-privacidade-lgpd)`

**Resposta atual:** Seguimos diretrizes de Transparência Internacional com varredura contínua de CPF e segredos, validação matemática por mod-11 e anonimização de dados protegidos pela LGPD.

**Resposta nova (qwen3-vl:4b-instruct):** O portal segue diretrizes de Transparência Internacional com varredura contínua de CPF e segredos, validação matemática por mod-11 e anonimização de dados protegidos pela LGPD [1].

**Fontes:** Como o portal protege a privacidade e cumpre a regra de Zero Dado Pessoal? (/transparencia-internacional) · Quais são as diretrizes de privacidade e LGPD do portal? (/termos) · Como o portal protege a privacidade e segue a LGPD? (/sobre)

### Central ONSA & Blog — Acessibilidade & Sobre o Portal

**Pergunta:** Quais comandos de acessibilidade posso usar com o Seu Nonô?  `(comandos-voz-acessibilidade)`

**Resposta atual:** Digite ou fale: 'tema escuro', 'tema claro', 'tema pequi', 'alto contraste', 'aumentar texto', 'diminuir texto' ou 'cores daltônicas'.

**Resposta nova (qwen3-vl:4b-instruct):** Você pode usar os comandos: 'tema escuro', 'tema claro', 'tema pequi', 'alto contraste', 'aumentar texto', 'diminuir texto' ou 'cores daltônicas' [1].

**Fontes:** Quais comandos de acessibilidade posso usar com o Seu Nonô? (/sobre) · Dados da Anatel Apontam mais de 1.400 Distritos Rurais sem Cobertura Celular no País (/noticias/cobertura-celular-anatel-desertos-digitais-brasil) · Lei dos EUA Responde em 20 Dias, mas Cadastro da SPU Omite Autorização (/noticias/transparencia-internacional-brasil-eua-canada-acesso)

### Central ONSA & Blog — Acessibilidade & Sobre o Portal

**Pergunta:** O portal tem código aberto?  `(codigo-aberto-licenca)`

**Resposta atual:** Sim. Todo o código e os coletores são públicos e auditáveis, construídos para o fortalecimento da cidadania e da transparência pública.

**Resposta nova (qwen3-vl:4b-instruct):** Sim, o portal tem código aberto [1].

**Fontes:** O portal tem código aberto? (/sobre) · Tecnologia Livre & Integridade (/tecnologia) · WAICO: 29 países, entre eles o Brasil, fundam organização mundial de IA; governo brasileiro anuncia supercomputador e nuvem nacional (/noticias/waico-ia-codigo-aberto-brasil)

### Central ONSA & Blog — Laboratório de Dados, PowerBI & Árvore de Conexões

**Pergunta:** Como comparar dois conjuntos de dados em gráficos dither no Laboratório?  `(laboratorio-powerbi-camadas)`

**Resposta atual:** O Laboratório reúne 23 camadas ativáveis estilo PowerBI. Você escolhe duas bases e compara contratos, royalties, saúde ou barragens lado a lado em gráficos acessíveis.

**Resposta nova (qwen3-vl:4b-instruct):** O Laboratório permite comparar dois conjuntos de dados em gráficos dither, com 23 camadas ativáveis estilo PowerBI, onde você escolhe duas bases e analisa indicadores lado a lado [1]. A técnica dither transforma números em malhas de pontos em canvas e SVG, destacando proporções e densidades [2].

**Fontes:** Como comparar dois conjuntos de dados em gráficos dither no Laboratório? (/laboratorio) · Laboratório de Dados: Compare Séries Públicas em Gráficos de Pontos (/noticias/laboratorio-de-dados-do-portal) · Laboratório de Dados & PowerBI (/laboratorio)

### Central ONSA & Blog — Laboratório de Dados, PowerBI & Árvore de Conexões

**Pergunta:** Como navegar pela Árvore de Conexões do portal no estilo Obsidian?  `(arvore-obsidian-conexoes)`

**Resposta atual:** A Árvore de Conexões interativa (/laboratorio/arvore) mapeia os 4 eixos, 199 cidades e mineradoras em nós e arestas. Você pode aplicar zoom, arrastar nós e inspecionar relações cívicas.

**Resposta nova (qwen3-vl:4b-instruct):** Você pode navegar pela Árvore de Conexões interativa aplicando zoom, arrastando nós e inspecionando relações cívicas [1].

**Fontes:** Como navegar pela Árvore de Conexões do portal no estilo Obsidian? (/laboratorio/arvore) · Laboratório de Dados & PowerBI (/laboratorio) · Como o portal protege a privacidade e segue a LGPD? (/sobre)

### Central ONSA & Blog — Radar de Editais, Estudos Rurais & Fontes dos 27 Estados

**Pergunta:** Como funciona o Radar de Editais do Diário Oficial de MG?  `(radar-editais-diario-oficial)`

**Resposta atual:** O Radar varre o Diário Oficial diariamente e reúne 50+ certames de interesse social (saúde, educação, obras e leilões) com filtros por órgão e download em CSV.

**Resposta nova (qwen3-vl:4b-instruct):** O Radar de Editais do Diário Oficial de MG varre diariamente o Diário Oficial e reúne mais de 50 certames de interesse social, com filtros por órgão e disponibiliza download em CSV [1].

**Fontes:** Como funciona o Radar de Editais do Diário Oficial de MG? (/editais) · Como funciona o Radar de Editais e Chamamentos do Diário Oficial de MG? (/editais) · Onde ver a lista completa de certames no Radar de Editais? (/editais)

### Central ONSA & Blog — Radar de Editais, Estudos Rurais & Fontes dos 27 Estados

**Pergunta:** Onde encontrar estudos sobre agricultura familiar, reforma agrária e agroecologia?  `(estudos-rurais-jequitinhonha-mucuri)`

**Resposta atual:** A seção de Estudos Rurais reúne pesquisas do PPGER/UFVJM, notas técnicas sobre assentamentos e dados de produção camponesa nos Vales do Jequitinhonha e Mucuri.

**Resposta nova (qwen3-vl:4b-instruct):** Estudos sobre agricultura familiar, reforma agrária e agroecologia estão disponíveis na seção de Estudos Rurais [2].

**Fontes:** Onde encontrar estudos sobre agricultura familiar e agroecologia? (/estudos-rurais) · Onde encontrar estudos sobre agricultura familiar, reforma agrária e agroecologia? (/estudos-rurais) · Estudos Rurais e Territoriais (/estudos-rurais)

### Central ONSA & Blog — Radar de Editais, Estudos Rurais & Fontes dos 27 Estados

**Pergunta:** Onde consultar os portais de transparência dos 27 estados brasileiros?  `(fontes-dados-27-estados)`

**Resposta atual:** O catálogo reúne links diretos dos portais de dados abertos, controladorias, assembleias e tribunais de contas de todas as 27 unidades da federação.

**Resposta nova (qwen3-vl:4b-instruct):** O catálogo reúne links diretos dos portais de dados abertos, controladorias, assembleias e tribunais de contas de todas as 27 unidades da federação [1].

**Fontes:** Onde consultar os portais de transparência dos 27 estados brasileiros? (/fontes-estados) · Fontes de Dados dos 27 Estados (/fontes-estados) · Brasil Negocia Parcerias Internacionais Bilionárias em Sete Setores Estratégicos (/noticias/acordos-internacionais-sete-setores-estrategicos)

### Central ONSA & Blog — Maiores Consumidores de Água, Energia, Combustível e Empregos (MG e G20)

**Pergunta:** Quem são os maiores consumidores de água e energia em Minas Gerais?  `(top50-consumidores-mg)`

**Resposta atual:** O painel lista as 50 maiores operações corporativas com dados do IGAM, ANA e CCEE.

**Resposta nova (qwen3-vl:4b-instruct):** Os maiores consumidores de água e energia em Minas Gerais são as 50 maiores operações corporativas, conforme dados do IGAM, ANA e CCEE [1].

**Fontes:** Quem são os maiores consumidores de água e energia em Minas Gerais? (/consumo-corporativo) · Como falar com a Justiça: varas, gabinetes e balcões de atendimento em Minas Gerais (/noticias/judiciario-varas-gabinetes-como-acessar) · Assembleias Estaduais Consomem Bilhões com Folha Parlamentar e Verbas Indenizatórias (/noticias/gastos-salarios-parlamentares-assembleias-estaduais)

### Central ONSA & Blog — Maiores Consumidores de Água, Energia, Combustível e Empregos (MG e G20)

**Pergunta:** Quanto uma grande empresa paga pela água e luz comparada ao cidadão?  `(tarifa-empresa-vs-cidadao)`

**Resposta atual:** O cidadão paga até 318 vezes mais pela água tratada e 4,5 vezes mais pela luz.

**Resposta nova (qwen3-vl:4b-instruct):** Uma grande empresa paga até 318 vezes mais pela água tratada e 4,5 vezes mais pela luz do que o cidadão [1].

**Fontes:** Quanto uma grande empresa paga pela água e luz comparada ao cidadão? (/consumo-corporativo) · Contratos Públicos com Multinacionais de Tecnologia e Infraestrutura Somam Bilhões no Brasil (/noticias/fornecedores-multinacionais-brasil-ti-infraestrutura) · Betim: contratos públicos somam R$ 1,2 bilhão e portal alerta para concentração de fornecedores (/noticias/betim-contratos-compras-publicas)

### Central ONSA & Blog — Maiores Consumidores de Água, Energia, Combustível e Empregos (MG e G20)

**Pergunta:** Quais setores geram mais empregos por litro de água consumido?  `(pegada-hidrica-empregos-cnae)`

**Resposta atual:** O comércio e a indústria automotiva geram muito mais empregos por água que a mineração.

**Resposta nova (qwen3-vl:4b-instruct):** O comércio e a indústria automotiva geram muito mais empregos por água que a mineração [1].

**Fontes:** Quais setores geram mais empregos por litro de água consumido? (/consumo-corporativo) · Fila do CAR no IEF Leva 4 Anos, mas Grandes Empreendimentos Tramitam em Meses (/noticias/car-ief-mg-tempo-espera-grandes-empreendimentos-servidores) · Emprego formal e controle social: vagas do CAGED e a força dos 710 conselhos municipais (/noticias/trabalho-renda-e-conselhos-de-direitos)
