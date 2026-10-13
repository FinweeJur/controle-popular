"""coletar-ibama-coordenadas.py — coordenadas geográficas dos autos do IBAMA.

Cruza duas fontes do portal de dados abertos do IBAMA e grava, em JSON
compacto, UM registro por auto de infração de MG com termo de mineração e
coordenada válida — o "positivo de treino" do modelo de detecção de cavas.

## Por que isto serve ao treino de cavas

O modelo de detecção de cavas precisa aprender o que É uma cava irregular.
A forma mais limpa de ensinar é mostrar o que o Estado já autuou: quando o
IBAMA lavrou auto por garimpo, mineração, cava, barragem ou rejeito em MG,
há um ato oficial atestando que aquele ponto do território foi tratado como
degradação ambiental. Cada registro vira um "positivo" rotulado, com lat/lon
e a descrição curta do motivo — sem nome de autuado, sem CPF, sem CNPJ.

Ressalva editorial que acompanha o dado (vai no JSON): presença aqui não é
culpabilidade fixada — ao autuado cabe defesa e recurso. O registro é o ato
administrativo, não a sentença.

## Fontes (portal de dados abertos do IBAMA)

- Dataset: https://dadosabertos.ibama.gov.br/dataset/fiscalizacao-auto-de-infracao
- Autos (ZIP CSV por ano, ~122 MB):
  stibamadadosabertosprd.blob.core.windows.net/.../SIFISC/auto_infracao/
  auto_infracao/auto_infracao_csv.zip
- Coordenadas (CSV único, ~9,9 MB, chave SEQ_AUTO_INFRACAO):
  .../SIFISC/auto_infracao/coordenada/coordenada.csv
- Recursos auxiliares inspecionados em 13/10/2026 e NÃO usados aqui:
  enquadramento legal (só referência de norma — ARTIGO/NU_NORMA, não traz
  texto de mineração), bioma, especimes e anexos. O CSV principal já traz
  DS_ENQUADRAMENTO_ADMINISTRATIVO/_NAO_ADMINISTRATIVO/_COMPLEMENTAR, que é
  onde o texto de enquadramento de fato aparece.

## Decisão robots.txt (portal consultado em 16/09/2026 e RECONFIRMADO em
## 13/10/2026, https://dadosabertos.ibama.gov.br/robots.txt)

Mesmo teatro de sempre: `Disallow`: /dataset/rate/, /revision/,
/dataset/*/history, /api/. O dataset e o download dos recursos NÃO estão
proibidos. `Crawl-Delay: 10` — PAUSA = 10 s entre requisições ao portal,
conforme o pedido da fonte. Decisão mantida do coletor irmão
`coletar-ibama-autos.py` (cabeçalho de 16/09/2026).

## Decisão robots.txt do host de blob (medida em 13/10/2026)

O container de blob `stibamadadosabertosprd.blob.core.windows.net` NÃO tem
robots.txt: GET em /robots.txt devolve erro XML do Azure (`OutOfRangeInput`),
ou seja, recurso inexistente. Sem restrição de crawling publicada, mas
seguimos com User-Agent honesto e pausa de 2 s entre requisições ao mesmo
host — cortesia mínima, igual à regra geral do FONTES.md.

## PRIVACIDADE — a regra mais importante deste coletor

O CSV principal tem NOME_INFRATOR, CPF_CNPJ_INFRATOR e NUM_PESSOA_INFRATOR.
Este coletor NEM LÊ essas colunas (pandas `usecols` sem elas) e nunca grava
nome, CPF ou CNPJ de autuado. Texto livre do ato (DES_AUTO_INFRACAO /
DES_INFRACAO) passa por `_sanitizar_texto`, que apaga CPF colado no texto
(padrão MEI/SISBAJUS já visto na fonte) e trunca o resumo. `--scan-cpf` roda
o varredor oficial (mod-11) sobre a saída gravada ao final.

## Como a coordenada é escolhida (uma linha por auto)

1. `coordenada.csv` (polígono do auto, N vértices) → centroide aritmético;
   `precisao: "poligono"` e `n_pontos` registrados.
2. Sem polígono: lat/lon do próprio auto (`NUM_LATITUDE_AUTO` /
   `NUM_LONGITUDE_AUTO`, vírgula decimal do IBAMA) → `precisao: "auto"`.
3. Sem nenhuma das duas: o auto entra só nas contagens, não no JSON.

## Filtro de mineração

Expressão ampla sobre texto sem acento, em minúsculas: garimpo, mineração,
minério, cava, extração de minério, rejeito, barragem, jazida, diamante e
ouro aluvionar. `\bcavas?\b` com limite de palavra para não casar "caverna".

## Uso

    python scripts/coletar-ibama-coordenadas.py --dry-run   # só URLs e números
    python scripts/coletar-ibama-coordenadas.py --limit 100 # amostra
    python scripts/coletar-ibama-coordenadas.py             # coleta completa
    python scripts/coletar-ibama-coordenadas.py --scan-cpf  # varre a saída
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import time
import unicodedata
import urllib.error
import urllib.request
import zipfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # console Windows é cp1252
import pandas as pd

PAGE = "https://dadosabertos.ibama.gov.br/dataset/fiscalizacao-auto-de-infracao"
RAIZ_BLOB = ("https://stibamadadosabertosprd.blob.core.windows.net/dados-abertos/"
             "dados/SIFISC/auto_infracao")
URL_AUTOS = f"{RAIZ_BLOB}/auto_infracao/auto_infracao_csv.zip"
URL_COORD = f"{RAIZ_BLOB}/coordenada/coordenada.csv"
RAIZ = Path(__file__).resolve().parent.parent
CACHE = Path(__file__).resolve().parent / ".cache" / "ibama"
CACHE_AUTOS = Path(__file__).resolve().parent / ".cache" / "ibama-autos"  # coletor irmão
SAIDA = Path(__file__).resolve().parent / ".cache" / "cavas-calibracao" / "multas-ibama-mg.json"
UA = "ControlePopular/1.0 (+controlepopular.com.br; dado publico governamental)"
PAUSA_PORTAL = 10   # Crawl-Delay: 10 pedido pelo robots.txt do portal
PAUSA_BLOB = 2      # host sem robots.txt; cortesia mínima (regra geral do FONTES.md)
LIMITE_PADRAO = 0   # 0 = sem limite (o JSON de saída é pequeno)

# Bounding box aproximado de Minas Gerais (medida de referência da tarefa:
# -51,0 a -39,8 lon; -23,0 a -14,2 lat). Serve para flagrar coordenada que
# não cabe no estado — erro de geocodificação, não furo de dado.
BBOX_MG = {"lon_min": -51.0, "lon_max": -39.8, "lat_min": -23.0, "lat_max": -14.2}
# Faixa válida do Brasil, usada só para descartar lixo numérico.
BBOX_BR = {"lon_min": -74.0, "lon_max": -34.0, "lat_min": -34.0, "lat_max": 6.0}

RESSALVA = ("Cadastro oficial de autos lavrados pelo IBAMA — registro "
            "administrativo, não atribuição de culpa; ao autuado cabe defesa "
            "e recurso. Uso previsto: positivo de treino do modelo de "
            "detecção de cavas.")

# Colunas lidas do CSV principal. NOME_INFRATOR, CPF_CNPJ_INFRATOR e
# NUM_PESSOA_INFRATOR ficam DE FORA de propósito: se não são lidas, não
# podem vazar para o JSON nem para a memória do processo.
COLS_AUTOS = [
    "SEQ_AUTO_INFRACAO", "NUM_AUTO_INFRACAO", "SER_AUTO_INFRACAO",
    "MUNICIPIO", "UF", "DAT_HORA_AUTO_INFRACAO",
    "DES_AUTO_INFRACAO", "DES_INFRACAO",
    "NUM_LONGITUDE_AUTO", "NUM_LATITUDE_AUTO",
    "NU_PROCESSO_FORMATADO", "VAL_AUTO_INFRACAO",
    "DS_ENQUADRAMENTO_ADMINISTRATIVO", "DS_ENQUADRAMENTO_NAO_ADMINISTRATIVO",
    "DS_ENQUADRAMENTO_COMPLEMENTAR",
]
COLS_COORD = ["SEQ_AUTO_INFRACAO", "LONGITUDE", "LATITUDE", "DS_WKT"]

# Termos de mineração, casados contra texto JÁ sem acento e em minúsculas.
# `\b` em "cava" evita falso positivo com "caverna"; "miner" é amplo de
# propósito (mineração, minério, minerador, mineral) — quem treina o modelo
# prefere amplitude e revisão humana a perder positivo raro. Grupo NÃO
# capturante de propósito: o pandas `str.contains` avisa se houver grupo.
RE_MINERACAO = re.compile(
    r"(?:garimp\w*"
    r"|minerac\w*"
    r"|miner\w*"
    r"|\bcavas?\b"
    r"|extracao de minerio"
    r"|rejeito\w*"
    r"|barragem\w*"
    r"|jazida\w*"
    r"|diamante\w*"
    r"|ouro aluvion\w*)"
)


def _sem_acentos(texto: str) -> str:
    """Remove acentos e baixa para minúsculas — a regex de mineração casa
    só em ASCII, então 'mineração' e 'MINERIO' viram 'mineracao'/'minerio'."""
    baixo = unicodedata.normalize("NFKD", str(texto)).encode("ascii", "ignore")
    return baixo.decode("ascii").lower()


def _sanitizar_texto(texto, corte: int = 200) -> str | None:
    """Resumo curto do ato, sem CPF colado e truncado.

    Copia da lógica do coletor irmão `coletar-ibama-autos.py`: expressão
    genérica para apagar sequência com cara de CPF (padrão MEI/SISBAJUS que
    já apareceu na fonte), e corte de `corte` caracteres para o JSON não
    virar arquivo de prosa.
    """
    if not texto:
        return None
    limpo = str(texto)

    def _apagar(m: re.Match) -> str:
        return "" if len(re.sub(r"\D", "", m.group(0))) == 11 else m.group(0)

    limpo = re.sub(r"\d[\d.\-/]{8,}\d", _apagar, limpo)
    limpo = " ".join(limpo.split()).strip()
    if not limpo:
        return None
    return limpo[:corte]


def _numero(valor) -> float | None:
    """'−18,172625' -> -18.172625. A fonte usa vírgula decimal e às vezes
    sinal negativo com hífen; vazio ou lixo vira None (lado protetor)."""
    s = str(valor or "").strip().replace("−", "-")
    if not s:
        return None
    try:
        return float(s.replace(",", "."))
    except ValueError:
        return None


def _em_faixa(lat: float, lon: float, faixa: dict) -> bool:
    return (faixa["lon_min"] <= lon <= faixa["lon_max"]
            and faixa["lat_min"] <= lat <= faixa["lat_max"])


def _data_auto(valor) -> str | None:
    """'1977-10-16' ou '1977-10-16 12:00:00' -> '1977-10-16'."""
    s = str(valor or "").strip()
    if not s:
        return None
    return s.split(" ")[0] if s.count("-") == 2 else None


def _abrir_retry(url: str) -> "urllib.response.addinfourl":
    """Abre a URL com uma única nova tentativa em 403/429.

    O blob do IBAMA responde 403/429 em rajada; o coletor irmão já mediu
    que uma espera de 30 s resolve — por isso só uma repetição, sem loop
    infinito, e os demais códigos sobem como erro.
    """
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        return urllib.request.urlopen(req, timeout=600)
    except urllib.error.HTTPError as e:
        if e.code not in (403, 429):
            raise
        print(f"  [!] {e.code} do servidor — esperando 30s e tentando de novo...")
        time.sleep(30)
        return urllib.request.urlopen(req, timeout=600)


def _checkpoint(ckpt: Path, estado: dict) -> None:
    """Grava o progresso do download em JSON (só leitura humana).

    `estado` já vem com url/bytes; aqui só acrescenta a data e grava —
    assim a assinatura fica em 2 argumentos em vez de 5.
    """
    ckpt.write_text(json.dumps({
        **estado, "ata": datetime.now(timezone.utc).isoformat(),
    }), encoding="utf-8")


def _baixar(url: str, alvo: Path, pausa: float) -> Path:
    """Baixa `url` para `alvo` com checkpoint de progresso em JSON.

    RETOMADA: o blob do IBAMA não aceita Range (medido no coletor irmão em
    16/09/2026), então interrompido recomeça do zero — o checkpoint serve
    só para alguém ver onde o download parou.
    """
    alvo.parent.mkdir(parents=True, exist_ok=True)
    ckpt = alvo.with_suffix(alvo.suffix + ".ckpt.json")
    resp = _abrir_retry(url)
    estado = {"url": url, "bytes_baixados": 0,
              "bytes_totais": int(resp.headers.get("Content-Length", 0))}
    tmp = alvo.with_suffix(alvo.suffix + ".parcial")
    with open(tmp, "wb") as f:
        while True:
            pedaco = resp.read(2 << 20)
            if not pedaco:
                break
            f.write(pedaco)
            estado["bytes_baixados"] += len(pedaco)
            _checkpoint(ckpt, estado)
        resp.close()
    if alvo.exists():
        os.replace(tmp, alvo)
    else:
        tmp.rename(alvo)
    estado["concluido"] = True
    _checkpoint(ckpt, estado)
    time.sleep(pausa)
    return alvo


def _garantir(url: str, nome: str, pausa: float) -> Path:
    """Devolve o arquivo no cache, baixando só se ainda não estiver lá.

    O ZIP dos autos é compartilhado com o coletor irmão: se já existe em
    `scripts/.cache/ibama-autos/`, reaproveitamos os 122 MB em vez de
    baixar de novo.
    """
    local = CACHE / nome
    if local.exists() and local.stat().st_size > 0:
        return local
    if nome == "auto_infracao.zip":
        herdado = CACHE_AUTOS / nome
        if herdado.exists() and herdado.stat().st_size > 0:
            print(f"  reaproveitando cache do coletor irmão: {herdado}")
            return herdado
    print(f"  baixando {url}")
    return _baixar(url, local, pausa)


def _ponto_util(seq: str, lon: float | None, lat: float | None) -> bool:
    """Aceita a coordenada só se tiver seq e par lon/lat preenchido.

    Separado em função própria porque a expressão `not seq or lon is None
    or lat is None` enfeitava a condição de `_ler_coordenadas` (CodeScene
    apontou "complex conditional" aqui em 13/10/2026).
    """
    if not seq:
        return False
    if None in (lon, lat):
        return False
    return _em_faixa(lat, lon, BBOX_BR)


def _ler_coordenadas(caminho: Path) -> tuple[dict[str, list[tuple[float, float]]], int]:
    """Lê o coordenada.csv e devolve {SEQ_AUTO_INFRACAO: [(lon, lat), ...]}.

    Cada auto pode ter vários vértices de polígono; aqui guardamos a lista
    e o chamador reduz a centroide. Retorna também o total de linhas lidas.
    """
    df = pd.read_csv(caminho, sep=";", encoding="utf-8-sig", dtype=str,
                     keep_default_na=False, usecols=COLS_COORD)
    total = len(df)
    pontos: dict[str, list[tuple[float, float]]] = defaultdict(list)
    for row in df.to_dict("records"):
        seq = str(row["SEQ_AUTO_INFRACAO"]).strip()
        lon, lat = _numero(row["LONGITUDE"]), _numero(row["LATITUDE"])
        if not _ponto_util(seq, lon, lat):
            continue  # vazio, lixo numérico ou fora do Brasil
        pontos[seq].append((lon, lat))
    return dict(pontos), total


def _ler_autos(zip_path: Path) -> pd.DataFrame:
    """Lê TODOS os auto_infracao_*.csv do ZIP e devolve um DataFrame único.

    O coletor irmão lê só o ano mais recente (arquivo ordenado por nome);
    aqui o treino precisa do acervo inteiro — a jazida autuada em 2004
    também é positivo legítimo. `usecols` garante que nome e documento do
    autuado nem entram na memória.
    """
    quadros = []
    with zipfile.ZipFile(zip_path) as z:
        csvs = sorted(n for n in z.namelist() if n.lower().endswith(".csv"))
        if not csvs:
            raise SystemExit("  [x] nenhum CSV no zip")
        for nome in csvs:
            quadros.append(pd.read_csv(
                z.open(nome), sep=";", encoding="utf-8-sig", dtype=str,
                keep_default_na=False, usecols=COLS_AUTOS,
            ))
    return pd.concat(quadros, ignore_index=True)


def _texto_mineracao(row) -> str:
    """Junta os campos de texto do ato, sem acentos, para a busca do termo.

    Casa em descrição do auto, descrição da infração e nos três campos de
    enquadramento do próprio CSV — tudo texto do ato, nunca nome.
    """
    partes = [row.get("DES_AUTO_INFRACAO"), row.get("DES_INFRACAO"),
              row.get("DS_ENQUADRAMENTO_ADMINISTRATIVO"),
              row.get("DS_ENQUADRAMENTO_NAO_ADMINISTRATIVO"),
              row.get("DS_ENQUADRAMENTO_COMPLEMENTAR")]
    return " ".join(_sem_acentos(p) for p in partes if p)


def _extrair_termo(texto: str):
    """Primeiro termo de mineração que casar, ou None.

    `search` linha a linha em vez de `str.extract`/`str.contains`: o pandas
    reclama de grupo capturante nas duas direções, e 113 mil buscas custam
    menos de um segundo. O termo que casar fica no registro
    (`termo_mineracao`) para o dono calibrar o filtro sem reprocessar.
    """
    achou = RE_MINERACAO.search(texto)
    return achou.group(0) if achou else None


def _filtrar_mineracao(mg: pd.DataFrame) -> tuple[pd.DataFrame, Counter]:
    """Restringe os autos MG aos que citam mineração no texto do ato."""
    com_texto = mg.assign(_texto=mg.apply(_texto_mineracao, axis=1))
    com_texto = com_texto.assign(_termo=com_texto["_texto"].map(_extrair_termo))
    miner = com_texto[com_texto["_termo"].notna()]
    return miner, Counter(miner["_termo"])


def _escolher_coordenada(row: dict, pontos: dict) -> tuple | None:
    """Devolve (lon, lat, n_pontos, veio_do_poligono) ou None.

    Prioriza a centroide do polígono do `coordenada.csv`; sem polígono,
    cai para o lat/lon do próprio auto, desde que dentro do Brasil —
    coordenada fora do país é lixo de geocodificação, não dado.
    """
    seq = str(row["SEQ_AUTO_INFRACAO"]).strip()
    if seq in pontos:
        vs = pontos[seq]
        lon = sum(p[0] for p in vs) / len(vs)
        lat = sum(p[1] for p in vs) / len(vs)
        return lon, lat, len(vs), True
    lon, lat = _numero(row["NUM_LONGITUDE_AUTO"]), _numero(row["NUM_LATITUDE_AUTO"])
    if _ponto_util(seq, lon, lat):
        return lon, lat, 0, False
    return None


def _montar_linha(row: dict, escolha: tuple) -> dict:
    """Monta o registro público de um auto, sem nome nem documento."""
    lon, lat, n_pontos, do_poligono = escolha
    data = _data_auto(row["DAT_HORA_AUTO_INFRACAO"])
    ano = data[:4] if data else None
    municipio = (row["MUNICIPIO"] or "").strip().title()
    auto_num = (str(row["NUM_AUTO_INFRACAO"]).strip()
                + ("-" + str(row["SER_AUTO_INFRACAO"]).strip()
                   if str(row["SER_AUTO_INFRACAO"]).strip() else ""))
    try:
        multa = float(str(row["VAL_AUTO_INFRACAO"]).replace(".", "").replace(",", "."))
    except (ValueError, AttributeError):
        multa = None
    enquadramento = (_sanitizar_texto(row["DES_INFRACAO"])
                     or _sanitizar_texto(row["DES_AUTO_INFRACAO"]))
    return {
        "processo": _sanitizar_texto(row["NU_PROCESSO_FORMATADO"], 40),
        "auto": auto_num,
        "seq": str(row["SEQ_AUTO_INFRACAO"]).strip(),
        "data": data,
        "ano": int(ano) if ano and ano.isdigit() else None,
        "municipio": municipio,
        "uf": "MG",
        "lat": round(lat, 6),
        "lon": round(lon, 6),
        "precisao": "poligono" if do_poligono else "auto",
        "n_pontos": n_pontos,
        "enquadramento": enquadramento,
        "termo_mineracao": str(row["_termo"]),
        "multa": multa,
    }


def _montar_registros(miner: pd.DataFrame, pontos: dict) -> tuple[list, dict]:
    """Percorre os MG+mineração e devolve (linhas válidas, contadores)."""
    linhas: list[dict] = []
    fora_bbox = sem_coordenada = 0
    por_ano: Counter = Counter()
    por_municipio: Counter = Counter()
    origem: Counter = Counter()
    for row in miner.to_dict("records"):
        escolha = _escolher_coordenada(row, pontos)
        if escolha is None:
            sem_coordenada += 1
            continue
        lon, lat, _, do_poligono = escolha
        if not _em_faixa(lat, lon, BBOX_MG):
            fora_bbox += 1
            continue
        origem["poligono" if do_poligono else "auto"] += 1
        linha = _montar_linha(row, escolha)
        linhas.append(linha)
        if linha["ano"]:
            por_ano[str(linha["ano"])] += 1
        if linha["municipio"]:
            # Chave SEM acento: a fonte traz "Tres Coracoes" e "Três Corações"
            # no mesmo CSV — sem normalizar, o (f) infla com duplicata de acento.
            por_municipio[_sem_acentos(linha["municipio"])] += 1
    stats = {
        "linhas": linhas, "sem_coordenada": sem_coordenada,
        "fora_bbox": fora_bbox, "por_ano": por_ano,
        "por_municipio": por_municipio, "origem": origem,
    }
    return linhas, stats


def _mg_com_coordenada(mg: pd.DataFrame, pontos: dict) -> int:
    """Conta MG que têm polígono ou lat/lon preenchido no auto (etapa b)."""
    tem_poligono = mg["SEQ_AUTO_INFRACAO"].astype(str).str.strip().isin(pontos)
    tem_auto = (mg["NUM_LATITUDE_AUTO"].str.strip() != "") & \
               (mg["NUM_LONGITUDE_AUTO"].str.strip() != "")
    return int((tem_poligono | tem_auto).sum())


def _imprimir_resumo(stats: dict, mg_com_coord: int, termos: Counter) -> None:
    """Imprime as contagens (b) a (f) da medição, já medidas."""
    print(f"        (b) autos MG com coordenada válida: {mg_com_coord:,}"
          f"  (polígono ou lat/lon do próprio auto)")
    print(f"        (d) dos MG+mineração, dentro do bbox de MG: {len(stats['linhas']):,}")
    print(f"            sem coordenada nenhuma : {stats['sem_coordenada']:,}")
    # coordenada existe mas cai fora do bbox de MG (geocodificação torta)
    print(f"            coordenada fora do bbox: {stats['fora_bbox']:,}")
    print(f"            origem: poligono={stats['origem']['poligono']:,}"
          f"  auto={stats['origem']['auto']:,}")
    print(f"        (e) por ano: {dict(sorted(stats['por_ano'].items()))}")
    print(f"        (f) municipios distintos (chave sem acento):"
          f" {len(stats['por_municipio']):,}"
          f" — top 10: {stats['por_municipio'].most_common(10)}")


def _dry_run() -> None:
    """Mostra as URLs, tamanhos e datas do cache sem baixar nada."""
    for url, nome in ((URL_AUTOS, "auto_infracao.zip"), (URL_COORD, "coordenada.csv")):
        req = urllib.request.Request(url, headers={"User-Agent": UA}, method="HEAD")
        try:
            resp = urllib.request.urlopen(req, timeout=60)
            print(f"  {nome:22} {int(resp.headers.get('Content-Length', 0)):>12,} bytes"
                  f"  mod {resp.headers.get('Last-Modified', '?')}")
            resp.close()
        except Exception as e:
            print(f"  [!] HEAD {nome} falhou: {e}")
        time.sleep(PAUSA_BLOB)
    if (CACHE / "coordenada.csv").exists():
        print("  (coordenada.csv já está no cache — a coleta não vai baixar de novo)")


def _montar_dados(linhas: list, stats: dict, termos: Counter,
                  totais: dict) -> dict:
    """Monta o corpo do JSON de saída, com metadados e ressalvas.

    `totais` traz os quatro números de topo medidos nesta rodada:
    total_autos_acervo, total_linhas_coordenada, total_mg, total_mg_mineracao.
    """
    return {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "fonte": PAGE,
        "urls": {"autos": URL_AUTOS, "coordenadas": URL_COORD},
        **totais,
        "termos_mineracao_mg": dict(termos.most_common()),
        "registros_gravados": len(linhas),
        "por_ano": dict(sorted(stats["por_ano"].items())),
        "por_municipio": dict(stats["por_municipio"].most_common()),
        "sem_coordenada": stats["sem_coordenada"],
        "fora_bbox_mg": stats["fora_bbox"],
        "bbox_mg": BBOX_MG,
        "ressalva_editorial": RESSALVA,
        "obs_privacidade": ("nome, CPF e CNPJ de autuado não são lidos nem "
                            "gravados; texto do ato sanitizado e truncado."),
        "linhas": linhas,
    }


def _rodar_scan_cpf() -> None:
    """Roda o varredor de CPF (mod-11) sobre a saída; aborta com rc=2."""
    print("\n  rodando o varredor de CPF sobre a saída (mod-11)...")
    r = subprocess.run([sys.executable, "scripts/checar-dado-pessoal-em-dado.py",
                        "--extra", str(SAIDA)], cwd=RAIZ)
    if r.returncode != 0:
        print("  [!] CPF(s) achado(s) no JSON — redigir campo e regravar.")
        sys.exit(2)
    print("  scan clean.")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Coordenadas dos autos do IBAMA (positivo de treino de cavas)")
    parser.add_argument("--dry-run", action="store_true",
                        help="só mostra URLs, cache e contagens — não grava JSON")
    parser.add_argument("--limit", type=int, default=LIMITE_PADRAO,
                        help="trunca linhas gravadas no JSON (0 = sem limite)")
    parser.add_argument("--scan-cpf", action="store_true",
                        help="roda o varredor de CPF sobre a saída ao final")
    args = parser.parse_args()

    print("=== IBAMA — coordenadas dos autos (treino de cavas) ===\n")
    print(f"  dataset : {PAGE}")
    print(f"  autos   : {URL_AUTOS}")
    print(f"  coord   : {URL_COORD}")
    print(f"  cache   : {CACHE}")
    print(f"  saida   : {SAIDA}")
    print(f"  robots  : portal permitido (Crawl-Delay 10); blob sem robots.txt (pausa {PAUSA_BLOB}s)")
    print(f"  bbox MG : lon {BBOX_MG['lon_min']}..{BBOX_MG['lon_max']}, "
          f"lat {BBOX_MG['lat_min']}..{BBOX_MG['lat_max']}")

    if args.dry_run:
        _dry_run()
        return

    CACHE.mkdir(parents=True, exist_ok=True)
    print("\n  [1/4] garantindo arquivos no cache...")
    coord_path = _garantir(URL_COORD, "coordenada.csv", PAUSA_BLOB)
    zip_path = _garantir(URL_AUTOS, "auto_infracao.zip", PAUSA_BLOB)

    print("  [2/4] lendo coordenadas...")
    pontos, total_coord = _ler_coordenadas(coord_path)
    print(f"        {total_coord:,} linhas de coordenada; {len(pontos):,} autos com polígono")

    print("  [3/4] lendo autos (ZIP por ano, ~1 GB descompactado)...")
    df = _ler_autos(zip_path)
    total_autos = len(df)
    print(f"        {total_autos:,} autos no acervo inteiro")

    mg = df[df["UF"].str.strip() == "MG"]
    total_mg = len(mg)
    print("  [4/4] filtrando MG + termo de mineração...")
    print(f"        (a) autos MG total: {total_mg:,}")

    miner, termos = _filtrar_mineracao(mg)
    total_miner = len(miner)
    print(f"        (c) autos MG com termo de mineração: {total_miner:,}")
    print(f"            termos que casaram: {dict(termos.most_common(12))}")

    linhas, stats = _montar_registros(miner, pontos)
    _imprimir_resumo(stats, _mg_com_coordenada(mg, pontos), termos)

    if args.limit:
        linhas = linhas[:args.limit]
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    totais = {
        "total_autos_acervo": total_autos,
        "total_linhas_coordenada": total_coord,
        "total_mg": total_mg,
        "total_mg_mineracao": total_miner,
    }
    dados = _montar_dados(linhas, stats, termos, totais)
    SAIDA.write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")),
                     encoding="utf-8")
    print(f"\n[ok] {len(linhas)} registros → {SAIDA}"
          f" ({SAIDA.stat().st_size / 1024:.0f} KB)")

    if args.scan_cpf:
        _rodar_scan_cpf()


if __name__ == "__main__":
    main()
