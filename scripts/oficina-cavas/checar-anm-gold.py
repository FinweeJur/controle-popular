import csv
import json
from pathlib import Path

RC = Path(r"X:\DevCoder\OpenCode\controle-popular")
ENTRADA = RC / "scripts/.cache/cavas-2m/gold-set/revisao-gold-enriquecido.csv"
SAIDA = RC / "scripts/.cache/cavas-2m/gold-set/revisao-gold-anm.csv"
ANM = RC / "apps/web/public/terras/globo/dados/camadas/sigmine-operacao.geojson"


def bbox_geom(geom):
    xs, ys = [], []

    def anda(c):
        if isinstance(c[0], (int, float)):
            xs.append(c[0])
            ys.append(c[1])
        else:
            for p in c:
                anda(p)

    anda(geom.get("coordinates", []))
    if not xs:
        return None
    return min(xs), min(ys), max(xs), max(ys)


def dentro_anel(x, y, anel):
    dentro = False
    n = len(anel)
    for i in range(n):
        x1, y1 = anel[i]
        x2, y2 = anel[(i + 1) % n]
        if (y1 > y) != (y2 > y):
            corte = (x2 - x1) * (y - y1) / (y2 - y1) + x1
            if x < corte:
                dentro = not dentro
    return dentro


def dentro_poligono(x, y, aneis):
    if not aneis or not dentro_anel(x, y, aneis[0]):
        return False
    return not any(dentro_anel(x, y, buraco) for buraco in aneis[1:])


def dentro_geom(x, y, geom):
    tipo = geom.get("type")
    coords = geom.get("coordinates", [])
    if tipo == "Polygon":
        return dentro_poligono(x, y, coords)
    if tipo == "MultiPolygon":
        return any(dentro_poligono(x, y, p) for p in coords)
    return False


def carregar_polys():
    feats = json.loads(ANM.read_text(encoding="utf-8"))["features"]
    polys = []
    for f in feats:
        p = f.get("properties", {})
        g = f.get("geometry") or {}
        b = bbox_geom(g)
        if b:
            polys.append((b, p, g))
    return polys


def _na_bbox(b, x: float, y: float) -> bool:
    if b[0] <= x <= b[2]:
        return b[1] <= y <= b[3]
    return False


def achar_areas(x: float, y: float, polys: list) -> list[dict]:
    achados = []
    for b, p, g in polys:
        if not _na_bbox(b, x, y):
            continue
        if dentro_geom(x, y, g):
            achados.append(p)
    return achados


def preencher(r: dict, achados: list[dict]) -> None:
    r["anm_dentro"] = "sim" if achados else "nao"
    if not achados:
        return
    r["anm_processo_area"] = " | ".join(
        str(p.get("processo")) for p in achados)
    r["anm_fase_area"] = " | ".join(str(p.get("fase")) for p in achados)
    r["anm_area_ha_area"] = " | ".join(str(p.get("area_ha")) for p in achados)
    if not r.get("anm_fase"):
        r["anm_fase"] = achados[0].get("fase", "")


def processar(rows, polys):
    extras = ["anm_dentro", "anm_processo_area", "anm_fase_area",
              "anm_area_ha_area"]
    for r in rows:
        for e in extras:
            r[e] = ""
        try:
            x, y = float(r["lon"]), float(r["lat"])
        except (TypeError, ValueError):
            continue
        preencher(r, achar_areas(x, y, polys))
    return rows


def escrever(rows, campos, extras):
    with SAIDA.open("w", encoding="utf-8-sig", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=campos + extras)
        w.writeheader()
        w.writerows(rows)


def main():
    rows = list(csv.DictReader(
        ENTRADA.read_text(encoding="utf-8-sig").splitlines()))
    campos = list(rows[0].keys())
    extras = ["anm_dentro", "anm_processo_area", "anm_fase_area",
              "anm_area_ha_area"]
    saida = processar(rows, carregar_polys())
    escrever(saida, campos, extras)
    pos = [r for r in saida if r["papel"] == "positivo"]
    ctl = [r for r in saida if r["papel"] == "controle"]
    print("positivos dentro ANM",
          sum(1 for r in pos if r["anm_dentro"] == "sim"), "de", len(pos))
    print("controles dentro ANM",
          sum(1 for r in ctl if r["anm_dentro"] == "sim"), "de", len(ctl))
    print("positivos fora de toda operacao",
          sum(1 for r in pos if r["anm_dentro"] == "nao"))
    print(SAIDA)


if __name__ == "__main__":
    main()
