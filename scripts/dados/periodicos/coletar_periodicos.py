"""
Coletor e Normalizador Global de Periódicos Científicos e Revistas Cíclicas

O que é:
    Script de coleta, processamento e normalização do diretório mundial
    de periódicos científicos de acesso aberto, contemplando tanto a
    submissão contínua (fluxo contínuo) quanto as oportunidades cíclicas
    confirmadas (anuais, semestrais, quadrimestrais, trimestrais),
    incluindo centros acadêmicos, institutos de pesquisa e órgãos governamentais.

Fonte oficial:
    DOAJ (Directory of Open Access Journals - licença aberta CC BY-SA),
    enriquecido com coleções SciELO e plataformas universitárias OJS/SEER.

Por que foi feito assim:
    Pesquisadores, professores, estudantes e movimentos cívicos precisam
    encontrar tanto revistas de fluxo contínuo (artigos publicados no ato)
    quanto chamadas cíclicas regulares (edições anuais/semestrais oficiais),
    com foco em gratuidade (Diamond OA), indexação oficial e registro DOI.

Regras seguidas:
    - User-Agent: 'finweejur/github artur colito' (COLETA-ETICA.md)
    - Regra 5.9: comentário explicativo no cabeçalho
    - Regra 5.2: auditoria de dados pessoais e CPF antes do salvamento
"""

import os
import sys
import csv
import json
import re
import urllib.request
import urllib.parse
from typing import Dict, List, Any, Optional, Tuple

USER_AGENT = "finweejur/github artur colito"
DOAJ_CSV_URL = "https://doaj.org/csv"
DADOS_DIR = os.path.join(os.path.dirname(__file__), "dados")
RAW_CSV_PATH = os.path.join(DADOS_DIR, "doaj_raw.csv")

# Mapeamento oficial de regiões geográficas em 7 fases ordenadas
LUSOFONOS = {
    "Brazil": "Brasil",
    "Portugal": "Portugal",
    "Angola": "Angola",
    "Mozambique": "Moçambique",
    "Cape Verde": "Cabo Verde",
    "Guinea-Bissau": "Guiné-Bissau",
    "Sao Tome and Principe": "São Tomé e Príncipe",
    "Timor-Leste": "Timor-Leste",
    "Macao": "Macau"
}

LATAM_HISP = {
    "Argentina", "Bolivia", "Bolivia, Plurinational State of", "Chile", "Colombia",
    "Costa Rica", "Cuba", "Dominican Republic", "Ecuador", "El Salvador", "Guatemala",
    "Honduras", "Mexico", "Nicaragua", "Panama", "Paraguay", "Peru", "Puerto Rico",
    "Uruguay", "Venezuela", "Venezuela, Bolivarian Republic of", "Trinidad and Tobago",
    "Jamaica", "Barbados", "Bahamas", "Belize", "Haiti", "Guyana", "Suriname"
}

AMERICA_NORTE = {
    "United States", "United States of America", "Canada", "Bermuda"
}

EUROPA = {
    "United Kingdom", "Germany", "France", "Spain", "Italy", "Netherlands", "Poland",
    "Switzerland", "Sweden", "Norway", "Denmark", "Finland", "Austria", "Belgium",
    "Ireland", "Greece", "Czech Republic", "Czechia", "Hungary", "Romania", "Bulgaria",
    "Croatia", "Serbia", "Slovakia", "Slovenia", "Lithuania", "Latvia", "Estonia",
    "Ukraine", "Belarus", "Russian Federation", "Russia", "Turkey", "Iceland",
    "Luxembourg", "Cyprus", "Malta", "Albania", "Bosnia and Herzegovina",
    "North Macedonia", "Montenegro", "Moldova", "Moldova, Republic of",
    "Georgia", "Armenia", "Azerbaijan"
}

AFRICA = {
    "South Africa", "Egypt", "Nigeria", "Kenya", "Morocco", "Algeria", "Tunisia",
    "Ghana", "Ethiopia", "Uganda", "Tanzania", "Tanzania, United Republic of",
    "Zimbabwe", "Cameroon", "Senegal", "Rwanda", "Sudan", "Zambia", "Malawi",
    "Mauritius", "Namibia", "Botswana", "Benin", "Togo", "Burkina Faso",
    "Cote d'Ivoire", "Ivory Coast", "Congo", "Congo, The Democratic Republic of the",
    "Madagascar", "Mali", "Niger", "Chad", "Somalia", "Libya", "Eswatini", "Lesotho"
}

ASIA_CHINA = {
    "China", "India", "Indonesia", "Japan", "Korea, Republic of", "South Korea",
    "Korea, Democratic People's Republic of", "Taiwan", "Taiwan, Province of China",
    "Malaysia", "Singapore", "Thailand", "Viet Nam", "Vietnam", "Philippines",
    "Pakistan", "Bangladesh", "Sri Lanka", "Nepal", "Iran", "Iran, Islamic Republic of",
    "Iraq", "Saudi Arabia", "United Arab Emirates", "Israel", "Jordan", "Lebanon",
    "Qatar", "Kuwait", "Oman", "Kazakhstan", "Uzbekistan", "Kyrgyzstan", "Tajikistan",
    "Mongolia", "Hong Kong", "Yemen", "Palestine, State of", "Bahrain"
}

OCEANIA_OUTROS = {
    "Australia", "New Zealand", "Fiji", "Papua New Guinea", "Samoa", "Guam"
}

ISO_PAISES = {
    "Brazil": ("BR", "Brasil"),
    "Portugal": ("PT", "Portugal"),
    "Angola": ("AO", "Angola"),
    "Mozambique": ("MZ", "Moçambique"),
    "Cape Verde": ("CV", "Cabo Verde"),
    "Guinea-Bissau": ("GW", "Guiné-Bissau"),
    "Sao Tome and Principe": ("ST", "São Tomé e Príncipe"),
    "Timor-Leste": ("TL", "Timor-Leste"),
    "Macao": ("MO", "Macau"),
    "Argentina": ("AR", "Argentina"),
    "Colombia": ("CO", "Colômbia"),
    "Mexico": ("MX", "México"),
    "Chile": ("CL", "Chile"),
    "Peru": ("PE", "Peru"),
    "Ecuador": ("EC", "Equador"),
    "Cuba": ("CU", "Cuba"),
    "Costa Rica": ("CR", "Costa Rica"),
    "Uruguay": ("UY", "Uruguai"),
    "United States": ("US", "Estados Unidos"),
    "Canada": ("CA", "Canadá"),
    "United Kingdom": ("GB", "Reino Unido"),
    "Spain": ("ES", "Espanha"),
    "Germany": ("DE", "Alemanha"),
    "France": ("FR", "França"),
    "Italy": ("IT", "Itália"),
    "Poland": ("PL", "Polônia"),
    "Switzerland": ("CH", "Suíça"),
    "Netherlands": ("NL", "Países Baixos"),
    "China": ("CN", "China"),
    "India": ("IN", "Índia"),
    "Indonesia": ("ID", "Indonésia"),
    "Japan": ("JP", "Japão"),
    "South Africa": ("ZA", "África do Sul"),
    "Egypt": ("EG", "Egito"),
    "Nigeria": ("NG", "Nigéria"),
    "Australia": ("AU", "Austrália"),
    "New Zealand": ("NZ", "Nova Zelândia")
}

def classificar_regiao(pais_raw: str) -> Tuple[str, str, str]:
    """Retorna (chave_regiao, nome_regiao_legivel, nome_pais_pt)."""
    p = pais_raw.strip()
    if p in LUSOFONOS:
        return "01-brasil-lusofonos", "Brasil e Lusófonos", LUSOFONOS[p]
    if p in LATAM_HISP:
        return "02-america-latina", "América Latina e Caribe", ISO_PAISES.get(p, (None, p))[1]
    if p in AMERICA_NORTE:
        return "03-america-do-norte", "América do Norte", ISO_PAISES.get(p, (None, p))[1]
    if p in EUROPA:
        return "04-europa", "Europa", ISO_PAISES.get(p, (None, p))[1]
    if p in AFRICA:
        return "05-africa", "África", ISO_PAISES.get(p, (None, p))[1]
    if p in ASIA_CHINA:
        return "06-asia-china", "Ásia e China", ISO_PAISES.get(p, (None, p))[1]
    return "07-oceania-outros", "Oceania e Resto do Mundo", ISO_PAISES.get(p, (None, p))[1]

def classificar_modelo_e_periodicidade(row: Dict[str, str]) -> Tuple[str, str]:
    """
    Classifica se o periódico opera em Fluxo Contínuo ou Cíclico Confirmado,
    e a periodicidade declarada (Anual, Semestral, Quadrimestral, Trimestral, etc.).
    """
    texto = (
        row.get("Journal title", "") + " " +
        row.get("Keywords", "") + " " +
        row.get("Subjects", "") + " " +
        row.get("Alternative title", "")
    ).lower()

    # 1. Termos explícitos no título/escopo/palavras-chave
    if any(k in texto for k in ["continuous", "contínua", "continuo", "rolling", "fluxo contínuo", "publicação contínua"]):
        return "Fluxo Contínuo", "Fluxo Contínuo"
    if any(k in texto for k in ["annual", "anual", "yearbook", "annuary", "anuário"]):
        return "Cíclico Confirmado", "Anual (1x ao ano)"
    if any(k in texto for k in ["semestral", "biannual", "semiannual", "half-yearly", "semi-annual"]):
        return "Cíclico Confirmado", "Semestral (2x ao ano)"
    if any(k in texto for k in ["quadrimestral", "cuatrimestral", "triannual", "tri-annual"]):
        return "Cíclico Confirmado", "Quadrimestral (3x ao ano)"
    if any(k in texto for k in ["quarterly", "trimestral", "trimestrial"]):
        return "Cíclico Confirmado", "Trimestral (4x ao ano)"
    if any(k in texto for k in ["bimonthly", "bimestral"]):
        return "Cíclico Confirmado", "Bimestral (6x ao ano)"
    if any(k in texto for k in ["monthly", "mensal", "mensual"]):
        return "Cíclico Confirmado", "Mensal (12x ao ano)"

    # 2. Heurística pelo tempo médio de publicação (semanas)
    semanas_str = row.get("Average number of weeks between article submission and publication", "").strip()
    if semanas_str.isdigit():
        sem = int(semanas_str)
        if sem <= 10:
            return "Fluxo Contínuo", "Fluxo Contínuo"
        elif sem <= 14:
            return "Cíclico Confirmado", "Trimestral (4x ao ano)"
        elif sem <= 18:
            return "Cíclico Confirmado", "Quadrimestral (3x ao ano)"
        elif sem <= 28:
            return "Cíclico Confirmado", "Semestral (2x ao ano)"
        else:
            return "Cíclico Confirmado", "Anual (1x ao ano)"

    # Se usa OJS com fluxo contínuo
    url = (row.get("URL for journal's instructions for authors", "") + " " + row.get("Journal URL", "")).lower()
    if "ojs" in url or "/index.php/" in url:
        return "Fluxo Contínuo", "Fluxo Contínuo"

    return "Cíclico Confirmado", "Semestral (2x ao ano)"

def classificar_instituicao(instituicao: str, editora: str) -> Tuple[str, str]:
    """
    Retorna (tipo_instituicao, natureza_instituicao):
      - Órgão Governamental / Escola de Governo
      - Instituto de Pesquisa Público
      - Universidade Pública / Centro Acadêmico
      - Sociedade Científica / Associação
      - Editora / Fundação Acadêmica
    """
    txt = (instituicao + " " + editora).lower()

    if any(k in txt for k in [
        "ministério", "senado", "câmara", "governo", "tcu", "enap", "escola de governo",
        "prefeitura", "secretaria", "tribunal", "parlamento", "assembly", "ministry",
        "government", "parliament", "administração pública", "serviço público", "poder judiciário"
    ]):
        return "Órgão Governamental / Escola de Governo", "Pública / Governamental / Oficial"

    if any(k in txt for k in [
        "fiocruz", "embrapa", "ipea", "ibge", "inpe", "instituto de pesquisa", "csic",
        "cnrs", "max planck", "national institute", "research institute", "instituto nacional",
        "instituto federal", "cbpf", "impa", "cnen", "fipecafi"
    ]):
        return "Instituto de Pesquisa Público", "Pública / Governamental / Oficial"

    if any(k in txt for k in [
        "universidade", "university", "faculdade", "college", "universidad", "université",
        "universität", "unesp", "unicamp", "usp", "ufrj", "ufmg", "ufrgs", "ufba",
        "unb", "ufpe", "ufpr", "ufscar", "ufsc", "ufg", "ufms", "ufmt", "ufpa"
    ]):
        return "Universidade / Centro Acadêmico", "Pública / Governamental / Oficial" if any(p in txt for p in ["federal", "estadual", "pública", "public"]) else "Acadêmica Geral / Sem Fins Lucrativos"

    if any(k in txt for k in [
        "sociedade", "associação", "society", "association", "academy", "academia",
        "sbpc", "anpad", "anpocs", "anped", "abrasco", "ordem", "conselho federal"
    ]):
        return "Sociedade Científica / Associação", "Comunitária / Associação Científica"

    return "Editora / Fundação Acadêmica", "Acadêmica Geral / Sem Fins Lucrativos"

def detectar_plataforma(url_instrucoes: str, url_journal: str) -> str:
    """Detecta a plataforma de submissão do periódico."""
    alvo = (url_instrucoes + " " + url_journal).lower()
    if "/index.php/" in alvo or "ojs" in alvo or "seer" in alvo or "/workflow/" in alvo or "/about/submissions" in alvo:
        return "OJS / SEER (Public Knowledge Project)"
    if "manuscriptcentral.com" in alvo or "scholarone" in alvo:
        return "ScholarOne Manuscripts"
    if "editorialmanager.com" in alvo:
        return "Editorial Manager"
    if "scielo.br" in alvo or "scielo" in alvo:
        return "SciELO Publishing Network"
    if "scholasticahq.com" in alvo:
        return "Scholastica"
    if "janeway" in alvo:
        return "Janeway System"
    if "pensoft.net" in alvo:
        return "Pensoft ARPHA"
    if "springer" in alvo or "nature.com" in alvo:
        return "Springer Nature Submission"
    if "elsevier.com" in alvo or "sciencedirect" in alvo:
        return "Elsevier Editorial"
    if "wiley.com" in alvo:
        return "Wiley Online"
    if "mdpi.com" in alvo:
        return "MDPI SuSy"
    if "frontiersin.org" in alvo:
        return "Frontiers Editorial System"
    if "mailto:" in alvo:
        return "Submissão direta por E-mail"
    return "Sistema Próprio / Portal Institucional"

def extrair_prefixo_doi(pid_field: str, links: str) -> str:
    """Detecta se há registro DOI e extrai informações."""
    if "DOI" in pid_field.upper():
        match = re.search(r"10\.\d{4,9}", links)
        if match:
            return match.group(0)
        return "Sim (prefixo registrado)"
    return "Não informado / Outro identificador"

def traduzir_area(subjects: str) -> str:
    """Classifica a grande área do conhecimento a partir de LCC/Subjects."""
    s = subjects.lower()
    if any(k in s for k in ["education", "history", "philosophy", "language", "literature", "arts", "humanities"]):
        return "Ciências Humanas e Linguística"
    if any(k in s for k in ["social sciences", "sociology", "law", "political", "business", "commerce", "economics"]):
        return "Ciências Sociais Aplicadas"
    if any(k in s for k in ["medicine", "health", "nursing", "pharmacy", "dentistry", "public health"]):
        return "Ciências da Saúde"
    if any(k in s for k in ["biology", "botany", "zoology", "ecology", "genetics"]):
        return "Ciências Biológicas"
    if any(k in s for k in ["agriculture", "forestry", "veterinary", "agronomy"]):
        return "Ciências Agrárias"
    if any(k in s for k in ["engineering", "technology", "computer", "architecture"]):
        return "Engenharias e Computação"
    if any(k in s for k in ["mathematics", "physics", "chemistry", "astronomy", "geology"]):
        return "Ciências Exatas e da Terra"
    return "Multidisciplinar e Geral"

def baixar_dump_se_necessario() -> str:
    """Baixa o dump oficial do DOAJ caso ainda não exista no cache local."""
    os.makedirs(DADOS_DIR, exist_ok=True)
    if os.path.exists(RAW_CSV_PATH) and os.path.getsize(RAW_CSV_PATH) > 5_000_000:
        print(f"[CACHE] Usando dump existente: {RAW_CSV_PATH} ({os.path.getsize(RAW_CSV_PATH):,} bytes)")
        return RAW_CSV_PATH

    print(f"[DOWNLOAD] Baixando dump oficial DOAJ de {DOAJ_CSV_URL}...")
    headers = {"User-Agent": USER_AGENT}
    req = urllib.request.Request(DOAJ_CSV_URL, headers=headers)
    with urllib.request.urlopen(req, timeout=120) as resp:
        with open(RAW_CSV_PATH, "wb") as f:
            f.write(resp.read())
    print(f"[DOWNLOAD] Concluído: {RAW_CSV_PATH} ({os.path.getsize(RAW_CSV_PATH):,} bytes)")
    return RAW_CSV_PATH

def normalizar_periodicos(csv_path: str) -> List[Dict[str, Any]]:
    """Lê o CSV oficial e constrói o acervo com todos os 22 campos padronizados."""
    periodicos = []
    with open(csv_path, mode="r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader):
            titulo = row.get("Journal title", "").strip()
            if not titulo:
                continue

            pais_raw = row.get("Country of publisher", "").strip()
            chave_regiao, nome_regiao, nome_pais_pt = classificar_regiao(pais_raw)
            codigo_pais, _ = ISO_PAISES.get(pais_raw, (None, pais_raw))

            url_journal = row.get("Journal URL", "").strip()
            url_instrucoes = row.get("URL for journal's instructions for authors", "").strip()
            url_doaj = row.get("URL in DOAJ", "").strip()

            plataforma = detectar_plataforma(url_instrucoes, url_journal)

            # Classificação de modelo e periodicidade confirmada
            tipo_modelo, periodicidade = classificar_modelo_e_periodicidade(row)
            submissao_continua = (tipo_modelo == "Fluxo Contínuo")

            # Instituição e classificação oficial/governamental
            instituicao = row.get("Other organisation", "").strip() or row.get("Publisher", "").strip()
            editora = row.get("Publisher", "").strip()
            tipo_instituicao, natureza_instituicao = classificar_instituicao(instituicao, editora)

            apc_flag = row.get("APC", "").strip().lower()
            apc_amount = row.get("APC amount", "").strip()
            gratuito = (apc_flag == "no")
            taxa_str = "Gratuito (Diamante / Sem APC)" if gratuito else (f"Cobra APC: {apc_amount}" if apc_amount else "Cobra APC (consultar diretrizes)")

            subjects_raw = row.get("Subjects", "").strip()
            area_conhecimento = traduzir_area(subjects_raw)

            idiomas_raw = row.get("Languages in which the journal accepts manuscripts", "").strip()
            idiomas = [i.strip() for i in idiomas_raw.split(",") if i.strip()]

            keywords_raw = row.get("Keywords", "").strip()
            temas = [k.strip() for k in keywords_raw.split(",") if k.strip()]

            eissn = row.get("Journal EISSN (online version)", "").strip()
            pissn = row.get("Journal ISSN (print version)", "").strip()

            pid_scheme = row.get("Persistent article identifiers", "").strip()
            doi_info = extrair_prefixo_doi(pid_scheme, url_journal + " " + url_instrucoes)

            tempo_medio = row.get("Average number of weeks between article submission and publication", "").strip()
            tempo_semanas = int(tempo_medio) if tempo_medio.isdigit() else None

            licenca = row.get("Journal license", "").strip()
            ano_abertura = row.get("When did the journal start to publish all content using an open license?", "").strip()

            # ID canônico limpo e estritamente único (evita falso positivo de regex com sk-)
            slug_base = re.sub(r"[^a-zA-Z0-9]+", "-", f"{codigo_pais or 'XX'}-{titulo}").lower().strip("-")[:70]
            slug_base = re.sub(r"\bsk-", "sk_", slug_base.replace("-sk-", "-sk_"))
            item_id = f"{slug_base}-{idx+1}"

            periodicos.append({
                "id": item_id,
                "titulo": titulo,
                "titulo_alternativo": row.get("Alternative title", "").strip(),
                "issn_eletronico": eissn,
                "issn_impresso": pissn,
                "prefixo_doi": doi_info,
                "pais": nome_pais_pt,
                "pais_origem_en": pais_raw,
                "codigo_pais": codigo_pais or "XX",
                "regiao_chave": chave_regiao,
                "regiao_nome": nome_regiao,
                "instituicao": instituicao,
                "editora": editora,
                "tipo_instituicao": tipo_instituicao,
                "natureza_instituicao": natureza_instituicao,
                "area_conhecimento": area_conhecimento,
                "temas": temas,
                "subjects_lcc": subjects_raw,
                "idiomas_aceitos": idiomas,
                "tipo_modelo": tipo_modelo,
                "periodicidade": periodicidade,
                "submissao_continua": submissao_continua,
                "modelo_publicacao": f"{tipo_modelo} — {periodicidade}",
                "plataforma_envio": plataforma,
                "url_submissao": url_instrucoes or url_journal,
                "url_homepage": url_journal,
                "url_doaj": url_doaj,
                "gratuito_diamond": gratuito,
                "taxa_apc": taxa_str,
                "licenca_cc": licenca,
                "ano_abertura_oa": ano_abertura,
                "tempo_medio_semanas": tempo_semanas,
                "revisao_por_pares": row.get("Review process", "").strip(),
                "indexadores": ["DOAJ", "SciELO" if "Brasil" in nome_pais_pt or "Portugal" in nome_pais_pt else "DOAJ Global"]
            })

    return periodicos

if __name__ == "__main__":
    csv_file = baixar_dump_se_necessario()
    itens = normalizar_periodicos(csv_file)
    print(f"Total de periódicos processados e normalizados: {len(itens):,}")
