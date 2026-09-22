"""Carga de licitações do portal de dados abertos de Betim para `licitacoes`.

Fontes (mesmo JSON `{"dados": [...]}` por ano, sem paginação medida 22/09):
  - https://www.betim.mg.gov.br/portal/dados-abertos/licitacoes/<ano>
  - https://www.betim.mg.gov.br/portal/dados-abertos/chamamento-publico/<ano>
    (9 linhas que NÃO entram pelo endpoint de licitações — medido por
    set-difference processo|edital|titulo)

2019–2026 em licitações (~2.7k) + chamamentos. Motivo: API PNCP fora e o
Compras.gov.br não publica Betim; o portal municipal tem.

`contratos/<ano>` do mesmo portal só tem um registro de teste em 2021
("teste teste") — NÃO carrega contrato daqui.

Uso:
    python -m etl.apis.betim_dados_abertos --dry-run
    python -m etl.apis.betim_dados_abertos
    python -m etl.apis.betim_dados_abertos --ano-inicio 2019 --ano-fim 2026
"""
from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import re
import time
import urllib.error
import urllib.request

from etl.common import ID_MUNICIPIO_DEFAULT, get_supabase_client, upsert_com_colunas_opcionais

LOG = "[etl.apis.betim_dados_abertos]"
FONTE = "betim_dados_abertos"
BASES = (
    "https://www.betim.mg.gov.br/portal/dados-abertos/licitacoes",
    "https://www.betim.mg.gov.br/portal/dados-abertos/chamamento-publico",
)
UA = "controlepopular-coleta/1.0 (coleta publica)"
ANO_INICIO = 2019
ANO_FIM = dt.date.today().year
SLEEP = 1.0

_TAG = re.compile(r"<[^>]+>")


def _limpar_html(s: str | None) -> str | None:
    if s is None:
        return None
    t = html.unescape(str(s))
    t = _TAG.sub(" ", t)
    t = " ".join(t.split())
    return t or None


def _data(s: str | None) -> str | None:
    if not s:
        return None
    s = s.strip()
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%d/%m/%Y %H:%M:%S", "%d/%m/%Y"):
        try:
            return dt.datetime.strptime(s[:19] if len(s) >= 19 else s, fmt).isoformat()
        except ValueError:
            continue
    return None


def _num(v) -> float | None:
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip().replace("R$", "").strip()
    if not s:
        return None
    # Medido 22/09/2026: o portal manda JSON number (ponto decimal) ou vazio.
    # Se um dia vier "1.234,56" (BR), normaliza; nunca remover ponto cego.
    if "," in s and "." in s:
        s = s.replace(".", "").replace(",", ".")
    elif "," in s:
        s = s.replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def _chave(r: dict, ano: int) -> str:
    # O ano da URL NÃO entra: o mesmo chamamento aparece nas pastas 2025 e
    # 2026 (medido). Casar por processo|edital|data|titulo; ano da URL só
    # amarra quando a fonte não tem data.
    ed = r.get("numeroEdital")
    proc = r.get("numeroProcesso")
    realiz = (r.get("dataRealizacao") or "")[:10]
    post = (r.get("dataPostagem") or "")[:10]
    titulo = (r.get("titulo") or "").strip()[:80]
    if not realiz and not post:
        return f"{ano}:{proc}:{ed}:{titulo}"
    return f"{proc}:{ed}:{realiz or post}:{titulo}"


def _map_row(raw: dict, ano: int, id_municipio: str, base_ano: str) -> dict:
    titulo = _limpar_html(raw.get("titulo"))
    desc = _limpar_html(raw.get("descricao"))
    processo = raw.get("numeroProcesso")
    return {
        "id_municipio": id_municipio,
        "fonte": FONTE,
        "chave_fonte": _chave(raw, ano),
        "numero_controle_pncp": None,
        "orgao_cnpj": None,
        "orgao_nome": "Prefeitura Municipal de Betim",
        "unidade_nome": None,
        "modalidade_id": None,
        "modalidade_nome": _limpar_html(raw.get("modalidade")),
        "objeto": desc or titulo,
        "processo": str(processo) if processo not in (None, "") else None,
        "srp": bool(titulo and "REGISTRO DE PRE" in titulo.upper())
        or bool(desc and "REGISTRO DE PRE" in desc.upper()),
        "valor_estimado": _num(raw.get("valorEstimado")),
        "valor_homologado": _num(raw.get("valorHomologado")),
        "situacao": _limpar_html(raw.get("situacao")),
        "data_publicacao_pncp": _data(raw.get("dataPostagem")),
        "data_abertura": _data(raw.get("dataRealizacao")),
        "data_encerramento": None,
        "link_sistema_origem": base_ano,
        "raw": raw,
    }


def _fetch(base: str, ano: int) -> list[dict]:
    req = urllib.request.Request(
        f"{base}/{ano}",
        headers={"User-Agent": UA, "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            corpo = resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        print(f"{LOG} {base.rsplit('/', 1)[-1]} {ano} HTTP {e.code} — pula.")
        return []
    except Exception as e:
        print(f"{LOG} {base.rsplit('/', 1)[-1]} {ano} erro {type(e).__name__}: {e} — pula.")
        return []
    try:
        j = json.loads(corpo)
    except json.JSONDecodeError:
        print(f"{LOG} {base.rsplit('/', 1)[-1]} {ano} JSON inválido — pula.")
        return []
    dados = j.get("dados") or []
    # Vazio chega como {"dados":[["Nenhum registro encontrado."]]} (lista de
    # lista) ou []. Só dict real vira linha.
    if not dados or not isinstance(dados[0], dict):
        return []
    return [d for d in dados if isinstance(d, dict)]


def sync(
    id_municipio: str = ID_MUNICIPIO_DEFAULT,
    ano_inicio: int = ANO_INICIO,
    ano_fim: int = ANO_FIM,
    *,
    dry_run: bool = False,
) -> list[dict]:
    linhas: list[dict] = []
    por_ano: dict[str, int] = {}
    vistos: set[str] = set()
    for base in BASES:
        rotulo = base.rsplit("/", 1)[-1]
        for ano in range(ano_inicio, ano_fim + 1):
            raws = _fetch(base, ano)
            n_ano = 0
            base_ano = f"{base}/{ano}"
            for raw in raws:
                row = _map_row(raw, ano, id_municipio, base_ano)
                if row["chave_fonte"] in vistos:
                    continue
                vistos.add(row["chave_fonte"])
                linhas.append(row)
                n_ano += 1
            por_ano[f"{rotulo}:{ano}"] = n_ano
            time.sleep(SLEEP)
    print(
        f"{LOG} {id_municipio}: {len(linhas)} licitação(ões) "
        f"{ano_inicio}-{ano_fim} por ano: {dict(sorted(por_ano.items()))}"
    )
    if dry_run:
        if linhas:
            ex = linhas[0]
            print(
                f"{LOG}   exemplo: chave={ex['chave_fonte'][:70]} "
                f"mod={ex['modalidade_nome']} pub={ex['data_publicacao_pncp']} "
                f"obj={(ex['objeto'] or '')[:60]}"
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
    parser.add_argument("--ano-inicio", type=int, default=ANO_INICIO)
    parser.add_argument("--ano-fim", type=int, default=ANO_FIM)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    sync(
        args.id_municipio,
        args.ano_inicio,
        args.ano_fim,
        dry_run=args.dry_run,
    )
