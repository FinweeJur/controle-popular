"""etl.apis.brasilapi — enriquecimento pontual via BrasilAPI (https://brasilapi.com.br/api).

FONTE: BrasilAPI, agregador público brasileiro. 43 operações, todas GET,
gratuitas, SEM chave (o spec OpenAPI não tem `securitySchemes`). O spec não
está em /api/docs nem /docs/swagger.json (404): vem embutido no HTML de
https://brasilapi.com.br/docs, em `__NEXT_DATA__ -> props.pageProps.spec`.

  LIMITE CONTRATUAL — LEIA ANTES DE AUMENTAR QUALQUER TETO 
  O README da BrasilAPI PROÍBE crawling automatizado: "O volume de consultas
  deve ter a natureza de uma pessoa real requisitando um determinado dado".
  Isso VETA usar a BrasilAPI como ETL de varredura. Este módulo é
  deliberadamente um enriquecimento PONTUAL e COM TETO: `--max-consultas`
  (padrão baixo) e `--intervalo` de sono entre chamadas. Não remova nenhum
  dos dois, e não chame estas funções em laço sobre uma tabela inteira. Para
  volume, a fonte correta deste projeto é `etl/bd/cnpj.py` (Base dos
  Dados/BigQuery), que existe justamente para isso.

VERIFICADO AO VIVO EM 2026-08-03 (o que foi medido, não o que a doc promete):

1. `/cnpj/v1/{cnpj}` — 200 devolve 48 campos, incluindo o QSA completo e, o
   que resolve um bug histórico deste projeto, a situação cadastral nos DOIS
   formatos no MESMO objeto:
       situacao_cadastral: 2   (int, código da RFB)
       descricao_situacao_cadastral: "ATIVA"   (texto)
   O `etl/alertas.py` já comparou o código numérico contra texto e produziu
   97,6% de falso positivo (562/576 contratos marcados). Este módulo grava
   SEMPRE o campo de TEXTO (`descricao_situacao_cadastral`) em
   `fornecedores.situacao_cadastral`. Ver `_texto_situacao()`.
   Também devolve endereço (`cep`, `bairro`, `logradouro`, `municipio`) —
   hoje sem coluna correspondente em `fornecedores`, então é ignorado.

2. `/cnpj/v1/` é FORTEMENTE limitado por taxa, ao contrário do que a
   ausência de header `X-RateLimit-*` sugere. Medido nesta máquina:
   requisições espaçadas de 21s devolveram 429 em 4 de 5 tentativas
   seguidas; depois de um 429 o endpoint só voltou a responder 200 ~50-90s
   depois; mesmo espaçando 45s, 3 tentativas seguidas deram 429. É um balde
   pequeno que enche devagar. Consequência de projeto: `--intervalo` alto
   por padrão, `tenacity` com espera longa no 429, e um CNPJ que falhar é
   PULADO (não aborta a rodada) — ver `_consultar_cnpj_tolerante()`.
   Ordem de grandeza REAL medida: ~1 CNPJ resolvido por 60-90s. Ou seja, o
   teto de 200 é uma rodada de VÁRIAS HORAS, não de minutos — na prática
   use `--max-consultas` na casa das dezenas e rode mais vezes. A fila é
   ordenada e determinística justamente para retomar de onde parou.

3. `/cep/v2/{cep}` — balde SEPARADO e bem mais folgado: 8 requisições
   espaçadas de 2s, nenhum 429. MAS a "geolocalização" que a v2 anuncia é
   letra morta na prática: `location.coordinates` veio VAZIO (`{}`) em
   100% dos CEPs testados (32600412, 01310100, 30140071, 32671502,
   99999999), todos servidos por `service: "open-cep"`. Ausência de
   coordenada é o CASO NORMAL, não erro. `bairro`/`city`/`street` vêm bem.
   CEP inexistente devolve 404 com corpo JSON `CepPromiseError`.

4. QUEBRADOS, não tente: a FIPE inteira (4 rotas, 403 persistente do
   upstream) e `/cptec/v1/clima/capital` (500). `/cptec/v1/clima/aeroporto`
   responde 200 mas com todos os campos "undefined".

5. `etl/apis/feriados.py` já usa `/feriados/v1/{ano}` e NÃO é tocado aqui.

O QUE ESTE MÓDULO FAZ, E O QUE ELE ACHOU DE VERDADE NO BANCO (Betim,
3106705, medido 2026-08-03 — leia antes de esperar resultado):

(a) `fornecedores` — enriquecimento REAL, é aqui que está o ganho.
    `fornecedores` NÃO tem coluna `id_municipio` (é global, chave `cnpj`);
    "os fornecedores de um município" só existem via
    `contratos.fornecedor_cnpj` — mesmo caminho de `etl/bd/cnpj.py`.
    Betim: 676 CNPJs distintos em `contratos`, 658 com 14 dígitos, e 171
    deles SEM NENHUMA linha em `fornecedores` (o BigQuery não os trouxe).
    Esse é o buraco que a BrasilAPI tapa.
    Já a hipótese do enunciado — "sem situação cadastral ou com o campo em
    formato numérico" — NÃO se confirmou: hoje são 0 nulos e 0 numéricos
    (485 ATIVA, 1 BAIXADA, 1 INAPTA), porque `etl/bd/cnpj.py` já traduz o
    código via `_SITUACAO_CADASTRAL_LABELS`. O código abaixo continua
    cobrindo os dois casos (são baratos e voltam se o BD mudar), mas o
    alvo que realmente rende é a linha AUSENTE.
    Também preenche `cnae_descricao`, hoje NULL nas 487 linhas (o BigQuery
    não traz a descrição do CNAE; a BrasilAPI traz).

(b) CEP -> bairro/coordenada: IMPLEMENTADO, mas hoje NÃO tem em que rodar,
    e isso é um achado, não uma omissão. Nenhuma tabela do schema `public`
    tem coluna de CEP — varri `information_schema.columns` por
    `%cep%`/`%postal%`: zero. `comercios_essenciais` tem
    (bairro, endereco, lat, lng) e `zap_estabelecimentos` tem só `bairro`
    (nem lat/lng existem lá). Então o CEP, quando existir, só pode vir de
    dentro do texto de `endereco` — é de lá que `_cep_do_endereco()` o
    extrai. Hoje os 30 registros de Betim têm `endereco` no formato
    "Rua X 140", sem CEP: a passagem roda e reporta 0 candidatos.
    Somado ao item 3 (coordenada sempre vazia), a metade
    "CEP -> coordenada" da ideia original não se sustenta na fonte; o que
    a BrasilAPI entrega de fato é CEP -> bairro.
    A regra anti-regressão está implementada de qualquer jeito: NUNCA
    sobrescrever bairro/lat/lng existente com None. Esse erro exato já
    aconteceu neste projeto (`etl/apis/osm_comercios.py` apagava telefones
    confirmados a cada rodada até ganhar a proteção que tem hoje).

(c) `consultar_cnpj()` / `consultar_cep()` são as funções reutilizáveis
    para outros módulos importarem, já com o cuidado de taxa embutido.

Cron: sob demanda. NÃO agende em laço curto — ver o limite contratual.
"""
import argparse
import re
import sys
import time

import requests
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from etl.common import ID_MUNICIPIO_DEFAULT, carregar_municipio, get_supabase_client

BASE_URL = "https://brasilapi.com.br/api"
CNPJ_URL = BASE_URL + "/cnpj/v1/{cnpj}"
CEP_URL = BASE_URL + "/cep/v2/{cep}"

# Teto duro de chamadas por rodada. Existe por causa do limite CONTRATUAL
# (crawling proibido), não por medo de erro: mesmo que a API aguentasse,
# varrer os 658 CNPJs de Betim de uma vez violaria "a natureza de uma
# pessoa real requisitando um determinado dado".
MAX_CONSULTAS_PADRAO = 200

# Espaçamento entre chamadas ao /cnpj/v1. 20s foi escolhido a partir da
# medição de 2026-08-03 (21s ainda tomou 429 em 4/5, com recuperação em
# ~50-90s): sozinho ele NÃO evita o 429, e não é para evitar mesmo — quem
# absorve o 429 é o retry de `consultar_cnpj`. O intervalo serve para não
# martelar o endpoint entre as tentativas.
INTERVALO_CNPJ_PADRAO = 20.0

# O /cep/v2 tem balde próprio e folgado (8 req a 2s, zero 429 medido).
INTERVALO_CEP_PADRAO = 2.0

TIMEOUT = 40

# Rótulos da RFB, iguais aos de `etl/bd/cnpj.py`. Só entram em ação se a
# BrasilAPI algum dia parar de mandar `descricao_situacao_cadastral`; o
# caminho normal usa o texto que já vem pronto.
_SITUACAO_POR_CODIGO = {
    "1": "NULA",
    "2": "ATIVA",
    "3": "SUSPENSA",
    "4": "INAPTA",
    "8": "BAIXADA",
}

# `porte` é o MESMO tipo de armadilha da situação cadastral, um nível
# abaixo do radar. O BigQuery grava o CÓDIGO da RFB e as 487 linhas de
# `fornecedores` hoje são só '1' (256), '5' (159) e '3' (72) — enquanto a
# BrasilAPI devolve o TEXTO ("DEMAIS", "MICRO EMPRESA"). Gravar o texto
# deixaria a coluna com dois vocabulários misturados, que é exatamente a
# forma do bug que deu 97,6% de falso positivo em `situacao_cadastral`,
# só que ainda sem ninguém tropeçar nele. Normalizamos para o código, que
# é o formato dominante e o da fonte principal.
# (Diferente da situação cadastral, onde o alvo é o TEXTO: lá a regra de
# alerta compara contra "ATIVA". O critério não é "texto é sempre melhor",
# é "uma coluna, um vocabulário — o que a fonte principal já usa".)
_PORTE_PARA_CODIGO = {
    "NAO INFORMADO": "0",
    "MICRO EMPRESA": "1",
    "EMPRESA DE PEQUENO PORTE": "3",
    "DEMAIS": "5",
}


def _codigo_porte(dados: dict) -> str | None:
    """Porte no mesmo vocabulário (código RFB) já usado em `fornecedores`.

    `codigo_porte` vem pronto no payload quando existe; o texto é só o
    plano B. Texto desconhecido é devolvido como veio, para não inventar
    código errado em silêncio — melhor um valor estranho e visível do que
    um valor plausível e falso.
    """
    codigo = dados.get("codigo_porte")
    if codigo not in (None, ""):
        return str(codigo).lstrip("0") or "0"
    texto = (dados.get("porte") or "").strip().upper()
    if not texto:
        return None
    return _PORTE_PARA_CODIGO.get(texto, texto)


# CEP dentro de texto livre: 8 dígitos, com ou sem o hífen do 5º dígito.
# `(?<!\d)`/`(?!\d)` impedem casar um pedaço de um número maior (um
# telefone com DDD ou um CNPJ colado no endereço viravam "CEP" sem isso).
_RE_CEP = re.compile(r"(?<!\d)(\d{5})-?(\d{3})(?!\d)")


class RateLimitBrasilAPI(Exception):
    """429. Tipo próprio para o `tenacity` poder repetir SÓ este caso e
    deixar 404/500 passarem direto (404 não melhora com espera)."""


def _so_digitos(valor: str | None) -> str:
    return "".join(ch for ch in (valor or "") if ch.isdigit())


def _texto_situacao(dados: dict) -> str | None:
    """A situação cadastral em TEXTO, sempre.

    O bug que isto impede é real e caro: `etl/alertas.py` (regra_7) comparou
    `situacao_cadastral != "ATIVA"` contra o CÓDIGO numérico da RFB e marcou
    562 de 576 contratos como fornecedor irregular — 97,6% de falso
    positivo. A BrasilAPI manda os dois campos no mesmo objeto, então é
    trivial pegar o errado por distração: `situacao_cadastral` é o int (2) e
    `descricao_situacao_cadastral` é o texto ("ATIVA"). Preferimos o texto e
    só caímos na tradução do código se o texto vier vazio.
    """
    texto = (dados.get("descricao_situacao_cadastral") or "").strip()
    if texto:
        return texto.upper()
    codigo = dados.get("situacao_cadastral")
    if codigo is None:
        return None
    return _SITUACAO_POR_CODIGO.get(str(codigo).strip(), str(codigo))


def _parece_codigo_numerico(valor) -> bool:
    """True para "2"/"8" etc. — situação gravada como código em vez de
    texto, que é exatamente o formato que envenenou a regra de alerta."""
    return valor is not None and str(valor).strip().isdigit()


@retry(
    retry=retry_if_exception_type(RateLimitBrasilAPI),
    stop=stop_after_attempt(6),
    wait=wait_exponential(multiplier=1, min=15, max=120),
    reraise=True,
)
def consultar_cnpj(cnpj: str) -> dict | None:
    """Consulta um CNPJ. Devolve o JSON, ou None se não existir (404).

    Reutilizável por outros módulos. Repete SÓ no 429, com espera longa
    (15s -> 120s): medido em 2026-08-03, o endpoint fica 429 por ~50-90s
    depois de esvaziar o balde, então backoff curto só gasta tentativa.
    Quem chama em laço deve respeitar `--max-consultas` (limite contratual).
    """
    cnpj = _so_digitos(cnpj)
    if len(cnpj) != 14:
        raise ValueError(f"CNPJ precisa ter 14 dígitos, veio {cnpj!r}")
    resp = requests.get(CNPJ_URL.format(cnpj=cnpj), timeout=TIMEOUT)
    if resp.status_code == 429:
        raise RateLimitBrasilAPI(f"429 em /cnpj/v1/{cnpj}")
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    return resp.json()


@retry(
    retry=retry_if_exception_type(RateLimitBrasilAPI),
    stop=stop_after_attempt(4),
    wait=wait_exponential(multiplier=1, min=5, max=60),
    reraise=True,
)
def consultar_cep(cep: str) -> dict | None:
    """Consulta um CEP na v2. Devolve o JSON, ou None se não existir (404).

    ATENÇÃO a quem for usar `location.coordinates`: a v2 ANUNCIA
    geolocalização mas entrega `{}` na prática (100% dos CEPs testados em
    2026-08-03, todos via `service: "open-cep"`). Trate coordenada ausente
    como normal. `coordenadas_do_cep()` já faz isso.
    """
    cep = _so_digitos(cep)
    if len(cep) != 8:
        raise ValueError(f"CEP precisa ter 8 dígitos, veio {cep!r}")
    resp = requests.get(CEP_URL.format(cep=cep), timeout=TIMEOUT)
    if resp.status_code == 429:
        raise RateLimitBrasilAPI(f"429 em /cep/v2/{cep}")
    if resp.status_code == 404:
        # 404 aqui é "nenhum dos serviços de CEP conhece esse número"
        # (corpo JSON `CepPromiseError`), inclusive para CEPs bem formados
        # mas não atribuídos — caso comum, não é falha da rodada.
        return None
    resp.raise_for_status()
    return resp.json()


def coordenadas_do_cep(dados: dict) -> tuple[float, float] | None:
    """(lat, lng) do payload de CEP, ou None quando não vier.

    Devolve None em vez de (None, None) de propósito: o chamador não tem
    como esquecer de checar. É a diferença entre não gravar nada e gravar
    NULL por cima de uma coordenada boa.
    """
    coords = ((dados or {}).get("location") or {}).get("coordinates") or {}
    lat, lng = coords.get("latitude"), coords.get("longitude")
    if lat in (None, "") or lng in (None, ""):
        return None
    try:
        return float(lat), float(lng)
    except (TypeError, ValueError):
        return None


def _cep_do_endereco(endereco: str | None) -> str | None:
    """Extrai um CEP de dentro do texto de `endereco`.

    Necessário porque NENHUMA tabela do schema tem coluna de CEP (varredura
    em `information_schema.columns` por `%cep%`/`%postal%` em 2026-08-03:
    zero resultados). Se algum dia entrar uma coluna `cep` de verdade, o
    lugar certo é ler dela e aposentar esta função.
    """
    if not endereco:
        return None
    achado = _RE_CEP.search(endereco)
    return achado.group(1) + achado.group(2) if achado else None


def _consultar_cnpj_tolerante(cnpj: str) -> tuple[dict | None, str | None]:
    """(dados, erro). Um CNPJ problemático não pode derrubar a rodada
    inteira — depois de ~20s de espera por consulta, perder as 30 já feitas
    por causa da 31ª seria caro. Erro vira aviso e o laço segue."""
    try:
        return consultar_cnpj(cnpj), None
    except RateLimitBrasilAPI:
        return None, "429 persistente (balde da BrasilAPI vazio)"
    except requests.RequestException as e:
        return None, f"{type(e).__name__}"
    except ValueError as e:
        return None, str(e)


def linha_fornecedor_brasilapi(cnpj: str, dados: dict) -> dict:
    """Mapeia o payload da BrasilAPI para as colunas REAIS de
    `fornecedores` (conferidas em `information_schema` em 2026-08-03).
    A tabela não tem `id_municipio` — a chave é só `cnpj`.
    `cep`/`bairro`/`logradouro`/`municipio`, que a API manda, não têm coluna
    aqui e por isso são descartados de propósito.
    """
    return {
        "cnpj": cnpj,
        "razao_social": dados.get("razao_social"),
        "nome_fantasia": dados.get("nome_fantasia") or None,
        "situacao_cadastral": _texto_situacao(dados),
        "cnae_principal": str(dados["cnae_fiscal"]) if dados.get("cnae_fiscal") else None,
        "cnae_descricao": dados.get("cnae_fiscal_descricao"),
        "capital_social": dados.get("capital_social"),
        "porte": _codigo_porte(dados),
        "data_abertura": dados.get("data_inicio_atividade"),
        "municipio_sede": (
            str(dados["codigo_municipio_ibge"]) if dados.get("codigo_municipio_ibge") else None
        ),
        "uf_sede": dados.get("uf"),
    }


def _sem_none(linha: dict, manter: set[str]) -> dict:
    """Tira as chaves com valor None, menos as de `manter`.

    Um upsert com None sobrescreve coluna boa com NULL. Como aqui a
    BrasilAPI é COMPLEMENTO do BigQuery (e não a fonte da verdade), campo
    que a API não soube responder deve deixar o valor atual em paz.
    """
    return {k: v for k, v in linha.items() if v is not None or k in manter}


def _cnpjs_do_municipio(client, id_municipio: str) -> list[str]:
    """CNPJs de 14 dígitos que aparecem em `contratos` do município.

    `fornecedores` é global (sem `id_municipio`), então "fornecedor deste
    município" só se define por este caminho — o mesmo que `etl/bd/cnpj.py`
    usa. Ordenado para a rodada ser determinística: com teto de consultas,
    ordem estável significa que a rodada seguinte continua de onde parou em
    vez de sortear os mesmos CNPJs de novo.
    """
    resp = (
        client.table("contratos")
        .select("fornecedor_cnpj")
        .eq("id_municipio", id_municipio)
        .execute()
    )
    return sorted(
        {
            _so_digitos(r.get("fornecedor_cnpj"))
            for r in (resp.data or [])
            if len(_so_digitos(r.get("fornecedor_cnpj"))) == 14
        }
    )


def enriquecer_fornecedores(
    client,
    id_municipio: str,
    max_consultas: int,
    intervalo: float,
) -> int:
    """Completa `fornecedores` com o que o BigQuery não trouxe.

    Alvos, em ordem de prioridade (é a ordem em que rendem):
      1. CNPJ em `contratos` SEM linha nenhuma em `fornecedores` (171 em
         Betim) — o buraco de verdade;
      2. linha existente com `situacao_cadastral` NULL ou em formato
         numérico (0 em Betim hoje, mas é o caso que gerou o falso positivo
         de 97,6% e volta se o BigQuery mudar);
      3. linha existente sem `cnae_descricao` (487 em Betim — o BigQuery
         não traz a descrição do CNAE).
    Idempotente: quem já está completo sai da fila e não gasta consulta.
    """
    cnpjs = _cnpjs_do_municipio(client, id_municipio)
    if not cnpjs:
        print("[etl.apis.brasilapi] nenhum CNPJ válido em `contratos` — nada a enriquecer")
        return 0

    existentes = {
        r["cnpj"]: r
        for r in (
            client.table("fornecedores")
            .select("cnpj, razao_social, situacao_cadastral, cnae_descricao")
            .in_("cnpj", cnpjs)
            .execute()
            .data
            or []
        )
    }

    sem_linha = [c for c in cnpjs if c not in existentes]
    situacao_ruim = [
        c
        for c, r in existentes.items()
        if not r.get("situacao_cadastral") or _parece_codigo_numerico(r.get("situacao_cadastral"))
    ]
    sem_cnae = [
        c for c, r in existentes.items() if r.get("cnae_descricao") is None and c not in situacao_ruim
    ]

    print(
        f"[etl.apis.brasilapi] contratos_cnpjs={len(cnpjs)} ja_em_fornecedores={len(existentes)} "
        f"| alvos: sem_linha={len(sem_linha)} situacao_ausente_ou_numerica={len(situacao_ruim)} "
        f"sem_cnae_descricao={len(sem_cnae)}"
    )

    fila = (sem_linha + sorted(situacao_ruim) + sorted(sem_cnae))[:max_consultas]
    if not fila:
        print("[etl.apis.brasilapi] fornecedores: nada a fazer (tudo já enriquecido)")
        return 0
    if len(sem_linha) + len(situacao_ruim) + len(sem_cnae) > len(fila):
        print(
            f"[etl.apis.brasilapi] teto de {max_consultas} consultas atingido — "
            "rode de novo depois para continuar (a fila é ordenada e retoma de onde parou)"
        )

    gravados = 0
    falhas = 0
    for i, cnpj in enumerate(fila, 1):
        dados, erro = _consultar_cnpj_tolerante(cnpj)
        if erro:
            falhas += 1
            print(f"[etl.apis.brasilapi] {i}/{len(fila)} {cnpj}: falhou ({erro}) — pulando")
        elif dados is None:
            print(f"[etl.apis.brasilapi] {i}/{len(fila)} {cnpj}: 404 (não existe na Receita)")
        else:
            linha = linha_fornecedor_brasilapi(cnpj, dados)
            # `cnpj` sempre fica (é a chave do conflito). Para os demais,
            # None é omitido: a BrasilAPI complementa o BigQuery, não o
            # substitui — não pode apagar o que já estava preenchido.
            linha = _sem_none(linha, manter={"cnpj"})
            # Grava um a um de propósito. Cada consulta custa ~20s de
            # espera; acumular tudo para um lote no fim significaria perder
            # a rodada inteira se o processo morrer no meio.
            client.table("fornecedores").upsert([linha], on_conflict="cnpj").execute()
            gravados += 1
            print(
                f"[etl.apis.brasilapi] {i}/{len(fila)} {cnpj}: "
                f"{(linha.get('razao_social') or '?')[:45]} | {linha.get('situacao_cadastral')}"
            )
        if i < len(fila):
            time.sleep(intervalo)

    print(f"[etl.apis.brasilapi] fornecedores gravados={gravados} falhas={falhas}")
    return gravados


def enriquecer_comercios_por_cep(
    client,
    id_municipio: str,
    max_consultas: int,
    intervalo: float,
) -> int:
    """Preenche `bairro` (e coordenada, quando vier) em `comercios_essenciais`.

    LEIA O DOCSTRING DO MÓDULO, item (b): hoje isto tende a 0 candidatos, e
    o motivo é estrutural, não um bug. Nenhuma tabela tem coluna de CEP, e
    `comercios_essenciais.endereco` em Betim guarda "Rua X 140", sem CEP.
    Fica implementado porque o dia em que um CEP entrar no `endereco` (ou
    uma coluna `cep` nascer) isto passa a render sem ninguém reescrever.

    `zap_estabelecimentos` NÃO entra: a tabela tem `bairro` mas não tem
    `cep` nem `lat`/`lng` (conferido em `information_schema`), e está vazia.
    """
    linhas = (
        client.table("comercios_essenciais")
        .select("id, nome, bairro, endereco, lat, lng")
        .eq("id_municipio", id_municipio)
        .execute()
        .data
        or []
    )

    candidatos = []
    for linha in linhas:
        # Só quem tem algo a ganhar: falta bairro OU falta coordenada.
        # Quem já tem tudo não gasta consulta (idempotência).
        if linha.get("bairro") and linha.get("lat") is not None and linha.get("lng") is not None:
            continue
        cep = _cep_do_endereco(linha.get("endereco"))
        if cep:
            candidatos.append((linha, cep))

    incompletos = sum(
        1
        for l in linhas
        if not l.get("bairro") or l.get("lat") is None or l.get("lng") is None
    )
    print(
        f"[etl.apis.brasilapi] comercios_essenciais={len(linhas)} incompletos={incompletos} "
        f"com_cep_no_endereco={len(candidatos)}"
    )
    if not candidatos:
        print(
            "[etl.apis.brasilapi] nenhum CEP disponível — o schema não tem coluna `cep` "
            "e `endereco` não contém CEP; nada a consultar (esperado, não é erro)"
        )
        return 0

    fila = candidatos[:max_consultas]
    atualizados = 0
    for i, (linha, cep) in enumerate(fila, 1):
        try:
            dados = consultar_cep(cep)
        except (RateLimitBrasilAPI, requests.RequestException, ValueError) as e:
            print(f"[etl.apis.brasilapi] CEP {cep}: falhou ({type(e).__name__}) — pulando")
            continue
        if not dados:
            print(f"[etl.apis.brasilapi] CEP {cep}: 404 — pulando")
            continue

        patch = {}
        # SÓ preenche buraco. Nunca sobrescreve valor existente, e nunca
        # grava None: é literalmente o erro que já apagou dado bom neste
        # projeto (`osm_comercios.py` zerava telefones confirmados).
        if not linha.get("bairro") and dados.get("neighborhood"):
            patch["bairro"] = dados["neighborhood"]
        coords = coordenadas_do_cep(dados)
        if coords and (linha.get("lat") is None or linha.get("lng") is None):
            patch["lat"], patch["lng"] = coords

        if patch:
            client.table("comercios_essenciais").update(patch).eq("id", linha["id"]).execute()
            atualizados += 1
            print(f"[etl.apis.brasilapi] {linha.get('nome')}: {patch}")
        if i < len(fila):
            time.sleep(intervalo)

    print(f"[etl.apis.brasilapi] comercios atualizados={atualizados}")
    return atualizados


def sync(
    id_municipio: str,
    max_consultas: int = MAX_CONSULTAS_PADRAO,
    intervalo_cnpj: float = INTERVALO_CNPJ_PADRAO,
    intervalo_cep: float = INTERVALO_CEP_PADRAO,
    apenas: str | None = None,
) -> None:
    municipio = carregar_municipio(id_municipio)
    print(
        f"[etl.apis.brasilapi] {municipio['nome']}-{municipio['uf']} ({id_municipio}) "
        f"max_consultas={max_consultas}"
    )

    client = get_supabase_client()
    if apenas in (None, "fornecedores"):
        enriquecer_fornecedores(client, id_municipio, max_consultas, intervalo_cnpj)
    if apenas in (None, "comercios"):
        enriquecer_comercios_por_cep(client, id_municipio, max_consultas, intervalo_cep)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument(
        "--max-consultas",
        type=int,
        default=MAX_CONSULTAS_PADRAO,
        help="Teto duro de chamadas por rodada. Existe pelo limite CONTRATUAL "
        "da BrasilAPI (crawling proibido) — não aumente sem ler o docstring.",
    )
    parser.add_argument("--intervalo-cnpj", type=float, default=INTERVALO_CNPJ_PADRAO)
    parser.add_argument("--intervalo-cep", type=float, default=INTERVALO_CEP_PADRAO)
    parser.add_argument("--apenas", choices=["fornecedores", "comercios"], default=None)
    args = parser.parse_args()
    try:
        sync(
            args.id_municipio,
            max_consultas=args.max_consultas,
            intervalo_cnpj=args.intervalo_cnpj,
            intervalo_cep=args.intervalo_cep,
            apenas=args.apenas,
        )
    except RuntimeError as e:
        print(f"[etl.apis.brasilapi] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
