#!/usr/bin/env python3
"""
Monta apps/web/public/data/biblioteca-pro-brumadinho.json a partir do CSV
original e dos resumos gerados por lote.

Saída: JSON com shape compatível com ItemBiblioteca (campo ati="probrumadinho").
"""
import csv, json, re, unicodedata, sys
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
TMP = ROOT / "scripts" / "_tmp-probrumadinho"
CSV_ORIGEM = Path(r"C:\Users\Home\.kimi_openclaw\workspace\documentos_pro_brumadinho\mapa_documentos_pro_brumadinho.csv")
SAIDA = ROOT / "apps" / "web" / "public" / "data" / "biblioteca-pro-brumadinho.json"

TAGS_VALIDAS = {
    "legislacao", "acordo-judicial", "governanca-comites", "prestacao-de-contas",
    "valores-e-financas", "seguranca-hidrica", "reparacao-socioambiental",
    "reparacao-socioeconomica", "mobilidade", "fortalecimento-servico-publico",
    "participacao-popular", "saude", "qualidade-da-agua", "pesquisa-academica",
    "historico-rompimento",
}

# ── Tipo CSV → macro_categoria ──
MACRO_MAP = {
    "Legislação": "Legislacao",
    "Decreto": "Legislacao",
    "Resolução": "Legislacao",
    "Deliberação": "Deliberacao",
    "Acordo Judicial": "Acordo e termos",
    "Termo de Compromisso": "Acordo e termos",
    "Prestação de Contas": "Prestacao de contas",
    "Artigo Acadêmico": "Pesquisa academica",
    "Relatório Ambiental": "Relatorio ambiental",
    "Financeiro": "Financeiro",
    "Manual": "Manual e comunicacao",
    "Comunicado": "Manual e comunicacao",
    "Catálogo": "Manual e comunicacao",
    "Decisão Judicial": "Acordo e termos",
    "Planilha": "Planilha",
}

def normalizar(t):
    t = unicodedata.normalize("NFKD", t)
    return re.sub(r"[^a-z0-9]", "", t.lower())

def slug(titulo):
    t = unicodedata.normalize("NFKD", titulo)
    t = re.sub(r"[^\w\s-]", "", t.lower())
    t = re.sub(r"[\s_]+", "-", t.strip())
    return t[:80]

def main():
    # 1. Carregar CSV
    linhas = []
    with open(CSV_ORIGEM, "r", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            if row.get("status", "").strip() != "200":
                continue
            linhas.append(row)
    print(f"CSV: {len(linhas)} linhas com status 200")

    # 2. Carregar resumos de todos os lotes
    resumos_por_titulo = {}
    for arq in sorted(TMP.glob("resumos-*.json")):
        with open(arq, "r", encoding="utf-8") as f:
            lote = json.load(f)
        for item in lote:
            chave = normalizar(item["titulo"])
            resumos_por_titulo[chave] = item
    print(f"Resumos carregados: {len(resumos_por_titulo)}")

    # 3. Montar itens
    itens = []
    sem_resumo = 0
    tags_invalidas = set()
    for row in linhas:
        titulo = row["titulo"].strip()
        chave = normalizar(titulo)
        r = resumos_por_titulo.get(chave)

        resumo = r["resumo"] if r else None
        resumo_origem = "modelo" if resumo else None
        tags_item = r.get("tags", []) if r else []

        # Validar tags
        tags_limpas = []
        for t in tags_item:
            if t in TAGS_VALIDAS:
                tags_limpas.append(t)
            else:
                tags_invalidas.add(t)

        if not resumo:
            sem_resumo += 1

        # Fallback de tags pelo tipo
        if not tags_limpas:
            tipo = row.get("tipo", "").strip()
            if tipo in ("Legislação", "Decreto", "Resolução"):
                tags_limpas = ["legislacao"]
            elif tipo == "Deliberação":
                tags_limpas = ["governanca-comites"]
            elif tipo == "Prestação de Contas":
                tags_limpas = ["prestacao-de-contas"]
            elif tipo == "Artigo Acadêmico":
                tags_limpas = ["pesquisa-academica"]
            elif tipo in ("Acordo Judicial", "Termo de Compromisso", "Decisão Judicial"):
                tags_limpas = ["acordo-judicial"]
            elif tipo == "Financeiro":
                tags_limpas = ["valores-e-financas"]
            elif tipo == "Relatório Ambiental":
                tags_limpas = ["qualidade-da-agua"]

        tipo_csv = row.get("tipo", "").strip()
        macro = MACRO_MAP.get(tipo_csv, "Outro")

        ano = row.get("ano", "").strip()
        data_iso = f"{ano}-01-01" if ano and ano.isdigit() else None

        item = {
            "id": f"pb-{slug(titulo)}",
            "ati": "probrumadinho",
            "fonte_id": "pro-brumadinho",
            "titulo": titulo,
            "data": data_iso,
            "tipo": tipo_csv if tipo_csv else "Documento",
            "macro_categoria": macro,
            "tags": tags_limpas,
            "temas": [],
            "origem": None,
            "colecoes": [],
            "url": row["url"].strip(),
            "autoria": row.get("orgao", "").strip() or None,
            "resumo": resumo,
            "resumo_origem": resumo_origem,
        }
        itens.append(item)

    # 4. Montar envelope
    envelope = {
        "gerado_em": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
        "fontes": [
            {
                "id": "pro-brumadinho",
                "ati": "probrumadinho",
                "nome": "Portal Pro-Brumadinho (Governo de Minas Gerais)",
                "site": "https://www.mg.gov.br/pro-brumadinho",
                "regioes": "Bacia do Paraopeba e Minas Gerais",
                "licenca": "Documentos oficiais de orgao publico; sem declaracao de licenca especifica no portal. Atos normativos sao de dominio publico (Lei 9.610/98, art. 8, IV). Artigos academicos e relatorios podem ter direitos reservados dos autores.",
                "metodo": "Mapeamento automatizado do portal mg.gov.br/pro-brumadinho em 31/08/2026 (134 documentos catalogados, 129 baixados, 5 links 404). Resumos gerados por IA a partir do texto extraido dos PDFs, com mascaramento previo de CPF.",
                "itens": len(itens),
            }
        ],
        "ficou_de_fora": "5 documentos com link quebrado (404) no portal: Relatorio Semestral 2o sem/2022, Cartilha dos 4 anos, Cartilha 1o ano, e 2 artigos CLAD 2024 (paginas intermediarias). Planilhas XLSX (tabelas de deliberacoes) foram incluidas com resumo derivado do titulo, sem extracao do conteudo das celulas.",
        "itens": itens,
    }

    # 5. Gravar
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    with open(SAIDA, "w", encoding="utf-8") as f:
        json.dump(envelope, f, ensure_ascii=False, indent=1)
    print(f"\nGravado: {SAIDA}")
    print(f"  itens: {len(itens)}")
    print(f"  sem resumo: {sem_resumo}")
    if tags_invalidas:
        print(f"  tags descartadas (fora do vocabulario): {tags_invalidas}")
    print("OK")

if __name__ == "__main__":
    main()
