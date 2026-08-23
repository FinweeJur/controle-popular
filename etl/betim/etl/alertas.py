"""etl.alertas — alert engine over `contratos`, implementing plan §8 rules.

Usage: python -m etl.alertas --id-municipio 3106705

Full recompute every run (same "replace, don't incrementally upsert"
philosophy as `etl.grupos`): every contract belonging to `id_municipio` has
its `alerta`/`motivos_alerta` recalculated from scratch and written via a
batched upsert on `id`, so a contract that no longer matches any rule gets
its alert *cleared*, not left stale — a contract's status can both trigger
and resolve over time (aditivo paid down, supplier reinstated, etc.).

Runs rules 1-5, 7, 8, 9 from plan §8, plus a new Rule 11 (added 2026-08-11,
not part of the original plan §8 — see below), against `contratos`. Rule 10
is a standalone, log-only check (see `_check_regra_10`). Rule 6 is
intentionally not implemented this round:

  - **Rule 6** (CNAE vs contract-object mismatch) is specified as "LLM
    classification, cached" — there is no AI client wired into this codebase
    yet (that's F8, plan §9). # TODO rule 6: implement once F8's AI layer
    exists. Deliberately *omitted* from the active rule list below rather
    than stubbed as an always-false check, per instructions.
  - **Rule 10** (health/education spending below the 15%/25% constitutional
    minimums) operates on `despesas`/`receitas` aggregates, not on
    individual `contratos` rows — there's no `contratos.alerta` to set and
    no schema yet for a structural finding of this shape. This module runs
    it as a standalone check that only prints its result to stdout; that's
    a deliberate scoping decision for this round, not an oversight.

Other simplifications worth flagging explicitly (also commented inline at
each rule):

  - **Rule 1** (value > mean + 2*stdev of "similar" contracts by trigram
    similarity, last 2 years): true `pg_trgm` similarity isn't
    straightforward to express through the supabase-py client without a
    custom Postgres RPC function, so this takes the plan's documented
    fallback — group contracts by `categoria` (or, when that's empty, the
    first 40 normalized characters of `objeto`) and compute mean + 2*stdev
    per group in plain Python. Coarser than fuzzy trigram matching (exact
    key match instead of "roughly similar wording"), but delivers the rule
    rather than silently dropping it.
  - **Rule 2** (dispensa >= 90% of the Lei 14.133 threshold): the plan
    doesn't pin down which column carries contract modality or the exact
    in-force threshold values. This implementation treats a contract as
    "dispensa" when `licitacoes.modalidade_nome` for the matching
    `numero_controle_pncp` (or, failing that, `contratos.categoria`/
    `contratos.tipo`) contains "dispensa" case-insensitively, and uses the
    Lei 14.133/2021 Art. 75 thresholds fixed by owner decision on
    2026-08-22: R$ 400.000 for obras/serviços de engenharia and
    R$ 100.000 for outros serviços/compras de bens e serviços comuns.
    (Versão anterior usava R$ 100.000/R$ 50.000 — valores que NÃO são os
    do art. 75; a troca foi feita na sprint "revisao-dados" e exige
    rodada de ETL no home-pc para chegar ao banco.) The statute values
    are not decree-adjusted, but the mapping objeto->engenharia é por
    palavra-chave e pode errar o lado; revisar amostra periodicamente.

Rule 11 (new, not in plan §8) closes a real blind spot found live in
Rule 1: a contract gets a mean+2*stdev baseline only if its `categoria`/
`objeto`-prefix group has >= MIN_AMOSTRA_BASELINE members *inside Rule 1's
own 2-year window* — a contract whose group is that small, or that has
simply aged out of the window, is silently never evaluated by Rule 1, no
matter how large its value. Found live: a R$900 million "show artístico"
contract in Araçuaí (~5x that city's entire annual revenue) had zero
alerts. Rule 11 flags a contract Rule 1 can't baseline if its value alone
exceeds half of the municipality's total annual revenue for that year —
see `PCT_ORCAMENTO_LIMIAR_OUTLIER_ABSOLUTO` above for the full rationale,
the rejected p99-percentile alternative, and the real-data check against
all 6 cities' contracts (max non-outlier ratio found: 26.96%, in Belo
Horizonte).

Cron: **weekly**. Plan §8 itself says "alert engine + nightly recompute",
but that's inconsistent with the plan's own cron matrix: §5.4's weekly
Monday post-processing steps explicitly list "recompute grupos_economicos
... re-run alert engine", and §11 F4.4 groups it with `etl.grupos`. "Nightly"
in §8 reads as a stray adjective, not the authoritative cadence — §5.4 is,
and that's what should land in `.github/workflows/etl.yml`'s weekly step.
"""
import argparse
import datetime as dt
import statistics
import sys
import unicodedata

from etl.common import ID_MUNICIPIO_DEFAULT, fetch_all, get_supabase_client

CHUNK_SIZE = 500

# ── Rule reason strings (stored verbatim in contratos.motivos_alerta[]) ────
REGRA_1 = "regra_1_valor_atipico_para_categoria"
REGRA_2 = "regra_2_dispensa_proxima_limite"
REGRA_3 = "regra_3_aditivos_elevados"
REGRA_4 = "regra_4_capital_social_baixo"
REGRA_5 = "regra_5_fornecedor_sancionado_ceis"
REGRA_7 = "regra_7_situacao_cadastral_irregular"
REGRA_8 = "regra_8_muitos_contratos_janela_curta"
REGRA_9 = "regra_9_grupo_economico_contratos_relacionados"
REGRA_11 = "regra_11_valor_absurdo_para_orcamento_municipal"

# ── Rule 1: statistical outlier baseline ───────────────────────────────────
JANELA_BASELINE_DIAS = 365 * 2          # "last 2 years" per plan §8 rule 1
MIN_AMOSTRA_BASELINE = 3                # need >=3 contracts to estimate a stdev meaningfully
PREFIXO_OBJETO_LEN = 40                 # fallback grouping key when categoria is empty

# ── Rule 2: Lei 14.133/2021 Art. 75 direct-award (dispensa) thresholds ─────
# CORRIGIDO 2026-08-22 (decisão do dono, sprint revisao-dados): os valores
# do art. 75 são R$ 400.000 para obras/serviços de engenharia e R$ 100.000
# para bens/serviços comuns — a versão anterior (100.000/50.000) não eram
# os valores da lei. O alerta dispara em >= 90% do limite (indício de
# fracionamento). Exige rodada de ETL no home-pc para chegar ao banco.
LIMIAR_DISPENSA_ENGENHARIA = 400_000.00
LIMIAR_DISPENSA_OUTROS = 100_000.00
PCT_LIMIAR_DISPENSA = 0.90
_ENGENHARIA_KEYWORDS = ("obra", "engenharia", "reforma", "construç", "pavimenta", "edifica")

# ── Rule 3: amendments vs initial value ────────────────────────────────────
# CORRIGIDO 2026-07-23 (revisão jurídica, ver docs/alertas-contratos-revisao-juridica.md):
# o limiar era 0.50 para TODO contrato — mas o Art. 125 da Lei 14.133/2021
# só permite 50% de acréscimo para reforma de edifício ou equipamento; o
# teto geral (obras, serviços, compras comuns) é 25%. Um contrato comum com
# 30-49% de aditivo já está ACIMA do limite legal e não gerava alerta
# nenhum antes desta correção — sub-alertava exatamente os casos mais
# comuns. Reaproveita `_eh_engenharia()` (já usada na Regra 2) para aplicar
# o teto certo por tipo de contrato.
PCT_ADITIVOS_LIMIAR_GERAL = 0.25
PCT_ADITIVOS_LIMIAR_REFORMA = 0.50

# ── Rule 4: supplier capital vs contract value ─────────────────────────────
PCT_CAPITAL_MINIMO = 0.05

# ── Rule 8: many contracts to the same CNPJ in a short window ─────────────
JANELA_MUITOS_CONTRATOS_DIAS = 90
QTD_MUITOS_CONTRATOS_LIMIAR = 3

# ── Rule 9: same economic group winning related contracts ─────────────────
# Longer window than rule 8: coordinating award timing *across* separate
# legal entities is harder to pull off inside a tight 90-day window, so a
# 1-year window is used to catch slower-moving patterns. Judgment call,
# documented per the task spec.
JANELA_GRUPO_ECONOMICO_DIAS = 365
QTD_GRUPO_ECONOMICO_LIMIAR = 2

# ── Rule 10: constitutional spending minimums (log-only) ──────────────────
MIN_SAUDE_PCT = 0.15
MIN_EDUCACAO_PCT = 0.25

# ── Rule 11 (NOVA, 2026-08-11): outlier absoluto quando a Regra 1 não tem
# base estatística pra avaliar ────────────────────────────────────────────
# ACHADO QUE MOTIVOU ESTA REGRA: contrato de R$900 milhões pra um show do
# cantor Wesley Safadão em Araçuaí/MG (assinado 2024-07-04), ~5x a receita
# bruta realizada da cidade INTEIRA em 2024 (R$181,1mi) -- sem alerta algum.
#
# A causa raiz medida NÃO é exatamente a hipótese original ("único contrato
# da categoria 'show artístico'"): `categoria` neste banco é um campo raso
# (só "Serviços"/"Compras"/"Obras"/"Locação Imóveis"), e "Serviços" tem 39
# membros em Araçuaí -- grupo grande o bastante pra Regra 1 em tese. O que
# realmente derruba a Regra 1 é a JANELA MÓVEL de 2 anos
# (JANELA_BASELINE_DIAS): rodando hoje, um contrato de 2024-07 já caiu fora
# da janela e nunca entra em grupo nenhum -- nem grande, nem pequeno, porque
# nunca chega a ser CONSIDERADO. Confirmado ao vivo consultando o banco
# (ver relatório desta sessão). Isso não invalida o pedido original: um
# contrato realmente único numa categoria também cai no mesmo buraco (grupo
# de 1 é sempre < MIN_AMOSTRA_BASELINE), e os dois casos têm a MESMA
# assinatura observável -- "o grupo deste contrato na janela de 2 anos da
# Regra 1 tem menos de MIN_AMOSTRA_BASELINE membros" é verdade tanto se o
# grupo é pequeno quanto se o contrato está fora da janela (grupo vazio, 0
# membros). A Regra 11 usa exatamente essa condição unificada como gatilho
# (ver `_regra_11`) -- não filtra por janela pra decidir SE avalia (teto de
# orçamento não perde validade com o tempo, diferente de "atividade recente
# incomum"), só usa a janela pra saber se a Regra 1 já cobriu o caso.
#
# CRITÉRIO ESCOLHIDO: fração da receita bruta realizada ANUAL do município
# (`receitas`, mesmo estágio usado na Regra 10) -- não percentil (p99) dos
# contratos da própria cidade, que era a outra opção cogitada. Dois motivos:
#   1. Autorreferência: o p99 de uma lista que já contém o próprio outlier
#      sobe junto com ele. Numa cidade com poucos contratos (Araçuaí tem só
#      207), um único contrato de R$900mi PUXA o p99 pra cima o bastante
#      pra quase escapar do teto que deveria pegá-lo.
#   2. Amostra pequena: cidades menores têm poucas centenas de contratos --
#      p99 sobre isso é essencialmente "o 2º/3º maior contrato já visto",
#      não uma estimativa estatisticamente estável.
# Receita anual vem de fonte externa e objetiva (SICONFI/RREO, já usada na
# Regra 10) e escala com o porte do município sozinha -- não precisa
# comparar Araçuaí com São Paulo.
#
# LIMIAR (50% da receita anual) checado ao vivo contra os 12.886 contratos
# com valor+data das 6 cidades já coletadas (Araçuaí, Belo Horizonte,
# Betim, Diamantina, Itinga, São Paulo): fora do show de Araçuaí (496,9% da
# receita anual daquele ano), o maior valor real da base inteira é 26,96%
# (um contrato de execução de obras plurianual em BH -- plausível como
# valor GLOBAL de um contrato-guarda-chuva de vários anos, não um gasto de
# um ano só). Nenhum outro contrato de nenhuma cidade passa de 27%. 50%
# deixa quase 2x de margem ACIMA do maior caso legítimo observado e ainda
# pega o show de Araçuaí com quase 10x de folga -- não é "gastar metade do
# orçamento é normal", é "nenhum contrato único deveria consumir mais da
# metade de tudo que o município arrecada num ano inteiro, em qualquer
# porte de cidade". Limiar generosamente alto de propósito: esta regra não
# compete com a Regra 1 em casos limítrofes, só cobre a lacuna que sobra
# dela.
PCT_ORCAMENTO_LIMIAR_OUTLIER_ABSOLUTO = 0.50
# Nomes exatos de `conta` (mudou de rótulo entre RREOs antigos e novos, mas
# nunca os dois aparecem no mesmo ano -- somar é seguro, não duplica) que
# carregam o TOTAL bruto de receita do ano, sem filtrar por origem (ao
# contrário da base constitucional estreita da Regra 10) -- é a leitura
# mais direta de "tamanho do orçamento anual" que o schema atual oferece.
_CONTAS_RECEITA_TOTAL = ("Total Receitas", "TOTAL DAS RECEITAS (III) = (I + II)")


def _chunked(items: list, size: int):
    for i in range(0, len(items), size):
        yield items[i : i + size]


def _parse_date(value) -> dt.date | None:
    if not value:
        return None
    try:
        return dt.date.fromisoformat(str(value)[:10])
    except ValueError:
        return None


def _normalizar(texto: str) -> str:
    """Lowercase + strip accents, for loose keyword matching (funcao/objeto)."""
    texto = unicodedata.normalize("NFKD", texto or "")
    return "".join(ch for ch in texto if not unicodedata.combining(ch)).lower()


def _eh_engenharia(texto: str) -> bool:
    texto_normalizado = _normalizar(texto)
    return any(k in texto_normalizado for k in _ENGENHARIA_KEYWORDS)


# Distinto de `_eh_engenharia` (usado na Regra 2, teto de DISPENSA): o teto
# de 50% de ADITIVO do Art. 125 só vale pra "reforma de edifício ou de
# equipamento" — não pra obra/construção/pavimentação em geral, que ficam
# no teto padrão de 25% igual a qualquer outro contrato. Confundir os dois
# aplicaria a exceção larga demais.
_REFORMA_KEYWORDS = ("reforma",)


def _eh_reforma_edificio_ou_equipamento(texto: str) -> bool:
    texto_normalizado = _normalizar(texto)
    return any(k in texto_normalizado for k in _REFORMA_KEYWORDS)


# ── Rule implementations: each returns {contrato_id: motivo} ──────────────


def _agrupar_por_categoria_ou_prefixo(contratos: list[dict]) -> dict[str, list[dict]]:
    """Agrupa por `categoria` (ou, se vazia, o prefixo normalizado do
    `objeto`) -- chave de agrupamento compartilhada pelas Regras 1 e 11, pra
    garantir que as duas concordem sobre o que conta como "mesmo grupo"."""
    grupos: dict[str, list[dict]] = {}
    for c in contratos:
        chave = (c.get("categoria") or "").strip()
        if not chave:
            chave = (c.get("objeto") or "").strip().upper()[:PREFIXO_OBJETO_LEN]
        if not chave:
            continue
        grupos.setdefault(chave, []).append(c)
    return grupos


def _regra_1(contratos: list[dict], cutoff: dt.date) -> dict[str, str]:
    """Value > mean + 2*stdev of same-`categoria` contracts, last 2 years.

    See module docstring: fallback for true pg_trgm similarity. Population
    stdev (statistics.pstdev) is used because the 2-year window per group is
    treated as the whole baseline population being compared against, not a
    sample drawn from a larger one.
    """
    janela = [c for c in contratos if (d := _parse_date(c.get("data_assinatura"))) and d >= cutoff]
    grupos = _agrupar_por_categoria_ou_prefixo(janela)

    flagged: dict[str, str] = {}
    for membros in grupos.values():
        if len(membros) < MIN_AMOSTRA_BASELINE:
            continue
        valores = [float(m.get("valor_global") or 0) for m in membros]
        media = statistics.fmean(valores)
        desvio = statistics.pstdev(valores)
        if desvio == 0:
            continue
        limite = media + 2 * desvio
        for m in membros:
            if float(m.get("valor_global") or 0) > limite:
                flagged[m["id"]] = REGRA_1
    return flagged


def _receita_mais_proxima(receita_por_ano: dict[int, float], ano: int) -> float | None:
    """Receita bruta realizada do ano exato do contrato, ou do ano
    disponível mais próximo.

    O RREO/SICONFI não cobre nem o futuro (contrato assinado no ano
    corrente, ainda sem RREO fechado) nem o passado remoto (BH tem contrato
    de 2003; `receitas` só começa em 2015 neste banco). Pro objetivo desta
    regra -- achar valor absurdamente desproporcional, não conferir centavo
    a centavo -- a receita do ano disponível mais próximo já é referência
    boa o bastante pro porte do município naquele período.
    """
    if not receita_por_ano:
        return None
    if ano in receita_por_ano:
        return receita_por_ano[ano]
    return receita_por_ano[min(receita_por_ano, key=lambda a: abs(a - ano))]


def _regra_11(
    contratos: list[dict], cutoff: dt.date, receita_por_ano: dict[int, float]
) -> dict[str, str]:
    """Outlier absoluto vs. receita anual do município, só pros contratos
    que a Regra 1 não consegue avaliar (grupo categoria/prefixo com menos de
    MIN_AMOSTRA_BASELINE membros NA JANELA de 2 anos -- inclui tanto a
    categoria genuinamente rara quanto o contrato que já saiu da própria
    janela, cujo grupo ali é, por definição, vazio). Ver o bloco de
    constantes `PCT_ORCAMENTO_LIMIAR_OUTLIER_ABSOLUTO` acima pro achado que
    motivou a regra e a justificativa do critério/limiar.

    Ao contrário da Regra 1, esta regra AVALIA todos os contratos com
    valor+data (não só os da janela): o teto de orçamento não perde
    validade com o tempo -- um contrato de 2024 continuar
    desproporcional-pro-orçamento-de-2024 não depende de "hoje" ainda estar
    dentro de 2 anos daquela data. A janela aqui só decide se a REGRA 1 já
    cobriu o caso, não se a Regra 11 deve olhar pra ele.
    """
    janela = [c for c in contratos if (d := _parse_date(c.get("data_assinatura"))) and d >= cutoff]
    grupos_na_janela = _agrupar_por_categoria_ou_prefixo(janela)

    flagged: dict[str, str] = {}
    for c in contratos:
        valor = c.get("valor_global")
        data = _parse_date(c.get("data_assinatura"))
        if valor is None or float(valor) <= 0 or not data:
            continue

        # `data >= cutoff` importa AQUI, não só pra montar `grupos_na_janela`:
        # um contrato FORA da janela nunca é avaliado pela Regra 1, mesmo que
        # a categoria dele tenha dezenas de membros dentro da janela (foi
        # exatamente essa distinção que escondeu o show de R$900mi de
        # Araçuaí — "Serviços" tem membros de sobra na janela, só que este
        # contrato específico não é um deles). Checar só o tamanho do grupo,
        # sem confirmar que O CONTRATO em questão está dentro da janela,
        # deixava a Regra 11 pular exatamente o caso que ela deveria pegar.
        chave = (c.get("categoria") or "").strip()
        if not chave:
            chave = (c.get("objeto") or "").strip().upper()[:PREFIXO_OBJETO_LEN]
        if (
            data >= cutoff
            and chave
            and len(grupos_na_janela.get(chave, [])) >= MIN_AMOSTRA_BASELINE
        ):
            continue  # Regra 1 já tem base estatística suficiente pra este contrato

        receita = _receita_mais_proxima(receita_por_ano, data.year)
        if not receita:
            continue
        if float(valor) > PCT_ORCAMENTO_LIMIAR_OUTLIER_ABSOLUTO * receita:
            flagged[c["id"]] = REGRA_11
    return flagged


def _regra_2(contratos: list[dict], modalidade_by_pncp: dict[str, str]) -> dict[str, str]:
    """Dispensa >= 90% of the Lei 14.133 Art. 75 threshold. See module docstring."""
    flagged: dict[str, str] = {}
    for c in contratos:
        modalidade_texto = (
            modalidade_by_pncp.get(c.get("numero_controle_pncp"))
            or c.get("categoria")
            or c.get("tipo")
            or ""
        )
        if "dispensa" not in _normalizar(modalidade_texto):
            continue
        texto_ref = f"{c.get('categoria') or ''} {c.get('objeto') or ''}"
        limite = LIMIAR_DISPENSA_ENGENHARIA if _eh_engenharia(texto_ref) else LIMIAR_DISPENSA_OUTROS
        valor = c.get("valor_inicial") if c.get("valor_inicial") is not None else c.get("valor_global")
        if valor is None:
            continue
        if float(valor) >= PCT_LIMIAR_DISPENSA * limite:
            flagged[c["id"]] = REGRA_2
    return flagged


def _regra_3(contratos: list[dict]) -> dict[str, str]:
    """Aditivos acima do teto do Art. 125 da Lei 14.133/2021: 25% do valor
    inicial em geral, 50% só quando o objeto é reforma de edifício ou de
    equipamento (ver PCT_ADITIVOS_LIMIAR_GERAL/_REFORMA acima)."""
    flagged: dict[str, str] = {}
    for c in contratos:
        valor_inicial = c.get("valor_inicial")
        aditivos = c.get("aditivos_total")
        if not valor_inicial or aditivos is None:
            continue
        if float(valor_inicial) <= 0:
            continue
        texto_ref = f"{c.get('categoria') or ''} {c.get('objeto') or ''}"
        limiar = (
            PCT_ADITIVOS_LIMIAR_REFORMA
            if _eh_reforma_edificio_ou_equipamento(texto_ref)
            else PCT_ADITIVOS_LIMIAR_GERAL
        )
        if float(aditivos) >= limiar * float(valor_inicial):
            flagged[c["id"]] = REGRA_3
    return flagged


def _regra_4(contratos: list[dict], fornecedores_by_cnpj: dict[str, dict]) -> dict[str, str]:
    """Supplier capital_social < 5% of contract valor_global."""
    flagged: dict[str, str] = {}
    for c in contratos:
        cnpj = c.get("fornecedor_cnpj")
        valor = c.get("valor_global")
        if not cnpj or valor is None or float(valor) <= 0:
            continue
        info = fornecedores_by_cnpj.get(cnpj)
        if not info or info.get("capital_social") is None:
            continue  # no registry data yet — can't assess, not a match
        if float(info["capital_social"]) < PCT_CAPITAL_MINIMO * float(valor):
            flagged[c["id"]] = REGRA_4
    return flagged


def _regra_5(contratos: list[dict], fornecedores_by_cnpj: dict[str, dict]) -> dict[str, str]:
    """Supplier sanctioned in CEIS/CNEP (`fornecedores.sancionado_ceis`).

    `etl.apis.transparencia_gov` (the module that would populate this
    column) doesn't exist yet, so this column is currently always null/false
    for every supplier — this rule simply finds nothing and moves on, per
    instructions, rather than erroring.
    """
    flagged: dict[str, str] = {}
    for c in contratos:
        cnpj = c.get("fornecedor_cnpj")
        info = fornecedores_by_cnpj.get(cnpj) if cnpj else None
        if info and info.get("sancionado_ceis"):
            flagged[c["id"]] = REGRA_5
    return flagged


def _regra_7(contratos: list[dict], fornecedores_by_cnpj: dict[str, dict]) -> dict[str, str]:
    """Supplier registry status != ATIVA."""
    flagged: dict[str, str] = {}
    for c in contratos:
        cnpj = c.get("fornecedor_cnpj")
        info = fornecedores_by_cnpj.get(cnpj) if cnpj else None
        if not info or not info.get("situacao_cadastral"):
            continue  # no registry data yet — can't assess
        if info["situacao_cadastral"].strip().upper() != "ATIVA":
            flagged[c["id"]] = REGRA_7
    return flagged


def _regra_8(contratos: list[dict]) -> dict[str, str]:
    """>=3 contracts to the same fornecedor_cnpj within a 90-day window.

    Window is centered on each contract (any other contract by the same
    CNPJ within +/-90 days counts), not a strict non-overlapping bucket —
    simpler to reason about and documented per the task spec.
    """
    por_cnpj: dict[str, list[tuple[str, dt.date]]] = {}
    for c in contratos:
        cnpj = c.get("fornecedor_cnpj")
        data = _parse_date(c.get("data_assinatura"))
        if not cnpj or not data:
            continue
        por_cnpj.setdefault(cnpj, []).append((c["id"], data))

    flagged: dict[str, str] = {}
    for itens in por_cnpj.values():
        if len(itens) < QTD_MUITOS_CONTRATOS_LIMIAR:
            continue
        for cid, data in itens:
            count = sum(1 for _, d2 in itens if abs((d2 - data).days) <= JANELA_MUITOS_CONTRATOS_DIAS)
            if count >= QTD_MUITOS_CONTRATOS_LIMIAR:
                flagged[cid] = REGRA_8
    return flagged


def _regra_9(contratos: list[dict], grupos: list[dict]) -> dict[str, str]:
    """>=2 contracts within a 1-year window awarded to CNPJs in the same
    detected economic group (`grupos_economicos.cnpjs`, from etl.grupos).
    """
    flagged: dict[str, str] = {}
    if not grupos:
        return flagged

    contratos_by_cnpj: dict[str, list[tuple[str, dt.date]]] = {}
    for c in contratos:
        cnpj = c.get("fornecedor_cnpj")
        data = _parse_date(c.get("data_assinatura"))
        if not cnpj or not data:
            continue
        contratos_by_cnpj.setdefault(cnpj, []).append((c["id"], data))

    for grupo in grupos:
        membros = grupo.get("cnpjs") or []
        if len(membros) < 2:
            continue
        itens: list[tuple[str, dt.date]] = []
        for cnpj in membros:
            itens.extend(contratos_by_cnpj.get(cnpj, []))
        if len(itens) < QTD_GRUPO_ECONOMICO_LIMIAR:
            continue
        for cid, data in itens:
            count = sum(1 for _, d2 in itens if abs((d2 - data).days) <= JANELA_GRUPO_ECONOMICO_DIAS)
            if count >= QTD_GRUPO_ECONOMICO_LIMIAR:
                flagged[cid] = REGRA_9
    return flagged


# ── Regra 10: base de cálculo constitucional (CORRIGIDA 2026-07-23) ────────
# CF/88 Art. 198 §2º (saúde) e Art. 212 (educação) mandam calcular o
# mínimo sobre a "receita resultante de impostos, compreendida a
# proveniente de transferências constitucionais" — NÃO sobre a receita
# total do município (que inclui operação de crédito, transferência
# voluntária, taxas etc., bases muito maiores). Estes são os nomes exatos
# de `conta` em `receitas` (fonte: `br_me_siconfi.municipio_receitas_orcamentarias`,
# confirmados ao vivo 2026-07-23 contra Betim) que compõem essa base —
# impostos próprios + as transferências que a própria Constituição (Art.
# 158/159) qualifica como "constitucionais": FPM, cota-parte do ICMS, do
# IPVA, do IPI-Exportação e do ITR.
_CONTAS_BASE_CONSTITUCIONAL = (
    "Impostos",
    "Cota-Parte do Fundo de Participação dos Municípios - FPM",
    "Cota-Parte do ICMS",
    "Cota-Parte do IPVA",
    "Cota-Parte do IPI - Municípios",
    "Cota-Parte do Imposto Sobre a Propriedade Territorial Rural",
)
_ESTAGIO_RECEITA_BASE = "Receitas Brutas Realizadas"
_ESTAGIO_DESPESA_BASE = "Despesas Liquidadas"


def _check_regra_10(client, id_municipio: str) -> None:
    """Rule 10 — health/education spending below the 15%/25% constitutional
    minimums. Log-only (see module docstring): `despesas`/`receitas` are
    municipal-year aggregates, not per-contract rows, so there's nothing in
    `contratos` to flag and no schema yet to persist a finding of this
    shape — this just prints to stdout.

    **CORRIGIDO 2026-07-23** (revisão jurídica pedida pelo usuário —
    ver `docs/alertas-contratos-revisao-juridica.md`). Dois bugs reais
    achados juntos, cada um mascarando parte do outro:

    1. **Numerador inflado ~3-5x**: `despesas` grava a MESMA despesa em
       até 5 `estagio` diferentes por ano/função (Empenhadas, Liquidadas,
       Pagas, Restos a Pagar Processados/Não Processados) — o código
       antigo somava `valor` de TODAS as linhas sem filtrar por estágio,
       somando estágios que não são aditivos entre si (são o MESMO gasto
       visto em pontos diferentes do ciclo orçamentário). Confirmado ao
       vivo: Betim 2024 tinha R$783mi (empenhada) + R$747mi (liquidada) +
       R$735mi (paga) + ~R$48mi (restos a pagar) somados como "gasto em
       saúde" — quando o gasto real do ano é UM desses números, não a
       soma. Corrigido: filtra só `estagio == "Despesas Liquidadas"`
       (o valor usado pela LC 141/2012 pra aferir o mínimo de saúde, e o
       padrão de facto pra MDE/educação também).
    2. **Denominador errado**: usava receita TOTAL do município (bem
       maior que a base constitucional real) em vez de impostos +
       transferências constitucionais (ver `_CONTAS_BASE_CONSTITUCIONAL`
       acima).

    Os dois bugs empurravam o resultado em direções opostas e por
    coincidência produziam um número na faixa "abaixo do mínimo, mas não
    absurdamente" (8-13%) — plausível o bastante pra não ter sido
    questionado antes desta revisão, mas inteiramente fabricado. Com os
    dois corrigidos, Betim aparece **folgadamente acima dos dois mínimos
    em todos os anos com dado (2015-2024)**: saúde entre 38-54% (mínimo
    15%), educação entre 37-60% (mínimo 25%) — números manualmente
    conferidos como plausíveis (municípios tipicamente gastam bem acima
    do mínimo nessas funções, que recebem repasse federal carimbado por
    cima da base própria).

    Segue console-only (não vira `contratos.alerta`): mesmo corrigido,
    ainda é uma aproximação da metodologia oficial completa do RREO
    (que também separa restos a pagar de exercícios anteriores e outros
    detalhes de LC 141/2012 e LDB não representados nestas duas tabelas
    genéricas) — correta o bastante pra informar, não pra publicar como
    veredito de conformidade constitucional.
    """
    # PostgREST caps .execute() at 1000 rows by default -- despesas alone has
    # 4263+ rows for this municipio, so an unpaginated select silently
    # truncated to the first 1000 (whatever the server's default order
    # happened to return), dropping entire years' worth of data. Found live
    # 2026-07-21: 2021-2024 all showed 0% gasto em saude/educacao because
    # their rows simply weren't fetched. `fetch_all` (etl/common.py) pages
    # through .range() until a page comes back short.
    despesas = fetch_all(
        lambda: client.table("despesas")
        .select("ano, estagio, funcao, valor")
        .eq("id_municipio", id_municipio)
        .eq("estagio", _ESTAGIO_DESPESA_BASE)
    )
    receitas = fetch_all(
        lambda: client.table("receitas")
        .select("ano, conta, valor")
        .eq("id_municipio", id_municipio)
        .eq("estagio", _ESTAGIO_RECEITA_BASE)
        .in_("conta", list(_CONTAS_BASE_CONSTITUCIONAL))
    )
    if not despesas or not receitas:
        print("[etl.alertas] regra_10: dados de despesas/receitas insuficientes — verificacao pulada")
        return

    receita_total_por_ano: dict[int, float] = {}
    for r in receitas:
        ano = r.get("ano")
        if ano is None:
            continue
        receita_total_por_ano[ano] = receita_total_por_ano.get(ano, 0.0) + float(r.get("valor") or 0)

    gasto_saude_por_ano: dict[int, float] = {}
    gasto_educacao_por_ano: dict[int, float] = {}
    for d in despesas:
        ano = d.get("ano")
        if ano is None:
            continue
        funcao = _normalizar(d.get("funcao") or "")
        valor = float(d.get("valor") or 0)
        if "saude" in funcao:
            gasto_saude_por_ano[ano] = gasto_saude_por_ano.get(ano, 0.0) + valor
        if "educ" in funcao:
            gasto_educacao_por_ano[ano] = gasto_educacao_por_ano.get(ano, 0.0) + valor

    anos = sorted(set(gasto_saude_por_ano) | set(gasto_educacao_por_ano))
    if not anos:
        print("[etl.alertas] regra_10: nenhuma despesa de saude/educacao encontrada — verificacao pulada")
        return

    for ano in anos:
        receita_total = receita_total_por_ano.get(ano)
        if not receita_total:
            continue
        pct_saude = (gasto_saude_por_ano.get(ano, 0.0) / receita_total) * 100
        pct_educacao = (gasto_educacao_por_ano.get(ano, 0.0) / receita_total) * 100
        print(
            f"[etl.alertas] regra_10: {ano}: saude {pct_saude:.1f}% (min. {MIN_SAUDE_PCT * 100:.0f}%) "
            f"· educacao {pct_educacao:.1f}% (min. {MIN_EDUCACAO_PCT * 100:.0f}%)"
        )
        if pct_saude < MIN_SAUDE_PCT * 100:
            print(
                f"[etl.alertas] regra_10: ALERTA gasto em saude {ano} = {pct_saude:.1f}% da base constitucional, "
                f"abaixo do minimo de {MIN_SAUDE_PCT * 100:.0f}%"
            )
        if pct_educacao < MIN_EDUCACAO_PCT * 100:
            print(
                f"[etl.alertas] regra_10: ALERTA gasto em educacao {ano} = {pct_educacao:.1f}% da base constitucional, "
                f"abaixo do minimo de {MIN_EDUCACAO_PCT * 100:.0f}%"
            )


def sync(id_municipio: str):
    client = get_supabase_client()

    # fetch_all (etl/common.py) pages past PostgREST's 1000-row .execute()
    # cap — contratos was 576 rows when this was unpaginated (fine then),
    # but silently truncating a growing table is the exact bug already hit
    # once in _check_regra_10 below, so both selects use the shared helper
    # now rather than waiting for contratos to cross 1000 rows too.
    contratos = fetch_all(
        lambda: client.table("contratos")
        .select(
            "id, id_municipio, numero_controle_pncp, categoria, tipo, objeto, fornecedor_cnpj, "
            "valor_inicial, valor_global, aditivos_total, data_assinatura"
        )
        .eq("id_municipio", id_municipio)
    )
    print(f"[etl.alertas] contratos_avaliados={len(contratos)}")

    if not contratos:
        print("[etl.alertas] nenhum contrato encontrado — nada a avaliar (regras 1-9, 11)")
    else:
        licitacoes = fetch_all(
            lambda: client.table("licitacoes")
            .select("numero_controle_pncp, modalidade_nome")
            .eq("id_municipio", id_municipio)
        )
        modalidade_by_pncp = {
            r["numero_controle_pncp"]: (r.get("modalidade_nome") or "")
            for r in licitacoes
            if r.get("numero_controle_pncp")
        }

        cnpjs = sorted({c["fornecedor_cnpj"] for c in contratos if c.get("fornecedor_cnpj")})
        fornecedores_by_cnpj: dict[str, dict] = {}
        for chunk in _chunked(cnpjs, CHUNK_SIZE):
            resp = (
                client.table("fornecedores")
                .select("cnpj, capital_social, situacao_cadastral, sancionado_ceis")
                .in_("cnpj", chunk)
                .execute()
            )
            for row in resp.data or []:
                fornecedores_by_cnpj[row["cnpj"]] = row

        grupos_resp = (
            client.table("grupos_economicos").select("cnpjs").eq("id_municipio", id_municipio).execute()
        )
        grupos = grupos_resp.data or []

        # Receita bruta total por ano — usada só pela Regra 11 (teto de
        # orçamento). Consulta separada da que a Regra 10 faz (essa filtra
        # pela base CONSTITUCIONAL estreita; aqui é o total sem filtro de
        # origem — ver `_CONTAS_RECEITA_TOTAL`).
        receitas_totais = fetch_all(
            lambda: client.table("receitas")
            .select("ano, valor")
            .eq("id_municipio", id_municipio)
            .eq("estagio", _ESTAGIO_RECEITA_BASE)
            .in_("conta", list(_CONTAS_RECEITA_TOTAL))
        )
        receita_por_ano: dict[int, float] = {}
        for r in receitas_totais:
            ano = r.get("ano")
            if ano is None:
                continue
            receita_por_ano[ano] = receita_por_ano.get(ano, 0.0) + float(r.get("valor") or 0)

        cutoff_baseline = dt.date.today() - dt.timedelta(days=JANELA_BASELINE_DIAS)

        motivos_por_contrato: dict[str, list[str]] = {c["id"]: [] for c in contratos}
        regra_calls = (
            (_regra_1, (contratos, cutoff_baseline)),
            (_regra_2, (contratos, modalidade_by_pncp)),
            (_regra_3, (contratos,)),
            (_regra_4, (contratos, fornecedores_by_cnpj)),
            (_regra_5, (contratos, fornecedores_by_cnpj)),
            (_regra_7, (contratos, fornecedores_by_cnpj)),
            (_regra_8, (contratos,)),
            (_regra_9, (contratos, grupos)),
            (_regra_11, (contratos, cutoff_baseline, receita_por_ano)),
        )
        for regra_fn, args in regra_calls:
            for contrato_id, motivo in regra_fn(*args).items():
                motivos_por_contrato[contrato_id].append(motivo)

        id_municipio_by_id = {c["id"]: c["id_municipio"] for c in contratos}

        rows_out = []
        qtd_alertados = 0
        for contrato_id, motivos in motivos_por_contrato.items():
            alerta = len(motivos) > 0
            qtd_alertados += int(alerta)
            # Full recompute: contracts with no matching rule this run get
            # alerta=False / motivos_alerta=[] explicitly, clearing any
            # stale alert from a previous run.
            # id_municipio is included because postgrest's upsert builds a
            # full-row INSERT for the ON CONFLICT path -- omitting any
            # NOT NULL column (id_municipio is the only one on this table)
            # fails the constraint even though the row already exists.
            # Found live 2026-07-21, first real run of this module.
            rows_out.append(
                {
                    "id": contrato_id,
                    "id_municipio": id_municipio_by_id[contrato_id],
                    "alerta": alerta,
                    "motivos_alerta": motivos,
                }
            )

        for chunk in _chunked(rows_out, CHUNK_SIZE):
            client.table("contratos").upsert(chunk, on_conflict="id").execute()

        print(f"[etl.alertas] contratos_com_alerta={qtd_alertados}/{len(contratos)}")

    _check_regra_10(client, id_municipio)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio)
    except RuntimeError as e:
        print(f"[etl.alertas] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
