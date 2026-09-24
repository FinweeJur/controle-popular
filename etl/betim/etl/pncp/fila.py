"""Fila PNCP — 1 cidade por vez, do manifesto até o checkpoint fechar.

    python -m etl.pncp.fila --manifesto etl/betim/dados/manifesto-pncp.csv
    python -m etl.pncp.fila --manifesto ... --max-cidades 1 --dry-run

REGRAS (plano Fase B/C):
- só status `pronta` (CNPJ known; `delegada`/`bloqueada-cnpj`/`excluida-principal`
  não entram — a outra IA é dona das delegadas);
- dentro da cidade: contratos → licitações (orgaos fica avulso, caro);
- cidade cujo namespace `{ibge}:` está todo `ok` nos dois checkpoints é pulada;
- um lock de arquivo evita dois ETLs PNCP na mesma máquina (1 por vez).

Dry-run não toca a API nem o banco: só decide e imprime.
"""
from __future__ import annotations

import argparse
import csv
import os
import sys
import time
from pathlib import Path
from typing import Any, Callable

from etl.pncp import checkpoint as ck
from etl.pncp.manifesto import COLUNAS

_RAIZ_ETL = Path(__file__).resolve().parents[2]  # etl/betim
LOCK = _RAIZ_ETL / ".fila-pncp.lock"
LOG_DIR = _RAIZ_ETL / "logs" / "pncp"

# Modalidades de licitação / anos que a Fase A usou (2021..ano corrente).
MODALIDADES = range(1, 14)


def ler_manifesto(caminho: Path) -> list[dict[str, str]]:
    with caminho.open("r", encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f, delimiter=";"))
    faltando = set(COLUNAS) - set(rows[0].keys() if rows else COLUNAS)
    if faltando:
        raise RuntimeError(f"{caminho}: colunas faltando {sorted(faltando)}")
    return rows


def chaves_ibge(estado: dict[str, Any], ibge: str, sep: str = ":") -> list[str]:
    prefixo = f"{ibge}{sep}"
    return [k for k in estado if k.startswith(prefixo)]


def resumo_ibge(
    estado: dict[str, Any], ibge: str, sep: str = ":"
) -> tuple[int, int, int]:
    """`(total, ok, nao_ok)` das chaves namespaced deste IBGE."""
    chaves = chaves_ibge(estado, ibge, sep)
    ok = sum(
        1
        for k in chaves
        if isinstance(estado[k], dict) and estado[k].get("status") == "ok"
    )
    return len(chaves), ok, len(chaves) - ok


def cidade_completa(
    estado_contratos: dict[str, Any],
    estado_licitacoes: dict[str, Any],
    ibge: str,
) -> bool:
    """Pronta para pular?

    Critério barato e honesto: tem ao menos 1 chave de cada ETL e **todas**
    estão `ok`. Cidade com 0 chaves nos dois arquivos ainda não rodou —
    não é completa (Itinga fechou com chaves ok e 0 registros; isso conta).
    """
    tc, oc, nc = resumo_ibge(estado_contratos, ibge)
    tl, ol, nl = resumo_ibge(estado_licitacoes, ibge)
    if tc == 0 and tl == 0:
        return False
    return nc == 0 and nl == 0 and oc > 0 and ol > 0


def proximas_prontas(
    manifesto: list[dict[str, str]],
    estado_contratos: dict[str, Any],
    estado_licitacoes: dict[str, Any],
    *,
    pular_completas: bool = True,
) -> list[dict[str, str]]:
    saida: list[dict[str, str]] = []
    for ln in manifesto:
        if ln.get("status") != "pronta":
            continue
        ibge = ln.get("ibge") or ""
        if pular_completas and cidade_completa(
            estado_contratos, estado_licitacoes, ibge
        ):
            continue
        saida.append(ln)
    return saida


def _adquirir_lock(caminho: Path) -> bool:
    try:
        fd = os.open(caminho, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError:
        return False
    os.write(fd, f"pid={os.getpid()} t={time.time():.0f}\n".encode("ascii"))
    os.close(fd)
    return True


def _liberar_lock(caminho: Path) -> None:
    try:
        caminho.unlink()
    except OSError:
        pass


def executar_cidade(
    linha: dict[str, str],
    *,
    ano_inicio: int,
    rodar_contratos: Callable[..., None],
    rodar_licitacoes: Callable[..., None],
) -> None:
    ibge = linha["ibge"]
    print(f"[etl.pncp.fila] === {ibge} {linha.get('nome')} ===", flush=True)
    rodar_contratos(id_municipio=ibge, ano_inicio=ano_inicio)
    rodar_licitacoes(id_municipio=ibge, ano_inicio=ano_inicio)
    print(f"[etl.pncp.fila] === {ibge} ok ===", flush=True)


def _imports_coleta() -> tuple[Callable[..., None], Callable[..., None]]:
    # Import tardio: dry-run e testes não carregam requests/psycopg.
    from etl.pncp.contratos import sync as sync_contratos
    from etl.pncp.licitacoes import sync as sync_licitacoes

    def _c(*, id_municipio: str, ano_inicio: int) -> None:
        sync_contratos(id_municipio, None, ano_inicio, False)

    def _l(*, id_municipio: str, ano_inicio: int) -> None:
        sync_licitacoes(id_municipio, ano_inicio, False)

    return _c, _l


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Fila PNCP 1 cidade/vez")
    p.add_argument("--manifesto", type=Path, required=True)
    p.add_argument("--ano-inicio", type=int, default=2021)
    p.add_argument("--max-cidades", type=int, default=0, help="0 = todas as prontas")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument(
        "--reprocessar-completas",
        action="store_true",
        help="Não pula cidades cujo checkpoint já fechou",
    )
    args = p.parse_args(argv)

    manifesto = ler_manifesto(args.manifesto)
    estado_c = ck.carregar(ck.NOME_CONTRATOS)
    estado_l = ck.carregar(ck.NOME_LICITACOES)
    fila = proximas_prontas(
        manifesto,
        estado_c,
        estado_l,
        pular_completas=not args.reprocessar_completas,
    )
    if args.max_cidades > 0:
        fila = fila[: args.max_cidades]

    print(
        f"[etl.pncp.fila] manifesto={args.manifesto} "
        f"prontas_na_fila={len(fila)}",
        flush=True,
    )
    if not fila:
        print("[etl.pncp.fila] nada a fazer", flush=True)
        return 0
    for ln in fila:
        print(
            f"  {ln['ibge']} {ln.get('nome')}/{ln.get('uf')} "
            f"cnpj={ln.get('cnpj_prefeitura')}",
            flush=True,
        )

    if args.dry_run:
        return 0

    if not _adquirir_lock(LOCK):
        print(
            f"[etl.pncp.fila] ABORT: lock em {LOCK} "
            "(outro ETL PNCP nesta máquina)",
            file=sys.stderr,
        )
        return 2

    LOG_DIR.mkdir(parents=True, exist_ok=True)
    rodar_c, rodar_l = _imports_coleta()
    erros = 0
    try:
        for ln in fila:
            ibge = ln["ibge"]
            log = LOG_DIR / f"{ibge}.out"
            try:
                # stdout duplicado no log da cidade + no stdout do processo
                # (o runner da sessão já captura o stdout geral).
                executar_cidade(
                    ln,
                    ano_inicio=args.ano_inicio,
                    rodar_contratos=rodar_c,
                    rodar_licitacoes=rodar_l,
                )
                with log.open("a", encoding="utf-8") as f:
                    f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')} {ibge} ok\n")
            except Exception as e:  # noqa: BLE001 — 1 cidade não derruba a fila
                erros += 1
                print(
                    f"[etl.pncp.fila] ERRO {ibge}: {e}",
                    file=sys.stderr,
                    flush=True,
                )
                with log.open("a", encoding="utf-8") as f:
                    f.write(
                        f"{time.strftime('%Y-%m-%d %H:%M:%S')} {ibge} "
                        f"erro={e}\n"
                    )
                # Segue para a próxima: plano Fase C — não parar o lote.
    finally:
        _liberar_lock(LOCK)

    print(f"[etl.pncp.fila] fim cidades={len(fila)} erros={erros}", flush=True)
    return 1 if erros else 0


if __name__ == "__main__":
    raise SystemExit(main())
