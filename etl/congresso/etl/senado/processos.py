"""etl.senado.processos — proposições do Senado Federal.

Rodar:
  python -m etl.senado.processos --ano 2026
  python -m etl.senado.processos --desde 2026-07-01   # por última atualização

FONTE: `legis.senado.leg.br/dadosabertos/processo` — a API **nova**.
Verificada ao vivo em 2026-07-22: devolve JSON limpo, sem autenticação.

O QUE NÃO USAR (e por quê, para ninguém tentar de novo): a API **legada**
(`/dadosabertos/materia/pesquisa/lista`, `/dadosabertos/senador/lista/atual`)
e o **LexML** caem num desafio anti-bot do Senado — respondem uma página
de "Verificação de segurança" ou dão timeout. Não é falta de parâmetro.
Ver `docs/F0-discovery.md`. Por isso este módulo cobre proposições mas
NÃO senadores nem comissões do Senado, que seguem em aberto.

DIFERENÇA ESTRUTURAL EM RELAÇÃO À CÂMARA: o Senado modela `processo`
(o trâmite) separado de `documento` (a peça) e `conteudo` (a norma
pretendida). O campo `objetivo` diz se o Senado é casa **Iniciadora** ou
**Revisora** — quando é revisora, a proposição JÁ EXISTE na Câmara, e
gravar as duas como registros independentes duplicaria o mesmo projeto
para o usuário. Marcamos a origem em `raw` para que o de-duplicação por
identificação possa ser feita depois (F10), mas não adivinhamos o par
aqui: casar "PL 199/2026 (SF)" com o PL correspondente na Câmara exige o
número de origem, que nem sempre vem preenchido.
"""
import argparse
from datetime import date

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from etl.common import get_db, registrar_fonte, upsert_em_lotes

BASE = "https://legis.senado.leg.br/dadosabertos"
CASA_ID = "senado"
TIPOS_PADRAO = ["PL", "PEC", "PLP", "MPV", "PDL"]

_session = requests.Session()
_session.headers.update(
    {
        "Accept": "application/json",
        "User-Agent": "ControlePopular-Congresso/0.1 (+https://controlepopular.br)",
    }
)


@retry(stop=stop_after_attempt(4), wait=wait_exponential(multiplier=1, min=2, max=30))
def get(caminho: str, **params):
    # `v=1` não é decorativo: sem ele a rota devolve 404 ou cai na API
    # legada bloqueada. Descoberto testando endpoint por endpoint.
    params.setdefault("v", 1)
    resp = _session.get(f"{BASE}{caminho}", params=params, timeout=90)
    resp.raise_for_status()
    return resp.json()


def _linha(p: dict) -> dict:
    identificacao = p.get("identificacao") or ""
    sigla, numero, ano = None, None, None
    if identificacao:
        # "PL 199/2026" → ('PL', 199, 2026)
        try:
            sigla, resto = identificacao.split(" ", 1)
            num_str, ano_str = resto.split("/", 1)
            numero, ano = int(num_str.strip()), int(ano_str.strip())
        except (ValueError, AttributeError):
            pass

    return {
        "casa_id": CASA_ID,
        "id_externo": str(p.get("id") or p.get("codigoMateria")),
        "sigla_tipo": sigla,
        "numero": numero,
        "ano": ano,
        "identificacao": identificacao or None,
        "ementa": p.get("ementa"),
        "situacao": p.get("situacaoAtual"),
        "data_apresentacao": p.get("dataApresentacao"),
        "data_ultima_tramitacao": p.get("dataUltimaAtualizacao"),
        # "Sim"/"Não" em texto, não booleano — o campo não é o que o nome sugere.
        "tramitando": (p.get("tramitando") or "").strip().lower() == "sim",
        "url_inteiro_teor": p.get("urlDocumento"),
        "url_fonte": (
            f"https://www25.senado.leg.br/web/atividade/materias/-/materia/{p.get('codigoMateria')}"
            if p.get("codigoMateria")
            else None
        ),
        "raw": p,
    }


def _detalhar(id_processo: str) -> tuple[dict, list[dict]]:
    """Indexação oficial do Senado + histórico de tramitações do processo."""
    d = get(f"/processo/{id_processo}")
    documento = d.get("documento") or {}
    indexacao = (documento.get("indexacao") or "").strip()
    # Vem como " CRIAÇÃO ,  LEI FEDERAL ,  REGULAMENTAÇÃO ": vírgula com
    # espaço duplo e tudo em caixa alta.
    termos = [t.strip() for t in indexacao.split(",") if t.strip()]

    detalhes = {
        "keywords": ", ".join(termos) or None,
        "ementa_detalhada": (d.get("conteudo") or {}).get("ementa"),
    }

    # Extrai andamentos/movimentações da tramitação oficial do Senado
    eventos_brutos = d.get("movimentacoes") or d.get("tramitacoes") or d.get("historico") or []
    tramitacoes: list[dict] = []
    for seq, ev in enumerate(eventos_brutos, 1):
        descricao = ev.get("descricao") or ev.get("texto") or ev.get("descricaoSituacao") or ""
        sigla_orgao = ev.get("siglaOrgao") or ev.get("identificacaoOrgao") or ev.get("orgao")
        data_hora = ev.get("dataHora") or ev.get("data")
        despacho = ev.get("despacho") or ev.get("parecer") or None
        if descricao or sigla_orgao:
            tramitacoes.append(
                {
                    "id_externo": str(id_processo),
                    "sequencia": ev.get("sequencia") or seq,
                    "data_hora": data_hora,
                    "sigla_orgao": sigla_orgao,
                    "descricao": descricao,
                    "despacho": despacho,
                }
            )

    return detalhes, tramitacoes


def sync(
    ano: int | None = None,
    desde: str | None = None,
    tipos: list[str] | None = None,
    com_detalhe: bool = True,
    limite_detalhe: int = 200,
    com_tramitacoes: bool = True,
) -> int:
    db = get_db()
    ano = ano or date.today().year
    tipos = tipos or TIPOS_PADRAO

    linhas: list[dict] = []
    for tipo in tipos:
        try:
            dados = get("/processo", sigla=tipo, ano=ano)
        except Exception as e:
            print(f"  [erro] {tipo}/{ano}: {e}")
            continue
        # A rota devolve uma LISTA na raiz, não um objeto com `dados`
        # (diferente da Câmara) — confirmado ao vivo.
        for p in dados if isinstance(dados, list) else dados.get("dados", []):
            if desde and (p.get("dataUltimaAtualizacao") or "") < desde:
                continue
            linhas.append(_linha(p))

    if not linhas:
        print(f"[senado.processos] nada para {ano}")
        return 0

    todas_tramitacoes: list[dict] = []
    if com_detalhe:
        for linha in linhas[:limite_detalhe]:
            try:
                detalhes, tramitacoes = _detalhar(linha["id_externo"])
                linha.update(detalhes)
                if com_tramitacoes and tramitacoes:
                    todas_tramitacoes.extend(tramitacoes)
            except Exception as e:
                print(f"  [detalhe] {linha['identificacao']}: {e}")

    upsert_em_lotes(db, "proposicoes", linhas, on_conflict="casa_id,id_externo")
    revisoras = sum(1 for x in linhas if (x["raw"].get("objetivo") or "") == "Revisora")
    print(
        f"[senado.processos] {len(linhas)} processos de {ano} "
        f"({revisoras} como casa revisora — já existem na Câmara)"
    )
<<<<<<< Updated upstream
    registrar_fonte(db, "senado_processos", f"{BASE}/processo", "proposicoes")
=======

    # Persiste as tramitações vinculadas pelo UUID gerado em `proposicoes`
    if todas_tramitacoes:
        try:
            from etl.common import fetch_all
            salvas = fetch_all(
                lambda: sb.table("proposicoes")
                .select("id, id_externo")
                .eq("casa_id", CASA_ID)
            )
            mapa_ids = {str(p["id_externo"]): p["id"] for p in salvas if p.get("id_externo")}
            linhas_tramitacao = []
            for t in todas_tramitacoes:
                pid = mapa_ids.get(t["id_externo"])
                if pid:
                    linhas_tramitacao.append(
                        {
                            "proposicao_id": pid,
                            "sequencia": t["sequencia"],
                            "data_hora": t["data_hora"],
                            "sigla_orgao": t["sigla_orgao"],
                            "descricao": t["descricao"],
                            "despacho": t["despacho"],
                        }
                    )
            if linhas_tramitacao:
                upsert_em_lotes(sb, "tramitacoes", linhas_tramitacao)
                print(f"[senado.tramitacoes] {len(linhas_tramitacao)} andamentos gravados")
        except Exception as e:
            print(f"  [erro ao gravar tramitações do Senado] {e}")

    registrar_fonte(sb, "senado_processos", f"{BASE}/processo", "proposicoes")
>>>>>>> Stashed changes
    return len(linhas)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--ano", type=int)
    p.add_argument("--desde", help="AAAA-MM-DD (por dataUltimaAtualizacao)")
    p.add_argument("--tipos", nargs="*")
    p.add_argument("--sem-detalhe", action="store_true")
    p.add_argument("--sem-tramitacoes", action="store_true")
    args = p.parse_args()
    sync(
        args.ano,
        args.desde,
        args.tipos,
        com_detalhe=not args.sem_detalhe,
        com_tramitacoes=not args.sem_tramitacoes,
    )
