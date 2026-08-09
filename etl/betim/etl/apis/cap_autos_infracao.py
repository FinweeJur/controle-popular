r"""etl.apis.cap_autos_infracao — autos de infração ambiental **ESTADUAIS de
Minas Gerais**, por município, via o sistema **CAP** (Consulta Geral de Autos
de Infração e Arrecadação) do Portal Ecosistemas da SEMAD-MG.

Fonte: `https://ecosistemas.meioambiente.mg.gov.br/consulta-ai` — front Next.js
sobre uma API JSON pública, **sem login, sem chave, sem CAPTCHA**. Contrato
mapeado ao vivo em 2026-08-09 lendo o bundle do próprio site (não é API
documentada; é a mesma chamada que o botão "Consultar" dispara):

    POST /consulta-ai/api/autos/filtro-avancado
      {numero_ai, lavratura_inicio, lavratura_fim, nome_autuado, cpfCnpj,
       municipios:[{value:<nome>}], orgaos:[], unidades:[],
       page:<1-based>, tipoDado:<DI|PA|DA|CA>, search:""}
      -> {data:[...], meta:{current_page,last_page,total,per_page}}

    GET  /consulta-ai/api/autos/municipios                    -> [{nome}] (853 de MG)
    GET  /consulta-ai/api/autos/export-count?...&tipoDado=DI  -> {total}
    GET  /consulta-ai/api/autos/relatorio-geral/last-update   -> {completed_at}

POR QUE ESTA FONTE EXISTE ALÉM DO IBAMA (`etl.apis.ibama_fiscalizacao`). São
jurisdições diferentes: o IBAMA autua por competência FEDERAL, o CAP reúne a
autuação ESTADUAL (SEMAD, IEF, FEAM, IGAM, PMMA). A diferença é de ordem de
grandeza no município médio de MG — medido ao vivo em 2026-08-09:

    Belo Horizonte 26.764 · Diamantina 25.292 · Gov. Valadares 23.372
    Araçuaí 11.368 · Betim 9.621 · Itinga 4.994

═══ AS ARMADILHAS MEDIDAS AO VIVO (2026-08-09) ═══

1. **UMA LINHA NÃO É UM AUTO DE INFRAÇÃO.** O grão é (auto × dispositivo
   infringido): o AI 316253 de Betim aparece DUAS vezes, mesmo `num_ai`, mesma
   data, `num_lei` diferente (`47383/18 Alt47837/20` e `7772/80`). Dizer "9.621
   autuações em Betim" é ERRADO — são 9.621 linhas. A contagem de autos é
   `count(distinct num_ai)`, e é isso que a tela deve mostrar.

2. **`tipoDado` DESCONHECIDO NÃO DÁ ERRO — CAI EM `DI` EM SILÊNCIO.** Testado
   com `''`, `'ALL'` e `'*'`: os três devolvem 200 com exatamente as colunas de
   `DI` e o mesmo `total`. Um typo aqui não falha, só entrega menos coluna.

3. **A MESMA CONSULTA TEM 4 RECORTES DE COLUNA, NÃO 4 CONSULTAS DIFERENTES.**
   `DI` (infração), `PA` (penalidades), `DA` (decisão/julgamento) e `CA`
   (cobrança) devolvem o MESMO conjunto de linhas, mesmo `id`, mesmo `total` —
   muda só o bloco de colunas. Por isso este módulo pagina as quatro e junta
   por `id`; não existe "tudo de uma vez".

4. **CPF DE PESSOA FÍSICA JÁ VEM MASCARADO NA FONTE** (`***.327.536-**`), CNPJ
   vem inteiro. É postura MELHOR que a das outras fontes ambientais já
   coletadas — o IBAMA publica CPF em claro (armadilha 6 de
   `etl.apis.ibama_fiscalizacao`) e o XLSX de outorga do IGAM também
   (`docs/ambiental/F0-discovery.md` §12.2). Aqui não há decisão de redação a
   tomar: grava-se o que a fonte publica, e o que ela publica já é redigido.

5. **`per_page` É FIXO EM 50 E NÃO SE DEIXA SOBRESCREVER** — mandar
   `per_page:500` devolve 200 com `per_page:50`. BH custa 536 páginas × 4
   recortes ≈ 2.144 requisições por rodada. Este módulo espaça as requisições
   (`--pausa`, default 0,4 s) e é ETL MENSAL, não diário.

6. **NÃO HÁ CÓDIGO IBGE EM LUGAR NENHUM** — nem no filtro, nem na resposta
   (`mun_infracao` vem em CAIXA ALTA, `"BETIM"`; a lista de `/municipios` vem
   em caixa de título, `"Betim"`). O filtro é server-side POR NOME, e o nome
   enviado é resolvido contra `/municipios` com normalização (maiúsculo, sem
   acento) — se não casar, o módulo ABORTA. Sem essa guarda, um nome fora do
   vocabulário da fonte devolveria 200 com zero linha, indistinguível de
   "município sem autuação".

7. **VALOR MONETÁRIO VEM EM DOIS TIPOS JSON NA MESMA LINHA** — `vlr_remanescente`
   é número (`6296.13`) e `valor_plano_vigente` é string (`"6296.13"`), com
   `null` misturado. Ponto decimal, não vírgula (ao contrário do IBAMA e da
   ANM). Convertido por `Decimal(str(v))`, o mesmo caminho de `etl.apis.tce_mg`.

8. **`dat_ata` É DATA-HORA E VEM `""` QUANDO NÃO HÁ DECISÃO**, não `null`.
   String vazia em coluna `timestamp` é erro de INSERT, não valor ausente.

═══ POR QUE ESTE MÓDULO NÃO USA A EXPORTAÇÃO PARA EXCEL ═══

Existe `export-count` + `export-part` (lotes de 100.000 linhas, XLSX), que
custaria 1 requisição em vez de centenas. Não é usado aqui por duas razões: a
exportação é um DOWNLOAD de arquivo binário cujo contrato de coluna não foi
verificado (pode não trazer os 4 recortes), e a API paginada já entrega JSON
tipado. `export-count` **é** usado — como conferência independente do total
(ver `_conferir_total`).

═══ POR QUE O SIGIBAR NÃO ENTROU JUNTO ═══

O outro módulo público do mesmo portal (Gestão de Barragens, `/sigibar-ui`)
tem a listagem atrás de **reCAPTCHA Enterprise** — o bundle mostra que o
`listarBarragemPorFiltro` só é chamado depois de `validaRecaptcha` devolver
`score > 0.5`. Pela regra já firmada no projeto (`F0-discovery.md` §2.2 e
§13.1) CAPTCHA é parada, não obstáculo a contornar. O que o SIGIBAR tem e o
SNISB não (condição de estabilidade, nível de emergência, data da última
auditoria) continua sem coletor **por decisão de política, não por falta de
mapeamento**.

═══ O QUE ESTE MÓDULO NÃO PROVA ═══

`mun_infracao` é o município da infração segundo o cadastro do auto — não é
prova de dano ambiental consumado: um auto pode ser anulado no julgamento
(`status_ai`, `des_statusprocesso`) e o valor pode nunca ter sido cobrado
(`status_debito`). A tela precisa mostrar esses três campos junto do número,
ou vira acusação sem processo.

═══ O QUE ESTE MÓDULO ESCREVE ═══

`cap_autos_infracao` — uma linha por `id` da fonte, chave natural
`(id_municipio, id_cap)`. Refresh total filtrado por `id_municipio`, com o
guarda de redução de `refresh_completo_seguro`.

Uso:

    python -m etl.apis.cap_autos_infracao --id-municipio 3106705 --sondar
    python -m etl.apis.cap_autos_infracao --id-municipio 3106705 --sondar --paginas 3
    python -m etl.apis.cap_autos_infracao --id-municipio 3106705
"""
import argparse
import datetime as dt
import sys
import time
import unicodedata
from decimal import Decimal, InvalidOperation

import requests

from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    carregar_municipio,
    get_supabase_client,
    refresh_completo_seguro,
)

LOG = "[etl.apis.cap_autos_infracao]"

BASE = "https://ecosistemas.meioambiente.mg.gov.br/consulta-ai/api/autos"
TIMEOUT = 90
PAUSA_PADRAO = 0.4
_UA = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"

# Armadilha 3: os quatro recortes de coluna da MESMA consulta.
RECORTES = ("DI", "PA", "DA", "CA")

# Armadilha 6: a fonte é estadual de MG. Prefixo do código IBGE de MG é 31.
_PREFIXO_IBGE_MG = "31"


def _sessao() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = _UA
    return s


def _normalizar(s: str) -> str:
    base = unicodedata.normalize("NFD", s or "")
    sem_acento = "".join(c for c in base if unicodedata.category(c) != "Mn")
    return " ".join(sem_acento.upper().split())


# ─────────────────────────── acesso à fonte ────────────────────────────


def _resolver_nome_municipio(sessao: requests.Session, nome: str) -> str:
    """O nome EXATO como o CAP grafa (armadilha 6). Aborta se não casar —
    silêncio aqui viraria "município sem autuação nenhuma"."""
    r = sessao.get(f"{BASE}/municipios", timeout=TIMEOUT)
    r.raise_for_status()
    catalogo = [m["nome"] for m in r.json()]
    alvo = _normalizar(nome)
    for grafia in catalogo:
        if _normalizar(grafia) == alvo:
            return grafia
    raise RuntimeError(
        f"{LOG} {nome!r} não está entre os {len(catalogo)} municípios do CAP. "
        f"Sem casamento, a consulta devolveria zero linha sem erro."
    )


def _corpo(nome_fonte: str, recorte: str, pagina: int) -> dict:
    return {
        "numero_ai": "",
        "lavratura_inicio": "",
        "lavratura_fim": "",
        "nome_autuado": "",
        "cpfCnpj": "",
        "municipios": [{"value": nome_fonte, "label": nome_fonte}],
        "orgaos": [],
        "unidades": [],
        "page": pagina,
        "tipoDado": recorte,
        "search": "",
    }


def _pagina(sessao: requests.Session, nome_fonte: str, recorte: str, pagina: int) -> dict:
    r = sessao.post(
        f"{BASE}/filtro-avancado",
        json=_corpo(nome_fonte, recorte, pagina),
        timeout=TIMEOUT,
    )
    r.raise_for_status()
    return r.json()


def _conferir_total(sessao: requests.Session, nome_fonte: str) -> int | None:
    """Total pelo caminho da EXPORTAÇÃO, independente da paginação. Serve para
    flagrar coleta truncada; não aborta sozinho (a fonte é atualizada de
    madrugada e pode mudar entre as duas chamadas)."""
    try:
        r = sessao.get(
            f"{BASE}/export-count",
            params={"municipios[0][value]": nome_fonte, "tipoDado": "DI"},
            timeout=TIMEOUT,
        )
        r.raise_for_status()
        return int(r.json()["total"])
    except (requests.RequestException, ValueError, KeyError):
        return None


def _ultima_atualizacao(sessao: requests.Session) -> str | None:
    try:
        r = sessao.get(f"{BASE}/relatorio-geral/last-update", timeout=TIMEOUT)
        r.raise_for_status()
        return r.json().get("completed_at")
    except (requests.RequestException, ValueError):
        return None


# ─────────────────────────── parsers de campo ──────────────────────────


def _txt(v) -> str | None:
    if v is None:
        return None
    s = str(v).strip()
    return s or None


def _num(v) -> str | None:
    """Armadilha 7: o mesmo campo vem número num recorte e string noutro."""
    if v is None or (isinstance(v, str) and not v.strip()):
        return None
    try:
        return str(Decimal(str(v).strip()))
    except InvalidOperation:
        return None


def _data(v) -> str | None:
    if not v:
        return None
    try:
        return dt.date.fromisoformat(str(v)[:10]).isoformat()
    except ValueError:
        return None


def _data_hora(v) -> str | None:
    """Armadilha 8: `""` quando não houve decisão, não `null`."""
    s = _txt(v)
    if not s:
        return None
    for formato in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            return dt.datetime.strptime(s[: len(formato) + 2].strip(), formato).isoformat()
        except ValueError:
            continue
    return None


def _linha_vazia(id_cap: int, id_municipio: str) -> dict:
    return {
        "id_municipio": id_municipio,
        "id_cap": id_cap,
        "numero_ai": None,
        "data_lavratura": None,
        "nome_autuado": None,
        "cpf_cnpj": None,
        "municipio_fonte": None,
        "orgao_autuante": None,
        "unidade_atual": None,
        # DI
        "dispositivo_legal": None,
        "codigo_infracao": None,
        # PA
        "pen_advertencia": None,
        "pen_multa_simples": None,
        "pen_multa_diaria": None,
        "pen_apreensao": None,
        "pen_embargo_obra": None,
        "pen_embargo_atividade": None,
        "pen_suspensao_atividade": None,
        "pen_suspensao_venda": None,
        "pen_suspensao_fabricacao": None,
        "pen_demolicao": None,
        "pen_restritiva_direito": None,
        "descricao_embargo": None,
        "descricao_apreensao": None,
        "valor_multa": None,
        # DA
        "decisao": None,
        "descricao_julgamento": None,
        "data_decisao": None,
        "status_ai": None,
        "status_processo": None,
        # CA
        "valor_plano_vigente": None,
        "valor_quitado": None,
        "valor_remanescente": None,
        "qtde_parcelas": None,
        "observacao_plano": None,
        "status_debito": None,
    }


def _aplicar_comuns(destino: dict, linha: dict) -> None:
    destino["numero_ai"] = _txt(linha.get("num_ai"))
    destino["data_lavratura"] = _data(linha.get("dat_lavratura"))
    destino["nome_autuado"] = _txt(linha.get("nom_autuado"))
    destino["cpf_cnpj"] = _txt(linha.get("num_cpfcnpj"))  # armadilha 4
    destino["municipio_fonte"] = _txt(linha.get("mun_infracao"))
    destino["orgao_autuante"] = _txt(linha.get("orgao_orig_infracao"))
    destino["unidade_atual"] = _txt(linha.get("unid_atual"))
    if destino["valor_remanescente"] is None:
        destino["valor_remanescente"] = _num(linha.get("vlr_remanescente"))


def _aplicar_recorte(destino: dict, recorte: str, linha: dict) -> None:
    _aplicar_comuns(destino, linha)
    if recorte == "DI":
        destino["dispositivo_legal"] = _txt(linha.get("num_lei"))
        destino["codigo_infracao"] = _txt(linha.get("num_codigo"))
    elif recorte == "PA":
        destino["pen_advertencia"] = _txt(linha.get("bit_advert"))
        destino["pen_multa_simples"] = _txt(linha.get("bit_multasimples"))
        destino["pen_multa_diaria"] = _txt(linha.get("bit_multadiaria"))
        destino["pen_apreensao"] = _txt(linha.get("bit_apreensao"))
        destino["pen_embargo_obra"] = _txt(linha.get("bit_eobra"))
        destino["pen_embargo_atividade"] = _txt(linha.get("bit_eatividade"))
        destino["pen_suspensao_atividade"] = _txt(linha.get("bit_satividade"))
        destino["pen_suspensao_venda"] = _txt(linha.get("bit_svenda"))
        destino["pen_suspensao_fabricacao"] = _txt(linha.get("bit_sfabrica"))
        destino["pen_demolicao"] = _txt(linha.get("bit_demolicao"))
        destino["pen_restritiva_direito"] = _txt(linha.get("bit_restritiva"))
        destino["descricao_embargo"] = _txt(linha.get("des_localiz"))
        destino["descricao_apreensao"] = _txt(linha.get("des_objeto"))
        destino["valor_multa"] = _num(linha.get("val_total"))
    elif recorte == "DA":
        destino["decisao"] = _txt(linha.get("des_embarg"))
        destino["descricao_julgamento"] = _txt(linha.get("des_parecer"))
        destino["data_decisao"] = _data_hora(linha.get("dat_ata"))
        destino["status_ai"] = _txt(linha.get("status_ai"))
        destino["status_processo"] = _txt(linha.get("des_statusprocesso"))
    elif recorte == "CA":
        destino["valor_plano_vigente"] = _num(linha.get("valor_plano_vigente"))
        destino["valor_quitado"] = _num(linha.get("vlr_pagmto"))
        destino["valor_remanescente"] = _num(linha.get("vlr_remanescente"))
        destino["qtde_parcelas"] = _txt(linha.get("qtde_parcelas"))
        destino["observacao_plano"] = _txt(linha.get("obs_plano"))
        destino["status_debito"] = _txt(linha.get("status_debito"))


# ─────────────────────────────── coleta ────────────────────────────────


def coletar(
    id_municipio: str,
    nome_municipio: str,
    *,
    pausa: float = PAUSA_PADRAO,
    max_paginas: int | None = None,
    verboso: bool = False,
) -> tuple[list[dict], dict]:
    """Devolve (linhas, diagnóstico). Junta os 4 recortes por `id` da fonte
    (armadilha 3) — nunca supõe que a ordem das páginas coincide entre eles."""
    sessao = _sessao()
    nome_fonte = _resolver_nome_municipio(sessao, nome_municipio)
    diag = {
        "nome_fonte": nome_fonte,
        "total_declarado": None,
        "total_export_count": _conferir_total(sessao, nome_fonte),
        "ultima_atualizacao": _ultima_atualizacao(sessao),
        "paginas_lidas": 0,
        "truncado": max_paginas is not None,
    }

    por_id: dict[int, dict] = {}
    for recorte in RECORTES:
        pagina = 1
        while True:
            corpo = _pagina(sessao, nome_fonte, recorte, pagina)
            meta = corpo.get("meta") or {}
            if recorte == "DI" and pagina == 1:
                diag["total_declarado"] = meta.get("total")
            for linha in corpo.get("data") or []:
                id_cap = linha.get("id")
                if id_cap is None:
                    continue
                destino = por_id.setdefault(int(id_cap), _linha_vazia(int(id_cap), id_municipio))
                _aplicar_recorte(destino, recorte, linha)
            diag["paginas_lidas"] += 1
            if verboso:
                print(f"{LOG}   {recorte} página {pagina}/{meta.get('last_page')} "
                      f"({len(por_id)} linha(s) acumulada(s))")
            ultima = meta.get("last_page") or 1
            if max_paginas is not None and pagina >= max_paginas:
                break
            if pagina >= ultima:
                break
            pagina += 1
            time.sleep(pausa)
        time.sleep(pausa)

    return list(por_id.values()), diag


# ─────────────────────────────── sondar ────────────────────────────────


def sondar(id_municipio: str, nome_municipio: str, pausa: float, max_paginas: int | None) -> None:
    """Consulta e relata, SEM gravar e SEM ler `municipios` — funciona com a
    Neon fora do ar. `--paginas` existe porque uma sondagem de BH sem limite
    são 2.144 requisições."""
    _exigir_mg(id_municipio)
    linhas, diag = coletar(
        id_municipio, nome_municipio, pausa=pausa, max_paginas=max_paginas, verboso=True
    )
    print(f"\n{LOG} {diag['nome_fonte']} — {diag['total_declarado']} linha(s) declarada(s) pela "
          f"fonte; export-count diz {diag['total_export_count']}; "
          f"relatório geral atualizado em {diag['ultima_atualizacao']}")
    if diag["truncado"]:
        print(f"{LOG} SONDAGEM TRUNCADA em {max_paginas} página(s) por recorte — os números "
              f"abaixo são de amostra, não do município inteiro.")
    autos = {l["numero_ai"] for l in linhas if l["numero_ai"]}
    print(f"{LOG} {len(linhas)} linha(s) montada(s) para {len(autos)} auto(s) distinto(s) "
          f"(armadilha 1: linha nao e auto)")
    for l in linhas[:5]:
        print(f"       AI {l['numero_ai']:<10} {l['data_lavratura']} {(l['nome_autuado'] or '')[:34]:<34} "
              f"cod={l['codigo_infracao']!r} multa={l['valor_multa']!r} "
              f"status={l['status_ai']!r}/{l['status_debito']!r}")


# ──────────────────────────────── sync ─────────────────────────────────


def _exigir_mg(id_municipio: str) -> None:
    if not (id_municipio or "").startswith(_PREFIXO_IBGE_MG):
        raise RuntimeError(
            f"{LOG} {id_municipio} não é de Minas Gerais. O CAP é o sistema de autuação "
            f"ESTADUAL da SEMAD-MG e não cobre outra UF — para autuação federal use "
            f"`etl.apis.ibama_fiscalizacao`."
        )


def sync(id_municipio: str, *, permitir_reducao: bool, pausa: float) -> None:
    _exigir_mg(id_municipio)
    cidade = carregar_municipio(id_municipio)
    print(f"{LOG} {cidade['nome']}-{cidade['uf']} ({id_municipio})")
    linhas, diag = coletar(id_municipio, cidade["nome"], pausa=pausa)
    _gravar(cidade, linhas, diag, permitir_reducao)


def _gravar(cidade: dict, linhas: list[dict], diag: dict, permitir_reducao: bool) -> None:
    if not linhas:
        # Município de MG sem nenhuma autuação estadual é raro mas possível;
        # refresh total com lista vazia apagaria histórico sem esta guarda.
        print(f"{LOG} nada coletado para {cidade['nome']} — NÃO apago o que já existe.")
        return

    declarado = diag.get("total_declarado")
    if declarado and len(linhas) < declarado:
        # Não aborta: a fonte roda rotina de madrugada e o total pode mudar
        # entre a primeira página e a última. Mas fica gritado no log.
        print(f"{LOG} ATENÇÃO: {len(linhas)} linha(s) montada(s) contra {declarado} "
              f"declarada(s) pela fonte (export-count: {diag.get('total_export_count')}). "
              f"Coleta possivelmente truncada.")

    client = get_supabase_client()
    refresh_completo_seguro(
        client,
        "cap_autos_infracao",
        {"id_municipio": cidade["id_municipio"]},
        linhas,
        permitir_reducao=permitir_reducao,
        rotulo="etl.apis.cap_autos_infracao",
    )
    print(f"{LOG} cap_autos_infracao: {len(linhas)} linha(s) gravada(s).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument("--permitir-reducao", action="store_true")
    parser.add_argument("--sondar", action="store_true", help="consulta e relata, NÃO grava, NÃO lê o banco")
    parser.add_argument("--nome-municipio", help="só com --sondar: a fonte filtra por NOME, não por código IBGE")
    parser.add_argument("--paginas", type=int, help="só com --sondar: teto de páginas por recorte (amostra)")
    parser.add_argument("--pausa", type=float, default=PAUSA_PADRAO, help="segundos entre requisições")
    args = parser.parse_args()

    try:
        if args.sondar:
            if not args.nome_municipio:
                raise RuntimeError(
                    f"{LOG} --sondar exige --nome-municipio: a fonte não tem código IBGE "
                    f"(armadilha 6) e --sondar não lê o banco."
                )
            sondar(args.id_municipio, args.nome_municipio, args.pausa, args.paginas)
        else:
            sync(args.id_municipio, permitir_reducao=args.permitir_reducao, pausa=args.pausa)
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
