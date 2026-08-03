"""etl.psp.obras — obras públicas de São Paulo (Obras Abertas) para `obras`.

    python -m etl.psp.obras --id-municipio 3550308

FONTE: **Obras Abertas** (`https://obrasabertas.prefeitura.sp.gov.br`), o
portal de obras públicas da PMSP escrito pela PRODAM. Não é o CKAN: o CKAN
municipal não tem o acervo de obras (ver "POR QUE NÃO O CKAN", abaixo, com
os seis datasets medidos). O portal é um ASP.NET MVC com um botão de
exportação, e é esse export que este módulo consome:

    POST /Obras/DownloadCsvObras   (corpo vazio = sem filtro)  -> {"ok":true}
    GET  /Obras/Download           -> text/csv, ~1,1 MB, 1.532 obras

TUDO ABAIXO FOI MEDIDO AO VIVO EM 2026-08-03.

TRANSPORTE. Não precisa de `curl_cffi` (a PBH precisa, por causa do WAF
GoCache). Testadas cinco variantes — com e sem o GET prévio em `/Obras`, com
e sem `X-Requested-With`, com o User-Agent padrão do `python-requests` e em
`http://` — e **as cinco devolveram os mesmos 1.532 registros**. O que é
obrigatório é a MESMA SESSÃO nas duas chamadas: o POST monta o CSV no estado
de sessão do servidor e o GET só entrega o que aquela sessão montou; com
dois clientes diferentes o GET não acha arquivo. O portal tem CAPTCHA, mas
só no formulário de reclamação/denúncia — o export não passa por ele.
`https` é forçado por regra da casa (ver `etl/psp/servidores.py`: o CKAN de
SP devolve desafio de bot com HTTP 200 em `http`). Aqui `http` funcionou,
mas depender disso é apostar na configuração de amanhã.

ENCODING: **utf-8-sig** (BOM `EF BB BF`), separador `;`. Isto NÃO é o padrão
de São Paulo — os dois arquivos da SEGES em `servidores.py` são CP850 e os
CSVs de obras da SME no CKAN são cp1252. Por isso a detecção aqui é a cadeia
estrita completa (utf-8-sig → utf-8 → cp1252 → cp850 → latin-1) e o módulo
IMPRIME qual venceu: latin-1 aceita qualquer byte sem erro e grava mojibake
calado, então cair nela é aviso, não silêncio.

COBERTURA (1.532 obras):
  * origem: SME 1.131, SIURB 401. **É só isso que o portal cobre.** As 363
    obras em equipamentos esportivos da SEME e as obras de subprefeitura não
    estão no Obras Abertas — conferido: nenhuma das 363 linhas da planilha da
    SEME casa com nome de obra do portal.
  * situação: CONCLUÍDA 848, EM ANDAMENTO 681, SUSPENSA 3. O filtro "NÃO
    INICIADA" existe na tela e devolve 0 — testado pedindo o export só com
    esse status, então o zero é da fonte, não deste código. Ao contrário de
    BH (que só publica obra concluída), aqui a página mostra obra em
    andamento de verdade.
  * datas: início de 2020-10 a 2025-12, término previsto até 2028-12.
  * lat/lng em **1.532 de 1.532**, em graus decimais WGS84 (nada de UTM —
    não precisa da conversão de Snyder que `etl/pbh/obras.py` faz à mão).
    bbox medida: lat −23,8744..−23,3993; lng −46,8072..−46,3665.

A ARMADILHA CARA — O VALOR É DO CONTRATO, NÃO DA OBRA, E VEM REPETIDO.
As colunas monetárias se chamam todas "... DO CONTRATO", e quando um
contrato cobre várias obras o MESMO valor aparece em cada linha. Medido:
705 contratos para 1.532 obras; 183 contratos cobrem 1.010 obras (um
contrato de manutenção escolar chega a 25 unidades, com
`R$8.055.791,80` repetido em cada uma). Somar por obra dá
**R$ 18.547.284.925,39**; o valor realmente contratado é
**R$ 10.096.343.278,80**. Uma inflação de 84% — e o card "Valor total das
obras" de `/prefeitura/obras` soma exatamente essa coluna.

Que a soma correta é a deduplicada não é opinião: a home do próprio portal
publica o total por categoria e a soma dela é R$ 10.091.014.743,97. Cinco
das seis categorias batem ao centavo com a dedupe por contrato; só
"Unidades de Educação" fica 0,17% acima (há um processo, 7910202200001707,
com 12 contratos SPOBRAS distintos, e o portal agrupa por um id interno que
o export não traz).

Daí a regra deste módulo: **`valor` só é gravado quando o contrato pertence
a UMA obra só** — nem outra obra com o mesmo NÚMERO DO CONTRATO, nem com o
mesmo PROCESSO. São 483 obras, R$ 8.085.715.128,88, 80,1% do dinheiro que o
portal anuncia, e a soma NUNCA passa do real. As outras 1.049 ficam com
`valor` NULL, e a página já sabe dizer "Soma de 483 das 1.532 obras — as
demais não têm valor publicado".

As duas alternativas foram descartadas com motivo: ratear o contrato entre
as obras inventaria um preço por escola que a Prefeitura não publica; pôr o
contrato inteiro na primeira obra e NULL nas outras faria a página afirmar
que uma escola custou R$ 12 milhões quando o contrato cobre seis.

O PERCENTUAL, E POR QUE "R$ 0,00 EXECUTADO" NÃO É ZERO.
`VALOR EXECUTADO DO CONTRATO` vem R$ 0,00 em 1.133 das 1.532 linhas — e
1.131 delas são **todas** as obras de origem SME. Não é obra sem execução:
é origem que não reporta execução. Prova: das 401 obras SIURB, 399 têm
executado > 0. Dividir cegamente marcaria 585 obras que a própria
Prefeitura declara CONCLUÍDA como "0% executado", com a barra de progresso
vazia. A regra é:

  1. CONCLUÍDA -> 100. É a leitura direta do que a Prefeitura declara, e é a
     mesma regra de `etl/pbh/obras.py`.
  2. senão, executado > 0 -> executado/total (limitado a 100). Para obra em
     andamento é o único sinal de avanço que a fonte dá, e ele é coerente:
     mediana 57,3% em EM ANDAMENTO contra 99,7% em CONCLUÍDA.
  3. senão -> NULL. Nunca 0.

O passo 1 tem um efeito colateral consciente: as 263 obras concluídas que
TÊM execução financeira reportada (mediana 99,7%, mas há caso de 1,3%)
entram como 100 em vez do número financeiro. É de propósito — "% executado"
na página é lido como quanto da obra está pronta, e uma obra concluída com
barra em 1% seria contradita pelo próprio selo ao lado. Execução financeira
de contrato concluído mede pagamento, não construção.

BAIRRO. A coluna mais fina que a fonte dá é `DISTRITO`, e **só a SME a
preenche**: 92 dos 96 distritos oficiais aparecem nas 1.131 obras de escola,
enquanto as 401 obras da SIURB trazem todas "Não aplicável" (ou a variante
corrompida "N o aplic vel", que vem torta da própria fonte) e ficam com
`bairro` NULL. A única localidade que a SIURB dá é a sigla de duas letras da
subprefeitura ("SE", "LA", "MO") — expandi-la exigiria uma tabela das 32
subprefeituras de São Paulo escrita aqui dentro, que é o tipo de constante
de cidade que `scripts/conferir_defaults_de_cidade.py` existe para impedir.
Distrito também não é bairro — contém vários —, então vai gravado como
"Distrito Lapa", pelo mesmo motivo que BH grava "Regional Nordeste": rótulo
sem qualificação vira leitura errada. Os nomes vêm SEM ACENTO da fonte
("Saude", "Se", "Bras") e ficam assim, pelo mesmo motivo da sigla.

LINK. O portal TEM ficha por obra (`/Obras/VisualizarObra?cdObra=783`), mas
ela não serve de permalink: o `cdObra` é um id interno diferente do `CÓDIGO
OBRA` do export (testado — `cdObra=10778` e `cdObra=20649`, dois códigos
reais do CSV, caem na home) e a ficha ainda depende da sessão que rodou a
busca. `link_fonte` aponta para a busca do portal, como em BH aponta para a
página do dataset.

POR QUE NÃO O CKAN (o caminho andado antes de chegar aqui). Buscando
"obra/obras/contrato de obra/siurb/spobras" no CKAN de SP saem oito
datasets. Nenhum serve, e cada um por um motivo medido:
  * `controle-de-obras-siurb` — 354 obras + 114 serviços em XLSX, com valor
    e coordenada. Parecia a escolha óbvia e não é: **o conteúdo está
    congelado em jan/2022** (maior `dt_atualizacao` 2022-01-03, ainda que o
    CKAN mostre o arquivo republicado em 2025-11-19) e as 354 estão TODAS
    com `status_obra=2` (CONCLUÍDA). É um dump antigo do mesmo sistema —
    tem até a coluna `obras_abertas`. Cobre 2013-2022 e o Obras Abertas
    cobre 2021-2028: só 42 dos 354 processos aparecem nos dois. Fica como
    candidato a `--historico` no futuro, não como fonte principal.
  * `obras-unidades-educacionais` (SME) — 2.738 linhas em 12 CSVs anuais
    (2013-2024), com valor mas **sem situação e sem coordenada**, e a
    unidade escolar no lugar do nome da obra. Somar isto às 1.131 obras SME
    que já vêm do Obras Abertas duplicaria a mesma obra em duas grafias.
  * `obras-emergenciais` (Subprefeitura Pirituba/Jaraguá) — 29 linhas, e o
    "cabeçalho" do CSV é o título do relatório. Uma subprefeitura de 32.
  * `planilha-de-obras` (Subprefeitura Itaim Paulista) — 2 XLSX, uma
    subprefeitura de 32.
  * `obras-nos-equipamentos-esportivos` (SEME) — 363 obras com valor e
    empresa, mas o STATUS é texto livre por linha ("FINALIZADA, PORÉM NÃO
    ENTREGUE DEVIDO A..."), o que viraria um filtro de 363 opções na página.
    É a lacuna real do Obras Abertas e um bom segundo módulo.
  * `fluxo-de-caixa-sp-obras` — fluxo de caixa da EMPRESA SP Obras. É
    finança da estatal, não lista de obra.
  * `obra-de-urbanizacao` (SEHAB) — shapefile em .zip, sem leitor no
    ambiente.
Nenhum dataset de LICENÇA/ALVARÁ de obra entrou: em SP, como em BH, isso é
obra de particular, não obra da prefeitura.

IDEMPOTÊNCIA. `obras` não tem UNIQUE além da pk (`obras_pkey` + a FK de
município), então não há upsert possível. Mesma saída de `etl/pbh/obras.py`:
`refresh_completo_seguro`, que apaga só o `id_municipio` pedido e se RECUSA
a apagar se a fonte trouxer menos linhas do que já existem no banco. As 595
obras de BH e as 59 de Betim não são tocadas.

Cron: semanal (o portal atualiza por demanda, não em calendário fixo).
"""

import argparse
import csv
import html
import io
import re
import sys
import unicodedata
from collections import Counter

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    carregar_municipio,
    get_supabase_client,
    refresh_completo_seguro,
)

LOG = "[etl.psp.obras]"

# Chave de `municipios.fontes` com o host do portal. O host NÃO mora aqui:
# ver `supabase/betim/migrations/0032_fonte_obras_abertas_sp.sql`.
CHAVE_FONTES = "obras_abertas_host"

CAMINHO_BUSCA = "/Obras"
CAMINHO_GERAR = "/Obras/DownloadCsvObras"
CAMINHO_BAIXAR = "/Obras/Download"

# Colunas do export que este módulo lê. Conferidas contra o cabeçalho antes
# de mapear qualquer linha: se a PRODAM renomear uma delas, o `DictReader`
# devolveria None em silêncio e a tabela receberia 1.532 obras sem nome.
COL_CODIGO = "CÓDIGO OBRA"
COL_PROCESSO = "PROCESSO"
COL_DISTRITO = "DISTRITO"
COL_LAT = "LATITUDE"
COL_LNG = "LONGITUDE"
COL_NOME = "NOME DA OBRA"
COL_STATUS = "STATUS"
COL_CATEGORIA = "CATEGORIA"
COL_CONTRATO = "NÚMERO DO CONTRATO"
COL_VALOR_TOTAL = "VALOR TOTAL DO CONTRATO"
COL_VALOR_EXEC = "VALOR EXECUTADO DO CONTRATO"

COLUNAS_OBRIGATORIAS = (
    COL_CODIGO, COL_PROCESSO, COL_DISTRITO, COL_LAT, COL_LNG, COL_NOME,
    COL_STATUS, COL_CATEGORIA, COL_CONTRATO, COL_VALOR_TOTAL, COL_VALOR_EXEC,
)

# Piso de sanidade. O portal anuncia 1.532; um export com um punhado de
# linhas é publicação quebrada, e reescrever a tabela com sobra é pior do
# que abortar. `refresh_completo_seguro` já barra redução, mas este piso pega
# o caso em que a tabela ainda está vazia (São Paulo hoje) e a trava de
# redução não teria o que comparar.
MINIMO_LINHAS = 100

# ~0,75° é uns 83 km. São Paulo tem ~70 km de norte a sul (o extremo de
# Marsilac fica 0,46° abaixo do centróide gravado em `municipios`), então a
# folga de 0,5° que serve a BH apertaria demais aqui. Continua estreito o
# bastante para pegar troca de sistema de coordenadas, que joga o ponto para
# outro estado ou para o Atlântico.
TOLERANCIA_GRAUS = 0.75

# "1123 obras" e "R$2.109.403.166,45" nos cards da home. Servem de contagem
# ANUNCIADA, para comparar com o que o export trouxe — é a mesma checagem de
# `etl/pbh/legislacao.py` (coletados × anunciados), e é o que transforma uma
# subcoleta silenciosa em aviso.
_CARD_HOME = re.compile(
    r"<h2><span>(?P<cat>.*?)<br\s*/?>\s*(?P<qtd>[\d.]+)\s*obras</span></h2>"
    r"\s*<p>Valores contratados<strong>(?P<valor>[^<]+)</strong>",
    re.I | re.S,
)

# "R$8.055.791,80", "R$0,00" e também "-R$5.367.790,82" — o sinal aparece
# ANTES do símbolo nesta fonte (49 aditamentos negativos no export de hoje).
# Um parser que só aceitasse o sinal depois do "R$" devolveria None e o
# valor sumiria em silêncio no dia em que a coluna de aditamento for lida.
_RE_MOEDA = re.compile(r"^(?P<sinal>-)?\s*R?\$?\s*(?P<n>-?[\d.]*\d(?:,\d+)?)$")


# --------------------------------------------------------------------------
# Transporte
# --------------------------------------------------------------------------


def _base(cidade: dict) -> str:
    """A raiz do portal, derivada de `municipios.fontes`, sempre em https.

    O host sai do banco (é dado da cidade) e o esquema é forçado — mesma
    decisão de `etl/psp/servidores.py`, onde o valor gravado para SP começa
    com `http://` e o CKAN responde desafio de bot com HTTP 200 nesse
    esquema. Aqui o `http` funcionou hoje; forçar https custa nada e tira a
    aposta.
    """
    host = str((cidade.get("fontes") or {}).get(CHAVE_FONTES) or "").strip()
    if not host:
        raise RuntimeError(
            f"`municipios.fontes.{CHAVE_FONTES}` está vazio para "
            f"{cidade['id_municipio']} ({cidade['nome']}-{cidade['uf']}). "
            "O host do portal de obras sai do banco, não do código — rode "
            "supabase/betim/migrations/0032_fonte_obras_abertas_sp.sql, ou "
            "semeie a fonte se esta cidade usar outro portal."
        )
    return "https://" + host.split("://", 1)[-1].rstrip("/")


@retry(stop=stop_after_attempt(4), wait=wait_exponential(multiplier=1, min=3, max=45))
def _exportar(sessao: requests.Session, base: str) -> bytes:
    """O CSV completo do acervo, sem nenhum filtro.

    As duas chamadas TÊM de sair da mesma `Session`: o POST monta o arquivo
    no estado de sessão do servidor e o GET entrega o que aquela sessão
    montou. Corpo vazio no POST é "sem filtro" — conferido pedindo também
    com todas as regiões, categorias, subcategorias e status marcados, que
    devolve exatamente as mesmas 1.532 linhas.
    """
    resp = sessao.post(f"{base}{CAMINHO_GERAR}", data={}, timeout=300)
    resp.raise_for_status()
    try:
        corpo = resp.json()
    except ValueError as e:
        raise RuntimeError(
            f"{CAMINHO_GERAR} respondeu 200 mas não é JSON ({resp.text[:120]!r}). "
            "Se o corpo for HTML, o portal mudou de rota — reabra "
            f"{base}{CAMINHO_BUSCA} e releia /Scripts/Site/Obras/Index.js."
        ) from e
    if not corpo.get("ok"):
        raise RuntimeError(f"{CAMINHO_GERAR} devolveu {corpo!r} — export não foi gerado.")

    arquivo = sessao.get(f"{base}{CAMINHO_BAIXAR}", timeout=300)
    arquivo.raise_for_status()
    tipo = (arquivo.headers.get("content-type") or "").lower()
    if "csv" not in tipo:
        raise RuntimeError(
            f"{CAMINHO_BAIXAR} devolveu content-type {tipo!r} em vez de text/csv "
            f"({len(arquivo.content)} bytes). O GET provavelmente saiu de outra "
            "sessão que a do POST, e o portal caiu na home."
        )
    return arquivo.content


def _anunciado(sessao: requests.Session, base: str) -> dict[str, int]:
    """`{categoria: qtd_obras}` como a home do portal anuncia.

    Não é enfeite: é o único contador independente do export. Sem ele, uma
    mudança no endpoint que passasse a devolver só uma fatia do acervo
    entraria como "sucesso" e o `refresh_completo_seguro` só pegaria o caso
    em que a tabela já tem mais linhas.
    """
    try:
        pagina = sessao.get(f"{base}/", timeout=120)
        pagina.raise_for_status()
    except Exception as e:  # noqa: BLE001
        print(f"{LOG} AVISO: home não abriu ({type(e).__name__}) — sem contagem anunciada.")
        return {}

    achados: dict[str, int] = {}
    for m in _CARD_HOME.finditer(pagina.text):
        cat = html.unescape(m.group("cat")).strip()
        achados[cat] = int(m.group("qtd").replace(".", ""))
    if not achados:
        print(f"{LOG} AVISO: não achei os cards de contagem na home — layout mudou?")
    return achados


def _decodificar(brutos: bytes) -> tuple[str, str]:
    """`(texto, encoding)`, testando a cadeia inteira em modo ESTRITO.

    A ordem importa e latin-1 é o último recurso porque ela decodifica
    QUALQUER byte sem levantar exceção: se viesse antes, venceria sempre e
    entregaria mojibake calado. cp850 vem antes dela pelo motivo documentado
    em `etl/psp/servidores.py` — os arquivos da SEGES são code page de DOS,
    e a mesma prefeitura publica em pelo menos três encodings diferentes.
    Este export é utf-8-sig, mas isso é medição de hoje, não contrato.
    """
    for enc in ("utf-8-sig", "utf-8", "cp1252", "cp850"):
        try:
            return brutos.decode(enc), enc
        except UnicodeDecodeError:
            continue
    print(
        f"{LOG} AVISO: o export não decodifica em utf-8/cp1252/cp850; caindo em "
        "latin-1, que aceita qualquer byte — confira os acentos antes de confiar."
    )
    return brutos.decode("latin-1"), "latin-1 (duvidoso)"


# --------------------------------------------------------------------------
# Conversões
# --------------------------------------------------------------------------


def _dinheiro(bruto: str | None) -> float | None:
    """"R$8.055.791,80" -> 8055791.8. Devolve None para vazio e para zero.

    Zero vira None de propósito: nesta fonte R$ 0,00 significa "esta origem
    não reporta o campo" (ver o docstring do módulo), e um zero gravado é
    indistinguível de "a obra não custou nada" na hora de somar.
    """
    t = (bruto or "").strip()
    if not t:
        return None
    m = _RE_MOEDA.match(t)
    if not m:
        return None
    try:
        valor = float(m.group("n").replace(".", "").replace(",", "."))
    except ValueError:
        return None
    if m.group("sinal"):
        valor = -valor
    return valor or None


def _coordenada(bruto: str | None) -> float | None:
    t = (bruto or "").strip().replace(",", ".")
    if not t:
        return None
    try:
        return float(t)
    except ValueError:
        return None


def _plausivel(lat: float | None, lng: float | None, cidade: dict) -> bool:
    """O ponto cai perto do centróide do município declarado em `municipios`?

    Rede de segurança contra a fonte trocar o sistema de coordenadas sem
    avisar. Um CRS diferente não gera exceção: gera número, e número errado
    vira alfinete no lugar errado do mapa sem ninguém perceber.
    """
    if lat is None or lng is None:
        return False
    clat, clng = cidade.get("lat"), cidade.get("lng")
    if clat is None or clng is None:
        return True  # sem referência no banco, não dá para julgar
    return (
        abs(lat - float(clat)) <= TOLERANCIA_GRAUS
        and abs(lng - float(clng)) <= TOLERANCIA_GRAUS
    )


def _sem_acento(texto: str) -> str:
    t = unicodedata.normalize("NFD", texto or "")
    return "".join(c for c in t if unicodedata.category(c) != "Mn")


def _bairro(distrito: str | None) -> str | None:
    """O distrito, rotulado como distrito. Ver o bloco BAIRRO na docstring."""
    limpo = (distrito or "").strip()
    if not limpo:
        return None
    # "Não aplicável" e a variante corrompida "N o aplic vel" (os acentos
    # chegam como espaço da própria fonte) não são lugar nenhum.
    chave = " ".join(_sem_acento(limpo).upper().split())
    if chave in ("NAO APLICAVEL", "N O APLIC VEL", "-"):
        return None
    return f"Distrito {limpo}"


def _percentual(status: str | None, executado: float | None, total: float | None) -> float | None:
    """Ver o bloco "O PERCENTUAL" na docstring do módulo: concluída é 100,
    em andamento é a execução financeira quando ela existe, e o resto é NULL
    — nunca zero."""
    rotulo = _sem_acento((status or "").strip()).lower()
    if rotulo.startswith("conclu"):
        return 100.0
    if executado and total:
        return round(min(100.0, executado / total * 100.0), 2)
    return None


def _valores_atribuiveis(linhas: list[dict]) -> dict[int, float]:
    """`{índice da linha: valor}` só para as obras cujo contrato é delas.

    A conta que este método impede está no docstring: o mesmo
    `VALOR TOTAL DO CONTRATO` aparece em cada obra do contrato, e a página
    soma a coluna. Uma obra só recebe o valor quando NENHUMA outra divide
    com ela o número do contrato NEM o número do processo — os dois, porque
    nenhum dos dois sozinho identifica o contrato nesta fonte (há processo
    com 12 contratos SPOBRAS distintos, e há número de contrato repetido
    entre processos).
    """
    por_contrato = Counter((l.get(COL_CONTRATO) or "").strip() for l in linhas)
    por_processo = Counter((l.get(COL_PROCESSO) or "").strip() for l in linhas)
    saida: dict[int, float] = {}
    for i, l in enumerate(linhas):
        contrato = (l.get(COL_CONTRATO) or "").strip()
        processo = (l.get(COL_PROCESSO) or "").strip()
        # Sem identificação de contrato não dá para provar que o valor é
        # exclusivo desta obra: fica de fora, que é o lado seguro.
        if not contrato or not processo:
            continue
        if por_contrato[contrato] != 1 or por_processo[processo] != 1:
            continue
        valor = _dinheiro(l.get(COL_VALOR_TOTAL))
        if valor is not None:
            saida[i] = valor
    return saida


def _mapear(linha: dict, id_municipio: str, cidade: dict, valor: float | None,
            base: str) -> dict:
    lat = _coordenada(linha.get(COL_LAT))
    lng = _coordenada(linha.get(COL_LNG))
    if not _plausivel(lat, lng, cidade):
        lat = lng = None
    status = (linha.get(COL_STATUS) or "").strip() or None
    nome = (linha.get(COL_NOME) or "").strip()
    return {
        "id_municipio": id_municipio,
        # A caixa alta é a da fonte, e é a mesma de Betim ("INICIADA", "EM
        # LICITAÇÃO"). A página monta o filtro de situação a partir desta
        # coluna, então normalizar aqui criaria rótulo que a fonte não usa.
        "nome": nome or "(sem descrição)",
        "situacao": status,
        "valor": valor,
        "percentual_execucao": _percentual(
            status,
            _dinheiro(linha.get(COL_VALOR_EXEC)),
            _dinheiro(linha.get(COL_VALOR_TOTAL)),
        ),
        "bairro": _bairro(linha.get(COL_DISTRITO)),
        "lat": round(lat, 7) if lat is not None else None,
        "lng": round(lng, 7) if lng is not None else None,
        "link_fonte": f"{base}{CAMINHO_BUSCA}",
    }


# --------------------------------------------------------------------------
# Sync
# --------------------------------------------------------------------------


def sync(id_municipio: str, permitir_reducao: bool = False) -> int:
    cidade = carregar_municipio(id_municipio)
    base = _base(cidade)
    print(f"{LOG} {cidade['nome']}-{cidade['uf']} ({id_municipio}) em {base}")

    sessao = requests.Session()
    sessao.headers.update({"Referer": f"{base}{CAMINHO_BUSCA}"})
    anunciado = _anunciado(sessao, base)

    texto, encoding = _decodificar(_exportar(sessao, base))
    cabecalho = texto.splitlines()[0] if texto else ""
    # Separador farejado no próprio arquivo: em `etl/pbh/obras.py` o mesmo
    # dataset mudou de vírgula para ponto e vírgula entre dois recursos, e
    # fixar o separador não levanta exceção — devolve o número certo de
    # linhas com duas colunas gigantes.
    sep = ";" if cabecalho.count(";") > cabecalho.count(",") else ","
    print(f"{LOG} encoding={encoding} separador={sep!r} bytes_texto={len(texto)}")

    brutas = [
        r for r in csv.DictReader(io.StringIO(texto), delimiter=sep)
        if any((v or "").strip() for v in r.values())
    ]
    if len(brutas) < MINIMO_LINHAS:
        raise RuntimeError(
            f"o export devolveu {len(brutas)} linha(s) (piso {MINIMO_LINHAS}). O portal "
            f"anunciava {sum(anunciado.values()) or '?'} obras — isto é publicação "
            f"quebrada, não queda real. Confira em {base}{CAMINHO_BUSCA}."
        )
    faltando = [c for c in COLUNAS_OBRIGATORIAS if c not in brutas[0]]
    if faltando:
        raise RuntimeError(
            f"o export não tem as colunas {faltando} (veio com "
            f"{list(brutas[0].keys())[:8]}...). O layout mudou — remapeie antes de "
            "gravar, senão a tabela vira 1.500 '(sem descrição)'."
        )

    # Uma obra por CÓDIGO OBRA. Hoje os 1.532 códigos são distintos; a
    # dedupe é para o dia em que o export repetir uma linha, porque a
    # gravação é insert puro e a repetição não daria erro nenhum.
    unicas: dict[str, dict] = {}
    for r in brutas:
        unicas.setdefault((r.get(COL_CODIGO) or "").strip() or f"__{len(unicas)}", r)
    if len(unicas) != len(brutas):
        print(f"{LOG} AVISO: {len(brutas) - len(unicas)} linha(s) repetiam CÓDIGO OBRA.")
    ordenadas = list(unicas.values())

    total_anunciado = sum(anunciado.values())
    if total_anunciado:
        for cat, qtd in sorted(anunciado.items()):
            obtido = sum(1 for r in ordenadas if (r.get(COL_CATEGORIA) or "").strip() == cat)
            marca = "ok" if obtido == qtd else "DIVERGE"
            print(f"{LOG} {cat}: export {obtido} / home anuncia {qtd} [{marca}]")
        if len(ordenadas) < total_anunciado:
            raise RuntimeError(
                f"o export trouxe {len(ordenadas)} obras e a home do portal anuncia "
                f"{total_anunciado}. Subcoleta — não reescrevo a tabela com menos do "
                "que a própria fonte diz ter."
            )

    atribuiveis = _valores_atribuiveis(ordenadas)
    linhas = [
        _mapear(r, id_municipio, cidade, atribuiveis.get(i), base)
        for i, r in enumerate(ordenadas)
    ]

    sem_ponto = sum(1 for l in linhas if l["lat"] is None)
    if sem_ponto:
        print(f"{LOG} AVISO: {sem_ponto}/{len(linhas)} obras sem lat/lng plausível")
    if sem_ponto > len(linhas) / 2:
        raise RuntimeError(
            f"{sem_ponto} de {len(linhas)} obras ficaram sem coordenada plausível — "
            "provável troca de sistema de coordenadas na fonte (o esperado é grau "
            "decimal WGS84). Nada foi gravado."
        )

    com_valor = [l for l in linhas if l["valor"] is not None]
    soma_atribuida = sum(l["valor"] for l in com_valor)
    soma_ingenua = sum(
        _dinheiro(r.get(COL_VALOR_TOTAL)) or 0.0 for r in ordenadas
    )
    print(
        f"{LOG} valor: {len(com_valor)}/{len(linhas)} obras com contrato exclusivo, "
        f"R$ {soma_atribuida:,.2f}. (Somar a coluna crua daria R$ {soma_ingenua:,.2f}, "
        "que conta o mesmo contrato uma vez por obra.)"
    )
    print(f"{LOG} situações: {dict(Counter(l['situacao'] for l in linhas))}")
    print(
        f"{LOG} percentual: {sum(1 for l in linhas if l['percentual_execucao'] is not None)}"
        f"/{len(linhas)} preenchidos"
    )

    gravou = refresh_completo_seguro(
        client=get_supabase_client(),
        table="obras",
        filtros={"id_municipio": id_municipio},
        rows=linhas,
        permitir_reducao=permitir_reducao,
        rotulo="etl.psp.obras",
    )
    if not gravou:
        return 0
    print(f"{LOG} id_municipio={id_municipio} obras={len(linhas)}")
    return len(linhas)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument(
        "--permitir-reducao",
        action="store_true",
        help="autoriza reescrever mesmo se o portal trouxer menos obras que o banco "
        "(use só depois de confirmar na fonte que as obras sumiram)",
    )
    args = parser.parse_args()
    try:
        sync(args.id_municipio, permitir_reducao=args.permitir_reducao)
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
