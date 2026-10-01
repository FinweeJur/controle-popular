"""Gera apps/web/lib/memoria/calendario.ts das duas fontes do dev.

Fontes e autoria (correções do dev em 29/09/2026):
- "Aos que virão — Calendário Insurgente": de GUSTAVO SEFERIAN e, em 6
  posts, de CARLA BENITEZ MARTINS; a data da citação é a DATA DO POST
  (a URL do WordPress traz /AAAA/MM/DD/).
- "Calendário Histórico dos Trabalhadores e Trabalhadoras": do MST, 2009
  (organização de Ângelo Diogo Mazin, Janaina Strozake e Miguel Enrique
  Almeida Stádile), documento local sem URL.

REGRA DO DEV: fato sem dia ou sem ano NÃO se perde. O que tem dia/mês
entra no dia (com ou sem ano); o que não tem data nenhuma vira "recheio"
e preenche, de forma determinística (semente sha1 do próprio texto), os
dias do ano que ficaram sem fato.

CORREÇÃO DE RESUMO (regra do dev, 30/09/2026):
- Antes: 158 posts do blog nasceram sem resumo (a listagem não traz o
  corpo) e o MST cortava no primeiro ". " - só 83 de 538 entradas tinham
  resumo, e esses eram frases soltas cortadas.
- Agora: o resumo vem do TEXTO-FONTE, no estilo de escrita da própria
  fonte (1-2 frases, cap 400). O blog usa o corpo coletado por
  `coleta-corpo-calendario.py` (TEMP/blog-corpos.json); o MST e o
  recheio usam o parágrafo do documento e, quando ele não alcança
  duas frases, as linhas vizinhas (cortadas em cabeçalho de outro
  verbete, em referência "Inter" e em bibliografia pelo extrator).
  Frase que passa de 200 chars corta na fronteira de palavra e o
  resto lê-se contínuo com o título.
- 15 de 533 ficam sem resumo de propósito: 4 posts são só imagem
  (sem legenda) e 11 são frases únicas fechadas - o título JÁ é a
  frase inteira da fonte; inventar contexto é proibido (AGENTS §7).
- `fonteCurta` é gravado por entrada para o doc de revisão e para o
  formato de citação curta pedido pelo dev (regra do dev, 30/09/2026):
  (Obra, Autor, Data) — autor é a FONTE, não a pessoa:
  "Calendário Histórico dos Trabalhadores, MST, 2009" e
  "Calendário Insurgente, Blog Aos que Virão, 2020". O dev explicou:
  "Blog Aos que Virão melhor que Seferian ou Benitez".

SEM FRASE REPETIDA E OS QUATRO ELEMENTOS (regra do dev, 30/09/2026):
- O dev apontou "umas frases que parecem repetidas": o mesmo parágrafo
  do documento do MST alimenta dois dias vizinhos e a mesma frase
  aparecia no resumo dos dois. Agora cada resumo é ESCOLHIDO entre
  candidatos do próprio texto-fonte: candidato que repete frase de 60+
  caracteres já usada por outro verbete é descartado. Se todos repetem
  (mesmo parágrafo, verbete duplicado no documento), o melhor é usado
  mesmo assim e a contagem sai no fim (`repeticoes_forcadas`) — inventar
  texto para fugir da repetição é proibido (AGENTS §7).
- Candidato é pontuado pelos 4 elementos exigidos pelo dev: QUEM
  (pessoa ou movimento), O QUÊ (fato/luta), QUANDO (data/ano/período) e
  ONDE (cidade/estado/país/continente). Vai para a tela o candidato com
  MAIS elementos; empate fica com o mais próximo do título. A detecção é
  heurística (gazetteiros dos 5.571 municípios do IBGE + 27 estados +
  siglas + países versionados no repo; lista de verbos/fatos) e a
  cobertura medida antes x depois vai para o doc de revisão e para
  TEMP/estatisticas-resumos.json — a medição é honesta, não garantia.
- `gera-doc-resumos-mistica-docx.py` gera o .docx pedido pelo dev com
  SÓ o que o leitor vê na tela: ano + título, resumo e fonte.

UM VERBETE POR ASSUNTO NO DIA (regra do dono, 30/09/2026):
- Fatos do MESMO assunto no mesmo dia viram UM verbete só (ex.: 01-01
  tinha 4 recortes da Revolução Cubana; agora é 1). O agrupamento mora
  em `assuntos-mistica.json` — curadoria revisada a partir da proposta
  do modelo local (Ollama) e da regra determinística de entidades raras;
  a chave é a assinatura normalizada do título (40 primeiros caracteres),
  estável enquanto a origem da entrada não mudar.
- No máximo 2 parágrafos por história: o resumo mesclado junta os
  recortes da fonte em até 2 parágrafos, sem ficar longo.
- Não repetir a data: o título/ano aparece uma vez (ver `mostrarAnoSelo`
  em mistica.ts) e o resumo mesclado descarta o recorte que só repete o
  título.
- Fonte citada DIRETO: sem rótulo "Fonte:" e sem nota de "fato sem data"
  na tela (a tag `semData` continua no dado, mas não vira legenda).

SEM CORTE NO MEIO (regra do dono, 30/09/2026):
- Título que passa do teto para no fim de uma frase; se a frase for
  longa, para na última vírgula; nunca corta palavra/frase no meio
  (era o "...nacionalização do comér"/"sufrágio" truncado na home).
- Marcadores "Inter N" do documento do MST (conteúdo intercalado) são
  removidos do título e do resumo antes de publicar.

O script não inventa nada: data, título, autor e link vêm dos arquivos;
o resumo é recorte do texto da fonte.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

# Métricas e seleção de resumo (gazetteiros dos 4 elementos,
# anti-repetição, mede) moram num módulo importável para o doc de
# revisão medir com o MESMO código — ver metricas_resumo.py.
from metricas_resumo import (
    CAP_RESUMO, SENTENCA, corta_paragrafos, elementos, escolhe, mede,
    sem_acento,
)

TEMP = Path(r"C:\Users\teste\AppData\Local\Temp\opencode")
DESTINO = Path(r"X:\DevCoder\OpenCode\controle-popular\apps\web\lib\memoria\calendario.ts")

MESES = {
    "janeiro": 1, "fevereiro": 2, "março": 3, "marco": 3, "abril": 4,
    "maio": 5, "junho": 6, "julho": 7, "agosto": 8, "setembro": 9,
    "outubro": 10, "novembro": 11, "dezembro": 12,
}
MES_ABNT = ["jan.", "fev.", "mar.", "abr.", "maio", "jun.", "jul.", "ago.",
            "set.", "out.", "nov.", "dez."]
# autor ABNT (proveniência do post) por usuário do blog; a citação CURTA
# usa o nome do blog em vez da pessoa (regra do dev, 30/09/2026)
AUTORES_BLOG = {
    "gustavoseferian": "SEFERIAN, Gustavo",
    "carlabenitezmartins": "BENITEZ MARTINS, Carla",
}
AUTOR_PADRAO_BLOG = "SEFERIAN, Gustavo"  # posts sem autor no JSON
ORGAO_BLOG = "Aos que virão — Calendário Insurgente"
AUTOR_MST = "MST — MOVIMENTO DOS TRABALHADORES RURAIS SEM TERRA"
ORGAO_MST = ("Calendário Histórico dos Trabalhadores e Trabalhadoras "
             "(org. Ângelo Diogo Mazin, Janaina Strozake e Miguel Enrique Almeida Stádile)")
DATA_MST = "2009"
FONTE_CURTA_MST = "Calendário Histórico das Trabalhadoras/es, MST, 2009"


_PONTO_FINAL = re.compile(r"[.!?]")
# Teto do pedaço emendado: a linha seguinte do .txt costuma ser curta
# ("A Grande Marcha", "Campanha da Legalidade"); o teto evita arrastar
# parágrafo inteiro quando a emenda é longa.
_TETO_EMENDA = 120


def completa_frase(frase: str, continuacoes: list[str]) -> str:
    """Fecha a frase que o .txt do MST cortou na virada de linha.

    O documento do MST vira .txt com quebra dura a cada ~200 caracteres, e
    a sentença continua na linha de baixo ("... ficou conhecido como" /
    "A Grande Marcha"). O extrator lê uma linha só, então a frase (e o
    título) saía cortada no meio da ideia. Aqui a frase sem pontuação
    final é emendada no começo da linha seguinte até fechar (ou no teto).
    Não inventa: só costura o que a própria fonte já dizia na linha
    seguinte.
    """
    frase = (frase or "").strip()
    if not frase or frase[-1] in ".!?":
        return frase
    for c in continuacoes:
        c = (c or "").strip()
        if not c:
            continue
        m = _PONTO_FINAL.search(c)
        trecho = c[: m.start() + 1].strip() if m else c
        if len(trecho) > _TETO_EMENDA:
            corte = trecho.rfind(" ", 0, _TETO_EMENDA)
            trecho = trecho[:corte].strip() if corte > 60 else trecho
        return f"{frase} {trecho}".strip()
    return frase


def titulo_e_resto(frase: str) -> tuple[str, str]:
    """Título e o resto, sem cortar no meio (regra do dono, 30/09).

    A frase chega já EMENDADA (ver `completa_frase`). O título é a frase
    inteira; quando ela passa do teto de 280 caracteres, para no fim de
    uma frase anterior, ou na última vírgula, ou no último espaço —
    sempre em fronteira, nunca no meio de palavra ou de oração. O que
    sobra vira candidato a resumo, então título + resumo leem contínuo.
    """
    frase = frase.strip()
    if not frase:
        return "", ""
    if len(frase) <= 280:
        return frase, ""
    bruto = frase[:280]
    fim = max(bruto.rfind(". "), bruto.rfind("! "), bruto.rfind("? "))
    if fim >= 120:
        return frase[:fim + 1].strip(), frase[fim + 1:].strip()
    virgula = bruto.rfind(", ")
    if virgula >= 120:
        return frase[:virgula].strip(), frase[virgula + 1:].strip()
    espaco = bruto.rfind(" ")
    return frase[:espaco].strip(), frase[espaco + 1:].strip()


# Marcadores "Inter N" (conteúdo intercalado do documento do MST): no
# começo, "Inter 2 1997: Morte..." vira "1997: Morte..."; no meio, o
# marcador solto é removido. Não há outra palavra "Inter" no acervo.
_INTER_LEAD = re.compile(r"^\s*Inter\s*\d*\s*[ºo°]?\s*:?\s*", re.I)
_INTER_MID = re.compile(r"\bInter\s*\d+\s*:?\s*", re.I)


def limpa_inter(texto: str) -> str:
    """Tira os marcadores 'Inter N' do título ou do resumo."""
    return _INTER_MID.sub("", _INTER_LEAD.sub("", texto)).strip()


def assinatura(titulo: str) -> str:
    """Chave estável de uma entrada na curadoria de assuntos do dia.

    São os 40 primeiros caracteres normalizados (minúsculos e sem
    acento) do título. O corte de título mudou o FIM dele, não o
    começo, então a chave sobrevive à troca da regra de corte.
    """
    return sem_acento(titulo)[:40]


def _ano_do_grupo(membros: list[dict]) -> str:
    """Ano do verbete mesclado: o mais comum entre os não-vazios.

    Empate e grupos sem ano caem no primeiro não-vazio; sem nenhum ano,
    fica vazio (a fonte não datou — não se inventa data).
    """
    contagem: dict[str, int] = {}
    for m in membros:
        if m["ano"]:
            contagem[m["ano"]] = contagem.get(m["ano"], 0) + 1
    if not contagem:
        return ""
    return max(contagem, key=lambda a: (contagem[a], -int(a)))


def _titulo_do_grupo(membros: list[dict]) -> str:
    """Título do verbete mesclado: o mais informativo dos membros.

    Prefere título que NÃO seja marcador de intercalado e que traga mais
    dos 4 elementos (quem, o quê, quando, onde). Empate fica com o
    primeiro na ordem da fonte. Não reescreve nada: escolhe entre os
    títulos já recortados da fonte.
    """
    def peso(m: dict) -> tuple:
        inter = 1 if re.match(r"^\s*inter\b", m["titulo"], re.I) else 0
        el = sum(elementos(f"{m['titulo']} {m.get('resumo', '')}").values())
        return (inter, -el)

    return min(membros, key=peso)["titulo"]


def _resumo_do_grupo(membros: list[dict], titulo: str) -> str:
    """Resumo mesclado: até 2 parágrafos, sem repetir o título.

    Junta os recortes distintos da fonte, na ordem dos membros, em
    parágrafos de no máximo `CAP_RESUMO` caracteres; para no segundo
    parágrafo. Recorte que começa repetindo o título do grupo é
    descartado (regra do dono: não repetir a data/história). Nenhuma
    frase é criada ou reescrita.
    """
    base_titulo = sem_acento(titulo)[:40]
    vistos: set[str] = set()
    recortes: list[str] = []
    for m in membros:
        r = (m.get("resumo") or "").strip()
        if not r:
            continue
        if sem_acento(r)[:40] == base_titulo:
            continue
        chave = sem_acento(r)
        if chave in vistos:
            continue
        vistos.add(chave)
        recortes.append(r)

    paragrafos: list[str] = []
    atual = ""
    for r in recortes:
        if not atual:
            atual = r
        elif len(atual) + 1 + len(r) <= CAP_RESUMO:
            atual = f"{atual} {r}"
        else:
            paragrafos.append(atual)
            atual = r
        if len(paragrafos) == 1 and len(atual) > CAP_RESUMO:
            break
    if atual:
        paragrafos.append(atual)
    return "\n\n".join(paragrafos[:2])


def mescla_grupo(membros: list[dict]) -> dict:
    """Um verbete a partir dos membros do mesmo assunto no mesmo dia.

    Fonte: o primeiro membro com link; sem link, o primeiro. O tipo de
    luta é a união. A ordem dos membros é a da fonte, preservada na
    entrada.
    """
    titulo = _titulo_do_grupo(membros)
    base = next((m for m in membros if m.get("url")), membros[0])
    tipos: list[str] = []
    for m in membros:
        for t in m["tipo"]:
            if t not in tipos:
                tipos.append(t)
    return {
        "diaMes": membros[0]["diaMes"],
        "ano": _ano_do_grupo(membros),
        "titulo": titulo,
        "resumo": _resumo_do_grupo(membros, titulo),
        "tipo": tipos,
        "autor": base["autor"],
        "orgao": base["orgao"],
        "fonteData": base["fonteData"],
        "url": base.get("url", ""),
        "semData": all(m["semData"] for m in membros),
        "fonteCurta": base["fonteCurta"],
    }


def aplica_assuntos(entradas: list[dict], mapa: dict) -> list[dict]:
    """Funde, por dia, os grupos curados em `assuntos-mistica.json`.

    Cada grupo é uma lista de assinaturas (40 primeiros caracteres do
    título normalizado). A entrada mesclada ocupa a posição do primeiro
    membro; os demais saem. Assinatura ausente no dia não casa nada —
    a curadoria é conferida depois por `--conferir-assuntos`.
    """
    por_dia: dict[str, list[dict]] = {}
    for e in entradas:
        por_dia.setdefault(e["diaMes"], []).append(e)

    saida: list[dict] = []
    for e in entradas:
        sig = assinatura(e["titulo"])
        grupo = None
        for g in mapa.get(e["diaMes"], []):
            if sig in g:
                grupo = g
                break
        if not grupo:
            saida.append(e)
            continue
        membros = [x for x in por_dia[e["diaMes"]] if assinatura(x["titulo"]) in grupo]
        # só mescla na passagem pelo membro de MENOR índice (o primeiro)
        if not membros or membros[0] is not e:
            continue
        if len(membros) < len(grupo):
            print(f"AVISO: grupo {e['diaMes']} com assinatura sem par ({len(membros)}/{len(grupo)})")
        saida.append(mescla_grupo(membros) if len(membros) > 1 else e)
    return saida


def classificar(texto: str) -> list[str]:
    t = sem_acento(texto)
    tipos = []
    if re.search(r"revolta|insurrei|levante|rebeli|motim|conjura|inconfiden", t):
        tipos.append("revolta")
    if re.search(r"quilomb|escrav|abolic|negro|palmares|zumbi|males", t):
        tipos.append("quilombo")
    if re.search(r"indigen|indio|povos origin|guarani|yanomami|funai|aldeia", t):
        tipos.append("indigena")
    if re.search(r"greve|operari|sindic|trabalhador|proletari|fabrica|metalurgic", t):
        tipos.append("greve")
    if re.search(r"sem-terra|posseir|campesin|latifundio|agraria|ligas camponesas|assentament|reforma agraria", t):
        tipos.append("campo")
    if re.search(r"anistia|ditadura|tortura|presos polit|guerrilha|ai-5|censura|golpe", t):
        tipos.append("anistia")
    if re.search(r"mulher|femin|lgbt|racis|direitos humanos|direito|voto|sufragio", t):
        tipos.append("direitos")
    if not tipos:
        tipos.append("resistencia")
    return tipos


def escapa(s: str) -> str:
    """Escapa para string TS. Preserva o parágrafo duplo do resumo.

    O resumo mesclado usa `\\n\\n` para separar os dois parágrafos (o
    componente renderiza um <p> por parágrafo). Nova linha simples vira
    espaço, como antes.
    """
    s = s.replace("\\", "\\\\").replace('"', '\\"')
    s = re.sub(r"\n{2,}", r"\\n\\n", s)
    return (s.replace("\n", " ").replace("\t", " ").replace("\r", " "))


def limpa(texto: str) -> str:
    f = re.sub(r"^[^A-Za-zÀ-ÿ0-9\"“]+", "", re.sub(r"\s{2,}", " ", texto)).strip()
    f = re.sub(r"\s*(WW-|Absatz|Standard)[^\s]*.*$", "", f).strip()
    f = re.sub(r"^[A-Za-zÀ-ÿ]\s+(?=[A-ZÀ-Ý])", "", f)
    if f and f[0].islower() and not f[0].isdigit():
        f = f[0].upper() + f[1:]
    return f


def data_do_post(url: str) -> str:
    m = re.search(r"/(\d{4})/(\d{2})/(\d{2})/", url)
    if not m:
        return "2020"
    ano, mes, dia = int(m.group(1)), int(m.group(2)), int(m.group(3))
    return f"{dia} {MES_ABNT[mes - 1]} {ano}"


def _regiao(texto: str, titulo: str) -> list[str]:
    """Frases da região de recorte, na ordem do texto-fonte.

    Ordem das candidatas (herdada do resumo original):
    - titulo nao casou (corpo do blog): o texto inteiro, do começo;
    - titulo e a ULTIMA frase do paragrafo (comum no MST: "Faleceu em
      ..."): as frases ANTERIORES viram contexto - nada existia depois;
    - caso normal: as frases seguintes continuam o texto.
    """
    partes = [p.strip() for p in SENTENCA.split(texto) if p.strip()]
    if not partes:
        return []
    base = sem_acento(titulo)[:50]
    achou = next((i for i, p in enumerate(partes) if sem_acento(p)[:50] == base), None)
    if achou is None:
        return partes
    if achou == len(partes) - 1 and achou > 0:
        return partes[max(0, achou - 2):achou]
    return partes[achou + 1:]


def _guloso(regiao: list[str]) -> str:
    """O recorte original: 1-2 frases, cap 400, nunca cortado no meio.

    Frase unica gigante corta na pontuacao antes do cap (nunca no meio
    da palavra); paragrafo de uma frase so nao tem o que resumir e o
    resumo fica vazio, honesto.
    """
    saida = ""
    for p in regiao:
        if len(p) < 30:  # legenda, assinatura ou meia frase
            continue
        if not saida and len(p) > CAP_RESUMO:
            # frase unica gigante: corta na pontuacao/ultima palavra antes
            # do cap — nunca devolve 800 chars para a tela (regra do dev:
            # cada historia cabe em 2 paragrafos, sem ocupar a tela inteira)
            return corta_paragrafos(p, max_frases=1)
        if saida and len(saida) + 1 + len(p) > CAP_RESUMO:
            break
        saida = f"{saida} {p}".strip() if saida else p
        if len([x for x in SENTENCA.split(saida) if x.strip()]) >= 2:
            break
    return saida


def candidatas_de(texto: str, titulo: str) -> list[str]:
    """Recortes do próprio texto, do preferido para os alternativos.

    O primeiro é o recorte original (1-2 frases perto do título). Os
    seguintes são janelas de 1 e 2 frases da mesma região: servem para o
    ESCOLHER entre eles quando o preferido repete frase já usada ou
    entrega menos elementos (regra do dev, 30/09/2026). Nenhum candidato
    é reescrito — todos saem da fonte.
    """
    regiao = _regiao(texto, titulo)
    saida: list[str] = []
    pref = _guloso(regiao)
    if pref:
        saida.append(pref)
    util = [p for p in regiao if len(p) >= 30]
    for i, p in enumerate(util):
        # janelas de 1, 2, 3... frases do ponto i até passar do cap —
        # quanto maior o leque, maior a chance de achar um recorte com
        # os 4 elementos sem repetir frase de outro verbete
        if len(p) <= CAP_RESUMO:
            saida.append(p)
        acumulado = p
        for q in util[i + 1:]:
            if len(acumulado) + 1 + len(q) > CAP_RESUMO:
                break
            acumulado = f"{acumulado} {q}"
            saida.append(acumulado)
    unicas: list[str] = []
    vistas: set[str] = set()
    for c in saida:
        if c and c not in vistas:
            vistas.add(c)
            unicas.append(c)
    return unicas[:40]


def fonte_curta_blog(fonte_data: str) -> str:
    """(Obra, Autor, Data): autor é o blog, nunca a pessoa (dev, 30/09)."""
    ano = re.search(r"\d{4}", fonte_data)
    return f"Calendário Insurgente, Blog Aos que Virão, {ano.group(0) if ano else fonte_data}"


entradas: list[dict] = []
vistos: set[str] = set()
# estado da seleção anti-repetição + séries para a medição antes x depois
usadas: set[str] = set()          # frases de 60+ já consumidas
vistos_resumos: set[str] = set()  # resumos idênticos já consumidos
bases: list[str] = []             # série "antes": recorte original
escolhidos: list[str] = []        # série "depois": recorte escolhido
forcadas = 0                      # repetição impossível de evitar

# --- blog (corpo coletado vira resumo; autor por post) -------------------
corpos: dict[str, str] = {}
caminho_corpos = TEMP / "blog-corpos.json"
if caminho_corpos.exists():
    corpos = json.loads(caminho_corpos.read_text(encoding="utf-8"))

for post in json.loads((TEMP / "blog-calendario.json").read_text(encoding="utf-8-sig")):
    titulo = re.sub(r"\s+", " ", post["titulo"]).strip()
    m = re.match(r"^(\d{1,2})\s*[ºo°]?\s*de\s+([A-Za-zÀ-ÿ]+)\s+de\s+(\d{3,4})\s*[-–—:]\s*(.+)$", titulo)
    if not m:
        continue
    dia, mes_nome, ano, fato = m.groups()
    mes = MESES.get(sem_acento(mes_nome))
    if not mes or not 1 <= int(dia) <= 31:
        continue
    fato = fato.strip().rstrip(".").strip()
    if len(fato) < 6:
        continue
    abnt = AUTORES_BLOG.get(post.get("autor", ""), AUTOR_PADRAO_BLOG)
    fonte_data = data_do_post(post["url"])
    chave = f"{mes:02d}-{int(dia):02d}|{sem_acento(fato)[:55]}"
    if chave in vistos:
        continue
    vistos.add(chave)
    corpo = corpos.get(post["url"], "")
    cands = []
    if corpo:
        cands = candidatas_de(corpo, fato) + candidatas_de(corpo, "")
    resumo, forcado = escolhe(cands, usadas, vistos_resumos, fato)
    resumo = corta_paragrafos(resumo)
    bases.append(next((c for c in cands if c), ""))
    escolhidos.append(resumo)
    forcadas += 1 if forcado else 0
    entradas.append({
        "diaMes": f"{mes:02d}-{int(dia):02d}",
        "ano": ano,
        "titulo": titulo_e_resto(fato[0].upper() + fato[1:])[0],
        "resumo": resumo,
        "tipo": classificar(fato),
        "autor": abnt,
        "orgao": ORGAO_BLOG,
        "fonteData": fonte_data,
        "url": post["url"],
        "semData": False,
        "fonteCurta": fonte_curta_blog(fonte_data),
    })

# --- MST (mantém fato sem ano; o dia/mês já veio da âncora) -------------
for e in json.loads((TEMP / "calendario-trabalhadores.json").read_text(encoding="utf-8")):
    paragrafo = limpa(e["paragrafo"])
    vizinho = e.get("vizinho", "")
    frase = limpa(e.get("frase") or paragrafo[:200])
    # o .txt quebra linha no meio: fecha a frase com a linha seguinte
    frase = completa_frase(frase, [e.get("proxima", ""), vizinho, paragrafo])
    if len(frase) < 25:
        continue
    titulo, resto = titulo_e_resto(frase)
    chave = f"{e['diaMes']}|{sem_acento(titulo)[:55]}"
    if chave in vistos:
        continue
    vistos.add(chave)
    # cadeia de texto-fonte: contexto do paragrafo -> resto da frase
    # longa -> linhas seguintes (o extrator ja corta em cabecalho de
    # outro verbete, referencia "Inter" e bibliografia) -> paragrafo
    # inteiro -> texto do verbete vizinho (emergencia, por ultimo)
    cands = (
        candidatas_de(paragrafo, titulo)
        + candidatas_de(resto, "")
        + candidatas_de(vizinho, "")
        + candidatas_de(paragrafo, "")
    )
    resumo, forcado = escolhe(cands, usadas, vistos_resumos, titulo)
    resumo = limpa_inter(corta_paragrafos(resumo))
    bases.append(next((c for c in cands if c), ""))
    escolhidos.append(resumo)
    forcadas += 1 if forcado else 0
    entradas.append({
        "diaMes": e["diaMes"],
        "ano": e["ano"] or "",
        "titulo": titulo,
        "resumo": resumo,
        "tipo": classificar(paragrafo),
        "autor": AUTOR_MST,
        "orgao": ORGAO_MST,
        "fonteData": DATA_MST,
        "url": "",
        "semData": False,
        "fonteCurta": FONTE_CURTA_MST,
    })

# --- recheio: fatos sem data preenchem os dias vazios -------------------
cobertos = {e["diaMes"] for e in entradas}
todos_os_dias = [
    f"{m:02d}-{d:02d}"
    for m in range(1, 13)
    for d in range(1, ([31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]) + 1)
]
vazios = [d for d in todos_os_dias if d not in cobertos]
recheio = json.loads((TEMP / "calendario-trabalhadores-recheio.json").read_text(encoding="utf-8"))
# ordem determinística: sha1 do próprio texto — rodar de novo dá o mesmo quadro
recheio.sort(key=lambda r: hashlib.sha1(r["paragrafo"].encode("utf-8")).hexdigest())
usados = 0
indice = 0
for dia in vazios:
    # recheio curto é descartado SEM consumir o dia (senão o dia fica vazio)
    while indice < len(recheio) and len(limpa(recheio[indice]["paragrafo"])) < 40:
        indice += 1
    if indice >= len(recheio):
        break
    item = recheio[indice]
    paragrafo = limpa(item["paragrafo"])
    indice += 1
    vizinho = item.get("vizinho", "")
    primeira = SENTENCA.split(paragrafo)[0]
    titulo, resto = titulo_e_resto(
        completa_frase(primeira, [item.get("proxima", ""), vizinho, paragrafo])
    )
    cands = (
        candidatas_de(paragrafo, titulo)
        + candidatas_de(resto, "")
        + candidatas_de(vizinho, "")
        + candidatas_de(paragrafo, "")
    )
    resumo, forcado = escolhe(cands, usadas, vistos_resumos, titulo)
    resumo = limpa_inter(corta_paragrafos(resumo))
    bases.append(next((c for c in cands if c), ""))
    escolhidos.append(resumo)
    forcadas += 1 if forcado else 0
    entradas.append({
        "diaMes": dia,
        "ano": "",
        "titulo": titulo,
        "resumo": resumo,
        "tipo": classificar(paragrafo),
        "autor": AUTOR_MST,
        "orgao": ORGAO_MST,
        "fonteData": DATA_MST,
        "url": "",
        "semData": True,
        "fonteCurta": FONTE_CURTA_MST,
    })
    usados += 1

# --- um verbete por assunto no dia (curadoria) --------------------------
# A curadoria (assuntos-mistica.json) foi revisada a partir da proposta
# do modelo local (Ollama) e da regra determinística de entidades raras;
# a decisão final é humana e versionada. Ver o cabeçalho do módulo.
caminho_mapa = Path(__file__).with_name("assuntos-mistica.json")
MAPA_ASSUNTOS: dict = {}
if caminho_mapa.exists():
    MAPA_ASSUNTOS = json.loads(caminho_mapa.read_text(encoding="utf-8"))
antes_merges = len(entradas)
# a série "sem_selecao" (recorte greedy) é medida ANTES da fusão, sobre
# o mesmo conjunto de recortes; a série "depois" é a final, já mesclada.
pares_sem_selecao = [(t, b) for t, b in
                     zip([e["titulo"] for e in entradas], bases) if b]
entradas = aplica_assuntos(entradas, MAPA_ASSUNTOS)
# marcadores "Inter N" do MST saem DEPOIS da fusão (a assinatura da
# curadoria foi montada com o título cru; limpar antes quebraria o par).
for e in entradas:
    e["titulo"] = limpa_inter(e["titulo"])
pares_final = [(e["titulo"], e.get("resumo", "")) for e in entradas]

# medição (repetições e os 4 elementos) para o doc de revisão e para o
# relatório do dev. Os títulos acompanham bases/escolhidos na ORDEM DE
# INSERÇÃO, por isso a medição roda ANTES do sort.
stats = {
    "entradas": len(entradas),
    "entradas_antes_merges": antes_merges,
    "com_resumo": sum(1 for e in entradas if e["resumo"]),
    "sem_resumo": sum(1 for e in entradas if not e["resumo"]),
    "repeticoes_forcadas": forcadas,
    "sem_selecao": mede(pares_sem_selecao),
    "depois": mede(pares_final),
}
(TEMP / "estatisticas-resumos.json").write_text(
    json.dumps(stats, ensure_ascii=False, indent=1), encoding="utf-8"
)

entradas.sort(key=lambda x: (x["diaMes"], x["ano"] or "9999"))

linhas = [
    "/**",
    ' * Calendário de lutas populares, resistências e revoltas — base da',
    ' * "Mística do Dia" da home (`app/components/MisticaDoDia.tsx`).',
    " *",
    " * ORIGEM DOS DADOS (as duas fontes pedidas pelo dev em 29/09/2026):",
    " * 1. Aos que virão — Calendário Insurgente, de Gustavo Seferian e",
    " *    Carla Benitez Martins; a data da citação é a data do post (2020).",
    " *    https://aosquevirao.home.blog/category/calendario-insurgente/",
    " * 2. Calendário Histórico dos Trabalhadores e Trabalhadoras, do MST,",
    " *    2009 (org. Ângelo Diogo Mazin, Janaina Strozake e Miguel Enrique",
    " *    Almeida Stádile), documento local do acervo do dev, sem URL.",
    " *",
    " * GERADO POR SCRIPT (`gera-calendario-insurgente.py`), nunca à mão: são",
    " * centenas de datas e transcrever abriria a porta a erro de data e de",
    " * fonte. O script limpa ruído, classifica o tipo de luta e guarda a",
    " * fonte.",
    " *",
    " * REGRA DO DEV: fato sem dia ou sem ano NÃO se perde. O que tem dia",
    " * entra no dia (com ou sem ano, campo `ano` vazio quando a fonte não",
    " * datou); o que não tem data nenhuma vira `semData: true` e preenche,",
    " * de forma determinística, um dia do ano que ficou sem fato.",
    " *",
    " * RESUMO VEM DO TEXTO-FONTE (regra do dev, 30/09/2026): 1-2 frases",
    " * no estilo de escrita da própria fonte, cap 400 — blog usa o corpo",
    " * coletado por `coleta-corpo-calendario.py`; MST e recheio usam o",
    " * parágrafo do documento. Nunca resumo reescrito por máquina.",
    " *",
    " * UM VERBETE POR ASSUNTO NO DIA (regra do dev, 30/09/2026): fatos do",
    " * mesmo assunto no mesmo dia viram um só (curadoria versionada em",
    " * `scripts/memoria/assuntos-mistica.json`); o resumo mesclado cabe em",
    " * até 2 parágrafos (separados por linha em branco) e nada é cortado",
    " * no meio de palavra ou frase.",
    " *",
    " * FORMATO COMPACTO: a fonte entra por referência (autor, orgao,",
    " * fonteData, url). A citação ABNT completa é montada em runtime por",
    " * `referenciaAbnt()` e a curta por `fonteCurta()` em `mistica.ts`.",
    " */",
    "",
    'import type { EntradaCalendario } from "./tipos";',
    "",
    "export const CALENDARIO_LUTAS: EntradaCalendario[] = [",
]
for e in entradas:
    linhas.append("  {")
    linhas.append(f'    diaMes: "{e["diaMes"]}",')
    linhas.append(f'    ano: "{escapa(e["ano"])}",')
    linhas.append(f'    titulo: "{escapa(e["titulo"])}",')
    if e["resumo"]:
        linhas.append(f'    resumo: "{escapa(e["resumo"])}",')
    tipos_ts = ", ".join('"' + t + '"' for t in e["tipo"])
    linhas.append(f"    tipo: [{tipos_ts}],")
    linhas.append(f'    autor: "{escapa(e["autor"])}",')
    linhas.append(f'    orgao: "{escapa(e["orgao"])}",')
    linhas.append(f'    fonteData: "{escapa(e["fonteData"])}",')
    if e["url"]:
        linhas.append(f'    url: "{escapa(e["url"])}",')
    linhas.append(f'    fonteCurta: "{escapa(e["fonteCurta"])}",')
    if e["semData"]:
        linhas.append("    semData: true,")
    linhas.append("  },")
linhas.append("];")
linhas.append("")

# --para-revisao: grava só em TEMP (doc antes x depois antes de aplicar)
alvo = DESTINO
if "--para-revisao" in sys.argv:
    alvo = TEMP / "calendario.novo.ts"
alvo.write_text("\n".join(linhas), encoding="utf-8")

# JSON estruturado para o doc de revisão e para conferência
(TEMP / "calendario.novo.json").write_text(
    json.dumps(entradas, ensure_ascii=False, indent=1), encoding="utf-8"
)

com_link = sum(1 for e in entradas if e["url"])
dias = {e["diaMes"] for e in entradas}
com_resumo = sum(1 for e in entradas if e["resumo"])
print(f"entradas: {len(entradas)} | com link: {com_link} | com resumo: {com_resumo} | "
      f"dias cobertos: {len(dias)}/{len(todos_os_dias)} | recheio usado: {usados}")
print(f"assuntos: {antes_merges} recortes -> {len(entradas)} verbetes "
      f"({antes_merges - len(entradas)} recortes fundidos)")
print(f"sem ano (mantidos): {sum(1 for e in entradas if not e['ano'])} | "
      f"semData: {sum(1 for e in entradas if e['semData'])} | "
      f"sem corpo no blog: {sum(1 for e in entradas if e['orgao'] == ORGAO_BLOG and not e['resumo'])}")
print(f"arquivo: {alvo} | {alvo.stat().st_size // 1024} KB | {len(linhas)} linhas")

s, d = stats["sem_selecao"], stats["depois"]
cs, cd = s["cobertura"], d["cobertura"]
cts, ctd = s["cobertura_com_titulo"], d["cobertura_com_titulo"]
print(f"frases repetidas: {s['frases_repetidas']} -> {d['frases_repetidas']} | "
      f"resumos identicos: {s['resumos_identicos']} -> {d['resumos_identicos']} | "
      f"titulo repetido: {s['titulo_repetido']} -> {d['titulo_repetido']} | "
      f"forcadas: {forcadas}")
print(f"4 elementos so resumo: {cs['todos']}/{s['com_resumo']} -> {cd['todos']}/{d['com_resumo']} | "
      f"quem {cs['quem']}->{cd['quem']} | oque {cs['oque']}->{cd['oque']} | "
      f"quando {cs['quando']}->{cd['quando']} | onde {cs['onde']}->{cd['onde']}")
print(f"4 elementos titulo+resumo: {cts['todos']}/{s['com_resumo']} -> {ctd['todos']}/{d['com_resumo']}")
