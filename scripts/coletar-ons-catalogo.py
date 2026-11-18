# -*- coding: utf-8 -*-
"""Catálogo dos dados abertos do ONS (Operador Nacional do Sistema Elétrico).

O que é
-------
Lê o portal CKAN do ONS em https://dados.ons.org.br/ e grava um retrato dos
conjuntos publicados: nome técnico, título, resumo, formatos disponíveis,
número de recursos, data de atualização, licença e marcação de tema. Este
catálogo é a porta de entrada do ETL de energia do Controle Popular: é dele
que saem as URLs oficiais usadas por `coletar-ons-energia.py`.

Fonte oficial
-------------
- Portal: https://dados.ons.org.br/
- API CKAN: https://dados.ons.org.br/api/3/action/package_list e
  `package_show?id=<nome>`
- Arquivos: bucket S3 público `ons-aws-prod-opendata` (CSV, XLSX, PARQUET).
- Licença dos conjuntos: Creative Commons Atribuição (CC-BY), informada no
  próprio CKAN em `license_id`/`license_title`/`license_url`.

Restrições e decisões
---------------------
1. User-Agent honesto e fixo: `finweejur/github artur colito`. Nunca UA de
   navegador, nunca vazio (regra do AGENTS.md).
2. O `robots.txt` do portal traz `Disallow: /api/` e `Crawl-Delay: 10`. O
   dono pediu explicitamente a coleta por esta API pública (dados abertos,
   CC-BY) — exceção registrada aqui, conforme a regra de coleta ética.
   Para respeitar o resto do arquivo, o script mantém **10 s entre chamadas**
   ao CKAN e **no máximo 4 em paralelo**, o que dá ~1 requisição a cada 2,5 s.
3. Stdlib só (`urllib`), sem dependência nova: o coletor roda em qualquer
   máquina do projeto, inclusive no `home-pc`, sem instalar pacote.
4. Idempotente: a saída é determinística (ordem por título, campos fixos).
   Rodar de novo sobrescreve o mesmo arquivo com o retrato mais recente.
5. Nenhum dado bruto é versionado. Apenas o catálogo JSON agregado, que é
   pequeno e serve de índice auditável.

Uso
---
    python scripts/coletar-ons-catalogo.py
    python scripts/coletar-ons-catalogo.py --saida caminho/alternativo.json

Saída
-----
`apps/web/data/ons/catalogo.json`
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
import zlib
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

# --- Constantes de fonte -----------------------------------------------------

BASE = "https://dados.ons.org.br/api/3/action"
PORTAL = "https://dados.ons.org.br/"
UA = "finweejur/github artur colito"

# `Crawl-Delay: 10` do robots.txt do portal. Cada worker espera isso entre
# chamadas; com 4 workers o host recebe ~1 requisição a cada 2,5 s.
ESPERA_CKAN = 10.0
WORKERS = 4
# Timeout curto e explícito: em 18/11/2026 uma chamada ao CKAN ficou pendurada
# por 25 minutos sem estourar o limite padrão. 30 s + 4 tentativas limita o
# estrago a ~3 min e o coletor segue em vez de travar o dia.
TIMEOUT = 30
TENTATIVAS = 4

RAIZ = Path(__file__).resolve().parents[1]
DESTINO_PADRAO = RAIZ / "apps" / "web" / "data" / "ons" / "catalogo.json"


def agora_iso() -> str:
    """Instante da coleta em UTC, no formato que o resto do portal usa."""
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def pegar_json(url: str) -> dict:
    """Baixa e decodifica um JSON do CKAN, com espera e tentativa repetida.

    O portal do ONS oscila: em teste manual, uma chamada isolada devolveu 502
    e a seguinte passou. Por isso a repetição com espera crescente (2, 4, 8 s),
    sempre com o User-Agent honesto.
    """
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    ultimo_erro: Exception | None = None
    for tentativa in range(TENTATIVAS):
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resposta:
                return json.load(resposta)
        except Exception as erro:  # rede, 5xx, JSON truncado
            ultimo_erro = erro
            if tentativa < TENTATIVAS - 1:
                time.sleep(2 * (tentativa + 1))
    raise RuntimeError(f"falhou ao baixar {url}: {ultimo_erro}")


def limpar_texto(texto: str | None, limite: int = 400) -> str:
    """Achata espaços/quebras de linha e corta o resumo em `limite` caracteres.

    O campo `notes` do CKAN vem com `\\r\\n` e listas de links; guardar inteiro
    inflaria o JSON sem ganho de informação para o índice.
    """
    return " ".join((texto or "").split())[:limite]


def detalhar(nome: str) -> dict:
    """Lê `package_show` de um conjunto e devolve a ficha enxuta.

    Campos escolhidos para dar o que o portal precisa sem copiar o payload
    inteiro do CKAN (~30 KB por conjunto):
    - `nome`: chave estável, usada nas URLs de dataset;
    - `titulo`, `resumo`: leitura humana;
    - `formatos`: o que dá para baixar (CSV/XLSX/PARQUET/JSON/PDF);
    - `recursos`: quantos arquivos o conjunto publica;
    - `atualizadoEm`: quando o ONS mexeu no conjunto pela última vez;
    - `licenca`: id/título/URL, para a página poder citar a fonte;
    - `tamanhoBytes`: soma dos tamanhos declarados dos recursos (estimativa;
      o tamanho real medido dos conjuntos da fase 1 está no coletor de energia);
    - `grupos` e `tags`: base do agrupamento temático da documentação.
    """
    resposta = pegar_json(f"{BASE}/package_show?id={nome}")
    pacote = resposta.get("result") or {}
    recursos = pacote.get("resources") or []

    formatos = sorted({(r.get("format") or "").upper() for r in recursos if r.get("format")})
    tamanho = sum(int(r.get("size") or 0) for r in recursos)
    # O total soma todas as versões do mesmo dado (CSV + XLSX + PARQUET + PDF).
    # O recorte só de CSV é o que o ETL baixa, então vai medido à parte.
    tamanho_csv = sum(
        int(r.get("size") or 0) for r in recursos if (r.get("format") or "").upper() == "CSV"
    )

    return {
        "nome": nome,
        "titulo": limpar_texto(pacote.get("title") or nome, 220),
        "resumo": limpar_texto(pacote.get("notes")),
        "url": f"{PORTAL}dataset/{nome}",
        "recursos": len(recursos),
        "formatos": formatos,
        "atualizadoEm": pacote.get("metadata_modified") or "",
        "criadoEm": pacote.get("metadata_created") or "",
        "licenca": {
            "id": pacote.get("license_id") or "",
            "titulo": pacote.get("license_title") or "",
            "url": pacote.get("license_url") or "",
        },
        "tags": sorted({t.get("name") for t in (pacote.get("tags") or []) if t.get("name")}),
        "grupos": sorted(
            {
                g.get("display_name") or g.get("name")
                for g in (pacote.get("groups") or [])
                if g.get("display_name") or g.get("name")
            }
        ),
        "tamanhoBytes": tamanho,
        "tamanhoCsvBytes": tamanho_csv,
    }


def main(argv: list[str] | None = None) -> int:
    """Coleta o catálogo inteiro e grava o JSON agregado.

    Etapas: lista os nomes (`package_list`), busca as fichas em paralelo
    (máx. 4, com 10 s de espera por worker), ordena por título e grava.
    """
    parser = argparse.ArgumentParser(description="Catálogo CKAN dos dados abertos do ONS.")
    parser.add_argument("--saida", type=Path, default=DESTINO_PADRAO, help="caminho do JSON de saída")
    args = parser.parse_args(argv)

    inicio = time.time()
    print(f"CKAN: {BASE} (UA: {UA})")

    lista = pegar_json(f"{BASE}/package_list").get("result") or []
    print(f"{len(lista)} conjuntos listados; buscando fichas com {WORKERS} workers e {ESPERA_CKAN:.0f} s de espera")

    def tarefa(nome: str) -> dict:
        # Escalona a largada para não disparar 4 chamadas no mesmo instante.
        # `crc32` (e não `hash`) porque o hash de string muda por processo.
        time.sleep((zlib.crc32(nome.encode("utf-8")) % WORKERS) * (ESPERA_CKAN / WORKERS))
        ficha = detalhar(nome)
        print(".", end="", flush=True)
        time.sleep(ESPERA_CKAN)
        return ficha

    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        itens = list(pool.map(tarefa, lista))
    print()

    itens.sort(key=lambda i: (i["titulo"].lower(), i["nome"]))

    documento = {
        "fonte": PORTAL,
        "api": f"{BASE}/package_list",
        "licenca": "Creative Commons Atribuição (CC-BY) — declarada em cada conjunto",
        "coletadoEm": agora_iso(),
        "total": len(itens),
        "itens": itens,
    }

    args.saida.parent.mkdir(parents=True, exist_ok=True)
    args.saida.write_text(
        json.dumps(documento, ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8",
        # LF explícito: o git normaliza na entrada, e o tamanho medido tem de
        # ser o do arquivo versionado, não o do Windows com CRLF.
        newline="\n",
    )

    tamanho_kb = args.saida.stat().st_size / 1024
    print(f"gravado {args.saida} ({tamanho_kb:.1f} KB) em {time.time() - inicio:.0f} s")
    print(f"{len(itens)} conjuntos | formatos vistos: {sorted({f for i in itens for f in i['formatos']})}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
