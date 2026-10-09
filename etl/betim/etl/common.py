import os
from dotenv import load_dotenv

load_dotenv()

ID_MUNICIPIO_DEFAULT = "3106705"
CITY_HALL_CNPJ = "18715391000196"
CITY_LAT = float(os.environ.get("CITY_LAT", "-19.9681"))
CITY_LNG = float(os.environ.get("CITY_LNG", "-44.1983"))

DATABASE_URL = os.environ.get("DATABASE_URL")

PAGE_SIZE = 1000

# Teto de placeholders de um INSERT do Postgres é 65.535. A margem existe
# porque o cálculo do lote usa o número de colunas do LOTE, e uma linha com
# uma coluna extra (o padrão `upsert_com_colunas_opcionais`) mudaria a conta
# no meio.


# Schema Postgres deste app. O banco (Neon) é COMPARTILHADO com o
# /congresso e o /judiciario, que vivem em schemas próprios; as tabelas
# deste eixo são as do `public` (61 tabelas), como já eram no Supabase.
SCHEMA = "public"

"""Utilitarios e client do ETL de Betim.

O adapter Postgres saiu daqui para `etl.pg_adapter` em 09/10/2026, quando
o arquivo passou de 600 linhas (teto do CodeScene). Tudo que os ~30
modulos do ETL importam de `etl.common` continua vindo DE LA - o bloco
abaixo re-exporta de proposito, para nenhum chamador precisar mudar.
Ver `etl.pg_adapter` para o que mora la e `etl/common_test.py` para a
prova de equivalencia."""

from etl.pg_adapter import (  # noqa: F401 - re-export de proposito
    _QueryBuilder,
    _Response,
    _adapt,
    _colunas_de,
    _inserir_lotes,
    _row_out,
    _rows_out,
    PgAPIError,
    _TETO_PLACEHOLDERS,
)

class PgClient:
    """Cliente Postgres com a mesma chamada `.table(x)...` do client antigo.

    Fala Postgres direto (DSN de `DATABASE_URL`), sem HTTP no meio. Dev da
    conexão, e por isso o único que pode trocá-la: o servidor encerra
    sessão ociosa e várias coletas deste eixo passam muito tempo entre uma
    escrita e a seguinte. Ver `_QueryBuilder.execute`."""

    def __init__(self, dsn: str, schema: str):
        self._dsn = dsn
        self._schema = schema
        self._conn = None
        self.conexao()

    def conexao(self):
        """A conexão viva. Reabre se estiver fechada — o caso comum é o
        `conn.closed` já verdadeiro depois de o servidor ter derrubado a
        sessão, sem que nada do lado do cliente tenha percebido."""
        import psycopg

        if self._conn is None or self._conn.closed:
            self._conn = psycopg.connect(self._dsn, autocommit=True)
            self._conn.execute(f'SET search_path TO "{self._schema}", public')
        return self._conn

    def reconectar(self):
        """Descarta a conexão atual e abre outra. Chamado por `execute()`
        quando um erro de transporte já aconteceu — aí `closed` pode ainda
        estar falso, então forçar é o único caminho."""
        try:
            if self._conn is not None:
                self._conn.close()
        except Exception:
            # Fechar uma conexão que o servidor já matou pode estourar; o
            # ponto aqui é largar a referência, não fechar com elegância.
            pass
        self._conn = None
        return self.conexao()

    def table(self, name: str) -> _QueryBuilder:
        return _QueryBuilder(self, self._schema, name)


def get_db() -> PgClient:
    """Cliente do banco do app para o ETL: `client = get_db()`.

    Usa o `DATABASE_URL` do .env (mesma variável de `apps/web/.env.local`).
    `autocommit=True`: cada chamada `.execute()` já é sua própria transação
    — não precisa de commit/rollback manual, e um erro num lote não
    invalida os anteriores."""
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL não configurado no .env — aponte para o banco do "
            "app (mesma variável usada por apps/web/.env.local) antes de "
            "rodar qualquer ETL."
        )

    return PgClient(DATABASE_URL, SCHEMA)


def carregar_municipio(id_municipio: str) -> dict:
    """A linha de `municipios`, com `fontes` já desembrulhado.

    POR QUE ISTO EXISTE (bug real, 2026-08-03): vários módulos aceitavam a
    cidade por `--id-municipio` mas mantinham os OUTROS parâmetros da mesma
    cidade como default de argparse — `etl.apis.anp` tinha
    `--uf MG --municipio BETIM`. Rodar `--id-municipio 3550308` sozinho
    coletou os 63 postos de Betim e os gravou com o id de São Paulo; como o
    upsert casa por `cnpj`, os postos de Betim não foram duplicados, foram
    REETIQUETADOS — a página de Betim ficou vazia e a de São Paulo, errada.
    Nenhum erro foi levantado: os dois argumentos são `str` e o comando
    parecia certo.

    A correção estrutural é esta função: o nome, a UF e as configurações da
    cidade saem do BANCO a partir do id, não da linha de comando. O id vira
    a única coisa que o operador escolhe, e escolher errado passa a ser
    impossível de forma silenciosa — ou o id existe e traz tudo consistente,
    ou não existe e o módulo aborta.
    """
    client = get_db()
    linhas = (
        client.table("municipios")
        .select("id_municipio, nome, uf, cnpj_prefeitura, lat, lng, branding, fontes")
        .eq("id_municipio", id_municipio)
        .execute()
        .data
    )
    if not linhas:
        raise RuntimeError(
            f"id_municipio={id_municipio} não existe em `municipios`. "
            "Semeie a cidade antes de rodar o ETL (supabase/betim/migrations/)."
        )
    m = dict(linhas[0])
    m["fontes"] = m.get("fontes") or {}
    m["branding"] = m.get("branding") or {}
    return m


def nome_para_fonte_externa(nome: str) -> str:
    """"São Paulo" -> "SAO PAULO".

    Convenção compartilhada por várias fontes federais que casam município
    por NOME em vez de código: a ANP devolve `data: []` — sem erro — para
    "São Paulo" ou "Sao Paulo", e só responde a "SAO PAULO". O Portal da
    Transparência escreve o ente como "MUNICIPIO DE SAO PAULO". Centralizar
    a normalização evita que cada módulo reinvente (e erre) o `unicodedata`.
    """
    import unicodedata

    sem_acento = unicodedata.normalize("NFD", nome)
    sem_acento = "".join(c for c in sem_acento if unicodedata.category(c) != "Mn")
    return sem_acento.upper()


# Abaixo do limiar, `resolver_municipio_mg` NÃO adivinha: devolve None e quem
# chamou loga "sem match confiável" e pula o registro. 0.6 medido contra os
# pares reais das fontes ("BELO HORIZONTE - MG" -> "Belo Horizonte" bate
# 0.83; municípios sem relação nenhuma medidos abaixo de 0.35) — ver a nota
# na migration `0057_ref_municipios_mg.sql`.
LIMIAR_SIMILARIDADE_MUNICIPIO_MG = 0.6

_cache_catalogo_municipios_mg: dict[str, dict] | None = None


def _normalizar_nome_municipio_mg(s: str) -> str:
    """Sem acento, maiúsculo, sem sufixo " - MG", espaço único.

    Usado só no passo 1 (igualdade) de `resolver_municipio_mg` — o passo 2
    (similaridade) roda no banco, via `unaccent_immutable`/`pg_trgm`
    (migration `0046_busca_legislativa_unaccent.sql`), porque comparar
    trigrama em Python reimplementaria o que o Postgres já faz."""
    import re
    import unicodedata

    base = unicodedata.normalize("NFD", s or "")
    sem_acento = "".join(c for c in base if unicodedata.category(c) != "Mn")
    sem_acento = sem_acento.upper().replace("\xa0", " ")
    sem_acento = re.sub(r"\s*-\s*MG\s*$", "", sem_acento)
    return " ".join(sem_acento.split())


def _catalogo_municipios_mg(client) -> dict[str, dict]:
    """As linhas de `ref_municipios_mg` (as 853 cidades de MG + o
    grandfather de cidade do portal fora de MG — ver migration `0057`),
    indexadas pelo nome normalizado. Cacheada NO PROCESSO: cada rodada de
    `etl.apis.feam_barragens`/`etl.apis.snisb_barragens` casa dezenas a
    milhares de nomes contra o mesmo catálogo, e ele cabe de sobra em
    memória (~850 linhas) — sem a cache seriam outras tantas consultas."""
    global _cache_catalogo_municipios_mg
    if _cache_catalogo_municipios_mg is None:
        linhas = client.table("ref_municipios_mg").select("id_ibge, nome").execute().data
        _cache_catalogo_municipios_mg = {
            _normalizar_nome_municipio_mg(r["nome"]): r for r in linhas
        }
    return _cache_catalogo_municipios_mg


def resolver_municipio_mg(
    client, nome_fonte: str | None, *, limiar: float = LIMIAR_SIMILARIDADE_MUNICIPIO_MG
) -> dict | None:
    """Casa `nome_fonte` (grafia CRUA da fonte — ex. `MUNICÍPIO` da FEAM,
    `ING_NM_MUNICIPIO` do SNISB) contra `ref_municipios_mg.nome`.

    Existe para substituir o abort de `carregar_municipio` quando o alvo é
    UMA cidade de cada vez presa a `municipios` (6 linhas) — aqui o
    casamento é por NOME, contra o catálogo estadual, então cobre qualquer
    uma das ~853 cidades de MG sem depender de `municipios`.

    Dois passos, nesta ordem:

      1. Igualdade normalizada (sem acento, maiúsculo, sem sufixo " - MG") —
         cobre a maioria: "BELO HORIZONTE - MG" == "Belo Horizonte".
      2. Se não bateu, similaridade via `pg_trgm` (`similarity()`) contra
         TODAS as linhas do catálogo, no banco — ~850 linhas é barato para
         sequential scan, não vale forçar o índice trigram (que ajudaria
         mais numa tabela grande ou num `WHERE nome % $1`). Comparação já
         passa por `unaccent_immutable(upper(...))` dos dois lados, senão
         "BETIM" vs "Betim" perderia trigrama por causa da caixa/acento, não
         por erro de digitação de verdade.

    Abaixo do limiar NÃO adivinha: devolve `None`. Quem chamou decide (logar
    "sem match confiável" e pular o registro — nunca gravar linha órfã).

    Devolve `{"id_ibge", "nome", "via": "exato"|"similaridade", "score"}` ou
    `None`.
    """
    if not nome_fonte or not nome_fonte.strip():
        return None

    alvo = _normalizar_nome_municipio_mg(nome_fonte)
    catalogo = _catalogo_municipios_mg(client)
    exato = catalogo.get(alvo)
    if exato:
        return {"id_ibge": exato["id_ibge"], "nome": exato["nome"], "via": "exato", "score": 1.0}

    from psycopg.rows import dict_row

    with client.conexao().cursor(row_factory=dict_row) as cur:
        cur.execute(
            "select id_ibge, nome, "
            "similarity(upper(public.unaccent_immutable(nome)), "
            "upper(public.unaccent_immutable(%s))) as score "
            "from ref_municipios_mg "
            "order by score desc "
            "limit 1",
            (nome_fonte,),
        )
        linha = cur.fetchone()
    if linha and linha["score"] is not None and linha["score"] >= limiar:
        return {
            "id_ibge": linha["id_ibge"],
            "nome": linha["nome"],
            "via": "similaridade",
            "score": float(linha["score"]),
        }
    return None


def fetch_all(query_factory, page_size: int = PAGE_SIZE) -> list[dict]:
    """Roda um select por quantas páginas `.range()` forem necessárias.

    Continua existindo depois da troca para Postgres direto (onde não há
    mais o corte de 1000 linhas do PostgREST) porque cada query aqui é uma
    SELECT completa com LIMIT/OFFSET — paginar em fatias evita uma única
    página gigante numa tabela que cresce. O bug que motivou o helper foi
    achado ao vivo em 2026-07-21 em `_check_regra_10` de `etl/alertas.py`
    (despesas tem 4263+ linhas; anos inteiros faltavam em silêncio).

    `query_factory` é um callable de zero argumentos que devolve um builder
    NOVO a cada chamada (ex.:
    `lambda: client.table("contratos").select("id, valor").eq("id_municipio", x)`)
    — não um builder pronto, para poder rechamar `.range()` a cada página.
    """
    rows: list[dict] = []
    page = 0
    while True:
        resp = query_factory().range(page * page_size, page * page_size + page_size - 1).execute()
        batch = resp.data or []
        rows.extend(batch)
        if len(batch) < page_size:
            break
        page += 1
    return rows


# `analises.ato_id` e `analises.proposicao_id` são `references ... on delete
# cascade` (migration 0033). Todo refresh total nestas duas tabelas é um
# delete, e o delete leva a análise junto — sem erro, sem log, sem nada.
_COLUNA_DE_ANALISE = {"atos_oficiais": "ato_id", "proposicoes": "proposicao_id"}


def _contar_analises_apontando(client, id_municipio: str, outra: str) -> int:
    """Quantas análises do município apontam para a tabela através de `outra`.

    Devolve 0 quando a tabela `analises` não existe (42P01 = migration 0033
    não rodada neste banco): não há análise para perder, seguir é correto.
    Qualquer outro erro PROPAGA — um guarda que vira aviso quando a
    checagem falha não é guarda nenhum, e foi assim que este quase entrou.

    Saiu de `_abortar_se_cascatear_analise` em 09/10/2026 (hotspots
    CodeScene): o `try/except` com o `if` de código dentro era metade da
    complexidade do guarda.
    """
    try:
        n = (
            client.table("analises")
            .select("id", count="exact")
            .limit(1)
            .eq("id_municipio", id_municipio)
            .is_(outra, None)
            .execute()
            .count
            or 0
        )
    except PgAPIError as e:
        if getattr(e, "code", None) != "42P01":
            raise
        return 0
    return n


def _abortar_se_cascatear_analise(client, table: str, filtros: dict, permitido: bool) -> None:
    """Impede que um refresh total apague análise garantista em silêncio.

    O PERIGO É REAL E CARO. `refresh_completo_seguro` é delete+insert, então
    toda linha renasce com uuid novo; e como a 0033 pendurou `analises` em
    `atos_oficiais`/`proposicoes` com `on delete cascade`, refazer a
    legislação de uma cidade apaga as análises DELA. As 245 análises do
    banco custaram uma fila inteira de trabalho de modelo, e some tudo sem
    exceção, sem aviso, sem linha de log — o sintoma seria a tela de alertas
    ficar vazia dias depois e ninguém saber por quê.

    Não basta o guarda de redução: aqui a tabela pode até CRESCER (foi o que
    aconteceu com as proposições de BH, 3.667 -> 3.681) e a análise morrer
    do mesmo jeito.

    O guarda não é esperto: se há análise sob o mesmo recorte, ele para e
    manda quem chamou decidir. Reanalisar é caro, mas é caro e visível — o
    contrário do que acontecia aqui.

    O quinto parâmetro (`tag`) foi removido em 09/10/2026 por estar SEM
    USO no corpo — ele só era repassado, e a mensagem não o citava. Com
    isso a função voltou para 4 argumentos, o teto do CodeScene.
    """
    coluna = _COLUNA_DE_ANALISE.get(table)
    if coluna is None:
        return
    if permitido:
        return
    id_municipio = filtros.get("id_municipio")
    if not id_municipio:
        return
    # `analises` só tem as duas colunas de objeto, e exatamente uma delas é
    # preenchida por linha (a 0033 garante). Então "aponta para atos" é o
    # mesmo que "proposicao_id IS NULL", e vice-versa — o que evita depender
    # de um `IS NOT NULL` que este cliente não expõe.
    outra = "proposicao_id" if coluna == "ato_id" else "ato_id"
    n = _contar_analises_apontando(client, id_municipio, outra)
    if n == 0:
        return
    raise RuntimeError(
        f"{table}: há {n} análise(s) garantista(s) de id_municipio={id_municipio} "
        f"apontando para esta tabela, e `analises.{coluna}` é ON DELETE CASCADE — "
        "o refresh total apagaria todas elas em silêncio. Exporte/reimporte as "
        "análises depois, ou rode com permitir_perda_de_analise=True se a perda "
        "for aceitável e você for reanalisar."
    )


def _contar_atuais(client, table: str, filtros: dict) -> int:
    """Quantas linhas já existem no banco sob os `filtros` do refresh.

    Saiu de `refresh_completo_seguro` em 09/10/2026 (hotspots CodeScene):
    o `for` de `.eq()` dentro do corpo era um dos bumps do método.
    """
    q = client.table(table).select("*", count="exact").limit(1)
    for col, val in filtros.items():
        q = q.eq(col, val)
    return q.execute().count or 0


def _apagar_sob_filtros(client, table: str, filtros: dict) -> None:
    """O DELETE do refresh — sempre filtrado, nunca a tabela inteira.

    Saiu de `refresh_completo_seguro` em 09/10/2026 (hotspots CodeScene).
    """
    q = client.table(table).delete()
    for col, val in filtros.items():
        q = q.eq(col, val)
    q.execute()


def _gravar_em_lotes(client, table: str, rows: list[dict], chunk: int) -> None:
    """Insere `rows` de `chunk` em `chunk`.

    Fatiar existe porque uma instrução só com milhares de linhas estoura
    memória de trabalho do Postgres em tabela larga. Saiu de
    `refresh_completo_seguro` em 09/10/2026 (hotspots CodeScene).
    """
    for i in range(0, len(rows), chunk):
        client.table(table).insert(rows[i : i + chunk]).execute()


def refresh_completo_seguro(
    client,
    table: str,
    filtros: dict,
    rows: list[dict],
    *,
    chunk: int = 200,
    permitir_reducao: bool = False,
    permitir_perda_de_analise: bool = False,
    ao_reduzir: str = "abort",
    rotulo: str | None = None,
) -> bool:
    """`delete` + `insert` (refresh total) que se RECUSA a encolher a tabela.

    Existe por causa de um dano real: em 2026-07-29 uma rodada de
    `etl/camaras/verbas.py` levou `verbas_indenizatorias` de 98 para 43
    linhas sem erro nenhum. O módulo apagava tudo do município e reinseria
    só o que a raspagem daquela rodada devolveu -- e a raspagem depende de
    quantas linhas a grid Blazor resolveu renderizar. Fonte rendeu menos,
    banco perdeu histórico.

    Regra: se a raspagem trouxe MENOS linhas do que já existem no banco sob
    os mesmos `filtros`, nada é apagado. O delete só acontece quando
    `len(rows) >= contagem_atual` -- crescimento e reescrita do mesmo
    tamanho seguem normais (é assim que correções de valor entram).

    `ao_reduzir`:
    - "abort" (padrão): levanta RuntimeError, a rodada falha alto.
    - "skip": imprime aviso, devolve False e segue -- para os call sites que
      varrem N entidades e não devem perder as outras N-1 por causa de uma.

    `permitir_reducao=True` é a válvula de escape para quando a redução é
    real (registro removido na fonte): confirme na fonte e rode de novo com
    a flag. Nunca é o default.

    `permitir_perda_de_analise=True` libera o outro guarda, o de
    `_abortar_se_cascatear_analise` — leia a docstring dele antes.

    Devolve True se escreveu, False se pulou.

    Os quatro blocos de trabalho saíram daqui em 09/10/2026 (hotspots
    CodeScene — o método estava com cc 15): `_contar_atuais`,
    `_abortar_se_cascatear_analise`, `_apagar_sob_filtros` e
    `_gravar_em_lotes`. Este corpo ficou sendo só a ORDEM e as decisões.

    Os 9 argumentos (7 posicionais + 2 keyword-only) são acima do teto de
    4 do CodeScene, e assim ficam: é uma API pública chamada por ~30
    módulos do ETL, e agrupar num objeto de opções trocaria a
    legibilidade de todo call site por um ponto de saúde. Registrado de
    propósito para a próxima sessão não tentar de novo.
    """
    if not rows:
        raise ValueError(
            f"refresh_completo_seguro em '{table}': `rows` vazio nunca deve chegar aqui "
            "-- o caller precisa tratar raspagem vazia antes (senão isso é um delete puro)."
        )
    if ao_reduzir not in ("abort", "skip"):
        raise ValueError(f"ao_reduzir inválido: {ao_reduzir!r} (use 'abort' ou 'skip')")

    tag = rotulo or f"etl.common/{table}"
    atuais = _contar_atuais(client, table, filtros)

    if len(rows) < atuais and not permitir_reducao:
        msg = (
            f"{table}: raspagem trouxe {len(rows)} linha(s) mas o banco já tem {atuais} "
            f"sob {filtros} — refresh total abortado para não apagar histórico. "
            "Se a fonte realmente perdeu registros, confirme e rode com "
            "permitir_reducao=True (--permitir-reducao)."
        )
        if ao_reduzir == "abort":
            raise RuntimeError(msg)
        print(f"[{tag}] AVISO: {msg}")
        return False

    _abortar_se_cascatear_analise(client, table, filtros, permitir_perda_de_analise)
    _apagar_sob_filtros(client, table, filtros)
    _gravar_em_lotes(client, table, rows, chunk)

    if len(rows) < atuais:
        print(f"[{tag}] redução aceita explicitamente: {atuais} -> {len(rows)} linha(s).")
    return True


def upsert_com_colunas_opcionais(
    client, table: str, rows: list[dict], colunas_opcionais: list[str], **upsert_kwargs
):
    """`client.table(table).upsert(rows, **upsert_kwargs)`, mas tolera
    colunas em `colunas_opcionais` que ainda não existem no banco.

    Pra colunas novas cujo código de escrita já foi commitado mas cuja
    migration ainda não foi rodada pelo usuário (padrão recorrente deste
    projeto -- `caixa_disponivel`/0011 é o mesmo caso, só que lá é uma
    TABELA nova então a query inteira falha isolada; aqui é uma COLUNA
    nova numa tabela que o ETL já escreve toda vez, então incluir a
    coluna sem essa rede de segurança quebraria o upsert INTEIRO —
    inclusive as colunas que já existiam — até a migration rodar).

    Tenta o upsert completo primeiro; se o Postgres devolver 42703
    (undefined_column), remove as `colunas_opcionais` de cada linha e
    tenta de novo, uma vez, com aviso impresso. Qualquer outro erro
    propaga normalmente -- só esse código específico é tratado como
    "coluna ainda não existe", não como "engolir erro genérico"."""
    try:
        return client.table(table).upsert(rows, **upsert_kwargs).execute()
    except PgAPIError as e:
        # 42703 = Postgres undefined_column. Antes da troca para psycopg
        # também se tratava PGRST204 (PostgREST não achou a coluna no cache
        # de schema); falando com o banco direto, esse caso não existe mais
        # -- o erro chega cru como 42703.
        if e.code != "42703":
            raise
        print(
            f"[etl.common] upsert em '{table}': coluna opcional ainda não existe "
            f"({e.message}) -- gravando sem {colunas_opcionais} até a migration rodar."
        )
        rows_sem_opcionais = [
            {k: v for k, v in row.items() if k not in colunas_opcionais} for row in rows
        ]
        return client.table(table).upsert(rows_sem_opcionais, **upsert_kwargs).execute()
