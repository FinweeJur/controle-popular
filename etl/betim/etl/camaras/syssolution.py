"""etl.camaras.syssolution — vereadores, comissões, leis e proposições de
qualquer Câmara que rode o portal do fornecedor **SysSolution**.

Alvo inicial: Diamantina-MG (3121605), `https://cmdiamantina.mg.gov.br/`.

O fornecedor documenta a API em `<host>/dadosabertos` e serve tudo de um host
central, `https://api.syssolution.com.br/portal`, multiplexado por entidade —
ou seja, o mesmo código atende qualquer câmara cliente trocando
`municipios.fontes.camara_host`.

═══ AS ARMADILHAS, TODAS MEDIDAS AO VIVO (2026-08-07) ═══

1. **O QUE DESTRAVA A API É O `Origin`, NÃO O HEADER DOCUMENTADO.** A
   documentação manda enviar `sys-api-entidade: <host>`. Sozinho, ele devolve
   HTTP 500 com `NullReferenceException` em `Cluster.Main.GetDomainName`. O
   que funciona é `Origin: https://<host>`. Mandamos OS DOIS: o `Origin`
   porque é o que funciona hoje, o `sys-api-entidade` porque é o contrato
   publicado — se o fornecedor passar a honrá-lo, os dois já concordam.

   Efeito colateral BOM: um `Origin` errado não devolve o dado de outra
   câmara, devolve 500. A falha é ruidosa por construção, ao contrário do
   caso da ANP (ver `etl/common.py::carregar_municipio`).

2. **`totalPaginas` MENTE EM METADE DOS ENDPOINTS.** Em
   `/projeto/relatorios/...` o campo vale 796 e o `data` da MESMA resposta
   traz os 796 registros — é contagem de REGISTROS, não de páginas. Ler como
   página levaria a 796 requisições para buscar o que veio numa só (e foi
   exatamente esse o erro do levantamento que originou este módulo: estimou
   ~7.960 projetos e um job de duas horas, quando são 796 numa requisição).
   Já em `/leis/listar/{n}/{p}` e `/proposicoes/listar/{n}/{p}` o campo é
   página de verdade. Por isso cada coletor aqui declara explicitamente como
   pagina, em vez de um helper único "esperto".

3. **`{n}` de `/leis/listar/{n}/{pagina}` É O TAMANHO DA PÁGINA e o servidor
   honra 100.** Com `n=3` são 1.050 páginas; com `n=100`, 32. Medido nos
   quatro valores.

4. **O mojibake NÃO É DO SERVIDOR.** A resposta parece corrompida
   (`"Vereador 2Âº SecretÃ¡rio"`) quando lida por alguns clientes, mas em
   Python o `requests` decodifica corretamente — o `Content-Type` vem sem
   `charset`, e o que estraga o texto é o cliente que adivinha errado.
   Fixamos `encoding = "utf-8"` e NÃO recodificamos: tentar
   `latin-1 -> utf-8` aqui levanta `UnicodeDecodeError`, e nos casos em que
   "funcionasse" destruiria texto correto. Medir no runtime que vai rodar o
   ETL, não no que se usou para explorar.

5. **`comissoes.membros` é uma STRING de nomes separados por vírgula**, não
   uma lista de ids. `comissao_membros.vereador_id` é NOT NULL, então membro
   que não casar com `vereadores` se perde — o log nomeia cada perda.

6. **Os "17 tipos" de projeto incluem lixo de digitação.** A fonte lista
   `"Emenda Modificativa ao Projeto de Lei CMD 07/2024."` (um documento
   específico, não um tipo), `"Projeto de Lei Ordinária "` com espaço no fim,
   e sufixos de origem `CMD`/`PMD` (Câmara/Prefeitura Municipal de
   Diamantina). `_slug_tipo()` normaliza tudo isso antes de casar com o
   vocabulário do app — senão `PESO_PROPOSICAO[tipo]` vira `undefined` e a
   proposição não pontua no ranking, sem erro nenhum.

7. **WAF de 15 requisições/minuto.** `PAUSA` respeita isso e o backoff
   aumenta o intervalo das PRÓXIMAS requisições, não só o da repetição.

Uso:

    python -m etl.camaras.syssolution --id-municipio 3121605
    python -m etl.camaras.syssolution --id-municipio 3121605 --listar-tipos
    python -m etl.camaras.syssolution --id-municipio 3121605 --partes vereadores,comissoes
"""
import argparse
import sys
import time
import unicodedata
from urllib.parse import urlparse

import requests

from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    carregar_municipio,
    get_supabase_client,
    refresh_completo_seguro,
    upsert_com_colunas_opcionais,
)
from etl.temas import classificar_texto

LOG = "[etl.camaras.syssolution]"

COLETOR = "syssolution"
FONTE_LEGISLACAO = "camara_syssolution"

API = "https://api.syssolution.com.br/portal"

# Armadilha 7: o fornecedor declara 15 req/min. 4,2 s dá folga sobre isso.
PAUSA = 4.2
TIMEOUT = 120
PAGINA = 100  # armadilha 3

_SESSAO = requests.Session()
_SESSAO.headers["User-Agent"] = (
    "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"
)

_intervalo = PAUSA  # cresce sob 429; ver `_get`


# ─────────────────────────────── HTTP ────────────────────────────────


def _get(caminho: str) -> dict | list:
    """Uma chamada à API, com o `Origin` da entidade já no lugar.

    O `Origin` é definido UMA VEZ em `_preparar_sessao()`, nunca por chamada:
    esquecer num único ponto devolveria HTTP 500 no meio de uma coleta longa,
    e o 500 é fácil de confundir com instabilidade do servidor.
    """
    global _intervalo
    url = f"{API}{caminho}"
    ultimo = None
    for tentativa in range(4):
        time.sleep(_intervalo)
        try:
            resp = _SESSAO.get(url, timeout=TIMEOUT)
            if resp.status_code == 200:
                # Armadilha 4: fixar, mas NUNCA recodificar.
                resp.encoding = "utf-8"
                return resp.json()
            if resp.status_code == 429:
                espera = float(resp.headers.get("Retry-After") or 30)
                # O ponto: subir o intervalo BASE. Esperar só nesta tentativa
                # e voltar ao ritmo antigo garante o próximo 429.
                _intervalo = min(_intervalo * 1.5, 30.0)
                print(f"{LOG} 429 em {caminho} — pausa {espera}s, intervalo agora {_intervalo:.1f}s")
                time.sleep(espera)
                ultimo = RuntimeError("429")
                continue
            ultimo = RuntimeError(f"HTTP {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            ultimo = e
        time.sleep(3.0 * (tentativa + 1))
    raise RuntimeError(f"{caminho}: falhou após 4 tentativas: {ultimo}")


def _dados(payload) -> list[dict]:
    if isinstance(payload, dict):
        d = payload.get("data")
        return d if isinstance(d, list) else []
    return payload if isinstance(payload, list) else []


def _paginar(caminho_fmt: str, rotulo: str) -> list[dict]:
    """Endpoints em que `totalPaginas` É página de verdade (armadilha 2).

    `caminho_fmt` recebe `{n}` e `{p}`.
    """
    primeira = _get(caminho_fmt.format(n=PAGINA, p=1))
    total_paginas = (primeira or {}).get("totalPaginas") if isinstance(primeira, dict) else None
    linhas = _dados(primeira)
    if not total_paginas or total_paginas <= 1:
        return linhas
    for p in range(2, int(total_paginas) + 1):
        linhas.extend(_dados(_get(caminho_fmt.format(n=PAGINA, p=p))))
    print(f"{LOG} {rotulo}: {len(linhas)} registro(s) em {total_paginas} página(s).")
    return linhas


# ──────────────────────── identidade da cidade ───────────────────────


def _sem_acento(texto: str) -> str:
    base = unicodedata.normalize("NFD", texto or "")
    return "".join(c for c in base if unicodedata.category(c) != "Mn")


def _espremer(texto) -> str:
    return " ".join(str(texto or "").split())


def _preparar_sessao(cidade: dict) -> str:
    """Confere identidade e arma o `Origin`. Devolve o host da entidade."""
    fontes = cidade.get("fontes") or {}

    host = fontes.get("camara_host")
    if not isinstance(host, str) or not host.startswith("http"):
        raise RuntimeError(
            f"municipios.fontes.camara_host ausente para {cidade['id_municipio']} "
            f"({cidade['nome']})."
        )
    coletor = fontes.get("camara_coletor")
    if coletor != COLETOR:
        raise RuntimeError(
            f"{cidade['nome']} declara camara_coletor={coletor!r}, não {COLETOR!r}. "
            "Este módulo recusa cidade que não é dele."
        )

    host = host.rstrip("/")
    dominio = (urlparse(host).hostname or "").lower()
    alvo = _sem_acento(cidade["nome"]).lower().replace(" ", "")
    if alvo not in dominio.replace("-", "").replace(".", ""):
        rotulo = fontes.get("camara_host_rotulo")
        if not (isinstance(rotulo, str) and rotulo and rotulo.lower() in dominio):
            raise RuntimeError(
                f"host {host!r} não carrega o nome de {cidade['nome']!r} nem o "
                "`fontes.camara_host_rotulo`. Recuso coletar."
            )

    # Armadilha 1: os dois headers, num ponto único.
    _SESSAO.headers["Origin"] = host
    _SESSAO.headers["sys-api-entidade"] = dominio
    print(f"{LOG} entidade={dominio} (Origin armado)")
    return host


# ───────────────────────────── vereadores ────────────────────────────


def _slug(nome: str) -> str:
    base = _sem_acento(nome or "").lower()
    limpo = "".join(c if c.isalnum() else "-" for c in base)
    return "-".join(p for p in limpo.split("-") if p)


def _coletar_vereadores(cidade: dict) -> list[dict]:
    id_municipio = cidade["id_municipio"]
    brutos = _dados(_get("/vereadores/listar/"))
    if not brutos:
        print(f"{LOG} vereadores: fonte vazia.")
        return []

    linhas, usados = [], set()
    for v in brutos:
        nome = _espremer(v.get("nome"))
        if not nome:
            continue
        slug = _slug(nome)
        if slug in usados:
            n = 2
            while f"{slug}-{n}" in usados:
                n += 1
            print(f"{LOG} AVISO: slug {slug!r} colidiu; usando {slug}-{n}.")
            slug = f"{slug}-{n}"
        usados.add(slug)

        # `cargo` traz o papel na Mesa junto do rótulo genérico:
        # "Vereador 2º Secretário". "Vereador" puro não é cargo de mesa.
        cargo = _espremer(v.get("cargo"))
        cargo_mesa = None
        if cargo and _sem_acento(cargo).lower() != "vereador":
            cargo_mesa = _espremer(cargo.replace("Vereador", "", 1))

        legis = (cidade.get("fontes") or {}).get("legislatura") or {}
        linhas.append(
            {
                "id_municipio": id_municipio,
                "slug": slug,
                "nome": nome,
                # A fonte tem um só campo de nome; `nome_urna` recebe o mesmo,
                # como já faz `etl/camaras/sp.py` no caso equivalente.
                "nome_urna": nome,
                "partido": _espremer(v.get("partido")) or None,
                "cargo_mesa": cargo_mesa,
                # A fonte NÃO publica período de mandato — vem de `fontes.legislatura`,
                # nunca de constante no código.
                "mandato_inicio": f"{legis['inicio']}-01-01" if legis.get("inicio") else None,
                "mandato_fim": f"{legis['fim']}-12-31" if legis.get("fim") else None,
                "ativo": True,
                "situacao_mandato": "em_exercicio",
            }
        )
    return linhas


def _gravar_vereadores(client, cidade: dict, linhas: list[dict]) -> None:
    if not linhas:
        print(f"{LOG} vereadores: nada coletado, nada gravado.")
        return
    esperado = (cidade.get("fontes") or {}).get("camara_cadeiras")
    if isinstance(esperado, int) and len(linhas) != esperado:
        print(
            f"{LOG} AVISO: coletei {len(linhas)} vereador(es) mas `camara_cadeiras` diz "
            f"{esperado}. Confira a fonte antes de confiar na composição da Casa."
        )
    upsert_com_colunas_opcionais(
        client, "vereadores", linhas, ["situacao_mandato"], on_conflict="id_municipio,slug"
    )
    print(f"{LOG} vereadores: {len(linhas)} gravado(s).")


# ───────────────────────────── comissões ─────────────────────────────


def _coletar_comissoes(client, cidade: dict) -> tuple[list[dict], list[dict]]:
    id_municipio = cidade["id_municipio"]
    brutos = _dados(_get("/comissoes/listar"))
    if not brutos:
        print(f"{LOG} comissões: fonte vazia.")
        return [], []

    existentes = (
        client.table("vereadores")
        .select("id,nome,slug")
        .eq("id_municipio", id_municipio)
        .execute()
        .data
        or []
    )
    por_slug = {v["slug"]: v["id"] for v in existentes}

    comissoes, membros, perdidos = [], [], []
    for c in brutos:
        nome = _espremer(c.get("comissao"))
        if not nome:
            continue
        tipo = _espremer(c.get("tipo"))
        comissoes.append(
            {
                "id_municipio": id_municipio,
                "nome": nome,
                # A fonte diz "Permanente"/"Especial"/"Temporária"; só a
                # primeira é permanente.
                "especial": _sem_acento(tipo).lower() != "permanente",
            }
        )
        # Armadilha 5: `membros` é uma string de nomes, não ids.
        for bruto in _espremer(c.get("membros")).split(","):
            nome_membro = _espremer(bruto)
            if not nome_membro:
                continue
            vid = por_slug.get(_slug(nome_membro))
            if not vid:
                perdidos.append(f"{nome_membro} ({nome})")
                continue
            membros.append(
                {
                    "id_municipio": id_municipio,
                    "comissao_id": None,  # preenchido depois do upsert do catálogo
                    "nome_comissao_bruto": nome,
                    "vereador_id": vid,
                    "papel": "Membro",
                }
            )
    if perdidos:
        print(
            f"{LOG} {len(perdidos)} membro(s) de comissão sem par em `vereadores` "
            f"(NOT NULL: não dá para gravar): {'; '.join(perdidos[:8])}"
            + (" …" if len(perdidos) > 8 else "")
        )
    return comissoes, membros


def _gravar_comissoes(client, cidade: dict, comissoes: list[dict], membros: list[dict]) -> None:
    id_municipio = cidade["id_municipio"]
    if not comissoes:
        print(f"{LOG} comissões: nada coletado, nada gravado.")
        return
    client.table("comissoes").upsert(comissoes, on_conflict="id_municipio,nome").execute()

    catalogo = (
        client.table("comissoes").select("id,nome").eq("id_municipio", id_municipio).execute().data
        or []
    )
    por_nome = {c["nome"]: c["id"] for c in catalogo}
    for m in membros:
        m["comissao_id"] = por_nome.get(m["nome_comissao_bruto"])
    membros = [m for m in membros if m["comissao_id"]]

    if membros:
        # Armadilha do schema: o unique de `comissao_membros` inclui
        # `data_inicio`/`data_fim`, e no Postgres NULL nunca colide com NULL —
        # `ON CONFLICT` não deduplicaria e cada rodada duplicaria a composição.
        # Por isso refresh total, e não upsert.
        refresh_completo_seguro(
            client,
            "comissao_membros",
            {"id_municipio": id_municipio},
            membros,
            ao_reduzir="skip",
            rotulo="etl.camaras.syssolution/comissao_membros",
        )
    print(f"{LOG} comissões: {len(comissoes)} catálogo, {len(membros)} vínculo(s) de membro.")


# ─────────────────────── leis (atos_oficiais) ────────────────────────

# Rótulo da fonte -> `atos_oficiais.tipo`. Mesmo vocabulário Title Case de
# `etl/pbh/legislacao.py`, `etl/psp/legislacao.py` e `etl/camaras/sapl.py`: a
# tela monta o filtro de categoria a partir desta coluna.
TIPO_ATO_NO_BANCO = {
    "LEI ORDINARIA": "Lei Ordinária",
    "LEI COMPLEMENTAR": "Lei Complementar",
    "LEI ORGANICA": "Lei Orgânica",
    "LEI ORGANICA MUNICIPAL": "Lei Orgânica",
    "DECRETO": "Decreto",
    "DECRETO LEGISLATIVO": "Decreto Legislativo",
    "PORTARIA": "Portaria",
    "RESOLUCAO": "Resolução",
    "EMENDA A LEI ORGANICA": "Emenda à Lei Orgânica",
    "ATO PRESIDENCIAL": "Ato Presidencial",
}


def _rotulo_ato(bruto: str) -> str:
    """"LO - Lei Ordinária" -> "Lei Ordinária"."""
    texto = _espremer(bruto)
    if " - " in texto:  # a fonte prefixa a sigla
        texto = texto.split(" - ", 1)[1]
    chave = _sem_acento(texto).upper()
    return TIPO_ATO_NO_BANCO.get(chave, texto.title() or "Norma")


def _coletar_leis(cidade: dict) -> list[dict]:
    id_municipio = cidade["id_municipio"]
    brutos = _paginar("/leis/listar/{n}/{p}", "leis")
    if not brutos:
        return []
    linhas = []
    for l in brutos:
        ementa = _espremer(l.get("ementa"))
        sancao = _espremer(l.get("sancao"))
        # A fonte manda data em dd/mm/aaaa; a coluna é `date`.
        data = None
        if len(sancao) == 10 and sancao[2] == "/":
            d, m, a = sancao.split("/")
            data = f"{a}-{m}-{d}"
        linhas.append(
            {
                "id_municipio": id_municipio,
                "tipo": _rotulo_ato(l.get("tipo")),
                "numero": _espremer(l.get("numero")) or None,
                "ano": l.get("ano"),
                "ementa": ementa or None,
                "data_publicacao": data,
                "link_fonte": f"{_SESSAO.headers['Origin']}/leis",
                "temas": classificar_texto(ementa),
            }
        )
    return linhas


def _gravar_leis(cidade: dict, linhas: list[dict], permitir_reducao: bool) -> None:
    dono = (cidade.get("fontes") or {}).get("legislacao_fonte")
    if dono != FONTE_LEGISLACAO:
        raise RuntimeError(
            f"{cidade['nome']}: `fontes.legislacao_fonte` é {dono!r}, não {FONTE_LEGISLACAO!r}. "
            "Recuso escrever em atos_oficiais — o refresh total apagaria o acervo do dono."
        )
    if not linhas:
        print(f"{LOG} leis: nada coletado — NÃO apago o que já existe.")
        return
    client = get_supabase_client()  # conexão nova: a coleta é longa
    refresh_completo_seguro(
        client,
        "atos_oficiais",
        {"id_municipio": cidade["id_municipio"]},
        linhas,
        permitir_reducao=permitir_reducao,
        rotulo="etl.camaras.syssolution",
    )
    com_tema = sum(1 for r in linhas if r["temas"])
    print(f"{LOG} atos_oficiais: {len(linhas)} lei(s), {com_tema} com tema classificado.")


# ──────────────────────────── proposições ────────────────────────────

# Rótulo da fonte (já normalizado) -> `proposicoes.tipo`, no vocabulário que
# `apps/web/lib/betim/vereadores.ts` conhece. Tipo fora deste mapa recebe peso
# 0 em `PESO_PROPOSICAO[tipo] ?? 0` e NÃO PONTUA no ranking, sem erro nenhum —
# foi assim que 446 moções de BH entraram valendo zero em 2026-08-03.
TIPO_PROPOSICAO = {
    "projeto de lei": "projeto_lei",
    "projeto de lei ordinaria": "projeto_lei",
    "projeto de lei complementar": "projeto_lei_complementar",
    "projeto de decreto legislativo": "projeto_decreto_legislativo",
    "projeto de resolucao": "projeto_resolucao",
    "projeto de emenda a lei organica": "proposta_emenda_lei_organica",
    "emenda a lei organica": "emenda_lei_organica",
    "emenda ao projeto": "emenda",
    "emenda modificativa ao projeto de lei": "emenda",
    "emenda": "emenda",
    "indicacao": "indicacao",
    "requerimento": "requerimento",
    "mocao": "mocao",
    "portaria": "portaria",
    "ato presidencial": "ato_presidencial",
}

# Sufixos de ORIGEM que a fonte cola no tipo: CMD = Câmara Municipal de
# Diamantina, PMD = Prefeitura Municipal de Diamantina. Não são tipos.
_SUFIXOS_ORIGEM = (" cmd", " pmd")


def _slug_tipo(bruto: str) -> str | None:
    """Normaliza o rótulo da fonte até o vocabulário do app (armadilha 6).

    Tira acento, caixa, espaço sobrando, o sufixo de origem (CMD/PMD) e o
    número de documento que a fonte às vezes deixa no tipo
    ("Emenda Modificativa ao Projeto de Lei CMD 07/2024.").
    """
    texto = _espremer(_sem_acento(bruto)).lower().rstrip(". ")
    # corta "07/2024" e o que vier depois
    partes = []
    for palavra in texto.split():
        if "/" in palavra or palavra.replace("/", "").isdigit():
            break
        partes.append(palavra)
    texto = " ".join(partes)
    for sufixo in _SUFIXOS_ORIGEM:
        if texto.endswith(sufixo):
            texto = texto[: -len(sufixo)].strip()
    return TIPO_PROPOSICAO.get(texto)


def _data_br(valor) -> str | None:
    texto = _espremer(valor)[:10]
    if len(texto) == 10 and texto[2] == "/":
        d, m, a = texto.split("/")
        return f"{a}-{m}-{d}"
    return None


def _coletar_proposicoes(client, cidade: dict) -> tuple[list[dict], dict[str, int]]:
    id_municipio = cidade["id_municipio"]
    vereadores = (
        client.table("vereadores")
        .select("id,nome,slug")
        .eq("id_municipio", id_municipio)
        .execute()
        .data
        or []
    )
    por_slug = {v["slug"]: v["id"] for v in vereadores}

    # Armadilha 2: aqui `totalPaginas` é página de verdade.
    brutos = _paginar("/proposicoes/listar/{n}/{p}", "proposicoes")
    # …e aqui NÃO é: a resposta única já traz todos os registros.
    projetos = _dados(_get("/projeto/relatorios/todos/todos/todos/todos/"))
    print(f"{LOG} projetos: {len(projetos)} registro(s) numa única requisição.")

    linhas: list[dict] = []
    sem_tipo: dict[str, int] = {}
    vistos: set[tuple] = set()

    def acrescentar(tipo_bruto, numero, ano, ementa, autoria, data):
        slug_tipo = _slug_tipo(tipo_bruto)
        if not slug_tipo:
            sem_tipo[_espremer(tipo_bruto)] = sem_tipo.get(_espremer(tipo_bruto), 0) + 1
            return
        try:
            num = int(str(numero).strip())
        except (TypeError, ValueError):
            return
        if not ano:
            return
        chave = (slug_tipo, num, int(ano))
        if chave in vistos:  # ON CONFLICT não pode tocar a mesma linha 2x
            return
        vistos.add(chave)
        autor = _espremer(autoria)
        linhas.append(
            {
                "id_municipio": id_municipio,
                "tipo": slug_tipo,
                "numero": num,
                "ano": int(ano),
                "ementa": _espremer(ementa) or None,
                "data_apresentacao": data,
                "autores": [autor] if autor else [],
                "vereador_id": por_slug.get(_slug(autor)),
                "temas": classificar_texto(ementa),
            }
        )

    for p in brutos:
        # `texto` é o inteiro teor; a tabela não tem coluna para isso, então
        # ele serve só para classificar tema — em memória, não gravado.
        acrescentar(p.get("tipo"), p.get("numero"), p.get("ano"), p.get("texto"), p.get("autoria"), _data_br(p.get("data")))
    for p in projetos:
        acrescentar(p.get("tipo"), p.get("numero"), p.get("ano"), p.get("assunto"), p.get("autoria"), _data_br(p.get("data_recebimento")))

    return linhas, sem_tipo


def _gravar_proposicoes(client, linhas: list[dict], sem_tipo: dict[str, int]) -> None:
    if sem_tipo:
        print(f"{LOG} AVISO — tipo(s) SEM MAPA (não gravados, não pontuariam no ranking):")
        for rotulo, n in sorted(sem_tipo.items(), key=lambda kv: -kv[1]):
            print(f"{LOG}   {n:>5}x  {rotulo!r}")
    if not linhas:
        print(f"{LOG} proposições: nada a gravar.")
        return
    upsert_com_colunas_opcionais(
        client,
        "proposicoes",
        linhas,
        ["temas", "data_apresentacao"],
        on_conflict="id_municipio,tipo,numero,ano",
    )
    com_autor = sum(1 for r in linhas if r["vereador_id"])
    print(f"{LOG} proposicoes: {len(linhas)} gravada(s), {com_autor} casada(s) com vereador.")


# ─────────────────────────── sub-ações extras ────────────────────────


def listar_tipos(id_municipio: str) -> None:
    cidade = carregar_municipio(id_municipio)
    _preparar_sessao(cidade)
    brutos = _get("/projeto/tipos")
    tipos = brutos.get("data", brutos) if isinstance(brutos, dict) else brutos
    print(f"{LOG} {len(tipos)} tipo(s) de projeto na fonte:")
    for t in tipos:
        slug = _slug_tipo(t)
        marca = slug or "*** SEM MAPA — não pontuaria no ranking ***"
        print(f"  {str(t)!r:<55} -> {marca}")


# ─────────────────────────────── sync ────────────────────────────────


def sync(id_municipio: str, partes: set[str], *, permitir_reducao: bool = False) -> None:
    cidade = carregar_municipio(id_municipio)
    _preparar_sessao(cidade)
    client = get_supabase_client()

    if "vereadores" in partes:
        _gravar_vereadores(client, cidade, _coletar_vereadores(cidade))
    if "comissoes" in partes:
        comissoes, membros = _coletar_comissoes(client, cidade)
        _gravar_comissoes(client, cidade, comissoes, membros)
    if "proposicoes" in partes:
        linhas, sem_tipo = _coletar_proposicoes(client, cidade)
        _gravar_proposicoes(get_supabase_client(), linhas, sem_tipo)
    if "leis" in partes:
        _gravar_leis(cidade, _coletar_leis(cidade), permitir_reducao)


PARTES_VALIDAS = {"vereadores", "comissoes", "proposicoes", "leis"}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument("--partes", default="vereadores,comissoes,proposicoes,leis")
    parser.add_argument("--permitir-reducao", action="store_true")
    parser.add_argument("--listar-tipos", action="store_true")
    args = parser.parse_args()

    try:
        if args.listar_tipos:
            listar_tipos(args.id_municipio)
        else:
            partes = {p.strip() for p in args.partes.split(",") if p.strip()}
            invalidas = partes - PARTES_VALIDAS
            if invalidas:
                raise RuntimeError(f"parte(s) desconhecida(s): {sorted(invalidas)}")
            sync(args.id_municipio, partes, permitir_reducao=args.permitir_reducao)
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
