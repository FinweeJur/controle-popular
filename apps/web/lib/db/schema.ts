import { pgTable, pgSchema, index, foreignKey, unique, uuid, text, boolean, timestamp, jsonb, check, integer, vector, date, numeric, bigint, primaryKey, pgView } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const congresso = pgSchema("congresso");
export const judiciario = pgSchema("judiciario");


export const alertasInCongresso = congresso.table("alertas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	monitoramento_id: uuid().notNull(),
	user_id: uuid().notNull(),
	proposicao_id: uuid().notNull(),
	motivo: text().notNull(),
	lido: boolean().default(false),
	criado_em: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("alertas_user_id_lido_criado_em_idx").using("btree", table.user_id.asc().nullsLast().op("timestamptz_ops"), table.lido.asc().nullsLast().op("timestamptz_ops"), table.criado_em.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.proposicao_id],
			foreignColumns: [proposicoesInCongresso.id],
			name: "alertas_proposicao_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.monitoramento_id],
			foreignColumns: [monitoramentosInCongresso.id],
			name: "alertas_monitoramento_id_fkey"
		}).onDelete("cascade"),
	unique("alertas_monitoramento_id_proposicao_id_motivo_key").on(table.monitoramento_id, table.proposicao_id, table.motivo),
]);

export const fontes_externasInCongresso = congresso.table("fontes_externas", {
	nome: text().primaryKey().notNull(),
	url: text(),
	tipo_dados: text(),
	ultima_atualizacao: timestamp({ withTimezone: true, mode: 'string' }),
	ultimo_status: text(),
});

export const cache_iaInCongresso = congresso.table("cache_ia", {
	hash: text().primaryKey().notNull(),
	tipo: text(),
	resposta: jsonb(),
	modelo: text(),
	criado_em: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
});

export const casasInCongresso = congresso.table("casas", {
	id: text().primaryKey().notNull(),
	esfera: text().notNull(),
	nome: text().notNull(),
	uf: text(),
	url_api: text(),
	url_site: text(),
	ativo: boolean().default(true),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	check("casas_esfera_check", sql`esfera = ANY (ARRAY['federal'::text, 'estadual'::text, 'municipal'::text])`),
]);

export const bancadasInCongresso = congresso.table("bancadas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	casa_id: text().notNull(),
	id_externo: text(),
	tipo: text().notNull(),
	nome: text().notNull(),
	legislatura: integer(),
	url_site: text(),
}, (table) => [
	foreignKey({
			columns: [table.casa_id],
			foreignColumns: [casasInCongresso.id],
			name: "bancadas_casa_id_fkey"
		}),
	unique("bancadas_casa_id_tipo_id_externo_key").on(table.casa_id, table.id_externo, table.tipo),
	check("bancadas_tipo_check", sql`tipo = ANY (ARRAY['frente'::text, 'bloco'::text, 'federacao'::text, 'partido'::text])`),
]);

export const analise_contestacoesInCongresso = congresso.table("analise_contestacoes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	analise_id: uuid().notNull(),
	user_id: uuid(),
	texto: text().notNull(),
	criado_em: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.analise_id],
			foreignColumns: [analisesInCongresso.id],
			name: "analise_contestacoes_analise_id_fkey"
		}).onDelete("cascade"),
]);

export const documentosInCongresso = congresso.table("documentos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	user_id: uuid().notNull(),
	proposicao_id: uuid(),
	tipo: text().notNull(),
	destinatarios: jsonb(),
	titulo: text(),
	corpo: text(),
	status: text().default('rascunho'),
	criado_em: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("documentos_user_id_criado_em_idx").using("btree", table.user_id.asc().nullsLast().op("timestamptz_ops"), table.criado_em.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.proposicao_id],
			foreignColumns: [proposicoesInCongresso.id],
			name: "documentos_proposicao_id_fkey"
		}).onDelete("set null"),
	check("documentos_status_check", sql`status = ANY (ARRAY['rascunho'::text, 'final'::text, 'enviado'::text])`),
]);

export const monitoramentosInCongresso = congresso.table("monitoramentos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	user_id: uuid().notNull(),
	nome: text().notNull(),
	palavras_chave: text().array(),
	temas: text().array(),
	direitos: text().array(),
	casas: text().array(),
	orgaos: uuid().array(),
	bancadas: uuid().array(),
	parlamentares: uuid().array(),
	so_reducionistas: boolean().default(false),
	frequencia: text().default('diaria'),
	ativo: boolean().default(true),
	criado_em: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("monitoramentos_user_id_ativo_idx").using("btree", table.user_id.asc().nullsLast().op("bool_ops"), table.ativo.asc().nullsLast().op("bool_ops")),
	check("monitoramentos_frequencia_check", sql`frequencia = ANY (ARRAY['imediata'::text, 'diaria'::text, 'semanal'::text])`),
]);

export const enviosInCongresso = congresso.table("envios", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	documento_id: uuid().notNull(),
	user_id: uuid().notNull(),
	canal: text().notNull(),
	destinatario: text(),
	status: text(),
	erro: text(),
	enviado_em: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.documento_id],
			foreignColumns: [documentosInCongresso.id],
			name: "envios_documento_id_fkey"
		}).onDelete("cascade"),
]);

export const embeddingsInCongresso = congresso.table("embeddings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proposicao_id: uuid().notNull(),
	chunk_text: text(),
	embedding: vector({ dimensions: 384 }),
}, (table) => [
	index("embeddings_embedding_idx").using("hnsw", table.embedding.asc().nullsLast().op("vector_cosine_ops")),
	foreignKey({
			columns: [table.proposicao_id],
			foreignColumns: [proposicoesInCongresso.id],
			name: "embeddings_proposicao_id_fkey"
		}).onDelete("cascade"),
]);

export const proposicoesInCongresso = congresso.table("proposicoes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	casa_id: text().notNull(),
	id_externo: text().notNull(),
	sigla_tipo: text(),
	numero: integer(),
	ano: integer(),
	identificacao: text(),
	ementa: text(),
	ementa_detalhada: text(),
	keywords: text(),
	temas_oficiais: text().array(),
	data_apresentacao: timestamp({ withTimezone: true, mode: 'string' }),
	situacao: text(),
	orgao_atual: text(),
	regime: text(),
	apreciacao: text(),
	url_inteiro_teor: text(),
	url_fonte: text(),
	texto_integral: text(),
	tramitando: boolean().default(true),
	data_ultima_tramitacao: timestamp({ withTimezone: true, mode: 'string' }),
	raw: jsonb(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("proposicoes_casa_id_ano_tramitando_idx").using("btree", table.casa_id.asc().nullsLast().op("text_ops"), table.ano.asc().nullsLast().op("text_ops"), table.tramitando.asc().nullsLast().op("text_ops")),
	index("proposicoes_data_apresentacao_idx").using("btree", table.data_apresentacao.desc().nullsFirst().op("timestamptz_ops")),
	index("proposicoes_temas_oficiais_idx").using("gin", table.temas_oficiais.asc().nullsLast().op("array_ops")),
	index("proposicoes_to_tsvector_idx").using("gin", sql`to_tsvector('portuguese'::regconfig, ((COALESCE(ementa, ''::tex`),
	foreignKey({
			columns: [table.casa_id],
			foreignColumns: [casasInCongresso.id],
			name: "proposicoes_casa_id_fkey"
		}),
	unique("proposicoes_casa_id_id_externo_key").on(table.casa_id, table.id_externo),
]);

export const orgaosInCongresso = congresso.table("orgaos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	casa_id: text().notNull(),
	id_externo: text().notNull(),
	sigla: text(),
	nome: text(),
	tipo: text(),
	email: text(),
	url_site: text(),
	ativo: boolean().default(true),
}, (table) => [
	foreignKey({
			columns: [table.casa_id],
			foreignColumns: [casasInCongresso.id],
			name: "orgaos_casa_id_fkey"
		}),
	unique("orgaos_casa_id_id_externo_key").on(table.casa_id, table.id_externo),
]);

export const perfisInCongresso = congresso.table("perfis", {
	user_id: uuid().primaryKey().notNull(),
	nome: text(),
	organizacao: text(),
	email_alertas: boolean().default(true),
	criado_em: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
});

export const votacoesInCongresso = congresso.table("votacoes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	casa_id: text().notNull(),
	id_externo: text().notNull(),
	proposicao_id: uuid(),
	data: date(),
	sigla_orgao: text(),
	descricao: text(),
	aprovacao: boolean(),
}, (table) => [
	foreignKey({
			columns: [table.proposicao_id],
			foreignColumns: [proposicoesInCongresso.id],
			name: "votacoes_proposicao_id_fkey"
		}),
	foreignKey({
			columns: [table.casa_id],
			foreignColumns: [casasInCongresso.id],
			name: "votacoes_casa_id_fkey"
		}),
	unique("votacoes_casa_id_id_externo_key").on(table.casa_id, table.id_externo),
]);

export const tramitacoesInCongresso = congresso.table("tramitacoes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proposicao_id: uuid(),
	sequencia: integer(),
	data_hora: timestamp({ withTimezone: true, mode: 'string' }),
	sigla_orgao: text(),
	descricao: text(),
	despacho: text(),
}, (table) => [
	index("tramitacoes_proposicao_id_data_hora_idx").using("btree", table.proposicao_id.asc().nullsLast().op("timestamptz_ops"), table.data_hora.desc().nullsFirst().op("uuid_ops")),
	foreignKey({
			columns: [table.proposicao_id],
			foreignColumns: [proposicoesInCongresso.id],
			name: "tramitacoes_proposicao_id_fkey"
		}).onDelete("cascade"),
	unique("tramitacoes_proposicao_id_sequencia_key").on(table.proposicao_id, table.sequencia),
]);

export const alertasInJudiciario = judiciario.table("alertas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	monitoramento_id: uuid(),
	user_id: uuid(),
	vaga_id: uuid(),
	motivo: text(),
	lido: boolean().default(false),
	criado_em: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.vaga_id],
			foreignColumns: [vagasInJudiciario.id],
			name: "alertas_vaga_id_fkey"
		}),
	foreignKey({
			columns: [table.monitoramento_id],
			foreignColumns: [monitoramentosInJudiciario.id],
			name: "alertas_monitoramento_id_fkey"
		}).onDelete("cascade"),
	unique("alertas_monitoramento_id_vaga_id_motivo_key").on(table.monitoramento_id, table.vaga_id, table.motivo),
]);

export const enviosInJudiciario = judiciario.table("envios", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	documento_id: uuid(),
	user_id: uuid(),
	canal: text(),
	destinatario: text(),
	status: text(),
	erro: text(),
	enviado_em: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.documento_id],
			foreignColumns: [documentosInJudiciario.id],
			name: "envios_documento_id_fkey"
		}),
]);

export const fontes_externasInJudiciario = judiciario.table("fontes_externas", {
	nome: text().primaryKey().notNull(),
	url: text(),
	tipo_dados: text(),
	ultima_atualizacao: timestamp({ withTimezone: true, mode: 'string' }),
	ultimo_status: text(),
});

export const cadeirasInJudiciario = judiciario.table("cadeiras", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tribunal_id: text().notNull(),
	numero: integer(),
	cota: text().notNull(),
	dispositivo: text(),
	observacao: text(),
}, (table) => [
	index("idx_cadeiras_tribunal").using("btree", table.tribunal_id.asc().nullsLast().op("text_ops"), table.cota.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tribunal_id],
			foreignColumns: [tribunaisInJudiciario.id],
			name: "cadeiras_tribunal_id_fkey"
		}),
	unique("cadeiras_tribunal_id_numero_key").on(table.tribunal_id, table.numero),
]);

export const mandatos_direcaoInJudiciario = judiciario.table("mandatos_direcao", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tribunal_id: text(),
	magistrado_id: uuid(),
	cargo: text(),
	data_inicio: date(),
	data_fim: date(),
	biennio: text(),
	eleito: boolean().default(true),
	fonte: text(),
}, (table) => [
	foreignKey({
			columns: [table.magistrado_id],
			foreignColumns: [magistradosInJudiciario.id],
			name: "mandatos_direcao_magistrado_id_fkey"
		}),
	foreignKey({
			columns: [table.tribunal_id],
			foreignColumns: [tribunaisInJudiciario.id],
			name: "mandatos_direcao_tribunal_id_fkey"
		}),
]);

export const magistradosInJudiciario = judiciario.table("magistrados", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	nome: text().notNull(),
	nome_completo: text(),
	data_nascimento: date(),
	uf_origem: text(),
	genero: text(),
	raca_cor: text(),
	origem_carreira: text(),
	url_foto: text(),
	url_curriculo: text(),
	slug: text(),
}, (table) => [
	unique("magistrados_slug_key").on(table.slug),
]);

export const monitoramentosInJudiciario = judiciario.table("monitoramentos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	user_id: uuid(),
	nome: text(),
	tribunais: text().array(),
	cotas: text().array(),
	ufs: text().array(),
	ramos: text().array(),
	horizonte_meses: integer().default(24),
	frequencia: text().default('semanal'),
	ativo: boolean().default(true),
});

export const cache_iaInJudiciario = judiciario.table("cache_ia", {
	hash: text().primaryKey().notNull(),
	tipo: text(),
	resposta: jsonb(),
	modelo: text(),
	criado_em: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
});

export const ocupacoesInJudiciario = judiciario.table("ocupacoes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cadeira_id: uuid().notNull(),
	magistrado_id: uuid().notNull(),
	data_posse: date(),
	data_saida: date(),
	motivo_saida: text(),
	nomeacao_id: uuid(),
	atual: boolean().generatedAlwaysAs(sql`(data_saida IS NULL)`),
}, (table) => [
	index("idx_ocupacoes_atual").using("btree", table.atual.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.cadeira_id],
			foreignColumns: [cadeirasInJudiciario.id],
			name: "ocupacoes_cadeira_id_fkey"
		}),
	foreignKey({
			columns: [table.magistrado_id],
			foreignColumns: [magistradosInJudiciario.id],
			name: "ocupacoes_magistrado_id_fkey"
		}),
	unique("ocupacoes_cadeira_id_magistrado_id_data_posse_key").on(table.cadeira_id, table.magistrado_id, table.data_posse),
]);

export const tribunaisInJudiciario = judiciario.table("tribunais", {
	id: text().primaryKey().notNull(),
	ramo: text().notNull(),
	instancia: text().default('superior').notNull(),
	esfera: text().default('federal').notNull(),
	nome: text().notNull(),
	sigla: text(),
	uf: text(),
	n_cadeiras: integer(),
	autoridade_nomeante: text(),
	exige_sabatina_senado: boolean().default(false),
	base_legal: text(),
	url_composicao: text(),
	ativo: boolean().default(true),
});

export const beneficios_sociais = pgTable("beneficios_sociais", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	programa: text(),
	competencia: date(),
	beneficiarios: integer(),
	valor_total: numeric({ precision: 15, scale:  2 }),
	fonte: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "beneficios_sociais_id_municipio_fkey"
		}),
	unique("beneficios_sociais_id_municipio_programa_competencia_key").on(table.id_municipio, table.programa, table.competencia),
]);

export const anuncios = pgTable("anuncios", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	nome_comercio: text(),
	plano: text(),
	banner_url: text(),
	link: text(),
	ativo: boolean().default(false),
	data_inicio: date(),
	data_fim: date(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "anuncios_id_municipio_fkey"
		}),
]);

export const arboviroses = pgTable("arboviroses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	doenca: text(),
	semana_epidemiologica: integer(),
	ano: integer(),
	casos: integer(),
	nivel_alerta: integer(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "arboviroses_id_municipio_fkey"
		}),
	unique("arboviroses_id_municipio_doenca_ano_semana_epidemiologica_key").on(table.id_municipio, table.doenca, table.semana_epidemiologica, table.ano),
]);

export const nomeacoesInJudiciario = judiciario.table("nomeacoes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	magistrado_id: uuid(),
	cadeira_id: uuid(),
	tribunal_id: text(),
	autoridade_nomeante: text(),
	cargo_nomeante: text(),
	senado_id_externo: text(),
	senado_identificacao: text(),
	senado_ementa: text(),
	dispositivo_vaga: text(),
	data_mensagem: date(),
	data_deliberacao: date(),
	resultado: text(),
	antecessor_nome: text(),
	motivo_vacancia: text(),
	url_fonte: text(),
	raw: jsonb(),
}, (table) => [
	index("idx_nomeacoes_tribunal").using("btree", table.tribunal_id.asc().nullsLast().op("date_ops"), table.data_deliberacao.asc().nullsLast().op("date_ops")),
	foreignKey({
			columns: [table.cadeira_id],
			foreignColumns: [cadeirasInJudiciario.id],
			name: "nomeacoes_cadeira_id_fkey"
		}),
	foreignKey({
			columns: [table.magistrado_id],
			foreignColumns: [magistradosInJudiciario.id],
			name: "nomeacoes_magistrado_id_fkey"
		}),
	foreignKey({
			columns: [table.tribunal_id],
			foreignColumns: [tribunaisInJudiciario.id],
			name: "nomeacoes_tribunal_id_fkey"
		}),
	unique("nomeacoes_senado_id_externo_key").on(table.senado_id_externo),
]);

export const atos_oficiais = pgTable("atos_oficiais", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	tipo: text(),
	numero: text(),
	ano: integer(),
	ementa: text(),
	data_publicacao: date(),
	link_fonte: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
	temas: text().array(),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "atos_oficiais_id_municipio_fkey"
		}),
]);

export const vagasInJudiciario = judiciario.table("vagas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cadeira_id: uuid(),
	data_abertura: date(),
	motivo: text(),
	fase: text(),
	prazo_nomeacao: date(),
	nomeacao_id: uuid(),
	atualizada_em: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.nomeacao_id],
			foreignColumns: [nomeacoesInJudiciario.id],
			name: "vagas_nomeacao_id_fkey"
		}),
	foreignKey({
			columns: [table.cadeira_id],
			foreignColumns: [cadeirasInJudiciario.id],
			name: "vagas_cadeira_id_fkey"
		}),
	unique("vagas_cadeira_id_data_abertura_key").on(table.cadeira_id, table.data_abertura),
]);

export const perfisInJudiciario = judiciario.table("perfis", {
	user_id: uuid().primaryKey().notNull(),
	nome: text(),
	organizacao: text(),
	email_alertas: boolean().default(true),
});

export const bens_candidato = pgTable("bens_candidato", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	vereador_id: uuid(),
	ano_eleicao: integer(),
	tipo_item: text(),
	descricao_item: text(),
	valor: numeric({ precision: 15, scale:  2 }),
	fonte: text().default('br_tse_eleicoes'),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	index("bens_candidato_vereador_id_idx").using("btree", table.vereador_id.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.vereador_id],
			foreignColumns: [vereadores.id],
			name: "bens_candidato_vereador_id_fkey"
		}),
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "bens_candidato_id_municipio_fkey"
		}),
]);

export const classificados = pgTable("classificados", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	categoria: text(),
	titulo: text(),
	descricao: text(),
	preco: numeric({ precision: 15, scale:  2 }),
	fotos: text().array(),
	contato_whatsapp: text(),
	aprovado: boolean().default(false),
	expira_em: date(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "classificados_id_municipio_fkey"
		}),
]);

export const clima_cache = pgTable("clima_cache", {
	id_municipio: text().primaryKey().notNull(),
	atual: jsonb(),
	diario: jsonb(),
	chuva_7d: numeric(),
	atualizado_em: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "clima_cache_id_municipio_fkey"
		}),
]);

export const coleta_lixo = pgTable("coleta_lixo", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	bairro: text(),
	tipo: text(),
	dias_semana: text().array(),
	horario: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "coleta_lixo_id_municipio_fkey"
		}),
]);

export const caixa_disponivel = pgTable("caixa_disponivel", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	ano: integer().notNull(),
	valor: numeric({ precision: 15, scale:  2 }),
	fonte: text().default('br_me_siconfi'),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "caixa_disponivel_id_municipio_fkey"
		}),
	unique("caixa_disponivel_id_municipio_ano_key").on(table.id_municipio, table.ano),
]);

export const comissao_membros = pgTable("comissao_membros", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	comissao_id: uuid(),
	nome_comissao_bruto: text().notNull(),
	vereador_id: uuid().notNull(),
	papel: text().notNull(),
	data_inicio: date(),
	data_fim: date(),
	ativo: boolean().default(false).notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	index("comissao_membros_comissao_id_idx").using("btree", table.comissao_id.asc().nullsLast().op("uuid_ops")),
	index("comissao_membros_vereador_id_idx").using("btree", table.vereador_id.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.vereador_id],
			foreignColumns: [vereadores.id],
			name: "comissao_membros_vereador_id_fkey"
		}),
	foreignKey({
			columns: [table.comissao_id],
			foreignColumns: [comissoes.id],
			name: "comissao_membros_comissao_id_fkey"
		}),
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "comissao_membros_id_municipio_fkey"
		}),
	unique("comissao_membros_id_municipio_vereador_id_nome_comissao_bru_key").on(table.id_municipio, table.nome_comissao_bruto, table.vereador_id, table.papel, table.data_inicio, table.data_fim),
]);

export const diarias = pgTable("diarias", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	orgao: text(),
	beneficiario: text(),
	vereador_id: uuid(),
	destino: text(),
	data_inicio: date(),
	data_fim: date(),
	qtd_diarias: numeric(),
	valor: numeric({ precision: 15, scale:  2 }),
	motivo: text(),
	link_fonte: text(),
	// Colunas da migration 0031 que o snapshot do Drizzle não acompanhou —
	// existem no banco desde então e eram INVISÍVEIS para o app.
	//
	// `natureza` separa 'diaria' de 'passagem_aerea', e a distinção não é
	// semântica: a PBH não publica diária em dataset nenhum, e somar
	// passagem sob o rótulo "diárias" afirmaria um gasto que não é esse.
	//
	// `origem` é o que impede a leitura errada mais provável desta tabela: a
	// fonte publica ida e volta como DUAS linhas, então 43 das 381 viagens
	// de BH têm destino "Belo Horizonte" — que num portal de BH parece erro,
	// e é só a perna de volta. Sem a origem ao lado, a linha mente.
	//
	// `chave_natural` é o que torna idempotente uma tabela que nasceu só com
	// a pk uuid.
	natureza: text(),
	origem: text(),
	orgao_nome: text(),
	cargo: text(),
	tipo_destino: text(),
	data_solicitacao: date(),
	chave_natural: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.vereador_id],
			foreignColumns: [vereadores.id],
			name: "diarias_vereador_id_fkey"
		}),
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "diarias_id_municipio_fkey"
		}),
]);

export const embeddings = pgTable("embeddings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	entidade: text(),
	entidade_id: uuid(),
	chunk_text: text(),
	embedding: vector({ dimensions: 384 }),
}, (table) => [
	index("embeddings_embedding_idx").using("hnsw", table.embedding.asc().nullsLast().op("vector_cosine_ops")),
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "embeddings_id_municipio_fkey"
		}),
]);

export const emendas = pgTable("emendas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	esfera: text(),
	parlamentar: text(),
	partido_uf: text(),
	ano: integer(),
	valor_empenhado: numeric({ precision: 15, scale:  2 }),
	valor_pago: numeric({ precision: 15, scale:  2 }),
	objeto: text(),
	funcao: text(),
	link_fonte: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "emendas_id_municipio_fkey"
		}),
]);

export const farmacias_plantao = pgTable("farmacias_plantao", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	nome: text(),
	endereco: text(),
	telefone: text(),
	foto_url: text(),
	plantao_inicio: date(),
	plantao_fim: date(),
	h24: boolean().default(false),
	lat: numeric(),
	lng: numeric(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "farmacias_plantao_id_municipio_fkey"
		}),
]);

export const doacoes_campanha = pgTable("doacoes_campanha", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	vereador_id: uuid(),
	ano_eleicao: integer(),
	doador_nome: text(),
	doador_tipo: text(),
	doador_documento_mascarado: text(),
	valor: numeric({ precision: 15, scale:  2 }),
	data_doacao: date(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.vereador_id],
			foreignColumns: [vereadores.id],
			name: "doacoes_campanha_vereador_id_fkey"
		}),
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "doacoes_campanha_id_municipio_fkey"
		}),
]);

export const comissoes = pgTable("comissoes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	nome: text().notNull(),
	especial: boolean().default(false),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "comissoes_id_municipio_fkey"
		}),
	unique("comissoes_id_municipio_nome_key").on(table.id_municipio, table.nome),
]);

export const contratos = pgTable("contratos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	numero_controle_pncp: text(),
	numero_contrato: text(),
	ano: integer(),
	orgao_cnpj: text(),
	orgao_nome: text(),
	unidade_nome: text(),
	categoria: text(),
	tipo: text(),
	objeto: text(),
	fornecedor_cnpj: text(),
	fornecedor_nome: text(),
	valor_inicial: numeric({ precision: 15, scale:  2 }),
	valor_global: numeric({ precision: 15, scale:  2 }),
	aditivos_total: numeric({ precision: 15, scale:  2 }).default('0'),
	data_assinatura: date(),
	vigencia_inicio: date(),
	vigencia_fim: date(),
	numero_parcelas: integer(),
	status: text(),
	alerta: boolean().default(false),
	motivos_alerta: text().array(),
	resumo_ia: text(),
	link_fonte: text(),
	raw: jsonb(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
	temas: text().array(),
}, (table) => [
	index("contratos_id_municipio_ano_idx").using("btree", table.id_municipio.asc().nullsLast().op("int4_ops"), table.ano.asc().nullsLast().op("text_ops")),
	index("contratos_temas_idx").using("gin", table.temas.asc().nullsLast().op("array_ops")),
	index("contratos_to_tsvector_idx").using("gin", sql`to_tsvector('portuguese'::regconfig, objeto)`),
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "contratos_id_municipio_fkey"
		}),
	unique("contratos_numero_controle_pncp_key").on(table.numero_controle_pncp),
]);

export const convenios_federais = pgTable("convenios_federais", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id_externo: bigint({ mode: "number" }).notNull(),
	numero_convenio: text(),
	objeto: text(),
	orgao_nome: text(),
	orgao_sigla: text(),
	convenente_nome: text(),
	situacao: text(),
	tipo_instrumento: text(),
	valor: numeric({ precision: 15, scale:  2 }),
	valor_liberado: numeric({ precision: 15, scale:  2 }),
	valor_contrapartida: numeric({ precision: 15, scale:  2 }),
	data_inicio_vigencia: date(),
	data_final_vigencia: date(),
	data_publicacao: date(),
	fonte: text().default('portal_transparencia'),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
	codigo: text(),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "convenios_federais_id_municipio_fkey"
		}),
	unique("convenios_federais_id_municipio_id_externo_key").on(table.id_municipio, table.id_externo),
]);

export const escolas = pgTable("escolas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	id_inep: text(),
	nome: text(),
	rede: text(),
	etapas: text().array(),
	matriculas: integer(),
	ideb_anos_iniciais: numeric({ precision: 4, scale:  2 }),
	ideb_anos_finais: numeric({ precision: 4, scale:  2 }),
	infraestrutura: jsonb(),
	lat: numeric(),
	lng: numeric(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "escolas_id_municipio_fkey"
		}),
	unique("escolas_id_municipio_id_inep_key").on(table.id_municipio, table.id_inep),
]);

export const comercios_essenciais = pgTable("comercios_essenciais", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	osm_id: bigint({ mode: "number" }).notNull(),
	nome: text().notNull(),
	tipo: text().notNull(),
	bairro: text(),
	endereco: text(),
	telefone: text(),
	lat: numeric(),
	lng: numeric(),
	fonte: text().default('openstreetmap'),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "comercios_essenciais_id_municipio_fkey"
		}),
	unique("comercios_essenciais_id_municipio_osm_id_key").on(table.id_municipio, table.osm_id),
]);

export const contatos_uteis = pgTable("contatos_uteis", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	nome: text(),
	telefone: text(),
	categoria: text(),
	ordem: integer(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "contatos_uteis_id_municipio_fkey"
		}),
]);

export const feriados_nacionais = pgTable("feriados_nacionais", {
	data: date().primaryKey().notNull(),
	nome: text().notNull(),
	tipo: text().notNull(),
});

export const fornecedores = pgTable("fornecedores", {
	cnpj: text().primaryKey().notNull(),
	razao_social: text(),
	nome_fantasia: text(),
	situacao_cadastral: text(),
	cnae_principal: text(),
	cnae_descricao: text(),
	capital_social: numeric({ precision: 15, scale:  2 }),
	porte: text(),
	data_abertura: date(),
	municipio_sede: text(),
	uf_sede: text(),
	sancionado_ceis: boolean().default(false),
	ceis_detalhes: jsonb(),
	atualizado_em: date(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
});

export const meio_ambiente = pgTable("meio_ambiente", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	indicador: text(),
	ano: integer(),
	valor: numeric(),
	unidade: text(),
	fonte: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "meio_ambiente_id_municipio_fkey"
		}),
	unique("meio_ambiente_id_municipio_indicador_ano_key").on(table.id_municipio, table.indicador, table.ano),
]);

export const municipios = pgTable("municipios", {
	id_municipio: text().primaryKey().notNull(),
	nome: text().notNull(),
	uf: text().notNull(),
	cnpj_prefeitura: text(),
	lat: numeric(),
	lng: numeric(),
	dominio: text(),
	branding: jsonb(),
	fontes: jsonb(),
	ativo: boolean().default(true),
	malha_geojson: jsonb(),
	regiao_ibge: jsonb(),
});

export const newsletter_inscritos = pgTable("newsletter_inscritos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	email: text(),
	confirmado: boolean().default(false),
	criado_em: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	temas: text().array(),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "newsletter_inscritos_id_municipio_fkey"
		}),
	unique("newsletter_inscritos_id_municipio_email_key").on(table.id_municipio, table.email),
]);

export const nota_transparencia = pgTable("nota_transparencia", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	ano: integer().notNull(),
	poder: text().notNull(),
	indice_transparencia: numeric({ precision: 6, scale:  4 }).notNull(),
	nivel_transparencia: text().notNull(),
	variacao_indice: numeric({ precision: 8, scale:  6 }),
	variacao_nivel: text(),
	historico_nivel: text(),
	posicao_ranking_uf: integer(),
	total_avaliados_uf: integer(),
	link_site: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "nota_transparencia_id_municipio_fkey"
		}),
	unique("nota_transparencia_id_municipio_ano_poder_key").on(table.id_municipio, table.ano, table.poder),
]);

export const paraopeba_saldo_municipio = pgTable("paraopeba_saldo_municipio", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	referencia: text().notNull(),
	valor_acordo_inicial: numeric({ precision: 16, scale:  2 }),
	valor_acordo_atual: numeric({ precision: 16, scale:  2 }),
	empenhos_autorizados: numeric({ precision: 16, scale:  2 }),
	saldo_teto: numeric({ precision: 16, scale:  2 }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "paraopeba_saldo_municipio_id_municipio_fkey"
		}),
	unique("paraopeba_saldo_municipio_id_municipio_key").on(table.id_municipio),
]);

export const licitacoes = pgTable("licitacoes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	numero_controle_pncp: text(),
	orgao_cnpj: text(),
	orgao_nome: text(),
	unidade_nome: text(),
	modalidade_id: integer(),
	modalidade_nome: text(),
	objeto: text(),
	processo: text(),
	srp: boolean(),
	valor_estimado: numeric({ precision: 15, scale:  2 }),
	valor_homologado: numeric({ precision: 15, scale:  2 }),
	situacao: text(),
	data_publicacao_pncp: timestamp({ withTimezone: true, mode: 'string' }),
	data_abertura: timestamp({ withTimezone: true, mode: 'string' }),
	data_encerramento: timestamp({ withTimezone: true, mode: 'string' }),
	link_sistema_origem: text(),
	raw: jsonb(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "licitacoes_id_municipio_fkey"
		}),
	unique("licitacoes_numero_controle_pncp_key").on(table.numero_controle_pncp),
]);

export const mortalidade = pgTable("mortalidade", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	ano: integer(),
	grupo_causa: text(),
	obitos: integer(),
	obitos_infantis: integer(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "mortalidade_id_municipio_fkey"
		}),
	unique("mortalidade_id_municipio_ano_grupo_causa_key").on(table.id_municipio, table.ano, table.grupo_causa),
]);

export const indicadores = pgTable("indicadores", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	nome: text(),
	valor: text(),
	valor_numerico: numeric(),
	ano_referencia: integer(),
	fonte: text(),
	unidade: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "indicadores_id_municipio_fkey"
		}),
	unique("indicadores_id_municipio_nome_ano_referencia_key").on(table.id_municipio, table.nome, table.ano_referencia),
]);

export const obras = pgTable("obras", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	nome: text(),
	situacao: text(),
	valor: numeric({ precision: 15, scale:  2 }),
	percentual_execucao: numeric(),
	bairro: text(),
	lat: numeric(),
	lng: numeric(),
	link_fonte: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "obras_id_municipio_fkey"
		}),
]);

export const noticias = pgTable("noticias", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	slug: text().notNull(),
	titulo: text().notNull(),
	resumo: text().notNull(),
	conteudo_html: text().notNull(),
	categoria: text().notNull(),
	temas: text().array(),
	autor: text().default('Controle Popular Betim'),
	publicado_em: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	criado_em: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
	fonte_externa_nome: text(),
	fonte_externa_url: text(),
}, (table) => [
	index("noticias_id_municipio_publicado_em_idx").using("btree", table.id_municipio.asc().nullsLast().op("text_ops"), table.publicado_em.desc().nullsFirst().op("text_ops")),
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "noticias_id_municipio_fkey"
		}),
	unique("noticias_id_municipio_slug_key").on(table.id_municipio, table.slug),
]);

export const paraopeba_iniciativas = pgTable("paraopeba_iniciativas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	id_fdi: text().notNull(),
	titulo: text().notNull(),
	municipios_envolvidos: text(),
	grupo_iniciativas: text(),
	tipo_obrigacao: text(),
	area_tematica: text(),
	sub_area_tematica: text(),
	anexo: text(),
	status: text(),
	investimento: numeric({ precision: 16, scale:  2 }),
	valor_total: numeric({ precision: 16, scale:  2 }),
	percentual_realizado: numeric({ precision: 6, scale:  2 }),
	percentual_planejado: numeric(),
	produtos_previstos: integer(),
	produtos_entregues: integer(),
	produtos_em_atraso: integer(),
	equipamentos_previstos: integer(),
	equipamentos_entregues: integer(),
	link_publico: text(),
	link_termo_compromisso: text(),
	referencia: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "paraopeba_iniciativas_id_municipio_fkey"
		}),
	unique("paraopeba_iniciativas_id_municipio_id_fdi_key").on(table.id_municipio, table.id_fdi),
]);

export const folha_pagamento = pgTable("folha_pagamento", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	orgao: text(),
	competencia: date(),
	total_bruto: numeric({ precision: 15, scale:  2 }),
	qtd_servidores: integer(),
	fonte: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "folha_pagamento_id_municipio_fkey"
		}),
	unique("folha_pagamento_id_municipio_orgao_competencia_key").on(table.id_municipio, table.orgao, table.competencia),
]);

export const fontes_externas = pgTable("fontes_externas", {
	nome: text().primaryKey().notNull(),
	url: text(),
	tipo_dados: text(),
	ultima_atualizacao: timestamp({ withTimezone: true, mode: 'string' }),
});

export const subsidios = pgTable("subsidios", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	vereador_id: uuid(),
	competencia: date(),
	valor_bruto: numeric({ precision: 15, scale:  2 }),
	verbas_extras: numeric({ precision: 15, scale:  2 }).default('0'),
	fonte: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.vereador_id],
			foreignColumns: [vereadores.id],
			name: "subsidios_vereador_id_fkey"
		}),
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "subsidios_id_municipio_fkey"
		}),
	unique("subsidios_vereador_id_competencia_key").on(table.vereador_id, table.competencia),
]);

export const pntp = pgTable("pntp", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	ano: integer(),
	poder: text(),
	indice: numeric({ precision: 5, scale:  2 }),
	nivel: text(),
	posicao_estado: integer(),
	total_estado: integer(),
	criterios_essenciais: numeric({ precision: 5, scale:  2 }),
	raw: jsonb(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "pntp_id_municipio_fkey"
		}),
	unique("pntp_id_municipio_ano_poder_key").on(table.id_municipio, table.ano, table.poder),
]);

export const servidores = pgTable("servidores", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	orgao: text(),
	nome: text(),
	cargo: text(),
	lotacao: text(),
	vinculo: text(),
	resumo_ia: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "servidores_id_municipio_fkey"
		}),
	unique("servidores_id_municipio_orgao_nome_cargo_key").on(table.id_municipio, table.orgao, table.nome, table.cargo),
]);

export const saude_estabelecimentos = pgTable("saude_estabelecimentos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	id_cnes: text(),
	nome: text(),
	tipo: text(),
	endereco: text(),
	bairro: text(),
	lat: numeric(),
	lng: numeric(),
	profissionais_count: integer(),
	atualizado_em: date(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "saude_estabelecimentos_id_municipio_fkey"
		}),
	unique("saude_estabelecimentos_id_municipio_id_cnes_key").on(table.id_municipio, table.id_cnes),
]);

export const postos_anp = pgTable("postos_anp", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	cnpj: text(),
	razao_social: text(),
	endereco: text(),
	bairro: text(),
	bandeira: text(),
	produtos: text().array(),
	nota_anp: integer(),
	infracoes: jsonb(),
	interditado: boolean().default(false),
	lat: numeric(),
	lng: numeric(),
	atualizado_em: date(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "postos_anp_id_municipio_fkey"
		}),
	unique("postos_anp_cnpj_key").on(table.cnpj),
]);

export const saude_internacoes = pgTable("saude_internacoes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	ano: integer(),
	carater: text(),
	qtd: integer(),
	obitos: integer(),
	permanencia_media: numeric(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "saude_internacoes_id_municipio_fkey"
		}),
	unique("saude_internacoes_id_municipio_ano_carater_key").on(table.id_municipio, table.ano, table.carater),
]);

export const processos_judiciais = pgTable("processos_judiciais", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	vereador_id: uuid(),
	numero_processo: text(),
	tribunal: text(),
	classe: text(),
	assuntos: text().array(),
	papel: text(),
	status: text(),
	qtd_movimentacoes: integer(),
	data_distribuicao: date(),
	ultima_movimentacao: date(),
	sentenca_data: date(),
	sentenca_tipo: text(),
	resumo_ia: text(),
	revisao_solicitada: boolean().default(false),
	atualizado_em: date(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.vereador_id],
			foreignColumns: [vereadores.id],
			name: "processos_judiciais_vereador_id_fkey"
		}),
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "processos_judiciais_id_municipio_fkey"
		}),
	unique("processos_judiciais_vereador_id_numero_processo_key").on(table.vereador_id, table.numero_processo),
]);

export const pautas_atas = pgTable("pautas_atas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	tipo: text(),
	titulo: text(),
	data_sessao: date(),
	conteudo: text(),
	link_fonte: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "pautas_atas_id_municipio_fkey"
		}),
]);

export const seguidores = pgTable("seguidores", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	entidade_tipo: text().notNull(),
	entidade_id: text().notNull(),
	canal: text().notNull(),
	contato: text().notNull(),
	criado_em: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "seguidores_id_municipio_fkey"
		}),
	unique("seguidores_id_municipio_entidade_tipo_entidade_id_canal_con_key").on(table.id_municipio, table.entidade_tipo, table.entidade_id, table.canal, table.contato),
]);

export const vereadores = pgTable("vereadores", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	slug: text(),
	nome: text(),
	nome_urna: text(),
	partido: text(),
	cargo_mesa: text(),
	foto_url: text(),
	email: text(),
	mandato_inicio: date(),
	mandato_fim: date(),
	ativo: boolean().default(true),
	votos_eleicao: integer(),
	ano_eleicao: integer(),
	id_candidato_tse: text(),
	declaracao_cotas: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
	biografia: text(),
	profissao: text(),
	aniversario_dia_mes: text(),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "vereadores_id_municipio_fkey"
		}),
	unique("vereadores_id_municipio_slug_key").on(table.id_municipio, table.slug),
]);

export const zap_estabelecimentos = pgTable("zap_estabelecimentos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	nome: text(),
	whatsapp: text(),
	categoria: text(),
	descricao: text(),
	aprovado: boolean().default(false),
	cliques: integer().default(0),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
	bairro: text(),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "zap_estabelecimentos_id_municipio_fkey"
		}),
]);

export const proposicoes = pgTable("proposicoes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	vereador_id: uuid(),
	tipo: text(),
	numero: integer(),
	ano: integer(),
	ementa: text(),
	situacao: text(),
	data_apresentacao: date(),
	autores: text().array(),
	resumo_ia: text(),
	link_fonte: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
	temas: text().array(),
	/** Slug do padrão de baixo teor normativo da ementa (migration 0038).
	 *  NULL = teor normativo comum. Pondera o ranking de atuação. */
	classe_teor: text(),
}, (table) => [
	index("proposicoes_temas_idx").using("gin", table.temas.asc().nullsLast().op("array_ops")),
	foreignKey({
			columns: [table.vereador_id],
			foreignColumns: [vereadores.id],
			name: "proposicoes_vereador_id_fkey"
		}),
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "proposicoes_id_municipio_fkey"
		}),
]);

/**
 * Análise garantista × reducionista do eixo Cidades (migration 0033).
 *
 * Espelha `congresso.analises` / `congresso.analise_itens` porque a RÉGUA É
 * A MESMA — as 24 âncoras da rubrica são da CF/88 e a CF/88 governa lei
 * municipal igual. A taxonomia continua num arquivo só
 * (`lib/congresso/rubrica/rubrica.json`); aqui só moram as colunas do
 * resultado.
 *
 * A diferença estrutural em relação ao Congresso: lá existe UM objeto
 * analisável (proposição federal) e aqui existem DOIS — `ato_id` aponta
 * para lei/decreto JÁ SANCIONADO e `proposicao_id` para projeto EM
 * TRAMITAÇÃO. São duas colunas nuláveis com CHECK `num_nonnulls(...) = 1`
 * em vez de um par polimórfico, para que cada uma tenha FK de verdade
 * (o raciocínio completo está na migration).
 *
 * `id_municipio` também em `analise_itens`, onde seria derivável por join:
 * é o que permite o corte "quais direitos esta cidade restringe" sem passar
 * por `analises` — e sem o risco de alguém esquecer o filtro de cidade.
 */
export const analises = pgTable("analises", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	ato_id: uuid(),
	proposicao_id: uuid(),
	score: numeric({ precision: 6, scale:  2 }),
	rotulo: text(),
	clausula_petrea: boolean().default(false),
	vedacao_retrocesso: boolean().default(false),
	resumo_neutro: text(),
	parecer_critico: text(),
	legislacao_relacionada: jsonb(),
	modelo: text(),
	versao_rubrica: text(),
	versao_prompt: text(),
	status: text().default('ok'),
	criado_em: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("analises_municipio_rotulo_idx").using("btree", table.id_municipio.asc().nullsLast().op("text_ops"), table.rotulo.asc().nullsLast().op("text_ops")),
	index("analises_municipio_status_idx").using("btree", table.id_municipio.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	index("analises_score_idx").using("btree", table.score.asc().nullsLast().op("numeric_ops")),
	index("analises_versao_rubrica_idx").using("btree", table.versao_rubrica.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "analises_id_municipio_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.ato_id],
			foreignColumns: [atos_oficiais.id],
			name: "analises_ato_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.proposicao_id],
			foreignColumns: [proposicoes.id],
			name: "analises_proposicao_id_fkey"
		}).onDelete("cascade"),
	unique("analises_ato_id_key").on(table.ato_id),
	unique("analises_proposicao_id_key").on(table.proposicao_id),
	check("analises_um_objeto_so", sql`num_nonnulls(ato_id, proposicao_id) = 1`),
	check("analises_status_check", sql`status = ANY (ARRAY['ok'::text, 'requer_revisao'::text, 'falhou'::text])`),
]);

export const analise_itens = pgTable("analise_itens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	analise_id: uuid().notNull(),
	id_municipio: text().notNull(),
	direito: text().notNull(),
	dispositivo: text().notNull(),
	direcao: text().notNull(),
	mecanismo: text(),
	titulares: text().array(),
	grau: text(),
	trecho: text(),
	confianca: numeric({ precision: 3, scale:  2 }),
	peso: numeric({ precision: 6, scale:  2 }),
}, (table) => [
	index("analise_itens_analise_idx").using("btree", table.analise_id.asc().nullsLast().op("uuid_ops")),
	index("analise_itens_municipio_direito_idx").using("btree", table.id_municipio.asc().nullsLast().op("text_ops"), table.direito.asc().nullsLast().op("text_ops"), table.direcao.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.analise_id],
			foreignColumns: [analises.id],
			name: "analise_itens_analise_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "analise_itens_id_municipio_fkey"
		}).onDelete("cascade"),
	check("analise_itens_direcao_check", sql`direcao = ANY (ARRAY['amplia'::text, 'restringe'::text, 'neutro'::text])`),
	check("analise_itens_grau_check", sql`grau = ANY (ARRAY['marginal'::text, 'moderado'::text, 'estrutural'::text])`),
]);

export const verbas_indenizatorias = pgTable("verbas_indenizatorias", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	vereador_id: uuid(),
	beneficiario: text(),
	data: date(),
	grupo_verba: text(),
	fornecedor: text(),
	valor: numeric({ precision: 15, scale:  2 }),
	link_fonte: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	index("verbas_indenizatorias_id_municipio_fornecedor_idx").using("btree", table.id_municipio.asc().nullsLast().op("text_ops"), table.fornecedor.asc().nullsLast().op("text_ops")),
	index("verbas_indenizatorias_id_municipio_grupo_verba_idx").using("btree", table.id_municipio.asc().nullsLast().op("text_ops"), table.grupo_verba.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.vereador_id],
			foreignColumns: [vereadores.id],
			name: "verbas_indenizatorias_vereador_id_fkey"
		}),
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "verbas_indenizatorias_id_municipio_fkey"
		}),
	unique("verbas_indenizatorias_id_municipio_vereador_id_data_grupo_v_key").on(table.id_municipio, table.vereador_id, table.data, table.grupo_verba, table.fornecedor, table.valor),
]);

export const despesas = pgTable("despesas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	ano: integer(),
	estagio: text(),
	funcao: text(),
	conta: text(),
	valor: numeric({ precision: 15, scale:  2 }),
	fonte: text().default('br_me_siconfi'),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "despesas_id_municipio_fkey"
		}),
	unique("despesas_id_municipio_ano_estagio_funcao_conta_key").on(table.id_municipio, table.ano, table.estagio, table.funcao, table.conta),
]);

export const telegram_inscritos = pgTable("telegram_inscritos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	chat_id: bigint({ mode: "number" }).notNull(),
	temas: text().array(),
	ativo: boolean().default(true),
	criado_em: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "telegram_inscritos_id_municipio_fkey"
		}),
	unique("telegram_inscritos_id_municipio_chat_id_key").on(table.id_municipio, table.chat_id),
]);

export const analisesInCongresso = congresso.table("analises", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	proposicao_id: uuid().notNull(),
	score: numeric({ precision: 6, scale:  2 }),
	rotulo: text(),
	clausula_petrea: boolean().default(false),
	vedacao_retrocesso: boolean().default(false),
	resumo_neutro: text(),
	parecer_critico: text(),
	legislacao_relacionada: jsonb(),
	modelo: text(),
	versao_rubrica: text(),
	versao_prompt: text(),
	status: text().default('ok'),
	criado_em: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("analises_rotulo_idx").using("btree", table.rotulo.asc().nullsLast().op("text_ops")),
	index("analises_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.proposicao_id],
			foreignColumns: [proposicoesInCongresso.id],
			name: "analises_proposicao_id_fkey"
		}).onDelete("cascade"),
	unique("analises_proposicao_id_key").on(table.proposicao_id),
	check("analises_status_check", sql`status = ANY (ARRAY['ok'::text, 'requer_revisao'::text, 'falhou'::text])`),
]);

export const analise_itensInCongresso = congresso.table("analise_itens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	analise_id: uuid().notNull(),
	direito: text().notNull(),
	dispositivo: text().notNull(),
	direcao: text().notNull(),
	mecanismo: text(),
	titulares: text().array(),
	grau: text(),
	trecho: text(),
	confianca: numeric({ precision: 3, scale:  2 }),
	peso: numeric({ precision: 6, scale:  2 }),
}, (table) => [
	index("analise_itens_analise_id_idx").using("btree", table.analise_id.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.analise_id],
			foreignColumns: [analisesInCongresso.id],
			name: "analise_itens_analise_id_fkey"
		}).onDelete("cascade"),
	check("analise_itens_direcao_check", sql`direcao = ANY (ARRAY['amplia'::text, 'restringe'::text, 'neutro'::text])`),
	check("analise_itens_grau_check", sql`grau = ANY (ARRAY['marginal'::text, 'moderado'::text, 'estrutural'::text])`),
]);

export const parlamentaresInCongresso = congresso.table("parlamentares", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	casa_id: text().notNull(),
	id_externo: text().notNull(),
	nome: text().notNull(),
	nome_eleitoral: text(),
	partido: text(),
	uf: text(),
	email: text(),
	url_foto: text(),
	url_perfil: text(),
	legislatura: integer(),
	ativo: boolean().default(true),
	raw: jsonb(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("parlamentares_casa_id_ativo_idx").using("btree", table.casa_id.asc().nullsLast().op("text_ops"), table.ativo.asc().nullsLast().op("text_ops")),
	index("parlamentares_nome_idx").using("gin", table.nome.asc().nullsLast().op("gin_trgm_ops")),
	foreignKey({
			columns: [table.casa_id],
			foreignColumns: [casasInCongresso.id],
			name: "parlamentares_casa_id_fkey"
		}),
	unique("parlamentares_casa_id_id_externo_key").on(table.casa_id, table.id_externo),
]);

export const socios = pgTable("socios", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	cnpj: text(),
	nome_socio: text(),
	documento_mascarado: text(),
	qualificacao: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.cnpj],
			foreignColumns: [fornecedores.cnpj],
			name: "socios_cnpj_fkey"
		}),
	unique("socios_cnpj_nome_socio_key").on(table.cnpj, table.nome_socio),
]);

export const receitas = pgTable("receitas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	ano: integer(),
	estagio: text(),
	conta: text(),
	valor: numeric({ precision: 15, scale:  2 }),
	fonte: text().default('br_me_siconfi'),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "receitas_id_municipio_fkey"
		}),
	unique("receitas_id_municipio_ano_estagio_conta_key").on(table.id_municipio, table.ano, table.estagio, table.conta),
]);

export const seguranca_ocorrencias = pgTable("seguranca_ocorrencias", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	ano: integer(),
	mes: integer(),
	natureza: text(),
	qtd: integer(),
	fonte: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "seguranca_ocorrencias_id_municipio_fkey"
		}),
	unique("seguranca_ocorrencias_id_municipio_ano_mes_natureza_key").on(table.id_municipio, table.ano, table.mes, table.natureza),
]);

export const producao_agropecuaria = pgTable("producao_agropecuaria", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	ano: integer().notNull(),
	categoria: text().notNull(),
	produto: text().notNull(),
	quantidade: numeric(),
	unidade: text(),
	area_colhida: numeric(),
	valor_producao_mil_reais: numeric({ precision: 15, scale:  2 }),
	fonte: text().default('br_ibge_pam_ppm'),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "producao_agropecuaria_id_municipio_fkey"
		}),
	unique("producao_agropecuaria_id_municipio_ano_categoria_produto_key").on(table.id_municipio, table.ano, table.categoria, table.produto),
]);

export const grupos_economicos = pgTable("grupos_economicos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	id_municipio: text().notNull(),
	nome_grupo: text(),
	setor: text(),
	cnpjs: text().array(),
	socios_comuns: text().array(),
	valor_total_contratos: numeric({ precision: 15, scale:  2 }),
	qtd_contratos: integer(),
	detectado_em: date(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp({ withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.id_municipio],
			foreignColumns: [municipios.id_municipio],
			name: "grupos_economicos_id_municipio_fkey"
		}),
]);

export const cache_ia = pgTable("cache_ia", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	hash_prompt: text(),
	tipo: text(),
	entidade_id: uuid(),
	resposta: text(),
	modelo: text(),
	criado_em: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("cache_ia_hash_prompt_key").on(table.hash_prompt),
]);

export const documentosInJudiciario = judiciario.table("documentos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	user_id: uuid(),
	vaga_id: uuid(),
	nomeacao_id: uuid(),
	tipo: text(),
	destinatarios: jsonb(),
	titulo: text(),
	corpo: text(),
	status: text().default('rascunho'),
	criado_em: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.nomeacao_id],
			foreignColumns: [nomeacoesInJudiciario.id],
			name: "documentos_nomeacao_id_fkey"
		}),
	foreignKey({
			columns: [table.vaga_id],
			foreignColumns: [vagasInJudiciario.id],
			name: "documentos_vaga_id_fkey"
		}),
]);

export const bancada_membrosInCongresso = congresso.table("bancada_membros", {
	bancada_id: uuid().notNull(),
	parlamentar_id: uuid().notNull(),
	papel: text(),
}, (table) => [
	foreignKey({
			columns: [table.parlamentar_id],
			foreignColumns: [parlamentaresInCongresso.id],
			name: "bancada_membros_parlamentar_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.bancada_id],
			foreignColumns: [bancadasInCongresso.id],
			name: "bancada_membros_bancada_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.bancada_id, table.parlamentar_id], name: "bancada_membros_pkey"}),
]);

export const votosInCongresso = congresso.table("votos", {
	votacao_id: uuid().notNull(),
	parlamentar_id: uuid().notNull(),
	voto: text(),
}, (table) => [
	foreignKey({
			columns: [table.votacao_id],
			foreignColumns: [votacoesInCongresso.id],
			name: "votos_votacao_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parlamentar_id],
			foreignColumns: [parlamentaresInCongresso.id],
			name: "votos_parlamentar_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.votacao_id, table.parlamentar_id], name: "votos_pkey"}),
]);

export const orgao_membrosInCongresso = congresso.table("orgao_membros", {
	orgao_id: uuid().notNull(),
	parlamentar_id: uuid().notNull(),
	papel: text(),
}, (table) => [
	foreignKey({
			columns: [table.orgao_id],
			foreignColumns: [orgaosInCongresso.id],
			name: "orgao_membros_orgao_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parlamentar_id],
			foreignColumns: [parlamentaresInCongresso.id],
			name: "orgao_membros_parlamentar_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.orgao_id, table.parlamentar_id], name: "orgao_membros_pkey"}),
]);

export const feriadosInJudiciario = judiciario.table("feriados", {
	data: date().notNull(),
	nome: text(),
	tipo: text(),
	uf: text().notNull(),
}, (table) => [
	primaryKey({ columns: [table.data, table.uf], name: "feriados_pkey"}),
]);

export const proposicao_autoresInCongresso = congresso.table("proposicao_autores", {
	proposicao_id: uuid().notNull(),
	parlamentar_id: uuid().notNull(),
	ordem: integer(),
	proponente: boolean().default(false),
}, (table) => [
	foreignKey({
			columns: [table.parlamentar_id],
			foreignColumns: [parlamentaresInCongresso.id],
			name: "proposicao_autores_parlamentar_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.proposicao_id],
			foreignColumns: [proposicoesInCongresso.id],
			name: "proposicao_autores_proposicao_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.proposicao_id, table.parlamentar_id], name: "proposicao_autores_pkey"}),
]);
export const vw_vacanciaInJudiciario = judiciario.view("vw_vacancia", {	ocupacao_id: uuid(),
	cadeira_id: uuid(),
	magistrado_id: uuid(),
	tribunal_id: text(),
	cota: text(),
	magistrado_nome: text(),
	data_nascimento: date(),
	data_posse: date(),
	atual: boolean(),
	vacancia_projetada: date(),
}).as(sql`SELECT o.id AS ocupacao_id, o.cadeira_id, o.magistrado_id, c.tribunal_id, c.cota, m.nome AS magistrado_nome, m.data_nascimento, o.data_posse, o.atual, CASE WHEN o.data_saida IS NULL AND m.data_nascimento IS NOT NULL THEN (m.data_nascimento + '75 years'::interval)::date ELSE NULL::date END AS vacancia_projetada FROM judiciario.ocupacoes o JOIN judiciario.cadeiras c ON c.id = o.cadeira_id JOIN judiciario.magistrados m ON m.id = o.magistrado_id`);

export const seguidores_contagem = pgView("seguidores_contagem", {	id_municipio: text(),
	entidade_tipo: text(),
	entidade_id: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	total: bigint({ mode: "number" }),
}).as(sql`SELECT id_municipio, entidade_tipo, entidade_id, count(*) AS total FROM seguidores GROUP BY id_municipio, entidade_tipo, entidade_id`);