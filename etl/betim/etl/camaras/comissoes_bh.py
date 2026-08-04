"""etl.camaras.comissoes_bh — comissões e composição da Câmara Municipal de
Belo Horizonte (id_municipio 3106200).

Uso: python -m etl.camaras.comissoes_bh --id-municipio 3106200

FONTE: https://www.cmbh.mg.gov.br — Drupal 7, HTML renderizado no servidor.
Mesmo transporte de `etl/camaras/bh.py` (`requests` + `lxml`): o WAF da
GoCache que obriga `curl_cffi` em `etl/pbh/` está nos hosts da PREFEITURA,
não no da Câmara. Módulo separado de `bh.py` pelo mesmo motivo que
`etl/camaras/comissoes.py` é separado de `etl/camaras/betim.py`: cadência de
cron própria (mensal) e recorte independente das proposições, que levam
horas.

DE ONDE VEM A COMPOSIÇÃO (a decisão deste módulo). Há dois caminhos, os dois
conferidos ao vivo em 2026-08-03:

1. `/atividade-legislativa/comissoes/composicao-comissoes-permanentes/` —
   UM GET, tabela única com as 9 comissões permanentes e 90 participações,
   já com Presidente e Vice-Presidente. Barato, e incompleto: não cobre
   nenhuma comissão temporária, e **não linka o vereador** (`.//a` dentro da
   tabela devolve zero) — só o nome escrito, o que obrigaria a casar
   "Neném da Farmácia"/"Dr. Bruno Pedralva"/"Cláudio do Mundo Novo" com
   `vereadores.nome_urna` por normalização de texto.

2. `/vereadores/<slug>/comissoes` — 41 GETs (~1 min com a pausa de 0,5s),
   265 participações em 41 comissões distintas, incluindo as temporárias e
   o histórico (CPIs e comissões de estudo desde 2017).

ESCOLHIDO O 2, e o 1 fica como CONFERÊNCIA. O que decidiu não foi custo (41
GETs uma vez por mês não são caro nenhum), foram duas coisas: (a) no caminho
2 a identidade do vereador é a URL que nós pedimos — vem de
`vereadores.slug_fonte`, sem casamento por nome em lugar nenhum, e casar por
nome é exatamente a classe de erro que erra em silêncio; (b) o caminho 1
mostraria 90 participações e o 2 mostra 265 — as 40 das 4 comissões
especiais de estudo em vigor e as 135 encerradas, que são o bloco
"Histórico" da página do vereador.

A conferência é o que sustenta o resto: as 90 participações permanentes
agregadas das 41 páginas saíram IDÊNTICAS à página de composição — mesma
pessoa, mesmo papel, mesma comissão, nas duas direções. É essa igualdade que
prova que a página do vereador lista só a participação permanente ATUAL (e
não a de legislaturas passadas), premissa em que se apoia todo o `ativo`
abaixo. Se um dia divergir, o módulo avisa em vez de gravar calado.

O QUE É "ATIVO". A página do vereador mistura vigente e encerrado sem
publicar período nenhum, então quem decide vigência é o CATÁLOGO, não a
participação: `/atividade-legislativa/comissoes` lista o que está em vigor
hoje. Permanentes são os 9 títulos da página de composição; temporárias são
os GUIDs linkados no índice. Medido em 2026-08-03: 130 participações em
vigor (90 permanentes + 40 em 4 comissões especiais de estudo) e 135
encerradas.

LACUNA CONHECIDA — PELO, VETO E PROCESSANTE. O índice lista 6 comissões
temporárias em vigor desses três tipos (4 PELO, 1 veto, 1 processante) e
NENHUMA das 41 páginas de vereador as menciona: ali só aparecem `estudo` e
`cpi`. As páginas `/print/...composicao-comissoes-temporarias?tipoCT=` até
publicam a composição delas, mas com dois defeitos que as desqualificam como
fonte: publicam só nomes, e publicam gente de OUTRA legislatura — a PELO
5/2022 lista Professor Claudiney Dulim, Gilson Guimarães, Álvaro Damião,
Wilsinho da Tabu, Miltinho CGE, Rubão e Ramon Bibiano da Casa de Apoio,
nenhum deles entre os 41 vereadores em exercício. Gravar isso encheria a
página de comissões com composição de 2022 travestida de atual. Ficam de
fora, e o módulo avisa nomeando cada uma — a lacuna é visível, não muda.
Comissão em vigor da qual não se conhece nenhum membro também NÃO entra no
catálogo: um card "Nenhum membro registrado" em `/[municipio]/camara/comissoes`
afirma menos do que a ausência.

SEM DATAS, E A CONSEQUÊNCIA É DE ESCRITA. `data_inicio`/`data_fim` ficam
sempre nulos porque a fonte não publica período: a página do vereador não
tem coluna de data, e a página da CPI publica "Prazo da comissão:
DD/MM/AAAA", que é prazo final, não intervalo — preencher `data_inicio` com
ele seria inventar. Só que o índice único de `comissao_membros` é
(id_municipio, vereador_id, nome_comissao_bruto, papel, data_inicio,
data_fim) e no Postgres NULL nunca colide com NULL: com data nula em TODA
linha, `upsert` não deduplica nada e duplicaria as 265 linhas a cada rodada.
Por isso a escrita é refresh total POR VEREADOR via
`refresh_completo_seguro` — a página traz o histórico completo de uma pessoa
de uma vez, então o conjunto dela é recomputável, e a trava de não-encolher
protege contra uma página que volte parcial. Em Betim só o bloco "em
andamento" tinha esse problema (`etl/camaras/comissoes.py`); aqui é toda
linha.

PAPEL fica como a fonte escreve: Presidente (23), Vice-Presidente (9),
Relator (20), Membro Efetivo (76), Membro Suplente (137). O card de
`/[municipio]/camara/comissoes` só tem lugar nomeado para Presidente e
Relator e joga o resto numa lista rotulada "Membro" — isso é do frontend,
que é o MESMO das duas cidades e não muda por causa desta carga; a distinção
não se perde, `papel` chega inteiro na página do vereador.

Cron: mensal (a composição muda por ato da Mesa, não por sessão).
"""
import argparse
import re
import sys
import time
import urllib.parse

from lxml import html

from etl.camaras.bh import CAMINHO_LISTA, _get, _sessao, _slug_ascii, _texto
from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    carregar_municipio,
    get_supabase_client,
    refresh_completo_seguro,
)

LOG = "[etl.camaras.comissoes_bh]"

HOST_ESPERADO = "cmbh.mg.gov.br"

CAMINHO_INDICE = "/atividade-legislativa/comissoes"
CAMINHO_COMPOSICAO = "/atividade-legislativa/comissoes/composicao-comissoes-permanentes/"

# A aba "Comissões" do perfil é um bloco próprio do Drupal; o id é a âncora
# estável da página (o resto do markup é tema, muda em redesign).
ID_SECAO = "block-consulta-comissoes-consulta-comissoes-ver"

# Pausa entre requisições. `bh.py` usa 0,25s para leitura de registro único;
# aqui são só 42 requisições numa rodada mensal inteira, então vale pagar o
# dobro e ser mais educado com a Casa.
PAUSA = 0.5

# `/atividade-legislativa/comissoes/temporarias/<tipo>/<guid>` — o GUID de 32
# hex é o identificador do SIL e é a ÚNICA chave que casa a comissão
# temporária do índice com a que aparece no perfil do vereador: o índice
# escreve "Requerimento 286/2026 - Emendas Impositivas" e o perfil escreve
# "Comissão Especial de Estudo - Requerimento 286/2026 - Emendas
# Impositivas". Casar por texto perderia as quatro.
_TEMPORARIA_RE = re.compile(
    r"/atividade-legislativa/comissoes/temporarias/([a-z]+)/([0-9a-f]{16,})"
)

# Sufixos que a página de composição pendura no nome ("Fulano - Presidente").
# Lista fechada de propósito: qualquer outro " - " no fim da célula é parte
# do nome, não cargo — partir no último hífen sem conferir transformaria um
# nome composto em papel inventado.
PAPEIS_COM_SUFIXO = {"Presidente", "Vice-Presidente", "Relator"}


def _href(elemento) -> str:
    """O Drupal serve o href percent-encoded e 13 dos 41 slugs têm acento
    (`/vereadores/iza-lourença`); decodificar aqui deixa a comparação com o
    que está no banco legível e correta."""
    return urllib.parse.unquote(elemento.get("href") or "")


# --------------------------------------------------------------------------
# 1. Catálogo do que está em vigor hoje
# --------------------------------------------------------------------------


def _composicao_permanente(sessao, base: str) -> tuple[list[str], set[tuple[str, str, str]]]:
    """(títulos das comissões permanentes, participações {comissão, pessoa, papel}).

    Uma requisição serve às duas coisas: a lista de títulos é o catálogo de
    permanentes em vigor, e o conjunto de trios é a conferência contra o que
    as 41 páginas de vereador disserem. A pessoa vai normalizada por
    `_slug_ascii` porque a comparação é só diagnóstico — não vira dado."""
    doc = html.fromstring(_get(sessao, f"{base}{CAMINHO_COMPOSICAO}").content)
    tabelas = doc.xpath("//table")
    if not tabelas:
        raise RuntimeError(
            f"{CAMINHO_COMPOSICAO} não tem tabela nenhuma — a página mudou de formato. "
            "Sem ela não há catálogo de comissões permanentes nem conferência."
        )

    nomes: list[str] = []
    trios: set[tuple[str, str, str]] = set()
    atual: str | None = None
    for tr in tabelas[0].xpath(".//tr"):
        # A linha de título é um td com colspan contendo <h3>; o texto solto
        # ao lado do h3 é o horário da reunião ("Quarta-feira - 13:30 -
        # Plenário Camil Caram") e NÃO pode entrar no nome — ler o
        # text_content() do td inteiro cola o horário no título e nada mais
        # casa depois.
        titulo = tr.xpath("./td[@colspan]//h3")
        if titulo:
            atual = _texto(titulo[0])
            nomes.append(atual)
            continue
        celulas = tr.xpath("./td")
        if atual is None or len(celulas) < 4:
            continue
        # Colunas: Efetivos | Ramal | Suplentes | Ramal.
        for coluna, papel_implicito in ((0, "Membro Efetivo"), (2, "Membro Suplente")):
            celula = _texto(celulas[coluna])
            if not celula:
                continue  # comissão processante tem coluna de suplente vazia
            pessoa, separador, sufixo = celula.rpartition(" - ")
            if separador and sufixo.strip() in PAPEIS_COM_SUFIXO:
                papel = sufixo.strip()
            else:
                pessoa, papel = celula, papel_implicito
            trios.add((atual, _slug_ascii(pessoa), papel))

    if not nomes:
        raise RuntimeError(
            f"{CAMINHO_COMPOSICAO}: nenhuma comissão lida (esperado 9). "
            "Não vou seguir com catálogo vazio — isso apagaria o `comissao_id` de todo mundo."
        )
    return nomes, trios


def _temporarias_em_vigor(sessao, base: str) -> dict[str, str]:
    """{guid: tipo} das comissões temporárias linkadas no índice.

    O índice é a lista do que está em vigor: encerradas e suspensas ficam em
    subpáginas próprias (`/comissoes/encerradas`, `/comissoes/suspensas`) e
    não aparecem aqui."""
    doc = html.fromstring(_get(sessao, f"{base}{CAMINHO_INDICE}").content)
    temporarias: dict[str, str] = {}
    for a in doc.xpath("//a[contains(@href,'/temporarias/')]"):
        m = _TEMPORARIA_RE.search(_href(a))
        if m:
            temporarias[m.group(2)] = m.group(1)
    if not temporarias:
        raise RuntimeError(
            f"{CAMINHO_INDICE}: nenhum link de comissão temporária — o índice mudou. "
            "Seguir marcaria como encerradas todas as temporárias em vigor."
        )
    return temporarias


# --------------------------------------------------------------------------
# 2. Participações, uma página de vereador por vez
# --------------------------------------------------------------------------


def _participacoes(sessao, base: str, slug_fonte: str) -> list[dict]:
    """Todas as participações de um vereador, vigentes e encerradas.

    Estrutura: dentro de `section#{ID_SECAO}`, cada comissão é um par
    `<h3>` (nome + link) seguido de uma `<table>` irmã cuja segunda linha
    traz o papel."""
    url = f"{base}{CAMINHO_LISTA}/{urllib.parse.quote(slug_fonte)}/comissoes"
    doc = html.fromstring(_get(sessao, url).content)
    secao = doc.xpath(f"//section[@id='{ID_SECAO}']")
    if not secao:
        raise RuntimeError(
            f"{url}: não achei a seção #{ID_SECAO}. O bloco do Drupal foi renomeado — "
            "reveja o seletor antes de gravar, porque 'seção ausente' e 'vereador sem "
            "comissão' são indistinguíveis daqui."
        )

    saida: list[dict] = []
    for h3 in secao[0].xpath(".//h3"):
        link = h3.xpath(".//a[@href]")
        if not link:
            # Quem não está em nenhuma comissão permanente ganha um h3 de
            # recado ("O vereador não possui participações em comissões
            # permanentes atualmente.") — sem link e sem tabela. Ele convive
            # com as temporárias, que continuam listadas abaixo.
            continue
        # `following-sibling::table[1]` sozinho pegaria a tabela do PRÓXIMO
        # h3 caso este viesse sem tabela — atribuiria o papel de uma comissão
        # a outra, calado. Pedir o primeiro irmão que seja table OU h3 e
        # exigir que seja table fecha esse buraco.
        vizinho = h3.xpath("./following-sibling::*[self::table or self::h3][1]")
        if not vizinho or vizinho[0].tag != "table":
            print(f"{LOG} AVISO: '{_texto(h3)}' em {slug_fonte} veio sem tabela de papel — pulando.")
            continue

        caminho = _href(link[0])
        m = _TEMPORARIA_RE.search(caminho)
        linhas = vizinho[0].xpath(".//tr")
        # Primeira linha é o cabeçalho ("Participação"); da segunda em diante,
        # o primeiro td é o papel. Sempre houve exatamente uma linha de papel
        # nos 41 perfis (265/265 em 2026-08-03), mas iterar cobre de graça o
        # caso de alguém ter trocado de papel dentro da mesma comissão.
        for tr in linhas[1:]:
            celulas = tr.xpath("./td")
            papel = _texto(celulas[0]) if celulas else ""
            if not papel:
                continue
            saida.append(
                {
                    "nome": _texto(h3),
                    "caminho": caminho,
                    "guid": m.group(2) if m else None,
                    "tipo": m.group(1) if m else "permanente",
                    "papel": papel,
                }
            )
    return saida


def _em_vigor(participacao: dict, permanentes: set[str], temporarias: dict[str, str]) -> bool:
    """Vigência vem do catálogo, nunca da página do vereador — ver o bloco
    'O QUE É ATIVO' no docstring do módulo."""
    if participacao["guid"]:
        return participacao["guid"] in temporarias
    return participacao["nome"] in permanentes


# --------------------------------------------------------------------------
# 3. Conferência contra a página de composição
# --------------------------------------------------------------------------


def _conferir(esperado: set[tuple[str, str, str]], obtido: set[tuple[str, str, str]]) -> None:
    faltando = sorted(esperado - obtido)
    sobrando = sorted(obtido - esperado)
    if not faltando and not sobrando:
        print(f"{LOG} conferência OK: as {len(esperado)} participações permanentes batem "
              "com a página de composição (mesma pessoa, mesmo papel).")
        return
    print(
        f"{LOG} AVISO: a composição permanente agregada dos perfis divergiu da página "
        f"{CAMINHO_COMPOSICAO} — {len(faltando)} na composição e não nos perfis, "
        f"{len(sobrando)} nos perfis e não na composição. A premissa de que o perfil só "
        "mostra participação permanente ATUAL pode ter caído; confira antes de confiar "
        "no que a página de comissões mostrar."
    )
    for trio in faltando[:10]:
        print(f"{LOG}   só na composição: {trio}")
    for trio in sobrando[:10]:
        print(f"{LOG}   só nos perfis:    {trio}")


# --------------------------------------------------------------------------


def sync(id_municipio: str, permitir_reducao: bool = False) -> None:
    municipio = carregar_municipio(id_municipio)
    host = (municipio["fontes"] or {}).get("camara_host")
    if not host:
        raise RuntimeError(
            f"`municipios.fontes.camara_host` está vazio para {id_municipio} "
            f"({municipio['nome']}-{municipio['uf']}). O host da Câmara sai do banco, "
            "não do código — semeie a fonte antes de rodar."
        )
    # Ler o host do banco impede o default de cidade, mas não impede rodar
    # este parser contra a Câmara ERRADA: os seletores abaixo são do Drupal 7
    # da CMBH, e num portal de outro fornecedor eles casam zero elemento —
    # "nenhuma comissão" é indistinguível de "a Câmara não tem comissão".
    # `obras` e `viagens` já comparavam com HOST_ESPERADO; este não.
    if HOST_ESPERADO not in host:
        raise RuntimeError(
            f"id_municipio={id_municipio} ({municipio['nome']}-{municipio['uf']}) "
            f"tem camara_host={host!r}, e este módulo lê o HTML do Drupal 7 da "
            f"{HOST_ESPERADO}. Rodar aqui não daria erro: daria lista vazia."
        )
    base = host.rstrip("/")
    print(f"{LOG} {municipio['nome']}-{municipio['uf']} ({id_municipio}) em {base}")

    client = get_supabase_client()
    sessao = _sessao()

    vereadores = (
        client.table("vereadores")
        .select("id, slug, slug_fonte, nome_urna")
        .eq("id_municipio", id_municipio)
        .execute()
        .data
        or []
    )
    if not vereadores:
        raise RuntimeError(
            "não há vereadores gravados para este município — rode "
            "`python -m etl.camaras.bh --id-municipio <id> --etapas vereadores` antes."
        )
    sem_slug = [v["slug"] for v in vereadores if not v.get("slug_fonte")]
    if sem_slug:
        raise RuntimeError(
            f"{len(sem_slug)} vereador(es) sem `slug_fonte` ({sem_slug[:5]}): o caminho da "
            "fonte tem acento em 13 dos 41 perfis e NÃO é reconstituível a partir do slug "
            "do portal ('loide-goncalves' -> 'loíde-gonçalves'). Rode a etapa 'vereadores'."
        )

    permanentes_nomes, esperado = _composicao_permanente(sessao, base)
    time.sleep(PAUSA)
    temporarias = _temporarias_em_vigor(sessao, base)
    print(
        f"{LOG} em vigor: {len(permanentes_nomes)} permanentes, "
        f"{len(temporarias)} temporárias ({sorted(set(temporarias.values()))})"
    )
    permanentes = set(permanentes_nomes)

    coletado: list[tuple[dict, list[dict]]] = []
    for i, vereador in enumerate(vereadores, 1):
        coletado.append((vereador, _participacoes(sessao, base, vereador["slug_fonte"])))
        time.sleep(PAUSA)
        if i % 10 == 0 or i == len(vereadores):
            print(f"{LOG} perfis lidos: {i}/{len(vereadores)}")

    total = sum(len(p) for _, p in coletado)
    vigentes = sum(
        1 for _, ps in coletado for p in ps if _em_vigor(p, permanentes, temporarias)
    )
    print(f"{LOG} participações lidas: {total} ({vigentes} em vigor, {total - vigentes} encerradas)")

    _conferir(
        esperado,
        {
            (p["nome"], _slug_ascii(v["nome_urna"] or ""), p["papel"])
            for v, ps in coletado
            for p in ps
            if not p["guid"]
        },
    )

    # --- catálogo -----------------------------------------------------
    # Só entram comissões em vigor DAS QUAIS conhecemos algum membro; ver a
    # lacuna PELO/veto/processante no docstring. `especial` sai da URL, não
    # da palavra "especial" no nome (que é como Betim decide): aqui o dado
    # estrutural existe — `/temporarias/` é temporária, ponto —, e depender
    # do título deixaria "Comissão de Mulheres" e uma "Comissão Especial de
    # Estudo" a um adjetivo de distância.
    catalogo: dict[str, bool] = {}
    for _, participacoes in coletado:
        for p in participacoes:
            if _em_vigor(p, permanentes, temporarias):
                catalogo[p["nome"]] = bool(p["guid"])

    orfas = [
        f"{tipo}/{guid}"
        for guid, tipo in temporarias.items()
        if not any(p["guid"] == guid for _, ps in coletado for p in ps)
    ]
    if orfas:
        print(
            f"{LOG} AVISO: {len(orfas)} comissão(ões) temporária(s) em vigor sem nenhum membro "
            f"publicado nos perfis dos vereadores: {orfas}. Ficam FORA do catálogo (card sem "
            "membro afirma menos que a ausência) — ver a lacuna PELO/veto/processante no "
            "docstring do módulo."
        )
    faltam_membros = [n for n in permanentes_nomes if n not in catalogo]
    if faltam_membros:
        print(f"{LOG} AVISO: comissão permanente em vigor sem membro nos perfis: {faltam_membros}")

    if not catalogo:
        raise RuntimeError(
            "nenhuma comissão em vigor com membro conhecido — não vou reescrever o catálogo "
            "com nada, isso zeraria a página de comissões da cidade."
        )
    client.table("comissoes").upsert(
        [{"id_municipio": id_municipio, "nome": nome, "especial": especial}
         for nome, especial in sorted(catalogo.items())],
        on_conflict="id_municipio,nome",
    ).execute()
    print(f"{LOG} comissoes_no_catalogo={len(catalogo)} "
          f"(permanentes={sum(1 for e in catalogo.values() if not e)}, "
          f"especiais={sum(1 for e in catalogo.values() if e)})")

    id_por_nome = {
        r["nome"]: r["id"]
        for r in (
            client.table("comissoes")
            .select("id, nome")
            .eq("id_municipio", id_municipio)
            .execute()
            .data
            or []
        )
    }

    # --- participações ------------------------------------------------
    gravadas = puladas = 0
    for vereador, participacoes in coletado:
        # Deduplica por (comissão, papel): sem data, duas linhas iguais são
        # indistinguíveis, e como a gravação é INSERT (não upsert) elas
        # entrariam as duas — o índice único não pega, porque tem colunas
        # nulas. Nunca aconteceu nos 41 perfis; a defesa é barata.
        unicas: dict[tuple[str, str], dict] = {}
        for p in participacoes:
            ativo = _em_vigor(p, permanentes, temporarias)
            unicas[(p["nome"], p["papel"])] = {
                "id_municipio": id_municipio,
                # Encerrada não aponta para o catálogo: o catálogo é o que
                # está em vigor. O nome bruto preserva a informação inteira.
                "comissao_id": id_por_nome.get(p["nome"]) if ativo else None,
                "nome_comissao_bruto": p["nome"],
                "vereador_id": vereador["id"],
                "papel": p["papel"],
                "data_inicio": None,
                "data_fim": None,
                "ativo": ativo,
            }
        linhas = list(unicas.values())
        if not linhas:
            print(f"{LOG} {vereador['slug']}: nenhuma participação lida — "
                  "nada apagado (o que já está gravado fica).")
            continue
        # Refresh total por vereador: a página traz o histórico completo de
        # UMA pessoa de uma vez, então o conjunto dela é recomputável — e é
        # a única forma idempotente aqui, porque com data nula o upsert não
        # deduplica (ver docstring). `ao_reduzir="skip"`: um perfil que volte
        # parcial não pode derrubar os outros 40 nem apagar histórico.
        gravou = refresh_completo_seguro(
            client,
            "comissao_membros",
            {"id_municipio": id_municipio, "vereador_id": vereador["id"]},
            linhas,
            permitir_reducao=permitir_reducao,
            ao_reduzir="skip",
            rotulo=f"etl.camaras.comissoes_bh/{vereador['slug']}",
        )
        if gravou:
            gravadas += len(linhas)
        else:
            puladas += 1

    print(f"{LOG} participacoes_gravadas={gravadas} vereadores_pulados={puladas}")

    # --- limpeza do catálogo ------------------------------------------
    # Comissão especial de estudo acaba: sai do índice, as participações
    # dela viram encerradas (comissao_id nulo) na passada acima e a linha do
    # catálogo fica órfã — um card permanente com "Nenhum membro registrado"
    # em `/[municipio]/camara/comissoes`. Some só quem está fora do catálogo
    # de hoje E não é referenciado por ninguém; se um refresh foi pulado e
    # ainda há referência, a linha fica (conservador de propósito).
    removidas = []
    for nome, comissao_id in id_por_nome.items():
        if nome in catalogo:
            continue
        referencias = (
            client.table("comissao_membros")
            .select("id", count="exact")
            .eq("comissao_id", comissao_id)
            .limit(1)
            .execute()
            .count
            or 0
        )
        if referencias:
            print(f"{LOG} '{nome}' saiu do índice mas ainda tem {referencias} membro(s) "
                  "apontando para ela — mantida.")
            continue
        client.table("comissoes").delete().eq("id", comissao_id).execute()
        removidas.append(nome)
    if removidas:
        print(f"{LOG} comissoes_removidas_do_catalogo={len(removidas)}: {removidas}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument(
        "--permitir-reducao",
        action="store_true",
        help="grava mesmo que um perfil traga menos participações do que o banco já tem "
        "(use só depois de conferir na fonte que as participações sumiram mesmo)",
    )
    args = parser.parse_args()
    try:
        sync(args.id_municipio, permitir_reducao=args.permitir_reducao)
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
