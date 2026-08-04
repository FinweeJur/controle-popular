"""etl.fila_prioridade — ordena o que vale a pena analisar, por cidade.

    python -m etl.fila_prioridade --id-municipio 3106705
    python -m etl.fila_prioridade --id-municipio 3106200 --limite 50
    python -m etl.fila_prioridade --id-municipio 3550308 --limite 20 --json

Adaptação de `etl/congresso/etl/fila_prioridade.py`. A estrutura é a mesma
(camadas ordenadas, cada objeto entra em UMA só, a primeira em que se
qualifica), mas os critérios do Congresso — pauta de comissão, tramitação
ativa, tema editorial — não sobrevivem à mudança de escala e de fonte:
nenhuma das três câmaras publica pauta em API, e a maior parte do acervo
municipal simplesmente não é norma.

POR QUE ORDENAR EM VEZ DE ANALISAR TUDO. São 660 atos + 8.941 proposições
nas três cidades. Cada análise é uma chamada de modelo. Analisar na ordem
do banco significa gastar quase todo o orçamento em ruído E — pior —
construir o ranking de "cidade mais reducionista" em cima desse ruído.

═══ O QUE É RUÍDO AQUI, MEDIDO E NÃO SUPOSTO (2026-08-03) ═══

1. TIPO NÃO NORMATIVO — 4.700 das 8.941 proposições. BH tem 1.238
   requerimentos, 1.075 indicações e 446 moções; Betim tem 1.793
   requerimentos. Requerimento pede informação, indicação sugere ao
   prefeito, moção manifesta apoio: nenhum deles ALTERA DISPOSITIVO. Não há
   artigo para o modelo citar, e a regra 1 do prompt (dispositivo nunca
   vazio) faria o item ser descartado na validação de qualquer jeito. Pagar
   por essa resposta é pagar para receber `[]`.

2. CRÉDITO SUPLEMENTAR — 315 dos 660 atos de Betim, quase metade. Somados
   a remanejamento de dotação e afins, é o maior bloco isolado do acervo.
   Movem dinheiro dentro do orçamento sem mudar dispositivo; a rubrica manda
   devolver `direitos_afetados` vazio.

3. HOMENAGEM E DENOMINAÇÃO — denominação de logradouro, título de cidadão
   honorário, data comemorativa. Mesmo caso, explicitamente citado na regra
   3 do prompt do Congresso.

O ENUNCIADO DA TAREFA diz "584 dos 660 atos de Betim não pegaram nenhum
tema". O número está certo (conferido: 584), mas usá-lo COMO critério de
fila estaria errado, e vale registrar por quê:

  - Falso positivo do "sem tema": entre esses 584 estão "DISPÕE SOBRE A
    ÁREA DE PRESERVAÇÃO PERMANENTE NA ÁREA URBANA DE BETIM" (meio
    ambiente), "CONCEDE ISENÇÃO FISCAL SOBRE EMPREENDIMENTOS HABITACIONAIS
    DE INTERESSE SOCIAL" (moradia) e a planta de valores do IPTU
    (propriedade). São exatamente o tipo de norma que a rubrica existe para
    ler. `etl/temas.py` foi calibrado para navegação na UI, não para
    direito fundamental — não bater tema não é sinal de irrelevância.
  - Falso negativo do "com tema": São Paulo tem `temas = NULL` nas 2.541
    proposições (backfill nunca rodou). Filtrar por tema jogaria a cidade
    inteira para o fim da fila por um motivo que não tem nada a ver com o
    conteúdo dela.

Por isso a despriorização é por TIPO e por PADRÃO DE EMENTA (os dois
auditáveis e verificáveis um a um), e "tem tema" entra só como sinal de
SUBIDA dentro do que já é normativo — nunca como filtro de corte.
"""
import argparse
import json
import re
import unicodedata

from etl.analise_garantista import (
    CAMPOS_ATO,
    CAMPOS_PROPOSICAO,
    DIREITOS,
    normalizar_ato,
    normalizar_proposicao,
)
from etl.common import carregar_municipio, fetch_all, get_supabase_client

# ── Normatividade por tipo ──────────────────────────────────────
# Tier A: muda a lei que vale para o cidadão. Tier B: é norma, mas de
# alcance interno ou instrumental. Tier C: não é norma — não entra na fila
# sem `--incluir-ruido`.
#
# `atos_oficiais.tipo` NÃO é padronizado entre as cidades, e tratar isso com
# um conjunto de literais foi um erro real desta sessão: Betim publica "Lei
# Ordinária", BH e São Paulo publicam só "Lei", e BH ainda tem "Proposição
# de Lei" (o texto já aprovado pela Câmara, aguardando sanção). Com a lista
# fechada, as 796 leis de BH e as 302 de SP caíam em `norma_secundaria` e a
# fila dessas duas cidades começava por decreto — visto ao vivo, camada
# `lei_vigente_*` com ZERO em BH.
#
# Daí a regra ser por PREFIXO, não por igualdade: qualquer tipo que comece
# com "lei" é norma primária, o que cobre as três grafias de hoje e a
# próxima cidade sem edição. `TIPOS_ATO_PRIMARIO_EXTRA` guarda o que não
# começa com "lei" mas é primário assim mesmo.
TIPOS_ATO_PRIMARIO_EXTRA = {"proposicao de lei"}
TIPOS_ATO_SECUNDARIO = {"decreto", "resolucao", "instrucao normativa", "regimento interno", "portaria"}


def _ato_primario(tipo_slug: str) -> bool:
    # "lei organica" em qualquer posição, e não só como prefixo: a Emenda à
    # Lei Orgânica é o ato mais primário que um município tem — muda a
    # constituição da cidade — e o slug dela começa com "emenda", então nem
    # o prefixo "lei" nem a lista EXTRA a alcançavam. Ficava em
    # `norma_secundaria`, ABAIXO de decreto de crédito, e o resumo da fila a
    # denunciava como "tipo não catalogado" (visto ao vivo em BH,
    # 2026-08-03, logo depois de a coleta passar a separar essa espécie de
    # `Lei` nº `ORGANICA 43`). O lado das proposições já a tratava como
    # primária (`emenda_lei_organica` em TIPOS_PROPOSICAO_PRIMARIO): a mesma
    # norma mudava de peso conforme fosse lida como projeto ou como ato.
    return (
        tipo_slug.startswith("lei")
        or "lei organica" in tipo_slug
        or tipo_slug in TIPOS_ATO_PRIMARIO_EXTRA
    )

TIPOS_PROPOSICAO_PRIMARIO = {
    "projeto_lei",
    "emenda_lei_organica",
    "proposta_emenda_lei_organica",
}
TIPOS_PROPOSICAO_SECUNDARIO = {
    "projeto_resolucao",
    "projeto_decreto_legislativo",
    "emenda",
    "emenda_loa",
    "autorizacao",
}
# Explícito de propósito: a lista do que NÃO é norma é curta e revisável.
# Um tipo novo que apareça na coleta cai em `desconhecido` e é tratado como
# secundário — entra na fila com prioridade baixa em vez de sumir dela.
TIPOS_PROPOSICAO_NAO_NORMATIVO = {"requerimento", "indicacao", "mocao", "denuncia", "prestacao_contas"}


def _slug(texto: str | None) -> str:
    """Minúscula sem acento — `atos_oficiais.tipo` vem com acentuação da
    fonte ('Lei Ordinária', 'Resolução') e comparar com string acentuada
    literal erra em silêncio quando a fonte muda de grafia."""
    t = unicodedata.normalize("NFKD", texto or "")
    return "".join(c for c in t if not unicodedata.combining(c)).strip().lower()


# ── Ruído por padrão de ementa ──────────────────────────────────
# Cada padrão foi conferido contra ementa REAL já sincronizada (mesma regra
# de `etl/temas.py`: nada de vocabulário de manual). A contagem de cada um
# sai no resumo do `--verbose`, então uma regra que pare de valer aparece.
RUIDO = {
    # 315 atos de Betim. "abre crédito suplementar", "crédito adicional".
    "credito_orcamentario": re.compile(
        r"cr[eé]dito\s+(suplementar|adicional|especial|extraordin[aá]rio)|"
        r"remanejamento\s+de\s+dota[cç][oõ]es|anula[cç][aã]o\s+de\s+dota[cç][aã]o|"
        r"abertura\s+de\s+cr[eé]dito|transposi[cç][aã]o\s+de\s+dota[cç]",
        re.IGNORECASE,
    ),
    # As formas de batizar um logradouro NÃO são intercambiáveis entre as
    # cidades, e as três primeiras versões desta regex vazaram: Betim
    # escreve "Denominação de logradouro", São Paulo escreve "Denomina
    # Centro de Educação Infantil X o CEI Y" e BH escreve "Dá o nome de
    # Maria Costa de Jesus à Rua 41". Sem as duas últimas formas, a Lei
    # 12.094/2026 de BH e a 18.519/2026 de SP apareciam no TOPO da fila —
    # em `lei_vigente_com_sinal`, porque "Educação Infantil" acionava o
    # sinal de direito. Homenagem com nome de escola é o pior falso
    # positivo possível: parece exatamente uma lei de educação.
    "denominacao": re.compile(
        r"denomina[cç][aã]o\s+d[oae]\b|passa\s+a\s+denominar|denomina[- ]se\b|"
        r"altera\s+a\s+denomina[cç][aã]o|\bdenomina\b|\bdenominar\b|"
        r"d[áa]\s+o\s+nome\s+de|atribui\s+o\s+nome|d[áa]\s+a\s+denomina",
        re.IGNORECASE,
    ),
    "honraria": re.compile(
        r"t[ií]tulo\s+de\s+cidad[aã]o|cidad[aã]o\s+honor[aá]rio|comenda\b|"
        r"medalha\b|em\s+homenagem|manifestar\s+(o\s+)?(apoio|p[eê]sames|congratula)",
        re.IGNORECASE,
    ),
    "data_comemorativa": re.compile(
        r"calend[aá]rio\s+(oficial|municipal|de\s+eventos)|"
        r"institui\s+o\s+dia\s+(municipal|d[aeo])|semana\s+municipal\s+d|"
        r"declara\s+de\s+utilidade\s+p[uú]blica",
        re.IGNORECASE,
    ),
    "ato_de_pessoal": re.compile(
        r"\bnomea[cç][aã]o\b|\bexonera[cç][aã]o\b|\bnomeia\b|\bexonera\b|"
        r"ponto\s+facultativo|designa[cç][aã]o\s+de\s+servidor|"
        r"concess[aã]o\s+de\s+f[eé]rias",
        re.IGNORECASE,
    ),
}


def classificar_ruido(ementa: str | None) -> str | None:
    """Devolve o slug do padrão de ruído que bateu, ou None."""
    if not ementa:
        # Ementa vazia é ruído de outra natureza: não há o que analisar.
        return "sem_ementa"
    for slug, regex in RUIDO.items():
        if regex.search(ementa):
            return slug
    return None


# ── Sinal de direito ────────────────────────────────────────────
# Vocabulário DERIVADO dos rótulos da rubrica canônica, não escrito à mão:
# "Direitos da pessoa idosa" -> {direitos, pessoa, idosa}. Se um direito for
# acrescentado ao rubrica.json, o sinal passa a existir aqui sem edição —
# que é o ponto inteiro de não duplicar a taxonomia.
# Palavras que aparecem nos rótulos mas não distinguem nada em ementa
# municipal: "controle de ruídos", "processo licitatório", "requisitos
# legais" e "obras públicas" acionariam o sinal sem ter relação com direito
# fundamental. Cada rótulo afetado mantém outra palavra que o identifica
# ("devido processo legal e ampla defesa" continua pegando por "defesa").
_PARADAS = {
    "direitos", "direito", "e", "da", "de", "do", "dos", "das", "a", "o", "os", "as",
    "com", "adequada", "outras", "pessoa", "social", "publica", "publico",
    "legal", "ampla", "processo", "controle",
}


def _vocabulario_da_rubrica() -> set[str]:
    palavras: set[str] = set()
    for d in DIREITOS.values():
        for bruto in re.split(r"[\s,/+]+", _slug(d["rotulo"])):
            palavra = bruto.strip("()")
            if len(palavra) >= 5 and palavra not in _PARADAS:
                palavras.add(palavra)
    return palavras


VOCABULARIO_DIREITOS = _vocabulario_da_rubrica()

# FRONTEIRA DE PALAVRA + PLURAL, e nenhuma das duas metades é preciosismo.
#
# Sem `\b`, "cultura" (de "Cultura, esporte e lazer") casa dentro de
# AGRICULTURA e "acesso" (de "Acesso à justiça") casa dentro de "obrigações
# ACESSÓRIAS" — é o mesmo defeito que `licita` dentro de "SOlicitação" já
# causou em `etl/temas.py`, onde inflou uma categoria em ~13×.
#
# Com `\b` puro seria pior no outro sentido: os rótulos da rubrica estão no
# singular ("criança", "adolescente") e a ementa fala no plural ("Crianças e
# Adolescentes"), então o sinal sumiria justo nas leis mais claramente
# ligadas a um direito. O sufixo opcional resolve; `l` está lá por
# "cultura" -> "cultural", que aparece em Betim (FUNARBE).
#
# MEDIDO em Betim (3.393 objetos, 2026-08-03): substring cru marca 434,
# esta regex marca 424, e as 10 de diferença foram conferidas uma a uma —
# 6 são decreto/lei de ISSQN entrando por "obrigações ACESSÓRIAS", nenhuma
# perde um objeto que a regex devesse pegar. Nenhum objeto novo aparece só
# na regex, ou seja: ela é estritamente mais restrita, não diferente.
_REGEX_DIREITOS = re.compile(
    r"\b(?:" + "|".join(sorted(VOCABULARIO_DIREITOS)) + r")(?:s|es|ais|l)?\b"
)


def tem_sinal_de_direito(obj: dict) -> bool:
    """Tema já classificado OU palavra de um rótulo da rubrica na ementa.

    É sinal de SUBIDA, não filtro: quem não tem sinal continua na fila, só
    depois. Ver o bloco sobre os 584 na docstring do módulo.
    """
    if obj.get("temas"):
        return True
    return bool(_REGEX_DIREITOS.search(_slug(obj.get("ementa"))))


# ── Camadas ─────────────────────────────────────────────────────
# A ordem desta tupla É a prioridade. Ler de cima para baixo responde
# "por que esta análise foi paga antes daquela".
CAMADAS = (
    "lei_vigente_com_sinal",       # lei/LC municipal em vigor que toca direito
    "projeto_lei_com_sinal",       # PL/emenda à LOM que toca direito
    "lei_vigente_sem_sinal",       # lei em vigor, sinal não detectado (pode ser falso negativo)
    "projeto_lei_sem_sinal",
    "norma_secundaria_com_sinal",  # decreto, resolução, projeto de resolução
    "norma_secundaria_sem_sinal",
    "nao_normativo",               # requerimento, indicação, moção — só com --incluir-ruido
    "ruido",                       # crédito suplementar, denominação, homenagem — idem
)
_RANK = {nome: i for i, nome in enumerate(CAMADAS)}
CAMADAS_DESPRIORIZADAS = ("nao_normativo", "ruido")


def _camada(obj: dict) -> str:
    ruido = classificar_ruido(obj.get("ementa"))
    tipo = _slug(obj.get("tipo"))
    sinal = tem_sinal_de_direito(obj)

    if obj["tipo_objeto"] == "ato":
        primario = _ato_primario(tipo)
        nao_normativo = False
    else:
        primario = tipo in TIPOS_PROPOSICAO_PRIMARIO
        nao_normativo = tipo in TIPOS_PROPOSICAO_NAO_NORMATIVO

    # ORDEM DA DECISÃO IMPORTA. "Não normativo" vem ANTES de "ruído" porque
    # é a razão mais forte e mais estável: um requerimento continua sendo
    # requerimento independentemente do que a ementa diga. Invertendo, uma
    # moção de pesar apareceria em "ruído/honraria" e a estatística diria
    # que o problema do acervo é homenagem, quando é tipo de peça.
    if nao_normativo:
        return "nao_normativo"
    if ruido:
        return "ruido"
    if primario:
        base = "lei_vigente" if obj["tipo_objeto"] == "ato" else "projeto_lei"
        return f"{base}_{'com' if sinal else 'sem'}_sinal"
    return f"norma_secundaria_{'com' if sinal else 'sem'}_sinal"


def tipos_desconhecidos(objetos: list[dict]) -> dict[str, int]:
    """Tipos que nenhuma das listas acima reconhece.

    Existe porque o silêncio aqui é caro: a coleta de uma cidade nova traz
    grafia nova (foi assim que "Lei" de BH/SP não casou com "Lei Ordinária"
    de Betim e 1.098 leis caíram para norma secundária). Tipo não
    reconhecido continua entrando na fila — como secundário, nunca sumindo
    dela — mas aparece no resumo para alguém decidir onde ele pertence.
    """
    conhecidos_ato = TIPOS_ATO_SECUNDARIO | TIPOS_ATO_PRIMARIO_EXTRA
    conhecidos_prop = (
        TIPOS_PROPOSICAO_PRIMARIO | TIPOS_PROPOSICAO_SECUNDARIO | TIPOS_PROPOSICAO_NAO_NORMATIVO
    )
    fora: dict[str, int] = {}
    for obj in objetos:
        tipo = _slug(obj.get("tipo"))
        if obj["tipo_objeto"] == "ato":
            if _ato_primario(tipo) or tipo in conhecidos_ato:
                continue
        elif tipo in conhecidos_prop:
            continue
        chave = f"{obj['tipo_objeto']}:{tipo or '(vazio)'}"
        fora[chave] = fora.get(chave, 0) + 1
    return fora


def _analisados(sb, id_municipio: str) -> tuple[set[str], set[str]]:
    """Ids já analisados nesta cidade, separados por tipo de objeto."""
    linhas = fetch_all(
        lambda: sb.table("analises")
        .select("ato_id, proposicao_id")
        .eq("id_municipio", id_municipio)
    )
    return (
        {l["ato_id"] for l in linhas if l.get("ato_id")},
        {l["proposicao_id"] for l in linhas if l.get("proposicao_id")},
    )


def montar_fila(
    id_municipio: str,
    limite: int | None = None,
    incluir_ruido: bool = False,
    tipo_objeto: str = "ambos",
    verbose: bool = True,
) -> list[dict]:
    """Lista ORDENADA de objetos a analisar, já normalizados para o prompt.

    Cada item carrega `_camada` (por que está nessa posição) e `_ruido` (que
    padrão bateu, quando bateu) — o exportador usa isso para separar em
    subpastas e o operador, para conferir a régua sem ler este código.
    """
    sb = get_supabase_client()
    municipio = carregar_municipio(id_municipio)
    atos_feitos, props_feitas = _analisados(sb, id_municipio)

    objetos: list[dict] = []

    if tipo_objeto in ("ambos", "ato"):
        brutos = fetch_all(
            lambda: sb.table("atos_oficiais").select(CAMPOS_ATO).eq("id_municipio", id_municipio)
        )
        objetos += [normalizar_ato(r, municipio) for r in brutos if r["id"] not in atos_feitos]

    if tipo_objeto in ("ambos", "proposicao"):
        brutos = fetch_all(
            lambda: sb.table("proposicoes").select(CAMPOS_PROPOSICAO).eq("id_municipio", id_municipio)
        )
        objetos += [normalizar_proposicao(r, municipio) for r in brutos if r["id"] not in props_feitas]

    for obj in objetos:
        obj["_camada"] = _camada(obj)
        obj["_ruido"] = classificar_ruido(obj.get("ementa"))

    contagem: dict[str, int] = {}
    for obj in objetos:
        contagem[obj["_camada"]] = contagem.get(obj["_camada"], 0) + 1

    if not incluir_ruido:
        objetos = [o for o in objetos if o["_camada"] not in CAMADAS_DESPRIORIZADAS]

    # Dentro da camada, o mais recente primeiro: uma lei de 2015 já foi
    # absorvida pelo debate público, uma de 2026 é onde a análise muda
    # alguma coisa. `""` empurra data ausente para o fim sem quebrar a
    # comparação (o campo é nulável nas duas tabelas).
    objetos.sort(key=lambda o: (_RANK[o["_camada"]], _inverso_data(o.get("data"))))

    if verbose:
        nome = municipio.get("nome")
        print(f"[fila_prioridade] {nome} ({id_municipio}) — {len(objetos)} na fila")
        for camada in CAMADAS:
            n = contagem.get(camada, 0)
            if not n:
                continue
            marca = "  (fora da fila)" if camada in CAMADAS_DESPRIORIZADAS and not incluir_ruido else ""
            print(f"    {camada:<28} {n:>5}{marca}")
        ruidos: dict[str, int] = {}
        for obj in objetos if incluir_ruido else []:
            if obj.get("_ruido"):
                ruidos[obj["_ruido"]] = ruidos.get(obj["_ruido"], 0) + 1
        for slug, n in sorted(ruidos.items(), key=lambda kv: -kv[1]):
            print(f"      ruído/{slug:<22} {n:>5}")
        for chave, n in sorted(tipos_desconhecidos(objetos).items(), key=lambda kv: -kv[1]):
            print(f"    [tipo não catalogado] {chave}: {n} (tratado como norma secundária)")
        já = len(atos_feitos) + len(props_feitas)
        if já:
            print(f"    (já analisados, fora da contagem: {já})")

    return objetos[:limite] if limite else objetos


def _inverso_data(data: str | None) -> str:
    """Chave de ordenação decrescente por data, com nulo por último.

    Truque de string em vez de `reverse=True`: a ordenação primária
    (`_RANK`) é CRESCENTE, e `reverse=True` inverteria as duas. Invertendo
    cada caractere da data ISO, o `sort` crescente entrega data mais recente
    primeiro sem tocar na camada.
    """
    if not data:
        return "￿"  # sem data vai para o fim
    return "".join(chr(0x7E - ord(c)) if 0x2D <= ord(c) <= 0x39 else c for c in data)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    # Sem default de cidade: ver scripts/conferir_defaults_de_cidade.py.
    ap.add_argument("--id-municipio", required=True)
    ap.add_argument("--limite", type=int, default=None)
    ap.add_argument("--tipo-objeto", choices=["ambos", "ato", "proposicao"], default="ambos")
    ap.add_argument(
        "--incluir-ruido",
        action="store_true",
        help="inclui requerimento/indicação/moção e crédito suplementar; a rubrica "
             "manda devolver vazio nesses casos, então é pagar para receber []",
    )
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()

    fila = montar_fila(a.id_municipio, a.limite, a.incluir_ruido, a.tipo_objeto, verbose=not a.json)
    if a.json:
        print(json.dumps(fila, ensure_ascii=False))
    else:
        for obj in fila[:20]:
            print(f"    [{obj['_camada']}] {obj['identificacao']}: {(obj.get('ementa') or '')[:90]}")
