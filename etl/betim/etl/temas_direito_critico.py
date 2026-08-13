r"""etl.temas_direito_critico — vocabulário e classificação por tema de
direito protegido para a seção "legislação e precedentes" de
`/ambiental/direito-critico` (migration `0067`).

═══ POR QUE ISTO NÃO É `etl.temas_ambientais` (leitura por palavra-chave) ═══

`etl.temas_ambientais` classifica ~6.400 ementas por regex reproduzível —
funciona porque o corpus é grande e homogêneo (ementa curta, um assunto por
norma). Aqui são 45 entradas (30 leis + 15 precedentes), cada uma um texto
jurídico denso (`relevance`/`relevancia`, `articles`) escrito em prosa —
regex ingênua ("indígena" aparece -> tema indígena) já erraria no próprio
texto da Constituição Federal, que cita quase todo tema protegido numa
única entrada. A classificação abaixo é LEITURA HUMANA de cada
`relevance`/`articles`/`ementa`, uma vez, registrada em dicionário — não
"indício automático" fingindo ser regra.

Reexecutável mesmo assim: o ingestor sempre produz o MESMO resultado a
partir do mesmo HTML semente + deste dicionário (chave = `id` da fonte,
1-based, igual ao `LAWS[i].id`/`JURIS[i].id` do HTML). Se a fonte crescer
(mais leis, mais precedentes), as entradas novas simplesmente não têm linha
aqui e saem "sem tema atribuído" — nunca forçadas num tema por default.

═══ OS DOIS TEMAS SEM NENHUM INSTRUMENTO, MEDIDO ═══

Busca literal (case-insensitive) por "serra"/"fauna"/"flora"/"espécie"/
"biodiversidade"/"unidade de conservação" nas 45 entradas (`relevance`,
`articles[].text`, `ementa`, `relevancia`, `titulo`): ZERO ocorrência para
`serras` e para `especies`. O HTML semente foi curado inteiramente em torno
de barragens e populações atingidas (Mariana, Brumadinho, MAB) — não é uma
lacuna de classificação, é uma lacuna do ACERVO. Os dois temas continuam no
vocabulário (`TEMA_LABELS`) para o filtro poder oferecê-los e dizer "nenhum
instrumento catalogado ainda", em vez de somir da lista como se o tema não
existisse.
"""

TEMA_LABELS: dict[str, str] = {
    "rios": "Proteção de rios e recursos hídricos",
    "indigena": "Proteção indígena",
    "quilombola": "Proteção quilombola",
    "povos_tradicionais": "Povos e comunidades tradicionais",
    "direitos_humanos": "Direitos humanos (normas nacionais e internacionais)",
    "serras": "Proteção de serras",
    "especies": "Proteção de espécies da flora e fauna",
}

# Temas sem NENHUM instrumento no acervo semente (ver nota acima) — a tela
# usa esta lista para mostrar "nenhum instrumento catalogado ainda" em vez
# de um resultado vazio mudo.
TEMAS_SEM_INSTRUMENTO = frozenset({"serras", "especies"})

# id (LAWS[i].id, 1-based) -> temas. Critério e trecho que sustenta cada
# atribuição, para quem quiser auditar sem reler as 30 entradas inteiras:
#
#  1  CF/88            -> indigena (art.231), quilombola (art.68 ADCT),
#                          direitos_humanos (art.1º dignidade, art.225)
#  9  PNAB              -> povos_tradicionais ("pescadores e ribeirinhos;
#                          populações tradicionais" no art. que define
#                          "atingido")
# 12  Recursos Hídricos -> rios (política nacional de águas, bacia
#                          hidrográfica)
# 13  Estatuto do Índio -> indigena
# 14  Estatuto Igualdade
#     Racial            -> quilombola (art.32, "comunidades remanescentes
#                          de quilombos")
# 18-30 (Ruggie, Declaração Campesinos, Marco de Sendai, OCs da Corte IDH,
#     Relatório ONU, Recomendações CNDH, PNDH-4, PIDESC, Condenações CIDH,
#     Declaração Universal, Lhaka Honhat) -> direitos_humanos: são,
#     estruturalmente, instrumentos de direitos humanos nacionais/
#     internacionais (não normas ambientais/processuais comuns como CDC,
#     Ação Civil Pública, Código Civil, LAI, PNMA, Segurança de Barragens
#     etc., que ficam SEM tema por não se encaixarem em nenhum dos 7).
#  19 Declaração Campesinos -> também povos_tradicionais (objeto explícito:
#     "camponeses, pescadores, trabalhadores rurais e comunidades
#     tradicionais")
#  30 Lhaka Honhat -> também indigena (caso é sobre território indígena)
TEMAS_POR_LEI: dict[int, list[str]] = {
    1: ["indigena", "quilombola", "direitos_humanos"],
    9: ["povos_tradicionais"],
    12: ["rios"],
    13: ["indigena"],
    14: ["quilombola"],
    18: ["direitos_humanos"],
    19: ["povos_tradicionais", "direitos_humanos"],
    20: ["direitos_humanos"],
    21: ["direitos_humanos"],
    22: ["direitos_humanos"],
    23: ["direitos_humanos"],
    24: ["direitos_humanos"],
    25: ["direitos_humanos"],
    26: ["direitos_humanos"],
    27: ["direitos_humanos"],
    28: ["direitos_humanos"],
    29: ["direitos_humanos"],
    30: ["indigena", "direitos_humanos"],
}

# id (JURIS[i].id, 1-based) -> temas. Mesmo critério, texto-fonte é
# `ementa`/`relevancia`/`tags` de cada precedente:
#
#  2  REsp 1.114.398 (dano moral coletivo, pescadores/ribeirinhos)
#                          -> povos_tradicionais
#  4  ADPF 709 (dever estatal, povos indígenas; relevância cita
#     "territórios indígenas e quilombolas")
#                          -> indigena, quilombola
# 10  REsp 2.200.069 (biomas; relevância cita nominalmente "Rio Doce, Rio
#     Paraopeba e outros rios")
#                          -> rios
# 11  Lhaka Honhat x Argentina (território indígena; relevância estende a
#     "territórios indígenas e quilombolas no Brasil")
#                          -> indigena, quilombola, direitos_humanos
# 12  Escher x Brasil (Corte IDH condena o Brasil por violação de direitos
#     humanos — privacidade/associação de membros do MST)
#                          -> direitos_humanos
# 13  OC-23/17 (meio ambiente como direito humano autônomo)
#                          -> direitos_humanos
# 14  OC-32/23 (emergência climática e direitos humanos)
#                          -> direitos_humanos
# 15  OG 15 CDESC (direito à água; relevância cita Rio Doce/Rio Paraopeba)
#                          -> rios, direitos_humanos
#
# 1, 3, 5-9: responsabilidade civil/penal, tutela de urgência, dano moral
# coletivo GENÉRICO — não se encaixam em nenhum dos 7 temas, ficam sem tema.
TEMAS_POR_PRECEDENTE: dict[int, list[str]] = {
    2: ["povos_tradicionais"],
    4: ["indigena", "quilombola"],
    10: ["rios"],
    11: ["indigena", "quilombola", "direitos_humanos"],
    12: ["direitos_humanos"],
    13: ["direitos_humanos"],
    14: ["direitos_humanos"],
    15: ["rios", "direitos_humanos"],
}


def temas_da_lei(id_fonte: int) -> list[str]:
    return TEMAS_POR_LEI.get(id_fonte, [])


def temas_do_precedente(id_fonte: int) -> list[str]:
    return TEMAS_POR_PRECEDENTE.get(id_fonte, [])
