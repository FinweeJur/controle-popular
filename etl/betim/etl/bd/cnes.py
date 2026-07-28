"""etl.bd.cnes — sync CNES (Base dos Dados) into `saude_estabelecimentos`.

Source: `br_ms_cnes.estabelecimento` + `br_ms_cnes.profissional` (counted per
estabelecimento). Target: `saude_estabelecimentos` (unique on id_municipio,
id_cnes). Cron: monthly.

Schema verified live 2026-07-20 against the real BigQuery tables (project
`controle-popular`). Scoping decision: `br_ms_cnes.estabelecimento` has NO
name, address, bairro, or lat/lng columns -- it's a registration/service
metadata table (tipo_unidade, tipo_gestao, contract/accreditation flags,
etc.), not an identification directory. None of the other 13 tables in the
`br_ms_cnes` dataset (leito, equipamento, dicionario, habilitacao, ...) or
`br_bd_diretorios_brasil` carry a health-facility name/geo directory either
(unlike schools, which do have `br_bd_diretorios_brasil.escola`). This
module is therefore scoped to what's actually available: `id_cnes`, `tipo`,
and `profissionais_count`. `nome`/`endereco`/`bairro`/`lat`/`lng` are left
null here -- populating them would need a different source entirely (e.g.
the official cnes.datasus.gov.br public consultation site/API), out of
scope for this round.

BUG REAL corrigido 2026-07-24 (achado numa auditoria de dado desatualizado
pedida pelo usuário): a query original não filtrava por competência
(ano/mes) -- `br_ms_cnes.estabelecimento` é uma tabela com uma linha por
estabelecimento POR MÊS (mesmo padrão já visto em `br_ms_cnes.profissional`),
então `SELECT DISTINCT id_estabelecimento_cnes` contava todo estabelecimento
que JÁ TEVE alguma linha em qualquer mês da série -- incluindo os que já
fecharam. Resultado real: 663 "distinct histórico" vs. **458 realmente
ativos na competência mais recente** (nov/2025) -- uma inflação de ~45%
no card "estabelecimentos de saúde". Corrigido filtrando pra
MAX(ano, mes) antes de contar.
"""
import argparse
import sys

from etl.bd.common import bd_query
from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

QUERY_ULTIMA_COMPETENCIA = """
SELECT ano, mes
FROM `basedosdados.br_ms_cnes.{tabela}`
WHERE id_municipio = '{id_municipio}'
ORDER BY ano DESC, mes DESC
LIMIT 1
"""

QUERY_ESTABELECIMENTOS = """
SELECT DISTINCT id_estabelecimento_cnes AS id_cnes, tipo_unidade AS tipo
FROM `basedosdados.br_ms_cnes.estabelecimento`
WHERE id_municipio = '{id_municipio}' AND ano = {ano} AND mes = {mes}
"""

QUERY_PROFISSIONAIS_COUNT = """
SELECT id_estabelecimento_cnes AS id_cnes, COUNT(DISTINCT cartao_nacional_saude) AS profissionais_count
FROM `basedosdados.br_ms_cnes.profissional`
WHERE id_municipio = '{id_municipio}' AND ano = {ano} AND mes = {mes}
GROUP BY id_estabelecimento_cnes
"""


def _map_estabelecimento(row: dict, id_municipio: str) -> dict:
    return {
        "id_municipio": id_municipio,
        "id_cnes": row.get("id_cnes"),
        "tipo": row.get("tipo"),
    }


def _ultima_competencia(tabela: str, id_municipio: str) -> tuple[int, int] | None:
    r = bd_query(QUERY_ULTIMA_COMPETENCIA.format(tabela=tabela, id_municipio=id_municipio))
    return (r[0]["ano"], r[0]["mes"]) if r else None


def sync(id_municipio: str):
    client = get_supabase_client()

    # `estabelecimento` e `profissional` são publicados com defasagens
    # diferentes (achado real 2026-07-24: estabelecimento chegava a
    # nov/2025, profissional só a jan/2025) -- cada um usa a própria
    # competência mais recente, não uma única compartilhada.
    comp_estab = _ultima_competencia("estabelecimento", id_municipio)
    comp_prof = _ultima_competencia("profissional", id_municipio)
    if not comp_estab:
        print(f"[etl.bd.cnes] AVISO: nenhuma competencia encontrada pra id_municipio={id_municipio}")
        return
    ano, mes = comp_estab
    print(f"[etl.bd.cnes] competencia_estabelecimento={ano}-{mes:02d}")

    estab_raw = bd_query(QUERY_ESTABELECIMENTOS.format(id_municipio=id_municipio, ano=ano, mes=mes))
    if comp_prof:
        ano_prof, mes_prof = comp_prof
        print(f"[etl.bd.cnes] competencia_profissional={ano_prof}-{mes_prof:02d}")
        prof_raw = bd_query(
            QUERY_PROFISSIONAIS_COUNT.format(id_municipio=id_municipio, ano=ano_prof, mes=mes_prof)
        )
    else:
        prof_raw = []
    prof_by_cnes = {r.get("id_cnes"): r.get("profissionais_count") for r in prof_raw}

    rows_by_cnes: dict[str, dict] = {}
    for raw in estab_raw:
        id_cnes = raw.get("id_cnes")
        if not id_cnes:
            continue
        mapped = _map_estabelecimento(raw, id_municipio)
        mapped["profissionais_count"] = prof_by_cnes.get(id_cnes)
        rows_by_cnes[id_cnes] = mapped

    rows = list(rows_by_cnes.values())
    if rows:
        client.table("saude_estabelecimentos").upsert(rows, on_conflict="id_municipio,id_cnes").execute()

    # Upsert nunca remove -- sem isso, estabelecimento que fechou (não
    # aparece mais na competência atual) ficaria pra sempre na tabela.
    ids_atuais = list(rows_by_cnes.keys())
    existentes = client.table("saude_estabelecimentos").select("id_cnes").eq("id_municipio", id_municipio).execute()
    ids_obsoletos = [r["id_cnes"] for r in existentes.data if r["id_cnes"] not in ids_atuais]
    if ids_obsoletos:
        client.table("saude_estabelecimentos").delete().eq("id_municipio", id_municipio).in_(
            "id_cnes", ids_obsoletos
        ).execute()
        print(f"[etl.bd.cnes] removidos_obsoletos={len(ids_obsoletos)}")

    print(f"[etl.bd.cnes] saude_estabelecimentos registros={len(rows)}")
    print(f"[etl.bd.cnes] total={len(rows)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio)
    except RuntimeError as e:
        print(f"[etl.bd.cnes] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
