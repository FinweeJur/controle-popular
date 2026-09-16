"""coletar-ibama-autos.py — autos de infração ambiental lavrados pelo IBAMA.

Baixa o ZIP com o CSV mais recente de autos de infração do portal de dados
abertos do IBAMA e grava JSON compacto em apps/web/data/ibama-autos-infracao.json.

Rodar:
    python scripts/coletar-ibama-autos.py --dry-run     # só mostra URLs e contagens
    python scripts/coletar-ibama-autos.py               # coleta truncada ao limite
    python scripts/coletar-ibama-autos.py --limit 0     # sem truncar (JSON grande!)
    python scripts/coletar-ibama-autos.py --scan-cpf    # varre a saída com o script oficial

## Fonte e licença

- Dataset: https://dadosabertos.ibama.gov.br/dataset/fiscalizacao-auto-de-infracao
- ZIP direto: stibamadadosabertosprd.blob.core.windows.net
  .../dados/SIFISC/auto_infracao/auto_infracao/auto_infracao_csv.zip
- Licença: dado público governamental, atribuição à fonte IBAMA.

## Decisão robots.txt (consultado em 2026-09-16, https://dadosabertos.ibama.gov.br/robots.txt)

`Disallow`: /dataset/rate/, /revision/, /dataset/*/history, /api/. O dataset e
o download do recurso NÃO estão proibidos. `Crawl-Delay: 10` — PAUSA = 10s
entre requisições, conforme o pedido da fonte.

## PRIVACIDADE — a regra mais importante deste coletor

O CSV traz CPF_CNPJ_INFRATOR, TP_PESSOA_INFRATOR e NOME_INFRATOR (o IBAMA
sanciona pessoas físicas). Aqui:
- CPF (11 dígitos, validado por dígito verificador mod-11): NUNCA gravado —
  vai como null + flag `doc_redigido: 1` no registro.
- CNPJ (14 dígitos, verificador igualmente conferido): gravado COMPLETO
  (pessoa jurídica, uso público legítimo).
- Valor NEUTRO quando o documento não fecha como nem um nem outro: null +
  flag, nunca adivinhar o lado protetor.
- NOME_INFRATOR sai sanitizado: CPF colado no texto (padrão MEI/SISBAJUS)
  é removido por expressão genérica, nome vazio fica vazio.
- `--scan-cpf` roda o varredor oficial (mod-11) sobre o JSON gravado; se
  der hit, o coletor sai com código 2 para alguém redigir o campo.

## RESSALVA EDITORIAL

iria no JSON como `ressalva_editorial`: "Cadastro oficial de autos lavrados
pelo IBAMA — presença ou valor aqui não é, por si só, culpabilidade fixada
(ao autuado cabe defesa e recurso)."

## Esquema do CSV (medido ao vivo em 2026-09-16)

ZIP de ~122 MB; CSV interno (auto_infracao_*.csv) com 83 colunas, separador
';'. Colunas mínimas lidas aqui (pandas usecols): NUM_AUTO_INFRACAO,
SER_AUTO_INFRACAO, DS_SIT_AUTO_AIE, VAL_AUTO_INFRACAO, DES_AUTO_INFRACAO,
DES_INFRACAO, MUNICIPIO, UF, DAT_HORA_AUTO_INFRACAO, CPF_CNPJ_INFRATOR,
TP_PESSOA_INFRATOR, NOME_INFRATOR.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import time

sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # console Windows é cp1252
import pandas as pd
import urllib.request
import urllib.error
import zipfile
from datetime import datetime, timezone
from pathlib import Path

BASE = ("https://stibamadadosabertosprd.blob.core.windows.net/dados-abertos/"
        "dados/SIFISC/auto_infracao/auto_infracao/auto_infracao_csv.zip")
PAGE = "https://dadosabertos.ibama.gov.br/dataset/fiscalizacao-auto-de-infracao"
SAIDA = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "ibama-autos-infracao.json"
CACHE = Path(__file__).resolve().parent / ".cache" / "ibama-autos"
UA = "ControlePopular/1.0 (+controlepopular.com.br; dado publico governamental)"
PAUSA = 10  # Crawl-Delay: 10 pedido pelo robots.txt da fonte
LIMITE_PADRAO = 5000

RESSALVA = ("Cadastro oficial de autos lavrados pelo IBAMA — registro administrativo, "
            "não atribuição de culpa; ao autuado cabe defesa e recurso.")

CAMPOS = {
    "NUM_AUTO_INFRACAO": "auto",
    "SER_AUTO_INFRACAO": "serie",
    "DS_SIT_AUTO_AIE": "sit",
    "VAL_AUTO_INFRACAO": "multa",
    "DES_AUTO_INFRACAO": "motivo",
    "DES_INFRACAO": "infr",
    "MUNICIPIO": "mun",
    "UF": "uf",
    "DAT_HORA_AUTO_INFRACAO": "dt_auto",
    "CPF_CNPJ_INFRATOR": "doc",
    "NOME_INFRATOR": "nom",
}
ORDEM = list(CAMPOS)


def _ckpt() -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    return CACHE / "checkpoint.json"


# ───────────────────── documento (CPF × CNPJ × ruído) ─────────────────────

def _valida(cpf_cnpj: str) -> bool:
    n = [int(c) for c in cpf_cnpj]
    base = n[:len(n) - 2]
    p1 = list(range(len(base) + 1, 1, -1))
    soma = sum(d * p for d, p in zip(base, p1))
    dv1 = 0 if soma % 11 < 2 else 11 - soma % 11
    if n[len(base)] != dv1:
        return False
    p2 = list(range(len(base) + 2, 1, -1))
    soma = sum(d * p for d, p in zip(base + [dv1], p2))
    dv2 = 0 if soma % 11 < 2 else 11 - soma % 11
    return n[len(base) + 1] == dv2


def _classificar_doc(v) -> tuple[str | None, bool]:
    """(documento a gravar, doc_redigido). CPF: null + flag; CNPJ: completo."""
    raw = re.sub(r"\D", "", str(v))
    if len(raw) == 11 and _valida(raw):
        # CPF de pessoa física — NUNCA gravado, nem mascarado parcialmente
        # (mascaramento '***.***.***-**' é reversível com a raiz; null é
        # a redação que não se desfaz).
        return None, True
    if len(raw) == 14 and _valida(raw):
        return raw, False  # CNPJ completo é ok (pessoa jurídica)
    return None, True  # ruído/indeterminado — lado protetor: null + flag


def _sanitizar_nome(nome) -> str | None:
    """Remove CPF colado no texto livre — padrão genérico copiado do coletor
    de licenciamento de Betim (etl/betim/etl/apis/ambiental_licenciamento.py):
    expressão ampla, não lista fixa de casos."""
    if not nome:
        return None
    limpo = str(nome)

    def _apagar(m: re.Match) -> str:
        return "" if len(re.sub(r"\D", "", m.group(0))) == 11 else m.group(0)

    limpo = re.sub(r"\d[\d.\-/]{8,}\d", _apagar, limpo)
    limpo = re.sub(r"[-,]?\s*CPF\s*[:\-]?\s*$", " ", limpo, flags=re.IGNORECASE)
    limpo = " ".join(limpo.split()).strip(" -,:")
    return limpo or None


def _multa(v) -> float | None:
    """'107,00' -> 107.0 ( vírgula decimal do CSV IBAMA )."""
    s = str(v).strip()
    if not s:
        return None
    try:
        return float(s.replace(".", "").replace(",", "."))
    except ValueError:
        return None


def _baixar_zip() -> Path:
    """Baixa o ZIP (~122 MB) para o .cache com checkpoint de progresso.

    RETOMADA: o blob não aceita Range (Accept-Ranges: None medido em
    2026-09-16), então não há retomada por HTTP — o checkpoint só registra
    progresso; interrompido, recomeça do zero."""
    ckpt = _ckpt()
    alvo = CACHE / "auto_infracao.zip"
    req = urllib.request.Request(BASE, headers={"User-Agent": UA})
    try:
        resp = urllib.request.urlopen(req, timeout=600)
    except urllib.error.HTTPError as e:
        if e.code in (403, 429):
            print(f"  [!] {e.code} do servidor — esperando 30s e tentando de novo...")
            time.sleep(30)
            resp = urllib.request.urlopen(req, timeout=600)
        else:
            raise
    total = int(resp.headers.get("Content-Length", 0))
    baixados = 0
    tmp = alvo.with_suffix(".zip.parcial")
    with open(tmp, "wb") as f:
        while True:
            pedaco = resp.read(2 << 20)
            if not pedaco:
                break
            f.write(pedaco)
            baixados += len(pedaco)
            ckpt.write_text(json.dumps({
                "url": BASE, "bytes_baixados": baixados, "bytes_totais": total,
                "ata": datetime.now(timezone.utc).isoformat(),
            }), encoding="utf-8")
    resp.close()
    tmp.rename(alvo) if not alvo.exists() else os.replace(tmp, alvo)
    ckpt.write_text(json.dumps({
        "url": BASE, "bytes_baixados": baixados, "bytes_totais": total,
        "concluido": True, "ata": datetime.now(timezone.utc).isoformat(),
    }), encoding="utf-8")
    return alvo


def _data_auto(v) -> str | None:
    s = str(v).strip()
    # vem como '1977-10-16' ou '1977-10-16 12:00:00'
    if not s:
        return None
    return s.split(" ")[0] if s.count("-") == 2 else None


def main() -> None:
    parser = argparse.ArgumentParser(description="Coletor de autos de infração IBAMA (SIFISC)")
    parser.add_argument("--dry-run", action="store_true", help="mostra URLs e contagens estimadas")
    parser.add_argument("--limit", type=int, default=LIMITE_PADRAO, help="trunca linhas gravadas")
    parser.add_argument("--scan-cpf", action="store_true", help="roda o varredor de CPF ao final")
    args = parser.parse_args()

    print("=== IBAMA autos de infração (SIFISC) ===\n")
    print(f"  dataset : {PAGE}")
    print(f"  zip csv : {BASE}")
    print(f"  limite  : {'sem limite' if args.limit == 0 else args.limit}")
    print(f"  robots  : permitido; Crawl-Delay 10 respeitado (pausa {PAUSA}s)")
    print(f"  saida   : {SAIDA}")

    # Sondagem: só HEAD, não baixa o zip TODO
    req = urllib.request.Request(BASE, headers={"User-Agent": UA}, method="HEAD")
    try:
        resp = urllib.request.urlopen(req, timeout=60)
        zip_bytes = int(resp.headers.get("Content-Length", 0))
        fonte_ts = resp.headers.get("Last-Modified", "")
        resp.close()
    except Exception as e:
        print(f"  [!] HEAD falhou: {e}")
        zip_bytes, fonte_ts = 0, ""

    if args.dry_run:
        # CSV dentro do zip: razão média zip/csv do SIFISC medida em
        # downloads anteriores do portal ~9× (CSV ~ 1,1 GB)
        estim_csv = zip_bytes * 9 if zip_bytes else 0
        estim_linhas = estim_csv // 460 if estim_csv else None  # ~460 B/linha
        print(f"  zip          : {zip_bytes:,} bytes")
        print(f"  atualizado   : {fonte_ts}")
        if estim_linhas:
            print(f"  estimativa de linhas : ~{estim_linhas:,} (aproximada)")
            print(f"  JSON com limite atual: ~{min(estim_linhas, args.limit or estim_linhas) * 150 / 1e3:.0f} KB")
            print(f"  JSON sem limite      : ~{estim_linhas * 150 / 1e6:.0f} MB — considere manter o truncamento")
        return

    time.sleep(PAUSA)
    zip_path = _baixar_zip()
    print(f"  zip baixado: {zip_path.stat().st_size:,} bytes")

    with zipfile.ZipFile(zip_path) as z:
        candidatos = [n for n in z.namelist() if n.lower().endswith(".csv")]
        if not candidatos:
            print("  [x] nenhum CSV no zip"); sys.exit(1)
        # o mais recente se houver versões (sufixo _1977 é harmônico por ano na fonte)
        csv_nome = sorted(candidatos)[-1]
        print(f"  CSV interno: {csv_nome}")
        df = pd.read_csv(
            z.open(csv_nome), sep=";", encoding="utf-8-sig", dtype=str,
            keep_default_na=False, usecols=ORDEM,
        )

    total_fonte = len(df)
    print(f"  linhas na fonte: {total_fonte:,}")

    df = df.sort_values("DAT_HORA_AUTO_INFRACAO")
    if args.limit:
        df = df.head(args.limit)  # pega os mais recentes

    linhas = []
    redigidos = 0
    for row in df.to_dict("records"):
        doc, redigido = _classificar_doc(row["CPF_CNPJ_INFRATOR"])
        redigidos += redigido
        linhas.append([
            row["NUM_AUTO_INFRACAO"] + ("-" + row["SER_AUTO_INFRACAO"] if row["SER_AUTO_INFRACAO"] else ""),
            row["DS_SIT_AUTO_AIE"],
            _multa(row["VAL_AUTO_INFRACAO"]),
            (_sanitizar_nome(row["DES_AUTO_INFRACAO"]) or row["DES_INFRACAO"] or None),
            row["MUNICIPIO"].title(),
            row["UF"],
            _data_auto(row["DAT_HORA_AUTO_INFRACAO"]),
            (_sanitizar_nome(row["NOME_INFRATOR"]) or None),
            doc if not redigido and doc else None,
            1 if redigido else 0,
        ])

    dados = {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "fonte": PAGE,
        "zip_url": BASE,
        "fonte_ultima_atualizacao": fonte_ts,
        "total_linhas_fonte": total_fonte,
        "truncado": bool(args.limit and total_fonte > args.limit),
        "docs_redigidos": redigidos,
        "ressalva_editorial": RESSALVA,
        "ldict": CAMPOS,
        "colunas": list(CAMPOS.values()),
        "colunas_originais": ORDEM,
        "obs_doc": "doc=null + docs_redigidos: CPF de PF nunca gravado; CNPJ completo quando PJ.",
        "linhas": linhas,
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    tamanho = SAIDA.stat().st_size / 1024
    print(f"\n[ok] {len(linhas)} de {total_fonte:,} autos → {SAIDA.name} ({tamanho:.0f} KB)"
          + (" — TRUNCADO (use --limit 0)" if dados["truncado"] else ""))
    print(f"     {redigidos} documento(s) redigido(s) (CPF/ruído → null+flag)")

    if args.scan_cpf:
        print("\n  rodando o varredor de CPF sobre a saída (mod-11)...")
        r = subprocess.run([sys.executable, "scripts/checar-dado-pessoal-em-dado.py", "--extra", str(SAIDA)],
                           cwd=Path(__file__).resolve().parent.parent)
        if r.returncode != 0:
            print("  [!] CPF(s) achado(s) no JSON — redigir campo no coletor (null + flag) e regravar.")
            sys.exit(2)
        print("  scan clean.")


if __name__ == "__main__":
    main()
