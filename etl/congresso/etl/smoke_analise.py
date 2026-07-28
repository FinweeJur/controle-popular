"""Teste de fumaça da rubrica, SEM Supabase.

`python -m etl.smoke_analise [--n 5]`

Puxa proposições reais da API da Câmara, roda a análise ponta a ponta
(prompt → LLM → validação → score) e imprime o resultado. Existe para
responder a pergunta mais arriscada do projeto — *um modelo local de 8B
produz análise jurídica estruturada utilizável?* — antes de haver banco,
frontend ou qualquer coisa construída em cima dessa premissa.

Mede o que importa: quantos itens o modelo produziu, quantos foram
DESCARTADOS pela validação e por quê. Um modelo que produz 10 itens dos
quais 9 citam dispositivo inventado é pior que um que produz 2 válidos.
"""
import argparse
import json
import urllib.request

from etl import rubrica
from etl.llm import LLMError, get_provider
from etl.normas import extrair as extrair_normas

API = "https://dadosabertos.camara.leg.br/api/v2"


def _buscar(n: int) -> list[dict]:
    url = f"{API}/proposicoes?siglaTipo=PL&ano=2026&itens={n}&ordem=DESC&ordenarPor=id"
    lista = json.load(urllib.request.urlopen(url, timeout=60))["dados"]
    props = []
    for p in lista:
        det = json.load(
            urllib.request.urlopen(f"{API}/proposicoes/{p['id']}", timeout=60)
        )["dados"]
        props.append(
            {
                "id": str(p["id"]),
                "identificacao": f"{p['siglaTipo']} {p['numero']}/{p['ano']}",
                "ementa": p.get("ementa"),
                "ementa_detalhada": det.get("ementaDetalhada"),
                "keywords": det.get("keywords"),
                "texto_integral": None,
            }
        )
    return props


def main(n: int) -> None:
    provider = get_provider()
    print(f"provedor: {provider.identificacao}")
    if not provider.disponivel():
        raise SystemExit(
            "provedor indisponível. Com Ollama: verifique se está rodando "
            "(`ollama list`) e se LLM_MODEL existe."
        )

    props = _buscar(n)
    total_itens = total_descartes = 0

    for prop in props:
        print("\n" + "=" * 78)
        print(f"{prop['identificacao']}: {(prop['ementa'] or '')[:150]}")
        try:
            bruto = provider.gerar_json(
                rubrica.montar_prompt(prop), system=rubrica.SYSTEM, temperatura=0.0
            )
        except LLMError as e:
            print(f"  ERRO: {e}")
            continue

        itens, descartes = rubrica.validar_itens(bruto)
        calculo = rubrica.calcular(itens)
        total_itens += len(itens)
        total_descartes += len(descartes)

        print(f"  => {calculo['rotulo'].upper()}  (score {calculo['score']})")
        if bruto.get("clausula_petrea"):
            print("  => selo: toca cláusula pétrea")
        if bruto.get("vedacao_retrocesso"):
            print("  => selo: possível vedação do retrocesso")
        for i in itens:
            print(
                f"     [{i['peso']:+.2f}] {i['direito']} · {i['direcao']} · {i['grau']}"
                f" · {i['dispositivo']} (conf. {i['confianca']})"
            )
        for d in descartes:
            print(f"     DESCARTADO: {d}")
        normas = extrair_normas(prop["ementa"])
        if normas:
            print(f"     legislação relacionada: {[x['identificador'] for x in normas]}")

    print("\n" + "=" * 78)
    print(f"RESUMO: {total_itens} itens válidos · {total_descartes} descartados em {len(props)} proposições")
    if total_itens + total_descartes:
        taxa = total_descartes / (total_itens + total_descartes)
        print(f"taxa de descarte: {taxa:.0%}")
        print(
            "Acima de ~40% indica que o modelo não está entendendo a taxonomia: "
            "vale ajustar o prompt ou subir para um modelo maior antes de construir "
            "em cima disto."
        )


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--n", type=int, default=5)
    main(p.parse_args().n)
