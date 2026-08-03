"""etl.psp.crimes — criminalidade de São Paulo (SSP-SP) em `seguranca_ocorrencias`.

    python -m etl.psp.crimes --id-municipio 3550308
    python -m etl.psp.crimes --id-municipio 3550308 --desde 2017

Fecha a lacuna do eixo Cidades: Minas já tinha criminalidade pela Sejusp
(`etl/apis/crimes_mg.py`, portal CKAN estadual) e São Paulo não tinha
equivalente, porque **a SSP-SP não tem portal de dados abertos nem CSV
documentado**. O que existe, e é o que este módulo usa, é o back-end do SPA
Angular de `https://www.ssp.sp.gov.br/estatistica/dados-mensais`: uma API
REST JSON pública, mesma origem, sem chave e sem cabeçalho especial.

COMO AS ROTAS FORAM DESCOBERTAS (2026-08-03, refaça assim se quebrar). O
bundle `main.<hash>.js` do site tem os caminhos literais; o interceptor
HTTP resolve `apiUrl = "/"`, ou seja, os caminhos relativos `v1/...` do
código são absolutos contra a própria origem. Testadas ao vivo:

    GET https://www.ssp.sp.gov.br/v1/Municipios/RecuperaMunicipios
    GET https://www.ssp.sp.gov.br/v1/OcorrenciasAnuais/recuperaDadosMunicipio?idMunicipio=565
    GET https://www.ssp.sp.gov.br/v1/TaxaDelito/RecuperaDadosMunicipio?idMunicipio=565
    GET https://www.ssp.sp.gov.br/v1/OcorrenciasMensais/RecuperaDadosMensaisAgrupados
        ?ano=2025&grupoDelito=6&tipoGrupo=MUNICÍPIO&idGrupo=565

A mensal é a única com mês E natureza, que é o que `seguranca_ocorrencias`
guarda; as outras duas são só totais anuais e taxa por 100 mil, e ficaram de
fora. `tipoGrupo` aceita ESTADO / REGIÃO / MUNICÍPIO / DISTRITO **com
acento** — sem o acento a API responde 200 com dado do estado inteiro, que é
o pior erro possível porque parece ter funcionado. `grupoDelito` é 6
(Criminal) ou 9 (Produtividade Policial: prisões, flagrantes, inquéritos);
só o 6 entra aqui, porque 9 não é ocorrência criminal e apareceria na página
/seguranca como se fosse uma "natureza" de crime.

**idMunicipio é o código INTERNO da SSP, não o IBGE** — São Paulo é 565, não
3550308. O módulo não o carrega hardcoded: lê de
`municipios.fontes.ssp_sp_id_municipio` e, na primeira vez, descobre pelo
nome em `/v1/Municipios/RecuperaMunicipios` e grava lá (ver
`_id_ssp`). Assim outra cidade paulista só precisa da linha em `municipios`.

DOIS CUIDADOS COM O DADO, os dois documentados pelo próprio site em notas de
rodapé que só existem no HTML:

1. **Linhas derivadas.** A lista de 23 delitos mistura ocorrências com somas
   delas: "TOTAL DE ESTUPRO (4)" é Estupro + Estupro de Vulnerável, "TOTAL DE
   ROUBO - OUTROS (1)" é Roubo-Outros + Roubo de Carga + Roubo a Banco, e
   "HOMICÍDIO DOLOSO (2)" já inclui "HOMICÍDIO DOLOSO POR ACIDENTE DE
   TRÂNSITO". Gravar tudo faria a página somar o mesmo crime duas vezes. O
   módulo mantém só a partição sem sobreposição (ver `DERIVADOS`) e CONFERE a
   aritmética antes de descartar — se a SSP mudar a composição, o aviso
   aparece em vez de o total encolher calado.
2. **Meses não publicados vêm como 0, não como null.** Cada linha traz
   `publicado` = quantos meses do ano já saíram (2026 estava em 6 em
   2026-08-03). Gravar os 12 meses colocaria zeros em julho..dezembro, e um
   zero em `seguranca_ocorrencias` é indistinguível de "nenhum crime".

COBERTURA: 2017 em diante tem os 23 delitos; 2016 para trás não tem
`ESTUPRO` (132) nem `ROUBO - OUTROS` (133) desagregados, e aí o descarte das
linhas TOTAL perderia dado — por isso o `--desde` padrão é 2019, o mesmo
começo da série de MG, e a checagem de composição protege quem baixar o
padrão.

Cron: mensal.
"""

import argparse
import datetime as dt
import re
import sys

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    carregar_municipio,
    get_supabase_client,
    nome_para_fonte_externa,
)

API_BASE = "https://www.ssp.sp.gov.br/v1"
FONTE = "ssp_sp_ocorrencias_mensais"
CHAVE_FONTES = "ssp_sp_id_municipio"

GRUPO_CRIMINAL = 6
ANO_INICIAL_PADRAO = 2019

# A API devolve os 12 meses em campos separados, e `marco` vem sem cedilha.
MESES = [
    "janeiro", "fevereiro", "marco", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]

# `idDelito -> (componentes, soma_exata, motivo)`. A linha é descartada
# quando TODOS os componentes estão presentes no ano — se não estiverem
# (anos ≤ 2016), ela é a única forma daquele crime aparecer e fica.
DERIVADOS: dict[int, tuple[frozenset[int], bool, str]] = {
    30: (frozenset({133, 46, 49}), True, "TOTAL DE ROUBO = Roubo-Outros + Carga + Banco"),
    36: (frozenset({132, 131}), True, "TOTAL DE ESTUPRO = Estupro + Estupro de Vulnerável"),
    72: (frozenset({38}), False, "Homicídio Doloso por Acidente de Trânsito já está em Homicídio Doloso"),
}

# Contagem de VÍTIMAS, não de ocorrências: mesma unidade não, mesma tabela
# não. Somar vítimas com ocorrências no gráfico de naturezas seria errado.
VITIMAS = frozenset({41, 53, 73})

# O nome do delito vem com a CHAMADA DE NOTA DE RODAPÉ colada:
# "HOMICÍDIO DOLOSO (2)". O "(2)" é referência à nota da tabela do site, que
# não viaja com o dado — e na página /seguranca, que imprime a natureza ao
# lado do número, ele é lido como quantidade. Tira-se a chamada; o conteúdo
# dela ("inclui homicídio doloso por acidente de trânsito") é justamente o
# motivo de `DERIVADOS` descartar o idDelito 72, então nada se perde.
_RE_NOTA_RODAPE = re.compile(r"\s*\(\d\)\s*$")


@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=2, max=30))
def _get(rota: str, **params) -> list[dict]:
    resp = requests.get(
        f"{API_BASE}/{rota}", params=params, headers={"Accept": "application/json"}, timeout=90
    )
    resp.raise_for_status()
    corpo = resp.json()
    if not corpo.get("success"):
        raise RuntimeError(f"SSP {rota} devolveu success=false: {str(corpo)[:200]}")
    return corpo.get("data") or []


def _id_ssp(client, cidade: dict, id_municipio: str) -> int:
    """O código interno da SSP para a cidade, do banco ou descoberto agora.

    Guardar em `municipios.fontes` em vez de constante no módulo é o que
    permite a segunda cidade paulista entrar sem tocar em código — e é a
    mesma regra que `scripts/conferir_defaults_de_cidade.py` cobra: nada que
    identifique a cidade na fonte externa mora aqui dentro.
    """
    guardado = cidade["fontes"].get(CHAVE_FONTES)
    if guardado:
        return int(guardado)

    # A lista da SSP escreve o nome acentuado e em caixa mista ("São Paulo");
    # `municipios.nome` também. Normalizar os dois lados com o mesmo helper
    # do projeto evita que um acento diferente vire "não achei a cidade".
    alvo = nome_para_fonte_externa(cidade["nome"]).strip()
    candidatos = [
        m
        for m in _get("Municipios/RecuperaMunicipios")
        if nome_para_fonte_externa(m.get("nome") or "").strip() == alvo
    ]
    if len(candidatos) != 1:
        raise RuntimeError(
            f"'{cidade['nome']}' casou com {len(candidatos)} municípios na lista da SSP "
            f"(esperado exatamente 1). Preencha `fontes.{CHAVE_FONTES}` à mão."
        )
    id_ssp = int(candidatos[0]["idMunicipio"])

    fontes = {**cidade["fontes"], CHAVE_FONTES: id_ssp}
    client.table("municipios").update({"fontes": fontes}).eq(
        "id_municipio", id_municipio
    ).execute()
    print(f"[etl.psp.crimes] descoberto e gravado fontes.{CHAVE_FONTES}={id_ssp}")
    return id_ssp


def _linhas_do_ano(dados: list[dict], id_municipio: str, ano: int) -> list[dict]:
    if not dados:
        return []
    lista = dados[0].get("listaDados") or []
    presentes = {x["idDelito"] for x in lista}
    por_id = {x["idDelito"]: x for x in lista}

    manter: list[dict] = []
    for item in lista:
        did = item["idDelito"]
        if did in VITIMAS:
            continue
        regra = DERIVADOS.get(did)
        if regra:
            componentes, soma_exata, motivo = regra
            if not componentes <= presentes:
                print(
                    f"[etl.psp.crimes] {ano}: mantendo '{item['delito']['delito']}' — "
                    f"os componentes {sorted(componentes - presentes)} não existem neste ano"
                )
            else:
                if soma_exata:
                    _conferir_soma(item, [por_id[c] for c in componentes], ano, motivo)
                continue
        manter.append(item)

    rows: list[dict] = []
    for item in manter:
        publicado = int(item.get("publicado") or 0)
        natureza = _RE_NOTA_RODAPE.sub("", (item["delito"]["delito"] or "").strip())
        for n, campo in enumerate(MESES[:publicado], start=1):
            rows.append(
                {
                    "id_municipio": id_municipio,
                    "ano": ano,
                    "mes": n,
                    "natureza": natureza,
                    "qtd": int(item.get(campo) or 0),
                    "fonte": FONTE,
                }
            )
    return rows


def _conferir_soma(pai: dict, filhos: list[dict], ano: int, motivo: str) -> None:
    """Descartar a linha TOTAL só é seguro se ela for mesmo a soma das
    outras. Conferir mês a mês custa nada e transforma uma mudança de
    metodologia da SSP em aviso, não em número menor sem explicação."""
    for campo in MESES:
        soma = sum(int(f.get(campo) or 0) for f in filhos)
        if int(pai.get(campo) or 0) != soma:
            print(
                f"[etl.psp.crimes] AVISO {ano}/{campo}: '{pai['delito']['delito']}' = "
                f"{pai.get(campo)} mas a soma dos componentes deu {soma} — a regra "
                f"'{motivo}' pode ter mudado; descartando a linha TOTAL mesmo assim."
            )
            return


def sync(id_municipio: str, desde: int = ANO_INICIAL_PADRAO, ate: int | None = None) -> None:
    """A cidade vem toda de `municipios`: nome (para achar o id da SSP), UF
    (para recusar cidade de outro estado) e o próprio id da SSP.

    A fonte é ESTADUAL. Rodar para uma cidade mineira devolveria 200 com o
    dado de OUTRO município paulista de mesmo nome, ou nada — silencioso
    demais para um portal, então aborta.
    """
    cidade = carregar_municipio(id_municipio)
    if cidade["uf"] != "SP":
        raise RuntimeError(
            f"etl.psp.crimes é a base da SSP de SÃO PAULO; id_municipio={id_municipio} "
            f"({cidade['nome']}) é de {cidade['uf']}. Para MG use etl.apis.crimes_mg."
        )

    client = get_supabase_client()
    id_ssp = _id_ssp(client, cidade, id_municipio)
    ate = ate or dt.date.today().year
    if desde > ate:
        raise RuntimeError(f"--desde {desde} é posterior a --ate {ate}")

    total = 0
    for ano in range(ate, desde - 1, -1):
        dados = _get(
            "OcorrenciasMensais/RecuperaDadosMensaisAgrupados",
            ano=ano,
            grupoDelito=GRUPO_CRIMINAL,
            tipoGrupo="MUNICÍPIO",
            idGrupo=id_ssp,
        )
        rows = _linhas_do_ano(dados, id_municipio, ano)
        if not rows:
            print(f"[etl.psp.crimes] {ano}: nada publicado ainda (pulando)")
            continue

        # Apaga o ano antes de gravar em vez de só dar upsert: a chave única
        # inclui `natureza`, então quando a SSP renomeia um delito o upsert
        # cria a linha nova e DEIXA a velha, e a página passa a somar as
        # duas. O filtro por `fonte` garante que isto nunca encoste no dado
        # de outra origem. O preço é a janela entre DELETE e INSERT (o
        # cliente é autocommit): se cair no meio, o ano fica vazio — visível
        # na contagem abaixo, e resolvido rodando de novo.
        client.table("seguranca_ocorrencias").delete().eq(
            "id_municipio", id_municipio
        ).eq("ano", ano).eq("fonte", FONTE).execute()
        client.table("seguranca_ocorrencias").upsert(
            rows, on_conflict="id_municipio,ano,mes,natureza"
        ).execute()

        # Confere contra o banco: `.execute()` sem exceção não é prova de que
        # gravou — mesma disciplina de `etl/apis/crimes_mg.py`, que achou
        # upserts que "passaram" e não gravaram.
        gravado = (
            client.table("seguranca_ocorrencias")
            .select("id", count="exact")
            .eq("id_municipio", id_municipio)
            .eq("ano", ano)
            .execute()
            .count
        )
        naturezas = len({r["natureza"] for r in rows})
        meses = max(r["mes"] for r in rows)
        print(
            f"[etl.psp.crimes] {ano}: {len(rows)} linhas enviadas "
            f"({naturezas} naturezas × {meses} meses), {gravado} no banco"
            + ("" if gravado == len(rows) else "  <-- DIVERGENTE, confira")
        )
        total += len(rows)

    print(f"[etl.psp.crimes] id_municipio={id_municipio} idMunicipio_ssp={id_ssp} total={total}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument(
        "--desde",
        type=int,
        default=ANO_INICIAL_PADRAO,
        help=f"Primeiro ano da série (padrão: {ANO_INICIAL_PADRAO}, igual ao de MG). "
        "Antes de 2017 a SSP não desagrega estupro nem roubo.",
    )
    parser.add_argument("--ate", type=int, default=None, help="Último ano (padrão: ano corrente).")
    args = parser.parse_args()
    try:
        sync(args.id_municipio, args.desde, args.ate)
    except RuntimeError as e:
        print(f"[etl.psp.crimes] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
