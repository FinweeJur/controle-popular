#!/usr/bin/env python3
"""
Coletor do Portal da Auditoria Socioambiental (AJRI / Brumadinho)
https://portal.auditoriasocioambiental.com.br

Uso academico / interesse publico, nao comercial.
Requer sessao autenticada: exporte o cookie de sessao do seu navegador.

  export AJRI_COOKIE='_portal_session=...; outro=...'
  python3 coletor_auditoria.py catalogo          # so metadados -> catalogo.json/.csv
  python3 coletor_auditoria.py pdfs              # baixa os PDFs (retomavel)
  python3 coletor_auditoria.py sync              # catalogo + apenas PDFs novos

Dependencias: pip install requests beautifulsoup4
"""

import os, re, csv, json, sys, time, hashlib, pathlib
import requests
from bs4 import BeautifulSoup

BASE = "https://portal.auditoriasocioambiental.com.br"
OUT = pathlib.Path("dados_ajri")
PDFS = OUT / "pdfs"
DELAY = 2.0          # segundos entre requisicoes (seja educado com o servidor)
TIMEOUT = 180        # o PDF e gerado sob demanda com marca d'agua -> lento
RETRIES = 4

COOKIE = os.environ.get("AJRI_COOKIE", "")
if not COOKIE:
    sys.exit("Defina AJRI_COOKIE com o cookie de sessao do portal.")

S = requests.Session()
S.headers.update({
    "Cookie": COOKIE,
    "User-Agent": "PesquisaAcademica/1.0 (coleta nao-comercial; contato: SEU-EMAIL)",
    "Accept-Language": "pt-BR",
})

LEGAL_INSTRUMENTS = {
    7: "Acoes Emergenciais", 13: "Acordo de Reparacao", 48: "Aguas e Seguranca Hidrica",
    49: "Estudo da Producao Agropecuaria", 8: "Estudo de Risco", 9: "Monitoramento",
    47: "Seguranca das Estruturas",
}
TYPES = {41: "Nota Tecnica", 7: "Relatorio"}
AUTHORS = {7: "AECOM"}


def get(url, **kw):
    for i in range(RETRIES):
        try:
            r = S.get(url, timeout=kw.pop("timeout", TIMEOUT), **kw)
            if r.status_code == 200:
                return r
            if r.status_code in (401, 403):
                sys.exit("Sessao expirada. Atualize AJRI_COOKIE.")
            print(f"  HTTP {r.status_code} em {url}")
        except requests.RequestException as e:
            print(f"  erro: {e}")
        time.sleep(DELAY * (2 ** i))
    return None


def listar(params=None, per_page=100):
    """Percorre a paginacao de /documents e devolve as linhas da tabela."""
    params = dict(params or {})
    params["per_page"] = per_page
    rows, page, total = [], 1, None
    while True:
        params["page"] = page
        r = get(f"{BASE}/documents", params=params)
        if not r:
            break
        soup = BeautifulSoup(r.text, "html.parser")
        if total is None:
            m = re.search(r"Total\s+(\d+)", soup.get_text(" "))
            total = int(m.group(1)) if m else 0
        for tr in soup.select("tr"):
            a = tr.select_one('a[href*="download_cover"]')
            if not a:
                continue
            cells = [td.get_text(" ", strip=True) for td in tr.find_all("td")]
            rows.append((a["href"].split("/")[2], cells))
        if page * per_page >= total:
            break
        page += 1
        time.sleep(DELAY)
    return rows, total


def facetas():
    """Descobre temas (ids/labels) a partir dos checkboxes do formulario."""
    r = get(f"{BASE}/documents")
    soup = BeautifulSoup(r.text, "html.parser")
    temas = {}
    for inp in soup.select('input[name="themes[]"]'):
        lbl = inp.find_parent("label") or soup.find("label", {"for": inp.get("id")})
        temas[inp["value"]] = lbl.get_text(" ", strip=True) if lbl else inp["value"]
    return temas


def catalogo():
    OUT.mkdir(exist_ok=True)
    print("Coletando temas por documento...")
    temas = facetas()
    mapa = {}
    for tid, label in temas.items():
        ids, _ = listar({"themes[]": tid})
        for did, _c in ids:
            mapa.setdefault(did, {"temas": [], "tipo": ""})["temas"].append(label)
        print(f"  tema {label}: {len(ids)}")
        time.sleep(DELAY)
    for tid, label in TYPES.items():
        ids, _ = listar({"types[]": tid})
        for did, _c in ids:
            mapa.setdefault(did, {"temas": [], "tipo": ""})["tipo"] = label
        time.sleep(DELAY)

    print("Coletando lista principal...")
    rows, total = listar()
    cat = []
    for did, c in rows:
        raw = c[2] if len(c) > 2 else ""
        i = raw.find("Descricao:") if "Descricao:" in raw else raw.find("Descrição:")
        codigo = (raw[:i] if i >= 0 else raw).strip()
        desc = raw[i + 10:].strip() if i >= 0 else ""
        p = codigo.split("-")
        d = (c[4] if len(c) > 4 else "").split("/")
        f = mapa.get(did, {"temas": [], "tipo": ""})
        cat.append({
            "id": int(did),
            "codigo": codigo,
            "descricao": desc,
            "instrumento_juridico": c[1] if len(c) > 1 else "",
            "temas": f["temas"],
            "tipo": f["tipo"],
            "autor": c[3] if len(c) > 3 else "",
            "data": f"{d[2]}-{d[1]}-{d[0]}" if len(d) == 3 else "",
            "projeto": p[0] if len(p) > 0 else "",
            "originador": p[1] if len(p) > 1 else "",
            "disciplina": p[3] if len(p) > 3 else "",
            "sequencial": p[6] if len(p) > 6 else "",
            "ano": p[7] if len(p) > 7 else "",
            "fonte_oficial": f"{BASE}/documents",
            "url_download": f"{BASE}/documents/{did}/download_cover",
            "licenca": "Conteudo de propriedade da AECOM (auditora). Ver /termos-de-uso.",
        })
    cat.sort(key=lambda x: x["data"], reverse=True)

    (OUT / "catalogo.json").write_text(json.dumps(cat, ensure_ascii=False, indent=2), encoding="utf-8")
    cols = list(cat[0].keys())
    with open(OUT / "catalogo.csv", "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=cols)
        w.writeheader()
        for r in cat:
            w.writerow({k: ("; ".join(v) if isinstance(v, list) else v) for k, v in r.items()})
    print(f"OK: {len(cat)} documentos (esperado {total}) -> {OUT}/catalogo.json|.csv")
    return cat


def baixar_pdfs(cat=None):
    PDFS.mkdir(parents=True, exist_ok=True)
    cat = cat or json.loads((OUT / "catalogo.json").read_text(encoding="utf-8"))
    manifest_path = OUT / "manifest.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}

    for n, doc in enumerate(cat, 1):
        did = str(doc["id"])
        nome = re.sub(r"[^A-Za-z0-9._-]", "_", f'{doc["data"]}_{doc["codigo"]}_{did}.pdf')
        destino = PDFS / nome
        if did in manifest and destino.exists():
            continue
        print(f"[{n}/{len(cat)}] {nome}")
        r = get(doc["url_download"], stream=True)
        if not r:
            print("  FALHOU"); continue
        blob = r.content
        if not blob.startswith(b"%PDF"):
            print("  resposta nao e PDF, pulando"); continue
        destino.write_bytes(blob)
        manifest[did] = {
            "arquivo": nome,
            "bytes": len(blob),
            "sha256": hashlib.sha256(blob).hexdigest(),
            "baixado_em": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        }
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
        time.sleep(DELAY)
    print(f"OK: {len(manifest)} PDFs em {PDFS}")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "catalogo"
    if cmd == "catalogo":
        catalogo()
    elif cmd == "pdfs":
        baixar_pdfs()
    elif cmd == "sync":
        baixar_pdfs(catalogo())
    else:
        sys.exit(__doc__)
