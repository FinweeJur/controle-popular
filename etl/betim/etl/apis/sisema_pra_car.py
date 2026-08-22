r"""etl.apis.sisema_pra_car — Termos de Compromisso do PRA, CAR, Áreas a
Recompor e ICMS Ecológico, do painel "Instrumentos de Planejamento e Gestao"
da SEMAD/MG (um dos 4 relatórios-filhos do menu Sisema — ver
`docs/FONTES.md`, seção "Painel Sisema").

resourceKey `e0057134-0e75-4e3d-9679-824d662eccc7`, modelId `5910139`. Mesmo
mecanismo do "Painel TACs Final" (`etl.apis.tacs_mineradoras`): Power BI
público, sem login, decodificado por `etl.apis._powerbi_dsr` (puro,
testado). Uso:

    python -m etl.apis.sisema_pra_car --sondar          # não grava
    python -m etl.apis.sisema_pra_car --entidade car
    python -m etl.apis.sisema_pra_car                    # tudo, grava JSON

═══ TRÊS RESSALVAS QUE VIAJAM COLADAS AO DADO (mesmas do painel-irmão) ═══

1. **Dado CONGELADO em 2026-08-20** (`refreshEnabled: false`,
   `lastRefreshTime` = 2026-08-20T18:06:37.56 UTC, medido ao vivo contra
   `modelsAndExploration`). Não é situação atual do PRA/CAR/ICMS — é a foto
   do dia do congelamento. Toda linha grava `_dado_congelado_em`.
2. **Publicado de "My workspace" pessoal** (`ownerInfo.groupDisplayName ==
   "My workspace"`, medido ao vivo em 2026-08-21) — sem governança de área,
   depende de uma conta.
3. **O contrato do DSR não é documentado** e pode mudar sem aviso — por
   isso os decodificadores (o genérico e o dedicado abaixo) erguem em vez
   de adivinhar.

═══ A CORREÇÃO NO MAPA DE COLUNAS DA `PRA` ═══

O mapeamento de entrada listava 5 colunas para `PRA`: `ID`, `Município`,
`Ano`, `URFBio responsável pelo preenchimento`, `A propriedade alvo do PRA
possui`. Testado coluna a coluna contra o endpoint em 2026-08-21: as duas
últimas devolvem `CouldNotResolveSemanticQueryDefinition ... invalid Column
reference` — são `displayName` de medida/agregação do visual, não colunas
da entidade (mesma armadilha já documentada em `tacs_mineradoras`, só que
desta vez achada NESTE módulo, não herdada). `PRA` fica com 3 colunas reais:
`ID`, `Município`, `URFBio responsável pelo preenchimento`.

═══ A DESCOBERTA QUE MUDOU A FORMA DO COLETOR: `CAR_completo` TEM 1.164.209
LINHAS, NÃO 10–50 MIL ═══

O mapeamento de entrada estimava "10.000–50.000" linhas para `CAR_completo`.
Medido ao vivo em 2026-08-21 por paginação real via `RestartTokens` (ver
abaixo): **1.164.209 registros** — 23× a estimativa alta, e SICAR de Minas
Gerais como um todo (não é bug: `Município` sozinho já dá as 853 cidades de
MG, e a "distinct count" por Recibo bate EXATO em três consultas
independentes, ver abaixo).

Isso quebra o molde de `tacs_mineradoras` (window até MENOR que a janela):
o servidor tem um **teto físico de 30.000 linhas por pedido**, medido pedindo
janela 40.000 e 100.000 e recebendo sempre exatamente 30.000 de volta — igual
ao `_JANELA_MAXIMA` que `tacs_mineradoras` já cravava, mas lá por precaução;
aqui é o teto real batendo. Dá pra ir além com `RestartTokens` (funciona: a
primeira linha da página seguinte REPETE a última da página anterior —
paginação por chave, inclusiva — e paginar as 39 páginas até a última vir
menor que a janela mediu o total acima, com ZERO duplicata de "Número do
Recibo" fora do overlap esperado de 1 linha por página).

**Mas gravar 1,16 milhão de linhas × 15 colunas em JSON não faz sentido**:
nenhum consumidor deste repositório grava arquivo desse tamanho (o maior
hoje em `dados/` tem 15 MB; isto passaria de 1 GB), nenhuma aba do site
"navega" 1,16 milhão de registros individuais, e as abas-alvo (CAR, ÁREAS A
RECOMPOR) são inerentemente agregadas — "quanto falta averbar por
município", não "lista de imóveis". A resposta correta não é truncar (isso
SIM seria mentir com número — "27 quando são 300"): é pedir ao PRÓPRIO
Power BI para agregar, com `Aggregation` no lugar de `Column` no `Select`.
Testado ao vivo: `Function: 0` = Sum, `Function: 2` = DistinctCount (as
únicas função funcionam em coluna texto: `Function: 1` e `6` e `7`
devolveram erro nomeando "Average"/"Median"/"StandardDeviation" — o enum
não é documentado, foi descoberto por tentativa, 0–7). Agrupado por
`Município` (853 linhas — TODOS os municípios de MG, nenhuma janela cheia),
soma das 7 colunas de área + `DistinctCount` de `Número do Recibo`.

**Prova de que a agregação não perde linha**: uma consulta separada, SEM
agrupamento, com só `DistinctCount(Número do Recibo)` devolve `1164209` —
igual à soma da paginação bruta. E a soma da coluna `imoveis_cadastrados`
nas 853 linhas por-município TAMBÉM fecha em `1164209`. E cada uma das 6
quebras categóricas abaixo (Situação, Fase, Bioma, Tipo, Tamanho, URFBio)
soma `1164209` de novo — seis confirmações independentes, todas exatas, não
aproximadas. Por isso `coletar()` ergue `RuntimeError` se qualquer uma
dessas somas não bater: é a trava de sanidade deste módulo.

O bloco `car` no JSON de saída sai como DICT (não lista, ao contrário das
outras entidades): `por_municipio` (853), `total_geral` (1 número, a prova),
e uma quebra por cada uma das 6 colunas categóricas confirmadas no mapa de
entrada (`Situação do Imóvel`, `Fase do Processo`, `Bioma predominante`,
`Tipo do Imóvel`, `Tamanho Imóveis`, `URFBio.1`) — cobre as 15 colunas
mapeadas sem descartar nenhuma, só troca "uma linha por imóvel" por "uma
linha por corte", que é a forma que serve a uma página pública.

═══ A SEGUNDA FORMA DE DSR: PROJEÇÃO ÚNICA VEM SEM `C`/`R`/`Ø` ═══

`etl.apis._powerbi_dsr.decodificar_dsr` foi escrito pro DSR genérico
(dicionário + máscara de repetição + máscara de nulo, tudo em `C`). Ele
QUEBRA de propósito (`C` acabou na coluna X) quando o pedido tem **uma única
projeção** — uma coluna sozinha (`Bacias hidrograficas_Municipios[Bacia
Federal]`) ou uma agregação sozinha sem agrupamento (o `total_geral` do
CAR). Medido ao vivo: nesses casos o Power BI serializa cada linha como
`{"<nome interno>": valor}` direto, sem `C` nem máscara nenhuma — não há o
que comprimir quando a linha inteira é um escalar sem repetição possível
nesta forma. `_decodificar_projecao_unica`, neste módulo, cobre só este
caso, com as mesmas guardas em espírito do decodificador genérico (ergue se
o esquema tiver mais de 1 coluna, se usar dicionário `DN`, ou se uma linha
trouxer chave que não devia estar aí — sinal de que a forma mudou de volta
pra a genérica). Não é reescrita de `_powerbi_dsr`: é um parser à parte para
uma forma que ele nunca tentou cobrir, reaproveitando dele só a navegação
de envelope (`extrair_data`) e a classe `Tabela` — a parte difícil (as três
camadas de compressão) continua vivendo só lá.

═══ DATASET_ID / REPORT_ID REAPROVEITADOS DE `tacs_mineradoras` ═══

Os dois são os MESMOS valores do painel de TACs (relatório diferente,
mesmo tenant). Testado ao vivo: funcionam aqui também — o endpoint aceita
o pedido e devolve DSR válido. Isso só é possível porque quem autoriza de
verdade é o header `X-PowerBI-ResourceKey`; `ApplicationContext.DatasetId`/
`Sources[].ReportId` parecem não ser validados contra o resourceKey. Não
testado: se algum dia o endpoint passar a validar, o pedido volta 400/403 —
neste caso, os valores reais saem de `exploration.reportId` em
`modelsAndExploration` (aqui, um ID numérico — `6129536` — não um GUID; a
forma GUID usada abaixo não veio deste endpoint, veio por herança do painel
de TACs e funcionou por sorte ou por o campo realmente não ser checado).
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests

from etl.apis._powerbi_dsr import ErroDSR, Tabela, conferir, decodificar_resposta, extrair_data

LOG = "[etl.apis.sisema_pra_car]"

BASE = "https://wabi-brazil-south-b-primary-api.analysis.windows.net"
URL = f"{BASE}/public/reports/querydata?synchronous=true"

RESOURCE_KEY = "e0057134-0e75-4e3d-9679-824d662eccc7"
MODEL_ID = 5910139
# Reaproveitados de `tacs_mineradoras` — ver docstring do módulo, última seção.
DATASET_ID = "53649114-3412-4059-9767-6eb16d6662f9"
REPORT_ID = "31c85c87-854d-4a7a-b733-67abe684a859"

# `refreshEnabled: false` + `lastRefreshTime`, medido ao vivo em 2026-08-21
# contra `modelsAndExploration`. Ver docstring §1.
DADO_CONGELADO_EM = "2026-08-20"
WORKSPACE_DE_ORIGEM = "My workspace"

TIMEOUT = 120
_UA = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"

_JANELA_INICIAL = 500
_JANELA_MAXIMA = 30_000  # teto físico do servidor — medido, não escolhido (ver docstring).

_SAIDA = "dados/sisema-pra-car.json"

# ────────────────────────────── mapa de entidades ────────────────────────

# Entidades de linha crua — cabem inteiras numa janela só, seguem o molde de
# `tacs_mineradoras._buscar_entidade` (sobe janela até provar fim).
ENTIDADES_BRUTAS: dict[str, dict] = {
    "pra": {
        "entidade": "PRA",
        # CORRIGIDO: o mapa de entrada listava também "Ano" e "A propriedade
        # alvo do PRA possui" — as duas devolvem `invalid Column reference`
        # (são medida/agregação do visual, não coluna). Ver docstring.
        "campos": ["ID", "Município", "URFBio responsável pelo preenchimento"],
    },
    "icms": {
        "entidade": "ICMS ECOLÓGICO ATUALIZADO_IDE",
        "campos": [
            "ANO", "Município", "FaixaValor", "Critério Mata Seca", "Critério Saneamento",
            "Critério Unidades de Conservação", "Mata Seca (C)", "Saneamento (B)",
            "Unidades de conservação (A)", "Meio Ambiente (A+B+C)",
        ],
    },
}

# Entidade de coluna única — mesma entidade em todo pedido, forma de DSR
# diferente (ver docstring, "A SEGUNDA FORMA DE DSR").
ENTIDADE_COLUNA_UNICA: dict[str, dict] = {
    "bacias": {"entidade": "Bacias hidrograficas_Municipios", "campo": "Bacia Federal"},
}

# CAR: agregado no servidor, não em linha crua (ver docstring). As 7 colunas
# de área somadas + a contagem de imóveis, por município; e uma quebra por
# cada uma das 6 colunas categóricas que sobraram do mapa de entrada.
CAR_ENTIDADE = "CAR_completo"
CAR_CAMPO_MUNICIPIO = "Município"
CAR_CAMPO_CONTAGEM = "Número do Recibo"  # DistinctCount = "quantos imóveis"
CAR_CAMPOS_SOMA = [
    "Área Antropizada (ha)", "Área Consolidada (ha)",
    "Área de Reserva Legal Averbada", "Área de Reserva Legal Proposta",
    "Vegetação Nativa em APP (ha)", "Vegetação Nativa em Reserva Legal (ha)",
    "Vegetação Nativa em area de Uso Restrito (ha)",
]
CAR_DIMENSOES_CATEGORICAS = [
    "Situação do Imóvel", "Fase do Processo", "Bioma predominante",
    "Tipo do Imóvel", "Tamanho Imóveis", "URFBio.1",
]
# Enum de `Aggregation.Function` não documentado pela Microsoft — descoberto
# por tentativa em 2026-08-21 contra CAR_completo (coluna texto): 0 e 2
# resolvem; 1 ("Average"), 6 ("Median") e 7 ("StandardDeviation") devolvem
# erro nomeando a função — o nome no erro é o que confirma o mapeamento.
_FUNC_SOMA = 0
_FUNC_CONTAGEM_DISTINTA = 2


# ────────────────────────────── HTTP / pedido ───────────────────────────


def _sessao() -> requests.Session:
    s = requests.Session()
    s.headers.update({
        "User-Agent": _UA,
        "Content-Type": "application/json;charset=UTF-8",
        "X-PowerBI-ResourceKey": RESOURCE_KEY,
    })
    return s


def _envelope(select: list[dict], entidade: str, janela: int) -> dict:
    fonte = "e"
    return {
        "version": "1.0.0",
        "queries": [{
            "Query": {"Commands": [{"SemanticQueryDataShapeCommand": {
                "Query": {
                    "Version": 2,
                    "From": [{"Name": fonte, "Entity": entidade, "Type": 0}],
                    "Select": select,
                },
                "Binding": {
                    "Primary": {"Groupings": [{"Projections": list(range(len(select)))}]},
                    "DataReduction": {"DataVolume": 3, "Primary": {"Window": {"Count": janela}}},
                    "Version": 1,
                },
            }}]},
            "QueryId": "",
            "ApplicationContext": {
                "DatasetId": DATASET_ID,
                "Sources": [{"ReportId": REPORT_ID, "VisualId": ""}],
            },
        }],
        "cancelQueries": [],
        "modelId": MODEL_ID,
    }


def montar_pedido_bruto(entidade: str, campos: list[str], janela: int) -> dict:
    fonte = "e"
    select = [
        {"Column": {"Expression": {"SourceRef": {"Source": fonte}}, "Property": campo},
         "Name": f"{fonte}.{campo}"}
        for campo in campos
    ]
    return _envelope(select, entidade, janela)


def montar_pedido_coluna_unica(entidade: str, campo: str, janela: int) -> dict:
    fonte = "e"
    select = [{"Column": {"Expression": {"SourceRef": {"Source": fonte}}, "Property": campo},
               "Name": f"{fonte}.{campo}"}]
    return _envelope(select, entidade, janela)


def montar_pedido_agregado(
    entidade: str, dimensao: str, medidas: list[tuple[str, int, str]], janela: int
) -> dict:
    """`medidas`: lista de (nome_de_saida, funcao, campo_fonte)."""
    fonte = "e"
    select = [{"Column": {"Expression": {"SourceRef": {"Source": fonte}}, "Property": dimensao},
               "Name": f"{fonte}.{dimensao}"}]
    for nome_saida, funcao, campo in medidas:
        select.append({
            "Aggregation": {
                "Expression": {"Column": {"Expression": {"SourceRef": {"Source": fonte}}, "Property": campo}},
                "Function": funcao,
            },
            "Name": nome_saida,
        })
    return _envelope(select, entidade, janela)


def montar_pedido_total_geral(entidade: str, campo: str, nome_saida: str, janela: int = 5) -> dict:
    """Agregação SEM agrupamento — uma linha só, o total do estado inteiro.
    Usada como prova independente de que a quebra por município/categoria
    não perdeu registro (ver docstring)."""
    select = [{
        "Aggregation": {
            "Expression": {"Column": {"Expression": {"SourceRef": {"Source": "e"}}, "Property": campo}},
            "Function": _FUNC_CONTAGEM_DISTINTA,
        },
        "Name": nome_saida,
    }]
    return _envelope(select, entidade, janela)


def _consultar(sessao: requests.Session, pedido: dict) -> dict:
    r = sessao.post(URL, data=json.dumps(pedido, ensure_ascii=False).encode("utf-8"), timeout=TIMEOUT)
    if r.status_code in (401, 403):
        raise RuntimeError(
            f"{LOG} HTTP {r.status_code} do endpoint. Pista falsa: cluster errado responde 401 e "
            f"api.powerbi.com responde 403 — os dois PARECEM falta de login, mas este relatório é "
            f"público e não usa token. Confira o cluster ({BASE}) e o header X-PowerBI-ResourceKey "
            f"antes de procurar autenticação. Corpo: {r.text[:400]!r}"
        )
    r.raise_for_status()
    return r.json()


def _erguer_se_odata_error(resposta: dict, contexto: str) -> None:
    """Checa o padrão de erro deste endpoint que NÃO aparece em
    `results[0].error` (o que `_powerbi_dsr.extrair_data` já cobre), e sim
    aninhado em `result.data.dsr.DataShapes[0]["odata.error"]` — a mesma
    forma HTTP-200-que-mente documentada em `tacs_mineradoras`, só que
    aninhada um nível mais fundo. `decodificar_resposta` acaba erguendo de
    qualquer forma quando bate nesse caso (falta `dsr.DS`), mas com mensagem
    genérica; esta checagem antecipa e nomeia a coluna que falhou."""
    try:
        dsr = resposta["results"][0]["result"]["data"]["dsr"]
    except (KeyError, IndexError, TypeError):
        return
    if isinstance(dsr, dict) and "DataShapes" in dsr:
        erro = (dsr["DataShapes"] or [{}])[0].get("odata.error", {})
        msg = (erro.get("message") or {}).get("value", erro)
        raise ErroDSR(f"{LOG} {contexto}: odata.error dentro do HTTP 200 — {msg}")


# ─────────────────────── decodificador de projeção única ─────────────────


def _decodificar_projecao_unica(resposta: dict) -> Tabela:
    """Quando o pedido tem UMA única projeção — uma coluna sozinha, ou uma
    agregação sozinha sem agrupamento —, o Power BI serializa cada linha
    como `{"<nome interno>": valor}` direto, SEM `C`/`R`/`Ø`: não há o que
    comprimir quando a linha inteira é um escalar sem repetição possível
    nesta forma. `decodificar_resposta` (o módulo irmão) quebra de
    propósito nesse caso — foi escrito pro DSR genérico. Ver docstring do
    módulo, "A SEGUNDA FORMA DE DSR". Reaproveita `extrair_data` e `Tabela`
    de `_powerbi_dsr`; a decodificação da linha, aqui, é deliberadamente
    NOVA — cobre uma forma que o módulo irmão nunca tentou cobrir."""
    data = extrair_data(resposta)
    dsr = data.get("dsr")
    if not isinstance(dsr, dict):
        raise ErroDSR(f"{LOG} `result.data.dsr` ausente ou não é objeto.")
    if "DataShapes" in dsr:
        erro = (dsr["DataShapes"] or [{}])[0].get("odata.error", {})
        raise ErroDSR(f"{LOG} odata.error dentro do HTTP 200: {erro!r}")

    nomes = {
        item.get("Value"): item.get("Name")
        for item in (data.get("descriptor") or {}).get("Select") or []
    }
    if not nomes:
        raise ErroDSR(f"{LOG} `descriptor.Select` vazio — sem nome pra a coluna.")

    conjuntos = dsr.get("DS")
    if not (isinstance(conjuntos, list) and conjuntos):
        raise ErroDSR(f"{LOG} `dsr.DS` ausente ou vazio.")
    ds = conjuntos[0]
    paginas = ds.get("PH") or []
    brutas: list[dict] = [linha for ph in paginas for linha in (ph.get("DM0") or [])]

    if not brutas:
        return Tabela(colunas=[], linhas=[], total_declarado=0, diagnostico={"forma": "projecao_unica"})

    esquema = brutas[0].get("S")
    if not (isinstance(esquema, list) and len(esquema) == 1):
        raise ErroDSR(
            f"{LOG} esperava schema de 1 coluna (projeção única); veio {esquema!r} — "
            "o pedido tem mais de 1 projeção, ou a forma do DSR mudou."
        )
    campo = esquema[0]
    if campo.get("DN") is not None:
        raise ErroDSR(
            f"{LOG} coluna com dicionário (DN={campo['DN']!r}) — este parser só cobre valor "
            "literal (sem ValueDicts); a forma mudou."
        )
    interno = campo.get("N")
    if interno not in nomes:
        raise ErroDSR(
            f"{LOG} coluna interna {interno!r} não está em `descriptor.Select` (tem: {sorted(nomes)})."
        )
    nome_coluna = nomes[interno]

    valores: list[Any] = []
    for i, linha in enumerate(brutas):
        chaves_extra = set(linha) - {"S", interno}
        if chaves_extra:
            raise ErroDSR(
                f"{LOG} linha {i} trouxe chave inesperada {sorted(chaves_extra)} — parece o DSR "
                "genérico (C/R/Ø) onde eu esperava a forma de projeção única; recuso adivinhar."
            )
        if interno not in linha:
            raise ErroDSR(f"{LOG} linha {i} não trouxe o valor de {interno!r}.")
        valores.append(linha[interno])

    return Tabela(
        colunas=[nome_coluna],
        linhas=[{nome_coluna: v} for v in valores],
        total_declarado=len(brutas),
        restart_token=None,
        diagnostico={"forma": "projecao_unica"},
    )


# ────────────────────────────── busca por entidade ───────────────────────


def _buscar_bruta(sessao: requests.Session, chave: str, verboso: bool = True) -> dict:
    """Molde de `tacs_mineradoras._buscar_entidade`: sobe a janela até a
    resposta vir MENOR que ela — só isso PROVA que a tabela acabou."""
    spec = ENTIDADES_BRUTAS[chave]
    janela = _JANELA_INICIAL
    while True:
        resposta = _consultar(sessao, montar_pedido_bruto(spec["entidade"], spec["campos"], janela))
        _erguer_se_odata_error(resposta, f"entidade {chave!r}")
        tabela = decodificar_resposta(resposta)
        diag = conferir(tabela, janela=janela)
        if not diag.get("janela_cheia"):
            if verboso:
                print(f"{LOG} {chave}: {len(tabela)} linha(s) (janela {janela}, fim provado).")
            return {"tabela": tabela, "diagnostico": diag}
        if janela >= _JANELA_MAXIMA:
            raise RuntimeError(
                f"{LOG} {chave}: a janela chegou ao teto ({_JANELA_MAXIMA}) e a resposta ainda "
                "veio cheia — não consigo PROVAR que li a tabela inteira. Recuso devolver contagem "
                "que pode estar truncada (para esta escala, ver a estratégia de agregação do CAR)."
            )
        janela = min(janela * 4, _JANELA_MAXIMA)
        if verboso:
            print(f"{LOG} {chave}: janela cheia, subindo para {janela}.")


def _buscar_coluna_unica(sessao: requests.Session, chave: str, verboso: bool = True) -> dict:
    spec = ENTIDADE_COLUNA_UNICA[chave]
    janela = _JANELA_INICIAL
    while True:
        resposta = _consultar(sessao, montar_pedido_coluna_unica(spec["entidade"], spec["campo"], janela))
        _erguer_se_odata_error(resposta, f"entidade {chave!r}")
        tabela = _decodificar_projecao_unica(resposta)
        diag = conferir(tabela, janela=janela)
        if not diag.get("janela_cheia"):
            if verboso:
                print(f"{LOG} {chave}: {len(tabela)} linha(s) (janela {janela}, fim provado).")
            return {"tabela": tabela, "diagnostico": diag}
        if janela >= _JANELA_MAXIMA:
            raise RuntimeError(f"{LOG} {chave}: janela cheia até o teto — recuso devolver truncado.")
        janela = min(janela * 4, _JANELA_MAXIMA)


def _buscar_total_geral(sessao: requests.Session, entidade: str, campo: str, nome_saida: str) -> int:
    resposta = _consultar(sessao, montar_pedido_total_geral(entidade, campo, nome_saida))
    _erguer_se_odata_error(resposta, "CAR total geral")
    tabela = _decodificar_projecao_unica(resposta)
    if len(tabela) != 1:
        raise RuntimeError(f"{LOG} total geral do CAR: esperava 1 linha, veio {len(tabela)}.")
    return int(tabela.linhas[0][nome_saida])


def _buscar_agregado(
    sessao: requests.Session, entidade: str, dimensao: str, medidas: list[tuple[str, int, str]],
    janela: int, verboso: bool = True,
) -> dict:
    resposta = _consultar(sessao, montar_pedido_agregado(entidade, dimensao, medidas, janela))
    _erguer_se_odata_error(resposta, f"agregação por {dimensao!r}")
    tabela = decodificar_resposta(resposta)
    diag = conferir(tabela, janela=janela)
    if diag.get("janela_cheia"):
        raise RuntimeError(
            f"{LOG} agregação por {dimensao!r} encheu a janela ({janela}) — mais categorias do que "
            "eu previa; suba a janela no código, não confie nesta contagem."
        )
    if verboso:
        print(f"{LOG} CAR por {dimensao!r}: {len(tabela)} linha(s).")
    return {"tabela": tabela, "diagnostico": diag}


def _buscar_car(sessao: requests.Session, verboso: bool = True) -> dict:
    """Agregado no servidor, não em linha crua — ver docstring do módulo,
    a seção sobre 1.164.209 registros. Ergue `RuntimeError` se qualquer
    soma não reconciliar com o total geral: é a trava de sanidade."""
    total_geral = _buscar_total_geral(sessao, CAR_ENTIDADE, CAR_CAMPO_CONTAGEM, "TotalGeral")
    if verboso:
        print(f"{LOG} CAR: total geral (DistinctCount de {CAR_CAMPO_CONTAGEM!r}) = {total_geral}.")

    medidas_municipio: list[tuple[str, int, str]] = [
        (f"soma_{campo}", _FUNC_SOMA, campo) for campo in CAR_CAMPOS_SOMA
    ]
    medidas_municipio.append(("imoveis_cadastrados", _FUNC_CONTAGEM_DISTINTA, CAR_CAMPO_CONTAGEM))
    resultado_municipio = _buscar_agregado(
        sessao, CAR_ENTIDADE, CAR_CAMPO_MUNICIPIO, medidas_municipio, janela=5000, verboso=verboso
    )
    por_municipio = _linhas_com_ressalva(resultado_municipio["tabela"], "car_por_municipio")
    soma_municipios = sum(_normalizar_numero(l["imoveis_cadastrados"]) for l in por_municipio)
    if soma_municipios != total_geral:
        raise RuntimeError(
            f"{LOG} CAR por município: soma de imoveis_cadastrados ({soma_municipios}) != total "
            f"geral ({total_geral}) — a quebra por município perdeu ou duplicou registro. Recuso "
            "gravar."
        )

    quebras: dict[str, list[dict]] = {}
    for dimensao in CAR_DIMENSOES_CATEGORICAS:
        medidas = [("quantidade", _FUNC_CONTAGEM_DISTINTA, CAR_CAMPO_CONTAGEM)]
        resultado = _buscar_agregado(sessao, CAR_ENTIDADE, dimensao, medidas, janela=200, verboso=verboso)
        linhas = _linhas_com_ressalva(resultado["tabela"], f"car_por_{_slug(dimensao)}")
        soma = sum(_normalizar_numero(l["quantidade"]) for l in linhas)
        if soma != total_geral:
            raise RuntimeError(
                f"{LOG} CAR por {dimensao!r}: soma ({soma}) != total geral ({total_geral}) — "
                "recuso gravar."
            )
        quebras[f"por_{_slug(dimensao)}"] = linhas

    return {
        "total_geral_imoveis": total_geral,
        "por_municipio": por_municipio,
        **quebras,
    }


def _slug(texto: str) -> str:
    texto = texto.lower()
    for de, para in (("á", "a"), ("ã", "a"), ("â", "a"), ("é", "e"), ("ê", "e"), ("í", "i"),
                      ("ó", "o"), ("ô", "o"), ("õ", "o"), ("ú", "u"), ("ç", "c"), (".", "_"),
                      (" ", "_")):
        texto = texto.replace(de, para)
    return texto


# ─────────────────────────── normalização e ressalva ─────────────────────

# Mesma armadilha e mesma correção de `tacs_mineradoras`: o DSR manda número
# como STRING quando o double não faz round-trip limpo em JSON (medido aqui
# também: `"5851.2373999999991"` na soma de área por município).
_RE_NUMERO_DSR = re.compile(r"^-?\d+(?:\.\d+)?$")


def _normalizar_numero(v: object) -> object:
    if isinstance(v, str) and _RE_NUMERO_DSR.match(v):
        return int(v) if "." not in v else float(v)
    return v


def _linhas_com_ressalva(tabela: Tabela, chave: str, prefixo: str = "e.") -> list[dict]:
    saida = []
    for linha in tabela.linhas:
        limpa = {
            (k[len(prefixo):] if k.startswith(prefixo) else k): _normalizar_numero(v)
            for k, v in linha.items()
        }
        limpa["_entidade"] = chave
        limpa["_dado_congelado_em"] = DADO_CONGELADO_EM
        saida.append(limpa)
    return saida


# ────────────────────────────────── coleta ────────────────────────────────


def coletar(chaves: list[str] | None = None, verboso: bool = True) -> dict:
    sessao = _sessao()
    todas = list(ENTIDADES_BRUTAS) + list(ENTIDADE_COLUNA_UNICA) + ["car"]
    chaves = chaves or todas
    for chave in chaves:
        if chave not in todas:
            raise SystemExit(f"{LOG} entidade desconhecida: {chave!r} (tem: {sorted(todas)})")

    blocos: dict[str, Any] = {}
    diagnosticos: dict[str, Any] = {}

    for chave in chaves:
        if chave in ENTIDADES_BRUTAS:
            resultado = _buscar_bruta(sessao, chave, verboso=verboso)
            blocos[chave] = _linhas_com_ressalva(resultado["tabela"], chave)
            diagnosticos[chave] = {
                "linhas": len(blocos[chave]), "colunas": resultado["tabela"].colunas,
                **{k: v for k, v in resultado["diagnostico"].items() if k != "aviso"},
            }
        elif chave in ENTIDADE_COLUNA_UNICA:
            resultado = _buscar_coluna_unica(sessao, chave, verboso=verboso)
            blocos[chave] = _linhas_com_ressalva(resultado["tabela"], chave)
            diagnosticos[chave] = {"linhas": len(blocos[chave]), "colunas": resultado["tabela"].colunas}
        elif chave == "car":
            blocos["car"] = _buscar_car(sessao, verboso=verboso)
            diagnosticos["car"] = {
                "total_geral_imoveis": blocos["car"]["total_geral_imoveis"],
                "municipios": len(blocos["car"]["por_municipio"]),
                "quebras": sorted(k for k in blocos["car"] if k.startswith("por_") and k != "por_municipio"),
            }

    return {
        "fonte": "semad_mg_painel_instrumentos_planejamento_gestao",
        "fonte_nome": "Instrumentos de Planejamento e Gestão — SEMAD/MG (Power BI público, painel Sisema)",
        "dado_congelado_em": DADO_CONGELADO_EM,
        "dado_ao_vivo": False,
        "ressalva_congelamento": (
            f"O painel declara refreshEnabled=false; o dado está congelado em {DADO_CONGELADO_EM} "
            "e NÃO reflete a situação atual do PRA/CAR/ICMS Ecológico."
        ),
        "workspace_de_origem": WORKSPACE_DE_ORIGEM,
        "ressalva_workspace": (
            "O relatório foi publicado de uma 'My workspace' pessoal, não de workspace "
            "institucional — depende de uma conta individual, sem governança de área."
        ),
        "ressalva_formato": (
            "O formato DSR do Power BI não é documentado e pode mudar sem aviso; a coleta quebra "
            "de propósito se mudar, em vez de gravar tabela plausível e errada."
        ),
        "ressalva_car_agregado": (
            "CAR_completo tem 1.164.209 registros individuais (medido por paginação real em "
            "2026-08-21) — grande demais para linha crua neste formato de arquivo. O bloco `car` "
            "é AGREGADO no servidor (por município e por 6 categorias), não uma lista de imóveis; "
            "cada soma foi confirmada contra o total geral do estado antes de gravar."
        ),
        "coletado_em": datetime.now(timezone.utc).isoformat(),
        "diagnostico": diagnosticos,
        "dados": blocos,
    }


def exportar(caminho: str = _SAIDA, chaves: list[str] | None = None) -> None:
    pacote = coletar(chaves)
    if not any(pacote["dados"].values()):
        print(f"{LOG} ABORT: nada coletado — não sobrescrevo {caminho}.", file=sys.stderr)
        sys.exit(1)
    Path(caminho).parent.mkdir(parents=True, exist_ok=True)
    Path(caminho).write_text(json.dumps(pacote, ensure_ascii=False, indent=1), encoding="utf-8")
    resumo = {
        chave: (len(bloco) if isinstance(bloco, list) else f"agregado ({bloco['total_geral_imoveis']} no total geral)")
        for chave, bloco in pacote["dados"].items()
    }
    total_linhas_cruas = sum(len(v) for v in pacote["dados"].values() if isinstance(v, list))
    print(f"{LOG} gravado em {caminho} (congelado em {DADO_CONGELADO_EM}). "
          f"{total_linhas_cruas} linha(s) crua(s) + car agregado. Resumo: {resumo}")


def sondar(chaves: list[str] | None = None) -> None:
    pacote = coletar(chaves)
    print(f"{LOG} SONDAGEM (nada gravado) — congelado em {DADO_CONGELADO_EM}, "
          f"origem: {WORKSPACE_DE_ORIGEM!r}")
    for chave, diag in pacote["diagnostico"].items():
        print(f"  {chave}: {json.dumps(diag, ensure_ascii=False)[:300]}")
        bloco = pacote["dados"][chave]
        if isinstance(bloco, list) and bloco:
            print(f"    1ª: {json.dumps(bloco[0], ensure_ascii=False)[:300]}")
        elif isinstance(bloco, dict):
            print(f"    1º município: {json.dumps(bloco['por_municipio'][0], ensure_ascii=False)[:300]}")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    p.add_argument("--sondar", action="store_true", help="mede e imprime, sem gravar")
    todas_chaves = sorted(list(ENTIDADES_BRUTAS) + list(ENTIDADE_COLUNA_UNICA) + ["car"])
    p.add_argument("--entidade", action="append", choices=todas_chaves,
                   help="restringe a uma entidade (repetível)")
    p.add_argument("--saida", default=_SAIDA)
    args = p.parse_args()
    try:
        if args.sondar:
            sondar(args.entidade)
        else:
            exportar(args.saida, args.entidade)
    except ErroDSR as e:
        print(f"{LOG} FALHA NA DECODIFICAÇÃO (de propósito, para não gravar dado torto):\n{e}",
              file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
