"""fase3-mineracao-mg.py — Fase 3 do plano de cavas: série anual da mineração em MG.

## O que é

Coleta a camada `mining_age` do Monitor da Mineração (MapBiomas) no WFS público
e transforma em três saídas datadas:

1. `--coleta`   baixa ano/área/dentro_sigmine de MINAS GERAIS, página a página,
   em CSV (medido 28/09: CSV responde em 4,9 s contra 35,4 s do GeoJSON para as
   mesmas 2.500 feições — 7× mais rápido no mesmo servidor).
2. `--serie`    agrega área por ANO de primeira detecção e escreve
   `apps/web/data/cavas-serie-mineracao-mg.json` — é dele que sai o
   "Δ de área por ano" da Fase 3.
3. `--estados`  cruza uma amostra de cavas com os poligonais ANM
   (`pto:processos_minerarios`) e escreve os TRÊS estados editoriais do plano
   em `apps/web/data/cavas-estados-mg.json`.
4. `--camadas`    escreve as duas camadas GeoJSON do globo 3D (Fase 5):
   `mineracao-sem-cadastro` e `cavas-monitoradas`, em
   `public/terras/globo/dados/camadas/`.
5. `--verifica-area` confere a unidade do campo `area` projetando uma geometria
   real e comparando com a fórmula do pedágio/quebra (dupla verificação, AGENTS § 8).

## Por que esta fonte e não a janela Sentinel

A Fase 3 descreve o método A com janela Sentinel-2 (10 m) ano a ano. Medido em
28/09/2026 nesta máquina: a rede entregou ~5 KB/s e um pedido de 2 MB nem
terminou em 3 minutos, então baixar banda de satélite não é viável aqui agora.
O `mining_age` dá o mesmo "cava crescente" em **30 m** (Landsat, série
1985→2024), sem baixar imagem nenhuma: cada linha é um polígono com o ANO da
primeira detecção e a ÁREA dele. Área nova por ano = soma da área dos polígonos
daquele ano. A resolução (30 m) vai escrita na ficha, como manda o AGENTS § 8.

## O que NÃO sai daqui

- Δ por cava individual: exige a série de imagens (Sentinel 10 m). Bloqueado
  pela rede; fica registrado como pendência, nunca como número.
- `uf_id`/`municipio_id` do WFS vêm quebrados no servidor
  (`[Ljava.lang.Long;@...`) — medido 28/09. Filtro de UF é espacial (BBOX).

## Fonte e licença

- GeoServer WFS `plataforma.geoserver.mapbiomas.org/geoserver/pto/wfs`,
  camadas `pto:mining_age` e `pto:processos_minerarios`.
- Atribuição: "MapBiomas - Monitor da Mineração, acessado em [data]"; base
  ANM/SIGMINE. CC BY 4.0.
- Pausa de 1,5 s por página e User-Agent honesto (AGENTS § 11). Coleta fora da CI.

## Uso

    python scripts/etl/cavas/fase3-mineracao-mg.py --coleta
    python scripts/etl/cavas/fase3-mineracao-mg.py --serie
    python scripts/etl/cavas/fase3-mineracao-mg.py --estados --amostra 120
    python scripts/etl/cavas/fase3-mineracao-mg.py --verifica-area
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import math
import random
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

RAIZ = Path(__file__).resolve().parent.parent.parent.parent
CACHE = RAIZ / "scripts" / ".cache" / "fase3-mineracao"
DADOS = RAIZ / "apps" / "web" / "data"

WFS = "https://plataforma.geoserver.mapbiomas.org/geoserver/pto/wfs"
UA = "ControlePopular/1.0 (+controlepopular.com.br; transparencia)"
PAUSA = 1.5
TENTATIVAS = 5

# BBOX de MINAS GERAIS em ordem lat,lon (WFS 1.1.0) — medido em 25/09 e
# reproduz o filtro do coletor nacional de cavas.
MG_BBOX = (-23.0, -51.1, -14.0, -39.8)

# Fases em que a ANM autoriza extrair (mesma lista do coletor da Fase 1).
FASES_EXTRATIVAS = (
    "CONCESSÃO DE LAVRA",
    "LAVRA GARIMPEIRA",
    "REGISTO DE EXTRAÇÃO",
    "PERMISSÃO DE LAVRA GARIMPEIRA",
)

RESOLUCAO_M = 30  # MapBiomas/Landsat: 30 m por pixel (900 m²/px)
COLECAO_MAPBIOMAS = "MapBiomas Coleção 10"


# ------------------------------------------------------------------ http


def _get(params: dict, timeout: int = 120) -> bytes:
    """GET no WFS com UA honesto e até TENTATIVAS tentativas com espera crescente."""
    url = f"{WFS}?{urllib.parse.urlencode(params)}"
    espera = 3.0
    for tent in range(TENTATIVAS):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except Exception as e:  # rede fofa nesta máquina: tenta de novo
            if tent == TENTATIVAS - 1:
                raise
            print(f"    tentativa {tent + 1} falhou ({type(e).__name__}); "
                  f"espera {espera:.0f}s", flush=True)
            time.sleep(espera)
            espera *= 2
    raise AssertionError("inatingível")


def _wfs_params(**kw) -> dict:
    p = {"service": "WFS", "version": "1.1.0", "request": "GetFeature"}
    p.update({k: str(v) for k, v in kw.items()})
    return p


def _cql_bbox(bbox=MG_BBOX) -> str:
    """Filtro espacial na ordem lat,lon do WFS 1.1.0 (medido)."""
    return "BBOX(geom,%s)" % ",".join(str(v) for v in bbox)


def paginar_csv(cql: str, colunas: str, tipo: str, max_features: int = 2500):
    """Gerador de linhas CSV paginadas do WFS.

    Usa `startIndex` para avançar e `sortBy=id` para a ordem não mudar entre
    páginas (sem ordenação, o GeoServer pode repetir e pular feição).
    """
    start = 0
    while True:
        p = _wfs_params(
            outputFormat="csv", typeName=tipo, CQL_FILTER=cql,
            propertyName=colunas, maxFeatures=max_features,
            startIndex=start, sortBy="id",
        )
        raw = _get(p)
        texto = raw.decode("utf-8", errors="replace")
        linhas = list(csv.DictReader(io.StringIO(texto)))
        if not linhas:
            return
        yield from linhas
        if len(linhas) < max_features:
            return
        start += len(linhas)
        time.sleep(PAUSA)


def buscar_geojson(cql: str, colunas: str, tipo: str, max_features: int = 500,
                   start_index: int = 0) -> list[dict]:
    """Uma página GeoJSON (só para quando a geometria é necessária)."""
    p = _wfs_params(outputFormat="application/json", typeName=tipo,
                    CQL_FILTER=cql, propertyName=colunas,
                    maxFeatures=max_features, startIndex=start_index, sortBy="id")
    return json.loads(_get(p)).get("features", [])


# ------------------------------------------------------------------ coleta


def coleta(max_paginas: int | None = None) -> int:
    """Baixa `mining_age` de MG para o cache CSV, retomável página a página."""
    CACHE.mkdir(parents=True, exist_ok=True)
    saida = CACHE / "mining-age-mg.csv"
    colunas = "ano,area,dentro_sigmine,substance"

    feitas = 0
    if saida.exists():
        with saida.open(encoding="utf-8") as f:
            feitas = max(sum(1 for _ in f) - 1, 0)  # menos o cabeçalho
        print(f"  cache com {feitas} linhas", flush=True)

    cabecalho_escrito = saida.exists() and feitas > 0
    start = feitas
    print(f"  começando em startIndex={start}", flush=True)

    p = _wfs_params(outputFormat="csv", typeName="pto:mining_age",
                    CQL_FILTER=_cql_bbox(), propertyName=colunas,
                    maxFeatures=2500, startIndex=start, sortBy="id")
    pagina = 0
    while True:
        if max_paginas is not None and pagina >= max_paginas:
            break
        raw = _get(p)
        texto = raw.decode("utf-8", errors="replace")
        linhas = list(csv.reader(io.StringIO(texto)))
        if not linhas:
            break
        # a primeira linha da resposta é o cabeçalho; ela NÃO é dado
        tem_cabecalho = bool(linhas[0]) and linhas[0][0].strip().lower() == "fid"
        corpo = linhas[1:] if tem_cabecalho else linhas
        if not corpo:
            break
        with saida.open("a", encoding="utf-8", newline="") as f:
            w = csv.writer(f)
            if not cabecalho_escrito:
                w.writerow(linhas[0] if tem_cabecalho else ["FID", "ano", "area",
                                                            "dentro_sigmine",
                                                            "substance"])
                cabecalho_escrito = True
            w.writerows(corpo)
        pagina += 1
        start += len(corpo)
        print(f"  página {pagina}: +{len(corpo)} (total {start})", flush=True)
        if len(corpo) < 2500:
            break
        p["startIndex"] = str(start)
        time.sleep(PAUSA)

    total = sum(1 for _ in saida.open(encoding="utf-8")) - 1
    print(f"  cache final: {total} linhas em {saida}", flush=True)
    return 0


def ler_cache() -> list[dict]:
    saida = CACHE / "mining-age-mg.csv"
    if not saida.exists():
        return []
    with saida.open(encoding="utf-8") as f:
        return [r for r in csv.DictReader(f)]


# ------------------------------------------------------------------ série


def agregar_por_ano(linhas: list[dict]) -> dict[int, dict]:
    """Agrupa por ANO de primeira detecção: contagem, área e área fora do SIGMINE.

    `mining_age` tem UMA linha por polígono (medido 28/09: 300 feições num
    quadro de 0,2° com 300 geometrias distintas, nenhuma repetida). Então a soma
    da área daquele ano é a área de mineração que apareceu naquele ano.
    """
    out: dict[int, dict] = {}
    for r in linhas:
        try:
            ano = int(r["ano"])
            area = float(r["area"] or 0)
        except (KeyError, TypeError, ValueError):
            continue
        b = out.setdefault(ano, {"ano": ano, "qtd": 0, "area": 0.0,
                                 "area_fora_sigmine": 0.0, "qtd_fora": 0})
        b["qtd"] += 1
        b["area"] += area
        if (r.get("dentro_sigmine") or "").lower() == "false":
            b["area_fora_sigmine"] += area
            b["qtd_fora"] += 1
    return out


def montar_serie(agregado: dict[int, dict]) -> list[dict]:
    """Série anual ordenada, com acumulado e Δ de área daquele ano."""
    serie = []
    acumulado = 0.0
    anterior = None
    for ano in sorted(agregado):
        b = dict(agregado[ano])
        acumulado += b["area"]
        b["acumulado"] = acumulado
        # Δ = área nova daquele ano; e o crescimento sobre o ano anterior.
        b["delta_area"] = b["area"]
        b["delta_pct"] = (b["area"] / anterior * 100.0) if anterior else None
        anterior = b["area"]
        serie.append(b)
    return serie


def estado_serie(serie: list[dict], hoje: datetime, janela_meses: int = 24) -> dict:
    """Estado editorial da UF pela janela de 24 meses do plano.

    A série do MapBiomas termina no último ano com dado. Se o último ano com
    área nova está dentro da janela, a mineração da UF ainda se moveu → `ativa`;
    se parou há mais tempo mas cresceu em alguma parte da série → `estável`;
    se não há crescimento registrado → `encerrada`.
    """
    if not serie:
        return {"estado": "sem_dado", "ultimo_ano": None,
                "explicacao": "sem série coletada"}
    ultimo = serie[-1]["ano"]
    limite = hoje.year - math.ceil(janela_meses / 12)
    if ultimo >= limite:
        estado = "ativa"
    elif any(s["delta_area"] > 0 for s in serie):
        estado = "estavel"
    else:
        estado = "encerrada"
    return {
        "estado": estado,
        "ultimo_ano": ultimo,
        "janela_meses": janela_meses,
        "explicacao": (f"última detecção em {ultimo}; janela de {janela_meses} "
                       f"meses termina em {limite}"),
    }


def exportar_serie() -> int:
    linhas = ler_cache()
    if not linhas:
        print("  cache vazio — rode --coleta primeiro", flush=True)
        return 1
    agregado = agregar_por_ano(linhas)
    serie = montar_serie(agregado)
    total_area = sum(b["area"] for b in serie)
    fora = sum(b["area_fora_sigmine"] for b in serie)
    qtd = sum(b["qtd"] for b in serie)
    qtd_fora = sum(b["qtd_fora"] for b in serie)
    hoje = datetime.now(timezone.utc)
    doc = {
        "gerado_em": hoje.isoformat(timespec="seconds"),
        "plano": "docs/planos/PLANO-GLOBO-CAVAS-MINERACAO.md (Fase 3, método A)",
        "uf": "MG",
        "fonte": ("MapBiomas - Monitor da Mineração, acessado em "
                  + hoje.date().isoformat()),
        "fonte_url": "https://plataforma.monitormineracao.mapbiomas.org/",
        "camada": "pto:mining_age",
        "licenca": "CC BY 4.0 (MapBiomas; base ANM/SIGMINE)",
        "resolucao_m": RESOLUCAO_M,
        "area_unidade": "hectares (conferido 28/09 com shoelace projetado: razão "
                        "média 0,95 contra o campo da fonte)",
        "metodo": ("cada linha do mining_age é UM polígono com o ano da primeira "
                   "detecção e a área em hectares; área nova por ano = soma da "
                   "área dos polígonos daquele ano"),
        "resolucao_aviso": (f"{RESOLUCAO_M} m (Landsat) — cava pequena de "
                            f"{RESOLUCAO_M} m não aparece; ver ficha da cava"),
        "cobertura": {
            "poligonos": qtd,
            "area_total": round(total_area, 3),
            "poligonos_fora_sigmine": qtd_fora,
            "area_fora_sigmine": round(fora, 3),
        },
        "estado_uf": estado_serie(serie, hoje),
        "serie": serie,
        "ressalva": ("área de mineração mapeada, não atividade em curso; "
                     "dado de calibração interno até a barra de publicação da Fase 0"),
    }
    DADOS.mkdir(parents=True, exist_ok=True)
    out = DADOS / "cavas-serie-mineracao-mg.json"
    out.write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"  {out} | {len(serie)} anos | {qtd} polígonos | "
          f"{total_area:.1f} de área | estado {doc['estado_uf']['estado']}", flush=True)
    return 0


# ------------------------------------------------------------------ estados


def classificar_estado(dentro_sigmine: bool, fases: list[str]) -> tuple[str, str]:
    """Os TRÊS estados editoriais da Fase 3, por cava.

    1. dentro de polígono ANM cuja fase autoriza extrair → "em_operacao";
    2. dentro de polígono ANM sem autorização de extração → "indicio_processual";
    3. fora de todo polígono ANM → "sem_cadastro_anm".
    """
    if not dentro_sigmine:
        return "sem_cadastro_anm", ("fora de todo polígono ANM — o mapa enxerga "
                                    "mineração onde a ANM não tem cadastro")
    if any((f or "").strip().upper() in FASES_EXTRATIVAS for f in fases):
        return "em_operacao", ("dentro de polígono ANM em fase que autoriza "
                               "extrair na data da coleta")
    return "indicio_processual", ("dentro de polígono ANM sem autorização de "
                                  "extração — conferir na ANM")


def _bbox_de_geom(geom: dict, margem_m: float = 80.0) -> list[float] | None:
    """bbox [minlon,minlat,maxlon,maxlat] com o buffer de 80 m do critério do
    MapBiomas (o arredondamento de polígono não vira transbordo)."""
    if not geom:
        return None
    pts = []
    if geom.get("type") == "Polygon":
        pts = geom["coordinates"][0]
    elif geom.get("type") == "MultiPolygon" and geom["coordinates"]:
        pts = geom["coordinates"][0][0]
    if not pts:
        return None
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    cy = (min(ys) + max(ys)) / 2
    dlat = margem_m / 111320.0
    dlon = margem_m / (111320.0 * math.cos(math.radians(cy)))
    return [min(xs) - dlon, min(ys) - dlat, max(xs) + dlon, max(ys) + dlat]


def _bbox_cql(bbox: list[float]) -> str:
    # ordem lat,lon do WFS 1.1.0
    minlon, minlat, maxlon, maxlat = bbox
    return "BBOX(geom,%s)" % ",".join(str(v) for v in (minlat, minlon, maxlat, maxlon))


def _num_id(valor: str | int | None) -> int:
    """`id` chega como `mining_age.642279` (nome da feição). O CQL `id IN (...)`
    quer o número. Medido 29/09: sem isto o cruzamento trava no .split."""
    s = str(valor or "")
    d = s.rsplit(".", 1)[-1]
    return int(d) if d.isdigit() else 0


def estados(amostra: int, semente: int = 42) -> int:
    """Cruza uma amostra de cavas com os poligonais ANM e escreve os 3 estados.

    Amostra por semente fixa: repetir o comando reproduz a mesma lista, que é o
    que permite conferir à mão depois (Copernicus Browser, Fase 3).
    """
    linhas = ler_cache()
    if not linhas:
        print("  cache vazio — rode --coleta primeiro", flush=True)
        return 1
    rng = random.Random(semente)
    escolhidas = rng.sample(linhas, min(amostra, len(linhas)))
    # ordena por id para a coleta sair agrupada e a ordem do arquivo ser estável
    escolhidas.sort(key=lambda r: _num_id(r.get("FID") or r.get("id")))

    print(f"  geometrias de {len(escolhidas)} cavas...", flush=True)
    geoms: dict[str, int] = {}
    por_id = [_num_id(r.get("FID") or r.get("id")) for r in escolhidas]
    por_id = [v for v in por_id if v]
    for i in range(0, len(por_id), 50):
        lote = por_id[i:i + 50]
        cql = "id IN (%s)" % ",".join(str(v) for v in lote)
        for f in buscar_geojson(cql, "ano,area,dentro_sigmine,geom", "pto:mining_age"):
            geoms[str(_num_id(f.get("id")))] = f
        print(f"    {len(geoms)}/{len(por_id)} geometrias", flush=True)
        time.sleep(PAUSA)

    itens = []
    estados_cont: dict[str, int] = {"em_operacao": 0, "indicio_processual": 0,
                                    "sem_cadastro_anm": 0}
    for r in escolhidas:
        chave = _num_id(r.get("FID") or r.get("id"))
        f = geoms.get(str(chave))
        if not f:
            continue
        bbox = _bbox_de_geom(f.get("geometry") or {})
        dentro = (r.get("dentro_sigmine") or "").lower() == "true"
        fases: list[str] = []
        processos: list[str] = []
        if bbox:
            cql = _bbox_cql(bbox)
            for p in buscar_geojson(cql, "processo,fase", "pto:processos_minerarios", 50):
                pr = p.get("properties") or {}
                if pr.get("fase"):
                    fases.append(pr["fase"])
                if pr.get("processo"):
                    processos.append(pr["processo"])
            time.sleep(PAUSA)
        estado, frase = classificar_estado(dentro, fases)
        estados_cont[estado] += 1
        itens.append({
            "id": chave,
            "ano_primeira_deteccao": r.get("ano"),
            "area": r.get("area"),
            "dentro_sigmine": dentro,
            "estado": estado,
            "frase": frase,
            "fases": sorted(set(fases)),
            "processos": sorted(set(processos))[:5],
            "bbox": bbox,
        })

    hoje = datetime.now(timezone.utc)
    doc = {
        "gerado_em": hoje.isoformat(timespec="seconds"),
        "plano": "docs/planos/PLANO-GLOBO-CAVAS-MINERACAO.md (Fase 3, cruzamento ANM)",
        "uf": "MG",
        "amostra": len(itens),
        "semente": semente,
        "fonte": ("MapBiomas - Monitor da Mineração e ANM/SIGMINE, acessados em "
                  + hoje.date().isoformat()),
        "fonte_url": "https://plataforma.monitormineracao.mapbiomas.org/",
        "licenca": "CC BY 4.0",
        "buffer_m": 80,
        "resolucao_m": RESOLUCAO_M,
        "resumo": estados_cont,
        "itens": itens,
        "ressalva": ("amostra datada, não total de MG; positivo = área mapeada, "
                     "não atividade em curso"),
    }
    DADOS.mkdir(parents=True, exist_ok=True)
    out = DADOS / "cavas-estados-mg.json"
    out.write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"  {out} | amostra {len(itens)} | {estados_cont}", flush=True)
    return 0


# ------------------------------------------------------------------ camadas do globo

CAMADAS_GLOBO = RAIZ / "apps" / "web" / "public" / "terras" / "globo" / "dados" / "camadas"

# As duas camadas da Fase 5, ambas do MESMO recorte de MG e da MESMA fonte —
# só muda o filtro. `ano>=2024` é o critério de "ativa" da Fase 3 com a data
# de publicação de 2026 (24 meses → limite 2024).
#   id do arquivo                       | CQL                        | estado
CAMADAS_ALVO: list[tuple[str, str, str]] = [
    ("mineracao-sem-cadastro", "dentro_sigmine=false", "sem_cadastro_anm"),
    ("cavas-monitoradas", "ano>=2024", "ativa"),
]
# 5 casas decimais ≈ 1,1 m: a fonte é um raster de 30 m, então arredondar aqui
# não muda o desenho e derruba uns 25% do tamanho do arquivo.
PRECISAO = 5


def _arredondar(c):
    """Arredonda coordenada recursivamente (número → número, lista → lista)."""
    if isinstance(c, (int, float)):
        return round(c, PRECISAO)
    if isinstance(c, list):
        return [_arredondar(x) for x in c]
    return c


def camadas_globo(max_features: int = 500) -> int:
    """Escreve as duas camadas GeoJSON do globo, paginadas por GeoJSON.

    GeoJSON puro aqui (não CSV) porque a geometria é o que interessa; a
    paginação é por `startIndex`, o mesmo eixo do CSV.
    """
    CAMADAS_GLOBO.mkdir(parents=True, exist_ok=True)
    for nome, filtro, estado in CAMADAS_ALVO:
        cql = f"({filtro}) AND {_cql_bbox()}"
        feicoes: list[dict] = []
        start = 0
        while True:
            fs = buscar_geojson(cql, "ano,area,dentro_sigmine,geom",
                                "pto:mining_age", max_features, start)
            if not fs:
                break
            for f in fs:
                g = f.get("geometry") or {}
                props = f.get("properties") or {}
                # GeoServer devolve boolean como JSON `true` OU como string
                # "true" — normaliza nos dois caminhos, senão o estado sai errado.
                ds = props.get("dentro_sigmine")
                if isinstance(ds, str):
                    dentro = ds.lower() == "true"
                else:
                    dentro = bool(ds)
                feicoes.append({
                    "type": "Feature",
                    "id": f.get("id"),
                    "properties": {
                        "id": str(f.get("id")),
                        "ano": props.get("ano"),
                        "area_ha": round(float(props.get("area") or 0), 3),
                        "estado": estado,
                        "dentro_sigmine": dentro,
                        "resolucao_m": RESOLUCAO_M,
                    },
                    "geometry": {
                        "type": g.get("type"),
                        "coordinates": _arredondar(g.get("coordinates")),
                    } if g else None,
                })
            print(f"  {nome}: +{len(fs)} (total {len(feicoes)})", flush=True)
            if len(fs) < max_features:
                break
            start += len(fs)
            time.sleep(PAUSA)
        saida = CAMADAS_GLOBO / f"{nome}.geojson"
        doc = {"type": "FeatureCollection", "features": feicoes}
        saida.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")),
                         encoding="utf-8")
        kb = saida.stat().st_size / 1024
        print(f"  → {saida.name}: {len(feicoes)} feições, {kb:.0f} KB", flush=True)
        time.sleep(PAUSA)
    return 0




def _aneis(geom: dict) -> list[list]:
    """Todos os anéis externos da geometria (Polygon ou MultiPolygon)."""
    if not geom:
        return []
    if geom.get("type") == "Polygon":
        return [geom["coordinates"][0]] if geom.get("coordinates") else []
    if geom.get("type") == "MultiPolygon":
        return [p[0] for p in geom.get("coordinates") or [] if p]
    return []


def verifica_area() -> int:
    """Confere a unidade do campo `area`: projeta a geometria e mede por
    translate (shoelace) em metros, comparando com o valor da fonte.

    Medido em 28/09: sem esta conferência o número sai sem unidade, e número
    sem método não vai na tela (AGENTS § 8, regra 4).
    """
    from rasterio.warp import transform

    feats = buscar_geojson(_cql_bbox(), "ano,area,geom", "pto:mining_age", 6)
    if not feats:
        print("  nenhuma geometria de teste", flush=True)
        return 1
    razoes = []
    for f in feats[:5]:
        area_fonte = float(f["properties"].get("area") or 0)
        aneis = _aneis(f.get("geometry") or {})
        if not aneis:
            continue
        todos = [p for anel in aneis for p in anel]
        xs = [p[0] for p in todos]
        ys = [p[1] for p in todos]
        cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
        # UTM da região: zona 21/22/23S de SIRGAS 2000 cobre MG; para a
        # amostra basta a zona do centroide — erro pequeno, é conferência.
        zona = int((cx + 180) // 6) + 1
        epsg = 31960 + zona  # 31981/31982/31983 = SIRGAS 2000 UTM 21S/22S/23S
        area_m2 = 0.0
        for anel in aneis:
            lons = [p[0] for p in anel]
            lats = [p[1] for p in anel]
            xs_m, ys_m = transform("EPSG:4326", f"EPSG:{epsg}", lons, lats)
            a = 0.0
            for i in range(len(xs_m) - 1):
                a += xs_m[i] * ys_m[i + 1] - xs_m[i + 1] * ys_m[i]
            area_m2 += abs(a) / 2
        ha_calc = area_m2 / 1e4
        razao = area_fonte / ha_calc if ha_calc else float("nan")
        razoes.append(razao)
        print(f"  id={f['id']} fonte={area_fonte:.4f} | shoelace={ha_calc:.4f} ha "
              f"({area_m2 / 1e6:.4f} km²) | razão fonte/ha={razao:.3f}", flush=True)
        time.sleep(PAUSA)
    limpas = [r for r in razoes if r == r and 0.5 < r < 2.0]
    media = sum(limpas) / len(limpas) if limpas else float("nan")
    print(f"  razão perto de 1,000 => `area` está em HECTARES "
          f"(média {media:.3f} em {len(limpas)}/{len(razoes)} sem outlier).",
          flush=True)
    return 0


# ------------------------------------------------------------------ main


def principal() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--coleta", action="store_true")
    ap.add_argument("--serie", action="store_true")
    ap.add_argument("--estados", action="store_true")
    ap.add_argument("--camadas", action="store_true")
    ap.add_argument("--verifica-area", action="store_true")
    ap.add_argument("--max-paginas", type=int, default=None)
    ap.add_argument("--amostra", type=int, default=120)
    args = ap.parse_args()

    if not any([args.coleta, args.serie, args.estados, args.camadas,
                args.verifica_area]):
        ap.error("escolha --coleta, --serie, --estados, --camadas ou --verifica-area")

    if args.verifica_area:
        return verifica_area()
    if args.coleta:
        return coleta(args.max_paginas)
    if args.serie:
        return exportar_serie()
    if args.estados:
        return estados(args.amostra)
    if args.camadas:
        return camadas_globo()
    return 0


if __name__ == "__main__":
    raise SystemExit(principal())
