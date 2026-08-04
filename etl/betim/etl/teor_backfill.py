"""etl.teor_backfill — preenche `proposicoes.classe_teor` a partir da ementa.

    python -m etl.teor_backfill --id-municipio 3106200
    python -m etl.teor_backfill --id-municipio 3550308 --dry-run

**Precisa da migration `0038_proposicoes_classe_teor.sql` já rodada.**

POR QUE ESTE MÓDULO EXISTE. O ranking de atuação da Câmara pesava por TIPO e
só por tipo: todo Projeto de Lei valia 15, fosse ele uma política pública ou
"Dá o nome de Fulano à Rua 934". Não é caso raro — é 12% dos PLs de BH, 22%
dos de São Paulo e 29% dos de Betim. `classe_teor` é o que permite ao app
cobrar menos por essas sem fingir que elas não existem.

A RÉGUA NÃO É NOVA, e isso é de propósito: `classificar_ruido` já decidia o
que não vale gastar análise garantista, e cada padrão dela foi conferido
contra ementa real (ver a docstring de `etl.fila_prioridade`). Reaproveitar
é o que impede duas definições de "homenagem" divergirem em silêncio — que é
o mesmo motivo de `rubrica.json` ser lido, e nunca copiado, pelos dois lados.

IDEMPOTENTE e seguro de re-rodar: reclassifica a partir da ementa que está no
banco AGORA e regrava. Não apaga nem cria linha; só escreve esta coluna.
"""
import argparse

from etl.common import carregar_municipio, fetch_all, get_supabase_client
from etl.fila_prioridade import classificar_ruido


def backfill(id_municipio: str, dry_run: bool = False) -> dict[str, int]:
    client = get_supabase_client()
    # Valida a cidade ANTES de escrever: `--id-municipio` errado aqui
    # reclassificaria a cidade errada sem erro nenhum, que é a falha
    # silenciosa que `scripts/conferir_defaults_de_cidade.py` existe para
    # impedir na entrada dos módulos.
    cidade = carregar_municipio(id_municipio)

    linhas = fetch_all(
        lambda: client.table("proposicoes")
        .select("id, ementa, tipo, classe_teor")
        .eq("id_municipio", id_municipio)
    )

    contagem: dict[str, int] = {}
    mudancas: list[tuple[str, str | None]] = []
    for row in linhas:
        novo = classificar_ruido(row.get("ementa"))
        contagem[novo or "(teor normativo)"] = contagem.get(novo or "(teor normativo)", 0) + 1
        if novo != row.get("classe_teor"):
            mudancas.append((row["id"], novo))

    print(f"[teor_backfill] {cidade['nome']} ({id_municipio}) — {len(linhas)} proposições")
    for slug, n in sorted(contagem.items(), key=lambda kv: -kv[1]):
        print(f"    {slug:<24} {n:>6}")
    print(f"    {'a atualizar':<24} {len(mudancas):>6}")

    if dry_run:
        print("[teor_backfill] dry-run: nada gravado.")
        return contagem

    # Um UPDATE por valor distinto, não um por linha: são ~8 mil proposições
    # por cidade e o backfill de `temas` (que escreve linha a linha) leva
    # minutos por isso. Aqui os valores possíveis são meia dúzia.
    por_valor: dict[str | None, list[str]] = {}
    for pid, valor in mudancas:
        por_valor.setdefault(valor, []).append(pid)

    for valor, ids in por_valor.items():
        for i in range(0, len(ids), 500):
            (
                client.table("proposicoes")
                .update({"classe_teor": valor})
                .in_("id", ids[i : i + 500])
                .execute()
            )
    print(f"[teor_backfill] {len(mudancas)} linhas atualizadas.")
    return contagem


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    # Sem default de cidade: ver scripts/conferir_defaults_de_cidade.py.
    ap.add_argument("--id-municipio", required=True)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    backfill(a.id_municipio, a.dry_run)
