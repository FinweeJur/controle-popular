"""etl.camaras.simplesystem — leis e proposições de qualquer Câmara que rode o
CMS do fornecedor **Simple System** (`pub.simpless.com.br`).

Alvo inicial: Itinga-MG (3134004), `https://www.camaraitinga.mg.gov.br/`.

O fornecedor monta a API sob o PRÓPRIO domínio da câmara (diferente do
SysSolution, que fala tudo por um host central com `Origin`) — cada câmara
cliente é `<host>/publicacao/...`, e o mesmo código atende qualquer uma
trocando `municipios.fontes.camara_host`.

═══ AS ARMADILHAS, TODAS MEDIDAS AO VIVO (2026-08-11, Itinga) ═══

1. **O MENU "Documentos Públicos" DO SITE ESTÁ QUEBRADO** (HTTP 500, PHP sem
   controller). A seção que funciona de verdade é `/publicacao` — achada só
   porque o rodapé ("Desenvolvido por Simple System") e os PDFs
   (`pub.simpless.com.br`) apontavam para o fornecedor, e o diretório de
   publicações é o padrão desse fornecedor pra expor documento público.

2. **A LISTA NÃO ESTÁ NO HTML — nem depois de renderizada por um navegador
   comum.** `/publicacao/diretorio/{id}` e `/publicacao/documento/{id}-{ano}`
   devolvem uma página quase vazia (`<div id="conteudo">` some) cujo
   JavaScript faz `$.post` pra três endpoints que devolvem JSON puro:

       POST /publicacao/listarCategoria/                 -> as 27 categorias
       POST /publicacao/listarPublicacao/{id_categoria}   -> TODAS as
                                                              publicações da
                                                              categoria, todos
                                                              os anos, numa
                                                              chamada só (sem
                                                              parâmetro de ano
                                                              a paginação é do
                                                              lado do cliente,
                                                              `jPages`)
       POST /publicacao/listarGridDocumento/{id_publicacao} -> os anexos
                                                              (pasta+arquivo)
                                                              de UMA publicação

   Conferido: a soma de `listarPublicacao/{id}-{ano}` por ano bate exatamente
   com `listarPublicacao/{id}` sem ano (83 = 83 em Projetos de Leis) — por
   isso este módulo pede a categoria inteira de uma vez, sem iterar
   `/publicacao/diretorio` nem ano nenhum. É MENOS requisição que a rota que
   a tarefa original descrevia (diretório -> ano -> visualizar), não mais.

3. **O ANO QUE IMPORTA É O DO NÚMERO DO DOCUMENTO, NÃO O DE
   `data_publicacao`.** Em ~3% dos registros (29 de 958, medido em todas as
   categorias povoadas) o ano embutido no nome ("Requerimento Nº06/2021") diz
   uma coisa e `data_publicacao` (quando o PDF foi carregado nesta versão do
   portal) diz outra — às vezes anos à frente. Achado que provaria dano real
   se ignorado: id 20196 é "Requerimento Nº06/2026" publicado em 2026-06-03,
   e id 20691 é "Requerimento Nº06/2021" **também** publicado em 2026-06-03.
   Usar o ano de `data_publicacao` faria os dois colidirem na chave natural
   `(id_municipio, tipo, numero, ano)` — o upsert sobrescreveria um
   requerimento de 2021 com um de 2026 completamente diferente, em silêncio.
   `_numero_ano()` extrai o ano do PRÓPRIO nome (`/(\\d{4})` depois do
   número) e só cai para `data_publicacao` quando o nome não tem um — o que
   não aconteceu nenhuma vez nas categorias que este módulo lê.

4. **"PROJETOS DE LEIS" (id 600) NÃO É SÓ PROJETO DE LEI.** 53 dos 83 itens
   são "EMENDA IMPOSITIVA Nº10/PROJETO DE LEI Nº029/2025" — emendas
   PENDURADAS num projeto, numeradas DENTRO do projeto-pai, não por ano. Duas
   emendas Nº10 de projetos diferentes no mesmo ano colidiriam na mesma chave
   natural que um requerimento colidiria (armadilha 3) — só que aqui o
   conserto não é trivial: precisaria de uma chave que carregasse o projeto
   pai, e `proposicoes` não tem essa coluna. Ficam de fora DE PROPÓSITO
   (`TIPO_PROPOSICAO` não tem entrada para "emenda impositiva" nem
   "mensagem"), contadas em `sem_tipo` como qualquer tipo sem mapa — é o
   mesmo mecanismo que já existe para isso, não um caso especial. Decisão de
   humano pendente: modelar emenda-a-projeto exigiria coluna nova.

5. **`numero_processo` VEM `null` PARA AS EMENDAS** (não têm numeração
   própria simples) **e para 1 resolução** ("Resolução Nº 05/2021/Regimento
   Interno"). `_numero_ano()` cai para extrair o número do próprio `nome`
   quando `numero_processo` não é dígito puro.

6. **`descricao` (a ementa) vem `null` em boa parte das categorias
   informais** (Indicação, Pedido de Providência) — a câmara publica só o
   PDF, sem digitar um resumo. Não é falha de coleta: grava `ementa = None`
   e seguem sem tema classificado, do jeito que `classificar_texto(None)`
   já trata.

7. **"Pedidos de Providências" (id 596, 122 itens) não tem espécie
   equivalente no vocabulário do app hoje** (`PESO_PROPOSICAO` em
   `lib/betim/vereadores.ts` não tem `pedido_providencia`). Forçá-lo para
   `indicacao` seria inventar equivalência sem confirmar se as duas espécies
   têm o mesmo peso formal nesta Casa; inventar um slug novo pontuaria
   `undefined` no ranking sem editar o app, que é o mesmo defeito da
   armadilha 6 do `syssolution.py`. Fica de fora do `--partes proposicoes`
   deste módulo — nem é buscado, para não gastar requisição em algo que
   sempre voltaria sem mapa. Registrado aqui para quando alguém decidir.

═══ O QUE ESTE MÓDULO ESCREVE ═══

- `proposicoes` — upsert por `(id_municipio, tipo, numero, ano)`, lendo
  Projetos de Leis, Proposições, Indicações, Requerimentos e Moções.
- `atos_oficiais` — refresh total, lendo Leis, Leis Complementares,
  Decretos, Portarias, Resoluções e Lei Orgânica (categorias vazias em
  Itinga hoje, mas mapeadas — a câmara parece publicar só o Projeto de Lei,
  nunca republicar o texto promulgado à parte).

Não escreve autoria (`autores`/`vereador_id`): a API de listagem não expõe
quem apresentou a peça (confirmado nos campos de `listarPublicacao` — não
há `autor` nem similar), só o PDF traria isso, e a tarefa desta rodada
explicitamente não pede parsing de PDF.

Uso:

    python -m etl.camaras.simplesystem --id-municipio 3134004
    python -m etl.camaras.simplesystem --id-municipio 3134004 --partes proposicoes
    python -m etl.camaras.simplesystem --id-municipio 3134004 --listar-categorias
"""
import argparse
import re
import sys
import time
import unicodedata
from urllib.parse import urlparse

import requests

from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    carregar_municipio,
    get_supabase_client,
    refresh_completo_seguro,
    upsert_com_colunas_opcionais,
)
from etl.temas import classificar_texto

LOG = "[etl.camaras.simplesystem]"

COLETOR = "simplesystem"
FONTE_LEGISLACAO = "camara_simplesystem"

# Infra do FORNECEDOR (fixa, mesma pra qualquer câmara cliente) — diferente
# de `camara_host`, que é por cidade e vem de `municipios.fontes`.
ARQUIVOS_BASE = "https://pub.simpless.com.br/files"

TIMEOUT = 30
# Sem limite de requisição documentado (ao contrário do WAF de 15/min do
# SysSolution, armadilha 7 de `syssolution.py`), mas é um VPS pequeno de
# prefeitura — pausa curta entre as buscas de anexo (uma por publicação) por
# educação, não porque alguém pediu.
PAUSA_ANEXO = 0.15

_SESSAO = requests.Session()
_SESSAO.headers["User-Agent"] = (
    "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"
)

# ─────────────────── categorias -> destino (por NOME, não id) ────────────
#
# Os ids (595, 597, 600...) são de INSTALAÇÃO — próprios desta câmara, não
# do fornecedor — então o mapeamento é por nome normalizado (sem acento,
# maiúsculo) contra `listarCategoria/`, buscado a cada rodada. Ver
# `--listar-categorias` para a lista completa das 27 e o que fica de fora.

CATEGORIAS_PROPOSICOES = {
    "PROJETOS DE LEIS",
    "PROPOSICOES",
    "INDICACOES",
    "REQUERIMENTOS",
    "MOCOES",
}

# Categoria -> tipo PADRÃO de `atos_oficiais` (Title Case, mesmo vocabulário
# de `sapl.py`/`syssolution.py` — a tela monta o filtro a partir desta
# coluna). "Decretos" tem um segundo tipo dentro dela (armadilha da
# `_classificar_ato`), as outras são uma coisa só.
CATEGORIA_ATO_PADRAO = {
    "LEIS": "Lei Ordinária",
    "LEIS COMPLEMENTARES": "Lei Complementar",
    "DECRETOS": "Decreto",
    "PORTARIAS": "Portaria",
    "RESOLUCOES": "Resolução",
    "LEI ORGANICA": "Lei Orgânica",
}

# Prefixo do `nome` (já sem acento/maiúsculo) -> `proposicoes.tipo`, no
# vocabulário que `PESO_PROPOSICAO` (`apps/web/lib/betim/vereadores.ts`)
# conhece. Ordem importa: mais específico primeiro ("projeto de lei
# complementar" antes de "projeto de lei"), `startswith` decide.
#
# DE PROPÓSITO SEM "emenda"/"mensagem" — ver armadilha 4 no topo do módulo:
# emenda-a-projeto colide na chave natural e não tem como ser modelada com
# as colunas de hoje. Cai em `sem_tipo`, igual a qualquer tipo sem mapa.
TIPO_PROPOSICAO = [
    ("PROJETO DE LEI COMPLEMENTAR", "projeto_lei_complementar"),
    ("PROJETO DE LEI", "projeto_lei"),
    ("PROJETO DE DECRETO LEGISLATIVO", "projeto_decreto_legislativo"),
    ("PROJETO DE RESOLUCAO", "projeto_resolucao"),
    ("PROJETO DE EMENDA A LEI ORGANICA", "proposta_emenda_lei_organica"),
    ("EMENDA A LEI ORGANICA", "emenda_lei_organica"),
    ("INDICACAO", "indicacao"),
    ("REQUERIMENTO", "requerimento"),
    ("MOCAO", "mocao"),
]

_RE_ANO = re.compile(r"/(\d{4})(?!\d)")
_RE_NUMERO = re.compile(r"N[º°o]?\.?\s*0*(\d+)", re.IGNORECASE)


# ─────────────────────────────── HTTP ─────────────────────────────────


def _tentar(fn, tentativas: int = 4, espera: float = 2.0):
    ultimo = None
    for i in range(tentativas):
        try:
            resp = fn()
            if resp.status_code == 200:
                return resp
            ultimo = RuntimeError(f"HTTP {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            ultimo = e
        time.sleep(espera * (i + 1))
    raise RuntimeError(f"falhou após {tentativas} tentativas: {ultimo}")


def _post_json(host: str, caminho: str):
    """`POST {host}{caminho}` -> JSON já decodificado.

    O `Content-Type` da resposta é `text/html; charset=utf-8` mesmo para
    estes endpoints (bug do fornecedor, não deste cliente) — mas o corpo é
    JSON válido com todo não-ASCII escapado em `\\uXXXX`, então `r.json()`
    decodifica certo independente do charset declarado (os dois só
    discordam em byte >0x7F, e aqui não há nenhum). Conferido byte a byte
    nesta sessão: nada a corrigir.
    """
    url = f"{host}{caminho}"
    resp = _tentar(lambda: _SESSAO.post(url, timeout=TIMEOUT))
    try:
        return resp.json()
    except ValueError as e:
        raise RuntimeError(f"{url}: resposta não é JSON válido: {e}") from e


# ──────────────────────── identidade da cidade ───────────────────────


def _sem_acento(texto: str) -> str:
    base = unicodedata.normalize("NFD", texto or "")
    return "".join(c for c in base if unicodedata.category(c) != "Mn")


def _normalizar(nome: str) -> str:
    return " ".join(_sem_acento(nome or "").upper().split())


def _espremer(texto) -> str:
    return " ".join(str(texto or "").split())


def _conferir_identidade(cidade: dict) -> str:
    """Mesma prova em camadas de `sapl.py`/`syssolution.py`: o host tem de
    carregar o nome da cidade (ou `camara_host_rotulo`), e a cidade tem de
    declarar ESTE coletor — nunca rodar às cegas com o host de outra câmara."""
    fontes = cidade.get("fontes") or {}

    host = fontes.get("camara_host")
    if not isinstance(host, str) or not host.startswith("http"):
        raise RuntimeError(
            f"municipios.fontes.camara_host ausente para {cidade['id_municipio']} "
            f"({cidade['nome']})."
        )
    coletor = fontes.get("camara_coletor")
    if coletor != COLETOR:
        raise RuntimeError(
            f"{cidade['nome']} declara camara_coletor={coletor!r}, não {COLETOR!r}. "
            "Este módulo recusa cidade que não é dele."
        )

    host = host.rstrip("/")
    dominio = (urlparse(host).hostname or "").lower()
    alvo = _sem_acento(cidade["nome"]).lower().replace(" ", "").replace("-", "")
    rotulo = fontes.get("camara_host_rotulo")
    if alvo and alvo in dominio.replace("-", "").replace(".", ""):
        regra = f"nome do município ({alvo!r}) presente no host"
    elif isinstance(rotulo, str) and rotulo and rotulo.lower() in dominio:
        regra = f"camara_host_rotulo ({rotulo!r}) presente no host"
    else:
        raise RuntimeError(
            f"host {host!r} não carrega o nome de {cidade['nome']!r} nem "
            "`fontes.camara_host_rotulo`. Recuso coletar."
        )
    print(f"{LOG} identidade conferida por {regra}; host={host}")
    return host


# ───────────────────────────── categorias ─────────────────────────────


def _listar_categorias(host: str) -> list[dict]:
    categorias = _post_json(host, "/publicacao/listarCategoria/")
    if not isinstance(categorias, list) or not categorias:
        raise RuntimeError(f"{host}: listarCategoria/ devolveu {categorias!r} — esperava uma lista")
    return categorias


def listar_categorias(id_municipio: str) -> None:
    """Imprime as 27 categorias e o que este módulo faz com cada uma —
    existe pra revisar o mapeamento (armadilha 4/7) sem gravar nada."""
    cidade = carregar_municipio(id_municipio)
    host = _conferir_identidade(cidade)
    categorias = _listar_categorias(host)
    for c in sorted(categorias, key=lambda c: c["nome"]):
        chave = _normalizar(c["nome"])
        if chave in CATEGORIAS_PROPOSICOES:
            destino = "proposicoes (tipo por item, ver TIPO_PROPOSICAO)"
        elif chave in CATEGORIA_ATO_PADRAO:
            destino = f"atos_oficiais (tipo={CATEGORIA_ATO_PADRAO[chave]!r})"
        else:
            destino = "-- sem mapa --"
        print(
            f"  id={c['id']:<4} {c['nome']:<32} atualizado={c.get('data_ultima_pub') or '(nunca)':<12} "
            f"-> {destino}"
        )


# ─────────────────────── número/ano (armadilhas 3 e 5) ────────────────


def _numero_ano(item: dict) -> tuple[int | None, int | None, bool]:
    """Devolve `(numero, ano, ano_incerto)`.

    `ano_incerto=True` só quando teve de cair para `data_publicacao` por
    falta de "/AAAA" no nome — sinal pra logar, não pra recusar (não
    aconteceu nenhuma vez nas categorias que este módulo lê, mas o próximo
    ano da câmara pode mudar isso)."""
    nome = item.get("nome") or ""

    numero = None
    bruto = str(item.get("numero_processo") or "").strip()
    if bruto.isdigit():
        numero = int(bruto)
    else:
        m = _RE_NUMERO.search(nome)
        if m:
            numero = int(m.group(1))

    m = _RE_ANO.search(nome)
    if m:
        return numero, int(m.group(1)), False

    dp = item.get("data_publicacao") or ""
    if len(dp) >= 4 and dp[:4].isdigit():
        return numero, int(dp[:4]), True
    return numero, None, False


# ───────────────────────── link do PDF (visualizar) ───────────────────


def _link_documento(host: str, item_id: int) -> str:
    """`pub.simpless.com.br/files/{pasta}/{arquivo}` do primeiro anexo
    público; cai para a página de visualização se não achar anexo liberado
    (restrito, ou é um `tipo_documento: link` sem `pasta`/`arquivo`)."""
    fallback = f"{host}/publicacao/visualizar/{item_id}"
    try:
        docs = _post_json(host, f"/publicacao/listarGridDocumento/{item_id}")
    except RuntimeError:
        return fallback
    if not isinstance(docs, list) or not docs:
        return fallback
    d = docs[0]
    if d.get("tipo_documento") == "documento" and d.get("tipo_acesso") == "publico":
        pasta, arquivo = d.get("pasta"), d.get("arquivo")
        if pasta and arquivo:
            return f"{ARQUIVOS_BASE}/{pasta}/{arquivo}"
    if d.get("tipo_documento") == "link" and d.get("link"):
        return d["link"]
    return fallback


# ─────────────────────────── proposições ──────────────────────────────


def _classificar_proposicao(nome: str) -> str | None:
    limpo = _normalizar(nome)
    for prefixo, tipo in TIPO_PROPOSICAO:
        if limpo.startswith(prefixo):
            return tipo
    return None


def _coletar_proposicoes(host: str, cidade: dict, categorias: list[dict]) -> tuple[list[dict], dict[str, int]]:
    id_municipio = cidade["id_municipio"]
    por_nome = {_normalizar(c["nome"]): c for c in categorias}

    brutos: list[dict] = []
    for chave in sorted(CATEGORIAS_PROPOSICOES):
        cat = por_nome.get(chave)
        if not cat:
            print(f"{LOG} AVISO: categoria {chave!r} não existe em listarCategoria/ desta câmara — pulando.")
            continue
        itens = _post_json(host, f"/publicacao/listarPublicacao/{cat['id']}")
        print(f"{LOG} {cat['nome']} (id={cat['id']}): {len(itens)} publicação(ões) na fonte.")
        brutos.extend(itens)

    linhas: list[dict] = []
    vistos: dict[tuple, int] = {}
    sem_tipo: dict[str, int] = {}
    ano_incerto = 0
    for item in brutos:
        nome = item.get("nome") or ""
        tipo = _classificar_proposicao(nome)
        if not tipo:
            chave = _normalizar(nome).split(" N")[0].strip() or nome
            sem_tipo[chave] = sem_tipo.get(chave, 0) + 1
            continue
        numero, ano, incerto = _numero_ano(item)
        if numero is None or ano is None:
            print(f"{LOG} AVISO: id={item.get('id')} {nome!r} sem número/ano reconhecível — não gravo.")
            continue
        if incerto:
            ano_incerto += 1

        chave_natural = (tipo, numero, ano)
        if chave_natural in vistos:
            print(
                f"{LOG} AVISO: {tipo} Nº{numero}/{ano} duplicado na fonte "
                f"(ids {vistos[chave_natural]} e {item.get('id')}) — mantendo o primeiro."
            )
            continue
        vistos[chave_natural] = item.get("id")

        ementa = _espremer(item.get("descricao"))
        linhas.append(
            {
                "id_municipio": id_municipio,
                "tipo": tipo,
                "numero": numero,
                "ano": ano,
                "ementa": ementa or None,
                # Data de UPLOAD no portal, não necessariamente do mesmo ano
                # do número do documento (armadilha 3) — preservada como a
                # fonte manda, não reconciliada à força com `ano`.
                "data_apresentacao": item.get("data_publicacao"),
                # A fonte não expõe autoria (ver docstring do módulo).
                "autores": [],
                "vereador_id": None,
                "link_fonte": _link_documento(host, item["id"]),
                "temas": classificar_texto(ementa),
            }
        )
        time.sleep(PAUSA_ANEXO)

    if ano_incerto:
        print(f"{LOG} AVISO: {ano_incerto} linha(s) usaram o ano de `data_publicacao` (nome sem '/AAAA').")
    return linhas, sem_tipo


def _gravar_proposicoes(client, linhas: list[dict], sem_tipo: dict[str, int]) -> None:
    if sem_tipo:
        print(f"{LOG} AVISO — nome(s) SEM MAPA de tipo (não gravados, não pontuariam no ranking):")
        for rotulo, n in sorted(sem_tipo.items(), key=lambda kv: -kv[1]):
            print(f"{LOG}   {n:>4}x  {rotulo!r}")
    if not linhas:
        print(f"{LOG} proposições: nada a gravar.")
        return
    upsert_com_colunas_opcionais(
        client,
        "proposicoes",
        linhas,
        ["temas", "data_apresentacao"],
        on_conflict="id_municipio,tipo,numero,ano",
    )
    com_ementa = sum(1 for r in linhas if r["ementa"])
    print(f"{LOG} proposicoes: {len(linhas)} gravada(s), {com_ementa} com ementa.")


# ────────────────────── atos oficiais (leis/decretos/...) ─────────────


def _classificar_ato(categoria_nome: str, nome: str) -> str:
    """Tipo padrão da categoria, com override só pra "Decreto Legislativo"
    dentro de Decretos (as duas espécies dividem a mesma categoria na
    fonte — ver armadilha no topo do módulo)."""
    if _normalizar(nome).startswith("DECRETO LEGISLATIVO"):
        return "Decreto Legislativo"
    return CATEGORIA_ATO_PADRAO[_normalizar(categoria_nome)]


def _coletar_atos(host: str, cidade: dict, categorias: list[dict]) -> list[dict]:
    id_municipio = cidade["id_municipio"]
    por_nome = {_normalizar(c["nome"]): c for c in categorias}

    linhas: list[dict] = []
    for chave in sorted(CATEGORIA_ATO_PADRAO):
        cat = por_nome.get(chave)
        if not cat:
            print(f"{LOG} AVISO: categoria {chave!r} não existe em listarCategoria/ desta câmara — pulando.")
            continue
        itens = _post_json(host, f"/publicacao/listarPublicacao/{cat['id']}")
        print(f"{LOG} {cat['nome']} (id={cat['id']}): {len(itens)} publicação(ões) na fonte.")
        for item in itens:
            nome = item.get("nome") or ""
            numero, ano, incerto = _numero_ano(item)
            if ano is None:
                print(f"{LOG} AVISO: id={item.get('id')} {nome!r} sem ano reconhecível — não gravo.")
                continue
            if incerto:
                print(f"{LOG} AVISO: id={item.get('id')} {nome!r} usou ano de data_publicacao (sem '/AAAA' no nome).")
            ementa = _espremer(item.get("descricao"))
            linhas.append(
                {
                    "id_municipio": id_municipio,
                    "tipo": _classificar_ato(cat["nome"], nome),
                    "numero": str(numero) if numero is not None else None,
                    "ano": ano,
                    "ementa": ementa or None,
                    "data_publicacao": item.get("data_publicacao"),
                    "link_fonte": _link_documento(host, item["id"]),
                    "temas": classificar_texto(ementa),
                }
            )
            time.sleep(PAUSA_ANEXO)
    return linhas


def _gravar_atos(cidade: dict, linhas: list[dict], permitir_reducao: bool) -> None:
    fontes = cidade.get("fontes") or {}
    dono = fontes.get("legislacao_fonte")
    if dono != FONTE_LEGISLACAO:
        raise RuntimeError(
            f"{cidade['nome']}: `fontes.legislacao_fonte` é {dono!r}, não {FONTE_LEGISLACAO!r}. "
            "Recuso escrever em atos_oficiais — o refresh total apagaria o acervo do dono."
        )
    if not linhas:
        print(f"{LOG} atos_oficiais: nada coletado — NÃO apago o que já existe.")
        return
    client = get_supabase_client()  # conexão nova: a coleta é longa
    refresh_completo_seguro(
        client,
        "atos_oficiais",
        {"id_municipio": cidade["id_municipio"]},
        linhas,
        permitir_reducao=permitir_reducao,
        rotulo="etl.camaras.simplesystem",
    )
    com_tema = sum(1 for r in linhas if r["temas"])
    print(f"{LOG} atos_oficiais: {len(linhas)} ato(s), {com_tema} com tema classificado.")


# ─────────────────────────────── sync ─────────────────────────────────


def sync(id_municipio: str, partes: set[str], *, permitir_reducao: bool = False) -> None:
    cidade = carregar_municipio(id_municipio)
    host = _conferir_identidade(cidade)
    categorias = _listar_categorias(host)

    # `client` só é aberto na hora de GRAVAR, nunca antes: a coleta de
    # proposições passa minutos em requisição HTTP (uma por publicação, pra
    # achar o PDF — `_link_documento`) sem tocar o banco nenhuma vez, e abrir
    # a conexão antes só deixaria uma sessão ociosa esse tempo todo à toa.
    # Mesmo padrão de `syssolution.py::sync` (`_gravar_proposicoes(get_supabase_client(), ...)`).
    if "proposicoes" in partes:
        linhas, sem_tipo = _coletar_proposicoes(host, cidade, categorias)
        _gravar_proposicoes(get_supabase_client(), linhas, sem_tipo)
    if "leis" in partes:
        _gravar_atos(cidade, _coletar_atos(host, cidade, categorias), permitir_reducao)


PARTES_VALIDAS = {"proposicoes", "leis"}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument("--partes", default="proposicoes,leis")
    parser.add_argument("--permitir-reducao", action="store_true")
    parser.add_argument("--listar-categorias", action="store_true")
    args = parser.parse_args()

    try:
        if args.listar_categorias:
            listar_categorias(args.id_municipio)
        else:
            partes = {p.strip() for p in args.partes.split(",") if p.strip()}
            invalidas = partes - PARTES_VALIDAS
            if invalidas:
                raise RuntimeError(f"parte(s) desconhecida(s): {sorted(invalidas)}")
            sync(args.id_municipio, partes, permitir_reducao=args.permitir_reducao)
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
