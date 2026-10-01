# -*- coding: utf-8 -*-
"""
Coletor do Cadastro de Empregadores (a "lista suja" do trabalho escravo) — MTE.

Papel no portal
===============
Alimenta a seção de trabalho escravo contemporâneo em `/direitos-em-movimento/`:
as EMPRESAS (pessoa jurídica) incluídas pelo Ministério do Trabalho e Emprego no
Cadastro de Empregadores que submeteram trabalhadores a condições análogas à
escravidão. A partir da lista, o cidadão confere os contratos públicos daquele
CNPJ e a ação fiscal que gerou a inclusão.

Fonte oficial
=============
Ministério do Trabalho e Emprego — Cadastro de Empregadores (Portaria
Interministerial MTE/MDHC/MIR nº 18, de 13/09/2024):
https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/areas-de-atuacao/cadastro_de_empregadores.txt
Atualização periódica. Cada registro traz ID, ano da ação fiscal, UF, empregador,
CNPJ/CPF, estabelecimento, trabalhadores envolvidos, CNAE e as datas de decisão
administrativa e de inclusão no Cadastro — é a própria fonte que identifica o ato.

Cortesia e robôs
================
robots.txt de www.gov.br não bloqueia o caminho `/trabalho-e-emprego/...`
(bloqueia /ebserh, /mre e /economia/.../internet). Uma requisição, User-Agent
honesto do portal, com cache em disco (checkpoint: não baixa de novo o arquivo
do mesmo dia).

Dado pessoal — decisão de projeto (LGPD + AGENTS §5.2)
======================================================
O Cadastro mistura PESSOA JURÍDICA (CNPJ) e PESSOA FÍSICA (CPF). Este coletor
publica APENAS os empregadores pessoa jurídica. As linhas de pessoa física são
contadas e reportadas como lacuna declarada (`empregadores_pessoa_fisica`), mas
não entram no acervo: nome de pessoa atrelado a este tema é dado sensível, e o
cruzamento com contratos públicos só se aplica a CNPJ. O CPF NUNCA é gravado.
"""

import csv
import io
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

URL_FONTE = (
    "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/"
    "areas-de-atuacao/cadastro_de_empregadores.txt"
)
URL_PAGINA = (
    "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/"
    "areas-de-atuacao/combate-ao-trabalho-escravo-e-analogo-ao-de-escravo"
)
USER_AGENT = "ControlePopular/1.0 (+contato@controlepopular.com.br; dado publico governamental)"
ENTRADA = Path("etl/betim/entrada/mte-lista-suja/cadastro_empregadores.txt")
SAIDA = Path("apps/web/data/trabalho/cadastro-empregadores-mte.json")

REGEX_CNPJ = re.compile(r"^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$")
REGEX_CPF_FORMATADO = re.compile(r"\d{3}\.\d{3}\.\d{3}-\d{2}")
REGEX_CPF_CRU = re.compile(r"(?<!\d)\d{11}(?!\d)")
REGEX_DATA = re.compile(r"(\d{2})/(\d{2})/(\d{4})")
REGEX_UF = re.compile(r"([^/,]+)/([A-Z]{2})\s*$")


def sanitizar_dado_pessoal(texto: str) -> str:
    """
    Mascara CPF em qualquer campo de texto.

    A fonte cola o CPF no próprio nome do empregador em vários registros
    (ex.: "FULANO DE TAL 000.000.000-00" — aqui é sintético) — pego pelo
    autoteste. O CPF NUNCA pode chegar ao acervo versionado (AGENTS §5.2).
    """
    texto = REGEX_CPF_FORMATADO.sub("***", texto or "")
    return REGEX_CPF_CRU.sub("***", texto)



def baixar(destino: Path) -> Path:
    """Baixa o arquivo oficial com cache de disco (mesmo dia não rebaixa)."""
    destino.parent.mkdir(parents=True, exist_ok=True)
    if destino.exists() and destino.stat().st_size > 50_000:
        print(f"[mte] arquivo em disco ({destino.stat().st_size} bytes) — checkpoint usado")
        return destino
    print(f"[mte] baixando {URL_FONTE} …")
    req = urllib.request.Request(URL_FONTE, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=180) as resposta, open(destino, "wb") as arquivo:
        arquivo.write(resposta.read())
    print(f"[mte] ok ({destino.stat().st_size} bytes)")
    time.sleep(2)
    return destino


def iso(data: str) -> str:
    """dd/mm/aaaa → aaaa-mm-dd; vazio quando não há data."""
    m = REGEX_DATA.search(data or "")
    return f"{m.group(3)}-{m.group(2)}-{m.group(1)}" if m else ""


def limpar_nome(bruto: str) -> str:
    """Remove o prefixo de documento que a fonte às vezes cola no nome do empregador."""
    return re.sub(r"^\d{2}\.\d{3}\.\d{3}\s+", "", bruto.strip()).strip()


def municipio_do_estabelecimento(texto: str) -> str:
    """Extrai 'CIDADE/UF' do fim do endereço do estabelecimento, quando houver."""
    m = REGEX_UF.search(texto or "")
    return m.group(1).strip().title() if m else ""


def parsear(texto: str) -> dict:
    """Parseia o arquivo de largura fixa (colunas separadas por tabulação)."""
    linhas = texto.splitlines()
    atualizado = ""
    if len(linhas) > 2:
        m = REGEX_DATA.search(linhas[2])
        if m:
            atualizado = f"{m.group(3)}-{m.group(2)}-{m.group(1)}"

    inicio = next((i for i, l in enumerate(linhas) if "CNPJ/CPF" in l and l.count("\t") >= 8), None)
    if inicio is None:
        raise RuntimeError("cabeçalho do Cadastro não encontrado — o layout da fonte mudou")

    registros, empresas, pessoa_fisica, trabalhadores, ufs = [], set(), 0, 0, set()
    for linha in linhas[inicio + 1 :]:
        col = [c.strip() for c in linha.split("\t")]
        if len(col) < 8 or not col[0].isdigit():
            continue
        doc = col[4]
        if not REGEX_CNPJ.match(doc):
            # Pessoa física (CPF) ou linha sem documento válido: NÃO vai ao acervo.
            if re.match(r"^\d{3}\.\d{3}\.\d{3}-\d{2}$", doc):
                pessoa_fisica += 1
            continue

        estabelecimento = col[5]
        uf = col[2]
        ufs.add(uf)
        empresas.add(doc[:10])  # raiz do CNPJ (8 dígitos + barra)
        try:
            n_trab = int(col[6])
            trabalhadores += n_trab
        except (ValueError, IndexError):
            n_trab = None

        registros.append(
            {
                "id": int(col[0]),
                "ano_acao_fiscal": col[1],
                "uf": uf,
                "empregador": limpar_nome(sanitizar_dado_pessoal(col[3])),
                "cnpj": doc,
                "estabelecimento": sanitizar_dado_pessoal(estabelecimento),
                "municipio": municipio_do_estabelecimento(estabelecimento),
                "trabalhadores_envolvidos": n_trab,
                "cnae": col[7],
                "decisao_administrativa": iso(col[8]) if len(col) > 8 else "",
                "inclusao_cadastro": iso(col[9]) if len(col) > 9 else "",
            }
        )

    registros.sort(key=lambda r: r["inclusao_cadastro"] or "", reverse=True)
    return {
        "fonte": "Ministério do Trabalho e Emprego — Cadastro de Empregadores (Portaria Interministerial MTE/MDHC/MIR nº 18/2024)",
        "url_fonte": URL_FONTE,
        "url_pagina": URL_PAGINA,
        "atualizado_em": atualizado,
        "metodologia": (
            "Empregadores pessoa jurídica (CNPJ) do Cadastro de Empregadores do MTE. Cada registro traz o "
            "ID, a UF, o estabelecimento, o número de trabalhadores envolvidos, o CNAE e as datas da decisão "
            "administrativa e da inclusão no Cadastro. A inclusão é ato administrativo do MTE; a empresa "
            "pode contestar judicialmente e ser excluída — confira sempre na fonte. Empregadores pessoa "
            "física são contados à parte e NÃO são publicados (proteção de dado pessoal e foco no "
            "cruzamento com contratos públicos). Nenhum CPF é gravado neste acervo."
        ),
        "total_registros": len(registros),
        "total_empresas": len(empresas),
        "total_ufs": len(ufs),
        "trabalhadores_envolvidos_total": trabalhadores,
        "empregadores_pessoa_fisica_omitidos": pessoa_fisica,
        "registros": registros,
    }


def autoteste(acervo: dict) -> int:
    """Guarda do parser e da sanitização — roda com `--autoteste`."""
    texto = json.dumps(acervo, ensure_ascii=False)
    problemas = []
    if acervo["total_registros"] < 100:
        problemas.append(f"poucos registros: {acervo['total_registros']}")
    if re.search(r"\d{3}\.\d{3}\.\d{3}-\d{2}", texto):
        problemas.append("CPF presente no acervo")
    if re.search(r"(?<!\d)\d{11}(?!\d)", texto):
        problemas.append("sequência de 11 dígitos no acervo")
    if acervo["total_registros"] != len(acervo["registros"]):
        problemas.append("total_registros não bate com a lista")
    for r in acervo["registros"]:
        if not REGEX_CNPJ.match(r["cnpj"]):
            problemas.append(f"CNPJ inválido no id {r['id']}: {r['cnpj']}")
            break
    if problemas:
        print("AUTOTESTE FALHOU:")
        for p in problemas:
            print(" -", p)
        return 1
    print(f"AUTOTESTE OK — {acervo['total_registros']} registros, {acervo['total_empresas']} empresas")
    return 0


def main() -> int:
    caminho = baixar(ENTRADA)
    texto = caminho.read_bytes().decode("latin-1")
    acervo = parsear(texto)
    if "--autoteste" in sys.argv:
        return autoteste(acervo)
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(acervo, ensure_ascii=False, indent=1), encoding="utf-8")
    print(
        f"ok: {acervo['total_registros']} registros | {acervo['total_empresas']} empresas | "
        f"{acervo['empregadores_pessoa_fisica_omitidos']} pessoa física omitida -> {SAIDA}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
