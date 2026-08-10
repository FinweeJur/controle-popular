"""etl.pncp.contratos — sync PNCP /v1/contratos into the `contratos` table.

Usage: python -m etl.pncp.contratos --id-municipio 3106705 [--ano-inicio 2021]

Backfills year by year from 2021 (PNCP start) through the current year, then
should be run daily going forward (cron in .github/workflows/etl.yml).
"""
import argparse
import datetime as dt
import re
import sys

from etl.common import (
    CITY_HALL_CNPJ,
    ID_MUNICIPIO_DEFAULT,
    carregar_municipio,
    get_supabase_client,
    upsert_com_colunas_opcionais,
)
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


def link_do_contrato(numero_controle_pncp: str | None) -> str | None:
    """A página pública do contrato no PNCP, derivada do número de controle.

    ═══ POR QUE DERIVAR EM VEZ DE LER DA API ═══

    A API do PNCP tem `urlContrato` e `linkSistemaOrigem`, e o coletor lia os
    dois. Medido em 2026-08-10: **os dois vêm nulos em 1.268 de 1.268
    contratos** — 100%. O resultado é que nenhuma linha da tela de contratos
    tinha para onde apontar, e o portal pedia confiança em vez de oferecer
    conferência, que é o oposto do que ele defende.

    Mas o endereço não precisa vir da API: ele é uma função do número de
    controle, que TODA linha tem. O formato é

        18715391000196-2-000048/2025
        └── CNPJ ──┘ │ └ seq ┘ └ano┘
                     └ tipo (2 = contrato)

        -> https://pncp.gov.br/app/contratos/18715391000196/2025/000048

    Conferido no navegador em 2026-08-10, não por código HTTP: o PNCP é uma
    SPA e devolve **200 para qualquer caminho**, inclusive inventado. A
    verificação que vale é abrir e ver o conteúdo — esta URL renderiza o
    contrato ADM0049/2025 de Betim, R$ 22.225.169,94, fornecedor OBJETIVA
    PROJETOS, batendo com a linha do banco.

    **Os zeros à esquerda do sequencial ficam.** `000048` é o que a rota
    espera; `48` é outro caminho.
    """
    if not numero_controle_pncp:
        return None
    m = re.match(r"^(\d{14})-\d+-(\d+)/(\d{4})$", numero_controle_pncp.strip())
    if not m:
        # Número fora do formato não vira link torto: vira link nenhum. Um
        # "ver no PNCP" que abre 404 é pior que a ausência do botão — promete
        # conferência e entrega beco sem saída.
        return None
    cnpj, sequencial, ano = m.groups()
    return f"https://pncp.gov.br/app/contratos/{cnpj}/{ano}/{sequencial}"


def _map_row(raw: dict, id_municipio: str) -> dict:
    orgao = raw.get("orgaoEntidade") or {}
    unidade = raw.get("unidadeOrgao") or {}
    numero_controle = raw.get("numeroControlePNCP") or raw.get("numeroControlePncpCompra")
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
        "numero_controle_pncp": numero_controle,
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
        # Os dois campos da API vêm nulos em 100% dos contratos municipais
        # (medido em 1.268/1.268). Ficam na frente mesmo assim: se um dia o
        # órgão preencher, o link dele é melhor que o derivado, porque aponta
        # para o sistema de origem. Ver `link_do_contrato`.
        "link_fonte": (
            raw.get("urlContrato")
            or raw.get("linkSistemaOrigem")
            or link_do_contrato(numero_controle)
        ),
        "raw": raw,
        # Tema temático (pedido do usuário 2026-07-22, ver etl/temas.py):
        # `unidade_nome` (o órgão que assinou) é o sinal primário,
        # `objeto` refina/complementa.
        "temas": classificar_contrato(unidade.get("nomeUnidade"), raw.get("objetoContrato")),
    }


def sync(
    id_municipio: str,
    cnpj_orgao: str | None,
    ano_inicio: int,
    permitir_fonte_dupla: bool = False,
):
    """`cnpj_orgao` sai de `municipios.cnpj_prefeitura`.

    Derivado de `municipios` (ver `carregar_municipio`): este parâmetro tinha
    default fixo de Betim, então rodar só com `--id-municipio <outra cidade>`
    coletava o dado de Betim e o gravava com o id da outra — sem erro. Mesmo
    defeito encontrado e corrigido em `etl.apis.anp` em 2026-08-03.

    Era o caso mais grave dos quatro: o CNPJ da Prefeitura de Betim como
    default significa que `--id-municipio 3550308` importaria os contratos de
    BETIM para dentro do portal de São Paulo, e a chave de upsert
    (`numero_controle_pncp`) é global — os contratos de Betim seriam
    reetiquetados, não duplicados, sumindo do portal de origem.
    """
    client = get_supabase_client()
    cidade = carregar_municipio(id_municipio)

    # UMA CIDADE, UMA FONTE DE CONTRATO. Belo Horizonte é atendida pelo GRP
    # da PBH (`etl.pbh.contratos`), que traz os 6.838 contratos de toda a
    # administração; o PNCP por `cnpjOrgao` traz só a administração direta
    # central, e rodar os dois gerou 745 pares exatos duplicados no portal
    # — dois registros do mesmo contrato, com chaves diferentes, sem nada
    # que os ligue. Não há chave comum para deduplicar depois, então a
    # escolha tem de ser feita ANTES de gravar.
    #
    # O override existe porque comparar as duas fontes é um uso legítimo;
    # o que não pode é acontecer por descuido numa rodada de rotina.
    fonte_propria = cidade["fontes"].get("contratos_fonte")
    if fonte_propria and fonte_propria != "pncp" and not permitir_fonte_dupla:
        raise RuntimeError(
            f"{cidade['nome']} declara `fontes.contratos_fonte = {fonte_propria!r}`; "
            "rodar o PNCP por cima duplicaria os contratos. Use o módulo dessa "
            "fonte, ou passe --permitir-fonte-dupla se a intenção é comparar."
        )

    # UM CNPJ NÃO É A CIDADE. `cnpjOrgao=<prefeitura>` alcança só a
    # administração direta central: em São Paulo isso deu **114 contratos**
    # de 2024 a 2026, porque secretarias, subprefeituras e empresas
    # municipais (SP Obras, PRODAM, Fundo Municipal de Saúde...) têm CNPJ
    # próprio. A lista completa fica em `municipios.fontes.cnpjs_orgao`,
    # descoberta por `etl.pncp.orgaos` filtrando `esferaId == "M"`.
    #
    # Sem a lista, cai no CNPJ da prefeitura — que é o comportamento antigo
    # e continua correto para uma cidade pequena como Betim, onde a
    # administração direta é quase tudo.
    if cnpj_orgao is not None:
        cnpjs = [cnpj_orgao]
    else:
        cnpjs = [str(c) for c in (cidade["fontes"].get("cnpjs_orgao") or []) if c]
        if not cnpjs:
            principal = cidade["cnpj_prefeitura"]
            if not principal:
                raise RuntimeError(
                    f"municipios.cnpj_prefeitura vazio para id_municipio={id_municipio}."
                )
            cnpjs = [principal]
            print(
                "[etl.pncp.contratos] AVISO: usando só o CNPJ da prefeitura. "
                "Numa capital isso subconta — rode `python -m etl.pncp.orgaos "
                f"--id-municipio {id_municipio} --gravar` primeiro."
            )
    print(f"[etl.pncp.contratos] {len(cnpjs)} CNPJ(s) de órgão")
    ano_atual = dt.date.today().year
    total = 0
    for ano in range(ano_inicio, ano_atual + 1):
        data_inicial = f"{ano}0101"
        data_final = f"{ano}1231"
        rows_by_pncp: dict[str, dict] = {}
        for cnpj in cnpjs:
            for raw in iter_contratos(cnpj, data_inicial, data_final):
                row = _map_row(raw, id_municipio)
                # Dedupe by numero_controle_pncp -- see etl.pncp.licitacoes
                # for why (ON CONFLICT DO UPDATE can't affect the same row
                # twice in one batch; PNCP can repeat a contrato across page
                # boundaries). Com vários CNPJs o dedupe também cobre o
                # mesmo contrato aparecendo sob dois órgãos.
                rows_by_pncp[row["numero_controle_pncp"]] = row
        rows = list(rows_by_pncp.values())
        if rows:
            # Lotes: um INSERT do Postgres aceita 65.535 placeholders e
            # `contratos` tem ~19 colunas — com vários CNPJs de uma capital,
            # um ano só passa do teto.
            for i in range(0, len(rows), 1000):
                upsert_com_colunas_opcionais(
                    client,
                    "contratos",
                    rows[i : i + 1000],
                    ["temas"],
                    on_conflict="numero_controle_pncp",
                )
        print(f"[etl.pncp.contratos] ano={ano} registros={len(rows)}")
        total += len(rows)
    print(f"[etl.pncp.contratos] total={total}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument(
        "--cnpj-orgao",
        default=None,
        help="Override; o padrão é `municipios.cnpj_prefeitura`.",
    )
    parser.add_argument("--ano-inicio", type=int, default=2021)
    parser.add_argument(
        "--permitir-fonte-dupla",
        action="store_true",
        help="Roda mesmo se a cidade declarar outra fonte canônica de contratos.",
    )
    args = parser.parse_args()
    try:
        sync(args.id_municipio, args.cnpj_orgao, args.ano_inicio, args.permitir_fonte_dupla)
    except RuntimeError as e:
        print(f"[etl.pncp.contratos] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
