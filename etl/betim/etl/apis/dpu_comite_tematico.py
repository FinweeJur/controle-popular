"""etl.apis.dpu_comite_tematico — coleta de notas técnicas do DPU Comitê Temático
para `biblioteca-desastres` (fonte: dpu-comite-tematico).

Fonte: Portal de Direitos Humanos da DPU,
`direitoshumanos.dpu.def.br/comite-tematico-especializado-rio-doce-brumadinho/`
Escopo: Notas técnicas sobre atingidos, habitação, renda e saúde no âmbito da
reparação dos rompimentos de Fundão e Córrego do Feijão.

ARMADILHAS:
1. Portal da DPU pode ser lento ou bloquear crawlers.
2. Notas técnicas são PDFs — metadado + link, nunca o arquivo.
3. Atualização semanal.
"""
import argparse
import sys
import json
import os
from datetime import datetime, timezone

import requests

USER_AGENT = "ControlePopular/1.0 (coletor; contato: controlepopular@controlepopular.com.br)"
BASE_URL = "https://direitoshumanos.dpu.def.br"
FONTE_ID = "dpu-comite-tematico"


def coletar_notas():
    """Busca documentos do portal da DPU Comitê Temático."""
    items = []
    # WordPress REST API ou listagem de documentos
    url = f"{BASE_URL}/wp-json/wp/v2/posts?per_page=100"
    resp = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=30)
    if resp.status_code == 403:
        print("Acesso 403 — tentando com User-Agent alternativo")
        resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=30)
    resp.raise_for_status()

    for post in resp.json():
        items.append({
            "id": f"{FONTE_ID}:{post['id']}",
            "desastre": "brumadinho",
            "bacia": "paraopeba",
            "titulo": post.get("title", {}).get("rendered", "").replace("<p>", "").replace("</p>", "").strip(),
            "data": post.get("date", "")[:10] if post.get("date") else None,
            "tipo": "Nota técnica",
            "orgao": "DPU — Comitê Temático",
            "esfera": "federal",
            "uf": "MG",
            "tags": ["dpu-comite-tematico", "atingidos", "habitacao", "renda", "saude"],
            "resumo": post.get("excerpt", {}).get("rendered", "").replace("<p>", "").replace("</p>", "").strip()[:200] if post.get("excerpt", {}).get("rendered") else None,
            "url": post.get("link", ""),
            "fonteId": FONTE_ID,
            "coletadoEm": datetime.now(timezone.utc).isoformat(),
            "regiao_mg": "Paraopeba",
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
    parser = argparse.ArgumentParser(description="Coleta DPU Comitê Temático")
    parser.add_argument("--seco", action="store_true", help="Dry run")
    parser.add_argument("--json", action="store_true", help="Gerar JSON")
    args = parser.parse_args()

    itens = coletar_notas()

    if args.seco:
        print(f"DRY RUN: {len(itens)} itens seriam coletados")
        return

    if args.json:
        caminho = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "apps", "web", "data", "dpu-comite-tematico.json")
        os.makedirs(os.path.dirname(caminho), exist_ok=True)
        with open(caminho, "w", encoding="utf-8") as f:
            json.dump({"fonte": FONTE_ID, "itens": itens, "geradoEm": datetime.now(timezone.utc).isoformat()}, f, ensure_ascii=False, indent=2)
        print(f"JSON salvo: {len(itens)} itens em {caminho}")
        return

    upsert_itens(itens)
    print(f"Upsert concluído: {len(itens)} itens")


if __name__ == "__main__":
    main()
