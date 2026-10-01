# -*- coding: utf-8 -*-
"""Gera recortes COLORIDOS a 2 m (pan-sharpen) para o treino v6 das cavas.

Papel no portal: insumo de calibração do detector de cavas de mineração
(Fase 1 do PLANO-GLOBO-CAVAS-MINERACAO.md). Os recortes do treino v4/v5
ficam a ~8,4 m/px (BAND3/2/1) e nessa escala arado e cava se confundem
(medido 01/10: v4 fora de distribuição na PAN crua; qwen3-vl deu "75"
constante em 15/16). A BAND0 (pancromática) da MESMA cena CBERS-4A/WPM
tem 2 m — este script funde PAN 2 m com RGB 8 m (Brovey) e grava
JPEG 512x512 (~1,02 km de lado) em:

    scripts/.cache/cavas-calibracao-2m/recortes/{tipo}/{arquivo}

com checkpoint.jsonl (cópia das linhas corrigidas da revisão humana) no
mesmo diretório, pronto para o treinar-cavas-chinese-clip.py --dados.

Fonte dos dados: INPE/BDC STAC (https://data.inpe.br/bdc/stac/v1),
CBERS-4A WPM L2, licença CC-BY 4.0 — atribuição ao INPE. Acesso por
janela HTTP (range), nunca cena inteira (BAND0 = 2,45 GB).

Decisões técnicas:
- Footprint de 1,02 km (512 px a 2 m) em vez dos 4,3 km dos recortes 8 m:
  o ganho pedido é detalhe, não área. O pixel continua 512x512 para o
  custo de treino não mudar (mesmo ViT, mesma VRAM).
- Brovey com ganho travado em [0,25; 4] para o realce não estourar onde
  o PAN e o RGB divergem (água, sombra).
- Nuvem NÃO é remedida: o detector de nuvem foi calibrado para RGB 8 m;
  o valor do checkpoint original (mesma cena, mesma data) é reaproveitado
  e o treino aplica --nuvem-max como sempre.
- Retomável: pula arquivo já existente; progresso em progresso-2m.jsonl.
  Recorte nunca entra no git (cache, AGENTS § 5.2 / plano § 7).
- Itens ordenados por cena para reaproveitar os handles abertos (cap 9,
  mesmo padrão do coletar-cavas-calibracao.py).

Uso:
    python scripts/etl/cavas/gerar-recortes-2m.py --limite 20   # piloto
    python scripts/etl/cavas/gerar-recortes-2m.py               # tudo
"""
from __future__ import annotations

import json
import math
import os
import sys
import time
import urllib.request
from pathlib import Path

import numpy as np

sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # console cp1252

RAIZ = Path(r"X:\DevCoder\OpenCode\controle-popular")
CACHE_ORIGEM = RAIZ / "scripts/.cache/cavas-calibracao"
SAIDA = RAIZ / "scripts/.cache/cavas-calibracao-2m"
STAC = "https://data.inpe.br/bdc/stac/v1/search"
UA = "ControlePopular/1.0 (+controlepopular.com.br; transparencia)"
# R, G, B. Medido em 01/10 contra a miniatura oficial do INPE (cena
# 205_134): BAND1 = VERDE e BAND2 = AZUL no L2 do WPM — o contrário do
# que o coletar-cavas-calibracao.py assumiu (por isso a vegetação saía
# teal no acervo 8 m). Sobre vegetação o DN medido é B3 < B2 < B1;
# com G=B1 o verde domina, como manda a física e como mostra a miniatura.
BANDAS_RGB = ("BAND3", "BAND1", "BAND2")
PAN = "BAND0"

TAM = 512            # px de saída
MEIO_M = 512         # meia-janela em metros -> 1.024 m de lado a 2 m/px
GANHO_MIN, GANHO_MAX = 0.5, 2.0  # trava do Brovey (após casar radiometria)
QUALIDADE_JPEG = 85  # mesma do acervo 8 m (M5)
CAP_HANDLES = 9      # datasets rasterio abertos ao mesmo tempo

_ENV = {"GDAL_DISABLE_READDIR_ON_OPEN": "EMPTY_DIR",
        "CPL_VSIL_CURL_ALLOWED_EXTENSIONS": ".tif",
        "GDAL_HTTP_HEADERS": f"User-Agent={UA}",
        "GDAL_HTTP_TIMEOUT": "120"}


def _abrir(href: str):
    """Abre (e cacheia) um GTiff remoto; evoca o padrão do coletor 8 m."""
    import rasterio

    ds = _HANDLES.get(href)
    if ds is None:
        ctx = rasterio.Env(**_ENV)
        ctx.__enter__()
        ds = rasterio.open(href)
        ds._env_ctx = ctx
        _HANDLES[href] = ds
        while len(_HANDLES) > CAP_HANDLES:
            antigo = next(iter(_HANDLES))
            ant_ds = _HANDLES.pop(antigo)
            try:
                ant_ds.close()
                ctx = getattr(ant_ds, "_env_ctx", None)
                if ctx:
                    ctx.__exit__(None, None, None)
            except Exception:
                pass
    return ds


_HANDLES: dict = {}


def _ler_janela(ds, cx: float, cy: float, out_shape: tuple | None):
    """Lê a janela de 1.024 m centrada em (cx, cy); None se fora da cena."""
    from rasterio.windows import from_bounds
    from rasterio.warp import transform_bounds

    dlat = MEIO_M / 111320.0
    dlon = MEIO_M / (111320.0 * math.cos(math.radians(cy)))
    sub = (cx - dlon, cy - dlat, cx + dlon, cy + dlat)
    tb = transform_bounds("EPSG:4326", ds.crs, *sub)
    w = from_bounds(*tb, transform=ds.transform)
    if w.width <= 0 or w.height <= 0:
        return None
    if out_shape is None:
        return ds.read(1, window=w)
    return ds.read(1, window=w, out_shape=out_shape)


def _stretchar(a: np.ndarray, lo: float, hi: float) -> np.ndarray:
    span = max(hi - lo, 1.0)
    return np.clip((a - lo) / span, 0.0, 1.0)


def fundir(pan: np.ndarray, rgb: list[np.ndarray]) -> np.ndarray:
    """Brovey com radiometria casada: cada canal ganha o detalhe do PAN.

    Por que Brovey e não HSV/IHS: uma divisão por elemento, sem transformada
    de cor — barato o bastante para ~5 mil recortes na CPU e visualmente
    estável quando o ganho é travado.

    Por que casar a mediana antes: medido em 01/10 na cena 205_134, o PAN
    do L2 do WPM chega ~1,5x mais brilhante que a média RGB (DN mediano
    289 contra ~172). Sem esse casamento o ganho global clareia tudo e
    dessatura nuvem e solo; com ele, o ganho fica centrado em 1 e só carrega
    o detalhe local.
    """
    r, g, b = (c.astype(np.float32) for c in rgb)
    lo, hi = np.percentile(np.concatenate([c.ravel() for c in (r, g, b)]),
                           (2, 98))
    media_dn = (r + g + b) / 3.0
    escala = float(np.median(media_dn)) / max(float(np.median(pan)), 1.0)
    pan_norm = pan.astype(np.float32) * escala
    ganho = np.clip(pan_norm / np.maximum(media_dn, 1e-3),
                    GANHO_MIN, GANHO_MAX)
    rgb01 = [_stretchar(c, lo, hi) for c in (r, g, b)]
    saida = np.stack([np.clip(c * ganho * 255.0, 0, 255) for c in rgb01],
                     axis=-1)
    return saida.astype(np.uint8)


def hrefs_da_cena(cena: str) -> dict | None:
    """STAC por id -> hrefs de BAND0 e BAND3/2/1; cacheado em RAM e disco."""
    if cena in _HREFS:
        return _HREFS[cena]
    corpo = json.dumps({"ids": [cena]}).encode()
    pedido = urllib.request.Request(
        STAC, data=corpo, method="POST",
        headers={"User-Agent": UA, "Content-Type": "application/json"})
    with urllib.request.urlopen(pedido, timeout=120) as resp:
        feats = json.loads(resp.read()).get("features", [])
    if not feats:
        return None
    assets = feats[0].get("assets", {})
    hrefs = {k: a["href"] for k, a in assets.items() if k == PAN or k in BANDAS_RGB}
    if PAN not in hrefs or any(b not in hrefs for b in BANDAS_RGB):
        return None
    _HREFS[cena] = hrefs
    return hrefs


_HREFS: dict = {}


def main() -> int:
    import argparse
    from PIL import Image

    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--limite", type=int, default=0,
                    help="gera no máximo N recortes nesta rodada (0 = todos)")
    ap.add_argument("--so-tipo", choices=("positivo", "negativo"),
                    help="restringe a um tipo (piloto mais rápido)")
    args = ap.parse_args()

    ckp_origem = CACHE_ORIGEM / "checkpoint.jsonl"
    itens = [json.loads(l) for l in ckp_origem.open(encoding="utf-8")
             if l.strip()]
    if args.so_tipo:
        itens = [i for i in itens if i["tipo"] == args.so_tipo]
    itens.sort(key=lambda i: (i["cena"], i["arquivo"]))  # cache de cenas

    SAIDA.mkdir(parents=True, exist_ok=True)
    (SAIDA / "recortes").mkdir(exist_ok=True)
    # checkpoint congelado no diretório novo: o treino lê daqui, com os
    # rótulos já corrigidos pela revisão humana (9 flips de 01/10).
    ckp_destino = SAIDA / "checkpoint.jsonl"
    if not ckp_destino.exists():
        ckp_destino.write_text(
            "".join(json.dumps(i, ensure_ascii=False) + "\n"
                    for i in [json.loads(l) for l in
                              ckp_origem.open(encoding="utf-8") if l.strip()]),
            encoding="utf-8")

    prog = SAIDA / "progresso-2m.jsonl"
    feitos_hash = set()
    if prog.exists():
        # só "ok" conta como feito: erro é tentado de novo na próxima rodada
        feitos_hash = {json.loads(l)["hash"]
                       for l in prog.open(encoding="utf-8")
                       if l.strip()
                       and json.loads(l).get("status") == "ok"}

    pendentes = [i for i in itens if i["hash"] not in feitos_hash]
    if args.limite:
        pendentes = pendentes[: args.limite]
    print(f"pendentes nesta rodada: {len(pendentes)} "
          f"(de {len(itens)} do checkpoint)")

    ok = erros = 0
    import rasterio  # noqa: F401  (garante o import cedo, falha rápida)

    t0 = time.time()
    cena_atual = None
    for n, it in enumerate(pendentes, 1):
        alvo = SAIDA / "recortes" / it["tipo"] / it["arquivo"]
        if alvo.exists():  # retomável: arquivo pronto vale por progresso
            ok += 1
            continue
        try:
            if it["cena"] != cena_atual:  # pausa de cortesia por cena (STAC)
                cena_atual = it["cena"]
                time.sleep(1.0)
            hrefs = hrefs_da_cena(it["cena"])
            if hrefs is None:
                raise RuntimeError("cena sem BAND0 ou RGB no STAC")
            lon = (it["bbox"][0] + it["bbox"][2]) / 2
            lat = (it["bbox"][1] + it["bbox"][3]) / 2
            ds_pan = _abrir(hrefs[PAN])
            pan = _ler_janela(ds_pan, lon, lat, out_shape=(TAM, TAM))
            if pan is None:
                raise RuntimeError("janela fora da cena")
            frac_zero = float(np.mean(pan == 0))
            if frac_zero > 0.30:
                raise RuntimeError(f"PAN vazia ({frac_zero:.0%} de pixels 0)")
            canais = []
            for b in BANDAS_RGB:
                ds_b = _abrir(hrefs[b])
                arr = _ler_janela(ds_b, lon, lat, out_shape=None)
                if arr is None:
                    raise RuntimeError(f"janela {b} fora da cena")
                canais.append(np.asarray(
                    Image.fromarray(arr.squeeze()).resize((TAM, TAM),
                                                          Image.BILINEAR)))
            img = fundir(pan, canais)
            alvo.parent.mkdir(parents=True, exist_ok=True)
            Image.fromarray(img).save(alvo, quality=QUALIDADE_JPEG)
            with prog.open("a", encoding="utf-8") as f:
                f.write(json.dumps({"hash": it["hash"], "arquivo": it["arquivo"],
                                    "status": "ok"}, ensure_ascii=False) + "\n")
            ok += 1
        except Exception as e:
            erros += 1
            with prog.open("a", encoding="utf-8") as f:
                f.write(json.dumps({"hash": it["hash"], "arquivo": it["arquivo"],
                                    "status": "erro",
                                    "motivo": f"{type(e).__name__}: {e}"},
                                   ensure_ascii=False) + "\n")
            print(f"  erro {it['arquivo'][:12]}: {e}", flush=True)
        if n % 50 == 0 or n == len(pendentes):
            ritmo = (time.time() - t0) / max(n, 1)
            resta = (len(pendentes) - n) * ritmo / 3600.0
            print(f"  {n}/{len(pendentes)} ok={ok} erro={erros} "
                  f"{ritmo:.1f}s/recorte, resta ~{resta:.1f} h", flush=True)

    print(f"FIM: ok={ok} erro={erros} em {(time.time() - t0) / 60:.1f} min")
    return 0 if erros == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
