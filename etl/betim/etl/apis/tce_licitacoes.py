"""Carga de licitações do cache TCE-MG (ZIPs SICOM) para a tabela `licitacoes`.

Mesmo molde de `etl.apis.tce_mg` (contratos): lê `SICOM.<ano>.<cod>.licitacao.zip`
do cache local, parseia o CSV `;`, grava com `fonte='tce_mg_sicom'` e
`chave_fonte=seq_licitacao`. Upsert por (id_municipio, fonte, chave_fonte).

O CSV do SICOM **não tem valor estimado/homologado de licitação** — só
empenhado/liquidado/pago (execução orçamentária). Valor fica null; a tela
mostra o objeto e a modalidade, e a ressalva de que o valor não veio da fonte.

Uso:
    python -m etl.apis.tce_licitacoes --cache X:/DevCoder/.tce-cache --todas
    python -m etl.apis.tce_licitacoes --cache ... --dry-run --todas
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import io
import json
import os
import re
import sys
import zipfile

from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client, upsert_com_colunas_opcionais

LOG = "[etl.apis.tce_licitacoes]"
FONTE = "tce_mg_sicom"


def _data(texto: str | None) -> str | None:
    s = (texto or "").strip()
    if not s or set(s) <= {"0"} or len(s) != 8 or not s.isdigit():
        return None
    try:
        return dt.date(int(s[:4]), int(s[4:6]), int(s[6:8])).isoformat()
    except ValueError:
        return None


def _limpar_codigo(dsc: str | None) -> str | None:
    s = (dsc or "").strip()
    if not s or s == "-":
        return None
    m = re.match(r"^\s*\d+\s*-\s*(.+)$", s)
    return (m.group(1) if m else s).strip() or None


def _csv(zf: zipfile.ZipFile, sufixo: str) -> list[dict]:
    nome = next((n for n in zf.namelist() if n.endswith(f".{sufixo}.csv")), None)
    if not nome:
        return []
    texto = zf.read(nome).decode("utf-8", errors="replace")
    return list(csv.DictReader(io.StringIO(texto), delimiter=";"))


def _parse_licitacoes(zip_bytes: bytes, id_municipio: str, ano: int) -> list[dict]:
    zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
    linhas_csv = _csv(zf, "licitacao")
    linhas: list[dict] = []
    for r in linhas_csv:
        seq = (r.get("seq_licitacao") or "").strip()
        if not seq:
            continue
        objeto = (r.get("dsc_objeto_licitacao") or "").strip() or None
        processo = (r.get("num_processo") or "").strip() or None
        ano_proc = (r.get("num_ano_processo") or "").strip()
        if processo and ano_proc:
            processo = f"{processo}/{ano_proc}"
        modalidade = _limpar_codigo(r.get("dsc_modalidade"))
        pub = _data(r.get("dat_pub_edital"))
        abert = _data(r.get("dat_abert_proc_adm"))
        raw = dict(r)
        linhas.append(
            {
                "id_municipio": id_municipio,
                "fonte": FONTE,
                "chave_fonte": seq,
                "numero_controle_pncp": None,
                "orgao_cnpj": None,
                "orgao_nome": None,
                "unidade_nome": None,
                "modalidade_id": None,
                "modalidade_nome": modalidade,
                "objeto": objeto,
                "processo": processo,
                "srp": "REGISTRO DE PRE" in (r.get("dsc_nat_processo") or "").upper()
                or "REGISTRO DE PRE" in (objeto or "").upper(),
                # SICOM não publica valor estimado/homologado da licitação.
                "valor_estimado": None,
                "valor_homologado": None,
                "situacao": _limpar_codigo(r.get("dsc_tipo_cadastro")),
                "data_publicacao_pncp": pub,
                "data_abertura": abert,
                "data_encerramento": None,
                "link_sistema_origem": "https://dadosabertos.tce.mg.gov.br/",
                "raw": raw,
            }
        )
    return linhas


def _cidades_no_cache(cache_dir: str) -> list[str]:
    ids: set[str] = set()
    for nome in os.listdir(cache_dir):
        m = re.match(r"^SICOM\.\d{4}\.(\d{7})\.licitacao\.zip$", nome)
        if m:
            ids.add(m.group(1))
    return sorted(ids)


def _iter_cache(cache_dir: str, id_municipio: str):
    padrao = re.compile(rf"^SICOM\.(\d{{4}})\.{re.escape(id_municipio)}\.licitacao\.zip$")
    achou = False
    for nome in sorted(os.listdir(cache_dir)):
        m = padrao.match(nome)
        if not m:
            continue
        achou = True
        with open(os.path.join(cache_dir, nome), "rb") as f:
            yield int(m.group(1)), f.read()
    if not achou:
        raise RuntimeError(f"{LOG}: nenhum ZIP de licitação de {id_municipio} em {cache_dir}")


def sync(id_municipio: str, origem_iter, *, dry_run: bool) -> list[dict]:
    linhas: list[dict] = []
    anos: list[int] = []
    for ano, zip_bytes in origem_iter:
        do_ano = _parse_licitacoes(zip_bytes, id_municipio, ano)
        anos.append(ano)
        linhas.extend(do_ano)
    por_ano = {}
    for l in linhas:
        # ano de referência do edital
        y = (l.get("data_publicacao_pncp") or "")[:4] or "?"
        por_ano[y] = por_ano.get(y, 0) + 1
    print(
        f"{LOG} {id_municipio}: {len(linhas)} licitação(ões) em {len(anos)} ano(s) "
        f"[{min(anos) if anos else '-'}-{max(anos) if anos else '-'}] "
        f"por ano pub: {dict(sorted(por_ano.items()))}"
    )
    if dry_run:
        if linhas:
            ex = linhas[0]
            print(
                f"{LOG}   exemplo: seq={ex['chave_fonte']} mod={ex['modalidade_nome']} "
                f"pub={ex['data_publicacao_pncp']} obj={(ex['objeto'] or '')[:60]}"
            )
        return linhas
    if not linhas:
        print(f"{LOG} nada parseado — não escrevo.")
        return linhas
    client = get_supabase_client()
    upsert_com_colunas_opcionais(
        client,
        "licitacoes",
        linhas,
        [],
        on_conflict="id_municipio,fonte,chave_fonte",
    )
    print(f"{LOG} {id_municipio}: {len(linhas)} gravada(s) (fonte={FONTE}).")
    return linhas


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument("--cache", required=True)
    parser.add_argument("--todas", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    ids = _cidades_no_cache(args.cache) if args.todas else [args.id_municipio]
    total = 0
    for idm in ids:
        total += len(sync(idm, _iter_cache(args.cache, idm), dry_run=args.dry_run))
    print(f"{LOG} total={total}")
