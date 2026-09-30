#!/usr/bin/env python3
"""
coletar-apm-territorio-historico.py — coleta o acervo de terras do Arquivo
Público Mineiro (SIAAPM) para o plano de camadas históricas do globo 3D.

═══ O QUE ESTE COLETOR PRODUZ, E POR QUÊ ═══

Dois conjuntos, medidos em 30/09/2026:

1. **Sesmarias — ÍNDICE documental.** A busca do APM por "sesmaria" devolve
   **620 registros de SÉRIE**: cada um é um LIVRO de registro ("Registro de
   sesmarias", notação SC-106, 1753-1754, rolo de microfilme). O catálogo NÃO
   traz o lugar de cada sesmaria — quem quiser a freguesia precisa ler o índice
   digitalizado do livro. Então aqui NÃO se inventa ponto: publica-se o índice
   com data, notação e link, e a ausência de lugar fica declarada.

2. **Terras Públicas — índice + CAMADA de pontos (piso).** O módulo "Repartição
   Especial das Terras Públicas" tem **244 registros**, e 40 deles trazem o
   MUNICÍPIO no próprio título ("Nossa Senhora do Rosário do (Mariana)"). Só
   esses 40 viram ponto no mapa, no centróide do município do IBGE, com
   dispersão determinística para não empilhar. Os outros 204 são
   correspondência administrativa sem lugar — ficam no índice e fora do mapa.

Fonte oficial: Arquivo Público Mineiro (SIAAPM), Secretaria de Estado de Cultura
e Turismo de Minas Gerais. `robots.txt` do host: 404 (sem declaração) → coleta
com User-Agent honesto e pausa de 2 s entre páginas.

⚠️ Dado pessoal: os títulos de Terras Públicas às vezes citam requerentes; o
campo de nome NÃO é publicado no GeoJSON (só município, período e link), e a
varredura de dado pessoal roda antes do commit (AGENTS § 5.2).

Uso:
    python scripts/coletar-apm-territorio-historico.py
"""
from __future__ import annotations

import json
import re
import time
import unicodedata
from pathlib import Path

import requests

RAIZ = Path(__file__).resolve().parents[1]
BASE = "https://www.siaapm.cultura.mg.gov.br"
UA = "ControlePopular/1.0 (+controlepopular.com.br; transparencia)"

INDICE_SESMARIAS = RAIZ / "apps" / "web" / "data" / "apm-sesmarias-indice.json"
INDICE_TERRAS = RAIZ / "apps" / "web" / "data" / "apm-terras-publicas-indice.json"
CAMADA = RAIZ / "apps" / "web" / "public" / "terras" / "globo" / "dados" / "camadas" / "hist-terras-publicas.geojson"
CENTROIDES = RAIZ / "apps" / "web" / "data" / "municipios-centroides.json"

PAUSA = 2.0  # segundos entre páginas — regra da casa para fonte pública

# Cada `<li>` da lista é: <a href='brtacervo.php?cid=N'>NOTACAO - TITULO <span
# class='busca_data'>(PERIODO)</span></a> nas Terras Públicas e
# `<span class='busca_data'>PERIODO</span>` (SEM parênteses) nas Sesmarias —
# por isso o parêntese é opcional no padrão. `&nbsp;` aparece como separador.
ITEM = re.compile(
    r"<a href='([^']*cid=(\d+))'>(.*?)<span class='busca_data'>\(?([^)<]*)\)?</span></a>",
    re.S,
)
MUNICIPIO = re.compile(r"\(([^)]+)\)\s*$")  # "(Mariana)" no FIM do título


def slug_municipio(nome: str, uf: str = "MG") -> str:
    """Mesmo slug do índice de centróides do IBGE: 'São Luís'/MA -> 'saoluis_ma'."""
    limpo = (
        unicodedata.normalize("NFD", nome)
        .encode("ascii", "ignore")
        .decode("ascii")
        .lower()
    )
    return f"{re.sub(r'[^a-z0-9]', '', limpo)}_{uf.lower()}"


def paginar(sessao: requests.Session, modulo: str, limite_paginas: int = 400) -> list[dict]:
    """Percorre a busca do módulo (20 por página) até a página voltar vazia.

    O fim tem de ser provado por página VAZIA, nunca pelo teto: bater no teto e
    chamar de total é subcontar em silêncio — foi o que aconteceu na primeira
    rodada (o teto de 80 páginas devolveu exatamente 1.600 e parecia completo).
    """
    itens: list[dict] = []
    for pagina in range(limite_paginas):
        r = sessao.get(
            f"{BASE}/modules/{modulo}/search.php",
            params={
                "query": "sesmaria" if modulo == "brtacervo" else "",
                "andor": "AND", "ordenar": "30", "asc_desc": "10",
                "submit": "Executar pesquisa", "action": "results", "start": pagina * 20,
            },
            timeout=90,
        )
        r.raise_for_status()
        achados = ITEM.findall(r.text)
        if not achados:
            break
        for href, cid, bruto, periodo in achados:
            texto = re.sub(r"&nbsp;", " ", bruto)
            texto = re.sub(r"\s+", " ", texto).strip(" -")
            # Notação: "SC-01 - Título" ou "SC-01  Título" (dois espaços).
            notacao = re.split(r"\s\s+|\s-\s", texto, maxsplit=1)[0].strip()
            titulo = texto[len(notacao):].lstrip(" -").strip()
            itens.append({
                "cid": int(cid),
                "notacao": notacao,
                "titulo": titulo or notacao,
                "periodo": periodo.strip(),
                "modulo": modulo,
                "url": f"{BASE}/modules/{modulo}/brtacervo.php?cid={cid}",
            })
        time.sleep(PAUSA)  # pausa entre páginas, não entre itens da mesma página
    else:
        raise RuntimeError(
            f"{modulo}: bati em {limite_paginas} páginas sem provar o fim "
            f"({len(itens)} itens) — recuso gravar contagem que pode estar truncada."
        )
    return itens


def jitter(cid: int) -> tuple[float, float]:
    """Afastamento determinístico (~1 km) para pontos do mesmo município não
    empilharem. Sai do próprio id do registro, então o mapa é reprodutível."""
    a = (cid * 2654435761) % 360
    raio = 0.008 + ((cid % 7) * 0.0012)
    import math
    rad = math.radians(a)
    return (raio * math.cos(rad), raio * math.sin(rad))


def main() -> int:
    sessao = requests.Session()
    sessao.headers.update({"User-Agent": UA})
    centroides = json.loads(CENTROIDES.read_text(encoding="utf-8"))

    print("coletando sesmarias (brtacervo, palavra-chave 'sesmaria')...")
    sesmarias = paginar(sessao, "brtacervo")
    print(f"  {len(sesmarias)} registros de série")

    print("coletando Terras Públicas...")
    terras = paginar(sessao, "terras_publicas")
    print(f"  {len(terras)} registros")

    com_lugar, sem_casar, features = [], [], []
    for t in terras:
        m = MUNICIPIO.search(t["titulo"])
        if not m:
            continue
        municipio = m.group(1).strip()
        chave = slug_municipio(municipio)
        coord = centroides.get(chave)
        if not coord:
            sem_casar.append({"cid": t["cid"], "municipio_lido": municipio})
            continue
        lat, lon = coord[0], coord[1]
        dlat, dlon = jitter(t["cid"])
        t2 = {**t, "municipio": municipio, "lat": round(lat + dlat, 6), "lon": round(lon + dlon, 6)}
        com_lugar.append(t2)
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [t2["lon"], t2["lat"]]},
            "properties": {
                "notacao": t["notacao"],
                "municipio": municipio,
                "periodo": t["periodo"],
                "titulo": t["titulo"],
                "fonte": "Arquivo Público Mineiro — Repartição Especial das Terras Públicas",
                "url": t["url"],
                "natureza": "registro documental; ponto no centroide do município (piso)",
            },
        })

    saida_idx = {
        "fonte": "Arquivo Público Mineiro (SIAAPM) — Secretaria de Estado de Cultura e Turismo de MG",
        "fonte_url": f"{BASE}/modules/brtacervo/search.php?query=sesmaria",
        "coletado_em": time.strftime("%Y-%m-%d"),
        "ressalva": (
            "O APM cataloga o LIVRO de registro de sesmarias, não cada sesmaria com "
            "lugar. Georreferenciar sesmaria a sesmaria exige ler o índice digitalizado "
            "do livro — fora do alcance de um coletor."
        ),
        "total": len(sesmarias),
        "registros": sesmarias,
    }
    INDICE_SESMARIAS.write_text(json.dumps(saida_idx, ensure_ascii=False, indent=1), encoding="utf-8")

    saida_tp = {
        "fonte": saida_idx["fonte"],
        "coletado_em": saida_idx["coletado_em"],
        "total": len(terras),
        "com_municipio_no_titulo": len(com_lugar) + len(sem_casar),
        "sem_municipio_no_titulo": len(terras) - len(com_lugar) - len(sem_casar),
        "municipio_nao_casado_no_ibge": len(sem_casar),
        "nao_casados": sem_casar,
        "registros": terras,
    }
    INDICE_TERRAS.write_text(json.dumps(saida_tp, ensure_ascii=False, indent=1), encoding="utf-8")

    CAMADA.parent.mkdir(parents=True, exist_ok=True)
    CAMADA.write_text(
        json.dumps({
            "type": "FeatureCollection",
            "_nota": (
                "Registros de terras públicas de MG (Arquivo Público Mineiro) que trazem "
                "o município no título. Ponto no centroide do município do IBGE, com "
                "dispersão determinística; é PISO — a maior parte do acervo não tem lugar "
                "no título."
            ),
            "features": features,
        }, ensure_ascii=False),
        encoding="utf-8",
    )

    print(f"sesmarias: {len(sesmarias)} | terras publicas: {len(terras)} "
          f"| com municipio: {len(com_lugar) + len(sem_casar)} | no mapa: {len(features)} "
          f"| nao casaram no IBGE: {len(sem_casar)}")
    if sem_casar:
        print("  não casaram:", [s["municipio_lido"] for s in sem_casar])
    print(f"  {INDICE_SESMARIAS.name}, {INDICE_TERRAS.name}, {CAMADA.name} ({CAMADA.stat().st_size/1024:.0f} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
