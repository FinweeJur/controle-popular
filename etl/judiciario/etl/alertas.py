"""etl.alertas — cruza monitoramentos ativos com vacância/nomeação (F6).

Rodar:
  python -m etl.alertas          # exige Supabase; grava em `alertas`
  python -m etl.alertas --testar # regressão do casamento, sem banco

Sem referência pronta no /congresso (`etl.alertas` não existe lá ainda —
F6 não foi construída em nenhum dos dois apps até este ponto). Desenho
original sobre o schema já existente (`monitoramentos`, `alertas`,
`vagas`, `cadeiras`, `nomeacoes`).

TRÊS ÂNCORAS DE ALERTA, porque são três eventos civicamente distintos:
  1. `vacancia_projetada` (`cadeira_id`) — a cadeira vai vagar dentro do
     horizonte do usuário, mas AINDA NÃO existe `vagas` (só abre quando a
     data chega, ver `etl.vacancia.recalcular`). É o aviso de MAIOR valor
     do produto: "prepare-se, isso vai abrir".
  2. `vaga_aberta` (`vaga_id`) — a cadeira já vagou de fato.
  3. `nova_indicacao` / `sabatina_concluida` (`nomeacao_id`) — uma
     Mensagem nova chegou ao Senado, ou uma sabatina foi decidida.

LACUNA REGISTRADA: cota de nomeação só é filtrável quando
`nomeacoes.cadeira_id` está ligado — hoje isso só existe para os
registros do seed do STF (`etl.magistrados`). As 130 nomeações reais da
F2 têm `tribunal_id` mas não `cadeira_id` ainda (curadoria pendente,
TODO.md). Por isso o filtro de `nomeacoes` por `monitoramento.cotas` é
melhor esforço (só aplica quando dá) e o de `tribunais` é sempre exato.
"""

from __future__ import annotations

import argparse
import sys
from datetime import date


def _meses_a_frente(d: date, meses: int) -> date:
    """d + N meses, sem depender de `dateutil` (não está no requirements)."""
    mes_total = d.month - 1 + meses
    ano = d.year + mes_total // 12
    mes = mes_total % 12 + 1
    dia = min(d.day, [31, 29 if ano % 4 == 0 and (ano % 100 != 0 or ano % 400 == 0) else 28,
                       31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mes - 1])
    return date(ano, mes, dia)


def _bate_filtro(valor: str | None, filtro: list[str] | None) -> bool:
    """`filtro` vazio/None = aceita qualquer coisa (monitoramento amplo)."""
    if not filtro:
        return True
    return valor is not None and valor in filtro


def casar_vacancias(
    ocupacoes: list[dict],
    vagas_por_cadeira: dict[str, dict],
    monitoramento: dict,
    hoje: date,
) -> list[dict]:
    """Devolve os alertas de vacância/vaga que este monitoramento deve
    receber. Não toca banco — pura função, testável sem Supabase.
    """
    tribunais = monitoramento.get("tribunais")
    cotas = monitoramento.get("cotas")
    limite = _meses_a_frente(hoje, monitoramento.get("horizonte_meses") or 24)

    saida: list[dict] = []
    for o in ocupacoes:
        vp_str = o.get("vacancia_projetada")
        if not vp_str:
            continue
        if not _bate_filtro(o.get("tribunal_id"), tribunais):
            continue
        if not _bate_filtro(o.get("cota"), cotas):
            continue

        vp = date.fromisoformat(vp_str[:10])
        if vp > limite:
            continue  # fora do horizonte pedido

        vaga = vagas_por_cadeira.get(o["cadeira_id"])
        if vaga:
            saida.append({"tipo": "vaga", "vaga_id": vaga["id"], "motivo": "vaga_aberta"})
        else:
            saida.append({"tipo": "cadeira", "cadeira_id": o["cadeira_id"], "motivo": "vacancia_projetada"})
    return saida


def casar_nomeacoes(nomeacoes: list[dict], monitoramento: dict) -> list[dict]:
    """Idem para nomeações — filtro por tribunal sempre; por cota só
    quando `nomeacoes.cadeira_id` estiver ligado (ver módulo docstring).
    """
    tribunais = monitoramento.get("tribunais")
    cotas = monitoramento.get("cotas")

    saida: list[dict] = []
    for n in nomeacoes:
        if not _bate_filtro(n.get("tribunal_id"), tribunais):
            continue
        if cotas and n.get("cadeira_cota") is not None and not _bate_filtro(n.get("cadeira_cota"), cotas):
            continue
        motivo = "sabatina_concluida" if n.get("resultado") else "nova_indicacao"
        saida.append({"tipo": "nomeacao", "nomeacao_id": n["id"], "motivo": motivo})
    return saida


def rodar() -> int:
    from etl.common import get_supabase_client, fetch_all, upsert_em_lotes

    sb = get_supabase_client()
    hoje = date.today()

    monitoramentos = fetch_all(lambda: sb.table("monitoramentos").select("*").eq("ativo", True))
    if not monitoramentos:
        print("[alertas] nenhum monitoramento ativo")
        return 0

    ocupacoes = fetch_all(lambda: sb.table("vw_vacancia").select("*").eq("atual", True))
    vagas = fetch_all(lambda: sb.table("vagas").select("id,cadeira_id"))
    vagas_por_cadeira = {v["cadeira_id"]: v for v in vagas if v.get("cadeira_id")}
    nomeacoes = fetch_all(lambda: sb.table("nomeacoes").select("id,tribunal_id,cadeira_id,resultado"))

    # Melhor esforço: liga cota via cadeira_id quando existe.
    cadeiras = fetch_all(lambda: sb.table("cadeiras").select("id,cota"))
    cota_por_cadeira = {c["id"]: c["cota"] for c in cadeiras}
    for n in nomeacoes:
        n["cadeira_cota"] = cota_por_cadeira.get(n.get("cadeira_id")) if n.get("cadeira_id") else None

    total = 0
    for m in monitoramentos:
        candidatos = casar_vacancias(ocupacoes, vagas_por_cadeira, m, hoje) + casar_nomeacoes(nomeacoes, m)
        if not candidatos:
            continue

        linhas = []
        for c in candidatos:
            base = {"monitoramento_id": m["id"], "user_id": m["user_id"], "motivo": c["motivo"]}
            if c["tipo"] == "cadeira":
                linhas.append({**base, "cadeira_id": c["cadeira_id"]})
            elif c["tipo"] == "vaga":
                linhas.append({**base, "vaga_id": c["vaga_id"]})
            else:
                linhas.append({**base, "nomeacao_id": c["nomeacao_id"]})

        # As 3 unique partial indexes da 0005 fazem o upsert ser idempotente
        # por âncora; sem `on_conflict` explícito (índice parcial, não dá
        # pra nomear via `on_conflict=` do PostgREST), inserimos ignorando
        # duplicata — a constraint do banco recusa a repetida.
        for lote_inicio in range(0, len(linhas), 200):
            lote = linhas[lote_inicio : lote_inicio + 200]
            try:
                sb.table("alertas").insert(lote).execute()
                total += len(lote)
            except Exception as e:
                # 23505 = unique_violation — normal numa segunda rodada
                # (o alerta já existe). Qualquer outro erro propaga.
                if "23505" not in str(e) and "duplicate key" not in str(e).lower():
                    raise
                # Insere um a um pra separar os novos dos já existentes
                # dentro do lote (um só duplicado não pode descartar o
                # resto que era novo).
                for linha in lote:
                    try:
                        sb.table("alertas").insert(linha).execute()
                        total += 1
                    except Exception as e2:
                        if "23505" not in str(e2) and "duplicate key" not in str(e2).lower():
                            raise

    print(f"[alertas] {total} alerta(s) novo(s) para {len(monitoramentos)} monitoramento(s) ativo(s)")
    return total


# ─────────────────────────────────────────────────────────────────────
# Regressão — sem Supabase.
# ─────────────────────────────────────────────────────────────────────
def testar(verboso: bool = True) -> bool:
    ok = True
    hoje = date(2026, 7, 25)

    def checa(nome: str, cond: bool, extra: str = ""):
        nonlocal ok
        if cond:
            if verboso:
                print(f"[ok]    {nome}")
        else:
            ok = False
            print(f"[FALHA] {nome} {extra}")

    checa("meses_a_frente simples", _meses_a_frente(hoje, 6) == date(2027, 1, 25))
    checa("meses_a_frente 29/fev", _meses_a_frente(date(2024, 1, 31), 1) == date(2024, 2, 29))
    checa("meses_a_frente vira ano bissexto->comum", _meses_a_frente(date(2024, 2, 29), 12) == date(2025, 2, 28))

    ocupacoes = [
        {"cadeira_id": "c1", "tribunal_id": "stf", "cota": "livre", "vacancia_projetada": "2028-04-26"},
        {"cadeira_id": "c2", "tribunal_id": "stj", "cota": "terco_trf", "vacancia_projetada": "2027-01-01"},
        {"cadeira_id": "c3", "tribunal_id": "tst", "cota": "carreira_trt", "vacancia_projetada": "2050-01-01"},
        {"cadeira_id": "c4", "tribunal_id": "stf", "cota": "livre", "vacancia_projetada": None},
    ]
    vagas = {"c2": {"id": "vaga-2", "cadeira_id": "c2"}}  # c2 já tem vaga aberta

    # Monitoramento amplo (sem filtro), horizonte 24 meses: pega c1 (21
    # meses à frente) e c2 (que já tem vaga -> vira alerta de vaga, não
    # de cadeira). c3 fica de fora (muito longe). c4 fica de fora (sem
    # data).
    m_amplo = {"tribunais": None, "cotas": None, "horizonte_meses": 24}
    r = casar_vacancias(ocupacoes, vagas, m_amplo, hoje)
    tipos = sorted((x["tipo"], x["motivo"]) for x in r)
    checa(
        "monitoramento amplo: c1 projetada + c2 vaga_aberta, c3/c4 fora",
        tipos == [("cadeira", "vacancia_projetada"), ("vaga", "vaga_aberta")],
        str(tipos),
    )

    m_stf = {"tribunais": ["stf"], "cotas": None, "horizonte_meses": 24}
    r2 = casar_vacancias(ocupacoes, vagas, m_stf, hoje)
    checa("filtro por tribunal (só STF)", len(r2) == 1 and r2[0]["cadeira_id"] == "c1", str(r2))

    m_curto = {"tribunais": None, "cotas": None, "horizonte_meses": 3}
    r3 = casar_vacancias(ocupacoes, vagas, m_curto, hoje)
    checa("horizonte curto exclui tudo (nada em 3 meses)", r3 == [], str(r3))

    nomeacoes = [
        {"id": "n1", "tribunal_id": "stf", "resultado": None, "cadeira_cota": None},
        {"id": "n2", "tribunal_id": "stj", "resultado": "rejeitado_plenario", "cadeira_cota": "terco_trf"},
        {"id": "n3", "tribunal_id": "tst", "resultado": None, "cadeira_cota": None},
    ]
    r4 = casar_nomeacoes(nomeacoes, {"tribunais": ["stf", "stj"], "cotas": None, "horizonte_meses": 24})
    ids = sorted(x["nomeacao_id"] for x in r4)
    checa("nomeações: filtro por tribunal pega n1+n2, não n3", ids == ["n1", "n2"], str(ids))
    motivo_n2 = next(x["motivo"] for x in r4 if x["nomeacao_id"] == "n2")
    checa("resultado presente -> sabatina_concluida", motivo_n2 == "sabatina_concluida")
    motivo_n1 = next(x["motivo"] for x in r4 if x["nomeacao_id"] == "n1")
    checa("sem resultado -> nova_indicacao", motivo_n1 == "nova_indicacao")

    r5 = casar_nomeacoes(nomeacoes, {"tribunais": None, "cotas": ["terco_tj"], "horizonte_meses": 24})
    checa("cota não bate (n2 é terco_trf, filtro terco_tj) exclui n2", all(x["nomeacao_id"] != "n2" for x in r5))

    print(f"\n{'TODOS OS CASOS PASSARAM' if ok else 'HA FALHAS'} (10 casos)")
    return ok


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--testar", action="store_true")
    args = p.parse_args()
    if args.testar:
        sys.exit(0 if testar() else 1)
    rodar()
