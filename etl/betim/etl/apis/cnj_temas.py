# -*- coding: utf-8 -*-
"""Rubrica de temas para os achados de inspecao do CNJ.

═══ POR QUE DETERMINISTICO, E NAO LLM ═══

A pergunta que este projeto quer responder e' **"o que NAO mudou no TJMG ao
longo dos anos"**. Isso e' uma contagem por tema, ao longo de uma serie de 2012
a 2026 -- e contagem e' exatamente o que nao se delega a modelo. A doutrina da
casa ja esta escrita noutros eixos: o LLM redige prosa sobre fato verificado,
nao decide rotulo que vira numero em tela.

O risco concreto aqui nao e' erro aleatorio, e' **deriva**: um classificador
generativo rodando em 13 documentos de anos diferentes pode rotular o mesmo
achado de dois jeitos conforme o contexto da janela, e o resultado seria uma
"tendencia" que e' artefato do classificador, nao do TJMG. Regra fixa erra
igual em todo ano -- e erro constante nao inventa tendencia.

═══ COMO OS TERMOS FORAM ESCOLHIDOS ═══

Medindo o corpo dos 140 achados do relatorio de 2026, nao por intuicao. As
frequencias que fundamentaram: prazo 227, sistema 120, servidor 61, preso 52,
audiencia 49, acervo 49, eproc 43, custodia 38, pje 35, distribuicao 30,
cartorio 26, violencia domestica 17, infancia 15, morosidade 14.

⚠️ A rubrica de 2026 pode nao servir aos outros anos. `cobertura()` existe para
denunciar isso: se a fracao de achados sem tema subir muito num ano, o rotulo
esta velho para aquele ano -- e o certo e' medir de novo, nao empurrar.
"""
import re
import unicodedata

# Ordem IMPORTA: o primeiro tema que casa vence. Os mais especificos vem antes
# dos genericos, senao "prazo" engole "audiencia de custodia atrasada".
TEMAS = [
    ("pessoa_presa", "Pessoa presa e execução penal", [
        r"cust[oó]dia", r"\bpres[oa]s?\b", r"pres[ií]dio", r"execu[çc][ãa]o penal",
        r"\bseeu\b", r"monitoramento eletr[ôo]nico", r"tornozeleira", r"regime (aberto|fechado|semiaberto)",
        r"carcer[áa]ri", r"priva[çc][ãa]o de liberdade", r"flagrante",
        # ⚠️ "prisões" NAO casa com \bpreso\b -- e' outra palavra. A primeira
        # versao da rubrica perdeu o achado sobre controle nonagesimal (art.
        # 316, PU, do CPP) por isso, e esse e' dos mais graves que existem:
        # trata de gente presa alem do prazo.
        r"pris[õo]es", r"pris[ãa]o", r"controle nonagesimal", r"art\.?\s*316",
        r"preventiva", r"soltura", r"alvar[áa] de soltura",
    ]),
    ("violencia_domestica", "Violência doméstica", [
        r"viol[êe]ncia dom[ée]stica", r"maria da penha", r"medida protetiva",
    ]),
    ("infancia", "Infância e juventude", [
        r"inf[âa]ncia", r"juventude", r"adolescent", r"ato infracional", r"acolhiment",
    ]),
    ("sistema", "Sistema processual e migração", [
        r"\bpje\b", r"\beproc\b", r"\bseeu\b", r"migra[çc][ãa]o", r"sistema eletr[ôo]nico",
        r"instabilidade do sistema", r"\bthemis\b", r"\bsisbajud\b", r"\brenajud\b",
    ]),
    ("prazo_e_acervo", "Prazo, acervo e congestionamento", [
        r"congestionament", r"morosidade", r"processos? represad", r"acervo",
        r"prazo (excessiv|dilatad|alongad)", r"pauta.{0,30}(20\d\d)", r"metas? nacion",
        r"tempo m[ée]dio", r"conclus[ãa]o h[áa] mais de", r"paralisad",
        # Acervo parado em gabinete tem vocabulario proprio, que nao usa
        # "acervo" nem "prazo": sobrestamento, arquivo provisorio, pedido de
        # vista, tema repetitivo. Sem estes, o achado sobre processo que nao
        # anda em 2a instancia ficava sem tema.
        r"sobrestad", r"arquivo provis[óo]ri", r"pedido de vista", r"\birdr\b",
        r"repercuss[ãa]o geral", r"temas? repetitiv", r"redistribui[çc][ãa]o",
        r"dilig[êe]ncia na origem", r"\bbaixa\b", r"julgament(o|os) pendente",
    ]),
    ("pessoal", "Pessoal, lotação e estrutura", [
        r"lota[çc][ãa]o", r"quadro de servidor", r"d[ée]ficit de servidor",
        r"servidor(es)? cedid", r"estagi[áa]ri", r"terceirizad", r"assessor",
    ]),
    ("cartorio", "Gestão de cartório e secretaria", [
        r"cart[óo]rio", r"secretaria da vara", r"chefia de cart[óo]rio",
        r"triagem", r"movimenta[çc][ãa]o processual", r"autua[çc][ãa]o",
        r"central de processamento", r"\bcpe\b", r"secretaria unificada",
    ]),
    ("extrajudicial", "Serventias extrajudiciais", [
        r"serventia", r"extrajudicial", r"delegat[áa]ri", r"notarial", r"tabelionato",
        r"registro de im[óo]veis", r"cart[óo]rio de registro",
    ]),
    ("estatistica", "Estatística e transparência do próprio tribunal", [
        r"estat[íi]stic", r"business intelligence", r"\bb\.?i\.?\b", r"qliksense",
        r"dados? inconsistent", r"aus[êe]ncia de informa[çc][ãa]o",
        r"n[ãa]o (foi|foram) (possível|disponibilizad)",
    ]),
    ("precatorio", "Precatórios", [
        r"precat[óo]ri", r"requisi[çc][ãa]o de pequeno valor", r"\brpv\b",
    ]),
    ("conciliacao", "Conciliação e mediação", [
        r"concilia[çc][ãa]o", r"media[çc][ãa]o", r"cejusc", r"nupemec",
    ]),
    ("colegiado", "Funcionamento do colegiado", [
        r"sess[ãa]o (h[íi]brida|presencial|de julgamento)", r"sess[õo]es h[íi]bridas",
        r"c[âa]mara c[íi]vel", r"c[âa]mara criminal", r"[óo]rg[ãa]o especial",
        r"sustenta[çc][ãa]o oral", r"turma recursal", r"composi[çc][ãa]o do colegiado",
    ]),
    ("pericia_e_apoio", "Perícia e órgãos de apoio fora do tribunal", [
        r"laudo(s)? pericia", r"per[íi]cia", r"insanidade mental", r"\biml\b",
        r"pol[íi]cia civil", r"pol[íi]cia penal", r"minist[ée]rio p[úu]blico",
        r"defensoria", r"inqu[ée]rito policial",
    ]),
]

_COMPILADOS = [(chave, rotulo, [re.compile(p, re.I) for p in pads])
               for chave, rotulo, pads in TEMAS]

ROTULOS = {chave: rotulo for chave, rotulo, _ in TEMAS}


def _normalizar(texto):
    """Tira acento SO' para a busca, nunca para o texto publicado.

    O PDF mistura grafias ("custodia" e "custódia" aparecem os dois), entao a
    busca roda nas duas formas: com acento (os padroes ja toleram) e sem.
    """
    return unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()


def temas_de(texto):
    """Todos os temas que casam, em ordem de especificidade.

    Devolve LISTA, nao rotulo unico: um achado sobre audiencia de custodia
    atrasada e' legitimamente `pessoa_presa` E `prazo_e_acervo`. Forcar um
    rotulo so' faria a contagem por tema mentir por escolha arbitraria.
    """
    sem = _normalizar(texto)
    achados = []
    for chave, _rotulo, pads in _COMPILADOS:
        if any(p.search(texto) or p.search(sem) for p in pads):
            achados.append(chave)
    return achados


def cobertura(registros):
    """Fracao de achados que a rubrica NAO rotulou, por ano.

    ⚠️ Esta funcao existe para a rubrica poder ser considerada ERRADA. Ela foi
    medida contra o relatorio de 2026; se num ano antigo a fracao sem tema for
    muito maior, o vocabulario daquele ano e' outro, e comparar as series seria
    comparar a rubrica consigo mesma. Nesse caso: medir os termos daquele ano e
    estender a rubrica -- nunca publicar a serie como se fosse comparavel.
    """
    por_ano = {}
    for r in registros:
        ano = r.get("ano")
        d = por_ano.setdefault(ano, {"total": 0, "sem_tema": 0})
        d["total"] += 1
        if not r.get("temas"):
            d["sem_tema"] += 1
    for d in por_ano.values():
        d["fracaoSemTema"] = round(d["sem_tema"] / d["total"], 3) if d["total"] else None
    return por_ano
