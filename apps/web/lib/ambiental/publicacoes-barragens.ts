/**
 * Publicações acadêmicas por barragem/empreendimento — rodapé
 * “Para saber mais” (decisão 6 do dono, 23/09/2026).
 *
 * Estas linhas NÃO entram em `condicionantes` nem em status. Servem para
 * o leitor aprofundar com dissertação, tese, artigo ou relatório de
 * pesquisa. Condicionante estruturado continua vindo só de fonte oficial
 * (licença, TAC, CAP, parecer) — ver PLANO-CONDICIONANTES-AMBIENTAIS.md.
 *
 * Lógica pura (sem React, sem banco): filtro por empreendimento e
 * formatação ABNT-com hiperlink. Molde: `lib/ambiental/estudos.ts`.
 */

export interface PublicacaoAcademica {
  /** Chave estável do empreendimento — mesma grafia de `condicionantes.empreendimento`. */
  empreendimento: string;
  /** Autor(es) como a fonte publica. */
  autores: string;
  ano: number;
  titulo: string;
  /** Dissertação | Tese | Artigo | Relatório | Capítulo */
  tipo: string;
  /** Instituição ou periódico. */
  veiculo: string;
  /** URL direta do PDF ou do repositório (nunca home genérica). */
  url: string;
  /** O que este texto acrescenta ao leitor da página (1 frase). */
  nota: string;
}

/** Medido no lote de 23/09 (FONTES.md § Condicionantes). */
export const PUBLICACOES_BARRAGENS: readonly PublicacaoAcademica[] = [
  {
    empreendimento: "Irapé",
    autores: "ZUCARELLI, Marcos Cristiano",
    ano: 2007,
    titulo:
      "De Usina Irapé à Usina Presidente Juscelino Kubitschek: implicações da lógica desenvolvimentista nas práticas do licenciamento ambiental",
    tipo: "Artigo",
    veiculo: "ECSB 2007 (UFBA)",
    url: "http://www.ecsb2007.ufba.br/layout/padrao/azul/ecsb2007/arquivos_anteriores/st1_04.pdf",
    nota: "Confirma 47 condicionantes da LP de 10/12/1997 e o TAC de 2002.",
  },
  {
    empreendimento: "Irapé",
    autores: "ZUCARELLI, Marcos Cristiano",
    ano: 2006,
    titulo:
      "Estratégias de viabilização política da Usina de Irapé: o (des)cumprimento de normas e o ocultamento de conflitos no licenciamento ambiental de hidrelétricas",
    tipo: "Dissertação",
    veiculo: "FAFICH/UFMG",
    url: "https://conflitosambientaismg.lcc.ufmg.br/producao-academica/606-2",
    nota: "Análise do TAC e da negociação com os atingidos.",
  },
  {
    empreendimento: "Irapé",
    autores: "LESTINGI, Marcela Dadauto",
    ano: 2010,
    titulo:
      "A inserção dos custos sociais nos empreendimentos hidrelétricos: estudo de caso da UHE Irapé (MG)",
    tipo: "Dissertação",
    veiculo: "USP",
    url: "http://www.teses.usp.br/teses/disponiveis/86/86131/tde-04112010-135107/",
    nota: "Segue o TAC (depois Termo de Acordo) item a item com campo.",
  },
  {
    empreendimento: "Irapé",
    autores: "GESTA/UFMG (Zhouri et al.)",
    ano: 2006,
    titulo:
      "Relatório técnico sobre a qualidade da água do rio Jequitinhonha em trechos a jusante da Usina de Irapé",
    tipo: "Relatório",
    veiculo: "GESTA/UFMG",
    url: "https://conflitosambientaismg.lcc.ufmg.br/wp-content/uploads/2014/05/Relat%C3%B3rio-sobre-qualidade-da-%C3%A1gua-a-jusante-da-UHE-Irap%C3%A9-2006.pdf",
    nota: "Evidência de campo logo após a LO e o enchimento.",
  },
  {
    empreendimento: "Irapé",
    autores: "GESTA/UFMG",
    ano: 2011,
    titulo:
      "Relatório técnico: impactos da UHE Irapé para comunidades a jusante da barragem",
    tipo: "Relatório",
    veiculo: "GESTA/UFMG · ACP 2006.38.13.012165-7",
    url: "https://conflitosambientaismg.lcc.ufmg.br/wp-content/uploads/2014/05/Relat%C3%B3rio-sobre-qualidade-da-%C3%A1gua-a-jusante-da-UHE-Irap%C3%A9-2011.pdf",
    nota: "Responde à perícia da Ação Civil Pública federal.",
  },
  {
    empreendimento: "Irapé",
    autores: "BORGES, Roberto Ferreira et al. (CEMIG)",
    ano: 2016,
    titulo:
      "Ferramentas de gestão de projetos aplicadas ao gerenciamento de riscos sócio-ambientais — a experiência da CEMIG",
    tipo: "Artigo",
    veiculo: "CGTI",
    url: "https://www.cgti.org.br/publicacoes/wp-content/uploads/2016/04/FERRAMENTAS-DE-GESTA%CC%83O-DE-PROJETOS-APLICADAS-AO-GERENCIAMENTO-DE-RISCOS-SO%CC%81CIO-AMBIENTAIS-NA-IMPLANTAC%CC%A7A%CC%83O-DE-PROJETOS-DE-GERAC%CC%A7A%CC%83O-HIDRA%CC%81ULICA-A-EXPERIE%CC%82NCIA-DA-CEMIG.pdf",
    nota: "Resume os Anexos I–IV do Termo de Acordo de 07/07/2002.",
  },
  {
    empreendimento: "Setúbal",
    autores: "Assembleia Legislativa de Minas Gerais",
    ano: 2006,
    titulo:
      "Condicionantes da Licença Prévia da Barragem de Setúbal (36 itens) e deliberação do COPAM",
    tipo: "Notícia oficial",
    veiculo: "ALMG",
    url: "https://www.almg.gov.br/acompanhe/noticias/arquivos/2006/06/Not_590862.html",
    nota: "Única fonte pública que enumera a contagem das 36 condicionantes.",
  },
  {
    empreendimento: "Setúbal",
    autores: "Movimento dos Atingidos por Barragens (MAB)",
    ano: 2026,
    titulo:
      "Impactos socioambientais da Barragem de Setúbal pautam audiência pública",
    tipo: "Manifestação",
    veiculo: "ALMG / MAB",
    url: "https://www.almg.gov.br/comunicacao/noticias/arquivos/Impactos-socioambientais-da-Barragem-de-Setubal-pautam-audiencia-publica/",
    nota: "Denúncia de ausência de Licença de Operação há ~13 anos.",
  },
] as const;

/** Empreendimentos que já têm rodapé preenchido (ordem de aparição na tela). */
export function empreendimentosComPublicacoes(): string[] {
  const vistos = new Set<string>();
  const ordem: string[] = [];
  for (const p of PUBLICACOES_BARRAGENS) {
    if (!vistos.has(p.empreendimento)) {
      vistos.add(p.empreendimento);
      ordem.push(p.empreendimento);
    }
  }
  return ordem;
}

/** Publicações de um empreendimento, mais recentes primeiro. */
export function publicacoesDe(empreendimento: string): PublicacaoAcademica[] {
  return PUBLICACOES_BARRAGENS.filter((p) => p.empreendimento === empreendimento).sort(
    (a, b) => b.ano - a.ano || a.autores.localeCompare(b.autores, "pt-BR"),
  );
}

/**
 * Referência ABNT curta com hiperlink — o rótulo que a tela mostra.
 * Ex.: "ZUCARELLI, Marcos Cristiano. De Usina Irapé… (ECSB 2007, 2007)."
 */
export function referenciaAbnt(p: PublicacaoAcademica): string {
  return `${p.autores}. ${p.titulo}. ${p.veiculo}, ${p.ano}.`;
}
