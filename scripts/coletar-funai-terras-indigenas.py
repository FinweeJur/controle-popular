r"""coletar-funai-terras-indigenas.py — terras indígenas do Brasil (FUNAI, WFS).

O QUE É: baixa da camada `Funai:tis_poligonais_portarias` do GeoServer público
da FUNAI os atributos de TODAS as terras indígenas do país — nome, etnia,
municípios, UF, área, fase de demarcação e data/título de cada portaria — e
grava `apps/web/data/funai-terras-indigenas.json` com um resumo por UF.

FONTE OFICIAL: https://geoserver.funai.gov.br/geoserver/Funai/ows (WFS),
camada `tis_poligonais_portarias`, publicada pela própria FUNAI na página
https://www.gov.br/funai/pt-br/atuacao/terras-indigenas/geoprocessamento-e-mapas
(links prontos por UF). `robots.txt` do host do GeoServer: **404** (sem
declaração de restrição, medido 18/11/2026); a camada é link público do
publicador. User-Agent honesto `finweejur/github artur colito`, 2 s entre
requisições ao mesmo host.

MEDIÇÃO (18/11/2026, sondagem em
`docs/historico/descobertas/ambiental-PA-consulta-e-satelite.md`):

- 1 requisição nacional com `propertyname` (sem geometria) = **241.925 B com
  estes 24 campos** (179.028 B na sondagem de 19 campos), **667 terras
  indígenas**, soma **125.421.723,4 ha**.
- Com `uf_sigla='PA'`: **51 TIs, 19.064.417,8 ha** — igual ao medido em
  17/11/2026 na camada irmã `tis_poligonais`.
- 19 TIs dividem mais de uma UF (`uf_sigla` vem como `"AM,PA"`,
  `"RR, PA, AM"`). Repetir a área em cada UF inflaria a soma e a FUNAI não diz
  em que proporção a TI está em cada estado — então TI dividida não é
  atribuída a UF nenhuma: vai inteira para `ti_compartilhadas`, e
  `soma(por_uf.area_ha) + area_ti_compartilhada_ha == total_ha`. Assim o Pará
  dá exatamente as **51 TIs / 19.064.417,8 ha** medidas à parte com
  `CQL_FILTER=uf_sigla='PA'` na camada irmã.

POR QUE SEM GEOMETRIA: o polígono é o custo. O recorte do PA com geometria
pesa 10,6 MB para 51 feições; as 667 do país passariam de 100 MB, que não
entra no repositório. Este arquivo carrega só atributos (área, fase,
portarias). Quem precisa do desenho usa a camada já publicada em
`apps/web/public/terras/globo/dados/camadas/terras-indigenas.geojson`, gerada
por `scripts/coletar-terras-indigenas.mts`. Sem centróide/bbox aqui: buscá-los
exigiria uma requisição por TI com `the_geom`.

ARMADILHA MEDIDA: `data_atualizacao` NÃO existe nesta camada (o WFS devolve
`ServiceException` com status 200 dizendo quais campos existem — a lista está
em `CAMPOS`). A versão anterior da sondagem leu esse campo na camada
`tis_poligonais`, não nesta. Corpo XML com status 200 é exceção, não dado: o
parser recusa. Duas armadilhas de 403 medidas no mesmo dia:
`resultType=hits` leva **403 do nginx**, e pedir `GetFeature` **sem
`maxFeatures`** também leva 403 (mesma URL, único parâmetro diferente: com
`maxFeatures=2000` responde 200), então o parâmetro é obrigatório aqui e
funciona como teto de segurança, não como página. Sem contagem declarada pelo
servidor, a prova de que a resposta veio inteira é a comparação com o último
arquivo publicado (menos de 90% do total anterior aborta sem sobrescrever).

O QUE NÃO SE AFIRMA COM ESTE DADO: `fase_ti` é a fase administrativa
declarada pela FUNAI. Nenhum campo fala de consulta prévia (Convenção 169
OIT), empreendimento ou licenciamento — terra demarcada não prova que o povo
foi consultado.

CHECKPOINT: a resposta bruta (CSV + contagem de feições) fica em
`scripts/.cache/funai-terras-indigenas/`. Re-rodar não rebaixa: cache válido é
usado sem tocar na rede. `--refetch` ignora o cache; `--dry-run` só conta.

  python scripts/coletar-funai-terras-indigenas.py
  python scripts/coletar-funai-terras-indigenas.py --refetch
  python scripts/coletar-funai-terras-indigenas.py --dry-run
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)

LOG = "[coletar-funai-terras-indigenas]"
BASE = "https://geoserver.funai.gov.br/geoserver/Funai/ows"
CAMADA = "Funai:tis_poligonais_portarias"
UA = "finweejur/github artur colito"
PAUSA = 2  # s entre requisições ao mesmo host
TENTATIVAS = 3
RAIZ = Path(__file__).resolve().parent
CACHE = RAIZ / ".cache" / "funai-terras-indigenas"
SAIDA = RAIZ.parent / "apps" / "web" / "data" / "funai-terras-indigenas.json"
BRUTO = CACHE / "tis_poligonais_portarias-brasil.csv"
META = CACHE / "meta.json"

UFS = ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS",
       "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC",
       "SE", "SP", "TO"]

# Campos pedidos ao WFS (nunca `the_geom`). Lista conferida contra a mensagem
# do próprio serviço em 18/11/2026.
CAMPOS = [
    "terrai_codigo", "terrai_nome", "etnia_nome", "municipio_nome", "uf_sigla",
    "superficie_perimetro_ha", "fase_ti", "modalidade_ti", "reestudo_ti", "cr",
    "faixa_fronteira", "undadm_codigo", "undadm_nome", "undadm_sigla",
    "data_em_estudo", "tit_em_estudo", "data_delimitada", "tit_delimitada",
    "data_declarada", "tit_declarada", "data_homologada", "tit_homologada",
    "data_regularizada", "tit_regularizada",
]

RESSALVA = (
    "Fase de demarcação declarada pela FUNAI não é consulta prévia: nenhum "
    "campo desta camada diz se o povo foi ouvido (Convenção 169 da OIT). "
    "Área é a do polígono oficial, não a área efetivamente ocupada. Este "
    "arquivo NÃO tem geometria nem coordenada — o mapa está em "
    "`terras-indigenas.geojson`. TI que divide UFs aparece uma vez, com todas "
    "as siglas em `ufs`.")

_TAG = re.compile(r"<[?!]?[A-Za-z/]")


def _get(params: dict, nome: str) -> bytes:
    """GET no WFS com UA honesto, pausa e retentativa (o host derruba em rajada)."""
    url = f"{BASE}?{urllib.parse.urlencode(params)}"
    erro = None
    for tentativa in range(1, TENTATIVAS + 1):
        time.sleep(PAUSA)
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                corpo = r.read()
        except Exception as e:  # HTTPError/URLError/timeout: insiste, host instável
            erro = e
            print(f"{LOG} {nome}: tentativa {tentativa}/{TENTATIVAS} falhou ({e})")
            time.sleep(PAUSA * 3 * tentativa)
            continue
        if not corpo:
            erro = RuntimeError("corpo vazio com status 200")
        elif _TAG.match(corpo[:200].decode("utf-8", "replace").lstrip()):
            # WFS 1.0.0 devolve exceção em XML com status 200.
            erro = RuntimeError(
                "servidor devolveu XML (exceção WFS) com status 200: "
                + re.sub(r"\s+", " ", corpo.decode("utf-8", "replace"))[:300])
        else:
            return corpo
        print(f"{LOG} {nome}: tentativa {tentativa}/{TENTATIVAS} inválida ({erro})")
        time.sleep(PAUSA * 3 * tentativa)
    raise RuntimeError(f"{nome}: {TENTATIVAS} tentativas sem corpo válido — {erro}")


def _baixar(refetch: bool = False) -> str:
    """CSV nacional; cache válido ganha da rede, cache quebrado cai para a rede."""
    if not refetch and BRUTO.exists():
        texto = BRUTO.read_text(encoding="utf-8", errors="replace")
        if _parece_csv(texto):
            print(f"{LOG} cache: {BRUTO} ({BRUTO.stat().st_size:,} B) — sem refetch")
            return texto
        print(f"{LOG} cache inválido, baixando de novo")
    params = {"service": "WFS", "version": "1.0.0", "request": "GetFeature",
              "typeName": CAMADA, "propertyname": ",".join(CAMPOS),
              "outputFormat": "csv", "maxFeatures": "2000"}
    corpo = _get(params, "csv")
    texto = corpo.decode("utf-8")
    if not _parece_csv(texto):
        raise RuntimeError("CSV nacional sem as colunas esperadas")
    CACHE.mkdir(parents=True, exist_ok=True)
    BRUTO.write_bytes(corpo)
    META.write_text(json.dumps({"baixado_em": datetime.now(timezone.utc).isoformat(),
                                "bytes": len(corpo),
                                "requisicao": urllib.parse.urlencode(params)}),
                    encoding="utf-8")
    print(f"{LOG} baixado: {len(corpo):,} B")
    return texto


def _parece_csv(texto: str) -> bool:
    if not texto or _TAG.match(texto[:200].lstrip()):
        return False
    cabecalho = texto.split("\n", 1)[0].strip()
    return all(c in cabecalho.split(",") for c in ("terrai_codigo", "fase_ti", "uf_sigla"))


def _lista(texto: str) -> list[str]:
    """`municipio_nome`/`uf_sigla` vêm concatenados: vírgula aqui, ` e ` na
    camada irmã `tis_poligonais` (medido nas duas em 17-18/11/2026)."""
    partes = (t.strip() for t in re.split(r",|\se\s", texto or ""))
    return [p for p in partes if p]


def _num(texto: str) -> float:
    """Área no padrão brasileiro: `1.234,56` (o `float()` cru devolveria 0)."""
    s = (texto or "").strip()
    if not s:
        return 0.0
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    try:
        return round(float(s), 2)
    except ValueError:
        return 0.0


def _parse(texto: str) -> list[dict]:
    linhas = []
    for r in csv.DictReader(io.StringIO(texto)):
        ufs = _lista(r.get("uf_sigla"))
        linhas.append({
            "terrai_codigo": (r.get("terrai_codigo") or "").strip(),
            "terrai_nome": (r.get("terrai_nome") or "").strip(),
            "etnia_nome": (r.get("etnia_nome") or "").strip(),
            "ufs": ufs,
            "municipios": _lista(r.get("municipio_nome")),
            "superficie_perimetro_ha": _num(r.get("superficie_perimetro_ha")),
            "fase_ti": (r.get("fase_ti") or "").strip(),
            "modalidade_ti": (r.get("modalidade_ti") or "").strip(),
            "reestudo_ti": (r.get("reestudo_ti") or "").strip(),
            "cr": (r.get("cr") or "").strip(),
            "faixa_fronteira": (r.get("faixa_fronteira") or "").strip(),
            "undadm_nome": (r.get("undadm_nome") or "").strip(),
            "undadm_sigla": (r.get("undadm_sigla") or "").strip(),
            **{c: (r.get(c) or "").strip() for c in CAMPOS if c.startswith("data_") or c.startswith("tit_")},
        })
    return linhas


def _resumo(linhas: list[dict]) -> tuple[dict, float, list[dict], float]:
    """Resumo por UF.

    TI que a FUNAI lista com uma UF só entra naquela UF. TI que divide duas ou
    três UFs NÃO é atribuída a nenhuma: repetir a área inflaria a soma, e
    escolher uma UF seria arbitrar sobre um dado que a fonte não tem (a FUNAI
    não diz em que proporção a TI está em cada estado). Elas vão inteiras para
    `ti_compartilhadas`, e por isso
    `soma(por_uf.area_ha) + area_compartilhada_ha == total_ha`.

    Consequência boa: o Pará primário dá exatamente as 51 TIs / 19.064.417,8 ha
    medidas à parte com `CQL_FILTER=uf_sigla='PA'` na camada irmã.
    """
    por_uf: dict[str, dict] = {}
    municipios: dict[str, set] = {}
    compartilhadas: list[dict] = []
    compartilhada_ha = 0.0
    for ti in linhas:
        ufs = sorted(ti["ufs"])
        area = ti["superficie_perimetro_ha"]
        if len(ufs) == 1:
            item = por_uf.setdefault(ufs[0], {"tis": 0, "area_ha": 0.0, "compartilhadas": 0})
            item["tis"] += 1
            item["area_ha"] = round(item["area_ha"] + area, 2)
        else:
            compartilhada_ha += area
            compartilhadas.append({"terrai_codigo": ti["terrai_codigo"],
                                   "terrai_nome": ti["terrai_nome"],
                                   "ufs": ufs, "area_ha": area})
        for uf in ufs or ["(sem UF)"]:
            por_uf.setdefault(uf, {"tis": 0, "area_ha": 0.0, "compartilhadas": 0})
            municipios.setdefault(uf, set()).update(ti["municipios"])
            if len(ufs) > 1:
                por_uf[uf]["compartilhadas"] += 1
    for uf, nomes in municipios.items():
        por_uf[uf]["municipios"] = len(nomes)
    return (dict(sorted(por_uf.items())),
            round(sum(v["area_ha"] for v in por_uf.values()), 2),
            sorted(compartilhadas, key=lambda t: -t["area_ha"]),
            round(compartilhada_ha, 2))


def main() -> None:
    ap = argparse.ArgumentParser(description="Terras indígenas do Brasil (FUNAI/WFS)")
    ap.add_argument("--refetch", action="store_true", help="ignora o cache e baixa de novo")
    ap.add_argument("--dry-run", action="store_true", help="só conta, não grava JSON")
    args = ap.parse_args()

    print(f"{LOG} terras indígenas do Brasil — camada {CAMADA}")
    print(f"{LOG} cache: {CACHE}")
    texto = _baixar(args.refetch)
    linhas = _parse(texto)
    por_uf, soma_uf, compartilhadas, compartilhada_ha = _resumo(linhas)
    total_ha = round(sum(t["superficie_perimetro_ha"] for t in linhas), 2)

    if not linhas:
        raise RuntimeError("nenhuma TI no CSV — não sobrescrevo arquivo bom com zero")
    # `resultType=hits` responde 403 neste host (medido 18/11/2026), então a
    # única prova de resposta inteira é comparar com o último arquivo bom.
    if SAIDA.exists():
        anterior = json.loads(SAIDA.read_text(encoding="utf-8")).get("total") or 0
        if anterior and len(linhas) < anterior * 0.9:
            raise RuntimeError(f"vieram {len(linhas):,} TIs contra {anterior:,} na "
                               f"rodada anterior: resposta truncada, arquivo antigo mantido")
    print(f"{LOG} {len(linhas):,} terras indígenas | {total_ha:,.1f} ha | "
          f"UF própria {soma_uf:,.1f} ha + divididas {compartilhada_ha:,.1f} ha")
    if abs(soma_uf + compartilhada_ha - total_ha) > 1:
        raise RuntimeError(f"soma por UF ({soma_uf}) + divididas ({compartilhada_ha}) "
                           f"não fecha com o total ({total_ha})")
    print(f"{LOG} {len(compartilhadas)} TI(s) dividem UF e não entram em nenhuma UF")
    for uf, v in por_uf.items():
        if v["tis"]:
            print(f"{LOG}   {uf}: {v['tis']:>3} TI(s) | {v['area_ha']:>16,.1f} ha"
                  + (f" | +{v['compartilhadas']} dividida(s)" if v["compartilhadas"] else ""))

    if args.dry_run:
        print(f"{LOG} dry-run: nada gravado")
        return

    dados = {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "fonte": "FUNAI — GeoServer, camada Funai:tis_poligonais_portarias (WFS)",
        "url_fonte": (f"{BASE}?service=WFS&version=1.0.0&request=GetFeature"
                      f"&typeName={urllib.parse.quote(CAMADA)}&outputFormat=csv"
                      f"&maxFeatures=2000"),
        "medido_em": "18/11/2026",
        "total": len(linhas),
        "total_ha": total_ha,
        "soma_por_uf_ha": soma_uf,
        "area_ti_compartilhada_ha": compartilhada_ha,
        "ti_compartilhadas": compartilhadas,
        "colunas": ["terrai_codigo", "terrai_nome", "etnia_nome", "ufs",
                    "municipios", "superficie_perimetro_ha", "fase_ti",
                    "modalidade_ti", "reestudo_ti", "cr", "faixa_fronteira",
                    "undadm_nome", "undadm_sigla",
                    "data_em_estudo", "tit_em_estudo", "data_delimitada",
                    "tit_delimitada", "data_declarada", "tit_declarada",
                    "data_homologada", "tit_homologada", "data_regularizada",
                    "tit_regularizada"],
        "obs": ("Atributos da camada `tis_poligonais_portarias`, UMA requisição "
                "nacional por `propertyname`, SEM geometria (`the_geom` não é "
                "pedido): o polígono das 667 TIs passaria de 100 MB. Sem "
                "centróide nem bbox — para o desenho existe "
                "`terras-indigenas.geojson`. `ufs` e `municipios` vêm "
                "concatenados na fonte e foram quebrados aqui. TI de uma UF só "
                "entra naquela UF; TI que divide duas ou três UFs fica em "
                "`ti_compartilhadas` e não é atribuída a nenhuma — é o que faz "
                "`soma_por_uf_ha + area_ti_compartilhada_ha` fechar com "
                "`total_ha`, e o que dá ao Pará exatamente as 51 TIs de "
                "`uf_sigla='PA'`. `municipios` conta os municípios citados em "
                "todas as TIs que tocam a UF, inclusive as divididas. "
                "`undadm_sigla`/`undadm_nome` é a Coordenação Regional da FUNAI "
                "que responde pela TI. O `undadm_codigo` da fonte (11 dígitos "
                "internos, nenhum CPF) foi DELIBERADAMENTE omitido: 11 dígitos "
                "crus disparam o varredor de CPF do repositório e a sigla "
                "identifica a mesma unidade. A camada NÃO tem "
                "`data_atualizacao` (campo existe na irmã `tis_poligonais`). "
                "`resultType=hits` e `GetFeature` sem `maxFeatures` respondem "
                "403 neste host — por isso o parâmetro vai fixo na requisição e "
                "não há número de feições declarado pelo servidor no arquivo."),
        "ressalva_editorial": RESSALVA,
        "por_uf": por_uf,
        "linhas": linhas,
    }
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")),
                     encoding="utf-8")
    print(f"{LOG} ok -> {SAIDA} ({SAIDA.stat().st_size / 1024:,.0f} KB)")


if __name__ == "__main__":
    main()
