/**
 * @file betim-saude.ts
 * @description Consultas de SAÚDE e MORTALIDADE do eixo Cidades: internações
 * (SIH/SUS), ranking por CID-10, arboviroses (dengue) e óbitos por grupo de
 * causa. Saíram de `queries/betim.ts` na divisão de módulos de 09/10/2026 —
 * o CodeScene apontou "Number of Functions in a Single Module" (95 funções
 * contra teto de 75), e este é um bloco coeso com fronteira limpa.
 *
 * Fontes oficiais: internações vêm do SIH/SUS (DataSUS), o recorte por CID-10
 * é alimentado pelo coletor `etl/betim/etl/bd/sih_cid.py`, e as arboviroses
 * vêm do InfoDengue. A leitura de saúde é sensível: número errado aqui é dano
 * (AGENTS §1), por isso toda consulta recebe `idMunicipio` explícito e passa
 * pela cadeia de reserva do banco (`emBetim`/`comBancoReserva`).
 *
 * A REGRA de `idMunicipio` como primeiro parâmetro obrigatório (do eixo
 * Cidades) vale aqui igual: não existe consulta sem recorte de município.
 */
import { and, asc, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { comBancoReserva } from "@/lib/db/reserva";
import { num } from "@/lib/db/num";
import type { IdMunicipio } from "@/lib/db/queries/municipios";
import {
  arboviroses,
  mortalidade,
  saude_estabelecimentos,
  saude_internacoes,
  saude_internacoes_cid,
} from "@/lib/db/schema";
import { emBetim } from "./betim-nucleo";

/** Quantos estabelecimentos de saúde e a soma dos profissionais. */
export async function resumoEstabelecimentosSaude(idMunicipio: IdMunicipio) {
  return comBancoReserva(
    async (db) => {
      const [linha] = await db
        .select({
          qtd: sql<number>`count(*)::int`,
          profissionais: sql<number>`coalesce(sum(${saude_estabelecimentos.profissionais_count}), 0)::int`,
        })
        .from(saude_estabelecimentos)
        .where(eq(saude_estabelecimentos.id_municipio, idMunicipio));
      return linha ?? { qtd: 0, profissionais: 0 };
    },
    { vazio: (r) => r === null || r.qtd === 0, padrao: null, rotulo: "betim" }
  );
}

export async function internacoesSaude(idMunicipio: IdMunicipio) {
  return emBetim(
    async (db) => {
      return db
        .select({
          ano: saude_internacoes.ano,
          carater: saude_internacoes.carater,
          qtd: saude_internacoes.qtd,
          obitos: saude_internacoes.obitos,
          permanencia_media: num(saude_internacoes.permanencia_media),
        })
        .from(saude_internacoes)
        .where(eq(saude_internacoes.id_municipio, idMunicipio))
        .orderBy(
          desc(saude_internacoes.ano),
          asc(saude_internacoes.carater),
          asc(saude_internacoes.id)
        );
    }
  );
}

/** Internações de urgência (caráter "2") a partir de um ano. */
export async function internacoesUrgenciaDesde(idMunicipio: IdMunicipio, anoMinimo: number) {
  return emBetim(
    async (db) => {
      return db
        .select({ ano: saude_internacoes.ano, qtd: saude_internacoes.qtd })
        .from(saude_internacoes)
        .where(
          and(
            eq(saude_internacoes.id_municipio, idMunicipio),
            eq(saude_internacoes.carater, "2"),
            gte(saude_internacoes.ano, anoMinimo)
          )
        );
    }
  );
}

/** Ranking das internações por CID-10 (tabela `saude_internacoes_cid`,
 * alimentada pelo coletor `etl/betim/etl/bd/sih_cid.py`). Ordenado do
 * diagnóstico mais frequente para o menos, do ano mais recente para o
 * mais antigo. */
export async function rankingCidsMunicipio(idMunicipio: IdMunicipio) {
  return emBetim(
    async (db) => {
      return db
        .select({
          ano: saude_internacoes_cid.ano,
          cid_codigo: saude_internacoes_cid.cid_codigo,
          capitulo: saude_internacoes_cid.capitulo,
          internacoes_total: saude_internacoes_cid.internacoes_total,
          obitos_total: saude_internacoes_cid.obitos_total,
          dias_permanencia_total: num(saude_internacoes_cid.dias_permanencia_total),
          valor_total: num(saude_internacoes_cid.valor_total),
        })
        .from(saude_internacoes_cid)
        .where(eq(saude_internacoes_cid.id_municipio, idMunicipio))
        .orderBy(
          desc(saude_internacoes_cid.ano),
          desc(saude_internacoes_cid.internacoes_total),
          asc(saude_internacoes_cid.cid_codigo)
        );
    }
  );
}

export async function arbovirosesDoMunicipio(idMunicipio: IdMunicipio) {
  return emBetim(
    async (db) => {
      return db
        .select({
          doenca: arboviroses.doenca,
          ano: arboviroses.ano,
          casos: arboviroses.casos,
          nivel_alerta: arboviroses.nivel_alerta,
        })
        .from(arboviroses)
        .where(eq(arboviroses.id_municipio, idMunicipio))
        .orderBy(desc(arboviroses.ano), asc(arboviroses.id));
    }
  );
}

/** Últimas semanas de dengue — janela curta, é o que o InfoDengue devolve. */
export async function ultimasSemanasDeDengue(idMunicipio: IdMunicipio, limite: number) {
  return emBetim(
    async (db) => {
      return db
        .select({
          semana_epidemiologica: arboviroses.semana_epidemiologica,
          casos: arboviroses.casos,
          ano: arboviroses.ano,
        })
        .from(arboviroses)
        .where(and(eq(arboviroses.id_municipio, idMunicipio), eq(arboviroses.doenca, "dengue")))
        .orderBy(
          desc(arboviroses.ano),
          desc(arboviroses.semana_epidemiologica),
          asc(arboviroses.id)
        )
        .limit(limite);
    }
  );
}

export function anoMaisRecenteDeMortalidade(idMunicipio: IdMunicipio) {
  return comBancoReserva(async (db) => {
    const linhas = await db.select({ ano: mortalidade.ano }).from(mortalidade)
      .where(and(eq(mortalidade.id_municipio, idMunicipio), isNotNull(mortalidade.ano)))
      .orderBy(desc(mortalidade.ano)).limit(1);
    return linhas[0]?.ano ?? null;
  }, { vazio: (r) => r === null, padrao: null, rotulo: "betim" });
}

export async function topCausasDeMortalidade(
  idMunicipio: IdMunicipio,
  ano: number,
  limite: number
) {
  return emBetim(
    async (db) => {
      return db
        .select({ grupo_causa: mortalidade.grupo_causa, obitos: mortalidade.obitos })
        .from(mortalidade)
        .where(and(eq(mortalidade.id_municipio, idMunicipio), eq(mortalidade.ano, ano)))
        .orderBy(desc(mortalidade.obitos), asc(mortalidade.id))
        .limit(limite);
    }
  );
}

/** Óbitos por grupo de causa a partir de um ano — base do cálculo de tendência. */
export async function mortalidadeDesde(idMunicipio: IdMunicipio, anoMinimo: number) {
  return emBetim(
    async (db) => {
      return db
        .select({
          ano: mortalidade.ano,
          grupo_causa: mortalidade.grupo_causa,
          obitos: mortalidade.obitos,
        })
        .from(mortalidade)
        .where(and(eq(mortalidade.id_municipio, idMunicipio), gte(mortalidade.ano, anoMinimo)));
    }
  );
}
