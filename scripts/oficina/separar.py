"""Separação dos resultados e geração do dataset (estágio 3 da Oficina).

O que é: lê `analisados.jsonl` (pontuações do v7) e o checkpoint do coletor,
classifica cada recorte em quatro pastas lógicas e gera dois artefatos:

1. `dataset-vN.jsonl` — o dataset de treino/avaliação, com split POR CENA
   (regra de ouro do treino, ver treinar-cavas-chinese-clip.py). Uma linha
   por recorte com hash, arquivo, rótulo, cena e split (treino/validacao).

2. `para-revisar.csv` — a fila de revisão humana, com a coluna `motivo`:
     - `positivo-alta-confianca`: score >= 0.65 (o modelo acha que é cava).
       O dono QUER revisar esses (decisão dele em 13/10): falso positivo
       envenena o treino mais que falso negativo.
     - `incerto`: score entre 0.45 e 0.65 (fronteira do limiar).
   Ordenado: positivos primeiro, depois por score decrescente.

Por que separar do treino: o dono revisa por lote no painel e o que ele
marcar vira amostra de retreino. Separar em CSV de revisão permite esse
ciclo sem tocar no script de treino.

Rótulo de treino (não confundir com a fila de revisão):
  - positivo coletado (tipo=positivo) com score >= 0.65  → rótulo 1
  - negativo coletado (tipo=negativo) com score < 0.65   → rótulo 0
  - o resto fica de fora do dataset (o gate de treino já filtra nuvem;
    aqui filtramos score baixo em positivo e score alto em negativo, que
    são os erros do próprio classificador — deixá-los no dataset seria
    rótulo mentiroso).

Uso:
    python scripts/oficina/separar.py            # gera dataset + CSV
    python scripts/oficina/separar.py --versao 5 # força versão do dataset
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

# Limiares do v7 (medidos 13/10/2026, holdout: precisão 0.794, F1 0.822).
LIMIAR = 0.65
# Faixa de incerteza: em volta do limiar. Abaixo de 0.45 o modelo tem
# razão de confiança alta em "não cava"; acima de 0.65 alta em "cava".
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

    Extraído de montar_dataset para baixar a complexidade ciclomática:
    cada caminho (sem score, falso-positivo, falso-negativo, incerto)
    vira ramo nomeado aqui, e o laço externo fica de uma linha.
    """
    score = a.get("score_cava")
    tipo = a.get("tipo")
    if score is None:
        return None, None  # modelo indisponível nesta análise
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
    # falso-positivo / falso-negativo: dataset None (fora, ver cabeçalho).
    return dataset, revisar


def montar_dataset(analisados: list[dict]) -> tuple[list[dict], list[dict]]:
    """Separa em (dataset treino, fila revisão).

    Regra de rótulo documentada no cabeçalho do módulo e em _classificar_um.
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
    """Atribui split treino/validacao POR CENA, determinístico.

    Mesma regra do treino: recortes da mesma cena se parecem (mesma luz,
    mesmo dia, mesmo sensor) e vazariam a validação se embaralhados por
    imagem. Aqui usamos hash do nome da cena para a atribuição ser estável
    entre execuções — a mesma cena sempre cai no mesmo lado, mesmo que o
    dataset cresça.

    (O split canônico e fixado é o do treino, em
    scripts/.cache/cavas-treino/split.json. Este aqui é um split rápido e
    determinístico para o painel mostrar a composição — o treino usa o
    dele, que veda holdout de verdade.)
    """
    cenas = sorted({i.get("cena") or "" for i in itens})
    # ~80/20: cena com hash par → treino, ímpar → validação. Estável.
    validacao = {c for c in cenas
                 if _hash_estavel(c) % 5 == 0}  # ~20% das cenas
    out = []
    for i in itens:
        split = "validacao" if (i.get("cena") or "") in validacao else "treino"
        out.append({**i, "split": split})
    return out


def _hash_estavel(texto: str) -> int:
    """Hash determinístico e estável entre execuções (não usa hash() do
    Python, que muda a cada processo por semente de hash aleatória)."""
    import zlib
    return zlib.crc32((texto or "").encode("utf-8"))


def gravar_dataset(itens: list[dict], versao: int) -> Path:
    """Grava o dataset-vN.jsonl com escrita atômica. Devolve o caminho."""
    _DATASET_DIR.mkdir(parents=True, exist_ok=True)
    caminho = _DATASET_DIR / f"dataset-v{versao}.jsonl"
    tmp = caminho.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as fh:
        for i in itens:
            fh.write(json.dumps(i, ensure_ascii=False) + "\n")
        fh.flush()
        os.fsync(fh.fileno())
    tmp.replace(caminho)  # troca atômica
    return caminho


def gravar_csv_revisar(revisar: list[dict]) -> Path:
    """Grava o CSV de revisão (BOM UTF-8, separador ;) — padrão Excel BR."""
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
    """Próximo número de versão do dataset (dataset-v1, v2, ...)."""
    glob = _DATASET_DIR.glob("dataset-v*.jsonl") if _DATASET_DIR.exists() else []
    nums = [int(p.stem.split("-v")[1]) for p in glob
            if p.stem.split("-v")[-1].isdigit()]
    return (max(nums) + 1) if nums else 1


def separar(versao: int | None = None) -> dict:
    """Roda a separação. Devolve um resumo com contagens (para o painel)."""
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
                    help="força a versão do dataset (padrão: próxima)")
    args = ap.parse_args(argv)
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    separar(args.versao)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
