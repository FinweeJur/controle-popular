# Dados do portal - semana de 2026-11-08

Relatorio automatico de frescor (sem LLM), gerado por `scripts/relatorio-dados-semanal.mts`.

## Resumo

- 21 fontes medidas: 12 ok, 6 atrasadas, 2 sem carimbo, 0 ausentes, 0 sem conexao, 1 editoriais.
- Maior atraso desde a coleta: **Autos de infracao CAP** (90 dias).

## Judiciario

| Dado | Ultima coleta | Data do dado | Volume | Status | Pagina |
|---|---|---|---|---|---|
| Jurisprudencia (acervo) | 2026-11-05 | - | 23.531 | ok | /jurisprudencia |
| Buscador de jurisprudencia | 2026-11-06 | - | 44.812 | ok | /jurisprudencia |

## Ambiental

| Dado | Ultima coleta | Data do dado | Volume | Status | Pagina |
|---|---|---|---|---|---|
| Autos de infracao IBAMA | 2026-11-08 | - | 13.942 | ok | /ambiental/ibama |
| Autos de infracao SISEMA | 2026-11-08 | - | 583.644 | ok | /ambiental/autuacoes |
| Licenciamento nao deferido (MG) | 2026-08-21 | - | 43.444 (9.554 negativas) | atrasado | /ambiental/decisoes |
| TACs GTAC | 2026-11-08 | - | 2.019 | ok | /ambiental/tac |
| TACs por projeto | 2026-09-08 (mtime) | - | 80 | sem-carimbo | /ambiental/tac |
| Legislacao ambiental | 2026-11-01 | 2026-09-30 | 16.060 | ok | /ambiental/legislacao |
| Autos de infracao CAP | 2026-08-10 | 2023-06-07 | 78.039 | atrasado | /ambiental/autuacoes |
| Licenciamento ambiental | 2026-11-08 | 2026-07-30 | 19.713 | ok | /ambiental/licenciamento |
| Pauta COPAM | 2026-11-08 | 2026-11-19 | 497 | ok | /ambiental/copam |

## Transparencia

| Dado | Ultima coleta | Data do dado | Volume | Status | Pagina |
|---|---|---|---|---|---|
| Contratos municipais | 2026-11-03 | 2027-03-04 | 89.634 | atrasado | /[municipio]/prefeitura/contratos |
| Licitacoes (PNCP) | 2026-11-02 | 2026-10-30 | 131.097 | atrasado | /[municipio]/prefeitura/licitacoes |
| Convenios federais | 2026-11-08 | 2026-10-23 | 17.166 | ok | /ambiental/convenios |
| Portarias e atos oficiais | 2026-11-02 | 2026-10-08 | 10.374 | atrasado | /[municipio]/prefeitura/diario |

## Editais e concursos

| Dado | Ultima coleta | Data do dado | Volume | Status | Pagina |
|---|---|---|---|---|---|
| Editais | 2026-09-16 | - | 50 | atrasado | /editais |
| Concursos publicos | 2026-11-02 | - | 74 | ok | /concursos |

## Noticias

| Dado | Ultima coleta | Data do dado | Volume | Status | Pagina |
|---|---|---|---|---|---|
| Noticias Paraopeba | 2026-11-08 | - | 36 | ok | /paraopeba/noticias |
| Noticias de desastres | 2026-11-08 | - | 79 | ok | /ambiental/crimes-socioambientais |
| Noticias do portal | 2026-11-06 (mtime) | - | 245 | sem-carimbo | /noticias |

## Memoria

| Dado | Ultima coleta | Data do dado | Volume | Status | Pagina |
|---|---|---|---|---|---|
| Linha do tempo / Mistica | - | - | - | editorial | /memoria |

## Pendencias

- **Licenciamento nao deferido (MG)** (semanal, atrasado): /ambiental/decisoes
- **TACs por projeto** (mensal, sem-carimbo): /ambiental/tac - sem carimbo no JSON; mtime usado como referencia
- **Editais** (diaria, atrasado): /editais
- **Noticias do portal** (diaria, sem-carimbo): /noticias - sem carimbo no JSON; mtime usado como referencia
- **Contratos municipais** (diaria, atrasado): /[municipio]/prefeitura/contratos
- **Licitacoes (PNCP)** (diaria, atrasado): /[municipio]/prefeitura/licitacoes
- **Autos de infracao CAP** (semanal, atrasado): /ambiental/autuacoes
- **Portarias e atos oficiais** (diaria, atrasado): /[municipio]/prefeitura/diario
