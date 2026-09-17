"""coletar-inema-ba-licencas.py — licenciamento + fiscalização do INEMA (BA/SEIA).

Coleta, via API DE BUSCA do Diário Oficial Online da Bahia (dool.egba.ba.gov.br,
seção ATOS DO INEMA), as páginas publicadas com:

- portarias do INEMA de concessão/renovação de licença ambiental
  (Licença Prévia / Instalação / Operação / Unificada / Autorização Ambiental);
- editais de notificação e autos de infração da fiscalização do INEMA
  (NOT/AIMU/AIIN/AIAP — extrato publicado pelo próprio órgão);

e grava JSON compacto em apps/web/data/inema-ba-licencas.json.

Rodar:
    python scripts/coletar-inema-ba-licencas.py --dry-run   # só contagens
    python scripts/coletar-inema-ba-licencas.py             # coleta até --limit
    python scripts/coletar-inema-ba-licencas.py --limit 0   # tudo
    python scripts/coletar-inema-ba-licencas.py --scan-cpf  # varredor oficial no fim

## Fonte e sondagem (2026-09-16, ≤5 requisições de descoberta + contagens de roda)

- Consulta pública do SEIA por número: https://sol.inema.ba.gov.br/servicos/consultaProcesso
  formulário por número de processo — NÃO varrível; fica como link de referência.
- CKAN estadual (dados.ba.gov.br): NÃO tem dataset de licenciamento (busca
  "licenciamento" e "meio ambiente" -> 0; acervo tem 21 datasets, financeiros).
- Portal SEIA (sistema.seia.ba.gov.br): JSF por login. GeoServer do INEMA
  (geoserver.inema.ba.gov.br, 149 camadas anônimas no catálogo IDE-Bahia) resolve
  DNS mas NÃO responds fora da rede do estado (timeouts; 503 via IP direto);
  idem api-geoseia.inema.ba.gov.br e fiscalizacao.seia.ba.gov.br.
- FONTE CABÍVEL: busca em texto inteiro do DOE-BA em dool.egba.ba.gov.br — o
  INEMA publica lá o extrato de cada licença/portaria e os editais de fiscalização.
  Endpoint Elasticsearch público, sem cadastro, 10 documentos/página, o documento
  traz o CONTEÚDO integral da página do DOE:
      /busca/busca/buscar/query/{offset}/p:{pagina}/?1=1&q={texto}
- robots.txt dos hosts (dool.egba.ba.gov.br, sol.inema.ba.gov.br): 404 — sem
  disposição. Pausa 2s + UA honesto.

## PRIVACIDADE

- Todo texto do DOE é varrido por runs de 11 dígitos (CPF): redigidos na hora.
- CNPJ completo (14 dígitos) é PRESERVADO; máscara/incompleto -> null +
  doc_redigido=1 no registro.
- Autuado pessoa física: o nome fica (ato é público), doc null + doc_redigido.
- `--scan-cpf` roda o varredor oficial (scripts/checar-dado-pessoal-em-dado.py)
  sobre a saída; hit = sair com código 2.

## RESSALVA EDITORIAL

Ato publicado no DOE não significa culpabilidade fixada (autos/notificações
cabem defesa e recurso ao autuado). Licença concedida/renovada não confirma
execução da atividade. Cobertura = janela indexada na busca pública do DOE;
quantos itens vieram vazios fica registrado na saída.
"""
from __future__ import annotations

import argparse
import json
import re
import ssl
import subprocess
import sys
import time
import urllib.parse
import urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # console Windows é cp1252
from datetime import datetime, timezone
from pathlib import Path

BASE = "https://dool.egba.ba.gov.br"
URL_PAG = BASE + "/busca/busca/buscar/query/{offset}/p:{pagina}/?1=1&q={q}"
POR_PAGINA = 10  # ES público: 10 resultados/página (1 resultado = 1 página do DOE)
LIMITE_PADRAO = 5000
PAUSA = 2  # s entre requisições (robots 404 nos hosts; UA honesto)
UF = "BA"
SAIDA = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "inema-ba-licencas.json"
CACHE = Path(__file__).resolve().parent / ".cache" / "inema-ba"
UA = "ControlePopular/1.0 (+controlepopular.com.br; dado publico governamental)"

# consultas ES: (q, grupo editorial)
CONSULTAS = [
    ("INEMA Licenca", "licenca"),
    ("INEMA Autorizacao Ambiental", "licenca"),
    ("INEMA Auto de Infracao", "fiscalizacao"),
    ("INEMA Notificacao", "fiscalizacao"),
]

FONTES = {
    "busca_doe": URL_PAG,
    "doe": "https://dool.egba.ba.gov.br/",
    "consulta_processo_seia": "https://sol.inema.ba.gov.br/servicos/consultaProcesso",
    "robots_status": "404 em dool.egba.ba.gov.br e sol.inema.ba.gov.br",
}

RESSALVA = ("Ato publicado no DOE-BA (seção ATOS DO INEMA) republicado aqui. "
            "Autos de infração/notificação NÃO significam culpabilidade fixada "
            "(cabe defesa e recurso ao autuado); licença concedida/renovada não "
            "confirma que o empreendimento foi executado. A consulta de processo "
            "por número é feita por link, não por varredura: "
            "https://sol.inema.ba.gov.br/servicos/consultaProcesso")


# ---------------------------------------------------------------------------
# HTTP
# ---------------------------------------------------------------------------

try:  # DOE-BA serve cadeia TLS incompleta: o truststore usa o repositório do Windows
    import truststore
    _CTX = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
except Exception:
    try:
        import certifi
        _CTX = ssl.create_default_context(cafile=certifi.where())
    except Exception:
        _CTX = ssl.create_default_context()


def _get(url: str, timeout: int = 180) -> str:
    """GET com UA honesto. 403/429: espera 30s, re-tenta 1x; falha de novo = sair claro."""
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=_CTX) as resp:
            bruto = resp.read()
            charset = resp.headers.get_content_charset() or "utf-8"
        return bruto.decode(charset, errors="replace")
    except urllib.error.HTTPError as e:
        cab = dict(e.headers or {})
        if e.code in (403, 429):
            print(f"  [!] {e.code} (headers: {cab}) — esperando 30s e tentando de novo...")
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
# sanitização (padrão dos coletores IGAM/IBAMA/SEMA-MT)
# ---------------------------------------------------------------------------

RE_11D = re.compile(r"\d[\d.\-/]{7,}\d")


def _apagar_cpf_em_texto(texto: str) -> str:
    """Apaga do texto livre qualquer run com 11 dígitos (CPF); preserva CNPJ 14."""
    def _apagar(m: "re.Match[str]") -> str:
        dig = re.sub(r"\D", "", m.group(0))
        if len(dig) == 14:
            return m.group(0)
        if len(dig) == 11:
            return "[CPF redigido]"
        return m.group(0)
    return RE_11D.sub(_apagar, texto)


def _limpar(v: str | None) -> str | None:
    if v is None:
        return None
    s = str(v).strip()
    return s if s and s.lower() not in ("nan", "none") else None


def _cnpj_ou_redigido(doc: str | None) -> tuple[str | None, bool]:
    """Mantém só CNPJ completo (14 dígitos); máscara/incompleto -> (None, True)."""
    if not doc or str(doc).strip().lower() in ("nan", "none", ""):
        return None, False
    s = str(doc).strip()
    if "x" in s.lower():
        return None, True
    digitos = re.sub(r"\D", "", s)
    if len(digitos) == 14:
        return digitos, False
    if digitos:
        return None, True
    return None, False


# ---------------------------------------------------------------------------
# parser: CONTEÚDO da página do DOE -> registros
# ---------------------------------------------------------------------------

RE_PORT_HEAD = re.compile(
    r"PORTARIA\s+(?:N|n)\s*[ºo°.\s]*\s*[\d\.,/ ]{1,20}?\s+DE\s+[0-3]?\d\s+DE\s+\w{4,12}\s+DE\s+20\d\d")
RE_EDITAL_HEAD = re.compile(r"EDITAL\s+DE\s+NOTIFICA\w{2,6}")

RE_PROC_SEIA = re.compile(r"Processo\s+n?[ºo°.]*\s*([\d\.]{6,}\.\d{3}\.\d{3}\.\d{7}\-\d{2}/INEMA/{0,1}[A-Z0-9\-/]*)")
RE_PROC_DRE = re.compile(
    r"([0-9]{4}\.(?:\d{1,3}\.)+\d{6,10}/INEMA/[A-Z/\-]+|[0-9]{2,3}\.\d{4}\.202\d\.\d{7}-\d{2}|"
    r"[0-9]{4}-\d{3,6}/[A-Z]{2,4}/[A-Z]+\-[0-9]{3,5})")
RE_PROC_ADM = re.compile(
    r"processo\s+administrativo\s*(?:de\s+)?n?[ºo°.]*\s*([0-9]{4}-[\d\.]+/[A-Z]{2,4}/[A-Z]+\-[0-9]{3,5})")
RE_MUN = re.compile(r"munic[íi]pio de\s+([A-ZÀ-Ú][^,;();\n\.]{2,60})")
RE_CNPJ = re.compile(r"CNPJ[^0-9]{0,20}([\d]{2}[\.\-/][\.\-\d/]{10,17}\d{2})")
RE_CPF = re.compile(r"CPF\s*n?[ºo°.\s]*\d{3}")

RE_CONCEDER = re.compile(
    r"Conced(?:er|erir|er?i)\w*\s+((?:[A-ZÀ-Ú][A-ZÀ-Úa-zà-ÿ \-/º]{5,60}?))"
    r"(?:,?\s+v[áa]lid[oa][^,;:]{0,80}?|,?\s+ao?|,?\s+nos)", re.I)
RE_RENOVA = re.compile(r"RENOVA\w*")

TIPOS_LIC = {
    "LICENCA PREVIA": "LP",
    "LICENCA DE INSTALACAO": "LI",
    "LICENCA DE OPERACAO": "LO",
    "LICENCA UNIFICADA": "LU",
    "LICENCA UNICA": "LU",
    "AUTORIZACAO AMBIENTAL": "AA",
    "AUTORIZACAO": "AA",
    "LICENCA": "LIC",
}


def _mapa_tipo(texto_lic: str) -> str:
    t = re.sub(r"\s+", " ", texto_lic).upper()
    t = re.sub(r"Ç", "C", t)
    t = re.sub(r"[ÁÀÂÃÄ]A", "A", t)
    t = t.replace("ÇAO", "CAO")
    for chave in sorted(TIPOS_LIC, key=len, reverse=True):
        if chave in t:
            return TIPOS_LIC[chave]
    return "LIC"


def _primeiro(padrao, bloco) -> str | None:
    m = padrao.search(bloco)
    return _limpar(m.group(1)) if m else None


def _bloco_para_registro(bloco: str, di: str | None, data_pg: str | None, grupo: str) -> dict | None:
    """Um bloco de portaria/edital da página DOE -> registro mínimo."""
    bloco = re.sub(r"[ \t]+", " ", bloco)
    is_portaria = bool(RE_PORT_HEAD.search(bloco))
    is_edital = bool(RE_EDITAL_HEAD.search(bloco)) or bool(RE_PROC_ADM.search(bloco))
    if not (is_portaria or is_edital):
        return None

    proc = _primeiro(RE_PROC_DRE, bloco) or _primeiro(RE_PROC_ADM, bloco)
    mun_m = RE_MUN.search(bloco)
    mun = re.sub(r"\s+", " ", mun_m.group(1).strip())[:60] if (mun_m := RE_MUN.search(bloco)) else None

    r: dict = {
        "processo": proc,
        "tipo": None,
        "empresa": None,
        "cnpj": None,
        "municipio": mun,
        "uf": UF,
        "data_publicacao": data_pg,
        "situacao": None,
        "atividade": None,
        "grupo": grupo,
        "fonte_pagina": f"{BASE}/ver-html/{di}" if di else BASE,
    }
    redigido = False
    pessoa_fisica = False

    if is_portaria:
        m = RE_PORT_HEAD.search(bloco)
        r["tipo"] = "PORTARIA"
        r["no_ato"] = _limpar(re.sub(r"[ \t]+", " ", m.group(0)))
        mcon = RE_CONCEDER.search(bloco)
        acao = "Renovação" if RE_RENOVA.search(bloco[:1500]) else "Concessão"
        if mcon:
            desc = re.sub(r"\s+", " ", mcon.group(1)).strip(" ,.")
            r["tipo"] = _mapa_tipo(desc)
            r["desc_ato"] = desc
        r["situacao"] = f"Publicada - {acao}"
        mcnpj = RE_CNPJ.search(bloco)
        nome = None
        nomm = re.findall(r"([A-ZÀ-Ú][A-Za-zÀ-ÿ0-9&\.\-' ]{4,80}?)\s*,\s*(?:inscri?t[oa])\s+(?:no|\bCNPJ\b)", bloco)
        if nomm:
            cand = nomm[-1].strip(" ,")
            cand = re.sub(r"^(?:e|ao|a|de)\s+", "", cand, flags=re.I)
            if len(cand) >= 5 and not re.match(r"^\d", cand):
                r["empresa"] = cand[:90]
        if mcnpj:
            doc, red2 = _cnpj_ou_redigido(mcnpj.group(1))
            r["cnpj"] = doc
            redigido = redigido or red2
        atv = re.search(r"\bpara\s+(operar|explorar|implantar|construir|lavra?r?|instalar|"
                        r"licenciat|realizar)?\s?([^\n]{15,220})", bloco, re.I)
        if atv:
            r["atividade"] = re.sub(r"\s+", " ", atv.group(0))[:220]

    else:  # edital de notificação / auto de infração
        mproc = RE_PROC_ADM.search(bloco)
        tipadm = None
        if mproc:
            mt = re.search(r"/TEC/([A-Z]+)-", mproc.group(1))
            tipadm = mt.group(1) if mt else "TEC"
        r["tipo"] = f"EDITAL ({tipadm})" if tipadm else "EDITAL"
        r["situacao"] = ("Notificação (fiscalização)" if tipadm == "NOT"
                         else f"Auto de Infração ({tipadm})" if tipadm
                         else "Atuação ambiental (fiscalização — tipo do processo não extraído)")
        mautu = re.search(r"Autuado(?:s)?:\s*([^\n,;]{4,90})", bloco, re.I)
        if mautu:
            r["empresa"] = _limpar(mautu.group(1))[:90]
        if RE_CPF.search(bloco):
            pessoa_fisica = True
            redigido = True
        m_cn = RE_CNPJ.search(bloco)
        m_cpf = RE_CPF.search(bloco)
        if m_cpf:
            pessoa_fisica = True
            redigido = True
        m_cnpj = RE_CNPJ.search(bloco)
        if m_cnpj:
            doc, red2 = _cnpj_ou_redigido(m_cnpj.group(1))
            r["cnpj"] = doc
            redigido = redigido or red2
            if doc and not r["empresa"]:
                nomm = re.search(r"Autuado(?:s)?:\s*([^\n,;]{4,90})", bloco, re.I)
                if nomm:
                    r["empresa"] = _limpar(nomm.group(1))[:90]
        else:
            # sem CNPJ: nome do autuado vem direto do cabeçalho
            if mautu and not r["empresa"]:
                r["empresa"] = _limpar(mautu.group(1))[:90]
        r["resumo"] = _apagar_cpf_em_texto(bloco).strip()[:1200]

    valido = r["processo"] or r["empresa"] or r.get("no_ato")
    if not valido:
        return None
    for k, v in list(r.items()):  # dados ingeridos: varre TODO campo de texto (AGENTS)
        if isinstance(v, str):
            r[k] = _apagar_cpf_em_texto(v)
    if redigido:
        r["doc_redigido"] = 1
    if pessoa_fisica:
        r["pessoa"] = "fisica"
    return r


def _texto_para_registros(texto: str, di: str | None, data_pg: str | None,
                          grupo: str) -> list[dict]:
    """Corta a página DOE pelos cabeçalhos de ato e converte em registros."""
    marcas: set[int] = set()
    for pad in (RE_PORT_HEAD, RE_EDITAL_HEAD):
        for m in pad.finditer(texto):
            marcas.add(m.start())
    if not marcas:
        return []
    pos_list = sorted(marcas)
    out: list[dict] = []
    for i, pos in enumerate(pos_list):
        fim = pos_list[i + 1] if i + 1 < len(pos_list) else min(len(texto), pos + 9000)
        bloco = texto[pos:max(fim, pos + 1)]
        r = _bloco_para_registro(bloco, di, data_pg, grupo)
        if r is not None:
            out.append(r)
    return out


# ---------------------------------------------------------------------------
# API de busca ES: contagem (hits.total) e páginas paginadas + checkpoint
# ---------------------------------------------------------------------------

def _url_busca(q: str, pagina: int) -> str:
    qq = urllib.parse.quote(q, safe="")
    return URL_PAG.format(offset=0, pagina=pagina, q=qq)


def _contar(q: str) -> int:
    txt = _get(_url_busca(q, 1))
    return int((json.loads(txt) or {}).get("hits", {}).get("total") or 0)


def _paginar(q: str, grupo: str, total: int, ckpt: dict, limite: int) -> list[dict]:
    """Baixa páginas ES (10 docs/página, 1 doc = 1 página do DOE), extraindo registros.

    --limit conta DOCS ES baixados (aprox. registros ~2-6x maior)."""
    alvo = total if limite == 0 else min(total, limite)
    regs: list[dict] = []
    n_pags = (alvo + POR_PAGINA - 1) // POR_PAGINA
    base = re.sub(r"[^A-Za-z0-9]", "_", q)
    pag = 1
    while pag <= n_pags:
        chave = f"{base}#{pag}"
        arq = CACHE / f"{re.sub(r'[^A-Za-z0-9]', '_', chave)}.json"
        if chave in ckpt["paginas"] and arq.exists():
            try:
                regs.extend(json.loads(arq.read_text(encoding="utf-8")))
                pag += 1
                continue
            except Exception:
                ckpt["paginas"].discard(chave)
        txt = _get(_url_busca(q, pag))
        hits = (json.loads(txt).get("hits", {}) or {}).get("hits", []) or []
        if not hits:
            break
        regs_pag: list[dict] = []
        for h in hits:
            src = (h or {}).get("_source") or {}
            texto = str(src.get("conteudo") or "")
            if "INSTITUTO DO MEIO AMBIENTE" not in texto.upper():
                continue  # só páginas do DOE que publicam atos do INEMA
            regs_pag.extend(_texto_para_registros(texto, _limpar(src.get("diario_id")),
                                                  _limpar(src.get("data")), grupo))
        arq.write_text(json.dumps(regs_pag, ensure_ascii=False), encoding="utf-8")
        ckpt["paginas"].append(chave)
        if limite and len(regs) + len(regs_pag) > alvo:
            regs_pag = regs_pag[: max(0, alvo - len(regs))]
        regs.extend(regs_pag)
        _salvar_checkpoint(ckpt)
        print(f"    '{q}': página {pag}/{n_pags} (+{len(regs_pag)}, "
              f"acumulado {len(regs):,})")
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
            pass
    return {"paginas": [], "concluido": False}


def _salvar_checkpoint(ckpt: dict) -> None:
    arq = CACHE / "checkpoint.json"
    ckpt["ata"] = datetime.now(timezone.utc).isoformat()
    tmp = arq.with_suffix(".parcial")
    tmp.write_text(json.dumps(ckpt, ensure_ascii=False), encoding="utf-8")
    tmp.replace(arq)  # Windows: rename atômico precisa do alvo livre


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Coleta INEMA-BA licenças + fiscalização (busca do DOE-BA)")
    parser.add_argument("--dry-run", action="store_true", help="só conta (1 GET/consulta)")
    parser.add_argument("--limit", type=int, default=LIMITE_PADRAO, help="trunca registros (0 = tudo)")
    parser.add_argument("--scan-cpf", action="store_true", help="roda o varredor de CPF ao final")
    args = parser.parse_args()

    print("=== INEMA-BA licenças + fiscalização (DOE-BA, dool.egba.ba.gov.br) ===\n")
    print(f"  fonte  : {URL_PAG} (Elasticsearch do DOE, sem cadastro)")
    print(f"  limite : {'sem limite' if args.limit == 0 else args.limit}")
    print(f"  robots : 404 em dool.egba.ba.gov.br e sol.inema.ba.gov.br — "
          f"pausa {PAUSA}s, UA honesto")
    print(f"  saida  : {SAIDA}")

    sondagem: dict[str, int] = {}
    try:
        for q, _grp in CONSULTAS:
            sondagem[q] = _contar(q)
            print(f"  sondagem: '{q}' -> {sondagem[q]:>5,} páginas do DOE")
            time.sleep(PAUSA)
    except Exception as e:
        print(f"\n[cancelado] sondagem ES falhou: {e}")
        print("  Nada coletado ou inventado. Verificar serviço e re-rodar.")
        sys.exit(2)
    total_fonte = sum(sondagem.values())
    print(f"  total de páginas na fonte: {total_fonte:,}")

    if args.dry_run:
        est = sum(s * 10 for s in sondagem.values())  # ~10 registros por página DOE
        print(f"  coletaria ~{est:,} registros em ~{(total_fonte + POR_PAGINA - 1) // POR_PAGINA} páginas")
        print("  (dry-run: nada além destas contagens foi baixado)")
        return

    time.sleep(PAUSA)
    ckpt = _checkpoint()
    todos: list[dict] = []
    for q, grupo in CONSULTAS:
        resto = None if args.limit == 0 else max(0, args.limit - len(todos))
        if resto == 0:
            break
        parte = _paginar(q, grupo, sondagem[q], ckpt, resto)
        todos.extend(parte)
        print(f"  [ok] '{q}': +{len(parte):,}")
        time.sleep(PAUSA)

    # dedup por (processo, fonte_pagina, no_ato)
    vistos: set[tuple] = set()
    dedup: list[dict] = []
    for r in todos:
        k = (r.get("processo"), r.get("fonte_pagina"), r.get("no_ato"))
        if k not in vistos:
            vistos.add(k)
            dedup.append(r)
    todos = dedup
    print(f"  total coletado: {len(todos):,} (após dedup)")

    resumo_sit: dict[str, int] = {}
    for r in todos:
        sit = r["situacao"] or "(sem situação)"
        resumo_sit[sit] = resumo_sit.get(sit, 0) + 1

    dados = {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "fonte": FONTES["busca_doe"],
        "fontes": FONTES,
        "consultas": [{"q": q, "grupo": g, "total_paginas_fonte": sondagem[q]}
                      for q, g in CONSULTAS],
        "total_fonte": total_fonte,
        "truncado": bool(args.limit) and len(todos) < total_fonte * 10,
        "colunas": ["processo", "tipo", "empresa", "cnpj", "municipio", "uf",
                    "data_publicacao", "situacao", "atividade", "resumo",
                    "fonte_pagina"],
        "obs": "CNPJ com 14 dígitos completos é preservado; CPF (11 dígitos) nunca "
               "é gravado: aparece como [CPF redigido] no texto e doc_redigido=1 "
               "no registro. Autuado pessoa física não tem CNPJ; rara presença "
               "de CNPJ completo na fonte vai preservada quando existe.",
        "ressalva_editorial": RESSALVA,
        "resumo_por_situacao": dict(sorted(resumo_sit.items(), key=lambda kv: -kv[1])),
        "linhas": todos,
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(
        json.dumps(dados, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    tam_kb = SAIDA.stat().st_size / 1024
    print(f"\n[ok] {len(todos):,} registros -> {SAIDA.name} ({tam_kb:,.0f} KB)"
          + ("" if not dados["truncado"] else " — TRUNCADO (use --limit 0)"))

    ckpt["concluido"] = not dados["truncado"]
    _salvar_checkpoint(ckpt)

    if args.scan_cpf:
        print("\n  rodando o varredor de CPF sobre a saída...")
        r = subprocess.run(
            [sys.executable, "scripts/checar-dado-pessoal-em-dado.py", "--extra", str(SAIDA)])
        if r.returncode != 0:
            print("  [!] CPF achado no JSON — redigir campo no coletor.")
            sys.exit(2)
        print("  scan clean.")


if __name__ == "__main__":
    main()
