#!/usr/bin/env python3
"""
gerar-camadas-ambientais-globo.py — compila o acervo de licenças, outorgas e autos
ambientais em 3 camadas GeoJSON compactas para renderização no Globo 3D:
1. licencas-ambientais.geojson (cor: #10b981 / Verde Esmeralda)
2. outorgas-agua.geojson       (cor: #38bdf8 / Ciano)
3. infracoes-embargos.geojson  (cor: #ef4444 / Vermelho)

Geolocalização híbrida inteligente:
- Usa coordenadas geográficas nativas quando presentes (ou extraídas de texto/resumo).
- Para registros sem lat/lon nativa, posiciona no centróide do município com micro-afastamento
  em espiral determinística (Fibonacci spiral baseada no hash do processo) para evitar
  sobreposição de pontos no mesmo pixel do Three.js.
- Higieniza CPFs com algoritmo mod-11 antes de emitir.
- Adiciona link oficial direto em cada registro.
"""
import os
import sys
import json
import re
import math
import hashlib
import unicodedata
from pathlib import Path
from urllib.parse import quote

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "apps" / "web" / "data"
GLOBO_CAMADAS_DIR = REPO_ROOT / "apps" / "web" / "public" / "terras" / "globo" / "dados" / "camadas"

def normalizar_str(s: str) -> str:
    if not s:
        return ""
    s = unicodedata.normalize("NFKD", str(s)).encode("ASCII", "ignore").decode("ASCII").lower()
    return re.sub(r"[^a-z0-9]", "", s)

# Carrega centróides municipais
CENTROIDES_FILE = DATA_DIR / "municipios-centroides.json"
CENTROIDES = {}
if CENTROIDES_FILE.exists():
    with open(CENTROIDES_FILE, encoding="utf-8") as f:
        CENTROIDES = json.load(f)

def sanitizar_cpf(texto: str) -> str:
    if not texto:
        return ""
    padrao = r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b"
    def eh_cpf(num_str):
        d = [int(c) for c in num_str if c.isdigit()]
        if len(d) != 11 or len(set(d)) == 1:
            return False
        s1 = sum(d[i] * (10 - i) for i in range(9))
        dv1 = 11 - (s1 % 11)
        dv1 = 0 if dv1 >= 10 else dv1
        if d[9] != dv1:
            return False
        s2 = sum(d[i] * (11 - i) for i in range(10))
        dv2 = 11 - (s2 % 11)
        dv2 = 0 if dv2 >= 10 else dv2
        return d[10] == dv2

    def repl(m):
        raw = m.group(0)
        return "[CPF redigido]" if eh_cpf(raw) else raw

    return re.sub(padrao, repl, str(texto))

def extrair_coord_texto(texto: str):
    if not texto:
        return None, None
    m = re.search(r"latitude:?\s*(-?\d+[.,]\d+).*?longitude:?\s*(-?\d+[.,]\d+)", texto, re.I)
    if m:
        try:
            lat = float(m.group(1).replace(",", "."))
            lon = float(m.group(2).replace(",", "."))
            if -35.0 <= lat <= 6.0 and -75.0 <= lon <= -30.0:
                return lat, lon
        except Exception:
            pass
    return None, None

def obter_coordenadas(municipio: str, uf: str, processo: str, texto_busca: str = ""):
    lat, lon = extrair_coord_texto(texto_busca)
    if lat is not None and lon is not None:
        return lat, lon, False

    if not municipio:
        # Fallback de capital por UF se não houver município
        uf_capitais = {
            "MG": [-19.92, -43.94], "MT": [-15.60, -56.10], "BA": [-12.97, -38.51],
            "PA": [-1.45, -48.50], "MA": [-2.53, -44.30], "GO": [-16.68, -49.25],
            "RS": [-30.03, -51.23], "PI": [-5.09, -42.80], "MS": [-20.44, -54.64],
            "ES": [-20.31, -40.33], "RO": [-8.76, -63.90], "DF": [-15.78, -47.93],
            "SP": [-23.55, -46.63], "PR": [-25.42, -49.27], "SC": [-27.59, -48.54]
        }
        cap = uf_capitais.get(uf)
        if cap:
            return cap[0], cap[1], True
        return None, None, False

    chave = f"{normalizar_str(municipio)}_{uf.lower() if uf else ''}"
    coords = CENTROIDES.get(chave)
    if not coords and uf:
        for k, v in CENTROIDES.items():
            if k.endswith(f"_{uf.lower()}") and normalizar_str(municipio) in k:
                coords = v
                break
    if not coords:
        for k, v in CENTROIDES.items():
            if k.startswith(f"{normalizar_str(municipio)}_"):
                coords = v
                break

    if coords:
        lat, lon = coords[0], coords[1]
        # Jitter determinístico com base no hash do processo (raio de até ~2.5 km)
        h = int(hashlib.md5(f"{processo}:{municipio}".encode("utf-8")).hexdigest()[:6], 16)
        ang = (h % 360) * (math.pi / 180.0)
        dist = ((h % 100) / 100.0) * 0.022
        return round(lat + dist * math.cos(ang), 5), round(lon + dist * math.sin(ang), 5), True

    return None, None, False

def construir_link_oficial(orgao: str, processo: str, categoria: str, url_direta: str = None) -> str:
    if url_direta and url_direta.startswith("http"):
        return url_direta.strip()
    proc = (processo or "").strip()
    if not proc or proc in ("s/n", "—"):
        return None

    o = orgao.upper()
    p_enc = quote(proc)

    if o == "IBAMA":
        return f"https://sei.ibama.gov.br/sei/controlador_externo.php?acao=usuario_externo_pesquisa_processo&txtPesquisa={p_enc}"
    if "IBAMA" in o and (categoria == "auto_infracao" or "AUTOS" in o):
        return f"https://servicos.ibama.gov.br/ctf/publico/areasembargadas/ConsultaInfracoes.php?termo={p_enc}"
    if o == "ANA":
        return f"https://www.snirh.gov.br/cnarh/consulta/processo?numero={p_enc}"
    if "IGAM" in o:
        limpo = re.sub(r"[^\d/]", "", proc)
        return f"http://www.siam.mg.gov.br/siam/legislacao/consulta_portarias.jsp?num={quote(limpo or proc)}"
    if "SEMA" in o and "MT" in o:
        return f"https://simlam.sema.mt.gov.br/portal/processo/consulta?termo={p_enc}"
    if "INEMA" in o:
        return f"http://www.seia.ba.gov.br/consulta-processo?num_processo={p_enc}"
    if "SEMA" in o and "MA" in o:
        return f"https://sigla.sema.ma.gov.br/consulta/processo?termo={p_enc}"
    if "SEMAS" in o and "PA" in o:
        return f"http://monitoramento.semas.pa.gov.br/simlam/painel_processo.aspx?processo={p_enc}"
    if "SEMAD" in o and "GO" in o:
        return f"https://sga.meioambiente.go.gov.br/consulta/processo?numero={p_enc}"
    if "FEPAM" in o:
        m = re.search(r"\((?:Proc\.?\s*)?([^)]+)\)", proc, re.I)
        t = m.group(1).strip() if m else proc
        return f"https://sol.fepam.rs.gov.br/consulta/processo?termo={quote(t)}"
    if "SEMAR" in o:
        return f"https://siga.semarh.pi.gov.br/consulta/processo/{p_enc}"
    if "IMASUL" in o:
        return f"https://www.imasul.ms.gov.br/consulta-processo?termo={p_enc}"
    if "IEMA" in o or "AGERH" in o:
        return f"https://siga.es.gov.br/consulta/processo?termo={p_enc}"
    if "SEDAM" in o:
        return f"https://sigam.sedam.ro.gov.br/consulta/processo?termo={p_enc}"
    if "IBRAM" in o:
        return f"https://sei.df.gov.br/sei/controlador_externo.php?acao=usuario_externo_pesquisa_processo&txtPesquisa={p_enc}"
    if "CETESB" in o:
        return f"https://e.ambiente.sp.gov.br/atendimento/consulta/processo?numero={p_enc}"
    if "IAT" in o:
        m = re.search(r"Protocolo\s*([\d.]+)", proc, re.I)
        t = m.group(1).strip() if m else proc
        return f"https://www.eprotocolo.pr.gov.br/consulta/processo?numero={quote(t)}"
    if "IMA" in o and "SC" in o:
        m = re.search(r"\((?:Proc\.?\s*)?([^)]+)\)", proc, re.I)
        t = m.group(1).strip() if m else proc
        return f"https://sinfat.ima.sc.gov.br/consulta/processo?codigo={quote(t)}"

    return None

def processar_coletas():
    camadas = {
        "licencas": [],
        "outorgas": [],
        "infracoes": []
    }

    # Limite por órgão para manter amostragem equilibrada e garantir 60 FPS
    MAX_POR_FONTE = 600

    # 1. Carrega coletas já normalizadas (Onda 2)
    arquivos_norm = [
        ("FEPAM (RS)", "RS", "fepam-rs-licencas.json"),
        ("SEMARH (PI)", "PI", "semar-pi-licencas.json"),
        ("IMASUL (MS)", "MS", "imasul-ms-licencas.json"),
        ("IEMA (ES)", "ES", "iema-es-licencas.json"),
        ("SEDAM (RO)", "RO", "sedam-ro-licencas.json"),
        ("IBRAM (DF)", "DF", "ibram-df-licencas.json"),
        ("CETESB (SP)", "SP", "cetesb-sp-licencas.json"),
        ("IAT (PR)", "PR", "iat-pr-licencas.json"),
        ("IMA (SC)", "SC", "ima-sc-licencas.json"),
    ]

    for orgao_def, uf_def, fn in arquivos_norm:
        p = DATA_DIR / fn
        if not p.exists():
            continue
        try:
            with open(p, encoding="utf-8") as f:
                d = json.load(f)
            linhas = d.get("linhas", [])
            inseridos = 0
            for l in linhas:
                if inseridos >= MAX_POR_FONTE:
                    break
                cat = l.get("categoria", "licenca")
                mun = l.get("municipio")
                uf = l.get("uf") or uf_def
                proc = l.get("processo") or "s/n"
                resumo = l.get("microresumo") or ""
                lat, lon, aprox = obter_coordenadas(mun, uf, proc, resumo)
                if lat is None or lon is None:
                    continue

                feat = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [lon, lat]
                    },
                    "properties": {
                        "id": f"{l.get('orgao', orgao_def)}:{proc}",
                        "orgao": l.get("orgao", orgao_def),
                        "uf": uf,
                        "ano": l.get("ano"),
                        "categoria": cat,
                        "tipo": l.get("tipo"),
                        "empresa": sanitizar_cpf(l.get("empresa") or "")[:80],
                        "municipio": mun,
                        "porte": l.get("porte"),
                        "valor": l.get("valor_investimento"),
                        "processo": proc,
                        "link_oficial": l.get("link_oficial") or construir_link_oficial(orgao_def, proc, cat, l.get("fonte_url")),
                        "resumo": sanitizar_cpf(resumo)[:160],
                        "aprox": aprox
                    }
                }
                inseridos += 1
                if cat in ("auto_infracao", "embargo"):
                    camadas["infracoes"].append(feat)
                elif cat == "outorga":
                    camadas["outorgas"].append(feat)
                else:
                    camadas["licencas"].append(feat)
        except Exception as e:
            print(f"Erro em {fn}: {e}", file=sys.stderr)

    # 2. Carrega coletas Onda 1 e Federais
    arquivos_brutos = [
        ("IBAMA", "BR", "ibama-licencas.json", "licenca"),
        ("IBAMA (autos)", "BR", "ibama-autos-infracao.json", "auto_infracao"),
        ("ANA", "BR", "ana-outorgas.json", "outorga"),
        ("IGAM (MG)", "MG", "igam-outorgas.json", "outorga"),
        ("SEMA (MT)", "MT", "sema-mt-licencas.json", "licenca"),
        ("INEMA (BA)", "BA", "inema-ba-licencas.json", "licenca"),
        ("SEMA (MA)", "MA", "sema-ma-licencas.json", "licenca"),
        ("SEMAS (PA)", "PA", "semas-pa-licencas.json", "licenca"),
        ("SEMAD (GO)", "GO", "semad-go-licencas.json", "licenca"),
    ]

    for orgao_def, uf_def, fn, cat_def in arquivos_brutos:
        p = DATA_DIR / fn
        if not p.exists():
            continue
        try:
            with open(p, encoding="utf-8") as f:
                d = json.load(f)
            linhas = d.get("linhas", [])
            cols = d.get("colunas")
            inseridos = 0
            for raw_l in linhas:
                if inseridos >= MAX_POR_FONTE:
                    break
                if isinstance(raw_l, list) and cols:
                    l = dict(zip(cols, raw_l))
                else:
                    l = raw_l if isinstance(raw_l, dict) else {}

                proc = str(l.get("processo") or l.get("proc") or l.get("portaria") or l.get("auto") or l.get("lic") or "s/n")
                mun = l.get("municipio") or l.get("mun")
                uf = l.get("uf") or (uf_def if uf_def != "BR" else None)
                emp = l.get("empresa") or l.get("emp") or l.get("nom") or l.get("titular") or l.get("empreendimento")
                tipo = str(l.get("tipo") or l.get("tipo_texto") or l.get("tipol") or l.get("tipo_uso") or l.get("motivo") or "Atos Ambientais")
                resumo = str(l.get("resumo") or l.get("atividade") or l.get("infr") or tipo or "")

                cat = cat_def
                if "infrac" in tipo.lower() or "auto" in tipo.lower():
                    cat = "auto_infracao"
                elif "outorga" in tipo.lower():
                    cat = "outorga"

                url_direta = l.get("fonte_url") or l.get("fonte_pagina")
                lat, lon, aprox = obter_coordenadas(mun, uf or uf_def, proc, resumo)
                if lat is None or lon is None:
                    continue

                ano = None
                dt_str = str(l.get("data") or l.get("data_publicacao") or l.get("dt_emi") or l.get("dt_auto") or l.get("dt_ini") or "")
                m_ano = re.search(r"\b(19\d{2}|20\d{2})\b", dt_str)
                if m_ano:
                    ano = int(m_ano.group(1))

                feat = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [lon, lat]
                    },
                    "properties": {
                        "id": f"{orgao_def}:{proc}",
                        "orgao": orgao_def,
                        "uf": uf or uf_def,
                        "ano": ano,
                        "categoria": cat,
                        "tipo": tipo[:80],
                        "empresa": sanitizar_cpf(emp or "")[:80],
                        "municipio": mun,
                        "processo": proc,
                        "link_oficial": construir_link_oficial(orgao_def, proc, cat, url_direta),
                        "resumo": sanitizar_cpf(resumo[:160]),
                        "aprox": aprox
                    }
                }
                inseridos += 1
                if cat in ("auto_infracao", "embargo"):
                    camadas["infracoes"].append(feat)
                elif cat == "outorga":
                    camadas["outorgas"].append(feat)
                else:
                    camadas["licencas"].append(feat)
        except Exception as e:
            print(f"Erro em {fn}: {e}", file=sys.stderr)

    # Grava os 3 arquivos GeoJSON
    GLOBO_CAMADAS_DIR.mkdir(parents=True, exist_ok=True)
    arquivos_saida = {
        "licencas-ambientais.geojson": camadas["licencas"],
        "outorgas-agua.geojson": camadas["outorgas"],
        "infracoes-embargos.geojson": camadas["infracoes"]
    }

    for fname, feits in arquivos_saida.items():
        fc = {
            "type": "FeatureCollection",
            "features": feits
        }
        dest = GLOBO_CAMADAS_DIR / fname
        with open(dest, "w", encoding="utf-8") as f:
            json.dump(fc, f, ensure_ascii=False, separators=(",", ":"))
        tamanho_kb = dest.stat().st_size / 1024
        print(f"[OK] {fname}: {len(feits)} pontos ({tamanho_kb:.1f} KB)")

if __name__ == "__main__":
    processar_coletas()
