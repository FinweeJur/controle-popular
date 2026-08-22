# Diário oficial — plano

> Escrito em 2026-08-10, a pedido do usuário: um resumo do que saiu de
> importante no diário de cada prefeitura — decretos, editais, convênios,
> contratos. **São Paulo fica por último**, por decisão dele.

## Por que isto vale mais do que parece

O portal hoje mostra o **resultado** (contrato assinado, licitação publicada no
PNCP) e não o **ato** (o decreto que criou a regra, o edital que abriu o prazo).
O diário é onde a decisão aparece primeiro, e é onde ela aparece *inteira* —
com prazo, com quem assina, com o processo administrativo.

E é o único lugar onde uma cidade pequena publica o que não vai para sistema
nenhum. Itinga tem 0 contratos no PNCP e 0 atos oficiais no banco; o diário
dela existe.

## A ordem sai da PLATAFORMA, não da cidade

O achado que organiza tudo: as cidades não têm cada uma o seu sistema — elas
compram de poucos fornecedores. Um coletor por plataforma cobre várias cidades.

| Fase | Plataforma | Cidades | Endereço |
|---|---|---|---|
| **D1** | **SIGPub** (Assoc. Mineira de Municípios) | Diamantina (a única confirmação limpa) | `diariomunicipal.com.br/amm-mg/` · busca em `/pesquisar` |
| **D2** | Portal próprio de Betim | Betim | `betim.mg.gov.br/portal/diario-oficial/` |
| **D3** | DOM-Web da PBH | Belo Horizonte | `dom-web.pbh.gov.br/` |
| **D4** | DOC paulistano | São Paulo | `diariooficial.prefeitura.sp.gov.br/` |

**D1 primeiro, e não é só por cobrir mais cidades:** SIGPub é a plataforma das
associações municipais de vários estados. Um coletor escrito por FORNECEDOR
— no molde de `etl.camaras.sapl` e `etl.camaras.syssolution` — atende Minas
hoje e qualquer estado que o portal ganhe depois. Escrever primeiro o de Betim
resolveria uma cidade e não ensinaria nada.

**Itinga foi confirmada: não é SIGPub.** O mapeamento (16/08/2026,
`docs/_historico/diario-oficial-sigpub-mapeamento.md`) mediu que Araçuaí e
Itinga publicam em diário **próprio** de cada prefeitura; só Diamantina bate
limpo com SIGPub. Araçuaí e Itinga entram na fase de coletor por-prefeitura,
não no D1 SIGPub.

**São Paulo por último**, como pedido, e há razão técnica junto: é o maior
volume e o único com caderno diário de centenas de páginas.

## O que coletar, e o que NÃO coletar

Uma tabela `atos_diario`, uma linha por matéria publicada:

```
id_municipio · data_publicacao · edicao · pagina
tipo          decreto | portaria | edital | contrato | convenio | lei | outro
numero_ato · orgao · ementa · texto · link_fonte · chave_natural
```

**`link_fonte` é obrigatório desde o primeiro dia.** A lição de `contratos`,
que passou 1.268 linhas sem link nenhum, custou caro: um portal que mostra ato
administrativo sem apontar para o diário pede confiança.

**O que fica de fora — ⚠️ corrigido em 22/08/2026.** A versão anterior deste
parágrafo dizia que nomeação e exoneração ficariam de fora. **O dono decidiu o
contrário**: nomeação e exoneração **entram** — "dados públicos de interesse
coletivo, sob minha responsabilidade" (`docs/ESTADO.md`, decisão 1). O que
continua de fora é CPF, endereço e dado de saúde de pessoa física — dado de
terceiro, não objeto daquela decisão — e as duas guardas automáticas do
repositório (`scripts/checar-dado-pessoal-em-dado.py`,
`sem-cpf-no-repo.test.ts`, mod-11) barram isso de qualquer jeito antes do
commit, independente de qualquer decisão editorial.

**Escopo do backfill — decidido em 22/08/2026:** coletar desde a penúltima
gestão municipal, **janeiro de 2020**. Medido ao vivo nesta data: o SIGPub de
Diamantina tem matéria pelo menos desde janeiro/2015, então dado existe bem
mais fundo do que 2020 — a escolha de 2020 é editorial (cobrir a gestão
2021-2024 inteira e a atual), não limite técnico da fonte. **Ainda não
executado**: são ~80 meses × ~200 matérias/mês só da Prefeitura, o que em
requisições pautadas (1,5 s de pausa, o mesmo cuidado já aplicado ao resto do
projeto contra hosts de terceiro) é uma coleta de horas, não de minutos — e
precisa de banco (`DATABASE_URL`) que a máquina de desenvolvimento não tem.
Roda em `home-pc` ou quando a Neon voltar (01/09), nunca em CI.

## O resumo — e onde ele pode dar errado

O pedido é "resumo do que saiu de importante". Há duas maneiras, e elas se
somam:

1. **Classificação por tipo, determinística.** Regex sobre o cabeçalho da
   matéria. É o que `etl/temas.py` já faz para proposições e contratos:
   auditável, explicável ("é edital porque começa com EDITAL Nº"). Entrega
   sozinha a maior parte do valor: "esta semana saíram 3 decretos, 2 editais
   de licitação e 1 convênio".
2. **Resumo em linguagem comum, por modelo.** Só depois, e pelo mesmo caminho
   que a análise garantista usa: `exportar_prompts` → resposta → importador
   que valida. Nunca escrevendo direto no banco.

**A armadilha do resumo automático** é dizer que uma coisa é importante. O
critério de "importante" tem de ser explícito e mecânico — valor acima de X,
prazo que abre, direito que muda —, nunca um julgamento do modelo apresentado
como fato. O portal já separa "violação legal" de "heurística" nos alertas de
contrato; aqui vale a mesma disciplina.

## Fases

**D0 — confirmar as plataformas** — ✅ feito (16/08/2026)
Diamantina confirmada como única cidade limpa no SIGPub/AMM-MG; Araçuaí e
Itinga têm diário próprio (ver `docs/_historico/diario-oficial-sigpub-mapeamento.md`).
Mecanismo de busca do SIGPub mapeado: GET + CSRF de sessão + datas
obrigatórias em `dd/mm/yyyy` + tabela de resultados + paginação por mês
(teto de itens por consulta — range longo devolve vazio).

**D1 — coletor SIGPub** (o grosso do trabalho)
Migration + coletor por fornecedor + classificação por tipo. Meta: Diamantina
com diário indexado e buscável. Progresso (22/08/2026, branch `diario-oficial`,
9 commits, ainda não mesclada em `main`):
- ✅ migration `0077_atos_diario.sql` (tabela `atos_diario`, `link_fonte`
  obrigatório, upsert por chave natural);
- ✅ classificador `apps/web/lib/diario/classificarAto.ts`, calibrado contra
  70 títulos reais (67/70 com tipo ≠ `outro`);
- ✅ **coletor escrito e medido ao vivo**: `etl/betim/etl/camaras/sigpub.py`
  (mecanismo de busca confirmado com `curl` — GET + sessão + token CSRF
  reutilizável — corrigindo um relato anterior que achava que era POST) +
  classificador portado pra Python (`etl/betim/etl/diario.py`, 70/70 contra a
  mesma fixture). Medido: 196 matérias reais da Prefeitura + 11 da Câmara só
  em julho/2026, ids de entidade capturados (Prefeitura 905, Câmara 21672).
  ⚠️ **Gap de calibração achado no dado real**: 16% caiu em `outro` (32/196),
  acima dos 4% da amostra de 70 títulos — duas causas identificadas, chip
  `task_f4a38f90` aberto para o dono decidir se vale corrigir.
- ⏳ **gravação em banco**: nunca exercitada — a máquina de desenvolvimento
  não tem `DATABASE_URL`. Roda quando houver banco (`home-pc` ou Neon 01/09).

**D2 — Betim.** Portal próprio. Betim é a cidade mais completa do portal e a
que mais gente usa.

**D3 — BH.** DOM-Web.

**D4 — São Paulo.** Por último.

**D5 — resumo por modelo.** Só quando houver acervo em pelo menos três
cidades: um resumo bom precisa de série para comparar "o que saiu esta semana"
com o normal.

## O que medir para saber se funcionou

Não é o coletor rodar sem erro. É:

- **cobertura**: quantos dias do período têm pelo menos uma matéria (buraco de
  dias é o modo de falha silencioso da paginação);
- **classificação**: que fração das matérias recebeu tipo — se ficar como
  Diamantina ficou nos temas (9%), a regex foi calibrada na cidade errada;
- **link**: 100% com `link_fonte` resolvível. Sem exceção.

---

## Proposta — o que estruturar além dos 7 tipos, pensando como TCE ou repórter

> Escrito em 22/08/2026, a pedido do dono: *"era bom entender que tipos de
> dados tem no diário oficial. faça uma proposta do que pode ser mais
> interessante sistematizar/estruturar de um ponto de vista sociológico [...]
> pensando como um TCE ou um jornalista investigador."*
>
> Base empírica: os **75 títulos reais** de Diamantina em
> `apps/web/lib/diario/fixtures/diamantina-75-titulos.json` (a mesma fixture
> que calibra o classificador — já no repo, já commitada, nada novo raspado
> para escrever isto) mais os números medidos pelo coletor em julho/2026 (196
> matérias da Prefeitura: 45 decreto, 43 edital, 43 contrato, 32 outro, 14
> portaria, 12 convênio, 7 lei). Cada padrão abaixo cita o título real que o
> sugeriu — isto é leitura do dado, não brainstorm solto.

### O achado que organiza tudo: o diário não é uma lista, é um rastro de PROCESSOS fragmentados

Os 7 tipos (`tipo` em `atos_diario`) respondem "que espécie de ato é este".
Não respondem a pergunta que mais interessa a um TCE ou a um repórter: **este
ato é fruto de qual outro?** Os 75 títulos reais mostram isso sem esforço —
o mesmo contrato aparece em 3, 4, até 5 publicações separadas ao longo de
meses:

```
AVISO DE INEXIGIBILIDADE ... PROCESSO LICITATÓRIO Nº 14/2025 - INEXIGIBILIDADE Nº 07/2025
TERMO DE RATIFICAÇÃO ......  PROCESSO LICITATÓRIO Nº 14/2025 - INEXIGIBILIDADE Nº 07/2025
EXTRATO DE CONTRATO ........ PROCESSO LICITATÓRIO Nº 14/2025 - INEXIGIBILIDADE Nº 07/2025
```

e, meses depois, o mesmo contrato de novo:

```
EXTRATO DO 1º TERMO ADITIVO AO CONTRATO Nº 019/2025
EXTRATO DO 2º TERMO ADITIVO AO CONTRATO Nº 019/2025
EXTRATO DO 3º TERMO ADITIVO AO CONTRATO Nº 019/2025
```

Hoje cada linha vira uma linha isolada em `atos_diario`, sem saber que são o
MESMO processo. É essa costura — não um oitavo tipo — que transforma o diário
de "lista de publicações" em "biografia de cada decisão pública", que é o que
interessa tanto ao TCE (a legalidade de um processo se avalia na cadeia
inteira, não numa publicação solta) quanto ao repórter (a história está na
cadeia: "o contrato começou pequeno e cresceu 4 aditivos depois").

### 1. Encadear pelo número do processo/contrato/convênio — a base de tudo o resto

**O quê:** extrair (regex sobre `ementa`, sem modelo) o número de processo
licitatório, contrato, convênio ou ata de registro de preço citado no título,
e usar isso como **chave de agrupamento** — não uma tabela nova, um campo
derivado (`processo_ref`) que junta várias linhas de `atos_diario` na mesma
história.

**Por quê interessa a um TCE:** a Lei 14.133/2021 limita quanto um contrato
pode crescer por aditivo (regra geral: até 25% do valor original, com
exceções). Sem encadear, ninguém vê que o Contrato 06/2025 já levou 2
aditivos. Encadeado, "quantos aditivos, em quanto tempo, depois de quantos
dias da assinatura original" vira consulta, não garimpo manual de PDF.

**Por quê interessa a um repórter:** a pergunta clássica de apuração —
"esse contrato pequeno virou grande depois?" — hoje exige abrir cada edição
manualmente. Encadeado, é ordenar por número de aditivos.

**Sociologicamente:** a PROPORÇÃO de contratos que recebem aditivo (e quantos)
é um indicador de capacidade de planejamento da administração — não prova de
irregularidade (aditivo é instrumento legal e às vezes necessário), mas um
retrato de como a máquina pública lida com imprevisto, comparável **entre
cidades** (ver item 7) e **ao longo do tempo** dentro da mesma cidade.

### 2. Dispensa e inexigibilidade de licitação como subtipo de primeira classe

**O quê:** hoje "dispensa"/"inexigibilidade" cai dentro de `edital` (ex.:
*"EXTRATO DE JUSTIFICATIVA DE DISPENSA DE CHAMAMENTO PÚBLICO Nº 012/2026"*,
*"AVISO DE INEXIGIBILIDADE DE LICITAÇÃO"*). Vale extrair como marcador
próprio (`modalidade: dispensa | inexigibilidade | pregao | credenciamento |
registro_de_preco | null`), não um tipo novo — um refinamento de `edital` e
`contrato`.

**Por quê interessa a um TCE:** dispensa e inexigibilidade são as duas
hipóteses em que a lei permite comprar **sem concorrência**. É a categoria
mais auditada de compra pública no Brasil — o próprio TCE-MG publica cartilha
específica sobre isso. Contagem e valor de dispensas ao longo do tempo, por
órgão, é o tipo de série que um TCE monta à mão hoje.

**Por quê interessa a um repórter:** "fracionamento de despesa" — quebrar uma
compra grande em várias pequenas, cada uma abaixo do teto que exigiria
licitação — é um dos achados mais recorrentes de reportagem investigativa
sobre prefeitura. É visível só quando dá para somar dispensas do MESMO órgão,
no MESMO mês, por valor.

**Medido nos 75 títulos:** pelo menos 5 de 75 (6,7%) já são dispensa ou
inexigibilidade — numa amostra pequena e não systematicamente amostrada, mas
é sinal de que não é caso raro.

### 3. Buracos na numeração sequencial de decreto/portaria — sinal de qualidade E de cobertura

**O quê:** decretos e portarias são numerados sequencialmente pela própria
prefeitura (Decreto 338, 339, 341... — repare que **340 nunca apareceu** nos
75 títulos reais). Com `numero_ato` já extraído, checar a sequência inteira
de um ano é aritmética simples: quais números faltam.

**Por quê interessa a TCE e repórter, das duas pontas:** um buraco pode ser
(a) decreto revogado antes de publicar — normal — (b) o **coletor** perdeu
uma matéria — bug nosso, mesma disciplina que a paginação já segue ("buraco é
o modo de falha silencioso") — ou (c) um decreto que **nunca foi publicado**,
o que é, em si, uma quebra do dever de publicidade. As três hipóteses têm
tratamento diferente, mas a primeira pergunta é sempre a mesma: **existe
buraco?** Hoje ninguém sabe, porque ninguém soma a sequência.

**Cuidado editorial:** um buraco é uma PERGUNTA, nunca uma acusação — a régua
de honestidade do próprio portal (`AGENTS.md`: "insinuação é dano mesmo
quando cada dado isolado está certo") vale em dobro aqui. A tela mostra "o
Decreto 340/2026 não foi encontrado nesta fonte", não "o Decreto 340
desapareceu suspeitosamente".

### 4. Concentração de fornecedor/organização parceira

**O quê:** `ementa`/`texto` de contratos e convênios costuma citar a
contraparte (empresa contratada, ONG conveniada). Extrair nome (e CNPJ, onde
aparecer — **não confirmado ainda se `texto`, capturado só com
`--com-detalhe`, traz CNPJ; verificar antes de prometer**) e permitir somar
por contraparte: quantos contratos, qual valor total, com quantos órgãos
diferentes da mesma cidade.

**Por quê interessa a TCE e repórter:** é a pergunta mais clássica de
jornalismo de dados sobre contratação pública — "quem mais recebe, e é
sempre a mesma empresa". O portal já tem a infraestrutura equivalente para
outra fonte (`contratos.fornecedor_cnpj`, citado em
`docs/planos/PLANO-EXPANSAO-ACORDOS-MG.md` como ponte já esperada) — encaixar
o diário no mesmo eixo, não inventar um novo.

**Sociologicamente:** concentração de fornecedor é proxy de **densidade do
mercado local** — cidade pequena tem menos empresa capaz de atender edital
técnico, e isso por si só explica repetição sem irregularidade nenhuma. A
tela tem que mostrar o número (quantos fornecedores distintos existem no
total, para dar escala à concentração), não só o ranking dos que mais
aparecem — senão o dado convida à leitura errada por omissão de contexto.

### 5. Portaria de pessoal como subcategoria — separado de portaria normativa

**O quê:** `portaria`, como classificado hoje, mistura regulação
administrativa comum ("PORTARIA SMS Nº 09") com atos de pessoal (nomeação,
exoneração, designação de cargo comissionado). A decisão 1 do dono
(22/08) autorizou especificamente nomeação/exoneração — vale um subtipo que
isole ISSO dentro de `portaria`, não o balde inteiro.

**Por quê interessa a TCE e repórter:** taxa de rotatividade de cargo
comissionado (quantas nomeações/exonerações por mês, e se o padrão muda logo
após posse de novo prefeito) é indicador clássico de fisiologismo/aparelhamento
da máquina — sem julgar CASO por caso, o AGREGADO (rotatividade ao longo do
tempo) é dado legítimo e sóbrio de mostrar.

**Cuidado que este projeto já se impôs em outro lugar do repo:** não inferir
gênero, raça ou qualquer atributo demográfico a partir de nome de pessoa — é
prática não confiável e capaz de atribuir errado a uma pessoa real. Se um dia
a composição demográfica de quem ocupa cargo comissionado importar
sociologicamente, o caminho é declarar a limitação, nunca inferir por nome.

### 6. Frequência e agrupamento temporal — o eixo mais "sociológico" da lista

**O quê:** contar publicações por semana/mês, por tipo, e cruzar com o
calendário do mandato (posse, fim de exercício orçamentário, proximidade de
eleição — a "penúltima gestão" que abre este backfill é justamente o
material bruto pra isso).

**Por quê interessa a um TCE:** pico de decreto/contrato nos últimos meses de
mandato ("gasto de fim de mandato") é padrão nomeado e vigiado pelos
tribunais de conta nacionalmente — a Lei de Responsabilidade Fiscal já limita
especificamente despesa nos últimos 8 meses de mandato. Ter a série pronta é
material de fiscalização direto.

**Por quê interessa a um repórter:** a mesma série é a manchete de agosto de
ano eleitoral em qualquer redação municipal.

**Sociologicamente**, é o item que mais value agrega além do que um sistema
de compras já mostra: o diário captura o RITMO da administração — quando ela
decide, não só o que decide. Comparado entre as 4 cidades do backfill (a
serem cobertas por D1-D4), esse ritmo também expõe diferença de capacidade
institucional entre prefeitura grande (BH, profissionalizada) e pequena
(Diamantina, Araçuaí, Itinga) — um eixo comparativo que só existe porque este
é um portal multi-cidade, não um clipping de uma prefeitura só.

### 7. Comparação entre cidades — o eixo que só este portal tem

**O quê:** depois de D1-D4 cobrirem as ≥4 plataformas, os MESMOS campos
derivados acima (aditivo por contrato, taxa de dispensa, rotatividade de
pessoal, ritmo por mês do mandato) viram comparáveis entre Betim, BH,
Diamantina, Araçuaí, Itinga e SP.

**Por quê é o item de maior alavancagem, apesar de vir por último:** nenhuma
das cidades individualmente sustenta uma afirmação como "isso é normal" ou
"isso é fora do padrão" — só a comparação sustenta. Uma dispensa de
licitação em 8% dos atos de Diamantina só vira notícia (ou não) quando dá
pra dizer se Araçuaí, de porte parecido, fica em 2% ou em 15%.

### O que NÃO fazer — a linha que o próprio portal já traçou em outro lugar

- **Não pontuar, não ranquear risco.** `docs/planos/PLANO-BASES-CLIMA-E-RISCO.md`
  já registrou a régua: *"índice composto não é medida"* — um número de 0 a
  1 dizendo "risco de irregularidade: alto" é opinião com forma de dado. Este
  portal mostra o fato estruturado (quantos aditivos, qual %, desde quando) e
  para aí — quem julga é quem lê, TCE ou jornalista, não o portal.
- **Não inferir intenção.** "Fracionamento de despesa" é um PADRÃO a mostrar
  (duas dispensas do mesmo órgão, mesma semana, valor somado perto do teto
  legal) — a tela nunca afirma que houve fracionamento, só que o padrão
  existe e como conferir.
- **Não noticiar buraco como escândalo.** Item 3 já registra isso: buraco na
  numeração é pergunta, tratada com a mesma humildade que "NAO_VERIFICADO" já
  tem no resto do portal (`docs/planos/CLASSIFICACAO-COMPLETUDE.md`).
- **Não misturar nomeação/exoneração com dado de terceiro.** Decisão 1 abriu
  a porta para AGENTE PÚBLICO em exercício de função pública — não para
  qualquer nome que apareça num texto de diário.

### Prioridade sugerida, e por que essa ordem

| # | Item | Custo | Por quê vem aqui na ordem |
|---|---|---:|---|
| 1 | Encadeamento por processo/contrato | Médio (regex sobre `ementa`, sem fonte nova) | Todo o resto (2, 3, 4) fica mais forte com isto pronto primeiro — é a fundação |
| 2 | Dispensa/inexigibilidade como subtipo | Baixo (regex sobre título, mesmo padrão do classificador atual) | Maior valor por esforço — TCE e imprensa já sabem o que fazer com isso |
| 3 | Buracos de numeração | Baixo (aritmética sobre `numero_ato` já extraído) | Serve dois propósitos ao mesmo tempo: QA do próprio coletor e sinal editorial |
| 6 | Frequência temporal | Baixo (agregação sobre `data_publicacao`, já existe) | Não depende de nenhum dos anteriores; dá para fazer em paralelo |
| 4 | Concentração de fornecedor | Médio-alto (precisa confirmar se `texto` tem CNPJ) | Depende de medir o dado de detalhe primeiro, não assumir |
| 5 | Subtipo de pessoal | Baixo, mas trava em decisão editorial (que rótulo mostrar) | Sensível o bastante para não apressar |
| 7 | Comparação entre cidades | Alto (depende de D2-D4 existirem) | Maior valor absoluto, mas estruturalmente o último a ficar pronto |

**Nada disto está implementado** — é proposta, registrada aqui para não se
perder, no mesmo padrão dos outros planos deste diretório (`ponteiro, não
cópia` — quando um item virar execução, o código e a medição vivem no commit
e neste arquivo, a decisão do dono fica em `docs/ESTADO.md`).
