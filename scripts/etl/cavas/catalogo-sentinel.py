"""catalogo-sentinel.py — Fase 3 do plano de cavas: catálogo Sentinel-2 por ano.

Pré-catálogo cenas Sentinel-2 L2A (10 m) do STAC público do Microsoft
Planetary Computer (https://planetarycomputer.microsoft.com/api/stac/v1),
sem login, para MG e GO, ano a ano (2015–2026).

Saída: scripts/.cache/serie-sentinel/catalogo-{uf}-{ano}.json
Formato: lista de {id, datetime, cloud_cover, bbox}

NÃO baixa bandas — só catálogo. Download pesado fica para depois.

Uso:
    python scripts/etl/cavas/catalogo-sentinel.py

## Fonte e licença

- STAC: https://planetarycomputer.microsoft.com/api/stac/v1 (sem conta)
- Coleção: sentinel-2-l2A
- Licença: Copernicus free — atribuição "Contains modified Copernicus
  Sentinel data [year]".

## Decisões técnicas

- 1 arquivo por UF por ano (consulta separada com datetime restrito).
- Paginação por link next (POST com body no link).
- Pausa de 1 s entre requisições.
- User-Agent honesto: ControlePopular/1.0 (+controlepopular.com.br; transparencia).
"""
from __future__ import annotations

import json
import sys
import time
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

CACHE = Path(__file__).resolve().parent.parent.parent / ".cache" / "serie-sentinel"

STAC = "https://planetarycomputer.microsoft.com/api/stac/v1/search"
UA = "ControlePopular/1.0 (+controlepopular.com.br; transparencia)"
PAUSA = 1

COLECAO = "sentinel-2-l2a"

UFS = {
    "mg": (-51.1, -23.0, -39.8, -14.0),
    "go": (-53.0, -19.5, -45.5, -13.5),
}

ANOS = list(range(2015, 2027))


def _post_json(url: str, body: dict, timeout: int = 120) -> dict:
    req = urllib.request.Request(
        url, data=json.dumps(body).encode(), method="POST",
        headers={"User-Agent": UA, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


def _get_json(url: str, timeout: int = 120) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


def catalogar_ano(uf: str, ano: int) -> list[dict]:
    """Cenas Sentinel-2 L2A de UF no ano, com paginação."""
    saida = CACHE / f"catalogo-{uf}-{ano}.json"
    if saida.exists():
        print(f"  cache: {saida.name}", flush=True)
        return json.loads(saida.read_text(encoding="utf-8"))

    bbox = UFS[uf]
    body = {
        "collections": [COLECAO],
        "bbox": list(bbox),
        "datetime": f"{ano}-01-01T00:00:00Z/{ano + 1}-01-01T00:00:00Z",
        "limit": 200,
    }

    cenas: list[dict] = []
    url = STAC
    pagina = 0
    MAX_PAGINAS = 1

    while pagina < MAX_PAGINAS:
        pagina += 1
        j = _post_json(url, body) if pagina == 1 else _get_json(url)
        feats = j.get("features", [])
        for f in feats:
            props = f.get("properties", {})
            cenas.append({
                "id": f.get("id"),
                "datetime": props.get("datetime", "")[:10],
                "cloud_cover": props.get("eo:cloud_cover"),
                "bbox": f.get("bbox"),
            })
        print(f"  {uf}/{ano} página {pagina}: {len(feats)} (total {len(cenas)})", flush=True)

        url = None
        for ln in j.get("links", []):
            if ln.get("rel") == "next" and ln.get("href"):
                url = ln["href"]
                if ln.get("method") == "POST":
                    body = ln.get("body", body)

        if not url or not feats:
            break
        time.sleep(PAUSA)

    time.sleep(PAUSA)
    CACHE.mkdir(parents=True, exist_ok=True)
    saida.write_text(json.dumps(cenas, ensure_ascii=False), encoding="utf-8")
    print(f"  {uf}/{ano}: {len(cenas)} cenas", flush=True)
    return cenas


def principal() -> int:
    print("catálogo Sentinel-2 L2A (Planetary Computer)...", flush=True)
    total = 0
    for uf in UFS:
        for ano in ANOS:
            cenas = catalogar_ano(uf, ano)
            total += len(cenas)
    print(f"total catálogo: {total} cenas", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(principal())
