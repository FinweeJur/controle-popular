/**
 * pontosuperficie.js — um ponto GARANTIDO dentro de um polígono, mesmo quando
 * ele é fino, sinuoso ou tem furos.
 *
 * Existe porque 839 áreas em quatro camadas (assentamentos, territórios
 * quilombolas, terra pública certificada, embargos ambientais — e as irmãs
 * `-vales` de cada uma) chegam ao navegador SEM `ponto_lat`/`ponto_lon`: o
 * pipeline que gera essas camadas não calcula o ponto, só o polígono. Sem
 * este módulo, `coordenadasDaArea()` (rotulos.js) devolve `null` para essas
 * 839 áreas e a ficha perde os dois botões de copiar, calada — o defeito que
 * este arquivo resolve.
 *
 * ⚠️ NÃO é um centroide. O centroide de um polígono côncavo pode cair FORA
 * dele — e boa parte dos polígonos deste projeto são redes de corredores
 * finos e sinuosos (há um, na camada `vazio-cadastral-bacia`, com
 * compacidade 0,008: 218 m de largura média espalhados por 1.967 ha). A
 * ficha afirma, em texto, que "o ponto fica DENTRO da área" — essa frase
 * vai para ofício e pedido de acesso à informação, e um ponto fora da área
 * a tornaria falsa. Por isso o algoritmo aqui é de busca: parte da caixa
 * envolvente do polígono, divide em células cada vez menores e guarda a
 * célula cujo centro está mais longe do contorno (dentro), descartando ramos
 * que matematicamente não podem superar o melhor já achado. É a mesma ideia
 * por trás do que a cartografia chama de "polo de inacessibilidade" — o
 * ponto mais distante de qualquer fronteira, e por isso o mais "no meio" que
 * uma forma irregular permite.
 *
 * Roda em espaço lon/lat tratado como plano, sem projeção — a mesma
 * simplificação que `ui/inspector.js` já faz no teste ponto-em-polígono do
 * clique (`pontoEmPoligono`). Na escala de um município ou de uma bacia
 * hidrográfica o erro disso é desprezível, e evitar projeção é o que mantém
 * este módulo sem dependência: não há bundler neste app (ver CLAUDE.md).
 *
 * Medido contra as 970 áreas reais que hoje faltam ponto (bench em
 * scripts/, não versionado): 0,5 ms em média, 28 ms no pior caso (um
 * polígono de 888 vértices). Mesmo o corredor mais extremo do dado inteiro
 * (1.104 vértices, compacidade 0,008, que já tem ponto pelo pipeline e por
 * isso nunca passa por aqui) fica em 113 ms. Executa uma vez por clique, não
 * por quadro — não há orçamento de frame para respeitar.
 */

/** Menor distância ao quadrado de um ponto a um segmento [ax,ay]–[bx,by]. */
function distSqAoSegmento(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) {
    const ddx = px - ax;
    const ddy = py - ay;
    return ddx * ddx + ddy * ddy;
  }
  let t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  const ddx = px - cx;
  const ddy = py - cy;
  return ddx * ddx + ddy * ddy;
}

/**
 * Ponto dentro de um anel (ray casting). Mesmo algoritmo de
 * `inspector.js` → `pontoEmPoligono`, repetido aqui — e não importado de lá —
 * porque aquele arquivo depende de Three.js e este precisa continuar puro
 * para rodar em `node --test` sem navegador nenhum.
 */
function pontoDentroDoAnel(px, py, anel) {
  let dentro = false;
  for (let i = 0, n = anel.length, j = n - 1; i < n; j = i++) {
    const [xi, yi] = anel[i];
    const [xj, yj] = anel[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

function distanciaMinimaAoAnel(px, py, anel) {
  let menorSq = Infinity;
  for (let i = 0, n = anel.length, j = n - 1; i < n; j = i++) {
    const d = distSqAoSegmento(px, py, anel[j][0], anel[j][1], anel[i][0], anel[i][1]);
    if (d < menorSq) menorSq = d;
  }
  return Math.sqrt(menorSq);
}

/**
 * Distância com sinal ao contorno efetivo do polígono (anel externo menos
 * furos): positiva quando o ponto está dentro do externo e fora de todo
 * furo, negativa quando não.
 *
 * Testa cada anel separadamente (dentro do externo E/OU dentro de cada
 * furo), e não um único ray-casting acumulado sobre todos os anéis juntos —
 * mesma escolha de `inspector.js` → `pontoEmPoligono`. Um XOR acumulado
 * também funciona, mas só se todo furo respeitar a orientação oposta ao
 * externo (regra do GeoJSON que nem toda fonte segue à risca); testar anel a
 * anel não depende disso.
 */
function distanciaAoContorno(px, py, aneis) {
  const externo = aneis[0];
  if (!externo?.length) return -Infinity;
  const furos = aneis.slice(1);
  const dentro = pontoDentroDoAnel(px, py, externo) && !furos.some((f) => pontoDentroDoAnel(px, py, f));
  let menor = distanciaMinimaAoAnel(px, py, externo);
  for (const f of furos) menor = Math.min(menor, distanciaMinimaAoAnel(px, py, f));
  return (dentro ? 1 : -1) * menor;
}

/** Fila de prioridade (heap binário) por `.max` — a única operação que este
 * módulo precisa dela. Existe para não varrer a fila inteira a cada passo:
 * com dezenas de milhares de células nos polígonos maiores, uma busca linear
 * pelo maior elemento a cada iteração custaria O(n²). */
class FilaPrioridade {
  constructor() { this.itens = []; }
  get tamanho() { return this.itens.length; }
  inserir(item) {
    const a = this.itens;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const pai = (i - 1) >> 1;
      if (a[pai].max >= a[i].max) break;
      [a[pai], a[i]] = [a[i], a[pai]];
      i = pai;
    }
  }
  remover() {
    const a = this.itens;
    const topo = a[0];
    const ultimo = a.pop();
    if (a.length) {
      a[0] = ultimo;
      let i = 0;
      for (;;) {
        const e = 2 * i + 1;
        const d = 2 * i + 2;
        let maior = i;
        if (e < a.length && a[e].max > a[maior].max) maior = e;
        if (d < a.length && a[d].max > a[maior].max) maior = d;
        if (maior === i) break;
        [a[i], a[maior]] = [a[maior], a[i]];
        i = maior;
      }
    }
    return topo;
  }
}

/** Uma célula quadrada da busca: centro (x,y), meia-largura `h`, distância
 * `d` do centro ao contorno, e `max` = o melhor `d` que QUALQUER ponto desta
 * célula poderia ter (cota superior — nenhum ponto dentro dela fica mais
 * longe do contorno do que o próprio centro mais a diagonal até a quina). */
function criarCelula(x, y, h, aneis) {
  const d = distanciaAoContorno(x, y, aneis);
  return { x, y, h, d, max: d + h * Math.SQRT2 };
}

/** Graus decimais ≈ 1 metro em Minas Gerais (cos(lat) não muda isso o
 * bastante para importar num ponto de referência, não numa medição). */
const PRECISAO_PADRAO = 1e-5;

/** Válvula de segurança: nenhum polígono real deste dado passa de 2.770
 * células processadas — o pior caso medido é `municipios-mg` #188 (script de
 * medição em scratchpad, não versionado: reproduz o algoritmo abaixo com um
 * contador de células e roda sobre todo `dados/camadas/*.geojson`, filtrando
 * pelas feições que de fato CHEGAM aqui — as que não têm `ponto_lat`/
 * `ponto_lon` da fonte). Cem mil é folga de 36× sobre esse pior caso, para uma
 * geometria malformada não travar a aba — se bater no teto MESMO ASSIM, devolve
 * o melhor achado até ali (que já está estritamente dentro da área) e avisa no
 * console: nunca disparou até hoje, mas teto que estoura calado é o defeito
 * que este projeto trata como grave, e a folga de hoje não é garantia do
 * próximo dado que entrar. */
const LIMITE_CELULAS = 100_000;

/**
 * O polo de inacessibilidade de UM polígono (anel externo + furos, todos no
 * formato `[[lon,lat], ...]` do GeoJSON).
 * @returns {{lat: number, lon: number, raio: number} | null} `raio` é a
 *   distância (em graus) do ponto ao contorno mais próximo — quanto maior,
 *   mais "no meio" da forma. `null` se o polígono for degenerado (menos de
 *   3 vértices, ou caixa envolvente sem área).
 */
function poloDeUmAnel(aneis, precisao) {
  const externo = aneis[0];
  if (!externo || externo.length < 3) return null;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of externo) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const largura = maxX - minX;
  const altura = maxY - minY;
  if (!(largura > 0) || !(altura > 0)) return null; // ponto, linha, ou vazio

  const tamanho = Math.min(largura, altura);
  const h0 = tamanho / 2;
  const fila = new FilaPrioridade();
  for (let x = minX; x < maxX; x += tamanho) {
    for (let y = minY; y < maxY; y += tamanho) {
      fila.inserir(criarCelula(x + h0, y + h0, h0, aneis));
    }
  }
  // Chute inicial: o centro da caixa envolvente. Pode cair fora do polígono
  // (é só um chute) — o que importa é `melhor.d`, que a busca só substitui
  // por algo estritamente maior, então um chute ruim nunca sobrevive.
  let melhor = criarCelula(minX + largura / 2, minY + altura / 2, 0, aneis);

  let processadas = 0;
  while (fila.tamanho && processadas++ < LIMITE_CELULAS) {
    const atual = fila.remover();
    if (atual.d > melhor.d) melhor = atual;
    // Poda: mesmo na melhor hipótese, esta célula não bate o recorde por
    // mais que a precisão pedida — subdividir não vale o custo.
    if (atual.max - melhor.d <= precisao) continue;
    const h = atual.h / 2;
    fila.inserir(criarCelula(atual.x - h, atual.y - h, h, aneis));
    fila.inserir(criarCelula(atual.x + h, atual.y - h, h, aneis));
    fila.inserir(criarCelula(atual.x - h, atual.y + h, h, aneis));
    fila.inserir(criarCelula(atual.x + h, atual.y + h, h, aneis));
  }
  // Se ainda sobrou célula na fila, o laço não saiu por convergir — saiu por
  // estourar LIMITE_CELULAS. O ponto devolvido abaixo continua garantidamente
  // dentro da área (é a mesma condição de sempre), só não é mais o polo exato
  // dentro da precisão pedida. Teto que devolve calado é o defeito que este
  // projeto trata como grave (ver comentário de LIMITE_CELULAS) — nunca
  // disparou nos dados de hoje, e é exatamente por isso que precisa do aviso:
  // se disparar amanhã, é a primeira vez, e ninguém vai estar procurando.
  if (fila.tamanho) {
    console.warn(
      `pontoNaSuperficie: estourou o limite de ${LIMITE_CELULAS.toLocaleString('pt-BR')} `
      + 'células processadas num polígono. Devolvendo o melhor ponto encontrado até aqui '
      + '— ainda dentro da área, mas não necessariamente o polo de inacessibilidade exato.',
    );
  }
  // `melhor.d <= 0` só acontece se NENHUMA célula caiu dentro do polígono —
  // possível num polígono absurdamente fino (mais fino que a precisão
  // pedida). Devolver um ponto fora seria pior que não devolver nada.
  if (!(melhor.d > 0)) return null;
  return { lat: melhor.y, lon: melhor.x, raio: melhor.d };
}

/**
 * Ponto garantido dentro de uma geometria GeoJSON (`Polygon` ou
 * `MultiPolygon`). `null` para qualquer outro tipo — inclusive `Point`, que
 * não tem "dentro": quando a fonte é um ponto sem coordenada, não há
 * geometria nenhuma para calcular a partir dela, e o chamador precisa saber
 * disso, não receber um substituto.
 *
 * Num `MultiPolygon` (parte de terra em pedaços separados), calcula o polo de
 * cada parte e fica com o de MAIOR raio — a parte "mais gorda" da área. Não
 * é a parte de maior área: um pedaço grande e fino pode ter um interior mais
 * apertado que um pedaço pequeno e redondo, e o que este módulo garante é
 * "dentro, longe da borda", não "no pedaço maior".
 */
export function pontoNaSuperficie(geometry, precisao = PRECISAO_PADRAO) {
  const partes =
    geometry?.type === 'Polygon' ? [geometry.coordinates]
    : geometry?.type === 'MultiPolygon' ? geometry.coordinates
    : null;
  if (!partes?.length) return null;

  let melhor = null;
  for (const aneis of partes) {
    if (!aneis?.[0]?.length) continue;
    const r = poloDeUmAnel(aneis, precisao);
    if (r && (!melhor || r.raio > melhor.raio)) melhor = r;
  }
  return melhor ? { lat: melhor.lat, lon: melhor.lon } : null;
}
