# -*- coding: utf-8 -*-
"""SIRENEJud — microdados de processos ambientais do Judiciario (CNJ/CNMP).

═══ O QUE E' ESTA FONTE ═══

O SIRENEJud (Painel Interativo Nacional de Dados Ambiental e Interinstitucional,
Res. Conjunta CNJ/CNMP 8/2021) e' o recorte AMBIENTAL e georreferenciado da
Base Nacional de Dados do Poder Judiciario (DataJud, Res. CNJ 331/2020). Mesma
base-mae do Justica em Numeros — que desde 2022 tambem nasce do DataJud —, mas
com granularidade POR PROCESSO e codigo IBGE do municipio, em vez de agregado
anual por tribunal.

Diferenca de regime juridico que importa para este repo: o DataJud e' CONSULTA
AO VIVO e nunca coleta (clausulas 3.8/3.9 do termo de uso vedam derivados —
ver FONTES.md). O SIRENEJud e' o contrario: o CNJ publica o arquivo em massa
para download direto em S3 publico, sem chave e sem termo que vede derivado.
Por isso aqui se coleta, agrega e publica — e o DataJud segue intocado.

═══ ARMADILHAS MEDIDAS ═══

1. **A atualizacao e' irregular.** O arquivo publico estava datado de
   07/07/2025 quando medido em 30/08/2026 (Last-Modified do HEAD). A SPA do
   painel pode estar mais fresca que o download. A data do arquivo viaja no
   JSON e na tela — numero sem essa ressalva mente por omissao.
2. **Datas-sentinela.** `2400-01-01` significa nulo; ha anos de ajuizamento
   absurdos (1904). Contam-se em `anos_anomalos` e NAO entram nas series.
3. **O parquet carrega dado pessoal.** Colunas de partes (polo ativo/passivo)
   e movimentacoes existem no arquivo. Este script NEM LE essas colunas —
   o agregado publicado e' conta e tempo, nunca teor nem nome (regra editorial
   do globo: "conta, nunca teor").
4. **Cobertura parcial do Judiciario.** So' STJ, 27 TJs e TRF1–TRF6. Sem
   Justica do Trabalho, Eleitoral e Militar — coerente com o recorte
   ambiental, mas a tela precisa dizer isso.
5. **Georreferenciamento jovem.** O registro do local do dano so' e'
   obrigatorio desde 2021 (Portaria Conjunta CNJ/CNMP 5/2021); processos
   antigos tendem a nao ter geometria. A camada do globo usa o municipio do
   orgao julgador (cod_ibge), nao o local do dano.

Fonte: https://sirenejud.cnj.jus.br/home
Download: https://prd.s3.cnj.jus.br/sirenejud/vw_sirenejud.parquet (~273 MB)
Medido em 2026-08-30.
"""
import datetime
import json
import os
import sys
import urllib.request

import pandas as pd
import pyarrow.parquet as pq

AQUI = os.path.dirname(os.path.abspath(__file__))
DADOS = os.path.abspath(os.path.join(AQUI, "..", "..", "dados"))
BRUTO = os.path.abspath(os.path.join(AQUI, "..", "..", "dados-brutos",
                                     "sirenejud", "vw_sirenejud.parquet"))
# Espelho publico para o painel de cliente (mesmo padrao do CNIEP:
# etl/betim/dados/presidios -> public/data/estabelecimentos-mg.json)
PUBLIC_DATA = os.path.abspath(os.path.join(
    AQUI, "..", "..", "..", "..", "apps", "web", "public", "data"))
URL_PARQUET = "https://prd.s3.cnj.jus.br/sirenejud/vw_sirenejud.parquet"
UA = "controle-popular/1.0 (+https://github.com/FinweeJur/controle-popular)"
FONTE = ("SIRENEJud — Painel Interativo Nacional de Dados Ambiental e "
         "Interinstitucional (CNJ/CNMP, Res. Conjunta 8/2021)")
COBERTURA = ("STJ, 27 TJs e TRF1–TRF6; sem Justiça do Trabalho, Eleitoral "
             "e Militar")
ANO_MIN = 1990  # abaixo disso e' sujeira medida da fonte (ex.: 1904)
ANO_MAX = datetime.date.today().year  # acima disso tambem (sentinela 2400)


def _norm_nome(s):
    """ASCII-fold para casar o nome do CNJ (sem acento) com a malha do IBGE."""
    import unicodedata
    return "".join(c for c in unicodedata.normalize("NFD", str(s))
                   if unicodedata.category(c) != "Mn").upper().strip()


def casar_codigo_ibge_real(municipios):
    """O `cod_ibge` do parquet NAO e' o codigo IBGE — medido em 30/08/2026:
    Governador Valadares vem 1929, Belo Horizonte 583. E' o codigo interno da
    comarca do orgao julgador. O IBGE real se recupera pelo nome normalizado
    contra a malha municipal do globo (mesma malha do IBGE que as outras
    camadas usam). Em 30/08/2026 casaram 298 de 298. Quem nao casar entra com
    cod_ibge=None e e' reportado — nunca forcado."""
    malha_path = os.path.abspath(os.path.join(
        AQUI, "..", "..", "..", "..", "apps", "web", "public", "terras",
        "globo", "dados", "camadas", "municipios-mg.geojson"))
    with open(malha_path, encoding="utf-8") as f:
        malha = json.load(f)
    por_nome = {}
    for feat in malha["features"]:
        p = feat["properties"]
        por_nome[_norm_nome(p["nome"])] = p["geocodigo"]
    sem_par = []
    for m in municipios:
        chave = _norm_nome(m.get("municipio") or "")
        if chave in por_nome:
            m["cod_ibge"] = por_nome[chave]
        else:
            m["cod_ibge"] = None
            sem_par.append(m.get("municipio"))
    if sem_par:
        print("AVISO: %d comarca(s) sem par na malha do IBGE: %s"
              % (len(sem_par), sem_par))
    return municipios


def head_info(url):
    req = urllib.request.Request(url, method="HEAD",
                                 headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return {"last_modified": r.headers.get("Last-Modified"),
                "content_length": int(r.headers.get("Content-Length", "0"))}


def garantir_download(info):
    """So' baixa se faltar ou se o tamanho divergir do HEAD.

    O download demora (rede medida a ~90 KB/s em 30/08/2026, ~50 min); quem
    baixou por fora (curl -C -) nao perde o trabalho.
    """
    if os.path.exists(BRUTO) and os.path.getsize(BRUTO) == info["content_length"]:
        print("parquet ja completo em disco, pulando download")
        return
    os.makedirs(os.path.dirname(BRUTO), exist_ok=True)
    req = urllib.request.Request(URL_PARQUET, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r, open(BRUTO, "wb") as f:
        while True:
            bloco = r.read(1 << 20)
            if not bloco:
                break
            f.write(bloco)
    if os.path.getsize(BRUTO) != info["content_length"]:
        raise RuntimeError("download incompleto: %d != %d" % (
            os.path.getsize(BRUTO), info["content_length"]))


def colunas_disponiveis():
    return set(pq.read_schema(BRUTO).names)


def escolher_colunas(schema):
    """Mapeia o que existe de fato no arquivo para o contrato do agregado."""
    mapa = {}
    for alvo, candidatos in {
        "ano": ["ano"],
        "uf": ["uf"],
        "cod_ibge": ["cod_ibge", "codigo_municipio_ibge", "cod_ibge_municipio"],
        "municipio": ["municipio", "nome_municipio"],
        "tribunal": ["tribunal", "sigla_tribunal"],
        "grau": ["grau"],
        "classe": ["classe", "nome_classe", "classe_processual"],
        "assuntos": ["noassuntos", "co_assunto_array", "assuntos"],
        "tempo": ["tempo_tramitacao", "tempo_tramitacao_dias"],
        "st_pendente": ["st_pendente"],
        "st_baixado": ["st_baixado"],
        "dt_ajuizamento": ["data_ajuizamento", "dt_ajuizamento"],
    }.items():
        for c in candidatos:
            if c in schema:
                mapa[alvo] = c
                break
    faltando = {"ano", "uf", "cod_ibge", "tribunal", "classe"} - set(mapa)
    if "ano" not in mapa and "dt_ajuizamento" in mapa:
        faltando.discard("ano")
    if faltando:
        raise RuntimeError("colunas esperadas ausentes no parquet: %s; "
                           "schema tem: %s" % (sorted(faltando),
                                               sorted(schema)))
    return mapa


def serie_booleana(s):
    """st_* chega como bool, 0/1 ou 'S'/'N' dependendo da geracao do arquivo."""
    if s.dtype == bool:
        return s
    return s.astype(str).str.upper().isin(["1", "S", "TRUE", "T", "SIM"])


def carregar():
    schema = colunas_disponiveis()
    mapa = escolher_colunas(schema)
    cols = sorted(set(mapa.values()))
    df = pd.read_parquet(BRUTO, columns=cols)
    ren = {v: k for k, v in mapa.items()}
    df = df.rename(columns=ren)
    if "ano" not in df.columns:
        df["ano"] = pd.to_datetime(df["dt_ajuizamento"],
                                   errors="coerce").dt.year
    df["ano"] = pd.to_numeric(df["ano"], errors="coerce")
    # O `cod_ibge` da fonte e' o codigo da comarca do orgao julgador, NAO o
    # IBGE (medido: BH=583, Governador Valadares=1929) — renomeado para nao
    # mentir no agregado. O IBGE real entra depois, por casamento de nome.
    df = df.rename(columns={"cod_ibge": "cod_comarca_cnj"})
    df["cod_comarca_cnj"] = df["cod_comarca_cnj"].astype(str).str.replace(
        r"\.0$", "", regex=True)
    if "tempo" in df.columns:
        df["tempo"] = pd.to_numeric(df["tempo"], errors="coerce")
    else:
        df["tempo"] = None
    for c in ("st_pendente", "st_baixado"):
        df[c] = serie_booleana(df[c]) if c in df.columns else False
    if "assuntos" not in df.columns:
        df["assuntos"] = ""
    if "municipio" not in df.columns:
        df["municipio"] = None
    return df


def top_n(df, coluna, n=10):
    s = df[coluna].fillna("").astype(str)
    # noassuntos chega como literal de array do Postgres: '{A,B}'. So' esse
    # formato explode por virgula; valor simples fica intacto (nome de classe
    # nao tem virgula, mas a regra vale pelo formato, nao pela excecao).
    # Assunto vazio conta como lacuna, nao some.
    eh_array = s.str.startswith("{")
    explodidos = []
    if eh_array.any():
        explodidos.append(s[eh_array].str.strip("{}").str.split(","))
    if (~eh_array).any():
        explodidos.append(s[~eh_array])
    todos = pd.concat(explodidos).explode().str.strip("'\" ")
    todos = todos[todos != ""]
    return [[k, int(v)] for k, v in
            todos.value_counts().head(n).items()]


def agregar_municipio(g):
    ano_ok = g[(g["ano"] >= ANO_MIN) & (g["ano"] <= ANO_MAX)]
    nomes = g["municipio"].dropna().astype(str)
    nomes = nomes[nomes.str.strip() != ""]
    return {
        "cod_comarca_cnj": g["cod_comarca_cnj"].iloc[0],
        "cod_ibge": None,  # preenchido por casar_codigo_ibge_real()
        # nome vem da fonte (grafia do CNJ, sem acento); o casamento com
        # outras bases e' SEMPRE por cod_ibge, nunca por este nome
        "municipio": nomes.iloc[0] if len(nomes) else None,
        "total": int(len(g)),
        "pendentes": int(g["st_pendente"].sum()),
        "baixados": int(g["st_baixado"].sum()),
        "tempo_medio_dias": (round(float(g["tempo"].mean()), 1)
                             if g["tempo"].notna().any() else None),
        "por_ano": {str(int(a)): int(n) for a, n in
                    ano_ok.groupby("ano").size().sort_index().items()},
        "por_tribunal": {str(t): int(n) for t, n in
                         g.groupby("tribunal").size()
                          .sort_values(ascending=False).items()},
        "top_classes": top_n(g, "classe", 5),
    }


def meta(info, extras):
    m = {
        "fonte": FONTE,
        "url_fonte": "https://sirenejud.cnj.jus.br/home",
        "arquivo_origem": URL_PARQUET,
        "arquivo_modificado_em": info["last_modified"],
        "gerado_em": datetime.date.today().isoformat(),
        "cobertura": COBERTURA,
        "ressalvas": [
            "arquivo em massa datado de %s — a atualização do CNJ é irregular"
            % info["last_modified"],
            "registro do local do dano só é obrigatório desde 2021; processos "
            "antigos tendem a não ter geolocalização",
            "qualidade dos metadados depende do tribunal de origem",
            "agregado de contagens: a fonte traz nomes de partes, que este "
            "portal descarta na coleta",
            "o campo `cod_ibge` da fonte não é o código IBGE — é o código da "
            "comarca do órgão julgador; o código IBGE real foi casado por "
            "nome normalizado contra a malha do IBGE",
        ],
    }
    m.update(extras)
    return m


def gravar(nome, payload):
    """Checkpoint: agregado vazio NAO sobrescreve arquivo bom."""
    caminho = os.path.join(DADOS, nome)
    if not payload.get("total_processos_br"):
        raise RuntimeError("agregado vazio — arquivo anterior preservado")
    tmp = caminho + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, caminho)
    print("gravado %s (%d bytes)" % (caminho, os.path.getsize(caminho)))


def main():
    info = head_info(URL_PARQUET)
    print("HEAD: %s, %d bytes" % (info["last_modified"],
                                  info["content_length"]))
    garantir_download(info)
    df = carregar()
    total_br = int(len(df))
    print("processos lidos: %d" % total_br)

    anomalos = int((df["ano"].notna() &
                    ((df["ano"] < ANO_MIN) | (df["ano"] > ANO_MAX))).sum())

    mg = df[df["uf"].astype(str).str.upper() == "MG"].copy()
    municipios = [agregar_municipio(g)
                  for _, g in mg.groupby("cod_comarca_cnj")]
    municipios = casar_codigo_ibge_real(municipios)
    municipios.sort(key=lambda m: -m["total"])

    gravar("sirenejud-mg.json", payload_mg := meta(info, {
        "total_processos_br": total_br,
        "total_processos_mg": int(len(mg)),
        "anos_anomalos": anomalos,
        "municipios_com_processos": len(municipios),
        "serie_anual_mg": {str(int(a)): int(n) for a, n in
                           mg[(mg["ano"] >= ANO_MIN) &
                              (mg["ano"] <= ANO_MAX)].groupby("ano").size()
                           .sort_index().items()},
        "por_tribunal_mg": {str(t): int(n) for t, n in
                            mg.groupby("tribunal").size()
                            .sort_values(ascending=False).items()},
        "top_classes_mg": top_n(mg, "classe", 10),
        "top_assuntos_mg": top_n(mg, "assuntos", 10),
        "municipios": municipios,
    }))
    # Espelho para o painel de cliente (fetch de /data/sirenejud-mg.json)
    if os.path.isdir(PUBLIC_DATA):
        with open(os.path.join(PUBLIC_DATA, "sirenejud-mg.json"), "w",
                  encoding="utf-8") as f:
            json.dump(payload_mg, f, ensure_ascii=False, separators=(",", ":"))

    por_uf = [{"uf": str(u), "total": int(len(g)),
               "pendentes": int(g["st_pendente"].sum()),
               "baixados": int(g["st_baixado"].sum())}
              for u, g in df.groupby(df["uf"].astype(str).str.upper())]
    por_uf.sort(key=lambda x: -x["total"])
    por_trib = [{"tribunal": str(t), "total": int(len(g)),
                 "ufs": sorted(set(g["uf"].astype(str).str.upper())),
                 "pendentes": int(g["st_pendente"].sum())}
                for t, g in df.groupby("tribunal")]
    por_trib.sort(key=lambda x: -x["total"])

    gravar("sirenejud-brasil.json", meta(info, {
        "total_processos_br": total_br,
        "anos_anomalos": anomalos,
        "serie_anual_br": {str(int(a)): int(n) for a, n in
                           df[(df["ano"] >= ANO_MIN) &
                              (df["ano"] <= ANO_MAX)].groupby("ano").size()
                           .sort_index().items()},
        "por_uf": por_uf,
        "por_tribunal": por_trib,
        "top_classes_br": top_n(df, "classe", 10),
        "top_assuntos_br": top_n(df, "assuntos", 10),
    }))


if __name__ == "__main__":
    sys.exit(main())
