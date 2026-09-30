#!/usr/bin/env python3
"""
gerar-camada-revoltas.py — camada `hist-revoltas` (P6 do
PLANO-HISTORIA-CAMADAS-GLOBO-3D.md).

O que faz: varre o acervo de memória (`apps/web/lib/memoria/calendario.ts`) e
grava um ponto para cada verbete cujo LUGAR o gazetteer curado reconhece —
`lib/memoria/locais.ts`, que só casa nome de movimento inequívoco.

Por que um gerador, e não copiar os pontos: o gazetteer tem TESTE
(`locais.test.ts`), e a coordenada dele é conferida contra o IBGE. Duplicar a
lista aqui faria as duas versões divergirem — a camada do globo nasce do mesmo
lugar que a página `/historia` e a Mística.

⚠️ É PISO: 14 dos 533 verbetes ganham lugar. O resto fica sem ponto, e a lacuna
é declarada (AGENTS § 7).

Uso: python scripts/gerar-camada-revoltas.py
"""
import json
import re
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
CALENDARIO = RAIZ / "apps" / "web" / "lib" / "memoria" / "calendario.ts"
LOCAIS = RAIZ / "apps" / "web" / "lib" / "memoria" / "locais.ts"
SAIDA = RAIZ / "apps" / "web" / "public" / "terras" / "globo" / "dados" / "camadas" / "hist-revoltas.geojson"


def eventos_do_calendario() -> list[dict]:
    """Extrai os verbetes com lugar usando o PRÓPRIO gazetteer, via tsx.

    O tsx precisa de import RELATIVO (import absoluto de caminho do Windows não
    resolve), então o script gera um `.mts` temporário dentro de `apps/web/` e o
    apaga em seguida.
    """
    temp = RAIZ / "apps" / "web" / ".tmp-revoltas.mts"
    temp.write_text(
        "import { CALENDARIO_LUTAS } from './lib/memoria/calendario';\n"
        "import { localDaEntrada } from './lib/memoria/locais';\n"
        "const out = [];\n"
        "for (const e of CALENDARIO_LUTAS) {\n"
        "  const l = localDaEntrada(e);\n"
        "  if (!l) continue;\n"
        "  out.push({ diaMes: e.diaMes, ano: e.ano, titulo: e.titulo, lugar: l.nome,\n"
        "             uf: l.uf, lat: l.lat, lon: l.lon, ctx: l.ctx ?? null });\n"
        "}\n"
        "console.log(JSON.stringify(out));\n",
        encoding="utf-8",
    )
    try:
        r = subprocess.run(
            ["npx", "tsx", ".tmp-revoltas.mts"],
            capture_output=True, text=True, cwd=RAIZ / "apps" / "web", shell=True,
        )
        if r.returncode != 0:
            print(r.stderr[-800:], file=sys.stderr)
            raise SystemExit("falhou ao ler o calendario")
        return json.loads(r.stdout.strip().splitlines()[-1])
    finally:
        temp.unlink(missing_ok=True)


eventos = eventos_do_calendario()
features = [{
    "type": "Feature",
    "geometry": {"type": "Point", "coordinates": [e["lon"], e["lat"]]},
    "properties": {
        "titulo": e["titulo"],
        "ano": e["ano"],
        "dia_mes": e["diaMes"],
        "lugar": e["lugar"],
        "uf": e["uf"],
        "ctx": e["ctx"],
        "fonte": "Acervo de memória do portal (MST e Blog Aos que Virão); lugar pelo gazetteer curado (IBGE)",
        "natureza": "evento datado; piso — só o lugar inequívoco vira ponto",
    },
} for e in eventos]

SAIDA.write_text(json.dumps({
    "type": "FeatureCollection",
    "_nota": (
        "Revoltas e lutas com lugar inequívoco (gazetteer curado). Os fatos vêm do "
        "acervo de memória do portal; a coordenada é o centroide do município do IBGE. "
        "Piso: 14 de 533 verbetes ganham lugar — o resto fica sem ponto, e a lacuna é informação."
    ),
    "features": features,
}, ensure_ascii=False), encoding="utf-8")
print(f"revoltas no mapa: {len(features)} | {SAIDA.stat().st_size/1024:.0f} KB")
