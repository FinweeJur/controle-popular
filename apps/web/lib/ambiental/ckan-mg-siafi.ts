/**
 * Execução orçamentária do Estado de Minas Gerais em 2026 (SIAFI-MG), agregada
 * por FUNÇÃO DE GOVERNO e GRUPO DE NATUREZA DE DESPESA. ARQUIVO GERADO — não
 * editar à mão.
 *
 * Gerado por `scripts/coletar-ckan-mg.mts --conjunto=siafi` a partir do CKAN
 * do `dados.mg.gov.br`, dataset `dados-armazem-siafi-2026`, resource
 * `execucao.csv.gz` — 718.480 linhas, um lançamento por
 * linha, 29 colunas, TODAS por código (`uo_cod`, `funcao_cod`, `grupo_cod`…),
 * nenhuma com nome.
 *
 * ═══ POR QUE É AGREGADO, NÃO LINHA A LINHA ═══
 *
 * 718.480 lançamentos não cabem no teto de payload do Worker
 * (3 MiB gzip) nem fazem sentido carregados inteiros em contexto de agente —
 * a mesma regra que rege `COBERTURA_*` em todo o resto do repo. Agregado por
 * função e por grupo de despesa, que juntas cabem em algumas dezenas de
 * linhas e já respondem "quanto o Estado gastou em Saúde vs. Educação vs.
 * Segurança" e "quanto foi para folha (Pessoal) vs. obra (Investimentos)".
 *
 * ═══ POR QUE FUNÇÃO E GRUPO, E NÃO ÓRGÃO (`uo_cod`) ═══
 *
 * `uo_cod` (unidade orçamentária) é um código ESPECÍFICO de MG — publicá-lo
 * como "órgão 1221 gastou X" sem dicionário de tradução seria pior que não
 * publicar. `funcao_cod` (28 valores) e `grupo_cod` (6 valores, aqui) são
 * classificações NACIONAIS fixas, iguais em qualquer ente da federação —
 * Portaria MOG 42/1999 (função) e Lei 4.320/1964 + Portaria STN/SOF 163/2001
 * (grupo). Conferidas em 21/08/2026 contra a listagem pública do Portal da
 * Transparência federal (`portaldatransparencia.gov.br/funcoes`) — os 28
 * slugs batem exatamente com a tabela hardcoded no coletor. O coletor ABORTA
 * se a fonte trouxer um código fora dessas duas tabelas, em vez de publicar
 * um rótulo inventado.
 *
 * ═══ O QUE FICA DE FORA (declarado, não escondido) ═══
 *
 * As outras seis tabelas do dataset (`credito`, `cota`, `receita`,
 * `alteracoes_orcamentarias`, `restos_pagar`, `restos_pagar_folha`) foram
 * inspecionadas na sondagem mas não têm coletor nesta rodada — todas
 * compartilham a mesma limitação (dimensões por código de MG, sem nome) e a
 * mesma decisão adiada de dicionário. `execucao.csv` é a maior e a que mais
 * importa (a execução em si), por isso veio primeiro.
 */

interface AgregadoSiafi {
  lancamentos: number;
  vlrEmpenhado: number;
  vlrLiquidado: number;
  vlrPagoFinanceiro: number;
}

export interface SiafiPorFuncao extends AgregadoSiafi {
  /** Código nacional da função de governo (Portaria MOG 42/1999), 1–28. */
  codigo: number;
  funcao: string;
}
export interface SiafiPorGrupo extends AgregadoSiafi {
  /** Código nacional do grupo de natureza de despesa (Lei 4.320/1964). */
  codigo: number;
  grupo: string;
}
export interface SiafiPorMes extends AgregadoSiafi {
  mes: number;
}

/** Importe ISTO em página de servidor — já é o agregado, não o corpus. */
export const COBERTURA_SIAFI_EXECUCAO = {
  ano: 2026,
  lancamentos: 718480,
  vlrEmpenhadoTotal: 84318251876.34482,
  vlrLiquidadoTotal: 77201835113.32164,
  vlrPagoFinanceiroTotal: 75987646165.20033,
  funcoes: 26,
  grupos: 6,
} as const;

export const SIAFI_POR_FUNCAO: SiafiPorFuncao[] = [{"codigo":6,"funcao":"Segurança Pública","lancamentos":66489,"vlrEmpenhado":15778152592.521667,"vlrLiquidado":15274021151.201494,"vlrPagoFinanceiro":15158763480.90162},{"codigo":9,"funcao":"Previdência Social","lancamentos":5568,"vlrEmpenhado":14555338944.959988,"vlrLiquidado":14532116962.029963,"vlrPagoFinanceiro":14526775713.129978},{"codigo":10,"funcao":"Saúde","lancamentos":146303,"vlrEmpenhado":14237955873.31988,"vlrLiquidado":11613415928.869911,"vlrPagoFinanceiro":11368214770.109917},{"codigo":12,"funcao":"Educação","lancamentos":144444,"vlrEmpenhado":13006254715.609646,"vlrLiquidado":12485089175.939539,"vlrPagoFinanceiro":12341179039.22945},{"codigo":28,"funcao":"Encargos Especiais","lancamentos":195881,"vlrEmpenhado":7935526991.777689,"vlrLiquidado":6790017111.807001,"vlrPagoFinanceiro":6519559056.380498},{"codigo":2,"funcao":"Judiciária","lancamentos":16790,"vlrEmpenhado":6254299412.639839,"vlrLiquidado":5934287155.949887,"vlrPagoFinanceiro":5788635104.3899145},{"codigo":3,"funcao":"Essencial à Justiça","lancamentos":17128,"vlrEmpenhado":3170596971.9800186,"vlrLiquidado":3006695510.45002,"vlrPagoFinanceiro":2966422769.770005},{"codigo":4,"funcao":"Administração","lancamentos":18167,"vlrEmpenhado":3153131487.929922,"vlrLiquidado":2558383761.769996,"vlrPagoFinanceiro":2463242759.24999},{"codigo":26,"funcao":"Transporte","lancamentos":5559,"vlrEmpenhado":1547317314.0600016,"vlrLiquidado":845675456.9400005,"vlrPagoFinanceiro":814287743.200001},{"codigo":1,"funcao":"Legislativa","lancamentos":4301,"vlrEmpenhado":1443851182.5000012,"vlrLiquidado":1339273380.3199997,"vlrPagoFinanceiro":1307667529.5500038},{"codigo":20,"funcao":"Agricultura","lancamentos":5480,"vlrEmpenhado":778360982.9800014,"vlrLiquidado":752536588.83,"vlrPagoFinanceiro":726875289.0200008},{"codigo":15,"funcao":"Urbanismo","lancamentos":3021,"vlrEmpenhado":759009258.130001,"vlrLiquidado":727623542.5200005,"vlrPagoFinanceiro":709557761.110001},{"codigo":19,"funcao":"Ciência e Tecnologia","lancamentos":61173,"vlrEmpenhado":381560641.5600009,"vlrLiquidado":335328593.8500008,"vlrPagoFinanceiro":327525066.67000073},{"codigo":18,"funcao":"Gestão Ambiental","lancamentos":8226,"vlrEmpenhado":354176102.1800006,"vlrLiquidado":328357040.4900007,"vlrPagoFinanceiro":313620455.7800005},{"codigo":17,"funcao":"Saneamento","lancamentos":675,"vlrEmpenhado":260116749.67000008,"vlrLiquidado":29729825.759999976,"vlrPagoFinanceiro":28834563.950000003},{"codigo":13,"funcao":"Cultura","lancamentos":6423,"vlrEmpenhado":258763139.6099998,"vlrLiquidado":245265605.59999976,"vlrPagoFinanceiro":238295085.32000014},{"codigo":8,"funcao":"Assistência Social","lancamentos":5617,"vlrEmpenhado":128015588.77000014,"vlrLiquidado":108249799.71000016,"vlrPagoFinanceiro":103392536.38000017},{"codigo":27,"funcao":"Desporto e Lazer","lancamentos":2175,"vlrEmpenhado":99256432.98000002,"vlrLiquidado":93574074.78,"vlrPagoFinanceiro":92087412.66999996},{"codigo":23,"funcao":"Comércio e Serviços","lancamentos":2335,"vlrEmpenhado":87110046.01000011,"vlrLiquidado":76440846.61000004,"vlrPagoFinanceiro":72604981.2800001},{"codigo":14,"funcao":"Direitos da Cidadania","lancamentos":1577,"vlrEmpenhado":77826367.00000003,"vlrLiquidado":75965950.10000001,"vlrPagoFinanceiro":71749701.86000001},{"codigo":16,"funcao":"Habitação","lancamentos":182,"vlrEmpenhado":32077713.7,"vlrLiquidado":31551952.099999994,"vlrPagoFinanceiro":30502533.20000001},{"codigo":11,"funcao":"Trabalho","lancamentos":749,"vlrEmpenhado":8645637.260000007,"vlrLiquidado":8136230.600000001,"vlrPagoFinanceiro":7872553.360000005},{"codigo":25,"funcao":"Energia","lancamentos":40,"vlrEmpenhado":6924745.550000002,"vlrLiquidado":6913724.82,"vlrPagoFinanceiro":6905034.9},{"codigo":21,"funcao":"Organização Agrária","lancamentos":110,"vlrEmpenhado":3696749.110000001,"vlrLiquidado":3050348.72,"vlrPagoFinanceiro":2938665.97},{"codigo":22,"funcao":"Indústria","lancamentos":40,"vlrEmpenhado":240545.44,"vlrLiquidado":108937.16,"vlrPagoFinanceiro":110170.85},{"codigo":7,"funcao":"Relações Exteriores","lancamentos":27,"vlrEmpenhado":45688.97,"vlrLiquidado":26456.33,"vlrPagoFinanceiro":26386.96}];
export const SIAFI_POR_GRUPO: SiafiPorGrupo[] = [{"codigo":1,"grupo":"Pessoal e Encargos Sociais","lancamentos":23735,"vlrEmpenhado":47060898862.23973,"vlrLiquidado":47018614139.37967,"vlrPagoFinanceiro":46984086472.73988},{"codigo":3,"grupo":"Outras Despesas Correntes","lancamentos":670103,"vlrEmpenhado":23666866625.033394,"vlrLiquidado":19390291276.412354,"vlrPagoFinanceiro":18539260303.46394},{"codigo":4,"grupo":"Investimentos","lancamentos":23961,"vlrEmpenhado":6523972090.4599905,"vlrLiquidado":4881589047.659994,"vlrPagoFinanceiro":4740700311.459984},{"codigo":6,"grupo":"Amortização da Dívida","lancamentos":259,"vlrEmpenhado":3837031372.2999997,"vlrLiquidado":3208216994.609995,"vlrPagoFinanceiro":3081572645.0899954},{"codigo":5,"grupo":"Inversões Financeiras","lancamentos":143,"vlrEmpenhado":2259666875.430001,"vlrLiquidado":1948251608.1600003,"vlrPagoFinanceiro":1936315860.8699996},{"codigo":2,"grupo":"Juros e Encargos da Dívida","lancamentos":279,"vlrEmpenhado":969816050.78,"vlrLiquidado":754872047.0499998,"vlrPagoFinanceiro":705710571.5699999}];
export const SIAFI_POR_MES: SiafiPorMes[] = [{"mes":1,"lancamentos":17514,"vlrEmpenhado":9285900750.990019,"vlrLiquidado":7396111494.680015,"vlrPagoFinanceiro":7344848326.620003},{"mes":2,"lancamentos":74429,"vlrEmpenhado":9750140493.390045,"vlrLiquidado":9493388150.149996,"vlrPagoFinanceiro":9313171070.529892},{"mes":3,"lancamentos":121231,"vlrEmpenhado":12966285631.91912,"vlrLiquidado":10249951223.920029,"vlrPagoFinanceiro":10039439113.219831},{"mes":4,"lancamentos":116976,"vlrEmpenhado":13550042544.339933,"vlrLiquidado":10315775870.779541,"vlrPagoFinanceiro":10141997514.699955},{"mes":5,"lancamentos":106144,"vlrEmpenhado":11603962764.819864,"vlrLiquidado":11661903125.289804,"vlrPagoFinanceiro":11199973466.020153},{"mes":6,"lancamentos":97219,"vlrEmpenhado":12059075654.169937,"vlrLiquidado":14040127942.13994,"vlrPagoFinanceiro":14042385875.140503},{"mes":7,"lancamentos":117467,"vlrEmpenhado":13894806363.169474,"vlrLiquidado":12704292766.389423,"vlrPagoFinanceiro":12797134321.591005},{"mes":8,"lancamentos":67500,"vlrEmpenhado":1208037673.4200797,"vlrLiquidado":1340284539.9100547,"vlrPagoFinanceiro":1108696477.3700104}];
