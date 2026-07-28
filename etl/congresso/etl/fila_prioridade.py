"""etl.fila_prioridade — monta a fila de análise em massa, na ordem pedida
pelo usuário (2026-07-24):

  1. proposições em pauta nas comissões (pauta real da Câmara, com proxy
     documentado para quando o Congresso está em recesso)
  2. até N em tramitação ativa (comissão viva, movimento mais recente)
  3. até N apresentadas mais recentemente
  4. até N por tema editorial (7 temas de `rubrica/temas.json`)

Cada proposição entra numa ÚNICA camada — a primeira em que se qualifica —
mesmo que sirva a mais de uma (uma proposição de mineração parada há dias
numa comissão movimentada conta para a camada 2, não para "mineração" e
"tramitação ativa" ao mesmo tempo). Isso evita analisar a mesma proposição
duas vezes; depois de analisada, ela aparece em TODOS os temas a que
pertence de qualquer jeito, via `casaComTema` na UI.

Rodar:
    python -m etl.fila_prioridade                    # imprime o resumo
    python -m etl.fila_prioridade --json > fila.json  # a lista completa
"""
import argparse
import json

from etl import temas as temas_mod
from etl.camara import client
from etl.common import fetch_all, get_supabase_client

CAMPOS = (
    "id, id_externo, casa_id, identificacao, ementa, ementa_detalhada, keywords, "
    "temas_oficiais, texto_integral, ano, tramitando, orgao_atual, "
    "data_apresentacao, data_ultima_tramitacao"
)


def _analisadas(sb) -> set[str]:
    return {
        r["proposicao_id"]
        for r in fetch_all(lambda: sb.table("analises").select("proposicao_id"))
    }


def _pauta_real(dias: int = 60, teto_eventos: int = 80) -> list[str]:
    """Ids externos (id_camara) das proposições com pauta marcada nos
    próximos `dias`. Devolve lista vazia se não achar nada — é o estado
    normal em recesso, não um erro."""
    from datetime import date, timedelta

    hoje = date.today()
    fim = hoje + timedelta(days=dias)
    try:
        eventos = client.get(
            "/eventos", dataInicio=hoje.isoformat(), dataFim=fim.isoformat(), itens=teto_eventos
        ).get("dados", [])
    except Exception as e:
        print(f"[fila_prioridade] falha ao buscar eventos ({type(e).__name__}) — seguindo com proxy")
        return []

    ids: list[str] = []
    for ev in eventos:
        try:
            pauta = client.get(f"/eventos/{ev['id']}/pauta").get("dados", [])
        except Exception:
            continue
        for item in pauta:
            prop = item.get("proposicao_") or item.get("proposicao") or {}
            if prop.get("id"):
                ids.append(str(prop["id"]))
    return list(dict.fromkeys(ids))  # dedup preservando ordem


def montar_fila(
    limite_tramitacao: int = 200,
    limite_recentes: int = 100,
    limite_por_tema: int = 50,
) -> dict[str, list[dict]]:
    sb = get_supabase_client()
    analisadas = _analisadas(sb)

    todas = fetch_all(lambda: sb.table("proposicoes").select(CAMPOS).eq("casa_id", "camara"))
    todas = [p for p in todas if p["id"] not in analisadas]

    usadas: set[str] = set()
    fila: dict[str, list[dict]] = {}

    # ── 1. Pauta ────────────────────────────────────────────────
    ids_pauta = set(_pauta_real())
    por_id_externo = {p["id_externo"]: p for p in todas}
    pauta = [por_id_externo[i] for i in ids_pauta if i in por_id_externo]
    if pauta:
        # Checa a LISTA RESOLVIDA, não `ids_pauta` cru: um evento pode
        # pautar um tipo que não sincronizamos (ex.: PRL — parecer, não um
        # dos 6 tipos de `TIPOS_PADRAO`), e nesse caso `ids_pauta` vem não
        # vazio mas nada bate em `todas`. Sem esta checagem a camada
        # "pauta" ficaria silenciosamente vazia (0 proposições) em vez de
        # cair no proxy — visto ao vivo 2026-07-24: o único evento
        # deliberativo do período pautava um PRL de 2014, fora do escopo
        # sincronizado.
        origem = "pauta real da Câmara"
    else:
        # PROXY documentado: sem reunião deliberativa marcada com pauta
        # publicada (verificado ao vivo 2026-07-24 — só 1 evento
        # deliberativo até meados de setembro, com 1 item de 2014 na
        # pauta — o Congresso está em recesso), a melhor aproximação de
        # "o que está em pauta" é o que está genuinamente sendo mexido: a
        # proposição precisa estar numa comissão viva (`orgao_atual`
        # preenchido) e ter tido tramitação recente.
        candidatas = sorted(
            (p for p in todas if p.get("orgao_atual") and p.get("data_ultima_tramitacao")),
            key=lambda p: p["data_ultima_tramitacao"],
            reverse=True,
        )
        pauta = candidatas[:limite_por_tema]
        origem = f"PROXY (recesso — sem pauta real; comissão viva + tramitação mais recente, top {limite_por_tema})"

    fila["pauta"] = pauta
    usadas.update(p["id"] for p in pauta)
    print(f"[fila_prioridade] pauta: {len(pauta)} proposições ({origem})")

    # ── 2. Tramitação ativa ────────────────────────────────────
    restantes = [p for p in todas if p["id"] not in usadas]
    tramitacao = sorted(
        (p for p in restantes if p.get("orgao_atual") and p.get("data_ultima_tramitacao")),
        key=lambda p: p["data_ultima_tramitacao"],
        reverse=True,
    )[:limite_tramitacao]
    fila["tramitacao_ativa"] = tramitacao
    usadas.update(p["id"] for p in tramitacao)
    print(f"[fila_prioridade] tramitação ativa: {len(tramitacao)} proposições")

    # ── 3. Mais recentes ────────────────────────────────────────
    restantes = [p for p in todas if p["id"] not in usadas]
    recentes = sorted(
        (p for p in restantes if p.get("data_apresentacao")),
        key=lambda p: p["data_apresentacao"],
        reverse=True,
    )[:limite_recentes]
    fila["recentes"] = recentes
    usadas.update(p["id"] for p in recentes)
    print(f"[fila_prioridade] mais recentes: {len(recentes)} proposições")

    # ── 4. Por tema ──────────────────────────────────────────────
    for tema in temas_mod.TEMAS:
        restantes = [p for p in todas if p["id"] not in usadas]
        casam = sorted(
            (p for p in restantes if temas_mod.casa_com_tema(tema, p)),
            key=lambda p: p.get("data_apresentacao") or "",
            reverse=True,
        )[:limite_por_tema]
        fila[f"tema:{tema['slug']}"] = casam
        usadas.update(p["id"] for p in casam)
        print(f"[fila_prioridade] tema {tema['nome']}: {len(casam)} proposições")

    total = sum(len(v) for v in fila.values())
    print(f"[fila_prioridade] TOTAL: {total} proposições em {len(fila)} camadas")
    return fila


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--tramitacao", type=int, default=200)
    ap.add_argument("--recentes", type=int, default=100)
    ap.add_argument("--por-tema", type=int, default=50)
    ap.add_argument("--json", action="store_true", help="imprime a fila completa em JSON no stdout")
    a = ap.parse_args()

    resultado = montar_fila(a.tramitacao, a.recentes, a.por_tema)
    if a.json:
        print(json.dumps(resultado, ensure_ascii=False))
