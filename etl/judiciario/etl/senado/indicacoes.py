"""etl.senado.indicacoes — Mensagens de indicação de autoridade ao Senado.

Rodar:
  python -m etl.senado.indicacoes --descobrir --de 2003 --ate 2026   # F0: sem banco
  python -m etl.senado.indicacoes --ano 2026                          # F2: grava

FONTE: `legis.senado.leg.br/dadosabertos/processo?sigla=MSF&ano=&v=1`
— a API **nova** do Senado, sem autenticação. É a mesma que o app irmão
/congresso já consome (`etl/senado/processos.py`), com as mesmas duas
pegadinhas herdadas de lá:

  1. devolve uma **LISTA na raiz**, não `{dados: [...]}` como a Câmara;
  2. `tramitando` é o **texto** "Sim"/"Não", não booleano.

E uma terceira, específica desta rota, descoberta na F0:

  3. o `id` do processo **não é derivável** do número da Mensagem
     (MSF 2/2025 = 8785648, MSF 31/2025 = 8841541). Sempre extrair da
     listagem; chutar devolve 404.

POR QUE ESTA É A ESPINHA DORSAL DO APP
--------------------------------------
Toda nomeação a STF, STJ, TST, STM e TRF passa por aprovação do Senado
(CF art. 52, III) e vira uma Mensagem aqui — com a **ementa citando o
dispositivo constitucional da vaga**, que `etl/cota.py` converte em cota
de origem por regex determinístico.

Os portais dos tribunais, que seriam a fonte "óbvia", estão bloqueados:
STF composição 403, `portal.stf.jus.br/dadosabertos/` devolve 200
servindo uma página de 404, CNJ 503, `dadosabertos.cnj.jus.br` sem DNS.
Ver `docs/F0-discovery.md`. Não tentar de novo sem motivo novo.
"""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from etl.cota import extrair, extrair_antecessor
from etl.vacancia import presidente_em

BASE = "https://legis.senado.leg.br/dadosabertos"
SIGLA = "MSF"

# O `tipoConteudo` da LISTAGEM. O detalhe usa `conteudo.siglaTipo =
# INDICACAO_AUTORIDADE`, que é mais estável, mas exige 1 request por item
# — na listagem o rótulo por extenso basta para triar.
TIPO_INDICACAO = "Indicação de Autoridade"

# Pausa entre anos. O /congresso pagou caro por martelar API pública em
# paralelo: a dados-abertos da Câmara estrangulou o IP por horas depois de
# ~15k requisições. Aqui são ~24 requisições no total, mas a disciplina
# fica escrita para quem for ampliar o backfill depois.
PAUSA_ENTRE_ANOS = 0.5

_session = requests.Session()
_session.headers.update(
    {
        "Accept": "application/json",
        "User-Agent": "ControlePopular-Judiciario/0.1 (+https://controlepopular.br)",
    }
)


@retry(stop=stop_after_attempt(4), wait=wait_exponential(multiplier=1, min=2, max=30))
def get(caminho: str, **params):
    # `v=1` não é decorativo: sem ele a rota devolve 404 ou cai na API
    # legada, que está atrás de challenge anti-bot.
    params.setdefault("v", 1)
    resp = _session.get(f"{BASE}{caminho}", params=params, timeout=90)
    resp.raise_for_status()
    return resp.json()


def listar(ano: int) -> list[dict]:
    """Todas as Mensagens (MSF) de um ano."""
    dados = get("/processo", sigla=SIGLA, ano=ano)
    # Lista na raiz — ver pegadinha (1) no cabeçalho.
    return dados if isinstance(dados, list) else dados.get("dados", [])


def so_indicacoes(processos: list[dict]) -> list[dict]:
    return [p for p in processos if (p.get("tipoConteudo") or "").strip() == TIPO_INDICACAO]


def analisar(processo: dict) -> dict:
    """Cruza a Mensagem com a extração de cota. Não toca o banco."""
    ementa = processo.get("ementa") or ""
    c = extrair(ementa)
    ant = extrair_antecessor(ementa) or {}
    data_mensagem = processo.get("dataApresentacao")
    return {
        "identificacao": processo.get("identificacao"),
        "id_externo": str(processo.get("id") or ""),
        "codigo_materia": processo.get("codigoMateria"),
        "data_mensagem": data_mensagem,
        "data_deliberacao": processo.get("dataDeliberacao"),
        "resultado": processo.get("siglaTipoDeliberacao"),
        "autoria": processo.get("autoria"),
        # A API do Senado só devolve `autoria: "Presidência da República"`,
        # nunca o NOME do Presidente — derivado deterministicamente pela
        # data da Mensagem (ver regras.json "presidentes"). É o que
        # alimenta o poder de indicação em TODOS os tribunais, não só o
        # STF (que até aqui só funcionava por causa do seed manual).
        "autoridade_nomeante": presidente_em(data_mensagem),
        "ementa": ementa,
        "tribunal": c["tribunal"],
        "tribunal_origem": c["tribunal_origem"],
        "cota": c["cota"],
        "dispositivo": c["dispositivo"],
        "motivo_cota": c["motivo"],
        "divergencia": c["divergencia"],
        "nao_judiciario": c["nao_judiciario"],
        "artigos_vistos": c["artigos_vistos"],
        "antecessor_nome": ant.get("antecessor_nome"),
        "motivo_vacancia": ant.get("motivo_vacancia"),
        "url_documento": processo.get("urlDocumento"),
    }


def descobrir(de: int, ate: int, saida: Path | None = None) -> dict:
    """Modo F0: varre um intervalo de anos, mede a extração e NÃO grava no
    banco. É o que responde, com número, se a hipótese central do produto
    se sustenta: 'a ementa da Mensagem revela a cota da cadeira'.
    """
    todas: list[dict] = []
    por_ano: dict[int, dict] = {}

    for ano in range(de, ate + 1):
        try:
            processos = listar(ano)
        except Exception as e:
            print(f"  [erro] {ano}: {e}")
            por_ano[ano] = {"erro": str(e)}
            continue

        indicacoes = so_indicacoes(processos)
        analisadas = [analisar(p) for p in indicacoes]
        judiciais = [a for a in analisadas if a["tribunal"]]
        com_cota = [a for a in judiciais if a["cota"]]

        por_ano[ano] = {
            "msf_total": len(processos),
            "indicacoes": len(indicacoes),
            "judiciais": len(judiciais),
            "com_cota": len(com_cota),
        }
        todas.extend(analisadas)
        print(
            f"  {ano}: {len(processos):3d} MSF · {len(indicacoes):3d} indicações · "
            f"{len(judiciais):3d} judiciais · {len(com_cota):3d} com cota"
        )
        time.sleep(PAUSA_ENTRE_ANOS)

    judiciais = [a for a in todas if a["tribunal"]]
    com_cota = [a for a in judiciais if a["cota"]]
    sem_cota = [a for a in judiciais if not a["cota"]]

    por_tribunal: dict[str, int] = {}
    por_cota: dict[str, int] = {}
    por_origem: dict[str, int] = {}
    for a in judiciais:
        por_tribunal[a["tribunal"]] = por_tribunal.get(a["tribunal"], 0) + 1
        por_origem[a["tribunal_origem"] or "?"] = por_origem.get(a["tribunal_origem"] or "?", 0) + 1
        if a["cota"]:
            por_cota[a["cota"]] = por_cota.get(a["cota"], 0) + 1

    com_antecessor = [a for a in judiciais if a["antecessor_nome"]]
    divergentes = [a for a in todas if a["divergencia"]]

    relatorio = {
        "periodo": f"{de}-{ate}",
        "indicacoes_total": len(todas),
        "judiciais": len(judiciais),
        "com_cota": len(com_cota),
        "sem_cota": len(sem_cota),
        "taxa_cota": round(100 * len(com_cota) / len(judiciais), 1) if judiciais else 0.0,
        "com_antecessor": len(com_antecessor),
        "taxa_antecessor": (
            round(100 * len(com_antecessor) / len(judiciais), 1) if judiciais else 0.0
        ),
        "divergencias": len(divergentes),
        "por_tribunal": dict(sorted(por_tribunal.items(), key=lambda x: -x[1])),
        "por_cota": dict(sorted(por_cota.items(), key=lambda x: -x[1])),
        "tribunal_identificado_por": por_origem,
        "por_ano": por_ano,
        "nao_resolvidos": [
            {"id": a["identificacao"], "motivo": a["motivo_cota"], "ementa": a["ementa"][:220]}
            for a in sem_cota
        ],
    }

    if saida:
        saida.parent.mkdir(parents=True, exist_ok=True)
        saida.write_text(
            json.dumps({"relatorio": relatorio, "indicacoes": todas}, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        # Relatório separado e pequeno: é o que a home lê para exibir a
        # cobertura da F0. A página não pode carregar o corpus inteiro só
        # para mostrar quatro números, e nenhum número da tela pode ser
        # digitado à mão (regra herdada do /congresso: toda frase de
        # leitura é DERIVADA do dado, nunca escrita).
        rel_path = saida.with_name("f0-relatorio.json")
        rel_path.write_text(json.dumps(relatorio, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"\nCorpus  : {saida}\nRelatório: {rel_path}")

    return relatorio


def sync(ano: int) -> int:
    """Modo F2: grava em `nomeacoes`. Exige Supabase configurado."""
    from etl.common import get_supabase_client, upsert_em_lotes

    sb = get_supabase_client()
    analisadas = [analisar(p) for p in so_indicacoes(listar(ano))]
    judiciais = [a for a in analisadas if a["tribunal"]]
    if not judiciais:
        print(f"[senado.indicacoes] nenhuma indicação judicial em {ano}")
        return 0

    linhas = [
        {
            "senado_id_externo": a["id_externo"],
            "senado_identificacao": a["identificacao"],
            "senado_ementa": a["ementa"],
            "dispositivo_vaga": a["dispositivo"],
            "tribunal_id": a["tribunal"],
            "data_mensagem": a["data_mensagem"],
            "data_deliberacao": a["data_deliberacao"],
            "resultado": (a["resultado"] or "").lower() or None,
            "autoridade_nomeante": a["autoridade_nomeante"],
            "cargo_nomeante": "presidente_republica",
            "antecessor_nome": a["antecessor_nome"],
            "motivo_vacancia": a["motivo_vacancia"],
            "url_fonte": a["url_documento"],
            "raw": a,
        }
        for a in judiciais
    ]
    upsert_em_lotes(sb, "nomeacoes", linhas, on_conflict="senado_id_externo")
    print(f"[senado.indicacoes] {len(linhas)} indicações judiciais de {ano}")
    return len(linhas)


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Indicações de autoridade — Senado Federal")
    p.add_argument("--ano", type=int, help="grava um ano (exige Supabase)")
    p.add_argument("--descobrir", action="store_true", help="modo F0: só mede, não grava")
    p.add_argument("--de", type=int, default=2003)
    p.add_argument("--ate", type=int, default=2026)
    p.add_argument("--saida", type=Path, default=Path("docs/f0-corpus-indicacoes.json"))
    args = p.parse_args()

    if args.descobrir:
        print(f"Varrendo MSF de {args.de} a {args.ate}...\n")
        rel = descobrir(args.de, args.ate, args.saida)
        print("\n" + "=" * 62)
        print(f"Indicações de autoridade : {rel['indicacoes_total']}")
        print(f"Judiciárias              : {rel['judiciais']}")
        print(f"Com cota resolvida       : {rel['com_cota']} ({rel['taxa_cota']}%)")
        print(f"Sem cota (revisão humana): {rel['sem_cota']}")
        print(f"Com antecessor nomeado   : {rel['com_antecessor']} ({rel['taxa_antecessor']}%)")
        print(f"Divergências cargo×disp. : {rel['divergencias']}")
        print(f"\nPor tribunal : {rel['por_tribunal']}")
        print(f"Identificado : {rel['tribunal_identificado_por']}")
        print(f"Por cota     : {rel['por_cota']}")
        if rel["nao_resolvidos"]:
            print(f"\n--- {len(rel['nao_resolvidos'])} nao resolvidos ---")
            for n in rel["nao_resolvidos"][:15]:
                print(f"  {n['id']}: {n['motivo']}")
    elif args.ano:
        sync(args.ano)
    else:
        p.print_help()
