"""etl.apis.mpmg_notas_tecnicas — coleta de Notas Técnicas do MPMG
para `biblioteca-desastres` (fonte: mpmg-notas-tecnicas).

Fonte: MP Normas (mpnormas.mpmg.mp.br) — sistema KORA de atos normativos.
Escopo: Notas Técnicas sobre Fundão, Brumadinho, Paraopeba, Rio Doce.

DESCOBERTA IMPORTANTE (06/09/2026):
- O MPMG criou o NUCARD (Núcleo de Acompanhamento de Reparações por Desastres)
  em 06/02/2025 (Resolução PGJ nº 6)
- O NUCARD coordena a atuação institucional para reparação dos desastres de
  Mariana (2015) e Brumadinho (2019)
- URL: https://www.mpmg.mp.br/portal/menu/areas-de-atuacao/reparacao-por-desastres/

ARMADILHAS:
1. MP Normas usa KORA (não WordPress) — scraping de HTML, não API REST.
2. Resultados são carregados via JavaScript — requests simples não funcionam.
3. Sistema LumisXP (mpmg.mp.br) — CMS customizado, não WordPress.
"""
import argparse
import json
import os
import re
import time
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup

USER_AGENT = "ControlePopular/1.0 (coletor; contato: controlepopular@controlepopular.com.br)"
BASE_URL = "https://mpnormas.mpmg.mp.br"
FONTE_ID = "mpmg-notas-tecnicas"

# Termos de busca relevantes para desastres ambientais
TERMOS_BUSCA = [
    "Fundão",
    "Brumadinho",
    "Paraopeba",
    "Rio Doce",
    "Mariana",
    "Samarco",
    "barragem",
    "rejeito",
    "atingido",
    "reparação",
    "desastre",
    "ambiental",
]

# Tipos de norma relevantes
TIPOS_NORMA = [
    "NOTA TÉCNICA",
    "NOTA TÉCNICA CONJUNTA",
    "ORIENTAÇÃO TÉCNICO-JURÍDICA",
    "ORIENTAÇÃO TÉCNICO-JURÍDICA CONJUNTA",
]


def buscar_atos(palavra_chave: str, tipo_norma: str | None = None) -> list[dict]:
    """Busca atos normativos no MP Normas."""
    items = []
    
    params = {
        "pid": "1",
        "sid": "1",
        "keywords": palavra_chave,
        "resultadosPagina": "50",
    }
    if tipo_norma:
        params["tiponormativo"] = tipo_norma
    
    try:
        resp = requests.get(
            f"{BASE_URL}/atosNormativos.php",
            params=params,
            headers={"User-Agent": USER_AGENT},
            timeout=30,
        )
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"[mpmg_notas_tecnicas] Erro ao buscar '{palavra_chave}': {e}")
        return items
    
    soup = BeautifulSoup(resp.text, "html.parser")
    
    # Procurar por resultados (tabela ou lista)
    # O KORA geralmente renderiza resultados em divs ou tabelas
    resultado_div = soup.find("div", {"id": "resultado"})
    if not resultado_div:
        # Tentar encontrar qualquer conteúdo de resultado
        resultado_div = soup.find("div", class_="resultado") or soup
    
    # Procurar por links de atos
    for link in resultado_div.find_all("a", href=True):
        href = link.get("href", "")
        titulo = link.get_text(strip=True)
        
        if not titulo or len(titulo) < 10:
            continue
        
        # Filtrar apenas links relevantes
        if "registro" in href or "ver" in href or "ato" in href.lower():
            url_completa = f"{BASE_URL}/{href}" if not href.startswith("http") else href
            
            items.append({
                "titulo": titulo,
                "url": url_completa,
                "palavra_chave": palavra_chave,
            })
    
    return items


def extrair_dados_ato(url: str) -> dict | None:
    """Extrai dados de um ato normativo individual."""
    try:
        resp = requests.get(
            url,
            headers={"User-Agent": USER_AGENT},
            timeout=30,
        )
        resp.raise_for_status()
    except requests.RequestException:
        return None
    
    soup = BeautifulSoup(resp.text, "html.parser")
    
    dados = {
        "url": url,
        "titulo": None,
        "data": None,
        "tipo": None,
        "orgao": None,
        "resumo": None,
    }
    
    # Extrair título
    titulo_elem = soup.find("h1") or soup.find("h2") or soup.find("title")
    if titulo_elem:
        dados["titulo"] = titulo_elem.get_text(strip=True)
    
    # Extrair tipo de norma
    for label in soup.find_all(["label", "span", "td"]):
        texto = label.get_text(strip=True).upper()
        if "NOTA TÉCNICA" in texto:
            dados["tipo"] = "Nota Técnica"
            break
        elif "ORIENTAÇÃO" in texto:
            dados["tipo"] = "Orientação Técnico-Jurídica"
            break
    
    # Extrair órgão/origem
    for label in soup.find_all(["label", "span", "td"]):
        texto = label.get_text(strip=True)
        if "ORIGEM" in texto.upper() or "ÓRGÃO" in texto.upper():
            # O órgão geralmente está no próximo elemento
            proximo = label.find_next(["span", "td", "div"])
            if proximo:
                dados["orgao"] = proximo.get_text(strip=True)
            break
    
    # Extrair data
    for label in soup.find_all(["label", "span", "td"]):
        texto = label.get_text(strip=True)
        if "DATA" in texto.upper() or "PUBLICAÇÃO" in texto.upper():
            proximo = label.find_next(["span", "td", "div"])
            if proximo:
                dados["data"] = proximo.get_text(strip=True)
            break
    
    # Extrair resumo/ementa
    for label in soup.find_all(["label", "span", "td"]):
        texto = label.get_text(strip=True)
        if "EMENTA" in texto.upper() or "ASSUNTO" in texto.upper():
            proximo = label.find_next(["span", "td", "div", "p"])
            if proximo:
                dados["resumo"] = proximo.get_text(strip=True)[:500]
            break
    
    # Se não encontrou título, usar o primeiro h1 ou h2
    if not dados["titulo"]:
        h1 = soup.find("h1")
        if h1:
            dados["titulo"] = h1.get_text(strip=True)
    
    return dados


def coletar_notas_tecnicas() -> list[dict]:
    """Coleta notas técnicas do MPMG sobre desastres ambientais."""
    items = []
    urls_vistas = set()
    
    for termo in TERMOS_BUSCA:
        print(f"[mpmg_notas_tecnicas] buscando: {termo}")
        
        for tipo in TIPOS_NORMA:
            resultados = buscar_atos(termo, tipo)
            
            for r in resultados:
                if r["url"] in urls_vistas:
                    continue
                urls_vistas.add(r["url"])
                
                # Extrair dados detalhados
                dados = extrair_dados_ato(r["url"])
                if dados:
                    items.append({
                        "id": f"{FONTE_ID}:{hash(r['url']) % 10**8}",
                        "desastre": _classificar_desastre(r["titulo"] + " " + (dados.get("resumo") or "")),
                        "bacia": _classificar_bacia(r["titulo"] + " " + (dados.get("resumo") or "")),
                        "titulo": dados.get("titulo") or r["titulo"],
                        "data": dados.get("data"),
                        "tipo": dados.get("tipo") or tipo,
                        "orgao": dados.get("orgao") or "MPMG",
                        "esfera": "estadual",
                        "uf": "MG",
                        "tags": ["mpmg-notas-tecnicas", termo.lower().replace(" ", "-")],
                        "resumo": dados.get("resumo"),
                        "url": r["url"],
                        "fonteId": FONTE_ID,
                        "coletadoEm": datetime.now(timezone.utc).isoformat(),
                        "regiao_mg": _classificar_regiao(r["titulo"] + " " + (dados.get("resumo") or "")),
                        "classificavel": True,
                    })
                
                time.sleep(1)  # Pausa entre requests
        
        time.sleep(2)  # Pausa entre termos
    
    return items


def _classificar_desastre(texto: str) -> str:
    """Classifica o desastre com base no texto."""
    texto_lower = texto.lower()
    if any(t in texto_lower for t in ["fundão", "fundao", "mariana", "samarco"]):
        return "mariana"
    if any(t in texto_lower for t in ["brumadinho", "córrego do feijão", "corrego do feijao"]):
        return "brumadinho"
    return "outro"


def _classificar_bacia(texto: str) -> str:
    """Classifica a bacia com base no texto."""
    texto_lower = texto.lower()
    if any(t in texto_lower for t in ["paraopeba", "brumadinho"]):
        return "paraopeba"
    if any(t in texto_lower for t in ["rio doce", "doce", "mariana", "samarco", "fundão"]):
        return "doce"
    return "geral"


def _classificar_regiao(texto: str) -> str:
    """Classifica a região de MG com base no texto."""
    texto_lower = texto.lower()
    if any(t in texto_lower for t in ["paraopeba", "brumadinho"]):
        return "Paraopeba"
    if any(t in texto_lower for t in ["rio doce", "doce", "mariana", "samarco"]):
        return "Rio Doce"
    if any(t in texto_lower for t in ["jequitinhonha"]):
        return "Jequitinhonha"
    if any(t in texto_lower for t in ["são francisco", "sao francisco"]):
        return "São Francisco"
    return "MG"


def main():
    parser = argparse.ArgumentParser(description="Coleta MPMG Notas Técnicas")
    parser.add_argument("--seco", action="store_true", help="Dry run")
    parser.add_argument("--json", action="store_true", help="Gerar JSON")
    args = parser.parse_args()
    
    itens = coletar_notas_tecnicas()
    
    if args.seco:
        print(f"DRY RUN: {len(itens)} itens seriam coletados")
        return
    
    if args.json:
        caminho = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
            "apps", "web", "data", "mpmg-notas-tecnicas.json"
        )
        os.makedirs(os.path.dirname(caminho), exist_ok=True)
        with open(caminho, "w", encoding="utf-8") as f:
            json.dump({
                "fonte": FONTE_ID,
                "itens": itens,
                "geradoEm": datetime.now(timezone.utc).isoformat(),
            }, f, ensure_ascii=False, indent=2)
        print(f"JSON salvo: {len(itens)} itens em {caminho}")
        return
    
    print(f"Total: {len(itens)} itens coletados")


if __name__ == "__main__":
    main()
