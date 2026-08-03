"""etl.pbh.viagens — despesas de viagem oficial da PBH, do CKAN para `diarias`.

    python -m etl.pbh.viagens --id-municipio 3106200

FONTE: dataset `despesas-passagens-viagens-oficiais` do CKAN da PBH
(`ckan.pbh.gov.br`, órgão publicador SMALOG). Verificado ao vivo em
2026-08-03: 11 recursos — 1 PDF de dicionário de dados e 10 planilhas
mensais, de setembro/2025 a junho/2026, somando 438 linhas no datastore,
das quais 381 têm conteúdo.

**ISTO É PASSAGEM AÉREA, NÃO É DIÁRIA — e a diferença não é semântica.**
Diária é a verba de alimentação e hospedagem paga ao servidor por dia de
afastamento; passagem é o bilhete comprado pela administração. São rubricas
distintas, com regulamentos distintos, e a soma de uma não é a soma da
outra. A PBH **não publica diária como dataset** (conferido no CKAN e no GRP
em 2026-08-03: nenhum dos 602 datasets nem dos procedimentos do GRP traz
diária); a passagem é o único dado de viagem oficial que existe aberto.

A decisão foi gravar na tabela `diarias` mesmo assim — é a tabela que a UI
lê, e a pergunta do leitor ("quanto custou essa viagem, e para quem?") é a
mesma — mas SEM deixar o leitor achar que está vendo diária. Por isso a
natureza aparece em três lugares, e nenhum deles é só este comentário:

1. `diarias.natureza = 'passagem_aerea'` (coluna criada na migration 0031,
   com as linhas antigas da Câmara de Betim marcadas como 'diaria');
2. o texto de `motivo`, que é campo de exibição, começa com
   "Passagem aérea (não é diária)" — quem só olhar a tela lê a ressalva
   junto com o dado, não num rodapé que pode não ser renderizado;
3. `qtd_diarias` fica NULO de propósito. Passagem não tem quantidade de
   diárias, e preencher 1 seria inventar.

IDEMPOTÊNCIA (a tabela não tem chave natural própria). `diarias` só tinha a
primary key `gen_random_uuid()`, então um INSERT puro duplica tudo a cada
rodada — a Câmara de Betim contorna com refresh total do município, o que
aqui seria pior que o problema: são 10 recursos independentes e uma rodada
que morra no 7º não pode ter apagado os 6 primeiros. A migration 0031 criou
`chave_natural` + unique `(id_municipio, chave_natural)`, e este módulo
deriva a chave do CONTEÚDO do registro (`_chave_natural`), porque a fonte
não publica identificador nenhum.

ARMADILHAS MEDIDAS NESTA FONTE (todas em 2026-08-03, todas reais):

* **O cabeçalho muda de mês para mês.** `Cargo_ou_Funcao` (set/25) →
  `CARGO_OU_FUNCAO` (out/25 a mai/26) → `CARGO OU FUNCAO` (jun/26); a mesma
  coluna de data é `Data_Da_Solicitacao` num mês e `DATA_SOLICITACAO` no
  seguinte; set/25 ainda mistura `Orgao` com `VALOR` na mesma planilha. Ler
  por nome literal funcionaria em um mês e devolveria None nos outros — sem
  erro. Daí `_campo()`, que casa por nome NORMALIZADO.
* **Dois formatos de valor no mesmo dataset.** Nove meses usam
  `"R$ 2.519,03"`; dezembro/2025 usa `"2945.25"` (ponto decimal, sem
  símbolo). Um parser que trate ponto como separador de milhar sempre
  transformaria os R$ 2.945,25 de dezembro em R$ 294.525,00 — erro de 100x
  que não levanta exceção nenhuma. Ver `_valor()`.
* **Dois formatos de data.** `09/06/2026` em nove meses, e
  `"2025-12-08 00:00:00"` em dezembro/2025.
* **`VALOR = "SEM_ONUS"`** aparece uma vez (nov/2025): viagem sem custo para
  o município. Vira NULL, nunca zero — zero soma no total e afirma que a
  passagem custou nada, quando o que se sabe é que a PBH não pagou.
* **O recurso de junho/2026 é um arquivo de teste** (`...junho_2026-teste.csv`)
  com 80 linhas, das quais 57 são inteiramente vazias. Sem descartá-las, a
  tabela ganharia 57 registros sem beneficiário, sem destino e sem valor.
* **O recurso de dezembro/2025 está catalogado como CSV mas é um XLSX**
  (o arquivo começa com `PK\\x03\\x04`). O datastore dele funciona, então o
  caminho normal não percebe; mas o fallback de CSV percebe, e por isso
  valida o cabeçalho antes de confiar no texto — ver `_ler_csv`.
* **Valores com `_` no lugar de espaço** em parte dos meses
  (`Sao_Paulo`, `Visita_Tecnica`, `Alfredo_Bento_de_Vasconcellos_Neto`) e
  com espaço nos outros. Normalizado em `_texto()`.

NÃO É DEDUPLICAÇÃO CEGA: `_chave_natural` acrescenta um índice de ocorrência
quando dois registros são byte a byte idênticos, para que duas passagens
iguais da mesma pessoa no mesmo dia (que a fonte não distingue de forma
alguma) continuem sendo duas linhas, e não uma. Conferido nesta coleta:
381 registros, 381 chaves distintas — nenhum caiu no desempate hoje.

`vereador_id` fica sempre NULO: estes são servidores e secretários do
Executivo, não vereadores. Casar por nome com a tabela `vereadores` (que só
tem vereadores) daria falso positivo em homônimo e nada mais.
"""

import argparse
import csv
import datetime as dt
import hashlib
import io
import re
import sys
import unicodedata

from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    carregar_municipio,
    get_supabase_client,
)
from etl.pbh.cliente import ckan_action, csv_do_recurso, datastore_todos

DATASET = "despesas-passagens-viagens-oficiais"
PAGINA_DATASET = f"https://ckan.pbh.gov.br/dataset/{DATASET}"

# Só o host da PBH tem este dataset, e `etl.pbh.cliente` fala com
# `ckan.pbh.gov.br` fixo. São Paulo também declara `prefeitura_dados_abertos_api:
# "ckan"` em `municipios.fontes`, com outro host — checar só "é CKAN?" deixaria
# `--id-municipio 3550308` coletar dado de BH e gravá-lo como paulistano.
HOST_ESPERADO = "ckan.pbh.gov.br"

# Marcador que vai junto com o dado até a tela. Não é comentário: é o texto
# que o leitor vê no lugar onde ele leria "diária".
ROTULO_NATUREZA = "Passagem aérea (não é diária)"
NATUREZA = "passagem_aerea"

# Colunas que o mapeamento precisa achar em TODO recurso; se um mês novo
# mudar o cabeçalho a ponto de perder uma delas, é melhor abortar do que
# gravar a coluna inteira como NULL.
CAMPOS_OBRIGATORIOS = ("ORGAO", "NOME", "VALOR", "DESTINO")

LOTE = 1000


def _normalizar_chave(nome: str) -> str:
    """`Data_Da_Solicitacao`, `DATA_SOLICITACAO` e `DATA SOLICITACAO` viram a
    mesma coisa. Reduz a maiúsculas sem acento e troca qualquer corrida de
    não-letras por um espaço só."""
    sem_acento = unicodedata.normalize("NFD", nome)
    sem_acento = "".join(c for c in sem_acento if unicodedata.category(c) != "Mn")
    return re.sub(r"[^A-Za-z]+", " ", sem_acento).strip().upper()


def _indexar(registro: dict) -> dict:
    """O registro com as chaves normalizadas, sem o `_id` do datastore (que
    é o número da linha no CKAN, não um id da PBH: muda quando a planilha é
    reingerida e por isso não serve nem de chave nem de desempate)."""
    fora = {"ID", "ID CKAN"}
    return {
        _normalizar_chave(k): v
        for k, v in registro.items()
        if _normalizar_chave(k) not in fora and k != "_id"
    }


def _campo(m: dict, *nomes: str):
    """Primeiro dos nomes (já normalizados) presente no registro.

    Aceita vários porque a fonte alterna entre eles: a data do pedido é
    `DATA DA SOLICITACAO` em setembro/2025 e `DATA SOLICITACAO` do outubro em
    diante."""
    for n in nomes:
        if n in m:
            return m[n]
    return None


def _texto(v) -> str | None:
    """Texto exibível da fonte.

    Parte dos meses publica com `_` no lugar de espaço (`Sao_Paulo`,
    `Auditor_Fiscal_de_Tributos_Municipais`) e parte com espaço mesmo. Sem
    unificar, a MESMA pessoa e o MESMO destino viram duas categorias na hora
    de agrupar.

    O CASO da maiúscula fica como veio: a fonte escreve `Brasilia` e
    `BRASILIA`, `SÃO_PAULO` e `SAO PAULO`. Uniformizar caixa juntaria os dois
    primeiros mas não os dois últimos (não dá para devolver o acento que a
    fonte não escreveu), então a unificação real acontece só na chave — ver
    `_chave_natural` —, onde ela não muda o que o leitor vê.
    """
    if v is None:
        return None
    texto = re.sub(r"\s+", " ", str(v).replace("_", " ")).strip()
    # "-" é como a fonte escreve célula vazia em MATRICULA e TIPO DESTINO;
    # gravá-lo literalmente criaria um destino chamado "-".
    if not texto or texto == "-":
        return None
    return texto


def _valor(v) -> float | None:
    """Valor da passagem, nos DOIS formatos que o dataset usa.

    Nove dos dez recursos escrevem `"R$ 2.519,03"` (vírgula decimal, ponto de
    milhar). O de dezembro/2025 escreve `"2945.25"` — ponto DECIMAL, sem
    símbolo. Um parser que aplique a regra brasileira aos dois lê os R$
    2.945,25 de dezembro como R$ 294.525,00: erro de cem vezes, silencioso,
    e num mês que só tem 5 linhas — exatamente o tipo de coisa que passa
    despercebida numa conferência por amostragem.

    A regra, portanto, é decidir pelo separador presente:
      * tem vírgula  -> pt-BR: ponto é milhar, vírgula é decimal;
      * só ponto, com 3 dígitos depois do último  -> milhar ("1.220" = 1220);
      * só ponto, caso contrário -> decimal ("2945.25" = 2945.25).

    `"SEM_ONUS"` (nov/2025, uma linha) devolve None, não 0.0: zero entraria
    na soma afirmando que a passagem foi de graça, quando o que a fonte diz
    é que o município não pagou por ela.
    """
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    texto = str(v).replace("R$", "").replace("\xa0", " ").strip()
    if not texto or not re.search(r"\d", texto):
        return None  # "SEM_ONUS", "-", ""
    if "," in texto:
        texto = texto.replace(".", "").replace(",", ".")
    elif re.search(r"\.\d{3}$", texto):
        texto = texto.replace(".", "")
    try:
        return float(texto)
    except ValueError:
        return None


def _data(v) -> str | None:
    """Data em ISO, aceitando os dois formatos publicados: `09/06/2026` na
    maioria dos meses e `"2025-12-08 00:00:00"` em dezembro/2025."""
    if v is None:
        return None
    texto = str(v).strip()
    if not texto or texto == "-":
        return None
    m = re.match(r"^(\d{2})/(\d{2})/(\d{4})", texto)
    if m:
        d, mo, y = m.groups()
        iso = f"{y}-{mo}-{d}"
    else:
        m = re.match(r"^(\d{4})-(\d{2})-(\d{2})", texto)
        if not m:
            return None
        iso = f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    try:
        dt.date.fromisoformat(iso)
    except ValueError:
        # Data impossível (31/02, mês 13). Nulo é honesto; a data errada
        # entraria no banco como se fosse boa e quebraria o filtro por ano.
        return None
    return iso


def _vazio(m: dict) -> bool:
    """Linha sem NENHUM campo preenchido.

    O recurso de junho/2026 é literalmente um arquivo de teste
    (`012-passagens_viagens_oficiais_junho_2026-teste.csv`) e tem 57 linhas
    assim das suas 80. O xloader as ingere como registros com todos os
    campos nulos, e o `total` do datastore as conta — quem confiar no total
    acha que junho teve 80 viagens."""
    return not any(str(v or "").strip() for v in m.values())


def _chave_natural(m: dict, ocorrencia: int) -> str:
    """Identificador determinístico de um registro, derivado do conteúdo.

    A fonte não publica id de nenhum tipo: o `_id` do datastore é o número
    da linha na planilha, que muda toda vez que a PBH reingere o arquivo, e
    o resource_id mudaria a chave de uma viagem republicada num mês
    seguinte. Sobra o conteúdo.

    A assinatura usa os campos que descrevem a viagem, já normalizados para
    caixa alta sem acento e sem `_` — assim `Sao_Paulo`, `SAO PAULO` e
    `SÃO_PAULO` produzem a MESMA chave, e a mesma viagem publicada em dois
    recursos entra uma vez só. O valor entra com duas casas fixas para que
    `"R$ 2.945,25"` e `"2945.25"` também convirjam.

    `ocorrencia` é o desempate: se dois registros forem idênticos em tudo (a
    fonte não tem como distinguir duas passagens iguais da mesma pessoa no
    mesmo dia), o segundo vira `...#2` em vez de sobrescrever o primeiro.
    Como a contagem é feita sobre a coleta inteira em ordem fixa, o mesmo
    par de registros recebe os mesmos sufixos em toda rodada — que é o que
    mantém o upsert idempotente.
    """
    def canon(x) -> str:
        t = _texto(x) or ""
        t = unicodedata.normalize("NFD", t)
        return "".join(c for c in t if unicodedata.category(c) != "Mn").upper()

    valor = _valor(_campo(m, "VALOR"))
    partes = [
        canon(_campo(m, "ORGAO")),
        canon(_campo(m, "NOME")),
        canon(_campo(m, "MATRICULA")),
        canon(_campo(m, "CARGO OU FUNCAO")),
        canon(_campo(m, "TIPO DESTINO")),
        canon(_campo(m, "ORIGEM")),
        canon(_campo(m, "DESTINO")),
        f"{valor:.2f}" if valor is not None else "",
        canon(_campo(m, "MOTIVO")),
        _data(_campo(m, "DATA INICIO COMPROMISSO")) or "",
        _data(_campo(m, "DATA SOLICITACAO", "DATA DA SOLICITACAO")) or "",
    ]
    digest = hashlib.sha1("|".join(partes).encode("utf-8")).hexdigest()[:16]
    sufixo = "" if ocorrencia == 1 else f"#{ocorrencia}"
    return f"PBH-CKAN-VIAGENS-{digest}{sufixo}"


def _ler_csv(recurso: dict) -> list[dict]:
    """Fallback para recurso sem datastore ativo.

    Existe porque o datastore do CKAN da PBH não é garantido: basta a
    ingestão do xloader falhar num mês para o recurso aparecer no catálogo
    com `datastore_active: false`, e pular esse mês em silêncio custaria
    dezenas de viagens.

    TRÊS CUIDADOS antes de confiar no texto:

    1. O separador é `;` (medido: o arquivo de junho/2026 abre com
       `ORGAO;NOME;MATRICULA;...`), não vírgula — e vírgula é o default do
       `csv` do Python, que devolveria uma coluna gigante por linha sem
       reclamar.
    2. `newline=""` no buffer, como manda a doc do módulo `csv`: sem isso um
       `\\r\\n` dentro de campo entre aspas quebra a linha no meio.
    3. O arquivo pode simplesmente NÃO SER um CSV. O recurso de
       dezembro/2025 está catalogado como CSV mas o que se baixa é um XLSX
       (começa com `PK\\x03\\x04`), e `csv_do_recurso` o "decodifica" com
       sucesso em cp850 — cp850 e latin-1 aceitam qualquer byte, então a
       detecção de encoding não tem como recusar. Medido nos dois jeitos
       que isso se manifesta: ou o `csv` estoura `_csv.Error` ao tentar ler
       o cabeçalho do binário, ou ele devolve um cabeçalho de lixo. O
       primeiro caso vira RuntimeError aqui (senão subiria como exceção
       crua, que o `__main__` não trata e o operador lê como bug do ETL); o
       segundo é pego pela conferência de `CAMPOS_OBRIGATORIOS`.
    """
    texto, _enc = csv_do_recurso(recurso["url"])
    leitor = csv.DictReader(io.StringIO(texto, newline=""), delimiter=";")
    rotulo = f"recurso {recurso['id']} ({recurso.get('name')})"
    try:
        cabecalho = {_normalizar_chave(c) for c in (leitor.fieldnames or [])}
        faltando = [c for c in CAMPOS_OBRIGATORIOS if c not in cabecalho]
        linhas = [] if faltando else list(leitor)
    except csv.Error as e:
        raise RuntimeError(
            f"{rotulo} não tem datastore e o arquivo baixado não é um CSV legível "
            f"({e}). O catálogo mente sobre o formato de pelo menos um recurso deste "
            "dataset — o de dezembro/2025 é um XLSX anunciado como CSV."
        ) from e
    if faltando:
        raise RuntimeError(
            f"{rotulo} não tem datastore e o arquivo baixado não parece a planilha "
            f"esperada — faltam {faltando} no cabeçalho lido {sorted(cabecalho)!r}."
        )
    return linhas


def _coletar(recurso: dict) -> list[dict]:
    """Registros de um recurso, preferindo o datastore.

    `datastore_search` devolve JSON já tabulado e paginado pela API; baixar
    o CSV custa o arquivo inteiro e ainda obriga a adivinhar encoding e
    separador. Por isso o CSV é fallback, não caminho principal."""
    if recurso.get("datastore_active"):
        return datastore_todos(recurso["id"])
    print(
        f"[etl.pbh.viagens] recurso {recurso.get('name')!r} sem datastore ativo — "
        "caindo para o CSV",
        flush=True,
    )
    return _ler_csv(recurso)


def _mapear(m: dict, bruto: dict, id_municipio: str, link: str, chave: str) -> dict:
    motivo = _texto(_campo(m, "MOTIVO"))
    return {
        "id_municipio": id_municipio,
        # `orgao` é o PODER, como em `etl.camaras.diarias` ('camara'). O
        # órgão de verdade (FMAATM, SLU, EGM SMMA) vai em `orgao_nome`.
        "orgao": "prefeitura",
        "orgao_nome": _texto(_campo(m, "ORGAO")),
        "beneficiario": _texto(_campo(m, "NOME")),
        # Executivo: não há vereador para casar. Ver docstring do módulo.
        "vereador_id": None,
        "cargo": _texto(_campo(m, "CARGO OU FUNCAO")),
        "origem": _texto(_campo(m, "ORIGEM")),
        "destino": _texto(_campo(m, "DESTINO")),
        "tipo_destino": _texto(_campo(m, "TIPO DESTINO")),
        "data_inicio": _data(_campo(m, "DATA INICIO COMPROMISSO")),
        # A fonte publica só a data de início do compromisso; não há data de
        # volta. Nulo em vez de repetir o início, que fingiria uma viagem de
        # um dia.
        "data_fim": None,
        # Passagem não tem quantidade de diárias — ver docstring.
        "qtd_diarias": None,
        "valor": _valor(_campo(m, "VALOR")),
        # O rótulo vem na FRENTE do motivo porque `motivo` é campo de
        # exibição: a ressalva chega ao leitor junto com o dado.
        "motivo": f"{ROTULO_NATUREZA} — {motivo}" if motivo else ROTULO_NATUREZA,
        "natureza": NATUREZA,
        "data_solicitacao": _data(_campo(m, "DATA SOLICITACAO", "DATA DA SOLICITACAO")),
        "chave_natural": chave,
        "link_fonte": link,
        "raw": bruto,
        "updated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
    }


def sync(id_municipio: str) -> None:
    cidade = carregar_municipio(id_municipio)
    host = str(cidade["fontes"].get("prefeitura_dados_abertos_host") or "")
    if HOST_ESPERADO not in host:
        raise RuntimeError(
            f"id_municipio={id_municipio} ({cidade['nome']}) tem "
            f"`fontes.prefeitura_dados_abertos_host`={host!r}, e este módulo lê o "
            f"dataset `{DATASET}` de {HOST_ESPERADO}. Outra cidade com CKAN (São "
            "Paulo tem) publica outro dataset, com outro layout — verifique antes."
        )

    pacote = ckan_action("package_show", id=DATASET)
    # Os recursos são descobertos, não listados à mão: a SMALOG publica um
    # recurso NOVO por mês (setembro/2025 a junho/2026 até agora). Fixar ids
    # no código congelaria o módulo no mês em que foi escrito, e o sintoma
    # seria "o portal parou de atualizar", não um erro.
    recursos = [
        r
        for r in (pacote.get("resources") or [])
        if (r.get("format") or "").strip().upper() != "PDF"
    ]
    if not recursos:
        raise RuntimeError(f"dataset {DATASET} não tem recurso tabular nenhum")
    print(f"[etl.pbh.viagens] recursos tabulares={len(recursos)}", flush=True)

    # Ordem fixa (a do catálogo) porque o desempate de `_chave_natural`
    # depende dela para ser reproduzível entre rodadas.
    coletados: list[tuple[dict, dict, str]] = []
    vazias = 0
    for r in recursos:
        brutos = _coletar(r)
        link = f"{PAGINA_DATASET}/resource/{r['id']}"
        uteis = 0
        for bruto in brutos:
            m = _indexar(bruto)
            if _vazio(m):
                vazias += 1
                continue
            coletados.append((m, bruto, link))
            uteis += 1
        print(
            f"[etl.pbh.viagens] {r.get('name')}: {uteis} com conteúdo "
            f"de {len(brutos)} linhas",
            flush=True,
        )

    if not coletados:
        raise RuntimeError(
            f"nenhum registro com conteúdo em {len(recursos)} recursos — a fonte "
            "mudou de layout ou o datastore está vazio; não vou gravar nada."
        )

    # Confere que o cabeçalho de cada mês ainda entrega o que o mapeamento
    # procura. Uma coluna renomeada devolveria None em silêncio para o
    # dataset inteiro daquele mês.
    for m, _bruto, _link in coletados:
        faltando = [c for c in CAMPOS_OBRIGATORIOS if c not in m]
        if faltando:
            raise RuntimeError(
                f"registro sem os campos {faltando}; chaves vistas: {sorted(m)!r}. "
                "O cabeçalho da fonte mudou — ajuste `_campo`/`CAMPOS_OBRIGATORIOS` "
                "antes de gravar."
            )

    vistas: dict[str, int] = {}
    linhas: dict[str, dict] = {}
    for m, bruto, link in coletados:
        base = _chave_natural(m, 1)
        n = vistas.get(base, 0) + 1
        vistas[base] = n
        chave = _chave_natural(m, n)
        # Dedupe antes do upsert: `ON CONFLICT DO UPDATE` não pode tocar a
        # mesma linha duas vezes na mesma instrução ("cannot affect row a
        # second time"). Com o desempate por ocorrência isto nunca deveria
        # colidir; o dict é a rede que garante.
        linhas[chave] = _mapear(m, bruto, id_municipio, link, chave)

    repetidos = sum(1 for v in vistas.values() if v > 1)
    if repetidos:
        print(
            f"[etl.pbh.viagens] {repetidos} registro(s) idêntico(s) desempatado(s) "
            "por índice de ocorrência",
            flush=True,
        )

    client = get_supabase_client()
    todas = list(linhas.values())
    for i in range(0, len(todas), LOTE):
        client.table("diarias").upsert(
            todas[i : i + LOTE], on_conflict="id_municipio,chave_natural"
        ).execute()

    com_valor = [r["valor"] for r in todas if r["valor"] is not None]
    print(
        f"[etl.pbh.viagens] gravadas={len(todas)} "
        f"(linhas vazias descartadas={vazias}; sem valor={len(todas) - len(com_valor)}) "
        f"soma=R$ {sum(com_valor):,.2f}"
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    args = parser.parse_args()
    try:
        sync(args.id_municipio)
    except RuntimeError as e:
        print(f"[etl.pbh.viagens] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
