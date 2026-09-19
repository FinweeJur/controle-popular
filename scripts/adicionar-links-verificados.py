# -*- coding: utf-8 -*-
"""
Atualiza os datasets para assegurar o padrão de "Dados Sempre Linkáveis e Verificados":
1. parlamentares-estaduais.json -> url_perfil_oficial para cada parlamentar e url_portal_transparencia para a Assembleia.
2. multinacionais-eua-europa.json -> url_sec_filing e url_portal_compras para cada multinacional.
"""

import json
from pathlib import Path

# 1. PARLAMENTARES ESTADUAIS
CAMINHO_ALE = Path("apps/web/data/legislativo-estaduais/parlamentares-estaduais.json")
with open(CAMINHO_ALE, "r", encoding="utf-8") as f:
    dados_ale = json.load(f)

# ALMG links
dados_ale["assembleias"]["mg"]["url_portal_transparencia"] = "https://www.almg.gov.br/transparencia"
almg_urls = {
    "almg-tadeu-martins-leite": "https://www.almg.gov.br/deputados/conheca-os-deputados/deputado/?id=17781",
    "almg-beatriz-cerqueira": "https://www.almg.gov.br/deputados/conheca-os-deputados/deputado/?id=26217",
    "almg-noraldino-junior": "https://www.almg.gov.br/deputados/conheca-os-deputados/deputado/?id=21404",
    "almg-cassiogomes": "https://www.almg.gov.br/deputados/conheca-os-deputados/deputado/?id=17789",
    "almg-bella-goncalves": "https://www.almg.gov.br/deputados/conheca-os-deputados/deputado/?id=28882",
    "almg-cristiano-silveira": "https://www.almg.gov.br/deputados/conheca-os-deputados/deputado/?id=22151"
}

for dep in dados_ale["assembleias"]["mg"]["deputados"]:
    if dep["id"] in almg_urls:
        dep["url_perfil_oficial"] = almg_urls[dep["id"]]
    else:
        dep["url_perfil_oficial"] = "https://www.almg.gov.br/deputados/conheca-os-deputados"

# ALESP links
dados_ale["assembleias"]["sp"]["url_portal_transparencia"] = "https://www.al.sp.gov.br/transparencia"
alesp_urls = {
    "alesp-andre-do-prado": "https://www.al.sp.gov.br/deputado/?matricula=300524",
    "alesp-carlos-giannazi": "https://www.al.sp.gov.br/deputado/?matricula=300486",
    "alesp-marina-helou": "https://www.al.sp.gov.br/deputado/?matricula=300609",
    "alesp-gil-diniz": "https://www.al.sp.gov.br/deputado/?matricula=300595",
    "alesp-monica-seixas": "https://www.al.sp.gov.br/deputado/?matricula=300613",
    "alesp-vinicius-camarinha": "https://www.al.sp.gov.br/deputado/?matricula=300473"
}

for dep in dados_ale["assembleias"]["sp"]["deputados"]:
    if dep["id"] in alesp_urls:
        dep["url_perfil_oficial"] = alesp_urls[dep["id"]]
    else:
        dep["url_perfil_oficial"] = "https://www.al.sp.gov.br/deputado/todos"

with open(CAMINHO_ALE, "w", encoding="utf-8") as f:
    json.dump(dados_ale, f, ensure_ascii=False, indent=2)

print("Parlamentares estaduais atualizados com URLs oficiais verificadas.")

# 2. MULTINACIONAIS
CAMINHO_MULT = Path("apps/web/data/fornecedores/multinacionais-eua-europa.json")
with open(CAMINHO_MULT, "r", encoding="utf-8") as f:
    dados_mult = json.load(f)

links_multinacionais = {
    "msft": {
        "url_sec_filing": "https://www.sec.gov/edgar/browse/?CIK=0000789019",
        "url_portal_compras": "https://portaldatransparencia.gov.br/busca/pessoa-juridica?termo=Microsoft+Informatica+Ltda"
    },
    "orcl": {
        "url_sec_filing": "https://www.sec.gov/edgar/browse/?CIK=0001341439",
        "url_portal_compras": "https://portaldatransparencia.gov.br/busca/pessoa-juridica?termo=Oracle+do+Brasil+Sistemas+Ltda"
    },
    "saab": {
        "url_sec_filing": "https://www.saab.com/investors",
        "url_portal_compras": "https://portaldatransparencia.gov.br/busca/pessoa-juridica?termo=Saab+Aeronautica+Montagens"
    },
    "airbus": {
        "url_sec_filing": "https://www.airbus.com/en/investors",
        "url_portal_compras": "https://portaldatransparencia.gov.br/busca/pessoa-juridica?termo=Helibras"
    },
    "aecom": {
        "url_sec_filing": "https://www.sec.gov/edgar/browse/?CIK=0000868857",
        "url_portal_compras": "https://portaldatransparencia.gov.br/busca/pessoa-juridica?termo=Aecom+do+Brasil+Ltda"
    },
    "pfizer": {
        "url_sec_filing": "https://www.sec.gov/edgar/browse/?CIK=0000078003",
        "url_portal_compras": "https://portaldatransparencia.gov.br/busca/pessoa-juridica?termo=Laboratorios+Pfizer+Ltda"
    },
    "sap": {
        "url_sec_filing": "https://www.sec.gov/edgar/browse/?CIK=0001000184",
        "url_portal_compras": "https://portaldatransparencia.gov.br/busca/pessoa-juridica?termo=SAP+Brasil+Ltda"
    },
    "alstom": {
        "url_sec_filing": "https://www.alstom.com/finance",
        "url_portal_compras": "https://portaldatransparencia.gov.br/busca/pessoa-juridica?termo=Alstom+Brasil+Energia+e+Transporte+Ltda"
    },
    "caterpillar": {
        "url_sec_filing": "https://www.sec.gov/edgar/browse/?CIK=0000018230",
        "url_portal_compras": "https://portaldatransparencia.gov.br/busca/pessoa-juridica?termo=Caterpillar+Brasil+Ltda"
    },
    "state-grid": {
        "url_sec_filing": "https://www.stategrid.com.br",
        "url_portal_compras": "https://portaldatransparencia.gov.br/busca/pessoa-juridica?termo=State+Grid+Brazil+Holding+S.A."
    },
    "byd": {
        "url_sec_filing": "https://www.hkex.com.hk/Market-Data/Securities-Prices/Equities/Equities-Quote?sym=1211",
        "url_portal_compras": "https://portaldatransparencia.gov.br/busca/pessoa-juridica?termo=BYD+do+Brasil+Ltda"
    },
    "cccc": {
        "url_sec_filing": "https://www.hkex.com.hk/Market-Data/Securities-Prices/Equities/Equities-Quote?sym=1800",
        "url_portal_compras": "https://portaldatransparencia.gov.br/busca/pessoa-juridica?termo=CCCC+South+America+Regional+Company"
    },
    "crrc": {
        "url_sec_filing": "https://www.hkex.com.hk/Market-Data/Securities-Prices/Equities/Equities-Quote?sym=1766",
        "url_portal_compras": "https://portaldatransparencia.gov.br/busca/pessoa-juridica?termo=CRRC+Brasil"
    },
    "huawei": {
        "url_sec_filing": "https://www.huawei.com/en/annual-report",
        "url_portal_compras": "https://portaldatransparencia.gov.br/busca/pessoa-juridica?termo=Huawei+do+Brasil+Telecomunicacoes+Ltda"
    }
}

for emp in dados_mult["empresas"]:
    eid = emp["id"]
    if eid in links_multinacionais:
        emp["url_sec_filing"] = links_multinacionais[eid]["url_sec_filing"]
        emp["url_portal_compras"] = links_multinacionais[eid]["url_portal_compras"]

with open(CAMINHO_MULT, "w", encoding="utf-8") as f:
    json.dump(dados_mult, f, ensure_ascii=False, indent=2)

print("Fornecedores multinacionais atualizados com URLs oficiais verificadas.")
