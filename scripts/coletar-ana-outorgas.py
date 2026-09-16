"""coletar-ana-outorgas.py — outorgas de uso da água da ANA (dadosabertos.ana.gov.br).

Baixa as outorgas (federais e estaduais, superficial e subterrânea) dos
serviços ESRI REST do SNIRH e grava JSON compacto em
apps/web/data/ana-outorgas.json.

Rodar:
    python scripts/coletar-ana-outorgas.py --dry-run   # só mostra endpoints e contagens
    python scripts/coletar-ana-outorgas.py             # coleta truncada ao limite
    python scripts/coletar-ana-outorgas.py --limit 0   # sem truncar
    python scripts/coletar-ana-outorgas.py --scan-cpf  # roda o varredor de CPF ao final

## Fonte e licença

- Portal Hub: https://dadosabertos.ana.gov.br (ArcGIS Hub, NÃO é CKAN —
  GET /api/3/action/package_search responde 404; a listagem de dataset é
  /api/search/v1/collections/dataset/items?limit=N)
- Dados: ESRI REST no host portal1.snirh.gov.br (sondado ao vivo em 2026-09-16).
- Licença: dado público governamental, atribuição à fonte ANA.

## Datasets (contagens medidas hoje com returnCountOnly=true)

1. fed_superficial : .../DADOSABERTOS/outorgas_federais_superficial/MapServer/4   (max 2000,   count 57.298)
2. est_superficial : .../DADOSABERTOS/outorgas_estaduais_superficial/MapServer/0  (max 500000, count 444.299)
3. est_subterranea : .../Hosted/outorgas_estaduais_subterraneas/FeatureServer/0   (max 2000,   count 249.727)

Não existe dataset separado de "Interferências": os conjuntos já são
por-interferência (campos int_*). Paginação:
/query?where=1%3D1&outFields=...&outSR=4326&resultRecordCount=MAX&resultOffset=N&f=json
— o maxRecordCount real é lido do f=pjson da layer antes de paginar.

## Decisão robots.txt (consultado em 2026-09-16)

- https://dadosabertos.ana.gov.br/robots.txt: Crawl-Delay 60; Disallow
  /sites/, /admin/, /sessions/, /groups/, /people/, /workspace/. A API de
  busca do Hub não está proibida.
- A paginação REST em portal1.snirh.gov.br NÃO é coberta por esse robots;
  o robots do portal1 responde 404 (sem restrição registrada).
- DECISÃO: 1 única GET ao Hub listando os datasets (respeitando o
  Crawl-Delay de 60s ANTES da primeira chamada REST), paginação REST com
  pausa de 2s entre páginas no host de dados, UA honesto idem IBAMA.

## Privacidade (emp_nu_cpfcnpj)

O campo emp_nu_cpfcnpj tem length 60000 na fonte — é concatenado quando o
empreendimento tem múltiplos titulares. Amostra mostra CNPJs ok e CPF
parcialmente mascarado tipo ***.587.111-**. Regra:
- separa por ';' e mantém SÓ CNPJ (14 dígitos, com ou sem pontuação);
- qualquer token com 11 dígitos (CPF, mesmo mascarado parcialmente) resulta
  em remoção; se não sobrar CNPJ, o campo vai null;
- emp (empreendimento) e titular (responsável) passam por
  _sanitizar_doc_em_nome, idem coletor IBAMA (remove CPF de texto livre).
`--scan-cpf` roda o varredor oficial ao final.

## Campos mínimos (outFields exatos, alias curtos p/ compactação)

out_nu_processo proc | out_nu_ato ato | tdm_ds dominio | tpo_ds tipo_outorga |
tin_ds uso | tsu_ds tp_agua | int_nm_corpohidrico curso | ing_nm_municipio mun |
ing_sg_ufmunicipio uf | ing_nm_regiao_hidro bacia | emp_nm_empreendimento emp |
emp_nm_responsavel titular | emp_nu_cpfcnpj doc | out_dt_outorgainicial dt_ini |
out_dt_outorgafinal dt_fim | outorga_valida valida
Descartar excedente (ex.: os meses *_dad_qt). Datas esriFieldTypeDate vêm em
epoch ms — convertidas para ISO date.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
import urllib.error
import urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # console Windows é cp1252
from datetime import datetime, timezone
from pathlib import Path

HUB = "https://dadosabertos.ana.gov.br"
HUB_LIST = f"{HUB}/api/search/v1/collections/dataset/items?limit=50"
SAIDA = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "ana-outorgas.json"
CACHE = Path(__file__).resolve().parent / ".cache" / "ana-outorgas"
UA = "ControlePopular/1.0 (+controlepopular.com.br; dado publico governamental)"

PAUSA_HUB = 60   # Crawl-Delay 60 pedido pelo robots.txt do Hub da ANA
PAUSA_REST = 2   # pausa entre páginas no host de dados (portal1.snirh.gov.br)
LIMITE_PADRAO = 5000

# outFields exatos -> rótulo curto no JSON (ldict carrega o cabeçalho 1×,
# linhas viram array de arrays — mesma técnica do coletor IBAMA)
OUTFIELDS = {
    "out_nu_processo": "proc",
    "out_nu_ato": "ato",
    "tdm_ds": "dominio",
    "tpo_ds": "tipo_outorga",
    "tin_ds": "uso",
    "tsu_ds": "tp_agua",
    "int_nm_corpohidrico": "curso",
    "ing_nm_municipio": "mun",
    "ing_sg_ufmunicipio": "uf",
    "ing_nm_regiao_hidro": "bacia",
    "emp_nm_empreendimento": "emp",
    "emp_nm_responsavel": "titular",
    "emp_nu_cpfcnpj": "doc",
    "out_dt_outorgainicial": "dt_ini",
    "out_dt_outorgafinal": "dt_fim",
    "outorga_valida": "valida",
}
OUTFIELDS_STR = ",".join(OUTFIELDS)
COLUNAS = list(OUTFIELDS.values())

# Os 3 datasets, por interferência. max/count são os valores medidos em
# 2026-09-16; o coletor re-mediu ao vivo antes de paginar.
DATASETS = [
    {
        "id": "fed_superficial",
        "url": "https://portal1.snirh.gov.br/arcgis/rest/services/DADOSABERTOS/outorgas_federais_superficial/MapServer/4",
        "max_medido": 2000,
        "count_medido": 57298,
    },
    {
        "id": "est_superficial",
        "url": "https://portal1.snirh.gov.br/arcgis/rest/services/DADOSABERTOS/outorgas_estaduais_superficial/MapServer/0",
        "max_medido": 500000,
        "count_medido": 444299,
    },
    {
        "id": "est_subterranea",
        "url": "https://portal1.snirh.gov.br/server/rest/services/Hosted/outorgas_estaduais_subterraneas/FeatureServer/0",
        "max_medido": 2000,
        "count_medido": 249727,
        # medido no f=pjson do layer (2026-09-16): colunas do esquema comum
        # que NÃO existem nesse dataset (FeatureServer de subterrâneas)
        "sem_campos": ["out_nu_processo", "tdm_ds", "tsu_ds",
                       "int_nm_corpohidrico", "ing_nm_regiao_hidro",
                       "outorga_valida"],
    },
]

RESSALVA = ("Registro por interferência de outorga; estar outorgado não confirma "
            "uso em execução.")


def _checkpoint() -> dict:
    """Lê (ou cria) o checkpoint com o offset por dataset para retomada."""
    CACHE.mkdir(parents=True, exist_ok=True)
    arq = CACHE / "checkpoint.json"
    if arq.exists():
        try:
            return json.loads(arq.read_text(encoding="utf-8"))
        except Exception:
            pass  # checkpoint corrompido: recomeça
    return {"offsets": {}, "concluidos": []}


def _salvar_checkpoint(ckpt: dict) -> None:
    arq = CACHE / "checkpoint.json"
    ckpt["ata"] = datetime.now(timezone.utc).isoformat()
    tmp = arq.with_suffix(".parcial")
    tmp.write_text(json.dumps(ckpt, ensure_ascii=False), encoding="utf-8")
    tmp.replace(arq)  # Windows: rename atômico precisa do alvo livre


def _get(url: str, timeout: int = 120) -> bytes:
    """GET com UA honesto. 403/429: espera 30s e re-tenta 1x (idem IBAMA)."""
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read()
    except urllib.error.HTTPError as e:
        if e.code in (403, 429):
            print(f"  [!] {e.code} do servidor — esperando 30s e tentando de novo...")
            time.sleep(30)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read()
        raise


def _get_json(url: str) -> dict:
    return json.loads(_get(url).decode("utf-8", errors="replace"))


def _info_layer(ds: dict) -> tuple[int, int]:
    """Lê f=pjson da layer: devolve (maxRecordCount, count real)."""
    meta = _get_json(ds["url"] + "?f=pjson")
    if "error" in meta:
        raise RuntimeError(f"pjson com error em {ds['url']}: {meta['error']}")
    return int(meta.get("maxRecordCount") or ds["max_medido"]), int(
        meta.get("count") or ds["count_medido"])


def _data_iso_esri(v) -> str | None:
    """Epoch ms (esriFieldTypeDate) -> '2026-08-31'. Números em segundos
    (>1e11 já é ms) também são aceitos."""
    if v is None or v == "":
        return None
    try:
        n = int(v)
    except (TypeError, ValueError):
        return None
    if n > 1_000_000_000_000:  # epoch ms
        n = n // 1000
    elif n < 1_000_000_000:  # lixo/zero
        return None
    try:
        return datetime.fromtimestamp(n, tz=timezone.utc).date().isoformat()
    except (OverflowError, OSError):  # datas absurdas/fonte corrompida → null
        return None


def _sanitizar_doc_em_nome(nome) -> str | None:
    """Remove CPF (11 dígitos, com ou sem pontuação) do texto livre do nome —
    padrão genérico, não lista fixa de casos (lição do IDE-Sisema/Rouanet)."""
    import re
    if not nome:
        return None
    limpo = str(nome)

    def _apagar(m: "re.Match[str]") -> str:
        return "" if len(re.sub(r"\D", "", m.group(0))) == 11 else m.group(0)

    limpo = re.sub(r"\d[\d.\-]{8,}\d", _apagar, limpo)
    limpo = " ".join(limpo.split()).strip(" -,:")
    return limpo or None


def _extrair_cnpjs(doc) -> str | None:
    """emp_nu_cpfcnpj concatenado: separa por ';', mantém SÓ CNPJ (14 dígitos).
    Token com 11 dígitos (CPF, mesmo mascarado tipo ***.587.111-**) é removido;
    se não sobrar CNPJ, devolve None."""
    import re
    if not doc:
        return None
    cnpjs = []
    for token in str(doc).split(";"):
        digitos = re.sub(r"\D", "", token)
        if len(digitos) == 14:
            cnpjs.append(digitos)
        # 11 dígitos (CPF) ou mascarado: descarta sem gravar
    return ";".join(cnpjs) or None


def _paginar(ds: dict, max_rec: int, ckpt: dict, limite: int) -> list[list]:
    """Pagina /query com resultOffset até o fim (ou até --limit por dataset).
    Retomada: recomeça do offset registrado no checkpoint."""
    offsets = ckpt.setdefault("offsets", {})
    offset = int(offsets.get(ds["id"], 0))
    alvo = limite if limite else ds["count_medido"]
    linhas: list[list] = []
    print(f"  {ds['id']}: max={max_rec:,} count={ds['count_medido']:,} retomando do offset {offset:,}")
    while offset < min(ds["count_medido"], alvo if limite else ds["count_medido"]):
        # o layer est_superficial anuncia maxRecordCount=500000 mas responde
        # HTTP 500 a um serve de 500k (medido em 2026-09-16); 50.000 passa
        # ponytail: se algum dia 50k também falhar, reduzir e re-tentar por código
        pagina = min(max_rec, 50000)
        sem = set(ds.get("sem_campos", []))
        out_str = ",".join(c for c in OUTFIELDS if c not in sem)
        params = (
            f"?where=1%3D1&outFields={out_str}&outSR=4326"
            f"&resultRecordCount={pagina}&resultOffset={offset}&f=json"
        )
        page = _get_json(ds["url"] + "/query" + params)
        if "error" in page:
            raise RuntimeError(f"query com error em {ds['id']} offset {offset}: {page['error']}")
        feats = page.get("features", [])
        if not feats:
            break  # fim real antes do count anunciado
        # conversão campo a campo (ordem fixa = COLUNAS)
        for feat in feats:
            a = feat.get("attributes", {})
            linha = []
            for campo, rotulo in OUTFIELDS.items():
                v = a.get(campo)
                if campo in sem:  # coluna fora do esquema deste dataset → null
                    linha.append(None)
                elif rotulo in ("dt_ini", "dt_fim"):
                    linha.append(_data_iso_esri(v))
                elif rotulo == "emp":
                    linha.append(_sanitizar_doc_em_nome(v))
                elif rotulo == "titular":
                    linha.append(_sanitizar_doc_em_nome(v))
                elif rotulo == "doc":
                    linha.append(_extrair_cnpjs(v))
                else:
                    linha.append(v)
            linhas.append(linha)
        offset += len(feats)
        offsets[ds["id"]] = offset
        _salvar_checkpoint(ckpt)
        print(f"    offset {offset:,} (+{len(feats)})")
        time.sleep(PAUSA_REST)
        if limite and len(linhas) >= limite:
            break
    if limite:
        linhas = linhas[:limite]
    if offset >= ds["count_medido"] and ds["id"] not in ckpt.setdefault("concluidos", []):
        ckpt["concluidos"].append(ds["id"])
        _salvar_checkpoint(ckpt)
    return linhas


def main() -> None:
    parser = argparse.ArgumentParser(description="Coletor de outorgas ANA (ESRI REST/SNIRH)")
    parser.add_argument("--dry-run", action="store_true", help="mostra endpoints e contagens, não baixa")
    parser.add_argument("--limit", type=int, default=LIMITE_PADRAO,
                        help="trunca linhas por dataset (0 = sem truncar)")
    parser.add_argument("--scan-cpf", action="store_true", help="roda o varredor de CPF sobre a saída")
    args = parser.parse_args()

    print("=== ANA outorgas (dadosabertos.ana.gov.br / portal1.snirh.gov.br) ===\n")
    print(f"  hub     : {HUB}")
    print(f"  limite  : {'sem limite' if args.limit == 0 else args.limit} (por dataset)")
    print(f"  robots  : Hub Crawl-Delay 60 respeitado (pausa {PAUSA_HUB}s antes da 1ª chamada REST);")
    print(f"            portal1.snirh.gov.br sem robots (404) — pausa {PAUSA_REST}s entre páginas")
    print(f"  saida   : {SAIDA}")

    if args.dry_run:
        total = 0
        for ds in DATASETS:
            try:
                max_rec, count = _info_layer(ds)
            except Exception as e:
                print(f"  [!] {ds['id']}: sondagem falhou ({e}) — usando valores medidos em 2026-09-16")
                max_rec, count = ds["max_medido"], ds["count_medido"]
            total += count
            alvo = count if args.limit == 0 else min(count, args.limit)
            print(f"  {ds['id']}")
            print(f"    endpoint : {ds['url']}")
            print(f"    maxRecordCount : {max_rec:,} | count : {count:,}")
            print(f"    linhas a coletar : {alvo:,} (~{alvo * 230 / 1e6:.1f} MB compacto)")
            time.sleep(PAUSA_REST)
        print(f"\n  TOTAL na fonte : {total:,} registros")
        alvo_total = total if args.limit == 0 else min(total, args.limit * len(DATASETS))
        print(f"  estimativa JSON compacto (~230 B/linha): ~{alvo_total * 230 / 1e6:.1f} MB")
        print("  (dry-run: nada foi baixado)")
        return

    ckpt = _checkpoint()
    # Respeita o Crawl-Delay 60 do Hub antes da primeira chamada REST.
    # 1 única GET ao Hub: só lista/registra os datasets (sem paginação lá).
    print(f"\n  aguardando {PAUSA_HUB}s (Crawl-Delay do Hub)...")
    time.sleep(PAUSA_HUB)
    try:
        lista = _get_json(HUB_LIST)
        n_hub = lista.get("numberMatched") or lista.get("metadata", {}).get("size") or "?"
        print(f"  Hub listado: {n_hub} datasets no catálogo (1 GET, sem paginar)")
    except Exception as e:
        print(f"  [!] listagem do Hub falhou ({e}) — seguindo direto para o REST")
    time.sleep(PAUSA_REST)

    todas: list[list] = []
    total_fonte = 0
    for ds in DATASETS:
        if ds["id"] in ckpt.get("concluidos", []) and not args.limit:
            print(f"\n  {ds['id']}: já concluído no checkpoint — pulando")
            continue
        print()
        max_rec, count = _info_layer(ds)
        ds["count_medido"] = count
        total_fonte += count
        linhas = _paginar(ds, max_rec, ckpt, args.limit)
        print(f"  {ds['id']}: {len(linhas):,} linhas")
        todas.extend(linhas)

    dados = {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "fonte": HUB,
        "datasets": [
            {"id": d["id"], "url": d["url"], "count": d["count_medido"]}
            for d in DATASETS
        ],
        "total_linhas_fonte": total_fonte,
        "truncado": bool(args.limit and any(
            d["count_medido"] > args.limit for d in DATASETS)),
        "ldict": {k: v for k, v in OUTFIELDS.items()},
        "colunas": COLUNAS,
        "colunas_originais": list(OUTFIELDS),
        "ressalva_editorial": RESSALVA,
        "obs": "Registro por interferência. doc mantém só CNPJ (14 dígitos); "
               "CPF mascarado ou puro é descartado na coleta.",
        "linhas": todas,
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(
        json.dumps(dados, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    tam_kb = SAIDA.stat().st_size / 1024
    print(f"\n[ok] {len(todas):,} de {total_fonte:,} outorgas → {SAIDA.name} ({tam_kb:,.0f} KB)"
          + (" — TRUNCADO (use --limit 0)" if dados["truncado"] else ""))

    if args.scan_cpf:
        print("\n  rodando o varredor de CPF sobre a saída...")
        r = subprocess.run(
            [sys.executable, "scripts/checar-dado-pessoal-em-dado.py", "--extra", str(SAIDA)])
        if r.returncode != 0:
            print("  [!] CPF(s) achado(s) no JSON — redigir campo no coletor (substituir por null+flag).")
            sys.exit(2)
        print("  scan clean.")


if __name__ == "__main__":
    main()
