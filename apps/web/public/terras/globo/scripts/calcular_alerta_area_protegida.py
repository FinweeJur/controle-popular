#!/usr/bin/env python3
r"""calcular_alerta_area_protegida.py — varre `atos_oficiais` (todos os
municípios cadastrados) atrás de normas cuja ementa indica CRIAÇÃO,
ALTERAÇÃO (inclusive redução de área/reafetação), REDUÇÃO ou EXTINÇÃO de
uma área protegida (APA, unidade de conservação, parque, monumento
natural, reserva, zoneamento ambiental) e grava
dados/camadas/atos-area-protegida-municipios.geojson: uma feição por
município de MG com a lista de normas encontradas.

POR QUE ESTE SCRIPT EXISTE (pergunta do dono, 2026-08-13): "e de
legislações que os afetem — por exemplo o PL que reduziu a Chapada do
Lagoão em Araçuaí?". A Lei Ordinária 726/2025 de Araçuaí (que MODIFICA o
zoneamento da APA da Chapada do Lagoão) já estava coletada em
`atos_oficiais`, só não estava classificada como `meio_ambiente` (ver
correção em `etl/temas.py`, 2026-08-13) e não existia nenhum jeito de
listar "normas que mexem em área protegida" separado do resto da
legislação. Este script é essa lista.

═══ COMO A TRIAGEM FOI FEITA — E POR QUE NÃO É SÓ REGEX ═══

Uma primeira varredura por palavra-chave (área de proteção ambiental, apa,
unidade de conservação, parque estadual/nacional/municipal, monumento
natural, reserva biológica/extrativista/ecológica, RPPN, zoneamento
ambiental) achou 26 linhas em `atos_oficiais` (medido em 2026-08-13, ver
`_MENCOES_BRUTAS_MEDIDAS` abaixo). Mas MENCIONAR uma área protegida não é a
mesma coisa que MUDAR seu status: "Dá o nome de Fulano ao Parque Municipal
X" ou o regimento interno do conselho gestor de um parque não criam,
alteram, reduzem nem extinguem nada — só administram o que já existe. Cada
uma das 26 foi lida (ementa completa, não só as primeiras palavras) e
classificada à mão, com o motivo registrado no comentário ao lado de cada
entrada em `_CLASSIFICACAO_MANUAL` — a mesma exigência de auditabilidade
que rege `etl/temas.py` (regra explícita, não modelo opaco), aplicada a
uma decisão que uma regex sozinha erraria (achou POR ENGANO o Decreto
65.402/SP, que só atribui a gestão do CONTRATO de concessão do Parque
Campo de Marte a uma agência reguladora — não mexe na área do parque).

Três categorias, para não confundir "muda a área" com "só administra":

  `cria`        — institui uma área protegida nova.
  `altera_area` — amplia, reduz, redefine limite/zoneamento de uma área
                  já existente (inclui a Lei 726/2025 de Araçuaí).
  `processo_em_andamento` — ainda NÃO mudou a área, mas abre caminho pra
                  mudar (ex.: BH/Decreto 18.338, grupo de trabalho "visando
                  a ampliação" do Parque do Bairro Trevo) — mesma lógica
                  de "requerimento" vs. "concessão" do SIGMINE: risco
                  futuro, não fato consumado.
  `administrativo` — menciona a área mas não muda seu status (nome de
                  logradouro dentro do parque, regimento de conselho
                  gestor, concessão de serviço). NÃO entra no alerta
                  principal — listado à parte só para auditoria.

Uma linha de Diamantina (Lei nº 2924/2004, "cria a APA... Barragem de
Extração") aparece DUAS VEZES no banco com `tipo` divergente ("Lei
Orgânica" numa, "Lei Ordinária" noutra) e ementa quase idêntica (uma
grafia tem "da extração", a outra "de extração") — mesmo número, mesma
data, mesma fonte. É duplicata de coleta, não duas normas. Fica UMA na
saída (a `Lei Ordinária`, mais provável de estar correta — Lei Orgânica é
documento único do município, não numerado como lei ordinária), com o
achado registrado aqui para quem for depurar `etl/prefeitura/legislacao.py`
ou a fonte SAPL de Diamantina depois.

═══ COBERTURA ═══

Só entra o que `atos_oficiais` já tem — 6 municípios com legislação
coletada hoje (Araçuaí, Belo Horizonte, Betim, Diamantina, Itinga, MG +
São Paulo/SP, que este script INCLUI na varredura mas EXCLUI do GeoJSON
final porque a camada é da malha municipal de MG
(`municipios-mg.geojson`) e São Paulo não tem polígono nela — os achados
de SP ficam só no log/relatório, nunca escondidos). Ausência de linha
para um dos 853 municípios de MG na saída não é "nenhuma norma sobre área
protegida" — é "este município ainda não tem legislação coletada", ver
`cobertura_da_camada` em cada feição.

Uso:
    python scripts/calcular_alerta_area_protegida.py
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

DIR_GLOBO = Path(__file__).resolve().parent.parent
DIR_CAMADAS = DIR_GLOBO / "dados" / "camadas"
MUNICIPIOS_PATH = DIR_CAMADAS / "municipios-mg.geojson"
SAIDA_PATH = DIR_CAMADAS / "atos-area-protegida-municipios.geojson"

ETL_BETIM = Path("C:/DevCoder/cp-alertas/etl/betim")
sys.path.insert(0, str(ETL_BETIM))
os.chdir(ETL_BETIM)  # etl.common.load_dotenv() lê .env do cwd

LOG = "[calcular_alerta_area_protegida]"

# Contagem de referência da varredura bruta por palavra-chave (medida
# 2026-08-13, ver docstring) -- serve só de sentinela: se rodar de novo e
# vier um número muito diferente, é sinal de que a base mudou (nova
# coleta) e vale reler as ementas nova antes de confiar na classificação.
_MENCOES_BRUTAS_MEDIDAS = 26

# id (uuid) -> (categoria, motivo). Todo id que bate na regex de menção
# PRECISA aparecer aqui -- se um id novo aparecer sem entrada, o script
# avisa e para (ver `main`), para não publicar uma linha nunca lida.
_CLASSIFICACAO_MANUAL: dict[str, tuple[str, str]] = {}


def _classificar_por_chave(chave: str, categoria: str, motivo: str) -> None:
    """`chave` = "id_municipio|tipo|numero|data_publicacao" -- mais estável
    entre rodadas do que o uuid interno (que pode mudar num refresh)."""
    _CLASSIFICACAO_MANUAL[chave] = (categoria, motivo)


# ─── Minas Gerais ──────────────────────────────────────────────────────
_classificar_por_chave(
    "3103405|Lei Ordinária|726|2025-05-27", "altera_area",
    "Modifica a Lei 89/2007 que criou a APA da Chapada do Lagoão -- redefine "
    "zoneamento ambiental. É o caso que motivou este script.",
)
_classificar_por_chave(
    "3121605|Lei Ordinária|2924|2004-05-13", "cria",
    "Cria a APA \"Barragem de Extração\". Duplicata de coleta: mesmo número/data "
    "existe também como tipo=\"Lei Orgânica\" (ementa quase idêntica, só muda "
    "\"da\"/\"de\" extração) -- mantida só esta entrada, a outra fica de fora "
    "da saída por ser o mesmo ato contado duas vezes.",
)
_classificar_por_chave(
    "3121605|Lei Orgânica|2924|2004-05-13", "duplicata",
    "Mesma norma que 3121605|Lei Ordinária|2924|2004-05-13 (mesmo número, mesma "
    "data, mesma fonte, ementa quase idêntica) -- provável divergência de "
    "campo `tipo` na coleta. Excluída da saída para não contar a norma 2x.",
)
_classificar_por_chave(
    "3121605|Lei Complementar|178|2023-09-29", "cria",
    "Cria a APA Serra dos Cristais.",
)
_classificar_por_chave(
    "3121605|Lei Ordinária|2723|2001-12-27", "cria",
    "Cria a APA Santa Polônia (Distrito de Mendanha).",
)
_classificar_por_chave(
    "3106200|Decreto|18.489|2023-10-28", "altera_area",
    "Amplia a área do Parque Municipal do Bairro Trevo -- muda o limite de "
    "uma unidade já existente.",
)
_classificar_por_chave(
    "3106200|Decreto|19.396|2025-12-05", "cria",
    "Cria o Parque Municipal Coqueiros.",
)
_classificar_por_chave(
    "3106200|Decreto|19.685|2026-08-11", "cria",
    "Cria o Parque Municipal Mantiqueira.",
)
_classificar_por_chave(
    "3106200|Decreto|18.338|2023-06-06", "processo_em_andamento",
    "Regulamenta o Parque do Bairro Trevo e institui grupo de trabalho "
    "\"visando a sua ampliação\" -- ainda NÃO amplia (isso é o Decreto "
    "18.489, entrada separada), só abre o processo. Risco futuro, não fato "
    "consumado -- mesma distinção usada para SIGMINE requerimento×operação.",
)
_classificar_por_chave(
    "3106200|Proposição de Lei|47|2023-05-11", "administrativo",
    "Só dá nome de pessoa a espaço dentro do parque -- não muda a área.",
)
_classificar_por_chave(
    "3106200|Lei|11.524|2023-06-22", "administrativo",
    "Mesma denominação da Proposição de Lei 47 (nome de pessoa), já como lei "
    "aprovada -- não muda a área.",
)
_classificar_por_chave(
    "3106200|Lei|11.670|2024-03-14", "administrativo",
    "Altera o NOME do parque (Fazenda Lagoa do Nado), não a área/status.",
)
_classificar_por_chave(
    "3106200|Lei|11.965|2026-01-21", "administrativo",
    "Altera o NOME do parque de novo (acrescenta homenagem), não a área.",
)
_classificar_por_chave(
    "3106200|Lei|12.038|2026-06-11", "administrativo",
    "Nome de pessoa a um espaço multiuso dentro do parque -- não muda a área.",
)
# ─── São Paulo (fora de MG -- entra no relatório, NÃO no GeoJSON) ──────
_classificar_por_chave(
    "3550308|Decreto|65.372|2026-07-23", "cria",
    "Cria e denomina o Parque Municipal Jardim Prainha - Pabreu.",
)
_classificar_por_chave(
    "3550308|Decreto|65.329|2026-07-15", "cria",
    "Cria e denomina o Parque Municipal Morro Grande.",
)
_classificar_por_chave(
    "3550308|Decreto|64.272|2025-06-05", "cria",
    "Cria e denomina o Monumento Natural Municipal Pico do Votussununga.",
)
_classificar_por_chave(
    "3550308|Decreto|65.385|2026-07-30", "cria",
    "Cria e denomina o Parque Municipal do Rio Bixiga.",
)
_classificar_por_chave(
    "3550308|Decreto|65.331|2026-07-15", "cria",
    "Cria e denomina o Parque Municipal Recreio de Parelheiros.",
)
_classificar_por_chave(
    "3550308|Decreto|65.330|2026-07-15", "altera_area",
    "Confere nova redação ao decreto que criou o Parque Jardim Apurá -- "
    "redefine o ato fundador da unidade.",
)
_classificar_por_chave(
    "3550308|Decreto|64.274|2025-06-06", "cria",
    "Cria e denomina o Parque Municipal Morumbi Sul.",
)
_classificar_por_chave(
    "3550308|Decreto|65.402|2026-08-07", "administrativo",
    "Atribui a GESTÃO DO CONTRATO de concessão do Parque Campo de Marte a "
    "uma agência reguladora -- não cria, altera, reduz nem extingue a área "
    "do parque. Achado só porque a ementa cita o nome do parque.",
)
_classificar_por_chave(
    "3550308|Decreto|64.927|2026-01-30", "administrativo",
    "Composição do conselho gestor consultivo do Monumento Natural -- "
    "governança, não área.",
)
_classificar_por_chave(
    "3550308|Resolução|SVMA 1|2026-08-05", "administrativo",
    "Regimento interno do conselho gestor do Parque Linear do Ribeirão "
    "Cocaia -- governança, não área.",
)
_classificar_por_chave(
    "3550308|Lei|18.370|2025-12-25", "administrativo",
    "Institucionaliza uma trilha conectando parques/UCs já existentes -- "
    "não cria nem altera a área de nenhuma unidade.",
)
_classificar_por_chave(
    "3550308|Resolução|SVMA 1|2025-02-26", "administrativo",
    "Divulga o regimento interno do conselho gestor do Parque Alfredo Volpi "
    "-- governança, não área.",
)

CATEGORIA_LABEL = {
    "cria": "Cria área protegida",
    "altera_area": "Altera área/zoneamento de área protegida existente",
    "processo_em_andamento": "Processo em andamento (ainda não mudou a área)",
    "administrativo": "Administrativo (não muda a área) -- fora do alerta principal",
    "duplicata": "Duplicata de coleta -- excluída",
}

# Entra no alerta PRINCIPAL (a pergunta do dono: "legislações que afetem
# área protegida"). `processo_em_andamento` fica junto por transparência
# de risco futuro, mas marcado, nunca somado como se já fosse mudança.
_CATEGORIAS_NO_ALERTA = {"cria", "altera_area", "processo_em_andamento"}


def _data_iso(v) -> str | None:
    """`etl.common.PgClient` já devolve data como string ISO (`_row_out`),
    mas aceita objeto `date` também, pra este script funcionar com
    qualquer um dos dois clientes (ver docstring de `_row_out`)."""
    if v is None:
        return None
    return v.isoformat() if hasattr(v, "isoformat") else str(v)


def _chave(row: dict) -> str:
    dp = _data_iso(row["data_publicacao"]) or "None"
    return f"{row['id_municipio']}|{row['tipo']}|{row['numero']}|{dp}"


def main() -> None:
    from etl.common import get_supabase_client, fetch_all
    from etl.temas import classificar_texto

    # Reusa exatamente a mesma regra de área protegida que corrigiu
    # `etl/temas.py` (não duplica o vocabulário) -- só isola o SUBCONJUNTO
    # de termos de área protegida do resto de `meio_ambiente` (barragem,
    # resíduo sólido etc. não interessam a este alerta específico).
    import re
    termos_area_protegida = re.compile(
        r"[aá]rea de prote[çc][aã]o ambiental|\bapa\b|"
        r"unidade(?:s)? de conserva[çc][aã]o|"
        r"esta[çc][aã]o ecol[oó]gica|"
        r"parque (?:estadual|nacional|municipal)|"
        r"monumento natural|"
        r"reserva particular do patrim[oô]nio natural|\brppn\b|"
        r"reserva (?:biol[oó]gica|extrativista|ecol[oó]gica)|"
        r"ref[uú]gio de vida silvestre|"
        r"zoneamento (?:ambiental|ecol[oó]gico[- ]econ[oô]mico)",
        re.IGNORECASE,
    )

    client = get_supabase_client()
    linhas = fetch_all(
        lambda: client.table("atos_oficiais").select(
            "id, id_municipio, tipo, numero, ementa, data_publicacao, link_fonte"
        )
    )
    print(f"{LOG} {len(linhas)} atos oficiais lidos.")

    achados_brutos = [r for r in linhas if r.get("ementa") and termos_area_protegida.search(r["ementa"])]
    print(f"{LOG} {len(achados_brutos)} menção(ões) bruta(s) a área protegida "
          f"(esperado {_MENCOES_BRUTAS_MEDIDAS} -- se diferente, releia as "
          f"ementas antes de confiar na classificação manual).")

    nao_classificados = []
    linhas_finais = []
    for row in achados_brutos:
        chave = _chave(row)
        if chave not in _CLASSIFICACAO_MANUAL:
            nao_classificados.append((chave, row))
            continue
        categoria, motivo = _CLASSIFICACAO_MANUAL[chave]
        linhas_finais.append((row, categoria, motivo))

    if nao_classificados:
        print(f"{LOG} ERRO: {len(nao_classificados)} linha(s) bateram na regex "
              f"de área protegida mas NÃO têm classificação manual em "
              f"_CLASSIFICACAO_MANUAL -- leia a ementa e adicione antes de "
              f"rodar de novo (não publicamos linha não lida):", file=sys.stderr)
        for chave, row in nao_classificados:
            print(f"{LOG}   chave={chave!r} ementa={row['ementa'][:160]!r}", file=sys.stderr)
        sys.exit(1)

    # ─── Relatório completo (todas as categorias, todos os municípios,
    # inclusive São Paulo) ───
    from collections import Counter
    por_categoria = Counter(c for _, c, _ in linhas_finais)
    por_municipio_categoria: dict[str, Counter] = {}
    for row, categoria, _ in linhas_finais:
        por_municipio_categoria.setdefault(row["id_municipio"], Counter())[categoria] += 1

    nomes_municipio = {r["id_municipio"]: None for r in linhas}
    municipios_rows = fetch_all(lambda: client.table("municipios").select("id_municipio, nome, uf"))
    nomes_municipio = {m["id_municipio"]: (m["nome"], m["uf"]) for m in municipios_rows}

    print(f"\n{LOG} === RELATÓRIO COMPLETO (MG + fora de MG) ===")
    for cat, n in por_categoria.most_common():
        print(f"{LOG} {CATEGORIA_LABEL.get(cat, cat):<55} {n}")
    print(f"{LOG}")
    for muni_id, contagem in sorted(por_municipio_categoria.items()):
        nome, uf = nomes_municipio.get(muni_id, (muni_id, "?"))
        total_alerta = sum(contagem[c] for c in _CATEGORIAS_NO_ALERTA)
        print(f"{LOG} {nome}/{uf}: {dict(contagem)} -> {total_alerta} no alerta principal")

    total_mg_alerta = sum(
        sum(c[cat] for cat in _CATEGORIAS_NO_ALERTA)
        for muni_id, c in por_municipio_categoria.items()
        if nomes_municipio.get(muni_id, (None, None))[1] == "MG"
    )
    print(f"\n{LOG} TOTAL Minas Gerais, normas que criam/alteram área protegida "
          f"(inclui 'processo em andamento'): {total_mg_alerta}")

    # ─── GeoJSON: só municípios de MG, malha de municipios-mg.geojson ───
    with open(MUNICIPIOS_PATH, encoding="utf-8") as f:
        malha = json.load(f)
    geometria_por_geocodigo = {
        feat["properties"]["geocodigo"]: feat["geometry"] for feat in malha["features"]
    }

    features_saida = []
    for muni_id, contagem in sorted(por_municipio_categoria.items()):
        nome, uf = nomes_municipio.get(muni_id, (muni_id, "?"))
        if uf != "MG":
            continue
        geom = geometria_por_geocodigo.get(muni_id)
        if geom is None:
            print(f"{LOG} AVISO: {nome} ({muni_id}) sem polígono em "
                  f"municipios-mg.geojson -- pulado do GeoJSON (fica só no log).")
            continue
        itens = [
            {
                "tipo": row["tipo"],
                "numero": row["numero"],
                "data_publicacao": _data_iso(row["data_publicacao"]),
                "ementa": row["ementa"],
                "categoria": categoria,
                "categoria_label": CATEGORIA_LABEL[categoria],
                "motivo_classificacao": motivo,
                "link_fonte": row["link_fonte"],
            }
            for row, categoria, motivo in linhas_finais
            if row["id_municipio"] == muni_id and categoria in _CATEGORIAS_NO_ALERTA
        ]
        if not itens:
            continue  # só entra no GeoJSON quem tem pelo menos 1 item no alerta principal
        itens_administrativos = [
            {
                "tipo": row["tipo"], "numero": row["numero"],
                "ementa": row["ementa"], "link_fonte": row["link_fonte"],
                "motivo_exclusao": motivo,
            }
            for row, categoria, motivo in linhas_finais
            if row["id_municipio"] == muni_id and categoria not in _CATEGORIAS_NO_ALERTA and categoria != "duplicata"
        ]
        features_saida.append({
            "type": "Feature",
            "properties": {
                "nome": nome,
                "geocodigo": muni_id,
                "uf": uf,
                "total_normas_area_protegida": len(itens),
                "total_cria": sum(1 for i in itens if i["categoria"] == "cria"),
                "total_altera_area": sum(1 for i in itens if i["categoria"] == "altera_area"),
                "total_processo_em_andamento": sum(1 for i in itens if i["categoria"] == "processo_em_andamento"),
                "normas": itens,
                "normas_administrativas_excluidas": itens_administrativos,
                "aviso": (
                    "Esta camada cobre só os municípios com legislação já coletada em "
                    "atos_oficiais (6 hoje: Araçuaí, Belo Horizonte, Betim, Diamantina, "
                    "Itinga e São Paulo/SP -- SP fica fora deste GeoJSON por não ter "
                    "polígono na malha de MG). Ausência de um dos 853 municípios de MG "
                    "aqui NÃO significa que não existe norma sobre área protegida lá -- "
                    "significa que o município ainda não tem legislação coletada. "
                    "Classificação de cada norma (cria/altera/processo em andamento vs. "
                    "administrativo) foi feita lendo a ementa completa à mão, registrada "
                    "em scripts/calcular_alerta_area_protegida.py -- não é IA nem regra "
                    "genérica."
                ),
                "cobertura_da_camada": "6 de 854 municípios (5 de MG + São Paulo/SP, fora do mapa)",
                "fonte": "atos_oficiais (coleta SAPL/DOM/PBH por município)",
            },
            "geometry": geom,
        })

    saida = {
        "type": "FeatureCollection",
        "name": "atos-area-protegida-municipios",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "features": features_saida,
    }
    SAIDA_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(SAIDA_PATH, "w", encoding="utf-8") as fh:
        json.dump(saida, fh, ensure_ascii=False, separators=(",", ": "))
    print(f"\n{LOG} {len(features_saida)} município(s) de MG com pelo menos 1 norma "
          f"no alerta principal -- gravado em {SAIDA_PATH} "
          f"({SAIDA_PATH.stat().st_size:,} bytes).")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # noqa: BLE001
        print(f"{LOG} ERRO: {e}", file=sys.stderr)
        raise
