"""etl.vacancia — projeção de vacância e abertura de vagas (F4).

Rodar:
  python -m etl.vacancia --testar          # regressão, sem banco
  python -m etl.vacancia                    # recalcula e abre vagas (exige Supabase)

Espelha lib/regras.ts::vacanciaCompulsoria — as duas leem o MESMO número
(75 anos) de regras/regras.json. Se divergirem, é bug; por isso o valor
não é hardcoded aqui, é lido da régua.

O CÁLCULO em si é uma view no Postgres (vw_vacancia, migration 0001) —
este módulo existe para (a) ABRIR `vagas` quando a data projetada chega ou
uma vacância efetiva é registrada, e (b) oferecer a mesma função em Python
para scripts e testes. A tela lê a view; o ETL usa isto.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date
from pathlib import Path

_REGRAS = json.loads(
    (Path(__file__).resolve().parents[3] / "apps" / "web" / "lib" / "judiciario" / "regras.json").read_text("utf-8")
)
COMPULSORIA_ANOS: int = _REGRAS["idades"]["aposentadoria_compulsoria"]["anos"]
TETO_INDICACAO: int = _REGRAS["idades"]["teto_indicacao"]["anos"]
MINIMA_INDICACAO: int = _REGRAS["idades"]["minima_indicacao"]["anos"]
VERSAO_REGRA: str = _REGRAS["versao"]


def _mais_anos(d: date, anos: int) -> date:
    """d + N anos, tratando 29/fev (nascido em bissexto → 28/fev)."""
    try:
        return d.replace(year=d.year + anos)
    except ValueError:
        return d.replace(year=d.year + anos, day=28)


def vacancia_compulsoria(data_nascimento: str | date | None) -> date | None:
    """nascimento + 75 anos. None quando o nascimento é desconhecido —
    estado legítimo, nunca chutado."""
    if not data_nascimento:
        return None
    d = data_nascimento if isinstance(data_nascimento, date) else date.fromisoformat(data_nascimento)
    return _mais_anos(d, COMPULSORIA_ANOS)


def idade_em(data_nascimento: str | date, em: date) -> int:
    d = data_nascimento if isinstance(data_nascimento, date) else date.fromisoformat(data_nascimento)
    return em.year - d.year - ((em.month, em.day) < (d.month, d.day))


def elegivel_indicacao(data_nascimento: str | date | None, em: date) -> bool:
    if not data_nascimento:
        return False
    return MINIMA_INDICACAO <= idade_em(data_nascimento, em) < TETO_INDICACAO


_MANDATOS = _REGRAS["presidentes"]["mandatos"]


def presidente_em(data_mensagem: str | date | None) -> str | None:
    """Presidente da República na data de uma Mensagem de indicação.

    A API do Senado nunca dá o NOME do Presidente (só `autoria:
    'Presidência da República'`), então isto é o que preenche
    `nomeacoes.autoridade_nomeante` para o poder de indicação — de forma
    determinística, pela data, nunca por LLM ou suposição.
    """
    if not data_mensagem:
        return None
    d = data_mensagem if isinstance(data_mensagem, date) else date.fromisoformat(data_mensagem)
    for m in _MANDATOS:
        inicio = date.fromisoformat(m["inicio"]) if m["inicio"] else date.min
        fim = date.fromisoformat(m["fim"]) if m["fim"] else date.max
        if inicio <= d < fim:
            return m["nome"]
    return None


# ── regressão ─────────────────────────────────────────────────
def testar() -> bool:
    ok = True

    def checa(nome, cond, det=""):
        nonlocal ok
        if cond:
            print(f"[ok]    {nome}")
        else:
            ok = False
            print(f"[FALHA] {nome} {det}")

    # Ministro nascido em 1955-06-01 vaga em 2030-06-01.
    checa(
        "compulsoria 1955->2030",
        vacancia_compulsoria("1955-06-01") == date(2030, 6, 1),
        str(vacancia_compulsoria("1955-06-01")),
    )
    # 29 de fevereiro não estoura.
    checa(
        "compulsoria 29/fev",
        vacancia_compulsoria("1956-02-29") == date(2031, 2, 28),
        str(vacancia_compulsoria("1956-02-29")),
    )
    checa("nascimento nulo -> None", vacancia_compulsoria(None) is None)
    # Elegibilidade: 69 anos elegível, 70 não.
    checa("69 anos elegível", elegivel_indicacao("1956-01-01", date(2025, 6, 1)) is True)
    checa("70 anos NÃO elegível", elegivel_indicacao("1955-01-01", date(2025, 6, 1)) is False)
    checa("34 anos NÃO elegível", elegivel_indicacao("1991-06-01", date(2025, 6, 1)) is False)

    # presidente_em: casos reais do corpus (validam contra nomeações conhecidas).
    checa(
        "presidente 2017-03-22 (Moraes) = Temer",
        presidente_em("2017-03-22") == "Michel Temer",
        str(presidente_em("2017-03-22")),
    )
    checa(
        "presidente 2011-03-03 (Fux) = Dilma",
        presidente_em("2011-03-03") == "Dilma Rousseff",
    )
    checa(
        "presidente 2002-06-20 (Gilmar) = FHC",
        presidente_em("2002-06-20") == "Fernando Henrique Cardoso",
    )
    checa(
        "presidente 2024-02-22 (Dino) = Lula (3o mandato)",
        presidente_em("2024-02-22") == "Luiz Inácio Lula da Silva",
    )
    checa(
        "presidente 2020-11-05 (Nunes Marques) = Bolsonaro",
        presidente_em("2020-11-05") == "Jair Bolsonaro",
    )
    checa("presidente None -> None", presidente_em(None) is None)

    print(f"\n{'TODOS OS CASOS PASSARAM' if ok else 'HA FALHAS'} (régua v{VERSAO_REGRA})")
    return ok


def recalcular() -> int:
    """Abre `vagas` para projeções cuja data já chegou. Exige Supabase."""
    from etl.common import get_supabase_client, upsert_em_lotes, fetch_all

    sb = get_supabase_client()
    hoje = date.today()
    # vw_vacancia já entrega a data projetada por ocupação atual.
    linhas = fetch_all(
        lambda: sb.table("vw_vacancia").select("*").eq("atual", True)
    )
    abrir = []
    for o in linhas:
        vp = o.get("vacancia_projetada")
        if vp and vp <= hoje.isoformat():
            abrir.append(
                {
                    "cadeira_id": o["cadeira_id"],
                    "data_abertura": vp,
                    "motivo": "compulsoria_75",
                    "fase": "aberta",
                }
            )
    if abrir:
        upsert_em_lotes(sb, "vagas", abrir, on_conflict="cadeira_id,data_abertura")
    print(f"[vacancia] {len(abrir)} vaga(s) aberta(s) por compulsória (régua v{VERSAO_REGRA})")
    return len(abrir)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--testar", action="store_true")
    args = p.parse_args()
    if args.testar:
        sys.exit(0 if testar() else 1)
    recalcular()
