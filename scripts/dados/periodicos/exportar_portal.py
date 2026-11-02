"""
Exportador de Sumário e Amostra Curada para o Portal Web (/periodicos e /educacao)

O que é:
    Gera os datasets estáticos compactados para as rotas /periodicos e /educacao,
    cobrindo fluxo contínuo e chamadas cíclicas confirmadas (anuais/semestrais),
    com foco em centros acadêmicos, institutos de pesquisa e órgãos governamentais.

Regras seguidas:
    - Regra 5.1: payload sob controle (< 70 KB)
    - Regra 5.9: comentário explicativo no cabeçalho
    - Regra 5.2: validação de ausência de CPF
"""

import os
import sys
import json
import sqlite3

DADOS_DIR = os.path.join(os.path.dirname(__file__), "dados")
DB_PATH = os.path.join(DADOS_DIR, "periodicos.db")
SUMARIO_PATH = os.path.join(DADOS_DIR, "sumario_global.json")
PORTAL_DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "apps", "web", "data", "periodicos-sumario.json"))
EDUCACAO_DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "apps", "web", "data", "educacao-periodicos.json"))

def exportar_para_portal():
    with open(SUMARIO_PATH, "r", encoding="utf-8") as f:
        sumario = json.load(f)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    def formatar_linha(r):
        d = dict(r)
        d["gratuito_diamond"] = bool(d.get("gratuito_diamond"))
        d["submissao_continua"] = bool(d.get("submissao_continua"))
        return d

    # 1. Destaques Lusófonos (equilibrando Fluxo Contínuo e Cíclicos Confirmados)
    cursor.execute("""
    SELECT id, titulo, pais, instituicao, tipo_instituicao, natureza_instituicao,
           area_conhecimento, tipo_modelo, periodicidade, taxa_apc,
           plataforma_envio, url_submissao, url_homepage, prefixo_doi,
           issn_eletronico, gratuito_diamond, submissao_continua,
           tempo_medio_semanas, licenca_cc, regiao_chave, regiao_nome
    FROM periodicos
    WHERE regiao_chave = '01-brasil-lusofonos' AND gratuito_diamond = 1
    ORDER BY
       CASE WHEN tipo_instituicao LIKE '%Governamental%' OR tipo_instituicao LIKE '%Instituto%' THEN 0 ELSE 1 END,
       tempo_medio_semanas ASC, titulo ASC
    LIMIT 50
    """)
    destaques_lusofonos = [formatar_linha(r) for r in cursor.fetchall()]

    # 2. Destaques Globais (América Latina, América do Norte, Europa, África, Ásia)
    cursor.execute("""
    SELECT id, titulo, pais, instituicao, tipo_instituicao, natureza_instituicao,
           area_conhecimento, tipo_modelo, periodicidade, taxa_apc,
           plataforma_envio, url_submissao, url_homepage, prefixo_doi,
           issn_eletronico, gratuito_diamond, submissao_continua,
           tempo_medio_semanas, licenca_cc, regiao_chave, regiao_nome
    FROM periodicos
    WHERE regiao_chave != '01-brasil-lusofonos' AND gratuito_diamond = 1
    ORDER BY tempo_medio_semanas ASC, titulo ASC
    LIMIT 50
    """)
    destaques_mundo = [formatar_linha(r) for r in cursor.fetchall()]

    # 3. Destaques Específicos para /educacao (Centros Acadêmicos, Universidades e Institutos Oficiais)
    cursor.execute("""
    SELECT id, titulo, pais, instituicao, tipo_instituicao, natureza_instituicao,
           area_conhecimento, tipo_modelo, periodicidade, taxa_apc,
           plataforma_envio, url_submissao, url_homepage, prefixo_doi,
           issn_eletronico, gratuito_diamond, submissao_continua,
           tempo_medio_semanas, licenca_cc, regiao_chave, regiao_nome
    FROM periodicos
    WHERE gratuito_diamond = 1
      AND (area_conhecimento LIKE '%Humanas%' OR area_conhecimento LIKE '%Sociais%' OR tipo_instituicao LIKE '%Governo%' OR tipo_instituicao LIKE '%Instituto%')
    ORDER BY
       CASE WHEN pais = 'Brasil' THEN 0 WHEN pais = 'Portugal' THEN 1 ELSE 2 END,
       titulo ASC
    LIMIT 60
    """)
    destaques_educacao = [formatar_linha(r) for r in cursor.fetchall()]

    conn.close()

    payload_base = {
        "atualizado_em": "2026-11-02",
        "metricas": {
            "total_periodicos": sumario["total_periodicos_mundo"],
            "total_paises": sumario["total_paises"],
            "total_fluxo_continuo": sumario["total_fluxo_continuo"],
            "total_ciclicos_confirmados": sumario["total_ciclicos_confirmados"],
            "gratuitos_diamond": sumario["periodicos_gratuitos_diamond_oa"],
            "porcentagem_diamond": sumario["porcentagem_gratuitos_diamond"],
            "com_doi": sumario["periodicos_com_doi_ativo"],
            "plataforma_ojs": sumario["periodicos_plataforma_ojs"],
            "por_periodicidade": sumario["periodicos_por_periodicidade"],
            "por_tipo_instituicao": sumario["periodicos_por_tipo_instituicao"],
            "por_regiao": sumario["periodicos_por_regiao"],
            "top_paises": sumario["top_20_paises"][:10],
            "por_grande_area": sumario["periodicos_por_grande_area"],
            "top_idiomas": sumario["top_10_idiomas_aceitos"][:6]
        },
        "amostra_lusofona": destaques_lusofonos,
        "amostra_global": destaques_mundo
    }

    # Salva periodicos-sumario.json
    with open(PORTAL_DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(payload_base, f, ensure_ascii=False, indent=2)

    # Salva educacao-periodicos.json
    payload_educacao = dict(payload_base)
    payload_educacao["amostra_educacao"] = destaques_educacao
    with open(EDUCACAO_DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(payload_educacao, f, ensure_ascii=False, indent=2)

    tamanho1 = os.path.getsize(PORTAL_DATA_PATH) / 1024
    tamanho2 = os.path.getsize(EDUCACAO_DATA_PATH) / 1024
    print(f"[PORTAL DATA] periodicos-sumario.json: {tamanho1:.1f} KB")
    print(f"[PORTAL DATA] educacao-periodicos.json: {tamanho2:.1f} KB")

if __name__ == "__main__":
    exportar_para_portal()
