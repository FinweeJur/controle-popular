# -*- coding: utf-8 -*-
"""Arquiva os dados abertos do ONS no Google Drive (Parquet por padrão).

POR QUE EXISTE

O portal publica agregados; o bruto é a prova. Em vez de guardar 107 GB de
CSV+XLSX (com o mesmo dado três vezes), este coletor baixa **Parquet** — o
mesmo conteúdo em ~3,3 GB — e registra URL, tamanho e SHA-256 de cada arquivo.
Assim o agregado publicado pode ser reconstruído e auditado depois.

ONDE GRAVA

    G:\\Meu Drive\\controle-popular\\dados\\ons\\<conjunto>\\<arquivo>.parquet
    G:\\Meu Drive\\controle-popular\\dados\\ons\\<conjunto>\\_manifest.json

O manifesto é por conjunto: fonte do arquivo, bytes, sha256 e data do download.
Arquivo já baixado com o mesmo tamanho é pulado; se o sha256 estiver vazio, ele
é calculado na hora (retomada barata).

COMO USAR

    python scripts/arquivar-ons.py --ano 2026          # só o ano corrente
    python scripts/arquivar-ons.py --tudo              # histórico completo
    python scripts/arquivar-ons.py --dataset carga-energia --seco
    python scripts/arquivar-ons.py --formato csv --tudo  # se precisar do CSV

Ritmo: arquivos do S3 em paralelo moderado (--workers 3, 0,2 s cada) e 1 s entre
conjuntos. User-Agent honesto, exigido pela regra de coleta do projeto.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import threading
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

BASE = "https://dados.ons.org.br/api/3/action"
UA = "finweejur/github artur colito"
DRIVE = Path(r"G:\Meu Drive\controle-popular\dados\ons")
ANO_ATUAL = datetime.now().year
EXT = {"parquet": ".parquet", "csv": ".csv", "xlsx": ".xlsx", "pdf": ".pdf"}
TRAVA = threading.Lock()


def pegar(url: str, tentativas: int = 3) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for tentativa in range(tentativas):
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.load(r)
        except Exception:
            if tentativa == tentativas - 1:
                raise
            time.sleep(2 + tentativa * 2)
    return {}


def ano_do_recurso(nome: str, url: str) -> int | None:
    """Ano do arquivo, quando o nome ou a URL dizem (ex.: -2026, _2026-11)."""
    achado = re.search(r"(19|20)\d{2}", f"{nome or ''} {url or ''}")
    return int(achado.group(0)) if achado else None


def sha256_de(caminho: Path) -> str:
    hash_ = hashlib.sha256()
    with open(caminho, "rb") as f:
        for bloco in iter(lambda: f.read(1024 * 1024), b""):
            hash_.update(bloco)
    return hash_.hexdigest()


def baixar(url: str, destino: Path, esperado: int) -> tuple[int, str]:
    """Baixa com retomada (Range) e devolve (bytes, sha256)."""
    destino.parent.mkdir(parents=True, exist_ok=True)
    parcial = destino.with_suffix(destino.suffix + ".part")
    inicio = parcial.stat().st_size if parcial.exists() else 0
    cabecalhos = {"User-Agent": UA}
    modo = "wb"
    if inicio and esperado and inicio < esperado:
        cabecalhos["Range"] = f"bytes={inicio}-"
        modo = "ab"
    else:
        inicio = 0
    req = urllib.request.Request(url, headers=cabecalhos)
    with urllib.request.urlopen(req, timeout=180) as r, open(parcial, modo) as f:
        shutil.copyfileobj(r, f, length=1024 * 512)
    parcial.replace(destino)
    return destino.stat().st_size, sha256_de(destino)


def recursos_do_conjunto(nome: str, formato: str) -> list[dict]:
    p = pegar(f"{BASE}/package_show?id={nome}")["result"]
    recursos = [r for r in (p.get("resources") or []) if (r.get("format") or "").lower() == formato]
    if not recursos and formato == "parquet":
        # Conjunto sem Parquet: cai para CSV, o formato textual mais estável.
        recursos = [r for r in (p.get("resources") or []) if (r.get("format") or "").lower() == "csv"]
    return recursos


def nome_do_arquivo(r: dict) -> str:
    extensao = EXT.get((r.get("format") or "").lower(), ".bin")
    limpo = re.sub(r"[^A-Za-z0-9._-]+", "_", r.get("name") or "arquivo")
    return f"{limpo}{extensao}"


def baixar_um(tarefa: dict) -> tuple[str, int, str, bool, bool]:
    """Baixa um recurso. Devolve (arquivo, bytes, sha, baixou, falhou)."""
    destino: Path = tarefa["destino"]
    esperado: int = tarefa["esperado"]
    try:
        if destino.exists():
            tamanho = destino.stat().st_size
            if not esperado or tamanho == esperado:
                return destino.name, tamanho, sha256_de(destino), False, False
        tamanho, sha = baixar(tarefa["url"], destino, esperado)
        time.sleep(0.2)
        return destino.name, tamanho, sha, True, False
    except Exception as exc:  # noqa: BLE001 - uma falha não derruba o lote
        with TRAVA:
            print(f"  FALHA {destino.name}: {type(exc).__name__}", flush=True)
        return destino.name, 0, "", False, True


def arquivar_dataset(nome: str, formato: str, ano: int | None, seco: bool, workers: int) -> dict:
    destino_dir = DRIVE / nome
    manifesto_path = destino_dir / "_manifest.json"
    manifesto = {}
    if manifesto_path.exists():
        manifesto = json.loads(manifesto_path.read_text(encoding="utf-8"))

    tarefas = []
    for r in recursos_do_conjunto(nome, formato):
        url = r.get("url") or ""
        if not url:
            continue
        ano_r = ano_do_recurso(r.get("name") or "", url)
        if ano and ano_r and ano_r != ano:
            continue
        if ano and ano_r is None and (r.get("format") or "").lower() == "pdf":
            continue
        arquivo = nome_do_arquivo(r)
        if any(tarefa["destino"].name == arquivo for tarefa in tarefas):
            continue  # o CKAN repete o nome em alguns conjuntos: baixa uma vez
        tarefas.append(
            {"url": url, "destino": destino_dir / arquivo, "esperado": int(r.get("size") or 0)}
        )

    if seco:
        total = sum(t["esperado"] for t in tarefas)
        print(f"  [seco] {len(tarefas)} arquivos, {total / 1048576:.1f} MB", flush=True)
        return {"dataset": nome, "baixados": len(tarefas), "pulados": 0, "falhas": 0,
                "MB": round(total / 1048576, 2)}

    url_por_arquivo = {tarefa["destino"].name: tarefa["url"] for tarefa in tarefas}
    baixados = pulados = falhas = 0
    bytes_total = 0
    with ThreadPoolExecutor(max_workers=workers) as pool:
        for arquivo, tamanho, sha, baixou, falhou in pool.map(baixar_um, tarefas):
            with TRAVA:
                if falhou:
                    falhas += 1
                else:
                    baixados += baixou
                    pulados += not baixou
                    bytes_total += tamanho
                    manifesto[arquivo] = {
                        "URL": url_por_arquivo.get(arquivo, ""),
                        "bytes": tamanho,
                        "sha256": sha,
                        "baixadoEm": manifesto.get(arquivo, {}).get(
                            "baixadoEm", datetime.now(timezone.utc).isoformat(timespec="seconds")
                        ),
                    }

    destino_dir.mkdir(parents=True, exist_ok=True)
    manifesto_path.write_text(
        json.dumps(manifesto, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
    )
    return {"dataset": nome, "baixados": baixados, "pulados": pulados,
            "falhas": falhas, "MB": round(bytes_total / 1048576, 2)}


def main() -> int:
    parser = argparse.ArgumentParser(description="Arquiva o bruto do ONS no Drive.")
    parser.add_argument("--ano", type=int, default=None, help="Só arquivos deste ano.")
    parser.add_argument("--tudo", action="store_true", help="Histórico completo.")
    parser.add_argument("--dataset", default=None, help="Um conjunto específico.")
    parser.add_argument("--formato", default="parquet", choices=sorted(EXT))
    parser.add_argument("--workers", type=int, default=3, help="Downloads simultâneos (padrão 3).")
    parser.add_argument("--seco", action="store_true", help="Só mede, não baixa.")
    args = parser.parse_args()

    if not args.ano and not args.tudo:
        args.ano = ANO_ATUAL

    nomes = [args.dataset] if args.dataset else pegar(f"{BASE}/package_list")["result"]
    DRIVE.mkdir(parents=True, exist_ok=True)
    print(f"destino: {DRIVE}", flush=True)
    print(f"conjuntos: {len(nomes)} | formato: {args.formato} | ano: {args.ano or 'todos'}", flush=True)

    resumos = []
    for i, nome in enumerate(nomes, 1):
        print(f"[{i}/{len(nomes)}] {nome}", flush=True)
        resumos.append(arquivar_dataset(nome, args.formato, args.ano, args.seco, args.workers))
        time.sleep(1.0)

    total_mb = sum(r["MB"] for r in resumos)
    total_arq = sum(r["baixados"] + r["pulados"] for r in resumos)
    print(f"\nTOTAL: {total_arq} arquivos, {total_mb:.1f} MB, "
          f"{sum(r['falhas'] for r in resumos)} falhas", flush=True)
    (DRIVE / "_resumo.json").write_text(
        json.dumps(
            {
                "geradoEm": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "ano": args.ano,
                "formato": args.formato,
                "arquivos": total_arq,
                "MB": round(total_mb, 2),
                "conjuntos": resumos,
            },
            ensure_ascii=False,
            indent=1,
        ),
        encoding="utf-8",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
