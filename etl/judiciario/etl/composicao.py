"""etl.composicao — carrega a composição curada de um tribunal.

Rodar:
    python -m etl.composicao stj stm tst trf6      # os curados
    python -m etl.composicao tjmg                  # do JSON do scraper (F8)
    python -m etl.composicao --todos
    python -m etl.composicao --conferir stj        # só valida, não grava

DIFERENÇA EM RELAÇÃO A `etl.magistrados`: aquele módulo GERA SQL de seed para
o STF, onde cada ministro tem cadeira, nomeante e data de nascimento curados.
Este grava direto e aceita o caso muito mais comum — o tribunal cuja fonte
pública NÃO diz quem senta em qual cadeira.

DUAS FORMAS DE VÍNCULO, e a escolha é do dado, não da conveniência:
  - `ocupacoes` (cadeira + cota) quando o integrante tem `cadeira_numero`.
    Só STJ e STM têm, porque só neles a cota de cada cadeira foi verificada.
  - `magistrados.tribunal_atual` quando não tem. Registra "integra o tribunal"
    sem afirmar "ocupa a cadeira N, da cota X".

Por que isso importa: a métrica central deste produto é "quantas vagas de cada
cota abrem até tal ano". Atribuir cota sem fonte não deixaria a tela vazia —
deixaria a tela ERRADA, com números plausíveis. O TST tem 27 cadeiras, 5 do
quinto, e a página oficial não diz quem entrou por qual classe; então os 26
ministros do TST entram sem cadeira, e a UI diz quantos são de quantos.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .common import get_supabase_client, upsert_em_lotes

DADOS = Path(__file__).resolve().parent / "dados"

# Cota do schema a partir da granularidade que a fonte publica.
# STJ: a linha sucessória diz "TRF 5ª", "TJAL", "OAB/DF", "MPSP".
# STM: a composição diz "Marinha", "Exército", "Aeronáutica", "civil".
COTA_POR_ORIGEM = {
    "Marinha": "militar_marinha",
    "Exército": "militar_exercito",
    "Aeronáutica": "militar_aeronautica",
    "civil": "civil_stm",
}


def cota_de(origem: str | None) -> str | None:
    """Traduz a origem publicada para a cota do schema."""
    if not origem:
        return None
    if origem in COTA_POR_ORIGEM:
        return COTA_POR_ORIGEM[origem]
    o = origem.upper()
    if o.startswith("TRF"):
        return "terco_trf"
    if o.startswith("TJ"):
        return "terco_tj"
    if o.startswith("OAB"):
        return "terco_oab"
    if o.startswith("MP"):
        return "terco_mp"
    return None


def carregar(tribunal: str) -> dict:
    """Lê o JSON curado, ou o do scraper do TJMG (formato próprio, da F8)."""
    p = DADOS / f"composicao-{tribunal}.json"
    if p.exists():
        return json.loads(p.read_text("utf-8"))

    if tribunal == "tjmg":
        # O scraper do TJMG (F8) grava `desembargadores: [{nome, url_curriculo,
        # categoria}]`. Adaptar aqui em vez de reescrever o scraper mantém o
        # arquivo dele intocado e auditável contra a página de origem.
        d = json.loads((DADOS / "tjmg-desembargadores.json").read_text("utf-8"))
        ativos = [x for x in d["desembargadores"] if x.get("categoria") == "ativo"]
        return {
            "tribunal": "tjmg",
            "cargo": "desembargador",
            "fonte": d.get("fonte", ""),
            "integrantes": [
                {
                    "slug": _slug(x["nome"]),
                    "nome": x["nome"],
                    "nome_completo": x["nome"],
                    "url_curriculo": x.get("url_curriculo"),
                    "data_nascimento": None,
                }
                for x in ativos
            ],
        }

    raise FileNotFoundError(f"sem dados curados para '{tribunal}' em {DADOS}")


def _slug(nome: str) -> str:
    import re
    import unicodedata

    s = unicodedata.normalize("NFKD", nome).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s


def conferir(d: dict) -> list[str]:
    """Checagens que pegam erro de curadoria ANTES de gravar.

    A mais valiosa é a de slug duplicado: `magistrados.slug` é a chave de
    idempotência, então dois integrantes com o mesmo slug fariam o segundo
    SOBRESCREVER o primeiro — o tribunal apareceria com um integrante a menos
    e nenhum erro. Foi a checagem que justificou existir este `--conferir`.
    """
    problemas = []
    integrantes = d.get("integrantes", [])
    if not integrantes:
        problemas.append("nenhum integrante no arquivo")

    slugs = [i.get("slug") for i in integrantes]
    dups = {s for s in slugs if s and slugs.count(s) > 1}
    if dups:
        problemas.append(f"slug duplicado: {sorted(dups)}")
    if any(not s for s in slugs):
        problemas.append("integrante sem slug")

    cadeiras = [i.get("cadeira_numero") for i in integrantes if i.get("cadeira_numero")]
    dup_cad = {c for c in cadeiras if cadeiras.count(c) > 1}
    if dup_cad:
        problemas.append(f"cadeira repetida: {sorted(dup_cad)}")

    # Origem que não mapeia para cota conhecida: seria gravada como null e a
    # pessoa entraria sem cota, silenciosamente.
    for i in integrantes:
        if i.get("cadeira_numero") and i.get("origem") and not cota_de(i["origem"]):
            problemas.append(f"origem sem cota conhecida: {i['origem']} ({i['nome']})")
    return problemas


def sincronizar(tribunal: str) -> tuple[int, int]:
    """Grava a composição. Devolve (magistrados, ocupações)."""
    d = carregar(tribunal)
    problemas = conferir(d)
    if problemas:
        for p in problemas:
            print(f"[composicao] PROBLEMA: {p}")
        raise SystemExit(f"[composicao] {tribunal}: curadoria inconsistente, nada gravado")

    sb = get_supabase_client()
    trib = d["tribunal"]
    cargo = d.get("cargo")
    fonte = d.get("fonte", "")
    integrantes = d["integrantes"]

    magistrados = [
        {
            "slug": i["slug"],
            "nome": i["nome"],
            "nome_completo": i.get("nome_completo") or i["nome"],
            "data_nascimento": i.get("data_nascimento"),
            "origem_carreira": i.get("origem"),
            "url_curriculo": i.get("url_curriculo"),
            "cargo": cargo,
            # `tribunal_atual` é gravado para TODOS, inclusive quem tem cadeira:
            # ele responde "integra qual tribunal hoje", que é uma pergunta de
            # leitura, e não depende de a cota ter sido verificada.
            "tribunal_atual": trib,
            "fonte_curadoria": fonte,
        }
        for i in integrantes
    ]
    n_mag = upsert_em_lotes(sb, "magistrados", magistrados, on_conflict="slug")

    # Recupera os uuids pelos slugs para montar as ocupações.
    slugs = [m["slug"] for m in magistrados]
    id_por_slug = {
        r["slug"]: str(r["id"])
        for r in sb.table("magistrados").select("id, slug").in_("slug", slugs).execute().data
    }

    com_cadeira = [i for i in integrantes if i.get("cadeira_numero")]
    n_ocup = 0
    if com_cadeira:
        cadeiras = {
            int(r["numero"]): str(r["id"])
            for r in sb.table("cadeiras")
            .select("id, numero")
            .eq("tribunal_id", trib)
            .execute()
            .data
        }
        ocupacoes = []
        for i in com_cadeira:
            cid = cadeiras.get(int(i["cadeira_numero"]))
            mid = id_por_slug.get(i["slug"])
            if not cid or not mid:
                print(
                    f"[composicao] pulando {i['nome']}: "
                    f"{'cadeira ' + str(i['cadeira_numero']) + ' inexistente' if not cid else 'magistrado não gravado'}"
                )
                continue
            ocupacoes.append(
                {
                    "cadeira_id": cid,
                    "magistrado_id": mid,
                    "data_posse": i.get("data_posse"),
                }
            )
        if ocupacoes:
            n_ocup = upsert_em_lotes(
                sb,
                "ocupacoes",
                ocupacoes,
                on_conflict="cadeira_id,magistrado_id,data_posse",
            )

    sem_cadeira = len(integrantes) - len(com_cadeira)
    print(
        f"[composicao] {trib}: {n_mag} magistrados, {n_ocup} ocupações com cadeira, "
        f"{sem_cadeira} sem cadeira (cota não publicada pela fonte)"
    )
    for v in d.get("cadeiras_vagas", []):
        print(
            f"[composicao] {trib}: cadeira {v['cadeira_numero']} VAGA "
            f"(cota {v.get('cota')}, origem {v.get('origem')})"
        )
    return n_mag, n_ocup


def _normalizar(s: str) -> str:
    import re
    import unicodedata

    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"\s+", " ", s).strip()


def ligar_nomeacoes(tribunal: str | None = None) -> int:
    """Liga `nomeacoes.magistrado_id` casando o NOME COMPLETO na ementa.

    POR QUE ISTO DESTRAVA O PRODUTO: o "poder de indicação" — que fração de um
    tribunal foi nomeada por qual autoridade — é calculado ligando a ocupação
    atual à nomeação pelo `magistrado_id`. A API do Senado não devolve o
    `magistrado_id` (ela não sabe deste banco), e sem a ligação a página do STJ
    dizia "0 de 33 cadeiras com nomeante conhecido" mesmo com as 32 ocupações
    e as 33 nomeações reais no banco, lado a lado.

    A REGRA DE CASAMENTO É DELIBERADAMENTE ESTRITA: o `nome_completo` do
    magistrado tem de aparecer INTEIRO dentro da ementa (sem acento, em
    minúsculas). Casar por sobrenome encontraria mais — e atribuiria a
    nomeação errada em tribunal com dois "Silva", creditando um presidente que
    não indicou aquela pessoa. Errar aqui produz o número central do produto
    invertido, então é melhor deixar sem ligação e a cobertura cair: cobertura
    baixa é um aviso visível; nomeante errado é uma afirmação falsa.

    Idempotente: só escreve onde `magistrado_id` está nulo.
    """
    sb = get_supabase_client()
    q = sb.table("nomeacoes").select("id, tribunal_id, senado_ementa, magistrado_id")
    if tribunal:
        q = q.eq("tribunal_id", tribunal)
    nomeacoes = [n for n in q.execute().data if not n.get("magistrado_id")]

    magistrados = sb.table("magistrados").select("id, nome, nome_completo").execute().data
    # Do mais longo para o mais curto: se um nome completo contém outro
    # ("Carlos Augusto Amaral Oliveira" x "Carlos Augusto"), o mais específico
    # tem de ser testado primeiro.
    candidatos = sorted(
        ((_normalizar(m.get("nome_completo") or m["nome"]), str(m["id"])) for m in magistrados),
        key=lambda x: -len(x[0]),
    )

    ligadas = []
    for n in nomeacoes:
        ementa = _normalizar(n.get("senado_ementa") or "")
        if not ementa:
            continue
        for nome, mid in candidatos:
            if len(nome) >= 12 and nome in ementa:
                ligadas.append({"id": str(n["id"]), "magistrado_id": mid})
                break

    if ligadas:
        upsert_em_lotes(sb, "nomeacoes", ligadas, on_conflict="id")
    print(
        f"[composicao] nomeações ligadas: {len(ligadas)} de {len(nomeacoes)} sem vínculo"
        + (f" (tribunal {tribunal})" if tribunal else "")
    )
    return len(ligadas)


TODOS = ["stj", "stm", "tst", "trf6", "tjmg"]


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Composição curada dos tribunais.")
    p.add_argument("tribunais", nargs="*", help=f"siglas ({', '.join(TODOS)})")
    p.add_argument("--todos", action="store_true")
    p.add_argument("--conferir", action="store_true", help="só valida os arquivos")
    p.add_argument(
        "--ligar-nomeacoes",
        action="store_true",
        help="liga nomeacoes.magistrado_id pelo nome completo na ementa",
    )
    args = p.parse_args(argv)

    if args.ligar_nomeacoes:
        for t in args.tribunais or [None]:
            ligar_nomeacoes(t)
        return 0

    alvos = TODOS if args.todos else (args.tribunais or [])
    if not alvos:
        p.error("informe pelo menos um tribunal, ou --todos")

    if args.conferir:
        ruim = False
        for t in alvos:
            d = carregar(t)
            problemas = conferir(d)
            n = len(d.get("integrantes", []))
            com = sum(1 for i in d["integrantes"] if i.get("cadeira_numero"))
            print(f"[conferir] {t}: {n} integrantes ({com} com cadeira) — " +
                  ("OK" if not problemas else "; ".join(problemas)))
            ruim = ruim or bool(problemas)
        return 1 if ruim else 0

    for t in alvos:
        sincronizar(t)
    return 0


if __name__ == "__main__":
    sys.exit(main())
