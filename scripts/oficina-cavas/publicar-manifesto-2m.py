#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Publica o manifesto 2m versionado a partir do checkpoint local.

Contrato (F1, 16/10): as duas máquinas NÃO trocam imagem. Cada uma corta PAN
2m dos centros que conhece e grava um registro no cache local. Este script
destila o cache num manifesto PUBLICO e versionado:

  scripts/dados/cavas-2m/checkpoint-2m.jsonl   (git-tracked, leve)

Regras do manifesto:
  - só linhas status=="ok" (corte real, com arquivo + nuvem medida);
  - dedupe por hash, guardando a menor nuvem (a máquina que teve céu limpo
    manda; a outra aceita sem brigar);
  - Ordenado por hash e APENDS-only-friendly: as duas máquinas escrevem hashes
    diferentes -> o merge do git junta linhas distintas sem conflito.

Cada linha carrega lon/lat, então a outra máquina REGERA o pixel do INPE
(determinístico: centroide -> cena -> janela PAN). Não há Blob no caminho.

Uso: python scripts/oficina-cavas/publicar-manifesto-2m.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

_RC = Path(__file__).resolve().parents[2]
_LOCAL = _RC / "scripts" / ".cache" / "cavas-2m" / "checkpoint-2m.jsonl"
_CALIB = _RC / "scripts" / ".cache" / "cavas-calibracao" / "checkpoint.jsonl"
_PUB = _RC / "scripts" / "dados" / "cavas-2m" / "checkpoint-2m.jsonl"
_CAMPOS = ("hash", "lon", "lat", "tipo", "label", "cena", "arquivo", "nuvem")


def _centros_calib() -> dict:
    """hash -> (lon, lat) do checkpoint de calibração (tem bbox).

    Serve pra dar coordenada aos recortes cortados antes de o gerador gravar
    lon/lat — senão teria que regera-los só por falta de metadado.
    """
    import json as _j
    mapa = {}
    if not _CALIB.exists():
        return mapa
    for linha in _CALIB.read_text(encoding="utf-8").splitlines():
        try:
            o = _j.loads(linha)
        except _j.JSONDecodeError:
            continue
        h = o.get("hash")
        b = o.get("bbox")
        if not h:
            continue
        if not (isinstance(b, list) and len(b) == 4):
            continue
        mapa[h] = ((b[0] + b[2]) / 2, (b[1] + b[3]) / 2)
    return mapa


def _ok(linha: str):
    """Linha aproveitável: status ok e tem hash. Coordenada pode vir depois."""
    try:
        o = json.loads(linha)
    except json.JSONDecodeError:
        return None
    if o.get("status") == "ok" and o.get("hash"):
        return o
    return None


def escolher_melhor(reg: dict, atual: dict) -> dict:
    """Fica com o registro de menor nuvem (as duas máquinas publicam)."""
    if atual is None:
        return reg
    return reg if reg.get("nuvem", 1.0) < atual.get("nuvem", 1.0) else atual


def consolidar(caminho: Path, centros: dict) -> dict:
    """hash -> melhor ok, com lon/lat garantidos (backfill do calib)."""
    melhor: dict = {}
    if not caminho.exists():
        return melhor
    for linha in caminho.read_text(encoding="utf-8").splitlines():
        o = _ok(linha)
        if not o:
            continue
        if o.get("lon") is None and o["hash"] in centros:
            lon, lat = centros[o["hash"]]
            o["lon"], o["lat"] = round(lon, 6), round(lat, 6)
        if o.get("lon") is None:
            continue  # sem coordenada e sem calib -> não dá pra compartilhar
        melhor[o["hash"]] = escolher_melhor(o, melhor.get(o["hash"]))
    return melhor


def publicar() -> int:
    mesclado = consolidar(_LOCAL, _centros_calib())
    _PUB.parent.mkdir(parents=True, exist_ok=True)
    linhas = []
    for h in sorted(mesclado):
        o = mesclado[h]
        linhas.append(json.dumps({c: o.get(c) for c in _CAMPOS},
                                 ensure_ascii=False))
    _PUB.write_text("\n".join(linhas) + ("\n" if linhas else ""),
                    encoding="utf-8")
    pos = sum(1 for o in mesclado.values() if o.get("label") == 1)
    print(f"publicado {len(mesclado)} registros -> {_PUB} "
          f"(pos {pos} / neg {len(mesclado) - pos})")
    return 0


if __name__ == "__main__":
    sys.exit(publicar())
