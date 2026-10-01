# -*- coding: utf-8 -*-
"""
Coletor da porta giratória a partir do Formulário de Referência (FRE) aberto da CVM.

Papel no portal
===============
Alimenta a seção "Porta giratória" de `/empresas/executivos`: administradores
(diretoria, conselho de administração, conselho fiscal) e membros de comitês
de companhias abertas cuja EXPERIÊNCIA PROFISSIONAL declarada pela própria
companhia no FRE (item 12 — cargos dos últimos 5 anos) menciona cargo público
(ministro, secretário, Banco Central, agência reguladora, cargo eletivo,
Tribunal de Contas, Ministério Público...) ou declaração de PEP (pessoa
politicamente exposta).

Fonte oficial
=============
CVM — dados abertos do FRE: https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/FRE/DADOS/
Cada registro guarda o ID_Documento e a URL canônica do formulário na CVM
(coluna LINK_DOC de fre_cia_aberta.csv) para conferência por linha.

Cortesia e robôs
================
robots.txt de dados.cvm.gov.br NÃO bloqueia o caminho /dados/ (bloqueia
/dataset/rate/, /revision/, histórico e /api/), com Crawl-Delay: 10 —
respeitado com pausa de 10 s entre downloads. User-Agent honesto do portal.
Download com checkpoint: ZIP já presente na pasta de entrada não é baixado
de novo.

Dado pessoal — decisão de projeto (LGPD + regras do repo)
=========================================================
Os CSVs da CVM trazem CPF e data de nascimento. Este coletor usa o CPF
APENAS em memória, como chave de identidade (elimina homônimo) e para
contar pessoas distintas. NADA do CPF (nem hash dele) nem da data de
nascimento é gravado no JSON de saída. A guarda de CPF do repositório
(mod-11) roda depois sobre o dado versionado.
"""

import csv
import hashlib
import io
import re
import sys
import time
import zipfile
from pathlib import Path

import urllib.request

# ── Configuração ─────────────────────────────────────────────────────────────

ANOS = [2025, 2026]
BASE_URL = "https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/FRE/DADOS/"
ENTRADA = Path("etl/betim/entrada/cvm-fre")
SAIDA = Path("apps/web/data/empresas/porta-giratoria-cvm.json")
USER_AGENT = "ControlePopular/1.0 (+contato@controlepopular.com.br; dado publico governamental)"
PAUSA_SEGUNDOS = 10  # Crawl-Delay do robots.txt da CVM

# ── Padrões de cargo público na experiência declarada ────────────────────────
# Cada par: (rótulo, regex). A janela gravada permite conferir no documento.

PADROES_CARGO_PUBLICO = [
    ("Ministro(a) de Estado", r"Ministr[oa] de Estado|\bMinistr[oa] [dpao]o?\s"),
    # Pessoa (Secretário/Secretária), não o órgão (Secretaria): exige contexto
    # público. "Secretário de Governança Corporativa" (empresa) fica de fora.
    (
        "Secretário(a) público",
        r"Secret[áa]ri[oa] (de Estado|Municipal|de Governo\b|"
        r"(de|da|do) (Saúde|Educação|Fazenda|Planejamento|Segurança|Administração|"
        r"Gestão|Cultura|Turismo|Meio Ambiente|Infraestrutura|Transportes|Justiça|"
        r"Cidadania|Assistência Social|Desenvolvimento|Agricultura|Trabalho|"
        r"Ciência e Tecnologia|Direitos Humanos))",
    ),
    ("Banco Central", r"Banco Central do Brasil|\bBACEN\b|\bBanco Central\b"),
    ("Agência reguladora", r"Ag[êe]ncia Nacional (do|de|dos|das) |\bANP\b|\bANEEL\b|\bANATEL\b|\bANTAQ\b|\bANTT\b|\bANVISA\b|\bANM\b|\bANS\b"),
    ("Tribunal de Contas", r"\bTCU\b|\bTCE\b|Tribunal de Contas"),
    ("Ministério Público / CGU", r"Minist[ée]rio P[úu]blico|\bCGU\b|\bMPF\b|\bMPMG\b"),
    ("Cargo eletivo", r"Deputad[oa]\b|Senador(a)?\b|Governador(a)?\b|Prefeit[oa]\b|Vice-Prefeit[oa]\b|Vereador(a)?\b"),
    ("Alto escalão do Executivo", r"Casa Civil|Presid[êe]ncia da Rep[úu]blica|Gabinete de Ministr|Subchefe|Chefe de Gabinete de [A-ZÀ-Ú]"),
]

# PEP: a pergunta do formulário + resposta positiva na mesma janela.
REGEX_PEP = re.compile(r"pessoa politicamente expos", re.IGNORECASE)
REGEX_RESPOSTA = re.compile(r"\b(Sim|N[ãa]o)\b")

JANELA_TRECHO = 260


def baixar_zip(ano: int, destino: Path) -> Path:
    """Baixa o ZIP do FRE do ano, com checkpoint (não rebaixa o que já existe)."""
    destino.mkdir(parents=True, exist_ok=True)
    caminho = destino / f"fre_cia_aberta_{ano}.zip"
    if caminho.exists() and caminho.stat().st_size > 1_000_000:
        print(f"[{ano}] ZIP já em disco ({caminho.stat().st_size} bytes) — checkpoint usado")
        return caminho
    url = f"{BASE_URL}fre_cia_aberta_{ano}.zip"
    print(f"[{ano}] baixando {url} …")
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=180) as resposta, open(caminho, "wb") as arquivo:
        arquivo.write(resposta.read())
    print(f"[{ano}] ok ({caminho.stat().st_size} bytes)")
    time.sleep(PAUSA_SEGUNDOS)
    return caminho


def abrir_csv(zip_path: Path, sufixo: str):
    """Itera as linhas do CSV (delimitador ';', ISO-8859-1) dentro do ZIP."""
    with zipfile.ZipFile(zip_path) as zip_aberto:
        nomes = [n for n in zip_aberto.namelist() if n.endswith(f"{sufixo}_{zip_path.stem.split('_')[-1]}.csv")]
        if not nomes:
            return
        with zip_aberto.open(nomes[0]) as bruto:
            texto = io.TextIOWrapper(bruto, encoding="latin-1")
            yield from csv.DictReader(texto, delimiter=";")


# Citação normativa que NÃO é cargo público: "Circular Bacen 3.978",
# "Resolução do Banco Central…" — todos os administradores de bancos citam.
REGEX_CITACAO_NORMATIVA = re.compile(
    r"(Circular|Resolu[çc][ãa]o|Instru[çc][ãa]o|norma|Regulament[ãa][çc][ãa]o|Carta\.)[^.;]{0,40}$",
    re.IGNORECASE,
)

# Boilerplate do próprio formulário: o item 12 repete a pergunta sobre
# "condenação em processo administrativo da CVM, do BACEN ou da SUSEP" —
# presente em quase todo registro, sem relação com cargo público.
REGEX_BOILERPLATE_CONDENA = re.compile(
    r"condena[çc][ãa]o|processo administrativo|inabilitad[oa]", re.IGNORECASE
)

# Lista de órgãos reguladores numa descrição de rotina: "(BACEN, CVM, SUSEP)"
# — menção de contexto, não cargo exercido.
REGEX_LISTA_REGULADORES = re.compile(
    r"[,;/]\s*(CVM|SUSEP|RFB|CADE|ANBIMA|COAF|Banco Central)", re.IGNORECASE
)

# CPF (formatado ou cru) que a própria companhia colou no texto de
# qualificação civil — NUNCA segue para o acervo versionado.
REGEX_CPF_TEXTO = re.compile(r"\d{3}\.?\d{3}\.?\d{3}-?\d{2}")

JANELA_TRECHO = 200


def sanitizar_trecho(trecho: str) -> str:
    """Mascara qualquer CPF que apareça no texto declarado pela companhia."""
    return REGEX_CPF_TEXTO.sub("***", trecho)


def extrair_trechos(texto: str):
    """Devolve [(rótulo, trecho)] das menções de cargo público na experiência."""
    achados = []
    for rotulo, padrao in PADROES_CARGO_PUBLICO:
        for m in re.finditer(padrao, texto, re.IGNORECASE):
            janela_antes = texto[max(0, m.start() - 70) : m.start()]
            janela_depois = texto[m.end() : m.end() + 40]
            if REGEX_BOILERPLATE_CONDENA.search(janela_antes):
                continue
            if rotulo == "Banco Central" and (
                REGEX_CITACAO_NORMATIVA.search(janela_antes)
                or REGEX_LISTA_REGULADORES.search(janela_depois)
            ):
                continue
            inicio = max(0, m.start() - 90)
            fim = min(len(texto), m.end() + JANELA_TRECHO)
            trecho = sanitizar_trecho(
                ("…" if inicio > 0 else "")
                + " ".join(texto[inicio:fim].split())
                + ("…" if fim < len(texto) else "")
            )
            achados.append((rotulo, trecho))
            break  # um trecho por padrão basta para conferência
    return achados


def pep_declarada(texto: str) -> bool:
    """True quando a companhia declara PEP positiva no campo próprio do FRE."""
    for m in REGEX_PEP.finditer(texto):
        janela = texto[m.end() : m.end() + 400]
        resposta = REGEX_RESPOSTA.search(janela)
        if resposta and resposta.group(1).lower() == "sim":
            return True
    return False


def main() -> int:
    # 1. Links canônicos dos documentos (ID_DOC -> LINK_DOC) de todos os anos
    zips = [baixar_zip(ano, ENTRADA) for ano in ANOS]
    links_por_doc: dict[str, str] = {}
    for zip_path, ano in zip(zips, ANOS):
        for linha in abrir_csv(zip_path, "fre_cia_aberta"):
            id_doc = linha.get("ID_DOC", "")
            link = linha.get("LINK_DOC", "")
            if id_doc and link:
                links_por_doc[id_doc] = link

    # 2. Administradores e comitês, com filtro de cargo público
    registros: dict[tuple, dict] = {}
    cpfs_distintos: set[str] = set()
    for zip_path in zips:
        for linha in abrir_csv(zip_path, "fre_cia_aberta_administrador_membro_conselho_fiscal"):
            _processar(linha, ano, "conselho_administracao_ou_fiscal_diretoria", registros, cpfs_distintos)
        for linha in abrir_csv(zip_path, "fre_cia_aberta_membro_comite"):
            _processar(linha, ano, "comite", registros, cpfs_distintos)

    # 3. Ordena por nome para saída estável e escreve JSON
    lista = sorted(registros.values(), key=lambda r: (r["companhia"], r["nome"]))
    for r in lista:
        r.pop("_rank", None)
        r["url_documento"] = links_por_doc.get(r["id_doc"], "")
    empresas = {r["cnpj_cia"] for r in lista}
    saida = {
        "fonte": "CVM — Formulário de Referência (dados abertos), item 12 (experiência profissional declarada pela companhia)",
        "url_fonte": BASE_URL,
        "anos_processados": ANOS,
        "atualizado_em": time.strftime("%Y-%m-%d"),
        "metodologia": (
            "Para cada administrador ou membro de comitê, o texto de experiência profissional "
            "declarado pela própria companhia no FRE é varrido por padrões de cargo público "
            "(ministro, secretário, Banco Central, agência reguladora, Tribunal de Contas, "
            "Ministério Público/CGU, cargo eletivo, alto escalão). O trecho citado vem do "
            "documento e o link abre o formulário original na CVM para conferência. "
            "Trânsito documentado não é ilícito: é o ponto de partida para a investigação cidadã. "
            "CPF e data de nascimento existem na fonte mas NÃO são gravados neste acervo."
        ),
        "total_registros": len(lista),
        "total_pessoas": len(cpfs_distintos),
        "total_empresas": len(empresas),
        "registros": lista,
    }
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(
        __import__("json").dumps(saida, ensure_ascii=False, indent=1),
        encoding="utf-8",
    )
    print(
        f"ok: {len(lista)} registros | {len(cpfs_distintos)} pessoas | {len(empresas)} empresas -> {SAIDA}"
    )
    return 0


def _processar(linha: dict, ano: int, tipo_orgao: str, registros: dict, cpfs: set) -> None:
    """Filtra, deduplica (CPF × empresa: fica a referência mais recente) e monta o registro."""
    cpf = (linha.get("CPF") or "").strip()
    nome = (linha.get("Nome") or "").strip()
    experiencia = linha.get("Experiencia_Profissional") or ""
    if not cpf or not nome:
        return
    trechos = extrair_trechos(experiencia)
    pep = pep_declarada(experiencia)
    if not trechos and not pep:
        return

    cpfs.add(cpf)
    cnpj = (linha.get("CNPJ_Companhia") or "").strip()
    id_doc = (linha.get("ID_Documento") or "").strip()
    chave = (cpf, cnpj)
    rank = (linha.get("Data_Referencia") or "", int(linha.get("Versao") or 0))
    anterior = registros.get(chave)
    if anterior and anterior["_rank"] >= rank:
        return

    # Um único trecho por registro (o de maior prioridade na lista) — os
    # demais padrões ficam como rótulos; o link do FRE traz o texto integral.
    registro = {
        "_rank": rank,
        "nome": nome,
        "cnpj_cia": cnpj,
        "companhia": (linha.get("Nome_Companhia") or "").strip(),
        "tipo_orgao": tipo_orgao,
        "orgao_cargo": (linha.get("Cargo_Eletivo_Ocupado") or linha.get("Cargo_Ocupado")
                        or linha.get("Orgao_Administracao") or "").strip(),
        "cargo_detalhe": (linha.get("Outro_Cargo_Funcao") or linha.get("Descricao_Outro_Cargo_Ocupado") or "").strip(),
        "data_posse": (linha.get("Data_Posse") or "").strip(),
        "ano_fre": ano,
        "id_doc": id_doc,
        "url_documento": "",
        "pep_declarada": pep,
        "padroes": sorted({rotulo for rotulo, _ in trechos}),
        "trecho": trechos[0][1] if trechos else "",
    }
    registros[chave] = registro


if __name__ == "__main__":
    sys.exit(main())
