"""coletar-biblioteca-cbh-doce.py — deliberações do Comitê da Bacia Hidrográfica
do Rio Doce (CBH-Doce), a bacia atingida pelo desastre de Mariana.

Grava `etl/betim/dados/desastres/cbh-doce.json`, que o agregador
`scripts/agregar-biblioteca-desastres.mts` funde na biblioteca unificada dos
crimes socioambientais (desastre = "mariana", bacia = "doce").

Rodar:
    python scripts/coletar-biblioteca-cbh-doce.py --seco
    python scripts/coletar-biblioteca-cbh-doce.py

## A fonte (medida em 01/09/2026)

O CBH-Doce é o comitê de gestão de recursos hídricos da bacia do Rio Doce
(MG + ES) — parte na governança da reparação do desastre da Samarco/Vale/BHP.
Site WordPress (cbhdoce.org.br). O `wp-json` responde 401 na raiz, mas as
páginas de listagem são públicas. Página-alvo:

    /institucional/cbh-doce/deliberacoes-e-mocoes/deliberacoes-normativas

que lista as Deliberações Normativas com link direto ao PDF e o titulo com a
data. Medida: 147 links PDF nessa página.

## Regras do acervo (mesmas da biblioteca)

- **Metadado + link, nunca o arquivo.** O PDF abre no servidor do comitê, que
  responde por ele. Excecao NACAB aplicada: o CBH-Doce nao tem pagina
  individual por item — a unica referencia honesta e a URL do arquivo no
  wp-content/uploads do proprio comitê. O portal nao hospeda copia.
- **Nao existe campo de resumo**: a fonte nao publica excerpt; escrever um
  seria o portal resumindo obra de terceiro.
- **Dado pessoal**: triagem roda no agregador (`triagem.ts::ehItemBloqueado`),
  nao reimplementada aqui — uma copia so da regra.
- **Date do titulo** (ex.: "DN-136_2026 ... 23 de julho de 2026") e extraida por
  regra; quando nao da para extrair, `data: null` (lacuna declarada, nao chute).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "etl" / "betim" / "dados" / "desastres" / "cbh-doce.json"

AGENTE = "ControlePopular/1.0 (catalogo de metadados de comite de bacia; nao baixa arquivo; https://controlepopular.com.br)"

PAGINAS = [
    {
        "tipo": "Deliberação Normativa",
        "url": "https://cbhdoce.org.br/institucional/cbh-doce/deliberacoes-e-mocoes/deliberacoes-normativas",
    },
    {
        "tipo": "Moção",
        "url": "https://cbhdoce.org.br/institucional/cbh-doce/deliberacoes-e-mocoes/mocoes",
    },
]

MESES = {
    "janeiro": 1, "fevereiro": 2, "marco": 3, "março": 3, "abril": 4,
    "maio": 5, "junho": 6, "julho": 7, "agosto": 8, "setembro": 9,
    "outubro": 10, "novembro": 11, "dezembro": 12,
}

# Data no fim do titulo: "23 de julho de 2026" (ou variantes).
RE_DATA = re.compile(r"(\d{1,2})\s+de\s+([a-zç]+)\s+de\s+(\d{4})", re.IGNORECASE)


def _get(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": AGENTE})
    with urllib.request.urlopen(req, timeout=40) as resp:
        if resp.status in (429, 503):
            raise RuntimeError(f"HTTP {resp.status}")
        return resp.read().decode("utf-8", errors="replace")


def _titulo_limpo(texto: str) -> str:
    import html as _html
    return re.sub(r"\s+", " ", _html.unescape(re.sub(r"<[^>]+>", "", texto))).strip()


def _data_do_titulo(titulo: str) -> str | None:
    m = RE_DATA.search(titulo)
    if not m:
        return None
    mes = MESES.get(m.group(2).lower())
    if not mes:
        return None
    try:
        return f"{int(m.group(3)):04d}-{mes:02d}-{int(m.group(1)):02d}"
    except ValueError:
        return None


def _itens_da_pagina(pagina: dict) -> list[dict]:
    html = _get(pagina["url"])
    vistos: set[str] = set()
    itens: list[dict] = []
    # Link com texto associado: <a href="...pdf">TITULO</a>
    for m in re.finditer(r'<a\s+[^>]*href="([^"]+\.(?:pdf|docx?))"[^>]*>(.*?)</a>', html, re.IGNORECASE | re.DOTALL):
        url = m.group(1)
        if url in vistos:
            continue
        vistos.add(url)
        titulo = _titulo_limpo(m.group(2)) or url.split("/")[-1]
        data = _data_do_titulo(titulo)
        itens.append({
            "id": "cbh-doce:" + hashlib.sha1(url.encode("utf-8")).hexdigest()[:12],
            "desastre": "mariana",
            "bacia": "doce",
            "titulo": titulo,
            "data": data,
            "tipo": pagina["tipo"],
            "tipoOrigem": pagina["tipo"],
            "orgao": "CBH-Doce",
            "esfera": "estadual",
            "uf": "BR",
            "tags": ["bacia do rio doce"],
            "resumo": None,
            "url": url,
            "fonteId": "cbh-doce",
            "coletadoEm": datetime.now(timezone.utc).isoformat(),
        })
    return itens


def coletar() -> dict:
    itens: list[dict] = []
    sem_data = 0
    vistos_globais: set[str] = set()
    for pagina in PAGINAS:
        print(f"- {pagina['tipo']}: {pagina['url']}", file=sys.stderr)
        for item in _itens_da_pagina(pagina):
            # Mesmo documento pode aparecer em mais de uma página (ex.: a lista
            # de Termos de Colaboração Técnica). Dedup por id, global ao acervo.
            if item["id"] in vistos_globais:
                continue
            vistos_globais.add(item["id"])
            if not item["data"]:
                sem_data += 1
            itens.append(item)

    itens.sort(key=lambda i: i["data"] or "", reverse=True)

    return {
        "fonte": "cbh-doce",
        "nome": "CBH-Doce - Comite da Bacia Hidrografica do Rio Doce",
        "licenca": "documentos publicos de orgao colegiado de recursos hidricos; tratado como publicos",
        "geradoEm": datetime.now(timezone.utc).isoformat(),
        "ficouDeFora": (
            f"{sem_data} itens sem data extraivel do titulo ficaram com data: null "
            "(lacuna declarada). O wp-json responde 401; coleta por pagina."
        ),
        "itens": itens,
    }


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--seco", action="store_true", help="nao grava; so mostra o resumo")
    args = p.parse_args()

    try:
        dados = coletar()
    except RuntimeError as err:
        print(f"! limite da fonte ({err}); nada gravado", file=sys.stderr)
        return 1

    print(f"{len(dados['itens'])} itens (CBH-Doce)", file=sys.stderr)

    if args.seco:
        for i in dados["itens"][:12]:
            print(f" [{i['data'] or '????'}] {i['tipo']}: {i['titulo'][:80]}")
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
