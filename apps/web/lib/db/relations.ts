import { relations } from "drizzle-orm/relations";
import { proposicoesInCongresso, alertasInCongresso, monitoramentosInCongresso, casasInCongresso, bancadasInCongresso, analisesInCongresso, analise_contestacoesInCongresso, documentosInCongresso, enviosInCongresso, embeddingsInCongresso, orgaosInCongresso, votacoesInCongresso, tramitacoesInCongresso, vagasInJudiciario, alertasInJudiciario, monitoramentosInJudiciario, documentosInJudiciario, enviosInJudiciario, tribunaisInJudiciario, cadeirasInJudiciario, magistradosInJudiciario, mandatos_direcaoInJudiciario, ocupacoesInJudiciario, municipios, beneficios_sociais, anuncios, arboviroses, nomeacoesInJudiciario, atos_oficiais, vereadores, bens_candidato, classificados, clima_cache, coleta_lixo, caixa_disponivel, comissao_membros, comissoes, diarias, embeddings, emendas, farmacias_plantao, doacoes_campanha, contratos, convenios_federais, escolas, comercios_essenciais, contatos_uteis, meio_ambiente, newsletter_inscritos, nota_transparencia, paraopeba_saldo_municipio, licitacoes, mortalidade, indicadores, obras, noticias, paraopeba_iniciativas, folha_pagamento, subsidios, pntp, servidores, saude_estabelecimentos, postos_anp, saude_internacoes, processos_judiciais, pautas_atas, seguidores, zap_estabelecimentos, proposicoes, verbas_indenizatorias, despesas, telegram_inscritos, analise_itensInCongresso, parlamentaresInCongresso, fornecedores, socios, receitas, seguranca_ocorrencias, producao_agropecuaria, grupos_economicos, bancada_membrosInCongresso, votosInCongresso, orgao_membrosInCongresso, proposicao_autoresInCongresso } from "./schema";

export const alertasInCongressoRelations = relations(alertasInCongresso, ({one}) => ({
	proposicoesInCongresso: one(proposicoesInCongresso, {
		fields: [alertasInCongresso.proposicao_id],
		references: [proposicoesInCongresso.id]
	}),
	monitoramentosInCongresso: one(monitoramentosInCongresso, {
		fields: [alertasInCongresso.monitoramento_id],
		references: [monitoramentosInCongresso.id]
	}),
}));

export const proposicoesInCongressoRelations = relations(proposicoesInCongresso, ({one, many}) => ({
	alertasInCongressos: many(alertasInCongresso),
	documentosInCongressos: many(documentosInCongresso),
	embeddingsInCongressos: many(embeddingsInCongresso),
	casasInCongresso: one(casasInCongresso, {
		fields: [proposicoesInCongresso.casa_id],
		references: [casasInCongresso.id]
	}),
	votacoesInCongressos: many(votacoesInCongresso),
	tramitacoesInCongressos: many(tramitacoesInCongresso),
	analisesInCongressos: many(analisesInCongresso),
	proposicao_autoresInCongressos: many(proposicao_autoresInCongresso),
}));

export const monitoramentosInCongressoRelations = relations(monitoramentosInCongresso, ({many}) => ({
	alertasInCongressos: many(alertasInCongresso),
}));

export const bancadasInCongressoRelations = relations(bancadasInCongresso, ({one, many}) => ({
	casasInCongresso: one(casasInCongresso, {
		fields: [bancadasInCongresso.casa_id],
		references: [casasInCongresso.id]
	}),
	bancada_membrosInCongressos: many(bancada_membrosInCongresso),
}));

export const casasInCongressoRelations = relations(casasInCongresso, ({many}) => ({
	bancadasInCongressos: many(bancadasInCongresso),
	proposicoesInCongressos: many(proposicoesInCongresso),
	orgaosInCongressos: many(orgaosInCongresso),
	votacoesInCongressos: many(votacoesInCongresso),
	parlamentaresInCongressos: many(parlamentaresInCongresso),
}));

export const analise_contestacoesInCongressoRelations = relations(analise_contestacoesInCongresso, ({one}) => ({
	analisesInCongresso: one(analisesInCongresso, {
		fields: [analise_contestacoesInCongresso.analise_id],
		references: [analisesInCongresso.id]
	}),
}));

export const analisesInCongressoRelations = relations(analisesInCongresso, ({one, many}) => ({
	analise_contestacoesInCongressos: many(analise_contestacoesInCongresso),
	proposicoesInCongresso: one(proposicoesInCongresso, {
		fields: [analisesInCongresso.proposicao_id],
		references: [proposicoesInCongresso.id]
	}),
	analise_itensInCongressos: many(analise_itensInCongresso),
}));

export const documentosInCongressoRelations = relations(documentosInCongresso, ({one, many}) => ({
	proposicoesInCongresso: one(proposicoesInCongresso, {
		fields: [documentosInCongresso.proposicao_id],
		references: [proposicoesInCongresso.id]
	}),
	enviosInCongressos: many(enviosInCongresso),
}));

export const enviosInCongressoRelations = relations(enviosInCongresso, ({one}) => ({
	documentosInCongresso: one(documentosInCongresso, {
		fields: [enviosInCongresso.documento_id],
		references: [documentosInCongresso.id]
	}),
}));

export const embeddingsInCongressoRelations = relations(embeddingsInCongresso, ({one}) => ({
	proposicoesInCongresso: one(proposicoesInCongresso, {
		fields: [embeddingsInCongresso.proposicao_id],
		references: [proposicoesInCongresso.id]
	}),
}));

export const orgaosInCongressoRelations = relations(orgaosInCongresso, ({one, many}) => ({
	casasInCongresso: one(casasInCongresso, {
		fields: [orgaosInCongresso.casa_id],
		references: [casasInCongresso.id]
	}),
	orgao_membrosInCongressos: many(orgao_membrosInCongresso),
}));

export const votacoesInCongressoRelations = relations(votacoesInCongresso, ({one, many}) => ({
	proposicoesInCongresso: one(proposicoesInCongresso, {
		fields: [votacoesInCongresso.proposicao_id],
		references: [proposicoesInCongresso.id]
	}),
	casasInCongresso: one(casasInCongresso, {
		fields: [votacoesInCongresso.casa_id],
		references: [casasInCongresso.id]
	}),
	votosInCongressos: many(votosInCongresso),
}));

export const tramitacoesInCongressoRelations = relations(tramitacoesInCongresso, ({one}) => ({
	proposicoesInCongresso: one(proposicoesInCongresso, {
		fields: [tramitacoesInCongresso.proposicao_id],
		references: [proposicoesInCongresso.id]
	}),
}));

export const alertasInJudiciarioRelations = relations(alertasInJudiciario, ({one}) => ({
	vagasInJudiciario: one(vagasInJudiciario, {
		fields: [alertasInJudiciario.vaga_id],
		references: [vagasInJudiciario.id]
	}),
	monitoramentosInJudiciario: one(monitoramentosInJudiciario, {
		fields: [alertasInJudiciario.monitoramento_id],
		references: [monitoramentosInJudiciario.id]
	}),
}));

export const vagasInJudiciarioRelations = relations(vagasInJudiciario, ({one, many}) => ({
	alertasInJudiciarios: many(alertasInJudiciario),
	nomeacoesInJudiciario: one(nomeacoesInJudiciario, {
		fields: [vagasInJudiciario.nomeacao_id],
		references: [nomeacoesInJudiciario.id]
	}),
	cadeirasInJudiciario: one(cadeirasInJudiciario, {
		fields: [vagasInJudiciario.cadeira_id],
		references: [cadeirasInJudiciario.id]
	}),
	documentosInJudiciarios: many(documentosInJudiciario),
}));

export const monitoramentosInJudiciarioRelations = relations(monitoramentosInJudiciario, ({many}) => ({
	alertasInJudiciarios: many(alertasInJudiciario),
}));

export const enviosInJudiciarioRelations = relations(enviosInJudiciario, ({one}) => ({
	documentosInJudiciario: one(documentosInJudiciario, {
		fields: [enviosInJudiciario.documento_id],
		references: [documentosInJudiciario.id]
	}),
}));

export const documentosInJudiciarioRelations = relations(documentosInJudiciario, ({one, many}) => ({
	enviosInJudiciarios: many(enviosInJudiciario),
	nomeacoesInJudiciario: one(nomeacoesInJudiciario, {
		fields: [documentosInJudiciario.nomeacao_id],
		references: [nomeacoesInJudiciario.id]
	}),
	vagasInJudiciario: one(vagasInJudiciario, {
		fields: [documentosInJudiciario.vaga_id],
		references: [vagasInJudiciario.id]
	}),
}));

export const cadeirasInJudiciarioRelations = relations(cadeirasInJudiciario, ({one, many}) => ({
	tribunaisInJudiciario: one(tribunaisInJudiciario, {
		fields: [cadeirasInJudiciario.tribunal_id],
		references: [tribunaisInJudiciario.id]
	}),
	ocupacoesInJudiciarios: many(ocupacoesInJudiciario),
	nomeacoesInJudiciarios: many(nomeacoesInJudiciario),
	vagasInJudiciarios: many(vagasInJudiciario),
}));

export const tribunaisInJudiciarioRelations = relations(tribunaisInJudiciario, ({many}) => ({
	cadeirasInJudiciarios: many(cadeirasInJudiciario),
	mandatos_direcaoInJudiciarios: many(mandatos_direcaoInJudiciario),
	nomeacoesInJudiciarios: many(nomeacoesInJudiciario),
}));

export const mandatos_direcaoInJudiciarioRelations = relations(mandatos_direcaoInJudiciario, ({one}) => ({
	magistradosInJudiciario: one(magistradosInJudiciario, {
		fields: [mandatos_direcaoInJudiciario.magistrado_id],
		references: [magistradosInJudiciario.id]
	}),
	tribunaisInJudiciario: one(tribunaisInJudiciario, {
		fields: [mandatos_direcaoInJudiciario.tribunal_id],
		references: [tribunaisInJudiciario.id]
	}),
}));

export const magistradosInJudiciarioRelations = relations(magistradosInJudiciario, ({many}) => ({
	mandatos_direcaoInJudiciarios: many(mandatos_direcaoInJudiciario),
	ocupacoesInJudiciarios: many(ocupacoesInJudiciario),
	nomeacoesInJudiciarios: many(nomeacoesInJudiciario),
}));

export const ocupacoesInJudiciarioRelations = relations(ocupacoesInJudiciario, ({one}) => ({
	cadeirasInJudiciario: one(cadeirasInJudiciario, {
		fields: [ocupacoesInJudiciario.cadeira_id],
		references: [cadeirasInJudiciario.id]
	}),
	magistradosInJudiciario: one(magistradosInJudiciario, {
		fields: [ocupacoesInJudiciario.magistrado_id],
		references: [magistradosInJudiciario.id]
	}),
}));

export const beneficios_sociaisRelations = relations(beneficios_sociais, ({one}) => ({
	municipio: one(municipios, {
		fields: [beneficios_sociais.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const municipiosRelations = relations(municipios, ({many}) => ({
	beneficios_sociais: many(beneficios_sociais),
	anuncios: many(anuncios),
	arboviroses: many(arboviroses),
	atos_oficiais: many(atos_oficiais),
	bens_candidatoes: many(bens_candidato),
	classificados: many(classificados),
	clima_caches: many(clima_cache),
	coleta_lixos: many(coleta_lixo),
	caixa_disponivels: many(caixa_disponivel),
	comissao_membros: many(comissao_membros),
	diarias: many(diarias),
	embeddings: many(embeddings),
	emendas: many(emendas),
	farmacias_plantaos: many(farmacias_plantao),
	doacoes_campanhas: many(doacoes_campanha),
	comissoes: many(comissoes),
	contratos: many(contratos),
	convenios_federais: many(convenios_federais),
	escolas: many(escolas),
	comercios_essenciais: many(comercios_essenciais),
	contatos_uteis: many(contatos_uteis),
	meio_ambientes: many(meio_ambiente),
	newsletter_inscritos: many(newsletter_inscritos),
	nota_transparencias: many(nota_transparencia),
	paraopeba_saldo_municipios: many(paraopeba_saldo_municipio),
	licitacoes: many(licitacoes),
	mortalidades: many(mortalidade),
	indicadores: many(indicadores),
	obras: many(obras),
	noticias: many(noticias),
	paraopeba_iniciativas: many(paraopeba_iniciativas),
	folha_pagamentos: many(folha_pagamento),
	subsidios: many(subsidios),
	pntps: many(pntp),
	servidores: many(servidores),
	saude_estabelecimentos: many(saude_estabelecimentos),
	postos_anps: many(postos_anp),
	saude_internacoes: many(saude_internacoes),
	processos_judiciais: many(processos_judiciais),
	pautas_atas: many(pautas_atas),
	seguidores: many(seguidores),
	vereadores: many(vereadores),
	zap_estabelecimentos: many(zap_estabelecimentos),
	proposicoes: many(proposicoes),
	verbas_indenizatorias: many(verbas_indenizatorias),
	despesas: many(despesas),
	telegram_inscritos: many(telegram_inscritos),
	receitas: many(receitas),
	seguranca_ocorrencias: many(seguranca_ocorrencias),
	producao_agropecuarias: many(producao_agropecuaria),
	grupos_economicos: many(grupos_economicos),
}));

export const anunciosRelations = relations(anuncios, ({one}) => ({
	municipio: one(municipios, {
		fields: [anuncios.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const arbovirosesRelations = relations(arboviroses, ({one}) => ({
	municipio: one(municipios, {
		fields: [arboviroses.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const nomeacoesInJudiciarioRelations = relations(nomeacoesInJudiciario, ({one, many}) => ({
	cadeirasInJudiciario: one(cadeirasInJudiciario, {
		fields: [nomeacoesInJudiciario.cadeira_id],
		references: [cadeirasInJudiciario.id]
	}),
	magistradosInJudiciario: one(magistradosInJudiciario, {
		fields: [nomeacoesInJudiciario.magistrado_id],
		references: [magistradosInJudiciario.id]
	}),
	tribunaisInJudiciario: one(tribunaisInJudiciario, {
		fields: [nomeacoesInJudiciario.tribunal_id],
		references: [tribunaisInJudiciario.id]
	}),
	vagasInJudiciarios: many(vagasInJudiciario),
	documentosInJudiciarios: many(documentosInJudiciario),
}));

export const atos_oficiaisRelations = relations(atos_oficiais, ({one}) => ({
	municipio: one(municipios, {
		fields: [atos_oficiais.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const bens_candidatoRelations = relations(bens_candidato, ({one}) => ({
	vereadore: one(vereadores, {
		fields: [bens_candidato.vereador_id],
		references: [vereadores.id]
	}),
	municipio: one(municipios, {
		fields: [bens_candidato.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const vereadoresRelations = relations(vereadores, ({one, many}) => ({
	bens_candidatoes: many(bens_candidato),
	comissao_membros: many(comissao_membros),
	diarias: many(diarias),
	doacoes_campanhas: many(doacoes_campanha),
	subsidios: many(subsidios),
	processos_judiciais: many(processos_judiciais),
	municipio: one(municipios, {
		fields: [vereadores.id_municipio],
		references: [municipios.id_municipio]
	}),
	proposicoes: many(proposicoes),
	verbas_indenizatorias: many(verbas_indenizatorias),
}));

export const classificadosRelations = relations(classificados, ({one}) => ({
	municipio: one(municipios, {
		fields: [classificados.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const clima_cacheRelations = relations(clima_cache, ({one}) => ({
	municipio: one(municipios, {
		fields: [clima_cache.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const coleta_lixoRelations = relations(coleta_lixo, ({one}) => ({
	municipio: one(municipios, {
		fields: [coleta_lixo.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const caixa_disponivelRelations = relations(caixa_disponivel, ({one}) => ({
	municipio: one(municipios, {
		fields: [caixa_disponivel.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const comissao_membrosRelations = relations(comissao_membros, ({one}) => ({
	vereadore: one(vereadores, {
		fields: [comissao_membros.vereador_id],
		references: [vereadores.id]
	}),
	comissoe: one(comissoes, {
		fields: [comissao_membros.comissao_id],
		references: [comissoes.id]
	}),
	municipio: one(municipios, {
		fields: [comissao_membros.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const comissoesRelations = relations(comissoes, ({one, many}) => ({
	comissao_membros: many(comissao_membros),
	municipio: one(municipios, {
		fields: [comissoes.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const diariasRelations = relations(diarias, ({one}) => ({
	vereadore: one(vereadores, {
		fields: [diarias.vereador_id],
		references: [vereadores.id]
	}),
	municipio: one(municipios, {
		fields: [diarias.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const embeddingsRelations = relations(embeddings, ({one}) => ({
	municipio: one(municipios, {
		fields: [embeddings.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const emendasRelations = relations(emendas, ({one}) => ({
	municipio: one(municipios, {
		fields: [emendas.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const farmacias_plantaoRelations = relations(farmacias_plantao, ({one}) => ({
	municipio: one(municipios, {
		fields: [farmacias_plantao.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const doacoes_campanhaRelations = relations(doacoes_campanha, ({one}) => ({
	vereadore: one(vereadores, {
		fields: [doacoes_campanha.vereador_id],
		references: [vereadores.id]
	}),
	municipio: one(municipios, {
		fields: [doacoes_campanha.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const contratosRelations = relations(contratos, ({one}) => ({
	municipio: one(municipios, {
		fields: [contratos.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const convenios_federaisRelations = relations(convenios_federais, ({one}) => ({
	municipio: one(municipios, {
		fields: [convenios_federais.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const escolasRelations = relations(escolas, ({one}) => ({
	municipio: one(municipios, {
		fields: [escolas.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const comercios_essenciaisRelations = relations(comercios_essenciais, ({one}) => ({
	municipio: one(municipios, {
		fields: [comercios_essenciais.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const contatos_uteisRelations = relations(contatos_uteis, ({one}) => ({
	municipio: one(municipios, {
		fields: [contatos_uteis.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const meio_ambienteRelations = relations(meio_ambiente, ({one}) => ({
	municipio: one(municipios, {
		fields: [meio_ambiente.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const newsletter_inscritosRelations = relations(newsletter_inscritos, ({one}) => ({
	municipio: one(municipios, {
		fields: [newsletter_inscritos.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const nota_transparenciaRelations = relations(nota_transparencia, ({one}) => ({
	municipio: one(municipios, {
		fields: [nota_transparencia.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const paraopeba_saldo_municipioRelations = relations(paraopeba_saldo_municipio, ({one}) => ({
	municipio: one(municipios, {
		fields: [paraopeba_saldo_municipio.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const licitacoesRelations = relations(licitacoes, ({one}) => ({
	municipio: one(municipios, {
		fields: [licitacoes.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const mortalidadeRelations = relations(mortalidade, ({one}) => ({
	municipio: one(municipios, {
		fields: [mortalidade.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const indicadoresRelations = relations(indicadores, ({one}) => ({
	municipio: one(municipios, {
		fields: [indicadores.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const obrasRelations = relations(obras, ({one}) => ({
	municipio: one(municipios, {
		fields: [obras.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const noticiasRelations = relations(noticias, ({one}) => ({
	municipio: one(municipios, {
		fields: [noticias.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const paraopeba_iniciativasRelations = relations(paraopeba_iniciativas, ({one}) => ({
	municipio: one(municipios, {
		fields: [paraopeba_iniciativas.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const folha_pagamentoRelations = relations(folha_pagamento, ({one}) => ({
	municipio: one(municipios, {
		fields: [folha_pagamento.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const subsidiosRelations = relations(subsidios, ({one}) => ({
	vereadore: one(vereadores, {
		fields: [subsidios.vereador_id],
		references: [vereadores.id]
	}),
	municipio: one(municipios, {
		fields: [subsidios.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const pntpRelations = relations(pntp, ({one}) => ({
	municipio: one(municipios, {
		fields: [pntp.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const servidoresRelations = relations(servidores, ({one}) => ({
	municipio: one(municipios, {
		fields: [servidores.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const saude_estabelecimentosRelations = relations(saude_estabelecimentos, ({one}) => ({
	municipio: one(municipios, {
		fields: [saude_estabelecimentos.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const postos_anpRelations = relations(postos_anp, ({one}) => ({
	municipio: one(municipios, {
		fields: [postos_anp.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const saude_internacoesRelations = relations(saude_internacoes, ({one}) => ({
	municipio: one(municipios, {
		fields: [saude_internacoes.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const processos_judiciaisRelations = relations(processos_judiciais, ({one}) => ({
	vereadore: one(vereadores, {
		fields: [processos_judiciais.vereador_id],
		references: [vereadores.id]
	}),
	municipio: one(municipios, {
		fields: [processos_judiciais.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const pautas_atasRelations = relations(pautas_atas, ({one}) => ({
	municipio: one(municipios, {
		fields: [pautas_atas.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const seguidoresRelations = relations(seguidores, ({one}) => ({
	municipio: one(municipios, {
		fields: [seguidores.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const zap_estabelecimentosRelations = relations(zap_estabelecimentos, ({one}) => ({
	municipio: one(municipios, {
		fields: [zap_estabelecimentos.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const proposicoesRelations = relations(proposicoes, ({one}) => ({
	vereadore: one(vereadores, {
		fields: [proposicoes.vereador_id],
		references: [vereadores.id]
	}),
	municipio: one(municipios, {
		fields: [proposicoes.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const verbas_indenizatoriasRelations = relations(verbas_indenizatorias, ({one}) => ({
	vereadore: one(vereadores, {
		fields: [verbas_indenizatorias.vereador_id],
		references: [vereadores.id]
	}),
	municipio: one(municipios, {
		fields: [verbas_indenizatorias.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const despesasRelations = relations(despesas, ({one}) => ({
	municipio: one(municipios, {
		fields: [despesas.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const telegram_inscritosRelations = relations(telegram_inscritos, ({one}) => ({
	municipio: one(municipios, {
		fields: [telegram_inscritos.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const analise_itensInCongressoRelations = relations(analise_itensInCongresso, ({one}) => ({
	analisesInCongresso: one(analisesInCongresso, {
		fields: [analise_itensInCongresso.analise_id],
		references: [analisesInCongresso.id]
	}),
}));

export const parlamentaresInCongressoRelations = relations(parlamentaresInCongresso, ({one, many}) => ({
	casasInCongresso: one(casasInCongresso, {
		fields: [parlamentaresInCongresso.casa_id],
		references: [casasInCongresso.id]
	}),
	bancada_membrosInCongressos: many(bancada_membrosInCongresso),
	votosInCongressos: many(votosInCongresso),
	orgao_membrosInCongressos: many(orgao_membrosInCongresso),
	proposicao_autoresInCongressos: many(proposicao_autoresInCongresso),
}));

export const sociosRelations = relations(socios, ({one}) => ({
	fornecedore: one(fornecedores, {
		fields: [socios.cnpj],
		references: [fornecedores.cnpj]
	}),
}));

export const fornecedoresRelations = relations(fornecedores, ({many}) => ({
	socios: many(socios),
}));

export const receitasRelations = relations(receitas, ({one}) => ({
	municipio: one(municipios, {
		fields: [receitas.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const seguranca_ocorrenciasRelations = relations(seguranca_ocorrencias, ({one}) => ({
	municipio: one(municipios, {
		fields: [seguranca_ocorrencias.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const producao_agropecuariaRelations = relations(producao_agropecuaria, ({one}) => ({
	municipio: one(municipios, {
		fields: [producao_agropecuaria.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const grupos_economicosRelations = relations(grupos_economicos, ({one}) => ({
	municipio: one(municipios, {
		fields: [grupos_economicos.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const bancada_membrosInCongressoRelations = relations(bancada_membrosInCongresso, ({one}) => ({
	parlamentaresInCongresso: one(parlamentaresInCongresso, {
		fields: [bancada_membrosInCongresso.parlamentar_id],
		references: [parlamentaresInCongresso.id]
	}),
	bancadasInCongresso: one(bancadasInCongresso, {
		fields: [bancada_membrosInCongresso.bancada_id],
		references: [bancadasInCongresso.id]
	}),
}));

export const votosInCongressoRelations = relations(votosInCongresso, ({one}) => ({
	votacoesInCongresso: one(votacoesInCongresso, {
		fields: [votosInCongresso.votacao_id],
		references: [votacoesInCongresso.id]
	}),
	parlamentaresInCongresso: one(parlamentaresInCongresso, {
		fields: [votosInCongresso.parlamentar_id],
		references: [parlamentaresInCongresso.id]
	}),
}));

export const orgao_membrosInCongressoRelations = relations(orgao_membrosInCongresso, ({one}) => ({
	orgaosInCongresso: one(orgaosInCongresso, {
		fields: [orgao_membrosInCongresso.orgao_id],
		references: [orgaosInCongresso.id]
	}),
	parlamentaresInCongresso: one(parlamentaresInCongresso, {
		fields: [orgao_membrosInCongresso.parlamentar_id],
		references: [parlamentaresInCongresso.id]
	}),
}));

export const proposicao_autoresInCongressoRelations = relations(proposicao_autoresInCongresso, ({one}) => ({
	parlamentaresInCongresso: one(parlamentaresInCongresso, {
		fields: [proposicao_autoresInCongresso.parlamentar_id],
		references: [parlamentaresInCongresso.id]
	}),
	proposicoesInCongresso: one(proposicoesInCongresso, {
		fields: [proposicao_autoresInCongresso.proposicao_id],
		references: [proposicoesInCongresso.id]
	}),
}));