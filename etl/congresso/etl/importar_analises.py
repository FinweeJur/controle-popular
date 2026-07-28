"""etl.importar_analises — traz para o banco as respostas geradas fora.

    python -m etl.importar_analises --dir analises_pendentes
    python -m etl.importar_analises --dir analises_pendentes --modelo claude-sonnet-max
    python -m etl.importar_analises --dir analises_pendentes --dry-run

Par de `etl.exportar_prompts`. Lê `<id>.json` de cada proposição, valida
contra a rubrica e grava `analises` + `analise_itens`.

O GUARDA-CORPO É O MESMO DO ETL, e isso não é detalhe: a resposta veio de
um modelo que este código não controla, possivelmente colada à mão. Ainda
assim, item sem dispositivo legal citável é DESCARTADO antes de contar, e
`score`/`rotulo` saem de `rubrica.calcular()` — determinístico, nunca do
que o modelo "achou" que era. Um JSON malicioso ou distraído não consegue
plantar um rótulo no banco.
"""
import argparse
import json
from pathlib import Path

from etl import rubrica
from etl.common import get_supabase_client, upsert_em_lotes
from etl.normas import extrair as extrair_normas


def importar(diretorio: Path, modelo: str, dry_run: bool) -> dict:
    manifesto_path = diretorio / "_manifesto.json"
    if not manifesto_path.exists():
        raise SystemExit(
            f"{manifesto_path} não existe — rode `python -m etl.exportar_prompts --dir {diretorio}` antes."
        )
    manifesto = json.loads(manifesto_path.read_text(encoding="utf-8"))

    if manifesto["versao_rubrica"] != rubrica.VERSAO_RUBRICA:
        raise SystemExit(
            f"rubrica mudou desde a exportação ({manifesto['versao_rubrica']} → "
            f"{rubrica.VERSAO_RUBRICA}). Reexporte: as respostas foram feitas com "
            f"outra taxonomia e misturá-las compararia duas réguas."
        )

    sb = get_supabase_client()
    modelo = modelo or manifesto.get("modelo_pretendido") or "externo"

    # Ementas das proposições do manifesto: fonte da `legislacao_relacionada`
    # (regex auditável) em vez do que o modelo alegou ter alterado.
    ids_manifesto = [e["id"] for e in manifesto["proposicoes"]]
    ementas: dict[str, str] = {}
    for i in range(0, len(ids_manifesto), 200):
        lote = ids_manifesto[i : i + 200]
        for r in (
            sb.table("proposicoes").select("id, ementa").in_("id", lote).execute().data
        ):
            ementas[r["id"]] = r.get("ementa") or ""

    analises, itens_todos = [], []
    stats = {"ok": 0, "requer_revisao": 0, "faltando": 0, "invalido": 0, "descartes": 0}

    for entrada in manifesto["proposicoes"]:
        pid, ident = entrada["id"], entrada.get("identificacao")
        arq = diretorio / f"{pid}.json"
        if not arq.exists():
            stats["faltando"] += 1
            continue

        try:
            bruto = json.loads(arq.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            print(f"  [JSON INVÁLIDO] {ident}: {e}")
            stats["invalido"] += 1
            continue

        itens, descartes = rubrica.validar_itens(bruto)
        calc = rubrica.calcular(itens)
        stats["descartes"] += len(descartes)

        # Mesma regra de `etl/analise.py`, e a distinção importa: lista
        # vazia SEM descartes é resposta CERTA — a regra 3 do prompt manda
        # devolver vazio para proposição técnica ou de homenagem (data
        # comemorativa, denominação de via). Marcar isso como
        # "requer_revisao" trataria acerto como falha, encheria a fila de
        # revisão com nada e esconderia análises completas da UI. Vazio COM
        # descartes é outra coisa: o modelo tentou e produziu só lixo.
        status = "ok"
        if not itens and descartes:
            status = "requer_revisao"
        elif calc["requer_revisao"]:
            status = "requer_revisao"
        stats[status] += 1

        analises.append(
            {
                "proposicao_id": pid,
                "score": calc["score"],
                "rotulo": calc["rotulo"],
                "clausula_petrea": bool(bruto.get("clausula_petrea")),
                "vedacao_retrocesso": bool(bruto.get("vedacao_retrocesso")),
                "resumo_neutro": (bruto.get("resumo_neutro") or "")[:4000] or None,
                # Extraída da EMENTA por regex, não do `normas_alteradas` que
                # o modelo devolveu — mesma escolha de `etl/analise.py`. O
                # extrator é auditável (dá para mostrar o trecho que casou);
                # a lista do modelo não é verificável e entraria no banco
                # como fato sem procedência.
                "legislacao_relacionada": extrair_normas(ementas.get(pid, "")) or None,
                "modelo": modelo,
                "versao_rubrica": rubrica.VERSAO_RUBRICA,
                "versao_prompt": rubrica.VERSAO_PROMPT,
                "status": status,
            }
        )
        itens_todos.append((pid, itens))
        print(f"  {ident}: {calc['rotulo']} (score {calc['score']}, {len(itens)} itens) [{status}]")

    if dry_run:
        print(f"\n[dry-run] nada gravado. {stats}")
        return stats
    if not analises:
        print(f"\n[importar] nada para gravar. {stats}")
        return stats

    upsert_em_lotes(sb, "analises", analises, on_conflict="proposicao_id")

    # Os itens dependem do uuid da análise, que só existe depois do upsert.
    ids = [a["proposicao_id"] for a in analises]
    salvas = {
        r["proposicao_id"]: r["id"]
        for r in sb.table("analises").select("id, proposicao_id").in_("proposicao_id", ids).execute().data
    }
    # Reimportar a mesma proposição não pode duplicar item: limpa antes.
    sb.table("analise_itens").delete().in_("analise_id", list(salvas.values())).execute()

    linhas = [
        {**item, "analise_id": salvas[pid]}
        for pid, itens in itens_todos
        if salvas.get(pid)
        for item in itens
    ]
    if linhas:
        upsert_em_lotes(sb, "analise_itens", linhas)

    print(f"\n[importar] {len(analises)} análises, {len(linhas)} itens. {stats}")
    return stats


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default="analises_pendentes")
    ap.add_argument("--modelo", default="")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    importar(Path(a.dir), a.modelo, a.dry_run)
