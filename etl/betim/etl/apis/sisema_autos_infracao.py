r"""etl.apis.sisema_autos_infracao — coletor dos AUTOS DE INFRAÇÃO do Sisema
(SEMAD/FEAM/IEF de MG), tirados do painel Power BI público do Sisema.

═══ POR QUE ESTE MÓDULO EXISTE ═══

A FEAM (e a SEMAD, e o IEF) NÃO publicam autos de infração em dado aberto:
`dados.mg.gov.br` devolve 0 para "auto de infração" e 0 para "embargo" (medido
em 30/09/2026), e a consulta pública do SIAM só aceita busca por número+digito
verificador, CPF/CNPJ ou NOME COMPLETO — não tem listagem (medido no mesmo
dia). O painel "Painel de Indicadores do Sisema", porém, tem a aba **AUTOS DE
INFRAÇÃO** com o dado em forma de tabela, servida por um relatório Power BI
PÚBLICO, sem login.

Este módulo extrai essa aba. A entidade usada é `Autos_Infracao_Completa`, que
tem 12 colunas e **nenhuma de dado pessoal** — diferente de `Autos_Infracao`
(74 colunas), que traz `Autuado`, `CPF`, `CNPJ` e `RG/Insc. Est.` e NUNCA é
consultada aqui (AGENTS § 5.2: o portal publica o ato, não o titular).

═══ COMO SE CHEGA AO DADO ═══

O caminho é o mesmo do coletor de TACs (`etl.apis.tacs_mineradoras`), e as
pistas falsas são as mesmas:

- cluster certo: `wabi-brazil-south-b-primary-api.analysis.windows.net`
  (`api.powerbi.com` responde 403 e o cluster errado responde 401 — os dois
  PARECEM falta de login, mas o relatório é público);
- header `X-PowerBI-ResourceKey` obrigatório;
- resposta vem **gzipada** e o `Content-Type` mente dizendo JSON (o `requests`
  descomprime sozinho);
- o formato DSR não é documentado: o decodificador `_powerbi_dsr` quebra de
  propósito se o formato mudar, em vez de gravar tabela plausível e errada.

O `modelsAndExploration` de um relatório Power BI público expõe os
`resourceKey` dos relatórios-filhos. O resourceKey deste é
`6f0dee31-708d-42fd-ad2d-9a70e2f49dbc`, `modelId` 5910103 e o dataset
`ce3de06e-efa2-465e-aec2-aa792967c532` (campo `dbName` do modelo).

═══ PAGINAÇÃO (a armadilha que subconta) ═══

O servidor corta em **30.000 linhas por resposta** mesmo quando se pede janela
maior (medido: janela 50.000 devolveu exatamente 30.000). O total passa disso,
então a coleta PAGINA pelo `RestartTokens` do próprio Power BI: a resposta traz
`dsr.DS[0].RT` (as células da última linha) e a próxima página se pede reenviando
esse token em `Binding.DataReduction.Primary.Window.RestartTokens`. Cada página
é decodificada e conferida; a coleta para quando uma página volta MENOR que a
janela (só isso prova que acabou) ou quando o `RT` some.

⚠️ Tratar a primeira página como total seria subcontar 60%, e nada no dado
denuncia isso — daí a guarda de fim explícita.

Uso:

    python -m etl.apis.sisema_autos_infracao --sondar   # mede, não grava
    python -m etl.apis.sisema_autos_infracao            # grava o AGREGADO (versionado)
    python -m etl.apis.sisema_autos_infracao --bruto    # grava o cru (LOCAL; não versionar)

⚠️ Antes de commitar o JSON gerado, rodar a varredura de dado pessoal
(`scripts/checar-dado-pessoal-em-dado.py`) — o diretório de saída precisa estar
em `DIRETORIOS_DADO` daquele script.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

from etl.apis._powerbi_dsr import ErroDSR, conferir, decodificar_resposta

LOG = "[etl.apis.sisema_autos_infracao]"

# Cluster brazil-south: é o que serve o painel público do Sisema. Ver docstring.
BASE = "https://wabi-brazil-south-b-primary-api.analysis.windows.net"
URL = f"{BASE}/public/reports/querydata?synchronous=true"

# Identificadores do relatório-filho "AUTOS DE INFRAÇÃO" (ver docstring).
RESOURCE_KEY = "6f0dee31-708d-42fd-ad2d-9a70e2f49dbc"
MODEL_ID = 5910103
DATASET_ID = "ce3de06e-efa2-465e-aec2-aa792967c532"
ENTIDADE = "Autos_Infracao_Completa"

# Colunas da entidade COMPLETA. ⚠️ Não trocar por `Autos_Infracao`: aquela tem
# `Autuado`, `CPF`, `CNPJ` e `RG/Insc. Est.` (dado pessoal) — este projeto não
# coleta, não grava e não publica titular de auto de infração.
CAMPOS = [
    "Auto de Infração",
    "Data de Lavratura",
    "Agenda",
    "Órgão Coordenador",
    "Valor do Auto de Infração",
    "Situação Auto",
    "Municipio do autuado",
    "Unidade Atual",
    "Data Encerramento/Envio Divida Ativa",
    "MUN_DESMATAMENTO",
]

# Lista-BRANCA exata das colunas publicáveis da entidade `Autos_Infracao_Completa`
# (as 12 medidas no `conceptualschema` em 30/09/2026). A guarda é por lista
# branca, não por heurística: "Municipio do autuado" é município (pode), mas
# "Autuado" é pessoa (não pode) — heurística de substring erraria os dois.
# Coluna nova só entra aqui depois de olho humano.
_COLUNAS_PERMITIDAS = {
    "Auto de Infração",
    "Data de Lavratura",
    "Agenda",
    "Órgão Coordenador",
    "Valor do Auto de Infração",
    "Situação Auto",
    "Municipio do autuado",
    "Unidade Atual",
    "Data Encerramento/Envio Divida Ativa",
    "Data.dataDecisaoPecma",
    "Data.dataAssinaturaPecma",
    "MUN_DESMATAMENTO",
}

# O servidor corta em 30k mesmo pedindo mais; a janela é o teto por página.
_JANELA = 30_000
_MAX_PAGINAS = 50  # trava de segurança: ~1,5 milhão de linhas

_TIMEOUT = 300
_UA = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"

_SAIDA = Path(__file__).resolve().parents[4] / "apps" / "web" / "data" / "sisema-autos-infracao.json"


def _conferir_sem_dado_pessoal(campos: list[str]) -> None:
    """Aborta se alguma coluna pedida não está na lista-branca publicável."""
    fora = [c for c in campos if c not in _COLUNAS_PERMITIDAS]
    if fora:
        raise SystemExit(
            f"{LOG} ABORT: coluna(s) fora da lista-branca: {fora!r}. A entidade usada "
            "tem de continuar sem titular (nome/CPF/CNPJ/RG) — revise antes de acrescentar."
        )


def _sessao() -> requests.Session:
    s = requests.Session()
    s.headers.update({
        "User-Agent": _UA,
        "Content-Type": "application/json;charset=UTF-8",
        "X-PowerBI-ResourceKey": RESOURCE_KEY,
    })
    return s


def montar_pedido(janela: int, restart: object | None = None) -> dict:
    """Monta o pedido `SemanticQueryDataShapeCommand`.

    `restart` é o token de reinício (`dsr.DS[0].RT[0]`) da página anterior; é
    o que faz a paginação avançar em vez de repetir a primeira página."""
    fonte = "e"
    seleção = [
        {
            "Column": {"Expression": {"SourceRef": {"Source": fonte}}, "Property": campo},
            "Name": f"{fonte}.{campo}",
        }
        for campo in CAMPOS
    ]
    janela_json: dict = {"Count": janela}
    if restart is not None:
        janela_json["RestartTokens"] = [restart]
    return {
        "version": "1.0.0",
        "queries": [{
            "Query": {"Commands": [{"SemanticQueryDataShapeCommand": {
                "Query": {
                    "Version": 2,
                    "From": [{"Name": fonte, "Entity": ENTIDADE, "Type": 0}],
                    "Select": seleção,
                },
                "Binding": {
                    "Primary": {"Groupings": [{"Projections": list(range(len(CAMPOS)))}]},
                    "DataReduction": {"DataVolume": 3, "Primary": {"Window": janela_json}},
                    "Version": 1,
                },
            }}]},
            "QueryId": "",
            "ApplicationContext": {
                "DatasetId": DATASET_ID,
                "Sources": [{"ReportId": DATASET_ID, "VisualId": ""}],
            },
        }],
        "cancelQueries": [],
        "modelId": MODEL_ID,
    }


def _consultar(sessao: requests.Session, pedido: dict) -> dict:
    r = sessao.post(URL, data=json.dumps(pedido, ensure_ascii=False).encode("utf-8"), timeout=_TIMEOUT)
    if r.status_code in (401, 403):
        raise RuntimeError(
            f"{LOG} HTTP {r.status_code}. Pista falsa clássica: cluster errado dá 401 e "
            f"api.powerbi.com dá 403. Confira o cluster ({BASE}) e o header "
            f"X-PowerBI-ResourceKey antes de procurar login. Corpo: {r.text[:300]!r}"
        )
    r.raise_for_status()
    resposta = r.json()
    if resposta.get("results") and "error" in resposta["results"][0]:
        raise ErroDSR(f"{LOG} erro dentro do 200 OK: {resposta['results'][0]['error']!r}")
    return resposta


def _reinicio(resposta: dict) -> object | None:
    """Extrai o token de reinício cru da resposta (fora do decodificador)."""
    try:
        ds = resposta["results"][0]["result"]["data"]["dsr"]["DS"][0]
    except (KeyError, IndexError, TypeError):
        return None
    rt = ds.get("RT")
    if not rt:
        return None
    return rt[0] if isinstance(rt, list) and rt else rt


def _data_de_epoch_ms(v: object) -> object:
    """O DM0 entrega data em epoch milissegundos; vira `YYYY-MM-DD`.

    Só converte epoch PLAUSÍVEL (≈1973 a ≈2103). A fonte tem data inválida
    digitada à mão — medido em 30/09/2026: um valor `3794256000000` vira "2090",
    e há outros fora de qualquer faixa real. Devolver a data inventada como se
    fosse fato seria pior que marcar; fora da faixa, o valor cru volta e o
    agregado o agrupa como "(data fora de faixa)".
    """
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        if 1e11 <= v <= 4.2e12:
            try:
                momento = datetime.fromtimestamp(v / 1000, tz=timezone.utc)
                if 1973 <= momento.year <= datetime.now(timezone.utc).year + 1:
                    return momento.strftime("%Y-%m-%d")
            except (OverflowError, OSError, ValueError):
                pass
        return v
    return v


_RE_NUMERO = re.compile(r"^-?\d+(?:\.\d+)?$")


def _normalizar_valor(v: object) -> object:
    """Número que o DSR manda como string vira número; data epoch vira ISO."""
    if isinstance(v, str) and _RE_NUMERO.match(v):
        return int(v) if "." not in v else float(v)
    return _data_de_epoch_ms(v)


def coletar(verboso: bool = True) -> dict:
    """Pagina até o fim e devolve o pacote com linhas + diagnóstico."""
    _conferir_sem_dado_pessoal(CAMPOS)
    sessao = _sessao()
    linhas: list[dict] = []
    paginas = 0
    restart: object | None = None
    while paginas < _MAX_PAGINAS:
        resposta = _consultar(sessao, montar_pedido(_JANELA, restart))
        tabela = decodificar_resposta(resposta)
        # `conferir` ergue em truncamento e confere o RT (agora com data certa).
        conferir(tabela)
        for linha in tabela.linhas:
            linhas.append({
                (k[2:] if k.startswith("e.") else k): _normalizar_valor(v)
                for k, v in linha.items()
            })
        paginas += 1
        if verboso:
            print(f"{LOG} página {paginas}: {len(tabela)} linha(s) · acumulado {len(linhas)}")
        novo = _reinicio(resposta)
        # Fim provado: página MENOR que a janela, ou servidor sem token de reinício.
        if len(tabela) < _JANELA or novo is None:
            break
        if novo == restart:
            raise RuntimeError(f"{LOG} o token de reinício não avançou na página {paginas} — "
                               "paro para não empilhar páginas repetidas.")
        restart = novo
    else:
        raise RuntimeError(f"{LOG} atingi {_MAX_PAGINAS} páginas sem provar o fim — recuso "
                           "gravar contagem que pode estar truncada.")
    return {
        "fonte": "sisema_autos_infracao",
        "fonte_nome": "Painel de Indicadores do Sisema — aba AUTOS DE INFRAÇÃO (Power BI público)",
        "orgaos": "SEMAD, FEAM e IEF (a coluna 'Órgão Coordenador' diz qual)",
        "entidade": ENTIDADE,
        "resource_key": RESOURCE_KEY,
        "cadencia": "mensal (o painel declara atualização mensal)",
        "ressalva_fonte": (
            "Dado do painel público do Sisema, sem login. O formato DSR do Power BI "
            "não é documentado; a coleta quebra de propósito se ele mudar."
        ),
        "ressalva_titular": (
            "A entidade coletada NÃO traz nome, CPF/CNPJ nem RG — o portal publica o "
            "ato, nunca o titular (AGENTS § 5.2)."
        ),
        "coletado_em": datetime.now(timezone.utc).isoformat(),
        "paginas": paginas,
        "total": len(linhas),
        "dados": linhas,
    }


def exportar_agregado(caminho: Path = _SAIDA) -> None:
    """Grava o AGREGADO (não as 583 mil linhas cruas).

    Coletar dá ~583 mil linhas em 30/09/2026: um único array disso estoura o
    teto de payload do portal (AGENTS § 5.1) e não serve à leitura. O que o
    repositório versiona é o agregado — total por órgão, por ano, por situação
    e por município —, enquanto o cru fica recuperável rodando `--bruto` na
    máquina. Os agregados saem do dado, nunca digitados à mão.
    """
    pacote = coletar()
    linhas = pacote["dados"]
    if not linhas:
        print(f"{LOG} ABORT: nada coletado — não sobrescrevo {caminho}.", file=sys.stderr)
        sys.exit(1)
    from collections import Counter

    def _ano(v: object) -> str:
        """Ano de uma data ISO; data ausente ou fora de faixa vira rótulo
        explícito — nunca um ano inventado."""
        if isinstance(v, str) and len(v) >= 4 and v[:4].isdigit():
            ano = int(v[:4])
            if 1990 <= ano <= datetime.now(timezone.utc).year + 1:
                return v[:4]
        return "(data fora de faixa)" if v is not None else "(sem data)"

    por_orgao = Counter(l.get("Órgão Coordenador") or "(não informado)" for l in linhas)
    por_ano = Counter(_ano(l.get("Data de Lavratura")) for l in linhas)
    por_situacao = Counter(l.get("Situação Auto") or "(não informado)" for l in linhas)
    municipios: dict[str, dict] = {}
    for linha in linhas:
        mun = linha.get("Municipio do autuado") or "(não informado)"
        bloco = municipios.setdefault(mun, {"total": 0, "por_orgao": Counter()})
        bloco["total"] += 1
        bloco["por_orgao"][linha.get("Órgão Coordenador") or "(não informado)"] += 1
    por_municipio = sorted(
        (
            {"municipio": nome, "total": b["total"], "por_orgao": dict(b["por_orgao"])}
            for nome, b in municipios.items()
        ),
        key=lambda x: (-x["total"], x["municipio"]),
    )
    anos = sorted(a for a in por_ano if a.isdigit())
    agregado = {
        "fonte": pacote["fonte"],
        "fonte_nome": pacote["fonte_nome"],
        "orgaos": pacote["orgaos"],
        "cadencia": pacote["cadencia"],
        "ressalva_fonte": pacote["ressalva_fonte"],
        "ressalva_titular": pacote["ressalva_titular"],
        "ressalva_agregado": (
            "Este arquivo é o AGREGADO. O cru (583.644 linhas em 30/09/2026) não é "
            "versionado; recupera-se com `python -m etl.apis.sisema_autos_infracao --bruto`."
        ),
        "coletado_em": pacote["coletado_em"],
        "paginas": pacote["paginas"],
        "total": pacote["total"],
        "cobertura": {
            "municipios_distintos": len(por_municipio),
            "anos": {"min": anos[0] if anos else None, "max": anos[-1] if anos else None},
            "registros_sem_data": por_ano.get("(sem data)", 0),
            "registros_data_fora_de_faixa": por_ano.get("(data fora de faixa)", 0),
        },
        "por_orgao": dict(por_orgao),
        "por_situacao": dict(por_situacao.most_common()),
        "por_ano": dict(sorted(por_ano.items())),
        "por_municipio": por_municipio,
    }
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text(json.dumps(agregado, ensure_ascii=False, indent=1), encoding="utf-8")
    kb = caminho.stat().st_size / 1024
    print(f"{LOG} agregado de {pacote['total']} linha(s) em {caminho} ({kb:.0f} KB).")


def exportar_bruto(caminho: Path) -> None:
    """Grava as linhas cruas (pesado) — para uso LOCAL, não versionar."""
    pacote = coletar()
    if not pacote["dados"]:
        print(f"{LOG} ABORT: nada coletado — não sobrescrevo {caminho}.", file=sys.stderr)
        sys.exit(1)
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text(json.dumps(pacote, ensure_ascii=False, indent=1), encoding="utf-8")
    mb = caminho.stat().st_size / (1024 * 1024)
    print(f"{LOG} BRUTO (não versionar): {pacote['total']} linha(s) em {caminho} ({mb:.1f} MB).")


def sondar() -> None:
    """Mede sem gravar: total, órgãos e situação."""
    pacote = coletar()
    linhas = pacote["dados"]
    from collections import Counter
    print(f"{LOG} SONDAGEM (nada gravado) — {pacote['total']} linha(s), {pacote['paginas']} página(s)")
    print("  órgãos:", Counter(l.get("Órgão Coordenador") for l in linhas).most_common(6))
    print("  situação:", Counter(l.get("Situação Auto") for l in linhas).most_common(6))
    print("  municípios distintos:", len({l.get("Municipio do autuado") for l in linhas}))


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    p.add_argument("--sondar", action="store_true", help="mede e imprime, sem gravar")
    p.add_argument("--bruto", action="store_true",
                   help="grava as linhas cruas (pesado, uso LOCAL; não versionar)")
    p.add_argument("--saida", default=None, help="caminho de saída")
    args = p.parse_args()
    try:
        if args.sondar:
            sondar()
        elif args.bruto:
            exportar_bruto(Path(args.saida) if args.saida
                           else _SAIDA.with_name("sisema-autos-infracao-bruto.json"))
        else:
            exportar_agregado(Path(args.saida) if args.saida else _SAIDA)
    except ErroDSR as e:
        print(f"{LOG} FALHA NA DECODIFICAÇÃO (de propósito, para não gravar dado torto):\n{e}",
              file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
