"""etl.camaras.domweb — diário oficial de Belo Horizonte via API pública do
**DOM-PBH** (`api-dom.pbh.gov.br`), o backend do portal DOM-Web
(`dom-web.pbh.gov.br`).

Alvo: BH (3106200) — Prefeitura E Câmara publicam na MESMA edição estadual do
DOM (uma edição numerada por dia útil). Fase D3 do plano
(`docs/planos/diario-oficial-plano.md`).

POR QUE ESTE MÓDULO EXISTE FORA DE `sigpub.py`: o DOM-PBH é a plataforma da
própria PBH, não o SIGPub da AMM-MG — outro fornecedor, outra API, outro
formato. Mesmo raciocínio de `camaras/sapl.py`/`camaras/syssolution.py`: um
coletor por fornecedor, não por cidade.

═══ MECANISMO MEDIDO AO VIVO (2026-08-30, contra a API real) ═══

A API é REST pública, SEM sessão nem CSRF (diferente do SIGPub): cada endpoint
é um GET com parâmetros de query, e a resposta é JSON com `{success, data}`.
Base confirmada ao vivo:

    https://api-dom.pbh.gov.br/api/v1/...

Endpoints usados por este módulo (todos medidos hoje):

1. **Edição por dia** — `GET /v1/edicoes/buscarpublicacaopordata?data=YYYY-MM-DD`
   → `data: [edicao, ...]`. **Uma edição por dia útil, zero em fins de semana**
   (medido: 24/08/2026 domingo → `[]`; 25–29/08 → 1 edição cada, `tipo_edicao`
   "P"). A edição traz `id`, `numero_edicao`, `dt_publicacao`, `documento_jornal`.
   Não há endpoint de "mês" — a coleta itera dias.

2. **Sumário da edição** — `GET /v1/edicoes/{edicao_id}/sumario`
   → `data: [no, ...]` — árvore com nós `tipo: "O"` (órgão) que contêm
   `filhos`; as folhas `tipo: "A"` são os ATOS. Cada folha tem:
   `id` (id do ato), `descricao` (título do ato), `categoria.{nome_categoria}`,
   `orgao.{sigla_orgao, nome_orgao}`, `documento_ato`. Medido na edição 7753
   (28/08/2026): 102 atos (23 portaria, 16 ato administrativo, 14 extrato,
   12 licitação, 10 processo seletivo, ...). **O sumário traz TUDO de uma vez**
   (a edição inteira num único JSON, sem paginação).

3. **Ato individual** — `GET /v1/edicoes/atos/{ato_id}/publicado`
   → `data: {id, titulo_ato, edicao_id, orgao, categoria, conteudo_html, ...}`.
   Usado por `--com-detalhe` para preencher `texto` (1 requisição extra por
   ato). O `conteudo_html` é o corpo do ato em HTML.

4. **Link público estável** — a SPA renderiza o ato em
   `https://dom-web.pbh.gov.br/visualizacao/ato/{id}` (rota confirmada no
   bundle JS e 200 medido ao vivo). É este o `link_fonte` gravado — o link
   que o cidadão abre, não o endpoint da API.

Armadilhas medidas:

- **Não existe campo "página"** no DOM-PBH (como no SIGPub, armadilha 5 do
  `sigpub.py`): a API expõe edição (número) e ato, não folha de PDF. `pagina`
  fica sempre `None`.
- **Dia sem edição devolve `data: []`, não erro** — fins de semana e
  feriados são o caso normal de "0 edições", não falha. **Data futura
  devolve HTTP 400** ("O campo data deve ser uma data anterior ou igual a
  [hoje]", medido 30/08/2026 com 31/08) — o coletor corta a coleta em `hoje`.
- **Um dia pode ter edição P (principal) E S (suplemento) com o MESMO
  `numero_edicao`** (medido em 06/08/2026: id 7737 S + 7736 P, ambos 7556).
  `chave_natural = dom_web:<ato_id>` continua único porque o id do ato é
  global, não por edição; a duplicação só aparece no `edicao` exibido, que é
  o mesmo número para os dois — comportamento da fonte, não bug do coletor.
- **`pesquisar` (busca por termo) exige `termo` e datas no formato
  `Y-m-d H:i`** e não é o caminho da coleta: o sumário por edição já entrega
  a edição inteira sem termo de busca, com menos requisições e cobertura
  completa por dia (o modo de falha silencioso da paginação não existe aqui —
  o sumário é atômico por edição).
- **Rate limit:** API pública de terceiro (PBH). Pausa de 1,5s entre
  requisições (`PAUSA`), User-Agent honesto, retry só de falha de rede, e
  `BloqueioDomWeb` para resposta que não seja JSON esperado — nunca contar
  "0 atos" quando a API mudou de forma.

═══ GAP DE CLASSIFICAÇÃO MEDIDO (BH ≠ Diamantina) ═══

O classificador (`etl.diario.classificar_ato`) foi calibrado contra 75
títulos de DIAMANTINA (5,6% em `outro` em julho/2026). Contra o DOM-PBH,
agosto/2026 (1.814 atos, medido ao vivo em 30/08/2026), **52% caíram em
`outro`** — não é bug do coletor, é diferença de VOCABULÁRIO entre as duas
fontes:

- O DOM-PBH tem categorias administrativas próprias fora dos 7 tipos
  (CONVOCAÇÃO, INTIMAÇÕES, NOTIFICAÇÃO, COMUNICADO, ATA DE REUNIÃO, DESPACHO,
  RESULTADO DE JULGAMENTO, PAUTA) — a taxonomia de 7 tipos do plano não tem
  onde encaixá-las, e não deve: são "outro" legítimo.
- Os títulos de BH são mais CURTOS que os de Diamantina ("EXTRATO",
  "CONVOCAÇÃO" puros), então palavras-chave como "CONTRATO"/"EDITAL" não
  aparecem nem para atos que POR DETRÁS são contratos/editais (ex. "EXTRATO
  DE ADITIVO (PUBLIC-205/2026)").

**Material para decisão futura:** o DOM-PBH já expõe `categoria.nome_categoria`
por ato (PORTARIA, LICITAÇÃO, EXTRATO, ATO ADMINISTRATIVO...), preservado em
`raw.categoria` — é candidato natural a complementar ou validar a
classificação por regex, mas isso é decisão editorial (mesmo padrão do chip
`task_f4a38f90` que recalibrou Diamantina), não algo forçado aqui.

═══ O QUE ESTE MÓDULO ESCREVE ═══

`atos_diario` (migration `0077_atos_diario.sql`) — upsert por
`(id_municipio, chave_natural)`, `chave_natural = "dom_web:<ato_id>"` (o id
numérico do ato no DOM-PBH — estável, é o mesmo id do link público). O prefixo
`dom_web:` segue a convenção da 0077 ("o prefixo do fornecedor no PRÓPRIO
valor", como `sigpub:<hash>`).

Uso:

    python -m etl.camaras.domweb --sondar --desde 2026-08 --ate 2026-08
    python -m etl.camaras.domweb --id-municipio 3106200
    python -m etl.camaras.domweb --id-municipio 3106200 --desde 2026-08 --ate 2026-08 --com-detalhe
"""
from __future__ import annotations

import argparse
import calendar
import json
import sys
import time
from datetime import date
from urllib.parse import urljoin

import requests as _requests

from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    carregar_municipio,
    get_supabase_client,
    upsert_com_colunas_opcionais,
)
from etl.diario import classificar_ato

LOG = "[etl.camaras.domweb]"

# Valor de `municipios.fontes.diario_oficial_coletor` — rótulo de máquina
# consistente com `COLETOR` em `sigpub.py`, para a tela saber qual fornecedor
# alimentou cada linha quando houver mais de um diário na mesma cidade.
COLETOR = "dom_web"

# Único host confirmado ao vivo (30/08/2026). A SPA pública é dom-web.pbh.gov.br;
# a API, api-dom.pbh.gov.br. O coletor fala só com a API — recusa qualquer host
# não medido, no mesmo espírito de HOSTS_CONFIRMADOS em sigpub.py.
HOSTS_CONFIRMADOS = {"api-dom.pbh.gov.br"}

# Link público que o cidadão abre (rota da SPA confirmada no bundle JS).
PORTAL_WEB = "https://dom-web.pbh.gov.br"

USER_AGENT = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"

# Pausa entre requisições a este host de terceiro — mesmo valor pedido para a
# tarefa e usado por outros coletores do projeto (ex. sigpub.py, etl.apis).
PAUSA = 1.5
TIMEOUT = 60


class BloqueioDomWeb(RuntimeError):
    """Resposta não é o JSON esperado (`{success, data}`) — pode ser WAF,
    IP banido ou mudança de contrato da API. Levantar em vez de contar como
    "0 edições": bloqueio silencioso não pode virar número de cobertura."""


# ────────────────────────── HTTP via requests ─────────────────────────
# Mesma decisão de sigpub.py (atualizado em 27/08): falar HTTP via
# requests.Session, não curl.exe (quebrado nesta máquina de dev).


def _json_get(session: _requests.Session, url: str, params: dict[str, str] | None, rotulo: str) -> dict:
    """Ponto ÚNICO de chamada HTTP deste módulo — toda requisição passa por
    aqui, e a pausa (rate limit da API da PBH) mora aqui, não espalhada
    pelos call sites (mesma lição do sigpub.py, armadilha 7)."""
    time.sleep(PAUSA)
    ultimo: Exception | None = None
    for tentativa in range(3):
        try:
            resp = session.get(url, params=params, timeout=TIMEOUT)
            if resp.status_code != 200:
                raise RuntimeError(f"HTTP {resp.status_code}")
            try:
                corpo = resp.json()
            except ValueError as e:
                raise RuntimeError(f"resposta não-JSON ({e})") from e
            if not isinstance(corpo, dict) or corpo.get("success") is not True:
                raise RuntimeError(f"success != true: {str(corpo)[:200]}")
            return corpo
        except Exception as e:  # noqa: BLE001 — retry só do que adianta repetir
            ultimo = e
            time.sleep(3.0 * (tentativa + 1))
    raise RuntimeError(f"GET {url} falhou após 3 tentativas ({rotulo}): {ultimo}")


# ─────────────────────── edições por dia (cobertura) ──────────────────


def _edicoes_do_dia(session: _requests.Session, base_api: str, dia: date) -> list[dict]:
    """Edições publicadas em UM dia. `data: []` é dia sem publicação (fim de
    semana/feriado) — caso normal, não falha (armadilha medida)."""
    corpo = _json_get(
        session,
        urljoin(base_api, "v1/edicoes/buscarpublicacaopordata"),
        {"data": dia.isoformat()},
        f"edições de {dia.isoformat()}",
    )
    dados = corpo.get("data")
    if not isinstance(dados, list):
        raise BloqueioDomWeb(
            f"buscarpublicacaopordata({dia}) devolveu data não-lista: {str(dados)[:200]}"
        )
    return [e for e in dados if isinstance(e, dict)]


# ───────────────────────── sumário / atos ─────────────────────────────


def _folhas_ato(no: dict, acumulador: list[dict]) -> None:
    """Caminha a árvore do sumário e coleta as folhas `tipo == "A"` (atos).
    Nós `tipo == "O"` (órgãos) têm `filhos`; folhas "A" têm `id`, `descricao`,
    `categoria`, `orgao`, `documento_ato` — estrutura medida na edição 7753."""
    if no.get("tipo") == "A":
        acumulador.append(no)
        return
    for filho in no.get("filhos") or []:
        if isinstance(filho, dict):
            _folhas_ato(filho, acumulador)


def _sumario_da_edicao(session: _requests.Session, base_api: str, edicao_id: int) -> list[dict]:
    """Todos os atos de uma edição, numa lista plana (a API devolve árvore)."""
    corpo = _json_get(
        session,
        urljoin(base_api, f"v1/edicoes/{edicao_id}/sumario"),
        None,
        f"sumário da edição {edicao_id}",
    )
    dados = corpo.get("data")
    if not isinstance(dados, list):
        raise BloqueioDomWeb(f"sumario({edicao_id}) devolveu data não-lista: {str(dados)[:200]}")
    atos: list[dict] = []
    for no in dados:
        if isinstance(no, dict):
            _folhas_ato(no, atos)
    return atos


def _detalhe_do_ato(session: _requests.Session, base_api: str, ato_id: int) -> dict:
    """`conteudo_html` do ato (usado por `--com-detalhe` para `texto`)."""
    corpo = _json_get(
        session,
        urljoin(base_api, f"v1/edicoes/atos/{ato_id}/publicado"),
        None,
        f"detalhe do ato {ato_id}",
    )
    data = corpo.get("data")
    if not isinstance(data, dict):
        raise BloqueioDomWeb(f"ato/{ato_id}/publicado devolveu data não-dict: {str(data)[:200]}")
    return data


# ──────────────────────────── montagem de linha ───────────────────────


def _montar_linha(id_municipio: str, edicao: dict, ato: dict, detalhe: dict | None) -> dict:
    titulo = ato.get("descricao") or ""
    orgao = ato.get("orgao") or {}
    categoria = ato.get("categoria") or {}
    ato_id = ato.get("id")

    if not ato_id:
        raise RuntimeError(f"ato sem id no sumário da edição {edicao.get('id')}: {str(ato)[:200]}")

    nome_orgao = orgao.get("nome_orgao") or orgao.get("sigla_orgao") or None

    texto = None
    if detalhe is not None:
        texto = detalhe.get("conteudo_html")

    return {
        "id_municipio": id_municipio,
        "data_publicacao": (edicao.get("dt_publicacao") or "")[:10],
        "edicao": str(edicao.get("numero_edicao")) if edicao.get("numero_edicao") is not None else None,
        "pagina": None,  # esta fonte não expõe página, nunca
        "tipo": classificar_ato(titulo),
        "numero_ato": None,  # o DOM-PBH não expõe número estruturado; o título livre carrega
        "orgao": nome_orgao,
        # O DOM-PBH não tem campo "ementa" separado — a `descricao` do sumário
        # É o resumo do ato (frase completa). Mesmo mapeamento do sigpub.py.
        "ementa": titulo or None,
        "texto": texto,
        "link_fonte": f"{PORTAL_WEB}/visualizacao/ato/{ato_id}",  # link que o cidadão abre
        "chave_natural": f"{COLETOR}:{ato_id}",
        "raw": {
            "ato_id": ato_id,
            "categoria": (categoria.get("nome_categoria") or None),
            "sigla_orgao": (orgao.get("sigla_orgao") or None),
            "edicao_id": edicao.get("id"),
            "tipo_edicao": edicao.get("tipo_edicao"),
        },
    }


# ─────────────────────── coleta de um período ─────────────────────────


def _coletar_periodo(
    session: _requests.Session,
    base_api: str,
    id_municipio: str,
    desde: date,
    ate: date,
    com_detalhe: bool,
) -> list[dict]:
    """Todos os atos de todas as edições entre `desde` e `ate`, dia a dia.
    Um dia útil = uma edição (às vezes P + S — ver armadilha abaixo); um dia
    sem edição devolve `[]` (normal).

    Corte em `hoje`: a API devolve HTTP 400 para data futura (medido
    30/08/2026 com 31/08) — "O campo data deve ser uma data anterior ou
    igual a [hoje]". Pedir um mês fechado que ainda não acabou é caso real
    (rodar em 30/08 com `--ate 2026-08`), então o corte é silencioso e
    documentado no log, não um erro."""
    hoje = date.today()
    ate_real = min(ate, hoje)
    if ate_real < ate:
        print(f"{LOG} {ate.isoformat()} é data futura (API rejeita) — coleta vai até {ate_real.isoformat()}.")
    linhas: list[dict] = []
    dia = desde
    while dia <= ate_real:
        edicoes = _edicoes_do_dia(session, base_api, dia)
        for edicao in edicoes:
            atos = _sumario_da_edicao(session, base_api, edicao["id"])
            for ato in atos:
                detalhe = _detalhe_do_ato(session, base_api, ato["id"]) if com_detalhe else None
                linhas.append(_montar_linha(id_municipio, edicao, ato, detalhe))
            # A mesma edição pode ter P (principal) e S (suplemento) no mesmo
            # dia com o MESMO numero_edicao (medido em 06/08/2026: id 7737 S +
            # 7736 P, ambos 7556) — por isso o log mostra o tipo.
            print(
                f"{LOG} {dia.isoformat()} edição {edicao.get('numero_edicao')} "
                f"({edicao.get('tipo_edicao')}): {len(atos)} ato(s)"
            )
        dia += date.resolution
    return linhas


# ─────────────────────────────── gravação ─────────────────────────────


def _gravar_atos(client, linhas: list[dict]) -> None:
    if not linhas:
        print(f"{LOG} atos_diario: nada coletado, nada gravado.")
        return
    upsert_com_colunas_opcionais(
        client,
        "atos_diario",
        linhas,
        ["numero_ato", "edicao", "pagina", "texto", "raw"],
        on_conflict="id_municipio,chave_natural",
    )
    com_tipo_definido = sum(1 for r in linhas if r["tipo"] != "outro")
    print(
        f"{LOG} atos_diario: {len(linhas)} ato(s) upsertado(s) — "
        f"{com_tipo_definido} ({100 * com_tipo_definido / len(linhas):.0f}%) com tipo != 'outro'."
    )


# ─────────────────────────────── sondagem ─────────────────────────────
# Sem banco: mede volume real sem `carregar_municipio` nem `get_supabase_client`
# (mesmo espírito do `--sondar` de sigpub.py — prova de mecanismo antes de
# qualquer gravação). `--base-api` explícito, nunca um default de cidade.


def sondar(base_api: str, desde: date, ate: date, com_detalhe: bool) -> None:
    session = _requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})
    linhas = _coletar_periodo(session, base_api, "SONDAGEM-SEM-BANCO", desde, ate, com_detalhe)

    if not linhas:
        print(f"{LOG} [sondar] 0 ato(s) no período — nada a resumir.")
        return

    por_tipo: dict[str, int] = {}
    for r in linhas:
        por_tipo[r["tipo"]] = por_tipo.get(r["tipo"], 0) + 1
    com_edicao = sum(1 for r in linhas if r["edicao"])
    com_texto = sum(1 for r in linhas if r["texto"])
    dias = sorted({r["data_publicacao"] for r in linhas if r["data_publicacao"]})

    print(f"\n{LOG} [sondar] === RESUMO DOM-PBH (BH) ===")
    print(f"{LOG} [sondar] total de atos: {len(linhas)}")
    print(f"{LOG} [sondar] dias com edição: {len(dias)} ({dias[0]} a {dias[-1]})" if dias else f"{LOG} [sondar] sem data válida")
    print(f"{LOG} [sondar] por tipo:")
    for tipo in sorted(por_tipo, key=lambda t: -por_tipo[t]):
        print(f"{LOG} [sondar]   {por_tipo[tipo]:>4}  {tipo}")
    print(f"{LOG} [sondar] edicao preenchida: {com_edicao}/{len(linhas)}")
    if com_detalhe:
        print(f"{LOG} [sondar] texto preenchido (--com-detalhe): {com_texto}/{len(linhas)}")
    print(f"{LOG} [sondar] 100% com link_fonte (sempre construído do id — sem exceção).")
    print(f"{LOG} [sondar] modo sondagem: NADA foi gravado (sem conexão de banco nesta chamada).")


# ─────────────────────────────── sync ─────────────────────────────────


def _conferir_base_api(cidade: dict) -> str:
    """Confere `fontes.diario_oficial_coletor` (host confirmado) e devolve a
    base da API com barra final. Chave nova de propósito: `diario_oficial` de
    BH aponta para a SPA pública (dom-web.pbh.gov.br), que é o que a tela
    mostra ao cidadão; a API mora em outro host."""
    fontes = cidade.get("fontes") or {}
    base_api = fontes.get("diario_oficial_coletor")
    if not isinstance(base_api, str) or not base_api.startswith("http"):
        raise RuntimeError(
            f"municipios.fontes.diario_oficial_coletor ausente para {cidade['id_municipio']} "
            f"({cidade['nome']}) — não dá para saber a base da API do DOM-PBH."
        )
    from urllib.parse import urlparse

    dominio = (urlparse(base_api).hostname or "").lower()
    if dominio not in HOSTS_CONFIRMADOS:
        raise RuntimeError(
            f"{cidade['nome']}: diario_oficial_coletor aponta para {dominio!r}, que não está em "
            f"HOSTS_CONFIRMADOS ({sorted(HOSTS_CONFIRMADOS)}). Este módulo recusa host nunca "
            "medido — confirme ao vivo antes de adicionar."
        )
    if not base_api.endswith("/"):
        base_api += "/"
    return base_api


def sync(id_municipio: str, desde: date, ate: date, com_detalhe: bool) -> None:
    cidade = carregar_municipio(id_municipio)
    base_api = _conferir_base_api(cidade)

    client = get_supabase_client()
    session = _requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    linhas = _coletar_periodo(session, base_api, id_municipio, desde, ate, com_detalhe)
    _gravar_atos(client, linhas)


# ─────────────────────────────── CLI ──────────────────────────────────


def _parse_data(texto: str) -> date:
    return date.fromisoformat(texto)


def _parse_mes(texto: str) -> tuple[int, int]:
    ano_str, mes_str = texto.split("-")
    return int(ano_str), int(mes_str)


def _fim_do_mes(ano: int, mes: int) -> date:
    return date(ano, mes, calendar.monthrange(ano, mes)[1])


if __name__ == "__main__":
    # Console do Windows abre em cp1252 e engasga no --help/erros porque o
    # docstring (este cabeçalho) tem caracteres fora dessa página (═, ⚠, …).
    # Mesmo ajuste de `etl/diario_test.py`: reconfigure para UTF-8 com
    # substituição, para o argparse imprimir a ajuda sem UnicodeEncodeError.
    for fluxo in (sys.stdout, sys.stderr):
        try:
            fluxo.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[union-attr]
        except (AttributeError, ValueError):
            pass

    hoje = date.today()
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument("--desde", help="AAAA-MM (mês fechado) ou AAAA-MM-DD")
    parser.add_argument("--ate", help="AAAA-MM (mês fechado) ou AAAA-MM-DD; default: --desde")
    parser.add_argument(
        "--com-detalhe",
        action="store_true",
        help="busca conteudo_html de cada ato (1 requisição extra por ato — mais lento)",
    )
    parser.add_argument("--sondar", action="store_true", help="modo sem banco: mede o volume, não grava")
    parser.add_argument(
        "--base-api",
        default="https://api-dom.pbh.gov.br/api/",
        help="(com --sondar) base da API do DOM-PBH; default a única confirmada",
    )
    args = parser.parse_args()

    def _resolver_datas(desde_raw: str | None, ate_raw: str | None) -> tuple[date, date]:
        if desde_raw and "-" in desde_raw and len(desde_raw.split("-")) == 3:
            d = _parse_data(desde_raw)
        elif desde_raw:
            ano, mes = _parse_mes(desde_raw)
            d = date(ano, mes, 1)
        else:
            d = date(hoje.year, hoje.month, 1)

        if ate_raw and "-" in ate_raw and len(ate_raw.split("-")) == 3:
            a = _parse_data(ate_raw)
        elif ate_raw:
            ano, mes = _parse_mes(ate_raw)
            a = _fim_do_mes(ano, mes)
        elif desde_raw:
            a = d
        else:
            a = _fim_do_mes(hoje.year, hoje.month)
        return d, a

    try:
        desde_dt, ate_dt = _resolver_datas(args.desde, args.ate)
        if desde_dt > ate_dt:
            raise RuntimeError(f"--desde {desde_dt} é depois de --ate {ate_dt}.")
        if args.sondar:
            sondar(args.base_api, desde_dt, ate_dt, args.com_detalhe)
        else:
            sync(args.id_municipio, desde_dt, ate_dt, args.com_detalhe)
    except BloqueioDomWeb as e:
        print(f"{LOG} BLOQUEIO: {e}", file=sys.stderr)
        sys.exit(2)
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
