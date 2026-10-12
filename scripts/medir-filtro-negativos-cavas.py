#!/usr/bin/env python3
"""Mede o filtro espacial de negativos do coletor de cavas, sem baixar nada.

Por que existe: MEDICOES (25/09) concluiu que o filtro "esgotou" com base em
18 aceitos em 39 tentativas do piloto - amostra minuscula. O plano exige
revisao do filtro antes do lote dos 5 mil negativos ("nao basta aumentar
--limite, o rendimento cai junto"). Este script refaz a conta no estado
ATUAL do checkpoint, com o MESMO codigo do coletor (import por caminho), a
mesma grade e a mesma semente 42 - dupla verificacao por identidade de
metodo, nao por reimplementacao.

O que responde:
1. taxa de aceitacao de hoje, dividida entre os dois filtros (exclusao
   SIGMINE + classe mineracao MapBiomas  vs.  janelas ja coletadas);
2. se a reserva do coletor (3 x --limite) cabe no teto de tentativas
   (limite x 400 + 4000, ver coletar-cavas-calibracao.py);
3. projecao de tentativas e candidatos para N negativos salvos, usando a
   taxa salvamento/candidatos medida no proprio log da ultima coleta grande.

Historico medido (logs em scripts/.cache/cavas-calibracao/):
- 28/09/2026 coleta-negativos.log: 2700/6083 = 44,4% (salvou 900/2700 = 33,3%)
- 28/09/2026 coleta-noturna.log:   5970/13681 = 43,7%
- 25/09/2026 piloto (MEDICOES):    18/39 = 46,2%

Uso:
    python scripts/medir-filtro-negativos-cavas.py
    python scripts/medir-filtro-negativos-cavas.py --amostras 30000 --limite 5000

Nao usa rede: a exclusao vem do cache exclusao-mg-bbox.json e o indice das
janelas ja coletadas vem do checkpoint.jsonl.
"""

from __future__ import annotations

import argparse
import importlib.util
import random
import re
import sys
import time
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
COLETOR = RAIZ / "scripts" / "coletar-cavas-calibracao.py"
LOGS = RAIZ / "scripts" / ".cache" / "cavas-calibracao"
MARGEM_EXT = 0.0  # margem do retangulo de sorteio (graus)

RE_CAND = re.compile(r"candidatos a negativo: (\d+) \(tentativas (\d+)\)")
RE_RODA = re.compile(r"rodada: \+?(\d+) positivos, \+?(\d+) negativos")


def carregar_coletor():
    """Importa o coletor por caminho (nome tem hifen) e devolve o modulo."""
    spec = importlib.util.spec_from_file_location("cavas_calibracao", COLETOR)
    if spec is None or spec.loader is None:
        raise SystemExit(f"nao consegui abrir {COLETOR}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def taxa_salvamento() -> tuple[float, str]:
    """Taxa candidatos -> arquivos salvos, medida no log da coleta grande.

    Devolve (taxa, origem). Sem log utilizavel devolve 0.333 com origem
    "padrao nao medido" - o projecao avisa e o leitor trata como estimativa.
    """
    achados: list[tuple[float, float, str]] = []
    for arq in LOGS.glob("coleta*.log"):
        texto = arq.read_text(encoding="utf-8", errors="replace")
        cands = RE_CAND.findall(texto)
        rodadas = RE_RODA.findall(texto)
        if not cands or not rodadas:
            continue
        n_cand = int(cands[-1][0])
        n_neg = int(rodadas[-1][1])
        if n_cand <= 0 or n_neg <= 0:
            continue
        achados.append((arq.stat().st_mtime, n_neg / n_cand,
                        f"{arq.name}: {n_neg} salvos / {n_cand} candidatos"))
    if not achados:
        return 0.333, "padrao nao medido (sem log)"
    achados.sort()
    _, taxa, origem = achados[-1]
    return taxa, origem


def carregar_indices(mod) -> dict:
    """Monta os DOIS indices do filtro (exclusao e ja coletados).

    Mesma composicao de coletar-cavas-calibracao.py: exclusao em celulas de
    0,5 grau, janelas do checkpoint em celulas de 0,02 grau. Devolve tudo
    que a medicao precisa, junto com as contagens impressas.
    """
    print("carregando exclusao (cache local, sem rede)...", flush=True)
    exclusao = mod.carregar_exclusao()
    idx = mod.montar_indice(exclusao)
    print(f"  bboxes de exclusao: {len(exclusao)} | celulas 0.5 grau: {len(idx)}",
          flush=True)
    hashes, itens = mod.ler_checkpoint()
    idx_col = mod.montar_indice(
        [tuple(it["bbox"]) for it in itens if it.get("bbox")],
        celula=mod.CELULA_COLETADOS)
    n_neg = sum(1 for i in itens if i.get("tipo") == "negativo")
    print(f"  checkpoint: {len(itens)} janelas ({n_neg} negativas) | "
          f"celulas 0.02 grau ja coletadas: {len(idx_col)}", flush=True)
    return {"idx": idx, "idx_col": idx_col, "n_itens": len(itens)}


def sortear(mod, indices: dict, amostras: int, semente: int) -> dict:
    """Sorteia `amostras` pontos na extensao do coletor e classifica cada um.

    Mesma logica de coletar-cavas-calibracao.py (rejeitado_indice nos dois
    indices, celulas e semente identicas) - medir aqui e medir la.
    """
    ext = mod.MG_EXT
    rng = random.Random(semente)
    cont = {"aceito": 0, "exclusao": 0, "coletado": 0, "ambos": 0}
    t0 = time.time()
    for _ in range(amostras):
        pt = (rng.uniform(ext["minlon"] - MARGEM_EXT, ext["maxlon"] + MARGEM_EXT),
              rng.uniform(ext["minlat"] - MARGEM_EXT, ext["maxlat"] + MARGEM_EXT))
        r_exc = mod.rejeitado_indice(pt, indices["idx"])
        r_col = mod.rejeitado_indice(pt, indices["idx_col"],
                                     celula=mod.CELULA_COLETADOS)
        if r_exc and r_col:
            cont["ambos"] += 1
        elif r_exc:
            cont["exclusao"] += 1
        elif r_col:
            cont["coletado"] += 1
        else:
            cont["aceito"] += 1
    return {"amostras": amostras, "cont": cont, "segundos": time.time() - t0}


def historico_aceitacao() -> list[tuple[str, int, int, float]]:
    """Aceitacao medida nas coletas ja logadas: (arquivo, aceitos, tentativas, taxa)."""
    linhas: list[tuple[float, tuple]] = []
    for arq in LOGS.glob("coleta*.log"):
        texto = arq.read_text(encoding="utf-8", errors="replace")
        acha = RE_CAND.findall(texto)
        if not acha:
            continue
        ace, tent = int(acha[-1][0]), int(acha[-1][1])
        if tent > 0:
            linhas.append((arq.stat().st_mtime, (arq.name, ace, tent, ace / tent)))
    linhas.sort()
    return [linha for _, linha in linhas]


def principal() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--amostras", type=int, default=20000,
                    help="pontos sorteados (padrao 20000)")
    ap.add_argument("--limite", type=int, default=5000,
                    help="limite do coletor usado na projecao (padrao 5000)")
    ap.add_argument("--salvos", type=int, default=1900,
                    help="negativos salvos projetados (padrao 1900 = resta p/ 5 mil)")
    ap.add_argument("--semente", type=int, default=42,
                    help="mesma semente do coletor (padrao 42)")
    args = ap.parse_args()

    mod = carregar_coletor()
    m = sortear(mod, carregar_indices(mod), args.amostras, args.semente)
    c, n = m["cont"], m["amostras"]
    p = c["aceito"] / n
    print()
    print(f"RESULTADO ({n} pontos, semente {args.semente}, {m['segundos']:.1f} s)")
    print(f"  aceitos pelo filtro .......... {c['aceito']:6d}  ({p:6.2%})")
    print(f"  mortos pela exclusao ......... {c['exclusao']:6d}  ({c['exclusao']/n:6.2%})")
    print(f"  mortos por ja coletados ...... {c['coletado']:6d}  ({c['coletado']/n:6.2%})")
    print(f"  mortos pelos dois ............ {c['ambos']:6d}  ({c['ambos']/n:6.2%})")

    taxa, origem = taxa_salvamento()
    print()
    print(f"taxa salvamento/candidatos .... {taxa:.2%}  [{origem}]")

    hist = historico_aceitacao()
    if hist:
        print()
        print("HISTORICO medido (logs de coleta):")
        for nome, ace, tent, tx in hist:
            print(f"  {nome:24s} {ace:6d}/{tent:<6d} = {tx:6.2%}")
    print()
    print(f"PROJECAO para --limite {args.limite} (p = {p:.2%}):")
    reserva = max(args.limite * 3, args.limite + 20)
    teto = args.limite * 400 + 4000
    tent = reserva / p if p else float("inf")
    print(f"  reserva do coletor .......... {reserva:6d} candidatos")
    print(f"  tentativas necessarias ...... {tent:6.0f}")
    print(f"  teto do coletor ............. {teto:6d} (margem {teto/tent if tent else 0:5.1f}x)")
    candidatos = args.salvos / taxa if taxa else float("inf")
    tent2 = candidatos / p if p else float("inf")
    margem = (teto / tent2) if tent2 else 0.0
    print()
    print(f"PROJECAO para {args.salvos} negativos salvos:")
    print(f"  candidatos necessarios ...... {candidatos:6.0f}")
    print(f"  tentativas necessarias ...... {tent2:6.0f}")
    print(f"  teto do coletor ............. {teto:6d} (margem {margem:5.1f}x)")
    print()
    # A leitura olha a MARGEM sobre o teto, nao a taxa isolada: taxa de 34%
    # ainda vale se o teto cobre a conta 45x (medido 11/10).
    if margem >= 5:
        print("leitura: filtro serve para o lote - o teto de tentativas cobre")
        print("         a conta com folga; nada de diluir exclusao por conta disso.")
    elif margem >= 1.5:
        print("leitura: folga apertada - revisar MARGEM_EXCLUSAO ou a celula de")
        print("         ja coletados antes de subir --limite.")
    else:
        print("leitura: esgotado - diluir exclusao ANTES de subir --limite.")
    if len(hist) >= 2 and p < hist[-1][3] - 0.05:
        print(f"tendencia: taxa caiu de {hist[-1][3]:.2%} ({hist[-1][0]}) para")
        print(f"           {p:.2%} hoje - queda paga por janela ja coletada,")
        print("           nao por exclusao (ver decomposicao acima).")
    return 0


if __name__ == "__main__":
    sys.exit(principal())
