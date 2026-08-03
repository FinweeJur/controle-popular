"""etl.pbh.folha — folha de pagamento e quadro de servidores da PBH (GRP).

    python -m etl.pbh.folha --id-municipio 3106200            # mês mais recente
    python -m etl.pbh.folha --id-municipio 3106200 --meses 12 # último ano

Preenche o maior buraco que Betim tinha: `folha_pagamento`, que existia no
schema e nunca foi populada por falta de fonte.

DUAS TABELAS, DOIS RECORTES — e a diferença entre elas é uma decisão de
privacidade, não um detalhe de modelagem:

* `folha_pagamento` recebe o AGREGADO por (órgão, competência): total bruto
  e quantidade de vínculos. É onde o dinheiro aparece.
* `servidores` recebe a linha individual, e o schema dessa tabela **não tem
  coluna de remuneração** (id_municipio, orgao, nome, cargo, lotacao,
  vinculo). É onde a pessoa aparece.

Remuneração de servidor público é informação pública no Brasil e o GRP a
publica nominalmente — este ETL poderia gravar nome+valor. Não grava: o
agregado responde "quanto a cidade gasta com pessoal, por órgão" e o
nominal responde "quem trabalha onde", que são as duas perguntas que o
portal se propõe a responder. Republicar nome+salário individual é uma
decisão editorial com custo próprio, e o schema atual a torna impossível por
construção em vez de por disciplina. Quem quiser mudar isso precisa de uma
migration — que é exatamente o ponto de fricção certo para essa escolha.

FILTROS OBRIGATÓRIOS: `PFolhaPagto` com `filtros={}` devolve
`registros: 0` — exercício e mês não são opcionais, e a resposta vazia é
indistinguível de "não houve folha". Por isso o módulo sempre monta a
competência explicitamente e falha alto quando um mês esperado vem vazio.
"""

import argparse
import datetime as dt
import sys
from collections import defaultdict

from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    carregar_municipio,
    get_supabase_client,
)
from etl.pbh.cliente import grp

FONTE = "GRP Transparência PBH — PFolhaPagto"

# Medido: 2015/06 devolve 0, 2020/06 devolve 69.489. O histórico começa em
# algum ponto entre os dois; sem varrer, o piso seguro é 2020.
PRIMEIRO_ANO_COM_DADO = 2020


def _num(v) -> float:
    if v is None or v == "":
        return 0.0
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(str(v).replace(".", "").replace(",", ".") if "," in str(v) else v)
    except ValueError:
        return 0.0


def _competencias(quantos_meses: int) -> list[tuple[int, int]]:
    """As N competências mais recentes, da mais nova para a mais antiga.

    Começa no mês ANTERIOR ao corrente: a folha do mês em curso só é
    publicada depois de fechada, e pedir o mês corrente devolve zero — que
    o `sync` interpretaria como "órgão sem folha" e gravaria como tal.
    """
    hoje = dt.date.today()
    ano, mes = (hoje.year, hoje.month - 1) if hoje.month > 1 else (hoje.year - 1, 12)
    saida = []
    for _ in range(quantos_meses):
        if ano < PRIMEIRO_ANO_COM_DADO:
            break
        saida.append((ano, mes))
        mes -= 1
        if mes == 0:
            ano, mes = ano - 1, 12
    return saida


def _sincronizar_competencia(client, id_municipio: str, ano: int, mes: int) -> tuple[int, int]:
    registros = grp(
        "PFolhaPagto",
        filtros={"FolhaServExercicio": str(ano), "FolhaServMes": str(mes)},
    )
    if not registros:
        print(f"[etl.pbh.folha] {ano}-{mes:02d}: vazio (pulando)")
        return 0, 0

    competencia = f"{ano}-{mes:02d}-01"

    # --- agregado por órgão ---
    por_orgao: dict[str, dict] = defaultdict(lambda: {"bruto": 0.0, "vinculos": 0})
    for r in registros:
        orgao = (r.get("EntOrgNome") or "SEM ÓRGÃO INFORMADO").strip()
        por_orgao[orgao]["bruto"] += _num(r.get("FolhaServTotalBruto"))
        por_orgao[orgao]["vinculos"] += 1

    linhas_folha = [
        {
            "id_municipio": id_municipio,
            "orgao": orgao,
            "competencia": competencia,
            "total_bruto": round(v["bruto"], 2),
            "qtd_servidores": v["vinculos"],
            "fonte": FONTE,
        }
        for orgao, v in sorted(por_orgao.items())
    ]
    client.table("folha_pagamento").upsert(
        linhas_folha, on_conflict="id_municipio,orgao,competencia"
    ).execute()

    # --- quadro nominal, só da competência mais recente ---
    # `servidores` é um retrato do quadro ATUAL, não uma série histórica: a
    # chave única é (id_municipio, orgao, nome, cargo), sem competência.
    # Gravar vários meses só reescreveria as mesmas linhas.
    return len(linhas_folha), len(registros)


def _sincronizar_quadro(client, id_municipio: str, ano: int, mes: int) -> int:
    registros = grp(
        "PFolhaPagto",
        filtros={"FolhaServExercicio": str(ano), "FolhaServMes": str(mes)},
    )
    if not registros:
        return 0

    # Dedupe pela chave única da tabela ANTES do upsert: a mesma pessoa
    # aparece mais de uma vez na folha quando tem dois vínculos ou recebe
    # tipos de pagamento distintos no mês, e `ON CONFLICT DO UPDATE` não
    # pode tocar a mesma linha duas vezes na mesma instrução.
    por_chave: dict[tuple, dict] = {}
    for r in registros:
        nome = (r.get("FolhaServNome") or "").strip()
        if not nome:
            continue
        orgao = (r.get("EntOrgNome") or "SEM ÓRGÃO INFORMADO").strip()
        cargo = (r.get("FolhaServTipoCargoNome") or r.get("FolhaServTipoCargoDesc") or "").strip()
        por_chave[(orgao, nome, cargo)] = {
            "id_municipio": id_municipio,
            "orgao": orgao,
            "nome": nome,
            "cargo": cargo or None,
            "lotacao": (r.get("FolhaServLotacao") or "").strip() or None,
            "vinculo": (r.get("FolhaServSituacao") or "").strip() or None,
        }

    linhas = list(por_chave.values())
    # Lotes: 79 mil linhas numa instrução só estoura o limite de parâmetros
    # do Postgres (65535 placeholders) — 6 colunas dá teto de ~10.900 linhas.
    LOTE = 5000
    for i in range(0, len(linhas), LOTE):
        client.table("servidores").upsert(
            linhas[i : i + LOTE], on_conflict="id_municipio,orgao,nome,cargo"
        ).execute()
    return len(linhas)


def sync(id_municipio: str, meses: int = 1) -> None:
    cidade = carregar_municipio(id_municipio)
    if cidade["fontes"].get("prefeitura_grp") is not True:
        raise RuntimeError(
            f"id_municipio={id_municipio} ({cidade['nome']}) não declara "
            "`fontes.prefeitura_grp: true`."
        )

    client = get_supabase_client()
    competencias = _competencias(meses)
    if not competencias:
        raise RuntimeError("nenhuma competência a sincronizar")

    total_orgaos = 0
    for ano, mes in competencias:
        orgaos, vinculos = _sincronizar_competencia(client, id_municipio, ano, mes)
        total_orgaos += orgaos
        if orgaos:
            print(
                f"[etl.pbh.folha] {ano}-{mes:02d}: {orgaos} órgãos, {vinculos} vínculos"
            )

    ano, mes = competencias[0]
    quadro = _sincronizar_quadro(client, id_municipio, ano, mes)
    print(
        f"[etl.pbh.folha] id_municipio={id_municipio} "
        f"folha_pagamento={total_orgaos} linhas, servidores={quadro} "
        f"(quadro de {ano}-{mes:02d})"
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument(
        "--meses",
        type=int,
        default=1,
        help="Quantas competências retroativas agregar em folha_pagamento (padrão: 1).",
    )
    args = parser.parse_args()
    try:
        sync(args.id_municipio, args.meses)
    except RuntimeError as e:
        print(f"[etl.pbh.folha] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
