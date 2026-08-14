#!/usr/bin/env python3
r"""ingerir_feam_zas_mancha.py — baixa a ZAS e a mancha de inundação das 156
barragens de MG que a FEAM publica com geometria, e grava versões enxutas em
dados/camadas/.

POR QUE ESTE SCRIPT EXISTE (docs/FONTES-TERRITORIO-E-MINERACAO.md, seção 3).

O plano original pedia um raio de 8 km (ou "raio de ZAS") em volta de cada
barragem. Isso mistura dois institutos jurídicos diferentes — ver a seção 4 do
documento. A Zona de Autossalvamento (ZAS) de verdade NÃO é um círculo: é "o
trecho do vale à jusante da barragem" (Res. ANM 95/2022, art. 2º, LI), e a FEAM
publica essa geometria, junto com a mancha de inundação (a envoltória máxima do
Estudo de Ruptura Hipotética de Barragem). Desenhar um círculo quando a
geometria real e oficial está disponível seria pior do que não desenhar nada:
incluiria morro acima onde não há risco e excluiria vale abaixo dos 10 km onde
a onda de fato chega — o documento mede isso em até 127× de superestimação de
área E erro de direção.

═══ A ARMADILHA QUE JUSTIFICA ESTE SCRIPT NÃO SER "BAIXA E SALVA" ═══

O GeoJSON completo da ZAS (156 feições) pesa **418 MB**; o da mancha de
inundação, **598 MB** — medido agora, bate com o que o documento já registrava.
A causa: cada feição é um MultiPolygon de dezenas de partes desconexas (medido
na Barragem Dique S3: 28 partes, 7.331 vértices), porque a geometria vem de uma
malha de simulação hidráulica, não de um desenho cartográfico. Publicar isso
cru no globo (Three.js, WebGL) travaria qualquer navegador.

Este script SIMPLIFICA cada polígono com Douglas-Peucker preservando topologia
(`shapely.simplify(TOLERANCIA_GRAUS, preserve_topology=True)`). A tolerância
(0,0002°, ~22 m nesta latitude) foi escolhida medindo as 156 feições reais —
ver a tabela de tolerância × erro de área no comentário de `TOLERANCIA_GRAUS`
abaixo. Reduz para ~2,8% dos vértices originais (15 milhões -> ~420 mil na
ZAS) mantendo o erro de área abaixo de 6% na pior feição. A forma resultante
continua reconhecível como o vale que a lâmina d'água segue — só sem o excesso
de vértices que o modelo hidráulico de origem produz e que ninguém lê num
globo em WebGL.

⚠️ A simplificação NÃO é aplicada ao cálculo de interseção (ver
calcular_alerta_ti_mancha.py) — aquele script baixa a geometria de novo e usa a
malha completa, porque um alerta jurídico não pode depender de uma forma
desenhada para caber na tela.

═══ ENCODING ═══

Ao contrário do WFS da FUNAI (que MENTE no charset e manda Latin-1 dentro de um
header que diz UTF-8 — ver ingerir_funai_terras_indigenas.py), o geoserver da
FEAM está correto: `Content-Type: application/json;charset=UTF-8` e os bytes
batem. Decodificado como UTF-8 direto, sem gambiarra.

═══ STREAMING, NÃO CARGA INTEIRA NA MEMÓRIA ═══

418 MB + 598 MB de texto JSON, carregados inteiros como objeto Python, passam
fácil de alguns GB — arriscado numa máquina com poucos GB livres. Este script
usa `ijson` (parser C incremental) para processar UMA feição por vez: baixa
para um arquivo temporário, e então itera com `ijson.items(f, 'features.item')`
sem nunca ter a FeatureCollection inteira na RAM.

Uso:
    python scripts/ingerir_feam_zas_mancha.py
"""
from __future__ import annotations

import json
import sys
import time
import urllib.request
from pathlib import Path

import ijson
from shapely.geometry import mapping, shape

LOG = "[ingerir_feam_zas_mancha]"

BASE_URL = "https://geoserver.meioambiente.mg.gov.br/IDE/ows"
UA = "Mozilla/5.0 (compatible; ControlePopular/1.0; +https://github.com/FinweeJur/controle-popular)"

# Douglas-Peucker em graus. Medido em 13/08/2026 nas 156 feições da ZAS
# (script scripts/.tmp-ingest, não versionado) antes de fixar este valor:
#
#   tolerância   vértices finais   erro médio de área   erro MÁXIMO de área
#   0,00005°        1.517.723            0,13%                 1,10%
#   0,00020°          419.968            0,77%                 6,01%   <- escolhido
#   0,00050°          284.672            3,43%                23,46%
#   0,00100°          243.362            9,67%                63,99%
#
# 0,00020° (~22 m nesta latitude) foi o ponto de corte: reduz para ~2,8% dos
# vértices originais (15,05 milhões -> ~420 mil na ZAS) mantendo o erro de área
# de cada feição individual abaixo de 6% no pior caso. Acima disso (0,0005°) o
# erro máximo passa de 20% — demais para uma camada de segurança, mesmo sendo
# só a camada VISUAL (ver nota grande abaixo: o cálculo de interseção usa a
# malha completa, não esta versão simplificada).
TOLERANCIA_GRAUS = 0.0002

DIR_CAMADAS = Path(__file__).resolve().parent.parent / "dados" / "camadas"
# ⚠️ O CACHE DE DOWNLOAD FICA FORA DE `public/`, E ISSO NÃO É ORGANIZAÇÃO.
# Ele já ficou em `public/terras/globo/scripts/.tmp-ingest/` e, em 13/08/2026,
# um `mancha.json` de 570 MiB sobrou ali e foi COPIADO PARA O BUNDLE pelo
# build — `public/` inteiro vira Static Assets. O teto do Cloudflare é 25 MiB
# POR ARQUIVO, então o deploy morreria naquele arquivo.
#
# O `.gitignore` não protegia de nada aqui: o arquivo nunca foi commitado, e
# mesmo assim entrou no build, porque quem copia é o Next e não o git. Modo
# de falha silencioso — ninguém vê até o upload falhar.
#
# `apps/web/.tmp-ingest/` está fora de `public/`, então o build não o enxerga.
DIR_TMP = Path(__file__).resolve().parents[4] / ".tmp-ingest"

CAMPOS_UTEIS = ("id", "id_sigibar", "estrutura", "empreended", "municipio", "status_pae", "status_erh")

ALVOS = [
    {
        "typename": "IDE:ide_1903_mg_zas_pae_pol",
        "saida": "zas-barragens.geojson",
        "nome_curto": "zas",
    },
    {
        "typename": "IDE:ide_1903_mg_mancha_inundacao_pae_pol",
        "saida": "mancha-inundacao-barragens.geojson",
        "nome_curto": "mancha",
    },
]


def _baixar_para_arquivo(typename: str, destino: Path) -> None:
    """Baixa a camada inteira (geometria completa) para um arquivo — não para
    a memória. `urllib` puro, sem dependência de `requests` para poder gravar
    em streaming com `shutil.copyfileobj`."""
    import shutil

    params = "&".join([
        "service=WFS", "version=1.0.0", "request=GetFeature",
        f"typeName={typename}", "outputFormat=application/json",
    ])
    url = f"{BASE_URL}?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    print(f"{LOG} baixando {typename}...")
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=600) as resp, open(destino, "wb") as f:
        shutil.copyfileobj(resp, f, length=1024 * 1024)
    dt = time.time() - t0
    print(f"{LOG} {typename}: {destino.stat().st_size:,} bytes em {dt:.1f}s")


def _simplificar_geometria(geom_dict: dict) -> dict | None:
    """Douglas-Peucker preservando topologia. Devolve None se a geometria
    virar vazia (não deveria acontecer nesta tolerância, mas geometria de
    simulação hidráulica já surpreendeu este projeto antes — checar em vez de
    confiar)."""
    g = shape(geom_dict)
    if g.is_empty:
        return None
    gs = g.simplify(TOLERANCIA_GRAUS, preserve_topology=True)
    if gs.is_empty:
        print(f"{LOG} AVISO: uma geometria ficou vazia após simplify — mantendo a original.")
        gs = g
    return mapping(gs)


def _processar(alvo: dict) -> dict:
    bruto = DIR_TMP / f"{alvo['nome_curto']}.json"
    DIR_TMP.mkdir(parents=True, exist_ok=True)
    if bruto.exists() and bruto.stat().st_size > 0:
        print(f"{LOG} usando download em cache de {bruto} ({bruto.stat().st_size:,} bytes) — apague o arquivo para forçar novo download.")
    else:
        _baixar_para_arquivo(alvo["typename"], bruto)

    saida_path = DIR_CAMADAS / alvo["saida"]
    n_features = 0
    vertices_antes_total = 0
    vertices_depois_total = 0

    with open(bruto, "rb") as f_in, open(saida_path, "w", encoding="utf-8") as f_out:
        f_out.write('{\n"type": "FeatureCollection",\n')
        f_out.write(f'"name": "{alvo["saida"].removesuffix(".geojson")}",\n')
        f_out.write('"crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },\n')
        f_out.write('"features": [\n')

        primeiro = True
        for feature in ijson.items(f_in, "features.item"):
            props_brutas = feature.get("properties") or {}
            props = {k: props_brutas.get(k) for k in CAMPOS_UTEIS}

            geom = feature.get("geometry")
            if geom is None:
                continue

            def _contar_vertices(g):
                if g["type"] == "Polygon":
                    return sum(len(anel) for anel in g["coordinates"])
                if g["type"] == "MultiPolygon":
                    return sum(len(anel) for poly in g["coordinates"] for anel in poly)
                return 0

            vertices_antes_total += _contar_vertices(geom)
            geom_simpl = _simplificar_geometria(geom)
            if geom_simpl is None:
                continue
            vertices_depois_total += _contar_vertices(geom_simpl)

            linha = json.dumps({"type": "Feature", "properties": props, "geometry": geom_simpl}, ensure_ascii=False)
            if not primeiro:
                f_out.write(",\n")
            f_out.write(linha)
            primeiro = False
            n_features += 1

        f_out.write("\n]\n}\n")

    tamanho_final = saida_path.stat().st_size
    print(f"{LOG} {alvo['saida']}: {n_features} feições, "
          f"{vertices_antes_total:,} -> {vertices_depois_total:,} vértices "
          f"({100 * vertices_depois_total / max(vertices_antes_total, 1):.1f}%), "
          f"{tamanho_final:,} bytes")
    return {"arquivo": alvo["saida"], "features": n_features, "bytes": tamanho_final}


def main() -> None:
    resultados = [_processar(alvo) for alvo in ALVOS]
    print(f"{LOG} concluído:")
    for r in resultados:
        print(f"       {r['arquivo']}: {r['features']} feições, {r['bytes']:,} bytes")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # noqa: BLE001 — script de ingestão, quer o traceback completo no log
        print(f"{LOG} ERRO: {e}", file=sys.stderr)
        raise
