#!/usr/bin/env python3
"""
gerar-camada-fazendas-engenhos.py — camada dos conjuntos rurais tombados de MG.

Fonte OFICIAL: IEPHA-MG (Instituto Estadual do Patrimônio Histórico e Artístico
de Minas Gerais), acervo já ingerido pelo portal em
`apps/web/data/patrimonio-tombado-iepha.json`. São os bens de classe
"Conjunto rural": fazendas históricas (e uma usina) tombadas com decreto ou
homologação — o que a fonte sustenta, com data e ato legal.

⚠️ O QUE A CAMADA **NÃO** É: não é o mapa das "principais fazendas e engenhos
de cana e de café" do estado. É o que está TOMBADO: 15 bens. Engenho de cana
propriamente dito não aparece no acervo do IEPHA — essa fonte (IPHAN/acervos
estaduais do Nordeste, atlas acadêmicos) fica para a Fase H do plano.

⚠️ O PONTO fica no centroide do MUNICÍPIO (o acervo dá município e distrito,
não coordenada do bem) — piso declarado na ficha.

Uso: python scripts/gerar-camada-fazendas-engenhos.py
"""
import json
import math
import re
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
ACERVO = RAIZ / "apps" / "web" / "data" / "patrimonio-tombado-iepha.json"
CENTROIDES = RAIZ / "apps" / "web" / "data" / "municipios-centroides.json"
SAIDA = RAIZ / "apps" / "web" / "public" / "terras" / "globo" / "dados" / "camadas" / "hist-fazendas-engenhos.geojson"


def slug(nome: str, uf: str = "MG") -> str:
    limpo = unicodedata.normalize("NFD", nome).encode("ascii", "ignore").decode().lower()
    return f"{re.sub(r'[^a-z0-9]', '', limpo)}_{uf.lower()}"


def jitter(chave: str) -> tuple[float, float]:
    h = abs(hash(chave)) if False else sum(ord(c) * (i + 1) for i, c in enumerate(chave))
    a = math.radians((h * 137) % 360)
    r = 0.012
    return (r * math.cos(a), r * math.sin(a))


acervo = json.loads(ACERVO.read_text(encoding="utf-8"))
rows = acervo if isinstance(acervo, list) else acervo.get("itens", [])
centroides = json.loads(CENTROIDES.read_text(encoding="utf-8"))

# Nome na FONTE -> município do IBGE. O IEPHA grafa "Santa Rita do Jacutinga";
# o IBGE oficial é "Santa Rita de Jacutinga". Casar por nome exige este
# dicionário — e o teste/registro deixa claro que foi conferido à mão.
ALIASES = {"santa rita do jacutinga": "Santa Rita de Jacutinga"}


def resolver_municipio(nome: str):
    direto = centroides.get(slug(nome))
    if direto:
        return direto
    alias = ALIASES.get(nome.strip().lower())
    return centroides.get(slug(alias)) if alias else None


features, sem_coord = [], []
for r in rows:
    sub = str(r.get("classeSubclasse") or "")
    if "rural" not in sub.lower():
        continue
    municipio = str(r.get("municipio") or "").strip()
    c = resolver_municipio(municipio)
    if not c:
        sem_coord.append(municipio)
        continue
    dl, dn = jitter(f"{r.get('denominacao')}|{municipio}")
    features.append({
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [round(c[1] + dn, 6), round(c[0] + dl, 6)]},
        "properties": {
            "denominacao": r.get("denominacao"),
            "municipio": municipio,
            "distrito": r.get("distrito"),
            "classe": sub,
            "categoria": r.get("categoria"),
            "ato_legal": r.get("atoLegal"),
            "fonte": "IEPHA-MG — Bens culturais tombados (conjuntos rurais)",
            "fonte_url": "http://www.iepha.mg.gov.br/",
            "natureza": "bem TOMBADO; ponto no centroide do município (piso)",
        },
    })

SAIDA.write_text(json.dumps({
    "type": "FeatureCollection",
    "_nota": (
        "Conjuntos rurais tombados pelo IEPHA-MG (fazendas históricas e uma usina). "
        "Não é o mapa das principais fazendas e engenhos do estado: é o que está "
        "tombado. Ponto no centroide do município, com dispersão determinística."
    ),
    "features": features,
}, ensure_ascii=False), encoding="utf-8")

print(f"conjuntos rurais tombados no mapa: {len(features)} de {len(rows)} bens | {SAIDA.stat().st_size/1024:.0f} KB")
print("sem coordenada no IBGE:", sem_coord)
