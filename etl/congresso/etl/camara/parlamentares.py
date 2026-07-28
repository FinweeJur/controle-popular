"""etl.camara.parlamentares — deputados federais em exercício.

Rodar: `python -m etl.camara.parlamentares`

ARMADILHA DE MAPEAMENTO, confirmada ao vivo em 2026-07-22 inspecionando o
JSON cru (é literalmente o caso que a regra "inspecione o raw antes de
confiar no mapeamento" existe para pegar):

  /deputados        (lista)   → `email` vem preenchido no topo do objeto
  /deputados/{id}   (detalhe) → `ultimoStatus.email` vem **null**;
                                o e-mail real está em
                                `ultimoStatus.gabinete.email`

Ou seja: quem escrevesse `detalhe["ultimoStatus"]["email"]` — o campo de
nome óbvio — gravaria e-mail nulo para TODOS os 513 deputados e só
descobriria na hora de enviar o primeiro ofício. Por isso este módulo lê a
LISTA como fonte do e-mail e usa o detalhe apenas como fallback pelo
caminho do gabinete.

LGPD: `/deputados/{id}` expõe **CPF** e data de nascimento. Não gravamos
nenhum dos dois — não são necessários para nada que o app faz, e dado
pessoal que não se coleta é dado pessoal que não vaza.
"""
import argparse

from etl.camara import client
from etl.common import get_supabase_client, registrar_fonte, upsert_em_lotes

LEGISLATURA_ATUAL = 57


def coletar(legislatura: int = LEGISLATURA_ATUAL) -> list[dict]:
    # SEM `idLegislatura`: esse filtro devolve uma linha por PERÍODO DE
    # FILIAÇÃO, então um deputado que trocou de partido na legislatura vem
    # duplicado — verificado ao vivo 2026-07-23: 878 linhas / 647 ids para
    # a 57ª, e as duplicatas traziam o partido ANTIGO junto do atual, o que
    # ainda quebrava o upsert por chave repetida no mesmo lote. `/deputados`
    # puro traz os 512 em exercício agora, um por deputado, com o partido
    # ATUAL (Adail Filho: MDB, não o REPUBLICANOS anterior).
    linhas: list[dict] = []
    for dep in client.paginar("/deputados"):
        email = dep.get("email")
        if not email:
            # Fallback só para quem veio sem e-mail na lista — uma
            # requisição por deputado é caro, não vale fazer para todos.
            detalhe = client.get(f"/deputados/{dep['id']}").get("dados", {})
            status = detalhe.get("ultimoStatus") or {}
            email = (status.get("gabinete") or {}).get("email") or status.get("email")

        linhas.append(
            {
                "casa_id": client.CASA_ID,
                "id_externo": str(dep["id"]),
                "nome": dep.get("nome"),
                "nome_eleitoral": dep.get("nome"),
                "partido": dep.get("siglaPartido"),
                "uf": dep.get("siglaUf"),
                "email": email,
                "url_foto": dep.get("urlFoto"),
                "url_perfil": f"https://www.camara.leg.br/deputados/{dep['id']}",
                # `/deputados` puro não traz `idLegislatura` no objeto, então
                # grava-se a legislatura de referência direto.
                "legislatura": dep.get("idLegislatura") or legislatura,
                "ativo": True,
                # `raw` guarda só o objeto da lista (sem CPF/nascimento do
                # detalhe) — ver nota de LGPD no topo.
                "raw": dep,
            }
        )
    return linhas


def sync(legislatura: int = LEGISLATURA_ATUAL) -> int:
    linhas = coletar(legislatura)
    client_sb = get_supabase_client()
    total = upsert_em_lotes(
        client_sb, "parlamentares", linhas, on_conflict="casa_id,id_externo"
    )
    sem_email = sum(1 for x in linhas if not x["email"])
    print(f"[camara.parlamentares] {total} deputados sincronizados ({sem_email} sem e-mail)")
    registrar_fonte(
        client_sb,
        "camara_deputados",
        f"{client.BASE}/deputados",
        "parlamentares",
    )
    return total


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--legislatura", type=int, default=LEGISLATURA_ATUAL)
    args = p.parse_args()
    sync(args.legislatura)
