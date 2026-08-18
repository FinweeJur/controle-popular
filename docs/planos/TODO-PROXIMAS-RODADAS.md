# TODO — o que ficou para as próximas rodadas

> Escrito em 13/08/2026, no fim de um dia longo. Serve para a próxima sessão
> (e para o outro PC) não redescobrirem nada do zero. Ordem: dívida primeiro,
> feature depois.

## 🔴 Dívidas que precisam sair antes de crescer mais

### 1. A trava de dado pessoal não varre o DADO, só o código

> ✅ **feito em 16/08.** `scripts/checar-dado-pessoal-em-dado.py` (CPF mod-11
> sobre os VALORES de JSON de acervo, com `--staged`, `--extra` e `--self-test`)
> está no pre-push e na CI (`dado-pessoal.yml`), com teste gêmeo
> `apps/web/lib/sem-dado-pessoal-no-repo.test.ts`. A régua semântica por acervo
> (`lib/paraopeba/triagem.ts`) segue sendo a triagem de verdade para o
> Brumadinho — a rede pega CPF no texto e não substitui aquela. O histórico
> abaixo fica para registrar por que ela existe.

`scripts/checar-dado-pessoal.py` foi desenhado para varrer **código-fonte**.
Ele não cobre acervo ingerido — e o portal começou a ingerir acervo hoje.

A frente Paraopeba já bateu nisso: precisou escrever a própria régua de
triagem (`lib/paraopeba/triagem.ts`) porque a trava não pegaria. E ela achou
coisa de verdade: um resumo que anunciava *"lista com nome do desaparecido,
endereço e telefone"*.

**Precisa existir antes** dos planos de ingestão do acervo judicial (UFMG,
DataJud) saírem do papel.

### 2. A Neon está desatualizada em relação ao Postgres local

Rodaram **só no banco local** desta máquina:
- migration `0071` (chave estável de `convenios_federais` — a que consertou o
  valor dobrado de Betim)
- backfill do classificador de temas (100 de 10.317 atos)
- correção da URL de jurisprudência do TJMG em `direito_critico_precedentes`

A Neon segue em HTTP 402 até 2026-09-01, e os 6 ETLs do GitHub apontam para
lá. Enquanto isso não rodar, aquele banco volta a duplicar convênio.

> ✅ **roteiro pronto em 17/08:** `docs/planos/ROTEIRO-NEON-01-09.md` —
> passo a passo do 01/09 (migrations 0071–0077 em ordem, backfill de temas,
> as TRÊS URLs TJMG corrigidas via UPDATE reproduzível — o seed
> `dados-seed/direito-critico-popular.html` foi corrigido na raiz em 17/08,
> já que a correção manual de 13/08 só rodou no banco local — carga da
> legislação federal e varredura total dos 25.729 links). Ficou registrado
> também por que as três URLs antigas morreram (medido: 404; a consulta de
> jurisprudência unificada do TJMG existe desde 22/06/2026).

### 3. Legislação federal continua ausente

`ambiental_legislacao` tem 6.378 normas e **todas são estaduais** (SIAM 4.077,
SEMAD 2.232, ALMG 69). O portal publica 19.704 licenças ambientais e não tem a
Resolução CONAMA que rege o licenciamento.

Plano pronto em `docs/_historico/FONTES-CNJ-JUMA.md` (CSV do MMA, licença CC-BY
confirmada, ~8,5 a 10,4 mil normas federais).

> ✅ **coleta pronta em 17/08:** `etl/betim/dados/legislacao-mma.json`
> (8.570 normas) re-coletado e **idêntico** ao já versionado (o CSV da fonte
> não mudou desde 2025-09-23 — a re-coleta confirmou que o congelado segue
> atual). O `legislacao-cndh.json` já existia. **Falta só a carga** — está no
> `ROTEIRO-NEON-01-09.md` (passo 4), junto com a reclassificação de temas.
> A lacuna fecha quando o banco voltar: `ambiental_legislacao` passa a ter
> as 8.570 normas federais, inclusive as Resoluções CONAMA.

### 3b. O ETL antigo da FGV finge ser navegador, e o host pede para não ser rastreado

Medido em 15/08/2026: `https://www18.fgv.br/robots.txt` responde
`User-Agent: * / Disallow: /` — o host inteiro, sem exceção. E
`etl/betim/etl/apis/fgv_paraopeba.py` (de 24/07) baixa de lá **com
User-Agent de navegador falso** (`Mozilla/5.0 ... AppleWebKit/537.36`), sem
pausa e sem ressalva nenhuma.

O coletor novo da mesma fonte (`scripts/coletar-execucao-fgv.mts`) já nasceu
do outro jeito: identifica o projeto, pausa 1,5 s, é manual e nunca entra em
CI — o raciocínio está no cabeçalho dele e em
`docs/FONTES-PRO-BRUMADINHO-E-FGV.md` §3.3.

**Dívida:** alinhar o ETL antigo (User-Agent honesto + pausa) ou aposentá-lo
em favor do coletor novo, já que a tela do Paraopeba agora cobre a bacia
inteira e a de Betim cobre só Betim. Decisão do dono. Enquanto isso, não
aumentar a frequência de nenhum dos dois.

> ✅ **alinhado em 17/08:** `fgv_paraopeba.py` trocou o UA de navegador
> falso pelo honesto `ControlePopular/1.0 (+https://github.com/FinweeJur/
> controle-popular)` (mesma régua dos coletores novos) e ganhou pausa de
> 1,5 s entre requisições. A aposentadoria do ETL em favor do coletor novo
> continua sendo decisão do dono — o ETL antigo segue sendo o que alimenta
> a tela de Betim (`paraopeba_iniciativas`/`saldo`) via CI.

O coletor do repasse dos 853 (`scripts/coletar-repasse-brumadinho-mg.mts`,
15/08) nasceu na mesma régua e acrescenta uma peça: o HTML de 347 KB fica em
`.cache/` (ignorado no git) por 12 h, porque o momento em que se pede a mesma
coisa muitas vezes ao mesmo servidor é o desenvolvimento do parser, não a
produção. `robots.txt` de `www.mg.gov.br` **permite** `/pro-brumadinho`, e
ainda assim vale a mesma regra: manual, com pausa, User-Agent honesto, e nunca
em CI.

### 3c. ⚠️ O exemplo da armadilha "IBGE 7 × 6 dígitos" está errado nas anotações

Medido em 15/08/2026, ao coletar o repasse dos 853. A anotação que circula
neste projeto diz:

> "Código IBGE tem 7 dígitos no IBGE e 6 no ComunicaBR. Betim é `3106200` (7)
> e `310670` (6)."

**`3106200` é Belo Horizonte.** O par curto dele é `310620`. Betim é
`3106705`, e é dele que sai `310670`, tirando o dígito verificador — ou seja,
o de 6 é o de 7 truncado, e não "outra numeração", como a anotação também dá
a entender.

A armadilha em si é real e continua valendo: misturar as duas numerações
responde 200 e devolve vazio (medido em `lib/comunicabr/mg.ts`). O que está
errado é o **exemplo** — e é o exemplo que as pessoas copiam. Ele atravessou o
enunciado de uma rodada inteira sem ninguém tropeçar, porque dois códigos de
sete dígitos começados em `3106` ocupam o mesmo lugar na frase e ninguém
decora código de município.

Quem pegou foi um teste que compara o código com o **nome**
(`lib/brumadinho/repasse.test.ts`), não a revisão humana. **Dívida:** corrigir
a anotação onde ela estiver guardada fora do repositório. Dentro do
repositório os dois pares já estão travados por teste.

## 🟢 Resolvido em 13–17/08 (o histórico abaixo fica registrado)

### 4. Cobertura de território que ficou de fora

> ✅ **resolvido.** Em 13/08 os 13 territórios quilombolas do INCRA que
> faltavam entraram (terceira fonte `-outras-regioes`, depois **fundida em
> UMA camada** a pedido do dono — "qual o sentido de dividir?"); em 15/08 os
> alertas foram recalculados sobre a base maior e os números atualizados na
> tela (ver `docs/_historico/HANDOFF-ALERTAS-TERRITORIO.md`, seção "✅
> ENTREGUE em 15/08": 21 operação, 271 interesse, 6 mancha). Medido em
> 17/08: 27 polígonos de 23 territórios, só **1 feição sem par no INCRA**
> (58,2 ha, Lagoa Grande/Jenipapo de Minas — `fonte_incra: false`, nome
> nunca inventado); as **2 de 271** sobreposições de interesse "sem nome"
> são a MESMA feição (índice 5 da camada unificada) — lacuna do dado de
> origem, declarada na ficha do alerta, não bug. O histórico abaixo fica
> para registrar o estado de 13/08.

---

## 🟡 Pedidos do dono, registrados para não se perderem

### 5. Analisar o commit do PC externo sobre CAR/INCRA

Houve um commit no `desktop-fefpddp` com análise de CAR/INCRA. **Ler, e ver o
que dá para integrar a mais.** Esta máquina não tem o dado bruto do CAR/INCRA
(ver `docs/build-em-outro-pc.md`), então a análise pode ter chegado a coisa
que aqui não se reproduz.

### 6. Revisão geral de completude — páginas com buraco

Pedido literal: *"tem várias páginas com dados incompletos, faltando contatos,
telefones, links"*.

Isto é varredura, não conserto pontual. O que já se sabe que existe:
- 13 itens em `NAO_VERIFICADO` (`lib/betim/redeProtecao.ts`) — canais reais com
  endereço ou telefone não confirmado.
- Uma comissão da OAB que virou lacuna declarada (site nulo, endereço mantido).
- A auditoria de hiperlinks de 13/08 cobriu 129 URLs externas e **amostrou** 42
  de 25.729 links guardados em banco — o resto não foi conferido.

A varredura precisa distinguir três coisas, porque o tratamento difere:
**ausente** (nunca teve), **desatualizado** (teve e envelheceu) e **não
verificado** (existe e ninguém confirmou).

> **Rodada 1 (14/08):** 13 → 11 itens em `NAO_VERIFICADO` (2 resolvidos:
> Defensoria de MG e Ouvidoria de Betim — ver comentário no arquivo).
> **Rodada 2 (17/08):** 2 itens registraram MUDANÇA real, nenhum virou
> confirmação plena — Portal de Transparência de SP (captcha caiu; canal de
> LAI do estado é `fala.sp.gov.br`) e OAB-MG (bloqueio 403 sumiu; comissão de
> Direitos Humanos ainda não localizada na listagem, que pagina via JS).
> **Rodada 3 (17/08):** classificação completa das páginas — 67 buracos
> (44 AUSENTE, 18 NAO_VERIFICADO, 5 DESATUALIZADO), ver
> `docs/planos/CLASSIFICACAO-COMPLETUDE.md`. 4 críticos de código (WhatsApp
> placeholder do `/anuncie`, Diário Oficial hardcoded de Betim em todas as
> cidades, plantão de farmácias sem telefone/endereço, zap sem link).
> **Rodada 4 (17/08):** críticos 1, 2, 3 e 4 corrigidos — WhatsApp
> comercial real (dono confirmou 5531975709609), Diário Oficial por cidade
> (`fontes.diario_oficial`, contagem de edições só em Betim, Itinga sem
> fonte não renderiza o card), plantão de farmácias sem "—" prometido
> (endereço nulo é omitido; o dado real segue dependente de escala oficial
> que não é publicada em formato estruturado — busca de 17/08 confirmou) e
> Zap sem link quebrado (`normalizarLinhasZap` nas duas pontas, build
> estático + API D1, 10 testes novos). Faltam: auditoria total dos 25.729
> links em banco (Neon, 01/09) e as decisões do dono listadas na seção 5
> do relatório.

### 7. Revisão crítica de onboarding, acessibilidade e uso por leigo — ✅ feito em 14/08

Ver `docs/REVISAO-UX-E-ONBOARDING.md`. Resumo: as quatro pistas abaixo já
tinham sido corrigidas antes desta rodada (a última, "não achou uma
frente", só em 14/08 — era cabeçalho de zona cravado à mão, corrigido na
raiz). A revisão dedicada achou mais: `<main>` faltando em 7 páginas
(inclusive a home) escondia o botão "Ouvir esta página", e o tema alto
contraste tinha o anel de foco em 1,42:1. Os baratos foram consertados
direto no código (3 commits); o que é decisão de layout/identidade visual
(dar cabeçalho a Terras e Paraopeba, hierarquia da home) ficou registrado
para o dono decidir.

Pedido literal: *"pensando no onboarding, facilitação de uso, acessibilidade
da plataforma pra leigos, busque por possíveis dificuldades, possíveis
dúvidas, como achar tudo mais fácil, pequenas microanimações pra facilitar"*.

Pistas já colhidas hoje, sem procurar:
- O dono navegou no celular e não achou uma frente que existia.
- Um link "Termos" dava 404 em toda página do eixo Cidades.
- Três telas prometiam "ver metodologia" e abriam página de outro assunto.
- O rodapé fabricava o nome das frentes cortando string, e entregava
  "Estadual" para a frente de meio ambiente.

Ou seja: **o problema de navegação já se manifestou quatro vezes hoje**, e as
quatro foram achadas por acaso. Uma revisão dedicada acha mais.

Sobre microanimação: o portal tem alvo Cloudflare Workers com teto de bundle
apertado (ver o comentário do script `build` em `apps/web/package.json`, que
explica por que o build usa `--webpack`). Animação que exija biblioteca precisa
caber nisso — e `prefers-reduced-motion` não é opcional.

### 8. Design system — o que aproveitar de Kokonut UI, Motion.dev, Bklit UI — ✅ feito em 14/08

Ver a seção "Design system" de `docs/REVISAO-UX-E-ONBOARDING.md`.
Veredito curto: nenhum dos três entra como dependência — os três trazem
Motion (ex-Framer Motion) por baixo, custo real de bundle contra um
sistema de microanimação que hoje é 100% CSS e custa zero. O que vale
copiar é padrão, não código: o próprio globo 3D do portal já resolveu o
problema de "sigla sem explicação" melhor do que o hover-card que essas
bibliotecas ensinam (explicação sempre visível, porque "tooltip não
existe no celular" — comentário já existente em `config.js`).

Pergunta do dono: o que dá para se inspirar/apropriar desses três para melhorar
navegabilidade e design system.

**Cuidado que vem da natureza do projeto**: portal de transparência lido por
quem está sob estresse (denúncia, remoção, barragem). Animação que atrapalha
leitura, contraste que falha, ou componente bonito que quebra leitor de tela
custa mais aqui que num site comum. O `globals.css` já tem três blocos de tema,
inclusive **alto contraste com exigência de 7:1** — qualquer componente
adotado tem que passar nos três.

### 10. Ordenar e filtrar a visualização das listas de dados

> ✅ **feito em 17/08.** Lógica pura em `lib/tabela/ordenar.ts` (comparador por
> texto/número/data + `ordenarPor` imutável + `filtrarPorIgual` +
> `filtrarPorTexto`, 14 testes) e colada no componente: `TabelaEstatica.tsx`
> ganhou ordenação por clique no cabeçalho — 1º clique asc, 2º desc, 3º volta
> à ordem original; `aria-sort` no `<th>`, `⇅/▲/▼` como indicador, estado
> espelhado na URL (`?ordem=chave:asc`), paginação resetada ao ordenar.
> Coluna com `formatar` só ordena se declarar `ordernavel: true` (o valor
> exibido pode não ser o campo cru). As 11 listas que já usam
> `TabelaEstatica` herdam a ordenação; as listas de data que usam `formatar`
> precisam declarar `tipoOrdenacao: "data"` quando quiserem ordenar.

Pedido literal (16/08): *"Quero poder ordenar os contatos por valor, nome de
prestador, tema, data, tipo de alerta, as emendas parlamentares tbm e outros
dados, num geral que possa ser por filtro e também por ordenação a
visualização"*.

Isto é um mecanismo **horizontal**, não uma tela: as listas de dados do portal
(contratos, licitações, alertas, emendas parlamentares e demais tabelas) devem
poder **filtrar** e **ordenar** por campo. Campos citados: valor, nome do
prestador/fornecedor, tema, data, tipo de alerta, emendas parlamentares.

- **Padrão a estender, não inventar:** 11 listas em 11 rotas já usam
  `apps/web/app/[municipio]/components/TabelaEstatica.tsx` (medição em 16/08) —
  é o ponto de partida para filtro + ordenação com o mesmo visual.
- **a11y desde o dia 1:** filtro e ordenação são controles interativos —
  teclado, focus visível e `prefers-reduced-motion` valem aqui (ver
  `docs/REVISAO-UX-E-ONBOARDING.md`). Não usar cor como único sinal de "ativo".
- **Teste primeiro:** o mecanismo de ordenar (comparador) e filtrar (predicado)
  é lógica pura — cabe num módulo testável no molde de `lib/assistente/compor.ts`,
  antes de ser colado no componente.

### 11. Monitoramento da Vale — uma página dedicada

Pedido literal (16/08): *"um monitoramento da Vale completo: documentos, prestação
de contas, relatórios, notícias, onde investiu, quais benefícios fiscais recebeu,
onde presta contas, pra quem vendeu — e coloque isso numa página"*.

A Vale é o maior agente econômico da região (Pró-Brumadinho, R$ 11,48 bi ×
R$ 16,38 bi, fila 19) e o que mais concentra atenção da comunidade; hoje não há
uma frente única que reúna o que a empresa publica e o que os órgãos publicam
sobre ela.

Camadas pedidas, cada uma com fonte própria a confirmar antes de coletar (mesmo
método do diário oficial: confirmar o mecanismo da fonte antes de construir):

- **Documentos** — acervo e processos (Brumadinho, AJRI, FGV, acordo) e o que a Vale publica.
- **Prestação de contas** — execução do Acordo (26 municípios), repasses, relatórios de cumprimento.
- **Relatórios** — anuais/sustentabilidade/auditoria da Vale e dos órgãos fiscalizadores.
- **Notícias** — o radar existente (coletor diário) filtrável por "Vale".
- **Onde investiu** — investimentos e obras por município (liga à fila 8, barragens sem mancha, e ao Pró-Brumadinho).
- **Benefícios fiscais recebidos** — renúncia/incentivos (estadual e federal); mapear fontes antes (TCFA, compensações, incentivos de MG).
- **Onde presta contas** — canais institucionais (comissões, tribunais, RCC, site próprio).
- **Pra quem vendeu** — fornecedores/clientes da Vale na região (cruzamento com `contratos.fornecedor_cnpj` quando o banco existir).

- **Padrão a estender:** uma frente nova no padrão das existentes (zona + listas `TabelaEstatica`), reunindo as camadas como índices por fonte — não inventar mecanismo novo.
- **Fonte única de verdade:** listar as fontes por camada antes de construir, para não inventar tela sobre dado que não existe (mesmo erro evitado no diário).
- **a11y desde o dia 1** e `prefers-reduced-motion`: mesma disciplina das outras telas.

### 12. Plano de geocodificação dos dados da Vale

> ✅ **plano escrito em 17/08** — `docs/planos/PLANO-GEOCODIFICACAO.md`
> (método por camada, fontes de geometria já publicadas, regras de
> procedência e conferência manual). Execução começa quando o item 11 tiver
> dado coletado.

Pedido literal (16/08): *"plano de como geocodificar isso tudo depois"*.

É um **plano**, não uma tela: escrever o documento de como georreferenciar o que
o monitoramento da Vale (item 11) levantar — investimentos por município, obras,
barragens, vendas, prestações de contas — reutilizando a infra de mapa/geometria
que a Função Social da Terra e as camadas de barragem/mineração já têm.

- **Entregável:** o plano escrito em `docs/planos/`, com método de geocodificação
  por camada, fontes de geometria (limite municipal, SIGMINE) e o que precisa de
  conferência manual.
- **Dependência:** começa a executar quando o item 11 tiver dado coletado.

### 13. Chatbot IA sobre o acervo (adaptação do plano do Leilões)

Pedido literal (16/08): o dono trouxe o "Plano Final Contextualizado — Chatbot
IA pra Leilões.app" e pediu para **adaptar criticamente** pro Controle Popular
e registrar no plano.

O plano adaptado está em `docs/planos/PLANO-CHATBOT-IA.md`. Três pontos para
não se perder:

- **Não substitui o assistente determinístico** (degraus 0–2,
  `lib/assistente/compor.ts`): é um degrau 3 opcional, com citação obrigatória
  e ressalva visível de IA — o portal é lido por quem está sob estresse, e a
  confiança é o ativo.
- **Só documento público entra na memória**, varrido pelas duas guardas de dado
  pessoal antes da ingestão — a barra aqui é LGPD, não FAQ de leilão.
- **Decisões do dono em aberto antes de construir:** região do cérebro (o
  template exigia fora de EUA/Europa, mas o portal já roda em GitHub/Cloudflare/
  Neon — não é automático), qual acervo entra, e a ressalva de IA.

### 14. Ícones do Brasil nas páginas — 22/24 mapeados, 2 faltando

Pedido literal (16/08): usar, da fonte **Brasil Icons** (Woodcutter), os ícones
tucano, cacto, arara, café em grãos, maracá, árvore, mapa do Brasil com
bandeira, havaianas, mapa da América Latina, cruz e capoeirista; e, da fonte
**Icones do Brasil** (Maranzana), tartaruga, papagaio, banana, capoeira,
violão, palmeira, onça, pandeiro, santa, mico, pão de açúcar, indígena e saci.

Infra pronta em 16/08: as duas fontes convertidas para woff2 self-hosted
(`apps/web/app/fonts/`, `fonts-icones.ts` via `next/font/local` — módulo
separado do layout para não pesar o bundle até serem usadas) e licenças
registradas em `docs/CREDITOS-MIDIA.md`.

**Mapa preenchido em 16/08 via Character Map:** 22 de 24 ícones mapeados
(Componente `BrasilIcon` em `apps/web/app/BrasilIcon.tsx` com `MAP_BRASIL_ICONS`
e `MAP_ICONES_BRASIL` preenchidos). Microanimações CSS (`cp-icon-hover`,
`cp-icon-pulse`, `cp-icon-spin`) em `globals.css` com `prefers-reduced-motion`
e alto contraste desligando efeitos.

**Faltam 2 do Brasil Icons:** cruz e mapa da América Latina — dono não reportou
ainda a letra no Character Map. Pedir ao dono para abrir `charmap.exe`,
selecionar "Brasil Icons", localizar cruz e mapa da América Latina, e informar
o "Keystroke".

> ✅ **decidido em 17/08:** o dono mandou esquecer as duas letras e usar só os
> 22 mapeados — cruz e mapa da América Latina saem do escopo
> (`docs/CREDITOS-MIDIA.md`).

**Licença (decisão do dono antes de publicar):** Brasil Icons é donationware
(uso pessoal e comercial livre, crédito ©Woodcutter Manero). Icones do Brasil
tem licença **não verificada** — fonttoolbox marca "Unknown" e fonts2u marca
"Personal use" — uso público precisa de autorização do autor ou troca de
fonte.

### 15. Descrever a foto 00296 do acervo Brasil com S

> ✅ **feito em 17/08.** O dono descreveu: "mulher com notebook, fone de
> ouvido e prato de comida na mesa". A foto entrou no `FOTOS_BRASILCOMS`
> (`FotoBrasilComS.tsx`) com esse alt honesto e na faixa da frente Congresso.
> Histórico abaixo fica para registrar a régua.

A página do produto (`brasilcoms-00296`) não publica descrição/tags — sem o
que mostrar na imagem, ela ficou de fora das faixas `CenasDoBrasil` (alt
honesto é requisito). Alguém com visão descreve a foto (ou o dono passa o
texto do produto) e ela entra na grade.

---

## 🟢 Planos já escritos, esperando execução

| Plano | Arquivo |
|---|---|
| Painel de edição do site (CMS) | `docs/PLANO-PAINEL-EDICAO.md` |
| Arquivar cópia dos documentos citados | `docs/PLANO-ARQUIVO-DE-FONTES.md` |
| Integração Brumadinho (8 camadas + acervo) | `docs/PLANO-INTEGRACAO-BRUMADINHO.md` |
| Ingestão do painel Paraopeba e do acervo UFMG | `docs/PLANO-INGESTAO-PARAOPEBA.md` |
| CNJ/DataJud, JUMA, MMA/CONAMA, CNDH | `docs/FONTES-CNJ-JUMA.md` |
| Bases de clima e risco | `docs/PLANO-BASES-CLIMA-E-RISCO.md` — **1ª fatia feita em 15/08** (AdaptaBrasil + INMET): `docs/CLIMA-ADAPTABRASIL-E-INMET.md`. Falta aplicar a `0074` e rodar a carga num Postgres local, e o BATER inteiro. |
| Direitos em Movimento | `docs/PLANO-DIREITOS-EM-MOVIMENTO.md` |
| Facilitador de ação cidadã | `docs/PLANO-ACAO-CIDADA.md` |
| Biblioteca das ATIs do Paraopeba | `docs/FONTES-BIBLIOTECA-ATI.md` — **feito em 15/08** (597 publicações da AEDAS e do Guaicuy, em `/paraopeba/biblioteca`). Sobrou o item 9 abaixo. |
| Chatbot IA sobre o acervo | `docs/planos/PLANO-CHATBOT-IA.md` — **adaptação do plano do Leilões**, pedida em 16/08; decisões do dono em aberto (região do cérebro, acervo, ressalva) — item 13 acima |

---

## 🟠 Aberto pela rodada de 15/08 (biblioteca das ATIs)

### 9. As três ATIs ainda não são fonte do radar de notícias

> ✅ **feito.** As três ATIs (AEDAS, ADAI, Guaicuy) já são fonte do radar
> (`FONTES` em `scripts/coletar-noticias-paraopeba.py`, feeds de taxonomia,
> `filtrar: False` — o escopo vem da categoria), e a regra de obituário entrou
> ANTES: `RE_NOTA_DE_PESAR` + `_redigir_nota_de_pesar` no coletor redigem o
> nome do título antes de gravar, e `temNotaDePesar` em
> `lib/paraopeba/triagem.ts` cobre o acervo de documentos (testes em
> `triagem.test.ts`). `radar.ts` lê `fontes` como dado — sem mudança de
> esquema, como o plano previa. O histórico abaixo fica para registrar a
> justificativa.

`docs/FONTES-BIBLIOTECA-ATI.md` §6 mede e justifica a escolha: a lacuna do radar
não é de tempo (o clipping vai até 30/07/2026 e a janela de 45 dias do radar
começa em 01/07), é de **voz** — as três fontes atuais são imprensa, e falta
quem é parte no processo, que publica a decisão primeiro. Os três feeds de
taxonomia já foram conferidos respondendo com o escopo certo, sem precisar do
filtro por termo de lugar:

```
https://aedasmg.org/projeto/paraopeba/feed/
https://adaibrasil.org.br/programa/paraopeba/feed/
https://guaicuy.org.br/categoria/ati-paraopeba/feed/
```

São três entradas na lista `FONTES` de `scripts/coletar-noticias-paraopeba.py`,
sem mudança de esquema — `radar.ts` lê `fontes` como dado. Ficou de fora em
15/08 porque `radar.ts` e a tela do radar estavam sendo escritos noutra sessão.

**Junto vai uma regra nova para a régua de triagem:** o feed do Guaicuy traz
itens "Nota de pesar: <nome completo>". São obituários públicos da própria
organização, mas `triagem.ts` não pega nome por extenso — só CPF, iniciais e
contato. Se notícia de ATI entrar, essa regra entra antes.

---

*Registrado em 2026-08-13. O que está marcado como medido foi medido nesta
data; o resto é pedido a executar.*
