"""etl.apis.mpf_grandes_casos — coleta de documentos do MPF Grandes Casos
para `biblioteca-desastres` (fonte: mpf-grandes-casos).

Fonte: Portal Grandes Casos do MPF, `mpf.mp.br/atuacao/grandes-casos/caso-samarco/documentos`
Escopo: Acordos, pareceres, laudos do Instituto Lactec, Operação Rejeito sobre a
barragem do Fundão (Mariana/ES).

ARMADILHAS:
1. Portal do MPF pode usar WordPress com autenticação para PDFs.
2. Documentos são PDFs hospedados — metadado + link, nunca o arquivo.
3. Atualização semanal.
"""
import argparse
import sys
import json
import os
from datetime import datetime, timezone

import requests

USER_AGENT = "ControlePopular/1.0 (coletor; contato: controlepopular@controlepopular.com.br)"
BASE_URL = "https://mpf.mp.br"
FONTE_ID = "mpf-grandes-casos"


def coletar_documentos():
    """Busca documentos do MPF Grandes Casos."""
    items = []
    url = f"{BASE_URL}/wp-json/wp/v2/posts?per_page=100&categories=documentos"
    resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=30)
    resp.raise_for_status()

    for post in resp.json():
        content = post.get("content", {}).get("rendered", "")
        tags_post = [t.get("name", "") for t in post.get("tags", [])] if isinstance(post.get("tags", []), list) else []
        items.append({
            "id": f"{FONTE_ID}:{post['id']}",
            "desastre": "mariana",
            "bacia": "doce",
            "titulo": post.get("title", {}).get("rendered", "").replace("<p>", "").replace("</p>", "").strip(),
            "data": post.get("date", "")[:10] if post.get("date") else None,
            "tipo": "Acordo" if "acordo" in (post.get("title", {}).get("rendered", "").lower() or "") else "Laudo" if "laudo" in (post.get("title", {}).get("rendered", "").lower() or "") else "Documento",
            "orgao": "MPF — Grandes Casos",
            "esfera": "federal",
            "uf": "MG",
            "tags": list(set(tags_post + ["mpf-grandes-casos"])),
            "resumo": post.get("excerpt", {}).get("rendered", "").replace("<p>", "").replace("</p>", "").strip()[:200] if post.get("excerpt", {}).get("rendered") else None,
            "url": post.get("link", ""),
            "fonteId": FONTE_ID,
            "coletadoEm": datetime.now(timezone.utc).isoformat(),
            "regiao_mg": "Rio Doce",
            "classificavel": True,
        })

    return items


def upsert_itens(itens):
    """Upsert dos itens coletados."""
    for item in itens:
        try:
            upsert_com_colunas_opcionais(
                tabela="biblioteca_desastres",
                pk_colunas=["id"],
                colunas={
                    "desastre": item["desastre"],
                    "bacia": item["bacia"],
                    "titulo": item["titulo"],
                    "data": item["data"],
                    "tipo": item["tipo"],
                    "orgao": item["orgao"],
                    "esfera": item["esfera"],
                    "uf": item["uf"],
                    "tags": json.dumps(item["tags"]),
                    "resumo": item["resumo"],
                    "url": item["url"],
                    "fonte_id": item["fonteId"],
                    "regiao_mg": item.get("regiao_mg"),
                    "classificavel": item.get("classificavel", True),
                },
            )
        except PgAPIError:
            pass


def main():
    parser = argparse.ArgumentParser(description="Coleta MPF Grandes Casos")
    parser.add_argument("--seco", action="store_true", help="Dry run")
    parser.add_argument("--json", action="store_true", help="Gerar JSON")
    args = parser.parse_args()

    itens = coletar_documentos()

    if args.seco:
        print(f"DRY RUN: {len(itens)} itens seriam coletados")
        return

    if args.json:
        caminho = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "apps", "web", "data", "mpf-grandes-casos.json")
        os.makedirs(os.path.dirname(caminho), exist_ok=True)
        with open(caminho, "w", encoding="utf-8") as f:
            json.dump({"fonte": FONTE_ID, "itens": itens, "geradoEm": datetime.now(timezone.utc).isoformat()}, f, ensure_ascii=False, indent=2)
        print(f"JSON salvo: {len(itens)} itens em {caminho}")
        return

    upsert_itens(itens)
    print(f"Upsert concluído: {len(itens)} itens")


if __name__ == "__main__":
    main()
