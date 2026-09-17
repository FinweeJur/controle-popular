"""coletar-sedam-ro-licencas.py — embargos, outorgas e licencas ambientais da SEDAM-RO.

Coleta a relação pública de atos ambientais de Rondônia (embargos estaduais COPAM/BPA,
outorgas hídricas COREH e licenças de piscicultura COLMAM) a partir do GeoPortal oficial da SEDAM
e grava JSON estruturado em apps/web/data/sedam-ro-licencas.json.

Fonte: http://geoportal.sedam.ro.gov.br/geoserver/wfs
Camadas:
  - copam:embargos_ativos_mv_public (5.666 embargos estaduais ativos)
  - coreh:vw_pontos_outorgas (19.387 outorgas hídricas)
  - colmam:vw_piscicultura (300 licenças de piscicultura)
Total estimado: ~25.353 registros

Rodar:
    python scripts/coletar-sedam-ro-licencas.py               # coleta inicial padrão (--limit 500)
    python scripts/coletar-sedam-ro-licencas.py --limit 0     # coleta tudo (~25.353 registros)
    python scripts/coletar-sedam-ro-licencas.py --scan-cpf    # varre CPF com validador oficial

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

URL_WFS = "http://geoportal.sedam.ro.gov.br/geoserver/wfs"
UA = "ControlePopular/1.0 (+contato@controlepopular.com.br; dado publico governamental)"
UF = "RO"
ORGAO = "SEDAM (RO)"
SAIDA = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "sedam-ro-licencas.json"
CACHE_DIR = Path(__file__).resolve().parent / ".cache" / "sedam-ro"
PAUSA = 2  # segundos

RE_CPF = re.compile(r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{11}\b")

# Bacias principais de Rondônia (Sub-bacias da Bacia Amazônica)
BACIA_GUAPORE = {
    "COSTA MARQUES", "ALTO ALEGRE DOS PARECIS", "CABIXI", "CEREJEIRAS",
    "CHUPINGUAIA", "COLORADO DO OESTE", "CORUMBIARA", "PIMENTEIRAS DO OESTE",
    "SAO FRANCISCO DO GUAPORE", "SÃO FRANCISCO DO GUAPORÉ", "VILHENA"
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


def _bacia_ro(mun: str | None) -> str:
    if not mun:
        return "Bacia Hidrográfica do Rio Madeira / Amazônica"
    m_upper = mun.upper().strip()
    if m_upper in BACIA_GUAPORE:
        return "Bacia do Rio Guaporé / Mamoré"
    return "Bacia do Rio Madeira (Amazônica)"


def _gerar_tags(tipo: str | None, categoria: str | None) -> list[str]:
    tags = [categoria or "licenca", "sedam", "ro"]
    combinado = f"{tipo or ''} {categoria or ''}".lower()
    if "embargo" in combinado:
        tags.append("embargo_ambiental")
    if "outorga" in combinado:
        tags.append("outorga_hidrica")
    if "barragem" in combinado:
        tags.append("barragem")
    if "piscicultura" in combinado:
        tags.append("piscicultura")
    if "operacao" in combinado or " lo" in combinado:
        tags.append("licenca_operacao")
    return list(dict.fromkeys(tags))


def _baixar_wfs(layer: str, max_features: int = 1000, start_index: int = 0) -> list[dict]:
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
    for tentativa in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = resp.read().decode("utf-8", "ignore")
                d = json.loads(data)
                return [f.get("properties") for f in d.get("features", []) if f.get("properties")]
        except Exception as e:
            if tentativa == 2:
                print(f"Erro ao baixar {layer} (start={start_index}): {e}")
                return []
            time.sleep(3)
    return []


def main() -> int:
    parser = argparse.ArgumentParser(description="Coleta atos ambientais de Rondônia via GeoPortal SEDAM")
    parser.add_argument("--limit", type=int, default=500, help="Limite de registros (0 = todos)")
    parser.add_argument("--scan-cpf", action="store_true", help="Executa checagem de CPF ao final")
    args = parser.parse_args()

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    linhas = []

    print(f"Iniciando coleta RO via GeoPortal SEDAM (limite: {'tudo' if args.limit == 0 else args.limit})...")

    # 1. COPAM Embargos Estaduais
    print("Baixando Embargos Ambientais Ativos COPAM/SEDAM...")
    embargos_limit = 6000 if args.limit == 0 else args.limit
    embargos_raw = _baixar_wfs("copam:embargos_ativos_mv_public", max_features=embargos_limit)
    print(f"Embargos retornados: {len(embargos_raw):,} registros")

    for item in embargos_raw:
        mun_raw = str(item.get("municipio") or "").strip()
        mun_limpo = _apagar_cpf(mun_raw)
        mun = None if (not mun_limpo or mun_limpo == "[CPF redigido]") else mun_limpo.title()
        num_bo = _apagar_cpf(str(item.get("num_bo_boa") or item.get("id_cadast") or "s/n").strip())
        enquadramento = str(item.get("enqua_boa") or "Infração Ambiental").strip()
        origem = str(item.get("origem") or "BPA/SEDAM").strip()
        area_str = str(item.get("area") or "").strip()
        dt_str = str(item.get("data") or "").strip()
        ano = None
        if dt_str and "-" in dt_str:
            try:
                ano = int(dt_str.split("-")[0])
            except Exception:
                pass

        tipo = f"Embargo Ambiental — {enquadramento}"
        area_info = f" · Área embargada: {float(area_str):.1f} ha" if (area_str and area_str.replace(".", "", 1).isdigit()) else ""
        microresumo = f"Embargo Ambiental ({origem}) · {mun or 'RO'} · Motivo: {enquadramento}{area_info} · BO: {num_bo}"
        tags = _gerar_tags(tipo, "embargo")

        linhas.append({
            "orgao": ORGAO,
            "uf": UF,
            "ano": ano,
            "categoria": "embargo",
            "tipo": _apagar_cpf(tipo),
            "empresa": None,  # Autos de embargo público preservam sigilo de pessoa física na camada
            "municipio": mun,
            "bacia": _bacia_ro(mun),
            "data_inicio": dt_str if dt_str else None,
            "data_fim": None,
            "situacao": "Embargo Ativo",
            "processo": num_bo,
            "microresumo": _apagar_cpf(microresumo),
            "tags": tags,
        })

        if args.limit > 0 and len(linhas) >= args.limit:
            break

    # 2. COREH Outorgas Hídricas
    if args.limit == 0 or len(linhas) < args.limit:
        print("Baixando Outorgas Hídricas COREH/SEDAM...")
        outorgas_limit = 20000 if args.limit == 0 else (args.limit - len(linhas))
        outorgas_features = []
        start = 0
        while True:
            lote_tam = min(500, outorgas_limit - len(outorgas_features))
            print(f"  Lote COREH start={start:,}, max={lote_tam:,}...")
            lote = _baixar_wfs("coreh:vw_pontos_outorgas", max_features=lote_tam, start_index=start)
            if not lote:
                break
            outorgas_features.extend(lote)
            start += len(lote)
            if len(outorgas_features) >= outorgas_limit or len(lote) < lote_tam:
                break
            time.sleep(PAUSA)

        print(f"Outorgas retornadas: {len(outorgas_features):,} registros")

        for item in outorgas_features:
            tp_interv = str(item.get("INT_TIN_DS") or "Outorga de Uso").strip()
            subtipo = str(item.get("INT_TSU_DS") or "").strip()
            mun_raw = str(item.get("ING_NM_MUNICIPIO") or "").strip()
            mun_limpo = _apagar_cpf(mun_raw)
            mun = None if (not mun_limpo or mun_limpo == "[CPF redigido]") else mun_limpo.title()
            corpo_hidrico = str(item.get("INT_NM_CORPOHIDRICO") or "").strip()
            num_proc = _apagar_cpf(str(item.get("INT_CD_CNARH40") or "s/n").strip())

            tipo = f"Outorga — {tp_interv} ({subtipo})" if subtipo else f"Outorga — {tp_interv}"
            corpo_info = f" · Corpo hídrico: {corpo_hidrico}" if corpo_hidrico else ""
            microresumo = f"Outorga Hídrica ({tp_interv}) · {mun or 'RO'}{corpo_info} · CNARH: {num_proc}"
            tags = _gerar_tags(tipo, "outorga")

            linhas.append({
                "orgao": "COREH (RO)",
                "uf": UF,
                "ano": None,
                "categoria": "outorga",
                "tipo": _apagar_cpf(tipo),
                "empresa": None,
                "municipio": mun,
                "bacia": _bacia_ro(mun),
                "data_inicio": None,
                "data_fim": None,
                "situacao": str(item.get("INT_TSI_DS") or "Outorgado").strip(),
                "processo": num_proc,
                "microresumo": _apagar_cpf(microresumo),
                "tags": tags,
            })

            if args.limit > 0 and len(linhas) >= args.limit:
                break

    # 3. COLMAM Licenças Piscicultura
    if args.limit == 0 or len(linhas) < args.limit:
        print("Baixando Licenças de Piscicultura COLMAM/SEDAM...")
        pisc_features = _baixar_wfs("colmam:vw_piscicultura", max_features=500)
        print(f"Piscicultura retornada: {len(pisc_features):,} registros")

        for item in pisc_features:
            num_lo = _apagar_cpf(str(item.get("numero_lo") or "s/n").strip())
            atividade = str(item.get("atividade") or "Cultivo de espécies aquícolas").strip()
            validade = str(item.get("dt_validad") or "").strip()
            endereco = _apagar_cpf(str(item.get("endereco") or "").strip())

            tipo = "Licença de Operação (LO) — Piscicultura"
            microresumo = f"Licença de Operação nº {num_lo} · {atividade[:80]} · Validade: {validade or 'indeterminada'}"
            tags = _gerar_tags(tipo, "licenca")

            linhas.append({
                "orgao": "COLMAM (RO)",
                "uf": UF,
                "ano": None,
                "categoria": "licenca",
                "tipo": _apagar_cpf(tipo),
                "empresa": None,
                "municipio": None,
                "bacia": "Bacia do Rio Madeira (Amazônica)",
                "data_inicio": None,
                "data_fim": validade if validade else None,
                "situacao": "Vigente",
                "processo": num_lo,
                "microresumo": _apagar_cpf(microresumo),
                "tags": tags,
            })

            if args.limit > 0 and len(linhas) >= args.limit:
                break

    resultado = {
        "gerado_em": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "fonte": "http://geoportal.sedam.ro.gov.br/geoserver/wfs",
        "truncado": args.limit > 0 and len(linhas) < 25353,
        "total": len(linhas),
        "total_disponivel": 25353,
        "ressalva_editorial": (
            "Atos ambientais públicos do Estado de Rondônia (embargos ativos COPAM/BPA, outorgas COREH e licenças aquícolas COLMAM) "
            "coletados a partir do GeoPortal oficial da Secretaria de Estado do Desenvolvimento Ambiental (SEDAM-RO). "
            "O embargo ambiental decorre de infração apurada e atesta restrição administrativa em vigor na data do ato."
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
