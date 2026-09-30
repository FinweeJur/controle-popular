"""Coleta o corpo dos posts do "Calendario Insurgente" para gerar resumos.

Entrada:  TEMP/blog-calendario.json (169 posts: titulo, url, autor)
Saida:    TEMP/blog-corpos.json  ({url: paragrafo-fonte})

Por que: os resumos da Mistica do Dia tem que vir do texto da propria
fonte, no estilo de escrita dela (regra do dev, 30/09/2026). O JSON da
listagem do blog traz titulo e URL, nao o corpo - sem este script o
resumo do blog ficava vazio (158 de 538 entradas estavam assim).

## Fonte e licenca

- Blog "Aos que vira" (Calendario Insurgente), WordPress.com, 169 posts
  de 2020, de Gustavo Seferian e Carla Benitez Martins.
- Texto de documento publico em blog aberto; citacao e link de volta
  ao post.

## Decisao robots.txt (consultado em 2026-09-30)

- https://aosquevirao.home.blog/robots.txt: libera o crawl (Disallow so
  em /wp-admin/, /wp-login.php e afins); manda usar o firehose para
  rastreamento continuo - a coleta aqui e unica e documental, 169 URLs,
  nao e rastreamento continuo. Segue com UA honesta e pausa.

## Decisoes tecnicas

- User-Agent honesto: ControlePopular/1.0 (+controlepopular.com.br;
  transparencia) - regra de AGENTS.md, secao 11.
- Pausa de 1,5 s entre posts (mesmo host), timeout 30 s, 3 tentativas
  com backoff; checkpoint por URL em TEMP/blog-corpos-checkpoint.json,
  entao retomavel (AGENTS.md, secao 11: retomada por checkpoint).
- O paragrafo e extraido do .entry-content e cortado na primeira
  divulgacao do WordPress (sharedaddy, relatedposts) ou em 900 chars -
  resumo e 1-2 frases, o suficiente.
- Nao escreve no repositorio: so o gerador do calendario faz isso.
"""
from __future__ import annotations

import html
import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

TEMP = Path(r"C:\Users\teste\AppData\Local\Temp\opencode")
ENTRADA = TEMP / "blog-calendario.json"
CHECKPOINT = TEMP / "blog-corpos-checkpoint.json"
DESTINO = TEMP / "blog-corpos.json"

UA = "ControlePopular/1.0 (+controlepopular.com.br; transparencia)"
PAUSA_S = 1.5
TIMEOUT_S = 30
TENTATIVAS = 3

# Fim do corpo do post no markup do WordPress.com: bloco de compartilhamento,
# posts relacionados ou contagem de visitantes.
FIM_CORPO = re.compile(r'sharedaddy|jp-relatedposts|wpcnt|post-views', re.I)
PARAGRAFO = re.compile(r"<p\b[^>]*>(.*?)</p>", re.I | re.S)
# 6 dos 169 posts sao so imagem: o texto-fonte e o caption da figura
# (ex.: "A imagem mostra Nagy, preso, entre seus algozes...").
LEGENDA = re.compile(r"<figcaption\b[^>]*>(.*?)</figcaption>", re.I | re.S)
TAG = re.compile(r"<[^>]+>")
NAO_RESUMO = re.compile(
    r"^\s*(por\s+\w|foto de|imagem de|fonte:|via\s|leia tamb[aé]m)", re.I
)


def buscar(url: str) -> str:
    """Busca o HTML de um post com UA honesta, pausa e backoff."""
    ultimo_erro: Exception | None = None
    for tentativa in range(TENTATIVAS):
        try:
            pedido = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(pedido, timeout=TIMEOUT_S) as resp:
                return resp.read().decode("utf-8", "replace")
        except (urllib.error.URLError, TimeoutError) as erro:
            ultimo_erro = erro
            time.sleep(2 ** tentativa * 2)
    raise RuntimeError(f"falhou apos {TENTATIVAS} tentativas: {url}: {ultimo_erro}")


def extrair_corpo(html_texto: str) -> str:
    """Primeiro paragrafo substancial do .entry-content do post."""
    inicio = html_texto.find('entry-content')
    if inicio < 0:
        return ""
    corpo = html_texto[inicio:]
    corte = FIM_CORPO.search(corpo)
    if corte:
        corpo = corpo[: corte.start()]
    for padrao in (PARAGRAFO, LEGENDA):
        for bruto in padrao.findall(corpo):
            texto = html.unescape(TAG.sub(" ", bruto))
            texto = re.sub(r"\s+", " ", texto).strip()
            # ignora assinatura, legenda de foto e linha de "leia tambem"
            if len(texto) < 60 or NAO_RESUMO.match(texto):
                continue
            return texto[:900]
    return ""


def main() -> int:
    posts = json.loads(ENTRADA.read_text(encoding="utf-8-sig"))
    checkpoint: dict[str, str] = {}
    if CHECKPOINT.exists():
        # utf-8-sig: aceita BOM se o arquivo foi mexido no PowerShell
        checkpoint = json.loads(CHECKPOINT.read_text(encoding="utf-8-sig"))
    print(f"posts: {len(posts)} | ja coletados: {len(checkpoint)}", flush=True)

    feitos_antes = len(checkpoint)
    for i, post in enumerate(posts, 1):
        url = post["url"]
        if url in checkpoint:
            continue
        try:
            corpo = extrair_corpo(buscar(url))
        except RuntimeError as erro:
            print(f"  ERRO {erro}", flush=True)
            corpo = ""
        checkpoint[url] = corpo
        CHECKPOINT.write_text(
            json.dumps(checkpoint, ensure_ascii=False, indent=1), encoding="utf-8"
        )
        marca = "ok" if corpo else "sem-corpo"
        print(f"  [{i}/{len(posts)}] {marca} {url.rsplit('/', 2)[-2]}", flush=True)
        time.sleep(PAUSA_S)

    # so entra no JSON final quem tem corpo (resumo vem do texto-fonte)
    finais = {u: t for u, t in checkpoint.items() if t}
    DESTINO.write_text(
        json.dumps(finais, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    print(
        f"coletados nesta rodada: {len(checkpoint) - feitos_antes} | "
        f"com corpo: {len(finais)}/{len(posts)} | saida: {DESTINO}",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
