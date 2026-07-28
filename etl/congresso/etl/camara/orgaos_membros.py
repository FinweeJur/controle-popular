"""etl.camara.orgaos_membros — quem compõe cada comissão agora.

Rodar: `python -m etl.camara.orgaos_membros`

Existe para resolver um problema concreto do gerador de ofício: sem isto,
`sugerirDestinatarios()` só tinha o AUTOR do PL para sugerir como
destinatário — e pedir para o autor de um projeto aprovar o próprio
projeto não serve para nada. Quem decide agora é o colegiado onde a
matéria está parada, e a API devolve exatamente os papéis que importam:

    GET /orgaos/{id}/membros
    → {"titulo": "Presidente" | "1º Vice-Presidente" | ... |
                  "Titular" | "Suplente", ...}

Confirmado ao vivo 2026-07-24 na CAPADR (id 2001): Presidente + 3
Vice-Presidentes nomeados, 42 titulares, 48 suplentes — todos com e-mail.
A presidência e as vice-presidências são o alvo certo para o ofício: são
poucas pessoas, concretas, e é literalmente quem decide a pauta.

RATE LIMIT: mesma lição de `etl.camara.bancadas` — uma requisição de
membros por comissão em rajada estrangula a API. Mesma pausa de 1s.

Depende de `orgao_membros` (migration `0004_orgao_membros.sql`) e de
`etl.camara.orgaos`/`etl.camara.parlamentares` já terem rodado.
"""
import argparse
import time

from etl.camara import client
from etl.common import fetch_all, get_supabase_client, registrar_fonte, upsert_em_lotes

# Mesmo valor de etl.camara.bancadas — a mesma API, o mesmo throttle.
PAUSA_S = 1.0


def sync() -> int:
    sb = get_supabase_client()

    comissoes = fetch_all(
        lambda: sb.table("orgaos").select("id, id_externo, sigla").eq("casa_id", client.CASA_ID)
    )
    if not comissoes:
        print("[camara.orgaos_membros] nenhuma comissão no banco — rode etl.camara.orgaos antes")
        return 0

    parlamentares = {
        r["id_externo"]: r["id"]
        for r in fetch_all(
            lambda: sb.table("parlamentares").select("id, id_externo").eq("casa_id", client.CASA_ID)
        )
    }
    if not parlamentares:
        print("[camara.orgaos_membros] nenhum parlamentar no banco — rode etl.camara.parlamentares antes")
        return 0

    membros: list[dict] = []
    falhas = 0
    for i, comissao in enumerate(comissoes):
        if i:
            time.sleep(PAUSA_S)
        try:
            lista = list(client.paginar(f"/orgaos/{comissao['id_externo']}/membros"))
        except Exception as e:
            # Uma comissão com endpoint fora do ar não pode derrubar a
            # coleta das outras — mesma defesa de etl.camara.bancadas.
            falhas += 1
            print(f"[camara.orgaos_membros] {comissao.get('sigla')} sem membros ({type(e).__name__})")
            continue
        for m in lista:
            pid = parlamentares.get(str(m.get("id")))
            if not pid:
                continue  # deputado de legislatura anterior, fora do escopo
            membros.append(
                {
                    "orgao_id": comissao["id"],
                    "parlamentar_id": pid,
                    "papel": m.get("titulo"),
                }
            )

    if membros:
        upsert_em_lotes(sb, "orgao_membros", membros, on_conflict="orgao_id,parlamentar_id")
    print(
        f"[camara.orgaos_membros] {len(membros)} vínculos sincronizados"
        + (f" ({falhas} comissão(ões) sem membros)" if falhas else "")
    )
    registrar_fonte(sb, "camara_orgaos_membros", f"{client.BASE}/orgaos/{{id}}/membros", "comissoes")
    return len(membros)


if __name__ == "__main__":
    argparse.ArgumentParser().parse_args()
    sync()
