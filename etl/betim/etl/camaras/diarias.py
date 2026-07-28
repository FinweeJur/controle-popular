"""etl.camaras.diarias — sync councilor travel per-diems (Viagens e Diárias)
from camarabetim.mg.gov.br's Transparência section into `diarias`.

Usage: python -m etl.camaras.diarias --id-municipio 3106705

Source: `Transparência/Diárias` (Blazor Server, same pattern as
etl.camaras.betim -- confirmed 2026-07-21 there's no separate REST
endpoint, only the SignalR-rendered page). Small dataset so far (2 records
total, current legislature's per-diem regulation -- Resolução Nº 2.873/2025
-- is recent; travel was previously forbidden per the page's own footnote).

Table layout isn't a real HTML `<table>` (an `eval_on_selector_all("table
tr", ...)` came back empty) -- it's tab-separated text within a div grid,
so this parses `page.inner_text("body")` line-by-line instead of querying
table cells: each record is two lines (name, then "Vereador.\t{qtd}\t
{valor}\t{data_inicio} à {data_fim}\t{motivo}\t{destino}").

`vereador_id` is matched by exact `nome` against the `vereadores` table
(populated by `etl.camaras.betim`, which must run first).

NOT built this round: "Verbas Indenizatórias" (98 records already, itemized
reimbursements -- meals, media/comms, office supplies) is a distinct kind
of allowance with no matching table in the schema yet (`diarias` is
travel-specific; this would need its own table + migration). Flagged in
TODO.md rather than force-fit into `diarias`. `subsidios` (monthly base
pay) also NOT built -- no itemized monthly payroll list was found on the
site, only the resolution that sets the fixed amount; revisit if a
structured source turns up.

Cron: monthly.
"""
import argparse
import re
import sys

from playwright.sync_api import sync_playwright

from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

BASE_URL = "https://www.camarabetim.mg.gov.br"
DIARIAS_PATH = "/Transparência/Diárias"


def _wait_for_blazor(page, timeout_ms: int = 15000) -> None:
    page.wait_for_function(
        "() => !document.body.innerText.includes('Carregando...')",
        timeout=timeout_ms,
    )


def _parse_data_br(value: str) -> str | None:
    m = re.match(r"(\d{2})/(\d{2})/(\d{4})", value.strip())
    if not m:
        return None
    d, mo, y = m.groups()
    return f"{y}-{mo}-{d}"


def _parse_valor_br(value: str) -> float | None:
    m = re.search(r"([\d.]+,\d{2})", value)
    if not m:
        return None
    return float(m.group(1).replace(".", "").replace(",", "."))


def _scrape(page) -> list[dict]:
    page.goto(f"{BASE_URL}{DIARIAS_PATH}", wait_until="networkidle")
    _wait_for_blazor(page)
    texto = page.inner_text("body")

    linhas = texto.splitlines()
    try:
        inicio = next(i for i, l in enumerate(linhas) if l.strip().startswith("Servidor/Cargo")) + 1
    except StopIteration:
        return []

    registros = []
    i = inicio
    while i + 1 < len(linhas):
        nome = linhas[i].strip()
        if not nome or nome == "TOTAL":
            break
        proxima = linhas[i + 1]
        campos = proxima.split("\t")
        if len(campos) < 6:
            break
        _cargo, qtd, valor, periodo, motivo, destino = campos[:6]
        periodo_m = re.match(r"(\d{2}/\d{2}/\d{4})\s*.\s*(\d{2}/\d{2}/\d{4})", periodo.strip())
        registros.append(
            {
                "beneficiario": nome,
                "qtd_diarias": float(qtd.strip()) if qtd.strip().replace(",", ".").replace(".", "", 1).isdigit() else None,
                "valor": _parse_valor_br(valor),
                "data_inicio": _parse_data_br(periodo_m.group(1)) if periodo_m else None,
                "data_fim": _parse_data_br(periodo_m.group(2)) if periodo_m else None,
                "motivo": motivo.strip() or None,
                "destino": destino.strip() or None,
            }
        )
        i += 2

    return registros


def sync(id_municipio: str) -> None:
    client = get_supabase_client()

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        registros = _scrape(page)
        browser.close()

    print(f"[etl.camaras.diarias] registros_encontrados={len(registros)}")
    if not registros:
        return

    vereadores_db = (
        client.table("vereadores").select("id, nome").eq("id_municipio", id_municipio).execute()
    )
    uuid_by_nome = {r["nome"]: r["id"] for r in (vereadores_db.data or [])}

    rows = []
    for r in registros:
        rows.append(
            {
                "id_municipio": id_municipio,
                "orgao": "camara",
                "beneficiario": r["beneficiario"],
                "vereador_id": uuid_by_nome.get(r["beneficiario"]),
                "destino": r["destino"],
                "data_inicio": r["data_inicio"],
                "data_fim": r["data_fim"],
                "qtd_diarias": r["qtd_diarias"],
                "valor": r["valor"],
                "motivo": r["motivo"],
                "link_fonte": f"{BASE_URL}{DIARIAS_PATH}",
            }
        )

    # No natural-key unique constraint on `diarias` either -- same
    # DDL-access limitation as proposicoes (see etl/camaras/betim.py
    # docstring). Dataset is tiny (2 records as of 2026-07-21), so a
    # full delete+reinsert per run is simpler and safe here, unlike the
    # larger tables elsewhere in this ETL.
    client.table("diarias").delete().eq("id_municipio", id_municipio).eq("orgao", "camara").execute()
    client.table("diarias").insert(rows).execute()
    print(f"[etl.camaras.diarias] total={len(rows)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio)
    except RuntimeError as e:
        print(f"[etl.camaras.diarias] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
