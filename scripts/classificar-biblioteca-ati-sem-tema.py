#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Classifica itens da biblioteca ATI sem tema livre atribuindo TemaAjri por
regras de palavras-chave no titulo.

Motivo da escolha por regras em vez de TF-IDF puro: os 254 itens sem tema
sao majoritariamente periodicos genericos ("Boletim Semanal", "Piracema",
"Travessia", "Germinar", "Nacab em Campo", "Video-retrato") cujo titulo nao
diz o assunto. Um modelo estatistico tende a atribuir um tema qualquer a
todos eles — o que insinua que a fonte disse algo que nao disse. As regras
sao transparentes, auditaveis e so classificam quando o proprio titulo traz
palavras-chave de um eixo tecnico.

O resultado vai para `temas_ajri_inferred` (inferido), nunca para `temas`.
A UI deve rotular esses itens como "tema inferido por similaridade de titulo".

Uso:
  python scripts/classificar-biblioteca-ati-sem-tema.py

Saida:
  - apps/web/public/data/biblioteca-ati.json (atualizado, com backup)
  - C:/tmp/classificacao-ati-relatorio.json (resumo e incertos)
"""

import json
import os
import re
import unicodedata
from collections import defaultdict
from datetime import datetime
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ARQUIVO = RAIZ / "apps" / "web" / "public" / "data" / "biblioteca-ati.json"
BACKUP = RAIZ / "apps" / "web" / "public" / "data" / "biblioteca-ati.json.bak"
RELATORIO = Path("C:/tmp/classificacao-ati-relatorio.json")


# Replicado de apps/web/lib/paraopeba/auditoria-ajri.ts
TEMA_AJRI_LABEL = {
    "qualidade-da-agua": "Qualidade da Água",
    "plano-de-reparacao": "Plano de Reparação",
    "licenciamento-ambiental": "Licenciamento Ambiental",
    "sistemas-de-contencao": "Sistemas de Contenção",
    "solos-e-sedimentos": "Solos e Sedimentos",
    "manejo-de-rejeitos": "Manejo de Rejeitos",
    "fauna": "Fauna",
    "dragagem": "Dragagem",
    "comunicacao-e-relacionamento": "Comunicação e Relacionamento",
    "flora": "Flora",
    "frentes-emergenciais": "Frentes Emergenciais",
    "patrimonio-cultural": "Patrimônio Cultural",
    "qualidade-do-ar": "Qualidade do Ar",
    "seguranca-das-estruturas-remanescentes": "Segurança das Estruturas Remanescentes",
    "sistema-de-abastecimento-de-agua": "Sistema de Abastecimento de Água",
    "seguranca-hidrica": "Segurança Hídrica",
    "risco-saude-publica": "Risco Saúde Pública",
    "agua-subterranea": "Água Subterrânea",
    "risco-ecologico": "Risco Ecológico",
    "risco-meio-ambiente": "Risco Meio Ambiente",
    "agua-potavel": "Água Potável",
    "programas-de-compensacao": "Programas de Compensação",
    "peabp": "PEABP",
    "seguranca-do-alimento": "Segurança do Alimento",
    "cronograma": "Cronograma",
}


def normalizar(texto: str) -> str:
    """Minuscula, sem acento, sem pontuacao, espacos colapsados."""
    s = unicodedata.normalize("NFD", texto.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return " " + s.strip() + " "


# Expressoes regulares com espacos em branco ao redor para evitar match parcial.
def contem(termo: str, texto: str) -> bool:
    return re.search(r"\s" + re.escape(termo) + r"\s", texto) is not None


# Cada regra tem uma lista de termos e um peso. O peso minimo para atribuir o
# tema e 1.0 (um termo de peso 1 ou dois de peso 0.5).
REGRAS = {
    "qualidade-da-agua": [
        ("qualidade da agua", 1.0),
        ("monitoramento da agua", 1.0),
        ("qualidade da agua do rio", 1.0),
        ("qualidade agua", 0.8),
        ("agua e sedimento", 0.8),
        ("monitoramento agua", 0.6),
    ],
    "plano-de-reparacao": [
        ("plano de reparacao", 1.0),
        ("reparacao integral", 0.8),
        ("reparacao socioambiental", 0.8),
        ("plano de trabalho das atis", 0.6),
    ],
    "licenciamento-ambiental": [
        ("licenciamento ambiental", 1.0),
        ("licenca ambiental", 1.0),
        ("licenciamento", 0.8),
    ],
    "sistemas-de-contencao": [
        ("sistema de contencao", 1.0),
        ("contencao de rejeitos", 1.0),
        ("barragem de contencao", 1.0),
        ("contencao", 0.7),
    ],
    "solos-e-sedimentos": [
        ("solos e sedimentos", 1.0),
        ("sedimento", 0.8),
        ("solo contaminado", 0.8),
        ("sedimentos fluviais", 0.8),
    ],
    "manejo-de-rejeitos": [
        ("manejo de rejeitos", 1.0),
        ("rejeito de mineracao", 0.8),
        ("rejeitos", 0.6),
    ],
    "fauna": [
        ("fauna", 1.0),
        ("ictiofauna", 1.0),
        ("mortandade de peixes", 1.0),
        ("peixes mortos", 1.0),
        ("vida aquatica", 0.8),
        ("bioacumulo", 0.8),
    ],
    "dragagem": [
        ("dragagem", 1.0),
        ("dragagem do rio", 1.0),
        ("dragagem de rejeitos", 1.0),
    ],
    "comunicacao-e-relacionamento": [
        ("comunicacao", 0.5),
        ("participacao", 0.5),
        ("reuniao", 0.5),
        ("atingidos", 0.5),
        ("comunidades atingidas", 0.6),
        ("audiencia publica", 0.8),
        ("consulta publica", 0.8),
        ("espacos participativos", 0.8),
        ("participacao informada", 0.8),
        ("vozes do paraopeba", 1.0),
        ("jornal", 0.6),
        ("relacionamento", 0.6),
        ("reunioes intercomunitarias", 0.8),
        ("encontro das mulheres atingidas", 0.8),
        ("encontro da bacia", 0.8),
        ("forum regional", 0.8),
    ],
    "flora": [
        ("flora", 1.0),
        ("vegetacao", 0.8),
        ("reflorestamento", 0.8),
        ("mata ciliar", 0.8),
    ],
    "frentes-emergenciais": [
        ("frente emergencial", 1.0),
        ("frentes emergenciais", 1.0),
        ("medidas emergenciais", 1.0),
        ("demanda emergencial", 0.8),
        ("demandas emergenciais", 0.8),
        ("auxilio emergencial", 0.6),  # compensacao e mais forte abaixo
    ],
    "patrimonio-cultural": [
        ("patrimonio cultural", 1.0),
        ("patrimonio historico", 0.8),
        ("memoria", 0.6),
        ("memorial", 0.6),
        ("festejo", 0.5),
        ("cultura", 0.5),
    ],
    "qualidade-do-ar": [
        ("qualidade do ar", 1.0),
        ("poluicao do ar", 0.8),
        ("poeira", 0.6),
    ],
    "seguranca-das-estruturas-remanescentes": [
        ("seguranca das estruturas", 1.0),
        ("seguranca de barragem", 1.0),
        ("barragem remanescente", 1.0),
        ("estabilidade", 0.6),
        ("fator de seguranca", 0.8),
        ("prisma", 0.6),
    ],
    "sistema-de-abastecimento-de-agua": [
        ("abastecimento de agua", 1.0),
        ("captacao de agua", 1.0),
        ("fornecimento de agua", 1.0),
        ("sistema de abastecimento", 1.0),
        ("nova captacao", 0.8),
    ],
    "seguranca-hidrica": [
        ("seguranca hidrica", 1.0),
        ("volume morto", 0.8),
        ("reservatorio", 0.6),
        ("garantia hidrica", 0.8),
    ],
    "risco-saude-publica": [
        ("saude publica", 1.0),
        ("risco a saude", 1.0),
        ("riscos a saude", 1.0),
        ("saude humana", 0.8),
        ("riscos a saude humana", 1.0),
        ("consulta publica sobre saude", 1.0),
        ("ershre", 1.0),
        ("saude coletiva", 0.8),
        ("epidemiologico", 0.8),
        ("doenca", 0.5),
    ],
    "agua-subterranea": [
        ("agua subterranea", 1.0),
        ("aguas subterraneas", 1.0),
        ("aquifero", 0.8),
        ("lencol freatico", 0.8),
        ("subterraneo", 0.6),
    ],
    "risco-ecologico": [
        ("risco ecologico", 1.0),
        ("riscos ecologicos", 1.0),
    ],
    "risco-meio-ambiente": [
        ("risco meio ambiente", 1.0),
        ("riscos ao meio ambiente", 1.0),
    ],
    "agua-potavel": [
        ("agua potavel", 1.0),
        ("caminhao pipa", 1.0),
        ("abastecimento alternativo", 0.8),
    ],
    "programas-de-compensacao": [
        ("compensacao", 1.0),
        ("indenizacao", 1.0),
        ("auxilio emergencial", 1.0),
        ("novo auxilio emergencial", 1.0),
        ("pagamento emergencial", 1.0),
        ("retomada do pagamento", 1.0),
        ("retomada dos pagamentos", 1.0),
        ("pagamento", 0.6),
        ("liquidacao coletiva", 1.0),
        ("ptr", 0.8),
        ("programa de transferencia de renda", 1.0),
    ],
    "peabp": [
        ("peabp", 1.0),
        ("educacao ambiental", 1.0),
        ("educacao socioambiental", 0.8),
    ],
    "seguranca-do-alimento": [
        ("seguranca do alimento", 1.0),
        ("seguranca alimentar", 0.8),
        ("contaminacao de alimentos", 0.8),
        ("alimento", 0.5),
    ],
    "cronograma": [
        ("cronograma", 1.0),
        ("prazo", 0.6),
        ("atraso", 0.6),
        ("descumprimento de prazo", 1.0),
    ],
}

# Titulos que sao claramente periodicos ou midia generica — so sao classificados
# se houver um termo FORTE (peso 1.0) de algum tema; caso contrario, ficam sem.
MARCAS_GENERICAS = [
    "boletim semanal",
    "boletim",
    "piracema",
    "travessia",
    "germinar",
    "nacab em campo",
    "video retrato",
    "video retratos",
    "cafe com prosa",
    "direto ao ponto",
    "aguas gerais",
    "conheca nosso trabalho",
    "calendario biocultural",
    "folder",
    "almanaque",
    "rota do turismo",
    "jornal",
    "cartilha de educacao financeira",  # generica — nao educacao ambiental
    "cartilha para feirantes",
    "romaria",
    "dossie acesso a justica",
]


def eh_generico(titulo_norm: str) -> bool:
    return any(contem(m, titulo_norm) for m in MARCAS_GENERICAS)


def classificar_item(titulo: str):
    texto = normalizar(titulo)
    generico = eh_generico(texto)
    temas = []
    scores = {}
    for tema, regras in REGRAS.items():
        score = 0.0
        for termo, peso in regras:
            if contem(termo, texto):
                score += peso
        scores[tema] = round(score, 2)
        # Itens genericos so entram se houver um match FORTE (peso >= 1.0 de
        # uma so palavra ou combinacao clara). Itens nao genericos entram com
        # threshold mais baixo (0.6) para permitir combinacoes de termos leves.
        limite = 1.0 if generico else 0.6
        if score >= limite:
            temas.append(tema)
    return temas, scores, generico


def main():
    with open(ARQUIVO, "r", encoding="utf-8") as f:
        data = json.load(f)

    itens = data["itens"]
    classificacoes = []
    inferidos_por_ati = defaultdict(int)

    for item in itens:
        if item.get("temas") and len(item["temas"]) > 0:
            # Limpa campo antigo se existir (reprocessamento).
            item.pop("temas_ajri_inferred", None)
            continue
        temas, scores, generico = classificar_item(item["titulo"])
        item["temas_ajri_inferred"] = temas
        if temas:
            inferidos_por_ati[item["ati"]] += 1
        classificacoes.append({
            "id": item["id"],
            "ati": item["ati"],
            "titulo": item["titulo"],
            "tipo": item.get("tipo"),
            "temas_ajri_inferred": temas,
            "scores": scores,
            "generico": generico,
            "incerto": len(temas) == 0,
        })

    # Backup.
    if BACKUP.exists():
        os.replace(ARQUIVO, BACKUP)
    else:
        os.rename(ARQUIVO, BACKUP)

    with open(ARQUIVO, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # Relatorio.
    incertos = [c for c in classificacoes if c["incerto"]]
    relatorio = {
        "gerado_em": datetime.now().isoformat(),
        "total_itens": len(itens),
        "itens_sem_tema_livre": len(classificacoes),
        "inferidos_com_tema": sum(1 for c in classificacoes if c["temas_ajri_inferred"]),
        "incertos": len(incertos),
        "inferidos_por_ati": dict(inferidos_por_ati),
        "amostra_incertos": incertos[:40],
        "classificacoes": classificacoes,
    }
    RELATORIO.parent.mkdir(parents=True, exist_ok=True)
    with open(RELATORIO, "w", encoding="utf-8") as f:
        json.dump(relatorio, f, ensure_ascii=False, indent=2)

    print(f"Itens sem tema livre: {len(classificacoes)}")
    print(f"Com tema inferido: {relatorio['inferidos_com_tema']}")
    print(f"Incertos: {relatorio['incertos']}")
    print(f"Por ATI: {dict(inferidos_por_ati)}")
    print(f"Relatorio: {RELATORIO}")


if __name__ == "__main__":
    main()
