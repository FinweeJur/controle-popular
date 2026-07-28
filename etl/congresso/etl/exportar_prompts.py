"""etl.exportar_prompts — tira a fila de análise do banco e põe em disco.

    python -m etl.exportar_prompts --limite 100
    python -m etl.exportar_prompts --limite 500 --dir analises_pendentes
    python -m etl.exportar_prompts --limite 50 --formato jsonl

POR QUE ISTO EXISTE: a análise não precisa sair do adapter de `etl/llm/`.
Um modelo bom pode estar numa assinatura (Claude Code, ChatGPT Plus) ou
numa API que o usuário já paga — lugares onde não há chave para o ETL
usar, mas há capacidade ociosa. Este módulo despeja os prompts; qualquer
modelo responde; `etl.importar_analises` traz de volta.

O prompt é EXATAMENTE o mesmo que o ETL usaria (`rubrica.montar_prompt`),
então a análise que volta é comparável à que o Ollama produziria — muda o
modelo, não a régua. É a mesma razão de `pontuar_saidas` importar tudo do
runner do benchmark em vez de reimplementar.

Nenhuma linha do banco é escrita aqui. Exportar é leitura pura.
"""
import argparse
import json
from pathlib import Path

from etl import rubrica
from etl.analise import _fila
from etl.common import get_supabase_client

INSTRUCOES = """# Análise de proposições — instruções

Cada arquivo `.txt` desta pasta é o prompt de UMA proposição.

Para cada `<id>.txt`, produza `<id>.json` na MESMA pasta, com a resposta
no formato JSON pedido no fim do prompt. O nome do arquivo de saída tem de
bater exatamente com o de entrada (mesmo id, extensão `.json`).

O texto abaixo é a instrução de sistema. Use-o como regra para todos.

---

{system}

---

## Depois de responder tudo

    python -m etl.importar_analises --dir {dir}

O importador valida cada resposta contra a rubrica: item sem dispositivo
legal citável é DESCARTADO antes de contar, e o score/rótulo é recalculado
de forma determinística. Ou seja: não dá para o modelo "decidir" o rótulo,
nem inventar artigo e ser levado a sério — o mesmo guarda-corpo do ETL.
"""


def exportar(limite: int, destino: Path, formato: str, modelo_rotulo: str) -> int:
    sb = get_supabase_client()
    fila = _fila(sb, limite)
    if not fila:
        print("[exportar] fila vazia — tudo analisado.")
        return 0
    return exportar_lista(fila, destino, formato, modelo_rotulo)


def exportar_lista(fila: list[dict], destino: Path, formato: str, modelo_rotulo: str) -> int:
    """Núcleo de exportação, reutilizável com qualquer lista de proposições
    — a fila padrão (`_fila`) ou uma camada de `etl.fila_prioridade`."""
    if not fila:
        print(f"[exportar] {destino}: nada a exportar.")
        return 0

    destino.mkdir(parents=True, exist_ok=True)

    if formato == "jsonl":
        # Um arquivo só, para quem vai script*ar contra uma API própria.
        alvo = destino / "prompts.jsonl"
        with alvo.open("w", encoding="utf-8") as f:
            for p in fila:
                f.write(
                    json.dumps(
                        {
                            "id": p["id"],
                            "identificacao": p.get("identificacao"),
                            "system": rubrica.SYSTEM,
                            "prompt": rubrica.montar_prompt(p),
                        },
                        ensure_ascii=False,
                    )
                    + "\n"
                )
        print(f"[exportar] {len(fila)} prompts em {alvo}")
    else:
        for p in fila:
            (destino / f"{p['id']}.txt").write_text(
                rubrica.montar_prompt(p), encoding="utf-8"
            )
        (destino / "_SYSTEM.txt").write_text(rubrica.SYSTEM, encoding="utf-8")
        (destino / "_INSTRUCOES.md").write_text(
            INSTRUCOES.format(system=rubrica.SYSTEM, dir=destino.name), encoding="utf-8"
        )
        print(f"[exportar] {len(fila)} prompts em {destino}/ (+ _SYSTEM.txt, _INSTRUCOES.md)")

    # Manifesto: o importador confere contra isto para saber a que proposição
    # cada resposta pertence, sem depender só do nome do arquivo.
    (destino / "_manifesto.json").write_text(
        json.dumps(
            {
                "versao_rubrica": rubrica.VERSAO_RUBRICA,
                "versao_prompt": rubrica.VERSAO_PROMPT,
                "modelo_pretendido": modelo_rotulo,
                "proposicoes": [
                    {"id": p["id"], "identificacao": p.get("identificacao")} for p in fila
                ],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    return len(fila)


def exportar_fila_priorizada(destino_raiz: Path, formato: str, modelo_rotulo: str, **limites) -> None:
    """Exporta a fila de `etl.fila_prioridade`, uma subpasta por camada.

    Uma subpasta por camada (não um único diretório) porque
    `etl.importar_analises` opera sobre um `_manifesto.json` por diretório;
    manter as camadas separadas permite importar cada uma assim que fica
    pronta, em vez de esperar as 670 proposições estarem todas analisadas
    antes de gravar a primeira.
    """
    from etl.fila_prioridade import montar_fila

    fila = montar_fila(**limites)
    for nome_camada, props in fila.items():
        subdir = destino_raiz / nome_camada.replace(":", "_")
        exportar_lista(props, subdir, formato, modelo_rotulo)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--limite", type=int, default=100)
    ap.add_argument("--dir", default="analises_pendentes")
    ap.add_argument("--formato", choices=["arquivos", "jsonl"], default="arquivos")
    ap.add_argument(
        "--modelo",
        default="externo",
        help="rótulo gravado em analises.modelo (ex.: 'claude-sonnet-4.6-max')",
    )
    ap.add_argument(
        "--fila-priorizada",
        action="store_true",
        help="usa etl.fila_prioridade em vez da fila padrão; exporta uma subpasta por camada em --dir",
    )
    ap.add_argument("--tramitacao", type=int, default=200)
    ap.add_argument("--recentes", type=int, default=100)
    ap.add_argument("--por-tema", type=int, default=50)
    a = ap.parse_args()

    if a.fila_priorizada:
        exportar_fila_priorizada(
            Path(a.dir),
            a.formato,
            a.modelo,
            limite_tramitacao=a.tramitacao,
            limite_recentes=a.recentes,
            limite_por_tema=a.por_tema,
        )
    else:
        exportar(a.limite, Path(a.dir), a.formato, a.modelo)
