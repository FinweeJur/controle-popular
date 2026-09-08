/**
 * apps/web/lib/eixos/catalogo.ts
 *
 * Catálogo canônico dos 3 Eixos Temáticos e suas 18 subfrentes.
 * Inclui mapeamento de rotas legadas para compatibilidade guarda-chuva.
 */

import type { Eixo, EixoId, Subfrente, SubfrenteId } from './types';

export const CATALOGO_EIXOS: Record<EixoId, Eixo> = {
  direitos: {
    id: 'direitos',
    titulo: 'Direitos em Movimento',
    subtitulo: 'Garantias fundamentais, serviços essenciais e justiça social',
    descricao:
      'Monitoramento de saúde pública, educação, renda, segurança alimentar, moradia e canais populares de denúncia e acesso à justiça.',
    corVar: '--cp-eixo-direitos',
    corInkVar: '--cp-eixo-direitos-ink',
    subfrentes: [
      {
        id: 'trabalho-e-renda',
        eixoId: 'direitos',
        titulo: 'Trabalho e Renda',
        descricao: 'Emprego formal, admissões CAGED, estoques RAIS e impacto de contratos públicos na economia local.',
        slug: 'trabalho-e-renda',
        icone: 'Briefcase',
        tagsRelacionadas: ['trabalho', 'renda', 'caged', 'rais', 'salario', 'emprego'],
      },
      {
        id: 'saude-publica',
        eixoId: 'direitos',
        titulo: 'Saúde Pública',
        descricao: 'Capacidade instalada do SUS, estabelecimentos CNES, razão habitante/leito e internações SIH.',
        slug: 'saude-publica',
        icone: 'HeartPulse',
        tagsRelacionadas: ['saude', 'sus', 'cnes', 'leitos', 'hospitais', 'atendimento'],
      },
      {
        id: 'educacao',
        eixoId: 'direitos',
        titulo: 'Educação',
        descricao: 'Infraestrutura escolar, matrículas do Censo Escolar e indicadores de qualidade IDEB por município.',
        slug: 'educacao',
        icone: 'GraduationCap',
        tagsRelacionadas: ['educacao', 'escolas', 'ideb', 'inep', 'ensino', 'matriculas'],
      },
      {
        id: 'seguranca-alimentar',
        eixoId: 'direitos',
        titulo: 'Segurança Alimentar',
        descricao: 'Programas de transferência, vulnerabilidade nutricional e agricultura familiar.',
        slug: 'seguranca-alimentar',
        icone: 'Apple',
        tagsRelacionadas: ['alimentacao', 'bolsa-familia', 'vulnerabilidade', 'nutricao'],
      },
      {
        id: 'moradia',
        eixoId: 'direitos',
        titulo: 'Moradia e Habitação',
        descricao: 'Déficit habitacional, regularização fundiária urbana e prevenção a remoções forçadas.',
        slug: 'moradia',
        icone: 'Home',
        tagsRelacionadas: ['moradia', 'habitacao', 'remocoes', 'regularizacao'],
      },
      {
        id: 'acesso-a-justica',
        eixoId: 'direitos',
        titulo: 'Acesso à Justiça e Denúncias',
        descricao: 'Defensoria Pública, canais de denúncia popular e assistência jurídica comunitária.',
        slug: 'acesso-a-justica',
        icone: 'Scale',
        tagsRelacionadas: ['justica', 'defensoria', 'denuncia', 'direitos-humanos'],
        rotaLegada: '/direitos-em-movimento',
      },
    ],
  },
  terra: {
    id: 'terra',
    titulo: 'Terra e Territórios',
    subtitulo: 'Soberania socioambiental, cidades e defesa dos biomas',
    descricao:
      'Fiscalização de 199 cidades estratégicas, bacias hidrográficas, licenciamento ONSA, terras indígenas e unidades de conservação.',
    corVar: '--cp-eixo-terra',
    corInkVar: '--cp-eixo-terra-ink',
    subfrentes: [
      {
        id: 'cidades',
        eixoId: 'terra',
        titulo: '199 Cidades Estratégicas',
        descricao: 'Rede de fiscalização municipal em 27 capitais e 172 polos regionais do interior do Brasil.',
        slug: 'cidades',
        icone: 'Building2',
        tagsRelacionadas: ['cidades', 'municipios', 'interior', 'capitais', 'ibge'],
        rotaLegada: '/cidades',
      },
      {
        id: 'meio-ambiente',
        eixoId: 'terra',
        titulo: 'Meio Ambiente (ONSA)',
        descricao: 'Observatório Nacional Socioambiental: licenciamento, pauta do COPAM, TACs e barragens SIGBM.',
        slug: 'meio-ambiente',
        icone: 'Trees',
        tagsRelacionadas: ['meio-ambiente', 'onsa', 'copam', 'licenciamento', 'ibama', 'barragens'],
        rotaLegada: '/ambiental',
      },
      {
        id: 'terras-indigenas-quilombolas',
        eixoId: 'terra',
        titulo: 'Terras Indígenas e Quilombolas',
        descricao: 'Monitoramento de demarcações, sobreposições de mineração e defesa de povos originários.',
        slug: 'terras-indigenas-quilombolas',
        icone: 'Shield',
        tagsRelacionadas: ['indigenas', 'quilombolas', 'demarcacao', 'funai', 'incra'],
        rotaLegada: '/funcaosocialterra',
      },
      {
        id: 'nossas-serras',
        eixoId: 'terra',
        titulo: 'Nossas Serras',
        descricao: 'Preservação de topos de morro, patrimônio geológico e contenção da expansão minerária predatória.',
        slug: 'nossas-serras',
        icone: 'Mountain',
        tagsRelacionadas: ['serras', 'mineracao', 'relevo', 'geologia'],
      },
      {
        id: 'nossos-rios',
        eixoId: 'terra',
        titulo: 'Nossos Rios e Bacias',
        descricao: 'Qualidade das águas, monitoramento de desastres (Rio Doce, Paraopeba) e saneamento básico.',
        slug: 'nossos-rios',
        icone: 'Waves',
        tagsRelacionadas: ['rios', 'bacias', 'paraopeba', 'mariana', 'saneamento', 'agua'],
        rotaLegada: '/paraopeba',
      },
      {
        id: 'biomas',
        eixoId: 'terra',
        titulo: 'Biomas e Biodiversidade',
        descricao: 'Cerrado, Mata Atlântica, Caatinga e Amazônia: índices de risco climático e áreas de preservação.',
        slug: 'biomas',
        icone: 'Compass',
        tagsRelacionadas: ['biomas', 'cerrado', 'mata-atlantica', 'clima', 'adaptabrasil'],
      },
    ],
  },
  estado: {
    id: 'estado',
    titulo: 'Estado e Economia',
    subtitulo: 'Transparência institucional, orçamento público e poder econômico',
    descricao:
      'Vigilância de contratos municipais e federais, compras públicas, composição do Judiciário e votações no Congresso.',
    corVar: '--cp-eixo-estado',
    corInkVar: '--cp-eixo-estado-ink',
    subfrentes: [
      {
        id: 'judiciario',
        eixoId: 'estado',
        titulo: 'Judiciário e Justiça',
        descricao: 'Composição de tribunais, vagas, remunerações, inspeções do CNJ e processos ambientais SIRENEJud.',
        slug: 'judiciario',
        icone: 'Gavel',
        tagsRelacionadas: ['judiciario', 'tribunais', 'cnj', 'sirenejud', 'magistrados'],
        rotaLegada: '/judiciario',
      },
      {
        id: 'congresso',
        eixoId: 'estado',
        titulo: 'Congresso e Legislação',
        descricao: 'Proposições legislativas, votações nominais, comissões temáticas e bancadas estaduais.',
        slug: 'congresso',
        icone: 'Landmark',
        tagsRelacionadas: ['congresso', 'camara', 'senado', 'deputados', 'leis', 'votacoes'],
        rotaLegada: '/congresso',
      },
      {
        id: 'executivo',
        eixoId: 'estado',
        titulo: 'Executivo e Políticas',
        descricao: 'Atos oficiais, diários municipais, nomeações e execução direta de programas de governo.',
        slug: 'executivo',
        icone: 'ScrollText',
        tagsRelacionadas: ['executivo', 'prefeitura', 'diario-oficial', 'decretos'],
      },
      {
        id: 'empresas',
        eixoId: 'estado',
        titulo: 'Empresas e Mercado',
        descricao: 'Relação de sócios, grandes conglomerados, concentração de fornecedores e observatório de mineradoras.',
        slug: 'empresas',
        icone: 'Building',
        tagsRelacionadas: ['empresas', 'fornecedores', 'contratos', 'socios', 'vale'],
        rotaLegada: '/empresas',
      },
      {
        id: 'orcamento',
        eixoId: 'estado',
        titulo: 'Orçamento Público',
        descricao: 'Dotação vs. execução financeira, transferências constitucionais e indicadores macroeconômicos BCB.',
        slug: 'orcamento',
        icone: 'Coins',
        tagsRelacionadas: ['orcamento', 'financas', 'gastos', 'receitas', 'bcb', 'ipca'],
      },
      {
        id: 'transparencia',
        eixoId: 'estado',
        titulo: 'Transparência e Controle Social',
        descricao: 'Pedidos de Lei de Acesso à Informação (LAI), alertas de auditoria do TCU e fiscalização cidadã.',
        slug: 'transparencia',
        icone: 'Eye',
        tagsRelacionadas: ['transparencia', 'lai', 'tcu', 'controle-social', 'auditoria'],
      },
    ],
  },
};

export function obterEixo(id: EixoId): Eixo {
  return CATALOGO_EIXOS[id];
}

export function listarTodosEixos(): Eixo[] {
  return Object.values(CATALOGO_EIXOS);
}

export function buscarSubfrente(id: SubfrenteId): Subfrente | undefined {
  for (const eixo of Object.values(CATALOGO_EIXOS)) {
    const encontrada = eixo.subfrentes.find((s) => s.id === id);
    if (encontrada) return encontrada;
  }
  return undefined;
}
