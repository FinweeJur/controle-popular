r"""etl.normas_geo.extrair — extrai um lugar citável da ementa de `atos_oficiais`
e grava em `atos_oficiais_geo` (extração, sem geocodificar ainda — isso é
`etl.normas_geo.geocodificar`).

    python -m etl.normas_geo.extrair

FONTE: só `ementa`. Nunca PDF, nunca texto completo do ato. Medido em
`docs/normas-mapa-viabilidade.md`: ler o corpo inteiro do ato (API do
DOM-web de BH) não achou nenhum endereço que a ementa já não tivesse, só
somou 1 falso positivo em 20 ("população em situação de rua"); e os PDFs de
Itinga são 94% scan de imagem, sem texto extraível. Abrir uma fonte cara
para não ganhar cobertura real não vale o custo.

═══ REGRA DE OURO: SEM CONFIANÇA ALTA, NÃO EXTRAI NADA ═══

A ementa nunca é reescrita nem adivinhada. Um padrão só produz uma linha em
`atos_oficiais_geo` quando casa um TIPO DE LOGRADOURO (rua/avenida/praça/
travessa/alameda/estrada/rodovia/largo/viela) ou um TIPO DE ÁREA (bairro/
distrito/vila/loteamento) seguido de um NOME PRÓPRIO reconhecível — nunca um
match solto tipo "situação de rua" (sem nome depois) ou "Rua para Todos"
(nome de programa, primeira palavra capturada é uma preposição, rejeitada
pela `_STOPLIST_PRIMEIRA_PALAVRA`).

Confiança:
  - `alta`   -- logradouro com nome (rua/avenida/praça/...): geocodificável
                no nível de RUA. A maioria são leis de "denominação de
                logradouro" (a lei INTEIRA é sobre nomear a rua).
  - `media`  -- só bairro/distrito/vila/loteamento: geocodificável no nível
                de BAIRRO, não de endereço.

Revisão manual de 30 ementas batidas pelo regex de sondagem (ver o doc de
viabilidade): 27/30 (90%) eram referência real de lugar. Esta extração é
mais conservadora que aquele regex de sondagem -- exige um NOME depois do
tipo, o que já filtra os 2 falsos positivos de "situação de rua" observados
lá (nada vem depois de "rua" nesses casos, e a extração não acha nome para
capturar).
"""
import argparse
import re
import sys

from etl.normas_geo._db import conectar

# Os 6 municípios medidos em docs/normas-mapa-viabilidade.md.
MUNICIPIOS = ("3103405", "3106200", "3106705", "3121605", "3134004", "3550308")

# Onde o nome de um logradouro/área PARA, dentro da ementa. Compartilhado
# pelos dois regex abaixo. Cada item vira uma alternativa de lookahead —
# como a captura é NÃO-gulosa, o motor de regex já prefere a parada mais
# cedo, então a ORDEM da lista não importa para o resultado, só a leitura.
#
# Achado testando contra ementas reais (não hipotéticas): boa parte dos
# nomes de rua NÃO termina em vírgula. "Dá denominação de Travessa Francisco
# Lourenço Machado a uma via pública sem nome, localizada..." (Diamantina) e
# "Denomina Praça Yhakio Ogino o logradouro que especifica localizado no
# Distrito de..." (São Paulo) só têm vírgula DEPOIS do texto de enchimento —
# sem as paradas "a uma via", "o logradouro que especifica" a extração
# capturava a frase de enchimento inteira junto com o nome.
_PARADAS_APOS_NOME = (
    r'[,;."“”]',       # pontuação e aspas (retas e curvas)
    r"\s+n[ºo°]\s",
    r"\s+situad\w*",
    r"\s+localizad\w*",
    r"\s+que\s+especifica",
    r"\s+o\s+logradouro",  # "Nome o logradouro que especifica..."
    r"\s+logradouro",      # idem, sem o "o" ("Nome logradouro que especifica")
    r"\s+a\s+uma\s",
    r"\s+uma\s+via",
    r"\s+uma\s+rua",
    r"\s+sem\s+nome",
    r"\s+no\s+[Dd]istrito",
    r"\s+no\s+[Bb]airro",
    r"\s+na\s+[Ss]ubprefeitura",
    r"\s+neste\s+[Mm]unic[ií]pio",
    r"\s+nesta\s+[Cc]apital",
    r"\s+nesta\s+cidade",
    r"\s+e\s+d[áa]\s",
    r"$",
)
_LOOKAHEAD_PARADA = "(?=" + "|".join(_PARADAS_APOS_NOME) + ")"
# O charclass da captura também exclui aspas -- sem isto, "Rua José", entre
# aspas na ementa, capturava até a vírgula seguinte à aspa de fechamento.
_CHARCLASS_NOME = r'[^,;."“”\n]'

# --- Tipo de logradouro (confiança ALTA) ------------------------------------
# Ordem não importa para o match (é um OR), mas a normalização do rótulo sim.
_TIPOS_LOGRADOURO = {
    "rua": "Rua",
    "avenida": "Avenida",
    "av\\.": "Avenida",
    "alameda": "Alameda",
    "travessa": "Travessa",
    "rodovia": "Rodovia",
    "estrada": "Estrada",
    "pra[çc]a": "Praça",
    "largo": "Largo",
    "viela": "Viela",
}
_RE_LOGRADOURO = re.compile(
    r"\b(" + "|".join(_TIPOS_LOGRADOURO.keys()) + r")\s+"
    rf"({_CHARCLASS_NOME}{{3,60}}?)"
    rf"{_LOOKAHEAD_PARADA}",
    re.IGNORECASE,
)

# --- Tipo de área (confiança MEDIA) -----------------------------------------
_TIPOS_AREA = {
    "bairro": "Bairro",
    "distrito de": "Distrito",
    "distrito do": "Distrito",
    "distrito": "Distrito",
    "vila": "Vila",
    "loteamento": "Loteamento",
}
_RE_AREA = re.compile(
    r"\b(" + "|".join(sorted(_TIPOS_AREA.keys(), key=len, reverse=True)) + r")\s+"
    rf"({_CHARCLASS_NOME}{{3,60}}?)"
    rf"{_LOOKAHEAD_PARADA}",
    re.IGNORECASE,
)

# Primeira palavra do nome capturado que invalida o match: sinaliza que o
# "tipo + nome" na verdade é frase comum, não logradouro/área ("Rua para
# Todos" -> "para"; "situação de rua e estabelece..." -> "e").
#
# NÃO inclui "de/do/da/dos/das": são o começo normal de nome de rua real no
# Brasil ("Rua do Bicame", "Rua da Bahia", "Avenida das Nações", "Travessa
# dos Ipês") -- rejeitar essas seria descartar exatamente o caso que a
# extração existe para achar. Achado ao testar contra "Autoriza o prefeito
# municipal a doar... um lote na Rua do Bicame" (Diamantina, lei 1152/1980),
# que a primeira versão desta lista rejeitava.
_STOPLIST_PRIMEIRA_PALAVRA = {"para", "e", "ou", "sem", "com", "que", "é"}


def _normalizar_espacos(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip(" .,;-")


def _tem_nome_valido(nome: str) -> bool:
    """Recusa nome vazio, só-preposição, ou sem letra nenhuma (ex.: "4274"
    sozinho de "Praça 4274, no Bairro X" -- aí a área cai para o Bairro)."""
    nome = _normalizar_espacos(nome)
    if len(nome) < 3:
        return False
    primeira = nome.split()[0].lower()
    if primeira in _STOPLIST_PRIMEIRA_PALAVRA:
        return False
    if not re.search(r"[A-Za-zÀ-ÿ]{3,}", nome):
        return False
    return True


def _titlecase_pt(s: str) -> str:
    """"CRIA ÁREA... TRAVESSA JEQUITIB" -> capturado "JEQUITIB" -> "Jequitib".

    Só reformata quando o texto de origem é essencialmente CAIXA ALTA (regra
    do projeto: nunca inventar -- aqui só está normalizando apresentação, o
    texto capturado continua o mesmo). Preposições curtas ficam minúsculas
    no meio da frase, maiúsculas no início.
    """
    minusculas = {"de", "da", "do", "das", "dos", "e"}
    palavras = s.split(" ")
    saida = []
    for i, p in enumerate(palavras):
        pl = p.lower()
        if i > 0 and pl in minusculas:
            saida.append(pl)
        else:
            saida.append(pl[:1].upper() + pl[1:] if pl else pl)
    return " ".join(saida)


def _normalizar_exibicao(nome: str) -> str:
    letras = [c for c in nome if c.isalpha()]
    maiusculas = sum(1 for c in letras if c.isupper())
    if letras and maiusculas / len(letras) > 0.7:
        return _titlecase_pt(nome)
    return nome


def _rotulo_do_tipo(bruto_tipo: str, tipo_dict: dict) -> str:
    """Resolve o rótulo em português do tipo casado. As chaves do dict são,
    em geral, o próprio texto (rua, bairro, vila...), mas duas são regex
    (`av\\.`, `pra[çc]a`) -- daí o fullmatch como plano B."""
    direto = tipo_dict.get(bruto_tipo)
    if direto:
        return direto
    for chave, rotulo in tipo_dict.items():
        if re.fullmatch(chave, bruto_tipo, re.IGNORECASE):
            return rotulo
    return bruto_tipo.capitalize()  # não deveria acontecer; rede de segurança


def extrair_local(ementa: str) -> dict | None:
    """Tenta achar um lugar citável na ementa. `None` se não achar nada com
    confiança suficiente -- é o caminho ESPERADO para ~89% dos casos."""
    if not ementa:
        return None

    for tipo_re, tipo_dict, confianca in (
        (_RE_LOGRADOURO, _TIPOS_LOGRADOURO, "alta"),
        (_RE_AREA, _TIPOS_AREA, "media"),
    ):
        for m in tipo_re.finditer(ementa):
            bruto_tipo = m.group(1).lower()
            bruto_nome = m.group(2)
            if not _tem_nome_valido(bruto_nome):
                continue
            nome = _normalizar_exibicao(_normalizar_espacos(bruto_nome))
            rotulo_tipo = _rotulo_do_tipo(bruto_tipo, tipo_dict)
            # SEMPRE com o tipo na frente ("Bairro da Palha", não "da Palha")
            # -- é o que vai para a ficha do inspetor, e "da Palha" sozinho
            # lê como fragmento de frase, não como lugar. A query de
            # geocodificação (query_geocodificacao, abaixo) decide por conta
            # própria se leva o tipo junto ou não.
            texto_extraido = f"{rotulo_tipo} {nome}"
            return {
                "tipo_local": rotulo_tipo.lower(),
                "texto_extraido": texto_extraido,
                "confianca": confianca,
                "rotulo_tipo": rotulo_tipo,
                "nome": nome,
            }
    return None


def query_geocodificacao(extraido: dict, municipio: str, uf: str) -> str:
    """String exata mandada ao Nominatim. Logradouro leva o tipo junto (é
    assim que o OSM guarda `addr:street` no Brasil); bairro/distrito/vila só
    o nome -- juntar "Bairro X" ao invés de só "X" piora o casamento contra
    os limites de bairro (suburb/neighbourhood) do OSM, testado manualmente
    em amostra antes de fixar este formato."""
    if extraido["confianca"] == "alta":
        base = extraido["texto_extraido"]
    else:
        base = extraido["nome"]
    return f"{base}, {municipio}, {uf}, Brasil"


def rodar(municipios=MUNICIPIOS) -> None:
    conn = conectar()
    with conn.cursor() as cur:
        cur.execute(
            """
            select a.id as ato_id, a.ementa, m.nome as municipio, m.uf
            from atos_oficiais a
            join municipios m on m.id_municipio = a.id_municipio
            where a.id_municipio = any(%s) and a.ementa is not null
            """,
            (list(municipios),),
        )
        linhas = cur.fetchall()

    print(f"[normas_geo.extrair] {len(linhas)} atos com ementa, nos {len(municipios)} municípios.")

    candidatos = []
    por_municipio_tentativas: dict[str, int] = {}
    por_municipio_hits: dict[str, int] = {}
    por_confianca = {"alta": 0, "media": 0}
    for linha in linhas:
        por_municipio_tentativas[linha["municipio"]] = por_municipio_tentativas.get(linha["municipio"], 0) + 1
        extraido = extrair_local(linha["ementa"])
        if not extraido:
            continue
        por_municipio_hits[linha["municipio"]] = por_municipio_hits.get(linha["municipio"], 0) + 1
        por_confianca[extraido["confianca"]] += 1
        q = query_geocodificacao(extraido, linha["municipio"], linha["uf"])
        candidatos.append((linha["ato_id"], extraido, q))

    print(f"[normas_geo.extrair] {len(candidatos)} atos com lugar extraído "
          f"({100 * len(candidatos) / max(1, len(linhas)):.1f}%). "
          f"alta={por_confianca['alta']} media={por_confianca['media']}")
    for muni, tentativas in sorted(por_municipio_tentativas.items()):
        hits = por_municipio_hits.get(muni, 0)
        print(f"  {muni}: {hits}/{tentativas} ({100*hits/tentativas:.1f}%)")

    if not candidatos:
        return

    conn = conectar()
    with conn.cursor() as cur:
        for ato_id, extraido, q in candidatos:
            cur.execute(
                """
                insert into atos_oficiais_geo
                    (ato_id, tipo_local, texto_extraido, confianca, query_geocodificacao)
                values (%s, %s, %s, %s, %s)
                on conflict (ato_id) do update set
                    tipo_local = excluded.tipo_local,
                    texto_extraido = excluded.texto_extraido,
                    confianca = excluded.confianca,
                    -- Só zera a geocodificação existente se a query mudou --
                    -- reextrair com o MESMO texto não deve re-geocodificar.
                    lat = case when atos_oficiais_geo.query_geocodificacao = excluded.query_geocodificacao
                               then atos_oficiais_geo.lat else null end,
                    lng = case when atos_oficiais_geo.query_geocodificacao = excluded.query_geocodificacao
                               then atos_oficiais_geo.lng else null end,
                    geocodificado_em = case when atos_oficiais_geo.query_geocodificacao = excluded.query_geocodificacao
                               then atos_oficiais_geo.geocodificado_em else null end,
                    feature_index = case when atos_oficiais_geo.query_geocodificacao = excluded.query_geocodificacao
                               then atos_oficiais_geo.feature_index else null end,
                    query_geocodificacao = excluded.query_geocodificacao
                """,
                (ato_id, extraido["tipo_local"], extraido["texto_extraido"], extraido["confianca"], q),
            )
    print(f"[normas_geo.extrair] gravado em atos_oficiais_geo: {len(candidatos)} linhas.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.parse_args()
    try:
        rodar()
    except Exception as e:  # noqa: BLE001
        print(f"[normas_geo.extrair] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
