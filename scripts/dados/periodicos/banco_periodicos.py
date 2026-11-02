"""
Banco Relacional SQLite e Exportador Regional de Periódicos Científicos e Cíclicos

O que é:
    Cria o banco de dados SQLite otimizado (periodicos.db) com suporte a busca
    textual completa (FTS5) e exporta os dados particionados por região geográfica
    em CSV e JSON, cobrindo tanto fluxo contínuo quanto chamadas cíclicas confirmadas.

Fonte:
    Dados normalizados gerados pelo coletor-periodicos.py a partir do DOAJ e redes abertas.

Regras seguidas:
    - Regra 5.9: comentário explicativo no cabeçalho
    - Regra 5.1: arquivos particionados leves para não estourar props de componente React
    - FTS5 com unicode61 para busca insensível a acentos
"""

import os
import sys
import json
import csv
import sqlite3
from typing import Dict, List, Any
from coletar_periodicos import normalizar_periodicos, RAW_CSV_PATH, DADOS_DIR

DB_PATH = os.path.join(DADOS_DIR, "periodicos.db")
SUMARIO_PATH = os.path.join(DADOS_DIR, "sumario_global.json")

REGIOES_ORDENADAS = [
    ("01-brasil-lusofonos", "Fase 1: Brasil e Lusófonos"),
    ("02-america-latina", "Fase 2: América Latina e Caribe"),
    ("03-america-do-norte", "Fase 3: América do Norte"),
    ("04-europa", "Fase 4: Europa"),
    ("05-africa", "Fase 5: África"),
    ("06-asia-china", "Fase 6: Ásia e China"),
    ("07-oceania-outros", "Fase 7: Oceania e Resto do Mundo")
]

def criar_tabelas(conn: sqlite3.Connection):
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS periodicos")
    cursor.execute("DROP TABLE IF EXISTS periodicos_fts")

    cursor.execute("""
    CREATE TABLE periodicos (
        id TEXT PRIMARY KEY,
        titulo TEXT NOT NULL,
        titulo_alternativo TEXT,
        issn_eletronico TEXT,
        issn_impresso TEXT,
        prefixo_doi TEXT,
        pais TEXT NOT NULL,
        pais_origem_en TEXT,
        codigo_pais TEXT,
        regiao_chave TEXT NOT NULL,
        regiao_nome TEXT NOT NULL,
        instituicao TEXT,
        editora TEXT,
        tipo_instituicao TEXT NOT NULL,
        natureza_instituicao TEXT NOT NULL,
        area_conhecimento TEXT NOT NULL,
        temas_json TEXT,
        idiomas_json TEXT,
        tipo_modelo TEXT NOT NULL,
        periodicidade TEXT NOT NULL,
        submissao_continua INTEGER NOT NULL,
        modelo_publicacao TEXT NOT NULL,
        plataforma_envio TEXT NOT NULL,
        url_submissao TEXT,
        url_homepage TEXT,
        url_doaj TEXT,
        gratuito_diamond INTEGER NOT NULL,
        taxa_apc TEXT,
        licenca_cc TEXT,
        ano_abertura_oa TEXT,
        tempo_medio_semanas INTEGER,
        revisao_por_pares TEXT
    )
    """)

    cursor.execute("CREATE INDEX idx_periodicos_regiao ON periodicos(regiao_chave);")
    cursor.execute("CREATE INDEX idx_periodicos_pais ON periodicos(codigo_pais);")
    cursor.execute("CREATE INDEX idx_periodicos_area ON periodicos(area_conhecimento);")
    cursor.execute("CREATE INDEX idx_periodicos_gratuito ON periodicos(gratuito_diamond);")
    cursor.execute("CREATE INDEX idx_periodicos_plataforma ON periodicos(plataforma_envio);")
    cursor.execute("CREATE INDEX idx_periodicos_modelo ON periodicos(tipo_modelo);")
    cursor.execute("CREATE INDEX idx_periodicos_periodicidade ON periodicos(periodicidade);")
    cursor.execute("CREATE INDEX idx_periodicos_tipo_inst ON periodicos(tipo_instituicao);")

    # Tabela FTS5 para busca textual ultra-rápida
    cursor.execute("""
    CREATE VIRTUAL TABLE periodicos_fts USING fts5(
        id UNINDEXED,
        titulo,
        instituicao,
        temas,
        area_conhecimento,
        pais,
        tipo_modelo,
        periodicidade,
        tipo_instituicao,
        tokenize='unicode61 remove_diacritics 2'
    )
    """)
    conn.commit()

def inserir_periodicos(conn: sqlite3.Connection, periodicos: List[Dict[str, Any]]):
    cursor = conn.cursor()
    insert_sql = """
    INSERT INTO periodicos VALUES (
        :id, :titulo, :titulo_alternativo, :issn_eletronico, :issn_impresso,
        :prefixo_doi, :pais, :pais_origem_en, :codigo_pais, :regiao_chave,
        :regiao_nome, :instituicao, :editora, :tipo_instituicao, :natureza_instituicao,
        :area_conhecimento, :temas_json, :idiomas_json, :tipo_modelo, :periodicidade,
        :submissao_continua, :modelo_publicacao, :plataforma_envio, :url_submissao,
        :url_homepage, :url_doaj, :gratuito_diamond, :taxa_apc, :licenca_cc,
        :ano_abertura_oa, :tempo_medio_semanas, :revisao_por_pares
    )
    """

    fts_sql = """
    INSERT INTO periodicos_fts VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
    """

    batch_db = []
    batch_fts = []

    for p in periodicos:
        temas_str = ", ".join(p["temas"])
        batch_db.append({
            "id": p["id"],
            "titulo": p["titulo"],
            "titulo_alternativo": p["titulo_alternativo"],
            "issn_eletronico": p["issn_eletronico"],
            "issn_impresso": p["issn_impresso"],
            "prefixo_doi": p["prefixo_doi"],
            "pais": p["pais"],
            "pais_origem_en": p["pais_origem_en"],
            "codigo_pais": p["codigo_pais"],
            "regiao_chave": p["regiao_chave"],
            "regiao_nome": p["regiao_nome"],
            "instituicao": p["instituicao"],
            "editora": p["editora"],
            "tipo_instituicao": p["tipo_instituicao"],
            "natureza_instituicao": p["natureza_instituicao"],
            "area_conhecimento": p["area_conhecimento"],
            "temas_json": json.dumps(p["temas"], ensure_ascii=False),
            "idiomas_json": json.dumps(p["idiomas_aceitos"], ensure_ascii=False),
            "tipo_modelo": p["tipo_modelo"],
            "periodicidade": p["periodicidade"],
            "submissao_continua": 1 if p["submissao_continua"] else 0,
            "modelo_publicacao": p["modelo_publicacao"],
            "plataforma_envio": p["plataforma_envio"],
            "url_submissao": p["url_submissao"],
            "url_homepage": p["url_homepage"],
            "url_doaj": p["url_doaj"],
            "gratuito_diamond": 1 if p["gratuito_diamond"] else 0,
            "taxa_apc": p["taxa_apc"],
            "licenca_cc": p["licenca_cc"],
            "ano_abertura_oa": p["ano_abertura_oa"],
            "tempo_medio_semanas": p["tempo_medio_semanas"],
            "revisao_por_pares": p["revisao_por_pares"]
        })

        batch_fts.append((
            p["id"],
            p["titulo"],
            p["instituicao"],
            temas_str,
            p["area_conhecimento"],
            p["pais"],
            p["tipo_modelo"],
            p["periodicidade"],
            p["tipo_instituicao"]
        ))

    cursor.executemany(insert_sql, batch_db)
    cursor.executemany(fts_sql, batch_fts)
    conn.commit()
    print(f"[SQLITE] Inseridos {len(periodicos):,} registros em {DB_PATH}")

def exportar_arquivos_regionais(periodicos: List[Dict[str, Any]]):
    """Exporta CSV e JSON separados para cada uma das 7 regiões geográficas."""
    por_regiao: Dict[str, List[Dict[str, Any]]] = {}
    for p in periodicos:
        reg = p["regiao_chave"]
        por_regiao.setdefault(reg, []).append(p)

    csv_fields = [
        "id", "titulo", "pais", "codigo_pais", "instituicao", "tipo_instituicao",
        "natureza_instituicao", "area_conhecimento", "tipo_modelo", "periodicidade",
        "submissao_continua", "modelo_publicacao", "plataforma_envio", "url_submissao",
        "url_homepage", "gratuito_diamond", "taxa_apc", "licenca_cc", "prefixo_doi",
        "issn_eletronico", "issn_impresso", "idiomas_aceitos", "temas", "tempo_medio_semanas"
    ]

    for reg_key, rotulo in REGIOES_ORDENADAS:
        itens = por_regiao.get(reg_key, [])
        json_file = os.path.join(DADOS_DIR, f"{reg_key}.json")
        csv_file = os.path.join(DADOS_DIR, f"{reg_key}.csv")

        # Salva JSON
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump({
                "regiao_chave": reg_key,
                "regiao_nome": rotulo,
                "total_periodicos": len(itens),
                "periodicos": itens
            }, f, ensure_ascii=False, indent=2)

        # Salva CSV
        with open(csv_file, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=csv_fields, extrasaction="ignore")
            writer.writeheader()
            for it in itens:
                row = dict(it)
                row["idiomas_aceitos"] = "; ".join(it.get("idiomas_aceitos", []))
                row["temas"] = "; ".join(it.get("temas", []))
                writer.writerow(row)

        print(f"[EXPORT] {rotulo}: {len(itens):,} títulos -> {reg_key}.json e .csv")

def gerar_sumario_global(periodicos: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Gera sumário com estatísticas consolidadas para fácil análise e painel."""
    total = len(periodicos)
    gratuitos = sum(1 for p in periodicos if p["gratuito_diamond"])
    com_doi = sum(1 for p in periodicos if p["prefixo_doi"] != "Não informado / Outro identificador")
    ojs_count = sum(1 for p in periodicos if "OJS" in p["plataforma_envio"])
    fluxo_continuo = sum(1 for p in periodicos if p["tipo_modelo"] == "Fluxo Contínuo")
    ciclicos = sum(1 for p in periodicos if p["tipo_modelo"] == "Cíclico Confirmado")

    por_pais: Dict[str, int] = {}
    por_area: Dict[str, int] = {}
    por_idioma: Dict[str, int] = {}
    por_regiao: Dict[str, int] = {}
    por_plataforma: Dict[str, int] = {}
    por_periodicidade: Dict[str, int] = {}
    por_tipo_inst: Dict[str, int] = {}

    for p in periodicos:
        por_pais[p["pais"]] = por_pais.get(p["pais"], 0) + 1
        por_area[p["area_conhecimento"]] = por_area.get(p["area_conhecimento"], 0) + 1
        por_regiao[p["regiao_nome"]] = por_regiao.get(p["regiao_nome"], 0) + 1
        por_periodicidade[p["periodicidade"]] = por_periodicidade.get(p["periodicidade"], 0) + 1
        por_tipo_inst[p["tipo_instituicao"]] = por_tipo_inst.get(p["tipo_instituicao"], 0) + 1
        plat_simplificada = p["plataforma_envio"].split("(")[0].strip()
        por_plataforma[plat_simplificada] = por_plataforma.get(plat_simplificada, 0) + 1
        for idi in p["idiomas_aceitos"]:
            por_idioma[idi] = por_idioma.get(idi, 0) + 1

    sumario = {
        "total_periodicos_mundo": total,
        "total_paises": len(por_pais),
        "total_fluxo_continuo": fluxo_continuo,
        "total_ciclicos_confirmados": ciclicos,
        "periodicos_gratuitos_diamond_oa": gratuitos,
        "porcentagem_gratuitos_diamond": round((gratuitos / total) * 100, 2) if total else 0,
        "periodicos_com_doi_ativo": com_doi,
        "periodicos_plataforma_ojs": ojs_count,
        "periodicos_por_periodicidade": sorted(por_periodicidade.items(), key=lambda x: x[1], reverse=True),
        "periodicos_por_tipo_instituicao": sorted(por_tipo_inst.items(), key=lambda x: x[1], reverse=True),
        "periodicos_por_regiao": por_regiao,
        "top_20_paises": sorted(por_pais.items(), key=lambda x: x[1], reverse=True)[:20],
        "periodicos_por_grande_area": sorted(por_area.items(), key=lambda x: x[1], reverse=True),
        "top_10_idiomas_aceitos": sorted(por_idioma.items(), key=lambda x: x[1], reverse=True)[:10],
        "plataformas_de_submissao": sorted(por_plataforma.items(), key=lambda x: x[1], reverse=True)
    }

    with open(SUMARIO_PATH, "w", encoding="utf-8") as f:
        json.dump(sumario, f, ensure_ascii=False, indent=2)

    print(f"[SUMARIO] Gravado com sucesso em {SUMARIO_PATH}")
    return sumario

if __name__ == "__main__":
    print("[INICIO] Processando catálogo global enriquecido...")
    itens = normalizar_periodicos(RAW_CSV_PATH)

    conn = sqlite3.connect(DB_PATH)
    criar_tabelas(conn)
    inserir_periodicos(conn, itens)
    conn.close()

    exportar_arquivos_regionais(itens)
    sumario = gerar_sumario_global(itens)

    print("\n--- RESUMO DA SISTEMATIZAÇÃO MUNDIAL (CONTÍNUOS + CÍCLICOS) ---")
    print(f"Total mundial: {sumario['total_periodicos_mundo']:,} periódicos em {sumario['total_paises']} países")
    print(f"  - Fluxo Contínuo: {sumario['total_fluxo_continuo']:,}")
    print(f"  - Cíclicos Confirmados: {sumario['total_ciclicos_confirmados']:,}")
    print(f"Periódicos 100% gratuitos (Diamante / Sem APC): {sumario['periodicos_gratuitos_diamond_oa']:,} ({sumario['porcentagem_gratuitos_diamond']}%)")
    print("\nDistribuição por Periodicidade:")
    for per, qtd in sumario['periodicos_por_periodicidade']:
        print(f"  - {per}: {qtd:,}")
    print("\nDistribuição por Tipo de Instituição:")
    for inst, qtd in sumario['periodicos_por_tipo_instituicao']:
        print(f"  - {inst}: {qtd:,}")
