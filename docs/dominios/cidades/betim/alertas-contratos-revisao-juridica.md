# Revisão crítica dos alertas de contrato — fundamentação jurídica

Pedido do usuário (2026-07-23): revisar as regras de `etl/alertas.py` contra
jurisprudência real de TCU/TCE e a Lei 14.133/2021, não deixar os limiares
como escolhas arbitrárias. Cada regra abaixo tem: o que o código faz hoje,
a base legal/jurisprudencial verificada, e o veredito.

**Resultado em uma frase:** achei um erro real e corrigido (Regra 3, teto
de aditivo errado para a maioria dos contratos), um problema metodológico
sério e não corrigido (Regra 10, denominador provavelmente errado — pode
estar **inflando** o alerta, não inventando ele), e confirmei que a
maioria das regras tem base real, ainda que como heurística de
investigação e não como violação per se.

---

## Regra 1 — valor atípico pra categoria (`regra_1_valor_atipico_para_categoria`)

**Código:** contratos da mesma categoria (ou mesmo prefixo de objeto,
últimos 2 anos) com valor acima da média + 2 desvios-padrão do grupo.

**Base:** **heurística estatística, não jurisprudência.** TCU tem doutrina
real sobre **sobrepreço/superfaturamento**, mas o método oficial é
comparação contra **preço de referência externo** (pesquisa de mercado, IN
SEGES/ME nº 65/2021, Painel de Preços) — não contra a própria distribuição
histórica de contratos do município. Um valor "atípico pra Betim" não é a
mesma coisa que "acima do preço de mercado"; os dois podem divergir (Betim
pode ter pagado sistematicamente acima do mercado em toda uma categoria, e
essa regra nunca acusaria isso, porque compara contra si mesma).

**Veredito:** mantido como está — é um filtro honesto de "isto foge do
padrão desta prefeitura", não uma alegação de sobrepreço legal. **Mudança
de rótulo recomendada** na UI: já não afirma isso (motivo mostrado é
"valor atípico"), mas vale reforçar no `/metodologia` (se/quando existir)
que isto não substitui pesquisa de preço formal.

---

## Regra 2 — dispensa próxima do limite (`regra_2_dispensa_proxima_limite`)

**Código:** contrato por dispensa com valor ≥ 90% do teto do Art. 75 da
Lei 14.133/2021 (R$100k obras/engenharia, R$50k demais).

**Base real, confirmada:** existe jurisprudência consolidada do TCU sobre
**fracionamento ilegal de despesa** — dividir ou estruturar uma compra
para ficar abaixo do teto que obrigaria licitação é irregularidade
reconhecida em múltiplos acórdãos (não uma súmula única específica pra
"fracionamento", mas linha de precedente firme). Um valor "quase no
limite" é exatamente o padrão que essa jurisprudência trata como sinal de
risco. Os valores de R$100k/R$50k conferem com o texto atual do Art. 75,
I e II — mas **são reajustados por decreto periodicamente** (o próprio
código já avisa isso) — vale conferir o decreto vigente antes de qualquer
publicação nova do site.

**Veredito:** confirmada, mantida como está.

---

## Regra 3 — aditivos elevados (`regra_3_aditivos_elevados`) — **CORRIGIDA 2026-07-23**

**Código antes:** alertava com aditivo ≥ **50%** do valor inicial, pra
**qualquer** contrato.

**Achado:** o **Art. 125 da Lei 14.133/2021** fixa o teto de acréscimo em
**25%** do valor inicial atualizado para obras, serviços e compras em
geral — os **50% só valem para reforma de edifício ou de equipamento**,
exceção estreita, não a regra. Usar 50% para todo contrato deixava
passar **sem alerta nenhum** qualquer contrato comum com aditivo entre
26% e 49% — que já está, na letra da lei, acima do teto permitido.

**Correção aplicada em `etl/alertas.py`:** dois limiares agora,
`PCT_ADITIVOS_LIMIAR_GERAL = 0.25` e `PCT_ADITIVOS_LIMIAR_REFORMA = 0.50`,
escolhidos por uma checagem textual estreita (`_eh_reforma_edificio_ou_equipamento`,
só a palavra "reforma" — **não** reaproveita o conjunto largo de palavras
de obra/engenharia da Regra 2, porque "construção nova" e "pavimentação"
não são "reforma de edifício ou equipamento" e continuam no teto de 25%).

**Testado:** contra dado sintético (30% de aditivo em contrato comum agora
alerta; 45% em reforma continua sem alerta, corretamente) e rodado contra
os 576 contratos reais de Betim. **Impacto real hoje: zero** — nenhum
contrato de Betim tem `aditivos_total` alto o bastante pra cruzar nem o
teto antigo nem o novo agora. A correção importa pra daqui pra frente, não
mudou nada visível hoje.

---

## Regra 4 — capital social baixo (`regra_4_capital_social_baixo`)

**Código:** fornecedor com capital social < 5% do valor do contrato.

**Base:** **heurística de investigação real, não teto legal.** Não existe
um percentual fixo em lei ou súmula — mas capital social desproporcional
ao porte do contrato é sinal usado de fato por TCU/CGU/Ministério Público
em apurações de **empresa de fachada** (personalidade jurídica sem
capacidade econômica real pra executar o que assinou, frequentemente
ligada a fraude em licitação ou "laranja"). 5% é um valor de bom-senso
prático, não um número que a lei ou uma súmula determina — vale deixar
isso claro no `/metodologia`: é sinal de atenção, não acusação.

**Veredito:** mantida, mas rotular explicitamente como heurística de
investigação, não violação legal codificada.

---

## Regra 5 — fornecedor sancionado CEIS/CNEP (`regra_5_fornecedor_sancionado_ceis`) — **IMPLEMENTADA 2026-07-23**

**Código antes:** hoje **nunca encontra nada** — `fornecedores.sancionado_ceis`
é sempre nulo/falso porque o módulo que o preencheria não existia.

**Base legal, forte:** Art. 14, III (e Art. 156, III) da Lei 14.133/2021—
empresa com sanção de impedimento/inidoneidade vigente **não pode**
contratar com a Administração. Diferente das regras 1 e 4 (heurísticas),
esta é violação direta se disparar — mas ver a ressalva de abrangência
abaixo.

**Implementado**: `etl/apis/ceis_cnep.py` novo, consulta `/ceis` e
`/cnep` do Portal da Transparência por CNPJ e popula
`fornecedores.sancionado_ceis`/`ceis_detalhes`.

**Armadilha real achada no caminho**: o parâmetro óbvio (`cnpjSancionado`)
**não existe** e é silenciosamente ignorado pela API — ela devolve HTTP
200 com uma lista genérica em vez de erro, então testar só pelo status
HTTP não pega esse tipo de bug. O nome certo (`codigoSancionado`) só foi
achado consultando o **spec OpenAPI real** da API
(`https://api.portaldatransparencia.gov.br/v3/api-docs`), não a
documentação de prosa.

**Achado real e concreto**: rodando contra os 487 fornecedores de Betim,
**MED CENTER COMERCIAL LTDA** (o mesmo CNPJ do "Grupo MED CENTER" já
detectado em `/grupos-economicos`) tem sanção ativa no CEIS
(impedimento de contratar, 06/11/2024 a 06/11/2026, aplicada pela
Prefeitura Municipal de Sapezal/MT).

**Nuance jurídica que muda a leitura do achado**: a abrangência dessa
sanção específica é *"em todos os Poderes da Esfera do órgão
sancionador"* — ou seja, limitada à esfera MUNICIPAL de Sapezal/MT, não
estendida automaticamente a outros municípios como Betim (diferente da
declaração de inidoneidade por improbidade/Lei Anticorrupção, que
costuma ter abrangência nacional). Por isso: `sancionado_ceis` fica
`true` sempre que existe qualquer sanção (é fato real sobre o
fornecedor, vale saber), mas a `fundamentacao` da Regra 5 na UI foi
ajustada pra não afirmar impedimento automático — pede pro leitor
conferir o campo `abrangencia`, exibido junto do alerta na tela
(`/prefeitura/contratos`).

---

## Regra 7 — situação cadastral irregular (`regra_7_situacao_cadastral_irregular`)

**Código:** fornecedor com `situacao_cadastral` != "ATIVA" na Receita
Federal.

**Base:** contratar com empresa baixada/inapta é irregularidade
reconhecida (a empresa juridicamente não existe mais ou está impedida de
operar) — não depende de súmula específica, é consequência direta do
registro de CNPJ ser pré-requisito de existência jurídica pra contratar.

**Veredito:** confirmada, mantida como está.

---

## Regra 8 — muitos contratos em janela curta (`regra_8_muitos_contratos_janela_curta`)

**Código:** ≥3 contratos ao mesmo CNPJ em qualquer janela de 90 dias.

**Base real:** mesma família de jurisprudência da Regra 2 — fracionamento
de despesa pra evitar licitação/dispensa maior aparece nos acórdãos do TCU
justamente como **contratações repetidas e próximas no tempo com o mesmo
fornecedor**, não só um valor isolado perto do teto. A regra captura esse
padrão diretamente.

**Veredito:** confirmada, mantida como está.

---

## Regra 9 — grupo econômico com contratos relacionados (`regra_9_grupo_economico_contratos_relacionados`)

**Código:** ≥2 contratos em 1 ano entre CNPJs do mesmo grupo econômico
(`grupos_economicos`, sócio em comum).

**Base:** jurisprudência de TCU sobre **simulação de competitividade** —
empresas do mesmo grupo econômico "competindo" entre si na mesma licitação
ou dividindo contratos ao longo do tempo é padrão reconhecido de
direcionamento/conluio. A janela de 1 ano (vs. 90 dias da Regra 8) é
julgamento de produto, não jurisprudência — documentado como tal no
código.

**Veredito:** confirmada, mantida como está.

---

## Regra 10 — mínimos constitucionais saúde/educação (log-only, não grava alerta) — **CORRIGIDA 2026-07-23**

**Código antes:** somava `despesas` com `funcao` contendo "saude"/"educ",
sem filtrar por `estagio`, ÷ soma de **toda** `receitas` do ano, comparado
contra 15%/25%.

**Base legal, correta nos números desde o início:** CF/88 **Art. 198,
§2º** (saúde, mínimo 15% pra município, piso trazido pela EC 29/2000) e
**Art. 212** (educação, mínimo 25%). Os dois percentuais sempre
conferiram com o texto constitucional — o problema nunca foi o número da
lei, foi o cálculo em cima dela.

**Dois bugs reais achados juntos, um mascarando o outro:**

1. **Numerador inflado ~3-5×.** `despesas` grava a MESMA despesa em até 5
   `estagio` diferentes por ano/função (Empenhadas, Liquidadas, Pagas,
   Restos a Pagar Processados/Não Processados) — são o mesmo gasto visto
   em pontos diferentes do ciclo orçamentário, não valores que se somam.
   O código antigo somava todos. Confirmado ao vivo: Betim 2024 tinha
   R$783mi (empenhada) + R$747mi (liquidada) + R$735mi (paga) +
   ~R$48mi (restos a pagar) todos somados como "gasto em saúde do ano" —
   quando o gasto real é só um desses números. **Corrigido: filtra só
   `estagio == "Despesas Liquidadas"`**, o valor que a LC 141/2012 usa
   pra aferir o mínimo de saúde (e convenção equivalente pra educação).
2. **Denominador errado**, como já suspeitado antes desta correção: usava
   receita TOTAL do município em vez de impostos + transferências
   constitucionais. **Corrigido**: soma só as contas que a própria
   Constituição (Art. 158/159) qualifica como constitucionais —
   `Impostos`, `Cota-Parte do FPM`, `Cota-Parte do ICMS`, `Cota-Parte do
   IPVA`, `Cota-Parte do IPI-Municípios`, `Cota-Parte do ITR` (nomes
   exatos confirmados ao vivo contra `br_me_siconfi.municipio_receitas_orcamentarias`
   de Betim).

**Por que ninguém tinha notado antes:** os dois bugs empurravam o
resultado em direções opostas — numerador inflado (pra cima) e
denominador inflado (pra cima também, mas mais) — e por coincidência
produziam um número na faixa "abaixo do mínimo, mas não absurdamente"
(8-13%), plausível o bastante pra passar despercebido. Com os dois
corrigidos juntos: **saúde entre 38-54% (mínimo 15%) e educação entre
37-60% (mínimo 25%), em TODOS os anos de 2015 a 2024** — Betim cumpre os
dois mínimos com folga o período inteiro. (Tentativa intermediária de
corrigir só o denominador, mantendo o numerador quintuplicado, gerou
percentuais **acima de 100%** — o próprio absurdo do resultado foi o que
expôs o segundo bug.)

**Veredito:** corrigido em `etl/alertas.py` (`_ESTAGIO_DESPESA_BASE`,
`_ESTAGIO_RECEITA_BASE`, `_CONTAS_BASE_CONSTITUCIONAL`), testado ao vivo
contra os 10 anos de dado real de Betim. **Continua log-only** (não vira
`contratos.alerta`) — não porque o número seja suspeito, mas porque não
há nada pra alertar: não há registro de descumprimento no período
coberto. Ainda é uma aproximação da metodologia oficial completa do RREO
(que trata restos a pagar de exercícios anteriores e outros detalhes de
LC 141/2012 separadamente) — correta o bastante pra informar, não pra
publicar como veredito formal de conformidade constitucional. Se algum
dia servir de indicador público (não-alerta) numa página de prefeitura,
esse número agora tem base pra isso; antes da correção, não tinha.

---

## Regra 6 — CNAE vs objeto (não implementada)

Continua corretamente adiada — depende de classificação por LLM (F8),
que não existe neste código ainda. Nenhuma mudança recomendada aqui além
do que já está documentado no módulo.

---

## Resumo executivo

| Regra | Base | Veredito |
|---|---|---|
| 1 — valor atípico | heurística estatística, não jurisprudência formal | mantida, rotular como tal |
| 2 — dispensa perto do limite | jurisprudência TCU (fracionamento) | confirmada |
| 3 — aditivos elevados | Art. 125, Lei 14.133/2021 | **corrigida** (50%→25%/50% conforme o caso) |
| 4 — capital social baixo | heurística de investigação (sem teto legal) | mantida, rotular como tal |
| 5 — fornecedor sancionado | Art. 14/156 III, Lei 14.133/2021 | **implementada** — achado real: MED CENTER tem sanção CEIS ativa (abrangência restrita à esfera de quem aplicou) |
| 7 — situação cadastral | consequência de registro de CNPJ | confirmada |
| 8 — muitos contratos, janela curta | jurisprudência TCU (fracionamento) | confirmada |
| 9 — grupo econômico | jurisprudência TCU (simulação de competitividade) | confirmada |
| 10 — mínimos constitucionais | CF/88 Art. 198 §2º / Art. 212 | **corrigida** (numerador quintuplicado + denominador errado) — Betim cumpre os dois mínimos com folga 2015-2024 |

## Próximos passos concretos gerados por esta revisão

1. ~~Corrigir teto da Regra 3~~ — feito nesta sessão.
2. ~~Estender pra popular `fornecedores.sancionado_ceis` via CEIS/CNEP~~
   — feito nesta sessão (`etl/apis/ceis_cnep.py`). Achado real: MED
   CENTER tem sanção ativa (abrangência restrita, ver seção da Regra 5).
3. ~~Achar a base de cálculo certa (impostos + transferências
   constitucionais) pra Regra 10~~ — feito nesta sessão (2026-07-23):
   numerador filtrado por `estagio == "Despesas Liquidadas"`, denominador
   trocado pra impostos + cota-partes constitucionais. Resultado real:
   Betim cumpre os dois mínimos em todos os anos com dado. Continua
   log-only por não ter nada pra alertar, não por falta de confiança no
   número.
4. No `/metodologia` (quando existir), separar claramente regras que são
   **violação legal direta se disparar** (2, 3, 5, 7, 8, 9) de regras que
   são **heurística de investigação, não acusação** (1, 4).
