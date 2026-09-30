#!/usr/bin/env python3
"""
marcar-zona-mineradora.py — marca, SEM anacronismo, quais listas nominativas do
APM (1838-1840) vêm de uma vila que foi centro minerador no século XVIII.

═══ O CUIDADO ACADÊMICO (o ponto inteiro deste script) ═══

A tentação é cruzar as 121 listas com a **mineração detectada por satélite**
(MapBiomas, 1995-2024) e concluir "mineração escravizada". Isso é **anacronismo**:
a lista é de 1838-1840 e o dado de lavra é de 150 anos depois. São dois dados
verdadeiros que, lado a lado, sugerem um terceiro falso — exatamente o risco que a
AGENTS § 7 proíbe.

O cruzamento que a HISTORIOGRAFIA sustenta é outro: a lista é o documento de uma
**vila mineradora do século XVIII**. Marcar isso é factual e datado.

E há uma ressalva que a literatura impõe, e ela VAI na ficha: em 1838-1840 a
economia escravista de Minas já era **majoritariamente agrária/de subsistência**,
não de lavra (MARTINS, Roberto Borges. *A economia escravista de Minas Gerais no
século XIX*. CEDEPLAR/UFMG, 1982). Ou seja: a lista vem de lugar que foi mineral,
mas o trabalho escravizado registrado nela, no período, era sobretudo rural.

Fontes do dicionário de vilas/comarcas: IBGE, *Brasil: 500 anos de povoamento*
("descoberta do ouro"); PRADO JÚNIOR, *Formação do Brasil contemporâneo* (1942);
Revista do Arquivo Público Mineiro (documentação das comarcas do ouro).

Uso: python scripts/etl/historia/marcar-zona-mineradora.py
"""
from __future__ import annotations

import json
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[3]
INDICE = RAIZ / "apps" / "web" / "data" / "apm-listas-populacao.json"
CAMADA = RAIZ / "apps" / "web" / "public" / "terras" / "globo" / "dados" / "camadas" / "hist-listas-populacao.geojson"

# Município atual -> vila/comarca mineradora do século XVIII.
VILAS = {
    "ouro preto": ("Vila Rica", "Comarca de Vila Rica"),
    "mariana": ("Vila do Carmo (Nossa Senhora do Carmo)", "Comarca de Vila Rica"),
    "itabirito": ("Itabirito (termo de Vila Rica)", "Comarca de Vila Rica"),
    "ouro branco": ("Ouro Branco (termo de Vila Rica)", "Comarca de Vila Rica"),
    "congonhas": ("Congonhas do Campo (termo de Vila Rica)", "Comarca de Vila Rica"),
    "catas altas": ("Catas Altas (termo de Vila Rica)", "Comarca de Vila Rica"),
    "santa barbara": ("Santa Bárbara (termo de Vila Rica)", "Comarca de Vila Rica"),
    "itaverava": ("Itaverava (termo de Vila Rica)", "Comarca de Vila Rica"),
    "itabira": ("Itabira do Mato Dentro", "Comarca de Vila Rica"),
    "sabara": ("Vila Real de Nossa Senhora da Conceição do Sabará", "Comarca do Rio das Velhas"),
    "caete": ("Vila Nova da Rainha", "Comarca do Rio das Velhas"),
    "santa luzia": ("Santa Luzia do Rio das Velhas", "Comarca do Rio das Velhas"),
    "nova lima": ("Nova Lima (termo de Sabará)", "Comarca do Rio das Velhas"),
    "raposos": ("Raposos (termo de Sabará)", "Comarca do Rio das Velhas"),
    "barão de cocais": ("Barão de Cocais (termo de Sabará)", "Comarca do Rio das Velhas"),
    "sao joao del rei": ("São João del Rei", "Comarca do Rio das Mortes"),
    "tiradentes": ("São José del Rei", "Comarca do Rio das Mortes"),
    "prados": ("Prados (termo de São José del Rei)", "Comarca do Rio das Mortes"),
    "resende costa": ("Resende Costa (termo de São José del Rei)", "Comarca do Rio das Mortes"),
    "ritapolis": ("Ritápolis (termo de São José del Rei)", "Comarca do Rio das Mortes"),
    "carrancas": ("Carrancas (termo de São João del Rei)", "Comarca do Rio das Mortes"),
    "lagoa dourada": ("Lagoa Dourada (termo de São João del Rei)", "Comarca do Rio das Mortes"),
    "serro": ("Serro do Frio", "Comarca do Serro do Frio"),
    "diamantina": ("Arraial do Tijuco", "Comarca do Serro do Frio"),
    "conceicao do mato dentro": ("Conceição do Mato Dentro", "Comarca do Serro do Frio"),
    "gouveia": ("Gouveia (termo do Serro do Frio)", "Comarca do Serro do Frio"),
    "pitangui": ("Pitangui", "Comarca de Pitangui"),
    "paracatu": ("Paracatu do Príncipe", "Comarca de Paracatu"),
}

FONTE = (
    "Comarcas do ouro do século XVIII — IBGE, Brasil: 500 anos de povoamento; "
    "Prado Júnior, Formação do Brasil contemporâneo (1942); Revista do Arquivo Público Mineiro"
)
RESSALVA = (
    "A vila foi centro minerador no século XVIII, mas a lista é de 1838-1840, quando a "
    "economia escravista de Minas já era sobretudo agrária (Martins, CEDEPLAR/UFMG, 1982). "
    "O cruzamento NÃO é com a lavra moderna — usá-la seria anacronismo."
)


def chave(nome: str) -> str:
    return unicodedata.normalize("NFD", nome).encode("ascii", "ignore").decode().lower().strip()


def main() -> int:
    pacote = json.loads(INDICE.read_text(encoding="utf-8"))
    marcadas = 0
    for r in pacote.get("registros", []):
        mun = r.get("municipio")
        vila = VILAS.get(chave(mun)) if mun else None
        if vila:
            r["zona_mineradora_vila"], r["zona_mineradora_comarca"] = vila
            r["zona_mineradora_fonte"] = FONTE
            r["zona_mineradora_ressalva"] = RESSALVA
            marcadas += 1
        elif mun:
            r["zona_mineradora_vila"] = None
    pacote["zona_mineradora"] = {
        "criterio": "vila/comarca mineradora do século XVIII (critério HISTÓRICO, não a lavra moderna)",
        "fonte": FONTE,
        "ressalva": RESSALVA,
        "listas_em_vila_mineradora": marcadas,
        "listas_fora": sum(1 for r in pacote.get("registros", []) if r.get("municipio") and not r.get("zona_mineradora_vila")),
    }
    INDICE.write_text(json.dumps(pacote, ensure_ascii=False, indent=1), encoding="utf-8")

    # a camada do globo recebe o mesmo campo
    camada = json.loads(CAMADA.read_text(encoding="utf-8"))
    for ft in camada["features"]:
        mun = ft["properties"].get("municipio")
        vila = VILAS.get(chave(mun)) if mun else None
        if vila:
            ft["properties"]["zona_mineradora_vila"], ft["properties"]["zona_mineradora_comarca"] = vila
    camada["_nota"] += (
        " Cada feição pode trazer `zona_mineradora_vila`: a vila/comarca mineradora do século XVIII "
        "a que o município pertencia (critério HISTÓRICO — nunca a lavra moderna, que seria anacronismo)."
    )
    CAMADA.write_text(json.dumps(camada, ensure_ascii=False), encoding="utf-8")

    print(f"listas em vila mineradora do século XVIII: {marcadas}")
    print(f"  índice: {INDICE.name} | camada: {CAMADA.name} ({CAMADA.stat().st_size/1024:.0f} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
