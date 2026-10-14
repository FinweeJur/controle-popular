#!/usr/bin/env python3
"""Auditor ESTÁTICO do padrão de página wiki do catálogo top 100.

Papel no portal: confere se cada uma das 100 rotas de
`apps/web/data/top-100-paginas.json` existe como página e se o texto do
arquivo `page.tsx` traz os elementos do padrão wiki (seções, índice,
relacionados, gráfico, fonte, botões de topo). Reporta o que falta por rota.

Fonte da regra: o guia `docs/03-desenvolvimento/PADRAO-PAGINA-WIKI.md`
(padrão de página wiki) e a lista `apps/web/data/top-100-paginas.json` (quais
rotas são obrigatórias). O catálogo manda; este script só mede.

Por que é estático (sem Playwright, sem rede): lê arquivo do disco e aplica
regex. Roda em segundos, cabe em qualquer CI e não precisa de browser nem
de banco de pé — a mesma checagem roda no PC do dono e no GitHub Actions.

Exit code: 1 só quando há rota do catálogo sem página e sem rota dinâmica
que a atenda (origem="ausente"). Itens faltando deixam a rota "parcial",
não derrubam a execução.

Uso: python scripts/verificar-padrao-pagina.py [--json]
"""

import argparse
import datetime
import json
import re
import sys
from pathlib import Path

# Console Windows em cp1252 quebra ao imprimir acento (AGENTS.md § armadilha).
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

RAIZ = Path(__file__).resolve().parent.parent
APP = RAIZ / "apps" / "web" / "app"
CATALOGO = RAIZ / "apps" / "web" / "data" / "top-100-paginas.json"
RELATORIOS = RAIZ / "docs" / "relatorios-automacao"

# Itens do padrão wiki, na ordem em que aparecem no relatório.
ITENS = ("secoes", "indice_wiki", "relacionados", "grafico", "fonte", "botoes_topo")


def resolver_rota(href: str):
    """Resolve o href do catálogo para o arquivo page.tsx.

    Retorna (caminho, origem) onde origem é:
      - "estatica"  -> página literal em apps/web/app/.../page.tsx;
      - "dinamica"  -> casou com rota entre colchetes (ex.: /[municipio]);
      - "ausente"   -> não existe página nenhuma que atenda a rota.
    O casamento dinâmico troca o PRIMEIRO segmento cujo diretório pai tem
    pasta entre colchetes e mantém os segmentos seguintes literais:
    /betim -> app/[municipio]/page.tsx; /cidades/mg ->
    app/cidades/[municipio]/page.tsx (se existir).
    """
    partes = [p for p in href.strip("/").split("/") if p]
    if not partes:
        alvo = APP / "page.tsx"
        return (alvo, "estatica") if alvo.exists() else (None, "ausente")

    direto = APP.joinpath(*partes, "page.tsx")
    if direto.exists():
        return direto, "estatica"

    # Rota dinâmica: percorre os segmentos procurando uma pasta "[...]".
    for i in range(len(partes)):
        base = APP.joinpath(*partes[:i])
        if not base.is_dir():
            break
        dinamicas = sorted(d.name for d in base.iterdir() if d.is_dir() and d.name.startswith("["))
        if not dinamicas:
            continue
        alvo = base.joinpath(dinamicas[0], *partes[i + 1 :], "page.tsx")
        if alvo.exists():
            return alvo, "dinamica"
    return None, "ausente"


def checar(texto: str):
    """Aplica as regex do padrão wiki ao texto do page.tsx.

    Retorna (itens_ok, detalhes): itens_ok é dict item -> bool; detalhes é
    dict item -> texto curto com a medição (entra no relatório do dia).
    """
    itens = {}

    # Seções: componente SecaoWiki, qualquer <h2> ou a constante SECOES.
    itens["secoes"] = re.search(r"SecaoWiki|<h2|SECOES", texto, re.I) is not None
    itens["indice_wiki"] = re.search(r"IndiceWiki", texto, re.I) is not None

    pos_rel = [m.start() for m in re.finditer(r"LinksRelacionados", texto)]
    itens["relacionados"] = len(pos_rel) >= 1

    itens["grafico"] = re.search(r"<svg|Gr[aá]fico|grafico", texto, re.I) is not None

    # Fonte = rótulo de fonte E pelo menos um link http(s) de verdade.
    tem_rotulo = re.search(r"Fonte|fonte oficial", texto, re.I) is not None
    tem_http = re.search(r"https?://", texto) is not None
    itens["fonte"] = tem_rotulo and tem_http

    # Botões de topo: com 2+ pontos de LinksRelacionados, ao menos UM tem de
    # aparecer antes da primeira seção (SecaoWiki ou <h2>). Com 0 ou 1 ponto
    # a heurística não discrimina, então não reprova.
    if len(pos_rel) >= 2:
        primeira = re.search(r"SecaoWiki|<h2", texto, re.I)
        limite = primeira.start() if primeira else len(texto)
        antes = sum(1 for p in pos_rel if p < limite)
        itens["botoes_topo"] = antes >= 1
        detalhe_topo = f"{antes} de {len(pos_rel)} antes da 1a secao"
    else:
        itens["botoes_topo"] = True
        detalhe_topo = f"{len(pos_rel)} ponto(s), heuristica nao se aplica"

    detalhes = {
        "secoes": "ok" if itens["secoes"] else "sem SecaoWiki/<h2/SECOES",
        "indice_wiki": "ok" if itens["indice_wiki"] else "sem IndiceWiki",
        "relacionados": f"{len(pos_rel)} bloco(s)",
        "grafico": "ok" if itens["grafico"] else "sem svg/grafico",
        "fonte": "ok" if itens["fonte"] else ("sem href http(s)" if tem_rotulo else "sem rotulo Fonte"),
        "botoes_topo": detalhe_topo,
    }
    return itens, detalhes


def auditar():
    """Lê o catálogo e audita as 100 rotas. Retorna a lista de resultados."""
    catalogo = json.loads(CATALOGO.read_text(encoding="utf-8"))
    resultados = []
    for entrada in catalogo:
        href = entrada["href"]
        caminho, origem = resolver_rota(href)
        registro = {
            "href": href,
            "titulo": entrada.get("titulo", ""),
            "eixo": entrada.get("eixo", ""),
            "subfrente": entrada.get("subfrente", ""),
            "origem": origem,
            "arquivo": str(caminho.relative_to(RAIZ)) if caminho else "",
            "itens": {},
            "detalhes": {},
            "faltando": [],
        }
        if origem != "ausente":
            texto = caminho.read_text(encoding="utf-8", errors="replace")
            itens, detalhes = checar(texto)
            registro["itens"] = itens
            registro["detalhes"] = detalhes
            registro["faltando"] = [k for k in ITENS if not itens[k]]
        resultados.append(registro)
    return resultados


def resumo(resultados):
    """Conta completas / parciais / ausentes."""
    ausentes = [r for r in resultados if r["origem"] == "ausente"]
    completas = [r for r in resultados if r["origem"] != "ausente" and not r["faltando"]]
    parciais = [r for r in resultados if r["origem"] != "ausente" and r["faltando"]]
    return {
        "total": len(resultados),
        "completas": len(completas),
        "parciais": len(parciais),
        "ausentes": len(ausentes),
    }


def imprimir_console(resultados, contagem):
    """Tabela ASCII no console: rota, origem e itens faltando."""
    largura_rota = max(5, max(len(r["href"]) for r in resultados))
    print(f"{'ROTA'.ljust(largura_rota)}  {'ORIGEM'.ljust(9)}  FALTANDO")
    print("=" * (largura_rota + 9 + 40))
    for r in resultados:
        faltando = ", ".join(r["faltando"]) if r["faltando"] else "-"
        if r["origem"] == "ausente":
            faltando = "pagina inexistente"
        print(f"{r['href'].ljust(largura_rota)}  {r['origem'].ljust(9)}  {faltando}")
    print("-" * (largura_rota + 9 + 40))
    print(f"Total de rotas:  {contagem['total']}")
    print(f"Completas:       {contagem['completas']}")
    print(f"Parciais:        {contagem['parciais']}")
    print(f"Ausentes:        {contagem['ausentes']}")


def gravar_relatorio(resultados, contagem):
    """Grava docs/relatorios-automacao/padrao-pagina-<YYYY-MM-DD>.md.

    Um arquivo por dia; no mesmo dia a rodada mais nova sobrescreve.
    """
    agora = datetime.datetime.now()
    destino = RELATORIOS / f"padrao-pagina-{agora.strftime('%Y-%m-%d')}.md"
    linhas = [
        "# Padrao de pagina (top 100) - auditoria estatica",
        "",
        f"- Gerado em: {agora.strftime('%Y-%m-%d %H:%M')}",
        f"- Rotas: {contagem['total']} | Completas: {contagem['completas']} "
        f"| Parciais: {contagem['parciais']} | Ausentes: {contagem['ausentes']}",
        "- Gerado por: `scripts/verificar-padrao-pagina.py` (leitura de arquivo, sem browser).",
        "",
        "## Tabela",
        "",
        "| Rota | Origem | Itens faltando |",
        "|---|---|---|",
    ]
    for r in resultados:
        if r["origem"] == "ausente":
            faltando = "pagina inexistente"
        else:
            faltando = ", ".join(r["faltando"]) if r["faltando"] else "-"
        linhas.append(f"| `{r['href']}` | {r['origem']} | {faltando} |")
    linhas += [
        "",
        "## Legenda",
        "",
        "| Item | O que mede |",
        "|---|---|",
        "| origem=estatica | existe `page.tsx` literal em `apps/web/app/...` |",
        "| origem=dinamica | a rota casou com pasta entre colchetes (`[municipio]` etc.) |",
        "| origem=ausente | nao ha pagina nem rota dinamica que atenda a rota |",
        "| secoes | tem `SecaoWiki`, `<h2>` ou `SECOES` |",
        "| indice_wiki | tem `IndiceWiki` |",
        "| relacionados | tem ao menos 1 bloco `LinksRelacionados` |",
        "| grafico | tem `<svg>` ou mencao a grafico |",
        "| fonte | rotulo `Fonte` + ao menos 1 href http(s) |",
        "| botoes_topo | com 2+ `LinksRelacionados`, ao menos 1 antes da 1a secao |",
        "| completa | pagina existe e nenhum item faltando |",
        "| parcial | pagina existe e falta pelo menos 1 item |",
        "",
        "## Faltando por pagina",
        "",
    ]
    com_falta = [r for r in resultados if r["origem"] == "ausente" or r["faltando"]]
    if not com_falta:
        linhas.append("Nenhuma rota com item faltando.")
    for r in com_falta:
        if r["origem"] == "ausente":
            linhas.append(f"- `{r['href']}` - pagina inexistente (sem rota dinamica).")
            continue
        detalhes = "; ".join(f"{k}: {r['detalhes'].get(k, '')}" for k in r["faltando"])
        linhas.append(f"- `{r['href']}` - {', '.join(r['faltando'])} ({detalhes})")
    linhas.append("")
    RELATORIOS.mkdir(parents=True, exist_ok=True)
    destino.write_text("\n".join(linhas), encoding="utf-8")
    return destino


def main() -> int:
    parser = argparse.ArgumentParser(description="Audita o padrao de pagina do top 100 (estatico).")
    parser.add_argument("--json", action="store_true", help="dump do resultado em JSON no console")
    args = parser.parse_args()

    resultados = auditar()
    contagem = resumo(resultados)
    relatorio = gravar_relatorio(resultados, contagem)

    if args.json:
        print(json.dumps(
            {"resumo": contagem, "relatorio": str(relatorio.relative_to(RAIZ)), "rotas": resultados},
            ensure_ascii=False, indent=2))
    else:
        imprimir_console(resultados, contagem)
        print(f"Relatorio: {relatorio.relative_to(RAIZ)}")

    # Exit 1 so para rota do catalogo sem pagina nenhuma; falta de item e
    # falha de padrao, nao rota apagada.
    return 1 if contagem["ausentes"] else 0


if __name__ == "__main__":
    sys.exit(main())
