#!/usr/bin/env python3
r"""ingerir_funai_terras_indigenas.py — baixa as Terras Indígenas de MG do WFS
oficial da FUNAI e grava dados/camadas/terras-indigenas.geojson.

POR QUE TODAS AS FASES, E NÃO SÓ "REGULARIZADA"
(docs/FONTES-TERRITORIO-E-MINERACAO.md, seção 1).

A tentação óbvia é publicar só as TIs "Regularizada" — são as mais "prontas".
Seria um erro jurídico, não um detalhe de escopo:

  * o direito territorial indígena é ORIGINÁRIO (CF art. 231) — a demarcação
    DECLARA um direito que já existe, não o cria. Terra "Em Estudo" ou
    "Delimitada" não é terra sem direito;
  * a Convenção 169 da OIT (Decreto 10.088/2019, força de lei no Brasil)
    condiciona o dever de consulta livre, prévia e informada à AFETAÇÃO do
    povo, não ao estágio cartorial do processo;
  * na prática, as fases iniciais são as mais vulneráveis — é onde um
    empreendimento tenta correr na frente da demarcação.

Duas das 16 TIs de MG ficam na bacia do Paraopeba: Aldeia Katurama (São
Joaquim de Bicas, Regularizada) e Caxixó (Pompéu/Martinho Campos,
**Delimitada**) — exatamente o caso que um filtro por "Regularizada" apagaria
do mapa, a poucos km de Brumadinho. Por isso este script NÃO filtra por fase:
grava as 16, e a fase de cada uma aparece na ficha de clique (`fase_ti`,
traduzido em js/ui/rotulos.js — ROTULOS e VALORES ganharam entradas próprias
para o campo e para cada valor). Filtrar é decisão de quem olha o mapa, nunca
padrão do sistema.

═══ ARMADILHA 1: O GEOSERVER DA FUNAI MENTE NO CHARSET ═══

O header HTTP diz `Content-Type: application/json;charset=UTF-8`, mas os bytes
são Latin-1 (ISO-8859-1) de verdade — medido: "Pataxó" chega como o byte único
0xF3, que só faz sentido como Latin-1 (em UTF-8 seria dois bytes, 0xC3 0xB3).
Decodificar como UTF-8 (confiando no header) produz "Pataxó" → "Patax�". Este
script decodifica com `.decode('latin-1')`, ignorando o charset declarado.

═══ ARMADILHA 2: 403 SEM FILTRO ═══

Um `GetFeature` na camada nacional sem `CQL_FILTER` leva 403 do nginx de
borda — não é erro de permissão, é rate-limit. Por isso a busca é sempre
filtrada por `uf_sigla LIKE '%MG%'`, nunca a camada inteira.

Uso:
    python scripts/ingerir_funai_terras_indigenas.py
"""
from __future__ import annotations

import gzip
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

LOG = "[ingerir_funai_terras_indigenas]"

URL_BASE = "https://geoserver.funai.gov.br/geoserver/ows"
UA = "Mozilla/5.0 (compatible; ControlePopular/1.0; +https://github.com/FinweeJur/controle-popular)"

DIR_CAMADAS = Path(__file__).resolve().parent.parent / "dados" / "camadas"
SAIDA = DIR_CAMADAS / "terras-indigenas.geojson"

# Campos do esquema tis_poligonais que interessam ao globo, e o nome que cada
# um leva na saída. Deixamos de fora `gid`, `undadm_*`, `dominio_uniao`,
# `epsg` — são identificadores internos da FUNAI sem leitura direta para quem
# abre o mapa. `reestudo_ti` fica: sinaliza quando uma TI já "Regularizada"
# tem um reestudo em andamento (caso da Xacriabá, que aparece duas vezes: a
# Regularizada de 46.416 ha e o reestudo Delimitado de 43.357 ha — são
# feições DISTINTAS no WFS, mantidas as duas).
#
# `terrai_nome` vira `nome`: é a chave que `rotulos.js`/`inspector.js` usa
# para o TÍTULO da ficha (`tituloDaArea`), a mesma convenção das outras
# camadas de área nomeada deste app (ex.: imóveis da SPU). Sem isso, o título
# cairia no genérico "Terras indígenas · área 7" em vez de "Aldeia Katurama".
MAPA_CAMPOS = {
    "terrai_codigo": "terrai_codigo",
    "terrai_nome": "nome",
    "etnia_nome": "etnia_nome",
    "municipio_nome": "municipio_nome",
    "superficie_perimetro_ha": "area_ha",
    "fase_ti": "fase_ti",
    "modalidade_ti": "modalidade_ti",
    "reestudo_ti": "reestudo_ti",
    "faixa_fronteira": "faixa_fronteira",
    "data_atualizacao": "data_atualizacao",
}


def _buscar_mg() -> dict:
    params = {
        "service": "WFS", "version": "1.0.0", "request": "GetFeature",
        "typeName": "Funai:tis_poligonais", "outputFormat": "application/json",
        "CQL_FILTER": "uf_sigla LIKE '%MG%'",
    }
    url = f"{URL_BASE}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    print(f"{LOG} buscando Funai:tis_poligonais, uf_sigla LIKE '%MG%'...")
    with urllib.request.urlopen(req, timeout=120) as resp:
        bruto = resp.read()
    # O geoserver manda gzip mesmo sem `Accept-Encoding` pedir — magic bytes
    # 0x1f 0x8b no começo da resposta. `urllib` (ao contrário de `requests`)
    # não descomprime sozinho.
    if bruto[:2] == b"\x1f\x8b":
        bruto = gzip.decompress(bruto)
    # Armadilha 1: decodificar como Latin-1 de verdade, ignorando o charset
    # (mentiroso) do header.
    texto = bruto.decode("latin-1")
    return json.loads(texto)


def main() -> None:
    dados = _buscar_mg()
    features_brutas = dados.get("features", [])
    print(f"{LOG} {len(features_brutas)} feições recebidas.")
    if len(features_brutas) != 16:
        print(f"{LOG} AVISO: esperava 16 TIs em MG (medido em 13/08/2026 — ver "
              f"docs/FONTES-TERRITORIO-E-MINERACAO.md) e a FUNAI devolveu "
              f"{len(features_brutas)}. Pode ser atualização real (a fonte é mensal) "
              f"ou sintoma de outro problema — conferir antes de publicar se o "
              f"número mudou muito.")

    features_saida = []
    for f in features_brutas:
        props_brutas = f.get("properties") or {}
        props = {saida_k: props_brutas.get(fonte_k) for fonte_k, saida_k in MAPA_CAMPOS.items()}
        features_saida.append({
            "type": "Feature",
            "properties": props,
            "geometry": f.get("geometry"),
        })

    saida = {
        "type": "FeatureCollection",
        "name": "terras-indigenas",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features": features_saida,
    }

    DIR_CAMADAS.mkdir(parents=True, exist_ok=True)
    with open(SAIDA, "w", encoding="utf-8") as fh:
        json.dump(saida, fh, ensure_ascii=False, indent=None, separators=(",", ": "))

    # Contagem por fase, para o hint da camada em config.js bater com o dado.
    from collections import Counter
    contagem_fase = Counter(props_brutas_f.get("fase_ti") for props_brutas_f in
                             (f.get("properties") or {} for f in features_brutas))
    print(f"{LOG} gravado em {SAIDA} ({SAIDA.stat().st_size:,} bytes).")
    print(f"{LOG} por fase: {dict(contagem_fase)}")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # noqa: BLE001
        print(f"{LOG} ERRO: {e}", file=sys.stderr)
        raise
