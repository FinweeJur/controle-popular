-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE SCHEMA "congresso";
--> statement-breakpoint
CREATE SCHEMA "judiciario";
--> statement-breakpoint
CREATE TABLE "congresso"."alertas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"monitoramento_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"proposicao_id" uuid NOT NULL,
	"motivo" text NOT NULL,
	"lido" boolean DEFAULT false,
	"criado_em" timestamp with time zone DEFAULT now(),
	CONSTRAINT "alertas_monitoramento_id_proposicao_id_motivo_key" UNIQUE("monitoramento_id","proposicao_id","motivo")
);
--> statement-breakpoint
CREATE TABLE "congresso"."fontes_externas" (
	"nome" text PRIMARY KEY NOT NULL,
	"url" text,
	"tipo_dados" text,
	"ultima_atualizacao" timestamp with time zone,
	"ultimo_status" text
);
--> statement-breakpoint
CREATE TABLE "congresso"."cache_ia" (
	"hash" text PRIMARY KEY NOT NULL,
	"tipo" text,
	"resposta" jsonb,
	"modelo" text,
	"criado_em" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "congresso"."casas" (
	"id" text PRIMARY KEY NOT NULL,
	"esfera" text NOT NULL,
	"nome" text NOT NULL,
	"uf" text,
	"url_api" text,
	"url_site" text,
	"ativo" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "casas_esfera_check" CHECK (esfera = ANY (ARRAY['federal'::text, 'estadual'::text, 'municipal'::text]))
);
--> statement-breakpoint
CREATE TABLE "congresso"."bancadas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"casa_id" text NOT NULL,
	"id_externo" text,
	"tipo" text NOT NULL,
	"nome" text NOT NULL,
	"legislatura" integer,
	"url_site" text,
	CONSTRAINT "bancadas_casa_id_tipo_id_externo_key" UNIQUE("casa_id","id_externo","tipo"),
	CONSTRAINT "bancadas_tipo_check" CHECK (tipo = ANY (ARRAY['frente'::text, 'bloco'::text, 'federacao'::text, 'partido'::text]))
);
--> statement-breakpoint
CREATE TABLE "congresso"."analise_contestacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analise_id" uuid NOT NULL,
	"user_id" uuid,
	"texto" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "congresso"."documentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"proposicao_id" uuid,
	"tipo" text NOT NULL,
	"destinatarios" jsonb,
	"titulo" text,
	"corpo" text,
	"status" text DEFAULT 'rascunho',
	"criado_em" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "documentos_status_check" CHECK (status = ANY (ARRAY['rascunho'::text, 'final'::text, 'enviado'::text]))
);
--> statement-breakpoint
CREATE TABLE "congresso"."monitoramentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"palavras_chave" text[],
	"temas" text[],
	"direitos" text[],
	"casas" text[],
	"orgaos" uuid[],
	"bancadas" uuid[],
	"parlamentares" uuid[],
	"so_reducionistas" boolean DEFAULT false,
	"frequencia" text DEFAULT 'diaria',
	"ativo" boolean DEFAULT true,
	"criado_em" timestamp with time zone DEFAULT now(),
	CONSTRAINT "monitoramentos_frequencia_check" CHECK (frequencia = ANY (ARRAY['imediata'::text, 'diaria'::text, 'semanal'::text]))
);
--> statement-breakpoint
CREATE TABLE "congresso"."envios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"documento_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"canal" text NOT NULL,
	"destinatario" text,
	"status" text,
	"erro" text,
	"enviado_em" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "congresso"."embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposicao_id" uuid NOT NULL,
	"chunk_text" text,
	"embedding" vector(384)
);
--> statement-breakpoint
CREATE TABLE "congresso"."proposicoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"casa_id" text NOT NULL,
	"id_externo" text NOT NULL,
	"sigla_tipo" text,
	"numero" integer,
	"ano" integer,
	"identificacao" text,
	"ementa" text,
	"ementa_detalhada" text,
	"keywords" text,
	"temas_oficiais" text[],
	"data_apresentacao" timestamp with time zone,
	"situacao" text,
	"orgao_atual" text,
	"regime" text,
	"apreciacao" text,
	"url_inteiro_teor" text,
	"url_fonte" text,
	"texto_integral" text,
	"tramitando" boolean DEFAULT true,
	"data_ultima_tramitacao" timestamp with time zone,
	"raw" jsonb,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "proposicoes_casa_id_id_externo_key" UNIQUE("casa_id","id_externo")
);
--> statement-breakpoint
CREATE TABLE "congresso"."orgaos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"casa_id" text NOT NULL,
	"id_externo" text NOT NULL,
	"sigla" text,
	"nome" text,
	"tipo" text,
	"email" text,
	"url_site" text,
	"ativo" boolean DEFAULT true,
	CONSTRAINT "orgaos_casa_id_id_externo_key" UNIQUE("casa_id","id_externo")
);
--> statement-breakpoint
CREATE TABLE "congresso"."perfis" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"nome" text,
	"organizacao" text,
	"email_alertas" boolean DEFAULT true,
	"criado_em" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "congresso"."votacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"casa_id" text NOT NULL,
	"id_externo" text NOT NULL,
	"proposicao_id" uuid,
	"data" date,
	"sigla_orgao" text,
	"descricao" text,
	"aprovacao" boolean,
	CONSTRAINT "votacoes_casa_id_id_externo_key" UNIQUE("casa_id","id_externo")
);
--> statement-breakpoint
CREATE TABLE "congresso"."tramitacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposicao_id" uuid,
	"sequencia" integer,
	"data_hora" timestamp with time zone,
	"sigla_orgao" text,
	"descricao" text,
	"despacho" text,
	CONSTRAINT "tramitacoes_proposicao_id_sequencia_key" UNIQUE("proposicao_id","sequencia")
);
--> statement-breakpoint
CREATE TABLE "judiciario"."alertas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"monitoramento_id" uuid,
	"user_id" uuid,
	"vaga_id" uuid,
	"motivo" text,
	"lido" boolean DEFAULT false,
	"criado_em" timestamp with time zone DEFAULT now(),
	CONSTRAINT "alertas_monitoramento_id_vaga_id_motivo_key" UNIQUE("monitoramento_id","vaga_id","motivo")
);
--> statement-breakpoint
CREATE TABLE "judiciario"."envios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"documento_id" uuid,
	"user_id" uuid,
	"canal" text,
	"destinatario" text,
	"status" text,
	"erro" text,
	"enviado_em" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "judiciario"."fontes_externas" (
	"nome" text PRIMARY KEY NOT NULL,
	"url" text,
	"tipo_dados" text,
	"ultima_atualizacao" timestamp with time zone,
	"ultimo_status" text
);
--> statement-breakpoint
CREATE TABLE "judiciario"."cadeiras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tribunal_id" text NOT NULL,
	"numero" integer,
	"cota" text NOT NULL,
	"dispositivo" text,
	"observacao" text,
	CONSTRAINT "cadeiras_tribunal_id_numero_key" UNIQUE("tribunal_id","numero")
);
--> statement-breakpoint
CREATE TABLE "judiciario"."mandatos_direcao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tribunal_id" text,
	"magistrado_id" uuid,
	"cargo" text,
	"data_inicio" date,
	"data_fim" date,
	"biennio" text,
	"eleito" boolean DEFAULT true,
	"fonte" text
);
--> statement-breakpoint
CREATE TABLE "judiciario"."magistrados" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"nome_completo" text,
	"data_nascimento" date,
	"uf_origem" text,
	"genero" text,
	"raca_cor" text,
	"origem_carreira" text,
	"url_foto" text,
	"url_curriculo" text,
	"slug" text,
	CONSTRAINT "magistrados_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "judiciario"."monitoramentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"nome" text,
	"tribunais" text[],
	"cotas" text[],
	"ufs" text[],
	"ramos" text[],
	"horizonte_meses" integer DEFAULT 24,
	"frequencia" text DEFAULT 'semanal',
	"ativo" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "judiciario"."cache_ia" (
	"hash" text PRIMARY KEY NOT NULL,
	"tipo" text,
	"resposta" jsonb,
	"modelo" text,
	"criado_em" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "judiciario"."ocupacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cadeira_id" uuid NOT NULL,
	"magistrado_id" uuid NOT NULL,
	"data_posse" date,
	"data_saida" date,
	"motivo_saida" text,
	"nomeacao_id" uuid,
	"atual" boolean GENERATED ALWAYS AS ((data_saida IS NULL)) STORED,
	CONSTRAINT "ocupacoes_cadeira_id_magistrado_id_data_posse_key" UNIQUE("cadeira_id","magistrado_id","data_posse")
);
--> statement-breakpoint
CREATE TABLE "judiciario"."tribunais" (
	"id" text PRIMARY KEY NOT NULL,
	"ramo" text NOT NULL,
	"instancia" text DEFAULT 'superior' NOT NULL,
	"esfera" text DEFAULT 'federal' NOT NULL,
	"nome" text NOT NULL,
	"sigla" text,
	"uf" text,
	"n_cadeiras" integer,
	"autoridade_nomeante" text,
	"exige_sabatina_senado" boolean DEFAULT false,
	"base_legal" text,
	"url_composicao" text,
	"ativo" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "beneficios_sociais" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"programa" text,
	"competencia" date,
	"beneficiarios" integer,
	"valor_total" numeric(15, 2),
	"fonte" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "beneficios_sociais_id_municipio_programa_competencia_key" UNIQUE("id_municipio","programa","competencia")
);
--> statement-breakpoint
CREATE TABLE "anuncios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"nome_comercio" text,
	"plano" text,
	"banner_url" text,
	"link" text,
	"ativo" boolean DEFAULT false,
	"data_inicio" date,
	"data_fim" date,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "arboviroses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"doenca" text,
	"semana_epidemiologica" integer,
	"ano" integer,
	"casos" integer,
	"nivel_alerta" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "arboviroses_id_municipio_doenca_ano_semana_epidemiologica_key" UNIQUE("id_municipio","doenca","semana_epidemiologica","ano")
);
--> statement-breakpoint
CREATE TABLE "judiciario"."nomeacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"magistrado_id" uuid,
	"cadeira_id" uuid,
	"tribunal_id" text,
	"autoridade_nomeante" text,
	"cargo_nomeante" text,
	"senado_id_externo" text,
	"senado_identificacao" text,
	"senado_ementa" text,
	"dispositivo_vaga" text,
	"data_mensagem" date,
	"data_deliberacao" date,
	"resultado" text,
	"antecessor_nome" text,
	"motivo_vacancia" text,
	"url_fonte" text,
	"raw" jsonb,
	CONSTRAINT "nomeacoes_senado_id_externo_key" UNIQUE("senado_id_externo")
);
--> statement-breakpoint
CREATE TABLE "atos_oficiais" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"tipo" text,
	"numero" text,
	"ano" integer,
	"ementa" text,
	"data_publicacao" date,
	"link_fonte" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "judiciario"."vagas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cadeira_id" uuid,
	"data_abertura" date,
	"motivo" text,
	"fase" text,
	"prazo_nomeacao" date,
	"nomeacao_id" uuid,
	"atualizada_em" timestamp with time zone DEFAULT now(),
	CONSTRAINT "vagas_cadeira_id_data_abertura_key" UNIQUE("cadeira_id","data_abertura")
);
--> statement-breakpoint
CREATE TABLE "judiciario"."perfis" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"nome" text,
	"organizacao" text,
	"email_alertas" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "bens_candidato" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"vereador_id" uuid,
	"ano_eleicao" integer,
	"tipo_item" text,
	"descricao_item" text,
	"valor" numeric(15, 2),
	"fonte" text DEFAULT 'br_tse_eleicoes',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "classificados" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"categoria" text,
	"titulo" text,
	"descricao" text,
	"preco" numeric(15, 2),
	"fotos" text[],
	"contato_whatsapp" text,
	"aprovado" boolean DEFAULT false,
	"expira_em" date,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "clima_cache" (
	"id_municipio" text PRIMARY KEY NOT NULL,
	"atual" jsonb,
	"diario" jsonb,
	"chuva_7d" numeric,
	"atualizado_em" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "coleta_lixo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"bairro" text,
	"tipo" text,
	"dias_semana" text[],
	"horario" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "caixa_disponivel" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"ano" integer NOT NULL,
	"valor" numeric(15, 2),
	"fonte" text DEFAULT 'br_me_siconfi',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "caixa_disponivel_id_municipio_ano_key" UNIQUE("id_municipio","ano")
);
--> statement-breakpoint
CREATE TABLE "comissao_membros" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"comissao_id" uuid,
	"nome_comissao_bruto" text NOT NULL,
	"vereador_id" uuid NOT NULL,
	"papel" text NOT NULL,
	"data_inicio" date,
	"data_fim" date,
	"ativo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "comissao_membros_id_municipio_vereador_id_nome_comissao_bru_key" UNIQUE("id_municipio","nome_comissao_bruto","vereador_id","papel","data_inicio","data_fim")
);
--> statement-breakpoint
CREATE TABLE "diarias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"orgao" text,
	"beneficiario" text,
	"vereador_id" uuid,
	"destino" text,
	"data_inicio" date,
	"data_fim" date,
	"qtd_diarias" numeric,
	"valor" numeric(15, 2),
	"motivo" text,
	"link_fonte" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"entidade" text,
	"entidade_id" uuid,
	"chunk_text" text,
	"embedding" vector(384)
);
--> statement-breakpoint
CREATE TABLE "emendas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"esfera" text,
	"parlamentar" text,
	"partido_uf" text,
	"ano" integer,
	"valor_empenhado" numeric(15, 2),
	"valor_pago" numeric(15, 2),
	"objeto" text,
	"funcao" text,
	"link_fonte" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "farmacias_plantao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"nome" text,
	"endereco" text,
	"telefone" text,
	"foto_url" text,
	"plantao_inicio" date,
	"plantao_fim" date,
	"h24" boolean DEFAULT false,
	"lat" numeric,
	"lng" numeric,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "doacoes_campanha" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"vereador_id" uuid,
	"ano_eleicao" integer,
	"doador_nome" text,
	"doador_tipo" text,
	"doador_documento_mascarado" text,
	"valor" numeric(15, 2),
	"data_doacao" date,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "comissoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"nome" text NOT NULL,
	"especial" boolean DEFAULT false,
	CONSTRAINT "comissoes_id_municipio_nome_key" UNIQUE("id_municipio","nome")
);
--> statement-breakpoint
CREATE TABLE "contratos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"numero_controle_pncp" text,
	"numero_contrato" text,
	"ano" integer,
	"orgao_cnpj" text,
	"orgao_nome" text,
	"unidade_nome" text,
	"categoria" text,
	"tipo" text,
	"objeto" text,
	"fornecedor_cnpj" text,
	"fornecedor_nome" text,
	"valor_inicial" numeric(15, 2),
	"valor_global" numeric(15, 2),
	"aditivos_total" numeric(15, 2) DEFAULT '0',
	"data_assinatura" date,
	"vigencia_inicio" date,
	"vigencia_fim" date,
	"numero_parcelas" integer,
	"status" text,
	"alerta" boolean DEFAULT false,
	"motivos_alerta" text[],
	"resumo_ia" text,
	"link_fonte" text,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	"temas" text[],
	CONSTRAINT "contratos_numero_controle_pncp_key" UNIQUE("numero_controle_pncp")
);
--> statement-breakpoint
CREATE TABLE "convenios_federais" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"id_externo" bigint NOT NULL,
	"numero_convenio" text,
	"objeto" text,
	"orgao_nome" text,
	"orgao_sigla" text,
	"convenente_nome" text,
	"situacao" text,
	"tipo_instrumento" text,
	"valor" numeric(15, 2),
	"valor_liberado" numeric(15, 2),
	"valor_contrapartida" numeric(15, 2),
	"data_inicio_vigencia" date,
	"data_final_vigencia" date,
	"data_publicacao" date,
	"fonte" text DEFAULT 'portal_transparencia',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	"codigo" text,
	CONSTRAINT "convenios_federais_id_municipio_id_externo_key" UNIQUE("id_municipio","id_externo")
);
--> statement-breakpoint
CREATE TABLE "escolas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"id_inep" text,
	"nome" text,
	"rede" text,
	"etapas" text[],
	"matriculas" integer,
	"ideb_anos_iniciais" numeric(4, 2),
	"ideb_anos_finais" numeric(4, 2),
	"infraestrutura" jsonb,
	"lat" numeric,
	"lng" numeric,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "escolas_id_municipio_id_inep_key" UNIQUE("id_municipio","id_inep")
);
--> statement-breakpoint
CREATE TABLE "comercios_essenciais" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"osm_id" bigint NOT NULL,
	"nome" text NOT NULL,
	"tipo" text NOT NULL,
	"bairro" text,
	"endereco" text,
	"telefone" text,
	"lat" numeric,
	"lng" numeric,
	"fonte" text DEFAULT 'openstreetmap',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "comercios_essenciais_id_municipio_osm_id_key" UNIQUE("id_municipio","osm_id")
);
--> statement-breakpoint
CREATE TABLE "contatos_uteis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"nome" text,
	"telefone" text,
	"categoria" text,
	"ordem" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "feriados_nacionais" (
	"data" date PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"tipo" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fornecedores" (
	"cnpj" text PRIMARY KEY NOT NULL,
	"razao_social" text,
	"nome_fantasia" text,
	"situacao_cadastral" text,
	"cnae_principal" text,
	"cnae_descricao" text,
	"capital_social" numeric(15, 2),
	"porte" text,
	"data_abertura" date,
	"municipio_sede" text,
	"uf_sede" text,
	"sancionado_ceis" boolean DEFAULT false,
	"ceis_detalhes" jsonb,
	"atualizado_em" date,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "meio_ambiente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"indicador" text,
	"ano" integer,
	"valor" numeric,
	"unidade" text,
	"fonte" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "meio_ambiente_id_municipio_indicador_ano_key" UNIQUE("id_municipio","indicador","ano")
);
--> statement-breakpoint
CREATE TABLE "municipios" (
	"id_municipio" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"uf" text NOT NULL,
	"cnpj_prefeitura" text,
	"lat" numeric,
	"lng" numeric,
	"dominio" text,
	"branding" jsonb,
	"fontes" jsonb,
	"ativo" boolean DEFAULT true,
	"malha_geojson" jsonb,
	"regiao_ibge" jsonb
);
--> statement-breakpoint
CREATE TABLE "newsletter_inscritos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"email" text,
	"confirmado" boolean DEFAULT false,
	"criado_em" timestamp with time zone DEFAULT now(),
	"temas" text[],
	CONSTRAINT "newsletter_inscritos_id_municipio_email_key" UNIQUE("id_municipio","email")
);
--> statement-breakpoint
CREATE TABLE "nota_transparencia" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"ano" integer NOT NULL,
	"poder" text NOT NULL,
	"indice_transparencia" numeric(6, 4) NOT NULL,
	"nivel_transparencia" text NOT NULL,
	"variacao_indice" numeric(8, 6),
	"variacao_nivel" text,
	"historico_nivel" text,
	"posicao_ranking_mg" integer,
	"total_avaliados_mg" integer,
	"link_site" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "nota_transparencia_id_municipio_ano_poder_key" UNIQUE("id_municipio","ano","poder")
);
--> statement-breakpoint
CREATE TABLE "paraopeba_saldo_municipio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"referencia" text NOT NULL,
	"valor_acordo_inicial" numeric(16, 2),
	"valor_acordo_atual" numeric(16, 2),
	"empenhos_autorizados" numeric(16, 2),
	"saldo_teto" numeric(16, 2),
	CONSTRAINT "paraopeba_saldo_municipio_id_municipio_key" UNIQUE("id_municipio")
);
--> statement-breakpoint
CREATE TABLE "licitacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"numero_controle_pncp" text,
	"orgao_cnpj" text,
	"orgao_nome" text,
	"unidade_nome" text,
	"modalidade_id" integer,
	"modalidade_nome" text,
	"objeto" text,
	"processo" text,
	"srp" boolean,
	"valor_estimado" numeric(15, 2),
	"valor_homologado" numeric(15, 2),
	"situacao" text,
	"data_publicacao_pncp" timestamp with time zone,
	"data_abertura" timestamp with time zone,
	"data_encerramento" timestamp with time zone,
	"link_sistema_origem" text,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "licitacoes_numero_controle_pncp_key" UNIQUE("numero_controle_pncp")
);
--> statement-breakpoint
CREATE TABLE "mortalidade" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"ano" integer,
	"grupo_causa" text,
	"obitos" integer,
	"obitos_infantis" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "mortalidade_id_municipio_ano_grupo_causa_key" UNIQUE("id_municipio","ano","grupo_causa")
);
--> statement-breakpoint
CREATE TABLE "indicadores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"nome" text,
	"valor" text,
	"valor_numerico" numeric,
	"ano_referencia" integer,
	"fonte" text,
	"unidade" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "indicadores_id_municipio_nome_ano_referencia_key" UNIQUE("id_municipio","nome","ano_referencia")
);
--> statement-breakpoint
CREATE TABLE "obras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"nome" text,
	"situacao" text,
	"valor" numeric(15, 2),
	"percentual_execucao" numeric,
	"bairro" text,
	"lat" numeric,
	"lng" numeric,
	"link_fonte" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "noticias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"slug" text NOT NULL,
	"titulo" text NOT NULL,
	"resumo" text NOT NULL,
	"conteudo_html" text NOT NULL,
	"categoria" text NOT NULL,
	"temas" text[],
	"autor" text DEFAULT 'Controle Popular Betim',
	"publicado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	"fonte_externa_nome" text,
	"fonte_externa_url" text,
	CONSTRAINT "noticias_id_municipio_slug_key" UNIQUE("id_municipio","slug")
);
--> statement-breakpoint
CREATE TABLE "paraopeba_iniciativas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"id_fdi" text NOT NULL,
	"titulo" text NOT NULL,
	"municipios_envolvidos" text,
	"grupo_iniciativas" text,
	"tipo_obrigacao" text,
	"area_tematica" text,
	"sub_area_tematica" text,
	"anexo" text,
	"status" text,
	"investimento" numeric(16, 2),
	"valor_total" numeric(16, 2),
	"percentual_realizado" numeric(6, 2),
	"produtos_previstos" integer,
	"produtos_entregues" integer,
	"produtos_em_atraso" integer,
	"equipamentos_previstos" integer,
	"equipamentos_entregues" integer,
	"link_publico" text,
	"link_termo_compromisso" text,
	"referencia" text NOT NULL,
	CONSTRAINT "paraopeba_iniciativas_id_municipio_id_fdi_key" UNIQUE("id_municipio","id_fdi")
);
--> statement-breakpoint
CREATE TABLE "folha_pagamento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"orgao" text,
	"competencia" date,
	"total_bruto" numeric(15, 2),
	"qtd_servidores" integer,
	"fonte" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "folha_pagamento_id_municipio_orgao_competencia_key" UNIQUE("id_municipio","orgao","competencia")
);
--> statement-breakpoint
CREATE TABLE "fontes_externas" (
	"nome" text PRIMARY KEY NOT NULL,
	"url" text,
	"tipo_dados" text,
	"ultima_atualizacao" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "subsidios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"vereador_id" uuid,
	"competencia" date,
	"valor_bruto" numeric(15, 2),
	"verbas_extras" numeric(15, 2) DEFAULT '0',
	"fonte" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "subsidios_vereador_id_competencia_key" UNIQUE("vereador_id","competencia")
);
--> statement-breakpoint
CREATE TABLE "pntp" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"ano" integer,
	"poder" text,
	"indice" numeric(5, 2),
	"nivel" text,
	"posicao_estado" integer,
	"total_estado" integer,
	"criterios_essenciais" numeric(5, 2),
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "pntp_id_municipio_ano_poder_key" UNIQUE("id_municipio","ano","poder")
);
--> statement-breakpoint
CREATE TABLE "servidores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"orgao" text,
	"nome" text,
	"cargo" text,
	"lotacao" text,
	"vinculo" text,
	"resumo_ia" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "servidores_id_municipio_orgao_nome_cargo_key" UNIQUE("id_municipio","orgao","nome","cargo")
);
--> statement-breakpoint
CREATE TABLE "saude_estabelecimentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"id_cnes" text,
	"nome" text,
	"tipo" text,
	"endereco" text,
	"bairro" text,
	"lat" numeric,
	"lng" numeric,
	"profissionais_count" integer,
	"atualizado_em" date,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "saude_estabelecimentos_id_municipio_id_cnes_key" UNIQUE("id_municipio","id_cnes")
);
--> statement-breakpoint
CREATE TABLE "postos_anp" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"cnpj" text,
	"razao_social" text,
	"endereco" text,
	"bairro" text,
	"bandeira" text,
	"produtos" text[],
	"nota_anp" integer,
	"infracoes" jsonb,
	"interditado" boolean DEFAULT false,
	"lat" numeric,
	"lng" numeric,
	"atualizado_em" date,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "postos_anp_cnpj_key" UNIQUE("cnpj")
);
--> statement-breakpoint
CREATE TABLE "saude_internacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"ano" integer,
	"carater" text,
	"qtd" integer,
	"obitos" integer,
	"permanencia_media" numeric,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "saude_internacoes_id_municipio_ano_carater_key" UNIQUE("id_municipio","ano","carater")
);
--> statement-breakpoint
CREATE TABLE "processos_judiciais" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"vereador_id" uuid,
	"numero_processo" text,
	"tribunal" text,
	"classe" text,
	"assuntos" text[],
	"papel" text,
	"status" text,
	"qtd_movimentacoes" integer,
	"data_distribuicao" date,
	"ultima_movimentacao" date,
	"sentenca_data" date,
	"sentenca_tipo" text,
	"resumo_ia" text,
	"revisao_solicitada" boolean DEFAULT false,
	"atualizado_em" date,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "processos_judiciais_vereador_id_numero_processo_key" UNIQUE("vereador_id","numero_processo")
);
--> statement-breakpoint
CREATE TABLE "pautas_atas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"tipo" text,
	"titulo" text,
	"data_sessao" date,
	"conteudo" text,
	"link_fonte" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "seguidores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"entidade_tipo" text NOT NULL,
	"entidade_id" text NOT NULL,
	"canal" text NOT NULL,
	"contato" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now(),
	CONSTRAINT "seguidores_id_municipio_entidade_tipo_entidade_id_canal_con_key" UNIQUE("id_municipio","entidade_tipo","entidade_id","canal","contato")
);
--> statement-breakpoint
CREATE TABLE "vereadores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"slug" text,
	"nome" text,
	"nome_urna" text,
	"partido" text,
	"cargo_mesa" text,
	"foto_url" text,
	"email" text,
	"mandato_inicio" date,
	"mandato_fim" date,
	"ativo" boolean DEFAULT true,
	"votos_eleicao" integer,
	"ano_eleicao" integer,
	"id_candidato_tse" text,
	"declaracao_cotas" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	"biografia" text,
	"profissao" text,
	"aniversario_dia_mes" text,
	CONSTRAINT "vereadores_id_municipio_slug_key" UNIQUE("id_municipio","slug")
);
--> statement-breakpoint
CREATE TABLE "zap_estabelecimentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"nome" text,
	"whatsapp" text,
	"categoria" text,
	"descricao" text,
	"aprovado" boolean DEFAULT false,
	"cliques" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	"bairro" text
);
--> statement-breakpoint
CREATE TABLE "proposicoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"vereador_id" uuid,
	"tipo" text,
	"numero" integer,
	"ano" integer,
	"ementa" text,
	"situacao" text,
	"data_apresentacao" date,
	"autores" text[],
	"resumo_ia" text,
	"link_fonte" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	"temas" text[]
);
--> statement-breakpoint
CREATE TABLE "verbas_indenizatorias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"vereador_id" uuid,
	"beneficiario" text,
	"data" date,
	"grupo_verba" text,
	"fornecedor" text,
	"valor" numeric(15, 2),
	"link_fonte" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "verbas_indenizatorias_id_municipio_vereador_id_data_grupo_v_key" UNIQUE("id_municipio","vereador_id","data","grupo_verba","fornecedor","valor")
);
--> statement-breakpoint
CREATE TABLE "despesas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"ano" integer,
	"estagio" text,
	"funcao" text,
	"conta" text,
	"valor" numeric(15, 2),
	"fonte" text DEFAULT 'br_me_siconfi',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "despesas_id_municipio_ano_estagio_funcao_conta_key" UNIQUE("id_municipio","ano","estagio","funcao","conta")
);
--> statement-breakpoint
CREATE TABLE "telegram_inscritos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"chat_id" bigint NOT NULL,
	"temas" text[],
	"ativo" boolean DEFAULT true,
	"criado_em" timestamp with time zone DEFAULT now(),
	CONSTRAINT "telegram_inscritos_id_municipio_chat_id_key" UNIQUE("id_municipio","chat_id")
);
--> statement-breakpoint
CREATE TABLE "congresso"."analises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposicao_id" uuid NOT NULL,
	"score" numeric(6, 2),
	"rotulo" text,
	"clausula_petrea" boolean DEFAULT false,
	"vedacao_retrocesso" boolean DEFAULT false,
	"resumo_neutro" text,
	"parecer_critico" text,
	"legislacao_relacionada" jsonb,
	"modelo" text,
	"versao_rubrica" text,
	"versao_prompt" text,
	"status" text DEFAULT 'ok',
	"criado_em" timestamp with time zone DEFAULT now(),
	CONSTRAINT "analises_proposicao_id_key" UNIQUE("proposicao_id"),
	CONSTRAINT "analises_status_check" CHECK (status = ANY (ARRAY['ok'::text, 'requer_revisao'::text, 'falhou'::text]))
);
--> statement-breakpoint
CREATE TABLE "congresso"."analise_itens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analise_id" uuid NOT NULL,
	"direito" text NOT NULL,
	"dispositivo" text NOT NULL,
	"direcao" text NOT NULL,
	"mecanismo" text,
	"titulares" text[],
	"grau" text,
	"trecho" text,
	"confianca" numeric(3, 2),
	"peso" numeric(6, 2),
	CONSTRAINT "analise_itens_direcao_check" CHECK (direcao = ANY (ARRAY['amplia'::text, 'restringe'::text, 'neutro'::text])),
	CONSTRAINT "analise_itens_grau_check" CHECK (grau = ANY (ARRAY['marginal'::text, 'moderado'::text, 'estrutural'::text]))
);
--> statement-breakpoint
CREATE TABLE "congresso"."parlamentares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"casa_id" text NOT NULL,
	"id_externo" text NOT NULL,
	"nome" text NOT NULL,
	"nome_eleitoral" text,
	"partido" text,
	"uf" text,
	"email" text,
	"url_foto" text,
	"url_perfil" text,
	"legislatura" integer,
	"ativo" boolean DEFAULT true,
	"raw" jsonb,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "parlamentares_casa_id_id_externo_key" UNIQUE("casa_id","id_externo")
);
--> statement-breakpoint
CREATE TABLE "socios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cnpj" text,
	"nome_socio" text,
	"documento_mascarado" text,
	"qualificacao" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "socios_cnpj_nome_socio_key" UNIQUE("cnpj","nome_socio")
);
--> statement-breakpoint
CREATE TABLE "receitas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"ano" integer,
	"estagio" text,
	"conta" text,
	"valor" numeric(15, 2),
	"fonte" text DEFAULT 'br_me_siconfi',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "receitas_id_municipio_ano_estagio_conta_key" UNIQUE("id_municipio","ano","estagio","conta")
);
--> statement-breakpoint
CREATE TABLE "seguranca_ocorrencias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"ano" integer,
	"mes" integer,
	"natureza" text,
	"qtd" integer,
	"fonte" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "seguranca_ocorrencias_id_municipio_ano_mes_natureza_key" UNIQUE("id_municipio","ano","mes","natureza")
);
--> statement-breakpoint
CREATE TABLE "producao_agropecuaria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"ano" integer NOT NULL,
	"categoria" text NOT NULL,
	"produto" text NOT NULL,
	"quantidade" numeric,
	"unidade" text,
	"area_colhida" numeric,
	"valor_producao_mil_reais" numeric(15, 2),
	"fonte" text DEFAULT 'br_ibge_pam_ppm',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone,
	CONSTRAINT "producao_agropecuaria_id_municipio_ano_categoria_produto_key" UNIQUE("id_municipio","ano","categoria","produto")
);
--> statement-breakpoint
CREATE TABLE "grupos_economicos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_municipio" text NOT NULL,
	"nome_grupo" text,
	"setor" text,
	"cnpjs" text[],
	"socios_comuns" text[],
	"valor_total_contratos" numeric(15, 2),
	"qtd_contratos" integer,
	"detectado_em" date,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "cache_ia" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hash_prompt" text,
	"tipo" text,
	"entidade_id" uuid,
	"resposta" text,
	"modelo" text,
	"criado_em" timestamp with time zone DEFAULT now(),
	CONSTRAINT "cache_ia_hash_prompt_key" UNIQUE("hash_prompt")
);
--> statement-breakpoint
CREATE TABLE "judiciario"."documentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"vaga_id" uuid,
	"nomeacao_id" uuid,
	"tipo" text,
	"destinatarios" jsonb,
	"titulo" text,
	"corpo" text,
	"status" text DEFAULT 'rascunho',
	"criado_em" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "congresso"."bancada_membros" (
	"bancada_id" uuid NOT NULL,
	"parlamentar_id" uuid NOT NULL,
	"papel" text,
	CONSTRAINT "bancada_membros_pkey" PRIMARY KEY("bancada_id","parlamentar_id")
);
--> statement-breakpoint
CREATE TABLE "congresso"."votos" (
	"votacao_id" uuid NOT NULL,
	"parlamentar_id" uuid NOT NULL,
	"voto" text,
	CONSTRAINT "votos_pkey" PRIMARY KEY("votacao_id","parlamentar_id")
);
--> statement-breakpoint
CREATE TABLE "congresso"."orgao_membros" (
	"orgao_id" uuid NOT NULL,
	"parlamentar_id" uuid NOT NULL,
	"papel" text,
	CONSTRAINT "orgao_membros_pkey" PRIMARY KEY("orgao_id","parlamentar_id")
);
--> statement-breakpoint
CREATE TABLE "judiciario"."feriados" (
	"data" date NOT NULL,
	"nome" text,
	"tipo" text,
	"uf" text NOT NULL,
	CONSTRAINT "feriados_pkey" PRIMARY KEY("data","uf")
);
--> statement-breakpoint
CREATE TABLE "congresso"."proposicao_autores" (
	"proposicao_id" uuid NOT NULL,
	"parlamentar_id" uuid NOT NULL,
	"ordem" integer,
	"proponente" boolean DEFAULT false,
	CONSTRAINT "proposicao_autores_pkey" PRIMARY KEY("proposicao_id","parlamentar_id")
);
--> statement-breakpoint
ALTER TABLE "congresso"."alertas" ADD CONSTRAINT "alertas_proposicao_id_fkey" FOREIGN KEY ("proposicao_id") REFERENCES "congresso"."proposicoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "congresso"."alertas" ADD CONSTRAINT "alertas_monitoramento_id_fkey" FOREIGN KEY ("monitoramento_id") REFERENCES "congresso"."monitoramentos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "congresso"."bancadas" ADD CONSTRAINT "bancadas_casa_id_fkey" FOREIGN KEY ("casa_id") REFERENCES "congresso"."casas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "congresso"."analise_contestacoes" ADD CONSTRAINT "analise_contestacoes_analise_id_fkey" FOREIGN KEY ("analise_id") REFERENCES "congresso"."analises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "congresso"."documentos" ADD CONSTRAINT "documentos_proposicao_id_fkey" FOREIGN KEY ("proposicao_id") REFERENCES "congresso"."proposicoes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "congresso"."envios" ADD CONSTRAINT "envios_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "congresso"."documentos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "congresso"."embeddings" ADD CONSTRAINT "embeddings_proposicao_id_fkey" FOREIGN KEY ("proposicao_id") REFERENCES "congresso"."proposicoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "congresso"."proposicoes" ADD CONSTRAINT "proposicoes_casa_id_fkey" FOREIGN KEY ("casa_id") REFERENCES "congresso"."casas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "congresso"."orgaos" ADD CONSTRAINT "orgaos_casa_id_fkey" FOREIGN KEY ("casa_id") REFERENCES "congresso"."casas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "congresso"."votacoes" ADD CONSTRAINT "votacoes_proposicao_id_fkey" FOREIGN KEY ("proposicao_id") REFERENCES "congresso"."proposicoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "congresso"."votacoes" ADD CONSTRAINT "votacoes_casa_id_fkey" FOREIGN KEY ("casa_id") REFERENCES "congresso"."casas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "congresso"."tramitacoes" ADD CONSTRAINT "tramitacoes_proposicao_id_fkey" FOREIGN KEY ("proposicao_id") REFERENCES "congresso"."proposicoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judiciario"."alertas" ADD CONSTRAINT "alertas_vaga_id_fkey" FOREIGN KEY ("vaga_id") REFERENCES "judiciario"."vagas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judiciario"."alertas" ADD CONSTRAINT "alertas_monitoramento_id_fkey" FOREIGN KEY ("monitoramento_id") REFERENCES "judiciario"."monitoramentos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judiciario"."envios" ADD CONSTRAINT "envios_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "judiciario"."documentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judiciario"."cadeiras" ADD CONSTRAINT "cadeiras_tribunal_id_fkey" FOREIGN KEY ("tribunal_id") REFERENCES "judiciario"."tribunais"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judiciario"."mandatos_direcao" ADD CONSTRAINT "mandatos_direcao_magistrado_id_fkey" FOREIGN KEY ("magistrado_id") REFERENCES "judiciario"."magistrados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judiciario"."mandatos_direcao" ADD CONSTRAINT "mandatos_direcao_tribunal_id_fkey" FOREIGN KEY ("tribunal_id") REFERENCES "judiciario"."tribunais"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judiciario"."ocupacoes" ADD CONSTRAINT "ocupacoes_cadeira_id_fkey" FOREIGN KEY ("cadeira_id") REFERENCES "judiciario"."cadeiras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judiciario"."ocupacoes" ADD CONSTRAINT "ocupacoes_magistrado_id_fkey" FOREIGN KEY ("magistrado_id") REFERENCES "judiciario"."magistrados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beneficios_sociais" ADD CONSTRAINT "beneficios_sociais_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anuncios" ADD CONSTRAINT "anuncios_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "arboviroses" ADD CONSTRAINT "arboviroses_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judiciario"."nomeacoes" ADD CONSTRAINT "nomeacoes_cadeira_id_fkey" FOREIGN KEY ("cadeira_id") REFERENCES "judiciario"."cadeiras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judiciario"."nomeacoes" ADD CONSTRAINT "nomeacoes_magistrado_id_fkey" FOREIGN KEY ("magistrado_id") REFERENCES "judiciario"."magistrados"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judiciario"."nomeacoes" ADD CONSTRAINT "nomeacoes_tribunal_id_fkey" FOREIGN KEY ("tribunal_id") REFERENCES "judiciario"."tribunais"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atos_oficiais" ADD CONSTRAINT "atos_oficiais_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judiciario"."vagas" ADD CONSTRAINT "vagas_nomeacao_id_fkey" FOREIGN KEY ("nomeacao_id") REFERENCES "judiciario"."nomeacoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judiciario"."vagas" ADD CONSTRAINT "vagas_cadeira_id_fkey" FOREIGN KEY ("cadeira_id") REFERENCES "judiciario"."cadeiras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bens_candidato" ADD CONSTRAINT "bens_candidato_vereador_id_fkey" FOREIGN KEY ("vereador_id") REFERENCES "public"."vereadores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bens_candidato" ADD CONSTRAINT "bens_candidato_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classificados" ADD CONSTRAINT "classificados_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clima_cache" ADD CONSTRAINT "clima_cache_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coleta_lixo" ADD CONSTRAINT "coleta_lixo_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caixa_disponivel" ADD CONSTRAINT "caixa_disponivel_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissao_membros" ADD CONSTRAINT "comissao_membros_vereador_id_fkey" FOREIGN KEY ("vereador_id") REFERENCES "public"."vereadores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissao_membros" ADD CONSTRAINT "comissao_membros_comissao_id_fkey" FOREIGN KEY ("comissao_id") REFERENCES "public"."comissoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissao_membros" ADD CONSTRAINT "comissao_membros_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diarias" ADD CONSTRAINT "diarias_vereador_id_fkey" FOREIGN KEY ("vereador_id") REFERENCES "public"."vereadores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diarias" ADD CONSTRAINT "diarias_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emendas" ADD CONSTRAINT "emendas_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmacias_plantao" ADD CONSTRAINT "farmacias_plantao_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doacoes_campanha" ADD CONSTRAINT "doacoes_campanha_vereador_id_fkey" FOREIGN KEY ("vereador_id") REFERENCES "public"."vereadores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doacoes_campanha" ADD CONSTRAINT "doacoes_campanha_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comissoes" ADD CONSTRAINT "comissoes_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "convenios_federais" ADD CONSTRAINT "convenios_federais_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escolas" ADD CONSTRAINT "escolas_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comercios_essenciais" ADD CONSTRAINT "comercios_essenciais_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contatos_uteis" ADD CONSTRAINT "contatos_uteis_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meio_ambiente" ADD CONSTRAINT "meio_ambiente_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_inscritos" ADD CONSTRAINT "newsletter_inscritos_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nota_transparencia" ADD CONSTRAINT "nota_transparencia_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paraopeba_saldo_municipio" ADD CONSTRAINT "paraopeba_saldo_municipio_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licitacoes" ADD CONSTRAINT "licitacoes_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mortalidade" ADD CONSTRAINT "mortalidade_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "indicadores" ADD CONSTRAINT "indicadores_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obras" ADD CONSTRAINT "obras_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "noticias" ADD CONSTRAINT "noticias_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paraopeba_iniciativas" ADD CONSTRAINT "paraopeba_iniciativas_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folha_pagamento" ADD CONSTRAINT "folha_pagamento_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subsidios" ADD CONSTRAINT "subsidios_vereador_id_fkey" FOREIGN KEY ("vereador_id") REFERENCES "public"."vereadores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subsidios" ADD CONSTRAINT "subsidios_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pntp" ADD CONSTRAINT "pntp_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servidores" ADD CONSTRAINT "servidores_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saude_estabelecimentos" ADD CONSTRAINT "saude_estabelecimentos_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "postos_anp" ADD CONSTRAINT "postos_anp_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saude_internacoes" ADD CONSTRAINT "saude_internacoes_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processos_judiciais" ADD CONSTRAINT "processos_judiciais_vereador_id_fkey" FOREIGN KEY ("vereador_id") REFERENCES "public"."vereadores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processos_judiciais" ADD CONSTRAINT "processos_judiciais_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pautas_atas" ADD CONSTRAINT "pautas_atas_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seguidores" ADD CONSTRAINT "seguidores_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vereadores" ADD CONSTRAINT "vereadores_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zap_estabelecimentos" ADD CONSTRAINT "zap_estabelecimentos_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposicoes" ADD CONSTRAINT "proposicoes_vereador_id_fkey" FOREIGN KEY ("vereador_id") REFERENCES "public"."vereadores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposicoes" ADD CONSTRAINT "proposicoes_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verbas_indenizatorias" ADD CONSTRAINT "verbas_indenizatorias_vereador_id_fkey" FOREIGN KEY ("vereador_id") REFERENCES "public"."vereadores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verbas_indenizatorias" ADD CONSTRAINT "verbas_indenizatorias_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "despesas" ADD CONSTRAINT "despesas_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_inscritos" ADD CONSTRAINT "telegram_inscritos_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "congresso"."analises" ADD CONSTRAINT "analises_proposicao_id_fkey" FOREIGN KEY ("proposicao_id") REFERENCES "congresso"."proposicoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "congresso"."analise_itens" ADD CONSTRAINT "analise_itens_analise_id_fkey" FOREIGN KEY ("analise_id") REFERENCES "congresso"."analises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "congresso"."parlamentares" ADD CONSTRAINT "parlamentares_casa_id_fkey" FOREIGN KEY ("casa_id") REFERENCES "congresso"."casas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "socios" ADD CONSTRAINT "socios_cnpj_fkey" FOREIGN KEY ("cnpj") REFERENCES "public"."fornecedores"("cnpj") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receitas" ADD CONSTRAINT "receitas_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seguranca_ocorrencias" ADD CONSTRAINT "seguranca_ocorrencias_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "producao_agropecuaria" ADD CONSTRAINT "producao_agropecuaria_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grupos_economicos" ADD CONSTRAINT "grupos_economicos_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "public"."municipios"("id_municipio") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judiciario"."documentos" ADD CONSTRAINT "documentos_nomeacao_id_fkey" FOREIGN KEY ("nomeacao_id") REFERENCES "judiciario"."nomeacoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judiciario"."documentos" ADD CONSTRAINT "documentos_vaga_id_fkey" FOREIGN KEY ("vaga_id") REFERENCES "judiciario"."vagas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "congresso"."bancada_membros" ADD CONSTRAINT "bancada_membros_parlamentar_id_fkey" FOREIGN KEY ("parlamentar_id") REFERENCES "congresso"."parlamentares"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "congresso"."bancada_membros" ADD CONSTRAINT "bancada_membros_bancada_id_fkey" FOREIGN KEY ("bancada_id") REFERENCES "congresso"."bancadas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "congresso"."votos" ADD CONSTRAINT "votos_votacao_id_fkey" FOREIGN KEY ("votacao_id") REFERENCES "congresso"."votacoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "congresso"."votos" ADD CONSTRAINT "votos_parlamentar_id_fkey" FOREIGN KEY ("parlamentar_id") REFERENCES "congresso"."parlamentares"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "congresso"."orgao_membros" ADD CONSTRAINT "orgao_membros_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "congresso"."orgaos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "congresso"."orgao_membros" ADD CONSTRAINT "orgao_membros_parlamentar_id_fkey" FOREIGN KEY ("parlamentar_id") REFERENCES "congresso"."parlamentares"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "congresso"."proposicao_autores" ADD CONSTRAINT "proposicao_autores_parlamentar_id_fkey" FOREIGN KEY ("parlamentar_id") REFERENCES "congresso"."parlamentares"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "congresso"."proposicao_autores" ADD CONSTRAINT "proposicao_autores_proposicao_id_fkey" FOREIGN KEY ("proposicao_id") REFERENCES "congresso"."proposicoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alertas_user_id_lido_criado_em_idx" ON "congresso"."alertas" USING btree ("user_id" timestamptz_ops,"lido" timestamptz_ops,"criado_em" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "documentos_user_id_criado_em_idx" ON "congresso"."documentos" USING btree ("user_id" timestamptz_ops,"criado_em" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "monitoramentos_user_id_ativo_idx" ON "congresso"."monitoramentos" USING btree ("user_id" bool_ops,"ativo" bool_ops);--> statement-breakpoint
CREATE INDEX "embeddings_embedding_idx" ON "congresso"."embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "proposicoes_casa_id_ano_tramitando_idx" ON "congresso"."proposicoes" USING btree ("casa_id" text_ops,"ano" text_ops,"tramitando" text_ops);--> statement-breakpoint
CREATE INDEX "proposicoes_data_apresentacao_idx" ON "congresso"."proposicoes" USING btree ("data_apresentacao" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "proposicoes_temas_oficiais_idx" ON "congresso"."proposicoes" USING gin ("temas_oficiais" array_ops);--> statement-breakpoint
CREATE INDEX "proposicoes_to_tsvector_idx" ON "congresso"."proposicoes" USING gin (to_tsvector('portuguese'::regconfig, ((COALESCE(ementa, ''::tex tsvector_ops);--> statement-breakpoint
CREATE INDEX "tramitacoes_proposicao_id_data_hora_idx" ON "congresso"."tramitacoes" USING btree ("proposicao_id" timestamptz_ops,"data_hora" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_cadeiras_tribunal" ON "judiciario"."cadeiras" USING btree ("tribunal_id" text_ops,"cota" text_ops);--> statement-breakpoint
CREATE INDEX "idx_ocupacoes_atual" ON "judiciario"."ocupacoes" USING btree ("atual" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_nomeacoes_tribunal" ON "judiciario"."nomeacoes" USING btree ("tribunal_id" date_ops,"data_deliberacao" date_ops);--> statement-breakpoint
CREATE INDEX "bens_candidato_vereador_id_idx" ON "bens_candidato" USING btree ("vereador_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "comissao_membros_comissao_id_idx" ON "comissao_membros" USING btree ("comissao_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "comissao_membros_vereador_id_idx" ON "comissao_membros" USING btree ("vereador_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "embeddings_embedding_idx" ON "embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "contratos_id_municipio_ano_idx" ON "contratos" USING btree ("id_municipio" int4_ops,"ano" text_ops);--> statement-breakpoint
CREATE INDEX "contratos_temas_idx" ON "contratos" USING gin ("temas" array_ops);--> statement-breakpoint
CREATE INDEX "contratos_to_tsvector_idx" ON "contratos" USING gin (to_tsvector('portuguese'::regconfig, objeto) tsvector_ops);--> statement-breakpoint
CREATE INDEX "noticias_id_municipio_publicado_em_idx" ON "noticias" USING btree ("id_municipio" text_ops,"publicado_em" text_ops);--> statement-breakpoint
CREATE INDEX "proposicoes_temas_idx" ON "proposicoes" USING gin ("temas" array_ops);--> statement-breakpoint
CREATE INDEX "verbas_indenizatorias_id_municipio_fornecedor_idx" ON "verbas_indenizatorias" USING btree ("id_municipio" text_ops,"fornecedor" text_ops);--> statement-breakpoint
CREATE INDEX "verbas_indenizatorias_id_municipio_grupo_verba_idx" ON "verbas_indenizatorias" USING btree ("id_municipio" text_ops,"grupo_verba" text_ops);--> statement-breakpoint
CREATE INDEX "analises_rotulo_idx" ON "congresso"."analises" USING btree ("rotulo" text_ops);--> statement-breakpoint
CREATE INDEX "analises_status_idx" ON "congresso"."analises" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "analise_itens_analise_id_idx" ON "congresso"."analise_itens" USING btree ("analise_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "parlamentares_casa_id_ativo_idx" ON "congresso"."parlamentares" USING btree ("casa_id" text_ops,"ativo" text_ops);--> statement-breakpoint
CREATE INDEX "parlamentares_nome_idx" ON "congresso"."parlamentares" USING gin ("nome" gin_trgm_ops);--> statement-breakpoint
CREATE VIEW "judiciario"."vw_vacancia" AS (SELECT o.id AS ocupacao_id, o.cadeira_id, o.magistrado_id, c.tribunal_id, c.cota, m.nome AS magistrado_nome, m.data_nascimento, o.data_posse, o.atual, CASE WHEN o.data_saida IS NULL AND m.data_nascimento IS NOT NULL THEN (m.data_nascimento + '75 years'::interval)::date ELSE NULL::date END AS vacancia_projetada FROM judiciario.ocupacoes o JOIN judiciario.cadeiras c ON c.id = o.cadeira_id JOIN judiciario.magistrados m ON m.id = o.magistrado_id);--> statement-breakpoint
CREATE VIEW "public"."seguidores_contagem" AS (SELECT id_municipio, entidade_tipo, entidade_id, count(*) AS total FROM seguidores GROUP BY id_municipio, entidade_tipo, entidade_id);
*/