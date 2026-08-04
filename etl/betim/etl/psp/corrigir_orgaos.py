"""etl.psp.corrigir_orgaos — desfaz, no banco, o corte de 50 caracteres.

    python -m etl.psp.corrigir_orgaos --id-municipio 3550308 --dry-run
    python -m etl.psp.corrigir_orgaos --id-municipio 3550308

Par de `etl/psp/orgaos_canonicos.py`, que conserta na ESCRITA. Este módulo
conserta o que já está gravado — 1.906 linhas de `servidores` e 8 de
`folha_pagamento` em São Paulo.

AS DUAS TABELAS NA MESMA RODADA, e não é conveniência: elas casam pelo TEXTO
do órgão (ver `etl/psp/servidores.py`). Corrigir só uma deixaria o quadro em
"…URBANA E OBRAS" e a folha em "…URBANA E OB", e o join morreria em silêncio
— a tela mostraria a secretaria sem folha, ou a folha sem secretaria.

`servidores` tem UNIQUE(id_municipio, orgao, nome, cargo) e o UPDATE mexe
justamente em `orgao`. Se a mesma pessoa já existisse sob o nome cortado E sob
o completo, o UPDATE violaria a unicidade — por isso o conflito é detectado e
relatado ANTES, em vez de estourar no meio da transação.
"""
import argparse
import sys

from etl.common import carregar_municipio, get_supabase_client
from etl.psp.orgaos_canonicos import ORGAOS_TRUNCADOS_SP

TABELAS = ("servidores", "folha_pagamento")


def corrigir(id_municipio: str, dry_run: bool = False) -> dict[str, int]:
    cidade = carregar_municipio(id_municipio)
    con = get_supabase_client().conexao()
    total: dict[str, int] = {}

    print(f"[corrigir_orgaos] {cidade['nome']} ({id_municipio})")

    for tabela in TABELAS:
        for cortado, completo in ORGAOS_TRUNCADOS_SP.items():
            with con.cursor() as cur:
                cur.execute(
                    f"select count(*) from {tabela} "
                    "where id_municipio = %s and orgao = %s",
                    (id_municipio, cortado),
                )
                n = cur.fetchone()[0]
            if not n:
                continue

            if tabela == "servidores":
                # A chave natural muda junto com o órgão: confere se o UPDATE
                # colidiria com uma linha que já usa o nome completo.
                with con.cursor() as cur:
                    cur.execute(
                        """
                        select count(*) from servidores a
                        join servidores b
                          on b.id_municipio = a.id_municipio
                         and b.nome = a.nome and b.cargo = a.cargo
                         and b.orgao = %s
                        where a.id_municipio = %s and a.orgao = %s
                        """,
                        (completo, id_municipio, cortado),
                    )
                    colisoes = cur.fetchone()[0]
                if colisoes:
                    print(
                        f"  [PULA] {tabela}: {colisoes} linha(s) de {cortado!r} "
                        f"já existem sob o nome completo — corrigir duplicaria "
                        f"a chave natural. Investigue antes."
                    )
                    continue

            print(f"  {tabela}: {n:>6} linha(s)  {cortado!r} -> completo")
            total[tabela] = total.get(tabela, 0) + n
            if not dry_run:
                with con.cursor() as cur:
                    cur.execute(
                        f"update {tabela} set orgao = %s "
                        "where id_municipio = %s and orgao = %s",
                        (completo, id_municipio, cortado),
                    )

    if dry_run:
        print("[corrigir_orgaos] dry-run: nada gravado.")
    else:
        # Conferência final: o portal não pode ficar com nome cortado nenhum
        # que a tabela canônica saiba resolver.
        for tabela in TABELAS:
            with con.cursor() as cur:
                cur.execute(
                    f"select count(*) from {tabela} "
                    "where id_municipio = %s and length(orgao) = 50",
                    (id_municipio,),
                )
                resta = cur.fetchone()[0]
            print(f"[corrigir_orgaos] {tabela}: {resta} linha(s) ainda com 50 caracteres")
    return total


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    # Sem default de cidade: ver scripts/conferir_defaults_de_cidade.py.
    ap.add_argument("--id-municipio", required=True)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    try:
        corrigir(a.id_municipio, a.dry_run)
    except RuntimeError as e:
        print(f"[corrigir_orgaos] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
