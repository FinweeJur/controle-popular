# -*- coding: utf-8 -*-
"""
Coletor dos AUTOS DE INFRAÇÃO do IBAMA, agregados por município.

Papel no portal
===============
Enriquece `/ambiental/ibama` (hoje focado em grandes empreendimentos em MG) com
o retrato nacional da fiscalização ambiental: quantos autos e quanto em multas
por município, com destaque para Minas, e o que foi embargado.

Fonte oficial
=============
IBAMA — Dados Abertos, "Fiscalização - auto de infração" (SIFISC), CSV por ano:
https://dadosabertos.ibama.gov.br/dataset/fiscalizacao-auto-de-infracao
Arquivo: auto_infracao_csv.zip (blob público do IBAMA).

Dado pessoal — decisão de projeto (LGPD + AGENTS §5.2)
======================================================
O CSV traz NOME_INFRATOR e CPF_CNPJ_INFRATOR (pessoa física e jurídica). Este
coletor NÃO copia o infrator: agrega apenas contagens e valores por município.
Nenhum nome ou documento sai daqui; a guarda de CPF roda depois sobre o JSON.

Janela
======
Agrega os autos lavrados de 2015 a 2026 (declarado na metodologia). A base
começa em 1977; o recorte recente mantém o painel utilizável e evita somar
autos antigos já cancelados/arquivados sem contexto.
"""

import csv
import io
import json
import re
import subprocess
import sys
import time
import zipfile
from collections import defaultdict
from pathlib import Path

URL_FONTE = "https://dadosabertos.ibama.gov.br/dataset/fiscalizacao-auto-de-infracao"
URL_ARQUIVO = (
    "https://stibamadadosabertosprd.blob.core.windows.net/dados-abertos/dados/"
    "SIFISC/auto_infracao/auto_infracao/auto_infracao_csv.zip"
)
USER_AGENT = "ControlePopular/1.0 (+contato@controlepopular.com.br; dado publico governamental)"
ENTRADA = Path("etl/betim/entrada/ibama/auto_infracao_csv.zip")
SAIDA = Path("apps/web/data/ambiental/ibama-autos-municipio.json")
ANO_INICIO, ANO_FIM = 2015, 2026


def baixar(destino: Path) -> Path:
    destino.parent.mkdir(parents=True, exist_ok=True)
    if destino.exists() and destino.stat().st_size > 50_000_000:
        print(f"[ibama] ZIP em disco ({destino.stat().st_size} bytes) — checkpoint usado")
        return destino
    print("[ibama] baixando (via curl) …")
    subprocess.run(["curl.exe", "-s", "-L", "-o", str(destino), "-A", USER_AGENT, URL_ARQUIVO], check=True)
    print(f"[ibama] ok ({destino.stat().st_size} bytes)")
    time.sleep(2)
    return destino


def dinheiro(v: str) -> float:
    s = str(v or "").strip()
    if not s:
        return 0.0
    s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return 0.0


def qtd(v: str) -> float:
    s = str(v or "").strip().replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return 0.0


def main() -> int:
    # Há campos de geometria (WKT) enormes na base; o limite padrão do csv
    # (131072) estoura. Sobe para 20 MB, com guarda para plataformas 32-bit.
    try:
        csv.field_size_limit(20_000_000)
    except OverflowError:
        csv.field_size_limit(2**31 - 1)
    z_path = baixar(ENTRADA)
    por_mun: dict[str, dict] = {}
    por_uf: dict[str, dict] = defaultdict(lambda: {"autos": 0, "valor": 0.0, "com_embargo": 0})
    por_ano: dict[str, dict] = defaultdict(lambda: {"autos": 0, "valor": 0.0})
    por_bioma: dict[str, int] = defaultdict(int)
    total_autos = 0
    total_valor = 0.0
    cancelados = 0

    with zipfile.ZipFile(z_path) as z:
        for nome in z.namelist():
            m = re.search(r"auto_infracao_(\d{4})\.csv$", nome)
            if not m or not (ANO_INICIO <= int(m.group(1)) <= ANO_FIM):
                continue
            ano = m.group(1)
            with z.open(nome) as bruto:
                leitor = csv.reader(io.TextIOWrapper(bruto, encoding="latin-1"), delimiter=";")
                cab = next(leitor)
                ix = {
                    "cancelado": cab.index("SIT_CANCELADO"),
                    "valor": cab.index("VAL_AUTO_INFRACAO"),
                    "data": cab.index("DAT_HORA_AUTO_INFRACAO"),
                    "cod": cab.index("COD_MUNICIPIO"),
                    "mun": cab.index("MUNICIPIO"),
                    "uf": cab.index("UF"),
                    "area": cab.index("QT_AREA"),
                    "unidade": cab.index("INFRACAO_AREA"),
                    "bioma": cab.index("DS_BIOMAS_ATINGIDOS"),
                    "embargo": cab.index("CD_TERMOS_EMBARGOS"),
                }
                for col in leitor:
                    if len(col) <= ix["mun"]:
                        continue
                    cod = (col[ix["cod"]] or "").strip()
                    mun = (col[ix["mun"]] or "").strip()
                    uf = (col[ix["uf"]] or "").strip()
                    if not cod or not uf:
                        continue
                    v = dinheiro(col[ix["valor"]])
                    total_autos += 1
                    total_valor += v
                    if (col[ix["cancelado"]] or "").strip().upper() == "S":
                        cancelados += 1
                    chave = f"{uf}-{cod}"
                    a = por_mun.get(chave)
                    if a is None:
                        a = por_mun[chave] = {
                            "cod_ibge": cod, "municipio": mun, "uf": uf,
                            "autos": 0, "valor": 0.0, "area_ha": 0.0, "com_embargo": 0,
                        }
                    a["autos"] += 1
                    a["valor"] += v
                    if "hectare" in (col[ix["unidade"]] or "").lower():
                        a["area_ha"] += qtd(col[ix["area"]])
                    if (col[ix["embargo"]] or "").strip():
                        a["com_embargo"] += 1
                    por_uf[uf]["autos"] += 1
                    por_uf[uf]["valor"] += v
                    if (col[ix["embargo"]] or "").strip():
                        por_uf[uf]["com_embargo"] += 1
                    por_ano[ano]["autos"] += 1
                    por_ano[ano]["valor"] += v
                    bioma = (col[ix["bioma"]] or "").strip()
                    if bioma:
                        por_bioma[bioma] += 1

    registros = []
    for a in por_mun.values():
        a["valor"] = round(a["valor"], 2)
        a["area_ha"] = round(a["area_ha"], 1)
        registros.append(a)
    registros.sort(key=lambda r: -r["autos"])

    acervo = {
        "fonte": "IBAMA — Dados Abertos, Fiscalização - auto de infração (SIFISC)",
        "url_fonte": URL_FONTE,
        "url_arquivo": URL_ARQUIVO,
        "janela": f"{ANO_INICIO} a {ANO_FIM}",
        "atualizado_em": time.strftime("%Y-%m-%d"),
        "metodologia": (
            "Autos de infração lavrados pelo IBAMA, agregados por município (código IBGE), somando a contagem "
            "de autos, o valor da multa e a área autuada (quando a unidade declarada é hectare), com quantos "
            "tiveram termo de embargo. O IBAMA publica o CPF/CNPJ e o nome do infrator na base; este acervo NÃO "
            "copia o infrator — publica só o agregado por território. A base vai de 1977; esta janela é "
            f"{ANO_INICIO}-{ANO_FIM}. Auto lavrado não é condenação definitiva: cabe defesa e recurso."
        ),
        "total_autos": total_autos,
        "total_valor": round(total_valor, 2),
        "autos_cancelados": cancelados,
        "total_municipios": len(registros),
        "por_uf": dict(sorted(por_uf.items(), key=lambda kv: -kv[1]["autos"])),
        "por_ano": dict(sorted(por_ano.items())),
        "por_bioma": dict(sorted(por_bioma.items(), key=lambda kv: -kv[1])),
        "registros": registros,
    }
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(acervo, ensure_ascii=False, indent=1), encoding="utf-8")
    print(
        f"ok: {total_autos:,} autos ({ANO_INICIO}-{ANO_FIM}) | R$ {total_valor:,.2f} | "
        f"{len(registros):,} municípios -> {SAIDA}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
