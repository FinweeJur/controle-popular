#!/usr/bin/env python3
r"""calcular_alerta_quilombola_mancha.py — cruza os territórios quilombolas
de MG já ingeridos neste projeto com as 156 manchas de inundação de
barragem (FEAM) e grava dados/camadas/alerta-quilombola-mancha.geojson: só
as INTERSEÇÕES DE VERDADE, uma feição por par (território, barragem) que
realmente se toca.

POR QUE ESTE SCRIPT EXISTE: mesmo pergunta do dono que motivou
`calcular_alerta_ti_mancha.py` (docs/FONTES-TERRITORIO-E-MINERACAO.md,
seções 1 e 4), estendida a quilombolas -- "o raio de proximidade de áreas
quilombolas e indígenas está funcionando para além de barragens?". Até
2026-08-13 só existia o cruzamento TI×mancha; quilombola nunca tinha sido
cruzado com NADA. Este script fecha essa lacuna, com a MESMA disciplina
geométrica do script de TI: `shapely.intersects()`/`intersection()` sobre
geometria completa, pré-filtro bbox só como otimização (não como
substituto da interseção real).

═══ COBERTURA -- LEIA ANTES DE CONFIAR NO RESULTADO ═══

Este projeto tem quilombola em DOIS arquivos regionais, nunca unificados
num arquivo estadual (diferente de `terras-indigenas.geojson`, que já é
as 16 TIs de MG inteiras):

  `territorios-quilombolas.geojson`       — 2 territórios (bacia do Paraopeba)
  `territorios-quilombolas-vales.geojson` — 12 territórios (Vales -- Jequitinhonha/Mucuri/Rio Doce)

Este script lê os DOIS e junta (14 territórios no total). **Não temos
confirmação de que isto é a totalidade dos territórios quilombolas
certificados de MG** -- é o que este projeto ingeriu para as duas regiões
que já tem onboardadas. Um território quilombola fora dessas duas regiões
NÃO aparece aqui, e "zero cruzamento" não pode ser lido como "MG inteira
está livre de sobreposição": é "as 14 áreas que temos hoje não cruzam".

Até 13/08/2026 cada feature de origem só tinha `area_ha` como propriedade
(sem nome do território/município na fonte ingerida). Desde
`ingerir_incra_quilombolas.py` (mesmo dia), as duas camadas passaram a trazer
`nome`, `municipio_nome` e `fase_quilombola` do INCRA -- exceto a ÚNICA
feição que não achou par lá (`territorios-quilombolas-vales.geojson` índice
3, ver a docstring daquele script), que continua sem nome. A feição de saída
carrega índice do território de origem + arquivo de origem, `area_ha`,
`territorio_nome`/`territorio_municipio`/`territorio_fase` (None quando a
fonte não tinha), e os dados completos do lado da barragem.

Uso:
    python scripts/calcular_alerta_quilombola_mancha.py
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

from shapely.geometry import mapping, shape
from shapely.validation import make_valid

LOG = "[calcular_alerta_quilombola_mancha]"

DIR_GLOBO = Path(__file__).resolve().parent.parent
DIR_CAMADAS = DIR_GLOBO / "dados" / "camadas"
DIR_TMP = DIR_GLOBO / "scripts" / ".tmp-ingest"

QUILOMBOLA_PATHS = [
    DIR_CAMADAS / "territorios-quilombolas.geojson",        # bacia do Paraopeba
    DIR_CAMADAS / "territorios-quilombolas-vales.geojson",  # Vales
]
MANCHA_BRUTA_PATH = DIR_TMP / "mancha.json"
SAIDA_PATH = DIR_CAMADAS / "alerta-quilombola-mancha.geojson"

# Mesma régua do script de TI, ver docstring de lá.
TOLERANCIA_GRAUS = 0.0002


def _carregar_quilombolas() -> list[dict]:
    territorios = []
    for path in QUILOMBOLA_PATHS:
        if not path.exists():
            print(f"{LOG} AVISO: {path} não existe -- pulando esta região.", file=sys.stderr)
            continue
        with open(path, encoding="utf-8") as f:
            d = json.load(f)
        for idx, feat in enumerate(d["features"]):
            feat = dict(feat)
            feat["_origem_arquivo"] = path.name
            feat["_origem_indice"] = idx
            territorios.append(feat)
    return territorios


def _carregar_manchas_brutas() -> list[dict]:
    if not MANCHA_BRUTA_PATH.exists():
        print(f"{LOG} {MANCHA_BRUTA_PATH} não está em cache -- baixando de novo "
              f"(mesma fonte do ingerir_feam_zas_mancha.py, ~600 MB)...")
        import shutil
        import urllib.request
        DIR_TMP.mkdir(parents=True, exist_ok=True)
        url = ("https://geoserver.meioambiente.mg.gov.br/IDE/ows?service=WFS&version=1.0.0"
               "&request=GetFeature&typeName=IDE:ide_1903_mg_mancha_inundacao_pae_pol"
               "&outputFormat=application/json")
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; ControlePopular/1.0)"})
        with urllib.request.urlopen(req, timeout=600) as resp, open(MANCHA_BRUTA_PATH, "wb") as f:
            shutil.copyfileobj(resp, f, length=1024 * 1024)
    with open(MANCHA_BRUTA_PATH, encoding="utf-8") as f:
        d = json.load(f)
    return d["features"]


def _area_ha(poligono) -> float:
    """Mesma aproximação de mapa do script de TI (ver lá para a nota
    completa sobre por que não é geodésica de verdade)."""
    lat_media = poligono.centroid.y
    m_por_grau_lat = 111_320.0
    m_por_grau_lon = 111_320.0 * math.cos(math.radians(lat_media))
    return poligono.area * m_por_grau_lat * m_por_grau_lon / 10_000


def _geom_valida(geo_interface: dict):
    g = shape(geo_interface)
    if not g.is_valid:
        g = make_valid(g)
    return g


def main() -> None:
    territorios = _carregar_quilombolas()
    if not territorios:
        print(f"{LOG} ERRO: nenhum território quilombola carregado -- confira "
              f"os arquivos em {DIR_CAMADAS}.", file=sys.stderr)
        sys.exit(1)

    manchas = _carregar_manchas_brutas()
    print(f"{LOG} {len(territorios)} território(s) quilombola(s) (2 arquivos) × "
          f"{len(manchas)} mancha(s) de inundação = {len(territorios) * len(manchas)} pares a checar.")

    manchas_prontas = []
    for m in manchas:
        props = m.get("properties") or {}
        geom = m.get("geometry")
        if geom is None:
            continue
        try:
            g = _geom_valida(geom)
        except Exception as e:  # noqa: BLE001
            print(f"{LOG} AVISO: mancha '{props.get('estrutura')}' com geometria inválida mesmo após reparo: {e}")
            continue
        if g.is_empty:
            continue
        manchas_prontas.append((props, g, g.bounds))

    achados = []
    for terr in territorios:
        terr_props = terr.get("properties") or {}
        terr_geom = terr.get("geometry")
        if terr_geom is None:
            continue
        g_terr = _geom_valida(terr_geom)
        if g_terr.is_empty:
            continue
        bx = g_terr.bounds

        for props_m, g_m, bm in manchas_prontas:
            if bx[2] < bm[0] or bm[2] < bx[0] or bx[3] < bm[1] or bm[3] < bx[1]:
                continue
            if not g_terr.intersects(g_m):
                continue

            inter = g_terr.intersection(g_m)
            if inter.is_empty or inter.area == 0:
                continue

            inter_simpl = inter.simplify(TOLERANCIA_GRAUS, preserve_topology=True)
            if inter_simpl.is_empty:
                inter_simpl = inter

            achados.append({
                "type": "Feature",
                "properties": {
                    "territorio_arquivo_origem": terr["_origem_arquivo"],
                    "territorio_indice_origem": terr["_origem_indice"],
                    "territorio_area_ha": terr_props.get("area_ha"),
                    # Desde `ingerir_incra_quilombolas.py` (13/08/2026): nome e
                    # município reais do INCRA, quando a feição achou par lá
                    # (ver `fonte_incra` naquele script) -- None senão, igual
                    # ao comportamento antigo.
                    "territorio_nome": terr_props.get("nome"),
                    "territorio_municipio": terr_props.get("municipio_nome"),
                    "territorio_fase": terr_props.get("fase_quilombola"),
                    "barragem": props_m.get("estrutura"),
                    "empreendedor": props_m.get("empreended"),
                    "municipio_barragem": props_m.get("municipio"),
                    "status_pae": props_m.get("status_pae"),
                    "area_intersecao_ha": round(_area_ha(inter), 2),
                },
                "geometry": mapping(inter_simpl),
            })
            print(f"{LOG} ALERTA: {terr['_origem_arquivo']}#{terr['_origem_indice']} "
                  f"× {props_m.get('estrutura')} ({props_m.get('empreended')}, {props_m.get('municipio')})")

    print(f"{LOG} {len(achados)} interseção(ões) real(is) encontrada(s), "
          f"de {len(territorios)} territórios × {len(manchas_prontas)} manchas válidas.")

    saida = {
        "type": "FeatureCollection",
        "name": "alerta-quilombola-mancha",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features": achados,
    }
    with open(SAIDA_PATH, "w", encoding="utf-8") as fh:
        json.dump(saida, fh, ensure_ascii=False, separators=(",", ": "))
    print(f"{LOG} gravado em {SAIDA_PATH} ({SAIDA_PATH.stat().st_size:,} bytes).")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # noqa: BLE001
        print(f"{LOG} ERRO: {e}", file=sys.stderr)
        raise
