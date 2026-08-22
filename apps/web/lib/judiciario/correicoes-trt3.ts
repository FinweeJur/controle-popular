/**
 * Atas de correição ordinária no TRT da 3ª Região (Minas Gerais), 1991–2024.
 * ARQUIVO GERADO por `scripts/gerar-transparencia-justica.mts`.
 *
 * ⚠️ **QUEM CORREICIONA TRT NÃO É O CNJ.** É a Corregedoria-Geral da Justiça
 * do Trabalho, órgão do TST — e o documento chama-se **ata de correição**, não
 * relatório de inspeção. Por isso procurar no CNJ, ou no site do próprio
 * TRT-3, não acha: a fonte é o Liferay do TST.
 *
 * ⚠️ **NÃO SOMAR COM O ACERVO DO CNJ.** São gêneros distintos: o relatório do
 * CNJ traz achado por unidade; a ata da CGJT é outro documento, com outra
 * estrutura. Um número que junte os dois não significa nada.
 *
 * ⚠️ **É PISO, NÃO TOTAL.** Não há rota de enumeração: o acervo saiu de
 * raspagem de 19 páginas de gestão de Ministro Corregedor-Geral, e o TST pode
 * ter reformulado o histórico anterior a 1991 sem deixar sinal.
 */

export interface AtaCorreicao {
  ano: number;
  periodo: string;
  assinadaEm: string;
  corregedor: string;
  url: string;
  megabytes: number;
}

export const COBERTURA_TRT3 = {
  extraidoEm: "2026-08-22",
  orgaoQueLavra: "Corregedoria-Geral da Justiça do Trabalho (TST)",
  fonte: "https://www.tst.jus.br/web/corregedoria/correicoes-anteriores",
  atas: 18,
  anoMaisAntigo: 1991,
  anoMaisRecente: 2024,
  maiorVaoAnos: 4,
  maiorVaoDe: 1995,
  maiorVaoAte: 1999,
  proximaCorreicao: "05 a 09/10/2026 (edital publicado, ata ainda não existe)",
  gestoesSemCorreicao: [
 {
  "ministro": "Vantuil Abdala",
  "periodo_gestao": "25/06/2001 a 10/04/2002",
  "regioes_corrigidas": "12,16,22,19,20 -- sem 3"
 },
 {
  "ministro": "Almir Pazzianoto Pinto",
  "periodo_gestao": "02/08/1996 a 03/08/1998",
  "regioes_corrigidas": "13,5,9,18 -- sem 3 (lista pode estar truncada na página)"
 }
],
} as const;

export const ATAS_TRT3: AtaCorreicao[] = [
 {
  "ano": 2024,
  "periodo": "5 a 9/2/2024",
  "assinadaEm": "19/2/2024",
  "corregedor": "Dora Maria da Costa",
  "url": "https://www.tst.jus.br/documents/24638414/31246729/Ata+TRT3.pdf/c34ac98a-89c9-af28-8b50-304cfe658960?t=1708113525770",
  "megabytes": 18.4
 },
 {
  "ano": 2022,
  "periodo": "6 a 10/06/2022",
  "assinadaEm": "14/06/2022",
  "corregedor": "Guilherme Augusto Caputo Bastos",
  "url": "https://www.tst.jus.br/documents/24638414/30799401/Ata+TRT+da+3%C2%AA+Regi%C3%A3o.++Assinada.pdf/c33789fd-37ac-2292-1853-95acd0847ee3?t=1655501430597",
  "megabytes": 3.3
 },
 {
  "ano": 2021,
  "periodo": "10 a 14/05/2021",
  "assinadaEm": "17/05/2021",
  "corregedor": "Aloysio Corrêa da Veiga",
  "url": "https://tst.jus.br/documents/24638414/25124389/1.+Ata+TRT3+assinada.pdf/b404540d-d615-ca3d-9569-62caea78895d?t=1621332897713",
  "megabytes": 2.3
 },
 {
  "ano": 2019,
  "periodo": "27 a 31/05/2019",
  "assinadaEm": "03/06/2019",
  "corregedor": "Lelio Bentes Corrêa",
  "url": "https://www.tst.jus.br/documents/24638414/24671606/15+-+ATA+TRT3.pdf/8854c2c7-c7c4-4d10-7191-fd45aa17c737",
  "megabytes": 7
 },
 {
  "ano": 2017,
  "periodo": "15/05 a 19/05/2017",
  "assinadaEm": "26/05/2017",
  "corregedor": "Renato de Lacerda Paiva",
  "url": "https://www.tst.jus.br/documents/24638414/24689367/Ata+TRT3.pdf/271e29c1-252c-a87f-c13b-b16c8ba179c0",
  "megabytes": 0.5
 },
 {
  "ano": 2015,
  "periodo": "9 a 13/2/2015",
  "assinadaEm": "23/2/2015",
  "corregedor": "João Batista Brito Pereira",
  "url": "https://www.tst.jus.br/documents/24638414/24694365/Ata+TRT+3%C2%AA+Regi%C3%A3o.pdf/c32cff7a-b238-92e1-4634-225bd6ab7b76",
  "megabytes": 3.8
 },
 {
  "ano": 2013,
  "periodo": "01 a 05/07/2013",
  "assinadaEm": "10/07/2013",
  "corregedor": "Ives Gandra da Silva Martins Filho",
  "url": "https://www.tst.jus.br/documents/24638414/24693778/Ata+de+Correi%C3%A7%C3%A3o+Ordin%C3%A1ria+TRT+-+3%C2%AA+Regi%C3%A3o.pdf/db3231bf-b261-06a0-cf1c-3aecd1eea847",
  "megabytes": 10.7
 },
 {
  "ano": 2012,
  "periodo": "27/2 a 2/3/2012",
  "assinadaEm": "16/4/2012",
  "corregedor": "Antônio José Barros Levenhagen",
  "url": "https://www.tst.jus.br/documents/24638414/24692018/TRT+3%C2%AA+Regi%C3%A3o+-+27.2+a+2.3.2012+-+Ministro+Barros+Levenhagen.pdf/a8244f4d-0b15-6bfd-a51c-854612219edf",
  "megabytes": 4
 },
 {
  "ano": 2009,
  "periodo": "9 a 13/11/2009",
  "assinadaEm": "4/2/2010",
  "corregedor": "Carlos Alberto Reis de Paula",
  "url": "https://www.tst.jus.br/documents/24638414/24692755/ATA03-11.pdf/50d037bc-e0ec-9f2d-6094-803c9acdc68e",
  "megabytes": 0.3
 },
 {
  "ano": 2008,
  "periodo": "16 a 20/6/2008",
  "assinadaEm": "14/7/2008",
  "corregedor": "João Oreste Dalazen",
  "url": "https://www.tst.jus.br/documents/24638414/24694983/ATA+03-06.pdf/3257a419-49e4-e091-e748-18f7e3c74d9e",
  "megabytes": 0.4
 },
 {
  "ano": 2006,
  "periodo": "29/5 a 2/6/2006",
  "assinadaEm": "21/8/2006",
  "corregedor": "José Luciano de Castilho Pereira",
  "url": "https://www.tst.jus.br/documents/24638414/24696316/ATA03-06.pdf/8b3673b2-6d57-86c4-2eeb-07c857e44450",
  "megabytes": 0.1
 },
 {
  "ano": 2005,
  "periodo": "26 a 30/9/2005",
  "assinadaEm": "14/11/2005",
  "corregedor": "Rider Nogueira de Brito",
  "url": "https://www.tst.jus.br/documents/24638414/24689962/ATA03-09.pdf/6f2db8ca-725c-25c4-9edc-7a7b574d8666",
  "megabytes": 0
 },
 {
  "ano": 2003,
  "periodo": "10 a 14/11/2003",
  "assinadaEm": "6/4/2004",
  "corregedor": "Ronaldo Lopes Leal",
  "url": "https://www.tst.jus.br/documents/24638414/24690567/TRT+3%C2%AA+-+10+a+14.11.2003+-+Ministro+Ronaldo+Lopes+Leal.pdf/c87541f6-15e7-3836-0086-ef5c93f59e02",
  "megabytes": 5.3
 },
 {
  "ano": 2001,
  "periodo": "2 a 5/4/2001",
  "assinadaEm": "26/10/2001",
  "corregedor": "Francisco Fausto Paula de Medeiros",
  "url": "https://www.tst.jus.br/documents/24638414/24693440/TRT-3+-+2+a+5.4.2001+-+Min.+Francisco+Fausto.pdf/87d66fa6-c5cf-9e81-028f-b0a2be52dea4",
  "megabytes": 12.6
 },
 {
  "ano": 1999,
  "periodo": "12 a 16/4/1999",
  "assinadaEm": "5/5/1999",
  "corregedor": "Ursulino Santos Filho",
  "url": "https://www.tst.jus.br/documents/24638414/24691256/TRT+3%C2%AA+Regi%C3%A3o+-+Min.+Ursulino+Santos+-+12+a+16.4.1999.pdf/e5f41eac-1394-2047-56ed-a47695aaccc7",
  "megabytes": 17.2
 },
 {
  "ano": 1995,
  "periodo": "3 a 6/4/1995",
  "assinadaEm": "14/6/1995",
  "corregedor": "Wagner Antônio Pimenta",
  "url": "https://www.tst.jus.br/documents/24638414/24691610/TRT+-+3+-+3+a+6.4.1995+-+Ministro+Wagner+Pimenta.pdf/34f80319-1781-1fef-503c-b82bfaf1e9bb",
  "megabytes": 4.7
 },
 {
  "ano": 1992,
  "periodo": "3 a 7/8/1992",
  "assinadaEm": "18/8/1992",
  "corregedor": "José Ajuricaba da Costa e Silva",
  "url": "https://www.tst.jus.br/documents/24638414/24695888/TRT+3+DE+3+a+07+de+agosto+de+1992.pdf/373ac1f7-ca81-5ca3-61f8-0c7aa8a5e12f",
  "megabytes": 1.5
 },
 {
  "ano": 1991,
  "periodo": "24 a 28/6/1991",
  "assinadaEm": "8/7/1991",
  "corregedor": "José Ajuricaba da Costa e Silva",
  "url": "https://www.tst.jus.br/documents/24638414/24695888/Ata+TRT-3+-+de++24+a+28.6.1991+-+Ministro+Jos%C3%A9+Ajuricaba+da+Costa+e+Silv.pdf/ec0cc059-c730-5efd-1128-89ece9eaa798",
  "megabytes": 1.9
 }
];
