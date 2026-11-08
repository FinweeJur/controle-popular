"""etl.camaras.sigpub_test — regressão do parser do SIGPub (sem rede).

O que este arquivo prende é a leitura dos DOIS layouts da busca, com
fixtures HTML sanitizadas e inventadas (nenhum nome, CPF ou ato real):

- novo (novembro/2026): formulário `busca_avancada[entidade]`, cartões
  `ul.lista-materias > li.materia-card`, datas dd/mm/aaaa;
- antigo: formulário com `_token`, tabela `#datatable`, datas dd-mm-aaaa;
- página vazia: formulário sem lista de resultado — mês vazio legítimo;
- HTML inesperado: sem formulário nem resultado — bloqueio, não "0 matérias".

A validação do mecanismo ao vivo continua sendo o `--sondar`, como em
`sigpub.py`; aqui só entra transformação de dados. Roda de dois jeitos:

    python -m pytest etl/camaras/sigpub_test.py
    python -m unittest etl.camaras.sigpub_test

Os ids, hashes, entidades e títulos abaixo são fictícios de propósito.
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from etl.camaras.sigpub import (  # noqa: E402
    BloqueioSigpub,
    _conferir_pagina_inicial,
    _data_iso,
    _detectar_layout,
    _extrair_linhas,
    _extrair_total_declarado,
    _montar_linha,
)

BASE = "https://www.diariomunicipal.com.br/amm-mg/"

FIXTURE_NOVO = """<!doctype html>
<html><body>
<form>
  <select name="busca_avancada[entidade]"><option value="123">Prefeitura de Cidade Teste</option></select>
  <input name="busca_avancada[dataInicio]" value="2026-10-01">
  <input name="busca_avancada[dataFim]" value="2026-10-31">
  <input name="busca_avancada[pagina]" value="1">
</form>
<p class="busca-avancada__resumo">
  Mostrando <strong>1</strong> a <strong>2</strong> de <strong>2</strong> matérias.
</p>
<ul class="lista-materias">
  <li class="materia-card">
    <h2 class="materia-card__titulo">
      <a href="/amm-mg/materia/AAA11111" target="_blank" rel="noopener">PORTARIA Nº 10, DE 01 DE OUTUBRO DE 2026.</a>
    </h2>
    <p class="materia-card__origem">
      <span class="materia-card__entidade">Prefeitura de Cidade Teste</span>
      <span class="materia-card__separador">·</span>
      <span class="materia-card__orgao">Gabinete do Prefeito</span>
    </p>
    <dl class="materia-card__dados">
      <div><dt>Circulação</dt><dd>01/10/2026</dd></div>
      <div><dt>Edição</dt><dd>100</dd></div>
      <div><dt>Código identificador</dt><dd><code>AAA11111</code></dd></div>
    </dl>
  </li>
  <li class="materia-card">
    <h2 class="materia-card__titulo">
      <a href="/amm-mg/materia/BBB22222" target="_blank" rel="noopener">DECRETO Nº 2, DE 02 DE OUTUBRO DE 2026.</a>
    </h2>
    <p class="materia-card__origem">
      <span class="materia-card__entidade">Prefeitura de Cidade Teste</span>
      <span class="materia-card__separador">·</span>
      <span class="materia-card__orgao">Secretaria de Administração</span>
    </p>
    <dl class="materia-card__dados">
      <div><dt>Circulação</dt><dd>02/10/2026</dd></div>
      <div><dt>Edição</dt><dd>101a</dd></div>
      <div><dt>Código identificador</dt><dd><code>BBB22222</code></dd></div>
    </dl>
  </li>
</ul>
</body></html>
"""

FIXTURE_ANTIGO = """<!doctype html>
<html><body>
<form>
  <input type="hidden" name="busca_avancada[_token]" value="token-ficticio">
  <input name="busca_avancada[dataInicio]" value="01/10/2026">
</form>
<table id="datatable"><tbody>
  <tr>
    <td>Prefeitura de Cidade Teste</td>
    <td>LEI Nº 3, DE 03 DE OUTUBRO DE 2026.</td>
    <td>Gabinete do Prefeito</td>
    <td>03-10-2026</td>
    <td><a href="/amm-mg/load/CCC33333">Abrir</a></td>
  </tr>
</tbody></table>
<p>Mostrando de 1 até 1 de 1 registros</p>
</body></html>
"""

FIXTURE_VAZIO = """<!doctype html>
<html><body>
<form>
  <select name="busca_avancada[entidade]"><option value="123">Prefeitura de Cidade Teste</option></select>
  <input name="busca_avancada[dataInicio]" value="2027-01-01">
  <input name="busca_avancada[dataFim]" value="2027-01-31">
</form>
<p>Nenhuma matéria encontrada para o período.</p>
</body></html>
"""

FIXTURE_INESPERADO = "<html><body><h1>403</h1><p>Acesso negado.</p></body></html>"


class DetectarLayoutTest(unittest.TestCase):
    def test_layout_novo(self):
        self.assertEqual(_detectar_layout(FIXTURE_NOVO), "novo")

    def test_layout_antigo(self):
        self.assertEqual(_detectar_layout(FIXTURE_ANTIGO), "antigo")

    def test_layout_desconhecido(self):
        self.assertIsNone(_detectar_layout(FIXTURE_INESPERADO))


class ExtrairLinhasTest(unittest.TestCase):
    def test_layout_novo_extrai_campos_publicos(self):
        linhas = _extrair_linhas(FIXTURE_NOVO)
        self.assertEqual(len(linhas), 2)
        primeira = linhas[0]
        self.assertEqual(primeira["hash"], "AAA11111")
        self.assertEqual(primeira["titulo"], "PORTARIA Nº 10, DE 01 DE OUTUBRO DE 2026.")
        self.assertEqual(primeira["entidade"], "Prefeitura de Cidade Teste")
        self.assertEqual(primeira["orgao"], "Gabinete do Prefeito")
        self.assertEqual(primeira["data_circulacao"], "01/10/2026")
        self.assertEqual(primeira["link"], "/amm-mg/materia/AAA11111")

    def test_layout_antigo_mantem_o_formato_da_tabela(self):
        linhas = _extrair_linhas(FIXTURE_ANTIGO)
        self.assertEqual(len(linhas), 1)
        linha = linhas[0]
        self.assertEqual(linha["hash"], "CCC33333")
        self.assertEqual(linha["titulo"], "LEI Nº 3, DE 03 DE OUTUBRO DE 2026.")
        self.assertEqual(linha["data_circulacao"], "03-10-2026")
        self.assertNotIn("link", linha)

    def test_pagina_vazia_nao_inventa_linha(self):
        self.assertEqual(_extrair_linhas(FIXTURE_VAZIO), [])

    def test_html_inesperado_nao_vira_zero_materia(self):
        self.assertEqual(_extrair_linhas(FIXTURE_INESPERADO), [])
        with self.assertRaises(BloqueioSigpub):
            _conferir_pagina_inicial(FIXTURE_INESPERADO, "Cidade Teste", 2026, 10)

    def test_pagina_vazia_legitima_nao_levanta(self):
        _conferir_pagina_inicial(FIXTURE_VAZIO, "Cidade Teste", 2027, 1)


class TotalEDataTest(unittest.TestCase):
    def test_total_no_layout_novo(self):
        self.assertEqual(_extrair_total_declarado(FIXTURE_NOVO), 2)

    def test_total_no_layout_antigo(self):
        self.assertEqual(_extrair_total_declarado(FIXTURE_ANTIGO), 1)

    def test_data_iso_aceita_barra_e_hifen(self):
        self.assertEqual(_data_iso("01/10/2026"), "2026-10-01")
        self.assertEqual(_data_iso("01-10-2026"), "2026-10-01")
        self.assertIsNone(_data_iso(""))


class MontarLinhaTest(unittest.TestCase):
    def test_layout_novo_usa_materia_e_chave_sigpub(self):
        linha_busca = _extrair_linhas(FIXTURE_NOVO)[0]
        linha = _montar_linha("3100000", BASE, linha_busca, None)
        self.assertEqual(linha["id_municipio"], "3100000")
        self.assertEqual(linha["data_publicacao"], "2026-10-01")
        self.assertEqual(linha["tipo"], "portaria")
        self.assertEqual(linha["numero_ato"], "10")
        self.assertEqual(linha["link_fonte"], BASE + "materia/AAA11111")
        self.assertEqual(linha["chave_natural"], "sigpub:AAA11111")
        self.assertIsNone(linha["texto"])
        self.assertNotIn("cpf", str(linha).lower())

    def test_layout_antigo_continua_em_load(self):
        linha_busca = _extrair_linhas(FIXTURE_ANTIGO)[0]
        linha = _montar_linha("3100000", BASE, linha_busca, None)
        self.assertEqual(linha["data_publicacao"], "2026-10-03")
        self.assertEqual(linha["link_fonte"], BASE + "load/CCC33333")
        self.assertEqual(linha["chave_natural"], "sigpub:CCC33333")


if __name__ == "__main__":
    unittest.main()
