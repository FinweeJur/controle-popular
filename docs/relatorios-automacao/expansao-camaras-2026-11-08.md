# Expansao para as 853 cidades de MG - Camaras (AMM e SAPL)

> **Tipo:** RELATORIO
> **Dominio:** cidades
> **Ultima medicao:** 2026-11-08
> **Leitura estimada:** media (6-9 min)
> **Relacionados:** [expansao-fase0-2026-11-08.md](expansao-fase0-2026-11-08.md), [expansao-fase1-2026-11-08.md](expansao-fase1-2026-11-08.md), [FONTES.md](../06-fontes/FONTES.md)
> **Palavras-chave:** expansao, municipios, MG, camaras, AMM, SIGPub, SAPL, fase 1.5

## Sumario

- [Resumo](#resumo)
- [1. Camaras na AMM (SIGPub)](#1-camaras-na-amm-sigpub)
- [2. Prova de que a entidade e a camara](#2-prova-de-que-a-entidade-e-a-camara)
- [3. Amostra de hosts SAPL](#3-amostra-de-hosts-sapl)
- [4. Mudanca no coletor e testes](#4-mudanca-no-coletor-e-testes)
- [5. Bloqueios e o que nao foi verificado](#5-bloqueios-e-o-que-nao-foi-verificado)
- [6. Leitura para a Onda 2](#6-leitura-para-a-onda-2)
- [7. Reprodutibilidade](#7-reprodutibilidade)

## Resumo

As camaras das cinco cidades-piloto da expansao foram coletadas pelo proprio
coletor do repo (layout novo da AMM, sem wrapper externo, sem banco). Em
outubro/2026 deram 34 materias, 5 requisicoes, 613.486 bytes e zero erro.

A amostra de 10 hosts `sapl.<slug>.mg.leg.br` mostrou que o padrao continua
sendo candidato, nao fonte: 2 respondem com SAPL 3.x de verdade (Bocaiuva e
Formiga), 8 nem resolvem no DNS. O controle com `sapl.aracuai.mg.leg.br`
respondeu normal, provando que a sonda e a rede funcionam.

| Entrega | Resultado |
|---|---|
| Camara AMM (5 pilotos, out/2026) | 34 materias, 18,16 s, 613.486 bytes, 5 requisicoes, 0 erro |
| Entidade conferida | 34/34 cartoes rotulados "Camara Municipal de ..." |
| Amostra SAPL | 2/10 respondem (Bocaiuva e Formiga, SAPL 3.x); 8 sem DNS |
| Controle SAPL | `sapl.aracuai.mg.leg.br` OK, 15 parlamentares |
| Mudanca de codigo | `--sondar` imprime metricas tambem em mes vazio |
| Suite | 13 testes do SIGPub e 94 do ETL, todos verdes |
| Dado bruto | nao commitado; so metadados publicos |

## 1. Camaras na AMM (SIGPub)

IDs das entidades vieram de `apps/web/data/expansao-fontes-mg.json` (Fase 0),
que os extraiu do seletor da propria AMM. As cinco cidades tem prefeitura e
camara cadastradas; a Fase 0 coletou so a prefeitura.

Comando (repetido por entidade, de `etl/betim`):

```powershell
python -m etl.camaras.sigpub --sondar --entidade-usuaria 40180 `
  --rotulo-entidade "Camara Abadia dos Dourados" --desde 2026-10 --ate 2026-10
```

| Cidade | IBGE | Entidade camara | Materias | Tempo | Bytes | Reqs | Erro |
|---|---|---:|---:|---:|---:|---:|---|
| Abadia dos Dourados | 3100104 | 40180 | 1 | 3,81 s | 104.685 | 1 | - |
| Bocaiuva | 3107307 | 3981901 | 0 | 3,50 s | 101.376 | 1 | - |
| Formiga | 3126109 | 9715 | 14 | 3,47 s | 145.199 | 1 | - |
| Boa Esperanca | 3107109 | 4077813 | 2 | 3,47 s | 108.401 | 1 | - |
| Catas Altas | 3115359 | 93469 | 17 | 3,91 s | 153.825 | 1 | - |
| **Total** | | | **34** | **18,16 s** | **613.486** | **5** | **0** |

Medias por camara-mes: 6,8 materias, 3,63 s, 123 KB, 1 requisicao. A variancia
e alta (0 a 17), maior que a da prefeitura.

Tipos no mes: 11 portaria, 9 edital, 4 contrato, 8 outro, 1 lei, 1 decreto.

Bocaiuva teve 0 materia em outubro/2026. Nao e bloqueio: a resposta tem o
formulario e a lista vazia, e o coletor distingue "mes vazio" de "HTML
inesperado" (que levanta `BloqueioSigpub`). Para medir bytes/requisicoes
nesse caso, o modo `--sondar` passou a imprimir as metricas tambem no resumo
vazio (ver secao 4).

## 2. Prova de que a entidade e a camara

O rotulo `--rotulo-entidade` e so do log. A prova de que o id e mesmo a
camara vem do campo `entidade` de cada cartao devolvido pela fonte:

| Cidade | Entidade nos cartoes | Linhas |
|---|---|---:|
| Abadia dos Dourados | Camara Municipal de Abadia dos Dourados | 1 |
| Bocaiuva | (mes vazio) | 0 |
| Formiga | Camara Municipal de Formiga | 14 |
| Boa Esperanca | Camara Municipal de Boa Esperanca | 2 |
| Catas Altas | Camara Municipal de Catas Altas | 17 |

Nenhum cartao veio rotulado como prefeitura. O layout novo da AMM aceita o id
da camara em `busca_avancada[entidade]` sem nenhuma adaptacao: a funcao
compartilhada nao precisou de mudanca de logica.

## 3. Amostra de hosts SAPL

Amostra deterministica de 10 cidades do catalogo: as 5 piloto + a primeira
cidade por ordem de IBGE de cada uma das 5 mesorregioes ainda nao
representadas (Central Mineira, Zona da Mata, Vale do Rio Doce, Vale do
Mucuri, Campo das Vertentes). Hosts `host_sapl_previsto` da matriz da Fase 0.

Metodo: `GET /api/` e, quando 200, `GET /api/parlamentares/parlamentar/?limit=1`
com a sessao e o parser de envelope de `etl/betim/etl/camaras/sapl.py`
(`sapl._SESSAO` + `sapl._envelope`). Timeout de 20 s. Sem coleta em massa, sem
banco.

| Cidade | IBGE | Host | Status /api/ | Layout | Parlamentares (total_entries) | ms |
|---|---|---|---:|---|---:|---:|
| Bocaiuva | 3107307 | `sapl.bocaiuva.mg.leg.br` | 200 | SAPL 3.x (envelope custom) | 38 | 1.984 |
| Formiga | 3126109 | `sapl.formiga.mg.leg.br` | 200 | SAPL 3.x (envelope custom) | 27 | 1.969 |
| Abadia dos Dourados | 3100104 | `sapl.abadia-dos-dourados.mg.leg.br` | - | sem resposta: DNS | - | 47 |
| Boa Esperanca | 3107109 | `sapl.boa-esperanca.mg.leg.br` | - | sem resposta: DNS | - | 16 |
| Catas Altas | 3115359 | `sapl.catas-altas.mg.leg.br` | - | sem resposta: DNS | - | 16 |
| Abaete | 3100203 | `sapl.abaete.mg.leg.br` | - | sem resposta: DNS | - | 31 |
| Abre Campo | 3100302 | `sapl.abre-campo.mg.leg.br` | - | sem resposta: DNS | - | 32 |
| Acucena | 3100500 | `sapl.acucena.mg.leg.br` | - | sem resposta: DNS | - | 172 |
| Aguas Formosas | 3100906 | `sapl.aguas-formosas.mg.leg.br` | - | sem resposta: DNS | - | 31 |
| Alfredo Vasconcelos | 3101631 | `sapl.alfredo-vasconcelos.mg.leg.br` | - | sem resposta: DNS | - | 16 |

Resultado: **2/10 respondem**, ambos SAPL 3.x com o envelope customizado
(`pagination` + `results`, o mesmo contrato que `sapl._paginar` espera). Os
outros 8 falham em `NameResolutionError` (`getaddrinfo failed`), ou seja, o
subdominio nao existe — nao e timeout nem bloqueio.

Controle fora da amostra, com host que o repo ja usa:

```
https://sapl.aracuai.mg.leg.br/api/  -> 200 application/json
/api/parlamentares/parlamentar/?limit=1 -> envelope SAPL, total_entries=15
```

O controle prova que a sonda e a saida de rede funcionam; o problema e o
padrao `sapl.<slug>.mg.leg.br`, que so existe em parte das casas.

## 4. Mudanca no coletor e testes

Mudanca unica em `etl/betim/etl/camaras/sigpub.py`, no modo `--sondar`:
quando o mes vem vazio, o resumo agora imprime requisicoes, bytes e tempo
antes de encerrar. Antes, o retorno antecipado escondia exatamente as
metricas que a medicao de camaras precisa (caso Bocaiuva). Nenhuma mudanca
no caminho de busca, parsing ou gravacao.

Testes:

```
cd etl/betim
python -m unittest etl.camaras.sigpub_test -v   -> Ran 13 tests ... OK
python -m pytest etl -q                         -> 94 passed
```

Nao foi preciso ajustar a busca para camara: o layout novo usa
`busca_avancada[entidade]`, e o id da camara entra no mesmo campo do id da
prefeitura (secao 2).

## 5. Bloqueios e o que nao foi verificado

1. **`sapl.<slug>.mg.leg.br` nao e fonte confirmada.** 8/10 da amostra nem
   resolvem no DNS. Ativar cidade com esse host repetiria o 404 de 03/09.
   Descoberta tem de passar pelo diretorio do Interlegis (`sapl.py
   --descobrir`) ou pelo site da camara, host por host.
2. **Cadastro na AMM nao prova publicacao ativa.** 133 camaras tem entidade;
   nas 5 pilotos, outubro rendeu 34 materias no total, com uma cidade em zero.
   A cobertura real se mede coletando, nao lendo o seletor.
3. **`sapl.py sync()` nao rodou.** O worktree nao tem `DATABASE_URL`; a sonda
   usou so `/api/` e o parser de envelope. Nenhuma coleta em massa foi feita.
4. **SAPL 2.x nao apareceu na amostra.** Nao houve 404 em `/api/`; nao da
   para estimar quantas casas usam a versao antiga com base nesses 10.
5. **LGPD.** So metadados publicos (titulo, tipo, data, link, entidade).
   Nenhuma pagina de detalhe foi buscada (`--com-detalhe` desligado) e nenhum
   bruto foi commitado.
6. **Build, deploy e cidades ativas:** intocados.

## 6. Leitura para a Onda 2

Projecao para um mes fechado, usando a media medida das camaras AMM:

| Cobertura | Materias | Tempo | Bytes | Requisicoes |
|---|---:|---:|---:|---:|
| 133 camaras com entidade AMM | ~904 | ~8 min | ~16,3 MB | 133 |
| 109 cidades com prefeitura e camara | ~904 (camara) + 57.884 (prefeitura, Fase 0) | ~8 min + 1,3 h | ~16,3 MB + 444 MB | 133 + 2.495 |

A camara custa cerca de 10% do tempo da prefeitura e 4% dos bytes. O gargalo
segue sendo a prefeitura e, mais ainda, a fonte ausente (354 cidades sem
entidade AMM).

Ordem sugerida para a Onda 2:

1. Coletar camara das 133 cidades com entidade AMM, junto da prefeitura das
   109 que tem as duas — mesma rodada, mesmo mes.
2. Testar SAPL so nos hosts ja confirmados das 203 (22) e nos descobertos
   pelo Interlegis; nunca no padrao `sapl.<slug>` em lote.
3. Antes de ativar cidade no build, rodar a varredura LGPD sobre
   `atos_diario` (a F1 deixou pendente).

## 7. Reprodutibilidade

```
# coleta de uma camara (de etl/betim)
python -m etl.camaras.sigpub --sondar --entidade-usuaria 9715 `
  --rotulo-entidade "Camara Formiga" --desde 2026-10 --ate 2026-10

# testes
python -m unittest etl.camaras.sigpub_test -v
python -m pytest etl -q
```

IDs de camara: `apps/web/data/expansao-fontes-mg.json` ->
`por_cidade.<ibge>.diario.entidades[]` com `papel == "camara"` (Fase 0).
Amostra SAPL: 5 pilotos + primeira cidade por IBGE de Central Mineira, Zona
da Mata, Vale do Rio Doce, Vale do Mucuri e Campo das Vertentes.
