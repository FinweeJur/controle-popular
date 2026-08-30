# -*- coding: utf-8 -*-
"""CVM — companhias abertas: documentos da Vale protocolados na CVM (ITR/DFP/FRE).

═══ O QUE E' ESTA FONTE ═══

A CVM publica, em dados abertos (https://dados.cvm.gov.br/dados/CIA_ABERTA/),
o cadastro das companhias abertas (CSV diario) e os acervos em massa dos
documentos periodicos e eventuais (zips anuais por tipo de documento). Estes
zips contem TODAS as companhias; este coletor baixa o cadastro, acha o codigo
CVM da Vale pelo CNPJ (33.592.510/0001-54), baixa os zips de ITR (informacoes
trimestrais), DFP (demonstracoes financeiras padronizadas, anuais) e FRE
(formulario de referencia, anual) para 2015..2025, filtra os registros da Vale
e grava `apps/web/data/cvm-vale.json`, lido no BUILD pela rota
`/paraopeba/vale/documentos`.

════ ARMADILHAS MEDIDAS EM 2026-08-30 ════

1. **O CD_CVM vem com 6 digitos, zero a esquerda.** Banco do Brasil e'
   `001023`; a Vale e' `004170`, nao `4170`. Filtrar pelo int 4170 devolve
   vazio em silencio. Este coletor acha o codigo NO CADASTRO pelo CNPJ e
   completa com zeros, e so' aceita o registro se CNPJ e codigo baterem.
2. **O CSV principal de cada zip e' o `<tipo>_cia_aberta_<ano>.csv`** — as
   demonstracoes em si (`_BPA`, `_DRE`, ...) nao entram neste acervo: aqui se
   cataloga o DOCUMENTO (ITR/DFP/FRE), nao o conteudo das tabelas.
3. **`VERSAO` repete: ha' republicacoes.** A Vale protocolou a DFP 2025 duas
   vezes, o FRE 2025 dezessete vezes e o ITR 1T2025 duas vezes. Publica-se o
   registro da versao mais recente por periodo, com `total_versoes` ao lado —
   numero sem essa ressalva esconderia o vaivem de republicacao.
4. **O `LINK_DOC` do registro e' o link direto ao documento protocolado**
   (rad.cvm.gov.br). O `link` do JSON aponta para o zip em massa (o arquivo
   fonte); o `link_documento` aponta para o documento em si.
5. **Encoding latin-1.** Os CSVs saem em ISO-8859-1; a leitura tenta utf-8
   primeiro e cai para latin-1 se falhar.

Fonte: https://dados.cvm.gov.br/dados/CIA_ABERTA/
Cadastro: https://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/cad_cia_aberta.csv
Zips: .../DOC/{ITR,DFP,FRE}/DADOS/<tipo>_cia_aberta_<ano>.zip
Medido em 2026-08-30: 33 zips (2015..2025) somam ~530 MB; o cadastro, 1,5 MB.
"""
from __future__ import annotations

import datetime
import json
import os
import sys
import time
import urllib.request
import zipfile

import pandas as pd

AQUI = os.path.dirname(os.path.abspath(__file__))
DADOS_BRUTOS = os.path.abspath(os.path.join(
    AQUI, "..", "..", "dados-brutos", "cvm"))
SAIDA = os.path.abspath(os.path.join(
    AQUI, "..", "..", "..", "..", "apps", "web", "data", "cvm-vale.json"))
UA = "controle-popular/1.0 (+https://github.com/FinweeJur/controle-popular)"
FONTE = "CVM — dados abertos (CIA_ABERTA)"
COMPANHIA = "VALE S.A."
CNPJ_VALE = "33.592.510/0001-54"
URL_CADASTRO = ("https://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/"
                "cad_cia_aberta.csv")
BASE_ZIP = ("https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/{tipo}/DADOS/"
            "{tipo_lower}_cia_aberta_{ano}.zip")
ANOS = list(range(2015, 2026))
TIPOS = ("ITR", "DFP", "FRE")
PAUSA = 1.5  # segundos entre downloads em massa


def _norm_digitos(s):
    return "".join(ch for ch in str(s or "") if ch.isdigit())


def _codigo_cvm_pad(cod):
    """`4170` -> `004170`. O CD_CVM dos CSVs de documento vem com 6 digitos."""
    return str(cod).zfill(6)


def _url_zip(tipo, ano):
    return BASE_ZIP.format(tipo=tipo, tipo_lower=tipo.lower(), ano=ano)


def _baixar(url, destino):
    """Baixa com UA honesto; pula so' se o arquivo em disco for valido.

    A validacao importa: uma rodada interrompida no meio de um download deixa
    um arquivo truncado com tamanho > 0, e pular por tamanho passaria o lixo
    adiante (medido em 30/08/2026: 3 zips truncados acusaram "File is not a
    zip file"). A comparação usa o Content-Length remoto (a CVM responde
    Range) e o teste de zip — os dois juntos, nunca tamanho sozinho.
    """
    if os.path.exists(destino):
        try:
            with zipfile.ZipFile(destino) as z:
                if z.testzip() is None and _tamanho_remoto(url) == \
                        os.path.getsize(destino):
                    print("ja' em disco e valido, pulando: %s"
                          % os.path.basename(destino))
                    return False
        except Exception:
            pass
        print("arquivo local invalido/incompleto, baixando de novo: %s"
              % os.path.basename(destino))
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    print("baixando %s ..." % url)
    with urllib.request.urlopen(req, timeout=300) as r, open(destino, "wb") as f:
        while True:
            bloco = r.read(1 << 20)
            if not bloco:
                break
            f.write(bloco)
    print("  -> %d bytes" % os.path.getsize(destino))
    return True


def _tamanho_remoto(url):
    """Content-Length via Range (a CVM nao responde HEAD de forma confiavel)."""
    req = urllib.request.Request(url, headers={"User-Agent": UA,
                                               "Range": "bytes=0-0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        cr = r.headers.get("Content-Range", "")
        return int(cr.split("/")[-1]) if cr else 0


def _ler_csv_principal(caminho_zip, tipo, ano):
    """Le o CSV principal do zip, tentando utf-8 e caindo para latin-1."""
    nome = "%s_cia_aberta_%d.csv" % (tipo.lower(), ano)
    with zipfile.ZipFile(caminho_zip) as z:
        if nome not in z.namelist():
            raise RuntimeError("zip sem %s; conteudo: %s" % (
                nome, z.namelist()[:5]))
        with z.open(nome) as f:
            try:
                return pd.read_csv(f, sep=";", encoding="utf-8", dtype=str)
            except UnicodeDecodeError:
                pass
            # volta ao inicio (zipfile nao da seek em modo texto puro)
        with z.open(nome) as f:
            return pd.read_csv(f, sep=";", encoding="latin-1", dtype=str)


def _periodo_itr(dt_refer):
    """`2025-03-31` -> `1T2025`. O trimestre vem do fim do periodo, nao do mes
    da publicacao (o ITR 4T nao existe: o ano fecha na DFP)."""
    m = dt_refer[:10].split("-")
    if len(m) != 3:
        return dt_refer
    ano, mes, _dia = m
    trim = {"03": "1T", "06": "2T", "09": "3T", "12": "4T"}.get(mes, "?T")
    return "%s%s" % (trim, ano)


def _linha_documento(linha, tipo, ano, url_zip):
    """Uma linha filtrada (a versao mais recente do periodo) vira o registro
    publico. O numero vem do dado; nada e' digitado a mao aqui."""
    dt_refer = str(linha.get("DT_REFER") or "")[:10]
    periodo = _periodo_itr(dt_refer) if tipo == "ITR" else dt_refer
    return {
        "ano": ano,
        "tipo": tipo,
        "periodo": periodo,
        "data_referencia": dt_refer or None,
        "data_recebimento": str(linha.get("DT_RECEB") or "")[:10] or None,
        "versao": int(linha.get("VERSAO") or 0),
        "id_doc": int(linha.get("ID_DOC") or 0),
        "link": url_zip,
        "link_documento": str(linha.get("LINK_DOC") or "").strip() or None,
    }


def _documentos_do_zip(caminho_zip, tipo, ano, codigo_cvm, url_zip):
    """Filtra os registros da Vale num zip e devolve a lista de documentos
    (versao mais recente por periodo) + metadados de republicacao."""
    df = _ler_csv_principal(caminho_zip, tipo, ano)
    # Lista os campos reais UMA vez por tipo (cabecalho + 2 linhas), como
    # pede a checagem de entrada: a estrutura do CSV e' a do dado, nao a
    # nossa suposicao.
    print("\n[%s %d] campos reais: %s" % (tipo, ano, list(df.columns)))
    print(df.head(2).to_string())
    cod_pad = _codigo_cvm_pad(codigo_cvm)
    vale = df[(df["CD_CVM"].astype(str).str.strip() == cod_pad) |
              (df["CNPJ_CIA"].astype(str).map(_norm_digitos) ==
               _norm_digitos(CNPJ_VALE))].copy()
    if vale.empty:
        return [], 0, 0
    vale["_ano_ref"] = vale["DT_REFER"].astype(str).str[:4]
    vale["_periodo"] = [
        _periodo_itr(r["DT_REFER"]) if tipo == "ITR" else r["DT_REFER"]
        for _, r in vale.iterrows()
    ]
    total_linhas = len(vale)
    docs = []
    for _periodo, g in vale.groupby("_periodo"):
        g = g.sort_values("VERSAO")
        docs.append(_linha_documento(g.iloc[-1], tipo, ano, url_zip))
    docs.sort(key=lambda d: (d["periodo"], d["versao"]))
    return docs, total_linhas, len(docs)


def _codigo_cvm_da_vale():
    """Acha o codigo CVM da Vale no cadastro pelo CNPJ (nunca pelo nome)."""
    tmp = os.path.join(DADOS_BRUTOS, "cad_cia_aberta.csv")
    _baixar(URL_CADASTRO, tmp)
    df = pd.read_csv(tmp, sep=";", encoding="latin-1", dtype=str)
    linha = df[df["CNPJ_CIA"].astype(str).map(_norm_digitos) ==
               _norm_digitos(CNPJ_VALE)]
    if linha.empty:
        raise RuntimeError("Vale nao encontrada no cadastro da CVM")
    codigos = sorted(set(str(c) for c in linha["CD_CVM"].dropna()))
    if len(codigos) != 1:
        raise RuntimeError("codigos CVM divergentes no cadastro: %s" % codigos)
    codigo = int(codigos[0])
    print("Vale no cadastro: CD_CVM=%d (%s)" % (codigo, CNPJ_VALE))
    return codigo


def gravar(payload):
    """Checkpoint: documento vazio NAO sobrescreve arquivo bom."""
    if not payload.get("documentos"):
        raise RuntimeError("documentos vazio — arquivo anterior preservado")
    tmp = SAIDA + ".tmp"
    os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, SAIDA)
    print("gravado %s (%d bytes, %d documentos)" % (
        SAIDA, os.path.getsize(SAIDA), len(payload["documentos"])))


def main():
    codigo = _codigo_cvm_da_vale()
    documentos = []
    falhas = []
    por_tipo = {t: 0 for t in TIPOS}
    versoes_totais = 0
    for tipo in TIPOS:
        for ano in ANOS:
            url = _url_zip(tipo, ano)
            caminho = os.path.join(DADOS_BRUTOS,
                                   "%s_%d.zip" % (tipo.lower(), ano))
            docs = None
            for tentativa in (1, 2):
                try:
                    _baixar(url, caminho)
                    docs, linhas, publicados = _documentos_do_zip(
                        caminho, tipo, ano, codigo, url)
                    break
                except Exception as e:
                    # Tenta UMA vez do zero: download truncado de rodada
                    # anterior e' a causa medida (ver `_baixar`). Se falhar de
                    # novo, registra e segue — o contrato da tarefa e' "se um
                    # ano falhar, registre e siga".
                    print("  !! falhou (%s %d): %s" % (tipo, ano, e))
                    if os.path.exists(caminho):
                        os.remove(caminho)
                    if tentativa == 2:
                        falhas.append("%s %d: %s" % (tipo, ano, e))
            if docs is None:
                time.sleep(PAUSA)
                continue
            versoes_totais += linhas
            por_tipo[tipo] += publicados
            documentos.extend(docs)
            print("  -> Vale: %d linha(s), %d publicado(s)"
                  % (linhas, publicados))
            time.sleep(PAUSA)
    documentos.sort(key=lambda d: (-d["ano"], d["tipo"], d["periodo"]))

    anos = sorted({d["ano"] for d in documentos})
    payload = {
        "fonte": FONTE,
        "url_fonte": "https://dados.cvm.gov.br/dados/CIA_ABERTA/",
        "companhia": COMPANHIA,
        "codigo_cvm": codigo,
        "cnpj": CNPJ_VALE,
        "ultima_atualizacao": datetime.date.today().isoformat(),
        "gerado_em": datetime.date.today().isoformat(),
        "anos_cobertos": "%d..%d" % (min(anos), max(anos)) if anos else None,
        "periodo_anos": ANOS,
        "total_documentos": len(documentos),
        "por_tipo": por_tipo,
        "versoes_totais_na_fonte": versoes_totais,
        "ressalvas": [
            "cada linha do CSV de documento e' uma protocolacao; republicacoes "
            "(VERSAO > 1) entram como versao mais recente do periodo, com "
            "`total_versoes` na soma de linhas da fonte",
            "o periodo do ITR e' o trimestre civil do fim do periodo "
            "(DT_REFER); nao ha' ITR 4T — o ano fecha na DFP",
            "o FRE e' o formulario de referencia anual; a CVM o re-protocola "
            "ao longo do ano seguinte (a Vale protocolou 17 versoes em 2025)",
        ],
        "falhas": falhas,
        "documentos": documentos,
    }
    gravar(payload)
    print("\nRESUMO: %d documentos (%s); linhas de protocolacao na fonte: %d"
          % (len(documentos), por_tipo, versoes_totais))
    if falhas:
        print("FALHAS (%d): %s" % (len(falhas), falhas))
    return 0 if not falhas else 1


if __name__ == "__main__":
    sys.exit(main())
