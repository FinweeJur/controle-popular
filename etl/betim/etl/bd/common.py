"""etl.bd.common — shared helper for Base dos Dados (BigQuery) ETL modules.

Runs queries via `google-cloud-bigquery` with an explicit service-account
credential (GOOGLE_APPLICATION_CREDENTIALS), NOT `basedosdados.read_sql()`.

Verified live (2026-07-20): `basedosdados.read_sql()`'s default
`from_file=False` path always calls `pydata_google_auth.get_user_credentials()`,
which is an *interactive user OAuth* flow (prints a "please visit this URL"
prompt) — it ignores GOOGLE_APPLICATION_CREDENTIALS entirely. That's fine on
a developer's machine with a browser and a credentials cache, but it would
hang (or silently depend on a stale local cache) on a headless GitHub Actions
runner. Going straight through `google.cloud.bigquery.Client` with
`google.oauth2.service_account.Credentials.from_service_account_file()` is
the standard, CI-safe way to authenticate a service account — confirmed
working end-to-end against `basedosdados.br_ibge_populacao.municipio` this
session, no prompt, no cache dependency.

Normalizes result rows (numpy/pandas scalars -> native Python, NaN -> None)
so they upsert cleanly via supabase-py. Raises RuntimeError (ABORT
convention, same as etl/common.py) when no billing project or credentials
file is configured.
"""
import os


def _row_to_native(row: dict) -> dict:
    """Converts a pandas-derived row dict to plain-Python / JSON-safe values."""
    native = {}
    for key, value in row.items():
        if hasattr(value, "item"):  # numpy scalar (int64, float64, bool_, ...)
            value = value.item()
        if isinstance(value, float) and value != value:  # NaN != NaN
            value = None
        native[key] = value
    return native


def bd_query(sql: str) -> list[dict]:
    """Runs `sql` against Base dos Dados (BigQuery) and returns rows as dicts.

    Billing project comes from GCP_PROJECT_ID, falling back to
    BASEDOSDADOS_BILLING_PROJECT_ID (the name used in .env.example) for
    convenience. Requires GOOGLE_APPLICATION_CREDENTIALS to point at a
    service-account JSON with BigQuery access to `basedosdados`'s public data.
    """
    billing_project_id = os.environ.get("GCP_PROJECT_ID") or os.environ.get(
        "BASEDOSDADOS_BILLING_PROJECT_ID"
    )
    if not billing_project_id:
        raise RuntimeError(
            "GCP_PROJECT_ID (ou BASEDOSDADOS_BILLING_PROJECT_ID) não configurado no .env — "
            "crie o projeto GCP e o service account (F0) antes de rodar ETL Base dos Dados."
        )

    credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if not credentials_path or not os.path.exists(credentials_path):
        raise RuntimeError(
            "GOOGLE_APPLICATION_CREDENTIALS não aponta para um arquivo existente — "
            "gere a chave da service account (F0) e configure o .env."
        )

    from google.cloud import bigquery
    from google.oauth2 import service_account

    credentials = service_account.Credentials.from_service_account_file(credentials_path)
    client = bigquery.Client(credentials=credentials, project=billing_project_id)
    df = client.query(sql).to_dataframe()
    return [_row_to_native(row) for row in df.to_dict(orient="records")]
