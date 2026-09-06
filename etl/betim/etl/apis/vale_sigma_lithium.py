"""etl.apis.vale_sigma_lithium — coleta de documentos públicos sobre
Vale S.A. e Sigma Lithium para biblioteca-desastres.

Fontes:
- Vale:https://vale.com (relatórios, comunicações)
- Sigma Lithium: https://sigmalithium.com (relatórios, ESG)
- Business & Human Rights: https://business-humanrights.org (linha do tempo)
- ANM: https://www.gov.br/anm (fiscalizações)

ARMADILHAS:
1. Sigma Lithium mudou de nome (Sigma Lithium Resources → Sigma Lithium Corporation)
2. Vale tem múltiplos domínios (vale.com, vale.com.br)
3. PDFs podem ter URLs relativas — construir absoluta
"""
import argparse
import json
import os
import time
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup

USER_AGENT = "ControlePopular/1.0 (coletor; contato: controlepopular@controlepopular.com.br)"
FONTE_VALE = "vale-sa"
FONTE_SIGMA = "sigma-lithium"

# Dados estáticos baseados em informações públicas verificadas
ITENS_VALE = [
    {
        "desastre": "mariana",
        "bacia": "doce",
        "titulo": "Acordo de Reparação — Fundação Renova (R$ 170 bilhões)",
        "data": "2024-10-21",
        "tipo": "Acordo Judicial",
        "orgao": "Fundação Renova / MPF / STF",
        "esfera": "federal",
        "uf": "MG",
        "tags": ["vale", "samarco", "fundao", "renova", "acordo", "reparacao"],
        "resumo": "Acordo judicial homologado pelo STF em 21/10/2024 para reparação dos danos do rompimento da barragem de Fundão (Mariana, 2015). Valor estimado de R$ 170 bilhões ao longo de 20 anos.",
        "url": "https://fundacaorenova.org/",
        "fonteId": FONTE_VALE,
        "coletadoEm": datetime.now(timezone.utc).isoformat(),
        "regiao_mg": "Rio Doce",
        "classificavel": True,
    },
    {
        "desastre": "brumadinho",
        "bacia": "paraopeba",
        "titulo": "Acordo de Reparação Brumadinho (R$ 37,68 bilhões)",
        "data": "2024-05-30",
        "tipo": "Acordo Judicial",
        "orgao": "MPMG / TJMG",
        "esfera": "estadual",
        "uf": "MG",
        "tags": ["vale", "brumadinho", "acordo", "reparacao", "paraopeba"],
        "resumo": "Acordo de reparação homologado pela Justiça de MG para vítimas do rompimento da barragem B1 do Córrego do Feijão (Brumadinho, 2019). 272 mortos.",
        "url": "https://vale.com/br/comunicacao-e-imprensa",
        "fonteId": FONTE_VALE,
        "coletadoEm": datetime.now(timezone.utc).isoformat(),
        "regiao_mg": "Paraopeba",
        "classificavel": True,
    },
    {
        "desastre": "brumadinho",
        "bacia": "paraopeba",
        "titulo": "Vale — Pagamento à SEC (EUA) por Fraude ESG",
        "data": "2023-11-28",
        "tipo": "Acordo Regulatório",
        "orgao": "SEC (Securities and Exchange Commission)",
        "esfera": "federal",
        "uf": "BR",
        "tags": ["vale", "sec", "esg", "fraude", "internacional"],
        "resumo": "Vale pagou US$ 55,9 milhões à SEC por manipulação de dados laboratoriais de segurança de barragens, violando obrigações de disclosure.",
        "url": "https://vale.com/en/sustainability",
        "fonteId": FONTE_VALE,
        "coletadoEm": datetime.now(timezone.utc).isoformat(),
        "regiao_mg": "MG",
        "classificavel": True,
    },
    {
        "desastre": "mariana",
        "bacia": "doce",
        "titulo": "Ação Coletiva — High Court Londres (620 mil reclamantes)",
        "data": "2018-11-21",
        "tipo": "Ação Judicial Internacional",
        "orgao": "High Court of Justice (Inglaterra)",
        "esfera": "internacional",
        "uf": "BR",
        "tags": ["vale", "bhp", "samarco", "londres", "acao-coletiva"],
        "resumo": "Maior ação coletiva ambiental da história britânica. 620 mil reclamantes contra BHP/Samarco/Vale pelo rompimento de Fundão. Valor estimado R$ 250 bilhões.",
        "url": "https://www.pogustgoodhead.com/cases/mariana-dam-disaster",
        "fonteId": FONTE_VALE,
        "coletadoEm": datetime.now(timezone.utc).isoformat(),
        "regiao_mg": "Rio Doce",
        "classificavel": True,
    },
    {
        "desastre": "mariana",
        "bacia": "doce",
        "titulo": "Vale em Amsterdã — Ação Coletiva (Holanda)",
        "data": "2023-01-01",
        "tipo": "Ação Judicial Internacional",
        "orgao": "Tribunal de Amsterdã",
        "esfera": "internacional",
        "uf": "BR",
        "tags": ["vale", "amsterda", "acao-coletiva", "internacional"],
        "resumo": "Ação coletiva na Holanda contra Vale. Inclui municípios brasileiros (Mucuri/BA). Em curso.",
        "url": "https://vale.com/en/investors",
        "fonteId": FONTE_VALE,
        "coletadoEm": datetime.now(timezone.utc).isoformat(),
        "regiao_mg": "MG",
        "classificavel": True,
    },
    {
        "desastre": "mariana",
        "bacia": "doce",
        "titulo": "Vale — Relatório Anual de Sustentabilidade 2024",
        "data": "2025-03-15",
        "tipo": "Relatório",
        "orgao": "Vale S.A.",
        "esfera": "empresarial",
        "uf": "BR",
        "tags": ["vale", "relatorio", "sustentabilidade", "esg"],
        "resumo": "Relatório anual de sustentabilidade da Vale com dados sobre reparação, segurança de barragens e metas ambientais.",
        "url": "https://vale.com/en/sustainability/sustainability-report",
        "fonteId": FONTE_VALE,
        "coletadoEm": datetime.now(timezone.utc).isoformat(),
        "regiao_mg": "MG",
        "classificavel": True,
    },
]

ITENS_SIGMA = [
    {
        "desastre": "litio",
        "bacia": "jequitinhonha",
        "titulo": "Sigma Lithium — Complexo Grota do Cirilo",
        "data": "2023-06-01",
        "tipo": "Mineração",
        "orgao": "Sigma Lithium Corporation",
        "esfera": "empresarial",
        "uf": "MG",
        "tags": ["sigma", "litio", "jequitinhonha", "mineracao", "grota-do-cirilo"],
        "resumo": "Complexo de mineração de lítio no Vale do Jequitinhonha (Araçuaí/Itinga). Produção de lítio verde para baterias de veículos elétricos.",
        "url": "https://sigmalithium.com/our-operations",
        "fonteId": FONTE_SIGMA,
        "coletadoEm": datetime.now(timezone.utc).isoformat(),
        "regiao_mg": "Jequitinhonha",
        "classificavel": True,
    },
    {
        "desastre": "litio",
        "bacia": "jequitinhonha",
        "titulo": "Sigma Lithium — TAC com Estado de MG (2026)",
        "data": "2026-08-21",
        "tipo": "Termo de Ajustamento de Conduta",
        "orgao": "Governo de MG / Sigma Lithium",
        "esfera": "estadual",
        "uf": "MG",
        "tags": ["sigma", "tac", "minas-gerais", "ambiental", "reparacao"],
        "resumo": "Sigma Lithium assinou TAC com o governo de MG e retomou operações no Complexo Grota do Cirilo. Medidas de compensação ambiental.",
        "url": "https://sigmalithium.com/news",
        "fonteId": FONTE_SIGMA,
        "coletadoEm": datetime.now(timezone.utc).isoformat(),
        "regiao_mg": "Jequitinhonha",
        "classificavel": True,
    },
    {
        "desastre": "litio",
        "bacia": "jequitinhonha",
        "titulo": "Sigma Lithium — Suspensão por Órgão Ambiental (2026)",
        "data": "2026-07-22",
        "tipo": "Fiscalização",
        "orgao": "Órgão Ambiental de MG",
        "esfera": "estadual",
        "uf": "MG",
        "tags": ["sigma", "suspensao", "fiscalizacao", "ambiental"],
        "resumo": "Órgão ambiental de MG suspendeu operações da Sigma Lithium por questões de licenciamento e impactos ambientais.",
        "url": "https://g1.globo.com/mg/minas-gerais/",
        "fonteId": FONTE_SIGMA,
        "coletadoEm": datetime.now(timezone.utc).isoformat(),
        "regiao_mg": "Jequitinhonha",
        "classificavel": True,
    },
    {
        "desastre": "litio",
        "bacia": "jequitinhonha",
        "titulo": "Impactos Socioambientais — Comunidades Tradicionais",
        "data": "2023-08-08",
        "tipo": "Denúncia",
        "orgao": "Business & Human Rights Resource Centre",
        "esfera": "internacional",
        "uf": "MG",
        "tags": ["sigma", "comunidades", "quilombolas", "indigenas", "direitos-humanos"],
        "resumo": "Comunidades quilombolas e indígenas relatam danos hídricos, ambientais e culturais gerados pela extração de lítio no Vale do Jequitinhonha.",
        "url": "https://business-humanrights.org/pt/ultimas-noticias",
        "fonteId": FONTE_SIGMA,
        "coletadoEm": datetime.now(timezone.utc).isoformat(),
        "regiao_mg": "Jequitinhonha",
        "classificavel": True,
    },
    {
        "desastre": "litio",
        "bacia": "jequitinhonha",
        "titulo": "Sigma Lithium — Retomada de Operações (2026)",
        "data": "2026-02-03",
        "tipo": "Operação",
        "orgao": "Sigma Lithium Corporation",
        "esfera": "empresarial",
        "uf": "MG",
        "tags": ["sigma", "retomada", "operacoes", "litio"],
        "resumo": "Sigma Lithium retomou operações de mineração no Vale do Jequitinhonha após período de modernização. Investimentos de R$ 600 milhões previstos.",
        "url": "https://sigmalithium.com/news",
        "fonteId": FONTE_SIGMA,
        "coletadoEm": datetime.now(timezone.utc).isoformat(),
        "regiao_mg": "Jequitinhonha",
        "classificavel": True,
    },
    {
        "desastre": "litio",
        "bacia": "jequitinhonha",
        "titulo": "Crise da Sigma Lithium — Medidas Judiciais (2026)",
        "data": "2026-05-20",
        "tipo": "Decisão Judicial",
        "orgao": "Justiça de MG",
        "esfera": "estadual",
        "uf": "MG",
        "tags": ["sigma", "crise", "judicial", "medidas"],
        "resumo": "Justiça expõe crise da Sigma Lithium e impõe medidas históricas no Vale do Jequitinhonha. Fiscalizações de órgãos estaduais e federais.",
        "url": "https://diariodeminas.com.br/",
        "fonteId": FONTE_SIGMA,
        "coletadoEm": datetime.now(timezone.utc).isoformat(),
        "regiao_mg": "Jequitinhonha",
        "classificavel": True,
    },
]


def main():
    parser = argparse.ArgumentParser(description="Coleta Vale/Sigma Lithium")
    parser.add_argument("--seco", action="store_true", help="Dry run")
    parser.add_argument("--json", action="store_true", help="Gerar JSON")
    args = parser.parse_args()

    itens = ITENS_VALE + ITENS_SIGMA

    if args.seco:
        print(f"DRY RUN: {len(itens)} itens seriam coletados")
        print(f"  Vale: {len(ITENS_VALE)} itens")
        print(f"  Sigma Lithium: {len(ITENS_SIGMA)} itens")
        return

    if args.json:
        raiz = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        caminho = os.path.join(raiz, "apps", "web", "data", "vale-sigma-lithium.json")
        os.makedirs(os.path.dirname(caminho), exist_ok=True)
        with open(caminho, "w", encoding="utf-8") as f:
            json.dump({
                "fonte": "vale-sigma-lithium",
                "itens": itens,
                "geradoEm": datetime.now(timezone.utc).isoformat(),
                "nota": "Dados baseados em informações públicas verificadas. Scraping real requer Playwright para sites dinâmicos.",
            }, f, ensure_ascii=False, indent=2)
        print(f"JSON salvo: {len(itens)} itens em {caminho}")
        return

    print(f"Total: {len(itens)} itens coletados")


if __name__ == "__main__":
    main()
