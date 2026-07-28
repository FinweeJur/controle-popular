"""etl.apis.transparencia_gov — sync federal convênios/repasses into
`convenios_federais` (migration 0014).

Source: `api.portaldatransparencia.gov.br/api-de-dados/convenios`, chave em
`TRANSPARENCIA_API_KEY` (header `chave-api-dados`). Cron: mensal — este dado
muda devagar (convênio novo, mudança de situação/valor liberado), diferente
de contrato/licitação do PNCP.

ACHADO QUE MUDOU O DESENHO (testado ao vivo 2026-07-22, ver migration
0014 e docs/F0-discovery.md): o endpoint que o plano original previa
para "Emendas Parlamentares" era `/emendas` filtrado por
`localidadeDoGasto`. Na prática esse endpoint **não filtra por
município em nenhum parâmetro testado** — varrendo os 3 últimos anos
inteiros (~19.400 registros, ~1.300 páginas) achou 1 (um) registro pra
Betim, com valor R$ 0,00; boa parte das emendas nem tem `localidadeDoGasto`
atribuível (vem como "MÚLTIPLO" ou "Nacional"). `/emendas` continua sem
uso neste projeto.

`/convenios?codigoIBGE=<código>` **filtra de verdade** (confirmado
comparando o resultado com outro município) e devolve convênios reais —
167 para Betim desde 1995, a maioria (134/167) tendo o "MUNICIPIO DE
BETIM" como convenente, o resto para entidades locais (APAE, ONGs).
Não é o mesmo dado que "emenda parlamentar individual" (a API não
devolve autor/parlamentar por convênio), por isso a tabela e a
página se chamam "Convênios e repasses federais", não "Emendas".

`/transferencias` (que seria a fonte mais completa — toda transferência,
não só convênio) devolve 403 com esta chave em qualquer combinação de
parâmetros, inclusive sem nenhum — não é erro de parâmetro, é escopo da
chave. Não retentar sem uma chave de nível diferente.
"""
import argparse
import datetime as dt
import os
import sys
import time

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    get_supabase_client,
    upsert_com_colunas_opcionais,
)

API_BASE = "https://api.portaldatransparencia.gov.br/api-de-dados"
PAGE_LIMIT_SAFETY = 200  # ~3000 registros; nenhum município deste projeto chega perto disso


def _headers() -> dict:
    chave = os.environ.get("TRANSPARENCIA_API_KEY")
    if not chave:
        raise RuntimeError(
            "TRANSPARENCIA_API_KEY não configurada no .env — chave gratuita em "
            "https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email"
        )
    return {"chave-api-dados": chave, "Accept": "application/json"}


@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=2, max=30))
def _get_page(codigo_ibge: str, pagina: int) -> list[dict]:
    resp = requests.get(
        f"{API_BASE}/convenios",
        headers=_headers(),
        params={"codigoIBGE": codigo_ibge, "pagina": pagina},
        timeout=45,
    )
    resp.raise_for_status()
    data = resp.json()
    return data if isinstance(data, list) else []


def _fetch_all(codigo_ibge: str) -> list[dict]:
    rows: list[dict] = []
    pagina = 1
    while True:
        pagina_dados = _get_page(codigo_ibge, pagina)
        if not pagina_dados:
            break
        rows.extend(pagina_dados)
        pagina += 1
        time.sleep(0.4)  # gentil com a API pública, evita rate-limit
        if pagina > PAGE_LIMIT_SAFETY:
            print(
                f"[etl.apis.transparencia_gov] AVISO: parou em {PAGE_LIMIT_SAFETY} "
                "páginas por segurança — investigar se o município realmente "
                "tem esse volume antes de subir o teto."
            )
            break
    return rows


def _map_row(raw: dict, id_municipio: str) -> dict | None:
    id_externo = raw.get("id")
    if id_externo is None:
        return None

    orgao = raw.get("orgao") or {}
    convenente = raw.get("convenente") or {}
    dim_convenio = raw.get("dimConvenio") or {}
    tipo_instrumento = raw.get("tipoInstrumento") or {}

    return {
        "id_municipio": id_municipio,
        "id_externo": id_externo,
        # `codigo` (dimConvenio.codigo) é o id da URL de detalhe do Portal
        # (`/convenios/{codigo}`), diferente do `id`/id_externo — ver
        # migration 0024. Coluna opcional (degrada se a 0024 não rodou).
        "codigo": dim_convenio.get("codigo"),
        "numero_convenio": dim_convenio.get("numero") or dim_convenio.get("codigo"),
        "objeto": (dim_convenio.get("objeto") or "").strip() or None,
        "orgao_nome": orgao.get("nome"),
        "orgao_sigla": orgao.get("sigla"),
        "convenente_nome": convenente.get("nome"),
        "situacao": raw.get("situacao"),
        "tipo_instrumento": tipo_instrumento.get("descricao"),
        "valor": raw.get("valor"),
        "valor_liberado": raw.get("valorLiberado"),
        "valor_contrapartida": raw.get("valorContrapartida"),
        "data_inicio_vigencia": raw.get("dataInicioVigencia") or None,
        "data_final_vigencia": raw.get("dataFinalVigencia") or None,
        "data_publicacao": raw.get("dataPublicacao") or None,
        "updated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
    }


def sync(id_municipio: str, codigo_ibge: str):
    client = get_supabase_client()
    brutos = _fetch_all(codigo_ibge)
    rows = [m for r in brutos if (m := _map_row(r, id_municipio)) is not None]

    if rows:
        upsert_com_colunas_opcionais(
            client,
            "convenios_federais",
            rows,
            colunas_opcionais=["codigo"],
            on_conflict="id_municipio,id_externo",
        )

    total_valor = sum(r["valor"] or 0 for r in rows)
    print(
        f"[etl.apis.transparencia_gov] id_municipio={id_municipio} "
        f"convenios={len(rows)} valor_total={total_valor:,.2f}"
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument(
        "--codigo-ibge", default=ID_MUNICIPIO_DEFAULT, help="Código IBGE de 7 dígitos"
    )
    args = parser.parse_args()
    try:
        sync(args.id_municipio, args.codigo_ibge)
    except RuntimeError as e:
        print(f"[etl.apis.transparencia_gov] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
