r"""etl.apis.classificar_temas_atos_oficiais — recalcula `atos_oficiais.temas`
para TODAS as linhas já coletadas, usando a regra atual de
`etl.temas.classificar_texto`.

POR QUE ESTE SCRIPT EXISTE: `etl/camaras/*.py` e `etl/prefeitura/legislacao.py`
já classificam `temas` no momento em que gravam uma norma nova (mesma regra
deste módulo). Mas quando a REGRA muda -- como em 2026-08-13, quando
`etl.temas` ganhou os termos de área protegida (área de proteção ambiental,
unidade de conservação, RPPN etc., pra parar de perder normas como a Lei
726/2025 de Araçuaí, que altera o zoneamento da APA da Chapada do Lagoão e
não carregava `meio_ambiente`) -- as linhas JÁ gravadas ficam com a
classificação antiga até alguém recalcular. Este script faz esse
recálculo, pra TODAS as ~10 mil linhas de uma vez (idempotente: pode rodar
de novo sempre que uma regex mudar).

Uso:
    python -m etl.apis.classificar_temas_atos_oficiais --sondar   # só mede, não grava
    python -m etl.apis.classificar_temas_atos_oficiais             # grava

Resultado medido em 2026-08-13 (regra nova vs. `temas` gravado antes dela):
24 de 10.317 linhas mudam (todas GANHANDO `meio_ambiente`, nenhuma perde
tema nenhum -- a mudança só ACRESCENTA alternativas à regex existente), em
4 municípios: Belo Horizonte (9), São Paulo (12), Diamantina (2), Araçuaí
(1 -- a própria Lei 726/2025).
"""
import argparse
from collections import Counter

from etl.common import fetch_all, get_supabase_client
from etl.temas import TEMA_LABELS, classificar_texto

LOG = "[etl.apis.classificar_temas_atos_oficiais]"


def rodar(*, sondar: bool = False) -> None:
    client = get_supabase_client()
    linhas = fetch_all(
        lambda: client.table("atos_oficiais").select("id, id_municipio, ementa, temas")
    )
    print(f"{LOG} {len(linhas)} ato(s) oficial(is) lido(s) do banco.")

    mudaram = 0
    ganharam_por_tema: Counter = Counter()
    municipios_afetados: set[str] = set()
    contagem_tema_novo: Counter = Counter()

    for linha in linhas:
        temas_novo = classificar_texto(linha.get("ementa"))
        temas_banco = sorted(linha.get("temas") or [])
        for t in temas_novo:
            contagem_tema_novo[t] += 1
        if temas_novo != temas_banco:
            mudaram += 1
            municipios_afetados.add(linha["id_municipio"])
            for t in set(temas_novo) - set(temas_banco):
                ganharam_por_tema[t] += 1
            if not sondar:
                client.table("atos_oficiais").update({"temas": temas_novo}).eq("id", linha["id"]).execute()

    print(f"\n{LOG} classificação {'SONDADA (nada gravado)' if sondar else 'gravada'}:")
    print(f"{LOG} {mudaram}/{len(linhas)} linha(s) com `temas` diferente do que já estava no banco.")
    print(f"{LOG} municípios distintos com alguma linha mudada: {len(municipios_afetados)} -> {sorted(municipios_afetados)}")
    print(f"{LOG} temas GANHOS (linha que não tinha e passou a ter):")
    for slug, n in ganharam_por_tema.most_common():
        print(f"{LOG}   {TEMA_LABELS.get(slug, slug):<28} {n}")
    print(f"{LOG} distribuição total por tema (após recálculo):")
    for slug, label in TEMA_LABELS.items():
        print(f"{LOG}   {label:<28} {contagem_tema_novo.get(slug, 0)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sondar", action="store_true", help="calcula e relata, NÃO grava")
    args = parser.parse_args()
    rodar(sondar=args.sondar)
