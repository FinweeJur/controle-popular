/**
 * pontos.js — tamanho de ponto de camada `render: 'point'` em pixels.
 *
 * Separado de geojson3d.js (que importa three.js e não roda sob
 * `node --test`) para a conversão ter teste: é ela que decide o que o
 * usuário vê na tela.
 *
 * ⚠️ Por que existe: o `pointSize` do LAYER_REGISTRY nasceu calibrado em
 * RADIANOS (unidades de mundo do globo unitário), e
 * `THREE.PointsMaterial` com `sizeAttenuation: true` usa exatamente essa
 * unidade — 0,006 rad sobre a esfera R=1 são ~38 km. No zoom da bacia,
 * cada imóvel da União virava um QUADRADO GIGANTE (o cliente reportou em
 * 15/08/2026), e "delimitado errado" quando o dado é ponto de localização,
 * não contorno.
 *
 * A regra: valor < 1 é leitura de radiano → converte para pixels (×1000);
 * valor ≥ 1 já é pixel e passa direto. Os pointSize reais do registro
 * (0,005–0,007) viram pontos de 5–7 px — e o clique não depende do tamanho
 * visual (o inspetor acerta por tolerância de 14 px, ver
 * `pontoMaisProximo` em ui/inspector.js).
 */
export function tamanhoDePontoEmPx(size) {
  const n = Number(size);
  if (!Number.isFinite(n) || n <= 0) return 5;
  return n < 1 ? Math.round(n * 1000) : n;
}