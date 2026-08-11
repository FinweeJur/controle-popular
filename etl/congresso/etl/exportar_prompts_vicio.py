"""etl.exportar_prompts_vicio — despeja prompts da análise de VÍCIO
LEGISLATIVO em disco. Par de `etl.importar_analises_vicio`, mesmo desenho de
`etl.exportar_prompts` (análise garantista): não há AI_API_KEY neste
projeto para rodar em fila automática ainda, então isto imprime o prompt,
QUALQUER modelo responde, o importador traz de volta com validação.

    python -m etl.exportar_prompts_vicio --ids PL-2641484,PL-2641485 --dir analises_vicio_pendentes
    python -m etl.exportar_prompts_vicio --limite 30 --dir analises_vicio_pendentes

--ids é o caminho usado pela CALIBRAÇÃO (F0 desta análise): uma lista
curada de candidatos prováveis, escolhida por busca de palavra-chave na
ementa, não a fila de prioridade padrão. --limite (sem --ids) usa
`_fila_vicio`, pensada para quando a análise for pra produção.
"""
import argparse
import json
from pathlib import Path

from etl import rubrica_vicio as rv
from etl.common import fetch_all, get_supabase_client

INSTRUCOES = """# Análise de vício legislativo / indício de inconstitucionalidade

Cada arquivo `.txt` desta pasta é o prompt de UMA proposição do Congresso
Nacional. Para cada `<id>.txt`, produza `<id>.json` na MESMA pasta, com a
resposta no formato JSON pedido no fim do prompt (mesmo nome, extensão
`.json`).

O texto abaixo é a instrução de sistema. Use-o como regra para todos.

---

{system}

---

## Regra mais importante

NUNCA declare que uma proposição "é inconstitucional". Aponte indício +
categoria + dispositivo citado. Quem decide é o Judiciário.

## Devolver lista vazia é a resposta CERTA na maioria dos casos

A maior parte dos PLs não tem vício nenhum. `indicios: []` é o acerto quando
não há nada a apontar — não force uma categoria.

## Depois de responder tudo

    python -m etl.importar_analises_vicio --dir {dir}

O importador valida cada resposta contra a rubrica de vício: item sem
dispositivo citável é descartado, item de categoria que não se aplica ao
eixo federal (ex.: `vicio_competencia` fora de casos raros) é descartado, e
`nivel_gravidade` é recalculado de forma determinística — o modelo não
decide o nível, só aponta a categoria.
"""


def _autores_das_proposicoes(sb, ids: list[str]) -> dict[str, str]:
    """Autor principal (proponente, ou o primeiro por ordem) de cada
    proposição — o prompt precisa saber QUEM propôs para avaliar vício de
    iniciativa (regra 4 do SYSTEM: PL de conversão de MP ou de autoria do
    próprio Executivo não tem vício de iniciativa).

    Duas fontes, nesta ordem, porque nenhuma das duas está preenchida para
    TODA proposição (medido: `proposicao_autoria` — a tabela "de leitura
    completa", com institucional incluído — está vazia para boa parte do
    lote sincronizado mais recente; `proposicao_autores` — a tabela "de
    contato", só parlamentar com e-mail — cobre parte do que falta). Cair
    para a segunda só para quem a primeira não respondeu, não substituir.
    """
    autores: dict[str, str] = {}
    for i in range(0, len(ids), 200):
        lote = ids[i : i + 200]
        linhas = (
            sb.table("proposicao_autoria")
            .select("proposicao_id, nome, partido, uf, proponente, ordem, cod_tipo")
            .in_("proposicao_id", lote)
            .execute()
            .data
        )
        melhores: dict[str, dict] = {}
        for l in linhas:
            atual = melhores.get(l["proposicao_id"])
            # proponente=true vence; entre não-proponentes, menor `ordem`.
            if atual is None or (l.get("proponente") and not atual.get("proponente")):
                melhores[l["proposicao_id"]] = l
            elif not atual.get("proponente") and (l.get("ordem") or 999) < (atual.get("ordem") or 999):
                melhores[l["proposicao_id"]] = l
        for pid, l in melhores.items():
            institucional = l.get("cod_tipo") == 10000
            rotulo = l["nome"] + (f" ({l['partido']})" if l.get("partido") else "")
            if institucional:
                rotulo += " — autoria institucional (não é parlamentar individual)"
            autores[pid] = rotulo

    faltando = [i for i in ids if i not in autores]
    if faltando:
        for i in range(0, len(faltando), 200):
            lote = faltando[i : i + 200]
            linhas = (
                sb.table("proposicao_autores")
                .select("proposicao_id, ordem, proponente, parlamentar_id")
                .in_("proposicao_id", lote)
                .order("ordem")
                .execute()
                .data
            )
            parlamentar_ids = list({l["parlamentar_id"] for l in linhas if l.get("parlamentar_id")})
            nomes: dict[str, dict] = {}
            for j in range(0, len(parlamentar_ids), 200):
                for p in (
                    sb.table("parlamentares")
                    .select("id, nome, partido")
                    .in_("id", parlamentar_ids[j : j + 200])
                    .execute()
                    .data
                ):
                    nomes[p["id"]] = p
            melhores2: dict[str, dict] = {}
            for l in linhas:
                atual = melhores2.get(l["proposicao_id"])
                if atual is None or (l.get("proponente") and not atual.get("proponente")):
                    melhores2[l["proposicao_id"]] = l
            for pid, l in melhores2.items():
                p = nomes.get(l.get("parlamentar_id"))
                if not p:
                    continue
                rotulo = p["nome"] + (f" ({p['partido']})" if p.get("partido") else "")
                autores[pid] = rotulo
    return autores


def _tipo_instrumento(sigla_tipo: str | None) -> str:
    return {
        "PL": "Projeto de Lei (lei ordinária)",
        "PLP": "Projeto de Lei Complementar",
        "PEC": "Proposta de Emenda à Constituição",
        "MPV": "Medida Provisória (originada do próprio Poder Executivo)",
        "PLV": "Projeto de Lei de Conversão (deriva de Medida Provisória — já originada do Executivo)",
        "PDL": "Projeto de Decreto Legislativo (competência exclusiva do Congresso, art. 49 CF)",
    }.get(sigla_tipo or "", sigla_tipo or "não informado")


def _normalizar(prop: dict, autor: str | None) -> dict:
    return {
        "id": prop["id"],
        "identificacao": prop.get("identificacao"),
        "ementa": prop.get("ementa"),
        "situacao": prop.get("situacao"),
        "autor": autor or "não identificado no banco",
        "tipo_instrumento": _tipo_instrumento(prop.get("sigla_tipo")),
    }


def _fila_vicio(sb, limite: int) -> list[dict]:
    """Proposições ainda sem análise de vício, mais recentes primeiro."""
    analisadas = {
        l["proposicao_id"]
        for l in fetch_all(lambda: sb.table("vicios_legislativos").select("proposicao_id"))
    }
    candidatas = fetch_all(
        lambda: sb.table("proposicoes")
        .select("id, sigla_tipo, identificacao, ementa, situacao, tramitando")
        .eq("tramitando", True)
        .order("data_apresentacao", desc=True)
    )
    candidatas = [p for p in candidatas if p["id"] not in analisadas]
    return candidatas[:limite]


def exportar_lista(props: list[dict], destino: Path, modelo_rotulo: str) -> int:
    if not props:
        print(f"[exportar-vicio] {destino}: nada a exportar.")
        return 0

    sb = get_supabase_client()
    autores = _autores_das_proposicoes(sb, [p["id"] for p in props])
    objetos = [_normalizar(p, autores.get(p["id"])) for p in props]

    destino.mkdir(parents=True, exist_ok=True)
    for obj in objetos:
        (destino / f"{obj['id']}.txt").write_text(
            rv.montar_prompt(obj, "federal"), encoding="utf-8"
        )
    (destino / "_SYSTEM.txt").write_text(rv.SYSTEM, encoding="utf-8")
    (destino / "_INSTRUCOES.md").write_text(
        INSTRUCOES.format(system=rv.SYSTEM, dir=destino.as_posix()), encoding="utf-8"
    )
    (destino / "_manifesto.json").write_text(
        json.dumps(
            {
                "eixo": "federal",
                "versao_rubrica_vicio": rv.VERSAO_RUBRICA_VICIO,
                "versao_prompt_vicio": rv.VERSAO_PROMPT_VICIO,
                "modelo_pretendido": modelo_rotulo,
                "proposicoes": [
                    {"id": o["id"], "identificacao": o["identificacao"]} for o in objetos
                ],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"[exportar-vicio] {len(objetos)} prompts em {destino}/ (+ _SYSTEM.txt, _INSTRUCOES.md, _manifesto.json)")
    return len(objetos)


def exportar_por_ids(ids: list[str], destino: Path, modelo_rotulo: str) -> int:
    sb = get_supabase_client()
    props: list[dict] = []
    for i in range(0, len(ids), 200):
        lote = ids[i : i + 200]
        props.extend(
            sb.table("proposicoes")
            .select("id, sigla_tipo, identificacao, ementa, situacao, tramitando")
            .in_("id", lote)
            .execute()
            .data
        )
    # Preserva a ordem pedida (a ordem do banco não bate com a da lista).
    por_id = {p["id"]: p for p in props}
    faltando = [i for i in ids if i not in por_id]
    if faltando:
        print(f"[exportar-vicio] AVISO: {len(faltando)} id(s) não encontrados: {faltando}")
    ordenados = [por_id[i] for i in ids if i in por_id]
    return exportar_lista(ordenados, destino, modelo_rotulo)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--ids", help="lista de uuids separados por vírgula (calibração)")
    ap.add_argument("--limite", type=int, default=100, help="usa a fila padrão quando --ids não é passado")
    ap.add_argument("--dir", default="analises_vicio_pendentes")
    ap.add_argument("--modelo", default="externo")
    a = ap.parse_args()

    if a.ids:
        exportar_por_ids([s.strip() for s in a.ids.split(",") if s.strip()], Path(a.dir), a.modelo)
    else:
        sb = get_supabase_client()
        fila = _fila_vicio(sb, a.limite)
        exportar_lista(fila, Path(a.dir), a.modelo)
