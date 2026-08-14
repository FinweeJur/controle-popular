#!/usr/bin/env python3
r"""ingerir_sigmine.py — baixa o shapefile de processos minerários da ANM
(SIGMINE) para MG e separa em DUAS camadas: minas em operação e interesse
minerário. Grava dados/camadas/sigmine-operacao.geojson e
dados/camadas/sigmine-interesse.geojson.

POR QUE DUAS CAMADAS, E NÃO UMA "EMPREENDIMENTOS MINERÁRIOS"
(docs/FONTES-TERRITORIO-E-MINERACAO.md, seção 2).

O SIGMINE tem 1 polígono por PROCESSO junto à ANM — não por mina. Medido agora
(13/08/2026), das 54.920 poligonais de MG, só 7.090 (12,9%) têm um FASE que
autoriza extrair minério; as outras 47.830 são requerimento, pesquisa ou área
devolvida — um papel protocolado que pode nunca virar nada. Publicar as 54.920
como "empreendimentos minerários" afirmaria que ~19,4 milhões de hectares de
Minas (mais de 30% do estado) são mina — falso, e o tipo de salto que este
projeto existe para não dar.

    FASE                                polígonos    é mina?
    CONCESSÃO DE LAVRA                       3.191    sim — lavra autorizada
    LICENCIAMENTO                            3.397    sim — produção sob licenciamento
    LAVRA GARIMPEIRA                           278    sim — PLG ativa
    REGISTRO DE EXTRAÇÃO                       224    sim — extração p/ obra pública
    (as outras 10 fases)                    47.830    não — pedido, pesquisa, área livre

Contagem medida direto no DBF baixado agora — os números do documento de
pesquisa (13/08, algumas horas antes) diferem em poucas dezenas por fase: o
SIGMINE é atualizado DIARIAMENTE, então um delta pequeno é atualização real da
fonte, não erro de leitura.

**Camada "Minas em operação"** (as 4 fases acima) — só aqui cabe a palavra
"mina". Nasce LIGADA: é o recorte que o dado sustenta com confiança.

**Camada "Interesse minerário"** (as outras 10 fases) — nasce DESLIGADA, e o
hint diz explicitamente "processo na ANM — não é mina em operação". É
informação legítima (mostra pressão futura sobre um território), mas só se
identificada pelo que é.

As duas nunca se somam num número único, e a etiqueta de cada polígono mostra
o `FASE` de verdade — ver `CAMPOS_UTEIS`.

═══ ARMADILHA: EXIGE USER-AGENT DE NAVEGADOR ═══

Sem `User-Agent`, o servidor da ANM devolve 403. Com um UA de navegador, 200.

═══ ENCODING ═══

Ao contrário da FUNAI, o `.cpg` do shapefile (UTF-8) está CORRETO — conferido
campo a campo. `pyshp` honra o `.cpg` sozinho; não force `latin-1` aqui (medido:
forçar produz mojibake por decodificar duas vezes um texto que já é UTF-8).

═══ SIMPLIFICAÇÃO ═══

54.920 polígonos somam ~1,96 milhões de vértices brutos — não é malha de
simulação como a ZAS da FEAM (mediana de 13 vértices por polígono; são
processos minerários, poligonais desenhadas com poucos lados), mas a cauda tem
outliers de até 6.605 vértices. Tolerâncias DIFERENTES para as duas camadas de
saída, medidas em 13/08/2026 nos 47.830 polígonos de "interesse minerário":

    tolerância   vértices finais   % do original
    0,0001°         1.216.172           71,8%
    0,0003°           893.003           52,7%   <- escolhida p/ interesse
    0,0005°           755.566           44,6%

"Minas em operação" (7.090 polígonos, a camada que abre ligada, a que importa
mais precisão por processo) fica em 0,0001° (~11 m). "Interesse minerário"
(47.830 polígonos, desligada por padrão, ~41,6 MB antes deste ajuste) vai para
0,0003° (~33 m) — ainda bem abaixo da escala de leitura de um mapa estadual, e
reduz quase pela metade o arquivo que mais pesava neste lote. Coordenadas
arredondadas a 6 casas decimais (~11 cm) no JSON de saída em ambas.

Uso:
    python scripts/ingerir_sigmine.py
"""
from __future__ import annotations

import io
import json
import sys
import zipfile
from collections import Counter
from pathlib import Path

import requests
import shapefile
from shapely.geometry import mapping, shape

LOG = "[ingerir_sigmine]"

URL_ZIP = "https://dadosabertos.anm.gov.br/SIGMINE/PROCESSOS_MINERARIOS/MG.zip"
# Precisa parecer navegador — sem isto o servidor da ANM devolve 403.
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")

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

# Tolerâncias DIFERENTES por camada de saída — ver a tabela medida na nota
# grande do topo do arquivo (seção SIMPLIFICAÇÃO).
TOLERANCIA_OPERACAO = 0.0001
TOLERANCIA_INTERESSE = 0.0003
CASAS_DECIMAIS = 6

# As 4 fases em que o polígono é, de fato, autorização para extrair.
FASES_OPERACAO = {
    "CONCESSÃO DE LAVRA",
    "LICENCIAMENTO",
    "LAVRA GARIMPEIRA",
    "REGISTRO DE EXTRAÇÃO",
}

# DBF -> chave de saída. Minúsculo snake_case, a convenção do resto do app
# (ver js/ui/rotulos.js). `NOME` vira `nome`: é a chave que `tituloDaArea()`
# usa para o título da ficha — aqui o "nome" é o titular do processo (ex.:
# "VALE S.A."), então o título da ficha passa a ser a empresa, não um genérico
# "Minas em operação · área 43".
MAPA_CAMPOS = {
    "PROCESSO": "processo", "NUMERO": "numero", "ANO": "ano",
    "AREA_HA": "area_ha", "FASE": "fase", "NOME": "nome",
    "SUBS": "subs", "USO": "uso",
}


def _baixar_zip() -> Path:
    DIR_TMP.mkdir(parents=True, exist_ok=True)
    destino = DIR_TMP / "MG_sigmine.zip"
    if destino.exists() and destino.stat().st_size > 0:
        print(f"{LOG} usando zip em cache ({destino.stat().st_size:,} bytes) — apague para forçar novo download.")
        return destino
    print(f"{LOG} baixando {URL_ZIP} (User-Agent de navegador, senão 403)...")
    r = requests.get(URL_ZIP, headers={"User-Agent": UA}, timeout=180)
    r.raise_for_status()
    destino.write_bytes(r.content)
    print(f"{LOG} {destino.stat().st_size:,} bytes.")
    return destino


def _arredondar_coords(obj):
    """Arredonda recursivamente uma estrutura de coordenadas GeoJSON a
    CASAS_DECIMAIS. Funciona para Polygon (lista de anéis) e MultiPolygon
    (lista de polígonos de anéis) porque só desce em listas até achar um par
    numérico."""
    if isinstance(obj, (int, float)):
        return round(obj, CASAS_DECIMAIS)
    if isinstance(obj, (list, tuple)):
        return [_arredondar_coords(x) for x in obj]
    return obj


def _simplificar_e_arredondar(geo_interface: dict, tolerancia: float) -> dict | None:
    g = shape(geo_interface)
    if g.is_empty:
        return None
    gs = g.simplify(tolerancia, preserve_topology=True)
    if gs.is_empty:
        gs = g
    m = mapping(gs)
    m = {"type": m["type"], "coordinates": _arredondar_coords(m["coordinates"])}
    return m


def _extrair_registros(zip_path: Path) -> shapefile.Reader:
    """Lê o shapefile de dentro do zip sem extrair para disco (evita mais uma
    cópia de ~90 MB): `shapefile.Reader` aceita objetos file-like."""
    z = zipfile.ZipFile(zip_path)
    return shapefile.Reader(
        shp=io.BytesIO(z.read("MG.shp")),
        dbf=io.BytesIO(z.read("MG.dbf")),
        shx=io.BytesIO(z.read("MG.shx")),
        # Não forçamos encoding: o .cpg (UTF-8) está correto para esta fonte,
        # ao contrário da FUNAI — ver a nota grande no topo do arquivo.
    )


def main() -> None:
    zip_path = _baixar_zip()
    sf = _extrair_registros(zip_path)

    contagem_fase: Counter[str] = Counter()
    saida_operacao: list[dict] = []
    saida_interesse: list[dict] = []
    vazios = 0

    for sr in sf.iterShapeRecords():
        rec = sr.record.as_dict()
        fase = (rec.get("FASE") or "").strip()
        contagem_fase[fase] += 1

        eh_operacao = fase in FASES_OPERACAO
        tolerancia = TOLERANCIA_OPERACAO if eh_operacao else TOLERANCIA_INTERESSE
        geom = _simplificar_e_arredondar(sr.shape.__geo_interface__, tolerancia)
        if geom is None:
            vazios += 1
            continue

        props = {saida_k: rec.get(fonte_k) for fonte_k, saida_k in MAPA_CAMPOS.items()}
        feature = {"type": "Feature", "properties": props, "geometry": geom}

        if eh_operacao:
            saida_operacao.append(feature)
        else:
            saida_interesse.append(feature)

    print(f"{LOG} {sum(contagem_fase.values())} processos lidos, {vazios} com geometria vazia (ignorados).")
    print(f"{LOG} por fase:")
    for fase, n in contagem_fase.most_common():
        marca = "OPERAÇÃO" if fase in FASES_OPERACAO else "interesse"
        print(f"       {n:>6}  {fase:<40} [{marca}]")

    for nome_arquivo, features in [
        ("sigmine-operacao.geojson", saida_operacao),
        ("sigmine-interesse.geojson", saida_interesse),
    ]:
        caminho = DIR_CAMADAS / nome_arquivo
        payload = {
            "type": "FeatureCollection",
            "name": nome_arquivo.removesuffix(".geojson"),
            "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
            "features": features,
        }
        with open(caminho, "w", encoding="utf-8") as fh:
            json.dump(payload, fh, ensure_ascii=False, separators=(",", ":"))
        print(f"{LOG} {nome_arquivo}: {len(features)} feições, {caminho.stat().st_size:,} bytes.")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # noqa: BLE001
        print(f"{LOG} ERRO: {e}", file=sys.stderr)
        raise
