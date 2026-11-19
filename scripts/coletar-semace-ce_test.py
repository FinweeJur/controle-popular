"""Teste do coletor SEMACE-CE — roda sem rede e sem pytest.

Protege três coisas que custaram tempo em outros coletores:

1. **Corpo vazio não é sucesso.** HTTP 200 com 0 B já foi tratado como coleta
   boa e publicou arquivo vazio; aqui `_post` levanta.
2. **Checkpoint não rebaixa lote.** Lote já gravado no cache não vira
   requisição de novo, e lote que falhou não derruba a rodada — fica pendente
   e o JSON final marca `truncado: true`.
3. **CPF não sai do coletor.** Run de 11 dígitos válido por mod-11 vira
   `None` + `doc_redigido: 1`; CNPJ de 14 dígitos é mantido.

O CPF usado no teste é **calculado** a partir de 9 dígitos (nenhum CPF
literal no arquivo — o hook de pré-push barra).

    python scripts/coletar-semace-ce_test.py
    (ou) python -m pytest scripts/coletar-semace-ce_test.py -q
"""
import importlib.util
import json
import shutil
import sys
import tempfile
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "semace", Path(__file__).resolve().parent / "coletar-semace-ce.py")
m = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(m)


def _cpf_de(base9: str) -> str:
    """Fecha os 2 dígitos verificadores (mod-11) — CPF válido sem literal."""
    def dv(parcial: str) -> int:
        soma = sum(int(d) * (len(parcial) + 1 - i) for i, d in enumerate(parcial))
        return (soma * 10) % 11 % 10
    return base9 + str(dv(base9)) + str(dv(base9 + str(dv(base9))))


def test_cpf_calculado_e_valido_pelo_mod11():
    cpf = _cpf_de("123456789")
    assert len(cpf) == 11
    assert m._cpf_valido(cpf), cpf


def test_doc_mantem_cnpj_e_apaga_cpf():
    cnpj = "11222333000181"
    assert m._doc(cnpj) == (cnpj, 0)
    assert m._doc("11.222.333/0001-81") == (cnpj, 0)
    # CPF válido: nada gravado, flag ligada
    assert m._doc(_cpf_de("123456789")) == (None, 1)
    # lixo/vazio não liga a flag
    assert m._doc("") == (None, 0)
    assert m._doc(None) == (None, 0)


def test_linha_de_processo_nao_leva_nome_nem_cpf():
    cpf = _cpf_de("123456789")
    linha = m._linha_processo({
        "processoId": "0000547662", "spuId": "08399125/2023",
        "tipoProcesso": "Licença Ambiental por Adesão e Compromisso",
        "siglaTipo": "LAC", "cidade": "Abaiara", "atividade": "Bovinocultura",
        "empreendimentoAtividade": "Criação de animais sem abate",
        "dataCadastro": "2023-10-16T00:00:00", "dataEmissao": "2023-11-20",
        "dataValidade": "2026-11-20", "situacao": "Licença Emitida",
        "zona": 1, "area": 12.5, "digital": True, "licencaId": "19449/2023",
        "cpfCnpj": cpf, "interessado": "Fulano de Tal",
    })
    assert len(linha) == len(m.COLUNAS["processos"])
    assert linha[0] == "0000547662"
    assert linha[7] == "2023-10-16"          # data vira ISO curta
    assert linha[15] is None                 # cpfCnpj → nenhum documento
    assert linha[16] == 1                    # doc_redigido
    assert "Fulano" not in json.dumps(linha)


def test_texto_livre_perde_cpf():
    cpf = _cpf_de("987654321")
    assert cpf not in (m._sem_cpf(f"auto lavrado contra {cpf} no local") or "")
    # CNPJ de 14 dígitos não é apagado do texto
    assert "11222333000181" in (m._sem_cpf("empresa 11222333000181") or "")


def test_registros_acha_a_lista_e_corpo_vazio_falha():
    assert m._registros({"totalRegistro": 2, "processos": [{"a": 1}]}) == [{"a": 1}]
    assert m._registros({"totalRegistro": 0, "processos": []}) == []
    # `_post` valida o corpo: vazio e não-JSON viram erro
    for corpo in (b"", b"<html>504</html>"):
        try:
            m._post_dados(corpo)
        except ValueError:
            continue
        raise AssertionError(f"corpo {corpo!r} passou como sucesso")


class _FonteFalsa:
    """Finge a API: total fixo e páginas de 2 registros, com falha opcional."""

    def __init__(self, total=5, falhar=()):
        self.total = total
        self.falhar = set(falhar)
        self.chamadas = []

    def __call__(self, caminho, corpo):
        self.chamadas.append(corpo["pagina"])
        if corpo["pagina"] in self.falhar:
            raise m.urllib.error.HTTPError(caminho, 504, "Gateway Time-out", {}, None)
        ini = corpo["pagina"] * corpo["limit"]
        quantos = max(0, min(corpo["limit"], self.total - ini))
        return {"totalRegistro": self.total,
                "processos": [{"processoId": f"P{ini + i}", "cidade": "Abaiara"}
                              for i in range(quantos)]}


def _com_cache(funcao):
    """Roda a função com CACHE, SAIDA, LOTE e PAUSA de teste (sem tocar o repo)."""
    tmp = Path(tempfile.mkdtemp(prefix="semace-test-"))
    antigo = (m.CACHE, m.LOTE, m.PAUSA, m._post, m.SAIDA, m.COMPLETO, sys.argv[:],
              m.ROTAS["autos"].get("lote"))
    try:
        m.CACHE, m.LOTE, m.PAUSA = tmp, 2, 0
        m.COMPLETO = tmp / "completo.json"
        m.ROTAS["autos"]["lote"] = 2     # o lote próprio dos autos não vaza do teste
        return funcao(tmp)
    finally:
        (m.CACHE, m.LOTE, m.PAUSA, m._post, m.SAIDA, m.COMPLETO, argv,
         lote_auto) = antigo
        m.ROTAS["autos"]["lote"] = lote_auto
        sys.argv[:] = argv
        shutil.rmtree(tmp, ignore_errors=True)


def test_checkpoint_nao_rebaixa_lote_e_nao_aborta_na_falha():
    def corpo(_tmp):
        fonte = _FonteFalsa(total=5, falhar={1})
        m._post = fonte
        ckpt = m._ler_ckpt()

        est = m._coletar("processos", ckpt, limite=None, refetch=False)
        assert fonte.chamadas == [0, 1, 2, 3], fonte.chamadas   # 3 = página vazia
        assert est["lotes_ok"] == {0, 2}, est["lotes_ok"]
        assert len(est["pendentes"]) == 1, est["pendentes"]     # lote 1 falhou
        assert m._arq_lote("processos", 1).exists() is False

        # 1ª rodada: 3 de 5 coletados e truncado, porque o lote 1 faltou
        linhas, nums = m._montar("processos", est, None)
        assert len(linhas) == 3, len(linhas)
        assert nums["truncado"] is True
        assert nums["lotes_pendentes"] == 1

        # 2ª rodada: a fonte volta. Lote 0 e 2 NÃO são rebaixados.
        fonte.falhar = set()
        fonte.chamadas = []
        ckpt2 = m._ler_ckpt()
        est2 = m._coletar("processos", ckpt2, limite=None, refetch=False)
        assert fonte.chamadas == [1], fonte.chamadas   # 0 e 2 vieram do cache
        linhas2, nums2 = m._montar("processos", est2, None)
        assert len(linhas2) == 5, len(linhas2)
        assert nums2["truncado"] is False, nums2
        assert nums2["lotes_pendentes"] == 0

        # 3ª rodada: cache completo, ZERO requisição de lote (o fim já foi medido)
        fonte.chamadas = []
        ckpt3 = m._ler_ckpt()
        m._coletar("processos", ckpt3, limite=None, refetch=False)
        assert fonte.chamadas == [], fonte.chamadas

    _com_cache(corpo)


def test_montar_acusa_duplicata_e_total_divergente():
    def corpo(_tmp):
        m._post = _FonteFalsa(total=5)
        ckpt = m._ler_ckpt()
        est = m._coletar("processos", ckpt, limite=None, refetch=False)
        # página 1 repete o que a página 0 já deu (ordenação instável da fonte)
        m._gravar_lote("processos", 1, [["P0", None], ["P1", None]])
        linhas, nums = m._montar("processos", est, None)
        assert nums["duplicados_removidos"] == 2, nums
        assert nums["truncado"] is True, nums   # 3 distintos ≠ 5 da fonte

    _com_cache(corpo)


def test_limite_corta_e_marca_truncado():
    def corpo(_tmp):
        m._post = _FonteFalsa(total=5)
        est = m._coletar("processos", m._ler_ckpt(), limite=2, refetch=False)
        linhas, nums = m._montar("processos", est, 2)
        assert len(linhas) == 2
        assert nums["truncado"] is True

    _com_cache(corpo)


def test_main_escreve_json_honesto_e_resumos_batem():
    def corpo(tmp):
        m._post = _FonteFalsa(total=5)
        m.SAIDA = tmp / "semace-ce.json"
        m.COMPLETO = tmp / "cache" / "completo.json"
        sys.argv = ["coletar-semace-ce.py"]
        m.main()
        d = json.loads(m.SAIDA.read_text(encoding="utf-8"))
        for chave in ("gerado_em", "fonte", "url_fonte", "truncado",
                      "linhas_completas_em", "processos", "autos",
                      "obs", "ressalva_editorial"):
            assert chave in d, chave
        p = d["processos"]
        # o publicável não carrega o acervo: carrega totais, resumos e amostra
        assert "linhas" not in p, "acervo inteiro não vai para o arquivo publicável"
        assert p["total_coletado"] == p["total_fonte"] == 5
        assert len(p["amostra"]["linhas"]) == 5
        assert sum(p["resumo_por_municipio"].values()) == p["total_coletado"]
        assert sum(p["resumo_por_situacao"].values()) == p["total_coletado"]
        assert sum(p["resumo_por_ano"].values()) == p["total_coletado"]
        a = d["autos"]
        assert sum(a["resumo_por_tipo"].values()) == a["total_coletado"]
        assert sum(a["resumo_por_julgamento"].values()) == a["total_coletado"]
        assert d["truncado"] is False and p["lotes_pendentes"] == 0
        # o completo fica no cache, inteiro
        completo = json.loads(m.COMPLETO.read_text(encoding="utf-8"))
        assert len(completo["processos"]["linhas"]) == 5
        assert completo["autos"]["linhas"]

    _com_cache(corpo)


def test_resumo_monta_do_cache_sem_tocar_a_rede():
    def corpo(tmp):
        m._post = _FonteFalsa(total=5)
        m.SAIDA = tmp / "semace-ce.json"
        sys.argv = ["coletar-semace-ce.py"]
        m.main()

        def rede_proibida(*a, **k):
            raise AssertionError("--resumo chamou a rede")

        m._post = rede_proibida
        m.SAIDA.unlink()
        sys.argv = ["coletar-semace-ce.py", "--resumo"]
        m.main()
        d = json.loads(m.SAIDA.read_text(encoding="utf-8"))
        assert d["processos"]["total_coletado"] == 5
        assert len(d["processos"]["amostra"]["linhas"]) == 5
        assert sum(d["processos"]["resumo_por_municipio"].values()) == 5

    _com_cache(corpo)


if __name__ == "__main__":
    for nome, funcao in list(globals().items()):
        if nome.startswith("test_") and callable(funcao):
            funcao()
            print(f"ok {nome}")
    print("todos os testes passaram")
