#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/bots/core/validador_mod11.py

Módulo de validação e anonimização estrita de CPFs por algoritmo Módulo-11.

═══ CONFORMIDADE E REGRAS DO REPOSITÓRIO ═══
- AGENTS.md § 5.2: "Dado pessoal: varrer o DADO, não só o código. Em 15/08 este repositório
  público publicou CPF real... Dentro de ementas oficiais e acervos."
- Este módulo assegura que todo texto, ementa, objeto ou razão social analisada
  pelos bots tenha qualquer CPF real de pessoa física mascarado para ***.***.***-**
  antes de qualquer persistência em disco ou banco de dados.
"""

import re
from typing import Any, Dict, List, Union


def validar_cpf_mod11(cpf_str: str) -> bool:
    """
    Valida se uma cadeia numérica de 11 dígitos possui dígitos verificadores válidos (mod-11).
    Ignora sequências de dígitos idênticos (ex: 111.111.111-11).
    """
    numeros = [int(d) for d in cpf_str if d.isdigit()]
    if len(numeros) != 11 or len(set(numeros)) == 1:
        return False

    # Primeiro dígito verificador
    soma = sum(numeros[i] * (10 - i) for i in range(9))
    resto = (soma * 10) % 11
    d1 = 0 if resto == 10 else resto
    if numeros[9] != d1:
        return False

    # Segundo dígito verificador
    soma = sum(numeros[i] * (11 - i) for i in range(10))
    resto = (soma * 10) % 11
    d2 = 0 if resto == 10 else resto
    return numeros[10] == d2


def anonimizar_cpfs_texto(texto: str) -> str:
    """
    Varre um texto e substitui qualquer CPF real válido por máscara anônima.
    Preserva CNPJs (14 dígitos) e números de processos/protocolos.
    """
    if not texto:
        return ""

    padrao = re.compile(r'\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b')

    def replacer(match: re.Match) -> str:
        raw = re.sub(r'\D', '', match.group(0))
        if len(raw) == 11 and validar_cpf_mod11(raw):
            return "***.***.***-**"
        return match.group(0)

    return padrao.sub(replacer, texto)


def sanitizar_estrutura(dado: Union[Dict, List, str, Any]) -> Any:
    """
    Sanitiza recursivamente dicionários, listas ou strings para eliminar CPFs reais.
    """
    if isinstance(dado, str):
        return anonimizar_cpfs_texto(dado)
    elif isinstance(dado, dict):
        return {k: sanitizar_estrutura(v) for k, v in dado.items()}
    elif isinstance(dado, list):
        return [sanitizar_estrutura(item) for item in dado]
    return dado
