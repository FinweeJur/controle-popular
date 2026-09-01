"""coletar-biblioteca-ati-mariana.py — biblioteca das ATIs do desastre de
Mariana (Rio Doce), fonte AEDAS.

Grava `etl/betim/dados/desastres/ati-aedas-mariana.json`, que o agregador
`scripts/agregar-biblioteca-desastres.mts` funde na biblioteca unificada dos
crimes socioambientais (desastre = "mariana", bacia = "doce").

Rodar:
    python scripts/coletar-biblioteca-ati-mariana.py --seco
    python scripts/coletar-biblioteca-ati-mariana.py

## As ATIs de Mariana existem (correcao do dono, 01/09/2026)

ATIs existem nos DOIS desastres. O acervo ATI ja coletado
(`coletar-biblioteca-ati.py`) cobre o programa Paraopeba (Brumadinho). As ATIs
de Mariana — AEDAS, ADAI, Caritas, CTA — sao fonte nova, desastre "mariana".
Este coletor comeca pela AEDAS, unica com REST publica confirmada (robots.txt
aberto, wp-json vivo, medida em 01/09/2026). Caritas, CTA e o programa Doce da
ADAI ficam para rodada seguinte (sites sem REST/sitemap publico confirmado).

## Metodo (medido)

AEDAS e WordPress com REST publica: `wp-json/wp/v2/documento?projeto=<id>`.
A taxonomia `projeto` (medida em 01/09/2026) traz os programas do Rio Doce:

    Aimores(380), Barra Longa(134), Conselheiro Pena(378),
    Medio Rio Doce(133), Resplendor-Itueta(379), Vale do Aco(377).

O mesmo documento costuma pertencer a VARIOS projetos Doce (ex.: a edicao do
jornal Territorios tem `projeto:[380,378,133,379,377]`) — por isso se consulta
cada projeto e se deduplica por id, exatamente como o coletor do Paraopeba faz
com os projetos 3/299.

Ficam de fora: `Itatiaiucu` (135, nao e bacia do Doce) e `Veredas Sol e Lares`
(132, vinculo com a bacia nao confirmado) — declarados em `ficou_de_fora`.

## Regras do acervo (mesmas da biblioteca das ATIs)

- **Metadado + link, nunca o arquivo.** Cada item guarda titulo, data, formato,
  tags e a URL da PAGINA do item no site da AEDAS. Nenhum PDF e baixado (Lei
  9.610/98 — a AEDAS nao declara licenca; tratado como direitos reservados).
- **Nao existe campo de resumo**: a fonte nao publica excerpt; escrever um
  seria o portal resumindo obra de terceiro.
- **Dado pessoal**: a triagem roda no agregador (`triagem.ts::ehItemBloqueado`),
  nao reimplementada aqui — uma copia so da regra.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "etl" / "betim" / "dados" / "desastres" / "ati-aedas-mariana.json"

# So ASCII: cabecalho com acento quebra cliente HTTP.
AGENTE = "ControlePopular/1.0 (catalogo de metadados de assessoria tecnica; nao baixa arquivo; https://controlepopular.com.br)"
API = "https://aedasmg.org/wp-json/wp/v2"

# Programas do Rio Doce (bacia atingida em MG pela Samarco/Fundao), id medido.
PROJETOS_DOCE = [380, 134, 378, 133, 379, 377]

# Taxonomia de formato do material (medida em 01/09/2026): nome legivel por id.
TAXONOMIA_FORMATO = "tipo-de-documento"
TAXONOMIA_TEMA = "tema"

PAUSA = 1.0  # s entre requisicoes (regra do repo: 1-2 s por host)


class ParouPorLimite(Exception):
    pass


def _get(url: str) -> dict | list:
    req = urllib.request.Request(url, headers={"User-Agent": AGENTE})
    with urllib.request.urlopen(req, timeout=40) as resp:
        if resp.status in (429, 503):
            raise ParouPorLimite(f"HTTP {resp.status}")
        corpo = json.loads(resp.read().decode("utf-8"))
    return corpo


def _taxonomia(slug: str) -> dict[int, str]:
    """Nome legivel por termo de uma taxonomia (com paginacao)."""
    nomes: dict[int, str] = {}
    pagina = 1
    while True:
        url = f"{API}/{slug}?per_page=100&page={pagina}&_fields=id,name"
        itens = _get(url)
        if not itens:
            break
        for t in itens:
            nomes[t["id"]] = t["name"]
        if len(itens) < 100:
            break
        pagina += 1
        time.sleep(PAUSA)
    return nomes


def _titulo_limpo(html: str) -> str:
    import html as _html
    import re
    return re.sub(r"\s+", " ", _html.unescape(re.sub(r"<[^>]+>", "", html))).strip()


def _documentos_do_projeto(projeto_id: int) -> list[dict]:
    docs: list[dict] = []
    pagina = 1
    while True:
        url = (
            f"{API}/documento?projeto={projeto_id}&per_page=100&page={pagina}"
            f"&_fields=id,title,date,link,tipo-de-documento,tema"
        )
        try:
            itens = _get(url)
        except ParouPorLimite as err:
            raise ParouPorLimite(f"projeto {projeto_id}: {err}")
        if not itens:
            break
        docs.extend(itens)
        if len(itens) < 100:
            break
        pagina += 1
        time.sleep(PAUSA)
    return docs


def coletar() -> dict:
    formatos = _taxonomia(TAXONOMIA_FORMATO)
    temas = _taxonomia(TAXONOMIA_TEMA)

    vistos: set[int] = set()
    itens: list[dict] = []

    for projeto_id in PROJETOS_DOCE:
        print(f"- projeto {projeto_id}", file=sys.stderr)
        for d in _documentos_do_projeto(projeto_id):
            if d["id"] in vistos:
                continue
            vistos.add(d["id"])

            tipo_ids = d.get("tipo-de-documento") or []
            tema_ids = d.get("tema") or []
            tipo_nome = (formatos.get(tipo_ids[0]) if tipo_ids else None) or "Sem classificacao"

            itens.append({
                "id": f"aedas-mariana:{d['id']}",
                "desastre": "mariana",
                "bacia": "doce",
                "titulo": _titulo_limpo(d["title"]["rendered"]),
                "data": d.get("date", "")[:10] or None,
                "tipo": tipo_nome,
                "tipoOrigem": tipo_nome,
                "orgao": "AEDAS",
                "esfera": "ati",
                "uf": "MG",
                "tags": [temas[t] for t in tema_ids if t in temas],
                "resumo": None,
                "url": d["link"],
                "fonteId": "ati-aedas-mariana",
                "coletadoEm": datetime.now(timezone.utc).isoformat(),
            })

    itens.sort(key=lambda i: i["data"] or "", reverse=True)

    return {
        "fonte": "ati-aedas-mariana",
        "nome": "AEDAS - Assessoria Tecnica Independente - Bacia do Rio Doce (Mariana)",
        "licenca": "nao declarada - tratado como direitos reservados (Lei 9.610/98)",
        "geradoEm": datetime.now(timezone.utc).isoformat(),
        "ficouDeFora": (
            "Programas da AEDAS fora da bacia do Doce: Itatiaiucu (135) e Veredas "
            "Sol e Lares (132) nao entram por vinculo com a bacia nao confirmado. "
            "ATIs de Mariana sem REST publica confirmada (Caritas, CTA, programa "
            "Doce da ADAI) ficam para a proxima rodada."
        ),
        "itens": itens,
    }


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--seco", action="store_true", help="nao grava; so mostra o resumo")
    args = p.parse_args()

    try:
        dados = coletar()
    except ParouPorLimite as err:
        print(f"! limite da fonte alcancado ({err}); nada gravado", file=sys.stderr)
        return 1

    print(f"{len(dados['itens'])} itens (fonte AEDAS Rio Doce)", file=sys.stderr)

    if args.seco:
        for i in dados["itens"][:10]:
            print(f" [{i['data'] or '????'}] {i['orgao']}: {i['titulo'][:80]}")
        return 0

    if not dados["itens"] and SAIDA.is_file():
        print("! coleta vazia: mantendo o arquivo anterior", file=sys.stderr)
        return 1

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(dados, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"gravado em {SAIDA}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
