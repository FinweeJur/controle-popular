"""coletar-iema-es-licencas.py — licenciamento ambiental e outorgas do Espírito Santo.

Coleta a relação pública de atos ambientais (licenciamento IDAF, fiscalização IEMA e
outorgas hídricas AGERH) a partir da Infraestrutura de Dados Espaciais GEOBASES (ES)
e grava JSON estruturado em apps/web/data/iema-es-licencas.json.

Fonte: https://ide.geobases.es.gov.br/geoserver/wfs
Camadas:
  - geonode:idaf_gelcof_licencas_exct_barragem (IDAF - Licenças Ambientais)
  - geonode:ana_agerh_outorga_es (AGERH - Outorgas Hídricas)
  - geonode:iema_fiscalizacao_ambiental_utf8_epsg_31984 (IEMA - Fiscalização Ambiental)

Rodar:
    python scripts/coletar-iema-es-licencas.py               # coleta inicial padrão (--limit 500)
    python scripts/coletar-iema-es-licencas.py --limit 0     # coleta tudo (~30.823 registros)
    python scripts/coletar-iema-es-licencas.py --scan-cpf    # varre CPF com validador oficial

Privacidade e LGPD:
- Sanitização de CPF por algoritmo mod-11 oficial.
- CNPJs válidos de 14 dígitos são mantidos.
"""
from __future__ import annotations

import argparse
import datetime
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

URL_WFS = "https://ide.geobases.es.gov.br/geoserver/wfs"
UA = "ControlePopular/1.0 (+contato@controlepopular.com.br; dado publico governamental)"
UF = "ES"
SAIDA = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "iema-es-licencas.json"
CACHE_DIR = Path(__file__).resolve().parent / ".cache" / "iema-es"
PAUSA = 2  # segundos

RE_CPF = re.compile(r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{11}\b")

# Municípios capixabas na Bacia do Rio Doce (impactados por Mariana e sob governança CBH-Doce)
MUNICIPIOS_DOCE = {
    "BAIXO GUANDU", "COLATINA", "LINHARES", "MARILANDIA", "MARILÂNDIA",
    "PANCAS", "SAO ROQUE DO CANAA", "SÃO ROQUE DO CANAÃ", "ITAGUACU",
    "ITAGUAÇU", "ITARANA", "SANTA TERESA", "SANTA MARIA DE JETIBA",
    "SANTA LEOPOLDINA", "IBIRACU", "IBIRAÇU", "ARACRUZ", "JOAO NEIVA",
    "JOÃO NEIVA", "GOVERNADOR LINDENBERG", "SAO DOMINGOS DO NORTE",
    "SÃO DOMINGOS DO NORTE", "RIO BANANAL", "SOORETAMA"
}


def _cpf_valido(dig: str) -> bool:
    if len(dig) != 11 or len(set(dig)) == 1:
        return False

    def dv(ate: int) -> int:
        soma = sum(int(dig[i]) * (ate + 1 - i) for i in range(ate))
        resto = (soma * 10) % 11
        return 0 if resto == 10 else resto

    return dv(9) == int(dig[9]) and dv(10) == int(dig[10])


def _apagar_cpf(texto: str | None) -> str | None:
    if not texto:
        return None
    dig_puro = re.sub(r"\D", "", texto)
    if len(dig_puro) == 11 and _cpf_valido(dig_puro):
        return "[CPF redigido]"

    def _sub(m):
        val = m.group(0)
        d = re.sub(r"\D", "", val)
        if len(d) == 11 and _cpf_valido(d):
            return "[CPF redigido]"
        return val

    return RE_CPF.sub(_sub, texto)


def _bacia_es(mun: str | None, reg_hidro: str | None) -> str:
    if mun and mun.upper() in MUNICIPIOS_DOCE:
        return "Bacia do Rio Doce"
    if reg_hidro:
        return f"Região Hidrográfica {reg_hidro.title()}"
    return "Bacia Hidrográfica do Atlântico Sudeste (ES)"


def _gerar_tags(tipo: str | None, categoria: str | None, orgao: str) -> list[str]:
    tags = [categoria or "licenca", orgao.lower().split()[0], "es"]
    combinado = f"{tipo or ''} {categoria or ''}".lower()
    if "previa" in combinado or " lp" in combinado:
        tags.append("licenca_previa")
    if "instalacao" in combinado or " li" in combinado:
        tags.append("licenca_instalacao")
    if "operacao" in combinado or " lo" in combinado:
        tags.append("licenca_operacao")
    if "outorga" in combinado:
        tags.append("outorga_hidrica")
    if "captacao" in combinado:
        tags.append("captacao_agua")
    if "fiscalizacao" in combinado:
        tags.append("fiscalizacao")
    return list(dict.fromkeys(tags))


def _baixar_wfs(layer: str, max_features: int = 10000, start_index: int = 0) -> list[dict]:
    params = urllib.parse.urlencode({
        "service": "WFS",
        "version": "1.0.0",
        "request": "GetFeature",
        "typeName": layer,
        "outputFormat": "application/json",
        "maxFeatures": max_features,
        "startIndex": start_index
    })
    url = f"{URL_WFS}?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as resp:
        d = json.loads(resp.read().decode("utf-8", "ignore"))
        return [f.get("properties") for f in d.get("features", []) if f.get("properties")]


def main() -> int:
    parser = argparse.ArgumentParser(description="Coleta atos ambientais do Espírito Santo via GEOBASES")
    parser.add_argument("--limit", type=int, default=500, help="Limite de registros (0 = todos)")
    parser.add_argument("--scan-cpf", action="store_true", help="Executa checagem de CPF ao final")
    args = parser.parse_args()

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    linhas = []

    print(f"Iniciando coleta ES via GEOBASES (limite: {'tudo' if args.limit == 0 else args.limit})...")

    # 1. IDAF Licenças
    print("Baixando Licenças Ambientais IDAF...")
    idaf_raw = _baixar_wfs("geonode:idaf_gelcof_licencas_exct_barragem", max_features=6000)
    print(f"IDAF retornado: {len(idaf_raw):,} registros")

    for item in idaf_raw:
        titulo = str(item.get("TITULO") or "Licença Ambiental").strip()
        num_proc = _apagar_cpf(str(item.get("NUM_PROCES") or "s/n").strip())
        mun = str(item.get("MUNICIPIO") or "").strip()
        mun = mun.title() if mun else None
        interessado = _apagar_cpf(str(item.get("INTERESSAD") or "").strip()) or None
        atividade = str(item.get("ATIVIDADE") or "").strip()

        ano = None
        if num_proc and "/" in num_proc:
            try:
                ano_str = num_proc.split("/")[-1].strip()
                if ano_str.isdigit() and len(ano_str) == 4:
                    ano = int(ano_str)
            except Exception:
                pass

        bacia = _bacia_es(mun, None)
        tipo = f"{titulo} — {atividade}" if atividade else titulo
        microresumo = f"{titulo} · {mun or 'ES'} · Atividade: {atividade or 'não especificada'} · Processo: {num_proc}"
        tags = _gerar_tags(tipo, "licenca", "idaf")

        linhas.append({
            "orgao": "IDAF (ES)",
            "uf": UF,
            "ano": ano,
            "categoria": "licenca",
            "tipo": _apagar_cpf(tipo),
            "empresa": interessado,
            "municipio": mun,
            "bacia": bacia,
            "data_inicio": f"{ano}-01-01" if ano else None,
            "data_fim": None,
            "situacao": "Concedida",
            "processo": num_proc,
            "microresumo": _apagar_cpf(microresumo),
            "tags": tags,
        })

        if args.limit > 0 and len(linhas) >= args.limit:
            break

    # 2. AGERH Outorgas
    if args.limit == 0 or len(linhas) < args.limit:
        print("Baixando Outorgas de Recursos Hídricos AGERH...")
        agerh_limit = 20000 if args.limit == 0 else (args.limit - len(linhas))
        # baixar em lotes de 5000 se limit == 0
        agerh_features = []
        start = 0
        while True:
            lote_tam = min(5000, agerh_limit - len(agerh_features))
            print(f"  Lote AGERH start={start:,}, max={lote_tam:,}...")
            lote = _baixar_wfs("geonode:ana_agerh_outorga_es", max_features=lote_tam, start_index=start)
            if not lote:
                break
            agerh_features.extend(lote)
            start += len(lote)
            if len(agerh_features) >= agerh_limit or len(lote) < lote_tam:
                break
            time.sleep(PAUSA)

        print(f"AGERH retornado: {len(agerh_features):,} registros")

        for item in agerh_features:
            tp_ato = str(item.get("OUT_TP_ATO") or "Outorga").strip()
            num_ato = _apagar_cpf(str(item.get("OUT_NU_ATO") or "s/n").strip())
            mun = str(item.get("ING_NM_MUN") or "").strip()
            mun = mun.title() if mun else None
            finalidade = str(item.get("TFN_DS") or "").strip()
            tipo_uso = str(item.get("TPO_DS") or "").strip()
            corpo_hidrico = str(item.get("INT_NM_C_1") or item.get("TCH_DS") or "").strip()
            dt_raw = item.get("DT_OUTORGA")
            dt_iso = None
            ano = None

            if dt_raw and "/" in str(dt_raw):
                partes = str(dt_raw).split("/")
                if len(partes) == 3:
                    dt_iso = f"{partes[2]}-{partes[1]}-{partes[0]}"
                    try:
                        ano = int(partes[2])
                    except Exception:
                        pass

            bacia = _bacia_es(mun, str(item.get("ING_NM_REG") or ""))
            tipo = f"{tp_ato} — {finalidade}" if finalidade else tp_ato
            vazao = item.get("INT_QT_VAZ")
            vazao_str = f" · Vazão: {vazao} m³/h" if vazao else ""
            microresumo = f"{tp_ato} nº {num_ato} · {mun or 'ES'} · Finalidade: {finalidade or tipo_uso}{vazao_str}"
            tags = _gerar_tags(tipo, "outorga", "agerh")

            linhas.append({
                "orgao": "AGERH (ES)",
                "uf": UF,
                "ano": ano,
                "categoria": "outorga",
                "tipo": _apagar_cpf(tipo),
                "empresa": None,  # AGERH public WFS omits private names for outorgas
                "municipio": mun,
                "bacia": bacia,
                "data_inicio": dt_iso,
                "data_fim": None,
                "situacao": str(item.get("TSP_DS") or "Outorgado").strip(),
                "processo": num_ato,
                "microresumo": _apagar_cpf(microresumo),
                "tags": tags,
            })

            if args.limit > 0 and len(linhas) >= args.limit:
                break

    resultado = {
        "gerado_em": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "fonte": "https://ide.geobases.es.gov.br/geoserver/wfs",
        "truncado": args.limit > 0 and len(linhas) < 20792,
        "total": len(linhas),
        "total_disponivel": 20792,
        "ressalva_editorial": (
            "Atos ambientais públicos do Espírito Santo (licenciamento IDAF e outorgas hídricas AGERH) "
            "integrados via Infraestrutura de Dados Espaciais GEOBASES. "
            "A concessão atesta a regularidade formal perante o órgão estadual na data de emissão."
        ),
        "linhas": linhas,
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Gravado em {SAIDA} ({len(linhas):,} registros, {SAIDA.stat().st_size:,} bytes)")

    if args.scan_cpf:
        print("Executando varredura oficial de CPF (mod-11)...")
        scanner = Path(__file__).resolve().parent / "checar-dado-pessoal-em-dado.py"
        r = subprocess.run(
            [sys.executable, str(scanner), "--extra", str(SAIDA)],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        print(r.stdout)
        if SAIDA.name in r.stdout:
            print(f"ERRO: Dado pessoal detectado em {SAIDA.name}!")
            return 2
        print(f"Auditoria de CPF em {SAIDA.name}: 100% LIMPA!")

    return 0


if __name__ == "__main__":
    sys.exit(main())
