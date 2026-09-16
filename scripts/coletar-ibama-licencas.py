"""coletar-ibama-licencas.py — licenças ambientais emitidas pelo IBAMA (SISLIC/DILIC).

Baixa o CSV de licenças do portal de dados abertos do IBAMA e grava JSON
compacto em apps/web/data/ibama-licencas.json.

Rodar:
    python scripts/coletar-ibama-licencas.py --dry-run   # só mostra URLs e contagens
    python scripts/coletar-ibama-licencas.py             # coleta truncada ao limite
    python scripts/coletar-ibama-licencas.py --limit 0   # sem truncar
    python scripts/coletar-ibama-licencas.py --scan-cpf  # roda o varredor de CPF ao final

## Fonte e licença

- Dataset: https://dadosabertos.ibama.gov.br/dataset/licencas-ambientais-de-atividades-e-empreendimentos-licenciados-pelo-ibama
- CSV direto: stibamadadosabertosprd.blob.core.windows.net .../SISLIC/sislic-licencas.csv
- Licença: dado público governamental, atribuição à fonte IBAMA.

## Decisão robots.txt (consultado em 2026-09-16, https://dadosabertos.ibama.gov.br/robots.txt)

`Disallow`: /dataset/rate/, /revision/, /dataset/*/history, /api/. Página de
dataset e download de recurso em /data NÃO são proibidos. `Crawl-Delay: 10`
— este coletor usa PAUSA = 10s entre requisições, conforme o pedido da fonte.

## Privacidade

O CSV NÃO tem coluna de CPF/CNPJ — só NOM_PESSOA (nome do pessoa física/jurídica).
Ainda assim o texto livre pode trazer CPF colado ao nome (caso real medido no
acervo Rouanet e no IDE-Sisema). _sanitizar_doc_em_nome aplica o mesmo padrão
genérico do coletor de Betim: remove qualquer número de 11 dígitos (CPF) de
todo texto antes de gravar. `--scan-cpf` roda o varredor oficial ao final.

## Esquema do CSV (medido ao vivo em 2026-09-16)

DES_TIPOLICENCA;NUM_LICENCA;DAT_EMISSAO;DAT_VENCIMENTO;NOM_EMPREENDIMENTO;
NOM_PESSOA;NUM_PROCESSO_IBAMA;DES_TIPOLOGIA;PAC;ultima_atualizacao_relatorio
Separador ';' lógico (veio em ';' mesmo), ~3,3 MB, sem coluna de município/UF
nem de CPF/CNPJ — os campos municipio/uf/cnpj da tabela D1 nasceram nulos.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time

sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # console Windows é cp1252
from datetime import datetime, timezone
from pathlib import Path

import urllib.request
import urllib.error

try:
    import pandas as pd
except ImportError:
    pd = None

BASE = "https://stibamadadosabertosprd.blob.core.windows.net/dados-abertos/dados/SISLIC/sislic-licencas.csv"
PAGE = "https://dadosabertos.ibama.gov.br/dataset/licencas-ambientais-de-atividades-e-empreendimentos-licenciados-pelo-ibama"
SAIDA = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "ibama-licencas.json"
CACHE = Path(__file__).resolve().parent / ".cache" / "ibama-licencas"
UA = "ControlePopular/1.0 (+controlepopular.com.br; dado publico governamental)"
PAUSA = 10  # Crawl-Delay: 10 pedido pelo robots.txt da fonte
LIMITE_PADRAO = 5000

# Colunas mínimas do CSV -> rótulos curtos no JSON (compactação: cabeçalho
# interno 1× no "ldict", linhas viram array de arrays)
CAMPOS = {
    "NUM_PROCESSO_IBAMA": "proc",
    "NUM_LICENCA": "lic",
    "DES_TIPOLICENCA": "tipo",
    "NOM_EMPREENDIMENTO": "emp",
    "DES_TIPOLOGIA": "tipol",
    "DAT_EMISSAO": "dt_emi",
    "DAT_VENCIMENTO": "dt_ven",
    "PAC": "pac",
}
ORDEM = list(CAMPOS)  # ordem da leitura no pandas (usecols)


def _checkpoint():
    """Checkpoint: última URL baixada + bytes baixados (progresso/status)."""
    CACHE.mkdir(parents=True, exist_ok=True)
    return CACHE / "checkpoint.json"


def _baixar_csv() -> tuple[Path, int, str]:
    """Baixa o CSV para o .cache com checkpoint de progresso. Devolve
    (caminho, bytes, last-modified-da-fonte).

    RETOMADA: o blob NÃO aceita Range (Accept-Ranges: None medido em
    2026-09-16), então não dá para continuar de onde parou por HTTP. O
    checkpoint registra só progresso — interrompido, recomeça do zero."""
    ckpt = _checkpoint()
    alvo = CACHE / "sislic-licencas.csv"
    req = urllib.request.Request(BASE, headers={"User-Agent": UA})
    try:
        resp = urllib.request.urlopen(req, timeout=120)
    except urllib.error.HTTPError as e:
        if e.code in (403, 429):
            print(f"  [!] {e.code} do servidor — esperando 30s e tentando de novo...")
            time.sleep(30)
            resp = urllib.request.urlopen(req, timeout=120)
        else:
            raise
    total = int(resp.headers.get("Content-Length", 0))
    fonte_ts = resp.headers.get("Last-Modified", "")
    baixados = 0
    tmp = alvo.with_suffix(".parcial")
    with open(tmp, "wb") as f:
        while True:
            pedaco = resp.read(1 << 20)
            if not pedaco:
                break
            f.write(pedaco)
            baixados += len(pedaco)
            ckpt.write_text(json.dumps({
                "url": BASE,
                "bytes_baixados": baixados,
                "bytes_totais": total,
                "ata": datetime.now(timezone.utc).isoformat(),
            }, ensure_ascii=False), encoding="utf-8")
    resp.close()
    baixados_final = baixados
    import os
    os.replace(tmp, alvo)  # Windows: rename falha se o alvo já existe
    ckpt.write_text(json.dumps({
        "url": BASE, "bytes_baixados": baixados_final, "bytes_totais": total,
        "concluido": True, "ata": datetime.now(timezone.utc).isoformat(),
    }, ensure_ascii=False), encoding="utf-8")
    ckpt.write_text(json.dumps({
        "url": BASE, "bytes_baixados": baixados, "bytes_totais": total,
        "concluido": True, "ata": datetime.now(timezone.utc).isoformat(),
    }, ensure_ascii=False), encoding="utf-8")
    return alvo, baixados_final or total, fonte_ts


def _data_iso(v) -> str | None:
    """'31/08/2026' -> '2026-08-31'."""
    s = str(v).strip()
    if not s or s in ("nan", "None"):
        return None
    p = s.split("/")
    if len(p) != 3:
        return None
    return f"{p[2]}-{p[1].zfill(2)}-{p[0].zfill(2)}"


def _sanitizar_doc_em_nome(nome) -> str | None:
    """Remove CPF (11 dígitos, com ou sem pontuação) do texto livre do nome —
    padrão genérico, não lista fixa de casos (lição do IDE-Sisema/Rouanet)."""
    import re
    if not nome:
        return None
    limpo = str(nome)

    def _apagar(m: re.Match) -> str:
        return "" if len(re.sub(r"\D", "", m.group(0))) == 11 else m.group(0)

    limpo = re.sub(r"\d[\d.\-]{8,}\d", _apagar, limpo)
    limpo = " ".join(limpo.split()).strip(" -,:")
    return limpo or None


def main() -> None:
    parser = argparse.ArgumentParser(description="Coletor de licenças IBAMA (SISLIC)")
    parser.add_argument("--dry-run", action="store_true", help="mostra URLs e contagem estimada, não baixa tudo")
    parser.add_argument("--limit", type=int, default=LIMITE_PADRAO, help="trunca linhas gravadas")
    parser.add_argument("--scan-cpf", action="store_true", help="roda o varredor de CPF sobre a saída")
    args = parser.parse_args()

    print("=== IBAMA licenças (SISLIC) ===\n")
    print(f"  dataset : {PAGE}")
    print(f"  csv     : {BASE}")
    print(f"  limite  : {'sem limite' if args.limit == 0 else args.limit}")
    print(f"  robots  : permitido; Crawl-Delay 10 respeitado (pausa {PAUSA}s)")
    print(f"  saida   : {SAIDA}")

    # sondagem mínima: só um HEAD, sem baixar corpo
    req = urllib.request.Request(BASE, headers={"User-Agent": UA}, method="HEAD")
    try:
        resp = urllib.request.urlopen(req, timeout=60)
        total_bytes = int(resp.headers.get("Content-Length", 0))
        fonte_ts = resp.headers.get("Last-Modified", "")
        resp.close()
    except Exception as e:
        print(f"  [!] HEAD falhou: {e}")
        total_bytes = 0
        fonte_ts = ""

    if args.dry_run:
        # ~bytes por linha medido na linha 2 da amostra (~180 bytes)
        estim_linhas = total_bytes // 180 if total_bytes else None
        print(f"  tamanho CSV : {total_bytes:,} bytes")
        print(f"  atualizado  : {fonte_ts}")
        if estim_linhas:
            print(f"  estimativa de linhas : ~{estim_linhas:,}")
            print(f"  estimativa JSON compacto : ~{estim_linhas * 120 / 1e6:.1f} MB com --limit 0, "
                  f"~{min(estim_linhas, args.limit) * 120 / 1e3:.0f} KB com limite atual")
        else:
            print("  estimativa: desconhecida (HEAD falhou)")
        return

    time.sleep(PAUSA)
    caminho, baixados, _ = _baixar_csv()
    print(f"  baixado: {baixados:,} bytes → {caminho}")

    df = pd.read_csv(
        caminho, sep=";", encoding="utf-8-sig", dtype=str, keep_default_na=False,
        usecols=ORDEM,
    )
    total_fonte = len(df)
    if args.limit:
        df = df.head(args.limit)

    linhas = []
    for row in df.to_dict("records"):
        # NOM_PESSOA solta não entra no JSON (nome de pessoa física sem
        # necessidade; o empreendimento sim, já sanitizado)
        nome = _sanitizar_doc_em_nome(row["NOM_EMPREENDIMENTO"])
        linhas.append([
            row["NUM_PROCESSO_IBAMA"],
            row["NUM_LICENCA"],
            row["DES_TIPOLICENCA"],
            nome,
            row["DES_TIPOLOGIA"],
            _data_iso(row["DAT_EMISSAO"]),
            _data_iso(row["DAT_VENCIMENTO"]),
            row["PAC"],
        ])

    dados = {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "fonte": PAGE,
        "csv_url": BASE,
        "fonte_ultimo_update": fonte_ts,
        "total_linhas_fonte": total_fonte,
        "truncado": bool(args.limit and total_fonte > args.limit),
        "ldict": {k: v for k, v in CAMPOS.items()},
        "colunas": list(CAMPOS.values()),
        "colunas_originais": ORDEM,
        "obs": "CSV da fonte não informa município/UF nem CPF/CNPJ da licenciada.",
        "linhas": linhas,
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    tam_kb = SAIDA.stat().st_size / 1024
    print(f"\n[ok] {len(linhas)} de {total_fonte} licenças → {SAIDA.name} ({tam_kb:.0f} KB)"
          + (" — TRUNCADO (use --limit 0)" if dados["truncado"] else ""))

    if args.scan_cpf:
        print("\n  rodando o varredor de CPF sobre a saída...")
        r = subprocess.run([sys.executable, "scripts/checar-dado-pessoal-em-dado.py", "--extra", str(SAIDA)])
        if r.returncode != 0:
            print("  [!] CPF(s) achado(s) no JSON — redigir campo no coletor (substituir por null+flag).")
            sys.exit(2)
        print("  scan clean.")


if __name__ == "__main__":
    main()
