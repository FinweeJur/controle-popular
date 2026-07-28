"""etl.magistrados — curadoria da composição dos tribunais (F3).

Rodar:
  python -m etl.magistrados --seed-sql stf > supabase/migrations/0004_seed_stf.sql
  python -m etl.magistrados --upsert stf         # grava direto (exige Supabase)

POR QUE CURADORIA, e não scraping: os portais dos tribunais são hostis a
máquina (STF é soft-404, CNJ 503 — ver docs/F0-discovery.md). O universo
dos superiores é ~93 pessoas, não 18 mil. Curar à mão um JSON auditável é
mais rápido e confiável que 5 scrapers frágeis, e a data de nascimento —
o insumo crítico da projeção de vacância — precisa estar certa.

O STF é o primeiro (11 cadeiras, 10 ocupadas + 1 vaga aberta), e serve de
prova ponta a ponta do pipeline cadeiras → ocupacoes → vw_vacancia →
/vagas → poder de indicação. Os demais superiores entram como novos JSON
em etl/dados/, sem mudança de código.

Mesma disciplina do seed de tribunais: o SQL é GERADO do JSON curado, não
escrito à mão, para dado e migração nunca divergirem.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

DADOS = Path(__file__).resolve().parent / "dados"


def carregar(tribunal: str) -> dict:
    return json.loads((DADOS / f"magistrados-{tribunal}.json").read_text("utf-8"))


def _s(v) -> str:
    return "null" if v is None else "'" + str(v).replace("'", "''") + "'"


def gerar_sql(tribunal: str) -> str:
    d = carregar(tribunal)
    trib = d["tribunal"]
    mins = d["ministros"]
    L: list[str] = []
    L.append(f"-- Seed de magistrados do {trib.upper()} — GERADO por etl/magistrados.py")
    L.append(f"-- a partir de etl/dados/magistrados-{tribunal}.json. NÃO editar à mão.")
    L.append("-- Rode depois de 0001, 0002 e 0003.\n")
    L.append("set search_path = judiciario, public, extensions;\n")

    # ── magistrados (idempotente por slug) ────────────────────
    L.append("insert into magistrados (slug, nome, nome_completo, data_nascimento, origem_carreira) values")
    L.append(
        ",\n".join(
            f"  ({_s(m['slug'])}, {_s(m['nome'])}, {_s(m['nome_completo'])}, "
            f"{_s(m['data_nascimento'])}, {_s(m['origem_carreira'])})"
            for m in mins
        )
    )
    L.append("on conflict (slug) do update set")
    L.append("  data_nascimento = excluded.data_nascimento,")
    L.append("  nome_completo = excluded.nome_completo, origem_carreira = excluded.origem_carreira;\n")

    # ── ocupações — um VALUES só, joinado com cadeiras/magistrados. Idempotente.
    L.append("-- Ocupações: liga cada ministro à sua cadeira.")
    ocup_rows = ",\n".join(
        f"      ({_s(m['slug'])}, {m['cadeira_numero']}, {_s(m['data_posse'])})" for m in mins
    )
    L.append(
        "insert into ocupacoes (cadeira_id, magistrado_id, data_posse)\n"
        "  select c.id, mg.id, v.posse from cadeiras c, magistrados mg,\n"
        "    (values\n" + ocup_rows + "\n"
        "    ) as v(slug, numero, posse)\n"
        f"  where c.tribunal_id = {_s(trib)} and c.numero = v.numero and mg.slug = v.slug\n"
        "on conflict (cadeira_id, magistrado_id, data_posse) do nothing;"
    )

    # ── nomeações — idem, um VALUES só. `senado_id_externo` sintético
    # ('seed:...') porque as antigas não vêm da API do Senado.
    L.append("\n-- Nomeações históricas: alimentam o poder de indicação.")
    nom_rows = ",\n".join(
        f"      ({_s(m['slug'])}, {_s(m['nomeante'])}, {_s(m['data_posse'])})" for m in mins
    )
    L.append(
        "insert into nomeacoes (senado_id_externo, tribunal_id, magistrado_id, "
        "autoridade_nomeante, cargo_nomeante, data_deliberacao)\n"
        f"  select 'seed:{trib}:'||v.slug, {_s(trib)}, mg.id, v.nomeante, "
        "'presidente_republica', v.posse\n"
        "  from magistrados mg,\n"
        "    (values\n" + nom_rows + "\n"
        "    ) as v(slug, nomeante, posse)\n"
        "  where mg.slug = v.slug\n"
        "on conflict (senado_id_externo) do update set "
        "autoridade_nomeante = excluded.autoridade_nomeante;"
    )

    # ── vaga aberta ───────────────────────────────────────────
    if d.get("vaga_aberta"):
        v = d["vaga_aberta"]
        L.append("\n-- Vaga aberta hoje (dado de produto — o app existe para mostrar isto).")
        L.append(
            f"insert into vagas (cadeira_id, data_abertura, motivo, fase)\n"
            f"  select c.id, {_s(v['data_abertura'])}, {_s(v['motivo'])}, 'aberta'\n"
            f"  from cadeiras c where c.tribunal_id = {_s(trib)} and c.numero = {v['cadeira_numero']}\n"
            f"on conflict (cadeira_id, data_abertura) do nothing;"
        )

    # ── conferência ───────────────────────────────────────────
    L.append("\n-- Conferência: ocupantes atuais e vacância projetada (nascimento + 75).")
    L.append(
        f"select magistrado_nome, vacancia_projetada from vw_vacancia\n"
        f"  where tribunal_id = {_s(trib)} and atual order by vacancia_projetada;"
    )
    return "\n".join(L) + "\n"


def gerar_sql_tse() -> str:
    """Seed do TSE — estrutura DIFERENTE da do STF (`gerar_sql`).

    O TSE não usa `ocupacoes`/`vw_vacancia`: a projeção de 75 anos ali
    seria da cadeira de ORIGEM do ministro (STF/STJ), não do mandato de 2
    anos no TSE — usar `ocupacoes` mostraria a data errada na tela de
    vagas (ex.: a "vacância" do Kassio Nunes Marques no TSE apareceria
    como 2047, quando na verdade seu biênio de presidente acaba em 2027).
    Por isso a composição do TSE vive inteira em `mandatos_direcao`, com
    `cargo` distinguindo cota (efetivo_eletiva_stf/stj, efetivo_advogado,
    substituto_*) de função de direção (presidente, vice_presidente,
    corregedor_eleitoral) — uma pessoa pode ter as duas linhas ao mesmo
    tempo.
    """
    d = json.loads((DADOS / "magistrados-tse.json").read_text("utf-8"))
    L: list[str] = []
    L.append("-- Seed do TSE — GERADO por etl/magistrados.py --seed-sql-tse")
    L.append("-- a partir de etl/dados/magistrados-tse.json. NÃO editar à mão.")
    L.append("-- Rode depois de 0001-0004 (magistrados do STF já semeados).\n")
    L.append("set search_path = judiciario, public, extensions;\n")

    novos = d["magistrados"]
    L.append("-- Só os magistrados que NÃO vêm do STF (esses já existem via seed-stf).")
    L.append("insert into magistrados (slug, nome, nome_completo, data_nascimento, origem_carreira) values")
    L.append(
        ",\n".join(
            f"  ({_s(m['slug'])}, {_s(m['nome'])}, {_s(m['nome_completo'])}, "
            f"{_s(m['data_nascimento'])}, {_s(m['origem_carreira'])})"
            for m in novos
        )
    )
    L.append("on conflict (slug) do update set")
    L.append("  data_nascimento = excluded.data_nascimento,")
    L.append("  nome_completo = excluded.nome_completo, origem_carreira = excluded.origem_carreira;\n")

    L.append("-- Mandatos (composição + direção) — todos por slug, STF ou novo.")
    linhas_valores = ",\n".join(
        f"  ({_s(m['slug'])}, {_s(m['cargo'])}, {_s(m['data_inicio'])}, "
        f"{_s(m['data_fim'])}, {_s(m['biennio'])})"
        for m in d["mandatos_direcao"]
    )
    L.append(
        "insert into mandatos_direcao (tribunal_id, magistrado_id, cargo, data_inicio, data_fim, biennio, eleito)\n"
        "  select 'tse', mg.id, v.cargo, v.data_inicio, v.data_fim, v.biennio, true\n"
        "  from magistrados mg,\n"
        "    (values\n" + linhas_valores + "\n"
        "    ) as v(slug, cargo, data_inicio, data_fim, biennio)\n"
        "  where mg.slug = v.slug\n"
        "on conflict (tribunal_id, magistrado_id, cargo, biennio) do update set\n"
        "  data_inicio = excluded.data_inicio, data_fim = excluded.data_fim;"
    )

    L.append("\n-- Conferência: mandatos do TSE por cargo.")
    L.append(
        "select md.cargo, mg.nome, md.data_inicio, md.data_fim from mandatos_direcao md\n"
        "  join magistrados mg on mg.id = md.magistrado_id\n"
        "  where md.tribunal_id = 'tse' order by md.cargo;"
    )
    return "\n".join(L) + "\n"


def upsert(tribunal: str) -> int:
    """Grava direto no Supabase (alternativa ao SQL). Exige .env."""
    from etl.common import get_supabase_client, upsert_em_lotes

    sb = get_supabase_client()
    d = carregar(tribunal)
    trib = d["tribunal"]
    mags = [
        {
            "slug": m["slug"],
            "nome": m["nome"],
            "nome_completo": m["nome_completo"],
            "data_nascimento": m["data_nascimento"],
            "origem_carreira": m["origem_carreira"],
        }
        for m in d["ministros"]
    ]
    upsert_em_lotes(sb, "magistrados", mags, on_conflict="slug")
    print(f"[magistrados] {len(mags)} do {trib.upper()} gravados (ocupações/nomeações: use o SQL 0004).")
    return len(mags)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--seed-sql", metavar="TRIBUNAL", help="emite o SQL de seed (ex.: stf)")
    p.add_argument("--seed-sql-tse", action="store_true", help="emite o SQL de seed do TSE (estrutura diferente)")
    p.add_argument("--upsert", metavar="TRIBUNAL", help="grava magistrados no Supabase")
    args = p.parse_args()
    if args.seed_sql:
        sys.stdout.write(gerar_sql(args.seed_sql))
    elif args.seed_sql_tse:
        sys.stdout.write(gerar_sql_tse())
    elif args.upsert:
        upsert(args.upsert)
    else:
        p.print_help()
