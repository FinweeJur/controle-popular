"""etl.apis.mpmg_coerdoce — coleta de ITJs e notas técnicas do MPMG Coerdoce
para `biblioteca-desastres` (fonte: mpmg-coerdoce).

Fonte: Portal de Notícias do MPMG, `mpmg.mp.br/portal/menu/comunicacao/noticias/`
Escopo: Informações Técnico-Jurídicas (ITJs), inquéritos civis, relatórios de
fiscalização sobre os rompimentos de Fundão e Córrego do Feijão.

ARMADILHAS:
1. Portal do MPMG usa WordPress — pode bloquear sem User-Agent de navegador.
2. ITJs são PDFs embutidos em páginas de notícias — requer parsing de HTML.
3. Dados são atualizados mensalmente — coleta mensal.
"""
import argparse
import sys
import json
import os
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
from etl.common import PgAPIError, upsert_com_colunas_opcionais

import requests

USER_AGENT = "ControlePopular/1.0 (coletor; contato: controlepopular@controlepopular.com.br)"
BASE_URL = "https://mpmg.mp.br"
FONTE_ID = "mpmg-coerdoce"


def coletar_noticias():
    """Busca notícias do portal do MPMG Coerdoce."""
    items = []
    # WordPress REST API
    url = f"{BASE_URL}/wp-json/wp/v2/posts?per_page=100&categories=noticias"
    resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=30)
    resp.raise_for_status()

    for post in resp.json():
        items.append({
            "id": f"{FONTE_ID}:{post['id']}",
            "desastre": "brumadinho" if "Paraopeba" in (post.get("title", {}).get("rendered", "") or "") else "mariana",
            "bacia": "paraopeba" if "Paraopeba" in (post.get("title", {}).get("rendered", "") or "") else "doce",
            "titulo": post.get("title", {}).get("rendered", "").replace("<p>", "").replace("</p>", "").strip(),
            "data": post.get("date", "")[:10] if post.get("date") else None,
            "tipo": "Notícia" if "ITJ" not in post.get("title", {}).get("rendered", "") else "ITJ",
            "orgao": "MPMG — Coerdoce",
            "esfera": "estadual",
            "uf": "MG",
            "tags": ["mpmg-coerdoce", "itj"] if "ITJ" in (post.get("title", {}).get("rendered", "") or "") else ["mpmg-coerdoce", "noticia"],
            "resumo": post.get("excerpt", {}).get("rendered", "").replace("<p>", "").replace("</p>", "").strip()[:200] if post.get("excerpt", {}).get("rendered") else None,
            "url": post.get("link", ""),
            "fonteId": FONTE_ID,
            "coletadoEm": datetime.now(timezone.utc).isoformat(),
            "regiao_mg": "Paraopeba" if "Paraopeba" in (post.get("title", {}).get("rendered", "") or "") else "Rio Doce",
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
    parser = argparse.ArgumentParser(description="Coleta MPMG Coerdoce")
    parser.add_argument("--seco", action="store_true", help="Dry run")
    parser.add_argument("--json", action="store_true", help="Gerar JSON")
    args = parser.parse_args()

    itens = coletar_noticias()

    if args.seco:
        print(f"DRY RUN: {len(itens)} itens seriam coletados")
        return

    if args.json:
        caminho = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "apps", "web", "data", "mpmg-coerdoce.json")
        os.makedirs(os.path.dirname(caminho), exist_ok=True)
        with open(caminho, "w", encoding="utf-8") as f:
            json.dump({"fonte": FONTE_ID, "itens": itens, "geradoEm": datetime.now(timezone.utc).isoformat()}, f, ensure_ascii=False, indent=2)
        print(f"JSON salvo: {len(itens)} itens em {caminho}")
        return

    upsert_itens(itens)
    print(f"Upsert concluído: {len(itens)} itens")


if __name__ == "__main__":
    main()
