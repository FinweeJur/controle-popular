"""Pontua saídas de LLM já gravadas em disco, sem chamar provedor nenhum.

    python -m etl.benchmark.pontuar_saidas --dir saidas_sonnet

Serve para avaliar um modelo que não está atrás de um adapter de
`etl/llm/` — no caso que motivou o arquivo, subagentes Sonnet respondendo
os mesmos prompts que o Ollama local responde em `python -m etl.benchmark`.

O ponto de existir separado do runner é justamente NÃO reimplementar nada:
validação, cálculo de score, rastreabilidade da citação e o relatório são
importados do runner. Só a origem da resposta muda. Se este arquivo
recalculasse score por conta própria, a comparação entre modelos ficaria
comparando duas réguas, que é o erro que a rubrica inteira existe para
evitar.
"""
import argparse
import json
from pathlib import Path

from etl import rubrica
from etl.benchmark.__main__ import (
    BUCKET,
    AQUI,
    CASOS_PATH,
    _carregar_proposicao,
    rastrear,
    relatar,
)


def pontuar(diretorio: Path, rotulo_modelo: str) -> dict:
    casos = json.loads(CASOS_PATH.read_text(encoding="utf-8"))["casos"]
    resultados = []

    for caso in casos:
        arquivo = diretorio / f"{caso['id_camara']}.json"
        if not arquivo.exists():
            print(f"  [FALTA] {caso['identificacao']} — sem {arquivo.name}")
            resultados.append({**caso, "obtido": "erro", "erro": "saída ausente"})
            continue

        try:
            bruto = json.loads(arquivo.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            print(f"  [JSON INVÁLIDO] {caso['identificacao']}: {e}")
            resultados.append({**caso, "obtido": "erro", "erro": f"json inválido: {e}"})
            continue

        prop = _carregar_proposicao(caso["id_camara"])
        fonte = " ".join(
            filter(None, [prop.get("ementa"), prop.get("ementa_detalhada")])
        )

        itens, descartes = rubrica.validar_itens(bruto)
        calculo = rubrica.calcular(itens)
        for i in itens:
            i["origem_citacao"] = rastrear(i["dispositivo"], i["direito"], fonte)

        obtido = BUCKET.get(calculo["rotulo"], calculo["rotulo"])
        r = {
            **caso,
            "obtido": obtido,
            "rotulo_bruto": calculo["rotulo"],
            "score": calculo["score"],
            "acertou": obtido == caso["esperado"],
            "itens": itens,
            "descartes": descartes,
            "clausula_petrea": bool(bruto.get("clausula_petrea")),
            "vedacao_retrocesso": bool(bruto.get("vedacao_retrocesso")),
            "resumo_neutro": (bruto.get("resumo_neutro") or "")[:600],
        }
        resultados.append(r)

        marca = "ok " if r["acertou"] else "ERRO"
        print(
            f"  [{marca}] {caso['identificacao']:<14} esperado={caso['esperado']:<12}"
            f" obtido={obtido:<12} ({calculo['rotulo']}, score {calculo['score']:+.2f},"
            f" {len(itens)} itens)"
        )
        if not r["acertou"]:
            for i in itens:
                print(
                    f"        [{i['peso']:+.2f}] {i['direito']} · {i['direcao']}"
                    f" · {i['grau']} · {i['dispositivo']} <{i['origem_citacao']}>"
                )
            for d in descartes:
                print(f"        DESCARTADO: {d}")

    resumo = relatar(resultados)
    saida = AQUI / f"resultado_{diretorio.name}.json"
    saida.write_text(
        json.dumps(
            {
                "modelo": rotulo_modelo,
                "versao_rubrica": rubrica.VERSAO_RUBRICA,
                "versao_prompt": rubrica.VERSAO_PROMPT,
                "resumo": resumo,
                "casos": resultados,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"\nresultado completo em {saida}")
    return resumo


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--dir", default="saidas_sonnet")
    p.add_argument("--modelo", default="claude-sonnet-5 (subagentes)")
    args = p.parse_args()
    caminho = Path(args.dir)
    if not caminho.is_absolute():
        caminho = AQUI / caminho
    print(f"pontuando {caminho}")
    print(f"rubrica: v{rubrica.VERSAO_RUBRICA} · prompt: v{rubrica.VERSAO_PROMPT}\n")
    pontuar(caminho, args.modelo)
