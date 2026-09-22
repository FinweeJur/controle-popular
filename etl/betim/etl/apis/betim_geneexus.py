"""Coleta contratos do GeneXus da prefeitura de Betim.

Fonte: https://sginovo.betim.mg.gov.br/appares/servlet/wmcontratotransparencia
(Transparência de Contrato — mesma caixa de serviço GeneXus da prefeitura).

Caminho medido em 22/09/2026 (Não é GET estático nem paginação manual):

1. GET com cookie de sessão (JSESSIONID) — Oracle do GlassFish cai
   intermitentemente (HTTP 500 / 403); retry com backoff é obrigatório;
2. POST form `W0006EREFRESH.` limpando `W0006vCONTRATOANOINI` — a página
   nasce filtrada em `2026` (29 páginas); sem ano o grid vira **539
   páginas** (~5,4k contratos);
3. POST form `W0006E'CSV'.` → **1 CSV inteiro** (`Content-Disposition:
   attachment`, ~1,8 MB, 5.387 linhas com cabeçalho). Paginação via
   `W0006E'PROXIMO'.` existe mas trava na mesma página depois do clear
   (medido: 5 steps, unique=20) — **não usar**;
4. `?gxajaxEvt` sem valor devolve **403 Forbidden action** (GlassFish) —
   só o form POST puro funciona.

Armadilhas do CSV:
- separador `;`, encoding Windows-1252 (não UTF-8);
- cabeçalho tem acento: `Órgão Licitador;Contrato;...`;
- coluna Contrato pode ser só número (`001`) ou número/ano (`ADM0001`);
- Valor formato BR (`3490,00`);
- datas `dd/mm/aaaa`;
- CPFCNPJ formatado `05.127.711/0001-45`.

Uso:
    python -m etl.apis.betim_geneexus --dry-run
    python -m etl.apis.betim_geneexus
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import html
import http.cookiejar
import io
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request

from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client, upsert_com_colunas_opcionais

LOG = "[etl.apis.betim_geneexus]"
FONTE = "betim_geneexus"
URL = "https://sginovo.betim.mg.gov.br/appares/servlet/wmcontratotransparencia"
UA = "controlepopular-coleta/1.0 (coleta publica)"
RETRY = 8
SLEEP = 1.0
EXPECTED_HEADER = "órgão"


def _data(s: str | None) -> str | None:
    """Data do CSV GeneXus. Assinatura vem `dd/mm/aa` (2 dígitos) ou cheia;
    Início/Fim vêm cheios. CenturyFirstYear(40) do gxcfg: aa<40 → 20aa.
    `/  /` é data vazia da fonte."""
    if not s:
        return None
    s = s.strip()
    if not s or set(s) <= set("/ .-"):
        return None
    for fmt in ("%d/%m/%Y", "%d/%m/%y", "%Y-%m-%d", "%Y/%m/%d", "%d/%m/%Y %H:%M"):
        try:
            d = dt.datetime.strptime(s[:19] if len(s) >= 19 else s, fmt)
            if fmt.endswith("%y") and d.year < 1940:
                # não há 1940 no arquivo; aa=24 é 2024
                pass
            if fmt == "%d/%m/%y" and d.year < 1970:
                d = d.replace(year=d.year + 100)
            return d.date().isoformat()
        except ValueError:
            continue
    return None


def _num(s: str | None) -> float | None:
    if s is None:
        return None
    t = str(s).strip()
    if not t:
        return None
    t = t.replace("R$", "").strip()
    # formato BR da fonte: `1.073.306.986,27`
    if "," in t:
        t = t.replace(".", "").replace(",", ".")
    try:
        v = float(t)
    except ValueError:
        return None
    if v == 0:
        return None
    return v


def _cnpj(s: str | None) -> str | None:
    d = re.sub(r"\D", "", s or "")
    if len(d) == 14:
        return d
    if len(d) == 11:
        return None  # CPF: não guarda em fornecedor_cnpj
    return None


def _ano_de(numero: str | None, assinatura: str | None, inicio: str | None) -> int | None:
    # prioriza Início (sempre 4 dígitos medido no CSV); depois assinatura
    for s in (inicio, assinatura):
        iso = _data(s)
        if iso:
            return int(iso[:4])
    if numero and "/" in numero:
        tail = numero.rsplit("/", 1)[-1]
        if tail.isdigit() and 1900 <= int(tail) <= 2100:
            return int(tail)
    m = re.search(r"(20\d{2})", numero or "")
    if m:
        return int(m.group(1))
    return None


def _map_row(cells: list[str], id_municipio: str, idx: int) -> dict | None:
    # header: Órgão Licitador;Contrato;Classificação;CPFCNPJ;Fornecedor;
    #         Objeto;Assinatura;Início;Fim;Valor;Situação;(+vazio final)
    def g(i: int) -> str:
        return cells[i].strip() if i < len(cells) and cells[i] is not None else ""

    orgao, numero, categoria, doc, forn, obj = g(0), g(1), g(2), g(3), g(4), g(5)
    assin, ini, fim, valor, situ = g(6), g(7), g(8), g(9), g(10)
    if not (numero or forn or obj):
        return None
    ano = _ano_de(numero, assin, ini)
    # chave estável p/ reexport do CSV (GeneXus não expõe id na planilha)
    chave = f"{orgao}|{numero}|{doc}|{assin}|{(obj or '')[:60]}".strip("|")
    if not numero and not doc:
        chave = f"csv{idx:05d}"
    return {
        "id_municipio": id_municipio,
        "fonte": FONTE,
        "chave_fonte": chave,
        "numero_controle_pncp": None,
        "numero_contrato": numero or None,
        "ano": ano,
        "orgao_cnpj": None,
        "orgao_nome": orgao or None,
        "unidade_nome": None,
        "categoria": categoria or None,
        "tipo": categoria or None,
        "objeto": obj or None,
        "fornecedor_cnpj": _cnpj(doc),
        "fornecedor_nome": forn or None,
        "valor_inicial": _num(valor),
        "valor_global": _num(valor),
        "aditivos_total": None,
        "data_assinatura": _data(assin),
        "vigencia_inicio": _data(ini),
        "vigencia_fim": _data(fim),
        "numero_parcelas": None,
        "status": situ or None,
        "alerta": None,
        "motivos_alerta": None,
        "resumo_ia": None,
        "link_fonte": URL,
        "raw": {
            "orgao": orgao,
            "numero": numero,
            "categoria": categoria,
            "doc": doc,
            "fornecedor": forn,
            "objeto": obj,
            "assinatura": assin,
            "inicio": ini,
            "fim": fim,
            "valor": valor,
            "situacao": situ,
        },
        "temas": None,
    }


class _Sessao:
    def __init__(self) -> None:
        self.cj = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self.cj)
        )

    def req(
        self,
        url: str,
        data: bytes | None = None,
        referer: str | None = None,
        tries: int = RETRY,
    ) -> tuple[bytes, dict, int]:
        headers = {
            "User-Agent": UA,
            "Accept": "text/html,application/xhtml+xml,*/*",
            "Accept-Language": "pt-BR,pt;q=0.9",
        }
        if data is not None:
            headers["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8"
            if referer:
                headers["Referer"] = referer
        r = urllib.request.Request(
            url,
            data=data,
            headers=headers,
            method="POST" if data is not None else "GET",
        )
        last = None
        for i in range(tries):
            try:
                with self.opener.open(r, timeout=90) as resp:
                    return resp.read(), dict(resp.headers), resp.status
            except urllib.error.HTTPError as e:
                body = e.read() if hasattr(e, "read") else b""
                last = f"HTTP {e.code} len={len(body)}"
                print(f"{LOG}  try{i} {last}", flush=True)
                if e.code in (429, 500, 502, 503, 504):
                    time.sleep(2.5 + i * 2)
                    continue
                return body, dict(e.headers or {}), e.code
            except Exception as e:
                last = f"{type(e).__name__}: {e}"
                print(f"{LOG}  try{i} {last}", flush=True)
                time.sleep(2.5 + i * 2)
        raise RuntimeError(f"{LOG} falhou após {tries} tentativas: {last}")


def _parse_fields(h: str) -> dict[str, str]:
    fm = re.search(r'(?s)<form[^>]*id="MAINFORM"[^>]*>(.*?)</form>', h)
    body = fm.group(1) if fm else h
    out: dict[str, str] = {}
    for attrs in re.findall(r"<input([^>]+)>", body):
        nm = re.search(r'name="([^"]+)"', attrs)
        if not nm:
            continue
        typ = re.search(r'type="([^"]+)"', attrs)
        if typ and typ.group(1) in ("button", "submit", "image"):
            continue
        val = re.search(r'value="([^"]*)"', attrs) or re.search(r"value='([^']*)'", attrs)
        out[nm.group(1)] = html.unescape(val.group(1)) if val else ""
    for name, b in re.findall(
        r'<select[^>]*name="([^"]+)"[^>]*>(.*?)</select>', body, re.S
    ):
        sel = re.search(r'<option[^>]*selected[^>]*value="([^"]*)"', b)
        if not sel:
            sel = re.search(r'<option[^>]*value="([^"]*)"', b)
        out[name] = html.unescape(sel.group(1)) if sel else ""
    gm = re.search(r'name="GXState"\s+value=\'([^\']*)\'', body)
    if gm:
        out["GXState"] = html.unescape(gm.group(1))
    return out


def _set_event(
    f: dict[str, str], event: str, extra: dict[str, str] | None = None
) -> dict[str, str]:
    out = dict(f)
    out["_EventName"] = event
    out["_EventGridId"] = ""
    out["_EventRowId"] = ""
    out["IsConfirmed"] = "1"
    if extra:
        out.update(extra)
    try:
        st = json.loads(out.get("GXState") or "{}")
    except Exception:
        st = {}
    st["_EventName"] = event
    st["_EventGridId"] = ""
    st["_EventRowId"] = ""
    for k in ("W0006vPAG", "W0006vCONTRATOANOINI", "W0006vPAGECOUNT"):
        if k in out:
            st[k] = out[k]
    out["GXState"] = json.dumps(st, ensure_ascii=False, separators=(",", ":"))
    return out


def _post(sess: _Sessao, fields: dict[str, str]) -> tuple[bytes, dict, int]:
    body = urllib.parse.urlencode(fields).encode("utf-8")
    return sess.req(URL, data=body, referer=URL)


def baixar_csv() -> bytes:
    sess = _Sessao()
    raw, _, _ = sess.req(URL)
    h = raw.decode("utf-8", errors="replace")
    fields = _parse_fields(h)
    if "GXState" not in fields:
        raise RuntimeError(f"{LOG} GET sem GXState (Oracle caiu?)")
    print(f"{LOG} GET ok (ano={fields.get('W0006vCONTRATOANOINI')})", flush=True)

    clear = _set_event(
        fields,
        "W0006EREFRESH.",
        {"W0006vCONTRATOANOINI": "", "W0006vPAG": "1", "W0006BUTTON2": "Consultar"},
    )
    raw_c, _, code = _post(sess, clear)
    hc = raw_c.decode("utf-8", errors="replace")
    fields_c = _parse_fields(hc)
    print(
        f"{LOG} clear ano → HTTP {code}, GXState={'GXState' in fields_c}, "
        f"pag_sel={fields_c.get('W0006vPAG')}",
        flush=True,
    )
    time.sleep(SLEEP)

    base = fields_c if "GXState" in fields_c else fields
    export = _set_event(base, "W0006E'CSV'.", {"W0006BUTTON6": "CSV"})
    raw_csv, hdrs, code = _post(sess, export)
    disp = hdrs.get("Content-Disposition") or hdrs.get("content-disposition") or ""
    ctype = hdrs.get("Content-Type") or hdrs.get("content-type") or ""
    print(
        f"{LOG} CSV HTTP {code} ctype={ctype!r} disp={disp!r} len={len(raw_csv)}",
        flush=True,
    )
    if code != 200 or not disp.lower().startswith("attachment"):
        head = raw_csv[:120].decode("latin-1", errors="replace")
        raise RuntimeError(
            f"{LOG} não veio attachment (code={code}, disp={disp!r}, head={head!r})"
        )
    return raw_csv


def parse_csv(raw: bytes) -> tuple[list[str], list[list[str]]]:
    # medido: Windows-1252, separador `;`, BOM opcional
    text = None
    for enc in ("utf-8-sig", "cp1252", "latin-1"):
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    if text is None:
        text = raw.decode("latin-1", errors="replace")
    # some GeneXus dumps start with a blank line
    sample = text.lstrip("﻿\r\n")
    reader = csv.reader(io.StringIO(sample), delimiter=";")
    rows = [r for r in reader if any((c or "").strip() for c in r)]
    if not rows:
        return [], []
    header = [(c or "").strip().lower() for c in rows[0]]
    return header, rows[1:]


def sync(
    id_municipio: str = ID_MUNICIPIO_DEFAULT,
    *,
    dry_run: bool = False,
    csv_path: str | None = None,
) -> list[dict]:
    if csv_path:
        from pathlib import Path

        raw = Path(csv_path).read_bytes()
        print(f"{LOG} CSV local {csv_path} ({len(raw)} bytes)", flush=True)
    else:
        raw = baixar_csv()
    header, body = parse_csv(raw)
    print(f"{LOG} csv header={header}", flush=True)
    if header and EXPECTED_HEADER not in header[0]:
        # ainda assim segue se tiver coluna de contrato
        if not any("contrato" in h for h in header):
            raise RuntimeError(f"{LOG} header inesperado: {header}")

    linhas: list[dict] = []
    vistos: set[str] = set()
    for i, cells in enumerate(body):
        row = _map_row(cells, id_municipio, i)
        if not row or row["chave_fonte"] in vistos:
            continue
        vistos.add(row["chave_fonte"])
        linhas.append(row)
    print(
        f"{LOG} {id_municipio}: {len(linhas)} contrato(s) únicos "
        f"(fonte={FONTE}, linhas_csv={len(body)})",
        flush=True,
    )
    if dry_run:
        if linhas:
            ex = linhas[0]
            anos = sorted({r["ano"] for r in linhas if r["ano"]})
            print(
                f"{LOG}   exemplo: {ex['numero_contrato']} forn={ex['fornecedor_nome']} "
                f"val={ex['valor_global']} vig={ex['vigencia_inicio']}..{ex['vigencia_fim']}",
                flush=True,
            )
            print(
                f"{LOG}   anos {anos[0] if anos else '?'}..{anos[-1] if anos else '?'} "
                f"com_cnpj={sum(1 for r in linhas if r['fornecedor_cnpj'])}",
                flush=True,
            )
        return linhas
    if not linhas:
        print(f"{LOG} nada parseado — não escrevo.", flush=True)
        return linhas
    client = get_supabase_client()
    upsert_com_colunas_opcionais(
        client,
        "contratos",
        linhas,
        [],
        on_conflict="id_municipio,fonte,chave_fonte",
    )
    print(f"{LOG} {id_municipio}: {len(linhas)} gravado(s) (fonte={FONTE}).", flush=True)
    return linhas


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument(
        "--csv",
        default=None,
        help="CSV já baixado (evita o Oracle do GeneXus quando cai)",
    )
    args = ap.parse_args()
    sync(args.id_municipio, dry_run=args.dry_run, csv_path=args.csv)
