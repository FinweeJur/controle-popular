#!/usr/bin/env python3
r"""gerar_camada_sirenejud.py — transforma o agregado do SIRENEJud (CNJ)
numa camada do globo: uma feição por município de MG, com a CONTAGEM de
processos ambientais na Justiça, quebrada por situação e por tribunal.

Entrada: etl/betim/dados/sirenejud-mg.json (gerado por
etl/betim/etl/apis/sirenejud_cnj.py — que descarta nomes de partes na
coleta; ver a docstring de lá).

Saída: dados/camadas/processos-ambientais-cnj.geojson

═══ CONTA, NUNCA TEOR ═══

Mesma regra de `gerar_camada_documentos_municipio.py`: a camada leva
contagens e tempo médio. NÃO leva número de processo, NÃO leva classe além
do top-5 agregado do município, NÃO leva nome de parte (que nem chega ao
JSON de entrada — é descartado no coletor). Classe e assunto aqui são a
taxonomia pública TPU do CNJ, não conteúdo de processo.

═══ O MUNICÍPIO É O DO ÓRGÃO JULGADOR ═══

O `cod_ibge` do SIRENEJud é o do órgão julgador, não do local do dano —
que só é registrado obrigatoriamente desde 2021 (Portaria Conjunta
CNJ/CNMP 5/2021) e falta nos processos antigos. A feição pinta o município
inteiro e o `aviso` diz isso com todas as letras: município pintado é onde
o processo TRAMITA, não onde o dano aconteceu.

A geometria é o polígono municipal de `dados/camadas/municipios-mg.geojson`
(malha IBGE), casado por geocódigo de 7 dígitos — nunca por nome. Município
do agregado sem par na malha é registrado em `municipios_sem_poligono`,
não silenciado.

Uso:
    python scripts/gerar_camada_sirenejud.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

LOG = "[gerar_camada_sirenejud]"

DIR_GLOBO = Path(__file__).resolve().parent.parent
DIR_CAMADAS = DIR_GLOBO / "dados" / "camadas"
MUNICIPIOS_PATH = DIR_CAMADAS / "municipios-mg.geojson"
SAIDA_PATH = DIR_CAMADAS / "processos-ambientais-cnj.geojson"

# apps/web/public/terras/globo -> parents[4] = raiz do repo
ENTRADA = DIR_GLOBO.parents[4] / "etl" / "betim" / "dados" / "sirenejud-mg.json"

FONTE = "SIRENEJud — CNJ/CNMP, Res. Conjunta 8/2021 (arquivo em massa)"

# Chaves que NUNCA podem aparecer na saída. Conferido de verdade no main().
_CHAVES_PROIBIDAS = {"numprocess", "numero_processo", "partes", "polo_ativo",
                     "polo_passivo", "movimento", "movimentacoes", "geom"}


def _numero_br(n) -> str:
    if isinstance(n, float) and not n.is_integer():
        return f"{n:.1f}".replace(".", ",")
    return f"{int(n):,}".replace(",", ".")


def main() -> None:
    if not ENTRADA.exists():
        print(f"{LOG} ERRO: {ENTRADA} não existe — rode primeiro "
              f"etl/betim/etl/apis/sirenejud_cnj.py.", file=sys.stderr)
        sys.exit(1)

    with open(ENTRADA, encoding="utf-8") as f:
        agregado = json.load(f)

    municipios = agregado["municipios"]
    print(f"{LOG} {len(municipios)} município(s) no agregado "
          f"(arquivo do CNJ de {agregado['arquivo_modificado_em']}).")

    with open(MUNICIPIOS_PATH, encoding="utf-8") as f:
        malha = json.load(f)
    geometria_por_geocodigo = {
        feat["properties"]["geocodigo"]: feat["geometry"] for feat in malha["features"]
    }
    nome_malha = {
        feat["properties"]["geocodigo"]: feat["properties"]["nome"] for feat in malha["features"]
    }

    arquivo_em = agregado["arquivo_modificado_em"]
    sem_poligono = []
    features = []
    for m in municipios:
        geo = m["cod_ibge"]
        geom = geometria_por_geocodigo.get(geo)
        nome = nome_malha.get(geo) or m.get("municipio") or geo
        if geom is None:
            print(f"{LOG} AVISO: {nome} ({geo}) não tem polígono na malha do "
                  f"IBGE -- registrado em `municipios_sem_poligono`.",
                  file=sys.stderr)
            sem_poligono.append({"geocodigo": geo, "nome": nome,
                                 "processos": m["total"]})
            continue

        features.append({
            "type": "Feature",
            "geometry": geom,
            "properties": {
                "nome": nome,
                "geocodigo": geo,
                "uf": "MG",
                "processos_total": m["total"],
                "processos_pendentes": m["pendentes"],
                "processos_baixados": m["baixados"],
                "tempo_medio_dias": m["tempo_medio_dias"],
                "por_tribunal": m["por_tribunal"],
                "top_classes": dict(m["top_classes"]),
                "o_que_esta_contagem_e": (
                    "Processos de tema ambiental que TRAMITAM na comarca deste "
                    "município (órgão julgador), segundo o SIRENEJud/CNJ. NÃO é o "
                    "local do dano ambiental — esse registro só é obrigatório desde "
                    "2021 e falta nos processos antigos."
                ),
                "onde_ver_os_numeros": "/ambiental/judiciario",
                "por_que_nao_tem_processo_a_processo_aqui": (
                    "De propósito: a camada publica contagem, nunca teor nem "
                    "número de processo. A fonte traz nomes de partes, que o "
                    "portal descarta na coleta."
                ),
                "fonte": FONTE,
                "cobertura_da_fonte": agregado["cobertura"],
                "aviso": (
                    f"O arquivo público do CNJ é de {arquivo_em} e a atualização é "
                    f"irregular — a contagem vale até essa data. Município pintado é "
                    f"onde o processo tramita, não onde o dano aconteceu."
                ),
            },
        })

    # Conferência real das chaves proibidas — não é promessa de comentário.
    for feat in features:
        proibidas = _CHAVES_PROIBIDAS & set(feat["properties"])
        if proibidas:
            raise ValueError(f"chave(s) proibida(s) na saída: {proibidas}")

    saida = {
        "type": "FeatureCollection",
        "metadata": {
            "camada": "processos-ambientais-cnj",
            "fonte": FONTE,
            "arquivo_origem": agregado["arquivo_origem"],
            "arquivo_modificado_em": arquivo_em,
            "gerado_em": agregado["gerado_em"],
            "municipios_sem_poligono": sem_poligono,
        },
        "features": features,
    }
    with open(SAIDA_PATH, "w", encoding="utf-8") as f:
        json.dump(saida, f, ensure_ascii=False, separators=(",", ":"))

    print(f"{LOG} {len(features)} feição(ões) gravada(s) em "
          f"{SAIDA_PATH.relative_to(DIR_GLOBO.parents[4])}; "
          f"{len(sem_poligono)} sem polígono.")


if __name__ == "__main__":
    main()
