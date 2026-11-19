"""coletar-anm-cfem.py — CFEM distribuída, por município e por ano, no Brasil.

BAIXA o CSV nacional de distribuição da CFEM (Compensação Financeira pela
Exploração de Recursos Minerais) e AGREGA em memória por município/ano:

- Fonte : Agência Nacional de Mineração (ANM), dados abertos.
- URL   : https://dadosabertos.anm.gov.br/CFEM/CFEM_Distribuicao.csv
- Medido: 18/11/2026 — 317.276.257 bytes, 2.239.128 linhas (medição de
  17/11/2026 em docs/historico/descobertas/ambiental-PA-minerario.md).
- Saída : apps/web/data/anm-cfem.json (agregado, não as 2,2 mi de linhas).

POR QUE ASSIM: o CSV tem 317 MB — não cabe em memória com conforto e não é
preciso. Baixa em streaming para scripts/.cache/anm-cfem/, lê linha a linha
com o `csv` da stdlib e guarda só somas por ente/ano. Ler por código IBGE
(`CodigoEnte`), nunca por nome: o arquivo é cp1252 e nome com acento casa
zero linha. Valor usa vírgula decimal ("286,507") e entra como inteiro de
micro-reais para não acumular erro de float em 2,2 milhões de somas.

O coletor antigo de CFEM por WebForms (`etl/betim/etl/apis/anm_cfem.py`) está
quebrado (aspx respondendo 500) e NÃO é tocado por este script: o CSV aberto
entrega a mesma resposta.

## Coleta ética (consultado em 18/11/2026)

- User-Agent: `finweejur/github artur colito`.
- robots.txt de dadosabertos.anm.gov.br responde 404 — sem Disallow.
- Pausa de `PAUSA` segundos entre requisições ao mesmo host.
- Corpo validado: Content-Length conferido contra o arquivo gravado.
- Checkpoint: CSV no cache com tamanho batendo no Content-Length (ou ETag
  igual ao registrado) não é baixado de novo; `--refetch` força.
- Sem dado pessoal: a CFEM de distribuição é por ente público (município,
  estado, União). Não há CPF nem nome de pessoa física neste arquivo nem no
  JSON gravado.

Rodar:
    python scripts/coletar-anm-cfem.py --dry-run    # HEAD + estado do cache
    python scripts/coletar-anm-cfem.py              # baixa (se preciso) e agrega
    python scripts/coletar-anm-cfem.py --refetch    # força novo download
    python scripts/coletar-anm-cfem.py --refetch --scan-cpf
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # console Windows é cp1252

UA = "finweejur/github artur colito"
URL = "https://dadosabertos.anm.gov.br/CFEM/CFEM_Distribuicao.csv"
RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "apps" / "web" / "data" / "anm-cfem.json"
CACHE = Path(__file__).resolve().parent / ".cache" / "anm-cfem"
CSV_LOCAL = CACHE / "CFEM_Distribuicao.csv"
META = CACHE / "meta.json"
PAUSA = 2
PREFIXO = "[coletar-anm-cfem]"

# Índices das colunas do CSV (cabeçalho: NúmeroDeDistribuição;Ano;Mês;Ente;
# SiglaEstado;CodigoEnte;NomeEnte;TipoDistribuição;Substância;TipoAfetamento;
# Valor;DataCriacao) — separador vírgula com aspas.
I_ANO, I_ENTE, I_UF, I_COD, I_NOME, I_VALOR = 1, 3, 4, 5, 6, 10

COLUNAS = ["NúmeroDeDistribuição", "Ano", "Mês", "Ente", "SiglaEstado",
           "CodigoEnte", "NomeEnte", "TipoDistribuição", "Substância",
           "TipoAfetamento", "Valor", "DataCriacao"]

OBS = (
    "Dado DERIVADO: o CSV da ANM tem uma linha por distribuição/mês; este JSON "
    "soma por ente e por ano. `total_brasil` cobre municípios, estados e União "
    "somados — a soma de `municipios` é menor, porque estado e União também "
    "recebem. Série começa em 2007; o ano corrente é parcial. O recorte de "
    "2026 vai até a data de atualização do arquivo na ANM."
)
RESSALVA = (
    "Repasse não é aplicação: o valor diz quanto o ente recebeu da CFEM, não "
    "como gastou. Valores nominais, sem correção monetária — somar anos "
    "distintos superestima o poder de compra do passado. A distribuição também "
    "não é a arrecadação: são regras de rateio distintas, com defasagem."
)


def log(msg: str) -> None:
    print(f"{PREFIXO} {msg}", flush=True)


def parse_valor_br(texto: str) -> float | None:
    """'1.234,56' -> 1234.56 (vírgula decimal, ponto de milhar)."""
    t = (texto or "").strip().replace(" ", "").replace("\xa0", "")
    if not t or t == "-":
        return None
    if "," in t:
        t = t.replace(".", "").replace(",", ".")
    else:
        # sem vírgula: ponto só é milhar quando separa grupos de 3 dígitos
        partes = t.split(".")
        if len(partes) > 1 and all(len(p) == 3 for p in partes[1:]) and partes[0].isdigit():
            t = "".join(partes)
    try:
        return float(t)
    except ValueError:
        return None


def _micro(texto: str) -> int:
    """Valor em inteiro de micro-reais (6 casas, o que o arquivo traz)."""
    v = parse_valor_br(texto)
    return 0 if v is None else int(round(v * 1_000_000))


def agregar(linhas, progresso: int = 0) -> dict:
    """Soma linhas do CSV (listas de campos) por ente e por ano.

    Devolve inteiros de micro-reais; a formatação em reais fica na saída.
    """
    total_linhas = 0
    total_micro = 0
    municipios: dict[str, dict] = {}
    por_uf: dict[str, dict] = {}
    por_ano: dict[int, list] = {}   # [micro, linhas]
    por_ente: dict[str, list] = {}  # [micro, linhas]
    sem_codigo = 0

    for row in linhas:
        if len(row) <= I_VALOR:
            continue
        try:
            ano = int(row[I_ANO])
        except (ValueError, TypeError):
            continue
        cod = row[I_COD].strip()
        if len(cod) != 7:          # só município tem código IBGE de 7 dígitos
            sem_codigo += 1
        micro = _micro(row[I_VALOR])
        ente = row[I_ENTE].strip() or "?"
        uf = row[I_UF].strip() or "BR"

        total_linhas += 1
        total_micro += micro

        a = por_ano.setdefault(ano, [0, 0])
        a[0] += micro
        a[1] += 1
        e = por_ente.setdefault(ente, [0, 0])
        e[0] += micro
        e[1] += 1
        u = por_uf.setdefault(uf, {"micro": 0, "linhas": 0, "_mun": set()})
        u["micro"] += micro
        u["linhas"] += 1
        if len(cod) == 7:
            u["_mun"].add(cod)
            m = municipios.setdefault(cod, {"nome": row[I_NOME].strip(), "uf": uf,
                                            "micro": 0, "por_ano": {}})
            m["micro"] += micro
            m["por_ano"][ano] = m["por_ano"].get(ano, 0) + micro

        if progresso and total_linhas % progresso == 0:
            log(f"  {total_linhas:,} linhas lidas...")

    return {"linhas": total_linhas, "total_micro": total_micro,
            "municipios": municipios, "por_uf": por_uf,
            "por_ano": por_ano, "por_ente": por_ente,
            "linhas_sem_codigo_municipal": sem_codigo}


def _head() -> tuple[int, str, str]:
    """HEAD na fonte: (bytes, etag, last-modified)."""
    req = urllib.request.Request(URL, headers={"User-Agent": UA}, method="HEAD")
    with urllib.request.urlopen(req, timeout=120) as r:
        return (int(r.headers.get("Content-Length") or 0),
                (r.headers.get("ETag") or "").strip('"'),
                r.headers.get("Last-Modified") or "")


def _baixar(tamanho_remoto: int, etag: str, last_modified: str) -> Path:
    """Download em streaming (1 MB por vez), validando o corpo pelo tamanho."""
    CACHE.mkdir(parents=True, exist_ok=True)
    tmp = CSV_LOCAL.with_suffix(".parcial")
    req = urllib.request.Request(URL, headers={"User-Agent": UA})
    log(f"baixando {tamanho_remoto:,} bytes em streaming...")
    total = 0
    with urllib.request.urlopen(req, timeout=600) as r, open(tmp, "wb") as f:
        while True:
            bloco = r.read(1 << 20)
            if not bloco:
                break
            f.write(bloco)
            total += len(bloco)
    if total == 0:
        tmp.unlink(missing_ok=True)
        raise SystemExit(f"{PREFIXO} corpo vazio — 200 sem bytes não é sucesso")
    if tamanho_remoto and total != tamanho_remoto:
        tmp.unlink(missing_ok=True)
        raise SystemExit(f"{PREFIXO} corpo truncado: {total:,} de {tamanho_remoto:,} bytes")
    os.replace(tmp, CSV_LOCAL)  # Windows: replace falha antes de apagar o alvo
    META.write_text(json.dumps({"bytes": total, "etag": etag,
                                "last_modified": last_modified,
                                "baixado_em": datetime.now(timezone.utc).isoformat()},
                               ensure_ascii=False), encoding="utf-8")
    log(f"gravado {CSV_LOCAL.name} ({total:,} bytes)")
    return CSV_LOCAL


def garantir_csv(refetch: bool) -> tuple[Path, dict]:
    """Checkpoint: reusa o cache se o tamanho (ou o ETag) bate com a origem."""
    try:
        remoto, etag, lm = _head()
    except urllib.error.HTTPError as e:
        raise SystemExit(f"{PREFIXO} HEAD falhou: HTTP {e.code}")
    info = {"bytes_origem": remoto, "etag": etag, "last_modified": lm}
    meta = {}
    if META.exists():
        try:
            meta = json.loads(META.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            meta = {}

    if CSV_LOCAL.exists() and not refetch:
        local = CSV_LOCAL.stat().st_size
        igual_tamanho = bool(remoto) and local == remoto
        igual_etag = bool(etag) and etag == meta.get("etag")
        if igual_tamanho or igual_etag:
            log(f"cache reaproveitado: {local:,} bytes"
                f"{' (tamanho)' if igual_tamanho else ''}"
                f"{' (ETag)' if igual_etag else ''}")
            info["cache"] = "reaproveitado"
            return CSV_LOCAL, info
        log(f"cache defasado ({local:,} local vs {remoto:,} na origem) — baixando")
    else:
        time.sleep(PAUSA)

    info["cache"] = "baixado"
    return _baixar(remoto, etag, lm), info


def _reais(micro: int) -> float:
    return round(micro / 1_000_000, 2)


def montar_json(agg: dict, info: dict) -> dict:
    municipios = [
        {"codigo_ibge": cod, "municipio": m["nome"], "uf": m["uf"],
         "total": _reais(m["micro"]),
         "por_ano": {str(a): _reais(v) for a, v in sorted(m["por_ano"].items())}}
        for cod, m in sorted(agg["municipios"].items(), key=lambda kv: -kv[1]["micro"])
    ]
    por_uf = {}
    for uf, u in sorted(agg["por_uf"].items()):
        por_uf[uf] = {"total": _reais(u["micro"]), "linhas": u["linhas"],
                      "municipios": len(u["_mun"])}
    por_ano = {str(a): {"total": _reais(v[0]), "linhas": v[1]}
               for a, v in sorted(agg["por_ano"].items())}
    por_ente = {e: {"total": _reais(v[0]), "linhas": v[1]}
                for e, v in sorted(agg["por_ente"].items(), key=lambda kv: -kv[1][0])}

    soma_uf = round(sum(v["total"] for v in por_uf.values()), 2)
    soma_ano = round(sum(v["total"] for v in por_ano.values()), 2)
    total = _reais(agg["total_micro"])
    # os baldes só são exatos em micro-reais; em reais cada parte arredonda
    exato_uf = sum(u["micro"] for u in agg["por_uf"].values())
    exato_ano = sum(v[0] for v in agg["por_ano"].values())

    return {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "fonte": "ANM — Agência Nacional de Mineração (dados abertos), "
                 "CFEM Distribuição por ente",
        "url_fonte": URL,
        "arquivo_fonte": {"bytes": info.get("bytes_origem"),
                          "etag": info.get("etag"),
                          "last_modified": info.get("last_modified"),
                          "cache": info.get("cache")},
        "total_linhas_fonte": agg["linhas"],
        "total_brasil": total,
        "municipios_com_repasse": len(municipios),
        "colunas": COLUNAS,
        "obs": OBS,
        "ressalva_editorial": RESSALVA,
        "truncado": False,
        "conferencia": {"soma_resumo_por_uf": soma_uf,
                        "soma_resumo_por_ano": soma_ano,
                        "fecha_com_total": (exato_uf == agg["total_micro"]
                                            and exato_ano == agg["total_micro"]),
                        "diferenca_arredondamento_centavos": round((soma_uf - total) * 100),
                        "linhas_sem_codigo_municipal": agg["linhas_sem_codigo_municipal"]},
        "resumo_por_ente": por_ente,
        "resumo_por_uf": por_uf,
        "resumo_por_ano": por_ano,
        "municipios": municipios,
    }


def main() -> None:
    ap = argparse.ArgumentParser(description="CFEM distribuída por município (ANM, stdlib)")
    ap.add_argument("--dry-run", action="store_true", help="HEAD e estado do cache, sem baixar/agregar")
    ap.add_argument("--refetch", action="store_true", help="baixa o CSV de novo mesmo com cache válido")
    ap.add_argument("--scan-cpf", action="store_true", help="roda o varredor de CPF sobre a saída")
    args = ap.parse_args()

    log("=== CFEM — distribuição por município (ANM) ===")
    log(f"fonte : {URL}")
    log("robots: robots.txt responde 404 (sem Disallow declarado)")
    log(f"saida : {SAIDA}")

    if args.dry_run:
        remoto, etag, lm = _head()
        local = CSV_LOCAL.stat().st_size if CSV_LOCAL.exists() else 0
        log(f"origem: {remoto:,} bytes; ETag {etag or '-'}; último {lm or '-'}")
        log(f"cache : {local:,} bytes" + (" (bate, não baixaria)" if local == remoto
                                          else " (ausente/defasado, baixaria)"))
        log("dry-run: nada foi baixado nem gravado")
        return

    caminho, info = garantir_csv(args.refetch)

    import csv
    log(f"lendo {caminho.name} linha a linha (cp1252, vírgula decimal)...")
    t0 = time.time()
    with open(caminho, "r", encoding="latin-1", newline="") as f:
        leitor = csv.reader(f, delimiter=",")
        cabecalho = next(leitor, None)
        if not cabecalho or "CodigoEnte" not in cabecalho:
            raise SystemExit(f"{PREFIXO} cabeçalho inesperado: {cabecalho!r}")
        agg = agregar(leitor, progresso=500_000)
    log(f"{agg['linhas']:,} linhas lidas em {time.time() - t0:.0f}s")

    dados = montar_json(agg, info)
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")),
                     encoding="utf-8")

    pa = dados["resumo_por_uf"].get("PA", {}).get("total")
    log(f"municípios com repasse: {dados['municipios_com_repasse']:,}")
    log(f"total Brasil: R$ {dados['total_brasil']:,.2f}")
    log(f"total PA    : R$ {pa:,.2f}" if pa else "total PA    : ausente")
    log(f"por ente    : " + "; ".join(
        f"{e} R$ {v['total'] / 1e9:.2f} bi" for e, v in dados["resumo_por_ente"].items()))
    log(f"conferência : soma por UF {'fecha' if dados['conferencia']['fecha_com_total'] else 'NÃO FECHA'}"
        f" com o total ({dados['conferencia']['soma_resumo_por_uf']:,.2f})")
    log(f"[ok] {SAIDA.name} ({SAIDA.stat().st_size / 1e6:.1f} MB)")

    if args.scan_cpf:
        log("rodando o varredor de CPF sobre a saída...")
        r = subprocess.run([sys.executable, "scripts/checar-dado-pessoal-em-dado.py",
                            "--extra", str(SAIDA)], cwd=RAIZ)
        if r.returncode != 0:
            raise SystemExit(f"{PREFIXO} CPF encontrado na saída — não publicar")
        log("scan clean")


if __name__ == "__main__":
    main()
