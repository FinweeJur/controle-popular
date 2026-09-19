# RELATORIO TECNICO PORTAL

> **Tipo:** RELATORIO
> **Domínio:** global
> **Última medição:** 2026-09-19
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [ESTADO.md](02-estado/ESTADO.md), [GUIA-DE-DOCUMENTACAO.md](GUIA-DE-DOCUMENTACAO.md)
> **Palavras-chave:** relatorio, tecnico, portal, rotas, frentes

## Sumário

- [Propósito](#propósito)
- [Resumo](#resumo)


**Autor:** Prof. de Comunicação Social  
**Data:** Setembro de 2026  
**Formato:** ABNT NBR 14724:2011  

---

> *"Quando eu não tenho o que comer, ao invés de eu xingar ou pensar em morte... eu escrevo."*  
> — **Carolina Maria de Jesus**, *Quarto de Despejo*, 1960

---

## Resumo

O [portal Controle Popular](https://controlepopular.com.br/) é um portal cívico de transparência pública. Ele reúne dados oficiais de dezenas de sistemas governamentais. O objetivo é publicar dados em uma única tela, em linguagem acessível.

O portal possui seis frentes temáticas. São elas: [Cidades](https://controlepopular.com.br/cidades), [Congresso Nacional](https://controlepopular.com.br/congresso), [Judiciário](https://controlepopular.com.br/judiciario), [Ambiental/ONSA](https://controlepopular.com.br/ambiental), [Função Social da Terra](https://controlepopular.com.br/funcaosocialterra) e [Paraopeba](https://controlepopular.com.br/paraopeba).

A arquitetura usa Next.js 16, React 19, TypeScript e Tailwind CSS. Os dados vivem em dois bancos: Neon Postgres e Cloudflare D1. Neon Postgres é lido no build. Cloudflare D1 recebe escritas em runtime. A publicação usa Cloudflare Workers via OpenNext.

O portal emprega regras editoriais rigorosas. Dado pessoal é barrado automaticamente. Número sem fonte não é publicado. Insinuação é tratada como dano.

São 5.511 páginas publicadas (build de 16/09/2026). Há 29.917 documentos pesquisáveis. O projeto conta com 722 testes automatizados (base 15/08/2026).

O portal serve a cidadãos sob estresse. São situações de denúncia, remoção e desastre ambiental. Acessibilidade e precisão numérica são requisitos funcionais. O projeto dialoga com cinco áreas do saber: História, Geografia, Direito, Sociologia e Educação.

**Palavras-chave:** transparência pública; portal cívico; dados abertos; acessibilidade digital; Next.js; Cloudflare Workers; tecnologia cívica.

---

## Abstract

The Controle Popular portal (controlepopular.com.br) is a civic transparency portal. It aggregates official data from dozens of government systems into a single, accessible interface. The portal has six thematic fronts: Cities, Congress, Judiciary, ONSA — National Socio-Environmental Observatory, Social Function of Land, and Paraopeba. The technical architecture uses Next.js 16, React 19, TypeScript, and Tailwind CSS. Data is stored in two databases: Neon Postgres (read at build time) and Cloudflare D1 (runtime writes). Publishing uses Cloudflare Workers via OpenNext. The portal enforces strict editorial rules: personal data is automatically blocked, numbers without sources are not published, and insinuation is treated as harm. The system comprises 5,511 published pages (build of 16/09/2026), 29,917 searchable documents, and 722 automated tests (baseline 08/15/2026). The project serves citizens under stress — complaints, evictions, environmental disasters — making accessibility and numerical accuracy functional requirements. The project dialogues with five fields of knowledge: History, Geography, Law, Sociology, and Education.

**Keywords:** public transparency; civic portal; open data; digital accessibility; Next.js; Cloudflare Workers; civic technology.

---

## 1. Introdução

> *"Ah, comigo o mundo vai modificar-se. Não gosto do mundo como ele é."*  
> — **Carolina Maria de Jesus**, *Quarto de Despejo*, 1960

### 1.1 O que é o portal

O [portal Controle Popular](https://controlepopular.com.br/) está em controlepopular.com.br. É um portal independente de transparência pública. Ele reúne dados oficiais que já são públicos. Esses dados vivem espalhados por dezenas de sistemas. O portal os publica em uma única tela. A publicação é feita por cidade e por tema. A linguagem é acessível ao cidadão comum.

### 1.2 Propósito

O propósito é democratizar o acesso a dados públicos. O portal atua como ponte entre sistemas fragmentados. Ele transforma dados técnicos em informações compreensíveis.

A metodologia prioriza dados de interesse social. São eles: análise de direitos, desigualdade e participação. Também: recursos hídricos, licenciamento ambiental, concentração econômica. E parcerias público-privadas com transparência.

### 1.3 Frentes temáticas

O portal organiza dados em seis frentes:

1. [Cidades](https://controlepopular.com.br/cidades);
2. [Congresso Nacional](https://controlepopular.com.br/congresso);
3. [Judiciário](https://controlepopular.com.br/judiciario);
4. Ambiental/ONSA — [Observatório Nacional Socioambiental](https://controlepopular.com.br/ambiental);
5. [Função Social da Terra](https://controlepopular.com.br/funcaosocialterra);
6. [Paraopeba](https://controlepopular.com.br/paraopeba).

Cada frente responde a uma pergunta distinta. Há três eixos transversais ao portal todo. São eles: [Direitos em Movimento](https://controlepopular.com.br/direitos-em-movimento), [Terra e Territórios](https://controlepopular.com.br/terra-e-territorios) e [Estado e Economia](https://controlepopular.com.br/estado-e-economia).

### 1.4 Público-alvo

O público-alvo são cidadãos em situação de estresse. Estão sob ameaça de denúncia ou remoção. Também sob risco de desastre ambiental.

Essa condição impõe exigências concretas de qualidade. Acessibilidade não é opcional. Leitura em voz alta é necessária. Navegação por teclado é necessária. Número errado é dano. Todo número exibido tem fonte identificável. Insinuação é dano. Dois dados verdadeiros lado a lado não podem levar a conclusão falsa.

### 1.5 Acessibilidade

O portal implementa três temas visuais: claro, escuro e alto contraste. O contraste é medido pela regra [WCAG](https://www.w3.org/TR/WCAG21/). WCAG são as diretrizes de acessibilidade do W3C. W3C é o World Wide Web Consortium.

Número sempre aparece ao lado da ressalva. Essas escolhas são funcionais. O leitor sob estresse não pode depender de cor. A acessibilidade garante que a informação chegue a qualquer pessoa.

---

## 2. Fundamentação Teórica — dialogando com História, Geografia, Direito, Sociologia e Educação

> *"A nossa escrevivência não pode ser lida como história de ninar os da casa-grande, mas sim para incomodá-los em seus sonhos injustos."*  
> — **Conceição Evaristo**, *Becos da Memória*, 2006

### 2.1 Transparência e dados abertos no Brasil

A LAI — Lei de Acesso à Informação — é a [Lei Federal nº 12.527/2011](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm). Ela obriga órgãos públicos a disponibilizar dados coletivos. A LAI entrou em vigor em 16 de maio de 2012.

Ela criou bases para portais de transparência. Esses sistemas são obrigatórios, mas fragmentados. Cada órgão publica em formato diferente. O portal Controle Popular atua nessa lacuna. Ele integra dados de múltiplas fontes. A integração é feita em uma interface única.

No contexto histórico, a LAI representa uma conquista da sociedade civil. Ela nasceu de mobilização popular nos anos 2000. A [Lei 12.527/2011](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm) consagrou o direito à informação pública. Esse direito é anterior à internet. Ele vem da luta por transparência governamental. O portal amplia essa conquista. Ele leva dados públicos ao cidadão comum.

No plano geográfico, a fragmentação dos dados revela desigualdades regionais. Sistemas federais nem sempre cobrem municípios pequenos. A coleta manual em portais municipais é necessária. Isso cria um mosaico de informações dispersas. O portal resolve esse problema técnico e social.

No plano jurídico, a LAI se conecta à [Constituição Federal de 1988](http://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm). O artigo 5º, inciso XXXIII, garante o acesso à informação. A LGPD — Lei Geral de Proteção de Dados — é a [Lei nº 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm). Ela complementa a LAI ao proteger dados pessoais. O portal obedece às duas leis simultaneamente. Dados públicos são publicados. Dados pessoais são barrados.

### 2.2 Comunicação social e tecnologia cívica

Comunicação social estuda processos de comunicação em contextos sociais. Tecnologia cívica — ou civic technology — aplica tecnologias digitais ao cidadão. O portal se insere nessa interface. Ele usa programação web para traduzir dados públicos. A abordagem combina jornalismo de dados com engenharia de software. O resultado é uma ferramenta de vigilância democrática.

O portal se conecta à tradição histórica do jornalismo investigativo. Essa tradição remonta aos enciclopedistas do século XVIII. Ela passa pela imprensa abolicionista do século XIX. Chega ao jornalismo investigativo do século XX. O portal digitaliza e amplia essa tradição.

Geograficamente, o portal abrange múltiplas escalas. Ele vai do municipal ao federal. Conecta Minas Gerais ao Brasil inteiro. Essa escala múltipla é uma inovação metodológica. Ela permite comparar territórios e políticas públicas.

Juridicamente, o portal atua como ferramenta de cidadania ativa. A [Constituição de 1988](http://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) consagra a participação popular. O portal viabiliza essa participação com dados concretos. Ele transforma o direito abstrato em ferramenta prática.

### 2.3 Inclusão digital e acessibilidade

Inclusão digital garante acesso equitativo às tecnologias. A normativa [WCAG 2.1](https://www.w3.org/TR/WCAG21/) define quatro princípios fundamentais. São eles: perceptível, operável, compreensível e robusto. O portal implementa os três primeiros.

1. Perceptível: contraste medido; texto alternativo em imagens.
2. Operável: navegação por teclado; sem dependência de mouse.
3. Compreensível: linguagem simples; siglas explicadas na primeira menção.

A inclusão digital se conecta à história da exclusão social. No Brasil, a exclusão digital reproduz desigualdades históricas. Ampliar o acesso à informação é um ato de justiça social. O portal implementa essa justiça com código acessível.

Na perspectiva geográfica, a inclusão digital varia por região. Conexões lentas são comuns no interior. O portal é leve por design. Ele funciona em conexões limitadas.

Juridicamente, a acessibilidade é obrigação legal. A [Lei nº 13.146/2015 — Estatuto da Pessoa com Deficiência](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm) exige acessibilidade digital. O portal obedece a essa exigência. Ele implementa WCAG 2.1 como padrão técnico.

### 2.4 Rigor acadêmico em jornalismo de dados

Jornalismo de dados coleta, processa e apresenta dados. O rigor exige verificação dupla. São verificados: metodologia, cálculo e raciocínio lógico. Toda fonte oficial deve ser citada. A citação inclui hiperlink e botão "Fonte".

Resumo gerado por modelo de linguagem é o portal afirmando algo. Deve ser rotulado com data e modelo. Essas práticas alinham o portal com padrões acadêmicos (SILVERMAN, 2014).

O rigor metodológico se conecta à tradição histórica da ciência moderna. Francis Bacon já defendia a observação sistemática no século XVII. O portal aplica esse princípio ao dado público. Cada dado passa por verificação antes da publicação.

Na dimensão geográfica, o jornalismo de dados revela padrões espaciais. Desigualdades regionais ficam visíveis quando dados são comparados. O portal facilita essa comparação intermunicipal.

No plano jurídico, o rigor protege o portal de responsabilização. Dados verificados têm respaldo legal. Fontes identificáveis permitem auditoria. Essas práticas são exigidas pela [LAI](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm).

### 2.5 Sociologia da informação pública

A estrutura social brasileira é marcada pela desigualdade. O sociólogo Florestan Fernandes analisou essa formação (FERNANDES, 1975). Ele mostrou que a República manteve privilégios coloniais.

A informação pública segue o mesmo padrão. O Estado produz dados sobre a vida coletiva. Mas o cidadão comum não acessa esses dados. Essa distância tem nome: assimetria informacional. Assimetria é a distância entre quem sabe e quem decide. A transparência pública reduz essa distância. O portal existe para isso.

Darcy Ribeiro compreendeu o povo brasileiro como nação em formação (RIBEIRO, 1995). Essa formação exige letramento cívico. O portal serve a esse letramento. Ele transforma dados espalhados em informação legível. A leitura do orçamento é também leitura do mundo.

Há ainda a desigualdade ambiental. O pesquisador Antônio Lier definiu o racismo ambiental (LIER, 2014). Danos ambientais atingem mais os territórios pobres. Mariana e Brumadinho são exemplos documentados. O portal mostra essa sobreposição com dados. Ele cruzou mineração, barragens e comunidades tradicionais.

O direito à cidade é conceito de Henri Lefebvre (LEFEBVRE, 2001). Lefebvre foi filósofo e sociólogo francês. O direito à cidade é o direito de participar da vida urbana. O portal materializa esse direito. Ele publica contratos, orçamentos e decisões municipais. O cidadão participa melhor quando sabe mais.

### 2.6 Educação popular e letramento cívico

Paulo Freire é o nome central da educação brasileira (FREIRE, 1987). Seu livro *Pedagogia do Oprimido* circula no mundo inteiro. Para Freire, educar é prática da liberdade. A leitura crítica do mundo vem antes da leitura da palavra. O portal implementa essa ordem freireana. O cidadão primeiro lê sua realidade. Depois lê os números dessa realidade.

O dado vira texto. A cidade vira contexto. O método forma leitores críticos. Não forma leitores passivos. A linguagem acessível não é simplificação. É respeito a quem lê sob estresse.

A exclusão digital é realidade brasileira. Muitos acessam a internet só pelo celular. Conexões lentas são comuns no interior. O portal é leve por decisão técnica. Acessibilidade também é inclusão. O Estatuto da Pessoa com Deficiência ([Lei nº 13.146/2015](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm)) exige conteúdo digital acessível. O portal cumpre essa exigência legal.

O portal também educa para a participação. Ele mostra conselhos municipais e canais de controle social. O cidadão descobre onde agir. Essa descoberta é ato educativo. É esperança ativa, como diz Itamar Vieira Junior (VIEIRA JUNIOR, 2019).

---

## 3. Metodologia

> *"Uma coisa é pôr ideias arranjadas, outra é lidar com país de pessoas, de carne e sangue, de mil-e-tantas misérias."*  
> — **João Guimarães Rosa**, *Grande Sertão: Veredas*, 1956

### 3.1 Coleta de dados

A coleta usa coletores automatizados em Python e TypeScript. Eles rodam via workflows agendados. O ciclo respeita regras rígidas:

1. Pausa mínima de 1 segundo entre requisições;
2. User-Agent identifica o projeto honestamente — nunca agente de navegador falso;
3. Retomada por checkpoint evita perda de dados;
4. Coleta roda fora da CI — Integração Contínua;
5. Robots.txt é respeitado, com decisão registrada.

### 3.2 Fontes de dados

O portal usa 42 fontes de dados públicas. Cada fonte serve a uma frente:

| Frente | Fontes principais |
|---|---|
| [Cidades](https://controlepopular.com.br/cidades) | [PNCP](https://pncp.gov.br/), [IBGE](https://www.ibge.gov.br/), INEP, DATASUS, IBAMA, ComunicaBR |
| [Congresso](https://controlepopular.com.br/congresso) | APIs da Câmara dos Deputados, APIs do Senado Federal |
| [Judiciário](https://controlepopular.com.br/judiciario) | [CNJ](https://www.cnj.jus.br/), TJMG, DataJud |
| [Ambiental](https://controlepopular.com.br/ambiental) | IBAMA, FEAM, SNISB, SIGBM, IDE-Sisema, ALMG, SEMAD |
| [Função Social da Terra](https://controlepopular.com.br/funcaosocialterra) | CAR, SIGMINE, FUNAI, INCRA |
| [Paraopeba](https://controlepopular.com.br/paraopeba) | FGV, Plataforma Brumadinho UFMG, ATI, AJRI |

### 3.3 Processamento — ETL

ETL significa Extract, Transform, Load. É o processo de extração, transformação e carregamento. O portal usa pipelines ETL em Python e TypeScript. Scripts em `scripts/` coletam dados brutos. ETLs em `etl/` transformam e carregam nos bancos.

Drizzle ORM mapeia tabelas Postgres (DRIZZLE ORM, 2026). São 124 tabelas em quatro schemas. Os schemas são: public, congresso, judiciario e terras. Dados JSON grandes ficam em `public/data/`. São lidos via `ASSETS.fetch()`.

### 3.4 Publicação

A publicação usa SSG — Static Site Generation. Todas as páginas são pré-renderizadas no build. O build roda na máquina home-pc. Essa máquina tem Postgres local. Deploy usa Cloudflare Workers via OpenNext (OPENNEXT, 2026).

Next.js 16 gera HTML estático (NEXT.JS, 2026). O adapter OpenNext converte para Workers. Cloudflare Tunnel expõe o servidor `next start`. O domínio controlepopular.com.br aponta para o túnel.

### 3.5 Verificação

Verificação ocorre em três camadas:

1. Testes unitários: vitest para `lib/`; node:test para o globo 3D. São 601 testes vitest e 121 testes node:test (base 15/08/2026);
2. Varredura de dado pessoal no pre-push: `sem-cpf-no-repo.test.ts` valida por mod-11; `checar-dado-pessoal-em-dado.py` varre dado ingerido;
3. CI roda 12 workflows. Nenhum dado pessoal chega à produção. Essa triagem é automática e obrigatória.

### 3.6 Desenvolvimento com assistência de IA

O projeto usa agentes de IA. Sessões operam em worktrees próprios. Cada sessão tem porta exclusiva. Cada sessão tem checkout exclusivo. Git worktree garante isolamento entre sessões.

Mensagens de commit seguem formato específico. O efeito vai na primeira linha. O número medido vai no corpo. O trailer Co-Authored-By fecha a mensagem. Dado pessoal é sempre sanitizado. Isso acontece antes de enviar a prompts de IA.

---

## 4. Arquitetura Técnica

> *"O real não está na saída nem na chegada: ele se dispõe para a gente é no meio da travessia."*  
> — **João Guimarães Rosa**, *Grande Sertão: Veredas*, 1956

### 4.1 Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 com App Router (NEXT.JS, 2026) |
| UI | React 19 + Tailwind CSS 4 (TAILWIND CSS, 2026) |
| Tipagem | TypeScript |
| Ícones | lucide-react |
| Temas | next-themes |
| Banco | drizzle-orm (DRIZZLE ORM, 2026) + Neon serverless driver (NEON, 2026) |
| Documentos | pdf-lib e docx — geração no navegador |
| Animação | gsap |

### 4.2 Banco dual: Neon Postgres + Cloudflare D1

Neon Postgres é o banco principal (NEON, 2026). É serverless com autosuspend. Mantém cota Free ativa. Drizzle ORM gerencia 124 tabelas. São quatro schemas distintos. Leitura acontece no build. Acesso degrada a null fora do contexto.

Cloudflare D1 é SQLite em Workers (CLOUDFLARE, 2026). Escritas ao vivo vivem nele. São escritas de: pageviews, zap, classificados e moderação. D1 só funciona como binding do Worker. Fora do Worker devolve null.

### 4.3 Publicação: build local → Cloudflare Workers

O build roda no home-pc. `next build --webpack` gera HTML estático. `opennextjs-cloudflare build` converte para Workers. `populateCache` popula assets. Deploy publica no Workers.

O site roda por `next start -p 3000`. Cloudflare Tunnel expõe o servidor à internet. Worker Cloudflare continua como fallback técnico.

### 4.4 SSG e limites de bundle

SSG gera todas as páginas no build. Nenhuma consulta ao banco em runtime. Os tetos do Workers são:

| Limite | Valor |
|---|---|
| Asset individual | 25 MiB |
| Bundle (gzip) | 3 MiB |
| Arquivos | 20.000 |

Coleção nunca vai como props de componente. Acima de 2.000 linhas, serve do índice fatiado. Ou usa tabela estática.

### 4.5 Compactação de dados

Duas implementações comprimem dados grandes. Cada uma serve a um formato:

| Implementação | Técnica | Resultado |
|---|---|---|
| ComunicaBR | esqueleto nacional + codec | 853 municípios: 99 MiB → 2,16 MB |
| Compactação genérica | esqueleto + dicionário | Rouanet: 7,9 MB → 2,4 MB (−69%) |

Decisão: não unificar as duas. Aplainar perderia o ganho de grandeza.

### 4.6 Segurança

Segurança inclui CSP — Content Security Policy. Também HSTS — HTTP Strict Transport Security. E Permissions-Policy. Varredura de CPF roda em dois scripts:

1. `sem-cpf-no-repo.test.ts` valida mod-11;
2. `checar-dado-pessoal-em-dado.py` varre dado ingerido.

Hook pre-push e CI rechecam antes de commitar. Dado pessoal nunca chega à produção.

---

## 5. As Seis Frentes Temáticas

### 5.1 Cidades — Municipalidade

> *"Eu classifico São Paulo assim: o Palácio é a sala de visita, a Prefeitura é a sala de jantar, a cidade é o jardim, e a favela é o quintal onde jogam os lixos."*  
> — **Carolina Maria de Jesus**, *Quarto de Despejo*, 1960

#### 5.1.1 Escopo

Seis municípios publicados completos. São eles: Betim, Belo Horizonte, São Paulo, Araçuaí, Diamantina e Itinga. O catálogo de [cidades estratégicas](https://controlepopular.com.br/cidades) tem 203 cidades. Desses, 176 são polos. Cobertura varia por município. A diferença é mostrada, nunca escondida.

#### 5.1.2 Subseções

As subseções do painel municipal:

1. Prefeitura — contratos, despesas, servidores, obras e licitações;
2. Câmara Municipal — vereadores, proposições, votações;
3. Saúde;
4. Educação;
5. Economia;
6. Segurança;
7. Social;
8. Meio Ambiente;
9. Terras;
10. Clima;
11. Infraestrutura;
12. Mineração;
13. Grupo Econômico;
14. Teia de Interesses.

#### 5.1.3 Fontes de dados

Fontes: [PNCP](https://pncp.gov.br/) — contratos e licitações. [IBGE](https://www.ibge.gov.br/) — PIB e IDH. INEP — escolas. DATASUS — saúde. [IBAMA](https://www.gov.br/ibama/) — meio ambiente. ComunicaBR — serviços públicos. SIGMINE — mineração. FEAM — barragens. LAI — documentos oficiais.

#### 5.1.4 Recursos visuais

Recursos: painéis Bento Grid com cartões de status. Gráficos SVG de ranking. Índice de risco climático. Widget meteorológico. Cobertura de sinal de celular. Tabelas usam `TabelaEstatica.tsx`. Índice fatiado pagina acima de 2.000 linhas.

O papel do portal na municipalidade se conecta à história das cidades brasileiras. Desde a Colônia, a gestão municipal é o nível mais próximo do cidadão. O portal retoma essa proximidade com dados concretos. Ele torna visível o que antes era invisível.

Geograficamente, as seis cidades representam padrões distintos. Betim é polo industrial. Belo Horizonte é capital regional. São Paulo é metrópole nacional. Araçuaí, Diamantina e Itinga são municípios pequenos. Essa diversidade permite comparações reveladoras.

No plano jurídico, os contratos públicos seguem a [Lei nº 14.133/2021](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm). Essa lei regula licitações e contratos administrativos. O portal monitora essa obediência. Ele publica contratos com fonte identificável.

Sociologicamente, a cidade reproduz desigualdades (JESUS, 1960). A periferia tem menos serviços que o centro. Carolina Maria de Jesus denunciou essa divisão. O portal atualiza a denúncia com dados. Ele mostra saúde, escola e saneamento por município.

Educacionalmente, o portal é sala de aula sem paredes. Um estudante pode comparar sua cidade com outra. Essa comparação ensina cidadania com números. O dado vira material didático.

### 5.2 Congresso — Congresso Nacional

> *"O que eu revolto é com a ganância dos homens que espremem uns aos outros como se espremesse uma laranja."*  
> — **Carolina Maria de Jesus**, *Quarto de Despejo*, 1960

#### 5.2.1 Escopo

Monitoramento do Congresso Nacional federal. Mais de 5.500 proposições federais em 2026. Análise de direitos com metodologia garantista. As subseções:

1. [Proposições](https://controlepopular.com.br/congresso/proposicoes);
2. [Parlamentares](https://controlepopular.com.br/congresso/parlamentares) — 93 deputados e 2 senadores de MG;
3. [Bancadas](https://controlepopular.com.br/congresso/bancadas);
4. [Comissões](https://controlepopular.com.br/congresso/comissoes);
5. [Votações](https://controlepopular.com.br/congresso/votacoes);
6. [Cota Parlamentar](https://controlepopular.com.br/congresso/cota-parlamentar).

#### 5.2.2 Fontes de dados

Fontes: APIs da [Câmara dos Deputados](https://dadosabertos.camara.leg.br/). APIs do [Senado Federal](https://www12.senado.leg.br/dados-abertos). Dados incluem votações e proposições. Também: composição de bancadas. E emendas parlamentares.

#### 5.2.3 Recursos visuais

Recursos: gerador de ofício em PDF e DOCX. Documentos são gerados no navegador. Rubrica determinística — número fixo por sessão. Análise de direitos compara relator com doutrina. Os [alertas de votação](https://controlepopular.com.br/congresso/alertas) monitoram pautas do dia.

A frente Congresso se conecta à história parlamentar brasileira. O Congresso Nacional nasceu com a República em 1889. O portal monitora 137 anos de tradição legislativa. Ele torna visível o trabalho dos representantes.

Geograficamente, o portal cobre Minas Gerais no Congresso. 93 deputados e 2 senadores são monitorados. Essa cobertura estadual permite rastrear representação regional.

Juridicamente, o portal monitora a legalidade das proposições. Análise de direitos compara textos com a [Constituição de 1988](http://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm). Essa verificação é automática e periódica. Ela protege o cidadão de abusos legislativos.

Sociologicamente, o parlamento é socialmente seletivo. Poucos trabalhadores ocupam cadeiras legislativas. O dado de composição revela esse perfil. O portal torna o perfil público e consultável.

Educacionalmente, o portal ensina como nasce uma lei. O cidadão acompanha tramitação, voto e autor. Esse acompanhamento forma eleitores fiscalizadores. A democracia se aprende exercendo.

### 5.3 Judiciário — Tribunais Superiores

> *"Se ao menos o medo me fizesse recuar, pelo contrário, avanço mais e mais na mesma proporção desse medo. É como se o medo fosse uma coragem ao contrário."*  
> — **Conceição Evaristo**, *Olhos d'água*, 2014

#### 5.3.1 Escopo

Transparência do Judiciário federal. 15 tribunais superiores monitorados. As subseções:

1. [Tribunais](https://controlepopular.com.br/judiciario/tribunais);
2. [Indicações](https://controlepopular.com.br/judiciario/indicacoes);
3. [Vagas](https://controlepopular.com.br/judiciario/vagas);
4. [Contatos](https://controlepopular.com.br/judiciario/contatos) — 990 unidades judiciárias;
5. [Inspeções CNJ](https://controlepopular.com.br/judiciario/inspecoes) — 13 relatórios;
6. [Presídios](https://controlepopular.com.br/judiciario/presidios) — 285 estabelecimentos;
7. [Defensoria](https://controlepopular.com.br/judiciario/defensoria) — 176 de 298 comarcas sem defensores;
8. [SIRENEJud](https://controlepopular.com.br/judiciario/sirenejud).

#### 5.3.2 Fontes de dados

Fontes: [CNJ](https://www.cnj.jus.br/) — Conselho Nacional de Justiça. [TJMG](https://www.tjmg.jus.br/) — Tribunal de Justiça de Minas Gerais. [Senado Federal](https://www25.senado.leg.br/). DataJud — consulta ao vivo. Corregedoria-Geral da Justiça do Trabalho.

#### 5.3.3 Recursos visuais

Recursos: calculadora de aposentadoria. Idade obrigatória de 75 anos. Rastreamento de indicações. As [fichas de instituições](https://controlepopular.com.br/instituicoes) cobrem 7 instituições com liderança. Incluem organograma, contatos e orçamento LOA. Documentos e processos ambientais por UF. Via SIRENEJud/CNJ.

A frente Judiciário se conecta à história do sistema justiceiro brasileiro. A independência do Judiciário é conquista da [Constituição de 1988](http://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm). O portal monitora essa independência na prática. Ele revela vacâncias e indicações.

Geograficamente, o portal cobre 990 unidades judiciárias. Essa abrangência nacional permite mapear desigualdades. Comarcas sem defensores públicos são maioria. O portal revela essa lacuna territorial.

Juridicamente, essa é a frente mais direta do portal. Ele monitora o funcionamento do sistema justiceiro. Vagas e indicações afetam diretamente o acesso à justiça. O portal torna esses dados públicos e acessíveis.

Sociologicamente, o acesso à Justiça é desigual. O cidadão pobre depende da Defensoria Pública. 176 comarcas mineiras não têm defensor. Essa ausência é negação concreta de direito. O portal documenta essa lacuna territorial.

Educacionalmente, o portal explica a arquitetura do Judiciário. Ele ensina o que é vara, comarca e tribunal. Esse vocabulário é porta de entrada para direitos.

### 5.4 Ambiental / ONSA — Observatório Nacional Socioambiental

> *"Tudo que aprendi com os camponeses, quilombolas e trabalhadores rurais eu não trocaria por nenhum título acadêmico ou prêmio."*  
> — **Itamar Vieira Junior**, *Agência Pública*, 2021

#### 5.4.1 Escopo

Dados ambientais: 454 reuniões do COPAM — Conselho Estadual de Política Ambiental. São 19.704 licenças ambientais. São 909 barragens. As subseções:

1. [COPAM](https://controlepopular.com.br/ambiental/copam);
2. [Licenciamento](https://controlepopular.com.br/ambiental/licenciamento);
3. [Barragens](https://controlepopular.com.br/ambiental/barragens) — 3 registros: FEAM, SNISB e SIGBM;
4. [Legislação](https://controlepopular.com.br/ambiental/legislacao) — 15.348 normas;
5. [TACs](https://controlepopular.com.br/ambiental/tac) — Termos de Ajustamento de Conduta;
6. [Decisões LAI](https://controlepopular.com.br/ambiental/decisoes-lai);
7. [Crimes Socioambientais](https://controlepopular.com.br/ambiental/crimes-socioambientais);
8. [Direitos Humanos Ambientais](https://controlepopular.com.br/ambiental/direitos-humanos);
9. [Conselhos](https://controlepopular.com.br/ambiental/conselhos);
10. [Litígios Climáticos](https://controlepopular.com.br/ambiental/litigios-climaticos);
11. [Clima e Risco](https://controlepopular.com.br/ambiental/clima-risco).

#### 5.4.2 Fontes de dados

Fontes: IDE-Sisema — licenciamento. [FEAM](http://www.feam.br/) — barragens estaduais. SNISB — Sistema Nacional de Informações sobre Segurança de Barragens. SIGBM — Sistema de Informações Georreferenciadas de Barragens de Mineração. ALMG, SEMAD, SIAM, [MMA](https://www.gov.br/mma/) e CNDH — legislação. DataJud — processos ambientais.

#### 5.4.3 Regras editoriais

Três registros de barragens nunca são somados. FEAM: 249. SNISB e SIGBM: 909 no Brasil. 320 em Minas Gerais. São cadastros sem identificador comum. Fusão criaria números fictícios.

Busca unificada combina 6.378 normas estaduais. Também combina 8.940 normas federais. Gráficos SVG e exportação CSV com UTF-8 BOM.

A frente Ambiental se conecta à história ambiental brasileira. A criação do [IBAMA](https://www.gov.br/ibama/) em 1989 marcou política ambiental (BRASIL, 1981). O portal monitora a efetividade dessa política. Ele revela licenças, barragens e crimes.

Geograficamente, essa é a frente mais espacialmente densa. O portal cobre todo o território nacional. Minas Gerais tem 320 barragens cadastradas. Essa concentração revela risco territorial elevado.

Juridicamente, o portal monitora o cumprimento da [Lei nº 6.938/1981](https://www.planalto.gov.br/ccivil_03/leis/l6938.htm). Essa lei institui a Política Nacional do Meio Ambiente. Licenças e TACs são instrumentos jurídicos. O portal torna sua aplicação visível.

Sociologicamente, danos ambientais atingem primeiro os mais pobres. Esse fenômeno tem nome: racismo ambiental. O conceito foi formulado por Antônio Lier no Brasil (LIER, 2014). Mineração e barragens afetam comunidades quilombolas e indígenas. O portal cruza essas camadas e mostra a sobreposição.

Educacionalmente, os dados ensinam sobre bacias e biomas. Um rio monitorado vira aula de geografia física. A licença ambiental vira aula de direito ambiental. O acervo forma consciência socioambiental.

### 5.5 Função Social da Terra — Minas Gerais

> *"A vida humana é indissociável do território. E muitas pessoas estão privadas disso."*  
> — **Itamar Vieira Junior**, *TV Brasil*, 2023

#### 5.5.1 Escopo

Monitoramento da função social da terra. As subseções:

1. [Mapa Estadual](https://controlepopular.com.br/funcaosocialterra/mapa) — globo 3D interativo;
2. [Alertas](https://controlepopular.com.br/funcaosocialterra/alertas) — sobreposições e riscos.

#### 5.5.2 Fontes de dados

Fontes: CAR — Cadastro Ambiental Rural — imóveis rurais. SIGMINE/[ANM](https://www.gov.br/anm/) — processos minerários. [FUNAI](https://www.gov.br/funai/) — terras indígenas via WFS. INCRA — Instituto Nacional de Colonização e Reforma Agrária — quilombolas. FEAM — barragens.

#### 5.5.3 Recursos visuais

Recursos: globo 3D com imagem de satélite por zoom. Mais de 8 camadas geográficas. 4 camadas de alerta de sobreposição. Zona de Amortecimento de 8 km do SIGMINE. 54.916 polígonos de processos minerários. Tooltip de 2 segundos. 15 terras indígenas mapeadas em MG.

A frente Função Social da Terra se conecta à história agrária brasileira. A colonização portuguesa criou o latifúndio. A reforma agrária é pauta desde 1960. O portal monitora a função social da terra. Ele revela conflitos territoriais.

Geograficamente, essa frente é profundamente espacial. O [globo 3D](https://controlepopular.com.br/funcaosocialterra/mapa) permite visualizar camadas. Mineração, terras indígenas e quilombolas se sobrepõem. Essa sobreposição revela conflitos.

Juridicamente, a função social da terra é obrigação constitucional. O artigo 5º, XXIII da CF/88 estabelece essa função ([BRASIL, 1988](http://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm)). O portal monitora o cumprimento dessa obrigação. Ele publica dados de CAR e SIGMINE.

Sociologicamente, a concentração fundiária é estrutural. Ela vem de sesmarias, capitanias e latifúndio. O [Estatuto da Terra, Lei nº 4.504/1964](https://www.planalto.gov.br/ccivil_03/leis/l4504.htm), prometeu reforma. A reforma nunca se completou. O portal mede esse atraso com dados cadastrais.

Educacionalmente, o globo 3D é material de ensino. Ele mostra a geografia agrária de forma viva. Estudante e pesquisador navegam pelo território. O mapa ensina o que o texto esconde.

### 5.6 Paraopeba — Rompimento da Barragem em Brumadinho

> *"Para que serve a utopia? Serve para isso: para caminhar."*  
> — **Fernando Birri**, recolhido por **Eduardo Galeano**, *As Palavras Andantes*, 1994

#### 5.6.1 Escopo

Reparação do rompimento da barragem de Brumadinho. O desastre ocorreu em 25 de janeiro de 2019. 270 pessoas morreram. As subseções:

1. [Entenda](https://controlepopular.com.br/paraopeba/entenda);
2. [Clipping](https://controlepopular.com.br/paraopeba/clipping) — 149 itens;
3. [Linha do Tempo](https://controlepopular.com.br/paraopeba/linha-do-tempo) — 23 marcos;
4. [Quem Atua](https://controlepopular.com.br/paraopeba/quem-atua) — 18 organizações;
5. [Auxílio Emergencial](https://controlepopular.com.br/paraopeba/auxilio);
6. [Execução](https://controlepopular.com.br/paraopeba/execucao) — auditoria FGV, R$ 5,48 bilhões, 26 municípios;
7. [Documentos](https://controlepopular.com.br/paraopeba/documentos) — 471 da UFMG;
8. [Biblioteca ATI](https://controlepopular.com.br/paraopeba/biblioteca) — 597 publicações;
9. [Auditoria AJRI](https://controlepopular.com.br/paraopeba/auditoria) — 467 documentos;
10. [Análise Integrada](https://controlepopular.com.br/paraopeba/analise).

#### 5.6.2 Fontes de dados

Fontes: [FGV](https://www.fgv.br/) — Fundação Getulio Vargas — auditoria independente. Plataforma Brumadinho UFMG. ATI — Ação Técnica Independente. AJRI — Agência de Jornalismo Investigativo. Duas fontes separadas em todas as telas.

#### 5.6.3 Recursos visuais

Recursos: gráfico SVG, exportação CSV, visualização de linha do tempo. [Execução do Acordo](https://controlepopular.com.br/paraopeba/execucao): 26 municípios, R$ 5,48 bilhões, 73,8% pago. Biblioteca unificada de crimes socioambientais. Triagem de dado pessoal dedica-se ao acervo da Plataforma Brumadinho UFMG.

A frente Paraopeba se conecta à história de desastres ambientais. Brumadinho é o maior desastre industrial do Brasil. 270 vidas perdidas em 25 de janeiro de 2019. O portal monitora a reparação. Ele torna visível o cumprimento do Acordo.

Geograficamente, a bacia do Paraopeba abrange 26 municípios. Essa abrangência revela impacto regional. O portal mapeia cada município afetado. Ele conecta dados locais com dados regionais.

Juridicamente, o portal monitora a execução do Acordo de Brumadinho. R$ 5,48 bilhões são acompanhados. 73,8% já foram pagos. O portal torna essa execução pública e rastreável.

Sociologicamente, o desastre atingiu trabalhadores. A maioria das 270 vítimas era terceirizada. O risco foi socializado; o lucro foi privatizado. O portal documenta esse desequilíbrio estrutural. Ele também mostra a luta das atingidas por reconhecimento.

Educacionalmente, a frente transforma tragédia em material pedagógico. A linha do tempo ensina o ciclo do desastre. Os dados de execução ensinam cidadania fiscal. Memória e aprendizado caminham juntos.

---

## 6. Os Três Eixos Temáticos

### 6.1 Direitos em Movimento — Eixo 1

> *"O importante não é ser o primeiro ou primeira, o importante é abrir caminhos."*  
> — **Conceição Evaristo**, *Roda Viva*, 2019

#### 6.1.1 Conceituação

O [Eixo Direitos em Movimento](https://controlepopular.com.br/direitos-em-movimento) é hub para cidadãos. Ele responde cinco perguntas centrais:

1. Que lei protege isso?
2. Onde buscar ajuda?
3. Como pedir informação?
4. Quais conselhos existem?
5. Como denunciar?

#### 6.1.2 Cinco portas

Cinco portas organizam o eixo:

1. Porta 1: Que lei protege? Legislação e precedentes catalogados;
2. Porta 2: Onde buscar ajuda? Rede de proteção por necessidade — [Ajuda](https://controlepopular.com.br/direitos-em-movimento/ajuda);
3. Porta 3: Como pedir informação? Canal LAI em 445 órgãos — [Informação](https://controlepopular.com.br/direitos-em-movimento/informacao);
4. Porta 4: Conselhos de Direitos — 710 conselhos e colegiados mapeados — [Conselhos](https://controlepopular.com.br/direitos-em-movimento/conselhos);
5. Porta 5: Como denunciar? Facilitador guiado em nove etapas — [Denúncia](https://controlepopular.com.br/direitos-em-movimento/denuncia).

O eixo também tem páginas temáticas: [Educação](https://controlepopular.com.br/direitos-em-movimento/educacao), [Saúde Pública](https://controlepopular.com.br/direitos-em-movimento/saude-publica) e [Trabalho e Renda](https://controlepopular.com.br/direitos-em-movimento/trabalho-e-renda).

#### 6.1.3 Facilitador de documentos

O facilitador gera documentos .docx e .pdf. Geração ocorre no navegador. Sem necessidade de servidor. Sem necessidade de advogado. O cidadão preenche e baixa. Documentos seguem modelo padrão.

#### 6.1.4 Interdisciplinaridade

Na perspectiva histórica, os direitos humanos são conquista secular. A [Declaração Universal dos Direitos Humanos](https://www.un.org/pt/about-us/universal-declaration-of-human-rights) de 1948 fundamenta essa conquista. O portal a torna acessível ao cidadão comum.

Geograficamente, a distribuição de conselhos revela desigualdades. 710 conselhos não se distribuem igualmente. O portal mapeia essa distribuição territorial.

Juridicamente, o eixo traduz o direito abstrato em ferramenta concreta. A [LAI](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm) garante o direito à informação. O portal viabiliza o exercício desse direito.

Sociologicamente, a lei é desconhecida por quem mais precisa dela. A desigualdade jurídica reproduz a desigualdade social. O cidadão sem informação não reclama o que é seu. O portal ataca essa assimetria na origem.

Educacionalmente, o eixo é freireano. Freire ensina: ler o mundo antes da palavra (FREIRE, 1987). O facilitador de denúncia parte do que aconteceu. Depois organiza o relato em linguagem jurídica. Essa tradução é ato educativo e político.

### 6.2 Terra e Territórios — Eixo 2

> *"Sertão é onde manda quem é forte, com as astúcias."*  
> — **João Guimarães Rosa**, *Grande Sertão: Veredas*, 1956

#### 6.2.1 Conceituação

O [Eixo Terra e Territórios](https://controlepopular.com.br/terra-e-territorios) é hub de soberania. Ele conecta dados territoriais com dados municipais. 203 cidades estratégicas são monitoradas. Bacias hidrográficas são mapeadas. Terras indígenas e barragens são rastreadas.

#### 6.2.2 Seis subfrentes

As subfrentes do eixo:

1. Mapa 3D — [globo interativo com camadas](https://controlepopular.com.br/funcaosocialterra/mapa);
2. [Alertas](https://controlepopular.com.br/alertas) — sobreposições e riscos;
3. Mineração — 54.916 processos em MG — camada do [mapa 3D](https://controlepopular.com.br/funcaosocialterra/mapa);
4. Terras Indígenas — 15 territórios mapeados;
5. Quilombolas — 27 territórios monitorados;
6. [Barragens](https://controlepopular.com.br/ambiental/barragens) — 909 registros no Brasil.

#### 6.2.3 Destaques

1. [Paraopeba](https://controlepopular.com.br/paraopeba): rompimento de Brumadinho, 270 mortos;
2. [Mariana](https://controlepopular.com.br/ambiental/mariana): rompimento de Fundão, 19 mortos;
3. Observatório Vale: monitoramento da B3;
4. Bacia do Paraopeba: 26 municípios afetados.

#### 6.2.4 Interdisciplinaridade

Historicamente, o conflito pelo território é marca do Brasil. A colonização portuguesa criou o latifúndio. A República não resolveu o conflito. O portal monitora esse conflito persistente.

Geograficamente, essa é a frente mais densa em dados espaciais. O globo 3D permite visualizar sobreposições. Mineração se sobrepõe a terras indígenas. Barragens se sobrepõem a áreas quilombolas. Essa visualização é uma inovação metodológica.

Juridicamente, o portal monitora a efetividade da reforma agrária. INCRA — Instituto Nacional de Colonização e Reforma Agrária — é rastreado. FUNAI — Fundação Nacional dos Povos Indígenas — é monitorada. A [Constituição de 1988](http://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) garante direitos territoriais. O portal verifica o cumprimento desses direitos.

Sociologicamente, território é suporte da vida material e simbólica. É o que afirma Itamar Vieira Junior (VIEIRA JUNIOR, 2019). Povos indígenas e quilombolas defendem esse suporte. O portal dá visibilidade a essa defesa. Ele mostra quem disputa cada pedaço de chão.

Educacionalmente, o globo 3D é aula pública de geografia. Camadas de mineração, água e comunidade ensinam escala territorial. O cidadão aprende a ler o próprio mapa.

### 6.3 Estado e Economia — Eixo 3

> *"Muita gente pequena, em lugares pequenos, fazendo coisas pequenas, pode mudar o mundo."*  
> — **Eduardo Galeano**, *O Livro dos Abraços*, 1989

#### 6.3.1 Conceituação

O [Eixo Estado e Economia](https://controlepopular.com.br/estado-e-economia) é transparência institucional. Ele liga dados de contratos públicos. Conecta-os com dados de empresas. Monitora concentração econômica e poder de mercado.

#### 6.3.2 Seis subfrentes

1. Contratos — R$ 142 bilhões monitorados via [PNCP](https://pncp.gov.br/);
2. Orçamento — [LOA e execução orçamentária](https://controlepopular.com.br/estado-e-economia/orcamento);
3. [Judiciário](https://controlepopular.com.br/judiciario) — 15 tribunais e 990 unidades;
4. [Congresso](https://controlepopular.com.br/congresso) — 5.500 proposições;
5. [Empresas](https://controlepopular.com.br/empresas) — 130 empresas e fundos em 7 setores;
6. Banco Central — [dados macroeconômicos do BCB Olinda](https://olinda.bcb.gov.br/).

#### 6.3.3 Dados de destaque

R$ 142 bilhões em contratos públicos. 130 empresas e fundos monitorados. 7 setores cobertos. B3 — [Bolsa de Valores](https://www.b3.com.br/) — e [NYSE](https://www.nyse.com/) são rastreados. ESG — Environmental, Social and Governance — scores são publicados.

#### 6.3.4 Interdisciplinaridade

Historicamente, a transparência econômica é conquista recente. A [Constituição de 1988](http://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) inspirou leis de transparência. A [LAI de 2011](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm) consolidou essa conquista. O portal amplia essa transparência.

Geograficamente, a economia se distribui desigualmente. Contratos públicos concentram-se em regiões específicas. O portal mapeia essa concentração territorial. Ele torna visíveis as desigualdades regionais.

Juridicamente, o portal monitora a [Lei nº 14.133/2021](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm). Essa lei regula licitações e contratos. O portal verifica a obediência a essa lei. Ele publica contratos com fonte identificável.

Sociologicamente, o contrato público concentra poder econômico. Fornecedores recorrentes formam oligarquias locais. A teia de interesses revela esses vínculos. O portal torna visível o que a informalidade esconde.

Educacionalmente, o orçamento é documento pedagógico. Ele ensina para onde vai o dinheiro do imposto. O cruzamento entre receita e serviço público forma consciência fiscal. Cidadão que lê orçamento vota melhor.

---

## 7. Seções Complementares

### 7.1 Empresas — Observatório de Grandes Empresas

O [Observatório de Empresas](https://controlepopular.com.br/empresas) cobre 130 empresas e fundos em 7 setores. Dados da [B3](https://www.b3.com.br/) — Bolsa de Valores. Da [NYSE](https://www.nyse.com/) — New York Stock Exchange. E ESG — Environmental, Social and Governance. Também [TACs](https://controlepopular.com.br/ambiental/tac) e [licenciamento ambiental](https://controlepopular.com.br/ambiental/licenciamento). Fichas com Governança, Direitos Humanos, Contratos. Linha do tempo interativa. Gráfico SVG e 4 cartões de status.

### 7.2 Biblioteca Unificada

A [Biblioteca](https://controlepopular.com.br/biblioteca) é arquivo documental unificado: ESG, autos de processo. SciELO — Scientific Electronic Library Online ([SciELO](https://www.scielo.br/)). Metadado e link, nunca arquivo original. A [Lei nº 9.610/1998](https://www.planalto.gov.br/ccivil_03/leis/l9610.htm) protege direitos autorais. Busca combinada por tema, fonte e data.

### 7.3 Estudos Rurais

A seção de [Estudos Rurais](https://controlepopular.com.br/estudos-rurais) traz 60 notícias coletadas via Google News RSS. Feed ICA/UFVJM — Instituto de Ciências Agrárias. Gráfico SVG, cartões, CSV BOM UTF-8. Filtro e ordenação por coluna. 13 testes automatizados. Lacuna: dissertações do DSpace.

### 7.4 Tecnologia

A rota [Tecnologia](https://controlepopular.com.br/tecnologia) tem conteúdo educativo. Oficinas de IA local-first. Catálogo Floresta de Apps. AppLivre — software livre. Conteúdo focado em inclusão digital.

### 7.5 Instituições

As [fichas de instituições](https://controlepopular.com.br/instituicoes) cobrem 7 instituições com liderança. São elas: TJMG, MPMG, DPMG, TRT-3, TRF-6, DPU e TCE-MG. Cada ficha inclui organograma. Inclui contatos e orçamento LOA. Corregedoria, ouvidoria e documentos.

### 7.6 Governo

A seção [Governo](https://controlepopular.com.br/governo) monitora governos municipais. Contratos, licitações e servidores públicos. Obras públicas e licitações. Diário oficial coletado. 16.601 atos desde janeiro de 2020.

### 7.7 Indicadores

A seção [Indicadores](https://controlepopular.com.br/indicadores) traz índices por município e por tema. IDH, PIB, população. Cobertura de saúde e educação. Risco climático via [AdaptaBrasil](https://adaptabrasil.mcti.gov.br/). 6.824 índices em 853 municípios.

---

## 8. Poesia e Identidade Visual

> *"Eu-mulher em rios vermelhos inauguro a vida. Em baixa voz violento os tímpanos do mundo."*  
> — **Conceição Evaristo**, *Poemas da recordação*, 2017

### 8.1 O sistema citacoes.ts

O portal mantém catálogo canônico de citações. É o arquivo `lib/citacoes.ts`. Toda citação exibida sai daqui. Nada de frase inventada ou aproximada. Quem adiciona citação nova insere fonte completa. A fonte inclui autor, obra e ano. Marcação `autorizada: true` só após conferência.

### 8.2 Autores representados

Cinco autores compõem o acervo:

| Autor | Obras | Citações |
|---|---|---|
| Carolina Maria de Jesus | *Quarto de Despejo* | 6 |
| Conceição Evaristo | *Becos da Memória*, *Olhos d'água*, *Poemas da recordação* | 5 |
| João Guimarães Rosa | *Grande Sertão: Veredas* | 4 |
| Itamar Vieira Junior | *Torto Arado* e entrevistas | 3 |
| Fernando Birri/Eduardo Galeano | *As Palavras Andantes* | 1 |

### 8.3 Token de cor verse

Cada autor tem cor associada. O token `versos` controla a cor. Verso aparece em balão ou seção dedicada. Nunca aparece inline. A poesia é parte da identidade visual. Ela não é decoração. É conteúdo.

### 8.4 Interdisciplinaridade

Historicamente, a poesia é forma de resistência. Carolina Maria de Jesus escrevia na fome. Conceição Evaristo escreve da memória. Rosa escreve do sertão. A poesia no portal conecta dados com humanidade.

Geograficamente, a poesia marca territórios. Rosa marca o sertão. Carolina marca a favela paulista. Evaristo marca os becos da memória. A poesia territorializa o dado.

Juridicamente, a poesia é forma de exercício de direito. O artigo 5º da [CF/88](http://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm) garante liberdade de expressão. O portal exerce essa liberdade com poesia. Dados e versos coexistem em igualdade.

---

## 9. Governança de Dados

### 9.1 Volume de dados

Mais de 200 arquivos JSON. Totalizam aproximadamente 180 MB. 60+ tabelas de banco em 4 schemas. 25+ scripts de coleta. 20+ scripts de ETL. Dados versionados em git. Trilha completa de alterações mantida.

### 9.2 Duas compactações

A decisão está documentada na seção 4.5. Cada implementação serve a um formato. Nunca somar números de cadastros distintos.

### 9.3 Triagem de dado pessoal

Dois scripts varrem dado pessoal. `sem-cpf-no-repo.test.ts` valida por módulo 11. `checar-dado-pessoal-em-dado.py` varre dado ingerido. Hook pre-push e CI executam automaticamente.

CPF em ementa oficial é redigido na ingestão. Máscara da fonte não é prova. 215 CPFs vieram por extenso na Rouanet. Essa lição virou teste obrigatório.

### 9.4 Regras editoriais

As regras são:

1. O número vem do dado. O modelo, se houver, só embrulha;
2. Ressalva viaja colada ao número. Ou o número não vai;
3. Lacuna é informação. Diga o que veio vazio;
4. Dois dados verdadeiros não autorizam conclusão falsa;
5. Resumo gerado por máquina é o portal afirmando. Deve ser rotulado com data e modelo.

---

## 10. Assistente de IA — Seu Nonô

### 10.1 Arquitetura em escada

O assistente usa quatro degraus. Cada degrau só aciona quando o anterior não resolve. A tela identifica qual degrau respondeu.

| Degrau | Função | Tempo |
|---|---|---|
| 0 | Navegação direta | 0,35 ms |
| 1 | Busca no índice estático | — |
| 2 | Composição determinística | — |
| 3 | LLM via Ollama + remoto | — |

### 10.2 Base de conhecimento

Base inclui frentes, contextos e páginas. Também blog e designações. 241 destinos navegáveis. Catálogo como constante de módulo. 2,4 KiB gzip. Navegação `interpretar()` devolve candidatos. Máximo de 8 candidatos. Nunca palpite único. Sem rede, sem banco.

### 10.3 Verificação de citação

Verificação determinística de citação. Limiar de abstenção: 0,15. Respostas com citação [n] clicável. Painel de fontes com link. Ressalva de IA sempre visível. Data e modelo aparecem em toda resposta. A IA só embrulha dado que existe. Nunca afirma número novo.

---

## 11. Infraestrutura de Monitoramento

### 11.1 Monitoramento do servidor

Health check HTTP a cada 5 minutos via cronjob. Script `vigia-servidor.mts` monitora disponibilidade. Reinício automático com cap de 3 reinícios por hora. Notificação Telegram em caso de falha. Runbook documentado para site fora do ar. Mitigações genéricas primeiro. Causa depois.

### 11.2 Build safety

Travas impedem publicar site errado:

| Trava | Regra |
|---|---|
| Piso de páginas | Menos de 1.000 aborta |
| Queda relativa | Mais de 20% vs última aborta |
| ETL no chão | 100% dos passos falhando é ambiente, não fonte |
| Asset grande | Mais de 20 MiB avisa; mais de 25 MiB aborta |

Contagem de páginas é o sinal de saúde.

### 11.3 Cronogramas ETL

Coletores rodam em cadências diversas. São cadências: diária, semanal, mensal e trimestral. Radar de notícias roda antes do build. Nunca existe coleta não publicada. Fluxo: ETL → radar → build → travas → deploy.

### 11.4 Download e arquivo de documentos

Script `download-documentos.mts` baixa PDFs. Organiza em `documentos-site/{tema}/{data}/`. Compatível com regras de direitos autorais. Documentos da AJRI têm marca-d'água. Não publicar os PDFs. Apenas catálogo e link.

---

## 12. Resultados e Impacto

### 12.1 Métricas quantitativas

Métricas medidas, com data de medição:

| Métrica | Valor | Medição |
|---|---|---|
| Páginas publicadas | 5.511 | build de 16/09/2026 |
| Documentos pesquisáveis | 29.917 | setembro de 2026 |
| Testes vitest | 601 | base 15/08/2026 |
| Testes node:test | 121 | base 15/08/2026 |
| Workflows de CI | 12 | — |
| Coletores automatizados | 25+ | — |
| Datasets na API pública | 14+ | — |
| Empresas e fundos monitorados | 130 | — |
| Normas na biblioteca de legislação | 15.348 | — |

### 12.2 Impacto social

1. Reparação de [Brumadinho](https://controlepopular.com.br/paraopeba): R$ 5,48 bilhões monitorados; 26 municípios rastreados;
2. Transparência do [Judiciário](https://controlepopular.com.br/judiciario): 15 tribunais; 990 unidades monitoradas;
3. Monitoramento ambiental: 454 reuniões do [COPAM](https://controlepopular.com.br/ambiental/copam); 19.704 licenças; 909 [barragens](https://controlepopular.com.br/ambiental/barragens);
4. Auxílio a cidadãos sob estresse: documentos gerados no navegador, sem necessidade de advogado.

### 12.3 Cobertura geográfica

| Cobertura | Escala |
|---|---|
| 6 municípios com painel completo | Minas Gerais |
| 203 cidades com fontes cruzadas | catálogo nacional |
| 853 municípios | dataset ComunicaBR |
| 15 terras indígenas mapeadas | Minas Gerais |
| 54.916 processos minerários | Minas Gerais |
| 909 barragens | Brasil |

### 12.4 Interdisciplinaridade dos resultados

Historicamente, o portal documenta o presente. Gera fonte para pesquisadores do futuro. Dados de 2019 a 2026 ficam arquivados. Essa documentação tem valor histórico.

Geograficamente, a cobertura é nacional. Minas Gerais tem cobertura detalhada. 853 municípios são monitorados. Essa abrangência é inédita em portais cívicos.

Juridicamente, o portal é ferramenta de accountability. Accountability significa prestação de contas com consequência. Ele monitora cumprimento de leis. Torna visíveis descumprimentos. Fortalece o Estado de direito.

Sociologicamente, o portal reduz a assimetria informacional. Ele serve ao cidadão mais distante do Estado. Professor, estudante, atingido e pequeno empreendedor. Cada um encontra dado verificável sem pedir favor. Isso desloca poder de quem detinha o dado.

Educacionalmente, o portal forma cidadania letrada. Ele vira fonte de pesquisa escolar e universitária. Os dados arquivados sustentam trabalhos acadêmicos. A transparência se ensina sendo praticada.

---

## 13. Conclusão

> *"Não é uma esperança passiva, que está só esperando que as coisas aconteçam. É uma esperança ativa."*  
> — **Itamar Vieira Junior**, *Roda Viva*, 2021

### 13.1 Contribuições

O portal demonstra viabilidade técnica. Ele combina 42 fontes públicas. Integra em interface única. Regras editoriais rigorosas garantem qualidade. Acessibilidade WCAG é requisito funcional. Verificação automática de dado pessoal protege privacidade. Assistente de IA navega o acervo sem afirmar números novos. API pública facilita reuso dos dados.

### 13.2 Limitações

1. Neon Postgres tem limite Free de 100 CU-hours/mês;
2. Storage do Neon está em 94%;
3. Workers Cloudflare impõe teto de 25 MiB;
4. Publicação depende de máquina local;
5. Neon em HTTP 402 impedia build;
6. Máquina de dev não consegue buildar.

### 13.3 Direções futuras

1. Expansão para os 27 estados brasileiros;
2. Migração parcial para Cloudflare D1;
3. Melhoria do assistente com degrau 3 completo;
4. Integração de novas fontes: diário oficial, DataJud ao vivo;
5. Base cartográfica do INCRA;
6. Protocolo da LAI em todos os órgãos monitorados.

### 13.4 Reflexão final

O portal Controle Popular é mais que tecnologia. É ferramenta de cidadania. Ele traduz dados públicos em conhecimento cidadão. Conecta História, Geografia e Direito. Dialoga com Sociologia e Educação. Usa poesia como ponte entre dado e humanidade.

O portal segue o caminho de Paulo Freire (FREIRE, 1987). A leitura do mundo vem primeiro. A leitura da palavra vem depois. O dado público é texto do mundo. O cidadão aprende a lê-lo. Essa aprendizagem transforma pessoas. Pessoas transformam o mundo.

Serve a quem mais precisa. Cidadãos sob estresse encontram respostas. A acessibilidade é garantia. A precisão é obrigação. A transparência é o objetivo.

> *"O que a vida quer da gente é coragem."*  
> — **João Guimarães Rosa**, *Grande Sertão: Veredas*, 1956

---

## Referências

ABNT — ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 14724:2011 — Trabalhos acadêmicos: apresentação.** Rio de Janeiro: ABNT, 2011.

ABNT — ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 6023:2025 — Referências: elaboração.** Rio de Janeiro: ABNT, 2025.

BRASIL. **Constituição da República Federativa do Brasil de 1988.** Diário Oficial da União, Brasília, DF, 5 out. 1988. Disponível em: <http://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm>. Acesso em: 15 set. 2026.

BRASIL. **Lei nº 4.504, de 30 de novembro de 1964.** Estatuto da Terra. Diário Oficial da União, Brasília, DF, 30 nov. 1964. Disponível em: <http://www.planalto.gov.br/ccivil_03/leis/l4504.htm>. Acesso em: 15 set. 2026.

BRASIL. **Lei nº 6.938, de 31 de agosto de 1981.** Política Nacional do Meio Ambiente. Disponível em: <https://www.planalto.gov.br/ccivil_03/leis/l6938.htm>. Acesso em: 16 set. 2026.

BRASIL. **Lei nº 9.610, de 19 de fevereiro de 1998.** Regula os direitos autorais. Diário Oficial da União, Brasília, DF, 19 fev. 1998. Disponível em: <http://www.planalto.gov.br/ccivil_03/leis/l9610.htm>. Acesso em: 15 set. 2026.

BRASIL. **Lei nº 12.527, de 18 de novembro de 2011.** Regula o acesso à informação previsto no inciso XXXIII do art. 5º da Constituição Federal. Diário Oficial da União, Brasília, DF, 18 nov. 2011. Disponível em: <http://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm>. Acesso em: 15 set. 2026.

BRASIL. **Lei nº 13.146, de 6 de julho de 2015.** Estatuto da Pessoa com Deficiência. Diário Oficial da União, Brasília, DF, 6 jul. 2015. Disponível em: <http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm>. Acesso em: 15 set. 2026.

BRASIL. **Lei nº 13.709, de 14 de agosto de 2018.** Lei Geral de Proteção de Dados Pessoais (LGPD). Diário Oficial da União, Brasília, DF, 14 ago. 2018. Disponível em: <http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm>. Acesso em: 15 set. 2026.

BRASIL. **Lei nº 14.133, de 1º de abril de 2021.** Estabelece as normas gerais de licitações e contratos administrativos. Diário Oficial da União, Brasília, DF, 1 abr. 2021. Disponível em: <http://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm>. Acesso em: 15 set. 2026.

CLOUDFLARE. **Workers platform documentation.** In: Cloudflare Docs. Disponível em: <https://developers.cloudflare.com/workers/>. Acesso em: 15 set. 2026.

CONTROLE POPULAR. **ARQUITETURA.md: arquitetura técnica do portal.** In: GitHub. Disponível em: <https://github.com/FinweeJur/controle-popular/blob/main/docs/04-arquitetura/ARQUITETURA.md>. Acesso em: 15 set. 2026c.

CONTROLE POPULAR. **DESENVOLVIMENTO.md: fluxo de trabalho.** In: GitHub. Disponível em: <https://github.com/FinweeJur/controle-popular/blob/main/docs/03-desenvolvimento/DESENVOLVIMENTO.md>. Acesso em: 15 set. 2026d.

CONTROLE POPULAR. **ESTADO.md: o portal hoje.** In: GitHub. Disponível em: <https://github.com/FinweeJur/controle-popular/blob/main/docs/02-estado/ESTADO.md>. Acesso em: 15 set. 2026f.

CONTROLE POPULAR. **FONTES.md: fontes de dados — referência operacional.** In: GitHub. Disponível em: <https://github.com/FinweeJur/controle-popular/blob/main/docs/06-fontes/FONTES.md>. Acesso em: 15 set. 2026b.

CONTROLE POPULAR. **OPERACAO.md: coletar, construir e publicar.** In: GitHub. Disponível em: <https://github.com/FinweeJur/controle-popular/blob/main/docs/05-operacao/OPERACAO.md>. Acesso em: 15 set. 2026e.

CONTROLE POPULAR. **PRODUTO.md: visão geral do portal.** In: GitHub. Disponível em: <https://github.com/FinweeJur/controle-popular/blob/main/docs/01-produto/PRODUTO.md>. Acesso em: 15 set. 2026a.

CONTROLE POPULAR. **Portal Controle Popular: páginas publicadas.** In: Controle Popular. Disponível em: <https://controlepopular.com.br/>. Acesso em: 15 set. 2026g.

DRIZZLE ORM. **Drizzle ORM documentation.** In: Drizzle Team. Disponível em: <https://orm.drizzle.team/>. Acesso em: 15 set. 2026.

EVARISTO, Conceição. **Becos da Memória.** Belo Horizonte: Pallas, 2006.

EVARISTO, Conceição. **Olhos d'água.** Belo Horizonte: Pallas, 2014.

EVARISTO, Conceição. **Poemas da recordação e outros movimentos.** Belo Horizonte: Malê, 2017.

FERNANDES, Florestan. **A revolução burguesa no Brasil: ensaio de interpretação sociológica.** Rio de Janeiro: Zahar, 1975.

FREIRE, Paulo. **Pedagogia do oprimido.** 17. ed. Rio de Janeiro: Paz e Terra, 1987.

GIGERICH, Kevin. **Civic tech field guide.** In: Civic Tech Field Guide. Disponível em: <https://www.civictechfieldguide.org/>. Acesso em: 15 set. 2026.

JESUS, Carolina Maria de. **Quarto de Despejo: diário de uma favelada.** São Paulo: Ática, 1960.

LEFEBVRE, Henri. **O direito à cidade.** 5. ed. São Paulo: Centauro, 2001.

LIER, Antônio Carlos de Souza. **Racismo ambiental: os pobres estão condenados a morrer de câncer?** São Paulo: Hucitec, 2014.

MMA — MINISTÉRIO DO MEIO AMBIENTE. **Sistema Nacional de Informações sobre Meio Ambiente (SINIMA).** In: MMA. Disponível em: <https://www.gov.br/mma/>. Acesso em: 15 set. 2026.

NEON. **Neon serverless Postgres documentation.** In: Neon Docs. Disponível em: <https://neon.tech/docs>. Acesso em: 15 set. 2026.

NEXT.JS. **Next.js documentation.** In: Next.js Docs. Disponível em: <https://nextjs.org/docs>. Acesso em: 15 set. 2026.

OPENNEXT. **OpenNext — open-source adapter for Cloudflare.** In: OpenNext Docs. Disponível em: <https://opennext.js.org/cloudflare>. Acesso em: 15 set. 2026.

PNCP — PORTAL NACIONAL DE CONTRATAÇÕES PÚBLICAS. **Dados abertos de contratos públicos.** In: PNCP. Disponível em: <https://pncp.gov.br/>. Acesso em: 15 set. 2026.

RIBEIRO, Darcy. **O povo brasileiro: a formação e o sentido do Brasil.** São Paulo: Companhia das Letras, 1995.

ROSA, João Guimarães. **Grande Sertão: Veredas.** Rio de Janeiro: José Olympio, 1956.

SILVERMAN, Craig. **Verification handbook: a definitive guide to verifying digital content for emergency coverage.** Amsterdam: European Journalism Centre, 2014. Disponível em: <https://verificationhandbook.com/>. Acesso em: 15 set. 2026.

TAILWIND CSS. **Tailwind CSS documentation.** In: Tailwind Docs. Disponível em: <https://tailwindcss.com/docs>. Acesso em: 15 set. 2026.

VIEIRA JUNIOR, Itamar. **Torto Arado.** São Paulo: Companhia das Letras, 2019.

W3C — WORLD WIDE WEB CONSORTIUM. **Web Content Accessibility Guidelines (WCAG) 2.1.** Disponível em: <https://www.w3.org/TR/WCAG21/>. Acesso em: 15 set. 2026.

---

**Fim do relatório.**
