#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera a base versionada de Destinacoes de Imoveis da Uniao em Minas Gerais.

Papel no portal (Plano 3 - Autorizacoes Territoriais):
    Alimenta a rota /ambiental/autorizacoes com a relacao REAL de imoveis da
    Uniao em MG e o regime/destinacao de cada um (cessao de uso, uso proprio,
    processo de destinacao, sem destinacao, entrega, locacao, etc.).

Fonte oficial:
    SPU - Secretaria de Coordenacao e Governanca do Patrimonio da Uniao,
    Painel de Transparencia Ativa, aba "Imoveis da Uniao", filtro UF = MG.
    Export CSV de 29/07/2026 (4.336 linhas em MG; 553 com coordenada
    geocodificada, que e o recorte que virou camada no globo 3D).
    URL: https://qlik-publico.paineis.gov.br/extensions/transparencia-ativa/
         transparencia-ativa.html

Entrada (ja rastreada no repo, nao ha coleta de rede aqui):
    apps/web/public/terras/globo/dados/camadas/spu-imoveis-uniao.geojson

Saida:
    apps/web/data/destinacoes-uniao-mg.json

Decisoes tecnicas:
    - O campo `destinacao` e a traducao direta de `regime` da fonte; NAO
      inferimos TAUS/CDRU nem inventamos numero de processo. O imovel da Uniao
      sem regime explicito vira "Sem Destinacao Definida" (o valor da fonte).
    - Zero CPF/CNPJ: a fonte nao traz dado pessoal; so o registro do imovel.
    - Reprocessavel: rodar de novo sobrescreve o JSON com a data do dia.
"""

from __future__ import annotations

import json
from collections import Counter
from datetime import date, datetime, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[3]
ENTRADA = RAIZ / "apps/web/public/terras/globo/dados/camadas/spu-imoveis-uniao.geojson"
SAIDA = RAIZ / "apps/web/data/destinacoes-uniao-mg.json"

FONTE = "SPU - Painel de Transparencia Ativa (aba Imoveis da Uniao, UF=MG)"
FONTE_URL = (
    "https://qlik-publico.paineis.gov.br/extensions/transparencia-ativa/"
    "transparencia-ativa.html"
)
DATA_ACESSO = "2026-08-15"


def normalizar_regime(regime: str | None) -> str:
    """Limpa o separador de combinacao da fonte ("A - B" -> "A") e espacos."""
    if not regime:
        return "Nao Informado"
    primeira = regime.split("\u2013")[0].split(" - ")[0].strip()
    return primeira or "Nao Informado"


def main() -> None:
    geojson = json.loads(ENTRADA.read_text(encoding="utf-8"))
    registros = []
    for feat in geojson.get("features", []):
        p = feat.get("properties", {})
        rip = p.get("rip")
        if not rip:
            continue
        registros.append(
            {
                "id": f"uniao-mg-{rip}",
                "rip": str(rip),
                "municipio": p.get("municipio") or "Nao Informado",
                "areaHa": p.get("area_ha"),
                "destinacao": normalizar_regime(p.get("regime")),
                "regimeCompleto": p.get("regime"),
                "classe": p.get("classe"),
                "tipo": p.get("tipo"),
                "proprietario": p.get("proprietario_oficial"),
                "latitude": p.get("ponto_lat"),
                "longitude": p.get("ponto_lon"),
                "fonte": FONTE,
                "fonteUrl": FONTE_URL,
            }
        )

    registros.sort(key=lambda r: (r["municipio"] or "", -float(r["areaHa"] or 0)))

    resumo = Counter(r["destinacao"] for r in registros)
    saida = {
        "metadados": {
            "titulo": "Destinacoes de Imoveis da Uniao em Minas Gerais",
            "fonte": FONTE,
            "fonteUrl": FONTE_URL,
            "dataAcessoFonte": DATA_ACESSO,
            "geradoEm": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "dataReferencia": date.today().isoformat(),
            "total": len(registros),
            "totalMunicipios": len({r["municipio"] for r in registros}),
            "porDestinacao": dict(resumo.most_common()),
            "ressalva": (
                "Cadastro de imoveis da Uniao em MG com o regime/destinacao de "
                "cada um. Nao e a relacao nominal de TAUS/CDRU: o termo "
                "individual de autorizacao nao e publicado neste cadastro. "
                "Imovel sem regime explicito na fonte aparece como "
                "'Sem Destinacao Definida'."
            ),
        },
        "imoveis": registros,
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(
        json.dumps(saida, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"OK {SAIDA.name}: {len(registros)} imoveis, {len(resumo)} destinacoes")


if __name__ == "__main__":
    main()
