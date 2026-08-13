r"""etl.apis.classificar_temas_ambientais — classifica as 6.378 normas de
`ambiental_legislacao` (ALMG/Semad/Siam) por tema e tag, usando as regras
de `etl.temas_ambientais` (auditáveis, ver docstring de lá — nenhum modelo
opaco). Roda DEPOIS da migration `0066_ambiental_legislacao_temas.sql` e
depois de `etl.apis.legislacao_almg` gravar a coluna `indexacao` (senão a
ALMG fica só com a mesma classificação por ementa que Semad/Siam têm).

Não é um coletor — não bate em nenhuma fonte externa, só lê `ementa` e
`indexacao` (já no banco) e grava `temas`/`tags` de volta. Idempotente:
recalcula as duas colunas do zero pra CADA linha a cada execução (função
determinística de `ementa`/`indexacao`/`fonte`), então rodar de novo depois
de mudar uma regex em `etl.temas_ambientais` corrige tudo sem precisar de
`--forcar` nem de saber quais linhas mudaram.

Uso:

    python -m etl.apis.classificar_temas_ambientais --sondar   # não grava
    python -m etl.apis.classificar_temas_ambientais             # grava
"""
import argparse
import sys
from collections import Counter

from etl.common import get_supabase_client
from etl.temas_ambientais import (
    TEMA_LABELS,
    TAG_LABELS,
    classificar_tags,
    temas_das_tags,
    temas_da_indexacao_almg,
)

LOG = "[etl.apis.classificar_temas_ambientais]"


def _classificar(linha: dict) -> tuple[list[str], list[str]]:
    """(temas, tags) de UMA linha. `temas` é a união do que a ementa deu
    (todas as fontes) com o que a indexação oficial da ALMG deu (só
    `fonte='almg'`, ver `etl.temas_ambientais.temas_da_indexacao_almg`)."""
    tags = classificar_tags(linha.get("ementa"))
    temas = set(temas_das_tags(tags))
    if linha.get("fonte") == "almg":
        temas.update(temas_da_indexacao_almg(linha.get("indexacao")))
    return sorted(temas), tags


def rodar(*, sondar: bool = False) -> None:
    client = get_supabase_client()
    resp = client.table("ambiental_legislacao").select(
        "id, fonte, ementa, indexacao"
    ).execute()
    linhas = resp.data
    print(f"{LOG} {len(linhas)} norma(s) lida(s) do banco.")

    contagem_tema: Counter = Counter()
    contagem_tag: Counter = Counter()
    contagem_fonte_com_tema: Counter = Counter()
    contagem_fonte_total: Counter = Counter()
    sem_tema = 0
    atualizadas = 0

    for linha in linhas:
        fonte = linha["fonte"]
        contagem_fonte_total[fonte] += 1
        temas, tags = _classificar(linha)
        for t in temas:
            contagem_tema[t] += 1
        for t in tags:
            contagem_tag[t] += 1
        if temas:
            contagem_fonte_com_tema[fonte] += 1
        else:
            sem_tema += 1

        if not sondar:
            client.table("ambiental_legislacao").update(
                {"temas": temas, "tags": tags}
            ).eq("id", linha["id"]).execute()
            atualizadas += 1

    total = len(linhas)
    com_tema = total - sem_tema
    print(f"\n{LOG} classificação {'SONDADA (nada gravado)' if sondar else 'gravada'}:")
    print(f"{LOG} {com_tema}/{total} norma(s) com pelo menos 1 tema "
          f"({100 * com_tema / total:.1f}%); {sem_tema} sem tema atribuído.")
    print(f"{LOG} por fonte (com tema / total):")
    for fonte in ("almg", "semad", "siam"):
        t = contagem_fonte_total.get(fonte, 0)
        c = contagem_fonte_com_tema.get(fonte, 0)
        pct = f"{100 * c / t:.1f}%" if t else "—"
        print(f"{LOG}   {fonte:<6} {c}/{t} ({pct})")
    print(f"{LOG} por tema:")
    for slug, label in TEMA_LABELS.items():
        print(f"{LOG}   {label:<28} {contagem_tema.get(slug, 0)}")
    print(f"{LOG} por tag (top 20):")
    for slug, n in contagem_tag.most_common(20):
        print(f"{LOG}   {TAG_LABELS.get(slug, slug):<32} {n}")
    if not sondar:
        print(f"{LOG} {atualizadas} linha(s) atualizada(s).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sondar", action="store_true", help="calcula e relata, NÃO grava")
    args = parser.parse_args()
    try:
        rodar(sondar=args.sondar)
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
