"""etl.camara.orgaos — comissões da Câmara.

Rodar: `python -m etl.camara.orgaos`

`codTipoOrgao`: 2 = Comissão Permanente, 3 = Comissão Temporária/Especial.
São as permanentes (CCJC, CAPADR, CSSF...) que importam para o ofício: é
onde o PL efetivamente tramita e onde estão relator e presidente.

LIMITAÇÃO CONHECIDA: `/orgaos/{id}` **não traz e-mail** da comissão —
verificado ao vivo em 2026-07-22, só `urlWebsite`, `sala` e datas. Para o
envio de ofício à comissão, o e-mail precisa ser semeado à mão a partir do
site de cada comissão (são ~25 permanentes, trabalho de uma vez só). Até
lá, o app endereça a comissão via seus MEMBROS, cujos e-mails a API
entrega — o ofício chega, só não pela caixa institucional do colegiado.
"""
import argparse

from etl.camara import client
from etl.common import get_supabase_client, registrar_fonte, upsert_em_lotes

TIPOS_INTERESSE = [2, 3]  # permanente, temporária


def coletar(tipos: list[int] | None = None) -> list[dict]:
    linhas: list[dict] = []
    for tipo in tipos or TIPOS_INTERESSE:
        for org in client.paginar("/orgaos", codTipoOrgao=tipo):
            linhas.append(
                {
                    "casa_id": client.CASA_ID,
                    "id_externo": str(org["id"]),
                    "sigla": org.get("sigla"),
                    "nome": org.get("nome"),
                    "tipo": org.get("tipoOrgao"),
                    "url_site": org.get("urlWebsite"),
                    "ativo": True,
                }
            )
    return linhas


def sync() -> int:
    linhas = coletar()
    sb = get_supabase_client()
    total = upsert_em_lotes(sb, "orgaos", linhas, on_conflict="casa_id,id_externo")
    print(f"[camara.orgaos] {total} órgãos sincronizados")
    registrar_fonte(sb, "camara_orgaos", f"{client.BASE}/orgaos", "comissoes")
    return total


if __name__ == "__main__":
    argparse.ArgumentParser().parse_args()
    sync()
