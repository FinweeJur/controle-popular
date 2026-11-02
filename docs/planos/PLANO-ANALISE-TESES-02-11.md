# Plano — análise de teses (estatística, garantista e sistematizadora)

Criado: 2026-11-02. Status: em execução (extração rodando).
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

- Universo: **10.891** decisões de desastre com ementa.
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
