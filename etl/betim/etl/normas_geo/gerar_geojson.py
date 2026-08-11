r"""etl.normas_geo.gerar_geojson — junta `atos_oficiais_geo` (geocodificada)
com `atos_oficiais` e escreve o GeoJSON estático da camada
`normas-geolocalizadas`, consumido por
`apps/web/public/terras/globo/js/data/api.js` como as outras camadas
pré-geradas.

    python -m etl.normas_geo.gerar_geojson

═══ `feature_index` ═══

O globo abre uma feature específica por posição no array
(`#area=<camada>:<índice>`, `js/main.js`), não por id estável. O link "Ver
no mapa" da página da norma (`/[municipio]/camara/legislacao`) precisa saber
ANTES do build estático qual índice o ato vai ocupar -- por isso este script
grava `feature_index` de volta em `atos_oficiais_geo`, na MESMA rodada que
escreve o arquivo. Os dois nunca podem dessincronizar: se este script rodar
de novo e a ORDEM mudar (ex.: novo ato geocodificado no meio da lista
ordenada por data), os links antigos ficam errados -- por isso a ordem é
por `data_publicacao desc, ato_id` (chave estável), não por `created_at` de
quando a geocodificação aconteceu.

Só entram linhas com `lat is not null`: sem coordenada, não tem o que
desenhar -- e SEM PALPITE (a linha continua em `atos_oficiais_geo`, só não
vira ponto no mapa).
"""
import argparse
import json
import sys
from pathlib import Path

from etl.normas_geo._db import conectar

_SAIDA = (
    Path(__file__).resolve().parents[4]
    / "apps" / "web" / "public" / "terras" / "globo" / "dados" / "camadas"
    / "normas-geolocalizadas.geojson"
)


def _formatar_data(d) -> str | None:
    return d.isoformat() if d else None


def rodar() -> None:
    conn = conectar()
    with conn.cursor() as cur:
        cur.execute(
            """
            select g.ato_id, g.tipo_local, g.texto_extraido, g.confianca,
                   g.lat, g.lng,
                   a.tipo, a.numero, a.ano, a.ementa, a.data_publicacao, a.link_fonte,
                   m.nome as municipio
            from atos_oficiais_geo g
            join atos_oficiais a on a.id = g.ato_id
            join municipios m on m.id_municipio = a.id_municipio
            where g.lat is not null and g.lng is not null
            order by a.data_publicacao desc nulls last, a.id
            """
        )
        linhas = cur.fetchall()

    if not linhas:
        print("[normas_geo.gerar_geojson] nenhuma linha geocodificada ainda -- "
              "rode etl.normas_geo.geocodificar primeiro.", file=sys.stderr)
        sys.exit(1)

    features = []
    atualizacoes = []  # (feature_index, ato_id)
    por_confianca = {"alta": 0, "media": 0}
    por_municipio: dict[str, int] = {}
    for idx, linha in enumerate(linhas):
        tipo = linha["tipo"] or "Ato"
        numero = linha["numero"] or "s/n"
        ano = linha["ano"]
        nome_norma = f"{tipo} nº {numero}" + (f"/{ano}" if ano else "")
        features.append({
            "type": "Feature",
            "properties": {
                "nome": nome_norma,
                "municipio": linha["municipio"],
                "tipo": tipo,
                "numero": numero,
                "ano": ano,
                "data_publicacao": _formatar_data(linha["data_publicacao"]),
                "ementa": linha["ementa"],
                "endereco_extraido": linha["texto_extraido"],
                "confianca": linha["confianca"],
                "link_fonte": linha["link_fonte"],
                "ponto_lat": linha["lat"],
                "ponto_lon": linha["lng"],
            },
            "geometry": {"type": "Point", "coordinates": [linha["lng"], linha["lat"]]},
        })
        atualizacoes.append((idx, linha["ato_id"]))
        por_confianca[linha["confianca"]] = por_confianca.get(linha["confianca"], 0) + 1
        por_municipio[linha["municipio"]] = por_municipio.get(linha["municipio"], 0) + 1

    fc = {"type": "FeatureCollection", "name": "normas-geolocalizadas", "features": features}
    _SAIDA.parent.mkdir(parents=True, exist_ok=True)
    _SAIDA.write_text(json.dumps(fc, ensure_ascii=False, separators=(",", ": ")), encoding="utf-8")

    conn = conectar()
    with conn.cursor() as cur:
        for idx, ato_id in atualizacoes:
            cur.execute(
                "update atos_oficiais_geo set feature_index = %s where ato_id = %s",
                (idx, ato_id),
            )

    print(f"[normas_geo.gerar_geojson] {len(features)} features escritas em {_SAIDA}")
    print(f"  confianca: alta={por_confianca.get('alta', 0)} media={por_confianca.get('media', 0)}")
    for muni, n in sorted(por_municipio.items()):
        print(f"  {muni}: {n}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.parse_args()
    try:
        rodar()
    except Exception as e:  # noqa: BLE001
        print(f"[normas_geo.gerar_geojson] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
