#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/gerar-dataset-sabia-7b.py
Gera o dataset de instrução para destilação e fine-tuning do Sabiá 7B (Seu Nonô) no Ollama.
Consolida pares de pergunta/resposta e raciocínio a partir de:
- apps/web/data/noticias-portal.json (18 investigações e relatórios com dados fiscais e orçamentários)
- etl/finetuning/dados-seu-nono.jsonl (pares prévios)
- apps/web/app/components/SeuNonoData.ts
Gera: etl/finetuning/dataset-seu-nono-v1.jsonl
"""

import json
import re
from pathlib import Path

SYSTEM_PROMPT = """Você é o Seu Nonô, o assistente cívico do portal Controle Popular (controlepopular.com.br).
Sua missão é explicar dados públicos e direitos para a população com simplicidade, firmeza e respeito.
Suas regras inegociáveis:
1. Fale na voz direta: sujeito, verbo e predicado. Frases curtas.
2. Seja acolhedor e didático, com tom mineiro sereno e firme.
3. Termo técnico ou sigla deve ser explicado imediatamente com um travessão "-".
4. Todo número deve vir do dado oficial fornecido, nunca inventado.
5. Se não souber ou não constar na fonte, diga com humildade: "Esse número não consta nos registros oficiais que tenho aqui".
6. Nunca dê opinião partidária; apresente o fato, a fonte oficial e o caminho para o cidadão fiscalizar."""

def carregar_dados_existentes():
    itens = []
    caminho_base = Path("etl/finetuning/dados-seu-nono.jsonl")
    if caminho_base.exists():
        with open(caminho_base, "r", encoding="utf-8") as f:
            for linha in f:
                linha = linha.strip()
                if linha:
                    try:
                        d = json.loads(linha)
                        itens.append({
                            "system": SYSTEM_PROMPT,
                            "instruction": d.get("instrucao", ""),
                            "input": f"Frente: {d.get('frente', 'geral')}",
                            "output": d.get("saida", ""),
                            "frente": d.get("frente", "geral")
                        })
                    except Exception:
                        pass
    return itens

def gerar_pares_de_noticias():
    itens = []
    caminho_noticias = Path("apps/web/data/noticias-portal.json")
    if not caminho_noticias.exists():
        return itens

    with open(caminho_noticias, "r", encoding="utf-8") as f:
        noticias = json.load(f)

    for n in noticias:
        slug = n.get("slug", "")
        titulo = n.get("titulo", "")
        resumo = n.get("resumo", "")
        frente = n.get("frente", "")
        subfrente = n.get("subfrente", "")
        metricas = n.get("metricas", [])
        recomendacao = n.get("recomendacaoVerificar", "")
        paragrafos = n.get("paragrafos", [])

        # Par 1: Sobre o que é a matéria
        itens.append({
            "system": SYSTEM_PROMPT,
            "instruction": f"O que diz a reportagem sobre {titulo}?",
            "input": f"Fonte oficial do ONSA: /noticias/{slug}",
            "output": f"{resumo}\n\nO levantamento completo foi realizado pelo ONSA - Observatório Nacional Socioambiental e está publicado em /noticias/{slug}.",
            "frente": frente
        })

        # Par 2: Quais os principais números e métricas
        if metricas:
            metricas_texto = "; ".join([f"{m.get('rotulo')}: {m.get('valor')}" for m in metricas])
            itens.append({
                "system": SYSTEM_PROMPT,
                "instruction": f"Quais são os principais números de {subfrente or titulo}?",
                "input": f"Indicadores consolidados: {metricas_texto}",
                "output": f"Os dados oficiais levantados pelo portal apontam os seguintes números para {subfrente}:\n" +
                          "\n".join([f"- {m.get('rotulo')}: {m.get('valor')}" for m in metricas]) +
                          f"\n\nVocê pode auditar os dados em /noticias/{slug}.",
                "frente": frente
            })

        # Par 3: Como verificar os dados
        if recomendacao:
            itens.append({
                "system": SYSTEM_PROMPT,
                "instruction": f"Como posso verificar por conta própria os dados de {titulo}?",
                "input": f"Recomendação de verificação: {recomendacao}",
                "output": f"{recomendacao}\n\nVocê também encontra mais detalhes e links diretos para os órgãos públicos em /noticias/{slug}.",
                "frente": frente
            })

        # Par 4 a N: Pares específicos a partir dos parágrafos com fatos
        for p in paragrafos:
            # Detecta perguntas orçamentárias e financeiras
            if "R$" in p or "LOA" in p or "orçamento" in p or "bilhões" in p or "milhões" in p:
                itens.append({
                    "system": SYSTEM_PROMPT,
                    "instruction": f"O que os dados mostram sobre o orçamento e gastos em {subfrente}?",
                    "input": f"Trecho verificado da matéria /noticias/{slug}",
                    "output": f"{p}\n\nFonte: ONSA — Observatório Nacional Socioambiental (/noticias/{slug}).",
                    "frente": frente
                })
            elif "barragem" in p.lower() or "montante" in p.lower():
                itens.append({
                    "system": SYSTEM_PROMPT,
                    "instruction": f"Qual a situação das barragens em {subfrente}?",
                    "input": f"Trecho verificado da matéria /noticias/{slug}",
                    "output": f"{p}\n\nFonte: SIGBM/ANM e ONSA (/noticias/{slug}).",
                    "frente": frente
                })
            elif "defensoria" in p.lower() or "comarcas" in p.lower():
                itens.append({
                    "system": SYSTEM_PROMPT,
                    "instruction": f"Qual a cobertura da Defensoria Pública em Minas Gerais?",
                    "input": f"Trecho verificado da matéria /noticias/{slug}",
                    "output": f"{p}\n\nFonte: DPMG e ONSA (/noticias/{slug}).",
                    "frente": frente
                })
            elif "contrato" in p.lower() or "pncp" in p.lower():
                itens.append({
                    "system": SYSTEM_PROMPT,
                    "instruction": f"Como funcionam as compras e contratos em {subfrente}?",
                    "input": f"Trecho verificado da matéria /noticias/{slug}",
                    "output": f"{p}\n\nFonte: PNCP e Controle Popular (/noticias/{slug}).",
                    "frente": frente
                })

    return itens

def main():
    print("Iniciando geração do dataset para o Sabiá 7B...")
    existentes = carregar_dados_existentes()
    print(f"Pares existentes carregados: {len(existentes)}")

    de_noticias = gerar_pares_de_noticias()
    print(f"Novos pares gerados a partir das 18 investigações: {len(de_noticias)}")

    todos = existentes + de_noticias
    destino = Path("etl/finetuning/dataset-seu-nono-v1.jsonl")
    destino.parent.mkdir(parents=True, exist_ok=True)

    with open(destino, "w", encoding="utf-8") as f:
        for item in todos:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")

    print(f"Sucesso! Dataset gerado com {len(todos)} pares de instrução em {destino}.")

if __name__ == "__main__":
    main()
