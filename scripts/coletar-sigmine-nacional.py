"""coletar-sigmine-nacional.py — processos minerários da ANM (SIGMINE), por UF.

Baixa os shapefiles zipados de https://dadosabertos.anm.gov.br/SIGMINE/PROCESSOS_MINERARIOS/<UF>.zip
e lê SOMENTE o arquivo DBF (dBASE III) dentro do zip, com parser puro da stdlib
(struct) — não usa o .shp nem geopandas/ogr. Grava JSON compacto em
apps/web/data/sigmine-nacional.json.

Rodar:
    python scripts/coletar-sigmine-nacional.py --dry-run   # só HEAD em cada UF, sem baixar
    python scripts/coletar-sigmine-nacional.py             # coleta truncada (--limit 2000/UF default)
    python scripts/coletar-sigmine-nacional.py --limit 0   # sem truncar
    python scripts/coletar-sigmine-nacional.py --brasil    # baixa BRASIL.zip (125 MB!) e grava UF=BR
    python scripts/coletar-sigmine-nacional.py --scan-cpf  # roda o varredor de CPF ao final

## Fonte e licença

- Fonte: https://dadosabertos.anm.gov.br/SIGMINE/PROCESSOS_MINERARIOS/<UF>.zip
- Shapefile atualizado diariamente pela ANM. Dado público governamental,
  atribuição à fonte ANM/SIGMINE.

## Decisão robots.txt (consultado em 2026-09-16, https://dadosabertos.anm.gov.br/robots.txt)

O robots.txt do host responde HTTP 404 — sem restrição declarada para a rota
de download. Pausa de 2s entre downloads como cortesia; User-Agent honesto.

## Restrições e privacidade (same as irmão coletar-ibama-licencas.py)

- BRASIL.zip (~125 MB) é PROIBIDO por default; só baixa com --brasil.
- O DBF não tem campo de município e não tem data de protocolo — ver
  chaves "obs" do JSON e RESSALVA abaixo.
- O campo NOME (titular) é texto livre que pode trazer CPF colado; _sanitizar_doc_em_nome
  aplica o mesmo padrão genérico do irmão antes de gravar. --scan-cpf roda o varredor oficial.

## Ressalva editorial

O SIGMINE traz processos minerários ativos e arquivados; a fase registra o
estado do cadastro posterior, não o momento do pedido.
"""
from __future__ import annotations

import argparse
import json
import struct
import subprocess
import sys
import time
import zipfile

sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # console Windows é cp1252
from datetime import datetime, timezone
from pathlib import Path

import urllib.request
import urllib.error

BASE = "https://dadosabertos.anm.gov.br/SIGMINE/PROCESSOS_MINERARIOS/{uf}.zip"
SAIDA = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "sigmine-nacional.json"
CACHE = Path(__file__).resolve().parent / ".cache" / "sigmine-nacional"
UA = "ControlePopular/1.0 (+controlepopular.com.br; dado publico governamental)"
PAUSA = 2  # robots.txt responde 404 (sem restrição); pausa de cortesia
LIMITE_PADRAO = 2000
UFS = ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG",
       "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR",
       "RS", "SC", "SE", "SP", "TO"]
# razão de MG (medida em 2026-09-16): 54890 processos / 22049473 bytes
PROC_POR_BYTE = 54890 / 22049473

# Campos do DBF -> rótulos curtos no JSON (ldict interno 1×, linhas em array)
CAMPOS = {
    "DSProcesso": "proc",
    "ANO": "ano",
    "FASE": "fase",
    "NOME": "titular",   # sanitisado (CPF de 11 dígitos removido)
    "SUBS": "subs",
    "USO": "uso",
    "UF": "uf",
    "AREA_HA": "area_ha",
    "ULT_EVENTO": "ev",
}
RESSALVA = ("Inclui processos minerários ativos e arquivados; a fase "
            "depende de cadastro posterior.")


def _ler_dbf(dados: bytes) -> list[list[bytes]]:
    """Parser dBASE III puro (stdlib struct). Devolve lista de registros,
    cada registro como lista de campos em bytes (ordem = CAMPOS)."""
    nrec = struct.unpack("<I", dados[4:8])[0]
    nheads, reclen = struct.unpack("<HH", dados[8:12])
    # descritores de campo: blocos de 32 bytes a partir do byte 32, até 0x0d
    campos: list[tuple[str, int]] = []
    pos = 32
    while dados[pos] != 0x0D:
        d = dados[pos:pos + 32]
        nm = d[:11].split(b"\x00")[0].decode("ascii")
        campos.append((nm, d[16]))  # (nome, tamanho)
        pos += 32

    # o arquivo tem 12 campos; o JSON usa só os de CAMPOS, na ordem CAMPOS
    nomes = [nm for nm, _ in campos]
    alvo = [nomes.index(nm) for nm in CAMPOS]

    registros = []
    for i in range(nrec):
        rec = dados[nheads + i * reclen:nheads + (i + 1) * reclen]
        if not rec or rec[0:1] == b"\x1a":  # marcador de fim
            break
        todos, off = [], 1  # rec[0] é flag de deleção
        for _, tam in campos:
            todos.append(rec[off:off + tam])
            off += tam
        registros.append([todos[i] for i in alvo])
    return registros


def _dec(b: bytes) -> str | None:
    """UTF-8 com fallback latin-1; branco vira None."""
    s = b.strip()
    try:
        s = s.decode("utf-8")
    except UnicodeDecodeError:
        s = s.decode("latin-1")
    s = s.strip()
    return s or None


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


def _baixar_uf(uf: str) -> tuple[Path, int, str]:
    """Baixa <UF>.zip para o cache. Devolve (caminho, bytes, last-modified).
    403/429: espera 30s e retenta 1x."""
    url = BASE.format(uf=uf)
    alvo = CACHE / f"{uf}.zip"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        resp = urllib.request.urlopen(req, timeout=300)
    except urllib.error.HTTPError as e:
        if e.code in (403, 429):
            print(f"  [!] {e.code} em {uf} — esperando 30s e tentando de novo...")
            time.sleep(30)
            resp = urllib.request.urlopen(req, timeout=300)
        else:
            raise
    fonte_ts = resp.headers.get("Last-Modified", "")
    tmp = alvo.with_suffix(".parcial")
    total = 0
    with open(tmp, "wb") as f:
        while True:
            pedaco = resp.read(1 << 20)
            if not pedaco:
                break
            f.write(pedaco)
            total += len(pedaco)
    resp.close()
    import os
    os.replace(tmp, alvo)  # Windows: rename falha se o alvo já existe
    return alvo, total, fonte_ts


def _head_uf(uf: str) -> tuple[int, str]:
    req = urllib.request.Request(BASE.format(uf=uf), headers={"User-Agent": UA}, method="HEAD")
    resp = urllib.request.urlopen(req, timeout=60)
    n = int(resp.headers.get("Content-Length", 0))
    ts = resp.headers.get("Last-Modified", "")
    resp.close()
    return n, ts


def main() -> None:
    parser = argparse.ArgumentParser(description="Coletor SIGMINE/ANM por UF (só DBF, stdlib)")
    parser.add_argument("--dry-run", action="store_true", help="HEAD em cada UF, não baixa nada")
    parser.add_argument("--limit", type=int, default=LIMITE_PADRAO,
                        help="trunca registros por UF (0 = sem truncar)")
    parser.add_argument("--brasil", action="store_true",
                        help="baixa BRASIL.zip (~125 MB) em vez das 27 UFs; grava UF=BR")
    parser.add_argument("--scan-cpf", action="store_true", help="roda o varredor de CPF sobre a saída")
    args = parser.parse_args()

    alvo_ufs = ["BR"] if args.brasil else UFS
    print("=== ANM SIGMINE processos minerários ===\n")
    print(f"  fonte  : {BASE.format(uf='<UF>')}")
    print(f"  alvo   : {'BRASIL.zip' if args.brasil else f'{len(alvo_ufs)} UFs'}")
    print(f"  limite : {'sem limite' if args.limit == 0 else args.limit} por UF")
    print(f"  robots : robots.txt responde 404 (sem restrição); pausa {PAUSA}s de cortesia")
    print(f"  saida  : {SAIDA}\n")

    CACHE.mkdir(parents=True, exist_ok=True)
    ckpt_dir = CACHE

    if args.dry_run:
        # só HEAD em cada UF.zip; estimativa via razão de MG
        estim_total, soma_bytes = 0, 0
        for uf in alvo_ufs:
            try:
                nbytes, ts = _head_uf(uf)
            except Exception as e:
                print(f"  {uf}: HEAD falhou ({e})")
                time.sleep(PAUSA)
                continue
            proc_est = int(nbytes * PROC_POR_BYTE)
            print(f"  {uf}: {nbytes:,} bytes; última atualização {ts}; ~{proc_est:,} processos")
            soma_bytes += nbytes
            estim_total += proc_est
            time.sleep(PAUSA)
        print(f"\n  TOTAL: ~{soma_bytes:,} bytes; ~{estim_total:,} processos estimados")
        print(f"  JSON estimado: ~{estim_total * 190 / 1e6:.1f} MB (sem limit)")
        return

    ufs_info = {}
    processos_por_uf = {}
    resumo_por_uf = {}
    total_fonte = 0

    for uf in alvo_ufs:
        ckpt = ckpt_dir / f"{uf}.json"
        alvo_zip = ckpt_dir / f"{uf}.zip"

        # retomada: UF já parseado com a MESMA Last-Modified → pula
        if ckpt.exists() and alvo_zip.exists():
            antigo = json.loads(ckpt.read_text(encoding="utf-8"))
            if antigo.get("parseado"):
                # só confere Last-Modified com HEAD
                try:
                    _, ts = _head_uf(uf)
                    ufs_info[uf] = {"bytes": alvo_zip.stat().st_size, "last_modified": ts}
                except Exception:
                    ts = ""
                if ts and antigo.get("last_modified") == ts:
                    print(f"  [{uf}] já parseado com a mesma versão ({ts}) — pulando")
                    # relê o DBF vivo: nunca confiar em resumo de versão anterior
                    # do parser (o por_fase do checkpoint pode estar torto)
                    rstr = _restaura_uf(processos_por_uf, uf, args.limit or None)
                    if rstr:
                        processos_por_uf[uf] = rstr["linhas"]
                        resumo_por_uf[uf] = {"processos": rstr["processos"],
                                             "por_fase": rstr["por_fase"]}
                        total_fonte += rstr["processos"]
                    time.sleep(PAUSA)
                    continue

        precisa_baixar = True
        if alvo_zip.exists():
            try:
                _, ts = _head_uf(uf)
                # se o zip local é da mesma versão, reutiliza sem baixar
                if ts and ckpt.exists():
                    antigo = json.loads(ckpt.read_text(encoding="utf-8"))
                    if antigo.get("last_modified") == ts:
                        precisa_baixar = False
                        print(f"  [{uf}] zip local é da versão atual — reutilizando")
            except Exception:
                pass  # sem HEAD: baixa mesmo assim

        if precisa_baixar:
            print(f"  [{uf}] baixando...")
            alvo_zip, nbytes, ts = _baixar_uf(uf)
            print(f"  [{uf}] {nbytes:,} bytes baixados")
        else:
            nbytes = alvo_zip.stat().st_size
            _, ts = _head_uf(uf)
        ufs_info[uf] = {"bytes": alvo_zip.stat().st_size, "last_modified": ts}

        # parse do DBF dentro do zip (só o DBF; shp não é tocado)
        with zipfile.ZipFile(alvo_zip) as z:
            nome_dbf = next(n for n in z.namelist() if n.lower().endswith(".dbf"))
            regs = _ler_dbf(z.read(nome_dbf))

        total_uf = len(regs)
        # contagem por fase calculada na memória durante o parse
        por_fase: dict[str, int] = {}
        linhas = []
        limite_uf = args.limit or None
        for vals in regs:
            if limite_uf and len(linhas) >= limite_uf:
                break
            rec = dict(zip(CAMPOS, vals))
            fase = _dec(rec["FASE"]) or "-"
            por_fase[fase] = por_fase.get(fase, 0) + 1
            try:
                area = float(_dec(rec["AREA_HA"]))
            except (ValueError, TypeError):
                area = None
            linhas.append([
                _dec(rec["DSProcesso"]),
                _dec(rec["ANO"]),
                fase,
                _sanitizar_doc_em_nome(_dec(rec["NOME"])),
                _dec(rec["SUBS"]),
                _dec(rec["USO"]),
                _dec(rec["UF"]),
                area,
                _dec(rec["ULT_EVENTO"]),
            ])

        processos_por_uf[uf] = linhas
        resumo_por_uf[uf] = {"processos": total_uf, "por_fase": por_fase}
        total_fonte += total_uf
        truncado_uf = bool(limite_uf and total_uf > limite_uf)
        print(f"  [{uf}] {total_uf:,} processos na fonte → {len(linhas):,} gravados"
              + (" TRUNCADO" if truncado_uf else ""))
        # checkpoint por UF: parseado true + Last-Modified + resumo compacto
        ckpt.write_text(json.dumps({
            "uf": uf, "parseado": True, "last_modified": ts, "bytes": alvo_zip.stat().st_size,
            "total": total_uf, "resumo": {"processos": total_uf, "por_fase": por_fase},
            "ata": datetime.now(timezone.utc).isoformat(),
        }, ensure_ascii=False), encoding="utf-8")
        time.sleep(PAUSA)

    dados = {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "fonte": "https://dadosabertos.anm.gov.br/SIGMINE/PROCESSOS_MINERARIOS/",
        "ufs_info": ufs_info,
        "total_processos_fonte": total_fonte,
        "truncado": bool(args.limit and total_fonte > args.limit * len(alvo_ufs)),
        "ldict": {k: v for k, v in CAMPOS.items()},
        "colunas": list(CAMPOS.values()),
        "colunas_originais": list(CAMPOS),
        "ressalva_editorial": RESSALVA,
        "obs": ("O DBF do SIGMINE não tem campo de município. A única referência de "
                "data além de ANO é ULT_EVENTO (texto livre) — a data correta do "
                "processo é ANO + o texto de ULT_EVENTO."),
        "resumo_por_uf": resumo_por_uf,
        "processos_por_uf": processos_por_uf,
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    tam_mb = SAIDA.stat().st_size / 1e6
    print(f"\n[ok] {total_fonte:,} processos → {SAIDA.name} ({tam_mb:.1f} MB)"
          + (" — TRUNCADO (use --limit 0)" if dados["truncado"] else ""))

    if args.scan_cpf:
        print("\n  rodando o varredor de CPF sobre a saída...")
        r = subprocess.run([sys.executable, "scripts/checar-dado-pessoal-em-dado.py", "--extra", str(SAIDA)])
        if r.returncode != 0:
            print("  [!] CPF(s) achado(s) no JSON — redigir campo no coletor (substituir por null+flag).")
            sys.exit(2)
        print("  scan clean.")


def _restaura_uf(processos_por_uf: dict, uf: str, limite: int | None):
    """Reinsere o UF saltado pela retomada. Relê o DBF do zip local — barato,
    sem rede — e RECALCULA o resumo por fase vivo (o checkpoint pode carregar
    resumo de versão de parser antiga). Trunca como nas rodadas de coleta."""
    alvo_zip = CACHE / f"{uf}.zip"
    if not alvo_zip.exists():
        return None
    with zipfile.ZipFile(alvo_zip) as z:
        nome_dbf = next(n for n in z.namelist() if n.lower().endswith(".dbf"))
        regs = _ler_dbf(z.read(nome_dbf))
    linhas = []
    por_fase: dict[str, int] = {}
    for vals in regs:
        if limite and len(linhas) >= limite:
            break
        rec = dict(zip(CAMPOS, vals))
        fase = _dec(rec["FASE"]) or "-"
        por_fase[fase] = por_fase.get(fase, 0) + 1
        try:
            area = float(_dec(rec["AREA_HA"]))
        except (ValueError, TypeError):
            area = None
        linhas.append([
            _dec(rec["DSProcesso"]),
            _dec(rec["ANO"]),
            fase,
            _sanitizar_doc_em_nome(_dec(rec["NOME"])),
            _dec(rec["SUBS"]),
            _dec(rec["USO"]),
            _dec(rec["UF"]),
            area,
            _dec(rec["ULT_EVENTO"]),
        ])
    return {"linhas": linhas, "processos": len(regs), "por_fase": por_fase}


if __name__ == "__main__":
    main()
