"""coletar-congresso-mg.py — parlamentares de MG (Camara + Senado) para a frente Congresso.

Grava `apps/web/data/congresso-mg.json`, lido pelo indice estatico da frente
Congresso (plano M7). Destrava leitura sem banco enquanto a Neon estiver fora.

Rodar:
    python scripts/coletar-congresso-mg.py             # coleta e grava
    python scripts/coletar-congresso-mg.py --seco      # nao grava; so mede
    python scripts/coletar-congresso-mg.py --self-test # so o assert de CPF

## Fonte e licenca

- Camara dos Deputados — Dados Abertos: `dadosabertos.camara.leg.br` (listagem
  e ficha individual de cada deputado).
- Senado Federal — Dados Abertos: `legis.senado.leg.br/dadosabertos` (listagem
  de senadores por UF).
- Pacote `DadosAbertosBrasil` (2.1.0, MIT) unifica as duas APIs com paginacao
  automatica; a ficha individual da Camara e buscada direto na API oficial
  (a lib nao expoe endpoint de deputado unico).
- Licenca: dado publico governamental no framework Dados Abertos gov.br
  (registry: `dados-abertos-gov`) — uso livre com atribuicao a fonte.

Nota de implementacao: o plano M7 registra `camara.lista_deputados(sigla_uf=...)`,
mas o parametro real da lib instalada e `uf` (conferido em 31/08/2026 em
`DadosAbertosBrasil.camara.lista_deputados`).

## Privacidade — por que este coletor nao grava CPF

A API da Camara expoe o campo `cpf` na ficha individual de cada deputado
(confirmado em 31/08/2026). Este portal e um repositorio PUBLICO e a regra do
projeto (AGENTS.md) e: dado pessoal nao entra no repo, nem dentro de ementa,
nem colado a nome. Por isso a redacao acontece NA ORIGEM: `ficha_deputado()`
devolve o dict ja sem o campo `cpf` (removido recursivamente antes de sair da
funcao), e antes de gravar o JSON o script varre a arvore inteira e falha se
qualquer chave `cpf` existir. A guarda `scripts/checar-dado-pessoal-em-dado.py`
(varre `apps/web/data` no pre-push e na CI) e a rede de seguranca de segunda
camada. Um self-test com CPF sintetico valido (123.456.789-09, passa no
mod-11) prova que o coletor mascara/rejeita.

## Comportamento

- Pausa de 400 ms entre chamadas de API e User-Agent honesto que identifica o
  projeto (regra dos coletores: nunca UA de navegador falso).
- Coleta vazia NAO sobrescreve o arquivo bom (mesma regra dos demais coletores):
  um dia de rede ruim nao pode esvaziar uma tela.
- Resumo final com contagens por partido.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SAIDA = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "congresso-mg.json"

# Pausa honesta entre chamadas (regra dos coletores: ler robots/limites da fonte).
PAUSA_S = 0.4
LEGISLATURA = 57
FONTE = "DadosAbertosBrasil (Camara/Senado)"

# UA honesto, so ASCII (cabecalho com acento quebra cliente HTTP).
AGENTE = "ControlePopular/1.0 (coletor congresso-mg; https://controlepopular.com.br)"

CAMARA_API = "https://dadosabertos.camara.leg.br/api/v2"


# ── Privacidade ────────────────────────────────────────────────────────────

def mascarar_cpf(_cpf: str) -> str:
    """Nunca devolve o numero: so a mascara. Nao importa o valor de entrada."""
    return "***.****.***-**"


def redigir(dado: Any) -> Any:
    """Remove recursivamente QUALQUER chave `cpf` (sem distincao de caixa).

    E a redacao na origem: aplicada ao dict cru da ficha antes de qualquer
    campo ser copiado para o registro de saida.
    """
    if isinstance(dado, dict):
        return {k: redigir(v) for k, v in dado.items() if k.lower() != "cpf"}
    if isinstance(dado, list):
        return [redigir(i) for i in dado]
    return dado


def tem_cpf(dado: Any) -> bool:
    """True se a arvore ainda tiver qualquer chave `cpf`. Usado como trava final."""
    if isinstance(dado, dict):
        if any(k.lower() == "cpf" for k in dado):
            return True
        return any(tem_cpf(v) for v in dado.values())
    if isinstance(dado, list):
        return any(tem_cpf(i) for i in dado)
    return False


def self_test() -> None:
    """Assert que o coletor rejeita/mascara CPF. Roda em TODA execucao (puro, sem rede).

    O CPF sintetico 12345678909 e valido pelo mod-11 (123.456.789-09) — e o
    mesmo criterio da guarda `checar-dado-pessoal-em-dado.py`.
    """
    ficha_camara = {
        "id": 1,
        "nome": "Fulano de Tal",
        "cpf": "12345678909",
        "ultimoStatus": {"situacao": "Exercicio", "cpf": "12345678909"},
    }
    limpa = redigir(ficha_camara)
    assert not tem_cpf(limpa), "cpf vazou da redacao"
    assert "cpf" not in limpa and "cpf" not in limpa["ultimoStatus"]
    assert mascarar_cpf("12345678909") == "***.****.***-**", "mascara quebrou"
    print("self-test ok: CPF sintetico 12345678909 rejeitado/mascarado na origem", file=sys.stderr)


# ── Camara ─────────────────────────────────────────────────────────────────

def ficha_deputado(dep_id: int) -> dict:
    """Ficha individual na API da Camara, JA redigida (sem campo `cpf`)."""
    time.sleep(PAUSA_S)
    url = f"{CAMARA_API}/deputados/{dep_id}"
    req = urllib.request.Request(url, headers={"User-Agent": AGENTE})
    with urllib.request.urlopen(req, timeout=60) as r:
        corpo = json.load(r)
    return redigir(corpo["dados"])


def coletar_deputados() -> list[dict[str, Any]]:
    from DadosAbertosBrasil import camara

    time.sleep(PAUSA_S)
    lista = camara.lista_deputados(uf="MG", legislatura=LEGISLATURA, formato="json")
    registros = []
    for i, dep in enumerate(lista, 1):
        ficha = ficha_deputado(dep["id"])
        us = ficha.get("ultimoStatus") or {}
        # `nomeEleitoral` e o nome de urna (o nome civil fica na ficha crua,
        # que nem sai da funcao); `uri` da ficha e a urlFicha pedida no plano.
        registros.append({
            "nome": us.get("nomeEleitoral") or ficha.get("nome"),
            "partido": us.get("siglaPartido") or ficha.get("siglaPartido"),
            "uf": us.get("siglaUf") or ficha.get("siglaUf"),
            "situacao": us.get("situacao"),
            "urlFicha": ficha.get("uri"),
        })
        if i % 10 == 0:
            print(f"  camara: {i}/{len(lista)} fichas", file=sys.stderr)
    return sorted(registros, key=lambda r: (r["nome"] or ""))


# ── Senado ─────────────────────────────────────────────────────────────────

def coletar_senadores() -> list[dict[str, Any]]:
    from DadosAbertosBrasil import senado

    time.sleep(PAUSA_S)
    lista = senado.lista_senadores(uf="MG", formato="json")
    registros = []
    for s in lista:
        ident = s.get("IdentificacaoParlamentar") or {}
        mandato = s.get("Mandato") or {}
        registros.append({
            "nome": ident.get("NomeParlamentar"),
            "partido": ident.get("SiglaPartidoParlamentar"),
            "uf": ident.get("UfParlamentar") or "MG",
            "situacao": mandato.get("DescricaoParticipacao"),
        })
    return sorted(registros, key=lambda r: (r["nome"] or ""))


# ── Montagem e gravacao ────────────────────────────────────────────────────

def main() -> int:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--seco", action="store_true", help="nao grava; so mede")
    p.add_argument("--self-test", action="store_true", help="so o assert de CPF, sem rede")
    args = p.parse_args()

    self_test()
    if args.self_test:
        return 0

    try:
        deputados = coletar_deputados()
        senadores = coletar_senadores()
    except ImportError as e:
        print(f"! DadosAbertosBrasil ausente: {e} — rode `python -m pip install DadosAbertosBrasil`", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"! falha na coleta: {e}", file=sys.stderr)
        return 1

    # Trava final: nenhuma chave `cpf` pode existir na arvore que vai ao disco.
    if tem_cpf({"deputados": deputados, "senadores": senadores}):
        print("! cpf detectado na saida — ABORTANDO sem gravar", file=sys.stderr)
        return 1

    dados = {
        "geradoEm": datetime.now(timezone.utc).isoformat(),
        "fonte": FONTE,
        "legislatura": LEGISLATURA,
        "deputados": deputados,
        "senadores": senadores,
    }

    # Coleta vazia NAO sobrescreve o arquivo bom (regra dos coletores).
    if not deputados and not senadores and SAIDA.is_file() and not args.seco:
        print("! coleta vazia: mantendo o arquivo anterior", file=sys.stderr)
        return 1

    por_partido: dict[str, int] = {}
    for r in [*deputados, *senadores]:
        partido = r.get("partido") or "(sem partido)"
        por_partido[partido] = por_partido.get(partido, 0) + 1

    print(f"\ndeputados de MG: {len(deputados)}", file=sys.stderr)
    print(f"senadores de MG: {len(senadores)}", file=sys.stderr)
    for k, v in sorted(por_partido.items(), key=lambda x: -x[1]):
        print(f"  partido {k}: {v}", file=sys.stderr)

    if args.seco:
        return 0

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(dados, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"gravado em {SAIDA} ({SAIDA.stat().st_size} bytes)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
