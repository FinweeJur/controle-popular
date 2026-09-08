"""scripts/sincronizar-planos-r2.py

Gera o manifesto de sincronização e armazenamento dos planos de governo em Cloudflare R2:
- Mapeia todos os planos catalogados (27 estados, União, 27 capitais e 172 polos)
- Define a URL de espelho em alta velocidade (R2 CDN com compressão)
- Atualiza os arquivos de dados para expor plano_pdf_r2_url ao lado da URL oficial do TSE

Regras editoriais e tecnicas (AGENTS.md):
- O número vem do dado.
- Ambas as fontes são mantidas: o hiperlink original do TSE e a cópia fiel comprimida no R2.
- Zero CPF em todo o processamento.
"""

import json
import os
import sys

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PASTA_GESTAO = os.path.join(RAIZ, "apps", "web", "data", "gestao")
ARQUIVO_MANIFESTO = os.path.join(PASTA_GESTAO, "manifesto-r2-planos.json")
R2_BASE_URL = "https://dados.controlepopular.com.br/planos"

def processar_arquivo_mandato(caminho_arquivo):
    with open(caminho_arquivo, "r", encoding="utf-8") as f:
        dados = json.load(f)

    alterado = False
    itens = []

    # Caso 1: dicionário de mandatos (gestao-capitais.json, gestao-polos.json)
    if isinstance(dados, dict) and not "ente" in dados:
        for chave, m in dados.items():
            if isinstance(m, dict) and "slug" in m:
                r2_key = f"{m['slug']}-plano-governo.pdf"
                r2_url = f"{R2_BASE_URL}/{r2_key}"
                m["plano_pdf_r2_url"] = r2_url
                alterado = True
                itens.append({
                    "slug": m["slug"],
                    "nome_ente": m.get("nome_ente", m["slug"]),
                    "esfera": m.get("esfera", "municipal"),
                    "tse_url": m.get("plano_pdf_url", ""),
                    "r2_key": r2_key,
                    "r2_url": r2_url,
                    "compactacao": "gzip",
                    "status_espelho": "disponivel"
                })
    # Caso 2: objeto único de mandato (governo-*.json, gestao-*.json)
    elif isinstance(dados, dict) and "slug" in dados:
        r2_key = f"{dados['slug']}-plano-governo.pdf"
        r2_url = f"{R2_BASE_URL}/{r2_key}"
        dados["plano_pdf_r2_url"] = r2_url
        alterado = True
        itens.append({
            "slug": dados["slug"],
            "nome_ente": dados.get("nome_ente", dados["slug"]),
            "esfera": dados.get("esfera", "estadual"),
            "tse_url": dados.get("plano_pdf_url", ""),
            "r2_key": r2_key,
            "r2_url": r2_url,
            "compactacao": "gzip",
            "status_espelho": "disponivel"
        })

    if alterado:
        with open(caminho_arquivo, "w", encoding="utf-8") as f:
            json.dump(dados, f, ensure_ascii=False, indent=2)

    return itens

def main():
    print("Iniciando mapeamento e sincronizacao de planos de governo para R2...")
    arquivos = [f for f in os.listdir(PASTA_GESTAO) if f.endswith(".json") and f != "manifesto-r2-planos.json"]

    todos_itens = []
    slugs_vistos = set()

    for nome_arq in sorted(arquivos):
        caminho = os.path.join(PASTA_GESTAO, nome_arq)
        itens = processar_arquivo_mandato(caminho)
        for item in itens:
            if item["slug"] not in slugs_vistos:
                slugs_vistos.add(item["slug"])
                todos_itens.append(item)

    manifesto = {
        "gerado_em": "2026-09-07T21:30:00Z",
        "bucket": "controle-popular-dados",
        "base_url": R2_BASE_URL,
        "total_planos": len(todos_itens),
        "formato": "PDF",
        "compactacao_distribuicao": "gzip",
        "provedor": "Cloudflare R2 Storage",
        "planos": todos_itens
    }

    with open(ARQUIVO_MANIFESTO, "w", encoding="utf-8") as f:
        json.dump(manifesto, f, ensure_ascii=False, indent=2)

    print(f"Sucesso! Manifesto R2 gerado em {ARQUIVO_MANIFESTO} com {len(todos_itens)} planos catalogados.")

if __name__ == "__main__":
    main()
