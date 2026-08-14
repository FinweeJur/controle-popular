"""etl.temas_ambientais — classificação temática de `ambiental_legislacao`
(6.378 normas de três fontes: ALMG, Semad, Siam — ver migration 0065).

═══ TEMA "SERRAS" (2026-08-13) ═══

Adicionado na unificação de `/ambiental/legislacao` com `/ambiental/direito-
critico`: aquele painel já tinha um chip "Proteção de serras" (slug
`serras`) parado em ZERO instrumentos desde a carga inicial — o material
fonte (Direito Crítico Popular) simplesmente não cobre o assunto. Antes de
sair atrás de uma fonte NOVA para preencher esse chip (o pedido original
cogitava isso), medi se a legislação ESTADUAL que já está no banco cobre
serra — e cobre: 180 ementas com "serra" (sondagem 2026-08-13 contra as
6.378 linhas), quase todas atos do Semad/Siam sobre conselhos consultivos e
planos de manejo de parques/APAs/RPPNs situados em serras nomeadas (Serra
do Cipó, Serra da Moeda, Serra do Brigadeiro...). A ALMG tem inclusive um
RAMO OFICIAL da própria taxonomia para isso —
`/Tema/Meio Ambiente/Atributo Ambiental/Relevo/Serra (Relevo)` — então o
tema aqui não é inventado, é o MESMO padrão dos outros 8: ramo real da
indexação ALMG, generalizado por palavra-chave pras outras duas fontes.
Reusa o slug `serras` de `etl.temas_direito_critico` de propósito — é o
mesmo conceito, e usar o mesmo slug nos dois lados é o que faz o chip
"Proteção de serras" do painel unificado somar as duas fontes sem precisar
de tabela de tradução.

Pedido do usuário (2026-08-12): quem chega em `/ambiental/legislacao`
querendo "o que existe sobre mineração" hoje precisa ler ementa por ementa.
Este módulo dá dois níveis de classificação, guardados como colunas
`text[]` na própria tabela (mesmo padrão de `etl.temas.classificar_texto`
para `atos_oficiais`, migration 0025 — array em vez de tabela-ponte porque
a tela já filtra tudo no cliente, ver `legislacao-ambiental.ts`):

  `tags`  — vocabulário fino (17 rótulos), pra entender do que trata uma
            norma sem abrir o PDF. Regex sobre a ementa, auditável no
            código abaixo — nenhum modelo opaco.
  `temas` — os 8 temas amplos que o pedido do usuário listou (mineração,
            energia, agropecuária, barragens, recursos hídricos, resíduos,
            unidades de conservação, fauna e flora), obtidos por UNIÃO das
            tags de cada norma via `TAG_TEMA` (cada tag pertence a um único
            tema — ver a tabela abaixo).

═══ POR QUE ANCORADO NA INDEXAÇÃO DA ALMG, NÃO NUM VOCABULÁRIO INVENTADO
    AQUI (pedido explícito da tarefa) ═══

A ALMG é a ÚNICA das três fontes que atribui uma taxonomia OFICIAL a cada
norma (campo `indexacao` da API, ex.
"/Tema/Mineração/Barragem de Rejeitos") — sondado ao vivo em 2026-08-12
contra as 71 normas ambientais da ALMG (`docs/ambiental/` não tem sondagem
prévia disso; feita agora). Os 8 temas do pedido do usuário batem com
ramos REAIS dessa taxonomia (`/Tema/Mineração`, `/Tema/Energia`,
`/Tema/Agropecuária`, `/Tema/Meio Ambiente/Atributo Ambiental/Hidrografia`,
`/Tema/Meio Ambiente/Gestão Ambiental/Proteção Ambiental/Unidade de
Conservação`, `/Tema/Meio Ambiente/Animais`, `/Tema/Saneamento
Básico/Tratamento de Resíduo`, "Barragem" espalhado em 3 ramos diferentes)
— não foram inventados aqui, foram OBSERVADOS na indexação real. As
palavras-chave abaixo são a MESMA classificação, generalizada pra rodar
sobre a ementa (que as três fontes têm) em vez do campo `indexacao` (que só
a ALMG tem).

═══ POR QUE SEMAD (2.232) E SIAM (4.077) NÃO TÊM INDEXAÇÃO OFICIAL
    EQUIVALENTE — MEDIDO, NÃO SUPOSTO ═══

`etl.apis.legislacao_semad` faz parsing de HTML de uma tabela
(`<table class="normas-table">`) com 6 colunas fixas: tipo, órgão, número,
data, ementa, link — SEM nenhuma coluna de tema/assunto (ver o módulo,
`_linha()`). `etl.apis.legislacao_siam` idem, tabela `tabelaAdm`, 6
colunas, mesma ausência. Nenhuma das duas fontes publica uma taxonomia
paralela à da ALMG — não é limitação deste classificador, é limitação do
que as fontes expõem. Por isso a tela declara cobertura parcial: as ~71
normas da ALMG têm o tema cruzado com a indexação oficial (`fonte_tema =
"almg_indexacao+ementa"` na prática, mas a coluna que carrega essa
distinção é simplesmente `fonte`, já existente — não duplicada aqui); as
~6.307 de Semad+Siam são só palavra-chave na ementa — indício, não
afirmação oficial.

═══ POR QUE UNIÃO, NÃO PRIORIDADE, E POR QUE `temas=[]` É RESULTADO
    LEGÍTIMO ═══

Mesma regra de `etl.temas.classificar_texto`: uma Deliberação Copam sobre
"barragem de rejeitos em área de mineração com outorga de recursos
hídricos" é MINERAÇÃO, BARRAGENS e RECURSOS_HIDRICOS ao mesmo tempo — três
tags reais, não uma escolhida por prioridade arbitrária. E uma norma sobre
"composição do Conselho Estadual de Política Ambiental" não bate em
nenhuma tag fina o bastante pra ser mineração/energia/etc — fica com
`temas=[]`, "sem tema atribuído", não empurrada pra um balde "outros" que
fingiria cobertura que a classificação não tem.
"""
import re

# ─── OS 8 TEMAS DO PEDIDO, + `serras` (ver docstring do módulo) ────────
TEMA_LABELS: dict[str, str] = {
    "mineracao": "Mineração",
    "energia": "Energia",
    "agropecuaria": "Agropecuária",
    "barragens": "Barragens",
    "recursos_hidricos": "Recursos Hídricos",
    "residuos": "Resíduos",
    "unidades_conservacao": "Unidades de Conservação",
    "fauna_flora": "Fauna e Flora",
    "serras": "Proteção de Serras",
}

# ─── TAGS FINAS — cada uma pertence a EXATAMENTE UM tema (TAG_TEMA), pra
# que "temas" seja só a união das tags sem ambiguidade de mapeamento.
# Calibradas contra amostras REAIS de `ambiental_legislacao` em 2026-08-12
# (`apps/web/scripts/tmp-medir-keywords.mjs`/`tmp-amostra-keywords.mjs`,
# script de sondagem, não comitados) — cada regex abaixo tem contagem
# medida ao vivo contra as 6.378 linhas, não um vocabulário de manual.
TAG_LABELS: dict[str, str] = {
    "mineracao_geral": "Mineração",
    "energia_geral": "Energia",
    "agropecuaria_geral": "Agropecuária",
    "barragem": "Barragem",
    "recursos_hidricos_geral": "Recursos Hídricos",
    "bacia_hidrografica": "Bacia Hidrográfica",
    "residuos_solidos": "Resíduos Sólidos",
    "reciclagem": "Reciclagem",
    "unidade_conservacao": "Unidade de Conservação",
    "area_protecao_ambiental": "Área de Proteção Ambiental",
    "rppn": "Reserva Particular (RPPN)",
    "fauna": "Fauna",
    "flora_florestal": "Flora e Política Florestal",
    "licenciamento_ambiental": "Licenciamento Ambiental",
    "fiscalizacao_ambiental": "Fiscalização Ambiental",
    "mudanca_climatica": "Mudança Climática",
    "desastre_ambiental": "Desastre Ambiental",
    "serra_relevo": "Serra",
}

TAG_TEMA: dict[str, str] = {
    "mineracao_geral": "mineracao",
    "energia_geral": "energia",
    "agropecuaria_geral": "agropecuaria",
    "barragem": "barragens",
    "recursos_hidricos_geral": "recursos_hidricos",
    "bacia_hidrografica": "recursos_hidricos",
    "residuos_solidos": "residuos",
    "reciclagem": "residuos",
    "unidade_conservacao": "unidades_conservacao",
    "area_protecao_ambiental": "unidades_conservacao",
    "rppn": "unidades_conservacao",
    "fauna": "fauna_flora",
    "flora_florestal": "fauna_flora",
    "serra_relevo": "serras",
    # As três tags abaixo são transversais no acervo (licenciamento,
    # fiscalização, clima/desastre aparecem em normas de todos os 8 temas
    # E fora deles) — de propósito NÃO mapeadas a nenhum dos 8 temas do
    # pedido do usuário, só entram em `tags`, não em `temas`. Forçar uma
    # delas pra dentro de um dos 8 inflaria aquele tema com normas que não
    # são sobre ele.
}

# medido 2026-08-12 contra `ementa` de `ambiental_legislacao` (6.378
# linhas): contagem de linhas cuja `ementa` bate (ver script de sondagem
# citado acima) — registrado aqui pra quem for recalibrar não repetir a
# sondagem do zero.
#   mineracao_geral            114   energia_geral            149 (bruto)
#   agropecuaria_geral        ~40   barragem                   14
#   recursos_hidricos_geral   708   bacia_hidrografica         406
#   residuos_solidos           20   reciclagem                 17
#   unidade_conservacao        21   area_protecao_ambiental    84
#   rppn                      150   fauna                       6
#   flora_florestal            34
#   serra_relevo               180  (medido 2026-08-13, ver docstring)
_REGRAS: dict[str, re.Pattern] = {
    "mineracao_geral": re.compile(
        r"minera[çc][aã]o|minerad|min[eé]rio|jazida mineral|recurso mineral|"
        r"\blavra\b|explora[çc][aã]o mineral",
        re.IGNORECASE,
    ),
    "energia_geral": re.compile(
        r"energia (?:el[eé]trica|renov[aá]vel|solar|e[oó]lica|hidr[aá]ulica)|"
        r"usina (?:hidrel[eé]trica|termel[eé]trica|solar|e[oó]lica|fotovoltaica)|"
        r"hidrog[eê]nio verde|infraestrutura de energia",
        re.IGNORECASE,
    ),
    "agropecuaria_geral": re.compile(
        r"agropecu[aá]ri|agr[ií]cola|agricultura|pecu[aá]ria|"
        r"produtor(?:es)? rurai?s?|agricultor familiar|zona rural|"
        r"desenvolvimento rural",
        re.IGNORECASE,
    ),
    "barragem": re.compile(
        r"barragem",
        re.IGNORECASE,
    ),
    "recursos_hidricos_geral": re.compile(
        r"recursos? h[ií]dric|outorga de (?:uso da? )?[aá]gua|manancial|"
        r"comit[eê] (?:estadual )?de bacia|curso d.[aá]gua|hidrografia|"
        r"cerh.mg",
        re.IGNORECASE,
    ),
    "bacia_hidrografica": re.compile(
        r"bacia hidrogr[aá]fica",
        re.IGNORECASE,
    ),
    "residuos_solidos": re.compile(
        r"res[ií]duos? s[oó]lid|aterro sanit[aá]rio|log[íi]stica reversa|"
        r"res[ií]duo(?:s)? (?:industrial|perigoso|s[oó]lido urbano)",
        re.IGNORECASE,
    ),
    "reciclagem": re.compile(
        r"reciclagem|recicl[aá]vel|cata(?:dor|dores) de material recicl",
        re.IGNORECASE,
    ),
    "unidade_conservacao": re.compile(
        r"unidade(?:s)? de conserva[çc][aã]o|parque (?:estadual|nacional)|"
        r"esta[çc][aã]o ecol[oó]gica|monumento natural|"
        r"refugio de vida silvestre|ref[uú]gio de vida silvestre",
        re.IGNORECASE,
    ),
    "area_protecao_ambiental": re.compile(
        r"[aá]rea de prote[çc][aã]o ambiental|\bapa\b",
        re.IGNORECASE,
    ),
    "rppn": re.compile(
        r"reserva particular do patrim[oô]nio natural|\brppn\b",
        re.IGNORECASE,
    ),
    "fauna": re.compile(
        r"\bfauna\b|vida silvestre|esp[eé]cie(?:s)? (?:amea[çc]ad|ex[oó]tica invasora)|"
        r"manejo de (?:animal|animais)|animal(?:is)? silvestre",
        re.IGNORECASE,
    ),
    "flora_florestal": re.compile(
        r"\bflora\b|pol[íi]tica florestal|inc[eê]ndio florestal|"
        r"desmatamento|reflorestamento|floresta plantada|corredor ecol[oó]gico",
        re.IGNORECASE,
    ),
    "licenciamento_ambiental": re.compile(
        r"licenciamento ambiental|licen[çc]a ambiental",
        re.IGNORECASE,
    ),
    "fiscalizacao_ambiental": re.compile(
        r"fiscaliza[çc][aã]o ambiental|auto de infra[çc][aã]o|crime ambiental",
        re.IGNORECASE,
    ),
    "mudanca_climatica": re.compile(
        r"mudan[çc]a (?:do )?clim[aá]tica|clim[aá]tica global|efeito estufa",
        re.IGNORECASE,
    ),
    "desastre_ambiental": re.compile(
        r"desastre ambiental|rompimento de barragem|degrada[çc][aã]o ambiental",
        re.IGNORECASE,
    ),
    # Medido 2026-08-13: 180 ementas com "serra" nas 6.378, quase todas
    # nome próprio de serra em unidade de conservação (Parque Estadual
    # Serra do X, APA Serra do Y) — mesmo risco de falso positivo que as
    # outras regras de palavra solta já assumem (ex. `\bfauna\b`), e a
    # amostragem manual da sondagem não achou nenhum "serra" como verbo
    # (serrar) nas ementas reais.
    "serra_relevo": re.compile(
        r"\bserra\b",
        re.IGNORECASE,
    ),
}


def classificar_tags(ementa: str | None) -> list[str]:
    """Devolve as tags (slugs) cujo padrão bate na ementa — união, uma
    norma pode ter várias. `[]` é resultado legítimo (ementa vazia ou sem
    nenhum termo reconhecido), nunca forçado pra uma tag genérica."""
    if not ementa:
        return []
    return sorted(slug for slug, regex in _REGRAS.items() if regex.search(ementa))


def temas_das_tags(tags: list[str]) -> list[str]:
    """Os 8 temas do pedido do usuário = união dos temas das tags
    encontradas (`TAG_TEMA`) — tags transversais (licenciamento,
    fiscalização, mudança climática, desastre) não contam pra nenhum dos
    8, ver docstring do módulo."""
    return sorted({TAG_TEMA[t] for t in tags if t in TAG_TEMA})


# ─── Segundo sinal, só pra `fonte='almg'`: a indexação OFICIAL da própria
# ALMG (campo `indexacao` da API — ver `etl.apis.legislacao_almg`), que
# este classificador soma (união) ao que a ementa já deu. Mapeamento
# auditável de segmento da taxonomia -> um dos 8 temas; segmento que não
# aparece aqui simplesmente não vira tema (ex. "Gestão Ambiental" sozinho é
# grande demais pra virar um dos 8 — fica de fora de propósito).
_SEGMENTO_INDEXACAO_TEMA: list[tuple[str, str]] = [
    ("Mineração", "mineracao"),
    ("Energia", "energia"),
    ("Agropecuária", "agropecuaria"),
    ("Barragem", "barragens"),
    ("Rompimento de Barragem", "barragens"),
    ("Recursos Hídricos", "recursos_hidricos"),
    ("Hidrografia", "recursos_hidricos"),
    ("Bacia Hidrográfica", "recursos_hidricos"),
    ("Tratamento de Resíduo", "residuos"),
    ("Reciclagem", "residuos"),
    ("Unidade de Conservação", "unidades_conservacao"),
    ("Animais", "fauna_flora"),
    ("Fauna Silvestre", "fauna_flora"),
    ("Política Florestal", "fauna_flora"),
    # Ramo oficial confirmado ao vivo em 2026-08-13 (ver docstring do
    # módulo): "/Tema/Meio Ambiente/Atributo Ambiental/Relevo/Serra
    # (Relevo)". Casa só o segmento específico "Serra (Relevo)", não
    # "Relevo" sozinho — "Relevo" também cobre outras formas de terreno que
    # não são serra.
    ("Serra (Relevo)", "serras"),
]


def temas_da_indexacao_almg(indexacao: str | None) -> list[str]:
    """Só pra normas da ALMG (`fonte='almg'`) — as únicas com o campo
    `indexacao` (taxonomia oficial). `None`/vazio para as outras duas
    fontes, que não têm este campo (medido, ver docstring do módulo)."""
    if not indexacao:
        return []
    achados = {tema for segmento, tema in _SEGMENTO_INDEXACAO_TEMA if segmento in indexacao}
    return sorted(achados)
