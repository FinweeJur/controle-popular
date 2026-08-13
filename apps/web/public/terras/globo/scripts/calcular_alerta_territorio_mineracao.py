#!/usr/bin/env python3
r"""calcular_alerta_territorio_mineracao.py — cruza terras indígenas (16) +
territórios quilombolas ingeridos (14) com os dois lotes do SIGMINE/ANM já
publicados na camada (`sigmine-operacao.geojson`, 7.090 polígonos de lavra
EM OPERAÇÃO, e `sigmine-interesse.geojson.gz`, 47.830 polígonos de
REQUERIMENTO/pesquisa/disponibilidade -- não é mina), e grava DUAS saídas
separadas:

    dados/camadas/alerta-territorio-sigmine-operacao.geojson
    dados/camadas/alerta-territorio-sigmine-interesse.geojson

POR QUE SEPARADO, NUNCA JUNTO (docs/FONTES-TERRITORIO-E-MINERACAO.md, seção
2): overlap com um polígono de OPERAÇÃO (concessão de lavra, licenciamento,
lavra garimpeira, registro de extração) é FATO CONSUMADO -- há extração
autorizada de verdade sobre o território. Overlap com um polígono de
INTERESSE (requerimento de lavra/pesquisa/licenciamento, disponibilidade,
direito de requerer) é RISCO FUTURO -- um papel protocolado na ANM que pode
nunca virar mina. Publicar os dois somados apagaria essa distinção jurídica
que o próprio documento de pesquisa já registrou como a correção mais
importante do levantamento.

═══ POR QUE MALHA COMPLETA, NÃO BBOX (o erro que já aconteceu hoje) ═══

O documento de pesquisa testou a TI Aldeia Katurama com filtro BBOX do WFS
e achou "6 barragens cruzando" -- e avisou, com todas as letras, que bbox
não é interseção de polígono. Rodada a conta de verdade
(`calcular_alerta_ti_mancha.py`), eram falsos positivos: as 6 ficavam entre
450 m e 650 m da borda real da TI. Este script usa bbox SÓ como pré-filtro
O(1) pra não pagar `intersects()` em pares que nem chegam perto -- toda
decisão de "cruza ou não" é `shapely.intersects()`/`intersection()` sobre a
geometria completa dos dois lados, igual ao script de TI×mancha.

═══ TERRITÓRIOS DE ENTRADA ═══

`terras-indigenas.geojson` -- 16 TIs, MG inteira (fonte primária FUNAI).
`territorios-quilombolas.geojson` (2, bacia do Paraopeba) +
`territorios-quilombolas-vales.geojson` (12, Vales) -- 14 territórios;
**cobertura parcial**, ver docstring de
`calcular_alerta_quilombola_mancha.py` pra o motivo (não existe arquivo
estadual único de quilombola neste projeto ainda).

30 territórios no total (16 TI + 14 quilombola).

Uso:
    python scripts/calcular_alerta_territorio_mineracao.py
"""
from __future__ import annotations

import gzip
import json
import math
import sys
import time
from pathlib import Path

from shapely.geometry import mapping, shape
from shapely.validation import make_valid

LOG = "[calcular_alerta_territorio_mineracao]"

DIR_GLOBO = Path(__file__).resolve().parent.parent
DIR_CAMADAS = DIR_GLOBO / "dados" / "camadas"

TI_PATH = DIR_CAMADAS / "terras-indigenas.geojson"
QUILOMBOLA_PATHS = [
    DIR_CAMADAS / "territorios-quilombolas.geojson",
    DIR_CAMADAS / "territorios-quilombolas-vales.geojson",
]
SIGMINE_OPERACAO_PATH = DIR_CAMADAS / "sigmine-operacao.geojson"
SIGMINE_INTERESSE_GZ_PATH = DIR_CAMADAS / "sigmine-interesse.geojson.gz"
SIGMINE_INTERESSE_PATH = DIR_CAMADAS / "sigmine-interesse.geojson"  # se algum dia existir cru

TOLERANCIA_GRAUS = 0.0002


def _carregar_territorios() -> list[dict]:
    territorios = []
    with open(TI_PATH, encoding="utf-8") as f:
        d = json.load(f)
    for idx, feat in enumerate(d["features"]):
        feat = dict(feat)
        feat["_tipo_territorio"] = "terra_indigena"
        feat["_origem_arquivo"] = TI_PATH.name
        feat["_origem_indice"] = idx
        territorios.append(feat)

    for path in QUILOMBOLA_PATHS:
        if not path.exists():
            print(f"{LOG} AVISO: {path} não existe -- pulando.", file=sys.stderr)
            continue
        with open(path, encoding="utf-8") as f:
            d = json.load(f)
        for idx, feat in enumerate(d["features"]):
            feat = dict(feat)
            feat["_tipo_territorio"] = "quilombola"
            feat["_origem_arquivo"] = path.name
            feat["_origem_indice"] = idx
            territorios.append(feat)

    return territorios


def _carregar_sigmine(nome: str) -> list[dict]:
    """`nome` = 'operacao' ou 'interesse'. Lê o .geojson cru se existir,
    senão o .geojson.gz (mesmo padrão de leitura que
    scripts/comprimir-camadas-grandes.mjs usa para escrever)."""
    if nome == "operacao":
        path = SIGMINE_OPERACAO_PATH
        if not path.exists():
            raise FileNotFoundError(f"{path} não existe.")
        with open(path, encoding="utf-8") as f:
            return json.load(f)["features"]

    if SIGMINE_INTERESSE_PATH.exists():
        with open(SIGMINE_INTERESSE_PATH, encoding="utf-8") as f:
            return json.load(f)["features"]
    if SIGMINE_INTERESSE_GZ_PATH.exists():
        with gzip.open(SIGMINE_INTERESSE_GZ_PATH, "rt", encoding="utf-8") as f:
            return json.load(f)["features"]
    raise FileNotFoundError(
        f"nem {SIGMINE_INTERESSE_PATH} nem {SIGMINE_INTERESSE_GZ_PATH} existem."
    )


def _area_ha(poligono) -> float:
    lat_media = poligono.centroid.y
    m_por_grau_lat = 111_320.0
    m_por_grau_lon = 111_320.0 * math.cos(math.radians(lat_media))
    return poligono.area * m_por_grau_lat * m_por_grau_lon / 10_000


def _geom_valida(geo_interface: dict):
    g = shape(geo_interface)
    if not g.is_valid:
        g = make_valid(g)
    return g


def _identificar_territorio(t: dict) -> dict:
    props = t.get("properties") or {}
    if t["_tipo_territorio"] == "terra_indigena":
        return {
            "territorio_tipo": "terra_indigena",
            "territorio_nome": props.get("nome"),
            "territorio_etnia": props.get("etnia_nome"),
            "territorio_fase": props.get("fase_ti"),
            "territorio_municipio": props.get("municipio_nome"),
        }
    return {
        "territorio_tipo": "quilombola",
        "territorio_nome": None,  # fonte ingerida não carrega nome do território, ver docstring
        "territorio_etnia": None,
        "territorio_fase": None,
        "territorio_municipio": None,
        "territorio_arquivo_origem": t["_origem_arquivo"],
        "territorio_indice_origem": t["_origem_indice"],
    }


def _cruzar(territorios_prontos, sigmine_prontos, rotulo_fonte: str) -> list[dict]:
    achados = []
    t0 = time.time()
    total_pares = len(territorios_prontos) * len(sigmine_prontos)
    checados = 0
    for terr, g_terr, bx, meta in territorios_prontos:
        for props_s, g_s, bs in sigmine_prontos:
            checados += 1
            if bx[2] < bs[0] or bs[2] < bx[0] or bx[3] < bs[1] or bs[3] < bx[1]:
                continue
            if not g_terr.intersects(g_s):
                continue
            inter = g_terr.intersection(g_s)
            if inter.is_empty or inter.area == 0:
                continue
            inter_simpl = inter.simplify(TOLERANCIA_GRAUS, preserve_topology=True)
            if inter_simpl.is_empty:
                inter_simpl = inter
            achados.append({
                "type": "Feature",
                "properties": {
                    **meta,
                    "sigmine_fonte": rotulo_fonte,
                    "sigmine_processo": props_s.get("processo"),
                    "sigmine_nome": props_s.get("nome"),
                    "sigmine_subs": props_s.get("subs"),
                    "sigmine_fase": props_s.get("fase"),
                    "sigmine_uso": props_s.get("uso"),
                    "area_intersecao_ha": round(_area_ha(inter), 2),
                },
                "geometry": mapping(inter_simpl),
            })
            print(f"{LOG} ALERTA [{rotulo_fonte}]: {meta.get('territorio_nome') or meta.get('territorio_tipo')} "
                  f"× {props_s.get('nome')} ({props_s.get('fase')}, processo {props_s.get('processo')})")
    dt = time.time() - t0
    print(f"{LOG} [{rotulo_fonte}] {checados}/{total_pares} pares checados em {dt:.1f}s "
          f"-> {len(achados)} interseção(ões) real(is).")
    return achados


def _preparar(territorios_raw: list[dict]) -> list[tuple]:
    prontos = []
    for t in territorios_raw:
        geom = t.get("geometry")
        if geom is None:
            continue
        g = _geom_valida(geom)
        if g.is_empty:
            continue
        prontos.append((t, g, g.bounds, _identificar_territorio(t)))
    return prontos


def _preparar_sigmine(features: list[dict]) -> list[tuple]:
    prontos = []
    for f in features:
        props = f.get("properties") or {}
        geom = f.get("geometry")
        if geom is None:
            continue
        try:
            g = _geom_valida(geom)
        except Exception as e:  # noqa: BLE001
            print(f"{LOG} AVISO: polígono SIGMINE '{props.get('processo')}' inválido mesmo após reparo: {e}")
            continue
        if g.is_empty:
            continue
        prontos.append((props, g, g.bounds))
    return prontos


def _gravar(achados: list[dict], nome_camada: str, saida_path: Path) -> None:
    saida = {
        "type": "FeatureCollection",
        "name": nome_camada,
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features": achados,
    }
    with open(saida_path, "w", encoding="utf-8") as fh:
        json.dump(saida, fh, ensure_ascii=False, separators=(",", ": "))
    print(f"{LOG} gravado em {saida_path} ({saida_path.stat().st_size:,} bytes).")


def main() -> None:
    if not TI_PATH.exists():
        print(f"{LOG} ERRO: {TI_PATH} não existe.", file=sys.stderr)
        sys.exit(1)

    territorios_raw = _carregar_territorios()
    n_ti = sum(1 for t in territorios_raw if t["_tipo_territorio"] == "terra_indigena")
    n_quilombola = sum(1 for t in territorios_raw if t["_tipo_territorio"] == "quilombola")
    print(f"{LOG} {n_ti} terra(s) indígena(s) + {n_quilombola} território(s) quilombola(s) "
          f"= {len(territorios_raw)} território(s) de entrada.")
    territorios_prontos = _preparar(territorios_raw)

    # ─── Operação (fato consumado) ───
    print(f"{LOG} carregando sigmine-operacao...")
    sigmine_operacao = _preparar_sigmine(_carregar_sigmine("operacao"))
    print(f"{LOG} {len(sigmine_operacao)} polígono(s) de operação válidos.")
    achados_operacao = _cruzar(territorios_prontos, sigmine_operacao, "operacao")
    _gravar(achados_operacao, "alerta-territorio-sigmine-operacao",
            DIR_CAMADAS / "alerta-territorio-sigmine-operacao.geojson")

    # ─── Interesse (risco futuro) ───
    print(f"{LOG} carregando sigmine-interesse (pode levar um tempo -- 47 mil polígonos)...")
    sigmine_interesse = _preparar_sigmine(_carregar_sigmine("interesse"))
    print(f"{LOG} {len(sigmine_interesse)} polígono(s) de interesse válidos.")
    achados_interesse = _cruzar(territorios_prontos, sigmine_interesse, "interesse")
    _gravar(achados_interesse, "alerta-territorio-sigmine-interesse",
            DIR_CAMADAS / "alerta-territorio-sigmine-interesse.geojson")

    print(f"\n{LOG} RESUMO: operação={len(achados_operacao)} interseção(ões), "
          f"interesse={len(achados_interesse)} interseção(ões).")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # noqa: BLE001
        print(f"{LOG} ERRO: {e}", file=sys.stderr)
        raise
