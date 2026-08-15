#!/usr/bin/env python3
"""
Falha quando um pedido de LAI passou do prazo e ninguem trocou a situacao.

═══ POR QUE ESTE ARQUIVO EXISTE ═══

Ate 13/08/2026 nao existia, no repositorio, nenhum lugar que gravasse
protocolo de pedido de LAI -- nem tabela, nem arquivo, nem convencao (ver
docs/LAI-PORTAIS.md). O pedido ao INCRA foi enviado em 29/07/2026 pelo
Fala.BR e o numero de protocolo nunca foi anotado; o prazo de 20 dias vence
em 18/08/2026 e, sem o protocolo, recurso e acompanhamento ficam muito mais
dificeis. `docs/LAI-PROTOCOLOS.json` e o registro; este script e a diferenca
entre "o prazo passou e alguem vai perceber num dia desses" e "o prazo
passou e o script grita".

═══ O QUE ELE CHECA ═══

1. Todo pedido com `situacao == "aguardando"` cuja `data_limite` ja passou
   -- ERRO. So usa `data_limite_prorrogado` quando `prorrogacao_concedida`
   for `true`: a prorrogacao do art. 11 par. 2o nao e automatica, entao o
   prazo real, ate prova em contrario, e o de 20 dias. Prazo perdido tem
   que ser erro visivel, nao descoberta tardia.
2. Consistencia minima do schema -- campo obrigatorio faltando, situacao
   fora do vocabulario, data em formato errado. Um JSON malformado nao deve
   passar em silencio.
3. (aviso, nao erro) pedido "aguardando" com protocolo "desconhecido" --
   lembra de voltar la e anotar assim que possivel, sem barrar o commit por
   isso: a falha de nao ter protocolo ja aconteceu no INCRA e o pedido nao
   deixa de estar "aguardando" so porque o protocolo sumiu.

Sem dependencia externa, de proposito -- roda com o Python que qualquer
maquina do projeto ja tem, no mesmo espirito de scripts/checar-dado-pessoal.py.

Uso:
    python scripts/checar-protocolos-lai.py

Sai com 1 se achar pedido vencido ainda "aguardando" ou erro de schema.
"""

from __future__ import annotations

import datetime
import io
import json
import pathlib
import sys

CAMINHO_PADRAO = pathlib.Path(__file__).resolve().parent.parent / "docs" / "LAI-PROTOCOLOS.json"

SITUACOES_VALIDAS = {"nao_enviado", "aguardando", "respondido", "negado", "em_recurso"}
PROTOCOLO_STATUS_VALIDOS = {"confirmado", "desconhecido", "nao_aplicavel"}

CAMPOS_OBRIGATORIOS = [
    "id", "orgao", "canal", "protocolo", "protocolo_status", "data_envio",
    "prazo_dias", "situacao", "documento_pedido", "resumo",
]


def _data(valor: str | None, campo: str, pedido_id: str, erros: list[str]) -> datetime.date | None:
    """Converte 'AAAA-MM-DD' em date. None fica None; string invalida vira erro."""
    if valor is None:
        return None
    try:
        return datetime.date.fromisoformat(valor)
    except ValueError:
        erros.append(f"{pedido_id}: campo '{campo}' nao esta em AAAA-MM-DD: {valor!r}")
        return None


def validar_schema(pedido: dict, erros: list[str]) -> None:
    pedido_id = pedido.get("id", "<sem id>")
    for campo in CAMPOS_OBRIGATORIOS:
        if campo not in pedido:
            erros.append(f"{pedido_id}: falta o campo obrigatorio '{campo}'")

    situacao = pedido.get("situacao")
    if situacao is not None and situacao not in SITUACOES_VALIDAS:
        erros.append(
            f"{pedido_id}: situacao {situacao!r} fora do vocabulario "
            f"{sorted(SITUACOES_VALIDAS)}"
        )

    status_proto = pedido.get("protocolo_status")
    if status_proto is not None and status_proto not in PROTOCOLO_STATUS_VALIDOS:
        erros.append(
            f"{pedido_id}: protocolo_status {status_proto!r} fora do vocabulario "
            f"{sorted(PROTOCOLO_STATUS_VALIDOS)}"
        )

    # Pedido "aguardando" tem que ter sido enviado -- senao a data-limite nao
    # tem base para existir.
    if situacao == "aguardando" and pedido.get("data_envio") is None:
        erros.append(f"{pedido_id}: situacao 'aguardando' mas 'data_envio' e null")

    # Numero de protocolo inventado seria pior que protocolo desconhecido.
    # Guarda simples: se ha um valor em 'protocolo', o status nao pode dizer
    # que ele nao existe.
    if pedido.get("protocolo") is not None and status_proto in ("desconhecido", "nao_aplicavel"):
        erros.append(
            f"{pedido_id}: tem valor em 'protocolo' mas protocolo_status "
            f"e {status_proto!r} -- inconsistente"
        )


def checar_prazo(pedido: dict, hoje: datetime.date, erros: list[str], avisos: list[str]) -> None:
    pedido_id = pedido.get("id", "<sem id>")
    situacao = pedido.get("situacao")
    if situacao != "aguardando":
        return

    data_limite = _data(pedido.get("data_limite"), "data_limite", pedido_id, erros)
    data_limite_prorrogado = _data(
        pedido.get("data_limite_prorrogado"), "data_limite_prorrogado", pedido_id, erros
    )
    # A prorrogacao do art. 11 par. 2o NAO e automatica -- exige que o orgao
    # comunique, dentro do prazo original, justificativa expressa. Ate que
    # 'prorrogacao_concedida' seja true, o teto que vale e o prazo base de 20
    # dias, nao os 30. Usar o prorrogado por padrao esconderia o vencimento
    # real por ate 10 dias -- o oposto do que este script existe para fazer.
    if pedido.get("prorrogacao_concedida") is True:
        teto = data_limite_prorrogado or data_limite
    else:
        teto = data_limite

    if teto is None:
        erros.append(f"{pedido_id}: situacao 'aguardando' mas sem data_limite para checar prazo")
        return

    if hoje > teto:
        dias = (hoje - teto).days
        erros.append(
            f"{pedido_id} ({pedido.get('orgao')}): prazo vencido ha {dias} dia(s) "
            f"(teto {teto.isoformat()}) e a situacao ainda e 'aguardando'. "
            f"Atualize docs/LAI-PROTOCOLOS.json: virou 'respondido', 'negado' ou "
            f"'em_recurso'?"
        )
    elif pedido.get("protocolo_status") == "desconhecido":
        avisos.append(
            f"{pedido_id} ({pedido.get('orgao')}): aguardando, prazo ate "
            f"{teto.isoformat()}, e o protocolo AINDA nao foi anotado."
        )


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, io.UnsupportedOperation):
        pass

    caminho = CAMINHO_PADRAO
    if not caminho.exists():
        print(f"✗ arquivo nao encontrado: {caminho}", file=sys.stderr)
        return 1

    try:
        dados = json.loads(caminho.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"✗ {caminho} nao e JSON valido: {e}", file=sys.stderr)
        return 1

    pedidos = dados.get("pedidos", [])
    if not pedidos:
        print(f"✗ {caminho} nao tem nenhum pedido em 'pedidos'", file=sys.stderr)
        return 1

    hoje = datetime.date.today()
    erros: list[str] = []
    avisos: list[str] = []

    for pedido in pedidos:
        validar_schema(pedido, erros)
        checar_prazo(pedido, hoje, erros, avisos)

    if avisos:
        print(f"\n  {len(avisos)} aviso(s) (nao barram o commit):\n")
        for a in avisos:
            print(f"    ⚠️  {a}")

    if erros:
        print()
        print("═" * 72)
        print("  PRAZO DE LAI VENCIDO OU REGISTRO INCONSISTENTE")
        print("═" * 72)
        print(f"\n  {len(erros)} problema(s) em {caminho.relative_to(caminho.parent.parent.parent)}:\n")
        for e in erros:
            print(f"    ✗ {e}")
        print()
        return 1

    print(f"✓ {len(pedidos)} pedido(s) de LAI conferido(s) contra {hoje.isoformat()} -- nenhum prazo vencido em silencio")
    return 0


if __name__ == "__main__":
    sys.exit(main())
