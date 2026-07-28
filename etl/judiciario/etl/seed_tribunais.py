"""etl.seed_tribunais — gera 0003_seed_tribunais.sql a partir de regras.json.

Rodar:
  python -m etl.seed_tribunais > supabase/migrations/0003_seed_tribunais.sql

POR QUE GERAR, e não escrever à mão: as cotas e as contagens de cadeira
vivem em `regras/regras.json` (a régua canônica, versão carimbada). Se o
seed fosse digitado à parte, uma mudança na régua (nova composição, EC)
deixaria o banco em desacordo com a metodologia publicada em /metodologia,
que lê o MESMO arquivo. Gerar mantém as duas pontas amarradas — é a mesma
disciplina do rubrica.json do /congresso.

O seed cria, para cada tribunal, N cadeiras numeradas com a cota certa,
expandindo o dicionário `cotas` (ex.: STJ → 11 terco_trf + 11 terco_tj +
6 terco_oab + 5 terco_mp = 33 cadeiras). Ocupantes e datas de nascimento
NÃO entram aqui — são a curadoria da F3 (etl.magistrados).
"""

from __future__ import annotations

import json
from pathlib import Path

REGRAS = json.loads((Path(__file__).resolve().parents[3] / "apps" / "web" / "lib" / "judiciario" / "regras.json").read_text("utf-8"))


def _sql_str(v) -> str:
    if v is None:
        return "null"
    return "'" + str(v).replace("'", "''") + "'"


def gerar() -> str:
    linhas: list[str] = []
    linhas.append("-- Seed de tribunais e cadeiras — GERADO por etl/seed_tribunais.py")
    linhas.append(f"-- a partir de regras/regras.json versão {REGRAS['versao']}. NÃO editar à mão.")
    linhas.append("-- Rode depois de 0001 e 0002.\n")
    linhas.append("set search_path = judiciario, public, extensions;\n")

    # ── tribunais ─────────────────────────────────────────────
    ramo_meta = {
        "stf": ("constitucional", "superior", "presidente_republica", True),
        "stj": ("superior", "superior", "presidente_republica", True),
        "tst": ("trabalho", "superior", "presidente_republica", True),
        "stm": ("militar", "superior", "presidente_republica", True),
        "tse": ("eleitoral", "superior", "eletiva", False),
    }
    linhas.append(
        "insert into tribunais "
        "(id, ramo, instancia, esfera, nome, sigla, n_cadeiras, "
        "autoridade_nomeante, exige_sabatina_senado, base_legal) values"
    )
    vals = []
    for sig, t in REGRAS["tribunais"].items():
        ramo, inst, nomeante, sabatina = ramo_meta[sig]
        vals.append(
            f"  ({_sql_str(sig)}, {_sql_str(ramo)}, {_sql_str(inst)}, 'federal', "
            f"{_sql_str(t['nome'])}, {_sql_str(sig.upper())}, {t['cadeiras']}, "
            f"{_sql_str(nomeante)}, {str(sabatina).lower()}, {_sql_str(t['base_legal'])})"
        )
    linhas.append(",\n".join(vals))
    linhas.append("on conflict (id) do update set")
    linhas.append("  n_cadeiras = excluded.n_cadeiras, base_legal = excluded.base_legal,")
    linhas.append("  nome = excluded.nome;\n")

    # ── cadeiras (expandidas por cota) ────────────────────────
    linhas.append("-- Cadeiras: N por tribunal, numeradas, com a cota da régua.")
    linhas.append("-- Idempotente por (tribunal_id, numero).")
    for sig, t in REGRAS["tribunais"].items():
        linhas.append(f"\n-- {sig.upper()} · {t['nome']} ({t['cadeiras']} cadeiras)")
        linhas.append(f"insert into cadeiras (tribunal_id, numero, cota) values")
        cvals = []
        n = 0
        for cota, qtd in t["cotas"].items():
            for _ in range(qtd):
                n += 1
                cvals.append(f"  ({_sql_str(sig)}, {n}, {_sql_str(cota)})")
        linhas.append(",\n".join(cvals))
        linhas.append("on conflict (tribunal_id, numero) do update set cota = excluded.cota;")

    linhas.append("\n-- Conferência: contagem de cadeiras por tribunal deve bater com n_cadeiras.")
    linhas.append(
        "select t.id, t.n_cadeiras, count(c.id) as cadeiras_criadas\n"
        "  from tribunais t left join cadeiras c on c.tribunal_id = t.id\n"
        "  group by t.id, t.n_cadeiras order by t.id;"
    )
    return "\n".join(linhas) + "\n"


if __name__ == "__main__":
    print(gerar(), end="")
