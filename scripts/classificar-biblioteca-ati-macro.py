#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Classifica a biblioteca ATI com macro-categorias (formato) e tags (temas).

A classificacao e feita por regras de palavra-chave no titulo e no tipo do
item, porque a fonte nao declara taxonomia (Guaicuy/NACAB) ou declara rotulos
muito genericos (AEDAS). As tags sao rotulos legiveis, separados da ponte
TemaAjri usada na analise integrada.

Uso:
  python scripts/classificar-biblioteca-ati-macro.py

Saida:
  - apps/web/public/data/biblioteca-ati.json (atualizado, com backup)
  - C:/tmp/classificacao-ati-macro-relatorio.json
"""

import json
import os
import re
import unicodedata
from collections import Counter
from datetime import datetime
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ARQUIVO = RAIZ / "apps" / "web" / "public" / "data" / "biblioteca-ati.json"
BACKUP = RAIZ / "apps" / "web" / "public" / "data" / "biblioteca-ati.json.bak"
RELATORIO = Path("C:/tmp/classificacao-ati-macro-relatorio.json")


def normalizar(texto: str) -> str:
    s = unicodedata.normalize("NFD", texto.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return " " + s.strip() + " "


def contem(termo: str, texto: str) -> bool:
    return re.search(r"\s" + re.escape(termo) + r"\s", texto) is not None


# Macro-categoria por tipo (chaves em minuscula normalizada).
MAPA_MACRO_POR_TIPO = {
    "jornal": "Jornais e materias",
    "boletins": "Jornais e materias",
    "germinar": "Jornais e materias",
    "nacab em campo": "Jornais e materias",
    "documentos tecnicos": "Estudos e relatorios tecnicos",
    "video": "Videos, audio e imagens",
    "videos": "Videos, audio e imagens",
    "radio": "Videos, audio e imagens",
    "fotos": "Videos, audio e imagens",
    "cartilhas": "Cartilhas e materiais educativos",
    "produtos": "Publicacoes e produtos diversos",
    "publicacao": "Publicacoes e produtos diversos",
    "sem tipo": "Sem classificacao",
}

# Tags e suas palavras-chave. Um documento pode receber varias tags.
REGRAS_TAGS = {
    "meio ambiente": [
        "meio ambiente", "ambiente", "qualidade da agua", "monitoramento da agua",
        "sedimento", "fauna", "flora", "rejeito", "dragagem", "peixe", "peixes",
        "ictiofauna", "contaminacao", "poluicao", "erosao", "mata ciliar",
        "bioacumulo", "vida aquatica", "analises de peixes", "reparacao do meio ambiente",
        "regularizacao ambiental", "estudos socioambientais", "estudos ambientais",
        "auditoria dos estudos", "manejo de rejeitos",
    ],
    "saude": [
        "saude", "ershre", "doenca", "epidemiologico", "dfipa", "pesquisa em saude",
        "risco a saude", "saude humana", "saude coletiva",
    ],
    "indenizacao": [
        "indenizacao", "compensacao", "liquidacao coletiva", "indenizacoes",
        "acoes individuais de indenizacao", "debate indenizacao",
    ],
    "PTR": [
        "ptr", "programa de transferencia de renda", "renda", "transferencia de renda",
    ],
    "cultura e lazer": [
        "cultura", "patrimonio", "memoria", "memorial", "turismo", "festejo",
        "romaria", "lazer", "festival", "cinema", "bloco", "despfile", "carnaval",
        "calendario biocultural", "rota do turismo", "cultural", "joias",
    ],
    "agua": [
        "agua", "abastecimento", "abastecimento de agua", "captacao", "captacao de agua",
        "fornecimento de agua", "agua potavel", "qualidade da agua", "caminhao pipa",
        "reservatorio", "seguranca hidrica", "volume morto", "agua subterranea",
    ],
    "povos e comunidades tradicionais": [
        "povos e comunidades tradicionais", "comunidades tradicionais", "quilombo",
        "indigena", "povos tradicionais", "comunidade tradicional", "reconhecimento de quilombo",
    ],
    "participacao": [
        "participacao", "forum", "forum regional", "reuniao", "reunioes", "audiencia",
        "consulta publica", "comunicacao", "atingidos", "comunidades atingidas",
        "vozes do paraopeba", "espacos participativos", "participacao informada",
        "encontro da bacia", "matriz de danos",
    ],
    "educacao": [
        "educacao", "peabp", "educacao ambiental", "educacao financeira", "formacao",
        "curso", "cursos", "profissionalizante", "ensino", "escola", "cartilha",
    ],
    "reparacao": [
        "reparacao", "reparacao integral", "reparacao socioambiental", "acordo judicial",
        "plano de reparacao", "entidade gestora", "acordo de reparacao",
        "conselheiros", "conselheiro",  # governance do acordo
    ],
    "emergencial": [
        "auxilio emergencial", "demandas emergenciais", "medidas emergenciais",
        "pagamento emergencial", "frente emergencial", "emergencia", "emergencial",
    ],
    "mulheres": [
        "mulheres", "encontro das mulheres atingidas", "eixo mulheres",
    ],
    "criancas": [
        "criancas", "adolescentes", "infancia", "dia das criancas",
    ],
    "populacao negra": [
        "populacao negra", "negra",
    ],
    "pessoas com deficiencia": [
        "pessoas com deficiencia", "deficiencia", "pcd",
    ],
    "regularizacao fundiaria": [
        "regularizacao fundiaria", "desapropriacao", "terra", "posse", "fundos e fundiarios",
    ],
    "seguranca das estruturas": [
        "seguranca das estruturas", "barragem", "estabilidade", "fator de seguranca",
        "prisma", "monitoramento tecnico", "estrutura remanescente",
    ],
    "direitos humanos": [
        "direitos humanos", "defensoria publica", "ministerio publico", "mpmg",
        "justica", "judiciario", "tribunal", "tjmg",
    ],
}


def macro_categoria(tipo: str, titulo_norm: str) -> str:
    # Normaliza tipo para chave do mapa (remove acentos, hifens, lower)
    chave_tipo = unicodedata.normalize("NFD", tipo.lower())
    chave_tipo = "".join(c for c in chave_tipo if unicodedata.category(c) != "Mn")
    chave_tipo = chave_tipo.replace("-", " ").strip()
    if chave_tipo in MAPA_MACRO_POR_TIPO:
        return MAPA_MACRO_POR_TIPO[chave_tipo]
    return "Sem classificacao"


def tags_do_item(titulo_norm: str, macro: str) -> list[str]:
    tags = []
    for tag, termos in REGRAS_TAGS.items():
        for termo in termos:
            if contem(termo, titulo_norm):
                tags.append(tag)
                break
    # Desambiguacao: se pegou "meio ambiente" e "agua", "agua" ja esta contido;
    # mantemos ambas porque "agua" e um recorte util.
    return tags


def main():
    with open(ARQUIVO, "r", encoding="utf-8") as f:
        data = json.load(f)

    relatorio = {"itens": []}
    contagem_macro = Counter()
    contagem_tags = Counter()

    for item in data["itens"]:
        titulo_norm = normalizar(item["titulo"])
        macro = macro_categoria(item.get("tipo") or "Sem tipo", titulo_norm)
        tags = tags_do_item(titulo_norm, macro)
        item["macro_categoria"] = macro
        item["tags"] = tags
        contagem_macro[macro] += 1
        for t in tags:
            contagem_tags[t] += 1
        relatorio["itens"].append({
            "id": item["id"],
            "ati": item["ati"],
            "titulo": item["titulo"],
            "tipo": item.get("tipo"),
            "macro_categoria": macro,
            "tags": tags,
        })

    relatorio.update({
        "gerado_em": datetime.now().isoformat(),
        "total": len(data["itens"]),
        "macro_categorias": dict(contagem_macro.most_common()),
        "tags": dict(contagem_tags.most_common()),
    })

    # Backup.
    if BACKUP.exists():
        os.replace(ARQUIVO, BACKUP)
    else:
        os.rename(ARQUIVO, BACKUP)

    with open(ARQUIVO, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    RELATORIO.parent.mkdir(parents=True, exist_ok=True)
    with open(RELATORIO, "w", encoding="utf-8") as f:
        json.dump(relatorio, f, ensure_ascii=False, indent=2)

    print("Macro-categorias:")
    for macro, n in contagem_macro.most_common():
        print(f"  {macro}: {n}")
    print("\nTags mais frequentes:")
    for tag, n in contagem_tags.most_common(15):
        print(f"  {tag}: {n}")
    print(f"\nRelatorio: {RELATORIO}")


if __name__ == "__main__":
    main()
