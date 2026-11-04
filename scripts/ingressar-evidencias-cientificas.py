# -*- coding: utf-8 -*-
"""ingressar-evidencias-cientificas.py — leva os artigos do Consensus para a
biblioteca dos crimes socioambientais e para a fonte que o RAG indexa.

Rodar:
    python scripts/ingressar-evidencias-cientificas.py            # escreve
    python scripts/ingressar-evidencias-cientificas.py --seco     # só mede
    python scripts/ingressar-evidencias-cientificas.py --desfazer # tira os nossos itens

## Por que dois destinos

`apps/web/data/biblioteca-desastres-unificada.json` é a **biblioteca dos crimes
socioambientais** — o lugar onde o atingido procura o que existe sobre o caso
dele. Um artigo sobre metal no sedimento do Doce é parte desse acervo.

O índice do assistente, porém, não lê essa biblioteca: ele lê fontes nomeadas em
`apps/web/scripts/indexar-documentos-rag.mts`. Por isso os mesmos itens saem
também em `apps/web/data/biblioteca-evidencias-cientificas.json`, que o indexador
passa a ler como categoria "Acadêmico & Pesquisa".

## O que entra e o que não entra

Entra metadado verificado: título, autores, ano, periódico, DOI, eixo temático e
uma **nota factual escrita por este script** ("artigo sobre X, publicado em Y,
em Z"). Não entra o resumo do periódico nem a síntese do Consensus: a licença do
serviço é uso pessoal e não comercial, e o resumo do paper é obra do editor.
"""

from __future__ import annotations

import argparse
import datetime
import json
import pathlib
import re

RAIZ = pathlib.Path(__file__).resolve().parents[1]
WEB = RAIZ / "apps" / "web" / "data"
BIBLIOTECA = WEB / "biblioteca-desastres-unificada.json"
RAG = WEB / "biblioteca-evidencias-cientificas.json"
ORIGENS = (
    WEB / "evidencias-cientificas-brumadinho.json",
    WEB / "evidencias-cientificas-rio-doce-costeiro.json",
)
FONTE_ID = "consensus-evidencias"

# O catálogo fala "rio Doce / litoral..." e "brumadinho"; a biblioteca usa as
# chaves que já existem nos outros itens, para o filtro da página funcionar.
DESENVOLVIMENTO = {
    "brumadinho": {"desastre": "brumadinho", "bacia": "paraopeba", "uf": "MG"},
    "rio": {"desastre": "mariana", "bacia": "rio-doce", "uf": "ES"},
}


def _chave_desastre(nome: str) -> dict:
    texto = (nome or "").lower()
    for marca, valores in DESENVOLVIMENTO.items():
        if marca in texto:
            return valores
    return {"desastre": "rio-doce", "bacia": "rio-doce", "uf": "MG"}


def _id(trabalho: dict) -> str:
    doi = (trabalho.get("doi") or "").strip()
    if doi:
        return f"artigo:{doi}"
    sumario = re.sub(r"[^a-z0-9]+", "-", trabalho["titulo"].lower()).strip("-")[:48]
    return f"artigo:{sumario or 'sem-titulo'}"


def _data(ano: str) -> str:
    return f"{ano}-01-01" if (ano or "").isdigit() else ""


def _tipo_origem(trabalho: dict) -> str:
    tipo = trabalho.get("tipo") or "artigo"
    return "artigo" if tipo == "não informado" else tipo


def item_de(trabalho: dict, gerado_em: str) -> dict:
    base = _chave_desastre(trabalho.get("desastre", ""))
    return {
        "id": _id(trabalho),
        **base,
        "titulo": trabalho["titulo"],
        "data": _data(trabalho.get("ano", "")),
        "tipo": "Artigo científico",
        "tipoOrigem": _tipo_origem(trabalho),
        "orgao": trabalho.get("revista") or "periódico não informado",
        "esfera": "academica",
        "autores": trabalho.get("autores") or [],
        "doi": trabalho.get("doi") or "",
        "tags": [trabalho.get("eixo") or "geral", "evidência científica"],
        "resumo": trabalho.get("nota") or "",
        "url": trabalho.get("link") or "",
        "linkConsensus": trabalho.get("linkConsensus") or "",
        "fonteId": FONTE_ID,
        "coletadoEm": gerado_em,
    }


def _serve(item: dict, vistos: set[str]) -> bool:
    """Item precisa ter id novo, URL e texto próprio — senão o RAG descarta."""
    if not item["id"] or item["id"] in vistos:
        return False
    return bool(item["url"] and item["resumo"])


def _de_um_catalogo(caminho: pathlib.Path, vistos: set[str]) -> list[dict]:
    if not caminho.exists():
        print(f"aviso: {caminho.name} ausente")
        return []
    catalogo = json.loads(caminho.read_text(encoding="utf-8"))
    saida = []
    for trabalho in catalogo.get("trabalhos", []):
        item = item_de(trabalho, datetime.date.today().isoformat())
        if _serve(item, vistos):
            vistos.add(item["id"])
            saida.append(item)
    return saida


def carregar_itens() -> list[dict]:
    vistos: set[str] = set()
    itens: list[dict] = []
    for caminho in ORIGENS:
        itens += _de_um_catalogo(caminho, vistos)
    return itens


def ler(caminho: pathlib.Path) -> dict:
    return json.loads(caminho.read_text(encoding="utf-8"))


def escrever(caminho: pathlib.Path, dados: dict) -> None:
    caminho.write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")),
                       encoding="utf-8")


def injetar_biblioteca(itens: list[dict], seco: bool) -> str:
    dados = ler(BIBLIOTECA)
    atuais = [i for i in dados.get("itens", []) if i.get("fonteId") != FONTE_ID]
    restantes = [i for i in itens if i["id"] not in {a.get("id") for a in atuais}]
    dados["itens"] = atuais + restantes
    dados["total"] = len(dados["itens"])
    dados["geradoEm"] = datetime.date.today().isoformat()
    if not seco:
        escrever(BIBLIOTECA, dados)
    return f"biblioteca: {dados['total']} itens ({len(restantes)} novos de evidência)"


def escrever_rag(itens: list[dict], seco: bool) -> str:
    dados = {"geradoEm": datetime.date.today().isoformat(),
             "fonte": "Consensus (metadado verificado; sem síntese, sem resumo de periódico)",
             "total": len(itens),
             "itens": sorted(itens, key=lambda i: (i["data"], i["titulo"]), reverse=True)}
    if not seco:
        escrever(RAG, dados)
    return f"fonte do rag: {len(itens)} itens em {RAG.name}"


def main() -> int:
    ap = argparse.ArgumentParser(description="Ingestão da evidência científica.")
    ap.add_argument("--seco", action="store_true")
    ap.add_argument("--desfazer", action="store_true",
                    help="remove os itens desta fonte da biblioteca, sem reescrever o RAG")
    opcoes = ap.parse_args()

    if opcoes.desfazer:
        dados = ler(BIBLIOTECA)
        antes = len(dados.get("itens", []))
        dados["itens"] = [i for i in dados["itens"] if i.get("fonteId") != FONTE_ID]
        dados["total"] = len(dados["itens"])
        escrever(BIBLIOTECA, dados)
        print(f"removidos {antes - dados['total']} itens de {FONTE_ID}")
        return 0

    itens = carregar_itens()
    if not itens:
        print("nada a ingerir")
        return 1
    print(injetar_biblioteca(itens, opcoes.seco))
    print(escrever_rag(itens, opcoes.seco))
    if opcoes.seco:
        print("(simulação: nada foi escrito)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
