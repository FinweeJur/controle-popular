"""etl.camara.eventos — agenda legislativa: audiências públicas e reuniões.

Rodar:
    python -m etl.camara.eventos                    # -30 a +90 dias
    python -m etl.camara.eventos --dias-frente 180
    python -m etl.camara.eventos --de 2026-01-01 --ate 2026-12-31
    python -m etl.camara.eventos --sem-pauta        # pula a pauta (mais rápido)

O QUE ESTA FONTE ACRESCENTA ao portal: até aqui o app só mostrava o
passado (tramitação) e o julgamento (análise). A agenda é o único dado que
permite AGIR ANTES — audiência pública é o momento em que sociedade civil
fala dentro da comissão, e ela é anunciada com data, local e lista de
convidados no campo `descricao`.

MEDIÇÕES QUE DEFINIRAM O DESENHO (ao vivo, 2026-07-29):
  - A LISTA (`/eventos?dataInicio&dataFim`) já devolve órgãos, situação,
    `localCamara` e `urlRegistro`. Não precisa de uma chamada de detalhe por
    evento — o que economiza ~1 requisição por evento e é o que mantém este
    ETL longe do throttle que já travou `etl.camara.bancadas`.
  - A PAUTA (`/eventos/{id}/pauta`) é a única que exige chamada por evento,
    e vale: é ela que diz QUAL projeto será votado, com relator e parecer.
  - Volume real é pequeno: 15 eventos em ago-set/2026 (Congresso saindo do
    recesso), 100 por página no ano inteiro. Isto não é um ETL pesado.
  - `/eventos/{id}/pauta` volta `[]` para evento sem deliberação (audiência,
    seminário). Vazio é resposta legítima, não falha.
  - A API **não** publica a URL para humano; ela é montada aqui a partir do
    id (`camara.leg.br/evento-legislativo/{id}`, verificado 200).

Códigos de tipo relevantes (de `referencias/tiposEvento`, guardados em
`cod_tipo` porque o TEXTO muda de grafia entre anos e o código não):
  120 Audiência Pública · 125 Audiência Pública e Deliberação
  112 Reunião Deliberativa · 110 Sessão Deliberativa
  130 Seminário · 140 Mesa Redonda · 122 Tomada de Depoimento
"""

from __future__ import annotations

import argparse
import sys
from datetime import date, timedelta

from ..common import fetch_all, get_supabase_client, registrar_fonte, upsert_em_lotes
from . import client

URL_PUBLICA = "https://www.camara.leg.br/evento-legislativo/{id}"

# Tipos em que a sociedade civil participa ou que decidem o destino de um
# projeto. A UI destaca estes; os outros continuam listados.
COD_AUDIENCIA = {120, 125, 122}
COD_DELIBERATIVO = {110, 112}


def mapa_tipos() -> dict[str, int]:
    """`descricaoTipo` -> `cod`, de `referencias/tiposEvento`.

    POR QUE ISTO EXISTE — bug achado na primeira carga real: a LISTA de
    eventos **não devolve `codTipoEvento`** (só `descricaoTipo`), ao
    contrário do detalhe. O código lia `ev["codTipoEvento"]`, recebia
    `None`, e gravou 820 eventos com `cod_tipo` nulo — de modo que o filtro
    "só audiências públicas" encontrava ZERO, sem erro nenhum. A contagem
    de audiências no fim da rodada é o que denunciou (0 num período com
    audiências).

    Casar pelo texto é inevitável aqui, mas o mapa vem da PRÓPRIA tabela de
    referência da API, não de uma lista escrita à mão — se a Câmara
    renomear um tipo, o mapa acompanha na mesma rodada. Normalizado em
    minúsculas sem espaços nas pontas porque as duas fontes já divergiram em
    caixa entre anos.
    """
    tipos = client.get("/referencias/tiposEvento").get("dados", [])
    return {
        (t.get("nome") or "").strip().lower(): int(t["cod"])
        for t in tipos
        if t.get("cod") is not None and t.get("nome")
    }


def _texto(v) -> str | None:
    if v is None:
        return None
    s = str(v).strip()
    return s or None


def _cod(ev: dict, tipos: dict[str, int]) -> int | None:
    """Código do tipo do evento, venha ele do campo ou do texto."""
    if ev.get("codTipoEvento") is not None:
        return int(ev["codTipoEvento"])
    nome = (ev.get("descricaoTipo") or "").strip().lower()
    return tipos.get(nome)


def _linha_evento(ev: dict, tipos: dict[str, int]) -> dict:
    local = ev.get("localCamara") or {}
    # `localCamara` vem com nome/prédio/sala/andar quase sempre nulos fora do
    # `nome`; juntar o que existe evita "None, None" na tela.
    partes = [local.get("nome"), local.get("predio"), local.get("sala"), local.get("andar")]
    descricao_tipo = _texto(ev.get("descricaoTipo"))
    return {
        "casa_id": client.CASA_ID,
        "id_externo": str(ev["id"]),
        # `codTipoEvento` só vem no DETALHE; na lista, resolvemos pelo texto
        # contra a tabela de referência (ver `mapa_tipos`).
        "cod_tipo": _cod(ev, tipos),
        "tipo": descricao_tipo,
        "descricao": _texto(ev.get("descricao")),
        "situacao": _texto(ev.get("situacao")),
        "inicio": ev.get("dataHoraInicio"),
        "fim": ev.get("dataHoraFim"),
        "local_nome": ", ".join(p for p in partes if p) or None,
        "local_externo": _texto(ev.get("localExterno")),
        "url_registro": _texto(ev.get("urlRegistro")),
        "url_fonte": URL_PUBLICA.format(id=ev["id"]),
        "orgaos": [o.get("sigla") for o in ev.get("orgaos") or [] if o.get("sigla")] or None,
        "raw": ev,
    }


def _linhas_pauta(evento_uuid: str, itens: list[dict], mapa_props: dict[str, str]) -> list[dict]:
    linhas = []
    for it in itens:
        # `proposicao_` é o documento em apreciação (às vezes um parecer);
        # `proposicaoRelacionada_` é o projeto de origem. Para o cidadão, o
        # que importa é o PROJETO — é o que ele acompanha e o que este banco
        # analisa. Então a relacionada tem prioridade na hora de casar.
        rel = it.get("proposicaoRelacionada_") or {}
        prop = it.get("proposicao_") or {}
        id_ext = str(rel.get("id") or prop.get("id") or "") or None
        relator = it.get("relator") or {}
        titulo = _texto(it.get("titulo"))
        if not titulo:
            # Item sem título não é exibível nem identificável; e é a PK.
            continue
        linhas.append(
            {
                "evento_id": evento_uuid,
                "ordem": it.get("ordem") or 0,
                "titulo": titulo,
                "topico": _texto(it.get("topico")),
                "regime": _texto(it.get("regime")),
                "relator_nome": _texto(relator.get("nome")),
                "relator_partido": _texto(relator.get("siglaPartido")),
                "relator_uf": _texto(relator.get("siglaUf")),
                "texto_parecer": _texto(it.get("textoParecer")),
                "proposicao_id": mapa_props.get(id_ext) if id_ext else None,
                "proposicao_id_externo": id_ext,
            }
        )
    return linhas


def sincronizar(de: date, ate: date, com_pauta: bool = True) -> tuple[int, int]:
    sb = get_supabase_client()
    mapa_props = {
        str(r["id_externo"]): str(r["id"])
        for r in fetch_all(
            lambda: sb.table("proposicoes").select("id, id_externo").eq("casa_id", client.CASA_ID)
        )
    }

    tipos = mapa_tipos()

    print(f"[eventos] janela {de} .. {ate}")
    eventos = list(
        client.paginar("/eventos", dataInicio=de.isoformat(), dataFim=ate.isoformat())
    )
    if not eventos:
        print("[eventos] nenhum evento na janela")
        return 0, 0

    linhas = [_linha_evento(ev, tipos) for ev in eventos]
    n = upsert_em_lotes(sb, "eventos", linhas, on_conflict="casa_id,id_externo")

    # Recupera os uuids que o banco atribuiu, para gravar a pauta.
    ids_externos = [l["id_externo"] for l in linhas]
    uuid_por_externo = {
        str(r["id_externo"]): str(r["id"])
        for r in sb.table("eventos")
        .select("id, id_externo")
        .eq("casa_id", client.CASA_ID)
        .in_("id_externo", ids_externos)
        .execute()
        .data
    }

    n_pauta = 0
    if com_pauta:
        # Só eventos DELIBERATIVOS têm pauta. Medido: `/eventos/{id}/pauta`
        # devolve `[]` para audiência, seminário e visita técnica. Pular
        # esses corta a maior parte das requisições — na janela de mai-jul
        # eram 820 eventos, e uma chamada por evento é o único custo alto
        # deste ETL. Menos pressão na API é menos risco de throttle.
        deliberativos = [
            ev for ev in eventos if _cod(ev, tipos) in COD_DELIBERATIVO | COD_AUDIENCIA
        ]
        print(f"[eventos] buscando pauta de {len(deliberativos)} de {len(eventos)} eventos")
        pauta_linhas: list[dict] = []
        for i, ev in enumerate(deliberativos, 1):
            uuid = uuid_por_externo.get(str(ev["id"]))
            if not uuid:
                continue
            try:
                itens = client.get(f"/eventos/{ev['id']}/pauta").get("dados", [])
            except Exception as e:  # noqa: BLE001 — um evento não derruba a rodada
                print(f"[eventos] pauta do evento {ev['id']} falhou: {e}")
                continue
            pauta_linhas.extend(_linhas_pauta(uuid, itens, mapa_props))
            # Grava a cada 50 eventos em vez de acumular a fatia inteira: a
            # mesma disciplina de `etl.camara.proposicoes` (FLUSH=200) — o
            # que foi gravado fica gravado, e o progresso é visível.
            if len(pauta_linhas) >= 200 or i == len(deliberativos):
                n_pauta += upsert_em_lotes(
                    sb, "evento_pauta", pauta_linhas, on_conflict="evento_id,ordem,titulo"
                )
                pauta_linhas = []

    audiencias = sum(1 for e in eventos if _cod(e, tipos) in COD_AUDIENCIA)
    registrar_fonte(
        sb,
        nome="camara-eventos",
        url=f"{client.BASE}/eventos",
        tipo_dados="agenda legislativa (eventos, audiências públicas, pauta)",
    )
    print(
        f"[eventos] {n} eventos gravados ({audiencias} audiência/depoimento), "
        f"{n_pauta} itens de pauta"
    )
    return n, n_pauta


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Agenda legislativa da Câmara (eventos).")
    p.add_argument("--de", help="data inicial YYYY-MM-DD")
    p.add_argument("--ate", help="data final YYYY-MM-DD")
    p.add_argument("--dias-atras", type=int, default=30)
    p.add_argument("--dias-frente", type=int, default=90)
    p.add_argument("--sem-pauta", action="store_true", help="não busca a pauta dos eventos")
    args = p.parse_args(argv)

    hoje = date.today()
    de = date.fromisoformat(args.de) if args.de else hoje - timedelta(days=args.dias_atras)
    ate = date.fromisoformat(args.ate) if args.ate else hoje + timedelta(days=args.dias_frente)

    # A API devolve 504 em janela de data larga em `/votacoes` (registrado na
    # F0). `/eventos` aguentou o ano inteiro na medição, mas fatiar por
    # trimestre mantém cada requisição pequena e isola a falha de uma fatia.
    total_ev = total_pauta = 0
    inicio = de
    while inicio <= ate:
        fim = min(inicio + timedelta(days=90), ate)
        try:
            a, b = sincronizar(inicio, fim, com_pauta=not args.sem_pauta)
            total_ev += a
            total_pauta += b
        except Exception as e:  # noqa: BLE001
            print(f"[eventos] fatia {inicio}..{fim} falhou: {e} — seguindo")
        inicio = fim + timedelta(days=1)

    print(f"[eventos] total: {total_ev} eventos, {total_pauta} itens de pauta")
    return 0


if __name__ == "__main__":
    sys.exit(main())
