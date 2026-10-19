# -*- coding: utf-8 -*-
"""Verificador do teto de âncoras — capítulos, sumário e âncora # nas 100
páginas do catálogo (`data/top-100-paginas.json`).

Papel no portal: garante que, ao escolher uma seção no widget de Capítulos
(desktop, pontinho lateral) ou no Sumário do rodapé (celular, âncora `#id`),
o título para ABAIXO das barras `sticky top-0` (header e, nos hubs, a subnav
de chips). A régua é a do achado de 15/10/2026
(`docs/relatorios-automacao/capitulos-rolagem-teto-2026-10-15.md`): o teto
vem de `--cp-chao`, medida pelo `ChaoRolagem`; este script remedir a
aterrissagem em dois visores (1280 e 390) e classifica
PASS / CURTA (menos de 2 headings reais — por design) / OVERSHOOT / UNDERSHOT.

Fonte oficial da lista de rotas: o próprio catálogo curado do portal.
Saida: `resultados.jsonl` + prints em pasta temporária (ver `OUT`).

Varre o top-100 e mede a aterrissagem das seções nos dois caminhos:
- DESKTOP 1280 (widget 'Capítulos' da lateral, scrollIntoView): rola a 600,
  intercepta scrollIntoView para capturar o id, clica o 2o/3o pontinho.
- CELULAR 390 (sumário do rodapé IndicePagina, nascido FECHADO; âncora #
  passa pelo Lenis): rola ao fim, abre o sumário, clica o 2o link.
Mede top do heading vs fundo da navbar sticky. Classifica e printa.
Screenshots: toda falha + amostra de 3 ok por viewport.
Esperado PASS: teto - 4 <= top <= teto + 140 (a tolerância alta cobre o
fundo de documento, onde a física não deixa colar o título no teto).
"""
import sys, json, os, time
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3199"
OUT = r"C:\Users\Home\AppData\Local\Temp\opencode\prints-capitulos"
os.makedirs(OUT, exist_ok=True)

rotas = json.load(open(r"C:\DevCoder\controle-popular\apps\web\data\top-100-paginas.json", encoding="utf-8-sig"))

JS_ARMO = "() => { window.__alvoId=null; const o=Element.prototype.scrollIntoView; Element.prototype.scrollIntoView=function(...a){window.__alvoId=this.id;return o.apply(this,a);}; }"

JS_MEDE = """(id) => {
  const h = document.getElementById(id);
  if (!h) return {erro: 'sem-id'};
  const nf = Math.max(0, ...[...document.querySelectorAll('body *')]
    .filter(e => { const s = getComputedStyle(e); return s.position === 'sticky' && e.getBoundingClientRect().top <= 2 && e.offsetHeight > 10 && e.offsetHeight < 320; })
    .map(e => e.getBoundingClientRect().bottom));
  return {top: Math.round(h.getBoundingClientRect().top), nf: Math.round(nf)};
}"""

def classify(m):
    if m is None or "erro" in m: return "NO-ALVO"
    ok = m["nf"] - 4 <= m["top"] <= m["nf"] + 140
    if m["top"] < m["nf"] - 4: return "OVERSHOOT"
    if not ok: return "UNDERSHOT"
    return "PASS"

def espera_estavel(pg, alvo):
    ultimo, estaveis = None, 0
    for _ in range(10):
        m = pg.evaluate(JS_MEDE, alvo)
        if m and "top" in m and m["top"] == ultimo:
            estaveis += 1
            if estaveis >= 2: return m
        else:
            estaveis = 0
        ultimo = m["top"] if m and "top" in m else None
        pg.wait_for_timeout(250)
    return m

JS_FILTRO = """() => [...document.querySelectorAll('main h2, main h3')]
  .filter(h => !h.closest("[data-ignorar-indice]") && !h.closest("[aria-label='Sumário desta página']") && (h.textContent||'').trim()).length"""

resultados = []
prints_ok = {"desktop": 0, "celular": 0}
FX = open(os.path.join(OUT, "resultados.jsonl"), "w", encoding="utf-8")

def grava(entry):
    resultados.append(entry)
    FX.write(json.dumps(entry, ensure_ascii=False) + "\n")
    FX.flush()

def shot(pg, rota, modo, tag):
    nome = rota["href"].strip("/").replace("/", "_")[:44]
    p = os.path.join(OUT, f"{modo}-{nome}-{tag}.png")
    try: pg.screenshot(path=p)
    except Exception: pass
    return p

with sync_playwright() as pw:
    br = pw.chromium.launch()
    for rota in rotas:
        href = rota["href"]
        for modo, vp in [("desktop", {"width": 1280, "height": 900}), ("celular", {"width": 390, "height": 844})]:
            ctx = br.new_context(viewport=vp)
            pg = ctx.new_page()
            alvo = None
            try:
                pg.goto(BASE + href, wait_until="domcontentloaded", timeout=20000)
                pg.wait_for_timeout(1400)
                if modo == "desktop":
                    pg.evaluate("window.scrollTo(0, 600)")
                    pg.wait_for_timeout(500)
                    btns = pg.locator('nav[aria-label="Navegação rápida por seções"] ol button')
                    n = btns.count()
                    if n < 2:
                        nfiltro = pg.evaluate(JS_FILTRO)
                        r = "CURTA" if nfiltro < 2 else "SEM-WIDGET"
                        grava({"h": href, "m": modo, "r": r, "eixo": rota.get("eixo"), "sub": rota.get("subfrente")})
                        continue
                    pg.evaluate(JS_ARMO)
                    btns.nth(min(1, n - 1)).click()
                    pg.wait_for_timeout(1200)
                    alvo = pg.evaluate("window.__alvoId")
                else:
                    pg.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    pg.wait_for_timeout(700)
                    nav = pg.locator('nav[aria-label="Sumário desta página"]')
                    links = pg.locator('nav[aria-label="Sumário desta página"] a[href^="#"]')
                    if links.count() == 0 and nav.count() > 0:
                        nav.locator("button").first.dispatch_event("click")
                        pg.wait_for_timeout(350)
                    n = links.count()
                    if n < 2:
                        nfiltro = pg.evaluate(JS_FILTRO)
                        r = "CURTA" if nfiltro < 2 else "SEM-SUMARIO"
                        grava({"h": href, "m": modo, "r": r, "eixo": rota.get("eixo"), "sub": rota.get("subfrente")})
                        continue
                    alvo = links.nth(min(1, n - 1)).get_attribute("href").lstrip("#")
                    links.nth(min(1, n - 1)).dispatch_event("click")
                    pg.wait_for_timeout(1000)
                med = espera_estavel(pg, alvo or "")
                cls = classify(med)
                entry = {"h": href, "m": modo, "r": cls, "eixo": rota.get("eixo"), "sub": rota.get("subfrente"),
                         "alvo": alvo, "top": (med or {}).get("top"), "nf": (med or {}).get("nf")}
                if cls not in ("PASS",):
                    entry["shot"] = shot(pg, rota, modo, "falha")
                elif prints_ok[modo] < 3:
                    prints_ok[modo] += 1
                    entry["shot"] = shot(pg, rota, modo, "ok")
                grava(entry)
            except Exception as e:
                grava({"h": href, "m": modo, "r": "ERRO", "det": str(e)[:110]})
            finally:
                pg.close(); ctx.close()

    FX.close()
    br.close()

from collections import Counter
print("=== RESUMO ===")
for modo in ("desktop", "celular"):
    c = Counter(r["r"] for r in resultados if r["m"] == modo)
    print(modo.upper(), dict(c))
print("\n=== FALHAS (não-PASS, não-CURTA) ===")
for r in resultados:
    if r["r"] not in ("PASS", "CURTA"):
        print(json.dumps(r, ensure_ascii=False))
