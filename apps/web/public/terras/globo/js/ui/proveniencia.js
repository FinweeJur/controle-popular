/**
 * proveniencia.js — "de onde vêm estes dados", em HTML.
 *
 * Lê `GET /terras/globo/dados/proveniencia.json` (arquivo estático — era
 * `GET /api/v1/proveniencia` no backend FastAPI original, que servia o
 * manifesto gerado por `pipeline/proveniencia.py`) e monta um bloco
 * recolhível para a ficha da área. Compartilhado entre o inspetor do globo
 * e a vista de perto (`/terras/globo/detalhe.html`) — a mesma pergunta,
 * a mesma resposta.
 *
 * Por que recolhível: a resposta honesta é comprida (dez camadas, cada uma com
 * fonte e data) e quase ninguém quer ler sempre. Mas quem quer, precisa achar
 * sem sair da tela — "fonte: um arquivo .shp" não é proveniência.
 *
 * Busca uma vez por sessão e guarda. O arquivo `proveniencia.json` não foi
 * publicado junto (é gerado por um pipeline que roda fora deste portal, sem
 * saída neste checkout) — o fetch dá 404 e o bloco diz isso em vez de sumir:
 * campo ausente sem explicação a pessoa lê como app quebrado.
 */

let cache = null; // Promise<{ok, dados|erro}> — uma busca por sessão

/**
 * Nome legível de cada camada do manifesto. As chaves são as de
 * `pipeline/proveniencia.py` — camada nova sem entrada aqui aparece com o nome
 * técnico, o que é feio mas honesto (melhor que sumir da lista).
 */
const NOMES = {
  car_sicar: 'Cadastro Ambiental Rural (CAR)',
  ide_sisema_exclusoes: 'Áreas urbanas, água, conservação e APP',
  mapbiomas_cobertura: 'Cobertura do solo (mata, pasto, eucalipto)',
  // Entrada própria, e não uma linha só com dois anos: é outro arquivo, com
  // outra data de coleta e outro SHA. Quem compara dois anos tem duas fontes,
  // e a ficha mostra as duas.
  mapbiomas_cobertura_ano_base: 'Cobertura do solo no ano de comparação',
  malha_municipal_ibge: 'Divisas dos municípios',
  sigef_publico_mg: 'Imóveis públicos certificados (SIGEF)',
  snci_publico_mg: 'Imóveis públicos certificados (SNCI)',
  sigef_privado_mg: 'Imóveis privados certificados (SIGEF)',
  snci_privado_mg: 'Imóveis privados certificados (SNCI)',
  assentamentos_mg: 'Assentamentos de reforma agrária',
  quilombolas_mg: 'Territórios quilombolas',
  spu_imoveis_uniao: 'Imóveis do governo federal (SPU)',
  sisema_areas_embargadas: 'Áreas embargadas por infração ambiental',
  // Entra como fonte porque É entrada: trocar o recorte muda o denominador de
  // todo número do projeto, e a lista de municípios tem origem e data como
  // qualquer camada.
  regioes_de_estudo: 'Quais municípios entram na conta',
};

function escapar(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** "2026-07-28T18:05:22+00:00" → "28/07/2026" */
function dataCurta(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('pt-BR');
}

export function buscarProveniencia() {
  if (!cache) {
    cache = fetch('/terras/globo/dados/proveniencia.json')
      .then(async (r) => (r.ok
        ? { ok: true, dados: await r.json() }
        : { ok: false, erro: (await r.json().catch(() => ({}))).detail || `HTTP ${r.status}` }))
      .catch((err) => ({ ok: false, erro: err.message }));
  }
  return cache;
}

/** Uma linha por camada: nome, de onde veio, quando. */
function linhaCamada(f) {
  const nome = NOMES[f.camada] ?? f.camada;
  const onde = f.obtencao === 'manual'
    ? (f.origem || f.portal || 'download manual pelo portal')
    : (f.servico || 'serviço aberto');
  const quando = dataCurta(f.mtime_utc);
  const extra = [
    // "feições" é palavra de quem faz geoprocessamento — o mesmo motivo que a
    // tirou da statusbar (ver o topo de ui/statusbar.js) vale aqui, que também
    // é texto na tela: aparece na ficha e em /app/metodo. "áreas" é o termo do
    // glossário do projeto.
    f.feicoes != null ? `${Number(f.feicoes).toLocaleString('pt-BR')} áreas` : null,
    quando,
  ].filter(Boolean).join(' · ');
  return `<li><strong>${escapar(nome)}</strong><span>${escapar(onde)}</span>${
    extra ? `<span class="prov-extra">${escapar(extra)}</span>` : ''}</li>`;
}

/**
 * Monta o bloco. Devolve string de HTML — quem chama decide onde encaixar.
 * @param {object} resultado o que `buscarProveniencia()` resolveu
 */
export function blocoProveniencia(resultado) {
  if (!resultado?.ok) {
    return `<details class="prov">
      <summary>De onde vêm estes dados</summary>
      <p class="prov-vazio">${escapar(resultado?.erro || 'não foi possível carregar o manifesto')}</p>
    </details>`;
  }
  const d = resultado.dados;
  const fontes = [...(d.fontes_automaticas ?? []), ...(d.fontes_manuais ?? [])];
  const gerado = dataCurta(d.gerado_em_utc);
  return `<details class="prov">
    <summary>De onde vêm estes dados${gerado ? ` · ${gerado}` : ''}</summary>
    ${d.aviso ? `<p class="prov-aviso">${escapar(d.aviso)}</p>` : ''}
    <ul class="prov-lista">${fontes.map(linhaCamada).join('')}</ul>
    ${d.lacuna_principal ? `<p class="prov-lacuna"><strong>O que falta:</strong> ${escapar(d.lacuna_principal)}</p>` : ''}
  </details>`;
}

/** Busca e injeta o bloco num elemento, sem travar quem chamou. */
export function injetarProveniencia(el) {
  if (!el) return;
  buscarProveniencia().then((r) => { el.innerHTML = blocoProveniencia(r); });
}
