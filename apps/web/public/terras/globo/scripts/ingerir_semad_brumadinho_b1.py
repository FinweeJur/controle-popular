#!/usr/bin/env python3
r"""ingerir_semad_brumadinho_b1.py — baixa as 8 camadas que a SEMAD/IDE-Sisema
publica especificamente sobre o rompimento da Barragem I (B1), Mina Córrego do
Feijão (Brumadinho, 25/01/2019, 270 mortes), e grava versões enxutas em
dados/camadas/brumadinho-*.geojson.

POR QUE ESTE SCRIPT EXISTE (docs/PLANO-INTEGRACAO-BRUMADINHO.md, seção 1.2).

As 30 camadas que o globo já tinha cobrem Brumadinho só PELA METADE:
`zas-barragens`/`mancha-inundacao-barragens` (scripts/ingerir_feam_zas_mancha.py)
são a simulação HIPOTÉTICA (PAE/ERHB) de 156 barragens de MG, incluindo a B1 —
"o que a água alcançaria SE uma barragem parecida rompesse". Não existia, até
esta entrega, a área REAL atingida quando a B1 rompeu de verdade, nem
monitoramento, nem remanejamento de família. Esta família de 8 camadas
(prefixo `ide_250102_mg_*`, catalogada no GeoNetwork da Semad; 250102 é código
interno de publicação, não data) fecha essa metade que faltava.

═══ A MESMA INFRAESTRUTURA, NÃO UM CANO NOVO ═══

`geoserver.meioambiente.mg.gov.br/IDE/ows` é o MESMO GeoServer que já alimenta
`zas-barragens` e `mancha-inundacao-barragens` — mesmo protocolo WFS, mesmo
formato de resposta, mesma licença ("O acesso ao dado é livre", conferida no
GeoNetwork para `impactos_ambientais_pol` e `remanejamento_pto`
individualmente; as outras 6 camadas da mesma série NÃO tiveram o metadado
individual aberto — presumo a mesma licença por serem do mesmo
publicador/série, mas isto é presunção, não confirmação camada a camada,
registrada aqui de propósito). Ao contrário do script da ZAS/mancha, NENHUMA
destas 8 camadas precisa de streaming nem de simplificação Douglas-Peucker: a
MAIOR (`estruturas_contecao_pol`) mede 884 KB crua — a família inteira soma
~1,4 MB, longe do teto de compressão (~8 MiB, ver
scripts/comprimir-camadas-grandes.mjs). `urllib` + `json.loads` direto, sem a
maquinaria de `ijson`/arquivo temporário que a ZAS precisa.

═══ A CAMADA MAIS IMPORTANTE: `impactos_ambientais_pol` — A MANCHA REAL,
NÃO A HIPOTÉTICA ═══

Dois polígonos, mapeados por imagem de satélite Pleiades a escala compatível
1:2.500 (metadado do GeoNetwork), publicados pela Semad em 2020, metadado
revisado em 2023. Isto é o PAR FACTUAL de `mancha-inundacao-barragens`: aquela
é "o que uma ruptura hipotética alcançaria" (ERHB, cenário de engenharia); esta
é "o que o rejeito de fato cobriu em 25/01/2019, com 270 mortes". As duas
respondem perguntas diferentes e NUNCA podem se confundir na tela — por isso o
`hint`/`aviso` desta camada em config.js repete a palavra REAL e cita a data e
a contagem de mortes, e o rótulo nunca reaproveita a palavra "mancha" sozinha
(a camada chama-se "área REALMENTE atingida", não "mancha de Brumadinho").

═══ `remanejamento_pto` — INSPECIONADO CAMPO A CAMPO ANTES DE PUBLICAR ═══

104 pontos de ORIGEM de famílias remanejadas (não o destino, não residência
atual). `DescribeFeatureType` desta camada tem exatamente DOIS campos de
atributo: `classe` (sempre "Remanejamento de famílias") e `descricao` (sempre
"Origem: <bairro/comunidade>", ex. "PARQUE DA CACHOEIRA", "CORREGO DO FEIJAO").
Conferido feição a feição hoje: NÃO existe nome, CPF, endereço com número,
telefone nem qualquer campo de identificação pessoal no esquema — o dado é
estruturalmente incapaz de conter isso, porque só tem essas duas colunas de
texto. São 8 valores distintos de bairro/comunidade nas 104 feições (uma delas,
"Origem: 0", é anomalia da própria fonte — mantida como está, sem inventar
correção). Por isso este script publica `remanejamento_pto` como as outras 7:
ponto de ORIGEM agregado por bairro é informação pública de política de
reparação, não localizador de residência individual. Mesmo assim, o `aviso`
em config.js instrui: não aumentar a precisão do ponto nem cruzar com
CAR/cadastro de imóvel por CPF — usar como está.

═══ CAMPOS MANTIDOS, E POR QUE ═══

Todas as 8 camadas desta série compartilham o MESMO esquema mínimo:
`(id|objectid|ogc_fid)`, `classe`, `descricao` — confirmado hoje nas 8, via
`DescribeFeatureType` implícito (a resposta de cada `GetFeature` só trouxe
essas colunas). O identificador interno (`id`/`objectid`/`ogc_fid`, nome varia
por camada) é chave de banco da Semad sem leitura para quem abre o mapa — cai
fora, mesma disciplina de `ingerir_incra_quilombolas.py` descartando
`responsave`. `classe` e `descricao` ficam sempre.

Duas camadas ganham um campo DERIVADO, calculado sobre `descricao` e não
inventado:
  * `monitoramento_pto`: `categoria` = tudo antes do primeiro " - " em
    `descricao` (ex. "Ar - PQAR-1" -> categoria "Ar"). Medido hoje nas 291
    feições: 10 categorias, batendo exatamente com a tabela do plano
    (docs/PLANO-INTEGRACAO-BRUMADINHO.md, seção 1.2) — Rejeitos (140), Água
    Superficial e Sedimentos (45), Água Subterrânea (40), Água Superficial
    (17), Ruído (16), Hidrossedimentométrico (11), Ar (6), Efluente (6), Poço
    Cava Feijão (6), Radar Geotécnico (4).
  * `remanejamento_pto`: `bairro_origem` = `descricao` sem o prefixo
    "Origem: ". Facilita agrupar/rotular sem reprocessar texto na UI.

Uso:
    python scripts/ingerir_semad_brumadinho_b1.py
"""
from __future__ import annotations

import json
import sys
import time
import urllib.request
from pathlib import Path

LOG = "[ingerir_semad_brumadinho_b1]"

BASE_URL = "https://geoserver.meioambiente.mg.gov.br/IDE/ows"
UA = "Mozilla/5.0 (compatible; ControlePopular/1.0; +https://github.com/FinweeJur/controle-popular)"

DIR_CAMADAS = Path(__file__).resolve().parent.parent / "dados" / "camadas"
DIR_TMP = Path(__file__).resolve().parent.parent / "scripts" / ".tmp-ingest"

# typeName -> (arquivo de saída, nº de feições medido em 13/08/2026 — ver
# docs/PLANO-INTEGRACAO-BRUMADINHO.md, seção 1.2 — para o AVISO de divergência,
# não para travar a execução).
ALVOS = [
    {"typename": "ide_250102_mg_impactos_ambientais_pol", "saida": "brumadinho-area-atingida.geojson", "esperado": 2},
    {"typename": "ide_250102_mg_monitoramento_pto", "saida": "brumadinho-monitoramento.geojson", "esperado": 291},
    {"typename": "ide_250102_mg_remanejamento_pto", "saida": "brumadinho-remanejamento.geojson", "esperado": 104},
    {"typename": "ide_250102_mg_estruturas_contecao_pol", "saida": "brumadinho-estruturas-contencao.geojson", "esperado": 37},
    {"typename": "ide_250102_mg_obras_intervencoes_poligonais_pol", "saida": "brumadinho-obras-poligonais.geojson", "esperado": 22},
    {"typename": "ide_250102_mg_obras_intervencoes_pontuais_pto", "saida": "brumadinho-obras-pontuais.geojson", "esperado": 13},
    {"typename": "ide_250102_mg_obras_intervencoes_lineares_lin", "saida": "brumadinho-obras-lineares.geojson", "esperado": 1},
    {"typename": "ide_250102_mg_restauracao_pol", "saida": "brumadinho-restauracao.geojson", "esperado": 35},
]

# Chaves de id interno que aparecem, dependendo da camada (varia: `id`,
# `objectid`, `ogc_fid`) — nenhuma delas sai no GeoJSON publicado (ver
# docstring, "CAMPOS MANTIDOS").
CHAVES_ID_INTERNO = ("id", "objectid", "ogc_fid")


def _baixar(typename: str) -> dict:
    cache = DIR_TMP / f"{typename}.json"
    if cache.exists() and cache.stat().st_size > 0:
        print(f"{LOG} usando cache local {cache} (apague o arquivo para forçar novo download).")
        return json.loads(cache.read_text(encoding="utf-8"))

    DIR_TMP.mkdir(parents=True, exist_ok=True)
    params = "&".join([
        "service=WFS", "version=1.0.0", "request=GetFeature",
        f"typeName=IDE:{typename}", "outputFormat=application/json",
    ])
    url = f"{BASE_URL}?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    print(f"{LOG} baixando {typename}...")
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=120) as resp:
        bruto = resp.read()
    dt = time.time() - t0
    # Ao contrário do WFS da FUNAI, o geoserver da Semad é correto no charset
    # (mesma checagem já feita para zas/mancha) — UTF-8 direto.
    texto = bruto.decode("utf-8")
    cache.write_text(texto, encoding="utf-8")
    print(f"{LOG} {typename}: {len(bruto):,} bytes em {dt:.1f}s")
    return json.loads(texto)


def _props_enxutas(typename: str, props_brutas: dict) -> dict:
    props = {
        "classe": props_brutas.get("classe"),
        "descricao": props_brutas.get("descricao"),
    }
    if typename == "ide_250102_mg_monitoramento_pto":
        desc = props_brutas.get("descricao") or ""
        props["categoria"] = desc.split(" - ", 1)[0].strip() if " - " in desc else desc.strip()
    if typename == "ide_250102_mg_remanejamento_pto":
        desc = props_brutas.get("descricao") or ""
        prefixo = "Origem: "
        props["bairro_origem"] = desc[len(prefixo):].strip() if desc.startswith(prefixo) else desc.strip()
    return props


def _processar(alvo: dict) -> dict:
    dados = _baixar(alvo["typename"])
    features_brutas = dados.get("features", [])
    n = len(features_brutas)
    if n != alvo["esperado"]:
        print(f"{LOG} AVISO: {alvo['typename']} esperava {alvo['esperado']} feições "
              f"(medido em 13/08/2026, docs/PLANO-INTEGRACAO-BRUMADINHO.md) e a Semad "
              f"devolveu {n}. Pode ser atualização real ou sintoma de outro problema — "
              f"conferir antes de publicar se o número mudou muito.")

    features_saida = []
    for f in features_brutas:
        geom = f.get("geometry")
        if geom is None:
            continue
        props_brutas = f.get("properties") or {}
        features_saida.append({
            "type": "Feature",
            "properties": _props_enxutas(alvo["typename"], props_brutas),
            "geometry": geom,
        })

    saida = {
        "type": "FeatureCollection",
        "name": alvo["saida"].removesuffix(".geojson"),
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features": features_saida,
    }
    saida_path = DIR_CAMADAS / alvo["saida"]
    with open(saida_path, "w", encoding="utf-8") as fh:
        json.dump(saida, fh, ensure_ascii=False, separators=(",", ": "))
    tamanho = saida_path.stat().st_size
    print(f"{LOG} {alvo['saida']}: {len(features_saida)} feições, {tamanho:,} bytes.")
    return {"arquivo": alvo["saida"], "features": len(features_saida), "bytes": tamanho}


def main() -> None:
    resultados = [_processar(alvo) for alvo in ALVOS]
    total_bytes = sum(r["bytes"] for r in resultados)
    total_features = sum(r["features"] for r in resultados)
    print(f"\n{LOG} concluído: {len(resultados)} camadas, {total_features} feições, "
          f"{total_bytes:,} bytes ({total_bytes / 1024:.1f} KiB) ao todo.")
    for r in resultados:
        print(f"       {r['arquivo']}: {r['features']} feições, {r['bytes']:,} bytes")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # noqa: BLE001 — script de ingestão, quer o traceback completo no log
        print(f"{LOG} ERRO: {e}", file=sys.stderr)
        raise
