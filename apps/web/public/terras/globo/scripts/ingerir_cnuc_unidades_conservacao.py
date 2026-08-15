r"""ingerir_cnuc_unidades_conservacao — parques e áreas protegidas de Minas.

Fonte: **CNUC** (Cadastro Nacional de Unidades de Conservação), do MMA,
servido pelo GeoServer da INDE em `geoservicos.inde.gov.br`. É o cadastro
oficial das UCs criadas por lei nas três esferas — federal, estadual e
municipal.

Medido em 2026-08-15: **387 unidades** com área em Minas Gerais.

    esfera        Estadual 198 | Federal 111 | Municipal 78
    grupo         Uso Sustentável 255 | Proteção Integral 132
    categoria     RPPN 200 | Parque 81 | APA 46 | Monumento Natural 28 |
                  Estação Ecológica 11 | Reserva Biológica 6 | Refúgio de
                  Vida Silvestre 6 | Floresta 6 | RDS 3

═══ ARMADILHA 1: A CAMADA "ATUALIZADA" É A QUEBRADA ═══

O GeoServer da INDE publica cinco versões do CNUC. A escolhida é
`MMA:cnuc_26_07_31` (31/07/2026) — a mais recente COM ESQUEMA ÍNTEGRO.

`MMA:cnuc_2026_03_atualizado`, apesar do nome mais tranquilizador, está
**corrompida na origem**: as colunas se chamam `n1`…`n32` e a primeira feição
traz, como valores, os cabeçalhos do shapefile de origem
(`"nome_uc,C,121"`, `"cria_ano,C,80"`…). É um shapefile importado com a linha
de cabeçalho tratada como dado. Quem for atualizar a fonte: **conferir o
esquema antes de trocar de camada** — o nome não diz qual presta.

═══ ARMADILHA 2: `uf` É TEXTO, E UMA UC PODE ESTAR EM VÁRIOS ESTADOS ═══

O campo `uf` guarda a lista por extenso: `"MINAS GERAIS, RIO DE JANEIRO, SÃO
PAULO"` na APA Serra da Mantiqueira. Por isso o filtro é
`uf LIKE '%MINAS GERAIS%'`, e por isso as feições que voltam **não estão
recortadas na divisa** — a Mantiqueira entra inteira, com a parte paulista e
a fluminense. Recortar seria adulterar o limite oficial de uma UC para caber
num mapa estadual; o globo mostra a unidade como ela foi criada, e o campo
`uf` continua na ficha dizendo quais estados ela cruza.

═══ SIMPLIFICAÇÃO: TOLERÂNCIA COM PISO DE ÁREA ═══

8,7 MiB e 291.280 vértices crus. Douglas-Peucker a 0,0001° (~11 m) corta para
34% dos vértices — mas o erro de área se concentra todo nas UCs MINÚSCULAS:
com tolerância uniforme, a pior feição (uma RPPN de sítio) perdia **9,92%** da
área, enquanto os parques grandes perdiam frações de 1%. É aritmética de
perímetro sobre área, não defeito do algoritmo: 11 m de desvio num polígono de
20 ha pesa muito mais que num de 40 mil.

Daí o **piso**: feição com menos de 1e-5 graus² (~120 ha) não é simplificada.
Medido nas 387:

    piso        intactas   vértices   tamanho    pior erro de área
    nenhum             0     34,3%     2,85 MiB      9,92%
    1e-5 deg²         56     34,8%     2,89 MiB      2,67%   ← escolhido
    1e-4 deg²        186     37,9%     3,14 MiB      0,64%

1,5% a mais de vértices derruba o pior erro de 9,92% para 2,67%. O piso de
1e-4 seria ainda mais fiel, mas aí um terço do arquivo deixa de ser
simplificado para ganhar 2 pontos percentuais no pior caso — e o globo roda
em WebGL.

⚠️ **A geometria publicada é para VER, não para medir.** Nenhum cálculo de
interseção deste projeto deve ler este arquivo: quem precisar cruzar UC com
mineração ou barragem baixa a malha completa, como já faz
`calcular_alerta_ti_mancha.py`. A área oficial de cada unidade continua no
campo `area_ha`, que vem da fonte e **não** é recalculada aqui.

Uso:
    python scripts/ingerir_cnuc_unidades_conservacao.py
"""
import gzip
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from shapely.geometry import shape

LOG = "[ingerir_cnuc_unidades_conservacao]"

URL_BASE = "https://geoservicos.inde.gov.br/geoserver/ows"
CAMADA = "MMA:cnuc_26_07_31"
UA = "Mozilla/5.0 (compatible; ControlePopular/1.0; +https://github.com/FinweeJur/controle-popular)"

DIR_CAMADAS = Path(__file__).resolve().parent.parent / "dados" / "camadas"
SAIDA = DIR_CAMADAS / "unidades-conservacao.geojson"

TOLERANCIA_GRAUS = 0.0001      # ~11 m nesta latitude
PISO_AREA_GRAUS2 = 1e-5        # ~120 ha — abaixo disso, não simplifica
CASAS_DECIMAIS = 5             # ~1 m; mais que isso é ruído do shapefile

# Esperado em 2026-08-15. Serve de guarda: a fonte é atualizada e o número
# PODE mudar de verdade (UC nova é criada por decreto), mas uma queda brusca
# é sintoma de filtro quebrado, não de desafetação em massa.
ESPERADO = 387

# O que vai para a ficha do globo. Fora: `ogc_fid`, `gml_id`, `wdpa_pid`,
# `docleg_id`, `uc_id` (identificadores internos), os seis campos de bioma
# (`amazonia`…`pantanal`) — em Minas só Cerrado e Mata Atlântica variam, e a
# ficha não é lugar de seis booleanos —, e `limite`/`the_geom`.
#
# `nome_uc` vira `nome` porque é a chave que `rotulos.js`/`inspector.js` usam
# para o título da ficha (`tituloDaArea`) — mesma convenção das terras
# indígenas e dos imóveis da SPU. Sem isso o título cairia em "Unidades de
# conservação · área 212".
MAPA_CAMPOS = {
    "nome_uc": "nome",
    "cd_cnuc": "cd_cnuc",
    "categoria": "categoria",
    "grupo": "grupo",
    "esfera": "esfera",
    "cat_iucn": "cat_iucn",
    "org_gestor": "org_gestor",
    "uf": "uf",
    "municipio": "municipio",
    "ha_total": "area_ha",
    "cria_ato": "cria_ato",
    "cria_ano": "cria_data",
    "pl_manejo": "plano_manejo",
    "co_gestor": "conselho_gestor",
    "quali_pol": "qualidade_poligono",
    "situacao": "situacao",
}


def _buscar_mg() -> dict:
    params = {
        "service": "WFS", "version": "1.1.0", "request": "GetFeature",
        "typeName": CAMADA, "outputFormat": "application/json",
        "CQL_FILTER": "uf LIKE '%MINAS GERAIS%'",
    }
    url = f"{URL_BASE}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    print(f"{LOG} buscando {CAMADA}, uf LIKE '%MINAS GERAIS%'...")
    with urllib.request.urlopen(req, timeout=600) as resp:
        bruto = resp.read()
    if bruto[:2] == b"\x1f\x8b":
        bruto = gzip.decompress(bruto)

    # A guarda que este projeto já pagou para aprender: o GeoServer aborta o
    # corpo com HTTP 200 e injeta um ExceptionReport no meio do GeoJSON. Ler o
    # CORPO, nunca o status. (Ver docs — camada fatiada e coordenada
    # não-finita produzem exatamente isso.)
    texto = bruto.decode("utf-8", "replace")
    if "ExceptionReport" in texto or "ServiceException" in texto:
        print(f"{LOG} ABORT: o servidor devolveu exceção dentro do corpo:\n"
              f"{texto[:400]}", file=sys.stderr)
        sys.exit(1)
    return json.loads(texto)


def _arredondar(obj):
    if isinstance(obj, float):
        return round(obj, CASAS_DECIMAIS)
    if isinstance(obj, list):
        return [_arredondar(x) for x in obj]
    return obj


def _simplificar(geom_dict: dict) -> dict | None:
    g = shape(geom_dict)
    if g.is_empty:
        return None
    if g.area >= PISO_AREA_GRAUS2:
        gs = g.simplify(TOLERANCIA_GRAUS, preserve_topology=True)
        # Simplify pode esvaziar uma geometria degenerada. Perder a feição é
        # pior que publicá-la com vértices demais.
        if not gs.is_empty:
            g = gs
    saida = g.__geo_interface__
    return {"type": saida["type"], "coordinates": _arredondar(list(saida["coordinates"]))}


def main() -> None:
    dados = _buscar_mg()
    brutas = dados.get("features", [])
    print(f"{LOG} {len(brutas)} feição(ões) recebida(s).")
    if not brutas:
        print(f"{LOG} ABORT: nada veio — não sobrescrevo a camada existente.", file=sys.stderr)
        sys.exit(1)
    if len(brutas) != ESPERADO:
        print(f"{LOG} AVISO: esperava {ESPERADO} UCs em MG (medido em 2026-08-15) e a "
              f"fonte devolveu {len(brutas)}. Criação de UC nova por decreto é normal; "
              f"queda brusca é sintoma de filtro quebrado. Conferir antes de publicar.")

    saida = []
    sem_geometria = 0
    for f in brutas:
        geom = _simplificar(f["geometry"]) if f.get("geometry") else None
        if geom is None:
            sem_geometria += 1
            continue
        props = {}
        for origem, destino in MAPA_CAMPOS.items():
            v = f["properties"].get(origem)
            props[destino] = v.strip() if isinstance(v, str) else v
        saida.append({"type": "Feature", "properties": props, "geometry": geom})

    if sem_geometria:
        print(f"{LOG} {sem_geometria} feição(ões) sem geometria utilizável, descartada(s).")

    DIR_CAMADAS.mkdir(parents=True, exist_ok=True)
    texto = json.dumps(
        {"type": "FeatureCollection", "features": saida}, ensure_ascii=False
    )
    SAIDA.write_text(texto, encoding="utf-8")
    print(f"{LOG} {len(saida)} unidade(s) em {SAIDA.name} "
          f"({len(texto.encode('utf-8'))/1024**2:.2f} MiB).")


if __name__ == "__main__":
    main()
