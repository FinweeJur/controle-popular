# -*- coding: utf-8 -*-
"""
Coletor dos FORNECEDORES DE CAMPANHA das Eleições 2022 (MG) — TSE.

Papel no portal
===============
Alimenta `/congresso/financiamento-eleitoral`: as EMPRESAS (pessoa jurídica)
que mais receberam dinheiro das campanhas eleitorais de 2022 em Minas Gerais,
para o cidadão cruzar com os contratos públicos daquele CNPJ.

Por que FORNECEDOR (despesa) e não DOADOR (receita)?
Desde 2015 (STF, ADI 4650) a pessoa jurídica está PROIBIDA de doar a campanhas
ou partidos. Então o lado da receita é quase todo pessoa física (CPF), que não
se publica. O lado que continua sendo empresa — e é o cruzamento cívico que
importa — é a DESPESA: quem a campanha PAGOU. Usa-se `despesas_contratadas`
(o arquivo de "pagas" não traz o fornecedor identificado).

Fonte oficial
=============
TSE — Prestação de Contas Eleitorais 2022 (dados abertos):
https://dadosabertos.tse.jus.br/dataset/dadosabertos-tse-jus-br-dataset-prestacao-de-contas-eleitorais-2022
Arquivo: prestacao_de_contas_eleitorais_candidatos_2022.zip → recorte MG.

Cortesia e robôs
================
robots.txt de dadosabertos.tse.jus.br usa Crawl-Delay 10; o arquivo é servido
pelo CDN (cdn.tse.jus.br). Um download único, com cache em disco (checkpoint).
User-Agent honesto do portal.

Dado pessoal (AGENTS §5.2)
==========================
Cada linha traz o CPF do candidato e, quando o fornecedor é pessoa física, o
CPF do fornecedor. Este coletor publica APENAS fornecedor pessoa jurídica e
NUNCA grava CPF — nem do candidato, nem do fornecedor.
"""

import csv
import io
import json
import re
import sys
import time
import urllib.request
import zipfile
from collections import defaultdict
from pathlib import Path

URL_FONTE = "https://cdn.tse.jus.br/estatistica/sead/odsele/prestacao_contas/prestacao_de_contas_eleitorais_candidatos_2022.zip"
URL_PAGINA = "https://dadosabertos.tse.jus.br/dataset/dadosabertos-tse-jus-br-dataset-prestacao-de-contas-eleitorais-2022"
USER_AGENT = "ControlePopular/1.0 (+contato@controlepopular.com.br; dado publico governamental)"
UF = "MG"
ARQUIVO = f"despesas_contratadas_candidatos_2022_{UF}.csv"
ENTRADA = Path("etl/betim/entrada/tse/prestacao_de_contas_eleitorais_candidatos_2022.zip")
SAIDA = Path(f"apps/web/data/eleicoes/fornecedores-campanha-2022-{UF.lower()}.json")

# Só entra no acervo o fornecedor com este total contratado ou mais; o resto é
# reportado como lacuna (o acervo fica utilizável e não vira uma lista de trocados).
VALOR_MINIMO = 50_000.0

REGEX_CPF = re.compile(r"(?<!\d)\d{11}(?!\d)")
REGEX_CPF_FMT = re.compile(r"\d{3}\.\d{3}\.\d{3}-\d{2}")


def sanitizar(texto: str) -> str:
    """Mascara CPF em campo de texto (a fonte às vezes cola o CPF no nome)."""
    return REGEX_CPF.sub("***", REGEX_CPF_FMT.sub("***", texto or ""))


def baixar(destino: Path) -> Path:
    destino.parent.mkdir(parents=True, exist_ok=True)
    if destino.exists() and destino.stat().st_size > 100_000_000:
        print(f"[tse] ZIP em disco ({destino.stat().st_size} bytes) — checkpoint usado")
        return destino
    print(f"[tse] baixando {URL_FONTE} …")
    req = urllib.request.Request(URL_FONTE, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=1800) as resposta, open(destino, "wb") as arquivo:
        arquivo.write(resposta.read())
    print(f"[tse] ok ({destino.stat().st_size} bytes)")
    time.sleep(10)
    return destino


def valor(txt: str) -> float:
    """'1.234,56' → 1234.56; vazio/#NULO → 0."""
    if not txt or "#NULO" in txt or txt.strip() in ("-1", ""):
        return 0.0
    return float(txt.strip().replace(".", "").replace(",", "."))


def moeda(n: float) -> str:
    return f"R$ {n:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def main() -> int:
    z_path = baixar(ENTRADA)
    agregado: dict[str, dict] = {}
    abaixo = 0
    total_geral = 0.0
    linhas = 0
    pf_ignorada = 0

    with zipfile.ZipFile(z_path) as z:
        with z.open(ARQUIVO) as bruto:
            leitor = csv.reader(io.TextIOWrapper(bruto, encoding="latin-1"), delimiter=";")
            cab = next(leitor)
            i_uf, i_ue = cab.index("SG_UF"), cab.index("NM_UE")
            i_cargo, i_cand = cab.index("DS_CARGO"), cab.index("NM_CANDIDATO")
            i_part = cab.index("SG_PARTIDO")
            i_cnae_cd, i_cnae = cab.index("CD_CNAE_FORNECEDOR"), cab.index("DS_CNAE_FORNECEDOR")
            i_doc = cab.index("NR_CPF_CNPJ_FORNECEDOR")
            i_nome, i_nome_rfb = cab.index("NM_FORNECEDOR"), cab.index("NM_FORNECEDOR_RFB")
            i_uf_f, i_mun_f = cab.index("SG_UF_FORNECEDOR"), cab.index("NM_MUNICIPIO_FORNECEDOR")
            i_dt, i_ds = cab.index("DT_DESPESA"), cab.index("DS_DESPESA")
            i_vr = cab.index("VR_DESPESA_CONTRATADA")

            for col in leitor:
                linhas += 1
                doc = re.sub(r"\D", "", col[i_doc])
                if len(doc) == 11:
                    pf_ignorada += 1
                    continue
                if len(doc) != 14:
                    continue
                v = valor(col[i_vr])
                total_geral += v
                a = agregado.get(doc)
                if a is None:
                    nome = col[i_nome_rfb] if col[i_nome_rfb] not in ("#NULO", "") else col[i_nome]
                    a = agregado[doc] = {
                        "cnpj": f"{doc[:2]}.{doc[2:5]}.{doc[5:8]}/{doc[8:12]}-{doc[12:]}",
                        "nome": "" if nome in ("#NULO", "") else sanitizar(nome.strip()),
                        "cnae": sanitizar(col[i_cnae]) if col[i_cnae] != "#NULO" else "",
                        "municipio": sanitizar(col[i_mun_f]) if "#NULO" not in col[i_mun_f] else "",
                        "uf": sanitizar(col[i_uf_f]) if "#NULO" not in col[i_uf_f] else "",
                        "total": 0.0,
                        "despesas": 0,
                        "_cands": defaultdict(float),
                    }
                a["total"] += v
                a["despesas"] += 1
                chave_cand = f"{col[i_cand]}||{col[i_cargo]}||{col[i_part]}"
                a["_cands"][chave_cand] += v

    registros = []
    for a in agregado.values():
        if a["total"] < VALOR_MINIMO:
            abaixo += 1
            continue
        tops = sorted(a.pop("_cands").items(), key=lambda x: -x[1])[:3]
        a["top_destinos"] = [
            {
                "candidato": sanitizar(c.split("||")[0]),
                "cargo": sanitizar(c.split("||")[1]),
                "partido": sanitizar(c.split("||")[2]),
                "valor": round(v, 2),
            }
            for c, v in tops
        ]
        a["total"] = round(a["total"], 2)
        registros.append(a)

    registros.sort(key=lambda r: -r["total"])
    texto = json.dumps(registros, ensure_ascii=False)
    if REGEX_CPF.search(texto):
        print("ABORTADO: sequência de 11 dígitos no acervo (possível CPF)")
        return 1

    acervo = {
        "fonte": "TSE — Prestação de Contas Eleitorais 2022 (dados abertos), despesas contratadas",
        "url_fonte": URL_PAGINA,
        "url_arquivo": URL_FONTE,
        "escopo": f"Eleicoes Gerais 2022 - candidaturas de {UF}",
        "atualizado_em": time.strftime("%Y-%m-%d"),
        "valor_minimo": VALOR_MINIMO,
        "metodologia": (
            f"Fornecedores pessoa juridica das despesas contratadas por campanhas de {UF} em 2022, "
            f"agregados por CNPJ (total contratado, numero de despesas e os principais destinos). "
            f"Entram no acervo os fornecedores com total igual ou superior a {moeda(VALOR_MINIMO)}; "
            f"os abaixo disso sao contados como lacuna. Fornecedor pessoa fisica (CPF) e CPF de "
            f"candidato NUNCA sao gravados. Contratado nao e pago: e o valor firmado com a campanha."
        ),
        "linhas_lidas": linhas,
        "total_geral_contratado": round(total_geral, 2),
        "total_fornecedores_pj": len(agregado),
        "total_fornecedores_publicados": len(registros),
        "fornecedores_abaixo_do_minimo": abaixo,
        "despesas_pessoa_fisica_ignoradas": pf_ignorada,
        "registros": registros,
    }
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(acervo, ensure_ascii=False, indent=1), encoding="utf-8")
    print(
        f"ok: {len(registros)} fornecedores publicados de {len(agregado)} PJ "
        f"({abaixo} abaixo de {moeda(VALOR_MINIMO)}) | total {moeda(total_geral)} | {linhas} linhas -> {SAIDA}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
