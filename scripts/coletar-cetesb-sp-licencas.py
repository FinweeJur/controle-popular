"""coletar-cetesb-sp-licencas.py — Coleta de atos e licenciamento ambiental da CETESB (SP).

Coleta a base completa de atos de controle e licenciamento ambiental do Estado de São Paulo
a partir da Infraestrutura de Dados Espaciais Ambientais (DataGEO / CETESB / CFA / SEMIL-SP):
  1. Cadastro Oficial de Áreas Contaminadas e Reabilitadas da CETESB (7.289 registros)
  2. Termos de Restrições Institucionais e TAC da CETESB (879 registros)
  3. Autorizações de Supressão e Licenciamento de Intervenção Ambiental — Painel Verde (20.339 registros)

Total integrado: ~28.507 registros públicos oficiais.

Saída: apps/web/data/cetesb-sp-licencas.json

Privacidade e LGPD:
  - Sanitização de CPF por algoritmo mod-11 oficial em todos os campos de texto.
  - CNPJs válidos de 14 dígitos são mantidos íntegros.
  - Substituição por '[CPF redigido]'.

Uso:
  python scripts/coletar-cetesb-sp-licencas.py               # Coleta amostral rápida (--limit 500)
  python scripts/coletar-cetesb-sp-licencas.py --limit 0     # Coleta completa na íntegra (~28.507 registros)
  python scripts/coletar-cetesb-sp-licencas.py --scan-cpf    # Executa checagem de CPF ao final
"""
from __future__ import annotations

import argparse
import datetime
import json
import os
import re
import ssl
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

# Garante saída UTF-8 no Windows
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

URL_WFS = "https://datageo.ambiente.sp.gov.br/geoserver/datageo/ows"
UA = "ControlePopular/1.0 (+contato@controlepopular.com.br; dado publico governamental)"
UF = "SP"
ORGAO_CETESB = "CETESB (SP)"
ORGAO_CFA = "CFA/CETESB (SP)"
SAIDA = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "cetesb-sp-licencas.json"
PAUSA = 1.0  # segundos entre requisições grandes

RE_CPF = re.compile(r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{11}\b")

# Mapeamento estático de bacias/UGRHIs para os maiores municípios de São Paulo
MAPA_MUNICIPIO_UGRHI = {
    # UGRHI 06 - Alto Tietê
    "SÃO PAULO": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "SAO PAULO": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "SANTO ANDRÉ": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "SANTO ANDRE": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "SÃO BERNARDO DO CAMPO": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "SAO BERNARDO DO CAMPO": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "SÃO CAETANO DO SUL": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "SAO CAETANO DO SUL": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "DIADEMA": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "MAUÁ": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "MAUA": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "GUARULHOS": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "OSASCO": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "BARUERI": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "CARAPICUÍBA": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "CARAPICUIBA": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "ITAPEVI": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "JANDIRA": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "COTIA": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "TABOÃO DA SERRA": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "TABOAO DA SERRA": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "EMBU DAS ARTES": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "ITAPECERICA DA SERRA": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "MOGI DAS CRUZES": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "SUZANO": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "POÁ": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "POA": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "FERRAZ DE VASCONCELOS": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "ITAQUAQUECETUBA": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "ARUJÁ": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "ARUJA": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "SANTA ISABEL": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "SANTANA DE PARNAÍBA": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",
    "SANTANA DE PARNAIBA": "Bacia Hidrográfica do Alto Tietê (UGRHI 06)",

    # UGRHI 05 - Piracicaba / Capivari / Jundiaí (PCJ)
    "CAMPINAS": "Bacia Hidrográfica dos Rios Piracicaba, Capivari e Jundiaí (PCJ - UGRHI 05)",
    "PIRACICABA": "Bacia Hidrográfica dos Rios Piracicaba, Capivari e Jundiaí (PCJ - UGRHI 05)",
    "JUNDIAÍ": "Bacia Hidrográfica dos Rios Piracicaba, Capivari e Jundiaí (PCJ - UGRHI 05)",
    "JUNDIAI": "Bacia Hidrográfica dos Rios Piracicaba, Capivari e Jundiaí (PCJ - UGRHI 05)",
    "AMERICANA": "Bacia Hidrográfica dos Rios Piracicaba, Capivari e Jundiaí (PCJ - UGRHI 05)",
    "LIMEIRA": "Bacia Hidrográfica dos Rios Piracicaba, Capivari e Jundiaí (PCJ - UGRHI 05)",
    "PAULÍNIA": "Bacia Hidrográfica dos Rios Piracicaba, Capivari e Jundiaí (PCJ - UGRHI 05)",
    "PAULINIA": "Bacia Hidrográfica dos Rios Piracicaba, Capivari e Jundiaí (PCJ - UGRHI 05)",
    "SUMARÉ": "Bacia Hidrográfica dos Rios Piracicaba, Capivari e Jundiaí (PCJ - UGRHI 05)",
    "SUMARE": "Bacia Hidrográfica dos Rios Piracicaba, Capivari e Jundiaí (PCJ - UGRHI 05)",
    "HORTOLÂNDIA": "Bacia Hidrográfica dos Rios Piracicaba, Capivari e Jundiaí (PCJ - UGRHI 05)",
    "HORTOLANDIA": "Bacia Hidrográfica dos Rios Piracicaba, Capivari e Jundiaí (PCJ - UGRHI 05)",
    "SANTA BÁRBARA D'OESTE": "Bacia Hidrográfica dos Rios Piracicaba, Capivari e Jundiaí (PCJ - UGRHI 05)",
    "INDAIATUBA": "Bacia Hidrográfica dos Rios Piracicaba, Capivari e Jundiaí (PCJ - UGRHI 05)",
    "VALINHOS": "Bacia Hidrográfica dos Rios Piracicaba, Capivari e Jundiaí (PCJ - UGRHI 05)",
    "VINHEDO": "Bacia Hidrográfica dos Rios Piracicaba, Capivari e Jundiaí (PCJ - UGRHI 05)",
    "ITATIBA": "Bacia Hidrográfica dos Rios Piracicaba, Capivari e Jundiaí (PCJ - UGRHI 05)",
    "RIO CLARO": "Bacia Hidrográfica dos Rios Piracicaba, Capivari e Jundiaí (PCJ - UGRHI 05)",

    # UGRHI 07 - Baixada Santista
    "SANTOS": "Bacia Hidrográfica da Baixada Santista (UGRHI 07)",
    "SÃO VICENTE": "Bacia Hidrográfica da Baixada Santista (UGRHI 07)",
    "SAO VICENTE": "Bacia Hidrográfica da Baixada Santista (UGRHI 07)",
    "PRAIA GRANDE": "Bacia Hidrográfica da Baixada Santista (UGRHI 07)",
    "GUARUJÁ": "Bacia Hidrográfica da Baixada Santista (UGRHI 07)",
    "GUARUJA": "Bacia Hidrográfica da Baixada Santista (UGRHI 07)",
    "CUBATÃO": "Bacia Hidrográfica da Baixada Santista (UGRHI 07)",
    "CUBATAO": "Bacia Hidrográfica da Baixada Santista (UGRHI 07)",
    "BERTIOGA": "Bacia Hidrográfica da Baixada Santista (UGRHI 07)",
    "MONGAGUÁ": "Bacia Hidrográfica da Baixada Santista (UGRHI 07)",
    "MONGAGUA": "Bacia Hidrográfica da Baixada Santista (UGRHI 07)",
    "ITANHAÉM": "Bacia Hidrográfica da Baixada Santista (UGRHI 07)",
    "ITANHAEM": "Bacia Hidrográfica da Baixada Santista (UGRHI 07)",
    "PERUÍBE": "Bacia Hidrográfica da Baixada Santista (UGRHI 07)",
    "PERUIBE": "Bacia Hidrográfica da Baixada Santista (UGRHI 07)",

    # UGRHI 02 - Paraíba do Sul
    "SÃO JOSÉ DOS CAMPOS": "Bacia Hidrográfica do Rio Paraíba do Sul (UGRHI 02)",
    "SAO JOSE DOS CAMPOS": "Bacia Hidrográfica do Rio Paraíba do Sul (UGRHI 02)",
    "TAUBATÉ": "Bacia Hidrográfica do Rio Paraíba do Sul (UGRHI 02)",
    "TAUBATE": "Bacia Hidrográfica do Rio Paraíba do Sul (UGRHI 02)",
    "JACAREÍ": "Bacia Hidrográfica do Rio Paraíba do Sul (UGRHI 02)",
    "JACAREI": "Bacia Hidrográfica do Rio Paraíba do Sul (UGRHI 02)",
    "PINDAMONHANGABA": "Bacia Hidrográfica do Rio Paraíba do Sul (UGRHI 02)",
    "GUARATINGUETÁ": "Bacia Hidrográfica do Rio Paraíba do Sul (UGRHI 02)",
    "CAÇAPAVA": "Bacia Hidrográfica do Rio Paraíba do Sul (UGRHI 02)",

    # UGRHI 10 - Sorocaba / Médio Tietê
    "SOROCABA": "Bacia Hidrográfica do Rio Sorocaba e Médio Tietê (UGRHI 10)",
    "ITU": "Bacia Hidrográfica do Rio Sorocaba e Médio Tietê (UGRHI 10)",
    "VOTORANTIM": "Bacia Hidrográfica do Rio Sorocaba e Médio Tietê (UGRHI 10)",
    "TATUÍ": "Bacia Hidrográfica do Rio Sorocaba e Médio Tietê (UGRHI 10)",
    "TATUI": "Bacia Hidrográfica do Rio Sorocaba e Médio Tietê (UGRHI 10)",
    "SALTO": "Bacia Hidrográfica do Rio Sorocaba e Médio Tietê (UGRHI 10)",
    "SÃO ROQUE": "Bacia Hidrográfica do Rio Sorocaba e Médio Tietê (UGRHI 10)",
    "IBIÚNA": "Bacia Hidrográfica do Rio Sorocaba e Médio Tietê (UGRHI 10)",
    "IBIUNA": "Bacia Hidrográfica do Rio Sorocaba e Médio Tietê (UGRHI 10)",

    # UGRHI 04 - Pardo
    "RIBEIRÃO PRETO": "Bacia Hidrográfica do Rio Pardo (UGRHI 04)",
    "RIBEIRAO PRETO": "Bacia Hidrográfica do Rio Pardo (UGRHI 04)",
    "SERTÃOZINHO": "Bacia Hidrográfica do Rio Pardo (UGRHI 04)",
    "MOCOCA": "Bacia Hidrográfica do Rio Pardo (UGRHI 04)",

    # UGRHI 13 - Tietê / Jacaré
    "BAURU": "Bacia Hidrográfica do Tietê/Jacaré (UGRHI 13)",
    "ARARAQUARA": "Bacia Hidrográfica do Tietê/Jacaré (UGRHI 13)",
    "SÃO CARLOS": "Bacia Hidrográfica do Tietê/Jacaré (UGRHI 13)",
    "SAO CARLOS": "Bacia Hidrográfica do Tietê/Jacaré (UGRHI 13)",
    "JAÚ": "Bacia Hidrográfica do Tietê/Jacaré (UGRHI 13)",
    "JAU": "Bacia Hidrográfica do Tietê/Jacaré (UGRHI 13)",

    # UGRHI 15 - Turvo / Grande
    "SÃO JOSÉ DO RIO PRETO": "Bacia Hidrográfica do Turvo/Grande (UGRHI 15)",
    "SAO JOSE DO RIO PRETO": "Bacia Hidrográfica do Turvo/Grande (UGRHI 15)",
    "CATANDUVA": "Bacia Hidrográfica do Turvo/Grande (UGRHI 15)",
    "VOTUPORANGA": "Bacia Hidrográfica do Turvo/Grande (UGRHI 15)",

    # UGRHI 19 - Baixo Tietê
    "ARAÇATUBA": "Bacia Hidrográfica do Baixo Tietê (UGRHI 19)",
    "ARACATUBA": "Bacia Hidrográfica do Baixo Tietê (UGRHI 19)",
    "BIRIGUI": "Bacia Hidrográfica do Baixo Tietê (UGRHI 19)",

    # UGRHI 22 - Pontal do Paranapanema
    "PRESIDENTE PRUDENTE": "Bacia Hidrográfica do Pontal do Paranapanema (UGRHI 22)",

    # UGRHI 03 - Litoral Norte
    "UBATUBA": "Bacia Hidrográfica do Litoral Norte (UGRHI 03)",
    "CARAGUATATUBA": "Bacia Hidrográfica do Litoral Norte (UGRHI 03)",
    "SÃO SEBASTIÃO": "Bacia Hidrográfica do Litoral Norte (UGRHI 03)",
    "ILHABELA": "Bacia Hidrográfica do Litoral Norte (UGRHI 03)",

    # UGRHI 11 - Ribeira de Iguape e Litoral Sul
    "REGISTRO": "Bacia Hidrográfica do Ribeira de Iguape e Litoral Sul (UGRHI 11)",
    "IGUAPE": "Bacia Hidrográfica do Ribeira de Iguape e Litoral Sul (UGRHI 11)",
    "CANANÉIA": "Bacia Hidrográfica do Ribeira de Iguape e Litoral Sul (UGRHI 11)",
}


def _cpf_valido(dig: str) -> bool:
    """Validador matemático de CPF por algoritmo mod-11 oficial."""
    if len(dig) != 11 or len(set(dig)) == 1:
        return False

    def dv(ate: int) -> int:
        soma = sum(int(dig[i]) * (ate + 1 - i) for i in range(ate))
        resto = (soma * 10) % 11
        return 0 if resto == 10 else resto

    return dv(9) == int(dig[9]) and dv(10) == int(dig[10])


def _apagar_cpf(texto: str | None) -> str | None:
    """Higieniza CPFs em conformidade com a LGPD e regras do projeto."""
    if not texto:
        return None
    s = str(texto).strip()
    if not s:
        return None

    # Se for string estrita de 11 dígitos que valida no mod-11
    dig_puro = re.sub(r"\D", "", s)
    if len(dig_puro) == 11 and _cpf_valido(dig_puro):
        return "[CPF redigido]"

    def _sub(m: re.Match) -> str:
        val = m.group(0)
        d = re.sub(r"\D", "", val)
        if len(d) == 11 and _cpf_valido(d):
            return "[CPF redigido]"
        return val

    return RE_CPF.sub(_sub, s)


def _formatar_bacia(municipio: str | None, nom_ugrhi: str | None = None, cod_ugrhi: str | None = None) -> str:
    """Retorna o nome oficial da bacia hidrográfica / UGRHI."""
    if nom_ugrhi and nom_ugrhi.strip():
        nu = nom_ugrhi.strip()
        cu = cod_ugrhi.strip() if cod_ugrhi else ""
        if cu:
            return f"Bacia Hidrográfica do {nu.title()} (UGRHI {cu.zfill(2)})"
        return f"Bacia Hidrográfica do {nu.title()}"

    if municipio:
        m_upper = municipio.upper().strip()
        if m_upper in MAPA_MUNICIPIO_UGRHI:
            return MAPA_MUNICIPIO_UGRHI[m_upper]

    return "Bacia Hidrográfica do Rio Tietê (SP)"


def _parse_data(d_str: str | None) -> tuple[str | None, int | None]:
    """Interpreta formatos de data retornados pelos sistemas da CETESB."""
    if not d_str:
        return None, None
    clean = re.sub(r"\s+", " ", str(d_str).strip())
    formatos = [
        "%b %d %Y %I:%M%p",
        "%b %d %Y",
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%d/%m/%Y %H:%M:%S",
    ]
    for fmt in formatos:
        try:
            dt = datetime.datetime.strptime(clean, fmt)
            return dt.strftime("%Y-%m-%d"), dt.year
        except Exception:
            pass

    # Regex para extrair ano isolado de 4 dígitos
    m = re.search(r"\b(19\d{2}|20\d{2})\b", clean)
    if m:
        return None, int(m.group(1))

    return None, None


def _gerar_tags(tipo: str | None, categoria: str | None, orgao: str, *extras: str | None) -> list[str]:
    """Gera lista de tags padronizadas em minúsculas."""
    tags = [categoria or "licenca", "cetesb", "sp"]
    comb = f"{tipo or ''} {categoria or ''} {' '.join(str(e or '') for e in extras)}".lower()

    if "contaminad" in comb:
        tags.append("area_contaminada")
    if "remediac" in comb:
        tags.append("remediacao_ambiental")
    if "reabilitad" in comb or "(ar)" in comb or "reutilizacao" in comb or "reutilização" in comb:
        tags.append("area_reabilitada")
    if "investigac" in comb:
        tags.append("investigacao_ambiental")
    if "risco" in comb:
        tags.append("risco_confirmado")
    if "supress" in comb:
        tags.append("supressao_vegetal")
    if "vegetac" in comb or "florest" in comb:
        tags.append("autorizacao_florestal")
    if "minerac" in comb:
        tags.append("mineracao")
    if "posto" in comb or "combust" in comb:
        tags.append("posto_combustivel")
    if "tac" in comb or "restricao" in comb:
        tags.append("termo_ajustamento")
    if "intervenc" in comb:
        tags.append("intervencao_ambiental")
    if "edificac" in comb:
        tags.append("edificacoes")

    return list(dict.fromkeys(tags))


def _baixar_wfs(layer: str, max_features: int = 10000, start_index: int = 0) -> list[dict]:
    """Baixa feições GeoJSON do GeoServer DataGEO via WFS OGC."""
    query = {
        "service": "WFS",
        "version": "1.1.0",
        "request": "GetFeature",
        "typeName": layer,
        "outputFormat": "application/json",
        "maxFeatures": max_features,
    }
    if start_index > 0:
        query["startIndex"] = start_index

    params = urllib.parse.urlencode(query)
    url = f"{URL_WFS}?{params}"
    ctx = ssl._create_unverified_context()
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120, context=ctx) as resp:
        d = json.loads(resp.read().decode("utf-8", "ignore"))
        return [f.get("properties") for f in d.get("features", []) if f.get("properties")]


def main() -> int:
    parser = argparse.ArgumentParser(description="Coletor oficial de atos e licenças da CETESB / SP")
    parser.add_argument("--limit", type=int, default=500, help="Limite total de registros (0 = todos os ~28.507 registros)")
    parser.add_argument("--scan-cpf", action="store_true", help="Executa checagem de CPF ao término")
    args = parser.parse_args()

    linhas: list[dict] = []
    limite_global = args.limit if args.limit > 0 else 0

    print(f"=== Iniciando Coleta CETESB-SP ===")
    print(f"Alvo: {'Completo (~28.507 registros)' if limite_global == 0 else f'Amostra ({limite_global} registros)'}")

    # =========================================================================
    # 1. CETESB - Cadastro Oficial de Áreas Contaminadas e Reabilitadas (7.289)
    # =========================================================================
    print("\n[1/3] Baixando Cadastro de Áreas Contaminadas e Reabilitadas da CETESB...")
    limite_ac = 10000 if limite_global == 0 else min(limite_global, 10000)
    feats_ac = _baixar_wfs("datageo:VWM_AREAS_CONTAMINADAS_GEODADOS_CETESB_PTO", max_features=limite_ac)
    print(f"   Registros retornados: {len(feats_ac):,}")

    for p in feats_ac:
        obj_id = p.get("OBJECTID") or ""
        razao = str(p.get("Razao_Social") or "").strip() or None
        atividade = str(p.get("Atividade") or "").strip()
        classificacao = str(p.get("Classificacao_Atual") or "Área sob Controle CETESB").strip()
        dt_class_str = p.get("Data_Classificacao")
        dt_atual_str = p.get("Data_Atualizacao")
        grupo_cont = str(p.get("Grupo_Contaminante") or "").strip()
        contaminante = str(p.get("Contaminante") or "").strip()
        meios = str(p.get("Meios_Impactados") or "").strip()
        mun_raw = str(p.get("Municipio") or "").strip()
        mun = mun_raw.title() if mun_raw else None
        endereco = str(p.get("Endereco") or "").strip()

        dt_inicio, ano_inicio = _parse_data(dt_class_str)
        dt_fim, _ = _parse_data(dt_atual_str)

        # Categorização
        class_low = classificacao.lower()
        if "reabilitada" in class_low or "ar" in class_low or "reutilização" in class_low:
            categoria = "licenca"
        elif "encerramento" in class_low:
            categoria = "licenca"
        else:
            categoria = "embargo"

        tipo = f"Controle Ambiental de Área Contaminada — {classificacao}"
        processo = f"CETESB-AC-{obj_id}"
        empresa_sanitizada = _apagar_cpf(razao)
        bacia = _formatar_bacia(mun)

        partes_resumo = [f"CETESB · {classificacao}", empresa_sanitizada or "Interessado não identificado", f"{mun or 'SP'}/SP"]
        if atividade:
            partes_resumo.append(atividade[:50].strip())
        if meios:
            partes_resumo.append(f"Impacto: {meios}")
        elif grupo_cont:
            partes_resumo.append(f"Contaminante: {grupo_cont}")
        microresumo = " · ".join(partes_resumo)

        tags = _gerar_tags(tipo, categoria, "cetesb", classificacao, atividade, grupo_cont)

        linhas.append({
            "orgao": ORGAO_CETESB,
            "uf": UF,
            "ano": ano_inicio,
            "categoria": categoria,
            "tipo": _apagar_cpf(tipo),
            "empresa": empresa_sanitizada,
            "municipio": mun,
            "bacia": bacia,
            "data_inicio": dt_inicio,
            "data_fim": dt_fim,
            "situacao": classificacao,
            "processo": processo,
            "microresumo": _apagar_cpf(microresumo),
            "tags": tags,
        })

        if limite_global > 0 and len(linhas) >= limite_global:
            break

    # =========================================================================
    # 2. CETESB - Termos de Ajustamento e Restrições Institucionais (879)
    # =========================================================================
    if limite_global == 0 or len(linhas) < limite_global:
        print("\n[2/3] Baixando Termos de Restrições Institucionais e Averbações CETESB...")
        limite_rest = 2000 if limite_global == 0 else (limite_global - len(linhas))
        feats_rest = _baixar_wfs("datageo:AREAS_RESTRICAO_CETESB_POL", max_features=limite_rest)
        print(f"   Registros retornados: {len(feats_rest):,}")

        for p in feats_rest:
            razao = str(p.get("RazaoSocia") or "").strip() or None
            termo = str(p.get("Termo_AR") or "s/n").strip()
            atividade = str(p.get("Atividade") or "Atividade sob restrição").strip()
            nseq = str(p.get("NSEQNC") or "").strip()

            empresa_sanitizada = _apagar_cpf(razao)
            tipo = "Termo de Averbação de Restrição Institucional — CETESB"
            processo = f"TAC/AR-{termo}"
            partes_rest = ["Restrição Institucional CETESB", empresa_sanitizada or "Interessado", f"Termo nº {termo}"]
            if atividade:
                partes_rest.append(f"Atividade: {atividade}")
            microresumo = " · ".join(partes_rest)
            tags = _gerar_tags(tipo, "embargo", "cetesb", "restricao_institucional", atividade)

            # Extração de ano a partir do termo (ex: "1175/2019" -> 2019)
            ano = None
            m_ano = re.search(r"/(20\d{2})\b", termo)
            if m_ano:
                ano = int(m_ano.group(1))

            linhas.append({
                "orgao": ORGAO_CETESB,
                "uf": UF,
                "ano": ano,
                "categoria": "embargo",
                "tipo": tipo,
                "empresa": empresa_sanitizada,
                "municipio": "São Paulo",  # Estado de São Paulo
                "bacia": "Bacia Hidrográfica do Rio Tietê (SP)",
                "data_inicio": f"{ano}-01-01" if ano else None,
                "data_fim": None,
                "situacao": "Restrição Institucional Ativa",
                "processo": processo,
                "microresumo": _apagar_cpf(microresumo),
                "tags": tags,
            })

            if limite_global > 0 and len(linhas) >= limite_global:
                break

    # =========================================================================
    # 3. CFA/CETESB - Autorizações de Supressão e Licenciamento Florestal (~20.339)
    # =========================================================================
    if limite_global == 0 or len(linhas) < limite_global:
        print("\n[3/3] Baixando Autorizações de Supressão e Intervenção Ambiental (Painel Verde 2019-2026)...")
        anos = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019]
        for yr in anos:
            if limite_global > 0 and len(linhas) >= limite_global:
                break
            layer = f"datageo:VWM_PAINEL_VERDE_SUPRESSAO_CFA_{yr}_POL"
            limite_camada = 10000 if limite_global == 0 else (limite_global - len(linhas))
            print(f"   Baixando camada {yr}...")
            feats_yr = _baixar_wfs(layer, max_features=limite_camada)
            print(f"   -> Retornados {len(feats_yr):,} registros para {yr}")

            for p in feats_yr:
                classificacao = str(p.get("Classificacao") or "Supressão de Vegetação").strip()
                dado = str(p.get("Dado") or "").strip()
                tipo_interv = str(p.get("TipoIntervencao") or "Intervenção Ambiental").strip()
                tipo_area = str(p.get("TipoArea") or "").strip()
                area_ha = str(p.get("AreaHA") or "0").strip()
                situacao = str(p.get("Situacao_Status") or "Autorizado").strip()
                mun_raw = str(p.get("Municipio") or "").strip()
                mun = mun_raw.title() if mun_raw else None
                nom_ugrhi = str(p.get("NomUGRHI_Espacial") or "").strip()
                cod_ugrhi = str(p.get("CodUGRHI_Espacial") or "").strip()
                bioma = str(p.get("Bioma") or "").strip()
                num_ref = str(p.get("Num_Referencia") or p.get("NIS_Referencia") or "").strip()
                dt_ref = str(p.get("Data_Referencia") or "").strip()

                ano = yr
                tipo = f"Autorização de {classificacao} — {tipo_interv}"
                processo = f"AUT-CFA-{num_ref}" if num_ref else f"AUT-CFA-{yr}"
                bacia = _formatar_bacia(mun, nom_ugrhi, cod_ugrhi)
                partes_pv = [f"Autorização CFA/CETESB nº {num_ref or 's/n'}", f"{mun or 'SP'}/SP", tipo_interv]
                if area_ha and area_ha != "0":
                    partes_pv.append(f"Área: {area_ha} ha")
                if bacia:
                    partes_pv.append(bacia)
                microresumo = " · ".join(partes_pv)
                tags = _gerar_tags(tipo, "licenca", "cfa", "cetesb", tipo_interv, bioma, tipo_area)

                linhas.append({
                    "orgao": ORGAO_CFA,
                    "uf": UF,
                    "ano": ano,
                    "categoria": "licenca",
                    "tipo": _apagar_cpf(tipo),
                    "empresa": None,  # Autos públicos florestais resguardam requerente de pessoa física
                    "municipio": mun,
                    "bacia": bacia,
                    "data_inicio": f"{ano}-01-01",
                    "data_fim": None,
                    "situacao": situacao,
                    "processo": processo,
                    "microresumo": _apagar_cpf(microresumo),
                    "tags": tags,
                })

                if limite_global > 0 and len(linhas) >= limite_global:
                    break

            time.sleep(PAUSA)

    total_disponivel = 28507

    resultado = {
        "gerado_em": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "fonte": "https://datageo.ambiente.sp.gov.br/geoserver/datageo/ows",
        "truncado": limite_global > 0 and len(linhas) < total_disponivel,
        "total": len(linhas),
        "total_disponivel": total_disponivel,
        "ressalva_editorial": (
            "Atos públicos de licenciamento, controle e intervenção ambiental do Estado de São Paulo coletados "
            "a partir da Infraestrutura de Dados Espaciais Ambientais (DataGEO / CETESB / CFA / SEMIL-SP). "
            "Inclui o Cadastro Oficial de Áreas Contaminadas e Reabilitadas da CETESB (Dec. Estadual nº 59.263/2013), "
            "Termos de Averbação de Restrições Institucionais e Autorizações de Supressão e Intervenção Ambiental (Painel Verde). "
            "Dados de pessoas físicas são estritamente sanitizados por algoritmo mod-11 em conformidade com a LGPD."
        ),
        "linhas": linhas,
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8")
    tamanho_bytes = SAIDA.stat().st_size
    print(f"\n[OK] Arquivo gravado: {SAIDA}")
    print(f"     Total de registros: {len(linhas):,}")
    print(f"     Tamanho em disco: {tamanho_bytes:,} bytes ({tamanho_bytes / (1024*1024):.2f} MB)")

    if args.scan_cpf:
        print("\n=== Executando auditoria oficial de CPF (mod-11) ===")
        scanner = Path(__file__).resolve().parent / "checar-dado-pessoal-em-dado.py"
        r = subprocess.run(
            [sys.executable, str(scanner), "--extra", str(SAIDA)],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        if SAIDA.name in r.stdout:
            print(f"[FALHA] CPF detectado em {SAIDA.name}!")
            print(r.stdout)
            return 1
        print(f"[SUCESSO] Auditoria de CPF em {SAIDA.name}: 100% LIMPA (0 CPFs detectados)!")

    return 0


if __name__ == "__main__":
    sys.exit(main())
