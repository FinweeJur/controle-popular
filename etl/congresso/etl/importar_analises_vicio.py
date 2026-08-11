"""etl.importar_analises_vicio — traz para o banco as respostas da análise
de VÍCIO LEGISLATIVO geradas fora. Par de `etl.exportar_prompts_vicio`,
mesmo guarda-corpo de `etl.importar_analises` (análise garantista):

  1. Item sem dispositivo legal citável é DESCARTADO antes de contar
     (`rubrica_vicio.validar_itens`). Categoria fora da taxonomia OU fora do
     eixo federal também é descartada, com o motivo registrado.
  2. `nivel_gravidade` sai de `rubrica_vicio.calcular()`, determinístico,
     sobre os itens que sobraram — nunca do que o modelo "achou" que era.
  3. NUNCA grava a palavra "inconstitucional": a taxonomia do banco
     (constraint `check` da migration 0011) só aceita
     sem_indicio/indicio_leve/indicio_grave.

    python -m etl.importar_analises_vicio --dir analises_vicio_pendentes --dry-run
    python -m etl.importar_analises_vicio --dir analises_vicio_pendentes --modelo claude-opus-5
"""
import argparse
import json
from pathlib import Path

from etl import rubrica_vicio as rv
from etl.common import get_supabase_client, upsert_em_lotes


def importar(diretorio: Path, modelo: str, dry_run: bool) -> dict:
    manifesto_path = diretorio / "_manifesto.json"
    if not manifesto_path.exists():
        raise SystemExit(
            f"{manifesto_path} não existe — rode "
            f"`python -m etl.exportar_prompts_vicio --dir {diretorio}` antes."
        )
    manifesto = json.loads(manifesto_path.read_text(encoding="utf-8"))

    if manifesto["versao_rubrica_vicio"] != rv.VERSAO_RUBRICA_VICIO:
        raise SystemExit(
            f"rubrica de vício mudou desde a exportação "
            f"({manifesto['versao_rubrica_vicio']} → {rv.VERSAO_RUBRICA_VICIO}). Reexporte."
        )
    if manifesto["eixo"] != "federal":
        raise SystemExit(f"manifesto é do eixo {manifesto['eixo']!r}, este importador é do Congresso (federal).")

    sb = get_supabase_client()
    modelo = modelo or manifesto.get("modelo_pretendido") or "externo"

    vicios: list[dict] = []
    itens_todos: list[tuple[str, list[dict]]] = []
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

        itens, descartes = rv.validar_itens(bruto, "federal")
        calc = rv.calcular(itens)
        stats["descartes"] += len(descartes)

        # Lista vazia SEM descartes é resposta CERTA (a maioria dos PLs não
        # tem vício — regra 3 do SYSTEM). Vazio COM descartes é o modelo
        # tentando e produzindo só lixo.
        status = "ok"
        if not itens and descartes:
            status = "requer_revisao"
        elif calc["requer_revisao"]:
            status = "requer_revisao"
        stats[status] += 1

        vicios.append(
            {
                "proposicao_id": pid,
                "eixo": "federal",
                "nivel_gravidade": calc["nivel_gravidade"],
                "resumo": (bruto.get("resumo") or "")[:2000] or None,
                "modelo": modelo,
                "versao_rubrica": rv.VERSAO_RUBRICA_VICIO,
                "versao_prompt": rv.VERSAO_PROMPT_VICIO,
                "status": status,
            }
        )
        itens_todos.append((pid, itens))
        marcador = f" descartes: {descartes}" if descartes else ""
        print(f"  {ident}: {calc['nivel_gravidade']} ({len(itens)} item(ns)) [{status}]{marcador}")

    if dry_run:
        print(f"\n[dry-run] nada gravado. {stats}")
        return stats
    if not vicios:
        print(f"\n[importar-vicio] nada para gravar. {stats}")
        return stats

    upsert_em_lotes(sb, "vicios_legislativos", vicios, on_conflict="proposicao_id")

    ids = [v["proposicao_id"] for v in vicios]
    salvas = {
        r["proposicao_id"]: r["id"]
        for r in sb.table("vicios_legislativos").select("id, proposicao_id").in_("proposicao_id", ids).execute().data
    }
    sb.table("vicio_itens").delete().in_("vicio_id", list(salvas.values())).execute()

    linhas = [
        {**item, "vicio_id": salvas[pid]}
        for pid, itens in itens_todos
        if salvas.get(pid)
        for item in itens
    ]
    if linhas:
        upsert_em_lotes(sb, "vicio_itens", linhas)

    print(f"\n[importar-vicio] {len(vicios)} análises, {len(linhas)} itens. {stats}")
    return stats


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dir", default="analises_vicio_pendentes")
    ap.add_argument("--modelo", default="")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    importar(Path(a.dir), a.modelo, a.dry_run)
