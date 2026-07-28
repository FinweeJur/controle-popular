"""Camada LLM plugável — casca sobre a biblioteca compartilhada `llm_br`.

Decisão do usuário (2026-07-22): o provedor é configurável — Ollama local
por padrão, mas DeepSeek, Maritaca, Claude ou qualquer endpoint compatível
com OpenAI entram trocando uma variável de ambiente, sem mexer em código.

Contrato mínimo que todo provedor implementa:
    gerar_json(prompt, system=, temperatura=) -> dict
    gerar_texto(prompt, system=, temperatura=) -> str

REGRA INEGOCIÁVEL DO PROJETO: nenhuma feature pode quebrar com o LLM
offline ou falhando. Proposição sem análise aparece como "análise
pendente" na UI — nunca com um rótulo inventado, nunca com erro 500.

---

A implementação saiu daqui em 2026-07-22 para `llm_br`
(https://github.com/FinweeJur/llm-br), que é a união desta camada com as do
Ygg e do Vaire. O que era daqui foi preservado lá, com teste:

- `format: "json"` do Ollama como *constrained decoding* de verdade;
- `extrair_json` com as três tentativas (direto, sem cerca, recorte);
- 404 do Ollama vira "rode: ollama pull <modelo>", e não é retentado;
- retentativa com espera exponencial nas falhas transitórias.

Este módulo segue sendo o ponto de entrada do projeto: mesmos nomes de
variável de ambiente, mesmo modelo padrão.
"""
import os

from llm_br import LLMError, LLMProvider, extrair_json, get_llm

__all__ = ["LLMError", "LLMProvider", "extrair_json", "get_provider"]

# O 8B quantizado é o piso de referência do projeto: o benchmark da F4 mede
# o teto com Sonnet, mas o padrão precisa rodar sem chave e sem custo.
MODELO_PADRAO = "llama3.1:8b-instruct-q4_K_M"


def get_provider() -> LLMProvider:
    """Provedor configurado por ambiente.

    `LLM_PROVIDER`: ollama (padrão) | deepseek | maritaca | openai_compat |
    anthropic | auto. `LLM_MODEL`, `LLM_BASE_URL` e `LLM_API_KEY` completam.
    """
    return get_llm(
        os.environ.get("LLM_PROVIDER") or "ollama",
        modelo=os.environ.get("LLM_MODEL") or MODELO_PADRAO,
        base_url=os.environ.get("LLM_BASE_URL") or None,
        api_key=os.environ.get("LLM_API_KEY") or "",
    )
