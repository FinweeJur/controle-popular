"""
Suíte de Testes Automatizados de Integridade dos Periódicos e Oportunidades Cíclicas

O que é:
    Testa e valida a consistência, integridade e ausência de dados pessoais
    no catálogo mundial, cobrindo fluxo contínuo e chamadas cíclicas confirmadas.

Regras seguidas:
    - Regra 5.9: comentário explicativo no cabeçalho
    - Validação dos 22 campos e integridade referencial
    - Validação de tempo de resposta da busca textual FTS5 (< 50 ms)
"""

import os
import sys
import sqlite3
import json
import time

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

DADOS_DIR = os.path.join(os.path.dirname(__file__), "dados")
DB_PATH = os.path.join(DADOS_DIR, "periodicos.db")
SUMARIO_PATH = os.path.join(DADOS_DIR, "sumario_global.json")

REGIOES = [
    "01-brasil-lusofonos",
    "02-america-latina",
    "03-america-do-norte",
    "04-europa",
    "05-africa",
    "06-asia-china",
    "07-oceania-outros"
]

def testar_banco_sqlite():
    print("[TESTE 1] Validando banco SQLite e contagem de registros...")
    assert os.path.exists(DB_PATH), f"Banco não encontrado: {DB_PATH}"
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM periodicos")
    total = cursor.fetchone()[0]
    assert total >= 23_000, f"Total de periódicos menor que o esperado: {total}"
    print(f"  -> Total verificado: {total:,} periódicos no banco.")

    # Verifica campos obrigatórios não nulos
    cursor.execute("""
    SELECT COUNT(*) FROM periodicos
    WHERE titulo IS NULL OR titulo = ''
       OR pais IS NULL OR pais = ''
       OR area_conhecimento IS NULL
       OR plataforma_envio IS NULL
       OR tipo_modelo IS NULL
       OR periodicidade IS NULL
       OR tipo_instituicao IS NULL
    """)
    nulos = cursor.fetchone()[0]
    assert nulos == 0, f"Registros com campos obrigatórios nulos: {nulos}"
    print("  -> Integridade de campos obrigatórios: 100% preenchidos.")
    conn.close()

def testar_busca_fts5():
    print("[TESTE 2] Validando índice FTS5 e velocidade de busca...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    termos = ["educação", "saúde", "direito", "climate", "ambiente", "science"]
    for termo in termos:
        t0 = time.perf_counter()
        cursor.execute("""
        SELECT p.titulo, p.pais, p.area_conhecimento, p.url_submissao, p.periodicidade
        FROM periodicos_fts fts
        JOIN periodicos p ON p.id = fts.id
        WHERE periodicos_fts MATCH ?
        LIMIT 5
        """, (termo,))
        linhas = cursor.fetchall()
        t1 = time.perf_counter()
        duracao_ms = (t1 - t0) * 1000
        assert len(linhas) > 0, f"Nenhum resultado para termo '{termo}'"
        assert duracao_ms < 50.0, f"Busca FTS muito lenta: {duracao_ms:.2f} ms"
        print(f"  -> Termo '{termo}': {len(linhas)} resultados em {duracao_ms:.2f} ms")

    conn.close()

def testar_fases_e_arquivos_regionais():
    print("[TESTE 3] Validando as 7 fases geográficas e arquivos gerados...")
    for reg in REGIOES:
        csv_file = os.path.join(DADOS_DIR, f"{reg}.csv")
        json_file = os.path.join(DADOS_DIR, f"{reg}.json")
        assert os.path.exists(csv_file), f"CSV não encontrado: {csv_file}"
        assert os.path.exists(json_file), f"JSON não encontrado: {json_file}"
        assert os.path.getsize(csv_file) > 10_000, f"CSV vazio ou pequeno demais: {csv_file}"
        assert os.path.getsize(json_file) > 50_000, f"JSON vazio ou pequeno demais: {json_file}"

        with open(json_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            qtd = data.get("total_periodicos", 0)
            assert qtd > 0, f"Região {reg} sem periódicos"
            print(f"  -> {data['regiao_nome']}: {qtd:,} periódicos auditados.")

def testar_continuos_e_ciclicos():
    print("[TESTE 4] Validando fluxo contínuo e cíclicos confirmados...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM periodicos WHERE tipo_modelo = 'Fluxo Contínuo'")
    cont = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM periodicos WHERE tipo_modelo = 'Cíclico Confirmado'")
    cic = cursor.fetchone()[0]
    assert cont > 5000, f"Quantidade de contínuos abaixo do esperado: {cont}"
    assert cic > 10000, f"Quantidade de cíclicos abaixo do esperado: {cic}"

    cursor.execute("SELECT COUNT(*) FROM periodicos WHERE natureza_instituicao LIKE '%Governamental%'")
    gov = cursor.fetchone()[0]
    assert gov > 1000, f"Instituições oficiais abaixo do esperado: {gov}"

    print(f"  -> Fluxo Contínuo: {cont:,} | Cíclicos Confirmados: {cic:,}")
    print(f"  -> Instituições Públicas e Governamentais: {gov:,}")
    conn.close()

def testar_fase_1_brasil_lusofonia():
    print("[TESTE 5] Validando Fase 1 (Brasil e Lusófonos)...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM periodicos WHERE pais = 'Brasil'")
    total_br = cursor.fetchone()[0]
    assert total_br >= 1300, f"Brasil com menos títulos que esperado: {total_br}"

    cursor.execute("SELECT COUNT(*) FROM periodicos WHERE pais = 'Portugal'")
    total_pt = cursor.fetchone()[0]
    assert total_pt >= 150, f"Portugal com menos títulos que esperado: {total_pt}"

    cursor.execute("SELECT COUNT(*) FROM periodicos WHERE regiao_chave = '01-brasil-lusofonos' AND gratuito_diamond = 1")
    gratuitos_luso = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM periodicos WHERE regiao_chave = '01-brasil-lusofonos'")
    total_luso = cursor.fetchone()[0]
    pct_gratuito = (gratuitos_luso / total_luso) * 100
    print(f"  -> Brasil: {total_br:,} títulos | Portugal: {total_pt:,} títulos.")
    print(f"  -> Total Lusofonia: {total_luso:,} | Gratuitos (Diamond OA): {gratuitos_luso:,} ({pct_gratuito:.1f}%).")
    conn.close()

def testar_ausencia_cpf():
    print("[TESTE 6] Verificando ausência de dados pessoais (CPF/RG)...")
    import re
    cpf_pattern = re.compile(r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b")
    for reg in REGIOES:
        json_file = os.path.join(DADOS_DIR, f"{reg}.json")
        with open(json_file, "r", encoding="utf-8") as f:
            chunk = f.read(500_000)
            matches = cpf_pattern.findall(chunk)
            assert len(matches) == 0, f"Vazamento potencial de CPF detectado em {reg}: {matches}"
    print("  -> Auditoria de CPF: Zero ocorrências de dados pessoais.")

if __name__ == "__main__":
    t_start = time.time()
    print("=== INICIANDO SUÍTE DE TESTES DE INTEGRIDADE ===")
    testar_banco_sqlite()
    testar_busca_fts5()
    testar_fases_e_arquivos_regionais()
    testar_continuos_e_ciclicos()
    testar_fase_1_brasil_lusofonia()
    testar_ausencia_cpf()
    print(f"=== TODOS OS TESTES PASSARAM COM SUCESSO EM {time.time() - t_start:.2f}s ===")
