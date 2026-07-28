"""etl.temas_backfill — classifica `temas` pras linhas de `proposicoes` e
`contratos` que já existiam ANTES da migration `0012_temas.sql`.

Usage: python -m etl.temas_backfill --id-municipio 3106705

**Precisa da migration `0012_temas.sql` já rodada** (SQL Editor do
Supabase) -- sem ela, todo update abaixo falha com "column temas does not
exist" e o script para no primeiro erro (não tem sentido continuar).

Daqui pra frente, `etl/camaras/betim.py` e `etl/pncp/contratos.py` já
classificam `temas` no momento da escrita (ver `etl/temas.py`) -- este
script é só pra preencher o que já estava sincronizado antes disso
existir. Roda uma vez; não precisa de cron.
"""
import argparse

from etl.common import ID_MUNICIPIO_DEFAULT, fetch_all, get_supabase_client
from etl.temas import classificar_contrato, classificar_texto


def _backfill_proposicoes(client, id_municipio: str) -> int:
    rows = fetch_all(
        lambda: client.table("proposicoes").select("id, ementa").eq("id_municipio", id_municipio)
    )
    total = 0
    for row in rows:
        temas = classificar_texto(row.get("ementa"))
        client.table("proposicoes").update({"temas": temas}).eq("id", row["id"]).execute()
        total += 1
    return total


def _backfill_contratos(client, id_municipio: str) -> int:
    rows = fetch_all(
        lambda: client.table("contratos")
        .select("id, unidade_nome, objeto")
        .eq("id_municipio", id_municipio)
    )
    total = 0
    for row in rows:
        temas = classificar_contrato(row.get("unidade_nome"), row.get("objeto"))
        client.table("contratos").update({"temas": temas}).eq("id", row["id"]).execute()
        total += 1
    return total


def sync(id_municipio: str) -> None:
    client = get_supabase_client()
    n_prop = _backfill_proposicoes(client, id_municipio)
    print(f"[etl.temas_backfill] proposicoes_classificadas={n_prop}")
    n_contratos = _backfill_contratos(client, id_municipio)
    print(f"[etl.temas_backfill] contratos_classificados={n_contratos}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    sync(args.id_municipio)
