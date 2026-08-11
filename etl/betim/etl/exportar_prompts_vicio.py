"""etl.exportar_prompts_vicio — despeja prompts da análise de VÍCIO
LEGISLATIVO (eixo Cidades) em disco. Par de `etl.importar_analises_vicio`,
mesmo desenho de `etl.exportar_prompts` (análise garantista municipal): sem
AI_API_KEY neste eixo, então isto imprime, QUALQUER modelo responde, o
importador traz de volta com validação.

    python -m etl.exportar_prompts_vicio --id-municipio 3106705 --ids <uuid1>,<uuid2> --tipo-objeto proposicao
    python -m etl.exportar_prompts_vicio --id-municipio 3550308 --limite 30 --dir analises_vicio_pendentes

--ids é o caminho da CALIBRAÇÃO: lista curada de candidatos prováveis por
palavra-chave na ementa. --limite (sem --ids) varre `proposicoes`/`atos_oficiais`
da cidade ainda sem análise de vício, mais recentes primeiro.
"""
import argparse
import json
from pathlib import Path

from etl import analise_vicio as av
from etl.common import carregar_municipio, get_supabase_client

INSTRUCOES = """# Análise de vício legislativo / indício de inconstitucionalidade — {municipio} ({id_municipio})

Cada arquivo `.txt` desta pasta é o prompt de UM objeto — lei municipal já
sancionada ou projeto em tramitação na Câmara Municipal.

Para cada `<id>.txt`, produza `<id>.json` na MESMA pasta (mesmo id,
extensão `.json`). `_SYSTEM.txt` é a instrução de sistema, vale para todos.

## Regra mais importante

NUNCA declare que uma proposição/lei "é inconstitucional". Aponte indício +
categoria + dispositivo citado. Quem decide é o Judiciário.

## Devolver lista vazia é a resposta CERTA na maioria dos casos

A maioria dos projetos municipais (pedidos de sinalização, indicação,
homenagem, crédito suplementar) não tem vício nenhum. `indicios: []` é o
acerto — não force uma categoria.

## Depois de responder tudo

    python -m etl.importar_analises_vicio --id-municipio {id_municipio} --dir {dir}
"""


def _normalizar_lote(sb, id_municipio: str, tipo_objeto: str, registros: list[dict]) -> list[dict]:
    municipio = carregar_municipio(id_municipio)
    normaliza = av.normalizar_ato if tipo_objeto == "ato" else av.normalizar_proposicao
    return [normaliza(r, municipio) for r in registros]


def exportar_lista(objetos: list[dict], destino: Path, modelo_rotulo: str) -> int:
    if not objetos:
        print(f"[exportar-vicio] {destino}: nada a exportar.")
        return 0

    destino.mkdir(parents=True, exist_ok=True)
    municipio_nome = objetos[0].get("municipio_nome")
    id_municipio = objetos[0]["id_municipio"]

    for obj in objetos:
        (destino / f"{obj['id']}.txt").write_text(av.montar_prompt(obj), encoding="utf-8")
    (destino / "_SYSTEM.txt").write_text(av.SYSTEM, encoding="utf-8")
    (destino / "_INSTRUCOES.md").write_text(
        INSTRUCOES.format(municipio=municipio_nome, id_municipio=id_municipio, dir=destino.as_posix()),
        encoding="utf-8",
    )
    (destino / "_manifesto.json").write_text(
        json.dumps(
            {
                "id_municipio": id_municipio,
                "municipio": municipio_nome,
                "eixo": "municipal",
                "versao_rubrica_vicio": av.VERSAO_RUBRICA_VICIO,
                "versao_prompt_vicio": av.VERSAO_PROMPT_VICIO,
                "modelo_pretendido": modelo_rotulo,
                "objetos": [
                    {"id": o["id"], "tipo_objeto": o["tipo_objeto"], "identificacao": o["identificacao"]}
                    for o in objetos
                ],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"[exportar-vicio] {len(objetos)} prompts em {destino}/ (+ _SYSTEM.txt, _INSTRUCOES.md, _manifesto.json)")
    return len(objetos)


def exportar_por_ids(id_municipio: str, ids: list[str], tipo_objeto: str, destino: Path, modelo_rotulo: str) -> int:
    sb = get_supabase_client()
    tabela = "atos_oficiais" if tipo_objeto == "ato" else "proposicoes"
    campos = av.CAMPOS_ATO if tipo_objeto == "ato" else av.CAMPOS_PROPOSICAO
    registros: list[dict] = []
    for i in range(0, len(ids), 200):
        lote = ids[i : i + 200]
        registros.extend(
            sb.table(tabela).select(campos).eq("id_municipio", id_municipio).in_("id", lote).execute().data
        )
    por_id = {r["id"]: r for r in registros}
    faltando = [i for i in ids if i not in por_id]
    if faltando:
        print(f"[exportar-vicio] AVISO: {len(faltando)} id(s) não encontrados em {id_municipio}: {faltando}")
    ordenados = [por_id[i] for i in ids if i in por_id]
    objetos = _normalizar_lote(sb, id_municipio, tipo_objeto, ordenados)
    return exportar_lista(objetos, destino, modelo_rotulo)


def exportar_fila(id_municipio: str, limite: int, tipo_objeto: str, destino: Path, modelo_rotulo: str) -> int:
    sb = get_supabase_client()
    tabela = "atos_oficiais" if tipo_objeto == "ato" else "proposicoes"
    campo_fk = "ato_id" if tipo_objeto == "ato" else "proposicao_id"
    campos = av.CAMPOS_ATO if tipo_objeto == "ato" else av.CAMPOS_PROPOSICAO

    analisados = {
        l[campo_fk]
        for l in sb.table("vicios_legislativos")
        .select(campo_fk)
        .eq("id_municipio", id_municipio)
        .not_.is_(campo_fk, "null")
        .execute()
        .data
    }
    ordenar = "data_publicacao" if tipo_objeto == "ato" else "data_apresentacao"
    registros = (
        sb.table(tabela)
        .select(campos)
        .eq("id_municipio", id_municipio)
        .order(ordenar, desc=True)
        .limit(limite + len(analisados))
        .execute()
        .data
    )
    candidatos = [r for r in registros if r["id"] not in analisados][:limite]
    objetos = _normalizar_lote(sb, id_municipio, tipo_objeto, candidatos)
    return exportar_lista(objetos, destino, modelo_rotulo)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--id-municipio", required=True)
    ap.add_argument("--ids", help="lista de uuids separados por vírgula (calibração)")
    ap.add_argument("--limite", type=int, default=50)
    ap.add_argument("--tipo-objeto", choices=["ato", "proposicao"], default="proposicao")
    ap.add_argument("--dir", default="analises_vicio_pendentes")
    ap.add_argument("--modelo", default="externo")
    a = ap.parse_args()

    if a.ids:
        exportar_por_ids(
            a.id_municipio, [s.strip() for s in a.ids.split(",") if s.strip()], a.tipo_objeto, Path(a.dir), a.modelo
        )
    else:
        exportar_fila(a.id_municipio, a.limite, a.tipo_objeto, Path(a.dir), a.modelo)
