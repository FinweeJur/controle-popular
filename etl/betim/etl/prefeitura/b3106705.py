"""etl.prefeitura.b3106705 — sync Betim city-hall transparency portal into `servidores`.

Source: `http://servicos.betim.mg.gov.br/transparencia/rest/APIServidor/*` — a
public, no-auth JSON REST API that backs the portal's Angular SPA (discovered
live in F0/F5, see `docs/F0-discovery.md` §1 and §10). The original plan
(§5.2, `Betim.ai — Executable Plan.md`) called for a Playwright scraper here;
that turned out to be unnecessary — the portal's own REST backend can be hit
directly with `requests`/`tenacity`, same pattern as `etl/pncp/client.py`.

Target: `servidores` (roster only — see scoping notes below). Cron: weekly
(plan §5.2 Track B cadence for this module).

Scoping decisions made this round:
- `servidores` (roster) is the only table populated here. It's the confirmed,
  clean win: `APIServidor/ListarResultados` returns stable per-servant rows
  (nome, cargo, secretaria/lotação, vínculo) for each `Servidortipo` bucket.
- `folha_pagamento` (aggregate payroll totals) is intentionally NOT built:
  no JSON endpoint exists for it. The "Remuneração" pages under
  gestao-pessoas only link to monthly PDF lists
  (`sistemas.betim.mg.gov.br/transparencia/docs/gestao_pessoal/...`), not a
  structured API (`docs/F0-discovery.md` §10). PDF parsing is out of scope
  for this round.
- `despesas`/`receitas` are intentionally NOT built from this source, even
  though `APIEmpenho/ListarResultados` is confirmed and live (`docs/F0-discovery.md`
  §1). Two reasons: (1) it returns per-empenho (per-commitment) rows keyed by
  credor — a different shape than the `despesas`/`receitas` tables, which are
  aggregated on `(ano, estagio, funcao, conta)` (that shape is what
  `etl.bd.siconfi` — the primary/canonical source for those tables — already
  fills). (2) The empenho sample fields have no `funcao` (budget function)
  value at all, and `funcao` is part of `despesas`'s unique constraint, so
  there is no lossless way to map into it. No Receitas REST endpoint was even
  confirmed during discovery. Revisit if a funcao-bearing despesas endpoint
  (or an APIReceita equivalent) is ever mapped.
"""
import argparse
import datetime as dt
import sys
import time

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

BASE_URL = "http://servicos.betim.mg.gov.br/transparencia/rest"
REGISTROS_POR_PAGINA = 100

# Servidortipo codes inferred by content sampling (docs/F0-discovery.md §10),
# not documented anywhere on the portal itself. 6 (Temporários) was unverified
# at discovery time but confirmed live during this session (returns rows with
# ServidorVinculo="Não Efetivo" / ServidorRegime="Contratado/Celetista").
# An unknown/invalid Servidortipo returns `{}` gracefully rather than erroring,
# so each bucket is looped and treated independently — no assumption is made
# about which are guaranteed non-empty for a given competência.
SERVIDOR_TIPOS = {
    1: "Efetivos",
    2: "Efetivos em Comissão e Função de Confiança",
    3: "Comissionados",
    4: "Função Pública",
    5: "Estagiários",
    6: "Temporários",
}


@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=2, max=30))
def _get(path: str, params: dict) -> dict:
    resp = requests.get(f"{BASE_URL}/{path}", params=params, timeout=30)
    resp.raise_for_status()
    if not resp.text.strip():
        return {}
    return resp.json()


def _extract_rows(payload) -> list[dict]:
    """Result rows are wrapped under an `SDTServidor` key (confirmed live:
    `{"SDTServidor": [...]}`). A competência that hasn't been published yet
    (e.g. the current, still-open month) or an out-of-range page/invalid
    filter returns `{}` instead of `{"SDTServidor": []}` — treat both as "no
    rows" rather than as an error.
    """
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        rows = payload.get("SDTServidor")
        if not rows:
            return []
        return rows if isinstance(rows, list) else [rows]
    return []


def _iter_servidores(ano: int, mes: int, servidor_tipo: int,
                      registros_por_pagina: int = REGISTROS_POR_PAGINA):
    """Yields raw SDTServidor row dicts for one Servidortipo, paginating via
    Registroinicial/Registrosporpagina until a page comes back empty."""
    registro_inicial = 0
    while True:
        payload = _get(
            "APIServidor/ListarResultados",
            {
                "Servidortipo": servidor_tipo,
                "Ano": ano,
                "Mes": mes,
                "Ordenacao": "C",
                "Registrosporpagina": registros_por_pagina,
                "Registroinicial": registro_inicial,
            },
        )
        rows = _extract_rows(payload)
        if not rows:
            break
        yield from rows
        registro_inicial += registros_por_pagina
        time.sleep(0.3)


def _map_row(raw: dict, id_municipio: str) -> dict:
    return {
        "id_municipio": id_municipio,
        "orgao": "prefeitura",
        "nome": raw.get("ServidorNome"),
        "cargo": raw.get("ServidorCargoNome"),
        "lotacao": raw.get("ServidorSecretariaNome"),
        "vinculo": raw.get("ServidorVinculo"),
    }


def sync_servidores(id_municipio: str, ano: int, mes: int) -> int:
    """Loops Servidortipo 1-6, paginates each, upserts into `servidores`.

    Returns the total row count synced across all Servidortipo buckets (0 if
    the portal hasn't published this competência yet — see the empty-month
    quirk documented in the module docstring; callers should not treat a
    zero-row result here as an error, only `sync()` decides whether to retry
    an earlier month).
    """
    client = get_supabase_client()
    total = 0
    for tipo, label in SERVIDOR_TIPOS.items():
        rows = []
        seen = set()
        for raw in _iter_servidores(ano, mes, tipo):
            row = _map_row(raw, id_municipio)
            if not row["nome"] or not row["cargo"]:
                continue
            # (nome, cargo) is the upsert conflict target below; guard against
            # duplicate rows within a single sync (e.g. a name/cargo pair
            # repeated in the source) so a single upsert call doesn't choke on
            # "ON CONFLICT DO UPDATE command cannot affect row a second time".
            key = (row["nome"], row["cargo"])
            if key in seen:
                continue
            seen.add(key)
            rows.append(row)
        if rows:
            client.table("servidores").upsert(
                rows, on_conflict="id_municipio,orgao,nome,cargo"
            ).execute()
        print(f"[etl.prefeitura.b3106705] servidortipo={tipo} ({label}) "
              f"ano={ano} mes={mes} registros={len(rows)}")
        total += len(rows)
    print(f"[etl.prefeitura.b3106705] servidores total ano={ano} mes={mes} registros={total}")
    return total


def _mes_anterior(ano: int, mes: int) -> tuple[int, int]:
    """Returns (ano, mes) for the calendar month immediately before (ano, mes),
    handling year rollover (Jan -> Dec of the previous year)."""
    if mes <= 1:
        return ano - 1, 12
    return ano, mes - 1


def sync(id_municipio: str):
    """Resolves the most recently CLOSED competência (current month - 1) and
    syncs it. Payroll for the still-open current month isn't published yet
    (confirmed: returns `{}`), so we never query it directly. If the "closed"
    month is itself still empty for every Servidortipo (the portal can lag a
    few extra days after month-end), retries one month further back before
    giving up.
    """
    hoje = dt.date.today()
    ano, mes = _mes_anterior(hoje.year, hoje.month)

    total = sync_servidores(id_municipio, ano, mes)
    if total == 0:
        ano_fallback, mes_fallback = _mes_anterior(ano, mes)
        print(f"[etl.prefeitura.b3106705] ano={ano} mes={mes} vazio para todos os "
              f"Servidortipo, tentando fallback ano={ano_fallback} mes={mes_fallback}")
        total = sync_servidores(id_municipio, ano_fallback, mes_fallback)

    print(f"[etl.prefeitura.b3106705] total={total}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio)
    except RuntimeError as e:
        print(f"[etl.prefeitura.b3106705] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
