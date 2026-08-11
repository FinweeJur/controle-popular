"""etl.analise_vicio — vício legislativo / indício de inconstitucionalidade
no eixo Cidades.

    python -m etl.analise_vicio --id-municipio 3106705 --amostra 3 --tipo-objeto proposicao

MESMO DESENHO DE `etl.analise_garantista`, e pelos mesmos motivos (ver o
docstring dele antes de mexer aqui): a régua canônica mora em
`apps/web/lib/congresso/rubrica/vicio_legislativo.json` e o módulo Python
que a lê/valida é `etl/congresso/etl/rubrica_vicio.py`. Carregado por
CAMINHO DE ARQUIVO, sob apelido próprio, porque `etl/congresso` e
`etl/betim` são dois pacotes homônimos `etl` — um `sys.path.append` faria
os dois brigarem pelo mesmo nome em `sys.modules`.

O que este módulo acrescenta: o cabeçalho municipal do prompt (câmara
municipal, não Congresso) e a normalização dos DOIS objetos analisáveis
(ato já sancionado × projeto em tramitação) — mesma dualidade de
`analise_garantista`.
"""
import argparse
import importlib.util
import sys
from pathlib import Path

from etl.common import carregar_municipio, get_supabase_client

RAIZ_REPO = Path(__file__).resolve().parents[3]
DIR_CONGRESSO = RAIZ_REPO / "etl" / "congresso" / "etl"


def _carregar_do_congresso(nome: str):
    caminho = DIR_CONGRESSO / f"{nome}.py"
    if not caminho.exists():
        raise RuntimeError(
            f"{caminho} não existe. O eixo Cidades depende da régua de vício do "
            f"eixo Congresso e não tem cópia dela de propósito."
        )
    apelido = f"_congresso_{nome}"
    if apelido in sys.modules:
        return sys.modules[apelido]
    spec = importlib.util.spec_from_file_location(apelido, caminho)
    modulo = importlib.util.module_from_spec(spec)
    sys.modules[apelido] = modulo
    spec.loader.exec_module(modulo)
    return modulo


rubrica_vicio = _carregar_do_congresso("rubrica_vicio")

validar_itens = rubrica_vicio.validar_itens
calcular = rubrica_vicio.calcular
CATEGORIAS = rubrica_vicio.CATEGORIAS
VERSAO_RUBRICA_VICIO: str = rubrica_vicio.VERSAO_RUBRICA_VICIO

# O prompt municipal tem cabeçalho próprio (adendo abaixo), então a versão
# precisa dizer as duas coisas — mesma razão de `analise_garantista.VERSAO_PROMPT`.
VERSAO_PROMPT_VICIO: str = f"{rubrica_vicio.VERSAO_PROMPT_VICIO}+cidades.1.0.0"


ADENDO_MUNICIPAL = """

ADENDO MUNICIPAL — o objeto analisado é norma/projeto de CÂMARA MUNICIPAL,
não do Congresso Nacional.

10. O campo AUTOR/PROPONENTE, quando trouxer "Executivo Municipal",
"Prefeito", nome de prefeito, ou "Mesa Diretora"/"Mesa da Câmara", indica
que a proposição JÁ NASCEU no órgão certo — NÃO há vício de iniciativa
nesses casos, mesmo que o conteúdo seja sobre cargo, estrutura
administrativa ou remuneração de servidor. Vício de iniciativa só existe
quando quem propõe é um vereador individual (ou grupo de vereadores)
tratando de matéria reservada ao Prefeito.
11. "Indicação" e "requerimento" são pedidos NÃO VINCULANTES ao Executivo —
mesmo pedindo algo que só o Executivo poderia fazer (criar secretaria,
cargo, sinalização), a FORMA em si não usurpa iniciativa nenhuma porque não
obriga nada. Regra 4 do texto acima ("verifique quem apresentou") vale
igual, mas para indicação/requerimento a resposta default é
`indicios: []`, a menos que o teor extrapole claramente um pedido (raro).
12. Câmara Municipal organizando SUA PRÓPRIA estrutura interna (cargos e
carreira dos servidores da própria Câmara, não do Executivo) não é vício de
iniciativa perante o Executivo — é a Legislatura geridando a si mesma.
Pode, em tese, esbarrar em reserva de iniciativa interna à Mesa Diretora
(regimental), mas isso não é matéria desta régua (que trata de
iniciativa ENTRE Poderes) — não classifique como `vicio_iniciativa` só por
isso.
13. Vício de COMPETÊNCIA é o mais comum neste eixo: Art. 30, I CF só
autoriza o município a legislar sobre "interesse local". Trânsito é
matéria da União (Art. 22, XI CF) EXCETO a gestão local do sistema viário
(sinalização, fiscalização de vias municipais), que o próprio Código de
Trânsito Brasileiro delega ao órgão municipal de trânsito — isso é
competência municipal legítima, não vício. Regular armamento/instrumento
usado por agente público (matéria de "material bélico", Art. 22, XXI CF)
já é mais discutível.
14. Câmara Municipal exigindo aprovação prévia sua para ATO DE GESTÃO
ROTINEIRO do Executivo (ex.: qualquer alteração de sinalização viária,
prazo operacional de empresa municipal) é indício de violação à separação
de poderes (Art. 2º CF) — categoria `inconstitucionalidade_material`."""

SYSTEM = rubrica_vicio.SYSTEM + ADENDO_MUNICIPAL


def montar_prompt(obj: dict) -> str:
    cats = rubrica_vicio._categorias_do_eixo("municipal")
    bloco_categorias = "\n".join(
        f"  - {slug}: {c['rotulo']} — {c['descricao']}\n"
        f"    âncoras: {'; '.join(c['ancoras'].get('municipal', []))}"
        for slug, c in cats.items()
    )

    if obj.get("tipo_objeto") == "ato":
        cabecalho = "LEI/ATO MUNICIPAL"
        situacao = f"NORMA JÁ SANCIONADA E EM VIGOR (publicada em {obj.get('data') or 'data não informada'})"
    else:
        cabecalho = "PROJETO MUNICIPAL"
        situacao = (
            f"PROJETO EM TRAMITAÇÃO — situação: {obj.get('situacao') or 'não informada'} "
            f"(apresentado em {obj.get('data') or 'data não informada'})"
        )

    return f"""{cabecalho}: {obj.get('identificacao')}
MUNICÍPIO: {obj.get('municipio_nome')}/{obj.get('uf')} (IBGE {obj.get('id_municipio')})
TIPO DE INSTRUMENTO NORMATIVO: {obj.get('tipo_instrumento')}
AUTOR/PROPONENTE: {obj.get('autor')}
SITUAÇÃO: {situacao}
EMENTA: {obj.get('ementa')}

CATEGORIAS DE VÍCIO APLICÁVEIS AO EIXO MUNICIPAL (use exatamente estes slugs):
{bloco_categorias}

Devolva JSON exatamente neste formato:
{{
  "indicios": [
    {{
      "categoria": "<slug da lista>",
      "dispositivo": "<artigo concreto, ex.: 'CF/88, art. 30, I'>",
      "justificativa": "<1-2 frases, hedged: 'há indício de...' nunca 'é inconstitucional'>",
      "trecho": "<citação literal da ementa>",
      "confianca": <0.0 a 1.0>
    }}
  ],
  "resumo": "<1-3 frases pro cidadão leigo, sempre deixando claro que é indício de IA, não decisão judicial>"
}}"""


_ROTULO_TIPO = {
    "projeto_lei": "Projeto de Lei",
    "projeto_lei_complementar": "Projeto de Lei Complementar",
    "projeto_resolucao": "Projeto de Resolução (organização interna da Câmara)",
    "projeto_decreto_legislativo": "Projeto de Decreto Legislativo",
    "emenda_lei_organica": "Emenda à Lei Orgânica",
    "proposta_emenda_lei_organica": "Proposta de Emenda à Lei Orgânica",
    "indicacao": "Indicação (pedido não vinculante ao Executivo)",
    "requerimento": "Requerimento (pedido não vinculante)",
    "mocao": "Moção",
}


def _autor(registro: dict) -> str:
    autores = registro.get("autores") or []
    if not autores:
        return "não identificado no banco"
    return "; ".join(autores)


def normalizar_ato(registro: dict, municipio: dict) -> dict:
    numero = registro.get("numero") or "s/n"
    ano = registro.get("ano") or "?"
    return {
        "id": registro["id"],
        "tipo_objeto": "ato",
        "id_municipio": registro["id_municipio"],
        "municipio_nome": municipio.get("nome"),
        "uf": municipio.get("uf"),
        "identificacao": f"{registro.get('tipo') or 'Ato'} nº {numero}/{ano}",
        "tipo_instrumento": registro.get("tipo") or "não informado",
        "autor": "não disponível (norma já sancionada — o coletor de atos não registra autor)",
        "ementa": registro.get("ementa"),
        "situacao": None,
        "data": registro.get("data_publicacao").isoformat() if hasattr(registro.get("data_publicacao"), "isoformat") else registro.get("data_publicacao"),
    }


def normalizar_proposicao(registro: dict, municipio: dict) -> dict:
    tipo = registro.get("tipo") or ""
    numero = registro.get("numero") or "s/n"
    ano = registro.get("ano") or "?"
    rotulo = _ROTULO_TIPO.get(tipo, tipo.replace("_", " ").title() or "Proposição")
    data = registro.get("data_apresentacao")
    return {
        "id": registro["id"],
        "tipo_objeto": "proposicao",
        "id_municipio": registro["id_municipio"],
        "municipio_nome": municipio.get("nome"),
        "uf": municipio.get("uf"),
        "identificacao": f"{rotulo} nº {numero}/{ano}",
        "tipo_instrumento": rotulo,
        "autor": _autor(registro),
        "ementa": registro.get("ementa"),
        "situacao": registro.get("situacao"),
        "data": data.isoformat() if hasattr(data, "isoformat") else data,
    }


CAMPOS_ATO = "id, id_municipio, tipo, numero, ano, ementa, data_publicacao"
CAMPOS_PROPOSICAO = "id, id_municipio, tipo, numero, ano, ementa, situacao, data_apresentacao, autores"


def _amostra(id_municipio: str, quantos: int, tipo_objeto: str) -> None:
    sb = get_supabase_client()
    municipio = carregar_municipio(id_municipio)
    tabela, campos, normaliza = (
        ("atos_oficiais", CAMPOS_ATO, normalizar_ato)
        if tipo_objeto == "ato"
        else ("proposicoes", CAMPOS_PROPOSICAO, normalizar_proposicao)
    )
    linhas = (
        sb.table(tabela).select(campos).eq("id_municipio", id_municipio).limit(quantos).execute().data
    )
    for linha in linhas:
        print("=" * 70)
        print(montar_prompt(normaliza(linha, municipio)))


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--id-municipio", required=True)
    ap.add_argument("--amostra", type=int, default=1)
    ap.add_argument("--tipo-objeto", choices=["ato", "proposicao"], default="proposicao")
    a = ap.parse_args()
    print(f"[analise_vicio] rubrica de vício {VERSAO_RUBRICA_VICIO} · prompt {VERSAO_PROMPT_VICIO}")
    _amostra(a.id_municipio, a.amostra, a.tipo_objeto)
