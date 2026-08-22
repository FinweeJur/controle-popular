"""etl.camaras.sigpub — diário oficial de qualquer cidade que publique via
**SIGPub** (o "Sistema Gerenciador de Publicações Legais" que associações
municipais estaduais contratam como diário oficial dos filiados — em Minas
Gerais, operado pela AMM-MG em `diariomunicipal.com.br/amm-mg/`).

Alvo inicial: Diamantina-MG (3121605) — Prefeitura E Câmara, as duas
entidades da cidade que publicam nesse mesmo diário estadual compartilhado.
É a ÚNICA confirmação limpa de uso ativo do SIGPub entre as 6 cidades do
portal (`docs/_historico/diario-oficial-sigpub-mapeamento.md`) — Araçuaí e
Itinga têm cadastro no portal mas usam diário PRÓPRIO de cada prefeitura, não
este.

POR QUE ESTE MÓDULO É GENÉRICO, E NÃO "etl.camaras.diamantina" — mesmo
raciocínio de `camaras/sapl.py`/`camaras/syssolution.py`: o SIGPub é a
plataforma de diário de associações municipais de VÁRIOS estados (a AMM-MG é
uma delas), então este módulo atende qualquer cidade nele trocando
`municipios.fontes.diario_oficial` (a base) e
`sigpub_entidade_prefeitura`/`sigpub_entidade_camara` (os ids da entidade) —
sem reescrever a lógica de busca/paginação.

E POR QUE UMA ENTIDADE NÃO É UMA CIDADE — diferente de sapl.py/syssolution.py
(cada um fala com o servidor de UMA câmara por vez), aqui a Prefeitura e a
Câmara da MESMA cidade são duas `entidadeUsuaria` diferentes no MESMO diário
estadual, misturado com o de outras ~800 cidades filiadas. `sync()` varre as
duas entidades da cidade, uma de cada vez, sob o MESMO `id_municipio`.

═══ ARMADILHAS MEDIDAS AO VIVO (2026-08-22, contra a fonte real) ═══

0. **ESTE DOCUMENTO CORRIGE UM RELATO ANTERIOR — NENHUM DOS DOIS FOI HERDADO
   SEM RECONFERIR.** Dois relatos escritos no repo se contradiziam sobre o
   mecanismo de busca: `docs/_historico/diario-oficial-sigpub-mapeamento.md`
   (seção D0, 11/08) registrou que um GET simples devolvia só o formulário
   vazio e SUSPEITOU de POST ou sessão sem confirmar; o cabeçalho da migration
   `0077_atos_diario.sql` (16/08) AFIRMAVA como confirmado "GET + CSRF _token
   ligado à sessão". A mesma página do histórico tem uma seção D1 (também
   16/08) que já bate com a migration — mas a ordem cronológica (D0 achando
   uma coisa, D1 corrigindo para outra, sem que o D0 fosse marcado como
   superado) foi o motivo real de desconfiar dos dois e reconferir do zero
   com `curl.exe`, não confiar em nenhum relato escrito. **O que MEDI agora,
   de novo, com requisições novas:** a migration 0077 estava certa no
   mecanismo (é GET, precisa de sessão + token — provado abaixo, item 1) — só
   errou num detalhe (item 5: não existe campo de página). **O D0 (11/08)
   falhou por um motivo mais simples do que POST/sessão: usava os nomes de
   campo ERRADOS** (`data_inicio`/`data_fim` — quando o campo real é
   `dataInicio`/`dataFim`, camelCase) **e filtrava por `titulo` (texto livre
   da matéria) em vez de `entidadeUsuaria`** — uma consulta assim retorna
   vazio mesmo com sessão/token perfeitos, porque nenhuma matéria real tem
   "Diamantina" no título. As duas explicações (sessão faltando E parâmetro
   errado) apontavam pro mesmo sintoma (formulário vazio), e só dava para
   separar uma da outra testando as duas variáveis isoladamente — o que os
   testes abaixo fazem.

1. **A BUSCA PRECISA DE SESSÃO + TOKEN, E O TOKEN NÃO É DE USO ÚNICO.**
   Confirmado isolando cada variável (curl, 22/08/2026, `entidadeUsuaria=905`,
   julho/2026): (a) GET com os parâmetros certos mas SEM cookie nem token →
   0 resultados; (b) GET com cookie de sessão válido mas SEM o campo
   `_token` → 0 resultados; (c) GET com cookie válido mas token ERRADO/de
   outra sessão → 0 resultados; (d) GET com cookie + o `_token` extraído da
   MESMA resposta que deu o cookie → **10 matérias reais**, batendo palavra
   por palavra com `apps/web/lib/diario/fixtures/diamantina-75-titulos.json`.
   Nos quatro casos o servidor responde HTTP 200 e a MESMA string estática
   "NENHUMA MATÉRIA ENCONTRADA PARA ESTA DATA" (ver armadilha 3) — a falha é
   silenciosa, nunca um erro. E o token (d) foi **reutilizado com sucesso em
   6 chamadas seguidas**, inclusive minutos depois e para consultas
   diferentes (outra entidade, outro período) — não é token de uso único
   (padrão CSRF de sessão, não double-submit de formulário). Por isso este
   módulo busca sessão+token **uma vez por rodada** (`_iniciar_sessao`), não
   a cada página.

2. **NOMES DE CAMPO EXATOS (lidos do HTML do formulário, não adivinhados):**
   `busca_avancada[entidadeUsuaria]`, `busca_avancada[dataInicio]`,
   `busca_avancada[dataFim]` — **`dataInicio`/`dataFim` em camelCase**, dados
   em `dd/mm/yyyy`, os dois obrigatórios — `busca_avancada[_token]`,
   `busca_avancada[page]`. Não existe campo de tipo/categoria de ato (só
   Entidade, Órgão, Título, palavra-chave, datas) — classificação continua
   sendo por regex sobre o título (`etl.diario.classificar_ato`).

3. **A MENSAGEM "NENHUMA MATÉRIA ENCONTRADA PARA ESTA DATA" ESTÁ SEMPRE NO
   HTML**, com token novo ou velho, com ou sem resultado — é um elemento
   estático da página, não um sinal confiável de "zero matérias". O sinal
   real é a presença da tabela `#datatable` com linhas em `tbody` — é isso
   que este módulo checa (`_extrair_linhas`), nunca o texto do aviso.

4. **TETO DE ITENS POR PERÍODO: intervalo largo devolve vazio (sem tabela
   nenhuma), mas um MÊS inteiro funciona mesmo com quase 300 matérias.**
   Medido: `entidadeUsuaria=905`, 01/01/2026–22/08/2026 (~8 meses) → vazio,
   sem `#datatable`. Mesma entidade, um mês fechado por vez → funciona e
   pagina normalmente: julho/2026 deu 196 matérias (18 páginas), e
   janeiro/2015 deu 293 matérias (30 páginas, conferido até a última —
   "Mostrando de 291 até 293 de 293 registros", com as 3 últimas linhas
   ainda datadas de 28/01/2015, dentro do período pedido: o teto é de fato
   sobre a LARGURA do intervalo pedido, não um bug que ignora o filtro).
   Por isso a coleta é **sempre por mês fechado** (`_meses_entre`), nunca um
   intervalo maior — confirma a orientação que já estava na migration 0077 e
   no plano, agora com número medido, não suposição.

5. **CORREÇÃO SOBRE A MIGRATION 0077: NÃO HÁ CAMPO DE "PÁGINA" NA PÁGINA DE
   DETALHE.** O comentário da 0077 presumia "a edição e a página do diário
   estão na página de detalhe". Medido na página de uma matéria real
   (`/amm-mg/load/802D1656` → redireciona para `/amm-mg/materia/...`): o
   rodapé traz **só** "Matéria publicada no Diário Oficial dos Municípios
   Mineiros no dia DD/MM/AAAA. Edição NNNN" — nenhuma ocorrência de
   "página"/"pág." em lugar nenhum do HTML. `pagina` fica **sempre `None`**
   neste fornecedor — não é campo faltando por preguiça de coletar, é campo
   que a fonte não expõe.

6. **`/load/<HASH>` É REDIRECT (302) PARA `/materia/<HASH>/<HASH2>`, E O
   `<HASH2>` MUDA A CADA REQUISIÇÃO** (medido: dois GETs seguidos ao mesmo
   `/load/802D1656` resolveram para `<HASH2>` diferentes). Por isso
   `link_fonte` grava sempre a URL curta `/load/<HASH>` — estável, é a que a
   migration 0077 já previa —, nunca a resolvida. Buscar o detalhe (para
   `edicao`/`texto`) precisa seguir o redirect (`-L` do curl), nunca montar a
   URL de destino à mão.

7. **reCAPTCHA v2 está anexado ao botão de busca** (`class="g-recaptcha"`,
   `data-sitekey` visível no HTML do formulário) **mas não bloqueou nenhuma
   das ~20 requisições GET diretas desta sondagem** — parece decorativo (ou
   validado só sob suspeita de abuso) para este endpoint específico, não
   checado a cada request. Mesmo assim: pausa de 1,5s entre requisições
   (`PAUSA`), User-Agent honesto, e se um dia a resposta vier sem `#datatable`
   E sem a mensagem estática esperada (ou HTTP != 200), o coletor levanta em
   vez de contar como "0 matérias" — bloqueio silencioso não pode virar
   número de cobertura.

8. **`Content-Type: text/html; charset=UTF-8` explícito** — ao contrário do
   SysSolution (armadilha 4 de `syssolution.py`), aqui não há mojibake por
   charset ausente; decodificar como UTF-8 direto é seguro.

9. **Página além do fim não dá erro — devolve página com 0 linha de dado**
   (medido: pedir a página 31 de uma busca com só 30 páginas voltou HTTP 200,
   com a tabela presente mas sem nenhum link de matéria dentro). É a condição
   de parada segura da paginação: para quando uma página não traz nenhum
   hash NOVO, não quando bate um número de página fixo.

10. **`requests`/`urllib` do Python: histórico de `WinError 10013` nesta
    classe de máquina de desenvolvimento** — o mesmo achado está registrado
    em `docs/_historico/diario-oficial-sigpub-mapeamento.md` (seção D1,
    16/08, sobre esta MESMA fonte: "o socket direto do Python é bloqueado
    nesta máquina — WinError 10013; usar PowerShell/curl para baixar"). Nos
    meus testes desta sessão (22/08) `requests.Session().get()` funcionou
    sem erro — não reproduzi o bloqueio —, mas como o achado já apareceu de
    forma independente em duas sessões diferentes contra o mesmo host, e
    `curl.exe` já provou 100% confiável nas ~20 requisições desta sondagem
    inteira, este módulo fala HTTP **só** via `subprocess` + `curl.exe`,
    nunca `requests`/`httpx` direto — o risco de um bloqueio intermitente no
    meio de uma coleta longa custa mais do que a familiaridade de usar
    `requests` como os outros módulos de `camaras/`.

═══ O QUE ESTE MÓDULO ESCREVE ═══

`atos_diario` (migration `0077_atos_diario.sql`) — upsert por
`(id_municipio, chave_natural)`, `chave_natural = "sigpub:<hash>"` (o hash
opaco de 8 caracteres do link `/load/<hash>`, o mesmo "Código Identificador"
que a página de detalhe exibe). Idempotente: rodar de novo sobre o mesmo mês
não duplica.

═══ ESTE WORKTREE NÃO TEM `DATABASE_URL` ═══

Sem banco não dá para `carregar_municipio()` (que lê
`fontes.sigpub_entidade_prefeitura`/`_camara`) nem para gravar. Por isso
existe `--sondar`: mede o volume real de uma `entidadeUsuaria` sem tocar no
banco — nem para ler, nem para escrever —, só para prova de mecanismo antes
de a migration que semeia os ids (`0079_sigpub_entidade_diamantina.sql`) ser
aplicada em algum banco de verdade. `--sondar` exige `--entidade-usuaria`
explícito na linha de comando (nunca um default de cidade escondido em
`add_argument` — a mesma guarda que `scripts/conferir_defaults_de_cidade.py`
procura); `sync()` (o caminho de produção, que grava) continua exigindo
`--id-municipio` e lendo tudo de `municipios.fontes`, no mesmo molde de
`camaras/sapl.py`/`camaras/syssolution.py`.

Uso:

    python -m etl.camaras.sigpub --sondar --entidade-usuaria 905 --desde 2026-07 --ate 2026-07
    python -m etl.camaras.sigpub --sondar --entidade-usuaria 21672 --rotulo-entidade "Camara" --desde 2026-07 --ate 2026-07

    python -m etl.camaras.sigpub --id-municipio 3121605
    python -m etl.camaras.sigpub --id-municipio 3121605 --partes prefeitura --desde 2026-07 --ate 2026-07
    python -m etl.camaras.sigpub --id-municipio 3121605 --com-detalhe
"""
from __future__ import annotations

import argparse
import calendar
import re
import subprocess
import sys
import tempfile
import time
from datetime import date
from pathlib import Path
from urllib.parse import urljoin, urlparse

from lxml import etree as letree
from lxml import html as lhtml

from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    carregar_municipio,
    get_supabase_client,
    upsert_com_colunas_opcionais,
)
from etl.diario import classificar_ato

LOG = "[etl.camaras.sigpub]"

# Valor de `municipios.fontes.diario_oficial_coletor` — não usado ainda por
# nenhuma guarda de "dono" porque `atos_diario` não tem refresh total (é
# upsert por chave natural prefixada, ver migration 0077); existe só como
# rótulo de máquina consistente com `camara_coletor`/`legislacao_fonte` de
# outros módulos, para quando um segundo fornecedor de diário for cadastrado
# na mesma cidade.
COLETOR = "sigpub"

# Único host confirmado ao vivo até agora (Minas Gerais/AMM-MG). O plano
# (`docs/planos/diario-oficial-plano.md`) especula que o SIGPub atende outros
# estados também, mas isto NUNCA foi medido — não generalizo um padrão de
# hostname que não vi. Quando um segundo estado for confirmado, esta lista
# ganha uma linha (não um regex adivinhado).
HOSTS_CONFIRMADOS = {"www.diariomunicipal.com.br"}

USER_AGENT = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"

# Armadilha 7 do cabeçalho: pausa entre requisições a este host de terceiro —
# mesmo valor pedido para esta tarefa e já usado por outros coletores do
# projeto contra hosts de terceiro (ex. `etl.apis` diversos).
PAUSA = 1.5
TIMEOUT = 60


class BloqueioSigpub(RuntimeError):
    """A resposta não tem nem `#datatable` nem a forma esperada de página
    vazia — pode ser bloqueio (reCAPTCHA, WAF, IP banido). Levantar em vez de
    contar como "0 matérias": ver armadilha 7 do cabeçalho do módulo."""


# ────────────────────────── HTTP via curl.exe ─────────────────────────
#
# Armadilha 10 do cabeçalho: nunca `requests`/`httpx` direto nesta máquina.


class _RespostaCurl:
    __slots__ = ("status", "corpo", "url_final")

    def __init__(self, status: int, corpo: str, url_final: str):
        self.status = status
        self.corpo = corpo
        self.url_final = url_final


def _curl_get_uma_vez(url: str, *, params: dict[str, str] | None, cookie_jar: Path) -> _RespostaCurl:
    with tempfile.TemporaryDirectory() as tmp:
        corpo_path = Path(tmp) / "corpo"
        args = [
            "curl.exe",
            "-sS",
            "-L",  # segue redirect (armadilha 6: /load/<hash> é 302)
            "-A",
            USER_AGENT,
            "--max-time",
            str(TIMEOUT),
            "-b",
            str(cookie_jar),
            "-c",
            str(cookie_jar),
            "-o",
            str(corpo_path),
            "-w",
            "%{http_code} %{url_effective}",
        ]
        if params:
            args.append("-G")
            for chave, valor in params.items():
                args += ["--data-urlencode", f"{chave}={valor}"]
        args.append(url)
        resultado = subprocess.run(args, capture_output=True, text=True, timeout=TIMEOUT + 15)
        if resultado.returncode != 0:
            raise RuntimeError(
                f"curl.exe saiu com código {resultado.returncode} em {url}: "
                f"{resultado.stderr.strip()[:300]}"
            )
        saida = resultado.stdout.strip().split(" ", 1)
        status = int(saida[0]) if saida and saida[0].isdigit() else 0
        url_final = saida[1] if len(saida) > 1 else url
        corpo = corpo_path.read_text(encoding="utf-8", errors="replace")
        return _RespostaCurl(status=status, corpo=corpo, url_final=url_final)


def _curl_get(url: str, *, params: dict[str, str] | None = None, cookie_jar: Path, tentativas: int = 3) -> _RespostaCurl:
    """Ponto ÚNICO de chamada HTTP deste módulo — TODA requisição passa por
    aqui, e é por isso que a pausa (armadilha 7 do cabeçalho) mora aqui, não
    espalhada pelos call sites: a primeira versão deste arquivo pausava só
    DENTRO da paginação de um mês, e uma auditoria própria (antes do commit)
    achou que a transição entre entidades e entre meses disparava duas
    requisições seguidas sem pausa nenhuma — seria fácil de repetir o erro
    se cada função lembrasse de pausar por conta própria. Centralizar aqui
    torna a omissão impossível: quem chama `_curl_get` nunca precisa lembrar.

    Retry só do que adianta repetir: falha de rede/timeout do próprio curl,
    não um HTTP de negócio (200 com "0 matérias" não é falha)."""
    time.sleep(PAUSA)
    ultimo: Exception | None = None
    for tentativa in range(tentativas):
        try:
            return _curl_get_uma_vez(url, params=params, cookie_jar=cookie_jar)
        except Exception as e:  # noqa: BLE001 — timeout, reset, curl ausente
            ultimo = e
            time.sleep(3.0 * (tentativa + 1))
    raise RuntimeError(f"GET {url} falhou após {tentativas} tentativa(s): {ultimo}")


# ──────────────────────── parsing (lxml, sem regex de HTML) ───────────


def _doc(corpo: str):
    return lhtml.fromstring(corpo)


def _extrair_token(corpo: str) -> str | None:
    doc = _doc(corpo)
    valores = doc.xpath('//input[@name="busca_avancada[_token]"]/@value')
    return valores[0] if valores else None


def _texto(el) -> str:
    return " ".join(el.text_content().split())


def _extrair_total_declarado(corpo: str) -> int | None:
    """"Mostrando de 1 até 11 de 196 registros" -> 196. Confiável (conferido
    até a última página em teste manual — ver armadilha 4): uso isto como o
    total esperado da paginação, não o "até Y" (que mede 1 a mais do que as
    linhas reais de dado por página — bug cosmético da fonte, não usado)."""
    m = re.search(r"de\s+([\d.]+)\s+registros", corpo, re.I)
    if not m:
        return None
    return int(m.group(1).replace(".", ""))


def _extrair_linhas(corpo: str) -> list[dict]:
    """Uma linha por `<tr>` de `#datatable > tbody` com link de matéria.
    Página vazia (sem resultado, ou além do fim — armadilha 9) devolve []."""
    doc = _doc(corpo)
    linhas = []
    for tr in doc.xpath("//table[@id='datatable']//tbody/tr"):
        hrefs = tr.xpath(".//a[contains(@href,'/load/')]/@href")
        if not hrefs:
            continue
        hash_materia = hrefs[0].rstrip("/").rsplit("/", 1)[-1]
        tds = tr.xpath("./td")
        if len(tds) < 4:
            continue
        linhas.append(
            {
                "hash": hash_materia,
                "entidade": _texto(tds[0]),
                "titulo": _texto(tds[1]),
                "orgao": _texto(tds[2]),
                "data_circulacao": _texto(tds[3]),  # dd-mm-yyyy
            }
        )
    return linhas


def _data_iso(data_circulacao: str) -> str | None:
    partes = (data_circulacao or "").strip().split("-")
    if len(partes) != 3 or not all(p.isdigit() for p in partes):
        return None
    d, m, a = partes
    return f"{a}-{m.zfill(2)}-{d.zfill(2)}"


_RE_NUMERO_ATO = re.compile(r"N[ºO°]\.?\s*([0-9][0-9./-]*)", re.I)


def _extrair_numero_ato(titulo: str) -> str | None:
    """Best-effort: a fonte não tem campo estruturado de número (só título
    em texto livre), então isto é heurística sobre pontuação comum ('Nº 338',
    'N° 010/2026') — título sem esse padrão fica com `numero_ato` nulo, não
    um valor forçado."""
    m = _RE_NUMERO_ATO.search(titulo or "")
    if not m:
        return None
    return m.group(1).rstrip(".,-")


_RE_EDICAO = re.compile(r"Edi\w*\s+(\d+)", re.I)


def _extrair_detalhe(corpo: str) -> dict:
    """`edicao` e `texto` da página de UMA matéria. `pagina` não existe
    nesta fonte (armadilha 5) — sempre None, não é campo esquecido.

    A matéria embute um `<style>` inline (`table.mat {...}`, `td {...}` —
    visto ao vivo em 22/08/2026) DENTRO de `#materia`; `.text_content()` do
    lxml não sabe que `<style>`/`<script>` não é texto visível (isso é regra
    de RENDERIZADOR, não do parser) e devolveria o CSS misturado no meio do
    corpo do ato. `strip_elements` remove as duas tags antes de extrair —
    sem isso, `texto` começava com um trecho de folha de estilo."""
    doc = _doc(corpo)
    materia = doc.xpath("//div[@id='materia']")
    if not materia:
        return {"edicao": None, "pagina": None, "texto": None}
    letree.strip_elements(materia[0], "style", "script", with_tail=False)
    texto_completo = _texto(materia[0])
    m = _RE_EDICAO.search(texto_completo) if texto_completo else None
    edicao = m.group(1) if m else None
    return {"edicao": edicao, "pagina": None, "texto": texto_completo}


# ───────────────────────────── sessão ──────────────────────────────


def _iniciar_sessao(base_url: str, cookie_jar: Path) -> str:
    """Um GET a `<base_url>pesquisar` para pegar cookie de sessão + o token
    CSRF do formulário. Chamado UMA VEZ por rodada — armadilha 1: o token não
    é de uso único, serve para todas as buscas desta sessão."""
    resp = _curl_get(urljoin(base_url, "pesquisar"), cookie_jar=cookie_jar)
    if resp.status != 200:
        raise RuntimeError(f"GET {base_url}pesquisar devolveu HTTP {resp.status} — sessão não iniciada.")
    token = _extrair_token(resp.corpo)
    if not token:
        raise RuntimeError(
            f"token CSRF (busca_avancada[_token]) não encontrado em {base_url}pesquisar — "
            "a página pode ter mudado de forma; revise `_extrair_token`."
        )
    return token


# ──────────────────────── busca por mês, paginada ──────────────────────


def _buscar_pagina(
    base_url: str, cookie_jar: Path, token: str, entidade_id: str, data_inicio: str, data_fim: str, pagina: int
) -> str:
    params = {
        "busca_avancada[entidadeUsuaria]": str(entidade_id),
        "busca_avancada[dataInicio]": data_inicio,
        "busca_avancada[dataFim]": data_fim,
        "busca_avancada[_token]": token,
    }
    if pagina > 1:
        params["busca_avancada[page]"] = str(pagina)
    resp = _curl_get(urljoin(base_url, "pesquisar"), params=params, cookie_jar=cookie_jar)
    if resp.status != 200:
        raise RuntimeError(f"GET pesquisar (pagina={pagina}) devolveu HTTP {resp.status}.")
    return resp.corpo


def _buscar_mes(
    base_url: str, cookie_jar: Path, token: str, entidade_id: str, ano: int, mes: int, rotulo_entidade: str
) -> list[dict]:
    """Todas as matérias de UMA entidade em UM mês fechado, paginando e
    conferindo contra o total que a própria página anuncia (mesma disciplina
    de `_paginar()` em `camaras/sapl.py`: paginação incompleta levanta, não
    grava com subcoleta)."""
    primeiro_dia = date(ano, mes, 1)
    ultimo_dia = date(ano, mes, calendar.monthrange(ano, mes)[1])
    data_inicio = primeiro_dia.strftime("%d/%m/%Y")
    data_fim = ultimo_dia.strftime("%d/%m/%Y")

    por_hash: dict[str, dict] = {}
    pagina = 1
    total_declarado: int | None = None
    primeira_pagina = True
    while True:
        # A pausa entre requisições mora em `_curl_get` (ponto único), não
        # aqui — ver o comentário lá sobre por que centralizar.
        html = _buscar_pagina(base_url, cookie_jar, token, entidade_id, data_inicio, data_fim, pagina)
        if primeira_pagina:
            total_declarado = _extrair_total_declarado(html)
            tem_tabela = 'id="datatable"' in html
            if total_declarado is None and not tem_tabela:
                # Nem tabela, nem total declarado: ou é mês genuinamente
                # vazio (comportamento normal — ver `_extrair_linhas`
                # devolvendo [] abaixo), ou é bloqueio. Sem `#datatable` E
                # sem o form de busca também presente, é bloqueio.
                if "busca_avancada" not in html:
                    raise BloqueioSigpub(
                        f"{rotulo_entidade} {ano:04d}-{mes:02d}: resposta sem tabela de "
                        "resultado E sem o formulário de busca — pode ser bloqueio "
                        "(reCAPTCHA/WAF), não '0 matérias'."
                    )
            primeira_pagina = False
        linhas = _extrair_linhas(html)
        if not linhas:
            break
        novas = 0
        for linha in linhas:
            if linha["hash"] not in por_hash:
                por_hash[linha["hash"]] = linha
                novas += 1
        if novas == 0:
            break  # página repetiu tudo que já tínhamos — para não entrar em loop
        pagina += 1

    coletadas = list(por_hash.values())
    if total_declarado is None:
        print(f"{LOG} {rotulo_entidade} {ano:04d}-{mes:02d}: 0 matéria(s) (mês vazio nesta fonte).")
    elif len(coletadas) != total_declarado:
        raise RuntimeError(
            f"{rotulo_entidade} {ano:04d}-{mes:02d}: coletei {len(coletadas)} matéria(s) mas a "
            f"página anuncia {total_declarado} — paginação incompleta, não sigo com subcoleta."
        )
    else:
        print(f"{LOG} {rotulo_entidade} {ano:04d}-{mes:02d}: {len(coletadas)} matéria(s) (confere com o total declarado).")
    return coletadas


def _meses_entre(desde: tuple[int, int], ate: tuple[int, int]):
    ano, mes = desde
    while (ano, mes) <= ate:
        yield ano, mes
        mes += 1
        if mes > 12:
            mes, ano = 1, ano + 1


# ──────────────────────────── montagem de linha ────────────────────────


def _montar_linha(id_municipio: str, base_url: str, linha_busca: dict, detalhe: dict | None) -> dict:
    titulo = linha_busca["titulo"]
    return {
        "id_municipio": id_municipio,
        "data_publicacao": _data_iso(linha_busca["data_circulacao"]),
        "edicao": (detalhe or {}).get("edicao"),
        "pagina": None,  # armadilha 5: esta fonte não expõe página, nunca
        "tipo": classificar_ato(titulo),
        "numero_ato": _extrair_numero_ato(titulo),
        "orgao": linha_busca["orgao"] or None,
        # A fonte não tem campo de "ementa" separado do título — o título É
        # o resumo do ato neste diário (frase completa, não um cabeçalho
        # curto). Mapear para `ementa` em vez de deixar nulo aproveita a
        # coluna que a tela já sabe mostrar.
        "ementa": titulo or None,
        "texto": (detalhe or {}).get("texto"),
        "link_fonte": urljoin(base_url, f"load/{linha_busca['hash']}"),  # armadilha 6: nunca a URL resolvida
        "chave_natural": f"sigpub:{linha_busca['hash']}",
        "raw": {
            "entidade": linha_busca["entidade"],
            "orgao": linha_busca["orgao"],
            "data_circulacao": linha_busca["data_circulacao"],
            "hash": linha_busca["hash"],
        },
    }


def _buscar_detalhe_de_uma(base_url: str, cookie_jar: Path, hash_materia: str) -> dict:
    resp = _curl_get(urljoin(base_url, f"load/{hash_materia}"), cookie_jar=cookie_jar)
    if resp.status != 200:
        print(f"{LOG} AVISO: detalhe de {hash_materia} devolveu HTTP {resp.status} — edicao/texto ficam nulos.")
        return {"edicao": None, "pagina": None, "texto": None}
    return _extrair_detalhe(resp.corpo)


# ─────────────────────── identidade / config da cidade ─────────────────


def _conferir_identidade(cidade: dict) -> tuple[str, dict[str, str]]:
    """Confere `fontes.diario_oficial` (host confirmado) e os ids de
    entidade, e devolve (base_url, {"prefeitura": id, "camara": id})
    só com as chaves que a cidade realmente tem configuradas."""
    fontes = cidade.get("fontes") or {}
    base_url = fontes.get("diario_oficial")
    if not isinstance(base_url, str) or not base_url.startswith("http"):
        raise RuntimeError(
            f"municipios.fontes.diario_oficial ausente para {cidade['id_municipio']} "
            f"({cidade['nome']}) — não dá para saber a base do SIGPub."
        )
    dominio = (urlparse(base_url).hostname or "").lower()
    if dominio not in HOSTS_CONFIRMADOS:
        raise RuntimeError(
            f"{cidade['nome']}: fontes.diario_oficial aponta para {dominio!r}, que não está em "
            f"HOSTS_CONFIRMADOS ({sorted(HOSTS_CONFIRMADOS)}). Este módulo recusa host nunca "
            "medido — confirme ao vivo (no molde deste arquivo) antes de adicionar."
        )
    if not base_url.endswith("/"):
        base_url += "/"

    entidades: dict[str, str] = {}
    for parte, chave in (("prefeitura", "sigpub_entidade_prefeitura"), ("camara", "sigpub_entidade_camara")):
        valor = fontes.get(chave)
        if valor is not None:
            entidades[parte] = str(valor)
    if not entidades:
        raise RuntimeError(
            f"{cidade['nome']}: nenhuma de fontes.sigpub_entidade_prefeitura/"
            "sigpub_entidade_camara está configurada — semeie antes de rodar "
            "(ver migration 0079_sigpub_entidade_diamantina.sql)."
        )
    print(f"{LOG} base={base_url} entidades configuradas={entidades}")
    return base_url, entidades


# ─────────────────────────────── gravação ──────────────────────────────


def _gravar_atos(client, linhas: list[dict]) -> None:
    if not linhas:
        print(f"{LOG} atos_diario: nada coletado, nada gravado.")
        return
    upsert_com_colunas_opcionais(
        client,
        "atos_diario",
        linhas,
        ["numero_ato", "edicao", "pagina", "texto", "raw"],
        on_conflict="id_municipio,chave_natural",
    )
    com_tipo_definido = sum(1 for r in linhas if r["tipo"] != "outro")
    print(
        f"{LOG} atos_diario: {len(linhas)} matéria(s) upsertada(s) — "
        f"{com_tipo_definido} ({100 * com_tipo_definido / len(linhas):.0f}%) com tipo != 'outro'."
    )


# ───────────────────────── coleta de uma entidade ───────────────────────


def _coletar_entidade(
    base_url: str,
    cookie_jar: Path,
    token: str,
    entidade_id: str,
    rotulo_entidade: str,
    id_municipio: str,
    desde: tuple[int, int],
    ate: tuple[int, int],
    com_detalhe: bool,
) -> list[dict]:
    linhas_busca: list[dict] = []
    for ano, mes in _meses_entre(desde, ate):
        linhas_busca.extend(_buscar_mes(base_url, cookie_jar, token, entidade_id, ano, mes, rotulo_entidade))

    linhas: list[dict] = []
    for linha_busca in linhas_busca:
        detalhe = _buscar_detalhe_de_uma(base_url, cookie_jar, linha_busca["hash"]) if com_detalhe else None
        linhas.append(_montar_linha(id_municipio, base_url, linha_busca, detalhe))
    return linhas


# ─────────────────────────────── sondagem ──────────────────────────────
# Sem banco (ver cabeçalho): mede volume real sem `carregar_municipio` nem
# `get_supabase_client`. `--entidade-usuaria` é sempre explícito na linha de
# comando, nunca um default de cidade — não é o mesmo tipo de atalho que a
# guarda de `scripts/conferir_defaults_de_cidade.py` proíbe.


def sondar(base_url: str, entidade_id: str, rotulo_entidade: str, desde: tuple[int, int], ate: tuple[int, int], com_detalhe: bool) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        cookie_jar = Path(tmp) / "cookies.txt"
        token = _iniciar_sessao(base_url, cookie_jar)
        print(f"{LOG} [sondar] sessão iniciada, token obtido ({len(token)} chars).")
        linhas = _coletar_entidade(
            base_url, cookie_jar, token, entidade_id, rotulo_entidade, "SONDAGEM-SEM-BANCO", desde, ate, com_detalhe
        )

    if not linhas:
        print(f"{LOG} [sondar] {rotulo_entidade}: 0 matéria(s) no período — nada a resumir.")
        return

    por_tipo: dict[str, int] = {}
    for r in linhas:
        por_tipo[r["tipo"]] = por_tipo.get(r["tipo"], 0) + 1
    com_numero = sum(1 for r in linhas if r["numero_ato"])
    com_edicao = sum(1 for r in linhas if r["edicao"])
    datas = sorted(r["data_publicacao"] for r in linhas if r["data_publicacao"])

    print(f"\n{LOG} [sondar] === RESUMO {rotulo_entidade} ===")
    print(f"{LOG} [sondar] total de matérias: {len(linhas)}")
    print(f"{LOG} [sondar] período coberto: {datas[0]} a {datas[-1]}" if datas else f"{LOG} [sondar] sem data válida em nenhuma linha")
    print(f"{LOG} [sondar] por tipo:")
    for tipo in sorted(por_tipo, key=lambda t: -por_tipo[t]):
        print(f"{LOG} [sondar]   {por_tipo[tipo]:>4}  {tipo}")
    print(f"{LOG} [sondar] numero_ato extraído (heurística): {com_numero}/{len(linhas)}")
    if com_detalhe:
        print(f"{LOG} [sondar] edicao extraída (página de detalhe): {com_edicao}/{len(linhas)}")
    print(f"{LOG} [sondar] 100% com link_fonte (sempre construído do hash — sem exceção).")
    print(f"{LOG} [sondar] modo sondagem: NADA foi gravado (sem conexão de banco nesta chamada).")


# ─────────────────────────────── sync ──────────────────────────────────


def sync(
    id_municipio: str,
    partes: set[str],
    desde: tuple[int, int],
    ate: tuple[int, int],
    com_detalhe: bool,
) -> None:
    cidade = carregar_municipio(id_municipio)
    base_url, entidades_config = _conferir_identidade(cidade)
    partes_disponiveis = partes & entidades_config.keys()
    faltando = partes - entidades_config.keys()
    if faltando:
        print(f"{LOG} AVISO: {cidade['nome']} não tem entidade configurada para {sorted(faltando)} — pulando.")
    if not partes_disponiveis:
        raise RuntimeError(f"nenhuma das partes pedidas ({sorted(partes)}) está configurada para {cidade['nome']}.")

    client = get_supabase_client()

    with tempfile.TemporaryDirectory() as tmp:
        cookie_jar = Path(tmp) / "cookies.txt"
        token = _iniciar_sessao(base_url, cookie_jar)
        print(f"{LOG} sessão iniciada, token obtido.")

        todas_as_linhas: list[dict] = []
        for parte in sorted(partes_disponiveis):
            entidade_id = entidades_config[parte]
            linhas = _coletar_entidade(
                base_url, cookie_jar, token, entidade_id, parte, id_municipio, desde, ate, com_detalhe
            )
            todas_as_linhas.extend(linhas)

    _gravar_atos(client, todas_as_linhas)


# ─────────────────────────────── CLI ────────────────────────────────


def _parse_ano_mes(texto: str) -> tuple[int, int]:
    ano_str, mes_str = texto.split("-")
    return int(ano_str), int(mes_str)


PARTES_VALIDAS = {"prefeitura", "camara"}


if __name__ == "__main__":
    hoje = date.today()
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument("--partes", default="prefeitura,camara", help=f"lista por vírgula: {sorted(PARTES_VALIDAS)}")
    parser.add_argument("--desde", help="AAAA-MM; default: mês corrente")
    parser.add_argument("--ate", help="AAAA-MM; default: --desde, ou mês corrente")
    parser.add_argument(
        "--com-detalhe",
        action="store_true",
        help="busca edicao/texto na página de detalhe de cada matéria (1 requisição extra por matéria — mais lento)",
    )
    parser.add_argument("--sondar", action="store_true", help="modo sem banco: mede o volume de UMA entidadeUsuaria, não grava")
    parser.add_argument("--entidade-usuaria", help="(com --sondar) id numérico da entidade no SIGPub")
    parser.add_argument("--rotulo-entidade", default=None, help="(com --sondar) só para rotular o log — a fonte já devolve o nome real por linha")
    parser.add_argument(
        "--base-url",
        default="https://www.diariomunicipal.com.br/amm-mg/",
        help="(com --sondar) base do SIGPub; default AMM-MG, a única confirmada",
    )
    args = parser.parse_args()

    desde = _parse_ano_mes(args.desde) if args.desde else (hoje.year, hoje.month)
    ate = _parse_ano_mes(args.ate) if args.ate else (_parse_ano_mes(args.desde) if args.desde else (hoje.year, hoje.month))
    if desde > ate:
        # Sem esta guarda, `--ate 2026-01` sozinho (sem `--desde`) calaria:
        # `desde` cairia no mês corrente, `_meses_entre` não produziria nenhum
        # mês, e a rodada terminaria "0 matéria(s)" sem dizer por quê.
        print(f"{LOG} ABORT: --desde {desde} é depois de --ate {ate}.", file=sys.stderr)
        sys.exit(1)

    try:
        if args.sondar:
            if not args.entidade_usuaria:
                raise RuntimeError("--sondar exige --entidade-usuaria (nunca um default de cidade).")
            rotulo = args.rotulo_entidade or f"entidade={args.entidade_usuaria}"
            sondar(args.base_url, args.entidade_usuaria, rotulo, desde, ate, args.com_detalhe)
        else:
            partes = {p.strip() for p in args.partes.split(",") if p.strip()}
            invalidas = partes - PARTES_VALIDAS
            if invalidas:
                raise RuntimeError(f"parte(s) desconhecida(s): {sorted(invalidas)}")
            sync(args.id_municipio, partes, desde, ate, args.com_detalhe)
    except BloqueioSigpub as e:
        print(f"{LOG} BLOQUEIO: {e}", file=sys.stderr)
        sys.exit(2)
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
