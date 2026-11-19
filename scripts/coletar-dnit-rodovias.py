r"""coletar-dnit-rodovias.py — malha rodoviária federal do Brasil por estado (DNIT, WFS).

O QUE É: baixa da camada `vgeo:vw_snv_rod` do GeoServer público do DNIT, uma
requisição por UF (e mais uma página por `startIndex` quando a UF não cabe numa
resposta), e grava `apps/web/data/dnit-rodovias.json` com **um registro por
trecho rodoviário** — rodovia, km inicial/final, UF, superfície, administração,
extensão e a versão do SNV que declarou aquilo — mais o resumo por UF e por
rodovia (contagem e km somados).

FONTE OFICIAL: https://servicos.dnit.gov.br/dnitgeo/geoserver/ows — GeoServer
público do DNIT, o mesmo que alimenta o VGeo em https://servicos.dnit.gov.br/vgeo/
(a página `/dnit/pt-br/acesso-a-informacao/dados-abertos` aponta para o VGeo).
WFS 2.0/1.0 aberto, sem chave, sem login, 73 camadas. `robots.txt` do host:
**404** (medido 18/11/2026) → nada declarado contra a coleta; a camada é link
público do publicador. User-Agent honesto `finweejur/github artur colito`;
2 s entre requisições ao mesmo host.

MEDIÇÃO (18/11/2026, sondagem em
`docs/historico/descobertas/ambiental-PA-logistica.md`):

- O WFS declara **343.892 linhas** no país (`numberMatched`), e
  `cql_filter=Unidade_Federacao='PA'` devolve **11.980 linhas** — o mesmo número
  da sondagem de 17/11/2026. Linha aqui NÃO é trecho: ver armadilha 4.
- Campos da camada (lista devolvida pelo próprio serviço): `id_snv`, `geom`,
  `Codigo_BR`, `Unidade_Federacao`, `Sigla_Tipo_Trecho`, `Nome_Tipo_Trecho`,
  `Codigo_SNV`, `Coincidencia_Federal`, `Local_Inicio`, `Local_Fim`,
  `Quilometragem_Inicio`, `Quilometragem_Fim`, `Extensao`,
  `Superficie_Federal`, `Obra`, `Unidade_Local`, `Administracao`, `Ato_Legal`,
  `Estadual_Coincidente`, `Superficie_Estadual_Coincidente`, `Versao_SNV`,
  `dt_ini`, `dt_fim`.

ARMADILHAS MEDIDAS:

1. **`startIndex` sozinho não funciona nesta camada.** Ela é uma *view* sem
   chave primária: o servidor responde `IOException: Cannot do natural order
   without a primary key` — com status **200** e corpo XML (WFS 1.0.0) ou
   **400** (WFS 2.0.0). Com `sortBy=id_snv` a paginação passa a ser ordenada e
   estável (páginas medidas: ids 1..5.000, 5.001..10.000, sem buraco).
2. **XML de exceção com status 200.** Todo corpo é checado antes de virar
   dado: se começa com `<`, é exceção, não FeatureCollection.
3. **A geometria é o custo.** Sem `propertyname` a camada traz `MultiLineString`:
   3 feições medidas = 138.376 B. Extrapolando para as 343.892 linhas passa de
   10 GB — por isso a requisição pede só atributos (`propertyname` sem `geom`) e
   o JSON não tem polígono/linha **nenhum**. Consequência assumida: também não
   há `bbox` por trecho; obtê-lo exigiria a geometria que não cabe. O `obs` do
   arquivo publicado diz isso ao leitor.
4. **A camada é HISTÓRICO, não a foto de hoje.** Ela tem uma linha por versão
   do SNV do mesmo trecho (`Versao_SNV`, `dt_ini`, `dt_fim`): medido em
   18/11/2026, o trecho `307BAC0020` do Acre ocupa **45 linhas** (de `201606A` a
   `201710B`), e os 3.111 "trechos" do AC são **87 trechos distintos**. Contar
   linha como trecho infla o país em ~35×. A linha é o que se baixa (é o que o
   `numberMatched` conta); o trecho publicado é **a versão mais recente**
   (`max dt_ini`) de cada `Codigo_SNV`. `ver` diz de quando é o dado de cada
   trecho — há trecho cuja última versão é de 2016, e isso vai no arquivo.
5. **A camada NÃO tem município.** `Local_Inicio`/`Local_Fim` são pontos de
   referência do trecho ("ENTR PA-370", "URUARÁ"), não município, e
   `Unidade_Local` é a unidade do DNIT. Ficaram de fora em vez de publicar um
   campo com nome enganoso.
6. `Administracao` e `Obra` vêm `null` em parte dos trechos e mudam de texto
   entre versões ("Adm Estadual" → "Estadual"); o arquivo guarda `null`, nunca
   inventa "Federal".

PORTANTO O ARQUIVO É: a versão mais recente de cada trecho + resumo. Sem
geometria, sem bbox, sem município.

CHECKPOINT: cada página bruta fica em `scripts/.cache/dnit/uf-<UF>-p<N>.json`,
com contagem declarada em `meta.json`. Re-rodar não rebaixa: página em cache só
é aceita se o número de feições bater com o `numberMatched` daquela UF; página
faltando ou torta volta para a rede. `--refetch` ignora o cache; `--dry-run` só
conta; `--limite N` visita as N primeiras UFs (arquivo sai `truncado: true`).

  python scripts/coletar-dnit-rodovias.py
  python scripts/coletar-dnit-rodovias.py --refetch
  python scripts/coletar-dnit-rodovias.py --dry-run
  python scripts/coletar-dnit-rodovias.py --limite 1
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)

LOG = "[coletar-dnit-rodovias]"
BASE = "https://servicos.dnit.gov.br/dnitgeo/geoserver/ows"
CAMADA = "vgeo:vw_snv_rod"
UA = "finweejur/github artur colito"
PAUSA = 2  # s entre requisições ao mesmo host
TENTATIVAS = 3
PAGINA = 10_000  # trechos por resposta; UF maior continua por `startIndex`
MAX_PAGINAS = 200  # trava contra laço infinito se o servidor repetir página
RAIZ = Path(__file__).resolve().parent
CACHE = RAIZ / ".cache" / "dnit"
META = CACHE / "meta.json"
SAIDA = RAIZ.parent / "apps" / "web" / "data" / "dnit-rodovias.json"

# Campos pedidos ao WFS — nunca `geom`. Lista conferida contra a mensagem do
# próprio serviço em 18/11/2026. `Versao_SNV`/`dt_ini` não vão para o arquivo:
# existem aqui para eleger a versão mais recente de cada trecho.
CAMPOS = ["id_snv", "Codigo_SNV", "Codigo_BR", "Unidade_Federacao",
          "Quilometragem_Inicio", "Quilometragem_Fim", "Extensao",
          "Superficie_Federal", "Administracao", "Versao_SNV", "dt_ini"]

UFS = ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS",
       "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC",
       "SE", "SP", "TO"]

COLUNAS = ["br", "uf", "km_ini", "km_fim", "km_ext", "sup", "adm", "ver"]

RESSALVA = (
    "Trecho é a unidade do SNV (Sistema Nacional de Viação) declarada pelo "
    "DNIT: km inicial/final, superfície e administração daquele segmento. Não "
    "é obra, não é contrato e não é tráfego — a camada não tem nenhum dos três. "
    "A fonte é HISTÓRICA (uma linha por versão do SNV): aqui vai só a versão "
    "mais recente de cada trecho, e `ver` diz de quando ela é — trecho cuja "
    "última declaração é de 2016 continua de 2016, não é a pista de hoje. "
    "`sup` (superfície) e `adm` (administração) são a declaração do DNIT e vêm "
    "nulas quando ele não declarou; nulo aqui NÃO significa 'sem pavimento'. "
    "Trecho se sobrepõe a trecho da mesma rodovia, então a soma de extensão "
    "(`km`) é maior que o eixo coberto (`km_eixo`) — e nenhum dos dois é a "
    "extensão oficial da malha federal: o SNV mantém ramais, variantes e "
    "trechos coincidentes como trechos próprios, e este arquivo não decide "
    "qual deles é o eixo oficial. Este arquivo não tem geometria, bbox nem "
    "município.")


def _get(params: dict, nome: str) -> bytes:
    """GET validado no WFS: UA honesto, pausa e retentativa; devolve o corpo cru."""
    url = f"{BASE}?{urllib.parse.urlencode(params)}"
    erro = None
    for tentativa in range(1, TENTATIVAS + 1):
        time.sleep(PAUSA)
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=600) as r:
                corpo = r.read()
        except urllib.error.HTTPError as e:
            # WFS devolve a exceção no CORPO: o status não conta a história.
            corpo = e.read() or b""
            erro = RuntimeError(
                f"HTTP {e.code}: " + re.sub(r"\s+", " ", corpo[:300].decode("utf-8", "replace")))
            print(f"{LOG} {nome}: tentativa {tentativa}/{TENTATIVAS} falhou ({erro})")
            time.sleep(PAUSA * 2 * tentativa)
            continue
        except Exception as e:  # URLError/timeout: host instável, insiste
            erro = e
            print(f"{LOG} {nome}: tentativa {tentativa}/{TENTATIVAS} falhou ({e})")
            time.sleep(PAUSA * 2 * tentativa)
            continue
        try:
            _parse_corpo(corpo)
            return corpo
        except RuntimeError as e:
            erro = e
            print(f"{LOG} {nome}: tentativa {tentativa}/{TENTATIVAS} inválida ({e})")
            time.sleep(PAUSA * 2 * tentativa)
    raise RuntimeError(f"{nome}: {TENTATIVAS} tentativas sem corpo válido — {erro}")


def _parse_corpo(corpo: bytes) -> dict:
    """FeatureCollection ou erro. XML com status 200 é exceção, não dado."""
    texto = corpo.decode("utf-8", "replace").lstrip("\ufeff \t\r\n")
    if not texto:
        raise RuntimeError("corpo vazio com status 200")
    if texto.startswith("<"):
        msg = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", texto)).strip()[:300]
        raise RuntimeError(f"servidor devolveu XML (exceção WFS): {msg}")
    try:
        dados = json.loads(texto)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"corpo não é JSON ({e})") from e
    if not isinstance(dados, dict) or "features" not in dados:
        raise RuntimeError("JSON sem `features`: não é FeatureCollection")
    return dados


def _num(valor) -> float:
    """km no WFS vem como número; algumas views devolvem texto com vírgula."""
    if valor is None:
        return 0.0
    if isinstance(valor, (int, float)):
        return round(float(valor), 1)
    s = str(valor).strip()
    if not s:
        return 0.0
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    try:
        return round(float(s), 1)
    except ValueError:
        return 0.0


def _trecho(feicao: dict) -> dict | None:
    """Um registro por trecho. Sem rodovia ou sem UF o registro não diz nada."""
    p = feicao.get("properties") or {}
    br = str(p.get("Codigo_BR") or "").strip()
    uf = str(p.get("Unidade_Federacao") or "").strip().upper()
    if not br or not uf:
        return None
    return {
        "br": br,
        "uf": uf,
        "km_ini": _num(p.get("Quilometragem_Inicio")),
        "km_fim": _num(p.get("Quilometragem_Fim")),
        "km_ext": _num(p.get("Extensao")),
        "sup": (p.get("Superficie_Federal") or "").strip() or None,
        "adm": (p.get("Administracao") or "").strip() or None,
        "ver": (p.get("Versao_SNV") or "").strip() or None,
        # abaixo só para eleger a versão mais recente; não vai para o arquivo
        "_snv": (p.get("Codigo_SNV") or "").strip(),
        "_dt": str(p.get("dt_ini") or ""),
    }


def _linhas(feicoes: list[dict]) -> list[dict]:
    """Um registro por trecho, na versão mais recente do SNV.

    A camada é histórica: o mesmo `Codigo_SNV` aparece uma vez por versão
    (medido: 45 linhas para `307BAC0020`). Ficar com `max dt_ini` dá a
    declaração vigente; somar todas as versões multiplicaria a malha. Linha sem
    `Codigo_SNV` não tem como ser agrupada e entra como trecho próprio.
    """
    escolhidos: dict[str, dict] = {}
    for i, f in enumerate(feicoes):
        t = _trecho(f)
        if t is None:
            continue
        chave = t.pop("_snv") or f"sem-snv-{i}"
        ordem = t.pop("_dt")
        atual = escolhidos.get(chave)
        if atual is None or ordem > atual["_ordem"]:
            escolhidos[chave] = {**t, "_ordem": ordem}
    return [{k: v for k, v in t.items() if k != "_ordem"} for t in escolhidos.values()]


def _uniao_km(trechos: list[dict]) -> float:
    """Km de eixo realmente coberto por um conjunto de trechos de UMA rodovia.

    Trecho do SNV se sobrepõe (medido em 18/11/2026: PA/BR-163 soma 2.540,9 km
    de `Extensao` sobre 2.000 km de eixo). Somar sem unir infla o número.
    """
    total = 0.0
    fim: float | None = None
    for t in sorted(trechos, key=lambda x: (x["km_ini"], x["km_fim"])):
        ini = t["km_ini"] if fim is None else max(t["km_ini"], fim)
        if t["km_fim"] > ini:
            total += t["km_fim"] - ini
        fim = t["km_fim"] if fim is None else max(fim, t["km_fim"])
    return round(total, 1)


def _resumo(linhas: list[dict]) -> tuple[dict, dict]:
    """Contagem, km somado e km de eixo por UF e por rodovia.

    `km` é a soma das `Extensao` dos trechos (o número que o DNIT declara
    trecho a trecho); `km_eixo` desconta a sobreposição dentro de cada rodovia.
    As duas colunas fecham com o total no arquivo.
    """
    por_uf: dict[str, dict] = {}
    por_rodovia: dict[str, dict] = {}
    grupo: dict[tuple[str, str], list[dict]] = {}
    for t in linhas:
        u = por_uf.setdefault(t["uf"], {"trechos": 0, "km": 0.0, "km_eixo": 0.0,
                                        "_rods": set(), "_sups": set()})
        u["trechos"] += 1
        u["km"] = round(u["km"] + t["km_ext"], 1)
        u["_rods"].add(t["br"])
        if t["sup"]:
            u["_sups"].add(t["sup"])
        r = por_rodovia.setdefault(t["br"], {"trechos": 0, "km": 0.0, "km_eixo": 0.0,
                                             "_ufs": set()})
        r["trechos"] += 1
        r["km"] = round(r["km"] + t["km_ext"], 1)
        r["_ufs"].add(t["uf"])
        grupo.setdefault((t["uf"], t["br"]), []).append(t)
    for (uf, br), ts in grupo.items():
        eixo = _uniao_km(ts)
        por_uf[uf]["km_eixo"] = round(por_uf[uf]["km_eixo"] + eixo, 1)
        por_rodovia[br]["km_eixo"] = round(por_rodovia[br]["km_eixo"] + eixo, 1)
    for v in por_uf.values():
        v["rodovias"] = len(v.pop("_rods"))
        v["superficies"] = sorted(v.pop("_sups"))
    for v in por_rodovia.values():
        v["ufs"] = sorted(v.pop("_ufs"))
    return dict(sorted(por_uf.items())), dict(sorted(por_rodovia.items()))


def _ler_meta() -> dict:
    if not META.exists():
        return {"ufs": {}}
    try:
        meta = json.loads(META.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {"ufs": {}}
    meta.setdefault("ufs", {})
    return meta


def _gravar_meta(meta: dict) -> None:
    CACHE.mkdir(parents=True, exist_ok=True)
    meta["atualizado_em"] = datetime.now(timezone.utc).isoformat()
    META.write_text(json.dumps(meta, ensure_ascii=False), encoding="utf-8")


def _ler_cache(uf: str, entrada: dict) -> list[dict] | None:
    """Cache válido = todas as páginas no disco com a contagem declarada.

    Se qualquer página faltar, não abrir como JSON ou tiver contagem diferente
    da registrada, devolve None e a UF volta para a rede — cache torto nunca
    vira dado.
    """
    feicoes: list[dict] = []
    for pagina in entrada.get("paginas", []):
        caminho = CACHE / pagina["arquivo"]
        if not caminho.exists():
            return None
        try:
            dados = _parse_corpo(caminho.read_bytes())
        except (RuntimeError, OSError):
            return None
        if len(dados["features"]) != pagina.get("numberReturned"):
            return None
        feicoes.extend(dados["features"])
    if len(feicoes) != entrada.get("numberMatched"):
        return None
    print(f"{LOG} {uf}: cache com {len(feicoes):,} trecho(s) — sem rede")
    return feicoes


def _coletar_uf(uf: str, refetch: bool, meta: dict) -> list[dict]:
    """Uma UF inteira: cache válido ganha da rede, senão páginas por `startIndex`."""
    if not refetch:
        entrada = meta["ufs"].get(uf)
        if entrada:
            feicoes = _ler_cache(uf, entrada)
            if feicoes is not None:
                return feicoes
    CACHE.mkdir(parents=True, exist_ok=True)
    paginas: list[dict] = []
    total = 0
    matched: int | None = None
    for n in range(MAX_PAGINAS):
        params = {
            "service": "WFS", "version": "1.0.0", "request": "GetFeature",
            "typeName": CAMADA, "propertyname": ",".join(CAMPOS),
            "outputFormat": "application/json",
            "cql_filter": f"Unidade_Federacao='{uf}'",
            # sortBy é OBRIGATÓRIO: sem ele o `startIndex` estoura (view sem PK).
            "sortBy": "id_snv",
            "startIndex": str(total), "maxFeatures": str(PAGINA),
        }
        corpo = _get(params, f"{uf} startIndex={total}")
        dados = _parse_corpo(corpo)
        feicoes = dados["features"] or []
        matched = dados.get("numberMatched")
        arquivo = CACHE / f"uf-{uf}-p{n:02d}.json"
        arquivo.write_bytes(corpo)
        paginas.append({"arquivo": arquivo.name,
                        "numberMatched": matched,
                        "numberReturned": len(feicoes)})
        total += len(feicoes)
        print(f"{LOG} {uf}: página {n} — {len(feicoes):,} trecho(s), "
              f"{total:,}/{matched} declarados, {len(corpo):,} B")
        if not feicoes or matched is None or total >= matched:
            break
    if matched is None:
        raise RuntimeError(f"{uf}: WFS não declarou `numberMatched`")
    if total != matched:
        raise RuntimeError(f"{uf}: {total:,} trechos recebidos contra "
                           f"{matched:,} declarados — página faltando")
    meta["ufs"][uf] = {
        "numberMatched": matched,
        "paginas": paginas,
        "baixado_em": datetime.now(timezone.utc).isoformat(),
    }
    _gravar_meta(meta)
    return [f for p in paginas for f in _parse_corpo((CACHE / p["arquivo"]).read_bytes())["features"]]


def _nacional_declarado(refetch: bool, meta: dict) -> int:
    """`numberMatched` do país, lido do próprio WFS. Sem ele não há prova de total."""
    if not refetch and meta.get("nacional_declarado"):
        return int(meta["nacional_declarado"])
    params = {"service": "WFS", "version": "1.0.0", "request": "GetFeature",
              "typeName": CAMADA, "outputFormat": "application/json",
              "propertyname": "Codigo_BR", "sortBy": "id_snv",
              "startIndex": "0", "maxFeatures": "1"}
    dados = _parse_corpo(_get(params, "nacional"))
    meta["nacional_declarado"] = int(dados["numberMatched"])
    _gravar_meta(meta)
    return meta["nacional_declarado"]


def main() -> None:
    ap = argparse.ArgumentParser(description="Malha rodoviária federal por UF (DNIT/WFS)")
    ap.add_argument("--refetch", action="store_true", help="ignora o cache e baixa de novo")
    ap.add_argument("--dry-run", action="store_true", help="só conta, não grava JSON")
    ap.add_argument("--limite", type=int, default=0, metavar="N",
                    help="visita só as N primeiras UFs (teste; sai truncado)")
    args = ap.parse_args()

    print(f"{LOG} malha rodoviária federal — camada {CAMADA}")
    print(f"{LOG} cache: {CACHE}")
    meta = _ler_meta()
    ufs = UFS[:args.limite] if args.limite else list(UFS)
    declarado_nacional = _nacional_declarado(args.refetch, meta)
    print(f"{LOG} WFS declara {declarado_nacional:,} trechos no país")

    linhas: list[dict] = []
    declarado = 0
    brutos = 0
    sem_chave = 0
    pendentes: list[str] = []

    def visitar(uf: str) -> bool:
        nonlocal declarado, brutos, sem_chave
        try:
            feicoes = _coletar_uf(uf, args.refetch, meta)
        except RuntimeError as e:
            print(f"{LOG} {uf}: PENDENTE — {e}")
            return False
        novas = _linhas(feicoes)
        linhas.extend(novas)
        brutos += len(feicoes)
        sem_chave += sum(1 for f in feicoes if _trecho(f) is None)
        declarado += int(meta["ufs"][uf]["numberMatched"])
        print(f"{LOG} {uf}: {len(feicoes):,} linha(s) de versão -> "
              f"{len(novas):,} trecho(s) — {sum(t['km_ext'] for t in novas):,.1f} km")
        return True

    for uf in ufs:
        if not visitar(uf):
            pendentes.append(uf)
    for uf in list(pendentes):  # segunda passada: a página que falhou tenta de novo
        if visitar(uf):
            pendentes.remove(uf)

    por_uf, por_rodovia = _resumo(linhas)
    total_km = round(sum(t["km_ext"] for t in linhas), 1)
    total_eixo = round(sum(v["km_eixo"] for v in por_uf.values()), 1)
    soma_uf_km = round(sum(v["km"] for v in por_uf.values()), 1)
    soma_uf = sum(v["trechos"] for v in por_uf.values())
    if len(linhas) != soma_uf:
        raise RuntimeError(f"soma por UF ({soma_uf:,}) != total ({len(linhas):,})")
    if abs(soma_uf_km - total_km) > 0.5:
        raise RuntimeError(f"km por UF ({soma_uf_km:,.1f}) != total ({total_km:,.1f})")

    faltando = declarado_nacional - brutos
    truncado = bool(pendentes) or faltando != 0 or brutos != declarado
    motivo = None
    if pendentes:
        motivo = f"UF(s) pendente(s) depois de 2 passadas: {', '.join(pendentes)}"
    elif brutos != declarado:
        motivo = (f"soma das UFs ({brutos:,}) não bate com o `numberMatched` "
                  f"de cada UF ({declarado:,})")
    elif faltando:
        motivo = (f"faltam {faltando:,} linha(s) para as {declarado_nacional:,} "
                  f"que o WFS declara no país")
    if args.limite:
        motivo = f"--limite {args.limite}: só as {len(ufs)} primeiras UFs"
        truncado = True

    por_ano: dict[str, int] = {}
    for t in linhas:
        ano = (t["ver"] or "")[:4] or "sem versão"
        por_ano[ano] = por_ano.get(ano, 0) + 1

    print(f"{LOG} {len(linhas):,} trechos | {total_km:,.1f} km somados | "
          f"{total_eixo:,.1f} km de eixo | {len(por_uf)} UF(s) | "
          f"{len(por_rodovia)} rodovia(s)")
    print(f"{LOG} versões: " + " · ".join(
        f"{a}: {n:,}" for a, n in sorted(por_ano.items())))
    print(f"{LOG} WFS: {declarado_nacional:,} linha(s) de versão no país, "
          f"{brutos:,} recebida(s)" + (" — TRUNCADO" if truncado else " — completo"))
    for uf, v in por_uf.items():
        print(f"{LOG}   {uf}: {v['trechos']:>6,} trecho(s) | {v['km']:>12,.1f} km "
              f"({v['km_eixo']:>11,.1f} km de eixo) | {v['rodovias']:>3} rodovia(s)")

    if args.dry_run:
        print(f"{LOG} dry-run: nada gravado")
        return

    dados = {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "fonte": "DNIT — GeoServer, camada vgeo:vw_snv_rod (WFS)",
        "url_fonte": (f"{BASE}?service=WFS&version=1.0.0&request=GetFeature"
                      f"&typeName={urllib.parse.quote(CAMADA)}"
                      f"&propertyname={urllib.parse.quote(','.join(CAMPOS))}"
                      f"&outputFormat=application/json&sortBy=id_snv"
                      f"&cql_filter=Unidade_Federacao%3D%27PA%27"),
        "medido_em": "18/11/2026",
        "total": len(linhas),
        "total_km": total_km,
        "total_km_eixo": total_eixo,
        "truncado": truncado,
        "truncado_motivo": motivo,
        "wfs_number_matched_nacional": declarado_nacional,
        "wfs_soma_number_matched_ufs": declarado,
        "versoes_recebidas": brutos,
        "versoes_por_trecho": round(brutos / len(linhas), 1) if linhas else 0.0,
        "linhas_sem_rodovia_ou_uf": sem_chave,
        "trechos_por_ano_da_versao": dict(sorted(por_ano.items())),
        "ufs_pendentes": pendentes,
        "ufs": len(por_uf),
        "rodovias": len(por_rodovia),
        "colunas": COLUNAS,
        "obs": ("Um registro por trecho do SNV: a camada é HISTÓRICA (uma linha "
                "por versão do SNV do mesmo trecho), então o arquivo fica com a "
                "versão mais recente de cada `Codigo_SNV`. Por isso `total` "
                "(trechos) é menor que `wfs_number_matched_nacional` (linhas "
                "trecho×versão): a regra de honestidade aqui é `versoes_recebidas "
                "== wfs_number_matched_nacional` — se não bater, `truncado` é "
                "true. Medido em 18/11/2026: 343.892 linhas no país;\n"
                "`br` é o código da rodovia (`163` = BR-163), `km_ini`/`km_fim` "
                "o quilômetro do trecho, `km_ext` a `Extensao` do trecho, `sup` "
                "a superfície declarada (`Superficie_Federal`: PAV, IMP, PLA, "
                "EOP…), `adm` a administração e `ver` a `Versao_SNV` (ex.: "
                "`201710B`) que declarou esses valores. Geometria fora por "
                "`propertyname`: 3 feições com `MultiLineString` medem 138.376 "
                "B e a malha inteira passaria de 10 GB — daí também não haver "
                "`bbox`. A camada NÃO tem município: `Local_Inicio`/`Local_Fim` "
                "são pontos de referência ('ENTR PA-370', 'URUARÁ'), não "
                "município, e ficaram de fora. O `Codigo_SNV` do trecho (ex.: "
                "`417BPA0010`) agrupou as versões e não foi versionado. "
                "`trechos_por_ano_da_versao` mostra a idade da declaração de "
                "cada trecho. `km` (por UF e por rodovia) soma a `Extensao` dos "
                "trechos; `km_eixo` desconta a sobreposição entre trechos da "
                "MESMA rodovia na mesma UF — medido: PA/BR-163 soma 2.540,9 km "
                "sobre 2.000,0 km de eixo, e MG/BR-040 soma 960,8 km sobre 831,2 "
                "km. Use `km_eixo` para extensão e `km` para 'km declarado "
                "trecho a trecho'; nenhum dos dois é a extensão oficial da "
                "rodovia. "
                "Paginação por `startIndex` exige `sortBy=id_snv`: sem ordenação "
                "o servidor responde XML 'Cannot do natural order without a "
                "primary key' (view sem chave) — inclusive com status 200."),
        "ressalva_editorial": RESSALVA,
        "por_uf": por_uf,
        "por_rodovia": por_rodovia,
        "trechos": linhas,
    }
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")),
                     encoding="utf-8")
    print(f"{LOG} ok -> {SAIDA} ({SAIDA.stat().st_size / 1024 / 1024:,.1f} MB)")


if __name__ == "__main__":
    main()
