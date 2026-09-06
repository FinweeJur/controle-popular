"""Gera mapeamento municipio_sem_acento → IBGE7 a partir de dois arquivos:
- risco-climatico.json (IBGE7)
- comunicabr-31.json (IBGE6 + nome)

Saída: apps/web/data/mapeamento_municipios.csv (delimiter '|')
"""
import csv
import json
import os
import unicodedata

def sem_acento(s: str) -> str:
    nfd = unicodedata.normalize("NFD", s)
    return "".join(c for c in nfd if unicodedata.category(c) != "Mn")

def normalizar_nome(nome: str) -> str:
    """Ex: 'Belo Horizonte/MG' → 'belo horizonte'"""
    nome = sem_acento(nome)
    nome = nome.replace("/MG", "").strip()
    return nome.lower()

raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
public = os.path.join(raiz, "apps", "web", "public", "data")

with open(os.path.join(public, "risco-climatico.json"), encoding="utf-8") as f:
    risco = json.load(f)
with open(os.path.join(public, "comunicabr-31.json"), encoding="utf-8") as f:
    comunica = json.load(f)

# IBGE7 → prefixo6
por_prefixo = {}
for l in risco["linhas"]:
    c7 = str(l["id_municipio"])
    if len(c7) == 7:
        por_prefixo[c7[:6]] = c7

# Construir mapeamento
mapeamento = []
for m in comunica["municipios"]:
    ibge6 = str(m["cod"])
    ibge7 = por_prefixo.get(ibge6)
    if not ibge7:
        continue
    nome = m["nome"].replace("/MG", "")
    chave = normalizar_nome(m["nome"])
    mapeamento.append((chave, ibge7, nome))

mapeamento.sort(key=lambda x: x[0])

out_path = os.path.join(raiz, "apps", "web", "data", "mapeamento_municipios.csv")
with open(out_path, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f, delimiter="|")
    w.writerow(["municipio_sem_acento", "ibge7", "nome_oficial"])
    for chave, ibge7, nome in mapeamento:
        w.writerow([chave, ibge7, nome])

print(f"Gerado: {len(mapeamento)} municipios em {out_path}")
