"""etl.camaras.sapl — vereadores e normas municipais de qualquer Câmara que
rode **SAPL 3.x** (Interlegis/Senado), lendo a API REST pública da casa.

Alvo inicial: Araçuaí-MG (3103405), `https://sapl.aracuai.mg.leg.br/`.

POR QUE ESTE MÓDULO É GENÉRICO, E NÃO "etl.camaras.aracuai". O eixo Cidades
tinha, até aqui, um raspador por cidade — `etl/prefeitura/` (Betim),
`etl/pbh/` (BH), `etl/psp/` (SP), mais um `camaras/<cidade>.py` para cada —,
seis tecnologias e zero reaproveitamento. O SAPL inverte essa conta: o
Interlegis distribui o mesmo sistema para centenas de câmaras e publica o
DIRETÓRIO das instalações, com a URL de cada casa
(`https://www12.senado.leg.br/interlegis/orgaosatendidos?uf=MG&servico=SAPL&tipocasa=CM`).
Escrito uma vez, este módulo atende qualquer uma delas trocando
`municipios.fontes.camara_host` — e a sub-ação `--descobrir` acha o host
sozinho. Provisionar a próxima câmara vira cadastro, não desenvolvimento.

═══ AS ARMADILHAS MEDIDAS AO VIVO (2026-08-07, Araçuaí) ═══

1. **A PAGINAÇÃO NÃO É A DO DJANGO REST FRAMEWORK.** Apesar de o SAPL ser
   DRF, o envelope é customizado:

       {"pagination": {"total_entries": 651, "total_pages": 66, "page": 1,
                       "next_page": 2, "links": {...}}, "results": [...]}

   Não há `count`/`next`/`previous`. Um cliente escrito para o padrão do DRF
   lê `results`, procura `next`, não acha, e PARA NO REGISTRO 10 achando que
   terminou — sem erro, sem aviso. Seriam 10 normas de 651. `_paginar()`
   trata isso e ainda CONFERE o total coletado contra `total_entries`; e
   `_envelope()` levanta se algum host devolver o formato do DRF, porque aí
   a premissa desta função mudou e o silêncio seria pior.

2. **`parlamentar.ativo` NÃO identifica quem está em exercício.** Em Araçuaí
   o endpoint devolve 15 parlamentares, todos com `ativo: true`, mas a casa
   tem 11 cadeiras: os outros 4 cumpriram só a 23ª Legislatura (2021-2024).
   Quem está em exercício sai do MANDATO — `titular=true` na legislatura
   corrente —, nunca da flag. Medido: 11 mandatos titulares na legislatura 1
   (23ª) e 11 na legislatura 2 (24ª, 2025-2028, marcada "(Atual)").

3. **`GET /api/` devolvendo 404 significa SAPL 2.x**, que não tem API REST.
   Isso é "pular esta casa", não "falhar a rodada" — `SaplSemAPI` sai com
   código 0 e imprime `SEM_API`, para que uma matriz de N câmaras não perca
   as outras N-1. `--exigir-api` inverte, para quando o host foi semeado à
   mão e o 404 é sintoma de erro de cadastro.

4. **401 em `protocoloadm/protocolo` e `base/appconfig` é "não publicado"**,
   não falha — e é determinístico, então NÃO se repete com retry.

5. **Endpoint vazio é dado.** Em Araçuaí, `materia/materialegislativa`,
   `materia/tramitacao`, `sessao/sessaoplenaria`, `sessao/registrovotacao` e
   `comissoes/comissao` devolvem 0 — a casa tem SAPL instalado e só alimenta
   normas e parlamentares. O log tem de DIZER isso; coleta vazia silenciosa
   é indistinguível de coletor quebrado.

═══ O QUE ESTE MÓDULO ESCREVE ═══

- `vereadores` — upsert por `(id_municipio, slug)`, só os titulares da
  legislatura corrente.
- `atos_oficiais` — refresh total das normas jurídicas, guardado por
  `municipios.fontes.legislacao_fonte`.

Uso:

    python -m etl.camaras.sapl --id-municipio 3103405
    python -m etl.camaras.sapl --id-municipio 3103405 --partes vereadores
    python -m etl.camaras.sapl --id-municipio 3103405 --listar-tipos
    python -m etl.camaras.sapl --id-municipio 3103405 --descobrir [--gravar]
"""
import argparse
import sys
import time
import unicodedata
from datetime import date
from urllib.parse import urljoin, urlparse

import requests

from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    carregar_municipio,
    get_supabase_client,
    refresh_completo_seguro,
    upsert_com_colunas_opcionais,
)
from etl.temas import classificar_texto

LOG = "[etl.camaras.sapl]"

# Valor de `municipios.fontes.camara_coletor` que este módulo atende. É chave
# de MÁQUINA e não deve ser confundida com `camara_sistema`, que já existe em
# produção ("PROLEGIS", "SIL", "SPLegis") e é RÓTULO DE TELA, impresso
# literalmente em `camara/proposicoes/page.tsx`.
COLETOR = "sapl"

# Tag de dono de `atos_oficiais`. A tabela não tem chave natural, então a
# única escrita possível é refresh total filtrando por `id_municipio` — que
# APAGA TUDO da cidade. Dois coletores sem dono declarado se apagariam
# alternadamente. Mesmo mecanismo de `fontes.contratos_fonte` no PNCP.
FONTE_LEGISLACAO = "camara_sapl"

# Diretório oficial de instalações do Interlegis (sub-ação `--descobrir`).
DIRETORIO_INTERLEGIS = "https://www12.senado.leg.br/interlegis/orgaosatendidos"

# `descricao` do tipo de norma no SAPL -> valor de `atos_oficiais.tipo`.
#
# O vocabulário é o mesmo de `etl/pbh/legislacao.py` e `etl/psp/legislacao.py`
# de propósito: a tela monta o filtro de categoria a partir DESTA coluna, e
# "LEI ORDINÁRIA" ao lado de "Lei Ordinária" racharia o filtro. Os 11 tipos
# abaixo foram lidos de `/api/norma/tiponormajuridica/` de Araçuaí; um tipo
# não mapeado NÃO é descartado — cai no Title Case da própria descrição, e
# `--listar-tipos` existe para revisar isso antes de gravar.
TIPO_NO_BANCO = {
    "LEI ORDINARIA": "Lei Ordinária",
    "LEI COMPLEMENTAR": "Lei Complementar",
    "LEI ORGANICA MUNICIPAL": "Lei Orgânica",
    "DECRETO": "Decreto",
    "DECRETO LEGISLATIVO": "Decreto Legislativo",
    "PORTARIA": "Portaria",
    "RESOLUCAO": "Resolução",
    "RESOLUCOES": "Resolução",
    # Achado por `--listar-tipos` antes da primeira carga: sem esta linha o
    # fallback Title Case gravaria "Resoluções Da Mesa", com a preposição em
    # maiúscula, e o filtro de categoria da tela mostraria isso ao usuário.
    "RESOLUCOES DA MESA": "Resolução da Mesa",
    "RESOLUCAO DA MESA": "Resolução da Mesa",
    "REGIMENTO INTERNO": "Regimento Interno",
    "INSTRUCAO NORMATIVA": "Instrução Normativa",
    "EMENDA A LEI ORGANICA": "Emenda à Lei Orgânica",
    "PROJETO DE EMENDA A RESOLUCAO": "Projeto de Emenda a Resolução",
    "ACAO DIRETA DE INCONSTITUCIONALIDADE": "Ação Direta de Inconstitucionalidade",
    "ACAO DIRETA DE INCONSTITUCIONALIDADE EM ANDAMENTO": "Ação Direta de Inconstitucionalidade",
}

_SESSAO = requests.Session()
_SESSAO.headers["User-Agent"] = (
    "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"
)
_SESSAO.headers["Accept"] = "application/json"

TIMEOUT = 60
PAGINA = 100  # o SAPL aceita `limit`; 10 é o default e renderia 66 páginas.


class SaplSemAPI(RuntimeError):
    """O host não expõe `/api/` — instalação SAPL 2.x. Pular, não falhar."""


# ─────────────────────────────── HTTP ────────────────────────────────


def _tentar(fn, tentativas: int = 4, espera: float = 3.0):
    """Retry linear, mas só do que ADIANTA repetir.

    404 e 401 são recusas determinísticas (endpoint inexistente / não
    publicado): repeti-las quatro vezes só gasta tempo e polui o log.
    """
    ultimo = None
    for i in range(tentativas):
        try:
            resp = fn()
            if resp.status_code == 200:
                return resp
            if resp.status_code in (401, 403, 404):
                return resp
            ultimo = RuntimeError(f"HTTP {resp.status_code}: {resp.text[:200]}")
        except Exception as e:  # timeout, reset de conexão
            ultimo = e
        time.sleep(espera * (i + 1))
    raise RuntimeError(f"falhou após {tentativas} tentativas: {ultimo}")


def _envelope(payload: dict, url: str) -> tuple[list[dict], dict]:
    """Desembrulha `{"pagination": {...}, "results": [...]}`.

    Levanta se o host devolver o envelope PADRÃO do DRF
    (`count`/`next`/`results`): significa que a premissa da armadilha 1
    mudou naquele host, e seguir em frente coletaria só a primeira página em
    silêncio. Falhar alto aqui é o ponto.
    """
    if not isinstance(payload, dict):
        raise RuntimeError(f"{url}: resposta não é um objeto JSON")
    if "pagination" not in payload and ("count" in payload or "next" in payload):
        raise RuntimeError(
            f"{url}: envelope no formato PADRÃO do DRF (count/next), não o do SAPL "
            "(pagination/results). Este módulo pagina pelo `pagination` — revise "
            "`_paginar()` antes de confiar no resultado."
        )
    return payload.get("results") or [], payload.get("pagination") or {}


def _paginar(host: str, recurso: str) -> list[dict]:
    """Todas as páginas de um recurso, conferindo o total anunciado.

    A conferência contra `total_entries` é o que transforma a armadilha 1 de
    "subcoleta silenciosa" em erro visível.
    """
    url = urljoin(host, f"api/{recurso}/")
    linhas: list[dict] = []
    pagina = 1
    anunciado = None
    while True:
        resp = _tentar(
            lambda: _SESSAO.get(
                url, params={"format": "json", "limit": PAGINA, "page": pagina}, timeout=TIMEOUT
            )
        )
        if resp.status_code in (401, 403):
            print(f"{LOG} {recurso}: HTTP {resp.status_code} — não publicado por esta casa.")
            return []
        if resp.status_code == 404:
            print(f"{LOG} {recurso}: HTTP 404 — recurso ausente nesta instalação.")
            return []
        resultados, pag = _envelope(resp.json(), url)
        if anunciado is None:
            anunciado = pag.get("total_entries")
        linhas.extend(resultados)
        proxima = pag.get("next_page")
        if not proxima or not resultados:
            break
        pagina = proxima

    if anunciado is not None and len(linhas) != anunciado:
        raise RuntimeError(
            f"{recurso}: coletei {len(linhas)} linha(s) mas a API anuncia {anunciado}. "
            "Paginação incompleta — não gravo com subcoleta."
        )
    return linhas


# ──────────────────────── identidade da cidade ───────────────────────


def _sem_acento(texto: str) -> str:
    base = unicodedata.normalize("NFD", texto or "")
    return "".join(c for c in base if unicodedata.category(c) != "Mn")


def _espremer(texto: str | None) -> str:
    """Colapsa espaço repetido. A fonte tem `"Danilo  Borges"` com dois
    espaços, e isso ia direto para a tela — o slug normaliza, o nome exibido
    não."""
    return " ".join((texto or "").split())


def _conferir_identidade(cidade: dict) -> str:
    """Prova, em camadas, que o host é o da cidade pedida — e devolve o host.

    POR QUE ISTO EXISTE. Um módulo genérico multiplica o defeito de 2026-08-03
    (`etl.apis.anp --id-municipio 3550308` coletou os postos de Betim e os
    gravou como de São Paulo). Lá o parâmetro errado vinha de um default de
    argparse; aqui viria de um host apontando para outra casa. O guarda de CI
    (`scripts/conferir_defaults_de_cidade.py`) varre `add_argument` e NÃO
    pegaria isso, então a prova tem de estar aqui.

    A camada 3 é a que importa: `.leg.br` é emitido por casa legislativa, e o
    nome do município está no host. Rodar `--id-municipio` de Itinga contra o
    host de Araçuaí aborta em vez de reetiquetar 651 normas.
    """
    fontes = cidade.get("fontes") or {}

    host = fontes.get("camara_host")
    if not isinstance(host, str) or not host.startswith("http"):
        raise RuntimeError(
            f"municipios.fontes.camara_host ausente para {cidade['id_municipio']} "
            f"({cidade['nome']}). Semeie o host antes de rodar — ou use --descobrir."
        )

    coletor = fontes.get("camara_coletor")
    if coletor != COLETOR:
        raise RuntimeError(
            f"{cidade['nome']} declara camara_coletor={coletor!r}, não {COLETOR!r}. "
            "Este módulo recusa cidade que não é dele (evita gravar dado de uma casa "
            "com o id de outra)."
        )

    alvo = _sem_acento(cidade["nome"]).lower().replace(" ", "").replace("-", "")
    dominio = (urlparse(host).hostname or "").lower()
    rotulo = fontes.get("camara_host_rotulo")
    if alvo and alvo in dominio.replace("-", "").replace(".", ""):
        regra = f"nome do município ({alvo!r}) presente no host"
    elif isinstance(rotulo, str) and rotulo and rotulo.lower() in dominio:
        regra = f"camara_host_rotulo ({rotulo!r}) presente no host"
    else:
        raise RuntimeError(
            f"host {host!r} não carrega o nome de {cidade['nome']!r} nem o "
            "`fontes.camara_host_rotulo`. Recuso coletar: sem essa prova, um host "
            "trocado grava o dado de uma câmara com o id de outra cidade, em silêncio."
        )
    print(f"{LOG} identidade conferida por {regra}; host={host}")
    return host if host.endswith("/") else host + "/"


def _conferir_api(host: str, exigir: bool) -> None:
    """`GET /api/` — 404 aqui é SAPL 2.x, que não tem REST."""
    resp = _tentar(lambda: _SESSAO.get(urljoin(host, "api/"), timeout=TIMEOUT))
    if resp.status_code == 404:
        msg = f"{host} não expõe /api/ — instalação SAPL 2.x (sem API REST)."
        if exigir:
            raise RuntimeError(msg + " (--exigir-api)")
        raise SaplSemAPI(msg)
    if resp.status_code != 200:
        raise RuntimeError(f"GET {host}api/ devolveu HTTP {resp.status_code}")


# ───────────────────────────── vereadores ────────────────────────────


def _slug(nome: str) -> str:
    base = _sem_acento(nome or "").lower()
    limpo = "".join(c if c.isalnum() else "-" for c in base)
    return "-".join(p for p in limpo.split("-") if p)


def _deduplicar_slug(slug: str, usados: set[str]) -> str:
    """Dois nomes que normalizam igual fariam upsert um por cima do outro.

    A chave natural de `vereadores` é `(id_municipio, slug)`, então a colisão
    não daria erro — daria um vereador a menos, sem sinal nenhum.
    """
    if slug not in usados:
        usados.add(slug)
        return slug
    n = 2
    while f"{slug}-{n}" in usados:
        n += 1
    final = f"{slug}-{n}"
    usados.add(final)
    print(f"{LOG} AVISO: slug {slug!r} colidiu; gravando o segundo como {final!r}.")
    return final


def _legislatura_corrente(legislaturas: list[dict]) -> dict | None:
    """A legislatura que contém hoje; senão, a de maior número.

    Não uso o `(Atual)` que o SAPL põe no `__str__` porque é texto de
    apresentação e não contrato.
    """
    hoje = date.today().isoformat()
    for l in legislaturas:
        ini, fim = l.get("data_inicio"), l.get("data_fim")
        if ini and fim and ini <= hoje <= fim:
            return l
    return max(legislaturas, key=lambda l: l.get("numero") or 0) if legislaturas else None


def _coletar_vereadores(host: str, cidade: dict) -> list[dict]:
    id_municipio = cidade["id_municipio"]
    parlamentares = _paginar(host, "parlamentares/parlamentar")
    mandatos = _paginar(host, "parlamentares/mandato")
    legislaturas = _paginar(host, "parlamentares/legislatura")
    filiacoes = _paginar(host, "parlamentares/filiacao")
    partidos = _paginar(host, "parlamentares/partido")

    if not parlamentares:
        print(f"{LOG} nenhum parlamentar publicado — nada a gravar.")
        return []

    corrente = _legislatura_corrente(legislaturas)
    if not corrente:
        raise RuntimeError("nenhuma legislatura publicada — não dá para saber quem está em exercício.")
    print(
        f"{LOG} legislatura corrente: {corrente.get('numero')}ª "
        f"({corrente.get('data_inicio')} a {corrente.get('data_fim')})"
    )

    # ARMADILHA 2: quem está em exercício sai do MANDATO titular na
    # legislatura corrente, nunca de `parlamentar.ativo` — que em Araçuaí é
    # `true` para os 15, inclusive os 4 que só serviram a legislatura passada.
    em_exercicio = {
        m["parlamentar"]: m
        for m in mandatos
        if m.get("legislatura") == corrente.get("id") and m.get("titular")
    }

    sigla_por_id = {p["id"]: (p.get("sigla") or "").strip() for p in partidos}
    partido_por_parlamentar: dict[int, str] = {}
    for f in filiacoes:
        if f.get("data_desfiliacao"):
            continue
        sigla = sigla_por_id.get(f.get("partido"))
        if sigla:
            partido_por_parlamentar[f["parlamentar"]] = sigla

    linhas: list[dict] = []
    usados: set[str] = set()
    for p in sorted(parlamentares, key=lambda x: x.get("id") or 0):
        mandato = em_exercicio.get(p["id"])
        if not mandato:
            continue
        nome_urna = _espremer(p.get("nome_parlamentar") or p.get("nome_completo"))
        if not nome_urna:
            continue
        foto = (p.get("fotografia") or "").strip() or None
        # O SAPL devolve a foto em http:// absoluto; o portal serve https, e
        # imagem em http vira conteúdo misto bloqueado pelo navegador.
        if foto and foto.startswith("http://"):
            foto = "https://" + foto[len("http://") :]
        linhas.append(
            {
                "id_municipio": id_municipio,
                "slug": _deduplicar_slug(_slug(nome_urna), usados),
                "nome": _espremer(p.get("nome_completo")) or nome_urna,
                "nome_urna": nome_urna,
                "partido": partido_por_parlamentar.get(p["id"]),
                "foto_url": foto,
                "email": (p.get("email") or "").strip() or None,
                "biografia": (p.get("biografia") or "").strip() or None,
                "profissao": (p.get("profissao") or "").strip() or None,
                "mandato_inicio": mandato.get("data_inicio_mandato"),
                "mandato_fim": mandato.get("data_fim_mandato"),
                # `ativo`/`situacao_mandato` têm CHECK de coerência (migration
                # 0039): gravar um sem o outro estoura a rodada inteira.
                "ativo": True,
                "situacao_mandato": "em_exercicio",
            }
        )

    ignorados = len(parlamentares) - len(linhas)
    if ignorados:
        print(
            f"{LOG} {ignorados} parlamentar(es) sem mandato titular na legislatura corrente "
            "— fora da contagem de cadeiras, de propósito (ver armadilha 2 no topo)."
        )
    return linhas


def _gravar_vereadores(client, cidade: dict, linhas: list[dict]) -> None:
    if not linhas:
        print(f"{LOG} vereadores: nada coletado, nada gravado.")
        return
    esperado = (cidade.get("fontes") or {}).get("camara_cadeiras")
    if isinstance(esperado, int) and len(linhas) != esperado:
        print(
            f"{LOG} AVISO: coletei {len(linhas)} vereador(es) mas `camara_cadeiras` diz "
            f"{esperado}. Confira a fonte antes de confiar na composição da Casa."
        )
    upsert_com_colunas_opcionais(
        client,
        "vereadores",
        linhas,
        ["situacao_mandato", "profissao", "biografia"],
        on_conflict="id_municipio,slug",
    )
    print(f"{LOG} vereadores: {len(linhas)} gravado(s).")


# ─────────────────────────────── normas ──────────────────────────────


def _rotulo_tipo(descricao: str) -> str:
    chave = " ".join(_sem_acento(descricao or "").upper().split())
    if chave in TIPO_NO_BANCO:
        return TIPO_NO_BANCO[chave]
    # Tipo não catalogado não é descartado: entra em Title Case para não
    # sumir da tela. `--listar-tipos` existe para revisar isto sem coletar.
    return (descricao or "").strip().title() or "Norma"


def _coletar_normas(host: str, cidade: dict) -> list[dict]:
    id_municipio = cidade["id_municipio"]
    tipos = {t["id"]: _rotulo_tipo(t.get("descricao") or t.get("sigla") or "") for t in _paginar(host, "norma/tiponormajuridica")}
    normas = _paginar(host, "norma/normajuridica")
    if not normas:
        print(f"{LOG} normas: fonte VAZIA (0 registros). Não é falha de coleta — a casa não publica.")
        return []

    linhas = []
    for n in normas:
        ementa = _espremer(n.get("ementa"))
        linhas.append(
            {
                "id_municipio": id_municipio,
                "tipo": tipos.get(n.get("tipo"), "Norma"),
                "numero": str(n.get("numero") or "").strip() or None,
                "ano": n.get("ano"),
                "ementa": ementa or None,
                "data_publicacao": n.get("data_publicacao") or n.get("data"),
                "link_fonte": urljoin(host, f"norma/{n['id']}"),
                "temas": classificar_texto(ementa),
            }
        )
    return linhas


def _gravar_normas(cidade: dict, linhas: list[dict], permitir_reducao: bool) -> None:
    id_municipio = cidade["id_municipio"]
    fontes = cidade.get("fontes") or {}

    # `atos_oficiais` não tem chave natural: a escrita é refresh total
    # filtrando só por `id_municipio`, ou seja, um DELETE de tudo que a
    # cidade tem. Sem dono declarado, dois coletores se apagariam
    # alternadamente a cada rodada, e ninguém veria — cada um veria a própria
    # carga completa.
    dono = fontes.get("legislacao_fonte")
    if dono != FONTE_LEGISLACAO:
        raise RuntimeError(
            f"{cidade['nome']}: `fontes.legislacao_fonte` é {dono!r}, não {FONTE_LEGISLACAO!r}. "
            "Recuso escrever em atos_oficiais — o refresh total apagaria o acervo do "
            "coletor que é dono da cidade."
        )
    if not linhas:
        print(f"{LOG} normas: nada coletado — NÃO apago o que já existe.")
        return

    # Conexão nova para gravar: a coleta pode passar do tempo de ociosidade
    # que a Neon tolera. Mesmo motivo de `etl/pbh/legislacao.py`.
    client = get_supabase_client()
    refresh_completo_seguro(
        client,
        "atos_oficiais",
        {"id_municipio": id_municipio},
        linhas,
        permitir_reducao=permitir_reducao,
        rotulo="etl.camaras.sapl",
    )
    com_tema = sum(1 for r in linhas if r["temas"])
    com_ementa = sum(1 for r in linhas if r["ementa"])
    print(
        f"{LOG} atos_oficiais: {len(linhas)} norma(s) — {com_ementa} com ementa, "
        f"{com_tema} com tema classificado."
    )


# ─────────────────────────── sub-ações extras ────────────────────────


def listar_tipos(id_municipio: str) -> None:
    """Imprime os tipos de norma da casa e como cada um cairia no banco.

    Uma requisição. Existe para revisar o vocabulário ANTES de gravar
    centenas de linhas com um rótulo que a tela não sabe filtrar.
    """
    cidade = carregar_municipio(id_municipio)
    host = _conferir_identidade(cidade)
    _conferir_api(host, exigir=False)
    for t in _paginar(host, "norma/tiponormajuridica"):
        desc = t.get("descricao") or t.get("sigla") or ""
        chave = " ".join(_sem_acento(desc).upper().split())
        marca = "" if chave in TIPO_NO_BANCO else "   <-- NÃO CATALOGADO"
        print(f"  {t.get('sigla',''):<6} {desc:<50} -> {_rotulo_tipo(desc)}{marca}")


def descobrir(id_municipio: str, gravar: bool) -> None:
    """Acha o SAPL da cidade no diretório oficial do Interlegis.

    A UF sai de `municipios`, nunca da linha de comando — um `--uf MG` com
    default seria exatamente o defeito que `scripts/conferir_defaults_de_cidade.py`
    procura. Nunca varre e grava N casas de uma vez: cidade não semeada faz
    `carregar_municipio` abortar, que é o comportamento certo.
    """
    cidade = carregar_municipio(id_municipio)
    uf = cidade["uf"]
    alvo = _sem_acento(cidade["nome"]).lower().replace(" ", "")
    achados: list[str] = []
    for pagina in range(1, 60):
        resp = _tentar(
            lambda: _SESSAO.get(
                DIRETORIO_INTERLEGIS,
                params={"p": pagina, "uf": uf, "servico": "SAPL", "tipocasa": "CM"},
                timeout=TIMEOUT,
                headers={"Accept": "text/html"},
            ),
            tentativas=3,
        )
        if resp.status_code != 200:
            break
        html = resp.text
        for pedaco in html.split("http")[1:]:
            url = "http" + pedaco.split('"')[0].split("<")[0].strip()
            hospedeiro = (urlparse(url).hostname or "").lower()
            if "sapl." in hospedeiro and alvo in hospedeiro.replace("-", ""):
                achados.append(url)
        if achados:
            break

    unicos = sorted(set(u.rstrip("/") + "/" for u in achados))
    if not unicos:
        print(f"{LOG} nada achado para {cidade['nome']}-{uf} no diretório do Interlegis.")
        return
    for u in unicos:
        print(f"{LOG} candidato: {u}")
    escolhido = unicos[0]
    if not gravar:
        print(
            f"{LOG} para semear (sem --gravar não escrevo nada):\n"
            f"  update municipios set fontes = coalesce(fontes,'{{}}'::jsonb) || "
            f"'{{\"camara_host\": \"{escolhido}\", \"camara_coletor\": \"{COLETOR}\"}}'::jsonb\n"
            f"   where id_municipio = '{id_municipio}';"
        )
        return
    client = get_supabase_client()
    fontes = dict(cidade.get("fontes") or {})
    fontes.update({"camara_host": escolhido, "camara_coletor": COLETOR})
    client.table("municipios").update({"fontes": fontes}).eq("id_municipio", id_municipio).execute()
    print(f"{LOG} gravado camara_host={escolhido} em {id_municipio}.")


# ─────────────────────────────── sync ────────────────────────────────


def sync(
    id_municipio: str,
    partes: set[str],
    *,
    permitir_reducao: bool = False,
    exigir_api: bool = False,
) -> None:
    cidade = carregar_municipio(id_municipio)
    host = _conferir_identidade(cidade)
    _conferir_api(host, exigir_api)

    client = get_supabase_client()

    if "vereadores" in partes:
        _gravar_vereadores(client, cidade, _coletar_vereadores(host, cidade))

    if "normas" in partes:
        _gravar_normas(cidade, _coletar_normas(host, cidade), permitir_reducao)

    # Estes existem no SAPL mas vieram VAZIOS em Araçuaí. Sondar e dizer o
    # número é o que separa "a casa não publica" de "o coletor quebrou".
    if "sondar" in partes:
        for recurso in (
            "materia/materialegislativa",
            "materia/tramitacao",
            "sessao/sessaoplenaria",
            "sessao/registrovotacao",
            "comissoes/comissao",
        ):
            print(f"{LOG} sonda {recurso}: {len(_paginar(host, recurso))} registro(s).")


PARTES_VALIDAS = {"vereadores", "normas", "sondar"}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    # `--id-municipio` é a ÚNICA coisa que o operador escolhe. Todo o resto
    # (host, UF, nome) sai de `municipios` — ver `conferir_defaults_de_cidade.py`.
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument(
        "--partes",
        default="vereadores,normas",
        help=f"lista por vírgula: {sorted(PARTES_VALIDAS)}",
    )
    parser.add_argument("--permitir-reducao", action="store_true")
    parser.add_argument(
        "--exigir-api",
        action="store_true",
        help="404 em /api/ vira erro em vez de 'pular casa SAPL 2.x'",
    )
    parser.add_argument("--listar-tipos", action="store_true")
    parser.add_argument("--descobrir", action="store_true")
    parser.add_argument("--gravar", action="store_true", help="com --descobrir, persiste o host")
    args = parser.parse_args()

    try:
        if args.descobrir:
            descobrir(args.id_municipio, args.gravar)
        elif args.listar_tipos:
            listar_tipos(args.id_municipio)
        else:
            partes = {p.strip() for p in args.partes.split(",") if p.strip()}
            invalidas = partes - PARTES_VALIDAS
            if invalidas:
                raise RuntimeError(f"parte(s) desconhecida(s): {sorted(invalidas)}")
            sync(
                args.id_municipio,
                partes,
                permitir_reducao=args.permitir_reducao,
                exigir_api=args.exigir_api,
            )
    except SaplSemAPI as e:
        # Saída 0 de propósito: numa matriz de N câmaras, uma instalação 2.x
        # não pode derrubar as outras N-1.
        print(f"{LOG} SEM_API: {e}")
        sys.exit(0)
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
