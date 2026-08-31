import { relations } from "drizzle-orm/relations";
import { proposicoesInCongresso, analisesInCongresso, casasInCongresso, bancadasInCongresso, documentosInCongresso, analise_contestacoesInCongresso, analise_itensInCongresso, enviosInCongresso, parlamentaresInCongresso, orgaosInCongresso, tramitacoesInCongresso, votacoesInCongresso, monitoramentosInJudiciario, alertasInJudiciario, vagasInJudiciario, tribunaisInJudiciario, cadeirasInJudiciario, magistradosInJudiciario, mandatos_direcaoInJudiciario, documentosInJudiciario, enviosInJudiciario, nomeacoesInJudiciario, municipios, arboviroses, beneficios_sociais, bens_candidato, vereadores, classificados, caixa_disponivel, clima_cache, coleta_lixo, comercios_essenciais, atos_oficiais, anuncios, convenios_federais, despesas, contatos_uteis, doacoes_campanha, emendas, escolas, farmacias_plantao, comissoes, folha_pagamento, contratos, licitacoes, meio_ambiente, mortalidade, nota_transparencia, indicadores, noticias, obras, paraopeba_saldo_municipio, pautas_atas, pntp, paraopeba_iniciativas, grupos_economicos, newsletter_inscritos, receitas, saude_estabelecimentos, saude_internacoes, saude_internacoes_cid, seguidores, seguranca_ocorrencias, servidores, fornecedores, socios, subsidios, telegram_inscritos, proposicoes, verbas_indenizatorias, postos_anp, processos_judiciais, producao_agropecuaria, zap_estabelecimentos, monitoramentosInCongresso, alertasInCongresso, ocupacoesInJudiciario, comissao_membros, votacoes_camara, diarias, analises, analise_itens, votos_camara, royalties_cfem, royalties_cfem_empresas, ibama_autos_infracao, ibama_embargos, ref_municipios_mg, snisb_barragens, cap_autos_infracao, feam_barragens, eventosInCongresso, presencas_plenarioInCongresso, atos_oficiais_geo, copam_reunioes, copam_pauta_itens, vicios_legislativosInCongresso, vicio_itensInCongresso, vicios_legislativos, vicio_itens, ambiental_licenciamento, bancada_membrosInCongresso, orgao_membrosInCongresso, votosInCongresso, proposicao_autoresInCongresso, proposicao_autoriaInCongresso, vazio_municipioInTerras, evento_pautaInCongresso } from "./schema";

export const analisesInCongressoRelations = relations(analisesInCongresso, ({one, many}) => ({
	proposicoesInCongresso: one(proposicoesInCongresso, {
		fields: [analisesInCongresso.proposicao_id],
		references: [proposicoesInCongresso.id]
	}),
	analise_contestacoesInCongressos: many(analise_contestacoesInCongresso),
	analise_itensInCongressos: many(analise_itensInCongresso),
}));

export const proposicoesInCongressoRelations = relations(proposicoesInCongresso, ({one, many}) => ({
	analisesInCongressos: many(analisesInCongresso),
	documentosInCongressos: many(documentosInCongresso),
	casasInCongresso: one(casasInCongresso, {
		fields: [proposicoesInCongresso.casa_id],
		references: [casasInCongresso.id]
	}),
	tramitacoesInCongressos: many(tramitacoesInCongresso),
	votacoesInCongressos: many(votacoesInCongresso),
	alertasInCongressos: many(alertasInCongresso),
	vicios_legislativosInCongressos: many(vicios_legislativosInCongresso),
	proposicao_autoresInCongressos: many(proposicao_autoresInCongresso),
	proposicao_autoriaInCongressos: many(proposicao_autoriaInCongresso),
	evento_pautaInCongressos: many(evento_pautaInCongresso),
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
	parlamentaresInCongressos: many(parlamentaresInCongresso),
	proposicoesInCongressos: many(proposicoesInCongresso),
	orgaosInCongressos: many(orgaosInCongresso),
	votacoesInCongressos: many(votacoesInCongresso),
	eventosInCongressos: many(eventosInCongresso),
	presencas_plenarioInCongressos: many(presencas_plenarioInCongresso),
}));

export const documentosInCongressoRelations = relations(documentosInCongresso, ({one, many}) => ({
	proposicoesInCongresso: one(proposicoesInCongresso, {
		fields: [documentosInCongresso.proposicao_id],
		references: [proposicoesInCongresso.id]
	}),
	enviosInCongressos: many(enviosInCongresso),
}));

export const analise_contestacoesInCongressoRelations = relations(analise_contestacoesInCongresso, ({one}) => ({
	analisesInCongresso: one(analisesInCongresso, {
		fields: [analise_contestacoesInCongresso.analise_id],
		references: [analisesInCongresso.id]
	}),
}));

export const analise_itensInCongressoRelations = relations(analise_itensInCongresso, ({one}) => ({
	analisesInCongresso: one(analisesInCongresso, {
		fields: [analise_itensInCongresso.analise_id],
		references: [analisesInCongresso.id]
	}),
}));

export const enviosInCongressoRelations = relations(enviosInCongresso, ({one}) => ({
	documentosInCongresso: one(documentosInCongresso, {
		fields: [enviosInCongresso.documento_id],
		references: [documentosInCongresso.id]
	}),
}));

export const parlamentaresInCongressoRelations = relations(parlamentaresInCongresso, ({one, many}) => ({
	casasInCongresso: one(casasInCongresso, {
		fields: [parlamentaresInCongresso.casa_id],
		references: [casasInCongresso.id]
	}),
	presencas_plenarioInCongressos: many(presencas_plenarioInCongresso),
	bancada_membrosInCongressos: many(bancada_membrosInCongresso),
	orgao_membrosInCongressos: many(orgao_membrosInCongresso),
	votosInCongressos: many(votosInCongresso),
	proposicao_autoresInCongressos: many(proposicao_autoresInCongresso),
	proposicao_autoriaInCongressos: many(proposicao_autoriaInCongresso),
}));

export const orgaosInCongressoRelations = relations(orgaosInCongresso, ({one, many}) => ({
	casasInCongresso: one(casasInCongresso, {
		fields: [orgaosInCongresso.casa_id],
		references: [casasInCongresso.id]
	}),
	orgao_membrosInCongressos: many(orgao_membrosInCongresso),
}));

export const tramitacoesInCongressoRelations = relations(tramitacoesInCongresso, ({one}) => ({
	proposicoesInCongresso: one(proposicoesInCongresso, {
		fields: [tramitacoesInCongresso.proposicao_id],
		references: [proposicoesInCongresso.id]
	}),
}));

export const votacoesInCongressoRelations = relations(votacoesInCongresso, ({one, many}) => ({
	casasInCongresso: one(casasInCongresso, {
		fields: [votacoesInCongresso.casa_id],
		references: [casasInCongresso.id]
	}),
	proposicoesInCongresso: one(proposicoesInCongresso, {
		fields: [votacoesInCongresso.proposicao_id],
		references: [proposicoesInCongresso.id]
	}),
	votosInCongressos: many(votosInCongresso),
}));

export const alertasInJudiciarioRelations = relations(alertasInJudiciario, ({one}) => ({
	monitoramentosInJudiciario: one(monitoramentosInJudiciario, {
		fields: [alertasInJudiciario.monitoramento_id],
		references: [monitoramentosInJudiciario.id]
	}),
	vagasInJudiciario: one(vagasInJudiciario, {
		fields: [alertasInJudiciario.vaga_id],
		references: [vagasInJudiciario.id]
	}),
}));

export const monitoramentosInJudiciarioRelations = relations(monitoramentosInJudiciario, ({many}) => ({
	alertasInJudiciarios: many(alertasInJudiciario),
}));

export const vagasInJudiciarioRelations = relations(vagasInJudiciario, ({one, many}) => ({
	alertasInJudiciarios: many(alertasInJudiciario),
	cadeirasInJudiciario: one(cadeirasInJudiciario, {
		fields: [vagasInJudiciario.cadeira_id],
		references: [cadeirasInJudiciario.id]
	}),
	nomeacoesInJudiciario: one(nomeacoesInJudiciario, {
		fields: [vagasInJudiciario.nomeacao_id],
		references: [nomeacoesInJudiciario.id]
	}),
	documentosInJudiciarios: many(documentosInJudiciario),
}));

export const cadeirasInJudiciarioRelations = relations(cadeirasInJudiciario, ({one, many}) => ({
	tribunaisInJudiciario: one(tribunaisInJudiciario, {
		fields: [cadeirasInJudiciario.tribunal_id],
		references: [tribunaisInJudiciario.id]
	}),
	nomeacoesInJudiciarios: many(nomeacoesInJudiciario),
	vagasInJudiciarios: many(vagasInJudiciario),
	ocupacoesInJudiciarios: many(ocupacoesInJudiciario),
}));

export const tribunaisInJudiciarioRelations = relations(tribunaisInJudiciario, ({many}) => ({
	cadeirasInJudiciarios: many(cadeirasInJudiciario),
	mandatos_direcaoInJudiciarios: many(mandatos_direcaoInJudiciario),
	nomeacoesInJudiciarios: many(nomeacoesInJudiciario),
	magistradosInJudiciarios: many(magistradosInJudiciario),
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

export const magistradosInJudiciarioRelations = relations(magistradosInJudiciario, ({one, many}) => ({
	mandatos_direcaoInJudiciarios: many(mandatos_direcaoInJudiciario),
	nomeacoesInJudiciarios: many(nomeacoesInJudiciario),
	ocupacoesInJudiciarios: many(ocupacoesInJudiciario),
	tribunaisInJudiciario: one(tribunaisInJudiciario, {
		fields: [magistradosInJudiciario.tribunal_atual],
		references: [tribunaisInJudiciario.id]
	}),
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

export const arbovirosesRelations = relations(arboviroses, ({one}) => ({
	municipio: one(municipios, {
		fields: [arboviroses.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const municipiosRelations = relations(municipios, ({many}) => ({
	arboviroses: many(arboviroses),
	beneficios_sociais: many(beneficios_sociais),
	bens_candidatoes: many(bens_candidato),
	classificados: many(classificados),
	caixa_disponivels: many(caixa_disponivel),
	clima_caches: many(clima_cache),
	coleta_lixos: many(coleta_lixo),
	comercios_essenciais: many(comercios_essenciais),
	atos_oficiais: many(atos_oficiais),
	anuncios: many(anuncios),
	convenios_federais: many(convenios_federais),
	despesas: many(despesas),
	contatos_uteis: many(contatos_uteis),
	doacoes_campanhas: many(doacoes_campanha),
	emendas: many(emendas),
	escolas: many(escolas),
	farmacias_plantaos: many(farmacias_plantao),
	comissoes: many(comissoes),
	folha_pagamentos: many(folha_pagamento),
	contratos: many(contratos),
	licitacoes: many(licitacoes),
	meio_ambientes: many(meio_ambiente),
	mortalidades: many(mortalidade),
	nota_transparencias: many(nota_transparencia),
	indicadores: many(indicadores),
	noticias: many(noticias),
	obras: many(obras),
	paraopeba_saldo_municipios: many(paraopeba_saldo_municipio),
	pautas_atas: many(pautas_atas),
	pntps: many(pntp),
	paraopeba_iniciativas: many(paraopeba_iniciativas),
	grupos_economicos: many(grupos_economicos),
	newsletter_inscritos: many(newsletter_inscritos),
	receitas: many(receitas),
	saude_estabelecimentos: many(saude_estabelecimentos),
	saude_internacoes: many(saude_internacoes),
	saude_internacoes_cid: many(saude_internacoes_cid),
	seguidores: many(seguidores),
	seguranca_ocorrencias: many(seguranca_ocorrencias),
	servidores: many(servidores),
	subsidios: many(subsidios),
	telegram_inscritos: many(telegram_inscritos),
	proposicoes: many(proposicoes),
	verbas_indenizatorias: many(verbas_indenizatorias),
	postos_anps: many(postos_anp),
	processos_judiciais: many(processos_judiciais),
	producao_agropecuarias: many(producao_agropecuaria),
	zap_estabelecimentos: many(zap_estabelecimentos),
	comissao_membros: many(comissao_membros),
	votacoes_camaras: many(votacoes_camara),
	diarias: many(diarias),
	analises: many(analises),
	analise_itens: many(analise_itens),
	vereadores: many(vereadores),
	votos_camaras: many(votos_camara),
	royalties_cfems: many(royalties_cfem),
	royalties_cfem_empresas: many(royalties_cfem_empresas),
	ibama_autos_infracaos: many(ibama_autos_infracao),
	ibama_embargos: many(ibama_embargos),
	cap_autos_infracaos: many(cap_autos_infracao),
	vicios_legislativos: many(vicios_legislativos),
	vicio_itens: many(vicio_itens),
	vazio_municipioInTerras: many(vazio_municipioInTerras),
}));

export const beneficios_sociaisRelations = relations(beneficios_sociais, ({one}) => ({
	municipio: one(municipios, {
		fields: [beneficios_sociais.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const bens_candidatoRelations = relations(bens_candidato, ({one}) => ({
	municipio: one(municipios, {
		fields: [bens_candidato.id_municipio],
		references: [municipios.id_municipio]
	}),
	vereadore: one(vereadores, {
		fields: [bens_candidato.vereador_id],
		references: [vereadores.id]
	}),
}));

export const vereadoresRelations = relations(vereadores, ({one, many}) => ({
	bens_candidatoes: many(bens_candidato),
	doacoes_campanhas: many(doacoes_campanha),
	subsidios: many(subsidios),
	proposicoes: many(proposicoes),
	verbas_indenizatorias: many(verbas_indenizatorias),
	processos_judiciais: many(processos_judiciais),
	comissao_membros: many(comissao_membros),
	diarias: many(diarias),
	municipio: one(municipios, {
		fields: [vereadores.id_municipio],
		references: [municipios.id_municipio]
	}),
	votos_camaras: many(votos_camara),
}));

export const classificadosRelations = relations(classificados, ({one}) => ({
	municipio: one(municipios, {
		fields: [classificados.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const caixa_disponivelRelations = relations(caixa_disponivel, ({one}) => ({
	municipio: one(municipios, {
		fields: [caixa_disponivel.id_municipio],
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

export const comercios_essenciaisRelations = relations(comercios_essenciais, ({one}) => ({
	municipio: one(municipios, {
		fields: [comercios_essenciais.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const atos_oficiaisRelations = relations(atos_oficiais, ({one, many}) => ({
	municipio: one(municipios, {
		fields: [atos_oficiais.id_municipio],
		references: [municipios.id_municipio]
	}),
	analises: many(analises),
	atos_oficiais_geos: many(atos_oficiais_geo),
	vicios_legislativos: many(vicios_legislativos),
}));

export const anunciosRelations = relations(anuncios, ({one}) => ({
	municipio: one(municipios, {
		fields: [anuncios.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const convenios_federaisRelations = relations(convenios_federais, ({one}) => ({
	municipio: one(municipios, {
		fields: [convenios_federais.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const despesasRelations = relations(despesas, ({one}) => ({
	municipio: one(municipios, {
		fields: [despesas.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const contatos_uteisRelations = relations(contatos_uteis, ({one}) => ({
	municipio: one(municipios, {
		fields: [contatos_uteis.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const doacoes_campanhaRelations = relations(doacoes_campanha, ({one}) => ({
	municipio: one(municipios, {
		fields: [doacoes_campanha.id_municipio],
		references: [municipios.id_municipio]
	}),
	vereadore: one(vereadores, {
		fields: [doacoes_campanha.vereador_id],
		references: [vereadores.id]
	}),
}));

export const emendasRelations = relations(emendas, ({one}) => ({
	municipio: one(municipios, {
		fields: [emendas.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const escolasRelations = relations(escolas, ({one}) => ({
	municipio: one(municipios, {
		fields: [escolas.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const farmacias_plantaoRelations = relations(farmacias_plantao, ({one}) => ({
	municipio: one(municipios, {
		fields: [farmacias_plantao.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const comissoesRelations = relations(comissoes, ({one, many}) => ({
	municipio: one(municipios, {
		fields: [comissoes.id_municipio],
		references: [municipios.id_municipio]
	}),
	comissao_membros: many(comissao_membros),
}));

export const folha_pagamentoRelations = relations(folha_pagamento, ({one}) => ({
	municipio: one(municipios, {
		fields: [folha_pagamento.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const contratosRelations = relations(contratos, ({one}) => ({
	municipio: one(municipios, {
		fields: [contratos.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const licitacoesRelations = relations(licitacoes, ({one}) => ({
	municipio: one(municipios, {
		fields: [licitacoes.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const meio_ambienteRelations = relations(meio_ambiente, ({one}) => ({
	municipio: one(municipios, {
		fields: [meio_ambiente.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const mortalidadeRelations = relations(mortalidade, ({one}) => ({
	municipio: one(municipios, {
		fields: [mortalidade.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const nota_transparenciaRelations = relations(nota_transparencia, ({one}) => ({
	municipio: one(municipios, {
		fields: [nota_transparencia.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const indicadoresRelations = relations(indicadores, ({one}) => ({
	municipio: one(municipios, {
		fields: [indicadores.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const noticiasRelations = relations(noticias, ({one}) => ({
	municipio: one(municipios, {
		fields: [noticias.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const obrasRelations = relations(obras, ({one}) => ({
	municipio: one(municipios, {
		fields: [obras.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const paraopeba_saldo_municipioRelations = relations(paraopeba_saldo_municipio, ({one}) => ({
	municipio: one(municipios, {
		fields: [paraopeba_saldo_municipio.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const pautas_atasRelations = relations(pautas_atas, ({one}) => ({
	municipio: one(municipios, {
		fields: [pautas_atas.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const pntpRelations = relations(pntp, ({one}) => ({
	municipio: one(municipios, {
		fields: [pntp.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const paraopeba_iniciativasRelations = relations(paraopeba_iniciativas, ({one}) => ({
	municipio: one(municipios, {
		fields: [paraopeba_iniciativas.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const grupos_economicosRelations = relations(grupos_economicos, ({one}) => ({
	municipio: one(municipios, {
		fields: [grupos_economicos.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const newsletter_inscritosRelations = relations(newsletter_inscritos, ({one}) => ({
	municipio: one(municipios, {
		fields: [newsletter_inscritos.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const receitasRelations = relations(receitas, ({one}) => ({
	municipio: one(municipios, {
		fields: [receitas.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const saude_estabelecimentosRelations = relations(saude_estabelecimentos, ({one}) => ({
	municipio: one(municipios, {
		fields: [saude_estabelecimentos.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const saude_internacoesRelations = relations(saude_internacoes, ({one}) => ({
	municipio: one(municipios, {
		fields: [saude_internacoes.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const saude_internacoes_cidRelations = relations(saude_internacoes_cid, ({one}) => ({
	municipio: one(municipios, {
		fields: [saude_internacoes_cid.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const seguidoresRelations = relations(seguidores, ({one}) => ({
	municipio: one(municipios, {
		fields: [seguidores.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const seguranca_ocorrenciasRelations = relations(seguranca_ocorrencias, ({one}) => ({
	municipio: one(municipios, {
		fields: [seguranca_ocorrencias.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const servidoresRelations = relations(servidores, ({one}) => ({
	municipio: one(municipios, {
		fields: [servidores.id_municipio],
		references: [municipios.id_municipio]
	}),
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

export const subsidiosRelations = relations(subsidios, ({one}) => ({
	municipio: one(municipios, {
		fields: [subsidios.id_municipio],
		references: [municipios.id_municipio]
	}),
	vereadore: one(vereadores, {
		fields: [subsidios.vereador_id],
		references: [vereadores.id]
	}),
}));

export const telegram_inscritosRelations = relations(telegram_inscritos, ({one}) => ({
	municipio: one(municipios, {
		fields: [telegram_inscritos.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const proposicoesRelations = relations(proposicoes, ({one, many}) => ({
	municipio: one(municipios, {
		fields: [proposicoes.id_municipio],
		references: [municipios.id_municipio]
	}),
	vereadore: one(vereadores, {
		fields: [proposicoes.vereador_id],
		references: [vereadores.id]
	}),
	votacoes_camaras: many(votacoes_camara),
	analises: many(analises),
	vicios_legislativos: many(vicios_legislativos),
}));

export const verbas_indenizatoriasRelations = relations(verbas_indenizatorias, ({one}) => ({
	municipio: one(municipios, {
		fields: [verbas_indenizatorias.id_municipio],
		references: [municipios.id_municipio]
	}),
	vereadore: one(vereadores, {
		fields: [verbas_indenizatorias.vereador_id],
		references: [vereadores.id]
	}),
}));

export const postos_anpRelations = relations(postos_anp, ({one}) => ({
	municipio: one(municipios, {
		fields: [postos_anp.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const processos_judiciaisRelations = relations(processos_judiciais, ({one}) => ({
	municipio: one(municipios, {
		fields: [processos_judiciais.id_municipio],
		references: [municipios.id_municipio]
	}),
	vereadore: one(vereadores, {
		fields: [processos_judiciais.vereador_id],
		references: [vereadores.id]
	}),
}));

export const producao_agropecuariaRelations = relations(producao_agropecuaria, ({one}) => ({
	municipio: one(municipios, {
		fields: [producao_agropecuaria.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const zap_estabelecimentosRelations = relations(zap_estabelecimentos, ({one}) => ({
	municipio: one(municipios, {
		fields: [zap_estabelecimentos.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const alertasInCongressoRelations = relations(alertasInCongresso, ({one}) => ({
	monitoramentosInCongresso: one(monitoramentosInCongresso, {
		fields: [alertasInCongresso.monitoramento_id],
		references: [monitoramentosInCongresso.id]
	}),
	proposicoesInCongresso: one(proposicoesInCongresso, {
		fields: [alertasInCongresso.proposicao_id],
		references: [proposicoesInCongresso.id]
	}),
}));

export const monitoramentosInCongressoRelations = relations(monitoramentosInCongresso, ({many}) => ({
	alertasInCongressos: many(alertasInCongresso),
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

export const comissao_membrosRelations = relations(comissao_membros, ({one}) => ({
	comissoe: one(comissoes, {
		fields: [comissao_membros.comissao_id],
		references: [comissoes.id]
	}),
	municipio: one(municipios, {
		fields: [comissao_membros.id_municipio],
		references: [municipios.id_municipio]
	}),
	vereadore: one(vereadores, {
		fields: [comissao_membros.vereador_id],
		references: [vereadores.id]
	}),
}));

export const votacoes_camaraRelations = relations(votacoes_camara, ({one, many}) => ({
	municipio: one(municipios, {
		fields: [votacoes_camara.id_municipio],
		references: [municipios.id_municipio]
	}),
	proposicoe: one(proposicoes, {
		fields: [votacoes_camara.proposicao_id],
		references: [proposicoes.id]
	}),
	votos_camaras: many(votos_camara),
}));

export const diariasRelations = relations(diarias, ({one}) => ({
	municipio: one(municipios, {
		fields: [diarias.id_municipio],
		references: [municipios.id_municipio]
	}),
	vereadore: one(vereadores, {
		fields: [diarias.vereador_id],
		references: [vereadores.id]
	}),
}));

export const analisesRelations = relations(analises, ({one, many}) => ({
	atos_oficiai: one(atos_oficiais, {
		fields: [analises.ato_id],
		references: [atos_oficiais.id]
	}),
	municipio: one(municipios, {
		fields: [analises.id_municipio],
		references: [municipios.id_municipio]
	}),
	proposicoe: one(proposicoes, {
		fields: [analises.proposicao_id],
		references: [proposicoes.id]
	}),
	analise_itens: many(analise_itens),
}));

export const analise_itensRelations = relations(analise_itens, ({one}) => ({
	analise: one(analises, {
		fields: [analise_itens.analise_id],
		references: [analises.id]
	}),
	municipio: one(municipios, {
		fields: [analise_itens.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const votos_camaraRelations = relations(votos_camara, ({one}) => ({
	municipio: one(municipios, {
		fields: [votos_camara.id_municipio],
		references: [municipios.id_municipio]
	}),
	vereadore: one(vereadores, {
		fields: [votos_camara.vereador_id],
		references: [vereadores.id]
	}),
	votacoes_camara: one(votacoes_camara, {
		fields: [votos_camara.votacao_id],
		references: [votacoes_camara.id]
	}),
}));

export const royalties_cfemRelations = relations(royalties_cfem, ({one}) => ({
	municipio: one(municipios, {
		fields: [royalties_cfem.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const royalties_cfem_empresasRelations = relations(royalties_cfem_empresas, ({one}) => ({
	municipio: one(municipios, {
		fields: [royalties_cfem_empresas.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const ibama_autos_infracaoRelations = relations(ibama_autos_infracao, ({one}) => ({
	municipio: one(municipios, {
		fields: [ibama_autos_infracao.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const ibama_embargosRelations = relations(ibama_embargos, ({one}) => ({
	municipio: one(municipios, {
		fields: [ibama_embargos.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const snisb_barragensRelations = relations(snisb_barragens, ({one}) => ({
	ref_municipios_mg: one(ref_municipios_mg, {
		fields: [snisb_barragens.id_municipio],
		references: [ref_municipios_mg.id_ibge]
	}),
}));

export const ref_municipios_mgRelations = relations(ref_municipios_mg, ({many}) => ({
	snisb_barragens: many(snisb_barragens),
	feam_barragens: many(feam_barragens),
	ambiental_licenciamentos: many(ambiental_licenciamento),
}));

export const cap_autos_infracaoRelations = relations(cap_autos_infracao, ({one}) => ({
	municipio: one(municipios, {
		fields: [cap_autos_infracao.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const feam_barragensRelations = relations(feam_barragens, ({one}) => ({
	ref_municipios_mg: one(ref_municipios_mg, {
		fields: [feam_barragens.id_municipio],
		references: [ref_municipios_mg.id_ibge]
	}),
}));

export const eventosInCongressoRelations = relations(eventosInCongresso, ({one, many}) => ({
	casasInCongresso: one(casasInCongresso, {
		fields: [eventosInCongresso.casa_id],
		references: [casasInCongresso.id]
	}),
	evento_pautaInCongressos: many(evento_pautaInCongresso),
}));

export const presencas_plenarioInCongressoRelations = relations(presencas_plenarioInCongresso, ({one}) => ({
	casasInCongresso: one(casasInCongresso, {
		fields: [presencas_plenarioInCongresso.casa_id],
		references: [casasInCongresso.id]
	}),
	parlamentaresInCongresso: one(parlamentaresInCongresso, {
		fields: [presencas_plenarioInCongresso.parlamentar_id],
		references: [parlamentaresInCongresso.id]
	}),
}));

export const atos_oficiais_geoRelations = relations(atos_oficiais_geo, ({one}) => ({
	atos_oficiai: one(atos_oficiais, {
		fields: [atos_oficiais_geo.ato_id],
		references: [atos_oficiais.id]
	}),
}));

export const copam_pauta_itensRelations = relations(copam_pauta_itens, ({one}) => ({
	copam_reunioe: one(copam_reunioes, {
		fields: [copam_pauta_itens.id_reuniao],
		references: [copam_reunioes.id]
	}),
}));

export const copam_reunioesRelations = relations(copam_reunioes, ({many}) => ({
	copam_pauta_itens: many(copam_pauta_itens),
}));

export const vicios_legislativosInCongressoRelations = relations(vicios_legislativosInCongresso, ({one, many}) => ({
	proposicoesInCongresso: one(proposicoesInCongresso, {
		fields: [vicios_legislativosInCongresso.proposicao_id],
		references: [proposicoesInCongresso.id]
	}),
	vicio_itensInCongressos: many(vicio_itensInCongresso),
}));

export const vicio_itensInCongressoRelations = relations(vicio_itensInCongresso, ({one}) => ({
	vicios_legislativosInCongresso: one(vicios_legislativosInCongresso, {
		fields: [vicio_itensInCongresso.vicio_id],
		references: [vicios_legislativosInCongresso.id]
	}),
}));

export const vicios_legislativosRelations = relations(vicios_legislativos, ({one, many}) => ({
	atos_oficiai: one(atos_oficiais, {
		fields: [vicios_legislativos.ato_id],
		references: [atos_oficiais.id]
	}),
	municipio: one(municipios, {
		fields: [vicios_legislativos.id_municipio],
		references: [municipios.id_municipio]
	}),
	proposicoe: one(proposicoes, {
		fields: [vicios_legislativos.proposicao_id],
		references: [proposicoes.id]
	}),
	vicio_itens: many(vicio_itens),
}));

export const vicio_itensRelations = relations(vicio_itens, ({one}) => ({
	municipio: one(municipios, {
		fields: [vicio_itens.id_municipio],
		references: [municipios.id_municipio]
	}),
	vicios_legislativo: one(vicios_legislativos, {
		fields: [vicio_itens.vicio_id],
		references: [vicios_legislativos.id]
	}),
}));

export const ambiental_licenciamentoRelations = relations(ambiental_licenciamento, ({one}) => ({
	ref_municipios_mg: one(ref_municipios_mg, {
		fields: [ambiental_licenciamento.id_municipio],
		references: [ref_municipios_mg.id_ibge]
	}),
}));

export const bancada_membrosInCongressoRelations = relations(bancada_membrosInCongresso, ({one}) => ({
	bancadasInCongresso: one(bancadasInCongresso, {
		fields: [bancada_membrosInCongresso.bancada_id],
		references: [bancadasInCongresso.id]
	}),
	parlamentaresInCongresso: one(parlamentaresInCongresso, {
		fields: [bancada_membrosInCongresso.parlamentar_id],
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

export const votosInCongressoRelations = relations(votosInCongresso, ({one}) => ({
	parlamentaresInCongresso: one(parlamentaresInCongresso, {
		fields: [votosInCongresso.parlamentar_id],
		references: [parlamentaresInCongresso.id]
	}),
	votacoesInCongresso: one(votacoesInCongresso, {
		fields: [votosInCongresso.votacao_id],
		references: [votacoesInCongresso.id]
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

export const proposicao_autoriaInCongressoRelations = relations(proposicao_autoriaInCongresso, ({one}) => ({
	parlamentaresInCongresso: one(parlamentaresInCongresso, {
		fields: [proposicao_autoriaInCongresso.parlamentar_id],
		references: [parlamentaresInCongresso.id]
	}),
	proposicoesInCongresso: one(proposicoesInCongresso, {
		fields: [proposicao_autoriaInCongresso.proposicao_id],
		references: [proposicoesInCongresso.id]
	}),
}));

export const vazio_municipioInTerrasRelations = relations(vazio_municipioInTerras, ({one}) => ({
	municipio: one(municipios, {
		fields: [vazio_municipioInTerras.id_municipio],
		references: [municipios.id_municipio]
	}),
}));

export const evento_pautaInCongressoRelations = relations(evento_pautaInCongresso, ({one}) => ({
	eventosInCongresso: one(eventosInCongresso, {
		fields: [evento_pautaInCongresso.evento_id],
		references: [eventosInCongresso.id]
	}),
	proposicoesInCongresso: one(proposicoesInCongresso, {
		fields: [evento_pautaInCongresso.proposicao_id],
		references: [proposicoesInCongresso.id]
	}),
}));