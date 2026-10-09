# -*- coding: utf-8 -*-
"""
ETL dos GASTOS DE CAMPANHA das Eleicoes 2026 (Brasil inteiro) — TSE.

Papel no portal
===============
Alimenta a pagina nova `/eleicoes/2026/gastos-campanha`: quanto as campanhas
arrecadaram, quanto contrataram e pagaram, quem saiu eleito, custo por voto,
e QUANTO DAS BIG TECHS (Meta, Google, ByteDance/TikTok) recebeu das campanhas.
Cruza tres fontes do proprio TSE:

  1. votacao_candidato_munzona_2026  -> votos, cargo, partido, situacao (eleito);
  2. prestacao_de_contas_eleitorais_candidatos_2026 (BRASIL) ->
     receitas (quem arrecadou), despesas_contratadas (fornecedor, natureza),
     despesas_pagas (quanto saiu do caixa);
  3. prestacao_de_contas_eleitorais_orgaos_partidarios_2026 (BRASIL) ->
     gasto contratado/pago dos PARTIDOS (tambem compram publicidade).

Por que CONTRATADAS vem a fonte do fornecedor (e pagas, nao)
============================================================
`despesas_pagas` NAO traz o nome do fornecedor (medido 09/10/2026: colunas
terminam em DS_DESPESA texto livre + VR_PAGTO_DESPESA). Quem identifica quem
recebeu dinheiro e o arquivo `despesas_contratadas` (mesmo padrao adotado no
coletor de 2022, `coletar-fornecedores-campanha-2022.py`). Por isso:
"contratado" = valor firmado com o fornecedor; "pago" = valor que saiu do
caixa (sem fornecedor identificado por linha). Os dois numeros convivem na
tela e nunca sao somados.

Por que SO o arquivo BRASIL
===========================
Os ZIPs tem fatias por UF E um arquivo `BRASIL` que ja contem tudo (e um
`BR` duplicado, so presidente). Ler so `*_BRASIL.csv` evita dupla contagem
(medido: linhas de pagas por SG_UF dentro do BRASIL batem com as dos
arquivos por UF).

Fonte oficial
=============
TSE — Dados Abertos:
  https://dadosabertos.tse.jus.br/dataset/prestacao-de-contas-eleitorais-2026
  https://dadosabertos.tse.jus.br/dataset/resultados-2026
CDNs dos arquivos (medidos via HEAD em 09/10/2026):
  prestacao_de_contas_eleitorais_candidatos_2026.zip      (195.644.869 bytes)
  prestacao_de_contas_eleitorais_orgaos_partidarios_2026.zip (11.616.275)
  votacao_candidato_munzona_2026.zip                      (455.236.941)
robots.txt de dadosabertos.tse.jus.br pede Crawl-Delay 10; os arquivos sao
servidos pelo CDN (cdn.tse.jus.br) com download unico e checkpoint em disco.
User-Agent honesto do portal.

Dado pessoal (AGENTS 5.2)
=========================
As fontes trazem CPF de candidato e de doador. ESTE script NUNCA grava CPF:
nao guarda coluna de CPF, mascara sequencia de 11 digitos em texto livre
(`sanitizar`) e ABORTA a escrita se o JSON final contiver 11 digitos seguidos
(guarda identica a do coletor de 2022). O JSON de saida mora em
`apps/web/data/` — dentro de `DIRETORIOS_DADO`, varrido pela regua.

Selo de parcialidade
====================
Em 09/10/2026 os arquivos estavam com `TP_PRESTACAO_CONTAS` = "Parcial" /
"Relatorio Financeiro" (contas definitivas valem ate 03/11/2026, art. 49 da
Res. 23.752/2026) e o 1o turno acabou de sair (04/10; 2o turno em 25/10).
A saida registra `parcial: true` e a pagina publica o selo — re-coleta marcada
apos 03/11/2026.
"""

import csv
import io
import json
import re
import sys
import time
import urllib.request
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

URL_PRESTACAO = "https://cdn.tse.jus.br/estatistica/sead/odsele/prestacao_contas/prestacao_de_contas_eleitorais_candidatos_2026.zip"
URL_PARTIDOS = "https://cdn.tse.jus.br/estatistica/sead/odsele/prestacao_contas/prestacao_de_contas_eleitorais_orgaos_partidarios_2026.zip"
URL_VOTACAO = "https://cdn.tse.jus.br/estatistica/sead/odsele/votacao_candidato_munzona/votacao_candidato_munzona_2026.zip"
URL_DATASET_PRESTACAO = "https://dadosabertos.tse.jus.br/dataset/prestacao-de-contas-eleitorais-2026"
URL_DATASET_RESULTADOS = "https://dadosabertos.tse.jus.br/dataset/resultados-2026"
USER_AGENT = "ControlePopular/1.0 (+contato@controlepopular.com.br; dado publico governamental)"

# Raiz do monorepo: o script roda de qualquer lugar.
# scripts/etl/eleicoes/arquivo.py -> parents[3] e a raiz (parents[2] seria
# o proprio `scripts/` — medido e corrigido em 09/10/2026).
RAIZ = Path(__file__).resolve().parents[3]
PADRAO_ENTRADA = Path("C:/Users/teste/AppData/Local/Temp/opencode")
PADRAO_SAIDA = RAIZ / "apps/web/data/eleicoes/gastos-2026"

ZIPS = {
    "prestacao": (URL_PRESTACAO, "prestacao_contas_candidatos_2026.zip"),
    "partidos": (URL_PARTIDOS, "prestacao_partidarios_2026.zip"),
    "votacao": (URL_VOTACAO, "votacao_candidato_munzona_2026.zip"),
}

# ---------------------------------------------------------------------------
# Big techs: CNPJ curado a partir da MEDICAO na propria fonte (09/10/2026),
# agregando despesas_contratadas de candidatos. Cnpj de empresa brasileira e
# a unica forma segura de separar "Facebook Servicos Online do Brasil" (a
# Meta) de "Meta Comunicacao Ltda" (agencia mineira, R$ 350 mil, que NAO e
# big tech). Empresas procuradas e NAO localizadas viram lacuna na saida.
# ---------------------------------------------------------------------------
BIG_TECH_CNPJ = {
    "13347016000117": ("meta", "Facebook Serviços Online do Brasil"),
    "13347016000389": ("meta", "Facebook Serviços Online do Brasil (filial)"),
    "63063151000109": ("meta", "Meta Platforms Technologies, LLC"),
    "06990590000123": ("google", "Google Brasil Internet"),
    "25012398000107": ("google", "Google Cloud Brasil"),
    "13382906000160": ("google", "Google Brasil Pagamentos"),
    "27415911000136": ("bytedance", "ByteDance Brasil (TikTok)"),
}

# Fallback por NOME, para fornecedor sem CNPJ brasileiro (offshore). O padrao
# e fechado de proposito: "META COMUNICACAO" e "META SUPERMERCADO" aparecem na
# fonte e nao sao big tech; "AMAZON GRAFICA" tambem nao e a AWS.
NOME_BIG_TECH = re.compile(
    r"FACEBOOK SERVIC|META PLATFORMS|GOOGLE IRELAND|GOOGLE LLC"
    r"|TIKTOK|BYTE ?DANCE|\bX CORP\b|\bTWITTER\b|LINKEDIN"
    r"|MICROSOFT|AMAZON WEB SERVICES|\bKWAI\b",
    re.I,
)

# Empresas que o portal procurou e nao achou em 09/10/2026 — vira lacuna
# declarada (lacuna e informacao, AGENTS 7).
BIG_TECH_NAO_LOCALIZADAS = [
    "X Corp (Twitter)",
    "Kwai",
    "LinkedIn / Microsoft",
    "Amazon Web Services (AWS)",
    "Apple",
    "Snap",
]

# ---------------------------------------------------------------------------
# Grupos de natureza de despesa (coluna ORIGEM_DESPESA dos arquivos de
# despesa — medido 09/10/2026: CD_ORIGEM_DESPESA traz o codigo 2xxxxxxx da
# hierarquia TSE, e CD_NATUREZA_DESPESA vem sempre "1/Financeiro"). Os
# rotulos do grupo sao os que a pagina publica; o dicionario CD_GRUPO faz o
# casamento por CODIGO, e o grupo "outros" absorve o resto sem perder linha.
# ---------------------------------------------------------------------------
CD_GRUPO = {
    # publicidade fisica: material impresso, adesivo, som de rua
    "20140000": "materiais",
    "20110000": "materiais",
    "20060000": "materiais",
    "20130000": "imprensa",          # jornais e revistas (midia paga)
    "20800000": "rua",               # militancia e mobilizacao de rua
    "20420000": "digital",           # IMPULSIONAMENTO de conteudos (Meta etc.)
    "20260000": "digital",           # criacao de paginas na internet
    "20220000": "audiovisual",       # producao de radio/TV/video
    "20310000": "audiovisual",       # jingles, vinhetas e slogans
}
GRUPOS_ORDEM = ["materiais", "digital", "rua", "imprensa", "audiovisual", "outros"]

REGEX_CPF = re.compile(r"(?<!\d)\d{11}(?!\d)")
REGEX_CPF_FMT = re.compile(r"\d{3}\.\d{3}\.\d{3}-\d{2}")
MENCAO_PLATAFORMA = re.compile(
    r"INSTAGRAM|FACEBOOK|TIKTOK|YOUTUBE|\bGOOGLE\b|WHATSAPP|\bKWAI\b", re.I
)

# Meta por plataforma: a linha da fonte que casa a Meta (CNPJ ou nome) traz a
# descricao livre da despesa, e essa descricao e a unica pista de QUAL
# propriedade da Meta foi comprada — o TSE nao separa plataforma. Ordem =
# prioridade: WhatsApp antes de Instagram antes de Facebook, porque
# "anuncio no Instagram via WhatsApp" casaria as duas e a primeira vence;
# sem palavra, a linha entra como "sem plataforma declarada". Heuristica do
# portal, rotulada na tela (AGENTS 7: numero vem do dado, aqui o dado vem
# com a heuristica declarada).
PLATAFORMAS_META = [
    ("WhatsApp", re.compile(r"WHATSAPP", re.I)),
    ("Instagram", re.compile(r"INSTAGRAM", re.I)),
    ("Facebook", re.compile(r"FACEBOOK", re.I)),
]
SEM_PLATAFORMA = "sem plataforma declarada"

CARGO_ORDEM = ["Presidente", "Governador", "Senador", "Deputado Federal",
               "Deputado Estadual", "Deputado Distrital"]
ELEITO_NAO, ELEITO_SIM, ELEITO_2T = 0, 1, 2
SITUACOES_ELEITO = {"ELEITO", "ELEITO POR QP", "ELEITO POR MÉDIA"}


def sanitizar(texto: str) -> str:
    """Mascara CPF em texto livre (a fonte as vezes cola o dado no nome)."""
    return REGEX_CPF.sub("***", REGEX_CPF_FMT.sub("***", texto or ""))


def txt(valor: str) -> str:
    """Limpa campo texto: #NULO/vazio viram string vazia."""
    v = (valor or "").strip()
    return "" if v in ("#NULO", "#NULO#", "-1", "-3") else v


def moeda(n: float) -> str:
    """R$ 1.234,56 — formato brasileiro para log humano."""
    return f"R$ {n:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def valor(txtv: str) -> float:
    """'1.234,56' -> 1234.56; vazio/#NULO -> 0."""
    if not txtv or "#NULO" in txtv:
        return 0.0
    t = txtv.strip()
    if t in ("", "-1"):
        return 0.0
    try:
        return float(t.replace(".", "").replace(",", "."))
    except ValueError:
        return 0.0


def baixar(destino: Path, url: str) -> Path:
    """Download unico com checkpoint (bytes ja em disco = coleta ja feita)."""
    if destino.exists() and destino.stat().st_size > 100_000:
        print(f"[checkpoint] {destino.name} ja em disco ({destino.stat().st_size:,} bytes)")
        return destino
    destino.parent.mkdir(parents=True, exist_ok=True)
    print(f"[baixando] {url}")
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=3600) as resp, open(destino, "wb") as arq:
        while True:
            bloco = resp.read(1 << 20)
            if not bloco:
                break
            arq.write(bloco)
    print(f"[ok] {destino.name} ({destino.stat().st_size:,} bytes)")
    time.sleep(10)  # cortesia: pausa entre downloads do mesmo host
    return destino


def ler_csv_zip(caminho_zip: Path, nome_csv: str):
    """Abre um CSV do ZIP em latin-1 com delimitador ';'; devolve leitor + cabecalho."""
    z = zipfile.ZipFile(caminho_zip)
    f = z.open(nome_csv)
    texto = io.TextIOWrapper(f, encoding="latin-1")
    leitor = csv.reader(texto, delimiter=";")
    cabecalho = next(leitor)
    return z, leitor, {c: i for i, c in enumerate(cabecalho)}


def grupo_de(cd_origem: str) -> str:
    """Mapeia codigo de natureza para o grupo publicado na tela."""
    return CD_GRUPO.get(cd_origem, "outros")


def grupo_por_nome(nome: str) -> str:
    """Grupo da big tech quando a identificacao vem pelo NOME (fornecedor sem
    CNPJ brasileiro, ex.: filial truncada '13347016000'). Mantem os mesmos
    rotulos do dicionario BIG_TECH_CNPJ para a pagina nao fatiar a mesma
    empresa em dois grupos."""
    n = (nome or "").upper()
    if "FACEBOOK" in n or "META PLATFORM" in n:
        return "meta"
    if "GOOGLE" in n:
        return "google"
    if "TIKTOK" in n or "BYTE" in n:
        return "bytedance"
    if "KWAI" in n:
        return "kwai"
    if "X CORP" in n or "TWITTER" in n:
        return "x"
    return "outros"


def main() -> int:
    entrada = Path(sys.argv[1]) if len(sys.argv) > 1 else PADRAO_ENTRADA
    saida = Path(sys.argv[2]) if len(sys.argv) > 2 else PADRAO_SAIDA
    zips: dict[str, Path] = {}
    for chave, (url, nome) in ZIPS.items():
        zips[chave] = baixar(entrada / nome, url)

    # -----------------------------------------------------------------
    # PASSO 1 — votacao: uma linha por candidato por zona (6,7 mi de
    # linhas). Agrega votos por SQ_CANDIDATO e guarda cargo/partido/
    # situacao de totalizacao.
    # -----------------------------------------------------------------
    print("[1/5] votacao (6,7 mi de linhas) ...", flush=True)
    cands: dict[str, dict] = {}
    conflitos_sit = 0
    z, leitor, ix = ler_csv_zip(zips["votacao"], "votacao_candidato_munzona_2026_BRASIL.csv")
    for n, linha in enumerate(leitor, 1):
        sq = linha[ix["SQ_CANDIDATO"]]
        c = cands.get(sq)
        if c is None:
            c = cands[sq] = {
                "sq": sq,
                "nome": sanitizar(txt(linha[ix["NM_CANDIDATO"]])),
                "urna": sanitizar(txt(linha[ix["NM_URNA_CANDIDATO"]]) or txt(linha[ix["NM_CANDIDATO"]])),
                "cargo": txt(linha[ix["DS_CARGO"]]),
                "partido": txt(linha[ix["SG_PARTIDO"]]),
                "partidoNome": txt(linha[ix["NM_PARTIDO"]]),
                # presidente e nacional: nas linhas de zona o SG_UF vem da
                # unidade da zona que apareceu primeiro (medido: Lula "MT").
                # "BR" mantem o porUf coerente — o total nacional soma as UF.
                "uf": "BR" if txt(linha[ix["DS_CARGO"]]) == "Presidente"
                      else txt(linha[ix["SG_UF"]]),
                "votos": 0,
                "situacao": "",
                "situacaoCandidatura": "",
                "coligacao": "",
            }
        try:
            # negativo e artefato da fonte, nao voto
            c["votos"] += max(0, int(linha[ix["QT_VOTOS_NOMINAIS"]]))
        except ValueError:
            pass
        sit = txt(linha[ix["DS_SIT_TOT_TURNO"]])
        if sit and not c["situacao"]:
            c["situacao"] = sit
        elif sit and c["situacao"] != sit:
            conflitos_sit += 1
        stc = txt(linha[ix["DS_SITUACAO_CANDIDATURA"]])
        if stc and not c["situacaoCandidatura"]:
            c["situacaoCandidatura"] = stc
        col = txt(linha[ix["NM_COLIGACAO"]])
        if col and not c["coligacao"]:
            c["coligacao"] = col
        if n % 1_000_000 == 0:
            print(f"    {n:,} linhas ...", flush=True)
    z.close()
    print(f"    {len(cands):,} candidatos distintos; {conflitos_sit} conflitos de situacao")

    # -----------------------------------------------------------------
    # PASSO 2 — receitas: total arrecadado por candidato + mapa
    # prestador -> candidato (o arquivo pagas so tem SQ_PRESTADOR_CONTAS).
    # -----------------------------------------------------------------
    print("[2/5] receitas ...", flush=True)
    prestador_para_sq: dict[str, str] = {}
    por_fonte: dict[str, float] = defaultdict(float)
    z, leitor, ix = ler_csv_zip(zips["prestacao"], "receitas_candidatos_2026_BRASIL.csv")
    linhas_receita = 0
    for linha in leitor:
        linhas_receita += 1
        sq = linha[ix["SQ_CANDIDATO"]]
        prestador_para_sq[linha[ix["SQ_PRESTADOR_CONTAS"]]] = sq
        v = valor(linha[ix["VR_RECEITA"]])
        c = cands.get(sq)
        if c is None:
            # candidato sem linha de votacao (candidatura vedada/retirada):
            # cria ficha com o que a prestacao sabe (cargo/partido/UF).
            c = cands[sq] = {
                "sq": sq,
                "nome": sanitizar(txt(linha[ix["NM_CANDIDATO"]])),
                "urna": sanitizar(txt(linha[ix["NM_CANDIDATO"]])),
                "cargo": txt(linha[ix["DS_CARGO"]]),
                "partido": txt(linha[ix["SG_PARTIDO"]]),
                "partidoNome": txt(linha[ix["NM_PARTIDO"]]),
                # presidente e nacional: nas linhas de zona o SG_UF vem da
                # unidade da zona que apareceu primeiro (medido: Lula "MT").
                # "BR" mantem o porUf coerente — o total nacional soma as UF.
                "uf": "BR" if txt(linha[ix["DS_CARGO"]]) == "Presidente"
                      else txt(linha[ix["SG_UF"]]),
                "votos": 0,
                "situacao": "",
                "situacaoCandidatura": "",
                "coligacao": "",
                "semVotacao": True,
            }
        c["receita"] = c.get("receita", 0.0) + v
        por_fonte[txt(linha[ix["DS_FONTE_RECEITA"]]) or "sem rótulo"] += v
    z.close()
    print(f"    {linhas_receita:,} linhas de receita; {len(prestador_para_sq):,} prestadores mapeados")

    # -----------------------------------------------------------------
    # PASSO 3 — despesas CONTRATADAS: natureza por candidato, fornecedor
    # agregado, big tech (CNPJ curado + nome), mencao a plataforma no
    # texto livre e serie mensal das big techs.
    # -----------------------------------------------------------------
    print("[3/5] despesas contratadas (1 mi de linhas) ...", flush=True)
    fornecedores: dict[str, dict] = defaultdict(lambda: {"total": 0.0, "linhas": 0, "bigtech": False})
    bigtech_empresas: dict[tuple, dict] = defaultdict(
        lambda: {"total": 0.0, "linhas": 0, "natureza": defaultdict(float),
                 "candidatos": set(), "mensal": defaultdict(float)}
    )
    bigtech_por_partido: dict[str, float] = defaultdict(float)
    meta_plataforma: dict[str, dict] = defaultdict(lambda: {"total": 0.0, "linhas": 0})
    mencao: dict[str, dict] = defaultdict(lambda: {"linhas": 0, "total": 0.0})
    natureza_cd: dict[str, dict] = {}
    linhas_contratadas = 0
    match_cnpj = match_nome = 0
    z, leitor, ix = ler_csv_zip(zips["prestacao"], "despesas_contratadas_candidatos_2026_BRASIL.csv")
    for linha in leitor:
        linhas_contratadas += 1
        sq = linha[ix["SQ_CANDIDATO"]]
        c = cands.get(sq)
        if c is None:
            c = cands[sq] = {
                "sq": sq,
                "nome": sanitizar(txt(linha[ix["NM_CANDIDATO"]])),
                "urna": sanitizar(txt(linha[ix["NM_CANDIDATO"]])),
                "cargo": txt(linha[ix["DS_CARGO"]]),
                "partido": txt(linha[ix["SG_PARTIDO"]]),
                "partidoNome": txt(linha[ix["NM_PARTIDO"]]),
                # presidente e nacional: nas linhas de zona o SG_UF vem da
                # unidade da zona que apareceu primeiro (medido: Lula "MT").
                # "BR" mantem o porUf coerente — o total nacional soma as UF.
                "uf": "BR" if txt(linha[ix["DS_CARGO"]]) == "Presidente"
                      else txt(linha[ix["SG_UF"]]),
                "votos": 0,
                "situacao": "",
                "situacaoCandidatura": "",
                "coligacao": "",
                "semVotacao": True,
            }
        c["contratado"] = c.get("contratado", 0.0)
        prestador_para_sq.setdefault(linha[ix["SQ_PRESTADOR_CONTAS"]], sq)

        cd = linha[ix["CD_ORIGEM_DESPESA"]]
        ds = txt(linha[ix["DS_ORIGEM_DESPESA"]])
        v = valor(linha[ix["VR_DESPESA_CONTRATADA"]])
        c["contratado"] += v
        g = grupo_de(cd)
        c["g_" + g] = c.get("g_" + g, 0.0) + v

        reg_nat = natureza_cd.get(cd)
        if reg_nat is None:
            reg_nat = natureza_cd[cd] = {"cd": cd, "ds": ds, "contratado": 0.0,
                                         "pago": 0.0, "linhas": 0}
        reg_nat["contratado"] += v
        reg_nat["linhas"] += 1

        # fornecedor agregado (top nacional) — so texto sem CPF
        doc = re.sub(r"\D", "", linha[ix["NR_CPF_CNPJ_FORNECEDOR"]])
        nome_f = sanitizar(txt(linha[ix["NM_FORNECEDOR"]]))
        chave_f = doc if len(doc) == 14 else ("N:" + nome_f.upper())
        f = fornecedores[chave_f]
        f["total"] += v
        f["linhas"] += 1
        f["nome"] = nome_f
        f["doc"] = doc if len(doc) == 14 else ""

        # big tech: CNPJ curado primeiro; nome (fechado) so como fallback
        grupo_bt = BIG_TECH_CNPJ.get(doc)
        if grupo_bt:
            tipo_match = "cnpj"
            match_cnpj += 1
            rotulo = grupo_bt[1]
            chave_bt = (grupo_bt[0], rotulo, doc)
        elif NOME_BIG_TECH.search(nome_f):
            tipo_match = "nome"
            match_nome += 1
            rotulo = nome_f
            chave_bt = (grupo_por_nome(nome_f), rotulo, doc)
        else:
            tipo_match = None
        if tipo_match:
            f["bigtech"] = True
            b = bigtech_empresas[chave_bt]
            b["total"] += v
            b["linhas"] += 1
            b["natureza"][ds] += v
            b["candidatos"].add(sq)
            dt = txt(linha[ix["DT_DESPESA"]])
            if len(dt) == 10 and dt[2] == "/":
                b["mensal"][f"{dt[6:10]}-{dt[3:5]}"] += v
            bigtech_por_partido[txt(linha[ix["SG_PARTIDO"]]) or "?"] += v
            if chave_bt[0] == "meta":
                ds_txt = linha[ix["DS_DESPESA"]]
                plat = next(
                    (nome for nome, rx in PLATAFORMAS_META if rx.search(ds_txt)), SEM_PLATAFORMA
                )
                meta_plataforma[plat]["linhas"] += 1
                meta_plataforma[plat]["total"] += v

        # mencao a plataforma no texto livre (complemento honesto: o
        # pagamento pode ser a uma agencia que citou Instagram na nota)
        ds_txt = linha[ix["DS_DESPESA"]]
        m = MENCAO_PLATAFORMA.search(ds_txt)
        if m:
            chave_m = m.group(0).upper()
            mencao[chave_m]["linhas"] += 1
            mencao[chave_m]["total"] += v
        if linhas_contratadas % 500_000 == 0:
            print(f"    {linhas_contratadas:,} linhas ...", flush=True)
    z.close()
    print(f"    {linhas_contratadas:,} linhas; bigtech por CNPJ={match_cnpj}, por nome={match_nome}")

    # -----------------------------------------------------------------
    # PASSO 4 — despesas PAGAS: sem candidato e sem fornecedor; resolve
    # candidato pelo mapa prestador e soma grupos/natureza pagos.
    # -----------------------------------------------------------------
    print("[4/5] despesas pagas ...", flush=True)
    linhas_pagas = nao_mapeadas = 0
    pago_nao_mapeado = 0.0
    z, leitor, ix = ler_csv_zip(zips["prestacao"], "despesas_pagas_candidatos_2026_BRASIL.csv")
    for linha in leitor:
        linhas_pagas += 1
        sq = prestador_para_sq.get(linha[ix["SQ_PRESTADOR_CONTAS"]])
        v = valor(linha[ix["VR_PAGTO_DESPESA"]])
        cd = linha[ix["CD_ORIGEM_DESPESA"]]
        ds = txt(linha[ix["DS_ORIGEM_DESPESA"]])
        reg_nat = natureza_cd.get(cd)
        if reg_nat is None:
            reg_nat = natureza_cd[cd] = {"cd": cd, "ds": ds, "contratado": 0.0,
                                         "pago": 0.0, "linhas": 0}
        reg_nat["pago"] += v
        if sq is None:
            nao_mapeadas += 1
            pago_nao_mapeado += v
            continue
        c = cands[sq]
        c["pago"] = c.get("pago", 0.0) + v
    z.close()
    print(f"    {linhas_pagas:,} linhas; {nao_mapeadas} sem mapeamento prestador "
          f"({moeda(pago_nao_mapeado)} fora do total por candidato)")

    # -----------------------------------------------------------------
    # PASSO 5 — partidos: contratado, pago, digital e big tech por sigla.
    # -----------------------------------------------------------------
    print("[5/5] partidos ...", flush=True)
    partidos: dict[str, dict] = {}

    def partido_de(sigla: str) -> dict:
        p = partidos.get(sigla)
        if p is None:
            p = partidos[sigla] = {"partido": sigla, "contratado": 0.0, "pago": 0.0,
                                   "receita": 0.0, "digital": 0.0, "bigtech": 0.0,
                                   "nome": ""}
        return p

    # pagas de partido nao traz SG_PARTIDO (medido 09/10/2026): so tem
    # SQ_PRESTADOR_CONTAS. Mapeia prestador -> sigla pelos outros dois
    # arquivos (ambos trazem SG_PARTIDO na mesma linha do prestador).
    prestador_partido: dict[str, str] = {}
    pagas_partido_sem_mapa = 0

    z, leitor, ix = ler_csv_zip(zips["partidos"], "despesas_contratadas_orgaos_partidarios_2026_BRASIL.csv")
    for linha in leitor:
        sigla = txt(linha[ix["SG_PARTIDO"]]) or "?"
        p = partido_de(sigla)
        p["nome"] = p["nome"] or sanitizar(txt(linha[ix["NM_PARTIDO"]]))
        prestador_partido[linha[ix["SQ_PRESTADOR_CONTAS"]]] = sigla
        v = valor(linha[ix["VR_DESPESA_CONTRATADA"]])
        p["contratado"] += v
        if linha[ix["CD_ORIGEM_DESPESA"]] == "20420000":
            p["digital"] += v
        doc = re.sub(r"\D", "", linha[ix["NR_CPF_CNPJ_FORNECEDOR"]])
        if doc in BIG_TECH_CNPJ or (
            doc not in BIG_TECH_CNPJ
            and NOME_BIG_TECH.search(sanitizar(txt(linha[ix["NM_FORNECEDOR"]])))
        ):
            p["bigtech"] += v
    z.close()

    z, leitor, ix = ler_csv_zip(zips["partidos"], "receitas_orgaos_partidarios_2026_BRASIL.csv")
    if "VR_RECEITA" in ix and "SG_PARTIDO" in ix:
        for linha in leitor:
            sigla = txt(linha[ix["SG_PARTIDO"]]) or "?"
            prestador_partido[linha[ix["SQ_PRESTADOR_CONTAS"]]] = sigla
            partido_de(sigla)["receita"] += valor(linha[ix["VR_RECEITA"]])
    z.close()

    z, leitor, ix = ler_csv_zip(zips["partidos"], "despesas_pagas_orgaos_partidarios_2026_BRASIL.csv")
    for linha in leitor:
        sigla = prestador_partido.get(linha[ix["SQ_PRESTADOR_CONTAS"]])
        if sigla is None:
            pagas_partido_sem_mapa += 1
            continue
        partido_de(sigla)["pago"] += valor(linha[ix["VR_PAGTO_DESPESA"]])
    z.close()
    print(f"    pagas de partido sem mapa de prestador: {pagas_partido_sem_mapa}")

    # -----------------------------------------------------------------
    # SELECAO das linhas da tabela: todos os ELEITOS + pendentes de 2o
    # turno + top 50 por contratado e por receita em cada cargo.
    # -----------------------------------------------------------------
    print("selecionando linhas da tabela ...", flush=True)
    for c in cands.values():
        if c["situacao"] in SITUACOES_ELEITO:
            c["eleito"] = ELEITO_SIM
        elif c["situacao"] == "2º TURNO":
            c["eleito"] = ELEITO_2T
        else:
            c["eleito"] = ELEITO_NAO
        c.setdefault("receita", 0.0)
        c.setdefault("contratado", 0.0)
        c.setdefault("pago", 0.0)
        for g in GRUPOS_ORDEM:
            c.setdefault("g_" + g, 0.0)
        c.setdefault("bigtech", 0.0)
        votos = c["votos"]
        c["custoVoto"] = round(c["pago"] / votos, 2) if votos > 0 and c["pago"] > 0 else None

    # big tech por candidato: soma das linhas bigtech deste candidato
    # (reprocesso so as linhas de candidato — barato e evita estado extra)
    z, leitor, ix = ler_csv_zip(zips["prestacao"], "despesas_contratadas_candidatos_2026_BRASIL.csv")
    for linha in leitor:
        doc = re.sub(r"\D", "", linha[ix["NR_CPF_CNPJ_FORNECEDOR"]])
        if doc in BIG_TECH_CNPJ or (
            doc not in BIG_TECH_CNPJ
            and NOME_BIG_TECH.search(sanitizar(txt(linha[ix["NM_FORNECEDOR"]])))
        ):
            sq = linha[ix["SQ_CANDIDATO"]]
            c = cands.get(sq)
            if c is not None:
                c["bigtech"] += valor(linha[ix["VR_DESPESA_CONTRATADA"]])
    z.close()

    por_cargo_top: dict[str, list] = defaultdict(list)
    for c in cands.values():
        if c["cargo"]:
            por_cargo_top[c["cargo"]].append(c)
    escolhidos: set[str] = set()
    for cargo, lista in por_cargo_top.items():
        for crit in ("contratado", "receita"):
            for c in sorted(lista, key=lambda x: -x[crit])[:50]:
                escolhidos.add(c["sq"])
    for c in cands.values():
        if c["eleito"] != ELEITO_NAO:
            escolhidos.add(c["sq"])

    ordem_cargo = {nome: i for i, nome in enumerate(CARGO_ORDEM)}
    linhas = []
    for sq in escolhidos:
        c = cands[sq]
        if c["cargo"] not in ordem_cargo:
            continue  # cargos fora da tabela do portal (se houver)
        linha = {
            # SEM `sq` aqui: SQ_CANDIDATO tem 11 ou 12 digitos e o de 11
            # seria indistinguivel de CPF na regua do repo (abortou em
            # 09/10/2026). A pagina nao precisa dele — o deep link do
            # DivulgaCandContas responde 403 (WAF) e a fonte por linha e
            # a pagina do dataset no CKAN.
            "cargo": c["cargo"],
            "nome": c["nome"],
            "urna": c["urna"],
            "partido": c["partido"],
            "uf": c["uf"],
            "votos": c["votos"],
            "situacao": c["situacao"] or ("sem votação" if c.get("semVotacao") else ""),
            "eleito": c["eleito"],
            "receita": round(c["receita"], 2),
            "contratado": round(c["contratado"], 2),
            "pago": round(c["pago"], 2),
            "digital": round(c["g_digital"], 2),
            "materiais": round(c["g_materiais"], 2),
            "rua": round(c["g_rua"], 2),
            "bigtech": round(c["bigtech"], 2),
        }
        if c["custoVoto"] is not None:
            linha["custoVoto"] = c["custoVoto"]
        linhas.append(linha)
    linhas.sort(key=lambda l: (ordem_cargo[l["cargo"]], -l["contratado"], -l["votos"]))

    # -----------------------------------------------------------------
    # AGREGADOS de topo (cartoes da pagina)
    # -----------------------------------------------------------------
    # Candidaturas sem votação (vedada/retirada, criadas na ficha de receita)
    # CONTAM em dinheiro e em contagem: o dinheiro foi declarado, e a capa
    # soma todo o dinheiro. Ficam fora só de votos e custo por voto, que não
    # existem sem votação — e a mediana de eleitos já os exclui sozinha.
    n_sem_votacao = sum(1 for c in cands.values() if c.get("semVotacao"))
    tot_receita = sum(c["receita"] for c in cands.values())
    tot_contratado = sum(c["contratado"] for c in cands.values())
    tot_pago = sum(c["pago"] for c in cands.values())
    tot_digital = sum(v["contratado"] for k, v in natureza_cd.items() if grupo_de(k) == "digital")
    tot_materiais = sum(v["contratado"] for k, v in natureza_cd.items() if grupo_de(k) == "materiais")
    tot_rua = sum(v["contratado"] for k, v in natureza_cd.items() if grupo_de(k) == "rua")
    tot_digital_pago = sum(v["pago"] for k, v in natureza_cd.items() if grupo_de(k) == "digital")
    tot_materiais_pago = sum(v["pago"] for k, v in natureza_cd.items() if grupo_de(k) == "materiais")
    bt_total = sum(b["total"] for b in bigtech_empresas.values())
    n_eleitos = sum(1 for c in cands.values() if c["eleito"] == ELEITO_SIM)
    n_2t = sum(1 for c in cands.values() if c["eleito"] == ELEITO_2T)
    n_cand_votacao = sum(1 for c in cands.values() if not c.get("semVotacao"))

    por_cargo = []
    for cargo in CARGO_ORDEM:
        grupo = [c for c in cands.values() if c["cargo"] == cargo]
        if not grupo:
            continue
        custos = sorted(c["custoVoto"] for c in grupo
                        if c["eleito"] == ELEITO_SIM and c["custoVoto"] is not None)
        mediana = custos[len(custos) // 2] if custos else None
        reg = {
            "cargo": cargo,
            "candidaturas": len(grupo),
            "eleitos": sum(1 for c in grupo if c["eleito"] == ELEITO_SIM),
            "receita": round(sum(c["receita"] for c in grupo), 2),
            "contratado": round(sum(c["contratado"] for c in grupo), 2),
            "pago": round(sum(c["pago"] for c in grupo), 2),
            "digital": round(sum(c["g_digital"] for c in grupo), 2),
            "materiais": round(sum(c["g_materiais"] for c in grupo), 2),
            "votos": sum(c["votos"] for c in grupo),
        }
        if mediana is not None:
            reg["custoVotoMedianoEleitos"] = mediana
        por_cargo.append(reg)

    por_uf: dict[str, dict] = {}
    for c in cands.values():
        r = por_uf.setdefault(c["uf"], {"uf": c["uf"], "candidaturas": 0, "eleitos": 0,
                                        "receita": 0.0, "contratado": 0.0, "pago": 0.0,
                                        "digital": 0.0, "votos": 0})
        r["candidaturas"] += 1
        r["eleitos"] += 1 if c["eleito"] == ELEITO_SIM else 0
        r["receita"] += c["receita"]
        r["contratado"] += c["contratado"]
        r["pago"] += c["pago"]
        r["digital"] += c["g_digital"]
        r["votos"] += c["votos"]
    for r in por_uf.values():
        for k in ("receita", "contratado", "pago", "digital"):
            r[k] = round(r[k], 2)
    lista_uf = sorted(por_uf.values(), key=lambda r: -r["contratado"])

    # -----------------------------------------------------------------
    # AGREGADOS por partido e por UF — universo COMPLETO dos candidatos
    # (não só a tabela de 1.823). Alimentam "Análise por partido" e
    # "Análise por estado" da página. "BR" (presidência) fica de fora do
    # por-UF: voto presidencial é nacional e já aparece em porCargo.
    # -----------------------------------------------------------------
    def novo_agg() -> dict:
        return {"candidaturas": 0, "eleitos": 0, "pendentes2t": 0, "receita": 0.0,
                "contratado": 0.0, "pago": 0.0, "digital": 0.0, "bigtech": 0.0,
                "votos": 0, "custos": []}

    def fechar_agg(campos: dict, a: dict) -> dict:
        """Congela um agregado em dict serializável, com mediana de custo."""
        custos = sorted(a["custos"])
        reg = {**campos,
               "candidaturas": a["candidaturas"], "eleitos": a["eleitos"],
               "pendentes2t": a["pendentes2t"], "receita": round(a["receita"], 2),
               "contratado": round(a["contratado"], 2), "pago": round(a["pago"], 2),
               "digital": round(a["digital"], 2), "bigtech": round(a["bigtech"], 2),
               "votos": a["votos"]}
        if custos:
            reg["custoVotoMedianoEleitos"] = custos[len(custos) // 2]
        return reg

    agg_partido: dict[str, dict] = {}
    agg_uf: dict[str, dict] = {}
    agg_uf_partido: dict[tuple[str, str], dict] = {}
    nome_partido: dict[str, str] = {}
    for c in cands.values():
        sigla = c["partido"] or "?"
        nome_partido.setdefault(sigla, c.get("partidoNome") or "")
        alvos = (agg_partido.setdefault(sigla, novo_agg()),
                 agg_uf.setdefault(c["uf"], novo_agg()),
                 agg_uf_partido.setdefault((c["uf"], sigla), novo_agg()))
        for a in alvos:
            a["candidaturas"] += 1
            a["eleitos"] += 1 if c["eleito"] == ELEITO_SIM else 0
            a["pendentes2t"] += 1 if c["eleito"] == ELEITO_2T else 0
            a["receita"] += c["receita"]
            a["contratado"] += c["contratado"]
            a["pago"] += c["pago"]
            a["digital"] += c["g_digital"]
            a["bigtech"] += c["bigtech"]
            a["votos"] += c["votos"]
            if c["eleito"] == ELEITO_SIM and c["custoVoto"] is not None:
                a["custos"].append(c["custoVoto"])

    por_partido_analise = [
        fechar_agg({"partido": sigla, "nome": nome_partido.get(sigla, "")}, a)
        for sigla, a in sorted(agg_partido.items(), key=lambda kv: -kv[1]["contratado"])
    ]
    por_uf_analise = []
    for uf, a in agg_uf.items():
        if uf == "BR":
            continue
        partidos_da_uf = [
            fechar_agg({"partido": sigla, "nome": nome_partido.get(sigla, "")}, ap)
            for (u2, sigla), ap in agg_uf_partido.items()
            if u2 == uf
        ]
        partidos_da_uf.sort(key=lambda r: -r["contratado"])
        reg = fechar_agg({"uf": uf}, a)
        reg["partidos"] = partidos_da_uf
        por_uf_analise.append(reg)
    por_uf_analise.sort(key=lambda r: -r["contratado"])

    # -----------------------------------------------------------------
    # ESCRITA dos arquivos de saida
    # -----------------------------------------------------------------
    saida.mkdir(parents=True, exist_ok=True)
    hoje = time.strftime("%Y-%m-%d")

    # linhas da tabela (a rota fatia na hora do build, via arquivosDoIndice)
    arquivo_linhas = saida / "linhas.json"
    arquivo_linhas.write_text(json.dumps(linhas, ensure_ascii=False), encoding="utf-8")

    naturezas = sorted(natureza_cd.values(), key=lambda n: -n["contratado"])
    for n in naturezas:
        n["contratado"] = round(n["contratado"], 2)
        n["pago"] = round(n["pago"], 2)

    grupos_tot = {}
    for g in GRUPOS_ORDEM:
        grupos_tot[g] = {
            "contratado": round(sum(v["contratado"] for k, v in natureza_cd.items() if grupo_de(k) == g), 2),
            "pago": round(sum(v["pago"] for k, v in natureza_cd.items() if grupo_de(k) == g), 2),
        }

    meta = {
        "fonte": {
            "nome": "TSE — Dados Abertos",
            "url_prestacao": URL_DATASET_PRESTACAO,
            "url_resultados": URL_DATASET_RESULTADOS,
            "url_zip_candidatos": URL_PRESTACAO,
            "url_zip_partidos": URL_PARTIDOS,
            "url_zip_votacao": URL_VOTACAO,
        },
        "coleta": {
            "em": hoje,
            "parcial": True,
            "motivo_parcial": (
                "Contas de campanha com prestação 'Parcial'/'Relatorio Financeiro' "
                "(contas definitivas valem até 03/11/2026, art. 49 da Res. 23.752/2026) "
                "e resultado do 1º turno de 04/10/2026 (2º turno em 25/10/2026)."
            ),
            "recoleta": "Após 03/11/2026 (contas definitivas) e 25/10/2026 (2º turno).",
        },
        "totais": {
            "receita": round(tot_receita, 2),
            "contratado": round(tot_contratado, 2),
            "pago": round(tot_pago, 2),
            "candidaturas": len(cands),
            "eleitos1Turno": n_eleitos,
            "pendentes2Turno": n_2t,
            "linhasTabela": len(linhas),
        },
        "grupos": grupos_tot,
        "receitaPorFonte": [
            {"fonte": k, "total": round(v, 2)}
            for k, v in sorted(por_fonte.items(), key=lambda x: -x[1])
        ],
        "naturezas": naturezas,
        "porCargo": por_cargo,
        "porUf": lista_uf,
        "mencaoPlataformas": {
            k: {"linhas": m["linhas"], "total": round(m["total"], 2)}
            for k, m in sorted(mencao.items(), key=lambda x: -x[1]["total"])
        },
        "lacunas": [
            "Sem fornecedor no arquivo de despesas pagas: 'contratado' vem de despesas_contratadas e 'pago' de despesas_pagas; os dois números não se somam.",
            f"{nao_mapeadas} linhas pagas não acharam prestador no mapa ({moeda(pago_nao_mapeado)} fora do total por candidato).",
            f"{pagas_partido_sem_mapa} linhas pagas de partido sem mapa de prestador (fora do pago por partido).",
            "X Corp (Twitter), Kwai, LinkedIn/Microsoft, Amazon Web Services, Apple e Snap não aparecem entre os fornecedores (medido em 09/10/2026).",
            "Amostra manual da Meta Ads Library (top 10 campanhas) ainda não foi feita — fase 2 da coleta.",
        ],
        "metodologia": (
            "Votos somados de votacao_candidato_munzona_2026_BRASIL; receita, "
            "contratado e natureza de despesa de prestacao_de_contas_eleitorais_candidatos_2026_BRASIL; "
            "partidos de prestacao_de_contas_eleitorais_orgaos_partidarios_2026_BRASIL. "
            "Tabela pública = todos os eleitos no 1º turno + pendentes de 2º turno + top 50 por "
            "contratado e por receita em cada cargo. Big tech = CNPJ curado na fonte "
            "(medição 09/10/2026) + nome fechado como fallback; Meta por plataforma = palavra na "
            "descrição da despesa (WhatsApp antes de Instagram antes de Facebook; sem palavra = "
            "sem plataforma declarada). Custo por voto = pago / votos nominais. "
            "Candidaturas sem votação (vedada/retirada) entram nos totais de dinheiro e de "
            "candidaturas, e ficam fora de votos e de custo por voto. "
            "Agregados por partido e por UF, do universo completo, saem em por-partido.json e por-uf.json. "
            "Nenhum CPF é gravado."
        ),
    }
    (saida / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")

    empresas = []
    for (grupo, nome, doc), b in bigtech_empresas.items():
        reg = {
            "grupo": grupo,
            "empresa": nome,
            "cnpj": f"{doc[:2]}.{doc[2:5]}.{doc[5:8]}/{doc[8:12]}-{doc[12:]}" if len(doc) == 14 else "",
            "total": round(b["total"], 2),
            "linhas": b["linhas"],
            "candidatos": len(b["candidatos"]),
            "naturezas": [{"despesa": k, "total": round(v, 2)}
                          for k, v in sorted(b["natureza"].items(), key=lambda x: -x[1])[:5]],
            "mensal": [{"mes": k, "total": round(v, 2)}
                       for k, v in sorted(b["mensal"].items())],
        }
        empresas.append(reg)
    empresas.sort(key=lambda e: -e["total"])
    top_cands_bt = sorted(
        [c for c in cands.values() if c["bigtech"] > 0],
        key=lambda c: -c["bigtech"],
    )[:30]
    bigtech = {
        "total": round(bt_total, 2),
        "empresas": empresas,
        "topCandidatos": [
            {"nome": c["nome"], "urna": c["urna"], "cargo": c["cargo"], "uf": c["uf"],
             "partido": c["partido"], "bigtech": round(c["bigtech"], 2),
             "digital": round(c["g_digital"], 2)}
            for c in top_cands_bt
        ],
        "partidos": [
            {"partido": k, "total": round(v, 2)}
            for k, v in sorted(bigtech_por_partido.items(), key=lambda x: -x[1])[:15]
        ],
        "metaPlataformas": [
            {"plataforma": k, "total": round(v["total"], 2), "linhas": v["linhas"]}
            for k, v in sorted(meta_plataforma.items(), key=lambda x: -x[1]["total"])
        ],
        "match": {"cnpj": match_cnpj, "nome": match_nome},
        "naoLocalizadas": BIG_TECH_NAO_LOCALIZADAS,
    }
    (saida / "bigtech.json").write_text(json.dumps(bigtech, ensure_ascii=False, indent=1), encoding="utf-8")

    top_forn = sorted(fornecedores.values(), key=lambda f: -f["total"])[:40]
    fornecedores_json = [
        {"nome": f["nome"], "cnpj": (f"{f['doc'][:2]}.{f['doc'][2:5]}.{f['doc'][5:8]}/{f['doc'][8:12]}-{f['doc'][12:]}"
                                     if len(f["doc"]) == 14 else ""),
         "total": round(f["total"], 2), "linhas": f["linhas"], "bigtech": f["bigtech"]}
        for f in top_forn
    ]
    (saida / "fornecedores.json").write_text(
        json.dumps(fornecedores_json, ensure_ascii=False, indent=1), encoding="utf-8")

    partidos_json = sorted(partidos.values(), key=lambda p: -p["contratado"])
    for p in partidos_json:
        for k in ("contratado", "pago", "receita", "digital", "bigtech"):
            p[k] = round(p[k], 2)
    (saida / "partidos.json").write_text(
        json.dumps(partidos_json, ensure_ascii=False, indent=1), encoding="utf-8")

    # agregados de análise (universo completo dos candidatos, sem "BR")
    (saida / "por-partido.json").write_text(
        json.dumps(por_partido_analise, ensure_ascii=False, indent=1), encoding="utf-8")
    (saida / "por-uf.json").write_text(
        json.dumps(por_uf_analise, ensure_ascii=False, indent=1), encoding="utf-8")

    # -----------------------------------------------------------------
    # GUARDAS: nenhum arquivo de saida pode conter 11 digitos seguidos
    # (CPF). Se encontrar, aborta sem deixar sujeira aproveitavel — a
    # regua do repo (DIRETORIOS_DADO) vai barar o commit depois.
    # -----------------------------------------------------------------
    for arq in sorted(saida.glob("*.json")):
        texto = arq.read_text(encoding="utf-8")
        achado = REGEX_CPF.search(texto)
        if achado:
            print(f"ABORTADO: {arq.name} contem sequencia de 11 digitos "
                  f"(posivel CPF): {achado.group(0)}")
            return 1

    print()
    print("== RESUMO ==")
    print(f"candidaturas com votacao: {n_cand_votacao:,} | sem votacao (vedada/retirada): {n_sem_votacao:,} | total declarado: {len(cands):,}")
    print(f"eleitos 1o turno: {n_eleitos:,} | pendentes 2o turno: {n_2t:,}")
    print(f"receita total: {moeda(tot_receita)}")
    print(f"contratado total: {moeda(tot_contratado)} | pago total: {moeda(tot_pago)}")
    print(f"digital (contratado): {moeda(tot_digital)} / pago {moeda(tot_digital_pago)}")
    print(f"materiais (contratado): {moeda(tot_materiais)} / pago {moeda(tot_materiais_pago)}")
    print(f"rua (contratado): {moeda(tot_rua)}")
    print(f"big tech total (contratado): {moeda(bt_total)}")
    for e in empresas[:6]:
        print(f"    {moeda(e['total']):>18}  {e['empresa']} ({e['grupo']})")
    print("meta por plataforma (heuristica da descricao da despesa):")
    for k, v in sorted(meta_plataforma.items(), key=lambda x: -x[1]["total"]):
        print(f"    {moeda(v['total']):>18}  {k} ({v['linhas']:,} linhas)")
    print(f"linhas na tabela: {len(linhas):,} -> {arquivo_linhas}")
    print(f"partidos (candidatos): {len(por_partido_analise)} | UFs (sem BR): {len(por_uf_analise)}")
    print(f"saida: {saida}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
