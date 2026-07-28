"""etl.camara.votacoes — votações e votos nominais.

Rodar:
  python -m etl.camara.votacoes --dias 30
  python -m etl.camara.votacoes --desde 2026-01-01

Voto nominal é o dado que fecha o ciclo do app: a análise diz o que a
proposição faz com os direitos, e o voto diz quem apoiou. Sem isso o
perfil de um parlamentar reflete só o que ele PROPÔS — e a maior parte da
atuação legislativa é votar o que os outros propõem.

DOIS LIMITES DA FONTE, os dois verificados ao vivo em 2026-07-22:

1. **`/votacoes` devolve 504 em janela de data larga.** Um mês inteiro de
   uma vez estoura o timeout do upstream da Câmara; uma semana passa. Por
   isso o período é fatiado em janelas de `JANELA_DIAS` — não é
   paranoia, é a única forma de a chamada voltar.
2. **Nem toda votação tem voto nominal.** Simbólicas e requerimentos
   deferidos por despacho aparecem em `/votacoes` mas devolvem `/votos`
   vazio (confirmado: as votações de CCOM e SECAP(SGM) da amostra vieram
   todas com zero; uma de PLEN veio com 317). Isso não é erro — a votação
   é gravada mesmo assim, só não gera linhas em `votos`.
"""
import argparse
from datetime import date, datetime, timedelta

# Uma semana passa; um mês dá 504. Ver nota 1 no topo.
JANELA_DIAS = 7

from etl.camara import client
from etl.common import fetch_all, get_supabase_client, registrar_fonte, upsert_em_lotes


def _janelas(inicio: str, fim: str) -> list[tuple[str, str]]:
    """Fatia [inicio, fim] em janelas de `JANELA_DIAS`. Ver nota 1."""
    d0 = datetime.fromisoformat(inicio).date()
    d1 = datetime.fromisoformat(fim).date()
    janelas = []
    while d0 <= d1:
        d2 = min(d0 + timedelta(days=JANELA_DIAS - 1), d1)
        janelas.append((d0.isoformat(), d2.isoformat()))
        d0 = d2 + timedelta(days=1)
    return janelas


def sync(desde: str | None = None, dias: int = 30, com_votos: bool = True) -> int:
    sb = get_supabase_client()
    desde = desde or (date.today() - timedelta(days=dias)).isoformat()

    mapa_prop = {
        linha["id_externo"]: linha["id"]
        for linha in fetch_all(
            lambda: sb.table("proposicoes").select("id, id_externo").eq("casa_id", client.CASA_ID)
        )
    }
    mapa_parl = {
        linha["id_externo"]: linha["id"]
        for linha in fetch_all(
            lambda: sb.table("parlamentares").select("id, id_externo").eq("casa_id", client.CASA_ID)
        )
    }

    votacoes: list[dict] = []
    ids_externos: list[str] = []

    for inicio, fim in _janelas(desde, date.today().isoformat()):
        try:
            lote = list(
                client.paginar(
                    "/votacoes",
                    dataInicio=inicio,
                    dataFim=fim,
                    ordem="DESC",
                    ordenarPor="dataHoraRegistro",
                )
            )
        except Exception as e:
            # Uma janela que falha não pode derrubar o período inteiro —
            # ela volta na próxima rodada, e as outras já entraram.
            print(f"  [erro] janela {inicio}..{fim}: {e}")
            continue

        for v in lote:
            id_prop_externo = client.id_externo_da_uri(v.get("uriProposicaoObjeto"))
            votacoes.append(
                {
                    "casa_id": client.CASA_ID,
                    "id_externo": str(v["id"]),
                    "proposicao_id": mapa_prop.get(id_prop_externo or ""),
                    "data": v.get("data"),
                    "sigla_orgao": v.get("siglaOrgao"),
                    "descricao": v.get("descricao"),
                    # `aprovacao` vem como 0/1 na API, não booleano.
                    "aprovacao": bool(v.get("aprovacao")) if v.get("aprovacao") is not None else None,
                }
            )
            ids_externos.append(str(v["id"]))

    if not votacoes:
        print(f"[camara.votacoes] nenhuma votação desde {desde}")
        return 0

    upsert_em_lotes(sb, "votacoes", votacoes, on_conflict="casa_id,id_externo")
    print(f"[camara.votacoes] {len(votacoes)} votações desde {desde}")

    if not com_votos:
        return len(votacoes)

    mapa_votacao = {
        linha["id_externo"]: linha["id"]
        for linha in fetch_all(
            lambda: sb.table("votacoes").select("id, id_externo").eq("casa_id", client.CASA_ID)
        )
    }

    votos: list[dict] = []
    nominais = 0
    for id_externo in ids_externos:
        votacao_uuid = mapa_votacao.get(id_externo)
        if not votacao_uuid:
            continue
        try:
            dados = client.get(f"/votacoes/{id_externo}/votos").get("dados", [])
        except Exception as e:
            print(f"  [erro] votos de {id_externo}: {e}")
            continue
        if not dados:
            continue  # votação simbólica — ver nota no topo do módulo
        nominais += 1
        for voto in dados:
            dep = voto.get("deputado_") or {}
            pid = mapa_parl.get(str(dep.get("id")))
            if not pid:
                continue
            votos.append(
                {
                    "votacao_id": votacao_uuid,
                    "parlamentar_id": pid,
                    "voto": voto.get("tipoVoto"),
                }
            )

    if votos:
        upsert_em_lotes(sb, "votos", votos, on_conflict="votacao_id,parlamentar_id")
    print(
        f"[camara.votacoes] {len(votos)} votos nominais em {nominais} votações "
        f"({len(votacoes) - nominais} simbólicas, sem voto individual)"
    )
    registrar_fonte(sb, "camara_votacoes", f"{client.BASE}/votacoes", "votacoes")
    return len(votacoes)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--desde", help="AAAA-MM-DD")
    p.add_argument("--dias", type=int, default=30)
    p.add_argument("--sem-votos", action="store_true")
    args = p.parse_args()
    sync(args.desde, args.dias, com_votos=not args.sem_votos)
