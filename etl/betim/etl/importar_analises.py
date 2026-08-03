"""etl.importar_analises — traz para o banco as respostas geradas fora.

    python -m etl.importar_analises --id-municipio 3106705 --dir analises_pendentes
    python -m etl.importar_analises --id-municipio 3106705 --dir analises_pendentes --dry-run
    python -m etl.importar_analises --id-municipio 3106200 --dir pendentes/lei_vigente_com_sinal --modelo claude-opus-5

Par de `etl.exportar_prompts`. Lê `<id>.json` de cada objeto do manifesto,
valida contra a rubrica e grava `analises` + `analise_itens`.

═══ O GUARDA-CORPO ESTÁ AQUI, E É O PONTO DO MÓDULO ═══

A resposta veio de um modelo que este código não controla, possivelmente
colada à mão, possivelmente de um chat que "resumiu" alguns campos. Ainda
assim:

  1. Item sem dispositivo legal citável é DESCARTADO antes de contar
     (`rubrica.validar_itens` — a do Congresso, não uma cópia). Slug de
     direito fora da taxonomia, direção ou grau inválidos: descartados
     também, com o motivo registrado. Nada é "corrigido" em silêncio.
  2. `score` e `rotulo` saem de `rubrica.calcular()`, determinístico, sobre
     os itens que SOBRARAM. Nunca do que o modelo disse que era. Se o JSON
     trouxer `"rotulo": "garantista_forte"`, o campo é ignorado — ele nem é
     lido.
  3. `legislacao_relacionada` sai da EMENTA por regex auditável
     (`analise_garantista.extrair_normas`), não de `normas_alteradas` que o
     modelo devolveu: a lista do modelo não é verificável e entraria no
     banco como fato sem procedência.
  4. A ementa usada em (3) é relida DO BANCO, não do arquivo. O arquivo de
     resposta não é fonte de fato nenhum sobre o objeto — só de análise.

Um JSON malicioso ou distraído não consegue plantar um rótulo no banco.

═══ DOIS OBJETOS, UMA TABELA ═══

`public.analises` tem `ato_id` e `proposicao_id`, exatamente um preenchido
(CHECK `num_nonnulls = 1`, migration 0033). O manifesto diz qual é qual; o
importador agrupa e faz um upsert por grupo, porque `ON CONFLICT` só aceita
uma coluna-alvo por instrução.
"""
import argparse
import json
from pathlib import Path

from etl import analise_garantista as ag
from etl.common import fetch_all, get_supabase_client


def _ementas_do_banco(sb, id_municipio: str, objetos: list[dict]) -> dict[str, str]:
    """Ementas relidas do banco, por id. Ver guarda-corpo (4)."""
    ementas: dict[str, str] = {}
    for tabela, tipo in (("atos_oficiais", "ato"), ("proposicoes", "proposicao")):
        ids = [o["id"] for o in objetos if o["tipo_objeto"] == tipo]
        for i in range(0, len(ids), 200):
            lote = ids[i : i + 200]
            linhas = (
                sb.table(tabela)
                .select("id, ementa")
                .eq("id_municipio", id_municipio)
                .in_("id", lote)
                .execute()
                .data
            )
            for r in linhas:
                ementas[r["id"]] = r.get("ementa") or ""
    return ementas


def importar(diretorio: Path, id_municipio: str, modelo: str, dry_run: bool) -> dict:
    manifesto_path = diretorio / "_manifesto.json"
    if not manifesto_path.exists():
        raise SystemExit(
            f"{manifesto_path} não existe — rode "
            f"`python -m etl.exportar_prompts --id-municipio {id_municipio} --dir {diretorio}` antes."
        )
    manifesto = json.loads(manifesto_path.read_text(encoding="utf-8"))

    if manifesto["versao_rubrica"] != ag.VERSAO_RUBRICA:
        raise SystemExit(
            f"rubrica mudou desde a exportação ({manifesto['versao_rubrica']} → "
            f"{ag.VERSAO_RUBRICA}). Reexporte: as respostas foram feitas com outra "
            f"taxonomia e misturá-las compararia duas réguas."
        )
    if manifesto["versao_prompt"] != ag.VERSAO_PROMPT:
        raise SystemExit(
            f"prompt mudou desde a exportação ({manifesto['versao_prompt']} → "
            f"{ag.VERSAO_PROMPT}). Reexporte pelo mesmo motivo."
        )
    if manifesto["id_municipio"] != id_municipio:
        # A cidade não é adivinhada nem inferida do argumento: as duas têm de
        # bater. Importar as respostas de Betim com `--id-municipio 3550308`
        # gravaria análise de São Paulo sobre lei de Betim, e o FK não
        # reclamaria — `ato_id` existe, `id_municipio` existe, só não são a
        # mesma cidade. É a mesma falha silenciosa de `--id-municipio` que
        # `scripts/conferir_defaults_de_cidade.py` existe para impedir.
        raise SystemExit(
            f"o manifesto é de {manifesto['id_municipio']} ({manifesto.get('municipio')}) "
            f"e você passou --id-municipio {id_municipio}. Recusando."
        )

    sb = get_supabase_client()
    modelo = modelo or manifesto.get("modelo_pretendido") or "externo"
    objetos = manifesto["objetos"]
    ementas = _ementas_do_banco(sb, id_municipio, objetos)

    analises: list[dict] = []
    itens_por_objeto: list[tuple[str, str, list[dict]]] = []  # (tipo_objeto, id, itens)
    stats = {"ok": 0, "requer_revisao": 0, "faltando": 0, "invalido": 0, "descartes": 0, "orfao": 0}

    for entrada in objetos:
        oid, tipo, ident = entrada["id"], entrada["tipo_objeto"], entrada.get("identificacao")
        arq = diretorio / f"{oid}.json"
        if not arq.exists():
            stats["faltando"] += 1
            continue
        if oid not in ementas:
            # O objeto sumiu do banco (ou é de outra cidade) entre exportar e
            # importar. Gravar assim mesmo violaria o FK — melhor contar e
            # dizer do que estourar no meio do lote.
            print(f"  [ÓRFÃO] {ident}: id não está em {id_municipio}")
            stats["orfao"] += 1
            continue

        try:
            bruto = json.loads(arq.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            print(f"  [JSON INVÁLIDO] {ident}: {e}")
            stats["invalido"] += 1
            continue
        if not isinstance(bruto, dict):
            print(f"  [JSON INVÁLIDO] {ident}: esperava objeto, veio {type(bruto).__name__}")
            stats["invalido"] += 1
            continue

        itens, descartes = ag.validar_itens(bruto)
        calc = ag.calcular(itens)
        stats["descartes"] += len(descartes)

        # Lista vazia SEM descartes é resposta CERTA — a regra 3 do prompt
        # (e o adendo municipal 9) mandam devolver vazio para crédito
        # suplementar, denominação de logradouro e data comemorativa. Marcar
        # isso como "requer_revisao" trataria acerto como falha e encheria a
        # fila de revisão com nada. Vazio COM descartes é outra coisa: o
        # modelo tentou e produziu só lixo.
        status = "ok"
        if not itens and descartes:
            status = "requer_revisao"
        elif calc["requer_revisao"]:
            status = "requer_revisao"
        stats[status] += 1

        analises.append(
            {
                "id_municipio": id_municipio,
                "ato_id": oid if tipo == "ato" else None,
                "proposicao_id": oid if tipo == "proposicao" else None,
                "score": calc["score"],
                "rotulo": calc["rotulo"],
                "clausula_petrea": bool(bruto.get("clausula_petrea")),
                "vedacao_retrocesso": bool(bruto.get("vedacao_retrocesso")),
                "resumo_neutro": (bruto.get("resumo_neutro") or "")[:4000] or None,
                "legislacao_relacionada": ag.extrair_normas(ementas.get(oid, "")) or None,
                "modelo": modelo,
                "versao_rubrica": ag.VERSAO_RUBRICA,
                "versao_prompt": ag.VERSAO_PROMPT,
                "status": status,
            }
        )
        itens_por_objeto.append((tipo, oid, itens))
        if descartes:
            print(f"  {ident}: {calc['rotulo']} (score {calc['score']}, {len(itens)} itens) "
                  f"[{status}] descartes: {descartes}")
        else:
            print(f"  {ident}: {calc['rotulo']} (score {calc['score']}, {len(itens)} itens) [{status}]")

    if dry_run:
        print(f"\n[dry-run] nada gravado. {stats}")
        return stats
    if not analises:
        print(f"\n[importar] nada para gravar. {stats}")
        return stats

    # Um upsert por coluna-alvo: `ON CONFLICT` aceita só uma por instrução.
    for coluna in ("ato_id", "proposicao_id"):
        grupo = [a for a in analises if a[coluna]]
        if grupo:
            sb.table("analises").upsert(grupo, on_conflict=coluna).execute()

    # Os itens dependem do uuid da análise, que só existe depois do upsert.
    salvas: dict[str, str] = {}
    for linha in fetch_all(
        lambda: sb.table("analises")
        .select("id, ato_id, proposicao_id")
        .eq("id_municipio", id_municipio)
    ):
        chave = linha.get("ato_id") or linha.get("proposicao_id")
        salvas[chave] = linha["id"]

    # Reimportar o mesmo objeto não pode duplicar item: limpa antes.
    ids_analise = [salvas[oid] for _, oid, _ in itens_por_objeto if oid in salvas]
    if ids_analise:
        for i in range(0, len(ids_analise), 500):
            sb.table("analise_itens").delete().in_("analise_id", ids_analise[i : i + 500]).execute()

    linhas_itens = [
        {**item, "analise_id": salvas[oid], "id_municipio": id_municipio}
        for _, oid, itens in itens_por_objeto
        if oid in salvas
        for item in itens
    ]
    if linhas_itens:
        sb.table("analise_itens").insert(linhas_itens).execute()

    print(f"\n[importar] {len(analises)} análises, {len(linhas_itens)} itens. {stats}")
    return stats


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    # Sem default de cidade: ver scripts/conferir_defaults_de_cidade.py.
    ap.add_argument("--id-municipio", required=True)
    ap.add_argument("--dir", default="analises_pendentes")
    ap.add_argument("--modelo", default="")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    importar(Path(a.dir), a.id_municipio, a.modelo, a.dry_run)
