#!/usr/bin/env python3
r"""ingerir_incra_quilombolas.py — baixa a poligonal OFICIAL dos territórios
quilombolas de MG (todas as feições casam com `dados/camadas/
territorios-quilombolas.geojson`).

⟲ 15/10/2026 — FONTE TROCADA: o WFS do Acervo Fundiário do INCRA
(acervofundiario.incra.gov.br/i3geo/ogc.php) MORREU — medido neste dia,
timeout mesmo com 90 s e a página nova é iframe dinâmico. A fonte agora é
o shapefile OFICIAL do IBGE publicado com o Censo 2022 ("Territórios
Quilombolas oficialmente delimitados", 2ª apuração de 22/12/2023) — o mesmo
dado oficial: o IBGE recebe a delimitação já consolidada do INCRA. Mecanismo,
limiares e o que sobrou: comentarios em URL_ZIBGE e ALVOS. As seções de
história abaixo falam do dia 13/08/2026, não de hoje.

História do desenho (13/08/2026): o script existia para dar NOME, MUNICÍPIO e
FASE às camadas publicadas, que só tinham `area_ha`.

POR QUE ESTE SCRIPT EXISTE

Em 13/08/2026, checando um alerta novo (`calcular_alerta_territorio_mineracao.py`),
apareceram 12 sobreposições reais de território quilombola com lavra de granito
AUTORIZADA — e as duas maiores (551,3 ha e 256,7 ha, mesmo titular, GRANSENA
EXPORTAÇÃO E COMÉRCIO) caem num território que o app só sabe descrever como
"quilombola · área 5". Um alerta que existe para avisar comunidade e não
consegue dizer o NOME da comunidade é quase inútil. Este script fecha o buraco
na fonte, não no sintoma.

═══ DUAS FONTES DIFERENTES — NÃO CONFUNDIR (a armadilha mais provável aqui) ═══

  * INCRA (este script) tem a POLIGONAL — geometria com nome, do processo de
    regularização fundiária (Acervo Fundiário / serviços de geoinformação).
  * Fundação Cultural Palmares emite a CERTIDÃO de comunidade remanescente de
    quilombo (CRQ): uma LISTA de nome + município, SEM polígono. Confirmado
    hoje: `https://dados.cultura.gov.br/dataset/comunidades-quilombolas-certificadas`
    tem CSV público (licença Creative Commons Atribuição, HTTP 200, 749.619
    bytes, última atualização 05/07/2022 — portanto desatualizada em quase
    quatro anos). Serve para CRUZAR e enriquecer um dia, nunca para desenhar:
    não tem geometria. Este script não usa o Palmares porque a poligonal do
    INCRA já resolve o problema (nome + geometria na mesma fonte); ver
    docs/FONTES-TERRITORIO-E-MINERACAO.md para o levantamento completo.

═══ O SERVIÇO ═══

Não é o `geoserver.funai.gov.br` nem o `geoserver.meioambiente.mg.gov.br` que
os outros scripts deste diretório usam — é o WFS do i3Geo do Acervo Fundiário:

    http://acervofundiario.incra.gov.br/i3geo/ogc.php
      ?tema=quilombolas_mg&service=WFS&version=1.1.0&request=GetFeature

Confirmado hoje: HTTP 200, camada já vem RECORTADA em MG pelo nome do tema
(`quilombolas_mg`) — ao contrário da FUNAI, aqui NÃO existe pegadinha de
paginar por UF nem de 403 sem filtro. `resultType=hits` confirma 22 feições.

Licença, direto do `AccessConstraints` do `GetCapabilities`: **"vedado o uso
comercial"** — mais restritiva que a da FUNAI (que só pede atribuição). Fees:
"none". Registrar isto é obrigação do projeto: dado público, mas com restrição
de uso comercial explícita — compatível com um portal cívico sem fins
lucrativos, mas é a licença que existe, não a que se presume.

═══ ARMADILHA 1: SÓ SAI GML, NUNCA JSON ═══

`outputFormat=application/json` devolve erro do servidor ("'application/json'
is not a permitted output format for layer 'quilombolas_mg'"). O único
`wfs_getfeature_formatlist` habilitado é `text/xml; subtype=gml/3.1.1`. Por
isso este script faz o que nenhum outro ingestor deste diretório precisa
fazer: parsear GML 3.1.1 na mão com `xml.etree.ElementTree` (sem GDAL/ogr2ogr
disponível nesta máquina) — ver `_parse_geometria`.

═══ ARMADILHA 2: EIXO INVERTIDO (lat, lon), NÃO (lon, lat) ═══

O `gml:posList` desta camada vem como "lat lon lat lon ...". Confirmado no
`gml:Envelope`: `lowerCorner` de MG é "-19.94 -46.93" — o primeiro número é
latitude (MG não passa de -14° a -20° de LATITUDE, e teria longitude
impossível se fosse o contrário). GeoJSON exige (lon, lat). Sem inverter, todo
polígono desta camada apareceria transposto — MG rotacionado ~90°, flutuando
sobre o oceano. `_parse_pos_list` faz a troca.

═══ ARMADILHA 3 (a boa notícia): O UTF-8 declarado AQUI É VERDADE ═══

Ao contrário do WFS da FUNAI (que MENTE no charset e manda Latin-1 dentro de
um header que diz UTF-8 — ver `ingerir_funai_terras_indigenas.py`), o XML
desta camada declara `encoding="UTF-8"` e os bytes batem: medido agora,
"SÃO SEBASTIÃO" chega como os dois bytes corretos 0xC3 0x83 (Ã em UTF-8), não
como um byte Latin-1 solto. Decodificar como Latin-1 aqui SERIA o erro — daria
"S\x83O" no lugar de "SÃO". `.decode('utf-8')` direto, sem gambiarra. Duas
camadas do INCRA, duas mentiras diferentes sobre encoding: aqui não há
nenhuma. Não copiar o `.decode('latin-1')` do script da FUNAI para este.

═══ NÃO HÁ CAMPO "FASE" NO INCRA — A FASE AQUI É DEDUZIDA, E ISSO FICA DITO ═══

O esquema (`DescribeFeatureType`) não tem um campo pronto como o `fase_ti` da
FUNAI. O que existe são datas de etapas do processo (Nota Informativa do INCRA
sobre titulação quilombola: RTID → Portaria de Reconhecimento → Decreto de
desapropriação → titulação):

    dt_publica / dt_public1  -- publicação (e retificação) do RTID no DOU/DOE
    dt_titulac                -- data da titulação definitiva

Este script DEDUZ uma fase de três valores a partir da presença dessas datas
e grava em `fase_quilombola` (nome de campo deliberadamente distinto de
`fase_ti`, para não passar por um campo oficial que não existe):

    dt_titulac preenchida            -> "Titulado"
    dt_publica OU dt_public1, sem dt_titulac -> "RTID publicado — em titulação"
    nenhuma das duas                 -> "Sem RTID publicado"

MESMA REGRA DE NÃO FILTRAR que vale para `fase_ti` da FUNAI
(docs/FONTES-TERRITORIO-E-MINERACAO.md, seção 1): a fase é ETIQUETA, nunca
filtro. Um território "Sem RTID publicado" continua sendo território
quilombola perante a Convenção 169 da OIT — é a fase mais vulnerável, igual ao
caso já documentado para TI "Em Estudo".

═══ CAMPO EXCLUÍDO DE PROPÓSITO: `responsave` ═══

O esquema tem um campo `responsave` (responsável pela titulação). Medido nas
22 feições de MG: só assume "INCRA" (21×) ou "CEMIG" (1×, o caso estadual de
Porto Corós/Praia) — são instituições, não nomes de pessoa física. Mesmo assim
este script NÃO grava esse campo no GeoJSON: não agrega informação (já sai
coberto por `esfera`) e, por ser campo de "responsável", é exatamente o tipo
de coluna que pode um dia trazer nome de representante — a regra do projeto
(rodar `scripts/checar-dado-pessoal.py` antes de commitar) é a rede de
segurança, esta omissão é a primeira linha de defesa.

═══ COMO ESTE SCRIPT CASA CADA FEIÇÃO ANTIGA COM UMA FEIÇÃO DO INCRA ═══

As duas camadas já publicadas não têm nome nem processo — só `area_ha` e a
geometria. Não dá para casar por ID porque não existe ID em comum. Este
script casa por GEOMETRIA: centróide de cada feição antiga contra o centróide
de cada "parte" do INCRA (uma feição do INCRA pode ser `MultiSurface` — ex.:
"Marobá dos Teixeira" em Almenara são 5 polígonos desconexos, que as camadas
antigas já traziam como 5 feições SEPARADAS; este script decompõe o
`MultiSurface` em partes soltas antes de casar, senão o centróide do conjunto
não bate com o de nenhuma parte). Corte de aceitação: distância de centróide
< `LIMIAR_DISTANCIA_GRAUS` (~300 m nesta latitude) E área dentro de 10% uma da
outra. As 13 feições que batem nesse critério (2 na bacia + 11 nos Vales)
foram conferidas manualmente hoje antes de travar o limiar — todas com
distância de centróide abaixo de 30 m.

IDS DE CAMADA E ÍNDICE NÃO MUDAM PARA AS DUAS CAMADAS JÁ PUBLICADAS: este
script preserva a ORDEM e a CONTAGEM originais de `territorios-quilombolas` e
`territorios-quilombolas-vales` — nunca adiciona nem remove feição delas, só
substitui propriedades (sempre) e geometria (só quando achou o par no INCRA,
pela razão acima: a geometria do INCRA é mais confiável que a antiga, que não
tem proveniência registrada). Feição sem par no INCRA MANTÉM a geometria
antiga e grava `fonte_incra: false` — nunca inventa nome nem apaga a área.

═══ COBERTURA — O QUE SOBRA DE CADA LADO (declarado, não escondido) ═══

Medido hoje, casando as 14 feições antigas contra as 22 do INCRA:

  * 13 casam (2 bacia + 11 Vales — os 5 pedaços do Marobá contam como 11 um
    a um, não como 1). Ganham nome, município e fase.
  * 1 NÃO casa: `territorios-quilombolas-vales.geojson` índice 3 (58,2 ha,
    perto de Lagoa Grande/Jenipapo de Minas). Não há feição do INCRA com
    centróide nem área parecidos — fica sem nome, com `fonte_incra: false`.
  * O INCRA tem 13 feições a MAIS que não entravam em nenhuma das duas
    camadas: TQ Nogueira (Montes Claros), São Sebastião (Patos de Minas/
    Presidente Olegário), Baú-Serro, Ausente (Serro), Tabua (Manga), Brejo
    dos Criolos (São João da Ponte/Varzelândia/Verdelândia), Amaros
    (Paracatu), Sete Ladeiras e Terra Dura (São João da Ponte), Machadinho
    (Paracatu), São Domingos (Paracatu), Gurutuba (Jaíba/Gamaleira/Monte
    Azul), Lapinha (Matias Cardoso, 2 partes) e Pimentel (Pedro Leopoldo, 3
    partes). Nenhuma delas é Paraopeba nem Jequitinhonha/Mucuri "puro" pela
    leitura do nome do município — Montes Claros, Manga, Paracatu e Jaíba são
    Norte/Noroeste de Minas, fora das DUAS regiões que este projeto já
    delimita (`bacia`, `jequitinhonha`, `mucuri`); conferido também contra
    `js/data/mesorregioes.js` (a tabela real de município → mesorregião que o
    filtro do painel usa): NENHUM dos 13 municípios está nela.

═══ 13/08/2026, MAIS TARDE: OS 13 QUE SOBRAVAM AGORA ENTRAM — TERCEIRA FONTE,
NÃO FUSÃO DAS DUAS QUE JÁ EXISTIAM ═══

Decisão registrada aqui porque foi pedida explicitamente: unificar
`territorios-quilombolas`/`territorios-quilombolas-vales` num arquivo só, ou
manter as duas e ACRESCENTAR os 13 que faltam? Resposta: acrescentar, numa
TERCEIRA fonte nova (`territorios-quilombolas-outras-regioes.geojson`) — nunca
fundir as duas que já existem. Duas razões, uma de cada lado do argumento:

  1. O argumento para unificar ("o painel já foi reorganizado por ASSUNTO
     para não ter irmã em seção diferente" — ver o comentário grande sobre
     `ASSUNTOS` em js/config.js) JÁ ESTÁ satisfeito, e desde 13/08 mais cedo:
     `CAMADAS` (config.js) tem UMA linha `territorios-quilombolas` cujo
     `fontes` já lista as duas fontes regionais — quem abre o painel vê UM
     interruptor, "Territórios quilombolas", não dois. A fusão dos ARQUIVOS
     não muda nada que a pessoa vê; só arrisca o que vem no item 2.
  2. O argumento para manter ("ids são contrato") é sobre ÍNDICE, não só id:
     `#area=<fonte>:<índice>` (main.js) e `detalhe.html?camada=<fonte>&fid=`
     (inspector.js) resolvem por POSIÇÃO dentro do ARQUIVO daquela fonte. Um
     arquivo fundido teria que renumerar pelo menos um dos dois lados (bacia
     + vales não podem ocupar os mesmos índices 0..13 nos DOIS arquivos
     originais ao mesmo tempo) — todo link `#area=territorios-quilombolas-
     vales:N` já compartilhado passaria a abrir OUTRA área, calado, sem
     erro. `calcular_alerta_quilombola_mancha.py` e
     `calcular_alerta_territorio_mineracao.py` também leem os dois arquivos
     por posição (`_origem_indice`) — fundir quebraria a proveniência de
     cada alerta já publicado.

  Uma TERCEIRA fonte não tem nenhum desses dois problemas: id novo (nunca
  existiu, nada aponta pra ele ainda), índices 0..12 novos em folha (nunca
  existiram, nada aponta pra eles), e o painel continua mostrando UMA linha
  só — `CAMADAS` ganha `territorios-quilombolas-outras-regioes` na lista
  `fontes` da MESMA linha `territorios-quilombolas` (config.js). Nenhum id
  antigo muda, nenhum índice antigo se desloca — ver
  js/ui/layerspanel.test.mjs, teste "CONTRATO PÚBLICO", que trava isso.

  Por que "outras regiões" e não forçar os 13 dentro de `bacia` ou de
  `jequitinhonha`/`mucuri`: nenhum dos 13 município bate a tabela real de
  `js/data/mesorregioes.js` nem o polígono da bacia do Paraopeba (não
  conferido geometricamente contra a malha da bacia nesta entrega — mesma
  lacuna que o parágrafo de COBERTURA acima já registrava). Forçar região que
  o dado não sustenta seria o mesmo erro que este arquivo já evita para
  `esfera`/`responsave` — por isso a nova fonte NÃO leva `regioes` no
  LAYER_REGISTRY (mesmo padrão de `normas-geolocalizadas`: fonte sem região
  aparece em qualquer filtro, nunca escondida por um recorte que não é dela).

  As propriedades dos 13 seguem EXATAMENTE o mesmo esquema das 13 que já
  casaram nas duas camadas antigas (`nome`, `municipio_nome`, `area_ha`,
  `fase_quilombola` deduzida, `processo_incra`, `esfera`, `num_familias`,
  datas de RTID/titulação, `superintendencia_regional_incra`,
  `fonte_incra: true`) — mesma função `_props_incra_para_saida`, chamada três
  vezes agora em vez de duas.

Uso:
    python scripts/ingerir_incra_quilombolas.py
"""
from __future__ import annotations

import json
import math
import sys
import zipfile
from pathlib import Path

import shapefile
from shapely.geometry import mapping, shape, Polygon, MultiPolygon
from shapely.validation import make_valid

LOG = "[ingerir_incra_quilombolas]"

# ═══ FONTE TROCADA EM 15/10/2026 ═══
# O WFS do Acervo Fundiário (i3geo/ogc.php) MORREU: medido neste dia, o
# ogc.php só responde timeout (mesmo com 90 s) e a página do geodownload
# virou iframe dinâmico sem lista fixa. O substituto é a poligonal
# OFICIAL do IBGE publicada com o Censo 2022 — "Territórios Quilombolas
# oficialmente delimitados", 2ª apuração, 22/12/2023 — que é o mesmo dado
# oficial (o IBGE recebe a delimitação do INCRA) e vem como shapefile
# zipado embutindo o mesmo WGS84 (CRS84) das camadas publicadas.
#
# Medido ao mudar: BR inteiro tem 495 territórios (fields COD_UF, SG_UF,
# COD_TQ, NOM_TQ, STATUS); o filtro é SG_UF == "MG". O que o shapefile
# do IBGE NÃO tem, e o WFS tinha: processo, município, nº de famílias,
# datas de RTID e superintendência. Esses campos continuam saindo — a
# fonte deles passa a ser a PRÓPRIA FEIÇÃO ANTIGA já publicada (ver
# _props_incra_para_saida, que faz o merge). Nunca jogar fora campo que
# a fonte velha media e a nova não trouxe.

URL_ZIBGE = (
    "https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/"
    "Quilombolas_Primeiros_resultados_do_universo/"
    "Arquivos_geoespaciais_vetoriais_2a_apuracao_20231222/"
    "BR_TQ_2a_apuracao_20231222.zip"
)
UA = "Mozilla/5.0 (compatible; ControlePopular/1.0; +https://github.com/FinweeJur/controle-popular)"

DIR_GLOBO = Path(__file__).resolve().parent.parent
DIR_CAMADAS = DIR_GLOBO / "dados" / "camadas"
# ⚠️ O CACHE DE DOWNLOAD FICA FORA DE `public/`, E ISSO NÃO É ORGANIZAÇÃO.
# Ele já ficou em `public/terras/globo/scripts/.tmp-ingest/` e, em 13/08/2026,
# um `mancha.json` de 570 MiB sobrou ali e foi COPIADO PARA O BUNDLE pelo
# build — `public/` inteiro vira Static Assets. O teto do Cloudflare é 25 MiB
# POR ARQUIVO, então o deploy morreria naquele arquivo.
#
# O `.gitignore` não protegia de nada aqui: o arquivo nunca foi commitado, e
# mesmo assim entrou no build, porque quem copia é o Next e não o git. Modo
# de falha silencioso — ninguém vê até o upload falhar.
#
# `apps/web/.tmp-ingest/` está fora de `public/`, então o build não o enxerga.
DIR_TMP = Path(__file__).resolve().parents[4] / ".tmp-ingest"
CACHE_RAW = DIR_TMP / "BR_TQ_2a_apuracao.zip"

ALVOS = [
    DIR_CAMADAS / "territorios-quilombolas.geojson",
]

# O arquivo `-vales` morreu na UNIFICAÇÃO de 13/08/2026 (commit b3110b5d): as
# três fontes regionais viraram UM arquivo de 27 feições. E a "terceira
# fonte" `-outras-regioes` morreu na mesma decisão — o arquivo antigo nunca
# chegou a ser commitado e ninguém o consome. O que a fonte tem e nenhuma
# feição usa fica registrado no LOG (blocos de cobertura abaixo), sem
# arquivo novo: acrescentar feição no arquivo unificado quebraria o
# contrato de índice (`#area=<fonte>:<índice>`, testado em
# js/ui/layerspanel.test.mjs) e abrir a fonte no painel preconizaria
# duplicata (Pimentel já está no unificado). Enxerto silencioso, nunca.

NS = None  # Nenhuma: a fonte nova é shapefile, não GML — o WFS antigo sumiu (15/10/2026).

CAMPOS_IBGE = ["COD_UF", "SG_UF", "COD_TQ", "NOM_TQ", "STATUS"]

# ~300 m nesta latitude (1° ≈ 111 km). Ver docstring: as 13 correspondências
# reais medem todas < 30 m; nenhum falso-positivo apareceu até 1 km nos dados
# de hoje, então esta margem é folgada de propósito para tolerar pequena
# deriva se o INCRA reprocessar a malha numa atualização futura.
# 0,008 graus (~880 m): medido na troca de fonte (15/10/2026). O casamento
# real mais largo com a delimitação IBGE fica a 0,0056 (Sete Ladeiras,
# 0,6 km) e os falsos-candidatos mais próximos começam a 0,02 (Lagoa Grande
# x feição de 58 ha, 2,2 km) — o teto no meio, com margem nos dois lados.
# O valor anterior (0,003) era calibrado contra a geometria do próprio WFS.
LIMIAR_DISTANCIA_GRAUS = 0.008
# 15%: medido na troca de fonte (15/10/2026), Sete Ladeiras e Terra Dura
# casa centróide a 0,6 km mas com 12,6% de diferença de área -- e a mesma
# feição JÁ ERA casada no fluxo anterior (licença do WFS morto). 10% era
# margem calibrada contra a geometria do próprio WFS; a delimitação IBGE é
# ligeiramente distinta, então a folga subiu 5 pontos, medido antes de travar.
LIMIAR_RAZAO_AREA = 0.15  # 15%


# ─────────────────────── download e parse do shapefile IBGE ─────────────────

import urllib.request


def _baixar_zip() -> bytes:
    req = urllib.request.Request(URL_ZIBGE, headers={"User-Agent": UA})
    print(f"{LOG} baixando {URL_ZIBGE.rsplit('/', 1)[-1]} (IBGE/Censo 2022, 2a apuracao)...")
    with urllib.request.urlopen(req, timeout=300) as resp:
        return resp.read()


def _parse_polygon_pos(pontos: list[tuple[float, float]], indice_parte: int) -> Polygon:
    """Um anel de coordenadas do shapefile -> Polygon válido.

    Regra de buraco: um anel que fica DENTRO de outro no MESMO território é
    interior (furo), não é parte externa — sem isso, um furo viraria um
    "pedaço" falso para o casamento por centróide."""
    p = Polygon(pontos)
    if not p.is_valid:
        p = make_valid(p)
    return p


def _partes_do_shape(reg_shape) -> tuple[object, list[Polygon]]:
    """Shape pyshp -> (geometria combinada, lista de partes).

    `shape.parts` marca onde cada anel começa em `points`. Anéis do MESMO
    território que se contêm mutuamente: o contido é buraco do contenedor
    (caso raro, tratado para o casamento por centróide não ver um "pedaço"
    fantasma dentro do território)."""
    aneis = []
    for i in range(len(reg_shape.parts)):
        inicio = reg_shape.parts[i]
        fim = reg_shape.parts[i + 1] if i + 1 < len(reg_shape.parts) else len(reg_shape.points)
        aneis.append(_parse_polygon_pos(reg_shape.points[inicio:fim], i))

    # Separa externos de buracos: anel contido em outro anel é furo deste.
    externos = []
    for i, a in enumerate(aneis):
        contido = any(
            j != i and b.contains(a.centroid) and b.area > a.area
            for j, b in enumerate(aneis)
        )
        if not contido:
            externos.append((i, a))

    buracos_por_indice = {i: [] for i, _ in externos}
    for i, a in enumerate(aneis):
        if (i, a) in externos or any(i == x[0] for x in externos):
            continue
        for j, ext in externos:
            if j != i and ext.contains(a.centroid):
                buracos_por_indice[j].append(a)
                break

    partes = [Polygon(aneis[j], buracos_por_indice[j]) for j, _ in externos]


    partes_validas = [p if p.is_valid else make_valid(p) for p in partes]
    if len(partes_validas) == 1:
        return partes_validas[0], partes_validas
    return MultiPolygon(partes_validas), partes_validas


def _carregar_incra() -> list[dict]:
    if CACHE_RAW.exists():
        print(f"{LOG} usando cache local {CACHE_RAW} (apague o arquivo para forçar nova busca).")
        bruto = CACHE_RAW.read_bytes()
    else:
        bruto = _baixar_zip()
        DIR_TMP.mkdir(parents=True, exist_ok=True)
        CACHE_RAW.write_bytes(bruto)

    extraido = DIR_TMP / "BR_TQ_descompactado"
    if not extraido.exists():
        zipfile.ZipFile(CACHE_RAW).extractall(extraido)

    # O zip traz uma pasta interna com todos os componentes do shapefile;
    # o .shp é único — achar pelo sufixo, não pelo nome de pasta fixado.
    shp_path = next(extraido.rglob("*.shp"))

    reader = shapefile.Reader(str(shp_path))
    territorios = []
    for rec, shape_reg in zip(reader.records(), reader.shapes()):
        props = dict(zip([f[0] for f in reader.fields[1:]], rec))
        if props.get("SG_UF") != "MG":
            continue  # o painel do projeto é MG; o resto do BR fica de fora
        geom, partes = _partes_do_shape(shape_reg)
        territorios.append({"props": props, "geom": geom, "partes": partes})
    return territorios


# ─────────────────────────── fase deduzida ──────────────────────────────────

def _fase_quilombola(props: dict) -> str:
    """Fase da regularização, deduzida — nunca filtro.

    Fonte nova (IBGE, 15/10/2026): o shapefile só traz STATUS
    ("TITULADO" quando o INCRA já emitiu o título; outras etiquetas da
    delimitação, p.ex. em titulação). Se as datas antigas do WFS
    (dt_titulac/dt_publica — hoje nulas na fonte nova, preservadas pela
    feição antiga no merge) existirem, vencem sobre STATUS: eram a
    medida fine-grained original deste script."""
    if props.get("dt_titulac") or str(props.get("STATUS", "")).upper() == "TITULADO":
        return "Titulado"
    if props.get("dt_publica") or props.get("dt_public1"):
        return "RTID publicado — em titulação"
    return "Oficialmente delimitado — em titulação"



def _area_ha(poligono) -> float:
    lat_media = poligono.centroid.y
    m_por_grau_lat = 111_320.0
    m_por_grau_lon = 111_320.0 * math.cos(math.radians(lat_media))
    return poligono.area * m_por_grau_lat * m_por_grau_lon / 10_000


# ─────────────────────────── casamento geométrico ───────────────────────────

def _todas_as_partes(territorios: list[dict]) -> list[tuple[dict, object]]:
    """Achata em (props_do_territorio, geometria_da_parte) -- uma entrada por
    polígono desconexo, para casar contra feições antigas que já vêm
    pré-separadas (ver docstring)."""
    saida = []
    for t in territorios:
        for parte in t["partes"]:
            saida.append((t["props"], parte))
    return saida


def _casar(geom_antiga, partes_incra: list[tuple[dict, object]]):
    """Devolve (props_incra, geometria_incra) do melhor par, ou None se
    nenhum candidato ficar dentro do limiar de distância E área."""
    c = geom_antiga.centroid
    melhor = None
    melhor_dist = None
    for props, parte in partes_incra:
        cp = parte.centroid
        dist = math.hypot(c.x - cp.x, c.y - cp.y)
        if melhor_dist is None or dist < melhor_dist:
            melhor_dist = dist
            melhor = (props, parte)
    if melhor is None or melhor_dist > LIMIAR_DISTANCIA_GRAUS:
        return None
    props, parte = melhor
    area_incra = _area_ha(parte)
    area_antiga = _area_ha(geom_antiga)
    if area_antiga > 0:
        razao = abs(area_incra - area_antiga) / area_antiga
        if razao > LIMIAR_RAZAO_AREA:
            return None
    return props, parte


# ─────────────────────────── ingestão de cada arquivo ───────────────────────

def _props_incra_para_saida(props_novas: dict, geom_incra, props_antigas: dict | None) -> dict:
    """Esquema de saída comum às TRÊS fontes que este script escreve (as duas
    antigas, casadas por geometria, e a nova `outras-regioes`, direto do
    INCRA — hoje IBGE) — ver docstring, "OS 13 QUE SOBRAVAM AGORA ENTRAM".

    MERGE (15/10/2026): o shapefile do IBGE tem nome/UF/código/status, mas
    NÃO tem processo, município, nº de famílias, datas de RTID nem
    superintendência. Onde existia feição publicada (`props_antigas`), esses
    campos VÊM DELA — nunca despublicar um dado que a fonte velha media e a
    nova não carrega. Campos novos do IBGE entram com nomes próprios."""
    saida = {
        "nome": props_novas.get("NOM_TQ"),
        "area_ha": round(_area_ha(geom_incra), 1),
        "fase_quilombola": _fase_quilombola(props_novas),
        "codigo_ibge_tq": props_novas.get("COD_TQ") or None,
        "status_ibge": props_novas.get("STATUS") or None,
        "fonte_incra": True,
    }
    herdavel = (
        "municipio_nome", "processo_incra", "esfera", "num_familias",
        "data_publicacao_rtid", "data_publicacao_rtid_retificacao",
        "data_titulacao", "superintendencia_regional_incra",
    )
    if props_antigas:
        for campo in herdavel:
            if props_antigas.get(campo) is not None:
                saida[campo] = props_antigas[campo]
    # Campos que o WFS antigo preenchia e hoje ninguém traz: None explícito,
    # com lacuna declarada — ausência é informação (regra editorial do repo).
    for campo in herdavel:
        saida.setdefault(campo, None)
    return saida


def _ingerir_arquivo(
    path: Path,
    partes_incra: list[tuple[dict, object]],
    consumidos: set[int],
) -> tuple[int, int]:
    d = json.loads(path.read_text(encoding="utf-8"))
    n_casou = 0
    n_nao_casou = 0
    features_saida = []

    for idx, feat in enumerate(d["features"]):
        geom_antiga = shape(feat["geometry"])
        par = _casar(geom_antiga, partes_incra)

        if par is None:
            n_nao_casou += 1
            props_saida = dict(feat["properties"])
            props_saida["fonte_incra"] = False
            props_saida["aviso"] = (
                "Não encontrado na poligonal oficialmente delimitada do IBGE "
                "(Censo 2022, 2a apuracao, baixada em 15/10/2026) -- mantida a "
                "geometria e a área já publicadas antes, sem nome nem município."
            )
            features_saida.append({
                "type": "Feature",
                "properties": props_saida,
                "geometry": feat["geometry"],
            })
            print(f"{LOG} {path.name}#{idx}: SEM correspondência no IBGE -- mantido sem nome.")
            continue

        props_novas, geom_incra = par
        n_casou += 1
        consumidos.add(id(props_novas))  # território já usado numa camada antiga
        props_saida = _props_incra_para_saida(props_novas, geom_incra, feat["properties"])
        features_saida.append({
            "type": "Feature",
            "properties": props_saida,
            "geometry": mapping(geom_incra),
        })
        print(f"{LOG} {path.name}#{idx}: {props_novas['NOM_TQ']} "
              f"-- {props_saida['fase_quilombola']}")

    saida = {
        "type": "FeatureCollection",
        "name": path.stem,
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features": features_saida,
    }
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(saida, fh, ensure_ascii=False, separators=(",", ": "))
    print(f"{LOG} gravado {path} ({path.stat().st_size:,} bytes), "
          f"{len(features_saida)} feições ({n_casou} com nome, {n_nao_casou} sem).")
    return n_casou, n_nao_casou


def main() -> None:
    territorios = _carregar_incra()
    print(f"{LOG} {len(territorios)} território(s) quilombola(s) oficialmente delimitado(s) em MG (IBGE/Censo 2022).")
    if not territorios:
        print(f"{LOG} ERRO: zero territórios em MG -- fonte vazia ou filtro quebrado. "
              f"NÃO publicar.", file=sys.stderr)
        sys.exit(2)

    partes_incra = _todas_as_partes(territorios)
    print(f"{LOG} {len(partes_incra)} parte(s) geométrica(s) desconexa(s) ao todo "
          f"(territórios multi-parte, como Marobá dos Teixeira, contam uma vez por parte).")

    consumidos: set[int] = set()  # id(props) dos territórios que casaram
    total_casou = 0
    total_nao_casou = 0
    for path in ALVOS:
        if not path.exists():
            print(f"{LOG} AVISO: {path} não existe -- pulando.", file=sys.stderr)
            continue
        casou, nao_casou = _ingerir_arquivo(path, partes_incra, consumidos)
        total_casou += casou
        total_nao_casou += nao_casou

    # ─── Relatório de cobertura: o que a fonte tem e nenhuma das duas
    # camadas usa hoje. Ver docstring, seção "COBERTURA". Consumo rastreado
    # por identidade de props (COD_TQ), não por nome: o nome pode repetir
    # entre territórios distintos, o código não.
    sobrando = [t for t in territorios if id(t["props"]) not in consumidos]

    print(f"\n{LOG} RESUMO: {total_casou} feição(ões) ganharam nome, "
          f"{total_nao_casou} continuam sem correspondência na fonte.")
    print(f"{LOG} A fonte tem {len(sobrando)} território(s) em MG que não entravam em "
          f"nenhuma feição publicada (fora das regiões bacia/Jequitinhonha/Mucuri "
          f"já delimitadas -- ver docstring). Registro de cobertura, sem arquivo novo "
          f"(a terceira fonte morreu na unificação de 13/08/2026 -- ver ALVOS):")
    for t in sobrando:
        p = t["props"]
        print(f"{LOG}   - {p['NOM_TQ']} ({p['STATUS']}) -- {round(_area_ha(t['geom']), 1)} ha")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # noqa: BLE001
        print(f"{LOG} ERRO: {e}", file=sys.stderr)
        raise
