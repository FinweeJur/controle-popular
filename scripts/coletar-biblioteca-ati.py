"""coletar-biblioteca-ati.py — biblioteca das Assessorias Técnicas Independentes do Paraopeba.

Grava `apps/web/data/biblioteca-ati.json`, lido no BUILD por
`apps/web/lib/paraopeba/biblioteca.ts` e exibido em `/paraopeba/biblioteca`.

Rodar:
    python scripts/coletar-biblioteca-ati.py
    python scripts/coletar-biblioteca-ati.py --seco             # não grava; só mede
    python scripts/coletar-biblioteca-ati.py --fonte aedas      # uma fonte só
    python scripts/coletar-biblioteca-ati.py --pausa 2          # mais devagar

## O que este coletor é

Um **catálogo de metadado**, não um repositório. De cada publicação ele guarda
título, data, tipo, tema, qual ATI produziu e **a URL da página do item no site
da própria ATI**. Nunca o arquivo, nunca o corpo do texto.

O veredito já estava escrito em `docs/FONTES-BRUMADINHO-UFMG.md` para o acervo
da UFMG — "linkar, não copiar" — e vale igual aqui, por dois motivos que se
somam: (1) nenhuma das três ATIs declara licença de uso do que publica, e sem
declaração expressa a obra é de direitos reservados (Lei 9.610/98, art. 7º);
(2) republicar o PDF quebraria o contador de acesso da fonte e transferiria
para este portal a responsabilidade por uma versão que pode ser corrigida lá.

Resumo (`excerpt`) só entra se a própria fonte publicar um — e nenhuma das duas
fontes desta rodada publica: o tipo `documento` da AEDAS não expõe `excerpt` na
API, e a página de item do Guaicuy não tem campo de resumo. Por isso o JSON
gravado **não tem campo de resumo**: não existe resumo cuja autoria eu pudesse
declarar, e escrever um seria eu resumindo obra de terceiro.

## Triagem de dado pessoal — onde ela roda, e por que não é aqui

A trava geral que varreria todo dado ingerido ainda não existe (adiada para
18/08). A régua que existe é `apps/web/lib/paraopeba/triagem.ts`, escrita pela
frente Paraopeba, **testada** (`triagem.test.ts`) e em TypeScript.

Este coletor NÃO reimplementa aquela régua em Python. Duas cópias da mesma
regra divergem — é a lição já registrada no cabeçalho de `triagem.ts`, que
existe justamente por a régua de `scripts/checar-dado-pessoal.py` não cobrir
dado ingerido. A triagem roda no BUILD, dentro de `biblioteca.ts`, sobre o
JSON que este script grava, e item apontado **não é publicado**. Quem quiser a
contagem chama `COBERTURA_BIBLIOTECA.barradosPelaTriagem`, medida ali.

## As duas fontes, e por que os métodos são diferentes

| Fonte | Método | Por quê |
|---|---|---|
| AEDAS (`aedasmg.org`) | `wp-json/wp/v2/documento?projeto=…` | tipo de post próprio, exposto na REST, com taxonomia de tipo/tema/projeto. Um GET de 100 em 100 resolve. |
| Guaicuy (`guaicuy.org.br`) | sitemap por tipo + página de cada item | os tipos `publicacao` e `video` **não** estão na REST (`show_in_rest` desligado, conferido em `/wp-json/wp/v2/types`). A biblioteca da ATI Paraopeba é uma página-vitrine que só mostra 3 itens de cada seção. |

A ADAI (`adaibrasil.org.br`) foi medida e **não entra**: tem 19 publicações,
todas de Amazônia/Fundo Amazônia, e **zero** com o programa `paraopeba`. O que
ela publica sobre o Paraopeba são 21 notícias — que são assunto do radar, não
desta biblioteca (ver `docs/FONTES-BIBLIOTECA-ATI.md`, seção "Notícias").

## Armadilhas medidas (2026-08-15)

1. **`guaicuy.org.br` responde HTTP 406 ao User-Agent padrão do urllib.**
   Não é bloqueio de robô: com um agente identificado o mesmo endereço devolve
   200. Sem cabeçalho próprio, o coletor "não acha nada" e o erro parece ser da
   fonte.
2. **O paginador do tema do Guaicuy mostra uma janela de páginas, não a última.**
   Parar quando o HTML não tem link para `page/N+1` faz o coletor achar que
   `publicacoes` tem 12 itens; tem 99. A parada correta é *página sem card*.
3. **`?_sft_localidade=paraopeba` (o link que a vitrine da biblioteca usa) não
   filtra nada** — o plugin que leria esse parâmetro não está ativo. Quem
   confiar na URL da vitrine mistura ATI Paraopeba com ATI Antônio Pereira. A
   localidade real está na página do item, na tarja `conteudo-tag-item`.
4. **Os projetos 3 e 299 da AEDAS se sobrepõem.** 435 + 231 não são 666: o
   mesmo documento carrega `projeto: [298, 3, 299]`. A união é deduplicada por
   id e o total medido sai no fim.
5. **O sitemap de tipo inclui a própria URL do arquivo de listagem** como
   primeiro `<loc>` (`/biblioteca/publicacoes/`). Sem descartar, vira um item
   fantasma com o título da página de arquivo.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.request
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from typing import Any, Iterable

SAIDA = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "biblioteca-ati.json"

# Agente identificado, só ASCII (cabeçalho com acento quebra cliente HTTP —
# lição de `backend/app/api/imagens.py`). O Guaicuy devolve 406 sem ele.
AGENTE = "TerrasPublicas/pesquisa (catalogo de metadados; nao baixa arquivo)"

# ── Fontes ────────────────────────────────────────────────────────────────

# Licença: nenhuma das duas declara uma. Conferido em 2026-08-15 na home, no
# rodapé e nas rotas /termos-de-uso/, /politica-de-privacidade/ e /licenca/ dos
# três sites (todas 404, exceto uma que é redirecionamento para notícia). Sem
# declaração expressa, direitos reservados — daí "link + título", só.
FONTES = {
    "aedas": {
        "ati": "aedas",
        "nome": "AEDAS — Associação Estadual de Defesa Ambiental e Social",
        "site": "https://aedasmg.org/",
        "regioes": "Regiões 1 e 2 (até janeiro/2026)",
        "licenca": "não declarada — rodapé traz apenas '2025 Associação Estadual de Defesa Ambiental e Social'; tratado como direitos reservados",
        "metodo": "WordPress REST API, tipo de post 'documento', taxonomia 'projeto'",
    },
    "guaicuy": {
        "ati": "guaicuy",
        "nome": "Instituto Guaicuy",
        "site": "https://guaicuy.org.br/",
        "regioes": "Regiões 4 e 5",
        "licenca": "não declarada — nenhuma página de termos ou licença responde; tratado como direitos reservados",
        "metodo": "sitemap por tipo de post + página de cada item (tipos 'publicacao' e 'video' não estão na REST)",
    },
}

# Os dois recortes do Paraopeba na taxonomia `projeto` da AEDAS. Medidos em
# 2026-08-15: 1.633 e 950 itens no total (de todos os tipos de post), 435 e 231
# quando restritos ao tipo `documento`.
AEDAS_PROJETOS = {3: "paraopeba", 299: "paraopeba-regiao-2"}

# Tipos de post do Guaicuy que compõem a biblioteca. `documentarios` é um
# recorte da taxonomia `especial` sobre `video`, não um tipo — por isso não
# aparece aqui: os documentários já entram como vídeo, e duplicá-los criaria
# item repetido com id diferente.
GUAICUY_TIPOS = {
    "publicacao": "Publicação",
    "video": "Vídeo",
}

# Só o que a ATI Paraopeba produziu. A taxonomia `localidade` do Guaicuy separa
# as duas assessorias que o instituto mantém (Paraopeba e Antônio Pereira) e é
# a única coisa no site que faz essa separação de forma confiável.
GUAICUY_LOCALIDADE = "paraopeba"

MESES = {
    "janeiro": 1, "fevereiro": 2, "marco": 3, "abril": 4, "maio": 5, "junho": 6,
    "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12,
}


# ── HTTP ──────────────────────────────────────────────────────────────────

class ParouPorLimite(Exception):
    """429/503 da fonte. Parar é a resposta certa — insistir é o que vira bloqueio."""


def buscar(url: str, pausa: float) -> tuple[str, dict[str, str]]:
    req = urllib.request.Request(url, headers={"User-Agent": AGENTE})
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            corpo = r.read().decode("utf-8", "replace")
            cabecalhos = {k.lower(): v for k, v in r.headers.items()}
    except urllib.error.HTTPError as e:
        if e.code in (429, 503):
            raise ParouPorLimite(f"{e.code} em {url}") from e
        raise
    time.sleep(pausa)
    return corpo, cabecalhos


def sem_acento(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def texto_limpo(s: str) -> str:
    """Tira marcação e normaliza espaço. Aplicado só a TÍTULO — nunca a corpo."""
    return re.sub(r"\s+", " ", unescape(re.sub(r"<[^>]+>", " ", s))).strip()


# ── AEDAS ─────────────────────────────────────────────────────────────────

def termos_aedas(taxonomia: str, pausa: float) -> dict[int, str]:
    corpo, _ = buscar(
        f"https://aedasmg.org/wp-json/wp/v2/{taxonomia}?per_page=100&_fields=id,name,slug",
        pausa,
    )
    return {t["id"]: texto_limpo(t["name"]) for t in json.loads(corpo)}


def coletar_aedas(pausa: float) -> list[dict[str, Any]]:
    tipos = termos_aedas("tipo-de-documento", pausa)
    temas = termos_aedas("tema", pausa)
    projetos = termos_aedas("projeto", pausa)

    # Dicionário por id: os dois projetos se sobrepõem e o mesmo documento
    # aparece nas duas consultas (armadilha 4 do cabeçalho).
    por_id: dict[int, dict[str, Any]] = {}
    for projeto_id in AEDAS_PROJETOS:
        pagina = 1
        while True:
            url = (
                "https://aedasmg.org/wp-json/wp/v2/documento"
                f"?projeto={projeto_id}&per_page=100&page={pagina}&orderby=date&order=desc"
                "&_fields=id,date,slug,link,title,tipo-de-documento,tema,projeto,categoria-transparencia"
            )
            corpo, _ = buscar(url, pausa)
            lote = json.loads(corpo)
            if not lote:
                break
            for d in lote:
                por_id[d["id"]] = d
            print(f"  aedas projeto={projeto_id} pág.{pagina}: {len(lote)}", file=sys.stderr)
            if len(lote) < 100:
                break
            pagina += 1

    itens = []
    for d in sorted(por_id.values(), key=lambda x: (x["date"], x["id"]), reverse=True):
        tipo_ids = d.get("tipo-de-documento") or []
        itens.append({
            "id": f"aedas-{d['id']}",
            "ati": "aedas",
            "fonte_id": "aedas",
            "titulo": texto_limpo(d["title"]["rendered"]),
            "data": (d.get("date") or "")[:10] or None,
            "tipo": tipos.get(tipo_ids[0], "Sem tipo") if tipo_ids else "Sem tipo",
            "temas": sorted(temas[t] for t in (d.get("tema") or []) if t in temas),
            "colecoes": sorted(
                projetos[p] for p in (d.get("projeto") or [])
                if p in projetos and p in AEDAS_PROJETOS
            ),
            "url": d["link"],
            # A API da AEDAS não expõe autor no tipo `documento`. `None` diz
            # "a fonte não declarou", que é diferente de "não tem autor" — a
            # tela precisa poder distinguir os dois.
            "autoria": None,
        })
    return itens


# ── Guaicuy ───────────────────────────────────────────────────────────────

def urls_do_sitemap(tipo: str, pausa: float) -> list[str]:
    corpo, _ = buscar(f"https://guaicuy.org.br/{tipo}-sitemap.xml", pausa)
    urls = [unescape(u) for u in re.findall(r"<loc>(.*?)</loc>", corpo)]
    # Armadilha 5: o primeiro <loc> é a própria página de arquivo do tipo.
    return [u for u in urls if not u.rstrip("/").endswith(("publicacoes", "videos"))]


RE_H1 = re.compile(r"<h1>(.*?)</h1>", re.S)
RE_META = re.compile(r'<p class="meta-post">(.*?)</p>', re.S)
RE_TAGS = re.compile(r'<div class="conteudo-tag-item">(.*?)</div>', re.S)
RE_TRILHA = re.compile(r'<div class="breadcrumb">(.*?)</div>', re.S)


def data_pt_br(texto: str) -> str | None:
    """'23 de junho, 2026, por Comunicação Guaicuy' -> '2026-06-23'."""
    m = re.search(r"(\d{1,2})\s+de\s+([a-zçãé]+),?\s+(\d{4})", sem_acento(texto).lower())
    if not m:
        return None
    mes = MESES.get(m.group(2))
    return f"{m.group(3)}-{mes:02d}-{int(m.group(1)):02d}" if mes else None


def coletar_guaicuy(pausa: float) -> list[dict[str, Any]]:
    itens: list[dict[str, Any]] = []
    for tipo, rotulo in GUAICUY_TIPOS.items():
        urls = urls_do_sitemap(tipo, pausa)
        print(f"  guaicuy {tipo}: {len(urls)} no sitemap", file=sys.stderr)
        for i, url in enumerate(urls, 1):
            corpo, _ = buscar(url, pausa)
            h1 = RE_H1.search(corpo)
            if not h1:
                print(f"    ! sem <h1>, ignorado: {url}", file=sys.stderr)
                continue
            tarjas = [texto_limpo(t) for t in RE_TAGS.findall(corpo)]
            # A tarja de localidade é a única que separa ATI Paraopeba de ATI
            # Antônio Pereira (armadilha 3). Item sem tarja fica de fora: não
            # dá para afirmar que é do Paraopeba.
            if not any(sem_acento(t).lower() == GUAICUY_LOCALIDADE for t in tarjas):
                continue
            meta = RE_META.search(corpo)
            meta_txt = texto_limpo(meta.group(1)) if meta else ""
            autoria = re.search(r",\s*por\s+(.+)$", meta_txt)
            # Tarja de origem: "Produção própria", "Produção de parceiros",
            # "Documento legal público" — é a autoria declarada pela fonte.
            origem = next((t for t in tarjas if sem_acento(t).lower().startswith(("producao", "documento legal"))), None)
            itens.append({
                "id": f"guaicuy-{url.rstrip('/').rsplit('/', 1)[-1]}",
                "ati": "guaicuy",
                "fonte_id": "guaicuy",
                "titulo": texto_limpo(h1.group(1)),
                "data": data_pt_br(meta_txt),
                "tipo": rotulo,
                "temas": [origem] if origem else [],
                # Rótulo, não slug — o mesmo vocabulário que a AEDAS usa em
                # `projeto`, para os dois lados caírem no mesmo filtro da tela.
                "colecoes": ["Paraopeba"],
                "url": url,
                "autoria": texto_limpo(autoria.group(1)) if autoria else None,
            })
            if i % 20 == 0:
                print(f"    {i}/{len(urls)} lidos, {len(itens)} do Paraopeba", file=sys.stderr)
    itens.sort(key=lambda x: (x["data"] or "", x["id"]), reverse=True)
    return itens


# ── Montagem ──────────────────────────────────────────────────────────────

COLETORES = {"aedas": coletar_aedas, "guaicuy": coletar_guaicuy}


def coletar(fontes: Iterable[str], pausa: float) -> dict[str, Any]:
    itens: list[dict[str, Any]] = []
    usadas = []
    for fid in fontes:
        print(f"[{fid}]", file=sys.stderr)
        try:
            novos = COLETORES[fid](pausa)
        except ParouPorLimite as e:
            # Parar é a resposta certa: uma coleta parcial que sobrescreve o
            # arquivo bom apaga acervo por causa de um limite temporário.
            print(f"! {e} — parando por limite da fonte", file=sys.stderr)
            raise
        itens += novos
        usadas.append({**FONTES[fid], "id": fid, "itens": len(novos)})

    return {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "fontes": usadas,
        "ficou_de_fora": (
            "ADAI (adaibrasil.org.br): 19 publicações, todas de Amazônia/Fundo Amazônia, "
            "zero com o programa 'paraopeba' — não tem documento desta bacia para catalogar. "
            "NACAB (Região 3): sem biblioteca própria publicada. "
            "Notícias das três ATIs: ficam fora desta biblioteca por decisão registrada em "
            "docs/FONTES-BIBLIOTECA-ATI.md."
        ),
        "itens": itens,
    }


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--fonte", choices=[*COLETORES, "todas"], default="todas")
    p.add_argument("--pausa", type=float, default=1.0, help="segundos entre requisições (padrão: 1)")
    p.add_argument("--seco", action="store_true", help="não grava; só mede")
    args = p.parse_args()

    fontes = list(COLETORES) if args.fonte == "todas" else [args.fonte]
    dados = coletar(fontes, args.pausa)

    # Coleta vazia NÃO sobrescreve o arquivo bom — mesma regra do radar: um dia
    # de rede ruim não pode esvaziar uma tela, e "não achei nada" é
    # indistinguível de "a rede caiu" para quem só olha o resultado.
    if not dados["itens"] and SAIDA.is_file() and not args.seco:
        print("! coleta vazia: mantendo o arquivo anterior", file=sys.stderr)
        return 1

    # Coleta parcial (--fonte) também não sobrescreve: preserva o que as outras
    # fontes já tinham, casando por fonte_id. É o que torna o script idempotente
    # por fonte em vez de destrutivo.
    #
    # ⚠️ A fusão vem ANTES da contagem, de propósito. Contar o lote recém-baixado
    # e depois gravar a união faz o script anunciar 162 e gravar 597 — número
    # sincero sobre a coisa errada. A regra do projeto é contar o que foi gravado.
    if args.fonte != "todas" and SAIDA.is_file():
        antigo = json.loads(SAIDA.read_text(encoding="utf-8"))
        mantidos = [i for i in antigo.get("itens", []) if i["fonte_id"] not in fontes]
        outras = [f for f in antigo.get("fontes", []) if f["id"] not in fontes]
        dados["itens"] = sorted(
            dados["itens"] + mantidos, key=lambda x: (x["data"] or "", x["id"]), reverse=True
        )
        dados["fontes"] = sorted(dados["fontes"] + outras, key=lambda f: f["id"])

    por_ati: dict[str, int] = {}
    por_tipo: dict[str, int] = {}
    for i in dados["itens"]:
        por_ati[i["ati"]] = por_ati.get(i["ati"], 0) + 1
        por_tipo[i["tipo"]] = por_tipo.get(i["tipo"], 0) + 1
    print(f"\n{len(dados['itens'])} itens", file=sys.stderr)
    for k, v in sorted(por_ati.items()):
        print(f"  ati {k}: {v}", file=sys.stderr)
    for k, v in sorted(por_tipo.items(), key=lambda x: -x[1]):
        print(f"  tipo {k}: {v}", file=sys.stderr)

    if args.seco:
        for i in dados["itens"][:10]:
            print(f" [{i['data'] or '????-??-??'}] {i['ati']:8} {i['tipo'][:22]:24} {i['titulo'][:70]}")
        return 0

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(dados, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"gravado em {SAIDA}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
