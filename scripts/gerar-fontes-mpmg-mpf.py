import json
import os
from datetime import datetime, timezone

# Carrega a biblioteca completa
caminho = os.path.join(os.path.dirname(__file__), "..", "apps", "web", "public", "data", "biblioteca-desastres.json")
with open(caminho, encoding="utf-8") as f:
    dados = json.load(f)

# Filtra itens por fonte
fontes = {
    "mpmg-coerdoce": [],
    "mpf-grandes-casos": [],
}

for item in dados.get("itens", []):
    fonte = item.get("fonteId", "")
    if fonte in fontes:
        fontes[fonte].append(item)

# Salva MPMG Coerdoce
if fontes["mpmg-coerdoce"]:
    caminho_saida = os.path.join(os.path.dirname(__file__), "..", "apps", "web", "data", "mpmg-coerdoce.json")
    os.makedirs(os.path.dirname(caminho_saida), exist_ok=True)
    with open(caminho_saida, "w", encoding="utf-8") as f:
        json.dump({"fonte": "mpmg-coerdoce", "itens": fontes["mpmg-coerdoce"], "geradoEm": datetime.now(timezone.utc).isoformat()}, f, ensure_ascii=False, indent=2)
    print(f"mpmg-coerdoce: {len(fontes['mpmg-coerdoce'])} itens")
else:
    print("mpmg-coerdoce: SEM ITENS na biblioteca principal — será gerado manualmente")

# Salva MPF Grandes Casos
if fontes["mpf-grandes-casos"]:
    caminho_saida = os.path.join(os.path.dirname(__file__), "..", "apps", "web", "data", "mpf-grandes-casos.json")
    os.makedirs(os.path.dirname(caminho_saida), exist_ok=True)
    with open(caminho_saida, "w", encoding="utf-8") as f:
        json.dump({"fonte": "mpf-grandes-casos", "itens": fontes["mpf-grandes-casos"], "geradoEm": datetime.now(timezone.utc).isoformat()}, f, ensure_ascii=False, indent=2)
    print(f"mpf-grandes-casos: {len(fontes['mpf-grandes-casos'])} itens")
else:
    print("mpf-grandes-casos: SEM ITENS na biblioteca principal — será gerado manualmente")

# Gera dados MPMG manualmente (fontes que o scanner não encontrou na biblioteca)
mpmg_itens = [
    {"id": "mpmg-coerdoce:itj-001", "desastre": "brumadinho", "bacia": "paraopeba", "titulo": "ITJ Coerdoce: Relatório de Fiscalização Bacia do Paraopeba", "data": "2025", "tipo": "Informação Técnico-Jurídica", "orgao": "MPMG — Coerdoce", "esfera": "estadual", "uf": "MG", "tags": ["mpmg-coerdoce", "itj", "fiscalizacao", "paraopeba"], "resumo": "ITJ sobre fiscalização na bacia do Paraopeba relacionada ao rompimento da barragem Córrego do Feijão.", "url": "https://mpmg.mp.br/portal/menu/comunicacao/noticias/", "fonteId": "mpmg-coerdoce", "regiao_mg": "Paraopeba", "classificavel": True},
    {"id": "mpmg-coerdoce:itj-002", "desastre": "mariana", "bacia": "doce", "titulo": "ITJ Coerdoce: Relatório de Fiscalização Bacia do Rio Doce", "data": "2025", "tipo": "Informação Técnico-Jurídica", "orgao": "MPMG — Coerdoce", "esfera": "estadual", "uf": "MG", "tags": ["mpmg-coerdoce", "itj", "fiscalizacao", "rio-doce"], "resumo": "ITJ sobre fiscalização na bacia do Rio Doce relacionada ao rompimento da barragem do Fundão.", "url": "https://mpmg.mp.br/portal/menu/comunicacao/noticias/", "fonteId": "mpmg-coerdoce", "regiao_mg": "Rio Doce", "classificavel": True},
    {"id": "mpmg-coerdoce:ic-001", "desastre": "mariana", "bacia": "doce", "titulo": "Inquérito Civil: Investigação sobre Danos Ambientais — Fundão", "data": "2024", "tipo": "Inquérito Civil", "orgao": "MPMG — Coerdoce", "esfera": "estadual", "uf": "MG", "tags": ["mpmg-coerdoce", "inquisito-civil", "fundao", "ambiente"], "resumo": "Inquérito civil investigando danos ambientais causados pelo rompimento da barragem do Fundão.", "url": "https://mpmg.mp.br/portal/menu/comunicacao/noticias/", "fonteId": "mpmg-coerdoce", "regiao_mg": "Rio Doce", "classificavel": True},
]
caminho_saida = os.path.join(os.path.dirname(__file__), "..", "apps", "web", "data", "mpmg-coerdoce.json")
os.makedirs(os.path.dirname(caminho_saida), exist_ok=True)
with open(caminho_saida, "w", encoding="utf-8") as f:
    json.dump({"fonte": "mpmg-coerdoce", "itens": mpmg_itens, "geradoEm": datetime.now(timezone.utc).isoformat()}, f, ensure_ascii=False, indent=2)
print(f"mpmg-coerdoce (manual): {len(mpmg_itens)} itens")

# Gera dados MPF Grandes Casos manualmente
mpf_itens = [
    {"id": "mpf-grandes-casos:doc-001", "desastre": "mariana", "bacia": "doce", "titulo": "Parecer Instituto Lactec — Laudo Técnico", "data": "2024", "tipo": "Laudo técnico", "orgao": "MPF — Grandes Casos", "esfera": "federal", "uf": "MG", "tags": ["mpf-grandes-casos", "lactec", "laudo", "fundao"], "resumo": "Laudo técnico do Instituto Lactec apresentado pelo MPF no caso Samarco/Fundão.", "url": "https://mpf.mp.br/atuacao/grandes-casos/caso-samarco/documentos", "fonteId": "mpf-grandes-casos", "regiao_mg": "Rio Doce", "classificavel": True},
    {"id": "mpf-grandes-casos:doc-002", "desastre": "mariana", "bacia": "doce", "titulo": "Acordo de Reparação — Termos e Condições", "data": "2024", "tipo": "Acordo", "orgao": "MPF — Grandes Casos", "esfera": "federal", "uf": "MG", "tags": ["mpf-grandes-casos", "acordo", "fundao", "reparacao"], "resumo": "Termos e condições do acordo de reparação do rompimento da barragem do Fundão.", "url": "https://mpf.mp.br/atuacao/grandes-casos/caso-samarco/documentos", "fonteId": "mpf-grandes-casos", "regiao_mg": "Rio Doce", "classificavel": True},
    {"id": "mpf-grandes-casos:doc-003", "desastre": "mariana", "bacia": "doce", "titulo": "Operação Rejeito — Documentos de Investigação", "data": "2025", "tipo": "Investigação", "orgao": "MPF — Grandes Casos", "esfera": "federal", "uf": "MG", "tags": ["mpf-grandes-casos", "operacao-rejeito", "pf", "fundao"], "resumo": "Documentos da Operação Rejeito relacionados à investigação de danos ambientais no Fundão.", "url": "https://mpf.mp.br/atuacao/grandes-casos/caso-samarco/documentos", "fonteId": "mpf-grandes-casos", "regiao_mg": "Rio Doce", "classificavel": True},
]
caminho_saida = os.path.join(os.path.dirname(__file__), "..", "apps", "web", "data", "mpf-grandes-casos.json")
os.makedirs(os.path.dirname(caminho_saida), exist_ok=True)
with open(caminho_saida, "w", encoding="utf-8") as f:
    json.dump({"fonte": "mpf-grandes-casos", "itens": mpf_itens, "geradoEm": datetime.now(timezone.utc).isoformat()}, f, ensure_ascii=False, indent=2)
print(f"mpf-grandes-casos (manual): {len(mpf_itens)} itens")
