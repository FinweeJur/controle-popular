"""etl.importar_analises_vicio — traz para o banco as respostas da análise
de VÍCIO LEGISLATIVO (eixo Cidades) geradas fora. Par de
`etl.exportar_prompts_vicio`, mesmo guarda-corpo de `etl.importar_analises`
(análise garantista municipal) e de `etl/congresso/etl/importar_analises_vicio.py`:

  1. Item sem dispositivo citável, ou de categoria fora do eixo municipal, é
     DESCARTADO antes de contar (`rubrica_vicio.validar_itens`).
  2. `nivel_gravidade` sai de `rubrica_vicio.calcular()`, determinístico.
  3. Dois objetos analisáveis (ato sancionado × proposição em tramitação),
     mesma solução de `public.analises`: duas colunas nuláveis com CHECK de
     exclusividade — upsert em duas passadas, uma por coluna-alvo, porque
     `ON CONFLICT` só aceita uma por instrução.

    python -m etl.importar_analises_vicio --id-municipio 3106705 --dir analises_vicio_pendentes --dry-run
"""
import argparse
import json
from pathlib import Path

from etl import analise_vicio as av
from etl.common import get_supabase_client


def _fontes_do_banco(sb, id_municipio: str, objetos: list[dict]) -> dict[str, str]:
    """Ementas relidas do banco (não usadas para nada além de log de
    conferência aqui, mas mantém o padrão do importador garantista de nunca
    confiar em dado que só existe no arquivo de resposta)."""
    ementas: dict[str, str] = {}
    for tabela, tipo in (("atos_oficiais", "ato"), ("proposicoes", "proposicao")):
        ids = [o["id"] for o in objetos if o["tipo_objeto"] == tipo]
        for i in range(0, len(ids), 200):
            lote = ids[i : i + 200]
            for r in (
                sb.table(tabela).select("id, ementa").eq("id_municipio", id_municipio).in_("id", lote).execute().data
            ):
                ementas[r["id"]] = r.get("ementa") or ""
    return ementas


def importar(diretorio: Path, id_municipio: str, modelo: str, dry_run: bool) -> dict:
    manifesto_path = diretorio / "_manifesto.json"
    if not manifesto_path.exists():
        raise SystemExit(
            f"{manifesto_path} não existe — rode "
            f"`python -m etl.exportar_prompts_vicio --id-municipio {id_municipio} --dir {diretorio}` antes."
        )
    manifesto = json.loads(manifesto_path.read_text(encoding="utf-8"))

    if manifesto["versao_rubrica_vicio"] != av.VERSAO_RUBRICA_VICIO:
        raise SystemExit(
            f"rubrica de vício mudou desde a exportação "
            f"({manifesto['versao_rubrica_vicio']} → {av.VERSAO_RUBRICA_VICIO}). Reexporte."
        )
    if manifesto["id_municipio"] != id_municipio:
        raise SystemExit(
            f"o manifesto é de {manifesto['id_municipio']} ({manifesto.get('municipio')}) "
            f"e você passou --id-municipio {id_municipio}. Recusando."
        )

    sb = get_supabase_client()
    modelo = modelo or manifesto.get("modelo_pretendido") or "externo"
    objetos = manifesto["objetos"]
    ementas = _fontes_do_banco(sb, id_municipio, objetos)

    vicios: list[dict] = []
    itens_por_objeto: list[tuple[str, str, list[dict]]] = []
    stats = {"ok": 0, "requer_revisao": 0, "faltando": 0, "invalido": 0, "descartes": 0, "orfao": 0}

    for entrada in objetos:
        oid, tipo, ident = entrada["id"], entrada["tipo_objeto"], entrada.get("identificacao")
        arq = diretorio / f"{oid}.json"
        if not arq.exists():
            stats["faltando"] += 1
            continue
        if oid not in ementas:
            print(f"  [ÓRFÃO] {ident}: id não está em {id_municipio}")
            stats["orfao"] += 1
            continue

        try:
            bruto = json.loads(arq.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            print(f"  [JSON INVÁLIDO] {ident}: {e}")
            stats["invalido"] += 1
            continue
        if not isinstance(bruto, dict):
            print(f"  [JSON INVÁLIDO] {ident}: esperava objeto, veio {type(bruto).__name__}")
            stats["invalido"] += 1
            continue

        itens, descartes = av.validar_itens(bruto, "municipal")
        calc = av.calcular(itens)
        stats["descartes"] += len(descartes)

        status = "ok"
        if not itens and descartes:
            status = "requer_revisao"
        elif calc["requer_revisao"]:
            status = "requer_revisao"
        stats[status] += 1

        vicios.append(
            {
                "id_municipio": id_municipio,
                "ato_id": oid if tipo == "ato" else None,
                "proposicao_id": oid if tipo == "proposicao" else None,
                "eixo": "municipal",
                "nivel_gravidade": calc["nivel_gravidade"],
                "resumo": (bruto.get("resumo") or "")[:2000] or None,
                "modelo": modelo,
                "versao_rubrica": av.VERSAO_RUBRICA_VICIO,
                "versao_prompt": av.VERSAO_PROMPT_VICIO,
                "status": status,
            }
        )
        itens_por_objeto.append((tipo, oid, itens))
        marcador = f" descartes: {descartes}" if descartes else ""
        print(f"  {ident}: {calc['nivel_gravidade']} ({len(itens)} item(ns)) [{status}]{marcador}")

    if dry_run:
        print(f"\n[dry-run] nada gravado. {stats}")
        return stats
    if not vicios:
        print(f"\n[importar-vicio] nada para gravar. {stats}")
        return stats

    for coluna in ("ato_id", "proposicao_id"):
        grupo = [v for v in vicios if v[coluna]]
        if grupo:
            sb.table("vicios_legislativos").upsert(grupo, on_conflict=coluna).execute()

    salvas: dict[str, str] = {}
    for linha in (
        sb.table("vicios_legislativos")
        .select("id, ato_id, proposicao_id")
        .eq("id_municipio", id_municipio)
        .execute()
        .data
    ):
        chave = linha.get("ato_id") or linha.get("proposicao_id")
        salvas[chave] = linha["id"]

    ids_vicio = [salvas[oid] for _, oid, _ in itens_por_objeto if oid in salvas]
    if ids_vicio:
        for i in range(0, len(ids_vicio), 500):
            sb.table("vicio_itens").delete().in_("vicio_id", ids_vicio[i : i + 500]).execute()

    linhas_itens = [
        {**item, "vicio_id": salvas[oid], "id_municipio": id_municipio}
        for _, oid, itens in itens_por_objeto
        if oid in salvas
        for item in itens
    ]
    if linhas_itens:
        sb.table("vicio_itens").insert(linhas_itens).execute()

    print(f"\n[importar-vicio] {len(vicios)} análises, {len(linhas_itens)} itens. {stats}")
    return stats


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--id-municipio", required=True)
    ap.add_argument("--dir", default="analises_vicio_pendentes")
    ap.add_argument("--modelo", default="")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    importar(Path(a.dir), a.id_municipio, a.modelo, a.dry_run)
