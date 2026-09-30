#!/usr/bin/env python3
"""
gerar-evidencias-mg.py — Fase A do mapeamento da mineracao ilegal: gera o
arquivo de evidencias de MG (uma linha por poligono de mineracao detectada).

O que este modulo faz, e por que existe:
  - Le as camadas ja versionadas no globo (Monitor da Mineracao/MapBiomas
    cruzado com a poligonal ANM/SIGMINE) e cruza cada poligono de mineracao
    com as camadas de protecao (terra indigena/FUNAI, unidade de conservacao/
    CNUC, territorio quilombola/INCRA) e com o embargo do IBAMA.
  - Escreve apps/web/data/cavas-evidencias-mg.json, que alimenta a futura
    pagina /mineracao/ilegal e as camadas do globo (Fases C e D do plano).

Fonte oficial dos dados e regras de negocio:
  - Mineracao e poligonal ANM: MapBiomas Monitor da Mineracao (CC BY 4.0) e
    ANM/SIGMINE (dados abertos.anm.gov.br) - camadas do globo.
  - Terras indigenas: FUNAI (WFS geoserver.funai.gov.br); unidades de
    conservacao: CNUC/ICMBio; territorios quilombolas: INCRA (Acervo
    Fundiario, licenca "vedado uso comercial" - por isso aqui so entra o
    cruzamento booleano, nunca a geometria nem a ficha do territorio).
  - Embargo do IBAMA: ArcGIS REST da Pamgia
    (.../adm_embargos_ibama_a/MapServer/0), filtro uf='MG' e termo de
    mineracao no texto do termo/infracao. robots.txt do host devolve 404
    (sem declaracao); UA honesto e pausa >= 2 s entre chamadas.
    ⚠️ Os campos nome_embargado e cpf_cnpj_embargado NUNCA entram no
    outFields (dado pessoal, AGENTS 5.2/5.8).

Decisoes tecnicas e restricoes nao triviais:
  - Sem shapely nesta maquina: o teste e ray casting puro em Python
    (ponto-dentro-de-poligono) sobre o CENTROIDE do poligono de mineracao.
    Consequencia declarada: o numero e um PISO, nao um total (poligono que
    encosta mas cujo centroide cai fora nao conta). O metodo viaja no JSON.
  - Embaro do IBAMA e poligono: o teste e centroide-dentro-de-embargo, e
    so conta embargo cujo texto traz termo de mineracao (a definicao do
    estado com_embargo_ibama no plano).
  - "Uma linha por poligono" mantem a coluna `camada`: as duas camadas de
    mineracao compartilham 193 ids, e somar as contagens sem a etiqueta
    seria enganoso (AGENTS 7 / plano: nunca somar bases diferentes).
  - O cache dos embargos baixados fica em scripts/.cache (fora do git);
    o dado publicado e o cruzamento, nao a copia bruta.

Uso:
  python scripts/etl/cavas/gerar-evidencias-mg.py            # usa cache se existir
  python scripts/etl/cavas/gerar-evidencias-mg.py --rebaixar # forca nova coleta
"""
from __future__ import annotations

import json
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # console Windows cp1252

REPO = Path(__file__).resolve().parents[3]
CAM = REPO / "apps" / "web" / "public" / "terras" / "globo" / "dados" / "camadas"
DATA = REPO / "apps" / "web" / "data"
CACHE = REPO / "scripts" / ".cache" / "cavas-evidencias"

UA = "ControlePopular/1.0 (+controlepopular.com.br; transparencia)"
PAUSA_S = 2.0  # pausa entre requisicoes ao mesmo host (AGENTS 11)

# Camada de embargos do IBAMA (Pamgia) e o filtro de mineracao no texto.
URL_EMBARGOS = (
    "https://pamgia.ibama.gov.br/server/rest/services/01_Publicacoes_Bases/"
    "adm_embargos_ibama_a/MapServer/0/query"
)
CAMPOS_EMBARGO = "uf,municipio,des_tad,des_infracao,dat_embargo,num_processo,qtd_area_embargada"
FILTRO_EMBARGO_MINERACAO = (
    "(UPPER(des_tad) LIKE '%MINERA%' OR UPPER(des_tad) LIKE '%GARIMP%' "
    "OR UPPER(des_tad) LIKE '%LAVRA%' OR UPPER(des_tad) LIKE '%CAVA%' "
    "OR UPPER(des_infracao) LIKE '%MINERA%' OR UPPER(des_infracao) LIKE '%GARIMP%' "
    "OR UPPER(des_infracao) LIKE '%LAVRA%')"
)
PADRAO_MINERACAO = re.compile(r"minera|garimp|lavra|cava|extra", re.I)


# ------------------------------------------------------------------ geometria
def carregar(nome: Path):
    """Le um JSON do repositorio em UTF-8."""
    with open(nome, encoding="utf-8") as f:
        return json.load(f)


def anel_principal(geom: dict):
    """Devolve o primeiro anel (exterior) de Polygon/MultiPolygon."""
    t = geom["type"]
    coords = geom["coordinates"]
    if t == "Polygon":
        return coords[0]
    if t == "MultiPolygon":
        return coords[0][0]
    return None


def centroide(geom: dict):
    """Centroide aproximado: media dos vertices do anel principal."""
    anel = anel_principal(geom)
    if not anel:
        return None
    xs = [p[0] for p in anel]
    ys = [p[1] for p in anel]
    return (sum(xs) / len(xs), sum(ys) / len(ys))


def dentro(pt, anel) -> bool:
    """Ray casting: True se o ponto esta dentro do anel fechado."""
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


def indexar_poligonos(features) -> list:
    """Indice de (bbox, anel) para pre-filtro rapido antes do ray casting."""
    idx = []
    for ft in features:
        geom = ft.get("geometry")
        if not geom:
            continue
        anel = anel_principal(geom)
        if anel:
            idx.append((bbox(anel), anel))
    return idx


def cai_dentro(pt, idx) -> bool:
    """True se o ponto cai dentro de algum poligono do indice."""
    px, py = pt
    for item in idx:
        (x0, y0, x1, y1), anel = item[0], item[1]
        if x0 <= px <= x1 and y0 <= py <= y1 and dentro(pt, anel):
            return True
    return False


def achar_contendo(pt, idx):
    """Devolve o indice (posicional) do poligono que contem o ponto, ou None."""
    px, py = pt
    for pos, item in enumerate(idx):
        (x0, y0, x1, y1), anel = item[0], item[1]
        if x0 <= px <= x1 and y0 <= py <= y1 and dentro(pt, anel):
            return pos
    return None


# ------------------------------------------------------------------ embargos
def baixar_embargos_mg() -> dict:
    """Baixa os embargos do IBAMA de MG com termo de mineracao (sem dado pessoal).

    Paginacao por resultOffset/resultRecordCount (lote 2000). O retorno e um
    FeatureCollection simples {"features": [...]} salvo no cache do repositorio.
    """
    feats: list = []
    campos = CAMPOS_EMBARGO
    where = f"uf='MG' AND {FILTRO_EMBARGO_MINERACAO}"
    offset = 0
    lote = 2000
    while True:
        params = {
            "where": where,
            "outFields": campos,
            "returnGeometry": "true",
            "outSR": "4326",
            "resultOffset": str(offset),
            "resultRecordCount": str(lote),
            "f": "json",
        }
        url = URL_EMBARGOS + "?" + urllib.parse.urlencode(params)
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=90) as resp:
            corpo = json.loads(resp.read().decode("utf-8"))
        if "error" in corpo:
            raise RuntimeError(f"ArcGIS devolveu erro: {corpo['error']}")
        lote_feats = corpo.get("features", [])
        feats.extend(lote_feats)
        print(f"  embargos: {len(feats)} baixados", flush=True)
        if len(lote_feats) < lote:
            break
        offset += lote
        time.sleep(PAUSA_S)
    return {
        "fonte": "IBAMA - ArcGIS Pamgia, adm_embargos_ibama_a, uf=MG com termo de mineracao",
        "fonte_url": URL_EMBARGOS,
        "coletado_em": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "where": where,
        "features": feats,
    }


def anel_do_esri(geom: dict, sr: int = 4326):
    """Converte um anel esriGeometryPolygon em lista [x, y] (lon, lat).

    O ArcGIS devolve os aneis em ordem de envelope (hora, anti-horaria).
    """
    rings = geom.get("rings") or []
    if not rings:
        return None
    return [[float(p[0]), float(p[1])] for p in rings[0]]


def indexar_embargos(emb: dict) -> list:
    """Indice (bbox, anel, props) dos embargos baixados."""
    idx = []
    for ft in emb.get("features", []):
        geom = ft.get("geometry") or {}
        anel = anel_do_esri(geom)
        if anel:
            idx.append((bbox(anel), anel, ft.get("attributes", {})))
    return idx


# ------------------------------------------------------------------ principal
def gerar(rebaixar: bool = False) -> int:
    """Gera apps/web/data/cavas-evidencias-mg.json e imprime o resumo."""
    CACHE.mkdir(parents=True, exist_ok=True)
    arq_cache = CACHE / "embargos-ibama-mg-mineracao.json"

    if rebaixar or not arq_cache.exists():
        print("baixando embargos do IBAMA (MG, termo de mineracao)...", flush=True)
        emb = baixar_embargos_mg()
        arq_cache.write_text(json.dumps(emb, ensure_ascii=False), encoding="utf-8")
    else:
        emb = carregar(arq_cache)
        print(f"embargos do cache: {arq_cache.name} ({len(emb.get('features', []))} feicoes)")

    idx_emb = indexar_embargos(emb)
    print(f"embargos indexados: {len(idx_emb)}")

    prot = {}
    for chave, arq in (
        ("em_unidade_conservacao", "unidades-conservacao.geojson"),
        ("em_terra_indigena", "terras-indigenas.geojson"),
        ("em_territorio_quilombola", "territorios-quilombolas.geojson"),
    ):
        feats = carregar(CAM / arq)["features"]
        prot[chave] = indexar_poligonos(feats)
        print(f"camada {chave}: {len(feats)} poligonos")

    idx_mun = []
    for ft in carregar(CAM / "municipios-mg.geojson")["features"]:
        geom = ft.get("geometry")
        if not geom:
            continue
        anel = anel_principal(geom)
        if anel:
            idx_mun.append((bbox(anel), anel, ft["properties"].get("nome")))

    itens = []
    resumo = {}
    for arq in ("mineracao-sem-cadastro.geojson", "cavas-monitoradas.geojson"):
        camada = arq.replace(".geojson", "")
        feats = carregar(CAM / arq)["features"]
        cont = {"total": 0, "em_unidade_conservacao": 0, "em_terra_indigena": 0,
                "em_territorio_quilombola": 0, "com_embargo_ibama": 0}
        for ft in feats:
            geom = ft.get("geometry")
            if not geom:
                continue
            c = centroide(geom)
            if not c:
                continue
            props = ft.get("properties", {})
            linha = {
                "id": props.get("id"),
                "camada": camada,
                "ano": props.get("ano"),
                "area_ha": props.get("area_ha"),
                "municipio": None,
                "estados": {
                    "sem_cadastro_anm": camada == "mineracao-sem-cadastro",
                    "em_unidade_conservacao": cai_dentro(c, prot["em_unidade_conservacao"]),
                    "em_terra_indigena": cai_dentro(c, prot["em_terra_indigena"]),
                    "em_territorio_quilombola": cai_dentro(c, prot["em_territorio_quilombola"]),
                    "com_embargo_ibama": achar_contendo(c, idx_emb) is not None,
                },
            }
            pos_mun = achar_contendo(c, idx_mun)
            if pos_mun is not None:
                linha["municipio"] = idx_mun[pos_mun][2]
            itens.append(linha)
            cont["total"] += 1
            for k in ("em_unidade_conservacao", "em_terra_indigena",
                      "em_territorio_quilombola", "com_embargo_ibama"):
                if linha["estados"][k]:
                    cont[k] += 1
            if linha["municipio"]:
                cont.setdefault("com_municipio", 0)
                cont["com_municipio"] += 1
        resumo[camada] = cont
        print(f"  {camada}: {cont['total']} itens | UC {cont['em_unidade_conservacao']} "
              f"TI {cont['em_terra_indigena']} QUIL {cont['em_territorio_quilombola']} "
              f"EMBARGO {cont['com_embargo_ibama']}", flush=True)

    doc = {
        "gerado_em": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "uf": "MG",
        "metodo": (
            "centroide do poligono de mineracao testado por ray casting (sem shapely) "
            "contra UC/TI/quilombo/embargo; municipio pelo mesmo teste. E PISO, NAO TOTAL: "
            "poligono que encosta mas cujo centroide cai fora nao conta."
        ),
        "fontes": {
            "mineracao": "MapBiomas Monitor da Mineracao (CC BY 4.0) + ANM/SIGMINE, camadas do globo",
            "unidades_conservacao": "CNUC/ICMBio",
            "terras_indigenas": "FUNAI (WFS)",
            "territorios_quilombolas": "INCRA (Acervo Fundiario; licenca vedado uso comercial - so cruzamento booleano)",
            "embargos": emb.get("fonte"),
            "embargos_coletado_em": emb.get("coletado_em"),
        },
        "ressalva": "Receber sinal nao e ilicito. A evidencia e convite para conferir na fonte; a apuracao e da autoridade.",
        "resumo": resumo,
        "embargos_ibama": {
            "mg_total": 4692,
            "filtro": emb.get("where"),
            "baixados": len(emb.get("features", [])),
            "com_geometria": len(idx_emb),
            "nota": (
                "Filtro mais largo que o da FONTES (inclui LAVRA e CAVA no texto), "
                "por isso o numero difere do 78 publicado la. Estado de embargo por "
                "poligono de mineracao e PISO: o ArcGIS devolveu geometria para apenas "
                "parte dos embargos; sem geometria nao ha teste de centroide possivel."
            ),
        },
        "itens": itens,
    }
    DATA.mkdir(parents=True, exist_ok=True)
    saida = DATA / "cavas-evidencias-mg.json"
    saida.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"escrito: {saida} | {len(itens)} linhas | {saida.stat().st_size} bytes")
    return 0


if __name__ == "__main__":
    sys.exit(gerar(rebaixar="--rebaixar" in sys.argv))
