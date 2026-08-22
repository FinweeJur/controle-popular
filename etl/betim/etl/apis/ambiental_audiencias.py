r"""etl.apis.ambiental_audiencias — audiências públicas de EIA/RIMA do
licenciamento ambiental de Minas Gerais (SEMAD), coletadas ficha a ficha
pelo `id` interno do sistema, NUNCA pelo grid paginado.

Fonte: `https://sistemas.meioambiente.mg.gov.br/licenciamento/site/`
  - `view-audiencia?id=N`  — a FICHA de uma audiência, uma `<table
    id="w0">` com `<tr><th>Rótulo</th><td>Valor</td></tr>` por linha.
  - `consulta-audiencia?page=N` — o GRID paginado. Só usado para leitura
    manual de conferência (fixture `grid-audiencia.html`) — este módulo
    NUNCA o percorre para coletar. Ver a seção seguinte.

═══ POR QUE NÃO PERCORRER O GRID (medido ao vivo em 2026-08-20) ═══

O grid anuncia **"2.287 itens"** no resumo ("A exibir X-Y de 2.287
itens"), e um coletor ingênuo leria isso como "2.287 audiências, N
páginas de tamanho fixo, pronto". **Os dois pressupostos são falsos**:

  1. O NÚMERO DE LINHAS POR PÁGINA VARIA, sem aviso no HTML. A página 1
     rendeu 12 `<tr data-key>`; as páginas 2, 3, 4 e 5 renderam **8**
     cada — mas o resumo de cada uma delas anuncia uma JANELA de 20
     ("A exibir 21-28", "41-48", "61-68" — sempre +20 no início da
     janela seguinte, nunca +8). A página 114 (fim da lista) rendeu 20
     linhas cheias. Uma janela que avança de 20 em 20 enquanto o número
     de linhas RENDERIZADAS oscila (12, 8, 8, 8, ..., 20) é a assinatura
     de uma consulta com JUNÇÃO/AGRUPAMENTO no lado do servidor, em que
     `2.287` é a contagem ANTES de agrupar — não o número de audiências
     distintas. Paginar por aqui perde linha em silêncio: nenhum erro,
     nenhum aviso, só menos dado do que existe.
  2. As fichas individuais vivem em `view-audiencia?id=N`, com
     **N de 1 a 1016** (confirmado ao vivo: id=1016 responde 200,
     id=1017 em diante responde HTTP 500 com corpo `<title>Erro
     (#2)</title>`). Uma amostra de 20 ids espalhados no intervalo
     devolveu 19 respostas 200 — densidade de ~95%, sem relação
     numérica direta com o "2.287" do grid.

**Portanto este módulo ENUMERA IDS de 1 até um teto DESCOBERTO em tempo
de execução** (sobe até acumular `MAX_ERROS_CONSECUTIVOS` = 25 respostas
"não existe" seguidas, e para) — nunca lê `consulta-audiencia`. É
completo por construção (nenhuma janela de paginação para errar) e imune
ao bug de agrupamento do grid.

═══ O HOST DEVOLVE HTTP 500 INTERMITENTE — A GUARDA TEM DE LER O CORPO ═══

Quatro tentativas seguidas na MESMA url (`view-audiencia?id=1013`)
devolveram, na ordem: **500 · 200 · 200 · 200**. Um coletor que tratasse
qualquer 500 como "audiência não existe" declararia inexistente uma
ficha que existe — e um coletor que confiasse cegamente no primeiro 500
perderia dado de verdade por instabilidade passageira do host, não por
ausência real.

A distinção certa é pelo CORPO, não pelo status:

  - 500 com `<title>Erro (#2)</title>` no corpo -> o id de fato não
    existe (confirmado com id=1017 em diante, sempre esse título).
  - 500 com QUALQUER outro corpo -> instabilidade do host. `buscar_ficha`
    RETENTA com espera crescente: 5s, 15s, 45s (3 tentativas). Se as três
    esgotarem sem sucesso, levanta `RuntimeError` com o id no texto —
    nunca grava linha vazia como se fosse dado real.

Antes de tentar extrair qualquer campo, `_extrair_campos` exige a marca
da tabela de rótulos (`id="w0"` com a classe `detail-view`). Sem ela,
exceção com o id no texto — a mesma disciplina "não confiar no status"
se estende a "não confiar em corpo 200 que não tem a forma esperada".

═══ CASOS-ÂNCORA (o `--sondar` prova estes três, ao vivo) ═══

  - **id=1013** — SIMOES AGRONEGOCIOS, processo 33646/2026, classe 1,
    modalidade "LAC - LAC1 (LOC)", município **Buritizeiro**. "Link EIA
    / Rima" é uma pasta pública do Google Drive
    (`13TN4oO29Bavr7xEXiIFVNFJYxIHeuA_7`) com 4 arquivos: `9. EIA FAZ
    PALESTINA.pdf`, `9.1 RIMA FAZ PALESTINA.pdf`, `10. PCA.pdf`,
    `ART_ESTUDOS.pdf` — o caso que prova a classificação por regex com
    fronteira de palavra (o prefixo numérico "9." e "9.1" na frente do
    nome não pode confundir "EIA" com "RIMA").
  - **id=1015** — Vale, **Ouro Preto**, classe 4. "Link EIA / Rima" é
    `http://www.vale.com/projetosmg` — URL ARBITRÁRIA, não Google Drive.
    Este é o FALLBACK: grava o link, `repositorio_tipo="externo"`,
    `documentos=[]`, e NUNCA tenta raspar o site da Vale.
  - **id=1017** — não existe (corpo com `Erro (#2)`, ver acima). Prova
    que a guarda distingue "não existe" de "instável" corretamente.

═══ PRIVACIDADE: A COLUNA CNPJ/CPF TRAZ CPF EM CLARO ═══

Medido: `000.000.000-00 (CPF real, redigido aqui)` (CPF de 11 dígitos, com máscara de CPF) aparece
como valor da coluna "CNPJ/CPF" em pelo menos uma ficha da amostra. Este
módulo NUNCA grava o valor bruto do campo — só a classificação
(`documento_classificacao`), a raiz do CNPJ (8 primeiros dígitos, só
quando o documento é pessoa jurídica) e o booleano `eh_pessoa_fisica`.
Pessoa física implica sempre `cnpj_raiz=None`. Diferente do WFS de
`ambiental_licenciamento` (que traz o documento cru sem máscara e sem
indicação de tipo), este campo já vem com pontuação de CPF (11 dígitos)
ou de CNPJ (14 dígitos) — a extração de dígitos por si só já separa os
dois na maioria dos casos, mas `_classificar_documento` ainda valida
pelo dígito verificador (mod 11) antes de confiar no comprimento, e
qualquer comprimento fora de 11/14 ou dígito verificador que não bate
cai no lado protetor (`eh_pessoa_fisica=True`, sem raiz).

═══ MUNICÍPIO: CATÁLOGO LOCAL, NUNCA BANCO ═══

A Neon está em HTTP 402 até 2026-09-01 — sem banco não há como rodar
`resolver_municipio_mg` (que consulta `ref_municipios_mg` via SQL). Este
módulo resolve contra o GeoJSON estático
`apps/web/public/terras/globo/dados/camadas/municipios-mg.geojson`
(853 feições, `properties.nome` + `properties.geocodigo`) — o mesmo
arquivo que alimenta o globo 3D, carregado uma vez e cacheado em
memória. O campo "Município(s) do Empreendimento" pode trazer mais de
um nome, separados por vírgula OU por barra (nunca por " e " nas
amostras vistas — diferente do padrão do COPAM em `copam_reunioes.py`);
`_resolver_municipios` divide por `[,/]` e resolve cada pedaço
independentemente, gravando `municipios_ids`/`municipios_nomes` como
arrays PARALELOS e o que não casar em `municipios_nao_resolvidos` — sem
descartar nada em silêncio.

═══ CLASSE DO ESTUDO: REGEX COM FRONTEIRA DE PALAVRA ═══

`9. EIA FAZ PALESTINA.pdf` tem de virar `eia`, e `9.1 RIMA FAZ
PALESTINA.pdf` tem de virar `rima` — mesmo com o prefixo numérico
grudado na frente. `\bEIA\b`/`\bRIMA\b`/`\bPCA\b`/`\bRCA\b`/`\bART\b`
(nessa ordem, mas a ordem não importa aqui: os cinco não se
sobrepõem) resolvem isso porque `\b` marca fronteira entre dígito/ponto
e letra tanto quanto entre letra e espaço. Sem nenhum dos cinco casar,
`classe_estudo="outro"` e `classe_estudo_confianca="indefinido"`.

═══ O QUE ESTE MÓDULO NÃO FAZ ═══

Não grava no Postgres (a Neon está em 402) — só em JSON, com `--saida`,
incremental (grava a cada ficha coletada, porque uma rodada completa é
~1.900 requisições a ~2,5s cada, ~80 minutos, e VAI ser interrompida).
Ao reiniciar, pula todo `id_fonte` já presente no JSON de saída E sem
`documentos_erro` gravado (ver `_carregar_estado_existente`). Não segue
o link "externo" da Vale nem de qualquer outra fonte fora do Google
Drive — grava o link e para, por decisão de escopo (regra do projeto:
não é fallback tentar raspar todo host que aparecer no campo).

Uso:

    python -m etl.apis.ambiental_audiencias --sondar
    python -m etl.apis.ambiental_audiencias --saida docs/ambiental-audiencias.json
    python -m etl.apis.ambiental_audiencias --saida X.json --de 1 --ate 50
    python -m etl.apis.ambiental_audiencias --saida X.json --sem-drive
"""
from __future__ import annotations

import argparse
import datetime as dt
import html as html_mod
import json
import re
import sys
import time
import unicodedata
from pathlib import Path

import requests

LOG = "[etl.apis.ambiental_audiencias]"

BASE = "https://sistemas.meioambiente.mg.gov.br/licenciamento/site"
DETALHE_URL = f"{BASE}/view-audiencia"
UA = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"
TIMEOUT = 60

# Regra D (educação): uma requisição por vez, com pausa — aplicada depois
# de CADA GET de verdade (ficha e listagem de pasta do Drive).
ATRASO_ENTRE_REQUISICOES = 2.5

# Regra B: 500 intermitente do host. Espera crescente entre as 3
# retentativas de um 500 que NÃO é "Erro (#2)".
ESPERAS_INSTABILIDADE = (5, 15, 45)

# Enumeração de id (nunca do grid — ver docstring do módulo). Medido ao
# vivo: o teto real é 1016. A margem de segurança é generosa para o dia
# em que a fonte crescer, mas o corte por erros CONSECUTIVOS é o que de
# fato decide onde parar.
MAX_ERROS_CONSECUTIVOS = 25
TETO_SEGURANCA_PADRAO = 5000

DRIVE_FOLDER_RE = re.compile(r"drive\.google\.com/drive/folders/([A-Za-z0-9_-]+)")
DRIVE_LIST_URL = "https://drive.google.com/embeddedfolderview?id={folder_id}#list"
DRIVE_DOWNLOAD_URL = "https://drive.google.com/uc?export=download&id={file_id}"

MUNICIPIOS_GEOJSON_PATH = (
    Path(__file__).resolve().parents[4]
    / "apps" / "web" / "public" / "terras" / "globo" / "dados" / "camadas"
    / "municipios-mg.geojson"
)

SAIDA_PADRAO = Path(__file__).resolve().parents[2] / "dados" / "ambiental-audiencias.json"

# Regra F0 §14.3 do irmão `copam_reunioes.py`: a fonte declara um total
# inflado; este é o valor MEDIDO ao vivo, gravado no JSON de saída como
# contexto, nunca usado para decidir quando parar de coletar.
TOTAL_DECLARADO_PELO_GRID = 2287
NOTA_TOTAL_DECLARADO = (
    "contagem inflada por junção/agrupamento no lado do servidor — a página 1 do "
    "grid rende 12 linhas, as páginas 2-5 rendem 8 cada anunciando janelas de 20 "
    "('A exibir 21-28' etc.), a página 114 rende 20; não é o número de audiências. "
    "Este coletor enumera 'id' de view-audiencia diretamente, nunca pagina o grid."
)

# Regra G: fronteira de palavra — "EIA" é substring de outras palavras, e o
# prefixo numérico do nome do arquivo ("9. EIA...", "9.1 RIMA...") não pode
# atrapalhar. `\b` marca fronteira tanto entre dígito/ponto e letra quanto
# entre letra e espaço, então cobre os dois casos sem regra especial.
_CLASSE_ESTUDO_PADROES = (
    ("eia", re.compile(r"\bEIA\b", re.IGNORECASE)),
    ("rima", re.compile(r"\bRIMA\b", re.IGNORECASE)),
    ("pca", re.compile(r"\bPCA\b", re.IGNORECASE)),
    ("rca", re.compile(r"\bRCA\b", re.IGNORECASE)),
    ("art", re.compile(r"\bART\b", re.IGNORECASE)),
)


class BloqueadoPelaFonte(SystemExit):
    """403/429/CAPTCHA/token — regra de parada do projeto: nunca retentar,
    nunca trocar User-Agent, só avisar o operador e sair."""


# ────────────────────────────── HTTP / guarda ───────────────────────────


def _sessao() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = UA
    return s


def _guardar_contra_bloqueio(status: int, corpo: str, id_fonte: int) -> None:
    """Regra C: 403/429, CAPTCHA no corpo, ou exigência de token ⇒ para,
    não retenta, não contorna. Roda em TODA resposta, antes de qualquer
    outra decisão sobre o status."""
    if status in (403, 429):
        raise BloqueadoPelaFonte(
            f"{LOG} HTTP {status} em id={id_fonte} — a fonte pode estar bloqueando "
            "o acesso. Pare a coleta e avise o operador; não retentar, não trocar "
            "User-Agent, não contornar."
        )
    corpo_lower = corpo.lower()
    if "captcha" in corpo_lower or "recaptcha" in corpo_lower:
        raise BloqueadoPelaFonte(
            f"{LOG} corpo de id={id_fonte} contém desafio de CAPTCHA — pare a "
            "coleta e avise o operador."
        )


# Confirmado ao vivo: id inexistente devolve HTTP 500 com este título.
_EH_INEXISTENTE_RE = re.compile(r"Erro\s*\(#2\)", re.IGNORECASE)


def buscar_ficha(sessao: requests.Session, id_fonte: int) -> str | None:
    """Devolve o corpo HTML da ficha, ou `None` se o id de fato não existe
    (corpo com "Erro (#2)"). Levanta `BloqueadoPelaFonte` em bloqueio, e
    `RuntimeError` se um 500 "instável" (corpo SEM "Erro (#2)") persistir
    depois das 3 retentativas de `ESPERAS_INSTABILIDADE` — ver a seção do
    módulo sobre o 500 intermitente medido ao vivo (500 · 200 · 200 · 200
    em 4 tentativas seguidas na mesma URL)."""
    url = f"{DETALHE_URL}?id={id_fonte}"
    tentativa = 0
    while True:
        r = sessao.get(url, timeout=TIMEOUT)
        corpo = r.text
        _guardar_contra_bloqueio(r.status_code, corpo, id_fonte)
        time.sleep(ATRASO_ENTRE_REQUISICOES)

        if r.status_code == 200:
            return corpo

        if r.status_code == 500:
            if _EH_INEXISTENTE_RE.search(corpo):
                return None
            if tentativa >= len(ESPERAS_INSTABILIDADE):
                raise RuntimeError(
                    f"{LOG} id={id_fonte}: HTTP 500 instável (corpo sem 'Erro (#2)') "
                    f"— esgotadas as {len(ESPERAS_INSTABILIDADE)} retentativas. "
                    f"Corpo (300 primeiros chars): {corpo[:300]!r}"
                )
            espera = ESPERAS_INSTABILIDADE[tentativa]
            print(f"{LOG} id={id_fonte}: HTTP 500 instável — retentando em {espera}s "
                  f"(tentativa {tentativa + 1}/{len(ESPERAS_INSTABILIDADE)})...")
            time.sleep(espera)
            tentativa += 1
            continue

        r.raise_for_status()


# ─────────────────────────────── HTML utilitário ────────────────────────


def _texto_limpo(fragmento_html: str | None) -> str:
    """Remove tags, decodifica entidades HTML, colapsa espaço."""
    if not fragmento_html:
        return ""
    sem_tag = re.sub(r"<[^>]+>", " ", fragmento_html)
    decodificado = html_mod.unescape(sem_tag)
    return " ".join(decodificado.split())


def _extrair_href(fragmento_html: str | None) -> str | None:
    if not fragmento_html:
        return None
    m = re.search(r'href="([^"]+)"', fragmento_html)
    return html_mod.unescape(m.group(1)) if m else None


def _normalizar_rotulo(s: str) -> str:
    """NFD sem acento, minúsculo, espaço único — como pedido: casar rótulo
    por texto normalizado, nunca por posição na tabela."""
    base = unicodedata.normalize("NFD", s or "")
    sem_acento = "".join(c for c in base if unicodedata.category(c) != "Mn")
    return " ".join(sem_acento.lower().split())


# A tabela de rótulos: `id="w0"` com a classe `detail-view` (medido nas
# duas fichas-âncora). Exigida ANTES de tentar extrair qualquer campo —
# regra B: nunca gravar linha vazia como se fosse dado real.
_MARCA_TABELA_RE = re.compile(r'<table id="w0"[^>]*class="[^"]*detail-view[^"]*"[^>]*>(.*?)</table>', re.DOTALL)
_LINHA_TABELA_RE = re.compile(r"<tr><th>(.*?)</th><td>(.*?)</td></tr>", re.DOTALL)


def _extrair_campos(corpo: str, id_fonte: int) -> dict[str, str]:
    """`{rótulo_normalizado: valor_bruto_com_html}`. Levanta `RuntimeError`
    com o id no texto se a tabela de rótulos esperada não estiver
    presente — HTTP 200 não é garantia de forma esperada."""
    m = _MARCA_TABELA_RE.search(corpo)
    if not m:
        raise RuntimeError(
            f"{LOG} id={id_fonte}: HTTP 200 mas sem a tabela de rótulos esperada "
            "(id=\"w0\" class=\"...detail-view...\") — recusando gravar linha vazia. "
            f"Corpo (300 primeiros chars): {corpo[:300]!r}"
        )
    campos: dict[str, str] = {}
    for rotulo_bruto, valor_bruto in _LINHA_TABELA_RE.findall(m.group(1)):
        campos[_normalizar_rotulo(_texto_limpo(rotulo_bruto))] = valor_bruto
    return campos


# ──────────────────────────── documento (CPF/CNPJ) ──────────────────────


def _digito_verificador_mod11(digitos: list[int], pesos: list[int]) -> int:
    soma = sum(d * p for d, p in zip(digitos, pesos))
    resto = soma % 11
    return 0 if resto < 2 else 11 - resto


def _valida_cpf(cpf: str) -> bool:
    if len(cpf) != 11 or len(set(cpf)) == 1:
        return False
    n = [int(c) for c in cpf]
    dv1 = _digito_verificador_mod11(n[:9], list(range(10, 1, -1)))
    dv2 = _digito_verificador_mod11(n[:10], list(range(11, 1, -1)))
    return n[9] == dv1 and n[10] == dv2


def _valida_cnpj(cnpj: str) -> bool:
    if len(cnpj) != 14 or len(set(cnpj)) == 1:
        return False
    n = [int(c) for c in cnpj]
    pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    dv1 = _digito_verificador_mod11(n[:12], pesos1)
    dv2 = _digito_verificador_mod11(n[:13], pesos2)
    return n[12] == dv1 and n[13] == dv2


def _classificar_documento(bruto: str | None) -> dict:
    """Devolve `{"classificacao", "cnpj_raiz", "eh_pessoa_fisica"}`. O
    valor BRUTO nunca é devolvido nem gravado — regra de privacidade do
    projeto: a coluna "CNPJ/CPF" desta fonte traz CPF em claro (medido:
    "000.000.000-00 (CPF real, redigido aqui)"). Diferente de `ambiental_licenciamento` (documento
    sem máscara, comprimento ambíguo), aqui o valor já vem PONTUADO —
    11 dígitos com máscara de CPF ou 14 com máscara de CNPJ — mas o
    comprimento sozinho não é motivo de confiança: ainda passa pelo
    dígito verificador (mod 11) antes de classificar. Qualquer coisa que
    não valide, ou que não tenha 11/14 dígitos, cai no lado protetor
    (pessoa física, sem raiz) — nunca inventa uma classificação."""
    raw = "" if bruto is None else _texto_limpo(bruto)
    digitos = re.sub(r"\D", "", raw)

    if not digitos:
        return {"classificacao": "ausente", "cnpj_raiz": None, "eh_pessoa_fisica": True}

    if len(digitos) == 14:
        if _valida_cnpj(digitos):
            return {"classificacao": "cnpj", "cnpj_raiz": digitos[:8], "eh_pessoa_fisica": False}
        return {"classificacao": "cnpj_invalido_tratado_como_pf", "cnpj_raiz": None, "eh_pessoa_fisica": True}

    if len(digitos) == 11:
        if _valida_cpf(digitos):
            return {"classificacao": "cpf", "cnpj_raiz": None, "eh_pessoa_fisica": True}
        return {"classificacao": "cpf_invalido_tratado_como_pf", "cnpj_raiz": None, "eh_pessoa_fisica": True}

    # Comprimento fora de 11/14 — não visto na amostra, mas não impossível
    # numa fonte que muda. Lado protetor, igual ao "ambíguo" do irmão.
    return {"classificacao": "indeterminado_tratado_como_pf", "cnpj_raiz": None, "eh_pessoa_fisica": True}


# ─────────────────────────────── outros campos ──────────────────────────


_CLASSE_RE = re.compile(r"classe\s*(\d+)", re.IGNORECASE)


def _extrair_classe(texto: str) -> int | None:
    """`"classe 1"` -> `1`. `None` se o texto não bater no padrão (campo
    vazio ou formato mudou — melhor ausente que inventado)."""
    m = _CLASSE_RE.search(texto or "")
    return int(m.group(1)) if m else None


def _dividir_atividades(texto: str) -> list[str]:
    """O grid mostra várias atividades separadas por " / " (com espaços
    dos dois lados, ex. "G-02-08-9 / G-02-07-0 / G-01-03-1"); a ficha, na
    amostra vista, sempre trouxe uma única descrição em texto corrido,
    com VÍRGULAS internas de linguagem natural ("Culturas anuais,
    semiperenes e perenes, ..."). Dividir por vírgula fragmentaria uma
    frase só em pedaços sem sentido — este helper divide SÓ por " / "
    (delimitador com espaço dos dois lados, nunca visto dentro de uma
    descrição corrida), preservando o texto inteiro como item único
    quando não há esse separador."""
    texto = (texto or "").strip()
    if not texto:
        return []
    partes = [p.strip() for p in re.split(r"\s*/\s*", texto) if p.strip()]
    return partes or [texto]


def _data_iso(bruto: str | None) -> str | None:
    """`"DD/MM/AAAA"` -> `"AAAA-MM-DD"`."""
    s = (bruto or "").strip()
    if not s:
        return None
    partes = s.split("/")
    if len(partes) != 3:
        return None
    try:
        d, m, a = (int(p) for p in partes)
        return dt.date(a, m, d).isoformat()
    except ValueError:
        return None


# ─────────────────────────── município (catálogo local) ─────────────────


def _normalizar_municipio(s: str) -> str:
    base = unicodedata.normalize("NFD", s or "")
    sem_acento = "".join(c for c in base if unicodedata.category(c) != "Mn")
    return " ".join(sem_acento.upper().split())


_cache_catalogo_municipios: dict[str, tuple[str, str]] | None = None


def _carregar_catalogo_municipios(caminho: Path = MUNICIPIOS_GEOJSON_PATH) -> dict[str, tuple[str, str]]:
    """`{nome_normalizado: (geocodigo, nome_oficial)}` das 853 feições do
    GeoJSON local — NUNCA o banco (Neon em HTTP 402 até 2026-09-01).
    Cacheado no processo: cada rodada resolve até ~1.900 fichas contra o
    mesmo catálogo pequeno."""
    global _cache_catalogo_municipios
    if _cache_catalogo_municipios is None:
        with open(caminho, encoding="utf-8") as f:
            dados = json.load(f)
        _cache_catalogo_municipios = {
            _normalizar_municipio(feicao["properties"]["nome"]): (
                feicao["properties"]["geocodigo"],
                feicao["properties"]["nome"],
            )
            for feicao in dados["features"]
        }
    return _cache_catalogo_municipios


def _resolver_municipios(
    bruto: str, catalogo: dict[str, tuple[str, str]]
) -> tuple[list[str], list[str], list[str]]:
    """`(municipios_ids, municipios_nomes, municipios_nao_resolvidos)` —
    os dois primeiros são arrays PARALELOS (mesmo índice = mesma cidade).
    O campo pode trazer vários municípios separados por vírgula OU barra
    (regra F) — nunca por " e ", diferente do padrão do COPAM. O que não
    casa contra o catálogo vai para `municipios_nao_resolvidos`, nunca é
    descartado calado."""
    bruto = (bruto or "").strip()
    if not bruto:
        return [], [], []

    ids: list[str] = []
    nomes: list[str] = []
    nao_resolvidos: list[str] = []
    vistos: set[str] = set()

    for parte in (p.strip() for p in re.split(r"[,/]", bruto)):
        if not parte:
            continue
        resolvido = catalogo.get(_normalizar_municipio(parte))
        if resolvido is None:
            nao_resolvidos.append(parte)
            continue
        geocodigo, nome_oficial = resolvido
        if geocodigo in vistos:
            continue
        vistos.add(geocodigo)
        ids.append(geocodigo)
        nomes.append(nome_oficial)

    return ids, nomes, nao_resolvidos


# ───────────────────────── repositório (Drive / externo) ────────────────


def _classificar_repositorio(link_eia_rima: str | None) -> tuple[str, str | None]:
    """`("drive", folder_id)` | `("externo", None)` | `("ausente", None)`.
    Regra: Drive é o caminho principal (raspa a listagem); URL arbitrária
    é FALLBACK que grava o link e NÃO tenta expandir (caso-âncora 1015:
    Vale, `http://www.vale.com/projetosmg` — nunca raspar o site dela)."""
    if not link_eia_rima:
        return "ausente", None
    m = DRIVE_FOLDER_RE.search(link_eia_rima)
    if m:
        return "drive", m.group(1)
    return "externo", None


def _classe_estudo(nome_arquivo: str) -> tuple[str, str]:
    for classe, padrao in _CLASSE_ESTUDO_PADROES:
        if padrao.search(nome_arquivo):
            return classe, "regex"
    return "outro", "indefinido"


# A listagem anônima do Drive: cada arquivo é um bloco iniciado por
# `id="entry-<FILE_ID>"`, com `flip-entry-title">nome.pdf` em algum ponto
# adiante do MESMO bloco (medido: até ~2000 chars de distância, por causa
# de miniatura/ícone/metadado entre o id e o título). Cortar o HTML em
# fatias delimitadas pelas ocorrências consecutivas de `id="entry-...")`
# evita casar o título de UM arquivo com o id de OUTRO.
_DRIVE_ENTRY_ID_RE = re.compile(r'id="entry-([^"]+)"')
_DRIVE_ENTRY_TITLE_RE = re.compile(r'flip-entry-title">([^<]+)<')


def _listar_pasta_drive(sessao: requests.Session, folder_id: str) -> list[dict]:
    """`[{"nome_arquivo", "classe_estudo", "classe_estudo_confianca",
    "id_drive", "url_download"}]` — raspa a listagem PÚBLICA e ANÔNIMA da
    pasta (`embeddedfolderview`), sem autenticação. Levanta em caso de
    falha de rede/parsing; quem chama decide o que fazer (gravar em
    `documentos_erro`, nunca abortar a ficha inteira por isso)."""
    url = DRIVE_LIST_URL.format(folder_id=folder_id)
    r = sessao.get(url, timeout=TIMEOUT)
    r.raise_for_status()
    corpo = r.text
    time.sleep(ATRASO_ENTRE_REQUISICOES)

    ids_encontrados = list(_DRIVE_ENTRY_ID_RE.finditer(corpo))
    documentos = []
    for i, m in enumerate(ids_encontrados):
        inicio = m.start()
        fim = ids_encontrados[i + 1].start() if i + 1 < len(ids_encontrados) else len(corpo)
        bloco = corpo[inicio:fim]
        titulo_m = _DRIVE_ENTRY_TITLE_RE.search(bloco)
        if not titulo_m:
            continue
        file_id = m.group(1)
        nome_arquivo = html_mod.unescape(titulo_m.group(1)).strip()
        classe, confianca = _classe_estudo(nome_arquivo)
        documentos.append({
            "nome_arquivo": nome_arquivo,
            "classe_estudo": classe,
            "classe_estudo_confianca": confianca,
            "id_drive": file_id,
            "url_download": DRIVE_DOWNLOAD_URL.format(file_id=file_id),
        })
    return documentos


# ─────────────────────────────── montagem da ficha ──────────────────────


def _montar_audiencia(id_fonte: int, campos: dict[str, str], catalogo: dict) -> dict:
    doc = _classificar_documento(campos.get("cnpj/cpf"))

    municipio_bruto = _texto_limpo(campos.get("municipio(s) do empreendimento"))
    municipios_ids, municipios_nomes, municipios_nao_resolvidos = _resolver_municipios(municipio_bruto, catalogo)

    link_iof = _extrair_href(campos.get("link iof")) or (_texto_limpo(campos.get("link iof")) or None)
    link_eia_rima = _extrair_href(campos.get("link eia / rima")) or (_texto_limpo(campos.get("link eia / rima")) or None)

    return {
        "id_fonte": id_fonte,
        "numero_processo": _texto_limpo(campos.get("processo")) or None,
        "nome_empreendimento": _texto_limpo(campos.get("empreendimento")) or None,
        "cnpj_raiz": doc["cnpj_raiz"],
        "eh_pessoa_fisica": doc["eh_pessoa_fisica"],
        "documento_classificacao": doc["classificacao"],
        "municipios_ids": municipios_ids,
        "municipios_nomes": municipios_nomes,
        "municipios_nao_resolvidos": municipios_nao_resolvidos,
        "unidade_regional": _texto_limpo(campos.get("unidade")) or None,
        "classe": _extrair_classe(_texto_limpo(campos.get("classe"))),
        "modalidade": _texto_limpo(campos.get("modalidade")) or None,
        "atividades_descricoes": _dividir_atividades(_texto_limpo(campos.get("atividade(s) do empreendimento"))),
        "data_publicacao": _data_iso(_texto_limpo(campos.get("data publicacao"))),
        "data_limite_solicitacao": _data_iso(_texto_limpo(campos.get("data limite de solicitacao"))),
        "link_iof": link_iof,
        "link_eia_rima": link_eia_rima,
        "repositorio_tipo": "ausente",  # ajustado por `coletar_uma`
        "documentos": [],
        "documentos_erro": None,
    }


def coletar_uma(
    sessao: requests.Session, catalogo: dict, id_fonte: int, *, sem_drive: bool = False
) -> dict | None:
    """Coleta 1 ficha inteira: fetch + parse + resolução de município +
    (se aplicável) expansão da pasta do Drive. Devolve `None` se o id não
    existe. Levanta `BloqueadoPelaFonte`/`RuntimeError` para cima — quem
    chama decide se aborta a rodada inteira ou só pula este id."""
    corpo = buscar_ficha(sessao, id_fonte)
    if corpo is None:
        return None

    campos = _extrair_campos(corpo, id_fonte)
    audiencia = _montar_audiencia(id_fonte, campos, catalogo)

    tipo, folder_id = _classificar_repositorio(audiencia["link_eia_rima"])
    audiencia["repositorio_tipo"] = tipo

    if tipo == "drive" and not sem_drive:
        try:
            audiencia["documentos"] = _listar_pasta_drive(sessao, folder_id)
        except Exception as e:
            audiencia["documentos_erro"] = f"{type(e).__name__}: {e}"
            print(f"{LOG} id={id_fonte}: falhou expandir pasta do Drive ({folder_id}): {e}")
    # tipo == "externo": grava o link, nunca raspa (caso-âncora 1015).
    # tipo == "ausente": nada a expandir.
    # sem_drive=True: expansão deliberadamente pulada, documentos_erro fica None.

    return audiencia


# ─────────────────────────────── sondar ────────────────────────────────


_IDS_ANCORA = (1013, 1015, 1017)


def sondar() -> None:
    """Busca só os TRÊS casos-âncora documentados no módulo, ao vivo, sem
    gravar nada e sem enumerar o resto do intervalo. Prova (1) a ficha com
    pasta do Drive normal, (2) o fallback de repositório externo, e (3) a
    distinção correta entre "id não existe" e "instabilidade"."""
    sessao = _sessao()
    catalogo = _carregar_catalogo_municipios()

    for id_fonte in _IDS_ANCORA:
        print(f"\n{LOG} sondando id={id_fonte}...")
        try:
            audiencia = coletar_uma(sessao, catalogo, id_fonte)
        except BloqueadoPelaFonte:
            raise
        except Exception as e:
            print(f"{LOG}   ERRO ao coletar id={id_fonte}: {type(e).__name__}: {e}")
            continue

        if audiencia is None:
            print(f"{LOG}   id={id_fonte}: NÃO EXISTE (confirmado pelo corpo 'Erro (#2)').")
            continue

        print(f"{LOG}   empreendimento: {audiencia['nome_empreendimento']!r}")
        print(f"{LOG}   processo: {audiencia['numero_processo']!r}  classe: {audiencia['classe']}  "
              f"modalidade: {audiencia['modalidade']!r}")
        print(f"{LOG}   município(s): ids={audiencia['municipios_ids']} "
              f"nomes={audiencia['municipios_nomes']} nao_resolvidos={audiencia['municipios_nao_resolvidos']}")
        print(f"{LOG}   documento: classificacao={audiencia['documento_classificacao']} "
              f"cnpj_raiz={audiencia['cnpj_raiz']} eh_pessoa_fisica={audiencia['eh_pessoa_fisica']}")
        print(f"{LOG}   link_eia_rima={audiencia['link_eia_rima']!r} "
              f"repositorio_tipo={audiencia['repositorio_tipo']!r}")
        if audiencia["documentos_erro"]:
            print(f"{LOG}   documentos_erro: {audiencia['documentos_erro']}")
        for doc in audiencia["documentos"]:
            print(f"{LOG}     - {doc['nome_arquivo']:<32} classe_estudo={doc['classe_estudo']} "
                  f"(confianca={doc['classe_estudo_confianca']})  id_drive={doc['id_drive']}")

    print(f"\n{LOG} sondagem concluída — {len(_IDS_ANCORA)} caso(s)-âncora testado(s) ao vivo, nada gravado.")


# ─────────────────────────────── retomada / gravação ────────────────────


def _carregar_estado_existente(saida: Path) -> tuple[dict, dict[int, dict], list[int]]:
    """`(estado_bruto, audiencias_validas_por_id, ids_inexistentes)`. Um
    id conta como "já coletado E válido" quando está presente no JSON de
    saída SEM `documentos_erro` gravado — regra E (retomada): pula o que
    já está bom, tenta de novo o que falhou."""
    if not saida.exists():
        return {}, {}, []
    with open(saida, encoding="utf-8") as f:
        estado = json.load(f)
    por_id = {}
    for a in estado.get("audiencias", []):
        if a.get("documentos_erro") is None:
            por_id[a["id_fonte"]] = a
    return estado, por_id, list(estado.get("ids_inexistentes", []))


def _gravar(
    saida: Path,
    audiencias_por_id: dict[int, dict],
    ids_inexistentes: list[int],
    id_maximo_encontrado: int,
) -> None:
    saida.parent.mkdir(parents=True, exist_ok=True)
    corpo = {
        "coletado_em": dt.datetime.now(dt.timezone.utc).isoformat(),
        "fonte": DETALHE_URL,
        "id_maximo_encontrado": id_maximo_encontrado,
        "ids_inexistentes": sorted(set(ids_inexistentes)),
        "total_declarado_pelo_grid": TOTAL_DECLARADO_PELO_GRID,
        "nota_total_declarado": NOTA_TOTAL_DECLARADO,
        "audiencias": [audiencias_por_id[i] for i in sorted(audiencias_por_id)],
    }
    saida.write_text(json.dumps(corpo, ensure_ascii=False, indent=2), encoding="utf-8")


# ─────────────────────────────── sync ───────────────────────────────────


def sync(saida: Path, *, de: int = 1, ate: int | None = None, sem_drive: bool = False) -> None:
    """Enumera id de `de` até `ate` (ou até acumular
    `MAX_ERROS_CONSECUTIVOS` "não existe" seguidos, quando `ate` é
    omitido — regra: nunca ler o grid, ver docstring do módulo). Grava
    incremental a cada ficha, e pula no reinício o que já está válido."""
    sessao = _sessao()
    catalogo = _carregar_catalogo_municipios()

    estado_bruto, audiencias_por_id, ids_inexistentes = _carregar_estado_existente(saida)
    id_maximo_encontrado = estado_bruto.get("id_maximo_encontrado", 0)
    ids_inexistentes = list(ids_inexistentes)
    ja_coletados = set(audiencias_por_id) | set(ids_inexistentes)

    teto = ate if ate is not None else TETO_SEGURANCA_PADRAO
    erros_consecutivos = 0
    coletados_nesta_rodada = 0

    print(f"{LOG} iniciando de id={de} até {'id=' + str(ate) if ate else 'descoberta automática (teto de segurança ' + str(teto) + ')'}"
          f" — {len(ja_coletados)} id(s) já resolvido(s) em rodada(s) anterior(es), pulados.")

    id_atual = de
    while id_atual <= teto:
        if id_atual in ja_coletados:
            id_atual += 1
            continue

        try:
            audiencia = coletar_uma(sessao, catalogo, id_atual, sem_drive=sem_drive)
        except BloqueadoPelaFonte:
            _gravar(saida, audiencias_por_id, ids_inexistentes, id_maximo_encontrado)
            raise
        except Exception as e:
            print(f"{LOG} id={id_atual}: ERRO ({type(e).__name__}: {e}) — seguindo para o próximo, sem gravar este id.")
            id_atual += 1
            continue

        if audiencia is None:
            ids_inexistentes.append(id_atual)
            erros_consecutivos += 1
            if ate is None and erros_consecutivos >= MAX_ERROS_CONSECUTIVOS:
                print(f"{LOG} {erros_consecutivos} id(s) inexistente(s) consecutivo(s) — "
                      f"parando a descoberta em id={id_atual} (teto encontrado: {id_maximo_encontrado}).")
                break
        else:
            erros_consecutivos = 0
            id_maximo_encontrado = max(id_maximo_encontrado, id_atual)
            audiencias_por_id[id_atual] = audiencia
            coletados_nesta_rodada += 1
            print(f"{LOG} id={id_atual}: {audiencia['nome_empreendimento'][:50]!r} "
                  f"({len(audiencia['documentos'])} documento(s)).")

        _gravar(saida, audiencias_por_id, ids_inexistentes, id_maximo_encontrado)
        id_atual += 1

    print(f"{LOG} fim: {coletados_nesta_rodada} ficha(s) nova(s) nesta rodada, "
          f"{len(audiencias_por_id)} no total, id_maximo_encontrado={id_maximo_encontrado}. "
          f"Gravado em {saida}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--sondar", action="store_true", help="testa só os 3 casos-âncora, NÃO grava, NÃO enumera")
    parser.add_argument("--saida", type=Path, default=SAIDA_PADRAO, help="caminho do JSON de saída (incremental)")
    parser.add_argument("--de", type=int, default=1, help="id inicial da enumeração")
    parser.add_argument("--ate", type=int, default=None, help="id final (omitir = descoberta automática pelo corte de erros consecutivos)")
    parser.add_argument("--sem-drive", action="store_true", help="pula a expansão das pastas do Google Drive")
    args = parser.parse_args()

    try:
        if args.sondar:
            sondar()
        else:
            sync(args.saida, de=args.de, ate=args.ate, sem_drive=args.sem_drive)
    except BloqueadoPelaFonte as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
