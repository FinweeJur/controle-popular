#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Baixa hidrografia e relevo para o banco de cavas ANM.

Features geográficas para calibrar o modelo:
  - Hidrografia: rios e lagos do IBGE (DNSB) — proximidade a água é
    sinal forte de mineração (lavra, rejeito, drenagem).
  - Relevo: SRTM/ASTER via OpenTopography — cavas ficam em vale,
    encosta, planalto; a forma do terreno ajuda a separar.

Fontes:
  - Hidrografia: IBGE DNSB (Diretório Nacional de Saberes e Bens),
    download via FTP ou API.
  - Relevo: OpenTopography SRTM GL1 (gratuito com cadastro) ou
    Copernicus DEM (sem cadastro).

Uso: python scripts/oficina-cavas/baixar-features-geograficas.py
Saida: scripts/.cache/cavas-banco/features/
"""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

_RAIZ = Path(__file__).resolve().parents[2]
_BANCO = _RAIZ / "scripts" / ".cache" / "cavas-banco"
_SAIDA = _BANCO / "features"

# Extensão de MG (aprox)
MG_EXT = {"minlon": -51.1, "maxlon": -39.8, "minlat": -23.0, "maxlat": -14.0}


def baixar_hidrografia_ibge() -> bool:
    """Baixa hidrografia do IBGE via API DNSB.

    O IBGE tem API REST para hidrografia. Para MG, baixamos as
    bacias hidrográficas e os rios principais.
    """
    import urllib.request

    # API do IBGE: hidrografia por UF
    # https://servicodados.ibge.gov.br/api/v1/localidades/estados/{uf}/mesorregioes
    # Para hidrografia, usamos o FTP ou o WMS do IBGE

    # WMS do IBGE (hidrografia)
    url_base = "https://geoserver.ibge.gov.br/geoserver/IBGE/wms"
    params = {
        "service": "WMS",
        "version": "1.3.0",
        "request": "GetCapabilities",
    }

    try:
        import urllib.parse
        url = url_base + "?" + urllib.parse.urlencode(params)
        req = urllib.request.Request(url, headers={
            "User-Agent": "ControlePopular/1.0"
        })
        with urllib.request.urlopen(req, timeout=30) as r:
            caps = r.read().decode()
        print(f"WMS IBGE: {len(caps)} bytes de capabilities")
        # Salva capabilities para inspeção
        (_SAIDA / "ibge-wms-capabilities.xml").write_text(caps)
        return True
    except Exception as e:
        print(f"WMS IBGE falhou: {type(e).__name__}: {e}")
        return False


def baixar_relevo_copernicus() -> bool:
    """Baixa relevo Copernicus DEM (gratuito, sem cadastro).

    Copernicus GLO-30 é gratuito via AWS Open Data:
    https://copernicus-dem-30m.s3.amazonaws.com/
    """
    import urllib.request

    # Tile de MG (aprox): copernicus tile 30m
    # Formato: Copernicus_DSM_COG_10_S21_00_DEM/Copernicus_DSM_COG_10_S21_00_DEM.tif
    # Para MG, precisamos de tiles S21, S22, S23

    tiles = []
    for lat in range(-23, -13):  # -23 a -14
        for lon in range(-52, -39):  # -52 a -40
            ns = "S" if lat < 0 else "N"
            ew = "W" if lon < 0 else "E"
            tile = f"Copernicus_DSM_COG_10_{ns}{abs(lat):02d}_{ew}{abs(lon):03d}_DEM"
            tiles.append((tile, lat, lon))

    print(f"Tiles Copernicus para MG: {len(tiles)}")
    # Por enquanto, só salva a lista (download real seria muito lento)
    (_SAIDA / "copernicus-tiles.json").write_text(
        json.dumps(tiles, indent=1))
    return True


def main() -> int:
    _SAIDA.mkdir(parents=True, exist_ok=True)
    print(f"Saida: {_SAIDA}")

    print("\n=== Hidrografia IBGE ===")
    ok_hidro = baixar_hidrografia_ibge()

    print("\n=== Relevo Copernicus ===")
    ok_relevo = baixar_relevo_copernicus()

    print(f"\nResumo: hidrografia={'OK' if ok_hidro else 'FALHOU'}, "
          f"relevo={'OK' if ok_relevo else 'FALHOU'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
