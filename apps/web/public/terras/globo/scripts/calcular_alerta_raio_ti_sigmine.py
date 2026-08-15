#!/usr/bin/env python3
r"""calcular_alerta_raio_ti_sigmine.py — cruza a FAIXA DE RESTRIÇÃO DE 8 km em
volta de terra indígena e de território quilombola (IDE-Sisema, camadas
`ide_2004_mg_raio_rest_terras_indigenas_pol` e
`ide_2006_mg_raio_rest_terras_quilombolas_pol`) com os dois lotes do
SIGMINE/ANM já publicados na camada, e grava DUAS saídas separadas:

    dados/camadas/alerta-raio-territorio-sigmine-operacao.geojson
    dados/camadas/alerta-raio-territorio-sigmine-interesse.geojson

Fecha o item 5 da "Ordem sugerida" de docs/FONTES-TERRITORIO-E-MINERACAO.md —
a única lacuna de MÉTODO que docs/HANDOFF-ALERTAS-TERRITORIO.md declarou em
aberto (seção 6, último parágrafo). Ver docs/HANDOFF-ALERTA-RAIO-8KM.md para o
resultado medido e o texto das entradas de config.js.

═══ POR QUE ESTE ALERTA É DIFERENTE DOS TRÊS IRMÃOS ═══

Os alertas que já existiam (`calcular_alerta_ti_mancha.py`,
`calcular_alerta_quilombola_mancha.py`, `calcular_alerta_territorio_mineracao.py`)
respondem "a terra está DENTRO de quê" — sobreposição real de geometria. Nenhum
deles tem noção de PROXIMIDADE, e isso já enganou este projeto uma vez: as 6
barragens que pareciam cruzar a Aldeia Katurama no teste por bbox estavam, na
conta real, a 450–650 m da borda da TI. Fora da interseção — e dentro de
qualquer faixa de proteção que se queira desenhar. "Zero interseções hoje" nunca
foi "zero risco".

Este script é o primeiro que mede PROXIMIDADE, e mede com a faixa que a norma
define, não com um círculo inventado por nós.

═══ ⚠️ O QUE ESTE RAIO É, E O QUE ELE NÃO É (leia antes de reusar) ═══

O raio de 8 km e a ZAS de barragem são DOIS INSTITUTOS JURÍDICOS DIFERENTES
(docs/FONTES-TERRITORIO-E-MINERACAO.md, seção 4) e este script só serve para um
deles:

  • **8 km — Portaria Interministerial 60/2015, Anexo I.** Círculo em volta da
    TERRA (indígena ou quilombola). Distância a partir da qual um
    EMPREENDIMENTO PONTUAL (portos, MINERAÇÃO e termelétricas) fora da Amazônia
    Legal aciona a manifestação do órgão interveniente no licenciamento
    ambiental — FUNAI no caso indígena, Fundação Cultural Palmares no caso
    quilombola. É EXATAMENTE o cruzamento que este script faz.

  • **ZAS / mancha de inundação — Lei 12.334/2010, Res. ANM 95/2022 art. 2º,
    LI.** "Trecho do VALE À JUSANTE da barragem", com piso legal de 10 km de
    vale, nunca círculo. O documento de fontes MEDIU quanto um círculo de 8 km
    erraria como proxy de ZAS: superestima a área de 14× a 127× nas 5 barragens
    de Brumadinho, e erra a DIREÇÃO (inclui morro acima, exclui o vale abaixo
    dos 8 km, onde a onda de fato chega).

Portanto: **é proibido usar a saída deste script para dizer que uma barragem
atinge uma terra.** Para isso existe `alerta-ti-mancha` / `alerta-quilombola-mancha`,
que usam a geometria oficial da mancha da FEAM. O raio aqui responde a outra
pergunta, e só a ela: *"este processo minerário está perto o bastante da terra
para o licenciamento ter que ouvir o órgão indigenista/quilombola?"*

═══ O RAIO NÃO É CALCULADO AQUI — É BAIXADO PRONTO ═══

`ide_2004_mg_raio_rest_terras_indigenas_pol` (80 feições = 16 polígonos de TI ×
5 tipologias) e `ide_2006_mg_raio_rest_terras_quilombolas_pol` (145 feições = 29
territórios × 5 tipologias) são publicadas pelo IDE-Sisema com o campo `dist` em
metros. Este script FILTRA `dist == 8000` (16 + 29 = 45 faixas) e usa a
geometria oficial. Não geramos buffer próprio de propósito: o buffer oficial é
auditável contra a fonte, um buffer nosso seria mais uma escolha de projeção
para alguém ter que conferir.

⚠️ MEDIDO: a faixa publicada é um DISCO, não um anel — ela CONTÉM a terra
(conferido na Aldeia Katurama: 222,6 km² de faixa contra 3,48 km² de TI, com
100% da TI dentro). Logo, um processo que já se sobrepõe à terra também aparece
aqui. Por isso toda feição carrega `ja_sobrepoe_territorio_publicado` e
`distancia_ao_territorio_m`: sem esses dois campos, somar este alerta com
`alerta-territorio-sigmine-*` contaria o mesmo processo duas vezes.

A tipologia de cada `dist` é conferida na carga (`TIPOLOGIA_ESPERADA_8KM`): se o
IDE republicar a camada com outra tabela de distâncias, o script PARA em vez de
publicar um número calculado sobre uma faixa que não é mais a de mineração —
mesma regra da `_CLASSIFICACAO_MANUAL` de `calcular_alerta_area_protegida.py`.

═══ OPERAÇÃO E INTERESSE, NUNCA SOMADOS ═══

Mesma regra do irmão `calcular_alerta_territorio_mineracao.py`
(docs/FONTES-TERRITORIO-E-MINERACAO.md, seção 2): polígono de OPERAÇÃO
(concessão de lavra, licenciamento, lavra garimpeira, registro de extração) é
extração autorizada de verdade; polígono de INTERESSE (requerimento,
autorização de pesquisa, disponibilidade) é papel protocolado na ANM que pode
nunca virar mina. Duas saídas, dois arquivos, dois registros no config — somar
apagaria a distinção jurídica.

═══ LIMITE DECLARADO DO ALCANCE JURÍDICO ═══

A Portaria 60/2015 organiza a participação dos órgãos intervenientes no
licenciamento que ela rege. Quem licencia cada processo minerário (federal ou
estadual) NÃO está neste dado e NÃO foi medido aqui. Ou seja: a saída diz
"está dentro da faixa de 8 km" — que é um fato geométrico verificável —, não
"este licenciamento específico foi obrigado a ouvir a FUNAI e não ouviu". A
segunda afirmação exigiria o processo de licenciamento de cada empreendimento,
que não está em base aberta.

═══ MÉTODO ═══

Interseção real de geometria (`shapely.intersects()`/`intersection()`) sobre a
malha completa dos dois lados, com bbox SÓ como pré-filtro O(1) — a mesma regra
dos três irmãos, pelo motivo registrado no topo (bbox já produziu falso positivo
neste projeto). A geometria gravada é a INTERSEÇÃO recortada (o pedaço do
processo minerário que cai dentro da faixa), não o processo inteiro nem a faixa
inteira.

Duas perguntas diferentes, dois campos diferentes — e nenhum dos dois depende de
o nome bater:

  • `ja_sobrepoe_territorio_publicado` (bool, sempre preenchido) responde "este
    processo JÁ aparece em `alerta-territorio-sigmine-*`?". Medido contra TODOS
    os territórios publicados neste projeto (16 TIs + 27 polígonos quilombolas),
    com a mesma regra do irmão (interseção de ÁREA > 0, não encostar de borda).
    É o campo que impede contar o mesmo processo duas vezes ao ler os dois
    alertas juntos.

  • `distancia_ao_territorio_m` responde "a que distância da terra QUE DÁ NOME A
    ESTA FAIXA". Exige casar faixa↔terra, o que é feito por GEOMETRIA primeiro
    (a terra tem de estar ≥99% dentro da faixa — a faixa é um buffer dela) e por
    nome só como desempate entre candidatas. Motivo de não casar por nome: os
    nomes do IDE e os da FUNAI/INCRA divergem ("BREJO DE CRIOULOS" × "BREJO DOS
    CRIOULOS", "NOGUEIRA" × "TQ Nogueira"). Faixa sem par sai com `null` — nunca
    `false` nem um número, que seria afirmar o que não se mediu.

MEDIDO em 14/08/2026: as 16 faixas de TI casaram todas; das 29 quilombolas, 22
casaram — as 7 restantes são territórios que o IDE tem e a camada deste projeto
ainda não (a base do IDE e o Acervo Fundiário do INCRA não estão na mesma data).
Essas 7 continuam gerando alerta normalmente: o que falta é só a distância.

Uso:
    python scripts/calcular_alerta_raio_ti_sigmine.py
"""
from __future__ import annotations

import gzip
import json
import math
import shutil
import sys
import time
import unicodedata
import urllib.request
from collections import Counter
from pathlib import Path

from shapely.geometry import mapping, shape
from shapely.ops import unary_union
from shapely.strtree import STRtree
from shapely.validation import make_valid

LOG = "[calcular_alerta_raio_ti_sigmine]"

DIR_GLOBO = Path(__file__).resolve().parent.parent
DIR_CAMADAS = DIR_GLOBO / "dados" / "camadas"
# Mesmo cache FORA de `public/` dos outros scripts de ingestão — um arquivo
# grande esquecido dentro de `public/` é copiado para o bundle pelo Next e
# estoura o teto de 25 MiB por arquivo do Workers Static Assets (ver a nota
# longa em ingerir_feam_zas_mancha.py).
DIR_TMP = Path(__file__).resolve().parents[4] / ".tmp-ingest"

TI_PATH = DIR_CAMADAS / "terras-indigenas.geojson"
QUILOMBOLA_PATH = DIR_CAMADAS / "territorios-quilombolas.geojson"
SIGMINE_OPERACAO_PATH = DIR_CAMADAS / "sigmine-operacao.geojson"
SIGMINE_INTERESSE_GZ_PATH = DIR_CAMADAS / "sigmine-interesse.geojson.gz"
SIGMINE_INTERESSE_PATH = DIR_CAMADAS / "sigmine-interesse.geojson"

BASE_URL = "https://geoserver.meioambiente.mg.gov.br/IDE/ows"
UA = "Mozilla/5.0 (compatible; ControlePopular/1.0; +https://github.com/FinweeJur/controle-popular)"

DIST_ALVO_M = 8000
# Rótulo publicado pelo IDE para `dist=8000` nas DUAS camadas. Conferido em
# 14/08/2026 nas 45 feições. Se mudar, o script para (ver `_carregar_faixas`).
TIPOLOGIA_ESPERADA_8KM = "Empreendimentos pontuais (portos, mineração e termelétricas)"

FAIXAS = [
    {
        "typename": "IDE:ide_2004_mg_raio_rest_terras_indigenas_pol",
        "cache": "raio-restricao-ti.json",
        "tipo_territorio": "terra_indigena",
        "campo_nome": "terrai_nom",
        "orgao": "FUNAI",
    },
    {
        "typename": "IDE:ide_2006_mg_raio_rest_terras_quilombolas_pol",
        "cache": "raio-restricao-quilombola.json",
        "tipo_territorio": "quilombola",
        "campo_nome": "nm_comunid",
        "orgao": "Fundação Cultural Palmares",
    },
]

# Mesma régua de simplificação das outras camadas deste lote (~22 m nesta
# latitude). Aplicada SÓ à geometria gravada para desenho — a decisão de
# "cruza ou não" e a distância medida usam a malha completa.
TOLERANCIA_GRAUS = 0.0002

# Fração da área da terra que precisa estar dentro da faixa para o par ser
# considerado casado. A faixa é um buffer da própria terra, então o esperado é
# 1,0; 0,99 dá folga para diferença de versão entre a base do IDE (2020) e a da
# FUNAI/INCRA que este projeto ingeriu (2026).
FRACAO_CONTENCAO_MINIMA = 0.99


def _baixar_faixa(typename: str, destino: Path) -> None:
    params = "&".join([
        "service=WFS", "version=1.0.0", "request=GetFeature",
        f"typeName={typename}", "outputFormat=application/json",
    ])
    req = urllib.request.Request(f"{BASE_URL}?{params}", headers={"User-Agent": UA})
    print(f"{LOG} baixando {typename}...")
    t0 = time.time()
    DIR_TMP.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(req, timeout=600) as resp, open(destino, "wb") as f:
        shutil.copyfileobj(resp, f, length=1024 * 1024)
    print(f"{LOG} {typename}: {destino.stat().st_size:,} bytes em {time.time() - t0:.1f}s")


def _geom_valida(geo_interface: dict):
    g = shape(geo_interface)
    if not g.is_valid:
        g = make_valid(g)
    return g


def _area_ha(poligono) -> float:
    """Área aproximada em hectares de geometria em graus (SIRGAS 2000 ~ WGS84),
    mesma aproximação de mapa dos scripts irmãos: 1° de latitude ~ 111.320 m,
    1° de longitude encolhe por cos(latitude). Serve para o número que
    acompanha um alerta, não para laudo."""
    lat_media = poligono.centroid.y
    return poligono.area * 111_320.0 * (111_320.0 * math.cos(math.radians(lat_media))) / 10_000


def _metros_por_grau(lat: float) -> tuple[float, float]:
    return 111_320.0, 111_320.0 * math.cos(math.radians(lat))


def _distancia_m(a, b) -> float:
    """Distância aproximada em metros entre duas geometrias em graus. Converte
    o resultado em graus pela latitude do ponto médio — aproximação boa o
    bastante para "a 450 m da borda", que é a ordem de grandeza que interessa
    aqui; não é distância geodésica."""
    d_graus = a.distance(b)
    if d_graus == 0:
        return 0.0
    lat = (a.centroid.y + b.centroid.y) / 2
    m_lat, m_lon = _metros_por_grau(lat)
    # A direção da menor distância é desconhecida; usa a média dos dois fatores,
    # que em MG (~20°S) diferem ~6% entre si.
    return d_graus * (m_lat + m_lon) / 2


def _carregar_territorios(path: Path, tipo: str) -> list[tuple[dict, object]]:
    if not path.exists():
        print(f"{LOG} AVISO: {path} não existe — as faixas de {tipo} sairão sem "
              f"par casado (sobrepoe_territorio: null).", file=sys.stderr)
        return []
    with open(path, encoding="utf-8") as f:
        d = json.load(f)
    prontos = []
    for feat in d["features"]:
        geom = feat.get("geometry")
        if geom is None:
            continue
        g = _geom_valida(geom)
        if g.is_empty:
            continue
        prontos.append((feat.get("properties") or {}, g))
    return prontos


def _normalizar(nome: str | None) -> str | None:
    if not nome:
        return None
    sem_acento = unicodedata.normalize("NFKD", nome).encode("ascii", "ignore").decode()
    return " ".join(sem_acento.upper().split())


def _casar_faixa_com_territorio(g_faixa, nome_ide: str | None,
                                territorios: list[tuple[dict, object]]):
    """Devolve (props_territorio, geom_territorio) da terra que gerou esta faixa,
    ou (None, None).

    Regra: candidata é toda terra ≥99% CONTIDA na faixa (a faixa é um buffer de
    8 km da própria terra, então a terra de origem está inteira dentro). As
    candidatas são agrupadas por nome, e a geometria devolvida é a UNIÃO das
    partes do mesmo nome — vários territórios quilombolas deste projeto têm o
    perímetro quebrado em várias poligonais (MAROBÁ DOS TEIXEIRA tem 5), e medir
    distância só até uma delas superestimaria o afastamento.

    Desempate entre grupos: o grupo cujo nome bate com o do IDE (normalizado,
    sem acento); se nenhum bate, o de maior área — com o nome de origem gravado
    na feição para quem quiser conferir a escolha."""
    bf = g_faixa.bounds
    grupos: dict[str, list[tuple[dict, object]]] = {}
    for i, (props, g_t) in enumerate(territorios):
        bt = g_t.bounds
        if bf[2] < bt[0] or bt[2] < bf[0] or bf[3] < bt[1] or bt[3] < bf[1]:
            continue
        if g_t.area == 0:
            continue
        if g_faixa.intersection(g_t).area / g_t.area < FRACAO_CONTENCAO_MINIMA:
            continue
        chave = _normalizar(props.get("nome")) or f"__sem_nome_{i}"
        grupos.setdefault(chave, []).append((props, g_t))

    if not grupos:
        return None, None

    alvo = _normalizar(nome_ide)
    escolhido = grupos.get(alvo)
    if escolhido is None:
        escolhido = max(grupos.values(),
                        key=lambda partes: sum(g.area for _, g in partes))

    geom = unary_union([g for _, g in escolhido])
    return escolhido[0][0], geom


def _carregar_faixas(territorios_por_tipo: dict[str, list[tuple[dict, object]]]) -> list[dict]:
    """Baixa (ou lê do cache) as duas camadas de raio de restrição, filtra
    `dist == 8000` e casa cada faixa com a terra que ela envolve."""
    faixas = []
    for alvo in FAIXAS:
        cache = DIR_TMP / alvo["cache"]
        if cache.exists() and cache.stat().st_size > 0:
            print(f"{LOG} usando cache de {cache} ({cache.stat().st_size:,} bytes) "
                  f"— apague o arquivo para forçar novo download.")
        else:
            _baixar_faixa(alvo["typename"], cache)

        with open(cache, encoding="utf-8") as f:
            colecao = json.load(f)

        total = len(colecao["features"])
        # Trava de base mudada: a tipologia de `dist=8000` é o que faz esta
        # faixa ser a de MINERAÇÃO e não a de duto (3 km) ou hidrelétrica
        # (15 km). Se o IDE republicar com outra tabela, parar é melhor que
        # publicar um número sobre a faixa errada.
        tipologias = {
            (f["properties"] or {}).get("tipologia")
            for f in colecao["features"]
            if (f["properties"] or {}).get("dist") == DIST_ALVO_M
        }
        if tipologias != {TIPOLOGIA_ESPERADA_8KM}:
            raise SystemExit(
                f"{LOG} ERRO: em {alvo['typename']}, dist={DIST_ALVO_M} deixou de ser "
                f"'{TIPOLOGIA_ESPERADA_8KM}' e virou {tipologias!r}. A base mudou — "
                f"confira a tabela de distâncias do Anexo I antes de rodar de novo."
            )

        n_faixa = 0
        n_casadas = 0
        for feat in colecao["features"]:
            props = feat.get("properties") or {}
            if props.get("dist") != DIST_ALVO_M:
                continue
            geom = feat.get("geometry")
            if geom is None:
                continue
            g = _geom_valida(geom)
            if g.is_empty:
                continue
            n_faixa += 1

            props_terr, g_terr = _casar_faixa_com_territorio(
                g, props.get(alvo["campo_nome"]),
                territorios_por_tipo[alvo["tipo_territorio"]])
            if props_terr is not None:
                n_casadas += 1

            faixas.append({
                "geom": g,
                "bounds": g.bounds,
                "tipo_territorio": alvo["tipo_territorio"],
                "orgao": alvo["orgao"],
                "nome_ide": props.get(alvo["campo_nome"]),
                "camada_ide": alvo["typename"].split(":")[-1],
                "geom_territorio": g_terr,
                "props_territorio": props_terr,
            })

        print(f"{LOG} {alvo['typename']}: {total} feição(ões) no total, "
              f"{n_faixa} com dist={DIST_ALVO_M} m, {n_casadas} casada(s) por geometria "
              f"com território já publicado neste projeto.")

    return faixas


def _carregar_sigmine(nome: str) -> list[dict]:
    if nome == "operacao":
        if not SIGMINE_OPERACAO_PATH.exists():
            raise FileNotFoundError(f"{SIGMINE_OPERACAO_PATH} não existe.")
        with open(SIGMINE_OPERACAO_PATH, encoding="utf-8") as f:
            return json.load(f)["features"]
    if SIGMINE_INTERESSE_PATH.exists():
        with open(SIGMINE_INTERESSE_PATH, encoding="utf-8") as f:
            return json.load(f)["features"]
    if SIGMINE_INTERESSE_GZ_PATH.exists():
        with gzip.open(SIGMINE_INTERESSE_GZ_PATH, "rt", encoding="utf-8") as f:
            return json.load(f)["features"]
    raise FileNotFoundError(
        f"nem {SIGMINE_INTERESSE_PATH} nem {SIGMINE_INTERESSE_GZ_PATH} existem.")


def _preparar_sigmine(features: list[dict]) -> list[tuple]:
    prontos = []
    for f in features:
        props = f.get("properties") or {}
        geom = f.get("geometry")
        if geom is None:
            continue
        try:
            g = _geom_valida(geom)
        except Exception as e:  # noqa: BLE001 — um polígono torto não para o lote
            print(f"{LOG} AVISO: polígono SIGMINE '{props.get('processo')}' inválido "
                  f"mesmo após reparo: {e}")
            continue
        if g.is_empty:
            continue
        prontos.append((props, g))
    return prontos


def _sobrepoe_algum_territorio(g_sigmine, arvore_terr: STRtree, geoms_terr: list) -> bool:
    """Mesma regra do irmão `calcular_alerta_territorio_mineracao.py`: só conta
    como sobreposição quando a interseção tem ÁREA > 0 — encostar de borda não
    é sobrepor. É o que faz este campo poder ser lido como "já está no alerta de
    interseção", sem contar o mesmo processo duas vezes."""
    for idx in arvore_terr.query(g_sigmine):
        g_t = geoms_terr[int(idx)]
        if not g_sigmine.intersects(g_t):
            continue
        inter = g_sigmine.intersection(g_t)
        if not inter.is_empty and inter.area > 0:
            return True
    return False


def _cruzar(faixas: list[dict], sigmine: list[tuple], rotulo_fonte: str,
            arvore_terr: STRtree, geoms_terr: list) -> list[dict]:
    """Índice espacial (STRtree) sobre os polígonos do SIGMINE — 45 faixas ×
    47.830 polígonos são 2,2 milhões de pares, e o pré-filtro por caixa fica
    caro em laço puro. O STRtree faz o MESMO pré-filtro por caixa que os
    scripts irmãos fazem à mão, só que em árvore; a decisão de "cruza ou não"
    continua sendo `intersects()`/`intersection()` sobre a malha completa."""
    arvore = STRtree([g for _, g in sigmine])
    achados = []
    t0 = time.time()
    candidatos_total = 0

    for faixa in faixas:
        g_faixa = faixa["geom"]
        for idx in arvore.query(g_faixa):
            props_s, g_s = sigmine[int(idx)]
            candidatos_total += 1
            if not g_faixa.intersects(g_s):
                continue
            inter = g_faixa.intersection(g_s)
            if inter.is_empty or inter.area == 0:
                continue

            ja_sobrepoe = _sobrepoe_algum_territorio(g_s, arvore_terr, geoms_terr)
            g_terr = faixa["geom_territorio"]
            distancia = None if g_terr is None else round(_distancia_m(g_s, g_terr), 1)

            props_terr = faixa["props_territorio"] or {}
            inter_simpl = inter.simplify(TOLERANCIA_GRAUS, preserve_topology=True)
            if inter_simpl.is_empty:
                inter_simpl = inter

            achados.append({
                "type": "Feature",
                "properties": {
                    "territorio_tipo": faixa["tipo_territorio"],
                    "territorio_nome": faixa["nome_ide"],
                    "territorio_nome_projeto": props_terr.get("nome"),
                    "territorio_fase": props_terr.get("fase_ti") or props_terr.get("fase_quilombola"),
                    "territorio_municipio": props_terr.get("municipio_nome"),
                    "faixa_dist_m": DIST_ALVO_M,
                    "faixa_tipologia": TIPOLOGIA_ESPERADA_8KM,
                    "faixa_camada_ide": faixa["camada_ide"],
                    "orgao_manifestacao": faixa["orgao"],
                    "ja_sobrepoe_territorio_publicado": ja_sobrepoe,
                    "distancia_ao_territorio_m": distancia,
                    "sigmine_fonte": rotulo_fonte,
                    "sigmine_processo": props_s.get("processo"),
                    "sigmine_nome": props_s.get("nome"),
                    "sigmine_subs": props_s.get("subs"),
                    "sigmine_fase": props_s.get("fase"),
                    "sigmine_uso": props_s.get("uso"),
                    "area_processo_ha": props_s.get("area_ha"),
                    "area_dentro_da_faixa_ha": round(_area_ha(inter), 2),
                },
                "geometry": mapping(inter_simpl),
            })

    print(f"{LOG} [{rotulo_fonte}] {candidatos_total} candidato(s) pela caixa "
          f"({len(faixas)} faixas × {len(sigmine)} polígonos) em {time.time() - t0:.1f}s "
          f"-> {len(achados)} interseção(ões) real(is).")
    return achados


def _gravar(achados: list[dict], nome_camada: str) -> Path:
    saida_path = DIR_CAMADAS / f"{nome_camada}.geojson"
    saida = {
        "type": "FeatureCollection",
        "name": nome_camada,
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features": achados,
    }
    with open(saida_path, "w", encoding="utf-8") as fh:
        json.dump(saida, fh, ensure_ascii=False, separators=(",", ": "))
    print(f"{LOG} gravado em {saida_path} ({saida_path.stat().st_size:,} bytes).")
    return saida_path


def _relatorio(achados: list[dict], rotulo: str) -> None:
    if not achados:
        print(f"{LOG} [{rotulo}] nenhuma interseção — nada a relatar.")
        return
    novos = [a for a in achados
             if not a["properties"]["ja_sobrepoe_territorio_publicado"]]
    ja_sobrepoem = [a for a in achados
                    if a["properties"]["ja_sobrepoe_territorio_publicado"]]
    sem_distancia = [a for a in achados
                     if a["properties"]["distancia_ao_territorio_m"] is None]

    print(f"\n{LOG} ═══ {rotulo.upper()} ═══")
    print(f"{LOG} {len(achados)} par(es) processo×faixa dentro dos {DIST_ALVO_M / 1000:.0f} km; "
          f"{len(novos)} SÓ na faixa (não sobrepõem território publicado — invisíveis "
          f"para o alerta de interseção), {len(ja_sobrepoem)} já sobrepõem e portanto "
          f"já estão em alerta-territorio-sigmine-{rotulo}; {len(sem_distancia)} sem "
          f"distância medida (faixa sem território casado).")
    processos = {a["properties"]["sigmine_processo"] for a in achados}
    processos_novos = {a["properties"]["sigmine_processo"] for a in novos}
    print(f"{LOG} processos distintos da ANM: {len(processos)} "
          f"(um mesmo processo pode cair na faixa de mais de um território), "
          f"sendo {len(processos_novos)} sem sobreposição a território publicado.")

    por_territorio = Counter(a["properties"]["territorio_nome"] for a in achados)
    print(f"{LOG} territórios atingidos: {len(por_territorio)}")
    for nome, n in por_territorio.most_common():
        so_faixa = sum(1 for a in achados
                       if a["properties"]["territorio_nome"] == nome
                       and not a["properties"]["ja_sobrepoe_territorio_publicado"])
        print(f"       {nome}: {n} (sendo {so_faixa} só na faixa)")

    por_fase = Counter(a["properties"]["sigmine_fase"] for a in achados)
    print(f"{LOG} por fase do SIGMINE:")
    for fase, n in por_fase.most_common():
        print(f"       {fase}: {n}")

    por_subs = Counter(a["properties"]["sigmine_subs"] for a in achados)
    print(f"{LOG} substâncias mais frequentes: "
          + ", ".join(f"{s} ({n})" for s, n in por_subs.most_common(8)))

    com_distancia = [a for a in novos
                     if a["properties"]["distancia_ao_territorio_m"] is not None]
    if com_distancia:
        mais_perto = sorted(com_distancia,
                            key=lambda a: a["properties"]["distancia_ao_territorio_m"])[:10]
        print(f"{LOG} os 10 mais próximos que NÃO sobrepõem território publicado:")
        for a in mais_perto:
            p = a["properties"]
            print(f"       {p['distancia_ao_territorio_m']:>8.0f} m — {p['territorio_nome']} "
                  f"× {p['sigmine_nome']} ({p['sigmine_subs']}, {p['sigmine_fase']}, "
                  f"processo {p['sigmine_processo']})")

    area_total = sum(a["properties"]["area_dentro_da_faixa_ha"] for a in achados)
    print(f"{LOG} área somada dentro da faixa: {area_total:,.1f} ha "
          f"(soma de recortes; polígonos podem se sobrepor entre si)")


def main() -> None:
    territorios_por_tipo = {
        "terra_indigena": _carregar_territorios(TI_PATH, "terra_indigena"),
        "quilombola": _carregar_territorios(QUILOMBOLA_PATH, "quilombola"),
    }
    geoms_terr = [g for lista in territorios_por_tipo.values() for _, g in lista]
    arvore_terr = STRtree(geoms_terr)
    print(f"{LOG} {len(territorios_por_tipo['terra_indigena'])} polígono(s) de terra "
          f"indígena + {len(territorios_por_tipo['quilombola'])} de território "
          f"quilombola publicados neste projeto (referência de sobreposição já conhecida).")

    faixas = _carregar_faixas(territorios_por_tipo)
    n_ti = sum(1 for f in faixas if f["tipo_territorio"] == "terra_indigena")
    n_q = len(faixas) - n_ti
    print(f"{LOG} {len(faixas)} faixa(s) de {DIST_ALVO_M / 1000:.0f} km "
          f"({n_ti} de terra indígena + {n_q} de território quilombola).")

    print(f"{LOG} carregando sigmine-operacao...")
    operacao = _preparar_sigmine(_carregar_sigmine("operacao"))
    print(f"{LOG} {len(operacao)} polígono(s) de operação válidos.")
    achados_operacao = _cruzar(faixas, operacao, "operacao", arvore_terr, geoms_terr)
    _gravar(achados_operacao, "alerta-raio-territorio-sigmine-operacao")
    _relatorio(achados_operacao, "operacao")

    print(f"\n{LOG} carregando sigmine-interesse (47 mil polígonos, leva um tempo)...")
    interesse = _preparar_sigmine(_carregar_sigmine("interesse"))
    print(f"{LOG} {len(interesse)} polígono(s) de interesse válidos.")
    achados_interesse = _cruzar(faixas, interesse, "interesse", arvore_terr, geoms_terr)
    _gravar(achados_interesse, "alerta-raio-territorio-sigmine-interesse")
    _relatorio(achados_interesse, "interesse")

    print(f"\n{LOG} RESUMO: operação={len(achados_operacao)}, "
          f"interesse={len(achados_interesse)} — NUNCA somar os dois (ver docstring).")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # noqa: BLE001
        print(f"{LOG} ERRO: {e}", file=sys.stderr)
        raise
