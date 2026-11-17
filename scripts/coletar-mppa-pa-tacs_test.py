"""Teste do parser e do checkpoint de `coletar-mppa-pa-tacs.py` (TAC do MPPA-PA).

Roda sem rede: o HTML é um recorte da tabela real (medido 17/11/2026), com as
três armadilhas da fonte — linha de 5 células, linha "SIGILOSO" sem link, data
com texto de aditamento junto e coluna "Partes" com nome de pessoa física.

  python scripts/coletar-mppa-pa-tacs_test.py
"""
import importlib.util
import json
import tempfile
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "mppa_pa_tacs",
    Path(__file__).resolve().parent / "coletar-mppa-pa-tacs.py")
m = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(m)


def _cpf_falso() -> "tuple[str, str]":
    """CPF válido por mod-11 CONSTRUÍDO aqui, nunca literal no repositório.

    CPF válido escrito à mão em código é o que o varredor do repo barra (já
    barrou um teste deste projeto). Devolve (só dígitos, formatado)."""
    dig = "123456789"
    for ate in (9, 10):
        soma = sum(int(dig[i]) * (ate + 1 - i) for i in range(ate))
        resto = (soma * 10) % 11
        dig += str(0 if resto == 10 else resto)
    return dig, f"{dig[:3]}.{dig[3:6]}.{dig[6:9]}-{dig[9:]}"


CPF_DIG, CPF_FMT = _cpf_falso()

# recorte da tabela real: 4 linhas de TAC (uma de cada armadilha) + 1 de layout
TABELA = f"""
<table border="0" cellpadding="0" cellspacing="1" width="963">
  <thead>
    <tr>
      <th scope="col"><p><strong>Procedimento</strong></p></th>
      <th scope="col"><p><strong>Data</strong></p></th>
      <th scope="col"><p><strong>&Oacute;rg&atilde;o de execu&ccedil;&atilde;o</strong></p></th>
      <th scope="col"><p><strong>Partes</strong></p></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <p>SAJ n.&ordm; 02.2026.00052968-1 (SAJ n.&ordm; 06.2026.00000447-2)</p>
        <p><a href="../../../data/files/36/F0/F3/98/802FF910B6/TAC%20SAJ.pdf">\u00cdntegra</a></p>
        <p><a href="../../../data/files/5B/F0/9C/DE/802FF910B6/Extrato.pdf">Extrato</a></p>
      </td>
      <td>16/07/2026</td>
      <td>1\u00aa Promotoria de Justi\u00e7a do Meio Ambiente, Patrim\u00f4nio Cultural,
          Habita\u00e7\u00e3o e Urbanismo de Bel\u00e9m</td>
      <td>
        <p>- Minist\u00e9rio P\u00fablico do Estado do Par\u00e1</p>
        <p>- ARMAZ\u00c9M DU CHEF LTDA (FULANO DE TAL, CPF {CPF_FMT})</p>
      </td>
    </tr>
    <tr>
      <td>
        <p>PU n.&ordm; 02.2024.00045114-5</p>
        <p>SIGILOSO</p>
      </td>
      <td>18/11/2024</td>
      <td>5\u00aa Promotoria de Justi\u00e7a C\u00edvel e de Defesa do Consumidor de Marituba</td>
      <td><p>- Minist\u00e9rio P\u00fablico do Estado do Par\u00e1</p></td>
    </tr>
    <tr>
      <td>Inqu\u00e9rito Civil n\u00ba 002/2018</td>
      <td><a href="../../../data/files/AA/BB/TAC%20IC.pdf">\u00cdntegra</a></td>
      <td>26/10/2018</td>
      <td>S\u00e3o Sebasti\u00e3o da Boa Vista</td>
      <td><p>- Minist\u00e9rio P\u00fablico do Estado do Par\u00e1</p></td>
    </tr>
    <tr>
      <td><p><a href="../../../data/files/CC/DD/TAC_Altamira.pdf">\u00cdntegra + Aditivo</a></p></td>
      <td>TAC 03/04/2017 Aditamento 16/03/2018</td>
      <td>7\u00aa Promotoria de Justi\u00e7a C\u00edvel e do Meio Ambiente de Altamira</td>
      <td><p>- Munic\u00edpio de Altamira</p></td>
    </tr>
    <tr>
      <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
    </tr>
  </tbody>
</table>
"""

HTML = "<!--" + "x" * 25_000 + "-->" + TABELA  # passa no mínimo de corpo medido


def test_parser_do_recorte():
    linhas, ignoradas = m.ler_pagina(HTML, 2026)
    assert len(linhas) == 4, [l["numero"] for l in linhas]
    assert ignoradas == 1  # linha de layout sem data não é TAC
    bel, sig, ic, adi = linhas

    assert bel["numero"].startswith("SAJ n.º 02.2026.00052968-1")
    assert bel["data"] == "16/07/2026" and bel["ano"] == 2026
    assert bel["ambiental"] == 1 and bel["sigiloso"] == 0 and bel["aditivo"] == 0
    assert bel["url_integra"] == (
        "https://www2.mppa.mp.br/data/files/36/F0/F3/98/802FF910B6/TAC%20SAJ.pdf")
    assert bel["url_extrato"].endswith("/Extrato.pdf")

    # "SIGILOSO" é marcado e sai do número; linha sem link continua sendo TAC
    assert sig["sigiloso"] == 1 and sig["numero"] == "PU n.º 02.2024.00045114-5"
    assert sig["url_integra"] is None and sig["url_extrato"] is None

    # linha de 5 células: o link tem célula própria
    assert ic["numero"] == "Inquérito Civil nº 002/2018"
    assert ic["data"] == "26/10/2018" and ic["orgao"] == "São Sebastião da Boa Vista"
    assert ic["url_integra"].endswith("/TAC%20IC.pdf")

    # data com texto de aditamento junto: primeira data é a do TAC
    assert adi["data"] == "03/04/2017" and adi["aditivo"] == 1
    assert adi["orgao"].startswith("7ª Promotoria")


def test_partes_nunca_entra_na_saida():
    """A coluna "Partes" traz nome de pessoa física: não é lida nem por acidente."""
    linhas, _ = m.ler_pagina(HTML, 2026)
    bruto = json.dumps(linhas, ensure_ascii=False)
    assert "FULANO" not in bruto and "ARMAZÉM DU CHEF" not in bruto
    assert CPF_DIG not in bruto and CPF_FMT not in bruto
    assert all(l["doc_redigido"] is None for l in linhas)


def test_protocolo_de_13_digitos_nao_vira_cpf():
    """Regression: cortar run de 12–13 dígitos destruía o número do procedimento."""
    assert m._apagar_cpf_em_texto("SIMP n.º 004837-040/2018") == "SIMP n.º 004837-040/2018"
    assert m._sanitizar("SIMP nº 004837-040/2018") == ("SIMP nº 004837-040/2018", False)
    url = "https://x/data/files/protocolo%20n%200048370402018.pdf"
    assert m._sanitizar_url(url) == (url, False)


def test_cpf_em_campo_de_texto_vira_nulo():
    """Run de 11 dígitos válido (solto) vira None e marca doc_redigido."""
    assert m._sanitizar(CPF_DIG) == (None, True)
    assert m._sanitizar(f"CPF {CPF_FMT}") == ("CPF [CPF redigido]", True)
    assert m._sanitizar_url(f"https://x/{CPF_DIG}.pdf") == (None, True)
    # número de 11 dígitos que NÃO passa no mod-11 fica intacto
    assert m._sanitizar("00000000000") == ("00000000000", False)


def test_cpf_no_orgao_marca_a_linha():
    html = TABELA.replace("5\u00aa Promotoria de Justi\u00e7a C\u00edvel e de Defesa "
                          "do Consumidor de Marituba", f"Promotoria {CPF_DIG}")
    linhas, _ = m.ler_pagina(html, 2024)
    sig = linhas[1]
    assert sig["orgao"] == "Promotoria [CPF redigido]" and sig["doc_redigido"] == 1


def test_corpo_pequeno_nao_e_pagina_de_tac():
    """HTTP 200 com 788 B é a página de erro do Lumis, não o acervo."""
    try:
        m._validar_pagina(b"<html><body>erro</body></html>", 2019)
    except RuntimeError:
        return
    raise AssertionError("corpo de 34 B deveria falhar na validação")


def test_pagina_em_cache_nao_se_baixa():
    """Checkpoint: página já baixada não volta à fonte (nem para conferir)."""
    cache_original, http_original = m.CACHE, m._http

    def _explode(url, timeout=120):
        raise AssertionError(f"não devia requisitar {url}: já está no cache")

    with tempfile.TemporaryDirectory() as d:
        m.CACHE, m._http = Path(d), _explode
        try:
            (Path(d) / "tacs-2013.htm").write_text(HTML, encoding="utf-8")
            texto, origem = m._obter_pagina(2013)
        finally:
            m.CACHE, m._http = cache_original, http_original
    assert origem == "cache" and "Procedimento" in texto


def test_cache_truncado_volta_para_a_fonte():
    """Arquivo abaixo do mínimo medido não vale como checkpoint: baixa de novo."""
    cache_original, http_original = m.CACHE, m._http
    chamadas = []

    def _baixa(url, timeout=120):
        chamadas.append(url)
        return HTML.encode("utf-8")

    with tempfile.TemporaryDirectory() as d:
        m.CACHE, m._http = Path(d), _baixa
        try:
            (Path(d) / "tacs-2020.htm").write_text("erro 500", encoding="utf-8")
            texto, origem = m._obter_pagina(2020)
            tamanho = (Path(d) / "tacs-2020.htm").stat().st_size
        finally:
            m.CACHE, m._http = cache_original, http_original
    assert origem == "fonte" and chamadas and tamanho >= m.MIN_CORPO
    assert "Procedimento" in texto


if __name__ == "__main__":
    for nome, fn in sorted(globals().items()):
        if nome.startswith("test_") and callable(fn):
            fn()
            print(f"  ok  {nome}")
    print("\n%d testes ok" % sum(1 for n in globals() if n.startswith("test_")))
