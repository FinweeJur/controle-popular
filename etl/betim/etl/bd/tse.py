"""etl.bd.tse — sync TSE 2024 vereador results + campaign donations + declared
assets into `vereadores` / `doacoes_campanha` / `bens_candidato`.

Source: `br_tse_eleicoes.resultados_candidato`, `candidatos`, `receitas_candidato`,
`bens_candidato` (ano=2024, cargo='vereador', município=Betim). Target: `vereadores`
(updates votos_eleicao, ano_eleicao, id_candidato_tse — matched to existing rows by
nome_urna, never inserts new councilors), `doacoes_campanha` and `bens_candidato`
(inserted for matched councilors only). Cron: once per electoral term.

`bens_candidato` (patrimônio declarado, 2026-07-22 addition): investigating the
"biografia livre do TSE" backlog item turned up that no such free-text biography
table exists anywhere in `br_tse_eleicoes` (that assumption in the original plan
was simply wrong -- confirmed by listing every table in the dataset). What DOES
exist and wasn't synced yet: `bens_candidato`, itemized declared assets at
campaign time (tipo_item/descricao_item/valor_item per sequencial_candidato).
Confirmed live: 20 of 23 sitting councilors have declared assets, R$48,776 to
R$2,285,486.71. Joins the same `sequencial_candidato` key already resolved to
`vereador_id` for donations below -- no new matching logic needed.

`doador_documento_mascarado` is named for the `doacoes_campanha` schema's
column, but schema verified live 2026-07-20: the real BD column is
`cpf_cnpj_doador`, and sample rows show it is **NOT masked** (e.g. a full
11-digit CPF came back plainly -- format `'00000000000'`, synthetic here on
 purpose: the legal basis below covers the PIPELINE handling real donor data,
 not this comment pasting a real person's CPF into a public repo). Not a bug or a
privacy leak on our side -- Brazilian electoral law (Lei das Eleições)
mandates full donor CPF/CNPJ disclosure for campaign finance transparency,
the same legal basis piracanjuba.ai relies on to show donor lists. The
column is stored as-is; the "masked" assumption in the original plan was
simply wrong, corrected here rather than silently carried forward.

Also corrected: `sq_candidato` doesn't exist anywhere in this dataset --
the real join/filter key is `sequencial_candidato` (on
`resultados_candidato`/`receitas_candidato`) matching `candidatos.sequencial`.
`nome_urna_candidato` doesn't exist either; `candidatos.nome_urna` is real.
`tipo_doador` doesn't exist as a column; there's no direct PF/PJ flag in
`receitas_candidato` visible from the schema, so `doador_tipo` is left
unset here rather than guessed -- it can be inferred downstream from
document length (11 digits = CPF/PF, 14 = CNPJ/PJ) if needed.

`fotos()` (2026-08-09 addition): preenche `vereadores.foto_url` batendo
direto no REST da SPA de divulgacandcontas.tse.jus.br (achado por engenharia
reversa do bundle Angular, não documentado publicamente -- ver docstring da
função). Não usa BigQuery/`bd_query` como o resto do arquivo -- só Postgres
+ HTTP -- porque o dado que falta (a foto) não está na base dos dados, está
no site do TSE.
"""
import argparse
import sys
import unicodedata

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from etl.bd.common import bd_query
from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    PgAPIError,
    carregar_municipio,
    get_supabase_client,
    upsert_com_colunas_opcionais,
)

ANO_ELEICAO_DEFAULT = 2024

# REST da SPA de consulta individual de candidaturas (divulgacandcontas.tse.jus.br/divulga/).
# Achado lendo os chunks Angular lazy-loaded da própria SPA (`main.*.js` ->
# `636.*.js`), não por documentação: não existe doc pública desta API.
DIVULGA_BASE = "https://divulgacandcontas.tse.jus.br/divulga/rest"
DIVULGA_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept": "application/json",
}

QUERY_RESULTADOS = """
SELECT rc.sequencial_candidato AS id_candidato_tse, c.nome_urna AS nome_urna, rc.votos AS votos
FROM `basedosdados.br_tse_eleicoes.resultados_candidato` rc
JOIN `basedosdados.br_tse_eleicoes.candidatos` c
  ON rc.sequencial_candidato = c.sequencial AND rc.ano = c.ano
WHERE rc.ano = {ano} AND rc.cargo = 'vereador' AND rc.id_municipio = '{id_municipio}'
"""

# Só os ELEITOS, com o que basta para criar a linha em `vereadores`. Usada
# apenas por `--semear` (ver `semear()`); a sincronização normal continua
# casando por nome contra quem o raspador da câmara já trouxe.
QUERY_ELEITOS = """
SELECT rc.sequencial_candidato AS id_candidato_tse,
       c.nome_urna  AS nome_urna,
       c.nome       AS nome,
       c.sigla_partido AS partido,
       rc.votos     AS votos,
       rc.resultado AS resultado
FROM `basedosdados.br_tse_eleicoes.resultados_candidato` rc
JOIN `basedosdados.br_tse_eleicoes.candidatos` c
  ON rc.sequencial_candidato = c.sequencial AND rc.ano = c.ano
WHERE rc.ano = {ano} AND rc.cargo = 'vereador' AND rc.id_municipio = '{id_municipio}'
  AND LOWER(rc.resultado) LIKE 'eleito%'
ORDER BY rc.votos DESC
"""

QUERY_DOACOES = """
SELECT sequencial_candidato AS id_candidato_tse, nome_doador AS doador_nome,
       cpf_cnpj_doador AS doador_documento_mascarado, valor_receita AS valor,
       data_receita AS data_doacao
FROM `basedosdados.br_tse_eleicoes.receitas_candidato`
WHERE ano = {ano} AND cargo = 'vereador' AND id_municipio = '{id_municipio}'
"""

# `bens_candidato` has no id_municipio column (unlike resultados_candidato/
# receitas_candidato) -- filtering by sigla_uf alone would scan every MG
# candidate's assets. Built dynamically with an IN(sequencial_candidato...)
# list (the 23 councilors already resolved from QUERY_RESULTADOS) instead of
# a static WHERE, same reasoning as querying only what we can actually use.
QUERY_BENS = """
SELECT sequencial_candidato AS id_candidato_tse, tipo_item, descricao_item,
       valor_item AS valor
FROM `basedosdados.br_tse_eleicoes.bens_candidato`
WHERE ano = {ano} AND sequencial_candidato IN ({sequenciais})
"""


def _normalize(nome: str | None) -> str:
    """Uppercase + accent-fold. Without accent-folding, 3/23 councilors
    failed to match live (2026-07-21): our `nome_urna` and TSE's disagree
    on accents for the same person (e.g. "Adelio Carlos" vs "Adélio
    Carlos") -- same normalization gap seen elsewhere in this codebase
    (etl/alertas.py's `_normalizar`, lib/prefeitura.ts)."""
    texto = unicodedata.normalize("NFKD", nome or "")
    texto = "".join(ch for ch in texto if not unicodedata.combining(ch))
    return texto.strip().upper()


def _iso(value):
    """BigQuery DATE columns deserialize to Python date objects, which the
    supabase-py/httpx JSON encoder can't serialize -- same issue already
    found and fixed in etl/bd/cnpj.py's data_abertura."""
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def _infer_doador_tipo(documento: str | None) -> str | None:
    """No PF/PJ flag exists in `receitas_candidato` (verified live) -- infer
    from document length instead (CPF=11 digits -> PF, CNPJ=14 -> PJ)."""
    digits = "".join(ch for ch in (documento or "") if ch.isdigit())
    if len(digits) == 11:
        return "PF"
    if len(digits) == 14:
        return "PJ"
    return None


def _slug(nome: str) -> str:
    base = _normalize(nome).lower()
    limpo = "".join(c if c.isalnum() else "-" for c in base)
    return "-".join(p for p in limpo.split("-") if p)


# Conectivos que o português NÃO capitaliza no meio de um nome próprio.
# Lista fechada de propósito: qualquer heurística mais esperta erraria em
# sobrenome legítimo (Costa, Dias, Neves).
_CONECTIVOS = {"da", "de", "do", "das", "dos", "e", "di", "du", "del", "van", "von", "y"}


def _nome_proprio(nome: str) -> str:
    """Corrige a capitalização dos conectivos vinda do TSE.

    A base do TSE grava o nome de urna com TODA palavra capitalizada —
    "Bau Da Ceramica", "Zé De Balim", "Pim De Ze De Gordo". O site da própria
    Câmara de Itinga escreve "Bau da Ceramica". Como este texto é o nome de
    uma pessoa real numa página pública, vale corrigir; como o risco de
    "esperteza" é alto, a correção é só sobre `_CONECTIVOS`, nunca sobre a
    primeira palavra, e não mexe em nada que já esteja em caixa correta.
    """
    palavras = " ".join((nome or "").split()).split(" ")
    saida = []
    for i, p in enumerate(palavras):
        if i > 0 and _normalize(p).lower() in _CONECTIVOS:
            saida.append(p.lower())
        else:
            saida.append(p)
    return " ".join(saida)


def semear(id_municipio: str, ano_eleicao: int = ANO_ELEICAO_DEFAULT, forcar: bool = False) -> int:
    """INSERE em `vereadores` os eleitos do TSE. Só para cidade SEM câmara raspável.

    POR QUE ISTO EXISTE, e por que é opt-in. O `sync()` acima é deliberadamente
    incapaz de inserir: ele casa por `nome_urna` contra quem o raspador da
    câmara já trouxe e só ENRIQUECE (votos, doações, bens). Essa escolha está
    certa para Betim, BH e São Paulo, onde a câmara publica a composição e o
    TSE é a segunda fonte.

    Só que ela torna o módulo um no-op silencioso numa cidade pequena sem
    fonte de câmara: `vereadores` fica vazia, `sync()` reporta
    `matched=0/N` e a página `/vereadores` nasce sem ninguém. É o caso de
    Itinga-MG (3134004), cuja Câmara roda um CMS sem API, sem módulo de
    proposições e sem dado estruturado nenhum.

    Aqui o TSE deixa de ser fonte secundária e vira a PRIMÁRIA: nome, nome de
    urna, partido e votação dos eleitos de 2024 são dado público federal, e
    valem para qualquer um dos 5.570 municípios. É a saída para toda cidade
    pequena que entrar depois, não um remendo de Itinga.

    Guardas:
    - Recusa rodar se a cidade JÁ TEM vereadores, a menos que `--forcar`. Sem
      isso, semear por cima de um raspador de câmara criaria linhas duplicadas
      com slug diferente (o TSE escreve "Zé da Silva", a câmara "Jose da
      Silva") e a Casa apareceria com o dobro de cadeiras.
    - Confere a contagem contra `municipios.fontes.camara_cadeiras`.
    - `ativo`/`situacao_mandato` vão juntos: a migration 0039 tem CHECK de
      coerência entre os dois e gravar um sem o outro derruba a rodada.

    Devolve quantos vereadores foram gravados.
    """
    cidade = carregar_municipio(id_municipio)
    client = get_supabase_client()

    existentes = (
        client.table("vereadores").select("id").eq("id_municipio", id_municipio).execute().data or []
    )
    if existentes and not forcar:
        print(
            f"[etl.bd.tse] {cidade['nome']} já tem {len(existentes)} vereador(es) — NÃO semeio "
            "por cima (slugs do TSE e da câmara divergem e a Casa ficaria com o dobro de "
            "cadeiras). Use --forcar se a intenção é mesmo substituir."
        )
        return 0

    eleitos = bd_query(QUERY_ELEITOS.format(id_municipio=id_municipio, ano=ano_eleicao))
    if not eleitos:
        raise RuntimeError(
            f"TSE não devolveu nenhum eleito para vereador em {id_municipio} no ano {ano_eleicao}. "
            "Confira o código IBGE e o ano antes de concluir que a cidade não tem câmara."
        )

    legis = (cidade.get("fontes") or {}).get("legislatura") or {}
    inicio = f"{legis['inicio']}-01-01" if legis.get("inicio") else None
    fim = f"{legis['fim']}-12-31" if legis.get("fim") else None

    linhas, usados = [], set()
    for e in eleitos:
        nome_urna = _nome_proprio(e.get("nome_urna") or "")
        if not nome_urna:
            continue
        slug = _slug(nome_urna)
        if slug in usados:
            n = 2
            while f"{slug}-{n}" in usados:
                n += 1
            slug = f"{slug}-{n}"
        usados.add(slug)
        linhas.append(
            {
                "id_municipio": id_municipio,
                "slug": slug,
                "nome": _nome_proprio(e.get("nome") or "") or nome_urna,
                "nome_urna": nome_urna,
                "partido": (e.get("partido") or "").strip() or None,
                "votos_eleicao": e.get("votos"),
                "ano_eleicao": ano_eleicao,
                "id_candidato_tse": str(e.get("id_candidato_tse")),
                "mandato_inicio": inicio,
                "mandato_fim": fim,
                "ativo": True,
                "situacao_mandato": "em_exercicio",
            }
        )

    cadeiras = (cidade.get("fontes") or {}).get("camara_cadeiras")
    if isinstance(cadeiras, int) and len(linhas) != cadeiras:
        print(
            f"[etl.bd.tse] AVISO: TSE devolveu {len(linhas)} eleito(s) mas `camara_cadeiras` "
            f"diz {cadeiras}. Confira antes de confiar na composição da Casa."
        )

    upsert_com_colunas_opcionais(
        client, "vereadores", linhas, ["situacao_mandato"], on_conflict="id_municipio,slug"
    )
    print(
        f"[etl.bd.tse] semeados {len(linhas)} vereador(es) de {cidade['nome']} "
        f"a partir do resultado do TSE de {ano_eleicao}."
    )
    return len(linhas)


def sync(id_municipio: str, ano_eleicao: int = ANO_ELEICAO_DEFAULT, incluir_doacoes: bool = True):
    """`incluir_doacoes=False` skips the `doacoes_campanha` insert -- needed
    to safely re-run this sync after adding `bens_candidato` (2026-07-22)
    without re-inserting the 637 donations already synced in a prior run:
    that table has no unique constraint (documented as an accepted
    once-per-term risk when it was written), so a second unguarded
    `sync()` call would duplicate every donation instead of just adding
    the new bens_candidato rows."""
    client = get_supabase_client()

    existing = (
        client.table("vereadores").select("id,nome_urna").eq("id_municipio", id_municipio).execute().data
        or []
    )
    by_nome_urna = {_normalize(v.get("nome_urna")): v for v in existing if v.get("nome_urna")}

    resultados = bd_query(QUERY_RESULTADOS.format(id_municipio=id_municipio, ano=ano_eleicao))
    id_candidato_to_vereador_id: dict[str, str] = {}
    matched = 0
    for row in resultados:
        candidato = by_nome_urna.get(_normalize(row.get("nome_urna")))
        if not candidato:
            continue
        id_candidato_tse = str(row.get("id_candidato_tse"))
        client.table("vereadores").update(
            {
                "votos_eleicao": row.get("votos"),
                "ano_eleicao": ano_eleicao,
                "id_candidato_tse": id_candidato_tse,
            }
        ).eq("id", candidato["id"]).execute()
        id_candidato_to_vereador_id[id_candidato_tse] = candidato["id"]
        matched += 1
    print(f"[etl.bd.tse] resultados matched={matched}/{len(resultados)}")

    doacoes_rows = []
    if incluir_doacoes:
        doacoes_raw = bd_query(QUERY_DOACOES.format(id_municipio=id_municipio, ano=ano_eleicao))
        for row in doacoes_raw:
            vereador_id = id_candidato_to_vereador_id.get(str(row.get("id_candidato_tse")))
            if not vereador_id:
                continue
            doacoes_rows.append(
                {
                    "id_municipio": id_municipio,
                    "vereador_id": vereador_id,
                    "ano_eleicao": ano_eleicao,
                    "doador_nome": row.get("doador_nome"),
                    "doador_tipo": _infer_doador_tipo(row.get("doador_documento_mascarado")),
                    # kept masked as published by TSE — do not unmask
                    "doador_documento_mascarado": row.get("doador_documento_mascarado"),
                    "valor": row.get("valor"),
                    "data_doacao": _iso(row.get("data_doacao")),
                }
            )
        if doacoes_rows:
            # No unique constraint on doacoes_campanha in the schema (cadence is once/term,
            # so plain insert is acceptable); re-running mid-term would duplicate rows.
            client.table("doacoes_campanha").insert(doacoes_rows).execute()
        print(f"[etl.bd.tse] doacoes_campanha registros={len(doacoes_rows)}")
    else:
        print("[etl.bd.tse] doacoes_campanha pulado (--sem-doacoes)")

    n_bens = _sync_bens(client, id_municipio, ano_eleicao, id_candidato_to_vereador_id)

    print(f"[etl.bd.tse] total_matched={matched} total_doacoes={len(doacoes_rows)} total_bens={n_bens}")


def _sync_bens(
    client, id_municipio: str, ano_eleicao: int, id_candidato_to_vereador_id: dict[str, str]
) -> int:
    """Populates `bens_candidato` (migration 0013, 2026-07-22 addition).
    Returns -1 (not 0) and prints a warning instead of raising when the
    table doesn't exist yet -- lets `sync()`'s existing vereadores/
    doacoes_campanha work finish and commit even if this migration hasn't
    landed, matching how the rest of this session's new-column/new-table
    additions degrade rather than take down an entire ETL run over one
    missing piece."""
    if not id_candidato_to_vereador_id:
        return 0
    sequenciais = ",".join(f"'{s}'" for s in id_candidato_to_vereador_id)
    bens_raw = bd_query(QUERY_BENS.format(ano=ano_eleicao, sequenciais=sequenciais))
    bens_rows = [
        {
            "id_municipio": id_municipio,
            "vereador_id": id_candidato_to_vereador_id[str(row["id_candidato_tse"])],
            "ano_eleicao": ano_eleicao,
            "tipo_item": row.get("tipo_item"),
            "descricao_item": row.get("descricao_item"),
            "valor": row.get("valor"),
        }
        for row in bens_raw
    ]
    if not bens_rows:
        return 0
    try:
        # Same "insert, no unique constraint" cadence as doacoes_campanha
        # above -- once-per-term, re-running mid-term would duplicate.
        client.table("bens_candidato").insert(bens_rows).execute()
    except PgAPIError as e:
        # 42P01 = Postgres undefined_table. Antes da troca para psycopg este
        # teste era por PGRST205 (tabela fora do cache de schema do
        # PostgREST); falando com o banco direto, "tabela não existe" chega
        # como o código cru do Postgres.
        if e.code != "42P01":
            raise
        print(
            "[etl.bd.tse] tabela 'bens_candidato' ainda não existe "
            f"({e.message}) -- rode a migration 0013_bens_candidato.sql e "
            "sincronize de novo pra trazer o patrimônio declarado."
        )
        return -1
    return len(bens_rows)


@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=2, max=30))
def _divulga_get(path: str):
    resp = requests.get(f"{DIVULGA_BASE}{path}", headers=DIVULGA_HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.json()


def _descobrir_sg_ue(uf: str, nome_municipio: str) -> str:
    """`sgUe` é o código de município do PRÓPRIO TSE -- um namespace
    DIFERENTE do IBGE que o resto deste arquivo usa (`ID_MUNICIPIO_DEFAULT`
    = '3106705', o código IBGE de Betim). No TSE, Betim é '41335'. Confundir
    os dois é a armadilha: passar o código IBGE onde a API espera `sgUe`
    devolve 404 silencioso, não erro claro.

    Não existe mapeamento IBGE->TSE pronto neste projeto, então a descoberta
    é por NOME: `/eleicao/ufs/{uf}/municipios` devolve, para cada município
    da UF, `{"sigla": "<sgUe>", "nome": "<NOME SEM ACENTO, MAIUSCULO>"}` --
    casa por nome normalizado (reusa `_normalize()`, já usado no arquivo
    pra casar `nome_urna` do TSE contra o do raspador da câmara)."""
    municipios = _divulga_get(f"/v1/eleicao/ufs/{uf}/municipios")
    alvo = _normalize(nome_municipio)
    for m in municipios:
        if _normalize(m.get("nome") or "") == alvo:
            return m["sigla"]
    raise RuntimeError(
        f"TSE não tem município '{nome_municipio}' em /eleicao/ufs/{uf}/municipios -- "
        "confira o nome cadastrado em `municipios.nome` contra a grafia do TSE."
    )


def _descobrir_id_eleicao(ano: int) -> int:
    """Id numérico da eleição municipal ordinária do ano -- usado tanto na
    consulta de candidatura quanto (embutido na resposta) na URL da foto.
    Ex.: 2024 -> 2045202024. Sem isto documentado publicamente; descoberto
    batendo em `/eleicao/ordinaria/{ano}` e lendo o campo `id`."""
    d = _divulga_get(f"/v1/eleicao/ordinaria/{ano}")
    id_eleicao = d.get("id")
    if not id_eleicao:
        raise RuntimeError(f"TSE não devolveu id de eleição ordinária para {ano}: {d}")
    return id_eleicao


@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=2, max=30))
def _buscar_foto_candidato(ano: int, sg_ue: str, id_eleicao: int, sq_candidato: str) -> str | None:
    """Lê `fotoUrl` da ficha do candidato -- NÃO monta a URL de imagem à
    mão. `/divulga/rest/arquivo/img/{idEleicao}/{sqCandidato}/{sgUe}` é o
    padrão observado, mas três tentativas de adivinhar essa URL direto
    (com `idEleicao` errado) deram 404 antes de eu achar este endpoint; ler
    o campo da API é o jeito que sobrevive ao TSE mudar o formato do path."""
    resp = requests.get(
        f"{DIVULGA_BASE}/v1/candidatura/buscar/{ano}/{sg_ue}/{id_eleicao}/candidato/{sq_candidato}",
        headers=DIVULGA_HEADERS,
        timeout=30,
    )
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    dados = resp.json()
    if not dados.get("fotoUrlPublicavel", True):
        return None
    return dados.get("fotoUrl") or None


def fotos(id_municipio: str, ano_eleicao: int = ANO_ELEICAO_DEFAULT) -> int:
    """Preenche `vereadores.foto_url` com a foto oficial de urna do TSE
    (fonte: ficha de candidatura de cada eleito em
    divulgacandcontas.tse.jus.br). Só ENRIQUECE quem já está em
    `vereadores` com `id_candidato_tse` preenchido -- não insere ninguém
    (mesma disciplina de `sync()`).

    Parametrizada por `id_municipio` (IBGE) + `ano_eleicao`: `sg_ue` e
    `id_eleicao` são descobertos em runtime a partir disso (ver
    `_descobrir_sg_ue`/`_descobrir_id_eleicao`), não fixos em "Betim" --
    quando outra cidade deste projeto tiver vereadores (hoje só Betim tem),
    basta rodar com `--id-municipio` diferente, sem mudar código.

    Medido em Betim/2024 (2026-08-09): 23 de 23 vereadores com
    `id_candidato_tse` devolveram `fotoUrlPublicavel: true` e uma `fotoUrl`
    válida (uma baixada e conferida manualmente: JPEG real, 161x225).

    Devolve quantos `foto_url` foram gravados.
    """
    cidade = carregar_municipio(id_municipio)
    sg_ue = _descobrir_sg_ue(cidade["uf"], cidade["nome"])
    id_eleicao = _descobrir_id_eleicao(ano_eleicao)

    client = get_supabase_client()
    vereadores = (
        client.table("vereadores")
        .select("id,nome_urna,id_candidato_tse")
        .eq("id_municipio", id_municipio)
        .execute()
        .data
        or []
    )
    alvo = [v for v in vereadores if v.get("id_candidato_tse")]

    gravadas = 0
    for v in alvo:
        foto_url = _buscar_foto_candidato(ano_eleicao, sg_ue, id_eleicao, v["id_candidato_tse"])
        if not foto_url:
            print(f"[etl.bd.tse] sem foto publicavel: {v.get('nome_urna')} ({v['id_candidato_tse']})")
            continue
        client.table("vereadores").update({"foto_url": foto_url}).eq("id", v["id"]).execute()
        gravadas += 1

    print(
        f"[etl.bd.tse] fotos: {gravadas}/{len(alvo)} vereador(es) com foto do TSE "
        f"({cidade['nome']}/{ano_eleicao}, sgUe={sg_ue})."
    )
    return gravadas


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument("--ano-eleicao", type=int, default=ANO_ELEICAO_DEFAULT)
    parser.add_argument(
        "--sem-doacoes",
        action="store_true",
        help="pula doacoes_campanha (evita duplicar ao resincronizar só pra trazer bens_candidato)",
    )
    parser.add_argument(
        "--semear",
        action="store_true",
        help="INSERE os eleitos do TSE em `vereadores` — só para cidade sem câmara raspável",
    )
    parser.add_argument(
        "--forcar",
        action="store_true",
        help="com --semear, semeia mesmo que a cidade já tenha vereadores",
    )
    parser.add_argument(
        "--fotos",
        action="store_true",
        help="preenche vereadores.foto_url com a foto de urna do TSE (não mexe em resultados/doacoes/bens)",
    )
    args = parser.parse_args()
    try:
        if args.semear:
            semear(args.id_municipio, args.ano_eleicao, forcar=args.forcar)
        elif args.fotos:
            fotos(args.id_municipio, args.ano_eleicao)
        else:
            sync(args.id_municipio, args.ano_eleicao, incluir_doacoes=not args.sem_doacoes)
    except RuntimeError as e:
        print(f"[etl.bd.tse] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
