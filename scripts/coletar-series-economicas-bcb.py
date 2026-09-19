"""coletar-series-economicas-bcb.py — séries macroeconômicas do Banco Central do Brasil (SGS).

Coleta séries oficiais do SGS/BCB sem necessidade de chave de API:
- IPCA mensal (Série 433)
- Taxa Selic meta anualizada (Série 432)
- Câmbio Dólar comercial venda (Série 1)
- Crédito total do sistema financeiro (Série 20542)

Grava `apps/web/data/series-economicas-bcb.json` para contextualização de finanças públicas,
orçamento e compras públicas no portal Controle Popular.
Também alimenta o motor contextual do chatbot Seu Nonô.

Regras do AGENTS.md atendidas:
- User-Agent transparente do projeto
- Pausa de cortesia entre requisições
- Zero dado pessoal (são séries agregadas oficiais de Estado)
- Coleta vazia não sobrescreve dado preexistente
"""
from __future__ import annotations

import json
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "apps" / "web" / "data" / "series-economicas-bcb.json"
USER_AGENT = "ControlePopular/1.0 (+https://www.controlepopular.com.br; contato@controlepopular.com.br)"

SERIES_DEFINIDAS = [
    {
        "id": "ipca_mensal",
        "codigo": 433,
        "nome": "IPCA — Variação Mensal (%)",
        "unidade": "%",
        "frequencia": "mensal",
        "qtdUltimos": 24,
    },
    {
        "id": "selic_meta",
        "codigo": 432,
        "nome": "Taxa de Juros Selic — Meta Anualizada (%)",
        "unidade": "% a.a.",
        "frequencia": "mensal/reuniao",
        "qtdUltimos": 24,
    },
    {
        "id": "dolar_comercial",
        "codigo": 1,
        "nome": "Taxa de Câmbio — Dólar Americano Comercial (Venda)",
        "unidade": "R$",
        "frequencia": "diaria",
        "qtdUltimos": 30,
    },
    {
        "id": "inpc_mensal",
        "codigo": 188,
        "nome": "INPC — Índice Nacional de Preços ao Consumidor (%)",
        "unidade": "%",
        "frequencia": "mensal",
        "qtdUltimos": 24,
    },
]


def buscar_serie(codigo: int, data_inicial: str = "01/01/2025", data_final: str = "31/12/2026") -> list[dict[str, str]]:
    url = f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados?formato=json&dataInicial={data_inicial}&dataFinal={data_final}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=15) as res:
        if res.status != 200:
            raise RuntimeError(f"HTTP {res.status} ao consultar série {codigo}")
        corpo = res.read().decode("utf-8")
        dados = json.loads(corpo)
        if not isinstance(dados, list):
            raise ValueError(f"Resposta inesperada para a série {codigo}")
        return dados


def main() -> int:
    print("[ETL-BCB] Iniciando coleta de séries macroeconômicas do SGS/BCB...")
    resultado_series: dict[str, dict] = {}

    for info in SERIES_DEFINIDAS:
        s_id = info["id"]
        cod = info["codigo"]
        print(f"[ETL-BCB] Coletando série {cod} ({info['nome']})...")
        try:
            pontos = buscar_serie(cod, "01/01/2025", "31/12/2026")
            # Inverte para ordem cronológica decrescente (mais recente primeiro)
            pontos_formatados = []
            for p in reversed(pontos):
                try:
                    val = float(p.get("valor", "").replace(",", "."))
                except ValueError:
                    val = 0.0
                pontos_formatados.append({
                    "data": p.get("data", ""),
                    "valor": val,
                })

            ultimo = pontos_formatados[0] if pontos_formatados else {"data": "", "valor": 0.0}
            resultado_series[s_id] = {
                "codigoSGS": cod,
                "nome": info["nome"],
                "unidade": info["unidade"],
                "frequencia": info["frequencia"],
                "ultimoValor": ultimo["valor"],
                "ultimaData": ultimo["data"],
                "historico": pontos_formatados,
            }
            time.sleep(1.2)  # Pausa de cortesia respeitosa
        except Exception as err:
            print(f"[ETL-BCB] ⚠️ Falha ao buscar série {cod}: {err}", file=sys.stderr)

    if len(resultado_series) < len(SERIES_DEFINIDAS) // 2:
        print("[ETL-BCB] ⛔ Erro: Menos da metade das séries responderam. Abortando sem sobrescrever arquivo bom.", file=sys.stderr)
        return 1

    payload = {
        "geradoEm": datetime.now(timezone.utc).isoformat(),
        "fonte": "Banco Central do Brasil — Sistema Gerenciador de Séries Temporais (SGS)",
        "urlFonte": "https://www3.bcb.gov.br/sgspub/",
        "ressalvaEditorial": "Dados macroeconômicos oficiais do Estado brasileiro para contextualização de índices de inflação, poder de compra e orçamento público.",
        "series": resultado_series,
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    with open(SAIDA, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"[ETL-BCB] Coleta concluida com sucesso! Gravado em {SAIDA}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
