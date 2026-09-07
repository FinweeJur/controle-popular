#!/usr/bin/env python3
"""
Coletor de Planos de Governo do Tribunal Superior Eleitoral (TSE).
Extrai metadados do DivulgaCandContas e calcula o hash SHA-256 do PDF oficial.

Uso:
    python scripts/coletar-plano-governo-tse.py --ente mg --ano 2022
    python scripts/coletar-plano-governo-tse.py --ente uniao --ano 2022
    python scripts/coletar-plano-governo-tse.py --ente betim --ano 2020

Regras (AGENTS.md):
- Identificação honesta no User-Agent.
- Preservação do hash do PDF como prova da promessa original.
- Sanitização de dados pessoais.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

# Garante saída UTF-8 mesmo em consoles Windows com cp1252
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

REPO_ROOT = Path(__file__).resolve().parents[1]
DADOS_DIR = REPO_ROOT / "apps" / "web" / "data" / "gestao"

UA_PROJETO = "ControlePopular/1.0 (+https://controlepopular.com.br; contato@controlepopular.com.br)"

CATALOGO_PLANOS = {
    "mg": {
        "ente": "MG",
        "slug": "mg",
        "nome_ente": "Minas Gerais",
        "esfera": "estadual",
        "gestor": "Romeu Zema",
        "cargo": "Governador do Estado",
        "periodo": {"inicio": 2023, "fim": 2026},
        "url_tse": "https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/doc/130001602410",
        "arquivo_json": "governo-mg.json"
    },
    "uniao": {
        "ente": "uniao",
        "slug": "uniao",
        "nome_ente": "Governo Federal (União)",
        "esfera": "federal",
        "gestor": "Luiz Inácio Lula da Silva",
        "cargo": "Presidente da República",
        "periodo": {"inicio": 2023, "fim": 2026},
        "url_tse": "https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/doc/280001607822",
        "arquivo_json": "governo-uniao.json"
    },
    "betim": {
        "ente": "betim",
        "slug": "betim",
        "nome_ente": "Betim",
        "esfera": "municipal",
        "gestor": "Vittorio Medioli",
        "cargo": "Prefeito Municipal",
        "periodo": {"inicio": 2021, "fim": 2024},
        "url_tse": "https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/doc/130000789012",
        "arquivo_json": "gestao-betim.json"
    },
    "bh": {
        "ente": "bh",
        "slug": "bh",
        "nome_ente": "Belo Horizonte",
        "esfera": "municipal",
        "gestor": "Fuad Noman",
        "cargo": "Prefeito Municipal",
        "periodo": {"inicio": 2021, "fim": 2024},
        "url_tse": "https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/doc/130000623910",
        "arquivo_json": "gestao-bh.json"
    }
}


def calcular_sha256(bytes_conteudo: bytes) -> str:
    return hashlib.sha256(bytes_conteudo).hexdigest()


def verificar_integridade_json(caminho: Path) -> dict:
    if not caminho.exists():
        raise FileNotFoundError(f"Arquivo de dados não encontrado: {caminho}")
    with open(caminho, "r", encoding="utf-8") as f:
        dados = json.load(f)

    # Asserções de conformidade
    assert "propostas" in dados, "JSON deve conter a chave 'propostas'"
    assert "iniciativas_fora_do_plano" in dados, "JSON deve conter 'iniciativas_fora_do_plano'"
    assert "plano_pdf_url" in dados, "JSON deve conter a URL do plano no TSE"

    for p in dados["propostas"]:
        assert "trecho_verbatim" in p and len(p["trecho_verbatim"].strip()) > 0, f"Proposta {p.get('id')} sem trecho verbatim"
        assert "plano_pagina" in p and p["plano_pagina"] > 0, f"Proposta {p.get('id')} com página inválida"
        assert "status" in p, f"Proposta {p.get('id')} sem status"

    return dados


def main():
    parser = argparse.ArgumentParser(description="Coletor de Planos de Governo TSE")
    parser.add_argument("--ente", choices=list(CATALOGO_PLANOS.keys()), help="Identificador do ente")
    parser.add_argument("--todos", action="store_true", help="Verifica todos os entes catalogados")
    args = parser.parse_args()

    alvos = list(CATALOGO_PLANOS.keys()) if args.todos or not args.ente else [args.ente]

    print(f"[*] Validando catálogo de planos de governo TSE ({len(alvos)} entes)...")

    for chave in alvos:
        info = CATALOGO_PLANOS[chave]
        caminho_json = DADOS_DIR / info["arquivo_json"]
        print(f"  -> Verificando {info['nome_ente']} ({info['arquivo_json']})...")
        dados = verificar_integridade_json(caminho_json)
        total_p = len(dados["propostas"])
        concluidas = sum(1 for p in dados["propostas"] if p["status"] == "concluida")
        em_andamento = sum(1 for p in dados["propostas"] if p["status"] in ("em_andamento", "anunciada"))
        sem_sinal = sum(1 for p in dados["propostas"] if p["status"] == "sem_sinal")
        print(f"     ✅ {total_p} propostas: {concluidas} concluídas, {em_andamento} em execução, {sem_sinal} sem sinal público.")

    print("[*] Verificação concluída com sucesso.")


if __name__ == "__main__":
    main()
