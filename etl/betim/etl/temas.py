"""etl.temas — thematic tagging shared by `proposicoes` and `contratos`.

Pedido do usuário (2026-07-22): requerimentos, projetos de lei e contratos
devem carregar tags temáticas (Saúde, Educação, Segurança, Adm. Pública...)
pra dar pra filtrar e entender as áreas de foco de atuação de cada
vereador/prefeitura -- não só QUANTO cada um legisla (`PESO_PROPOSICAO` em
`lib/vereadores.ts`), mas SOBRE O QUÊ.

Classificação por palavra-chave (regex), não por LLM: `AI_API_KEY` no
`.env` existe mas está vazio (nenhum provedor configurado -- é o mesmo
`resumo_ia`/F8 ainda não construído), e mesmo se estivesse, regras
explícitas e auditáveis ("esta proposta tem a tag Saúde porque contém a
palavra 'hospital'") combinam melhor com um portal de transparência do
que uma classificação opaca de IA. As regras abaixo foram calibradas
contra ementas e objetos REAIS já sincronizados de Betim (não inventadas
-- ver amostras na sessão que criou este arquivo), não um vocabulário
genérico de manual.

Um texto pode receber VÁRIAS tags (uma proposta sobre "reforma de posto de
saúde" é Saúde E Infraestrutura ao mesmo tempo) ou nenhuma (texto
processual/genérico sem tema identificável, ex. "Retirada de emenda ao
PLDO nº137/2026" -- fica com `temas = []`, não um "Outros" forçado, pra
não fingir uma classificação que não existe).
"""
import re

TEMA_LABELS: dict[str, str] = {
    "saude": "Saúde",
    "educacao": "Educação",
    "seguranca_publica": "Segurança Pública",
    "assistencia_social": "Assistência Social",
    "meio_ambiente": "Meio Ambiente",
    "infraestrutura_obras": "Infraestrutura e Obras",
    "mobilidade_transporte": "Mobilidade e Transporte",
    "habitacao_urbanismo": "Habitação e Urbanismo",
    "cultura_esporte_lazer": "Cultura, Esporte e Lazer",
    "economia_desenvolvimento": "Economia e Desenvolvimento",
    "administracao_publica": "Administração Pública",
    "homenagens_datas": "Homenagens e Datas Comemorativas",
    "agropecuaria": "Agropecuária",
}

# Ordem de checagem importa pouco (é união, não prioridade) EXCETO pra
# `homenagens_datas`, que é deliberadamente estreita e checada por último
# só sobre o que sobrou sem nenhum outro tema real -- "denominação de
# logradouro" é pura homenagem, mas "Dia Municipal de Conscientização
# sobre Endometriose" tem que cair em Saúde, não em Homenagens (ver
# _EXCLUI_HOMENAGEM_SE_JA_TEM_TEMA abaixo).
_REGRAS: dict[str, re.Pattern] = {
    "saude": re.compile(
        r"sa[uú]de|hospital|hospitalar|sus\b|m[eé]dic|enferm|ambulat[oó]ri|"
        r"vacin|farm[aá]c|cardiopati|cardiovascular|obesidad|diabet|"
        r"c[aâ]ncer|oncol[oó]gic|autis|tea\b|deficiência intelectual|"
        r"gestante|gravidez|endometriose|menopaus|climat[eé]rio|"
        r"amamenta|parto|psicol[oó]gic|sa[uú]de mental|psiquiátric|"
        r"exames? m[eé]dic|posto de sa[uú]de|upa\b|unidade de sa[uú]de|"
        r"medicament|odontol[oó]gic|fisioterap|nutricion|dengue|arboviros",
        re.IGNORECASE,
    ),
    "educacao": re.compile(
        # Bare "escola"/"creche" ficam de fora de propósito: são usadas
        # com frequência só como referência de endereço num pedido que na
        # verdade é sobre outra coisa (poda de árvore, buraco na rua,
        # lixeira "em frente à Escola X") -- confirmado ao vivo 2026-07-22,
        # inflava Educação com pedidos de infraestrutura/limpeza urbana
        # que só citavam uma escola como ponto de referência. Exige um
        # termo composto que só aparece quando a escola/creche É o
        # assunto (construir, reformar, rede de ensino, aluno, merenda).
        r"educa[cç][aã]o|ensino|\baluno|professor|matr[ií]cula escolar|"
        r"biblioteca|pedag[oó]gic|alfabetiza|\beja\b|merenda escolar|"
        r"transporte escolar|uniforme escolar|material escolar|kit escolar|"
        r"rede (?:municipal )?de ensino|escola municipal|"
        r"constru[cç][aã]o de (?:uma )?(?:escola|creche)|"
        r"reforma de (?:uma )?(?:escola|creche)|"
        r"implanta[cç][aã]o de (?:uma )?creche|"
        r"creche (?:municipal|infantil|noturna)|educa[cç][aã]o infantil",
        re.IGNORECASE,
    ),
    "seguranca_publica": re.compile(
        r"seguran[cç]a p[uú]blica|guarda municipal|viol[eê]ncia(?! contra a mulher)|"
        r"criminalidade|pol[ií]cia|videomonitoramento|c[aâ]meras de seguran[cç]a|"
        r"afogamento|risco de acidente|defesa civil|bombeiro",
        re.IGNORECASE,
    ),
    "assistencia_social": re.compile(
        r"assist[eê]ncia social|cras\b|creas\b|vulnerabilidade|pessoa idosa|"
        r"idoso|crian[cç]a e adolescente|pessoa com defici[eê]ncia|\bpcd\b|"
        r"popula[cç][aã]o em situa[cç][aã]o de rua|m[aã]e solo|"
        r"viol[eê]ncia contra a mulher|viol[eê]ncia dom[eé]stica|"
        r"aten[cç][aã]o [aà] mulher|bolsa fam[ií]lia|renda m[ií]nima|"
        # "ado[cç][aã]o" sozinho fica de fora: em portugu�s burocr�tico
        # "ado[cç][aã]o de medidas/pol[ií]ticas" � muito mais comum como
        # verbo gen[eé]rico ("adotar uma medida") do que ado[cç][aã]o de
        # crian[cç]a/animal -- confirmado ao vivo 2026-07-22 ("ado[cç][aã]o
        # de medidas alternativas de modera[cç][aã]o de tr[aá]fego" n[aã]o
        # tem nada a ver com Assist[eê]ncia Social).
        r"ado[cç][aã]o de crian[cç]|processo de ado[cç][aã]o|"
        r"acolhimento institucional|maus[- ]tratos|"
        r"etarismo|conselho tutelar|libras\b|surdez|defici[eê]ncia auditiva",
        re.IGNORECASE,
    ),
    "meio_ambiente": re.compile(
        r"meio ambiente|sustentabilidade|sustent[aá]vel|reciclagem|"
        r"res[ií]duos s[oó]lidos|[aá]rea verde|arboriza[cç][aã]o|"
        r"barragem|nascente|recurso h[ií]dric|polui[cç][aã]o|"
        r"animais dom[eé]sticos|animais? abandonad|bem-estar animal|"
        r"prote[cç][aã]o animal|usina solar|energia renov[aá]vel|"
        r"queimada|desmatamento|[oó]leo.{0,15}reciclagem|"
        # Área protegida -- achado 2026-08-13 investigando a Lei 726/2025 de
        # Araçuaí, que MODIFICA o zoneamento da APA da Chapada do Lagoão e
        # caía só em habitacao_urbanismo (por causa da palavra solta
        # "zoneamento" lá embaixo) sem NUNCA marcar meio_ambiente -- uma
        # norma que redesenha uma unidade de conservação não é achável por
        # quem filtra o alerta ambiental. Termos abaixo generalizam a mesma
        # calibração já usada em `etl/temas_ambientais.py` (tags
        # `unidade_conservacao`/`area_protecao_ambiental`/`rppn`), que já
        # tinha essas regras pra `ambiental_legislacao` -- este arquivo
        # (`atos_oficiais`, câmaras/prefeituras) só não as tinha ainda.
        # Medido contra as 10.317 linhas de `atos_oficiais` (2026-08-13,
        # ver scratchpad da sessão): 24 linhas GANHAM meio_ambiente com esta
        # regra (nenhuma perde tema -- é só união de alternativas), em 4
        # municípios (Belo Horizonte 9, São Paulo 12, Diamantina 2, Araçuaí
        # 1 -- a própria Lei 726/2025).
        r"[aá]rea de prote[çc][aã]o ambiental|\bapa\b|"
        r"unidade(?:s)? de conserva[çc][aã]o|"
        r"esta[çc][aã]o ecol[oó]gica|"
        r"parque (?:estadual|nacional|municipal)|"
        r"monumento natural|"
        r"reserva particular do patrim[oô]nio natural|\brppn\b|"
        r"reserva (?:biol[oó]gica|extrativista|ecol[oó]gica)|"
        r"ref[uú]gio de vida silvestre|"
        r"zoneamento (?:ambiental|ecol[oó]gico[- ]econ[oô]mico)",
        re.IGNORECASE,
    ),
    "infraestrutura_obras": re.compile(
        r"\bobras?\b|pavimenta[cç][aã]o|asf[aá]lt|constru[cç][aã]o de|reforma de|"
        r"drenagem|saneamento|ilumina[cç][aã]o p[uú]blica|"
        r"pra[cç]a p[uú]blica|cal[cç]ada|meio-fio|infraestrutura|guard.?rail",
        re.IGNORECASE,
    ),
    "mobilidade_transporte": re.compile(
        r"mobilidade|tr[aâ]nsito|transporte p[uú]blico|transporte coletivo|"
        r"quebra-mola|ciclovia|ciclofaixa|sinaliza[cç][aã]o vi[aá]ria|"
        # sem[aá]foro (não "semáforo" cru): mesmo padrão de char-class do
        # resto do arquivo pra acento -- achado 2026-07-22 ao investigar
        # por que "faixa de pedestres" não pegava tema nenhum.
        r"sem[aá]foro|passe escolar|bilhetagem|faixa de pedestres|"
        r"lombada|redutor de velocidade",
        re.IGNORECASE,
    ),
    "habitacao_urbanismo": re.compile(
        r"habita[cç][aã]o|moradia|regulariza[cç][aã]o fundi[aá]ria|"
        r"zoneamento|uso do solo|plano diretor|loteamento",
        re.IGNORECASE,
    ),
    "cultura_esporte_lazer": re.compile(
        r"\bcultura\b|cultural|\besporte\b|esportiv|\blazer\b|teatro|"
        r"m[uú]sica|festival|complexo esportivo|quadra poliesportiva|"
        r"gin[aá]sio poliesportivo|teatr|"
        r"biblioteca p[uú]blica|patrim[oô]nio hist[oó]rico|carnaval",
        re.IGNORECASE,
    ),
    "economia_desenvolvimento": re.compile(
        r"emprego|empregabilidade|trabalhador|empreendedor|microempreendedor|"
        r"\bmei\b|com[eé]rcio|desenvolvimento econ[oô]mico|ind[uú]stria|"
        r"turismo|capacita[cç][aã]o profissional|qualifica[cç][aã]o profissional",
        re.IGNORECASE,
    ),
    "administracao_publica": re.compile(
        # \b antes de "licita" é obrigatório: sem ele, "licitação" batia
        # dentro de "SOLICITAção" -- confirmado ao vivo 2026-07-22, era o
        # maior gerador de falso positivo do classificador inteiro (quase
        # todo requerimento começa com "Solicitação de...").
        r"administra[cç][aã]o p[uú]blica|servidor p[uú]blico|\blicita[cç][aã]o|"
        r"transpar[eê]ncia p[uú]blica|or[cç]amento municipal|"
        r"gest[aã]o p[uú]blica|insalubridade|concurso p[uú]blico|"
        r"efetivo exerc[ií]cio|regime jur[ií]dico [uú]nico",
        re.IGNORECASE,
    ),
    "agropecuaria": re.compile(
        r"produtor(?:es)? rurai?s?|agropecu[aá]ri|agricultura|zona rural|"
        r"agricultor familiar|pesca\b",
        re.IGNORECASE,
    ),
    # Estreito de propósito -- ver docstring do módulo.
    "homenagens_datas": re.compile(
        r"denomina[cç][aã]o d[oae]\b|passa a denominar|"
        r"t[ií]tulo de cidad[aã]o|cidad[aã]o honor[aá]rio|"
        r"comenda\b|homenage[ia]|em homenagem",
        re.IGNORECASE,
    ),
}


def classificar_texto(texto: str | None) -> list[str]:
    """Devolve a lista de temas (slugs) cujo padrão bate em `texto` --
    união, não prioridade (uma proposta pode ter vários temas reais)."""
    if not texto:
        return []
    temas = [slug for slug, regex in _REGRAS.items() if slug != "homenagens_datas" and regex.search(texto)]
    if not temas and _REGRAS["homenagens_datas"].search(texto):
        # "homenagens_datas" só entra quando NENHUM tema de conteúdo bateu
        # -- uma "Semana de Conscientização sobre Endometriose" é Saúde,
        # mesmo contendo "institui... no calendário", que por si só não
        # aciona homenagens_datas (a regex dessa tag é propositalmente
        # restrita a homenagem/denominação pura, não a qualquer data
        # comemorativa).
        temas = ["homenagens_datas"]
    return sorted(temas)


# Mapa direto de `contratos.unidade_nome` (o órgão que assinou o contrato)
# pra tema -- sinal muito mais confiável que palavra-chave em `objeto` pra
# contratos, confirmado contra os dados reais de Betim: 454/576 contratos
# vêm do "FUNDO MUNICIPAL DE SAUDE DE BETIM" sozinho. Comparação por
# substring (normalizada) porque o texto real tem variação de
# maiúscula/acento entre fontes (PNCP raramente acentua, alguns campos
# têm acento) -- ver `_normalizar` abaixo, mesmo padrão de
# `etl/alertas.py`/`etl/bd/tse.py`.
_UNIDADE_TEMA: list[tuple[str, str]] = [
    ("FUNDO MUNICIPAL DE SAUDE", "saude"),
    ("SECRETARIA MUNICIPAL DE SAUDE", "saude"),
    ("SECRETARIA MUNICIPAL DE EDUCACAO", "educacao"),
    ("FUNDO MUNICIPAL DE EDUCACAO", "educacao"),
    ("SECRETARIA MUNICIPAL DE ASSISTENCIA SOCIAL", "assistencia_social"),
    ("FUNDO MUNICIPAL DE ASSISTENCIA SOCIAL", "assistencia_social"),
    ("SECRETARIA MUNICIPAL DE MEIO AMBIENTE", "meio_ambiente"),
    ("SECRETARIA MUNICIPAL DE OBRAS", "infraestrutura_obras"),
    ("PLANEJAMENTO, GESTAO, ORCAMENTO E OBRAS", "infraestrutura_obras"),
    ("SECRETARIA MUNICIPAL DE CULTURA", "cultura_esporte_lazer"),
    ("SECRETARIA MUNICIPAL DE ESPORTE", "cultura_esporte_lazer"),
    ("SECRETARIA MUNICIPAL DE SEGURANCA", "seguranca_publica"),
    ("GUARDA MUNICIPAL", "seguranca_publica"),
    ("SECRETARIA MUNICIPAL DE ADMINISTRACAO", "administracao_publica"),
    ("SECRETARIA ADJUNTA DE ADMINISTRACAO", "administracao_publica"),
    ("SECRETARIA MUNICIPAL DE AUDITORIA E CONTROLE", "administracao_publica"),
    ("PROCURADORIA GERAL", "administracao_publica"),
    ("GABINETE DO PREFEITO", "administracao_publica"),
    ("PREFEITURA MUNICIPAL DE BETIM", "administracao_publica"),
    ("ECOS", "infraestrutura_obras"),  # empresa municipal de obras/transporte
]


def _normalizar(texto: str) -> str:
    import unicodedata

    t = unicodedata.normalize("NFKD", texto or "")
    return "".join(ch for ch in t if not unicodedata.combining(ch)).upper()


def classificar_contrato(unidade_nome: str | None, objeto: str | None) -> list[str]:
    """União do tema do órgão contratante (`unidade_nome`, sinal primário)
    com os temas de conteúdo achados em `objeto` (sinal secundário -- pega
    o caso de uma obra de reforma de posto de saúde pedida pela
    Secretaria de Finanças/Obras, por exemplo: fica Saúde E Infraestrutura)."""
    temas: set[str] = set()
    if unidade_nome:
        alvo = _normalizar(unidade_nome)
        for chave, tema in _UNIDADE_TEMA:
            if chave in alvo:
                temas.add(tema)
    temas.update(classificar_texto(objeto))
    return sorted(temas)
