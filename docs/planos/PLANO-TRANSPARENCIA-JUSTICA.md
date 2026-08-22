# Plano — transparência de MP, DP e Judiciário além do dinheiro

> **Aberto em 2026-08-22.** A pergunta que originou: *"além da parte financeira
> de MP, DP e TJ, o que podemos fazer sobre transparência?"*
>
> **Estado em 2026-08-22, fim do dia: sondagem FECHADA.** As quatro frentes
> foram medidas contra as fontes reais — 5 agentes, 295 chamadas de ferramenta,
> ~29 endpoints batidos. Todo número abaixo tem origem medida e data. O que
> não foi medido está dito com todas as letras.
>
> 🚨 **CINCO AFIRMAÇÕES NEGATIVAS DESTE PLANO JÁ CAÍRAM, e todas pelo mesmo
> motivo: foram medidas com `curl` contra página montada por JavaScript.**
> Caíram: (1) "não há acervo de inspeção do CNJ" — há 343 relatórios; (2)
> "tempo médio de tramitação não existe em dado aberto" — existe, é `tpbaixm`;
> (3) "não há correição sobre o STF" — há, a Comissão de Ética publica desde
> 2022; (4) "a Ouvidoria da DPMG esconde seus números" — ela foi criada em
> março de 2025 e não tem histórico; (5) **"o CNJ parou de publicar o que
> decidiu"** — publica, na Lista de sessões, até 19/08/2026.
>
> ⚠️ **REGRA QUE SAI DISSO: afirmação negativa sobre fonte só entra neste plano
> depois de verificada em NAVEGADOR.** `curl` vê a casca de SPA e conclui
> ausência; e ausência é a afirmação mais cara de errar, porque vira acusação.
>
> ⚠️ **E um veredito da sondagem já foi DERRUBADO no mesmo dia.** Ela reprovou
> a frente correicional inteira depois de medir as páginas HTML do CNJ (270 KB
> linkando regimento interno). O acervo existia noutra rota: **343 relatórios
> de inspeção sobre 33 órgãos, ~1,8 GB, JSON puro, sem login** (§2, frente 0). Fica registrado
> porque a lição é geral: **medir a página que fala do assunto não mede a
> fonte.**

---

## 0. Como retomar

1. `docs/FONTES.md` — endpoint, armadilha e número medido de cada fonte
2. `AGENTS.md` — a regra editorial e a **regra das cinco coisas**
3. Este arquivo — o que fazer, em que ordem, e por quê

Trabalhar em worktree próprio. `git fetch` antes de descrever ou editar.

⚠️ **O socket do Python é barrado nesta máquina** (`WinError 10013`): `requests`
e `urllib` falham mesmo com a fonte no ar. Sondar e coletar com **`curl`**.

---

## 1. O que já existe, e que este plano NÃO refaz

| Já no ar | O que cobre |
|---|---|
| `/judiciario` — indicações, vagas, tribunais | **Quem ocupa a cadeira**: composição, quinto constitucional, vaga livre |
| Proxy do DataJud (`/api/datajud`) | **Consulta ao vivo** de processo. Não baixa, não guarda, não republica — ver §7 |
| `/ambiental/decisoes-lai` — 753 decisões da CGE-MG | O único corpus de LAI de MG legível em texto |
| Rede de proteção de MG (30 itens curados) | Onde a pessoa encontra Defensoria, MPMG, delegacia especializada |

**A lacuna que dá nome a este plano:** o portal sabe dizer *quem entrou* no
tribunal e *o que diz um processo*. Não sabe dizer **se a instituição está
funcionando** — quanto demora, quanto acumula, o que acontece quando erra, e
quem fica de fora.

---

## 2. As três frentes que valem construir (ordem de execução)

A sondagem mediu quatro frentes e reprovou uma inteira (a disciplinar, §4). O
que sobrou vai na ordem abaixo, que é ordem de **valor por custo**, não de
elegância. A frente 0 chegou depois da sondagem e passou na frente de todas.

### 0ª — Relatórios de inspeção da Corregedoria Nacional ⭐⭐ *achado do dia* ✅ *já coletado*

**É o que a sondagem tinha dado como inexistente.** O acervo não está nas
páginas do CNJ sobre correições — está na biblioteca de documentos do WordPress
(plugin WPFD), que responde **JSON puro, sem login, sem captcha**.

Coletor: `etl/betim/etl/apis/cnj_inspecoes.py`.

| Medido em 22/08/2026 | |
|---|---|
| Categorias de órgão | **33** — os 27 TJs, mais TRFs, TRTs e TJMs |
| Relatórios | **343** — varredura de 2400 a 2950 (551 ids). ⚠️ Os ids **não são contíguos**: Roraima mora sozinho no 2796, a 118 do bloco. A contagem é **piso**. |
| Volume | **~1,8 GB** |
| Série | **2008 → 2026** |
| Só do TJMG | **13 relatórios, 2012 → 2026, 65,6 MB** |

**O relatório do TJMG de 2026 já foi dissecado** (`cnj-inspecao-tjmg-2026.json`):

- **1.388 páginas, 2,9 milhões de caracteres de texto real** — não é
  digitalizado, é texto extraível
- Processo CNJ **0000675-79.2026.2.00.0000**, Portaria nº 3 de 02/02/2026,
  assinado em 08/07/2026
- **241 seções** de "Achados e Determinações"/"Recomendações" lidas, contra
  **247 que o sumário lista** (97,6%)
- **140 com conteúdo**, 101 dizendo que não há achado (na tela ficam **123**: 17 seções
  têm rótulo mas nenhum texto legível depois do parse, e publicá-las como achado
  vazio seria afirmar o que não se leu)
- **74 seções de achado com texto substantivo**, distribuídas em **100 unidades
  distintas**
- Granularidade que ninguém publica: **gabinete por gabinete** (36
  desembargadores nomeados) e **vara por vara** (76 varas), mais uma seção
  inteira sobre **unidades prisionais** — que casa direto com a frente CNIEP

**Exemplos do que está escrito lá dentro:** pautas de audiência marcadas para
**2029**; gabinete com 2.151 feitos distribuídos contra 1.470 baixados,
cumprindo **86% da Meta Nacional 1**; na Vara de Execuções Penais de BH,
processos de regime aberto tramitando no fluxo "fechado e semiaberto" e
vice-versa; e, na 1ª Vara de Garantias de BH, pessoa presa que **só é conduzida
à audiência de custódia no dia seguinte**, e que, se obtém liberdade com
monitoramento, **volta ao presídio e só é monitorada no dia posterior**.

⚠️ **Três armadilhas medidas, e a terceira é grave:**

1. **O `token` da URL de download rotaciona.** A URL copiada do navegador
   (`...&token=56ae71a6...`) traz token diferente do que a API devolve minutos
   depois (`...&token=89a9bcdb...`). O campo **`linkdownload` é permalink sem
   token** — conferido, mesmo arquivo, 14.970.417 bytes. **Só ele entra no
   dado.**
2. **Não há rota de listagem de categorias** (`categories.getCategories` = HTTP
   500). O universo se descobre varrendo id, e por isso o dado registra a faixa
   varrida: contagem sem faixa mente por omissão.
3. 🚨 **O CNJ publica CPF de pessoa física dentro do relatório.** Medido: **6
   ocorrências válidas por dígito verificador** no TJMG 2026 — particulares
   (compradores e vendedores de um lote, um delegatário com pendência fiscal),
   na seção de serventias extrajudiciais. O coletor **redige na origem, por
   mod-11 sobre o texto**, e o PDF original **não é espelhado**. Ver §5.

⚠️ **E a capa do processo diz "Segredo de justiça? SIM"**, embora o CNJ sirva o
arquivo publicamente na própria biblioteca. É contradição do órgão, não nossa —
mas por isso o projeto publica **extrato estruturado com link para a origem**, e
não cópia do PDF.

**A trava que evitou erro grave:** no corpo, o cabeçalho de unidade quebra em
várias linhas (às vezes uma palavra por linha). Casar por linha falhava em
silêncio e a seção **herdava a unidade anterior — atribuindo o achado ao
desembargador errado** (as seções 4.6.x saíam com o nome da desembargadora do
4.5). A correção foi usar o **sumário do próprio documento** como índice, e o
extrator **para** se o corpo render menos de 90% das seções que o sumário lista.
É a mesma tática que pegou o pareamento errado no relatório do JUSTA (§3).

### 1ª — Cobertura da Defensoria por comarca ⭐ *a de melhor razão custo/valor*

Três arquivos, nenhum login, nenhum PDF.

| Fonte | Medido |
|---|---|
| `defensoria.mg.def.br/wp-json/api-unidades/search?s=` | 11.481 bytes, **129 unidades (128 comarcas em MG)**, uma chamada só, sem paginação |
| `gerais.defensoria.mg.def.br/localizacao/.../municipio/<uuid>` | 81.758 bytes, **854 municípios**, 297 com `codigoComarcaTjMg` |
| Pesquisa Nacional 2025 (XLSX, aba Comarcas) | 2,66 MB — **298 comarcas em MG, 120 atendidas**, **176 "NÃO" e 2 "PARCIALMENTE"**, com nome e população |
| IPEA 2013 (ZIP 315.063 bytes) | 295 comarcas, **105 com Defensoria** — fecha a série. ⚠️ O CSV é **CP850**, não ISO-8859-1: decodificar errado produz texto ilegível em silêncio |

**Este é o denominador que faltava.** Contra as 298 comarcas, as 120 atendidas
viram **déficit de 59%**. E a série mostra o ritmo: **105 em 2013 → 120 em
2025, 15 comarcas em 12 anos.** No ritmo medido, cobrir as 178 restantes
levaria mais de um século.

⚠️ **As fontes divergem e as duas ficam gravadas:** a DPMG lista **129 unidades**
hoje (128 comarcas mineiras + a sede em Brasília) e a Pesquisa Nacional marca
**120 comarcas como atendidas**. São recortes diferentes — unidade física contra
comarca atendida —, e escolher um e calar seria esconder a diferença.

**Pergunta que passa a responder:** *"Tem Defensoria na minha comarca — e, se
não tem, para onde eu vou e há quanto tempo estou esperando?"* Ninguém responde
isso hoje: a DPMG lista as 128 que tem e nunca diz quantas faltam.

⚠️ **Duas armadilhas medidas:** a planilha só baixa com headers de navegador
(`curl` cru = **HTTP 406**); e os dois endpoints da DPMG foram achados no bundle
JS (`main-B2qpQCFJ.js`), **não são API anunciada** — copiar o dado para o nosso
banco, nunca depender deles em runtime.

### 2ª — Inspeções judiciais em presídios (CNIEP / Geopresídios)

**A única fonte viva e estruturada da sondagem inteira.** JSON puro, sem login,
atualização mensal.

| Rota | Medido |
|---|---|
| `/api/geopresidios/estabelecimentos` | 393.928 bytes — 7.085 no Brasil, **285 em MG** (2º maior do país) |
| `/api/geopresidios/inspecoes` | 2.238.486 bytes — 20.298 inspeções no Brasil, **2.253 em MG** (2.252 realizadas + 1 agendada), de **07/01/2025 a 20/08/2026** |
| `/api/geopresidios/mapa` | 497.453 bytes — lat/long e código IBGE, **insumo pronto para o globo 3D** |

Cada inspeção traz o tema pelos cinco eixos da Res. CNJ 593/2024
(segurança/violência, saúde, habitabilidade, serviços, gerais), data e tribunal.

**Não colide com `/judiciario`:** aquele é *quem senta na cadeira*; este é *o
que o juiz corregedor foi — ou não foi — fiscalizar*.

**O produto mais forte sai do cruzamento 285 × 2.252: quais estabelecimentos de
MG não receberam inspeção nenhuma no período.** Essa pergunta não é respondida
por ninguém hoje, nem pelo próprio CNJ.

⚠️ **Defeito medido que decide o recorte:** o *conteúdo* de cada inspeção — o
relato do que o juiz encontrou — dá **404** em `/relatorio-inspecao/{id}` e
`/respostas-formulario/{id}`. Até decifrar a rota, publica-se **que** houve
inspeção e **sobre qual tema**, nunca o achado. E é **API não documentada**:
bater nela alguns dias seguidos antes de virar coletor de produção.

### 3ª — Congestionamento e acervo do TJMG (Justiça em Números)

ZIP de 4.248.648 bytes, 3 CSVs em ISO-8859-1, separador `;`, arquivo principal
de **1.596 linhas × 1.314 colunas**, série **2009–2025**, TJMG isolável em 17
linhas.

**TJMG em 2025:** taxa de congestionamento `tc` = **0,7087**; **4.556.203
processos pendentes** (`cp`); **1.922 casos novos por magistrado** (`cm`).

Traduzido para o portal: *"o seu processo está atrás de 4,5 milhões"* e *"o TJMG
piorou ou melhorou desde 2009"* — comparável a qualquer outro TJ, sem extrair
número de PDF.

⚠️ **A URL muda a cada atualização** (`...23-jun-2026.zip`): o coletor precisa
raspar a página `base-de-dados/` para achar o link vigente. Meia hora de
trabalho, não um dia.

---

## 3. A parte financeira ganhou fonte nova: JUSTA ✅ *já coletada*

Enquanto a sondagem rodava, o relatório **"Justiça e Orçamento nos Estados
2026"** do [JUSTA](https://www.justa.org.br) foi dissecado e virou dado.
Coletor: `etl/betim/etl/apis/justa_orcamento.py`. Saída:
`etl/betim/dados/justa-orcamento-justica-2026.json` — **21 estados, 0 órfãos**.

**O achado que interessa ao portal:**

| | MG |
|---|---|
| Gasto com instituições de justiça (2024) | **R$ 12,3 bi — 2º do Brasil**, atrás só de SP (R$ 18,6 bi) |
| Fatia do orçamento estadual | **11,5% — 2º do Brasil**, atrás só de RO (12,8%) |

MG gasta **dois terços do que SP gasta** com uma receita muito menor — por isso
é 2º em reais e 2º em proporção ao mesmo tempo. SP, o maior gastador absoluto,
é o **20º em proporção (5,4%)**.

⚠️ **Três ressalvas que vão para a tela, não para comentário de código:**

1. **O dado é do JUSTA, não nosso.** Republicar exige citar a fonte e apontar
   para o relatório original.
2. **Seis estados não entram** (GO, MA, MS, PI, RR, SC) porque não forneceram
   dados — e isso bate exatamente com o que o próprio relatório declara. A soma
   dos 21 extraídos dá **R$ 87,7 bi**; o resumo executivo cita **R$ 93,2 bi**.
   A diferença não foi investigada. **Não citar um número como se fosse o
   outro.**
3. **No DF, TJ e MP são financiados pela União** — só a Defensoria entra, e por
   isso o DF aparece com 0,8%. Não é eficiência, é recorte.

### A trava que salvou a tabela

O PDF é **feito no Canva**: a ordem de leitura do texto não acompanha o desenho.
A primeira regra de pareamento — *"a sigla mais próxima"* — **errou**, e errou
de forma indetectável: casou RJ com 6,8% quando o certo é 11,0%. Nada no dado
denunciaria; 6,8% é um percentual perfeitamente plausível.

Quem pegou foi a **conferência contra a página 7**, que renderiza o top-5 por
conta própria. O script **para** se divergir, antes de gravar. A regra certa é
por **coluna** (mesmo *x*, sigla imediatamente acima), porque num gráfico de
coluna o valor de um estado fica mais perto da sigla do **vizinho**.

**Sem essa conferência, o arquivo teria sido gravado com aparência impecável e
cinco estados trocados.** É o padrão a repetir em todo PDF de layout: extrair
por coordenada **e** conferir contra um recorte independente do próprio
documento.

---

## 4. O que a sondagem REPROVOU, com o motivo medido

Isto não é lista de pendência — é decisão tomada. Não revisitar sem fato novo.

### Todos os painéis, sem exceção

| Painel | Corpo medido |
|---|---|
| MPM Pessoal | 977 bytes — 100% `<iframe>` do Power BI |
| `paineis.cnj.jus.br` | 502 intermitente; quando responde, 6.190 bytes de shell QlikView |
| `paineisanalytics.cnj.jus.br` | 1.375 bytes de bootstrap; dado por **WebSocket QIX** |
| SISTAC / audiências de custódia | 3.428 bytes, **0 registros** |
| Qlik do SIC do TJMG | 3.830 bytes |
| Tableau de correições do MPMG | 1.340 bytes, atrás de rota de hash |

**Nove endpoints, zero byte de dado tabular.** Raspar Qlik Sense por WebSocket
custa mais manutenção do que todo o resto deste plano junto.

### Domínios que não existem

`dadosabertos.cnj.jus.br` — **NXDOMAIN confirmado em quatro nomes**
(`dadosabertos`, `dados`, `opendata`, `estatisticas`). Não é "tentar depois": é
endereço inexistente.

### Metas Nacionais e demais PDFs anuais

Só existe PDF (relatório 2025 = 1.937.554 bytes), um por ano, com layout que
muda entre republicações — os próprios nomes trazem `v2`/`v3`, sinal de
**retificação silenciosa**. É o custo 10× da regra da casa, e entregaria pior a
mesma métrica que o CSV do Justiça em Números já dá.

### A frente disciplinar — reprovada, mas com o limite exato

⚠️ **Correção de 22/08/2026.** O veredito original desta seção era "a frente
disciplinar INTEIRA está reprovada". **Está errado assim escrito.** O que se
mede abaixo reprova a consulta a **processo disciplinar e seu resultado**. Não
reprova a **atividade correicional**: os achados da Corregedoria Nacional
existem, em texto, em 330 relatórios (§2, frente 0). O que segue vale só para o
recorte disciplinar.

| Fonte | Medido |
|---|---|
| Página de PAD do TJMG | 17.827 bytes — **2 PDFs, ambos manuais de como se defender**, zero processo consultável |
| Corregedoria-Geral do MPMG | 13 itens de menu, **nenhum de consulta disciplinar**; "Área Restrita" é o item 13 |
| Relatório de Correições do CNMP | 1.442.191 bytes de HTML com **0 `<tr>`, 0 iframe, 0 menção a MG** |
| Inspeções/correições do CNJ | 270 KB e 275 KB linkando 4 PDFs — regimento interno e organograma |

As duas únicas fontes com conteúdo real são **pauta de sessão** — agenda, não
resultado. **Não construir.** Publicar como matéria (§5).

⚠️ **E há decisão editorial embutida:** o **CNJ nomeia** o magistrado em itens
não sigilosos (nome completo confirmado na pauta de 18/08/2026), enquanto o
**CNMP anonimiza** o acusado e publica só o advogado. A regra da casa é
conservadora — ver [[flag_de_pessoa_fisica_mente]].

### Ouvidorias → rebaixadas a frente 4 opcional

É o material **mais rico em PDF** que existe: MPMG tem 62 PDFs de 2011 a 2026
(43.920 manifestações no 1º sem/2025, 34.105 reclamações, **74,3% anônimas**);
TJMG tem 18 relatórios anuais (10.454 manifestações em 2024-25).

Mas é PDF, os `fileId` do Lumis são **hashes opacos sem padrão**, e a pergunta
que responde (*"quanta gente reclama do MP"*) é de pesquisador, não da pessoa
atingida. Do lado do CNMP, **41 de 54 links (76%) devolvem 200 com 110 KB da
home** em vez do PDF, por causa de acento no caminho — curadoria manual
obrigatória, o que derruba o custo/benefício sozinho.

### Fontes fechadas ou não citáveis

| Fonte | Medido |
|---|---|
| Portal BNMP | **HTTP 403** para qualquer requisição não-navegador, antes do captcha |
| Base dos Dados | exige conta |
| `dados.gov.br` | **401 até para metadado de catálogo** |
| `dados.mj.gov.br` | conexão morta (000) |
| **Defensômetro** | hospedado em **IP nu** (`146.190.172.119`), sem HTTPS e sem domínio — **não é fonte citável em produto público** |
| MG-OUV | shell ZK de 9.908 bytes, com captcha e senha |

---

## 5. As lacunas que são MATÉRIA — saem de graça, e valem mais que uma página

### 🚨 A matéria principal deste plano era FALSA. Verificada no navegador em 22/08/2026.

**O que estava escrito aqui:** *"O CNJ publica o que vai julgar contra juízes e parou de publicar o que decidiu"*, porque o **Boletim da Sessão** teria como entrada mais recente a 9ª Sessão Ordinária de **09/05/2023**.

**Três erros, do menor para o maior:**

1. **A data estava errada.** O boletim mais recente não é de 09/05/2023 — a busca do próprio site devolve o **Boletim da 10ª Sessão Ordinária de 20/06/2023**, que existe, abre e traz conteúdo (nele, a aposentadoria compulsória de três desembargadores do TRT-5 por assédio a relatoras).

2. **O índice do Boletim é incompleto.** A página `/boletim-da-sessao/` lista até 23/05/2023 e **não lista o de 20/06/2023**, que a busca acha. Ou seja: nem o índice reflete o que o próprio site publicou.

3. **E o principal: o CNJ NÃO parou de publicar o que decidiu.** Existe a página **Lista de sessões** (`cnj.jus.br/lista-de-sessoes/`), viva e corrente — sessões até **19/08/2026**, três dias antes desta verificação, com seletor de ano de **2015 a 2026**. Cada sessão abre em `lista-de-processos-da-sessao/?sessao=NNN` com uma tabela de **classe, número do processo, relator e SITUAÇÃO**. Na 12ª Sessão Ordinária de 18/08/2026: 80 linhas, entre elas **5 Reclamações Disciplinares e 2 Revisões Disciplinares**, com situação `Julgado`, `Adiado`, `Retirado de julgamento` e `Pedido de Vista`.

**O que sobra de verdadeiro, e é bem menor:** o **Boletim da Sessão** — que era o produto *narrativo*, explicando em linguagem comum o que o Plenário decidiu — **foi descontinuado em meados de 2023**. Isso é perda de **acessibilidade**, não de **publicidade**: o resultado continua público, em forma de tabela e de acórdão no DJe.

⚠️ **Como o erro aconteceu, porque o método importa mais que o caso:** a medição anterior bateu na página do Boletim, viu a data velha e concluiu sobre o CNJ. Mas o próprio Boletim de 2023 traz, no corpo, a frase *"Para consultar todas as sessões, acesse a página de Resultados das Sessões"* — o caminho estava escrito dentro do documento que eu li pela metade.

**Publicar aquela matéria teria sido acusar o CNJ de esconder o que ele publica há onze anos sem interrupção.**

---

### E a frente disciplinar, que este plano deu como morta, NÃO está morta

A `Lista de sessões` é fonte enumerável e estruturada, e responde exatamente o que o plano dizia não existir:

| | |
|---|---|
| Rota | `cnj.jus.br/lista-de-processos-da-sessao/?sessao=NNN` |
| Série | **2015 a 2026** (seletor de ano na página de índice) |
| Por linha | classe, número do processo, relator, **situação** |
| Classes de interesse | Reclamação Disciplinar, Revisão Disciplinar, Processo Administrativo Disciplinar, Pedido de Providências |
| Atualidade | sessão de **19/08/2026** listada em 22/08/2026 |

⚠️ **O que ela NÃO dá:** o teor da decisão. `Julgado` diz que foi julgado, não o que foi decidido — para isso é preciso o acórdão no DJe ou o processo no PJe. E a própria página avisa que os documentos ali são **propostas de voto**, que podem mudar durante a sessão. Publicar "situação" como se fosse "resultado" seria o mesmo tipo de erro que este bloco está corrigindo.

⚠️ **E nomeia.** Reclamação Disciplinar traz número de processo e relator; o número leva ao nome do magistrado no PJe. A decisão editorial sobre exibir é a mesma já tomada para os gabinetes — mas aqui o objeto é acusação ainda não julgada, o que é diferente de meta não cumprida.


---

### Duas menores, que também são matéria

**(a) ~~Tempo médio de tramitação por tribunal estadual não existe em dado
aberto.~~ ❌ DERRUBADA EM 22/08/2026, e a correção vale mais que a matéria.**

A variável **existe**: `tpbaixm`, populada de 2015 a 2025 para o TJMG
(**675,5 em 2025**). A busca anterior falhou porque o dicionário do CNJ rotula
a coluna apenas como **"TpBaix - Média"** — sem a palavra "tempo" e sem
"tramitação". Procurar por palavra não acha; só acha quem procura pelo padrão
`Tp*` + sufixo.

⚠️ **E a unidade não está declarada.** O dicionário não diz se é dia, mês ou
outra coisa. 675,5 é compatível com dias corridos, mas isso é inferência
nossa. **Não escrever "675 dias" como se fosse afirmação do CNJ.**

**A lição que sobra é melhor que a matéria perdida:** buscar por palavra num
dicionário de 1.314 variáveis prova pouco. Ausência de resultado numa busca
textual não é ausência do dado — é ausência da palavra que eu escolhi.

**(b) ~~A Ouvidoria da DPMG não publica número nenhum, e não é falta de
capacidade técnica.~~ ❌ A MEDIÇÃO ESTAVA CERTA E A CONCLUSÃO ERA INJUSTA.**

A medição continua de pé: **zero ocorrência de "relatório" ou PDF** na página da
Ouvidoria. O que estava errado era a acusação colada nela — *"sabe publicar
planilha, só não publica quando o assunto é reclamação contra ela mesma"*.

**Verificado no navegador em 22/08/2026:** a **Ouvidoria-Geral da DPMG foi
implementada em março de 2025**. O edital para formação da lista tríplice do
cargo de ouvidor-geral saiu no Diário Oficial de **19/03/2025**, depois de
aprovação do Conselho Superior. O órgão tem **cerca de 17 meses**.

Não há série a publicar porque não há série ainda. Uma instituição que acabou de
instalar a ouvidoria não está escondendo histórico — ela não tem histórico.

**O que resta, e é legítimo:** registrar que a Ouvidoria existe desde 2025 e
**acompanhar se ela passa a publicar**. Isso é pauta de vigilância, não
denúncia — e a diferença entre as duas é exatamente o que a verificação salvou.

⚠️ **A lição vale para o método, não só para este caso:** a medição estava
correta e a conclusão era falsa. Zero relatório numa página pode significar
omissão **ou** órgão recém-criado, e `curl` não distingue os dois. Foi preciso
abrir o site num navegador e ler a notícia institucional para saber qual era.

⚠️ **E o gap é de prática, não de descumprimento:** nem a Res. CNJ 215/2015 nem
a Res. CNMP 89/2012 exigem essa publicação. **Isso torna a matéria mais forte,
não mais fraca** — e evita publicar acusação errada de ilegalidade.

### E uma que fica FORA da pauta, por decisão

**O CNJ publica CPF de pessoa física no relatório de inspeção do TJMG 2026** —
6 ocorrências válidas por dígito verificador, de particulares, com nome completo
ao lado, em atos de cartório.

**Decisão do projeto (22/08/2026): não publicamos os CPFs e não comunicamos ao
CNJ.** Não vira matéria nem ofício. Fica só a salvaguarda técnica:

- **redação na origem** (mod-11 sobre o texto, nunca por rótulo da fonte)
- **o PDF original não é espelhado** pelo projeto
- o que publicamos é **resumo próprio com link para a origem**

Ver [[flag_de_pessoa_fisica_mente]] e [[cpf_dentro_de_ementa_oficial]].

---

## 6. e-SIC: o que o login destrava, e o que ele não destrava

**O usuário pode fazer o login gov.br.** Isso muda o status de uma fonte que
estava marcada como barrada — mas muda menos do que parece, e a diferença
importa.

**Destrava:** o e-SIC central da **CGE-MG** cobre o **Executivo estadual**. Com
login, dá para protocolar LAI e acompanhar resposta.

⚠️ **NÃO destrava TJMG, MPMG nem DPMG.** Judiciário, Ministério Público e
Defensoria têm **SIC próprio**, fora do e-SIC do Executivo — e o SIC do TJMG já
foi medido nesta sondagem: **Qlik de 3.830 bytes**, ou seja, morto pela via
automatizada. `[VERIFY]` antes de prometer qualquer coisa: confirmar o canal de
protocolo de cada uma das três casas.

**O que vale pedir, em ordem — e é pedido humano, não coletor:**

| # | Pedido | Por que este |
|---|---|---|
| 1 | **DPMG** — nº de manifestações da Ouvidoria por ano e tipologia | §5(b): ela publica LAI em XLSX e não publica isto. O pedido testa se é omissão ou ausência |
| 2 | **TJMG / MPMG** — nº de processos disciplinares abertos, concluídos e resultado, **agregado, sem nome** | §4: é o buraco central, e o recorte agregado já contorna a questão de dado pessoal |
| 3 | **TJMG** — lista oficial de comarcas e quais têm Defensoria instalada | Confirma na fonte o denominador de 298 que hoje vem da planilha nacional |
| 4 | **TJMG** — tempo médio de tramitação por comarca | §5(a): o CNJ não publica em CSV; o tribunal tem o número |

**A resposta negativa é publicável.** "O órgão respondeu que não possui o dado"
é informação, e é a mesma doutrina dos 27% de EIA/RIMA que não abrem e do
`ft_convenio_metaetapa` que vem vazio.

---

## 7. DataJud: a posição, e por que ela custa pouco

O pedido foi: *"o DataJud não pode virar acervo, mas podemos fazer um resumo das
informações, citar a fonte original e publicar."*

**Concordo com a intenção e discordo de uma premissa.** Resumo **é** obra
derivada. As cláusulas **3.8/3.9** da licença do CNJ não vedam "acervo": vedam
**distribuir derivado sem ciência ao CNJ**. Citar a fonte é obrigação
independente — não é o que resolve a cláusula.

**Onde está a linha, em concreto:**

| Prática | Posição |
|---|---|
| Consulta ao vivo, nada persistido (o proxy de hoje) | ✅ segue como está |
| Contagem agregada que não reconstitui o registro | 🟡 defensável, **mas ainda é derivado** — o correto é avisar |
| Republicar registro processado, mesmo resumido | ❌ não |

**A saída limpa é barata: notificar o CNJ.** É um e-mail, não um bloqueio — e já
estava registrado como decisão pendente em `PLANO-EXPANSAO-ACORDOS-MG.md`.
Feito isso, o item 🟡 vira ✅ e para de ser assunto.

**Mas o achado que muda a conta é outro: para a história agregada, não
precisamos do DataJud.** O **Justiça em Números** (§2, 3ª frente) entrega
congestionamento, acervo e casos por magistrado — **dado aberto, sem cláusula
de derivado, com série de 17 anos.** O DataJud, além de exigir chave (401 sem
ela), é processo-a-processo: é a fonte errada para a pergunta agregada.

**Recomendação:** manter o proxy ao vivo para consulta individual, construir a
estatística sobre o Justiça em Números, e mandar a notificação ao CNJ para
liberar o meio-termo sem depender dele.

---

## 8. Princípios que decidem o que entra

1. **Fonte que só tem PDF ou painel sem dado por trás custa 10× e rende menos.**
   Isso pesa no ranking. A sondagem confirmou: 9 painéis, 0 byte de tabela.
2. **Lacuna é informação.** "O Estado não publica X" é matéria publicável (§5).
3. **Validar o corpo, nunca o status.** Provado de novo três vezes: o Boletim do
   CNJ (200, abandonado desde 2023), os 76% de links do CNMP que devolvem a home
   com 200, e o `buscarTac` do MPMG com **200 e 0 byte**.
4. **O portal é para a pessoa atingida, não para o pesquisador.** É o que põe a
   Defensoria em 1º e a Ouvidoria em 4º.
5. **Regra das cinco coisas** (`AGENTS.md`): gráfico, cartões, CSV do filtrado,
   filtro e ordenação. Vale para toda página nova desta frente.
6. **Medir a página que fala do assunto não mede a fonte.** Custou o veredito
   errado da frente correicional: 270 KB de HTML institucional diziam "não há
   nada", e o acervo de 2 GB estava a uma rota de distância. Antes de reprovar
   uma frente, procurar a **biblioteca de arquivos** do site, não só a página
   temática.
7. **Todo PDF de layout exige um segundo olhar do próprio documento.** Sumário,
   top-5, resumo executivo — qualquer recorte que o documento renderize por
   conta própria vira gabarito, e o extrator **para** se divergir. Pegou erro
   grave duas vezes no mesmo dia: cinco estados trocados no JUSTA (§3) e achado
   atribuído ao desembargador errado no CNJ (§2).

---

## 9. Progresso

| # | frente | estado |
|---|---|---|
| S | sondagem das 4 frentes | ✅ **fechada em 22/08/2026** — ~29 endpoints medidos |
| $ | JUSTA — orçamento da justiça por estado | ✅ **coletado e conferido** (21 estados, MG 2º em ambos os eixos) |
| 0 | catálogo nacional de inspeções do CNJ | ✅ **coletado** — 32 órgãos, 330 relatórios, ~1,7 GB, 2008→2026 |
| 0b | achados do relatório TJMG 2026 | ✅ **extraído e conferido** — 140 seções com conteúdo, 100 unidades, 0 CPF no dado |
| 0c | demais 12 relatórios do TJMG (2012→2023) | ✅ **baixados** (13/13, 66 MB); extração parcial — ver 0f |
| 0d | **o que NÃO mudou** | ✅ **publicado** — 52 seções de "Pendências da última inspeção" em 2023 e 24 em 2022, que é a conta do próprio CNJ |
| 0e | recorte: **STJ, TST, TRT-3 e STF** | ✅ **medido** — só o TRT-3 tem acervo (18 atas, 1991→2024); STJ, TST e STF não têm inspeção externa |
| 0f | extração dos anos 2012, 2019, 2022, 2023 | ✅ **feita** — 186 unidades, 1.339 itens. Destravada pela trava **T3** (a página que o sumário declara mata o falso-positivo) |
| 0g | 2017 (os dois relatórios) | ❌ **não extraível hoje** — determinação em prosa, sem numerar item: 3 unidades de 149 do sumário. Precisa de outra abordagem, não de ajuste |
| 0h | 2017 (Sistemas Judiciais) | ❌ **PDF digitalizado**, 16 páginas de imagem — precisa de OCR |
| P | página `/judiciario/inspecoes` | ✅ **no ar** — 123 seções, 98 unidades, as cinco coisas, link para a origem |
| 1 | cobertura da Defensoria por comarca | ✅ **coletada** — 298 comarcas, 120 atendidas, 176 não; em 2013 eram 105 de 295. ⬜ falta a página |
| 2 | inspeções em presídios (CNIEP) | ✅ **feita** — 285 estabelecimentos, 2.252 inspeções realizadas, página no ar. O cruzamento mostrou que a Justiça comum cobre 213 de 217 e o STM nenhuma de 18 |
| 3 | congestionamento do TJMG (Justiça em Números) | ✅ **coletado** — série do TJMG. ⬜ falta a página |
| 4 | atas de correição do TRT-3 | ✅ **18 atas baixadas** (1991→2024, 91 MB). ⬜ falta extrair e publicar |
| 5 | RAINT do STF | ❌ **falhou** — WAF da AWS passou a responder 202 com corpo vazio após ~6 chamadas |
| 4 | ouvidorias | ⏸️ opcional — só PDF, `fileId` opaco |
| — | disciplinar como página | ❌ **reprovada** — vira matéria (§5) |
| M | ~~matéria das 3 lacunas~~ | 🚨 **DUAS DAS TRÊS ERAM FALSAS** e foram corrigidas (§5). Sobra uma crítica menor: o Boletim narrativo do CNJ acabou em 2023 |
| N | **Lista de sessões do CNJ** — a frente disciplinar que este plano deu como morta | ⬜ **fonte enumerável achada em 22/08**: `?sessao=NNN`, 2015→2026, com classe, processo, relator e situação. Reclamação e Revisão Disciplinar entre as classes |
| V | **reverificar em navegador toda afirmação negativa restante** | ⬜ 5 já caíram; faltam os 9 painéis, o SISTAC, o MG-OUV e o `buscarTac` do MPMG |
| L | pedidos de LAI pelo e-SIC | ⬜ 4 pedidos priorizados (§6) — ação humana |
| C | notificar o CNJ sobre o DataJud | ⬜ um e-mail (§7) |
| D | CPF exposto pelo CNJ | ✅ **decidido**: não publicar, não comunicar; só redigir na origem (§5) |

---

Relacionado: [[controle_popular_estrutura_app]] · [[judiciario_project_state]] ·
[[apis_gov_status_200_mente]] · [[flag_de_pessoa_fisica_mente]]
