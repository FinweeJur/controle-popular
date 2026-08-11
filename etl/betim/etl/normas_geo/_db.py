"""Conexão do pipeline `normas_geo` — Postgres LOCAL, sempre.

Não usa `etl.common.get_supabase_client()` (que lê `DATABASE_URL` de
`etl/betim/.env`, hoje inexistente neste worktree e historicamente apontado
para a Neon nos outros eixos) para não correr o risco de herdar um valor
apontando para fora deste PC. A regra do projeto é literal: 127.0.0.1, e
ponto -- ver `docs/rotina-local.md`. Se algum dia isto precisar rodar contra
outro host, troque aqui, um lugar só.
"""
import psycopg
from psycopg.rows import dict_row

DSN_LOCAL = "postgresql://postgres:postgres@127.0.0.1:5432/controle_popular"


def conectar():
    return psycopg.connect(DSN_LOCAL, autocommit=True, row_factory=dict_row)
