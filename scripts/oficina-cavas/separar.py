"""Separa├º├úo dos resultados e gera├º├úo do dataset (est├ígio 3 da Oficina).

O que ├®: l├¬ `analisados.jsonl` (pontua├º├Áes do v7) e o checkpoint do coletor,
classifica cada recorte em quatro pastas l├│gicas e gera dois artefatos:

1. `dataset-vN.jsonl` ÔÇö o dataset de treino/avalia├º├úo, com split POR CENA
   (regra de ouro do treino, ver treinar-cavas-chinese-clip.py). Uma linha
   por recorte com hash, arquivo, r├│tulo, cena e split (treino/validacao).

2. `para-revisar.csv` ÔÇö a fila de revis├úo humana, com a coluna `motivo`:
     - `positivo-alta-confianca`: score >= 0.65 (o modelo acha que ├® cava).
       O dono QUER revisar esses (decis├úo dele em 13/10): falso positivo
       envenena o treino mais que falso negativo.
     - `incerto`: score entre 0.45 e 0.65 (fronteira do limiar).
   Ordenado: positivos primeiro, depois por score decrescente.

Por que separar do treino: o dono revisa por lote no painel e o que ele
marcar vira amostra de retreino. Separar em CSV de revis├úo permite esse
ciclo sem tocar no script de treino.

R├│tulo de treino (n├úo confundir com a fila de revis├úo):
  - positivo coletado (tipo=positivo) com score >= 0.65  ÔåÆ r├│tulo 1
  - negativo coletado (tipo=negativo) com score < 0.65   ÔåÆ r├│tulo 0
  - o resto fica de fora do dataset (o gate de treino j├í filtra nuvem;
    aqui filtramos score baixo em positivo e score alto em negativo, que
    s├úo os erros do pr├│prio classificador ÔÇö deix├í-los no dataset seria
    r├│tulo mentiroso).

Uso:
    python scripts/oficina-cavas/separar.py            # gera dataset + CSV
    python scripts/oficina-cavas/separar.py --versao 5 # for├ºa vers├úo do dataset
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from collections import defaultdict
from pathlib import Path

_RAIZ = Path(__file__).resolve().parents[2]
_CACHE = _RAIZ / "scripts" / ".cache" / "cavas-calibracao"
_ANALISADOS = _CACHE / "analisados.jsonl"
_CHECKPOINT = _CACHE / "checkpoint.jsonl"
_DATASET_DIR = _CACHE / "datasets"
_CSV_REVISAR = _CACHE / "para-revisar.csv"

# Limiares do v7 (medidos 13/10/2026, holdout: precis├úo 0.794, F1 0.822).
LIMIAR = 0.65
# Faixa de incerteza: em volta do limiar. Abaixo de 0.45 o modelo tem
# raz├úo de confian├ºa alta em "n├úo cava"; acima de 0.65 alta em "cava".
INFERIOR_INCERTO = 0.45


def ler_jsonl(caminho: Path) -> list[dict]:
    itens: list[dict] = []
    if not caminho.exists():
        return itens
    with open(caminho, encoding="utf-8") as fh:
        for linha in fh:
            linha = linha.strip()
            if not linha:
                continue
            try:
                itens.append(json.loads(linha))
            except json.JSONDecodeError:
                continue
    return itens


def _classificar_um(a: dict) -> tuple[dict | None, dict | None]:
    """Classifica UM recorte. Devolve (registro_dataset, registro_revisar).

    Extra├¡do de montar_dataset para baixar a complexidade ciclom├ítica:
    cada caminho (sem score, falso-positivo, falso-negativo, incerto)
    vira ramo nomeado aqui, e o la├ºo externo fica de uma linha.
    """
    score = a.get("score_cava")
    tipo = a.get("tipo")
    if score is None:
        return None, None  # modelo indispon├¡vel nesta an├ílise
    revisar: dict | None = None
    if score >= LIMIAR:
        revisar = {**a, "motivo": "positivo-alta-confianca"}
    elif INFERIOR_INCERTO <= score < LIMIAR:
        revisar = {**a, "motivo": "incerto"}
    dataset: dict | None = None
    if tipo == "positivo" and score >= LIMIAR:
        dataset = {**a, "rotulo": 1}
    elif tipo == "negativo" and score < LIMIAR:
        dataset = {**a, "rotulo": 0}
    # falso-positivo / falso-negativo: dataset None (fora, ver cabe├ºalho).
    return dataset, revisar


def montar_dataset(analisados: list[dict]) -> tuple[list[dict], list[dict]]:
    """Separa em (dataset treino, fila revis├úo).

    Regra de r├│tulo documentada no cabe├ºalho do m├│dulo e em _classificar_um.
    """
    dataset: list[dict] = []
    revisar: list[dict] = []
    for a in analisados:
        ds, rev = _classificar_um(a)
        if ds is not None:
            dataset.append(ds)
        if rev is not None:
            revisar.append(rev)
    # Positivos previstos primeiro, depois score decrescente.
    revisar.sort(key=lambda r: (r["motivo"] != "positivo-alta-confianca",
                                -(r.get("score_cava") or 0)))
    return dataset, revisar


def split_por_cena(itens: list[dict]) -> list[dict]:
    """Atribui split treino/validacao POR CENA, determin├¡stico.

    Mesma regra do treino: recortes da mesma cena se parecem (mesma luz,
    mesmo dia, mesmo sensor) e vazariam a valida├º├úo se embaralhados por
    imagem. Aqui usamos hash do nome da cena para a atribui├º├úo ser est├ível
    entre execu├º├Áes ÔÇö a mesma cena sempre cai no mesmo lado, mesmo que o
    dataset cres├ºa.

    (O split can├┤nico e fixado ├® o do treino, em
    scripts/.cache/cavas-treino/split.json. Este aqui ├® um split r├ípido e
    determin├¡stico para o painel mostrar a composi├º├úo ÔÇö o treino usa o
    dele, que veda holdout de verdade.)
    """
    cenas = sorted({i.get("cena") or "" for i in itens})
    # ~80/20: cena com hash par ÔåÆ treino, ├¡mpar ÔåÆ valida├º├úo. Est├ível.
    validacao = {c for c in cenas
                 if _hash_estavel(c) % 5 == 0}  # ~20% das cenas
    out = []
    for i in itens:
        split = "validacao" if (i.get("cena") or "") in validacao else "treino"
        out.append({**i, "split": split})
    return out


def _hash_estavel(texto: str) -> int:
    """Hash determin├¡stico e est├ível entre execu├º├Áes (n├úo usa hash() do
    Python, que muda a cada processo por semente de hash aleat├│ria)."""
    import zlib
    return zlib.crc32((texto or "").encode("utf-8"))


def gravar_dataset(itens: list[dict], versao: int) -> Path:
    """Grava o dataset-vN.jsonl com escrita at├┤mica. Devolve o caminho."""
    _DATASET_DIR.mkdir(parents=True, exist_ok=True)
    caminho = _DATASET_DIR / f"dataset-v{versao}.jsonl"
    tmp = caminho.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as fh:
        for i in itens:
            fh.write(json.dumps(i, ensure_ascii=False) + "\n")
        fh.flush()
        os.fsync(fh.fileno())
    tmp.replace(caminho)  # troca at├┤mica
    return caminho


def gravar_csv_revisar(revisar: list[dict]) -> Path:
    """Grava o CSV de revis├úo (BOM UTF-8, separador ;) ÔÇö padr├úo Excel BR."""
    campos = ["motivo", "score_cava", "tipo", "hash", "arquivo",
              "cena", "nuvem_jpg", "nuvem_coleta"]
    with open(_CSV_REVISAR, "w", encoding="utf-8-sig", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=campos, delimiter=";",
                           extrasaction="ignore")
        w.writeheader()
        for r in revisar:
            w.writerow(r)
    return _CSV_REVISAR


def proxima_versao() -> int:
    """Pr├│ximo n├║mero de vers├úo do dataset (dataset-v1, v2, ...)."""
    glob = _DATASET_DIR.glob("dataset-v*.jsonl") if _DATASET_DIR.exists() else []
    nums = [int(p.stem.split("-v")[1]) for p in glob
            if p.stem.split("-v")[-1].isdigit()]
    return (max(nums) + 1) if nums else 1


def separar(versao: int | None = None) -> dict:
    """Roda a separa├º├úo. Devolve um resumo com contagens (para o painel)."""
    analisados = ler_jsonl(_ANALISADOS)
    dataset, revisar = montar_dataset(analisados)
    dataset = split_por_cena(dataset)
    v = versao or proxima_versao()
    caminho_ds = gravar_dataset(dataset, v)
    caminho_csv = gravar_csv_revisar(revisar)

    n_treino = sum(1 for i in dataset if i["split"] == "treino")
    n_val = sum(1 for i in dataset if i["split"] == "validacao")
    n_pos_rev = sum(1 for r in revisar if r["motivo"] == "positivo-alta-confianca")
    n_inc = sum(1 for r in revisar if r["motivo"] == "incerto")
    resumo = {
        "dataset": str(caminho_ds), "versao": v, "total": len(dataset),
        "treino": n_treino, "validacao": n_val,
        "csv_revisar": str(caminho_csv), "para_revisar": len(revisar),
        "positivos_previstos": n_pos_rev, "incertos": n_inc,
    }
    print(f"dataset v{v}: {len(dataset)} itens "
          f"(treino {n_treino} / val {n_val})", flush=True)
    print(f"para revisar: {len(revisar)} "
          f"(positivos {n_pos_rev} / incertos {n_inc})", flush=True)
    return resumo


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--versao", type=int, default=None,
                    help="for├ºa a vers├úo do dataset (padr├úo: pr├│xima)")
    args = ap.parse_args(argv)
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    separar(args.versao)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
