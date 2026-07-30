"""etl.camara.autoria — autoria COMPLETA das proposições, do CSV em lote.

Rodar:
    python -m etl.camara.autoria                 # anos presentes no banco
    python -m etl.camara.autoria --ano 2026
    python -m etl.camara.autoria --so-faltantes  # só o que não tem autoria

POR QUE O CSV, E NÃO A API — a decisão que salva a rodada:
`/proposicoes/{id}/autores` é UMA requisição por proposição. As 1.117
proposições sem autoria custariam 1.117 chamadas, e o histórico deste
projeto registra que a dados-abertos estrangula o IP depois de ~15 mil
requisições numa sessão (ver `docs/congresso/F0-discovery.md` e o memo do
throttle). O arquivo em lote
`arquivos/proposicoesAutores/csv/proposicoesAutores-{ano}.csv` traz a
autoria do ANO INTEIRO numa única requisição de ~12 MB — verificado ao
vivo: HTTP 200, 12.642.480 bytes para 2026.

E o CSV traz o que a API descartava:
  - **autor institucional** (`codTipoAutor=30000`, "Poder Executivo",
    comissões, Senado). O ETL antigo pulava esses de propósito, porque
    `proposicao_autores.parlamentar_id` é FK obrigatória — e o resultado
    era proposição publicada em /alertas sem dizer de quem é.
  - **partido e UF NA ASSINATURA**, não os de hoje. Ler de `parlamentares`
    mostraria a filiação atual num projeto de 2023.

O que este módulo grava:
  - `proposicao_autoria` (tabela nova, migration 0005): TODOS os autores,
    com nome, tipo, partido, uf, ordem, proponente e `parlamentar_id`
    quando dá para casar.
  - `proposicao_autores` (relação antiga): só os que casam com
    `parlamentares`. Continua sendo a fonte das páginas de bancada e do
    perfil de parlamentar. Escrever as duas no MESMO passe, do MESMO CSV,
    é o que impede as duas de divergirem.
"""

from __future__ import annotations

import argparse
import csv
import io
import sys
import zipfile
from collections import defaultdict

import requests

from ..common import fetch_all, get_supabase_client, registrar_fonte, upsert_em_lotes
from . import client

CSV_URL = "https://dadosabertos.camara.leg.br/arquivos/proposicoesAutores/csv/proposicoesAutores-{ano}.csv"

# O CSV é grande (12 MB em 2026) e vem com BOM. `csv.DictReader` com
# delimitador ';' e quoting padrão lê certo — o arquivo é bem formado, com
# todos os campos entre aspas.
DELIM = ";"

# Tipos de autor que a Câmara publica, pelo `codTipoAutor`. Guardamos o
# código junto do texto porque o texto muda de grafia entre anos
# ("Deputado(a)" x "Deputado") e o código não.
COD_PARLAMENTAR = 10000


def baixar_csv(ano: int) -> str:
    """Baixa o CSV do ano e devolve o texto.

    Sem streaming para arquivo temporário de propósito: 12 MB cabem
    folgadamente em memória e o parse fica mais simples. Se um ano futuro
    crescer muito, trocar aqui é local.
    """
    url = CSV_URL.format(ano=ano)
    print(f"[autoria] baixando {url}")
    r = requests.get(url, timeout=300)
    r.raise_for_status()
    conteudo = r.content
    # A Câmara às vezes serve o mesmo recurso zipado. Detectar pela
    # assinatura, não pelo content-type (que vem `application/octet-stream`
    # nos dois casos).
    if conteudo[:2] == b"PK":
        with zipfile.ZipFile(io.BytesIO(conteudo)) as z:
            nome = next(n for n in z.namelist() if n.lower().endswith(".csv"))
            conteudo = z.read(nome)
    return conteudo.decode("utf-8-sig")


def _int(v: str | None):
    try:
        return int(v) if v not in (None, "") else None
    except ValueError:
        return None


def linhas_do_csv(texto: str):
    """Gera dicionários já normalizados a partir do CSV bruto."""
    for row in csv.DictReader(io.StringIO(texto), delimiter=DELIM):
        nome = (row.get("nomeAutor") or "").strip()
        if not nome:
            continue
        yield {
            "id_proposicao": (row.get("idProposicao") or "").strip(),
            "id_deputado": (row.get("idDeputadoAutor") or "").strip(),
            "cod_tipo": _int(row.get("codTipoAutor")),
            "tipo": (row.get("tipoAutor") or "").strip() or None,
            "nome": nome,
            "partido": (row.get("siglaPartidoAutor") or "").strip() or None,
            "uf": (row.get("siglaUFAutor") or "").strip() or None,
            "ordem": _int(row.get("ordemAssinatura")),
            "proponente": (row.get("proponente") or "").strip() in ("1", "true", "True"),
        }


def mapa_proposicoes(sb) -> dict[str, str]:
    """`id_externo` -> uuid, só das proposições da Câmara já no banco.

    Paginado por `fetch_all`: são 5,5 mil hoje e o backfill histórico
    (2023-2025) multiplica isso.
    """
    linhas = fetch_all(
        lambda: sb.table("proposicoes")
        .select("id, id_externo")
        .eq("casa_id", client.CASA_ID)
    )
    return {str(r["id_externo"]): str(r["id"]) for r in linhas}


def mapa_parlamentares(sb) -> dict[str, str]:
    linhas = fetch_all(lambda: sb.table("parlamentares").select("id, id_externo"))
    return {str(r["id_externo"]): str(r["id"]) for r in linhas}


def anos_no_banco(sb) -> list[int]:
    linhas = fetch_all(lambda: sb.table("proposicoes").select("ano").eq("casa_id", client.CASA_ID))
    return sorted({int(r["ano"]) for r in linhas if r.get("ano")})


def ids_sem_autoria(sb) -> set[str]:
    """uuids que hoje não têm NENHUMA linha em `proposicao_autoria`."""
    todas = {str(r["id"]) for r in fetch_all(lambda: sb.table("proposicoes").select("id"))}
    com = {
        str(r["proposicao_id"])
        for r in fetch_all(lambda: sb.table("proposicao_autoria").select("proposicao_id"))
    }
    return todas - com


def sincronizar(ano: int, so_faltantes: bool = False) -> tuple[int, int]:
    """Grava a autoria de um ano. Devolve (linhas_autoria, vínculos_parlamentar)."""
    sb = get_supabase_client()
    props = mapa_proposicoes(sb)
    parls = mapa_parlamentares(sb)
    faltantes = ids_sem_autoria(sb) if so_faltantes else None

    texto = baixar_csv(ano)

    autoria: list[dict] = []
    vinculos: list[dict] = []
    # Contadores de diagnóstico: sem eles, um mapeamento errado apareceria
    # como "0 linhas" sem dizer por quê.
    fora_do_banco = 0
    por_tipo: dict[str, int] = defaultdict(int)

    for l in linhas_do_csv(texto):
        pid = props.get(l["id_proposicao"])
        if not pid:
            # Proposição do ano que este banco ainda não sincronizou. Não é
            # erro: o CSV cobre o ano inteiro da Câmara, o banco cobre o que
            # o ETL de proposições já trouxe.
            fora_do_banco += 1
            continue
        if faltantes is not None and pid not in faltantes:
            continue

        parlamentar_id = parls.get(l["id_deputado"]) if l["id_deputado"] else None
        por_tipo[l["tipo"] or "?"] += 1

        autoria.append(
            {
                "proposicao_id": pid,
                "nome": l["nome"],
                "tipo": l["tipo"],
                "cod_tipo": l["cod_tipo"],
                "partido": l["partido"],
                "uf": l["uf"],
                "ordem": l["ordem"],
                "proponente": l["proponente"],
                "parlamentar_id": parlamentar_id,
            }
        )
        if parlamentar_id:
            vinculos.append(
                {
                    "proposicao_id": pid,
                    "parlamentar_id": parlamentar_id,
                    "ordem": l["ordem"],
                    "proponente": l["proponente"],
                }
            )

    n_autoria = upsert_em_lotes(
        sb, "proposicao_autoria", autoria, on_conflict="proposicao_id,nome"
    )
    n_vinculos = upsert_em_lotes(
        sb, "proposicao_autores", vinculos, on_conflict="proposicao_id,parlamentar_id"
    )

    registrar_fonte(
        sb,
        nome="camara-autoria-csv",
        url=CSV_URL.format(ano=ano),
        tipo_dados="autoria de proposições (arquivo em lote)",
    )

    print(
        f"[autoria] {ano}: {n_autoria} linhas de autoria, {n_vinculos} vínculos com "
        f"parlamentar, {fora_do_banco} autores de proposições fora deste banco"
    )
    print("[autoria] por tipo de autor: " + ", ".join(f"{k}={v}" for k, v in sorted(por_tipo.items())))
    return n_autoria, n_vinculos


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Autoria completa das proposições (CSV em lote).")
    p.add_argument("--ano", type=int, action="append", help="ano (pode repetir); padrão: os do banco")
    p.add_argument(
        "--so-faltantes",
        action="store_true",
        help="grava só as proposições que ainda não têm autoria nenhuma",
    )
    args = p.parse_args(argv)

    anos = args.ano
    if not anos:
        sb = get_supabase_client()
        anos = anos_no_banco(sb)
        print(f"[autoria] anos no banco: {anos}")

    total = 0
    for ano in anos:
        try:
            a, _ = sincronizar(ano, so_faltantes=args.so_faltantes)
            total += a
        except requests.HTTPError as e:
            # Ano sem arquivo publicado não derruba os outros.
            print(f"[autoria] {ano}: sem CSV publicado ({e}) — seguindo")
    print(f"[autoria] total: {total} linhas de autoria")
    return 0


if __name__ == "__main__":
    sys.exit(main())
