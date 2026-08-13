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
 * Busca uma vez por sessão e guarda.
 *
 * ⟲ O arquivo passou a existir em 12/08. Antes ele simplesmente não era
 * publicado — era gerado por `pipeline/proveniencia.py`, no repositório
 * `terras-devolutas`, e a saída nunca vinha junto com as camadas. O fetch dava
 * 404 e este bloco exibia "HTTP 404" na ficha de TODA área, num portal cuja
 * tese é procedência de dado. Pior: `ui/statusbar.js` lê `gerado_em_utc` daqui
 * para escrever o selo "dados de …", então o selo caía para sempre na
 * constante `DADOS_DE` e anunciava 28/07 sobre camadas de agosto.
 *
 * Agora o manifesto é gerado por `scripts/gerar-proveniencia-globo.mjs`, que
 * MEDE os arquivos publicados (contagem, mtime, SHA) em vez de descrever as
 * entradas do pipeline — que exigem os shapefiles brutos do Acervo Fundiário,
 * atrás de conta gov.br, e não rodam nesta máquina nem no CI.
 *
 * O caminho de erro continua de pé e continua sendo o certo: se o manifesto
 * sumir de novo, o bloco DIZ o que houve em vez de desaparecer — campo ausente
 * sem explicação a pessoa lê como app quebrado.
 */

let cache = null; // Promise<{ok, dados|erro}> — uma busca por sessão

/**
 * Nome legível de cada camada do manifesto. As chaves são as de
 * `pipeline/proveniencia.py` — camada nova sem entrada aqui aparece com o nome
 * técnico, o que é feio mas honesto (melhor que sumir da lista).
 */
const NOMES = {
  // ── ids das camadas PUBLICADAS (as chaves que o manifesto do portal usa) ──
  // O manifesto passou a ser gerado por `scripts/gerar-proveniencia-globo.mjs`,
  // que descreve o que o portal publica — e não as entradas do pipeline. Os
  // nomes abaixo são os mesmos `label` do LAYER_REGISTRY, para o bloco falar a
  // língua do painel de camadas. As chaves do pipeline seguem logo abaixo,
  // intactas: se o manifesto original voltar a ser publicado um dia, os dois
  // conjuntos convivem sem conflito de nome.
  // ⚠️ Estes rótulos espelham o `label` das FONTES em config.js e não se
  // atualizam sozinhos. Os cinco "— Vales" viraram "— Jequitinhonha e Mucuri"
  // em 13/08, junto com a correção de nomenclatura: "Vales" sem sobrenome é
  // ambíguo num estado que tem Vale do Aço e Vale do Rio Doce.
  'municipios-mg': 'Divisas dos municípios',
  'vazio-cadastral-bacia': 'Terra sem cadastro — bacia do Paraopeba',
  'vazio-cadastral': 'Terra sem cadastro — só Curvelo',
  'vazio-cadastral-vales': 'Terra sem cadastro — Jequitinhonha e Mucuri',
  'terra-publica-certificada': 'Terra pública com medição oficial',
  'terra-publica-certificada-vales': 'Terra pública com medição oficial — Jequitinhonha e Mucuri',
  assentamentos: 'Assentamentos da reforma agrária',
  'assentamentos-vales': 'Assentamentos da reforma agrária — Jequitinhonha e Mucuri',
  'territorios-quilombolas': 'Territórios quilombolas',
  'territorios-quilombolas-vales': 'Territórios quilombolas — Jequitinhonha e Mucuri',
  'spu-imoveis-uniao': 'Imóveis do governo federal',
  'spu-imoveis-uniao-vales': 'Imóveis do governo federal — Jequitinhonha e Mucuri',
  'embargos-ambientais-vales': 'Áreas embargadas por infração ambiental',
  'lotes-vagos-bh': 'Lotes vagos em Belo Horizonte',
  'normas-geolocalizadas': 'Leis e decretos com lugar citado',
  'checagem-g0': 'Amostra em conferência',
  'devolutas-arrecadadas': 'Terras devolutas já reconhecidas',
  'pesquisa-noticias': 'Lugares abandonados na imprensa',

  // ── chaves do pipeline original (`pipeline/proveniencia.py`) ──
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
