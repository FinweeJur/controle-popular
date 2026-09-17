"""coletar-sema-ma-licencas.py — licenciamento da SEMA-MA (SIGLA/Portal Guará).

Coleta, via API DE BUSCA em texto inteiro do DOEMA (Dário Oficial do Maranhão,
www.diariooficial.ma.gov.br), os avisos de requisícios/concessões de licenças e
atos da SEMA-MA publicados no DOE e grava JSON compacto em
apps/web/data/sema-ma-licencas.json.

Rodar:
    python scripts/coletar-sema-ma-licencas.py --dry-run     # só contagens
    python scripts/coletar-sema-ma-licencas.py               # coleta até --limit
    python scripts/coletar-sema-ma-licencas.py --limit 0     # tudo
    python scripts/coletar-sema-ma-licencas.py --scan-cpf    # varredor no fim

## Fontes e sondagem (2026-09-16, ≤14 requisições de descoberta + contagens de roda)

- Consulta pública do SIGLA: https://sigla.sema.ma.gov.br/sigla (JSF/RichFaces;
  menu "Consultas" expande em AJAX: Outorgas, Recursos Florestais, Processo,
  Licença/Autorização, Declaração de trâmite). TODAS as consultas são POR CHAVE
  (código de licença, número de processo): NÃO varrível; fica como link de
  referência. Obs.: desde 08/04/2024 novos requerimentos vão para o Portal
  Guará (guara.sema.ma.gov.br) — aviso na própria página do SIGLA.
- Portal da Transparência SEMA-MA (transparencia.sema.ma.gov.br): SPA React/Vite
  com rota /page/licenciamento_sigla. A API /app/api/buscar reconhece os slugs
  (item ruim responde 400 "não reconhecido"), MAS todo slug válido
  (licenciamento_sigla, autos_infracao, arrecadacao_multa etc.) responde
  HTTP 500 {"error":"Erro interno do servidor"} mesmo com primeiro flush de
  sessão e cabeçalhos de navegador — backend fora do ar; fora do controle
  deste script. Além disso a página licenciamento_sigla NÃO faz fetch inicial
  no código (o componente limpa os dados e retorna sem chamada). Registrado
  como obstáculo; o coletor NÃO varre o portal quebrado.
- Fonte CABÍVEL (a que este script usa): busca em texto inteiro do DOEMA,
  em diariooficial.ma.gov.br — a SEMA-MA publica lá atos/processos e os
  empreendedores publicam avisos de requisícios e recebimento de licenças
  (caderno TERCEIROS). Endpoint público sem cadastro (scrolled plain ES):
      GET /ajax.busca.php?termo={q}&sigla=&datai=&dataf=&scrollId={cursor}
  Devolve JSON {busca:{total, es_html (HTML dos cartões de resultado),
  scrollId (cursor do ES), totalFragmentos, btnLoad, msn}}. Cada cartão traz
  caderno, data de publicação, trecho destacado, página e arquivo da edição
  (png do PDF compilado). O scrollId é o cursor: repetir a chamada acrescentando
  o cursor até vir vazio.
- robots.txt: diariooficial.ma.gov.br → 404 (sem disposição); sigla.sema.ma.gov.br
  → 404; transparencia.sema.ma.gov.br → responde com o HTML da SPA (catch-all,
  sem regra real de robots). Pausa 2s + UA honesto em todas as requisições.
- Conteúdo dos resultados é TRECHO (highlight da busca), não o ato integral —
  o campo `texto` do registro é o trecho publicado no índice; a imagem integral
  do PDF fica no campo fonte_url.

## PRIVACIDADE (padrão do sistema IGAM/IBAMA/INEMA-BA)

- Todo texto é varrido por runs de 11 dígitos (CPF): apagado na hora
  ("[CPF redigido]").
- CNPJ completo (14 dígitos) é preservado; mascarado/incompleto (parcial
  mascarado; sem formato) → null + doc_redigido=1 no registro.
- `--scan-cpf` roda o varredor oficial (scripts/checar-dado-pessoal-em-dado.py)
  sobre o arquivo final; achado = sai com código 2 e NÃO sobrescreve.

## RESSALVA EDITORIAL

Aviso de requerimento publicado no caderno TERCEIROS pelo próprio
empreendedor NÃO significa que a licença foi concedida. Recebimento de
licença noticiado pelo empreendedor não substitui a certidão do SIGLA/Guará.
Consultas por código/número existem no SIGLA público
(https://sigla.sema.ma.gov.br/sigla) — o coletor não varre a base do SIGLA;
publica o que está no DOE. Publicar um número de licença é republicar ato
oficial e aviso público; não é atestado de conformidade.
"""
from __future__ import annotations

import argparse
import json
import re
import ssl
import subprocess
import sys
import time
import unicodedata
import urllib.parse
import urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # console Windows é cp1252
from datetime import datetime, timezone
from pathlib import Path

BASE = "https://www.diariooficial.ma.gov.br"
URL_BUSCA = BASE + "/ajax.busca.php?termo={q}&sigla=&datai=&dataf=&scrollId={sid}"
LIMITE_PADRAO = 5000
PAUSA = 2  # s entre requisições (robots: 404 nos 3 hosts; UA honesto)
UF = "MA"
SAIDA = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "sema-ma-licencas.json"
CACHE = Path(__file__).resolve().parent / ".cache" / "sema-ma"
UA = "ControlePopular/1.0 (+controlepopular.com.br; dado publico governamental)"
URL_MODULO_SIGLA = "https://sigla.sema.ma.gov.br/sigla"
URL_PORTAL_TRANS = "https://transparencia.sema.ma.gov.br/page/licenciamento_sigla"

# consultas: (termo, grupo editorial) — termos escolhidos por contagem real do DOEMA
# ("SEMA Auto de Infração"/"SEMA Notificação"/"SEMA Infração" devolvem 0 nos
# testes de 2026-09-16; fiscalização da SEMA-MA não foi publicada com esses termos)
CONSULTAS = [
    ("SEMA Licença", "licenca"),
    ("SEMA Licença Ambiental", "licenca"),
    ("SEMA Autorização Ambiental", "licenca"),
    ("SEMA Outorga", "licenca"),
    ("SEMA Dispensa de Licenciamento", "licenca"),
]

FONTES = {
    "busca_doema": URL_BUSCA,
    "doema": BASE + "/",
    "consulta_por_chave_sigla": "https://sigla.sema.ma.gov.br/sigla",
    "portal_guara": "https://guara.sema.ma.gov.br",
    "portal_transparencia_spa": URL_PORTAL_TRANS,
    "robots_status": "diariooficial.ma.gov.br: 404; sigla.sema.ma.gov.br: 404; "
                     "transparencia.sema.ma.gov.br: catch-all da SPA (sem regra real)",
}

RESSALVA = ("Avisos de requerimento/recebimento publicados no DOEMA (caderno "
            "TERCEIROS e EXECUTIVO) são atos públicos e republicados aqui. "
            "Requerimento publicado NÃO significa licença concedida; aviso de "
            "recebimento NÃO substitui a certidão (consultar SIGLA por número: "
            "https://sigla.sema.ma.gov.br/sigla). Autos de fiscalização NÃO "
            "significam culpabilidade fixada (cabe defesa e recurso).")


# ---------------------------------------------------------------------------
# HTTP
# ---------------------------------------------------------------------------

try:
    import truststore  # cadeia TLS do governo DE via proxy? hotfix do DOEMA-BA — tentessa
    _CTX = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
except Exception:
    _CTX = ssl.create_default_context()


def _get(url: str, timeout: int = 180) -> str:
    """GET com UA honesto. 403/429: espera 30s, tenta 2x mais; falha de novo = sair claro."""
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    tent = 0
    while True:
        try:
            with urllib.request.urlopen(req, timeout=timeout, context=_CTX) as resp:
                bruto = resp.read()
                charset = resp.headers.get_content_charset() or "utf-8"
            return bruto.decode(charset, errors="replace")
        except urllib.error.HTTPError as e:
            if e.code in (403, 429):
                tent += 1
                print(f"  [!] {e.code} (headers: {dict(e.headers or {})}) — esperando 30s...")
                time.sleep(30)
                if tent >= 2:
                    print(f"\n[cancelado] {e.code} de novo após 2 tentativas. "
                          f"WAF bloqueou a coleta — NADA foi compilado nem inventado.")
                    sys.exit(2)
            else:
                raise


# ---------------------------------------------------------------------------
# sanitização (padrão IGAM/IBAMA/SEMA-MT/INEMA-BA)
# ---------------------------------------------------------------------------

RE_11D = re.compile(r"\d[\d .\-/]{7,24}\d")


def _cpf_valido(dig: str) -> bool:
    """mod-11 padrão de CPF (só usado para decidir redação em runs ambíguos)."""
    if not dig.isdigit() or len(dig) != 11 or len(set(dig)) == 1:
        return False
    for n in (9, 10):
        s = sum(int(x) * w for x, w in zip(dig[:n], range(n, 0, -1)))
        r = (s * 10) % 11 % 10
        if r != int(dig[n]):
            return False
    return True


def _apagar_cpf_em_texto(texto: str) -> str:
    """Apaga do texto livre qualquer run com 11 dígitos (CPF); preserva CNPJ 14.
    DOEMA às vezes injeta um dígito a mais na frente do CPF ('0 010.736.493-00'):
    runs com 12-13 dígitos redigidos se houver janela de 11 com mod-11 válido."""
    def _apagar(m):
        s = m.group(0)
        dig = re.sub(r"\D", "", s)
        if len(dig) == 14:
            return s
        if len(dig) == 11:
            return "[CPF redigido]"
        if len(dig) in (12, 13) and any(_cpf_valido(dig[i:i + 11]) for i in range(len(dig) - 10)):
            return "[CPF redigido]"
        return s
    return RE_11D.sub(_apagar, texto)


def _limpar(v):
    if v is None:
        return None
    s = str(v).strip()
    return s if s and s.lower() not in ("nan", "none") else None


def _cnpj_ou_redigido(doc):
    """Mantém só CNPJ completo (14 dígitos); mascarado/incompleto -> (None, True)."""
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
# parser: um CARTÃO de resultado do DOEMA -> registro
# ---------------------------------------------------------------------------

RE_CARD = re.compile(r'(?=<div class="card flex-md-row)')
RE_CADERNO = re.compile(r'text-primary">([^<]+)<strong')
RE_DATA = re.compile(r"Publicado em (\d{1,2}/\d{1,2}/\d{4})")
RE_MODAL = re.compile(
    r"setModal\('([^']*?)','[^']*','([^']*?)','([^']*?)','(\d+)'")
RE_TEXTO = re.compile(r'<p class="card-text mb-auto">(.*?)</p>', re.S)
RE_TAG = re.compile(r"<[^>]+>")

RE_PROC = re.compile(r"[Pp]rocess[oa](?:\s+SEMA)?\s*n?[ºo°.]*\s*(\d[\d\.\s]{3,16}?\d)/(\d{4})")
RE_LIC_N = re.compile(
    r"Licen[çc][ao][^.\n]{0,70}?n?[ºo°.]\s*(\d{4,12}(?:\s*/\s*(?:19|20)\d\d)?)")
RE_MUN = re.compile(
    r"mun[íi]c[íi]pio\s+(?:de\s+)?(?!de\b)([A-ZÀ-Ú][^.,;()\n/]{2,60}?)"
    r"(?:\s*/\s*MA\b|\s*\s*[.,;)]|\s*$)", re.I)
RE_CNPJ = re.compile(r"CNPJ[^0-9]{0,25}([\d]{2}[\.\- /]?[\d\.\-/ ]{8,20}\d)")
RE_CPF_WORD = re.compile(r"CPF\s*n?[ºo°.\s]*\d{3}")


TIPOS_LIC = [
    ("LICENCA AMBIENTAL DE REGULARIZACAO", "LAR"),
    ("LICENCA UNICA", "LU"),
    ("LICENCA UNIFICADA", "LU"),
    ("LICENCA PREVIA", "LP"),
    ("LICENCA DE INSTALACAO", "LI"),
    ("LICENCA DE OPERACAO", "LO"),
    ("LICENCA DE OPERAÇÃO", "LO"),
    ("LICENCA AMBIENTAL", "LIC"),
    ("AUTORIZACAO AMBIENTAL", "AA"),
    ("AUTORIZACAO DE EXECUCAO", "AA"),
    ("AUTORIZACAO", "AA"),
    ("OUTORGA", "OUT"),
    ("DISPENSA DE LICENCIAMENTO", "DLA"),
    ("LICENCA", "LIC"),
]


def _norm(t):
    """Dobra acento/caixa: 'Licença' e variações -> 'LICENCA' (padrão ASCII)."""
    t = unicodedata.normalize("NFKD", str(t))
    t = "".join(ch for ch in t if not unicodedata.combining(ch))
    t = re.sub(r"[\s.]+", " ", t).upper()
    t = t.replace("Ç", "C")
    return t


def _mapa_tipo(t):
    t = re.sub(r"[\s.]+", " ", _norm(t))
    for chave, tipo in sorted(TIPOS_LIC, key=lambda x: -len(x[0])):
        if _norm(chave) in t:
            return tipo
    return "LIC"


def _situacao(texto):
    t = _norm(texto)
    if "RECEBEU" in t:
        return "Licença recebida (aviso do empreendedor no DOEMA)"
    if "REQUEREU" in t or "REQUIREU" in t:
        return "Requerimento publicado (aviso do empreendedor no DOEMA)"
    if "CONCEDIU" in t or "CONCEDER" in t:
        return "Concessão publicada (ato no DOEMA)"
    if "RENOVA" in t:
        return "Renovação publicada (ato no DOEMA)"
    return "Ato publicado no DOEMA (menção a licença/outorga da SEMA)"


def _cartao_para_registro(cartao: str) -> "dict | None":
    bruto = cartao  # HTML original: modal/caderno precisam dos atributos intactos
    cartao = unicodedata.normalize("NFC", RE_TAG.sub(" ", cartao))
    cartao = re.sub(r"\s+", " ", cartao)
    normtxt = _norm(cartao)
    if "SEMA" not in normtxt and "SECRETARIA DE ESTADO DO MEIO AMBIENTE" not in normtxt \
            and "MEIO AMBIENTE E RECURSOS NATURAIS" not in normtxt:
        return None  # só atos/avisos que mencionam a SEMA-MA
    if not re.search(r"LICEN[CÇ]|OUTORG|AUTORIZ", normtxt):
        return None  # não é licenciamento (cartões que só citam "SEMA" p.ex. e-mail)
    dados = unicodedata.normalize("NFC", cartao).strip()
    cader = re.search(r'text-primary">([^<]+)<', bruto)
    data = RE_DATA.search(dados)
    # corpo: tudo depois da data de publicação (corta "TERCEIROS Publicado em ...")
    corpo = dados[data.end():] if data else dados
    modal = RE_MODAL.search(bruto)
    proc = None
    mp = RE_PROC.search(corpo)
    if mp:
        num = re.sub(r"\s", "", mp.group(1))
        proc = f"{num}/{mp.group(2)}"
    lic = None
    ml = RE_LIC_N.search(corpo)
    if ml:
        lic = re.sub(r"\s", "", ml.group(1))
    mun = RE_MUN.search(corpo)
    mcnpj = RE_CNPJ.search(corpo)
    doc = redigido = None
    if mcnpj:
        doc, redigido = _cnpj_ou_redigido(mcnpj.group(1).replace(" ", ""))
    # empresa: nome antes de CNPJ/inscrição; pessoa física = nome próprio (ato público)
    nome = re.search(r"([A-ZÀ-Ú][A-Za-zÀ-ÿ0-9&\.\-'/ ]{3,90}?)\s*,?\s*"
                     r"(?:CNPJ|inscrit[oa]|portador d|torna)", corpo)
    if RE_CPF_WORD.search(corpo):
        redigido = True
    atv = re.search(r"atividade\s+d[aeo]s?\s+([^,\n;]{8,180})", corpo)
    situao = _situacao(corpo)

    reg = {
        "processo": proc,
        "tipo": _mapa_tipo(dados),
        "empresa": _limpar((nome.group(1) if nome else "").rstrip(" .,")) or None,
        "cnpj": doc,
        "municipio": _limpar(re.sub(r"\s+", " ", mun.group(1)).rstrip(" ./,;")) if mun else None,
        "uf": UF,
        "data_publicacao": data.group(1) if data else None,
        "situacao": situao,
        "no_licenca": lic,
        "atividade": _limpar(atv.group(1)) if atv else None,
        "caderno": _limpar(cader.group(1)) if cader else None,
        "edicao": _limpar(modal.group(2)) if modal else None,
        "resumo": _apagar_cpf_em_texto(cartao).strip()[:1200],
        "fonte_url": (BASE + "/" + (modal.group(3) or "")) if modal else BASE + "/",
    }
    if re.search(r"no CPF|do CPF", dados):
        redigido = True
        if not mcnpj:
            reg["pessoa"] = "fisica"
    if redigido:
        reg["doc_redigido"] = 1
    valido = reg["processo"] or reg["empresa"] or reg["no_licenca"]
    if not valido:
        return None
    r = reg
    SEM_MULT = ("processo", "no_licenca", "edicao", "tipo", "uf", "caderno")
    for k, v in list(r.items()):      # dado ingerido: varre TODO campo de texto (AGENTS)
        if isinstance(v, str) and k not in SEM_MULT:
            r[k] = _apagar_cpf_em_texto(v)
    return r


def _chunk_para_registros(html: str) -> "list[dict]":
    """A parte HTML dos cartões do DOEMA (es_html) -> registros."""
    out = []
    pos = [m.start() for m in re.finditer(r'<div class="card flex-md-row', html)]
    if not pos:
        return []
    for i, p in enumerate(pos):
        fim = pos[i + 1] if i + 1 < len(pos) else len(html)
        r = _cartao_para_registro(html[p:fim])
        if r is not None:
            out.append(r)
    return out


# ---------------------------------------------------------------------------
# DOEMA busca: contagem + varredura (scroll) + checkpoint
# ---------------------------------------------------------------------------

def _buscar(termo: str, sid: str = "") -> "dict":
    q = {"termo": termo, "sigla": "", "datai": "", "dataf": "", "scrollId": sid or ""}
    txt = _get(URL_BUSCA.format(q=urllib.parse.quote(termo), sid=sid))
    try:
        dto = json.loads(txt)
    except Exception as e:
        raise RuntimeError(f"DOEMA não respondeu JSON na busca '{termo}': {e}; corpo: {txt[:400]}")
    busca = dto.get("busca") or {}
    if busca.get("erro") or "Nada encontrado" in str(busca.get("msn", "")):
        return {"total": 0, "es_html": "", "scrollId": "", "competencia": None, "btnLoad": False, "msn": busca.get("msn")}
    return dict(busca)


def _contar(termo: str) -> int:
    b = _buscar(termo)
    return int(b.get("total") or 0)


def _paginar(termo: str, grupo: str, total: int, ckpt: dict, limite: int) -> "list[dict]":
    base = re.sub(r"[^A-Za-z0-9]", "_", termo)
    regs: "list[dict]" = []
    sid = ""
    chunk = 1
    alvo = total if limite == 0 else min(total, limite)
    while sid is not None and chunk <= 4000:
        chave = f"{base}#{chunk:04d}"
        arq = CACHE / f"{re.sub(r'[^A-Za-z0-9]', '_', chave)}.json"
        if chave in ckpt["chunks"] and arq.exists():
            try:
                regs.extend(json.loads(arq.read_text(encoding="utf-8")))
                sid = ""
                chunk += 1
                continue
            except Exception:
                ckpt["chunks"].discard(chave)
        b = _buscar(termo, sid)
        nr = _chunk_para_registros(b.get("es_html") or "")
        arq.parent.mkdir(parents=True, exist_ok=True)
        arq.write_text(json.dumps(nr, ensure_ascii=False), encoding="utf-8")
        ckpt["chunks"].append(chave)
        regs.extend(nr)
        _salvar_checkpoint(ckpt)
        print(f"    '{termo}': bloco {chunk} (+{len(nr):,}, acumulado {len(regs):,} de {total:,})", flush=True)
        if limite and len(regs) >= alvo:
            break
        sid = (b.get("scrollId") or "").strip()
        if not sid:
            break
        chunk += 1
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
    return {"chunks": [], "concluido": False}


def _salvar_checkpoint(ckpt: dict) -> None:
    arq = CACHE / "checkpoint.json"
    ckpt["ata"] = datetime.now(timezone.utc).isoformat()
    tmp = arq.with_suffix(".parcial")
    tmp.write_text(json.dumps(ckpt, ensure_ascii=False), encoding="utf-8")
    tmp.replace(arq)  # Windows: rename atômico precisa do alvo livre


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Coleta SEMA-MA licenciamento (busca em texto inteiro do DOEMA)")
    parser.add_argument("--dry-run", action="store_true", help="só conta (1 GET/termo)")
    parser.add_argument("--limit", type=int, default=LIMITE_PADRAO, help="trunca registros (0 = tudo)")
    parser.add_argument("--scan-cpf", action="store_true", help="roda o varredor de CPF ao final")
    args = parser.parse_args()

    print("=== SEMA-MA licenciamento (no DOEMA, diariooficial.ma.gov.br) ===\n")
    print(f"  fonte  : {URL_BUSCA}")
    print(f"  limite : {'sem limite' if args.limit == 0 else args.limit}")
    print(f"  robots : 404 em diariooficial.ma.gov.br e sigla.sema.ma.gov.br — "
          f"pausa {PAUSA}s, UA honesto")
    print(f"  SIGLA/Transparência módulo público inspecionados: ver cabeçalho do script")
    print(f"  saida  : {SAIDA}")

    sondagem = {}
    try:
        for termo, _g in CONSULTAS:
            sondagem[termo] = _contar(termo)
            print(f"  sonde   : '{termo}' -> {sondagem[termo]:>6,} resultados NO ACERVO DOEMA", flush=True)
            time.sleep(PAUSA)
    except Exception as e:
        print(f"\n[cancelado] contagem no DOEMA falhou: {e}")
        print("  Nada coletado ou inventado. Verificar serviço e re-rodar.")
        sys.exit(2)
    total_fonte = sum(sondagem.values())
    print(f"  total de resultados na fonte: {total_fonte:,}")

    if args.dry_run:
        print("  (dry-run: nada além destas contagens foi baixado)")
        return

    time.sleep(PAUSA)
    ckpt = _checkpoint()
    todos: "list[dict]" = []
    for termo, grupo in CONSULTAS:
        resto = None if args.limit == 0 else max(0, args.limit - len(todos))
        if resto == 0:
            break
        parte = _paginar(termo, grupo, sondagem[termo], ckpt, resto)
        todos.extend(parte)
        print(f"  [ok] '{termo}': +{len(parte):,} [{grupo}]", flush=True)
        time.sleep(PAUSA)

    # dedup por (fonte_url, edicao, telefone do primeiro ato e limiar)
    vistos = set()
    dedup: "list[dict]" = []
    for r in todos:
        k = (r.get("fonte_url"), r.get("edicao"), r.get("processo"), str(r.get("no_licenca")))
        if k not in vistos:
            vistos.add(k)
            dedup.append(r)
    todos = dedup
    print(f"  total coletado: {len(todos):,} (após dedup)")

    resumo_sit = {}
    for r in todos:
        sit = r["situacao"] or "(sem situação)"
        resumo_sit[sit] = resumo_sit.get(sit, 0) + 1

    dados = {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "fonte": FONTES["busca_doema"],
        "fontes": FONTES,
        "consultas": [{"termo": t, "grupo": g, "total_resultados_fonte": sondagem[t]}
                      for t, g in CONSULTAS],
        "total_fonte": total_fonte,
        "truncado": bool(args.limit) and len(todos) < total_fonte,
        "colunas": ["processo", "tipo", "empresa", "cnpj", "municipio", "uf",
                    "data_publicacao", "situacao", "no_licenca", "atividade", "resumo",
                    "fonte_url"],
        "obs": "CNPJ com 14 dígitos completos é preservado; CPF (11 dígitos) nunca "
               "é gravado: aparece como [CPF redigido] e doc_redigido=1 no registro. "
               "Conteúdo é trecho do índice de busca do DOEMA, não ato integral — "
               "a imagem da página integral fica em fonte_url.",
        "ressalva_editorial": RESSALVA,
        "resumo_por_situacao": dict(sorted(resumo_sit.items(), key=lambda kv: -kv[1])),
        "linhas": todos,
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")),
                     encoding="utf-8")
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
            print("  [!] CPF achado no JSON — limpar campo no coletor e re-rodar.")
            sys.exit(2)
        print("  scan clean.")


if __name__ == "__main__":
    main()
