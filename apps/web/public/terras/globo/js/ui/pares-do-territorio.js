/**
 * pares-do-territorio.js — os empreendimentos da faixa de 8 km de UM
 * território, para a ficha do clique (15/08/2026).
 *
 * O pedido que criou isto: o texto sob a camada "Mina em operação na
 * faixa de 8 km do território" resume o conjunto (328 pares, 289
 * processos, 12 terras indígenas e 18 quilombos) — mas quem clica numa
 * ÁREA específica quer saber QUAL empreendimento está na faixa DAQUELE
 * território. O dado já era por par no arquivo (uma feição por
 * processo×faixa, com `territorio_nome` e `sigmine_nome`); faltava cruzar
 * o nome do território clicado com as feições do raio.
 *
 * O cruzamento é por nome NORMALIZADO (maiúsculas, sem acento, sem
 * pontuação). Medido no arquivo em 15/08/2026: 28 dos 30 nomes do raio
 * casam com `terras-indigenas.geojson` + `territorios-quilombolas.geojson`
 * assim; os 2 que não casam são "FAMILIA TEODORO DE OLIVEIRA E VENTURA"
 * (não tem polígono no mapa — o nome dele não existe nos dois arquivos) e
 * "NOGUEIRA" (no mapa se chama "TQ Nogueira"). Igualdade estrita de
 * propósito: substring casaria "QUILOMBO" com "QUILOMBO SANTA HELENA" e
 * inventaria par que não existe.
 */

import { escapar } from './rotulos.js';

/** Maiúsculas, sem acento, sem pontuação — "SÃO SEBASTIÃO" === "Sao Sebastiao". */
export function normalizarNome(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function numeroOuNada(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Distância em metros, na régua de quem anda na rua: km com 1 casa, senão m. */
function formatarDistancia(m) {
  const n = numeroOuNada(m);
  if (n === null) return 'não medida';
  if (n < 1000) return `${Math.round(n).toLocaleString('pt-BR')} m`;
  return `${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
}

/**
 * Os pares processo×faixa de UM território, ordenados do mais próximo ao
 * mais longe (quem não tem distância medida fica no fim, em ordem de nome
 * — distância ausente não é zero, nem deve fingir que é).
 *
 * @param {object} fc   FeatureCollection do raio (alerta-raio-territorio-sigmine-operacao)
 * @param {string} nome nome do território clicado (properties.nome da feição)
 * @returns {object[]} properties dos pares, ordenadas
 */
export function paresDoTerritorio(fc, nome) {
  const alvo = normalizarNome(nome);
  if (!alvo) return [];
  return (fc?.features ?? [])
    .map((f) => f.properties ?? {})
    .filter((p) => normalizarNome(p.territorio_nome) === alvo)
    .sort((a, b) => {
      const da = numeroOuNada(a.distancia_ao_territorio_m);
      const db = numeroOuNada(b.distancia_ao_territorio_m);
      if (da != null && db != null) return da - db;
      if (da == null && db == null) {
        return String(a.sigmine_nome ?? '').localeCompare(String(b.sigmine_nome ?? ''));
      }
      return da == null ? 1 : -1;
    });
}

/**
 * HTML da seção "Na faixa de 8 km" da ficha do território.
 *
 * Sai SEMPRE (inclusive com 0 pares): "nenhum processo na faixa" é
 * informação — o contrário seria a ficha calar a pergunta que a pessoa
 * veio fazer. Quem monta o HTML é esta função, com `escapar()` em todo
 * texto externo (os nomes vêm do SIGMINE).
 */
export function secaoDePares(pares) {
  const n = pares.length;
  const itens = n
    ? `<ul>${pares.map((p) => {
      const encosta = p.ja_sobrepoe_territorio_publicado
        ? ' <span class="pares-encosta">encosta no território</span>'
        : '';
      const subs = p.sigmine_subs ? `${escapar(p.sigmine_subs)} · ` : '';
      const processo = p.sigmine_processo ? `processo ${escapar(p.sigmine_processo)}` : 'processo não identificado';
      return `<li><strong>${escapar(p.sigmine_nome ?? 'empreendedor não identificado')}</strong>${encosta}<br>
        ${subs}${escapar(processo)} · a ${escapar(formatarDistancia(p.distancia_ao_territorio_m))} do território</li>`;
    }).join('')}</ul>`
    : '<p class="inspector-pares-vazio">Nenhum processo de mina em operação na faixa deste território.</p>';
  return `<div class="inspector-pares">
    <strong>Na faixa de 8 km (${n})</strong>
    ${itens}
    <p class="inspector-pares-nota">Distância entre a borda do processo e o território, na faixa publicada pelo IDE-Sisema. Estar na faixa não é estar dentro do território: é a distância em que a Portaria Interministerial 60/2015 exige manifestação do órgão indigenista. Quem confirma o dado é a ANM e o órgão indigenista.</p>
  </div>`;
}