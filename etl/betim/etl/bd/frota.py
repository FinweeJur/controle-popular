"""etl.bd.frota — sync frota de veículos (DENATRAN/SENATRAN via Base dos
Dados) into `indicadores` (nome='frota_veiculos'). Destrava o card "Frota
de veículos" da Home, que ficava em "em breve" por falta de fonte
confirmada -- achado 2026-07-23: `basedosdados.br_denatran_frota.municipio_tipo`
existe e cobre Betim de 2003 a 2025 (mensal), granular por tipo de
veículo (automóvel, motocicleta, caminhão, ...).

Achado sobre a fonte: o `INFORMATION_SCHEMA` desse dataset específico
devolve 403 (Access Denied) mesmo com a mesma service account que lê
outros datasets de boa -- mas a tabela em si (`SELECT` direto) funciona
normalmente. Não investigado o motivo (provável particularidade de
permissão do dataset na Base dos Dados), sem impacto prático.

`quantidade` é um ESTOQUE (frota registrada), não um fluxo -- a série
soma todos os `tipo_veiculo` do último mês disponível de cada ano
(dezembro na maioria dos anos; outubro pro ano corrente, ainda incompleto),
nunca soma meses diferentes entre si.
"""
import argparse
import sys

from etl.bd.common import bd_query
from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

QUERY_FROTA = """
WITH ultimo_mes_por_ano AS (
  SELECT ano, MAX(mes) AS mes
  FROM `basedosdados.br_denatran_frota.municipio_tipo`
  WHERE id_municipio = '{id_municipio}'
  GROUP BY ano
)
SELECT f.ano, SUM(f.quantidade) AS total
FROM `basedosdados.br_denatran_frota.municipio_tipo` f
JOIN ultimo_mes_por_ano u ON f.ano = u.ano AND f.mes = u.mes
WHERE f.id_municipio = '{id_municipio}'
GROUP BY f.ano
ORDER BY f.ano
"""


def sync(id_municipio: str) -> None:
    client = get_supabase_client()
    rows_raw = bd_query(QUERY_FROTA.format(id_municipio=id_municipio))

    rows = []
    for r in rows_raw:
        ano = r.get("ano")
        total = r.get("total")
        if ano is None or total is None:
            continue
        rows.append(
            {
                "id_municipio": id_municipio,
                "nome": "frota_veiculos",
                "valor": str(int(total)),
                "valor_numerico": total,
                "ano_referencia": ano,
                "fonte": "br_denatran_frota",
                "unidade": "veículos",
            }
        )

    if rows:
        client.table("indicadores").upsert(rows, on_conflict="id_municipio,nome,ano_referencia").execute()
    print(f"[etl.bd.frota] indicadores registros={len(rows)}")
    if rows:
        ultimo = rows[-1]
        print(f"[etl.bd.frota] {ultimo['ano_referencia']}: {ultimo['valor']} veículos")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio)
    except RuntimeError as e:
        print(f"[etl.bd.frota] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
