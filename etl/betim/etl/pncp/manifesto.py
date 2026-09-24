"""Manifesto da fila PNCP — as cidades da expansão, congeladas em CSV.

    python -m etl.pncp.manifesto
    python -m etl.pncp.manifesto --saida etl/betim/dados/manifesto-pncp.csv

POR QUE EXISTE. O catálogo `apps/web/data/cidades-estrategicas.json` tem 203
linhas (27 capitais + 176 polos); o rótulo público do portal é "199". As 6
principais (Betim, BH, SP, Diamantina, Araçuaí, Itinga) já têm Fase A — não
entram na expansão. CNPJ nulo não é "pule em silêncio": vira linha
`bloqueada-cnpj` para o operador ver o tamanho do buraco.

O manifesto é a ÚNICA entrada da `fila` e do CSV de cobertura. Um snapshot
versionado (C1 do plano) congela a contagem na data da fala — ninguém diz
"199 baixadas" sem recontar.
"""
from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from typing import Any, Iterable

# etl/betim/etl/pncp/manifesto.py -> pncp -> etl -> betim -> etl -> <raiz>
_RAIZ = Path(__file__).resolve().parents[4]
CATALOGO = _RAIZ / "apps" / "web" / "data" / "cidades-estrategicas.json"
SAIDA_PADRAO = _RAIZ / "etl" / "betim" / "dados" / "manifesto-pncp.csv"

# As 6 do PRODUTO / Fase A — e DOIS conjuntos de código por causa de
# divergência medida em 24/09: o catálogo (`cidades-estrategicas.json`)
# traz Araçuaí=3103105, Diamantina=3122003, Itinga=3131002; o banco
# `municipios` (e o IBGE oficial) usa 3103405 / 3121605 / 3134004, que
# são os ids sob os quais a Fase A coletou. Excluir só um dos lados
# deixava a principal virar `bloqueada-cnpj` e entrar na expansão.
PRINCIPAIS = frozenset(
    {
        "3106705",  # Betim
        "3106200",  # Belo Horizonte
        "3550308",  # São Paulo
        "3103105",  # Araçuaí (id do catálogo)
        "3103405",  # Araçuaí (id do banco / IBGE)
        "3122003",  # Diamantina (id do catálogo)
        "3121605",  # Diamantina (id do banco / IBGE)
        "3131002",  # Itinga (id do catálogo)
        "3134004",  # Itinga (id do banco / IBGE)
    }
)

# Fila B da outra IA (handoff 23/09): SP já está em PRINCIPAIS; as 25
# capitais restantes ficam marcadas `delegada` para esta sessão não coletar.
CAPITAIS_DELEGADAS = frozenset(
    {
        "2800308",  # Aracaju
        "1501402",  # Belém
        "1400100",  # Boa Vista
        "5300108",  # Brasília
        "5002704",  # Campo Grande
        "5103403",  # Cuiabá
        "4106902",  # Curitiba
        "4205407",  # Florianópolis
        "2304400",  # Fortaleza
        "5208707",  # Goiânia
        "2507507",  # João Pessoa
        "1600303",  # Macapá
        "2704302",  # Maceió
        "1302603",  # Manaus
        "2408102",  # Natal
        "1721000",  # Palmas
        "4314902",  # Porto Alegre
        "1100205",  # Porto Velho
        "2611606",  # Recife
        "1200401",  # Rio Branco
        "3304557",  # Rio de Janeiro
        "2927408",  # Salvador
        "2111300",  # São Luís
        "2211001",  # Teresina
        "3205309",  # Vitória
    }
)

_UF_SUDESTE = frozenset({"MG", "SP", "RJ", "ES"})

COLUNAS = [
    "ibge",
    "nome",
    "uf",
    "regiao",
    "tipo",
    "status",
    "cnpj_prefeitura",
    "nota",
]


def eh_ibge7(valor: Any) -> bool:
    s = str(valor or "").strip()
    return len(s) == 7 and s.isdigit()


def classificar(cidade: dict[str, Any]) -> tuple[str, str]:
    """`(status, nota)` de uma linha do catálogo.

    Ordem: principal → delegada (fila B) → CNPJ ausente → pronta.
    """
    ibge = str(cidade.get("id_municipio") or "").strip()
    cnpj = str(cidade.get("cnpj_prefeitura") or "").strip()
    if ibge in PRINCIPAIS:
        return "excluida-principal", "Fase A / 6 principais"
    if ibge in CAPITAIS_DELEGADAS:
        # Capitais podem ter CNPJ no JSON; ainda assim não são desta fila.
        return "delegada", "handoff SP+capitais (fila B)"
    if not cnpj:
        return "bloqueada-cnpj", "cnpj_prefeitura ausente no catalogo"
    return "pronta", ""


def _peso_ordem(linha: dict[str, Any]) -> tuple[int, int, str, str]:
    """MG primeiro; polo antes de capital (volume menor = piloto de ritmo)."""
    uf = str(linha.get("uf") or "")
    if uf == "MG":
        uf_rank = 0
    elif uf in _UF_SUDESTE:
        uf_rank = 1
    else:
        uf_rank = 2
    tipo_rank = 0 if linha.get("tipo") == "polo-interior" else 1
    return (uf_rank, tipo_rank, str(linha.get("ibge") or ""), uf)


def montar_manifesto(cidades: Iterable[dict[str, Any]]) -> list[dict[str, str]]:
    """Filtra, classifica e ordena. Pura — teste não toca disco nem API."""
    linhas: list[dict[str, str]] = []
    for c in cidades:
        ibge = str(c.get("id_municipio") or "").strip()
        if not eh_ibge7(ibge):
            continue
        status, nota = classificar(c)
        linhas.append(
            {
                "ibge": ibge,
                "nome": str(c.get("nome") or ""),
                "uf": str(c.get("uf") or ""),
                "regiao": str(c.get("regiao") or ""),
                "tipo": str(c.get("tipo") or ""),
                "status": status,
                "cnpj_prefeitura": str(c.get("cnpj_prefeitura") or "").strip(),
                "nota": nota,
            }
        )
    linhas.sort(key=_peso_ordem)
    return linhas


def carregar_catalogo(caminho: Path = CATALOGO) -> list[dict[str, Any]]:
    with caminho.open("r", encoding="utf-8") as f:
        dados = json.load(f)
    cidades = dados.get("cidades")
    if not isinstance(cidades, list):
        raise RuntimeError(f"{caminho}: campo `cidades` ausente ou não-lista")
    return cidades


def carregar_cnpjs_banco(ibges: list[str]) -> dict[str, str]:
    """`{ibge: cnpj_prefeitura}` de `municipios` (fonte de verdade).

    O JSON do catálogo é gerado e não traz CNPJ de polos novos; o banco
    tem `cnpj_prefeitura` (semeado ou preenchido por `preencher_cnpj`).
    Sem este merge, toda fila nasce `bloqueada-cnpj` mesmo com o CNPJ no
    banco — medição 24/09: JSON 0 prontas vs banco 31 com CNPJ.
    """
    if not ibges:
        return {}
    from etl.common import get_supabase_client

    client = get_supabase_client()
    # Lote em pedaços: PostgREST aceita `in.(a,b)` longo, mas 500 ids
    # por chamada é folga e cobre as 203 do manifesto.
    out: dict[str, str] = {}
    ids = sorted(set(ibges))
    for i in range(0, len(ids), 500):
        lote = ids[i : i + 500]
        linhas = (
            client.table("municipios")
            .select("id_municipio, cnpj_prefeitura")
            .in_("id_municipio", lote)
            .execute()
            .data
        )
        for r in linhas:
            cnpj = str(r.get("cnpj_prefeitura") or "").strip()
            if cnpj:
                out[str(r.get("id_municipio") or "")] = cnpj
    return out


def mesclar_cnpjs(
    cidades: list[dict[str, Any]], cnpjs: dict[str, str]
) -> list[dict[str, Any]]:
    """Preenche `cnpj_prefeitura` do JSON a partir do banco. Pura.

    Só preenche o vazio: CNPJ já no catálogo (gerado) ganha do banco —
    a exceção seria o inverso, e o JSON é regenerado a partir do mesmo
    campo em `municipios`.
    """
    if not cnpjs:
        return cidades
    saida: list[dict[str, Any]] = []
    for c in cidades:
        ibge = str(c.get("id_municipio") or "").strip()
        novo = dict(c)
        if ibge and not str(novo.get("cnpj_prefeitura") or "").strip():
            if ibge in cnpjs:
                novo["cnpj_prefeitura"] = cnpjs[ibge]
        saida.append(novo)
    return saida


def gravar_csv(linhas: list[dict[str, str]], caminho: Path) -> None:
    """CSV com separador `;` e BOM UTF-8 — regra do portal p/ Excel BR."""
    caminho.parent.mkdir(parents=True, exist_ok=True)
    with caminho.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=COLUNAS, delimiter=";", lineterminator="\n")
        w.writeheader()
        w.writerows(linhas)


def resumo(linhas: list[dict[str, str]]) -> dict[str, int]:
    out: dict[str, int] = {}
    for ln in linhas:
        out[ln["status"]] = out.get(ln["status"], 0) + 1
    out["total"] = len(linhas)
    return out


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Gera o manifesto da fila PNCP")
    p.add_argument("--catalogo", type=Path, default=CATALOGO)
    p.add_argument("--saida", type=Path, default=SAIDA_PADRAO)
    p.add_argument(
        "--sem-banco",
        action="store_true",
        help="Não consulta municipios.cnpj_prefeitura (só o JSON do catálogo)",
    )
    args = p.parse_args(argv)
    cidades = carregar_catalogo(args.catalogo)
    if not args.sem_banco:
        try:
            ibges = [
                str(c.get("id_municipio") or "").strip() for c in cidades
            ]
            cidades = mesclar_cnpjs(cidades, carregar_cnpjs_banco(ibges))
        except Exception as e:  # noqa: BLE001 — manifesto sem banco ainda serve
            print(
                f"[etl.pncp.manifesto] AVISO: sem merge de CNPJ do banco ({e})",
                flush=True,
            )
    linhas = montar_manifesto(cidades)
    gravar_csv(linhas, args.saida)
    r = resumo(linhas)
    print(
        f"[etl.pncp.manifesto] {args.saida} "
        f"total={r.get('total', 0)} "
        f"pronta={r.get('pronta', 0)} "
        f"bloqueada-cnpj={r.get('bloqueada-cnpj', 0)} "
        f"delegada={r.get('delegada', 0)} "
        f"excluida-principal={r.get('excluida-principal', 0)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
