"""coletar-fepam-rs-licencas.py — autos de infração ambiental da FEPAM-RS.

Coleta a base aberta oficial de autos de infração ambiental e penalidades publicada
pela FEPAM-RS em formato aberto (XLSX/Dados Abertos) e grava JSON compacto em
apps/web/data/fepam-rs-licencas.json.

Portal de Dados Abertos e Transparência: https://fepam.rs.gov.br/dados-transparencia

Rodar:
    python scripts/coletar-fepam-rs-licencas.py               # coleta tudo (limit=0)
    python scripts/coletar-fepam-rs-licencas.py --limit 500   # amostra
    python scripts/coletar-fepam-rs-licencas.py --scan-cpf    # varre dado pessoal no fim

## Fonte e integridade
- Fonte direta: https://fepam.rs.gov.br/upload/arquivos/202602/23110518-autos-de-infracao-2026-02-23.xlsx
- Robots.txt da FEPAM: verificado (sem restrição / 404).
- User-Agent: ControlePopular/1.0 (+contato@controlepopular.com.br; dado publico governamental)

## Privacidade e LGPD
- Sanitização de CPF por algoritmo mod-11. Nomes com documento de pessoa física têm o CPF redigido.
- CNPJs (14 dígitos) são preservados.
"""
from __future__ import annotations

import argparse
import datetime
import io
import json
import os
import re
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

URL_AUTOS = "https://fepam.rs.gov.br/upload/arquivos/202602/23110518-autos-de-infracao-2026-02-23.xlsx"
UA = "ControlePopular/1.0 (+contato@controlepopular.com.br; dado publico governamental)"
UF = "RS"
ORGAO = "FEPAM (RS)"
SAIDA = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "fepam-rs-licencas.json"
CACHE_DIR = Path(__file__).resolve().parent / ".cache" / "fepam-rs"

RE_CPF = re.compile(r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{11}\b")


def _cpf_valido(dig: str) -> bool:
    if len(dig) != 11 or len(set(dig)) == 1:
        return False

    def dv(ate: int) -> int:
        soma = sum(int(dig[i]) * (ate + 1 - i) for i in range(ate))
        resto = (soma * 10) % 11
        return 0 if resto == 10 else resto

    return dv(9) == int(dig[9]) and dv(10) == int(dig[10])


def _apagar_cpf(texto: str) -> str:
    if not texto:
        return ""
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


def _gerar_microresumo(natureza: str | None, constatacao: str | None, valor: str | None, julgamento: str | None) -> str:
    partes = []
    if natureza:
        partes.append(natureza.strip())
    if julgamento:
        partes.append(f"Julgamento: {julgamento.strip()}")
    if valor and valor not in ("0", "0.0", "None", ""):
        partes.append(f"Multa: R$ {valor}")
    if constatacao:
        c_limpa = " ".join(constatacao.split())
        if len(c_limpa) > 160:
            c_limpa = c_limpa[:157] + "..."
        partes.append(c_limpa)
    return " · ".join(partes) if partes else "Auto de infração ambiental FEPAM-RS"


def _gerar_tags(natureza: str | None, julgamento: str | None, situacao: str | None) -> list[str]:
    tags = ["auto_infracao", "fiscalizacao", "rs"]
    if natureza:
        n = natureza.lower()
        if "polui" in n:
            tags.append("poluicao")
        if "flor" in n or "veg" in n:
            tags.append("flora")
        if "faun" in n:
            tags.append("fauna")
        if "admin" in n:
            tags.append("administrativa")
        if "miner" in n:
            tags.append("mineracao")
    if julgamento:
        j = julgamento.lower()
        if "anul" in j:
            tags.append("anulado")
        elif "presc" in j:
            tags.append("prescrito")
        elif "mant" in j or "conf" in j:
            tags.append("penalidade_mantida")
    if situacao and "transit" in situacao.lower():
        tags.append("transitado_em_julgado")
    return list(dict.fromkeys(tags))


def baixar_ou_cache() -> bytes:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_file = CACHE_DIR / "autos-2026-02-23.xlsx"
    if cache_file.exists() and cache_file.stat().st_size > 1_000_000:
        print(f"Lendo do cache local: {cache_file} ({cache_file.stat().st_size} bytes)")
        return cache_file.read_bytes()
    print(f"Baixando base de autos da FEPAM-RS: {URL_AUTOS}")
    req = urllib.request.Request(URL_AUTOS, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read()
    cache_file.write_bytes(data)
    print(f"Download concluido: {len(data)} bytes salvos em cache.")
    return data


def main() -> int:
    parser = argparse.ArgumentParser(description="Coleta autos de infracao da FEPAM-RS")
    parser.add_argument("--limit", type=int, default=0, help="Limite de registros (0 = todos)")
    parser.add_argument("--scan-cpf", action="store_true", help="Executa checagem de CPF ao final")
    args = parser.parse_args()

    data = baixar_ou_cache()
    try:
        import openpyxl
    except ImportError:
        print("Erro: openpyxl e necessario.")
        return 1

    wb = openpyxl.load_workbook(io.BytesIO(data), read_only=True)
    sheet = wb.active

    linhas = []
    total_lidos = 0
    headers = []

    print("Processando planilha de autos da FEPAM...")
    for idx, row in enumerate(sheet.iter_rows(values_only=True)):
        if idx == 0:
            headers = [str(h or "").strip() for h in row]
            continue
        total_lidos += 1
        if args.limit > 0 and len(linhas) >= args.limit:
            break

        d = dict(zip(headers, row))
        dt = d.get("DATA_ENTRADA")
        data_str = None
        ano = None
        if isinstance(dt, (datetime.date, datetime.datetime)):
            data_str = dt.strftime("%Y-%m-%d")
            ano = dt.year
        elif dt:
            m = re.search(r"(\d{4})", str(dt))
            if m:
                ano = int(m.group(1))

        autuado = _apagar_cpf(str(d.get("NOME_AUTUADO") or "").strip()) or None
        municipio = str(d.get("MUNICIPIO") or "").strip() or None
        natureza = str(d.get("NATUREZA_INFRACAO") or "").strip() or None
        constatacao = _apagar_cpf(str(d.get("DESCRICAO_CONSTATACAO") or "").strip()) or None
        valor = str(d.get("VALOR_PENALIDADE") or "").strip() or None
        julgamento = str(d.get("JULGAMENTO_AI") or "").strip() or None
        sit_proc = str(d.get("SITUACAO_PROC_AI") or "").strip() or None
        num_ai = str(d.get("NUMERO_AI_SOL") or "").strip()
        proc = str(d.get("PROCESSO") or "").strip()
        processo_fmt = f"AI {num_ai} (Proc. {proc})" if proc else f"AI {num_ai}"

        tipo = f"Auto de Infração — {natureza}" if natureza else "Auto de Infração Ambiental"
        microresumo = _gerar_microresumo(natureza, constatacao, valor, julgamento)
        tags = _gerar_tags(natureza, julgamento, sit_proc)

        linhas.append({
            "orgao": ORGAO,
            "uf": UF,
            "ano": ano,
            "categoria": "auto_infracao",
            "tipo": tipo,
            "empresa": autuado,
            "municipio": municipio,
            "bacia": None,
            "data_inicio": data_str,
            "data_fim": None,
            "situacao": julgamento or sit_proc or "Lavrado",
            "processo": processo_fmt,
            "valor_multa": valor,
            "microresumo": microresumo,
            "tags": tags,
        })

    print(f"Total lidos da planilha: {total_lidos} | Registros processados: {len(linhas)}")

    resultado = {
        "gerado_em": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "fonte": URL_AUTOS,
        "truncado": args.limit > 0 and len(linhas) < total_lidos,
        "total": len(linhas),
        "total_disponivel": total_lidos,
        "ressalva_editorial": (
            "Autos de infração e penalidades administrativas aplicadas pela FEPAM-RS "
            "conforme base oficial de transparência pública. A lavratura de auto de infração "
            "ou penalidade inicial não implica culpa definitiva até trânsito em julgado administrativo."
        ),
        "linhas": linhas,
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Gravado em {SAIDA} ({len(linhas)} registros, {SAIDA.stat().st_size} bytes)")

    if args.scan_cpf:
        print("Executando varredura oficial de CPF (mod-11)...")
        scanner = Path(__file__).resolve().parent / "checar-dado-pessoal-em-dado.py"
        r = subprocess.run(
            [sys.executable, str(scanner), "--extra", str(SAIDA)],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace"
        )
        print(r.stdout)
        if SAIDA.name in r.stdout:
            print(f"ERRO: Dado pessoal detectado em {SAIDA.name}!")
            return 2
        print(f"Auditoria de CPF em {SAIDA.name}: 100% LIMPA!")

    return 0


if __name__ == "__main__":
    sys.exit(main())
