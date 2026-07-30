"""etl.camara.orgaos — comissões (e Mesa Diretora) da Câmara.

Rodar: `python -m etl.camara.orgaos`

`codTipoOrgao`: 1 = Mesa Diretora (Comissão Diretora), 2 = Comissão
Permanente, 3 = Comissão Temporária/Especial. São os três que importam
para o ofício: onde o PL efetivamente tramita e onde estão relator e
presidente — ou, no caso da Mesa, o Presidente da Câmara e os
Vice-Presidentes/Secretários.

ACHADO REAL (2026-07-29, verificado contra o banco de produção): sem o
tipo 1, **2.369 das 5.168 proposições com órgão atual (46%!) caíam no
fallback de "só autor"** por estarem paradas em `MESA` — não por falta de
comissão real, mas porque `MESA` (`codTipoOrgao=1`, "Mesa Diretora da
Câmara dos Deputados") nunca era sincronizada. É um órgão REAL e
endereçável (tem Presidente + Vice-Presidentes + Secretários eleitos, a
API devolve `/orgaos/4/membros` normalmente) — diferente de `PLEN`
(Plenário, `codTipoOrgao=26`, sem colegiado próprio de titulares) e `CCP`
("Coordenação de Comissões Permanentes", `codTipoOrgao=12000`, órgão
administrativo de protocolo/triagem, não decide nada) — esses dois
continuam corretamente caindo no fallback de autor, não é bug.

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

TIPOS_INTERESSE = [1, 2, 3]  # Mesa Diretora, permanente, temporária


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
