/**
 * Barragens a montante em processo de descaracterização, acompanhadas pelo
 * MPMG (projeto "Desativando Bombas-relógio", Caoma). ARQUIVO GERADO — não
 * editar à mão.
 *
 * Fonte dos dados: `etl/betim/dados/barragens-mpmg.json`, escrito por
 * `scripts/coletar-barragens-mpmg.mts` a partir de
 * `barragens.mpmg.mp.br/wp-json/wp/v2/posts` (REST do WordPress, 200, os 45
 * de uma vez). O array abaixo é a mesma lista, colada aqui como literal TS —
 * mesma convenção de `decisoes-cge.ts` e `tac-gtac.ts` — porque a fonte de 45
 * registros é pequena o bastante para não precisar de import cruzando a
 * fronteira do pacote `apps/web`. Editar aqui é editar às cegas: mudar o dado
 * é rodar o coletor de novo e colar o resultado.
 *
 * ═══ AS TRÊS ARMADILHAS JÁ MEDIDAS NESTE CORPUS (ver `docs/FONTES.md`) ═══
 *
 * 1. **21 das 45 já estão 100% concluídas; o resto tem prazo até 2030+.**
 *    Empilhar as 45 num "total de barragens em descaracterização" sem separar
 *    as concluídas faria uma vitória parecer um problema em aberto do mesmo
 *    tamanho.
 * 2. **5 sem município reconhecido** (Igarapé ×2, Araxá, Fortaleza de Minas,
 *    Nazareno) — a lacuna é do DICIONÁRIO usado para casar texto bruto com o
 *    cadastro de municípios de MG, não da fonte: os nomes aparecem, só não
 *    bateram. `municipioBruto` preserva o texto original nesses 5 casos.
 * 3. **"Andamento" às vezes é percentual, às vezes é frase de estado**
 *    ("Aguarda o início das obras"). Os dois campos convivem
 *    (`andamentoPercentual` e `andamentoTexto`); nenhuma tela deste portal
 *    força a frase a virar um número.
 *
 * Dois avisos adicionais, específicos de registros individuais — não
 * "corrigidos" aqui de propósito, porque isto é o que a fonte publicou:
 *
 * - `id 284` (Barragem de Germano) descreve DOIS volumes no texto ("130
 *   milhões de m³ / 15 milhões de m³"); `volumeMilM3` guarda só o primeiro
 *   número — é a limitação do extrator, não uma correção deste portal.
 * - `id 203` (Barragem de Rejeitos) tem uma marca de raspagem colada no meio
 *   do texto de previsão (CSS de um ícone que vazou para o campo). Mostrado
 *   como veio — não é este portal reescrevendo a fonte.
 */

export interface BarragemMpmg {
  id: number;
  nome: string;
  /** `null` só quando o texto bruto não bateu com o dicionário de municípios de MG — ver `municipioBruto`. */
  municipio: string | null;
  /** Preenchido apenas quando `municipio` é `null`: o texto como a fonte publicou. */
  municipioBruto: string | null;
  uf: string;
  empreendedor: string;
  /** `null` em 7 dos 45 — a fonte não publicou volume para esses registros. */
  volumeMilM3: number | null;
  /** Texto original da fonte, com a unidade por extenso — nunca recalculado. */
  volumeTexto: string | null;
  /** Texto livre da fonte: data, "concluída", ou frase de estado. */
  previsaoDescaracterizacao: string;
  /** `null` quando a fonte só publicou frase de estado (ver `andamentoTexto`). */
  andamentoPercentual: number | null;
  andamentoTexto: string | null;
  link: string;
  /** ISO, sem timezone — como a API do WordPress publica. */
  atualizadoEm: string;
}

export const BARRAGENS_MPMG: BarragemMpmg[] = [
  {"id":196,"nome":"Baixo João Pereira","municipio":"Congonhas","municipioBruto":null,"uf":"MG","empreendedor":"Vale S.A.","volumeMilM3":null,"volumeTexto":null,"previsaoDescaracterizacao":"100% concluída","andamentoPercentual":100,"andamentoTexto":"100%","link":"https://barragens.mpmg.mp.br/baixo-joao-pereira/","atualizadoEm":"2024-02-13T10:51:44"},
  {"id":315,"nome":"Barragem 5MAC","municipio":"Nova Lima","municipioBruto":null,"uf":"MG","empreendedor":"Vale S.A.","volumeMilM3":12137,"volumeTexto":"12,137 milhões de m³","previsaoDescaracterizacao":"100% concluída","andamentoPercentual":100,"andamentoTexto":"100%","link":"https://barragens.mpmg.mp.br/barragem-5mac/","atualizadoEm":"2024-02-13T14:49:01"},
  {"id":373,"nome":"Barragem ARB1","municipio":"Poços de Caldas","municipioBruto":null,"uf":"MG","empreendedor":"Alcoa Alumínio S.A.","volumeMilM3":840,"volumeTexto":"840 mil m³","previsaoDescaracterizacao":"03/2027","andamentoPercentual":86,"andamentoTexto":"86%","link":"https://barragens.mpmg.mp.br/barragem-arb1/","atualizadoEm":"2024-02-13T15:09:57"},
  {"id":378,"nome":"Barragem ARB3","municipio":"Poços de Caldas","municipioBruto":null,"uf":"MG","empreendedor":"Alcoa Alumínio S.A.","volumeMilM3":1800,"volumeTexto":"1,800 milhão de m³","previsaoDescaracterizacao":"09/2029","andamentoPercentual":57,"andamentoTexto":"57%","link":"https://barragens.mpmg.mp.br/barragem-arb3/","atualizadoEm":"2024-02-13T15:11:07"},
  {"id":383,"nome":"Barragem ARB6","municipio":"Poços de Caldas","municipioBruto":null,"uf":"MG","empreendedor":"Alcoa Alumínio S.A.","volumeMilM3":1000,"volumeTexto":"1 milhão de m³","previsaoDescaracterizacao":"09/2026","andamentoPercentual":95,"andamentoTexto":"95%","link":"https://barragens.mpmg.mp.br/barragem-arb6/","atualizadoEm":"2024-02-13T15:12:03"},
  {"id":388,"nome":"Barragem ARB7","municipio":"Poços de Caldas","municipioBruto":null,"uf":"MG","empreendedor":"Alcoa Alumínio S.A.","volumeMilM3":1000,"volumeTexto":"1 milhão de m³","previsaoDescaracterizacao":"05 /2029","andamentoPercentual":60,"andamentoTexto":"60%","link":"https://barragens.mpmg.mp.br/barragem-arb7/","atualizadoEm":"2024-02-13T15:12:58"},
  {"id":364,"nome":"Barragem Área IX","municipio":"Ouro Preto","municipioBruto":null,"uf":"MG","empreendedor":"Vale S.A.","volumeMilM3":639.8,"volumeTexto":"639,8 mil m³","previsaoDescaracterizacao":"jun de 2025","andamentoPercentual":100,"andamentoTexto":"100% Aguarda anuência dos órgãos competentes","link":"https://barragens.mpmg.mp.br/barragem-area-ix/","atualizadoEm":"2024-02-13T15:04:35"},
  {"id":329,"nome":"Barragem Auxiliar do Vigia","municipio":"Ouro Preto","municipioBruto":null,"uf":"MG","empreendedor":"CSN Mineração S.A.","volumeMilM3":null,"volumeTexto":null,"previsaoDescaracterizacao":"100% concluída","andamentoPercentual":100,"andamentoTexto":"100%","link":"https://barragens.mpmg.mp.br/barragem-auxiliar-do-vigia/","atualizadoEm":"2024-02-13T14:55:00"},
  {"id":403,"nome":"Barragem B1","municipio":"Sarzedo","municipioBruto":null,"uf":"MG","empreendedor":"Itaminas S/A","volumeMilM3":823,"volumeTexto":"823 mil m³","previsaoDescaracterizacao":"100% concluída","andamentoPercentual":100,"andamentoTexto":"100%","link":"https://barragens.mpmg.mp.br/barragem-b1-3/","atualizadoEm":"2024-02-13T15:17:11"},
  {"id":236,"nome":"Barragem B1","municipio":"Itabirito","municipioBruto":null,"uf":"MG","empreendedor":"Herculano Mineração Ltda","volumeMilM3":null,"volumeTexto":null,"previsaoDescaracterizacao":"100% concluída","andamentoPercentual":100,"andamentoTexto":"100%","link":"https://barragens.mpmg.mp.br/barragem-b1-2/","atualizadoEm":"2024-02-13T11:05:38"},
  {"id":186,"nome":"Barragem B1","municipio":"Brumadinho","municipioBruto":null,"uf":"MG","empreendedor":"Mineração Morro do Ipê S.A.","volumeMilM3":786.3,"volumeTexto":"786,3 mil m³","previsaoDescaracterizacao":"12/2026","andamentoPercentual":90,"andamentoTexto":"90%","link":"https://barragens.mpmg.mp.br/barragem-b1/","atualizadoEm":"2024-02-13T10:48:24"},
  {"id":181,"nome":"Barragem B1","municipio":"Brumadinho","municipioBruto":null,"uf":"MG","empreendedor":"Mineração Geral do Brasil","volumeMilM3":412,"volumeTexto":"412 mil m³","previsaoDescaracterizacao":"2030","andamentoPercentual":null,"andamentoTexto":"Aguarda o início das obras","link":"https://barragens.mpmg.mp.br/barragem-b1-brumadinho/","atualizadoEm":"2024-02-13T10:47:00"},
  {"id":208,"nome":"Barragem B1 Auxiliar","municipio":null,"municipioBruto":"Barragem B1 Auxiliar Igarapé","uf":"MG","empreendedor":"Mineração Morro do Ipê S.A.","volumeMilM3":2659,"volumeTexto":"2,659 milhões de m³","previsaoDescaracterizacao":"12/2027","andamentoPercentual":75,"andamentoTexto":"75%","link":"https://barragens.mpmg.mp.br/barragem-b1-auxiliar/","atualizadoEm":"2024-02-13T10:56:40"},
  {"id":274,"nome":"Barragem B1/B3","municipio":"Itatiaiuçu","municipioBruto":null,"uf":"MG","empreendedor":"Minerita Minérios Itaúna Ltda","volumeMilM3":null,"volumeTexto":null,"previsaoDescaracterizacao":"12/2027","andamentoPercentual":100,"andamentoTexto":"100% Descaracterização finalizada","link":"https://barragens.mpmg.mp.br/barragem-b1-b3/","atualizadoEm":"2024-02-13T14:31:43"},
  {"id":1493,"nome":"Barragem B2","municipio":"Brumadinho","municipioBruto":null,"uf":"MG","empreendedor":"Mineração Geral do Brasil","volumeMilM3":424,"volumeTexto":"424 mil m³","previsaoDescaracterizacao":"2030","andamentoPercentual":null,"andamentoTexto":"Aguarda o início das obras","link":"https://barragens.mpmg.mp.br/barragem-b2-brumadinho/","atualizadoEm":"2024-02-23T20:11:44"},
  {"id":398,"nome":"Barragem B2","municipio":"Rio Acima","municipioBruto":null,"uf":"MG","empreendedor":"Minérios Nacional S.A.","volumeMilM3":2616,"volumeTexto":"2,616 milhões de m³","previsaoDescaracterizacao":"06/2028","andamentoPercentual":69,"andamentoTexto":"69%","link":"https://barragens.mpmg.mp.br/barragem-b2-2/","atualizadoEm":"2024-02-13T15:15:57"},
  {"id":216,"nome":"Barragem B2","municipio":null,"municipioBruto":"Barragem B2 Igarapé","uf":"MG","empreendedor":"Mineração Morro do Ipê S.A.","volumeMilM3":1344,"volumeTexto":"1,344 milhão de m³","previsaoDescaracterizacao":"12/2027","andamentoPercentual":75,"andamentoTexto":"75%","link":"https://barragens.mpmg.mp.br/barragem-b2/","atualizadoEm":"2024-02-13T10:59:06"},
  {"id":393,"nome":"Barragem B2 Auxiliar","municipio":"Rio Acima","municipioBruto":null,"uf":"MG","empreendedor":"Minérios Nacional S.A.","volumeMilM3":4500,"volumeTexto":"4,5 milhões de m³","previsaoDescaracterizacao":"04/2026","andamentoPercentual":100,"andamentoTexto":"100% Aguarda anuência dos órgãos competentes","link":"https://barragens.mpmg.mp.br/barragem-b2-auxiliar/","atualizadoEm":"2024-02-13T15:14:46"},
  {"id":305,"nome":"Barragem B3 e B4","municipio":"Nova Lima","municipioBruto":null,"uf":"MG","empreendedor":"Vale S.A.","volumeMilM3":150.8,"volumeTexto":"150,8 mil m3","previsaoDescaracterizacao":"2024","andamentoPercentual":100,"andamentoTexto":"100%","link":"https://barragens.mpmg.mp.br/barragem-b3-e-b4/","atualizadoEm":"2024-02-13T14:46:24"},
  {"id":264,"nome":"Barragem B4","municipio":"Itapecerica","municipioBruto":null,"uf":"MG","empreendedor":"Nacional de Grafite","volumeMilM3":999.7,"volumeTexto":"999,7 mil m³","previsaoDescaracterizacao":"05/2024","andamentoPercentual":100,"andamentoTexto":"100% Aguardando anuência dos órgãos competentes","link":"https://barragens.mpmg.mp.br/barragem-b4-2/","atualizadoEm":"2024-02-13T14:28:03"},
  {"id":191,"nome":"Barragem B4","municipio":"Congonhas","municipioBruto":null,"uf":"MG","empreendedor":"CSN Mineração S.A.","volumeMilM3":130000,"volumeTexto":"130 milhões de m³","previsaoDescaracterizacao":"08/2028","andamentoPercentual":67,"andamentoTexto":"67%","link":"https://barragens.mpmg.mp.br/barragem-b4/","atualizadoEm":"2024-02-13T10:50:00"},
  {"id":157,"nome":"Barragem B5","municipio":null,"municipioBruto":"Barragem B5 Araxá","uf":"MG","empreendedor":"Mosaic Fertilizantes Ltda","volumeMilM3":42770,"volumeTexto":"42,770 milhões de m³","previsaoDescaracterizacao":"07/2028","andamentoPercentual":68,"andamentoTexto":"68%","link":"https://barragens.mpmg.mp.br/barragem-b5/","atualizadoEm":"2024-02-13T10:16:17"},
  {"id":256,"nome":"Barragem Central","municipio":"Itatiaiuçu","municipioBruto":null,"uf":"MG","empreendedor":"USIMINAS S.A.","volumeMilM3":null,"volumeTexto":null,"previsaoDescaracterizacao":"100% concluída","andamentoPercentual":100,"andamentoTexto":"100%","link":"https://barragens.mpmg.mp.br/barragem-central-2/","atualizadoEm":"2024-02-13T11:11:46"},
  {"id":246,"nome":"Barragem Central","municipio":"Itabirito","municipioBruto":null,"uf":"MG","empreendedor":"SAFM Mineração Ltda","volumeMilM3":277.7,"volumeTexto":"277,7 mil m³","previsaoDescaracterizacao":"100% concluída","andamentoPercentual":100,"andamentoTexto":"100%","link":"https://barragens.mpmg.mp.br/barragem-central/","atualizadoEm":"2024-02-13T11:08:56"},
  {"id":250,"nome":"Barragem de Aredes","municipio":"Itabirito","municipioBruto":null,"uf":"MG","empreendedor":"SAFM Mineração Ltda","volumeMilM3":148.6,"volumeTexto":"148,6 mil m³","previsaoDescaracterizacao":"100% concluída","andamentoPercentual":100,"andamentoTexto":"100%","link":"https://barragens.mpmg.mp.br/barragem-de-aredes/","atualizadoEm":"2024-02-13T11:10:17"},
  {"id":294,"nome":"Barragem de Campo Grande","municipio":"Mariana","municipioBruto":null,"uf":"MG","empreendedor":"Vale S.A.","volumeMilM3":18973,"volumeTexto":"18,973 milhões de m³","previsaoDescaracterizacao":"concluída","andamentoPercentual":100,"andamentoTexto":"100% Aguarda anuência dos órgãos competentes","link":"https://barragens.mpmg.mp.br/barragem-de-campo-grande/","atualizadoEm":"2024-02-13T14:39:12"},
  {"id":359,"nome":"Barragem de Doutor","municipio":"Ouro Preto","municipioBruto":null,"uf":"MG","empreendedor":"Vale S.A.","volumeMilM3":35000,"volumeTexto":"35 milhões de m³","previsaoDescaracterizacao":"2029","andamentoPercentual":56,"andamentoTexto":"56%","link":"https://barragens.mpmg.mp.br/barragem-de-doutor/","atualizadoEm":"2024-02-13T15:03:41"},
  {"id":284,"nome":"Barragem de Germano","municipio":"Mariana","municipioBruto":null,"uf":"MG","empreendedor":"Samarco Mineração S.A.","volumeMilM3":130000,"volumeTexto":"130 milhões de m³ / 15 milhões de m³","previsaoDescaracterizacao":"2029 Cava Germano: obras finalizadas &#8211; 2023","andamentoPercentual":56,"andamentoTexto":"56%","link":"https://barragens.mpmg.mp.br/barragem-de-germano/","atualizadoEm":"2024-02-13T14:37:27"},
  {"id":231,"nome":"Barragem de Ipoema","municipio":"Itabira","municipioBruto":null,"uf":"MG","empreendedor":"Vale S.A.","volumeMilM3":null,"volumeTexto":null,"previsaoDescaracterizacao":"100% concluída","andamentoPercentual":100,"andamentoTexto":"100%","link":"https://barragens.mpmg.mp.br/barragem-de-ipoema/","atualizadoEm":"2024-02-13T11:03:59"},
  {"id":203,"nome":"Barragem de Rejeitos","municipio":null,"municipioBruto":"Barragem Dique 2 Fortaleza de Minas","uf":"MG","empreendedor":"Serra da Fortaleza Mineração S.A.","volumeMilM3":3250,"volumeTexto":"3,250 milhões de m³","previsaoDescaracterizacao":"04/2028 Descaracterização paralis ada .cls-1 { fill: #ed0f0f; fill-rule: evenodd; stroke-width: 0px; }","andamentoPercentual":null,"andamentoTexto":null,"link":"https://barragens.mpmg.mp.br/barragem-de-rejeitos/","atualizadoEm":"2024-02-13T10:54:17"},
  {"id":289,"nome":"Barragem de Xingu","municipio":"Mariana","municipioBruto":null,"uf":"MG","empreendedor":"Vale S.A.","volumeMilM3":6170,"volumeTexto":"6,170 milhões de m³","previsaoDescaracterizacao":"2034","andamentoPercentual":34,"andamentoTexto":"34%","link":"https://barragens.mpmg.mp.br/barragem-de-xingu/","atualizadoEm":"2024-02-13T14:38:12"},
  {"id":324,"nome":"Barragem do Vigia","municipio":"Ouro Preto","municipioBruto":null,"uf":"MG","empreendedor":"CSN Mineração S.A.","volumeMilM3":812.9,"volumeTexto":"812,9 mil m³","previsaoDescaracterizacao":"100% concluída","andamentoPercentual":100,"andamentoTexto":"100%","link":"https://barragens.mpmg.mp.br/barragem-do-vigia/","atualizadoEm":"2024-02-13T14:53:50"},
  {"id":1882,"nome":"Barragem do Vigia 5","municipio":"Ouro Preto","municipioBruto":null,"uf":"MG","empreendedor":"CSN Mineração S.A.","volumeMilM3":812.9,"volumeTexto":"812,9 mil m³","previsaoDescaracterizacao":"100% concluída","andamentoPercentual":100,"andamentoTexto":"100% Aguardando conformidade dos órgãos competentes","link":"https://barragens.mpmg.mp.br/barragem-do-vigia-5/","atualizadoEm":"2024-04-22T10:17:31"},
  {"id":339,"nome":"Barragem Forquilha I","municipio":"Ouro Preto","municipioBruto":null,"uf":"MG","empreendedor":"Vale S.A.","volumeMilM3":12763,"volumeTexto":"12,763 milhões m³","previsaoDescaracterizacao":"2035","andamentoPercentual":31,"andamentoTexto":"31%","link":"https://barragens.mpmg.mp.br/barragem-forquilha-i/","atualizadoEm":"2024-02-13T15:00:21"},
  {"id":344,"nome":"Barragem Forquilha II","municipio":"Ouro Preto","municipioBruto":null,"uf":"MG","empreendedor":"Vale S.A.","volumeMilM3":22778,"volumeTexto":"22,778 milhões de m³","previsaoDescaracterizacao":"2035","andamentoPercentual":31,"andamentoTexto":"31%","link":"https://barragens.mpmg.mp.br/barragem-forquilha-ii/","atualizadoEm":"2024-02-13T15:01:28"},
  {"id":349,"nome":"Barragem Forquilha III","municipio":"Ouro Preto","municipioBruto":null,"uf":"MG","empreendedor":"Vale S.A.","volumeMilM3":19476,"volumeTexto":"19,476 milhões de m³","previsaoDescaracterizacao":"2035","andamentoPercentual":31,"andamentoTexto":"31%","link":"https://barragens.mpmg.mp.br/barragem-forquilha-iii/","atualizadoEm":"2024-02-13T15:02:08"},
  {"id":354,"nome":"Barragem Grupo","municipio":"Ouro Preto","municipioBruto":null,"uf":"MG","empreendedor":"Vale S.A.","volumeMilM3":1961,"volumeTexto":"1,961 milhão de m³","previsaoDescaracterizacao":"setembro de 2025","andamentoPercentual":100,"andamentoTexto":"100% Aguarda anuência dos órgãos competentes","link":"https://barragens.mpmg.mp.br/barragem-grupo/","atualizadoEm":"2024-02-13T15:02:55"},
  {"id":269,"nome":"Barragem Serra Azul","municipio":"Itatiaiuçu","municipioBruto":null,"uf":"MG","empreendedor":"ArcelorMittal Brasil S.A.","volumeMilM3":5028,"volumeTexto":"5,028 milhões de m³","previsaoDescaracterizacao":"12/2032","andamentoPercentual":40,"andamentoTexto":"40%","link":"https://barragens.mpmg.mp.br/barragem-serra-azul/","atualizadoEm":"2024-02-13T14:29:31"},
  {"id":175,"nome":"Barragem Sul Superior","municipio":"Barão de Cocais","municipioBruto":null,"uf":"MG","empreendedor":"Vale S.A.","volumeMilM3":5940,"volumeTexto":"5,940 milhões de m³","previsaoDescaracterizacao":"2029","andamentoPercentual":56,"andamentoTexto":"56%","link":"https://barragens.mpmg.mp.br/barragem-sul-superior/","atualizadoEm":"2024-02-13T10:42:02"},
  {"id":310,"nome":"Barragem Vargem Grande","municipio":"Nova Lima","municipioBruto":null,"uf":"MG","empreendedor":"Vale S.A.","volumeMilM3":7413,"volumeTexto":"7,413 milhões de m³","previsaoDescaracterizacao":"2027","andamentoPercentual":75,"andamentoTexto":"75%","link":"https://barragens.mpmg.mp.br/barragem-vargem-grande/","atualizadoEm":"2024-02-13T14:47:22"},
  {"id":300,"nome":"Barragem Volta Grande 2","municipio":null,"municipioBruto":"Barragem Volta Grande 2 Nazareno","uf":"MG","empreendedor":"AMG Brasil S.A.","volumeMilM3":206,"volumeTexto":"206 mil m³","previsaoDescaracterizacao":"100% concluída","andamentoPercentual":100,"andamentoTexto":"100%","link":"https://barragens.mpmg.mp.br/barragem-volta-grande-2/","atualizadoEm":"2024-02-13T14:44:33"},
  {"id":334,"nome":"Barragens dos Alemães","municipio":"Ouro Preto","municipioBruto":null,"uf":"MG","empreendedor":"Gerdau Açominas S.A.","volumeMilM3":null,"volumeTexto":null,"previsaoDescaracterizacao":"100% concluída","andamentoPercentual":100,"andamentoTexto":"100%","link":"https://barragens.mpmg.mp.br/barragens-dos-alemaes/","atualizadoEm":"2024-02-13T14:58:58"},
  {"id":240,"nome":"Dique 02","municipio":"Itabirito","municipioBruto":null,"uf":"MG","empreendedor":"Minar Mineração Aredes","volumeMilM3":40,"volumeTexto":"40 mil m³","previsaoDescaracterizacao":"sem data informada","andamentoPercentual":18,"andamentoTexto":"51,18%","link":"https://barragens.mpmg.mp.br/dique-02/","atualizadoEm":"2024-02-13T11:06:46"},
  {"id":226,"nome":"Diques 1A/1B","municipio":"Itabira","municipioBruto":null,"uf":"MG","empreendedor":"Vale S.A.","volumeMilM3":44045,"volumeTexto":"44,045 milhões de m³","previsaoDescaracterizacao":"2024","andamentoPercentual":100,"andamentoTexto":"100% Aguardando anuência dos órgãos competentes","link":"https://barragens.mpmg.mp.br/diques-1a-1b/","atualizadoEm":"2024-02-13T11:02:58"},
  {"id":221,"nome":"Diques da Barragem do Sistema Pontal","municipio":"Itabira","municipioBruto":null,"uf":"MG","empreendedor":"Vale S.A.","volumeMilM3":209801,"volumeTexto":"209,801 milhões de m³","previsaoDescaracterizacao":"2029","andamentoPercentual":56,"andamentoTexto":"56%","link":"https://barragens.mpmg.mp.br/diques-da-barragem-do-sistema-pontal/","atualizadoEm":"2024-02-13T11:00:38"}
];

/** Importe ISTO em página de servidor — o array acima já é pequeno (45
 *  registros), mas manter o hábito evita que uma cópia futura, maior, quebre
 *  o teto do Worker sem ninguém perceber. */
export const COBERTURA_BARRAGENS_MPMG = {
  medidoEm: "2026-08-21",
  fonte: "https://barragens.mpmg.mp.br/",
  total: BARRAGENS_MPMG.length,
  comEmpreendedor: BARRAGENS_MPMG.filter((b) => b.empreendedor).length,
  comPrevisao: BARRAGENS_MPMG.filter((b) => b.previsaoDescaracterizacao).length,
  comAndamento: BARRAGENS_MPMG.filter((b) => b.andamentoPercentual !== null || b.andamentoTexto !== null).length,
  comVolume: BARRAGENS_MPMG.filter((b) => b.volumeMilM3 !== null).length,
  concluidas: BARRAGENS_MPMG.filter((b) => b.andamentoPercentual === 100).length,
  semMunicipioReconhecido: BARRAGENS_MPMG.filter((b) => b.municipio === null).length,
  empreendedores: new Set(BARRAGENS_MPMG.map((b) => b.empreendedor)).size,
  municipiosReconhecidos: new Set(
    BARRAGENS_MPMG.map((b) => b.municipio).filter((m): m is string => m !== null),
  ).size,
} as const;

export interface VolumePorEmpreendedor {
  empreendedor: string;
  barragens: number;
  concluidas: number;
  volumeConcluidoMilM3: number;
  volumeEmAndamentoMilM3: number;
  volumeTotalMilM3: number;
  semVolumeConhecido: number;
}

/**
 * Agrupa por empreendedor, separando o volume já descaracterizado (100%) do
 * volume ainda em andamento — a mesma barra não pode misturar as duas coisas
 * sem dizer qual pedaço é passado e qual é promessa. Barragens sem
 * `volumeMilM3` entram na contagem (`barragens`, `concluidas`) mas não somam
 * em nenhum dos dois volumes — `semVolumeConhecido` declara quantas ficaram
 * de fora da soma, para a tela nunca ler "0 m³" como "sem rejeito".
 */
export function agruparPorEmpreendedor(lista: readonly BarragemMpmg[] = BARRAGENS_MPMG): VolumePorEmpreendedor[] {
  const mapa = new Map<string, VolumePorEmpreendedor>();
  for (const b of lista) {
    const atual: VolumePorEmpreendedor = mapa.get(b.empreendedor) ?? {
      empreendedor: b.empreendedor,
      barragens: 0,
      concluidas: 0,
      volumeConcluidoMilM3: 0,
      volumeEmAndamentoMilM3: 0,
      volumeTotalMilM3: 0,
      semVolumeConhecido: 0,
    };
    atual.barragens += 1;
    const concluida = b.andamentoPercentual === 100;
    if (concluida) atual.concluidas += 1;
    if (b.volumeMilM3 === null) {
      atual.semVolumeConhecido += 1;
    } else if (concluida) {
      atual.volumeConcluidoMilM3 += b.volumeMilM3;
      atual.volumeTotalMilM3 += b.volumeMilM3;
    } else {
      atual.volumeEmAndamentoMilM3 += b.volumeMilM3;
      atual.volumeTotalMilM3 += b.volumeMilM3;
    }
    mapa.set(b.empreendedor, atual);
  }
  return [...mapa.values()].sort((a, b) => b.volumeTotalMilM3 - a.volumeTotalMilM3);
}
