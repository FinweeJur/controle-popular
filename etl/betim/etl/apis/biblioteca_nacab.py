r"""etl.apis.biblioteca_nacab — a biblioteca de publicações do NACAB (Núcleo
de Assessoria Comunitária da Bacia do Rio Paraopeba), a ATI (Assessoria
Técnica Independente) da Região 3 da bacia.

Fonte: `https://nacab.org.br/projeto/paraopeba-estudos-e-publicacoes/`
  Página única, WordPress/Elementor. Medida ao vivo em 2026-08-20: HTTP 200,
  411 KB, **48 PDFs distintos** (49 `href` de PDF no HTML bruto, 1 repetido —
  o boletim `NACAB-EM-CAMPO_JAN2025.pdf` aparece duas vezes seguidas dentro
  da MESMA série "Nacab em Campo", contado uma vez aqui por deduplicação de
  URL).

Irmão de biblioteca: `apps/web/lib/paraopeba/biblioteca.ts`, que hoje publica
AEDAS e Guaicuy — este coletor preenche o buraco do NACAB documentado em
`docs/_pesquisa/NACAB-ADAI-mapeamento-2026-08-19.md`.

═══ A PESQUISA DE 19/08 ESTAVA ERRADA SOBRE O USER-AGENT — CORRIGIDO AQUI ═══

O documento de pesquisa registrou "sem UA, o host devolve 406 — mesma
armadilha do Guaicuy" e recomendou UA de navegador. **Medido de novo ao
vivo em 2026-08-20, com o UA honesto do projeto
(`ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)`),
o host devolve HTTP 200.** O que quer que causasse o 406 em 19/08 não se
repete hoje, e não há razão para fingir ser navegador quando o UA real já
funciona — o projeto já reverteu um coletor que fingia UA de navegador
(ver TODO item 3b do histórico), e este módulo não reintroduz esse padrão.
`robots.txt` (`https://nacab.org.br/robots.txt`) traz `User-agent: *` /
`Disallow:` (vazio — tudo liberado) mais um `Sitemap:`, então não há
restrição a respeitar além da cortesia de uma requisição por vez.

═══ SÉRIE: O `<h2>` MAIS PRÓXIMO ACIMA, POR POSIÇÃO NO HTML ═══

Não existe atributo que amarre PDF a série — é ordem no DOM. As seis
séries anunciadas na página (Germinar, Nacab em Campo, Mobilização,
Reparação, Estudos e Relatórios — "Estudos" e "Relatórios" vivem sob um
`<h2>` ÚNICO "Estudos e Relatórios", não dois separados) são cabeçalhos
`<h2 class="elementor-heading-title">`. `_serie_para` percorre TODOS os
`<h2>` da página (inclusive os do menu, que aparecem bem antes de
qualquer PDF e nunca são a série "mais próxima acima" de um PDF de
verdade) e devolve o texto do último `<h2>` cuja posição no HTML antecede
a do link — sem lista fixa de nomes de série: se o NACAB adicionar uma
sétima série amanhã, este coletor a reconhece sem mudança de código. Um
PDF sem NENHUM `<h2>` antes dele grava `serie: null`, nunca uma série
chutada.

═══ TÍTULO: SEM TEXTO ÂNCORA, VEM DO NOME DO ARQUIVO ═══

Cada `<a href=".pdf">` envolve uma imagem de capa (miniatura/ícone), não
texto — `alt` da imagem vem vazio na amostra. `_titulo_do_nome_arquivo`
troca `_`/`-` por espaço e aplica `.title()` (`germinar_1.pdf` →
"Germinar 1"). Não é bonito para todo nome (ex.
"20260817_relatorio_analitico_prt_v2corrigido.pdf" → "20260817 Relatorio
Analitico Prt V2corrigido") mas é honesto: o portal não inventa um título
melhor que o nome do arquivo não sustenta.

═══ DATA: SÓ O QUE O CAMINHO DÁ, NUNCA A DATA DE PUBLICAÇÃO ═══

`wp-content/uploads/AAAA/MM/` é o mês de UPLOAD no WordPress, que pode não
ser o mês de publicação real (mesma cautela que `execucao-fgv.ts` já
aplica a "executado" vs. "obra pronta" — datas de sistema não são datas de
fato). `ano_mes_do_caminho` registra exatamente isso, rotulado pelo nome:
de onde veio, não o que significa. Sem inferir nada além.

═══ O QUE ESTE MÓDULO NÃO FAZ ═══

Não grava no Postgres (Neon em HTTP 402 até 2026-09-01) — só em JSON. A
coleta principal é UMA requisição (a página é só uma); "retomada" aqui
importa de verdade para `--baixar` (até 48 requisições de PDF), não para
a raspagem da página em si — refazer a raspagem é barato e sempre
completo. `--baixar` grava manifesto com sha256 do arquivo original,
pulando o que já foi baixado com sha256 batendo, e NUNCA sobrescreve um
arquivo de nome igual quando a URL é diferente (acrescenta sufixo de hash
curto ao nome local nesse caso).

Uso:

    python -m etl.apis.biblioteca_nacab --sondar
    python -m etl.apis.biblioteca_nacab --saida dados/biblioteca-nacab.json
    python -m etl.apis.biblioteca_nacab --saida X.json --baixar dados/pdfs-nacab/
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import html as html_mod
import json
import re
import sys
import time
import urllib.parse
from pathlib import Path

import requests

LOG = "[etl.apis.biblioteca_nacab]"

FONTE_URL = "https://nacab.org.br/projeto/paraopeba-estudos-e-publicacoes/"
UA = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"
TIMEOUT = 60

# Regra do projeto: uma requisição por vez, com pausa. A coleta principal é
# UMA requisição (página única); este atraso se aplica de verdade entre os
# downloads de `--baixar` (até 48 PDFs).
ATRASO_ENTRE_REQUISICOES = 2.0

SAIDA_PADRAO = Path(__file__).resolve().parents[2] / "dados" / "biblioteca-nacab.json"

_H2_RE = re.compile(r'<h2[^>]*class="elementor-heading-title[^"]*"[^>]*>(.*?)</h2>', re.S)
_PDF_A_RE = re.compile(r'<a[^>]+href="([^"]+\.pdf)"[^>]*>', re.I)
_TAG_RE = re.compile(r"<[^>]+>")
_ANO_MES_RE = re.compile(r"/uploads/(\d{4})/(\d{2})/")


class BloqueadoPelaFonte(SystemExit):
    """403/429/CAPTCHA — regra de parada do projeto: nunca retentar, nunca
    trocar User-Agent, só avisar o operador e sair."""


# ────────────────────────────── HTTP / guarda ───────────────────────────


def _sessao() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = UA
    return s


def _guardar_contra_bloqueio(status: int, corpo: str, onde: str) -> None:
    """Regra do projeto: bloqueio se decide pelo CORPO, não só pelo status.
    Roda antes de qualquer outra decisão sobre a resposta."""
    if status in (403, 429):
        raise BloqueadoPelaFonte(
            f"{LOG} HTTP {status} em {onde} — a fonte pode estar bloqueando o "
            "acesso. Pare a coleta e avise o operador; não retentar, não trocar "
            "User-Agent, não contornar."
        )
    corpo_lower = corpo.lower()
    if "captcha" in corpo_lower or "recaptcha" in corpo_lower:
        raise BloqueadoPelaFonte(
            f"{LOG} corpo de {onde} contém desafio de CAPTCHA — pare a coleta e "
            "avise o operador."
        )


def _buscar(sessao: requests.Session, url: str) -> str:
    r = sessao.get(url, timeout=TIMEOUT)
    _guardar_contra_bloqueio(r.status_code, r.text, url)
    if r.status_code != 200:
        raise RuntimeError(
            f"{LOG} {url}: HTTP {r.status_code} inesperado (corpo, 300 primeiros "
            f"chars): {r.text[:300]!r}"
        )
    return r.text


# ─────────────────────────────── parsing ────────────────────────────────


def _texto_limpo(fragmento_html: str) -> str:
    sem_tag = _TAG_RE.sub(" ", fragmento_html or "")
    return " ".join(html_mod.unescape(sem_tag).split())


def _titulo_do_nome_arquivo(nome_arquivo: str) -> str:
    """`germinar_1.pdf` -> `"Germinar 1"`. Não há texto âncora na fonte (o
    `<a>` envolve só uma imagem de capa) — o nome do arquivo é o único
    texto disponível, e por isso é honesto usá-lo em vez de inventar um
    título melhor que a fonte não fornece."""
    stem = Path(nome_arquivo).stem
    espacado = re.sub(r"[_\-]+", " ", stem)
    espacado = " ".join(espacado.split())
    return espacado.title() if espacado else nome_arquivo


def _ano_mes_do_caminho(url: str) -> str | None:
    """`/wp-content/uploads/AAAA/MM/...` -> `"AAAA-MM"`. É a única data que
    a página dá (mês de UPLOAD, não necessariamente mês de publicação) —
    registra de onde veio, nunca inventa data de publicação a partir
    dela."""
    m = _ANO_MES_RE.search(url)
    return f"{m.group(1)}-{m.group(2)}" if m else None


def _series_por_posicao(html: str) -> list[tuple[int, str]]:
    """Todo `<h2 class="elementor-heading-title">` da página, com sua
    posição no HTML bruto — inclusive os do menu (aparecem antes de
    qualquer PDF real e por isso nunca são "o `<h2>` mais próximo acima"
    de um link de verdade). Sem lista fixa de nomes de série: uma sétima
    série amanhã é reconhecida sem mudança de código."""
    return [(m.start(), _texto_limpo(m.group(1))) for m in _H2_RE.finditer(html)]


def _serie_para(posicao: int, series: list[tuple[int, str]]) -> str | None:
    """O texto do último `<h2>` cuja posição antecede `posicao`. `None`
    quando não há nenhum `<h2>` antes — regra do projeto: série
    desconhecida é `null`, nunca chutada."""
    melhor: str | None = None
    for pos_h2, texto in series:
        if pos_h2 < posicao:
            melhor = texto
        else:
            break
    return melhor


def extrair_publicacoes(html: str) -> list[dict]:
    """`[{titulo, serie, url, nome_arquivo, ano_mes_do_caminho}]`,
    deduplicado por URL (a fonte repete UM PDF duas vezes seguidas dentro
    da mesma série — medido ao vivo: `NACAB-EM-CAMPO_JAN2025.pdf`).
    Mantém a ordem de primeira ocorrência no documento."""
    series = _series_por_posicao(html)
    vistas: set[str] = set()
    publicacoes: list[dict] = []
    for m in _PDF_A_RE.finditer(html):
        url = html_mod.unescape(m.group(1))
        if url in vistas:
            continue
        vistas.add(url)
        nome_arquivo = urllib.parse.unquote(url.rsplit("/", 1)[-1])
        publicacoes.append({
            "titulo": _titulo_do_nome_arquivo(nome_arquivo),
            "serie": _serie_para(m.start(), series),
            "url": url,
            "nome_arquivo": nome_arquivo,
            "ano_mes_do_caminho": _ano_mes_do_caminho(url),
        })
    return publicacoes


# ─────────────────────────────── sondar ────────────────────────────────


def sondar() -> None:
    """Busca a página ao vivo, extrai as publicações, e imprime a
    contagem por série — nada é gravado."""
    sessao = _sessao()
    html = _buscar(sessao, FONTE_URL)
    publicacoes = extrair_publicacoes(html)

    total_hrefs_brutos = len(_PDF_A_RE.findall(html))
    print(f"{LOG} {FONTE_URL}")
    print(f"{LOG} {total_hrefs_brutos} href(s) de PDF no HTML bruto, "
          f"{len(publicacoes)} distinto(s) após deduplicar por URL.")

    contagem: dict[str | None, int] = {}
    for pub in publicacoes:
        contagem[pub["serie"]] = contagem.get(pub["serie"], 0) + 1
    print(f"{LOG} contagem por série (ordem de primeira ocorrência):")
    for serie, n in contagem.items():
        rotulo = serie if serie is not None else "(sem série — nenhum <h2> antes)"
        print(f"{LOG}   {rotulo}: {n}")

    if publicacoes:
        exemplo = publicacoes[0]
        print(f"{LOG} exemplo: {json.dumps(exemplo, ensure_ascii=False)}")


# ─────────────────────────────── sync ───────────────────────────────────


def sync(saida: Path) -> dict:
    sessao = _sessao()
    html = _buscar(sessao, FONTE_URL)
    publicacoes = extrair_publicacoes(html)

    pacote = {
        "coletado_em": dt.datetime.now(dt.timezone.utc).isoformat(),
        "fonte": FONTE_URL,
        "total": len(publicacoes),
        "publicacoes": publicacoes,
    }
    saida.parent.mkdir(parents=True, exist_ok=True)
    saida.write_text(json.dumps(pacote, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{LOG} {len(publicacoes)} publicação(ões) gravada(s) em {saida}.")
    return pacote


# ─────────────────────────────── baixar ─────────────────────────────────


def _carregar_manifesto(pasta: Path) -> dict:
    caminho = pasta / "manifesto.json"
    if not caminho.exists():
        return {}
    with open(caminho, encoding="utf-8") as f:
        return json.load(f)


def _gravar_manifesto(pasta: Path, manifesto: dict) -> None:
    (pasta / "manifesto.json").write_text(
        json.dumps(manifesto, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def _resolver_nome_local(pasta: Path, nome_arquivo: str, url: str, manifesto: dict) -> str:
    """Nunca sobrescreve um arquivo de nome igual quando a URL registrada
    para esse nome é diferente — acrescenta um sufixo de hash curto da URL
    ao nome local nesse caso."""
    nomes_em_uso = {info["nome_arquivo"]: u for u, info in manifesto.items()}
    if nome_arquivo in nomes_em_uso and nomes_em_uso[nome_arquivo] != url:
        sufixo = hashlib.sha1(url.encode("utf-8")).hexdigest()[:8]
        p = Path(nome_arquivo)
        return f"{p.stem}__{sufixo}{p.suffix}"
    return nome_arquivo


def baixar(publicacoes: list[dict], pasta: Path) -> None:
    """Baixa cada PDF para `pasta`, com manifesto de sha256. Pula o que já
    foi baixado com sha256 batendo (retomada); nunca sobrescreve arquivo
    de nome igual com URL diferente."""
    pasta.mkdir(parents=True, exist_ok=True)
    sessao = _sessao()
    manifesto = _carregar_manifesto(pasta)

    ja_ok = 0
    baixados_agora = 0
    for i, pub in enumerate(publicacoes, 1):
        url = pub["url"]
        registro = manifesto.get(url)
        nome_local = _resolver_nome_local(pasta, pub["nome_arquivo"], url, manifesto)
        destino = pasta / nome_local

        if registro and registro.get("nome_arquivo") == nome_local and destino.exists():
            ja_ok += 1
            continue

        r = sessao.get(url, timeout=TIMEOUT)
        _guardar_contra_bloqueio(r.status_code, "", url)
        if r.status_code != 200:
            print(f"{LOG} AVISO: falhou baixar {url!r} (HTTP {r.status_code}) — pulando.")
            time.sleep(ATRASO_ENTRE_REQUISICOES)
            continue

        destino.write_bytes(r.content)
        sha256 = hashlib.sha256(r.content).hexdigest()
        manifesto[url] = {
            "nome_arquivo": nome_local,
            "sha256": sha256,
            "bytes": len(r.content),
            "baixado_em": dt.datetime.now(dt.timezone.utc).isoformat(),
        }
        _gravar_manifesto(pasta, manifesto)
        baixados_agora += 1
        if i % 10 == 0 or i == len(publicacoes):
            print(f"{LOG} baixado {i}/{len(publicacoes)}: {nome_local}", flush=True)
        time.sleep(ATRASO_ENTRE_REQUISICOES)

    print(f"{LOG} fim do download: {baixados_agora} novo(s), {ja_ok} já presente(s) "
          f"(retomada), manifesto em {pasta / 'manifesto.json'}.")


# ─────────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--sondar", action="store_true", help="mede a página ao vivo, imprime contagem por série, não grava")
    parser.add_argument("--saida", type=Path, default=SAIDA_PADRAO, help="caminho do JSON de saída")
    parser.add_argument("--baixar", type=Path, help="pasta onde baixar os PDFs (opcional), com manifesto sha256")
    args = parser.parse_args()

    try:
        if args.sondar:
            sondar()
            return 0

        pacote = sync(args.saida)
        if args.baixar:
            baixar(pacote["publicacoes"], args.baixar)
        return 0
    except BloqueadoPelaFonte as e:
        print(str(e), file=sys.stderr)
        return 1
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
