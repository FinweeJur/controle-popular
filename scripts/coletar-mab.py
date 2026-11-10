# -*- coding: utf-8 -*-
"""Coleta notícias, artigos e notas oficiais do MAB sobre o caso Rio Doce.

POR QUE EXISTE

O radar diário já lê o feed do MAB, mas o feed entrega só os posts recentes.
O site guarda anos de notícias, artigos e notas — e o MAB é parte no caso, além
de ser a voz que noticia o que não vira pauta. Este coletor usa a API pública
do WordPress para varrer as três categorias e guardar só metadado, resumo e
link.

ÉTICA DE COLETA

- User-Agent honesto: `finweejur/github artur colito`.
- `robots.txt` do site libera tudo (`Disallow:` vazio), lido em 09/11/2026.
- `https://mab.org.br/termos-de-uso/` responde 404 em 09/11/2026; não há
  página de termos localizada. A coleta usa só a API pública, com metadado e
  link, sem copiar o corpo.
- 2 s entre requisições; uma requisição por vez.
- Só metadado: título, resumo do próprio site, data, categoria e link. O corpo
  da matéria não é baixado nem armazenado.
- Checkpoint em `logs/mab-progresso.json`: rodada interrompida retoma da página
  seguinte, não recomeça.

USO

    python scripts/coletar-mab.py                 # coleta completa
    python scripts/coletar-mab.py --limite-paginas 3
    python scripts/coletar-mab.py --recomecar
"""
from __future__ import annotations

import argparse
import html
import json
import re
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
SAIDA = RAIZ / "apps" / "web" / "data" / "mab-publicacoes.json"
PROGRESSO = RAIZ / "logs" / "mab-progresso.json"

BASE = "https://mab.org.br/wp-json/wp/v2/posts"
UA = "finweejur/github artur colito"
PAUSA = 2.0
POR_PAGINA = 100

CATEGORIAS = {
    6: "Notícia",
    31: "Artigo",
    2516: "Nota oficial",
}

# Termos que, sozinhos, identificam o caso.
TERMOS_FORTES = [
    "brumadinho",
    "paraopeba",
    "rio doce",
    "samarco",
    "fundao",
    "bento rodrigues",
    "corrego do feijao",
    "barragem de fundao",
    "naque",
    "itatiaucu",
    "barra longa",
    "regencia",
    "abrolhos",
]

# "Mariana" é nome de pessoa e de cidade; só conta com contexto.
TERMOS_CONTEXTO = [
    "barragem",
    "atingid",
    "reparacao",
    "vale",
    "mineracao",
    "rejeito",
    "desastre",
    "crime",
    "pnab",
    "peab",
    "indeniz",
    "acordo",
    "fundao",
    "samarco",
]


def sem_acento(texto: str) -> str:
    return (
        unicodedata.normalize("NFD", texto)
        .encode("ascii", "ignore")
        .decode("ascii")
        .lower()
    )


def limpar(texto: str) -> str:
    texto = re.sub(r"<[^>]+>", " ", texto or "")
    texto = html.unescape(texto)
    return re.sub(r"\s+", " ", texto).strip()


def e_do_caso(titulo: str, resumo: str) -> bool:
    texto = sem_acento(f"{titulo} {resumo}")
    if any(termo in texto for termo in TERMOS_FORTES):
        return True
    if "mariana" in texto and any(termo in texto for termo in TERMOS_CONTEXTO):
        return True
    return False


def caso_de(titulo: str, resumo: str) -> str | None:
    texto = sem_acento(f"{titulo} {resumo}")
    if "brumadinho" in texto or "corrego do feijao" in texto or "paraopeba" in texto:
        return "brumadinho"
    if any(
        termo in texto
        for termo in (
            "mariana",
            "rio doce",
            "samarco",
            "fundao",
            "bento rodrigues",
            "naque",
            "itatiaucu",
            "barra longa",
            "regencia",
            "abrolhos",
        )
    ):
        return "mariana"
    return None


def requisitar(url: str) -> tuple[list[dict], int]:
    pedido = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(pedido, timeout=90) as resposta:
        dados = json.load(resposta)
        paginas = int(resposta.headers.get("X-WP-TotalPages") or 1)
        return dados, paginas


def url_pagina(categoria: int, pagina: int) -> str:
    campos = "id,date,link,title,excerpt,categories,slug"
    return (
        f"{BASE}?categories={categoria}&per_page={POR_PAGINA}&page={pagina}"
        f"&_fields={urllib.parse.quote(campos, safe=',')}"
    )


def carregar_progresso() -> dict:
    if PROGRESSO.exists():
        try:
            return json.loads(PROGRESSO.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {}
    return {}


def salvar_progresso(progresso: dict) -> None:
    PROGRESSO.parent.mkdir(parents=True, exist_ok=True)
    PROGRESSO.write_text(
        json.dumps(progresso, ensure_ascii=False, indent=1), encoding="utf-8"
    )


def carregar_itens() -> list[dict]:
    if SAIDA.exists():
        try:
            return json.loads(SAIDA.read_text(encoding="utf-8")).get("itens", [])
        except json.JSONDecodeError:
            return []
    return []


def salvar(itens: list[dict], progresso: dict) -> None:
    itens.sort(key=lambda item: item["data"], reverse=True)
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(
        json.dumps(
            {
                "geradoEm": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "fonte": "MAB — Movimento dos Atingidos por Barragens",
                "url": "https://mab.org.br/",
                "metodo": "API pública do WordPress; metadado e resumo do site; 2 s entre requisições",
                "total": len(itens),
                "itens": itens,
            },
            ensure_ascii=False,
            indent=1,
        ),
        encoding="utf-8",
    )
    salvar_progresso(progresso)


def coletar(
    categoria: int,
    tipo: str,
    limite_paginas: int | None,
    progresso: dict,
    itens: list[dict],
) -> None:
    vistos = {item["id"] for item in itens}
    pagina = int(progresso.get(str(categoria), 1))
    while True:
        if limite_paginas and pagina > limite_paginas:
            break
        try:
            dados, total_paginas = requisitar(url_pagina(categoria, pagina))
        except urllib.error.HTTPError as erro:
            if erro.code == 400:
                break
            raise
        if not dados:
            break
        for post in dados:
            titulo = limpar(post.get("title", {}).get("rendered", ""))
            resumo = limpar(post.get("excerpt", {}).get("rendered", ""))
            if categoria != 2516 and not e_do_caso(titulo, resumo):
                continue
            if post["id"] in vistos:
                continue
            vistos.add(post["id"])
            itens.append(
                {
                    "id": f"mab:{post['id']}",
                    "titulo": titulo,
                    "resumo": resumo,
                    "data": post.get("date", "")[:10],
                    "link": post.get("link", ""),
                    "tipo": tipo,
                    "caso": caso_de(titulo, resumo),
                }
            )
        progresso[str(categoria)] = pagina + 1
        salvar(itens, progresso)
        print(
            f"{tipo}: página {pagina}/{total_paginas} | "
            f"itens {len(itens)}",
            flush=True,
        )
        if pagina >= total_paginas:
            break
        pagina += 1
        time.sleep(PAUSA)
    progresso[str(categoria)] = 1


def main() -> int:
    ap = argparse.ArgumentParser(description="Coleta publicações do MAB.")
    ap.add_argument("--limite-paginas", type=int, default=None)
    ap.add_argument("--recomecar", action="store_true")
    opcoes = ap.parse_args()

    if opcoes.recomecar and SAIDA.exists():
        SAIDA.unlink()
    if opcoes.recomecar and PROGRESSO.exists():
        PROGRESSO.unlink()

    progresso = carregar_progresso()
    itens = carregar_itens()
    for categoria, tipo in CATEGORIAS.items():
        coletar(categoria, tipo, opcoes.limite_paginas, progresso, itens)
    salvar(itens, progresso)
    print(f"total: {len(itens)} itens em {SAIDA}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
