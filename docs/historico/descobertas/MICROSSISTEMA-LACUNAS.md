# Lacunas do microssistema para os sete temas propostos

> **Tipo:** HISTORICO
> **Domínio:** global
> **Última medição:** 2026-08-22
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [README.md](../../README.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** historico, documentacao

## Sumário

- [Propósito](#propósito)
- [a) O que o acervo semente já cobre, tema a tema](#a-o-que-o-acervo-semente-já-cobre-tema-a-tema)
- [b) O que falta e que existe — norma a norma](#b-o-que-falta-e-que-existe-norma-a-norma)
- [Norma citada por outra pesquisa preliminar, mas não confirmada — separada](#norma-citada-por-outra-pesquisa-preliminar-mas-não-confirmada-separada)
- [c) Precedentes que faltam](#c-precedentes-que-faltam)
- [d) O tamanho honesto da lacuna, tema a tema](#d-o-tamanho-honesto-da-lacuna-tema-a-tema)

## Propósito

Pesquisa encomendada para avaliar se o acervo semente `etl/betim/dados-seed/direito-critico-popular.html` — hoje 30 instrumentos normativos ("LAWS") e 15 precedentes ("JURIS"), todos curados para **barragens e atingidos** — sustenta um filtro por tema para: serras, rios, flora e fauna, quilombola...

Pesquisa encomendada para avaliar se o acervo semente `etl/betim/dados-seed/direito-critico-popular.html`
— hoje 30 instrumentos normativos ("LAWS") e 15 precedentes ("JURIS"), todos
curados para **barragens e atingidos** — sustenta um filtro por tema para:
serras, rios, flora e fauna, quilombolas, indígenas, povos e comunidades
tradicionais, e normas de direitos humanos.

Método: li o HTML inteiro (arrays `LAWS` e `JURIS` no `<script>`, linhas
1024–1238), listei cada um dos 30+15 itens e testei sua aderência a cada tema.
Para o que falta, busquei a norma central, confirmei existência e conteúdo por
busca (o fetch direto ao domínio `planalto.gov.br` fica bloqueado neste
ambiente — toda tentativa de abrir o link devolveu `ECONNRESET`; a confirmação
abaixo vem de busca na web, que retornou o texto/ementa de cada norma a partir
do próprio planalto.gov.br ou de espelhos oficiais como Câmara dos Deputados e
LexML). Isso está registrado tema a tema — não afirmo ter "clicado" no link.

---

## a) O que o acervo semente já cobre, tema a tema

Os 30 instrumentos (`LAWS`, ids 1–30) e 15 precedentes (`JURIS`, ids 1–15) do
acervo, por tema:

### 1. Proteção de serras
**Nenhum instrumento e nenhum precedente do acervo trata do tema.** A Política
Nacional de Recursos Hídricos (id 12) e a Lei de Segurança de Barragens
(id 7) tocam terreno e bacia hidrográfica, mas nenhuma delas protege serra,
montanha ou encosta como tal. Não há Código Florestal, não há SNUC, não há
nada sobre APP de topo de morro.

### 2. Proteção de rios
Cobertura indireta, não uma proteção de rio em si:
- **Lei nº 9.433/1997 – Política Nacional de Recursos Hídricos** (id 12): trata
  a água como bem público e a bacia hidrográfica como unidade de gestão — é
  sobre *uso* da água, não sobre proteção do curso d'água ou de sua vegetação
  ciliar.
- Precedentes que mencionam rios o fazem como **cenário do dano** (Rio Doce,
  Rio Paraopeba), não como objeto de norma protetiva: REsp 2.200.069/MT (id 10
  em JURIS) cita "biomas patrimônio nacional (art. 225, §4º CF)" en passant.
- Nenhuma norma trata de Área de Preservação Permanente de margem de rio.

### 3. Proteção de espécies da flora e da fauna
**Nenhum instrumento e nenhum precedente do acervo trata do tema.** Não há
Código Florestal, não há lei de fauna, não há Mata Atlântica, não há SNUC.

### 4. Proteção quilombola
- **Estatuto da Igualdade Racial – Lei nº 12.288/2010** (id 14): tem um
  dispositivo específico (art. 32, citado no acervo) sobre proteção a bens
  culturais de comunidades remanescentes de quilombos, mas é uma lei geral
  de igualdade racial, não uma lei fundiária/territorial quilombola.
- **Precedente id 28 (JURIS)** — "Condenações CIDH – Brasil" — agrupa em um
  único item o **Caso Alcântara x Brasil** (remoção forçada de comunidade
  quilombola sem consulta prévia), mas o agrupamento é genérico e não
  desenvolve a tese territorial quilombola.
- O art. 68 do ADCT é citado apenas de passagem no texto de relevância da
  Constituição Federal (id 1), não como um item autônomo.
- **Falta o instrumento central**: não há Decreto nº 4.887/2003, que é a
  norma que regulamenta identificação, reconhecimento, delimitação,
  demarcação e titulação de terras quilombolas.

### 5. Proteção indígena
Este é o tema mais bem coberto dos cinco "novos" fora de DH:
- **Constituição Federal, art. 231** (dentro do id 1): direitos originários
  sobre terras tradicionalmente ocupadas.
- **Estatuto do Índio – Lei nº 6.001/1973** (id 13): terras inalienáveis e
  imprescritíveis; menciona a exigência de consulta prévia da Convenção 169
  da OIT no texto de relevância, mas **a Convenção 169 em si não está no
  acervo como instrumento próprio**.
- **ADPF 709** (precedente id 4): dever estatal de proteção ativa a povos
  indígenas.
- **Caso Lhaka Honhat x Argentina** (id 30 em LAWS e id 11 em JURIS,
  duplicado): território indígena e meio ambiente na Corte IDH — mas é um
  caso contra a Argentina, não jurisprudência brasileira.
- Falta o núcleo pós-1988: Convenção 169 da OIT (ratificada), Declaração da
  ONU sobre Direitos dos Povos Indígenas, e a jurisprudência brasileira sobre
  demarcação e marco temporal (STF, Tema 1031).

### 6. Povos e comunidades tradicionais
- **PNAB — Política Nacional dos Atingidos por Barragens** (id 9): define
  "atingido" de forma ampla, citando "populações indígenas e quilombolas" e
  ribeirinhos, mas como categoria vinculada ao dano de barragem, não como
  proteção de comunidade tradicional enquanto tal.
- **Declaração da ONU sobre Direitos dos Camponeses** (id 19): cobre
  camponeses, pescadores e trabalhadores rurais — o item mais próximo do
  tema no acervo, mas é uma declaração de 2018 sem força vinculante direta
  no direito interno e não é o instrumento brasileiro de referência.
- **Falta o instrumento central do tema**: não há Decreto nº 6.040/2007
  (Política Nacional de Desenvolvimento Sustentável dos Povos e Comunidades
  Tradicionais — PNPCT), que é a norma que **define** juridicamente quem são
  "povos e comunidades tradicionais" no Brasil.

### 7. Normas nacionais e internacionais de direitos humanos
**De longe o tema mais coberto** — é o eixo estruturante do acervo semente:
- Nacionais: Constituição Federal (id 1), CNDH sobre Brumadinho (id 24) e
  sobre empresas e DH (id 25), PNDH-4 (id 26).
- Internacionais: Declaração Universal dos Direitos Humanos (id 29), PIDESC
  (id 27), Princípios de Ruggie/ONU sobre Empresas e DH (id 18), OC-23/17 —
  meio ambiente como DH autônomo (id 21), OC-32/23 — clima e DH (id 22),
  Marco de Sendai (id 20), Relatório do Relator Especial da ONU sobre
  atingidos por barragens (id 23), casos paradigmáticos na Corte IDH
  (id 28: Alcântara, Escher, Gabriel Sales Pimenta).
- Precedentes: 5 dos 15 (ids 11–15) são da Corte IDH ou ONU — Lhaka Honhat,
  Escher, OC-23/17, OC-32/23, OG nº 15 do CDESC (água como DH).
- **O que falta mesmo aqui**: a Convenção Americana sobre Direitos Humanos
  (Pacto de São José) não está listada como instrumento próprio — é
  pressuposta pelos casos da Corte IDH, mas nunca citada como norma
  autônoma.

---

## b) O que falta e que existe — norma a norma

Para cada norma abaixo: nome oficial, o que protege, link ao texto oficial, e
por que entraria no filtro.

⚠️ **Sobre os links**: não consegui abrir nenhum `planalto.gov.br` diretamente
neste ambiente (todas as tentativas de fetch resultaram em `ECONNRESET` —
falha de conexão, não confirmação de link quebrado). Toda norma abaixo teve
sua existência, número e teor confirmados por busca na web, que retornou
trechos do próprio planalto.gov.br ou de espelhos oficiais (Câmara dos
Deputados, LexML, STF, Senado). Os links são os endereços padrão do Planalto
para esse tipo de decreto/lei — confira você mesmo ao aplicar, já que não
houve confirmação por acesso direto.

### Serras e vegetação de encosta

**Lei nº 12.651/2012 — Código Florestal**
https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12651.htm
Protege vegetação nativa e institui Áreas de Preservação Permanente (APP),
inclusive **topo de morros, montes, montanhas e serras** com altura mínima de
100m e inclinação média maior que 25° (art. 4º, IX) e áreas acima de 1.800m de
altitude (art. 4º, X), além das APPs de margem de rio (ver abaixo). É a norma
central e única capaz de sustentar sozinha um filtro de "proteção de serras" —
sem ela, o tema fica vazio.

### Rios e faixas ciliares

**Lei nº 12.651/2012 — Código Florestal, art. 4º, I**
(mesmo link acima) — define APP de margem de qualquer curso d'água natural
perene ou intermitente: 100m em zonas rurais (30 a 500m conforme a largura do
rio), 50m para corpos d'água até 20 hectares. É a norma que faltava para dar
substância jurídica a "proteção de rios" além do já presente uso de recursos
hídricos (Lei 9.433/1997).

**Lei nº 9.433/1997 já está no acervo (id 12)** — mantém-se como pano de
fundo do tema, mas sozinha não cobre proteção de curso d'água/faixa ciliar.

### Flora e fauna

**Lei nº 5.197/1967 — Lei de Proteção à Fauna (Código de Caça)**
https://www.planalto.gov.br/ccivil_03/leis/l5197.htm
Declara os animais silvestres de qualquer espécie propriedade do Estado,
proibindo sua utilização, perseguição, destruição, caça ou apanha sem
autorização. Criou o Conselho Nacional de Proteção à Fauna. É a norma
histórica de referência para fauna silvestre — parcialmente superada em
matéria penal pela Lei 9.605/1998, mas ainda vigente e citada como marco.

**Lei nº 9.605/1998 — Lei de Crimes Ambientais**
https://www.planalto.gov.br/ccivil_03/leis/l9605.htm
Tipifica como crime matar, perseguir, caçar, apanhar ou utilizar espécimes da
fauna silvestre sem autorização (art. 29) e crimes contra a flora. É a norma
penal que dá dentes à proteção de fauna e flora — sem ela o tema fica só no
campo administrativo.

**Lei nº 9.985/2000 — Sistema Nacional de Unidades de Conservação (SNUC)**
https://www.planalto.gov.br/ccivil_03/leis/l9985.htm
Regulamenta o art. 225, §1º, I, II, III e VII da CF. Estabelece critérios para
criação, implantação e gestão de unidades de conservação (parques,
reservas, estações ecológicas), o principal instrumento de proteção de
habitat de flora e fauna no direito brasileiro.

**Lei nº 11.428/2006 — Lei da Mata Atlântica**
https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11428.htm
Dispõe sobre uso e proteção da vegetação nativa do Bioma Mata Atlântica
(inclusive restinga, manguezal, campos de altitude). Entra se o acervo
precisar tratar de barragens/empreendimentos dentro do bioma Mata Atlântica —
tema relevante para Minas Gerais e Betim especificamente.

**Convenção sobre Diversidade Biológica — Decreto nº 2.519/1998**
https://www.planalto.gov.br/ccivil_03/decreto/d2519.htm
Promulga a Convenção assinada no Rio em 1992: conservação da diversidade
biológica, uso sustentável de seus componentes, repartição justa dos
benefícios de recursos genéticos. Fundamenta obrigação internacional de
proteção de espécies.

**Protocolo de Nagoia — Decreto nº 11.865/2023**
http://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/decreto/d11865.htm
Trata do acesso a recursos genéticos e repartição justa e equitativa dos
benefícios de sua utilização, incluindo conhecimento tradicional associado —
ratificado pelo Brasil em 2021, promulgado em 2023. Relevante quando o dano
de flora/fauna se conecta a conhecimento tradicional de povos indígenas ou
comunidades tradicionais (bioprospecção, patrimônio genético).
⚠️ Nota de correção: eu tinha inicialmente identificado um decreto errado
(nº 10.201/2020, que trata de outra matéria — acordos da AGU). O decreto
correto de promulgação do Protocolo de Nagoia é o 11.865/2023.

### Proteção quilombola

**Decreto nº 4.887/2003**
http://www.planalto.gov.br/ccivil_03/decreto/2003/d4887.htm
Regulamenta o procedimento de identificação, reconhecimento, delimitação,
demarcação e titulação das terras ocupadas por remanescentes das comunidades
dos quilombos, nos termos do art. 68 do ADCT. Considera quilombolas os
grupos étnico-raciais por autoatribuição, com trajetória histórica própria e
relação territorial específica. Constitucionalidade confirmada pelo STF em
ADI (ver seção c). É **a** norma central do tema — sem ela não há filtro
quilombola de verdade, só a menção lateral do Estatuto da Igualdade Racial.

### Proteção indígena

**Convenção nº 169 da OIT — promulgada pelo Decreto nº 5.051/2004**
https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/decreto/d5051.htm
(atualmente em vigor consolidada pelo Decreto nº 10.088/2019, que reuniu
diversos atos internacionais de direitos humanos — verificar qual decreto o
site quer citar como referência primária). Define povos indígenas e tribais e
estabelece a obrigação de consulta prévia, livre e informada antes de
qualquer medida legislativa ou administrativa que os afete diretamente. É a
norma internacional mais citada em disputas de barragem/mineração em
território indígena — e hoje só aparece **mencionada dentro do texto de
relevância** do Estatuto do Índio (id 13), nunca como instrumento autônomo.

**Declaração das Nações Unidas sobre os Direitos dos Povos Indígenas (2007)**
https://www.un.org/esa/socdev/unpfii/documents/DRIPS_pt.pdf
Adotada pela Assembleia Geral da ONU em 13/09/2007, 46 artigos, reconhece
autodeterminação, território, cultura e consentimento livre, prévio e
informado dos povos indígenas. Sem força de tratado vinculante, mas é
referência normativa consolidada internacionalmente — parâmetro interpretativo
citado pela Corte IDH e por tribunais nacionais.

**Lei nº 6.001/1973 já está no acervo (id 13)** — mantém-se, mas hoje é lei
defasada: trata os povos indígenas sob paradigma de "integração" incompatível
com a Constituição de 1988. Não há hoje um "Estatuto dos Povos Indígenas"
substituto em vigor — o PL 2.057/1991 ("Estatuto dos Povos Indígenas")
tramita há décadas sem aprovação. **Isto precisa ficar dito com clareza no
site**: a proteção pós-1988 é feita por CF art. 231/232, pela Convenção 169
e por jurisprudência do STF, não por uma lei ordinária substituta.

### Povos e comunidades tradicionais

**Decreto nº 6.040/2007 — Política Nacional de Desenvolvimento Sustentável
dos Povos e Comunidades Tradicionais (PNPCT)**
https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2007/decreto/d6040.htm
Define juridicamente "povos e comunidades tradicionais" e "territórios
tradicionais", cria a Comissão Nacional (CNPCT) para coordenar a política.
É **o** instrumento que dá ao tema uma definição operacional — sem ele, o
acervo só tem a Declaração da ONU sobre Camponeses (id 19), que é
internacional, não vinculante, e não usa a terminologia "povos e comunidades
tradicionais" consagrada no Brasil (ribeirinhos, pescadores artesanais,
extrativistas, caiçaras, geraizeiros, fundo de pasto, etc.).

### Normas de direitos humanos (o que falta mesmo neste tema já forte)

**Convenção Americana sobre Direitos Humanos (Pacto de São José da Costa
Rica) — promulgada pelo Decreto nº 678/1992**
https://www.planalto.gov.br/ccivil_03/decreto/d0678.htm
Trata dos direitos civis e políticos protegidos no sistema interamericano e é
a base normativa de todos os casos da Corte IDH já citados no acervo (Lhaka
Honhat, Escher, OC-23/17, OC-32/23) — mas a Convenção em si nunca é citada
como instrumento autônomo, só pressuposta. Entraria para fechar essa lacuna
lógica: hoje o acervo cita as decisões da Corte sem citar o tratado que dá à
Corte sua competência.

---

## Norma citada por outra pesquisa preliminar, mas não confirmada — separada

Nenhuma. Todas as normas listadas na seção (b) foram confirmadas por busca
com retorno de conteúdo/ementa do próprio texto oficial ou de espelho oficial
(Câmara dos Deputados, LexML, STF/Senado). A única correção que precisei
fazer foi a do decreto do Protocolo de Nagoia (ver nota acima) — mantive o
erro visível em vez de simplesmente trocar o número, porque é exatamente o
tipo de deslize que a regra "não invente número de lei" existe para pegar.

---

## c) Precedentes que faltam

### Corte IDH — povos indígenas e tribais (jurisprudência extensa, quase nada
### disso está no acervo)

O acervo tem só um caso de território indígena na Corte IDH: **Lhaka Honhat
x Argentina (2020)**, duplicado como lei (id 30) e como precedente (id 11).
Faltam os casos fundadores da linha jurisprudencial:

- **Comunidade Mayagna (Sumo) Awas Tingni x Nicarágua (2001)** — caso
  fundador: primeira vez que a Corte reconheceu propriedade comunal indígena
  sobre terra ancestral como direito protegido pela Convenção Americana,
  mesmo sem título formal.
- **Comunidade Indígena Yakye Axa x Paraguai (2005)** — parâmetros sobre
  direito territorial de povos que ocuparam secularmente a terra, e sobre
  reparação quando a devolução física da terra não é imediatamente possível.
- **Povo Saramaka x Suriname (2007)** — estende a proteção territorial da
  Corte a **povos tribais** (não apenas indígenas em sentido estrito) —
  precedente diretamente aplicável a comunidades quilombolas, que no Brasil
  são também tratadas como povos tribais para fins de direito internacional.
- **Povo Indígena Kichwa de Sarayaku x Equador (2012)** — consolida a
  exigência de consulta prévia, livre e informada antes de empreendimentos
  (ali, exploração petrolífera) em território indígena — precedente central
  para licenciamento de barragens e mineração.

Não tenho os links/citações oficiais completas desses quatro casos
verificados individualmente nesta pesquisa (confirmei apenas que existem e
seu conteúdo geral via busca) — antes de entrarem no site, cada um precisa da
mesma checagem de link+ementa que os 15 precedentes atuais já têm.

### STF — demarcação e marco temporal

- **RE 1.017.365/SC (Tema 1.031) — Repercussão Geral, STF Plenário, 2023**:
  fixou tese contrária ao marco temporal (rejeitou a ideia de que povos
  indígenas só podem reivindicar terras ocupadas ou disputadas em
  05/10/1988).
- **ADI/ADC sobre a Lei nº 14.701/2023** ("Lei do Marco Temporal", editada
  pelo Congresso em reação ao Tema 1.031): o STF, em julgamento concluído em
  dezembro de 2025/março de 2026 (publicação do acórdão integral em
  18/03/2026, segundo notícia do próprio STF), declarou inconstitucional o
  trecho da lei que reinstitui o marco temporal, por maioria, seguindo o
  voto do relator Min. Gilmar Mendes.
  Esta é uma decisão recente e ainda "quente" — antes de citar número exato
  de processo e data final de trânsito em julgado no site, seria bom
  confirmar diretamente no portal do STF (não consegui abrir
  portal.stf.jus.br neste ambiente, só via busca).

### STJ — APP e fauna

- **Súmula 613 do STJ** ("A teoria do fato consumado não tem aplicação em
  matéria ambiental"), aprovada pela Primeira Seção em 05/09/2018. Aplicação
  direta ao tema "proteção de rios/serras": impede que ocupação antiga de
  Área de Preservação Permanente vire "direito adquirido" contra remoção.
  Confirmada por busca.
- Não encontrei, dentro do tempo desta pesquisa, um precedente específico do
  STJ sobre fauna com número de recurso e ementa que eu pudesse confirmar com
  segurança (a busca trouxe menções gerais a jurisprudência sobre caça
  ilegal e ao art. 29 da Lei 9.605/98, mas não um acórdão citável). Isso deve
  ficar como pendência de pesquisa futura, não como precedente do site.

---

## d) O tamanho honesto da lacuna, tema a tema

Esta é a resposta que decide se o filtro nasce com sete temas ou com três.

| Tema | O que o acervo semente sustenta hoje | Veredito |
|---|---|---|
| **1. Proteção de serras** | Nada. Zero instrumentos, zero precedentes. | **Nasceria vazio.** Não filtrar por este tema até adicionar ao menos o Código Florestal (art. 4º, IX/X) e, idealmente, um precedente sobre APP de topo de morro. |
| **2. Proteção de rios** | Um instrumento tangencial (Lei 9.433/97, sobre uso da água, não proteção do curso d'água) e menções de rios como cenário de dano em 1–2 precedentes. | **Nasceria quase vazio.** Precisa do Código Florestal (art. 4º, I — APP de margem de rio) no mínimo antes de virar filtro útil; hoje é decoração, não proteção. |
| **3. Flora e fauna** | Nada. Zero instrumentos, zero precedentes. | **Nasceria vazio.** Precisa de pelo menos Lei 5.197/1967 + Lei 9.605/1998 (crimes ambientais) + SNUC antes de ter qualquer substância. |
| **4. Proteção quilombola** | Um dispositivo lateral (Estatuto da Igualdade Racial, art. 32) e um precedente genérico agrupado (Caso Alcântara, dentro de um item que mistura três casos diferentes). | **Nasceria simbólico, não útil.** Sem o Decreto 4.887/2003 como instrumento próprio, e sem desmembrar o Caso Alcântara do agrupamento id 28, o filtro devolve 1–2 resultados fracos. |
| **5. Proteção indígena** | CF art. 231, Estatuto do Índio (defasado), ADPF 709, Caso Lhaka Honhat (contra a Argentina, não o Brasil). | **Nasceria com conteúdo real, mas capenga.** É o mais forte dos cinco temas "novos" — mas falta a Convenção 169 da OIT como instrumento próprio (hoje só citada de passagem) e falta jurisprudência brasileira de demarcação/marco temporal. Dá para lançar com ressalva editorial clara, mas fica estranho um filtro "indígena" sem a Convenção 169 nem o Tema 1.031 do STF. |
| **6. Povos e comunidades tradicionais** | PNAB (id 9, mas é sobre "atingido", não sobre "povo tradicional") e a Declaração da ONU sobre Camponeses (id 19, internacional, não vinculante). | **Nasceria vazio de instrumento próprio.** Sem o Decreto 6.040/2007 (PNPCT), que é a única norma brasileira que *define* juridicamente quem é "povo e comunidade tradicional", o filtro fica sem chão — usaria uma definição que a legislação brasileira nem reconhece pelo nome. |
| **7. Normas de DH nacionais e internacionais** | Muito forte: 6+ instrumentos nacionais e internacionais, 5 dos 15 precedentes são Corte IDH/ONU. | **Nasce pronto hoje.** É o único dos sete que já tem massa crítica suficiente no acervo semente sem qualquer adição. A única lacuna (Convenção Americana de DH como instrumento autônomo) é cosmética, não estrutural. |

### Conclusão prática

Com o acervo semente **como está hoje**, só o tema **7 (normas de DH)**
nasce pronto. O tema **5 (indígena)** nasce com conteúdo defensável se vier
acompanhado de aviso de cobertura parcial (nos moldes do que este projeto já
faz com a legislação ambiental) — mas ainda assim capenga sem a Convenção 169
e sem jurisprudência de demarcação. Os outros cinco temas (serras, rios,
flora/fauna, quilombola, povos e comunidades tradicionais) **nasceriam
vazios ou quase vazios** se lançados agora: cada um precisa de pelo menos um
instrumento central novo (respectivamente: Código Florestal art. 4º IX/X;
Código Florestal art. 4º I; Lei 5.197/67 + Lei 9.605/98 + SNUC; Decreto
4.887/2003; Decreto 6.040/2007) antes de sustentar um filtro que não empurre
o usuário para uma tela vazia com a etiqueta enganosa de "tema coberto".

Recomendação honesta: lançar o filtro por tema com **três temas** — DH
(pronto), Barragens/Atingidos (o acervo original, ainda o mais forte) e,
com aviso de cobertura parcial, Indígena — e tratar os outros quatro como
trabalho de curadoria pendente, exatamente como o projeto já fez ao declarar
31,2% de cobertura temática na legislação ambiental em vez de fingir
cobertura total.
