/**
 * Tipos e Categorias dos Conselhos Sociais e Colegiados Participativos.
 *
 * Mapeia todos os canais de controle social direto, desde comitês de bacia
 * e conselhos de meio ambiente até conselhos de direitos humanos, saúde e PCTs.
 */

export type CategoriaConselho =
  | "bacias_hidrograficas"        // Comitês de Bacias (CBH, CNRH, CERH)
  | "meio_ambiente"               // Meio Ambiente (CONAMA, COPAM, CONSEMA, CODEMA)
  | "unidades_conservacao"        // Conselhos de Parques, APAs e Mosaicos
  | "povos_tradicionais"          // Povos e Comunidades Tradicionais (CNPCT, CEPCT)
  | "direitos_humanos"            // Direitos Humanos e Memória (CNDH, CEDH, CMDH)
  | "saude"                       // Saúde e Saneamento Básico (CNS, CES, CMS)
  | "educacao_merenda"            // Educação e Alimentação Escolar (CNE, CEE, CME, CAE)
  | "assistencia_social"          // Assistência Social e Combate à Pobreza (CNAS, CEAS, CMAS)
  | "seguranca_alimentar"         // Segurança Alimentar e Nutricional (CONSEA)
  | "desenvolvimento_rural"       // Agricultura Familiar e Agroecologia (CONDRAF, CMDRS)
  | "crianca_adolescente"         // Criança e Adolescente (CONANDA, CEDCA, CMDCA, Conselhos Tutelares)
  | "pessoa_idosa"                // Direitos da Pessoa Idosa (CNDI, CEDI, CMDI)
  | "igualdade_racial"            // Igualdade Racial e Reparação (CNPIR, COMPIR)
  | "mulher"                      // Direitos da Mulher e Combate à Violência (CNDM, CMDM)
  | "cidade_habitacao"            // Habitação, REURB e Plano Diretor (Concidades, CMH)
  | "defesa_social"               // Segurança Comunitária e Prevenção (CONSEG)
  | "patrimonio_cultural";        // Patrimônio Histórico e Cultural (COMPAC, CONEP)

export type EsferaConselho = "federal" | "estadual" | "municipal" | "intermunicipal";

export interface ContatosConselho {
  telefone?: string;
  email?: string;
  siteOficial?: string;
  enderecoFisico?: string;
  reunioesPublicas?: string;
  linkAtas?: string;
  redesSociais?: {
    instagram?: string;
    youtube?: string;
    facebook?: string;
  };
  canalDenuncia?: string;
}

export interface RegistroConselho {
  id: string;                     // Slug único (ex: "cbh-velhas", "codema-diamantina")
  nome: string;                   // Nome oficial do conselho
  sigla: string;                  // Sigla amigável
  categoria: CategoriaConselho;
  esfera: EsferaConselho;
  municipioIbge?: string;         // Código IBGE se for de âmbito municipal
  municipioNome?: string;
  uf?: string;                    // "MG", "SP", "RJ", "ES", "BR"
  baciaHidrografica?: string;     // Nome da bacia se aplicável
  descricaoPapel: string;         // Em linguagem acessível: o que fiscaliza
  quemParticipa: string;          // Composição da sociedade civil e poder público
  contatos: ContatosConselho;
  tags: string[];
}
