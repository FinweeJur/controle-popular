# Sondagem de inspeção/correição — STJ, TST, TRT-3 (MG), STF

Base de comparação já em casa: **CNJ / tribunais de Justiça — 32 órgãos, 330 relatórios, 1,7 GB, 2008–2026, JSON puro sem login.** Deste lote de quatro, nada chega perto disso. O total coletável aqui é **13 documentos**, por cerca de **42 requisições**, em duas rotas que não se parecem entre si nem com a do CNJ.

---

## 1. Veredito por tribunal

| Tribunal | Veredito | Documentos medidos | Série | Fonte primária |
|---|---|---|---|---|
| **STF** | **Dá parcialmente** — não há inspeção externa nenhuma; há equivalente interno coletável | **8 RAINT** (+9 PAINT, +6 anos de RAC/CAC não baixados) | 2018–2025 | GraphQL do CMS: `cms.stf.jus.br/graphql` |
| **TRT-3 (MG)** | **Dá parcialmente** — o documento certo existe, a via de descoberta é ruim | **5 atas** (piso medido, não total) | 2015, 2017, 2021, 2022, 2024 | Liferay do **TST**, não do TRT-3 |
| **TST** | **Não dá** — o documento não existe | **0** | não há série | — |
| **STJ** | **Não dá** — o documento não existe | **0** | não há série | — |

**Os números que sustentam cada veredito:**

- **STF — 8 PDFs reais, `application/pdf` confirmado.** Extremos medidos: RAINT 2018 = 325.673 bytes; RAINT 2025 = 10.485.736 bytes. A enumeração é 1 chamada GraphQL de 26.234 bytes que devolve os 8 links. Mas o objeto é **auditoria interna de gestão**, não inspeção correicional — não fala de vara, fila nem prazo.
- **TRT-3 — 5 PDFs reais somando 29.244.419 bytes (29,2 MB).** O maior é a ata de 2021, com 18.392.330 bytes. Quem lavra é a **CGJT (Corregedoria-Geral da Justiça do Trabalho, órgão do TST)**, e por isso a busca no site do TRT-3 e no CNJ falha. 5 é o piso do que foi medido em amostragem; o acervo real está espalhado por 17 páginas de gestão ainda não raspadas.
- **TST — 0.** A prova forte não é a página institucional do CNJ (270.292 bytes que são 100% menu). É a **tabela oficial de Atas de Correição do próprio TST, ciclo 2025-2027: 8 linhas — TRT13, TRT19, TRT17, TRT7, TRT9, TRT18, TRT11, TRT3. Nenhuma linha "TST".** O TST correiciona; não é correicionado.
- **STJ — 0, com a melhor medição negativa das quatro.** Página oficial de relatórios da Corregedoria Nacional (`cnj.jus.br/corregedoriacnj/inspecoes-correicoes/relatorios/`), **275.453 bytes de conteúdo real: 0 ocorrências de "STJ" e 0 de "Superior Tribunal de Justiça"**. Página de relatórios do CJF, 104.336 bytes: mesmas 0 ocorrências. Página institucional do STJ, 11.797 bytes: **0 ocorrências de "corregedoria"**.

---

## 2. Ordem de execução

### Passo 0 — fechar a prova de ausência (2 requisições, antes de tudo)

A sondagem provou a ausência do **STJ** contra a página de 275.453 bytes de conteúdo real. Para **TST** e **STF** a ausência foi provada contra páginas mais fracas (a de 270 KB é shell de menu; a tabela do TST é forte mas é fonte do próprio interessado). Falta rodar o mesmo `grep` que fechou o STJ:

```
curl -sL https://www.cnj.jus.br/corregedoriacnj/inspecoes-correicoes/relatorios/ \
  | grep -ioc -e 'TST' -e 'Tribunal Superior do Trabalho' -e 'STF' -e 'Supremo Tribunal Federal'
```

**Custo: 1–2 requisições.** Sem isso, a matéria da seção 3 tem uma perna medida (STJ) e duas apoiadas em fonte mais fraca. Com isso, as três ausências têm o mesmo rigor.

### Passo 1 — STF / RAINT (11 requisições, ~1 h)

| Etapa | Reqs | Via |
|---|---|---|
| 3 consultas GraphQL por slug (`relatorios-de-atividades`, `planos-de-auditoria`, `auditoria-anual-de-contas`) | 3 | **rota enumerável** — JSON de 26.234 / 31.987 / 25.359 bytes, com os links de PDF embutidos no campo `content` |
| Download dos 8 RAINT 2018–2025 | 8 | download direto de `cms.stf.jus.br/wp-content/uploads/AAAA/MM/` |

Volume: 3 dos 8 foram medidos e somam 13.829.635 bytes; os outros 5 não foram medidos. **Exige `-A` com User-Agent de Chrome** — sem isso o portal do STF devolve 403 (bloqueio AWS ELB).

Primeiro da fila porque é a única rota estável do lote: uma API de CMS, não um índice adivinhado.

### Passo 2 — TRT-3 / atas de correição (~31 requisições, ~4 h)

| Etapa | Reqs | Via |
|---|---|---|
| Índice `tst.jus.br/web/corregedoria/correicoes-anteriores` (158.823 bytes) | 1 | **raspagem** — devolve 17 links, um por gestão de Ministro Corregedor-Geral (2013–2026) |
| Uma página HTML por gestão, filtrando `TRT 3` / `3ª Região` na tabela | 17 | **raspagem**, com parser tolerante (o layout muda entre ciclos) |
| Download das atas encontradas | ~5–12 | download direto, URL sem padrão previsível |
| Ciclo corrente `/correicoes-atas` (141.692 bytes) | 1 | confirma o Edital: correição do TRT-3 **agendada para 05–09/10/2026**, ata ainda inexistente |

**Deduplicar por data da correição, não por nome de arquivo** — a ata de 2021 existe em duas cópias (TST e DSpace do TRT-3) com nomes diferentes; contá-las como dois documentos infla o acervo em 20%.

Segundo da fila porque custa 3× mais requisições que o STF para render, no piso medido, 5 documentos em vez de 8 — e é a rota que quebra sozinha quando o TST troca de gestão.

### Passo 3 — opcional: PAINT + RAC/CAC do STF (~30 requisições)

PAINT 2018–2026 (plano + ato de aprovação por ano) e RAC/CAC 2020–2025 (relatório + certificado + pronunciamento). Já enumerados pelas 3 chamadas GraphQL do Passo 1 — só falta baixar. Vale se o portal for usar a peça que instrui a prestação de contas ao TCU; não vale se o alvo for gargalo judicial.

### Passo 4 — gatilho, não coleta

Reler `/correicoes-atas` em **novembro de 2026**. A correição do TRT-3 acontece em 05–09/10/2026 e as atas anteriores foram assinadas de 4 a 14 dias após o fim da correição. É 1 requisição para ganhar o 6º documento.

---

## 3. A lacuna como matéria

> ### Onde a fiscalização do Judiciário para de existir
>
> Se o seu processo tramita numa vara estadual de Minas Gerais, existe um documento público que descreve, unidade por unidade, o que um inspetor externo encontrou lá dentro: são 13 relatórios do Conselho Nacional de Justiça sobre o Tribunal de Justiça de Minas Gerais, e só o mais recente tem 1.388 páginas, 140 seções com achado e 100 unidades examinadas. Se o processo é trabalhista, também existe — a Corregedoria-Geral da Justiça do Trabalho, órgão do TST, lavra uma Ata de Correição Ordinária a cada visita ao TRT da 3ª Região, e cinco delas estão publicadas (2015, 2017, 2021, 2022 e 2024), com a próxima correição já marcada para 5 a 9 de outubro de 2026. Mas se o seu processo subiu ao Superior Tribunal de Justiça, ao Tribunal Superior do Trabalho ou ao Supremo Tribunal Federal, esse documento simplesmente não existe. Não é que esteja mal publicado: não é produzido.
>
> A ausência tem endereço normativo. O **Regulamento Geral da Corregedoria Nacional de Justiça (CNJ, ato disponível em `atos.cnj.jus.br/atos/detalhar/2104`), no art. 45, define a inspeção como verificação de "órgãos jurisdicionais de primeiro ou segundo grau"** — e o **Provimento CNJ nº 156/2023 (`atos.cnj.jus.br/atos/detalhar/5327`)**, que regulamenta essas inspeções, também alcança apenas unidades de 1º e 2º grau. Tribunais superiores ficam fora por definição do próprio texto, não por omissão de agenda. A medição confirma o desenho: a página oficial que lista os relatórios de correição e inspeção da Corregedoria Nacional tem 275.453 bytes de conteúdo e **zero ocorrências das expressões "STJ" e "Superior Tribunal de Justiça"**. E o cargo que costuma ser confundido com uma corregedoria do STJ é outra coisa: o ministro-corregedor ligado ao STJ preside a Corregedoria-Geral da Justiça Federal, do CJF, cuja página de relatórios (104.336 bytes) lista inspeções nos TRF1 a TRF6 e também não menciona o STJ uma única vez. O mesmo padrão vale no trabalhista: a tabela oficial de Atas de Correição do TST, ciclo 2025-2027, tem oito linhas — TRT13, TRT19, TRT17, TRT7, TRT9, TRT18, TRT11 e TRT3 — e nenhuma delas é o próprio TST. Sobre o Supremo, o que existe é de outra natureza: oito Relatórios Anuais de Atividades da Auditoria Interna, de 2018 a 2025, que tratam de contratos, contas e gestão administrativa. Nenhum deles examina fila, prazo ou gargalo de gabinete. Esses três tribunais decidem em última palavra sobre trabalho, terra, prisão e benefício — e não há, no Brasil, um documento público que diga o que está travado dentro deles.

### O que ficou de fora da matéria porque a sondagem NÃO provou

Estes pontos apareceram na sondagem, soam plausíveis, e **não foram medidos**. Não devem ser publicados sem abrir o texto:

1. **`Res. CNJ 216/2016` "exclui expressamente os atos internos do STF do alcance correicional".** Não tem URL na sondagem, não foi aberta, e a ementa provável desse ato é outra (auditoria interna do Judiciário). **Alta chance de troca de conteúdo — descartada da matéria.**
2. **CF art. 102, I, "r" e art. 103-B, §4º.** O texto constitucional não foi aberto em nenhuma das quatro sondagens. O argumento "o CNJ está sob o STF, e não o inverso" é conhecimento jurídico corrente, não medição desta apuração. Fora da matéria até alguém abrir o dispositivo.
3. **`art. 111 da CF/88` como base da competência correicional da CGJT sobre os TRTs.** Citado na sondagem do TST, não medido. A "Resolução Administrativa do TST que disciplina as correições" também é mencionada **sem número**. A matéria acima descreve o que a CGJT faz (medido na tabela) sem afirmar de onde vem a competência.
4. **`Art. XXII/XXIII` do Regulamento da Corregedoria Nacional**, citado na sondagem do TST para "mantém contato direto com as demais Corregedorias". A numeração está malformada (é inciso, não artigo). O art. 45 do mesmo ato, esse sim, foi extraído e citado — é o que a matéria usa.
5. **Acórdão TCU 2632/2019-Plenário** (contas do STF, exercício 2017). Achado por busca, nunca requisitado. Fora.
6. **Ressalva de método honesta:** os arts. 45 (ato 2104) e o Provimento 156/2023 foram lidos via WebFetch, com corpo não medido por curl bruto naquela sondagem — embora o ato 2104 tenha sido medido em 152.035 bytes na sondagem do TST. São citações de texto lido, não de byte contado. É rigor suficiente para publicar; não é o mesmo rigor dos zeros de ocorrência.

---

## 4. O que NÃO fazer

**No TRT-3:**

1. **Não procurar a ata no site ou no repositório do TRT-3.** O DSpace `bd-trt3` guarda 1 das 5 atas, e nem como item: a ata de 2021 é o **bitstream `sequence=2` de um item cujo título é "Informativo de Legislação n. 69, de 19 de maio de 2021"**. Enumerar por título de item nunca a acharia.
2. **Não tentar OAI-PMH nem REST no DSpace do TRT-3.** `/oai/request?verb=Identify` e `/rest/collections` devolvem **a mesma página Cocoon de erro, 67.151 bytes, ambos 404**. Não existem nesse caminho.
3. **Não usar a coleção "Atas" (handle `11103/22543`).** Tem RSS/Atom funcional — é a via de enumeração mais convidativa do repositório — e guarda **atas de sessão de julgamento** (Turma, Pleno, Órgão Especial). Nome igual, conteúdo diferente.
4. **Não confiar em busca textual no DSpace.** A query `"correição ordinária"` devolveu **191 resultados**, quase todos Informativos e Ofícios-Circulares que apenas mencionam o tema.
5. **Não escrever parser fixo para as páginas do TST.** O layout muda por gestão: `<table>`/`<span>` aninhados em 2014–2018, `<div class="grid-row">` no ciclo 2026.
6. **Não adivinhar URL de PDF a partir da do ano anterior.** Muda o prefixo (http/https, com/sem www), a pasta numérica (24689367, 25124389, 30799401, 31246729) e o token de assinatura Liferay, único por arquivo.

**No STF:**

7. **Não raspar `portal.stf.jus.br/textos/publicacao.asp?...&pagina=X`.** Devolve sempre o **mesmo shell de 62.711 bytes, byte-idêntico entre páginas diferentes (diff = 0 linhas)**. Os links de PDF só existem na chamada GraphQL.
8. **Não usar o "Relatório de Gestão Fiscal".** É um `<iframe>` para dashboard Qlik Sense; o alvo do iframe tem **3.428 bytes** de bootstrap Angular. Painel não é dado.
9. **Não confiar no status 200.** `portal.stf.jus.br/hotsites/relatorioGestao/` responde **200 com 54.429 bytes que são a página de erro 404 do site** (identificável pelos scripts `erro-404-*.js`).
10. **Sempre mandar User-Agent de Chrome.** Sem `-A`, `portal.stf.jus.br` devolve 403 (AWS ELB).

**Na hora de escrever:**

11. **Não usar `cnj.jus.br/corregedoriacnj/inspecoes-correicoes/` como prova de ausência.** São 270.292 bytes de menu e rodapé WordPress, sem corpo de artigo — é o padrão "270 KB de nada". A prova está em `.../inspecoes-correicoes/relatorios/`, 275.453 bytes de listagem real.
12. **Não chutar slug do CNJ.** `cnj.jus.br/corregedoria/correicoes-e-inspecoes/` devolve **404 puro, 196 bytes**. O path certo tem `corregedoriacnj`.
13. **Não publicar "o STF não é fiscalizado".** Tem 8 RAINT medidos e presta contas ao TCU. O enunciado correto e defensável é **"não é inspecionado"** — e a diferença é o objeto: dinheiro e contrato, não vara e fila.
14. **Não pedir por LAI "relatório de inspeção" ao STJ ou ao TST.** O gênero não existe nesses órgãos; o pedido volta indeferido por inexistência e queima o prazo. Se houver pedido, ele tem de nomear outro documento — e qual seria não foi sondado.
15. **Não somar o acervo do TRT-3 com o do CNJ como se fosse a mesma série.** São gêneros distintos: relatório de inspeção do CNJ (achado por unidade) versus ata de correição da CGJT. Somar produz um número que não significa nada.

---

## 5. A comparação que o acervo permite

Com **TJMG: 13 relatórios (2012–2026, o de 2026 com 140 seções de achado e 100 unidades)** ao lado de **TRT-3: 5 atas (2015–2024)**, **STF: 8 RAINT (2018–2025)** e **dois zeros**, o portal passa a responder quatro perguntas que hoje ninguém responde:

**a) "Em que ponto do meu processo a fiscalização externa acaba?"**
Esta é a pergunta central, e a resposta virou número. Um processo trabalhista de Minas Gerais que sobe de vara → TRT-3 → TST cruza **duas instâncias com documento de inspeção e uma sem nenhum**. Um processo estadual que vai de comarca → TJMG → STJ, idem. O portal pode montar a escada por ramo e marcar onde ela apaga: **a fiscalização externa do Judiciário brasileiro termina no 2º grau, e isso está escrito no art. 45 do Regulamento da Corregedoria Nacional.** Ninguém publica esse mapa hoje porque ninguém coletou as duas pontas juntas.

**b) "No mesmo estado e no mesmo ano, o que o inspetor apontou na Justiça estadual e o que apontou na Justiça do Trabalho?"**
Minas Gerais é o único lugar onde este cruzamento é possível com o acervo em mãos: TJMG e TRT-3 cobrem o mesmo território, com dois inspetores diferentes (CNJ e CGJT). O teste custa **zero requisição** — é cruzar os anos das 5 atas do TRT-3 (2015, 2017, 2021, 2022, 2024) contra os 13 anos já coletados do TJMG e ver quais coincidem. Cada ano coincidente vira uma peça comparativa: mesmo estado, mesmo período, dois ramos, dois diagnósticos.

**c) "Com que frequência o tribunal que julga o meu caso é realmente visitado?"**
TJMG: 13 relatórios em 14 anos. TRT-3: 5 atas em 9 anos medidos, com **um vão de quase 4 anos entre a de maio/2017 e a de maio/2021**. Esse vão é publicável — com a ressalva de que pode ser lacuna da amostragem, não do acervo, e que **as 17 páginas de gestão do Passo 2 resolvem a dúvida**. A pergunta "meu tribunal foi inspecionado nos últimos 5 anos?" não tem hoje nenhuma página que responda.

**d) "Quando não existe inspeção, o que existe no lugar — e o que esse substituto deixa de fora?"**
O portal pode pôr lado a lado, para a pessoa atingida, dois documentos do mesmo Judiciário: o relatório do CNJ sobre o TJMG, que examina **100 unidades** e produz **140 achados** sobre acervo, prazo e funcionamento de vara; e o RAINT do STF, que examina contratos e gestão administrativa. São ambos oficiais, ambos anuais, ambos públicos — e **nenhum documento do segundo grupo responde "por que o meu processo está parado".** Dizer isso com os dois documentos abertos na tela é diferente de dizer que falta transparência: é mostrar que o documento existe, é bom, e é sobre outra coisa.

**Um alerta de escopo para a interface:** ata de correição da CGJT e relatório de inspeção do CNJ não são o mesmo gênero e não devem entrar na mesma contagem nem no mesmo gráfico. A comparação honesta é **por pergunta respondida**, não por número de PDFs.