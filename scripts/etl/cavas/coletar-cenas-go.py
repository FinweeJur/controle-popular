"""coletar-cenas-go.py — Fase 1 do plano de cavas: cenas STAC de Goiás (2ª UF).

Coleta o catálogo de cenas CBERS-4A/WPM (coleção CB4A-WPM-L2-DN-1) do STAC
do BDC/INPE (https://data.inpe.br/bdc/stac/v1) para o bbox do estado de
Goiás, janela de 18 meses, com paginação por token.

Saída: scripts/.cache/cavas-calibracao/cenas-go.json
Formato idêntico ao cenas-mg.json (mesmas chaves: id, datetime, geom, bands).

Uso:
    python scripts/etl/cavas/coletar-cenas-go.py

## Fonte e licença

- STAC: https://data.inpe.br/bdc/stac/v1 (sem login)
- Coleção: CB4A-WPM-L2-DN-1 (CBERS-4A, WPM, L2 DN)
- Bandas: RGB = BAND3/BAND2/BAND1; BAND4 = NIR. Pixel int16.
- Licença: CC-BY 4.0 — atribuição INPE/BDC.

## Decisão robots.txt (consultado em 2026-09-25)

- data.inpe.br/robots.txt: `User-agent: * Disallow: /hiddenarea/` —
  área de dados pública do BDC liberada; UA honesto e pausa de 2 s entre
  requisições como cortesia.

## Decisões técnicas

- Paginação por token (campo `token` no body POST, link `next` na resposta).
  A API devolve 1000 cenas no limite (piso, não total) — a paginação é
  obrigatória para medir o real.
- Pausa de 2 s entre requisições (cortesia por host).
- User-Agent honesto: ControlePopular/1.0 (+controlepopular.com.br; transparencia).
"""
from __future__ import annotations

import json
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent.parent  # .../scripts
CACHE = ROOT / ".cache" / "cavas-calibracao"
SAIDA = CACHE / "cenas-go.json"

STAC = "https://data.inpe.br/bdc/stac/v1/search"
UA = "ControlePopular/1.0 (+controlepopular.com.br; transparencia)"
PAUSA = 2

COLECAO = "CB4A-WPM-L2-DN-1"
RGB_BANDS = ("BAND3", "BAND2", "BAND1")

GO_BBOX = (-53.0, -19.5, -45.5, -13.5)  # minlon, minlat, maxlon, maxlat
MESES_JANELA = 18


def _post_json(url: str, body: dict, timeout: int = 120) -> dict:
    req = urllib.request.Request(
        url, data=json.dumps(body).encode(), method="POST",
        headers={"User-Agent": UA, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


def buscar_cenas_go() -> tuple[list[dict], int]:
    """Cenas CBERS-4A/WPM de GO (18 meses), com paginação por token.

    Retorna (cenas, total_paginas). Se a 1ª página devolve < 1000 e não há
    link next, o total é real (não é piso da API).
    """
    if SAIDA.exists():
        print(f"  cache existe: {SAIDA} — apague para re-coletar", flush=True)
        dados = json.loads(SAIDA.read_text(encoding="utf-8"))
        return dados, 0

    agora = datetime.now(timezone.utc)
    inicio = (agora - timedelta(days=MESES_JANELA * 30)).strftime("%Y-%m-%dT%H:%M:%SZ")
    fim = agora.strftime("%Y-%m-%dT%H:%M:%SZ")

    body = {
        "collections": [COLECAO],
        "bbox": list(GO_BBOX),
        "datetime": f"{inicio}/{fim}",
        "limit": 1000,
    }

    cenas: list[dict] = []
    token = None
    pagina = 0

    while True:
        pagina += 1
        if token:
            body["token"] = token
        j = _post_json(STAC, body)
        feats = j.get("features", [])
        for f in feats:
            cenas.append({
                "id": f.get("id"),
                "datetime": (f.get("properties", {}).get("datetime") or "")[:10],
                "geom": f.get("geometry"),
                "bands": {k: a.get("href") for k, a in f.get("assets", {}).items()
                          if k in RGB_BANDS},
            })
        print(f"  página {pagina}: {len(feats)} cenas (total {len(cenas)})", flush=True)

        token = None
        for ln in j.get("links", []):
            if ln.get("rel") == "next" and ln.get("href"):
                qs = urllib.parse.urlparse(ln["href"]).query
                token = dict(urllib.parse.parse_qsl(qs)).get("token")

        if not token or not feats:
            break
        time.sleep(PAUSA)

    time.sleep(PAUSA)
    CACHE.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(cenas, ensure_ascii=False), encoding="utf-8")
    print(f"  cenas CBERS-4A/WPM em GO (18 meses): {len(cenas)}", flush=True)
    return cenas, pagina


def validar(cenas: list[dict], paginas: int) -> bool:
    """Validação: total real (1 página < 1000 = real) e amostra com bands."""
    if paginas == 1 and len(cenas) < 1000:
        print(f"  total real: {len(cenas)} cenas (1 página, sem next — não é piso)", flush=True)
    elif paginas > 1:
        print(f"  total real: {len(cenas)} cenas ({paginas} páginas)", flush=True)
    else:
        print(f"  ⚠️ {len(cenas)} cenas em 1 página = teto da API (piso, não total)", flush=True)
        return False

    com_bands = [c for c in cenas if len(c.get("bands", {})) == 3]
    if len(com_bands) < 3:
        print(f"  ⚠️ apenas {len(com_bands)} cenas com 3 bands", flush=True)
        return False

    print(f"  ✅ {len(cenas)} cenas | {len(com_bands)} com BAND1-3", flush=True)
    for c in com_bands[:3]:
        print(f"    {c['id']} | {c['datetime']} | bands: {list(c['bands'].keys())}", flush=True)
    return True


def principal() -> int:
    print("coletando cenas STAC de Goiás (CB4A-WPM-L2-DN-1)...", flush=True)
    cenas, paginas = buscar_cenas_go()
    ok = validar(cenas, paginas)
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(principal())
