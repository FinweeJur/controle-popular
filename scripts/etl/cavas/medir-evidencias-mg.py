#!/usr/bin/env python3
"""
medir-evidencias-mg.py — mede as interseções que alimentam o mapeamento de
evidências de mineração irregular em Minas Gerais.

Para o PLANO-MAPEAMENTO-MINERACAO-ILEGAL.md: quantos polígonos de mineração
detectada por satélite (camadas do globo) têm o centroide dentro de terra
indígena, unidade de conservação e território quilombola, e quantos autos de
infração do IBAMA no acervo falam de mineração.

Fontes (camadas versionadas no globo, geradas a partir das fontes oficiais):
  - mineracao-sem-cadastro.geojson / cavas-monitoradas.geojson — Monitor da
    Mineração (MapBiomas) cruzado com a poligonal ANM/SIGMINE;
  - terras-indigenas.geojson — FUNAI; unidades-conservacao.geojson — CNUC;
  - territorios-quilombolas.geojson — INCRA;
  - data/ibama-autos-infracao.json — dados abertos do IBAMA (auto de infração).

Decisão técnica: sem shapely nesta máquina, o teste é ray casting puro em
Python (point-in-polygon). O número é um PISO, não um total: polígono que
encosta mas cujo centroide cai fora não conta. O plano publica o método
junto do número para ninguém ler piso como total.

Uso: python scripts/etl/cavas/medir-evidencias-mg.py
"""
import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
CAM = REPO / "apps" / "web" / "public" / "terras" / "globo" / "dados" / "camadas"
DATA = REPO / "apps" / "web" / "data"

# Termos que caracterizam atividade minerária no texto do auto de infração.
PADRAO_MINERACAO = re.compile(
    r"minera|garimp|extrai|cava|rejeito|barragem|ouro|mineral", re.I
)


def carregar(nome: Path):
    """Lê um JSON do repositório com UTF-8."""
    with open(nome, encoding="utf-8") as f:
        return json.load(f)


def centroide(geom: dict):
    """Centroide aproximado: média dos vértices do anel principal do polígono."""
    t = geom["type"]
    if t == "Point":
        return tuple(geom["coordinates"])
    coords = geom["coordinates"]
    anel = coords[0] if t == "Polygon" else coords[0][0]
    xs = [p[0] for p in anel]
    ys = [p[1] for p in anel]
    return (sum(xs) / len(xs), sum(ys) / len(ys))


def dentro(pt, anel) -> bool:
    """Ray casting: True se o ponto está dentro do anel fechado."""
    x, y = pt
    n = len(anel)
    res = False
    j = n - 1
    for i in range(n):
        xi, yi = anel[i][0], anel[i][1]
        xj, yj = anel[j][0], anel[j][1]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
            res = not res
        j = i
    return res


def bbox(anel):
    xs = [p[0] for p in anel]
    ys = [p[1] for p in anel]
    return (min(xs), min(ys), max(xs), max(ys))


def indexar(features):
    """Índice de bounding boxes dos polígonos de uma camada (pré-filtro)."""
    idx = []
    for ft in features:
        g = ft.get("geometry")
        if not g:
            continue
        if g["type"] == "Polygon":
            anel = g["coordinates"][0]
        elif g["type"] == "MultiPolygon":
            anel = g["coordinates"][0][0]
        else:
            continue
        idx.append((bbox(anel), anel))
    return idx


def cai_dentro(pt, idx) -> bool:
    px, py = pt
    for (x0, y0, x1, y1), anel in idx:
        if x0 <= px <= x1 and y0 <= py <= y1 and dentro(pt, anel):
            return True
    return False


def medir_intersecoes():
    """Mede centroide-dentro por camada de proteção, para as duas camadas de mineração."""
    camadas = {}
    for chave, arq in (
        ("terras_indigenas", "terras-indigenas.geojson"),
        ("unidades_conservacao", "unidades-conservacao.geojson"),
        ("territorios_quilombolas", "territorios-quilombolas.geojson"),
    ):
        feats = carregar(CAM / arq)["features"]
        camadas[chave] = (feats, indexar(feats))
        print(f"camada {chave}: {len(feats)} poligonos")

    for mine_arq in ("mineracao-sem-cadastro.geojson", "cavas-monitoradas.geojson"):
        miner = carregar(CAM / mine_arq)
        poligonos = [ft for ft in miner["features"] if ft.get("geometry")]
        centros = [centroide(ft["geometry"]) for ft in poligonos]
        print(f"{mine_arq}: {len(poligonos)} poligonos")
        for chave, (feats, idx) in camadas.items():
            n = sum(1 for c in centros if cai_dentro(c, idx))
            print(f"  centroide dentro de {chave}: {n} (camada com {len(feats)})")


def medir_autos_ibama():
    """Conta autos do IBAMA com termo de mineração, no Brasil e em MG.

    As linhas vêm como arrays alinhados a `colunas` exceto a do nome, que fica
    fora do texto varrido (dado pessoal de responsável: nunca sai para o prompt
    nem para o relatório — AGENTS § 5.8).
    """
    dados = carregar(DATA / "ibama-autos-infracao.json")
    linhas = dados.get("linhas", [])
    rel = rel_mg = 0
    mg_total = 0
    for r in linhas:
        texto = " ".join(str(r[i]) for i in range(len(r)) if i not in (7, 8) and r[i])
        uf = (r[5] or "").strip().upper()
        if uf == "MG":
            mg_total += 1
        if PADRAO_MINERACAO.search(texto):
            rel += 1
            if uf == "MG":
                rel_mg += 1
    print(
        f"IBAMA autos: {len(linhas)} no acervo (fonte {dados.get('fonte_ultima_atualizacao')}) "
        f"| MG {mg_total} | termo de mineracao {rel} | em MG {rel_mg}"
    )


if __name__ == "__main__":
    medir_intersecoes()
    medir_autos_ibama()
