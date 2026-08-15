"""deduplicar_vazio_curvelo.py — tira do detalhe de Curvelo o que a camada geral já mostra.

    python deduplicar_vazio_curvelo.py            # aplica
    python deduplicar_vazio_curvelo.py --conferir # só mede, não escreve

## O problema, medido

Duas camadas do globo mostram o mesmo cálculo em dois cortes de tamanho:

| Camada | Cobertura | Corte | Feições |
|---|---|---|---|
| `vazio-cadastral-bacia.geojson` | 14 municípios da bacia do Paraopeba | ≥ 500 ha | 35 |
| `vazio-cadastral.geojson` (detalhe de Curvelo) | só Curvelo | ≥ 10 ha | 390 |

Curvelo está DENTRO dos 14 municípios da primeira. Então as áreas de Curvelo
com 500 ha ou mais aparecem nas duas — são **12**, e as áreas batem uma a uma:

    556, 574, 647, 670, 685, 731, 799, 814, 817, 822, 980, 1070 ha

Ligar as duas camadas juntas desenhava esses 12 polígonos **duas vezes**
(mesma cor, mesma geometria, contorno dobrado) e somava 425 áreas onde
existem 413 distintas. Era a razão pela qual as duas nunca podiam ser
unificadas numa linha só do painel.

## A escolha: consertar no DADO, não na interface

Havia duas saídas. Uma era um controle de corte na interface ("grandes" ×
"todas"), que resolveria a tela e deixaria a duplicação no arquivo — de onde
ela voltaria a morder qualquer consumidor novo (a página de alertas, um
download, um cálculo de área total). A outra, esta: o detalhe de Curvelo passa
a ser o COMPLEMENTO da camada geral, não um superconjunto dela.

Depois deste script, as duas camadas se somam sem repetir nada, e a interface
não precisa saber de corte nenhum.

## ⚠️ Este script é idempotente e precisa rodar DEPOIS de cada reexportação

`vazio-cadastral.geojson` nasce no pipeline do repositório `terras-devolutas` e
chega aqui por cópia. Reexportar de lá traz os 12 de volta. Rodar de novo é
seguro: se não houver duplicata, ele não escreve e diz que não havia.

## Por que casar por ÁREA com TOLERÂNCIA de posição — e não por geometria igual

Os dois arquivos saíram do mesmo cálculo, mas foram **simplificados de formas
diferentes**: medido em 15/08, os mesmos polígonos têm área idêntica até a
primeira casa (556,4 ha nos dois) e centroides que divergem na quarta casa
decimal — uns 15 metros. Comparar coordenada a coordenada, ou centroide
arredondado a 5 casas, casa ZERO de 12. A primeira versão deste script fazia
exatamente isso e a trava abaixo o pegou.

Então a identidade é a **área** (que sobrevive à simplificação) confirmada pela
**proximidade do centroide** (tolerância de 0,005°, uns 500 m — folgada para o
ruído de decimação e apertada demais para casar polígonos vizinhos, que nesta
camada distam quilômetros).

E o script **aborta** se o número de casados não for exatamente o esperado:
dedup que erra o alvo apaga achado de pesquisa.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

CAMADAS = Path(__file__).resolve().parent.parent / "dados" / "camadas"
GERAL = CAMADAS / "vazio-cadastral-bacia.geojson"
DETALHE = CAMADAS / "vazio-cadastral.geojson"

# O município do detalhe. Escrito aqui e conferido contra o dado: se o arquivo
# de detalhe algum dia passar a cobrir outra cidade, o script para em vez de
# deduplicar contra a suposição errada.
MUNICIPIO = "Curvelo"


def centroide(geometria: dict) -> tuple[float, float]:
    """Centroide simples dos vértices — serve como identidade, não como medida."""
    coords: list[list[float]] = []

    def coletar(no):
        if isinstance(no, (list, tuple)):
            if no and isinstance(no[0], (int, float)):
                coords.append(list(no[:2]))
            else:
                for filho in no:
                    coletar(filho)

    coletar(geometria.get("coordinates", []))
    if not coords:
        return (0.0, 0.0)
    return (
        round(sum(c[0] for c in coords) / len(coords), 5),
        round(sum(c[1] for c in coords) / len(coords), 5),
    )


# Tolerâncias. A de área é apertada porque a área sobrevive à simplificação; a
# de posição é folgada porque o centroide não sobrevive — ver o cabeçalho.
TOLERANCIA_AREA_HA = 0.05
TOLERANCIA_GRAUS = 0.005  # ~500 m


def casa(a: dict, b: dict) -> bool:
    """Se duas feições são o MESMO polígono, apesar de simplificações distintas."""
    area_a = a["properties"].get("area_ha") or 0
    area_b = b["properties"].get("area_ha") or 0
    if abs(area_a - area_b) > TOLERANCIA_AREA_HA:
        return False
    (xa, ya), (xb, yb) = centroide(a["geometry"]), centroide(b["geometry"])
    return abs(xa - xb) <= TOLERANCIA_GRAUS and abs(ya - yb) <= TOLERANCIA_GRAUS


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--conferir", action="store_true", help="só mede, não escreve")
    args = p.parse_args()

    geral = json.loads(GERAL.read_text(encoding="utf-8"))
    detalhe = json.loads(DETALHE.read_text(encoding="utf-8"))

    municipios = {f["properties"].get("municipio") for f in detalhe["features"]}
    if municipios != {MUNICIPIO}:
        print(
            f"ABORTADO: o detalhe cobre {sorted(municipios)}, não apenas {MUNICIPIO!r}. "
            "Refaça a conta de duplicação antes de apagar qualquer coisa.",
            file=sys.stderr,
        )
        return 2

    no_geral = [f for f in geral["features"] if f["properties"].get("municipio") == MUNICIPIO]
    duplicadas = [f for f in detalhe["features"] if any(casa(f, g) for g in no_geral)]
    restantes = [f for f in detalhe["features"] if not any(casa(f, g) for g in no_geral)]

    # Quantas o corte de tamanho prevê: tudo que tem 500 ha ou mais no detalhe
    # já deveria estar na camada geral. Se o casamento geométrico não achar
    # exatamente essas, alguma premissa mudou.
    grandes = [f for f in detalhe["features"] if (f["properties"].get("area_ha") or 0) >= 500]

    print(f"detalhe de {MUNICIPIO}: {len(detalhe['features'])} feições")
    print(f"  com 500+ ha (deveriam estar na camada geral): {len(grandes)}")
    print(f"  casadas com a camada geral por área+centroide: {len(duplicadas)}")
    print(f"  restariam: {len(restantes)}")

    if len(duplicadas) != len(grandes):
        print(
            f"ABORTADO: casei {len(duplicadas)} mas há {len(grandes)} com 500+ ha. "
            "Os dois números têm de bater — divergir significa que o casamento "
            "está pegando (ou perdendo) polígono, e apagar assim removeria "
            "achado de pesquisa.",
            file=sys.stderr,
        )
        return 2

    if not duplicadas:
        print("Nada a fazer: o detalhe já é complementar à camada geral.")
        return 0

    if args.conferir:
        print("\n--conferir: nada foi escrito.")
        return 0

    detalhe["features"] = restantes
    DETALHE.write_text(json.dumps(detalhe, ensure_ascii=False), encoding="utf-8")
    print(f"\nGravado: {len(restantes)} feições em {DETALHE.name} "
          f"({len(duplicadas)} removidas por já estarem na camada geral).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
