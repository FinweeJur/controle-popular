/**
 * mesorregioes.js — a qual mesorregião do IBGE pertence cada município dos
 * Vales, para o filtro de região do painel poder separar **Jequitinhonha** de
 * **Mucuri** área por área.
 *
 * ## Por que este arquivo existe
 *
 * O rótulo "Vales do Mucuri e Jequitinhonha" junta DUAS mesorregiões distintas
 * do IBGE numa palavra só, e Minas tem outros vales (Vale do Aço, Vale do Rio
 * Doce): "Vales" sem sobrenome é ambíguo. A correção pedida — sempre dizer
 * QUAL vale — só é honesta se a interface puder de fato separar os dois. Para
 * separar, é preciso saber de que mesorregião é cada área; o pipeline grava os
 * dois vales num arquivo só (`*-vales.geojson`, ver `pipeline/regioes.py`),
 * então a separação acontece aqui, no cliente, a partir do município da área.
 *
 * ## Proveniência — copiado de `pipeline/regioes.py`, não digitado
 *
 * As 74 linhas abaixo foram GERADAS a partir das tabelas `JEQUITINHONHA` (51
 * municípios) e `MUCURI` (23) de `C:/DevCoder/terras-devolutas/pipeline/
 * regioes.py`, que por sua vez vieram da API de Localidades do IBGE
 * (mesorregiões 3103 = Jequitinhonha e 3104 = Vale do Mucuri), consultada em
 * 2026-08-06. Contado agora, ao gerar: 51 + 23 = 74, sem nenhum código em
 * comum entre as duas. O teste `mesorregioes.test.mjs` refaz essa contagem.
 *
 * ⚠️ A mesorregião do IBGE NÃO é sinônimo do "Vale do Jequitinhonha" da
 * política estadual (SEDESE) nem da bacia hidrográfica de mesmo nome — são
 * três recortes que não coincidem. O projeto adotou o do IBGE por
 * reprodutibilidade; a ressalva completa está no cabeçalho de `regioes.py`.
 *
 * ## O que fazer quando a área não diz o município
 *
 * `mesorregiaoDe()` devolve `null`, e quem chama tem de tratar isso como
 * "não sei", nunca como "não é". Três camadas dos Vales trazem só `area_ha` no
 * GeoJSON — sem `codigo_ibge` e sem `municipio` —, e para elas a separação é
 * impossível sem cruzamento espacial, que este app não faz. Ver o campo
 * `mesoIndistinta` das fontes em `config.js`: essas camadas se declaram
 * indistintas e o painel DIZ isso em vez de fingir precisão.
 */

/**
 * código IBGE (string de 7 dígitos) → { meso, nome, micro }.
 *
 * `micro` (a microrregião) não é usada pelo filtro hoje. Fica porque separa
 * realidades fundiárias distintas dentro do Jequitinhonha — Diamantina é o
 * Alto, das chapadas e da silvicultura; Almenara é o Baixo, de pecuária — e é
 * o agrupamento que a literatura regional usa. É a mesma coluna que o CSV do
 * pipeline já carrega; jogar fora aqui obrigaria a buscá-la de novo.
 */
export const MUNICIPIOS_DOS_VALES = new Map([
  // --- Mesorregião do Jequitinhonha (51 municípios) ---
  ['3101706', { meso: 'jequitinhonha', nome: 'Almenara', micro: 'Almenara' }],
  ['3102704', { meso: 'jequitinhonha', nome: 'Cachoeira de Pajeú', micro: 'Pedra Azul' }],
  ['3102852', { meso: 'jequitinhonha', nome: 'Angelândia', micro: 'Capelinha' }],
  ['3103405', { meso: 'jequitinhonha', nome: 'Araçuaí', micro: 'Araçuaí' }],
  ['3104452', { meso: 'jequitinhonha', nome: 'Aricanduva', micro: 'Capelinha' }],
  ['3105202', { meso: 'jequitinhonha', nome: 'Bandeira', micro: 'Almenara' }],
  ['3106507', { meso: 'jequitinhonha', nome: 'Berilo', micro: 'Capelinha' }],
  ['3112307', { meso: 'jequitinhonha', nome: 'Capelinha', micro: 'Capelinha' }],
  ['3113008', { meso: 'jequitinhonha', nome: 'Caraí', micro: 'Araçuaí' }],
  ['3113503', { meso: 'jequitinhonha', nome: 'Carbonita', micro: 'Capelinha' }],
  ['3116100', { meso: 'jequitinhonha', nome: 'Chapada do Norte', micro: 'Capelinha' }],
  ['3117009', { meso: 'jequitinhonha', nome: 'Comercinho', micro: 'Pedra Azul' }],
  ['3119500', { meso: 'jequitinhonha', nome: 'Coronel Murta', micro: 'Araçuaí' }],
  ['3120102', { meso: 'jequitinhonha', nome: 'Couto de Magalhães de Minas', micro: 'Diamantina' }],
  ['3121001', { meso: 'jequitinhonha', nome: 'Datas', micro: 'Diamantina' }],
  ['3121605', { meso: 'jequitinhonha', nome: 'Diamantina', micro: 'Diamantina' }],
  ['3122454', { meso: 'jequitinhonha', nome: 'Divisópolis', micro: 'Almenara' }],
  ['3125408', { meso: 'jequitinhonha', nome: 'Felício dos Santos', micro: 'Diamantina' }],
  ['3125507', { meso: 'jequitinhonha', nome: 'São Gonçalo do Rio Preto', micro: 'Diamantina' }],
  ['3125606', { meso: 'jequitinhonha', nome: 'Felisburgo', micro: 'Almenara' }],
  ['3126505', { meso: 'jequitinhonha', nome: 'Francisco Badaró', micro: 'Capelinha' }],
  ['3127602', { meso: 'jequitinhonha', nome: 'Gouveia', micro: 'Diamantina' }],
  ['3132503', { meso: 'jequitinhonha', nome: 'Itamarandiba', micro: 'Capelinha' }],
  ['3133303', { meso: 'jequitinhonha', nome: 'Itaobim', micro: 'Pedra Azul' }],
  ['3134004', { meso: 'jequitinhonha', nome: 'Itinga', micro: 'Araçuaí' }],
  ['3134707', { meso: 'jequitinhonha', nome: 'Jacinto', micro: 'Almenara' }],
  ['3135456', { meso: 'jequitinhonha', nome: 'Jenipapo de Minas', micro: 'Capelinha' }],
  ['3135803', { meso: 'jequitinhonha', nome: 'Jequitinhonha', micro: 'Almenara' }],
  ['3136009', { meso: 'jequitinhonha', nome: 'Joaíma', micro: 'Almenara' }],
  ['3136504', { meso: 'jequitinhonha', nome: 'Jordânia', micro: 'Almenara' }],
  ['3136520', { meso: 'jequitinhonha', nome: 'José Gonçalves de Minas', micro: 'Capelinha' }],
  ['3138351', { meso: 'jequitinhonha', nome: 'Leme do Prado', micro: 'Capelinha' }],
  ['3140555', { meso: 'jequitinhonha', nome: 'Mata Verde', micro: 'Almenara' }],
  ['3141405', { meso: 'jequitinhonha', nome: 'Medina', micro: 'Pedra Azul' }],
  ['3141801', { meso: 'jequitinhonha', nome: 'Minas Novas', micro: 'Capelinha' }],
  ['3143153', { meso: 'jequitinhonha', nome: 'Monte Formoso', micro: 'Almenara' }],
  ['3145307', { meso: 'jequitinhonha', nome: 'Novo Cruzeiro', micro: 'Araçuaí' }],
  ['3146305', { meso: 'jequitinhonha', nome: 'Padre Paraíso', micro: 'Araçuaí' }],
  ['3146750', { meso: 'jequitinhonha', nome: 'Palmópolis', micro: 'Almenara' }],
  ['3148707', { meso: 'jequitinhonha', nome: 'Pedra Azul', micro: 'Pedra Azul' }],
  ['3152170', { meso: 'jequitinhonha', nome: 'Ponto dos Volantes', micro: 'Araçuaí' }],
  ['3153301', { meso: 'jequitinhonha', nome: 'Presidente Kubitschek', micro: 'Diamantina' }],
  ['3155108', { meso: 'jequitinhonha', nome: 'Rio do Prado', micro: 'Almenara' }],
  ['3156601', { meso: 'jequitinhonha', nome: 'Rubim', micro: 'Almenara' }],
  ['3157104', { meso: 'jequitinhonha', nome: 'Salto da Divisa', micro: 'Almenara' }],
  ['3158102', { meso: 'jequitinhonha', nome: 'Santa Maria do Salto', micro: 'Almenara' }],
  ['3160306', { meso: 'jequitinhonha', nome: 'Santo Antônio do Jacinto', micro: 'Almenara' }],
  ['3165909', { meso: 'jequitinhonha', nome: 'Senador Modestino Gonçalves', micro: 'Diamantina' }],
  ['3169703', { meso: 'jequitinhonha', nome: 'Turmalina', micro: 'Capelinha' }],
  ['3171071', { meso: 'jequitinhonha', nome: 'Veredinha', micro: 'Capelinha' }],
  ['3171600', { meso: 'jequitinhonha', nome: 'Virgem da Lapa', micro: 'Araçuaí' }],

  // --- Mesorregião do Vale do Mucuri (23 municípios) ---
  ['3100906', { meso: 'mucuri', nome: 'Águas Formosas', micro: 'Nanuque' }],
  ['3104700', { meso: 'mucuri', nome: 'Ataléia', micro: 'Teófilo Otoni' }],
  ['3106606', { meso: 'mucuri', nome: 'Bertópolis', micro: 'Nanuque' }],
  ['3113701', { meso: 'mucuri', nome: 'Carlos Chagas', micro: 'Nanuque' }],
  ['3115458', { meso: 'mucuri', nome: 'Catuji', micro: 'Teófilo Otoni' }],
  ['3120151', { meso: 'mucuri', nome: 'Crisólita', micro: 'Nanuque' }],
  ['3126752', { meso: 'mucuri', nome: 'Franciscópolis', micro: 'Teófilo Otoni' }],
  ['3126802', { meso: 'mucuri', nome: 'Frei Gaspar', micro: 'Teófilo Otoni' }],
  ['3127057', { meso: 'mucuri', nome: 'Fronteira dos Vales', micro: 'Nanuque' }],
  ['3132305', { meso: 'mucuri', nome: 'Itaipé', micro: 'Teófilo Otoni' }],
  ['3137007', { meso: 'mucuri', nome: 'Ladainha', micro: 'Teófilo Otoni' }],
  ['3138906', { meso: 'mucuri', nome: 'Machacalis', micro: 'Nanuque' }],
  ['3139201', { meso: 'mucuri', nome: 'Malacacheta', micro: 'Teófilo Otoni' }],
  ['3144300', { meso: 'mucuri', nome: 'Nanuque', micro: 'Nanuque' }],
  ['3145356', { meso: 'mucuri', nome: 'Novo Oriente de Minas', micro: 'Teófilo Otoni' }],
  ['3146206', { meso: 'mucuri', nome: 'Ouro Verde de Minas', micro: 'Teófilo Otoni' }],
  ['3148509', { meso: 'mucuri', nome: 'Pavão', micro: 'Teófilo Otoni' }],
  ['3152402', { meso: 'mucuri', nome: 'Poté', micro: 'Teófilo Otoni' }],
  ['3157658', { meso: 'mucuri', nome: 'Santa Helena de Minas', micro: 'Nanuque' }],
  ['3165552', { meso: 'mucuri', nome: 'Setubinha', micro: 'Teófilo Otoni' }],
  ['3166709', { meso: 'mucuri', nome: 'Serra dos Aimorés', micro: 'Nanuque' }],
  ['3168606', { meso: 'mucuri', nome: 'Teófilo Otoni', micro: 'Teófilo Otoni' }],
  ['3170305', { meso: 'mucuri', nome: 'Umburatiba', micro: 'Nanuque' }],
]);

/**
 * Normaliza nome de município para comparar: sem acento, sem caixa, sem
 * espaço sobrando. "Araçuaí" e "ARACUAI" têm de bater.
 *
 * NFD + descarte da categoria Mn é o mesmo algoritmo do `norm()` que gerou a
 * tabela a partir do Python — os dois lados precisam concordar, senão o
 * casamento por nome falha justo nos municípios acentuados, que aqui são a
 * maioria.
 */
export function normalizarNome(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .trim()
    .toLowerCase();
}

/**
 * Índice nome normalizado → mesorregião, DERIVADO da tabela acima em vez de
 * escrito à mão. Uma tabela só para manter: acrescentar um município na de
 * cima já o torna alcançável pelos dois caminhos.
 *
 * ⚠️ Colisão de nome entre os dois vales seria um bug silencioso (o segundo
 * sobrescreveria o primeiro e áreas iriam para a mesorregião errada), então
 * ela é detectada na construção e vira aviso — não há nenhuma hoje, e o teste
 * `mesorregioes.test.mjs` garante que continue assim.
 */
const POR_NOME = (() => {
  const idx = new Map();
  for (const [codigo, m] of MUNICIPIOS_DOS_VALES) {
    const chave = normalizarNome(m.nome);
    const antes = idx.get(chave);
    if (antes && antes.meso !== m.meso) {
      console.warn(`[mesorregioes] "${m.nome}" existe nas duas mesorregiões (${antes.meso} e ${m.meso}) — casamento por nome é ambíguo para ${codigo}.`);
    }
    idx.set(chave, m);
  }
  return idx;
})();

/**
 * Descobre a mesorregião de UMA área, pelas propriedades do GeoJSON.
 *
 * Ordem: `codigo_ibge` primeiro, `municipio` depois. O código é identificador
 * e o nome é texto — nome muda de grafia entre fontes ("Aracuaí", "ARAÇUAÍ",
 * "Araçuai") e o código não muda nunca. Medido nas camadas de hoje: as duas
 * maiores fontes mistas (`vazio-cadastral-vales`, 325 áreas, e
 * `embargos-ambientais-vales`, 797) trazem `codigo_ibge` em 100% das áreas;
 * `spu-imoveis-uniao-vales` (154) não traz código nenhum, só o nome — e os 22
 * nomes distintos dela casaram todos por este caminho.
 *
 * @param {object} props  `feature.properties`
 * @returns {'jequitinhonha'|'mucuri'|null} `null` = **não sei**, jamais "não é"
 */
export function mesorregiaoDe(props) {
  if (!props) return null;

  const codigo = props.codigo_ibge != null ? String(props.codigo_ibge) : null;
  if (codigo) {
    // Código presente e conhecido decide. Código presente e DESCONHECIDO
    // devolve null em vez de cair no nome: um código fora das duas tabelas diz
    // que a área não é dos Vales (é o caso das camadas da bacia, que também
    // trazem `codigo_ibge`), e insistir no nome só criaria um falso positivo.
    return MUNICIPIOS_DOS_VALES.get(codigo)?.meso ?? null;
  }

  if (props.municipio) return POR_NOME.get(normalizarNome(props.municipio))?.meso ?? null;

  return null;
}
