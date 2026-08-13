r"""etl.apis.direito_critico_popular — ingestor da seção "legislação e
precedentes por tema de direito protegido" (`/ambiental/direito-critico`,
migration `0067`).

Fonte: `etl/betim/dados-seed/direito-critico-popular.html` — HTML curado
"Direito Crítico Popular", já commitado neste repo. Não é um coletor (não
bate em nenhuma API externa): lê o HTML local, extrai os arrays `LAWS`
(30 instrumentos) e `JURIS` (15 precedentes) — via
`_direito_critico_popular_extrair.mjs`, ver a docstring lá para o porquê de
usar Node para essa extração pontual — e grava em
`direito_critico_normas`/`direito_critico_precedentes`.

═══ SANITIZAÇÃO DE HTML, NÃO CÓPIA CRUA ═══

`LAWS[i].relevance` e `LAWS[i].articles[].text` trazem HTML embutido
(`<strong>`, e um widget de tooltip `<span class='lt'>termo<span
class='tt'>explicação</span></span>` que a página original usa para popup
de glossário). Duas decisões tomadas aqui, deliberadamente:

1. O tooltip (`<span class='tt'>...</span>`) é DESCARTADO, não reproduzido
   — recriar o widget de hover é um componente de UI à parte, fora do
   escopo desta carga. O termo em si (`<span class='lt'>`) fica, como texto
   normal — só a explicação-popup some. Nada de essencial ao artigo se
   perde: a explicação era um EXTRA de glossário, não parte da norma.
2. O que sobra passa por `sanitizar_html_curado()`: escapa TUDO
   (`&`, `<`, `>`, aspas) e só então reabre, por substituição LITERAL, os
   pares `&lt;strong&gt;`/`&lt;/strong&gt;` -> `<strong>`/`</strong>`. Uma
   tentativa de injeção como `<strong onclick=...>` escaparia inteira e
   ficaria como TEXTO visível (`<strong onclick=...>`), nunca como tag
   viva — não há como um atributo sobreviver à volta. Mesmo espírito da
   correção de `6549ae3` (Mapa 3D, 2026-08-12: escapar por padrao, abrir
   exceção só pra o que a própria fonte confirma que é intencional) —
   aplicado aqui a um HTML CURADO por nós, não raspado de terceiro, porque
   "é nosso" não é motivo pra pular a sanitização: o dado ainda passa por
   um arquivo em disco que pode ser editado por qualquer PR.

`JURIS[i].ementa`/`relevancia`/`titulo`/`ref` NÃO têm HTML nenhum — medido
(nenhuma ocorrência de `<` nas 15 entradas). Gravados como texto puro, sem
sanitização de tag (não há tag pra sanitizar), e a tela deve renderizá-los
como texto, nunca com `dangerouslySetInnerHTML`.

Uso:

    python -m etl.apis.direito_critico_popular --sondar   # não grava
    python -m etl.apis.direito_critico_popular             # grava
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

from etl.common import get_supabase_client
from etl.temas_direito_critico import temas_da_lei, temas_do_precedente

LOG = "[etl.apis.direito_critico_popular]"

RAIZ_BETIM = Path(__file__).resolve().parents[2]  # etl/betim/
HTML_SEMENTE = RAIZ_BETIM / "dados-seed" / "direito-critico-popular.html"
EXTRATOR_NODE = Path(__file__).with_name("_direito_critico_popular_extrair.mjs")

ORIGEM = "direito-critico-popular"

_TAG_TT = re.compile(r"<span class='tt'>.*?</span>", re.DOTALL)
_TAG_LT_ABRE = re.compile(r"<span class='lt'>")
_TAG_FECHA = re.compile(r"</span>")


def _despojar_tooltip(html: str) -> str:
    """Remove o popup de glossário (`class='tt'`), mantém o termo
    (`class='lt'`) como texto normal — ver docstring do módulo, item 1."""
    sem_tt = _TAG_TT.sub("", html or "")
    sem_lt_abre = _TAG_LT_ABRE.sub("", sem_tt)
    return _TAG_FECHA.sub("", sem_lt_abre)


def sanitizar_html_curado(bruto: str | None) -> str:
    """Escapa tudo, reabre só `<strong>`/`</strong>` por substituição
    literal — ver docstring do módulo, item 2. `bruto` já deve ter passado
    por `_despojar_tooltip` antes (os `<span>` de tooltip não sobrevivem
    aqui: viram texto escapado visível, o que é intencional — se um dia
    esta função rodar sem o despojamento antes, o erro aparece na TELA
    como `<span...>` literal, não como HTML quebrado ou script executando)."""
    if not bruto:
        return ""
    escapado = (
        bruto.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    )
    return (
        escapado.replace("&lt;strong&gt;", "<strong>").replace(
            "&lt;/strong&gt;", "</strong>"
        )
    )


def _texto_puro(bruto: str | None) -> str:
    """Artigo/relevância sem NENHUMA tag — usado pro campo `texto` de
    `articles`, que a tela renderiza como texto (não HTML). Aplica o mesmo
    despojo de tooltip e remove qualquer tag residual como rede de
    segurança final."""
    sem_tooltip = _despojar_tooltip(bruto or "")
    sem_strong = sem_tooltip.replace("<strong>", "").replace("</strong>", "")
    # Rede de segurança: qualquer tag que tenha sobrado (não deveria, dado
    # o tagset medido) é removida, nunca escapada-e-mostrada aqui — este
    # campo é texto puro por contrato com a tela.
    return re.sub(r"<[^>]+>", "", sem_strong).strip()


def _extrair_html() -> tuple[list[dict], list[dict]]:
    if not HTML_SEMENTE.exists():
        raise RuntimeError(f"{LOG} HTML semente não encontrado em {HTML_SEMENTE}")
    resultado = subprocess.run(
        ["node", str(EXTRATOR_NODE), str(HTML_SEMENTE)],
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if resultado.returncode != 0:
        raise RuntimeError(
            f"{LOG} extração via Node falhou (código {resultado.returncode}): {resultado.stderr.strip()}"
        )
    dados = json.loads(resultado.stdout)
    return dados["laws"], dados["juris"]


def _linha_norma(lei: dict) -> dict:
    artigos = [
        {
            "id": a.get("id"),
            "destaque": bool(a.get("key")),
            "titulo": _texto_puro(a.get("title")),
            "texto": _texto_puro(a.get("text")),
        }
        for a in lei.get("articles") or []
    ]
    return {
        "origem": ORIGEM,
        "id_fonte": lei["id"],
        "numero": lei.get("num"),
        "nome_curto": lei["short"],
        "nome_completo": lei["full"],
        "natureza": "internacional" if lei.get("tag") == "Internacional" else "nacional",
        "destaque": bool(lei.get("key")),
        "link_oficial": lei["normas"],
        "relevancia_html": sanitizar_html_curado(_despojar_tooltip(lei.get("relevance") or "")),
        "artigos": artigos,
        "temas": temas_da_lei(lei["id"]),
    }


def _linha_precedente(caso: dict) -> dict:
    return {
        "origem": ORIGEM,
        "id_fonte": caso["id"],
        "tribunal": caso["trib"],
        "natureza": "internacional" if caso.get("tipo") == "int" else "nacional",
        "destaque": bool(caso.get("destaque")),
        "link_oficial": caso.get("link"),
        "titulo": caso["titulo"],
        "referencia": caso.get("ref"),
        "ementa": caso["ementa"],
        "relevancia": caso["relevancia"],
        "tags": caso.get("tags") or [],
        "temas": temas_do_precedente(caso["id"]),
    }


def coletar() -> tuple[list[dict], list[dict]]:
    laws, juris = _extrair_html()
    normas = [_linha_norma(l) for l in laws]
    precedentes = [_linha_precedente(j) for j in juris]
    return normas, precedentes


def _resumo_temas(linhas: list[dict]) -> str:
    from collections import Counter

    c: Counter[str] = Counter()
    sem_tema = 0
    for l in linhas:
        if l["temas"]:
            c.update(l["temas"])
        else:
            sem_tema += 1
    partes = ", ".join(f"{k}={v}" for k, v in sorted(c.items()))
    return f"{partes} | sem_tema={sem_tema}"


def sondar() -> None:
    normas, precedentes = coletar()
    print(f"{LOG} {len(normas)} norma(s), {len(precedentes)} precedente(s) extraído(s) do HTML semente.")
    print(f"{LOG}   normas por natureza: "
          f"nacional={sum(1 for n in normas if n['natureza']=='nacional')}, "
          f"internacional={sum(1 for n in normas if n['natureza']=='internacional')}")
    print(f"{LOG}   precedentes por tribunal: "
          + ", ".join(f"{t}={sum(1 for p in precedentes if p['tribunal']==t)}"
                       for t in sorted({p['tribunal'] for p in precedentes})))
    print(f"{LOG}   normas por tema: {_resumo_temas(normas)}")
    print(f"{LOG}   precedentes por tema: {_resumo_temas(precedentes)}")
    for n in normas[:3]:
        print(f"       [{n['natureza'][:3]}] {n['nome_curto']!r} temas={n['temas']}")


def sync() -> None:
    client = get_supabase_client()
    normas, precedentes = coletar()
    print(f"{LOG} {len(normas)} norma(s), {len(precedentes)} precedente(s) para gravar.")
    if normas:
        client.table("direito_critico_normas").upsert(
            normas, on_conflict="origem,id_fonte"
        ).execute()
    if precedentes:
        client.table("direito_critico_precedentes").upsert(
            precedentes, on_conflict="origem,id_fonte"
        ).execute()
    print(f"{LOG} gravado(s)/atualizado(s): {len(normas)} norma(s), {len(precedentes)} precedente(s).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sondar", action="store_true", help="extrai e relata, NÃO grava")
    args = parser.parse_args()
    try:
        if args.sondar:
            sondar()
        else:
            sync()
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
