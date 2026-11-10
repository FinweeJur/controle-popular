# -*- coding: utf-8 -*-
"""Baixa os PDFs de acesso aberto dos artigos citados nos relatórios Consensus.

O QUE E

Os relatórios do Consensus não podem ser republicados: o rodapé proíbe
redistribuição. O que é público é o artigo citado. Este coletor pega o DOI de
cada trabalho, pergunta ao OpenAlex onde está a versão de acesso aberto e baixa
o PDF para o cache do RAG — com página, não com resumo.

DECISÃO DE COLETA (08/11/2026):

- OpenAlex é API pública e gratuita, sem chave; User-Agent honesto
  `finweejur/github artur colito`;
- `robots.txt` do host do PDF é lido antes do download; `Disallow` encerra;
- 1,5 s entre chamadas; nada em paralelo;
- só o que o OpenAlex declara como acesso aberto; artigo fechado fica fora;
- checkpoint por DOI.

Uso:
    python scripts/coletar-oa-consensus.py --limite 5
    python scripts/coletar-oa-consensus.py
"""
from __future__ import annotations

import argparse
import hashlib
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
FONTES = [
    RAIZ / "apps" / "web" / "data" / "evidencias-cientificas-rio-doce-costeiro.json",
    RAIZ / "apps" / "web" / "data" / "biblioteca-evidencias-cientificas.json",
]
CACHE = RAIZ / "apps" / "web" / ".cache" / "documentos-rag-local"
ESTADO = RAIZ / "logs" / "oa-consensus.json"
UA = "finweejur/github artur colito"
PAUSA = 1.5
OPENALEX = "https://api.openalex.org/works/https://doi.org/"


def requisitar(url: str, binario: bool = False, timeout: int = 60):
    pedido = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(pedido, timeout=timeout) as resposta:
        return resposta.read() if binario else resposta.read().decode("utf-8", "replace")


class Robots:
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
            texto = requisitar(f"{host}/robots.txt", timeout=30)
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
        return sorted(regras, key=lambda item: -len(item[1]))


def estado() -> dict:
    if ESTADO.exists():
        try:
            return json.loads(ESTADO.read_text(encoding="utf-8"))
        except ValueError:
            pass
    return {"itens": {}}


def salvar(dados: dict) -> None:
    ESTADO.parent.mkdir(parents=True, exist_ok=True)
    ESTADO.write_text(json.dumps(dados, ensure_ascii=False, indent=1), encoding="utf-8")


def pdf_aberto(doi: str) -> tuple[str | None, dict]:
    """URL do PDF de acesso aberto e o registro do OpenAlex."""
    try:
        bruto = requisitar(OPENALEX + urllib.parse.quote(doi), timeout=45)
        dados = json.loads(bruto)
    except (urllib.error.HTTPError, OSError, ValueError):
        return None, {}
    local = dados.get("best_oa_location") or {}
    url = local.get("pdf_url") or (dados.get("open_access") or {}).get("oa_url")
    return (url if isinstance(url, str) and url.startswith("http") else None), dados


def nome_arquivo(doi: str) -> str:
    return f"oa-{hashlib.md5(doi.encode()).hexdigest()[:10]}.pdf"


def trabalhos() -> list[dict]:
    vistos: dict[str, dict] = {}
    for caminho in FONTES:
        if not caminho.exists():
            continue
        dados = json.loads(caminho.read_text(encoding="utf-8"))
        lista = dados.get("trabalhos") or dados.get("itens") or []
        for item in lista:
            doi = (item.get("doi") or "").strip().lower()
            if doi and doi not in vistos:
                vistos[doi] = {**item, "doi": doi, "origem": caminho.name}
    return list(vistos.values())


def main() -> int:
    ap = argparse.ArgumentParser(description="Baixa PDFs de acesso aberto por DOI.")
    ap.add_argument("--limite", type=int, default=0)
    opcoes = ap.parse_args()
    dados = estado()
    robos = Robots()
    CACHE.mkdir(parents=True, exist_ok=True)
    feitos = 0
    for item in trabalhos():
        doi = item["doi"]
        if dados["itens"].get(doi, {}).get("status") in ("ok", "fechado", "sem_pdf"):
            continue
        if opcoes.limite and feitos >= opcoes.limite:
            break
        url, registro = pdf_aberto(doi)
        time.sleep(PAUSA)
        if not url:
            dados["itens"][doi] = {"status": "fechado", "titulo": item.get("titulo")}
            salvar(dados)
            feitos += 1
            print(f"fechado      {str(item.get('titulo'))[:60]}")
            continue
        if not robos.permitido(url):
            dados["itens"][doi] = {"status": "robots", "url": url}
            salvar(dados)
            feitos += 1
            print(f"robots       {url[:70]}")
            continue
        arquivo = nome_arquivo(doi)
        destino = CACHE / arquivo
        if not destino.exists():
            try:
                destino.write_bytes(requisitar(url, binario=True, timeout=120))
            except (urllib.error.HTTPError, OSError) as erro:
                dados["itens"][doi] = {"status": "erro", "motivo": str(erro)[:80], "url": url}
                salvar(dados)
                feitos += 1
                print(f"erro         {url[:70]}")
                continue
            time.sleep(PAUSA)
        dados["itens"][doi] = {"status": "ok", "arquivo": arquivo, "url": url,
                               "titulo": item.get("titulo"), "ano": item.get("ano"),
                               "autores": item.get("autores"), "revista": item.get("revista")}
        salvar(dados)
        feitos += 1
        print(f"ok           {str(item.get('titulo'))[:60]}")
    ok = sum(1 for valor in dados["itens"].values() if valor.get("status") == "ok")
    print(f"processados agora: {feitos} | ok: {ok} de {len(trabalhos())}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
