"""gerar-ambiental-estudos.py — transforma o bruto de audiencias no dataset da pagina.

Papel no portal: `/ambiental/estudos` (EIA/RIMA) le
`etl/betim/dados/ambiental-estudos.json`, um JSON com tres partes:
`audiencias` (ficha crua do coletor), `linhas` (uma linha por documento ou
link de repositorio) e `resumo` (contagens medidas). O coletor
`etl.apis.ambiental_audiencias` grava so o bruto; a transformacao morava
fora do repositorio e se perdeu. Este script a torna reproduzivel.

Regras de transformacao (inferidas por engenharia reversa do dataset de
20/08/2026 e conferidas por round-trip em `--comparar`):

- Audiencia COM documentos enumerados: uma linha por documento.
- Audiencia SEM documentos: UMA linha usando o primeiro link de
  `links_eia_rima`; links extras ficam na ficha crua.
- `municipio` = primeiro nome resolvido; sem resolucao, o que a fonte grafou.
- Ordem lexicografica pelo id como TEXTO (`10`, `100`, `1000`, `101`) —
  estranho, mas e o que o round-trip exige, e a pagina ordena no cliente.

Verificacao de link: HEAD com fallback GET; 2xx/3xx = ok, 404/410 =
morto_404, 401/403 = bloqueado, falha de DNS = morto_dns, timeout/5xx =
sem_resposta, erro de TLS = instavel. Portao de validacao: antes de
rechecar tudo, testa URLs de estado estavel conhecido; se o metodo nao os
reproduzir, aborta em vez de degradar o dado (numero errado e dano, §1).

Uso:
    python scripts/gerar-ambiental-estudos.py --comparar   # prova fidelidade
    python scripts/gerar-ambiental-estudos.py              # recheca e grava
    python scripts/gerar-ambiental-estudos.py --sem-reprobe  # sem rede
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import queue
import sys
import threading
import time
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import requests

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

LOG = "[gerar-ambiental-estudos]"
AQUI = Path(__file__).resolve().parent
DADOS = AQUI.parent / "dados"
BRUTO_PADRAO = DADOS / "ambiental-audiencias.json"
SAIDA_PADRAO = DADOS / "ambiental-estudos.json"
CACHE_PADRAO = AQUI / ".cache" / "links-estudos.json"
UA = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"
TIMEOUT = 45
PAUSA_POR_HOST = 1.2
MAX_CONCORRENTES = 8
FICHA_URL = "https://sistemas.meioambiente.mg.gov.br/licenciamento/site/view-audiencia?id={id}"

# HEAD mente em varios hosts (Drive devolve 500); nestes codigos, refazer por GET.
STATUS_QUE_PEDE_GET = (400, 405, 416, 501)

ROTULO_CLASSE = {
    "eia": "EIA",
    "rima": "RIMA",
    "pca": "PCA",
    "art": "ART",
    "outro": "Outro documento",
    None: "Não enumerável",
}

ROTULO_REPOSITORIO = {
    "ausente": "Sem link publicado",
    "drive": "Google Drive",
    "dropbox": "Dropbox",
    "google_sites": "Google Sites",
    "mega": "MEGA",
    "onedrive": "OneDrive",
    "orgao": "Página do órgão (não é o estudo)",
    "pdf_direto": "PDF no site do empreendedor",
    "site_proprio": "Site do empreendedor",
}

ROTULO_ESTADO = {
    "ok": "Abre",
    "bloqueado": "Acesso negado",
    "instavel": "Instável",
    "morto_404": "Quebrado (404)",
    "morto_dns": "Quebrado (domínio sumiu)",
    "nao_checado": "Não verificado",
    "sem_resposta": "Sem resposta",
}

# Ordem de "melhor estado" por audiencia: o primeiro que aparecer descreve o link.
PREFERENCIA_ESTADO = ("ok", "instavel", "bloqueado", "sem_resposta",
                      "morto_404", "morto_dns", "nao_checado")
ESTADOS_ESTAVEIS = {"ok", "morto_404", "bloqueado", "morto_dns"}
CAMPOS_IGNORADOS_NO_ROUNDTRIP = {"link_estado", "link_estado_rotulo"}


# ──────────────────────────── transformacao ──────────────────────────────

def _iso_de_br(valor: str | None) -> str | None:
    """`DD/MM/AAAA` da fonte -> `AAAA-MM-DD` (ISO). None quando ilegivel."""
    if not valor:
        return None
    try:
        dia, mes, ano = valor.strip().split("/")
        return dt.date(int(ano), int(mes), int(dia)).isoformat()
    except (ValueError, AttributeError):
        return None


def _ano_de_br(valor: str | None) -> int | None:
    iso = _iso_de_br(valor)
    return int(iso[:4]) if iso else None


def _repositorio(audiencia: dict) -> str:
    tipos = audiencia.get("repositorio_tipos") or []
    return tipos[0] if tipos else "ausente"


def _base_linha(audiencia: dict) -> dict:
    """Campos comuns a todas as linhas de uma audiencia (sem documento)."""
    nomes = audiencia.get("municipios_nomes") or []
    nao_resolvidos = audiencia.get("municipios_nao_resolvidos") or []
    publi = audiencia.get("data_publicacao")
    limite = audiencia.get("data_limite_solicitacao")
    repo = _repositorio(audiencia)
    return {
        "id_fonte": audiencia["id_fonte"],
        "empreendimento": audiencia.get("nome_empreendimento"),
        # Sem nome resolvido, o escalar mostra o que a fonte grafou e nao
        # casou (ex.: "Gouvêa"): o leitor ve o lugar, e as listas seguem
        # vazias para nao fingir codigo IBGE que nao existe.
        "municipio": nomes[0] if nomes else (nao_resolvidos[0] if nao_resolvidos else None),
        "municipios": list(nomes),
        "municipios_ids": list(audiencia.get("municipios_ids") or []),
        "unidade_regional": audiencia.get("unidade_regional"),
        "classe": audiencia.get("classe"),
        "modalidade": audiencia.get("modalidade"),
        "atividades": list(audiencia.get("atividades_descricoes") or []),
        "data_publicacao": publi,
        "data_publicacao_iso": _iso_de_br(publi),
        "ano": _ano_de_br(publi),
        "data_limite": limite,
        "data_limite_iso": _iso_de_br(limite),
        "processo": audiencia.get("numero_processo"),
        "link_ficha": FICHA_URL.format(id=audiencia["id_fonte"]),
        "repositorio": repo,
        "repositorio_rotulo": ROTULO_REPOSITORIO.get(repo, repo),
    }


def _linha_de_documento(base: dict, doc: dict, repo_link: str | None) -> dict:
    classe = doc.get("classe_estudo")
    return {
        **base,
        "link_repositorio": repo_link,
        "link_estado": None,
        "link_estado_rotulo": None,
        "nome_arquivo": doc.get("nome_arquivo"),
        "classe_estudo": classe,
        "classe_estudo_rotulo": ROTULO_CLASSE.get(classe, "Outro documento"),
        "url": doc.get("url_download"),
    }


def _linha_de_link(base: dict, link: str | None) -> dict:
    return {
        **base,
        "link_repositorio": link,
        "link_estado": None,
        "link_estado_rotulo": None,
        "nome_arquivo": None,
        "classe_estudo": None,
        "classe_estudo_rotulo": ROTULO_CLASSE[None],
        "url": link,
    }


def _linhas_da_audiencia(audiencia: dict) -> list[dict]:
    """Uma linha por documento; sem documento, UMA linha com o primeiro link."""
    base = _base_linha(audiencia)
    links = list(dict.fromkeys(audiencia.get("links_eia_rima") or []))
    documentos = audiencia.get("documentos") or []
    repo_link = links[0] if links else None
    if documentos:
        return [_linha_de_documento(base, doc, repo_link) for doc in documentos]
    return [_linha_de_link(base, repo_link)]


def construir_linhas(audiencias: list[dict]) -> list[dict]:
    """Todas as linhas, na ordem lexicografica do id como texto (ver modulo)."""
    linhas: list[dict] = []
    for audiencia in sorted(audiencias, key=lambda a: str(a["id_fonte"])):
        linhas.extend(_linhas_da_audiencia(audiencia))
    return linhas


# ─────────────────────────── verificacao de link ──────────────────────────

class _Politeness:
    """Espacamento por HOST (nao global): 1 GET por host a cada 1,2 s."""

    def __init__(self, pausa: float):
        self.pausa = pausa
        self._ultimo: dict[str, float] = {}
        self._lock = threading.Lock()

    def esperar(self, url: str) -> None:
        host = urlparse(url).netloc
        with self._lock:
            agora = time.monotonic()
            dormir = max(0.0, self._ultimo.get(host, 0.0) + self.pausa - agora)
            self._ultimo[host] = agora + dormir
        if dormir:
            time.sleep(dormir)


def _nova_sessao() -> requests.Session:
    """Sessao propria por thread: `requests.Session` nao e thread-safe."""
    sessao = requests.Session()
    sessao.headers["User-Agent"] = UA
    return sessao


def _get_curto(url: str, sessao: requests.Session) -> requests.Response:
    """GET em stream que fecha o corpo na hora — nao baixamos arquivo.

    SEM `Range`: o Drive responde 416 (Range Not Satisfiable) a `bytes=0-0`
    em varios arquivos, o que marcava link bom como morto.
    """
    resp = sessao.get(url, timeout=TIMEOUT, stream=True, allow_redirects=True)
    resp.close()
    return resp


def _e_dns(erro: Exception) -> bool:
    texto = str(erro)
    return ("NameResolution" in texto or "getaddrinfo" in texto
            or "Name or service not known" in texto)


def _url_de_sonda(url: str) -> str:
    """URL que responde de verdade para o Google Drive.

    Desde 2026 o endpoint `uc?export=download` devolve 500 para cliente sem
    cookie/JS (anti-abuso), mas o arquivo continua em `file/d/<id>/view`
    (200). Sondar o download marcaria centenas de links bons como mortos;
    sondamos a pagina do arquivo e mantemos a URL original na linha.
    """
    partes = urlparse(url)
    if "drive.google.com" not in partes.netloc and "drive.usercontent.google.com" not in partes.netloc:
        return url
    file_id = (parse_qs(partes.query).get("id") or [None])[0]
    if not file_id:
        return url
    if partes.path in ("/uc", "/open") or "usercontent" in partes.netloc:
        return f"https://drive.google.com/file/d/{file_id}/view"
    return url


def _classificar_status(status: int) -> str:
    if status in (404, 410):
        return "morto_404"
    if status in (401, 403, 429):
        return "bloqueado"
    if status >= 500:
        return "sem_resposta"
    return "ok"


def _status_via_get(url: str, sessao: requests.Session, politeness: _Politeness) -> int | str:
    """Segunda tentativa por GET. Devolve o status ou um estado-de-falha."""
    try:
        politeness.esperar(url)
        return _get_curto(url, sessao).status_code
    except requests.exceptions.SSLError:
        return "instavel"
    except requests.exceptions.RequestException as erro:
        return "morto_dns" if _e_dns(erro) else "sem_resposta"


def _status_via_head(url: str, sessao: requests.Session, politeness: _Politeness) -> int | str:
    """Primeira tentativa por HEAD; cai para GET quando o HEAD mente."""
    try:
        politeness.esperar(url)
        resposta = sessao.head(url, timeout=TIMEOUT, allow_redirects=True)
    except requests.exceptions.SSLError:
        return "instavel"
    except requests.exceptions.RequestException as erro:
        return "morto_dns" if _e_dns(erro) else _status_via_get(url, sessao, politeness)
    if resposta.status_code in STATUS_QUE_PEDE_GET or resposta.status_code >= 500:
        return _status_via_get(url, sessao, politeness)
    return resposta.status_code


def classificar(url: str | None, sessao: requests.Session, politeness: _Politeness) -> str:
    """Estado de UM link. Conservador: so 'ok' quando a fonte respondeu."""
    if not url:
        return "nao_checado"
    status = _status_via_head(_url_de_sonda(url), sessao, politeness)
    return status if isinstance(status, str) else _classificar_status(status)


def _carregar_cache(caminho: Path) -> dict[str, str]:
    if not caminho.exists():
        return {}
    try:
        return json.loads(caminho.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def _gravar_cache(caminho: Path, cache: dict[str, str]) -> None:
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text(json.dumps(cache, ensure_ascii=False, indent=1), encoding="utf-8")


def _aplicar_estados(linhas: list[dict], cache: dict[str, str]) -> None:
    """Projeta o cache de estados nas linhas (`link_estado` + rotulo)."""
    for linha in linhas:
        estado = cache.get(linha.get("url") or "", "nao_checado")
        linha["link_estado"] = estado
        linha["link_estado_rotulo"] = ROTULO_ESTADO.get(estado, estado)


def _estados_antigos_por_url(saida: Path) -> dict[str, str]:
    """Reaproveita os estados do dataset atual (modo `--sem-reprobe`)."""
    if not saida.exists():
        return {}
    antigo = json.loads(saida.read_text(encoding="utf-8"))
    return {l["url"]: l["link_estado"] for l in antigo.get("linhas", [])
            if l.get("url") and l.get("link_estado")}


class _ChecadorDeLinks:
    """Pool de threads que checa links e preenche o cache com progresso."""

    def __init__(self, cache: dict[str, str], politeness: _Politeness, caminho_cache: Path):
        self.cache = cache
        self.politeness = politeness
        self.caminho_cache = caminho_cache
        self._lock = threading.Lock()
        self._feitos = 0
        self._total = 0

    def rodar(self, pendentes: list[str]) -> None:
        self._total = len(pendentes)
        fila: queue.Queue[str] = queue.Queue()
        for url in pendentes:
            fila.put(url)
        threads = [threading.Thread(target=self._operario, args=(fila,))
                   for _ in range(min(MAX_CONCORRENTES, max(1, self._total)))]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

    def _operario(self, fila: queue.Queue[str]) -> None:
        sessao = _nova_sessao()
        while True:
            try:
                url = fila.get_nowait()
            except queue.Empty:
                return
            self._registrar(url, classificar(url, sessao, self.politeness))

    def _registrar(self, url: str, estado: str) -> None:
        with self._lock:
            self.cache[url] = estado
            self._feitos += 1
            if self._feitos % 100 == 0:
                print(f"{LOG}   {self._feitos}/{self._total} checados")
                _gravar_cache(self.caminho_cache, self.cache)


def _amostra_estavel(linhas: list[dict], amostra: int) -> list[tuple[str, str]]:
    """`(url, estado)` de amostra, uma cota por estado estavel conhecido."""
    por_estado: dict[str, list[str]] = {}
    for linha in linhas:
        estado, url = linha.get("link_estado"), linha.get("url")
        if estado in ESTADOS_ESTAVEIS and url:
            por_estado.setdefault(estado, []).append(url)
    if not por_estado:
        return []
    cota = max(1, amostra // len(por_estado))
    return [(url, estado)
            for estado, urls in por_estado.items()
            for url in urls[:cota]]


def portao_de_validacao(linhas: list[dict], sessao: requests.Session,
                        politeness: _Politeness, amostra: int = 30) -> bool:
    """Testa o metodo contra estados ESTAVEIS conhecidos antes de rechecar tudo.

    `sem_resposta` e `instavel` sao instantaneos de uma checagem anterior,
    nao propriedades do link — cobrar que se repitam puniria quem voltou a
    responder. Se menos de 90% do subconjunto estavel reproduzir o estado
    antigo, o metodo mudou e rechecar degradaria o dado (AGENTS §1).
    """
    alvos = _amostra_estavel(linhas, amostra)
    if not alvos:
        return True
    acertos = sum(1 for url, estado in alvos
                  if classificar(url, sessao, politeness) == estado)
    print(f"{LOG} portao (estados estaveis): {acertos}/{len(alvos)} "
          f"({acertos / len(alvos):.0%}) reproduzem")
    return acertos / len(alvos) >= 0.9


# ────────────────────────────────── resumo ────────────────────────────────

def _melhor_estado(estados: list[str]) -> str:
    for candidato in PREFERENCIA_ESTADO:
        if candidato in estados:
            return candidato
    return "nao_checado"


def _contar_por_repositorio(audiencias: list[dict]) -> dict[str, int]:
    contagem: dict[str, int] = {}
    for audiencia in audiencias:
        repo = _repositorio(audiencia)
        contagem[repo] = contagem.get(repo, 0) + 1
    return contagem


def _contar_por_classe(linhas: list[dict]) -> tuple[int, dict[str, int]]:
    """`(linhas com arquivo, contagem por classe)` — so linhas enumeraveis."""
    contagem: dict[str, int] = {}
    com_arquivo = 0
    for linha in linhas:
        if linha.get("nome_arquivo"):
            com_arquivo += 1
            classe = linha.get("classe_estudo")
            if classe:
                contagem[classe] = contagem.get(classe, 0) + 1
    return com_arquivo, contagem


def _estados_por_audiencia(linhas: list[dict]) -> dict[int, list[str]]:
    por_id: dict[int, list[str]] = {}
    for linha in linhas:
        por_id.setdefault(linha["id_fonte"], []).append(linha["link_estado"])
    return por_id


def montar_resumo(audiencias: list[dict], linhas: list[dict]) -> dict:
    """Contagens do topo da pagina. Definicoes explicitas, nunca digitadas."""
    municipios = {nome for a in audiencias for nome in (a.get("municipios_nomes") or [])}
    com_arquivo, por_classe = _contar_por_classe(linhas)
    links_por_estado: dict[str, int] = {}
    sem_nenhum_ok = 0
    for estados in _estados_por_audiencia(linhas).values():
        melhor = _melhor_estado(estados)
        links_por_estado[melhor] = links_por_estado.get(melhor, 0) + 1
        sem_nenhum_ok += int("ok" not in estados)
    return {
        "audiencias": len(audiencias),
        "linhas": len(linhas),
        "com_arquivo_enumeravel": com_arquivo,
        "por_repositorio": _ordenado(_contar_por_repositorio(audiencias)),
        "por_classe_estudo": _ordenado(por_classe),
        "municipios_distintos": len(municipios),
        "links_por_estado": _ordenado(links_por_estado),
        "audiencias_sem_nenhum_link_que_abre": sem_nenhum_ok,
    }


def _ordenado(contagem: dict[str, int]) -> dict[str, int]:
    return dict(sorted(contagem.items(), key=lambda kv: -kv[1]))


# ─────────────────────────────── comparacao ───────────────────────────────

def _divergencias(novo: list[dict], esperado: list[dict]) -> int:
    """Conta campos divergentes entre duas listas de linhas (round-trip)."""
    total = 0
    for indice, (a, b) in enumerate(zip(novo, esperado)):
        for chave in sorted(set(a) | set(b)):
            if chave in CAMPOS_IGNORADOS_NO_ROUNDTRIP or a.get(chave) == b.get(chave):
                continue
            if total < 15:
                print(f"{LOG} linha {indice} id={a.get('id_fonte')} campo={chave}: "
                      f"novo={a.get(chave)!r} antigo={b.get(chave)!r}")
            total += 1
    return total


def comparar(audiencias: list[dict], referencia: Path) -> int:
    """Round-trip: transforma as audiencias ANTIGAS e compara com as linhas
    antigas do arquivo publicado. Prova que as regras nao mudaram."""
    esperado = json.loads(referencia.read_text(encoding="utf-8"))["linhas"]
    novo = construir_linhas(audiencias)
    if len(novo) != len(esperado):
        print(f"{LOG} DIVERGENCIA: linhas novo={len(novo)} antigo={len(esperado)}")
        return 1
    divergencias = _divergencias(novo, esperado)
    print(f"{LOG} round-trip: {len(novo)} linhas, {divergencias} divergencia(s)")
    return 0 if divergencias == 0 else 1


# ────────────────────────────────── fluxo ────────────────────────────────

def _rechecar(args: argparse.Namespace, linhas: list[dict]) -> bool:
    cache = _carregar_cache(args.cache)
    if args.revalidar:
        alvos = {e.strip() for e in args.revalidar.split(",") if e.strip()}
        cache = {u: e for u, e in cache.items() if e not in alvos}
    politeness = _Politeness(PAUSA_POR_HOST)
    if not portao_de_validacao(_linhas_antigas(args.saida), _nova_sessao(), politeness):
        print(f"{LOG} ABORT: o metodo nao reproduz os estados antigos; nada foi gravado.",
              file=sys.stderr)
        return False
    urls = list(dict.fromkeys(l["url"] for l in linhas if l.get("url")))
    pendentes = [u for u in urls if u not in cache]
    print(f"{LOG} links: {len(urls)} unicos, {len(urls) - len(pendentes)} em cache, "
          f"{len(pendentes)} a checar")
    _ChecadorDeLinks(cache, politeness, args.cache).rodar(pendentes)
    _gravar_cache(args.cache, cache)
    _aplicar_estados(linhas, cache)
    return True


def _linhas_antigas(saida: Path) -> list[dict]:
    if not saida.exists():
        return []
    return json.loads(saida.read_text(encoding="utf-8")).get("linhas", [])


def _gravar_saida(saida: Path, audiencias: list[dict], linhas: list[dict]) -> None:
    corpo = {
        "gerado_em": dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat(),
        "fonte": "https://sistemas.meioambiente.mg.gov.br/licenciamento/site/consulta-audiencia",
        "audiencias": audiencias,
        "linhas": linhas,
        "resumo": montar_resumo(audiencias, linhas),
    }
    saida.write_text(json.dumps(corpo, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{LOG} gravado {saida} ({saida.stat().st_size / 1e6:.1f} MB)")
    print(f"{LOG} resumo: {json.dumps(corpo['resumo'], ensure_ascii=False)}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--bruto", type=Path, default=BRUTO_PADRAO)
    parser.add_argument("--saida", type=Path, default=SAIDA_PADRAO)
    parser.add_argument("--cache", type=Path, default=CACHE_PADRAO)
    parser.add_argument("--comparar", action="store_true",
                        help="so prova fidelidade contra o dataset atual; nao grava")
    parser.add_argument("--sem-reprobe", action="store_true",
                        help="nao checa links; preserva estados antigos por URL")
    parser.add_argument("--revalidar", default="",
                        help="estados (virgula) cujo cache deve ser descartado e rechecado")
    args = parser.parse_args()

    audiencias = json.loads(args.bruto.read_text(encoding="utf-8"))["audiencias"]
    print(f"{LOG} bruto: {len(audiencias)} audiencia(s)")

    if args.comparar:
        return comparar(audiencias, args.saida)

    linhas = construir_linhas(audiencias)
    if args.sem_reprobe:
        _aplicar_estados(linhas, _estados_antigos_por_url(args.saida))
    elif not _rechecar(args, linhas):
        return 1
    _gravar_saida(args.saida, audiencias, linhas)
    return 0


if __name__ == "__main__":
    sys.exit(main())
