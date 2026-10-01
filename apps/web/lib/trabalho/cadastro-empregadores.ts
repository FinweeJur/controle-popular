/**
 * @file apps/web/lib/trabalho/cadastro-empregadores.ts
 * @description Tipos e rótulos do Cadastro de Empregadores do MTE (a "lista suja"
 * do trabalho escravo contemporâneo) — empregadores PESSOA JURÍDICA.
 *
 * Papel no portal:
 * Publica as empresas (CNPJ) incluídas pelo Ministério do Trabalho e Emprego no
 * Cadastro de Empregadores que submeteram trabalhadores a condições análogas à
 * escravidão, com o ato administrativo que gerou a inclusão e o link externo
 * para conferir contratos públicos daquele CNPJ.
 *
 * ═══ O QUE ESTE DADO É, E O QUE NÃO É (AGENTS §7) ═══
 * A inclusão no Cadastro é ATO ADMINISTRATIVO do MTE (Portaria Interministerial
 * MTE/MDHC/MIR nº 18/2024), com direito a defesa e possibilidade de exclusão
 * posterior por decisão judicial. O portal republica o ato oficial, com a data:
 * não acusa nem conclui. A conferência é sempre na fonte.
 * Empregadores pessoa FÍSICA (CPF) são contados e omitidos do acervo por
 * proteção de dado pessoal — ver `scripts/etl/trabalho/coletar-lista-suja-mte.py`.
 *
 * CLIENT-SAFE: não lê arquivo. A leitura mora em
 * `lib/server-only/dados-cadastro-empregadores.ts`.
 */

export interface RegistroCadastroEmpregadores extends Record<string, unknown> {
  id: number;
  ano_acao_fiscal: string;
  uf: string;
  empregador: string;
  cnpj: string;
  estabelecimento: string;
  municipio: string;
  trabalhadores_envolvidos: number | null;
  cnae: string;
  decisao_administrativa: string;
  inclusao_cadastro: string;
}

export interface AcervoCadastroEmpregadores {
  fonte: string;
  url_fonte: string;
  url_pagina: string;
  atualizado_em: string;
  metodologia: string;
  total_registros: number;
  total_empresas: number;
  total_ufs: number;
  trabalhadores_envolvidos_total: number;
  empregadores_pessoa_fisica_omitidos: number;
  registros: RegistroCadastroEmpregadores[];
}
