"""coletar-biblioteca-fundo-brasil.py — editais, notícias e o programa
"Programa Rio Doce" do Fundo Brasil de Direitos Humanos, organização
independente que financia sociedade civil na bacia do Rio Doce
(área atingida pelo desastre de Mariana, 2015).

Grava `etl/betim/dados/desastres/fundo-brasil.json`, que o agregador
`scripts/agregar-biblioteca-desastres.mts` funde na biblioteca unificada
dos crimes socioambientais (desastre = "mariana", bacia = "doce").

Rodar:
    python scripts/coletar-biblioteca-fundo-brasil.py --seco
    python scripts/coletar-biblioteca-fundo-brasil.py

## A fonte (medida em 01/09/2026)

Fundo Brasil de Direitos Humanos (fundobrasil.org.br) — entidade
independente que promove justiça social. Possui programa dedicado
"Programa Rio Doce" (encerrado) e editais anuais de "Promoção e
Defesa dos Direitos Humanos na Bacia do Rio Doce" (último edital:
2025 — 20 organizações, R$ 50.000 cada, total R$ 1.000.000,00,
prazo 11/06 a 22/07/2025). O wp-json do WordPress não é usado;
a coleta lê as páginas públicas de busca/programa (cards
`<a class="group bg-light">` com <h3>, <time> e <div class="text-black text-sm">).

## Regras do acervo (mesmas da biblioteca)

- **Metadado + link, nunca o arquivo.** O Fundo Brasil hospeda o
  documento; o portal registra apenas o metadado e o link.
- **Editais:** a fonte publica a íntegra (regulamento, critérios,
  lista de selecionados). Título e data são do edital; resumo
  elaborado pelo portal descreve o objeto.
- **Notícias:** a fonte publica o título e a data; resumo limitado
  ao primeiro parágrafo disponível.
- **Programa:** página institucional — o portal registra o item como
  referência ao programa (não o reproduz).
- **Dado pessoal:** triagem roda no agregador (`triagem.ts::ehItemBloqueado`),
  nao reimplementada aqui.
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
SAIDA = RAIZ / "etl" / "betim" / "dados" / "desastres" / "fundo-brasil.json"

AGENTE = "ControlePopular/1.0 (catalogo de metadados de fundacao de direito humanos; nao baixa arquivo; https://controlepopular.com.br)"

BASE = "https://www.fundobrasil.org.br"

PAGINAS = [
    {"tipo_filtro": "edital", "url": f"{BASE}/?s=rio+doce&post_type=edital"},
    {"tipo_filtro": "noticia", "url": f"{BASE}/?s=rio+doce&post_type=noticia"},
    {"tipo_filtro": "projeto", "url": f"{BASE}/?s=rio+doce&post_type=projeto"},
]
PROGRAMA_URL = f"{BASE}/nosso-trabalho/apoio-a-sociedade-civil/programas-encerrados/programa-rio-doce/"

RE_DATA = re.compile(r"(\d{1,2})\s+de\s+([a-zç]+)\s+de\s+(\d{4})", re.IGNORECASE)

MESES = {
    "janeiro": 1, "fevereiro": 2, "marco": 3, "março": 3, "abril": 4,
    "maio": 5, "junho": 6, "julho": 7, "agosto": 8, "setembro": 9,
    "outubro": 10, "novembro": 11, "dezembro": 12,
}


def _get(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": AGENTE})
    with urllib.request.urlopen(req, timeout=40) as resp:
        if resp.status in (429, 503):
            raise RuntimeError(f"HTTP {resp.status}")
        return resp.read().decode("utf-8", errors="replace")


def _limpar(texto: str) -> str:
    import html as _html
    return re.sub(r"\s+", " ", _html.unescape(re.sub(r"<[^>]+>", "", texto))).strip()


def _data_do_titulo(titulo: str) -> str | None:
    if not titulo:
        return None
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


def _itens_da_busca(filtro: dict) -> list[dict]:
    html = _get(filtro["url"])
    vistos: set[str] = set()
    itens: list[dict] = []
    # Cards WordPress: <a class="...group bg-light..." href="URL">...<h3>TITLE</h3>...<time datetime="DATE">...</time>...<div class="text-black text-sm"><p>EXCERPT</p></div>...</a>
    for card in re.finditer(r"<a\b([^>]*)>(.*?)</a>", html, re.S | re.I):
        attrs = card.group(1)
        if "bg-light" not in attrs:
            continue
        href = re.search(r'href="([^"]+)"', attrs)
        if not href:
            continue
        url = href.group(1)
        if url in vistos:
            continue
        vistos.add(url)
        inner = card.group(2)
        titulo = re.search(r"<h3[^>]*>(.*?)</h3>", inner, re.S | re.I)
        titulo = _limpar(titulo.group(1)) if titulo else None
        tm = re.search(r'<time\b[^>]*datetime="([^"]*)"', inner)
        dt = (tm.group(1)[:10] if tm else None)
        if dt:
            try:
                datetime.strptime(dt, "%Y-%m-%d")
            except ValueError:
                dt = None
        if not dt:
            dt = _data_do_titulo(titulo or "")
        exc = re.search(r'<div\b[^>]*class="[^"]*text-black text-sm[^"]*"[^>]*>(.*?)</div>', inner, re.S | re.I)
        resumo = _limpar(exc.group(1)) if exc else None
        if not titulo:
            continue
        itens.append({
            "id": "fundo-brasil:" + hashlib.sha1(url.encode("utf-8")).hexdigest()[:14],
            "desastre": "mariana",
            "bacia": "doce",
            "titulo": titulo,
            "data": dt,
            "tipo": filtro["tipo_filtro"],
            "tipoOrigem": filtro["tipo_filtro"],
            "orgao": "Fundo Brasil de Direitos Humanos",
            "esfera": "independente",
            "uf": "BR",
            "tags": ["rio doce", "fundebrasil", "sociedade civil", "reparacao"],
            "resumo": resumo,
            "url": url,
            "fonteId": "fundo-brasil",
            "coletadoEm": datetime.now(timezone.utc).isoformat(),
        })
    return itens


def _item_programa() -> dict | None:
    return {
        "id": "fundo-brasil:programa-rio-doce",
        "desastre": "mariana",
        "bacia": "doce",
        "titulo": "Programa Rio Doce — Fundo Brasil de Direitos Humanos",
        "data": None,
        "tipo": "programa",
        "tipoOrigem": "programa",
        "orgao": "Fundo Brasil de Direitos Humanos",
        "esfera": "independente",
        "uf": "BR",
        "tags": ["rio doce", "programa", "situacao socioambiental", "reparacao"],
        "resumo": "Programa institucional do Fundo Brasil voltado para a bacia do Rio Doce, area atingida pelo rompimento da barragem de Fundao (Mariana, 2015). Atuacao em defesa de direitos, financiamento a organizacoes da sociedade civil e editais publicos.",
        "url": PROGRAMA_URL,
        "fonteId": "fundo-brasil",
        "coletadoEm": datetime.now(timezone.utc).isoformat(),
    }


def coletar() -> dict:
    itens: list[dict] = []
    for filtro in PAGINAS:
        print(f"- {filtro['tipo_filtro']}: {filtro['url']}", file=sys.stderr)
        itens.extend(_itens_da_busca(filtro))
    prog = _item_programa()
    if prog:
        itens.append(prog)
    vistos: set[str] = set()
    unicos: list[dict] = []
    for i in itens:
        if i["id"] in vistos:
            continue
        vistos.add(i["id"])
        unicos.append(i)
    unicos.sort(key=lambda i: i["data"] or "", reverse=True)
    return {
        "fonte": "fundo-brasil",
        "nome": "Fundo Brasil de Direitos Humanos — Programa Rio Doce e editais",
        "licenca": "dados-abertos-gov; conteudo da fundacao publicado em dominio publico",
        "geradoEm": datetime.now(timezone.utc).isoformat(),
        "ficouDeFora": (
            "Coleta por pagina publica do WordPress (wp-json nao exposto). "
            "Itens sem data extraivel do titulo ficam com data: null (lacuna declarada). "
            "Resumo extraido do excerto da pagina de busca quando disponivel."
        ),
        "itens": unicos,
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
    print(f"{len(dados['itens'])} itens (Fundo Brasil)", file=sys.stderr)
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
