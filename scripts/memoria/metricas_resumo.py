"""Métricas de qualidade do resumo da Mística do Dia.

Papel no portal: medir e escolher os recortes de texto que viram resumo
em `gera-calendario-insurgente.py` e sustentar a comparação antes x
depois em `gera-doc-resumos-mistica.py`. É código puro — carrega os
gazetteiros na importação e não toca em nenhum arquivo de saída.

Regras do dev que este módulo implementa (30/09/2026):
1. SEM FRASE REPETIDA: o mesmo texto não pode aparecer no resumo de
   dois verbetes diferentes (o dev apontou "frases que parecem
   repetidas" — parágrafos do MST que alimentam dias vizinhos).
2. OS QUATRO ELEMENTOS: "todo resumo precisa ter quem (pessoa ou
   movimento), o quê (fato/luta), quando e onde (cidade/estado/país/
   continente)". A detecção é heurística e a cobertura é PUBLICADA como
   medição — número medido, nunca garantia (AGENTS §8: número na tela
   vem de constante medida com data).

Decisões técnicas:
- os gazetteiros vêm dos dados versionados do repo (5.571 municípios do
  IBGE e 27 estados em apps/web/data) + listas de países e cidades do
  mundo escritas aqui, porque as duas fontes do calendário são
  internacionais (Havana, Berlim, Moscou...);
- casamento CASE-SENSITIVE de propósito: "santos" minúsculo não é a
  cidade Santos, "Para" maiúsculo sem acento não é o estado Pará;
- cache de `elementos()`: os mesmos candidatos são pontuados em vários
  verbetes e a busca do "onde" roda sobre ~5.700 alternativas.
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

DADOS = Path(r"X:\DevCoder\OpenCode\controle-popular\apps\web\data")
CAP_RESUMO = 400
SENTENCA = re.compile(r"(?<=[.!?])\s+")

# --- gazetteiros de ONDE (cidade/estado/país/continente) ------------------

PAISES = (
    "Brasil", "Argentina", "Uruguai", "Paraguai", "Chile", "Bolívia", "Peru",
    "Equador", "Colômbia", "Venezuela", "Cuba", "México", "Guatemala",
    "Honduras", "Nicarágua", "Costa Rica", "Panamá", "Haiti", "Jamaica",
    "Porto Rico", "República Dominicana", "Estados Unidos", "Canadá",
    "Portugal", "Espanha", "França", "Inglaterra", "Reino Unido", "Alemanha",
    "Itália", "Rússia", "União Soviética", "Polônia", "Áustria", "Hungria",
    "Grécia", "Bélgica", "Holanda", "Países Baixos", "Suíça", "Suécia",
    "Noruega", "Dinamarca", "Finlândia", "Irlanda", "Romênia", "Iugoslávia",
    "Tchecoslováquia", "Checoslováquia", "Áustro-Hungria", "Grã-Bretanha",
    "Boêmia", "Morávia", "Ucrânia", "Bielorrússia", "Albânia", "Bulgária",
    "Sérvia", "Lituânia", "Letônia", "Estônia",
    "Guiné-Bissau", "Guiné", "Cabo Verde", "Senegal", "Mali", "Nigéria",
    "Gana", "Quênia", "Etiópia", "Egito", "Argélia", "Marrocos",
    "África do Sul", "Rodésia", "Moçambique", "Angola", "Namíbia", "Congo",
    "Zaire", "Libéria", "Serra Leão", "Costa do Marfim", "Tanzânia",
    "Uganda", "Sudão", "Líbia", "Madagáscar", "Somália", "Burquina Faso",
    "Mauritânia", "Gâmbia", "Camarões", "Ruanda", "Malawi", "Zâmbia",
    "Zimbábue", "Botswana", "Lesoto", "Chade", "Níger", "Benim",
    "China", "Japão", "Índia", "Vietnã", "Vietnã do Sul", "Coreia",
    "Tailândia", "Indonésia", "Filipinas", "Malásia", "Paquistão",
    "Bangladesh", "Irã", "Iraque", "Síria", "Líbano", "Israel", "Palestina",
    "Jordânia", "Arábia Saudita", "Turquia", "Afeganistão", "Mongólia",
    "Camboja", "Laos", "Iêmen", "Singapura",
    "Austrália", "Nova Zelândia", "Fiji",
)

CONTINENTES = (
    "América", "América do Norte", "América do Sul", "América Latina",
    "África", "Ásia", "Europa", "Oceania", "Oriente Médio",
)

# Cidades fora do Brasil — as fontes do calendário passam por Havana,
# Berlim, Moscou e Argel; sem elas o "onde" de um resumo sobre a
# Revolução Cubana ou a Checoslováquia contaria como lacuna.
CIDADES_MUNDO = (
    "Havana", "Santiago de Cuba", "Guantânamo", "Santa Clara", "Cienfuegos",
    "Buenos Aires", "Montevidéu", "Assunção", "Lima", "Bogotá", "Caracas",
    "Santiago", "Quito", "La Paz", "São Domingos", "Porto Príncipe",
    "Cidade do México", "Guatemala", "Manágua", "Washington",
    "Nova Iorque", "Los Angeles", "Chicago", "Miami", "Toronto",
    "Berlim", "Paris", "Londres", "Moscou", "São Petersburgo", "Petrogrado",
    "Roma", "Madri", "Lisboa", "Viena", "Atenas", "Istambul", "Varsóvia",
    "Budapeste", "Praga", "Zagreb", "Belgrado", "Kiev", "Genebra", "Haia",
    "Cairo", "Argel", "Trípoli", "Joanesburgo", "Nairóbi", "Adis Abeba",
    "Luanda", "Maputo", "Lilongué", "Tóquio", "Pequim",
    "Xangai", "Hanói", "Seul", "Delhi", "Bombaim", "Cabul", "Teerã",
    "Bagdá", "Damasco", "Jerusalém", "Ramala", "Manila", "Jacarta",
    "Bangkok", "Saigon", "Salvador da Bahia", "Berlin", "San Andrés",
    "Munique", "Florença", "Turim", "Gênova", "Leninegrado",
    "Ciudad de la Habana",
)

# Gentílicos: "sociedade francesa", "povo cubano" e "camponeses
# mineiros" dizem o país/estado sem citar o nome dele — entram no ONDE
# porque o leitor sai sabendo de onde se fala. Minúsculas de propósito,
# com fronteira de palavra, e sem palavras que virem adjetivo comum
# ("nacional", "popular" não entram).
DEMONIMOS = (
    "brasileiro", "brasileira", "americano", "americana", "francês",
    "francesa", "espanhol", "espanhola", "cubano", "cubana", "soviético",
    "soviética", "russo", "russa", "alemão", "alemã", "inglês", "inglesa",
    "português", "portuguesa", "italiano", "italiana", "mexicano",
    "mexicana", "argentino", "argentina", "chileno", "chilena",
    "colombiano", "colombiana", "peruano", "peruana", "venezuelano",
    "venezuelana", "boliviano", "boliviana", "paraguaio", "paraguaia",
    "uruguaio", "uruguaia", "equatoriano", "sul-africano", "moçambicano",
    "angolano", "guineano", "cabo-verdiano", "senegalense", "etíope",
    "egípcio", "marroquino", "turco", "turca", "chinês", "chinesa",
    "japonês", "japonesa", "indiano", "coreano", "vietnamita",
    "palestino", "israelense", "sírio", "síria", "libanês", "grego",
    "grega", "polonês", "húngaro", "tcheco", "tcheca", "romeno",
    "ucraniano", "bielorrusso", "austriaco", "suíço", "sueco",
    "norueguês", "dinamarquês", "finlandês", "irlandês", "belga",
    "holandês", "escocês", "gaúcho", "mineiro", "mineira", "baiano",
    "baiana", "carioca", "paulista", "pernambucano", "maranhense",
    "cearense", "paraibano", "amazonense", "goiano", "catarinense",
    "paranaense", "alagoano", "sergipano", "piauiense", "paraense",
    "rondoniense", "tocantinense", "matogrossense", "grandense",
)

# Regiões subnacionais e regiões do Brasil — "onde" aceita cidade,
# estado, país e continente (dev, 30/09/2026), e as fontes citam
# Chiapas, Catalunha, Sibéria, o Sertão e o Nordeste sem cidade alguma.
REGIOES = (
    # México (a Zapatista é de Chiapas)
    "Chiapas", "Oaxaca", "Yucatán", "Chihuahua", "Sonora", "Jalisco",
    "Nuevo León", "Tamaulipas", "Guerrero", "Michoacán", "Veracruz",
    "Puebla", "Guanajuato", "Quintana Roo", "Campeche", "Tabasco",
    "Hidalgo", "Morelos", "Durango", "Coahuila", "Zacatecas",
    # Espanha, Itália, Alemanha, França, Reino Unido, Rússia
    "Catalunha", "Andaluzia", "Galícia", "Valência", "Aragão", "Castilha",
    "Basca", "Sicília", "Sardenha", "Nápoles", "Lombardia", "Vêneto",
    "Toscana", "Baviera", "Brandemburgo", "Saxônia", "Pomerânia",
    "Prússia", "Bretanha", "Normandia", "Provença", "Alsácia", "Lorena",
    "Escócia", "Cornualha", "Sibéria", "Crimeia", "Cáucaso",
    # Argentina, Cuba, Colômbia, Venezuela, Peru, Chile
    "Patagônia", "Córdoba", "Rosário", "Mendoza", "Tucumán", "Salta",
    "Jujuy", "La Pampa", "Pinar del Río", "Camagüey", "Holguín",
    "Antioquia", "Cartagena", "Maracaibo", "Zulia", "Cusco", "Arequipa",
    "Araucanía",
    # EUA e África histórica
    "Califórnia", "Texas", "Flórida", "Alaska", "Virgínia", "Geórgia",
    "Transvaal", "Orange", "Cabo Oriental",
    # Brasil por regiões naturais e históricas
    "Nordeste", "Sudeste", "Centro-Oeste", "Amazônia", "Pantanal",
    "Cerrado", "Mata Atlântica", "Sertão", "Agreste", "Zona da Mata",
    "Vale do Jequitinhonha", "Vale do Mucuri", "Vale do Paraíba",
    "Triângulo Mineiro", "Superior Mineiro", "Oeste Baiano",
    "Sul Baiano", "Metropolitana de São Paulo", "Campinas",
    "Litoral Sul", "Litoral Norte",
)

_UFS = json.loads((DADOS / "fontes-27-estados.json").read_text(encoding="utf-8"))
_MUNICIPIOS = json.loads((DADOS / "municipios-brasil.json").read_text(encoding="utf-8"))
_UF_SIGLAS = {e["uf"] for e in _UFS}


def _padrao(termos) -> re.Pattern:
    """Um único regex com todos os termos, do mais longo para o mais curto.

    Ordenar por tamanho faz "América do Norte" casar antes de "América",
    e as fronteiras `(?<![A-Za-zÀ-ÿ])` impedem que "Santos" case dentro
    de "santoso".
    """
    ordenados = sorted({t for t in termos if t}, key=len, reverse=True)
    return re.compile(
        r"(?<![A-Za-zÀ-ÿ])(?:" + "|".join(re.escape(t) for t in ordenados)
        + r")(?![A-Za-zÀ-ÿ])"
    )


_RE_ONDE = _padrao(
    {m["nome"] for m in _MUNICIPIOS if len(m["nome"]) >= 4}
    | {e["nome"] for e in _UFS}
    | {e["capital"] for e in _UFS if len(e["capital"]) >= 4}
    | _UF_SIGLAS
    | set(PAISES)
    | set(CONTINENTES)
    | set(CIDADES_MUNDO)
    | set(REGIOES)
)

# QUANDO: ano (4 dígitos entre 1000 e 2029), nome de mês, século,
# marcadores temporais ("depois", "durante", "em seguida"...), "após",
# "há/dez anos" (tempo decorrido) e pronomes temporais ("naquele dia").
_RE_ANO = re.compile(r"\b(?:1[0-9]{3}|20[0-2][0-9])\b")
_RE_QUANDO = re.compile(
    r"\b(?:janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|"
    r"setembro|outubro|novembro|dezembro|s[eé]culo|em seguida|ap[oó]s|"
    r"anos? depois|meses? depois|dias? depois|semanas? depois|"
    r"depois|antes|durante|posteriormente|anteriormente|no dia|"
    r"na [eé]poca|a [eé]poca|desde ent[aã]o|finda[os]?|per[ií]odo|"
    r"d[eé]cada|naqu[eo]l[ae]|nesse|neste|nesta|ent[aã]o|seguido)\b"
    r"|\bh[aá]\s+(?:\w+\s+){0,5}(?:anos?|meses?|dias?|semanas?|"
    r"d[ée]cadas?|s[ée]culos?)\b"
    r"|\b(?:nos?|nas?)\s+(?:[uú]ltimos?|pr[oó]ximos?|mesmos?)\s+"
    r"(?:anos?|meses?|dias?|semanas?)\b",
    re.I,
)

_RE_DEMONIMOS = re.compile(_padrao(d.lower() for d in DEMONIMOS).pattern, re.I)

# QUEM: sequência de 2+ nomes próprios ("Simón Bolívar", "Maria
# Bonita"), nome próprio no meio da frase (não é início de período),
# sigla de organização (MST, URSS, PCB — UF sigla não conta: "MG" é
# lugar, não pessoa) e papéis/movimentos (líder, ditador, guerrilha...).
_RE_NOMES = re.compile(
    r"\b[A-ZÀ-Ý][A-Za-zÀ-ÿ]+(?:\s+(?:de|da|do|das|dos|e)\s+"
    r"[A-ZÀ-Ý][A-Za-zÀ-ÿ]+|\s+[A-ZÀ-Ý][A-Za-zÀ-ÿ]+)+\b"
)
_RE_MEIO = re.compile(r"(?<=[a-zà-ÿ,;:]\s)[A-ZÀ-Ý][A-Za-zÀ-ÿ]{3,}")
_RE_SIGLA = re.compile(r"\b[A-ZÁÉÍÓÚÂÊÔÃÕ]{2,}\b")
_RE_ROMANO = re.compile(r"[IVXLCDM]+")
_RE_PAPEL = re.compile(
    r"presidente|ditador(?:a)?|governador(?:a)?|prefeito(?:a)?|general|"
    r"marechal|capit[aã]o|soldado|l[ií]der|revolucion[aá]ri[oa]|"
    r"campon[eê]s|oper[aá]ri[oa]|trabalhador(?:a)?|poeta|escritor(?:a)?|"
    r"professor(?:a)?|m[eé]dico|monge|padre|bispo|rainha|imperador|"
    r"imperatriz|senador(?:a)?|deputad[oa]|ministr[oa]|jurista|"
    r"estudante|movimento|guerrilha|partido|sindicato|frente|ex[eé]rcito|"
    r"coluna|batalh[aã]o|organiza[cç][aã]o|comit[êe]|mil[ií]cia|"
    r"rebeldes|insurgentes|patriotas|escravizados|prisioneiros|"
    r"presos|mulheres|fam[ií]lias|sem-terra|campesin[oa]s",
    re.I,
)

# O QUÊ: verbo conjugado que narra o fato ou substantivo de fato/luta.
# A lista cobre os irregulares e os mais comuns; o padrão genérico de
# terminações (-ou, -eu, -aram, -eram, -avam, -iam) cobre o resto do
# português sem inventar — "meu/seu/teu" (finais de -eu) são excluídos
# na marra porque são adjetivos, não verbo.
_RE_FATO = re.compile(
    r"\b(?:foi|foram|era|eram|s[aã]o|est[aá]|tinha|tinham|teve|tiveram|"
    r"houve|houveram|fez|fizeram|ficou|ficaram|chegou|chegaram|morreu|"
    r"morreram|nasceu|nasceram|liderou|lutou|lutaram|combateu|proclamou|"
    r"proclamaram|declarou|declararam|organizou|organizaram|fundou|"
    r"fundaram|assinou|assinaram|conquistou|derrotou|governa|preso|"
    r"assassinado|assassinada|fugiu|tomou|tomaram|criou|criaram|defendeu|"
    r"iniciou|come[cç]ou|terminou|deixou|passou|levou|comandou|resistiu|"
    r"reprimiu|explorou|escravizou|venceu|caiu|entrou|saiu|morto|morta|"
    r"h[aá]|precisa|quer|participou|renunciou|destitu[ií]do|implantado|"
    r"instalado|abolido|reunido|presidido|combatido|elaborou|tornou|"
    r"permaneceu|afirmou|escreveu|publicou|apresentou|prop[oô]s|alertou|"
    r"criticou|apontou|indicou|revelou|confirmou|negou|assumiu|dominou|"
    r"governou|explodiu|massacrou|fuzilou|enforcou|desterrou|deportaram|"
    r"libertou|libertaram|anistiaram|instalaram|adotaram|reformaram|"
    r"liquidaram|reuniram|mobilizaram|lideraram|combateram)\b"
    r"|\b(?!(?:meu|seu|teu|ateu|euros?)\b)[a-zà-ÿ]{3,}(?:ou|eu)\b"
    r"|\b[a-zà-ÿ]{3,}(?:aram|eram|avam|iam)\b|"
    r"independ[eê]ncia|revolu[cç][aã]o|greve|batalha|massacre|ditadura|"
    r"nascimento|morte|elei[cç][aã]o|golpe|guerra|confer[eê]ncia|luta|"
    r"resist[eê]ncia|pris[õo]es|desaparecidos|rendi[cç][aã]o|tomada|"
    r"fundação|criação|proclamação|abolição|legalização|dissolução",
    re.I,
)


def sem_acento(texto: str) -> str:
    """Minúsculas e sem acento — chave de comparação de frases e títulos."""
    return "".join(
        c for c in unicodedata.normalize("NFKD", texto.lower())
        if not unicodedata.combining(c)
    )


def corta_paragrafos(resumo: str, max_frases: int = 2, cap: int = CAP_RESUMO) -> str:
    """Limita o resumo a `max_frases` frases e ao teto de caracteres.

    Regra do dev (30/09/2026): cada história cabe em 2 parágrafos, "ainda
    que um pouco grandes" — o excesso cansa e ocupa a tela inicial. A
    seleção (`escolhe`) pode devolver janelas de 3 a 5 frases quando elas
    trazem mais dos 4 elementos; aqui o texto volta ao teto de 1-2 frases
    que o próprio gerador declara.

    Não reescreve: só remove o excedente e, quando a frase única passa do
    `cap`, corta na última fronteira de palavra — nunca no meio dela.
    """
    frases = [f.strip() for f in SENTENCA.split(resumo) if f.strip()]
    texto = " ".join(frases[:max_frases]) if frases else resumo.strip()
    if len(texto) <= cap:
        return texto
    corte = texto.rfind(" ", 0, cap)
    return (texto[:corte] if corte > 0 else texto[:cap]).rstrip()


def frases60(resumo: str) -> set[str]:
    """Frases de 60+ caracteres normalizadas — a chave anti-repetição.

    Frase curta ("Presos 83 homens e 13 mulheres.") é normal na fonte e
    pode repetir sem ser defeito; frase longa repetida é o defeito que o
    dev apontou.
    """
    return {
        re.sub(r"\s+", " ", sem_acento(f)).strip()
        for f in SENTENCA.split(resumo)
        if len(f.strip()) >= 60
    }


def tem_quem(texto: str) -> bool:
    """Há pessoa ou movimento no recorte? (heurística, nunca reescreve)"""
    if _RE_NOMES.search(texto) or _RE_MEIO.search(texto) or _RE_PAPEL.search(texto):
        return True
    for sigla in _RE_SIGLA.findall(texto):
        if sigla in _UF_SIGLAS or _RE_ROMANO.fullmatch(sigla):
            continue  # "MG" é lugar; "IV" é número romano
        return True
    return False


_ELEMENTOS_CACHE: dict[str, dict[str, bool]] = {}


def elementos(texto: str) -> dict[str, bool]:
    """Os 4 elementos do recorte: quem, o quê, quando e onde.

    Cache por texto: os mesmos candidatos são pontuados em vários
    verbetes e a busca do "onde" roda sobre ~5.700 alternativas.
    """
    cache = _ELEMENTOS_CACHE.get(texto)
    if cache is None:
        cache = {
            "quem": tem_quem(texto),
            "oque": bool(_RE_FATO.search(texto)),
            "quando": bool(_RE_ANO.search(texto) or _RE_QUANDO.search(texto)),
            "onde": bool(_RE_ONDE.search(texto) or _RE_DEMONIMOS.search(texto)),
        }
        _ELEMENTOS_CACHE[texto] = cache
    return cache


def repete_titulo(candidato: str, titulo: str) -> bool:
    """O candidato é (ou começa por) o próprio título?

    Janela do parágrafo inteiro pode devolver a frase do título — aí o
    resumo repetiria o título na tela. Medido como zero no doc de
    revisão antes da seleção e que não pode nascer aqui.
    """
    if not titulo:
        return False
    return sem_acento(candidato)[:40] == sem_acento(titulo)[:40]


def escolhe(
    candidatas: list[str], usadas: set[str], vistos: set[str], titulo: str = ""
) -> tuple[str, bool]:
    """Escolhe o resumo: sem frase repetida, sem repetir o título e com
    mais elementos.

    Ordem de preferência: (1) candidatos livres — nenhum de seus textos
    de 60+ caracteres já foi usado por outro verbete, o resumo não é
    idêntico a outro e não repete o título; (2) entre os livres, o que
    satisfaz mais elementos (quem, o quê, quando, onde); (3) empate: o
    mais perto do título (ordem original da fonte). Se TODOS os
    candidatos repetem (mesmo parágrafo em dois verbetes), usa o melhor
    mesmo assim e devolve `forcado=True` para a contagem honesta —
    inventar texto para fugir da repetição é proibido (AGENTS §7).
    """
    cands = [c for c in candidatas if c and not repete_titulo(c, titulo)]
    if not cands:
        return "", False
    livres = [
        c for c in cands
        if c not in vistos and not (frases60(c) & usadas)
    ]
    pool = livres or cands
    escolhido = max(
        pool,
        key=lambda c: (sum(elementos(c).values()), -cands.index(c)),
    )
    vistos.add(escolhido)
    usadas |= frases60(escolhido)
    return escolhido, not livres


def mede(itens: list[tuple[str, str]]) -> dict:
    """Métricas de repetição e cobertura dos 4 elementos de uma série.

    `itens` = (titulo, resumo) na ordem das entradas. Repetições e a
    cobertura principal são sobre o RESUMO — a regra do dev é "todo
    resumo precisa ter quem, o quê, quando e onde". `cobertura_com_titulo`
    mede o par título + resumo, que é o que o leitor realmente vê na
    tela (`MisticaDoDia.tsx` mostra ano + título + resumo juntos), e
    `titulo_repetido` garante que a seleção nunca faça o resumo repetir
    o título. Só entra na conta resumo não vazio; lacuna continua sendo
    lacuna (AGENTS §7).
    """
    pares = [(t, r) for t, r in itens if r]
    grupos: dict[str, int] = {}
    for _, r in pares:
        grupos[r] = grupos.get(r, 0) + 1
    identicos = [r for r, n in grupos.items() if n > 1]
    frases: dict[str, int] = {}
    for _, r in pares:
        for f in frases60(r):
            frases[f] = frases.get(f, 0) + 1
    repetidas = sum(1 for n in frases.values() if n > 1)
    vazio = {"quem": 0, "oque": 0, "quando": 0, "onde": 0, "todos": 0}
    cobertura = dict(vazio)
    cobertura_titulo = dict(vazio)
    titulo_repetido = 0
    for t, r in pares:
        for alvo, base in ((cobertura, r), (cobertura_titulo, f"{t} {r}")):
            el = elementos(base)
            for k in ("quem", "oque", "quando", "onde"):
                if el[k]:
                    alvo[k] += 1
            if all(el.values()):
                alvo["todos"] += 1
        if repete_titulo(r, t):
            titulo_repetido += 1
    return {
        "com_resumo": len(pares),
        "resumos_identicos": len(identicos),
        "entradas_em_resumos_identicos": sum(grupos[r] for r in identicos),
        "frases_repetidas": repetidas,
        "titulo_repetido": titulo_repetido,
        "cobertura": cobertura,
        "cobertura_com_titulo": cobertura_titulo,
    }
