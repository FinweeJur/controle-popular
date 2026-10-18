# Revisao das 185 sugestoes de respostas curadas que faltam no Seu Nono (2026-10-15)

> **Arquivado em 18/10/2026** na consolidação de planos. O que restava
> de pendência foi absorvido pelos planos integrados em `docs/planos/`.


> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-10-15
> **Leitura estimada:** longa (> 15 min)
> **Relacionados:** [REVISAO-CURADAS-2026-09-30.md](/docs/historico/planos/REVISAO-CURADAS-2026-09-30.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** seu nono, curadas, respostas prefixadas, revisao, sugestoes, ollama, cobertura, llama

## Sumário

- [Propósito](#propósito)
- [Como foi gerado](#como-foi-gerado)
- [Escolha do modelo (medida)](#escolha-do-modelo-medida)
- [O que falta (185)](#o-que-falta-185)
- [Revisão humana do dono (15/10/2026)](#revisão-humana-do-dono-15102026)
- [Entradas por frente](#entradas-por-frente)
- [Como aprovar](#como-aprovar)

## Propósito

O acervo do Seu Nonô tem 449 peças. Hoje 264 já têm resposta curada e
**185 seguem sem**. Este doc traz, para cada uma das 185, a sugestão
de resposta feita pelo gerador determinístico e a versão refinada pelo
modelo local, pronta para o dono ler e aprovar. **Nada entra no
`SeuNonoData.ts` sem o dono dizer** — número errado é dano.

## Como foi gerado

1. `npx tsx scripts/gerar-respostas-curadas.mts --tudo` gerou as 185
   sugestões por template determinístico (sem LLM). O relatório bruto
   ficou em `Temp\opencode\sugestoes-brutas.md`.
2. Cada sugestão foi reescrita pelo modelo local Ollama
   (`llama3.2:3b`, `http://127.0.0.1:11434`, `temperature: 0`,
   saída JSON `{"resposta": "..."}`), com travas no prompt: nenhum
   número/valor/data/URL pode mudar e o trecho final `(fonte: ...)`
   tem de ficar idêntico.
3. **Verificação determinística por código**, em cada resposta
   refinada: (a) todos os dígitos da bruta continuam presentes na
   refinada (multiconjunto, tolerando separador de milhar e decimal);
   (b) o `(fonte: ...)` do fim é idêntico ao da bruta. Falhou? O refine
   é descartado e a entrada mostra só a bruta do template.
   Foram 3 passadas de refine; o que não passou na verificação ficou
   marcado com ⚠️ abaixo.
4. Links de portal no formato `[texto](/rota)` aparecem aqui achatados
   como `texto (/rota)` — o validador de docs exige que link markdown
   aponte para arquivo existente. O caminho é o mesmo, nada mudou.

## Escolha do modelo (medida)

Comparação em 3 sugestões reais + teste trivial, com o servidor limpo:

| Modelo | Resultado medido |
|---|---|
| `sabia-finetuned` (6,7B, PT) | ❌ Não respondeu. Estourou 90 s, 300 s e 470 s de timeout em chamadas reais e até para responder "ok", mesmo depois de reiniciar o servidor (modelo carregado, 6,3 GB em CPU a 100%). Inviável nesta máquina CPU-only. |
| `llama3.2:3b` (3,2B) | ✅ Respondeu em 26–62 s por requisição, preservou números e valores nas 3 sugestões de teste. Tendência a derrubar o trecho final `(fonte: ...)` — corrigida com o trecho exigido literalmente no prompt e rejeitada pela verificação quando escapa. |

Escolha: **`llama3.2:3b`**, por dado, não por opinião.

## O que falta (185)

- Peças no acervo: **449** — já cobertas: **264** — sem curada: **185**.
- Refine aceito pela verificação: **164**.
- Refine descartado (vale só a bruta do template): **21**.
- Nenhum CPF ou dado pessoal detectado nas 185 sugestões.
- No pente fino de 15/10, o dono **reprovou 1** (item 74): virou túmulo.
  Restam **184 candidatas** à aprovação.

## Revisão humana do dono (15/10/2026)

O dono leu as entradas e passou um pente fino com seis critérios,
aplicados a todas as 185:

1. Pergunta é pergunta real, nunca `Como consulto <título de página>?` —
   112 entradas vieram assim, com erro de concordância (itens 61, 74, 77, 78).
2. Pergunta de número se responde com o NÚMERO, não só com a página: os
   itens 9, 45, 50 e 65 ganharam valores medidos em
   `public/data/comunicabr-31.json` (Betim R$ 900,8 mi; Minas R$ 68,8 bi
   em 2026, com a competência de cada programa).
3. Contagens conferidas contra o dado do repo: a Biblioteca tem agora
   **424 teses de 73 universidades** (commits de 14/10); a lista "UFMG,
   IFMG, CEFET-MG e UFRJ" e o "22 estudos" estavam mortos — o acervo é
   458 documentos + 424 teses (itens 37, 40, 71).
4. Nada de "disparidade histórica" entre órgãos diferentes: os itens 43,
   44 e os do judiciario dizem "TJMG recebe R$ 14,96 bi; MPMG, R$ 4,09 bi;
   DPMG, R$ 1,10 bi — menos de 8% do TJMG" (LOA 2025, Lei estadual
   25.124/2024).
5. "Acordo da Vale" não existe como nome — há vários TACs e acordos com a
   Vale. O item 74 foi reprovado; o rateio de R$ 1,64 bi é o rateio
   estadual do Acordo de Reparação de Brumadinho (Lei 23.830/2021, art. 5º).
6. O item 63 fala de código aberto e autonomia tecnológica, não de
   "integridade".

Correções de fato pelo caminho: os números do CAR nas curadas seguiram o
dado (`car-mg.json`, extração 20/08/2026: 78,4% em análise, média de
1.577 dias), e o cadastro do MTE ganhou o nome oficial ("Cadastro de
Empregadores", Portaria Interministerial nº 18/2024) com o termo
"trabalho em condições análogas à escravidão".

Os campos editados à mão mantêm o rótulo `(llama3.2:3b)` como procedência
do rascunho. Continua valendo: nada entra no `SeuNonoData.ts` sem o dono
dizer, item por item.

## Entradas por frente

### Frente `geral` (128)

#### 1. Soma dos R$ 251 bilhões monitorados no painel do portal

**Pergunta:** Quanto o portal monitora em dinheiro no painel?

**Resposta refinada (llama3.2:3b):** O painel do portal monitora R$ 251 bilhões. O Rio Doce traz R$ 171 bilhões. Brumadinho soma R$ 37,7 bilhões. A Justiça de Minas pesa R$ 20,1 bilhões. As cidades estratégicas completam com R$ 22,7 bilhões (fonte: /)

**Resposta bruta (template):** O painel do portal monitora R$ 251 bilhões. O Rio Doce traz R$ 171 bilhões. Brumadinho soma R$ 37,7 bilhões. A Justiça de Minas pesa R$ 20,1 bilhões. As cidades estratégicas completam com R$ 22,7 bilhões. (fonte: /)

**Fonte:** /

**Peça:** macro:soma-251-bi · geral · /

#### 9. Quanto Betim recebe de transferências federais?

**Pergunta:** Quanto Betim recebe de transferências federais?

**Resposta refinada (llama3.2:3b):** Betim soma R$ 900,8 milhões recebidos da União em 2026. A prefeitura recebe R$ 306,9 milhões até abril. O Bolsa Família paga R$ 132,0 milhões até julho. O BPC soma R$ 84,6 milhões até junho. O seguro-desemprego chega a R$ 86,2 milhões até junho. A previdência paga R$ 291,0 milhões até março. Em 2025 o repasse à prefeitura foi de R$ 566,6 milhões. O painel ComunicaBR mostra os valores por programa (fonte: /dados/comunicabr)

**Resposta bruta (template):** Betim soma R$ 900,8 milhões recebidos da União em 2026. A prefeitura recebe R$ 306,9 milhões até abril. O Bolsa Família paga R$ 132,0 milhões até julho. O BPC soma R$ 84,6 milhões até junho. O seguro-desemprego chega a R$ 86,2 milhões até junho. A previdência paga R$ 291,0 milhões até março. Em 2025 o repasse à prefeitura foi de R$ 566,6 milhões. O painel ComunicaBR mostra os valores por programa. (fonte: /dados/comunicabr)

**Fonte:** /dados/comunicabr

**Peça:** contexto:1:2 · geral · /dados/comunicabr

#### 32. Como funciona a metodologia de checagem do ONSA?

**Pergunta:** Como funciona a metodologia de checagem do ONSA?

**Resposta refinada (llama3.2:3b):** Nenhuma insinuação sem prova: toda reportagem cita a fonte primária oficial, o número e a data. (fonte: /sobre)

**Resposta bruta (template):** Nenhuma insinuação sem prova: toda reportagem cita a fonte primária oficial, o número e a data. (fonte: /sobre)

**Fonte:** /sobre

**Peça:** contexto:24:0 · geral · /sobre

#### 37. Onde consultar estudos acadêmicos e pesquisas sobre as mineradoras?

**Pergunta:** Onde consultar estudos acadêmicos e pesquisas sobre as mineradoras?

**Resposta refinada (llama3.2:3b):** A Biblioteca Unificada reúne 424 teses e dissertações de 73 universidades. O acervo foi integrado em 14/10/2026. UFMG e UFOP lideram, com 30 trabalhos cada (fonte: /biblioteca)

**Resposta bruta (template):** A Biblioteca Unificada reúne 424 teses e dissertações de 73 universidades. O acervo foi integrado em 14/10/2026. UFMG e UFOP lideram, com 30 trabalhos cada. (fonte: /biblioteca)

**Fonte:** /biblioteca

**Peça:** contexto:27:1 · geral · /biblioteca

#### 39. Onde consultar a taxa Selic e a inflação oficial (IPCA) do Banco Central?

**Pergunta:** Onde consultar a taxa Selic e a inflação oficial (IPCA) do Banco Central?

**Resposta refinada (llama3.2:3b):** O portal integra séries oficiais do SGS/BCB para contextualizar o impacto dos juros e inflação no orçamento público, consulte na página /estado-e-economia/orcamento (fonte: /estado-e-economia/orcamento)

**Resposta bruta (template):** O portal integra séries oficiais do SGS/BCB para contextualizar o impacto dos juros e inflação no orçamento público. (fonte: /estado-e-economia/orcamento)

**Fonte:** /estado-e-economia/orcamento

**Peça:** contexto:27:3 · geral · /estado-e-economia/orcamento

#### 40. Quantas teses e dissertações há na Biblioteca Unificada?

**Pergunta:** Quantas teses e dissertações há na Biblioteca Unificada?

**Resposta refinada (llama3.2:3b):** A Biblioteca Unificada soma 424 teses e dissertações de 73 universidades. O acervo total tem 458 documentos, com 18 estudos acadêmicos. A integração é de 14/10/2026. UFMG e UFOP lideram, com 30 cada (fonte: /biblioteca)

**Resposta bruta (template):** A Biblioteca Unificada soma 424 teses e dissertações de 73 universidades. O acervo total tem 458 documentos, com 18 estudos acadêmicos. A integração é de 14/10/2026. UFMG e UFOP lideram, com 30 cada. (fonte: /biblioteca)

**Fonte:** /biblioteca

**Peça:** contexto:28:0 · geral · /biblioteca

#### 41. Quem são os donos e conselheiros das empresas citadas nas pesquisas?

**Pergunta:** Quem são os donos e conselheiros das empresas citadas nas pesquisas?

**Resposta refinada (llama3.2:3b):** O Observatório de Empresas cruza dados de controle acionário, CVM, SEC e investimentos no Brasil. (fonte: /empresas)

**Resposta bruta (template):** O Observatório de Empresas cruza dados de controle acionário, CVM, SEC e investimentos no Brasil. (fonte: /empresas)

**Fonte:** /empresas

**Peça:** contexto:28:1 · geral · /empresas

#### 43. Qual o impacto do orçamento da Justiça nas contas de MG?

**Pergunta:** Qual o impacto do orçamento da Justiça nas contas de MG?

**Resposta refinada (llama3.2:3b):** O TJMG custa R$ 14,96 bilhões na LOA 2025. A folha de pessoal consome R$ 11,61 bilhões, 77,6% do total. O valor equivale a 5,51% da receita corrente líquida de Minas. A página compara arrecadação e repasses aos poderes (fonte: /estado-e-economia/orcamento)

**Resposta bruta (template):** O TJMG custa R$ 14,96 bilhões na LOA 2025. A folha de pessoal consome R$ 11,61 bilhões, 77,6% do total. O valor equivale a 5,51% da receita corrente líquida de Minas. A página compara arrecadação e repasses aos poderes. (fonte: /estado-e-economia/orcamento)

**Fonte:** /estado-e-economia/orcamento

**Peça:** contexto:29:1 · geral · /estado-e-economia/orcamento

#### 44. Onde ver as notícias investigativas sobre gastos dos tribunais?

**Pergunta:** Quanto cada órgão da Justiça de Minas recebe no orçamento?

**Resposta refinada (llama3.2:3b):** Reportagens comparam os orçamentos da Justiça mineira na LOA 2025. TJMG recebe R$ 14,96 bilhões; MPMG, R$ 4,09 bilhões; DPMG, R$ 1,10 bilhão — menos de 8% do TJMG (fonte: /noticias)

**Resposta bruta (template):** Reportagens comparam os orçamentos da Justiça mineira na LOA 2025. TJMG recebe R$ 14,96 bilhões; MPMG, R$ 4,09 bilhões; DPMG, R$ 1,10 bilhão — menos de 8% do TJMG. (fonte: /noticias)

**Fonte:** /noticias

**Peça:** contexto:29:2 · geral · /noticias

#### 45. Quanto meu município recebe de repasses federais da União?

**Pergunta:** Quanto meu município recebe de repasses federais da União?

**Resposta refinada (llama3.2:3b):** Minas recebe R$ 68,80 bilhões da União em 2026. Belo Horizonte soma R$ 7,79 bilhões; Betim, R$ 900,8 milhões. O repasse às prefeituras vai até abril de 2026. Bolsa Família vai até julho, BPC e seguro-desemprego até junho, previdência até março. O painel ComunicaBR mostra o valor da sua cidade (fonte: /dados/comunicabr)

**Resposta bruta (template):** Minas recebe R$ 68,80 bilhões da União em 2026. Belo Horizonte soma R$ 7,79 bilhões; Betim, R$ 900,8 milhões. O repasse às prefeituras vai até abril de 2026. Bolsa Família vai até julho, BPC e seguro-desemprego até junho, previdência até março. O painel ComunicaBR mostra o valor da sua cidade. (fonte: /dados/comunicabr)

**Fonte:** /dados/comunicabr

**Peça:** contexto:30:0 · geral · /dados/comunicabr

#### 47. Como fiscalizar as 199 cidades estratégicas do Brasil?

**Pergunta:** Como fiscalizar as 199 cidades estratégicas do Brasil?

**Resposta refinada (llama3.2:3b):** Consulte os perfis municipais com indicadores de leitos SUS, qualidade escolar IDEB e finanças públicas (fonte: /cidades)

**Resposta bruta (template):** Consulte os perfis municipais com indicadores de leitos SUS, qualidade escolar IDEB e finanças públicas. (fonte: /cidades)

**Fonte:** /cidades

**Peça:** contexto:32:1 · geral · /cidades

#### 50. Quanto a União transfere aos municípios de MG pelo ComunicaBR?

**Pergunta:** Quanto a União transfere aos municípios de MG pelo ComunicaBR?

**Resposta refinada (llama3.2:3b):** Em 2026, a União repassa R$ 68,80 bilhões a 853 municípios de Minas. As prefeituras recebem R$ 29,87 bilhões. O Bolsa Família soma R$ 6,79 bilhões e o BPC, R$ 5,75 bilhões. Os benefícios previdenciários chegam a R$ 23,31 bilhões. O seguro-desemprego paga R$ 3,08 bilhões. Cada programa tem data de corte (fonte: /dados/comunicabr)

**Resposta bruta (template):** Em 2026, a União repassa R$ 68,80 bilhões a 853 municípios de Minas. As prefeituras recebem R$ 29,87 bilhões. O Bolsa Família soma R$ 6,79 bilhões e o BPC, R$ 5,75 bilhões. Os benefícios previdenciários chegam a R$ 23,31 bilhões. O seguro-desemprego paga R$ 3,08 bilhões. Cada programa tem data de corte. (fonte: /dados/comunicabr)

**Fonte:** /dados/comunicabr

**Peça:** contexto:33:2 · geral · /dados/comunicabr

#### 52. Quais são as diretrizes de privacidade e LGPD do portal?

**Pergunta:** Quais são as diretrizes de privacidade e LGPD do portal?

**Resposta refinada (llama3.2:3b):** Conheça os termos de uso, a política de zero cookies/rastreadores e proteção de dados pessoais. (fonte: /termos)

**Resposta bruta (template):** Conheça os termos de uso, a política de zero cookies/rastreadores e proteção de dados pessoais. (fonte: /termos)

**Fonte:** /termos

**Peça:** contexto:35:2 · geral · /termos

#### 53. Quais contratos desses fornecedores estão no PNCP?

**Pergunta:** Quais contratos desses fornecedores estão no PNCP?

**Resposta refinada (llama3.2:3b):** O Portal Nacional de Contratações Públicas agrega as licitações e atas de registro de preços vigentes. (fonte: /governo)

**Resposta bruta (template):** O Portal Nacional de Contratações Públicas agrega as licitações e atas de registro de preços vigentes. (fonte: /governo)

**Fonte:** /governo

**Peça:** contexto:36:0 · geral · /governo

#### 54. Como consultar os gastos de ministérios e órgãos federais?

**Pergunta:** Como consultar os gastos de ministérios e órgãos federais?

**Resposta refinada (llama3.2:3b):** Consulte o orçamento e despesas na página de finanças e indicadores econômicos. (fonte: /estado-e-economia/orcamento)

**Resposta bruta (template):** Consulte o orçamento e despesas na página de finanças e indicadores econômicos. (fonte: /estado-e-economia/orcamento)

**Fonte:** /estado-e-economia/orcamento

**Peça:** contexto:36:1 · geral · /estado-e-economia/orcamento

#### 56. Quais são os maiores fornecedores estrangeiros já contratados?

**Pergunta:** Quais são os maiores fornecedores estrangeiros já contratados?

**Resposta refinada (llama3.2:3b):** Consulte o raio-x dos conglomerados dos EUA e Europa com balanços da SEC e vigência dos contratos. (fonte: /estado-e-economia/fornecedores-multinacionais)

**Resposta bruta (template):** Consulte o raio-x dos conglomerados dos EUA e Europa com balanços da SEC e vigência dos contratos. (fonte: /estado-e-economia/fornecedores-multinacionais)

**Fonte:** /estado-e-economia/fornecedores-multinacionais

**Peça:** contexto:38:0 · geral · /estado-e-economia/fornecedores-multinacionais

#### 57. Onde ver os leilões e chamamentos estaduais abertos?

**Pergunta:** Onde ver os leilões e chamamentos estaduais abertos?

**Resposta refinada (llama3.2:3b):** O Radar de Editais mapeia certames públicos e compras governamentais em andamento. (fonte: /editais)

**Resposta bruta (template):** O Radar de Editais mapeia certames públicos e compras governamentais em andamento. (fonte: /editais)

**Fonte:** /editais

**Peça:** contexto:38:1 · geral · /editais

#### 58. Como consultar os indicadores de inflação e câmbio para contratos?

**Pergunta:** Como consultar os indicadores de inflação e câmbio para contratos?

**Resposta refinada (llama3.2:3b):** Acompanhe as cotações oficiais do Banco Central para reajustes e correções contratuais (fonte: /estado-e-economia/orcamento)

**Resposta bruta (template):** Acompanhe as cotações oficiais do Banco Central para reajustes e correções contratuais. (fonte: /estado-e-economia/orcamento)

**Fonte:** /estado-e-economia/orcamento

**Peça:** contexto:38:2 · geral · /estado-e-economia/orcamento

#### 61. Governo: Prometeu? Cumpriu?

**Pergunta:** O governador do meu estado cumpriu as promessas de campanha?

**Resposta refinada (llama3.2:3b):** O portal monitora as promessas dos 27 governos estaduais e das capitais. Cada meta tem status de cumprimento. Veja o painel Prometeu? Cumpriu? por estado (fonte: /governo)

**Resposta bruta (template):** O portal monitora as promessas dos 27 governos estaduais e das capitais. Cada meta tem status de cumprimento. Veja o painel Prometeu? Cumpriu? por estado. (fonte: /governo)

**Fonte:** /governo

**Peça:** pagina:governo-hub · geral · /governo

#### 63. Código aberto e autonomia tecnológica no portal

**Pergunta:** O portal usa código aberto e garante autonomia tecnológica?

**Resposta refinada (llama3.2:3b):** O portal usa código aberto e infraestrutura soberana. Os modelos de IA são abertos, sem segredo escondido. As regras zero-secreto e a LGPD limitam o uso de dados (fonte: /tecnologia)

**Resposta bruta (template):** O portal usa código aberto e infraestrutura soberana. Os modelos de IA são abertos, sem segredo escondido. As regras zero-secreto e a LGPD limitam o uso de dados. (fonte: /tecnologia)

**Fonte:** /tecnologia

**Peça:** pagina:tecnologia-e-transparencia · geral · /tecnologia

#### 65. ComunicaBR — Repasses Federais nos Municípios

**Pergunta:** Quanto a União repassa aos municípios de Minas pelo ComunicaBR?

**Resposta refinada (llama3.2:3b):** A União transfere R$ 68,80 bilhões aos 853 municípios mineiros em 2026. As prefeituras recebem até abril, o Bolsa Família até julho. O BPC e o seguro-desemprego vão até junho, a previdência até março. O painel mostra o valor por cidade (fonte: /dados/comunicabr)

**Resposta bruta (template):** A União transfere R$ 68,80 bilhões aos 853 municípios mineiros em 2026. As prefeituras recebem até abril, o Bolsa Família até julho. O BPC e o seguro-desemprego vão até junho, a previdência até março. O painel mostra o valor por cidade. (fonte: /dados/comunicabr)

**Fonte:** /dados/comunicabr

**Peça:** pagina:comunicabr-federal · geral · /dados/comunicabr

#### 67. Estados Unidos — Corporações & Fundos na SEC

**Pergunta:** Onde vejo as empresas americanas registradas na SEC?

**Resposta refinada (llama3.2:3b):** Mercado de capitais norte-americano: formulários Form 20-F, 10-K, recibos ADR e fundos globais (fonte: /eua/empresas)

**Resposta bruta (template):** Mercado de capitais norte-americano: formulários Form 20-F, 10-K, recibos ADR e fundos globais. (fonte: /eua/empresas)

**Fonte:** /eua/empresas

**Peça:** pagina:eua-empresas · geral · /eua/empresas

#### 68. Cavas de Mineração em Minas Gerais

**Pergunta:** Onde vejo as cavas de mineração mapeadas em Minas?

**Resposta refinada (llama3.2:3b):** Série anual da mineração mapeada por satélite em MG e cruzamento de uma amostra de cavas com os polígonos da ANM, com camadas no globo 3D (fonte: /mineracao/cavas)

**Resposta bruta (template):** Série anual da mineração mapeada por satélite em MG e cruzamento de uma amostra de cavas com os polígonos da ANM, com camadas no globo 3D. (fonte: /mineracao/cavas)

**Fonte:** /mineracao/cavas

**Peça:** pagina:mineracao-cavas · geral · /mineracao/cavas

#### 71. Biblioteca reúne 458 documentos e 424 teses sobre barragens e mineração

**Pergunta:** Quantos documentos há na Biblioteca Unificada?

**Resposta refinada (llama3.2:3b):** A Biblioteca Unificada reúne 458 documentos sobre barragens e mineração, atualizados em 01/10/2026. O acervo integra 424 teses e dissertações de 73 universidades, desde 14/10/2026. A página /biblioteca mostra os dois conjuntos (fonte: /noticias/biblioteca-documentos-barragens-vale)

**Resposta bruta (template):** A Biblioteca Unificada reúne 458 documentos sobre barragens e mineração, atualizados em 01/10/2026. O acervo integra 424 teses e dissertações de 73 universidades, desde 14/10/2026. A página /biblioteca mostra os dois conjuntos. (fonte: /noticias/biblioteca-documentos-barragens-vale)

**Fonte:** /noticias/biblioteca-documentos-barragens-vale

**Peça:** blog:biblioteca-documentos-barragens-vale · geral · /noticias/biblioteca-documentos-barragens-vale

#### 72. IPCA, Selic e dólar: os números que mexem no orçamento

**Pergunta:** Onde vejo as séries de inflação, juros e câmbio?

**Resposta refinada (llama3.2:3b):** O portal reúne as séries oficiais do Banco Central sobre inflação, juros e câmbio. Os indicadores ajudam a entender o orçamento de famílias e governos. As séries do Banco Central (https://www3.bcb.gov.br/sgspub/) mostram a inflação e os juros oficiais. Em agosto de 2026, o IPCA ficou em -0,32% (fonte: /noticias/ipca-selic-dolar-orcamento-banco-central)

**Resposta bruta (template):** O portal reúne as séries oficiais do Banco Central sobre inflação, juros e câmbio. Os indicadores ajudam a entender o orçamento de famílias e governos. As séries do Banco Central (https://www3.bcb.gov.br/sgspub/) mostram a inflação e os juros oficiais. Em agosto de 2026, o IPCA ficou em -0,32%. (fonte: /noticias/ipca-selic-dolar-orcamento-banco-central)

**Fonte:** /noticias/ipca-selic-dolar-orcamento-banco-central

**Peça:** blog:ipca-selic-dolar-orcamento-banco-central · geral · /noticias/ipca-selic-dolar-orcamento-banco-central

#### 73. 870 convênios ambientais somam R$ 477 milhões em Minas

**Pergunta:** Quanto somam os convênios ambientais de Minas Gerais?

⚠️ **refine descartado (fonte alterada pelo modelo)** — vale só a resposta bruta.

**Resposta bruta (template):** O portal reuniu 870 convênios ambientais de Minas Gerais. A soma chega a R$ 477,4 milhões, entre 2007 e 2026. A lista mostra valor, órgão, prazo e acordos adiados. (fonte: /noticias/convenios-ambientais-minas-semad)

**Fonte:** /noticias/convenios-ambientais-minas-semad

**Peça:** blog:convenios-ambientais-minas-semad · geral · /noticias/convenios-ambientais-minas-semad

#### 74. ❌ REPROVADA pelo dono em 15/10 — "Acordo da Vale" é genérico

O rateio de R$ 1,64 bilhão é o rateio ESTADUAL do Acordo Judicial de Reparação Integral — Brumadinho (Vale S.A.), criado pela Lei 23.830/2021, art. 5º. Há vários TACs e acordos com a Vale (Brumadinho, Rio Doce/Mariana); "acordo da Vale" é tecnicamente errado. A pergunta também tinha erro de concordância. Fora das perguntas pré-curadas. Ver dado: `public/data/repasse-brumadinho-mg.json` (11/08/2026).

#### 75. Portal mapeia 445 canais de pedido de informação pública

**Pergunta:** Quantos canais de pedido de informação o portal mapeia?

**Resposta refinada (llama3.2:3b):** O portal mapeia 445 canais de acesso à informação no país. São 199 prefeituras, 199 câmaras, concessionárias e órgãos federais. A LAI garante resposta em até 20 dias. Cada canal traz endereço e categoria. (fonte: /noticias/canais-pedido-informacao-lai-portal)

**Resposta bruta (template):** O portal mapeia 445 canais de acesso à informação no país. São 199 prefeituras, 199 câmaras, concessionárias e órgãos federais. A LAI garante resposta em até 20 dias. Cada canal traz endereço e categoria. (fonte: /noticias/canais-pedido-informacao-lai-portal)

**Fonte:** /noticias/canais-pedido-informacao-lai-portal

**Peça:** blog:canais-pedido-informacao-lai-portal · geral · /noticias/canais-pedido-informacao-lai-portal

#### 76. 710 conselhos de direitos fiscalizam políticas públicas no país

**Pergunta:** Quantos conselhos de direitos existem no país?

**Resposta refinada (llama3.2:3b):** O portal mapeou 710 conselhos de direitos no país. Desses, 597 são municipais, 108 estaduais e 5 federais. Cada conselho traz categoria e esfera. Eles são a porta da participação popular. (fonte: /noticias/conselhos-direitos-politicas-publicas)

**Resposta bruta (template):** O portal mapeou 710 conselhos de direitos no país. Desses, 597 são municipais, 108 estaduais e 5 federais. Cada conselho traz categoria e esfera. Eles são a porta da participação popular. (fonte: /noticias/conselhos-direitos-politicas-publicas)

**Fonte:** /noticias/conselhos-direitos-politicas-publicas

**Peça:** blog:conselhos-direitos-politicas-publicas · geral · /noticias/conselhos-direitos-politicas-publicas

#### 77. MTE cadastra 181 empresas por trabalho em condições análogas à escravidão

**Pergunta:** Quantas empresas estão no cadastro de trabalho análogo à escravidão do MTE?

**Resposta refinada (llama3.2:3b):** O Cadastro de Empregadores expõe empresas em casos de trabalho análogo à escravidão. São 181 empresas, 190 registros e 1.867 trabalhadores em 23 estados. O dado é de 28/09/2026. A Portaria 18/2024 do MTE, MDHC e MIR criou o cadastro (fonte: /noticias/cadastro-empregadores-trabalho-escravo-mte)

**Resposta bruta (template):** O Cadastro de Empregadores expõe empresas em casos de trabalho análogo à escravidão. São 181 empresas, 190 registros e 1.867 trabalhadores em 23 estados. O dado é de 28/09/2026. A Portaria 18/2024 do MTE, MDHC e MIR criou o cadastro. (fonte: /noticias/cadastro-empregadores-trabalho-escravo-mte)

**Fonte:** /noticias/cadastro-empregadores-trabalho-escravo-mte

**Peça:** blog:cadastro-empregadores-trabalho-escravo-mte · geral · /noticias/cadastro-empregadores-trabalho-escravo-mte

#### 78. Fila do CAR no IEF leva 4 anos, mas grandes empreendimentos tramitam em meses

**Pergunta:** Por que a fila do CAR no IEF demora tantos anos?

**Resposta refinada (llama3.2:3b):** O CAR de Minas tem 1,16 milhão de imóveis no IEF. Dos registros, 78,4% seguem paralisados em análise. A espera média passa de 1.577 dias, mais de quatro anos. Silvicultura e mineração tramitam em meses, com ritos acelerados. O dado é de 20/08/2026 (fonte: /noticias/car-ief-mg-tempo-espera-grandes-empreendimentos-servidores)

**Resposta bruta (template):** O CAR de Minas tem 1,16 milhão de imóveis no IEF. Dos registros, 78,4% seguem paralisados em análise. A espera média passa de 1.577 dias, mais de quatro anos. Silvicultura e mineração tramitam em meses, com ritos acelerados. O dado é de 20/08/2026. (fonte: /noticias/car-ief-mg-tempo-espera-grandes-empreendimentos-servidores)

**Fonte:** /noticias/car-ief-mg-tempo-espera-grandes-empreendimentos-servidores

**Peça:** blog:car-ief-mg-tempo-espera-grandes-empreendimentos-servidores · geral · /noticias/car-ief-mg-tempo-espera-grandes-empreendimentos-servidores

#### 79. Laboratório de dados: compare séries públicas em gráficos de pontos

**Pergunta:** Como comparar séries públicas em gráficos no Laboratório?

**Resposta refinada (llama3.2:3b):** O portal lançou o Laboratório de Dados. O leitor escolhe dois acervos no dock e analisa indicadores lado a lado em gráficos de pontos. A busca global agora direciona palavras-chave para as janelas. Consultar dados públicos em tabelas extensas costuma afastar quem busca respostas rápidas. (fonte: /noticias/laboratorio-de-dados-do-portal)

**Resposta bruta (template):** O portal lançou o Laboratório de Dados. O leitor escolhe dois acervos no dock e analisa indicadores lado a lado em gráficos de pontos. A busca global agora direciona palavras-chave direto para as janelas. Consultar dados públicos em tabelas extensas costuma afastar quem busca respostas rápidas. (fonte: /noticias/laboratorio-de-dados-do-portal)

**Fonte:** /noticias/laboratorio-de-dados-do-portal

**Peça:** blog:laboratorio-de-dados-do-portal · geral · /noticias/laboratorio-de-dados-do-portal

#### 80. Satélite Sino-Brasileiro CBERS-6 monitorará a Amazônia através de nuvens densas

**Pergunta:** O que o satélite CBERS-6 vai monitorar na Amazônia?

**Resposta refinada (llama3.2:3b):** Brasil e China aprovam cronograma de desenvolvimento do satélite ambiental CBERS-6. Novo sensor de radar óptico superará limitações climáticas na fiscalização florestal. (fonte: /noticias/satelite-cbers-6-cooperacao-espacial-amazonia)

**Resposta bruta (template):** Brasil e China aprovam cronograma de desenvolvimento do satélite ambiental CBERS-6. Novo sensor de radar óptico superará limitações climáticas na fiscalização florestal. (fonte: /noticias/satelite-cbers-6-cooperacao-espacial-amazonia)

**Fonte:** /noticias/satelite-cbers-6-cooperacao-espacial-amazonia

**Peça:** blog:satelite-cbers-6-cooperacao-espacial-amazonia · geral · /noticias/satelite-cbers-6-cooperacao-espacial-amazonia

#### 81. Dados do Banco Central apontam taxa média do cheque especial em 128% ao ano

**Pergunta:** Qual é a taxa média do cheque especial?

**Resposta refinada (llama3.2:3b):** O cheque especial tem taxa média de 128% ao ano. O dado vem das séries do Banco Central. A dívida líquida do setor público atinge 61% do PIB. As séries reúnem juros, inflação e endividamento. (fonte: /noticias/indicadores-economicos-banco-central-credito-inflacao)

**Resposta bruta (template):** O cheque especial tem taxa média de 128% ao ano. O dado vem das séries do Banco Central. A dívida líquida do setor público atinge 61% do PIB. As séries reúnem juros, inflação e endividamento. (fonte: /noticias/indicadores-economicos-banco-central-credito-inflacao)

**Fonte:** /noticias/indicadores-economicos-banco-central-credito-inflacao

**Peça:** blog:indicadores-economicos-banco-central-credito-inflacao · geral · /noticias/indicadores-economicos-banco-central-credito-inflacao

#### 82. Dados da Anatel apontam mais de 1.400 distritos rurais sem cobertura celular no país

**Pergunta:** Quantos distritos rurais estão sem cobertura celular no Brasil?

**Resposta refinada (llama3.2:3b):** A Anatel mapeia a cobertura de celular no país. Mais de 1.400 distritos rurais seguem sem sinal. Populações rurais ficam longe de serviços públicos e bancos digitais. O mapeamento está em dados abertos da Anatel (https://dados.gov.br/dados/conjuntos-dados/smp-cobertura). (fonte: /noticias/cobertura-celular-anatel-desertos-digitais-brasil)

**Resposta bruta (template):** A Anatel mapeia a cobertura de celular no país. Mais de 1.400 distritos rurais seguem sem sinal. Populações rurais ficam longe de serviços públicos e bancos digitais. O mapeamento está em dados abertos da Anatel (https://dados.gov.br/dados/conjuntos-dados/smp-cobertura). (fonte: /noticias/cobertura-celular-anatel-desertos-digitais-brasil)

**Fonte:** /noticias/cobertura-celular-anatel-desertos-digitais-brasil

**Peça:** blog:cobertura-celular-anatel-desertos-digitais-brasil · geral · /noticias/cobertura-celular-anatel-desertos-digitais-brasil

#### 83. Assembleias estaduais consomem bilhões com folha parlamentar e verbas indenizatórias

**Pergunta:** Quanto gastam as assembleias legislativas estaduais?

**Resposta refinada (llama3.2:3b):** Mapeamento inédito consolida gastos dos legislativos estaduais em Minas Gerais e São Paulo. Cada deputado dispõe de dezenas de assessores e recursos para despesas de mandato. (fonte: /noticias/gastos-salarios-parlamentares-assembleias-estaduais)

**Resposta bruta (template):** Mapeamento inédito consolida gastos dos legislativos estaduais em Minas Gerais e São Paulo. Cada deputado dispõe de dezenas de assessores e recursos para despesas de mandato. (fonte: /noticias/gastos-salarios-parlamentares-assembleias-estaduais)

**Fonte:** /noticias/gastos-salarios-parlamentares-assembleias-estaduais

**Peça:** blog:gastos-salarios-parlamentares-assembleias-estaduais · geral · /noticias/gastos-salarios-parlamentares-assembleias-estaduais

#### 84. Pesquisa da ANP mostra disparidade de até R$ 1,67 no preço da gasolina entre capitais

**Pergunta:** Qual a diferença de preço da gasolina entre capitais?

**Resposta refinada (llama3.2:3b):** A ANP pesquisa o preço da gasolina toda semana. A diferença chega a R$ 1,67 por litro entre capitais. Impostos estaduais e custo do transporte explicam a variação. (fonte: /noticias/preco-gasolina-capitais-cidades-estrategicas-anp)

**Resposta bruta (template):** A ANP pesquisa o preço da gasolina toda semana. A diferença chega a R$ 1,67 por litro entre capitais. Impostos estaduais e custo do transporte explicam a variação. (fonte: /noticias/preco-gasolina-capitais-cidades-estrategicas-anp)

**Fonte:** /noticias/preco-gasolina-capitais-cidades-estrategicas-anp

**Peça:** blog:preco-gasolina-capitais-cidades-estrategicas-anp · geral · /noticias/preco-gasolina-capitais-cidades-estrategicas-anp

#### 85. Leilões ferroviários atraem consórcios globais para modernizar transporte de cargas

**Pergunta:** Onde ver os leilões ferroviários em andamento?

**Resposta refinada (llama3.2:3b):** Governo federal promove leilões de concessão para modernização da Malha Oeste e Ferrogrão. Fabricantes da Europa, Estados Unidos e China disputam fornecimento de locomotivas e trilhos. O Ministério dos Transportes prepara a licitação internacional de concessão da Malha Oeste ferroviária. (fonte: /noticias/leiloes-ferroviarios-malha-oeste-disputa-internacional)

**Resposta bruta (template):** Governo federal promove leilões de concessão para modernização da Malha Oeste e Ferrogrão. Fabricantes da Europa, Estados Unidos e China disputam fornecimento de locomotivas e trilhos. O Ministério dos Transportes prepara a licitação internacional de concessão da Malha Oeste ferroviária. (fonte: /noticias/leiloes-ferroviarios-malha-oeste-disputa-internacional)

**Fonte:** /noticias/leiloes-ferroviarios-malha-oeste-disputa-internacional

**Peça:** blog:leiloes-ferroviarios-malha-oeste-disputa-internacional · geral · /noticias/leiloes-ferroviarios-malha-oeste-disputa-internacional

#### 86. Séries econômicas do Banco Central explicam pressão sobre orçamentos dos estados

**Pergunta:** Como a economia afeta o orçamento dos estados?

**Resposta refinada (llama3.2:3b):** Integração com a API do Banco Central revela evolução da dívida líquida do setor público. Juros altos e inflação limitam capacidade fiscal de governos estaduais e prefeituras. O portal integrou indicadores macroeconômicos oficiais da API do Banco Central do Brasil. (fonte: /noticias/series-economicas-banco-central-orcamento-estados-municipios)

**Resposta bruta (template):** Integração com a API do Banco Central revela evolução da dívida líquida do setor público. Juros altos e inflação limitam capacidade fiscal de governos estaduais e prefeituras. O portal integrou indicadores macroeconômicos oficiais da API do Banco Central do Brasil. (fonte: /noticias/series-economicas-banco-central-orcamento-estados-municipios)

**Fonte:** /noticias/series-economicas-banco-central-orcamento-estados-municipios

**Peça:** blog:series-economicas-banco-central-orcamento-estados-municipios · geral · /noticias/series-economicas-banco-central-orcamento-estados-municipios

#### 87. Automação diária do Portal Nacional de Contratações Públicas assegura fiscalização cívica

**Pergunta:** Como o portal acompanha as compras públicas do PNCP?

**Resposta refinada (llama3.2:3b):** Rotina automatizada analisa compras públicas publicadas no PNCP sob a Lei 14.133. Sistema sanitiza dados de pessoas físicas e consolida contratos em formato aberto. A nova Lei de Licitações centraliza compras governamentais no portal nacional PNCP. (fonte: /noticias/automacao-diaria-pncp-compras-publicas-lgpd)

**Resposta bruta (template):** Rotina automatizada analisa compras públicas publicadas no PNCP sob a Lei 14.133. Sistema sanitiza dados de pessoas físicas e consolida contratos em formato aberto. A nova Lei de Licitações centraliza compras governamentais no portal nacional PNCP. (fonte: /noticias/automacao-diaria-pncp-compras-publicas-lgpd)

**Fonte:** /noticias/automacao-diaria-pncp-compras-publicas-lgpd

**Peça:** blog:automacao-diaria-pncp-compras-publicas-lgpd · geral · /noticias/automacao-diaria-pncp-compras-publicas-lgpd

#### 88. Assembleias legislativas estaduais passam a ter gastos e atuação parlamentar monitorados

**Pergunta:** Onde acompanhar os gastos dos deputados estaduais?

**Resposta refinada (llama3.2:3b):** Novo módulo do portal acompanha o desempenho dos deputados estaduais de MG e SP. Dados oficiais detalham o uso de verbas públicas e proposições apresentadas. O portal Controle Popular ampliou a fiscalização cívica para os parlamentos estaduais brasileiros. (fonte: /noticias/transparencia-assembleias-legislativas-almg-alesp)

**Resposta bruta (template):** Novo módulo do portal acompanha o desempenho dos deputados estaduais de MG e SP. Dados oficiais detalham o uso de verbas públicas e proposições apresentadas. O portal Controle Popular ampliou a fiscalização cívica para os parlamentos estaduais brasileiros. (fonte: /noticias/transparencia-assembleias-legislativas-almg-alesp)

**Fonte:** /noticias/transparencia-assembleias-legislativas-almg-alesp

**Peça:** blog:transparencia-assembleias-legislativas-almg-alesp · geral · /noticias/transparencia-assembleias-legislativas-almg-alesp

#### 89. Cobertura de telefonia celular e 5G expõe desigualdades de conectividade no país

**Pergunta:** Onde o 5G ainda não chegou no Brasil?

**Resposta refinada (llama3.2:3b):** Dados da Anatel revelam concentração da tecnologia 5G nos grandes centros urbanos. Rodovias federais e áreas rurais continuam com acesso restrito a redes velozes. O sinal de internet móvel de alta velocidade ainda não alcança toda população. (fonte: /noticias/cobertura-telefonia-movel-5g-anatel-desigualdades)

**Resposta bruta (template):** Dados da Anatel revelam concentração da tecnologia 5G nos grandes centros urbanos. Rodovias federais e áreas rurais continuam com acesso restrito a redes velozes. O sinal de internet móvel de alta velocidade ainda não alcança toda população. (fonte: /noticias/cobertura-telefonia-movel-5g-anatel-desigualdades)

**Fonte:** /noticias/cobertura-telefonia-movel-5g-anatel-desigualdades

**Peça:** blog:cobertura-telefonia-movel-5g-anatel-desigualdades · geral · /noticias/cobertura-telefonia-movel-5g-anatel-desigualdades

#### 90. Preço dos combustíveis revela fortes disparidades entre capitais e cidades estratégicas

**Pergunta:** Quanto varia o preço dos combustíveis entre cidades?

**Resposta refinada (llama3.2:3b):** Série histórica da ANP aponta diferenças expressivas no preço médio da gasolina comum. Custo do refino, impostos estaduais e logística definem os valores na bomba. A Agência Nacional do Petróleo pesquisa preços de combustíveis semanalmente em todo país. (fonte: /noticias/preco-combustiveis-anp-capitais-200-cidades-polos)

**Resposta bruta (template):** Série histórica da ANP aponta diferenças expressivas no preço médio da gasolina comum. Custo do refino, impostos estaduais e logística definem os valores na bomba. A Agência Nacional do Petróleo pesquisa preços de combustíveis semanalmente em todo país. (fonte: /noticias/preco-combustiveis-anp-capitais-200-cidades-polos)

**Fonte:** /noticias/preco-combustiveis-anp-capitais-200-cidades-polos

**Peça:** blog:preco-combustiveis-anp-capitais-200-cidades-polos · geral · /noticias/preco-combustiveis-anp-capitais-200-cidades-polos

#### 91. Empresas chinesas lideram concessões de energia e eletrificação de frotas no Brasil

**Pergunta:** Quanto as empresas chinesas investem no Brasil?

**Resposta refinada (llama3.2:3b):** Empresas da China expandem atuação no setor elétrico e no transporte público brasileiro. Investimentos da State Grid e BYD ultrapassam quarenta bilhões de reais. (fonte: /noticias/investimentos-chineses-transmissao-mobilidade-eletrica)

**Resposta bruta (template):** Empresas da China expandem atuação no setor elétrico e no transporte público brasileiro. Investimentos da State Grid e BYD ultrapassam quarenta bilhões de reais. (fonte: /noticias/investimentos-chineses-transmissao-mobilidade-eletrica)

**Fonte:** /noticias/investimentos-chineses-transmissao-mobilidade-eletrica

**Peça:** blog:investimentos-chineses-transmissao-mobilidade-eletrica · geral · /noticias/investimentos-chineses-transmissao-mobilidade-eletrica

#### 92. Brasil negocia parcerias internacionais bilionárias em sete setores estratégicos

**Pergunta:** Quanto o Brasil negocia em parcerias internacionais?

**Resposta refinada (llama3.2:3b):** Novo painel cívico acompanha negociações bilaterais em mineração, hidrogênio verde, ferrovias e tecnologia. Aportes previstos ultrapassam duzentos bilhões de reais. O governo federal mantém negociações diplomáticas e comerciais para projetos de grande porte. (fonte: /noticias/acordos-internacionais-sete-setores-estrategicos)

**Resposta bruta (template):** Novo painel cívico acompanha negociações bilaterais em mineração, hidrogênio verde, ferrovias e tecnologia. Aportes previstos ultrapassam duzentos bilhões de reais. O governo federal mantém negociações diplomáticas e comerciais para projetos de grande porte. (fonte: /noticias/acordos-internacionais-sete-setores-estrategicos)

**Fonte:** /noticias/acordos-internacionais-sete-setores-estrategicos

**Peça:** blog:acordos-internacionais-sete-setores-estrategicos · geral · /noticias/acordos-internacionais-sete-setores-estrategicos

#### 93. As páginas mais acessadas do portal e as garantias de transparência cívica e proteção de dados

**Pergunta:** Quais são as páginas mais acessadas do portal?

**Resposta refinada (llama3.2:3b):** O ranking de páginas populares mostra a busca por prestação de contas. Os termos de uso formalizam direitos dos titulares e a transparência passiva. A transparência sobre o próprio portal é parte do compromisso público do Controle Popular. (fonte: /noticias/transparencia-passiva-dados-populares-e-lgpd)

**Resposta bruta (template):** Ranking de páginas populares evidencia a busca por prestação de contas. Termos de uso formalizam direitos dos titulares e transparência passiva. A transparência sobre o próprio portal é parte do compromisso público do Controle Popular. (fonte: /noticias/transparencia-passiva-dados-populares-e-lgpd)

**Fonte:** /noticias/transparencia-passiva-dados-populares-e-lgpd

**Peça:** blog:transparencia-passiva-dados-populares-e-lgpd · geral · /noticias/transparencia-passiva-dados-populares-e-lgpd

#### 94. Corregedoria e controle externo: o que o CNJ e o CNMP determinaram nos tribunais de MG

**Pergunta:** O que o CNJ e o CNMP apuraram nos tribunais de MG?

**Resposta refinada (llama3.2:3b):** Mapeamento inédito consolida os apontamentos dos conselhos nacionais da Justiça e do Ministério Público sobre produtividade e despesas. O Poder Judiciário e o Ministério Público mineiros contam com mais de R$ 20,1 bilhões em orçamento anual somado. (fonte: /noticias/recomendacoes-cnj-cnmp-e-inspecoes-da-justica)

**Resposta bruta (template):** Mapeamento inédito consolida os apontamentos dos conselhos nacionais da Justiça e do Ministério Público sobre produtividade e despesas. O Poder Judiciário e o Ministério Público mineiros contam com mais de R$ 20,1 bilhões em orçamento anual somado. (fonte: /noticias/recomendacoes-cnj-cnmp-e-inspecoes-da-justica)

**Fonte:** /noticias/recomendacoes-cnj-cnmp-e-inspecoes-da-justica

**Peça:** blog:recomendacoes-cnj-cnmp-e-inspecoes-da-justica · geral · /noticias/recomendacoes-cnj-cnmp-e-inspecoes-da-justica

#### 95. Panorama das 199 cidades: população, barragens e terras sob vigilância

**Pergunta:** Quantas cidades estratégicas o portal monitora?

**Resposta refinada (llama3.2:3b):** Levantamento reúne indicadores de moradores, rios e barragens. Cobre 199 cidades estratégicas monitoradas pelo portal. O portal reúne 199 cidades na página de Cidades Estratégicas (/cidades). São 27 capitais e 172 cidades polo do interior. O portal usa o código do IBGE. (fonte: /noticias/terra-e-territorios-199-cidades)

**Resposta bruta (template):** Levantamento reúne indicadores de moradores, rios e barragens. Cobre 199 cidades estratégicas monitoradas pelo portal. O portal reúne 199 cidades na página de Cidades Estratégicas (/cidades). São 27 capitais e 172 cidades polo do interior. O portal usa o código do IBGE. (fonte: /noticias/terra-e-territorios-199-cidades)

**Fonte:** /noticias/terra-e-territorios-199-cidades

**Peça:** blog:terra-e-territorios-199-cidades · geral · /noticias/terra-e-territorios-199-cidades

#### 96. Arrecadação e compras públicas: raio-x de R$ 123 bilhões em receitas e gastos oficiais

**Pergunta:** Quanto Minas Gerais arrecadou em 2024?

**Resposta refinada (llama3.2:3b):** Análises fiscais mostram o crescimento da receita mineira, com detalhe do ICMS e do IPVA. Reúne também as contratações públicas catalogadas no PNCP. Minas Gerais arrecadou R$ 123,6 bilhões em 2024. (fonte: /noticias/estado-e-economia-pncp-compras)

**Resposta bruta (template):** Análises fiscais mostram o crescimento da receita mineira, com detalhe do ICMS e do IPVA. Reúne também as contratações públicas catalogadas no PNCP. Minas Gerais arrecadou R$ 123,6 bilhões em 2024. (fonte: /noticias/estado-e-economia-pncp-compras)

**Fonte:** /noticias/estado-e-economia-pncp-compras

**Peça:** blog:estado-e-economia-pncp-compras · geral · /noticias/estado-e-economia-pncp-compras

#### 97. Congresso Nacional: votações, bancadas e o impacto dos projetos nas cidades

**Pergunta:** Onde ver as votações do Congresso Nacional?

**Resposta refinada (llama3.2:3b):** Análises monitoram votações na Câmara e no Senado. Mostram como as decisões afetam municípios e políticas públicas. O portal reúne votações e presença de 513 deputados federais e 81 senadores. Os dados vêm dos portais abertos da Câmara e do Senado. (fonte: /noticias/congresso-nacional-direitos-votacoes)

**Resposta bruta (template):** Análises monitoram votações na Câmara e no Senado. Mostram como as decisões afetam municípios e políticas públicas. O portal reúne votações e presença de 513 deputados federais e 81 senadores. Os dados vêm dos portais abertos da Câmara e do Senado. (fonte: /noticias/congresso-nacional-direitos-votacoes)

**Fonte:** /noticias/congresso-nacional-direitos-votacoes

**Peça:** blog:congresso-nacional-direitos-votacoes · geral · /noticias/congresso-nacional-direitos-votacoes

#### 98. Tribunais em Minas Gerais: vagas, indicações e o mapa do judiciário estadual

**Pergunta:** Onde ver o mapa dos tribunais de Minas Gerais?

**Resposta refinada (llama3.2:3b):** O levantamento analisa a composição dos tribunais e as nomeações para a segunda instância. Também mostra as condições das unidades de detenção. O portal organiza cargos e estrutura do Poder Judiciário mineiro. Os dados ficam na página de Judiciário (/judiciario). (fonte: /noticias/judiciario-transparencia-tribunais)

**Resposta bruta (template):** O levantamento analisa a composição dos tribunais e as nomeações para a segunda instância. Também mostra as condições das unidades de detenção. O portal organiza cargos e estrutura do Poder Judiciário mineiro. Os dados ficam na página de Judiciário (/judiciario). (fonte: /noticias/judiciario-transparencia-tribunais)

**Fonte:** /noticias/judiciario-transparencia-tribunais

**Peça:** blog:judiciario-transparencia-tribunais · geral · /noticias/judiciario-transparencia-tribunais

#### 99. TJMG: proposta de R$ 14,9 bilhões na LOA 2025 e gastos de pessoal consomem 5,5% da receita de Minas

**Pergunta:** Quanto o TJMG vai gastar na LOA 2025?

**Resposta refinada (llama3.2:3b):** A análise detalha as contas do Judiciário mineiro e o peso da folha de magistrados e servidores. Também explica o papel do FEPJ, o Fundo Especial do Poder Judiciário. O Órgão Especial do TJMG aprovou proposta de R$ 14,96 bilhões. TJMG é o Tribunal de Justiça de Minas Gerais. (fonte: /noticias/tjmg-orcamento-folha-indicacoes)

**Resposta bruta (template):** A análise detalha as contas do Judiciário mineiro e o peso da folha de magistrados e servidores. Também explica o papel do FEPJ, o Fundo Especial do Poder Judiciário. O Órgão Especial do TJMG aprovou proposta de R$ 14,96 bilhões. TJMG é o Tribunal de Justiça de Minas Gerais. (fonte: /noticias/tjmg-orcamento-folha-indicacoes)

**Fonte:** /noticias/tjmg-orcamento-folha-indicacoes

**Peça:** blog:tjmg-orcamento-folha-indicacoes · geral · /noticias/tjmg-orcamento-folha-indicacoes

#### 100. DPMG: Defensoria opera com orçamento de R$ 1,1 bilhão e 176 comarcas não têm defensor em Minas

**Pergunta:** Qual o orçamento da Defensoria Pública de Minas?

**Resposta refinada (llama3.2:3b):** O levantamento compara os orçamentos do sistema de justiça de Minas. No ritmo atual, universalizar a Defensoria levaria mais de 140 anos. A DPMG recebeu R$ 1,104 bilhão na LOA 2025. DPMG é a Defensoria Pública de Minas Gerais. LOA é a Lei Orçamentária Anual (fonte: /noticias/dpmg-acesso-justica-defensoria)

**Resposta bruta (template):** O levantamento compara os orçamentos do sistema de justiça de Minas. No ritmo atual, universalizar a Defensoria levaria mais de 140 anos. A DPMG recebeu R$ 1,104 bilhão na LOA 2025. DPMG é a Defensoria Pública de Minas Gerais. LOA é a Lei Orçamentária Anual. (fonte: /noticias/dpmg-acesso-justica-defensoria)

**Fonte:** /noticias/dpmg-acesso-justica-defensoria

**Peça:** blog:dpmg-acesso-justica-defensoria · geral · /noticias/dpmg-acesso-justica-defensoria

#### 101. MPMG: orçamento de R$ 4 bilhões concentra 81% em pessoal e verbas indenizatórias geram debate

**Pergunta:** Quanto custa o Ministério Público de Minas Gerais?

**Resposta refinada (llama3.2:3b):** A análise examina o orçamento do Ministério Público de Minas Gerais, o custeio e os limites da Lei de Responsabilidade Fiscal. O MPMG tem orçamento de R$ 4,088 bilhões. O valor consta na LOA 2025, a Lei Orçamentária Anual. (fonte: /noticias/mpmg-promotorias-fiscalizacao)

**Resposta bruta (template):** A análise examina o orçamento do Ministério Público de Minas Gerais, o custeio e os limites da Lei de Responsabilidade Fiscal. O MPMG tem orçamento de R$ 4,088 bilhões. O valor consta na LOA 2025, a Lei Orçamentária Anual. (fonte: /noticias/mpmg-promotorias-fiscalizacao)

**Fonte:** /noticias/mpmg-promotorias-fiscalizacao

**Peça:** blog:mpmg-promotorias-fiscalizacao · geral · /noticias/mpmg-promotorias-fiscalizacao

#### 102. Meio ambiente em Minas: 19 mil licenças, monitoramento do COPAM e TACs do IBAMA

**Pergunta:** Quantas licenças ambientais Minas Gerais monitora?

**Resposta refinada (llama3.2:3b):** O panorama compila licenças ativas, deliberações de órgãos colegiados e termos de ajustamento de conduta. A frente ambiental do portal reúne mais de 19 mil registros de licenciamento. (fonte: /noticias/meio-ambiente-barragens-licenciamento-mg)

**Resposta bruta (template):** O panorama compila licenças ativas, deliberações de órgãos colegiados e termos de ajustamento de conduta. A frente ambiental do portal reúne mais de 19 mil registros de licenciamento. (fonte: /noticias/meio-ambiente-barragens-licenciamento-mg)

**Fonte:** /noticias/meio-ambiente-barragens-licenciamento-mg

**Peça:** blog:meio-ambiente-barragens-licenciamento-mg · geral · /noticias/meio-ambiente-barragens-licenciamento-mg

#### 103. Repactuação de Mariana fixa R$ 171 bilhões para o Rio Doce e R$ 677 milhões empenhados em Minas

**Pergunta:** Quanto vale a repactuação do Rio Doce?

**Resposta refinada (llama3.2:3b):** O acordo do Rio Doce envolve Samarco, Vale e BHP. O valor nominal é de R$ 132 bilhões. O painel do portal contabiliza R$ 171 bilhões para a bacia. A auditoria mostra R$ 2,9 bilhões em caixa no estado. Os pagamentos efetivos somam R$ 338 milhões. A barragem de Fundão rompeu em 5 de novembro de 2015, em Mariana. (fonte: /noticias/mariana-repactuacao-rio-doce-recursos)

**Resposta bruta (template):** O acordo do Rio Doce envolve Samarco, Vale e BHP. O valor nominal é de R$ 132 bilhões. O painel do portal contabiliza R$ 171 bilhões para a bacia. A auditoria mostra R$ 2,9 bilhões em caixa no estado. Os pagamentos efetivos somam R$ 338 milhões. A barragem de Fundão rompeu em 5 de novembro de 2015, em Mariana. (fonte: /noticias/mariana-repactuacao-rio-doce-recursos)

**Fonte:** /noticias/mariana-repactuacao-rio-doce-recursos

**Peça:** blog:mariana-repactuacao-rio-doce-recursos · geral · /noticias/mariana-repactuacao-rio-doce-recursos

#### 104. Barragens a montante em Minas: 23 estruturas pendentes e prazos adiados para até 2035

**Pergunta:** Quantas barragens a montante faltam desfazer em Minas?

**Resposta refinada (llama3.2:3b):** A investigação detalha as 45 barragens a montante de Minas Gerais. Vinte e três estruturas seguem pendentes, com prazos adiados até 2035. A Lei Estadual 23.291/2019 nasceu depois de Brumadinho. Ela foi aprovada por unanimidade pela Assembleia Legislativa. (fonte: /noticias/barragens-descaracterizacao-prazos-mg)

**Resposta bruta (template):** A investigação detalha as 45 barragens a montante de Minas Gerais. Vinte e três estruturas seguem pendentes, com prazos adiados até 2035. A Lei Estadual 23.291/2019 nasceu depois de Brumadinho. Ela foi aprovada por unanimidade pela Assembleia Legislativa. (fonte: /noticias/barragens-descaracterizacao-prazos-mg)

**Fonte:** /noticias/barragens-descaracterizacao-prazos-mg

**Peça:** blog:barragens-descaracterizacao-prazos-mg · geral · /noticias/barragens-descaracterizacao-prazos-mg

#### 105. Belo Horizonte: orçamento de R$ 19 bilhões e mais de 6.800 contratos no PNCP

**Pergunta:** Qual o orçamento de Belo Horizonte e quantos contratos tem?

**Resposta refinada (llama3.2:3b):** A auditoria examina a execução orçamentária de Belo Horizonte, de R$ 19 bilhões. A capital tem mais de 6.800 contratos no PNCP. Belo Horizonte soma 2.315.560 moradores, pelo Censo do IBGE. IBGE é o Instituto Brasileiro de Geografia e Estatística. (fonte: /noticias/belo-horizonte-contratos-orcamento-capital)

**Resposta bruta (template):** A auditoria examina a execução orçamentária de Belo Horizonte, de R$ 19 bilhões. A capital tem mais de 6.800 contratos no PNCP. Belo Horizonte soma 2.315.560 moradores, pelo Censo do IBGE. IBGE é o Instituto Brasileiro de Geografia e Estatística. (fonte: /noticias/belo-horizonte-contratos-orcamento-capital)

**Fonte:** /noticias/belo-horizonte-contratos-orcamento-capital

**Peça:** blog:belo-horizonte-contratos-orcamento-capital · geral · /noticias/belo-horizonte-contratos-orcamento-capital


#### 106. Como falar com a Justiça: varas, gabinetes e balcões de atendimento em Minas Gerais

**Pergunta:** Como falar com a Justiça em Minas Gerais?

**Resposta refinada (llama3.2:3b):** O Controle Popular publica o primeiro mapa completo das comarcas e varas do TJMG. O TJMG é o Tribunal de Justiça de Minas Gerais. Os dados de contato foram verificados. São telefone, e-mail e endereço de 298 comarcas. Elas se distribuem nos 853 municípios de Minas Gerais (fonte: /noticias/judiciario-varas-gabinetes-como-acessar)

**Resposta bruta (template):** O Controle Popular publica o primeiro mapa completo das comarcas e varas do TJMG. O TJMG é o Tribunal de Justiça de Minas Gerais. Os dados de contato foram verificados. São telefone, e-mail e endereço de 298 comarcas. Elas se distribuem nos 853 municípios de Minas Gerais. (fonte: /noticias/judiciario-varas-gabinetes-como-acessar)

**Fonte:** /noticias/judiciario-varas-gabinetes-como-acessar

**Peça:** blog:judiciario-varas-gabinetes-como-acessar · geral · /noticias/judiciario-varas-gabinetes-como-acessar

#### 107. LAI completa 13 anos: como qualquer pessoa pode pedir informação a qualquer órgão público

**Pergunta:** Como pedir informação a um órgão público pela LAI?

**Resposta refinada (llama3.2:3b):** A Lei de Acesso à Informação (LAI) garante um direito desde 2011. Qualquer pessoa pode pedir documentos e contratos de órgãos públicos. Não há custo. Não precisa explicar o motivo. O Controle Popular explica como funciona. Reúne os canais de 445 entidades. (fonte: /noticias/lai-acesso-informacao-13-anos-como-pedir)

**Resposta bruta (template):** A Lei de Acesso à Informação (LAI) garante um direito desde 2011. Qualquer pessoa pode pedir documentos e contratos de órgãos públicos. Não há custo. Não precisa explicar o motivo. O Controle Popular explica como funciona. Reúne os canais de 445 entidades. (fonte: /noticias/lai-acesso-informacao-13-anos-como-pedir)

**Fonte:** /noticias/lai-acesso-informacao-13-anos-como-pedir

**Peça:** blog:lai-acesso-informacao-13-anos-como-pedir · geral · /noticias/lai-acesso-informacao-13-anos-como-pedir

#### 108. WAICO: 29 países, entre eles o Brasil, fundam organização mundial de IA; governo brasileiro anuncia supercomputador e nuvem nacional

**Pergunta:** Quantos países fundaram a organização mundial de IA?

**Resposta refinada (llama3.2:3b):** Em 16/07/2026, nasceu a Organização Mundial para Cooperação em Inteligência Artificial (WAICO). A fundação foi em Xangai. Assinaram 29 países, incluindo o Brasil. Em paralelo, o governo brasileiro anunciou nova etapa de infraestrutura de IA. (fonte: /noticias/waico-ia-codigo-aberto-brasil)

**Resposta bruta (template):** Em 16/07/2026, nasceu a Organização Mundial para Cooperação em Inteligência Artificial (WAICO). A fundação foi em Xangai. Assinaram 29 países, incluindo o Brasil. Em paralelo, o governo brasileiro anunciou nova etapa de infraestrutura de IA. (fonte: /noticias/waico-ia-codigo-aberto-brasil)

**Fonte:** /noticias/waico-ia-codigo-aberto-brasil

**Peça:** blog:waico-ia-codigo-aberto-brasil · geral · /noticias/waico-ia-codigo-aberto-brasil

#### 109. Minas Gerais tem 20 contratos de concessão que somam R$ 10,48 bilhões

**Pergunta:** Quanto vale o pacote de concessões de Minas Gerais?

⚠️ **refine descartado (fonte alterada pelo modelo)** — vale só a resposta bruta.

**Resposta bruta (template):** Um levantamento do portal mapeia 20 contratos ligados a concessões em Minas Gerais. As rodovias concentram 9 desses contratos. A maior operação é a concessão administrativa de 95 escolas. Os valores iniciais somam R$ 10,48 bilhões. (fonte: /noticias/ppp-concessoes-minas-gerais-contratos-transparencia)

**Fonte:** /noticias/ppp-concessoes-minas-gerais-contratos-transparencia

**Peça:** blog:ppp-concessoes-minas-gerais-contratos-transparencia · geral · /noticias/ppp-concessoes-minas-gerais-contratos-transparencia

#### 110. União mantém 553 imóveis em Minas, e 159 estão sem destinação definida

**Pergunta:** Quantos imóveis da União há em Minas Gerais?

**Resposta refinada (llama3.2:3b):** O Painel de Transparência Ativa da SPU registra 553 imóveis da União em Minas Gerais. Belo Horizonte concentra 267 deles. Outros 159 estão em processo de destinação ou sem definição. A área total cadastrada passa de 35,7 mil hectares. (fonte: /noticias/imoveis-uniao-minas-gerais-spu-destinacoes)

**Resposta bruta (template):** O Painel de Transparência Ativa da SPU registra 553 imóveis da União em Minas Gerais. Belo Horizonte concentra 267 deles. Outros 159 estão em processo de destinação ou sem definição. A área total cadastrada passa de 35,7 mil hectares. (fonte: /noticias/imoveis-uniao-minas-gerais-spu-destinacoes)

**Fonte:** /noticias/imoveis-uniao-minas-gerais-spu-destinacoes

**Peça:** blog:imoveis-uniao-minas-gerais-spu-destinacoes · geral · /noticias/imoveis-uniao-minas-gerais-spu-destinacoes

#### 111. Base do IBGE lista os 853 municípios de Minas em 12 mesorregiões

**Pergunta:** Quantos municípios de Minas estão na base do IBGE?

**Resposta refinada (llama3.2:3b):** A base de municípios do portal reúne os 853 municípios de Minas Gerais. O IBGE os distribui em 12 mesorregiões e 66 microrregiões. As regiões imediatas somam 70 recortes no estado. Cada registro traz o código IBGE de sete dígitos. (fonte: /noticias/municipios-minas-gerais-ibge-853-base-cidades)

**Resposta bruta (template):** A base de municípios do portal reúne os 853 municípios de Minas Gerais. O IBGE os distribui em 12 mesorregiões e 66 microrregiões. As regiões imediatas somam 70 recortes no estado. Cada registro traz o código IBGE de sete dígitos. (fonte: /noticias/municipios-minas-gerais-ibge-853-base-cidades)

**Fonte:** /noticias/municipios-minas-gerais-ibge-853-base-cidades

**Peça:** blog:municipios-minas-gerais-ibge-853-base-cidades · geral · /noticias/municipios-minas-gerais-ibge-853-base-cidades

#### 112. Censo 2022 conta 411.846 moradores em Betim, menos que a estimativa de 2021

**Pergunta:** Quantos moradores Betim tinha no Censo 2022?

**Resposta refinada (llama3.2:3b):** O Censo 2022 apurou 411.846 moradores em Betim. A estimativa de 2021 apontava 450.024 pessoas. A diferença é de 38.178 moradores. Os dez polos regionais do portal somam 5.584.390 pessoas. (fonte: /noticias/populacao-polos-minas-censo-2022-ibge)

**Resposta bruta (template):** O Censo 2022 apurou 411.846 moradores em Betim. A estimativa de 2021 apontava 450.024 pessoas. A diferença é de 38.178 moradores. Os dez polos regionais do portal somam 5.584.390 pessoas. (fonte: /noticias/populacao-polos-minas-censo-2022-ibge)

**Fonte:** /noticias/populacao-polos-minas-censo-2022-ibge

**Peça:** blog:populacao-polos-minas-censo-2022-ibge · geral · /noticias/populacao-polos-minas-censo-2022-ibge

#### 113. Bot do portal fiscaliza bases de dados antes de virarem página pública

**Pergunta:** Como o portal fiscaliza a qualidade dos seus dados?

**Resposta refinada (llama3.2:3b):** O portal mantém um bot que audita suas bases de dados versionadas. A rotina verifica CPF por mod-11 e códigos IBGE de sete dígitos. Ela também acusa duplicatas e valores monetários zerados. O self-test tem 11 verificações e confirma que a régua enxerga. (fonte: /noticias/bot-fiscalizacao-bases-portal-qualidade-dado)

**Resposta bruta (template):** O portal mantém um bot que audita suas bases de dados versionadas. A rotina verifica CPF por mod-11 e códigos IBGE de sete dígitos. Ela também acusa duplicatas e valores monetários zerados. O self-test tem 11 verificações e confirma que a régua enxerga. (fonte: /noticias/bot-fiscalizacao-bases-portal-qualidade-dado)

**Fonte:** /noticias/bot-fiscalizacao-bases-portal-qualidade-dado

**Peça:** blog:bot-fiscalizacao-bases-portal-qualidade-dado · geral · /noticias/bot-fiscalizacao-bases-portal-qualidade-dado

#### 114. Painel multilateral compara Brasil com 13 países em IDH, renda e comércio

**Pergunta:** Com quantos países o painel multilateral compara o Brasil?

**Resposta refinada (llama3.2:3b):** O portal reúne indicadores multilaterais de 14 países. O Brasil tem IDH 0,76 e Gini de 50,3. A Alemanha aparece com IDH 0,95 e Gini de 32,5. A OMC mede 240 milhões de toneladas de minério exportadas à China. O Painel Multilateral (/internacional) reúne 14 países em seis indicadores sociais. (fonte: /noticias/onu-unesco-oms-omc-brasil-indicadores-multilaterais)

**Resposta bruta (template):** O portal reúne indicadores multilaterais de 14 países. O Brasil tem IDH 0,76 e Gini de 50,3. A Alemanha aparece com IDH 0,95 e Gini de 32,5. A OMC mede 240 milhões de toneladas de minério exportadas à China. O Painel Multilateral (/internacional) reúne 14 países em seis indicadores sociais. (fonte: /noticias/onu-unesco-oms-omc-brasil-indicadores-multilaterais)

**Fonte:** /noticias/onu-unesco-oms-omc-brasil-indicadores-multilaterais

**Peça:** blog:onu-unesco-oms-omc-brasil-indicadores-multilaterais · geral · /noticias/onu-unesco-oms-omc-brasil-indicadores-multilaterais

#### 115. SEC e USAspending mostram fundos e contratos dos EUA ligados ao Brasil

**Pergunta:** Quanto os fundos dos EUA ligados ao Brasil declaram?

⚠️ **refine descartado (fonte alterada pelo modelo)** — vale só a resposta bruta.

**Resposta bruta (template):** O portal mapeia dez empresas e fundos registrados na SEC dos EUA. A BlackRock declara US$ 10,5 trilhões sob gestão. A Mosaic opera barragens de fosfato em Uberaba, Araxá e Tapira. O USAspending registra o comércio bilateral de US$ 85,2 bilhões. (fonte: /noticias/eua-sec-usaspending-fundos-contratos-brasil)

**Fonte:** /noticias/eua-sec-usaspending-fundos-contratos-brasil

**Peça:** blog:eua-sec-usaspending-fundos-contratos-brasil · geral · /noticias/eua-sec-usaspending-fundos-contratos-brasil

#### 116. Lei dos EUA responde em 20 dias, mas cadastro da SPU omite autorização

**Pergunta:** Em quanto tempo a lei de acesso dos EUA responde?

**Resposta refinada (llama3.2:3b):** A FOIA americana responde pedidos em até 20 dias úteis. Ela existe desde 1966 e cobre todas as agências federais. A lei canadense ESTMA exige declarar pagamentos acima de CAD 100 mil. No Brasil, a SPU não publica o termo individual de autorização. (fonte: /noticias/transparencia-internacional-brasil-eua-canada-acesso)

**Resposta bruta (template):** A FOIA americana responde pedidos em até 20 dias úteis. Ela existe desde 1966 e cobre todas as agências federais. A lei canadense ESTMA exige declarar pagamentos acima de CAD 100 mil. No Brasil, a SPU não publica o termo individual de autorização. (fonte: /noticias/transparencia-internacional-brasil-eua-canada-acesso)

**Fonte:** /noticias/transparencia-internacional-brasil-eua-canada-acesso

**Peça:** blog:transparencia-internacional-brasil-eua-canada-acesso · geral · /noticias/transparencia-internacional-brasil-eua-canada-acesso

#### 117. Três acervos novos do portal cruzam imóveis da União, PPP e municípios

**Pergunta:** Que três acervos novos o portal publicou sobre Minas?

**Resposta refinada (llama3.2:3b):** O portal publicou três acervos novos sobre Minas Gerais. São 553 imóveis da União, 20 contratos de PPP e 853 municípios. Cada número vem de fonte oficial e link direto. O método cruza os dados sem afirmar o que a fonte não diz. O primeiro acervo lista 553 imóveis da União em Minas Gerais. (fonte: /noticias/novos-acervos-portal-autorizacoes-ppp-cidades-metodo)

**Resposta bruta (template):** O portal publicou três acervos novos sobre Minas Gerais. São 553 imóveis da União, 20 contratos de PPP e 853 municípios. Cada número vem de fonte oficial e link direto. O método cruza os dados sem afirmar o que a fonte não diz. O primeiro acervo lista 553 imóveis da União em Minas Gerais. (fonte: /noticias/novos-acervos-portal-autorizacoes-ppp-cidades-metodo)

**Fonte:** /noticias/novos-acervos-portal-autorizacoes-ppp-cidades-metodo

**Peça:** blog:novos-acervos-portal-autorizacoes-ppp-cidades-metodo · geral · /noticias/novos-acervos-portal-autorizacoes-ppp-cidades-metodo

#### 118. Gastos de campanha 2026: publicidade, big tech e custo por voto

**Pergunta:** Quanto dinheiro as campanhas de 2026 já gastaram?

**Resposta refinada (llama3.2:3b):** A eleição de 2026 já tem R$ 3,1 bilhões em despesas pagas. A publicidade digital contratada soma R$ 405,0 milhões. As big techs receberam R$ 272,4 milhões, quase tudo da Meta. As contas fecham em 03/11/2026, e a página reúne filtros. O dinheiro da eleição de 2026 aparece em um só lugar. (fonte: /noticias/gastos-campanha-2026-publicidade-big-tech)

**Resposta bruta (template):** A eleição de 2026 já tem R$ 3,1 bilhões em despesas pagas. A publicidade digital contratada soma R$ 405,0 milhões. As big techs receberam R$ 272,4 milhões, quase tudo da Meta. As contas fecham em 03/11/2026, e a página reúne filtros. O dinheiro da eleição de 2026 aparece em um só lugar. (fonte: /noticias/gastos-campanha-2026-publicidade-big-tech)

**Fonte:** /noticias/gastos-campanha-2026-publicidade-big-tech

**Peça:** blog:gastos-campanha-2026-publicidade-big-tech · geral · /noticias/gastos-campanha-2026-publicidade-big-tech

#### 119. A mineração de MG ainda cresce, parou ou encerrou

**Pergunta:** A mineração em Minas Gerais cresce, parou ou encerrou?

⚠️ **refine descartado (números mudaram)** — vale só a resposta bruta.

**Resposta bruta (template):** Estado da janela de 24 meses: ativa. Última detecção em 2024; janela de 24 meses termina em 2024. O pico de área nova foi em 2020, que não é o ano do teto da série (1985). No último ano (2024) apareceram 4.234,4 hectares novos. Estado calculado em 29/09/2026 por `lib/cavas/serie.ts`. (fonte: /mineracao/cavas)

**Fonte:** /mineracao/cavas

**Peça:** cavas:estado-janela · geral · /mineracao/cavas

#### 120. Em operação, indício ou sem cadastro: os três estados de uma cava

**Pergunta:** O que são os três estados de uma cava?

**Resposta refinada (llama3.2:3b):** Amostra de 120 cavas: 84 em operação, 34 com indício processual e 2 sem cadastro na ANM. O estado em operação significa dentro de polígono ANM em fase que autoriza extrair na data da coleta. O estado com indício é dentro de polígono ANM sem autorização — conferir na ANM. (fonte: /mineracao/cavas)

**Resposta bruta (template):** Amostra de 120 cavas: 84 em operação, 34 com indício processual e 2 sem cadastro na ANM. Estado em operação significa dentro de polígono ANM em fase que autoriza extrair na data da coleta. Estado com indício é dentro de polígono ANM sem autorização — conferir na ANM. (fonte: /mineracao/cavas)

**Fonte:** /mineracao/cavas

**Peça:** cavas:tres-estados · geral · /mineracao/cavas

#### 121. O que a base de cavas ainda não responde

**Pergunta:** O que a base de cavas ainda não responde?

⚠️ **refine descartado (fonte alterada pelo modelo)** — vale só a resposta bruta.

**Resposta bruta (template):** Lacunas declaradas da Fase 5: a coleta cobre só Minas Gerais, não todas as UFs. Não há distância até terra indígena nem área de conservação por cava. Não há imagem de satélite com data de cada cava. A resolução é 30 metros por pixel: cava pequena ou sob nuvem aparece atrasada. (fonte: /mineracao/cavas)

**Fonte:** /mineracao/cavas

**Peça:** cavas:limites · geral · /mineracao/cavas

#### 122. Diretas Já

**Pergunta:** O que foi a campanha das Diretas Já?

**Resposta refinada (llama3.2:3b):** Diretas Já (1983-1984): Multidões tomaram as ruas de várias capitais pedindo eleição direta para presidente. A emenda das Diretas foi derrotada em 1984, mas a campanha devolveu a voz popular à política nacional. Fonte: Câmara dos Deputados, 2014. (fonte: https://www2.camara.leg.br/atividade-legislativa/plenario/discursos/escrevendohistoria/diretas-ja)

**Resposta bruta (template):** Diretas Já (1983-1984): Multidões tomaram as ruas de várias capitais pedindo eleição direta para presidente. A emenda das Diretas foi derrotada em 1984, mas a campanha devolveu a voz popular à política nacional. Fonte: Câmara dos Deputados, 2014. (fonte: https://www2.camara.leg.br/atividade-legislativa/plenario/discursos/escrevendohistoria/diretas-ja)

**Fonte:** https://www2.camara.leg.br/atividade-legislativa/plenario/discursos/escrevendohistoria/diretas-ja

**Peça:** memoria:pais:br:diretas-ja · geral · /memoria

#### 123. Lei da Anistia e a luta pela anistia ampla

**Pergunta:** O que fez a Lei da Anistia de 1979?

⚠️ **refine descartado (saída inválida do modelo)** — vale só a resposta bruta.

**Resposta bruta (template):** Lei da Anistia e a luta pela anistia ampla (1979): Em 1979, a Lei da Anistia devolveu direitos políticos a perseguidos pela ditadura. A luta por uma anistia ampla foi feita por famílias, estudantes, advogados e movimentos sociais. Fonte: Câmara dos Deputados, 2014. (fonte: https://www2.camara.leg.br/atividade-legislativa/plenario/discursos/escrevendohistoria/destaque-de-materias/lei-da-anistia)

**Fonte:** https://www2.camara.leg.br/atividade-legislativa/plenario/discursos/escrevendohistoria/destaque-de-materias/lei-da-anistia

**Peça:** memoria:pais:br:lei-da-anistia-e-a-luta-pela-anistia-amp · geral · /memoria

#### 124. Abolição e resistência negra

**Pergunta:** Quando o Brasil aboliu a escravidão?

**Resposta refinada (llama3.2:3b):** Abolição e resistência negra (1888): Em 13 de maio de 1888, a Lei Áurea declarou extinta a escravidão no Brasil. A data coroa uma resistência que veio de antes dos quilombos e continuou depois da abolição. Fonte: Fundação Cultural Palmares, 2018. (fonte: https://www.gov.br/palmares/pt-br/assuntos/noticias/130-anos-da-abolicao-da-escravidao-fundacao-palmares-atua-para-promover-mobilidade-social-dos-afro-brasileiros)

**Resposta bruta (template):** Abolição e resistência negra (1888): Em 13 de maio de 1888, a Lei Áurea declarou extinta a escravidão no Brasil. A data coroa uma resistência que veio de antes dos quilombos e continuou depois da abolição. Fonte: Fundação Cultural Palmares, 2018. (fonte: https://www.gov.br/palmares/pt-br/assuntos/noticias/130-anos-da-abolicao-da-escravidao-fundacao-palmares-atua-para-promover-mobilidade-social-dos-afro-brasileiros)

**Fonte:** https://www.gov.br/palmares/pt-br/assuntos/noticias/130-anos-da-abolicao-da-escravidao-fundacao-palmares-atua-para-promover-mobilidade-social-dos-afro-brasileiros

**Peça:** memoria:pais:br:abolicao-e-resistencia-negra · geral · /memoria

#### 125. Comissão Nacional da Verdade

**Pergunta:** O que a Comissão Nacional da Verdade investigou?

**Resposta refinada (llama3.2:3b):** Comissão Nacional da Verdade (2012-2014): A Comissão Nacional da Verdade investigou as violações de direitos humanos da ditadura. O relatório final, de 2014, reúne memória e verdade para o país. Fonte: Arquivo Nacional — Memórias Reveladas, 2014. (fonte: https://cnv.memoriasreveladas.gov.br/)

**Resposta bruta (template):** Comissão Nacional da Verdade (2012-2014): A Comissão Nacional da Verdade investigou as violações de direitos humanos da ditadura. O relatório final, de 2014, reúne memória e verdade para o país. Fonte: Arquivo Nacional — Memórias Reveladas, 2014. (fonte: https://cnv.memoriasreveladas.gov.br/)

**Fonte:** https://cnv.memoriasreveladas.gov.br/

**Peça:** memoria:pais:br:comissao-nacional-da-verdade · geral · /memoria

#### 126. Assembleia Nacional Constituinte

**Pergunta:** O que foi a Assembleia Nacional Constituinte?

⚠️ **refine descartado (fonte alterada pelo modelo)** — vale só a resposta bruta.

**Resposta bruta (template):** Assembleia Nacional Constituinte (1987-1988): A Assembleia Nacional Constituinte redigiu a Constituição Cidadã, entre 1987 e 1988. Emendas populares e participação social marcaram o processo. Fonte: Câmara dos Deputados, 2013. (fonte: https://www2.camara.leg.br/atividade-legislativa/plenario/discursos/escrevendohistoria/25-anos-da-constituicao-de-1988/constituinte-1987-1988)

**Fonte:** https://www2.camara.leg.br/atividade-legislativa/plenario/discursos/escrevendohistoria/25-anos-da-constituicao-de-1988/constituinte-1987-1988

**Peça:** memoria:pais:br:assembleia-nacional-constituinte · geral · /memoria

#### 127. Resistência indígena aos grandes projetos da ditadura

**Pergunta:** Como os povos indígenas resistiram às obras da ditadura?

⚠️ **refine descartado (números mudaram)** — vale só a resposta bruta.

**Resposta bruta (template):** Resistência indígena aos grandes projetos da ditadura (década de 1970-1980): Povos indígenas da Amazônia enfrentaram a abertura de estradas e grandes obras durante a ditadura. A resistência Waimiri-Atroari, diante da BR-174, é símbolo dessa luta. Fonte: Instituto Socioambiental (ISA), 2023. (fonte: https://pib.socioambiental.org/pt/Povo:Waimiri_Atroari)

**Fonte:** https://pib.socioambiental.org/pt/Povo:Waimiri_Atroari

**Peça:** memoria:regiao:norte:resistencia-indigena-aos-grandes-projeto · geral · /memoria

#### 128. Guerra de Canudos

**Pergunta:** O que aconteceu na Guerra de Canudos?

**Resposta refinada (llama3.2:3b):** Guerra de Canudos (1896-1897): No sertão da Bahia, a comunidade de Canudos, liderada por Antônio Conselheiro, resistiu a três expedições militares até 1897. A guerra é lembrada como um dos maiores conflitos do interior do país. Fonte: FGV — CPDOC, Atlas Histórico do Brasil, 2016. (fonte: https://atlas.fgv.br/verbetes/guerra-de-canudos)

**Resposta bruta (template):** Guerra de Canudos (1896-1897): No sertão da Bahia, a comunidade de Canudos, liderada por Antônio Conselheiro, resistiu a três expedições militares até 1897. A guerra é lembrada como um dos maiores conflitos do interior do país. Fonte: FGV — CPDOC, Atlas Histórico do Brasil, 2016. (fonte: https://atlas.fgv.br/verbetes/guerra-de-canudos)

**Fonte:** https://atlas.fgv.br/verbetes/guerra-de-canudos

**Peça:** memoria:regiao:nordeste:guerra-de-canudos · geral · /memoria

#### 129. Luta pela terra no Centro-Oeste

**Pergunta:** Como é a luta pela terra no Centro-Oeste?

**Resposta refinada (llama3.2:3b):** Luta pela terra no Centro-Oeste (séculos XX e XXI): No Cerrado e no Pantanal, posseiros, indígenas e trabalhadores rurais resistiram à expansão da fronteira agrícola. Os conflitos pela terra marcam a região até hoje. Fonte: Comissão Pastoral da Terra (CPT), 2024. (fonte: https://www.cptnacional.org.br/)

**Resposta bruta (template):** Luta pela terra no Centro-Oeste (séculos XX e XXI): No Cerrado e no Pantanal, posseiros, indígenas e trabalhadores rurais resistiram à expansão da fronteira agrícola. Os conflitos pela terra marcam a região até hoje. Fonte: Comissão Pastoral da Terra (CPT), 2024. (fonte: https://www.cptnacional.org.br/)

**Fonte:** https://www.cptnacional.org.br/

**Peça:** memoria:regiao:centro-oeste:luta-pela-terra-no-centro-oeste · geral · /memoria

#### 130. Greves metalúrgicas do ABC paulista

**Pergunta:** O que mudaram as greves metalúrgicas do ABC?

**Resposta refinada (llama3.2:3b):** Greves metalúrgicas do ABC paulista (1978-1980): Operários metalúrgicos do ABC paulista paralisaram fábricas e criaram um sindicalismo novo. As greves impulsionaram a luta pela redemocratização no país. Fonte: DIEESE, 2019. (fonte: https://www.dieese.org.br/)

**Resposta bruta (template):** Greves metalúrgicas do ABC paulista (1978-1980): Operários metalúrgicos do ABC paulista paralisaram fábricas e criaram um sindicalismo novo. As greves impulsionaram a luta pela redemocratização no país. Fonte: DIEESE, 2019. (fonte: https://www.dieese.org.br/)

**Fonte:** https://www.dieese.org.br/

**Peça:** memoria:regiao:sudeste:greves-metalurgicas-do-abc-paulista · geral · /memoria

#### 131. Guerra do Contestado

**Pergunta:** O que foi a Guerra do Contestado?

**Resposta refinada (llama3.2:3b):** Guerra do Contestado (1912-1916): Camponeses do sul se levantaram contra a expropriação de suas terras na Guerra do Contestado. A luta atravessou o Paraná e Santa Catarina. Fonte: FGV — CPDOC, Atlas Histórico do Brasil, 2016. (fonte: https://atlas.fgv.br/verbetes/guerra-do-contestado)

**Resposta bruta (template):** Guerra do Contestado (1912-1916): Camponeses do sul se levantaram contra a expropriação de suas terras na Guerra do Contestado. A luta atravessou o Paraná e Santa Catarina. Fonte: FGV — CPDOC, Atlas Histórico do Brasil, 2016. (fonte: https://atlas.fgv.br/verbetes/guerra-do-contestado)

**Fonte:** https://atlas.fgv.br/verbetes/guerra-do-contestado

**Peça:** memoria:regiao:sul:guerra-do-contestado · geral · /memoria

#### 132. Revolução Acreana

**Pergunta:** O que foi a Revolução Acreana?

**Resposta refinada (llama3.2:3b):** Revolução Acreana (1899-1903): Seringueiros e moradores do Acre se levantaram para integrar a região ao Brasil, contra o domínio boliviano. A luta terminou com o Tratado de Petrópolis, em 1903. Fonte: Ministério do Turismo, 2023. (fonte: https://www.gov.br/turismo/pt-br/assuntos/noticias/rio-branco-de-seringal-a-capital-do-acre)

**Resposta bruta (template):** Revolução Acreana (1899-1903): Seringueiros e moradores do Acre se levantaram para integrar a região ao Brasil, contra o domínio boliviano. A luta terminou com o Tratado de Petrópolis, em 1903. Fonte: Ministério do Turismo, 2023. (fonte: https://www.gov.br/turismo/pt-br/assuntos/noticias/rio-branco-de-seringal-a-capital-do-acre)

**Fonte:** https://www.gov.br/turismo/pt-br/assuntos/noticias/rio-branco-de-seringal-a-capital-do-acre

**Peça:** memoria:uf:ac:revolucao-acreana · geral · /memoria

#### 133. Quilombo dos Palmares

**Pergunta:** O que foi o Quilombo dos Palmares?

⚠️ **refine descartado (fonte alterada pelo modelo)** — vale só a resposta bruta.

**Resposta bruta (template):** Quilombo dos Palmares (século XVII): Na Serra da Barriga, em Alagoas, o Quilombo dos Palmares resistiu por quase todo o século XVII. A memória de Zumbi e da comunidade é hoje patrimônio do povo negro. Fonte: Fundação Cultural Palmares, 2020. (fonte: https://www.gov.br/palmares/pt-br/departamentos/protecao-preservacao-e-articulacao/serra-da-barriga-1/parque-memorial-quilombo-dos-palmares)

**Fonte:** https://www.gov.br/palmares/pt-br/departamentos/protecao-preservacao-e-articulacao/serra-da-barriga-1/parque-memorial-quilombo-dos-palmares

**Peça:** memoria:uf:al:quilombo-dos-palmares · geral · /memoria

#### 134. Resistência do povo Mura

**Pergunta:** Como o povo Mura resistiu à colonização?

**Resposta refinada (llama3.2:3b):** Resistência do povo Mura (século XVIII): O povo Mura resistiu por décadas à ocupação colonial no médio Amazonas. Sua presença reafirma a história indígena do estado. Fonte: Instituto Socioambiental (ISA), 2023. (fonte: https://pib.socioambiental.org/pt/Povo:Mura)

**Resposta bruta (template):** Resistência do povo Mura (século XVIII): O povo Mura resistiu por décadas à ocupação colonial no médio Amazonas. Sua presença reafirma a história indígena do estado. Fonte: Instituto Socioambiental (ISA), 2023. (fonte: https://pib.socioambiental.org/pt/Povo:Mura)

**Fonte:** https://pib.socioambiental.org/pt/Povo:Mura

**Peça:** memoria:uf:am:resistencia-do-povo-mura · geral · /memoria

#### 135. Resistência do povo Wajãpi

**Pergunta:** Como o povo Wajãpi mantém sua língua e território?

⚠️ **refine descartado (fonte alterada pelo modelo)** — vale só a resposta bruta.

**Resposta bruta (template):** Resistência do povo Wajãpi (séculos XX e XXI): O povo Wajãpi permanece no Amapá e mantém sua língua, seus saberes e seu território. A resistência indígena é parte antiga da história do estado. Fonte: Instituto Socioambiental (ISA), 2023. (fonte: https://pib.socioambiental.org/pt/Povo:Waj%C3%A3pi)

**Fonte:** https://pib.socioambiental.org/pt/Povo:Waj%C3%A3pi

**Peça:** memoria:uf:ap:resistencia-do-povo-wajapi · geral · /memoria

#### 136. Revolta dos Malês

**Pergunta:** O que foi a Revolta dos Malês?

**Resposta refinada (llama3.2:3b):** Revolta dos Malês (1835): Em Salvador, africanos muçulmanos escravizados se organizaram e se levantaram em 1835. A Revolta dos Malês é uma das maiores insurreições urbanas do Brasil. Fonte: Universidade Estadual de Campinas (UNICAMP), 2009. (fonte: https://www.ifch.unicamp.br/ojs/index.php/rhs/article/viewFile/231/217)

**Resposta bruta (template):** Revolta dos Malês (1835): Em Salvador, africanos muçulmanos escravizados se organizaram e se levantaram em 1835. A Revolta dos Malês é uma das maiores insurreições urbanas do Brasil. Fonte: Universidade Estadual de Campinas (UNICAMP), 2009. (fonte: https://www.ifch.unicamp.br/ojs/index.php/rhs/article/viewFile/231/217)

**Fonte:** https://www.ifch.unicamp.br/ojs/index.php/rhs/article/viewFile/231/217

**Peça:** memoria:uf:ba:revolta-dos-males · geral · /memoria

#### 137. Caldeirão de Santa Cruz do Deserto

**Pergunta:** O que foi o Caldeirão de Santa Cruz do Deserto?

**Resposta refinada (llama3.2:3b):** Caldeirão de Santa Cruz do Deserto (1936): No Cariri cearense, a comunidade camponesa do Caldeirão reuniu famílias sob o beato José Lourenço. A comunidade foi destruída em 1936, mas segue lembrada como experiência de terra e trabalho. Fonte: Comissão Pastoral da Terra (CPT), 2024. (fonte: https://www.cptnacional.org.br/)

**Resposta bruta (template):** Caldeirão de Santa Cruz do Deserto (1936): No Cariri cearense, a comunidade camponesa do Caldeirão reuniu famílias sob o beato José Lourenço. A comunidade foi destruída em 1936, mas segue lembrada como experiência de terra e trabalho. Fonte: Comissão Pastoral da Terra (CPT), 2024. (fonte: https://www.cptnacional.org.br/)

**Fonte:** https://www.cptnacional.org.br/

**Peça:** memoria:uf:ce:caldeirao-de-santa-cruz-do-deserto · geral · /memoria

#### 138. Construção de Brasília e os candangos

**Pergunta:** Quem construiu a cidade de Brasília?

**Resposta refinada (llama3.2:3b):** Construção de Brasília e os candangos (1957-1960): Os candangos ergueram Brasília no planalto central. A nova capital foi construída pelo trabalho de milhares de operários que migraram para lá. Fonte: Câmara dos Deputados, 2010. (fonte: https://www2.camara.leg.br/atividade-legislativa/plenario/discursos/escrevendohistoria/destaque-de-materias/50-anos-de-brasilia)

**Resposta bruta (template):** Construção de Brasília e os candangos (1957-1960): Os candangos ergueram Brasília no planalto central. A nova capital foi construída pelo trabalho de milhares de operários que migraram para lá. Fonte: Câmara dos Deputados, 2010. (fonte: https://www2.camara.leg.br/atividade-legislativa/plenario/discursos/escrevendohistoria/destaque-de-materias/50-anos-de-brasilia)

**Fonte:** https://www2.camara.leg.br/atividade-legislativa/plenario/discursos/escrevendohistoria/destaque-de-materias/50-anos-de-brasilia

**Peça:** memoria:uf:df:construcao-de-brasilia-e-os-candangos · geral · /memoria

#### 139. Insurreição de Queimado

**Pergunta:** O que foi a Insurreição de Queimado?

⚠️ **refine descartado (fonte alterada pelo modelo)** — vale só a resposta bruta.

**Resposta bruta (template):** Insurreição de Queimado (1848-1849): Pessoas escravizadas de uma fazenda em Queimado se levantaram pela liberdade prometida e não cumprida. A insurreição de 1849 foi duramente reprimida. Fonte: Prefeitura da Serra (ES), 2025. (fonte: https://www.serra.es.gov.br/noticias/insurreicao-de-queimado-completa-176-anos-nesta-quarta-feira-19)

**Fonte:** https://www.serra.es.gov.br/noticias/insurreicao-de-queimado-completa-176-anos-nesta-quarta-feira-19

**Peça:** memoria:uf:es:insurreicao-de-queimado · geral · /memoria

#### 140. Guerra de Trombas e Formoso

**Pergunta:** O que foi a Guerra de Trombas e Formoso?

**Resposta refinada (llama3.2:3b):** Guerra de Trombas e Formoso (1949-1956): Posseiros do norte de Goiás resistiram a jagunços e grileiros pela posse da terra. A luta de Trombas e Formoso é marco da causa camponesa no estado. Fonte: Comissão Pastoral da Terra (CPT), 2024. (fonte: https://www.cptnacional.org.br/)

**Resposta bruta (template):** Guerra de Trombas e Formoso (1949-1956): Posseiros do norte de Goiás resistiram a jagunços e grileiros pela posse da terra. A luta de Trombas e Formoso é marco da causa camponesa no estado. Fonte: Comissão Pastoral da Terra (CPT), 2024. (fonte: https://www.cptnacional.org.br/)

**Fonte:** https://www.cptnacional.org.br/

**Peça:** memoria:uf:go:guerra-de-trombas-e-formoso · geral · /memoria

#### 141. Balaiada

**Pergunta:** O que foi a Balaiada?

⚠️ **refine descartado (fonte alterada pelo modelo)** — vale só a resposta bruta.

**Resposta bruta (template):** Balaiada (1838-1841): No Maranhão, vaqueiros, sertanejos e escravizados se levantaram na Balaiada. O movimento mostrou a força dos pobres do interior contra os poderosos da província. Fonte: Multirio — Prefeitura do Rio de Janeiro, 2020. (fonte: https://multirio.rio.rj.gov.br/index.php/estude/historia-do-brasil/brasil-monarquico/91-per%C3%ADodo-regencial/8943-revoltas-no-norte-a-cabanagem,-a-balaiada-e-a-sabinada)

**Fonte:** https://multirio.rio.rj.gov.br/index.php/estude/historia-do-brasil/brasil-monarquico/91-per%C3%ADodo-regencial/8943-revoltas-no-norte-a-cabanagem,-a-balaiada-e-a-sabinada

**Peça:** memoria:uf:ma:balaiada · geral · /memoria

#### 142. Inconfidência Mineira

**Pergunta:** O que foi a Inconfidência Mineira?

**Resposta refinada (llama3.2:3b):** Inconfidência Mineira (1789): Em Minas, mineiros e letrados conspiraram contra a Coroa portuguesa. A Inconfidência Mineira virou símbolo da luta pela liberdade no Brasil. Fonte: Instituto Brasileiro de Museus (Ibram), 2024. (fonte: https://museudainconfidencia.museus.gov.br/)

**Resposta bruta (template):** Inconfidência Mineira (1789): Em Minas, mineiros e letrados conspiraram contra a Coroa portuguesa. A Inconfidência Mineira virou símbolo da luta pela liberdade no Brasil. Fonte: Instituto Brasileiro de Museus (Ibram), 2024. (fonte: https://museudainconfidencia.museus.gov.br/)

**Fonte:** https://museudainconfidencia.museus.gov.br/

**Peça:** memoria:uf:mg:inconfidencia-mineira · geral · /memoria

#### 143. Resistência Guarani e Kaiowá pela terra

**Pergunta:** Como os Guarani e Kaiowá lutam pela terra?

**Resposta refinada (llama3.2:3b):** Resistência Guarani e Kaiowá pela terra (séculos XX e XXI): No Mato Grosso do Sul, os povos Guarani e Kaiowá resistem pela retomada de suas terras. A luta é antiga e segue documentada por instituições públicas. Fonte: Instituto Socioambiental (ISA), 2023. (fonte: https://pib.socioambiental.org/pt/Povo:Guarani_Kaiow%C3%A1)

**Resposta bruta (template):** Resistência Guarani e Kaiowá pela terra (séculos XX e XXI): No Mato Grosso do Sul, os povos Guarani e Kaiowá resistem pela retomada de suas terras. A luta é antiga e segue documentada por instituições públicas. Fonte: Instituto Socioambiental (ISA), 2023. (fonte: https://pib.socioambiental.org/pt/Povo:Guarani_Kaiow%C3%A1)

**Fonte:** https://pib.socioambiental.org/pt/Povo:Guarani_Kaiow%C3%A1

**Peça:** memoria:uf:ms:resistencia-guarani-e-kaiowa-pela-terra · geral · /memoria

#### 144. Resistência do povo Xavante

**Pergunta:** Como o povo Xavante resistiu à colonização?

**Resposta refinada (llama3.2:3b):** Resistência do povo Xavante (século XX): No Mato Grosso, o povo Xavante enfrentou as frentes de colonização e segue lutando por suas terras. Sua história é de resistência na fronteira agrícola. Fonte: Instituto Socioambiental (ISA), 2023. (fonte: https://pib.socioambiental.org/pt/Povo:Xavante)

**Resposta bruta (template):** Resistência do povo Xavante (século XX): No Mato Grosso, o povo Xavante enfrentou as frentes de colonização e segue lutando por suas terras. Sua história é de resistência na fronteira agrícola. Fonte: Instituto Socioambiental (ISA), 2023. (fonte: https://pib.socioambiental.org/pt/Povo:Xavante)

**Fonte:** https://pib.socioambiental.org/pt/Povo:Xavante

**Peça:** memoria:uf:mt:resistencia-do-povo-xavante · geral · /memoria

#### 145. Cabanagem

**Pergunta:** O que foi a Cabanagem?

**Resposta refinada (llama3.2:3b):** Cabanagem (1835-1840): Indígenas, mestiços e pobres do Grão-Pará tomaram Belém na Cabanagem. A revolta chegou a proclamar um governo próprio no norte. Fonte: Multirio — Prefeitura do Rio de Janeiro, 2020. (fonte: https://multirio.rio.rj.gov.br/index.php/estude/historia-do-brasil/brasil-monarquico/91-per%C3%ADodo-regencial/8943-revoltas-no-norte-a-cabanagem,-a-balaiada-e-a-sabinada)

**Resposta bruta (template):** Cabanagem (1835-1840): Indígenas, mestiços e pobres do Grão-Pará tomaram Belém na Cabanagem. A revolta chegou a proclamar um governo próprio no norte. Fonte: Multirio — Prefeitura do Rio de Janeiro, 2020. (fonte: https://multirio.rio.rj.gov.br/index.php/estude/historia-do-brasil/brasil-monarquico/91-per%C3%ADodo-regencial/8943-revoltas-no-norte-a-cabanagem,-a-balaiada-e-a-sabinada)

**Fonte:** https://multirio.rio.rj.gov.br/index.php/estude/historia-do-brasil/brasil-monarquico/91-per%C3%ADodo-regencial/8943-revoltas-no-norte-a-cabanagem,-a-balaiada-e-a-sabinada

**Peça:** memoria:uf:pa:cabanagem · geral · /memoria

#### 146. Revolta de Princesa

**Pergunta:** O que foi a Revolta de Princesa?

⚠️ **refine descartado (fonte alterada pelo modelo)** — vale só a resposta bruta.

**Resposta bruta (template):** Revolta de Princesa (1930): Em 1930, a cidade de Princesa rompeu com o governo da Paraíba e instalou seu próprio comando. A revolta integrou a disputa política que antecedeu a Revolução de 1930. Fonte: Empresa Paraibana de Comunicação (A União), 2020. (fonte: https://auniao.pb.gov.br/servicos/copy_of_jornal-a-uniao/dec-30)

**Fonte:** https://auniao.pb.gov.br/servicos/copy_of_jornal-a-uniao/dec-30

**Peça:** memoria:uf:pb:revolta-de-princesa · geral · /memoria

#### 147. Memória de Palmares e de Zumbi

**Pergunta:** Quem foi Zumbi e por que ele é lembrado?

**Resposta refinada (llama3.2:3b):** Memória de Palmares e de Zumbi (século XVII): Pernambuco guarda parte da memória de Palmares, o maior quilombo do Brasil. Zumbi, símbolo da resistência negra, é lembrado em todo o país. Fonte: Fundação Cultural Palmares, 2020. (fonte: https://www.gov.br/palmares/pt-br/assuntos/noticias/zumbi-heroi-nacional)

**Resposta bruta (template):** Memória de Palmares e de Zumbi (século XVII): Pernambuco guarda parte da memória de Palmares, o maior quilombo do Brasil. Zumbi, símbolo da resistência negra, é lembrado em todo o país. Fonte: Fundação Cultural Palmares, 2020. (fonte: https://www.gov.br/palmares/pt-br/assuntos/noticias/zumbi-heroi-nacional)

**Fonte:** https://www.gov.br/palmares/pt-br/assuntos/noticias/zumbi-heroi-nacional

**Peça:** memoria:uf:pe:memoria-de-palmares-e-de-zumbi · geral · /memoria

#### 148. Batalha do Jenipapo

**Pergunta:** O que foi a Batalha do Jenipapo?

**Resposta refinada (llama3.2:3b):** Batalha do Jenipapo (1823): Sertanejos e vaqueiros do Piauí pegaram em armas pela independência do Brasil na Batalha do Jenipapo. O combate é lembrado como o dia em que o povo entrou na luta. Fonte: IPHAN, 2010. (fonte: http://portal.iphan.gov.br/uploads/ckfinder/arquivos/Disserta%C3%A7%C3%A3o%20Deborah%20Padula%20Kishimoto.pdf)

**Resposta bruta (template):** Batalha do Jenipapo (1823): Sertanejos e vaqueiros do Piauí pegaram em armas pela independência do Brasil na Batalha do Jenipapo. O combate é lembrado como o dia em que o povo entrou na luta. Fonte: IPHAN, 2010. (fonte: http://portal.iphan.gov.br/uploads/ckfinder/arquivos/Disserta%C3%A7%C3%A3o%20Deborah%20Padula%20Kishimoto.pdf)

**Fonte:** http://portal.iphan.gov.br/uploads/ckfinder/arquivos/Disserta%C3%A7%C3%A3o%20Deborah%20Padula%20Kishimoto.pdf

**Peça:** memoria:uf:pi:batalha-do-jenipapo · geral · /memoria

#### 149. Guerra do Contestado no Paraná

**Pergunta:** Como a Guerra do Contestado marcou o Paraná?

**Resposta refinada (llama3.2:3b):** Guerra do Contestado no Paraná (1912-1916): Posseiros do Contestado, entre o Paraná e Santa Catarina, resistiram à expulsão de suas terras. A guerra virou símbolo da luta camponesa no sul. Fonte: FGV — CPDOC, Atlas Histórico do Brasil, 2016. (fonte: https://atlas.fgv.br/verbetes/guerra-do-contestado)

**Resposta bruta (template):** Guerra do Contestado no Paraná (1912-1916): Posseiros do Contestado, entre o Paraná e Santa Catarina, resistiram à expulsão de suas terras. A guerra virou símbolo da luta camponesa no sul. Fonte: FGV — CPDOC, Atlas Histórico do Brasil, 2016. (fonte: https://atlas.fgv.br/verbetes/guerra-do-contestado)

**Fonte:** https://atlas.fgv.br/verbetes/guerra-do-contestado

**Peça:** memoria:uf:pr:guerra-do-contestado-no-parana · geral · /memoria

#### 150. Revolta da Vacina

**Pergunta:** O que foi a Revolta da Vacina?

⚠️ **refine descartado (números mudaram)** — vale só a resposta bruta.

**Resposta bruta (template):** Revolta da Vacina (1904): No Rio de Janeiro, a obrigatoriedade da vacina e as remoções sanitárias provocaram a Revolta da Vacina, em 1904. A população pobre se levantou contra um plano autoritário. Fonte: FGV — CPDOC, Atlas Histórico do Brasil, 2016. (fonte: https://atlas.fgv.br/verbetes/revolta-da-vacina)

**Fonte:** https://atlas.fgv.br/verbetes/revolta-da-vacina

**Peça:** memoria:uf:rj:revolta-da-vacina · geral · /memoria

#### 151. Mártires de Cunhaú e Uruaçu

**Pergunta:** Quem foram os Mártires de Cunhaú e Uruaçu?

**Resposta refinada (llama3.2:3b):** Mártires de Cunhaú e Uruaçu (1645): No interior do Rio Grande do Norte, colonos e religiosos foram mortos por forças ligadas aos holandeses em 1645. A memória dos mártires de Cunhaú e Uruaçu é guardada até hoje. Fonte: Universidade Católica Dom Bosco (UCDB), 2019. (fonte: https://site.ucdb.br/santos-do-dia/protomartires-do-brasil/223/)

**Resposta bruta (template):** Mártires de Cunhaú e Uruaçu (1645): No interior do Rio Grande do Norte, colonos e religiosos foram mortos por forças ligadas aos holandeses em 1645. A memória dos mártires de Cunhaú e Uruaçu é guardada até hoje. Fonte: Universidade Católica Dom Bosco (UCDB), 2019. (fonte: https://site.ucdb.br/santos-do-dia/protomartires-do-brasil/223/)

**Fonte:** https://site.ucdb.br/santos-do-dia/protomartires-do-brasil/223/

**Peça:** memoria:uf:rn:martires-de-cunhau-e-uruacu · geral · /memoria

#### 152. Massacre de Corumbiara

**Pergunta:** O que foi o Massacre de Corumbiara?

**Resposta refinada (llama3.2:3b):** Massacre de Corumbiara (1995): Em Corumbiara, trabalhadores rurais sem terra foram atacados por forças policiais em 1995. O caso é marco da luta pela terra e dos direitos humanos no campo. Fonte: Câmara dos Deputados, 2010. (fonte: http://www2.camara.leg.br/camaranoticias/noticias/DIREITOS-HUMANOS/440982-CCJ-APROVA-ANISTIA-A-SEM-TERRAS-E-POLICIAIS-DO-MASSACRE-DE-CORUMBIARA.html)

**Resposta bruta (template):** Massacre de Corumbiara (1995): Em Corumbiara, trabalhadores rurais sem terra foram atacados por forças policiais em 1995. O caso é marco da luta pela terra e dos direitos humanos no campo. Fonte: Câmara dos Deputados, 2010. (fonte: http://www2.camara.leg.br/camaranoticias/noticias/DIREITOS-HUMANOS/440982-CCJ-APROVA-ANISTIA-A-SEM-TERRAS-E-POLICIAIS-DO-MASSACRE-DE-CORUMBIARA.html)

**Fonte:** http://www2.camara.leg.br/camaranoticias/noticias/DIREITOS-HUMANOS/440982-CCJ-APROVA-ANISTIA-A-SEM-TERRAS-E-POLICIAIS-DO-MASSACRE-DE-CORUMBIARA.html

**Peça:** memoria:uf:ro:massacre-de-corumbiara · geral · /memoria

#### 153. Luta Yanomami pela terra

**Pergunta:** Como os Yanomami lutam pela terra?

**Resposta refinada (llama3.2:3b):** Luta Yanomami pela terra (décadas de 1980-1990): O povo Yanomami resiste no extremo norte por suas terras e pela proteção da floresta. A luta garantiu a demarcação da Terra Indígena Yanomami na década de 1990. Fonte: Instituto Socioambiental (ISA), 2023. (fonte: https://pib.socioambiental.org/pt/Povo:Yanomami)

**Resposta bruta (template):** Luta Yanomami pela terra (décadas de 1980-1990): O povo Yanomami resiste no extremo norte por suas terras e pela proteção da floresta. A luta garantiu a demarcação da Terra Indígena Yanomami na década de 1990. Fonte: Instituto Socioambiental (ISA), 2023. (fonte: https://pib.socioambiental.org/pt/Povo:Yanomami)

**Fonte:** https://pib.socioambiental.org/pt/Povo:Yanomami

**Peça:** memoria:uf:rr:luta-yanomami-pela-terra · geral · /memoria

#### 154. Revolução Farroupilha

**Pergunta:** O que foi a Revolução Farroupilha?

**Resposta refinada (llama3.2:3b):** Revolução Farroupilha (1835-1845): No Rio Grande do Sul, estancieiros e peões se levantaram contra o governo imperial na Revolução Farroupilha. Os farroupilhas chegaram a proclamar a República de Piratini. Fonte: Universidade de São Paulo (USP), 2015. (fonte: https://www.revistas.usp.br/revhistoria/article/view/89008)

**Resposta bruta (template):** Revolução Farroupilha (1835-1845): No Rio Grande do Sul, estancieiros e peões se levantaram contra o governo imperial na Revolução Farroupilha. Os farroupilhas chegaram a proclamar a República de Piratini. Fonte: Universidade de São Paulo (USP), 2015. (fonte: https://www.revistas.usp.br/revhistoria/article/view/89008)

**Fonte:** https://www.revistas.usp.br/revhistoria/article/view/89008

**Peça:** memoria:uf:rs:revolucao-farroupilha · geral · /memoria

#### 155. Guerra do Contestado

**Pergunta:** O que foi a Guerra do Contestado?

**Resposta refinada (llama3.2:3b):** Guerra do Contestado (1912-1916): Em Santa Catarina, camponeses que perderam suas terras se organizaram e resistiram na Guerra do Contestado. A luta envolveu milhares de pessoas do sertão catarinense. Fonte: Senado Federal — Agência Senado, 2016. (fonte: https://www12.senado.leg.br/noticias/materias/2016/07/01/ha-100-anos-o-fim-da-sangrenta-guerra-do-contestado)

**Resposta bruta (template):** Guerra do Contestado (1912-1916): Em Santa Catarina, camponeses que perderam suas terras se organizaram e resistiram na Guerra do Contestado. A luta envolveu milhares de pessoas do sertão catarinense. Fonte: Senado Federal — Agência Senado, 2016. (fonte: https://www12.senado.leg.br/noticias/materias/2016/07/01/ha-100-anos-o-fim-da-sangrenta-guerra-do-contestado)

**Fonte:** https://www12.senado.leg.br/noticias/materias/2016/07/01/ha-100-anos-o-fim-da-sangrenta-guerra-do-contestado

**Peça:** memoria:uf:sc:guerra-do-contestado · geral · /memoria

#### 156. Emancipação política de Sergipe

**Pergunta:** Quando Sergipe se emancipou da Bahia?

**Resposta refinada (llama3.2:3b):** Emancipação política de Sergipe (1820): Sergipe conquistou sua autonomia política em 1820, separando-se da capitania da Bahia. A emancipação é marco da identidade do estado. Fonte: Governo do Estado de Sergipe, 2020. (fonte: https://www.se.gov.br/noticias/Governo/sergipe_celebra_200_anos_de_emancipacao_politica)

**Resposta bruta (template):** Emancipação política de Sergipe (1820): Sergipe conquistou sua autonomia política em 1820, separando-se da capitania da Bahia. A emancipação é marco da identidade do estado. Fonte: Governo do Estado de Sergipe, 2020. (fonte: https://www.se.gov.br/noticias/Governo/sergipe_celebra_200_anos_de_emancipacao_politica)

**Fonte:** https://www.se.gov.br/noticias/Governo/sergipe_celebra_200_anos_de_emancipacao_politica

**Peça:** memoria:uf:se:emancipacao-politica-de-sergipe · geral · /memoria

#### 157. Diretas Já no Vale do Anhangabaú

**Pergunta:** O que aconteceu no Vale do Anhangabaú em 1984?

⚠️ **refine descartado (fonte alterada pelo modelo)** — vale só a resposta bruta.

**Resposta bruta (template):** Diretas Já no Vale do Anhangabaú (1984): Em 1984, o Vale do Anhangabaú, em São Paulo, recebeu uma das maiores manifestações das Diretas Já. A cidade foi palco central da campanha pela eleição direta. Fonte: Câmara dos Deputados, 2014. (fonte: https://www2.camara.leg.br/atividade-legislativa/plenario/discursos/escrevendohistoria/diretas-ja)

**Fonte:** https://www2.camara.leg.br/atividade-legislativa/plenario/discursos/escrevendohistoria/diretas-ja

**Peça:** memoria:uf:sp:diretas-ja-no-vale-do-anhangabau · geral · /memoria

#### 158. Quilombo Kalunga

**Pergunta:** O que é o Quilombo Kalunga?

**Resposta refinada (llama3.2:3b):** Quilombo Kalunga (século XVIII até hoje): O Quilombo Kalunga, no Tocantins e em Goiás, é o maior território quilombola do país. A comunidade luta há séculos pelo reconhecimento de suas terras. Fonte: SciELO, 2016. (fonte: http://www.scielo.br/j/his/a/jtQFPnNpKRmmzcyPqBQddmP/?lang=pt)

**Resposta bruta (template):** Quilombo Kalunga (século XVIII até hoje): O Quilombo Kalunga, no Tocantins e em Goiás, é o maior território quilombola do país. A comunidade luta há séculos pelo reconhecimento de suas terras. Fonte: SciELO, 2016. (fonte: http://www.scielo.br/j/his/a/jtQFPnNpKRmmzcyPqBQddmP/?lang=pt)

**Fonte:** http://www.scielo.br/j/his/a/jtQFPnNpKRmmzcyPqBQddmP/?lang=pt

**Peça:** memoria:uf:to:quilombo-kalunga · geral · /memoria

#### 159. Caminhada em defesa do Rio Paraopeba

**Pergunta:** Por que se caminha em defesa do Rio Paraopeba?

**Resposta refinada (llama3.2:3b):** Caminhada em defesa do Rio Paraopeba (desde 2022): Depois do rompimento da barragem em Brumadinho, moradoras e moradores do distrito de Santa Izabel, às margens do Paraopeba, passaram a se organizar em caminhadas e atos pela água limpa e pela reparação. (fonte: https://www.brasildefato.com.br/2022/01/26/moradores-de-comunidade-em-betim-mg-realizam-caminhada-em-defesa-do-rio-paraopeba/)

**Resposta bruta (template):** Caminhada em defesa do Rio Paraopeba (desde 2022): Depois do rompimento da barragem em Brumadinho, moradoras e moradores do distrito de Santa Izabel, às margens do Paraopeba, passaram a se organizar em caminhadas e atos pela água limpa e pela reparação. (fonte: https://www.brasildefato.com.br/2022/01/26/moradores-de-comunidade-em-betim-mg-realizam-caminhada-em-defesa-do-rio-paraopeba/)

**Fonte:** https://www.brasildefato.com.br/2022/01/26/moradores-de-comunidade-em-betim-mg-realizam-caminhada-em-defesa-do-rio-paraopeba/

**Peça:** memoria:municipio:3106705:caminhada-em-defesa-do-rio-paraopeba · geral · /memoria

#### 160. Memorial Brumadinho

**Pergunta:** O que é o Memorial Brumadinho?

**Resposta refinada (llama3.2:3b):** Memorial Brumadinho (desde 2019): Depois do rompimento da barragem da Mina Córrego do Feijão, em 25 de janeiro de 2019, as famílias das 272 vítimas se mobilizaram para preservar a memória. O Memorial Brumadinho, no próprio local da tragédia, é uma conquista coletiva delas. (fonte: https://memorialbrumadinho.org.br/memorial-brumadinho/sobre/)

**Resposta bruta (template):** Memorial Brumadinho (desde 2019): Depois do rompimento da barragem da Mina Córrego do Feijão, em 25 de janeiro de 2019, as famílias das 272 vítimas se mobilizaram para preservar a memória. O Memorial Brumadinho, no próprio local da tragédia, é uma conquista coletiva delas. (fonte: https://memorialbrumadinho.org.br/memorial-brumadinho/sobre/)

**Fonte:** https://memorialbrumadinho.org.br/memorial-brumadinho/sobre/

**Peça:** memoria:municipio:3109006:memorial-brumadinho · geral · /memoria

#### 161. Parque do Biribiri público

**Pergunta:** Por que os moradores de Diamantina defendem Biribiri?

**Resposta refinada (llama3.2:3b):** Parque do Biribiri público (desde 2026): Moradoras e moradores de Diamantina se organizam para manter o Parque Estadual do Biribiri sob gestão pública, contra a concessão à iniciativa privada. A mobilização cobra participação da comunidade nas decisões sobre o parque. (fonte: https://www.brasildefato.com.br/2026/07/06/moradores-de-diamantina-mg-lutam-para-manter-parque-do-biribiri-publico/)

**Resposta bruta (template):** Parque do Biribiri público (desde 2026): Moradoras e moradores de Diamantina se organizam para manter o Parque Estadual do Biribiri sob gestão pública, contra a concessão à iniciativa privada. A mobilização cobra participação da comunidade nas decisões sobre o parque. (fonte: https://www.brasildefato.com.br/2026/07/06/moradores-de-diamantina-mg-lutam-para-manter-parque-do-biribiri-publico/)

**Fonte:** https://www.brasildefato.com.br/2026/07/06/moradores-de-diamantina-mg-lutam-para-manter-parque-do-biribiri-publico/

**Peça:** memoria:municipio:3121605:parque-do-biribiri-publico · geral · /memoria

#### 162. Massacre de Felisburgo

**Pergunta:** O que foi o Massacre de Felisburgo?

**Resposta refinada (llama3.2:3b):** Massacre de Felisburgo (2003): Em 20 de novembro de 2003, cinco militantes do MST foram assassinados em Felisburgo, no interior de Minas Gerais. O crime é lembrado como um dos episódios mais graves da luta pela terra no estado. Fonte: Brasil de Fato — imprensa popular, 2024. (fonte: https://www.brasildefato.com.br/2024/11/20/massacre-de-felisburgo-que-assassinou-cinco-militantes-do-mst-completa-20-anos-sem-justica/)

**Resposta bruta (template):** Massacre de Felisburgo (2003): Em 20 de novembro de 2003, cinco militantes do MST foram assassinados em Felisburgo, no interior de Minas Gerais. O crime é lembrado como um dos episódios mais graves da luta pela terra no estado. Fonte: Brasil de Fato — imprensa popular, 2024. (fonte: https://www.brasildefato.com.br/2024/11/20/massacre-de-felisburgo-que-assassinou-cinco-militantes-do-mst-completa-20-anos-sem-justica/)

**Fonte:** https://www.brasildefato.com.br/2024/11/20/massacre-de-felisburgo-que-assassinou-cinco-militantes-do-mst-completa-20-anos-sem-justica/

**Peça:** memoria:municipio:3125705:massacre-de-felisburgo · geral · /memoria

#### 163. Atingidos do Rio Doce cobram reparação

**Pergunta:** Como os atingidos do Rio Doce cobram reparação?

**Resposta refinada (llama3.2:3b):** Atingidos do Rio Doce cobram reparação desde 2015. Depois do rompimento da barragem de Fundão, moradoras e moradores de Governador Valadares se organizaram em atos para cobrar reparação e água limpa. A cidade enfrentou a interrupção do abastecimento. (fonte: https://www.brasildefato.com.br/2016/04/18/ato-em-governador-valadares-mg-denuncia-descaso-da-samarco-com-atingidos/)

**Resposta bruta (template):** Atingidos do Rio Doce cobram reparação (desde 2015): Depois do rompimento da barragem de Fundão, moradoras e moradores de Governador Valadares, na Bacia do Rio Doce, se organizaram em atos para cobrar reparação e água limpa. A cidade enfrentou a interrupção do abastecimento. (fonte: https://www.brasildefato.com.br/2016/04/18/ato-em-governador-valadares-mg-denuncia-descaso-da-samarco-com-atingidos/)

**Fonte:** https://www.brasildefato.com.br/2016/04/18/ato-em-governador-valadares-mg-denuncia-descaso-da-samarco-com-atingidos/

**Peça:** memoria:municipio:3127701:atingidos-do-rio-doce-cobram-reparacao · geral · /memoria

#### 164. Massacre de Ipatinga

**Pergunta:** O que foi o Massacre de Ipatinga?

**Resposta refinada (llama3.2:3b):** Massacre de Ipatinga (1963): Em 7 de outubro de 1963, trabalhadores da Usiminas, em Ipatinga, foram atacados a tiros pela Polícia Militar e pela vigilância da empresa durante uma greve. O episódio é lembrado como o conflito operário mais sangrento do país. (fonte: http://querepublicaeessa.an.gov.br/index.php/que-republica-e-essa/assuntos/temas/78-secoes-anteriores/67-surpresa/426-massacre-de-ipatinga)

**Resposta bruta (template):** Massacre de Ipatinga (1963): Em 7 de outubro de 1963, trabalhadores da Usiminas, em Ipatinga, foram atacados a tiros pela Polícia Militar e pela vigilância da empresa durante uma greve. O episódio é lembrado como o conflito operário mais sangrento do país. (fonte: http://querepublicaeessa.an.gov.br/index.php/que-republica-e-essa/assuntos/temas/78-secoes-anteriores/67-surpresa/426-massacre-de-ipatinga)

**Fonte:** http://querepublicaeessa.an.gov.br/index.php/que-republica-e-essa/assuntos/temas/78-secoes-anteriores/67-surpresa/426-massacre-de-ipatinga

**Peça:** memoria:municipio:3131307:massacre-de-ipatinga · geral · /memoria

#### 165. Rompimento da barragem de Fundão

**Pergunta:** Quando rompeu a barragem de Fundão?

**Resposta refinada (llama3.2:3b):** Rompimento da barragem de Fundão (2015): Em 5 de novembro de 2015, o rompimento da barragem de Fundão, da Samarco (Vale e BHP), destruiu o distrito de Bento Rodrigues e matou 19 pessoas. A lama seguiu pelo rio Doce; a luta das pessoas atingidas por reparação continua. (fonte: https://mab.org.br/timeline/rompimento-da-barragem-de-fundao-em-mariana-mg/)

**Resposta bruta (template):** Rompimento da barragem de Fundão (2015): Em 5 de novembro de 2015, o rompimento da barragem de Fundão, da Samarco (Vale e BHP), destruiu o distrito de Bento Rodrigues e matou 19 pessoas. A lama seguiu pelo rio Doce; a luta das pessoas atingidas por reparação continua. (fonte: https://mab.org.br/timeline/rompimento-da-barragem-de-fundao-em-mariana-mg/)

**Fonte:** https://mab.org.br/timeline/rompimento-da-barragem-de-fundao-em-mariana-mg/

**Peça:** memoria:municipio:3140001:rompimento-da-barragem-de-fundao · geral · /memoria

#### 166. Base de dados: 199 Cidades Estratégicas do Brasil

**Pergunta:** Que base existe sobre as Cidades Estratégicas do Brasil?

**Resposta refinada (llama3.2:3b):** O portal publica a base "199 Cidades Estratégicas do Brasil" (199 registros, JSON), com origem em IBGE / DATASUS / Ministério da Saúde. Aparece em: /cidades, /terra-e-territorios, /noticias. Fonte: https://cidades.ibge.gov.br. (fonte: https://cidades.ibge.gov.br)

**Resposta bruta (template):** O portal publica a base "199 Cidades Estratégicas do Brasil" (199 registros, JSON), com origem em IBGE / DATASUS / Ministério da Saúde. Aparece em: /cidades, /terra-e-territorios, /noticias. Fonte: https://cidades.ibge.gov.br. (fonte: https://cidades.ibge.gov.br)

**Fonte:** https://cidades.ibge.gov.br

**Peça:** base:cidades-estrategicas · geral · /cidades

#### 167. Base de dados: Transferências Federais nos Municípios (ComunicaBR)

**Pergunta:** Como consultar as transferências federais por município?

**Resposta refinada (llama3.2:3b):** O portal publica a base "Transferências Federais nos Municípios (ComunicaBR)" (853 registros, JSON (Codec Compacto)), com origem em Secretaria de Comunicação Social da Presidência da República (SECOM). Aparece em: /dados/comunicabr, /[municipio], /indice. Fonte: https://comunicabr.com.br. (fonte: https://comunicabr.com.br)

**Resposta bruta (template):** O portal publica a base "Transferências Federais nos Municípios (ComunicaBR)" (853 registros, JSON (Codec Compacto)), com origem em Secretaria de Comunicação Social da Presidência da República (SECOM). Aparece em: /dados/comunicabr, /[municipio], /indice. Fonte: https://comunicabr.com.br. (fonte: https://comunicabr.com.br)

**Fonte:** https://comunicabr.com.br

**Peça:** base:comunicabr-mg · geral · /dados/comunicabr

#### 169. Base de dados: Incentivadores Culturais e Projetos (Lei Rouanet)

**Pergunta:** Que base existe sobre incentivadores da Lei Rouanet?

⚠️ **refine descartado (fonte alterada pelo modelo)** — vale só a resposta bruta.

**Resposta bruta (template):** O portal publica a base "Incentivadores Culturais e Projetos (Lei Rouanet)" (1300 registros, JSON), com origem em Sistema de Apoio às Leis de Incentivo à Cultura (SALIC / MinC). Aparece em: /[municipio]/prefeitura/cultura, /empresas. Fonte: https://salic.cultura.gov.br. (fonte: https://salic.cultura.gov.br)

**Fonte:** https://salic.cultura.gov.br

**Peça:** base:rouanet-incentivadores · geral · /empresas

#### 171. Bases de Empresas, ESG e incentivos culturais

**Pergunta:** Que bases de dados o portal tem sobre empresas?

**Resposta refinada (llama3.2:3b):** Tema "Empresas, ESG e incentivos culturais": 34 arquivo(s), 73.6 MB, 297 registros contados (contagem parcial: arquivos grandes não abertos). (fonte: /empresas)

**Resposta bruta (template):** Tema "Empresas, ESG e incentivos culturais": 34 arquivo(s), 73.6 MB, 297 registros contados (contagem parcial: arquivos grandes não abertos). (fonte: /empresas)

**Fonte:** /empresas

**Peça:** bases:tema:empresas · geral · /empresas

#### 173. Bases de Municípios, contratos e indicadores locais

**Pergunta:** Que bases existem sobre municípios, contratos e indicadores locais?

**Resposta refinada (llama3.2:3b):** Tema "Municípios, contratos e indicadores locais": 83 arquivo(s), 9.3 MB, 40016 registros contados (contagem parcial: arquivos grandes não abertos). (fonte: /cidades)

**Resposta bruta (template):** Tema "Municípios, contratos e indicadores locais": 83 arquivo(s), 9.3 MB, 40016 registros contados (contagem parcial: arquivos grandes não abertos). (fonte: /cidades)

**Fonte:** /cidades

**Peça:** bases:tema:cidades · geral · /cidades

#### 177. Bases de Gestão e governo

**Pergunta:** Que bases de dados o portal tem sobre gestão?

**Resposta refinada (llama3.2:3b):** Tema "Gestão e governo": 36 arquivo(s), 1.2 MB, 690 registros contados. Exemplos: editais-consolidado.json, gestao-aracuai.json, gestao-betim.json, gestao-bh.json, gestao-capitais.json, gestao-polos.json. Página do tema: /governo. Inventário medido em 30/09/2026. (fonte: /governo)

**Resposta bruta (template):** Tema "Gestão e governo": 36 arquivo(s), 1.2 MB, 690 registros contados. Exemplos: editais-consolidado.json, gestao-aracuai.json, gestao-betim.json, gestao-bh.json, gestao-capitais.json, gestao-polos.json. Página do tema: /governo. Inventário medido em 30/09/2026. (fonte: /governo)

**Fonte:** /governo

**Peça:** bases:tema:governo · geral · /governo

#### 179. Bases de Notícias e clipping do portal

**Pergunta:** Que bases de notícias e clipping o portal tem?

**Resposta refinada (llama3.2:3b):** Tema "Notícias e clipping do portal": 5 arquivo(s), 0.8 MB, 173 registros contados. Exemplos: noticias-portal.json, dados.compact.json, noticias-vale.json, clipping-ati.json, clipping-ij.json. Página do tema: /noticias. Inventário medido em 30/09/2026. (fonte: /noticias)

**Resposta bruta (template):** Tema "Notícias e clipping do portal": 5 arquivo(s), 0.8 MB, 173 registros contados. Exemplos: noticias-portal.json, dados.compact.json, noticias-vale.json, clipping-ati.json, clipping-ij.json. Página do tema: /noticias. Inventário medido em 30/09/2026. (fonte: /noticias)

**Fonte:** /noticias

**Peça:** bases:tema:noticias · geral · /noticias

#### 180. Bases de Outras bases do portal

**Pergunta:** Que outras bases de dados o portal guarda?

**Resposta refinada (llama3.2:3b):** Tema "Outras bases do portal": 10 arquivo(s), 0.7 MB, 374 registros contados. Exemplos: assistente-acervo.json, biblioteca-unificada.json, catalogo-bases-dados.json, documentos-espelho-r2.json, edicoes.json, catalogo.json. Página do tema: /busca. Inventário medido em 30/09/2026. (fonte: /busca)

**Resposta bruta (template):** Tema "Outras bases do portal": 10 arquivo(s), 0.7 MB, 374 registros contados. Exemplos: assistente-acervo.json, biblioteca-unificada.json, catalogo-bases-dados.json, documentos-espelho-r2.json, edicoes.json, catalogo.json. Página do tema: /busca. Inventário medido em 30/09/2026. (fonte: /busca)

**Fonte:** /busca

**Peça:** bases:tema:outros · geral · /busca

#### 182. Bases de Estado e economia

**Pergunta:** Que bases existem sobre estado e economia?

**Resposta refinada (llama3.2:3b):** Tema "Estado e economia": 4 arquivo(s), 0.3 MB, 42 registros contados. Exemplos: fontes-27-estados.json, indicadores-regionais.json, series-economicas-bcb.json, sgml-cotacoes.json. Página do tema: /estado-e-economia. Inventário medido em 30/09/2026. (fonte: /estado-e-economia)

**Resposta bruta (template):** Tema "Estado e economia": 4 arquivo(s), 0.3 MB, 42 registros contados. Exemplos: fontes-27-estados.json, indicadores-regionais.json, series-economicas-bcb.json, sgml-cotacoes.json. Página do tema: /estado-e-economia. Inventário medido em 30/09/2026. (fonte: /estado-e-economia)

**Fonte:** /estado-e-economia

**Peça:** bases:tema:estado-e-economia · geral · /estado-e-economia

#### 185. Bases de Transparência dos Estados Unidos

**Pergunta:** Que bases de transparência dos EUA o portal tem?

**Resposta refinada (llama3.2:3b):** Tema "Transparência dos Estados Unidos": 7 arquivo(s), 0 MB, 21 registros contados. Exemplos: ambiental-clima.compact.json, ambiental-natureza-eua.compact.json, contratos-comercio.compact.json, contratos-usaspending.compact.json, empresas-sec.compact.json, institucional-corte.compact.json. (fonte: /eua)

**Resposta bruta (template):** Tema "Transparência dos Estados Unidos": 7 arquivo(s), 0 MB, 21 registros contados. Exemplos: ambiental-clima.compact.json, ambiental-natureza-eua.compact.json, contratos-comercio.compact.json, contratos-usaspending.compact.json, empresas-sec.compact.json, institucional-corte.compact.json. (fonte: /eua)

**Fonte:** /eua

**Peça:** bases:tema:eua · geral · /eua


### Frente `judiciario` (5)

#### 2. Orçamento do TJMG, MPMG e DPMG na LOA 2025

**Pergunta:** Quanto o estado destina ao TJMG, MPMG e DPMG?

**Resposta refinada (llama3.2:3b):** TJMG recebe R$ 14,96 bi, MPMG R$ 4,09 bi, DPMG R$ 1,10 bi. A DPMG fica com menos de 8% do TJMG. Em 2026, MPMG terá R$ 4,57 bi e DPMG, R$ 1,21 bi. (fonte: /judiciario/instituicoes)

**Resposta bruta (template):** TJMG recebe R$ 14,96 bi, MPMG R$ 4,09 bi, DPMG R$ 1,10 bi. A DPMG fica com menos de 8% do TJMG. Em 2026, MPMG terá R$ 4,57 bi e DPMG, R$ 1,21 bi. (fonte: /judiciario/instituicoes)

**Fonte:** /judiciario/instituicoes

**Peça:** macro:orcamento-justica-disparidade · judiciario · /judiciario/instituicoes

#### 21. Qual o orçamento dos órgãos do Sistema de Justiça em MG?

**Pergunta:** Qual o orçamento dos órgãos do Sistema de Justiça em MG?

**Resposta refinada (llama3.2:3b):** O TJMG recebe R$ 14,96 bi e o MPMG, R$ 4,09 bi. A DPMG fica com R$ 1,10 bi na LOA 2025. Em 2026, MPMG terá R$ 4,57 bi e DPMG, R$ 1,21 bi. (fonte: /judiciario/instituicoes)

**Resposta bruta (template):** O TJMG recebe R$ 14,96 bi e o MPMG, R$ 4,09 bi. A DPMG fica com R$ 1,10 bi na LOA 2025. Em 2026, MPMG terá R$ 4,57 bi e DPMG, R$ 1,21 bi. (fonte: /judiciario/instituicoes)

**Fonte:** /judiciario/instituicoes

**Peça:** contexto:12:0 · judiciario · /judiciario/instituicoes

#### 23. Quanto o TJMG e o MPMG gastam com folha e verbas indenizatórias?

**Pergunta:** Quanto o TJMG e o MPMG gastam com folha e verbas indenizatórias?

**Resposta refinada (llama3.2:3b):** O TJMG prevê R$ 11,61 bi de folha, 77,6% do próprio orçamento. As fichas registram R$ 1,85 bi em indenizações. Para o MPMG, a página traz fichas analíticas. (fonte: /judiciario/instituicoes)

**Resposta bruta (template):** O TJMG prevê R$ 11,61 bi de folha, 77,6% do próprio orçamento. As fichas registram R$ 1,85 bi em indenizações. Para o MPMG, a página traz fichas analíticas. (fonte: /judiciario/instituicoes)

**Fonte:** /judiciario/instituicoes

**Peça:** contexto:13:0 · judiciario · /judiciario/instituicoes

#### 66. Fichas do Judiciário (TJMG, MPMG, DPMG, TCEMG)

**Pergunta:** Que dados o portal tem dos órgãos do Judiciário?

**Resposta refinada (llama3.2:3b):** O portal traz orçamentos, folhas e penduricalhos dos órgãos. Inclui a fiscalização externa do Judiciário mineiro. (fonte: /judiciario/instituicoes)

**Resposta bruta (template):** O portal traz orçamentos, folhas e penduricalhos dos órgãos. Inclui a fiscalização externa do Judiciário mineiro. (fonte: /judiciario/instituicoes)

**Fonte:** /judiciario/instituicoes

**Peça:** pagina:instituicoes-justica-fichas · judiciario · /judiciario/instituicoes

#### 176. Bases de Judiciário

**Pergunta:** Que bases de dados sobre o Judiciário existem no portal?

⚠️ **refine descartado (fonte alterada pelo modelo)** — vale só a resposta bruta.

**Resposta bruta (template):** Tema "Judiciário": 16 arquivo(s), 2.1 MB, 1175 registros contados. Exemplos: cnj-inspecoes-defensoria.json, dpu-comite-tematico.json, instituicoes-todas-esferas.json, recomendacoes-cnj-cnmp.json, judiciario-contatos-stats.json, judiciario-designacoes.json. Página do tema: /judiciario. (fonte: /judiciario)

**Fonte:** /judiciario

**Peça:** bases:tema:judiciario · judiciario · /judiciario

### Frente `cidades` (10)

#### 3. Como pesquisar contratos e licitações de prefeituras no portal

**Pergunta:** Como pesquisar contratos e licitações das prefeituras?

**Resposta refinada (llama3.2:3b):** Acesse a página da cidade e abra 'Contratos' ou 'Licitações'. Betim, BH, Diamantina, Araçuaí e Itinga têm esse menu. (fonte: /betim/prefeitura/contratos)

**Resposta bruta (template):** O portal audita contratações municipais via PNCP e Diários Oficiais. O PNCP é o portal nacional de contratações públicas. Acesse a página da cidade e abra 'Contratos' ou 'Licitações'. (fonte: /betim/prefeitura/contratos)

**Fonte:** /betim/prefeitura/contratos

**Peça:** macro:pesquisa-contratos-prefeituras · cidades · /betim/prefeitura/contratos

#### 6. Onde ver as despesas orçamentárias de Betim?

**Pergunta:** Onde ver as despesas orçamentárias de Betim?

**Resposta refinada (llama3.2:3b):** Consulte o demonstrativo de despesas por função e subfunção. Veja onde o orçamento municipal é executado. (fonte: /betim/prefeitura/despesas)

**Resposta bruta (template):** Consulte o demonstrativo por função: saúde, educação e saneamento. Veja onde o orçamento municipal é executado. (fonte: /betim/prefeitura/despesas)

**Fonte:** /betim/prefeitura/despesas

**Peça:** contexto:0:1 · cidades · /betim/prefeitura/despesas

#### 7. Quais contratos foram firmados para essas despesas?

**Pergunta:** Quais contratos foram firmados para essas despesas?

**Resposta refinada (llama3.2:3b):** A lista de contratos traz valores e fornecedores. Há alertas de concentração em saúde, educação e obras. (fonte: /betim/prefeitura/contratos)

**Resposta bruta (template):** A lista de contratos traz valores e fornecedores. Há alertas de concentração em saúde, educação e obras. (fonte: /betim/prefeitura/contratos)

**Fonte:** /betim/prefeitura/contratos

**Peça:** contexto:1:0 · cidades · /betim/prefeitura/contratos

#### 8. Quem recebe a maior parte desses pagamentos?

**Pergunta:** Quem recebe a maior parte desses pagamentos?

**Resposta refinada (llama3.2:3b):** Consulte o ranking das empresas que mais receberam recursos públicos municipais em Betim. (fonte: /betim/prefeitura/fornecedores)

**Resposta bruta (template):** Consulte o ranking das empresas que mais receberam recursos públicos municipais em Betim. (fonte: /betim/prefeitura/fornecedores)

**Fonte:** /betim/prefeitura/fornecedores

**Peça:** contexto:1:1 · cidades · /betim/prefeitura/fornecedores

#### 10. Quais contratos foram emitidos para esses fornecedores?

**Pergunta:** Quais contratos foram emitidos para esses fornecedores?

**Resposta refinada (llama3.2:3b):** A página lista cada contratação com vigência e valor. Cada registro traz indícios de alerta. (fonte: /betim/prefeitura/contratos)

**Resposta bruta (template):** A página lista cada contratação com vigência e valor. Cada registro traz indícios de alerta. (fonte: /betim/prefeitura/contratos)

**Fonte:** /betim/prefeitura/contratos

**Peça:** contexto:2:0 · cidades · /betim/prefeitura/contratos

#### 11. Qual o valor total de compras da prefeitura?

**Pergunta:** Qual o valor total de compras da prefeitura?

**Resposta refinada (llama3.2:3b):** Veja a execução financeira por órgão e secretaria. Está na página de despesas de Betim. (fonte: /betim/prefeitura/despesas)

**Resposta bruta (template):** Veja a execução financeira por órgão e secretaria. Está na página de despesas de Betim. (fonte: /betim/prefeitura/despesas)

**Fonte:** /betim/prefeitura/despesas

**Peça:** contexto:2:1 · cidades · /betim/prefeitura/despesas

#### 12. Quanto o município gasta com folha de pagamento?

**Pergunta:** Quanto o município gasta com folha de pagamento?

**Resposta refinada (llama3.2:3b):** A composição das despesas detalha pessoal e encargos. Os valores vêm separados por secretaria. (fonte: /betim/prefeitura/despesas)

**Resposta bruta (template):** A composição das despesas detalha pessoal e encargos. Os valores vêm separados por secretaria. (fonte: /betim/prefeitura/despesas)

**Fonte:** /betim/prefeitura/despesas

**Peça:** contexto:3:0 · cidades · /betim/prefeitura/despesas

#### 14. Como os vereadores votaram nas matérias legislativas?

**Pergunta:** Como os vereadores votaram nas matérias legislativas?

**Resposta refinada (llama3.2:3b):** Acompanhe as atas e registros de votações nominais da Câmara Municipal de Betim. (fonte: /betim/camara/votacoes)

**Resposta bruta (template):** Acompanhe as atas e registros de votações nominais da Câmara Municipal de Betim. (fonte: /betim/camara/votacoes)

**Fonte:** /betim/camara/votacoes

**Peça:** contexto:5:0 · cidades · /betim/camara/votacoes

#### 15. Quais leis municipais foram aprovadas recentemente?

**Pergunta:** Quais leis municipais foram aprovadas recentemente?

**Resposta refinada (llama3.2:3b):** Consulte o acervo legislativo municipal com leis ordinárias, complementares e decretos. (fonte: /betim/camara/legislacao)

**Resposta bruta (template):** Consulte o acervo legislativo municipal com leis ordinárias, complementares e decretos. (fonte: /betim/camara/legislacao)

**Fonte:** /betim/camara/legislacao

**Peça:** contexto:5:1 · cidades · /betim/camara/legislacao

#### 59. Betim — Câmara

**Pergunta:** Onde vejo os dados da Câmara de Betim?

**Resposta refinada (llama3.2:3b):** Dados da Câmara de Betim: vereadores, votações, legislação e proposições. Há contatos e histórico dos vereadores. Também leis, decretos e proposições em tramitação. (fonte: /betim/camara)

**Resposta bruta (template):** Dados da Câmara de Betim: vereadores, votações, legislação e proposições. Há contatos e histórico dos vereadores. Também leis, decretos e proposições em tramitação. (fonte: /betim/camara)

**Fonte:** /betim/camara

**Peça:** pagina:betim-camara · cidades · /betim/camara

### Frente `ambiental` (21)

#### 4. Licenciamento ambiental em Minas Gerais (SEMAD / IDE-Sisema)

**Pergunta:** Como consultar licenças ambientais da SEMAD em MG?

**Resposta refinada (llama3.2:3b):** O painel do ONSA reúne o censo de licenciamento da SEMAD. São mais de 19.700 empreendimentos com licença deferida em MG. (fonte: /ambiental/licenciamento)

**Resposta bruta (template):** O painel do ONSA reúne o censo de licenciamento da SEMAD. São mais de 19.700 empreendimentos com licença deferida em MG. A SEMAD é a secretaria estadual de meio ambiente. (fonte: /ambiental/licenciamento)

**Fonte:** /ambiental/licenciamento

**Peça:** macro:licenciamento-semad-onsa · ambiental · /ambiental/licenciamento

#### 16. Onde consultar licenças ambientais de aterros e destinação?

**Pergunta:** Onde consultar licenças ambientais de aterros e destinação?

**Resposta refinada (llama3.2:3b):** O ONSA monitora o licenciamento de resíduos sólidos em MG. Consulte as licenças de aterros e destinação no painel. (fonte: /ambiental/licenciamento)

**Resposta bruta (template):** O ONSA monitora o licenciamento de empreendimentos de resíduos sólidos. São aterros e unidades de destinação em MG. (fonte: /ambiental/licenciamento)

**Fonte:** /ambiental/licenciamento

**Peça:** contexto:6:1 · ambiental · /ambiental/licenciamento

#### 22. Onde consultar as ações de crimes socioambientais e TACs?

**Pergunta:** Onde consultar as ações de crimes socioambientais e TACs?

**Resposta refinada (llama3.2:3b):** A Biblioteca de Crimes Socioambientais reúne 936 laudos periciais e TACs. (fonte: /ambiental/crimes-socioambientais)

**Resposta bruta (template):** A Biblioteca de Crimes Socioambientais reúne 936 laudos periciais e TACs. (fonte: /ambiental/crimes-socioambientais)

**Fonte:** /ambiental/crimes-socioambientais

**Peça:** contexto:12:1 · ambiental · /ambiental/crimes-socioambientais

#### 24. Onde consultar os TACs firmados por mineradoras e órgãos públicos?

**Pergunta:** Onde consultar os TACs firmados por mineradoras e órgãos públicos?

**Resposta refinada (llama3.2:3b):** O acervo reúne TACs firmados pelo MPMG, IBAMA e FEAM. Há termos firmados com mineradoras. (fonte: /ambiental/tac)

**Resposta bruta (template):** O acervo reúne TACs firmados pelo MPMG, IBAMA e FEAM. Há termos firmados com mineradoras. (fonte: /ambiental/tac)

**Fonte:** /ambiental/tac

**Peça:** contexto:15:2 · ambiental · /ambiental/tac

#### 25. Quais empreendimentos têm processos de licenciamento em curso?

**Pergunta:** Quais empreendimentos têm processos de licenciamento em curso?

**Resposta refinada (llama3.2:3b):** Acesse a base de 19 mil licenças deferidas e em tramitação na SEMAD/Sisema. (fonte: /ambiental/licenciamento)

**Resposta bruta (template):** Acesse a base de 19 mil licenças deferidas e em tramitação na SEMAD/Sisema. (fonte: /ambiental/licenciamento)

**Fonte:** /ambiental/licenciamento

**Peça:** contexto:17:0 · ambiental · /ambiental/licenciamento

#### 27. Onde consultar o acervo de relatórios técnicos das ATIs?

**Pergunta:** Onde consultar o acervo de relatórios técnicos das ATIs?

**Resposta refinada (llama3.2:3b):** A Biblioteca das ATIs reúne mais de 640 documentos. Foram elaborados por AEDAS, Guaicuy, NACAB e ADAI. (fonte: /ambiental/crimes-socioambientais)

**Resposta bruta (template):** A Biblioteca das ATIs reúne mais de 640 documentos. Foram elaborados por AEDAS, Guaicuy, NACAB e ADAI. (fonte: /ambiental/crimes-socioambientais)

**Fonte:** /ambiental/crimes-socioambientais

**Peça:** contexto:19:1 · ambiental · /ambiental/crimes-socioambientais

#### 29. Qual lei protege a minha comunidade?

**Pergunta:** Qual lei protege a minha comunidade?

**Resposta refinada (llama3.2:3b):** Consulte o catálogo de legislação de direitos sociais, proteção socioambiental e patrimônio. (fonte: /ambiental/legislacao)

**Resposta bruta (template):** Consulte o catálogo de legislação de direitos sociais, proteção socioambiental e patrimônio. (fonte: /ambiental/legislacao)

**Fonte:** /ambiental/legislacao

**Peça:** contexto:21:2 · ambiental · /ambiental/legislacao

#### 33. Onde consultar o acervo pericial dos crimes de barragens?

**Pergunta:** Onde consultar o acervo pericial dos crimes de barragens?

**Resposta refinada (llama3.2:3b):** Acesse os laudos técnicos e termos de compromisso. Há planos de saúde das bacias atingidas. (fonte: /ambiental/crimes-socioambientais)

**Resposta bruta (template):** Acesse os laudos técnicos e termos de compromisso. Há planos de saúde das bacias atingidas. (fonte: /ambiental/crimes-socioambientais)

**Fonte:** /ambiental/crimes-socioambientais

**Peça:** contexto:24:1 · ambiental · /ambiental/crimes-socioambientais

#### 35. Onde consultar os laudos periciais e ações judiciais de Mariana?

**Pergunta:** Onde consultar os laudos periciais e ações judiciais de Mariana?

**Resposta refinada (llama3.2:3b):** A Biblioteca Unificada reúne os TACs do Rio Doce. Tem pareceres epidemiológicos e ações civis públicas. (fonte: /ambiental/crimes-socioambientais)

**Resposta bruta (template):** A Biblioteca Unificada reúne os TACs do Rio Doce. Tem pareceres epidemiológicos e ações civis públicas. (fonte: /ambiental/crimes-socioambientais)

**Fonte:** /ambiental/crimes-socioambientais

**Peça:** contexto:25:1 · ambiental · /ambiental/crimes-socioambientais

#### 36. Como fiscalizar o novo acordo de R$ 171 bilhões de Mariana?

**Pergunta:** Como fiscalizar o novo acordo de R$ 171 bilhões de Mariana?

**Resposta refinada (llama3.2:3b):** O painel acompanha o Acordo de Repactuação do Rio Doce. O acordo foi homologado em 25/10/2024, com R$ 132 bi nominal. Os consolidados do portal somam R$ 169,68 bi (03/09/2026). A home mostra R$ 171 bi, valor arredondado. (fonte: /ambiental/mariana)

**Resposta bruta (template):** O painel acompanha o Acordo de Repactuação do Rio Doce. O acordo foi homologado em 25/10/2024, com R$ 132 bi nominal. Os consolidados do portal somam R$ 169,68 bi (03/09/2026). A home mostra R$ 171 bi, valor arredondado. (fonte: /ambiental/mariana)

**Fonte:** /ambiental/mariana

**Peça:** contexto:26:2 · ambiental · /ambiental/mariana

#### 38. Como checar a estabilidade das barragens dessas empresas?

**Pergunta:** Como checar a estabilidade das barragens dessas empresas?

**Resposta refinada (llama3.2:3b):** O painel do SIGBM/ANM monitora barragens de rejeitos. Há alertas de emergência e nível de risco. (fonte: /ambiental/barragens)

**Resposta bruta (template):** O painel do SIGBM/ANM monitora barragens de rejeitos. Há alertas de emergência e nível de risco. (fonte: /ambiental/barragens)

**Fonte:** /ambiental/barragens

**Peça:** contexto:27:2 · ambiental · /ambiental/barragens

#### 42. Onde consultar os TACs firmados perante o Ministério Público?

**Pergunta:** Onde consultar os TACs firmados perante o Ministério Público?

**Resposta refinada (llama3.2:3b):** Consulte o painel de TACs ambientais de MG. Ele traz valores e status de cumprimento. (fonte: /ambiental/tac)

**Resposta bruta (template):** Consulte o painel de TACs ambientais de MG. Ele traz valores e status de cumprimento. (fonte: /ambiental/tac)

**Fonte:** /ambiental/tac

**Peça:** contexto:28:2 · ambiental · /ambiental/tac

#### 48. Onde consultar o acervo de crimes e desastres de barragens?

**Pergunta:** Onde consultar o acervo de crimes e desastres de barragens?

**Resposta refinada (llama3.2:3b):** A Biblioteca Unificada reúne 936 laudos periciais, TACs e relatórios de saúde comunitária. (fonte: /ambiental/crimes-socioambientais)

**Resposta bruta (template):** A Biblioteca Unificada reúne 936 laudos periciais, TACs e relatórios de saúde comunitária. (fonte: /ambiental/crimes-socioambientais)

**Fonte:** /ambiental/crimes-socioambientais

**Peça:** contexto:32:2 · ambiental · /ambiental/crimes-socioambientais

#### 49. Onde consultar termos de ajuste de conduta (TACs) ambientais em MG?

**Pergunta:** Onde consultar termos de ajuste de conduta (TACs) ambientais em MG?

**Resposta refinada (llama3.2:3b):** O acervo reúne mais de 8.900 TACs do MPMG e IBAMA. Cada termo traz valores e obrigações. (fonte: /ambiental/tac)

**Resposta bruta (template):** O acervo reúne mais de 8.900 TACs do MPMG e IBAMA. Cada termo traz valores e obrigações. (fonte: /ambiental/tac)

**Fonte:** /ambiental/tac

**Peça:** contexto:33:1 · ambiental · /ambiental/tac

#### 62. Nossos Rios, Serras & Patrimônio Cultural

**Pergunta:** Como consultar rios, serras e patrimônio cultural de MG?

**Resposta refinada (llama3.2:3b):** Mostra a qualidade da água das 7 bacias de MG. Cobre serras de recarga e patrimônio tombado. (fonte: /ambiental/nossos-rios)

**Resposta bruta (template):** Mostra a qualidade da água das 7 bacias de MG. Cobre serras de recarga e patrimônio tombado. (fonte: /ambiental/nossos-rios)

**Fonte:** /ambiental/nossos-rios

**Peça:** pagina:ambiental-rios-serras · ambiental · /ambiental/nossos-rios

#### 64. Condicionantes Ambientais de Barragens

**Pergunta:** Como fiscalizar as condicionantes de barragens em MG?

**Resposta refinada (llama3.2:3b):** Audita o cumprimento das condicionantes das licenças e TACs. Cobre as grandes barragens de Minas Gerais. (fonte: /ambiental/condicionantes)

**Resposta bruta (template):** Audita o cumprimento das condicionantes das licenças e TACs. Cobre as grandes barragens de Minas Gerais. (fonte: /ambiental/condicionantes)

**Fonte:** /ambiental/condicionantes

**Peça:** pagina:ambiental-condicionantes · ambiental · /ambiental/condicionantes

#### 70. Dossiês Desclassificados de Inteligência & Twelve Eyes

**Pergunta:** Onde vejo os dossiês de inteligência desclassificados?

**Resposta refinada (llama3.2:3b):** É uma auditoria cívica de 84 relatórios de inteligência. Inclui CIA, FBI, NSA, SNI e alianças Five a Twelve Eyes. (fonte: /internacional/inteligencia)

**Resposta bruta (template):** É uma auditoria cívica de 84 relatórios de inteligência. Inclui CIA, FBI, NSA, SNI e alianças Five a Twelve Eyes. (fonte: /internacional/inteligencia)

**Fonte:** /internacional/inteligencia

**Peça:** pagina:desclassificados-inteligencia · ambiental · /internacional/inteligencia

#### 170. Bases de Licenças ambientais estaduais e federais

**Pergunta:** Que bases de licenças ambientais estaduais e federais existem?

**Resposta refinada (llama3.2:3b):** São 15 arquivos de licenças ambientais, com 89,9 MB. Os registros contados somam 102. Contagem parcial: arquivos grandes não abertos. Exemplos: cetesb-sp, fepam-rs, iat-pr e ibama. (fonte: /ambiental/licencas)

**Resposta bruta (template):** Tema "Licenças ambientais estaduais e federais": 15 arquivo(s), 89.9 MB, 102 registros contados (contagem parcial: arquivos grandes não abertos). Exemplos: cetesb-sp-licencas.json, fepam-rs-licencas.json, iat-pr-licencas.json, ibama-licencas.json, ibram-df-licencas.json, iema-es-licencas.json. (fonte: /ambiental/licencas)

**Fonte:** /ambiental/licencas

**Peça:** bases:tema:ambiental-licencas · ambiental · /ambiental/licencas

#### 172. Bases de Outorgas de água (ANA/IGAM)

**Pergunta:** Que bases de outorgas de água (ANA/IGAM) existem?

**Resposta refinada (llama3.2:3b):** São 2 arquivos de outorgas de água, com 21 MB. Exemplos: ana-outorgas.json e igam-outorgas.json. Inventário medido em 30/09/2026. (fonte: /ambiental/nossos-rios)

**Resposta bruta (template):** Tema "Outorgas de água (ANA/IGAM)": 2 arquivo(s), 21 MB (contagem parcial: arquivos grandes não abertos). Exemplos: ana-outorgas.json, igam-outorgas.json. Página do tema: /ambiental/nossos-rios. Inventário medido em 30/09/2026. (fonte: /ambiental/nossos-rios)

**Fonte:** /ambiental/nossos-rios

**Peça:** bases:tema:ambiental-outorgas · ambiental · /ambiental/nossos-rios

#### 174. Bases de Meio ambiente e territórios

**Pergunta:** Que bases de meio ambiente e territórios existem no portal?

**Resposta refinada (llama3.2:3b):** São 12 arquivos, 8 MB e 1000 registros contados. Exemplos: car-mg.json, ibama-mg.json e bases-clima-risco.json. Inventário medido em 30/09/2026. (fonte: /ambiental)

**Resposta bruta (template):** Tema "Meio ambiente e territórios": 12 arquivo(s), 8 MB, 1000 registros contados. Exemplos: bases-clima-risco.json, car-mg.json, destinacoes-uniao-mg.json, ecossistema-ambiental-nacional.json, ibama-autos-infracao.json, ibama-mg.json. Página do tema: /ambiental. Inventário medido em 30/09/2026. (fonte: /ambiental)

**Fonte:** /ambiental

**Peça:** bases:tema:ambiental · ambiental · /ambiental

#### 183. Bases de Organismos multilaterais

**Pergunta:** Que bases sobre organismos multilaterais existem?

**Resposta refinada (llama3.2:3b):** São 6 arquivos, 0,2 MB e 18 registros. Exemplos: europa-transnacional e comercio-commodities. (fonte: /internacional)

**Resposta bruta (template):** Tema "Organismos multilaterais": 6 arquivo(s), 0.2 MB, 18 registros contados. Exemplos: europa-transnacional.compact.json, comercio-commodities.compact.json, desclassificados-g20.compact.json, europa-transnacional.compact.json, indicadores-sociais.compact.json, terra-territorios-global.compact.json. (fonte: /internacional)

**Fonte:** /internacional

**Peça:** bases:tema:internacional · ambiental · /internacional

### Frente `direitos` (1)

#### 5. Central de Canais LAI (445 entidades) e Conselhos de Direitos (710 colegiados)

**Pergunta:** Quantos canais LAI e conselhos o portal reúne?

**Resposta refinada (llama3.2:3b):** São 445 canais de LAI com e-mail, telefone e e-SIC. O diretório de conselhos lista 710 colegiados. (fonte: /direitos-em-movimento/informacao)

**Resposta bruta (template):** A Central de Canais LAI reúne 445 entidades públicas. São prefeituras, câmaras, tribunais, órgãos federais e concessionárias. Cada canal traz e-mail, telefone, e-SIC e modelo de pedido. Os conselhos listam 710 colegiados. (fonte: /direitos-em-movimento/informacao)

**Fonte:** /direitos-em-movimento/informacao

**Peça:** macro:canais-lai-conselhos-direitos · direitos · /direitos-em-movimento/informacao

### Frente `direitos-em-movimento` (7)

#### 13. Como estão as contratações e empregos formais na cidade?

**Pergunta:** Como estão as contratações e empregos formais na cidade?

**Resposta refinada (llama3.2:3b):** O eixo monitora admissões do CAGED em Betim. Mostra também a geração de renda na cidade. (fonte: /direitos-em-movimento/trabalho-e-renda)

**Resposta bruta (template):** O eixo monitora admissões do CAGED, o cadastro oficial de vagas formais. Mostra também a geração de renda em Betim. (fonte: /direitos-em-movimento/trabalho-e-renda)

**Fonte:** /direitos-em-movimento/trabalho-e-renda

**Peça:** contexto:3:1 · direitos-em-movimento · /direitos-em-movimento/trabalho-e-renda

#### 30. Como fazer denúncias de desvio de verbas ou dano ambiental?

**Pergunta:** Como fazer denúncias de desvio de verbas ou dano ambiental?

**Resposta refinada (llama3.2:3b):** Acesse formulários e contatos de ouvidorias do Ministério Público e tribunais de contas. (fonte: /direitos-em-movimento/denuncia)

**Resposta bruta (template):** Acesse formulários e contatos de ouvidorias do Ministério Público e tribunais de contas. (fonte: /direitos-em-movimento/denuncia)

**Fonte:** /direitos-em-movimento/denuncia

**Peça:** contexto:23:0 · direitos-em-movimento · /direitos-em-movimento/denuncia

#### 31. Como solicitar documentos oficiais que não estão disponíveis?

**Pergunta:** Como solicitar documentos oficiais que não estão disponíveis?

**Resposta refinada (llama3.2:3b):** Utilize o modelo de pedido de informação com fundamentação jurídica da Lei 12.527. (fonte: /direitos-em-movimento/informacao)

**Resposta bruta (template):** Utilize o modelo de pedido de informação com fundamentação jurídica da Lei 12.527. (fonte: /direitos-em-movimento/informacao)

**Fonte:** /direitos-em-movimento/informacao

**Peça:** contexto:23:1 · direitos-em-movimento · /direitos-em-movimento/informacao

#### 46. Onde acessar os canais de fiscalização cidadã?

**Pergunta:** Onde acessar os canais de fiscalização cidadã?

**Resposta refinada (llama3.2:3b):** Acesse guias passo a passo de pedidos de LAI e denúncias. (fonte: /direitos-em-movimento)

**Resposta bruta (template):** Acesse guias passo a passo de pedidos de LAI e denúncias. LAI é a Lei de Acesso à Informação. (fonte: /direitos-em-movimento)

**Fonte:** /direitos-em-movimento

**Peça:** contexto:31:1 · direitos-em-movimento · /direitos-em-movimento

#### 60. Direitos em Movimento

**Pergunta:** Onde buscar ajuda e canais de denúncia?

**Resposta refinada (llama3.2:3b):** O portal mostra onde buscar ajuda e como se defender. Há canais de denúncia por tipo de violação. Inclui direitos de idosos, crianças e mulheres. Há ainda proteção trabalhista e defesa do consumidor. (fonte: /direitos-em-movimento/denuncia)

**Resposta bruta (template):** O portal mostra onde buscar ajuda e como se defender. Há canais de denúncia por tipo de violação. Inclui direitos de idosos, crianças e mulheres. Há ainda proteção trabalhista e defesa do consumidor. (fonte: /direitos-em-movimento/denuncia)

**Fonte:** /direitos-em-movimento/denuncia

**Peça:** pagina:direitos · direitos-em-movimento · /direitos-em-movimento/denuncia

#### 178. Bases de Conselhos de direitos e colegiados

**Pergunta:** Que bases de conselhos de direitos o portal tem?

⚠️ **refine descartado (números mudaram)** — vale só a resposta bruta.

**Resposta bruta (template):** Tema "Conselhos de direitos e colegiados": 2 arquivo(s), 0.8 MB, 714 registros contados. Exemplos: conselhos-analise.json, conselhos-direitos.json. Página do tema: /direitos-em-movimento/conselhos. Inventário medido em 30/09/2026. (fonte: /direitos-em-movimento/conselhos)

**Fonte:** /direitos-em-movimento/conselhos

**Peça:** bases:tema:conselhos · direitos-em-movimento · /direitos-em-movimento/conselhos

#### 181. Bases de Canais de acesso à informação (LAI)

**Pergunta:** Que bases de canais de LAI existem no portal?

⚠️ **refine descartado (fonte alterada pelo modelo)** — vale só a resposta bruta.

**Resposta bruta (template):** Tema "Canais de acesso à informação (LAI)": 3 arquivo(s), 0.6 MB, 15 registros contados. Exemplos: canais-informacao-lai.json, decisoes-cge-lai.json, decisoes-cge.json. Página do tema: /direitos-em-movimento/informacao. Inventário medido em 30/09/2026. (fonte: /direitos-em-movimento/informacao)

**Fonte:** /direitos-em-movimento/informacao

**Peça:** bases:tema:lai · direitos-em-movimento · /direitos-em-movimento/informacao

### Frente `congresso` (5)

#### 17. Quais bancadas concentram mais alertas?

**Pergunta:** Quais bancadas concentram mais alertas?

**Resposta refinada (llama3.2:3b):** O painel compara emendas e projetos por partido e região. São 354 bancadas cadastradas, com contagem de membros. (fonte: /congresso/bancadas)

**Resposta bruta (template):** O painel compara emendas e projetos por partido e região. São 354 bancadas cadastradas, com contagem de membros. (fonte: /congresso/bancadas)

**Fonte:** /congresso/bancadas

**Peça:** contexto:7:2 · congresso · /congresso/bancadas

#### 18. Como atuam as bancadas estaduais no Congresso?

**Pergunta:** Como atuam as bancadas estaduais no Congresso?

**Resposta refinada (llama3.2:3b):** Veja como cada bancada se posiciona no Congresso. Mostra também o efeito das emendas nos municípios. (fonte: /congresso/bancadas)

**Resposta bruta (template):** Veja como cada bancada se posiciona no Congresso. Mostra também o efeito das emendas nos municípios. (fonte: /congresso/bancadas)

**Fonte:** /congresso/bancadas

**Peça:** contexto:8:1 · congresso · /congresso/bancadas

#### 19. Como os deputados votam nas pautas de meio ambiente e direitos?

**Pergunta:** Como os deputados votam nas pautas de meio ambiente e direitos?

**Resposta refinada (llama3.2:3b):** O painel registra cada voto nominal em plenário. Assim você fiscaliza a atuação de cada eleito. (fonte: /congresso/votacoes)

**Resposta bruta (template):** O painel registra cada voto nominal em plenário. Assim você fiscaliza a atuação de cada eleito. (fonte: /congresso/votacoes)

**Fonte:** /congresso/votacoes

**Peça:** contexto:9:0 · congresso · /congresso/votacoes

#### 20. Quais alertas de fiscalização cidadã foram registrados?

**Pergunta:** Quais alertas de fiscalização cidadã foram registrados?

**Resposta refinada (llama3.2:3b):** O painel lista 18 alertas de atenção, medidos em 09/08/2026. Eles apontam indícios em convênios e emendas de bancada. (fonte: /congresso/alertas)

**Resposta bruta (template):** O painel lista 18 alertas de atenção, medidos em 09/08/2026. Eles apontam indícios em convênios e emendas de bancada. (fonte: /congresso/alertas)

**Fonte:** /congresso/alertas

**Peça:** contexto:9:1 · congresso · /congresso/alertas

#### 55. Como comparar a atuação estadual com a Câmara dos Deputados?

**Pergunta:** Como comparar a atuação estadual com a Câmara dos Deputados?

**Resposta refinada (llama3.2:3b):** O ranking do Congresso usa a mesma régua da Assembleia. Ele mede defesa de direitos e presença em plenário. (fonte: /congresso/parlamentares)

**Resposta bruta (template):** O ranking do Congresso usa a mesma régua da Assembleia. Ele mede defesa de direitos e presença em plenário. (fonte: /congresso/parlamentares)

**Fonte:** /congresso/parlamentares

**Peça:** contexto:37:2 · congresso · /congresso/parlamentares

### Frente `paraopeba` (4)

#### 26. Qual o valor já executado nos 26 municípios atingidos?

**Pergunta:** Qual o valor já executado nos 26 municípios atingidos?

**Resposta refinada (llama3.2:3b):** O valor atualizado dos projetos é R$ 5,48 bi, auditado pela FGV. Desse total, 73,8% já foi pago (relatório de 20/07/2026). (fonte: /paraopeba/execucao)

**Resposta bruta (template):** O valor atualizado dos projetos é R$ 5,48 bi, auditado pela FGV. Desse total, 73,8% já foi pago (relatório de 20/07/2026). (fonte: /paraopeba/execucao)

**Fonte:** /paraopeba/execucao

**Peça:** contexto:19:0 · paraopeba · /paraopeba/execucao

#### 28. Quanto cada município do Paraopeba já recebeu do Acordo?

**Pergunta:** Quanto cada município do Paraopeba já recebeu do Acordo?

**Resposta refinada (llama3.2:3b):** A tabela mostra o pago em cada um dos 26 municípios. O total auditado pela FGV é R$ 5,48 bi (20/07/2026). (fonte: /paraopeba/execucao)

**Resposta bruta (template):** A tabela mostra o pago em cada um dos 26 municípios. O total auditado pela FGV é R$ 5,48 bi (20/07/2026). (fonte: /paraopeba/execucao)

**Fonte:** /paraopeba/execucao

**Peça:** contexto:20:1 · paraopeba · /paraopeba/execucao

#### 34. Como comparar o acordo do Rio Doce com o do Paraopeba (Brumadinho)?

**Pergunta:** Como comparar o acordo do Rio Doce com o do Paraopeba (Brumadinho)?

**Resposta refinada (llama3.2:3b):** O Acordo de Mariana (Rio Doce) tem R$ 132 bi nominal. O de Brumadinho (Paraopeba) tem R$ 37,68 bi. Juntos, somam R$ 169,68 bi em 03/09/2026. (fonte: /paraopeba)

**Resposta bruta (template):** O Acordo de Mariana (Rio Doce) tem R$ 132 bi nominal. O de Brumadinho (Paraopeba) tem R$ 37,68 bi. Juntos, somam R$ 169,68 bi em 03/09/2026. (fonte: /paraopeba)

**Fonte:** /paraopeba

**Peça:** contexto:25:0 · paraopeba · /paraopeba

#### 175. Bases de Reparação do Rio Doce e do Paraopeba

**Pergunta:** Que bases de reparação do Rio Doce e Paraopeba existem?

⚠️ **refine descartado (fonte alterada pelo modelo)** — vale só a resposta bruta.

**Resposta bruta (template):** Tema "Reparação do Rio Doce e do Paraopeba": 14 arquivo(s), 5.7 MB, 1341 registros contados. Exemplos: acordos-reparacao-mg.json, biblioteca-desastres-unificada.json, gestao-brumadinho.json, noticias-desastres.json, noticias-paraopeba.json, auditoria-ajri.json. Página do tema: /paraopeba. (fonte: /paraopeba)

**Fonte:** /paraopeba

**Peça:** bases:tema:paraopeba · paraopeba · /paraopeba

### Frente `funcaosocialterra` (4)

#### 51. Como visualizar assentamentos e terras tradicionais no mapa 3D?

**Pergunta:** Como visualizar assentamentos e terras tradicionais no mapa 3D?

**Resposta refinada (llama3.2:3b):** Abra o Globo 3D de Terras. Ele mostra UCs, CAR e requerimentos minerários. UCs são unidades de conservação. (fonte: /funcaosocialterra/mapa)

**Resposta bruta (template):** Abra o Globo 3D de Terras. Ele mostra UCs, CAR e requerimentos minerários. UCs são unidades de conservação. (fonte: /funcaosocialterra/mapa)

**Fonte:** /funcaosocialterra/mapa

**Peça:** contexto:34:0 · funcaosocialterra · /funcaosocialterra/mapa

#### 69. América Latina & Mineração Transnacional

**Pergunta:** Onde vejo a mineração transnacional na América Latina?

**Resposta refinada (llama3.2:3b):** O observatório mapeia 51 instalações de mineração. São 9 países da América Latina, no Globo 3D Terras. (fonte: /america-latina)

**Resposta bruta (template):** O observatório mapeia 51 instalações de mineração. São 9 países da América Latina, no Globo 3D Terras. (fonte: /america-latina)

**Fonte:** /america-latina

**Peça:** pagina:america-latina-mineracao · funcaosocialterra · /america-latina

#### 168. Base de dados: Cadastro Nacional de Unidades de Conservação (CNUC)

**Pergunta:** Que dados o portal tem sobre unidades de conservação?

⚠️ **refine descartado (fonte alterada pelo modelo)** — vale só a resposta bruta.

**Resposta bruta (template):** O portal publica a base "Cadastro Nacional de Unidades de Conservação (CNUC)" (387 registros, JSON), com origem em Ministério do Meio Ambiente e Mudança do Clima (MMA). Aparece em: /funcaosocialterra, /funcaosocialterra/mapa. Fonte: https://www.gov.br/mma. (fonte: https://www.gov.br/mma)

**Fonte:** https://www.gov.br/mma

**Peça:** base:unidades-conservacao · funcaosocialterra · /funcaosocialterra

#### 184. Bases de Terras, territórios, patrimônio e povos

**Pergunta:** Que bases de terras, territórios e povos existem?

**Resposta refinada (llama3.2:3b):** São 2 arquivos, 0,1 MB e 161 registros contados. Exemplos: estudos-rurais.json e patrimonio-tombado-iepha.json. Inventário medido em 30/09/2026. (fonte: /funcaosocialterra)

**Resposta bruta (template):** Tema "Terras, territórios, patrimônio e povos": 2 arquivo(s), 0.1 MB, 161 registros contados. Exemplos: estudos-rurais.json, patrimonio-tombado-iepha.json. Página do tema: /funcaosocialterra. Inventário medido em 30/09/2026. (fonte: /funcaosocialterra)

**Fonte:** /funcaosocialterra

**Peça:** bases:tema:terras · funcaosocialterra · /funcaosocialterra


## Como aprovar

Nada foi aplicado no código. O fluxo é este:

1. Leia as entradas e marque as aprovadas — por exemplo, criando uma
   lista com os números (`1, 4, 7, ...`) ou colocando `APROVADA` ao
   lado da resposta que quiser adotar (refinada ou bruta, a escolha é
   sua entrada por entrada).
2. Devolva a lista para uma sessão de agente. O script de aplicação
   grava as aprovadas como respostas curadas no `SeuNonoData.ts` /
   `resposta-curada.ts`, sem tocar nas demais.
3. Depois da aplicação: `npx tsc --noEmit` e a suíte de testes, para
   confirmar que nada quebrou.

Regra editorial do repo: resposta curada só entra com revisão do dono.
Este doc é o material de revisão; o dono é quem aprova.
