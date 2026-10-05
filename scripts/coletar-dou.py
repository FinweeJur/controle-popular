#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""coletar-dou.py — leitura da busca oficial do Diário Oficial da União (DOU).

O QUE FAZ
---------
Le a BUSCA PÚBLICA do Diário Oficial da União (Imprensa Nacional) por uma
lista de termos, pagina os resultados e grava um JSON compacto e auditável
com um ato por linha (órgão, tipo de ato, data, título, resumo e link).

Papel no portal: alimentar a frente de fiscalização (ex.: atos da ANM que
suspendem/interditam lavra) e o radar de atos federais. O DOU é onde o ato
nasce; o SIGMINE/ANM mostra o processo já cadastrado. Um não substitui o
outro — este coletor traz o ATO, não o polígono.

POR QUE ESTE ENDPOINT (medido em 04/10/2026)
--------------------------------------------
- `https://www.in.gov.br/consulta/-/buscar/dou` responde **200 sem chave**
  e devolve o mesmo resultado do buscador oficial (in.gov.br/consulta/).
  Os 20 itens da página vêm embutidos no `<script id=
  "_br_com_seatecnologia_in_buscadou_BuscaDouPortlet_params">` (chave
  `jsonArray`); a contagem total vem no texto "N resultado" do HTML.
- A paginação exige `id` + `displayDate` do ÚLTIMO item da página anterior,
  mais `newPage`/`currentPage` — medido e implementado aqui.
- ⚠️ O caminho `/busca/-/buscar/dou` devolve **403** (foi o medido em
  30/09 e registrado em FONTS.md); o certo é `/consulta/`. Mesma família de
  URL, resultado oposto.

A CHAVE DA API OFICIAL NÃO É NECESSÁRIA AQUI: `api.in.gov.br/dou` (o dump
em massa) exige chave de cadastro humano; esta busca não. Para texto
integral em lote, o caminho é o INLABS (portal próprio, com conta).

ROBOTS.TXT — DECISÃO REGISTRADA (AGENTS §11)
--------------------------------------------
`https://www.in.gov.br/robots.txt` responde `Disallow: /` (medido 04/10).
Ainda assim coletamos, a pedido do dono, com **escopo reduzido** e a
mesma régua do caso `www18.fgv.br` (AGENTS §6): poucos termos exatos,
pausa de 2 s entre páginas, User-Agent honesto, só o que a busca pública
entrega ao navegador, fora da CI. O DOU é ato oficial — a publicação é o
próprio objeto — mas a cortesia com o servidor se mantém.

PRIVACIDADE (AGENTS §5.2)
-------------------------
Todo campo de texto passa por `_apagar_cpf_em_texto`: qualquer run de 11
dígitos (CPF) vira `[CPF redigido]`. CNPJ completo (14 dígitos) é
preservado. `--scan-cpf` roda o varredor oficial sobre a saída.

RESSALVA EDITORIAL (AGENTS §7)
------------------------------.
Estar publicado no DOU é o ato existir, não a culpa estar provada. Processo
administrativo cabe defesa e recurso. A frequência de um termo não mede
gravidade; mede o vocabulário da fonte.

USO
---
    python scripts/coletar-dou.py --dry-run                 # só contagens
    python scripts/coletar-dou.py                            # termos padrão (mineração)
    python scripts/coletar-dou.py --termo "barragem de rejeitos" --dias 60
    python scripts/coletar-dou.py --termo licitação --amplo --secao do3
    python scripts/coletar-dou.py --limit 0 --scan-cpf      # tudo + varredura de CPF

Dependência: só biblioteca padrão do Python 3 (urllib/json/re) — nada de pip.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # console Windows é cp1252

RAIZ = Path(__file__).resolve().parents[1]
BASE = "https://www.in.gov.br/consulta/-/buscar/dou"
WEB = "https://www.in.gov.br/web/dou/-/"
# Nome do <script> que carrega o JSON dos resultados (estrutura Liferay da IN).
SCRIPT_ID = "_br_com_seatecnologia_in_buscadou_BuscaDouPortlet_params"
UA = "ControlePopular/1.0 (+controlepopular.com.br; transparencia; dado publico)"
PAUSA = 2  # s entre páginas (robots Disallow: / → escopo reduzido e cortesia)
POR_PAGINA = 20  # a busca devolve 20 itens por página
SECOES_PADRAO = ("do1", "do3")  # atos normativos e contratos; do2 é pessoal, entra sob demanda
# Termos padrão da frente de mineração. Frases EXATAS (entre aspas) porque a
# busca sem aspas faz OR e devolve ruído; medido em 04/10/2026:
#   "título minerário" 273 | "lavra garimpeira" 76 | "concessão de lavra" 101
#   "direitos minerários" 12 | "suspensão de lavra" 0 (a lacuna fica visível)
TERMOS_PADRAO = [
    "título minerário",
    "lavra garimpeira",
    "concessão de lavra",
    "suspensão de lavra",
    "direitos minerários",
]
RESUMO_MAX = 800  # caracteres do conteúdo guardados por ato (íntegra fica no link)
PAGINAS_MAX_PADRAO = 20  # teto por termo (20 × 20 = 400 atos/termo)
SAIDA = RAIZ / "apps" / "web" / "data" / "dou-mineracao.json"
CACHE = RAIZ / "scripts" / ".cache" / "dou"

FONTES = {
    "busca": BASE,
    "visualizador": WEB,
    "robots": "https://www.in.gov.br/robots.txt",
    "inlabs": "https://inlabs.in.gov.br/",
}


# ---------------------------------------------------------------------------
# HTTP
# ---------------------------------------------------------------------------

def _get(url: str, timeout: int = 60) -> str:
    """GET com UA honesto; 403/429 espera e re-tenta uma vez.

    A busca do DOU não usa chave, mas o host aplica WAF: uma rajada curta
    pode devolver 403/429. Repetir depois de esperar evita perder a rodada;
    se falhar de novo, abortamos claro (nunca gravamos dado parcial como bom).
    """
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Cache-Control": "no-cache",
    })
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        if e.code in (403, 429):
            print(f"  [!] HTTP {e.code} — esperando 30 s e re-tentando...")
            time.sleep(30)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read().decode("utf-8", errors="replace")
        raise


# ---------------------------------------------------------------------------
# Sanitização de dado pessoal (mesmo padrão dos coletores IGAM/IBAMA/INEMA)
# ---------------------------------------------------------------------------

RE_11D = re.compile(r"\d[\d.\-/]{7,}\d")


def _apagar_cpf_em_texto(texto: str) -> str:
    """Apaga runs de 11 dígitos (CPF); preserva CNPJ de 14 dígitos."""
    def _apagar(m: "re.Match[str]") -> str:
        dig = re.sub(r"\D", "", m.group(0))
        if len(dig) == 14:
            return m.group(0)
        if len(dig) == 11:
            return "[CPF redigido]"
        return m.group(0)
    return RE_11D.sub(_apagar, texto)


def _limpar_html(s: str) -> str:
    """Tira as tags do trecho destacado pela busca (<span class='highlight'>)."""
    return re.sub(r"\s+", " ", re.sub(r"<.*?>", "", s or "")).strip()


# ---------------------------------------------------------------------------
# Parse da página de resultado
# ---------------------------------------------------------------------------

RE_TOTAL = re.compile(r"([\d\.]+)\s+resultado")


def _montar_url(termo: str, exato: bool, de: date, ate: date,
                secoes: tuple, pagina_ctx: dict | None = None) -> str:
    """Monta a URL da busca. `pagina_ctx` acrescenta os campos de paginação."""
    q = f'"{termo}"' if exato else termo
    params = [
        ("q", q),
        ("exactDate", "personalizado"),
        ("publishFrom", de.strftime("%d-%m-%Y")),
        ("publishTo", ate.strftime("%d-%m-%Y")),
        ("sortType", "0"),
    ]
    for s in secoes:
        params.append(("s", s))
    if pagina_ctx:
        params += [
            ("id", str(pagina_ctx["id"])),
            ("displayDate", str(pagina_ctx["displayDate"])),
            ("newPage", str(pagina_ctx["newPage"])),
            ("currentPage", str(pagina_ctx["currentPage"])),
        ]
    return BASE + "?" + urllib.parse.urlencode(params)


def _extrair_json(html: str) -> list:
    """Devolve a lista `jsonArray` do <script> embutido (ou [] se não houver)."""
    m = re.search(
        r'<script[^>]*id="' + re.escape(SCRIPT_ID) + r'"[^>]*>(.*?)</script>',
        html, re.S)
    if not m:
        return []
    try:
        return json.loads(m.group(1).strip()).get("jsonArray") or []
    except json.JSONDecodeError:
        return []


def _total_resultados(html: str) -> int | None:
    """Lê o "N resultado" (total real da fonte) do HTML — base do relatório."""
    m = RE_TOTAL.search(html)
    if not m:
        return None
    return int(m.group(1).replace(".", ""))


def _item_para_linha(it: dict, termo: str) -> dict:
    """Converte um item do jsonArray na linha publicável (campos estáveis)."""
    hierarquia = it.get("hierarchyStr") or ""
    orgao = hierarquia.split("/")[-1].strip() if hierarquia else None
    linha = {
        "termo": termo,
        "secao": it.get("pubName"),
        "orgao": orgao,
        "hierarquia": hierarquia or None,
        "tipo": it.get("artType"),
        "titulo": _limpar_html(it.get("title", "")),
        "data": it.get("pubDate"),
        "edicao": it.get("editionNumber"),
        "pagina": it.get("numberPage"),
        "id": it.get("classPK"),
        "url": WEB + str(it.get("urlTitle", "")),
        "resumo": _limpar_html(it.get("content", ""))[:RESUMO_MAX],
    }
    for k, v in list(linha.items()):  # varre TODO campo de texto (AGENTS §5.2)
        if isinstance(v, str):
            linha[k] = _apagar_cpf_em_texto(v)
    return linha


# ---------------------------------------------------------------------------
# Coleta por termo (paginada) + checkpoint por página
# ---------------------------------------------------------------------------

def _cache_pagina(termo: str, pagina: int) -> Path:
    slug = re.sub(r"[^A-Za-z0-9]", "_", termo)[:40]
    return CACHE / f"{slug}__p{pagina:03d}.json"


def _checkpoint() -> dict:
    CACHE.mkdir(parents=True, exist_ok=True)
    arq = CACHE / "checkpoint.json"
    if arq.exists():
        try:
            return json.loads(arq.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"paginas": [], "concluido": False}


def _salvar_checkpoint(ckpt: dict) -> None:
    arq = CACHE / "checkpoint.json"
    ckpt["ata"] = datetime.now(timezone.utc).isoformat()
    tmp = arq.with_suffix(".parcial")
    tmp.write_text(json.dumps(ckpt, ensure_ascii=False), encoding="utf-8")
    tmp.replace(arq)  # Windows: rename atômico precisa do alvo livre


def _coletar_termo(termo: str, exato: bool, de: date, ate: date, secoes: tuple,
                   max_paginas: int, ckpt: dict) -> tuple[list[dict], int | None, int]:
    """Percorre as páginas de um termo. Devolve (linhas, total_fonte, n_paginas).

    Retomável: cada página processada é gravada em cache e marcada no
    checkpoint; uma rodada interrompida continua de onde parou.
    """
    linhas: list[dict] = []
    total: int | None = None
    ctx: dict | None = None
    pagina = 1
    while pagina <= max_paginas:
        chave = f"{re.sub(r'[^A-Za-z0-9]', '_', termo)[:40]}#{pagina}"
        arq = _cache_pagina(termo, pagina)
        if chave in ckpt["paginas"] and arq.exists():
            try:
                # O cache guarda também o contexto da PRÓXIMA página: sem isso,
                # retomar no meio buscaria a página 2 de novo (ctx perdido).
                salvo = json.loads(arq.read_text(encoding="utf-8"))
                linhas.extend(salvo.get("linhas", []))
                ctx = salvo.get("ctx")
                pagina += 1
                continue
            except Exception:
                ckpt["paginas"].discard(chave)

        html = _get(_montar_url(termo, exato, de, ate, secoes, ctx))
        if total is None:
            total = _total_resultados(html)
        itens = _extrair_json(html)
        if not itens:
            break
        pag_linhas = [_item_para_linha(it, termo) for it in itens]
        ctx_prox = None
        if len(itens) >= POR_PAGINA:  # há provavelmente próxima página
            ult = itens[-1]
            ctx_prox = {
                "id": ult.get("classPK"),
                "displayDate": ult.get("displayDateSortable"),
                "newPage": pagina + 1,
                "currentPage": pagina,
            }
        arq.write_text(json.dumps({"linhas": pag_linhas, "ctx": ctx_prox},
                                  ensure_ascii=False), encoding="utf-8")
        if chave not in ckpt["paginas"]:
            ckpt["paginas"].append(chave)
        linhas.extend(pag_linhas)
        _salvar_checkpoint(ckpt)
        print(f"    '{termo}': página {pagina} (+{len(pag_linhas)}, acumulado {len(linhas):,})")

        if ctx_prox is None:  # última página
            break
        ctx = ctx_prox
        pagina += 1
        time.sleep(PAUSA)
    return linhas, total, pagina


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    ap = argparse.ArgumentParser(
        description="Le a busca oficial do DOU e grava JSON por ato.")
    ap.add_argument("--termo", action="append", default=None,
                    help="termo de busca (repetível); padrão: termos de mineração")
    ap.add_argument("--dias", type=int, default=30, help="janela em dias até hoje (padrão 30)")
    ap.add_argument("--de", type=str, default=None, help="data inicial DD-MM-AAAA (sobrepõe --dias)")
    ap.add_argument("--ate", type=str, default=None, help="data final DD-MM-AAAA (padrão hoje)")
    ap.add_argument("--secao", action="append", default=None,
                    help="seção do DOU (do1/do2/do3); padrão do1+do3")
    ap.add_argument("--amplo", action="store_true",
                    help="busca ampla (sem aspas). Padrão é frase exata.")
    ap.add_argument("--max-paginas", type=int, default=PAGINAS_MAX_PADRAO,
                    help="teto de páginas por termo (padrão 20)")
    ap.add_argument("--limit", type=int, default=0, help="trunca linhas no fim (0 = tudo)")
    ap.add_argument("--dry-run", action="store_true", help="só contagens (1 GET por termo)")
    ap.add_argument("--scan-cpf", action="store_true", help="roda o varredor de CPF ao final")
    ap.add_argument("--saida", type=Path, default=SAIDA)
    args = ap.parse_args()

    termos = args.termo or TERMOS_PADRAO
    secoes = tuple(args.secao) if args.secao else SECOES_PADRAO
    ate = datetime.strptime(args.ate, "%d-%m-%Y").date() if args.ate else date.today()
    de = datetime.strptime(args.de, "%d-%m-%Y").date() if args.de else (ate - timedelta(days=args.dias))
    exato = not args.amplo

    print("=== DOU — busca oficial (Imprensa Nacional) ===\n")
    print(f"  fonte  : {BASE}")
    print(f"  janela : {de.strftime('%d-%m-%Y')} a {ate.strftime('%d-%m-%Y')}  | seções: {','.join(secoes)}")
    print(f"  termos : {len(termos)} ({'frase exata' if exato else 'busca ampla'})")
    print(f"  robots : Disallow: / (medido 04/10) — escopo reduzido, pausa {PAUSA}s, UA honesto")
    print(f"  saida  : {args.saida}\n")

    # Sondagem: total por termo (1 GET). Também valida que a fonte responde.
    totais: dict[str, int | None] = {}
    for t in termos:
        try:
            html = _get(_montar_url(t, exato, de, ate, secoes))
        except Exception as e:
            print(f"\n[cancelado] sondagem falhou no termo {t!r}: {e}")
            print("  Nada gravado. Re-rodar quando a fonte responder.")
            sys.exit(2)
        totais[t] = _total_resultados(html)
        print(f"  sondagem: {t!r} -> {totais[t] if totais[t] is not None else '?'} na fonte")
        time.sleep(PAUSA)

    if args.dry_run:
        print("\n  (dry-run: nada além das contagens foi baixado)")
        return

    ckpt = _checkpoint()
    todas: list[dict] = []
    consultas = []
    for t in termos:
        parte, total, n_pag = _coletar_termo(t, exato, de, ate, secoes, args.max_paginas, ckpt)
        todas.extend(parte)
        consultas.append({"termo": t, "total_fonte": total, "paginas": n_pag})
        print(f"  [ok] {t!r}: +{len(parte):,}")

    # dedup por id (o mesmo ato pode casar por mais de um termo)
    vistos: set = set()
    dedup: list[dict] = []
    for r in todas:
        k = r.get("id")
        if k and k in vistos:
            continue
        vistos.add(k)
        dedup.append(r)
    linhas = dedup[: args.limit] if args.limit else dedup
    print(f"\n  total coletado: {len(linhas):,} (após dedup)")

    # agregados simples para os cartões de topo (números medidos, não digitados)
    def _contar(campo: str) -> dict:
        c: dict[str, int] = {}
        for r in linhas:
            k = r.get(campo) or "(não informado)"
            c[k] = c.get(k, 0) + 1
        return dict(sorted(c.items(), key=lambda kv: -kv[1]))

    def _mes(r: dict) -> str:
        d = (r.get("data") or "").strip()
        return d[3:] if len(d) >= 10 else "(sem data)"

    resumo_mes: dict[str, int] = {}
    for r in linhas:
        resumo_mes[_mes(r)] = resumo_mes.get(_mes(r), 0) + 1

    dados = {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "fonte": BASE,
        "fontes": FONTES,
        "robots_decisao": ("robots.txt Disallow: / (medido 04/10/2026). Coleta a pedido "
                           "do dono com escopo reduzido: poucos termos exatos, pausa "
                           f"{PAUSA}s, UA honesto, fora da CI."),
        "metodo": "frase exata" if exato else "busca ampla (OR)",
        "periodo": {"de": de.strftime("%d-%m-%Y"), "ate": ate.strftime("%d-%m-%Y")},
        "secoes": list(secoes),
        "consultas": consultas,
        "total_fonte": sum(v for v in totais.values() if v) if all(
            v is not None for v in totais.values()) else None,
        "colunas": ["termo", "secao", "orgao", "tipo", "titulo", "data", "edicao",
                    "pagina", "id", "url", "resumo"],
        "obs": ("CPF (11 dígitos) é redigido na origem ([CPF redigido]); CNPJ de 14 "
                "dígitos é preservado. O resumo é um recorte do conteúdo; a íntegra "
                "fica no link oficial."),
        "ressalva_editorial": ("Ato publicado no DOU é o ato existir, não a culpa "
                               "provada. Processo administrativo cabe defesa e recurso. "
                               "A frequência do termo mede o vocabulário da fonte, não a "
                               "gravidade."),
        "resumo_por_tipo": _contar("tipo"),
        "resumo_por_orgao": _contar("orgao"),
        "resumo_por_mes": dict(sorted(resumo_mes.items())),
        "linhas": linhas,
    }

    args.saida.parent.mkdir(parents=True, exist_ok=True)
    args.saida.write_text(
        json.dumps(dados, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    tam_kb = args.saida.stat().st_size / 1024
    print(f"\n[ok] {len(linhas):,} atos -> {args.saida.name} ({tam_kb:,.0f} KB)")

    ckpt["concluido"] = args.limit == 0
    _salvar_checkpoint(ckpt)

    if args.scan_cpf:
        print("\n  rodando o varredor de CPF sobre a saída...")
        r = subprocess.run(
            [sys.executable, "scripts/checar-dado-pessoal-em-dado.py", "--extra", str(args.saida)])
        if r.returncode != 0:
            print("  [!] CPF achado no JSON — redigir campo no coletor.")
            sys.exit(2)
        print("  scan clean.")


if __name__ == "__main__":
    main()
