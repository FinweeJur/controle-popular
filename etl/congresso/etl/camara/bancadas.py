"""etl.camara.bancadas — frentes parlamentares, blocos e federações.

Rodar: `python -m etl.camara.bancadas`

As **frentes parlamentares** são o que o usuário chama de "bancadas
temáticas" (ruralista, evangélica, da segurança pública, dos direitos
humanos...). Não são órgãos regimentais, mas são o agrupamento que de
fato explica por que um bloco de deputados sem partido em comum vota
junto num tema. A Câmara publica todas em `/frentes`, e
`/frentes/{id}/membros` traz cada membro **com o título** (Coordenador,
Presidente...) — confirmado ao vivo 2026-07-22.

São muitas frentes (320 na 57ª legislatura) e cada uma exige uma
requisição de membros, então este módulo é semanal, não diário.

RATE LIMIT (2026-07-23): disparar as 320 requisições de membros em
sequência rápida faz a API da Câmara estrangular — a primeira execução
falhou em TODAS as 320 com RetryError, e os mesmos endpoints voltaram a
responder 200 assim que a rajada parou. É o mesmo comportamento que o app
irmão viu no PROLEGIS. Por isso há uma pausa entre requisições (`PAUSA_S`)
— deixa a coleta em ~2-3 min em vez de segundos, mas é a diferença entre
320 vínculos e zero.
"""
import argparse
import time

from etl.camara import client
from etl.common import fetch_all, get_supabase_client, registrar_fonte, upsert_em_lotes

# Pausa entre as requisições de membros de cada frente, para não estrangular.
# 1s (não 0.4): a 0.4 o throttle ainda pegava a rajada de 320. Deixa a
# coleta em ~6 min, aceitável num job semanal, e o retry paciente do client
# cobre o resto se ainda assim estrangular.
PAUSA_S = 1.0

LEGISLATURA_ATUAL = 57


def _mapa_parlamentares(sb) -> dict[str, str]:
    """id_externo → uuid, para resolver as FKs de bancada_membros."""
    linhas = fetch_all(
        lambda: sb.table("parlamentares").select("id, id_externo").eq("casa_id", client.CASA_ID)
    )
    return {linha["id_externo"]: linha["id"] for linha in linhas}


def sync(legislatura: int = LEGISLATURA_ATUAL, com_membros: bool = True) -> int:
    sb = get_supabase_client()

    bancadas: list[dict] = []
    for f in client.paginar("/frentes", idLegislatura=legislatura):
        bancadas.append(
            {
                "casa_id": client.CASA_ID,
                "id_externo": str(f["id"]),
                "tipo": "frente",
                "nome": f.get("titulo"),
                "legislatura": f.get("idLegislatura") or legislatura,
            }
        )
    for b in client.paginar("/blocos", idLegislatura=legislatura):
        bancadas.append(
            {
                "casa_id": client.CASA_ID,
                "id_externo": str(b["id"]),
                # A API marca federação partidária com uma flag em vez de
                # um tipo próprio; separamos porque a leitura política é
                # diferente (federação é vínculo obrigatório, bloco não).
                "tipo": "federacao" if b.get("federacao") else "bloco",
                "nome": b.get("nome"),
                "legislatura": int(b.get("idLegislatura") or legislatura),
            }
        )
    for p in client.paginar("/partidos", idLegislatura=legislatura):
        bancadas.append(
            {
                "casa_id": client.CASA_ID,
                "id_externo": str(p["id"]),
                "tipo": "partido",
                "nome": p.get("sigla"),
                "legislatura": legislatura,
            }
        )

    upsert_em_lotes(sb, "bancadas", bancadas, on_conflict="casa_id,tipo,id_externo")
    print(f"[camara.bancadas] {len(bancadas)} bancadas sincronizadas")

    if not com_membros:
        return len(bancadas)

    salvas = fetch_all(
        lambda: sb.table("bancadas")
        .select("id, id_externo, tipo")
        .eq("casa_id", client.CASA_ID)
        .eq("tipo", "frente")
    )
    parlamentares = _mapa_parlamentares(sb)
    if not parlamentares:
        print("[camara.bancadas] nenhum parlamentar no banco — rode etl.camara.parlamentares antes")
        return len(bancadas)

    membros: list[dict] = []
    falhas = 0
    for i, bancada in enumerate(salvas):
        if i:
            time.sleep(PAUSA_S)  # não estrangular a API (ver docstring)
        try:
            # itens=None: este endpoint rejeita o parametro com 400 e
            # devolve a lista inteira de uma vez (~200 membros por frente).
            lista = list(
                client.paginar(f"/frentes/{bancada['id_externo']}/membros", itens=None)
            )
        except Exception as e:
            # Uma frente com endpoint quebrado (visto ao vivo 2026-07-23:
            # HTTPError persistente após os retries) não pode derrubar a
            # coleta das outras ~600 frentes. Conta a falha e segue — os
            # vínculos já coletados são gravados no fim de qualquer jeito.
            falhas += 1
            print(f"[camara.bancadas] frente {bancada['id_externo']} sem membros ({type(e).__name__})")
            continue
        for m in lista:
            pid = parlamentares.get(str(m.get("id")))
            if not pid:
                continue  # deputado de legislatura anterior, fora do escopo
            membros.append(
                {
                    "bancada_id": bancada["id"],
                    "parlamentar_id": pid,
                    "papel": m.get("titulo"),
                }
            )

    if membros:
        upsert_em_lotes(
            sb, "bancada_membros", membros, on_conflict="bancada_id,parlamentar_id"
        )
    print(
        f"[camara.bancadas] {len(membros)} vínculos de membro sincronizados"
        + (f" ({falhas} frente(s) sem membros)" if falhas else "")
    )
    registrar_fonte(sb, "camara_frentes", f"{client.BASE}/frentes", "bancadas")
    return len(bancadas)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--legislatura", type=int, default=LEGISLATURA_ATUAL)
    p.add_argument("--sem-membros", action="store_true")
    args = p.parse_args()
    sync(args.legislatura, com_membros=not args.sem_membros)
