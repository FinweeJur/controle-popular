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
from html import unescape

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
SAIDA_EMPRE = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "semas-pa-empreendimentos.json"
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
    try:
        return bruto.decode(charset)
    except UnicodeDecodeError:
        # O SIMLAM manda header utf-8 com corpo latin-1: "Pará" sai "Par�" e
        # nome de município quebrado não casa com o catálogo do IBGE.
        return bruto.decode("latin-1")


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
    """Mod-11 com os pesos CERTOS: 10..2 no primeiro dígito, 11..2 no segundo.

    A versão anterior usava `range(n, 0, -1)` (9..1 e 10..1) e por isso dava
    False em CPF real — ou seja, o varredor nunca apagava nada e a privacidade
    dependia de sorte. Achado em 17/11/2026 por outro coletor do mesmo repo,
    que comparou com `scripts/checar-dado-pessoal-em-dado.py`."""
    if not dig.isdigit() or len(dig) != 11 or len(set(dig)) == 1:
        return False
    for ate, pos in ((9, 9), (10, 10)):
        soma = sum(int(dig[i]) * (ate + 1 - i) for i in range(ate))
        resto = (soma * 10) % 11
        if (0 if resto == 10 else resto) != int(dig[pos]):
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
RE_PAGER_ITEM = re.compile(
    r"__doPostBack\(&#39;ctl00\$baseBody\$dgListagem\$ctl14\$ctl(\d+)&#39;,&#39;&#39;\)"
    r'">([^<]{1,10})</a>')

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
    if not m:
        # Contagem ausente já aconteceu (18/11/2026): a busca voltou sem o
        # rótulo, `_contar` devolveu 0, e o guarda de "catálogo incompleto"
        # deixou de valer porque comparava com zero. Melhor abortar.
        raise RuntimeError("a busca não trouxe 'Foram encontrados N registros'")
    return int(m.group(1))


def _alvo_proxima(txt: str, pagina: int) -> "str | None":
    """Target do postback para a página `pagina + 1` do pager customizado.

    `pagina` é o NOSSO contador, não o que a tela diz. A versão anterior lia a
    página corrente de `<span>N</span>` e, quando o alvo saía da janela, clicava
    no `...` sem saber para onde ia: em 17/11/2026 isso entrou num ciclo de 10
    páginas (chunks 10, 21, 32 traziam as mesmas linhas) e 67 páginas renderam
    199 empreendimentos únicos.

    O pager medido ao vivo mostra uma janela de 10 páginas: na página 10 vem
    `1..9, <span>10</span>, ...` e o `...` leva à 11; na 20, `... 11..19, <span>
    20</span>, ...` e o `...` da DIREITA leva à 21. Por isso: número `pagina+1`
    na tela é alvo exato; sem ele, o ÚLTIMO `...` do documento é o avanço
    (o primeiro é o retrocesso); sem nenhum, é o fim do catálogo."""
    itens = [{"target": f"ctl00$baseBody$dgListagem$ctl14$ctl{m.group(1)}",
              "texto": m.group(2).strip()}
             for m in RE_PAGER_ITEM.finditer(txt)]
    for it in itens:
        if it["texto"] == str(pagina + 1):
            return it["target"]
    reticencias = [it for it in itens if it["texto"] == "..."]
    return reticencias[-1]["target"] if reticencias else None


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


def _coletar(limite: int, ckpt: dict) -> "tuple[list[dict], bool]":
    """Anda paginação de ListarEmpreendimento e coleta detalhes; checkpoint por página.

    Devolve `(registros, concluiu)`. `concluiu` só é True quando o pager chega
    ao fim: o laço antigo parava em 1.200 páginas fixas (12.000 de 115.980) e
    gravava `truncado: false` — mentira silenciosa."""
    registros: list[dict] = []
    alvo = None if limite == 0 else limite
    txt = _post_simples("ctl00$baseBody$btnPesquisa")  # busca vazia -> catálogo inteiro

    pagina = 1
    concluiu = False
    while True:
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
        prox = _alvo_proxima(txt, pagina)
        if prox is None:
            concluiu = True  # fim do catálogo
            break
        txt = _post_simples(prox)
        pagina += 1
    return registros if alvo is None else registros[:alvo], concluiu


# ---------------------------------------------------------------------------
# modo empreendimentos: só a lista, 1 linha por empreendimento
# ---------------------------------------------------------------------------

# A lista é a única página pública que traz MUNICÍPIO por linha (o filtro
# `ddlMunicipio` do site é ignorado pelo servidor — medido em 17/11/2026).
# Uma requisição por página de 10 linhas: 11.598 páginas ~ 9h40 a 3 s, contra
# ~106 h do modo completo, que ainda faz 1 GET de detalhe por empreendimento.
RE_LINHA = re.compile(r"<tr>(.*?)</tr>", re.S)
RE_CELULA = {
    "razao_social": r'fitNomeRazaoSocialDominacao"[^>]*>(.*?)</span>',
    "cnpj": r'fitCnpj"[^>]*>(.*?)</span>',
    "inscricao_estadual": r'fitInteressado"[^>]*>(.*?)</span>',
    "municipio": r'fitMunicipio"[^>]*>(.*?)</span>',
}


def _ler_lista(txt: str) -> "list[dict]":
    """As 10 linhas da grade: empreendimento + razão social + CNPJ + I.E + município."""
    linhas: list[dict] = []
    for bloco in RE_LINHA.findall(txt):
        m_id = re.search(r"abrirEmpreendimento\((\d+)\)", bloco)
        if not m_id:
            continue
        reg = {"id_simlam": int(m_id.group(1))}
        for campo, rx in RE_CELULA.items():
            m = re.search(rx, bloco, re.S)
            valor = unescape(m.group(1)).strip() if m else ""
            if campo == "razao_social" and valor:
                limpo = _apagar_cpf_em_texto(valor)
                if limpo != valor:
                    reg["doc_redigido"] = 1
                valor = limpo
            reg[campo] = valor or None
        linhas.append(reg)
    return linhas


def _coletar_empreendimentos(ckpt: dict, total_fonte: int,
                             offline: bool = False) -> "tuple[list[dict], bool]":
    """Pagina ListarEmpreendimento e guarda a lista; checkpoint por página.

    Retomar não economiza requisição (o pager do ASP.NET não tem acesso
    aleatório: chegar à página 5.000 custa 5.000 POSTs de qualquer jeito), mas
    economiza o dado: chunk já gravado não se perde se a rodada cair."""
    por_id: dict[int, dict] = {}
    concluiu = False
    vistos: set[tuple] = set()  # ciclo de páginas já custou 67 requisições em 17/11
    sub = CACHE / "lista"
    sub.mkdir(parents=True, exist_ok=True)
    if offline:
        # Sem rede: monta a partir dos chunks que existem e para no primeiro que
        # falta. É o caminho quando a fonte fecha no meio da rodada — em
        # 18/11/2026 o SIMLAM passou a exigir login e as páginas de detalhe
        # viraram 404, com 1.393 páginas já salvas.
        pagina = 1
        while (sub / f"chunk-{pagina:05d}.json").exists():
            linhas = json.loads((sub / f"chunk-{pagina:05d}.json")
                                .read_text(encoding="utf-8"))
            for reg in linhas:
                por_id.setdefault(reg["id_simlam"], reg)
            pagina += 1
        print(f"    cache: {pagina - 1} página(s), {len(por_id):,} empreendimentos "
              f"(sem tocar na fonte)", flush=True)
        return list(por_id.values()), False
    txt = _post_simples("ctl00$baseBody$btnPesquisa")
    pagina = 1
    while True:
        arq = sub / f"chunk-{pagina:05d}.json"
        if arq.exists():
            linhas = json.loads(arq.read_text(encoding="utf-8"))
        else:
            linhas = _ler_lista(txt)
            arq.write_text(json.dumps(linhas, ensure_ascii=False, separators=(",", ":")),
                           encoding="utf-8")
            ckpt["paginas"] = pagina
            _salvar_checkpoint(ckpt)
            if pagina % 50 == 1:
                print(f"    página {pagina:,}: {len(por_id) + len(linhas):,} "
                      f"empreendimentos", flush=True)
        chave = tuple(sorted(r["id_simlam"] for r in linhas))
        if chave in vistos:
            raise RuntimeError(
                f"pager voltou para uma página já vista (página {pagina}, "
                f"empreendimento {linhas[0]['id_simlam'] if linhas else '-'}): "
                f"rodada abortada para não gravar catálogo repetido como completo")
        vistos.add(chave)
        for reg in linhas:
            por_id.setdefault(reg["id_simlam"], reg)
        prox = _alvo_proxima(txt, pagina)
        if prox is None:
            # "Sem próximo link" só é fim de catálogo se o que já temos bate com o
            # que a fonte anuncia. Em 18/11/2026 uma página veio sem pager na
            # 1.393 de 11.598 e o coletor gravou `concluido: true` — o
            # supervisor então "terminou" o trabalho com 12% do catálogo.
            if len(por_id) < total_fonte:
                raise RuntimeError(
                    f"pager sumiu na página {pagina} com {len(por_id):,} de "
                    f"{total_fonte:,} empreendimentos — não marco concluído")
            concluiu = True
            break
        txt = _post_simples(prox)
        pagina += 1
    return list(por_id.values()), concluiu



def main() -> None:
    parser = argparse.ArgumentParser(
        description="Coleta SEMAS-PA / SIMLAM licenciamento (ASP.NET WebForms)")
    parser.add_argument("--dry-run", action="store_true", help="só conta (GET+POST)")
    parser.add_argument("--limit", type=int, default=LIMITE_PADRAO,
                        help="trunca registros de processo (0 = tudo; padrão 5000)")
    parser.add_argument("--scan-cpf", action="store_true",
                        help="roda o varredor oficial de CPF ao final")
    parser.add_argument("--empreendimentos", action="store_true",
                        help="modo rápido: só a lista (1 linha por empreendimento, "
                             "com município) — sem o GET de detalhe por empreendimento")
    parser.add_argument("--so-cache", action="store_true",
                        help="monta o JSON a partir dos chunks já gravados, sem tocar "
                             "na fonte (para quando o portal fecha no meio da rodada)")
    args = parser.parse_args()

    print("=== SEMAS-PA licenciamento (SIMLAM, monitoramento.semas.pa.gov.br) ===\n")
    print(f"  fonte  : {URL_LISTAR}")
    print(f"  limite : {'sem limite' if args.limit == 0 else args.limit}")
    print(f"  robots : 404 em monitoramento.semas.pa.gov.br — pausa {PAUSA}s, UA honesto")
    print(f"  saida  : {SAIDA}")

    if args.so_cache:
        total_fonte = 0  # a fonte não é consultada; o total entra como desconhecido
        print("  modo   : --so-cache (sem rede)")
    else:
        try:
            total_fonte = _contar()
        except Exception as e:
            print(f"\n[cancelado] contagem falhou: {e}")
            print("  Nada coletado ou inventado. Verificar serviço e re-rodar.")
            print("  Se a intenção é publicar o que já está no cache: --so-cache")
            sys.exit(2)
        print(f"  empreendimentos na fonte: {total_fonte:,}")

    if args.dry_run:
        print("  (dry-run: nada além destas contagens foi baixado)")
        return

    ckpt = _checkpoint()

    if args.empreendimentos:
        print(f"  modo   : empreendimentos (sem detalhe) -> {SAIDA_EMPRE.name}")
        linhas, concluiu = _coletar_empreendimentos(ckpt, total_fonte,
                                                    offline=args.so_cache)
        por_municipio: dict[str, int] = {}
        for r in linhas:
            chave = r["municipio"] or "(sem município)"
            por_municipio[chave] = por_municipio.get(chave, 0) + 1
        dados = {
            "gerado_em": datetime.now(timezone.utc).isoformat(),
            "fonte": URL_LISTAR,
            "fontes": FONTES,
            "total_fonte": total_fonte or None,
            "total_fonte_nota": (None if total_fonte else
                                 "a fonte não pôde ser consultada nesta rodada "
                                 "(portal fechado); 115.980 empreendimentos foi o "
                                 "medido em 17/11/2026"),
            "truncado": not concluiu,
            "paginas": ckpt.get("paginas"),
            "colunas": ["id_simlam", "razao_social", "cnpj", "inscricao_estadual",
                        "municipio"],
            "obs": "Catálogo de EMPREENDIMENTOS do SIMLAM público, um por linha da "
                   "lista, com o município que a própria lista publica. Não é "
                   "licença: tipo, validade e situação vivem no detalhe do "
                   "empreendimento e no processo, que este modo não baixa "
                   "(ver --help e o cabeçalho). A lista repete linha com razão "
                   "social '.' e CNPJ vazio — é do site, não do coletor.",
            "ressalva_editorial": RESSALVA,
            "total_empreendimentos": len(linhas),
            "municipios": len(por_municipio),
            "resumo_por_municipio": dict(sorted(por_municipio.items(),
                                                key=lambda kv: -kv[1])),
            "linhas": linhas,
        }
        SAIDA_EMPRE.parent.mkdir(parents=True, exist_ok=True)
        SAIDA_EMPRE.write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")),
                               encoding="utf-8")
        tam_kb = SAIDA_EMPRE.stat().st_size / 1024
        print(f"\n[ok] {len(linhas):,} empreendimentos em {len(por_municipio)} municípios "
              f"-> {SAIDA_EMPRE.name} ({tam_kb:,.0f} KB)"
              + ("" if concluiu else
                 (f" — PARCIAL: {total_fonte:,} na fonte" if total_fonte
                  else " — PARCIAL: total da fonte desconhecido nesta rodada")))
        ckpt["concluido"] = concluiu
        _salvar_checkpoint(ckpt)
        return

    produtos, concluiu = _coletar(args.limit, ckpt)

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
        "truncado": bool(args.limit) or not concluiu,
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
