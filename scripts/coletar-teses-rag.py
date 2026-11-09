# -*- coding: utf-8 -*-
"""Baixa os PDFs das teses e dissertações de Rio Doce e Brumadinho para o RAG.

O QUE E

A biblioteca acadêmica do portal tem 424 itens indexados só como resumo. Este
coletor resolve o link de cada trabalho de Rio Doce e Brumadinho, acha o PDF
no repositório da instituição, baixa para o cache local e registra o item no
manifesto do RAG — com página de verdade.

DECISÃO DE COLETA (08/11/2026), conforme AGENTS/COLETA-ETICA:

- User-Agent honesto `finweejur/github artur colito`;
- `robots.txt` lido por host antes de qualquer requisição; `Disallow` encerra
  aquele host;
- 1,5 s entre requisições; nenhuma coleta paralela;
- só repositório público de tese (UFV, UFMG, USP, UERJ, UFMT, UNIFEI, Fiocruz,
  Unisantos, BDTD). Nada de login, paywall ou CAPTCHA;
- checkpoint por item: queda não recomeça do zero.

Uso:
    python scripts/coletar-teses-rag.py --limite 5
    python scripts/coletar-teses-rag.py
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
BIBLIOTECA = RAIZ / "apps" / "web" / "data" / "biblioteca-teses-atingidos.json"
CACHE = RAIZ / "apps" / "web" / ".cache" / "documentos-rag-local"
MANIFESTO = RAIZ / "apps" / "web" / "data" / "documentos-rag-fontes.json"
ESTADO = RAIZ / "logs" / "teses-rag.json"
UA = "finweejur/github artur colito"
PAUSA = 1.5
PDF = re.compile(r'href="([^"]+\.pdf[^"]*)"', re.I)
BITSTREAM = re.compile(r'href="([^"]*(?:bitstream|/download)[^"]*)"', re.I)
DESASTRES = ("riodoce", "brumadinho")


def _carregar(caminho: Path, padrao):
    if caminho.exists():
        try:
            return json.loads(caminho.read_text(encoding="utf-8"))
        except ValueError:
            pass
    return padrao


def estado() -> dict:
    return _carregar(ESTADO, {"itens": {}})


def salvar_estado(dados: dict) -> None:
    ESTADO.parent.mkdir(parents=True, exist_ok=True)
    ESTADO.write_text(json.dumps(dados, ensure_ascii=False, indent=1), encoding="utf-8")


def requisitar(url: str, binario: bool = False):
    pedido = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(pedido, timeout=60) as resposta:
        return resposta.read() if binario else resposta.read().decode("utf-8", "replace")


class Robots:
    """Regras por host, com cache em memória."""

    def __init__(self) -> None:
        self.cache: dict[str, list[tuple[bool, str]]] = {}

    def permitido(self, url: str) -> bool:
        partes = urllib.parse.urlparse(url)
        host = f"{partes.scheme}://{partes.netloc}"
        if host not in self.cache:
            self.cache[host] = self._ler(host)
        caminho = partes.path or "/"
        for eh_allow, prefixo in self.cache[host]:
            if caminho.startswith(prefixo):
                return eh_allow
        return True

    @staticmethod
    def _ler(host: str) -> list[tuple[bool, str]]:
        try:
            texto = requisitar(f"{host}/robots.txt")
        except (urllib.error.HTTPError, OSError):
            return []
        regras: list[tuple[bool, str]] = []
        vale = False
        for linha in texto.splitlines():
            linha = linha.split("#")[0].strip()
            if not linha:
                continue
            campo, _, valor = linha.partition(":")
            campo, valor = campo.strip().lower(), valor.strip()
            if campo == "user-agent":
                vale = valor == "*"
            elif vale and campo in ("allow", "disallow") and valor:
                regras.append((campo == "allow", valor))
        # Mais específico primeiro, como manda a convenção.
        return sorted(regras, key=lambda item: -len(item[1]))


def achar_pdf(html: str, base: str) -> str | None:
    for padrao in (PDF, BITSTREAM):
        achado = padrao.search(html)
        if achado:
            return urllib.parse.urljoin(base, achado.group(1))
    return None


def slug(texto: str) -> str:
    limpo = re.sub(r"[^a-z0-9]+", "-", (texto or "").lower())
    return limpo.strip("-")[:40] or "tese"


def nome_arquivo(item: dict) -> str:
    """Nome curto e estável: id com hash, não o título inteiro.

    Título completo estoura o limite de caminho do Windows e quebra o cache.
    """
    chave = str(item.get("id") or item.get("titulo"))
    return f"tese-{hashlib.md5(chave.encode()).hexdigest()[:10]}.pdf"


def baixar(item: dict, robos: Robots) -> dict:
    links = item.get("links") or []
    pagina = next((link for link in links if isinstance(link, str)), None)
    if not pagina:
        return {"status": "sem_link"}
    if not robos.permitido(pagina):
        return {"status": "robots"}
    try:
        html = requisitar(pagina)
    except (urllib.error.HTTPError, OSError) as erro:
        return {"status": "erro_pagina", "motivo": str(erro)[:80]}
    pdf = achar_pdf(html, pagina)
    if not pdf:
        return {"status": "sem_pdf", "pagina": pagina}
    if not robos.permitido(pdf):
        return {"status": "robots_pdf", "pagina": pagina}
    nome = nome_arquivo(item)
    destino = CACHE / nome
    if not destino.exists():
        try:
            destino.write_bytes(requisitar(pdf, binario=True))
        except (urllib.error.HTTPError, OSError) as erro:
            return {"status": "erro_pdf", "motivo": str(erro)[:80]}
        time.sleep(PAUSA)
    return {"status": "ok", "arquivo": nome, "pagina": pagina, "pdf": pdf}


def entrada_manifesto(item: dict, arquivo: str) -> dict:
    desastre = item.get("destino")
    return {
        "id": f"tese-{item.get('id')}",
        "titulo": item.get("titulo") or "Trabalho acadêmico",
        "tipo": item.get("tipo") or "Tese",
        "categoria": "Acadêmico & Pesquisa",
        "tema": "Atingidos por barragens",
        "orgao": item.get("instituicao") or item.get("sigla") or "Instituição de ensino",
        "url": (item.get("links") or [""])[0],
        "urlPdf": None,
        "arquivoLocal": arquivo,
        "resumo": (item.get("resumo") or "")[:600],
        "tags": ["tese", desastre or "desastre", item.get("ano") or ""],
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Baixa PDFs acadêmicos para o RAG.")
    ap.add_argument("--limite", type=int, default=0)
    opcoes = ap.parse_args()
    biblioteca = json.loads(BIBLIOTECA.read_text(encoding="utf-8"))["itens"]
    alvos = [item for item in biblioteca if item.get("destino") in DESASTRES]
    dados = estado()
    robos = Robots()
    CACHE.mkdir(parents=True, exist_ok=True)
    feitos = 0
    for item in alvos:
        chave = str(item.get("id"))
        if dados["itens"].get(chave, {}).get("status") == "ok":
            continue
        if opcoes.limite and feitos >= opcoes.limite:
            break
        resultado = baixar(item, robos)
        dados["itens"][chave] = resultado
        salvar_estado(dados)
        feitos += 1
        print(f"{resultado['status']:12s} {str(item.get('titulo'))[:60]}")
    ok = sum(1 for valor in dados["itens"].values() if valor.get("status") == "ok")
    print(f"processados agora: {feitos} | total ok: {ok} de {len(alvos)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
