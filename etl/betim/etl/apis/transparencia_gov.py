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

ACHADO 2026-08-13 (docs/FONTES-FLUXO-FINANCEIRO.md §1.3, migration 0069):
`convenente.cnpjFormatado` já chega em toda resposta e `_map_row()`
descartava o campo, gravando só o nome. Corrigido: agora grava
`cnpj_convenente` (o CNPJ inteiro, sem máscara — CNPJ de PJ não é dado
pessoal) e `cnpj_raiz` (8 primeiros dígitos, mesma chave de
`ambiental_licenciamento.cnpj_raiz`). `cpfFormatado` continua NUNCA lido:
vem mascarado pela própria fonte para convênio de pessoa física, e este
repositório público já vazou CPF real uma vez — ver `_map_row`. Depois de
rodar a migration 0069, reprocessar os municípios já sincronizados chama de
novo `python -m etl.apis.transparencia_gov --id-municipio <id>` — a API
responde de novo em segundos, não precisa recoletar do zero.
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
# Teto de páginas por município. O comentário original dizia "nenhum
# município deste projeto chega perto disso" — São Paulo o estourou na
# primeira rodada (3.000 registros, R$ 11,3 bi, e o aviso de corte disparou).
# Mantido em 200 de propósito: subir o teto é uma decisão de volume, não um
# detalhe, porque a coleta é sequencial com sleep e já leva mais de uma hora
# nesse tamanho. Quem precisar da série completa de SP roda com
# `--teto-paginas` maior e reserva tempo. O importante é que o corte é
# ANUNCIADO no log, não silencioso.
PAGE_LIMIT_SAFETY = 200


def _headers() -> dict:
    chave = os.environ.get("TRANSPARENCIA_API_KEY")
    if not chave:
        raise RuntimeError(
            "TRANSPARENCIA_API_KEY não configurada no .env — chave gratuita em "
            "https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email"
        )
    return {"chave-api-dados": chave, "Accept": "application/json"}


@retry(stop=stop_after_attempt(6), wait=wait_exponential(multiplier=2, min=5, max=90))
def _get_page(codigo_ibge: str, pagina: int) -> list[dict]:
    """Uma página de `/convenios`.

    Duas particularidades desta API que a configuração anterior não cobria:

    1. **400 é intermitente, não determinístico.** A MESMA URL responde 400
       numa chamada e 200 na seguinte — observado em Betim, BH e São Paulo,
       logo não é característica do município. `raise_for_status()` levanta
       em 4xx igual a 5xx e o `retry` repete qualquer exceção, então o 400 já
       era reexecutado; o que faltava era paciência.
    2. **45s era curto para município grande.** Betim resolvia numa página;
       BH e SP paginam muito mais e a API fica mais lenta conforme o offset
       cresce. O ETL de BH morreu com `ReadTimeout` no meio da coleta — e,
       como a gravação só acontece no fim, não gravou nada.
    """
    resp = requests.get(
        f"{API_BASE}/convenios",
        headers=_headers(),
        params={"codigoIBGE": codigo_ibge, "pagina": pagina},
        timeout=180,
    )
    resp.raise_for_status()
    data = resp.json()
    return data if isinstance(data, list) else []


def _fetch_all(codigo_ibge: str, teto_paginas: int = PAGE_LIMIT_SAFETY) -> list[dict]:
    rows: list[dict] = []
    pagina = 1
    while True:
        pagina_dados = _get_page(codigo_ibge, pagina)
        if not pagina_dados:
            break
        rows.extend(pagina_dados)
        pagina += 1
        time.sleep(0.4)  # gentil com a API pública, evita rate-limit
        if pagina > teto_paginas:
            print(
                f"[etl.apis.transparencia_gov] AVISO: parou em {teto_paginas} "
                "páginas por segurança — investigar se o município realmente "
                "tem esse volume antes de subir o teto."
            )
            break
    return rows


def _cnpj_raiz(cnpj_formatado: str | None) -> str | None:
    """`"22.733.919/0001-27"` -> `"22733919"` (8 primeiros dígitos = raiz).

    Mesma convenção de `ambiental_licenciamento.cnpj_raiz` (migration 0064):
    a raiz identifica a empresa sem distinguir matriz de filial, e é a chave
    que liga convênio a licença ambiental. Nunca chamada sobre CPF — ver a
    nota em `_map_row` sobre por que este módulo nunca toca em
    `cpfFormatado`.
    """
    if not cnpj_formatado:
        return None
    digitos = "".join(c for c in cnpj_formatado if c.isdigit())
    return digitos[:8] if len(digitos) == 14 else None


def _map_row(raw: dict, id_municipio: str) -> dict | None:
    id_externo = raw.get("id")
    if id_externo is None:
        return None

    orgao = raw.get("orgao") or {}
    convenente = raw.get("convenente") or {}
    dim_convenio = raw.get("dimConvenio") or {}
    tipo_instrumento = raw.get("tipoInstrumento") or {}

    # ACHADO 2026-08-13 (docs/FONTES-FLUXO-FINANCEIRO.md §1.3): a fonte já
    # devolve `convenente.cnpjFormatado` e este mapeamento jogava o campo
    # fora, gravando só o nome. `cnpjFormatado` é sempre CNPJ inteiro, sem
    # máscara (CNPJ de pessoa jurídica não é dado pessoal). NUNCA ler
    # `cpfFormatado` daqui: convênio de pessoa física traz o CPF MASCARADO
    # pela própria fonte (`***.918.086-**`, testado ao vivo em Belo
    # Horizonte), e este repositório é público e já vazou CPF real uma vez
    # (ver `scripts/checar-dado-pessoal.py`) — a regra é não abrir uma
    # coluna que alguém preencha com CPF, mascarado ou não, por engano
    # depois. Só pessoa jurídica sai daqui.
    cnpj_convenente = convenente.get("cnpjFormatado") or None

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
        # Colunas opcionais novas (migration 0069). Ver nota acima — nunca
        # `cpfFormatado`.
        "cnpj_convenente": cnpj_convenente,
        "cnpj_raiz": _cnpj_raiz(cnpj_convenente),
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


def sync(id_municipio: str, codigo_ibge: str | None = None, teto_paginas: int = PAGE_LIMIT_SAFETY):
    """
    O código consultado na fonte é o PRÓPRIO `id_municipio`. Era um argumento
    separado com default fixo de Betim, então `--id-municipio <outra cidade>`
    sozinho consultava a fonte com o código de Betim e gravava o resultado
    sob o id da outra cidade — sem erro, sem aviso. Mesma classe de defeito
    corrigida em `etl.apis.anp`, `etl.apis.openmeteo`, `etl.apis.crimes_mg` e
    `etl.pncp.contratos` em 2026-08-03.
    """
    codigo_ibge = codigo_ibge or id_municipio
    client = get_supabase_client()
    brutos = _fetch_all(codigo_ibge, teto_paginas)
    rows = [m for r in brutos if (m := _map_row(r, id_municipio)) is not None]

    if rows:
        # `id_municipio,codigo` e NÃO `id_municipio,id_externo`. O campo `id`
        # da API (gravado em `id_externo`) muda de uma rodada para a outra
        # para o MESMO convênio, então ele nunca colidia e todo `upsert`
        # virava `insert`. Foi assim que Betim acumulou 501 linhas para 167
        # convênios e o site publicou o dobro do dinheiro federal recebido —
        # a medição completa está na migration 0071.
        #
        # `codigo` saiu de `colunas_opcionais`: ele agora sustenta o índice
        # único, e coluna de chave não pode ser tratada como "grava se
        # existir". Sem a migration 0024 este upsert tem de falhar alto, não
        # degradar em silêncio de volta para o comportamento que duplicava.
        upsert_com_colunas_opcionais(
            client,
            "convenios_federais",
            rows,
            colunas_opcionais=["cnpj_convenente", "cnpj_raiz"],
            on_conflict="id_municipio,codigo",
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
        "--codigo-ibge",
        default=None,
        help="Override; por padrão é o próprio --id-municipio.",
    )
    parser.add_argument(
        "--teto-paginas",
        type=int,
        default=PAGE_LIMIT_SAFETY,
        help="Máximo de páginas. São Paulo passa do padrão de 200 (3.000+ convênios).",
    )
    args = parser.parse_args()
    try:
        sync(args.id_municipio, args.codigo_ibge, args.teto_paginas)
    except RuntimeError as e:
        print(f"[etl.apis.transparencia_gov] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
