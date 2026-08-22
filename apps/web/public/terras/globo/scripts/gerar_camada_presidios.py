#!/usr/bin/env python3
r"""gerar_camada_presidios.py — transforma o que JÁ ESTÁ PUBLICADO em
`/judiciario/presidios` numa camada do globo: um ponto por estabelecimento
penal de Minas Gerais, com o RAMO da Justiça que responde por ele e a
CONTAGEM de inspeções judiciais recebidas.

Saída: dados/camadas/presidios-mg.geojson

═══ CONTA, NUNCA TEOR — E AQUI NEM TEOR EXISTE ═══

O GeoJSON leva `nome`, `ramo`, `inspecoes` e `natureza`. Não leva nada sobre
o que foi encontrado dentro do estabelecimento, e a razão é dupla:

1. A regra da casa, a mesma de `gerar_camada_documentos_municipio.py`: juntar
   teor sensível a um PINO NO MAPA aumenta a capacidade de re-identificação
   mais do que o mesmo teor solto numa lista.
2. **Esse teor nem é público.** As rotas de conteúdo da inspeção
   (`/relatorio-inspecao/{id}`, `/respostas-formulario/{id}`) respondem 404 no
   CNJ. Publica-se QUE houve inspeção e SOBRE QUE TEMA — nunca o achado.

E **nenhum nome de pessoa presa entra**, em hipótese alguma. O dado de origem
não traz, e conferido campo a campo: `estabelecimentos` só tem identificação da
unidade, endereço institucional e telefone. Nem o endereço entra aqui.

═══ ⚠️ A COORDENADA NÃO É A POSIÇÃO DO PRESÍDIO, E ISSO VAI NO DADO ═══

O CNIEP declara a procedência de cada ponto no campo `origem_coord`, e nenhuma
das duas espécies é levantamento em campo:

  - **225 são `ggmap`** — geocodificadas a partir do endereço. Erram o que o
    geocodificador errar.
  - **7 são `centroid`** — o centro do MUNICÍPIO, não do estabelecimento. Num
    município grande isso põe o pino a dezenas de quilômetros do lugar.

Cada feição carrega `origem_coord`, e a camada declara os dois números. Um mapa
que mostra pino sem dizer isso afirma precisão que não tem.

═══ ⚠️ E FALTAM 53 DOS 285 ═══

Só **232 dos 285** estabelecimentos de MG têm coordenada publicada. Os 53
restantes existem, são inspecionados (ou não), e **não aparecem no mapa**.

Mapa com buraco parece mapa completo. Por isso a contagem de ausentes vai no
`hint` da camada e no próprio GeoJSON — e quem quiser a lista inteira vai para
`/judiciario/presidios`, que tem os 285.

═══ A BASE É A JÁ PUBLICADA ═══

Entrada única: `etl/betim/dados/cniep-presidios-mg.json`, o mesmo arquivo que
alimenta `/judiciario/presidios`. Nenhuma contagem é digitada à mão.
"""
import io
import json
import os
import sys
from collections import Counter

AQUI = os.path.dirname(os.path.abspath(__file__))
GLOBO = os.path.dirname(AQUI)
RAIZ = os.path.abspath(os.path.join(GLOBO, "..", "..", "..", "..", ".."))
ENTRADA = os.path.join(RAIZ, "etl", "betim", "dados", "cniep-presidios-mg.json")
SAIDA = os.path.join(GLOBO, "dados", "camadas", "presidios-mg.geojson")

# Data de corte: inspeção agendada para depois disto não conta como realizada.
HOJE = "2026-08-22"
# Caixa de Minas Gerais, com folga. Ponto fora daqui é erro de coordenada
# (lat/lon trocados, zero virando campo vazio) e o script PARA.
CAIXA = (-23.5, -13.9, -51.5, -39.5)  # lat_min, lat_max, lon_min, lon_max


def ramo_de(tribunal):
    """Justiça comum × militar estadual × militar federal.

    ⚠️ ESSA SEPARAÇÃO É O ACHADO, não um detalhe de rótulo. No bolo, 56 dos 285
    não receberam inspeção — 20%, que sozinho sugere descaso generalizado.
    Separando: a Justiça comum cobre 213 de 217 e o buraco inteiro está na
    Justiça Militar. Pintar tudo da mesma cor no mapa desfaria isso.
    """
    if "Superior Tribunal Militar" in tribunal:
        return "militar-federal"
    if "Militar" in tribunal:
        return "militar-estadual"
    return "comum"


def main():
    d = json.load(io.open(ENTRADA, encoding="utf-8"))
    est = {e["seq_estabelecimento"]: e for e in d["estabelecimentos_mg"]}
    mapa = d["mapa_mg"]

    inspecoes = Counter(
        x["seq_estabelecimento"] for x in d["inspecoes_mg"]
        if (x.get("data_inicio") or "")[:10] <= HOJE)

    feicoes, fora_da_caixa, sem_par = [], [], 0
    for m in mapa:
        seq = m["seq_estabelecimento"]
        e = est.get(seq)
        if not e:
            sem_par += 1
            continue
        try:
            lat, lon = float(m["lat"]), float(m["lon"])
        except (TypeError, ValueError):
            sem_par += 1
            continue
        if not (CAIXA[0] < lat < CAIXA[1] and CAIXA[2] < lon < CAIXA[3]):
            fora_da_caixa.append((e.get("dsc_identificacao"), lat, lon))
            continue
        nat = e.get("naturezas") or []
        feicoes.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": {
                "id": seq,
                "nome": (e.get("dsc_identificacao") or e.get("dsc_apelido") or "—").strip(),
                "cidade": m.get("dsc_cidade"),
                "ramo": ramo_de(e.get("dsc_tribunal") or ""),
                "tribunal": e.get("dsc_tribunal"),
                "natureza": nat[0] if nat and isinstance(nat[0], str) else None,
                "inspecoes": inspecoes.get(seq, 0),
                # ⚠️ VIAJA COM A FEIÇÃO, não só no cabeçalho: quem lê uma
                # feição isolada precisa saber que o pino não foi medido.
                "origem_coord": m.get("origem_coord"),
            },
        })

    if fora_da_caixa:
        raise SystemExit(
            "PARE: %d ponto(s) fora da caixa de Minas Gerais — é lat/lon "
            "trocado ou campo vazio virando zero, não é presídio no mar.\n  %s"
            % (len(fora_da_caixa), fora_da_caixa[:5]))

    por_ramo = Counter(f["properties"]["ramo"] for f in feicoes)
    por_origem = Counter(f["properties"]["origem_coord"] for f in feicoes)
    sem_inspecao = sum(1 for f in feicoes if f["properties"]["inspecoes"] == 0)
    ausentes = len(est) - len(feicoes)

    saida = {
        "type": "FeatureCollection",
        "metadata": {
            "fonte": "CNIEP / Geopresídios — Conselho Nacional de Justiça",
            "url": "https://geopresidios.cnj.jus.br",
            "pagina": "/judiciario/presidios",
            "extraidoEm": HOJE,
            "estabelecimentosNoDado": len(est),
            "comCoordenada": len(feicoes),
            "semCoordenada": ausentes,
            "porRamo": dict(por_ramo),
            "porOrigemDaCoordenada": dict(por_origem),
            "semInspecaoNoMapa": sem_inspecao,
            "avisoCoordenada": (
                "Nenhuma coordenada é levantamento em campo: %d vêm de "
                "geocodificação do endereço (`ggmap`) e %d são o centro do "
                "MUNICÍPIO (`centroid`), não do estabelecimento."
                % (por_origem.get("ggmap", 0), por_origem.get("centroid", 0))
            ),
            "coberturaPorRamo": {
                r: {
                    "noDado": sum(1 for e in est.values()
                                  if ramo_de(e.get("dsc_tribunal") or "") == r),
                    "noMapa": por_ramo.get(r, 0),
                }
                for r in ("comum", "militar-estadual", "militar-federal")
            },
            "avisoCobertura": (
                "%d dos %d estabelecimentos de MG não têm coordenada publicada "
                "e NÃO aparecem no mapa. Ausência de pino não é ausência de "
                "presídio — a lista completa está em /judiciario/presidios."
                % (ausentes, len(est))
            ),
            "avisoVies": (
                "⚠️ A FALTA DE COORDENADA NÃO É PAREJA ENTRE OS RAMOS, e isso "
                "distorce a leitura do mapa. Das 50 unidades da Justiça Militar "
                "estadual, só 1 tem coordenada; das 18 do Superior Tribunal "
                "Militar, todas as 18 têm. Como o STM não inspecionou nenhuma "
                "das suas, o mapa mostra 18 pinos militares federais sem "
                "inspeção e quase nenhum militar estadual — sugerindo que o "
                "problema é só federal. No dado completo, 34 das 50 estaduais "
                "também estão sem inspeção. O mapa é recorte do que tem "
                "coordenada, não do que existe."
            ),
            "avisoConteudo": (
                "A camada mostra QUE houve inspeção e quantas. O relato do que "
                "o juiz encontrou não é público por esta via (404 nas rotas de "
                "conteúdo do CNJ)."
            ),
        },
        "features": feicoes,
    }

    os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
    json.dump(saida, io.open(SAIDA, "w", encoding="utf-8"), ensure_ascii=False)
    print("feições: %d de %d estabelecimentos (%d sem coordenada)"
          % (len(feicoes), len(est), ausentes))
    print("por ramo:", dict(por_ramo))
    print("origem da coordenada:", dict(por_origem))
    print("sem inspeção, no mapa:", sem_inspecao)
    print("gravado: %s (%.0f KB)" % (SAIDA, os.path.getsize(SAIDA) / 1024))


if __name__ == "__main__":
    sys.exit(main())
