import { and, asc, desc, eq, isNotNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  alertasInJudiciario,
  magistradosInJudiciario,
  mandatos_direcaoInJudiciario,
  monitoramentosInJudiciario,
  nomeacoesInJudiciario,
  tribunaisInJudiciario,
  vagasInJudiciario,
  vw_vacanciaInJudiciario,
} from "@/lib/db/schema";

/**
 * Queries do eixo Judiciário.
 *
 * Funções nomeadas por domínio, em vez de query solta espalhada por
 * página: é o que permite trocar o backend outra vez sem varrer o app, e
 * é onde o filtro obrigatório (`userId`) fica encapsulado — ver
 * `monitoramentosDoUsuario`.
 *
 * Ordenação e filtro passaram do JavaScript para o SQL. No Supabase, o
 * `fetchAll()` trazia tudo e o `.sort()` acontecia em memória, porque o
 * PostgREST truncava em 1000 linhas e paginar com ordenação era frágil.
 * Sem esse teto, ordenar no banco é mais barato e não tem o risco de
 * ordenar um conjunto truncado — que foi o bug real registrado nos
 * comentários do repo original ("inverteu um ranking inteiro em
 * produção").
 */

/* ─────────────────────── Busca rápida (autocomplete) ─────────────────── */

export type SugestaoBusca = {
  tipo: string;
  titulo: string;
  subtitulo: string | null;
  href: string;
  /**
   * Link para a fonte oficial do ITEM, quando a tabela de origem tem uma —
   * não confundir com `href`, que é navegação DENTRO do portal. `null` para
   * tribunal/magistrado quando a fonte não foi coletada e SEMPRE para vaga:
   * `vagas` é estado calculado (abre quando alguém sai da cadeira), não um
   * ato oficial com URL própria — não tem fonte para linkar, ponto, não é
   * uma lacuna de coleta.
   */
  fonte_url: string | null;
  peso: number;
};

/**
 * Autocomplete do Judiciário: tribunal, magistrado, vaga e indicação.
 *
 * Uma consulta com `union all`, pelo mesmo motivo do eixo Congresso — cada
 * tecla digitada não pode custar quatro subrequests do Worker.
 *
 * Magistrado não tem página própria neste eixo; o destino honesto é a página
 * do tribunal dele, que é onde a composição aparece. Linkar para uma rota
 * inexistente seria pior que não sugerir.
 */
export async function buscaRapidaJudiciario(termo: string, limite = 8) {
  const db = getDb();
  const q = termo.trim();
  if (!db || q.length < 2) return [];
  const like = `%${q}%`;

  const linhas = await db.execute<SugestaoBusca>(sql`
    (select 'tribunal' as tipo, t.sigla as titulo, t.nome as subtitulo,
            '/judiciario/tribunais/' || lower(t.id) as href,
            t.url_composicao as fonte_url,
            case when t.sigla ilike ${like} then 1 else 2 end as peso
       from judiciario.tribunais t
      where t.sigla ilike ${like} or t.nome ilike ${like}
      limit 6)
    union all
    (select 'magistrado', m.nome,
            coalesce(upper(c.tribunal_id) || ' · cadeira ' || c.numero::text, m.origem_carreira),
            '/judiciario/tribunais/' || lower(coalesce(c.tribunal_id, 'stf')),
            m.url_curriculo,
            3
       from judiciario.magistrados m
       left join judiciario.ocupacoes o on o.magistrado_id = m.id and o.atual
       left join judiciario.cadeiras c on c.id = o.cadeira_id
      where m.nome ilike ${like}
      limit 6)
    union all
    (select 'vaga', upper(c.tribunal_id) || ' · cadeira ' || c.numero::text,
            coalesce(v.motivo, 'vaga') ||
              coalesce(', aberta em ' || to_char(v.data_abertura, 'DD/MM/YYYY'), ''),
            '/judiciario/vagas',
            null::text,
            4
       from judiciario.vagas v
       join judiciario.cadeiras c on c.id = v.cadeira_id
      where c.tribunal_id ilike ${like} or v.motivo ilike ${like} or v.fase ilike ${like}
      limit 4)
    union all
    -- nomeacoes NAO tem coluna com o nome do indicado: a API do Senado
    -- devolve o nome dentro da ementa, e o magistrado so e ligado quando ja
    -- foi curado. Buscar nos dois lugares (join opcional + ementa) e o que
    -- faz "Messias" encontrar a indicacao rejeitada de 2026.
    -- (Sem acento nem backtick: este comentario vive DENTRO de um template
    -- literal de TypeScript, onde backtick fecharia a string.)
    (select 'indicação', coalesce(mg.nome, n.senado_identificacao),
            upper(n.tribunal_id) || coalesce(' · ' || n.resultado, ''),
            '/judiciario/indicacoes',
            n.url_fonte,
            5
       from judiciario.nomeacoes n
       left join judiciario.magistrados mg on mg.id = n.magistrado_id
      where mg.nome ilike ${like}
         or n.senado_ementa ilike ${like}
         or n.senado_identificacao ilike ${like}
      order by coalesce(n.data_deliberacao, n.data_mensagem) desc nulls last
      limit 4)
    order by peso
    limit ${limite}
  `);
  return linhas.rows ?? [];
}

export async function listarTribunais() {
  const db = getDb();
  if (!db) return null;
  return db.select().from(tribunaisInJudiciario).orderBy(asc(tribunaisInJudiciario.ramo));
}

/**
 * Integrantes de um tribunal que NÃO têm cadeira atribuída.
 *
 * Existe porque a maior parte dos tribunais brasileiros não publica quem
 * senta em qual cadeira: o TST tem 27 cadeiras (5 do quinto) e não diz quem
 * entrou por qual classe; TRF6 e TJMG são 2ª instância e não numeram cadeira
 * individual. Ver a migration 0008 e `etl/composicao.py`.
 *
 * Sem esta consulta, os 26 do TST, os 18 do TRF6 e os 148 do TJMG estariam no
 * banco e invisíveis no portal — e a alternativa (inventar cadeira e cota)
 * corromperia a contagem de vagas por cota, que é a métrica central do eixo.
 *
 * O `not exists` exclui quem já aparece na composição por cadeira, para o
 * mesmo nome não sair duas vezes na página.
 */
export async function integrantesSemCadeira(tribunalId: string) {
  const db = getDb();
  if (!db) return [];
  const linhas = await db.execute<{
    id: string;
    nome: string;
    nome_completo: string | null;
    cargo: string | null;
    origem_carreira: string | null;
    url_curriculo: string | null;
    data_nascimento: string | null;
    /** De onde a composição foi copiada — o `fonte` de `etl/composicao.py`.
        Existe na coluna desde a migration 0008 e era gravado sem nunca ser
        lido; é o que credita a origem no rodapé da página do tribunal. Nem
        sempre é URL (o STJ publica em PDF e o dado guarda a descrição), por
        isso a tela testa antes de transformar em link. */
    fonte_curadoria: string | null;
  }>(sql`
    select m.id, m.nome, m.nome_completo, m.cargo, m.origem_carreira,
           m.url_curriculo, m.data_nascimento, m.fonte_curadoria
      from judiciario.magistrados m
     where m.tribunal_atual = ${tribunalId}
       and not exists (
             select 1 from judiciario.ocupacoes o
              where o.magistrado_id = m.id and o.atual
           )
     order by m.nome
  `);
  return linhas.rows ?? [];
}

export async function ocupacoesAtuais(tribunalId: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(vw_vacanciaInJudiciario)
    .where(
      and(
        eq(vw_vacanciaInJudiciario.tribunal_id, tribunalId),
        eq(vw_vacanciaInJudiciario.atual, true)
      )
    );
}

/** Ocupações atuais com vacância projetada, da mais próxima para a mais distante. */
export async function proximasVacancias(limite = 50) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(vw_vacanciaInJudiciario)
    .where(
      and(
        eq(vw_vacanciaInJudiciario.atual, true),
        isNotNull(vw_vacanciaInJudiciario.vacancia_projetada)
      )
    )
    .orderBy(asc(vw_vacanciaInJudiciario.vacancia_projetada))
    .limit(limite);
}

/**
 * Composição do TSE — lê `mandatos_direcao`, NÃO `ocupacoes`/`vw_vacancia`.
 *
 * A projeção de 75 anos da view é da cadeira de ORIGEM do ministro
 * (STF/STJ), não do mandato de 2 anos no TSE. Usar a view aqui mostraria a
 * "vacância" do presidente do TSE em 2047, quando ele completa 75 no STF,
 * em vez de 2027, quando acaba o biênio — dado real respondendo à pergunta
 * errada.
 *
 * O nome do magistrado vem por `innerJoin`; no Supabase era o embed
 * `magistrados(nome)`, que devolvia objeto ou array conforme a cardinalidade
 * e obrigava um `Array.isArray()` na saída. O join tipa direto.
 */
export async function mandatosDirecao(tribunalId: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select({
      id: mandatos_direcaoInJudiciario.id,
      cargo: mandatos_direcaoInJudiciario.cargo,
      magistrado_nome: magistradosInJudiciario.nome,
      data_inicio: mandatos_direcaoInJudiciario.data_inicio,
      data_fim: mandatos_direcaoInJudiciario.data_fim,
      biennio: mandatos_direcaoInJudiciario.biennio,
      eleito: mandatos_direcaoInJudiciario.eleito,
    })
    .from(mandatos_direcaoInJudiciario)
    .innerJoin(
      magistradosInJudiciario,
      eq(magistradosInJudiciario.id, mandatos_direcaoInJudiciario.magistrado_id)
    )
    .where(eq(mandatos_direcaoInJudiciario.tribunal_id, tribunalId));
}

export async function obterNomeacao(id: string) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .select()
    .from(nomeacoesInJudiciario)
    .where(eq(nomeacoesInJudiciario.id, id))
    .limit(1);
  return linha ?? null;
}

export async function obterVaga(id: string) {
  const db = getDb();
  if (!db) return null;
  const [linha] = await db
    .select()
    .from(vagasInJudiciario)
    .where(eq(vagasInJudiciario.id, id))
    .limit(1);
  return linha ?? null;
}

export async function listarVagas() {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(vagasInJudiciario)
    .orderBy(desc(vagasInJudiciario.data_abertura));
}

export async function listarNomeacoes(tribunalId?: string) {
  const db = getDb();
  if (!db) return null;
  const q = db.select().from(nomeacoesInJudiciario);
  const comFiltro = tribunalId
    ? q.where(eq(nomeacoesInJudiciario.tribunal_id, tribunalId))
    : q;
  // COALESCE de propósito, e não duas chaves de ordenação: o JS original
  // ordenava por `data_deliberacao ?? data_mensagem ?? ""`, ou seja UM
  // valor com fallback. `ORDER BY a DESC, b DESC` é outra coisa — só
  // desempata por `b` quando `a` empata — e produziu ordem diferente na
  // comparação contra o Supabase. O `NULLS LAST` reproduz o `?? ""` do
  // original, que jogava os sem data para o fim.
  // O `id` é desempate, não capricho: sem ele a ordem entre linhas com a
  // mesma data é indefinida no SQL. O JS original era um sort estável
  // sobre a ordem (arbitrária) que o PostgREST devolvia, então empate
  // "funcionava" por acidente. Na Fase 5 tudo isto vira SSG, e ordem não
  // determinística geraria HTML diferente a cada build.
  return comFiltro.orderBy(
    sql`coalesce(${nomeacoesInJudiciario.data_deliberacao}, ${nomeacoesInJudiciario.data_mensagem}) desc nulls last`,
    asc(nomeacoesInJudiciario.id)
  );
}

/**
 * Monitoramentos de UM usuário.
 *
 * `userId` é o primeiro parâmetro e é OBRIGATÓRIO — não existe sobrecarga
 * sem ele, e ele nunca deve ser lido de query string ou body.
 *
 * Isto não é zelo abstrato. A query original em `app/judiciario/painel`
 * era `sb.from("monitoramentos").select(...)` — **sem filtro de usuário
 * nenhum**. Quem recortava era a RLS (`user_id = auth.uid()` em
 * `0002_rls.sql`), com o PostgREST como único caminho até o banco. No
 * Neon o banco não protege mais nada: a mesma query sem `where` devolveria
 * os monitoramentos de todos os usuários. A fronteira agora é esta função.
 *
 * `monitoramentos` não tem coluna de data de criação, então não há
 * ordenação estável a aplicar aqui — era assim no original também.
 */
export async function monitoramentosDoUsuario(userId: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(monitoramentosInJudiciario)
    .where(eq(monitoramentosInJudiciario.user_id, userId));
}

/** Alertas de UM usuário. Mesma regra do `monitoramentosDoUsuario`. */
export async function alertasDoUsuario(userId: string, limite = 50) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(alertasInJudiciario)
    .where(eq(alertasInJudiciario.user_id, userId))
    .orderBy(desc(alertasInJudiciario.criado_em))
    .limit(limite);
}

export interface NovoMonitoramento {
  nome: string | null;
  tribunais: string[] | null;
  cotas: string[] | null;
  horizonteMeses: number;
  frequencia: string;
}

/**
 * Cria um monitoramento PARA o usuário dado. `userId` vem da sessão lida
 * no servidor (`requireUser()` em `lib/auth/guards.ts`), nunca de um campo
 * de formulário — é a mesma fronteira de `monitoramentosDoUsuario`, agora
 * do lado da escrita.
 */
export async function criarMonitoramento(userId: string, dados: NovoMonitoramento) {
  const db = getDb();
  if (!db) throw new Error("Banco não configurado.");
  const [linha] = await db
    .insert(monitoramentosInJudiciario)
    .values({
      user_id: userId,
      nome: dados.nome,
      tribunais: dados.tribunais,
      cotas: dados.cotas,
      horizonte_meses: dados.horizonteMeses,
      frequencia: dados.frequencia,
      ativo: true,
    })
    .returning();
  return linha;
}
