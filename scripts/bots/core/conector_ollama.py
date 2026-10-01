#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/bots/core/conector_ollama.py

Wrapper de integração com o motor local do Ollama para triagem e síntese cívica.

═══ OBJETIVO CÍVICO & EDITORIAL ═══
- Processa atos oficiais, editais, nomeações, projetos de lei, licenças ambientais e TACs.
- Classifica por eixos temáticos do portal.
- Gera microresumos cívicos em até 25 palavras seguindo a regra editorial (AGENTS.md § 7):
  "O número vem do dado; o modelo só embrulha. Sem insinuação, sem conclusão acusatória."
- Se o Ollama estiver offline, recorre a fallback semântico determinístico transparente.
"""

import json
import urllib.request
from typing import Any, Dict, Optional

OLLAMA_URL_PADRAO = "http://localhost:11434/api/generate"
MODELO_PADRAO = "qwen2.5-coder:7b"


def classificar_e_resumir_ato(
    texto_ato: str,
    tipo_contexto: str = "geral",
    modelo: str = MODELO_PADRAO,
    host_ollama: str = OLLAMA_URL_PADRAO,
    timeout: int = 30
) -> Dict[str, Any]:
    """
    Submete um ato público ao Ollama local para classificação e extração de entidades em JSON.
    """
    prompt = f"""Você é o auditor cívico popular do portal Controle Popular (ONSA).
Analise o ato oficial abaixo ({tipo_contexto}) e retorne ESTRITAMENTE um objeto JSON válido (sem markdown, sem preâmbulo).

ATO OFICIAL:
\"\"\"
{texto_ato[:2000]}
\"\"\"

CAMPOS OBRIGATÓRIOS DO JSON:
1. "tipoAto": "edital" | "nomeacao" | "promocao" | "projeto_lei" | "resolucao_portaria" | "licenca_ambiental" | "pauta_conselho" | "outorga_agua_energia" | "tac_acordo_mp" | "concessao_ppp"
2. "eixo": "Terra e Território" | "Direitos em Movimento" | "Estado e Economia" | "Central ONSA"
3. "relevancia": número inteiro de 1 a 5 (5 = alto impacto coletivo)
4. "microresumo": frase direta de até 25 palavras explicando o que foi decidido/publicado, órgão e valores.
5. "entidades": lista com até 4 nomes de órgãos, empresas ou autoridades citadas (sem CPFs).
6. "tags": lista com até 4 palavras-chave.

Responda APENAS o JSON:"""

    payload = {
        "model": modelo,
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }

    try:
        req = urllib.request.Request(
            host_ollama,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            texto_resp = data.get("response", "{}")
            return json.loads(texto_resp)
    except Exception:
        # Fallback determinístico caso o Ollama esteja offline ou ocorra timeout
        return gerar_fallback_deterministico(texto_ato, tipo_contexto)


def gerar_fallback_deterministico(texto_ato: str, tipo_contexto: str) -> Dict[str, Any]:
    """Fallback semântico baseado em padrões determinísticos quando o Ollama não responde."""
    texto_resumo = texto_ato.strip().replace("\n", " ")[:140]
    return {
        "tipoAto": "resolucao_portaria",
        "eixo": "Estado e Economia" if "orçamento" in texto_resumo.lower() else "Terra e Território",
        "relevancia": 3,
        "microresumo": f"Publicação oficial sobre {texto_resumo[:80]}...",
        "entidades": ["Poder Público"],
        "tags": [tipo_contexto, "diario-oficial", "auditoria-civica"],
        "_gerado_por": "fallback_deterministico"
    }
