"""
gerar-camadas-telefonia.py — gera as camadas de telefonia móvel para o Globo 3D

Fonte oficial: Anatel (Agência Nacional de Telecomunicações) — Sistema Mosaico
Base: Licenciamento de Estações do Serviço Móvel Pessoal (SMP, serviço 010) em Minas Gerais.
Data da extração: 2026-09-08

Produz:
1. As Torres (Pontos):
   - apps/web/public/terras/globo/dados/camadas/torres-celular-prioritarias.geojson (Vales + Bacia)
   - apps/web/public/terras/globo/dados/camadas/torres-celular-mg.geojson (Estado de MG inteiro)
2. A Mancha de Cobertura (Polígonos de sinal):
   - apps/web/public/terras/globo/dados/camadas/cobertura-telefonia-prioritarias.geojson
   - apps/web/public/terras/globo/dados/camadas/cobertura-telefonia-mg.geojson.gz
"""

import zipfile
import csv
import io
import json
import os
import re
import math
import gzip
import unicodedata
from collections import defaultdict

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ_REPO = os.path.abspath(os.path.join(AQUI, '..'))
CAMADAS_DIR = os.path.join(RAIZ_REPO, 'apps', 'web', 'public', 'terras', 'globo', 'dados', 'camadas')
SCRATCH_DIR = 'C:/Users/Home/.gemini/antigravity/brain/6dcad736-6409-42c8-ab9e-6c9636fb02ca/scratch'
ZIP_PATH = os.path.join(SCRATCH_DIR, 'anatel_mg.zip')

def normalizar(s):
    if not s: return ""
    return unicodedata.normalize('NFKD', s).encode('ASCII', 'ignore').decode('ASCII').lower().strip()

def carregar_municipios_prioritarios():
    vales_geocodigos = set()
    meso_file = os.path.join(RAIZ_REPO, 'apps', 'web', 'public', 'terras', 'globo', 'js', 'data', 'mesorregioes.js')
    with open(meso_file, encoding='utf-8') as f:
        text = f.read()
        for m in re.finditer(r"\['(\d{7})',\s*\{\s*meso:\s*'([^']+)'", text):
            vales_geocodigos.add(m.group(1))

    munis_mg_file = os.path.join(CAMADAS_DIR, 'municipios-mg.geojson')
    with open(munis_mg_file, encoding='utf-8') as f:
        munis_mg = json.load(f)

    nome_norm_para_geo = {}
    for feat in munis_mg['features']:
        props = feat['properties']
        nome_norm_para_geo[normalizar(props['nome'])] = str(props['geocodigo'])

    paraopeba_nomes = [
        'abaete', 'betim', 'biquinhas', 'brumadinho', 'caetanopolis', 'curvelo',
        'esmeraldas', 'felixlandia', 'florestal', 'fortuna de minas', 'igarape',
        'juatuba', 'maravilhas', 'mario campos', 'mateus leme', 'morada nova de minas',
        'paineiras', 'papagaios', 'para de minas', 'paraopeba', 'pequi', 'pompeu',
        'sao goncalo do abaete', 'sao joaquim de bicas', 'sao jose da varginha', 'tres marias',
        'belo horizonte', 'contagem'
    ]

    bacia_geocodigos = set()
    for p in paraopeba_nomes:
        geo = nome_norm_para_geo.get(normalizar(p))
        if geo:
            bacia_geocodigos.add(geo)

    prioritarios = vales_geocodigos.union(bacia_geocodigos)
    return prioritarios, vales_geocodigos, bacia_geocodigos

def classificar_geracao(tecs):
    if 'NR' in tecs:
        return '5G'
    if 'LTE' in tecs:
        return '4G'
    if 'WCDMA' in tecs or 'WDCMA' in tecs:
        return '3G'
    if 'GSM' in tecs:
        return '2G'
    return 'Outra'

def raio_cobertura_km(geracao, altura_m):
    # Raio de cobertura estimado de propagação em relevo
    # Ajustado pela geração máxima e altura da antena
    base_km = 6.0
    if geracao == '5G':
        base_km = 3.0
    elif geracao == '4G':
        base_km = 6.5
    elif geracao == '3G':
        base_km = 9.0
    elif geracao == '2G':
        base_km = 12.0

    # Bônus de visada para torres mais altas (>40m)
    if altura_m >= 50:
        base_km *= 1.25
    elif altura_m >= 30:
        base_km *= 1.10
    elif altura_m < 15 and altura_m > 0:
        base_km *= 0.85

    return round(base_km, 2)

def gerar_poligono_circulo(lat, lon, raio_km, num_pontos=8):
    # Converte raio em km para deslocamento aproximado em graus
    # 1 grau lat ~ 111.139 km
    d_lat = raio_km / 111.139
    # 1 grau lon ~ 111.139 * cos(lat)
    rad_lat = math.radians(lat)
    d_lon = raio_km / (111.139 * math.cos(rad_lat))

    coords = []
    for i in range(num_pontos):
        ang = (2 * math.pi * i) / num_pontos
        c_lon = round(lon + d_lon * math.cos(ang), 5)
        c_lat = round(lat + d_lat * math.sin(ang), 5)
        coords.append([c_lon, c_lat])
    coords.append(coords[0]) # fechar anel
    return [coords]

def extrair_e_gerar():
    prioritarios, vales, bacia = carregar_municipios_prioritarios()
    print(f"Municípios prioritários: {len(prioritarios)} (Vales: {len(vales)}, Bacia/RMBH: {len(bacia)})")

    estacoes_por_chave = {}

    with zipfile.ZipFile(ZIP_PATH) as z:
        name = z.namelist()[0]
        with z.open(name) as f:
            stream = io.TextIOWrapper(f, encoding='latin1', errors='ignore')
            reader = csv.reader(stream, delimiter='|')
            header = next(reader)
            idx_entidade = header.index('NomeEntidade')
            idx_servico = header.index('NumServico')
            idx_estacao = header.index('NumEstacao')
            idx_cod_muni = header.index('CodMunicipio')
            idx_nome_muni = header.index('Municipio.NomeMunicipio')
            idx_tec = header.index('Tecnologia')
            idx_lat = header.index('Latitude')
            idx_lon = header.index('Longitude')
            idx_altura = header.index('AlturaAntena')

            for row in reader:
                if not row or len(row) <= idx_lon:
                    continue
                if row[idx_servico].strip() != '010':
                    continue

                cod_muni = row[idx_cod_muni].strip()
                entidade = row[idx_entidade].strip()
                estacao_id = row[idx_estacao].strip()
                tec = row[idx_tec].strip()
                altura_str = row[idx_altura].strip()
                nome_muni = row[idx_nome_muni].strip()

                try:
                    lat = float(row[idx_lat].replace(',', '.'))
                    lon = float(row[idx_lon].replace(',', '.'))
                except ValueError:
                    continue

                if not (-23.5 <= lat <= -14.0 and -51.5 <= lon <= -39.0):
                    continue

                operadora = 'Outras'
                ent_upper = entidade.upper()
                if 'TELEFONICA' in ent_upper or 'VIVO' in ent_upper:
                    operadora = 'Vivo'
                elif 'CLARO' in ent_upper:
                    operadora = 'Claro'
                elif 'TIM' in ent_upper:
                    operadora = 'TIM'
                elif 'ALGAR' in ent_upper or 'CTBC' in ent_upper:
                    operadora = 'Algar'

                chave = (round(lat, 5), round(lon, 5), operadora)
                if chave not in estacoes_por_chave:
                    try:
                        alt = float(altura_str.replace(',', '.'))
                    except ValueError:
                        alt = 0.0
                    estacoes_por_chave[chave] = {
                        'lat': round(lat, 6),
                        'lon': round(lon, 6),
                        'operadora': operadora,
                        'cod_ibge': cod_muni,
                        'municipio': nome_muni,
                        'tecnologias': set(),
                        'altura_max': alt,
                        'num_estacao': estacao_id
                    }

                if tec:
                    estacoes_por_chave[chave]['tecnologias'].add(tec)
                try:
                    alt = float(altura_str.replace(',', '.'))
                    if alt > estacoes_por_chave[chave]['altura_max']:
                        estacoes_por_chave[chave]['altura_max'] = alt
                except ValueError:
                    pass

    torres_todas = list(estacoes_por_chave.values())
    torres_prioritarias = [t for t in torres_todas if t['cod_ibge'] in prioritarios]

    print(f"Total torres MG: {len(torres_todas)}")
    print(f"Total torres prioritárias: {len(torres_prioritarias)}")

    # 1. PONTOS (Torres)
    def montar_pontos(torres_lista, nome_camada):
        features = []
        for t in torres_lista:
            geracao = classificar_geracao(t['tecnologias'])
            tecs_ordenadas = sorted(list(t['tecnologias']))
            feat = {
                "type": "Feature",
                "properties": {
                    "operadora": t['operadora'],
                    "geracao_max": geracao,
                    "tecnologias": ", ".join(tecs_ordenadas),
                    "municipio": t['municipio'],
                    "cod_ibge": t['cod_ibge'],
                    "altura_m": round(t['altura_max'], 1),
                    "ponto_lat": t['lat'],
                    "ponto_lon": t['lon']
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [t['lon'], t['lat']]
                }
            }
            features.append(feat)
        return {
            "type": "FeatureCollection",
            "name": nome_camada,
            "features": features
        }

    # 2. POLÍGONOS (Manchas de Cobertura)
    def montar_poligonos_cobertura(torres_lista, nome_camada):
        features = []
        for t in torres_lista:
            geracao = classificar_geracao(t['tecnologias'])
            raio = raio_cobertura_km(geracao, t['altura_max'])
            poly_coords = gerar_poligono_circulo(t['lat'], t['lon'], raio, num_pontos=8)
            feat = {
                "type": "Feature",
                "properties": {
                    "operadora": t['operadora'],
                    "geracao_max": geracao,
                    "raio_estimado_km": raio,
                    "municipio": t['municipio'],
                    "cod_ibge": t['cod_ibge'],
                    "ponto_lat": t['lat'],
                    "ponto_lon": t['lon']
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": poly_coords
                }
            }
            features.append(feat)
        return {
            "type": "FeatureCollection",
            "name": nome_camada,
            "features": features
        }

    # --- ETAPA 1A: Torres Prioritárias ---
    fc_prio_pontos = montar_pontos(torres_prioritarias, "torres-celular-prioritarias")
    path_prio_pontos = os.path.join(CAMADAS_DIR, 'torres-celular-prioritarias.geojson')
    with open(path_prio_pontos, 'w', encoding='utf-8') as f:
        json.dump(fc_prio_pontos, f, ensure_ascii=False)
    print(f"[OK] {path_prio_pontos} ({os.path.getsize(path_prio_pontos) / 1024:.1f} KB)")

    # --- ETAPA 1B: Torres MG Inteiro ---
    fc_mg_pontos = montar_pontos(torres_todas, "torres-celular-mg")
    path_mg_pontos = os.path.join(CAMADAS_DIR, 'torres-celular-mg.geojson')
    with open(path_mg_pontos, 'w', encoding='utf-8') as f:
        json.dump(fc_mg_pontos, f, ensure_ascii=False)
    print(f"[OK] {path_mg_pontos} ({os.path.getsize(path_mg_pontos) / 1024 / 1024:.2f} MB)")

    # --- ETAPA 2A: Manchas de Cobertura Prioritárias ---
    fc_prio_poly = montar_poligonos_cobertura(torres_prioritarias, "cobertura-telefonia-prioritarias")
    path_prio_poly = os.path.join(CAMADAS_DIR, 'cobertura-telefonia-prioritarias.geojson')
    with open(path_prio_poly, 'w', encoding='utf-8') as f:
        json.dump(fc_prio_poly, f, ensure_ascii=False)
    print(f"[OK] {path_prio_poly} ({os.path.getsize(path_prio_poly) / 1024 / 1024:.2f} MB)")

    # --- ETAPA 2B: Manchas de Cobertura MG Inteiro (comprimido gzip) ---
    fc_mg_poly = montar_poligonos_cobertura(torres_todas, "cobertura-telefonia-mg")
    json_mg_poly_bytes = json.dumps(fc_mg_poly, ensure_ascii=False).encode('utf-8')
    path_mg_poly_gz = os.path.join(CAMADAS_DIR, 'cobertura-telefonia-mg.geojson.gz')
    with open(path_mg_poly_gz, 'wb') as f:
        f.write(gzip.compress(json_mg_poly_bytes, compresslevel=9))
    print(f"[OK] {path_mg_poly_gz} ({os.path.getsize(path_mg_poly_gz) / 1024 / 1024:.2f} MB comprimido gzip)")

    # --- ETAPA 3: Estatísticas de Cobertura por Município ---
    por_mun = defaultdict(lambda: {'total': 0, 'ops': defaultdict(int), 'ger_max': defaultdict(str), 'nome': ''})
    for t in torres_todas:
        cod = str(t['cod_ibge'])
        op = t['operadora']
        ger = classificar_geracao(t['tecnologias'])
        nome = t['municipio']
        if not cod:
            continue
        por_mun[cod]['total'] += 1
        por_mun[cod]['ops'][op] += 1
        por_mun[cod]['nome'] = nome
        if ger == '5G' or (ger == '4G' and por_mun[cod]['ger_max'][op] != '5G'):
            por_mun[cod]['ger_max'][op] = ger
        elif not por_mun[cod]['ger_max'][op]:
            por_mun[cod]['ger_max'][op] = ger

    resumo_municipios = {}
    for cod, item in sorted(por_mun.items()):
        tot = item['total']
        ops_list = []
        has_5g = False
        for op, cnt in sorted(item['ops'].items(), key=lambda x: x[1], reverse=True):
            g = item['ger_max'][op] or '4G'
            if g == '5G':
                has_5g = True
            pct = round((cnt / tot) * 100)
            ops_list.append({'operadora': op, 'torres': cnt, 'pct': pct, 'geracao_max': g})

        lider = ops_list[0] if ops_list else None
        resumo_municipios[cod] = {
            'municipio': item['nome'],
            'total_torres': tot,
            'tem_5g': has_5g,
            'lider': lider,
            'ranking': ops_list
        }

    path_data_json = os.path.join(RAIZ_REPO, 'apps', 'web', 'data', 'telefonia-municipios-mg.json')
    with open(path_data_json, 'w', encoding='utf-8') as f:
        json.dump(resumo_municipios, f, ensure_ascii=False, indent=2)
    print(f"[OK] {path_data_json} ({os.path.getsize(path_data_json) / 1024:.1f} KB)")

if __name__ == '__main__':
    extrair_e_gerar()

