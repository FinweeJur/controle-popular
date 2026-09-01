"""coletar-noticias-desastres.py — radar de noticias sobre os desastres de
Mariana (2015) e Brumadinho (2019) e o reconhecimento de atingidos (ES e BA).

Grava `apps/web/data/noticias-desastres.json`, lido no BUILD pelo bloco radar
de `/ambiental/desastres-minerarios`.

Rodar:
    python scripts/coletar-noticias-desastres.py --seco   # mostra, nao grava
    python scripts/coletar-noticias-desastres.py --dias 30

## O que este coletor e, e o que ele nao e

E um **radar**, nao um acervo: guarda titulo, veiculo, data de publicacao,
**microresumo** e link — nunca o texto da materia. Dois motivos, e o segundo
decide: guardar o corpo de reportagem e reproducao de obra de terceiro, e este
projeto publica material que vira anexo de oficio. Titulo, snippet e link sao
citacao; o corpo, nao.

Tambem **nao e fonte de fato**. Noticia diz que algo foi noticiado, na data em
que foi. O passo seguinte e sempre o documento oficial, que e o que a biblioteca
da mesma rota reune.

## O microresumo — de onde vem

O `resumo` de cada item e o snippet que a propria fonte de feed publica para a
materia (campo `<description>` do RSS do Google Noticias). Nunca e escrito por
este portal nem por modelo — se a fonte nao publica snippet, o campo fica vazio
e a tela diz "sem resumo". Ver regra: "o numero vem do dado; o modelo, se
houver, so embrulha".

## Por que estas buscas (pedido do dono, 31/08/2026)

O dono pediu radar especifico sobre **reconhecimento de atingidos na Bahia**
("recentemente teve reconhecimento de atingidos da Bahia e tem mais noticias
disso") alem de Mariana e Brumadinho. As buscas:

| Busca | Cobre |
|---|---|
| atingidos Bahia barragem OU mineracao OU reconhecimento | o pedido do dono (BA) |
| atingidos Rio Doce Espirito Santo | a bacia do Doce atingida em ES |
| Mariana Samarco Fundao reparacao | Mariana 2015 |
| Brumadinho Vale Paraopeba reparacao | Brumadinho 2019 |

## Rotulo de desastre

Cada item ganha `desastre` ("mariana" | "brumadinho" | null) inferido por termo
de LUGAR no titulo. Item sobre "atingidos da Bahia" sem vinculo claro com um dos
dois casos fica `null` — a tela mostra o rotulo "—" em vez de chutar um caso.
Errar esse rotulo seria insinuacao (regra editorial do AGENTS.md).

## Armadilhas medidas

1. **A busca do Google Noticias devolve o link do agregador, nao o do veiculo.**
   O `<source>` de cada item traz o veiculo real; sem ele, tudo apareceria como
   "news.google.com".
2. **Data de RSS vem em formato de e-mail (RFC 822)**, nao ISO. Ordenar sem
   converter poe agosto antes de julho porque "A" < "J".
3. **Snippet pode vir com marcacao HTML ou espaco duplicado** — limpar antes de
   gravar, senao a tela mostra tags cruas.
4. **Repetido entre buscas** — o mesmo texto aparece em "atingidos Rio Doce ES"
   e em "Mariana". Deduplicar pelo titulo normalizado, nao pela URL (o
   agregador reescreve a URL).
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

SAIDA = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "noticias-desastres.json"

# Só ASCII: cabeçalho com acento quebra cliente HTTP.
AGENTE = "ControlePopular/1.0 (radar de noticias; sem coleta de texto; https://controlepopular.com.br)"

BUSCAS = [
    {
        "id": "atingidos-bahia",
        "tema": "Atingidos — Bahia",
        "url": (
            "https://news.google.com/rss/search?"
            "q=atingidos+Bahia+barragem+OR+minera%C3%A7%C3%A3o+OR+reconhecimento&hl=pt-BR&gl=BR&ceid=BR:pt-419"
        ),
    },
    {
        "id": "rio-doce-es",
        "tema": "Rio Doce — Espírito Santo",
        "url": (
            "https://news.google.com/rss/search?"
            "q=atingidos+Rio+Doce+Esp%C3%ADrito+Santo+Samarco&hl=pt-BR&gl=BR&ceid=BR:pt-419"
        ),
    },
    {
        "id": "mariana",
        "tema": "Mariana — 2015",
        "url": (
            "https://news.google.com/rss/search?"
            "q=Mariana+Samarco+Fund%C3%A3o+repara%C3%A7%C3%A3o&hl=pt-BR&gl=BR&ceid=BR:pt-419"
        ),
    },
    {
        "id": "brumadinho",
        "tema": "Brumadinho — 2019",
        "url": (
            "https://news.google.com/rss/search?"
            "q=Brumadinho+Vale+Paraopeba+repara%C3%A7%C3%A3o&hl=pt-BR&gl=BR&ceid=BR:pt-419"
        ),
    },
]

# Termo de LUGAR que amarra a noticia a um dos dois casos. Minusculas, sem acento.
TERMOS_BRUMADINHO = ("brumadinho", "paraopeba", "corrego do feijao", "corrego do feijão", "b1 da vale")
TERMOS_MARIANA = ("mariana", "samarco", "fundao", "fundão", "rio doce", "novo futuro")


def _sem_acento(texto: str) -> str:
    tabela = str.maketrans("áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ",
                           "aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC")
    return texto.translate(tabela).lower()


def _baixar(url: str, tempo_limite: int = 30) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": AGENTE})
    with urllib.request.urlopen(req, timeout=tempo_limite) as resp:
        return resp.read()


def _data_iso(texto: str | None) -> str | None:
    if not texto:
        return None
    try:
        return parsedate_to_datetime(texto).astimezone(timezone.utc).isoformat()
    except (TypeError, ValueError):
        return None


def _limpar(texto: str) -> str:
    """Tira marcacao, entidades e espaco duplicado."""
    import html as _html
    return re.sub(r"\s+", " ", _html.unescape(re.sub(r"<[^>]+>", "", texto))).strip()


def _rotulo_desastre(titulo: str) -> str | None:
    alvo = _sem_acento(titulo)
    brum = any(t in alvo for t in TERMOS_BRUMADINHO)
    mari = any(t in alvo for t in TERMOS_MARIANA)
    if brum and not mari:
        return "brumadinho"
    if mari and not brum:
        return "mariana"
    # Os dois (ou nenhum) no mesmo titulo: nao chutar. Item fica null.
    return None


def coletar_busca(busca: dict) -> list[dict]:
    try:
        corpo = _baixar(busca["url"])
    except Exception as err:
        print(f"  ! {busca['id']}: nao respondeu ({err})", file=sys.stderr)
        return []
    try:
        raiz = ET.fromstring(corpo)
    except ET.ParseError as err:
        print(f"  ! {busca['id']}: resposta nao e XML ({err})", file=sys.stderr)
        return []

    itens = []
    for item in raiz.iter("item"):
        titulo = _limpar(item.findtext("title") or "")
        link = (item.findtext("link") or "").strip()
        if not titulo or not link:
            continue
        # Armadilha 1: o veiculo real esta no <source> do agregador.
        veiculo = _limpar(item.findtext("source") or "") or "veículo não identificado"
        resumo = _limpar(item.findtext("description") or "") or None
        itens.append({
            "titulo": titulo,
            "link": link,
            "veiculo": veiculo,
            "resumo": resumo,
            "tema": busca["tema"],
            "desastre": _rotulo_desastre(titulo),
            "data": _data_iso(item.findtext("pubDate")),
        })
    return itens


def coletar(dias: int) -> dict:
    corte = datetime.now(timezone.utc) - timedelta(days=dias)
    vistos: set[str] = set()
    itens: list[dict] = []

    for busca in BUSCAS:
        print(f"- {busca['id']}", file=sys.stderr)
        for item in coletar_busca(busca):
            # Armadilha 4: deduplicar pelo titulo normalizado, nao pela URL.
            chave = _sem_acento(item["titulo"])[:120]
            if chave in vistos:
                continue
            vistos.add(chave)
            if item["data"]:
                try:
                    if datetime.fromisoformat(item["data"]) < corte:
                        continue
                except ValueError:
                    pass
            itens.append(item)

    itens.sort(key=lambda i: i["data"] or "", reverse=True)

    return {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "janela_dias": dias,
        "buscas": [{"id": b["id"], "tema": b["tema"]} for b in BUSCAS],
        "lacuna_conhecida": (
            "Noticia diz que algo foi noticiado, na data em que foi - nao e fato "
            "oficial. O vinculo de uma noticia ao caso Mariana ou Brumadinho e "
            "inferido por termo de lugar no titulo; item sem vinculo claro fica "
            "sem rotulo de desastre em vez de chutar."
        ),
        "itens": itens,
    }


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--dias", type=int, default=45, help="janela de retencao (padrao: 45)")
    p.add_argument("--seco", action="store_true", help="nao grava; so mostra o resumo")
    args = p.parse_args()

    dados = coletar(args.dias)
    print(f"\n{len(dados['itens'])} itens na janela de {args.dias} dias", file=sys.stderr)

    if args.seco:
        for i in dados["itens"][:12]:
            rotulo = i["desastre"] or "—"
            print(f" [{rotulo}] [{(i['data'] or '????')[:10]}] {i['veiculo']}: {i['titulo'][:80]}")
        return 0

    # Coleta vazia NAO sobrescreve o arquivo bom.
    if not dados["itens"] and SAIDA.is_file():
        print("! coleta vazia: mantendo o arquivo anterior", file=sys.stderr)
        return 1

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(dados, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"gravado em {SAIDA}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
