"""etl.camaras.ligar_votacoes — casa cada votação com a proposição votada.

    python -m etl.camaras.ligar_votacoes --id-municipio 3106705
    python -m etl.camaras.ligar_votacoes --todas
    python -m etl.camaras.ligar_votacoes --todas --dry-run

`votacoes_camara` guarda a matéria só como TEXTO (`materia`). Sem o elo para
`proposicoes` dá para dizer "fulano votou Sim 412 vezes" e não dá para dizer
"fulano votou Sim num projeto que a análise classificou como reducionista" —
que é a única forma de coerência de voto que este portal se propõe a medir.
Este módulo preenche `votacoes_camara.proposicao_id` (migration 0042).

É REPARADOR, não coletor: não fala com fonte externa nenhuma, só lê `materia`
e escreve o id. Roda depois de qualquer coleta de proposições, porque
`refresh_completo_seguro` é delete+insert e a FK é ON DELETE SET NULL — o elo
morre no refresh de propósito, e reconstruí-lo é uma passada de segundos.

═══ O QUE É LIGADO, E O QUE FICA DE FORA DE PROPÓSITO ═══

Só liga REFERÊNCIA DIRETA: a matéria começa com o nome de um tipo de
proposição, seguido de número/ano. Fica NULL, e isso não é falha:

  * **Voto PROCEDIMENTAL sobre a matéria** — "Adiamento ao PL 812/2024",
    "Bloco II de emendas ao PL 362/2024", "Rejeição ao Bloco I ao PL ...".
    Tecnicamente daria para extrair o mesmo número, e ligar seria PIOR que
    não ligar: votar Sim ao ADIAMENTO de um projeto garantista não é votar
    contra o projeto, e a régua de coerência leria exatamente ao contrário.
    Um elo que inverte o sentido do voto é dado errado, não dado parcial.
  * **Matéria sem número** — eleição de Mesa, veto, requerimento de urgência.
  * **Matéria fora da janela coletada** — o PL existe, nós não o temos.

═══ AMBIGUIDADE NÃO VIRA ESCOLHA ═══

Se (tipo, número, ano) casar com mais de uma linha de `proposicoes`, o elo
NÃO é feito e o caso é impresso. Escolher a primeira produziria um vínculo
que parece certo, não dá erro nenhum e atribui o voto do vereador à peça
errada — o pior desfecho possível para um portal que publica nome de gente.

═══ PREFIXO NÃO CATALOGADO É AVISO, NÃO SILÊNCIO ═══

`PREFIXO_TIPO` mapeia a grafia de cada casa para o slug de `proposicoes.tipo`.
Prefixo desconhecido é CONTADO e IMPRESSO no resumo, nunca chutado para
`projeto_lei`. Foi um resumo desses ("[tipo não catalogado]", em
`fila_prioridade`) que denunciou a Emenda à Lei Orgânica caindo abaixo de
decreto de crédito — o aviso é o guarda, e ele só serve se alguém o ler.
"""
import argparse
import re
import sys
import unicodedata

from etl.common import get_supabase_client

# Grafia da matéria (como cada casa escreve) → slug de `proposicoes.tipo`.
#
# A chave é comparada JÁ NORMALIZADA (minúscula, sem acento), porque a mesma
# casa alterna "Projeto de Lei" e "PROJETO DE LEI" entre relatórios.
#
# `plo` é o Projeto de Emenda à Lei Orgânica de São Paulo, que a casa numera
# com sigla própria mas grava em `proposicoes` como `emenda_lei_organica`.
PREFIXO_TIPO: dict[str, str] = {
    # Betim — a matéria traz o nome por extenso.
    "projeto de lei": "projeto_lei",
    "projeto de resolucao": "projeto_resolucao",
    "projeto de decreto legislativo": "projeto_decreto_legislativo",
    "emenda a lei organica": "emenda_lei_organica",
    "proposta de emenda a lei organica": "proposta_emenda_lei_organica",
    "requerimento": "requerimento",
    "indicacao": "indicacao",
    "mocao": "mocao",
    # São Paulo e Belo Horizonte — siglas.
    "pl": "projeto_lei",
    "pdl": "projeto_decreto_legislativo",
    "pr": "projeto_resolucao",
    "plo": "emenda_lei_organica",
    "req": "requerimento",
    "ind": "indicacao",
}

# Matéria que é voto SOBRE o rito, não sobre o mérito. Testado contra o
# prefixo já normalizado; qualquer um destes descarta a linha antes de tentar
# casar. Ver o bloco no topo — ligar isto inverteria o sentido do voto.
PROCEDIMENTAL = (
    "emenda",
    "bloco",
    "rejeicao",
    "adiamento",
    "instalacao",
    "substitutivo",
    "destaque",
    "redacao final",
    "veto",
    "urgencia",
    "recurso",
    "parecer",
)

# "Projeto de Lei Nº 557/2025 - Autoria: ..." | "PL 812/2024, do Ver. ..."
MATERIA_RE = re.compile(
    r"^\s*(?P<prefixo>[^\d]{1,60}?)\s*(?:n[º°o.]?\s*)?(?P<numero>\d{1,6})\s*/\s*(?P<ano>\d{4})",
    re.IGNORECASE,
)


def normalizar(texto: str) -> str:
    """Minúscula, sem acento, espaços colapsados — a forma em que os
    prefixos são comparados."""
    sem_acento = unicodedata.normalize("NFKD", texto or "")
    sem_acento = "".join(c for c in sem_acento if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", sem_acento).strip().lower()


def parse_materia(materia: str | None) -> tuple[str, int, int] | None:
    """(tipo_slug, numero, ano) de uma matéria, ou None.

    None tem quatro causas distintas e todas são legítimas: sem número, voto
    procedimental, prefixo não catalogado e tipo que a casa não grava em
    `proposicoes`. Quem chama conta cada uma separadamente — juntá-las numa
    contagem só esconderia o único caso que exige ação (prefixo novo)."""
    if not materia:
        return None
    m = MATERIA_RE.match(materia)
    if not m:
        return None
    prefixo = normalizar(m.group("prefixo")).strip(" -–—:,.")
    if not prefixo:
        return None

    # A ORDEM AQUI É O PONTO. O mapa exato vem PRIMEIRO, e é o que separa
    # "emenda a lei organica" (proposição de verdade, hierarquia mais alta que
    # uma câmara produz) de "emenda ao pl" (voto sobre peça alheia). As duas
    # começam com a mesma palavra; testar `PROCEDIMENTAL` antes descartaria a
    # Emenda à Lei Orgânica como se fosse rito.
    tipo = PREFIXO_TIPO.get(prefixo)
    if tipo:
        return tipo, int(m.group("numero")), int(m.group("ano"))
    if any(prefixo.startswith(p) or f" {p} " in f" {prefixo} " for p in PROCEDIMENTAL):
        return "__procedimental__", 0, 0
    return "__desconhecido__", 0, 0


def ligar_municipio(client, id_municipio: str, dry_run: bool = False) -> dict:
    """Preenche `proposicao_id` das votações de uma cidade. Devolve o resumo."""
    conn = client.conexao()

    with conn.cursor() as cur:
        cur.execute(
            "select id, materia from votacoes_camara where id_municipio = %s",
            (id_municipio,),
        )
        votacoes = cur.fetchall()

        # Índice (tipo, numero, ano) -> [ids]. Uma lista, não um id: é a lista
        # que permite detectar a ambiguidade em vez de sobrescrevê-la.
        cur.execute(
            """select tipo, numero, ano, id from proposicoes
                where id_municipio = %s and tipo is not null
                  and numero is not null and ano is not null""",
            (id_municipio,),
        )
        indice: dict[tuple[str, int, int], list[str]] = {}
        for tipo, numero, ano, pid in cur.fetchall():
            indice.setdefault((tipo, int(numero), int(ano)), []).append(pid)

    resumo = {
        "total": len(votacoes),
        "ligadas": 0,
        "sem_numero": 0,
        "procedimental": 0,
        "prefixo_desconhecido": 0,
        "sem_proposicao": 0,
        "ambiguas": 0,
    }
    desconhecidos: dict[str, int] = {}
    pares: list[tuple[str, str]] = []

    for votacao_id, materia in votacoes:
        chave = parse_materia(materia)
        if chave is None:
            resumo["sem_numero"] += 1
            continue
        tipo, numero, ano = chave
        if tipo == "__procedimental__":
            resumo["procedimental"] += 1
            continue
        if tipo == "__desconhecido__":
            resumo["prefixo_desconhecido"] += 1
            m = MATERIA_RE.match(materia)
            rotulo = normalizar(m.group("prefixo")).strip(" -–—:,.") if m else "?"
            desconhecidos[rotulo] = desconhecidos.get(rotulo, 0) + 1
            continue
        candidatos = indice.get((tipo, numero, ano), [])
        if len(candidatos) > 1:
            resumo["ambiguas"] += 1
            print(
                f"  ⚠ ambígua, NÃO ligada: {materia[:70]!r} casa com "
                f"{len(candidatos)} proposições",
                file=sys.stderr,
            )
            continue
        if not candidatos:
            resumo["sem_proposicao"] += 1
            continue
        pares.append((candidatos[0], votacao_id))
        resumo["ligadas"] += 1

    if pares and not dry_run:
        with conn.cursor() as cur:
            cur.executemany(
                "update votacoes_camara set proposicao_id = %s, updated_at = now() "
                "where id = %s",
                pares,
            )

    if desconhecidos:
        print(
            "  ⚠ PREFIXO NÃO CATALOGADO (acrescente a PREFIXO_TIPO se for um "
            "tipo real desta casa):",
            file=sys.stderr,
        )
        for rotulo, n in sorted(desconhecidos.items(), key=lambda kv: -kv[1]):
            print(f"      {rotulo!r}: {n}", file=sys.stderr)

    return resumo


def ligar_congresso(client, dry_run: bool = False) -> dict:
    """O elo do eixo Congresso — que não precisa de parser nenhum.

    `congresso.votacoes.id_externo` da Câmara é `<idProposicao>-<sequencial>`
    ("2265737-46"), e o prefixo É a chave de `congresso.proposicoes.id_externo`.
    Nada de texto, nada de heurística: `split_part` resolve.

    A cobertura fica limitada pelo que foi COLETADO, não pelo casamento: em
    2026-08-06, 190 das 2.754 votações apontam para proposição que temos.
    O resto são pareceres e requerimentos de proposições fora da janela do
    ETL — a conta certa a acompanhar é essa, e ela sobe coletando mais
    proposição, não mexendo aqui."""
    conn = client.conexao()
    sql = """
        update congresso.votacoes v
           set proposicao_id = p.id
          from congresso.proposicoes p
         where p.id_externo = split_part(v.id_externo, '-', 1)
           and v.proposicao_id is distinct from p.id
    """
    with conn.cursor() as cur:
        cur.execute("select count(*) from congresso.votacoes")
        total = cur.fetchone()[0]
        if dry_run:
            cur.execute(
                """select count(*) from congresso.votacoes v
                    join congresso.proposicoes p
                      on p.id_externo = split_part(v.id_externo, '-', 1)"""
            )
            return {"total": total, "ligadas": cur.fetchone()[0], "dry_run": True}
        cur.execute(sql)
        ligadas = cur.rowcount
    return {"total": total, "ligadas": ligadas}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--id-municipio", help="IBGE de uma cidade (ex.: 3106705)")
    ap.add_argument("--todas", action="store_true", help="todas as cidades")
    ap.add_argument("--congresso", action="store_true", help="eixo Congresso")
    ap.add_argument("--dry-run", action="store_true", help="não escreve")
    args = ap.parse_args()

    if not (args.id_municipio or args.todas or args.congresso):
        ap.error("informe --id-municipio, --todas ou --congresso")

    client = get_supabase_client()

    if args.congresso:
        print("Congresso:", ligar_congresso(client, args.dry_run))

    if args.id_municipio or args.todas:
        conn = client.conexao()
        with conn.cursor() as cur:
            if args.todas:
                cur.execute("select id_municipio, nome from municipios order by nome")
                cidades = cur.fetchall()
            else:
                cur.execute(
                    "select id_municipio, nome from municipios where id_municipio = %s",
                    (args.id_municipio,),
                )
                cidades = cur.fetchall()
                if not cidades:
                    print(f"município {args.id_municipio} não existe", file=sys.stderr)
                    return 1

        for id_municipio, nome in cidades:
            print(f"\n{nome} ({id_municipio})")
            r = ligar_municipio(client, id_municipio, args.dry_run)
            print(
                f"  {r['ligadas']}/{r['total']} ligadas · "
                f"sem número {r['sem_numero']} · procedimental {r['procedimental']} · "
                f"prefixo desconhecido {r['prefixo_desconhecido']} · "
                f"proposição não coletada {r['sem_proposicao']} · "
                f"ambíguas {r['ambiguas']}"
            )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
