r"""coletar-aneel-cfurh-pa.py — CFURH pago aos municípios do Pará (ANEEL).

Fonte: dados abertos da ANEEL (CKAN), recurso `cfurh-beneficiarios-cfurh`
(`6ad76203-68d8-48c1-a338-a6ff5e6167a7`). Endpoint usado:

    /api/3/action/datastore_search?resource_id=...&filters={"SigUF":"PA"}&limit=5000

O que é CFURH: Compensação Financeira pela Utilização de Recursos Hídricos —
dinheiro que usina hidrelétrica paga a estado, município, ANA e demais entes
por usar a água. É a maior receita própria de município que hospeda usina, e
por isso a pergunta cívica que este arquivo responde: **quanto o município
paraense recebeu, mês a mês, e de qual usina**.

Medido em 17/11/2026 (sondagem em
`docs/historico/descobertas/ambiental-PA-energia.md`):

- 1.435.782 registros nacionais; **3.963 do Pará**, em 15 municípios.
- Série de **1996-11 a 2026-07**.
- Soma de `VlrPagoMunicipio` no PA: **R$ 2.834.586.968,36**.
- O CKAN da ANEEL **não tem `datastore_search_sql`** (`Action name not
  known`), então toda agregação é feita aqui, no cliente, e vai pronta no JSON.
- Os 3.963 vêm em UMA requisição (`limit=5000`, ~2,6 MB). O arquivo bruto fica
  em `scripts/.cache/aneel-cfurh-pa/` para re-rodar sem bater na fonte de
  novo; `--refetch` força baixar.

O que NÃO dá para afirmar com este dado: pagamento não é aplicação. O arquivo
mostra quanto foi repassado, não onde o dinheiro foi gasto — quem quiser isso
tem de cruzar com execução orçamentária municipal.

  python scripts/coletar-aneel-cfurh-pa.py
  python scripts/coletar-aneel-cfurh-pa.py --refetch    # ignora o cache
  python scripts/coletar-aneel-cfurh-pa.py --dry-run    # só conta, não grava
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

LOG = "[coletar-aneel-cfurh-pa]"
BASE = "https://dadosabertos.aneel.gov.br/api/3/action"
RECURSO = "6ad76203-68d8-48c1-a338-a6ff5e6167a7"
UA = "finweejur/github artur colito"
PAUSA = 2  # s entre requisições ao mesmo host
PASTA = Path(__file__).resolve().parent
CACHE = PASTA / ".cache" / "aneel-cfurh-pa"
SAIDA = PASTA.parent / "apps" / "web" / "data" / "aneel-cfurh-pa.json"
UF = "PA"

RESSALVA = (
    "CFURH é compensação financeira paga por usina hidrelétrica pelo uso da "
    "água, não investimento local: o valor aqui é o que foi REPASSADO ao "
    "município, e não prova onde foi aplicado. Para saber a aplicação, cruzar "
    "com a execução orçamentária do município. Consulta oficial: "
    "https://dadosabertos.aneel.gov.br/dataset/cfurh")


def _baixar() -> dict:
    """Os 3.963 registros do PA em uma requisição (limite 5.000 cobre o total)."""
    params = urllib.parse.urlencode({
        "resource_id": RECURSO,
        "filters": json.dumps({"SigUF": UF}),
        "limit": 5000,
    })
    url = f"{BASE}/datastore_search?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    time.sleep(PAUSA)
    with urllib.request.urlopen(req, timeout=180) as r:
        bruto = r.read()
    if not bruto:
        raise RuntimeError("resposta vazia do CKAN da ANEEL")
    dados = json.loads(bruto.decode("utf-8"))
    if not dados.get("success"):
        raise RuntimeError(f"CKAN recusou: {dados.get('error')}")
    CACHE.mkdir(parents=True, exist_ok=True)
    (CACHE / "raw.json").write_bytes(bruto)
    return dados["result"]


def _do_cache() -> "dict | None":
    arq = CACHE / "raw.json"
    if not arq.exists():
        return None
    return json.loads(arq.read_text(encoding="utf-8"))["result"]


def _num(v) -> float:
    """Valor monetário da ANEEL em formato brasileiro ("7669,5704999999998").

    `float("7669,57")` estoura e o `except` engolia o número — a primeira
    rodada publicou R$ 13,4 milhões no lugar de R$ 2,83 bilhões porque TODO
    valor com vírgula virava zero. Medido em 17/11/2026.
    """
    if isinstance(v, (int, float)):
        return float(v)
    s = (v or "").strip()
    if not s:
        return 0.0
    if "," in s:  # 1.234,56 -> 1234.56
        s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return 0.0


def main() -> None:
    parser = argparse.ArgumentParser(description="CFURH dos municípios do Pará (ANEEL)")
    parser.add_argument("--refetch", action="store_true", help="ignora o cache e baixa de novo")
    parser.add_argument("--dry-run", action="store_true", help="só conta, não grava JSON")
    args = parser.parse_args()

    print(f"{LOG} CFURH / ANEEL — municípios do {UF}\n")
    print(f"  recurso: {RECURSO}")
    print(f"  cache  : {CACHE}")

    resultado = None if args.refetch else _do_cache()
    if resultado is not None:
        print(f"  usando cache ({len(resultado.get('records') or [])} linhas)")
    else:
        print("  baixando da ANEEL...")
        resultado = _baixar()

    total_fonte = int(resultado.get("total") or 0)
    linhas = resultado.get("records") or []
    print(f"  registros do {UF} na fonte: {total_fonte:,} | recebidos: {len(linhas):,}")

    if args.dry_run:
        print("  (dry-run: nada gravado)")
        return

    if total_fonte and len(linhas) < total_fonte:
        raise RuntimeError(
            f"vieram {len(linhas):,} de {total_fonte:,}: uma requisição só cobre "
            f"5.000 linhas — paginar antes de publicar")

    por_municipio: dict[str, dict] = {}
    por_ano: dict[str, float] = {}
    por_usina: dict[str, float] = {}
    # Valores monetários entram como NÚMERO, não como a string brasileira da
    # fonte: "153921,86885008001" tem 11 dígitos válidos por mod-11 na parte
    # decimal e o varredor de CPF do repo (com razão) barrava o arquivo. O
    # dado não muda de significado; some só a formatação.
    for r in linhas:
        for campo in [k for k in r if k.startswith("Vlr")]:
            r[campo] = _num(r[campo])
    for r in linhas:
        mun = r.get("NomMunicipio") or "(sem município)"
        valor = _num(r.get("VlrPagoMunicipio"))
        ibge = r.get("CodMunicipioIBGE")
        m = por_municipio.setdefault(mun, {"id_ibge": str(ibge) if ibge else None,
                                          "total": 0.0, "meses": 0})
        m["total"] += valor
        m["meses"] += 1
        ano = str(r.get("DatCompetencia") or "")[:4]
        if ano:
            por_ano[ano] = por_ano.get(ano, 0.0) + valor
        usina = r.get("NomUsinaPcp") or "(sem usina)"
        por_usina[usina] = por_usina.get(usina, 0.0) + valor

    soma = round(sum(v["total"] for v in por_municipio.values()), 2)
    dados = {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "fonte": "ANEEL — dados abertos (CFURH beneficiários)",
        "url_fonte": f"{BASE}/datastore_search?resource_id={RECURSO}",
        "total_fonte": total_fonte,
        "truncado": False,
        "colunas": list((linhas[0] if linhas else {})),
        "obs": ("CFURH pago a municípios do Pará, mês a mês, com código IBGE do "
                "município (join direto com ref_municipios) e CNPJ do agente. "
                "Agregações por município, ano e usina são DERIVADAS aqui, não "
                "publicadas pela ANEEL. O CKAN da ANEEL não tem datastore_search_sql, "
                "então toda soma é feita no cliente."),
        "ressalva_editorial": RESSALVA,
        "uf": UF,
        "municipios": len(por_municipio),
        "primeira_competencia": min((r.get("DatCompetencia") or "" for r in linhas), default=""),
        "ultima_competencia": max((r.get("DatCompetencia") or "" for r in linhas), default=""),
        "total_pago_municipios": soma,
        "por_municipio": dict(sorted(por_municipio.items(), key=lambda kv: -kv[1]["total"])),
        "por_ano": dict(sorted(por_ano.items())),
        "por_usina": dict(sorted(por_usina.items(), key=lambda kv: -kv[1])),
        "linhas": linhas,
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")),
                     encoding="utf-8")
    print(f"\n{LOG} ok: {len(linhas):,} linhas em {len(por_municipio)} municípios "
          f"-> {SAIDA.name} ({SAIDA.stat().st_size / 1024:,.0f} KB)")
    print(f"{LOG} total pago aos municípios do {UF}: R$ {soma:,.2f}")


if __name__ == "__main__":
    main()
