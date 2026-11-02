"""
Ferramenta CLI de Consulta ao Acervo Mundial de Periódicos e Oportunidades Cíclicas

O que é:
    Interface de linha de comando para pesquisar instantaneamente no banco SQLite
    de periódicos com filtros por país, tema, gratuidade (Diamante), DOI,
    fluxo contínuo vs cíclicos regulares (semestral, anual, trimestral)
    e órgãos governamentais/institutos públicos.

Regras seguidas:
    - Regra 5.9: comentário explicativo no cabeçalho
    - Busca via índice FTS5 e índices B-Tree
"""

import os
import sys
import argparse
import sqlite3
import json

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

DB_PATH = os.path.join(os.path.dirname(__file__), "dados", "periodicos.db")

def formatar_periodico(p: dict, detalhado: bool = False) -> str:
    modelo_badge = "🔄 Fluxo Contínuo" if p["tipo_modelo"] == "Fluxo Contínuo" else f"📅 {p['periodicidade']}"
    linhas = [
        f"📖 {p['titulo']}",
        f"   🏛️  Instituição: {p['instituicao']} ({p['pais']}) — [{p['tipo_instituicao']}]",
        f"   🔬 Área: {p['area_conhecimento']}",
        f"   ⏱️  Modelo & Periodicidade: {modelo_badge}",
        f"   💰 Condições: {p['taxa_apc']}",
        f"   ⚡ Plataforma: {p['plataforma_envio']}",
        f"   🌐 Submissão: {p['url_submissao']}",
        f"   🆔 DOI: {p['prefixo_doi']} | e-ISSN: {p['issn_eletronico'] or 'N/A'}"
    ]
    if detalhado:
        idiomas = json.loads(p.get("idiomas_json") or "[]")
        temas = json.loads(p.get("temas_json") or "[]")
        linhas.append(f"   🗣️  Idiomas aceitos: {', '.join(idiomas)}")
        linhas.append(f"   🏷️  Temas: {', '.join(temas[:5])}")
        linhas.append(f"   ⏳ Tempo médio até publicação: {p['tempo_medio_semanas'] or 'N/I'} semanas")
        linhas.append(f"   📜 Licença: {p['licenca_cc']}")
    linhas.append("")
    return "\n".join(linhas)

def consultar(
    termo=None, pais=None, regiao=None, apenas_gratuitos=False, apenas_ojs=False,
    area=None, modelo=None, periodicidade=None, apenas_governo=False,
    tipo_inst=None, limite=10, detalhado=False
):
    if not os.path.exists(DB_PATH):
        print(f"Erro: banco de dados não encontrado em {DB_PATH}. Execute banco_periodicos.py primeiro.")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    condicoes = []
    params = []

    if termo:
        condicoes.append("p.id IN (SELECT id FROM periodicos_fts WHERE periodicos_fts MATCH ?)")
        params.append(termo)
    if pais:
        condicoes.append("(LOWER(p.pais) = LOWER(?) OR LOWER(p.codigo_pais) = LOWER(?))")
        params.extend([pais, pais])
    if regiao:
        condicoes.append("p.regiao_chave LIKE ?")
        params.append(f"%{regiao}%")
    if apenas_gratuitos:
        condicoes.append("p.gratuito_diamond = 1")
    if apenas_ojs:
        condicoes.append("p.plataforma_envio LIKE '%OJS%'")
    if area:
        condicoes.append("p.area_conhecimento LIKE ?")
        params.append(f"%{area}%")
    if modelo:
        if "cont" in modelo.lower():
            condicoes.append("p.tipo_modelo = 'Fluxo Contínuo'")
        elif "cic" in modelo.lower():
            condicoes.append("p.tipo_modelo = 'Cíclico Confirmado'")
    if periodicidade:
        condicoes.append("p.periodicidade LIKE ?")
        params.append(f"%{periodicidade}%")
    if apenas_governo:
        condicoes.append("p.natureza_instituicao LIKE '%Governamental%'")
    if tipo_inst:
        condicoes.append("p.tipo_instituicao LIKE ?")
        params.append(f"%{tipo_inst}%")

    where_clause = " WHERE " + " AND ".join(condicoes) if condicoes else ""
    query = f"""
    SELECT p.* FROM periodicos p
    {where_clause}
    ORDER BY p.gratuito_diamond DESC, p.titulo ASC
    LIMIT ?
    """
    params.append(limite)

    cursor.execute(query, params)
    resultados = cursor.fetchall()

    cursor.execute(f"SELECT COUNT(*) FROM periodicos p {where_clause}", params[:-1])
    total_encontrados = cursor.fetchone()[0]

    print(f"\nEncontrados: {total_encontrados:,} periódico(s) | Exibindo os primeiros {len(resultados)}:")
    print("=" * 75)
    for row in resultados:
        print(formatar_periodico(dict(row), detalhado=detalhado))

    conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Consulta ao Acervo de Periódicos e Oportunidades Cíclicas")
    parser.add_argument("--busca", "-b", help="Termo de busca textual (título, tema, instituição)")
    parser.add_argument("--pais", "-p", help="Filtrar por país (ex: Brasil, Portugal, Argentina, China)")
    parser.add_argument("--regiao", "-r", help="Filtrar por região (ex: brasil-lusofonos, europa)")
    parser.add_argument("--gratuitos", "-g", action="store_true", help="Apenas periódicos gratuitos (Diamante / sem APC)")
    parser.add_argument("--ojs", action="store_true", help="Apenas periódicos com plataforma OJS / SEER")
    parser.add_argument("--area", "-a", help="Filtrar por grande área (ex: Humanas, Saúde, Sociais, Exatas)")
    parser.add_argument("--modelo", "-m", choices=["continuo", "ciclico"], help="Filtrar por modelo (continuo ou ciclico)")
    parser.add_argument("--periodicidade", choices=["semestral", "anual", "quadrimestral", "trimestral"], help="Filtrar por periodicidade cíclica")
    parser.add_argument("--governo", action="store_true", help="Apenas órgãos governamentais e institutos públicos de pesquisa")
    parser.add_argument("--limite", "-l", type=int, default=5, help="Quantidade de resultados a exibir")
    parser.add_argument("--detalhado", "-d", action="store_true", help="Exibir informações detalhadas")

    args = parser.parse_args()
    consultar(
        termo=args.busca,
        pais=args.pais,
        regiao=args.regiao,
        apenas_gratuitos=args.gratuitos,
        apenas_ojs=args.ojs,
        area=args.area,
        modelo=args.modelo,
        periodicidade=args.periodicidade,
        apenas_governo=args.governo,
        limite=args.limite,
        detalhado=args.detalhado
    )
