"""coletar-sema-mt-licencas.py — licenciamento + fiscalização da SEMA-MT.

Coleta, via WFS do GeoServer da SEMA-MT (geo.sema.mt.gov.br, o serviço que o
próprio portal de transparência publica para o cidadão), as camadas públicas:

- TDAD_LICENCIAMENTO_LICENCA_PREVIA / DE_INSTALACAO / DE_OPERACAO (LP/LI/LO)
- TDAD_FISCALIZACAO_LAS (Licença Ambiental Simplificada)
- TDAD_FISCALIZACAO_AUTO_DE_INFRACAO e TDAD_FISCALIZACAO_TERMO_DE_EMBARGO

e grava JSON compacto em apps/web/data/sema-mt-licencas.json.

Rodar:
    python scripts/coletar-sema-mt-licencas.py --dry-run   # só contagens (1 GET/camada)
    python scripts/coletar-sema-mt-licencas.py             # coleta até --limit
    python scripts/coletar-sema-mt-licencas.py --limit 0   # tudo
    python scripts/coletar-sema-mt-licencas.py --scan-cpf  # varreador oficial ao final

## Fonte e sondagem (2026-09-16, ≤10 requisições)

- https://geoportal.sema.mt.gov.br/ — "visualização, consulta e download" de
  Licenças, Autorizações, Autos de Infração e Áreas embargadas (anúncio em
  https://www.sema.mt.gov.br/transparencia/index.php/sistemas/simgeo).
- Serviço pintado: GeoServer em geo.sema.mt.gov.br/geoserver/ows. O link WMS
  com authkey está publicado no portal de transparência (acesso público ao
  cidadão); o mesmo authkey libera a listagem de camadas no GetCapabilities.
- Sem API de cheeks: basegeo-api exige login (401 em swagger). CKAN de MT
  (dadosabertos.mt.gov.br, org sema-mt) NÃO tem dataset de licenciamento
  (busca "licenciamento" -> 0 resultados) — WFS é a fonte cabível.
- robots.txt: 404 nos dois hosts (geoportal.sema.mt.gov.br e
  geo.sema.mt.gov.br). Sem nenhuma disposição. Pausa 2s + UA honesto.
- Consulta de processo por número: https://semavirtual.sema.mt.gov.br/eprocesso/
  (HTML público — só referência de link; o coletor NÃO varre processo por
  número).

## Esquema das camadas (DescribeFeatureType medido ao vivo 2026-09-16)

As seis camadas têm o MESMO esquema (25 campos): ID, SERVIDOR, DATA_LANCAMENTO,
TIPO, NOME_DOCUMENTO, NUMERO_DOCUMENTO, LINK_DOCUMENTO, STATUS, DATA_DENUNCIA,
DATA_SOLICITACAO, DATA_DOCUMENTO, DATA_VALIDADE, NUMERO_PROCESSO, RAZAO_SOCIAL,
CPF_CNPJ, ATIVIDADE, PARAMETROS, NIVEL_IMPACTO, CODIGO_CNAI, LONGITUDE,
LATITUDE, MUNICIPIO, COD_IBGE, SHAPE (ponto), SE_ANNO_CAD_DATA.

## PRIVACIDADE

- CPF_CNPJ já vem mascarado na fonte ("xxxxxxxxxxx" para CPF de pessoa física,
  14 x's para CNPJ). Regra: mantém doc SÓ CNPJ completo (14 dígitos numéricos);
  máscara ou incompleto -> null + `doc_redigido: 1` no registro.
- SERVIDOR (nome do servidor público que lançou o ato) é descartado — não entra
  no JSON.
- RAZAO_SOCIAL passa por sanitização (apaga qualquer run de 11 dígitos).
- `--scan-cpf` roda o varredor oficial (scripts/checar-dado-pessoal-em-dado.py)
  sobre a saída; hit = sair com código 2.

## RESSALVA EDITORIAL

Autos de infração e embargo registrados aqui não significam culpabilidade
fixada — ao autuado cabe defesa e recurso. Licença com STATUS DEFERIDO não
confirma execução da atividade.
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # console Windows é cp1252
from datetime import datetime, timezone
from pathlib import Path

BASE = "https://geo.sema.mt.gov.br/geoserver/ows"
AUTHKEY = "541085de-9a2e-454e-bdba-eb3d57a2f492"  # publicado no portal de transparência SEMA
SAIDA = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "sema-mt-licencas.json"
CACHE = Path(__file__).resolve().parent / ".cache" / "sema-mt"
UA = "ControlePopular/1.0 (+controlepopular.com.br; dado publico governamental)"

PAUSA = 2  # s entre requisições (robots 404 nos hosts; UA honesto)
POR_PAGINA = 1000  # GeoServer cap de maxFeatures no CSV: maior passou de 1000 sem efeito
LIMITE_PADRAO = 5000

# camadas -> (slug, tipo)  — esquema idêntico nas seis, medido via DescribeFeatureType
CAMADAS = [
    ("Geoportal:TDAD_LICENCIAMENTO_LICENCA_PREVIA", "LP", "licenca"),
    ("Geoportal:TDAD_LICENCIAMENTO_LICENCA_DE_INSTALACAO", "LI", "licenca"),
    ("Geoportal:TDAD_LICENCIAMENTO_LICENCA_DE_OPERACAO", "LO", "licenca"),
    ("Geoportal:TDAD_FISCALIZACAO_LAS", "LAS", "licenca"),
    ("Geoportal:TDAD_FISCALIZACAO_AUTO_DE_INFRACAO", "AUTO_DE_INFRACAO", "auto_infracao"),
    ("Geoportal:TDAD_FISCALIZACAO_TERMO_DE_EMBARGO", "TERMO_DE_EMBARGO", "termo_embargo"),
]

RESSALVA = ("Atos oficiais da SEMA-MT via WFS do Geoportal. Autos de infração/embargo "
            "não significam culpabilidade fixada (cabe defesa e recurso ao autuado); "
            "licença DEFERIDA não confirma que o empreendimento foi executado. "
            "A consulta de processo por número é feita por link, não por varredura: "
            "https://semavirtual.sema.mt.gov.br/eprocesso/")
FONTES = {
    "wfs": BASE,
    "consulta_processo": "https://semavirtual.sema.mt.gov.br/eprocesso/",
    "geoportal": "https://geoportal.sema.mt.gov.br/",
    "anuncio_oficial": "https://www.sema.mt.gov.br/transparencia/index.php/sistemas/simgeo",
}


def _get(url: str, timeout: int = 180) -> str:
    """GET com UA honesto. 403/429/waf: espera 30s e re-tenta 1x; falha de novo = sair claro."""
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            bruto = resp.read()
            charset = resp.headers.get_content_charset() or "utf-8"
        return bruto.decode(charset, errors="replace")
    except urllib.error.HTTPError as e:
        if e.code in (403, 429):
            print(f"  [!] {e.code} do servidor — esperando 30s e tentando de novo...")
            time.sleep(30)
            try:
                with urllib.request.urlopen(req, timeout=timeout) as resp:
                    return resp.read().decode(resp.headers.get_content_charset() or "utf-8",
                                              errors="replace")
            except Exception as e2:
                print(f"\n[cancelado] re-tentativa também falhou: {e2}. WAF bloqueou a coleta.")
                sys.exit(2)
        raise


# ---------------------------------------------------------------------------
# sanitização (padrão dos coletores IGAM/IBAMA)
# ---------------------------------------------------------------------------

def _sanitizar_doc_em_nome(nome) -> str | None:
    """Apaga do texto livre qualquer run com 11 dígitos (CPF)."""
    if not nome:
        return None
    limpo = str(nome)

    CORES = None

    def _apagar(m: "re.Match[str]") -> str:
        dig = re.sub(r"\D", "", m.group(0))
        return "" if len(dig) == 11 else m.group(0)

    limpo = re.sub(r"\d[\d.\-]{8,}\d", _apagar, limpo)
    limpo = " ".join(limpo.split()).strip(" -,:")
    return limpo or None


def _cnpj_ou_redigido(doc) -> tuple[str | None, bool]:
    """Fonte mascara pessoa física com 'x'. Mantém só CNPJ completo (14 dígitos).
    Devolve (cnpj|None, doc_redigido)."""
    if not doc or str(doc).strip().lower() in ("nan", "none", ""):
        return None, False
    s = str(doc).strip()
    if "x" in s.lower():          # máscara da fonte (LGPD anunciada)
        return None, True
    digitos = re.sub(r"\D", "", s)
    if len(digitos) == 14:
        return digitos, False
    if digitos:
        return None, True         # doc incompleto: redigi em vez de adivinhar a lado
    return None, False


def _limpar(v: str | None) -> str | None:
    if v is None:
        return None
    s = str(v).strip()
    return s if s and s.lower() not in ("nan", "none") else None


# ---------------------------------------------------------------------------
# WFS: contagem (hits) e CSV paginado
# ---------------------------------------------------------------------------

def _url_wfs(layer: str, hits: bool, pagina: int = 1) -> str:
    q = {
        "service": "wfs", "version": "1.1.0", "authkey": AUTHKEY,
        "outputFormat": "csv",
    }
    if hits:
        q.update({"request": "GetFeature", "typeName": layer, "resultType": "hits"})
    else:
        q.update({
            "request": "GetFeature", "typeName": layer,
            "maxFeatures": str(POR_PAGINA),
            "startIndex": str((pagina - 1) * POR_PAGINA),
        })
    return f"{BASE}?{urllib.parse.urlencode(q)}"


def _contar(layer: str) -> int:
    txt = _get(_url_wfs(layer, hits=True))
    m = re.search(r'numberOfFeatures="(\d+)"', txt)
    if not m:
        raise RuntimeError(f"hits sem numberOfFeatures em {layer} (layout mudou?)")
    return int(m.group(1))


CAMPOS_SAIDA = [
    "processo", "tipo", "clas", "documento", "numero_documento", "empresa",
    "cnpj", "municipio", "uf", "data_emissao", "data_validade",
    "situacao", "atividade", "nivel_impacto", "parametros", "codigo_cnai",
]


def _registro(row: dict, tipo: str, clas: str) -> dict | None:
    """Linha da fonte -> registro mínimo (AGENTS: valida CONTEÚDO, nunca o status)."""
    empresa = _sanitizar_doc_em_nome(_limpar(row.get("RAZAO_SOCIAL")))
    valido = any(_limpar(row.get(c)) is not None for c in
                 ("NUMERO_PROCESSO", "NUMERO_DOCUMENTO", "RAZAO_SOCIAL", "MUNICIPIO"))
    if not valido:
        return None
    doc, redigido = _cnpj_ou_redigido(row.get("CPF_CNPJ"))
    r = {
        "processo": _limpar(row.get("NUMERO_PROCESSO")),
        "tipo": tipo,
        "clas": clas,
        "documento": _limpar(row.get("NOME_DOCUMENTO")),
        "numero_documento": _limpar(row.get("NUMERO_DOCUMENTO")),
        "empresa": empresa,
        "cnpj": doc,
        "municipio": _limpar(row.get("MUNICIPIO")),
        "uf": "MT",
        "data_emissao": _limpar(row.get("DATA_DOCUMENTO")),
        "data_validade": _limpar(row.get("DATA_VALIDADE")),
        "situacao": _limpar(row.get("STATUS")),
        "atividade": _limpar(row.get("ATIVIDADE")),
        "nivel_impacto": _limpar(row.get("NIVEL_IMPACTO")),
        "parametros": _limpar(row.get("PARAMETROS")),
        "codigo_cnai": _limpar(row.get("CODIGO_CNAI")),
    }
    if redigido:
        r["doc_redigido"] = 1
    return r


def _paginar(cam: str, tipo: str, clas: str, total: int, ckpt: dict,
             limite: int) -> list[dict]:
    """Baixa CSV em janelas de POR_PAGINA (startIndex), retomando do checkpoint."""
    alvo = total if not limite else min(total, limite)
    regs: list[dict] = []
    n_pags = (alvo + POR_PAGINA - 1) // POR_PAGINA
    slug = tipo or clas or cam
    pag = 1
    while pag <= n_pags:
        chave = f"{slug}#{pag}"
        arq = CACHE / f"{re.sub(r'[^A-Za-z0-9]', '_', chave)}.json"
        if chave in ckpt["paginas"] and arq.exists():
            try:
                regs.extend(json.loads(arq.read_text(encoding="utf-8")))
                pag += 1
                continue  # retomada
            except Exception:
                ckpt["paginas"].remove(chave)  # cache corrompido: re-baixa
        csv_txt = _get(_url_wfs(cam, hits=False, pagina=pag))
        reader = csv.DictReader(io.StringIO(csv_txt))
        linhas = [r for r in reader if r]
        if not linhas:
            break
        regs_pag: list[dict] = []
        for row in linhas:
            reg = _registro(row, tipo, clas)
            if reg is not None:
                regs_pag.append(reg)
        arq.write_text(json.dumps(regs_pag, ensure_ascii=False), encoding="utf-8")
        ckpt["paginas"].append(chave)
        if limite and len(regs) + len(regs_pag) > alvo:
            regs_pag = regs_pag[: max(0, alvo - len(regs))]
        regs.extend(regs_pag)
        _salvar_checkpoint(ckpt)
        print(f"    {slug}: página {pag}/{n_pags} (+{len(regs_pag)}, acumulado {len(regs):,})")
        if limite and len(regs) >= alvo:
            break
        pag += 1
        time.sleep(PAUSA)
    return regs[:alvo]


def _checkpoint() -> dict:
    CACHE.mkdir(parents=True, exist_ok=True)
    arq = CACHE / "checkpoint.json"
    if arq.exists():
        try:
            return json.loads(arq.read_text(encoding="utf-8"))
        except Exception:
            pass  # corrompido: recomeça
    return {"paginas": [], "concluido": False}


def _salvar_checkpoint(ckpt: dict) -> None:
    arq = CACHE / "checkpoint.json"
    ckpt["ata"] = datetime.now(timezone.utc).isoformat()
    tmp = arq.with_suffix(".parcial")
    tmp.write_text(json.dumps(ckpt, ensure_ascii=False), encoding="utf-8")
    tmp.replace(arq)  # Windows: rename atômico precisa do alvo livre


def main() -> None:
    parser = argparse.ArgumentParser(description="Coleta SEMA-MT licenças + autos (WFS Geoportal)")
    parser.add_argument("--dry-run", action="store_true", help="só conta registros (1 GET/camada)")
    parser.add_argument("--limit", type=int, default=LIMITE_PADRAO, help="trunca registros (0 = tudo)")
    parser.add_argument("--scan-cpf", action="store_true", help="roda o varredor de CPF ao final")
    args = parser.parse_args()

    print("=== SEMA-MT licenças + fiscalização (geo.sema.mt.gov.br WFS) ===\n")
    print(f"  fonte  : {BASE} (+ {len(CAMADAS)} camadas do Geoportal)")
    print(f"  limite : {'sem limite' if args.limit == 0 else args.limit}")
    print(f"  robots : 404 em geo.sema.mt.gov.br e geoportal.sema.mt.gov.br — "
          f"pausa {PAUSA}s, UA honesto")
    print(f"  saida  : {SAIDA}")

    # sondagem: hits por camada (1 GET cada) — valide CONTEÚDO, nunca o status
    sondagem: dict[str, int] = {}
    try:
        for cam, tipo, _clas in CAMADAS:
            sondagem[tipo] = _contar(cam)
            print(f"  sondagem: {tipo:<18} {sondagem[tipo]:>7,} registros")
            time.sleep(PAUSA)
    except Exception as e:
        print(f"\n[cancelado] sondagem WFS falhou: {e}")
        print("  Nada coletado ou inventado. Verificar serviço/waf e re-rodar.")
        sys.exit(2)
    total_geral = sum(sondagem.values())
    print(f"  total na fonte: {total_geral:,}")

    if args.dry_run:
        alvo = total_geral if args.limit == 0 else min(total_geral, args.limit)
        est = sum(min(s, args.limit if args.limit else s) for s in sondagem.values())
        print(f"  coletaria ~{est:,} registros em ~{(alvo + POR_PAGINA - 1) // POR_PAGINA} páginas")
        print(f"  estimativa JSON compacto (~350 B/registro): ~{est * 350 / 1e6:.1f} MB")
        print("  (dry-run: nada além destas contagens foi baixado)")
        return

    # coleta
    time.sleep(PAUSA)
    ckpt = _checkpoint()
    todos: list[dict] = []
    for cam, tipo, clas in CAMADAS:
        resto = None if args.limit == 0 else max(0, args.limit - len(todos))
        if resto == 0:
            break
        parte = _paginar(cam, tipo, clas, sondagem[tipo], ckpt, resto)
        todos.extend(parte)
        print(f"  [ok] {tipo}: {len(parte):,}")
        time.sleep(PAUSA)
    print(f"  total coletado: {len(todos):,} de {total_geral:,}")

    # resumo por município (por alvo da tarefa) e por situação
    resumo_mun: dict[str, int] = {}
    resumo_sit: dict[str, int] = {}
    for r in todos:
        resumo_mun[r["municipio"] or "(sem município)"] = \
            resumo_mun.get(r["municipio"] or "(sem município)", 0) + 1
        resumo_sit[r["situacao"] or "(sem situação)"] = \
            resumo_sit.get(r["situacao"] or "(sem situação)", 0) + 1

    dados = {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "fonte": FONTES["wfs"],
        "fontes": FONTES,
        "camadas": [{"layer": c, "tipo": t, "classe": k, "total_fonte": sondagem[t]}
                    for c, t, k in CAMADAS],
        "total_fonte": total_geral,
        "truncado": bool(args.limit) and len(todos) < total_geral,
        "colunas": CAMPOS_SAIDA,
        "obs": "CPF_CNPJ da fonte já vem mascarado (LGPD); mantém só CNPJ com 14 "
               "dígitos completos; máscara/incompleto -> null + doc_redigido=1. "
               "SERVIDOR (nome de servidor público) descartado na coleta.",
        "ressalva_editorial": RESSALVA,
        "resumo_por_municipio_ou_atividade": {
            "chave": "municipio",
            "nota": "Contagem por município do documento (fonte TEM a coluna).",
            "contagens": dict(sorted(resumo_mun.items(), key=lambda kv: -kv[1])),
        },
        "resumo_por_situacao": dict(sorted(resumo_sit.items(), key=lambda kv: -kv[1])),
        "linhas": todos,
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(
        json.dumps(dados, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    tam_kb = SAIDA.stat().st_size / 1024
    print(f"\n[ok] {len(todos):,} registros → {SAIDA.name} ({tam_kb:,.0f} KB)"
          + ("" if not dados["truncado"] else " — TRUNCADO (use --limit 0)"))

    if dados["truncado"]:
        ckpt["concluido"] = False
        _salvar_checkpoint(ckpt)
    else:
        ckpt["concluido"] = True
        _salvar_checkpoint(ckpt)

    if args.scan_cpf:
        print("\n  rodando o varreador de CPF sobre a saída...")
        r = subprocess.run(
            [sys.executable, "scripts/checar-dado-pessoal-em-dado.py", "--extra", str(SAIDA)])
        if r.returncode != 0:
            print("  [!] CPF achado no JSON — redigir campo no coletor (null + doc_redigido).")
            sys.exit(2)
        print("  scan clean.")


if __name__ == "__main__":
    main()
