"""coletar-semas-pa-licencas.py — processos/empreendimentos do SIMLAM-PA (SEMAS-PA).

Fonte: consulta pública do SIMLAM (http://monitoramento.semas.pa.gov.br/simlam/),
ASP.NET WebForms sem login: busca aberta com postback (__VIEWSTATE /
__EVENTVALIDATION) e pager numérico customizado de DataGrid. Sessão/cookie
sustentados via http.cookiejar; cada POST devolve novo __VIEWSTATE que é
reaproveitado na próxima requisição.

Estratégia (medida em 2026-09-16): ListarProcessos.aspx com busca vazia lista
163.500 processos (16.350 páginas de 10 — muito caro: 1 requisição/página +
1/processo). Como município, CNPJ, atividade e data só existem no DETALHE do
empreendimento, o coletor anda a paginação de **ListarEmpreendimento.aspx**
(postback de busca vazia: 11.403 empreendimentos, 1.141 páginas) e faz
**1 GET de VisualizarEmpreendimento.aspx?id=N por empreendimento**, que traz
gvListagemProcessos (número do processo, tipo, situação). O registro é 1 por
PROCESSO, densificado com os dados do empreendimento.

Rodar:
    python scripts/coletar-semas-pa-licencas.py --dry-run     # só contagens
    python scripts/coletar-semas-pa-licencas.py --limit 200   # teste (200 processos)
    python scripts/coletar-semas-pa-licencas.py               # padrão: 5000 processos
    python scripts/coletar-semas-pa-licencas.py --limit 0 --scan-cpf   # tudo + varredor

## Fontes e sondagem (2026-09-16, ~20 requisições de descoberta)

- ListarEmpreendimento.aspx: GET abre formulário de busca; POST com corpo
  MÍNIMO (apenas __EVENTTARGET='ctl00$baseBody$btnPesquisa', __EVENTARGUMENT,
  __VIEWSTATE, __VIEWSTATEGENERATOR, __EVENTVALIDATION — postar também os
  textboxes gera 500 "Invalid postback or callback argument" de
  EventValidation). Contagem: "Foram encontrados 114038 registros".
- Paginação: DataGrid do ASP.NET com pager customizado; link da página P+1 é
  "javascript:__doPostBack('ctl00$baseBody$dgListagem$ctl14$ctl<NN>','')";
  o coletor PARSA o link da próxima página (texto = página atual + 1) em vez
  de assumir renumeração. Uso de '__EARGLIB/Page$N' NÃO funciona (pager não é
  o GridView padrão).
- VisualizarEmpreendimento.aspx?id=N&UrlRetorno=ListarEmpreendimento.aspx:
  GET público, sem postback. Campos: lblEstado, lblMunicipio, lblRazaoSocial,
  lblNomeFantasia, lblCnpj, lblAtividadePrincipal, lblDataFundacao e tabelas
  gvProprietarios (Tipo, Nome), gvListagemProcessos (Número, Tipo, Situação).
- VisualizarProcesso.aspx (aberta para conferência): traz interessado, tipo,
  situação, tramitações com data/hora e gvAtividadesLicenciadas — NÃO abre o
  id do empreendimento, por isso a rota escolhida acima.
- robots.txt: monitoramento.semas.pa.gov.br/robots.txt -> 404 (registrado;
  não há disposição). Pausa de 3s + UA honesto em TODA requisição, inclusive
  em sequência de sucesso (>1 rps é proibido; SIMLAM sensível).
- Empreendimentos podem sobrepor (mesmo CNPJ em municípios distintos).

## PRIVACIDADE (padrão SEMA-MA/IGAM/IBAMA/INEMA-BA)

- As páginas públicas do SIMLAM não exibem CPF: gvProprietarios traz apenas
  Tipo+Nome, e o campo "CPF/CNPJ do Proprietário" do formulário é filtro, não
  listagem. Ainda assim, TODO campo de texto de TODO registro passa pelo
  varredor: run com 11 dígitos (CPF válido por mod-11) -> "[CPF redigido]" e
  doc_redigido=1; CNPJ completo (14 dígitos) é PRESERVADO.
- '--scan-cpf' roda scripts/checar-dado-pessoal-em-dado.py --extra no arquivo
  final; achado = sai com código 2 e NÃO sobrescreve.

## RESSALVA EDITORIAL

Registro do SIMLAM é republicação de ato/processo público. Processo
"Em análise" não é licença concedida; "Autuado"/"Infração" não significa
culpabilidade fixada (cabe defesa e recurso). Consultas por número continuam
no SIMLAM público: http://monitoramento.semas.pa.gov.br/simlam/
"""
from __future__ import annotations

import argparse
import http.cookiejar
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

BASE = "http://monitoramento.semas.pa.gov.br/simlam/"
URL_LISTAR = BASE + "ListarEmpreendimento.aspx"
URL_DETALHE = BASE + "VisualizarEmpreendimento.aspx?id={eid}&UrlRetorno=ListarEmpreendimento.aspx"
URL_PROC = BASE + "VisualizarProcesso.aspx?UrlRetorno=ListarProcessos.aspx&id={pid}"
UA = "ControlePopular/1.0 (+controlepopular.com.br; dado publico governamental)"
PAUSA = 3  # s entre QUALQUER par de requisições (ASP.NET pesado; <1 rps)
UF = "PA"
LIMITE_PADRAO = 5000
SAIDA = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "semas-pa-licencas.json"
CACHE = Path(__file__).resolve().parent / ".cache" / "semas-pa"

FONTES = {
    "consulta_publica": URL_LISTAR,
    "detalhe_empreendimento": URL_DETALHE,
    "detalhe_processo": URL_PROC,
    "robots_status": "monitoramento.semas.pa.gov.br/robots.txt: 404 (sem disposição)",
}

RESSALVA = ("Dados do SIMLAM-PA (consulta pública SEMAS-PA). Situação 'Em "
            "análise', 'Autuado' ou 'Notificado' NÃO encerra o processo e não "
            "é atestado de culpa nem de conformidade: cabe defesa e recurso. "
            "Consultar por número no SIMLAM: "
            + BASE)


# ---------------------------------------------------------------------------
# HTTP (cookiejar + viewstate corrente entre requisições)
# ---------------------------------------------------------------------------

try:
    import truststore
    _CTX = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
except Exception:
    _CTX = ssl.create_default_context()

_OPENER = urllib.request.build_opener(
    urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()),
    urllib.request.HTTPSHandler(context=_CTX),
)

_VS = _EV = _VG = ""  # viewstate corrente da sessão do SIMLAM


def _http(url: str, corpo: "bytes | None" = None, timeout: int = 180):
    req = urllib.request.Request(
        url, data=corpo,
        headers={"User-Agent": UA,
                 "Content-Type": "application/x-www-form-urlencoded"} if corpo else
                {"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        bruto = resp.read()
        charset = resp.headers.get_content_charset() or "utf-8"
    return bruto.decode(charset, errors="replace")


def _get(url: str) -> str:
    time.sleep(PAUSA)
    return _http(url)


def _post(url: str, campos: dict) -> str:
    """POST urlencoded; 403/429: espera 60 e repete 2x; ASP.NET erro = sinal para abort."""
    dado = urllib.parse.urlencode(campos).encode()
    tent = 0
    while True:
        time.sleep(PAUSA)
        try:
            return _http(url, dado)
        except urllib.error.HTTPError as e:
            if e.code in (403, 429):
                tent += 1
                print(f"  [!] {e.code} — esperando 60s (tentativa {tent})")
                time.sleep(60)
                if tent >= 2:
                    raise RuntimeError("bloqueio persistente (403/429) — abortando") from e
            else:
                raise


def _erro_aspx(txt: str) -> bool:
    return "Server Error in" in txt and "Event validation" in txt


def _extrair_estado(c: str) -> None:
    """Atualiza __VIEWSTATE/__EVENTVALIDATION correntes."""
    global _VS, _EV, _VG
    _VS = re.search(r'id="__VIEWSTATE"\s+value="([^"]*)"', c).group(1)
    m = re.search(r'name="__EVENTVALIDATION"[^>]*value="([^"]*)"', c)
    _EV = m.group(1) if m else ""
    m = re.search(r'name="__VIEWSTATEGENERATOR"[^>]*value="([^"]*)"', c)
    _VG = m.group(1) if m else ""


def _post_simples(target: str, arg: str = "") -> str:
    """POST MÍNIMO (só os hidden + target): postar textboxes quebra EventValidation."""
    global _VS
    txt = _post(URL_LISTAR, {"__EVENTTARGET": target, "__EVENTARGUMENT": arg,
                             "__VIEWSTATE": _VS, "__VIEWSTATEGENERATOR": _VG,
                             "__EVENTVALIDATION": _EV})
    if _erro_aspx(txt):
        raise RuntimeError("ASP.NET: erro 500 de EventValidation no postback")
    _extrair_estado(txt)
    return txt


# ---------------------------------------------------------------------------
# sanitização (igual MA): varre TODO campo de texto
# ---------------------------------------------------------------------------

RE_11D = re.compile(r"\d[\d .\-/]{7,24}\d")


def _cpf_valido(dig: str) -> bool:
    if not dig.isdigit() or len(dig) != 11 or len(set(dig)) == 1:
        return False
    for n in (9, 10):
        s = sum(int(x) * w for x, w in zip(dig[:n], range(n, 0, -1)))
        if (s * 10) % 11 % 10 != int(dig[n]):
            return False
    return True


def _apagar_cpf_em_texto(texto: str) -> str:
    """11 dígitos mod-11 válidos -> '[CPF redigido]'; 14 dígitos (CNPJ) preservado."""
    def _apagar(m):
        s = m.group(0)
        dig = re.sub(r"\D", "", s)
        if len(dig) == 14:
            return s
        if len(dig) == 11:
            if _cpf_valido(dig):
                return "[CPF redigido]"
            return s
        if len(dig) in (12, 13) and any(_cpf_valido(dig[i:i + 11]) for i in range(len(dig) - 10)):
            return "[CPF redigido]"
        return s
    return RE_11D.sub(_apagar, texto)


def _cnpj_ou_redigido(doc):
    if not doc:
        return None, False
    dig = re.sub(r"\D", "", doc)
    if len(dig) == 14:
        return dig, False
    return (None, True) if dig else (None, False)


def _limpar(v):
    if v is None:
        return None
    s = str(v).strip()
    return s if s and s.lower() not in ("nan", "none") else None


# ---------------------------------------------------------------------------
# parser do detalhe do empreendimento
# ---------------------------------------------------------------------------

RE_SPAN = re.compile(r'<span id="ctl00_baseBody_lbl(\w+)"[^>]*>([^<]*)</span>')
RE_ROW_PROC = re.compile(
    r'abrirProcesso\((\d+)\)[\s\S]{0,800}?fitNumero"\s+title="([^"]+)"[\s\S]{0,400}?'
    r'fitTipoTexto"\s+title="([^"]*)"[\s\S]{0,400}?fitSituacaoTexto"\s+title="([^"]*)"')
RE_PROP = re.compile(
    r'gvProprietarios_ctl\d+_fitTipo"\s+title="([^"]*)"[\s\S]{0,400}?'
    r'fitNome"\s+title="([^"]*)"')
RE_PAGER_LINK = re.compile(
    r"__doPostBack\(&#39;ctl00\$baseBody\$dgListagem\$ctl14\$ctl(\d+)&#39;,&#39;&#39;\)"
    r'">(\d{1,4})</a>')
RE_PAGER_ELLIPSIS = re.compile(
    r"__doPostBack\(&#39;ctl00\$baseBody\$dgListagem\$ctl14\$ctl(\d+)&#39;,&#39;&#39;\)"
    r'">\.\.\.</a>')

TIPO_REDUZIDO = [
    ("licenciamento", "licenca"),
    ("outorga", "outorga"),
    ("infração", "infracao"),  # é normalizado antes: sem acento
    ("infracao", "infracao"),
    ("autuação", "infracao"),
    ("embargo", "infracao"),
    ("interdição", "infracao"),
]


def _norm(t: str) -> str:
    t = unicodedata.normalize("NFKD", str(t))
    t = "".join(ch for ch in t if not unicodedata.combining(ch))
    return re.sub(r"\s+", " ", t).upper().strip()


def _tipo_reduzido(tipo_texto: str) -> str:
    t = _norm(tipo_texto)
    for chave, tipo in TIPO_REDUZIDO:
        if _norm(chave) in t:
            return tipo
    return "outros"


def _paginas_de(detalhe_html: str):
    """gvListagemProcessos do detalhe -> lista de dicts de processo."""
    out = []
    for m in RE_ROW_PROC.finditer(detalhe_html):
        out.append({"processo": m.group(2).strip(), "tipo": m.group(3).strip(),
                    "situacao": m.group(4).strip(), "processo_id": m.group(1)})
    return out


def _detalhe_para_registro(eid: int, html: str):
    """Detalhe do empreendimento -> dict de campos do empreendimento + processos."""
    spans = {k: _limpar(v) for k, v in RE_SPAN.findall(html)}
    cnpj, redigido = _cnpj_ou_redigido(spans.get("Cnpj", ""))
    procs = []
    seen = set()
    for p in _paginas_de(html):
        if p["processo"] in seen:
            continue
        seen.add(p["processo"])
        procs.append(p)
    reg = {
        "empreendimento_id": eid,
        "empresa": spans.get("RazaoSocial") or spans.get("NomeFantasia"),
        "nome_fantasia": spans.get("NomeFantasia"),
        "cnpj": cnpj,
        "municipio": spans.get("Municipio"),
        "uf": spans.get("Estado") or UF,
        "atividade": spans.get("AtividadePrincipal"),
        "data": spans.get("DataFundacao"),
        "proprietarios": [m.group(2).strip() for m in RE_PROP.finditer(html)],
        "processos": procs,
    }
    if redigido:
        reg["doc_redigido"] = 1
    valido = reg["empresa"] or reg["cnpj"] or procs
    if not valido:
        return None
    # dado ingerido: varre TODO campo de texto de TODO registro (AGENTS.md)
    for k, v in list(reg.items()):
        if isinstance(v, str):
            reg[k] = _apagar_cpf_em_texto(v)
        elif k == "proprietarios" and isinstance(v, list):
            reg[k] = [_apagar_cpf_em_texto(x) if isinstance(x, str) else x for x in v]
    return reg


def _contar() -> int:
    """Contagem de empreendimentos com busca vazia (1 GET + 1 POST)."""
    ini = _get(URL_LISTAR)
    if _erro_aspx(ini):
        raise RuntimeError("ListarEmpreendimento respondeu página de erro ASP.NET")
    _extrair_estado(ini)
    txt = _post_simples("ctl00$baseBody$btnPesquisa")
    m = re.search(r"Foram encontrados (\d+) registros", txt)
    return int(m.group(1)) if m else 0


def _contem_link_proxima(txt: str) -> "str | None":
    """Target do postback para (página atual + 1) do pager customizado."""
    atual = re.search(r'<span>(\d{1,4})</span>&nbsp;', txt)  # página corrente do pager
    if not atual:
        return None
    alvo = str(int(atual.group(1)) + 1)
    for m in RE_PAGER_LINK.finditer(txt):
        if m.group(2) == alvo:
            return f"ctl00$baseBody$dgListagem$ctl14$ctl{m.group(1)}"
    return None  # endereçou a última página do window -> pode haver '...'; checa __doPost de '...'


# ---------------------------------------------------------------------------
# paginação + coleta de detalhes + checkpoint
# ---------------------------------------------------------------------------

def _checkpoint() -> dict:
    CACHE.mkdir(parents=True, exist_ok=True)
    arq = CACHE / "checkpoint.json"
    if arq.exists():
        try:
            return json.loads(arq.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"empreendimentos": [], "paginas": 0, "concluido": False}


def _salvar_checkpoint(ckpt: dict) -> None:
    ckpt["ata"] = datetime.now(timezone.utc).isoformat()
    tmp = (CACHE / "checkpoint.json").with_suffix(".parcial")
    tmp.write_text(json.dumps(ckpt, ensure_ascii=False), encoding="utf-8")
    tmp.replace(CACHE / "checkpoint.json")  # Windows: rename atômico


def _gravar_detalhe_chunks(regs: list, chunk: int, ckpt: dict) -> None:
    sub = CACHE / "empreendimento"
    sub.mkdir(parents=True, exist_ok=True)
    arq = sub / f"chunk-{chunk:04d}.json"
    arq.write_text(json.dumps(regs, ensure_ascii=False, separators=(",", ":")),
                   encoding="utf-8")


def _coletar(limite: int, ckpt: dict) -> "list[dict]":
    """Anda paginação de ListarEmpreendimento e coleta detalhes; checkpoint por página."""
    registros: list[dict] = []
    alvo = None if limite == 0 else limite
    txt = _post_simples("ctl00$baseBody$btnPesquisa")  # busca vazia -> catálogo inteiro

    pagina = 1
    while pagina <= 1200:
        sub = CACHE / "empreendimento"
        sub.mkdir(parents=True, exist_ok=True)
        arq = sub / f"chunk-{pagina:04d}.json"
        if arq.exists():
            ckpt_pag = json.loads(arq.read_text(encoding="utf-8"))
            registros.extend(ckpt_pag)
            print(f"    página {pagina:,}: {len(ckpt_pag):,} processos (checkpoint)", flush=True)
        else:
            ids = [int(x) for x in
                   re.findall(r"abrirEmpreendimento\((\d+)\);", txt)]
            chunk_regs: list[dict] = []
            for eid in ids:
                if eid in ckpt["empreendimentos"]:
                    continue  # detalhe já coletado numa página anterior
                det = _get(URL_DETALHE.format(eid=eid))
                if _erro_aspx(det):
                    print(f"    [!] ASP.NET erro no detalhe {eid} — página abortada")
                    break
                r = _detalhe_para_registro(eid, det)
                if r is None:
                    ckpt["empreendimentos"].append(eid)
                    continue
                chunk_regs.append(r)
                ckpt["empreendimentos"].append(eid)
            registros.extend(chunk_regs)
            _gravar_detalhe_chunks(chunk_regs, pagina, ckpt)
            ckpt["paginas"] = max(ckpt["paginas"], pagina)
            _salvar_checkpoint(ckpt)
            print(f"    página {pagina:,}: {len(ids)} empreendimentos -> "
                  f"{len(chunk_regs)} registros ({len(registros):,} no total)", flush=True)
        if alvo is not None and len(registros) >= alvo:
            break
        prox = _contem_link_proxima(txt)
        if prox is None:
            m_fim = RE_PAGER_ELLIPSIS.search(txt)
            if m_fim:
                prox = f"ctl00$baseBody$dgListagem$ctl14$ctl{m_fim.group(1)}"
                print("    [i] pager saltou de janela (linha '...'), seguindo")
            else:
                break  # fim do catálogo
        txt = _post_simples(prox)
        pagina += 1
    return registros if alvo is None else registros[:alvo]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Coleta SEMAS-PA / SIMLAM licenciamento (ASP.NET WebForms)")
    parser.add_argument("--dry-run", action="store_true", help="só conta (GET+POST)")
    parser.add_argument("--limit", type=int, default=LIMITE_PADRAO,
                        help="trunca registros de processo (0 = tudo; padrão 5000)")
    parser.add_argument("--scan-cpf", action="store_true",
                        help="roda o varredor oficial de CPF ao final")
    args = parser.parse_args()

    print("=== SEMAS-PA licenciamento (SIMLAM, monitoramento.semas.pa.gov.br) ===\n")
    print(f"  fonte  : {URL_LISTAR}")
    print(f"  limite : {'sem limite' if args.limit == 0 else args.limit}")
    print(f"  robots : 404 em monitoramento.semas.pa.gov.br — pausa {PAUSA}s, UA honesto")
    print(f"  saida  : {SAIDA}")

    try:
        total_fonte = _contar()
    except Exception as e:
        print(f"\n[cancelado] contagem falhou: {e}")
        print("  Nada coletado ou inventado. Verificar serviço e re-rodar.")
        sys.exit(2)
    print(f"  empreendimentos na fonte: {total_fonte:,}")

    if args.dry_run:
        print("  (dry-run: nada além destas contagens foi baixado)")
        return

    ckpt = _checkpoint()
    produtos = _coletar(args.limit, ckpt)

    # 1 linha por processo, denormalizada
    todos: list[dict] = []
    for emp in produtos:
        for p in emp.get("processos", []):
            lin = {
                "processo": p["processo"],
                "tipo": _tipo_reduzido(p["tipo"]),
                "tipo_texto": p["tipo"],
                "empresa": emp.get("empresa"),
                "cnpj": emp.get("cnpj"),
                "proprietarios": emp.get("proprietarios"),
                "municipio": emp.get("municipio"),
                "uf": emp.get("uf") or UF,
                "data": emp.get("data"),
                "situacao": p["situacao"],
                "atividade": emp.get("atividade"),
                "fonte_url": URL_PROC.format(pid=p["processo_id"]),
            }
            if emp.get("doc_redigido"):
                lin["doc_redigido"] = 1
            todos.append(lin)

    # dedup por número de processo (empreendimento pode aparecer 2×)
    vistos = set()
    dedup = []
    for r in todos:
        if r["processo"] in vistos:
            continue
        vistos.add(r["processo"])
        dedup.append(r)
    todos = dedup
    print(f"  total: {len(todos):,} registros de processo "
          f"(de {len(produtos):,} empreendimentos, após dedup)")

    resumo_sit = {}
    resumo_tipo = {}
    for r in todos:
        for d, s in ((resumo_sit, r["situacao"] or "(sem situação)"),
                     (resumo_tipo, r["tipo"])):
            d[s] = d.get(s, 0) + 1

    dados = {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "fonte": URL_LISTAR,
        "fontes": FONTES,
        "total_fonte": total_fonte,
        "truncado": bool(args.limit) and len(todos) < len(produtos),
        "colunas": ["processo", "tipo", "empresa", "cnpj", "municipio", "uf",
                    "data", "situacao", "atividade", "fonte_url"],
        "obs": "CNPJ completo (14 dígitos) preservado; CPF nunca é gravado: "
               "run de 11 dígitos (mod-11) vira '[CPF redigido]' e "
               "doc_redigido=1. gvProprietarios do SIMLAM público só traz "
               "Tipo+Nome — sem CPF explícito. Registro por PROCESSO, dados "
               "do empreendimento densificados.",
        "ressalva_editorial": RESSALVA,
        "resumo_por_situacao": dict(sorted(resumo_sit.items(), key=lambda kv: -kv[1])),
        "resumo_por_tipo": dict(sorted(resumo_tipo.items(), key=lambda kv: -kv[1])),
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
