"""Testes de `coletar-dnit-rodovias.py` — sem rede.

Roda sem pytest:  python scripts/coletar-dnit-rodovias_test.py
Protege quatro decisões medidas em 18/11/2026:
  1. XML de exceção chega com status 200/400 e NÃO é dado (a view sem chave
     responde "Cannot do natural order without a primary key").
  2. O mapeamento do trecho: `sup`/`adm` nulos ficam nulos, km com vírgula vira
     número, e trecho sem rodovia ou sem UF é descartado.
  3. Soma de km por UF e por rodovia fecha com o total.
  4. Cache válido não rebaixa (não toca na rede) e cache torto volta para a
     rede em vez de virar dado.
"""
import importlib.util
import json
import tempfile
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "dnit", Path(__file__).resolve().parent / "coletar-dnit-rodovias.py")
m = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(m)


def _feature(br, uf, ki, kf, ext, sup="PAV", adm=None, snv=None, versao="201710B",
             dt="2017-10-20Z"):
    return {"type": "Feature", "geometry": None,
            "properties": {"Codigo_BR": br, "Unidade_Federacao": uf,
                           "Quilometragem_Inicio": ki, "Quilometragem_Fim": kf,
                           "Extensao": ext, "Superficie_Federal": sup,
                           "Administracao": adm,
                           "Codigo_SNV": snv if snv is not None else f"{br}B{uf}{ki}",
                           "Versao_SNV": versao, "dt_ini": dt}}


def _corpo(feicoes, matched=None):
    return json.dumps({"type": "FeatureCollection", "features": feicoes,
                       "numberMatched": len(feicoes) if matched is None else matched,
                       "numberReturned": len(feicoes)}).encode("utf-8")


FEICOES = [
    _feature("163", "PA", 971.4, 982.1, 10.7, "PAV", "Federal"),
    _feature("163", "MT", 0, 45, 45, None, None),
    _feature("040", "MG", 10, 10, 0, "PLA"),
]


def test_xml_com_status_200_nao_e_dado():
    for excecao in (
        b'<?xml version="1.0" ?><ServiceExceptionReport>boom</ServiceExceptionReport>',
        b'  \n<ows:ExceptionReport xmlns:ows="x"></ows:ExceptionReport>',
        b"",
    ):
        try:
            m._parse_corpo(excecao)
        except RuntimeError:
            pass
        else:
            raise AssertionError(f"aceitou corpo inválido: {excecao[:40]!r}")
    assert len(m._parse_corpo(_corpo(FEICOES))["features"]) == 3


def test_trecho_mapeia_e_descarta_o_que_nao_diz_nada():
    linha = m._trecho(FEICOES[0])
    assert {k: v for k, v in linha.items() if not k.startswith("_")} == {
        "br": "163", "uf": "PA", "km_ini": 971.4, "km_fim": 982.1,
        "km_ext": 10.7, "sup": "PAV", "adm": "Federal", "ver": "201710B"}, linha
    # nulo continua nulo: não se inventa "Federal" nem "sem pavimento"
    assert m._trecho(FEICOES[1])["sup"] is None and m._trecho(FEICOES[1])["adm"] is None
    # sem rodovia ou sem UF o registro não identifica trecho nenhum
    assert m._trecho({"properties": {"Codigo_BR": "", "Unidade_Federacao": "PA"}}) is None
    assert m._trecho({"properties": {"Codigo_BR": "163"}}) is None


def test_km_com_virgula_vira_numero():
    assert m._num("12,5") == 12.5
    assert m._num("1.234,5") == 1234.5
    assert m._num(None) == 0.0 and m._num("") == 0.0


def test_soma_por_uf_e_por_rodovia_fecha_com_o_total():
    linhas = m._linhas(FEICOES)
    por_uf, por_rodovia = m._resumo(linhas)
    total_km = round(sum(t["km_ext"] for t in linhas), 1)
    assert round(sum(v["km"] for v in por_uf.values()), 1) == total_km, por_uf
    assert round(sum(v["km"] for v in por_rodovia.values()), 1) == total_km
    assert sum(v["trechos"] for v in por_uf.values()) == len(linhas)
    assert sum(v["trechos"] for v in por_rodovia.values()) == len(linhas)
    assert por_uf["PA"]["rodovias"] == 1 and por_rodovia["163"]["trechos"] == 2
    assert por_rodovia["163"]["ufs"] == ["MT", "PA"]
    # eixo coberto nunca é maior que a soma das extensões
    assert round(sum(v["km_eixo"] for v in por_uf.values()), 1) <= total_km


def test_uniao_km_desconta_sobreposicao():
    def t(ini, fim):
        return {"km_ini": ini, "km_fim": fim}
    assert m._uniao_km([t(0, 10), t(5, 15)]) == 15.0      # sobreposto
    assert m._uniao_km([t(0, 10), t(10, 20)]) == 20.0     # encostado
    assert m._uniao_km([t(10, 20), t(0, 10)]) == 20.0     # fora de ordem
    assert m._uniao_km([t(0, 10), t(30, 40)]) == 20.0     # buraco não conta
    assert m._uniao_km([t(0, 10), t(1, 5)]) == 10.0       # contido


def test_linhas_ficam_com_a_versao_mais_recente_do_trecho():
    """A camada é histórica: 3 versões do mesmo SNV são UM trecho, o mais novo."""
    versoes = [
        _feature("307", "AC", 131.2, 156.6, 25.4, "PLA", None, "307BAC0020", "201606A", "2016-06-30Z"),
        _feature("307", "AC", 131.2, 156.6, 25.4, "PLA", "Adm Estadual", "307BAC0020", "201609C", "2016-09-09Z"),
        _feature("307", "AC", 131.2, 158.0, 26.8, "PLA", "Estadual", "307BAC0020", "201710B", "2017-10-20Z"),
    ]
    linhas = m._linhas(versoes)
    assert len(linhas) == 1, linhas
    assert linhas[0]["ver"] == "201710B" and linhas[0]["adm"] == "Estadual", linhas[0]
    assert linhas[0]["km_fim"] == 158.0 and linhas[0]["km_ext"] == 26.8
    # linha sem código SNV não tem como ser agrupada: cada uma é um trecho
    assert len(m._linhas([_feature("163", "PA", 1, 2, 1, snv=""),
                          _feature("163", "PA", 1, 2, 1, snv="")])) == 2


def test_cache_valido_nao_rebaixa():
    with tempfile.TemporaryDirectory() as tmp:
        antigo = m.CACHE
        m.CACHE = Path(tmp)
        (m.CACHE / "uf-PA-p00.json").write_bytes(_corpo(FEICOES[:1]))
        try:
            def _proibido(*a, **k):
                raise AssertionError("bateu na rede com cache válido")

            m._get = _proibido
            meta = {"ufs": {"PA": {"numberMatched": 1, "paginas": [
                {"arquivo": "uf-PA-p00.json", "numberMatched": 1, "numberReturned": 1}]}}}
            assert len(m._coletar_uf("PA", False, meta)) == 1
            # cache torto: a contagem declarada não bate com o arquivo → rede
            meta["ufs"]["PA"]["numberMatched"] = 2
            assert m._ler_cache("PA", meta["ufs"]["PA"]) is None
        finally:
            m.CACHE = antigo


def test_cache_quebrado_cai_para_a_rede():
    with tempfile.TemporaryDirectory() as tmp:
        antigo_cache, antigo_meta = m.CACHE, m.META
        m.CACHE = Path(tmp)
        m.META = m.CACHE / "meta.json"
        (m.CACHE / "uf-PA-p00.json").write_bytes(b"<?xml version='1.0'?><e/>")
        chamadas = []

        def _falso(params, nome):
            chamadas.append(params["startIndex"])
            return _corpo(FEICOES[:1])

        m._get = _falso
        try:
            meta = {"ufs": {"PA": {"numberMatched": 1, "paginas": [
                {"arquivo": "uf-PA-p00.json", "numberMatched": 1, "numberReturned": 1}]}}}
            assert len(m._coletar_uf("PA", False, meta)) == 1
            assert chamadas == ["0"], chamadas
            assert meta["ufs"]["PA"]["numberMatched"] == 1
        finally:
            m.CACHE, m.META = antigo_cache, antigo_meta


if __name__ == "__main__":
    for nome, funcao in list(globals().items()):
        if nome.startswith("test_") and callable(funcao):
            funcao()
            print(f"ok {nome}")
    print("todos os testes passaram")
