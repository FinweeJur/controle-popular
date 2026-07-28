"""etl.camara.tramitacoes — histórico de tramitação e situação atual.

Rodar:
  python -m etl.camara.tramitacoes                # só as que estão tramitando
  python -m etl.camara.tramitacoes --limite 200
  python -m etl.camara.tramitacoes --todas        # inclui as arquivadas

É este módulo que mantém `proposicoes.situacao`/`orgao_atual` vivos — e é
deles que sai o destinatário do ofício: "quem decide isto agora" é o
relator ou o presidente da comissão onde a proposição está neste momento,
não o autor.

CUSTO: uma requisição por proposição. Com milhares tramitando, rodar tudo
todo dia é caro e desnecessário — a maioria fica parada por meses. Por
isso o padrão é ordenar pelas mais desatualizadas e aplicar um teto:
quem mudou recentemente volta ao topo naturalmente na rodada seguinte.

DETECÇÃO DE NOVIDADE: comparamos a maior `sequencia` já gravada com a que
volta da API. É mais confiável que comparar data — a Câmara às vezes
regrava um evento com a mesma data e sequência diferente, e comparar por
data perderia o segundo.
"""
import argparse

from etl.camara import client
from etl.common import fetch_all, get_supabase_client, registrar_fonte, upsert_em_lotes


def _ultima_sequencia_por_proposicao(sb) -> dict[str, int]:
    linhas = fetch_all(lambda: sb.table("tramitacoes").select("proposicao_id, sequencia"))
    ultima: dict[str, int] = {}
    for linha in linhas:
        pid = linha["proposicao_id"]
        seq = linha.get("sequencia") or 0
        if seq > ultima.get(pid, -1):
            ultima[pid] = seq
    return ultima


def sync(limite: int = 300, todas: bool = False) -> int:
    sb = get_supabase_client()

    def query():
        q = (
            sb.table("proposicoes")
            .select("id, id_externo, identificacao, data_ultima_tramitacao")
            .eq("casa_id", client.CASA_ID)
        )
        return q if todas else q.eq("tramitando", True)

    proposicoes = fetch_all(query)
    # `nulls_first` na prática: quem nunca foi atualizado vem antes de quem
    # já foi, e entre os já atualizados vem o mais antigo. Ordenar no SQL
    # exigiria NULLS FIRST explícito no PostgREST; aqui é uma linha.
    proposicoes.sort(key=lambda p: (p.get("data_ultima_tramitacao") or ""))
    alvo = proposicoes[:limite]
    print(f"[camara.tramitacoes] {len(alvo)} de {len(proposicoes)} proposições nesta rodada")

    ultima_seq = _ultima_sequencia_por_proposicao(sb)

    novas: list[dict] = []
    atualizacoes: list[dict] = []
    com_novidade = 0

    for prop in alvo:
        try:
            eventos = client.get(f"/proposicoes/{prop['id_externo']}/tramitacoes").get("dados", [])
        except Exception as e:
            print(f"  [erro] {prop['identificacao']}: {e}")
            continue
        if not eventos:
            continue

        conhecida = ultima_seq.get(prop["id"], -1)
        for ev in eventos:
            seq = ev.get("sequencia")
            if seq is None or seq <= conhecida:
                continue
            novas.append(
                {
                    "proposicao_id": prop["id"],
                    "sequencia": seq,
                    "data_hora": ev.get("dataHora"),
                    "sigla_orgao": ev.get("siglaOrgao"),
                    "descricao": ev.get("descricaoTramitacao"),
                    "despacho": ev.get("despacho"),
                }
            )

        # O último evento da lista é o estado atual da proposição.
        atual = eventos[-1]
        descricao = atual.get("descricaoSituacao") or atual.get("descricaoTramitacao")
        atualizacoes.append(
            {
                "casa_id": client.CASA_ID,
                "id_externo": prop["id_externo"],
                "situacao": descricao,
                "orgao_atual": atual.get("siglaOrgao"),
                "regime": atual.get("regime"),
                "apreciacao": atual.get("apreciacao"),
                "data_ultima_tramitacao": atual.get("dataHora"),
                # "Arquivada"/"Transformado em Lei" encerram o acompanhamento.
                # Sem isto a fila de tramitação cresce para sempre, gastando
                # requisição em proposição que nunca mais vai se mexer.
                "tramitando": not _encerrada(descricao),
            }
        )
        if any(n["proposicao_id"] == prop["id"] for n in novas):
            com_novidade += 1

    if novas:
        upsert_em_lotes(sb, "tramitacoes", novas, on_conflict="proposicao_id,sequencia")
    if atualizacoes:
        upsert_em_lotes(sb, "proposicoes", atualizacoes, on_conflict="casa_id,id_externo")

    print(
        f"[camara.tramitacoes] {len(novas)} eventos novos em {com_novidade} proposições · "
        f"{len(atualizacoes)} situações atualizadas"
    )
    registrar_fonte(sb, "camara_tramitacoes", f"{client.BASE}/proposicoes/{{id}}/tramitacoes", "tramitacoes")
    return len(novas)


_TERMOS_ENCERRAMENTO = (
    "arquivada",
    "arquivado",
    "transformado em norma jurídica",
    "transformada em norma jurídica",
    "vetado totalmente",
    "retirada pelo autor",
    "retirado pelo autor",
    "declarada prejudicada",
    "declarado prejudicado",
)


def _encerrada(situacao: str | None) -> bool:
    s = (situacao or "").lower()
    return any(t in s for t in _TERMOS_ENCERRAMENTO)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--limite", type=int, default=300)
    p.add_argument("--todas", action="store_true")
    args = p.parse_args()
    sync(args.limite, args.todas)
