"""etl.cota — extrai a COTA DE ORIGEM de uma cadeira a partir do dispositivo
constitucional citado na ementa da Mensagem de indicação do Senado.

Rodar a suíte de regressão:
  python -m etl.cota --testar
  python -m etl.cota "nos termos do art. 104, parágrafo único, inciso I, ..."

POR QUE ISTO EXISTE (a hipótese central do produto)
---------------------------------------------------
Descoberto ao vivo em 2026-07-23: a ementa da Mensagem que o Presidente
manda ao Senado **cita o dispositivo constitucional da vaga**. Exemplo real:

    "Submete à apreciação do Senado Federal, nos termos do art. 104,
     parágrafo único, inciso I, da Constituição, o nome do Senhor CARLOS
     AUGUSTO PIRES BRANDÃO, para exercer o cargo de Ministro do Superior
     Tribunal de Justiça."

`art. 104, parágrafo único, inciso I` = a vaga do STJ reservada a juízes
dos TRFs. Ou seja: a cota de origem da cadeira é **dado oficial explícito**,
não inferência. Por isso este módulo é regex determinístico e não LLM —
mesma filosofia auditável de `etl/normas.py` no app irmão /congresso.

REGRA DURA: ementa sem dispositivo reconhecido não vira cota chutada.
Devolve `cota=None` e o caso vai para revisão humana. Um rótulo errado de
cota corrompe a contagem "quantas vagas da OAB abrem até 2030", que é o
produto inteiro.

LIÇÕES JÁ PAGAS QUE ESTE ARQUIVO OBEDECE
----------------------------------------
1. **Alternância de regex é ORDENADA.** Em `/congresso`, `Lei 10406` virava
   `lei:104` porque a primeira alternativa casava e a segunda nunca era
   tentada. Aqui o risco equivalente é `art. 111-A` virar `art. 111`: o
   sufixo é capturado no MESMO grupo opcional, não numa alternativa.
2. **Corpus homogêneo esconde bug de formato.** As ementas oficiais são
   muito padronizadas; os testes incluem de propósito variações de grafia
   ("artigo 104", "art 104", "inciso 1º", "§ único") que a fonte quase não
   produz mas que aparecem em texto de outras origens.
3. **Nunca gravar vazio silenciosamente** — quem não reconhece, sinaliza.
"""

from __future__ import annotations

import argparse
import re
import sys
import unicodedata

# ─────────────────────────────────────────────────────────────────────
# Tabela de âncoras: dispositivo constitucional → (tribunal, cota)
#
# `None` em cota significa "o artigo identifica o tribunal, mas a cota
# depende de desempate pelo texto da ementa" (ver `_desempatar`).
# ─────────────────────────────────────────────────────────────────────
ANCORAS: dict[tuple[str, str | None], tuple[str, str | None]] = {
    # STF — CF art. 101: sem cota de origem, escolha livre entre cidadãos
    # de 35 a 70 anos (teto elevado de 65 para 70 pela EC 122/2022).
    ("101", None): ("stf", "livre"),
    # STJ — CF art. 104, parágrafo único: TERÇOS, não quinto.
    ("104", "I"): ("stj", "terco_trf"),
    ("104", "II"): ("stj", "terco_tj"),
    ("104", "III"): ("stj", None),  # advogado OU MP, alternadamente
    ("104", None): ("stj", None),
    # TST — CF art. 111-A: 1/5 advogados e MPT, 4/5 carreira dos TRTs.
    ("111-A", "I"): ("tst", "quinto_oab_mpt"),
    ("111-A", "II"): ("tst", "carreira_trt"),
    ("111-A", None): ("tst", None),
    # STM — CF art. 123: 10 militares + 5 civis.
    ("123", None): ("stm", None),
    # TSE — CF art. 119. NÃO passa pelo Senado (membros são eleitos pelos
    # próprios tribunais); se aparecer numa Mensagem, é anomalia a revisar.
    ("119", None): ("tse", "eletiva_tse"),
    # 2ª instância — quinto constitucional (CF art. 94) e composição dos
    # TRFs (art. 107) e TRTs (art. 115).
    ("94", None): (None, "quinto"),
    ("107", "I"): ("trf", "quinto"),
    ("107", "II"): ("trf", "carreira"),
    ("107", None): ("trf", None),
    ("115", "I"): ("trt", "quinto"),
    ("115", "II"): ("trt", "carreira"),
    ("115", None): ("trt", None),
}

# Artigos que aparecem em ementa de indicação mas NÃO definem vaga de
# tribunal. Reconhecidos de propósito, para distinguir "não é judiciário"
# de "é judiciário e eu não entendi" — os dois exigem tratamento diferente.
ARTIGOS_RUIDO: dict[str, str] = {
    "52": "competência do Senado para aprovar a indicação (art. 52, III e IV)",
    "84": "competência do Presidente para nomear (art. 84, XIV)",
    "128": "Ministério Público — Procurador-Geral da República",
    "73": "TCU — não é órgão do Poder Judiciário",
    "103-B": "CNJ — conselho, não tribunal",
    "111-B": "Conselho Superior da Justiça do Trabalho",
    "105": "competências do STJ (não define vaga)",
    "102": "competências do STF (não define vaga)",
}

ROMANOS = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8}

# ─────────────────────────────────────────────────────────────────────
# Tribunal pelo NOME do cargo — descoberto na F0 e obrigatório.
#
# A primeira versão deste módulo tirava o tribunal só do dispositivo
# constitucional. Medido contra 724 indicações reais de 2003–2026, isso
# achava 54 indicações judiciais; a detecção por nome do cargo acha 132.
# O motivo é estrutural e não tem conserto por regex melhor: a cadeira do
# **STF não tem cota de origem** (CF art. 101 é escolha livre), então a
# Mensagem não precisa citar dispositivo nenhum — e de fato não cita. As
# 20 indicações ao STF do período têm `artigos_vistos == []`.
#
# Portanto: TRIBUNAL vem do nome do cargo (cobertura alta); COTA vem do
# dispositivo (cobertura parcial, e é honesto que seja).
# ─────────────────────────────────────────────────────────────────────
TRIBUNAIS_NOME: list[tuple[str, str]] = [
    ("supremo tribunal federal", "stf"),
    ("superior tribunal de justica", "stj"),
    ("superior tribunal militar", "stm"),
    ("tribunal superior do trabalho", "tst"),
    ("tribunal superior eleitoral", "tse"),
    ("tribunal regional federal", "trf"),
    ("tribunal regional do trabalho", "trt"),
]

# Órgãos que NÃO são do Poder Judiciário mas cujas indicações passam pelo
# mesmo rito no Senado. Precisam ser reconhecidos para serem excluídos —
# "não é judiciário" e "é judiciário e não entendi" exigem tratamento
# diferente, e silêncio confunde os dois.
ORGAOS_NAO_JUDICIARIO: list[tuple[str, str]] = [
    ("tribunal de contas", "TCU — órgão auxiliar do Legislativo"),
    ("conselho nacional de justica", "CNJ — conselho, não tribunal"),
    ("conselho nacional do ministerio publico", "CNMP"),
    ("procurador-geral da republica", "MPU"),
    ("banco central", "autarquia"),
    ("agencia nacional", "agência reguladora"),
    ("embaixador", "chefe de missão diplomática"),
]

# "para exercer o cargo de Ministro do Superior Tribunal de Justiça"
# Ancorar no CARGO evita um falso positivo real: a ementa costuma citar o
# tribunal de ORIGEM do indicado ("Juiz do Tribunal Regional Federal da 1ª
# Região, para o cargo de Ministro do STJ") — casar o nome solto no texto
# atribuiria a vaga ao tribunal errado.
#
# "para compor o Superior Tribunal de Justiça" é redação alternativa real
# (MSF 101/2011) e precisa ancorar igual: sem ela o fallback varria a
# ementa inteira e pegava o "Supremo Tribunal Federal" citado de passagem
# no fim do texto, atribuindo a vaga ao tribunal errado.
_CARGO = re.compile(
    r"(?:para\s+(?:o\s+)?(?:exercer\s+(?:o\s+)?)?cargo\s+de"
    r"|cargo\s+de"
    r"|para\s+compor\s+(?:o\s+|a\s+)?"
    r"|para\s+(?:o\s+)?preenchimento\s+(?:d[ao]\s+)?)"
    r"\s*(.{0,120})",
    re.IGNORECASE,
)

# "na vaga decorrente da aposentadoria do Ministro Maurício José Corrêa"
# A fonte entrega a CADEIA DE SUCESSÃO da cadeira de graça — é o insumo
# direto do modelo de `cadeiras` (entidade durável) do plano.
_VAGA_ANTECESSOR = re.compile(
    r"vaga\s+(?:decorrente\s+)?d[aoe]s?\s*"
    r"(aposentadoria|falecimento|ren[úu]ncia|morte|exonera[çc][ãa]o|transfer[êe]ncia\s+para\s+a\s+reserva)"
    r"\s+d[aoe]s?\s+"
    r"(?:Ministr[ao]s?\s+|Senhor[ao]?s?\s+|Desembargador[ao]?s?\s+)?"
    r"([^,.;]{3,70})",
    re.IGNORECASE,
)

# `(\d+)` seguido de sufixo OPCIONAL no mesmo grupo — nunca em alternativa
# separada, senão "111-A" casaria como "111" e o "-A" se perderia (é
# exatamente a classe de bug que quebrou `etl/normas.py` no /congresso).
# BUG REAL, achado na F0 contra as ementas de 2026: o grupo `resto` era
# `[^.;]{0,140}` e ENGOLIA o artigo seguinte. Em
#   "...nos termos do art. 52, inciso III, alínea “a”, e do art. 111-A,
#    inciso I, da Constituição..."
# o match de `art. 52` consumia o `art. 111-A` inteiro, e como `finditer`
# retoma DEPOIS do match, o 111-A nunca era visto. Resultado: as duas
# indicações ao TST de 2026 saíam sem cota — e a fonte estava perfeita.
#
# É a mesma família do bug de alternância ordenada do /congresso: a regex
# "funciona" no caso simples e falha em silêncio no caso composto. O
# lookahead negativo faz `resto` parar antes do próximo "art.".
_ARTIGO = re.compile(
    r"art(?:igo)?s?\.?\s*"
    r"(\d{1,3}(?:\s*-\s*[A-Z])?)"  # 101 | 104 | 111-A | 103-B
    r"(?P<resto>(?:(?!\bart(?:igo)?s?\.?\s*\d)[^.;]){0,140})",
    re.IGNORECASE,
)

_INCISO = re.compile(r"\binciso\s+([IVX]+)\b|,\s*([IVX]{1,5})\s*,", re.IGNORECASE)
_INCISO_ARABE = re.compile(r"\binciso\s+(\d{1,2})\s*[ºo°]?", re.IGNORECASE)
_PARAGRAFO_UNICO = re.compile(r"(?:par[áa]grafo\s+[úu]nico|§\s*[úu]nico)", re.IGNORECASE)
_CONSTITUICAO = re.compile(r"constitui[çc][ãa]o|\bCF\b|carta\s+magna", re.IGNORECASE)

# BUG REAL, achado na F2 (execução ao vivo, 2026-07-24) contra MSF 7/2026
# (a rejeição de Jorge Messias ao STF). Toda ementa cita, de passagem, a
# competência do PRÓPRIO SENADO para votar ("...nos termos do art. 52,
# inciso III, alínea "a"..."). O lookbehind de 80 chars pegava o "inciso
# III" desse boilerplate e o atribuía ao art. 101 (STF) só por estar
# perto — produzindo "CF art. 101, § único, III", um dispositivo que NÃO
# EXISTE (o STF não tem inciso nenhum, é vaga livre). Não apareceu nos 22
# casos sintéticos nem no scan de 724 ementas históricas porque nenhum
# teste olhava o campo `dispositivo`, só `cota` — e a cota saía certa por
# acidente (o fallback ANCORAS.get((101,None)) cobria o erro).
#
# Correção: só aceitar inciso ANTES do artigo quando o texto liga os dois
# explicitamente ("inciso I do parágrafo único do art. 104"), nunca por
# proximidade. Isso é o que MSF 101/2011 realmente diz, e é o que MSF
# 7/2026 NÃO diz sobre o art. 101.
_INCISO_DE_ARTIGO = re.compile(
    r"inciso\s+([IVX]+)\s+do\s+(?:par[áa]grafo\s+[úu]nico\s+do\s+)?"
    r"art(?:igo)?s?\.?\s*(\d{1,3}(?:\s*-\s*[A-Z])?)",
    re.IGNORECASE,
)


def _sem_acento(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def _norm_artigo(bruto: str) -> str:
    """"111 - A" → "111-A"; "104" → "104"."""
    return re.sub(r"\s*-\s*", "-", bruto.strip().upper())


def _romano(n: int) -> str | None:
    for k, v in ROMANOS.items():
        if v == n:
            return k
    return None


def _achar_inciso(trecho: str) -> str | None:
    m = _INCISO.search(trecho)
    if m:
        return (m.group(1) or m.group(2) or "").upper() or None
    m = _INCISO_ARABE.search(trecho)  # "inciso 1º" — grafia rara, mas existe
    if m:
        return _romano(int(m.group(1)))
    return None


def _desempatar(tribunal: str, ementa: str) -> tuple[str | None, str]:
    """Cotas que o artigo sozinho não resolve.

    Devolve `(cota, motivo)`. `cota=None` significa: reconheci o tribunal,
    mas NÃO sei a cota — vai para revisão, não vira chute.
    """
    txt = _sem_acento(ementa).lower()

    if tribunal == "stj":
        # Art. 104, § único, III alterna advogado e membro do MP. Qual dos
        # dois só o texto diz.
        tem_adv = any(t in txt for t in ("advogad", "advocacia", "ordem dos advogados"))
        tem_mp = any(
            t in txt for t in ("ministerio publico", "procurador", "promotor")
        )
        if tem_adv and not tem_mp:
            return "terco_oab", "ementa menciona advocacia"
        if tem_mp and not tem_adv:
            return "terco_mp", "ementa menciona Ministério Público"
        return None, "art. 104, III sem indicação clara de advocacia ou MP"

    if tribunal == "stm":
        # 10 vagas militares (3 Marinha, 4 Exército, 3 Aeronáutica) + 5
        # civis. A patente na ementa resolve, e é sempre citada.
        if "almirante" in txt or "marinha" in txt:
            return "militar_marinha", "patente/força na ementa"
        if "general" in txt or "exercito" in txt:
            return "militar_exercito", "patente/força na ementa"
        if "brigadeiro" in txt or "aeronautica" in txt:
            return "militar_aeronautica", "patente/força na ementa"
        return "civil_stm", "sem patente militar na ementa ⇒ vaga civil (art. 123, § único)"

    if tribunal == "tst":
        tem_adv = "advogad" in txt or "advocacia" in txt
        tem_mp = "ministerio publico" in txt or "procurador" in txt
        if tem_adv or tem_mp:
            return "quinto_oab_mpt", "ementa menciona advocacia ou MPT"
        return "carreira_trt", "sem menção a advocacia/MPT ⇒ vaga da carreira"

    return None, "sem regra de desempate para este tribunal"


def inferir_tribunal_por_cargo(ementa: str) -> tuple[str | None, str | None]:
    """Tribunal a partir do NOME DO CARGO. Devolve `(tribunal, excluido_por)`.

    `excluido_por` preenchido significa: reconheci o órgão e ele **não é**
    do Poder Judiciário — resultado conclusivo, não falha.
    """
    txt = _sem_acento(ementa).lower()
    m = _CARGO.search(txt)
    # Restringe ao trecho do cargo quando ele existe; senão, ementa toda.
    escopo = m.group(1) if m else txt

    for termo, motivo in ORGAOS_NAO_JUDICIARIO:
        if termo in escopo:
            return None, motivo

    # Dentro do escopo do cargo, vence o que aparece PRIMEIRO no texto —
    # não a ordem da tabela. Ordem de tabela fez "supremo tribunal federal"
    # ganhar de "superior tribunal de justiça" numa ementa que citava os
    # dois (MSF 101/2011), atribuindo a vaga ao tribunal errado.
    achados = [(escopo.find(t), s) for t, s in TRIBUNAIS_NOME if t in escopo]
    if achados:
        return min(achados)[1], None

    # Fallback: ementa inteira, para redação atípica. Mesma regra de
    # posição — e é aqui que o risco de pegar tribunal de passagem é maior,
    # por isso o resultado sai marcado como vindo do fallback.
    achados = [(txt.find(t), s) for t, s in TRIBUNAIS_NOME if t in txt]
    if achados:
        return min(achados)[1], None
    return None, None


def extrair_antecessor(ementa: str | None) -> dict | None:
    """Antecessor na cadeira, quando a ementa o nomeia.

    Achado da F0: 42% das ementas judiciais dizem "na vaga decorrente da
    aposentadoria do Ministro X". É a cadeia de sucessão fornecida pela
    própria fonte — insumo direto de `cadeiras`/`ocupacoes`, sem inferência.
    """
    if not ementa:
        return None
    m = _VAGA_ANTECESSOR.search(ementa)
    if not m:
        return None
    motivo = _sem_acento(m.group(1)).lower()
    motivo = {
        "aposentadoria": "voluntaria_ou_compulsoria",
        "falecimento": "falecimento",
        "morte": "falecimento",
        "renuncia": "renuncia",
        "exoneracao": "exoneracao",
    }.get(motivo, "transferencia_reserva" if "reserva" in motivo else motivo)
    nome = re.sub(r"\s+", " ", m.group(2)).strip(" .,;")
    # A patente vem colada no nome em indicação militar
    # ("Tenente-Brigadeiro-do-Ar Sérgio Xavier Feroll") — separar aqui
    # evitaria adivinhação; preferimos entregar cru e deixar a F3 tratar.
    return {"antecessor_nome": nome, "motivo_vacancia": motivo}


def extrair(ementa: str | None, indexacao: str | None = None) -> dict:
    """Extrai dispositivo, tribunal e cota de uma ementa de indicação.

    `indexacao` é a palavra-chave oficial do Senado (`documento.indexacao`),
    usada só como CONFIRMAÇÃO do tribunal — nunca como fonte da cota, que
    ela não carrega.

    Devolve sempre um dict; `cota is None` é resultado legítimo e
    significa "requer revisão humana", nunca "assuma o padrão".
    """
    saida: dict = {
        "dispositivo": None,
        "artigo": None,
        "inciso": None,
        "tribunal": None,
        "tribunal_origem": None,  # 'cargo' | 'dispositivo' | 'ambos'
        "cota": None,
        "motivo": None,
        "artigos_vistos": [],
        "ruido": [],
        "nao_judiciario": None,
        "divergencia": None,
    }
    if not ementa:
        saida["motivo"] = "ementa vazia"
        return saida

    # ── (1) TRIBUNAL pelo cargo. Vem primeiro porque tem cobertura maior
    # que o dispositivo: a cadeira do STF não tem cota e por isso a
    # Mensagem não cita artigo nenhum (20 de 20 indicações ao STF em
    # 2003–2026 têm `artigos_vistos == []`).
    trib_cargo, excluido = inferir_tribunal_por_cargo(ementa)
    if excluido:
        saida["nao_judiciario"] = excluido
        saida["motivo"] = f"não é órgão do Judiciário: {excluido}"
        return saida
    if trib_cargo:
        saida["tribunal"] = trib_cargo
        saida["tribunal_origem"] = "cargo"

    # ── (2) DISPOSITIVO, para a cota.
    candidatos: list[tuple[str, str | None, bool, str]] = []
    for m in _ARTIGO.finditer(ementa):
        artigo = _norm_artigo(m.group(1))
        resto = m.group("resto") or ""
        inciso = _achar_inciso(resto)
        if inciso is None:
            # Redação invertida, real e frequente na fonte antiga:
            # "nos termos do inciso I do parágrafo único do art. 104" — o
            # qualificador vem ANTES do artigo. Só aceito quando o texto
            # LIGA explicitamente o inciso a ESTE artigo ("inciso X do
            # art. {artigo}"); proximidade sozinha não basta (ver bug
            # documentado acima em _INCISO_DE_ARTIGO — pegava o "inciso
            # III" do art. 52 de toda ementa e atribuía ao art. 101).
            for im in _INCISO_DE_ARTIGO.finditer(ementa):
                if _norm_artigo(im.group(2)) == artigo:
                    inciso = im.group(1).upper()
                    resto = im.group(0) + resto  # inclui "do parágrafo único do art." p/ o check abaixo
                    break
        # Só conta como âncora constitucional se a Constituição for
        # nomeada por perto. "art. 39 da Lei nº 11.440" (indicação de
        # embaixador) não pode ser confundido com dispositivo da CF.
        constitucional = bool(_CONSTITUICAO.search(resto))
        candidatos.append((artigo, inciso, constitucional, resto))
        saida["artigos_vistos"].append(artigo)

    escolhido = None
    for artigo, inciso, constitucional, resto in candidatos:
        if artigo in ARTIGOS_RUIDO:
            saida["ruido"].append(f"art. {artigo} — {ARTIGOS_RUIDO[artigo]}")
            continue
        if (artigo, inciso) in ANCORAS or (artigo, None) in ANCORAS:
            escolhido = (artigo, inciso, resto, constitucional)
            break

    if escolhido is None:
        # Sem dispositivo NÃO significa sem tribunal — é o caso normal do
        # STF. Só a cota fica em aberto.
        if saida["tribunal"] == "stf":
            saida["cota"] = "livre"
            saida["motivo"] = (
                "STF não tem cota de origem (CF art. 101, escolha livre) — "
                "a Mensagem não cita dispositivo por não haver o que citar"
            )
        elif saida["tribunal"]:
            saida["motivo"] = "tribunal identificado pelo cargo; sem dispositivo para a cota"
        else:
            saida["motivo"] = (
                "nem cargo de tribunal nem artigo de vaga reconhecidos"
                + (f" (só ruído: {'; '.join(saida['ruido'])})" if saida["ruido"] else "")
            )
        return saida

    artigo, inciso, resto, constitucional = escolhido
    trib_disp, cota = ANCORAS.get(
        (artigo, inciso), ANCORAS.get((artigo, None), (None, None))
    )
    saida["artigo"] = artigo
    saida["inciso"] = inciso

    partes = [f"CF art. {artigo}"]
    if _PARAGRAFO_UNICO.search(resto):
        partes.append("§ único")
    if inciso:
        partes.append(inciso)
    saida["dispositivo"] = ", ".join(partes)

    # ── (3) Conciliar as duas leituras do tribunal. Divergência é sinal,
    # não empate a resolver no escuro: prevalece o CARGO (é o que a vaga
    # de fato é), e a divergência fica registrada para revisão.
    if trib_disp and trib_cargo and trib_disp != trib_cargo:
        saida["divergencia"] = (
            f"cargo diz '{trib_cargo}', dispositivo ({saida['dispositivo']}) diz '{trib_disp}'"
        )
        cota = None
    elif trib_disp and not trib_cargo:
        saida["tribunal"] = trib_disp
        saida["tribunal_origem"] = "dispositivo"
    elif trib_disp and trib_cargo:
        saida["tribunal_origem"] = "ambos"

    tribunal = saida["tribunal"]
    if saida["divergencia"]:
        saida["motivo"] = "divergência entre cargo e dispositivo — requer revisão"
    elif cota is None and tribunal:
        cota, motivo = _desempatar(tribunal, ementa)
        saida["motivo"] = motivo
    elif cota:
        saida["motivo"] = "cota determinada diretamente pelo dispositivo"
        if not constitucional:
            saida["motivo"] += " (sem menção explícita à Constituição na ementa)"

    saida["cota"] = cota
    return saida


def e_judiciario(resultado: dict) -> bool:
    """Uma indicação é do Judiciário se identificamos o tribunal da vaga."""
    return resultado.get("tribunal") is not None


# ─────────────────────────────────────────────────────────────────────
# Regressão. Os 6 primeiros casos são ementas REAIS colhidas da API em
# 2026-07-23; os demais são variações de grafia e armadilhas deliberadas.
# ─────────────────────────────────────────────────────────────────────
CASOS: list[tuple[str, dict]] = [
    (
        "Submete à apreciação do Senado Federal, nos termos do art. 104, parágrafo único, "
        "inciso I, da Constituição, o nome do Senhor CARLOS AUGUSTO PIRES BRANDÃO, para "
        "exercer o cargo de Ministro do Superior Tribunal de Justiça.",
        {"tribunal": "stj", "cota": "terco_trf", "artigo": "104", "inciso": "I"},
    ),
    (
        "Submete à apreciação do Senado Federal, nos termos do art. 104, parágrafo único, "
        "inciso II, da Constituição Federal, o nome da Senhora MARIA MARLUCE CALDAS "
        "BEZERRA, para exercer o cargo de Ministra do Superior Tribunal de Justiça.",
        {"tribunal": "stj", "cota": "terco_tj", "artigo": "104", "inciso": "II"},
    ),
    (
        "Submete à apreciação do Senado Federal, nos termos do art. 123 da Constituição "
        "Federal, o nome da Senhora VERÔNICA ABDALLA STERMAN, para exercer o cargo de "
        "Ministra do Superior Tribunal Militar.",
        {"tribunal": "stm", "cota": "civil_stm", "artigo": "123"},
    ),
    (
        "Submete à apreciação do Senado Federal, nos termos do art. 123 da Constituição "
        "Federal, o nome do General de Exército ANISIO DAVID DE OLIVEIRA JUNIOR, para "
        "exercer o cargo de Ministro do Superior Tribunal Militar.",
        {"tribunal": "stm", "cota": "militar_exercito", "artigo": "123"},
    ),
    (
        # ARMADILHA REAL: indicação de embaixador. Cita art. 52 da CF e
        # art. 39/41 de uma LEI ORDINÁRIA. Não pode virar vaga de tribunal.
        "Submete à apreciação do Senado Federal, de conformidade com o art. 52, inciso IV, "
        "da Constituição Federal, e com o art. 39, combinado com o art. 41 da Lei nº "
        "11.440, de 2006, o nome do Senhor SÉRGIO RODRIGUES DOS SANTOS, Ministro de "
        "Primeira Classe da Carreira de Diplomata, para exercer o cargo de Embaixador do "
        "Brasil na Federação da Rússia.",
        {"tribunal": None, "cota": None},
    ),
    (
        "Submete à apreciação do Senado Federal, nos termos do art. 101, parágrafo único, "
        "da Constituição Federal, o nome do Senhor FULANO DE TAL, para exercer o cargo de "
        "Ministro do Supremo Tribunal Federal.",
        {"tribunal": "stf", "cota": "livre", "artigo": "101"},
    ),
    # ── Variações de grafia (corpus homogêneo esconde bug de formato) ──
    (
        "nos termos do artigo 104, § único, inciso III, da Constituição, o nome do "
        "advogado BELTRANO, indicado pela Ordem dos Advogados do Brasil",
        {"tribunal": "stj", "cota": "terco_oab", "artigo": "104", "inciso": "III"},
    ),
    (
        "nos termos do art 104, parágrafo único, III, da CF, o nome do Procurador "
        "Regional da República CICRANO, membro do Ministério Público Federal",
        {"tribunal": "stj", "cota": "terco_mp", "artigo": "104", "inciso": "III"},
    ),
    (
        # 111-A não pode degradar para 111.
        "nos termos do art. 111-A, inciso I, da Constituição Federal, o nome do advogado "
        "SICRANO para o cargo de Ministro do Tribunal Superior do Trabalho",
        {"tribunal": "tst", "cota": "quinto_oab_mpt", "artigo": "111-A", "inciso": "I"},
    ),
    (
        "nos termos do art. 111-A, inciso II, da Constituição Federal, o nome do "
        "Desembargador do Trabalho JOÃO para o cargo de Ministro do TST",
        {"tribunal": "tst", "cota": "carreira_trt", "artigo": "111-A", "inciso": "II"},
    ),
    (
        # Ruído puro: só competência, nenhuma vaga.
        "Submete à apreciação do Senado Federal, nos termos do art. 52, inciso III, alínea "
        "f, da Constituição Federal, o nome do Senhor X para o cargo de Presidente do "
        "Banco Central do Brasil.",
        {"tribunal": None, "cota": None},
    ),
    (
        "Submete, nos termos do art. 128, § 1º, da Constituição Federal, o nome do "
        "Senhor Y para o cargo de Procurador-Geral da República.",
        {"tribunal": None, "cota": None},
    ),
    (
        "ementa sem artigo nenhum, só texto solto",
        {"tribunal": None, "cota": None},
    ),
    # ── Casos que a F0 revelou (2026-07-23) ───────────────────────────
    (
        # REAL. A indicação ao STF NÃO cita dispositivo — não há cota a
        # citar. A versão anterior deste módulo perdia 100% do STF.
        "Submete à consideração do Senado Federal, o nome do Senhor ANTONIO CEZAR PELUSO, "
        "para exercer o cargo de Ministro do Supremo Tribunal Federal.",
        {"tribunal": "stf", "cota": "livre", "artigo": None},
    ),
    (
        # REAL. Idem, e ainda nomeia o antecessor.
        "Submete à apreciação do Senado Federal a indicação do Senhor EROS ROBERTO GRAU, "
        "para exercer o cargo de Ministro do Supremo Tribunal Federal, na vaga decorrente "
        "da aposentadoria do Ministro Maurício José Corrêa.",
        {"tribunal": "stf", "cota": "livre"},
    ),
    (
        # ARMADILHA: o tribunal de ORIGEM do indicado aparece na ementa e
        # não pode virar o tribunal da VAGA. Ancorar em "cargo de" resolve.
        "Submete o nome do Senhor JOSÉ, Juiz do Tribunal Regional Federal da 1ª Região, "
        "para exercer o cargo de Ministro do Superior Tribunal de Justiça.",
        {"tribunal": "stj"},
    ),
    (
        "Submete à apreciação do Senado Federal o nome do Senhor Z, para exercer o cargo "
        "de Ministro do Tribunal de Contas da União.",
        {"tribunal": None, "cota": None},
    ),
    (
        # REAL (MSF 8/2026 e 35/2026). O `resto` do art. 52 engolia o
        # art. 111-A inteiro e a cota se perdia — bug do lookahead.
        "Submete à apreciação do Senado Federal, de conformidade com o art. 52, inciso III, "
        "alínea “a”, e do art. 111-A, inciso I, da Constituição Federal, o nome do advogado "
        "FULANO para exercer o cargo de Ministro do Tribunal Superior do Trabalho.",
        {"tribunal": "tst", "cota": "quinto_oab_mpt", "artigo": "111-A", "inciso": "I"},
    ),
    (
        # REAL (MSF 101/2011). Duas armadilhas juntas: "para compor" em vez
        # de "cargo de", e o inciso ANTES do artigo.
        "Submete à consideração do Senado Federal, nos termos do inciso I do parágrafo "
        "único do art. 104 da Constituição, o nome do Senhor MARCO AURÉLIO BELLIZZE "
        "OLIVEIRA para compor o Superior Tribunal de Justiça.",
        {"tribunal": "stj", "cota": "terco_trf", "artigo": "104", "inciso": "I"},
    ),
    (
        # REAL (MSF 7/2026, rejeição de Jorge Messias — achado numa F2 ao
        # vivo, não pelos testes). O "inciso III" pertence ao art. 52
        # (competência do Senado, presente em TODA ementa), não ao art.
        # 101. Sem a ligação explícita "inciso X do art. NNN", não pode
        # virar "CF art. 101, § único, III" — dispositivo que não existe.
        "Submete à apreciação do Senado Federal, nos termos do art. 52, inciso III, "
        "alínea “a”, e o art. 101, parágrafo único, da Constituição, o nome do "
        "Senhor JORGE RODRIGO ARAÚJO MESSIAS, para exercer o cargo de Ministro do "
        "Supremo Tribunal Federal.",
        {"tribunal": "stf", "cota": "livre", "artigo": "101", "inciso": None,
         "dispositivo": "CF art. 101, § único"},
    ),
]

# Casos do extrator de antecessor — a cadeia de sucessão que a fonte dá de
# graça em 42% das ementas judiciais.
CASOS_ANTECESSOR: list[tuple[str, dict | None]] = [
    (
        "para exercer o cargo de Ministro do Supremo Tribunal Federal, na vaga decorrente "
        "da aposentadoria do Ministro Maurício José Corrêa.",
        {"antecessor_nome": "Maurício José Corrêa", "motivo_vacancia": "voluntaria_ou_compulsoria"},
    ),
    (
        "na vaga decorrente do falecimento do Ministro Teori Albino Zavascki.",
        {"antecessor_nome": "Teori Albino Zavascki", "motivo_vacancia": "falecimento"},
    ),
    (
        "para exercer o cargo de Ministro do Superior Tribunal de Justiça.",
        None,
    ),
]


def testar(verboso: bool = True) -> bool:
    ok = True
    for i, (ementa, esperado) in enumerate(CASOS, 1):
        got = extrair(ementa)
        falhas = [
            f"{k}: esperado {v!r}, veio {got.get(k)!r}"
            for k, v in esperado.items()
            if got.get(k) != v
        ]
        if falhas:
            ok = False
            print(f"[FALHA] caso {i}: {'; '.join(falhas)}")
            print(f"        ementa: {ementa[:110]}...")
        elif verboso:
            alvo = f"{got['tribunal']}/{got['cota']}" if got["tribunal"] else "nao-judiciario"
            print(f"[ok]    caso {i}: {alvo}")

    for j, (texto, esperado) in enumerate(CASOS_ANTECESSOR, 1):
        got = extrair_antecessor(texto)
        if got != esperado:
            ok = False
            print(f"[FALHA] antecessor {j}: esperado {esperado!r}, veio {got!r}")
        elif verboso:
            print(f"[ok]    antecessor {j}: {got['antecessor_nome'] if got else 'sem antecessor'}")

    total = len(CASOS) + len(CASOS_ANTECESSOR)
    print(f"\n{'TODOS OS CASOS PASSARAM' if ok else 'HA FALHAS'} ({total} casos)")
    return ok


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("ementa", nargs="?", help="ementa a analisar")
    p.add_argument("--testar", action="store_true", help="roda a suíte de regressão")
    args = p.parse_args()

    if args.testar:
        sys.exit(0 if testar() else 1)
    if args.ementa:
        import json

        print(json.dumps(extrair(args.ementa), ensure_ascii=False, indent=2))
    else:
        p.print_help()
