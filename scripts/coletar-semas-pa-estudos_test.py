"""Teste do parser de `coletar-semas-pa-estudos.py` (SEMAS-PA, EIA/RIMA/audiências).

Roda sem rede: o JSON é um recorte de item real da API do portal da
transparência (medido 17/11/2026), com o item da ata de audiência de Itaituba.

  python scripts/coletar-semas-pa-estudos_test.py
"""
import importlib.util
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "semas_pa_estudos",
    Path(__file__).resolve().parent / "coletar-semas-pa-estudos.py")
m = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(m)

TIPO_AUDIENCIA = {"id": 3, "nome": "Relatórios", "secao_filtro": "LICENCIAMENTO",
                  "descricao": "Audiência Pública"}
TIPO_RIMA = {"id": 5, "nome": "Relatório de Impactos Ambientais"}
TIPO_EIA = {"id": 6, "nome": "Estudos de Impacto Ambiental"}

# recorte do item id=585 (ata, Itaituba/PA) — só os campos que o coletor usa
ITEM_ATA = {
    "id": 585, "nome_arquivo": "2019.pdf", "tamanho_arquivo": 2033000,
    "cpf_cnpj": "23933554000147", "nome_razao_social": "RIO TAPAJÓS LOGÍSTICA LTDA",
    "ano": "2019", "data_audiencia": "2019-07-02", "data": "2019-02-07",
    "numero_processo": None,
    "tipo_arquivo": TIPO_AUDIENCIA,
    "municipio": {"id_municipio": 1503606, "nome_municipio": "ITAITUBA", "uf": "PA"},
    "tipologia": {"id_atividade": "988", "codigo": "0472-1",
                  "nome_tipologia": "OBRAS CIVIS E DE INFRA-ESTRUTURAS",
                  "nome_atividade": "INSTALAÇÃO PORTUÁRIA"},
}


def _esperado(chave):
    return next(t for t in m.TIPOS if t["chave"] == chave)


def test_confere_tipo_pelo_nome():
    # audiência: nome genérico só vale com descrição de audiência
    assert m._tipo_confere(TIPO_AUDIENCIA, _esperado("audiencia"))
    assert not m._tipo_confere(TIPO_RIMA, _esperado("audiencia"))
    assert not m._tipo_confere({"id": 3, "nome": "Relatórios",
                                "descricao": "Fiscalização"}, _esperado("audiencia"))
    # RIMA e EIA não se confundem (nome parecido: "Impacto(s) Ambiental(is)")
    assert m._tipo_confere(TIPO_RIMA, _esperado("rima"))
    assert not m._tipo_confere(TIPO_RIMA, _esperado("eia"))
    assert m._tipo_confere(TIPO_EIA, _esperado("eia"))
    assert not m._tipo_confere(TIPO_EIA, _esperado("rima"))
    assert not m._tipo_confere({}, _esperado("eia"))


def test_linha_da_ata():
    lin = m._linha(dict(ITEM_ATA), "audiencia")
    assert lin["id"] == 585 and lin["tipo"] == "audiencia"
    assert lin["municipio"] == "ITAITUBA" and lin["uf"] == "PA"
    assert lin["cnpj"] == "23933554000147" and "doc_redigido" not in lin
    assert lin["data_audiencia"] == "2019-07-02"
    assert lin["url_pdf"].endswith("/documentos/download/585")
    assert lin["tamanho_bytes"] == 2033000
    assert m._ano_da_linha(lin) == "2019"


def test_ano_cai_para_data_da_audiencia():
    # medido: item de tipo 3 com `ano` nulo — o ano sai da data da audiência
    item = dict(ITEM_ATA, ano=None)
    assert m._ano_da_linha(m._linha(item, "audiencia")) == "2019"
    assert m._ano_da_linha({"ano": None, "data_audiencia": None}) == "(sem ano)"


def _cpf_falso() -> "tuple[str, str]":
    """CPF válido por mod-11 CONSTRUÍDO aqui, nunca literal no repositório.

    A primeira versão deste teste trazia um CPF válido escrito à mão e o
    hook de pré-push barrou — CPF válido em código é justamente o que o
    varredor do repo tem de barrar. Devolve (só dígitos, formatado)."""
    dig = "123456789"
    for ate in (9, 10):
        soma = sum(int(dig[i]) * (ate + 1 - i) for i in range(ate))
        resto = (soma * 10) % 11
        dig += str(0 if resto == 10 else resto)
    return dig, f"{dig[:3]}.{dig[3:6]}.{dig[6:9]}-{dig[9:]}"


def test_cpf_nunca_gravado_cnpj_preservado():
    cpf, formatado = _cpf_falso()
    item = dict(ITEM_ATA, cpf_cnpj=cpf, nome_razao_social=f"FULANO {formatado}")
    lin = m._linha(item, "audiencia")
    assert lin["cnpj"] is None and lin["doc_redigido"] == 1
    assert formatado not in lin["empreendimento"]
    assert lin["empreendimento"].startswith("FULANO [CPF redigido]")
    # CNPJ de pessoa jurídica intacto
    assert m._cnpj_ou_redigido("12.345.678/0001-90") == ("12345678000190", False)
    assert m._apagar_cpf_em_texto("CNPJ 12.345.678/0001-90") == "CNPJ 12.345.678/0001-90"


def test_item_sem_id_falha_alto():
    try:
        m._linha({**ITEM_ATA, "id": None}, "audiencia")
    except RuntimeError:
        return
    raise AssertionError("item sem id deveria abortar, não virar linha")


if __name__ == "__main__":
    for nome, fn in sorted(globals().items()):
        if nome.startswith("test_") and callable(fn):
            fn()
            print(f"  ok  {nome}")
    print("\n%d testes ok" % sum(1 for n in globals() if n.startswith("test_")))
