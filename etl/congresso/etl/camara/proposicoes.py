"""etl.camara.proposicoes — proposições da Câmara dos Deputados.

Rodar:
  python -m etl.camara.proposicoes --ano 2026              # ano corrente
  python -m etl.camara.proposicoes --ano 2023 --backfill   # carga histórica
  python -m etl.camara.proposicoes --desde 2026-07-01      # incremental

DESENHO — por que duas etapas:

A LISTA (`/proposicoes`) é barata e traz id, ementa e data. O DETALHE
(`/proposicoes/{id}`) é uma requisição por proposição e é o único lugar
onde vivem `keywords` (indexação oficial), `urlInteiroTeor` e a situação
atual. Com ~4.400 PLs só em 2026, buscar detalhe de tudo a cada rodada
seria inviável e desnecessário: só buscamos detalhe de proposição nova ou
cuja data de apresentação mudou.

TAXONOMIA OFICIAL: a Câmara já classifica cada proposição por tema
(`/proposicoes/{id}/temas` → codTema + relevância) e por palavras-chave.
Não replicamos esse trabalho — no app irmão, construir um classificador
temático por regex custou uma sessão inteira de calibração contra
falso positivo. Aqui usamos o oficial e reservamos o esforço próprio para
o eixo garantista/reducionista, que é o que não existe pronto.
"""
import argparse
from datetime import date

from etl.camara import client
from etl.common import fetch_all, get_supabase_client, registrar_fonte, upsert_em_lotes

# Os tipos que efetivamente criam ou alteram direitos. Requerimentos e
# indicações ficam de fora do escopo inicial: são milhares por ano e quase
# nunca mudam a ordem jurídica — entram depois, se o usuário quiser
# acompanhar atuação parlamentar além de conteúdo normativo.
TIPOS_PADRAO = ["PL", "PEC", "PLP", "MPV", "PDL", "PLV"]


def _proposicoes_conhecidas(sb) -> set[str]:
    linhas = fetch_all(
        lambda: sb.table("proposicoes").select("id_externo").eq("casa_id", client.CASA_ID)
    )
    return {linha["id_externo"] for linha in linhas}


def _detalhar(id_externo: str) -> dict:
    """Detalhe + temas oficiais de uma proposição."""
    dados = client.get(f"/proposicoes/{id_externo}").get("dados", {})
    status = dados.get("statusProposicao") or {}

    temas = client.get(f"/proposicoes/{id_externo}/temas").get("dados", [])
    # `relevancia` 0 é o tema mais relevante segundo a própria Câmara —
    # preservamos a ordem em vez de ordenar alfabeticamente, porque a
    # primeira tag é a que a UI mostra quando só cabe uma.
    temas_ordenados = [t["tema"] for t in sorted(temas, key=lambda t: t.get("relevancia", 99))]

    return {
        "ementa_detalhada": dados.get("ementaDetalhada"),
        "keywords": dados.get("keywords"),
        "temas_oficiais": temas_ordenados or None,
        "situacao": status.get("descricaoSituacao") or status.get("descricaoTramitacao"),
        "orgao_atual": status.get("siglaOrgao"),
        "regime": status.get("regime"),
        "apreciacao": status.get("apreciacao"),
        "url_inteiro_teor": dados.get("urlInteiroTeor"),
        "data_ultima_tramitacao": status.get("dataHora"),
        "raw": dados,
    }


def _autores(sb, proposicao_uuid: str, id_externo: str, mapa_parlamentares: dict[str, str]):
    vinculos = []
    for a in client.get(f"/proposicoes/{id_externo}/autores").get("dados", []):
        pid = mapa_parlamentares.get(client.id_externo_da_uri(a.get("uri")) or "")
        if not pid:
            # Autor institucional (Poder Executivo, Senado, comissão) ou
            # deputado de legislatura anterior. Não é erro — só não tem
            # linha em `parlamentares`.
            continue
        vinculos.append(
            {
                "proposicao_id": proposicao_uuid,
                "parlamentar_id": pid,
                "ordem": a.get("ordemAssinatura"),
                "proponente": bool(a.get("proponente")),
            }
        )
    return vinculos


# Grava a cada N proposições em vez de acumular tudo e escrever no fim.
# Antes, um `--ano 2026` colecionava ~5.000 proposições com detalhe (3
# requisições cada, ~15.000 chamadas) ANTES do primeiro write — de modo que
# uma falha de rede depois dos retries perdia tudo, e não havia como ver
# progresso. Agora o que foi gravado fica gravado, e a contagem no banco
# cresce em tempo real.
FLUSH = 200


def _gravar_lote(sb, buffer: list[dict], mapa_parl: dict[str, str]) -> tuple[int, int]:
    """Grava um lote de proposições e a autoria das que têm `_novo`.

    Devolve (proposições_gravadas, vínculos_de_autoria). As proposições são
    upsertadas primeiro; a autoria precisa do uuid, então é resolvida logo
    depois consultando de volta só os ids deste lote.
    """
    if not buffer:
        return 0, 0

    linhas = [{k: v for k, v in b.items() if k != "_novo"} for b in buffer]
    upsert_em_lotes(sb, "proposicoes", linhas, on_conflict="casa_id,id_externo")

    ids_novos = [b["id_externo"] for b in buffer if b.get("_novo")]
    if not ids_novos:
        return len(linhas), 0

    # `.in_` fatiado: o mapa deste lote (<= FLUSH ids) cabe numa URL só.
    mapa_prop = {
        r["id_externo"]: r["id"]
        for r in sb.table("proposicoes")
        .select("id, id_externo")
        .eq("casa_id", client.CASA_ID)
        .in_("id_externo", ids_novos)
        .execute()
        .data
    }
    vinculos: list[dict] = []
    for id_externo in ids_novos:
        uuid = mapa_prop.get(id_externo)
        if uuid:
            vinculos.extend(_autores(sb, uuid, id_externo, mapa_parl))
    if vinculos:
        upsert_em_lotes(
            sb, "proposicao_autores", vinculos, on_conflict="proposicao_id,parlamentar_id"
        )
    return len(linhas), len(vinculos)


def sync(
    ano: int | None = None,
    desde: str | None = None,
    tipos: list[str] | None = None,
    com_detalhe: bool = True,
) -> int:
    sb = get_supabase_client()
    conhecidas = _proposicoes_conhecidas(sb)
    ano = ano or date.today().year
    tipos = tipos or TIPOS_PADRAO

    # Mapa de autores carregado uma vez (513 deputados, estável na rodada).
    mapa_parl = {
        r["id_externo"]: r["id"]
        for r in fetch_all(
            lambda: sb.table("parlamentares").select("id, id_externo").eq("casa_id", client.CASA_ID)
        )
    }

    buffer: list[dict] = []
    vistas = total_prop = total_aut = 0

    for tipo in tipos:
        params: dict = {"siglaTipo": tipo, "ordem": "DESC", "ordenarPor": "id"}
        if desde:
            params["dataApresentacaoInicio"] = desde
        else:
            params["ano"] = ano

        for p in client.paginar("/proposicoes", **params):
            vistas += 1
            id_externo = str(p["id"])
            eh_novo = id_externo not in conhecidas
            linha = {
                "casa_id": client.CASA_ID,
                "id_externo": id_externo,
                "sigla_tipo": p.get("siglaTipo"),
                "numero": p.get("numero"),
                "ano": p.get("ano"),
                "identificacao": f"{p.get('siglaTipo')} {p.get('numero')}/{p.get('ano')}",
                "ementa": p.get("ementa"),
                "data_apresentacao": p.get("dataApresentacao"),
                "url_fonte": f"https://www.camara.leg.br/propostas-legislativas/{id_externo}",
                "tramitando": True,
                "_novo": eh_novo,
            }
            if com_detalhe and eh_novo:
                linha.update(_detalhar(id_externo))
            buffer.append(linha)

            if len(buffer) >= FLUSH:
                g, a = _gravar_lote(sb, buffer, mapa_parl)
                total_prop += g
                total_aut += a
                print(f"[camara.proposicoes] {total_prop} gravadas / {vistas} vistas…", flush=True)
                buffer = []

    g, a = _gravar_lote(sb, buffer, mapa_parl)
    total_prop += g
    total_aut += a

    if total_prop == 0:
        print(f"[camara.proposicoes] nada novo (viu {vistas})")
        return 0

    print(
        f"[camara.proposicoes] {total_prop} proposições gravadas (de {vistas} vistas), "
        f"{total_aut} vínculos de autoria"
    )

    registrar_fonte(sb, "camara_proposicoes", f"{client.BASE}/proposicoes", "proposicoes")
    return total_prop


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--ano", type=int)
    p.add_argument("--desde", help="AAAA-MM-DD — modo incremental por data de apresentação")
    p.add_argument("--tipos", nargs="*", default=None)
    p.add_argument("--backfill", action="store_true", help="varre 2023 até o ano corrente")
    p.add_argument("--sem-detalhe", action="store_true")
    args = p.parse_args()

    if args.backfill:
        for ano in range(2023, date.today().year + 1):
            print(f"--- backfill {ano} ---")
            sync(ano=ano, tipos=args.tipos, com_detalhe=not args.sem_detalhe)
    else:
        sync(
            ano=args.ano,
            desde=args.desde,
            tipos=args.tipos,
            com_detalhe=not args.sem_detalhe,
        )
