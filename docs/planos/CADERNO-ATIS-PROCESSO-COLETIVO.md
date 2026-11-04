# Caderno — ATIs × processo coletivo × RAG

> **Tipo:** CADERNO
> **Domínio:** jurisprudência dos desastres
> **Última medição:** 2026-11-04
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [PLANO-ANALISE-INTEGRADA-03-11.md](PLANO-ANALISE-INTEGRADA-03-11.md), [PROMPT-BATCH-SABIA-ANALISE-RIO-DOCE.md](PROMPT-BATCH-SABIA-ANALISE-RIO-DOCE.md), [QUALIDADES-DA-INFORMACAO.md](../04-arquitetura/QUALIDADES-DA-INFORMACAO.md)
> **Palavras-chave:** caderno, metodologia, ATI, processo coletivo, RAG, crítico, reprodutibilidade

## Sumário

- [Por que existe](#por-que-existe)
- [Regras do caderno](#regras-do-caderno)
- [Passos](#passos)
- [Log](#log)
- [Pendências](#pendências)

## Por que existe

O catálogo dos acórdãos (rubrica v3) diz o que foi decidido e por quê. As
notícias das ATIs dizem o que está acontecendo no processo coletivo — audiência,
perícia, acordo, homologação, sobrestamento — antes de virar acórdão. Sem elas, a
análise enxerga o Judiciário de costas para o processo.

Este caderno é a trilha: o que foi feito, quando, com qual arquivo e qual número.
Serve ao revisor acadêmico e ao dono.

## Regras do caderno

1. **Número só de contagem.** Relatório cita número que existe em arquivo contado.
2. **Modelo rotula e cita; não conta.** Palavra-chave, tese, conflito, direito: sim.
   Total, percentual, média: nunca.
3. **Link não é cópia.** Notícia de terceiro entra como metadado + URL (Lei 9.610/98).
4. **Sem captcha.** Nenhuma etapa deste caderno depende de resolver desafio.
5. **Vínculo declarado.** Notícia e acórdão só se ligam por número de processo; sem
   número, o vínculo é temático e o relatório diz isso.
6. **Cada passo tem evidência.** Arquivo gerado, contagem e data.

## Passos

| # | Passo | Script | Saída |
|---|---|---|---|
| P1 | triagem das ATIs sobre processo coletivo | `triar_atis.py` | `tabelas/ati-processo-coletivo.csv` |
| P2 | cruzamento notícia ↔ acórdão | `cruzar_ati_acervo.py` | `relatorios/ATI-PROCESSO-COLETIVO.md` |
| P3 | catálogo dos indeterminados (S5) | `rotular_sync.py` | `tabelas/lotes_rotulo/sync-S5-free.csv` |
| P4 | jurimetria nos eixos NACAB | `jurimetria_rio_doce.py` | `relatorios/JURIMETRIA-RIO-DOCE.md` |
| P5 | fontes citáveis (artigos + biblioteca) | `fontes_para_analise.py` | `relatorios/FONTES-ANALISE.md` |
| P6 | crítica acadêmica | `critico_academico.py` | `relatorios/CRITICA-ACADEMICA.md` |
| P7 | acervo publicado | `gerar_jurisprudencia_casos.py` | `apps/web/data/jurisprudencia-casos.json` |

## Log

| Data | Passo | O que foi feito | Evidência |
|---|---|---|---|
| 04/11/2026 | P1 | 138 itens triados de 159 candidatos; gatilho por termo, número de processo extraído do título | `ati-processo-coletivo.csv` |
| 04/11/2026 | P1 | 0 notícias citam número de processo no título — registrado, não contornado | relatório P2 |
| 04/11/2026 | P2 | vínculo temático: 62 notícias de acordo ↔ 19 acórdãos `acordo_indenizacao`; 2 de perícia ↔ 14 `prova_e_pericia` | `ATI-PROCESSO-COLETIVO.md` |
| 04/11/2026 | P2 | gatilho virou multi-rótulo: notícia de sobrestamento também diz "acordo" e sumia do cruzamento | `triar_atis.py` |
| 04/11/2026 | P3 | rubrica v3 (catálogo) rodando no S5-free, checkpoint por linha | `sync-S5-free.csv` |
| 04/11/2026 | P3 | frente virou parâmetro: Brumadinho 2.471 na fila, dh 2.373, penal 6.166; Rio Doce segue 3.656 | `lote_rotulagem.fila(frente)` |
| 04/11/2026 | P3 | planilha da própria frente decide quem não vai ao modelo: 413 chamadas evitadas em Brumadinho | `_ja_decidido` |
| 04/11/2026 | P3 | glm-4.5-flash medido: 148 s para 1.300 caracteres de ementa; reserva, não volume | `logs/` |
| 04/11/2026 | P3 | cadeia de frentes criada: espera a rodada viva e retoma do checkpoint | `encadear_catalogos.py` |
| 04/11/2026 | P6 | primeira crítica: 6 arquivos ok, citações 0 fora do catálogo, amostra 20 com 7 divergências de polo | `CRITICA-ACADEMICA.md` |
| 04/11/2026 | P6 | números do crítico deixaram de acusar milhar, percentual e data como órfãos | `CRITICA-ACADEMICA.md` |
| 04/11/2026 | P6 | cobertura passou a ser medida por frente, não pelo repo inteiro | `critico_academico.py --frente` |
| 04/11/2026 | P3 | Rio Doce fechado: 3.656/3.656; crítico 0 erro em 14 conferências; deploy concluído | `CATALOGO-INDETERMINADOS.md` |
| 04/11/2026 | P3 | Brumadinho fechado: 2.469/2.471; 2 casos nunca devolveram JSON e estão listados | `sync-brumadinho-S5-free.csv` |
| 04/11/2026 | P3 | rubrica v4 sem amarrar o texto ao Rio Doce: Brumadinho tem 90,1% de lado declarado | `rubrica-rotulo-v4.txt` |
| 04/11/2026 | P3 | rubrica de direitos humanos (v1) com vocabulário próprio; `--variante` no rotulador | `rubrica-rotulo-dh-v1.txt` |
| 04/11/2026 | P2 | Itatiaiuçu medido: 7 acórdãos confirmados na ementa, 173 menções de passagem | `ITATIAIACU.md` |
| 04/11/2026 | P7 | síntese temática: conflito × órgão × comarca × ano sobre 6.125 casos | `SINTESE-TEMATICA.md` |
| 04/11/2026 | P6 | auditoria de evidência: 512 de 6.125 linhas citavam trecho ausente da fonte; reparadas | `EVIDENCIA-AUDITORIA.md` |
| 04/11/2026 | P3 | direitos humanos fechado: 2.373/2.373 com rubrica própria no home-pc | `CATALOGO-DH.md` |
| 04/11/2026 | P3 | um 502 da Maritaca matou a rodada de DH em 1.903; agora há repetição e fallback gratuito | `rotular_sync.py` |
| 04/11/2026 | P3 | Brumadinho: processo anterior a 25/01/2019 sai da frente (2 casos, número de 2013 e 2014) | `jurisprudencia_fontes.py` |

## Pendências

- [ ] fechar P3 (3.656 casos no S5-free)
- [ ] conferir os 8 números sem fonte no relatório de jurimetria
- [ ] revisar à mão as divergências de polo da amostra
- [ ] publicar a página e as subpáginas com os dados novos
