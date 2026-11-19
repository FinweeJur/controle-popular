# -*- coding: utf-8 -*-
"""Enriquece uma amostra pequena de fornecedores do portal com a Brasil API.

O QUE E: prova de fonte para o eixo de fornecedor. Lê CNPJ que JÁ existe em
`apps/web/data`, consulta `/api/cnpj/v1/{cnpj}` na Brasil API e grava razão
social, situação cadastral, CNAE, natureza jurídica e datas. O objetivo é
mostrar o ganho de qualidade (situação em texto, descrição do CNAE) sem virar
ETL de varredura.

FONTE OFICIAL: https://brasilapi.com.br/api/cnpj/v1/{cnpj} — dados públicos da
Receita Federal agregados pela Brasil API (projeto open source, sem chave).
Documentação: https://brasilapi.com.br/docs

DECISÃO DE COLETA (18/11/2026), conforme AGENTS/COLETA-ETICA:

- O README da Brasil API pede: "por favor não utilize formas automatizadas para
  fazer crawling dos dados da API. O volume de consultas deve ter a natureza de
  uma pessoa real requisitando um determinado dado." O `robots.txt` do domínio
  responde `Disallow: /api/*`.
- Este coletor NÃO faz varredura: é amostra fechada, teto de 20 CNPJ que já
  estão no repositório, uma consulta por CNPJ, sem enumerar faixa. É a exceção
  pedida pelo dono para provar a fonte, registrada aqui como manda a regra do
  repositório. Para volume, a fonte do projeto continua sendo a Base dos Dados
  (`etl/betim/etl/bd/cnpj.py`); este script não substitui aquilo.
- User-Agent honesto: `finweejur/github artur colito`.
- Pausa de 2,5 s entre chamadas. Medido nesta máquina em 18/11/2026: 5
  consultas nesse ritmo voltaram 200. O módulo irmão
  `etl/betim/etl/apis/brasilapi.py` mediu 429 com espaçamento menor — por isso
  há espera longa e nova tentativa em 429/5xx.
- NUNCA se grava `qsa`/sócio, CPF, telefone ou e-mail. Só empresa.

POR QUE ASSIM:

- Filtro de pessoa física: `natureza_juridica` "Empresário (Individual)" e
  `opcao_pelo_mei` verdadeiro ficam de fora. São CNPJ válidos, mas a razão
  social é o nome da pessoa — e o portal não precisa disso para provar a fonte.
- O CNPJ é validado por módulo 11 antes da consulta. `000.000.000-00` (máscara
  de identificação protegida do PNCP) e número inventado não gastam requisição.
- Gravação incremental: cada sucesso reescreve o JSON. Rodada interrompida não
  perde o que já veio, e a próxima retoma pelos que faltam.

Uso:
    python scripts/enriquecer-cnpj.py
    python scripts/enriquecer-cnpj.py --max 5 --intervalo 3
    python scripts/enriquecer-cnpj.py --seco          # só lista os alvos
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
DADOS = RAIZ / "apps" / "web" / "data"
SAIDA = DADOS / "fornecedores" / "enriquecido.json"

CONTRATOS = DADOS / "contratos-pncp-consolidado.json"
GASTOS = DADOS / "eleicoes" / "gastos-2026" / "fornecedores.json"

BASE = "https://brasilapi.com.br/api/cnpj/v1"
DOCS = "https://brasilapi.com.br/docs"
UA = "finweejur/github artur colito"
INTERVALO = 2.5
TENTATIVAS = 3
TETO = 20

FONTE = "Brasil API (dados públicos da Receita Federal)"

# Naturezas que são pessoa física com CNPJ. A razão social é o nome do titular,
# então nem consultamos: o portal não publica dado de pessoa física.
PESSOA_FISICA = re.compile(r"empres[aá]rio\s*\(individual\)|individual", re.IGNORECASE)


def _digitos(cnpj: str) -> str:
    return re.sub(r"\D", "", cnpj or "")


def cnpj_valido(cnpj: str) -> bool:
    """Módulo 11 do CNPJ. Repetição de dígito (00000000000000) é inválida."""
    d = _digitos(cnpj)
    if len(d) != 14 or len(set(d)) == 1:
        return False
    pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    pesos2 = [6] + pesos1
    for pesos, pos in ((pesos1, 12), (pesos2, 13)):
        soma = sum(int(d[i]) * pesos[i] for i in range(len(pesos)))
        resto = soma % 11
        dv = 0 if resto < 2 else 11 - resto
        if dv != int(d[pos]):
            return False
    return True


def _ler(caminho: Path) -> object:
    return json.loads(caminho.read_text(encoding="utf-8"))


def alvos() -> list[dict]:
    """Lista determinística de fornecedores que já existem no repositório.

    Ordem: contratos do PNCP primeiro (fornecedor de compra pública de
    verdade), depois os maiores fornecedores de gasto eleitoral de 2026 — que é
    o que o arquivo se chama. Deduplica por CNPJ e descarta máscara/inválido.
    """
    vistos: dict[str, dict] = {}

    if CONTRATOS.exists():
        for c in _ler(CONTRATOS).get("contratos", []):  # type: ignore[union-attr]
            d = _digitos(c.get("fornecedor_cnpj", ""))
            if d and d not in vistos and cnpj_valido(d):
                vistos[d] = {
                    "cnpj": d,
                    "nomeNoArquivo": c.get("fornecedor_razao_social") or "",
                    "origem": "apps/web/data/contratos-pncp-consolidado.json",
                }

    if GASTOS.exists():
        for f in _ler(GASTOS):  # type: ignore[union-attr]
            d = _digitos(f.get("cnpj", ""))
            if d and d not in vistos and cnpj_valido(d):
                vistos[d] = {
                    "cnpj": d,
                    "nomeNoArquivo": f.get("nome") or "",
                    "origem": "apps/web/data/eleicoes/gastos-2026/fornecedores.json",
                }

    return list(vistos.values())


def consultar(cnpj: str, intervalo: float) -> tuple[dict | None, str | None]:
    """GET no CNPJ com UA honesto, ritmo e espera longa em 429.

    Devolve (registro, None) ou (None, motivo). Falha de um CNPJ não aborta a
    rodada: o próximo é tentado.
    """
    url = f"{BASE}/{cnpj}"
    for tentativa in range(TENTATIVAS):
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                bruto = json.load(r)
            break
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None, "CNPJ não encontrado na base"
            if e.code == 429 or 500 <= e.code < 600:
                espera = 60 * (tentativa + 1)
                print(f"    {e.code}; esperando {espera}s", flush=True)
                time.sleep(espera)
                continue
            return None, f"HTTP {e.code}"
        except (urllib.error.URLError, TimeoutError) as e:
            time.sleep(10)
            if tentativa == TENTATIVAS - 1:
                return None, f"rede: {e}"
    else:
        return None, "esgotou tentativas"

    # Filtro de pessoa física DEPOIS da consulta: só o campo de natureza e o
    # indicador de MEI decidem. O `qsa` nunca é lido.
    natureza = bruto.get("natureza_juridica") or ""
    if bruto.get("opcao_pelo_mei") or PESSOA_FISICA.search(natureza):
        return None, f"pessoa física ({natureza or 'MEI'}) — não versionado"

    agora = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()
    registro = {
        "cnpj": _digitos(bruto.get("cnpj") or cnpj),
        "razaoSocial": bruto.get("razao_social"),
        "situacaoCadastral": bruto.get("descricao_situacao_cadastral"),
        "dataSituacao": bruto.get("data_situacao_cadastral"),
        "dataInicioAtividade": bruto.get("data_inicio_atividade"),
        "cnae": {
            "codigo": str(bruto.get("cnae_fiscal") or ""),
            "descricao": bruto.get("cnae_fiscal_descricao"),
        },
        "naturezaJuridica": natureza,
        "municipio": bruto.get("municipio"),
        "uf": bruto.get("uf"),
        "origem": None,  # preenchido pelo chamador
        "consultaEm": agora,
        "fonte": FONTE,
        "coletadoEm": agora,
    }
    return registro, None


def gravar(destino: Path, registros: list[dict], falhas: list[dict], consultados: int) -> None:
    """Escreve o JSON compacto, com o resumo da rodada no topo."""
    agora = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()
    saida = {
        "fonte": {
            "nome": FONTE,
            "endpoint": f"{BASE}/{{cnpj}}",
            "documentacao": DOCS,
            "licenca": "dados públicos da Receita Federal; código da Brasil API em MIT",
            "limite": "README pede volume de pessoa real, sem crawling; amostra fechada de até 20",
            "aviso": "Sem QSA, sócio, CPF, telefone ou e-mail. Determinístico e sem dado de pessoa física.",
        },
        "coletadoEm": agora,
        "amostra": len(registros),
        "consultados": consultados,
        "falhas": len(falhas),
        "fornecedores": registros,
        "naoVersionados": falhas,
    }
    texto = json.dumps(saida, ensure_ascii=False, separators=(",", ":"))
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(texto + "\n", encoding="utf-8")
    print(f"gravado {destino} ({len(texto)} bytes, {len(registros)} fornecedores)")


def main() -> int:
    p = argparse.ArgumentParser(description="Amostra de enriquecimento de CNPJ pela Brasil API.")
    p.add_argument("--max", type=int, default=TETO, help=f"teto de CNPJ (padrão {TETO})")
    p.add_argument("--intervalo", type=float, default=INTERVALO, help=f"segundos entre chamadas (padrão {INTERVALO})")
    p.add_argument("--seco", action="store_true", help="lista os alvos e não consulta")
    p.add_argument("--saida", default=str(SAIDA))
    args = p.parse_args()

    lista = alvos()[: max(1, args.max)]
    if not lista:
        print("nenhum CNPJ válido encontrado nas fontes de data/", file=sys.stderr)
        return 2

    print(f"{len(lista)} CNPJ alvo(s), intervalo {args.intervalo}s")
    for a in lista:
        print(f"  {a['cnpj']} {a['nomeNoArquivo'][:48]} ({a['origem'].split('/')[-1]})")
    if args.seco:
        print("[seco] nada consultado")
        return 0

    registros: list[dict] = []
    falhas: list[dict] = []
    consultados = 0
    destino = Path(args.saida)

    for i, a in enumerate(lista):
        if i:
            time.sleep(args.intervalo)
        consultados += 1
        print(f"\n[{i + 1}/{len(lista)}] {a['cnpj']}", flush=True)
        registro, motivo = consultar(a["cnpj"], args.intervalo)
        if registro:
            registro["origem"] = a["origem"]
            registros.append(registro)
            print(f"  ok: {registro['razaoSocial']} — {registro['situacaoCadastral']}", flush=True)
        else:
            falhas.append({"cnpj": a["cnpj"], "motivo": motivo, "origem": a["origem"]})
            print(f"  pulado: {motivo}", flush=True)
        # Grava a cada passo: rodada com 429 não perde o que já veio.
        gravar(destino, registros, falhas, consultados)

    print(f"\n{len(registros)} fornecedores versionados, {len(falhas)} não versionado(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
