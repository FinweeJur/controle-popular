"""etl.exportar_prompts — tira a fila de análise do banco e põe em disco.

    python -m etl.exportar_prompts --id-municipio 3106705 --limite 5
    python -m etl.exportar_prompts --id-municipio 3106200 --limite 100 --por-camada
    python -m etl.exportar_prompts --id-municipio 3550308 --limite 50 --formato jsonl

POR QUE ISTO EXISTE (mesma razão do módulo homônimo do Congresso, e ela
vale ainda mais aqui): NÃO HÁ AI_API_KEY neste projeto. O `.env` do eixo
Cidades não tem provedor de LLM configurado — `etl/temas.py` já registra
isso no próprio docstring. Sem export/import, a análise garantista
simplesmente não aconteceria.

O desenho contorna a ausência de chave em vez de esperar por ela: este
módulo despeja os prompts em disco, QUALQUER modelo responde (uma
assinatura que o usuário já paga, um subagente, um humano com paciência), e
`etl.importar_analises` traz de volta.

O prompt exportado é EXATAMENTE o que o ETL usaria se houvesse chave
(`analise_garantista.montar_prompt`), então a análise que volta é comparável
à que um provedor local produziria — muda o modelo, não a régua.

NENHUMA LINHA DO BANCO É ESCRITA AQUI. Exportar é leitura pura; todo o
guarda-corpo mora no importador.
"""
import argparse
import json
from pathlib import Path

from etl import analise_garantista as ag
from etl.fila_prioridade import montar_fila

INSTRUCOES = """# Análise garantista — {municipio} ({id_municipio})

Cada arquivo `.txt` desta pasta é o prompt de UM objeto — uma lei municipal
já sancionada ou um projeto em tramitação.

Para cada `<id>.txt`, produza `<id>.json` na MESMA pasta, com a resposta no
formato JSON pedido no fim do prompt. O nome do arquivo de saída tem de
bater exatamente com o de entrada (mesmo id, extensão `.json`).

O texto de `_SYSTEM.txt` é a instrução de sistema. Vale para todos.

## Depois de responder tudo

    python -m etl.importar_analises --id-municipio {id_municipio} --dir {dir}

O importador valida cada resposta contra a rubrica: item sem dispositivo
legal citável é DESCARTADO antes de contar, e o score/rótulo é recalculado
de forma determinística por `rubrica.calcular()`. Ou seja: não dá para o
modelo "decidir" o rótulo, nem inventar artigo e ser levado a sério.

## Devolver lista vazia é uma resposta CERTA

Se o objeto for crédito suplementar, denominação de logradouro, homenagem
ou data comemorativa, `direitos_afetados: []` é o acerto — não force uma
classificação. A fila já despriorizou a maior parte desses casos, mas
alguns passam.
"""


def _resumo_camadas(fila: list[dict]) -> dict[str, int]:
    contagem: dict[str, int] = {}
    for obj in fila:
        contagem[obj["_camada"]] = contagem.get(obj["_camada"], 0) + 1
    return contagem


def exportar_lista(fila: list[dict], destino: Path, formato: str, modelo_rotulo: str) -> int:
    """Núcleo de exportação, reutilizável com qualquer lista já normalizada."""
    if not fila:
        print(f"[exportar] {destino}: nada a exportar.")
        return 0

    destino.mkdir(parents=True, exist_ok=True)
    municipio_nome = fila[0].get("municipio_nome")
    id_municipio = fila[0]["id_municipio"]

    if formato == "jsonl":
        # Um arquivo só, para quem vai scriptar contra uma API própria.
        alvo = destino / "prompts.jsonl"
        with alvo.open("w", encoding="utf-8") as f:
            for obj in fila:
                f.write(
                    json.dumps(
                        {
                            "id": obj["id"],
                            "tipo_objeto": obj["tipo_objeto"],
                            "identificacao": obj["identificacao"],
                            "system": ag.SYSTEM,
                            "prompt": ag.montar_prompt(obj),
                        },
                        ensure_ascii=False,
                    )
                    + "\n"
                )
        print(f"[exportar] {len(fila)} prompts em {alvo}")
    else:
        for obj in fila:
            (destino / f"{obj['id']}.txt").write_text(ag.montar_prompt(obj), encoding="utf-8")
        (destino / "_SYSTEM.txt").write_text(ag.SYSTEM, encoding="utf-8")
        (destino / "_INSTRUCOES.md").write_text(
            INSTRUCOES.format(
                municipio=municipio_nome, id_municipio=id_municipio, dir=destino.as_posix()
            ),
            encoding="utf-8",
        )
        print(f"[exportar] {len(fila)} prompts em {destino}/ (+ _SYSTEM.txt, _INSTRUCOES.md)")

    # MANIFESTO. O importador confere contra ele, e não contra o nome do
    # arquivo: é onde mora `tipo_objeto` (ato ou proposição — o banco tem
    # duas colunas e uma só pode ser preenchida) e `id_municipio` (sem ele o
    # importador teria de adivinhar a cidade, e adivinhar cidade neste
    # projeto já reetiquetou dado uma vez).
    (destino / "_manifesto.json").write_text(
        json.dumps(
            {
                "id_municipio": id_municipio,
                "municipio": municipio_nome,
                "versao_rubrica": ag.VERSAO_RUBRICA,
                "versao_prompt": ag.VERSAO_PROMPT,
                "modelo_pretendido": modelo_rotulo,
                "camadas": _resumo_camadas(fila),
                "objetos": [
                    {
                        "id": o["id"],
                        "tipo_objeto": o["tipo_objeto"],
                        "identificacao": o["identificacao"],
                        "camada": o["_camada"],
                    }
                    for o in fila
                ],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    return len(fila)


def exportar(
    id_municipio: str,
    limite: int,
    destino: Path,
    formato: str,
    modelo_rotulo: str,
    incluir_ruido: bool = False,
    tipo_objeto: str = "ambos",
    por_camada: bool = False,
) -> int:
    fila = montar_fila(id_municipio, limite, incluir_ruido, tipo_objeto)
    if not fila:
        print("[exportar] fila vazia — tudo analisado nesta cidade.")
        return 0

    if not por_camada:
        return exportar_lista(fila, destino, formato, modelo_rotulo)

    # UMA SUBPASTA POR CAMADA, e o motivo é operacional: o importador opera
    # sobre um `_manifesto.json` por diretório. Separando, dá para importar
    # `lei_vigente_com_sinal` assim que ficar pronta em vez de esperar as
    # 894 respostas de Betim inteiras.
    total = 0
    for camada in dict.fromkeys(o["_camada"] for o in fila):
        subconjunto = [o for o in fila if o["_camada"] == camada]
        total += exportar_lista(subconjunto, destino / camada, formato, modelo_rotulo)
    return total


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    # Sem default de cidade: ver scripts/conferir_defaults_de_cidade.py.
    ap.add_argument("--id-municipio", required=True)
    ap.add_argument("--limite", type=int, default=100)
    ap.add_argument("--dir", default="analises_pendentes")
    ap.add_argument("--formato", choices=["arquivos", "jsonl"], default="arquivos")
    ap.add_argument(
        "--modelo",
        default="externo",
        help="rótulo gravado em analises.modelo (ex.: 'claude-opus-5')",
    )
    ap.add_argument("--tipo-objeto", choices=["ambos", "ato", "proposicao"], default="ambos")
    ap.add_argument("--incluir-ruido", action="store_true")
    ap.add_argument(
        "--por-camada",
        action="store_true",
        help="uma subpasta por camada da fila, cada uma com seu manifesto",
    )
    a = ap.parse_args()

    exportar(
        a.id_municipio,
        a.limite,
        Path(a.dir),
        a.formato,
        a.modelo,
        a.incluir_ruido,
        a.tipo_objeto,
        a.por_camada,
    )
