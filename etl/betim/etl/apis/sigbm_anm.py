# -*- coding: utf-8 -*-
r"""etl.apis.sigbm_anm — barragens de mineração do **SIGBM/ANM**, dump CSV
aberto, filtrado para Minas Gerais.

Fonte: `https://dadosabertos.anm.gov.br/SIGBM/Barragens.csv` — download direto
(~3,4 MB, 124 colunas, 909 barragens no Brasil em 30/08/2026), sem chave, sem
login, CC-BY, atualização diária. Não há API de consulta — é dump direto, e é
ele que este módulo lê. Nenhuma página, nenhum painel interativo.

POR QUE ESTA FONTE EXISTE ALÉM DA FEAM E DO SNISB (já documentados em
`docs/ambiental/F0-discovery.md` §5). A FEAM cobre mineração e indústria de
Minas (249, XLSX anual) com DCE, nível de emergência e método construtivo. O
SNISB cobre todos os usos (2.212 em MG) mas o nível de perigo vem vazio em
~97% das linhas. O SIGBM é o cadastro NACIONAL de barragens de MINERAÇÃO da
ANM — o órgão fiscalizador federal — com 320 barragens em MG medidas em
30/08/2026, trazendo nível de emergência, status da DCE (RISR/RPSB), categoria
de risco e situação operacional (ativa, inativa, em construção, em
descaracterização) para o mesmo universo que a FEAM cobre por outro caminho.
Os três números seguem sem reconciliação (FEAM 249 × WFS IDE 259 × SIGBM 320 —
ver a nota da migration `0049_snisb_barragens.sql`); este módulo não tenta
resolver, grava o que o SIGBM diz.

═══ AS ARMADILHAS MEDIDAS AO VIVO (2026-08-30) ═══

1. **O CSV é cp1252, NÃO UTF-8.** Decodificar com `utf-8` (o padrão do
   `requests` ao adivinhar) quebra o cabeçalho e os acentos de município e
   empreendedor. Medido: `Município`, `Nível de Emergência`, `Situação
   Operacional` etc. vêm com bytes latinos. Este módulo decodifica cp1252 e
   RE-GRAVA o JSON em UTF-8.

2. **`Nível de Alerta` NÃO é `Emergência Nivel 1`.** O vocabulário real da
   coluna 15 é: `Sem emergência`, `Nível de Alerta`, `Emergência Nivel 1`,
   `Emergência Nivel 2`, `Emergência Nivel 3`. São dois instrumentos
   diferentes (alerta × emergência), e o rótulo cru viaja intacto — nenhuma
   tela deste portal pode somá-los num único "em emergência" sem dizer qual
   pedaço é qual.

3. **Datas-sentinela em `Data da Finalização da DCE`:** `Não se aplica a esta
   barragem` (414/909 nacional) e `Não foi entregue` (13/909) NÃO são datas;
   `-` também não. Só linhas com data `dd/mm/aaaa HH:MM:SS` de verdade viram
   ISO. "Não se aplica" não é "sem DCE" nem "DCE atrasada" — é outro estado,
   e a tela precisa do texto.

4. **`CPF_CNPJ` é a coluna 3, e a regra do repositório manda varrer o DADO,
   não só o campo.** Medido: em MG, 320/320 são CNPJ de 14 dígitos, zero CPF
   de 11. Mesmo assim esta coluna NÃO entra no JSON publicado — o identificador
   da empresa é o nome do empreendedor, e coluna chamada CPF_CNPJ num acervo
   que pode ganhar linha de pessoa física um dia não é risco que o portal
   precisa carregar.

5. **O cabeçalho é estável mas NÃO é contrato.** 124 colunas hoje; o módulo
   exige por NOME as colunas essenciais e aborta com a lista real se alguma
   sumir — em vez de gravar um JSON com campo vazio para sempre.

═══ O QUE ESTE MÓDULO ESCREVE ═══

`apps/web/data/barragens-sigbm.json` — agregado do portal:

    {
      "fonte": "ANM — SIGBM (dados abertos)",
      "url_fonte": "https://dadosabertos.anm.gov.br/SIGBM/Barragens.csv",
      "ultima_atualizacao": "2026-08-27",   # Last-Modified do arquivo na coleta
      "coletado_em": "2026-08-30",
      "total": 320,                          # barragens em MG
      "total_brasil": 909,
      "municipios": 76,
      "barragens": [ { "id", "nome", "empreendedor", "uf", "municipio",
                       "situacao", "nivel_emergencia", "categoria_risco",
                       "dano_potencial", "fase_descaracterizacao",
                       "data_finalizacao_dce" } ... ]
    }

Checkpoint: agregado vazio NÃO sobrescreve o arquivo bom (mesma regra do
`gravar` do `sirenejud_cnj`). O arquivo fica em `apps/web/data/`, que está em
`DIRETORIOS_DADO` do `scripts/checar-dado-pessoal-em-dado.py` — a varredura de
CPF mod-11 roda sobre ele no pre-push e na CI.

Uso:

    python -m etl.apis.sigbm_anm
"""
import datetime
import email.utils
import io
import json
import os
import re
import sys
import urllib.request

import pandas as pd

AQUI = os.path.dirname(os.path.abspath(__file__))
ETL_BETIM = os.path.abspath(os.path.join(AQUI, "..", ".."))
DESTINO = os.path.abspath(os.path.join(
    ETL_BETIM, "..", "..", "apps", "web", "data", "barragens-sigbm.json"))

URL_CSV = "https://dadosabertos.anm.gov.br/SIGBM/Barragens.csv"
UA = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"
FONTE = "ANM — SIGBM (dados abertos)"
ENCODING = "cp1252"  # armadilha 1: o arquivo NÃO é UTF-8
UF_ALVO = "MG"
PAUSA_SEGUNDOS = 2  # leve, por deferência ao servidor público

# As colunas essenciais do portal, por NOME exato do cabeçalho (armadilha 5:
# aborta com a lista real se o layout mudar, não grava campo vazio).
CAMPOS = {
    "id": "ID",
    "nome": "Nome",
    "empreendedor": "Empreendedor",
    "uf": "UF",
    "municipio": "Município",
    "situacao": "Situação Operacional",
    "nivel_emergencia": "Nível de Emergência",
    "categoria_risco": "Categoria de Risco - CRI",
    "dano_potencial": "Dano Potencial Associado - DPA",
    "fase_descaracterizacao": "Fase Atual do projeto de Descaracterização",
    "data_finalizacao_dce": "Data da Finalização da DCE",
}

# Textos que a fonte usa onde outras tabelas poriam "sem data" — NÃO são
# datas, e perder a distinção (armadilha 3) faria "não se aplica" virar
# "atrasada".
_NAO_E_DATA = {
    "Não se aplica a esta barragem",
    "Não foi entregue",
    "-",
    "",
    None,
}

_RE_DATA = re.compile(r"^(\d{2})/(\d{2})/(\d{4})")


def _txt(v) -> str | None:
    if v is None:
        return None
    s = str(v).strip()
    return s or None


def _data_iso(v) -> str | None:
    """`dd/mm/aaaa HH:MM:SS` → `aaaa-mm-dd`. Texto de estado NÃO vira data
    (armadilha 3) — fica `None`, e quem mostra a lacuna explica o porquê."""
    if v in _NAO_E_DATA:
        return None
    s = str(v).strip()
    m = _RE_DATA.match(s)
    if not m:
        print("[etl.apis.sigbm_anm] AVISO: data inesperada %r — gravando null"
              % v)
        return None
    d, mes, ano = m.groups()
    return "%s-%s-%s" % (ano, mes, d)


def _head_info():
    req = urllib.request.Request(URL_CSV, method="HEAD",
                                 headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return {
            "last_modified": r.headers.get("Last-Modified"),
            "content_length": int(r.headers.get("Content-Length") or 0),
        }


def _baixar():
    """Download único do dump — a fonte é UM arquivo, sem paginação."""
    req = urllib.request.Request(URL_CSV, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=180) as r:
        dados = r.read()
    if not dados:
        raise RuntimeError("download vazio")
    return dados


def _carregar(dados: bytes) -> pd.DataFrame:
    """Decodifica cp1252 (armadilha 1) e lê com pandas.

    Devolve o DataFrame inteiro e imprime o cabeçalho real — é o passo que o
    coletor precisa ver antes de escolher coluna, e o registro do layout na
    rodada."""
    texto = dados.decode(ENCODING)
    df = pd.read_csv(io.StringIO(texto), sep=",", dtype=str,
                     keep_default_na=False)
    print("cabeçalho real do CSV (%d colunas):" % len(df.columns))
    for i, nome in enumerate(df.columns):
        print("  %3d: %s" % (i, nome))
    return df


def _extrair(df: pd.DataFrame) -> list[dict]:
    """Valida as colunas essenciais por nome (armadilha 5) e extrai."""
    faltando = [rotulo for rotulo in CAMPOS.values() if rotulo not in df.columns]
    if faltando:
        raise RuntimeError(
            "colunas essenciais ausentes do CSV: %s; colunas reais: %s"
            % (faltando, sorted(df.columns)))

    mg = df[df["UF"].str.strip().str.upper() == UF_ALVO].copy()
    linhas = []
    for _, r in mg.iterrows():
        linhas.append({
            "id": _txt(r["ID"]),
            "nome": _txt(r["Nome"]),
            "empreendedor": _txt(r["Empreendedor"]),
            "uf": UF_ALVO,
            "municipio": _txt(r["Município"]),
            "situacao": _txt(r["Situação Operacional"]),
            "nivel_emergencia": _txt(r["Nível de Emergência"]),
            "categoria_risco": _txt(r["Categoria de Risco - CRI"]),
            "dano_potencial": _txt(r["Dano Potencial Associado - DPA"]),
            "fase_descaracterizacao": _txt(r["Fase Atual do projeto de "
                                             "Descaracterização"]),
            "data_finalizacao_dce": _data_iso(r["Data da Finalização da DCE"]),
        })
    linhas.sort(key=lambda b: ((b["municipio"] or "").upper(),
                               (b["nome"] or "").upper()))
    return linhas


def _gravar(payload: dict) -> None:
    """Checkpoint: agregado vazio NÃO sobrescreve arquivo bom."""
    if not payload.get("barragens"):
        raise RuntimeError("agregado vazio — arquivo anterior preservado")
    os.makedirs(os.path.dirname(DESTINO), exist_ok=True)
    tmp = DESTINO + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, DESTINO)
    print("gravado %s (%d bytes)" % (DESTINO, os.path.getsize(DESTINO)))


def main():
    import time

    info = _head_info()
    print("HEAD: last-modified=%s, %d bytes" % (
        info["last_modified"], info["content_length"]))

    dados = _baixar()
    df = _carregar(dados)
    total_brasil = int(len(df))
    print("linhas lidas (Brasil): %d" % total_brasil)
    time.sleep(PAUSA_SEGUNDOS)

    barragens = _extrair(df)
    municipios = len({b["municipio"] for b in barragens})
    print("barragens em MG: %d, em %d municípios" % (len(barragens), municipios))

    ultima = None
    if info["last_modified"]:
        # Last-Modified vem em formato HTTP ("Thu, 27 Aug 2026 09:05:19 GMT"),
        # NÃO dd/mm/aaaa — o parser de data do cabeçalho precisa disso.
        try:
            ultima = email.utils.parsedate_to_datetime(
                info["last_modified"]).date().isoformat()
        except (TypeError, ValueError):
            print("[etl.apis.sigbm_anm] AVISO: Last-Modified inesperado %r"
                  % info["last_modified"])

    _gravar({
        "fonte": FONTE,
        "url_fonte": URL_CSV,
        "ultima_atualizacao": ultima,
        "coletado_em": datetime.date.today().isoformat(),
        "total": len(barragens),
        "total_brasil": total_brasil,
        "municipios": municipios,
        "barragens": barragens,
    })


if __name__ == "__main__":
    sys.exit(main())
