# RELATÓRIO TÉCNICO — Portal Controle Popular: Arquitetura, Dados e Metodologia de um Portal Cívico de Transparência Pública

**Autor:** Prof. de Comunicação Social
**Data:** Setembro de 2026
**Formato:** ABNT NBR 14724:2011

---

## Resumo

O portal Controle Popular (controlepopular.com.br) é um portal cívico de transparência pública. Ele reúne dados oficiais espalhados por dezenas de sistemas governamentais. O objetivo é publicar esses dados em uma única tela, em linguagem acessível. O portal possui seis frentes temáticas: Cidades, Congresso, Judiciário, ONSA - Observatório Nacional Socioambiental, Função Social da Terra e Paraopeba. A arquitetura técnica usa Next.js 16, React 19, TypeScript e Tailwind CSS. Os dados vivem em dois bancos: Neon Postgres (leitura no build) e Cloudflare D1 (escritas em runtime). A publicação usa Cloudflare Workers via OpenNext. O portal aprega regras editoriais rigorosas: dado pessoal é barrado automaticamente, número sem fonte não é publicado, e insinuação é tratada como dano. São 5.482 páginas publicadas, 29.917 documentos pesquisáveis e 722 testes automatizados. O projeto serve a cidadãos sob estresse — denúncia, remoção, desastre ambiental. Por isso, acessibilidade e precisão numérica são requisitos funcionais, não estéticos.

**Palavras-chave:** transparência pública; portal cívico; dados abertos; acessibilidade digital; Next.js; Cloudflare Workers; civic technology.

---

## Abstract

The Controle Popular portal (controlepopular.com.br) is a civic transparency portal. It aggregates official data from dozens of government systems into a single, accessible interface. The portal has six thematic fronts: Cities, Congress, Judiciary, ONSA - National Socio-Environmental Observatory, Social Function of Land, and Paraopeba. The technical architecture uses Next.js 16, React 19, TypeScript, and Tailwind CSS. Data is stored in two databases: Neon Postgres (read at build time) and Cloudflare D1 (runtime writes). Publishing uses Cloudflare Workers via OpenNext. The portal enforces strict editorial rules: personal data is automatically blocked, numbers without sources are not published, and insinuation is treated as harm. The system comprises 5,482 published pages, 29,917 searchable documents, and 722 automated tests. The project serves citizens under stress — complaints, evictions, environmental disasters — making accessibility and numerical accuracy functional requirements, not aesthetic choices.

**Keywords:** public transparency; civic portal; open data; digital accessibility; Next.js; Cloudflare Workers; civic technology.

---

## 1. Introdução

### 1.1 O que é o portal

O portal Controle Popular está disponível em controlepopular.com.br. É um portal independente de transparência pública. Ele reúne dados oficiais que já são públicos. Esses dados vivem espalhados por dezenas de sistemas governamentais. O portal os publica em uma única tela, por cidade e por tema. A linguagem é acessível ao cidadão comum (CONTROLE POPULAR, 2026a).

### 1.2 Propósito

O propósito é democratizar o acesso a dados públicos de interesse social. O portal atua como ponte entre sistemas fragmentados e o cidadão. Ele transforma dados técnicos em informações compreensíveis. A metodologia prioriza dados com potencial de interesse social: análise de direitos, desigualdade, participação, recursos hídricos, licenciamento ambiental, concentração econômica e transparência de parcerias público-privadas (CONTROLE POPULAR, 2026a).

### 1.3 Frentes temáticas

O portal organiza seus dados em seis frentes temáticas. São elas: Cidades, Congresso Nacional, Judiciário, ONSA - Observatório Nacional Socioambiental, Função Social da Terra e Paraopeba. Cada frente responde a uma pergunta distinta sobre o poder público. Há ainda três eixos transversais: Direitos em Movimento, Terra e Territórios, e Estado e Economia (CONTROLE POPULAR, 2026a).

### 1.4 Público-alvo

O público-alvo do portal são cidadãos em situação de estresse. Eles estão sob ameaça de denúncia, remoção ou desastre ambiental. Essa condição impõe três exigências concretas de qualidade. Acessibilidade não é opcional — leitura em voz alta e navegação por teclado são necessárias. Número errado é dano — todo número exibido tem fonte identificável. Insinuação é dano — dois dados verdadeiros lado a lado não podem levar a conclusão falsa (CONTROLE POPULAR, 2026a).

### 1.5 Acessibilidade

O portal implementa três temas visuais: claro, escuro e alto contraste. O contraste é medido por regra WCAG - Web Content Accessibility Guidelines. WCAG são as diretrizes de acessibilidade do W3C - World Wide Web Consortium. Número sempre aparece ao lado da ressalva. Essas escolhas não são estéticas — são funcionais. O leitor sob estresse não pode depender de cor para interpretar dado. A acessibilidade garante que a informação chegue a qualquer pessoa, em qualquer condição (CONTROLE POPULAR, 2026a).

---

## 2. Fundamentação Teórica

### 2.1 Transparência e dados abertos no Brasil

A Lei de Acesso à Informação (LAI) é a Lei Federal nº 12.527/2011. Ela obriga órgãos públicos a disponibilizar dados de interesse coletivo. A LAI entrou em vigor em 16 de maio de 2012. Ela criou o Portal da Transparência federal. O Portal da Transparência reúne dados de despesas, receitas e servidores públicos. Esses sistemas são obrigatórios, mas fragmentados. Cada órgão publica em formato diferente. O portal Controle Popular atua nessa lacuna — integra dados de múltiplas fontes em uma interface única (BRASIL, 2011).

### 2.2 Comunicação social e tecnologia cívica

Comunicação social é o campo que estuda processos de comunicação em contextos sociais. Tecnologia cívica (civic technology) é a aplicação de tecnologias digitais para fortalecer a participação cidadã. O portal Controle Popular se insere nessa interface. Ele usa ferramentas de programação web para traduzir dados públicos em informação cívica. A abordagem combina jornalismo de dados com engenharia de software. O resultado é uma ferramenta de vigilância democrática (GIGERICH, 2012).

### 2.3 Inclusão digital e acessibilidade

Inclusão digital é o processo de garantir acesso equitativo às tecnologias da informação. WCAG 2.1 são as diretrizes de acessibilidade de conteúdo web. Elas definem quatro princípios: perceptível, operável, compreensível e robusto. O portal Controle Popular implementa os três primeiros. Perceptível: contraste medido, texto alternativo em imagens. Operável: navegação por teclado, sem dependência de mouse. Compreensível: linguagem simples, siglas explicadas na primeira menção (W3C, 2018).

### 2.4 Rigor acadêmico em jornalismo de dados

Jornalismo de dados é a prática de coletar, processar e apresentar dados para contar histórias. O rigor exige verificação dupla de metodologia, cálculo e raciocínio lógico. Toda fonte oficial deve ser citada com hiperlink no texto e botão de referência. Resumo gerado por modelo de linguagem é o portal afirmando algo — rotular com data e modelo, nunca como conclusão do autor. Essas práticas alinham o portal com padrões de qualidade acadêmica (SILVERMAN, 2014).

---

## 3. Metodologia

### 3.1 Coleta de dados

A coleta usa coletores automatizados em Python e TypeScript. Eles rodam via workflows agendados. O ciclo respeita regras rígidas. Há pausa mínima de 1 segundo entre requisições. User-Agent identifica o projeto honestamente — nunca usa agente de navegador falso. Retomada por checkpoint evita perda de dados. Coleta roda fora da CI - Integração Contínua. Robots.txt é respeitado com decisão registrada (CONTROLE POPULAR, 2026b).

### 3.2 Fontes de dados

O portal usa 42 fontes de dados públicas. Destacam-se: IBGE - Instituto Brasileiro de Geografia e Estatística (PIB, IDH), IBAMA - Instituto Brasileiro do Meio Ambiente (licenciamento), CNJ - Conselho Nacional de Justiça (judiciário), PNCP - Portal Nacional de Contratações Públicas (contratos e licitações), DATASUS - Departamento de Informação do SUS (saúde), INEP - Instituto Nacional de Estudos e Pesquisas Educacionais (escolas), FEAM - Fundação Estadual de Meio Ambiente (barragens), ANM - Agência Nacional de Mineração (processos minerários) e ALMG - Assembleia Legislativa de Minas Gerais (legislação estadual) (CONTROLE POPULAR, 2026b).

### 3.3 Processamento (ETL)

ETL - Extract, Transform, Load é o processo de extração, transformação e carregamento de dados. O portal usa pipelines ETL em Python e TypeScript. Scripts em scripts/ coletam os dados brutos. ETLs em etl/ transformam e carregam nos bancos. Drizzle ORM mapeia tabelas Postgres para TypeScript. São 124 tabelas em quatro schemas: public, congresso, judiciario e terras. Dados JSON grande ficam em public/data/ e são lidos via ASSETS.fetch() (CONTROLE POPULAR, 2026c).

### 3.4 Publicação

A publicação usa SSG - Static Site Generation. Todas as páginas são pré-renderizadas no build. O build roda na máquina home-pc com Postgres local. Deploy usa Cloudflare Workers via OpenNext. Next.js 16 gera o HTML estático. O adapter OpenNext converte para Workers. Cloudflare Tunnel expõe o servidor next start à internet. Domínio controlepopular.com.br aponta para o túnel (CONTROLE POPULAR, 2026c).

### 3.5 Verificação

Verificação ocorre em três camadas. Testes unitários usam vitest para lib/ e node:test para o globo 3D. São 601 testes vitest e 121 testes node:test. Varredura de dado pessoal roda no pre-push e na CI. Script sem-cpf-no-repo.test.ts valida por mod-11. Script checar-dado-pessoal-em-dado.py varre o dado ingerido. CI roda 12 workflows. Nenhum dado pessoal chega à produção sem passar por essa triagem (CONTROLE POPULAR, 2026d).

### 3.6 Desenvolvimento com assistência de IA

O projeto usa agentes de IA para acelerar tarefas repetitivas. Sessões de assistente operam em worktrees próprios. Cada sessão tem porta e checkout exclusivos. Git worktree garante isolamento entre sessões. Mensagens de commit seguem formato específico: efeito na primeira linha, número medido no corpo, trailer Co-Authored-By. Dado pessoal é sempre sanitizado antes de enviar a prompts de IA (CONTROLE POPULAR, 2026d).

---

## 4. Arquitetura Técnica

### 4.1 Stack tecnológica

A stack usa Next.js 16 com App Router. React 19 é a biblioteca de componentes. TypeScript fornece tipagem estática. Tailwind CSS 4 é o framework de estilos. lucide-react oferece ícones. next-themes gerencia temas visuais. drizzle-orm mapeia banco relacional. pdf-lib e docx geram documentos no navegador. gsap anima elementos visuais. Neon serverless driver conecta ao Postgres (CONTROLE POPULAR, 2026c).

### 4.2 Banco dual: Neon Postgres + Cloudflare D1

Neon Postgres é o banco principal. É serverless com autosuspend — mantém cota Free. Drizzle ORM gerencia 124 tabelas em 4 schemas. Leitura acontece no build. Acesso degrada a null fora do contexto certo. Cloudflare D1 é SQLite em Workers. Escritas ao vivo vivem nele: pageviews, zap, classificados, moderação. D1 só funciona como binding do Worker — fora do Worker devolve null (CONTROLE POPULAR, 2026c).

### 4.3 Publicação: build local → Cloudflare Workers

O build roda no home-pc. next build --webpack gera HTML estático. opennextjs-cloudflare build converte para Workers. populateCache popula assets. deploy publica no Workers. O site roda por next start -p 3000. Cloudflare Tunnel expõe o servidor à internet. Worker Cloudflare continua como fallback técnico (CONTROLE POPULAR, 2026c).

### 4.4 SSG e limites de bundle

SSG gera todas as páginas no build. Nenhuma consulta ao banco em runtime. Teto de 25 MiB por asset no Workers. Teto de 3 MiB gzip de bundle. Máximo de 20.000 arquivos. Coleção nunca vai como props de componente de cliente. Acima de 2.000 linhas, serve do índice fatiado ou tabela estática (CONTROLE POPULAR, 2026c).

### 4.5 Compactação de dados

Duas implementações comprimem dados grandes. ComunicaBR usa esqueleto nacional compartilhado. 853 municípios: 99 MiB → 2,16 MB. Compactação genérica usa esqueleto + dicionário. Rouanet: 7,9 MB → 2,4 MB (−69%). Decisão: não unificar as duas. Cada uma serve a um formato específico. Aplainar perderia o ganho de ordem de grandeza (CONTROLE POPULAR, 2026c).

### 4.6 Segurança

Segurança inclui CSP - Content Security Policy, HSTS - HTTP Strict Transport Security e Permissions-Policy. Varredura de CPF roda em dois scripts. sem-cpf-no-repo.test.ts valida mod-11 em código. checar-dado-pessoal-em-dado.py varre dado ingerido. Hook pre-push e CI rechecam antes de commitar. Dado pessoal nunca chega à produção (CONTROLE POPULAR, 2026d).

---

## 5. As Seis Frentes Temáticas

### 5.1 Cidades — Municipalidade

#### 5.1.1 Escopo

Seis municípios publicados: Betim, BH - Belo Horizonte, SP - São Paulo, Araçuaí, Diamantina e Itinga. Catálogo de 199 cidades estratégicas. 66 templates de rotas geram mais de 400 páginas estáticas. Cobertura varia por cidade e a diferença é mostrada, nunca escondida (CONTROLE POPULAR, 2026a).

#### 5.1.2 Subseções

Subseções: Prefeitura (contratos, despesas, servidores, obras, licitações), Câmara Municipal (vereadores, proposições, votações), Saúde, Educação, Economia, Segurança, Social, Meio Ambiente, Terras, Clima, Infraestrutura, Mineração, Grupo Econômico e Teia de Interesses (CONTROLE POPULAR, 2026a).

#### 5.1.3 Fontes de dados

Fontes: PNCP (contratos e licitações), IBGE (PIB e IDH), INEP (escolas), DATASUS (saúde), IBAMA (meio ambiente), ComunicaBR (serviços públicos), SIGMINE (mineração), FEAM (barragens) e LAI (documentos oficiais) (CONTROLE POPULAR, 2026b).

#### 5.1.4 Recursos visuais

Recursos: painéis Bento Grid com cartões de status, gráficos SVG de ranking, índice de risco climático, widget meteorológico e cobertura de sinal de celular. Tabelas usam TabelaEstatica.tsx para listas grandes. Índice fatiado pagina acima de 2.000 linhas (CONTROLE POPULAR, 2026a).

### 5.2 Congresso — Congresso Nacional

#### 5.2.1 Escopo

Monitoramento do Congresso Nacional federal. Mais de 5.500 proposições federais em 2026. Análise de direitos com metodologia garantista versus reducionista. Subseções: Proposições, Parlamentares (93 deputados e 2 senadores de MG), Bancadas, Comissões, Votações e Cota Parlamentar (CONTROLE POPULAR, 2026a).

#### 5.2.2 Fontes de dados

Fontes: APIs da Câmara dos Deputados e do Senado Federal. Dados incluem votações, proposições, composição de bancadas e emendas parlamentares (CONTROLE POPULAR, 2026b).

#### 5.2.3 Recursos visuais

Recursos: gerador de ofício em PDF e DOCX no navegador. Rubrica determinística — número fixo por sessão. Análise de direitos compara posição do relator com doutrina. Alertas de votação monitoram pautas do dia (CONTROLE POPULAR, 2026a).

### 5.3 Judiciário — Tribunais Superiores

#### 5.3.1 Escopo

Transparência do Judiciário federal. 15 tribunais superiores monitorados. Subseções: Tribunais, Indicações, Vagas, Contatos (990 unidades judiciárias), Inspeções CNJ (13 relatórios), Presídios (285 estabelecimentos), Defensoria (176 de 298 comarcas sem defensores) e SIRENEJud (CONTROLE POPULAR, 2026a).

#### 5.3.2 Fontes de dados

Fontes: CNJ - Conselho Nacional de Justiça, TJMG - Tribunal de Justiça de Minas Gerais, Senado Federal, DataJud (consulta ao vivo) e Corregedoria-Geral da Justiça do Trabalho (CONTROLE POPULAR, 2026b).

#### 5.3.3 Recursos visuais

Recursos: calculadora de aposentadoria (idade obrigatória de 75 anos), rastreamento de indicações, fichas analíticas de 7 instituições com liderança, organograma, contatos, orçamento LOA e documentos. Processos ambientais por UF e tribunal via SIRENEJud/CNJ (CONTROLE POPULAR, 2026a).

### 5.4 Ambiental / ONSA — Observatório Nacional Socioambiental

#### 5.4.1 Escopo

Dados ambientais: 454 reuniões do COPAM - Conselho Estadual de Política Ambiental, 19.704 licenças e 909 barragens. Subseções: COPAM, Licenciamento, Barragens (3 registros: FEAM, SNISB e SIGBM), Legislação (15.348 normas), TACs - Termos de Ajustamento de Conduta, Decisões LAI, Crimes Socioambientais, Direitos Humanos Ambientais, Conselhos, Litígios Climáticos e Clima e Risco (CONTROLE POPULAR, 2026a).

#### 5.4.2 Fontes de dados

Fontes: IDE-Sisema (licenciamento), FEAM (barragens estaduais), SNISB - Sistema Nacional de Informações sobre Segurança de Barragens, SIGBM - Sistema de Informações Georreferenciadas de Barragens de Mineração, ALMG/SEMAD/SIAM/MMA/CNDH (legislação) e DataJud (processos ambientais) (CONTROLE POPULAR, 2026b).

#### 5.4.3 Regras editoriais

Três registros de barragens nunca são somados. FEAM (249), SNISB e SIGBM (909 no Brasil, 320 em MG) são cadastros sem identificador comum. Fusão criaria números fictícios. Busca unificada de legislação combina 6.378 normas estaduais e 8.940 federais. Gráficos SVG e exportação CSV com UTF-8 BOM (CONTROLE POPULAR, 2026a).

### 5.5 Função Social da Terra — Minas Gerais

#### 5.5.1 Escopo

Monitoramento da função social da terra e do território. Subseções: Mapa Estadual (globo 3D) e Alertas (CONTROLE POPULAR, 2026a).

#### 5.5.2 Fontes de dados

Fontes: CAR - Cadastro Ambiental Rural (imóveis rurais), SIGMINE/ANM (processos minerários), FUNAI (terras indígenas via WFS), INCRA - Instituto Nacional de Colonização e Reforma Agrária (quilombolas) e FEAM (barragens) (CONTROLE POPULAR, 2026b).

#### 5.5.3 Recursos visuais

Recursos: globo 3D interativo com imagem de satélite por zoom. Mais de 8 camadas geográficas. 4 camadas de alerta de sobreposição. Zona de Amortecimento de 8 km do SIGMINE. 54.916 polígonos de processos minerários em MG. Tooltip de 2 segundos. 15 terras indígenas mapeadas em MG (CONTROLE POPULAR, 2026a).

### 5.6 Paraopeba — Rompimento da Barragem em Brumadinho

#### 5.6.1 Escopo

Reparação do rompimento da barragem de Brumadinho. O desastre ocorreu em 25 de janeiro de 2019. 270 pessoas morreram. Subseções: Entenda, Clipping (149 itens), Linha do Tempo (23 marcos), Quem Atua (18 organizações), Auxílio Emergencial, Execução (auditoria FGV, R$ 5,48 bilhões, 26 municípios), Documentos (471 da UFMG), Biblioteca ATI (597 publicações), Auditoria AJRI (467 documentos) e Análise Integrada (CONTROLE POPULAR, 2026a).

#### 5.6.2 Fontes de dados

Fontes: FGV - Fundação Getulio Vargas (auditoria independente), Plataforma Brumadinho UFMG, ATI - Ação Técnica Independente e AJRI - Agência de Jornalismo Investigativo. Duas fontes claramente separadas em todas as telas (CONTROLE POPULAR, 2026b).

#### 5.6.3 Recursos visuais

Recursos: gráfico SVG, exportação CSV, visualização de linha do tempo. Execução do Acordo: 26 municípios, R$ 5,48 bilhões, 73,8% pago. Biblioteca unificada de crimes socioambientais combina Mariana e Brumadinho. Triagem de dado pessoal dedica-se ao acervo da Plataforma Brumadinho UFMG (CONTROLE POPULAR, 2026a).

---

## 6. Seções Transversais

### 6.1 Direitos em Movimento

Hub para cidadãos: "Que lei protege isso?", "Onde buscar ajuda?", "Como pedir informação?", "Como denunciar?". Facilitador de denúncia gera documentos .docx e .pdf no navegador. Subseções: Ajuda, Denúncia, Conselhos, Educação, Informação (LAI), Saúde Pública e Trabalho e Renda (CONTROLE POPULAR, 2026a).

### 6.2 Terra e Territórios

Hub de soberania: 199 cidades, bacias hidrográficas, terras indígenas e barragens. Conecta dados de território com dados municipais. Globo 3D é o principal recurso visual (CONTROLE POPULAR, 2026a).

### 6.3 Estado e Economia

Transparência institucional: orçamento, PNCP, judiciário e Congresso. Liga dados de contratos públicos com dados de empresas. Monitora concentração econômica e poder de mercado (CONTROLE POPULAR, 2026a).

### 6.4 Empresas — Observatório de Grandes Empresas

130 empresas e fundos em 7 setores. Dados de B3 - Bolsa de Valores, NYSE - New York Stock Exchange, ESG - Environmental, Social and Governance, TACs e licenciamento ambiental. Fichas de empresa com Governança, Direitos Humanos, Contratos Públicos e Linha do Tempo interativa. Gráfico SVG e 4 cartões de status (CONTROLE POPULAR, 2026a).

### 6.5 Biblioteca Unificada

Arquivo documental unificado: ESG, autos de processo e SciELO - Scientific Electronic Library Online. Metadado e link, nunca o arquivo original. Lei 9.610/98 protege direitos autorais. Busca combinada por tema, fonte e data (CONTROLE POPULAR, 2026a).

### 6.6 Busca Unificada

Busca em texto completo em todo o portal. Mais de 29.917 documentos indexados. 31.000 lexemas. Índice do lado do cliente, carregado sob demanda. Uma vez por sessão. AbortController interrompe carregamento (CONTROLE POPULAR, 2026a).

### 6.7 Blog e Relatórios Técnicos

23 posts publicados com SEO acadêmico ABNT/BibTeX. Schema.org e Dublin Core nos metadados. Formatação ABNT NBR 6023:2025 para referências. Citações acadêmicas verificáveis (CONTROLE POPULAR, 2026a).

### 6.8 API Pública

Mais de 14 datasets estáticos em JSON. Swagger UI interativo. Especificação OpenAPI. Gerada no prebuild. Contrato estável em /api/v1/. Sem chave de acesso. Dados públicos para reuso (CONTROLE POPULAR, 2026a).

---

## 7. Governança de Dados

### 7.1 Volume de dados

Mais de 200 arquivos JSON totalizam aproximadamente 180 MB. 60+ tabelas de banco em 4 schemas. 25+ scripts de coleta. 20+ scripts de ETL e processamento. Dados versionados em git com trilha completa de alterações (CONTROLE POPULAR, 2026c).

### 7.2 Duas compactações

ComunicaBR: esqueleto nacional + codec específico. 99 MiB → 2,16 MB. Compactação genérica: esqueleto + dicionário com decisão de internação medida por coluna. Rouanet: 7,9 MB → 2,4 MB. Decisão: não unificar. Cada implementação serve a um formato diferente (CONTROLE POPULAR, 2026c).

### 7.3 Triagem de dado pessoal

Dois scripts varrem dado pessoal. sem-cpf-no-repo.test.ts valida por módulo 11. checar-dado-pessoal-em-dado.py varre o dado ingerido. Hook pre-push e CI executam automaticamente. CPF em ementa oficial é redigido na ingestão. Máscara da fonte não é prova de proteção — 215 CPFs vieram por extenso em campos de nome na Rouanet (CONTROLE POPULAR, 2026d).

### 7.4 Regras editoriais

O número vem do dado; o modelo só embrulha. Ressalva viaja colada ao número, ou o número não vai. Lacuna é informação — dizer quantos itens vieram vazios. Dois dados verdadeiros lado a lado não autorizam conclusão falsa. Resumo gerado por máquina é o portal afirmando algo — rotular com data e modelo (CONTROLE POPULAR, 2026a).

---

## 8. Assistente de IA — Seu Nonô

### 8.1 Arquitetura em escada

O assistente usa quatro degraus. Cada degrau só é acionado quando o anterior não resolve. Degrau 0: navegação direta (0,35 ms). Degrau 1: busca no índice estático. Degrau 2: composição determinística. Degrau 3: LLM via Ollama + remoto. A tela identifica qual degrau respondeu (CONTROLE POPULAR, 2026a).

### 8.2 Base de conhecimento

Base inclui frentes, contextos, páginas, blog e designações. 241 destinos navegáveis. Catálogo como constante de módulo — 2,4 KiB gzip. Navegação interpretar() devolve candidatos (máximo 8), nunca palpite único. Sem rede, sem banco (CONTROLE POPULAR, 2026c).

### 8.3 Verificação de citação

Verificação determinística de citação. Limiar de abstenção: 0,15. Respostas com citação [n] clicável da fonte. Painel de fontes com link. Ressalva de IA sempre visível com data e modelo. A IA só embrulha dado que existe — nunca afirma número novo (CONTROLE POPULAR, 2026a).

---

## 9. Infraestrutura de Monitoramento e Operação

### 9.1 Monitoramento do servidor

Health check HTTP a cada 5 minutos via cronjob. Script vigia-servidor.mts monitora disponibilidade. Reinício automático com cap de 3 reinícios por hora. Notificação Telegram em caso de falha. Runbook documentado para site fora do ar — mitigações genéricas primeiro, causa depois (CONTROLE POPULAR, 2026e).

### 9.2 Build safety

Travas impedem publicar site errado. Piso de páginas: menos de 1.000 aborta. Queda relativa: mais de 20% vs última aborta. ETL inteiro no chão: 100% dos passos falhando — é ambiente, não fonte. Asset grande: mais de 20 MiB avisa, mais de 25 MiB aborta. Contagem é o sinal de saúde, não exit code do build (CONTROLE POPULAR, 2026e).

### 9.3 Cronogramas ETL

Coletores rodam em cadências diversas: diária, semanal, mensal e trimestral. Radar de notícias roda dentro da rotina, antes do build. Nunca existe coleta que não foi publicada. Fluxo: ETL → radar → build → travas → deploy (CONTROLE POPULAR, 2026e).

### 9.4 Download e arquivo de documentos

Script download-documentos.mts baixa PDFs citados no site. Organiza em documentos-site/{tema}/{data}/. Compatível com regras de direitos autorais. Documentos da AJRI têm marca-d'água com nome e CPF — não publicar os PDFs, apenas catálogo e link (CONTROLE POPULAR, 2026b).

---

## 10. Resultados e Impacto

### 10.1 Métricas quantitativas

5.482 páginas publicadas (setembro de 2026). 29.917 documentos pesquisáveis. 601 testes vitest + 121 testes node:test. 12 workflows de CI - Integração Contínua. Mais de 25 coletores automatizados. 14+ datasets na API pública. 130 empresas e fundos monitorados. 15.348 normas na biblioteca de legislação (CONTROLE POPULAR, 2026f).

### 10.2 Impacto social

Rastreamento da reparação de Brumadinho: R$ 5,48 bilhões, 26 municípios. Transparência do Judiciário: 15 tribunais, 990 unidades. Monitoramento ambiental: 454 reuniões COPAM, 19.704 licenças, 909 barragens. Auxílio a cidadãos sob estresse: documentos gerados no navegador, sem necessidade de advogado (CONTROLE POPULAR, 2026a).

### 10.3 Cobertura geográfica

6 municípios com painel completo em MG. 199 cidades com fontes cruzadas. 853 municípios no dataset ComunicaBR. 15 terras indígenas mapeadas. 54.916 processos minerários em MG. 909 barragens no Brasil (CONTROLE POPULAR, 2026f).

---

## 11. Conclusão

### 11.1 Contribuições

O portal Controle Popular demonstra viabilidade técnica de portal cívico integrado. Ele combina dados de 42 fontes públicas em interface única. Regras editoriais rigorosas garantem qualidade informativa. Acessibilidade WCAG é requisito funcional. Verificação automática de dado pessoal protege privacidade. Assistente de IA navega o acervo sem afirmar números novos. API pública facilita reuso dos dados (CONTROLE POPULAR, 2026a).

### 11.2 Limitações

Neon Postgres tem limite Free de 100 CU-hours/mês. Storage está em aproximadamente 94% (470/500 MB). Workers Cloudflare impõe teto de 25 MiB por asset e 3 MiB gzip de bundle. Publicação depende de máquina local (home-pc) com Postgres local. Neon em HTTP 402 impedia build sem banco local. Máquina de dev não consegue buildar nem medir .cache (CONTROLE POPULAR, 2026c).

### 11.3 Direções futuras

Expansão para os 27 estados brasileiros. Migração parcial para Cloudflare D1 — storage em D1 não tem o mesmo limite do Postgres Free. Melhoria do assistente com degrau 3 (LLM) completo. Integração de novas fontes: diário oficial, DataJud ao vivo, base cartográfica do INCRA. Protocolo de LAI em todos os órgãos monitorados (CONTROLE POPULAR, 2026f).

---

## Referências

BRASIL. **Lei nº 12.527, de 18 de novembro de 2011.** Regula o acesso à informação previsto no inciso XXXIII do art. 5º da Constituição Federal. Diário Oficial da União, Brasília, DF, 18 nov. 2011. Disponível em: <http://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm>. Acesso em: 15 set. 2026.

BRASIL. **Lei nº 13.709, de 14 de agosto de 2018.** Lei Geral de Proteção de Dados Pessoais (LGPD). Diário Oficial da União, Brasília, DF, 14 ago. 2018. Disponível em: <http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm>. Acesso em: 15 set. 2026.

BRASIL. **Lei nº 14.133, de 1º de abril de 2021.** Estabelece as normas gerais licitações e contratos administrativos. Diário Oficial da União, Brasília, DF, 1 abr. 2021. Disponível em: <http://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm>. Acesso em: 15 set. 2026.

BRASIL. **Lei nº 9.610, de 19 de fevereiro de 1998.** Regula os direitos autorais. Diário Oficial da União, Brasília, DF, 19 fev. 1998. Disponível em: <http://www.planalto.gov.br/ccivil_03/leis/l9610.htm>. Acesso em: 15 set. 2026.

CONTROLE POPULAR. **PRODUTO.md: visão geral do portal.** Disponível em: <https://github.com/FinweeJur/controle-popular/blob/main/docs/01-produto/PRODUTO.md>. Acesso em: 15 set. 2026a.

CONTROLE POPULAR. **FONTES.md: fontes de dados — referência operacional.** Disponível em: <https://github.com/FinweeJur/controle-popular/blob/main/docs/06-fontes/FONTES.md>. Acesso em: 15 set. 2026b.

CONTROLE POPULAR. **ARQUITETURA.md: arquitetura técnica do portal.** Disponível em: <https://github.com/FinweeJur/controle-popular/blob/main/docs/04-arquitetura/ARQUITETURA.md>. Acesso em: 15 set. 2026c.

CONTROLE POPULAR. **DESENVOLVIMENTO.md: fluxo de trabalho.** Disponível em: <https://github.com/FinweeJur/controle-popular/blob/main/docs/03-desenvolvimento/DESENVOLVIMENTO.md>. Acesso em: 15 set. 2026d.

CONTROLE POPULAR. **OPERACAO.md: coletar, construir e publicar.** Disponível em: <https://github.com/FinweeJur/controle-popular/blob/main/docs/05-operacao/OPERACAO.md>. Acesso em: 15 set. 2026e.

CONTROLE POPULAR. **ESTADO.md: o portal hoje.** Disponível em: <https://github.com/FinweeJur/controle-popular/blob/main/docs/02-estado/ESTADO.md>. Acesso em: 15 set. 2026f.

CLOUDFLARE. **Workers platform documentation.** Disponível em: <https://developers.cloudflare.com/workers/>. Acesso em: 15 set. 2026.

DRIZZLE ORM. **Drizzle ORM documentation.** Disponível em: <https://orm.drizzle.team/>. Acesso em: 15 set. 2026.

GIGERICH, Kevin. **Civic tech field guide.** Disponível em: <https://www.civictechfieldguide.org/>. Acesso em: 15 set. 2012.

MMA — MINISTÉRIO DO MEIO AMBIENTE. **Sistema Nacional de Informações sobre Meio Ambiente (SINIMA).** Disponível em: <https://www.gov.br/mma/>. Acesso em: 15 set. 2026.

NEON. **Neon serverless Postgres documentation.** Disponível em: <https://neon.tech/docs>. Acesso em: 15 set. 2026.

NEXT.JS. **Next.js documentation.** Disponível em: <https://nextjs.org/docs>. Acesso em: 15 set. 2026.

OPENNEXT. **OpenNext — open-source adapter for Cloudflare.** Disponível em: <https://opennext.js.org/cloudflare>. Acesso em: 15 set. 2026.

PNCP — PORTAL NACIONAL DE CONTRATAÇÕES PÚBLICAS. **Dados abertos de contratos públicos.** Disponível em: <https://pncp.gov.br/>. Acesso em: 15 set. 2026.

SILVERMAN, Craig. **Verification handbook: a definitive guide to verifying digital content for emergency coverage.** European Journalism Centre, 2014. Disponível em: <https://verificationhandbook.com/>. Acesso em: 15 set. 2026.

TAILWIND CSS. **Tailwind CSS documentation.** Disponível em: <https://tailwindcss.com/docs>. Acesso em: 15 set. 2026.

W3C — WORLD WIDE WEB CONSORTIUM. **Web Content Accessibility Guidelines (WCAG) 2.1.** Disponível em: <https://www.w3.org/TR/WCAG21/>. Acesso em: 15 set. 2018.

ABNT — ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 6023:2025 — Referências: elaboração.** Rio de Janeiro: ABNT, 2025.

ABNT — ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 14724:2011 — Trabalhos acadêmicos: apresentação.** Rio de Janeiro: ABNT, 2011.

---

**Fim do relatório.**
