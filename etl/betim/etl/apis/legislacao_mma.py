r"""etl.apis.legislacao_mma — legislação ambiental **FEDERAL**, publicada em
dados abertos pelo Ministério do Meio Ambiente e Mudança do Clima.

Fecha a lacuna que o dono apontou: até 2026-08-14 `ambiental_legislacao`
tinha 6.378 normas e **todas eram estaduais de Minas** (Siam 4.077, Semad
2.232, ALMG 69) — nenhuma federal, nem a Resolução CONAMA que rege o
licenciamento que o próprio portal publica.

Fonte: CKAN do MMA, `https://dados.mma.gov.br`, dataset
`417a755c-4449-42e7-a60e-143a83dc130b` ("Legislação Ambiental Brasileira").
Contrato testado ao vivo em 2026-08-15 (plano em `docs/FONTES-CNJ-JUMA.md`
§3; o que entrou de fato, com números, em
`docs/LEGISLACAO-FEDERAL-MMA-CNDH.md`).

═══ LICENÇA ═══

`license_id: "cc-by"` / `license_title: "Creative Commons Atribuição"`,
lido do próprio `package_show` (não presumido). **CC-BY permite
republicar, inclusive com adaptação, desde que atribuída a origem** — este
módulo grava a ementa como a fonte escreve e guarda o link oficial de cada
norma, e a tela credita o MMA. (Diferente do CNDH, cujo CC BY-ND proíbe
obra derivada — ver `etl.apis.legislacao_cndh`.)

═══ AS ARMADILHAS MEDIDAS ═══

1. **`package_search` DO CKAN DO MMA ESTÁ QUEBRADO** — devolve
   `count: 0` para qualquer busca, inclusive para termos que existem no
   dataset. Só `package_show?id={UUID}` funciona. Por isso o UUID está
   fixo neste módulo: não é preguiça de "buscar pelo nome", é a única via
   que responde.

2. **O CSV NÃO SE LÊ COM `split(";")` NEM COM `csv.reader` DIRETO.** O
   arquivo (3.792.066 bytes na versão de 2025-09-19) não usa aspas para
   escapar nada: as 4.012 aspas duplas que ele contém são texto literal
   dentro de ementas. E muitas `EMENTA` têm quebra de linha embutida. A
   regra que desfaz isso foi MEDIDA, não suposta:

       fim de REGISTRO  = CRLF  (8.573 ocorrências = 1 cabeçalho + 8.572)
       quebra DENTRO do campo = LF sozinho (1.844 ocorrências)

   Daí o pré-processamento: trocar todo `\n` **não precedido de `\r`** por
   espaço, e só então passar ao `csv.reader` com `QUOTE_NONE` (as aspas
   são literais — `QUOTE_MINIMAL` comeria caractere de ementa). Resultado:
   **8.572 registros exatos**, e todos os 8.572 começam por um ano de 4
   dígitos. O plano registrava "entre 8.572 e 10.416, número exato exige
   parser de verdade" — o parser de verdade diz 8.572.

3. **280 REGISTROS TÊM MAIS DE 10 CAMPOS** — `;` solto, sem escape, e
   **não só na EMENTA**: o último campo, `REVOGA`, é texto livre que cita
   listas inteiras de dispositivos revogados ("Art. 6º Ficam revogadas:
   I - a Portaria SECEX nº 4, de 6 de janeiro de 2022; II - ..."). Foi o
   erro que a primeira versão deste módulo cometeu: ancorar os 5 últimos
   campos pela DIREITA parece óbvio e funciona nos 8.292 registros
   limpos, mas nos 280 sujos empurra pedaço de `REVOGA` para dentro de
   `STATUS` — e aí a coluna de vigência recebe "VII - a Portaria MMA nº
   475, de 21 de outubro de 2021" em vez de "REVOGADO".

   A leitura correta usa uma ÂNCORA DUPLA sobre vocabulário controlado.
   `ÁREA MMA` (25 valores: IBAMA, ICMBio, CONAMA, SBIO, EXTERNO...) e
   `STATUS` (10 valores: VIGENTE, REVOGADO, ATO EXAURIDO...) são listas
   fechadas; `EMENTA` e `REVOGA` não são. Os dois vocabulários são
   APRENDIDOS dos registros de 10 campos do próprio arquivo (96,7% do
   total) em vez de fixados no código — uma sigla nova de secretaria não
   quebra o coletor, e um vocabulário que explodisse de tamanho (guarda de
   sanidade) para a coleta em vez de gravar lixo. Nos registros sujos, o
   ponto de corte é o maior `j` com `campo[j] ∈ STATUS` **e**
   `campo[j-3] ∈ ÁREA MMA`. Medido em 2026-08-15: **280 de 280 sujos
   resolvidos**, nenhum caindo no ramo degradado.

4. **`Nº ` NO CABEÇALHO TEM ESPAÇO SOBRANDO** e o CSV vem com BOM
   (`utf-8-sig`). Este módulo lê por POSIÇÃO, não por nome de coluna, o
   que torna os dois irrelevantes — mas a conferência do cabeçalho existe
   (`_conferir_cabecalho`) para ABORTAR se a fonte trocar a ordem das
   colunas, em vez de gravar campo trocado em silêncio.

5. **NÃO EXISTE ID PRÓPRIO NO CSV.** O plano sugeria `tipo+número+ano`
   como `id_fonte` — medido, **colide**: 324 chaves repetidas cobrindo 772
   registros (69 decretos sem número no mesmo ano, resoluções CONAMA de
   numeração reiniciada, portarias homônimas). O campo que identifica de
   verdade é `ATO NORMATIVO`, que a própria fonte escreve por extenso e
   COM DATA ("Decreto-Lei nº 25, de 30 de novembro de 1937") — sozinho cai
   para 35 chaves repetidas (71 registros); com o LINK junto, para 3
   chaves (6 registros). `id_fonte = "{ATO normalizado}|{LINK}"`, e as 3
   colisões restantes são desempatadas mantendo a última ocorrência (uma
   delas é duplicata literal da fonte — mesma ementa, mesmo link).
   Perda medida: 3 registros de 8.572.

6. **`ANO` É O ANO DA NORMA, MAS A DATA COMPLETA SÓ EXISTE DENTRO DO
   `ATO NORMATIVO`** — extraída por `_data_do_ato` (7.711 de 8.572, 89,9%).
   Onde a frase não traz data (ex. "PORTARIA IBAMA Nº 154/1998" seco),
   `data` fica `None`; **nunca é inventada a partir do ano**, que produziria
   um 1º de janeiro falso em ~860 normas.

7. **`STATUS` IMPORTA.** 1.483 dos 8.572 registros estão REVOGADOS.
   Gravado em `situacao` (migration 0073) exatamente como a fonte escreve.
   Ver a nota da migration: `null` quer dizer "a fonte não informa", que é
   o caso das três fontes estaduais, e não "está vigente".

═══ O QUE ESTE MÓDULO NÃO FAZ ═══

**Não raspa `conama.mma.gov.br`.** As 511 Resoluções CONAMA já vêm no CSV
com número, ano, ementa e link — a página `index.php?option=com_sisconama&
view=atonormativo&id={N}` só acrescentaria o INTEIRO TEOR, que esta tabela
não guarda de nenhuma fonte. (Se algum dia for preciso: ela redireciona
`http`→`https` e devolve **403 sem User-Agent de navegador** — mesma
armadilha do SIGMINE/ANM em `docs/FONTES-TERRITORIO-E-MINERACAO.md`.
O `UA` deste módulo é o identificável do projeto, e basta para o CKAN e
para o download do CSV, que não filtram por agente.)

**Não lê o "Painel de Legislação do MMA"** (Power BI) — decisão já tomada
em `docs/ambiental/F0-discovery.md` §6 e mantida: o CSV CC-BY cobre o mesmo
universo mais barato e sem ambiguidade de licença.

**Não grava `REVOGA`** (texto livre citando a norma revogada) nem tenta
resolver essa referência para outra linha da tabela — seria um grafo de
revogação, trabalho de outra rodada.

Uso:

    python -m etl.apis.legislacao_mma --sondar
    python -m etl.apis.legislacao_mma --sondar --linhas 20
    python -m etl.apis.legislacao_mma
"""
import argparse
import csv
import datetime as dt
import io
import json
import re
import sys
import unicodedata
from pathlib import Path

import requests
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_fixed

from etl.common import get_supabase_client
from etl.dado_pessoal import mascarar_linha
from etl.apis._legislacao_ambiental import UA, chave_dedup

LOG = "[etl.apis.legislacao_mma]"

CKAN = "https://dados.mma.gov.br/api/3/action/package_show"
DATASET_UUID = "417a755c-4449-42e7-a60e-143a83dc130b"
TIMEOUT = 300

# Armadilha 4: conferido por POSIÇÃO. A lista é o cabeçalho real medido em
# 2026-08-15, já normalizado (sem acento/maiúsculas/espaço sobrando) — se a
# fonte reordenar colunas, o coletor para em vez de gravar campo trocado.
CABECALHO_ESPERADO = (
    "ANO", "DOCUMENTO", "Nº", "ATO NORMATIVO", "EMENTA",
    "AREA MMA", "ASSUNTO", "LINK", "STATUS", "REVOGA",
)

_MESES = {
    "JANEIRO": 1, "FEVEREIRO": 2, "MARCO": 3, "ABRIL": 4, "MAIO": 5, "JUNHO": 6,
    "JULHO": 7, "AGOSTO": 8, "SETEMBRO": 9, "OUTUBRO": 10, "NOVEMBRO": 11, "DEZEMBRO": 12,
}
_RX_DATA_EXTENSO = re.compile(r"\b(\d{1,2})\s+DE\s+([A-Z]+)\s+DE\s+(\d{4})\b")


class FonteMudou(RuntimeError):
    """Layout do CSV ou do CKAN mudou — parar, não adivinhar."""


def _normalizar(s: str) -> str:
    """Maiúsculo, sem acento, espaço único — mesma receita de
    `etl.apis._legislacao_ambiental._normalizar_texto`."""
    base = unicodedata.normalize("NFD", s or "")
    sem_acento = "".join(c for c in base if unicodedata.category(c) != "Mn")
    return " ".join(sem_acento.upper().split())


def _sessao() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = UA
    return s


@retry(
    retry=retry_if_exception_type(requests.exceptions.Timeout),
    stop=stop_after_attempt(3),
    wait=wait_fixed(5),
)
def _pacote(sessao: requests.Session) -> dict:
    """Armadilha 1: `package_show` por UUID. `package_search` devolve
    `count: 0` para tudo neste CKAN."""
    r = sessao.get(CKAN, params={"id": DATASET_UUID}, timeout=TIMEOUT)
    r.raise_for_status()
    corpo = r.json()
    if not corpo.get("success") or "result" not in corpo:
        raise FonteMudou(f"{LOG} package_show sem 'result' — CKAN mudou?")
    return corpo["result"]


def _recurso_csv_mais_novo(pacote: dict) -> dict:
    """O dataset publica um CSV por ano de atualização (2020..2025 medidos).
    Fica o mais recente por `created` — o campo que a própria fonte usa
    para datar o recurso."""
    csvs = [r for r in pacote.get("resources", []) if (r.get("format") or "").upper() == "CSV"]
    if not csvs:
        raise FonteMudou(f"{LOG} nenhum recurso CSV no dataset — publicação mudou de formato?")
    return max(csvs, key=lambda r: r.get("created") or "")


@retry(
    retry=retry_if_exception_type(requests.exceptions.Timeout),
    stop=stop_after_attempt(3),
    wait=wait_fixed(5),
)
def _baixar(sessao: requests.Session, url: str) -> bytes:
    r = sessao.get(url, timeout=TIMEOUT)
    r.raise_for_status()
    return r.content


def _registros(bruto: bytes) -> list[list[str]]:
    """Armadilha 2: reconstrói os registros ANTES de entregar ao `csv`.

    `\\r\\n` termina registro; `\\n` sozinho é quebra de linha dentro da
    EMENTA (medido: 8.573 CRLF contra 10.417 LF no arquivo de 2025). Sem
    esta troca, qualquer parser — inclusive o `csv` da biblioteca padrão —
    corta 1.844 registros ao meio.
    """
    texto = bruto.decode("utf-8-sig")
    texto = re.sub(r"(?<!\r)\n", " ", texto).replace("\r\n", "\n")
    leitor = csv.reader(io.StringIO(texto), delimiter=";", quoting=csv.QUOTE_NONE)
    return [linha for linha in leitor if any(c.strip() for c in linha)]


def _conferir_cabecalho(cabecalho: list[str]) -> None:
    lido = tuple(_normalizar(c) for c in cabecalho)
    if lido != CABECALHO_ESPERADO:
        raise FonteMudou(
            f"{LOG} cabeçalho do CSV mudou.\n  esperado: {CABECALHO_ESPERADO}\n  lido:     {lido}"
        )


def _vocabularios(registros: list[list[str]]) -> tuple[set[str], set[str]]:
    """Armadilha 3: aprende `ÁREA MMA` e `STATUS` dos registros que têm
    exatamente 10 campos (os que nenhum `;` solto embaralhou) — 8.292 de
    8.572 em 2026-08-15. Fixar as listas no código faria o coletor quebrar
    na primeira secretaria nova; aprendê-las do próprio arquivo não."""
    limpos = [r for r in registros if len(r) == 10]
    if len(limpos) < 0.8 * len(registros):
        raise FonteMudou(
            f"{LOG} só {len(limpos)} de {len(registros)} registros têm 10 campos — "
            "o delimitador ou o número de colunas mudou."
        )
    areas = {_normalizar(r[5]) for r in limpos}
    status = {_normalizar(r[8]) for r in limpos}
    # Guarda de sanidade: os dois são vocabulário FECHADO. Se virarem texto
    # livre (centenas de valores distintos), a âncora deixou de valer e
    # continuar seria gravar campo trocado em silêncio.
    if len(areas) > 100 or len(status) > 50:
        raise FonteMudou(
            f"{LOG} vocabulário deixou de ser fechado: {len(areas)} áreas, "
            f"{len(status)} status — a âncora de campos não vale mais."
        )
    return areas, status


def _campos(linha: list[str], areas: set[str], status_vocab: set[str]) -> dict | None:
    """Divide um registro em campos. Os 4 primeiros são sempre posicionais
    (ANO, DOCUMENTO, Nº, ATO NORMATIVO); o corte dos 5 últimos usa a
    âncora dupla ÁREA MMA + STATUS descrita na armadilha 3."""
    if len(linha) < 10:
        return None
    ano, documento, numero, ato = (c.strip() for c in linha[:4])
    corte = None
    if len(linha) == 10:
        corte = 8
    else:
        for j in range(len(linha) - 2, 7, -1):
            if _normalizar(linha[j]) in status_vocab and j - 3 >= 5 and _normalizar(linha[j - 3]) in areas:
                corte = j
                break
    if corte is None:
        # Ramo degradado: preserva a norma (ano/tipo/número/ato/ementa) e
        # descarta os campos que não dá para localizar com segurança —
        # melhor um `situacao` nulo do que um `situacao` errado. Contado em
        # `campos_ambiguos` no diagnóstico, nunca escondido.
        return {
            "ano": ano, "documento": documento, "numero": numero, "ato": ato,
            "ementa": ";".join(linha[4:]).strip(),
            "area": "", "assunto": "", "link": "", "status": "", "ambiguo": True,
        }
    return {
        "ano": ano, "documento": documento, "numero": numero, "ato": ato,
        "ementa": ";".join(linha[4 : corte - 3]).strip(),
        "area": linha[corte - 3].strip(),
        "assunto": linha[corte - 2].strip(),
        "link": linha[corte - 1].strip(),
        "status": linha[corte].strip(),
        "ambiguo": False,
    }


def _data_do_ato(ato: str) -> str | None:
    """Armadilha 6: `"Decreto-Lei nº 25, de 30 de novembro de 1937"` ->
    `"1937-11-30"`. `None` (nunca 1º de janeiro do ano) quando a frase não
    traz data."""
    m = _RX_DATA_EXTENSO.search(_normalizar(ato))
    if not m:
        return None
    mes = _MESES.get(m.group(2))
    if not mes:
        return None
    try:
        return dt.date(int(m.group(3)), mes, int(m.group(1))).isoformat()
    except ValueError:
        return None


def _link(bruto: str) -> str | None:
    """`"SEM LINK"` (172 registros) é a forma que a fonte usa para dizer
    "não há" — vira `None`, não uma URL falsa. Alguns links vêm com aspa
    literal grudada (resíduo do CSV sem escape) e são limpos."""
    limpo = (bruto or "").strip().strip('"').strip()
    if not limpo or _normalizar(limpo) == "SEM LINK":
        return None
    return limpo if limpo.lower().startswith("http") else None


def _linha(c: dict) -> dict | None:
    ato = c["ato"]
    if not ato or not c["documento"]:
        return None
    ano = int(c["ano"]) if c["ano"].isdigit() and len(c["ano"]) == 4 else None
    link = _link(c["link"])
    # Máscara de CPF ANTES de qualquer coisa a jusante: esta função alimenta
    # tanto o `sync()` quanto o `--json`, e o JSON é versionado no repo
    # PÚBLICO. Mascarar no sync deixaria o arquivo exportado sujo; mascarar na
    # exportação deixaria o banco sujo. Aqui é o único ponto por onde as duas
    # saídas passam. Ver `etl/dado_pessoal.py` para o caso que originou isto
    # (Portaria IBAMA 2080/2012, CPF na ementa oficial).
    return mascarar_linha({
        "fonte": "mma",
        # Armadilha 5 — a fonte não tem id; `ATO NORMATIVO` + `LINK` é o
        # que mais perto chega de identificar o ato de forma estável.
        "id_fonte": f"{_normalizar(ato)}|{link or ''}",
        "esfera": "nacional",
        "tipo": c["documento"],          # como a fonte escreve: "RESOLUÇÃO CONAMA", "LEI"...
        "numero": c["numero"] or None,
        "ano": ano,
        "ementa": c["ementa"] or None,
        "data": _data_do_ato(ato),
        "orgao": c["area"] or None,      # IBAMA | ICMBio | CONAMA | SBIO | EXTERNO ...
        "link_pdf": link,
        "situacao": c["status"] or None,  # VIGENTE | REVOGADO | ... (migration 0073)
        "id_ibge_municipio": None,        # norma federal não é territorializável — ver 0065
        "chave_dedup": chave_dedup(c["documento"], c["numero"], ano),
        "indexacao": c["assunto"] or None,  # taxonomia oficial do MMA — ver 0073
    })


def coletar(*, verboso: bool = False) -> tuple[list[dict], dict]:
    sessao = _sessao()
    pacote = _pacote(sessao)
    recurso = _recurso_csv_mais_novo(pacote)
    if verboso:
        print(f"{LOG} dataset {pacote.get('title')!r} | licença: "
              f"{pacote.get('license_id')} ({pacote.get('license_title')})")
        print(f"{LOG} recurso {recurso.get('name')!r} criado em {(recurso.get('created') or '')[:10]}")

    bruto = _baixar(sessao, recurso["url"])
    registros = _registros(bruto)
    if not registros:
        raise FonteMudou(f"{LOG} CSV vazio ({len(bruto)} bytes)")
    _conferir_cabecalho(registros[0])

    areas, status_vocab = _vocabularios(registros[1:])
    diag = {
        "bytes": len(bruto),
        "licenca": f"{pacote.get('license_id')} ({pacote.get('license_title')})",
        "recurso": recurso.get("name"),
        "recurso_url": recurso["url"],
        "registros_csv": len(registros) - 1,
        "areas_vocabulario": len(areas),
        "status_vocabulario": len(status_vocab),
        "campos_ambiguos": 0,
        "descartados": 0,
        "colisoes_id_fonte": 0,
    }

    # Por `id_fonte`, não lista: `id_fonte` repetido no MESMO lote quebra o
    # upsert do Postgres (não só duplica) — mesma cautela dos três
    # coletores estaduais.
    por_id: dict[str, dict] = {}
    for registro in registros[1:]:
        campos = _campos(registro, areas, status_vocab)
        if campos is None:
            diag["descartados"] += 1
            continue
        if campos["ambiguo"]:
            diag["campos_ambiguos"] += 1
        linha = _linha(campos)
        if linha is None:
            diag["descartados"] += 1
            continue
        if linha["id_fonte"] in por_id:
            diag["colisoes_id_fonte"] += 1
        por_id[linha["id_fonte"]] = linha

    return list(por_id.values()), diag


def sondar(max_linhas: int | None) -> None:
    linhas, diag = coletar(verboso=True)
    print(f"\n{LOG} {diag['bytes']} bytes | {diag['registros_csv']} registro(s) no CSV "
          f"| {len(linhas)} para gravar | {diag['descartados']} descartado(s) "
          f"| {diag['colisoes_id_fonte']} colisão(ões) de id_fonte "
          f"| {diag['campos_ambiguos']} com campos ambíguos")
    print(f"{LOG} vocabulário aprendido: {diag['areas_vocabulario']} área(s), "
          f"{diag['status_vocabulario']} status")

    por_tipo: dict[str, int] = {}
    por_situacao: dict[str, int] = {}
    com_data = 0
    for l in linhas:
        por_tipo[_normalizar(l["tipo"])] = por_tipo.get(_normalizar(l["tipo"]), 0) + 1
        por_situacao[l["situacao"] or "(sem situação)"] = por_situacao.get(l["situacao"] or "(sem situação)", 0) + 1
        com_data += 1 if l["data"] else 0
    print(f"{LOG} com data completa: {com_data}/{len(linhas)}")
    print(f"{LOG} tipos mais frequentes:")
    for tipo, n in sorted(por_tipo.items(), key=lambda kv: -kv[1])[:8]:
        print(f"       {n:>5}  {tipo}")
    print(f"{LOG} situação:")
    for sit, n in sorted(por_situacao.items(), key=lambda kv: -kv[1]):
        print(f"       {n:>5}  {sit}")

    for l in linhas[: (max_linhas or 6)]:
        print(f"       {l['tipo'][:26]:<26} {(l['numero'] or ''):<8} {l['ano']} {l['data']} "
              f"chave={l['chave_dedup']!r}  {(l['ementa'] or '')[:50]}")


def exportar_json(caminho: str) -> None:
    """Grava as linhas em arquivo, sem tocar em banco nenhum.

    Existe porque a carga e o banco de destino estão em MÁQUINAS DIFERENTES:
    quem coleta é este desktop, e quem o site lê é o Postgres da máquina de
    build. Sem isto, a única forma de levar as normas até lá seria repetir a
    coleta na outra máquina — refazendo o download do CSV do MMA e torcendo
    para que a fonte não tenha mudado no meio, o que produziria dois conjuntos
    diferentes com o mesmo nome.

    O arquivo carrega as MESMAS linhas que `sync()` gravaria, e é carregado por
    `scripts/carregar-legislacao-federal.mts` na máquina que tem o banco.
    """
    linhas, diag = coletar(verboso=True)
    if not linhas:
        # Arquivo vazio sobrescrevendo um bom seria pior que não exportar:
        # a carga seguinte leria zero linha e concluiria que a fonte esvaziou.
        print(f"{LOG} ABORT: nada coletado — não sobrescrevo {caminho}.", file=sys.stderr)
        sys.exit(1)
    Path(caminho).parent.mkdir(parents=True, exist_ok=True)
    Path(caminho).write_text(
        json.dumps({"fonte": "mma", "linhas": linhas}, ensure_ascii=False, indent=1),
        encoding="utf-8",
    )
    print(f"{LOG} {len(linhas)} linha(s) em {caminho} ({diag['registros_csv']} no CSV de origem).")


def sync() -> None:
    client = get_supabase_client()
    linhas, diag = coletar(verboso=True)
    print(f"{LOG} {diag['registros_csv']} registro(s) no CSV, {len(linhas)} para gravar.")
    if not linhas:
        print(f"{LOG} nada coletado — NÃO apago o que já existe.")
        return
    for i in range(0, len(linhas), 200):
        client.table("ambiental_legislacao").upsert(
            linhas[i : i + 200], on_conflict="fonte,id_fonte"
        ).execute()
    print(f"{LOG} {len(linhas)} linha(s) gravada(s)/atualizada(s) (fonte=mma, esfera=nacional).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sondar", action="store_true", help="consulta e relata, NÃO grava, NÃO lê o banco")
    parser.add_argument("--linhas", type=int, help="quantas amostras imprimir — só com --sondar")
    parser.add_argument("--json", metavar="ARQUIVO", help="grava as linhas em arquivo, NÃO toca no banco")
    args = parser.parse_args()

    try:
        if args.sondar:
            sondar(args.linhas)
        elif args.json:
            exportar_json(args.json)
        else:
            sync()
    except FonteMudou as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
