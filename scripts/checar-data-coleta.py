#!/usr/bin/env python3
"""Porteiro D1 da OITAVA QUALIDADE: data de coleta visível na página de dado.

Papel no portal: confere se toda rota do `lib/fontes/registry.ts` que tem
página própria (`rotaPortal` + `camada` data-json/public-assets/etl) carrega
um marcador visível de data de coleta — o componente `<DataColeta>`, um
`<time>`, ou texto com "coletado/coleta/gerado/atualizado em". Reporta o que
falta por rota. É a fiscalização do PLANO-DATA-DO-DADO.md (oitava qualidade
do AGENTS.md §8: rastreável no tempo).

Por que é estático: lê arquivo do disco e aplica regex — roda em segundos,
sem browser nem banco, igual ao `verificar-padrao-pagina.py`. A checagem no
browser (D2, Playwright) é a fase seguinte do plano; aqui é a peneira rápida
que impede o rollback silencioso.

Exit code com `--catraca`: 1 é REGRESSÃO — rota que a régua gravada tinha
datada e agora perdeu a data. Dívida nova (rota nunca datada) vira aviso e
entra na contagem para o dono baixar com o rollout; não trava commit alheio.
Sem `--catraca`: só mede e imprime.

Isenções: páginas de banco/ao-vivo (a data nasce na consulta, não no arquivo)
e hubs sem dado próprio ficam em ISENTACOES com motivo escrito — isenção sem
motivo é dívida disfarçada.

Uso:
  python scripts/checar-data-coleta.py [--json] [--catraca CAMPO]
                                        [--gravar-catraca CAMPO]
"""

import argparse
import datetime
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
REGISTRY = RAIZ / "apps" / "web" / "lib" / "fontes" / "registry.ts"
APP = RAIZ / "apps" / "web" / "app"

# Marcadores de data VISÍVEL aceitos na fonte da página. `DataColeta` é o
# componente padrão; os outros pegam páginas já datadas antes do rollout.
MARCADORES = re.compile(
    r"DataColeta|<time\b|coletadoEm|coletado em|coleta própria|Coleta própria|"
    r"dados de |Dados de |gerado em|atualizado em|baixou em|sondado em",
    re.IGNORECASE,
)

# Camadas cujo dado é arquivo versionado (tem carimbo `geradoEm` no dump).
CAMADAS_ARQUIVO = {"data-json", "public-assets", "etl"}

# Rota -> motivo. Banco/ao-vivo: a data correta nasce na consulta (Fase
# seguinte do plano põe selo no resultado). Hub/geo: não publica agregado de
# arquivo carimbado. Nada de isenção sem motivo escrito.
ISENTACOES = {
    "/ambiental/legislacao": "banco (Drizzle)",
    "/congresso/parlamentares": "banco (Drizzle via lib/congresso)",
    "/funcaosocialterra/mapa": "geojson no cliente (globo)",
    "/paraopeba/auditoria": "bundle etl sem carimbo até o próximo re-dump",
}


def fonte_rota_e_camada():
    """Varre o registry e devolve [(rotaPortal, camada)] das fontes com rota."""
    texto = REGISTRY.read_text(encoding="utf-8")
    saida = []
    # Cada entrada do REGISTRY_FONTES abre em 2 espaços: `  "slug-x": {`.
    # As chaves internas do TS são SEM aspas (rotaPortal: "..."), não
    # "rotaPortal": — o parser aceita os dois jeitos por folga.
    for bloco in re.findall(r"\n  \"[^\"]+\": \{\n(.*?)\n  \}", texto, re.DOTALL):
        rota = re.search(r'"?rotaPortal"?\s*:\s*"([^"]+)"', bloco)
        camada = re.search(r'"?camada"?\s*:\s*"([^"]+)"', bloco)
        if rota and camada:
            saida.append((rota.group(1), camada.group(1)))
    return saida


def arquivo_da_rota(rota):
    """Rota -> apps/web/app/**/page.tsx; None se não existe (dinâmica/etc)."""
    caminho = APP.joinpath(*[p for p in rota.split("/") if p]).joinpath("page.tsx")
    return caminho if caminho.exists() else None


def linha_da_rota(rota):
    """Classifica UMA rota: datada, isenta, sem página ou devendo a data."""
    if rota in ISENTACOES:
        return {"rota": rota, "estado": "isenta", "motivo": ISENTACOES[rota]}
    pagina = arquivo_da_rota(rota)
    if pagina is None:
        return {"rota": rota, "estado": "sem-pagina", "motivo": "rota dinâmica ou ausente"}
    tem = bool(MARCADORES.search(pagina.read_text(encoding="utf-8")))
    estado = "datada" if tem else "falta-data"
    return {"rota": rota, "estado": estado, "arquivo": str(pagina.relative_to(RAIZ))}


def auditar():
    """Mede cada rota de arquivo: datada, isenta ou dívida. Sem opinião."""
    vistos = set()
    resultados = []
    for rota, camada in fonte_rota_e_camada():
        if camada not in CAMADAS_ARQUIVO or rota in vistos:
            continue
        vistos.add(rota)
        resultados.append(linha_da_rota(rota))
    return resultados


def resumo(resultados):
    cont = {}
    for r in resultados:
        cont[r["estado"]] = cont.get(r["estado"], 0) + 1
    return cont


def gravar_catraca(resultados, caminho):
    base = {r["rota"]: r["estado"] for r in resultados if r["estado"] != "sem-pagina"}
    payload = {"gravadaEm": datetime.datetime.now(datetime.timezone.utc).isoformat(), "estados": base}
    Path(caminho).write_text(json.dumps(payload, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"catraca gravada em {caminho} ({len(base)} rotas)")


def comparar_catraca(resultados, caminho):
    """Regressão = rota que a régua tinha 'datada' e agora não está mais."""
    arquivo = Path(caminho)
    if not arquivo.exists():
        print(f"::error::catraca ausente ({caminho}); grave com --gravar-catraca")
        return [{"rota": "__catraca__", "regressao": "arquivo de catraca ausente"}]
    base = json.loads(arquivo.read_text(encoding="utf-8"))["estados"]
    agora = {r["rota"]: r["estado"] for r in resultados}
    return [
        {"rota": r, "regressao": f"estava datada, agora: {agora.get(r, 'sumiu')}"}
        for r, estado in base.items()
        if estado == "datada" and agora.get(r) not in ("datada", "isenta")
    ]


def imprimir_tabela(resultados):
    marca = {"datada": "OK ", "isenta": "-- ", "falta-data": "!!", "sem-pagina": " ."}
    for r in sorted(resultados, key=lambda x: (x["estado"], x["rota"])):
        extra = r.get("motivo", r.get("arquivo", ""))
        print(f"[{marca[r['estado']]}] {r['rota']}  {extra}")
    print(f"resumo: {resumo(resultados)}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--catraca", default=None)
    parser.add_argument("--gravar-catraca", default=None)
    args = parser.parse_args()

    resultados = auditar()
    if args.gravar_catraca:
        gravar_catraca(resultados, args.gravar_catraca)
    if args.json:
        print(json.dumps({"resumo": resumo(resultados), "resultados": resultados}, ensure_ascii=False, indent=1))
    else:
        imprimir_tabela(resultados)
    if not args.catraca:
        return 0
    regressoes = comparar_catraca(resultados, args.catraca)
    if not regressoes:
        print("catraca: nenhuma regressão (dívidas novas ficam no resumo acima)")
        return 0
    for g in regressoes:
        print(f"::error::regressão de data visível: {g['rota']} — {g['regressao']}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
