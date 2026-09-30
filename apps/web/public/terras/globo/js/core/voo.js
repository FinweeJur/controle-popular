// core/voo.js — deep link "voe até aqui" do globo 3D.
//
// Contrato congelado:
//   vooDoEndereco(search) -> { lat, lon, nome, ctx, distance } | null
//   enderecoVoarAte({ lat, lon, nome, ctx, distancia }) -> string
//
// O que é: qualquer página do portal (Mística do Dia, linha do tempo, tabelas de
// mineração e comunidades) pode publicar um botão "Voe até aqui". O botão manda o
// leitor para o globo com um ponto no endereço, e o globo voa até lá e abre a
// ficha de contexto daquele lugar.
//
// Formato do endereço:
//   /terras/globo/?voe=<lat>,<lon>&nome=<texto>&ctx=<slug>&z=<distância>
//
//   • voe  — obrigatório; latitude e longitude em graus decimais, separados por
//            vírgula (ex.: -20.3856,-43.5036). Fora da faixa válida, o link é
//            ignorado (melhor abrir o globo no padrão do que voar para o oceano).
//   • nome — rótulo humano do ponto ("Ouro Preto/MG"), só exibição.
//   • ctx  — slug do contexto publicado em `dados/contextos-lugares.json`; é o
//            texto histórico/educativo que a ficha mostra ao chegar.
//   • z    — distância opcional AO CENTRO DA TERRA (1 = superfície). Omitida, o
//            chamador usa o padrão de município. Não é altitude: ver core/flyto.js.
//
// Por que um módulo puro, e não dentro de main.js: o parsing é o que pode mentir
// (ponto inválido virando voo), então ele tem teste próprio.

const LAT_MIN = -90;
const LAT_MAX = 90;
const LON_MIN = -180;
const LON_MAX = 180;

/** Distância padrão ao centro da Terra quando o endereço não traz `z`. */
export const DISTANCIA_VOO_PADRAO = 1.03;

/** Máximo de caracteres do rótulo — evita URL gigante virando texto na ficha. */
const NOME_MAX = 120;

function numero(valor) {
  if (valor == null || valor === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

/**
 * Lê o endereço (a string `location.search`) e devolve o ponto do voo, ou null
 * quando não há `voe` válido.
 */
export function vooDoEndereco(search) {
  let params;
  try {
    params = new URLSearchParams(search ?? '');
  } catch {
    return null;
  }

  const bruto = params.get('voe');
  if (!bruto) return null;

  const partes = bruto.split(',');
  if (partes.length !== 2) return null;

  const lat = numero(partes[0]);
  const lon = numero(partes[1]);
  if (lat == null || lon == null) return null;
  if (lat < LAT_MIN || lat > LAT_MAX) return null;
  if (lon < LON_MIN || lon > LON_MAX) return null;

  const nome = (params.get('nome') ?? '').trim().slice(0, NOME_MAX) || null;

  const ctxBruto = (params.get('ctx') ?? '').trim();
  const ctx = /^[a-z0-9-]{1,60}$/.test(ctxBruto) ? ctxBruto : null;

  const z = numero(params.get('z'));
  // `z` só vale se for distância plausível (acima da superfície e dentro da
  // faixa que os controles aceitam); fora disso, cai no padrão.
  const distance = z != null && z > 1 && z <= 9 ? z : undefined;

  return { lat, lon, nome, ctx, distance };
}

/** Monta o endereço do botão. Contraparte de `vooDoEndereco`. */
export function enderecoVoarAte({ lat, lon, nome, ctx, distancia, base = '/terras/globo/' } = {}) {
  const p = new URLSearchParams();
  p.set('voe', `${lat},${lon}`);
  if (nome) p.set('nome', String(nome).slice(0, NOME_MAX));
  if (ctx) p.set('ctx', ctx);
  if (distancia) p.set('z', String(distancia));
  return `${base}?${p.toString()}`;
}
