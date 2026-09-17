"""coletar-imasul-ms-licencas.py — licenciamento e autorizacoes ambientais do IMASUL-MS.

Coleta a relacao publica de licencas e autorizacoes ambientais do Mato Grosso do Sul
a partir do servico oficial ArcGIS REST do IMASUL (PIN-MS) e grava JSON estruturado em
apps/web/data/imasul-ms-licencas.json.

Fonte: https://www.pinms.ms.gov.br/arcgis/rest/services/IMASUL/licencas_ambientais/MapServer/16
Total disponivel: ~40.976 registros

Rodar:
    python scripts/coletar-imasul-ms-licencas.py               # coleta inicial padrao (--limit 500)
    python scripts/coletar-imasul-ms-licencas.py --limit 0     # coleta tudo (~40.976 registros)
    python scripts/coletar-imasul-ms-licencas.py --scan-cpf    # varre CPF com validador oficial

Privacidade e LGPD:
- Sanitizacao de CPF por algoritmo mod-11 oficial.
- CNPJs validos de 14 digitos sao mantidos.
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

URL_BASE = "https://www.pinms.ms.gov.br/arcgis/rest/services/IMASUL/licencas_ambientais/MapServer/16/query"
UA = "ControlePopular/1.0 (+contato@controlepopular.com.br; dado publico governamental)"
UF = "MS"
ORGAO = "IMASUL (MS)"
SAIDA = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "imasul-ms-licencas.json"
CACHE_DIR = Path(__file__).resolve().parent / ".cache" / "imasul-ms"
BATCH_SIZE = 2000
PAUSA = 2  # segundos

RE_CPF = re.compile(r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{11}\b")

PANTANAL_PARAGUAI = {
    "AQUIDAUANA", "CORUMBA", "CORUMBÁ", "LADARIO", "LADÁRIO", "MIRANDA",
    "PORTO MURTINHO", "BONITO", "BODOQUENA", "COXIM", "RIO VERDE DE MATO GROSSO",
    "SONORA", "ANASTACIO", "ANASTÁCIO", "BELA VISTA", "CARACOL", "GUIA LOPES DA LAGUNA",
    "JARDIM", "NIOAQUE", "RIO NEGRO", "CORGUINHO", "ROCHEDO", "DOIS IRMAOS DO BURITI",
    "DOIS IRMÃOS DO BURITI", "TERENOS", "PEDRO GOMES", "ALCINOPOLIS", "ALCINÓPOLIS"
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


def _ms_para_data(ms: int | float | None) -> str | None:
    if not ms or ms <= 0:
        return None
    try:
        dt = datetime.datetime.fromtimestamp(ms / 1000.0, tz=datetime.timezone.utc)
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return None


def _gerar_tags(tipo_lic: str | None, tipo_emp: str | None, situacao: str | None) -> list[str]:
    tags = ["licenca", "imasul", "ms"]
    combinado = f"{tipo_lic or ''} {tipo_emp or ''} {situacao or ''}".lower()
    if "supress" in combinado or "asv" in combinado:
        tags.append("supressao_vegetal")
    if "queima" in combinado:
        tags.append("queima_controlada")
    if "corte" in combinado or "cani" in combinado:
        tags.append("corte_arvores")
    if "previa" in combinado or " lp" in combinado:
        tags.append("licenca_previa")
    if "instalacao" in combinado or " li" in combinado:
        tags.append("licenca_instalacao")
    if "operacao" in combinado or " lo" in combinado:
        tags.append("licenca_operacao")
    if "vigente" in combinado or "emitida" in combinado:
        tags.append("vigente")
    elif "vencida" in combinado or "cancelada" in combinado:
        tags.append("vencida")
    return list(dict.fromkeys(tags))


def _obter_total() -> int:
    params = urllib.parse.urlencode({"where": "1=1", "returnCountOnly": "true", "f": "json"})
    url = f"{URL_BASE}?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as resp:
        d = json.loads(resp.read().decode("utf-8", "ignore"))
        return int(d.get("count", 0))


def _obter_lote(id_inicio: int, id_fim: int) -> list[dict]:
    fields = (
        "objectid,num_autorizacao,data_expedicao,nome_detentor,cnpj,"
        "nome_imovel,municipio,status_licenca,validade_licenca,"
        "tipo_empreendimento,area_informada,car,data_validade,"
        "num_processo,tipo_licenca,ano_expedicao_texto"
    )
    params = urllib.parse.urlencode({
        "where": f"objectid >= {id_inicio} AND objectid <= {id_fim}",
        "outFields": fields,
        "f": "json"
    })
    url = f"{URL_BASE}?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=35) as resp:
        d = json.loads(resp.read().decode("utf-8", "ignore"))
        return [f.get("attributes") for f in d.get("features", []) if f.get("attributes")]


def main() -> int:
    parser = argparse.ArgumentParser(description="Coleta licencas ambientais do IMASUL-MS")
    parser.add_argument("--limit", type=int, default=500, help="Limite de registros (0 = todos)")
    parser.add_argument("--scan-cpf", action="store_true", help="Executa checagem de CPF ao final")
    args = parser.parse_args()

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    print("Consultando total disponivel no IMASUL (MS)...")
    try:
        total_disponivel = _obter_total()
        print(f"Total de registros no IMASUL: {total_disponivel:,}")
    except Exception as e:
        print(f"Erro ao obter total: {e}")
        total_disponivel = 41267

    meta_alvo = total_disponivel if args.limit == 0 else min(args.limit, total_disponivel)
    print(f"Meta de extracao: {meta_alvo:,} registros (limite: {'tudo' if args.limit == 0 else args.limit})")

    linhas = []
    cur_id = 1
    max_id = total_disponivel

    while cur_id <= max_id and (args.limit == 0 or len(linhas) < args.limit):
        tamanho = BATCH_SIZE
        if args.limit > 0:
            tamanho = min(BATCH_SIZE, args.limit - len(linhas))
        high_id = min(cur_id + tamanho - 1, max_id)
        print(f"Baixando lote (objectid {cur_id:,} a {high_id:,})...")
        tentativas = 0
        attrs = []
        while tentativas < 3:
            try:
                attrs = _obter_lote(cur_id, high_id)
                break
            except Exception as e:
                tentativas += 1
                print(f"  Tentativa {tentativas} falhou: {e}. Aguardando 5s...")
                time.sleep(5)

        if not attrs:
            print(f"Lote vazio entre {cur_id} e {high_id}.")
            cur_id = high_id + 1
            continue

        for a in attrs:
            num_aut = str(a.get("num_autorizacao") or "").strip()
            num_proc = str(a.get("num_processo") or "").strip()
            processo = num_aut or num_proc or "s/n"

            dt_inicio = _ms_para_data(a.get("data_expedicao"))
            dt_fim = _ms_para_data(a.get("data_validade"))

            ano = None
            ano_txt = a.get("ano_expedicao_texto")
            if ano_txt and str(ano_txt).isdigit():
                ano = int(ano_txt)
            elif dt_inicio:
                try:
                    ano = int(dt_inicio.split("-")[0])
                except Exception:
                    pass

            mun = str(a.get("municipio") or "").strip()
            mun = mun if mun else None

            # Bacia hidrografica
            bacia = "Bacia do Rio Paraná"
            if mun and mun.upper() in PANTANAL_PARAGUAI:
                bacia = "Bacia do Rio Paraguai (Pantanal)"

            tipo_lic = str(a.get("tipo_licenca") or "").strip() or "Licença Ambiental"
            tipo_emp = str(a.get("tipo_empreendimento") or "").strip()
            tipo = f"{tipo_lic} — {tipo_emp}" if tipo_emp and tipo_lic != "Outro" else (tipo_emp or tipo_lic)

            empresa_raw = a.get("nome_detentor") or a.get("nome_imovel") or a.get("cnpj")
            empresa = _apagar_cpf(str(empresa_raw).strip()) if empresa_raw else None

            status = a.get("status_licenca") or "Emitida"
            validade_desc = a.get("validade_licenca") or ""
            situacao = f"{status} ({validade_desc})" if validade_desc else status

            area = a.get("area_informada")
            area_str = f" · Área: {area:.1f} ha" if (area and isinstance(area, (int, float)) and area > 0) else ""

            imovel = str(a.get("nome_imovel") or "").strip()
            imovel_str = f" · Imóvel: {imovel}" if imovel else ""

            microresumo = f"{tipo[:90]} · {mun or 'MS'}{imovel_str}{area_str} · Validade: {dt_fim or 'indeterminada'}"
            tags = _gerar_tags(tipo_lic, tipo_emp, situacao)

            linhas.append({
                "orgao": ORGAO,
                "uf": UF,
                "ano": ano,
                "categoria": "licenca",
                "tipo": _apagar_cpf(tipo),
                "empresa": empresa,
                "municipio": mun.title() if mun else None,
                "bacia": bacia,
                "data_inicio": dt_inicio,
                "data_fim": dt_fim,
                "situacao": situacao,
                "processo": _apagar_cpf(processo),
                "microresumo": _apagar_cpf(microresumo),
                "tags": tags,
            })

            if len(linhas) >= meta_alvo:
                break

        cur_id = high_id + 1
        print(f"Total coletado ate agora: {len(linhas):,} / {meta_alvo:,} (processado ate ID {high_id:,})")
        time.sleep(PAUSA)

    resultado = {
        "gerado_em": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "fonte": "https://www.pinms.ms.gov.br/arcgis/rest/services/IMASUL/licencas_ambientais/MapServer/16",
        "truncado": len(linhas) < total_disponivel,
        "total": len(linhas),
        "total_disponivel": total_disponivel,
        "ressalva_editorial": (
            "Licenças e autorizações ambientais concedidas pelo IMASUL-MS (SIRIEMA/PIN-MS). "
            "A concessão do ato ambiental atesta regularidade na data de emissão e "
            "permanece vinculada ao estrito cumprimento das condicionantes e prazos estabelecidos no processo administrativo."
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
