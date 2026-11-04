# -*- coding: utf-8 -*-
"""coletar-evidencias-consensus.py — catálogo de evidência científica sobre Brumadinho/Paraopeba.

Grava `apps/web/public/data/evidencias-brumadinho.json`, lido no build por
`apps/web/lib/paraopeba/evidencias.ts` e exibido em `/paraopeba/evidencias`.

Rodar:
    python scripts/coletar-evidencias-consensus.py --csv "C:\\Users\\teste\\Downloads\\....csv"
    python scripts/coletar-evidencias-consensus.py --seco
    python scripts/coletar-evidencias-consensus.py --sem-crossref

## O QUE ESTA COLETOR É

Um **catálogo de metadado**, não uma cópia de relatório. De cada trabalho ele
guarda título, autores, ano, periódico, quartil, tipo de estudo, citações,
**DOI** e o link do Consensus. Não guarda resumo, não guarda "takeaway", não
guarda a prosa da síntese.

Dois motivos se somam:

1. **A licença do Consensus proíbe.** O rodapé do relatório exportado diz:
   "Personal, non-commercial use only; redistribution requires copyright
   holders' consent." Republicar a síntese seria redistribuir saída do serviço
   sem consentimento — e a regra de coleta ética deste projeto (§Pesquisa na
   internet, item 3) trata termo de uso como regra, não sugestão.
2. **"Linkar, não copiar"** já é o veredito deste portal para a biblioteca das
   ATIs e para o acervo da UFMG (`docs/FONTES-BRUMADINHO-UFMG.md`). O abstract
   é obra do periódico, e o takeaway é obra do Consensus: nem um nem outro vão
   para o JSON.

O que entra, então, é fato verificável: metadado bibliográfico + contagem. O
DOI é conferido na Crossref, trabalho a trabalho, com pausa de 1 s (API aberta,
com identificação honesta). DOI que não bate não é corrigido no escuro: sai na
lista de pendências da própria página.

## COMO A CONTAGEM É HONESTA

O relatório do Consensus declara o funil 173,6 mil recuperados → 206 elegíveis
→ 100 incluídos. A exportação que ele nos entregou tem **outra** quantidade de
linhas. O JSON grava os dois números e a diferença entre eles, e a página diz
qual dos dois é o que existe aqui. Número de funil que não se sustenta no
arquivo é exatamente o tipo de dado que este portal não publica sem aviso.
"""

from __future__ import annotations

import argparse
import collections
import datetime
import json
import pathlib
import re
import sys
import time
import urllib.error
import urllib.request

USER_AGENT = "finweejur/github artur colito"
RAIZ = pathlib.Path(__file__).resolve().parents[1]
SAIDA = RAIZ / "apps" / "web" / "data" / "evidencias-cientificas-brumadinho.json"
CROSSREF = "https://api.crossref.org/works/"

FONTE = {
    "nome": "Consensus",
    "tipo": "busca assistida em base bibliográfica",
    "url": "https://consensus.app",
    "licenca": ("Uso pessoal e não comercial; redistribuição exige consentimento dos "
                "detentores de direitos. Este catálogo guarda apenas metadado "
                "bibliográfico verificado na Crossref — nem a síntese do Consensus, "
                "nem o resumo do periódico."),
}

# Eixos temáticos por palavra do título. A ordem importa: a primeira regra que
# casa vence. Cobertura medida em 03/11/2026 na exportação do Consensus: com as
# regras antigas, 25 dos 54 caíam em "outros" porque os títulos em português não
# estavam nas listas. `outros` continua existindo — trabalho sem casa declarada
# não é encaixado à força.
EIXOS: list[tuple[str, tuple[str, ...]]] = [
    # A ordem importa: título com "sediments, fishes and macrophytes" é antes de
    # tudo um trabalho sobre a biota — por isso biota vem antes de água.
    ("biota e peixe", ("fish", "icthyofauna", "bioaccumul", "macrophyte", "biota",
                       "ecotox", "biomonitor", "biological effects", "metal concentration",
                       "trace element", "peixe", "coral", "reef", "shrimp", "plankton",
                       "benthic", "larvae", "biodiversidade", "biodiversity", "conservação",
                       "conservacao")),
    ("água e sedimento", ("water quality", "sediment", "turbidity", "geochem", "river",
                          "paraopeba river", "tailings in", "contamination", "water and sediment",
                          "água", "sedimento", "deterioration", "hydrological", "tailings",
                          "tailing", "estuary", "estuar", "heavy metal", "trace metal",
                          "rare earth", "metal(loid)s")),
    ("pesca e comunidades tradicionais", ("fisher", "fishery", "fishing", "pesca", "quilombola",
                                          "indigenous", "krenak", "traditional communit",
                                          "artisanal", "livelihood", "modo de vida",
                                          "comunidades", "resistência", "resistencia",
                                          "women", "territorialidad", "ressignificação")),
    ("saúde humana", ("health", "mental health", "food", "nutrition", "waterborne",
                      "epidemiolog", "psychosocial", "psicossocia", "doen", "saúde",
                      "cohort", "well-being")),
    ("direito e reparação", ("legal", "court", "judicial", "jurisprud", "liability",
                             "reparation", "responsability", "responsibility", "responsabilid",
                             "dano", "damage", "justice", "compensation", "imprescrit",
                             "reparat", "dano moral", "direito", "conflitos", "structural",
                             "extrapatrimonial")),
    ("governança e participação", ("governance", "govern", "participation", "civil society",
                                   "recovery process", "stakeholder", "institutional response",
                                   "assessoria técnica", "ati", "participacao", "participação",
                                   "action strategies", "social movement")),
    ("território e uso do solo", ("land use", "land cover", "housing", "territor", "displacement",
                                  "cobertura", "village", "despossessão", "despossessao",
                                  "accumulation by dispossession", "reassentamento")),
    ("valoração econômica", ("economic valuation", "valuation", "valoração", "economic impact",
                             "cost", "ecosystem service", "ecossistêmica", "ecossistemic",
                             "econômic", "economic")),
    ("causa e risco da ruptura", ("cause", "failure mechanism", "liquefaction", "risk disclosure",
                                  "seepage", "stability", "dam failure risk", "work accident",
                                  "risk prevention", "wicked problem")),
]

TIPO_ESTUDO = {
    "review": "revisão",
    "systematic": "revisão sistemática",
    "review_sys": "revisão sistemática",
    "literature": "revisão de literatura",
    "meta": "meta-análise",
    "case": "estudo de caso",
    "cohort": "coorte",
    "survey": "inquérito",
    "experimental": "experimento",
    "field": "monitoramento de campo",
}


def ler_csv(caminho: pathlib.Path) -> list[dict]:
    import csv
    with open(caminho, encoding="utf-8-sig", newline="") as fp:
        return list(csv.DictReader(fp))


RE_ANO = re.compile(r"^\s*(.*?)\s*\((\d{4}[a-z]?)\)\.\s*(.*?)\s*\.\s*(.*)$", re.S)
RE_DOI = re.compile(r"https?://doi\.org/(\S+)", re.I)
RE_REVISTA = re.compile(r"\*([^*]+)\*")


def ler_apa(caminho: pathlib.Path) -> list[dict]:
    """Lê a lista de referências emAPA exportada pelo Consensus.

    Usado quando a ferramenta devolve só a bibliografia (o relatório do litoral
    do Rio Doce veio assim). A linha é: autores (ano). Título. *Revista*, volume,
    páginas. https://doi.org/...
    """
    referencias = []
    for bloco in re.split(r"\n\s*\n", caminho.read_text(encoding="utf-8")):
        texto = " ".join(bloco.split())
        achado = RE_ANO.match(texto)
        doi = RE_DOI.search(texto)
        if not doi:
            continue
        autores, ano, titulo, resto = achado.groups() if achado else ("", "", texto, "")
        revista = RE_REVISTA.search(resto or texto)
        referencias.append({
            "Title": titulo.strip().rstrip("."),
            "Authors": autores.strip().rstrip(","),
            "Year": ano,
            "Journal": revista.group(1).strip() if revista else "",
            "DOI": doi.group(1).rstrip(".,)"),
            "Citations": "",
            "Study Type": "",
            "Journal SJR Quartile": "",
            "Consensus Link": "",
        })
    return referencias


def carregar(caminho: pathlib.Path, formato: str) -> list[dict]:
    return ler_apa(caminho) if formato == "apa" else ler_csv(caminho)


def nota_do_trabalho(trabalho: dict) -> str:
    """Nota factual escrita por nós, a partir do metadado.

    O RAG exige um texto por item. Não é resumo do artigo — é a ficha: o que é,
    onde saiu, quando e o que este catálogo apurou. O resumo do periódico é obra
    de terceiro e a licença do Consensus não permite republicar a síntese dele.
    """
    autores_brutos = ", ".join(trabalho["autores"][:3]) or "autores não listados"
    autores = autores_brutos if len(autores_brutos) <= 90 else autores_brutos[:88] + "…"
    se_autor_escrito = " e outros" if len(trabalho["autores"]) > 3 else ""
    revisto = {"ok": "DOI conferido na Crossref",
               "sem verificacao": "DOI não conferido nesta rodada",
               "nao encontrado": "DOI informado não existe na Crossref",
               "erro": "consulta à Crossref falhou nesta rodada",
               "sem doi": "sem DOI informado"}.get(trabalho.get("doiStatus", ""), "")
    base = (f"Artigo científico sobre {trabalho['eixo']}, no conjunto de evidências "
            f"do desastre de {trabalho.get('desastre', 'barragem')}. "
            f"Título: {trabalho['titulo']}. Autores: {autores}{se_autor_escrito}. "
            f"Publicado em {trabalho['ano'] or 'data não informada'}")
    revista = f", na revista {trabalho['revista']}" if trabalho["revista"] else ""
    citacoes = (f", com {trabalho['citacoes']} citações registradas"
                if trabalho["citacoes"] else "")
    tipo = f"; tipo declarado: {trabalho['tipo']}" if trabalho["tipo"] != "não informado" else ""
    return f"{base}{revista}{citacoes}{tipo}. DOI {trabalho['doi'] or 'não informado'}. {revisto}".strip()


def eixo_de(titulo: str) -> str:
    texto = (titulo or "").lower()
    for eixo, termos in EIXOS:
        if any(termo in texto for termo in termos):
            return eixo
    return "outros"


def tipo_de(bruto: str) -> str:
    texto = (bruto or "").strip().lower()
    for marca, rotulo in TIPO_ESTUDO.items():
        if marca in texto:
            return rotulo
    return texto or "não informado"


def _autores(bruto: str, apa: bool) -> list[str]:
    """Em APA, "Silva, A. B." quebrado por vírgula vira fragmento de nome: fica inteiro."""
    texto = (bruto or "").strip()
    if not texto:
        return []
    if apa:
        return [texto]
    return [a.strip() for a in texto.split(",") if a.strip()]


def _campo(linha: dict, chave: str) -> str:
    return (linha.get(chave) or "").strip()


def _citacoes(linha: dict) -> int:
    digitos = re.sub(r"\D", "", linha.get("Citations") or "")
    return int(digitos) if digitos else 0


def normalizar(linha: dict, apa: bool = False) -> dict:
    doi = _campo(linha, "DOI")
    titulo = _campo(linha, "Title")
    return {
        "titulo": titulo,
        "autores": _autores(_campo(linha, "Authors"), apa),
        "ano": _campo(linha, "Year"),
        "revista": _campo(linha, "Journal"),
        "quartil": _campo(linha, "Journal SJR Quartile"),
        "tipo": tipo_de(_campo(linha, "Study Type")),
        "citacoes": _citacoes(linha),
        "doi": doi,
        "link": f"https://doi.org/{doi}" if doi else "",
        "linkConsensus": _campo(linha, "Consensus Link"),
        "eixo": eixo_de(titulo),
    }


def checar_crossref(doi: str, pausa: float) -> str:
    """`ok`, `nao encontrado` ou `sem verificacao` — nunca um palpite."""
    if not doi:
        return "sem doi"
    try:
        req = urllib.request.Request(CROSSREF + doi, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=30) as resposta:
            return "ok" if resposta.status == 200 else "nao encontrado"
    except urllib.error.HTTPError as erro:
        return "nao encontrado" if erro.code == 404 else "erro"
    except Exception:  # noqa: BLE001 - rede fora não invalida o catálogo
        return "erro"


def agregar(trabalhos: list[dict]) -> dict:
    """Contagem por eixo, ano, tipo e quartil. Tudo sai daqui, nada é digitado."""
    return {
        "porEixo": dict(collections.Counter(t["eixo"] for t in trabalhos).most_common()),
        "porAno": {ano: n for ano, n in sorted(collections.Counter(
            t["ano"] for t in trabalhos if t["ano"]).items())},
        "porTipo": dict(collections.Counter(t["tipo"] for t in trabalhos).most_common()),
        "porQuartil": dict(collections.Counter(
            t["quartil"] or "não informado" for t in trabalhos).most_common()),
        "maisCitados": [{"titulo": t["titulo"][:130], "citacoes": t["citacoes"], "doi": t["doi"]}
                        for t in sorted(trabalhos, key=lambda x: -x["citacoes"])[:10]],
    }


def _verificar_dois(trabalhos: list[dict], pausa: float, sem_crossref: bool) -> None:
    for trabalho in trabalhos:
        if sem_crossref:
            trabalho["doiStatus"] = "sem verificacao"
            continue
        trabalho["doiStatus"] = checar_crossref(trabalho["doi"], pausa)
        time.sleep(pausa)
        print(f"  {trabalho['doiStatus']:15} {trabalho['doi'] or '(sem doi)'}")


def _funil(texto: str) -> dict:
    recuperados, elegiveis, incluidos = (p.strip() for p in texto.split("|"))
    return {"recuperados": recuperados, "elegiveis": elegiveis, "incluidos": incluidos}


def _funil_real(trabalhos: list[dict]) -> dict:
    quebrados = [t for t in trabalhos if t["doiStatus"] not in ("ok", "sem verificacao")]
    return {"linhasExportadas": len(trabalhos),
            "comDoi": sum(1 for t in trabalhos if t["doi"]),
            "doiVerificado": sum(1 for t in trabalhos if t["doiStatus"] == "ok"),
            "doiComProblema": [{"titulo": t["titulo"][:120], "doi": t["doi"],
                                "status": t["doiStatus"]} for t in quebrados]}


def montar_catalogo(trabalhos: list[dict], desastre: str, funil: str) -> dict:
    return {
        "geradoEm": datetime.date.today().isoformat(),
        "desastre": desastre,
        "fonte": FONTE,
        "funilDeclarado": _funil(funil),
        "funilReal": _funil_real(trabalhos),
        "agregados": agregar(trabalhos),
        "trabalhos": sorted(trabalhos, key=lambda t: (t["ano"], -t["citacoes"])),
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Catálogo de evidência científica do Consensus.")
    ap.add_argument("--csv", type=pathlib.Path, required=True, help="exportação do Consensus")
    ap.add_argument("--formato", choices=("csv", "apa"), default="csv",
                    help="csv = tabela exportada; apa = lista de referências soltas")
    ap.add_argument("--saida", type=pathlib.Path, default=SAIDA)
    ap.add_argument("--desastre", default="brumadinho",
                    help="de qual relatório veio: brumadinho | rio Doce litoral")
    ap.add_argument("--funil", default="173,6 mil|206|100",
                    help="recuperados|elegíveis|incluídos, como o relatório declara")
    ap.add_argument("--seco", action="store_true", help="não grava, só mede")
    ap.add_argument("--sem-crossref", action="store_true")
    ap.add_argument("--pausa", type=float, default=1.0)
    opcoes = ap.parse_args()

    if not opcoes.csv.exists():
        sys.exit(f"csv não encontrado: {opcoes.csv}")

    trabalhos = [normalizar(l, apa=opcoes.formato == "apa")
                 for l in carregar(opcoes.csv, opcoes.formato)]
    for trabalho in trabalhos:
        trabalho["desastre"] = opcoes.desastre
    _verificar_dois(trabalhos, opcoes.pausa, opcoes.sem_crossref)
    for trabalho in trabalhos:
        trabalho["nota"] = nota_do_trabalho(trabalho)

    dados = montar_catalogo(trabalhos, opcoes.desastre, opcoes.funil)
    real = dados["funilReal"]
    print(f"\ntrabalhos: {len(trabalhos)} | DOI verificado: {real['doiVerificado']} | "
          f"com problema: {len(real['doiComProblema'])}")
    print("eixos:", dados["agregados"]["porEixo"])
    if opcoes.seco:
        return 0

    opcoes.saida.parent.mkdir(parents=True, exist_ok=True)
    opcoes.saida.write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")),
                            encoding="utf-8")
    print(f"gravado: {opcoes.saida.name} ({opcoes.saida.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
