"""scripts/gerar-mpmg-nucard.py — gera JSON da biblioteca-desastres
com dados do NUCARD/MPMG baseados em informações públicas verificadas.

Fonte: https://www.mpmg.mp.br/portal/menu/areas-de-atuacao/reparacao-por-desastres/
NUCARD: Núcleo de Acompanhamento de Reparações por Desastres (Resolução PGJ nº 6, 06/02/2025)

Este script NÃO faz scraping — gera dados estáticos baseados em informações públicas.
Para scraping real, usar mpmg_notas_tecnicas.py (requer Playwright/JS).
"""
import json
import os
from datetime import datetime, timezone

FONTE_ID = "mpmg-nucard"
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Dados verificados do NUCARD e publicações do MPMG sobre desastres
ITENS_NUCARD = [
    {
        "desastre": "mariana",
        "bacia": "doce",
        "titulo": "Resolução PGJ nº 6/2025 - Criação do NUCARD",
        "data": "2025-02-06",
        "tipo": "Resolução",
        "orgao": "Procuradoria-Geral de Justiça do MPMG",
        "esfera": "estadual",
        "uf": "MG",
        "tags": ["mpmg", "nucard", "resolução", "estrutura"],
        "resumo": "Cria o Núcleo de Acompanhamento de Reparações por Desastres (NUCARD) para coordenar e supervisionar a atuação institucional voltada à reparação integral dos danos socioambientais causados pelos desastres de Mariana (2015) e Brumadinho (2019).",
        "url": "https://www.mpmg.mp.br/portal/menu/areas-de-atuacao/reparacao-por-desastres/",
        "fonteId": FONTE_ID,
        "coletadoEm": datetime.now(timezone.utc).isoformat(),
        "regiao_mg": "Rio Doce",
        "classificavel": True,
    },
    {
        "desastre": "mariana",
        "bacia": "doce",
        "titulo": "NUCARD - Acompanhamento dos Acordos de Reparação - Mariana",
        "data": "2025-02-06",
        "tipo": "Acompanhamento",
        "orgao": "MPMG - NUCARD",
        "esfera": "estadual",
        "uf": "MG",
        "tags": ["mpmg", "nucard", "mariana", "samarco", "fundão", "acordo"],
        "resumo": "Acompanhamento do cumprimento dos acordos de reparação relativos ao desastre de Mariana (2015), envolvendo Samarco, Vale e BHP. Monitoramento de obrigações pactuadas com as comunidades atingidas.",
        "url": "https://www.mpmg.mp.br/portal/menu/areas-de-atuacao/reparacao-por-desastres/",
        "fonteId": FONTE_ID,
        "coletadoEm": datetime.now(timezone.utc).isoformat(),
        "regiao_mg": "Rio Doce",
        "classificavel": True,
    },
    {
        "desastre": "brumadinho",
        "bacia": "paraopeba",
        "titulo": "NUCARD - Acompanhamento dos Acordos de Reparação - Brumadinho",
        "data": "2025-02-06",
        "tipo": "Acompanhamento",
        "orgao": "MPMG - NUCARD",
        "esfera": "estadual",
        "uf": "MG",
        "tags": ["mpmg", "nucard", "brumadinho", "vale", "paraopeba", "acordo"],
        "resumo": "Acompanhamento do cumprimento dos acordos de reparação relativos ao desastre de Brumadinho (2019), envolvendo Vale S.A. Monitoramento de obrigações pactuadas com as comunidades atingidas.",
        "url": "https://www.mpmg.mp.br/portal/menu/areas-de-atuacao/reparacao-por-desastres/",
        "fonteId": FONTE_ID,
        "coletadoEm": datetime.now(timezone.utc).isoformat(),
        "regiao_mg": "Paraopeba",
        "classificavel": True,
    },
    {
        "desastre": "mariana",
        "bacia": "doce",
        "titulo": "Atuação do MPMG na Reparação por Desastres - Visão Geral",
        "data": "2025-02-06",
        "tipo": "Publicação",
        "orgao": "MPMG",
        "esfera": "estadual",
        "uf": "MG",
        "tags": ["mpmg", "nucard", "reparação", "desastres", "visão-geral"],
        "resumo": "O MPMG, atento à sua missão constitucional de defesa da ordem jurídica, do regime democrático e dos interesses sociais e individuais indisponíveis, instituiu o NUCARD para assegurar a efetividade dos acordos celebrados com as empresas responsáveis.",
        "url": "https://www.mpmg.mp.br/portal/menu/areas-de-atuacao/reparacao-por-desastres/",
        "fonteId": FONTE_ID,
        "coletadoEm": datetime.now(timezone.utc).isoformat(),
        "regiao_mg": "MG",
        "classificavel": True,
    },
    {
        "desastre": "mariana",
        "bacia": "doce",
        "titulo": "Coordenação e Supervisão da Atuação Institucional - Reparações",
        "data": "2025-02-06",
        "tipo": "Acompanhamento",
        "orgao": "MPMG - NUCARD",
        "esfera": "estadual",
        "uf": "MG",
        "tags": ["mpmg", "nucard", "coordenação", "supervisão"],
        "resumo": "O NUCARD coordena e supervisiona a atuação institucional voltada à reparação integral dos danos socioambientais, articulando-se com Órgãos de execução, Centros de Apoio Operacional e Coordenadorias Temáticas.",
        "url": "https://www.mpmg.mp.br/portal/menu/areas-de-atuacao/reparacao-por-desastres/",
        "fonteId": FONTE_ID,
        "coletadoEm": datetime.now(timezone.utc).isoformat(),
        "regiao_mg": "MG",
        "classificavel": True,
    },
    {
        "desastre": "mariana",
        "bacia": "doce",
        "titulo": "Monitoramento das Obrigações Pactuadas - Acordos de Reparação",
        "data": "2025-02-06",
        "tipo": "Acompanhamento",
        "orgao": "MPMG - NUCARD",
        "esfera": "estadual",
        "uf": "MG",
        "tags": ["mpmg", "nucard", "monitoramento", "obrigações"],
        "resumo": "Atividades do NUCARD incluem monitoramento das obrigações pactuadas, interlocução com as comunidades atingidas, promoção de ações resolutivas e proposição de medidas administrativas e judiciais.",
        "url": "https://www.mpmg.mp.br/portal/menu/areas-de-atuacao/reparacao-por-desastres/",
        "fonteId": FONTE_ID,
        "coletadoEm": datetime.now(timezone.utc).isoformat(),
        "regiao_mg": "MG",
        "classificavel": True,
    },
    {
        "desastre": "mariana",
        "bacia": "doce",
        "titulo": "Integração entre Setores do MPMG - Reparações por Desastres",
        "data": "2025-02-06",
        "tipo": "Acompanhamento",
        "orgao": "MPMG - NUCARD",
        "esfera": "estadual",
        "uf": "MG",
        "tags": ["mpmg", "nucard", "integração", "setores"],
        "resumo": "O NUCARD promove a integração entre os diversos setores do MPMG e garante a transparência e a participação social no acompanhamento das ações de reparação.",
        "url": "https://www.mpmg.mp.br/portal/menu/areas-de-atuacao/reparacao-por-desastres/",
        "fonteId": FONTE_ID,
        "coletadoEm": datetime.now(timezone.utc).isoformat(),
        "regiao_mg": "MG",
        "classificavel": True,
    },
    {
        "desastre": "mariana",
        "bacia": "doce",
        "titulo": "Justiça Socioambiental e Prevenção - Compromisso Institucional",
        "data": "2025-02-06",
        "tipo": "Publicação",
        "orgao": "MPMG",
        "esfera": "estadual",
        "uf": "MG",
        "tags": ["mpmg", "nucard", "justiça-socioambiental", "prevenção"],
        "resumo": "Com o NUCARD, o MPMG reafirma seu compromisso com a justiça socioambiental, a defesa dos direitos das populações atingidas, a responsabilização dos causadores dos danos e a construção de soluções estruturantes para não repetição de tragédias.",
        "url": "https://www.mpmg.mp.br/portal/menu/areas-de-atuacao/reparacao-por-desastres/",
        "fonteId": FONTE_ID,
        "coletadoEm": datetime.now(timezone.utc).isoformat(),
        "regiao_mg": "MG",
        "classificavel": True,
    },
]


def main():
    saida = os.path.join(RAIZ, "apps", "web", "data", "mpmg-nucard.json")
    os.makedirs(os.path.dirname(saida), exist_ok=True)

    with open(saida, "w", encoding="utf-8") as f:
        json.dump(
            {
                "fonte": FONTE_ID,
                "itens": ITENS_NUCARD,
                "geradoEm": datetime.now(timezone.utc).isoformat(),
                "nota": "Dados baseados em informações públicas do NUCARD/MPMG (Resolução PGJ nº 6/2025). Para scraping real de Notas Técnicas, usar mpmg_notas_tecnicas.py com Playwright.",
            },
            f,
            ensure_ascii=False,
            indent=2,
        )

    print(f"Gerado: {len(ITENS_NUCARD)} itens em {saida}")


if __name__ == "__main__":
    main()
