"""coletar-almg-proposicoes.py — proposições da Assembleia Legislativa de MG.

Coleta proposições da ALMG via API REST (dadosabertos.almg.gov.br) ou CSV.
Grava JSON em apps/web/data/almg-proposicoes.json para consumo pelo frontend.

Rodar:
    python scripts/coletar-almg-proposicoes.py                # coleta 2026
    python scripts/coletar-almg-proposicoes.py --ano 2025     # ano específico
    python scripts/coletar-almg-proposicoes.py --seco         # não grava

## Fonte e licenca

- ALMG Dados Abertos: https://dadosabertos.almg.gov.br
- API v2: dadosabertos.almg.gov.br/api/v2/proposicoes/proposicao
- CSV: dadosabertos.almg.gov.br/documentacao/arquivos/proposicoes
- Licença: dado público governamental — uso livre com atribuição à fonte.

## Nota sobre acesso à API

A API da ALMG tem rate-limiting agressivo (2 requisições simultâneas,
1 segundo entre cada). O acesso pode ser bloqueado sem aviso prévio.
O coletor tenta a API primeiro; se receber 403/429, espera 30s e retoma.
Se a API permanecer indisponível, grava vazio (não sobrescreve dado bom).

## Privacidade

Este coletor NÃO grava CPF ou dado pessoal. Os dados são públicos
(proposições legislativas, não dados de pessoas).
"""
from __future__ import annotations

import argparse
import json
import time
from datetime import date
from pathlib import Path
from typing import Any

import urllib.request
import urllib.error

BASE_URL = "https://dadosabertos.almg.gov.br/api/v2"
SAIDA = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "almg-proposicoes.json"
UA = "ControlePopular/1.0 (controlepopular.com.br - dado publico governamental)"
PAUSA = 1.5  # segundos entre requisições (API da ALMG exige ≥1s)

# Tipos de proposição que criam ou alteram direitos
TIPOS_RELEVANTES = {"PL", "PLC", "PEC", "PLD", "PRE", "PLE"}


def _get(url: str, tentativa: int = 1) -> dict | None:
    """GET com retry e tratamento de rate-limit."""
    req = urllib.request.Request(url, headers={
        "Accept": "application/json",
        "User-Agent": UA,
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        if e.code in (403, 429) and tentativa < 3:
            espera = 30 * tentativa
            print(f"  [!] {e.code} em {url} — aguardando {espera}s...")
            time.sleep(espera)
            return _get(url, tentativa + 1)
        print(f"  [x] Erro {e.code} em {url}")
        return None
    except Exception as e:
        print(f"  [x] Exceção: {e}")
        return None


def _parse_autores(raw: str | None) -> list[dict]:
    """Parse do campo Autores (JSON string no CSV)."""
    if not raw:
        return []
    try:
        autores = json.loads(raw)
        return [{"id": a.get("id", 0), "nome": a.get("nome", ""), "partido": a.get("partido", "")}
                for a in autores if a.get("nome")]
    except (json.JSONDecodeError, TypeError):
        return []


def _coletar_tramitacoes_almg(id_proposicao: int, p_base: dict) -> list[dict]:
    """Coleta histórico de tramitação da proposição na ALMG ou gera a fase atual."""
    url = f"{BASE_URL}/proposicoes/proposicao/{id_proposicao}/tramitacoes"
    dados = _get(url)
    tramitacoes = []

    if dados and isinstance(dados, dict):
        lista = dados.get("listaTramitacoes") or dados.get("dados") or []
        for seq, t in enumerate(lista, 1):
            data_hora = t.get("dataHora") or t.get("data")
            sigla_orgao = t.get("local") or t.get("siglaOrgao") or t.get("orgao")
            descricao = t.get("descricao") or t.get("acao") or t.get("fase")
            despacho = t.get("despacho") or t.get("parecer")
            if descricao or sigla_orgao:
                tramitacoes.append({
                    "sequencia": t.get("sequencia") or seq,
                    "dataHora": data_hora,
                    "siglaOrgao": sigla_orgao or "ALMG",
                    "descricao": descricao,
                    "despacho": despacho,
                })

    # Fallback estruturado a partir dos dados do cabeçalho da proposição se a sub-rota não trouxer lista
    if not tramitacoes:
        if p_base.get("dataUltimaAcao") or p_base.get("nomeFaseAtual"):
            tramitacoes.append({
                "sequencia": 1,
                "dataHora": p_base.get("dataUltimaAcao") or p_base.get("dataPublicacao"),
                "siglaOrgao": p_base.get("local") or "Plenário / Comissões",
                "descricao": p_base.get("nomeFaseAtual") or p_base.get("situacao") or "Em tramitação",
                "despacho": p_base.get("resumo"),
            })

    return tramitacoes


def _coletar_api(ano: int, com_tramitacoes: bool = False, limite_tramitacoes: int = 50) -> list[dict]:
    """Coleta via API REST da ALMG."""
    proposicoes = []
    pagina = 1
    total_paginas = 1
    tramitacoes_coletadas = 0

    while pagina <= total_paginas:
        url = f"{BASE_URL}/proposicoes/proposicao?ano={ano}&itens=50&pagina={pagina}"
        print(f"  Página {pagina}/{total_paginas}...")
        dados = _get(url)
        if not dados:
            break

        lista = dados.get("listaProposicoes", [])
        if not lista:
            break

        total_paginas = dados.get("paginaAtual", {}).get("totalPaginas", 1)

        for p in lista:
            tipo = p.get("siglaTipoProposicao", "")
            if tipo not in TIPOS_RELEVANTES:
                continue

            autores = _parse_autores(p.get("autores"))
            situacao_geral = _mapear_situacao_geral(p.get("situacao", ""))
            id_prop = p.get("id")

            tramitacoes = []
            if com_tramitacoes and id_prop and tramitacoes_coletadas < limite_tramitacoes:
                tramitacoes = _coletar_tramitacoes_almg(id_prop, p)
                tramitacoes_coletadas += 1
                time.sleep(PAUSA)
            elif p.get("dataUltimaAcao") or p.get("nomeFaseAtual"):
                tramitacoes = [{
                    "sequencia": 1,
                    "dataHora": p.get("dataUltimaAcao") or p.get("dataPublicacao"),
                    "siglaOrgao": p.get("local") or "Comissões",
                    "descricao": p.get("nomeFaseAtual") or "Em tramitação",
                }]

            proposicoes.append({
                "codigo": p.get("codigo", ""),
                "tipo": p.get("tipoProposicao", ""),
                "sigla_tipo": tipo,
                "numero": p.get("numero", 0),
                "ano": p.get("ano", ano),
                "ementa": p.get("ementa"),
                "indexacao": p.get("indexacao"),
                "situacao": p.get("situacao"),
                "situacao_geral": situacao_geral,
                "data_publicacao": p.get("dataPublicacao"),
                "data_atualizacao": p.get("dataAtualizacao"),
                "data_ultima_acao": p.get("dataUltimaAcao"),
                "regime": p.get("regime"),
                "resumo": p.get("resumo"),
                "origem": p.get("origem"),
                "local": p.get("local"),
                "fase_atual": p.get("nomeFaseAtual"),
                "legislatura": p.get("legislatura"),
                "autores": autores,
                "url_texto": p.get("linkTextos"),
                "tramitando": _esta_tramitando(p.get("situacao", "")),
                "tramitacoes": tramitacoes,
            })

        pagina += 1
        time.sleep(PAUSA)

    return proposicoes


def _mapear_situacao_geral(situacao: str) -> str:
    """Mapeia situação específica para geral (padrão ALMG)."""
    mapa = {
        "AGPPC": "MAPCO", "MAPCO": "MAPCO", "AGARC": "MAPCO",
        "AGARP": "MAPLE", "MAPLE": "MAPLE", "AGDPR": "MOUTR",
        "AGCLM": "MOUTR", "ADCEP": "MAPRI", "AGDRC": "MAPCO",
        "AGDRR": "MARFI", "AGDLC": "MAPCO", "AGDIP": "MAPLE",
        "AGEPV": "MAPCO", "AGPAC": "MAPCO", "AGPAP": "MAPLE",
        "AGPCR": "MARFI", "AGPRO": "MAPRV", "AGPDM": "MAPRV",
        "AGPUB": "MOUTR", "AGPDC": "MAPCO", "AGPUP": "MAPCO",
        "AGPRQ": "MAPCO", "AGRCO": "MAPCO", "AGRCR": "MARFI",
        "AGSAN": "MAPRV", "AGVRF": "MARFI", "AGVOC": "MAPCO",
        "AGVOP": "MAPLE", "ANXDO": "MOUTR", "APRVD": "MAPRV",
        "ARQVD": "MOUTR", "CPAEC": "MAPCO", "CPRAZ": "MAPCO",
        "CPRIN": "MAPLE", "DESAR": "MOUTR", "ENCME": "MOUTR",
        "PRJDO": "MOUTR", "PVETO": "MAPRV", "PTORP": "MAPLE",
        "PRPNR": "MOUTR", "PUBLI": "MOUTR", "RECBD": "MOUTR",
        "RJTDO": "MRJTD", "RQDEF": "MAPRV", "RQIND": "MRJTD",
        "RETRA": "MOUTR", "TNJUR": "MAPRV", "TNJVP": "MAPRV",
        "VETMA": "MAPRV", "VETRP": "MRJTD", "VETRT": "MRJTD",
    }
    return mapa.get(situacao, "MOUTR")


def _esta_tramitando(situacao: str) -> bool:
    """Verifica se a proposição ainda está em tramitação ativa."""
    finalizadas = {"APRVD", "ARQVD", "PRJDO", "RJTDO", "RETRA", "TNJUR", "TNJVP",
                   "PVETO", "VETMA", "VETRP", "VETRT", "PUBLI"}
    return situacao not in finalizadas


def _gravar(proposicoes: list[dict], seco: bool = False) -> None:
    """Grava JSON de saída."""
    if seco:
        print(f"\n[seco] {len(proposicoes)} proposições — nada gravado.")
        return

    if not proposicoes:
        print("\n[!] Nenhuma proposição coletada — não sobrescrevendo arquivo existente.")
        return

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    # Ordena por data de última ação (mais recente primeiro)
    proposicoes.sort(key=lambda p: p.get("data_ultima_acao") or "0000", reverse=True)
    SAIDA.write_text(json.dumps(proposicoes, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n[ok] {len(proposicoes)} proposições → {SAIDA.name}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Coletor de proposições ALMG")
    parser.add_argument("--ano", type=int, default=date.today().year)
    parser.add_argument("--seco", action="store_true", help="Não grava arquivo")
    parser.add_argument("--com-tramitacoes", action="store_true", help="Coleta histórico de tramitação")
    parser.add_argument("--limite-tramitacoes", type=int, default=50, help="Teto de proposições com tramitação detalhada")
    args = parser.parse_args()

    print(f"=== ALMG proposições {args.ano} ===")
    proposicoes = _coletar_api(
        args.ano,
        com_tramitacoes=args.com_tramitacoes,
        limite_tramitacoes=args.limite_tramitacoes,
    )
    _gravar(proposicoes, seco=args.seco)


if __name__ == "__main__":
    main()
