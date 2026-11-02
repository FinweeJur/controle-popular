# Plano — análise de teses (estatística, garantista e sistematizadora)

> **Tipo:** PLANO
> **Domínio:** jurisprudência
> **Última medição:** 2026-11-02
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [PLANO-CLASSIFICACAO-GLM-02-11.md](PLANO-CLASSIFICACAO-GLM-02-11.md), [PLANO-JURISPRUDENCIA-02-11.md](PLANO-JURISPRUDENCIA-02-11.md), [QUALIDADES-DA-INFORMACAO.md](../04-arquitetura/QUALIDADES-DA-INFORMACAO.md), [PRODUTO.md](../01-produto/PRODUTO.md)
> **Palavras-chave:** tese, jurisprudência, canonização, divergência, penal, desastre, direitos humanos, garantia, prescrição

## Sumário

- [O que existe e o que faltava](#1-o-que-existe-e-o-que-faltava)
- [Por que a canonização é regra e não modelo](#2-por-que-a-canonização-é-regra-e-não-modelo-medido)
- [Os três olhares](#3-os-três-olhares)
- [Resultado do piloto](#4-resultado-do-piloto-22-casos)
- [Custo e ritmo](#5-custo-e-ritmo)
- [O que falta](#6-o-que-falta-e-é-a-próxima-etapa)
- [Critérios de aceite](#7-critérios-de-aceite)
- [O que não fazer](#8-o-que-não-fazer)
- [Estado em 02/11](#9-estado-em-02112026-fim-do-dia)
- [O que falta para publicar](#10-o-que-falta-para-publicar)

Criado: 2026-11-02. Status: **extração concluída nas três lentes; falta a
publicação**. Ver seção 9.
Pedido do dono: "rodar análises via GLM do restante do ponto de vista estatístico,
garantista, sistematizador, analisando padrões, divergências, teses consolidadas,
teses mudadas".

## 1. O que existe e o que faltava

O acervo já responde **quem venceu** (`polo`) e **como terminou** (`resultado`).
Não responde **sobre o que** a decisão tratou. Sem isso não há padrão, divergência
nem mudança de tese — só contagem de resultado.

A camada nova tem três peças, cada uma com uma responsabilidade:

| Peça | Script | O que faz | Onde o modelo entra |
|---|---|---|---|
| Extração | `analise_teses.py` | lê ementa+resumo e devolve tese, sentido, garantia | sim, 1 chamada por caso |
| Canonização | `canonizar_teses.py` | agrupa rótulos equivalentes | **não** — regra de termo |
| Análise | `analisar_teses.py` | padrão, divergência, mudança, garantias | **não** — contagem |

## 2. Por que a canonização é regra e não modelo (medido)

Primeira tentativa: pedir ao GLM que agrupasse os rótulos que ele mesmo criou.
Resultado: **13 rótulos, 13 canônicos** — identidade, nenhum agrupamento. O modelo
repete o que escreveu.

Regra de termo resolve: instituto jurídico tem nome estável. `prescric`, `coisa
julgada`, `auxilio emergencial`, `competencia`, `tutela coletiva`. A tabela tem
26 regras, ordem importa (prescrição antes de decadência), e o que não casa fica
com o rótulo original — caso nunca some.

Medido no piloto: 13 rótulos → 4 canônicos, **0 sem regra**.

## 3. Os três olhares

### Estatístico
Top teses por N e %, com a divisão por sentido. Toda linha sai de contagem sobre
CSV, nunca de opinião do modelo.

### Garantista
Cada tese carrega a **garantia processual** acionada: `acesso_a_justica`,
`prescricao`, `coisa_julgada`, `ampla_defesa`, `gratuidade`, `competencia`,
`tutela_coletiva`, `contraditorio`, `execucao`, `outra`. O relatório mostra quais
garantias o desastre mais aciona — no piloto, prescrição em 90,9%.

### Sistematizador
- **Divergência:** mesma tese com os dois sentidos e N ≥ 3, listando os órgãos de
  cada lado. Divergência não é ruído: é direito em disputa.
- **Mudança:** tese cujo sentido predominante inverte entre os períodos (antes de
  2022 × 2022 em diante), com N ≥ 4 em cada lado. Só aparece quando há massa.

## 4. Resultado do piloto (22 casos)

| Tese | N | Pró-atingido | Pró-empresa |
|---|---:|---:|---:|
| prescrição da pretensão indenizatória | 20 | 4 | 16 |

A mesma tese, decidida em sentidos opostos, com maioria pró-empresa. É o tipo de
achado que o gráfico de polo não mostrava.

## 5. Custo e ritmo

- Universo real de desastre: **6.382** decisões (brumadinho 1.111 + riodoce 5.271).
  O número 10.891 do primeiro rascunho somava direitos humanos e súmula por engano.
- ~1 chamada por caso no GLM-4.5-flash (gratuito), 4 em paralelo.
- Ritmo medido no piloto: ~2,6 s por caso com 429 intercalado → **~2 h** para o
  acervo.
- Se um dia for para lote pago: ~R$ 6 no sabiazinho-4 batch.

## 6. O que falta, e é a próxima etapa

| # | Item | Observação |
|---|---|---|
| 1 | Rubrica de **direitos humanos** | 2.398 casos com vocabulário próprio: consumidor, violência, prisão. A rubrica de desastre não serve |
| 2 | Olhar **penal** | 6.182 casos: tese penal (tráfico, homicídio, corrupção) e garantias penais (presunção de inocência, due process) |
| 3 | **Publicação** | seção em `/jurisprudencia` com as top teses, divergências e mudanças; página própria se passar de 10 blocos |
| 4 | Revisão humana | amostra de 30 teses conferida à mão antes de publicar |

## 7. Critérios de aceite

- [ ] 0 rótulos sem regra na canonização (ou lista explícita dos que ficaram).
- [ ] Nenhuma tese publicada com N < 3.
- [ ] Divergência só publicada com órgãos nomeados dos dois lados.
- [ ] Mudança de tese só com N ≥ 4 por período.
- [ ] Relatório `relatorios/TESES.md` gerado e versionado.
- [ ] Nenhum número escrito pelo modelo no relatório.

## 8. O que não fazer

- Não pedir ao modelo para "agrupar rótulos" — ele repete o que escreveu.
- Não publicar tese com N=1 como se fosse padrão.
- Não misturar rubrica de desastre com penal ou direitos humanos.
- Não deixar o modelo escrever número: número é contagem.

## 9. Estado em 02/11/2026, fim do dia

Extração fechada nas três lentes, com cobertura acima de 99%:

| Lente | Teses extraídas | Universo |
|---|---:|---:|
| desastre | 6.378 | 6.382 |
| direitos humanos | 2.382 | 2.398 |
| penal | 6.181 | 6.182 |

Canonização por lente (regra de termo, sem modelo). Cobertura e o que ficou
fora, declarado no próprio relatório:

| Lente | Rótulos crus | Sem regra |
|---|---:|---:|
| desastre | 2.997 | 50,9% |
| direitos humanos | 1.397 | 38,4% |
| penal | 5.273 | 55,8% |

O "sem regra" alto é esperado: 85% dos rótulos aparecem uma única vez. A regra
agrupa os institutos recorrentes; o rótulo solto nunca some, e o relatório diz
quanto ficou fora — em vez de fingir 100% de cobertura.

Relatórios gerados: `tjmg-jurimetria/relatorios/TESES-DESASTRE.md`,
`TESES-DH.md`, `TESES-PENAL.md`.

Achados que já sustentam leitura (todos de contagem):

- **Desastre:** prescrição da pretensão indenizatória é a tese mais frequente
  (722; 11,3%) e a mais dividida — 381 pró-atingido × 294 pró-empresa, com
  desembargadores exclusivos de cada lado.
- **Desastre:** nexo causal aparece 73 vezes e em 71 delas o sentido é
  pró-empresa. Não é tese em disputa; é porta de saída.
- **Desastre, mudou:** auxílio emergencial era 50×7 pró-atingido antes de 2022 e
  virou 18×21 pró-empresa depois. Dano material endureceu (21×51).
- **Direitos humanos:** saúde ocupa 36% da frente (568 direito à saúde + 290
  medicamento), quase sempre pró-cidadão.
- **Penal:** prisão preventiva (342) e dosimetria (256) dominam, com reexame de
  fatos e provas em 221 casos e 220 deles pró-acusação.

## 10. O que falta para publicar

| # | Item | Estado |
|---|---|---|
| 1 | Revisão humana de 30 teses | **bloqueia a publicação** |
| 2 | Bloco de teses em `/jurisprudencia` | não começou |
| 3 | Página própria se passar de 10 blocos | decidir na hora |
| 4 | Aviso na página penal sobre mistura de classes | feito (1.260 cíveis, 1.473 constitucionais) |

Duas decisões de produto pendentes do dono:

1. **O que conta como penal.** A frente é montada por âncora de coleta: 3.449
   criminais, 1.260 cíveis e 1.473 recursos constitucionais. Filtrar por classe
   mudaria o número publicado de 6.182 para ~3.449.
2. **Canonização mais agressiva.** As regras atuais agrupam os institutos
   recorrentes; subir a cobertura exige mais regras ou um dicionário assistido.
   Mais cobertura, mais risco de juntar teses que não são a mesma.
