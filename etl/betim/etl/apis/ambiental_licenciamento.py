r"""etl.apis.ambiental_licenciamento — o censo de licenciamento ambiental de
Minas Gerais (IDE-Sisema/SEMAD), a "espinha dorsal" do eixo `/ambiental`.

Fonte: `https://geoserver.meioambiente.mg.gov.br/IDE/ows`, WFS, camada
`IDE:ide_2101_mg_empreendimentos_licenciados_pto` — anônimo, sem chave,
`Fees: NONE`. Medido ao vivo em 2026-08-11: **19.713 feições**
(`numberMatched`) — o F0-discovery.md §1 mediu 19.162 em 2026-08-07; a fonte
cresceu ~2,9% no meio tempo, como o próprio F0 avisava que podia acontecer.

Documento completo da fonte, da armadilha central e da taxonomia de setor:
`docs/ambiental/F0-discovery.md` §1 e §3. Este módulo não repete o que já
está lá — só o que foi CONFIRMADO ou ATUALIZADO ao vivo em 2026-08-11 ao
escrever o coletor, e a migration `0063_ambiental_licenciamento.sql` tem a
mesma bateria de notas do lado do schema.

═══ A ARMADILHA DO F0 §1.1, E POR QUE UMA PASSADA SÓ BASTA AQUI ═══

Pedir a camada inteira com a coluna de geometria (`geom`) falha em silêncio:
uma feição de coordenada não-finita aborta o stream JSON no meio, e como o
corpo é chunked e o HTTP 200 já foi enviado, NÃO há status de erro — um
parser tolerante grava uma fração e reporta sucesso. A guarda certa lê o
CORPO, nunca confia no status: `if "ExceptionReport" in corpo: raise` —
está em `_guardar_contra_exception_report` abaixo, e roda em toda resposta
desta fonte, mesmo que a passada atual nunca precise dela.

O F0 documentava DUAS estratégias por causa disso: (1) atributos sem `geom`
numa passada só, (2) `geom` paginado para isolar a feição envenenada.
Confirmado ao vivo em 2026-08-11 no `DescribeFeatureType`: a camada expõe
`latitude`/`longitude` como colunas ESCALARES (`xsd:double`), FORA de
`geom`. Pedir só essas (que já é a estratégia 1 do F0 — `propertyName=`
sem a coluna de geometria) devolveu as 19.713/19.713 feições limpas, com
`latitude`/`longitude` preenchidos em 100% delas e nenhuma fora da caixa de
MG. A estratégia 2 (paginar `geom`) deixou de ser necessária: este módulo
nunca pede `geom`.

═══ `cpf_cnpj`: ZFILL NÃO BASTA, A CLASSIFICAÇÃO É POR DÍGITO VERIFICADOR ═══

O campo é NUMÉRICO na fonte — zero à esquerda corta antes de chegar aqui
(confirmado: um CPF que começa com 0 chega com 10 dígitos). Mas um valor de,
digamos, 9 dígitos pode ser um CNPJ com raiz começada em zero (zfill(14)) OU
um CPF começado em zero (zfill(11)) — o comprimento cru não decide qual.
Este módulo decide pelo DÍGITO VERIFICADOR oficial (mod 11) dos dois
documentos brasileiros, não por comprimento. `_classificar_documento`
tenta, nesta ordem:

  1. `zfill(14)` termina em 6 zeros (raiz preservada, filial+DV zerados) ->
     `cnpj_redigido_pela_fonte`. É o padrão de redação que a própria fonte
     já aplica em 92% dos CNPJ (F0 §1.3).
  2. `zfill(14)` valida como CNPJ (dígito verificador bate) -> a fonte
     publicou o CNPJ inteiro, sem redigir -> `cnpj_nao_redigido`. Mesmo
     assim SÓ a raiz (8 primeiros dígitos) é gravada — publicar o CNPJ que
     a própria fonte não redigiu seria pior que a fonte.
  3. `zfill(11)` valida como CPF -> `cpf`.
  4. Se (2) E (3) validam ao mesmo tempo (aconteceu em 265 das 19.713 —
     ambiguidade real, não bug: um valor curto pode satisfizer os dois
     algoritmos por coincidência) -> `indeterminado_tratado_como_pf`. Não é
     erro de classificação — é o valor genuinamente aceitando as duas
     leituras, e a decisão vai para o lado mais protetor: tratado como
     pessoa física (sem raiz, sem nome, sem coordenada).
  5. Não-dígito (ex. `"4,24174E+13"` — 2 casos: notação científica de
     planilha vazando da própria fonte) -> `corrompido_na_fonte`, mesmo
     tratamento do indeterminado.

Contagem medida em 2026-08-11 contra as 19.713 linhas:
cnpj_redigido_pela_fonte 13.262 · cpf 4.615 · cnpj_nao_redigido 1.569 ·
indeterminado_tratado_como_pf 265 · corrompido_na_fonte 2.

═══ O VAZAMENTO QUE O F0 NOMEAVA EM GERAL, MEDIDO AQUI EM ESPECÍFICO ═══

F0 §1.3 já registrava "nome com CPF colado no texto (padrão MEI): 273"
como achado geral da camada. Medido ao vivo PARA ESTA CARGA: **360 linhas**
têm um CPF de 11 dígitos dentro do texto livre de `nome_pf_pj` — ex.
`"ANDREIVE PEDRO MARQUES 05593124663"`,
`"EDMAR GERALDO DA COSTA CPF 392.386.876-68"` — e as 360 são TODAS
classificadas como CNPJ (redigido ou não) pelo `cpf_cnpj` oficial, ou seja,
TODAS entrariam como "empreendimento PJ, publicar nome e coordenada" pela
regra normal. Gravar o texto cru vazaria o CPF do titular por uma coluna
que a regra de privacidade nem olha (ela olha `cpf_cnpj`, não `nome_pf_pj`).
`_sanitizar_nome` remove o número (e o rótulo "CPF"/"CNPJ" ao lado) de TODO
nome antes de gravar — não só dos 360 já achados, porque a fonte pode
colar outro CPF em outro nome na próxima coleta, e o padrão (nome + dígitos
soltos ou com pontuação de CPF) é genérico o bastante para pegar variação
nova sem lista fixa.

═══ `setor`/`subsetor`: SEMPRE `cod_atvpri`, NUNCA `listagem` ═══

Confirmado ao vivo: o setor `B` aparece em `listagem` como "B - Atividades
Industriais/Indústria Metalúrgica e Outras" (1.866 linhas) E como
"B -  Atividades industriais / Indústria Metalúrgica e Outras" (69 linhas,
dois espaços, caixa diferente) — exatamente a armadilha que o F0 §1.2
avisava. ACHADO NOVO nesta sessão: uma linha tem `cod_atvpri` começando em
"B-" mas `listagem` começando em "C -..." — divergência real na PRÓPRIA
fonte entre as duas colunas, não erro de leitura daqui. `cod_atvpri[0]` é a
letra oficial (preenchida em 19.713/19.713, sempre no padrão `X-NN-...`);
`SETOR_ROTULOS` é um dicionário fixo por letra (a DN Copam 217/2017), nunca
o texto livre da fonte. `subsetor` é `cod_atvpri[:4]` (ex. `"F-05"`).

═══ `link` NÃO É CHAVE — 41 COLISÕES REAIS MEDIDAS ═══

O candidato natural de chave seria o `idSolicitacao` de dentro do `link`
(`.../acesso-visitante/{id}/{cod_atividade}` — é a chave de junção com o
SLA do F0 §2.1). Medido ao vivo: **41 feições têm o `link` IDÊNTICO** (string
exata, não só o id) a outra feição com `n_solicit`, `mun_solic`, `cpf_cnpj`,
`classe` e datas TOTALMENTE diferentes — duas licenças distintas, mesmo
link, bug de origem na fonte. Este módulo usa `fid` (o id interno do
WFS/GeoServer) como `id_fonte`: único em 19.713/19.713 medidos, sem
exceção nenhuma.

═══ MUNICÍPIO: MESMO PADRÃO DE `feam_barragens`/`snisb_barragens` ═══

`mun_solic` é nome, não código IBGE (F0 §1.2). Resolvido contra
`ref_municipios_mg` via `etl.common.resolver_municipio_mg` — 832 nomes
distintos medidos, 831 resolvidos (826 por igualdade exata, 5 por
similaridade), 1 sem match confiável ("Brasópolis", que é "Brazópolis" com
S/Z trocado — abaixo do limiar de 0,6, corretamente não adivinhado).

═══ O QUE ESTE MÓDULO NÃO PROVA ═══

`status_pro` tem um único valor nas 19.713 linhas: "Concluído Deferido". É
o registro HISTÓRICO do que já foi decidido, não a fila viva (isso é o SLA,
`ecosistemas.meioambiente.mg.gov.br`, não coletado aqui) — e não confirma
que a licença ainda está ativa hoje, só que foi deferida uma vez.

Uso:

    python -m etl.apis.ambiental_licenciamento --sondar --nome-municipio Betim
    python -m etl.apis.ambiental_licenciamento --sondar   # visão geral, sem gravar
    python -m etl.apis.ambiental_licenciamento            # sincroniza MG inteira
"""
import argparse
import re
import sys

import requests

from etl.common import get_supabase_client, refresh_completo_seguro, resolver_municipio_mg

LOG = "[etl.apis.ambiental_licenciamento]"

WFS_URL = "https://geoserver.meioambiente.mg.gov.br/IDE/ows"
LAYER = "IDE:ide_2101_mg_empreendimentos_licenciados_pto"
TIMEOUT = 180
_UA = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"

# Estratégia 1 do F0 §1.1: atributos SEM `geom`. `latitude`/`longitude` já
# vêm aqui como colunas escalares (achado de 2026-08-11, ver docstring) —
# não há necessidade da estratégia 2 (geom paginado).
_CAMPOS = [
    "fid", "n_solicit", "n_processo", "mun_solic", "cpf_cnpj", "nome_pf_pj",
    "tipo_solic", "listagem", "cod_atvpri", "des_atvpri", "classe",
    "modl_licen", "fase_licen", "status_pro", "latitude", "longitude",
    "link", "data_emiss", "data_val",
]

# DN Copam 217/2017 — rótulo oficial por letra de setor (F0 §3). Fixo,
# nunca extraído de `listagem` (armadilha de caixa/espaço/divergência
# medida na docstring do módulo).
SETOR_ROTULOS = {
    "A": "Atividades Minerárias",
    "B": "Atividades Industriais / Indústria Metalúrgica e Outras",
    "C": "Atividades Industriais / Indústria Química e Outras",
    "D": "Atividades Industriais / Indústria Alimentícia",
    "E": "Atividades de Infraestrutura",
    "F": "Gerenciamento de Resíduos e Serviços",
    "G": "Atividades Agrossilvipastoris",
    "H": "Outras atividades (não listadas/não enquadradas)",
}

_RE_COD_ATIVIDADE = re.compile(r"^[A-H]-\d{2}-")


# ────────────────────────────── HTTP / guarda ───────────────────────────


def _sessao() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = _UA
    return s


def _guardar_contra_exception_report(corpo: str) -> None:
    """F0 §1.1: o corpo é chunked e o 200 já foi enviado antes de a fonte
    perceber a feição envenenada — NÃO existe status de erro para esse
    caso. A guarda tem que ler o corpo. Roda em toda resposta desta fonte,
    mesmo a passada atual (sem `geom`) nunca tendo disparado isto nos
    testes ao vivo — é rede de segurança, não decoração."""
    if "ExceptionReport" in corpo:
        raise RuntimeError(
            f"{LOG} a fonte devolveu ExceptionReport no corpo (200 OK, sem status de erro) "
            "— provável feição com coordenada não-finita no meio do stream. Corpo (600 "
            f"primeiros chars): {corpo[:600]!r}"
        )


def _buscar_todas_as_licencas(sessao: requests.Session) -> list[dict]:
    """Uma passada só, sem paginação: a fonte devolveu as 19.713/19.713
    numa única resposta nos testes ao vivo de 2026-08-11. Se um dia a
    contagem baixar ou a fonte truncar, `numberReturned < numberMatched`
    dispara aviso — não falha em silêncio."""
    params = {
        "service": "WFS",
        "version": "2.0.0",
        "request": "GetFeature",
        "typeNames": LAYER,
        "outputFormat": "application/json",
        "propertyName": ",".join(_CAMPOS),
    }
    r = sessao.get(WFS_URL, params=params, timeout=TIMEOUT)
    r.raise_for_status()
    corpo = r.text
    _guardar_contra_exception_report(corpo)
    dados = r.json()
    total = dados.get("numberMatched")
    feicoes = dados.get("features", [])
    if total is not None and len(feicoes) < total:
        print(f"{LOG} AVISO: a fonte declara numberMatched={total} mas devolveu só "
              f"{len(feicoes)} feições nesta resposta — dado parcial, layout pode ter mudado.")
    return feicoes


# ──────────────────────────── documento (CPF/CNPJ) ──────────────────────


def _digito_verificador_mod11(digitos: list[int], pesos: list[int]) -> int:
    soma = sum(d * p for d, p in zip(digitos, pesos))
    resto = soma % 11
    return 0 if resto < 2 else 11 - resto


def _valida_cpf(cpf: str) -> bool:
    if len(cpf) != 11 or len(set(cpf)) == 1:
        return False
    n = [int(c) for c in cpf]
    dv1 = _digito_verificador_mod11(n[:9], list(range(10, 1, -1)))
    dv2 = _digito_verificador_mod11(n[:10], list(range(11, 1, -1)))
    return n[9] == dv1 and n[10] == dv2


def _valida_cnpj(cnpj: str) -> bool:
    if len(cnpj) != 14 or len(set(cnpj)) == 1:
        return False
    n = [int(c) for c in cnpj]
    pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    dv1 = _digito_verificador_mod11(n[:12], pesos1)
    dv2 = _digito_verificador_mod11(n[:13], pesos2)
    return n[12] == dv1 and n[13] == dv2


def _classificar_documento(bruto) -> dict:
    """Devolve `{"classificacao", "cnpj_raiz", "eh_pessoa_fisica"}`. Ver a
    docstring do módulo para a ordem de decisão e os números medidos."""
    raw = "" if bruto is None else str(bruto).strip()
    if not raw or not raw.isdigit():
        return {"classificacao": "corrompido_na_fonte", "cnpj_raiz": None, "eh_pessoa_fisica": True}

    s14 = raw.zfill(14)
    # Padrão de redação da própria fonte (F0 §1.3): raiz preservada, filial+DV
    # zerados. `s14[:8] != "00000000"` evita classificar um valor todo-zero
    # (lixo) como "redigido" por coincidência de sufixo.
    if s14[-6:] == "000000" and s14[:8] != "00000000":
        return {"classificacao": "cnpj_redigido_pela_fonte", "cnpj_raiz": s14[:8], "eh_pessoa_fisica": False}

    ok_cnpj = _valida_cnpj(s14)
    s11 = raw.zfill(11)
    ok_cpf = _valida_cpf(s11)

    if ok_cnpj and ok_cpf:
        # Ambiguidade real (265/19.713 medidos) — lado mais protetor.
        return {"classificacao": "indeterminado_tratado_como_pf", "cnpj_raiz": None, "eh_pessoa_fisica": True}
    if ok_cnpj:
        return {"classificacao": "cnpj_nao_redigido", "cnpj_raiz": s14[:8], "eh_pessoa_fisica": False}
    if ok_cpf:
        return {"classificacao": "cpf", "cnpj_raiz": None, "eh_pessoa_fisica": True}
    # Nem um nem outro dígito verificador bateu — não visto nos 19.713 (todos
    # bateram em algum dos dois), mas não impossível numa fonte que muda.
    # Trata pelo lado protetor, como o indeterminado.
    return {"classificacao": "indeterminado_tratado_como_pf", "cnpj_raiz": None, "eh_pessoa_fisica": True}


# `\d[\d.\-/]{8,}\d`: um dígito, 9+ chars de dígito/pontuação de documento,
# um dígito — cobre "05593124663", "246553256-15", "397.265.506/10". O
# corte por CONTAGEM DE DÍGITOS (11 ou 14), não pelo tamanho da string
# batida, é o que evita apagar um pedaço de nome que só parece numérico.
_RE_NUMERO_DOCUMENTO = re.compile(r"\d[\d.\-/]{8,}\d")
_RE_ROTULO_DOCUMENTO = re.compile(r"[-,]?\s*(CPF|CNPJ)\s*[:\-]?\s*$", re.IGNORECASE)


def _sanitizar_nome(nome) -> str | None:
    """Remove CPF/CNPJ colado no texto livre do nome (achado de
    2026-08-11, 360 casos medidos — ver docstring do módulo) antes de
    gravar `nome_empreendimento`. Roda em TODO nome de PJ, não só nos já
    achados — o padrão é genérico, não uma lista fixa de casos."""
    if not nome:
        return None
    limpo = str(nome)

    def _apagar_se_documento(m: re.Match) -> str:
        digitos = re.sub(r"\D", "", m.group(0))
        return "" if len(digitos) in (11, 14) else m.group(0)

    limpo = _RE_NUMERO_DOCUMENTO.sub(_apagar_se_documento, limpo)
    limpo = _RE_ROTULO_DOCUMENTO.sub(" ", limpo.strip())
    limpo = " ".join(limpo.split()).strip(" -,:")
    return limpo or None


# ─────────────────────────────── outros campos ──────────────────────────


def _txt(v) -> str | None:
    if v is None:
        return None
    s = str(v).strip()
    return s or None


def _normalizar_fase(v) -> str | None:
    """Armadilha F0 §1.2: `NÃO SE APLICA`/`Não se aplica` são o MESMO
    valor com caixa diferente. Maiúsculo + espaço único resolve sem perder
    acento (Python `.upper()` já trata Unicode)."""
    s = _txt(v)
    return " ".join(s.upper().split()) if s else None


def _data_iso(v) -> str | None:
    """`data_emiss`/`data_val` chegam como `"DD/MM/AAAA"` (100% das 19.713
    linhas medidas nesse padrão, 3 com `data_val` ausente)."""
    s = _txt(v)
    if not s:
        return None
    partes = s.split("/")
    if len(partes) != 3:
        return None
    dia, mes, ano = partes
    return f"{ano}-{mes.zfill(2)}-{dia.zfill(2)}"


def _setor_e_subsetor(cod_atvpri) -> tuple[str, str, str] | None:
    """`(letra, rótulo, subsetor)` a partir de `cod_atvpri` — NUNCA de
    `listagem` (ver docstring do módulo). `None` se o código não bater no
    padrão `X-NN-...` (não visto nos 19.713 medidos, mas a guarda existe
    para não gravar setor inventado se a fonte mudar de formato)."""
    cod = _txt(cod_atvpri)
    if not cod or not _RE_COD_ATIVIDADE.match(cod):
        return None
    letra = cod[0]
    rotulo = SETOR_ROTULOS.get(letra)
    if rotulo is None:
        return None
    return letra, rotulo, cod[:4]


# ─────────────────────────────── parse de linha ─────────────────────────


def _parse(feicao: dict) -> dict | None:
    """Sem `id_municipio` — quem chama resolve contra `ref_municipios_mg` e
    preenche depois. Devolve `None` para uma linha cujo `cod_atvpri` não bate
    no padrão esperado (ver `_setor_e_subsetor`) — melhor licença ausente da
    tela do que setor inventado."""
    p = feicao.get("properties", {})

    setor = _setor_e_subsetor(p.get("cod_atvpri"))
    if setor is None:
        return None
    setor_letra, setor_rotulo, subsetor = setor

    doc = _classificar_documento(p.get("cpf_cnpj"))
    eh_pf = doc["eh_pessoa_fisica"]

    return {
        "id_fonte": p.get("fid"),
        "municipio_fonte": _txt(p.get("mun_solic")),
        "setor_letra": setor_letra,
        "setor_rotulo": setor_rotulo,
        "subsetor": subsetor,
        "atividade_codigo": _txt(p.get("cod_atvpri")),
        "atividade_descricao": _txt(p.get("des_atvpri")),
        "modalidade": _txt(p.get("modl_licen")),
        "classe": p.get("classe"),
        "fase_licenciamento": _normalizar_fase(p.get("fase_licen")),
        "fase_licenciamento_fonte": _txt(p.get("fase_licen")),
        "situacao": _txt(p.get("status_pro")),
        "tipo_solicitacao": _txt(p.get("tipo_solic")),
        "numero_solicitacao": _txt(p.get("n_solicit")),
        "numero_processo": _txt(p.get("n_processo")),
        "documento_classificacao": doc["classificacao"],
        "cnpj_raiz": doc["cnpj_raiz"],
        "eh_pessoa_fisica": eh_pf,
        # Nunca nome de PF, e sanitizado mesmo para PJ (armadilha do MEI).
        "nome_empreendimento": None if eh_pf else _sanitizar_nome(p.get("nome_pf_pj")),
        # Coordenada só para PJ — ver a nota da migration sobre por que não
        # há substituição por centroide de município.
        "latitude": None if eh_pf else p.get("latitude"),
        "longitude": None if eh_pf else p.get("longitude"),
        "data_emissao": _data_iso(p.get("data_emiss")),
        "data_validade": _data_iso(p.get("data_val")),
        "link": _txt(p.get("link")),
    }


# ─────────────────────────────── coleta ────────────────────────────────


def coletar_e_resolver_estado(client) -> tuple[list[dict], list[tuple[str, int]]]:
    """As linhas da camada inteira, cada uma com `id_municipio` RESOLVIDO
    contra `ref_municipios_mg`. Devolve `(linhas_casadas, sem_match)`."""
    sessao = _sessao()
    feicoes = _buscar_todas_as_licencas(sessao)
    print(f"{LOG} {len(feicoes)} feição(ões) recebida(s) da fonte.")

    casadas: list[dict] = []
    sem_match: dict[str, int] = {}
    ignoradas_setor = 0
    for feicao in feicoes:
        linha = _parse(feicao)
        if linha is None:
            ignoradas_setor += 1
            continue
        nome_fonte = linha["municipio_fonte"]
        resolvido = resolver_municipio_mg(client, nome_fonte)
        if resolvido is None:
            chave = nome_fonte or "(sem município)"
            sem_match[chave] = sem_match.get(chave, 0) + 1
            continue
        linha["id_municipio"] = resolvido["id_ibge"]
        casadas.append(linha)

    if ignoradas_setor:
        print(f"{LOG} AVISO: {ignoradas_setor} linha(s) com `cod_atvpri` fora do padrão "
              "esperado — não gravadas (setor não inventado).")

    return casadas, sorted(sem_match.items(), key=lambda kv: -kv[1])


# ─────────────────────────────── sondar ────────────────────────────────


def sondar(nome_municipio: str | None) -> None:
    """Sem gravar e sem ler o banco — funciona com o banco fora do ar."""
    sessao = _sessao()
    feicoes = _buscar_todas_as_licencas(sessao)
    print(f"{LOG} {len(feicoes)} feição(ões) recebida(s) da fonte.")

    linhas = [l for l in (_parse(f) for f in feicoes) if l is not None]

    from collections import Counter
    print(f"{LOG} documento_classificacao: "
          f"{dict(Counter(l['documento_classificacao'] for l in linhas))}")
    print(f"{LOG} setor_letra: {dict(sorted(Counter(l['setor_letra'] for l in linhas).items()))}")

    if not nome_municipio:
        contagem = Counter(l["municipio_fonte"] or "(sem município)" for l in linhas)
        print(f"{LOG} {len(contagem)} municípios distintos na fonte — top 15:")
        for m, n in contagem.most_common(15):
            print(f"       {m:<30} {n}")
        return

    alvo = [l for l in linhas if (l["municipio_fonte"] or "").strip().lower() == nome_municipio.strip().lower()]
    print(f"\n{LOG} {nome_municipio}: {len(alvo)} licença(s)")
    for l in alvo[:20]:
        nome = l["nome_empreendimento"] or ("(pessoa física)" if l["eh_pessoa_fisica"] else "(sem nome)")
        print(f"       {nome:<40} setor={l['setor_letra']} subsetor={l['subsetor']} "
              f"classe={l['classe']} modalidade={l['modalidade']} doc={l['documento_classificacao']}")


# ──────────────────────────────── sync ─────────────────────────────────


def sync(*, permitir_reducao: bool) -> None:
    """Sincroniza a camada INTEIRA (a fonte é um WFS estadual único, sem
    filtro por cidade no lado do servidor)."""
    client = get_supabase_client()
    print(f"{LOG} baixando e resolvendo município de cada licença contra ref_municipios_mg...")
    linhas, sem_match = coletar_e_resolver_estado(client)
    if sem_match:
        total_sem_match = sum(n for _, n in sem_match)
        print(f"{LOG} {total_sem_match} licença(s) em {len(sem_match)} nome(s) de município "
              "SEM MATCH CONFIÁVEL — NÃO gravadas:")
        for nome, n in sem_match[:20]:
            print(f"       {nome:<40} {n}")
    _gravar(linhas, permitir_reducao)


def _gravar(linhas: list[dict], permitir_reducao: bool) -> None:
    if not linhas:
        print(f"{LOG} nada coletado/casado — NÃO apago o que já existe.")
        return
    client = get_supabase_client()
    por_municipio: dict[str, list[dict]] = {}
    for linha in linhas:
        por_municipio.setdefault(linha["id_municipio"], []).append(linha)

    gravados = 0
    for id_municipio, linhas_da_cidade in por_municipio.items():
        escreveu = refresh_completo_seguro(
            client,
            "ambiental_licenciamento",
            {"id_municipio": id_municipio},
            linhas_da_cidade,
            permitir_reducao=permitir_reducao,
            ao_reduzir="skip",
            rotulo="etl.apis.ambiental_licenciamento",
        )
        if escreveu:
            gravados += len(linhas_da_cidade)
    print(f"{LOG} ambiental_licenciamento: {gravados} linha(s) gravada(s) em "
          f"{len(por_municipio)} município(s).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--permitir-reducao", action="store_true")
    parser.add_argument("--sondar", action="store_true", help="consulta e relata, NÃO grava, NÃO lê o banco")
    parser.add_argument("--nome-municipio", help="só com --sondar: a fonte não tem código IBGE")
    args = parser.parse_args()

    try:
        if args.sondar:
            sondar(args.nome_municipio)
        else:
            sync(permitir_reducao=args.permitir_reducao)
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
