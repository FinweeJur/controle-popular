"""coletar-noticias-paraopeba.py — radar diário de notícias sobre Brumadinho e o Paraopeba.

Grava `apps/web/data/noticias-paraopeba.json`, lido no BUILD pelo bloco
Paraopeba. Complementa o clipping histórico do painel-fonte: aquele é acervo
curado e fechado, este é o que saiu desde então.

Rodar:
    cd pipeline && python acervo_noticias.py
    python acervo_noticias.py --dias 30     # janela de retenção
    python acervo_noticias.py --seco        # mostra o que coletaria, não grava

## O que este coletor é, e o que ele não é

É um **radar**, não um acervo. Ele guarda título, data, veículo e link — nunca
o texto da matéria. Dois motivos, e o segundo é o que decide: guardar o texto
de reportagem é reprodução de obra de terceiro, e este projeto publica material
que vira anexo de ofício. Título e link são citação; o corpo, não.

Também **não é fonte de fato**. Notícia diz que algo foi noticiado, na data em
que foi. A tela de alertas existe para avisar "olhe isto", e o passo seguinte é
sempre o documento oficial — que é o que a biblioteca de `/app/acervo` reúne.

## As fontes, e por que estas

| Fonte | O que traz | Por que está aqui |
|---|---|---|
| MAB | a voz de quem foi atingido | é parte no caso, e a única fonte que noticia o que não vira pauta |
| Agência Brasil | imprensa pública federal | licença aberta e cobertura de decisão judicial |
| Google Notícias (busca) | agregação ampla | é o que dá cobertura regional, que os dois primeiros não têm |

⚠️ **TJMG e MPMG ficaram de fora, e não por escolha:** os endereços de RSS dos
dois respondem **HTTP 404** (conferido em 14/08/2026 em `tjmg.jus.br/rss/
noticias.xml` e `mpmg.mp.br/rss`). São justamente as fontes que publicariam a
decisão em primeira mão. Enquanto não se achar o feed atual — ou se aceitar
raspar HTML, que é mais frágil —, o alerta sobre ato judicial chega pela
imprensa, com o atraso e o filtro dela. Isso está dito na tela, não só aqui.

## Armadilhas medidas

1. **A busca do Google Notícias devolve o link do agregador, não o do veículo.**
   O `<source>` do item traz o nome real do veículo; sem ele, tudo apareceria
   como "news.google.com" e a tela mentiria sobre a origem.
2. **Todo feed é filtrado — inclusive o do MAB, e isso foi uma correção.**
   A primeira versão deixava o MAB passar inteiro, com o argumento de que ele
   "fala do assunto o tempo todo". A execução seca desmentiu na hora: das 10
   matérias da janela, a maioria era a pauta nacional do movimento (Pará,
   Tocantins, Amazônia, eleição) — pertinentes ao MAB, não a este radar. Um
   argumento plausível sobre o conteúdo de um feed vale menos que uma leitura
   dele.
   E o filtro exige termo de **lugar** (Brumadinho, Paraopeba, Córrego do
   Feijão), não termo de tema: "barragem" e "atingidos" sozinhos deixam entrar
   rompimento de outro estado, que é notícia legítima e não é deste caso.
3. **Data de RSS vem em formato de e-mail** (RFC 822, "Wed, 13 Aug 2026 10:00:00
   -0300"), não ISO. Ordenar as strings sem converter põe agosto antes de julho
   porque "A" < "J".
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

SAIDA = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "noticias-paraopeba.json"

# Um agente identificado é exigência de etiqueta e, em vários servidores
# públicos, condição de resposta. Só ASCII: cabeçalho com acento quebra cliente
# HTTP (lição de `backend/app/api/imagens.py`).
AGENTE = "TerrasPublicas/pesquisa (radar de noticias; sem coleta de texto)"

FONTES = [
    {
        "id": "mab",
        "veiculo": "MAB — Movimento dos Atingidos por Barragens",
        "url": "https://mab.org.br/feed/",
        "filtrar": True,
        "nota": "parte interessada no caso; publica a perspectiva das pessoas atingidas",
    },
    {
        "id": "agencia-brasil",
        "veiculo": "Agência Brasil",
        "url": "https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml",
        "filtrar": True,
        "nota": "imprensa pública federal, licença aberta",
    },
    {
        "id": "google-noticias",
        "veiculo": None,  # vem do <source> de cada item
        "url": (
            "https://news.google.com/rss/search?"
            "q=Brumadinho+OR+Paraopeba+barragem&hl=pt-BR&gl=BR&ceid=BR:pt-419"
        ),
        "filtrar": True,
        "nota": "agregador; o veículo real vem no campo source de cada item",
    },
]

# Termo de LUGAR — é o que faz um item ser DESTE caso. Minúsculas e sem acento;
# a comparação normaliza os dois lados.
#
# ⚠️ Não confundir com termo de tema. "Barragem", "rejeito" e "atingidos"
# descrevem o assunto e não o caso: com eles no lugar destes, entra rompimento
# de outro estado, mineração de outro país e a pauta nacional do movimento. A
# lista abaixo é curta de propósito — o custo de perder uma matéria que só diz
# "a tragédia de 2019" é menor que o de encher o radar de coisa de fora.
TERMOS = (
    "brumadinho", "paraopeba", "corrego do feijao", "corrego do feijão",
    "mina do feijao", "b1 da vale",
)

# Palavras que sobem o item de "notícia" para "alerta": indicam ato de
# autoridade, que é o que muda a situação de alguém — e não repercussão.
#
# ⚠️ O peso não é opinião sobre importância: é sobre AÇÃO. "Comoção" e
# "aniversário do rompimento" podem ser as matérias mais lidas do ano e não
# mudam nada para quem espera reparação; uma tutela de 3 parágrafos muda.
TERMOS_ATO = (
    "sentenca", "sentença", "decisao", "decisão", "liminar", "tutela",
    "acordo", "homologa", "condena", "denuncia", "denúncia", "multa",
    "recurso", "julgamento", "audiencia", "audiência", "tac ",
    "licenca", "licença", "embargo", "interdicao", "interdição",
)


def _sem_acento(texto: str) -> str:
    tabela = str.maketrans("áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ",
                           "aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC")
    return texto.translate(tabela).lower()


def _baixar(url: str, tempo_limite: int = 30) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": AGENTE})
    with urllib.request.urlopen(req, timeout=tempo_limite) as resp:
        return resp.read()


def _data_iso(texto: str | None) -> str | None:
    """Converte a data do RSS (RFC 822) para ISO. Ver armadilha 3."""
    if not texto:
        return None
    try:
        return parsedate_to_datetime(texto).astimezone(timezone.utc).isoformat()
    except (TypeError, ValueError):
        return None


def _limpar(titulo: str) -> str:
    """Tira marcação e espaço duplicado do título."""
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", titulo)).strip()


def coletar_fonte(fonte: dict) -> list[dict]:
    """Lê um feed e devolve os itens já normalizados."""
    try:
        corpo = _baixar(fonte["url"])
    except Exception as err:  # rede, timeout, TLS — nenhum é fatal para o resto
        print(f"  ! {fonte['id']}: nao respondeu ({err})", file=sys.stderr)
        return []

    try:
        raiz = ET.fromstring(corpo)
    except ET.ParseError as err:
        print(f"  ! {fonte['id']}: resposta nao e XML ({err})", file=sys.stderr)
        return []

    itens = []
    for item in raiz.iter("item"):
        titulo = _limpar((item.findtext("title") or ""))
        link = (item.findtext("link") or "").strip()
        if not titulo or not link:
            continue

        if fonte["filtrar"]:
            alvo = _sem_acento(titulo)
            if not any(t.strip() in alvo for t in TERMOS):
                continue

        # Armadilha 1: no agregador, o veículo real está no <source>.
        veiculo = fonte["veiculo"] or _limpar(item.findtext("source") or "") or "veículo não identificado"

        itens.append({
            "titulo": titulo,
            "link": link,
            "veiculo": veiculo,
            "fonte_id": fonte["id"],
            "data": _data_iso(item.findtext("pubDate")),
            "ato_de_autoridade": any(t in _sem_acento(titulo) for t in TERMOS_ATO),
        })
    return itens


def coletar(dias: int) -> dict:
    """Roda todas as fontes, junta, tira repetido e corta pela janela."""
    corte = datetime.now(timezone.utc) - timedelta(days=dias)
    vistos: set[str] = set()
    itens: list[dict] = []

    for fonte in FONTES:
        print(f"- {fonte['id']}", file=sys.stderr)
        for item in coletar_fonte(fonte):
            # Repetido é comum: o agregador traz o mesmo texto do veículo que
            # também tem feed próprio. A chave é o TÍTULO normalizado, não a
            # URL — o agregador reescreve a URL, então casar por link deixaria
            # o mesmo texto entrar duas vezes.
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

    # Sem data vai para o fim, e não para o começo: item sem data é o menos
    # confiável do conjunto, e o topo da tela é o lugar de maior atenção.
    itens.sort(key=lambda i: i["data"] or "", reverse=True)

    return {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "janela_dias": dias,
        "fontes": [
            {"id": f["id"], "veiculo": f["veiculo"] or "agregador", "nota": f["nota"]}
            for f in FONTES
        ],
        "lacuna_conhecida": (
            "TJMG e MPMG não entram: os endereços de RSS dos dois respondiam HTTP 404 "
            "em 14/08/2026. Decisão judicial chega aqui pela imprensa, com o atraso dela."
        ),
        "itens": itens,
    }


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--dias", type=int, default=45, help="janela de retenção (padrão: 45)")
    p.add_argument("--seco", action="store_true", help="não grava; só mostra o resumo")
    args = p.parse_args()

    dados = coletar(args.dias)
    atos = sum(1 for i in dados["itens"] if i["ato_de_autoridade"])
    print(f"\n{len(dados['itens'])} itens na janela de {args.dias} dias "
          f"({atos} com sinal de ato de autoridade)", file=sys.stderr)

    if args.seco:
        for i in dados["itens"][:10]:
            marca = "!" if i["ato_de_autoridade"] else " "
            print(f" {marca} [{(i['data'] or '????')[:10]}] {i['veiculo']}: {i['titulo'][:90]}")
        return 0

    # Coleta vazia NÃO sobrescreve o arquivo bom. Um dia de rede ruim não pode
    # esvaziar a tela de alertas — e "hoje não achei nada" é indistinguível de
    # "hoje a rede caiu" para quem só olha o resultado.
    if not dados["itens"] and SAIDA.is_file():
        print("! coleta vazia: mantendo o arquivo anterior", file=sys.stderr)
        return 1

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(dados, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"gravado em {SAIDA}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
