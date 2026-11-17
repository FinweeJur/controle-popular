"""coletar-mppa-pa-tacs.py — TAC (Termo de Ajustamento de Conduta) do MPPA (Pará).

Fonte oficial: acervo de TAC do Conselho Superior do Ministério Público do
Estado do Pará, publicado por força da Resolução nº 002/2018 do Conselho
Superior (cópia integral e extrato enviados ao Conselho):

    https://www2.mppa.mp.br/areas/institucional/conselho/tacs-de-{ano}.htm   (2013–2026, menos 2019)
    https://www.mppa.mp.br/areas/institucional/conselho/tacs-2019.htm        (2019 só existe no host `www`, sem o `-de`)

Medido em 17/11/2026 (sondagem em docs/historico/descobertas/ambiental-PA-mppa-tac.md,
15 páginas requisitadas, UA `finweejur/github artur colito`, 1,6–1,8 s de pausa):

- 14 páginas-ano (2013–2026; a sondagem pediu 15 URLs porque 2019 foi tentado
  nos dois hosts), 414 linhas de tabela, ~391 com link "Íntegra";
- 89 linhas (21%) com promotoria de Meio Ambiente/Ambiental no nome;
- páginas de 94.177 B a 159.666 B; a página de erro do Lumis tem 788 B;
- nenhum filtro por município, nenhuma paginação, nenhum export, nenhuma API
  (o iframe `simpacervo/explorer.jsf` devolve 404 e só planta cookie de sessão);
- `robots.txt` de `www.mppa.mp.br` e `www2.mppa.mp.br`: 404 (nada bloqueado,
  nenhum `Disallow`); sem login, sem CAPTCHA.

Diferença entre a sondagem e a saída: a sondagem contou linha **com link de
documento** (414). Este coletor lê toda linha da tabela: 451 brutas, 422 depois
de remover 29 duplicadas (a página de 2018 repete o mesmo TAC 27 vezes) — as 33
linhas marcadas "SIGILOSO" na fonte não têm link e por isso ficavam de fora da
contagem da sondagem. Promotoria ambiental: 105 (25%).

Por que HTML e não API: a tabela por ano é a única lista pública de TAC do
MPPA. Não existe endpoint, e o acervo não tem campo de município nem de tema.

Por que NÃO baixar os PDFs: são ~391 íntegras; a íntegra conferida tem
1.843.177 B e o extrato 71.068 B. A linha guarda a URL do PDF; quem precisa do
objeto baixa o extrato sob demanda.

Por que checkpoint em disco: a rodada da madrugada atravessa máquina dormindo,
rede caindo e fonte negando 403. Cada página-ano validada fica em
`scripts/.cache/mppa-pa/` e a rodada RETOMA de onde parou — página em cache não
se baixa de novo. O JSON final é SEMPRE remontado a partir do cache, então
rodada interrompida no meio não perde o que já veio.

Rodar:
    python scripts/coletar-mppa-pa-tacs.py --dry-run   # só conta página e linha
    python scripts/coletar-mppa-pa-tacs.py             # grava o JSON

## Ética e privacidade

- User-Agent honesto `finweejur/github artur colito`, 2 s entre requisições ao
  mesmo host. 403/429 aborta na hora: não insiste, não roda disfarçado.
- A coluna "Partes" traz nome de pessoa física junto do CNPJ da empresa
  (medido: "… LTDA (Maurício Paracampos Junior)"). Ela é DESCARTADA inteira:
  o coletor lê só procedimento, data, órgão de execução e links. Nenhum nome
  de parte e nenhum CNPJ entram na saída.
- Todo campo de texto passa pelo varredor mod-11: run de 11 dígitos válido
  vira `null` e a linha ganha `doc_redigido: 1`. CPF nunca é gravado.

## Ressalva editorial

TAC firmado NÃO é sentença nem confissão: é compromisso entre as partes, pode
ter sido cumprido, aditado ou extinto, e o MPPA não publica status nem
descumprimento. A promotoria citada é o órgão que assinou, não prova de dano
no município do nome dela.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import ssl
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # console Windows é cp1252

from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

TAG = "[coletar-mppa-pa-tacs]"
UA = "finweejur/github artur colito"
PAUSA = 2  # s entre QUALQUER par de requisições ao host (regra do repo: 1–2 s)
HOST = "https://www2.mppa.mp.br"
HOST_WWW = "https://www.mppa.mp.br"
CONSELHO = "/areas/institucional/conselho/"
ANOS = range(2013, 2027)
MIN_CORPO = 20_000  # menor página medida 94.177 B; página de erro do Lumis: 788 B

CACHE = Path(__file__).resolve().parent / ".cache" / "mppa-pa"
MANIFESTO = CACHE / "manifesto.json"
SAIDA = (Path(__file__).resolve().parent.parent
         / "apps" / "web" / "data" / "mppa-pa-tacs.json")

FONTES = {
    "por_ano": HOST + CONSELHO + "tacs-de-{ano}.htm (2013–2026, menos 2019)",
    "2019": HOST_WWW + CONSELHO + "tacs-2019.htm",
    "pagina_mae": HOST_WWW + "/tacs.htm",
    "robots": "404 em www.mppa.mp.br e www2.mppa.mp.br (17/11/2026) — nada bloqueado",
    "medicao": ("17/11/2026 — sondagem: 14 páginas-ano (15 URLs, 2019 nos dois "
                "hosts), 414 linhas com link, 89 (21%) com promotoria ambiental; "
                "rodada do coletor: 451 linhas brutas, 422 após dedupe, "
                "105 (25%) ambientais"),
}

RESSALVA = ("TAC firmado NÃO é sentença nem confissão de dano: é compromisso "
            "entre as partes, que pode ter sido cumprido, aditado ou extinto — "
            "o MPPA não publica status de cumprimento. O órgão de execução é "
            "quem assinou o termo, não prova de que o dano ocorreu no município "
            "citado no nome da promotoria. Consulta oficial: "
            + HOST_WWW + "/tacs.htm")

COLUNAS = ["id", "ano", "numero", "data", "orgao", "ambiental", "sigiloso",
           "url_integra", "url_extrato", "aditivo", "doc_redigido"]


class BloqueioFonte(RuntimeError):
    """403/429 da fonte: parar, não insistir."""


try:
    import truststore
    _CTX = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
except Exception:
    _CTX = ssl.create_default_context()


def _url_do_ano(ano: int) -> str:
    """2019 é o único ano no host `www` e sem o `-de` (medido em 17/11/2026)."""
    if ano == 2019:
        return HOST_WWW + CONSELHO + "tacs-2019.htm"
    return f"{HOST}{CONSELHO}tacs-de-{ano}.htm"


def _norm(t) -> str:
    t = unicodedata.normalize("NFKD", str(t or ""))
    t = "".join(ch for ch in t if not unicodedata.combining(ch))
    return re.sub(r"\s+", " ", t).upper().strip()


def _limpar_espaco(t: str) -> str:
    return re.sub(r"\s+", " ", str(t or "").replace("\xa0", " ")).strip()


def _http(url: str, timeout: int = 120) -> bytes:
    """GET com UA honesto e pausa. Status 200 com corpo vazio NÃO é sucesso."""
    time.sleep(PAUSA)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, context=_CTX, timeout=timeout) as resp:
            bruto = resp.read()
    except urllib.error.HTTPError as e:
        if e.code in (403, 429):
            raise BloqueioFonte(
                f"HTTP {e.code} em {url} — pare aqui, não insista") from e
        raise
    if not bruto:
        raise RuntimeError(f"HTTP 200 com corpo de 0 byte em {url}")
    return bruto


def _validar_pagina(bruto: bytes, ano: int) -> str:
    """Valida o CORPO, não só o status: 200 com 788 B já veio como erro do Lumis."""
    if len(bruto) < MIN_CORPO:
        raise RuntimeError(
            f"{ano}: corpo de {len(bruto)} B (mínimo medido {MIN_CORPO} B) — "
            f"página de erro, não de TAC")
    texto = bruto.decode("utf-8", "replace")
    if "<table" not in texto or "Promotoria" not in texto:
        raise RuntimeError(f"{ano}: corpo sem tabela de TAC (a página mudou)")
    return texto


def _obter_pagina(ano: int) -> "tuple[str, str]":
    """(html, origem) — origem 'cache' ou 'fonte'. Página em cache NÃO se rebaixa.

    O cache só vale se passou na validação de corpo (é isso que foi gravado);
    arquivo truncado abaixo do mínimo medido é ignorado e a página volta à fonte.
    """
    arq = CACHE / f"tacs-{ano}.htm"
    if arq.exists() and arq.stat().st_size >= MIN_CORPO:
        return arq.read_text(encoding="utf-8", errors="replace"), "cache"
    bruto = _http(_url_do_ano(ano))
    texto = _validar_pagina(bruto, ano)
    CACHE.mkdir(parents=True, exist_ok=True)
    arq.write_text(texto, encoding="utf-8")
    return texto, "fonte"


# ---------------------------------------------------------------------------
# sanitização: CPF nunca é gravado (mesmo padrão dos coletores da casa)
# ---------------------------------------------------------------------------

RE_DATA = re.compile(r"\d{2}/\d{2}/\d{4}")
RE_CPF_FMT = re.compile(r"\d{3}\.\d{3}\.\d{3}-\d{2}")
RE_11_SOLTO = re.compile(r"(?<!\d)\d{11}(?!\d)")  # só run SOLTO; não corta protocolo


def _cpf_valido(dig: str) -> bool:
    """Mod-11 com os pesos 10..2 (o critério de `scripts/checar-dado-pessoal-em-dado.py`)."""
    if not dig.isdigit() or len(dig) != 11 or len(set(dig)) == 1:
        return False
    for ate in (9, 10):
        soma = sum(int(dig[i]) * (ate + 1 - i) for i in range(ate))
        resto = (soma * 10) % 11
        if (0 if resto == 10 else resto) != int(dig[ate]):
            return False
    return True


def _apagar_cpf_em_texto(texto: str) -> str:
    """CPF formatado ou run de 11 dígitos SOLTO e válido por mod-11 -> '[CPF redigido]'.

    Run de 12/13 dígitos NÃO é tocado: é o protocolo do MPPA
    ("SIMP n.º 004837-040/2018"), e cortá-lo destruiria o identificador do termo.
    """
    def _apagar(m):
        return "[CPF redigido]" if _cpf_valido(m.group(0)) else m.group(0)
    texto = RE_CPF_FMT.sub(lambda m: "[CPF redigido]"
                           if _cpf_valido(re.sub(r"\D", "", m.group(0))) else m.group(0),
                           texto)
    return RE_11_SOLTO.sub(_apagar, texto)


def _sanitizar(valor):
    """(valor, redigido). Campo que é SÓ um CPF válido vira None, como manda a regra."""
    if valor is None:
        return None, False
    s = str(valor)
    novo = _apagar_cpf_em_texto(s)
    if novo == s:
        return valor, False
    return (None if novo == "[CPF redigido]" else novo), True


def _sanitizar_url(url):
    """URL do PDF: CPF dentro do caminho derruba o link (link quebrado é pior).

    O protocolo no nome do arquivo ("protocolo n 0048370402018.pdf") tem 12–13
    dígitos e NÃO é CPF: só run de 11 dígitos solto e válido condena a URL.
    """
    if url is None:
        return None, False
    if any(_cpf_valido(m.group(0)) for m in RE_11_SOLTO.finditer(url)):
        return None, True
    return url, False


# ---------------------------------------------------------------------------
# parser da tabela (uma por página; 4 colunas; a 4ª — "Partes" — não é lida)
# ---------------------------------------------------------------------------

class _LeitorTabela(HTMLParser):
    """Guarda as linhas da PRIMEIRA tabela cujo cabeçalho tem "Partes" e "execu".

    Só as colunas 1 (procedimento + links), 2 (data) e 3 (órgão de execução)
    são expostas. O texto da coluna "Partes" nunca entra em `texto` nem em
    `links`: nome de pessoa física não é lido, não é guardado.
    """

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.profundidade = 0
        self.linhas: list[list[dict]] = []
        self.achou = False
        self._cabecalho: list[str] = []
        self._rows: list[list[dict]] = []
        self._celulas = None
        self._texto = None
        self._links = None
        self._link = None

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            self.profundidade += 1
            if self.profundidade == 1:
                self._cabecalho, self._rows = [], []
            return
        if self.profundidade != 1:
            return
        if tag == "tr":
            self._celulas = []
        elif tag in ("td", "th"):
            if self._celulas is None:
                self._celulas = []
            self._texto, self._links = [], []
        elif tag == "a" and self._links is not None:
            self._link = [dict(attrs).get("href") or "", []]
            self._links.append(self._link)

    def handle_endtag(self, tag):
        if tag == "table":
            self.profundidade -= 1
            if self.profundidade == 0 and not self.achou:
                cab = _norm(" ".join(self._cabecalho))
                if "PARTES" in cab and "EXECU" in cab:
                    self.linhas = [r for r in self._rows if len(r) >= 4]
                    self.achou = True
            return
        if self.profundidade != 1:
            return
        if tag == "a":
            self._link = None
        elif tag in ("td", "th"):
            texto = _limpar_espaco("".join(self._texto or []))
            if tag == "th":
                self._cabecalho.append(texto)
            elif self._celulas is not None:
                self._celulas.append({"texto": texto, "links": self._links or []})
            self._texto = self._links = None
        elif tag == "tr":
            if self._celulas:
                self._rows.append(self._celulas)
            self._celulas = None

    def handle_data(self, data):
        if self.profundidade > 1:
            return
        if self._link is not None:  # texto de âncora não polui o número
            self._link[1].append(data)
        elif self._texto is not None:
            self._texto.append(data)


def _resolver(href: str, base: str) -> "str|None":
    """`../../../data/files/…` resolve contra a página; o caminho certo é a raiz do host."""
    if not href:
        return None
    url = urllib.parse.urljoin(base, href)
    return url if "/data/files/" in url else None


def _linha(celulas: list[dict], ano: int, base: str) -> "dict|None":
    """Linha da tabela -> dicionário, ancorada na célula de DATA.

    A grade muda de página para página (4 células; 5 quando o link de íntegra
    ganha célula própria) e a data vem às vezes com texto junto ("TAC
    03/04/2017 Aditamento 16/03/2018", "25/06/2024 (Termo de Retificação)"),
    por isso a âncora é "célula 1 ou 2 que CONTÉM dd/mm/aaaa". Lê-se o que vem
    ANTES (procedimento + links) e a célula SEGUINTE (órgão de execução).
    "Partes" vem depois do órgão e nunca é lida. Linha de layout, sem data,
    devolve None — não é TAC.
    """
    i_data = next((i for i in (1, 2) if i < len(celulas)
                   and RE_DATA.search(celulas[i]["texto"])), None)
    if i_data is None or i_data + 1 >= len(celulas):
        return None
    numero = _limpar_espaco(" ".join(c["texto"] for c in celulas[:i_data])) or None
    texto_data = celulas[i_data]["texto"]
    data = RE_DATA.search(texto_data).group(0)
    orgao = celulas[i_data + 1]["texto"] or None

    integra = extrato = None
    aditivo = int(any(p in _norm(texto_data)
                      for p in ("ADITAMENTO", "ADITIVO", "RETIFICACAO")))
    for celula in celulas[:i_data]:
        for href, pedacos in celula["links"]:
            rot = _norm("".join(pedacos))
            url = _resolver(href, base)
            if "INTEGRA" in rot:
                integra = integra or url
                aditivo = aditivo or int("ADITIVO" in rot)
            elif "EXTRATO" in rot:
                extrato = extrato or url
            elif "ADITIVO" in rot:
                aditivo = 1

    sigiloso = int("SIGILOSO" in _norm(numero))
    if sigiloso:
        numero = _limpar_espaco(re.sub(r"(?i)sigiloso", "", numero)) or None

    lin = {"ano": ano, "numero": numero, "data": data, "orgao": orgao,
           "ambiental": int("MEIO AMBIENTE" in _norm(orgao)
                            or "AMBIENTAL" in _norm(orgao)),
           "sigiloso": sigiloso,
           "url_integra": integra, "url_extrato": extrato, "aditivo": aditivo}
    redigido = False
    for campo in ("numero", "data", "orgao"):
        lin[campo], apagou = _sanitizar(lin[campo])
        redigido = redigido or apagou
    for campo in ("url_integra", "url_extrato"):
        lin[campo], apagou = _sanitizar_url(lin[campo])
        redigido = redigido or apagou
    lin["id"] = hashlib.sha1(
        f"{ano}|{lin['numero']}|{lin['orgao']}|{lin['data']}".encode()).hexdigest()[:12]
    if redigido:
        lin["doc_redigido"] = 1
    return {c: lin.get(c) for c in COLUNAS}


def ler_pagina(html: str, ano: int) -> "tuple[list[dict], int]":
    """(linhas de TAC, linhas de layout ignoradas)."""
    leitor = _LeitorTabela()
    leitor.feed(html)
    leitor.close()
    if not leitor.achou:
        raise RuntimeError(
            f"{ano}: tabela de TAC não encontrada no corpo (cabeçalho mudou)")
    linhas, ignoradas = [], 0
    for celulas in leitor.linhas:
        lin = _linha(celulas, ano, _url_do_ano(ano))
        if lin is None:
            ignoradas += 1
        else:
            linhas.append(lin)
    return linhas, ignoradas


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def _carregar_manifesto() -> dict:
    if MANIFESTO.exists():
        try:
            return json.loads(MANIFESTO.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            pass
    return {"paginas": {}}


def _gravar_manifesto(m: dict) -> None:
    CACHE.mkdir(parents=True, exist_ok=True)
    m["atualizado_em"] = datetime.now(timezone.utc).isoformat()
    MANIFESTO.write_text(json.dumps(m, ensure_ascii=False, indent=1), encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Coleta os TAC publicados pelo Conselho Superior do MPPA (Pará)")
    ap.add_argument("--dry-run", action="store_true",
                    help="só conta páginas e linhas; não grava o JSON")
    ap.add_argument("--scan-cpf", action="store_true",
                    help="roda o varredor oficial de CPF ao final")
    args = ap.parse_args()

    print(f"{TAG} TAC do MPPA (Pará) — acervo do Conselho Superior")
    print(f"{TAG} fonte : {HOST}{CONSELHO}tacs-de-{{ano}}.htm + 2019 em {HOST_WWW}")
    print(f"{TAG} ritmo : {PAUSA}s entre requisições, UA honesto, 403/429 aborta")
    print(f"{TAG} cache : {CACHE} (retoma daqui; página em cache não se rebaixa)")

    manifesto = _carregar_manifesto()
    paginas = manifesto.setdefault("paginas", {})
    linhas: list[dict] = []
    falhas: list[int] = []
    bloqueio = None

    for ano in ANOS:
        chave = str(ano)
        try:
            html, origem = _obter_pagina(ano)
            do_ano, ignoradas = ler_pagina(html, ano)
            paginas[chave] = {
                "url": _url_do_ano(ano),
                "origem": origem,
                "bytes_html": len(html.encode("utf-8")),
                "tac": len(do_ano),
                "linhas_de_layout_ignoradas": ignoradas,
                "ok": True,
                "lido_em": datetime.now(timezone.utc).isoformat(),
            }
            linhas.extend(do_ano)
            b_html = paginas[chave]["bytes_html"]
            print(f"{TAG} {ano}: {len(do_ano)} linha(s) [{origem}, "
                  f"{f'{b_html:,}'.replace(',', '.')} B]", flush=True)
        except BloqueioFonte as e:
            bloqueio = e
            paginas[chave] = {"url": _url_do_ano(ano), "ok": False, "erro": str(e)}
            falhas.append(ano)
            print(f"{TAG} {ano}: BLOQUEADO — {e}", flush=True)
            break
        except Exception as e:  # página ruim não derruba a madrugada inteira
            paginas[chave] = {"url": _url_do_ano(ano), "ok": False, "erro": str(e)}
            falhas.append(ano)
            print(f"{TAG} {ano}: FALHOU — {e}", flush=True)
        _gravar_manifesto(manifesto)

    _gravar_manifesto(manifesto)

    # dedup: a fonte repete linha (medido: 26 cópias do MESMO TAC em 2018) e às
    # vezes publica o mesmo termo duas vezes, uma com link e outra "SIGILOSO".
    # Fica uma linha só e o link da cópia que tinha link.
    por_id: dict[str, dict] = {}
    for lin in linhas:
        antigo = por_id.get(lin["id"])
        if antigo is None:
            por_id[lin["id"]] = lin
            continue
        for campo in ("url_integra", "url_extrato"):
            if not antigo[campo] and lin[campo]:
                antigo[campo] = lin[campo]
        antigo["sigiloso"] = int(antigo["sigiloso"] and lin["sigiloso"]
                                 and not antigo["url_integra"]
                                 and not antigo["url_extrato"])
        antigo["aditivo"] = max(antigo["aditivo"], lin["aditivo"])
    duplicadas = len(linhas) - len(por_id)
    linhas = list(por_id.values())
    linhas.sort(key=lambda l: (l["ano"], l["data"] or "", l["numero"] or ""))

    resumo_ano: dict[str, int] = {}
    for lin in linhas:
        resumo_ano[str(lin["ano"])] = resumo_ano.get(str(lin["ano"]), 0) + 1
    resumo_ano = {str(a): resumo_ano[str(a)] for a in ANOS if str(a) in resumo_ano}

    if args.dry_run:
        print(f"\n{TAG} dry-run: {len(paginas)} página(s) no cache/manifesto, "
              f"{len(linhas)} linha(s), {sum(1 for l in linhas if l['ambiental'])} "
              f"com promotoria ambiental; {len(falhas)} falha(s). Nada gravado.")
        return

    truncado = bool(falhas)
    n_amb = sum(1 for r in linhas if r["ambiental"])
    n_redigido = sum(1 for r in linhas if r.get("doc_redigido"))
    n_sem_integra = sum(1 for r in linhas if not r["url_integra"])
    n_sigiloso = sum(1 for r in linhas if r["sigiloso"])
    n_aditivo = sum(1 for r in linhas if r["aditivo"])
    resumo_orgao: dict[str, dict[str, int]] = {}
    for r in linhas:
        chave = r["orgao"] or "(sem órgão)"
        d = resumo_orgao.setdefault(chave, {"total": 0, "ambiental": 0})
        d["total"] += 1
        d["ambiental"] += r["ambiental"]

    dados = {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "fonte": HOST + CONSELHO + "tacs-de-{ano}.htm",
        "fontes": FONTES,
        "total_fonte": len(linhas),
        "truncado": truncado,
        "colunas": COLUNAS,
        "obs": (
            f"{len(linhas)} TAC em {len(resumo_ano)} página(s)-ano (2013–2026), "
            f"{n_amb} com promotoria de Meio Ambiente/Ambiental no nome do órgão "
            "de execução (recorte por TEXTO, não campo: a fonte não classifica "
            "tema nem município). A fonte NÃO publica total, nem filtro, nem "
            "paginação, nem API: `total_fonte` é a soma das linhas lidas das "
            "páginas-ano, não um número declarado pelo MPPA. "
            f"A coluna 'Partes' foi DESCARTADA inteira em todas as linhas "
            "(traz nome de pessoa física junto do CNPJ da empresa): a saída não "
            "tem nome de parte nem CNPJ, só procedimento, data, órgão de "
            f"execução e links. CPF nunca é gravado — {n_redigido} linha(s) "
            "redigida(s) nesta rodada (run de 11 dígitos válido por mod-11 vira "
            "null + doc_redigido=1). "
            f"{n_sem_integra} linha(s) sem link de íntegra ({n_sigiloso} marcada(s) "
            f"SIGILOSO na fonte, {n_sem_integra - n_sigiloso} só com extrato) e "
            f"{n_aditivo} com aditivo/retificação. Os PDFs NÃO são baixados: a "
            "URL vai na linha "
            "(íntegra medida em 1.843.177 B, extrato em 71.068 B). "
            f"2019 só existe em {HOST_WWW}{CONSELHO}tacs-2019.htm (o host www2 "
            "devolve 404 nesse ano). "
            f"{duplicadas} linha(s) duplicada(s) removida(s) por id."
        ),
        "ressalva_editorial": RESSALVA,
        "paginas": paginas,
        "resumo_por_ano": resumo_ano,
        "resumo_por_orgao": resumo_orgao,
        "com_promotoria_ambiental": n_amb,
        "linhas": linhas,
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")),
                     encoding="utf-8")
    tam_kb = f"{SAIDA.stat().st_size / 1024:,.0f}".replace(",", ".")
    print(f"\n{TAG} [ok] {len(linhas)} TAC -> {SAIDA.name} ({tam_kb} KB)")
    for ano, n in resumo_ano.items():
        print(f"{TAG}   {ano}: {n}")
    print(f"{TAG}   ambiental: {n_amb} de {len(linhas)}")
    if truncado:
        print(f"{TAG}   ⚠ TRUNCADO: página(s) sem leitura: {falhas}"
              " — rode de novo para completar")

    if args.scan_cpf:
        print(f"\n{TAG} rodando o varredor de CPF sobre a saída...")
        import subprocess
        r = subprocess.run([sys.executable, "scripts/checar-dado-pessoal-em-dado.py",
                            "--extra", str(SAIDA)])
        if r.returncode != 0:
            print(f"{TAG} [!] CPF achado no JSON — limpar o campo e re-rodar.")
            sys.exit(2)
        print(f"{TAG} scan clean.")

    if bloqueio:
        print(f"\n{TAG} [cancelado] {bloqueio}\n"
              f"{TAG} o JSON parcial foi gravado a partir do cache; "
              "não insista na fonte hoje.")
        sys.exit(3)


if __name__ == "__main__":
    main()
