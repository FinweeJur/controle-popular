"""etl.camaras.verbas — sync councilor "verbas indenizatórias" (itemized
reimbursements: meals, media/comms, office rent, etc.) from
camarabetim.mg.gov.br's Transparência section into `verbas_indenizatorias`.

Usage: python -m etl.camaras.verbas --id-municipio 3106705

Source: `Transparência/Verbas Indenizatórias` (Blazor Server, same pattern
as etl.camaras.diarias). Distinct from `diarias` (specific travel/per-diem
events) -- this is itemized ongoing reimbursements per purchase, grouped by
`grupo_verba` (Alimentação, Mídia, Copa Interna, Locação de Imóveis, etc.).
98 records / R$ 89.173,18 total as of 2026-07-21, current legislature only
(no period filter applied -- the page defaults to showing everything
available, which so far is all within the current term).

Unlike `diarias`'s 2-line-per-record layout, this page's rows are a single
tab-separated line each: "data\tvereador\tgrupo_verba\tfornecedor\tvalor".

`vereador_id` matched by exact `nome` against `vereadores` (populated by
etl.camaras.betim, which must run first).

Cron: monthly.
"""
import argparse
import re
import sys

from playwright.sync_api import sync_playwright

from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client

BASE_URL = "https://www.camarabetim.mg.gov.br"
VERBAS_PATH = "/Transparência/Verbas Indenizatórias"


def _wait_for_blazor(page, timeout_ms: int = 20000) -> None:
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


DATA_LINE_RE = re.compile(r"^\d{2}/\d{2}/\d{4}\t")


def _scrape(page) -> list[dict]:
    page.goto(f"{BASE_URL}{VERBAS_PATH}", wait_until="networkidle")
    _wait_for_blazor(page)
    texto = page.inner_text("body")

    registros = []
    for linha in texto.splitlines():
        if not DATA_LINE_RE.match(linha):
            continue
        campos = linha.split("\t")
        if len(campos) < 5:
            continue
        data, vereador, grupo, fornecedor, valor = campos[:5]
        registros.append(
            {
                "data": _parse_data_br(data),
                "beneficiario": vereador.strip(),
                "grupo_verba": grupo.strip() or None,
                "fornecedor": fornecedor.strip() or None,
                "valor": _parse_valor_br(valor),
            }
        )
    return registros


def sync(id_municipio: str) -> None:
    client = get_supabase_client()

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        registros = _scrape(page)
        if not registros:
            # Blazor Server round-trip occasionally comes back empty
            # (transient -- confirmed live 2026-07-21, second attempt on
            # the same run succeeded). One retry with a fresh navigation
            # before giving up.
            print("[etl.camaras.verbas] 0 registros na 1a tentativa, tentando de novo...")
            registros = _scrape(page)
        browser.close()

    print(f"[etl.camaras.verbas] registros_encontrados={len(registros)}")
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
                "vereador_id": uuid_by_nome.get(r["beneficiario"]),
                "beneficiario": r["beneficiario"],
                "data": r["data"],
                "grupo_verba": r["grupo_verba"],
                "fornecedor": r["fornecedor"],
                "valor": r["valor"],
                "link_fonte": f"{BASE_URL}{VERBAS_PATH}",
            }
        )

    # Same no-DDL-access situation as diarias/proposicoes -- full
    # delete+reinsert per id_municipio, dataset is small (under 200 rows).
    client.table("verbas_indenizatorias").delete().eq("id_municipio", id_municipio).execute()
    CHUNK = 200
    for i in range(0, len(rows), CHUNK):
        client.table("verbas_indenizatorias").insert(rows[i : i + CHUNK]).execute()
    print(f"[etl.camaras.verbas] total={len(rows)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio)
    except RuntimeError as e:
        print(f"[etl.camaras.verbas] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
