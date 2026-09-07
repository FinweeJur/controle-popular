import { DocumentoItem } from "@/app/components/DocumentosRelacionados";

/**
 * Gera conjunto padronizado de documentos oficiais e hiperlinks para as 199 Cidades Estratégicas.
 */
export function obterDocumentosCidade(
  nome: string,
  uf: string,
  ibge: string,
  slug: string
): DocumentoItem[] {
  const ufUpper = uf.toUpperCase();

  return [
    {
      titulo: `Contratos e Compras no PNCP — ${nome}/${ufUpper}`,
      descricao: `Contratos públicos, editais de licitação e compras registradas no Portal Nacional de Contratações Públicas (Lei 14.133/2021).`,
      url: `https://pncp.gov.br/app/editais?q=${encodeURIComponent(nome)}&uf=${ufUpper}&status=recebendo_proposta`,
      tipo: "oficial",
      orgao: "PNCP Federal",
      formato: "Dados Abertos",
    },
    {
      titulo: `Rede de Saúde e Leitos SUS (CNES/DATASUS) — ${nome}`,
      descricao: `Cadastro Nacional de Estabelecimentos de Saúde, total de leitos públicos e distribuição de profissionais pelo código IBGE ${ibge}.`,
      url: `https://cnes.datasus.gov.br/pages/estabelecimentos/consulta.jsp`,
      tipo: "dados",
      orgao: "Ministério da Saúde",
      formato: "Tabela Oficial",
    },
    {
      titulo: `Repasses da União via ComunicaBR — ${nome}/${ufUpper}`,
      descricao: `Valores recebidos pelo município em transferências de Bolsa Família, SUS, Fundeb, BPC e piso da enfermagem.`,
      url: `/dados/comunicabr`,
      tipo: "noticia",
      orgao: "Governo Federal",
      formato: "Painel Cívico",
    },
    {
      titulo: `Indicadores Educacionais e Censo Escolar (INEP) — ${nome}`,
      descricao: `Notas do IDEB, número de matrículas na rede municipal e infraestrutura escolar auditada.`,
      url: `/direitos-em-movimento/educacao`,
      tipo: "estudo",
      orgao: "INEP / MEC",
      formato: "Relatório",
    },
    {
      titulo: `Panorama Demográfico e PIB Municipal (IBGE Cidades)`,
      descricao: `População do Censo, arrecadação tributária per capita e Produto Interno Bruto oficial do município.`,
      url: `https://cidades.ibge.gov.br/brasil/${uf.toLowerCase()}/${slug}/panorama`,
      tipo: "oficial",
      orgao: "IBGE",
      formato: "Estatística",
    },
    {
      titulo: `Canal de Denúncia Cidadã e Modelo de Ofício LAI`,
      descricao: `Instruções para requisição de informações à Prefeitura de ${nome} e envio de denúncia ao Ministério Público.`,
      url: `/direitos-em-movimento/denuncia`,
      tipo: "legislacao",
      orgao: "Controle Popular",
      formato: "DOCX / PDF",
    },
  ];
}
