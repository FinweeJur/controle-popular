#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Auditor de links das fontes oficiais do Controle Popular.

== O QUE ESTE MODULO FAZ ==

Varre o acervo versionado do portal (por padrao `apps/web/data`), extrai
todas as URLs http(s) que aparecem nos arquivos de dado e testa uma a uma
para dizer quais estao vivas, mortas, bloqueadas ou fora do ar. Gera um
relatorio JSON completo e imprime um resumo no terminal.

Ele existe para atacar a divida de auditoria de links da regra da casa
(AGENTS.md secao 8.1, "Linkavel e Verificado a Fonte Oficial Direta"):
todo registro publicado precisa de hiperlink direto e especifico para a
fonte publica. Sem uma varredura automatica, link quebrado so aparece
quando um leitor sob estresse clica e nao chega a lugar nenhum.

== FONTE E REGRA DE NEGOCIO ==

- AGENTS.md secao 8.1: link oficial, direto e verificado. Home page
  generica quando existe URL canonica e considerado defeito.
- AGENTS.md secao 11 (Coleta): pausa por host e User-Agent honesto. Este
  auditor nao e um navegador; o UA diz quem ele e.
- AGENTS.md secao 6 (Armadilhas): APIs publicas respondem gzip silencioso
  (`0x1f 0x8b`); o cliente HTTP precisa descomprimir. E "API responde 200
  e mente" — aqui checamos o status de verdade, mas o leitor deve saber
  que 2xx nao prova conteudo.

== DECISOES NAO TRIVIAIS ==

1. PAUSA POR HOST: no minimo 1 segundo entre requisicoes ao MESMO host
   (dicionario de ultimo acesso). O auditor nao martela um servidor
   publico. Isso e o oposto de paralelismo agressivo: paralelizamos apenas
   ENTRE hosts diferentes (poucos workers), e cada host e atendido por um
   unico worker, entao a pausa e garantida sem locks.
2. HEAD primeiro, GET depois: HEAD e mais leve. Se o servidor nao suportar
   ou recusar (405/501/403), tentamos GET com `Range: bytes=0-0` para
   baixar apenas 1 byte. Isso evita falsos negativos de servidores que
   bloqueiam HEAD mas servem GET.
3. CLASSIFICACAO: 401/403/429 sao `bloqueado`, NAO `morto`. Sao defesa do
   servidor contra robo/automacao, nao prova de link inexistente. Tratar
   bloqueio como morte levaria a "consertar" link que funciona no
   navegador do cidadao.
4. `--limite` existe para piloto: para de COLETAR URLs assim que atinge o
   numero pedido, evitando ler os arquivos gigantes do acervo inteiro so
   para provar que o auditor funciona.

Uso:
    python scripts/auditar-links-fontes.py --limite 40
    python scripts/auditar-links-fontes.py --dirs apps/web/data \\
        --saida auditoria-links.json
    python scripts/auditar-links-fontes.py --files link-correcoes.json

Somente biblioteca-padrao do Python 3 (sem dependencias externas).
"""

from __future__ import annotations

import argparse
import concurrent.futures
import gzip
import json
import os
import re
import socket
import ssl
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlsplit

# Console do Windows (cp1252) quebra ao imprimir acentos/Unicode. Ajusta o
# stdout para UTF-8 com substituicao, conforme armadilha da secao 6 do AGENTS.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except AttributeError:  # ambiente sem reconfigure (raro)
    pass


# ---------------------------------------------------------------------------
# Constantes de configuracao
# ---------------------------------------------------------------------------

# UA honesto: diz o nome do projeto e onde encontrar o portal. NUNCA usar UA
# de navegador falso (AGENTS secao 11) — o servidor tem direito de saber quem
# esta batendo na porta.
USER_AGENT = "controle-popular-auditor (+https://www.controlepopular.com.br)"

# Extensoes que participam da varredura. Dado em JSON/CSV e texto de coletor
# (.ts/.mts/.md/.txt) costumam carregar URLs de fonte.
EXTENSOES = {".json", ".txt", ".md", ".ts", ".mts", ".csv"}

# Pastas que nunca interessam: build, dependencias e controle de versao.
PASTAS_IGNORADAS = {"node_modules", ".git", ".next", ".turbo", "dist", "build"}

# Timeout de cada requisicao, em segundos. Fontes publicas lentas existem;
# 15s e o teto combinado para nao travar a varredura.
TIMEOUT = 15

# Intervalo minimo entre requisicoes ao MESMO host, em segundos.
INTERVALO_HOST = 1.0

# Limite defensivo de tamanho de arquivo (64 MiB). O acervo medido tem no
# maximo ~24 MiB; passar disso e anomalia, e ler tudo travaria a varredura.
TAMANHO_MAX = 64 * 1024 * 1024

# Regex de URL. Para em espaco, aspas, `<`, `>` e barra invertida (JSON as
# vezes escapa a barra). O ajuste fino de pontuacao final fica em normalizar.
RE_URL = re.compile(r"https?://[^\s\"'<>\\]+", re.IGNORECASE)


# ---------------------------------------------------------------------------
# Coleta de candidatos
# ---------------------------------------------------------------------------

def normalizar_url(bruto: str) -> str | None:
    """Limpa um casamento do regex e devolve a URL ou None se nao servir.

    - Desescapa as entidades HTML mais comuns (`&amp;`).
    - Remove pontuacao final que pertence ao texto, nao a URL (virgula,
      ponto, fecha-parenteses etc.).
    - Descarta candidatos curtos/longos demais ou com espaco interno.
    """
    u = bruto.strip()
    u = u.replace("&amp;", "&").replace("&#38;", "&")
    u = u.rstrip(".,;:!?'\")]}>")
    if len(u) < 12 or len(u) > 2048:
        return None
    if not u.lower().startswith(("http://", "https://")):
        return None
    if any(c in u for c in (" ", "\t", "\n", "\r")):
        return None
    return u


def iterar_arquivos(dirs: list[str], files: list[str]):
    """Gera caminhos de arquivo a varrer, em ordem estavel.

    Percorre `dirs` recursivamente (podando pastas de build) e depois os
    `files` avulsos. Deduplica para nao testar o mesmo arquivo duas vezes.
    """
    vistos: set[str] = set()

    for base in dirs:
        raiz = Path(base)
        if raiz.is_file():
            chave = str(raiz.resolve())
            if chave not in vistos:
                vistos.add(chave)
                yield raiz
            continue
        if not raiz.exists():
            print(f"[aviso] diretorio nao encontrado: {base}", file=sys.stderr)
            continue

        for pasta, subpastas, arquivos in os.walk(raiz):
            # Poda deterministica e ordenada das subpastas.
            subpastas[:] = sorted(
                d for d in subpastas if d not in PASTAS_IGNORADAS
            )
            for nome in sorted(arquivos):
                caminho = Path(pasta) / nome
                if caminho.suffix.lower() not in EXTENSOES:
                    continue
                chave = str(caminho.resolve())
                if chave in vistos:
                    continue
                vistos.add(chave)
                yield caminho

    for item in files:
        caminho = Path(item)
        if not caminho.is_file():
            print(f"[aviso] arquivo nao encontrado: {item}", file=sys.stderr)
            continue
        chave = str(caminho.resolve())
        if chave in vistos:
            continue
        vistos.add(chave)
        yield caminho


def coletar_candidatos(
    dirs: list[str], files: list[str], limite: int
) -> tuple[dict[str, list[str]], int]:
    """Extrai URLs unicas do acervo.

    Retorna `(urls, arquivos_lidos)` onde `urls` mapeia URL -> lista de
    origens (caminhos onde apareceu). Para no `--limite` para viabilizar o
    piloto sem ler os arquivos gigantes.
    """
    urls: dict[str, list[str]] = {}
    arquivos_lidos = 0

    for caminho in iterar_arquivos(dirs, files):
        try:
            tamanho = caminho.stat().st_size
        except OSError:
            continue
        if tamanho > TAMANHO_MAX:
            print(
                f"[aviso] pulando {caminho} ({tamanho} bytes > {TAMANHO_MAX})",
                file=sys.stderr,
            )
            continue

        try:
            texto = caminho.read_text(encoding="utf-8", errors="replace")
        except OSError as erro:
            print(f"[aviso] nao li {caminho}: {erro}", file=sys.stderr)
            continue

        arquivos_lidos += 1
        # No Windows, relpath entre unidades diferentes (ex.: X: -> C:) levanta
        # ValueError. Cai no caminho absoluto para nao derrubar a varredura.
        try:
            origem = os.path.relpath(caminho)
        except ValueError:
            origem = str(caminho)

        for casamento in RE_URL.finditer(texto):
            url = normalizar_url(casamento.group(0))
            if url is None:
                continue
            origens = urls.get(url)
            if origens is None:
                urls[url] = [origem]
                if limite and len(urls) >= limite:
                    return urls, arquivos_lidos
            elif origem not in origens:
                origens.append(origem)

    return urls, arquivos_lidos


# ---------------------------------------------------------------------------
# Checagem HTTP
# ---------------------------------------------------------------------------

def _motivo_urlerror(erro: urllib.error.URLError) -> str:
    """Traduz a causa de um URLError para uma etiqueta legivel."""
    razao = getattr(erro, "reason", None)
    if isinstance(razao, (socket.timeout, TimeoutError)):
        return "timeout"
    if isinstance(razao, socket.gaierror):
        return "dns"
    if isinstance(razao, ssl.SSLError):
        return "ssl"
    return f"urlerror:{razao}"


def _talvez_gzip(corpo: bytes) -> None:
    """Descomprime gzip silencioso, sem deixar falha derrubar a checagem.

    APIs publicas respondem `0x1f 0x8b` mesmo sem o cliente pedir (armadilha
    da secao 6). Aqui so validamos que da para descomprimir; como baixamos
    poucos bytes, falha de descompressao e esperada e ignorada.
    """
    if corpo[:2] != b"\x1f\x8b":
        return
    try:
        gzip.decompress(corpo)
    except Exception:
        pass


def requisicao(url: str, metodo: str, com_range: bool = False):
    """Faz uma requisicao e devolve `(status, destino, motivo)`.

    `status` e int em resposta HTTP normal, `None` em falha de transporte.
    `motivo` so e preenchido quando `status` e None.
    """
    cabecalhos = {"User-Agent": USER_AGENT, "Accept": "*/*"}
    if com_range:
        # Pede apenas o primeiro byte: suficiente para saber se o recurso
        # existe, sem baixar o arquivo inteiro.
        cabecalhos["Range"] = "bytes=0-0"

    pedido = urllib.request.Request(url, method=metodo, headers=cabecalhos)
    try:
        with urllib.request.urlopen(pedido, timeout=TIMEOUT) as resposta:
            corpo = resposta.read(2048)
            _talvez_gzip(corpo)
            return int(resposta.getcode()), resposta.geturl(), None
    except urllib.error.HTTPError as erro:
        # HTTPError e resposta com status 4xx/5xx: existe status, nao e falha
        # de transporte. Ler 2048 bytes so para a armadilha de gzip.
        try:
            corpo = erro.read(2048)
        except Exception:
            corpo = b""
        _talvez_gzip(corpo)
        return int(erro.code), erro.geturl(), None
    except urllib.error.URLError as erro:
        return None, url, _motivo_urlerror(erro)
    except (TimeoutError, socket.timeout):
        return None, url, "timeout"
    except ssl.SSLError:
        return None, url, "ssl"
    except Exception as erro:  # rede, protocolo, encoding: nunca derruba o lote
        return None, url, f"erro:{type(erro).__name__}"


def classificar(status: int | None) -> str:
    """Converte status HTTP em uma das quatro classes do relatorio.

    - ok: 2xx e 3xx (inclui redirecionamento seguido com sucesso).
    - bloqueado: 401/403/429 — defesa do servidor, nao link morto.
    - morto: demais 4xx/5xx.
    - erro: sem status (timeout, DNS, SSL, conexao).
    """
    if status is None:
        return "erro"
    if 200 <= status < 400:
        return "ok"
    if status in (401, 403, 429):
        return "bloqueado"
    if 400 <= status < 600:
        return "morto"
    return "erro"


def checar_url(url: str) -> dict:
    """Testa uma URL e devolve o registro do relatorio.

    Tenta HEAD; se ele nao for confiavel (sem status por falha de transporte,
    ou 400/403/405/501), repete com GET + Range para nao marcar como morto
    um recurso que so bloqueia HEAD.
    """
    host = urlsplit(url).netloc.lower()
    status, destino, motivo = requisicao(url, "HEAD")

    if status is None or status in (400, 403, 405, 501):
        status_get, destino_get, motivo_get = requisicao(url, "GET", com_range=True)
        if status_get is not None:
            status, destino, motivo = status_get, destino_get, None
        elif status is None:
            status, destino, motivo = None, url, motivo_get or motivo

    return {
        "url": url,
        "host": host,
        "status": status,
        "classificacao": classificar(status),
        "motivo": motivo,
        "destino": destino if destino and destino != url else None,
    }


def processar_host(host: str, lista_urls: list[str]) -> list[dict]:
    """Checa todas as URLs de um host respeitando a pausa minima de 1s.

    Como cada host e entregue a um unico worker, a sequencia aqui e serial e
    a pausa e garantida sem lock. O ganho de paralelismo vem de hosts
    diferentes rodando ao mesmo tempo.
    """
    resultados: list[dict] = []
    ultimo_acesso = 0.0

    for url in lista_urls:
        if ultimo_acesso > 0.0:
            decorrido = time.monotonic() - ultimo_acesso
            espera = INTERVALO_HOST - decorrido
            if espera > 0:
                time.sleep(espera)
        resultados.append(checar_url(url))
        ultimo_acesso = time.monotonic()

    return resultados


def auditar(urls: dict[str, list[str]], workers: int) -> list[dict]:
    """Agrupa por host e checa tudo, paralelizando entre hosts diferentes."""
    por_host: dict[str, list[str]] = defaultdict(list)
    for url in urls:
        por_host[urlsplit(url).netloc.lower() or "(sem-host)"].append(url)

    resultados: list[dict] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
        futuros = {
            executor.submit(processar_host, host, lista): host
            for host, lista in por_host.items()
        }
        for futuro in concurrent.futures.as_completed(futuros):
            try:
                resultados.extend(futuro.result())
            except Exception as erro:  # um host nao pode derrubar a auditoria
                host = futuros[futuro]
                print(f"[aviso] host {host} falhou: {erro}", file=sys.stderr)

    # Anexa as origens (onde cada URL apareceu) para o relatorio completo.
    for registro in resultados:
        registro["origens"] = urls.get(registro["url"], [])

    return resultados


# ---------------------------------------------------------------------------
# Relatorio
# ---------------------------------------------------------------------------

def resumir(resultados: list[dict]) -> dict:
    """Conta total, classes e hosts distintos."""
    contagens = {"ok": 0, "morto": 0, "bloqueado": 0, "erro": 0}
    hosts: set[str] = set()
    for registro in resultados:
        contagens[registro["classificacao"]] = contagens.get(
            registro["classificacao"], 0
        ) + 1
        hosts.add(registro["host"])
    contagens["total"] = len(resultados)
    contagens["hosts_distintos"] = len(hosts)
    return contagens


def imprimir_resumo(contagens: dict, resultados: list[dict], limite_piores: int = 30):
    """Imprime contagens e os piores casos (mortos, erros, bloqueados)."""
    print("=" * 70)
    print("AUDITORIA DE LINKS DAS FONTES OFICIAIS")
    print("=" * 70)
    print(f"total de URLs checadas : {contagens['total']}")
    print(f"ok                     : {contagens['ok']}")
    print(f"morto                  : {contagens['morto']}")
    print(f"bloqueado (401/403/429): {contagens['bloqueado']}")
    print(f"erro (timeout/DNS/SSL) : {contagens['erro']}")
    print(f"hosts distintos        : {contagens['hosts_distintos']}")
    print("-" * 70)

    prioridade = {"morto": 0, "erro": 1, "bloqueado": 2, "ok": 3}
    piores = sorted(
        resultados,
        key=lambda r: (prioridade.get(r["classificacao"], 9), r["url"]),
    )[:limite_piores]

    if piores:
        print(f"PIORES {len(piores)} CASOS:")
        for indice, registro in enumerate(piores, 1):
            status = registro["status"] if registro["status"] is not None else "-"
            print(
                f"[{indice:02d}] {registro['classificacao'].upper():9s} "
                f"{str(status):>4s} {registro['url']}"
            )
            if registro.get("origens"):
                print(f"      origem: {registro['origens'][0]}")
    print("=" * 70)


def gravar_relatorio(caminho_saida: str, resultados: list[dict], contagens: dict):
    """Grava o relatorio JSON completo (cada URL, status, host e origem)."""
    destino = Path(caminho_saida)
    if destino.parent and str(destino.parent) != ".":
        destino.parent.mkdir(parents=True, exist_ok=True)

    relatorio = {
        "gerado_em": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "user_agent": USER_AGENT,
        "resumo": contagens,
        "urls": sorted(resultados, key=lambda r: (r["host"], r["url"])),
    }
    with destino.open("w", encoding="utf-8") as arquivo:
        json.dump(relatorio, arquivo, ensure_ascii=False, indent=2)
    print(f"relatorio gravado em: {destino}")


def analisar_argumentos(argv: list[str] | None = None) -> argparse.Namespace:
    """Define e le os argumentos de linha de comando."""
    parser = argparse.ArgumentParser(
        description="Audita links das fontes oficiais do acervo do Controle Popular."
    )
    parser.add_argument(
        "--dirs",
        nargs="+",
        default=["apps/web/data"],
        help="diretorios a varrer (padrao: apps/web/data)",
    )
    parser.add_argument(
        "--files",
        nargs="*",
        default=[],
        help="arquivos avulsos a incluir na varredura",
    )
    parser.add_argument(
        "--limite",
        type=int,
        default=0,
        help="maximo de URLs a coletar/testar (0 = sem limite; util para piloto)",
    )
    parser.add_argument(
        "--saida",
        default="auditoria-links.json",
        help="arquivo do relatorio JSON (padrao: auditoria-links.json)",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=4,
        help="workers paralelos entre hosts diferentes (padrao: 4)",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    """Orquestra coleta, checagem, resumo e gravacao."""
    args = analisar_argumentos(argv)

    inicio = time.monotonic()
    urls, arquivos_lidos = coletar_candidatos(args.dirs, args.files, args.limite)
    if not urls:
        print("nenhuma URL encontrada nos caminhos informados.", file=sys.stderr)
        return 1

    print(
        f"[etapa] {len(urls)} URLs unicas em {arquivos_lidos} arquivos; "
        f"checando com {args.workers} workers..."
    )

    resultados = auditar(urls, args.workers)
    contagens = resumir(resultados)
    imprimir_resumo(contagens, resultados)
    gravar_relatorio(args.saida, resultados, contagens)

    duracao = time.monotonic() - inicio
    print(f"tempo total: {duracao:.1f}s")
    return 0 if contagens["morto"] == 0 and contagens["erro"] == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
