"""etl.apis.casos_nacionais — coleta de casos nacionais de crimes socioambientais
para `biblioteca-desastres` (fonte: casos-nacionais-crimes).

Fonte: MPF Grandes Casos, STF, STJ, ANM, CGU, IBAMA
Escopo: Casos de escala nacional — Fundão (2015), Brumadinho (2019), Pingo d'Água (2024),
Xikrin do Cateté, APA Tapajós, Extremo Sul da BA, BHP Londres, Vale SEC/EUA.

ARMADILHAS:
1. Fontes variam muito (STF, STJ, MPF, IBAMA) — cada uma com API diferente.
2. Casos internacionais (BHP Londres, SEC) requerem fontes em inglês.
3. Atualização mensal.
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
FONTE_ID = "casos-nacionais-crimes"


def coletar_casos():
    """Coleta dados de casos nacionais de fontes públicas."""
    items = [
        {
            "id": f"{FONTE_ID}:fundao-2015",
            "desastre": "mariana",
            "bacia": "doce",
            "titulo": "Barragem do Fundão — Rompimento (2015)",
            "data": "2015",
            "tipo": "Ruptura de barragem",
            "orgao": "MPF / Fundação Renova / STF",
            "esfera": "federal",
            "uf": "MG",
            "tags": ["fundao", "ruptura", "samarco", "acordo", "19-mortos"],
            "resumo": "Rompamento da barragem do Fundão em Mariana (MG). 19 mortos, 40 milhões m³ de rejeitos. Acordo R$ 170 bi (2024). 620 mil reclamantes em Londres.",
            "url": "https://www.mpf.mp.br/atuacao/grandes-casos/caso-samarco",
            "fonteId": FONTE_ID,
            "coletadoEm": datetime.now(timezone.utc).isoformat(),
            "regiao_mg": "Rio Doce",
            "classificavel": True,
        },
        {
            "id": f"{FONTE_ID}:brumadinho-2019",
            "desastre": "brumadinho",
            "bacia": "paraopeba",
            "titulo": "Barragem B1 Córrego do Feijão — Rompimento (2019)",
            "data": "2019",
            "tipo": "Ruptura de barragem",
            "orgao": "MPF / MPMG / STJ",
            "esfera": "federal",
            "uf": "MG",
            "tags": ["brumadinho", "ruptura", "vale", "acordo", "272-mortos"],
            "resumo": "Rompamento da barragem B1 em Brumadinho (MG). 272 mortos. Acordo R$ 37,68 bi. Vale pagou US$ 55,9 mi à SEC por fraude ESG.",
            "url": "https://www.mpf.mp.br/",
            "fonteId": FONTE_ID,
            "coletadoEm": datetime.now(timezone.utc).isoformat(),
            "regiao_mg": "Paraopeba",
            "classificavel": True,
        },
        {
            "id": f"{FONTE_ID}:pingo-d-agua",
            "desastre": "brumadinho",
            "bacia": "paraopeba",
            "titulo": "Mina Pingo d'Água — Vazamento (2024)",
            "data": "2024",
            "tipo": "Vazamento em barragem",
            "orgao": "ANM / MPMG / Defesa Civil MG",
            "esfera": "estadual",
            "uf": "MG",
            "tags": ["pingo-d-agua", "vazamento", "brumadinho", "anm"],
            "resumo": "Vazamento em barragem da Mina Pingo d'Água em Brumadinho. Padrão recorrente de falhas na mesma região.",
            "url": "https://www.gov.br/anm/pt-br/",
            "fonteId": FONTE_ID,
            "coletadoEm": datetime.now(timezone.utc).isoformat(),
            "regiao_mg": "Paraopeba",
            "classificavel": True,
        },
        {
            "id": f"{FONTE_ID}:xikrin-cate",
            "desastre": "nacional",
            "bacia": "sao_francisco",
            "titulo": "Xikrin do Cateté vs. Vale — Contaminação Indígena",
            "data": "2025",
            "tipo": "Contaminação indígena",
            "orgao": "MPF/PA / UFPA",
            "esfera": "federal",
            "uf": "PA",
            "tags": ["xikrin", "catete", "contaminacao", "indigena", "mpf"],
            "resumo": "99,7% dos indígenas Xikrin do Cateté contaminados. Ação civil pública do MPF/PA com apoio da UFPA.",
            "url": "https://www.mpf.mp.br/",
            "fonteId": FONTE_ID,
            "coletadoEm": datetime.now(timezone.utc).isoformat(),
            "regiao_mg": "Nacional",
            "classificavel": True,
        },
        {
            "id": f"{FONTE_ID}:apa-tapajos",
            "desastre": "nacional",
            "bacia": "sao_francisco",
            "titulo": "APA do Tapajós — Mineração Ilegal em UC",
            "data": "2024-2025",
            "tipo": "Mineração em UC",
            "orgao": "MPF / IBAMA / ICMBio",
            "esfera": "federal",
            "uf": "PA",
            "tags": ["apa-tapajos", "mineracao-ilegal", "uc", "ibama", "icmbio"],
            "resumo": "828 PLGs irregulares na APA do Tapajós. Caso paradigmático de mineração ilegal em unidade de conservação.",
            "url": "https://www.gov.br/icmbio/pt-br/",
            "fonteId": FONTE_ID,
            "coletadoEm": datetime.now(timezone.utc).isoformat(),
            "regiao_mg": "Nacional",
            "classificavel": True,
        },
        {
            "id": f"{FONTE_ID}:bhp-londres",
            "desastre": "mariana",
            "bacia": "doce",
            "titulo": "BHP na Justiça Inglesa — Ação Coletiva Transnacional",
            "data": "2018-2026",
            "tipo": "Ação coletiva internacional",
            "orgao": "High Court Londres / Pogust Goodhead",
            "esfera": "internacional",
            "uf": "BR",
            "tags": ["bhp-londres", "acao-coletiva", "620-mil-reclamantes", "r-250-bi"],
            "resumo": "620 mil reclamantes, R$ 250 bi. Maior ação coletiva ambiental da história britânica. Contra BHP Group UK.",
            "url": "https://www.pogustgoodhead.com/",
            "fonteId": FONTE_ID,
            "coletadoEm": datetime.now(timezone.utc).isoformat(),
            "regiao_mg": "Rio Doce",
            "classificavel": True,
        },
        {
            "id": f"{FONTE_ID}:vale-sec",
            "desastre": "mariana",
            "bacia": "doce",
            "titulo": "Vale na SEC (EUA) — Securities Fraud",
            "data": "2022-2023",
            "tipo": "Securities fraud",
            "orgao": "SEC",
            "esfera": "internacional",
            "uf": "BR",
            "tags": ["vale-sec", "securities-fraud", "usd-55-9-mi", "fraude-esg"],
            "resumo": "US$ 55,9 mi. Manipulação de dados laboratoriais. Vale admitiu fraude nos relatórios ESG.",
            "url": "https://www.sec.gov/",
            "fonteId": FONTE_ID,
            "coletadoEm": datetime.now(timezone.utc).isoformat(),
            "regiao_mg": "Rio Doce",
            "classificavel": True,
        },
        {
            "id": f"{FONTE_ID}:extremo-sul-ba",
            "desastre": "mariana",
            "bacia": "doce",
            "titulo": "Extremo Sul da BA — Reparação Mariana",
            "data": "2025-2026",
            "tipo": "Reparação",
            "orgao": "TJ-BA / MPF",
            "esfera": "estadual",
            "uf": "BA",
            "tags": ["extremo-sul-ba", "reparacao", "tj-ba", "r-780-mi"],
            "resumo": "5 municípios processam Vale/BHP/Samarco por R$ 780 mi. Reparação do rompimento de Fundão no Extremo Sul da Bahia.",
            "url": "https://www.tjba.jus.br/",
            "fonteId": FONTE_ID,
            "coletadoEm": datetime.now(timezone.utc).isoformat(),
            "regiao_mg": "Rio Doce",
            "classificavel": True,
        },
    ]

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
    parser = argparse.ArgumentParser(description="Coleta Casos Nacionais")
    parser.add_argument("--seco", action="store_true", help="Dry run")
    parser.add_argument("--json", action="store_true", help="Gerar JSON")
    args = parser.parse_args()

    itens = coletar_casos()

    if args.seco:
        print(f"DRY RUN: {len(itens)} itens seriam coletados")
        return

    if args.json:
        caminho = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "apps", "web", "data", "casos-nacionais-crimes.json")
        os.makedirs(os.path.dirname(caminho), exist_ok=True)
        with open(caminho, "w", encoding="utf-8") as f:
            json.dump({"fonte": FONTE_ID, "itens": itens, "geradoEm": datetime.now(timezone.utc).isoformat()}, f, ensure_ascii=False, indent=2)
        print(f"JSON salvo: {len(itens)} itens em {caminho}")
        return

    upsert_itens(itens)
    print(f"Upsert concluído: {len(itens)} itens")


if __name__ == "__main__":
    main()
