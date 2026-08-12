# Controle Popular — apresentação do projeto

> **Nota de método.** Todo número deste documento foi conferido em
> **2026-08-12**, contra o código do repositório, o banco de dados que gera o
> site ou o histórico de commits — nenhum foi copiado de texto anterior. Onde
> a medição é de outra data, a data está escrita ao lado. Onde há dúvida, o
> documento diz que há dúvida: lacuna declarada é conteúdo; lacuna disfarçada
> é defeito.

---

## 1. O que é o portal, e para quem

O Controle Popular é um portal independente de transparência pública. Ele não
produz informação nova: reúne o que órgãos públicos já publicam — e publicam
espalhado por dezenas de sistemas, em linguagem administrativa — e apresenta
esse conteúdo em um só endereço, organizado por cidade e por tema, em
português comum.

A distinção importa. O dado sobre um contrato da prefeitura já é público: está
no Portal Nacional de Contratações Públicas. O dado sobre um projeto de lei
federal já é público: está na API de Dados Abertos da Câmara dos Deputados. O
que não existe é o lugar onde um morador encontra as duas coisas sem saber de
antemão que os dois sistemas existem, como se chamam e qual campo consultar. O
portal é esse lugar.

O público-alvo é o cidadão sem formação jurídica ou estatística, e a
consequência dessa escolha aparece no código: termos técnicos são explicados
na tela em que aparecem, e não em uma página de glossário que ninguém abre.

O portal está no ar em **controlepopular.com.br** e em
**controlepopular.finweejur.workers.dev** — os dois endereços responderam HTTP
200 na conferência feita para este documento. Os dois estão declarados em
`apps/web/wrangler.jsonc`, e o segundo é mantido de propósito, porque uma
página externa ainda aponta para ele.

### A regra que organiza tudo

O projeto se sustenta sobre uma regra única, e é dela que decorrem quase todas
as decisões técnicas descritas adiante:

> Todo número exibido tem fonte identificável, e todo número que resulta de
> estimativa aparece acompanhado da sua taxa de erro. Quando não há dado, a
> tela informa que não há — não preenche o espaço com uma aproximação
> silenciosa.

Um portal que cobra procedência dos outros não pode publicar número sem
procedência própria. Essa exigência é o que justifica o custo de várias
soluções que, sem ela, pareceriam excesso de zelo.

---

## 2. As cinco frentes

O portal se organiza em cinco frentes, chamadas internamente de *zonas*. A
descrição de cada uma vive em um arquivo único — `apps/web/lib/zonas.ts` — que
é lido tanto pela página inicial quanto pelo rodapé de remissão de cada frente.
O motivo é prático: quando o mesmo texto é escrito em quatro telas, alguém
corrige uma e esquece as outras três.

| Frente | Endereço | A que pergunta responde |
|---|---|---|
| **Municipal** | `/betim`, `/diamantina`, … | Para onde vai o dinheiro da prefeitura, e o que a câmara vota |
| **Congresso** | `/congresso` | O que o Congresso Nacional decide sobre direitos |
| **Judiciário** | `/judiciario` | Quem ocupa cada cadeira, quem indicou, quando ela vaga |
| **Ambiental** | `/ambiental` | O que o órgão ambiental de Minas Gerais decide, e onde |
| **Função social da terra** | `/funcaosocialterra` | Que áreas rurais ninguém declarou em cadastro |

**Municipal.** Seis cidades estão publicadas: **Araçuaí, Belo Horizonte,
Betim, Diamantina, Itinga e São Paulo**. A cobertura varia muito entre elas, e
o portal mostra a diferença em vez de escondê-la — a tabela de lacunas está na
seção 10.

**Congresso.** Proposições federais por tema, comissão e bancada, com a
análise descrita na seção 4 e a geração de um ofício em PDF para quem quiser
se manifestar sobre uma proposta.

**Judiciário.** O único Poder cujos integrantes não são eleitos. O portal
registra a composição de sete tribunais, quem indicou cada magistrado, e a
data em que cada um atinge a aposentadoria compulsória — que é **calculada**,
não estimada: são 75 anos de idade, por força da Emenda Constitucional 88/2015
e da Lei Complementar 152/2015. Essa régua, com as respectivas bases legais,
vive em `apps/web/lib/judiciario/regras.json`. O cálculo depende da data de
nascimento, que ainda está sendo levantada nome a nome — o estado dessa
curadoria aparece na seção 10.

**Ambiental.** Pauta das reuniões do COPAM (o conselho estadual que decide
sobre licenciamento em Minas Gerais), item a item e com o município de cada
processo; licenciamento ambiental do estado inteiro; situação das barragens; e
legislação ambiental de três fontes que não se comunicam entre si, reunidas em
uma busca só.

**Função social da terra.** Mede quanto do território de Araçuaí, Diamantina e
Itinga não tem imóvel rural declarado no Cadastro Ambiental Rural. É a única
frente cujo número principal é estimativa de método próprio, e não leitura
direta de fonte oficial — e por isso é a única que publica a taxa de erro
dentro do próprio cartão de apresentação. A seção 6 detalha.

### Volume publicado

Medido em 2026-08-12, diretamente no banco que gera o site.

**Municipal (seis cidades)**

| | |
|---|---:|
| Contratos | 12.991 |
| Licitações | 21.582 |
| Atos oficiais (leis, decretos, portarias) | 10.317 |
| Proposições de câmaras municipais | 13.317 |
| Vínculos de servidores | 139.052 |
| Vereadores | 158 |
| Escolas | 13.874 |
| Estabelecimentos de saúde | 36.157 |
| Obras | 59 |

**Congresso Nacional**

| | |
|---|---:|
| Proposições | 5.562 |
| Parlamentares | 593 |
| Bancadas e frentes parlamentares | 354 |
| Vínculos de parlamentar com bancada | 58.785 |
| Comissões e demais órgãos | 54 |
| Votações nominais | **0** — ver seção 10 |

**Judiciário**

| | |
|---|---:|
| Tribunais | 7 |
| Cadeiras previstas em lei (soma dos sete) | 251 |
| Magistrados cadastrados | 252 |
| Destes, com data de nascimento levantada | 69 |
| Indicações registradas | 140 |

O número de magistrados cadastrados não coincide com o de cadeiras, e não
deveria coincidir: a tabela de magistrados e a de ocupação de cadeira são
distintas, e hoje há 57 ocupações registradas contra 93 cadeiras individuadas.
A data de aposentadoria compulsória, por sua vez, só pode ser calculada para
os **69** com data de nascimento levantada — o restante é curadoria manual em
andamento, registrada na seção 10.

**Ambiental (Minas Gerais)**

| | |
|---|---:|
| Licenças ambientais | 19.704 |
| Normas ambientais (ALMG, SEMAD, SIAM) | 6.378 |
| Reuniões do COPAM | 454 |
| Itens de pauta | 2.367 |
| Barragens (FEAM) | 249 |
| Barragens (SNISB) | 2.240 |
| Autos de infração estaduais (CAP/SEMAD) | 78.039 |
| Autos de infração federais (IBAMA) | 20.046 |

**Portal como um todo**

| | |
|---|---:|
| Páginas geradas no último build (2026-08-12) | 3.850 |
| Endereços declarados no mapa do site | 7.040 |
| Documentos no índice de busca | 29.455 |

---

## 3. De onde vem o dado

Entre a fonte pública e a tela existe um conjunto de programas em Python que o
projeto chama de **ETL** — sigla de *extract, transform, load*, isto é,
extrair da fonte, ajustar o formato e gravar no banco. São **153 módulos
Python** em três pacotes (`etl/betim`, `etl/congresso`, `etl/judiciario`), dos
quais **93** ficam nos diretórios organizados por sistema de origem — as APIs
públicas, as bases estatísticas, os portais de cada câmara, o PNCP, os
sistemas de prefeitura.

Cada tema tem a sua origem declarada:

| Tema | Fonte |
|---|---|
| Contratos e licitações | PNCP — Portal Nacional de Contratações Públicas |
| Convênios, sanções e benefícios sociais | Portal da Transparência federal |
| População, PIB, agropecuária, malha territorial | IBGE |
| Escolas, saúde, mortalidade | INEP, CNES, SIH/SIM |
| Despesas e receitas municipais | SICONFI |
| Autuação ambiental federal | IBAMA |
| Autuação ambiental estadual e licenciamento | CAP e SEMAD-MG |
| Barragens | SNISB (ANA) e FEAM |
| Royalties da mineração | CFEM / ANM |
| Proposições, votações e parlamentares | APIs da Câmara dos Deputados e do Senado |
| Vereadores, fotos e legislação municipal | TSE, SAPL e portais das câmaras |

### A disciplina de documentação dos coletores

Esta é uma característica do projeto que merece ser mostrada, porque não é
comum e porque não é enfeite.

**Cada coletor documenta, no cabeçalho do próprio arquivo, três coisas: a
fonte exata que consulta, as armadilhas que foram medidas nela, e o que ele
deliberadamente não coleta.** A terceira é a mais incomum e a mais útil.

Um exemplo real, em `etl/betim/etl/apis/feam_barragens.py`, sob o título "o
que este módulo não prova":

> Cobertura é de barragem de mineração e indústria fiscalizada pela FEAM
> (209 + 40). Não cobre abastecimento de água, irrigação nem hidrelétrica —
> para essas, o coletor do SNISB. "Zero barragens da FEAM" num município
> **não** é "nenhuma barragem no município".

Sem esse parágrafo, um leitor tiraria da ausência de dado uma conclusão que o
dado não autoriza. O coletor de licenciamento ambiental
(`etl/betim/etl/apis/ambiental_licenciamento.py`) traz o equivalente: as
19.704 linhas têm um único valor de situação, "Concluído Deferido", porque
aquela camada é o registro histórico do que já foi decidido — não a fila do
que ainda está em análise, que é justamente o que ainda dá para influenciar.

As armadilhas registradas são medições, não suposições. A mais instrutiva está
documentada em `docs/ambiental/F0-discovery.md`: ao pedir a camada de licenças
inteira ao servidor geográfico do estado (um **WFS**, padrão de publicação de
dados geográficos pela internet), uma feição com coordenada inválida
interrompe a resposta no meio. Como o servidor já enviou o código de sucesso
antes de perceber o problema, **não existe erro para detectar**: um programa
desatento grava 145 registros dos 19.162 e informa que a coleta terminou bem.
A regra que o projeto extraiu disso — "a verificação vai no corpo da resposta,
nunca no código de status" — está implementada como função no coletor e roda
em toda resposta daquela fonte.

Por fim, o eixo ambiental mantém um cadastro de procedência em
`docs/ambiental/PROVENIENCIA.json`: **16 fontes adotadas, 3 em avaliação e 7
descartadas**, cada uma com o texto literal da licença de uso, a data de
verificação e o motivo do descarte. O arquivo existe por dois motivos
declarados nele mesmo: resultado sem fonte datada não é citável, e a frente
municipal veicula publicidade — fonte que veda uso comercial não pode entrar.

### Alertas de contrato: duas categorias, nunca uma

O portal marca contratos com sinais de risco, e **separa dois tipos**, porque
tratá-los igual daria a uma suspeita estatística o mesmo peso de uma violação
de artigo de lei:

- **Violação legal** — dispensa de licitação perto do limite, aditivo acima do
  teto, fornecedor sancionado, fracionamento de despesa. Seis regras, cada uma
  com o dispositivo citado na tela.
- **Heurística** — valor atípico para a categoria, capital social baixo,
  desproporção frente ao orçamento anual da cidade. Três regras. São sinais
  que TCU, CGU e Ministério Público usam para decidir o que investigar, e a
  tela diz textualmente que não são prova de irregularidade.

O catálogo com a fundamentação de cada regra está em
`apps/web/lib/betim/contratos.ts`; a implementação, em
`etl/betim/etl/alertas.py`. Hoje **4.495 dos 12.991 contratos** carregam ao
menos um alerta, e a regra de "muitos contratos ao mesmo fornecedor em janela
curta" responde sozinha por 4.168 deles.

Todo contrato traz o link para a sua página no PNCP. Acusar sem oferecer o
caminho de conferência seria pedir confiança — o contrário do que o portal
defende.

---

## 4. A análise garantista

Esta é a funcionalidade mais ambiciosa do portal, e a que exige mais cuidado
de exposição.

O portal classifica leis e projetos de lei conforme os direitos que eles
ampliam ou restringem. Uma proposta é **garantista** quando amplia direitos
fundamentais e **reducionista** quando os restringe. Essa é uma escolha de
valor, e o portal a declara em vez de escondê-la atrás de uma aparência de
imparcialidade: a página `/congresso/metodologia` afirma isso expressamente,
sob o título "A régua é declarada".

O que impede a escolha de valor de virar palpite são três separações.

### Primeira separação: a régua é declarada e vive em um lugar só

A rubrica é um arquivo — `apps/web/lib/congresso/rubrica/rubrica.json`, versão
1.0.0 — com **24 direitos** e **17 mecanismos**. Cada direito traz suas
**âncoras**: os dispositivos legais que o fundamentam. O direito à moradia, por
exemplo, tem como âncoras os artigos 6º, 23, IX e 182 da Constituição e a Lei
10.257/2001, o Estatuto da Cidade.

O mesmo arquivo é lido pelo programa que monta a instrução do modelo, pelo
programa que valida a resposta e pela página que explica a metodologia ao
leitor. Se a rubrica mudar, as três mudam juntas. A alternativa — descrever a
taxonomia em prosa numa página e implementá-la separadamente no código —
produziria, cedo ou tarde, um portal que publica uma metodologia diferente da
que aplica. Em um produto cujo argumento inteiro é a transparência da régua,
essa divergência seria o pior defeito possível.

### Segunda separação: o modelo extrai, o programa calcula

**O rótulo não é escrito por inteligência artificial.** O modelo de linguagem
nunca recebe a pergunta "este projeto é garantista ou reducionista?". Ele
recebe uma tarefa de extração: apontar quais direitos a proposta afeta, em que
direção, por qual mecanismo, em que grau — e, obrigatoriamente, **citar o
dispositivo legal** que fundamenta cada apontamento e o **trecho literal** do
projeto que o embasa.

A analogia útil é a do escrivão e do juiz. O modelo é escrivão: preenche um
formulário de campos fechados e anota de onde tirou cada informação. O rótulo
é aritmética sobre esse formulário, feita por código determinístico:

```
peso do item  = grau × direção × confiança
    grau:     marginal 1 · moderado 3 · estrutural 6
    direção:  amplia +1 · restringe −1 · neutro 0
score         = soma dos pesos dos itens válidos
```

O score cai em uma de cinco faixas, de "Fortemente reducionista" a
"Fortemente garantista". Como a fórmula é fixa, a mesma proposta com a mesma
rubrica produz sempre o mesmo resultado — e o leitor pode partir do rótulo e
chegar até a frase do projeto que o gerou.

**Item que não cita dispositivo válido é descartado antes de contar.** A
função de validação (`validar_itens`, em `etl/congresso/etl/rubrica.py`)
rejeita item cujo direito, direção ou grau esteja fora da lista fechada, e
rejeita item sem dispositivo citável. Nada é corrigido em silêncio: cada
descarte fica registrado com o motivo, para que a qualidade do modelo seja
medida em vez de suposta. Conferido no banco em 2026-08-12: dos **809 itens**
gravados na frente municipal e **608** na do Congresso, **nenhum** está sem
dispositivo.

Itens com confiança abaixo de 0,5 não são descartados, mas jogam a análise
inteira para o estado "requer revisão" em vez de receber rótulo. Hoje são 72
análises municipais e 6 do Congresso nessa condição.

### Terceira separação: cobertura é amostra, não censo

Este ponto precisa aparecer sempre que os rótulos aparecerem. **O portal não
analisou toda a legislação; analisou uma parte dela.**

| | Analisadas | Universo | Cobertura |
|---|---:|---:|---:|
| Atos oficiais municipais | 794 | 10.317 | 7,7% |
| Proposições municipais | 432 | 13.317 | 3,2% |
| Proposições federais | 676 | 5.562 | 12,2% |

Total acumulado: **1.902 análises**. A distribuição de rótulos, medida hoje:

- **Municipal (1.226)** — 787 neutro ou técnico, 420 garantista, 15
  reducionista, 4 misto.
- **Congresso (676)** — 350 garantista, 293 neutro, 16 reducionista, 10
  fortemente garantista, 5 misto, 2 fortemente reducionista.

A predominância de "neutro" não é falha: boa parte da produção legislativa
municipal é denominação de rua, data comemorativa e ato administrativo, e a
instrução do modelo manda devolver lista vazia nesses casos em vez de forçar
uma classificação que não existe. É por isso que 1.226 análises produziram
apenas 809 itens de direito.

O rótulo **misto** existe para um caso específico: proposta que amplia um
direito e restringe outro com peso relevante. Somar os dois daria perto de
zero e apareceria como "neutro", que é a leitura errada — a proposta é
controversa, não inócua. Nesse caso o portal mostra os dois lados.

Dois selos ficam **fora** do score: cláusula pétrea (art. 60, §4º da
Constituição) e vedação do retrocesso. Não somam nem subtraem pontos porque
são questão de constitucionalidade, não de grau; misturá-los produziria um
número sem significado.

Por fim, um detalhe de arquitetura que ilustra o rigor da régua única: a
frente municipal **não tem cópia própria da rubrica**. O módulo
`etl/betim/etl/analise_garantista.py` carrega os arquivos do Congresso por
caminho de arquivo, sob apelido próprio, para que o JSON lido seja o mesmo byte
a byte. A justificativa está escrita no cabeçalho: a Constituição governa lei
municipal exatamente como governa lei federal, e uma segunda rubrica "adaptada
para cidades" seria a maneira mais rápida de fazer duas frentes pontuarem em
réguas diferentes chamando as duas de a mesma.

---

## 5. A análise de vício legislativo

Em construção, e conceitualmente distinta da anterior. Enquanto a análise
garantista pergunta *o que a norma faz com os direitos*, esta pergunta *se a
norma foi feita do jeito certo, por quem tinha competência para fazê-la*.

As duas leem o mesmo texto e produzem resultados independentes: um projeto
pode ampliar direitos e, ainda assim, ter vício de iniciativa.

A régua vive em `apps/web/lib/congresso/rubrica/vicio_legislativo.json`, versão
1.0.0, com **cinco categorias**:

1. **Vício de iniciativa** — matéria que só o chefe do Executivo pode propor
   (criação de cargo, aumento de remuneração de servidor, organização
   administrativa) apresentada por parlamentar ou vereador. Âncora: art. 61,
   §1º, II da Constituição, aplicado aos municípios por simetria.
2. **Vício de competência** — ente legislando fora da sua esfera. É o caso
   central no âmbito municipal: o art. 30, I autoriza o município a legislar
   sobre "assuntos de interesse local", e há município regulando matéria
   privativa da União.
3. **Inconstitucionalidade material** — o conteúdo da norma, não o rito nem
   quem propôs, contraria a Constituição. Inclui ofensa a direito fundamental
   e violação da separação de poderes.
4. **Vício formal ou procedimental** — quórum errado para o tipo de norma,
   rito não observado, ausência de parecer de comissão obrigatória.
5. **Contrabando legislativo** ("jabuti") — emenda sem pertinência temática
   com o projeto original, prática que o Supremo julgou inconstitucional na
   ADI 5.127. **Documentada, mas não aplicada**: depende do histórico de
   emendas apresentadas durante a tramitação, e esse dado não está no acervo
   de proposições federais. A categoria fica registrada para quando existir, e
   o arquivo determina expressamente que não seja usada antes disso.

### A palavra "indício" é obrigatória

A regra está escrita no próprio arquivo de rubrica, com a expressão "regra
inegociável": **nada aqui pode virar veredito.** Controle de
constitucionalidade é função do Judiciário. O portal aponta pista — categoria
mais dispositivo citado — e nunca declara uma norma inconstitucional.

A disciplina é aplicada na própria taxonomia: os três níveis possíveis são
"sem indício", "indício leve" e "indício grave". **Não existe o rótulo
"inconstitucional" nem o rótulo "constitucional" na lista de valores
possíveis** — não é uma convenção de redação que alguém possa esquecer de
seguir, é a ausência da opção.

Como na análise garantista, o nível não vem do modelo: é calculado a partir da
categoria de maior gravidade entre os itens que sobreviveram à validação.
Zero itens válidos significa "sem indício".

A cobertura hoje é experimental: **15 análises na frente municipal** (7 com
indício grave, 8 sem indício) e **14 no Congresso** (6 graves, 8 sem indício).
É uma primeira leva de calibração, não um levantamento.

---

## 6. O mapa 3D de terras públicas

### Relação com o projeto irmão

O Controle Popular tem um projeto irmão em repositório separado, chamado
**Terras Devolutas**, descrito por ele mesmo como ferramenta de pesquisa
acadêmica. É lá que rodam os métodos que produzem as áreas: o pipeline em
Python que calcula "vazio cadastral" a partir de bases abertas, sobre duas
regiões de estudo (a bacia do rio Paraopeba e os Vales do Mucuri e do
Jequitinhonha).

O Controle Popular consome o resultado. O globo 3D, escrito em Three.js, foi
integrado ao portal em `/funcaosocialterra/mapa` como conteúdo estático — as
chamadas que antes dependiam de um servidor local viraram arquivos.

### O que o globo mostra

**19 entradas** no registro de camadas
(`apps/web/public/terras/globo/js/config.js`), das quais 18 são camadas de dado
geográfico — a décima nona desenha satélites em órbita — somando **12.611
feições** nos arquivos publicados. Entre elas: divisas dos 853
municípios de Minas Gerais, terra sem cadastro nas duas regiões de estudo,
assentamentos da reforma agrária, territórios quilombolas, terra pública com
medição oficial do INCRA, imóveis do governo federal (SPU), áreas embargadas
por infração ambiental, lotes vagos em Belo Horizonte, e 743 leis e decretos
cuja ementa cita um lugar reconhecível.

Duas camadas estão publicadas **vazias**, e ambas trazem essa condição
declarada no painel, antes do clique — para que ninguém suponha que a camada
falhou ao carregar. Uma é "lugares abandonados na imprensa", ainda não
coletada. A outra é o caso interessante: a camada de **terras devolutas já
reconhecidas** tem zero feições porque **o INCRA não publica essa base**. A
ausência é o achado, e é a razão de a camada existir mesmo vazia.

### A disciplina que rege esta frente

Nenhuma tela, e nenhum arquivo exportado, afirma que uma área é terra devoluta.

"Vazio cadastral" significa área que **nenhum imóvel rural declarou** no
Cadastro Ambiental Rural. O CAR é autodeclaratório: a ausência de declaração
não é ausência de dono, e muito menos prova de que a terra é pública. O
vocabulário publicado é "lugar para conferir", fixado como termo do projeto e
registrado como tal no código da exportação — a razão anotada ali é que quem
abre o arquivo exportado pode não ser quem abriu o mapa e leu as ressalvas da
tela.

Cada camada carrega a sua própria ressalva, e não uma genérica para todas.
Esse erro já foi cometido no projeto: o botão de copiar para ofício rotulava
**tudo** como "área sem cadastro no CAR", o que é falso em um imóvel da União.

### A taxa de erro, publicada ao lado do número

A frente mede o vazio cadastral de três municípios:

| Município | Área do município | Sem declaração no CAR | Proporção |
|---|---:|---:|---:|
| Araçuaí | 224.246 ha | 16.957 ha | 7,6% |
| Diamantina | 387.767 ha | 25.430 ha | 6,6% |
| Itinga | 164.324 ha | 11.483 ha | 7,0% |

Ao lado de cada número aparece a taxa de erro do método. Em 2026-08-09, **40
polígonos foram sorteados ao acaso e conferidos um a um, a olho, sobre imagem
de satélite**. Doze não eram vazio cadastral: **taxa de erro de 30,0%**, que,
pelo tamanho da amostra, pode estar entre 18,1% e 45,4%.

Esse intervalo é o que a estatística chama de intervalo de confiança, e a
analogia que o explica é a de corrigir 40 provas de uma turma de mil para
estimar a média da turma: a margem responde à pergunta "e se eu tivesse
sorteado outras 40?". Quanto menor a amostra, mais larga a margem.

O erro tem causa única e identificada: faixa de estrada entrando no polígono.
Não é ruído espalhado — é defeito conhecido do recorte, e por isso mensurável
e corrigível.

Dois cuidados adicionais aparecem na tela, e ambos são deliberados:

- **O teto de 33% é decisão, não medição.** O projeto aceita publicar até essa
  taxa. O componente separa o que foi medido (30,0%) do que foi escolhido
  (33%), porque o leitor tem direito de discordar da escolha sabendo que é
  escolha.
- **A correção já existe no código e ainda não está no dado publicado.** Desde
  2026-08-12 o pipeline subtrai a faixa das estradas, mas aplicar isso à bacia
  inteira exige reprocessar 56 municípios, o que ainda não rodou. A tela diz
  isso com todas as letras. E diz por meio de uma variável booleana, não de uma
  data escrita à mão: quando o reprocessamento acontecer, o parágrafo
  desaparece sozinho.

O código correspondente está em `apps/web/lib/betim/terras.ts` (a constante) e
em `apps/web/app/[municipio]/components/TaxaDeErroTerras.tsx` (o bloco visível
na tela).

### A correção de 12/08: o ponto que precisa cair dentro da área

Vale contar em detalhe, porque ilustra o padrão de rigor do projeto.

Ao clicar em uma área do globo, abre-se uma ficha com os dados dela e dois
botões: copiar a coordenada e copiar um texto pronto para ofício ou pedido de
acesso à informação. Descobriu-se que, para parte das áreas, **os dois botões
simplesmente não apareciam** — sem mensagem, sem explicação.

A causa: **para 1.823 polígonos, em 8 das camadas, a fonte publica o contorno
mas não publica um ponto de referência**. Sem ponto, a função que montava o
bloco de coordenadas devolvia vazio e os botões não eram criados. (Desses
1.823, 853 são as divisas municipais do IBGE; as **970 restantes**, em 7
camadas, são áreas propriamente ditas, que são as que a exportação alcança.)

A solução óbvia seria calcular o **centroide** — a média das coordenadas do
contorno, o "centro de massa" da figura. E a solução óbvia está errada.

O centroide de uma ferradura cai no vão, fora do metal. Muitos polígonos deste
acervo têm exatamente essa forma: são redes de corredores finos e sinuosos —
há um caso, na camada da bacia, com 218 metros de largura média espalhados por
1.967 hectares. O centroide de uma figura dessas cai fora dela.

Isso importaria pouco se o ponto fosse decorativo. Mas **a ficha afirma, em
texto, que o ponto fica dentro da área** — e esse texto vai para ofício e para
pedido de acesso à informação. Entregar um ponto fora tornaria a frase falsa.

O algoritmo implementado em
`apps/web/public/terras/globo/js/ui/pontosuperficie.js` é, portanto, de busca,
não de média: parte da caixa que envolve o polígono, divide em células cada
vez menores, guarda a célula cujo centro está mais longe do contorno pelo lado
de dentro, e descarta os ramos que matematicamente não podem superar o melhor
já encontrado. É a ideia que a cartografia chama de *polo de inacessibilidade*:
o ponto mais distante de qualquer fronteira, isto é, o mais "no meio" que uma
forma irregular permite.

O resultado foi verificado com um teste geométrico independente sobre as 1.823
áreas: **1.823 dentro, zero fora, zero nulo**, tratando inclusive polígonos com
buracos.

Três cuidados fecham a correção:

- O ponto calculado **se distingue do publicado**: selo próprio na tela, nota
  própria, e ressalva no texto copiado.
- O ponto calculado passou a sair também no **CSV e no GeoJSON**, e não apenas
  no formato texto. Antes, o cabeçalho do CSV afirmava uma coordenada que o
  arquivo não continha — um botão entregava e dois omitiam calados.
- O botão de baixar a área isolada aplica a **mesma regra de permissão** da
  lista. Sem isso, era possível gerar um arquivo intitulado "áreas exportadas
  do mapa Terras Públicas", com ressalva sobre terra devoluta, para uma divisa
  municipal do IBGE.

Um detalhe de higiene vale registrar, porque o projeto o registrou no próprio
código: o número dessa contagem **já esteve errado**. Um comentário dizia "839
áreas em quatro camadas", esquecendo três camadas irmãs, e o erro se propagou
para cinco comentários antes de alguém recontar varrendo os arquivos. A
contagem correta — 970 em sete camadas listáveis, 1.823 em oito contando as
divisas municipais — está hoje anotada em
`apps/web/public/terras/globo/js/ui/exportar.js`, junto com o registro de que o
número anterior estava errado.

---

## 7. A arquitetura

### Páginas prontas antes da visita

O portal é **estático**. Não há banco de dados em produção.

A analogia é a do jornal impresso. Um site comum funciona como um restaurante:
cada visitante faz um pedido, e a cozinha prepara o prato na hora — consulta o
banco, monta a página, entrega. O Controle Popular funciona como uma redação
de jornal: as páginas são todas impressas de madrugada, e o que o visitante
recebe é um exemplar já pronto. Ninguém vai à cozinha.

Tecnicamente, isso se chama **geração estática** (*static site generation*, ou
SSG). O comando de construção lê o Postgres **no momento do build** e
transforma tudo em HTML pré-renderizado, que é publicado como arquivo. Uma
visita ao site não toca em banco nenhum.

```
fontes públicas ──ETL (Python)──▶ Postgres ──next build──▶ HTML estático ──▶ Cloudflare Workers
```

A escolha tem duas consequências, e as duas são assumidas. A boa: sem banco em
produção não há custo de banco, nem indisponibilidade por sobrecarga de
consulta. A ruim: o site só muda quando alguém o reconstrói — e é por isso que
existe a rotina descrita adiante.

### A pilha

| Camada | Tecnologia |
|---|---|
| Aplicação web | Next.js 16.2.12, App Router, React 19.2.4 |
| Acesso a dados | Drizzle ORM sobre PostgreSQL |
| Publicação | Cloudflare Workers, via adaptador OpenNext (`@opennextjs/cloudflare`, `^1.20.2`) |
| Coleta | Python 3.12 |
| Esquema do banco | 88 migrations SQL numeradas, em quatro pacotes |
| Testes | 206 no total — 107 da biblioteca TypeScript e 99 do globo 3D |

Três detalhes de configuração explicam decisões que, de fora, pareceriam
arbitrárias:

- **Workers, não Pages.** O Cloudflare Pages roda apenas em ambiente reduzido,
  sem as APIs do Node.js que o acesso ao banco e a geração de ofício em PDF
  exigem.
- **O mesmo código serve dois destinos.** Além do Cloudflare, o projeto pode
  ser exportado como HTML puro para o GitHub Pages. Nesse alvo não existe
  servidor, e as rotas que dependem do pedido do visitante (busca, chat,
  classificados) vivem em arquivos com a extensão `.din.ts` — que o exportador
  simplesmente não enxerga. A alternativa seria apagá-las ou envolver cada uma
  em uma condição de ambiente; as duas fazem o site perder função sem avisar.
  Aqui a ausência fica declarada em um lugar só, em `apps/web/next.config.ts`.
- **Concorrência de build reduzida a 3.** A geração das 354 páginas de bancada
  saturava o banco com a concorrência padrão, e duas páginas morriam por tempo
  esgotado — sem que o build falhasse. Trocar alguns minutos de build por um
  build determinístico é o negócio certo quando a saída vai virar arquivo
  estático.

### O modo de falha que organiza a operação

Sem banco alcançável, a função de conexão devolve nulo, as páginas saem vazias
e **o build termina com sucesso**. Build verde não é sinal de saúde.

O sinal é a **contagem de páginas**. Vinte e uma páginas significa que o banco
não foi lido; o build de 2026-08-12 produziu 3.850.

Sobre isso está construída a rotina de atualização: uma tarefa agendada roda
diariamente a sequência **ETL → build → trava de contagem → deploy**, e
**recusa publicar** se a contagem cair abaixo de mil páginas ou encolher mais
de 20% em relação à publicação anterior. O piso pega o desastre; a queda
relativa pega a erosão — uma tabela que esvaziou derruba centenas de páginas
sem chegar perto de vinte e uma. Uma terceira trava recusa publicar se **todos**
os passos de coleta falharem: um passo que cai é rotina, todos caírem juntos é
problema de ambiente, porque fontes de dados independentes não saem do ar no
mesmo segundo.

---

## 8. Estudo de caso: o Worker que não cabia

Vale contar porque ensina método, e porque o erro cometido no caminho é um
erro que qualquer pessoa cometeria.

### O problema

A plataforma de publicação impõe um teto de tamanho ao programa publicado: 3
MiB, ou 3.072 KiB. O deploy passou a ser recusado — o pacote media **3.294
KiB**. Faltavam 222 KiB.

### O erro que custou três diagnósticos

O teto da Cloudflare é medido **sobre o tamanho comprimido**. As primeiras
investigações mediram o tamanho **bruto** dos arquivos, e por isso apontaram
sistematicamente para o lugar errado.

A diferença não é de escala, é de ordem. Um dos arquivos suspeitos — o mapa de
rotas pré-renderizadas, o `prerender-manifest` — ocupa 1,84 MB brutos e
parecia o culpado óbvio. Comprimido, ocupa 55 KiB. Podá-lo até o limite
teórico do possível economizaria 20 dos 222 KiB necessários.

Medir na unidade errada é como escolher o que tirar da mala olhando o volume
das peças quando a companhia aérea cobra por peso. O travesseiro é o maior
objeto e não resolve nada; a chave inglesa é pequena e resolve.

### A causa real

O empacotador que o Next.js 16 usa por padrão emitia a biblioteca de acesso ao
banco de dados **oito vezes**. Mesmo código, mas com identificadores internos
diferentes em cada cópia — e, portanto, com assinaturas diferentes. Nenhuma
ferramenta de análise acusava duplicação, porque para elas eram oito arquivos
distintos.

### Por que a compressão não resolveu sozinha

Aqui está o detalhe que faz o problema doer, e que é a parte realmente
instrutiva.

A compressão funciona por retrovisão: ao encontrar um trecho que já apareceu
antes, ela grava "repita o que apareceu tantos caracteres atrás" em vez de
gravar o trecho de novo. Mas **a janela de retrovisão do algoritmo é de 32
KB**. Ela é como um copista com memória curta: consegue dizer "repita o
parágrafo de meia página atrás", mas não consegue perceber que o capítulo que
está copiando agora é idêntico a um que copiou trezentas páginas antes.

As oito cópias estavam separadas por cerca de 335 KB umas das outras — dez
vezes o alcance da janela. Para o compressor, eram oito coisas distintas, e o
arquivo final pagou pelas oito.

| Empacotador | Cópias | Bruto | Comprimido |
|---|---:|---:|---:|
| Turbopack (padrão) | 8 | 2,51 MB | 626 KiB |
| webpack | 2 | 0,43 MB | 127 KiB |

### A correção, e o resultado medido

Trocar o empacotador — acrescentando a opção `--webpack` ao comando de build —
resolveu o problema, porque o webpack promove o código compartilhado a um
trecho único em vez de replicá-lo. Medição de ponta a ponta:

| | Bruto | Comprimido | Resultado |
|---|---:|---:|---|
| Antes | 20.649 KiB | 3.294 KiB | reprovado (teto 3.072) |
| Depois | 17.604 KiB | 2.506 KiB | aprovado, com 566 KiB de folga |

### O que o caso deixou para trás

Três coisas, e todas são de método:

1. **A medição inteira ficou escrita no arquivo de configuração**, em
   `apps/web/package.json`, como um comentário ao lado do comando. O motivo é
   explícito: quem apagar a opção no futuro reintroduzirá 788 KiB sem nenhum
   aviso — o build passa, e é o deploy que morre.
2. **Os caminhos descartados ficaram registrados**, com o número que os
   descartou, para que ninguém os tente de novo: podar o mapa de rotas (20 KiB
   dos 222), dividir em vários Workers (a divisão é por camada, não por rota, e
   ambos embutiriam o mapa inteiro), remover as bibliotecas de PDF e DOCX (são
   carregadas sob demanda e removê-las quebra o build).
3. **Um efeito colateral bom**: o webpack executa uma verificação de tipos que
   o empacotador anterior pulava, e que já detectou dois defeitos reais.

---

## 9. As garantias que o código impõe a si mesmo

A regra de procedência descrita na seção 1 só vale alguma coisa se estiver
implementada. Estas são as implementações mais demonstrativas.

### Dado inventado não é publicado nem exportado

O registro de camadas do globo tem uma marca para camada de demonstração, e a
exportação verifica essa marca: feições assim ficam de fora do arquivo, e **o
arquivo informa quantas ficaram** — omitir em silêncio seria a outra metade do
mesmo erro.

A defesa foi testada e, ainda assim, considerada insuficiente. Em 12/08 a
única camada fictícia que existia — três polígonos desenhados à mão para testar
a tela — **foi removida do registro**. O raciocínio está no comentário que
substituiu a camada: os selos funcionavam, mas **nenhum deles viaja em uma
captura de tela**, e o polígono era desenhado no globo com a mesma aparência
das camadas do INCRA e da SPU. A maneira de um dado inventado nunca ser lido
como oficial é ele não estar publicado.

A maquinaria de defesa permaneceu, com os seus testes. O que saiu foi a
camada, não a proteção contra ela.

A mesma disciplina vale para o assistente de conversa das três frentes
(`apps/web/lib/chat-comum.ts`): o modelo responde apenas com o contexto
recebido, e o contexto sai de consulta ao banco. Nenhum número do portal é
escrito por modelo de linguagem.

### Exportação não leva dado pessoal

Duas barreiras em série, em `apps/web/public/terras/globo/js/ui/exportar.js`:

1. **Lista branca de colunas.** As colunas exportadas estão enumeradas
   explicitamente. Campo novo que apareça na fonte não vira coluna sem que
   alguém decida.
2. **Bloqueio por padrão.** Uma expressão de verificação recusa qualquer coluna
   cujo nome comece por padrões proibidos — CPF, CNPJ, nome de proprietário,
   nome de autuado, endereço, logradouro. Se alguém acrescentar uma coluna sem
   pensar, **a exportação para** em vez de gravar dado pessoal em um arquivo
   que sai do computador.

A precaução não é hipotética. A camada de licenciamento ambiental do estado
publica **CPF em claro em cerca de 25% dos registros**, ao lado do nome e da
coordenada exata — medição registrada em `docs/ambiental/F0-discovery.md`. O
coletor trata isso na entrada: grava apenas a raiz de oito dígitos do CNPJ e
classifica o documento pelo dígito verificador, e não pelo comprimento, porque
a fonte corta zeros à esquerda. Quando a própria fonte publica o CNPJ inteiro
sem tarjar, o coletor **mesmo assim** grava só a raiz: publicar o que a fonte
não redigiu seria ser pior que a fonte.

### Número na tela vem junto da margem de erro

Já descrito na seção 6. O ponto de arquitetura é que a taxa de erro é uma
**constante única de código**, e não texto escrito em cada página. Sendo única,
a tela da cidade e o painel da frente não podem divergir. E o cartão da frente
na página inicial cita a taxa também: anunciá-la sem a margem, mesmo na
vitrine, seria cobrar dos outros o que não se faz em casa.

### Truncamento silencioso é tratado como defeito grave

"Truncamento silencioso" é quando um sistema devolve parte dos dados e informa
que devolveu tudo. É o pior tipo de erro para um portal de transparência,
porque produz um número plausível e menor que o verdadeiro, sem nada que
indique o problema.

O projeto o combate em vários pontos:

- No banco: a soma dos contratos é feita com uma operação de agregação em SQL,
  e não com um laço que busca mil linhas por vez. O laço tinha esse modo de
  falha, e o resultado seria uma concentração de mercado inflada, porque o
  denominador teria encolhido (`apps/web/lib/db/queries/betim.ts`).
- Na coleta: o coletor da PBH tem o teto medido da fonte anotado como
  constante, com o comentário de que acima daquele valor a resposta vem
  truncada sem aviso.
- Nos coletores paginados: cada um calcula um sinalizador de "coleta
  possivelmente truncada" e o registra no diagnóstico da execução.
- Na fonte geográfica do estado: a verificação vai no corpo da resposta, nunca
  no código de status, pela razão descrita na seção 3.

O mesmo raciocínio explica um comentário no acesso a dados: quando o projeto
migrou de uma camada intermediária para SQL direto, a função que existia
apenas para contornar o limite de mil linhas — que truncava sem erro — deixou
de ser necessária. "SQL direto não trunca."

### Duas garantias adicionais que valem menção

**Cidade inexistente dá 404, não página inventada.** As rotas por município
declaram que não aceitam parâmetro fora da lista conhecida. A consequência
apareceu na migração para o Cloudflare: sem a configuração correta de cache, o
Worker tinha a lista de páginas mas não tinha de onde ler o HTML — e como não
podia renderizar sob demanda para compensar, devolvia 404. O sintoma era
enganoso (parecia problema de banco), e a explicação inteira ficou registrada
em `apps/web/open-next.config.ts`.

**Cada análise carrega a versão da régua que a gerou.** A coluna
`versao_rubrica` existe para que, se a rubrica mudar, seja possível reanalisar
apenas o que ficou para trás — em vez de reprocessar tudo ou, pior, exibir
lado a lado rótulos produzidos por réguas diferentes.

---

## 10. O que falta

Esta seção é parte do produto, não um apêndice.

### Cobertura desigual entre as cidades

Medido em 2026-08-12. As colunas mostram por que "seis cidades" não significa
"seis cidades igualmente cobertas".

| Cidade | Contratos | Licitações | Atos oficiais | Proposições | Servidores | Obras |
|---|---:|---:|---:|---:|---:|---:|
| Araçuaí | 262 | 318 | 651 | 0 | 1.098 | 0 |
| Belo Horizonte | 6.878 | 5.483 | 3.586 | 3.755 | 114 | 0 |
| Betim | 800 | 686 | 660 | 2.733 | 9.803 | 59 |
| Diamantina | 315 | 645 | 3.148 | 3.668 | 1.970 | 0 |
| Itinga | 0 | 3 | 39 | 573 | 605 | 0 |
| São Paulo | 4.736 | 14.447 | 2.233 | 2.588 | 125.462 | 0 |

Três leituras dessa tabela merecem nota, porque nem toda lacuna tem a mesma
natureza:

- **Itinga sem contratos** é lacuna de acesso, e a via alternativa já está
  identificada: há um pedido ao Tribunal de Contas do Estado redigido, ainda
  não protocolado, à espera de uma decisão sobre proteção de dados pessoais.
- **Belo Horizonte com 114 servidores** não é lacuna de coleta: é limite
  estrutural da fonte. O sistema da prefeitura devolve o **número** de vínculos
  por órgão, não os nomes; 114 é quanto vem nominalmente identificado, e a
  folha agregada por órgão entrou inteira. É o máximo que a fonte permite — e
  a auditoria recomenda dizer isso na própria tela, para que não pareça que a
  capital tem 114 funcionários.
- **Obras só em Betim** é bloqueio externo: o SISOP, sistema que cobriria as
  três cidades do Vale do Jequitinhonha de uma vez, está com o certificado de
  segurança incompleto — problema fora do alcance do projeto.

### Frentes com dado ausente

- **Votações nominais do Congresso: zero linhas** no banco que gera o site,
  conferido hoje. A frente anuncia votação nominal entre as suas funções e o
  código da rota registra explicitamente que a tabela está vazia neste banco.
  É a lacuna mais visível entre promessa e entrega, e precisa ser resolvida ou
  a promessa precisa sair do texto.
- **Votações de câmaras municipais: zero linhas**, pela mesma medição.
- **Diário oficial: não coletado em nenhuma cidade.** É o mais urgente em
  Araçuaí e Itinga, cujas câmaras dependem dele para ter legislação completa. O
  bloqueio não é técnico: falta decidir o corte de proteção de dados pessoais,
  porque o diário publica nomeações, exonerações e CPF.
- **Judiciário: a projeção de vacância é parcial.** Apenas 69 dos 252
  magistrados têm data de nascimento levantada, e sem ela a data de
  aposentadoria compulsória não pode ser calculada. É curadoria manual, e ela
  não terminou. Das 251 cadeiras previstas em lei, 93 estão individuadas e 57
  têm ocupação registrada.
- **Análise de vício legislativo**: 29 análises no total. É calibração.
- **Cobertura da análise garantista**: entre 3,2% e 12,2%, conforme o acervo.
  Ampliá-la é trabalho de execução, não de pesquisa — o método está validado.

### Bloqueios que não dependem de esforço

- **Cota gratuita do BigQuery esgotada** — os dados de sócios de empresas estão
  parados em Belo Horizonte e São Paulo. Enquanto isso, "nenhum grupo econômico
  encontrado" nessas duas cidades não é resultado, é ausência de insumo, e não
  deve ser lido como conclusão. A cota reinicia mensalmente; a decisão de não
  habilitar cobrança é deliberada.
- **SIGIBAR**, o cadastro de barragens mais completo que os dois já usados,
  está atrás de um mecanismo de verificação anti-robô. O projeto tem regra de
  não contorná-lo. A fonte fica documentada, e entra se a SEMAD publicar sem a
  barreira.
- **DataJud (CNJ)** não permite busca por nome, apenas por número de processo.
  É limite estrutural da fonte.
- **A base de terras devolutas efetivamente reconhecidas não é publicada** pelo
  INCRA. Essa é a lacuna central da frente fundiária: sem ela não há gabarito
  contra o qual medir a precisão do método. O projeto irmão registra um pedido
  de acesso à informação enviado ao INCRA em 29/07/2026.

### Frentes em aberto

- Estender a frente fundiária às outras três cidades do portal.
- Reprocessar as camadas com a correção da faixa de estradas já implementada.
- **Fotos.** Vereadores estão completos em cinco cidades; Diamantina tem 1 de
  13, porque o sistema daquela câmara não publica a imagem. Magistrados: 0 de
  252 — não há endpoint, é curadoria manual. Trabalho represado, não defeito.
- **Serviços do dia a dia.** Notícias e coleta de lixo existem apenas em Betim
  (7 e 230 registros). Plantão de farmácias está vazio nas seis cidades: a
  fonte nunca foi confirmada em nenhuma delas, então é trabalho de descoberta,
  e não réplica de coleta já feita. Contatos úteis, por outro lado, já cobrem
  as seis (51 registros no total, com a fonte citada em cada um).

---

## Licença

O código é publicado sob AGPL-3.0-or-later. O dado é público; o código que o
organiza também.
