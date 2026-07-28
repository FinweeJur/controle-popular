"""etl.analise — fila de análise garantista × reducionista.

Rodar:
  python -m etl.analise                      # processa a fila (teto do .env)
  python -m etl.analise --limite 10
  python -m etl.analise --id PL-2641484      # uma proposição específica
  python -m etl.analise --dry-run            # imprime, não grava

POR QUE FILA E NÃO SOB DEMANDA: com ~4.400 PLs/ano só na Câmara e um
modelo local de 8B, análise síncrona numa requisição HTTP é impossível —
travaria a página por minutos. A UI enfileira e mostra "análise pendente";
este módulo drena a fila em background.

PRIORIDADE (recurso escasso merece ordem explícita):
  1. proposições que casam com algum monitoramento ativo de usuário
  2. proposições em tramitação no ano corrente
  3. o resto (backfill histórico)

O QUE ESTE MÓDULO NÃO FAZ: decidir o rótulo. O LLM só preenche itens; o
score e o rótulo saem de `etl.rubrica.calcular()`, determinístico. Se o
modelo devolver lixo, os itens são descartados na validação e a análise
fica `requer_revisao` — nunca um rótulo inventado no banco.
"""
import argparse
import hashlib
import json
import os

from etl import rubrica
from etl.common import fetch_all, get_supabase_client
from etl.llm import LLMError, get_provider
from etl.normas import extrair as extrair_normas

LIMITE_PADRAO = int(os.environ.get("ANALISE_LIMITE_POR_RODADA", "50"))


def _hash_cache(prop: dict, provider) -> str:
    """Chave de cache = conteúdo + versão de prompt + versão de rubrica +
    modelo. Trocar qualquer um dos quatro invalida a entrada, que é
    exatamente o que se quer: rubrica nova exige reanálise."""
    base = "|".join(
        [
            prop.get("ementa") or "",
            prop.get("ementa_detalhada") or "",
            (prop.get("texto_integral") or "")[:20000],
            rubrica.VERSAO_PROMPT,
            rubrica.VERSAO_RUBRICA,
            provider.identificacao,
        ]
    )
    return hashlib.sha256(base.encode("utf-8")).hexdigest()


def _fila(sb, limite: int) -> list[dict]:
    """Proposições sem análise, na ordem de prioridade."""
    analisadas = {
        linha["proposicao_id"] for linha in fetch_all(lambda: sb.table("analises").select("proposicao_id"))
    }

    # Direitos e palavras-chave que algum usuário está de fato monitorando.
    monitorados_temas: set[str] = set()
    for m in fetch_all(
        lambda: sb.table("monitoramentos").select("temas, palavras_chave").eq("ativo", True)
    ):
        monitorados_temas.update(m.get("temas") or [])
        monitorados_temas.update(m.get("palavras_chave") or [])

    candidatas = fetch_all(
        lambda: sb.table("proposicoes")
        .select("id, casa_id, identificacao, ementa, ementa_detalhada, keywords, temas_oficiais, texto_integral, ano, tramitando")
        .eq("tramitando", True)
        .order("data_apresentacao", desc=True)
    )
    candidatas = [p for p in candidatas if p["id"] not in analisadas]

    def prioridade(p: dict) -> tuple[int, int]:
        texto = f"{p.get('ementa') or ''} {p.get('keywords') or ''} {' '.join(p.get('temas_oficiais') or [])}".lower()
        casa_monitoramento = any(t.lower() in texto for t in monitorados_temas if t)
        return (0 if casa_monitoramento else 1, -(p.get("ano") or 0))

    candidatas.sort(key=prioridade)
    return candidatas[:limite]


def analisar_uma(prop: dict, provider, sb=None, dry_run: bool = False) -> dict:
    """Analisa uma proposição. Nunca lança por culpa do modelo — devolve
    `status` para o chamador decidir."""
    hash_cache = _hash_cache(prop, provider)

    bruto = None
    if sb is not None and not dry_run:
        cached = sb.table("cache_ia").select("resposta").eq("hash", hash_cache).execute()
        if cached.data:
            bruto = cached.data[0]["resposta"]

    if bruto is None:
        try:
            bruto = provider.gerar_json(
                rubrica.montar_prompt(prop), system=rubrica.SYSTEM, temperatura=0.0
            )
        except LLMError as e:
            print(f"  [falhou] {prop.get('identificacao')}: {e}")
            return {"status": "falhou", "erro": str(e)}
        if sb is not None and not dry_run:
            sb.table("cache_ia").upsert(
                {
                    "hash": hash_cache,
                    "tipo": "analise_rubrica",
                    "resposta": bruto,
                    "modelo": provider.identificacao,
                },
                on_conflict="hash",
            ).execute()

    itens, descartes = rubrica.validar_itens(bruto)
    calculo = rubrica.calcular(itens)

    # Legislação relacionada é determinística (regex), não vem do modelo —
    # se o LLM listar normas em `normas_alteradas`, elas são ignoradas de
    # propósito: o extrator é auditável e o modelo não.
    fonte_normas = f"{prop.get('ementa') or ''}\n{(prop.get('texto_integral') or '')[:20000]}"
    legislacao = extrair_normas(fonte_normas)

    status = "ok"
    if not itens and descartes:
        status = "requer_revisao"
    elif calculo["requer_revisao"]:
        status = "requer_revisao"

    return {
        "status": status,
        "itens": itens,
        "descartes": descartes,
        "analise": {
            "proposicao_id": prop["id"],
            "score": calculo["score"],
            "rotulo": calculo["rotulo"],
            "clausula_petrea": bool(bruto.get("clausula_petrea")),
            "vedacao_retrocesso": bool(bruto.get("vedacao_retrocesso")),
            "resumo_neutro": (bruto.get("resumo_neutro") or "")[:4000] or None,
            "legislacao_relacionada": legislacao or None,
            "modelo": provider.identificacao,
            "versao_rubrica": rubrica.VERSAO_RUBRICA,
            "versao_prompt": rubrica.VERSAO_PROMPT,
            "status": status,
        },
    }


def sync(limite: int = LIMITE_PADRAO, dry_run: bool = False) -> int:
    provider = get_provider()
    print(f"[analise] provedor: {provider.identificacao}")
    if not provider.disponivel():
        # Falhar em 1 segundo em vez de descobrir na centésima proposição.
        print("[analise] provedor indisponível — nada a fazer. O app continua "
              "funcionando: proposições sem análise aparecem como 'análise pendente'.")
        return 0

    sb = get_supabase_client()
    fila = _fila(sb, limite)
    print(f"[analise] {len(fila)} proposições na fila (teto {limite})")

    ok = revisao = falhou = 0
    for prop in fila:
        r = analisar_uma(prop, provider, sb=sb, dry_run=dry_run)
        if r["status"] == "falhou":
            falhou += 1
            continue

        if dry_run:
            print(json.dumps(r["analise"], ensure_ascii=False, indent=2))
            print(f"  itens: {len(r['itens'])} | descartes: {r['descartes']}")
        else:
            resp = sb.table("analises").upsert(r["analise"], on_conflict="proposicao_id").execute()
            analise_id = resp.data[0]["id"]
            sb.table("analise_itens").delete().eq("analise_id", analise_id).execute()
            if r["itens"]:
                sb.table("analise_itens").insert(
                    [{**i, "analise_id": analise_id} for i in r["itens"]]
                ).execute()

        if r["status"] == "ok":
            ok += 1
        else:
            revisao += 1
        print(
            f"  {prop.get('identificacao')}: {r['analise']['rotulo']} "
            f"(score {r['analise']['score']}, {len(r['itens'])} itens) [{r['status']}]"
        )

    print(f"[analise] {ok} ok · {revisao} requer revisão · {falhou} falhou")
    return ok + revisao


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--limite", type=int, default=LIMITE_PADRAO)
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()
    sync(args.limite, dry_run=args.dry_run)
