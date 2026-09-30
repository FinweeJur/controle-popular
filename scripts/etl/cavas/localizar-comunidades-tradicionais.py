#!/usr/bin/env python3
"""
localizar-comunidades-tradicionais.py — localiza comunidades tradicionais de
Minas Gerais sob pressão de mineração, cruzando tudo com a malha oficial da
bacia do rio Paraopeba.

Para o PLANO-MAPEAMENTO-MINERACAO-ILEGAL.md (revisão pública dos dados).
Responde, por comunidade: (a) ela cai na bacia SF3 (Paraopeba)?; (b) quantos
polígonos de mineração detectada por satélite têm o centroide DENTRO dela?

Camadas de entrada (versionadas em apps/web/public/terras/globo/dados/camadas):
  - terras-indigenas.geojson — FUNAI;
  - territorios-quilombolas.geojson — INCRA;
  - mineracao-sem-cadastro.geojson e cavas-monitoradas.geojson — Monitor da
    Mineração (MapBiomas) cruzado com a poligonal ANM/SIGMINE;
  - bacia-paraopeba.geojson — circunscrição hidrográfica SF3 (IDE-Sisema/IGAM),
    base GEIRH v12 25/02/2025.

Decisão técnica: sem shapely nesta máquina, o teste é ray casting puro
(point-in-polygon). O número de indícios é um PISO, não um total: polígono que
encosta na comunidade mas cujo centroide cai fora não conta. O método vai
publicado junto do número.

Uso: python scripts/etl/cavas/localizar-comunidades-tradicionais.py
"""
import json
from datetime import date
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
CAM = REPO / "apps" / "web" / "public" / "terras" / "globo" / "dados" / "camadas"
SAIDA = REPO / "apps" / "web" / "data" / "comunidades-tradicionais-mineracao-mg.json"


def carregar(nome: str):
    with open(CAM / nome, encoding="utf-8") as f:
        return json.load(f)["features"]


def aneis(geom: dict):
    """Anéis (exterior + buracos) de Polygon/MultiPolygon, como lista de listas."""
    t = geom.get("type")
    c = geom.get("coordinates") or []
    if t == "Polygon":
        return [c]
    if t == "MultiPolygon":
        return c
    return []


def dentro(p, anel) -> bool:
    """Ray casting: True se o ponto está dentro do anel."""
    x, y = p
    res = False
    n = len(anel)
    j = n - 1
    for i in range(n):
        xi, yi = anel[i][0], anel[i][1]
        xj, yj = anel[j][0], anel[j][1]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
            res = not res
        j = i
    return res


def centroide(geom: dict):
    """Centroide do maior anel por área (shoelace); None se degenerado."""
    melhor, area_melhor = None, -1.0
    for poly in aneis(geom):
        if not poly:
            continue
        anel = poly[0]
        a = cx = cy = 0.0
        n = len(anel)
        for i in range(n):
            x0, y0 = anel[i][0], anel[i][1]
            x1, y1 = anel[(i + 1) % n][0], anel[(i + 1) % n][1]
            cross = x0 * y1 - x1 * y0
            a += cross
            cx += (x0 + x1) * cross
            cy += (y0 + y1) * cross
        if a == 0:
            continue
        a *= 0.5
        if abs(a) > area_melhor:
            area_melhor = abs(a)
            melhor = (cx / (6 * a), cy / (6 * a))
    return melhor


def ponto_em_geom(geom: dict, p) -> bool:
    for poly in aneis(geom):
        if not poly:
            continue
        if dentro(p, poly[0]) and not any(dentro(p, b) for b in poly[1:]):
            return True
    return False


def bbox(geom: dict):
    xs, ys = [], []
    for poly in aneis(geom):
        for anel in poly:
            for ponto in anel:
                xs.append(ponto[0])
                ys.append(ponto[1])
    if not xs:
        return None
    return (min(xs), min(ys), max(xs), max(ys))


def bbox_contem(bx, p) -> bool:
    if not bx:
        return False
    x, y = p
    return bx[0] <= x <= bx[2] and bx[1] <= y <= bx[3]


def r(prop: dict, *chaves):
    """Primeiro valor não-vazio entre as chaves dadas."""
    for k in chaves:
        v = prop.get(k)
        if v not in (None, ""):
            return v
    return None


def main() -> None:
    geom_bacia = carregar("bacia-paraopeba.geojson")[0]["geometry"]
    bb_bacia = bbox(geom_bacia)

    mineracao = []
    for arq in ("mineracao-sem-cadastro.geojson", "cavas-monitoradas.geojson"):
        for ft in carregar(arq):
            g = ft.get("geometry")
            if not g:
                continue
            c = centroide(g)
            if c:
                mineracao.append((c, arq))
    print(f"polígonos de mineração: {len(mineracao)}")

    comunidades = []
    for tipo, arq in (("terra_indigena", "terras-indigenas.geojson"),
                      ("quilombola", "territorios-quilombolas.geojson")):
        for ft in carregar(arq):
            g = ft.get("geometry")
            if not g:
                continue
            pr = ft.get("properties") or {}
            c = centroide(g)
            em_bacia = bool(c and bbox_contem(bb_bacia, c) and ponto_em_geom(geom_bacia, c))
            # indícios cujo centroide cai DENTRO da comunidade
            n_min = sum(
                1 for (pc, _) in mineracao
                if bbox_contem(bbox(g), pc) and ponto_em_geom(g, pc)
            )
            comunidades.append({
                "tipo": tipo,
                "nome": r(pr, "nome", "nm_comunid", "terrai_nome", "terra_nome") or "(sem nome na fonte)",
                "municipio": r(pr, "municipio_nome", "nm_municip", "municipio"),
                "fase": r(pr, "fase_ti", "fase_quilombola"),
                "area_ha": pr.get("area_ha"),
                "etnia": r(pr, "etnia_nome"),
                "processo": r(pr, "processo_incra", "nr_process"),
                "familias": r(pr, "num_familias", "nr_familia"),
                "em_bacia_paraopeba": em_bacia,
                "indicios_mineracao": n_min,
                # Centroide exato do polígono da comunidade: dá o ponto do botão
                # "Voe até aqui" no globo, sem depender de município (que aqui é
                # lista de nomes separados por vírgula, e quebraria o casamento).
                "lat": round(c[1], 6) if c else None,
                "lon": round(c[0], 6) if c else None,
            })

    comunidades.sort(key=lambda x: (-x["indicios_mineracao"], x["tipo"], x["nome"] or ""))
    resumo = {
        "terras_indigenas": sum(1 for c in comunidades if c["tipo"] == "terra_indigena"),
        "quilombolas": sum(1 for c in comunidades if c["tipo"] == "quilombola"),
        "em_bacia": sum(1 for c in comunidades if c["em_bacia_paraopeba"]),
        "com_indicio_mineracao": sum(1 for c in comunidades if c["indicios_mineracao"] > 0),
        "indicios_em_comunidades": sum(c["indicios_mineracao"] for c in comunidades),
        "poligonos_mineracao": len(mineracao),
    }
    pacote = {
        "gerado_em": date.today().isoformat(),
        "metodo": (
            "Centroide em polígono (ray casting), sem shapely: PISO, não total. "
            "Polígono de mineração que encosta na comunidade mas tem centroide fora não conta."
        ),
        "bacia": {
            "nome": "SF3 — Rio Paraopeba",
            "area_km2": 12054.7,
            "fonte": "IDE-Sisema/IGAM — circunscrições hidrográficas, base GEIRH v12 25/02/2025",
        },
        "fontes": [
            "FUNAI — terras indígenas (WFS)",
            "INCRA — territórios quilombolas (Acervo Fundiário)",
            "Monitor da Mineração (MapBiomas) × ANM/SIGMINE — mineração detectada",
            "IDE-Sisema/IGAM — bacia SF3 (Paraopeba)",
        ],
        "ressalva": (
            "Receber sinal não é ilícito. É o convite para conferir na fonte — a apuração é da autoridade."
        ),
        "resumo": resumo,
        "comunidades": comunidades,
    }
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(pacote, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"resumo: {resumo}")
    print(f"escrito: {SAIDA} ({SAIDA.stat().st_size/1024:.0f} KB)")
    for c in comunidades[:12]:
        print("  ", c["tipo"], "|", c["nome"], "|", c["municipio"],
              "| bacia:", c["em_bacia_paraopeba"], "| indícios:", c["indicios_mineracao"])


if __name__ == "__main__":
    main()
