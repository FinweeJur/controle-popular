"""etl.pncp.contratos — sync PNCP /v1/contratos into the `contratos` table.

Usage: python -m etl.pncp.contratos --id-municipio 3106705 [--ano-inicio 2021]

Backfills year by year from 2021 (PNCP start) through the current year, then
should be run daily going forward (cron in .github/workflows/etl.yml).
"""
import argparse
import datetime as dt
import sys

from etl.common import CITY_HALL_CNPJ, ID_MUNICIPIO_DEFAULT, get_supabase_client, upsert_com_colunas_opcionais
from etl.pncp.client import iter_contratos
from etl.temas import classificar_contrato


def _status_from_vigencia(vigencia_fim: str | None) -> str:
    if not vigencia_fim:
        return "ativo"
    try:
        fim = dt.date.fromisoformat(vigencia_fim[:10])
    except ValueError:
        return "ativo"
    return "encerrado" if fim < dt.date.today() else "ativo"


def _map_row(raw: dict, id_municipio: str) -> dict:
    orgao = raw.get("orgaoEntidade") or {}
    unidade = raw.get("unidadeOrgao") or {}
    return {
        "id_municipio": id_municipio,
        # numeroControlePNCP identifies the contrato itself (1:1, always
        # unique). numeroControlePncpCompra identifies the originating
        # compra/licitação, which can spawn multiple contratos -- keying on
        # it (the old behavior) silently collapsed distinct contracts from
        # the same compra into a single upserted row, discarding the rest.
        # Found live 2026-07-21 alongside the fornecedor_cnpj bug: several
        # rows kept stale/empty fornecedor data because a later contrato
        # sharing the same compra number overwrote them without carrying
        # its own fornecedor info forward correctly across re-runs.
        "numero_controle_pncp": raw.get("numeroControlePNCP") or raw.get("numeroControlePncpCompra"),
        "numero_contrato": raw.get("numeroContrato"),
        "ano": raw.get("anoContrato"),
        "orgao_cnpj": orgao.get("cnpj"),
        "orgao_nome": orgao.get("razaoSocial"),
        "unidade_nome": unidade.get("nomeUnidade"),
        "categoria": raw.get("categoriaProcesso", {}).get("nome") if isinstance(raw.get("categoriaProcesso"), dict) else raw.get("tipoContrato"),
        # tipoContrato is an object ({"id":1,"nome":"Contrato (termo
        # inicial)"}), not a string -- the old code stored the raw JSON
        # string in this text column. Found alongside the fornecedor_cnpj
        # bug, 2026-07-21.
        "tipo": raw.get("tipoContrato", {}).get("nome") if isinstance(raw.get("tipoContrato"), dict) else raw.get("tipoContrato"),
        "objeto": raw.get("objetoContrato"),
        # PNCP /v1/contratos returns fornecedor fields flat at the top level
        # (niFornecedor/nomeRazaoSocialFornecedor), NOT nested under a
        # "fornecedor" key -- confirmed live 2026-07-21 against a real raw
        # response. The old code read raw["fornecedor"]["cnpj"], which never
        # existed, so fornecedor_cnpj was silently NULL on every row.
        "fornecedor_cnpj": raw.get("niFornecedor"),
        "fornecedor_nome": raw.get("nomeRazaoSocialFornecedor"),
        "valor_inicial": raw.get("valorInicial"),
        "valor_global": raw.get("valorGlobal"),
        "data_assinatura": raw.get("dataAssinatura"),
        "vigencia_inicio": raw.get("dataVigenciaInicio"),
        "vigencia_fim": raw.get("dataVigenciaFim"),
        "numero_parcelas": raw.get("numeroParcelas"),
        "status": _status_from_vigencia(raw.get("dataVigenciaFim")),
        "link_fonte": raw.get("urlContrato") or raw.get("linkSistemaOrigem"),
        "raw": raw,
        # Tema temático (pedido do usuário 2026-07-22, ver etl/temas.py):
        # `unidade_nome` (o órgão que assinou) é o sinal primário,
        # `objeto` refina/complementa.
        "temas": classificar_contrato(unidade.get("nomeUnidade"), raw.get("objetoContrato")),
    }


def sync(id_municipio: str, cnpj_orgao: str, ano_inicio: int):
    client = get_supabase_client()
    ano_atual = dt.date.today().year
    total = 0
    for ano in range(ano_inicio, ano_atual + 1):
        data_inicial = f"{ano}0101"
        data_final = f"{ano}1231"
        rows_by_pncp: dict[str, dict] = {}
        for raw in iter_contratos(cnpj_orgao, data_inicial, data_final):
            row = _map_row(raw, id_municipio)
            # Dedupe by numero_controle_pncp -- see etl.pncp.licitacoes for
            # why (ON CONFLICT DO UPDATE can't affect the same row twice in
            # one batch; PNCP can repeat a contrato across page boundaries).
            rows_by_pncp[row["numero_controle_pncp"]] = row
        rows = list(rows_by_pncp.values())
        if rows:
            upsert_com_colunas_opcionais(
                client, "contratos", rows, ["temas"], on_conflict="numero_controle_pncp"
            )
        print(f"[etl.pncp.contratos] ano={ano} registros={len(rows)}")
        total += len(rows)
    print(f"[etl.pncp.contratos] total={total}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument("--cnpj-orgao", default=CITY_HALL_CNPJ)
    parser.add_argument("--ano-inicio", type=int, default=2021)
    args = parser.parse_args()
    try:
        sync(args.id_municipio, args.cnpj_orgao, args.ano_inicio)
    except RuntimeError as e:
        print(f"[etl.pncp.contratos] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
