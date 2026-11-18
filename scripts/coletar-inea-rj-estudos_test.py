"""Teste do parser de `coletar-inea-rj-estudos.py` (INEA-RJ, EIA/RIMA e audiências).

Roda sem rede: os recortes de HTML são cópias reais das páginas medidas em
18/11/2026 (2025 no layout novo de `<div class="list-item-style-four">`, 2007 no
layout antigo de `<p>`, e a lista de audiências), encolhidas para 1–3 itens.

  python scripts/coletar-inea-rj-estudos_test.py
"""
import importlib.util
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "inea_rj_estudos",
    Path(__file__).resolve().parent / "coletar-inea-rj-estudos.py")
m = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(m)

# recorte real de /eia-rima-2025/ (layout novo: h4 com o título + p com a
# descrição + âncora-ícone repetindo o mesmo arquivo)
HTML_2025 = """
<!-- internal content -->
<div class="container-fluid pt-5"><div class="inea-container"><div class="row">
<div class="col-12 col-md-4">
  <nav><ul><li><a href="https://www.inea.rj.gov.br/wp-content/uploads/2026/06/Carta.pdf">Carta de Serviços ao Cidadão</a></li></ul></nav>
</div>
<div class="col-12 col-md-8"><section class="inea-section"><div class="row">
  <div class="col-12 d-flex list-item-style-four bg-digital-gray-list">
    <div class="w-100">
      <h4><a href="https://www.inea.rj.gov.br/wp-content/uploads/2026/01/EIA-CEDRO.pdf" target="_blank" download="download" class="w-100"> EIA - SEI-070002/006718/2025 - Cedro Porto do Meio (CPM)</a></h4>
      <p>Acesso ao Estudo de Impacto Ambiental (EIA), referente ao requerimento de Licença Ambiental Integrada - LAI, para análise da concepção, localização e instalação do terminal portuário denominado Cedro Porto do Meio (CPM), localizado no Complexo Portuário de Itaguaí/RJ.</p>
    </div>
    <a href="https://www.inea.rj.gov.br/wp-content/uploads/2026/01/EIA-CEDRO.pdf" class="with-icon flex-grow-1"><i class="fas fa-arrow-alt-to-bottom"></i></a>
  </div>
  <div class="col-12 d-flex list-item-style-four bg-digital-gray-list">
    <div class="w-100">
      <h4><a href="https://www.inea.rj.gov.br/wp-content/uploads/2026/01/RIMA_CEDRO.pdf" target="_blank" download="download" class="w-100">RIMA - SEI-070002/006718/2025 - Cedro Porto do Meio (CPM)</a></h4>
      <p>Acesso ao Relatório de Impacto Ambiental (RIMA), referente ao requerimento de Licença Ambiental Integrada - LAI.</p>
    </div>
    <a href="https://www.inea.rj.gov.br/wp-content/uploads/2026/01/RIMA_CEDRO.pdf" class="with-icon flex-grow-1"><i class="fas fa-arrow-alt-to-bottom"></i></a>
  </div>
  <div class="col-12 d-flex list-item-style-four bg-digital-gray-list">
    <div class="w-100">
      <h4><a href="https://www.inea.rj.gov.br/wp-content/uploads/2025/07/EIA-COMPACTADO.zip" class="w-100"> EIA - SEI-070002/009485/2023 - Parque Recreio Participações e Empreendimentos Imobiliários Ltda</a></h4>
      <p>Acesso ao Estudo de Impacto Ambiental (EIA), para análise da viabilidade ambiental da concepção e localização de bairro planejado de ocupação mista no município do Rio de Janeiro.</p>
    </div>
  </div>
</div></section></div>
</div></div></div>
<!-- internal content -->
<footer><a href="https://www.inea.rj.gov.br/wp-content/uploads/rodape.pdf">rodapé</a></footer>
"""

# recorte real de /eia-rima-2007/ (layout antigo: um <p> por arquivo, título às
# vezes partido em dois <a>, e um .7z do próprio host)
HTML_2007 = """
<!-- internal content -->
<div class="container-fluid"><div class="row"><div class="col-12 col-md-8">
<section class="inea-section"><div class="row"><div class="col-12 wysiwyg">
<p><a href="http://www.inea.rj.gov.br/wp-content/uploads/downloads/EIA-RIMA/2007/E_07_203.110_2005 Itaipava Condomínio.7z"><strong>E-07-203.110-2005 Itaipava Condomínio Residencial Condado Manga Larga</strong></a></p>
<p><a href="https://www.inea.rj.gov.br/wp-content/uploads/2024/04/2323-00-EIA-RL-0001-00_Volume-01.pdf">E-07/202181/2004 &#8211; Estudo de Impacto Ambiental &#8211; EIA e RIMA para as Obras de Implantação da Rodovia RJ 109 </a><a href="https://www.inea.rj.gov.br/wp-content/uploads/2024/04/2323-00-EIA-RL-0001-00_Volume-01.pdf">(Parte 1) </a></p>
<p>&nbsp;</p>
<p><a href="http://www.inea.rj.gov.br/publicacoes/eia-rima/"><strong>Voltar para o menu principal</strong></a></p>
</div></div></section></div></div></div>
<!-- internal content -->
"""

# recorte real de /eia-rima-2022/ — página que a mãe NÃO linka. O nº de
# processo está num <strong> FORA do link e o estudo está no Google Drive.
HTML_2022 = """
<!-- internal content -->
<div class="container-fluid"><div class="row"><div class="col-12 col-md-8">
<section class="inea-section"><div class="row"><div class="col-12 wysiwyg">
<p><strong>E-07/002.102285/2018</strong> &#8211; <a href="https://drive.google.com/file/d/1f1uj_TXUtg0JqboNhh0v9c5yuyq80Qnx/view?usp=sharing">ESTUDO DE IMPACTO AMBIENTAL (EIA/RIMA) PARA ANÁLISE DA VIABILIDADE AMBIENTAL DA IMPLANTAÇÃO DE UM ATERRO SANITÁRIO, NO MUNICÍPIO DE MIRACEMA, SOB RESPONSABILIDADE DA EMPRESA CTR MIRACEMA LTDA.</a></p>
<p><strong>E-07/002.100658/2018</strong> &#8211; <a href="http://www.inea.rj.gov.br/wp-content/uploads/downloads/EIA-RIMA/EIA%20-%20PCH%20MACAE.zip">ESTUDO DE IMPACTO AMBIENTAL (EIA) PARA FINS DE ANÁLISE DE VIABILIDADE DE UMA PCH, ENTRE OS MUNICÍPIOS DE MACAÉ E CASIMIRO DE ABREU.</a></p>
</div></div></section></div></div></div>
<!-- internal content -->
"""

# recorte real de /audiencias-publicas/ (lista única, sem paginação)
HTML_AUDIENCIAS = """
<!-- internal content -->
<div class="container-fluid"><div class="row"><div class="col-12 col-md-4">
  <nav><ul><li><a href="https://www.inea.rj.gov.br/licenambiental/">Licenciamento</a></li></ul></nav>
</div>
<div class="col-12 col-md-8">
  <div class="col-12 d-flex list-item-style-one bg-digital-gray-list">
    <div class="mr-3"><h4><a href="https://www.inea.rj.gov.br/wp-content/uploads/2025/07/02_PARQUE-RECREIO-AP_30_07_25.pdf">SEI-070002/009485/2023 - Parque Recreio Participações e Emp. IMOBILIÁRIOS LTDA – 30/07/2025</a></h4></div>
    <a href="https://www.inea.rj.gov.br/wp-content/uploads/2025/07/02_PARQUE-RECREIO-AP_30_07_25.pdf" class="with-icon ml-auto"><i class="fas fa-file-download"></i></a>
  </div>
  <div class="col-12 d-flex list-item-style-one bg-digital-gray-list">
    <div class="mr-3"><h4><a href="https://www.inea.rj.gov.br/wp-content/uploads/2019/09/ATA-Audiência-Pública-TEPOR-2018.pdf">ATA - Audiência Pública - TEPOR - 2018</a></h4></div>
  </div>
</div></div></div>
<!-- internal content -->
"""


def test_parser_layout_novo():
    itens = m._itens_da_pagina(HTML_2025)
    # a Carta de Serviços (menu) e o rodapé ficam de fora
    assert len(itens) == 3, itens
    assert [i["url_documento"].rsplit("/", 1)[-1] for i in itens] == [
        "EIA-CEDRO.pdf", "RIMA_CEDRO.pdf", "EIA-COMPACTADO.zip"]
    assert itens[0]["titulo"] == "EIA - SEI-070002/006718/2025 - Cedro Porto do Meio (CPM)"
    assert "Itaguaí/RJ" in itens[0]["descricao"]
    assert not any("Carta" in (i["titulo"] or "") for i in itens)


def test_parser_layout_antigo():
    itens = m._itens_da_pagina(HTML_2007)
    assert len(itens) == 2, itens  # o "Voltar para o menu" não tem arquivo
    assert itens[0]["url_documento"].endswith(".7z")
    # título partido em dois links: os dois pedaços entram
    assert itens[1]["titulo"].endswith("Rodovia RJ 109 (Parte 1)")


def test_tipo_nao_confunde_palavra_com_eia():
    assert m._tipo("EIA - SEI-070002/006718/2025 - Cedro", "x.pdf", False) == "eia"
    assert m._tipo("RIMA - SEI-070002/006718/2025 - Cedro", "x.pdf", False) == "rima"
    assert m._tipo("SEI-070007/001247/2022 - EIA/RIMA - UTE Polo GasLub",
                   "x.pdf", False) == "eia_rima"
    # "praia"/"baleia" não são EIA
    assert m._tipo("Condomínio Praia da Baleia", "x.pdf", False) == "outro"
    assert m._tipo("SEI-1 - Hub", "EIA_RIMA_Hub.rar", False) == "eia_rima"
    assert m._tipo("qualquer", "x.pdf", True) == "audiencia"


def test_linhas_das_tres_paginas():
    linhas = [m._linha(i, 2025, m.URL_ANO.format(ano=2025))
              for i in m._itens_da_pagina(HTML_2025)]
    eia, rima, zip_ = linhas
    assert eia["tipo"] == "eia" and eia["formato"] == "pdf"
    assert eia["numero_processo"] == "SEI-070002/006718/2025"
    assert eia["empreendimento"] == "Cedro Porto do Meio (CPM)"
    assert eia["municipio"] == "Itaguaí" and eia["municipio_base"] == "X/RJ"
    assert eia["uf"] == "RJ" and eia["ano"] == 2025
    assert rima["tipo"] == "rima" and rima["municipio"] is None
    assert zip_["formato"] == "zip" and zip_["municipio"] == "Rio de Janeiro"
    assert zip_["municipio_base"] == "explicito"

    velhos = [m._linha(i, 2007, m.URL_ANO.format(ano=2007))
              for i in m._itens_da_pagina(HTML_2007)]
    assert velhos[0]["numero_processo"] == "E-07-203.110-2005"
    assert velhos[0]["formato"] == "7z" and velhos[0]["tipo"] == "outro"
    assert velhos[1]["numero_processo"] == "E-07/202181/2004"
    assert velhos[1]["empreendimento"].startswith("EIA e RIMA para as Obras")
    assert velhos[1]["municipio"] is None  # nada no texto: null, não chute

    auds = [m._linha(i, None, m.URL_AUDIENCIAS)
            for i in m._itens_da_pagina(HTML_AUDIENCIAS)]
    assert auds[0]["tipo"] == "audiencia" and auds[0]["ano"] == 2025
    assert auds[0]["data_titulo"] == "2025-07-30"
    # título sem data: ano null, e o empreendimento continua legível
    assert auds[1]["ano"] is None and auds[1]["data_titulo"] is None
    assert auds[1]["empreendimento"] == "ATA - Audiência Pública - TEPOR - 2018"


def test_linha_do_drive_com_processo_fora_do_link():
    linhas = [m._linha(i, 2022, m.URL_ANO.format(ano=2022))
              for i in m._itens_da_pagina(HTML_2022)]
    drive, zip_ = linhas
    assert drive["formato"] == "gdrive" and zip_["formato"] == "zip"
    # o nº de processo mora no <strong>, fora do <a>: tem de entrar
    assert drive["numero_processo"] == "E-07/002.102285/2018"
    assert drive["municipio"] == "Miracema"  # "NO MUNICÍPIO DE MIRACEMA"
    assert drive["tipo"] == "eia_rima"
    # "ENTRE OS MUNICÍPIOS DE MACAÉ E CASIMIRO DE ABREU": dois, fica null
    assert zip_["municipio"] is None
    assert m._formato("https://drive.google.com/file/d/abc/view") == "gdrive"


def test_pagina_mista_nao_perde_item():
    # 2022 real: <p> com os estudos E um <div list-item-style-four> depois. O
    # layout decidido pela página perdia todos os <p> (medido: 0 de 4).
    html = ('<!-- internal content --><div class="col-12 col-md-8">'
            '<p><a href="https://www.inea.rj.gov.br/a.pdf">EIA - A</a></p>'
            '<div class="col-12 d-flex list-item-style-four bg-digital-gray-list">'
            '<div class="w-100"><h4><a href="https://www.inea.rj.gov.br/b.pdf">'
            'RIMA - B</a></h4><p>descrição</p></div></div>'
            '<!-- internal content -->')
    assert [i["url_documento"].rsplit("/", 1)[-1] for i in m._itens_da_pagina(html)] \
        == ["a.pdf", "b.pdf"]


def test_url_com_espaco_vira_percentual():
    # medido em 2007/2011: href com espaço cru, que o urllib recusa
    lin = m._linha({"url_documento": m._url_limpa(
        "http://www.inea.rj.gov.br/wp-content/uploads/EIA-RIMA/2007/"
        "E_07_203.110_2005 Itaipava Itaguaí.7z"),
        "titulo": "E-07-203.110-2005 Itaipava", "descricao": None},
        2007, m.URL_ANO.format(ano=2007))
    assert " " not in lin["url_documento"]
    assert lin["url_documento"].endswith(".7z")
    assert "%20" in lin["url_documento"] and "Itagua%C3%AD" in lin["url_documento"]


def test_municipio_ambiguo_fica_null():
    # dois nomes de município no texto e nenhum padrão explícito -> null
    assert m._municipio("Obra entre Niterói e Maricá", None) == (None, None)
    assert m._municipio("Obra em Maricá", None) == ("Maricá", "unico_no_texto")
    # "Rio de Janeiro" sozinho é ambíguo (é cidade e estado): não pode chutar
    assert m._municipio("Governo do Estado do Rio de Janeiro", None) == (None, None)
    assert m._municipio("no município de São João da Barra", None) == (
        "São João da Barra", "explicito")
    # nome de município que é prefixo de outro: pega o mais longo
    assert m._municipio("município de São João de Meriti", None) == (
        "São João de Meriti", "explicito")


def _pegar_falso(pedidos):
    """Finge o host: 200 até 2025, 404 de 2026 em diante."""
    def pegar(url, nome_cache):
        ano = int(url.rstrip("/").rsplit("-", 1)[-1])
        pedidos.append(ano)
        if ano >= 2026:
            return {"bruto": None, "status": 404, "cache": False}
        return {"bruto": b"<html>ok</html>", "status": 200, "cache": False}
    return pegar


def test_laco_de_anos_para_no_primeiro_404():
    pedidos = []
    paginas, parou_em, falhas = m._varrer_anos(
        [2023, 2024, 2025, 2026, 2027, 2028], _pegar_falso(pedidos))
    assert sorted(paginas) == [2023, 2024, 2025]
    assert parou_em == 2026 and falhas == []
    # 2027 e 2028 NUNCA foram pedidos
    assert pedidos == [2023, 2024, 2025, 2026]


def test_anos_da_pagina_mae_e_ancoras_ausentes():
    html = ('<a href="https://www.inea.rj.gov.br/eia-rima-2025/">2025</a>'
            '<a href="http://www.inea.rj.gov.br/eia-rima-2007/">2007</a>'
            '<a href="https://www.inea.rj.gov.br/eia-rima-2026/">2026</a>')
    assert m._anos_da_pagina_mae(html) == [2007, 2025, 2026]
    assert m._itens_da_pagina("<html>vazio</html>") == []


def _cpf_falso() -> "tuple[str, str]":
    """CPF válido por mod-11 CONSTRUÍDO aqui — nunca literal no repositório."""
    dig = "123456789"
    for ate in (9, 10):
        soma = sum(int(dig[i]) * (ate + 1 - i) for i in range(ate))
        resto = (soma * 10) % 11
        dig += str(0 if resto == 10 else resto)
    return dig, f"{dig[:3]}.{dig[3:6]}.{dig[6:9]}-{dig[9:]}"


def test_cpf_nunca_gravado():
    _, formatado = _cpf_falso()
    lin = m._linha({"url_documento": "https://www.inea.rj.gov.br/x.pdf",
                    "titulo": f"SEI-070002/006718/2025 - FULANO {formatado}",
                    "descricao": None}, 2025, m.URL_ANO.format(ano=2025))
    assert formatado not in (lin["empreendimento"] or "")
    assert "[CPF redigido]" in lin["empreendimento"]
    # CNPJ de pessoa jurídica passa intacto
    assert m._apagar_cpf_em_texto("CNPJ 12.345.678/0001-90") == "CNPJ 12.345.678/0001-90"


def test_id_estavel_e_formato():
    a = m._id_estavel("https://www.inea.rj.gov.br/x.pdf")
    assert a == m._id_estavel("https://www.inea.rj.gov.br/x.pdf")
    assert a != m._id_estavel("https://www.inea.rj.gov.br/y.pdf")
    assert m._formato("https://x/eia.ZIP") == "zip"


if __name__ == "__main__":
    for nome, fn in sorted(globals().items()):
        if nome.startswith("test_") and callable(fn):
            fn()
            print(f"  ok  {nome}")
    print("\n%d testes ok" % sum(1 for n in globals() if n.startswith("test_")))
