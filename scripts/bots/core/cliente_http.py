#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/bots/core/cliente_http.py

Cliente HTTP resiliente para os bots de coleta institucional.

═══ ARQUITETURA & PREVENÇÃO DE FALHAS ═══
- Reconfiguração de stdout/stderr para UTF-8 no Windows (evita UnicodeEncodeError).
- Descompressão automática de gzip em APIs públicas governamentais (magic byte 0x1f 0x8b).
- Backoff exponencial para tolerância a quedas momentâneas e rate limits (429/500/503).
- User-Agent transparente com identificação e e-mail de contato oficial.
"""

import os
import sys
import json
import time
import gzip
import urllib.request
import urllib.error
from typing import Any, Dict, Optional, Union

# Configuração de encoding para Windows
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

USER_AGENT_PADRAO = (
    "ControlePopular-ONSA/1.0 (+https://www.controlepopular.com.br; contato@controlepopular.com.br)"
)


def get_json(
    url: str,
    headers: Optional[Dict[str, str]] = None,
    timeout: int = 35,
    max_retries: int = 4
) -> Optional[Any]:
    """
    Executa requisição GET HTTP com descompressão automática de gzip e retries exponenciais.
    """
    cabecalhos = {
        "User-Agent": USER_AGENT_PADRAO,
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
    }
    if headers:
        cabecalhos.update(headers)

    req = urllib.request.Request(url, headers=cabecalhos)

    for tentativa in range(1, max_retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                if resp.status == 200:
                    raw = resp.read()
                    if raw.startswith(b'\x1f\x8b'):
                        raw = gzip.decompress(raw)
                    return json.loads(raw.decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code in (404, 400):
                return None
            print(f"⚠️ [HTTP {e.code}] Erro ao acessar {url}. Tentativa {tentativa}/{max_retries}...", file=sys.stderr)
        except Exception as e:
            print(f"⚠️ [Conexão] Falha ({e}) ao acessar {url}. Tentativa {tentativa}/{max_retries}...", file=sys.stderr)

        time.sleep(2 ** tentativa)

    return None


def get_texto(
    url: str,
    headers: Optional[Dict[str, str]] = None,
    timeout: int = 35,
    max_retries: int = 4
) -> Optional[str]:
    """
    Executa requisição GET HTTP retornando texto puro (HTML, XML ou Diários Oficiais).
    """
    cabecalhos = {
        "User-Agent": USER_AGENT_PADRAO,
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate",
    }
    if headers:
        cabecalhos.update(headers)

    req = urllib.request.Request(url, headers=cabecalhos)

    for tentativa in range(1, max_retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                if resp.status == 200:
                    raw = resp.read()
                    if raw.startswith(b'\x1f\x8b'):
                        raw = gzip.decompress(raw)
                    return raw.decode("utf-8", errors="replace")
        except Exception as e:
            print(f"⚠️ [Texto HTTP] Falha ({e}) ao acessar {url}. Tentativa {tentativa}/{max_retries}...", file=sys.stderr)

        time.sleep(2 ** tentativa)

    return None
