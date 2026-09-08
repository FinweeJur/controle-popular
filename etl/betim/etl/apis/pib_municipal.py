"""etl.apis.pib_municipal — download PIB dos municipios via API SIDRA (IBGE).

Fonte: https://apisidra.ibge.gov.br/values/t/5938
Tabela 5938: PIB dos Municipios - referencia 2010 (serie 2002-2023).
API publica, sem chave, retorna JSON.

Campos: PIB total a precos correntes (mil Reais), impostos liquidos,
valor adicionado bruto.
Nivel territorial: N6 (municipio).

Saida: apps/web/data/pib-municipal-{id_municipio}.json

Uso:
  python -m etl.apis.pib_municipal --id-municipio 3106705
  python -m etl.apis.pib_municipal --id-municipio 3106705 --ano 2022
  python -m etl.apis.pib_municipal --id-municipio 3106705 --json
"""
import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone

import requests

USER_AGENT = "ControlePopular/1.0 (coletor publico; contato: controlepopular@controlepopular.com.br)"
URL_BASE = "https://apisidra.ibge.gov.br/values"
TABELA = 5938


def _get(url: str, tentativas: int = 3) -> list[dict]:
    for tentativa in range(tentativas):
        try:
            r = requests.get(
                url,
                headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
                timeout=30,
            )
            r.raise_for_status()
            dados = r.json()
            if isinstance(dados, list) and len(dados) > 1:
                return dados[1:]
            return []
        except requests.exceptions.RequestException as e:
            if tentativa < tentativas - 1:
                time.sleep(2 ** tentativa)
            else:
                raise RuntimeError(f"Falha apos {tentativas} tentativas: {e}") from e
    return []


def coletar_variavel(id_municipio: str, variavel: str, periodo: str) -> list[dict]:
    """Coleta uma variavel do SIDRA para o municipio."""
    url = f"{URL_BASE}/t/{TABELA}/n6/{id_municipio}/v/{variavel}/p/{periodo}/f/n"
    return _get(url)





def coletar_pib(id_municipio: str, ano: int | None = None) -> dict[str, dict]:
    """Coleta PIB do municipio via SIDRA API.

    Parametros da URL SIDRA:
      /t/{tabela}/n6/{municipio}/v/{variavel}/{periodo}/f/n

    A tabela 5938 tem variaveis:
      37 = PIB a precos correntes (Mil Reais)
      38 = Impostos liquidos de subsidios (Mil Reais)
      39 = Valor adicionado bruto (Mil Reais)
    """
    periodo = str(ano) if ano else "last 10"

    por_ano: dict[str, dict] = {}

    for var_id, var_nome in [(37, "pib_total"), (543, "impostos_liquidos"), (498, "valor_adicionado_bruto")]:
        dados = coletar_variavel(id_municipio, str(var_id), periodo)
        for row in dados:
            ano_str = row.get("D3N", "").strip()
            if not ano_str or not ano_str.isdigit():
                continue
            valor_str = row.get("V", "")
            if not valor_str or valor_str == "...":
                continue
            try:
                valor = float(valor_str.replace(",", "."))
            except ValueError:
                continue
            if ano_str not in por_ano:
                por_ano[ano_str] = {"ano": int(ano_str)}
            por_ano[ano_str][var_nome] = valor

    return por_ano


def main():
    parser = argparse.ArgumentParser(description="Coleta PIB municipal via SIDRA")
    parser.add_argument("--id-municipio", required=True, help="Codigo IBGE de 7 digitos")
    parser.add_argument("--ano", type=int, help="Ano especifico (ex: 2022)")
    parser.add_argument("--json", action="store_true", help="Salvar JSON em apps/web/data/")
    args = parser.parse_args()

    print(f"[pib_municipal] municipio={args.id_municipio}")
    por_ano = coletar_pib(args.id_municipio, args.ano)
    dados = [por_ano[k] for k in sorted(por_ano.keys())]
    print(f"[pib_municipal] anos={len(dados)}")

    if not dados:
        print("[pib_municipal] nenhum dado encontrado")
        return

    if args.json:
        raiz = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
        caminho = os.path.join(raiz, "apps", "web", "data", f"pib-municipal-{args.id_municipio}.json")
        os.makedirs(os.path.dirname(caminho), exist_ok=True)
        pacote = {
            "fonte": "ibge-sidra-t5938",
            "municipio": args.id_municipio,
            "tabela": TABELA,
            "unidade": "Mil Reais",
            "total_anos": len(dados),
            "pib": dados,
            "coletadoEm": datetime.now(timezone.utc).isoformat(),
        }
        tmp = caminho + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(pacote, f, ensure_ascii=False, indent=2)
        os.replace(tmp, caminho)
        print(f"[pib_municipal] JSON salvo: {len(dados)} anos em {caminho}")
        return

    for d in dados:
        print(json.dumps(d, ensure_ascii=False))
    print(f"[pib_municipal] total={len(dados)}")


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as e:
        print(f"[pib_municipal] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
