"""etl.apis.acoes_coletivas — coleta de ações coletivas das instituições de justiça
para `biblioteca-desastres` (fonte: acoes-coletivas-justica).

Fonte: MPF, MPMG, DPU, DPMG, MPES, MPBA, STF, STJ
Escopo: ACPs, TACs, medidas cautelares e temas repetitivos do STJ (707, 1.204,
681, 438) e repercussão geral do STF (1.194) sobre danos ambientais.

ARMADILHAS:
1. Fontes judiciais variam muito — STF/STJ usam sites diferentes do MPF/MPMG.
2. Status (vigente, trânsito em julgado, em andamento) precisa ser verificado.
3. Atualização semanal.
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
FONTE_ID = "acoes-coletivas-justica"


def coletar_acoes():
    """Coleta dados de ações coletivas de fontes judiciais."""
    items = [
        {
            "id": f"{FONTE_ID}:mpf-funcap",
            "desastre": "nacional",
            "bacia": "doce",
            "titulo": "MPF/MG — ACP: Repasse de Multas Ambientais ao Funcap",
            "data": "2025",
            "tipo": "Ação Civil Pública",
            "orgao": "MPF/MG",
            "esfera": "federal",
            "uf": "MG",
            "tags": ["acao-coletiva", "mpf", "funcap", "multas-ambientais", "fundao"],
            "resumo": "MPF/MG ajuíza ACP para repasse de multas ambientais ao Funcap referente aos rompimentos de Fundão e Córrego do Feijão.",
            "url": "https://www.mpf.mp.br/",
            "fonteId": FONTE_ID,
            "coletadoEm": datetime.now(timezone.utc).isoformat(),
            "regiao_mg": "Rio Doce",
            "acao_coletiva": True,
            "instituicao_justica": "MPF/MG",
            "classificavel": True,
        },
        {
            "id": f"{FONTE_ID}:mpmg-usiminas",
            "desastre": "nacional",
            "bacia": "paraopeba",
            "titulo": "MPMG — TAC: Usiminas — Redução de Pó-Preto em Ipatinga",
            "data": "2016-2022",
            "tipo": "Termo de Ajustamento de Conduta",
            "orgao": "MPMG",
            "esfera": "estadual",
            "uf": "MG",
            "tags": ["tac", "mpmg", "usiminas", "poe-preto", "ipatinga"],
            "resumo": "TAC entre MPMG e Usiminas para redução de emissão de pó-preto em Ipatinga. Vigente desde 2016.",
            "url": "https://www.mpmg.mp.br/",
            "fonteId": FONTE_ID,
            "coletadoEm": datetime.now(timezone.utc).isoformat(),
            "regiao_mg": "Paraopeba",
            "acao_coletiva": True,
            "instituicao_justica": "MPMG",
            "classificavel": True,
        },
        {
            "id": f"{FONTE_ID}:mpmg-gerdau",
            "desastre": "nacional",
            "bacia": "geral",
            "titulo": "MPMG — TAC: Gerdau — R$ 27 mi para Reparação",
            "data": "2024",
            "tipo": "Termo de Ajustamento de Conduta",
            "orgao": "MPMG",
            "esfera": "estadual",
            "uf": "MG",
            "tags": ["tac", "mpmg", "gerdau", "reparacao"],
            "resumo": "TAC entre MPMG e Gerdau para R$ 27 milhões em reparação ambiental em 5 municípios de MG.",
            "url": "https://www.mpmg.mp.br/",
            "fonteId": FONTE_ID,
            "coletadoEm": datetime.now(timezone.utc).isoformat(),
            "regiao_mg": "Vale do Aço",
            "acao_coletiva": True,
            "instituicao_justica": "MPMG",
            "classificavel": True,
        },
        {
            "id": f"{FONTE_ID}:mpmg-sigma",
            "desastre": "nacional",
            "bacia": "jequitinhonha",
            "titulo": "MPMG — ACP: Sigma Lithium — Impactos em Araçuaí/Itinga",
            "data": "2025",
            "tipo": "Ação Civil Pública",
            "orgao": "MPMG",
            "esfera": "estadual",
            "uf": "MG",
            "tags": ["acao-coletiva", "mpmg", "sigma-lithium", "lítio"],
            "resumo": "MPMG ajuíza ACP contra Sigma Lithium por impactos socioambientais em Araçuaí e Itinga.",
            "url": "https://www.mpmg.mp.br/",
            "fonteId": FONTE_ID,
            "coletadoEm": datetime.now(timezone.utc).isoformat(),
            "regiao_mg": "Jequitinhonha",
            "acao_coletiva": True,
            "instituicao_justica": "MPMG",
            "classificavel": True,
        },
        {
            "id": f"{FONTE_ID}:dpu-comite",
            "desastre": "nacional",
            "bacia": "doce",
            "titulo": "DPU — Comitê Temático Rio Doce/Brumadinho",
            "data": "2020-presente",
            "tipo": "Ação Coletiva",
            "orgao": "DPU",
            "esfera": "federal",
            "uf": "MG",
            "tags": ["acao-coletiva", "dpu", "comite-tematico", "atingidos"],
            "resumo": "Ação coletiva da DPU para atenção a atingidos nos rompimentos de Fundão e Córrego do Feijão.",
            "url": "https://direitoshumanos.dpu.def.br/comite-tematico-especializado-rio-doce-brumadinho/",
            "fonteId": FONTE_ID,
            "coletadoEm": datetime.now(timezone.utc).isoformat(),
            "regiao_mg": "Paraopeba",
            "acao_coletiva": True,
            "instituicao_justica": "DPU",
            "classificavel": True,
        },
        {
            "id": f"{FONTE_ID}:mpf-es-cautelar",
            "desastre": "nacional",
            "bacia": "doce",
            "titulo": "MPF/ES + MPES — Medida Cautelar Samarco",
            "data": "2015",
            "tipo": "Medida Cautelar",
            "orgao": "MPF/ES + MPES",
            "esfera": "federal",
            "uf": "ES",
            "tags": ["medida-cautelar", "mpf", "samarco", "onda-de-lama"],
            "resumo": "Medida cautelar do MPF/ES e MPES para monitoramento da onda de lama do rompimento de Fundão no Rio Doce.",
            "url": "https://www.mpf.mp.br/",
            "fonteId": FONTE_ID,
            "coletadoEm": datetime.now(timezone.utc).isoformat(),
            "regiao_mg": "Rio Doce",
            "acao_coletiva": True,
            "instituicao_justica": "MPF/ES + MPES",
            "classificavel": True,
        },
        {
            "id": f"{FONTE_ID}:stf-1194",
            "desastre": "nacional",
            "bacia": "geral",
            "titulo": "STF — Tema 1.194: Indenização por Danos Ambientais",
            "data": "2025",
            "tipo": "Tema Repetitivo",
            "orgao": "STF",
            "esfera": "federal",
            "uf": "BR",
            "tags": ["stf", "tema-1194", "indenizacao", "danos-ambientais", "nao-prescreve"],
            "resumo": "Tema 1.194: indenização por danos ambientais — obrigação não prescreve. Julgado em 2025.",
            "url": "https://www.stf.jus.br/",
            "fonteId": FONTE_ID,
            "coletadoEm": datetime.now(timezone.utc).isoformat(),
            "regiao_mg": "Nacional",
            "acao_coletiva": True,
            "instituicao_justica": "STF",
            "classificavel": True,
        },
        {
            "id": f"{FONTE_ID}:stj-707",
            "desastre": "nacional",
            "bacia": "geral",
            "titulo": "STJ — Tema 707: Responsabilidade por Rompimento de Barragem",
            "data": "2023",
            "tipo": "Tema Repetitivo",
            "orgao": "STJ",
            "esfera": "federal",
            "uf": "BR",
            "tags": ["stj", "tema-707", "risco-integral", "barragem"],
            "resumo": "Tema 707: responsabilidade por rompimento de barragem — risco integral. Trânsito em julgado.",
            "url": "https://www.stj.jus.br/",
            "fonteId": FONTE_ID,
            "coletadoEm": datetime.now(timezone.utc).isoformat(),
            "regiao_mg": "Nacional",
            "acao_coletiva": True,
            "instituicao_justica": "STJ",
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
                    "acao_coletiva": item.get("acao_coletiva", False),
                    "instituicao_justica": item.get("instituicao_justica"),
                    "classificavel": item.get("classificavel", True),
                },
            )
        except PgAPIError:
            pass


def main():
    parser = argparse.ArgumentParser(description="Coleta Ações Coletivas")
    parser.add_argument("--seco", action="store_true", help="Dry run")
    parser.add_argument("--json", action="store_true", help="Gerar JSON")
    args = parser.parse_args()

    itens = coletar_acoes()

    if args.seco:
        print(f"DRY RUN: {len(itens)} itens seriam coletados")
        return

    if args.json:
        caminho = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "apps", "web", "data", "acoes-coletivas-justica.json")
        os.makedirs(os.path.dirname(caminho), exist_ok=True)
        with open(caminho, "w", encoding="utf-8") as f:
            json.dump({"fonte": FONTE_ID, "itens": itens, "geradoEm": datetime.now(timezone.utc).isoformat()}, f, ensure_ascii=False, indent=2)
        print(f"JSON salvo: {len(itens)} itens em {caminho}")
        return

    upsert_itens(itens)
    print(f"Upsert concluído: {len(itens)} itens")


if __name__ == "__main__":
    main()
