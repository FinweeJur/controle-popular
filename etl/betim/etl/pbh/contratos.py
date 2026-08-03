"""etl.pbh.contratos — contratos e licitações da PBH pelo GRP.

    python -m etl.pbh.contratos --id-municipio 3106200

POR QUE ESTA FONTE E NÃO O PNCP, para Belo Horizonte. O PNCP é a fonte
canônica nacional e é o que alimenta Betim, mas em BH ele subconta de forma
grave: `cnpjOrgao=18715383000140` traz só a administração direta central,
e a capital contrata por dezenas de autarquias e empresas com CNPJ próprio
(SUDECAP, SLU, SMSA, BHTrans, Belotur, Prodabel, URBEL, PBH Ativos...).
Consultar por `codigoMunicipioIbge` no lugar disso piora: devolve todo órgão
SEDIADO no município, incluindo federais e estaduais — em São Paulo a mesma
consulta trouxe USP, Metrô, TJ-SP e ministérios.

O GRP da PBH resolve os dois problemas de uma vez: são 6.832 contratos de
TODA a administração municipal, já recortados pelo próprio município, com
CNPJ do contratado, valor, vigência, situação e órgão gestor.

CHAVE DE UPSERT. `contratos.numero_controle_pncp` é UNIQUE global e é o que
o resto do pipeline usa. Contrato do GRP não tem número PNCP, então recebe
um identificador sintético `PBH-GRP-<CttId>` — namespace distinto o
bastante para nunca colidir com um número do PNCP (que tem o formato
`<cnpj>-1-<seq>/<ano>`) e estável entre execuções, porque `CttId` é a chave
primária do sistema de origem.
"""

import argparse
import sys

from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    carregar_municipio,
    get_supabase_client,
    upsert_com_colunas_opcionais,
)
from etl.pbh.cliente import grp

FONTE = "GRP Transparência PBH"
PORTAL = "https://grp.pbh.gov.br/bh_prd_transparencia/"


def _num(v) -> float | None:
    """Valor monetário do GRP.

    Vem como string decimal com ponto (`"408163.2700"`), mas `LctEstimado`
    pode trazer o literal **"SIGILOSO"** quando o orçamento da licitação é
    sigiloso (permitido pela Lei 14.133). Um `float()` cru estoura ali, e
    tratar como zero seria pior que nulo: zero soma no total e mente sobre o
    valor estimado da cidade.
    """
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    texto = str(v).strip().replace("R$", "").strip()
    if not texto or not any(c.isdigit() for c in texto):
        return None
    texto = texto.replace(".", "").replace(",", ".") if "," in texto else texto
    try:
        return float(texto)
    except ValueError:
        return None


def _data(v) -> str | None:
    """O GRP já devolve ISO (`2026-07-09`); nulo vem como "" ou data zero."""
    if not v:
        return None
    texto = str(v).strip()
    if texto.startswith(("0000", "1900-01-01")):
        return None
    return texto[:10] or None


def _mapear_contrato(c: dict, id_municipio: str) -> dict:
    ctt_id = c.get("CttId")
    assinatura = _data(c.get("CttAssinatura"))
    return {
        "id_municipio": id_municipio,
        "numero_controle_pncp": f"PBH-GRP-{ctt_id}",
        "numero_contrato": (c.get("CttNumero") or "").strip() or None,
        "ano": int(assinatura[:4]) if assinatura else None,
        "orgao_cnpj": None,  # o GRP identifica o órgão por nome, não por CNPJ
        "orgao_nome": (c.get("CttOrgaoGestor") or "").strip() or None,
        "unidade_nome": (c.get("CttOrgaoRequisitante") or "").strip() or None,
        "tipo": (c.get("CttTipo") or "").strip() or None,
        "objeto": (c.get("CttObjeto") or "").strip() or None,
        "fornecedor_cnpj": (c.get("CttCPFCNPJ") or "").strip() or None,
        "fornecedor_nome": (c.get("CttContratado") or "").strip() or None,
        "valor_inicial": _num(c.get("CttValor")),
        "valor_global": _num(c.get("CttValor")),
        "data_assinatura": assinatura,
        "vigencia_inicio": _data(c.get("CttVigenciaInicio")),
        # A fonte grafa esta chave com C maiúsculo no meio, ao contrário das
        # vizinhas (`CTTVigenciaFim` vs `CttVigenciaInicio`). Não é typo
        # deste código: é assim que o GRP devolve.
        "vigencia_fim": _data(c.get("CTTVigenciaFim")),
        "status": (c.get("CttSituacao") or "").strip() or None,
        "link_fonte": PORTAL,
        "raw": c,
    }


def _mapear_licitacao(l: dict, id_municipio: str) -> dict:
    return {
        "id_municipio": id_municipio,
        "numero_controle_pncp": f"PBH-GRP-LCT-{l.get('LctId')}",
        "orgao_nome": (l.get("LctOrgaoEntidade") or "").strip() or None,
        "modalidade_nome": (l.get("LctModalidade") or "").strip() or None,
        "objeto": (l.get("LctObjeto") or "").strip() or None,
        "processo": (l.get("LctNrProcesso") or "").strip() or None,
        "srp": str(l.get("LctAtaRegPreco") or "").strip().upper() in ("SIM", "S", "TRUE"),
        "valor_estimado": _num(l.get("LctEstimado")),
        "valor_homologado": _num(l.get("LctValorHomologado")),
        "situacao": (l.get("LctSituacao") or "").strip() or None,
        "data_publicacao_pncp": _data(l.get("LctDataPublicacao")),
        "data_abertura": _data(l.get("LctDataLicitacao")),
        "link_sistema_origem": PORTAL,
        "raw": l,
    }


# Um INSERT do Postgres aceita no máximo 65.535 placeholders. `contratos`
# tem ~19 colunas, o que dá teto de ~3.400 linhas por instrução — e os 6.832
# contratos de BH passam disso. Lotes de 1.000 ficam longe do limite em
# qualquer tabela deste schema e mantêm cada instrução curta o bastante para
# não segurar a conexão por minutos.
LOTE = 1000


def _upsert_em_lotes(client, tabela: str, linhas: list[dict], chave: str, opcionais: list[str] | None = None):
    for i in range(0, len(linhas), LOTE):
        fatia = linhas[i : i + LOTE]
        if opcionais:
            upsert_com_colunas_opcionais(client, tabela, fatia, opcionais, on_conflict=chave)
        else:
            client.table(tabela).upsert(fatia, on_conflict=chave).execute()


def sync(id_municipio: str) -> None:
    cidade = carregar_municipio(id_municipio)
    if cidade["fontes"].get("prefeitura_grp") is not True:
        raise RuntimeError(
            f"id_municipio={id_municipio} ({cidade['nome']}) não declara "
            "`fontes.prefeitura_grp: true`. Este módulo é do GRP da Ábaco "
            "instalado em Belo Horizonte; outra cidade com GRP precisa ser "
            "verificada antes (o nome do procedimento e o host mudam)."
        )

    client = get_supabase_client()

    brutos = grp("PContrato")
    contratos = {}
    for c in brutos:
        linha = _mapear_contrato(c, id_municipio)
        # Dedupe por chave dentro do lote: `ON CONFLICT DO UPDATE` não pode
        # tocar a mesma linha duas vezes numa instrução, e a paginação do
        # GRP pode repetir um registro na borda de página.
        contratos[linha["numero_controle_pncp"]] = linha
    if contratos:
        _upsert_em_lotes(
            client, "contratos", list(contratos.values()), "numero_controle_pncp", ["temas"]
        )
    print(f"[etl.pbh.contratos] contratos={len(contratos)}")

    brutas = grp("PLicitacao")
    licitacoes = {}
    for l in brutas:
        linha = _mapear_licitacao(l, id_municipio)
        licitacoes[linha["numero_controle_pncp"]] = linha
    if licitacoes:
        _upsert_em_lotes(
            client, "licitacoes", list(licitacoes.values()), "numero_controle_pncp"
        )
    print(f"[etl.pbh.contratos] licitacoes={len(licitacoes)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio)
    except RuntimeError as e:
        print(f"[etl.pbh.contratos] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
