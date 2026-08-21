#!/usr/bin/env python3
r"""gerar_camada_estudos_ambientais.py — transforma as audiências públicas de
EIA/RIMA que o portal já publica em `/ambiental/estudos` numa camada do globo:
UMA FEIÇÃO POR MUNICÍPIO, com a contagem de audiências e de estudos que dá
para abrir, mais o link para a lista filtrada daquele município.

Entrada:  etl/betim/dados/ambiental-estudos.json  (coletor ambiental_audiencias)
Saída:    dados/camadas/estudos-ambientais.geojson

═══ POR QUE POR MUNICÍPIO, E NÃO UM PONTO POR EMPREENDIMENTO ═══

Medido em 2026-08-20: das 305 audiências já coletadas, só **46 (15%)** casam
por número de processo com a camada de licenças do WFS (a única fonte com
coordenada). E a razão é estrutural, não de coleta: audiência acontece com o
processo EM ANÁLISE, e o WFS só publica o que já foi LICENCIADO. Ou seja, os
85% sem coordenada são exatamente os casos em que ainda dá para influenciar a
decisão — justamente os que não podem sumir do mapa.

Plotar só os 46 daria um mapa que parece completo e mostra um sexto do
assunto. Agregar por município mostra todos, e o ponto passa a significar o
que ele de fato é: "aqui há processo com estudo de impacto em audiência".

═══ CONTA E LINK, NUNCA TEOR (mesma regra de gerar_camada_documentos_municipio) ═══

A feição leva NÚMERO e LINK. Não leva nome de empreendimento, não leva CNPJ,
não leva o texto do estudo. Quem quiser o caso lê na página, que tem a lista,
a proveniência e o link para a fonte oficial ao lado.

═══ O AVISO QUE ESTA CAMADA CARREGA ═══

O Estado não hospeda o EIA/RIMA: publica link para nuvem de terceiro (Drive,
Dropbox, MEGA, OneDrive, site da consultoria). Por isso a feição separa
`audiencias` de `estudos_enumeraveis` — a diferença entre as duas é a medida
de quanto do acervo NÃO dá para abrir de forma automática.
"""
import io, json, os, sys
from collections import Counter, defaultdict

AQUI = os.path.dirname(os.path.abspath(__file__))
GLOBO = os.path.dirname(AQUI)
CAMADAS = os.path.join(GLOBO, "dados", "camadas")
MALHA = os.path.join(CAMADAS, "municipios-mg.geojson")
# GLOBO = apps/web/public/terras/globo -> sobe 5 niveis ate a raiz do repo
REPO = os.path.abspath(os.path.join(GLOBO, "..", "..", "..", "..", ".."))
DADOS = os.path.join(REPO, "etl", "betim", "dados", "ambiental-estudos.json")
SAIDA = os.path.join(CAMADAS, "estudos-ambientais.geojson")
BASE_APP = "/ambiental/estudos"


def centroide(geom):
    """Centroide simples do maior anel externo. Não precisa de shapely: o ponto
    aqui é 'onde fica esta cidade', não geometria de precisão — e a malha já é
    a oficial do IBGE."""
    aneis = []
    if geom["type"] == "Polygon":
        aneis = [geom["coordinates"][0]]
    elif geom["type"] == "MultiPolygon":
        aneis = [p[0] for p in geom["coordinates"]]
    if not aneis:
        return None
    maior = max(aneis, key=len)
    xs = [p[0] for p in maior]
    ys = [p[1] for p in maior]
    return [round(sum(xs) / len(xs), 6), round(sum(ys) / len(ys), 6)]


def main():
    dados = json.load(io.open(DADOS, encoding="utf-8"))
    malha = json.load(io.open(MALHA, encoding="utf-8"))
    por_geocodigo = {}
    for f in malha["features"]:
        p = f["properties"]
        c = centroide(f["geometry"])
        if c:
            por_geocodigo[p["geocodigo"]] = (p["nome"], c)

    agregado = defaultdict(lambda: {"audiencias": 0, "enumeraveis": 0,
                                    "classes": Counter(), "repos": Counter(),
                                    "ultima": None, "nao_resolvidos": 0})
    sem_municipio = 0
    for a in dados["audiencias"]:
        ids = a.get("municipios_ids") or []
        if not ids:
            sem_municipio += 1
            continue
        docs = a.get("documentos") or []
        for gid in ids:
            alvo = agregado[gid]
            alvo["audiencias"] += 1
            alvo["enumeraveis"] += len(docs)
            for d in docs:
                alvo["classes"][d.get("classe_estudo") or "outro"] += 1
            for t in (a.get("repositorio_tipos") or ["ausente"]):
                alvo["repos"][t] += 1
            data = a.get("data_publicacao")
            if data and (alvo["ultima"] is None or _chave_data(data) > _chave_data(alvo["ultima"])):
                alvo["ultima"] = data

    feicoes = []
    for gid, v in sorted(agregado.items()):
        if gid not in por_geocodigo:
            continue
        nome, coord = por_geocodigo[gid]
        feicoes.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": coord},
            "properties": {
                "municipio": nome,
                "geocodigo": gid,
                "audiencias": v["audiencias"],
                "estudos_enumeraveis": v["enumeraveis"],
                "eia": v["classes"].get("eia", 0),
                "rima": v["classes"].get("rima", 0),
                "ultima_publicacao": v["ultima"],
                "link_estudos": "%s?municipio=%s" % (BASE_APP, nome),
                "link_fonte_oficial": dados["fonte"],
            },
        })

    saida = {"type": "FeatureCollection", "features": feicoes}
    io.open(SAIDA, "w", encoding="utf-8").write(json.dumps(saida, ensure_ascii=False))
    print("gravado %s" % SAIDA)
    print("  municipios com audiencia: %d" % len(feicoes))
    print("  audiencias sem municipio resolvido (fora do mapa): %d" % sem_municipio)
    print("  bytes: %d" % os.path.getsize(SAIDA))


def _chave_data(d):
    partes = (d or "").split("/")
    return tuple(reversed(partes)) if len(partes) == 3 else ("0000",)


if __name__ == "__main__":
    sys.exit(main())
