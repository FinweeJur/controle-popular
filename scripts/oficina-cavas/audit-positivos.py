"""Decompõe os 'positivos confiantes' por VERDADE DE TERRA (tipo do checkpoint).

Os recortes do dataset de calibração têm rotulo do coletor:
  - tipo=positivo -> processo ANM AUTORIZADO (a gente rotulou positivo
    PORQUE a ANM concedeu lavra ali). Não é cava ilegal: é legal e já mapeada.
  - tipo=negativo -> ponto amostrado FORA de qualquer polígono SIGBMINE e
    fora da classe mineração MapBiomas (ou seja, "achamos que não é cava").

Pergunta que a análise responde: dos que o modelo chama de cava (score>=0.65),
quantos são os autorizados que alimentaram o treino (esperado alto) vs
pontos rotulados NEGATIVOS que o modelo insiste serem cava (falsos positivos
OU cavas reais que a amostragem de negativos deixou passar).

Rode: python scripts/oficina-cavas/audit-positivos.py
"""
from __future__ import annotations

import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
CACHE = RAIZ / "scripts" / ".cache" / "cavas-calibracao"
CHECKPOINT = CACHE / "checkpoint.jsonl"
ANALISADOS = CACHE / "analisados.jsonl"
LIMIAR = 0.65


def _ler_jsonl(p: Path) -> list[dict]:
    out = []
    if not p.exists():
        return out
    for linha in p.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if not linha:
            continue
        try:
            out.append(json.loads(linha))
        except json.JSONDecodeError:
            continue
    return out


def _classifica(an: list[dict], ck: dict) -> dict:
    """Conta, por verdade de terra, quantos o modelo chama de cava."""
    cont = {"positivo_aut": 0, "positivo_conf": 0,
            "negativo": 0, "negativo_flag": 0}
    for a in an:
        score = a.get("score_cava")
        if score is None:
            continue
        tipo = ck.get(a.get("hash"), {}).get("tipo")
        if tipo == "positivo":
            cont["positivo_aut"] += 1
            cont["positivo_conf"] += int(score >= LIMIAR)
        elif tipo == "negativo":
            cont["negativo"] += 1
            cont["negativo_flag"] += int(score >= LIMIAR)
    return cont


def main() -> int:
    ck = {o["hash"]: o for o in _ler_jsonl(CHECKPOINT) if o.get("hash")}
    an = _ler_jsonl(ANALISADOS)
    cont = _classifica(an, ck)

    total_flag = cont["positivo_conf"] + cont["negativo_flag"]
    print("== score >= 0.65 decomposto por verdade de terra ==")
    print(f"  autorizados ANM (positivos do treino): {cont['positivo_aut']}")
    print(f"    -> modelo chama de cava: {cont['positivo_conf']}")
    print(f"  pontos rotulados NEGATIVO (não-mineração): {cont['negativo']}")
    print(f"    -> modelo INSISTE que é cava: {cont['negativo_flag']}")
    print()
    print(f"  total 'positivos confiantes' no geojson: {total_flag}")
    print(f"  suspeitos NOVOS (flag em ponto não-mineração): {cont['negativo_flag']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
