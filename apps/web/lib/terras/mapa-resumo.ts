import { lerGeoJSON } from "./camadas";

/**
 * Contagens medidas nas camadas do globo 3D, para o hub `/funcaosocialterra`
 * dizer O QUE EXISTE no mapa hoje — não o que existia quando a frente era só
 * vazio cadastral em três cidades.
 *
 * ═══ POR QUE ISTO EXISTE ═══
 *
 * `lib/zonas.ts` registra a MESMA lição sobre este card duas vezes seguidas
 * (ver os comentários "⟲ 13/08" ali): a etiqueta ficou estadual e o texto
 * continuou falando de um vale, e depois a taxa de erro apareceu digitada à
 * mão no mesmo card. O padrão dos dois defeitos é igual — número ou fato que
 * devia vir de contagem, escrito à mão, envelhecendo em silêncio. Este
 * módulo é a versão "contagem" para o hub da frente: cada estatística sai de
 * `.length` sobre o GeoJSON publicado, nunca de um literal na página.
 *
 * Cada camada é contada pelo PRÓPRIO arquivo que a alimenta — não existe
 * concentração de "todas as camadas" num índice central para reaproveitar
 * (o globo não expõe isso fora do próprio `config.js`, que este projeto não
 * importa: é JS de navegador, sem `fs`, feito para rodar sem build step).
 */
export interface ResumoMapaEstadual {
  terrasIndigenas: number;
  unidadesConservacao: number;
  barragensComManchaPublicada: number;
  sigmineOperacao: number;
  sigmineInteresse: number;
  cfemMunicipios: number;
  cruzamentoDinheiroEmpresas: number;
  cruzamentoDinheiroCobertura: string;
  territoriosQuilombolas: number;
}

export function carregarResumoMapaEstadual(): ResumoMapaEstadual {
  const terrasIndigenas = lerGeoJSON<unknown>("terras-indigenas.geojson").features.length;
  const unidadesConservacao = lerGeoJSON<unknown>("unidades-conservacao.geojson").features.length;
  const barragensComManchaPublicada = lerGeoJSON<unknown>(
    "mancha-inundacao-barragens.geojson.gz"
  ).features.length;
  const sigmineOperacao = lerGeoJSON<unknown>("sigmine-operacao.geojson").features.length;
  const sigmineInteresse = lerGeoJSON<unknown>("sigmine-interesse.geojson.gz").features.length;
  const cfemMunicipios = lerGeoJSON<unknown>("cfem-municipios.geojson").features.length;

  const cruzamento = lerGeoJSON<{ aviso_cobertura?: string }>(
    "cruzamento-dinheiro-ambiental-4cidades.geojson"
  );
  // ⟲ 13/08, fim do dia: era a SOMA de duas fontes (bacia + Vales) e virou
  // leitura de uma só. As três camadas de território quilombola foram
  // unificadas — o dono perguntou "qual o sentido de dividir?" e a divisão
  // era por região, critério que o painel do globo já havia abandonado de
  // manhã ao passar a agrupar por assunto. Somar arquivos aqui era o
  // sintoma: número de tela que precisa de aritmética para existir é sinal
  // de que o dado está partido no lugar errado.
  const territoriosQuilombolas = lerGeoJSON<unknown>(
    "territorios-quilombolas.geojson"
  ).features.length;

  return {
    terrasIndigenas,
    unidadesConservacao,
    barragensComManchaPublicada,
    sigmineOperacao,
    sigmineInteresse,
    cfemMunicipios,
    cruzamentoDinheiroEmpresas: cruzamento.features.length,
    cruzamentoDinheiroCobertura: cruzamento.features[0]?.properties.aviso_cobertura ?? "",
    territoriosQuilombolas,
  };
}
